"use client";

import { useMemo } from "react";
import { ResourcePage, moneyCell } from "@/components/resource-page";
import { useLocale, useT } from "@/i18n";

type Row = {
  id: string;
  driverName?: string;
  licenseNumber?: string | null;
  price: number;
  debt: number;
  status: string;
};

export default function Page() {
  const t = useT();
  const { dateLocale } = useLocale();
  const dash = t("common.dash");

  const fields = useMemo(
    () => [
      { name: "driverId", label: t("resource.driver"), type: "select" as const, required: true },
      { name: "licenseNumber", label: t("licenses.licenseNumber") },
      { name: "price", label: t("resource.price"), type: "number" as const, required: true },
      { name: "paid", label: t("resource.paid"), type: "number" as const },
      { name: "startDate", label: t("resource.startDate"), type: "date" as const },
      { name: "endDate", label: t("resource.endDate"), type: "date" as const },
      { name: "note", label: t("resource.note"), type: "textarea" as const },
    ],
    [t],
  );

  const columns = useMemo(
    () => [
      { key: "driver", label: t("resource.driver"), render: (r: Row) => r.driverName || dash },
      { key: "num", label: t("licenses.number"), render: (r: Row) => r.licenseNumber || dash },
      { key: "price", label: t("resource.price"), render: (r: Row) => moneyCell(r.price, undefined, dateLocale) },
      { key: "debt", label: t("resource.debt"), render: (r: Row) => moneyCell(r.debt, "text-signal", dateLocale) },
      { key: "status", label: t("resource.status"), render: (r: Row) => r.status },
    ],
    [t, dash, dateLocale],
  );

  return (
    <ResourcePage<Row>
      title={t("licenses.title")}
      description={t("licenses.description")}
      endpoint="/admin/litsenziyalar"
      initialForm={{
        driverId: "",
        licenseNumber: "",
        price: 0,
        paid: 0,
        startDate: "",
        endDate: "",
        note: "",
      }}
      fields={fields}
      columns={columns}
    />
  );
}
