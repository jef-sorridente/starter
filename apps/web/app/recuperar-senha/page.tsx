"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Icon, Input } from "@app/ui";
import { APP_NAME } from "@app/shared";
import { AuthSplit } from "../../components/auth/AuthSplit";
import { apiFetch, ApiError } from "../../lib/api";
import auth_ from "../../styles/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // A API sempre responde sem revelar se o e-mail existe (evita
      // que esse formulário vire um jeito de descobrir quem tem conta).
      await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o e-mail agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit leftHeadline={<p className={auth_.sideHeadline}>O link de redefinição vale por 30 minutos.</p>}>
      <Link href="/login" className={auth_.backLink}>
        ← Voltar para o login
      </Link>
      <h2 className={`${auth_.formTitle} ${auth_.mt}`}>Redefinir sua senha</h2>

      {submitted ? (
        <div className={`${auth_.errorBanner} ${auth_.neutral}`}>
          <Icon name="mail-check" size={15} color="var(--text-secondary)" />
          <div className={auth_.errorBannerText}>
            Se <strong>{email}</strong> tiver uma conta no {APP_NAME}, enviamos um link de redefinição pra esse e-mail.
          </div>
        </div>
      ) : (
        <>
          <p className={auth_.formSubtitle}>
            Informe o email da conta. Enviamos um link para você criar uma senha nova.
          </p>

          {error ? (
            <div className={auth_.errorBanner}>
              <Icon name="circle-alert" size={15} color="var(--red-500)" />
              <div className={auth_.errorBannerText}>{error}</div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className={`${auth_.form} ${auth_.loose}`}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" variant="primary" size="lg" block disabled={loading || !email}>
              {loading ? "Enviando…" : "Enviar link"}
            </Button>
          </form>
        </>
      )}
    </AuthSplit>
  );
}
