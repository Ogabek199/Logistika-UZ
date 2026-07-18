"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isDesktopSafari,
  isIosSafari,
  isSecurePwaContext,
  isStandaloneDisplay,
  wasInstallDismissed,
} from "@/lib/pwa";
import { BrandLogo } from "@/components/brand-logo";
import { Modal } from "@/components/ui/modal";

type PwaInstallBannerProps = {
  className?: string;
};

export function PwaInstallBanner({ className }: PwaInstallBannerProps) {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSecurePwaContext()) return;
    if (isStandaloneDisplay()) return;
    if (wasInstallDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Safari / browsers without beforeinstallprompt: show manual tip after a beat.
    const tipTimer = window.setTimeout(() => {
      if (isStandaloneDisplay() || wasInstallDismissed()) return;
      if (isIosSafari() || isDesktopSafari()) {
        setVisible(true);
      }
    }, 2500);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      setHelpOpen(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(tipTimer);
    };
  }, []);

  if (!visible) return null;

  async function onInstall() {
    if (deferred) {
      setInstalling(true);
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          setVisible(false);
        } else {
          dismissInstallPrompt();
          setVisible(false);
        }
      } catch {
        setHelpOpen(true);
      } finally {
        setInstalling(false);
        setDeferred(null);
      }
      return;
    }
    setHelpOpen(true);
  }

  function onDismiss() {
    dismissInstallPrompt();
    setVisible(false);
  }

  const helpBody = isIosSafari()
    ? t("pwa.helpIos")
    : isDesktopSafari()
      ? t("pwa.helpSafari")
      : t("pwa.helpChrome");

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur md:inset-x-auto md:right-5 md:bottom-5",
          className,
        )}
        role="dialog"
        aria-label={t("pwa.installTitle")}
      >
        <BrandLogo size={44} priority />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{t("common.brand")}</p>
          <p className="text-xs text-muted">{t("pwa.installHint")}</p>
        </div>
        <button
          type="button"
          onClick={onInstall}
          disabled={installing}
          className="btn-primary !w-auto shrink-0 px-3 py-2 text-xs"
        >
          {installing ? t("common.pleaseWait") : t("pwa.install")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-mist hover:text-ink"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t("pwa.installTitle")}
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
          {helpBody}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-primary !w-auto px-5"
            onClick={() => setHelpOpen(false)}
          >
            {t("common.close")}
          </button>
        </div>
      </Modal>
    </>
  );
}
