import * as React from "react";
import { _extends } from "../../lib/extends";

export type BadgeTone = "active" | "neutral" | "positive" | "warning" | "negative" | "info" | "inverse";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, { background: string; color: string }> = {
  active: {
    background: "var(--lime-100)",
    color: "var(--lime-800)",
  },
  neutral: {
    background: "var(--gray-075)",
    color: "var(--text-secondary)",
  },
  positive: {
    background: "var(--green-050)",
    color: "var(--green-500)",
  },
  warning: {
    background: "var(--amber-050)",
    color: "var(--text-warning)",
  },
  negative: {
    background: "var(--red-050)",
    color: "var(--red-500)",
  },
  info: {
    background: "var(--blue-050)",
    color: "var(--blue-500)",
  },
  inverse: {
    background: "var(--surface-inverse)",
    color: "var(--text-on-dark)",
  },
};
function Badge({ children, tone = "neutral", style, ...rest }: BadgeProps) {
  return /*#__PURE__*/ React.createElement(
    "span",
    _extends(
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          height: 16,
          padding: "0 5px",
          borderRadius: "var(--radius-xs)",
          fontSize: "var(--fs-nano)",
          fontWeight: "var(--fw-medium)",
          letterSpacing: "var(--ls-wider)",
          textTransform: "uppercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
          ...(TONES[tone] || TONES.neutral),
          ...style,
        },
      },
      rest,
    ),
    children,
  );
}

export { Badge };
