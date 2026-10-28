"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, Input, SkeletonCard } from "@app/ui";
import { useShellMeta } from "@/components/shell/ShellContext";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useCreateGroup, useGroups, useMyInvites } from "@/lib/queries/groups";
import { ROLE_LABEL, type Group } from "@/lib/groups";
import layout from "@/styles/layout.module.css";
import typography from "@/styles/typography.module.css";
import styles from "./page.module.css";

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const createGroup = useCreateGroup();

  async function handleCreate() {
    if (!name) return;
    setError(null);
    try {
      const group = await createGroup.mutateAsync({ name });
      onCreated(group);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o grupo.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={styles.overlay}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
        className={styles.modal}
      >
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Novo grupo</div>
            <div className={styles.modalSubtitle}>Você entra como dono.</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className={styles.modalBody}>
          {error ? <div className={styles.errorText}>{error}</div> : null}

          <Input
            label="Nome do grupo"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            hint="Dá pra renomear depois."
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={onClose} disabled={createGroup.isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={createGroup.isPending || !name}>
              {createGroup.isPending ? "Criando…" : "Criar grupo"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const { auth } = useAuth();
  const [showCreate, setShowCreate] = React.useState(false);

  const { data: groups } = useGroups();
  const { data: invites = [] } = useMyInvites();

  useShellMeta(["Grupos", "Espaços"]);

  return (
    <>
      <div className={layout.pageHeader}>
        <div>
          <h2 className={typography.pageTitle}>Espaços</h2>
          <p className={typography.pageSubtitle}>Seu espaço pessoal e os grupos que você participa.</p>
        </div>
        <Button variant="primary" icon="circle-plus" onClick={() => setShowCreate(true)}>
          Criar grupo
        </Button>
      </div>

      <div className={styles.spacesGrid}>
        <div className={styles.currentCard}>
          <div className={styles.cardTopRow}>
            <Icon name="circle-user" size={18} color="var(--lime-500)" />
            <Badge tone="active">Atual</Badge>
          </div>
          <div>
            <div className={styles.spaceTitle}>Pessoal</div>
            <div className={styles.spaceMeta}>Só você</div>
          </div>
        </div>

        {groups === undefined ? (
          <>
            <SkeletonCard height={150} />
            <SkeletonCard height={150} />
          </>
        ) : (
          groups.map((g) => {
            const me = g.members.find((m) => m.userId === auth?.profile.id);
            return (
              <button key={g.id} onClick={() => router.push(`/grupos/${g.id}`)} className={styles.groupCard}>
                <div className={styles.cardTopRow}>
                  <Icon name="users" size={18} color="var(--text-faint)" />
                  <Badge tone="neutral">{me ? ROLE_LABEL[me.role] : "Membro"}</Badge>
                </div>
                <div>
                  <div className={styles.spaceTitle}>{g.name}</div>
                  <div className={styles.spaceMeta}>
                    {g.members.length} {g.members.length === 1 ? "membro" : "membros"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {invites.length > 0 ? (
        <div className={styles.inviteBanner}>
          <div className={styles.inviteLeft}>
            <Icon name="info" size={15} color="var(--blue-500)" />
            <span className={styles.inviteText}>
              Convite pendente para o grupo &quot;{invites[0].group?.name}&quot;.
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push(`/convites/${invites[0].token}`)}>
            Ver convite
          </Button>
        </div>
      ) : null}

      <AnimatePresence>
        {showCreate ? (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreated={(g) => {
              setShowCreate(false);
              // Grupo recém-criado só tem o dono — o próximo passo natural
              // é convidar alguém.
              router.push(`/grupos/${g.id}/convidar`);
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
