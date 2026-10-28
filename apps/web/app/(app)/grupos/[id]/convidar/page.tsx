"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Badge, Button, Icon, Input, PanelHeader, Select } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { ApiError } from "@/lib/api";
import { useCancelInvite, useGroup, useGroupInvites, useSendInvite } from "@/lib/queries/groups";
import panels from "@/styles/panels.module.css";
import rows from "@/styles/rows.module.css";
import styles from "./page.module.css";

const ROLE_LABEL: Record<"ADMIN" | "MEMBER", string> = { ADMIN: "Admin", MEMBER: "Membro" };
const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Membro — participa, sem gerenciar o grupo" },
  { value: "ADMIN", label: "Admin — convida, remove e configura o grupo" },
];

export default function InviteMemberPage() {
  const params = useParams<{ id: string }>();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = React.useState<string | null>(null);

  const { data: group } = useGroup(params.id);
  const { data: invites = [] } = useGroupInvites(params.id);
  const sendInvite = useSendInvite(params.id);
  const cancelInvite = useCancelInvite(params.id);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendInvite.mutateAsync({ email, role });
      setEmail("");
      setRole("MEMBER");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o convite.");
    }
  }

  async function handleCancel(inviteId: string) {
    await cancelInvite.mutateAsync(inviteId);
  }

  useShellMeta(["Grupos", { label: group?.name ?? "…", href: `/grupos/${params.id}` }, "Convidar membro"]);

  return (
    <>
      <div className={styles.grid}>
        <div>
          <h2 className={styles.title}>Convidar para o Grupo {group?.name ?? "…"}</h2>
          <p className={styles.subtitle}>O convidado entra no grupo assim que aceitar.</p>

          {error ? (
            <div className={styles.errorBanner}>
              <Icon name="circle-alert" size={15} color="var(--red-500)" />
              <div className={panels.panelBodyText}>{error}</div>
            </div>
          ) : null}

          <form onSubmit={handleInvite} className={styles.form}>
            <Input
              label="Email"
              type="email"
              placeholder="nome@email.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={sendInvite.isPending}
            />
            <Select
              label="Papel no grupo"
              value={role}
              options={ROLE_OPTIONS}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
              disabled={sendInvite.isPending}
            />
            <Button type="submit" variant="primary" size="lg" block disabled={sendInvite.isPending || !email}>
              {sendInvite.isPending ? "Enviando…" : "Enviar convite"}
            </Button>
          </form>
        </div>

        <div className={panels.card}>
          <PanelHeader title="Convites pendentes" />
          {invites.length === 0 ? (
            <div className={styles.emptyPanel}>
              <div className={styles.emptyIcon}>
                <Icon name="file-text" size={22} color="var(--text-faint)" />
              </div>
              <div className={styles.emptyTitle}>Nenhum convite pendente</div>
              <div className={styles.emptyDescription}>
                Convites enviados aparecem aqui até serem aceitos ou recusados.
              </div>
            </div>
          ) : (
            <>
              {invites.map((inv) => (
                <div key={inv.id} className={`${rows.row} ${rows.borderTopOnly}`}>
                  <div className={rows.rowMain}>
                    <div className={rows.rowTitle}>{inv.email}</div>
                    <div className={rows.rowMeta}>Enviado em {new Date(inv.createdAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <Badge tone="neutral">{ROLE_LABEL[inv.role]}</Badge>
                  <Badge tone="warning">Pendente</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(inv.id)}>
                    Cancelar
                  </Button>
                </div>
              ))}
              <div className={styles.footerCaption}>
                {invites.length} {invites.length === 1 ? "convite pendente" : "convites pendentes"} · Expiram em 7 dias
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
