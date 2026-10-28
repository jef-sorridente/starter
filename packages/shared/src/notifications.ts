import { z } from "zod";

// Fonte única dos tipos de notificação — espelha o enum
// NotificationType do schema.prisma. A API usa esta lista pra montar
// preferências e contagens, então um tipo novo só precisa entrar aqui
// e no enum do Prisma.
export const NOTIFICATION_TYPES = ["CONVITE_GRUPO"] as const;
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationsQuerySchema = z.object({
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  type: notificationTypeSchema.optional(),
});
export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;

export const updateNotificationPreferenceSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});
export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;

export interface Notification {
  id: string;
  userId: string;
  inviteId: string | null;
  type: NotificationType;
  message: string;
  readAt: string | null; // ISO date
  createdAt: string; // ISO date
}

export interface NotificationPreference {
  id?: string;
  userId: string;
  type: NotificationType;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface NotificationsSummary {
  unread: number;
  byType: Record<NotificationType, number>;
}
