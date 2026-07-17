"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher, useT } from "@/i18n";
import { cn } from "@/lib/utils";

type StatusPageProps = {
  code: string;
  title: string;
  description: string;
  icon: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  secondaryHref?: string;
  secondaryLabel?: string;
  tone?: "steel" | "signal" | "danger";
};

const toneMap = {
  steel: {
    glow: "bg-[#2f7fd1]/20",
    chip: "border-white/15 bg-white/5 text-white/70",
    button:
      "bg-[linear-gradient(135deg,#2f7fd1_0%,#1a5fad_100%)] shadow-[0_16px_34px_rgba(26,95,173,0.4)]",
  },
  signal: {
    glow: "bg-[#c8891a]/20",
    chip: "border-[#c8891a]/30 bg-[#c8891a]/10 text-[#f0c15a]",
    button:
      "bg-[linear-gradient(135deg,#c8891a_0%,#a06c12_100%)] shadow-[0_16px_34px_rgba(168,108,18,0.4)]",
  },
  danger: {
    glow: "bg-[#c23b3b]/18",
    chip: "border-[#c23b3b]/25 bg-[#c23b3b]/10 text-[#ff8f8f]",
    button:
      "bg-[linear-gradient(135deg,#c23b3b_0%,#9a2a2a_100%)] shadow-[0_16px_34px_rgba(154,42,42,0.4)]",
  },
};

export function StatusPage({
  code,
  title,
  description,
  icon,
  primaryHref = "/",
  primaryLabel,
  onPrimary,
  primaryLoading,
  secondaryHref,
  secondaryLabel,
  tone = "steel",
}: StatusPageProps) {
  const t = useT();
  const colors = toneMap[tone];
  const primaryText = primaryLabel ?? t("common.backHome");

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#050d16] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_15%,rgba(47,127,209,0.32),transparent_55%),radial-gradient(700px_420px_at_85%_80%,rgba(200,137,26,0.16),transparent_50%),linear-gradient(165deg,#050d16_0%,#0a1a2c_55%,#10253d_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div
          className={cn(
            "bg-orb absolute -left-10 top-24 h-72 w-72 rounded-full blur-3xl",
            colors.glow,
          )}
        />
        <div className="bg-orb absolute bottom-8 right-0 h-80 w-80 rounded-full bg-[#c8891a]/12 blur-3xl [animation-delay:1.6s]" />
      </div>

      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
        <div className="animate-rise mb-8">
          <BrandLogo size={64} priority className="ring-white/20" />
        </div>

        <div
          className={cn(
            "animate-rise-delay inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]",
            colors.chip,
          )}
        >
          {code}
        </div>

        <div className="animate-rise-delay mt-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/5 text-white backdrop-blur">
          {icon}
        </div>

        <h1 className="animate-rise-delay-2 mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/65">
          {description}
        </p>

        <div className="animate-rise-delay-2 mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {onPrimary ? (
            <button
              type="button"
              onClick={onPrimary}
              disabled={primaryLoading}
              className={cn(
                "inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0",
                colors.button,
              )}
            >
              {primaryLoading ? t("common.checking") : primaryText}
            </button>
          ) : (
            <Link
              href={primaryHref}
              className={cn(
                "inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105",
                colors.button,
              )}
            >
              {primaryText}
            </Link>
          )}

          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-[15px] font-bold text-white/85 transition hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>

        <p className="mt-10 text-xs text-white/35">
          {t("common.footer", { year: new Date().getFullYear() })}
        </p>
      </div>
    </main>
  );
}
