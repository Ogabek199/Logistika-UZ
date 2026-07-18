"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  FileText,
  DollarSign,
  CircleStop,
  Check,
} from "lucide-react";
import { api, downloadFile } from "@/lib/api";
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
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { Toast } from "@/components/ui/toast";
import { useLocale, useT } from "@/i18n";
import type { DriverOption } from "@/components/resource-page";

type FilterKey = "all" | "active" | "finished" | "debtor";

type PutyovkaRow = {
  id: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string | null;
  driverPlateNumber?: string | null;
  trailerNo?: string | null;
  code?: string | null;
  price: number;
  paid: number;
  debt: number;
  months?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  note?: string | null;
  status: string;
};

const emptyForm = {
  driverId: "",
  trailerNo: "",
  code: "",
  price: 0,
  paid: 0,
  months: 1,
  startDate: "",
  endDate: "",
  note: "",
};

function formatDate(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isExpired(endDate: string | null | undefined) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

async function downloadPutyovkaWord(row: PutyovkaRow) {
  const slug = (row.driverName || "putyovka")
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
  await downloadFile(
    `/admin/putyovkalar/${row.id}/docx`,
    {},
    `Putyovka_${slug || "haydovchi"}.docx`,
  );
}

export default function PutyovkalarPage() {
  const t = useT();
  const { dateLocale } = useLocale();
  const dash = t("common.dash");

  const [rows, setRows] = useState<PutyovkaRow[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<PutyovkaRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [payRow, setPayRow] = useState<PutyovkaRow | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [finishId, setFinishId] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    const qs = params.toString();
    const [data, driverList] = await Promise.all([
      api<PutyovkaRow[]>(`/admin/putyovkalar${qs ? `?${qs}` : ""}`),
      api<DriverOption[]>("/admin/drivers"),
    ]);
    setRows(data);
    setDrivers(driverList);
  }, [filter]);

  useEffect(() => {
    loadAll().catch((e) =>
      setError(e instanceof Error ? e.message : t("common.error")),
    );
  }, [loadAll, t]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term),
    );
  }, [rows, q]);

  const suggestions = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        label: row.driverName || row.id,
        hint: row.trailerNo || row.code || undefined,
      })),
    [rows],
  );

  function openAdd() {
    setFormError("");
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(row: PutyovkaRow) {
    setFormError("");
    setEditRow(row);
    setForm({
      driverId: row.driverId,
      trailerNo: row.trailerNo || "",
      code: row.code || "",
      price: row.price,
      paid: row.paid,
      months: row.months ?? 1,
      startDate: row.startDate ? row.startDate.slice(0, 10) : "",
      endDate: row.endDate ? row.endDate.slice(0, 10) : "",
      note: row.note || "",
    });
  }

  function openPayment(row: PutyovkaRow) {
    setPayError("");
    setPayRow(row);
    setPayAmount(Math.min(row.debt, row.debt > 0 ? row.debt : 0));
    setPayNote("");
  }

  async function onSubmitCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      await api("/admin/putyovkalar", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAddOpen(false);
      setForm(emptyForm);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setLoading(true);
    setFormError("");
    try {
      await api(`/admin/putyovkalar/${editRow.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setEditRow(null);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await api(`/admin/putyovkalar/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await loadAll();
  }

  async function confirmFinish() {
    if (!finishId) return;
    await api(`/admin/putyovkalar/${finishId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "FINISHED" }),
    });
    setFinishId(null);
    await loadAll();
  }

  async function confirmActivate() {
    if (!activateId) return;
    await api(`/admin/putyovkalar/${activateId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    setActivateId(null);
    await loadAll();
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    if (!payRow) return;
    setPayLoading(true);
    setPayError("");
    try {
      const newPaid = payRow.paid + payAmount;
      await api(`/admin/putyovkalar/${payRow.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          paid: newPaid,
          ...(payNote.trim() ? { paymentNote: payNote.trim() } : {}),
        }),
      });
      setToast(
        t("putyovkas.paymentSuccess", {
          amount: formatMoney(payAmount, dateLocale),
          name: payRow.driverName || "",
        }),
      );
      setPayRow(null);
      await loadAll();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function handleWordDownload(row: PutyovkaRow) {
    try {
      await downloadPutyovkaWord(row);
      setToast(t("drivers.downloadStarted"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  }

  function rowActions(row: PutyovkaRow): ActionItem[] {
    const items: ActionItem[] = [
      {
        id: "word",
        label: t("putyovkas.downloadWord"),
        icon: <FileText className="h-4 w-4" />,
        onClick: () => handleWordDownload(row),
        tone: "accent",
      },
      {
        id: "payment",
        label: t("putyovkas.addPayment"),
        icon: <DollarSign className="h-4 w-4" />,
        onClick: () => openPayment(row),
        tone: "accent",
      },
      {
        id: "edit",
        label: t("common.edit"),
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => openEdit(row),
        tone: "accent",
        divider: true,
      },
    ];

    if (row.status === "ACTIVE") {
      items.push({
        id: "finish",
        label: t("putyovkas.finish"),
        icon: <CircleStop className="h-4 w-4" />,
        onClick: () => setFinishId(row.id),
      });
    }

    items.push({
      id: "delete",
      label: t("common.delete"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setDeleteId(row.id),
      tone: "danger",
      divider: true,
    });

    return items;
  }

  const filterButtons: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("putyovkas.filterAll") },
    { key: "active", label: t("putyovkas.filterActive") },
    { key: "finished", label: t("putyovkas.filterFinished") },
    { key: "debtor", label: t("putyovkas.filterDebtor") },
  ];

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">
            {t("putyovkas.listTitle")}
          </h2>
          <p className="mt-2 text-muted">
            {t("drivers.total", { n: rows.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white dark:bg-steel shadow-lg transition hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          {t("putyovkas.addTitle")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map((fb) => (
          <button
            key={fb.key}
            type="button"
            onClick={() => setFilter(fb.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              filter === fb.key
                ? "bg-ink text-white shadow-md dark:bg-steel"
                : "border border-line bg-paper text-muted hover:border-steel/40 hover:text-ink",
            )}
          >
            {fb.label}
          </button>
        ))}
      </div>

      <LiveSearch
        value={q}
        onChange={setQ}
        suggestions={suggestions}
        placeholder={t("putyovkas.searchPlaceholder")}
      />

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-line bg-paper shadow-sm">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">{t("resource.driver")}</th>
              <th className="px-4 py-3">{t("drivers.phone")}</th>
              <th className="px-4 py-3">{t("drivers.vehicle")}</th>
              <th className="px-4 py-3">{t("putyovkas.trailerNo")}</th>
              <th className="px-4 py-3">{t("putyovkas.code")}</th>
              <th className="px-4 py-3">{t("resource.price")}</th>
              <th className="px-4 py-3">{t("resource.debt")}</th>
              <th className="px-4 py-3">{t("resource.months")}</th>
              <th className="px-4 py-3">{t("resource.startDate")}</th>
              <th className="px-4 py-3">{t("resource.endDate")}</th>
              <th className="px-4 py-3">{t("resource.status")}</th>
              <th className="w-16 px-4 py-3 text-center">{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted">
                  {q.trim() ? t("common.noResults") : t("common.empty")}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-line/70 hover:bg-mist-2/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/drivers/${row.driverId}`}
                      className="font-semibold text-steel hover:underline"
                    >
                      {row.driverName || dash}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.driverPhone || dash}</td>
                  <td className="px-4 py-3">
                    {row.driverVehicle || dash}
                    {row.driverPlateNumber ? (
                      <span className="block text-xs text-muted">{row.driverPlateNumber}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{row.trailerNo || dash}</td>
                  <td className="px-4 py-3">{row.code || dash}</td>
                  <td className="px-4 py-3 font-semibold text-[#1f7a56]">
                    {formatMoney(row.price, dateLocale)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "font-semibold",
                        row.debt > 0 ? "text-signal" : "text-muted",
                      )}
                    >
                      {formatMoney(row.debt, dateLocale)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.months != null ? t("putyovkas.monthsShort", { n: row.months }) : dash}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(row.startDate, dateLocale)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        isExpired(row.endDate) && row.status === "ACTIVE"
                          ? "font-semibold text-signal"
                          : "text-muted",
                      )}
                    >
                      {formatDate(row.endDate, dateLocale)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusCell
                      row={row}
                      onFinish={() => setFinishId(row.id)}
                      onActivate={() => setActivateId(row.id)}
                      t={t}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu items={rowActions(row)} label={t("common.action")} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PutyovkaFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("putyovkas.addTitle")}
        form={form}
        setForm={setForm}
        drivers={drivers}
        formError={formError}
        loading={loading}
        onSubmit={onSubmitCreate}
        formId="putyovka-create-form"
        t={t}
      />

      <PutyovkaFormModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title={t("putyovkas.editTitle")}
        form={form}
        setForm={setForm}
        drivers={drivers}
        formError={formError}
        loading={loading}
        onSubmit={onSubmitEdit}
        formId="putyovka-edit-form"
        t={t}
      />

      <Modal
        open={Boolean(payRow)}
        onClose={() => setPayRow(null)}
        title={t("putyovkas.paymentTitle", { name: payRow?.driverName || "" })}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPayRow(null)}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
            >
              {t("common.cancelFull")}
            </button>
            <button
              form="putyovka-payment-form"
              type="submit"
              disabled={payLoading || payAmount <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f7a56] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {payLoading ? t("common.saving") : t("putyovkas.acceptPayment")}
            </button>
          </div>
        }
      >
        {payRow ? (
          <form id="putyovka-payment-form" onSubmit={submitPayment} className="space-y-4">
            {payError ? (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {payError}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-steel/5 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("resource.price")}
                </p>
                <p className="mt-1 text-lg font-extrabold text-ink">
                  {formatMoney(payRow.price, dateLocale)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("resource.paid")}
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#1f7a56]">
                  {formatMoney(payRow.paid, dateLocale)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("resource.debt")}
                </p>
                <p className="mt-1 text-lg font-extrabold text-signal">
                  {formatMoney(payRow.debt, dateLocale)}
                </p>
              </div>
            </div>

            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("expenses.amount")}
              </span>
              <input
                className="input-field"
                inputMode="numeric"
                required
                value={payAmount ? formatMoneyMask(payAmount) : ""}
                onChange={(e) => setPayAmount(parseMoneyInput(e.target.value))}
              />
            </label>

            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("resource.note")}
              </span>
              <input
                className="input-field"
                placeholder={t("putyovkas.paymentNotePlaceholder")}
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </label>
          </form>
        ) : null}
      </Modal>

      <ConfirmModal
        open={Boolean(deleteId)}
        title={t("putyovkas.deleteTitle")}
        message={t("putyovkas.deleteMessage")}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          confirmDelete().catch((e) =>
            setError(e instanceof Error ? e.message : t("common.deleteError")),
          );
        }}
      />

      <ConfirmModal
        open={Boolean(finishId)}
        title={t("putyovkas.finishTitle")}
        message={t("putyovkas.finishMessage")}
        confirmLabel={t("putyovkas.finishConfirm")}
        onCancel={() => setFinishId(null)}
        onConfirm={() => {
          confirmFinish().catch((e) =>
            setError(e instanceof Error ? e.message : t("common.error")),
          );
        }}
      />

      <Toast
        open={Boolean(toast)}
        message={toast}
        onClose={() => setToast("")}
      />

      <ConfirmModal
        open={Boolean(activateId)}
        title={t("putyovkas.activateTitle")}
        message={t("putyovkas.activateMessage")}
        confirmLabel={t("putyovkas.activateConfirm")}
        danger={false}
        onCancel={() => setActivateId(null)}
        onConfirm={() => {
          confirmActivate().catch((e) =>
            setError(e instanceof Error ? e.message : t("common.error")),
          );
        }}
      />
    </div>
  );
}

