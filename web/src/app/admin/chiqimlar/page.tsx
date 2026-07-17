"use client";

import { useMemo } from "react";
import { ResourcePage, moneyCell } from "@/components/resource-page";
import { useLocale, useT } from "@/i18n";

type Row = {
  id: string;
  driverName?: string | null;
  type: string;
  amount: number;
  note?: string | null;
  date: string;
};

export default function Page() {
  const t = useT();
  const { dateLocale } = useLocale();
  const dash = t("common.dash");

  const expenseTypes = useMemo(
    () => [
      { value: "Boshqa", label: t("expenses.types.other") },
      { value: "Maosh", label: t("expenses.types.salary") },
      { value: "Ta'mir", label: t("expenses.types.repair") },
      { value: "Xizmat xarajati", label: t("expenses.types.service") },
    ],
    [t],
  );

  const fields = useMemo(
    () => [
      { name: "driverId", label: t("expenses.driverOptional"), type: "select" as const },
      {
        name: "type",
        label: t("expenses.type"),
        type: "select" as const,
        required: true,
        options: expenseTypes,
      },
      { name: "amount", label: t("expenses.amount"), type: "number" as const, required: true },
      { name: "date", label: t("expenses.date"), type: "date" as const },
      { name: "note", label: t("expenses.note"), type: "textarea" as const },
    ],
    [t, expenseTypes],
  );

  const columns = useMemo(
    () => [
      {
        key: "date",
        label: t("expenses.date"),
        render: (r: Row) => new Date(r.date).toLocaleDateString(dateLocale),
      },
      { key: "driver", label: t("resource.driver"), render: (r: Row) => r.driverName || dash },
      {
        key: "type",
        label: t("expenses.type"),
        render: (r: Row) => {
          const match = expenseTypes.find((opt) => opt.value === r.type);
          return match?.label ?? r.type;
        },
      },
      {
        key: "amount",
        label: t("expenses.amount"),
        render: (r: Row) => (
          <>
            {moneyCell(r.amount, "text-danger", dateLocale)} {t("common.sum")}
          </>
        ),
      },
      { key: "note", label: t("expenses.note"), render: (r: Row) => r.note || dash },
    ],
    [t, dash, dateLocale, expenseTypes],
  );

  return (
    <ResourcePage<Row>
      title={t("expenses.title")}
      description={t("expenses.description")}
      endpoint="/admin/chiqimlar"
      addLabel={t("expenses.add")}
      amountKey="amount"
      totalLabel={(amount) =>
        t("expenses.total", { amount: `${amount} ${t("common.sum")}` })
      }
      deleteTitle={t("expenses.deleteTitle")}
      deleteMessage={t("expenses.deleteMessage")}
      initialForm={{
        driverId: "",
        type: "Boshqa",
        amount: 0,
        note: "",
        date: new Date().toISOString().slice(0, 10),
      }}
      fields={fields}
      transformBody={(form) => ({
        ...form,
        driverId: form.driverId ? form.driverId : undefined,
      })}
      columns={columns}
    />
  );
}
