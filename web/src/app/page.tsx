"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Truck,
  UserCog,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  UserRound,
  Phone,
  MapPin,
} from "lucide-react";
import { login } from "@/lib/api";
import { cn, formatPhoneMask } from "@/lib/utils";
import { LanguageSwitcher, useT } from "@/i18n";
import { BrandLogo } from "@/components/brand-logo";
import { Spinner } from "@/components/ui/spinner";

type RoleTab = "admin" | "driver";

export default function LoginPage() {
  const t = useT();
  const [role, setRole] = useState<RoleTab>("admin");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(
    () =>
      role === "admin" ? t("login.adminSubtitle") : t("login.driverSubtitle"),
    [role, t],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload =
        role === "admin"
          ? { role, username, password }
          : { role, phone, password };
      const data = await login(payload);
      // Hard navigation: soft RSC nav breaks behind ngrok / LAN hosts in Next.js.
      window.location.assign(
        data.user.role === "ADMIN" ? "/admin" : "/driver",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050d16] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_15%_20%,rgba(47,127,209,0.35),transparent_55%),radial-gradient(700px_420px_at_85%_10%,rgba(200,137,26,0.2),transparent_50%),linear-gradient(165deg,#050d16_0%,#0a1a2c_55%,#10253d_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="bg-orb absolute -left-16 top-24 h-72 w-72 rounded-full bg-[#2f7fd1]/20 blur-3xl" />
        <div className="bg-orb absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[#c8891a]/14 blur-3xl [animation-delay:1.6s]" />
      </div>

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <div className="flex items-center gap-3">
          <BrandLogo size={44} priority className="ring-white/20" />
          <span className="text-lg font-extrabold tracking-tight">
            {t("common.brand")}
          </span>
        </div>
        <LanguageSwitcher variant="dark" />
      </header>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 pb-10 pt-24 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-10">
        <section className="animate-rise hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-[#4ea0ef]" />
            {t("login.location")}
          </div>
          <h1 className="mt-6 max-w-xl text-6xl font-extrabold leading-[0.92] tracking-[-0.05em] xl:text-7xl">
            {t("login.heroTitle")}
            <span className="block bg-gradient-to-r from-[#7eb7f2] to-[#f0c15a] bg-clip-text text-transparent">
              UZ
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/65 xl:text-lg">
            {t("login.heroDesc")}
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[
              [t("login.statDocs"), t("login.statDocsValue")],
              [t("login.statDebt"), t("login.statDebtValue")],
              [t("login.statDeadline"), t("login.statDeadlineValue")],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-rise-delay mx-auto w-full max-w-md lg:mx-0">
          <div className="mb-6 text-center lg:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {t("login.location")}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
              {t("common.brand")}
            </h1>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="border-b border-line bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 pb-4 pt-5">
              <div className="flex rounded-2xl bg-[#e8eef5] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole("admin");
                    setError("");
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                    role === "admin"
                      ? "bg-[#071525] text-white shadow-lg"
                      : "text-[#5d738a] hover:text-[#071525]",
                  )}
                >
                  <UserCog className="h-4 w-4" />
                  {t("login.admin")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("driver");
                    setError("");
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                    role === "driver"
                      ? "bg-[#071525] text-white shadow-lg"
                      : "text-[#5d738a] hover:text-[#071525]",
                  )}
                >
                  <Truck className="h-4 w-4" />
                  {t("login.driver")}
                </button>
              </div>
              <p className="mt-4 text-center text-sm leading-snug text-[#5d738a]">
                {subtitle}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 px-6 py-6 text-[#071525]">
              {role === "admin" ? (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d738a]">
                    <UserRound className="h-3.5 w-3.5 text-[#2f7fd1]" />
                    {t("login.loginLabel")}
                  </span>
                  <input
                    className="w-full rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#2f7fd1] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,127,209,0.14)]"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                    required
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d738a]">
                    <Phone className="h-3.5 w-3.5 text-[#2f7fd1]" />
                    {t("login.phoneLabel")}
                  </span>
                  <input
                    className="w-full rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#2f7fd1] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,127,209,0.14)]"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                    placeholder="+998 90 123 45 67"
                    inputMode="tel"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d738a]">
                  <Lock className="h-3.5 w-3.5 text-[#2f7fd1]" />
                  {t("login.passwordLabel")}
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3.5 pr-12 text-[15px] outline-none transition focus:border-[#2f7fd1] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,127,209,0.14)]"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#5d738a] transition hover:bg-[#e8eef5] hover:text-[#071525]"
                    aria-label={
                      showPassword
                        ? t("login.hidePassword")
                        : t("login.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border border-[#c23b3b]/20 bg-[#c23b3b]/8 px-4 py-3 text-sm font-semibold text-[#c23b3b]">
                  {error}
                </div>
              ) : null}

              <button
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2f7fd1_0%,#1a5fad_100%)] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_34px_rgba(26,95,173,0.4)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                    {t("login.checking")}
                  </>
                ) : (
                  <>
                    {t("login.submit")}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/35">
            {t("common.footer", { year: new Date().getFullYear() })}
          </p>
        </section>
      </div>
    </main>
  );
}
