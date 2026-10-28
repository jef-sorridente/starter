import * as React from "react";

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  invalid?: boolean;
  /** Aplica no <label> externo, não no <textarea>. */
  style?: React.CSSProperties;
}

// Mesmo visual do Input (rótulo, borda, foco, hint), pra texto longo.
// Primeiro componente escrito direto em TSX (os outros vieram do bundle
// compilado do design system) — é o modelo pra componentes novos.
export function Textarea({ label, hint, invalid, disabled, rows = 4, style, id, ...rest }: TextareaProps) {
  const [focus, setFocus] = React.useState(false);
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <label htmlFor={fieldId} style={{ display: "block", ...style }}>
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
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          resize: "vertical",
          font: "inherit",
          fontSize: "var(--fs-body)",
          lineHeight: 1.5,
          color: "var(--text-primary)",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-field)",
          border: `1px solid ${invalid ? "var(--red-500)" : focus ? "var(--border-brand)" : "var(--border-field)"}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--shadow-focus)" : "var(--shadow-inset-field)",
          outline: "none",
          transition: "var(--transition-control)",
        }}
      />
      {hint ? (
        <span
          id={hintId}
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
