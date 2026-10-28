import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  containsUserIdentifier,
  emailLocalPart,
} from "@app/shared";
import { PrismaService } from "../prisma/prisma.service";
import { MailerService } from "../mailer/mailer.service";

const SALT_ROUNDS = 12;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 30;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  async register(input: RegisterInput, userAgent?: string) {
    const existing = await this.prisma.profile.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("E-mail já cadastrado");
    }
    if (containsUserIdentifier(input.password, [input.name, emailLocalPart(input.email)])) {
      throw new BadRequestException("A senha não pode conter seu nome ou e-mail");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const profile = await this.prisma.profile.create({
      data: { name: input.name, email: input.email, passwordHash },
    });

    await this.issueAndSendVerificationEmail(profile.id, profile.email, profile.name);

    return this.issueTokenPair(profile.id, profile.email, profile.name, userAgent);
  }

  async login(input: LoginInput, userAgent?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { email: input.email },
    });
    if (!profile) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const valid = await bcrypt.compare(input.password, profile.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return this.issueTokenPair(profile.id, profile.email, profile.name, userAgent);
  }

  // Rotação: o refresh token usado é sempre revogado, mesmo quando
  // válido — um reuso dele depois disso só pode acontecer se alguém
  // mais tiver copiado o token, e nesse caso a família inteira é
  // revogada (ver abaixo), não só o token reusado.
  async refresh(rawToken: string, userAgent?: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });

    if (!stored || stored.revokedAt) {
      if (stored?.revokedAt) {
        // Token já revogado sendo reapresentado — sinal de token
        // vazado/roubado. Revoga todos os refresh tokens ativos do
        // usuário, forçando login de novo em qualquer sessão.
        await this.prisma.refreshToken.updateMany({
          where: { profileId: stored.profileId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException("Sessão inválida, faça login novamente");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Sessão expirada, faça login novamente");
    }

    const profile = await this.prisma.profile.findUnique({ where: { id: stored.profileId } });
    if (!profile) {
      throw new UnauthorizedException("Sessão inválida, faça login novamente");
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokenPair(profile.id, profile.email, profile.name, userAgent);
  }

  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // "Sessões ativas" pro usuário — cada refresh token não revogado e
  // não expirado é uma sessão (dispositivo/navegador) distinta, já
  // que o token é rotacionado a cada refresh mas mantém o mesmo
  // registro de sessão até logout/expirar.
  async listSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { profileId: userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findUnique({ where: { id: sessionId } });
    if (!session || session.profileId !== userId) {
      throw new NotFoundException("Sessão não encontrada");
    }
    await this.prisma.refreshToken.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async verifyEmail(rawToken: string) {
    const stored = await this.consumeVerificationToken(rawToken, "VERIFICACAO_EMAIL");
    await this.prisma.profile.update({ where: { id: stored.profileId }, data: { emailVerifiedAt: new Date() } });
  }

  async resendVerification(userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { id: userId } });
    if (profile.emailVerifiedAt) {
      throw new BadRequestException("Este e-mail já foi verificado");
    }
    await this.issueAndSendVerificationEmail(profile.id, profile.email, profile.name);
  }

  // Sempre responde com sucesso, exista ou não o e-mail — senão a
  // resposta da API vira um jeito de descobrir quais e-mails têm
  // conta no app.
  async forgotPassword(input: ForgotPasswordInput) {
    const profile = await this.prisma.profile.findUnique({ where: { email: input.email } });
    if (!profile) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    await this.prisma.verificationToken.create({
      data: {
        profileId: profile.id,
        tokenHash: this.hashToken(rawToken),
        type: "REDEFINICAO_SENHA",
        expiresAt,
      },
    });

    const webUrl = this.config.get<string>("WEB_URL") ?? "http://localhost:3000";
    await this.mailer.sendPasswordResetEmail(
      profile.email,
      profile.name,
      `${webUrl}/redefinir-senha?token=${rawToken}`,
    );
  }

  async resetPassword(input: ResetPasswordInput) {
    const stored = await this.consumeVerificationToken(input.token, "REDEFINICAO_SENHA");
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { id: stored.profileId } });
    if (containsUserIdentifier(input.newPassword, [profile.name, emailLocalPart(profile.email)])) {
      throw new BadRequestException("A senha não pode conter seu nome ou e-mail");
    }
    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await this.prisma.profile.update({ where: { id: stored.profileId }, data: { passwordHash } });

    // Redefinir a senha encerra toda sessão ativa — se foi um
    // invasor que pediu o reset, isso corta o acesso dele também;
    // se foi o dono da conta, é só logar de novo.
    await this.prisma.refreshToken.updateMany({
      where: { profileId: stored.profileId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueAndSendVerificationEmail(profileId: string, email: string, name: string) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
    await this.prisma.verificationToken.create({
      data: {
        profileId,
        tokenHash: this.hashToken(rawToken),
        type: "VERIFICACAO_EMAIL",
        expiresAt,
      },
    });

    const webUrl = this.config.get<string>("WEB_URL") ?? "http://localhost:3000";
    await this.mailer.sendVerificationEmail(email, name, `${webUrl}/verificar-email?token=${rawToken}`);
  }

  private async consumeVerificationToken(rawToken: string, type: "VERIFICACAO_EMAIL" | "REDEFINICAO_SENHA") {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.verificationToken.findFirst({ where: { tokenHash, type } });

    if (!stored || stored.usedAt) {
      throw new BadRequestException("Link inválido ou já usado");
    }
    if (stored.expiresAt < new Date()) {
      throw new BadRequestException("Link expirado, peça um novo");
    }

    await this.prisma.verificationToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } });
    return stored;
  }

  private async issueTokenPair(id: string, email: string, name: string, userAgent?: string) {
    const accessToken = this.jwt.sign({ sub: id, email });

    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const ttlDays = Number(this.config.get("REFRESH_TOKEN_TTL_DAYS") ?? DEFAULT_REFRESH_TOKEN_TTL_DAYS);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        profileId: id,
        tokenHash: this.hashToken(rawRefreshToken),
        expiresAt,
        userAgent: userAgent?.slice(0, 255),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      profile: { id, name, email },
    };
  }

  private hashToken(rawToken: string) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }
}
