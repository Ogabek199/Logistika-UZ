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
  Send,
  ScrollText,
} from "lucide-react";
import { clearSession, hydrateUser, isServerUnavailable, type AuthUser } from "@/lib/api";
import { LanguageSwitcher, useT } from "@/i18n";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingScreen } from "@/components/loading-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmModal } from "@/components/ui/modal";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const nav = useMemo(
    () => [
      { href: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard },
      { href: "/admin/drivers", label: t("nav.drivers"), icon: Users },
      { href: "/admin/telegram", label: t("nav.telegram"), icon: Send },
      { href: "/admin/putyovkalar", label: t("nav.putyovkas"), icon: FileText },
      { href: "/admin/doverennost", label: t("nav.doverennost"), icon: ScrollText },
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
    <div className="page-shell relative min-h-screen">
      <div className="admin-sidebar-glow" aria-hidden />
      <div className="relative z-10 flex min-h-screen w-full">
        <aside className="admin-sidebar hidden w-64 shrink-0 flex-col px-4 py-6 md:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <BrandLogo size={48} priority />
            <div className="min-w-0">
              <p className="sidebar-muted text-[10px] font-semibold uppercase tracking-[0.25em]">
                {t("nav.control")}
              </p>
              <h1 className="mt-0.5 text-[13px] font-extrabold leading-snug tracking-tight">
                {t("common.brand")}
              </h1>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1.5">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active ? "true" : undefined}
                  className="sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-divider mt-4 space-y-3 border-t px-1 pt-4">
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="sidebar-nav-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line/70 bg-paper/80 px-5 py-4 backdrop-blur md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {t("nav.adminPanel")}
              </p>
              <p className="text-lg font-bold tracking-tight text-ink">
                {t("nav.hello", { name: user.name })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="rounded-xl border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink md:hidden"
              >
                {t("common.logout")}
              </button>
            </div>
          </header>
          <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title={t("common.logoutConfirmTitle")}
        message={t("common.logoutConfirmMessage")}
        confirmLabel={t("common.logout")}
        onConfirm={logout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}
