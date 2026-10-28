import * as React from "react";
import { icons } from "lucide-react";

// The design system uses the Lucide line-icon set (ISC licence) — the source mocks ship no
// icon assets, and Lucide's 1.5px rounded stroke is the closest match to the
// glyphs in the screens (see design-system readme). Ported from the CDN/
// window.lucide runtime version to the `lucide-react` package so icons
// render server-side and tree-shake normally in Next.js.
function toPascalCase(name: string): string {
  return name
    .split(/[-_ ]/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "color"> {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function Icon({ name, size = 18, strokeWidth = 1.5, color = "currentColor", style, ...rest }: IconProps) {
  const LucideIcon = icons[toPascalCase(name) as keyof typeof icons];
  const box: React.CSSProperties = { width: size, height: size, display: "block", flexShrink: 0 };

  if (!LucideIcon) {
    return (
      <span aria-hidden="true" style={{ ...box, ...style }} {...(rest as React.HTMLAttributes<HTMLSpanElement>)} />
    );
  }

  return (
    <LucideIcon
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ ...box, ...style }}
      {...rest}
    />
  );
}

export { Icon };
