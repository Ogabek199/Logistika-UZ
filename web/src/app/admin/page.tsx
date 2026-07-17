"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";

type DashboardData = {
  counts: {
    drivers: number;
    admins: number;
    putyovkas: number;
    tirs: number;
    dazvols: number;
    licenses: number;
    rentals: number;
  };
  expiredCount: {
    putyovka: number;
    tir: number;
    dazvol: number;
    license: number;
    rental: number;
  };
  finance: {
    income: number;
    debt: number;
    expenseTotal: number;
    balance: number;
    todayIncome: number;
    todayExpense: number;
  };
  monthly: Array<{ key: string; income: number; expense: number }>;
  topDebtors: Array<{
    id: string;
    name: string;
    vehicle: string | null;
    debt: number;
    paid: number;
    activeDocs: number;
  }>;
  driversOverview: Array<{
    id: string;
    name: string;
    vehicle: string | null;
    debt: number;
    paid: number;
    activeDocs: number;
  }>;
  expiringSoon: Array<{
    driverName: string;
    type: string;
    endDate: string;
    daysLeft: number;
  }>;
};

export default function AdminDashboardPage() {
  const t = useT();
  const { dateLocale } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const statCards = useMemo(
    () =>
      [
        {
          key: "drivers" as const,
          label: t("dashboard.drivers"),
          href: "/admin/drivers",
          tone: "from-[#1f4f7a] to-[#2f7fd1]",
        },
        {
          key: "putyovkas" as const,
          label: t("dashboard.putyovkas"),
          href: "/admin/putyovkalar",
          tone: "from-[#1d5c4a] to-[#2f9d78]",
        },
        {
          key: "tirs" as const,
          label: t("dashboard.tirs"),
          href: "/admin/tirlar",
          tone: "from-[#5a3d12] to-[#c8891a]",
        },
        {
          key: "dazvols" as const,
          label: t("dashboard.dazvols"),
          href: "/admin/dazvollar",
          tone: "from-[#1a4a5c] to-[#2f8f9d]",
        },
        {
          key: "licenses" as const,
          label: t("dashboard.licenses"),
          href: "/admin/litsenziyalar",
          tone: "from-[#18324d] to-[#3d7ab5]",
        },
        {
          key: "rentals" as const,
          label: t("dashboard.rentals"),
          href: "/admin/ijara",
          tone: "from-[#4a2d2d] to-[#b56565]",
        },
      ] as const,
    [t],
  );

  useEffect(() => {
    api<DashboardData>("/admin/dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t("common.error")));
  }, [t]);

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5 text-danger">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-muted">{t("dashboard.loading")}</div>;
  }

  return (
    <div className="space-y-8">
      <section className="animate-rise">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          {t("dashboard.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{t("dashboard.subtitle")}</p>
      </section>

      <section className="animate-rise-delay grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`rounded-3xl bg-gradient-to-br ${card.tone} p-5 text-white shadow-lg transition hover:-translate-y-0.5`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {card.label}
            </p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {data.counts[card.key]}
            </p>
          </Link>
        ))}
      </section>

      <section className="animate-rise-delay grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HighlightCard
          label={t("dashboard.balance")}
          value={data.finance.balance}
          locale={dateLocale}
          sumLabel={t("common.sum")}
          tone="from-[#123a2b] to-[#1f7a56]"
        />
        <HighlightCard
          label={t("dashboard.todayIncome")}
          value={data.finance.todayIncome}
          locale={dateLocale}
          sumLabel={t("common.sum")}
          tone="from-[#16324d] to-[#2f7fd1]"
        />
        <HighlightCard
          label={t("dashboard.todayExpense")}
          value={data.finance.todayExpense}
          locale={dateLocale}
          sumLabel={t("common.sum")}
          tone="from-[#4a2020] to-[#c04545]"
        />
        <HighlightCard
          label={t("dashboard.totalDebt")}
          value={data.finance.debt}
          locale={dateLocale}
          sumLabel={t("common.sum")}
          tone="from-[#4a3410] to-[#c8891a]"
        />
      </section>

      <section className="animate-rise-delay-2 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {t("dashboard.monthlyDynamics")}
            </p>
            <h3 className="text-xl font-bold text-ink">
              {t("dashboard.incomeVsExpense")}
            </h3>
          </div>
          <IncomeExpenseChart
            data={data.monthly}
            locale={dateLocale}
            incomeLabel={t("dashboard.chartIncome")}
            expenseLabel={t("dashboard.chartExpense")}
          />
        </div>

        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {t("dashboard.expiredDocs")}
          </p>
          <h3 className="text-xl font-bold text-ink">
            {t("dashboard.expiredDocsSubtitle")}
          </h3>
          <div className="mt-4 space-y-2">
            {(
              [
                ["putyovka", t("dashboard.putyovkas")],
                ["tir", t("dashboard.tirs")],
                ["dazvol", t("dashboard.dazvols")],
                ["license", t("dashboard.licenses")],
                ["rental", t("dashboard.rentals")],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-2xl bg-mist-2 px-4 py-2.5"
              >
                <span className="text-sm text-muted">{label}</span>
                <span
                  className={`text-lg font-extrabold ${
                    data.expiredCount[key] > 0 ? "text-danger" : "text-ink/40"
                  }`}
                >
                  {data.expiredCount[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="animate-rise-delay-2 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {t("dashboard.finance")}
          </p>
          <div className="mt-4 space-y-4">
            <FinanceRow
              label={t("dashboard.income")}
              value={data.finance.income}
              tone="text-ok"
              locale={dateLocale}
              sumLabel={t("common.sum")}
            />
            <FinanceRow
              label={t("dashboard.totalDebt")}
              value={data.finance.debt}
              tone="text-signal"
              locale={dateLocale}
              sumLabel={t("common.sum")}
            />
            <FinanceRow
              label={t("dashboard.expenses")}
              value={data.finance.expenseTotal}
              tone="text-danger"
              locale={dateLocale}
              sumLabel={t("common.sum")}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {t("dashboard.topDebtors")}
              </p>
              <h3 className="text-xl font-bold text-ink">
                {t("dashboard.debtStatus")}
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-3 font-semibold">{t("dashboard.driver")}</th>
                  <th className="pb-3 font-semibold">{t("dashboard.vehicle")}</th>
                  <th className="pb-3 font-semibold">{t("dashboard.debt")}</th>
                  <th className="pb-3 font-semibold">{t("dashboard.paid")}</th>
                </tr>
              </thead>
              <tbody>
                {data.topDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-muted">
                      {t("dashboard.noDebtors")}
                    </td>
                  </tr>
                ) : (
                  data.topDebtors.map((d) => (
                    <tr key={d.id} className="border-t border-line/70">
                      <td className="py-3 font-semibold text-ink">{d.name}</td>
                      <td className="py-3 text-muted">
                        {d.vehicle || t("common.dash")}
                      </td>
                      <td className="py-3 font-semibold text-signal">
                        {formatMoney(d.debt, dateLocale)}
                      </td>
                      <td className="py-3 text-ok">
                        {formatMoney(d.paid, dateLocale)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {t("dashboard.within7Days")}
        </p>
        <h3 className="mt-1 text-xl font-bold text-ink">
          {t("dashboard.expiringSoon")}
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.expiringSoon.length === 0 ? (
            <p className="text-muted">{t("dashboard.noExpiring")}</p>
          ) : (
            data.expiringSoon.map((item, idx) => (
              <div
                key={`${item.driverName}-${item.type}-${idx}`}
                className="flex items-center justify-between rounded-2xl bg-mist-2 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">{item.driverName}</p>
                  <p className="text-sm text-muted">{item.type}</p>
                </div>
                <span className="rounded-full bg-signal/15 px-3 py-1 text-xs font-bold text-signal">
                  {t("dashboard.daysLeft", { n: item.daysLeft })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {t("dashboard.allDebtors")}
          </p>
          <h3 className="text-xl font-bold text-ink">
            {t("dashboard.allDebtorsSubtitle")}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-3 font-semibold">{t("dashboard.driver")}</th>
                <th className="pb-3 font-semibold">{t("dashboard.vehicle")}</th>
                <th className="pb-3 font-semibold">{t("dashboard.debt")}</th>
                <th className="pb-3 font-semibold">{t("dashboard.paid")}</th>
              </tr>
            </thead>
            <tbody>
              {data.driversOverview.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-muted">
                    {t("dashboard.noDebtors")}
                  </td>
                </tr>
              ) : (
                data.driversOverview.map((d) => (
                  <tr key={d.id} className="border-t border-line/70">
                    <td className="py-3 font-semibold text-ink">{d.name}</td>
                    <td className="py-3 text-muted">
                      {d.vehicle || t("common.dash")}
                    </td>
                    <td
                      className={`py-3 font-semibold ${
                        d.debt > 0 ? "text-signal" : "text-ink/40"
                      }`}
                    >
                      {formatMoney(d.debt, dateLocale)}
                    </td>
                    <td className="py-3 text-ok">
                      {formatMoney(d.paid, dateLocale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HighlightCard({
  label,
  value,
  locale,
  sumLabel,
  tone,
}: {
  label: string;
  value: number;
  locale: string;
  sumLabel: string;
  tone: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${tone} p-5 text-white shadow-lg`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
        {formatMoney(value, locale)}{" "}
        <span className="text-sm font-semibold text-white/70">{sumLabel}</span>
      </p>
    </div>
  );
}

function IncomeExpenseChart({
  data,
  locale,
  incomeLabel,
  expenseLabel,
}: {
  data: Array<{ key: string; income: number; expense: number }>;
  locale: string;
  incomeLabel: string;
  expenseLabel: string;
}) {
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.income, d.expense)),
  );
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short" });

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ok" />
          {incomeLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          {expenseLabel}
        </span>
      </div>
      <div className="flex h-52 items-end justify-between gap-3">
        {data.map((d) => {
          const [year, month] = d.key.split("-").map(Number);
          const label = monthFmt.format(new Date(year, month - 1, 1));
          return (
            <div
              key={d.key}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 max-w-[22px] rounded-t-md bg-ok/80 transition-all"
                  style={{ height: `${(d.income / max) * 100}%` }}
                  title={`${incomeLabel}: ${formatMoney(d.income, locale)}`}
                />
                <div
                  className="w-1/2 max-w-[22px] rounded-t-md bg-danger/80 transition-all"
                  style={{ height: `${(d.expense / max) * 100}%` }}
                  title={`${expenseLabel}: ${formatMoney(d.expense, locale)}`}
                />
              </div>
              <span className="text-xs font-medium capitalize text-muted">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceRow({
  label,
  value,
  tone,
  locale,
  sumLabel,
}: {
  label: string;
  value: number;
  tone: string;
  locale: string;
  sumLabel: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-lg font-extrabold ${tone}`}>
        {formatMoney(value, locale)}{" "}
        <span className="text-xs font-semibold">{sumLabel}</span>
      </span>
    </div>
  );
}
