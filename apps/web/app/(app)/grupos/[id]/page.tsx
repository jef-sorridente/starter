"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, ConfirmDialog, Input, PanelHeader } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { PageSkeleton } from "@/components/skeletons/Skeletons";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/groups";
import { useDeleteGroup, useGroup, useRemoveMember, useRenameGroup, useUpdateMemberRole } from "@/lib/queries/groups";
import layout from "@/styles/layout.module.css";
import typography from "@/styles/typography.module.css";
import panels from "@/styles/panels.module.css";
import rows from "@/styles/rows.module.css";

const ROLE_TONE: Record<string, "active" | "neutral"> = { OWNER: "active", ADMIN: "neutral", MEMBER: "neutral" };

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function GroupSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = React.useState(false);
  const [removingMember, setRemovingMember] = React.useState<{ id: string; name: string } | null>(null);

  const { data: group } = useGroup(params.id);
  const renameGroup = useRenameGroup(params.id);
  const removeMember = useRemoveMember(params.id);
  const updateMemberRole = useUpdateMemberRole(params.id);
  const deleteGroup = useDeleteGroup();

  React.useEffect(() => {
    if (group) setName(group.name);
  }, [group]);

  const me = group?.members.find((m) => m.userId === auth?.profile.id);
  const canManage = me?.role === "OWNER" || me?.role === "ADMIN";
  const isOwner = me?.role === "OWNER";

  async function handleRename() {
    if (!name) return;
    setError(null);
    try {
      await renameGroup.mutateAsync(name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível renomear o grupo.");
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return;
    setError(null);
    try {
      await removeMember.mutateAsync(removingMember.id);
      setRemovingMember(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover o membro.");
      setRemovingMember(null);
    }
  }

  async function handleDeleteGroup() {
    setError(null);
    try {
      await deleteGroup.mutateAsync(params.id);
      router.push("/grupos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir o grupo.");
      setConfirmDeleteGroup(false);
    }
  }

  useShellMeta(group ? ["Grupos", group.name, "Configurações"] : ["Grupos", "…"]);

  if (!group) {
    return <PageSkeleton rows={3} side avatar="circle" trailing={56} />;
  }

  return (
    <>
      <div>
        <h2 className={typography.pageTitle}>Grupo {group.name}</h2>
        <p className={typography.pageSubtitle}>
          {group.members.length} membros · você é {me ? ROLE_LABEL[me.role].toLowerCase() : "membro"}.
        </p>
      </div>

      {error ? <div className={typography.errorText}>{error}</div> : null}

      <div className={layout.twoColGrid}>
        <div className={layout.colStack}>
          <div className={panels.card}>
            <PanelHeader title="Membros" />
            {group.members.map((m) => (
              <div key={m.id} className={`${rows.row} ${rows.borderTopOnly}`}>
                <span className={rows.avatar}>{initialsOf(m.user?.name ?? "?")}</span>
                <div className={rows.rowMain}>
                  <div className={rows.rowTitle}>{m.user?.name}</div>
                  <div className={rows.rowMeta}>{m.user?.email}</div>
                </div>
                <Badge tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Badge>
                {isOwner && m.role !== "OWNER" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={updateMemberRole.isPending}
                    onClick={() =>
                      updateMemberRole.mutate({ memberId: m.id, role: m.role === "ADMIN" ? "MEMBER" : "ADMIN" })
                    }
                  >
                    {m.role === "ADMIN" ? "Rebaixar a membro" : "Promover a admin"}
                  </Button>
                ) : null}
                {canManage && m.role !== "OWNER" && m.userId !== auth?.profile.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemovingMember({ id: m.id, name: m.user?.name ?? "esse membro" })}
                  >
                    Remover
                  </Button>
                ) : m.userId === auth?.profile.id ? (
                  <span className={typography.mutedTextSm}>Você</span>
                ) : null}
              </div>
            ))}
            <div className={panels.footerRow}>
              <span className={panels.footerNote}>
                Só o dono promove ou rebaixa admins. Dono e admins convidam e removem membros.
              </span>
              {canManage ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon="circle-plus"
                  onClick={() => router.push(`/grupos/${group.id}/convidar`)}
                >
                  Convidar membro
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={layout.colStack}>
          <div className={panels.card}>
            <PanelHeader title="Anotações do grupo" />
            <div className={panels.panelBody}>
              <div className={panels.panelBodyText}>
                Qualquer membro lê e escreve as anotações do grupo. Excluir fica com quem escreveu ou com admins.
              </div>
              <Button
                variant="secondary"
                block
                icon="file-text"
                onClick={() => router.push(`/anotacoes?grupo=${group.id}`)}
              >
                Ver anotações do grupo
              </Button>
            </div>
          </div>

          {canManage ? (
            <div className={panels.card}>
              <PanelHeader title="Nome do grupo" />
              <div className={`${panels.panelBody} ${panels.gapLg}`}>
                <Input
                  label="Nome"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
                <Button variant="secondary" block onClick={handleRename} disabled={renameGroup.isPending || !name}>
                  {renameGroup.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </div>
            </div>
          ) : null}

          {isOwner ? (
            <div className={panels.card}>
              <PanelHeader title="Zona de risco" />
              <div className={panels.panelBody}>
                <div className={panels.panelBodyText}>
                  Excluir o grupo remove os membros, convites e tudo o que foi criado nele. Os dados pessoais de cada
                  membro permanecem.
                </div>
                <Button variant="danger" block onClick={() => setConfirmDeleteGroup(true)}>
                  Excluir grupo
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={removingMember !== null}
        title={`Remover ${removingMember?.name ?? ""} do grupo?`}
        description="A pessoa perde acesso ao grupo imediatamente. Ela pode ser convidada de novo depois."
        confirmLabel="Remover"
        loading={removeMember.isPending}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemovingMember(null)}
      />

      <ConfirmDialog
        open={confirmDeleteGroup}
        title={`Excluir o grupo "${group.name}"?`}
        description="Tudo o que foi criado neste grupo é removido junto. Os dados pessoais dos membros permanecem. Essa ação não pode ser desfeita."
        loading={deleteGroup.isPending}
        onConfirm={handleDeleteGroup}
        onCancel={() => setConfirmDeleteGroup(false)}
      />
    </>
  );
}
