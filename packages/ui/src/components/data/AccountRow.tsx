"use client";

import * as React from "react";
import { _extends } from "../../lib/extends";
import { Badge } from "../core/Badge";
import { Icon } from "../core/Icon";

export interface AccountRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  name: string;
  institution?: string;
  mask?: string;
  amount?: React.ReactNode;
  icon?: string;
  badges?: string[];
  selected?: boolean;
  onClick?: () => void;
  onInfo?: () => void;
  divider?: boolean;
}

function AccountRow({
  name,
  institution,
  mask,
  amount,
  icon = "wallet",
  badges = [],
  selected = false,
  onClick,
  onInfo,
  divider = true,
  style,
  ...rest
}: AccountRowProps) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        onClick: onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: "var(--row-height)",
          padding: "8px 14px",
          background: selected ? "var(--lime-050)" : hover ? "var(--surface-hover)" : "transparent",
          borderBottom: divider ? "1px solid var(--border-subtle)" : "none",
          cursor: onClick ? "pointer" : "default",
          transition: "background-color var(--dur-fast) var(--ease-standard)",
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          flex: "none",
          borderRadius: "var(--radius-md)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        },
      },
      /*#__PURE__*/ React.createElement(Icon, {
        name: icon,
        size: 15,
      }),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          minWidth: 0,
          flex: 1,
        },
      },
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
          },
        },
        /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              fontSize: "var(--fs-body)",
              fontWeight: "var(--fw-medium)",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          },
          name,
        ),
        badges.map((b, i) =>
          /*#__PURE__*/ React.createElement(
            Badge,
            {
              key: i,
              tone: i === 0 ? "active" : "neutral",
            },
            b,
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            fontSize: "var(--fs-caption)",
            color: "var(--text-faint)",
          },
        },
        institution,
        mask ? ` · ···· ${mask}` : "",
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "span",
      {
        className: "ds-numeric",
        style: {
          fontSize: "var(--fs-metric-md)",
          color: "var(--text-primary)",
        },
      },
      amount,
    ),
    /*#__PURE__*/ React.createElement(
      "button",
      {
        type: "button",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onInfo?.();
        },
        "aria-label": `Details for ${name}`,
        style: {
          display: "inline-flex",
          border: 0,
          background: "transparent",
          padding: 0,
          cursor: onInfo ? "pointer" : "default",
          color: "var(--blue-500)",
        },
      },
      /*#__PURE__*/ React.createElement(Icon, {
        name: "circle-dollar-sign",
        size: 16,
      }),
    ),
  );
}

export { AccountRow };
