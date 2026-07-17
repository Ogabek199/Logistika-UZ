"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Eye,
  Pencil,
  UserRound,
  Phone,
  Truck,
  IdCard,
  KeyRound,
  FileText,
  Stamp,
  Shield,
  Home,
  FileType2,
  ScrollText,
} from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import { formatMoney, formatPhoneMask, formatPassportMask, formatPlateMask, formatPersonName } from "@/lib/utils";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { PasswordInput } from "@/components/ui/password-input";
import { LiveSearch } from "@/components/ui/live-search";
import { Pagination } from "@/components/ui/pagination";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { useLocale, useT } from "@/i18n";

function isoToday(offsetYears = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  return d.toISOString().slice(0, 10);
}

const PAGE_SIZE = 20;

type DriverRow = {
  id: string;
  fullName: string;
  phone: string;
  vehicle: string | null;
  plateNumber: string | null;
  passportSeries: string | null;
  totalDebt: number;
  totalPaid: number;
  docsCount: number;
};

type DriverStats = {
  totalDrivers: number;
  totalDocs: number;
  totalPaid: number;
  totalDebt: number;
  activeDrivers: number;
};

type DriversResponse = {
  stats: DriverStats;
  items: DriverRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const empty = {
  fullName: "",
  phone: "+998 ",
  vehicle: "",
  plateNumber: "",
  password: "",
  passportSeries: "",
};

export default function DriversPage() {
  const t = useT();
  const { dateLocale } = useLocale();
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<DriverRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dovDriver, setDovDriver] = useState<DriverRow | null>(null);
  const [dovForm, setDovForm] = useState({ passport: "", startDate: "", endDate: "" });
  const [dovLoading, setDovLoading] = useState(false);
  const [dovError, setDovError] = useState("");

  const loadPage = useCallback(
    async (nextPage: number, term: string) => {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      });
      if (term.trim()) params.set("q", term.trim());

      const data = await api<DriversResponse>(`/admin/drivers?${params}`);
      setRows(data.items);
      setStats(data.stats);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    },
    [],
  );

  useEffect(() => {
    api<DriverRow[]>("/admin/drivers")
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadPage(page, q).catch((e) =>
      setError(e instanceof Error ? e.message : t("common.error")),
    );
  }, [loadPage, page, q, t]);

  const suggestionItems = useMemo(
    () =>
      suggestions.map((d) => ({
        id: d.id,
        label: d.fullName,
        hint: d.phone,
      })),
    [suggestions],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      await api("/admin/drivers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm(empty);
      const refreshed = await api<DriverRow[]>("/admin/drivers");
      setSuggestions(refreshed);
      await loadPage(1, q);
      setPage(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await api(`/admin/drivers/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    const refreshed = await api<DriverRow[]>("/admin/drivers");
    setSuggestions(refreshed);
    const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
    setPage(nextPage);
    await loadPage(nextPage, q);
  }

  function openDoverennost(d: DriverRow) {
    setDovError("");
    setDovDriver(d);
    setDovForm({
      passport: d.passportSeries || "",
      startDate: isoToday(0),
      endDate: isoToday(2),
    });
  }

  async function downloadBlanka(d: DriverRow) {
    try {
      await downloadFile(`/admin/drivers/${d.id}/blanka`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  }

  async function submitDoverennost(e: FormEvent) {
    e.preventDefault();
    if (!dovDriver) return;
    setDovLoading(true);
    setDovError("");
    try {
      await downloadFile(`/admin/drivers/${dovDriver.id}/doverennost`, {
        method: "POST",
        body: JSON.stringify(dovForm),
      });
      setDovDriver(null);
    } catch (err) {
      setDovError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setDovLoading(false);
    }
  }

  function rowActions(d: DriverRow): ActionItem[] {
    const base = `/admin/drivers/${d.id}`;
    return [
      { id: "putyovka", label: t("nav.putyovkas"), href: `${base}/add/putyovka`, icon: <FileText className="h-4 w-4" /> },
      { id: "tir", label: t("nav.tirs"), href: `${base}/add/tir`, icon: <Truck className="h-4 w-4" /> },
      { id: "dazvol", label: t("nav.dazvols"), href: `${base}/add/dazvol`, icon: <Stamp className="h-4 w-4" /> },
      { id: "litsenziya", label: t("nav.licenses"), href: `${base}/add/litsenziya`, icon: <Shield className="h-4 w-4" /> },
      { id: "ijara", label: t("nav.rentals"), href: `${base}/add/ijara`, icon: <Home className="h-4 w-4" /> },
      { id: "view", label: t("common.view"), href: base, icon: <Eye className="h-4 w-4" />, tone: "accent", divider: true },
      { id: "edit", label: t("common.edit"), href: `${base}/edit`, icon: <Pencil className="h-4 w-4" />, tone: "accent" },
      { id: "blanka", label: t("drivers.blanka"), onClick: () => downloadBlanka(d), icon: <FileType2 className="h-4 w-4" />, tone: "accent", divider: true },
      { id: "doverennost", label: t("drivers.doverennost"), onClick: () => openDoverennost(d), icon: <ScrollText className="h-4 w-4" />, tone: "accent" },
      { id: "delete", label: t("common.delete"), onClick: () => setDeleteId(d.id), icon: <Trash2 className="h-4 w-4" />, tone: "danger", divider: true },
    ];
  }

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">
            {t("drivers.title")}
          </h2>
          <p className="mt-2 text-muted">
            {stats
              ? t("drivers.total", { n: stats.totalDrivers })
              : t("drivers.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError("");
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          {t("drivers.add")}
        </button>
      </div>

      {stats ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("drivers.totalDocs")}
            value={String(stats.totalDocs)}
            tone="from-[#16324d] to-[#2f7fd1]"
          />
          <StatCard
            label={t("drivers.totalPaid")}
            value={formatMoney(stats.totalPaid, dateLocale)}
            tone="from-[#123a2b] to-[#1f7a56]"
          />
          <StatCard
            label={t("drivers.totalDebt")}
            value={formatMoney(stats.totalDebt, dateLocale)}
            tone="from-[#4a2020] to-[#c04545]"
          />
          <StatCard
            label={t("drivers.active")}
            value={String(stats.activeDrivers)}
            tone="from-[#1d5c4a] to-[#2f9d78]"
            light
          />
        </section>
      ) : null}

      <LiveSearch
        value={searchInput}
        onChange={setSearchInput}
        suggestions={suggestionItems}
        placeholder={t("drivers.searchPlaceholder")}
      />

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">{t("drivers.name")}</th>
              <th className="px-4 py-3">{t("drivers.phone")}</th>
              <th className="px-4 py-3">{t("drivers.vehicle")}</th>
              <th className="px-4 py-3">{t("drivers.debt")}</th>
              <th className="px-4 py-3">{t("drivers.docs")}</th>
              <th className="w-24 px-4 py-3 text-center">{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  {q.trim() ? t("common.noResults") : t("drivers.empty")}
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="border-t border-line/70 hover:bg-mist-2/60">
                  <td className="px-4 py-3 font-semibold text-ink">{d.fullName}</td>
                  <td className="px-4 py-3 text-muted">{d.phone}</td>
                  <td className="px-4 py-3">
                    {d.vehicle || t("common.dash")}
                    {d.plateNumber ? (
                      <span className="block text-xs text-muted">{d.plateNumber}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-semibold text-signal">
                    {formatMoney(d.totalDebt, dateLocale)}
                  </td>
                  <td className="px-4 py-3">{d.docsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu items={rowActions(d)} label={t("common.action")} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("drivers.modalTitle")}
        subtitle={t("drivers.modalSubtitle")}
        wide
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink"
            >
              {t("common.cancel")}
            </button>
            <button
              form="driver-create-form"
              type="submit"
              disabled={loading}
              className="btn-primary !w-auto min-w-40 px-6"
            >
              {loading ? t("common.saving") : t("common.save")}
            </button>
          </div>
        }
      >
        <form id="driver-create-form" onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {formError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              icon={<UserRound className="h-4 w-4" />}
              label={t("drivers.fullName")}
              required
            >
              <input
                className="input-field"
                required
                placeholder={t("drivers.fullNamePlaceholder")}
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fullName: formatPersonName(e.target.value),
                  }))
                }
              />
            </Field>

            <Field icon={<Phone className="h-4 w-4" />} label={t("drivers.phone")} required>
              <input
                className="input-field"
                required
                inputMode="tel"
                placeholder="+998 90 123 45 67"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: formatPhoneMask(e.target.value) }))
                }
              />
            </Field>

            <Field icon={<Truck className="h-4 w-4" />} label={t("drivers.vehicle")}>
              <input
                className="input-field"
                placeholder="MAN TGX"
                value={form.vehicle}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    vehicle: e.target.value.toUpperCase(),
                  }))
                }
              />
            </Field>

            <Field icon={<IdCard className="h-4 w-4" />} label={t("drivers.plateNumber")}>
              <input
                className="input-field"
                placeholder="01 A 333 BA yoki 01 333 AAA"
                value={form.plateNumber}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    plateNumber: formatPlateMask(e.target.value),
                  }))
                }
              />
            </Field>

            <Field icon={<KeyRound className="h-4 w-4" />} label={t("drivers.password")} required>
              <PasswordInput
                required
                minLength={4}
                placeholder={t("drivers.passwordPlaceholder")}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </Field>

            <Field icon={<IdCard className="h-4 w-4" />} label={t("drivers.passport")}>
              <input
                className="input-field"
                placeholder="AA 1234567"
                value={form.passportSeries}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    passportSeries: formatPassportMask(e.target.value),
                  }))
                }
              />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(dovDriver)}
        onClose={() => setDovDriver(null)}
        title={t("drivers.doverennostTitle")}
        subtitle={dovDriver?.fullName}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDovDriver(null)}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink"
            >
              {t("common.cancel")}
            </button>
            <button
              form="doverennost-form"
              type="submit"
              disabled={dovLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d3fd1] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
            >
              <ScrollText className="h-4 w-4" />
              {dovLoading ? t("common.loading") : t("drivers.download")}
            </button>
          </div>
        }
      >
        <form id="doverennost-form" onSubmit={submitDoverennost} className="space-y-4">
          {dovError ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {dovError}
            </p>
          ) : null}

          <Field icon={<IdCard className="h-4 w-4" />} label={t("drivers.passportFull")}>
            <input
              className="input-field"
              placeholder="AA 1234567"
              value={dovForm.passport}
              onChange={(e) =>
                setDovForm((f) => ({
                  ...f,
                  passport: formatPassportMask(e.target.value),
                }))
              }
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon={<IdCard className="h-4 w-4" />} label={t("resource.startDate")}>
              <DatePicker
                value={dovForm.startDate}
                onChange={(v) => setDovForm((f) => ({ ...f, startDate: v }))}
              />
            </Field>
            <Field icon={<IdCard className="h-4 w-4" />} label={t("resource.endDate")}>
              <DatePicker
                value={dovForm.endDate}
                onChange={(v) => setDovForm((f) => ({ ...f, endDate: v }))}
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteId)}
        title={t("drivers.deleteTitle")}
        message={t("drivers.deleteMessage")}
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

function StatCard({
  label,
  value,
  tone,
  light,
}: {
  label: string;
  value: string;
  tone: string;
  light?: boolean;
}) {
  if (light) {
    return (
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {label}
        </p>
        <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${tone} p-5 text-white shadow-lg`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{value}</p>
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-line bg-[#f7fafc] p-2.5 transition focus-within:border-steel/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(47,127,209,0.12)]">
      <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span className="text-steel">{icon}</span>
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}
