import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

// Registro e login: senha nunca sai em texto puro, e-mail duplicado é
// rejeitado, credenciais inválidas nunca revelam se o problema foi o
// e-mail ou a senha (mesma mensagem/exceção nos dois casos). Prisma e
// JwtService mockados, bcrypt real (rápido o bastante em teste).
describe("AuthService", () => {
  function buildPrisma(overrides: { existingProfile?: any } = {}) {
    return {
      profile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(overrides.existingProfile !== undefined ? overrides.existingProfile : null),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "u1", ...data })),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: "rt1" }),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      verificationToken: {
        create: jest.fn().mockResolvedValue({ id: "vt1" }),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
  }

  function buildService(prisma: any) {
    const jwt = { sign: jest.fn().mockReturnValue("signed-jwt-token") } as any;
    const config = { get: jest.fn().mockReturnValue(undefined) } as any;
    const mailer = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as any;
    const service = new AuthService(prisma as any, jwt, config, mailer);
    return { service, jwt, config, mailer };
  }

  describe("register", () => {
    it("rejeita e-mail já cadastrado", async () => {
      const prisma = buildPrisma({ existingProfile: { id: "existing", email: "a@a.com" } });
      const { service } = buildService(prisma);

      await expect(service.register({ name: "A", email: "a@a.com", password: "password123" })).rejects.toThrow(
        ConflictException,
      );
    });

    it("rejeita senha que contém o nome do usuário", async () => {
      const prisma = buildPrisma();
      const { service } = buildService(prisma);

      await expect(
        service.register({ name: "Fulano Silva", email: "novo@a.com", password: "fulanosilva99" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejeita senha que contém a parte local do e-mail", async () => {
      const prisma = buildPrisma();
      const { service } = buildService(prisma);

      await expect(
        service.register({ name: "A", email: "joaozinho@a.com", password: "joaozinho2024" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("nunca grava a senha em texto puro (hash bcrypt)", async () => {
      const prisma = buildPrisma();
      const { service } = buildService(prisma);

      await service.register({ name: "A", email: "a@a.com", password: "password123" });

      const savedHash = prisma.profile.create.mock.calls[0][0].data.passwordHash;
      expect(savedHash).not.toBe("password123");
      expect(await bcrypt.compare("password123", savedHash)).toBe(true);
    });

    it("envia o e-mail de verificação pro endereço cadastrado", async () => {
      const prisma = buildPrisma();
      const { service, mailer } = buildService(prisma);

      await service.register({ name: "A", email: "a@a.com", password: "password123" });

      expect(mailer.sendVerificationEmail).toHaveBeenCalledWith(
        "a@a.com",
        "A",
        expect.stringContaining("/verificar-email?token="),
      );
    });

    it("devolve token e perfil sem o hash da senha", async () => {
      const prisma = buildPrisma();
      const { service, jwt } = buildService(prisma);

      const result = await service.register({ name: "A", email: "a@a.com", password: "password123" });

      expect(jwt.sign).toHaveBeenCalledWith({ sub: "u1", email: "a@a.com" });
      expect(result.accessToken).toBe("signed-jwt-token");
      expect(typeof result.refreshToken).toBe("string");
      expect(result.profile).toEqual({ id: "u1", name: "A", email: "a@a.com" });
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("login", () => {
    it("rejeita e-mail inexistente com a mesma exceção genérica (não revela se o e-mail existe)", async () => {
      const prisma = buildPrisma({ existingProfile: null });
      const { service } = buildService(prisma);

      await expect(service.login({ email: "ninguem@a.com", password: "x" })).rejects.toThrow(UnauthorizedException);
    });

    it("rejeita senha incorreta com a mesma exceção genérica", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma({
        existingProfile: { id: "u1", name: "A", email: "a@a.com", passwordHash: realHash },
      });
      const { service } = buildService(prisma);

      await expect(service.login({ email: "a@a.com", password: "senha-errada" })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("emite token quando a senha bate com o hash salvo", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma({
        existingProfile: { id: "u1", name: "A", email: "a@a.com", passwordHash: realHash },
      });
      const { service, jwt } = buildService(prisma);

      const result = await service.login({ email: "a@a.com", password: "senha-certa" });

      expect(jwt.sign).toHaveBeenCalledWith({ sub: "u1", email: "a@a.com" });
      expect(result.accessToken).toBe("signed-jwt-token");
    });
  });

  describe("refresh", () => {
    it("rejeita token inexistente", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findFirst.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(service.refresh("token-fantasma")).rejects.toThrow(UnauthorizedException);
    });

    it("rejeita token expirado", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: "rt1",
        profileId: "u1",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      const { service } = buildService(prisma);

      await expect(service.refresh("token-expirado")).rejects.toThrow(UnauthorizedException);
    });

    it("reusar um token já revogado revoga toda a família de sessões do usuário", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: "rt1",
        profileId: "u1",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100_000),
      });
      const { service } = buildService(prisma);

      await expect(service.refresh("token-ja-usado")).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { profileId: "u1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("token válido: revoga o token usado e emite um par novo (rotação)", async () => {
      const prisma = buildPrisma({ existingProfile: { id: "u1", name: "A", email: "a@a.com" } });
      prisma.profile.findUnique.mockResolvedValue({ id: "u1", name: "A", email: "a@a.com" });
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: "rt1",
        profileId: "u1",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      const { service, jwt } = buildService(prisma);

      const result = await service.refresh("token-valido");

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: "rt1" },
        data: { revokedAt: expect.any(Date) },
      });
      expect(jwt.sign).toHaveBeenCalledWith({ sub: "u1", email: "a@a.com" });
      expect(result.accessToken).toBe("signed-jwt-token");
      expect(typeof result.refreshToken).toBe("string");
    });
  });

  describe("logout", () => {
    it("revoga o refresh token apresentado", async () => {
      const prisma = buildPrisma();
      const { service } = buildService(prisma);

      await service.logout("algum-token");

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String), revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("listSessions", () => {
    it("lista só sessões não revogadas e não expiradas do usuário, sem o hash do token", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: "rt1", userAgent: "Chrome", createdAt: new Date(), expiresAt: new Date() },
      ]);
      const { service } = buildService(prisma);

      const result = await service.listSessions("u1");

      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { profileId: "u1", revokedAt: null, expiresAt: { gt: expect.any(Date) } },
        orderBy: { createdAt: "desc" },
        select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
      });
      expect(result).toEqual([
        { id: "rt1", userAgent: "Chrome", createdAt: expect.any(Date), expiresAt: expect.any(Date) },
      ]);
    });
  });

  describe("revokeSession", () => {
    it("404 quando a sessão não existe", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(service.revokeSession("u1", "rt1")).rejects.toThrow(NotFoundException);
    });

    it("404 quando a sessão pertence a outro usuário (não revela a existência)", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findUnique.mockResolvedValue({ id: "rt1", profileId: "outro" });
      const { service } = buildService(prisma);

      await expect(service.revokeSession("u1", "rt1")).rejects.toThrow(NotFoundException);
    });

    it("revoga a sessão do próprio usuário", async () => {
      const prisma = buildPrisma();
      prisma.refreshToken.findUnique.mockResolvedValue({ id: "rt1", profileId: "u1" });
      const { service } = buildService(prisma);

      await service.revokeSession("u1", "rt1");

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: "rt1" },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("register envia e-mail de verificação", () => {
    it("cria o token e chama o mailer com o link de verificação", async () => {
      const prisma = buildPrisma();
      const { service, mailer } = buildService(prisma);

      await service.register({ name: "A", email: "a@a.com", password: "password123" });

      expect(prisma.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ profileId: "u1", type: "VERIFICACAO_EMAIL" }),
      });
      expect(mailer.sendVerificationEmail).toHaveBeenCalledWith(
        "a@a.com",
        "A",
        expect.stringContaining("/verificar-email?token="),
      );
    });
  });

  describe("verifyEmail", () => {
    it("rejeita token inexistente ou já usado", async () => {
      const prisma = buildPrisma();
      prisma.verificationToken.findFirst.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(service.verifyEmail("token-x")).rejects.toThrow(BadRequestException);
    });

    it("rejeita token expirado", async () => {
      const prisma = buildPrisma();
      prisma.verificationToken.findFirst.mockResolvedValue({
        id: "vt1",
        profileId: "u1",
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      const { service } = buildService(prisma);

      await expect(service.verifyEmail("token-x")).rejects.toThrow(BadRequestException);
    });

    it("token válido: marca o e-mail como verificado e consome o token", async () => {
      const prisma = buildPrisma();
      prisma.verificationToken.findFirst.mockResolvedValue({
        id: "vt1",
        profileId: "u1",
        usedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      const { service } = buildService(prisma);

      await service.verifyEmail("token-valido");

      expect(prisma.verificationToken.update).toHaveBeenCalledWith({
        where: { id: "vt1" },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { emailVerifiedAt: expect.any(Date) },
      });
    });
  });

  describe("resendVerification", () => {
    it("rejeita reenviar quando o e-mail já foi verificado", async () => {
      const prisma = buildPrisma();
      prisma.profile.findUniqueOrThrow.mockResolvedValue({
        id: "u1",
        email: "a@a.com",
        name: "A",
        emailVerifiedAt: new Date(),
      });
      const { service } = buildService(prisma);

      await expect(service.resendVerification("u1")).rejects.toThrow(BadRequestException);
    });

    it("reenvia quando ainda não foi verificado", async () => {
      const prisma = buildPrisma();
      prisma.profile.findUniqueOrThrow.mockResolvedValue({
        id: "u1",
        email: "a@a.com",
        name: "A",
        emailVerifiedAt: null,
      });
      const { service, mailer } = buildService(prisma);

      await service.resendVerification("u1");

      expect(mailer.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("não cria token nem envia e-mail quando o e-mail não existe (evita enumeração)", async () => {
      const prisma = buildPrisma({ existingProfile: null });
      const { service, mailer } = buildService(prisma);

      await service.forgotPassword({ email: "ninguem@a.com" });

      expect(prisma.verificationToken.create).not.toHaveBeenCalled();
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("cria token e envia e-mail quando o e-mail existe", async () => {
      const prisma = buildPrisma({ existingProfile: { id: "u1", email: "a@a.com", name: "A" } });
      const { service, mailer } = buildService(prisma);

      await service.forgotPassword({ email: "a@a.com" });

      expect(prisma.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ profileId: "u1", type: "REDEFINICAO_SENHA" }),
      });
      expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
        "a@a.com",
        "A",
        expect.stringContaining("/redefinir-senha?token="),
      );
    });
  });

  describe("resetPassword", () => {
    it("rejeita token inválido/expirado", async () => {
      const prisma = buildPrisma();
      prisma.verificationToken.findFirst.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(service.resetPassword({ token: "token-x", newPassword: "novaSenha123" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejeita nova senha que contém o nome ou e-mail do dono do token", async () => {
      const prisma = buildPrisma();
      prisma.verificationToken.findFirst.mockResolvedValue({
        id: "vt1",
        profileId: "u1",
        usedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      prisma.profile.findUniqueOrThrow.mockResolvedValue({ id: "u1", email: "maria@a.com", name: "Maria" });
      const { service } = buildService(prisma);

      await expect(service.resetPassword({ token: "token-valido", newPassword: "maria2024" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("token válido: troca a senha e revoga todas as sessões ativas", async () => {
      const prisma = buildPrisma();
      prisma.verificationToken.findFirst.mockResolvedValue({
        id: "vt1",
        profileId: "u1",
        usedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      prisma.profile.findUniqueOrThrow.mockResolvedValue({ id: "u1", email: "a@a.com", name: "A" });
      const { service } = buildService(prisma);

      await service.resetPassword({ token: "token-valido", newPassword: "novaSenha123" });

      const updateCall = prisma.profile.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: "u1" });
      expect(await bcrypt.compare("novaSenha123", updateCall.data.passwordHash)).toBe(true);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { profileId: "u1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
