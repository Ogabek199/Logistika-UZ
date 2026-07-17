"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserRound, Phone, Truck, IdCard, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import {
  formatPhoneMask,
  formatPassportMask,
  formatPlateMask,
  formatPersonName,
} from "@/lib/utils";
import { useT } from "@/i18n";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingScreen } from "@/components/loading-screen";
import { Spinner } from "@/components/ui/spinner";

type DriverDetail = {
  fullName: string;
  phone: string;
  vehicle: string | null;
  plateNumber: string | null;
  passportSeries: string | null;
  telegramChatId: string | null;
};

export default function EditDriverPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    vehicle: "",
    plateNumber: "",
    passportSeries: "",
    telegramChatId: "",
    password: "",
  });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    api<DriverDetail>(`/admin/drivers/${params.id}`)
      .then((d) => {
        setForm({
          fullName: d.fullName || "",
          phone: d.phone || "",
          vehicle: d.vehicle || "",
          plateNumber: d.plateNumber || "",
          passportSeries: d.passportSeries || "",
          telegramChatId: d.telegramChatId || "",
          password: "",
        });
        setReady(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("common.error")));
  }, [params.id, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        vehicle: form.vehicle.trim(),
        plateNumber: form.plateNumber.trim(),
        passportSeries: form.passportSeries.trim(),
        telegramChatId: form.telegramChatId.trim(),
      };
      if (form.password.trim()) body.password = form.password.trim();
      await api(`/admin/drivers/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
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

      <h2 className="text-3xl font-extrabold tracking-tight text-ink">
        {t("drivers.editTitle")}
      </h2>

      {!ready && !error ? (
        <LoadingScreen variant="panel" />
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6"
        >
          {error ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon={<UserRound className="h-4 w-4" />} label={t("drivers.fullName")} required>
              <input
                className="input-field"
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: formatPersonName(e.target.value) }))}
              />
            </Field>

            <Field icon={<Phone className="h-4 w-4" />} label={t("drivers.phone")} required>
              <input
                className="input-field"
                required
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhoneMask(e.target.value) }))}
              />
            </Field>

            <Field icon={<Truck className="h-4 w-4" />} label={t("drivers.vehicle")}>
              <input
                className="input-field"
                value={form.vehicle}
                onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value.toUpperCase() }))}
              />
            </Field>

            <Field icon={<IdCard className="h-4 w-4" />} label={t("drivers.plateNumber")}>
              <input
                className="input-field"
                value={form.plateNumber}
                onChange={(e) => setForm((f) => ({ ...f, plateNumber: formatPlateMask(e.target.value) }))}
              />
            </Field>

            <Field icon={<IdCard className="h-4 w-4" />} label={t("drivers.passport")}>
              <input
                className="input-field"
                placeholder="AA 1234567"
                value={form.passportSeries}
                onChange={(e) => setForm((f) => ({ ...f, passportSeries: formatPassportMask(e.target.value) }))}
              />
            </Field>

            <Field icon={<Phone className="h-4 w-4" />} label={t("drivers.telegramChatIdManual")}>
              <input
                className="input-field"
                placeholder={t("drivers.telegramChatIdPlaceholder")}
                value={form.telegramChatId}
                onChange={(e) => setForm((f) => ({ ...f, telegramChatId: e.target.value.replace(/\D/g, "") }))}
              />
              <p className="mt-1.5 text-xs text-muted">{t("drivers.telegramChatIdManualHint")}</p>
            </Field>

            <Field icon={<KeyRound className="h-4 w-4" />} label={t("drivers.newPassword")}>
              <PasswordInput
                minLength={4}
                placeholder={t("drivers.passwordKeep")}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              href="/admin/drivers"
              className="inline-flex min-w-40 items-center justify-center rounded-xl border border-line bg-white px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-mist"
            >
              {t("common.cancel")}
            </Link>
            <button type="submit" disabled={loading} className="btn-primary !w-auto min-w-40 px-6">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" className="border-white/30 border-t-white" />
                  {t("common.saving")}
                </span>
              ) : (
                t("common.save")
              )}
            </button>
          </div>
        </form>
      )}
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
