import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { CreateInviteInput } from "@app/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { GroupsService } from "./groups.service";

const INVITE_TTL_DAYS = 7;

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(actorId: string, groupId: string, input: CreateInviteInput) {
    await this.groupsService.assertCanManage(actorId, groupId);

    const alreadyMember = await this.prisma.groupMember.findFirst({
      where: { groupId, user: { email: input.email } },
    });
    if (alreadyMember) {
      throw new BadRequestException("Este e-mail já faz parte do grupo");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const [group, inviter, existingProfile] = await Promise.all([
      this.prisma.group.findUniqueOrThrow({ where: { id: groupId } }),
      this.prisma.profile.findUniqueOrThrow({ where: { id: actorId } }),
      this.prisma.profile.findUnique({ where: { email: input.email } }),
    ]);

    return this.prisma.$transaction(async (tx) => {
      const invite = await tx.groupInvite.create({
        data: {
          groupId,
          email: input.email,
          invitedBy: actorId,
          token: randomBytes(32).toString("hex"),
          role: input.role,
          expiresAt,
        },
      });

      // Só dá pra notificar quem já tem Profile com esse e-mail —
      // Notification.userId é obrigatório. Quem ainda não se cadastrou
      // vê o convite via GET /invites/me assim que criar a conta ou
      // logar com esse e-mail.
      if (existingProfile) {
        await this.notificationsService.notifyGroupInvite(tx, {
          inviteId: invite.id,
          userId: existingProfile.id,
          groupName: group.name,
          inviterName: inviter.name,
        });
      }

      return invite;
    });
  }

  async listMine(email: string) {
    return this.prisma.groupInvite.findMany({
      where: { email, status: "PENDENTE" },
      include: { group: { include: { members: true } } },
    });
  }

  async listForGroup(actorId: string, groupId: string) {
    await this.groupsService.assertCanManage(actorId, groupId);
    return this.prisma.groupInvite.findMany({
      where: { groupId, status: "PENDENTE" },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancel(actorId: string, groupId: string, inviteId: string) {
    await this.groupsService.assertCanManage(actorId, groupId);
    const invite = await this.prisma.groupInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.groupId !== groupId) {
      throw new NotFoundException("Convite não encontrado");
    }
    if (invite.status !== "PENDENTE") {
      throw new BadRequestException("Este convite já foi respondido");
    }
    await this.prisma.groupInvite.delete({ where: { id: inviteId } });
  }

  async accept(userId: string, userEmail: string, token: string) {
    const invite = await this.loadValidInvite(token, userEmail);

    await this.prisma.$transaction([
      this.prisma.groupMember.create({
        data: { groupId: invite.groupId, userId, role: invite.role },
      }),
      this.prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: "ACEITO" },
      }),
    ]);
  }

  async decline(userEmail: string, token: string) {
    const invite = await this.loadValidInvite(token, userEmail);
    await this.prisma.groupInvite.update({
      where: { id: invite.id },
      data: { status: "RECUSADO" },
    });
  }

  private async loadValidInvite(token: string, userEmail: string) {
    const invite = await this.prisma.groupInvite.findUnique({ where: { token } });
    if (!invite) {
      throw new NotFoundException("Convite não encontrado");
    }
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException("Este convite não é para você");
    }
    if (invite.status !== "PENDENTE") {
      throw new BadRequestException("Este convite já foi respondido");
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRADO" },
      });
      throw new BadRequestException("Este convite expirou");
    }
    return invite;
  }
}