function StatusCell({
  row,
  onFinish,
  onActivate,
  t,
}: {
  row: PutyovkaRow;
  onFinish: () => void;
  onActivate: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (row.status === "FINISHED") {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex rounded-lg bg-[#f5c842]/20 px-2.5 py-1 text-xs font-bold text-[#9a7b00]">
          {t("putyovkas.statusFinished")}
        </span>
        <button
          type="button"
          onClick={onActivate}
          className="block rounded-lg bg-[#1f7a56]/10 px-2 py-1 text-xs font-bold text-[#1f7a56] hover:bg-[#1f7a56]/20"
        >
          {t("putyovkas.activate")}
        </button>
      </div>
    );
  }

  if (row.debt > 0) {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex rounded-lg bg-[#e8913a]/20 px-2.5 py-1 text-xs font-bold text-[#b5650a]">
          {t("putyovkas.statusDebtor")}
        </span>
        <button
          type="button"
          onClick={onFinish}
          className="block rounded-lg bg-[#f5c842]/20 px-2 py-1 text-xs font-bold text-[#9a7b00] hover:bg-[#f5c842]/35"
        >
          {t("putyovkas.finish")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <span className="inline-flex rounded-lg bg-[#1f7a56]/15 px-2.5 py-1 text-xs font-bold text-[#1f7a56]">
        {t("putyovkas.statusActive")}
      </span>
      <button
        type="button"
        onClick={onFinish}
        className="block rounded-lg bg-[#f5c842]/20 px-2 py-1 text-xs font-bold text-[#9a7b00] hover:bg-[#f5c842]/35"
      >
        {t("putyovkas.finish")}
      </button>
    </div>
  );
}

function PutyovkaFormModal({
  open,
  onClose,
  title,
  form,
  setForm,
  drivers,
  formError,
  loading,
  onSubmit,
  formId,
  t,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  drivers: DriverOption[];
  formError: string;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  formId: string;
  t: (key: string) => string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      wide
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
          >
            {t("common.cancelFull")}
          </button>
          <button
            form={formId}
            type="submit"
            disabled={loading}
            className="btn-primary !w-auto min-w-40 px-6"
          >
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        {formError ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("resource.driver")} required>
            <SearchSelect
              value={form.driverId}
              required
              placeholder={t("common.selectDriver")}
              options={drivers.map((d) => ({
                value: d.id,
                label: d.fullName,
                hint: d.phone,
                detail: d.plateNumber || undefined,
              }))}
              onChange={(v) => setForm((f) => ({ ...f, driverId: v }))}
            />
          </FormField>
          <FormField label={t("putyovkas.trailerNo")}>
            <input
              className="input-field"
              value={form.trailerNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, trailerNo: e.target.value.toUpperCase() }))
              }
            />
          </FormField>
          <FormField label={t("putyovkas.code")}>
            <input
              className="input-field"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </FormField>
          <FormField label={t("resource.price")} required>
            <MoneyInput
              value={form.price}
              onChange={(v) => setForm((f) => ({ ...f, price: v }))}
              required
              t={t}
            />
          </FormField>
          <FormField label={t("resource.paid")}>
            <MoneyInput
              value={form.paid}
              onChange={(v) => setForm((f) => ({ ...f, paid: v }))}
              t={t}
            />
          </FormField>
          <FormField label={t("resource.months")}>
            <input
              className="input-field"
              type="number"
              min={0}
              value={form.months}
              onChange={(e) =>
                setForm((f) => ({ ...f, months: Number(e.target.value || 0) }))
              }
            />
          </FormField>
          <FormField label={t("resource.startDate")}>
            <DatePicker
              value={form.startDate}
              onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
            />
          </FormField>
          <FormField label={t("resource.endDate")}>
            <DatePicker
              value={form.endDate}
              onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
            />
          </FormField>
          <FormField label={t("resource.note")} className="sm:col-span-2">
            <textarea
              className="input-field min-h-24"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

function FormField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "block rounded-2xl border border-line bg-mist-2/50 p-3",
        className,
      )}
    >
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function MoneyInput({
  value,
  onChange,
  required,
  t,
}: {
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="relative">
      <input
        className="input-field pr-14"
        inputMode="numeric"
        required={required}
        value={value ? formatMoneyMask(value) : ""}
        onChange={(e) => onChange(parseMoneyInput(e.target.value))}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
        {t("common.sum")}
      </span>
    </div>
  );
}
