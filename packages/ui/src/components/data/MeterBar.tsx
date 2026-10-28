"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { _extends } from "../../lib/extends";

export interface MeterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
  percent?: number;
  segments?: number;
  tone?: "brand" | "inverse" | "warning" | "negative";
  compact?: boolean;
}

function MeterBar({
  label,
  valueLabel,
  percent = 0,
  segments = 34,
  tone = "brand",
  compact = false,
  style,
  "aria-label": ariaLabel,
  ...rest
}: MeterBarProps) {
  // role="meter" precisa de nome acessível (achado do teste axe das
  // stories): vem do `label` visível quando existe, senão do aria-label
  // passado pelo app, senão um genérico.
  const labelId = React.useId();
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * segments);
  const fill =
    tone === "inverse"
      ? "var(--lime-500)"
      : tone === "warning"
        ? "var(--amber-500)"
        : tone === "negative"
          ? "var(--red-500)"
          : "var(--lime-500)";
  const track = tone === "inverse" ? "var(--gray-800)" : "var(--chart-track)";
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          ...style,
        },
      },
      rest,
    ),
    label || valueLabel
      ? /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 6,
            },
          },
          label
            ? /*#__PURE__*/ React.createElement(
                "span",
                {
                  id: labelId,
                  style: {
                    fontSize: "var(--fs-body-sm)",
                    color: tone === "inverse" ? "var(--text-on-dark)" : "var(--text-body)",
                  },
                },
                label,
              )
            : null,
          valueLabel
            ? /*#__PURE__*/ React.createElement(
                "span",
                {
                  className: "ds-numeric",
                  style: {
                    fontSize: "var(--fs-caption)",
                    color: tone === "inverse" ? "var(--lime-400)" : "var(--text-positive)",
                  },
                },
                valueLabel,
              )
            : null,
        )
      : null,
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 2,
        },
        role: "meter",
        "aria-labelledby": label ? labelId : undefined,
        "aria-label": label ? undefined : (ariaLabel ?? "Progresso"),
        "aria-valuetext": typeof valueLabel === "string" ? valueLabel : undefined,
        "aria-valuenow": percent,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
      },
      Array.from({
        length: segments,
      }).map((_, i) =>
        /*#__PURE__*/ React.createElement(motion.span, {
          key: i,
          initial: false,
          animate: {
            backgroundColor: i < filled ? fill : track,
            scaleY: i < filled ? 1 : 0.86,
          },
          transition: {
            duration: 0.4,
            delay: i < filled ? i * 0.012 : 0,
            ease: [0.32, 0.72, 0, 1],
          },
          style: {
            flex: 1,
            height: compact ? 8 : 10,
            borderRadius: 1,
          },
        }),
      ),
    ),
  );
}

export { MeterBar };
