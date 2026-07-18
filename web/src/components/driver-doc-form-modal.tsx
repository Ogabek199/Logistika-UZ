"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoneyMask, parseMoneyInput } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { useT } from "@/i18n";
import {
  DRIVER_DOC_CONFIGS,
  buildDocBody,
  buildInitialForm,
} from "@/lib/driver-doc-config";

type Props = {
  open: boolean;
  type: string | null;
  driverId: string;
  driverName: string;
  editItem?: Record<string, unknown> | null;
  editTitleKey?: string;
  onClose: () => void;
  onSaved: () => void;
};

export function DriverDocFormModal({
  open,
  type,
  driverId,
  driverName,
  editItem,
  editTitleKey,
  onClose,
  onSaved,
}: Props) {
  const t = useT();
  const config = type ? DRIVER_DOC_CONFIGS[type] : undefined;

  const initial = useMemo(
    () => (config ? buildInitialForm(config) : {}),
    [config],
  );

  const [form, setForm] = useState<Record<string, string | number>>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && config) {
      const next = buildInitialForm(config);
      if (editItem) {
        for (const field of config.fields) {
          const value = editItem[field.name];
          if (typeof value === "string") {
            next[field.name] =
              field.kind === "date" ? value.slice(0, 10) : value;
          } else if (typeof value === "number") {
            next[field.name] = value;
          }
        }
      }
      setForm(next);
      setError("");
    }
  }, [open, config, editItem]);

  if (!config) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      const body = buildDocBody(config, form, driverId);
      await api(
        editItem?.id ? `${config.endpoint}/${String(editItem.id)}` : config.endpoint,
        {
        method: editItem?.id ? "PATCH" : "POST",
        body: JSON.stringify(body),
        },
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(editItem && editTitleKey ? editTitleKey : config.titleKey)}
      subtitle={driverName}
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
            form="driver-doc-form"
            type="submit"
            disabled={loading}
            className="btn-primary !w-auto min-w-40 px-6"
          >
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </div>
      }
    >
      <form id="driver-doc-form" onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <Field icon={<UserRound className="h-4 w-4" />} label={t("resource.driver")}>
          <input className="input-field bg-mist-2/60" value={driverName} disabled readOnly />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          {config.fields.map((f) => (
            <Field
              key={f.name}
              label={t(f.labelKey)}
              required={f.required}
              className={f.kind === "textarea" ? "sm:col-span-2" : undefined}
            >
              {f.kind === "textarea" ? (
                <textarea
                  className="input-field min-h-24"
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              ) : f.kind === "date" ? (
                <DatePicker
                  value={String(form[f.name] ?? "")}
                  onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}
                />
              ) : f.kind === "money" ? (
                <div className="relative">
                  <input
                    className="input-field pr-14"
                    inputMode="numeric"
                    required={f.required}
                    placeholder="0"
                    value={
                      form[f.name] === "" || form[f.name] === undefined
                        ? ""
                        : formatMoneyMask(form[f.name])
                    }
                    onChange={(e) =>
                      setForm((s) => ({ ...s, [f.name]: parseMoneyInput(e.target.value) }))
                    }
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
                    {t("common.sum")}
                  </span>
                </div>
              ) : f.kind === "number" ? (
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  placeholder={f.placeholder}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              ) : (
                <input
                  className="input-field"
                  placeholder={f.placeholder}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      [f.name]: f.upper ? e.target.value.toUpperCase() : e.target.value,
                    }))
                  }
                />
              )}
            </Field>
          ))}
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  icon,
  required,
  children,
  className,
}: {
  label: string;
  icon?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`block rounded-2xl border border-line bg-field p-3 transition focus-within:border-steel/50 focus-within:bg-paper focus-within:shadow-[0_0_0_3px_rgba(47,127,209,0.12)] ${className || ""}`}
    >
      <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {icon ? <span className="text-steel">{icon}</span> : null}
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}
