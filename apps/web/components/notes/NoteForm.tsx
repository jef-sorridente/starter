"use client";

import * as React from "react";
import { Button, Input, Textarea } from "@app/ui";
import { NOTE_CONTENT_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH, createNoteSchema } from "@app/shared";
import panels from "@/styles/panels.module.css";

export interface NoteFormValues {
  title: string;
  content: string;
}

// Formulário do módulo de exemplo. Valida com o MESMO schema zod que a
// API usa (createNoteSchema de @app/shared) — a mensagem de erro que o
// usuário vê aqui é a mesma que a API devolveria.
export function NoteForm({
  initial = { title: "", content: "" },
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: NoteFormValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: NoteFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [values, setValues] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createNoteSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os campos.");
      return;
    }
    setError(null);
    await onSubmit({ title: parsed.data.title, content: parsed.data.content });
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Input
        label="Título"
        value={values.title}
        maxLength={NOTE_TITLE_MAX_LENGTH}
        invalid={Boolean(error)}
        hint={error ?? undefined}
        disabled={pending}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, title: e.target.value }))}
      />
      <Textarea
        label="Conteúdo"
        value={values.content}
        maxLength={NOTE_CONTENT_MAX_LENGTH}
        rows={6}
        disabled={pending}
        style={{ marginTop: 14 }}
        onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))}
      />
      <div className={panels.formActions}>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
