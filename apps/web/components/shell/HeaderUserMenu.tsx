"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button, UserChip } from "@app/ui";
import { useAuth } from "@/lib/auth-context";
import styles from "./HeaderUserMenu.module.css";

export function HeaderUserMenu() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open]);

  if (!auth) return null;

  function handleLogout() {
    setOpen(false);
    void logout();
    router.push("/login");
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <UserChip name={auth.profile.name} email={auth.profile.email} onClick={() => setOpen((v) => !v)} />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0.2, 1] }}
            className={styles.panel}
          >
            <div className={styles.header}>
              <div className={styles.name}>{auth.profile.name}</div>
              <div className={styles.email}>{auth.profile.email}</div>
            </div>
            <div className={styles.body}>
              <Button
                variant="ghost"
                size="sm"
                icon="file-text"
                block
                onClick={() => {
                  setOpen(false);
                  router.push("/perfil");
                }}
              >
                Ver perfil
              </Button>
              <div className={styles.logoutRow}>
                <Button variant="danger" size="sm" icon="log-out" block onClick={handleLogout}>
                  Sair do app
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
