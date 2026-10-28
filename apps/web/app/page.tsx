"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark, Button, Icon, Reveal } from "@app/ui";
import { APP_NAME } from "@app/shared";
import { useAuth } from "../lib/auth-context";
import { HOME_ROUTE } from "../lib/routes";
import styles from "./page.module.css";

// Tela pública de entrada. Num projeto novo, troque headline, título e
// a lista de recursos pela proposta de valor do produto.
const FEATURES = [
  { icon: "shield-check", label: "Conta protegida, com sessões por dispositivo" },
  { icon: "users", label: "Grupos com convites e papéis" },
  { icon: "bell", label: "Notificações e preferências por tipo" },
];

export default function WelcomePage() {
  const router = useRouter();
  const { auth, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && auth) router.replace(HOME_ROUTE);
  }, [loading, auth, router]);

  if (loading || auth) return null;

  return (
    <div className={styles.page}>
      <Reveal y={0} className={styles.sidebar}>
        <BrandMark name={APP_NAME} size={22} tone="inverse" />
        <p className={styles.headline}>Tudo o que importa, num lugar só.</p>
        <span />
      </Reveal>

      <main className={styles.main}>
        <Reveal delay={0.08} className={styles.mainInner}>
          <h1 className={styles.title}>{APP_NAME}</h1>
          <p className={styles.subtitle}>Entre com sua conta ou crie uma nova para começar.</p>
          <div className={styles.actions}>
            <Link href="/login">
              <Button variant="primary" size="lg" block>
                Entrar
              </Button>
            </Link>
            <Link href="/registrar">
              <Button variant="secondary" size="lg" block>
                Criar conta
              </Button>
            </Link>
          </div>
          <ul className={styles.featureList}>
            {FEATURES.map((f) => (
              <li key={f.icon} className={styles.featureItem}>
                <Icon name={f.icon} size={14} color="var(--text-faint)" />
                {f.label}
              </li>
            ))}
          </ul>
        </Reveal>
      </main>
    </div>
  );
}
