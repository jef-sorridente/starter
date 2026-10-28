"use client";

import * as React from "react";

// `href` torna o item clicável no breadcrumb do header. O primeiro item
// (seção do menu: "Contas", "Cartões"...) não precisa dele — o
// AppShellFrame resolve a rota pelo rótulo da sidebar.
export type ShellBreadcrumb = string | { label: string; href?: string };

export interface ShellMeta {
  breadcrumbs: ShellBreadcrumb[];
  headerRight?: React.ReactNode;
}

// Split into two contexts on purpose: the setter never changes identity
// (it's a useState setter), so pages that only call useShellMeta (write
// side) never re-render when the meta value changes elsewhere. Only
// AppShellFrame reads the value context, so only it re-renders on updates.
// Collapsing these into one `{ meta, setMeta }` object recreated every
// render made every page a value-consumer too — publishing a breadcrumb
// re-rendered the page, which re-ran the effect, which published again,
// forever (Maximum update depth exceeded).
const ShellMetaValueContext = React.createContext<ShellMeta | undefined>(undefined);
const ShellMetaSetterContext = React.createContext<((meta: ShellMeta) => void) | undefined>(undefined);

export function ShellMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = React.useState<ShellMeta>({ breadcrumbs: [] });
  return (
    <ShellMetaSetterContext.Provider value={setMeta}>
      <ShellMetaValueContext.Provider value={meta}>{children}</ShellMetaValueContext.Provider>
    </ShellMetaSetterContext.Provider>
  );
}

export function useShellFrameMeta() {
  const meta = React.useContext(ShellMetaValueContext);
  if (!meta) throw new Error("useShellFrameMeta must be used within the (app) route group");
  return meta;
}

// Pages call this to publish their breadcrumbs / header actions to the
// persistent AppShellFrame (see apps/web/app/(app)/layout.tsx). Runs in
// useLayoutEffect, synchronously after render but before paint, so the
// previous page's breadcrumb never flashes on screen.
export function useShellMeta(breadcrumbs: ShellMeta["breadcrumbs"], headerRight?: React.ReactNode) {
  const setMeta = React.useContext(ShellMetaSetterContext);
  if (!setMeta) throw new Error("useShellMeta must be used within the (app) route group");

  const breadcrumbsKey = JSON.stringify(breadcrumbs);
  React.useLayoutEffect(() => {
    setMeta({ breadcrumbs, headerRight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbsKey, headerRight]);
}
