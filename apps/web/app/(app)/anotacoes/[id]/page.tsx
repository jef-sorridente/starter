"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, ConfirmDialog, Icon } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { FormSkeleton } from "@/components/skeletons/Skeletons";
import { NoteForm } from "@/components/notes/NoteForm";
import { ApiError } from "@/lib/api";
import { useDeleteNote, useNote, useUpdateNote } from "@/lib/queries/notes";
import panels from "@/styles/panels.module.css";
import states from "@/styles/states.module.css";
import typography from "@/styles/typography.module.css";

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: note, error: loadError } = useNote(params.id);
  const updateNote = useUpdateNote(params.id);
  const deleteNote = useDeleteNote();

  useShellMeta(["Anotações", note?.title ?? "…"]);

  const backHref = note?.groupId ? `/anotacoes?grupo=${note.groupId}` : "/anotacoes";

  async function handleSave(values: { title: string; content: string }) {
    setError(null);
    try {
      await updateNote.mutateAsync(values);
      router.push(backHref);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    }
  }

  async function handleDelete() {
    setError(null);
    try {
      await deleteNote.mutateAsync(params.id);
      router.push(backHref);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir.");
      setConfirmDelete(false);
    }
  }

  if (loadError) {
    return (
      <div className={states.emptyState}>
        <Icon name="circle-alert" size={24} color="var(--text-faint)" />
        <div className={states.emptyTitle}>Anotação não encontrada</div>
        <div className={states.emptyDescription}>Ela pode ter sido excluída, ou você não tem acesso a ela.</div>
        <Button variant="ghost" onClick={() => router.push("/anotacoes")}>
          Voltar para anotações
        </Button>
      </div>
    );
  }

  if (!note) return <FormSkeleton fields={2} />;

  return (
    <>
      <div>
        <h2 className={typography.pageTitle}>{note.title}</h2>
        <p className={typography.pageSubtitle}>
          {note.groupId ? <Badge tone="neutral">Grupo</Badge> : <Badge tone="neutral">Pessoal</Badge>} Escrita por{" "}
          {note.author?.name ?? "usuário removido"}.
        </p>
      </div>

      {error ? <div className={typography.errorText}>{error}</div> : null}

      <div className={`${panels.formCard} ${panels.formShell}`}>
        <NoteForm
          initial={{ title: note.title, content: note.content }}
          submitLabel="Salvar alterações"
          pending={updateNote.isPending}
          onSubmit={handleSave}
          onCancel={() => router.push(backHref)}
        />
        <div className={panels.dangerZone}>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Excluir anotação
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Excluir "${note.title}"?`}
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteNote.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
