"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, Input } from "@app/ui";
import { AuthSplit } from "../../components/auth/AuthSplit";
import { PasswordField } from "../../components/auth/PasswordField";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";
import auth_ from "../../styles/auth.module.css";
import { HOME_ROUTE } from "../../lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const { auth, loading: authLoading, login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && auth) router.replace(HOME_ROUTE);
  }, [authLoading, auth, router]);

  if (authLoading || auth) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(HOME_ROUTE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit leftHeadline={<p className={auth_.sideHeadline}>Bem-vindo de volta.</p>}>
      <h2 className={auth_.formTitle}>Entrar na sua conta</h2>
      <p className={auth_.formSubtitle}>Use o email cadastrado.</p>

      {error ? (
        <div className={auth_.errorBanner}>
          <Icon name="circle-alert" size={15} color="var(--red-500)" />
          <div className={auth_.errorBannerText}>{error}</div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={auth_.form}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          invalid={Boolean(error)}
          disabled={loading}
        />
        <PasswordField
          label="Senha"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          invalid={Boolean(error)}
          disabled={loading}
        />
        <div className={auth_.formRowEnd}>
          <Link href="/recuperar-senha" className={auth_.inlineLink}>
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block disabled={loading || !email || !password}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <p className={auth_.footerText}>
        Ainda não tem conta?{" "}
        <Link href="/registrar" className={auth_.inlineLink}>
          Criar conta
        </Link>
      </p>
    </AuthSplit>
  );
}
