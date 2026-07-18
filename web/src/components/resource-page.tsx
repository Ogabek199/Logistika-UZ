"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  cn,
  formatMoney,
  formatMoneyMask,
  parseMoneyInput,
} from "@/lib/utils";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { LiveSearch } from "@/components/ui/live-search";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchSelect } from "@/components/ui/search-select";
import { Select } from "@/components/ui/select";
import { useLocale, useT } from "@/i18n";
import { LoadingScreen, TableSkeleton } from "@/components/loading-screen";

export type DriverOption = {
  id: string;
  fullName: string;
  phone: string;
  plateNumber?: string | null;
};

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
};

type Props<T extends { id: string }> = {
  title: string;
  description: string;
  endpoint: string;
  columns: Column<T>[];
  fields: Field[];
  initialForm: Record<string, string | number>;
  transformBody?: (form: Record<string, string | number>) => Record<string, unknown>;
  suggestionLabel?: (row: T) => string;
  suggestionHint?: (row: T) => string | undefined;
  addLabel?: string;
  amountKey?: string;
  totalLabel?: (amount: string) => string;
  deleteTitle?: string;
  deleteMessage?: string;
};

export function ResourcePage<T extends { id: string }>({
  title,
  description,
  endpoint,
  columns,
  fields,
  initialForm,
  transformBody,
  suggestionLabel,
  suggestionHint,
  addLabel,
  amountKey,
  totalLabel,
  deleteTitle,
  deleteMessage,
}: Props<T>) {
  const t = useT();
  const { dateLocale } = useLocale();
  const [allRows, setAllRows] = useState<T[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadAll() {
    const [data, driverList] = await Promise.all([
      api<T[]>(endpoint),
      api<DriverOption[]>("/admin/drivers"),
    ]);
    setAllRows(data);
    setDrivers(driverList);
  }

  useEffect(() => {
    setBooting(true);
    loadAll()
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("common.error")),
      )
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allRows;
    return allRows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term),
    );
  }, [allRows, q]);

  const totalAmount = useMemo(() => {
    if (!amountKey) return 0;
    return allRows.reduce(
      (sum, row) => sum + (Number((row as Record<string, unknown>)[amountKey]) || 0),
      0,
    );
  }, [allRows, amountKey]);

  const suggestions = useMemo(
    () =>
      allRows.map((row) => ({
        id: row.id,
        label: suggestionLabel
          ? suggestionLabel(row)
          : String((row as { driverName?: string }).driverName || row.id),
        hint: suggestionHint?.(row),
      })),
    [allRows, suggestionHint, suggestionLabel],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      const body = transformBody ? transformBody(form) : form;
      await api(endpoint, { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      setForm(initialForm);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await api(`${endpoint}/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await loadAll();
  }

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h2>
          {amountKey ? (
            <p className="mt-2 text-lg font-bold text-danger">
              {totalLabel
                ? totalLabel(formatMoney(totalAmount, dateLocale))
                : formatMoney(totalAmount, dateLocale)}
            </p>
          ) : (
            <p className="mt-2 text-muted">{description}</p>
          )}
          {amountKey ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError("");
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white dark:bg-steel shadow-lg transition hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          {addLabel ?? t("common.add")}
        </button>
      </div>

      <LiveSearch
        value={q}
        onChange={setQ}
        suggestions={suggestions}
        placeholder={t("resource.searchPlaceholder")}
      />

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {booting ? (
        <div className="space-y-4">
          <LoadingScreen variant="inline" />
          <TableSkeleton rows={6} cols={columns.length + 1} />
        </div>
      ) : (
      <div className="overflow-x-auto rounded-3xl border border-line bg-paper shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold">{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-muted">
                  {q.trim() ? t("common.noResults") : t("common.empty")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-line/70 hover:bg-mist-2/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.render(row)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDeleteId(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("resource.addTitle", { title })}
        subtitle={t("resource.addSubtitle")}
        wide
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
            >
              {t("common.cancel")}
            </button>
            <button
              form="resource-create-form"
              type="submit"
              disabled={loading}
              className="btn-primary !w-auto min-w-40 px-6"
            >
              {loading ? t("common.saving") : t("common.save")}
            </button>
          </div>
        }
      >
        <form id="resource-create-form" onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {formError}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.name}
                className={cn(
                  "block rounded-2xl border border-line bg-mist-2/50 p-3",
                  field.type === "textarea" && "sm:col-span-2",
                )}
              >
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  {field.label}
                  {field.required ? <span className="text-danger"> *</span> : null}
                </span>
                {field.type === "select" && field.name === "driverId" ? (
                  <SearchSelect
                    value={String(form[field.name] ?? "")}
                    required={field.required}
                    placeholder={t("common.selectDriver")}
                    options={drivers.map((d) => ({
                      value: d.id,
                      label: d.fullName,
                      hint: d.phone,
                      detail: d.plateNumber || undefined,
                    }))}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [field.name]: v }))
                    }
                  />
                ) : field.type === "select" && field.options ? (
                  <Select
                    value={String(form[field.name] ?? "")}
                    required={field.required}
                    options={field.options}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [field.name]: v }))
                    }
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    className="input-field min-h-24"
                    value={String(form[field.name] ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.name]: e.target.value }))
                    }
                  />
                ) : field.type === "date" ? (
                  <DatePicker
                    value={String(form[field.name] ?? "")}
                    required={field.required}
                    onChange={(v) => setForm((f) => ({ ...f, [field.name]: v }))}
                  />
                ) : field.name === "months" ? (
                  <input
                    className="input-field"
                    type="number"
                    min={0}
                    required={field.required}
                    placeholder={field.placeholder || "12"}
                    value={String(form[field.name] ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [field.name]: Number(e.target.value || 0),
                      }))
                    }
                  />
                ) : field.name === "price" ||
                  field.name === "paid" ||
                  field.name === "amount" ||
                  field.type === "number" ? (
                  <div className="relative">
                    <input
                      className="input-field pr-14"
                      inputMode="numeric"
                      required={field.required}
                      placeholder={field.placeholder || "0"}
                      value={
                        form[field.name] === "" || form[field.name] === undefined
                          ? ""
                          : formatMoneyMask(form[field.name])
                      }
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [field.name]: parseMoneyInput(e.target.value),
                        }))
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
                      {t("common.sum")}
                    </span>
                  </div>
                ) : (
                  <input
                    className="input-field"
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder}
                    value={String(form[field.name] ?? "")}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (
                        field.name === "tirNumber" ||
                        field.name === "trailerNo" ||
                        field.name === "code" ||
                        field.name === "dazvolNumber" ||
                        field.name === "licenseNumber"
                      ) {
                        v = v.toUpperCase();
                      }
                      setForm((f) => ({ ...f, [field.name]: v }));
                    }}
                  />
                )}
              </label>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteId)}
        title={deleteTitle ?? t("common.confirmDeleteTitle")}
        message={deleteMessage ?? t("common.confirmDeleteMessage")}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          confirmDelete().catch((e) =>
            setError(e instanceof Error ? e.message : t("common.deleteError")),
          );
        }}
      />
    </div>
  );
}

export function moneyCell(value: number, tone?: string, locale = "uz-UZ") {
  return (
    <span className={cn("font-semibold", tone)}>
      {formatMoney(value, locale)}
    </span>
  );
}
