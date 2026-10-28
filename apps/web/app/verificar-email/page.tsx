"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@app/ui";
import { AuthSplit } from "../../components/auth/AuthSplit";
import { apiFetch, ApiError } from "../../lib/api";
import { HOME_ROUTE } from "../../lib/routes";
import auth_ from "../../styles/auth.module.css";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = React.useState<Status>("loading");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link inválido — falta o token de verificação.");
      return;
    }
    apiFetch("/auth/verify-email", { method: "POST", body: { token } })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Não foi possível verificar seu e-mail.");
      });
  }, [token]);

  return (
    <AuthSplit leftHeadline={<p className={auth_.sideHeadline}>Confirmando seu e-mail.</p>}>
      <h2 className={auth_.formTitle}>Verificação de e-mail</h2>

      {status === "loading" ? (
        <p className={`${auth_.formSubtitle} ${auth_.mt}`}>Verificando…</p>
      ) : status === "success" ? (
        <div className={`${auth_.errorBanner} ${auth_.neutral}`}>
          <Icon name="check" size={15} color="var(--text-secondary)" />
          <div className={auth_.errorBannerText}>
            E-mail verificado. <Link href={HOME_ROUTE}>Ir para o início</Link>.
          </div>
        </div>
      ) : (
        <div className={auth_.errorBanner}>
          <Icon name="circle-alert" size={15} color="var(--red-500)" />
          <div className={auth_.errorBannerText}>
            {message} Você pode pedir um novo link em <Link href="/perfil">Perfil</Link> depois de entrar.
          </div>
        </div>
      )}
    </AuthSplit>
  );
}
