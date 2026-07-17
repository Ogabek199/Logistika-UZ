"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
}: Props) {
  const t = useT();
  const resolvedPlaceholder = placeholder ?? t("common.select");
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  function updateCoords() {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < 220 && rect.top > 220;
    setCoords({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      openUp,
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
      const pop = document.getElementById("logistika-select-pop");
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
            id="logistika-select-pop"
            className="fixed z-[500] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_rgba(7,21,37,0.28)]"
            style={{
              top: coords.top,
              left: coords.left,
              width: Math.max(coords.width, 200),
              transform: coords.openUp ? "translateY(-100%)" : undefined,
            }}
          >
            <ul className="max-h-64 overflow-y-auto py-1">
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition",
                        active ? "bg-steel/10 font-semibold text-ink" : "text-ink hover:bg-mist-2",
                      )}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">{o.label}</span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-steel" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
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
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <span className="text-ink">{selected.label}</span>
          ) : (
            <span className="text-muted">{resolvedPlaceholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-steel transition",
            open && "rotate-180",
          )}
        />
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
