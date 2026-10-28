import * as React from "react";
import { _extends } from "../../lib/extends";

export interface MiniBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  values?: number[];
  labels?: string[];
  activeIndex?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
  activeColor?: string;
}

function MiniBarChart({
  values = [],
  labels,
  activeIndex = -1,
  height = 34,
  barWidth = 5,
  gap = 4,
  color = "var(--chart-bar)",
  activeColor = "var(--chart-bar-active)",
  style,
  ...rest
}: MiniBarChartProps) {
  const max = Math.max(...values, 1);
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 4,
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "flex-end",
          gap,
        },
      },
      values.map((v, i) =>
        /*#__PURE__*/ React.createElement("span", {
          key: i,
          style: {
            width: barWidth,
            height: Math.max(3, Math.round((v / max) * height)),
            borderRadius: 1.5,
            background: i === activeIndex ? activeColor : color,
            transition: `height var(--dur-slow) var(--ease-soft)`,
          },
        }),
      ),
    ),
    labels
      ? /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap,
            },
          },
          labels.map((l, i) =>
            /*#__PURE__*/ React.createElement(
              "span",
              {
                key: i,
                style: {
                  width: barWidth,
                  textAlign: "center",
                  fontSize: "var(--fs-nano)",
                  color: i === activeIndex ? "var(--text-primary)" : "var(--text-faint)",
                  fontWeight: i === activeIndex ? "var(--fw-medium)" : "var(--fw-regular)",
                },
              },
              l,
            ),
          ),
        )
      : null,
  );
}

export { MiniBarChart };
