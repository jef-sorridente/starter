"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateNoteInput, Note, PaginatedResult, UpdateNoteInput } from "@app/shared";
import { useAuth } from "../auth-context";
import { apiFetch } from "../api";

// Módulo de exemplo — o molde de hooks de um recurso: uma query key por
// escopo (["notes", groupId ?? "pessoal"]) e toda mutação invalidando
// ["notes"] inteiro, que é barato e nunca deixa lista velha na tela.
const notesKey = (groupId?: string) => ["notes", groupId ?? "pessoal"] as const;

export function useNotes(params: { groupId?: string; limit?: number } = {}) {
  const { auth } = useAuth();
  const { groupId, limit = 20 } = params;
  const query = new URLSearchParams({ limit: String(limit) });
  if (groupId) query.set("groupId", groupId);

  return useQuery({
    queryKey: [...notesKey(groupId), { limit }],
    queryFn: () => apiFetch<PaginatedResult<Note>>(`/notes?${query.toString()}`, { token: auth!.accessToken }),
    enabled: !!auth,
  });
}

export function useNote(id: string | undefined) {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["notes", "detail", id],
    queryFn: () => apiFetch<Note>(`/notes/${id}`, { token: auth!.accessToken }),
    enabled: !!auth && !!id,
  });
}

export function useCreateNote() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoteInput) => apiFetch<Note>("/notes", { method: "POST", token: auth!.accessToken, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote(id: string) {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateNoteInput) =>
      apiFetch<Note>(`/notes/${id}`, { method: "PATCH", token: auth!.accessToken, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/notes/${id}`, { method: "DELETE", token: auth!.accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
