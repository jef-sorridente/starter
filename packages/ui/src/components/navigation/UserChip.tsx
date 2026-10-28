"use client";

import * as React from "react";
import { _extends } from "../../lib/extends";

export interface UserChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  name?: string;
  email?: string;
  initials?: string;
  avatar?: string;
  style?: React.CSSProperties;
}

function UserChip({ name, email, initials, avatar, onClick, style, ...rest }: UserChipProps) {
  const [hover, setHover] = React.useState(false);
  const fallback =
    initials ||
    String(name || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return /*#__PURE__*/ React.createElement(
    "button",
    _extends(
      {
        type: "button",
        onClick: onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 8px 4px 4px",
          border: "1px solid transparent",
          borderRadius: "var(--radius-pill)",
          background: hover ? "var(--surface-hover)" : "transparent",
          cursor: onClick ? "pointer" : "default",
          textAlign: "left",
          transition: "var(--transition-control)",
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: {
          width: 32,
          height: 32,
          flex: "none",
          borderRadius: "var(--radius-pill)",
          background: avatar ? `center/cover no-repeat url(${avatar})` : "var(--lime-200)",
          color: "var(--lime-800)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--fs-caption)",
          fontWeight: "var(--fw-medium)",
          border: "1px solid var(--border-subtle)",
        },
      },
      avatar ? "" : fallback,
    ),
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.25,
        },
      },
      /*#__PURE__*/ React.createElement(
        "span",
        {
          style: {
            fontSize: "var(--fs-body-sm)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-primary)",
          },
        },
        name,
      ),
      email
        ? /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                fontSize: "var(--fs-micro)",
                color: "var(--text-faint)",
              },
            },
            email,
          )
        : null,
    ),
  );
}

export { UserChip };
