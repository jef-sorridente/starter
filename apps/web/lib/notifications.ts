import type { NotificationType } from "@app/shared";

export type { Notification, NotificationPreference, NotificationType, NotificationsSummary } from "@app/shared";

// Apresentação de cada tipo (texto, ícone, cor) — o tipo em si vem de
// @app/shared. Record<NotificationType, ...> faz o TypeScript acusar
// aqui quando um tipo novo for adicionado e esquecido na tela.
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  CONVITE_GRUPO: "Convite de grupo",
};

export const NOTIFICATION_TYPE_META: Record<NotificationType, string> = {
  CONVITE_GRUPO: "Alguém te convidou para um grupo",
};

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, string> = {
  CONVITE_GRUPO: "users",
};

export const NOTIFICATION_TYPE_COLOR: Record<NotificationType, string> = {
  CONVITE_GRUPO: "var(--blue-500)",
};

// Pra onde levar o usuário ao abrir a notificação (null = só marca como lida).
export const NOTIFICATION_TYPE_HREF: Record<NotificationType, string | null> = {
  CONVITE_GRUPO: "/grupos",
};
