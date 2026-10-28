"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Icon, PanelHeader, Select } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { ListPanelSkeleton, LoadingRegion } from "@/components/skeletons/Skeletons";
import { NoteForm } from "@/components/notes/NoteForm";
import { ApiError } from "@/lib/api";
import { useGroups } from "@/lib/queries/groups";
import { useCreateNote, useNotes } from "@/lib/queries/notes";
import layout from "@/styles/layout.module.css";
import panels from "@/styles/panels.module.css";
import rows from "@/styles/rows.module.css";
import states from "@/styles/states.module.css";
import typography from "@/styles/typography.module.css";

const PAGE_SIZE = 20;
const PERSONAL = "pessoal";

// Módulo de exemplo — a tela-molde de um recurso: lista paginada com
// "carregar mais", estados de carregando/vazio/erro, criação inline e
// escopo pessoal x grupo vindo da URL (?grupo=<id>), pra o link ser
// compartilhável e o voltar do navegador funcionar.
function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("grupo") ?? undefined;
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: groups = [] } = useGroups();
  const { data: page, error: loadError } = useNotes({ groupId, limit });
  const createNote = useCreateNote();

  const scopeLabel = groupId ? (groups.find((g) => g.id === groupId)?.name ?? "Grupo") : "Pessoal";
  useShellMeta(["Anotações", scopeLabel]);

  React.useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [groupId]);

  async function handleCreate(values: { title: string; content: string }) {
    setError(null);
    try {
      await createNote.mutateAsync({ ...values, groupId });
      setCreating(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar a anotação.");
    }
  }

  const notes = page?.items;
  const hasMore = page ? page.items.length < page.total : false;

  return (
    <>
      <div className={layout.pageHeader}>
        <div>
          <h2 className={typography.pageTitle}>Anotações</h2>
          <p className={typography.pageSubtitle}>
            {page ? `${page.total} ${page.total === 1 ? "anotação" : "anotações"} · ${scopeLabel}` : "Carregando…"}
          </p>
        </div>
        <div className={layout.pageHeaderEnd}>
          <Select
            aria-label={`Escopo das anotações: ${scopeLabel}`}
            value={groupId ?? PERSONAL}
            options={[{ value: PERSONAL, label: "Pessoal" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
            onChange={(e) =>
              router.push(e.target.value === PERSONAL ? "/anotacoes" : `/anotacoes?grupo=${e.target.value}`)
            }
            style={{ width: 200 }}
          />
          <Button variant="primary" icon="circle-plus" onClick={() => setCreating(true)} disabled={creating}>
            Nova anotação
          </Button>
        </div>
      </div>

      {error ? <div className={typography.errorText}>{error}</div> : null}

      {creating ? (
        <div className={`${panels.formCard} ${panels.formShell}`}>
          <NoteForm
            submitLabel="Criar anotação"
            pending={createNote.isPending}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : null}

      {loadError ? (
        <div className={states.errorBanner} role="alert">
          <Icon name="circle-alert" size={15} color="var(--red-500)" />
          <div className={states.errorBannerText}>
            {loadError instanceof ApiError ? loadError.message : "Não foi possível carregar as anotações."}
          </div>
        </div>
      ) : notes === undefined ? (
        <LoadingRegion>
          <ListPanelSkeleton rows={5} />
        </LoadingRegion>
      ) : notes.length === 0 ? (
        <div className={states.emptyState}>
          <Icon name="file-text" size={24} color="var(--text-faint)" />
          <div className={states.emptyTitle}>Nenhuma anotação ainda</div>
          <div className={states.emptyDescription}>Crie a primeira para ver como o módulo de exemplo funciona.</div>
        </div>
      ) : (
        <div className={`${panels.card} ${panels.formShell}`}>
          <PanelHeader title={scopeLabel} />
          {notes.map((note) => (
            <button
              type="button"
              key={note.id}
              className={rows.clickableRow}
              onClick={() => router.push(`/anotacoes/${note.id}`)}
            >
              <span className={rows.rowIcon}>
                <Icon name="file-text" size={14} color="var(--text-body)" />
              </span>
              <div className={rows.rowMain}>
                <div className={rows.rowTitle}>{note.title}</div>
                <div className={rows.rowMeta}>
                  {note.author?.name ?? "Usuário removido"} · {new Date(note.updatedAt).toLocaleString("pt-BR")}
                </div>
              </div>
              <Icon name="chevron-right" size={14} color="var(--text-faint)" />
            </button>
          ))}
          {hasMore ? (
            <div className={rows.loadMoreWrap}>
              <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                Carregar mais
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

// useSearchParams exige Suspense no App Router — sem isso o `next build`
// falha (e o `next dev` não acusa). Ver docs/padroes/web.md.
export default function NotesPage() {
  return (
    <React.Suspense fallback={null}>
      <NotesContent />
    </React.Suspense>
  );
}
