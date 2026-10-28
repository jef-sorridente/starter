"use client";

import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "./Icon";

export interface IconTileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  icon: string;
  label?: string;
  size?: number;
  active?: boolean;
  style?: React.CSSProperties;
}

function IconTile({ icon, label, size = 72, active = false, onClick, style, ...rest }: IconTileProps) {
  const [hover, setHover] = React.useState(false);
  const interactive = Boolean(onClick);
  return /*#__PURE__*/ React.createElement(
    "button",
    _extends(
      {
        type: "button",
        onClick: onClick,
        "aria-label": label,
        disabled: !interactive,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          width: size,
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background: active ? "var(--lime-100)" : "var(--surface-card)",
          border: `1px solid ${active ? "var(--lime-200)" : hover ? "var(--border-default)" : "var(--border-subtle)"}`,
          borderRadius: "var(--radius-lg)",
          cursor: interactive ? "pointer" : "default",
          color: active ? "var(--lime-800)" : "var(--text-body)",
          transition: "var(--transition-control)",
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(Icon, {
      name: icon,
      size: Math.round(size * 0.34),
      strokeWidth: 1.3,
    }),
    label
      ? /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              fontSize: "var(--fs-micro)",
              color: "var(--text-secondary)",
            },
          },
          label,
        )
      : null,
  );
}

export { IconTile };
