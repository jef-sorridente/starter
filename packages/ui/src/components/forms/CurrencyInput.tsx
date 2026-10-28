"use client";

import * as React from "react";
import { NumericFormat } from "react-number-format";

export interface CurrencyInputProps {
  label?: string;
  value: number | null | undefined;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  hint?: string;
  invalid?: boolean;
  disabled?: boolean;
  prefix?: string;
  style?: React.CSSProperties;
}

// Máscara de moeda (milhar com ".", decimal com ",") pro mesmo visual
// do Input do design system — não reaproveita o Input diretamente
// porque ele não repassa ref pro <input> nativo, e o react-number-format
// precisa desse ref pra controlar a posição do cursor durante a
// digitação.
function CurrencyInput({
  label,
  value,
  onValueChange,
  placeholder = "0,00",
  hint,
  invalid = false,
  disabled = false,
  prefix = "R$",
  style,
}: CurrencyInputProps) {
  const [focus, setFocus] = React.useState(false);

  return (
    <label style={{ display: "block", ...style }}>
      {label ? (
        <span
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: "var(--fs-micro)",
            letterSpacing: "var(--ls-wide)",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      ) : null}
      <span
        style={{
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
        }}
      >
        {prefix ? <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>{prefix}</span> : null}
        <NumericFormat
          value={value ?? ""}
          onValueChange={(values) => onValueChange(values.floatValue)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          fixedDecimalScale
          allowNegative={false}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            font: "inherit",
            fontSize: "var(--fs-body)",
            color: "var(--text-primary)",
          }}
        />
      </span>
      {hint ? (
        <span
          style={{
            display: "block",
            marginTop: 5,
            fontSize: "var(--fs-caption)",
            color: invalid ? "var(--text-negative)" : "var(--text-muted)",
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { CurrencyInput };
