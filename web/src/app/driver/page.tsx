"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  LogOut,
  Send,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";
import {
  api,
  clearSession,
  downloadFile,
  hydrateUser,
  isServerUnavailable,
  type AuthUser,
} from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { LanguageSwitcher, useLocale, useT } from "@/i18n";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingScreen } from "@/components/loading-screen";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";

type DocKind = "putyovka" | "tir" | "dazvol" | "license" | "rental";

type PortalData = {
  driver: {
    id: string;
    fullName: string;
    phone: string;
    vehicle: string | null;
    plateNumber: string | null;
    passportSeries?: string | null;
  };
  totalDebt: number;
  telegram: {
    linked: boolean;
    linkedAt: string | null;
  };
  expiringSoon: Array<{
    id: string;
    kind: DocKind;
    endDate: string | null;
    daysLeft: number | null;
    debt: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    documentKind: DocKind | string;
    documentId: string;
    note: string | null;
    createdAt: string;
  }>;
  documents: {
    putyovkas: Doc[];
    tirs: Doc[];
    dazvols: Doc[];
    licenses: Doc[];
    rentals: Doc[];
  };
};

type Doc = {
  id: string;
  price: number;
  paid: number;
  debt: number;
  status: string;
  endDate: string | null;
  daysLeft: number | null;
  trailerNo?: string | null;
  tirNumber?: string | null;
  country?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
  startDate?: string | null;
};

function kindLabel(t: (key: string) => string, kind: string) {
  const map: Record<string, string> = {
    putyovka: t("driverPortal.putyovka"),
    tir: t("driverPortal.tir"),
    dazvol: t("driverPortal.dazvol"),
    license: t("driverPortal.license"),
    rental: t("driverPortal.rental"),
  };
  return map[kind] || kind;
}

