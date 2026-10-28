import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateGroupInput, UpdateGroupInput } from "@app/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, input: CreateGroupInput) {
    return this.prisma.group.create({
      data: {
        name: input.name,
        ownerId,
        members: {
          create: { userId: ownerId, role: "OWNER" },
        },
      },
      include: { members: true },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { members: true },
      orderBy: { createdAt: "asc" },
    });
  }

  // Carrega o grupo e garante que o usuário é membro — é o ponto único
  // de autorização de tudo que é "do grupo" (outros services chamam
  // isso antes de ler/escrever qualquer dado com groupId).
  async getForMember(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          // Nunca devolver passwordHash — select explícito em vez de
          // include: true, que traria o Profile inteiro.
          include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        },
      },
    });
    if (!group) {
      throw new NotFoundException("Grupo não encontrado");
    }
    const membership = group.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new ForbiddenException("Você não faz parte deste grupo");
    }
    return { group, membership };
  }

  // Versão que não lança: pra quem precisa decidir a resposta sozinho
  // (ex.: devolver 404 em vez de 403 pra não revelar que um id existe).
  async findMembership(userId: string, groupId: string) {
    return this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  }

  // OWNER ou ADMIN — usado antes de mutações como convidar ou remover
  // membros.
  async assertCanManage(userId: string, groupId: string) {
    const { membership } = await this.getForMember(userId, groupId);
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      throw new ForbiddenException("Apenas o dono ou administradores podem gerenciar o grupo");
    }
    return membership;
  }

  async rename(userId: string, groupId: string, input: UpdateGroupInput) {
    await this.assertCanManage(userId, groupId);
    return this.prisma.group.update({ where: { id: groupId }, data: { name: input.name } });
  }

  async leave(userId: string, groupId: string) {
    const { membership } = await this.getForMember(userId, groupId);
    if (membership.role === "OWNER") {
      throw new BadRequestException("O dono não pode sair do grupo, exclua o grupo em vez disso");
    }
    await this.prisma.groupMember.delete({ where: { id: membership.id } });
  }

  // Só o dono promove/rebaixa membro a ADMIN — evita que admins criem
  // outros admins sem o dono saber (não é assertCanManage à toa).
  async updateMemberRole(actorId: string, groupId: string, memberId: string, role: "ADMIN" | "MEMBER") {
    const { membership } = await this.getForMember(actorId, groupId);
    if (membership.role !== "OWNER") {
      throw new ForbiddenException("Apenas o dono do grupo pode alterar o papel de um membro");
    }
    const target = await this.prisma.groupMember.findUnique({ where: { id: memberId } });
    if (!target || target.groupId !== groupId) {
      throw new NotFoundException("Membro não encontrado");
    }
    if (target.role === "OWNER") {
      throw new BadRequestException("O papel do dono não pode ser alterado");
    }
    return this.prisma.groupMember.update({ where: { id: memberId }, data: { role } });
  }

  async removeMember(actorId: string, groupId: string, memberId: string) {
    await this.assertCanManage(actorId, groupId);
    const target = await this.prisma.groupMember.findUnique({ where: { id: memberId } });
    if (!target || target.groupId !== groupId) {
      throw new NotFoundException("Membro não encontrado");
    }
    if (target.role === "OWNER") {
      throw new BadRequestException("O dono do grupo não pode ser removido");
    }
    await this.prisma.groupMember.delete({ where: { id: memberId } });
  }

  async delete(userId: string, groupId: string) {
    const { group, membership } = await this.getForMember(userId, groupId);
    if (membership.role !== "OWNER") {
      throw new ForbiddenException("Apenas o dono pode excluir o grupo");
    }
    // As FKs pra Group são ON DELETE RESTRICT de propósito (apagar um
    // grupo é sempre uma ação explícita, nunca efeito colateral de
    // cascade) — então tudo que pertence ao grupo é apagado aqui, numa
    // transação só. Todo model novo com groupId entra nesta lista.
    await this.prisma.$transaction([
      this.prisma.note.deleteMany({ where: { groupId: group.id } }),
      this.prisma.groupInvite.deleteMany({ where: { groupId: group.id } }),
      this.prisma.groupMember.deleteMany({ where: { groupId: group.id } }),
      this.prisma.group.delete({ where: { id: group.id } }),
    ]);
  }
}
