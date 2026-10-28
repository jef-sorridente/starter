"use client";

import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "./Icon";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  icon: string;
  size?: number;
  label: string;
  variant?: "outline" | "inverse" | "ghost";
  badge?: boolean;
  style?: React.CSSProperties;
}

function IconButton({
  icon,
  size = 36,
  label,
  variant = "outline",
  badge = false,
  onClick,
  style,
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = React.useState(false);
  const base: React.CSSProperties =
    variant === "outline"
      ? {
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }
      : variant === "inverse"
        ? {
            background: "var(--surface-inverse)",
            border: "1px solid var(--surface-inverse)",
            color: "var(--text-on-dark)",
          }
        : {
            background: "transparent",
            border: "1px solid transparent",
          };
  return /*#__PURE__*/ React.createElement(
    "button",
    _extends(
      {
        type: "button",
        "aria-label": label,
        onClick: onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          position: "relative",
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-md)",
          color: variant === "inverse" ? "var(--text-on-dark)" : "var(--text-body)",
          cursor: "pointer",
          transition: "var(--transition-control)",
          ...base,
          ...(hover
            ? {
                background: variant === "inverse" ? "var(--gray-800)" : "var(--surface-hover)",
              }
            : null),
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(Icon, {
      name: icon,
      size: Math.round(size * 0.48),
    }),
    badge
      ? /*#__PURE__*/ React.createElement("span", {
          style: {
            position: "absolute",
            top: 7,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "var(--radius-pill)",
            background: "var(--red-500)",
          },
        })
      : null,
  );
}

export { IconButton };
