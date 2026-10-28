import * as React from "react";

// Placeholders de carregamento: blocos na cor --skeleton-* pulsando com
// `ds-pulse` (tokens/motion.css).
// Tudo aqui é aria-hidden — quem anuncia "carregando" pra leitor de tela
// é o container da página (ex.: role="status" em volta).

type Size = number | string;

function px(value: Size | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : value;
}

export interface SkeletonProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  width?: Size;
  height?: Size;
  radius?: Size;
  // strong = linha principal / ícone; soft = linha secundária.
  tone?: "strong" | "soft";
  circle?: boolean;
  // Dentro de um SkeletonRows/SkeletonCard o pai já pulsa — a barra não
  // pode pulsar de novo (as duas animações se multiplicariam).
  pulse?: boolean;
}

function Skeleton({
  width = "100%",
  height = 11,
  radius = 4,
  tone = "strong",
  circle = false,
  pulse = true,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={[pulse ? "ds-pulse" : null, className].filter(Boolean).join(" ") || undefined}
      style={{
        display: "block",
        flex: "none",
        width: px(width),
        height: px(height),
        borderRadius: circle ? 999 : px(radius),
        background: tone === "strong" ? "var(--skeleton-strong)" : "var(--skeleton-soft)",
        ...style,
      }}
      {...rest}
    />
  );
}

// Larguras das barras copiadas do design, alternadas pra lista não
// parecer uma grade — [linha principal, linha secundária].
const ROW_WIDTHS: Array<[string, string]> = [
  ["46%", "62%"],
  ["38%", "54%"],
  ["52%", "44%"],
  ["42%", "58%"],
  ["49%", "40%"],
  ["36%", "50%"],
  ["44%", "60%"],
];

export interface SkeletonRowsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  count?: number;
  // square = ícone 28px (contas, transações, categorias); circle = avatar
  // 32px (membros de grupo); none = sem ícone.
  avatar?: "square" | "circle" | "none";
  lines?: 1 | 2;
  // Largura da barra à direita (valor, badge…); null = sem.
  trailing?: Size | null;
}

function SkeletonRows({ count = 5, avatar = "square", lines = 2, trailing = 84, style, ...rest }: SkeletonRowsProps) {
  return (
    <div aria-hidden="true" style={style} {...rest}>
      {Array.from({ length: count }, (_, i) => {
        const [w1, w2] = ROW_WIDTHS[i % ROW_WIDTHS.length];
        return (
          <div
            key={i}
            data-skeleton-row=""
            className="ds-pulse"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 14px",
              borderBottom: i === count - 1 ? undefined : "1px solid var(--skeleton-divider)",
            }}
          >
            {avatar === "square" ? <Skeleton pulse={false} width={28} height={28} radius={8} /> : null}
            {avatar === "circle" ? <Skeleton pulse={false} width={32} height={32} circle /> : null}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              <Skeleton pulse={false} width={w1} height={11} />
              {lines === 2 ? <Skeleton pulse={false} width={w2} height={9} tone="soft" /> : null}
            </div>
            {trailing !== null ? <Skeleton pulse={false} width={trailing} height={11} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: Size;
}

// Bloco com formato de card (StatCard, card de grade). Sem children é
// um bloco liso (como os StatCards do design, 104px); com children vira
// um card com padding onde se desenham barras (Skeleton pulse={false}).
function SkeletonCard({ height, children, style, ...rest }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className="ds-pulse"
      style={{
        height: px(height ?? (children ? undefined : 104)),
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: children ? 14 : undefined,
        display: children ? "flex" : undefined,
        flexDirection: children ? "column" : undefined,
        gap: children ? 10 : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export { Skeleton, SkeletonRows, SkeletonCard };
