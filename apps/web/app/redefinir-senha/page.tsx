"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Icon } from "@app/ui";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isPasswordDenylisted } from "@app/shared";
import { AuthSplit } from "../../components/auth/AuthSplit";
import { PasswordChecklist } from "../../components/auth/PasswordChecklist";
import { PasswordField } from "../../components/auth/PasswordField";
import { apiFetch, ApiError } from "../../lib/api";
import auth_ from "../../styles/auth.module.css";

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const passwordTooShort = newPassword.length > 0 && newPassword.length < PASSWORD_MIN_LENGTH;
  const passwordTooLong = newPassword.length > PASSWORD_MAX_LENGTH;
  const passwordWeak = newPassword.length > 0 && isPasswordDenylisted(newPassword);
  const passwordValid = newPassword.length >= PASSWORD_MIN_LENGTH && !passwordTooLong && !passwordWeak;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", { method: "POST", body: { token, newPassword } });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit leftHeadline={<p className={auth_.sideHeadline}>Escolha uma senha nova.</p>}>
      <h2 className={auth_.formTitle}>Redefinir senha</h2>

      {!token ? (
        <div className={auth_.errorBanner}>
          <Icon name="circle-alert" size={15} color="var(--red-500)" />
          <div className={auth_.errorBannerText}>
            Link inválido — falta o token de redefinição. Peça um novo link em{" "}
            <Link href="/recuperar-senha">Esqueci minha senha</Link>.
          </div>
        </div>
      ) : done ? (
        <div className={`${auth_.errorBanner} ${auth_.neutral}`}>
          <Icon name="check" size={15} color="var(--text-secondary)" />
          <div className={auth_.errorBannerText}>
            Senha redefinida. Todas as suas sessões anteriores foram encerradas — entre de novo com a senha nova.
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <div className={auth_.errorBanner}>
              <Icon name="circle-alert" size={15} color="var(--red-500)" />
              <div className={auth_.errorBannerText}>{error}</div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className={auth_.form}>
            <div>
              <PasswordField
                label="Nova senha"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                invalid={passwordTooShort || passwordTooLong || passwordWeak}
                disabled={loading}
              />
              <PasswordChecklist password={newPassword} />
            </div>
            <PasswordField
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              hint={passwordsMismatch ? "As senhas não coincidem." : undefined}
              invalid={passwordsMismatch}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              disabled={loading || !passwordValid || !confirmPassword}
            >
              {loading ? "Redefinindo…" : "Redefinir senha"}
            </Button>
          </form>
        </>
      )}

      {done ? (
        <Button
          variant="secondary"
          size="lg"
          block
          className={auth_.actionSpacer}
          onClick={() => router.push("/login")}
        >
          Ir para o login
        </Button>
      ) : null}
    </AuthSplit>
  );
}
