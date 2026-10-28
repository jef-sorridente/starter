"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, Input } from "@app/ui";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  containsUserIdentifier,
  emailLocalPart,
  isPasswordDenylisted,
} from "@app/shared";
import { AuthSplit } from "../../components/auth/AuthSplit";
import { PasswordChecklist } from "../../components/auth/PasswordChecklist";
import { PasswordField } from "../../components/auth/PasswordField";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";
import auth_ from "../../styles/auth.module.css";
import { HOME_ROUTE } from "../../lib/routes";

export default function RegisterPage() {
  const router = useRouter();
  const { auth, loading: authLoading, register } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && auth) router.replace(HOME_ROUTE);
  }, [authLoading, auth, router]);

  if (authLoading || auth) return null;

  const passwordTooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;
  const passwordTooLong = password.length > PASSWORD_MAX_LENGTH;
  const passwordWeak =
    password.length > 0 &&
    (isPasswordDenylisted(password) || containsUserIdentifier(password, [name, emailLocalPart(email)]));
  const passwordValid = password.length >= PASSWORD_MIN_LENGTH && !passwordTooLong && !passwordWeak;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = name && email && passwordValid && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      router.push(HOME_ROUTE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit
      leftHeadline={
        <div>
          <p className={auth_.sideHeadline}>Comece em menos de um minuto.</p>
          <div className={auth_.sideFeatureList}>
            {[
              { icon: "circle-plus", label: "Crie sua conta com e-mail e senha" },
              { icon: "users", label: "Convide quem quiser para um grupo" },
              { icon: "bell", label: "Receba avisos do que importa" },
            ].map((f) => (
              <div key={f.icon} className={auth_.sideFeatureItem}>
                <Icon name={f.icon} size={14} color="var(--text-faint)" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      }
    >
      <h2 className={auth_.formTitle}>Criar sua conta</h2>
      <p className={auth_.formSubtitle}>Você começa no espaço Pessoal. Grupos vêm depois.</p>

      {error ? (
        <div className={auth_.errorBanner}>
          <Icon name="circle-alert" size={15} color="var(--red-500)" />
          <div className={auth_.errorBannerText}>{error}</div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={`${auth_.form} ${auth_.tight}`}>
        <Input
          label="Nome"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          disabled={loading}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={loading}
        />
        <div>
          <PasswordField
            label="Senha"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            invalid={passwordTooShort || passwordTooLong || passwordWeak}
            disabled={loading}
          />
          <PasswordChecklist password={password} identifiers={[name, emailLocalPart(email)]} />
        </div>
        <PasswordField
          label="Confirmar senha"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          hint={passwordsMismatch ? "As senhas não coincidem." : undefined}
          invalid={passwordsMismatch}
          disabled={loading}
        />
        <Button type="submit" variant="primary" size="lg" block disabled={loading || !canSubmit}>
          {loading ? "Criando…" : "Criar conta"}
        </Button>
      </form>
      <p className={`${auth_.footerText} ${auth_.tight}`}>
        Já tem conta?{" "}
        <Link href="/login" className={auth_.inlineLink}>
          Entrar
        </Link>
      </p>
    </AuthSplit>
  );
}
