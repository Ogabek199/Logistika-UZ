"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "accent";
  divider?: boolean;
};

export function ActionMenu({
  items,
  label,
}: {
  items: ActionItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const MENU_WIDTH = 210;

  function updateCoords() {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.max(8, rect.right - MENU_WIDTH);
    const estHeight = items.length * 40 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estHeight && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top - estHeight - 4 : rect.bottom + 6,
      left,
    });
  }

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      const pop = document.getElementById("logistika-action-menu");
      if (pop?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toneClass = (tone?: ActionItem["tone"]) =>
    tone === "danger"
      ? "text-danger hover:bg-danger/10"
      : tone === "accent"
        ? "text-steel hover:bg-steel/10"
        : "text-ink hover:bg-mist-2";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        onClick={() => {
          updateCoords();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-line bg-white p-1.5 text-ink transition hover:bg-mist",
          open && "border-steel bg-mist",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id="logistika-action-menu"
              className="fixed z-[400] overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_24px_60px_rgba(7,21,37,0.22)]"
              style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            >
              {items.map((item) => {
                const inner = (
                  <>
                    {item.icon ? (
                      <span className="shrink-0">{item.icon}</span>
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </>
                );
                const className = cn(
                  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-semibold transition",
                  toneClass(item.tone),
                  item.divider && "mt-1.5 border-t border-line/70 pt-2.5",
                );
                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={className}
                      onClick={() => setOpen(false)}
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={className}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
