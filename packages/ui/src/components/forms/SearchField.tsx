"use client";

import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "../core/Icon";

export interface SearchFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  shortcut?: string;
  width?: number | string;
  style?: React.CSSProperties;
}

function SearchField({
  placeholder = "Search accounts, transactions…",
  value,
  shortcut = "⌘K",
  width = 260,
  onChange,
  style,
  ...rest
}: SearchFieldProps) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/ React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        width,
        height: "var(--control-height)",
        padding: "0 10px 0 12px",
        background: "var(--surface-card)",
        border: `1px solid ${focus ? "var(--border-brand)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md)",
        boxShadow: focus ? "var(--shadow-focus)" : "none",
        transition: "var(--transition-control)",
        ...style,
      },
    },
    /*#__PURE__*/ React.createElement(Icon, {
      name: "search",
      size: 15,
      color: "var(--text-faint)",
    }),
    /*#__PURE__*/ React.createElement(
      "input",
      _extends(
        {
          value: value,
          placeholder: placeholder,
          onChange: onChange,
          onFocus: () => setFocus(true),
          onBlur: () => setFocus(false),
          style: {
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            font: "inherit",
            fontSize: "var(--fs-body-sm)",
            color: "var(--text-primary)",
          },
        },
        rest,
      ),
    ),
    shortcut
      ? /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              height: 18,
              padding: "0 5px",
              borderRadius: "var(--radius-xs)",
              background: "var(--gray-075)",
              color: "var(--text-faint)",
              fontSize: "var(--fs-micro)",
            },
          },
          shortcut,
        )
      : null,
  );
}

export { SearchField };
