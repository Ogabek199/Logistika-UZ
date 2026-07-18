"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format, parse, parseISO, isValid } from "date-fns";
import { uz, ru } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn, formatDateMask } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import "react-day-picker/style.css";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** Inputda qo‘lda yozish + kalendar */
  allowManual?: boolean;
};

function parseFlexibleDate(raw: string): Date | undefined {
  const s = raw.trim();
  if (!s) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parseISO(s);
    return isValid(d) ? d : undefined;
  }

  for (const pattern of ["dd.MM.yyyy", "dd/MM/yyyy", "dd-MM-yyyy", "d.M.yyyy"]) {
    const d = parse(s, pattern, new Date());
    if (isValid(d)) return d;
  }

  return undefined;
}

function toIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function toDisplay(d: Date) {
  return format(d, "dd.MM.yyyy");
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  required,
  className,
  allowManual = false,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const dfLocale = locale === "ru" ? ru : uz;
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const resolvedPlaceholder = placeholder ?? t("common.pickDate");

  const selected = useMemo(() => {
    if (!value) return undefined;
    return parseFlexibleDate(value);
  }, [value]);

  const [manualText, setManualText] = useState(() =>
    selected ? toDisplay(selected) : "",
  );

  useEffect(() => {
    setManualText(selected ? toDisplay(selected) : "");
  }, [selected]);

  function updateCoords() {
    const el = allowManual ? wrapRef.current : btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popWidth = Math.max(rect.width, 300);
    const left = Math.min(
      rect.left,
      Math.max(8, window.innerWidth - popWidth - 8),
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 340 && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left,
      width: popWidth,
    });
  }

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = () => updateCoords();
    const onResize = () => updateCoords();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, allowManual]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (wrapRef.current?.contains(target)) return;
      const pop = document.getElementById("logistika-datepicker-pop");
      if (pop?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function commitManual(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      setManualText("");
      return;
    }
    const d = parseFlexibleDate(trimmed);
    if (d) {
      onChange(toIso(d));
      setManualText(toDisplay(d));
    } else {
      // Noto‘g‘ri format — foydalanuvchi yozganini saqlab qolamiz, lekin ISO emas
      setManualText(trimmed);
    }
  }

  function selectDay(day: Date) {
    onChange(toIso(day));
    setManualText(toDisplay(day));
    setOpen(false);
  }

  const popup =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            id="logistika-datepicker-pop"
            className="fixed z-[500] rounded-2xl border border-line bg-paper p-3 shadow-[0_24px_60px_rgba(7,21,37,0.28)]"
            style={{
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              transform:
                coords.top <
                ((allowManual ? wrapRef.current : btnRef.current)?.getBoundingClientRect()
                  .top || 0)
                  ? "translateY(-100%)"
                  : undefined,
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(day) => {
                if (!day) return;
                selectDay(day);
              }}
              locale={dfLocale}
              className="rdp-logistika"
            />
          </div>,
          document.body,
        )
      : null;

  if (allowManual) {
    return (
      <div ref={wrapRef} className={cn("relative", className)}>
        <div className="input-field flex items-center gap-2 pr-1.5">
          <input
            type="text"
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            placeholder={placeholder ?? "dd.mm.yyyy"}
            value={manualText}
            onChange={(e) => {
              const next = formatDateMask(e.target.value);
              setManualText(next);
              const d = parseFlexibleDate(next);
              if (d && next.length === 10) {
                onChange(toIso(d));
              } else if (!next) {
                onChange("");
              }
            }}
            onBlur={() => commitManual(manualText)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitManual(manualText);
                (e.target as HTMLInputElement).blur();
              }
            }}
            required={required}
          />
          <button
            ref={btnRef}
            type="button"
            aria-label={resolvedPlaceholder}
            onClick={() => {
              updateCoords();
              setOpen((v) => !v);
            }}
            className="rounded-lg p-1.5 text-steel transition hover:bg-mist"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
        {popup}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          updateCoords();
          setOpen((v) => !v);
        }}
        className="input-field flex items-center justify-between gap-3 text-left"
      >
        <span className={selected ? "text-ink" : "text-muted"}>
          {selected
            ? format(selected, "dd MMMM yyyy", { locale: dfLocale })
            : resolvedPlaceholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-steel" />
      </button>
      {required ? (
        <input
          tabIndex={-1}
          className="sr-only"
          value={value || ""}
          onChange={() => undefined}
          required
        />
      ) : null}
      {popup}
    </div>
  );
}
