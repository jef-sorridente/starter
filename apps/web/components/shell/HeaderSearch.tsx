"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Icon, SearchField } from "@app/ui";
import { normalizeForSearch } from "@/lib/text";
import { NAV_ITEMS } from "./navigation";
import styles from "./HeaderSearch.module.css";

const MAX_RESULTS = 8;

export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
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

  const query = normalizeForSearch(value.trim());
  const hasQuery = query.length > 0;

  // Hoje só navega entre páginas. Num produto real, acrescente grupos de
  // resultado por entidade (ex.: um endpoint GET /search) seguindo o
  // mesmo SearchGroup/SearchRow.
  const pageMatches = hasQuery
    ? NAV_ITEMS.filter((item) => normalizeForSearch(item.label).includes(query)).slice(0, MAX_RESULTS)
    : [];
  const noResults = hasQuery && pageMatches.length === 0;

  function go(href: string) {
    setOpen(false);
    setValue("");
    router.push(href);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <SearchField
        width={220}
        placeholder="Buscar…"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />

      <AnimatePresence>
        {open && hasQuery ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0.2, 1] }}
            className={styles.panel}
          >
            {noResults ? (
              <div className={styles.noResults}>Nada encontrado para &quot;{value}&quot;.</div>
            ) : (
              <>
                <SearchGroup label="Páginas">
                  {pageMatches.map((item) => (
                    <SearchRow key={item.href} icon={item.icon} label={item.label} onClick={() => go(item.href)} />
                  ))}
                </SearchGroup>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.group}>
      <div className={styles.groupLabel}>{label}</div>
      {children}
    </div>
  );
}

function SearchRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} onMouseDown={(e) => e.preventDefault()} className={styles.row}>
      <Icon name={icon} size={14} color="var(--text-faint)" />
      <span className={styles.rowLabel}>{label}</span>
    </button>
  );
}
