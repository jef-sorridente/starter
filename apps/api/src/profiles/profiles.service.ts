import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput,
  containsUserIdentifier,
  emailLocalPart,
} from "@app/shared";
import { PrismaService } from "../prisma/prisma.service";
import { GroupsService } from "../groups/groups.service";

const SALT_ROUNDS = 12;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
  ) {}

  async updateName(userId: string, input: UpdateProfileInput) {
    const profile = await this.prisma.profile.update({ where: { id: userId }, data: { name: input.name } });
    return { id: profile.id, name: profile.name, email: profile.email };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(input.currentPassword, profile.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Senha atual incorreta");
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException("A nova senha precisa ser diferente da atual");
    }
    if (containsUserIdentifier(input.newPassword, [profile.name, emailLocalPart(profile.email)])) {
      throw new BadRequestException("A senha não pode conter seu nome ou e-mail");
    }
    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await this.prisma.profile.update({ where: { id: userId }, data: { passwordHash } });
  }

  // "Baixar meus dados" (LGPD, direito de portabilidade) — só o que
  // pertence à conta pessoal do usuário. Dados de grupo ficam de fora:
  // são compartilhados com outros membros, e exportar exigiria decidir
  // uma política de privacidade pros outros que este export não tenta
  // resolver. Todo model pessoal novo entra aqui.
  async exportData(userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerifiedAt: true, createdAt: true },
    });

    const [notes, notifications, notificationPreferences, groupMemberships] = await Promise.all([
      this.prisma.note.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.notificationPreference.findMany({ where: { userId } }),
      this.prisma.groupMember.findMany({ where: { userId }, include: { group: { select: { id: true, name: true } } } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile,
      notes,
      notifications,
      notificationPreferences,
      groups: groupMemberships.map((m) => ({
        groupId: m.groupId,
        groupName: m.group.name,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }

  // Exclusão de conta. Ordem importa (FK sem CASCADE na maioria das
  // tabelas — só refresh/verification token têm CASCADE de propósito,
  // o resto seria fácil demais de apagar por engano em outro fluxo):
  //
  // 1. Bloqueia se o usuário for dono de algum grupo com outros
  //    membros — excluir a conta nunca apaga o espaço compartilhado
  //    de outras pessoas como efeito colateral implícito; isso exige
  //    uma ação deliberada (transferir posse ou excluir o grupo à
  //    parte, via o fluxo que já existe).
  // 2. Grupos que o usuário possui sozinho (sem outro membro) são
  //    excluídos de verdade, reaproveitando GroupsService.delete.
  // 3. Saída dos grupos que o usuário só participa (não é dono),
  //    reaproveitando GroupsService.leave — os registros que ele
  //    criou lá (anotação de grupo, convite) continuam valendo pro
  //    grupo; a autoria vira "usuário removido" quando o Profile for
  //    excluído (colunas com ON DELETE SET NULL).
  // 4. Todo o resto pessoal é apagado numa transação só, na ordem que
  //    a FK exige. Todo model pessoal novo entra nessa lista.
  async deleteAccount(userId: string, input: DeleteAccountInput) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(input.password, profile.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Senha incorreta");
    }

    const ownedGroups = await this.prisma.group.findMany({
      where: { ownerId: userId },
      include: { members: { select: { userId: true } } },
    });
    const ownedGroupsWithOthers = ownedGroups.filter((g) => g.members.some((m) => m.userId !== userId));
    if (ownedGroupsWithOthers.length > 0) {
      const names = ownedGroupsWithOthers.map((g) => g.name).join(", ");
      throw new BadRequestException(
        `Você é dono de grupo(s) com outros membros (${names}) — transfira a posse ou exclua o grupo antes de excluir sua conta`,
      );
    }

    for (const group of ownedGroups) {
      await this.groupsService.delete(userId, group.id);
    }

    const otherMemberships = await this.prisma.groupMember.findMany({
      where: { userId, group: { ownerId: { not: userId } } },
    });
    for (const membership of otherMemberships) {
      await this.groupsService.leave(userId, membership.groupId);
    }

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.notificationPreference.deleteMany({ where: { userId } }),
      this.prisma.note.deleteMany({ where: { userId } }),
      this.prisma.profile.delete({ where: { id: userId } }),
    ]);
  }
}
