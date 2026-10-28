import * as React from "react";
import { _extends } from "../../lib/extends";
import { Icon } from "../core/Icon";
import { MiniBarChart } from "./MiniBarChart";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  value?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "positive" | "negative";
  footnote?: React.ReactNode;
  series?: number[];
  tone?: "white" | "brand";
  onAdd?: () => void;
}

function StatCard({
  label,
  value,
  delta,
  deltaTone,
  footnote,
  series,
  tone = "white",
  onAdd,
  style,
  ...rest
}: StatCardProps) {
  const brand = tone === "brand";
  const positive = deltaTone
    ? deltaTone === "positive"
    : !String(delta || "")
        .trim()
        .startsWith("-");
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 14,
          padding: "12px 14px 10px",
          minHeight: 104,
          background: brand ? "var(--surface-brand)" : "var(--surface-card)",
          border: `1px solid ${brand ? "var(--border-brand)" : "var(--border-subtle)"}`,
          borderRadius: "var(--radius-lg)",
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        },
      },
      /*#__PURE__*/ React.createElement(
        "div",
        null,
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              fontSize: "var(--fs-caption)",
              color: brand ? "var(--lime-800)" : "var(--text-muted)",
            },
          },
          label,
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            className: "ds-numeric",
            style: {
              marginTop: 6,
              fontSize: "var(--fs-metric-lg)",
              fontWeight: "var(--fw-medium)",
              letterSpacing: "var(--ls-title)",
              color: "var(--text-primary)",
            },
          },
          value,
        ),
      ),
      // Sem série, sem gráfico — o bundle original desenhava uma série
      // de exemplo fixa, o que mostra dado inventado na tela do produto.
      series && series.length > 0
        ? /*#__PURE__*/ React.createElement(MiniBarChart, {
            values: series,
            color: brand ? "var(--lime-700)" : "var(--chart-bar)",
            activeColor: "var(--chart-bar-active)",
            activeIndex: series.length - 1,
          })
        : null,
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        },
      },
      // Botão só existe quando faz alguma coisa (antes aparecia sempre,
      // inclusive sem onAdd — um controle morto na tela).
      onAdd
        ? /*#__PURE__*/ React.createElement(
            "button",
            {
              type: "button",
              onClick: onAdd,
              "aria-label": `Adicionar em ${typeof label === "string" ? label : "item"}`,
              style: {
                display: "inline-flex",
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                color: brand ? "var(--lime-800)" : "var(--text-faint)",
              },
            },
            /*#__PURE__*/ React.createElement(Icon, {
              name: "circle-plus",
              size: 15,
            }),
          )
        : /*#__PURE__*/ React.createElement("span"),
      delta
        ? /*#__PURE__*/ React.createElement(
            "span",
            {
              className: "ds-numeric",
              style: {
                fontSize: "var(--fs-caption)",
                color: brand ? "var(--lime-800)" : positive ? "var(--text-positive)" : "var(--text-negative)",
              },
            },
            delta,
          )
        : footnote
          ? /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontSize: "var(--fs-caption)",
                  color: brand ? "var(--lime-800)" : "var(--text-muted)",
                },
              },
              footnote,
            )
          : null,
    ),
  );
}

export { StatCard };
