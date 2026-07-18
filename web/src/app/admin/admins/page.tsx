"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Plus, Trash2, Mail, KeyRound, AtSign } from "lucide-react";
import { api, getStoredUser } from "@/lib/api";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocale, useT } from "@/i18n";

type AdminRow = {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
};

const empty = {
  username: "",
  email: "",
  password: "",
};

export default function AdminsPage() {
  const t = useT();
  const { dateLocale } = useLocale();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const currentId = getStoredUser()?.id;

  async function loadAll() {
    const data = await api<AdminRow[]>("/admin/admins");
    setRows(data);
  }

  useEffect(() => {
    loadAll().catch((e) =>
      setError(e instanceof Error ? e.message : t("common.error")),
    );
  }, [t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      await api("/admin/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm(empty);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await api(`/admin/admins/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await loadAll();
  }

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">
            {t("admins.title")}
          </h2>
          <p className="mt-2 text-muted">{t("admins.description")}</p>
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
          {t("admins.add")}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-line bg-paper shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">{t("admins.login")}</th>
              <th className="px-4 py-3">{t("admins.email")}</th>
              <th className="px-4 py-3">{t("admins.created")}</th>
              <th className="px-4 py-3">{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  {t("admins.empty")}
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-t border-line/70 hover:bg-mist-2/60">
                  <td className="px-4 py-3 font-semibold text-ink">
                    {a.username}
                    {a.id === currentId ? (
                      <span className="ml-2 rounded-md bg-steel/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-steel">
                        {t("common.you")}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {a.email || t("common.dash")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(a.createdAt).toLocaleDateString(dateLocale)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={a.id === currentId}
                      onClick={() => setDeleteId(a.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("admins.modalTitle")}
        subtitle={t("admins.modalSubtitle")}
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
              form="admin-create-form"
              type="submit"
              disabled={loading}
              className="btn-primary !w-auto min-w-40 px-6"
            >
              {loading ? t("common.saving") : t("common.save")}
            </button>
          </div>
        }
      >
        <form id="admin-create-form" onSubmit={onSubmit} className="space-y-3">
          {formError ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {formError}
            </p>
          ) : null}

          <Field icon={<AtSign className="h-4 w-4" />} label={t("admins.login")} required>
            <input
              className="input-field"
              required
              autoComplete="off"
              placeholder={t("admins.loginPlaceholder")}
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  username: e.target.value.trim().toLowerCase(),
                }))
              }
            />
          </Field>

          <Field icon={<Mail className="h-4 w-4" />} label={t("admins.email")} required>
            <input
              className="input-field"
              type="email"
              required
              autoComplete="off"
              placeholder="admin@firma.uz"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value.trim() }))
              }
            />
          </Field>

          <Field icon={<KeyRound className="h-4 w-4" />} label={t("admins.password")} required>
            <PasswordInput
              required
              minLength={4}
              autoComplete="new-password"
              placeholder={t("admins.passwordPlaceholder")}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </Field>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteId)}
        title={t("admins.deleteTitle")}
        message={t("admins.deleteMessage")}
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
    <label className="block rounded-xl border border-line bg-field p-2.5 transition focus-within:border-steel/50 focus-within:bg-paper focus-within:shadow-[0_0_0_3px_rgba(47,127,209,0.12)]">
      <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span className="text-steel">{icon}</span>
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}
