"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  Stamp,
  Shield,
  Home,
  Wallet,
  UserCog,
  LogOut,
} from "lucide-react";
import { clearSession, hydrateUser, isServerUnavailable, type AuthUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LanguageSwitcher, useT } from "@/i18n";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingScreen } from "@/components/loading-screen";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [user, setUser] = useState<AuthUser | null>(null);

  const nav = useMemo(
    () => [
      { href: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard },
      { href: "/admin/drivers", label: t("nav.drivers"), icon: Users },
      { href: "/admin/putyovkalar", label: t("nav.putyovkas"), icon: FileText },
      { href: "/admin/tirlar", label: t("nav.tirs"), icon: Truck },
      { href: "/admin/dazvollar", label: t("nav.dazvols"), icon: Stamp },
      { href: "/admin/litsenziyalar", label: t("nav.licenses"), icon: Shield },
      { href: "/admin/ijara", label: t("nav.rentals"), icon: Home },
      { href: "/admin/chiqimlar", label: t("nav.expenses"), icon: Wallet },
      { href: "/admin/admins", label: t("nav.admins"), icon: UserCog },
    ],
    [t],
  );

  useEffect(() => {
    hydrateUser()
      .then((u) => {
        if (u.role !== "ADMIN") {
          router.replace("/driver");
          return;
        }
        setUser(u);
      })
      .catch((err) => {
        if (isServerUnavailable(err)) return;
        router.replace("/");
      });
  }, [router]);

  async function logout() {
    await clearSession();
    router.replace("/");
  }

  if (!user) {
    return <LoadingScreen variant="page" />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef3f8_0%,#f7f9fc_40%,#fbfcfe_100%)]">
      <div className="flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ink px-4 py-6 text-white md:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <BrandLogo size={44} priority />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
                {t("nav.control")}
              </p>
              <h1 className="mt-0.5 text-xl font-extrabold tracking-tight">
                {t("common.brand")}
              </h1>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-white/12 text-white shadow-inner"
                      : "text-white/65 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 space-y-3 px-1">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/6 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line/70 bg-white/70 px-5 py-4 backdrop-blur md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {t("nav.adminPanel")}
              </p>
              <p className="text-lg font-bold tracking-tight text-ink">
                {t("nav.hello", { name: user.name })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink md:hidden"
              >
                {t("common.logout")}
              </button>
            </div>
          </header>
          <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
