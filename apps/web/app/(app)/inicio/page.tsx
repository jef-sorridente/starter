"use client";

import { useRouter } from "next/navigation";
import { Button, Icon, StatCard } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { useAuth } from "@/lib/auth-context";
import { useGroups } from "@/lib/queries/groups";
import { useNotes } from "@/lib/queries/notes";
import { useNotificationsSummary } from "@/lib/queries/notifications";
import layout from "@/styles/layout.module.css";
import states from "@/styles/states.module.css";
import typography from "@/styles/typography.module.css";

// Tela pós-login. Num projeto novo, vira o dashboard do produto — o
// HOME_ROUTE (lib/routes.ts) aponta pra cá.
export default function HomePage() {
  const router = useRouter();
  const { auth } = useAuth();
  const { data: notes } = useNotes({ limit: 1 });
  const { data: groups } = useGroups();
  const { data: summary } = useNotificationsSummary();

  useShellMeta(["Início"]);

  const firstName = auth?.profile.name.split(" ")[0] ?? "";

  return (
    <>
      <div className={layout.pageHeader}>
        <div>
          <h2 className={typography.pageTitle}>Olá, {firstName}</h2>
          <p className={typography.pageSubtitle}>Este é o ponto de partida do seu produto.</p>
        </div>
      </div>

      <div className={layout.statGrid}>
        <StatCard label="Anotações pessoais" value={notes ? String(notes.total) : "–"} />
        <StatCard label="Grupos" value={groups ? String(groups.length) : "–"} />
        <StatCard label="Notificações não lidas" value={summary ? String(summary.unread) : "–"} />
      </div>

      <div className={states.infoCallout}>
        <Icon name="info" size={15} color="var(--blue-500)" />
        <div className={states.infoCalloutText}>
          Anotações é o módulo de exemplo da base — o molde de todo módulo novo (skill novo-modulo,
          docs/padroes/arquitetura.md).
        </div>
      </div>

      <div>
        <Button variant="secondary" icon="file-text" onClick={() => router.push("/anotacoes")}>
          Abrir anotações
        </Button>
      </div>
    </>
  );
}
