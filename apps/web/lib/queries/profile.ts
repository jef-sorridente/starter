"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth-context";
import type { ProfileMe, Session } from "@app/shared";
import { apiFetch } from "../api";

export function useProfileMe() {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => apiFetch<ProfileMe>("/profiles/me", { token: auth!.accessToken }),
    enabled: !!auth,
  });
}

export function useResendVerification() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/auth/resend-verification", { method: "POST", token: auth!.accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}

export function useUpdateProfileName() {
  const { auth } = useAuth();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch("/profiles/me", { method: "PATCH", token: auth!.accessToken, body: { name } }),
  });
}

export function useChangePassword() {
  const { auth } = useAuth();
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      apiFetch("/profiles/me/password", { method: "POST", token: auth!.accessToken, body }),
  });
}

export function useSessions() {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => apiFetch<Session[]>("/auth/sessions", { token: auth!.accessToken }),
    enabled: !!auth,
  });
}

export function useDeleteAccount() {
  const { auth } = useAuth();
  return useMutation({
    mutationFn: (password: string) =>
      apiFetch("/profiles/me", { method: "DELETE", token: auth!.accessToken, body: { password } }),
  });
}

export function useExportData() {
  const { auth } = useAuth();
  return useMutation({
    mutationFn: () => apiFetch<Record<string, unknown>>("/profiles/me/export", { token: auth!.accessToken }),
  });
}

export function useRevokeSession() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/sessions/${id}`, { method: "DELETE", token: auth!.accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });
}
