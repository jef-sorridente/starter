"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth-context";
import { apiFetch } from "../api";
import type { Group, GroupInvite } from "../groups";

export function useGroups() {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => apiFetch<Group[]>("/groups", { token: auth!.accessToken }),
    enabled: !!auth,
  });
}

export function useGroup(id: string | undefined) {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => apiFetch<Group>(`/groups/${id}`, { token: auth!.accessToken }),
    enabled: !!auth && !!id,
  });
}

export function useGroupInvites(groupId: string | undefined) {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["groups", groupId, "invites"],
    queryFn: () => apiFetch<GroupInvite[]>(`/groups/${groupId}/invites`, { token: auth!.accessToken }),
    enabled: !!auth && !!groupId,
  });
}

export function useMyInvites() {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["invites", "me"],
    queryFn: () => apiFetch<GroupInvite[]>("/invites/me", { token: auth!.accessToken }),
    enabled: !!auth,
  });
}

function invalidateGroups(qc: ReturnType<typeof useQueryClient>, groupId?: string) {
  void qc.invalidateQueries({ queryKey: ["groups"] });
  if (groupId) void qc.invalidateQueries({ queryKey: ["groups", groupId] });
}

export function useCreateGroup() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch<Group>("/groups", { method: "POST", token: auth!.accessToken, body }),
    onSuccess: () => invalidateGroups(qc),
  });
}

export function useRenameGroup(id: string) {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Group>(`/groups/${id}`, { method: "PATCH", token: auth!.accessToken, body: { name } }),
    onSuccess: () => invalidateGroups(qc, id),
  });
}

export function useDeleteGroup() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/groups/${id}`, { method: "DELETE", token: auth!.accessToken }),
    onSuccess: () => invalidateGroups(qc),
  });
}

export function useUpdateMemberRole(groupId: string) {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "ADMIN" | "MEMBER" }) =>
      apiFetch(`/groups/${groupId}/members/${memberId}`, { method: "PATCH", token: auth!.accessToken, body: { role } }),
    onSuccess: () => invalidateGroups(qc, groupId),
  });
}

export function useRemoveMember(groupId: string) {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiFetch(`/groups/${groupId}/members/${memberId}`, { method: "DELETE", token: auth!.accessToken }),
    onSuccess: () => invalidateGroups(qc, groupId),
  });
}

export function useSendInvite(groupId: string) {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: "ADMIN" | "MEMBER" }) =>
      apiFetch<GroupInvite>(`/groups/${groupId}/invites`, {
        method: "POST",
        token: auth!.accessToken,
        body: { email, role },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups", groupId, "invites"] }),
  });
}

export function useCancelInvite(groupId: string) {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      apiFetch(`/groups/${groupId}/invites/${inviteId}`, { method: "DELETE", token: auth!.accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups", groupId, "invites"] }),
  });
}

export function useRespondInvite() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ token, action }: { token: string; action: "accept" | "decline" }) =>
      apiFetch(`/invites/${token}/${action}`, { method: "POST", token: auth!.accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["groups"] });
      void qc.invalidateQueries({ queryKey: ["invites", "me"] });
    },
  });
}
