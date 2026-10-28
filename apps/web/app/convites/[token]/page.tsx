"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@app/ui";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useMyInvites, useRespondInvite } from "@/lib/queries/groups";
import auth_ from "@/styles/auth.module.css";
import styles from "./page.module.css";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { auth, loading: authLoading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const { data: invites, isLoading: invitesLoading } = useMyInvites();
  const invite = invites?.find((i) => i.token === params.token) ?? null;
  const respondInvite = useRespondInvite();

  React.useEffect(() => {
    if (authLoading) return;
    if (!auth) router.push("/login");
  }, [auth, authLoading, router]);

  async function respond(action: "accept" | "decline") {
    setError(null);
    try {
      await respondInvite.mutateAsync({ token: params.token, action });
      router.push("/grupos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível processar sua resposta.");
    }
  }

  if (!auth || invitesLoading) return null;

  return (
    <AuthSplit
      leftHeadline={<p className={auth_.sideHeadline}>Ao aceitar, você passa a ver e editar o que é do grupo.</p>}
    >
      {!invite ? (
        <>
          <h2 className={auth_.formTitle}>Convite não encontrado</h2>
          <p className={auth_.formSubtitle}>Esse convite pode ter expirado, sido cancelado, ou já foi respondido.</p>
          <div className={styles.notFoundActions}>
            <Button variant="secondary" onClick={() => router.push("/grupos")}>
              Ver meus grupos
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.eyebrow}>Convite de grupo</div>
          <h2 className={styles.title}>Grupo {invite.group?.name}</h2>
          <p className={styles.subtitle}>
            Você foi convidado como <span style={{ color: "var(--text-primary)" }}>membro</span>.
          </p>

          <div className={styles.card}>
            <div className={styles.cardRow}>
              <span>Membros</span>
              <span style={{ color: "var(--text-primary)" }}>{invite.group?.members.length ?? 0}</span>
            </div>
            <div className={styles.cardRow}>
              <span>Convite expira em</span>
              <span style={{ color: "var(--text-primary)" }}>
                {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {error ? <div className={styles.errorText}>{error}</div> : null}

          <div className={styles.actions}>
            <Button variant="primary" size="lg" onClick={() => respond("accept")} disabled={respondInvite.isPending}>
              Aceitar
            </Button>
            <Button variant="secondary" size="lg" onClick={() => respond("decline")} disabled={respondInvite.isPending}>
              Recusar
            </Button>
          </div>
          <p className={styles.footerNote}>
            Seus dados pessoais continuam privados — só o que é do grupo é compartilhado.
          </p>
        </>
      )}
    </AuthSplit>
  );
}
