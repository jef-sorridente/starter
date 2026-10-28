"use client";

import * as React from "react";
import { _extends } from "../../lib/extends";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style" | "prefix"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  invalid?: boolean;
  prefix?: React.ReactNode;
  /** Rendered at the end of the field row (ex.: botão de revelar senha). */
  suffix?: React.ReactNode;
  /** Applies to the outer <label> wrapper, not the <input> itself. */
  style?: React.CSSProperties;
}

function Input({
  label,
  value,
  placeholder,
  hint,
  invalid = false,
  disabled = false,
  prefix,
  suffix,
  onChange,
  type = "text",
  style,
  ...rest
}: InputProps) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/ React.createElement(
    "label",
    {
      style: {
        display: "block",
        ...style,
      },
    },
    label
      ? /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              display: "block",
              marginBottom: 6,
              fontSize: "var(--fs-micro)",
              letterSpacing: "var(--ls-wide)",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            },
          },
          label,
        )
      : null,
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: "var(--field-height)",
          padding: "0 12px",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-field)",
          border: `1px solid ${invalid ? "var(--red-500)" : focus ? "var(--border-brand)" : "var(--border-field)"}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--shadow-focus)" : "var(--shadow-inset-field)",
          transition: "var(--transition-control)",
        },
      },
      prefix
        ? /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                color: "var(--text-muted)",
                fontSize: "var(--fs-body)",
              },
            },
            prefix,
          )
        : null,
      /*#__PURE__*/ React.createElement(
        "input",
        _extends(
          {
            type: type,
            value: value,
            placeholder: placeholder,
            disabled: disabled,
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
              fontSize: "var(--fs-body)",
              color: "var(--text-primary)",
            },
          },
          rest,
        ),
      ),
      suffix
        ? /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              },
            },
            suffix,
          )
        : null,
    ),
    hint
      ? /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              display: "block",
              marginTop: 5,
              fontSize: "var(--fs-caption)",
              color: invalid ? "var(--text-negative)" : "var(--text-muted)",
            },
          },
          hint,
        )
      : null,
  );
}

export { Input };
