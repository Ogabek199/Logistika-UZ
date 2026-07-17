"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoneyMask, parseMoneyInput } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useT } from "@/i18n";

type FieldKind = "text" | "money" | "number" | "date" | "textarea";

type FieldDef = {
  name: string;
  labelKey: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  upper?: boolean;
};

type TypeConfig = {
  titleKey: string;
  endpoint: string;
  fields: FieldDef[];
};

const MONEY_FIELDS: FieldDef[] = [
  { name: "price", labelKey: "resource.price", kind: "money", required: true },
  { name: "paid", labelKey: "resource.paid", kind: "money" },
];

const DATE_FIELDS: FieldDef[] = [
  { name: "startDate", labelKey: "resource.startDate", kind: "date" },
  { name: "endDate", labelKey: "resource.endDate", kind: "date" },
];

const NOTE_FIELD: FieldDef = {
  name: "note",
  labelKey: "resource.note",
  kind: "textarea",
};

const CONFIGS: Record<string, TypeConfig> = {
  putyovka: {
    titleKey: "putyovkas.addTitle",
    endpoint: "/admin/putyovkalar",
    fields: [
      { name: "trailerNo", labelKey: "putyovkas.trailerNo", kind: "text", upper: true, placeholder: "KRONE SD №..." },
      { name: "code", labelKey: "putyovkas.code", kind: "text", upper: true },
      ...MONEY_FIELDS,
      { name: "months", labelKey: "resource.months", kind: "number", placeholder: "12" },
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  tir: {
    titleKey: "tirs.addTitle",
    endpoint: "/admin/tirlar",
    fields: [
      { name: "tirNumber", labelKey: "tirs.tirNumber", kind: "text", upper: true, placeholder: "SCHMITZ №..." },
      ...MONEY_FIELDS,
      { name: "months", labelKey: "resource.months", kind: "number", placeholder: "12" },
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  dazvol: {
    titleKey: "dazvols.addTitle",
    endpoint: "/admin/dazvollar",
    fields: [
      { name: "country", labelKey: "dazvols.country", kind: "text", placeholder: "Rossiya, Germaniya..." },
      { name: "dazvolNumber", labelKey: "dazvols.dazvolNumber", kind: "text", upper: true },
      ...MONEY_FIELDS,
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  litsenziya: {
    titleKey: "licenses.addTitle",
    endpoint: "/admin/litsenziyalar",
    fields: [
      { name: "licenseNumber", labelKey: "licenses.licenseNumber", kind: "text", upper: true },
      ...MONEY_FIELDS,
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  ijara: {
    titleKey: "rentals.addTitle",
    endpoint: "/admin/ijara",
    fields: [
      { name: "address", labelKey: "rentals.address", kind: "text", placeholder: "Qo‘qon, Mustaqillik ko‘chasi 12" },
      ...MONEY_FIELDS,
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
};

export default function AddResourcePage() {
  const params = useParams<{ id: string; type: string }>();
  const router = useRouter();
  const t = useT();

  const config = CONFIGS[params.type];

  const [driverName, setDriverName] = useState("");
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    api<{ fullName: string }>(`/admin/drivers/${params.id}`)
      .then((d) => setDriverName(d.fullName))
      .catch(() => setDriverName(""));
  }, [params.id]);

  const initial = useMemo(() => {
    if (!config) return {};
    const obj: Record<string, string | number> = {};
    for (const f of config.fields) {
      obj[f.name] = f.kind === "money" ? 0 : "";
    }
    return obj;
  }, [config]);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  if (!config) {
    return (
      <div className="animate-rise space-y-4">
        <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-sm font-semibold text-steel">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>
        <p className="text-danger">{t("common.error")}</p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = { driverId: params.id };
      for (const f of config.fields) {
        const v = form[f.name];
        if (f.kind === "money") {
          body[f.name] = typeof v === "number" ? v : parseMoneyInput(String(v ?? ""));
        } else if (f.kind === "number") {
          if (v !== "" && v !== undefined) body[f.name] = Number(v);
        } else if (typeof v === "string" && v.trim()) {
          body[f.name] = v.trim();
        }
      }
      await api(config.endpoint, { method: "POST", body: JSON.stringify(body) });
      router.push("/admin/drivers");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-rise mx-auto max-w-2xl space-y-6">
      <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-sm font-semibold text-steel">
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">{t(config.titleKey)}</h2>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6"
      >
        {error ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
        ) : null}

        <Field icon={<UserRound className="h-4 w-4" />} label={t("resource.driver")}>
          <input className="input-field bg-mist-2/60" value={driverName} disabled readOnly />
        </Field>

        {config.fields.map((f) => (
          <Field key={f.name} label={t(f.labelKey)} required={f.required}>
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

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/admin/drivers"
            className="inline-flex min-w-40 items-center justify-center rounded-xl border border-line bg-white px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-mist"
          >
            {t("common.cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary !w-auto min-w-40 px-6"
          >
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
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
  icon?: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-2xl border border-line bg-[#f7fafc] p-3 transition focus-within:border-steel/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(47,127,209,0.12)]">
      <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {icon ? <span className="text-steel">{icon}</span> : null}
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}
