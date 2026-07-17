"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";

type DriverDetail = {
  id: string;
  fullName: string;
  phone: string;
  vehicle: string | null;
  plateNumber: string | null;
  passportSeries: string | null;
  putyovkas: Doc[];
  tirs: Doc[];
  dazvols: Doc[];
  licenses: Doc[];
  rentals: Doc[];
};

type Doc = {
  id: string;
  price: number;
  paid: number;
  debt: number;
  status: string;
  endDate: string | null;
};

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useT();
  const [data, setData] = useState<DriverDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    api<DriverDetail>(`/admin/drivers/${params.id}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t("common.error")));
  }, [params.id, t]);

  if (error) {
    return <p className="text-danger">{error}</p>;
  }
  if (!data) {
    return <p className="text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="animate-rise space-y-6">
      <Link
        href="/admin/drivers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-steel"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">
          {data.fullName}
        </h2>
        <p className="mt-2 text-muted">
          {data.phone}
          {data.vehicle ? ` · ${data.vehicle}` : ""}
          {data.plateNumber ? ` · ${data.plateNumber}` : ""}
        </p>
        {data.passportSeries ? (
          <p className="mt-1 text-sm text-muted">
            {t("drivers.passportLabel", { value: data.passportSeries })}
          </p>
        ) : null}
      </section>

      <DocSection title={t("nav.putyovkas")} items={data.putyovkas} />
      <DocSection title={t("nav.tirs")} items={data.tirs} />
      <DocSection title={t("nav.dazvols")} items={data.dazvols} />
      <DocSection title={t("nav.licenses")} items={data.licenses} />
      <DocSection title={t("nav.rentals")} items={data.rentals} />
    </div>
  );
}

function DocSection({ title, items }: { title: string; items: Doc[] }) {
  const t = useT();
  const { dateLocale } = useLocale();

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {!items.length ? (
        <p className="mt-3 text-sm text-muted">{t("drivers.none")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mist-2 px-4 py-3 text-sm"
            >
              <span className="font-semibold text-ink">
                {formatMoney(item.price, dateLocale)} {t("common.sum")}
              </span>
              <span className="font-semibold text-signal">
                {t("resource.debt")}: {formatMoney(item.debt, dateLocale)}
              </span>
              <span className="text-muted">{item.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
