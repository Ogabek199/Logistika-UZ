"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function pageNumbers(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: Props) {
  const t = useT();

  if (totalPages <= 1) return null;

  const pages = pageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted">
        {t("pagination.summary", { total, page, totalPages })}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("pagination.prev")}
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "min-w-10 rounded-xl px-3 py-2 text-sm font-bold transition",
                p === page
                  ? "bg-ink text-white shadow"
                  : "border border-line text-ink hover:bg-mist",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("pagination.next")}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
