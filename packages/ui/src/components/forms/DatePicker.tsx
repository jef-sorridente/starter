"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../core/Icon";

export interface DatePickerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "style"
> {
  label?: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  hint?: string;
  min?: string;
  max?: string;
  // Quando true, o valor/onChange usam "AAAA-MM" (sem dia) e o
  // calendário nunca desce pro nível de dias — abre direto no grid de
  // meses, e escolher um mês já confirma e fecha.
  monthOnly?: boolean;
  onChange?(event: { target: { value: string } }): void;
  style?: React.CSSProperties;
}

type View = "days" | "months" | "years";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const MONTH_LABELS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const YEARS_PER_PAGE = 12;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function toMonthValue(year: number, month: number) {
  return `${year}-${pad(month + 1)}`;
}

function parseISO(value: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function parseMonthValue(value: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}

function formatDisplay(value: string) {
  const parsed = parseISO(value);
  if (!parsed) return "";
  return `${pad(parsed.day)}/${pad(parsed.month + 1)}/${parsed.year}`;
}

function formatMonthDisplay(value: string) {
  const parsed = parseMonthValue(value);
  if (!parsed) return "";
  return `${MONTH_LABELS[parsed.month]} ${parsed.year}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function iconButtonStyle(): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    background: "transparent",
    border: 0,
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    cursor: "pointer",
  };
}

function DatePicker({
  label,
  value,
  disabled = false,
  invalid = false,
  placeholder = "Selecione uma data",
  hint,
  min,
  max,
  monthOnly = false,
  onChange,
  style,
  ...rest
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [view, setView] = React.useState<View>(monthOnly ? "months" : "days");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selectedDay = monthOnly ? null : parseISO(value);
  const selectedMonth = monthOnly ? parseMonthValue(value) : null;
  const selected = monthOnly ? selectedMonth : selectedDay;
  const today = new Date();

  const [viewYear, setViewYear] = React.useState(selected?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(selected?.month ?? today.getMonth());

  React.useEffect(() => {
    if (open) {
      setViewYear(selected?.year ?? today.getFullYear());
      setViewMonth(selected?.month ?? today.getMonth());
      setView(monthOnly ? "months" : "days");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  function isDisabledDay(iso: string) {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function commitDay(iso: string) {
    if (isDisabledDay(iso)) return;
    onChange?.({ target: { value: iso } });
    setOpen(false);
  }

  function commitMonth(year: number, month: number) {
    onChange?.({ target: { value: toMonthValue(year, month) } });
    setOpen(false);
  }

  function handleHeaderClick() {
    if (view === "days") setView("months");
    else if (view === "months") setView("years");
  }

  function handleMonthPick(month: number) {
    if (monthOnly) {
      commitMonth(viewYear, month);
    } else {
      setViewMonth(month);
      setView("days");
    }
  }

  function handleYearPick(year: number) {
    setViewYear(year);
    setView("months");
  }

  function goPrev() {
    if (view === "days") {
      let m = viewMonth - 1,
        y = viewYear;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      setViewMonth(m);
      setViewYear(y);
    } else if (view === "months") {
      setViewYear((y) => y - 1);
    } else {
      setViewYear((y) => y - YEARS_PER_PAGE);
    }
  }

  function goNext() {
    if (view === "days") {
      let m = viewMonth + 1,
        y = viewYear;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      setViewMonth(m);
      setViewYear(y);
    } else if (view === "months") {
      setViewYear((y) => y + 1);
    } else {
      setViewYear((y) => y + YEARS_PER_PAGE);
    }
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, iso: toISO(viewYear, viewMonth, d) });

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const decadeStart = Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const yearCells = Array.from({ length: YEARS_PER_PAGE }, (_, i) => decadeStart + i);

  const displayValue = monthOnly ? formatMonthDisplay(value) : formatDisplay(value);

  const headerLabel =
    view === "days"
      ? `${MONTH_LABELS[viewMonth]} ${viewYear}`
      : view === "months"
        ? `${viewYear}`
        : `${decadeStart} - ${decadeStart + YEARS_PER_PAGE - 1}`;

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
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((o) => !o)}
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
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textTransform: monthOnly ? "capitalize" : "none",
            }}
          >
            {selected ? displayValue : placeholder}
          </span>
          <Icon name="calendar" size={15} color="var(--text-faint)" style={{ flex: "none" }} />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              role="dialog"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: [0.2, 0, 0.2, 1] }}
              style={{
                position: "absolute",
                zIndex: 40,
                top: "calc(100% + 6px)",
                right: 0,
                width: 280,
                padding: 12,
                background: "var(--surface-panel)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-default)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Anterior"
                  style={iconButtonStyle()}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name="chevron-left" size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleHeaderClick}
                  disabled={view === "years"}
                  style={{
                    fontSize: "var(--fs-body-sm)",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    background: "transparent",
                    border: 0,
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 10px",
                    cursor: view === "years" ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (view !== "years") e.currentTarget.style.background = "var(--surface-hover)";
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {headerLabel}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Próximo"
                  style={iconButtonStyle()}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name="chevron-right" size={15} />
                </button>
              </div>

              {view === "days" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                    {WEEKDAY_LABELS.map((w, i) => (
                      <div
                        key={i}
                        style={{
                          textAlign: "center",
                          fontSize: "var(--fs-micro)",
                          color: "var(--text-faint)",
                          padding: "4px 0",
                        }}
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                    {cells.map((cell, i) => {
                      if (!cell) return <div key={i} />;
                      const isSelected = value === cell.iso;
                      const isToday = cell.iso === todayISO;
                      const disabledDay = isDisabledDay(cell.iso);
                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          disabled={disabledDay}
                          onClick={() => commitDay(cell.iso)}
                          style={{
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--fs-body-sm)",
                            borderRadius: "var(--radius-sm)",
                            border:
                              isToday && !isSelected ? "1px solid var(--border-default)" : "1px solid transparent",
                            background: isSelected ? "var(--lime-500)" : "transparent",
                            color: isSelected
                              ? "var(--ink-950)"
                              : disabledDay
                                ? "var(--text-faint)"
                                : "var(--text-primary)",
                            cursor: disabledDay ? "not-allowed" : "pointer",
                            opacity: disabledDay ? 0.4 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected && !disabledDay) e.currentTarget.style.background = "var(--surface-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => commitDay(todayISO)}
                    disabled={isDisabledDay(todayISO)}
                    style={{
                      width: "100%",
                      marginTop: 10,
                      padding: "6px 0",
                      fontSize: "var(--fs-body-sm)",
                      color: "var(--text-link)",
                      background: "transparent",
                      border: 0,
                      cursor: isDisabledDay(todayISO) ? "not-allowed" : "pointer",
                      opacity: isDisabledDay(todayISO) ? 0.4 : 1,
                    }}
                  >
                    Hoje
                  </button>
                </>
              ) : view === "months" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {MONTH_LABELS_SHORT.map((m, i) => {
                      const isSelected = Boolean(selected && selected.year === viewYear && selected.month === i);
                      const isCurrentMonth = viewYear === today.getFullYear() && i === today.getMonth();
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMonthPick(i)}
                          style={{
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--fs-body-sm)",
                            borderRadius: "var(--radius-sm)",
                            border:
                              isCurrentMonth && !isSelected
                                ? "1px solid var(--border-default)"
                                : "1px solid transparent",
                            background: isSelected ? "var(--lime-500)" : "transparent",
                            color: isSelected ? "var(--ink-950)" : "var(--text-primary)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "var(--surface-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                  {monthOnly ? (
                    <button
                      type="button"
                      onClick={() => commitMonth(today.getFullYear(), today.getMonth())}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: "6px 0",
                        fontSize: "var(--fs-body-sm)",
                        color: "var(--text-link)",
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                      }}
                    >
                      Mês atual
                    </button>
                  ) : null}
                </>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {yearCells.map((y) => {
                    const isSelected = selected?.year === y;
                    const isCurrentYear = y === today.getFullYear();
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => handleYearPick(y)}
                        style={{
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--fs-body-sm)",
                          borderRadius: "var(--radius-sm)",
                          border:
                            isCurrentYear && !isSelected ? "1px solid var(--border-default)" : "1px solid transparent",
                          background: isSelected ? "var(--lime-500)" : "transparent",
                          color: isSelected ? "var(--ink-950)" : "var(--text-primary)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "var(--surface-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}
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

export { DatePicker };