export default function DriverPortalPage() {
  const router = useRouter();
  const t = useT();
  const { dateLocale } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [doverennostOpen, setDoverennostOpen] = useState(false);
  const [doverennostFormat, setDoverennostFormat] = useState<"pdf" | "docx">(
    "docx",
  );
  const [doverennostForm, setDoverennostForm] = useState({
    passport: "",
    startDate: "",
    endDate: "",
  });
  const [doverennostError, setDoverennostError] = useState("");
  const [doverennostLoading, setDoverennostLoading] = useState(false);

  useEffect(() => {
    hydrateUser()
      .then((u) => {
        if (u.role !== "DRIVER") {
          router.replace("/admin");
          return;
        }
        setUser(u);
        return api<PortalData>("/driver/portal");
      })
      .then((portal) => {
        if (portal) {
          setData(portal);
          setDoverennostForm((prev) => ({
            ...prev,
            passport: portal.driver.passportSeries || "",
          }));
        }
      })
      .catch((e) => {
        if (isServerUnavailable(e)) return;
        setError(e instanceof Error ? e.message : t("common.error"));
        router.replace("/");
      });
  }, [router, t]);

  async function logout() {
    await clearSession();
    router.replace("/");
  }

  async function refreshPortal() {
    const portal = await api<PortalData>("/driver/portal");
    setData(portal);
  }

  async function linkTelegram() {
    setTelegramLoading(true);
    try {
      const link = await api<{ url: string; linked: boolean }>(
        "/driver/telegram-link",
      );
      window.open(link.url, "_blank", "noopener,noreferrer");
      setTimeout(() => {
        void refreshPortal().catch(() => undefined);
      }, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setTelegramLoading(false);
    }
  }

  async function downloadBlanka(format: "pdf" | "docx") {
    const key = `blanka-${format}`;
    setDownloadBusy(key);
    try {
      await downloadFile(
        format === "pdf" ? "/driver/blanka" : "/driver/blanka/docx",
        {},
        format === "pdf" ? "blanka.pdf" : "blanka.docx",
      );
      setToast(t("drivers.downloadStarted"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("driverPortal.downloadError"));
    } finally {
      setDownloadBusy(null);
    }
  }

  function openDoverennost(format: "pdf" | "docx") {
    setDoverennostFormat(format);
    setDoverennostError("");
    setDoverennostOpen(true);
  }

  async function submitDoverennost(e: FormEvent) {
    e.preventDefault();
    setDoverennostLoading(true);
    setDoverennostError("");
    try {
      await downloadFile(
        doverennostFormat === "pdf"
          ? "/driver/doverennost"
          : "/driver/doverennost/docx",
        {
          method: "POST",
          body: JSON.stringify(doverennostForm),
        },
        doverennostFormat === "pdf" ? "doverennost.pdf" : "doverennost.docx",
      );
      setDoverennostOpen(false);
      setToast(t("drivers.downloadStarted"));
    } catch (err) {
      setDoverennostError(
        err instanceof Error ? err.message : t("driverPortal.downloadError"),
      );
    } finally {
      setDoverennostLoading(false);
    }
  }

  if (!user) {
    return <LoadingScreen variant="atmosphere" />;
  }

  if (!data && !error) {
    return <LoadingScreen variant="atmosphere" label={t("common.pleaseWait")} />;
  }

  return (
    <main className="min-h-screen bg-atmosphere text-white">
      <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <header className="animate-rise flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <BrandLogo size={48} priority />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                {t("common.brand")}
              </p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
                {data?.driver.fullName || user.name}
              </h1>
              <p className="mt-2 text-sm text-white/65">
                {data?.driver.phone || user.phone}
                {data?.driver.vehicle ? ` · ${data.driver.vehicle}` : ""}
                {data?.driver.plateNumber ? ` · ${data.driver.plateNumber}` : ""}
              </p>
            </div>
          </div>
          <LanguageSwitcher variant="dark" />
        </header>

        <section className="animate-rise-delay mt-8 rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {t("driverPortal.totalDebt")}
          </p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-[#f0c15a]">
            {formatMoney(data?.totalDebt || 0, dateLocale)}{" "}
            <span className="text-base font-semibold text-white/60">
              {t("common.sum")}
            </span>
          </p>
          <a
            href="tel:+998900000000"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-mist"
          >
            <Phone className="h-4 w-4" />
            {t("driverPortal.contact")}
          </a>
        </section>

        <section className="animate-rise-delay mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">{t("driverPortal.telegramTitle")}</h2>
              <p className="mt-1 text-sm text-white/55">
                {t("driverPortal.telegramHint")}
              </p>
            </div>
            {data?.telegram.linked ? (
              <span className="rounded-full bg-ok/25 px-2.5 py-1 text-[11px] font-bold text-[#7ddeb3]">
                {t("driverPortal.telegramLinked")}
              </span>
            ) : (
              <button
                type="button"
                onClick={linkTelegram}
                disabled={telegramLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2AABEE] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1e9ad8] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {telegramLoading
                  ? t("driverPortal.telegramLinking")
                  : t("driverPortal.telegramLink")}
              </button>
            )}
          </div>
        </section>

        {error ? (
          <p className="mt-6 rounded-xl bg-danger/20 px-4 py-3 text-sm text-[#ffb4b4]">
            {error}
          </p>
        ) : null}

        <section className="animate-rise-delay-2 mt-8 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#f0c15a]" />
            <h2 className="text-xl font-bold tracking-tight">
              {t("driverPortal.expiringSoon")}
            </h2>
          </div>
          {!data?.expiringSoon?.length ? (
            <p className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/45">
              {t("driverPortal.noExpiring")}
            </p>
          ) : (
            <div className="space-y-2">
              {data.expiringSoon.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#c8891a]/30 bg-[#c8891a]/15 px-4 py-3"
                >
                  <div>
                    <p className="font-bold">{kindLabel(t, item.kind)}</p>
                    {item.endDate ? (
                      <p className="mt-0.5 text-xs text-white/60">
                        {new Date(item.endDate).toLocaleDateString(dateLocale)}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-[#c8891a]/30 px-2.5 py-1 text-[11px] font-bold text-[#f0c15a]">
                    {t("driverPortal.daysLeftShort", {
                      n: item.daysLeft ?? 0,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="animate-rise-delay-2 mt-8 space-y-3">
          <h2 className="text-xl font-bold tracking-tight">
            {t("driverPortal.paymentHistory")}
          </h2>
          {!data?.payments?.length ? (
            <p className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/45">
              {t("driverPortal.noPayments")}
            </p>
          ) : (
            <div className="space-y-2">
              {data.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      {kindLabel(t, payment.documentKind)}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {new Date(payment.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <p className="font-bold text-[#7ddeb3]">
                    {t("driverPortal.paymentAmount", {
                      amount: formatMoney(payment.amount, dateLocale),
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="animate-rise-delay-2 mt-8 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-white/70" />
            <h2 className="text-xl font-bold tracking-tight">
              {t("driverPortal.documentsDownload")}
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <DownloadButton
              label={t("driverPortal.blankaPdf")}
              loading={downloadBusy === "blanka-pdf"}
              onClick={() => downloadBlanka("pdf")}
            />
            <DownloadButton
              label={t("driverPortal.blankaDocx")}
              loading={downloadBusy === "blanka-docx"}
              onClick={() => downloadBlanka("docx")}
            />
            <DownloadButton
              label={t("driverPortal.doverennostPdf")}
              loading={false}
              onClick={() => openDoverennost("pdf")}
            />
            <DownloadButton
              label={t("driverPortal.doverennostDocx")}
              loading={false}
              onClick={() => openDoverennost("docx")}
            />
          </div>
        </section>

        <section className="animate-rise-delay-2 mt-8 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">
            {t("driverPortal.myDocs")}
          </h2>
          <DocBlock
            title={t("driverPortal.putyovka")}
            items={data?.documents.putyovkas || []}
            empty={t("driverPortal.noPutyovka")}
          />
          <DocBlock
            title={t("driverPortal.tir")}
            items={data?.documents.tirs || []}
            empty={t("driverPortal.noTir")}
          />
          <DocBlock
            title={t("driverPortal.dazvol")}
            items={data?.documents.dazvols || []}
            empty={t("driverPortal.noDazvol")}
          />
          <DocBlock
            title={t("driverPortal.license")}
            items={data?.documents.licenses || []}
            empty={t("driverPortal.noLicense")}
          />
          <DocBlock
            title={t("driverPortal.rental")}
            items={data?.documents.rentals || []}
            empty={t("driverPortal.noRental")}
          />
        </section>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80"
          >
            <LogOut className="h-4 w-4" />
            {t("common.logout")}
          </button>
          <p className="text-center text-xs text-white/35">
            {t("common.footer", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      <Modal
        open={doverennostOpen}
        onClose={() => setDoverennostOpen(false)}
        title={t("drivers.doverennostTitle")}
        subtitle={t("driverPortal.doverennostSubtitle")}
        footer={
          <button
            type="submit"
            form="driver-doverennost-form"
            disabled={doverennostLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {doverennostLoading ? t("common.loading") : t("drivers.download")}
          </button>
        }
      >
        <form
          id="driver-doverennost-form"
          onSubmit={submitDoverennost}
          className="space-y-4"
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink">
              {t("drivers.passport")}
            </span>
            <input
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel"
              value={doverennostForm.passport}
              onChange={(e) =>
                setDoverennostForm((f) => ({ ...f, passport: e.target.value }))
              }
              placeholder={t("drivers.passportFull")}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">
                {t("resource.startDate")}
              </span>
              <input
                type="date"
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel"
                value={doverennostForm.startDate}
                onChange={(e) =>
                  setDoverennostForm((f) => ({
                    ...f,
                    startDate: e.target.value,
                  }))
                }
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">
                {t("resource.endDate")}
              </span>
              <input
                type="date"
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel"
                value={doverennostForm.endDate}
                onChange={(e) =>
                  setDoverennostForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </label>
          </div>
          {doverennostError ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {doverennostError}
            </p>
          ) : null}
        </form>
      </Modal>

      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
    </main>
  );
}

function DownloadButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
    >
      <Download className="h-4 w-4" />
      {loading ? "..." : label}
    </button>
  );
}

function DocBlock({
  title,
  items,
  empty,
}: {
  title: string;
  items: Doc[];
  empty: string;
}) {
  const t = useT();
  const { dateLocale } = useLocale();

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            items.length
              ? items.some((i) => i.debt > 0)
                ? "bg-[#c8891a]/25 text-[#f0c15a]"
                : "bg-ok/25 text-[#7ddeb3]"
              : "bg-white/10 text-white/55"
          }`}
        >
          {items.length
            ? items.some((i) => i.debt > 0)
              ? t("driverPortal.withDebt")
              : t("driverPortal.ok")
            : t("driverPortal.none")}
        </span>
      </div>
      {!items.length ? (
        <p className="text-sm text-white/45">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-black/20 px-4 py-3 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/75">
                <span>
                  {t("driverPortal.price", {
                    amount: formatMoney(item.price, dateLocale),
                  })}
                </span>
                <span className="text-[#f0c15a]">
                  {t("driverPortal.debt", {
                    amount: formatMoney(item.debt, dateLocale),
                  })}
                </span>
              </div>
              {item.daysLeft !== null ? (
                <p className="mt-2 text-xs font-semibold text-white/55">
                  {item.daysLeft >= 0
                    ? t("driverPortal.daysLeft", { n: item.daysLeft })
                    : t("driverPortal.expired")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
