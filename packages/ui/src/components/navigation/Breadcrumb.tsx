import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "../core/Icon";

export interface BreadcrumbItem {
  label: React.ReactNode;
  [key: string]: unknown;
}

export interface BreadcrumbProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  items?: Array<string | BreadcrumbItem>;
  onSelect?: (item: string | BreadcrumbItem, index: number) => void;
}

function Breadcrumb({ items = [], onSelect, style, ...rest }: BreadcrumbProps) {
  return /*#__PURE__*/ React.createElement(
    "nav",
    _extends(
      {
        "aria-label": "Breadcrumb",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          ...style,
        },
      },
      rest,
    ),
    items.map((it, i) => {
      const last = i === items.length - 1;
      const label = typeof it === "string" ? it : it.label;
      return /*#__PURE__*/ React.createElement(
        React.Fragment,
        {
          key: i,
        },
        /*#__PURE__*/ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onSelect && onSelect(it, i),
            disabled: last,
            style: {
              border: 0,
              background: "transparent",
              padding: 0,
              font: "inherit",
              fontSize: "var(--fs-body-sm)",
              cursor: last ? "default" : "pointer",
              color: last ? "var(--text-primary)" : "var(--text-faint)",
              fontWeight: last ? "var(--fw-medium)" : "var(--fw-regular)",
            },
          },
          label,
        ),
        !last
          ? /*#__PURE__*/ React.createElement(Icon, {
              name: "chevron-right",
              size: 13,
              color: "var(--text-faint)",
            })
          : null,
      );
    }),
  );
}

export { Breadcrumb };
