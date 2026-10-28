"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Breadcrumb, BrandMark, IconButton, PageTransition, SidebarNav } from "@app/ui";
import { APP_NAME } from "@app/shared";
import { useAuth } from "../../lib/auth-context";
import { useProfileMe } from "../../lib/queries/profile";
import { useShellFrameMeta, type ShellBreadcrumb } from "./ShellContext";
import { HeaderNotifications } from "./HeaderNotifications";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { NAV_ITEMS, NAV_SECTIONS, activeNavItem } from "./navigation";
import styles from "./AppShellFrame.module.css";

// Rótulo da sidebar -> rota, pro primeiro item do breadcrumb (toda página
// começa o breadcrumb pelo nome da seção do menu).
const ROUTE_BY_LABEL: Record<string, string> = Object.fromEntries(NAV_ITEMS.map((item) => [item.label, item.href]));

const ROUTE_BY_ID: Record<string, string> = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item.href]));

function toBreadcrumbItems(breadcrumbs: ShellBreadcrumb[]) {
  return breadcrumbs.map((b, i) => {
    const item = typeof b === "string" ? { label: b } : b;
    const href = item.href ?? (i === 0 ? ROUTE_BY_LABEL[item.label] : undefined);
    return { label: item.label, href };
  });
}

// O shell (sidebar + header) fica no layout de (app) e é montado uma única
// vez — antes cada página renderizava o próprio <AppShell>, então trocar de
// rota desmontava e remontava a sidebar inteira a cada clique. Agora só o
// conteúdo de `children` troca (ver PageTransition); breadcrumbs/headerRight
// chegam via useShellMeta, chamado por cada página.
export function AppShellFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, loading } = useAuth();
  const { data: profileMe } = useProfileMe();
  const { breadcrumbs, headerRight } = useShellFrameMeta();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !auth) router.push("/login");
  }, [loading, auth, router]);

  // Bloqueia todo o painel até o e-mail ser verificado — evita múltiplos
  // acessos com uma conta cujo dono ainda não confirmou ser dele.
  React.useEffect(() => {
    if (auth && profileMe && !profileMe.emailVerifiedAt) router.replace("/verificar-email-pendente");
  }, [auth, profileMe, router]);

  // Fecha o menu off-canvas ao navegar — sem isso a sidebar ficava
  // aberta por cima da tela nova depois de tocar num item do menu.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Esc fecha o menu off-canvas — quem navega por teclado não tem como
  // "clicar fora".
  React.useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  if (loading || !auth) return null;
  if (!profileMe || !profileMe.emailVerifiedAt) return null;

  return (
    <div className={styles.wrap}>
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className={styles.overlay}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.open : ""}`}>
        <div className={styles.brand}>
          <BrandMark name={APP_NAME} size={17} tone="inverse" />
        </div>
        <SidebarNav
          sections={NAV_SECTIONS}
          activeId={activeNavItem(pathname)?.id}
          onSelect={(id: string) => router.push(ROUTE_BY_ID[id] ?? "/")}
          width="100%"
        />
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.menuButton}>
              <IconButton icon="menu" label="Abrir menu" onClick={() => setMobileNavOpen((v) => !v)} />
            </span>
            <Breadcrumb
              items={toBreadcrumbItems(breadcrumbs)}
              onSelect={(item) => {
                const href = typeof item === "string" ? undefined : item.href;
                if (typeof href === "string") router.push(href);
              }}
            />
          </div>
          <div className={styles.headerRight}>
            {headerRight}
            <span className={styles.searchSlot}>
              <HeaderSearch />
            </span>
            <HeaderNotifications />
            <HeaderUserMenu />
          </div>
        </header>
        <main className={styles.content}>
          <PageTransition routeKey={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
