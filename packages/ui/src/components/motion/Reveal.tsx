"use client";

import * as React from "react";
import { motion } from "framer-motion";

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
  className?: string;
}

// Fade + slide-up used to bring a screen's content in on mount. Shared so
// every app screen (auth split, page-level content) enters
// with the same feel instead of each page hand-rolling its own transition.
export function Reveal({ children, delay = 0, y = 10, style, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.2, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
