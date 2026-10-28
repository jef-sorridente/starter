"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { _extends } from "../../lib/extends";
import { Icon } from "./Icon";

const SIZES = {
  sm: {
    height: "var(--control-height-sm)",
    padding: "0 12px",
    fontSize: "var(--fs-body-sm)",
    gap: 6,
  },
  md: {
    height: "var(--control-height)",
    padding: "0 16px",
    fontSize: "var(--fs-body)",
    gap: 8,
  },
  lg: {
    height: "var(--control-height-lg)",
    padding: "0 22px",
    fontSize: "var(--fs-body)",
    gap: 8,
  },
};
const VARIANTS = {
  primary: {
    background: "var(--action-primary-bg)",
    color: "var(--action-primary-fg)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--action-primary-bg)",
  },
  secondary: {
    background: "var(--action-secondary-bg)",
    color: "var(--action-secondary-fg)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--border-default)",
  },
  brand: {
    background: "var(--action-brand-bg)",
    color: "var(--text-on-lime)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--action-brand-bg)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
  },
  danger: {
    background: "var(--white)",
    color: "var(--action-danger-fg)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--red-500)",
  },
};
const HOVER: Partial<Record<keyof typeof VARIANTS, React.CSSProperties>> = {
  primary: {
    background: "var(--action-primary-bg-hover)",
    borderColor: "var(--action-primary-bg-hover)",
  },
  secondary: {
    background: "var(--surface-hover)",
  },
  brand: {
    background: "var(--action-brand-bg-hover)",
    borderColor: "var(--action-brand-bg-hover)",
  },
  ghost: {
    background: "var(--surface-hover)",
  },
  danger: {
    background: "var(--red-050)",
  },
};

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconAfter?: string;
  block?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button = /*#__PURE__*/ React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "secondary",
    size = "md",
    icon,
    iconAfter,
    disabled = false,
    block = false,
    onClick,
    type = "button",
    style,
    ...rest
  },
  ref,
) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.secondary;
  return /*#__PURE__*/ React.createElement(
    motion.button,
    _extends(
      {
        ref: ref,
        type: type,
        disabled: disabled,
        onClick: onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        whileTap: disabled ? undefined : { scale: 0.97 },
        whileHover: disabled ? undefined : { scale: 1.015 },
        transition: { duration: 0.12, ease: [0.2, 0, 0.2, 1] },
        style: {
          display: block ? "flex" : "inline-flex",
          width: block ? "100%" : "auto",
          alignItems: "center",
          justifyContent: "center",
          gap: s.gap,
          height: s.height,
          padding: s.padding,
          fontSize: s.fontSize,
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-medium)",
          borderRadius: "var(--radius-md)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          whiteSpace: "nowrap",
          transition: "var(--transition-control)",
          ...v,
          ...(hover && !disabled ? HOVER[variant] : null),
          ...style,
        },
      },
      rest,
    ),
    icon
      ? /*#__PURE__*/ React.createElement(Icon, {
          name: icon,
          size: size === "sm" ? 14 : 16,
        })
      : null,
    children,
    iconAfter
      ? /*#__PURE__*/ React.createElement(Icon, {
          name: iconAfter,
          size: size === "sm" ? 14 : 16,
        })
      : null,
  );
});

export { Button };
