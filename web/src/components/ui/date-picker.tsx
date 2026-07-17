"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format, parseISO, isValid } from "date-fns";
import { uz, ru } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import "react-day-picker/style.css";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder,
  required,
  className,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const dfLocale = locale === "ru" ? ru : uz;
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const resolvedPlaceholder = placeholder ?? t("common.pickDate");

  const selected = useMemo(() => {
    if (!value) return undefined;
    const d = parseISO(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  function updateCoords() {
    const el = btnRef.current;
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      const pop = document.getElementById("logistika-datepicker-pop");
      if (pop?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const popup =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            id="logistika-datepicker-pop"
            className="fixed z-[500] rounded-2xl border border-line bg-white p-3 shadow-[0_24px_60px_rgba(7,21,37,0.28)]"
            style={{
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              transform:
                coords.top < (btnRef.current?.getBoundingClientRect().top || 0)
                  ? "translateY(-100%)"
                  : undefined,
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(day) => {
                if (!day) return;
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }}
              locale={dfLocale}
              className="rdp-logistika"
            />
          </div>,
          document.body,
        )
      : null;

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
