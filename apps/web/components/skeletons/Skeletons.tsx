"use client";

import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonRows } from "@app/ui";
import type { SkeletonRowsProps } from "@app/ui";
import layout from "@/styles/layout.module.css";
import panels from "@/styles/panels.module.css";
import styles from "./Skeletons.module.css";

// Composições de skeleton por formato de tela, montadas com os
// primitivos de @app/ui. Cada tela escolhe a combinação que imita o
// próprio layout, pra troca skeleton -> conteúdo não "pular".

// Anuncia o carregamento pra leitor de tela uma vez só — os blocos em si
// são aria-hidden.
export function LoadingRegion({ label = "Carregando…", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={styles.region}>
      <span className={styles.srOnly}>{label}</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className={styles.header} aria-hidden="true">
      <Skeleton width={280} height={30} radius={6} />
      <Skeleton width={200} height={11} tone="soft" />
    </div>
  );
}

export function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.statGrid} style={{ "--columns": count } as React.CSSProperties}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Painel com cabeçalho + linhas — listas (anotações, membros,
// notificações etc.).
export function ListPanelSkeleton({
  rows = 6,
  header = true,
  ...rowProps
}: { rows?: number; header?: boolean } & Omit<SkeletonRowsProps, "count">) {
  return (
    <div className={panels.card}>
      {header ? (
        <div className={panels.cardHeader}>
          <Skeleton width={120} height={10} />
        </div>
      ) : null}
      <SkeletonRows count={rows} {...rowProps} />
    </div>
  );
}

// Grade de cards (espaços, painéis de resumo).
export function CardGridSkeleton({
  count = 3,
  columns = 3,
  height = 150,
}: {
  count?: number;
  columns?: number;
  height?: number;
}) {
  return (
    <div className={styles.cardGrid} style={{ "--columns": columns } as React.CSSProperties}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} style={{ minHeight: height }}>
          <Skeleton pulse={false} width={28} height={28} radius={8} />
          <Skeleton pulse={false} width={i % 2 ? "48%" : "60%"} height={12} />
          <Skeleton pulse={false} width="36%" height={9} tone="soft" />
          <span style={{ flex: 1 }} />
          <Skeleton pulse={false} width="100%" height={6} tone="soft" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className={`${styles.formCard} ds-pulse`} aria-hidden="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className={styles.field}>
          <Skeleton pulse={false} width={i % 2 ? 90 : 120} height={9} tone="soft" />
          <Skeleton pulse={false} height="var(--field-height)" radius="var(--radius-md)" />
        </div>
      ))}
      <Skeleton pulse={false} width={160} height="var(--field-height)" radius="var(--radius-md)" />
    </div>
  );
}

// Página inteira pra quem hoje devolve um "Carregando…" solto antes de
// ter os dados do cabeçalho: título + (stats) + lista, opcionalmente
// com uma coluna lateral (layout twoColGrid).
export function PageSkeleton({
  stats = 0,
  rows = 6,
  side = false,
  sideRows = 3,
  ...rowProps
}: { stats?: number; rows?: number; side?: boolean; sideRows?: number } & Omit<SkeletonRowsProps, "count">) {
  const main = <ListPanelSkeleton rows={rows} {...rowProps} />;
  return (
    <LoadingRegion>
      <PageHeaderSkeleton />
      {stats > 0 ? <StatGridSkeleton count={stats} /> : null}
      {side ? (
        <div className={layout.twoColGrid}>
          {main}
          <div className={layout.colStack}>
            <ListPanelSkeleton rows={sideRows} avatar="none" lines={1} trailing={48} />
            <SkeletonCard height={120} />
          </div>
        </div>
      ) : (
        main
      )}
    </LoadingRegion>
  );
}
