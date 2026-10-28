import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "./Icon";

export type TagTone = "neutral" | "brand" | "solid";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: string;
  tone?: TagTone;
  removable?: boolean;
  onRemove?: () => void;
}

function Tag({ children, icon, tone = "neutral", removable = false, onRemove, style, ...rest }: TagProps) {
  const tones: Record<TagTone, React.CSSProperties> = {
    neutral: {
      background: "var(--surface-card)",
      color: "var(--text-body)",
      border: "1px solid var(--border-default)",
    },
    brand: {
      background: "var(--lime-100)",
      color: "var(--lime-800)",
      border: "1px solid var(--lime-200)",
    },
    solid: {
      background: "var(--surface-inverse)",
      color: "var(--text-on-dark)",
      border: "1px solid var(--surface-inverse)",
    },
  };
  return /*#__PURE__*/ React.createElement(
    "span",
    _extends(
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 26,
          padding: removable ? "0 6px 0 10px" : "0 10px",
          borderRadius: "var(--radius-pill)",
          fontSize: "var(--fs-caption)",
          fontWeight: "var(--fw-regular)",
          whiteSpace: "nowrap",
          ...tones[tone],
          ...style,
        },
      },
      rest,
    ),
    icon
      ? /*#__PURE__*/ React.createElement(Icon, {
          name: icon,
          size: 13,
        })
      : null,
    children,
    removable
      ? /*#__PURE__*/ React.createElement(
          "button",
          {
            type: "button",
            onClick: onRemove,
            "aria-label": "Remove",
            style: {
              display: "inline-flex",
              width: 16,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
              border: 0,
              background: "transparent",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              color: "inherit",
              opacity: 0.6,
            },
          },
          /*#__PURE__*/ React.createElement(Icon, {
            name: "x",
            size: 11,
          }),
        )
      : null,
  );
}

export { Tag };
