"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  variant?: "success" | "error" | "info";
  position?: "top-center" | "bottom-right";
};

export function Toast({
  open,
  message,
  onClose,
  variant = "success",
  position = "top-center",
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [open, onClose, message]);

  if (!open || typeof document === "undefined") return null;

  const tones = {
    success:
      "border-ok/25 bg-paper text-ink shadow-[0_16px_48px_rgba(31,138,91,0.18)]",
    error: "border-danger/25 bg-paper text-ink shadow-lg",
    info: "border-steel/25 bg-paper text-ink shadow-lg",
  };

  return createPortal(
    <div
      className={cn(
        "fixed z-[500] animate-rise",
        position === "top-center"
          ? "top-6 left-1/2 -translate-x-1/2"
          : "bottom-6 right-6",
      )}
    >
      <div
        className={cn(
          "flex min-w-[280px] max-w-sm items-start gap-3 rounded-2xl border p-4",
          tones[variant],
        )}
        role="status"
        aria-live="polite"
      >
        {variant === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" />
        ) : null}
        <p className="flex-1 text-sm font-semibold leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-muted transition hover:bg-mist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
