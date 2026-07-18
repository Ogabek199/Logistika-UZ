"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export type SearchSuggestion = {
  id: string;
  label: string;
  hint?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  suggestions: SearchSuggestion[];
  placeholder?: string;
  className?: string;
};

export function LiveSearch({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const resolvedPlaceholder = placeholder ?? t("common.search");

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          (s.hint || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [suggestions, value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-4 py-3 shadow-sm focus-within:border-steel focus-within:shadow-[0_0_0_4px_rgba(47,127,209,0.12)]">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder={resolvedPlaceholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="rounded-lg p-1 text-muted hover:bg-mist hover:text-ink"
            aria-label={t("common.clear")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && value.trim() && filtered.length > 0 ? (
        <ul className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-mist-2"
                onClick={() => {
                  onChange(s.label);
                  setOpen(false);
                }}
              >
                <span className="font-semibold text-ink">{s.label}</span>
                {s.hint ? (
                  <span className="text-xs text-muted">{s.hint}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
