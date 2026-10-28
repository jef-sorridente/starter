"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface PageTransitionProps {
  /** Usually the route pathname — changing it re-triggers the transition. */
  routeKey: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

// Wraps a route's main content so navigating between screens (any of the
// app pages behind the shell) cross-fades instead of hard-cutting.
export function PageTransition({ routeKey, children, style }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0.2, 1] }}
        style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, ...style }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
