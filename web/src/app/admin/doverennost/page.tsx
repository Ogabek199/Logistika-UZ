"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { IdCard, MapPin, ScrollText, UserRound, FileType2 } from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import { formatPassportMask, formatPersonName } from "@/lib/utils";
import { UZ_REGIONS, regionRu, regionRuFem } from "@/lib/regions";
import { SearchSelect } from "@/components/ui/search-select";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/loading-screen";
import { useT } from "@/i18n";

type DriverOption = {
  id: string;
  fullName: string;
  phone: string;
  plateNumber: string | null;
  passportSeries: string | null;
};

function isoToday(offsetYears = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  return d.toISOString().slice(0, 10);
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] || "",
    firstName: parts[1] || "",
    patronymic: parts.slice(2).join(" ") || "",
  };
}

const emptyForm = {
  lastName: "",
  firstName: "",
  patronymic: "",
  passport: "",
  passportIssued: "",
  regionId: "",
  startDate: isoToday(0),
  endDate: isoToday(2),
};

export default function DoverennostPage() {
  const t = useT();
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [booting, setBooting] = useState(true);
  const [driverId, setDriverId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState<"doverennost" | "blanka" | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const options = useMemo(
    () =>
      drivers.map((d) => ({
        value: d.id,
        label: d.fullName,
        hint: d.phone,
        detail: d.plateNumber || undefined,
      })),
    [drivers],
  );

  const regionOptions = useMemo(
    () =>
      UZ_REGIONS.map((r) => ({
        value: r.id,
        label: t(`regions.${r.id}`),
      })),
    [t],
  );

  useEffect(() => {
    api<DriverOption[]>("/admin/drivers")
      .then(setDrivers)
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("common.error")),
      )
      .finally(() => setBooting(false));
  }, [t]);

  function onSelectDriver(id: string) {
    setDriverId(id);
    setError("");
    const driver = drivers.find((d) => d.id === id);
    if (!driver) return;
    const names = splitFullName(driver.fullName);
    setForm((prev) => ({
      ...names,
      passport: driver.passportSeries || "",
      passportIssued: prev.passportIssued,
      regionId: prev.regionId,
      startDate: isoToday(0),
      endDate: isoToday(2),
    }));
  }

  function validateForm() {
    if (!driverId) {
      setError(t("doverennost.selectDriverRequired"));
      return false;
    }
    if (!form.lastName.trim() || !form.firstName.trim()) {
      setError(t("doverennost.nameRequired"));
      return false;
    }
    if (!form.passport.trim()) {
      setError(t("doverennost.passportRequired"));
      return false;
    }
    if (!form.regionId) {
      setError(t("doverennost.regionRequired"));
      return false;
    }
    if (!form.startDate || !form.endDate) {
      setError(t("doverennost.periodRequired"));
      return false;
    }
    return true;
  }

  function buildPayload(kind: "doverennost" | "blanka") {
    const { regionId, ...rest } = form;
    return {
      ...rest,
      region:
        kind === "blanka" ? regionRuFem(regionId) : regionRu(regionId),
    };
  }

  async function downloadDoc(kind: "doverennost" | "blanka") {
    if (!validateForm()) return;

    setLoading(kind);
    setError("");
    try {
      const slug = [form.lastName, form.firstName]
        .filter(Boolean)
        .join("_")
        .replace(/[^\p{L}\p{N}_]+/gu, "");
      const endpoint =
        kind === "blanka"
          ? `/admin/drivers/${driverId}/blanka/docx`
          : `/admin/drivers/${driverId}/doverennost/docx`;
      const prefix = kind === "blanka" ? "Blanka" : "Doverennost";
      await downloadFile(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(buildPayload(kind)),
        },
        `${prefix}_${slug || "hujjat"}.docx`,
      );
      setToast(t("drivers.downloadStarted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(null);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await downloadDoc("doverennost");
  }

  if (booting) return <LoadingScreen variant="page" />;

  return (
    <div className="animate-rise mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">
          {t("nav.doverennost")}
        </h2>
        <p className="mt-2 text-muted">{t("doverennost.pageHint")}</p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-3xl border border-line bg-paper p-5 shadow-sm md:p-6"
      >
        {error ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <Field icon={<UserRound className="h-4 w-4" />} label={t("doverennost.selectDriver")} required>
          <SearchSelect
            value={driverId}
            onChange={onSelectDriver}
            options={options}
            placeholder={t("doverennost.selectDriverPlaceholder")}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field icon={<UserRound className="h-4 w-4" />} label={t("doverennost.lastName")} required>
            <input
              className="input-field"
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  lastName: formatPersonName(e.target.value),
                }))
              }
              placeholder={t("doverennost.lastNamePlaceholder")}
            />
          </Field>
          <Field icon={<UserRound className="h-4 w-4" />} label={t("doverennost.firstName")} required>
            <input
              className="input-field"
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  firstName: formatPersonName(e.target.value),
                }))
              }
              placeholder={t("doverennost.firstNamePlaceholder")}
            />
          </Field>
          <Field icon={<UserRound className="h-4 w-4" />} label={t("doverennost.patronymic")}>
            <input
              className="input-field"
              value={form.patronymic}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  patronymic: formatPersonName(e.target.value),
                }))
              }
              placeholder={t("doverennost.patronymicPlaceholder")}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={<IdCard className="h-4 w-4" />} label={t("drivers.passportFull")} required>
            <input
              className="input-field"
              placeholder="AA 1234567"
              value={form.passport}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  passport: formatPassportMask(e.target.value),
                }))
              }
            />
          </Field>
          <Field icon={<MapPin className="h-4 w-4" />} label={t("doverennost.region")} required>
            <Select
              value={form.regionId}
              onChange={(v) => setForm((f) => ({ ...f, regionId: v }))}
              options={regionOptions}
              placeholder={t("doverennost.regionPlaceholder")}
            />
          </Field>
        </div>

          <Field icon={<IdCard className="h-4 w-4" />} label={t("doverennost.passportIssued")}>
            <DatePicker
              allowManual
              value={form.passportIssued}
              onChange={(v) => setForm((f) => ({ ...f, passportIssued: v }))}
              placeholder="dd.mm.yyyy"
            />
          </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={<IdCard className="h-4 w-4" />} label={t("resource.startDate")} required>
            <DatePicker
              value={form.startDate}
              onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
            />
          </Field>
          <Field icon={<IdCard className="h-4 w-4" />} label={t("resource.endDate")} required>
            <DatePicker
              value={form.endDate}
              onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={Boolean(loading)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d3fd1] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
          >
            <ScrollText className="h-4 w-4" />
            {loading === "doverennost"
              ? t("common.loading")
              : t("doverennost.download")}
          </button>
          <button
            type="button"
            disabled={Boolean(loading)}
            onClick={() => void downloadDoc("blanka")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60 dark:bg-steel sm:w-auto"
          >
            <FileType2 className="h-4 w-4" />
            {loading === "blanka" ? t("common.loading") : t("doverennost.downloadBlanka")}
          </button>
        </div>
      </form>

      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
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
