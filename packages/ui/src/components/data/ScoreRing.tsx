import * as React from "react";
import { _extends } from "../../lib/extends";

export interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  percent?: number;
  size?: number;
  thickness?: number;
  verdict?: React.ReactNode;
  note?: React.ReactNode;
  track?: string;
  color?: string;
}

function ScoreRing({
  percent = 0,
  size = 84,
  thickness = 9,
  verdict,
  note,
  track = "var(--chart-track)",
  color = "var(--lime-500)",
  style,
  ...rest
}: ScoreRingProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 16,
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          position: "relative",
          width: size,
          height: size,
          flex: "none",
        },
      },
      /*#__PURE__*/ React.createElement(
        "svg",
        {
          width: size,
          height: size,
          style: {
            display: "block",
            transform: "rotate(-90deg)",
          },
        },
        /*#__PURE__*/ React.createElement("circle", {
          cx: size / 2,
          cy: size / 2,
          r: r,
          fill: "none",
          stroke: track,
          strokeWidth: thickness,
        }),
        /*#__PURE__*/ React.createElement("circle", {
          cx: size / 2,
          cy: size / 2,
          r: r,
          fill: "none",
          stroke: color,
          strokeWidth: thickness,
          strokeLinecap: "round",
          strokeDasharray: c,
          strokeDashoffset: c * (1 - Math.max(0, Math.min(100, percent)) / 100),
          style: {
            transition: `stroke-dashoffset var(--dur-slow) var(--ease-soft)`,
          },
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "span",
        {
          className: "ds-numeric",
          style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.round(size * 0.2),
            color: "var(--text-secondary)",
          },
        },
        percent,
        "%",
      ),
    ),
    verdict || note
      ? /*#__PURE__*/ React.createElement(
          "div",
          null,
          verdict
            ? /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontSize: "var(--fs-title-3)",
                    color: "var(--text-primary)",
                    fontWeight: "var(--fw-medium)",
                  },
                },
                verdict,
              )
            : null,
          note
            ? /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    marginTop: 2,
                    fontSize: "var(--fs-body-sm)",
                    color: "var(--text-secondary)",
                    maxWidth: 160,
                  },
                },
                note,
              )
            : null,
        )
      : null,
  );
}

export { ScoreRing };
