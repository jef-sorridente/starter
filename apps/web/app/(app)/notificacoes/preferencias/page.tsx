"use client";

import { Icon, SkeletonRows } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { LoadingRegion } from "@/components/skeletons/Skeletons";
import { useNotificationPreferences, useUpdateNotificationPreference } from "@/lib/queries/notifications";
import {
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABEL,
  NOTIFICATION_TYPE_META,
  type NotificationType,
} from "@/lib/notifications";
import styles from "./page.module.css";

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`${styles.toggleTrack} ${on ? styles.on : ""}`}
    >
      <span className={`${styles.toggleThumb} ${on ? styles.on : ""}`} />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const { data: prefs = null } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  async function toggle(type: NotificationType, field: "pushEnabled" | "emailEnabled") {
    const current = prefs?.find((p) => p.type === type);
    if (!current) return;
    await updatePreference.mutateAsync({ type, field, value: !current[field] });
  }

  useShellMeta(["Notificações", "Preferências"]);

  return (
    <>
      <div>
        <h2 className={styles.title}>Preferências de notificação</h2>
        <p className={styles.subtitle}>Cada tipo tem controle separado de push e e-mail.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <span className={styles.tableHeaderLabel}>Tipo</span>
          <span className={styles.tableHeaderCol}>Push</span>
          <span className={styles.tableHeaderCol}>Email</span>
        </div>
        {prefs === null ? (
          <LoadingRegion>
            <SkeletonRows count={3} lines={1} trailing={96} />
          </LoadingRegion>
        ) : (
          prefs.map((p) => (
            <div key={p.type} className={styles.row}>
              <span className={styles.rowIcon}>
                <Icon name={NOTIFICATION_TYPE_ICON[p.type]} size={14} color="var(--text-body)" />
              </span>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>{NOTIFICATION_TYPE_LABEL[p.type]}</div>
                <div className={styles.rowMeta}>{NOTIFICATION_TYPE_META[p.type]}</div>
              </div>
              <span className={styles.toggleCol}>
                <Toggle
                  on={p.pushEnabled}
                  label={`Push: ${NOTIFICATION_TYPE_LABEL[p.type]}`}
                  onClick={() => void toggle(p.type, "pushEnabled")}
                />
              </span>
              <span className={styles.toggleCol}>
                <Toggle
                  on={p.emailEnabled}
                  label={`E-mail: ${NOTIFICATION_TYPE_LABEL[p.type]}`}
                  onClick={() => void toggle(p.type, "emailEnabled")}
                />
              </span>
            </div>
          ))
        )}
      </div>

      <div className={styles.calloutCard}>
        <Icon name="info" size={15} color="var(--blue-500)" />
        <div className={styles.calloutText}>
          Notificações de grupo chegam para todos os membros envolvidos, sem distinção de papel.
        </div>
      </div>
    </>
  );
}
