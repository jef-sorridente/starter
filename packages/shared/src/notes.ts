import { z } from "zod";

// ------------------------------------------------------------
// Módulo de exemplo (anotações) — referência do padrão de módulo.
// Ver o comentário do model Note em apps/api/prisma/schema.prisma.
// ------------------------------------------------------------

export const NOTE_TITLE_MAX_LENGTH = 120;
export const NOTE_CONTENT_MAX_LENGTH = 5000;

// Sem groupId = anotação pessoal. Com groupId = do grupo (qualquer
// membro lê e escreve). O dono é fixado na criação e não muda.
const noteTitleSchema = z.string().trim().min(1, "Dê um título à anotação").max(NOTE_TITLE_MAX_LENGTH);
const noteContentSchema = z.string().max(NOTE_CONTENT_MAX_LENGTH);

export const createNoteSchema = z.object({
  title: noteTitleSchema,
  content: noteContentSchema.default(""),
  groupId: z.uuid().optional(),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

// Declarado à parte (não `createNoteSchema.partial()`): no zod 4 o
// `.partial()` mantém o `.default("")` do content, e um PATCH que só troca
// o título apagaria o conteúdo. Campo ausente no PATCH = não mexe.
export const updateNoteSchema = z.object({
  title: noteTitleSchema.optional(),
  content: noteContentSchema.optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const notesQuerySchema = z.object({
  groupId: z.uuid().optional(),
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
