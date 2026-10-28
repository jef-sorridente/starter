import { z } from "zod";

// ------------------------------------------------------------
// Módulo de exemplo (anotações) — referência do padrão de módulo.
// Ver o comentário do model Note em apps/api/prisma/schema.prisma.
// ------------------------------------------------------------

export const NOTE_TITLE_MAX_LENGTH = 120;
export const NOTE_CONTENT_MAX_LENGTH = 5000;

// Sem groupId = anotação pessoal. Com groupId = do grupo (qualquer
// membro lê e escreve). O dono é fixado na criação e não muda.
export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Dê um título à anotação").max(NOTE_TITLE_MAX_LENGTH),
  content: z.string().max(NOTE_CONTENT_MAX_LENGTH).default(""),
  groupId: z.string().uuid().optional(),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.omit({ groupId: true }).partial();
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const notesQuerySchema = z.object({
  groupId: z.string().uuid().optional(),
});
export type NotesQuery = z.infer<typeof notesQuerySchema>;

export interface Note {
  id: string;
  userId: string | null;
  groupId: string | null;
  createdBy: string | null;
  author: { id: string; name: string } | null;
  title: string;
  content: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
