"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../core/Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "style"
> {
  label?: string;
  value: string;
  options?: Array<SelectOption | string>;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  hint?: string;
  onChange?(event: { target: { value: string } }): void;
  style?: React.CSSProperties;
  // Campo de busca no topo da lista aberta. Padrão: liga sozinho a
  // partir de SEARCH_THRESHOLD opções — lista curta (ex.: 3 tipos de
  // conta) não precisa, e a caixa de busca só atrapalharia.
  searchable?: boolean;
  searchPlaceholder?: string;
}

const SEARCH_THRESHOLD = 8;

function normalizeOption(option: SelectOption | string): SelectOption {
  return typeof option === "string" ? { value: option, label: option } : option;
}

// Busca sem acento e sem diferenciar maiúscula ("educacao" acha
// "Educação"). Busca por trecho, então o "↳ " de subcategoria não
// atrapalha.
function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function Select({
  label,
  value,
  options = [],
  disabled = false,
  invalid = false,
  placeholder = "Selecione…",
  hint,
  onChange,
  style,
  searchable,
  searchPlaceholder = "Buscar…",
  ...rest
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const items = React.useMemo(() => options.map(normalizeOption), [options]);
  const selected = items.find((item) => item.value === value);
  const withSearch = searchable ?? items.length >= SEARCH_THRESHOLD;

  const filtered = React.useMemo(() => {
    const q = normalizeText(query.trim());
    return q ? items.filter((item) => normalizeText(item.label).includes(q)) : items;
  }, [items, query]);

  React.useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open]);

  // Ao abrir (ou ao limpar a busca) a opção selecionada começa ativa;
  // digitando, a 1ª que casar.
  React.useEffect(() => {
    if (!open) return;
    if (query.trim()) {
      setActiveIndex(filtered.length > 0 ? 0 : -1);
      return;
    }
    const idx = filtered.findIndex((item) => item.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, filtered, query, value]);

  React.useEffect(() => {
    if (open && withSearch) searchRef.current?.focus();
    if (!open) setQuery("");
  }, [open, withSearch]);

  React.useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    // jsdom não implementa scrollIntoView
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus && withSearch) triggerRef.current?.focus();
  }

  function commit(index: number) {
    const item = filtered[index];
    if (!item) return;
    onChange?.({ target: { value: item.value } });
    close(true);
  }

  // Teclas de navegação com a lista aberta — compartilhadas entre o
  // botão (sem busca) e o campo de busca. Espaço só confirma a partir do
  // botão; no campo de busca ele é texto.
  function handleListKey(e: React.KeyboardEvent, allowSpaceCommit: boolean) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || (allowSpaceCommit && e.key === " ")) {
      e.preventDefault();
      commit(activeIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      } else if (withSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Começar a digitar com o campo fechado já abre buscando.
        e.preventDefault();
        setQuery(e.key);
        setOpen(true);
      }
      return;
    }
    handleListKey(e, true);
  }

  return (
    <label style={{ display: "block", ...style }}>
      {label ? (
        <span
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: "var(--fs-micro)",
            letterSpacing: "var(--ls-wide)",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      ) : null}

      <div ref={rootRef} style={{ position: "relative" }}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onTriggerKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            height: "var(--field-height)",
            padding: "0 12px",
            background: disabled ? "var(--surface-sunken)" : "var(--surface-field)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: invalid ? "var(--red-500)" : focus || open ? "var(--border-brand)" : "var(--border-field)",
            borderRadius: "var(--radius-md)",
            boxShadow: focus || open ? "var(--shadow-focus)" : "var(--shadow-inset-field)",
            transition: "var(--transition-control)",
            font: "inherit",
            fontSize: "var(--fs-body)",
            color: selected ? "var(--text-primary)" : "var(--text-faint)",
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "left",
          }}
          {...rest}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? selected.label : placeholder}
          </span>
          <Icon
            name="chevron-down"
            size={15}
            color="var(--text-faint)"
            style={{
              flex: "none",
              transform: open ? "rotate(180deg)" : "none",
              transition: `transform var(--dur-instant) var(--ease-standard)`,
            }}
          />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: [0.2, 0, 0.2, 1] }}
              style={{
                position: "absolute",
                zIndex: 40,
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                minWidth: withSearch ? 200 : undefined,
                background: "var(--surface-panel)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-default)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                overflow: "hidden",
              }}
            >
              {withSearch ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "6px 6px 0",
                    padding: "0 10px",
                    height: 34,
                    background: "var(--surface-field)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-field)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <Icon name="search" size={14} color="var(--text-faint)" />
                  <input
                    ref={searchRef}
                    type="text"
                    role="searchbox"
                    aria-label={searchPlaceholder}
                    value={query}
                    placeholder={searchPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => handleListKey(e, false)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 0,
                      outline: "none",
                      background: "transparent",
                      font: "inherit",
                      fontSize: "var(--fs-body-sm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              ) : null}
              <ul
                ref={listRef}
                role="listbox"
                tabIndex={-1}
                style={{
                  margin: 0,
                  padding: 6,
                  listStyle: "none",
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                {filtered.length === 0 ? (
                  <li style={{ padding: "8px 10px", fontSize: "var(--fs-body-sm)", color: "var(--text-faint)" }}>
                    {query.trim() ? `Nada encontrado para "${query.trim()}"` : "Nenhuma opção"}
                  </li>
                ) : (
                  filtered.map((item, i) => {
                    const isSelected = item.value === value;
                    const isActive = i === activeIndex;
                    return (
                      // Teclado é tratado no listbox (setas/Enter/Esc com
                      // aria-activedescendant), padrão WAI-ARIA de combobox —
                      // a opção em si só precisa do clique.
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                      <li
                        key={item.value}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => commit(i)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "var(--fs-body)",
                          color: isSelected ? "var(--lime-500)" : "var(--text-primary)",
                          background: isActive ? "var(--surface-hover)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                        {isSelected ? <Icon name="check" size={14} color="var(--lime-500)" /> : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {hint ? (
        <span
          style={{
            display: "block",
            marginTop: 5,
            fontSize: "var(--fs-caption)",
            color: invalid ? "var(--text-negative)" : "var(--text-muted)",
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { Select };
