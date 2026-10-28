"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, Tag } from "@app/ui";
import { NOTIFICATION_TYPES } from "@app/shared";
import { useShellMeta } from "@/components/shell/ShellContext";
import { ListPanelSkeleton, LoadingRegion } from "@/components/skeletons/Skeletons";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationsSummary,
} from "@/lib/queries/notifications";
import {
  NOTIFICATION_TYPE_COLOR,
  NOTIFICATION_TYPE_HREF,
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABEL,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";
import layout from "@/styles/layout.module.css";
import typography from "@/styles/typography.module.css";
import states from "@/styles/states.module.css";
import styles from "./page.module.css";

type Filter = "all" | "unread" | NotificationType;

const PAGE_SIZE = 50;

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [limit, setLimit] = React.useState(PAGE_SIZE);

  // Filtro e paginação são resolvidos no backend — contar/filtrar no
  // cliente só bate enquanto tudo cabe numa página.
  const { data: page } = useNotifications({
    unreadOnly: filter === "unread",
    type: filter !== "all" && filter !== "unread" ? filter : undefined,
    limit,
  });
  const { data: summary } = useNotificationsSummary();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  async function handleOpen(n: Notification) {
    if (!n.readAt) await markRead.mutateAsync(n.id);
    const href = NOTIFICATION_TYPE_HREF[n.type];
    if (href) router.push(href);
  }

  const notifications = page?.items ?? null;
  const hasMore = page ? page.items.length < page.total : false;
  const unreadCount = summary?.unread ?? 0;

  React.useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [filter]);

  useShellMeta(["Notificações", "Central"]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "unread", label: "Não lidas" },
    ...NOTIFICATION_TYPES.map((type) => ({ id: type, label: NOTIFICATION_TYPE_LABEL[type] })),
  ];

  return (
    <>
      <div className={layout.pageHeader}>
        <div>
          <h2 className={typography.pageTitle}>Notificações</h2>
          <p className={typography.pageSubtitle}>{unreadCount} não lidas.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0}>
          Marcar todas como lidas
        </Button>
      </div>

      <div className={styles.tagRow} role="group" aria-label="Filtrar notificações">
        {filters.map((f) => (
          <Tag
            key={f.id}
            tone={filter === f.id ? "brand" : "neutral"}
            onClick={() => setFilter(f.id)}
            className={layout.clickableTag}
          >
            {f.label}
          </Tag>
        ))}
      </div>

      <div className={styles.body}>
        {notifications === null ? (
          <LoadingRegion>
            <ListPanelSkeleton rows={6} header={false} trailing={48} />
          </LoadingRegion>
        ) : notifications.length === 0 ? (
          <div className={states.emptyState}>
            <Icon name="bell" size={24} color="var(--text-faint)" />
            <div className={states.emptyTitle}>Tudo em dia</div>
            <div className={`${states.emptyDescription} ${styles.emptyDescriptionWide}`}>
              Nenhuma notificação por aqui. Convites e avisos do app aparecem nesta central.
            </div>
            <Button variant="ghost" onClick={() => router.push("/notificacoes/preferencias")}>
              Ver preferências
            </Button>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((n) => (
              <button
                type="button"
                key={n.id}
                onClick={() => void handleOpen(n)}
                className={`${styles.row} ${n.readAt ? "" : styles.unread}`}
              >
                <span
                  className={styles.dot}
                  style={{ background: n.readAt ? "var(--border-strong)" : NOTIFICATION_TYPE_COLOR[n.type] }}
                />
                <span className={styles.icon}>
                  <Icon name={NOTIFICATION_TYPE_ICON[n.type]} size={14} color={NOTIFICATION_TYPE_COLOR[n.type]} />
                </span>
                <div className={styles.rowMain}>
                  <div className={`${styles.rowMessage} ${n.readAt ? "" : styles.unread}`}>{n.message}</div>
                  <div className={styles.rowDate}>{new Date(n.createdAt).toLocaleString("pt-BR")}</div>
                </div>
                <Badge tone="neutral">{NOTIFICATION_TYPE_LABEL[n.type]}</Badge>
              </button>
            ))}
            {hasMore ? (
              <div className={styles.loadMoreWrap}>
                <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  Carregar mais
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <div className={styles.sidebar}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>Resumo</div>
            <div className={styles.summaryBody}>
              {NOTIFICATION_TYPES.map((type) => (
                <div key={type} className={styles.summaryRow}>
                  <span>{NOTIFICATION_TYPE_LABEL[type]}</span>
                  <span style={{ color: NOTIFICATION_TYPE_COLOR[type] }}>{summary?.byType[type] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
