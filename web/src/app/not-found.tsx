"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher, useT } from "@/i18n";

export default function NotFound() {
  const t = useT();

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#050d16] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_620px_at_50%_-10%,rgba(47,127,209,0.38),transparent_55%),radial-gradient(700px_480px_at_100%_100%,rgba(200,137,26,0.18),transparent_50%),linear-gradient(180deg,#040b14_0%,#0a1829_48%,#0d2138_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse at 50% 40%, black 20%, transparent 72%)",
          }}
        />
        <div className="bg-orb absolute left-[-8%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-[#2f7fd1]/18 blur-3xl" />
        <div className="bg-orb absolute bottom-[-10%] right-[-6%] h-[26rem] w-[26rem] rounded-full bg-[#c8891a]/14 blur-3xl [animation-delay:1.8s]" />

        {/* Route path — logistics cue */}
        <svg
          className="absolute inset-x-0 top-[42%] h-24 w-full opacity-30"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            className="not-found-route"
            d="M0 58 C 180 18, 320 92, 480 48 S 780 10, 960 62 S 1120 90, 1200 40"
            fill="none"
            stroke="rgba(126,183,242,0.55)"
            strokeWidth="2"
            strokeDasharray="10 14"
          />
        </svg>
      </div>

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <BrandLogo size={44} priority className="ring-white/20" />
          <span className="max-w-[12rem] text-sm font-extrabold leading-snug tracking-tight sm:max-w-xs sm:text-base">
            {t("common.brand")}
          </span>
        </Link>
        <LanguageSwitcher variant="dark" />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 pb-16 pt-28 text-center md:px-8">
        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
          {t("notFound.eyebrow")}
        </p>

        <div className="animate-rise-delay relative mt-4 select-none">
          <p
            className="not-found-code text-[7.5rem] font-extrabold leading-none tracking-[-0.08em] sm:text-[10rem] md:text-[12.5rem]"
            aria-hidden
          >
            404
          </p>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,transparent_35%,rgba(5,13,22,0.55)_100%)]" />
        </div>

        <h1 className="animate-rise-delay-2 mt-2 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          {t("notFound.title")}
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
          {t("notFound.description")}
        </p>

        <div className="animate-rise-delay-2 mt-10">
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2f7fd1_0%,#1a5fad_100%)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_34px_rgba(26,95,173,0.4)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            <Home className="h-4 w-4" />
            {t("common.backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
