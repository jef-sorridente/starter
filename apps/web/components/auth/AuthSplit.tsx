import { BrandMark, Reveal } from "@app/ui";
import { APP_NAME } from "@app/shared";
import styles from "./AuthSplit.module.css";

// Layout compartilhado pelas telas de autenticação (Login, Cadastro,
// Recuperação de senha, Convite) — painel esquerdo fixo (marca +
// contexto), painel direito com o formulário. Ocupa a viewport real.
export function AuthSplit({
  leftHeadline,
  leftFooter,
  children,
}: {
  leftHeadline: React.ReactNode;
  leftFooter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.sidebar}>
        <BrandMark name={APP_NAME} size={22} tone="inverse" />
        {leftHeadline}
        {leftFooter ?? <div className={styles.footer}>{APP_NAME}</div>}
      </div>
      <div className={styles.main}>
        <Reveal className={styles.reveal}>{children}</Reveal>
      </div>
    </div>
  );
}
