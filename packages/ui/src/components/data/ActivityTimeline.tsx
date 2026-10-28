import * as React from "react";
import { _extends } from "../../lib/extends";

export type ActivityTone = "positive" | "negative" | "pending" | "neutral";

export interface ActivityItem {
  title: React.ReactNode;
  meta?: React.ReactNode;
  amount?: React.ReactNode;
  tone?: ActivityTone;
}

export interface ActivityTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: ActivityItem[];
}

const DOT: Record<ActivityTone, string> = {
  positive: "var(--lime-500)",
  negative: "var(--red-500)",
  pending: "var(--amber-500)",
  neutral: "var(--gray-300)",
};
const AMT: Record<ActivityTone, string> = {
  positive: "var(--text-positive)",
  negative: "var(--text-negative)",
  pending: "var(--text-warning)",
  neutral: "var(--text-primary)",
};
function ActivityTimeline({ items = [], style, ...rest }: ActivityTimelineProps) {
  return /*#__PURE__*/ React.createElement(
    "div",
    _extends(
      {
        style: {
          display: "flex",
          flexDirection: "column",
          ...style,
        },
      },
      rest,
    ),
    items.map((it, i) => {
      const tone: ActivityTone =
        it.tone ||
        (String(it.amount || "")
          .trim()
          .startsWith("-")
          ? "negative"
          : "positive");
      const last = i === items.length - 1;
      return /*#__PURE__*/ React.createElement(
        "div",
        {
          key: i,
          style: {
            display: "flex",
            gap: 12,
          },
        },
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              position: "relative",
              width: 10,
              flex: "none",
              display: "flex",
              justifyContent: "center",
            },
          },
          /*#__PURE__*/ React.createElement("span", {
            style: {
              width: 10,
              height: 10,
              marginTop: 5,
              borderRadius: "var(--radius-pill)",
              background: DOT[tone],
              flex: "none",
              zIndex: 1,
            },
          }),
          !last
            ? /*#__PURE__*/ React.createElement("span", {
                style: {
                  position: "absolute",
                  top: 13,
                  bottom: -4,
                  width: 2,
                  background: DOT[tone],
                  opacity: 0.85,
                },
              })
            : null,
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              paddingBottom: last ? 0 : 18,
              minWidth: 0,
            },
          },
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                fontSize: "var(--fs-body)",
                fontWeight: "var(--fw-medium)",
                color: "var(--text-primary)",
              },
            },
            it.title,
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                fontSize: "var(--fs-caption)",
                color: "var(--text-faint)",
              },
            },
            it.meta,
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "ds-numeric",
              style: {
                marginTop: 2,
                fontSize: "var(--fs-body-lg)",
                color: AMT[tone],
              },
            },
            it.amount,
          ),
        ),
      );
    }),
  );
}

export { ActivityTimeline };
