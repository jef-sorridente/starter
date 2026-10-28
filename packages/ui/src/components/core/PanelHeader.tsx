import * as React from "react";
import { _extends } from "../../lib/extends";
import { IconButton } from "./IconButton";

export interface PanelHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  eyebrow?: boolean;
  action?: React.ReactNode;
  onInfo?: () => void;
}

function PanelHeader({ title, eyebrow = false, action, onInfo, style, ...rest }: PanelHeaderProps) {
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-subtle)",
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: eyebrow
          ? {
              fontSize: "var(--fs-micro)",
              letterSpacing: "var(--ls-wide)",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              fontWeight: "var(--fw-medium)",
            }
          : {
              fontSize: "var(--fs-title-3)",
              color: "var(--text-primary)",
              fontWeight: "var(--fw-medium)",
            },
      },
      title,
    ),
    action ||
      (onInfo
        ? /*#__PURE__*/ React.createElement(IconButton, {
            icon: "info",
            label: "About this panel",
            variant: "ghost",
            size: 26,
            onClick: onInfo,
          })
        : null),
  );
}

export { PanelHeader };
