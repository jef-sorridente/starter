import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "../core/Icon";
import { MiniBarChart } from "./MiniBarChart";

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  value?: React.ReactNode;
  series?: number[];
  labels?: string[];
  activeIndex?: number;
  delta?: React.ReactNode;
  caption?: React.ReactNode;
  icon?: string;
}

function MetricCard({
  title,
  value,
  series = [],
  labels,
  activeIndex = -1,
  delta,
  caption,
  icon = "arrow-up",
  style,
  ...rest
}: MetricCardProps) {
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          background: "var(--wash-lime-soft)",
          borderRadius: "var(--radius-2xl)",
          padding: 18,
          ...style,
        },
      },
      rest,
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)",
          padding: "20px 22px 16px",
        },
      },
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            fontSize: "var(--fs-title-3)",
            color: "var(--text-secondary)",
            fontWeight: "var(--fw-regular)",
          },
        },
        title,
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginTop: 22,
          },
        },
        /*#__PURE__*/ React.createElement(
          "div",
          {
            className: "ds-numeric",
            style: {
              fontSize: "var(--fs-metric-xl)",
              fontWeight: "var(--fw-medium)",
              letterSpacing: "var(--ls-display)",
              color: "var(--text-primary)",
            },
          },
          value,
        ),
        /*#__PURE__*/ React.createElement(MiniBarChart, {
          values: series,
          labels: labels,
          activeIndex: activeIndex,
          height: 86,
          barWidth: 9,
          gap: 7,
        }),
      ),
    ),
    delta || caption
      ? /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 8px 2px",
            },
          },
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid var(--green-500)",
                color: "var(--green-500)",
              },
            },
            /*#__PURE__*/ React.createElement(Icon, {
              name: icon,
              size: 15,
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                fontSize: "var(--fs-body-lg)",
                color: "var(--text-secondary)",
              },
            },
            delta
              ? /*#__PURE__*/ React.createElement(
                  "b",
                  {
                    className: "ds-numeric",
                    style: {
                      color: "var(--text-positive)",
                      fontWeight: "var(--fw-medium)",
                      marginRight: 8,
                    },
                  },
                  delta,
                )
              : null,
            caption,
          ),
        )
      : null,
  );
}

export { MetricCard };
