"use client";

import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

type LoadingScreenProps = {
  label?: string;
  variant?: "page" | "panel" | "inline" | "atmosphere";
  className?: string;
};

export function LoadingScreen({
  label,
  variant = "page",
  className,
}: LoadingScreenProps) {
  const t = useT();
  const text = label ?? t("common.loading");

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 text-sm font-medium text-muted",
          className,
        )}
      >
        <Spinner size="sm" />
        <span>{text}</span>
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-paper/80 px-6 py-12",
          className,
        )}
      >
        <Spinner size="md" />
        <p className="text-sm font-semibold text-muted">{text}</p>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-mist">
          <div className="loading-bar h-full w-1/2 rounded-full bg-steel" />
        </div>
      </div>
    );
  }

  if (variant === "atmosphere") {
    return (
      <div
        className={cn(
          "flex min-h-screen flex-col items-center justify-center gap-5 bg-atmosphere px-6 text-white",
          className,
        )}
      >
        <Spinner size="md" className="border-white/20 border-t-white" />
        <p className="text-sm font-semibold text-white/70">{text}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "page-shell flex min-h-screen flex-col items-center justify-center gap-5 px-6",
        className,
      )}
    >
      <Spinner size="md" />
      <p className="text-sm font-semibold text-muted">{text}</p>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-mist">
        <div className="loading-bar h-full w-1/2 rounded-full bg-steel" />
      </div>
    </div>
  );
}

type TableSkeletonProps = {
  rows?: number;
  cols?: number;
};

export function TableSkeleton({ rows = 6, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-paper shadow-sm">
      <div className="border-b border-line bg-mist-2/60 px-4 py-3">
        <div className="h-3 w-40 animate-pulse rounded bg-mist" />
      </div>
      <div className="divide-y divide-line/70">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3 flex-1 animate-pulse rounded bg-mist"
                style={{ animationDelay: `${(r * cols + c) * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-3xl bg-gradient-to-br from-mist to-mist-2"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
