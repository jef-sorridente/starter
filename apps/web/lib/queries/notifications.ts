"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@app/shared";
import { useAuth } from "../auth-context";
import { apiFetch } from "../api";
import type { Notification, NotificationPreference, NotificationType, NotificationsSummary } from "../notifications";

// Contagens agregadas server-side (badge do sino, contadores da central
// de notificações) — não dá pra derivar de uma lista paginada, senão o
// número fica errado assim que existir mais de uma página.
export function useNotificationsSummary() {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: () => apiFetch<NotificationsSummary>("/notifications/summary", { token: auth!.accessToken }),
    enabled: !!auth,
    refetchInterval: 30_000,
  });
}

export function useNotifications(params: { unreadOnly?: boolean; type?: NotificationType; limit?: number } = {}) {
  const { auth } = useAuth();
  const { unreadOnly, type, limit = 50 } = params;
  const query = new URLSearchParams({ limit: String(limit) });
  if (unreadOnly) query.set("unreadOnly", "true");
  if (type) query.set("type", type);

  return useQuery({
    queryKey: ["notifications", "list", { unreadOnly: !!unreadOnly, type, limit }],
    queryFn: () =>
      apiFetch<PaginatedResult<Notification>>(`/notifications?${query.toString()}`, { token: auth!.accessToken }),
    enabled: !!auth,
    // Sem WebSocket/push ainda — poll curto é o que faz o sino do header
    // reagir a algo que aconteceu em outra aba ou por outro membro do
    // grupo, sem precisar recarregar.
    refetchInterval: 30_000,
  });
}

export function useNotificationPreferences() {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => apiFetch<NotificationPreference[]>("/notification-preferences", { token: auth!.accessToken }),
    enabled: !!auth,
  });
}

export function useMarkNotificationRead() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "POST", token: auth!.accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST", token: auth!.accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useUpdateNotificationPreference() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      field,
      value,
    }: {
      type: NotificationType;
      field: "pushEnabled" | "emailEnabled";
      value: boolean;
    }) =>
      apiFetch(`/notification-preferences/${type}`, {
        method: "PATCH",
        token: auth!.accessToken,
        body: { [field]: value },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
}
