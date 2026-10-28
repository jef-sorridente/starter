import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Prisma } from "@prisma/client";
import { NOTIFICATION_TYPES, PaginationQuery } from "@app/shared";
import { buildPaginatedResult, paginationSkipTake } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient | PrismaService;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Chamado pelo InvitesService sempre que um convite é criado pra um
  // e-mail que já tem Profile — Notification.userId é obrigatório, não
  // dá pra notificar quem ainda não se cadastrou (esse caso só aparece
  // pro convidado depois, via GET /invites/me, quando ele se registrar
  // ou logar com o e-mail convidado).
  async notifyGroupInvite(
    tx: Tx,
    params: { inviteId: string; userId: string; groupName: string; inviterName: string },
  ) {
    await tx.notification.create({
      data: {
        userId: params.userId,
        inviteId: params.inviteId,
        type: "CONVITE_GRUPO",
        message: `${params.inviterName} convidou você para o grupo "${params.groupName}"`,
      },
    });
  }

  async listForUser(
    userId: string,
    filters: { unreadOnly?: boolean; type?: NotificationType },
    pagination: PaginationQuery,
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(filters.unreadOnly ? { readAt: null } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...paginationSkipTake(pagination),
      }),
      this.prisma.notification.count({ where }),
    ]);
    return buildPaginatedResult(items, total, pagination);
  }

  // Contagens agregadas server-side — o header (badge do sino) e a
  // central de notificações usam isso em vez de derivar de uma lista
  // já paginada, senão o número fica errado assim que passar da
  // primeira página.
  async summary(userId: string) {
    const [unread, byTypeRaw] = await Promise.all([
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      this.prisma.notification.groupBy({
        by: ["type"],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    const byType = Object.fromEntries(NOTIFICATION_TYPES.map((type) => [type, 0])) as Record<NotificationType, number>;
    for (const row of byTypeRaw) {
      byType[row.type] = row._count._all;
    }

    return { unread, byType };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException("Notificação não encontrada");
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException("Esta notificação não pertence a você");
    }
    if (notification.readAt) {
      return notification;
    }
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getPreferences(userId: string) {
    const existing = await this.prisma.notificationPreference.findMany({ where: { userId } });

    return NOTIFICATION_TYPES.map((type) => {
      const found = existing.find((p) => p.type === type);
      return found ?? { userId, type, pushEnabled: true, emailEnabled: true };
    });
  }

  async updatePreference(
    userId: string,
    type: NotificationType,
    input: { pushEnabled?: boolean; emailEnabled?: boolean },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      update: input,
      create: {
        userId,
        type,
        pushEnabled: input.pushEnabled ?? true,
        emailEnabled: input.emailEnabled ?? true,
      },
    });
  }
}
