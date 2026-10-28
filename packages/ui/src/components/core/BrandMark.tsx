import * as React from "react";

export interface BrandMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Nome do produto — vira o texto do lockup e o alt do logo. */
  name?: string;
  /** Logo do produto (ex.: "/logo.svg"). Sem ele, desenha uma marca neutra com a inicial. */
  src?: string;
  size?: number;
  tone?: "ink" | "inverse";
  lockup?: "full" | "mark";
}

// Marca do produto. O design system é reaproveitado entre produtos, então
// não carrega nenhuma identidade fixa: o app passa `name` (de
// @app/shared APP_NAME) e, quando tiver, o `src` do logo de verdade.
function BrandMark({ name = "App", src, size = 20, tone = "ink", lockup = "full", style, ...rest }: BrandMarkProps) {
  const markSize = Math.round(size * 1.6);
  const textColor = tone === "inverse" ? "var(--text-on-dark)" : "var(--text-primary)";

  return (
    <span {...rest} style={{ display: "inline-flex", alignItems: "center", gap: 9, ...style }}>
      {src ? (
        <img src={src} alt={name} style={{ display: "block", height: markSize, width: "auto", flex: "none" }} />
      ) : (
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: markSize,
            height: markSize,
            flex: "none",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-brand)",
            color: "var(--text-on-lime)",
            fontWeight: 600,
            fontSize: size,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {lockup === "full" && !src ? (
        <span style={{ fontSize: size, fontWeight: 500, letterSpacing: "-0.01em", color: textColor }}>{name}</span>
      ) : null}
      {lockup === "mark" && !src ? <span className="sr-only">{name}</span> : null}
    </span>
  );
}

export { BrandMark };
