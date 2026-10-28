"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ConfirmDialog, Icon, Input, PanelHeader, SkeletonRows } from "@app/ui";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  containsUserIdentifier,
  emailLocalPart,
  isPasswordDenylisted,
} from "@app/shared";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { PasswordField } from "@/components/auth/PasswordField";
import { useShellMeta } from "@/components/shell/ShellContext";
import { LoadingRegion, PageSkeleton } from "@/components/skeletons/Skeletons";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useGroups } from "@/lib/queries/groups";
import {
  useChangePassword,
  useDeleteAccount,
  useExportData,
  useProfileMe,
  useResendVerification,
  useRevokeSession,
  useSessions,
  useUpdateProfileName,
} from "@/lib/queries/profile";
import { describeUserAgent } from "@/lib/user-agent";
import styles from "./page.module.css";
import { APP_SLUG } from "@app/shared";

const ROLE_LABEL: Record<string, string> = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };
const ROLE_TONE: Record<string, "active" | "neutral"> = { OWNER: "active", ADMIN: "active", MEMBER: "neutral" };

export default function PerfilPage() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const { data: groups = null } = useGroups();
  const { data: profileMe } = useProfileMe();
  const resendVerification = useResendVerification();
  const [verificationSent, setVerificationSent] = React.useState(false);
  const { data: sessions } = useSessions();
  const revokeSession = useRevokeSession();
  const exportData = useExportData();
  const [exportError, setExportError] = React.useState<string | null>(null);
  const deleteAccount = useDeleteAccount();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleteError(null);
    try {
      await deleteAccount.mutateAsync(deletePassword);
      await logout();
      router.push("/login");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Não foi possível excluir a conta.");
    }
  }

  async function handleExport() {
    setExportError(null);
    try {
      const data = await exportData.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${APP_SLUG}-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Não foi possível gerar a exportação.");
    }
  }

  async function handleResendVerification() {
    setVerificationSent(false);
    await resendVerification.mutateAsync();
    setVerificationSent(true);
  }

  const [name, setName] = React.useState(auth?.profile.name ?? "");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [nameSaved, setNameSaved] = React.useState(false);
  const updateProfileName = useUpdateProfileName();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pwError, setPwError] = React.useState<string | null>(null);
  const [pwSaved, setPwSaved] = React.useState(false);
  const changePassword = useChangePassword();

  const newPasswordTooLong = newPassword.length > PASSWORD_MAX_LENGTH;
  const newPasswordWeak =
    newPassword.length > 0 &&
    (isPasswordDenylisted(newPassword) ||
      containsUserIdentifier(newPassword, [
        auth?.profile.name,
        auth?.profile.email ? emailLocalPart(auth.profile.email) : undefined,
      ]));
  const newPasswordValid = newPassword.length >= PASSWORD_MIN_LENGTH && !newPasswordTooLong && !newPasswordWeak;

  React.useEffect(() => {
    if (auth) setName(auth.profile.name);
  }, [auth]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setNameSaved(false);
    try {
      await updateProfileName.mutateAsync(name);
      setNameSaved(true);
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : "Não foi possível atualizar o nome.");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);
    if (newPassword !== confirmPassword) {
      setPwError("A confirmação não corresponde à nova senha.");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Não foi possível alterar a senha.");
    }
  }

  function handleLogout() {
    void logout();
    router.push("/login");
  }

  useShellMeta(["Perfil"]);

  if (!auth) {
    return <PageSkeleton rows={4} side avatar="none" />;
  }

  return (
    <>
      <h2 className={styles.title}>Perfil</h2>
      <p className={styles.subtitle}>Seus dados de acesso e os espaços dos quais você participa.</p>

      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.card}>
            <PanelHeader title="Dados pessoais" />
            <div className={styles.cardBody}>
              {nameError ? (
                <div className={styles.errorBanner}>
                  <Icon name="circle-alert" size={15} color="var(--red-500)" />
                  <div className={styles.errorText}>{nameError}</div>
                </div>
              ) : null}
              <form onSubmit={handleSaveName}>
                <div className={styles.formStack}>
                  <Input
                    label="Nome"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setName(e.target.value);
                      setNameSaved(false);
                    }}
                    disabled={updateProfileName.isPending}
                  />
                  <Input label="E-mail" value={auth.profile.email} disabled />
                </div>
                <div className={styles.formFooter}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={updateProfileName.isPending || !name || name === auth.profile.name}
                  >
                    {updateProfileName.isPending ? "Salvando…" : "Salvar alterações"}
                  </Button>
                  {nameSaved ? <span className={styles.successNote}>Nome atualizado.</span> : null}
                </div>
              </form>

              <div className={styles.verifyRow}>
                {profileMe?.emailVerifiedAt ? (
                  <Badge tone="positive">E-mail verificado</Badge>
                ) : (
                  <>
                    <Badge tone="warning">E-mail não verificado</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resendVerification.isPending}
                      onClick={handleResendVerification}
                    >
                      {resendVerification.isPending ? "Enviando…" : "Reenviar e-mail de verificação"}
                    </Button>
                    {verificationSent ? <span className={styles.successNote}>Enviado.</span> : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <PanelHeader title="Alterar senha" />
            <div className={styles.cardBody}>
              {pwError ? (
                <div className={styles.errorBanner}>
                  <Icon name="circle-alert" size={15} color="var(--red-500)" />
                  <div className={styles.errorText}>{pwError}</div>
                </div>
              ) : null}
              <form onSubmit={handleChangePassword}>
                <div className={styles.formStack}>
                  <PasswordField
                    label="Senha atual"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    disabled={changePassword.isPending}
                  />
                  <div>
                    <PasswordField
                      label="Nova senha"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      invalid={newPasswordTooLong || newPasswordWeak}
                      disabled={changePassword.isPending}
                    />
                    <PasswordChecklist
                      password={newPassword}
                      identifiers={[auth.profile.name, emailLocalPart(auth.profile.email)]}
                    />
                  </div>
                  <PasswordField
                    label="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    disabled={changePassword.isPending}
                  />
                </div>
                <div className={styles.formFooter}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={changePassword.isPending || !currentPassword || !newPasswordValid || !confirmPassword}
                  >
                    {changePassword.isPending ? "Alterando…" : "Alterar senha"}
                  </Button>
                  {pwSaved ? <span className={styles.successNote}>Senha alterada.</span> : null}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.card}>
            <PanelHeader title="Seus espaços" />
            <div className={groups && groups.length > 0 ? styles.listBodyTight : styles.listBodyLoose}>
              {!groups ? (
                <LoadingRegion>
                  <SkeletonRows count={2} avatar="none" trailing={56} />
                </LoadingRegion>
              ) : groups.length === 0 ? (
                <div className={styles.emptyNote}>Você ainda não participa de nenhum espaço compartilhado.</div>
              ) : (
                <div className={styles.listStack}>
                  {groups.map((g) => {
                    const me = g.members.find((m) => m.userId === auth.profile.id);
                    return (
                      <div key={g.id} className={styles.listRow}>
                        <div className={styles.listRowMain}>
                          <div className={styles.listRowTitle}>{g.name}</div>
                          <div className={styles.listRowMeta}>{g.members.length} membros</div>
                        </div>
                        {me ? <Badge tone={ROLE_TONE[me.role]}>{ROLE_LABEL[me.role]}</Badge> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <PanelHeader title="Sessões ativas" />
            <div className={sessions && sessions.length > 0 ? styles.listBodyTight : styles.listBodyLoose}>
              {!sessions ? (
                <LoadingRegion>
                  <SkeletonRows count={2} avatar="none" trailing={56} />
                </LoadingRegion>
              ) : sessions.length === 0 ? (
                <div className={styles.emptyNote}>Nenhuma sessão ativa.</div>
              ) : (
                <div className={styles.listStack}>
                  {sessions.map((s) => (
                    <div key={s.id} className={styles.listRowGap}>
                      <div className={styles.listRowMain}>
                        <div className={styles.listRowTitlePlain}>{describeUserAgent(s.userAgent)}</div>
                        <div className={styles.listRowMeta}>
                          Desde {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revokeSession.isPending}
                        onClick={() => revokeSession.mutate(s.id)}
                      >
                        Encerrar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <PanelHeader title="Seus dados" />
            <div className={styles.cardBody}>
              {exportError ? (
                <div className={styles.errorBanner}>
                  <Icon name="circle-alert" size={15} color="var(--red-500)" />
                  <div className={styles.errorText}>{exportError}</div>
                </div>
              ) : null}
              <p className={styles.bodyText}>Baixe uma cópia dos seus dados pessoais em JSON.</p>
              <Button
                variant="secondary"
                size="md"
                icon="download"
                disabled={exportData.isPending}
                onClick={handleExport}
              >
                {exportData.isPending ? "Gerando…" : "Baixar meus dados"}
              </Button>
            </div>
          </div>

          <div className={styles.card}>
            <PanelHeader title="Sessão" />
            <div className={styles.cardBody}>
              <p className={styles.bodyText}>Encerrar sua sessão neste dispositivo.</p>
              <Button variant="secondary" size="md" icon="log-out" onClick={handleLogout}>
                Sair da conta
              </Button>
            </div>
          </div>

          <div className={`${styles.card} ${styles.danger}`}>
            <PanelHeader title="Zona de risco" />
            <div className={styles.cardBody}>
              <p className={styles.bodyText}>
                Exclui sua conta e todos os seus dados pessoais para sempre. Não pode ser desfeito.
              </p>
              <Button
                variant="secondary"
                size="md"
                icon="trash-2"
                onClick={() => {
                  setDeleteError(null);
                  setDeletePassword("");
                  setDeleteDialogOpen(true);
                }}
              >
                Excluir minha conta
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Excluir sua conta?"
        confirmLabel={deleteAccount.isPending ? "Excluindo…" : "Excluir definitivamente"}
        loading={deleteAccount.isPending}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        description={
          <div className={styles.deleteDescStack}>
            <p className={styles.deleteDescPara}>
              Isso apaga seus dados pessoais pra sempre. Se você for dono de algum grupo com outros membros, transfira a
              posse ou exclua o grupo antes de continuar.
            </p>
            {deleteError ? (
              <div className={styles.deleteErrorBanner}>
                <Icon name="circle-alert" size={15} color="var(--red-500)" />
                <div className={styles.errorText}>{deleteError}</div>
              </div>
            ) : null}
            <PasswordField
              label="Confirme sua senha"
              value={deletePassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeletePassword(e.target.value)}
              disabled={deleteAccount.isPending}
            />
          </div>
        }
      />
    </>
  );
}
