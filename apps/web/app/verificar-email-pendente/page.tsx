"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@app/ui";
import { AuthSplit } from "../../components/auth/AuthSplit";
import { useAuth } from "../../lib/auth-context";
import { useProfileMe, useResendVerification } from "../../lib/queries/profile";
import { HOME_ROUTE } from "../../lib/routes";
import auth_ from "../../styles/auth.module.css";

// Gate de acesso: AppShellFrame redireciona pra cá qualquer usuário
// autenticado cujo e-mail ainda não foi verificado, antes de montar a
// sidebar/rotas do painel. Fora do grupo (app) de propósito — senão o
// próprio redirect da verificação entraria em loop com o layout.
export default function VerificarEmailPendentePage() {
  const router = useRouter();
  const { auth, loading, logout } = useAuth();
  const { data: profileMe } = useProfileMe();
  const resendVerification = useResendVerification();
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !auth) router.replace("/login");
  }, [loading, auth, router]);

  React.useEffect(() => {
    if (profileMe?.emailVerifiedAt) router.replace(HOME_ROUTE);
  }, [profileMe, router]);

  async function handleResend() {
    setSent(false);
    await resendVerification.mutateAsync();
    setSent(true);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading || !auth) return null;

  return (
    <AuthSplit leftHeadline={<p className={auth_.sideHeadline}>Confirme seu e-mail para continuar.</p>}>
      <h2 className={auth_.formTitle}>Verifique seu e-mail</h2>
      <p className={`${auth_.formSubtitle} ${auth_.mt}`}>
        Enviamos um link de confirmação para <strong>{auth.profile.email}</strong>. Confirme pra liberar o acesso ao
        painel.
      </p>

      <div className={`${auth_.errorBanner} ${auth_.neutral}`}>
        <Icon name="mail" size={15} color="var(--text-secondary)" />
        <div className={auth_.errorBannerText}>Não recebeu? Confira o spam ou peça um novo link.</div>
      </div>

      <div className={auth_.form}>
        <Button variant="primary" size="lg" block disabled={resendVerification.isPending} onClick={handleResend}>
          {resendVerification.isPending ? "Enviando…" : "Reenviar e-mail de verificação"}
        </Button>
        {sent ? <span className={auth_.formSubtitle}>Enviado.</span> : null}
        <Button variant="secondary" size="lg" block onClick={handleLogout}>
          Sair da conta
        </Button>
      </div>
    </AuthSplit>
  );
}
