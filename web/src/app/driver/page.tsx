"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, LogOut } from "lucide-react";
import {
  api,
  clearSession,
  getStoredUser,
  type AuthUser,
} from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { LanguageSwitcher, useLocale, useT } from "@/i18n";

type PortalData = {
  driver: {
    id: string;
    fullName: string;
    phone: string;
    vehicle: string | null;
    plateNumber: string | null;
  };
  totalDebt: number;
  documents: {
    putyovkas: Doc[];
    tirs: Doc[];
    dazvols: Doc[];
    licenses: Doc[];
    rentals: Doc[];
  };
};

type Doc = {
  id: string;
  price: number;
  paid: number;
  debt: number;
  status: string;
  endDate: string | null;
  daysLeft: number | null;
  trailerNo?: string | null;
  tirNumber?: string | null;
  country?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
  startDate?: string | null;
};

export default function DriverPortalPage() {
  const router = useRouter();
  const t = useT();
  const { dateLocale } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "DRIVER") {
      router.replace("/");
      return;
    }
    setUser(u);
    api<PortalData>("/driver/portal")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t("common.error")));
  }, [router, t]);

  function logout() {
    clearSession();
    router.replace("/");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-atmosphere text-white/70">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-atmosphere text-white">
      <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <header className="animate-rise flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
              {t("common.brand")}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
              {data?.driver.fullName || user.name}
            </h1>
            <p className="mt-2 text-sm text-white/65">
              {data?.driver.phone || user.phone}
              {data?.driver.vehicle ? ` · ${data.driver.vehicle}` : ""}
              {data?.driver.plateNumber ? ` · ${data.driver.plateNumber}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSwitcher variant="dark" />
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </button>
          </div>
        </header>

        <section className="animate-rise-delay mt-8 rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t("driverPortal.totalDebt")}
          </p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-[#f0c15a]">
            {formatMoney(data?.totalDebt || 0, dateLocale)}{" "}
            <span className="text-base font-semibold text-white/60">
              {t("common.sum")}
            </span>
          </p>
          <a
            href="tel:+998900000000"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-mist"
          >
            <Phone className="h-4 w-4" />
            {t("driverPortal.contact")}
          </a>
        </section>

        {error ? (
          <p className="mt-6 rounded-xl bg-danger/20 px-4 py-3 text-sm text-[#ffb4b4]">
            {error}
          </p>
        ) : null}

        <section className="animate-rise-delay-2 mt-8 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">
            {t("driverPortal.myDocs")}
          </h2>
          <DocBlock
            title={t("driverPortal.putyovka")}
            items={data?.documents.putyovkas || []}
            empty={t("driverPortal.noPutyovka")}
          />
          <DocBlock
            title={t("driverPortal.tir")}
            items={data?.documents.tirs || []}
            empty={t("driverPortal.noTir")}
          />
          <DocBlock
            title={t("driverPortal.dazvol")}
            items={data?.documents.dazvols || []}
            empty={t("driverPortal.noDazvol")}
          />
          <DocBlock
            title={t("driverPortal.license")}
            items={data?.documents.licenses || []}
            empty={t("driverPortal.noLicense")}
          />
          <DocBlock
            title={t("driverPortal.rental")}
            items={data?.documents.rentals || []}
            empty={t("driverPortal.noRental")}
          />
        </section>

        <p className="mt-10 text-center text-xs text-white/35">
          {t("common.footer", { year: new Date().getFullYear() })}
        </p>
      </div>
    </main>
  );
}

function DocBlock({
  title,
  items,
  empty,
}: {
  title: string;
  items: Doc[];
  empty: string;
}) {
  const t = useT();
  const { dateLocale } = useLocale();

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            items.length
              ? items.some((i) => i.debt > 0)
                ? "bg-[#c8891a]/25 text-[#f0c15a]"
                : "bg-ok/25 text-[#7ddeb3]"
              : "bg-white/10 text-white/55"
          }`}
        >
          {items.length
            ? items.some((i) => i.debt > 0)
              ? t("driverPortal.withDebt")
              : t("driverPortal.ok")
            : t("driverPortal.none")}
        </span>
      </div>
      {!items.length ? (
        <p className="text-sm text-white/45">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-black/20 px-4 py-3 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/75">
                <span>
                  {t("driverPortal.price", {
                    amount: formatMoney(item.price, dateLocale),
                  })}
                </span>
                <span className="text-[#f0c15a]">
                  {t("driverPortal.debt", {
                    amount: formatMoney(item.debt, dateLocale),
                  })}
                </span>
              </div>
              {item.daysLeft !== null ? (
                <p className="mt-2 text-xs font-semibold text-white/55">
                  {item.daysLeft >= 0
                    ? t("driverPortal.daysLeft", { n: item.daysLeft })
                    : t("driverPortal.expired")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
