import * as React from "react";
import { _extends } from "../../lib/extends";

export type CardTone = "white" | "panel" | "brand" | "wash" | "inverse";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: string | number;
  radius?: string | number;
  border?: boolean;
  elevated?: boolean;
}

function Card({
  children,
  tone = "white",
  padding = "var(--card-padding)",
  radius = "var(--radius-lg)",
  border = true,
  elevated = false,
  style,
  ...rest
}: CardProps) {
  const tones: Record<CardTone, React.CSSProperties> = {
    white: {
      background: "var(--surface-card)",
    },
    panel: {
      background: "var(--surface-panel)",
    },
    brand: {
      background: "var(--surface-brand)",
    },
    wash: {
      background: "var(--wash-lime-soft)",
    },
    inverse: {
      background: "var(--surface-inverse)",
      color: "var(--text-on-dark)",
    },
  };
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          padding,
          borderRadius: radius,
          border: border
            ? `1px solid ${tone === "inverse" ? "var(--surface-inverse)" : tone === "brand" ? "var(--border-brand)" : "var(--border-subtle)"}`
            : "none",
          boxShadow: elevated ? "var(--shadow-card)" : "none",
          ...tones[tone],
          ...style,
        },
      },
      rest,
    ),
    children,
  );
}

export { Card };
