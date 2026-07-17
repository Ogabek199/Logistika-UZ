"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { checkBackendHealth } from "@/lib/api";
import { LanguageSwitcher, useT } from "@/i18n";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function MaintenancePage() {
  const t = useT();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const retry = useCallback(async () => {
    setChecking(true);
    try {
      const ok = await checkBackendHealth();
      if (ok) {
        const next = sessionStorage.getItem("logistika_return_to") || "/";
        sessionStorage.removeItem("logistika_return_to");
        router.replace(next);
        return;
      }
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      void retry();
    }, 15000);
    return () => clearInterval(timer);
  }, [retry]);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#0c0a07] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_560px_at_50%_0%,rgba(200,137,26,0.28),transparent_55%),radial-gradient(700px_420px_at_10%_90%,rgba(47,127,209,0.12),transparent_50%),linear-gradient(180deg,#0c0a07_0%,#16110a_45%,#1a140c_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-12deg, rgba(240,193,90,.35) 0 1px, transparent 1px 18px)",
            maskImage:
              "radial-gradient(ellipse at 50% 45%, black 15%, transparent 70%)",
          }}
        />
        <div className="bg-orb absolute left-[-10%] top-[20%] h-[26rem] w-[26rem] rounded-full bg-[#c8891a]/20 blur-3xl" />
        <div className="bg-orb absolute bottom-[-12%] right-[-8%] h-[24rem] w-[24rem] rounded-full bg-[#2f7fd1]/12 blur-3xl [animation-delay:2s]" />
      </div>

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-end px-5 py-5 md:px-8 md:py-7">
        <LanguageSwitcher variant="dark" />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-16 pt-24 text-center md:px-8">
        <div className="animate-rise maintenance-pulse relative mb-8 flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-[#c8891a]/25" />
          <span className="maintenance-ring absolute inset-2 rounded-full border-2 border-transparent border-t-[#f0c15a] border-r-[#c8891a]/40" />
          <span className="relative text-sm font-bold uppercase tracking-[0.2em] text-[#f0c15a]">
            {t("maintenance.badge")}
          </span>
        </div>

        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f0c15a]/70">
          {t("maintenance.eyebrow")}
        </p>

        <p
          className="maintenance-code animate-rise-delay mt-3 select-none text-[7rem] font-extrabold leading-none tracking-[-0.08em] sm:text-[9rem] md:text-[11rem]"
          aria-hidden
        >
          503
        </p>

        <h1 className="animate-rise-delay-2 mt-2 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          {t("maintenance.title")}
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/55 sm:text-lg">
          {t("maintenance.description")}
        </p>

        <div className="animate-rise-delay-2 mt-8 w-full max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="maintenance-bar h-full w-1/3 rounded-full bg-gradient-to-r from-[#c8891a] to-[#f0c15a]" />
          </div>
          <p className="mt-3 text-xs font-medium text-white/40">
            {t("maintenance.autoCheck")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void retry()}
          disabled={checking}
          className={cn(
            "animate-rise-delay-2 mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#c8891a_0%,#a06c12_100%)] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_34px_rgba(168,108,18,0.4)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0",
          )}
        >
          {checking ? (
            <>
              <Spinner size="sm" className="border-white/30 border-t-white" />
              {t("common.checking")}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {t("maintenance.retry")}
            </>
          )}
        </button>
      </div>
    </main>
  );
}
