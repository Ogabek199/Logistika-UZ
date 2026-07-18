"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  /** Extra line (e.g. plate number); also included in search */
  detail?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function SearchSelect({
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
  const [q, setQ] = useState("");
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s+/g, "");
    if (!term) return options;
    return options.filter((o) => {
      const haystack = [o.label, o.hint, o.detail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, "");
      return haystack.includes(term);
    });
  }, [options, q]);

  function updateCoords() {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < 280 && rect.top > 280;
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
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onScroll = () => updateCoords();
    const onResize = () => updateCoords();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      const pop = document.getElementById("logistika-search-select-pop");
      if (pop?.contains(target)) return;
      setOpen(false);
      setQ("");
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const popup =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            id="logistika-search-select-pop"
            className="fixed z-[500] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_24px_60px_rgba(7,21,37,0.28)]"
            style={{
              top: coords.top,
              left: coords.left,
              width: Math.max(coords.width, 280),
              transform: coords.openUp ? "translateY(-100%)" : undefined,
            }}
          >
            <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                className="w-full bg-transparent text-sm outline-none"
                placeholder={t("common.searchNamePhone")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted">
                  {t("common.noResult")}
                </li>
              ) : (
                filtered.map((o) => {
                  const active = o.value === value;
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                          active ? "bg-steel/10" : "hover:bg-mist-2",
                        )}
                        onClick={() => {
                          onChange(o.value);
                          setOpen(false);
                          setQ("");
                        }}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            active
                              ? "bg-steel text-white"
                              : "bg-mist text-steel",
                          )}
                        >
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {o.label}
                          </span>
                          {o.hint ? (
                            <span className="block truncate text-xs text-muted">
                              {o.hint}
                            </span>
                          ) : null}
                          {o.detail ? (
                            <span className="block truncate text-xs font-medium text-ink/70">
                              {o.detail}
                            </span>
                          ) : null}
                        </span>
                        {active ? (
                          <Check className="h-4 w-4 shrink-0 text-steel" />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
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
            <span className="text-ink">
              {selected.label}
              {selected.hint ? (
                <span className="text-muted"> · {selected.hint}</span>
              ) : null}
              {selected.detail ? (
                <span className="text-muted"> · {selected.detail}</span>
              ) : null}
            </span>
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
