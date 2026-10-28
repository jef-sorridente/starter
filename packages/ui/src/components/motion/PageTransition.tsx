"use client";

import * as React from "react";
import { motion } from "framer-motion";

export interface PageTransitionProps {
  /** Usually the route pathname — changing it re-triggers the transition. */
  routeKey: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

// Fade de entrada a cada troca de rota. Só entrada, de propósito: com
// `AnimatePresence mode="wait"` (saída + entrada) no App Router do Next, o
// `children` do elemento que está saindo já é a página NOVA — ela aparece
// dentro do envelope de saída e é montada de novo quando a saída termina,
// perdendo o que o usuário digitou nesse meio-tempo (e buscando os dados
// duas vezes). Bug real, pego pelos testes no navegador contra o build de
// produção.
export function PageTransition({ routeKey, children, style }: PageTransitionProps) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0.2, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, ...style }}
    >
      {children}
    </motion.div>
  );
}
