"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
  footer,
}: ModalProps) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 bg-[#041018]/65 backdrop-blur-[8px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-[201] flex w-full flex-col overflow-hidden rounded-[1.4rem] border border-white/30 bg-white shadow-[0_40px_100px_rgba(4,16,24,0.45)]",
          "max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)]",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="shrink-0 bg-gradient-to-br from-[#0b1f33] via-[#12304a] to-[#1a4a73] px-5 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
                {t("common.brand")}
              </p>
              <h3 className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 text-sm leading-snug text-white/65">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-line bg-[#f4f7fb] px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title ?? t("common.confirm")}
      subtitle={message}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-mist"
        >
          {cancelLabel ?? t("common.cancelFull")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition",
            danger
              ? "bg-danger hover:brightness-110"
              : "bg-steel hover:brightness-110",
          )}
        >
          {confirmLabel ?? t("common.confirmDelete")}
        </button>
      </div>
    </Modal>
  );
}
