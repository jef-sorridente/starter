"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, IconButton } from "@app/ui";
import { useMarkNotificationRead, useNotifications, useNotificationsSummary } from "@/lib/queries/notifications";
import {
  NOTIFICATION_TYPE_COLOR,
  NOTIFICATION_TYPE_HREF,
  NOTIFICATION_TYPE_ICON,
  type Notification,
} from "@/lib/notifications";
import styles from "./HeaderNotifications.module.css";

const MAX_ITEMS = 10;

export function HeaderNotifications() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const { data: page } = useNotifications({ limit: MAX_ITEMS });
  const { data: summary } = useNotificationsSummary();
  const markRead = useMarkNotificationRead();

  const unreadCount = summary?.unread ?? 0;
  const recent = page?.items ?? [];

  React.useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open]);

  async function handleOpenNotification(n: Notification) {
    if (!n.readAt) await markRead.mutateAsync(n.id);
    const href = NOTIFICATION_TYPE_HREF[n.type];
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <IconButton icon="bell" label="Notificações" badge={unreadCount > 0} onClick={() => setOpen((v) => !v)} />

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
              <span className={styles.headerTitle}>Notificações</span>
              {unreadCount > 0 ? (
                <Badge tone="warning">
                  {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                </Badge>
              ) : null}
            </div>

            <div className={styles.list}>
              {recent.length === 0 ? (
                <div className={styles.emptyNote}>Nenhuma notificação por aqui.</div>
              ) : (
                recent.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => handleOpenNotification(n)}
                    className={`${styles.row} ${n.readAt ? "" : styles.unread}`}
                  >
                    <span
                      className={styles.dot}
                      style={{ background: n.readAt ? "var(--border-strong)" : NOTIFICATION_TYPE_COLOR[n.type] }}
                    />
                    <span className={styles.rowIcon}>
                      <Icon name={NOTIFICATION_TYPE_ICON[n.type]} size={13} color={NOTIFICATION_TYPE_COLOR[n.type]} />
                    </span>
                    <div className={styles.rowMain}>
                      <div className={`${styles.rowMessage} ${n.readAt ? "" : styles.unread}`}>{n.message}</div>
                      <div className={styles.rowDate}>{new Date(n.createdAt).toLocaleString("pt-BR")}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className={styles.footer}>
              <Button
                variant="ghost"
                size="sm"
                block
                onClick={() => {
                  setOpen(false);
                  router.push("/notificacoes");
                }}
              >
                Ver todas
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
