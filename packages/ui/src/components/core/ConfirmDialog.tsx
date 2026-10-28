"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red). Defaults to true. */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmação padrão pra qualquer ação destrutiva (excluir categoria,
// transação, orçamento, grupo, remover membro...) — um único componente
// pra manter o mesmo visual e o mesmo comportamento (Esc fecha, clique
// fora fecha, foco no botão de confirmar) em vez de cada tela reinventar
// o próprio modal.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => !loading && onCancel()}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5,11,6,.55)",
            zIndex: 100,
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 400,
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: 16,
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 20, display: "flex", gap: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  flex: "none",
                  borderRadius: 999,
                  background: danger ? "var(--red-050)" : "var(--lime-050)",
                  color: danger ? "var(--red-500)" : "var(--lime-800)",
                }}
              >
                <Icon name={danger ? "triangle-alert" : "circle-help"} size={17} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div id="confirm-dialog-title" style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
                  {title}
                </div>
                {description ? (
                  <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                    {description}
                  </div>
                ) : null}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "14px 20px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <Button variant="ghost" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                ref={confirmButtonRef}
                variant={danger ? "danger" : "primary"}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "Excluindo…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
