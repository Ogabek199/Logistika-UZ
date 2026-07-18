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
import { ThemeToggle } from "@/components/theme-toggle";

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
          <span className="max-w-[14rem] text-sm font-extrabold leading-snug tracking-tight sm:max-w-none sm:text-base">
            {t("common.brand")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="dark" />
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 pb-10 pt-24 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-10">
        <section className="animate-rise hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-[#4ea0ef]" />
            {t("login.location")}
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] xl:text-6xl">
            {t("login.heroTitle")}
            <span className="block bg-gradient-to-r from-[#7eb7f2] to-[#f0c15a] bg-clip-text text-transparent">
              {t("login.heroAccent")}
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
            <h1 className="mt-2 text-2xl font-extrabold leading-snug tracking-tight">
              {t("common.brand")}
            </h1>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-paper shadow-[0_30px_80px_rgba(0,0,0,0.35)] dark:border-line dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="border-b border-line bg-gradient-to-b from-mist-2 to-paper px-6 pb-4 pt-5">
              <div className="flex rounded-2xl bg-mist p-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole("admin");
                    setError("");
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                    role === "admin"
                      ? "bg-steel text-white shadow-md shadow-steel/30"
                      : "text-muted hover:text-ink",
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
                      ? "bg-steel text-white shadow-md shadow-steel/30"
                      : "text-muted hover:text-ink",
                  )}
                >
                  <Truck className="h-4 w-4" />
                  {t("login.driver")}
                </button>
              </div>
              <p className="mt-4 text-center text-sm leading-snug text-muted">
                {subtitle}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 px-6 py-6 text-ink">
              {role === "admin" ? (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                    <UserRound className="h-3.5 w-3.5 text-steel" />
                    {t("login.loginLabel")}
                  </span>
                  <input
                    className="w-full rounded-2xl border border-line bg-field px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-steel focus:bg-paper focus:shadow-[0_0_0_4px_rgba(47,127,209,0.14)]"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                    required
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                    <Phone className="h-3.5 w-3.5 text-steel" />
                    {t("login.phoneLabel")}
                  </span>
                  <input
                    className="w-full rounded-2xl border border-line bg-field px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-steel focus:bg-paper focus:shadow-[0_0_0_4px_rgba(47,127,209,0.14)]"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                    placeholder="+998 90 123 45 67"
                    inputMode="tel"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                  <Lock className="h-3.5 w-3.5 text-steel" />
                  {t("login.passwordLabel")}
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-line bg-field px-4 py-3.5 pr-12 text-[15px] text-ink outline-none transition focus:border-steel focus:bg-paper focus:shadow-[0_0_0_4px_rgba(47,127,209,0.14)]"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-mist hover:text-ink"
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
                <div className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm font-semibold text-danger">
                  {error}
                </div>
              ) : null}

              <button
                className="btn-primary group !rounded-2xl !py-3.5 !text-[15px]"
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
