"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { _extends } from "../../lib/extends";
import { Icon } from "../core/Icon";

export interface SidebarNavItem {
  id: string;
  label: React.ReactNode;
  icon?: string;
  badge?: React.ReactNode;
}

export interface SidebarNavSection {
  title?: string;
  items?: SidebarNavItem[];
}

export interface SidebarNavProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  sections?: SidebarNavSection[];
  activeId?: string;
  onSelect?: (id: string) => void;
  width?: number | string;
}

function SidebarNav({
  sections = [],
  activeId,
  onSelect,
  width = "var(--sidebar-width)",
  style,
  ...rest
}: SidebarNavProps) {
  return /*#__PURE__*/ React.createElement(
    "nav",
    _extends(
      {
        style: {
          width,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          ...style,
        },
      },
      rest,
    ),
    sections.map((section, si) =>
      /*#__PURE__*/ React.createElement(
        "div",
        {
          key: si,
        },
        section.title
          ? /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  padding: "0 10px 8px",
                  fontSize: "var(--fs-micro)",
                  color: "var(--text-faint)",
                },
              },
              section.title,
            )
          : null,
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 2,
            },
          },
          (section.items || []).map((item) => {
            const active = item.id === activeId;
            return /*#__PURE__*/ React.createElement(NavItem, {
              key: item.id,
              item: item,
              active: active,
              onSelect: onSelect,
            });
          }),
        ),
      ),
    ),
  );
}

function NavItem({
  item,
  active,
  onSelect,
}: {
  item: SidebarNavItem;
  active: boolean;
  onSelect?: (id: string) => void;
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/ React.createElement(
    motion.button,
    {
      type: "button",
      onClick: () => onSelect && onSelect(item.id),
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      whileTap: { scale: 0.98 },
      animate: {
        backgroundColor: active ? "var(--surface-card)" : hover ? "var(--surface-hover)" : "rgba(0,0,0,0)",
        borderColor: active ? "var(--border-subtle)" : "rgba(0,0,0,0)",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
      },
      transition: { duration: 0.16, ease: [0.2, 0, 0.2, 1] },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        height: 34,
        padding: "0 10px",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: "var(--radius-md)",
        borderWidth: "1px",
        borderStyle: "solid",
        boxShadow: active ? "var(--shadow-xs)" : "none",
        fontSize: "var(--fs-body-sm)",
        fontWeight: active ? "var(--fw-medium)" : "var(--fw-regular)",
      },
    },
    item.icon
      ? /*#__PURE__*/ React.createElement(Icon, {
          name: item.icon,
          size: 16,
        })
      : null,
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: {
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },
      item.label,
    ),
    item.badge
      ? /*#__PURE__*/ React.createElement(
          "span",
          {
            className: "ds-numeric",
            style: {
              fontSize: "var(--fs-micro)",
              color: "var(--text-faint)",
            },
          },
          item.badge,
        )
      : null,
  );
}

export { SidebarNav };
