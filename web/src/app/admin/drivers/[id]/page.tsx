"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Send,
  FileText,
  Truck,
  Stamp,
  Shield,
  FileType2,
  ScrollText,
  Plus,
  Download,
  DollarSign,
  Check,
  Trash2,
} from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import {
  cn,
  formatMoney,
  formatMoneyMask,
  parseMoneyInput,
} from "@/lib/utils";
import { UZ_REGIONS, regionRu, regionRuFem } from "@/lib/regions";
import { LoadingScreen } from "@/components/loading-screen";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { DriverDocFormModal } from "@/components/driver-doc-form-modal";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { DRIVER_DOC_CONFIGS } from "@/lib/driver-doc-config";
import { useLocale, useT } from "@/i18n";

type DocBase = {
  id: string;
  price: number;
  paid: number;
  debt: number;
  status: string;
  endDate: string | null;
  startDate?: string | null;
  months?: number | null;
  trailerNo?: string | null;
  code?: string | null;
  tirNumber?: string | null;
  country?: string | null;
  dazvolNumber?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
};

type DriverDetail = {
  id: string;
  fullName: string;
  phone: string;
  vehicle: string | null;
  plateNumber: string | null;
  trailer: string | null;
  trailerNo: string | null;
  passportSeries: string | null;
  telegramChatId: string | null;
  telegramLinkedAt: string | null;
  putyovkas: DocBase[];
  tirs: DocBase[];
  dazvols: DocBase[];
  licenses: DocBase[];
  rentals: DocBase[];
};

type DocKind = "putyovka" | "tir" | "dazvol" | "litsenziya" | "ijara";

type EditDoc = { type: DocKind; item: DocBase } | null;
type PaymentDoc = { type: DocKind; item: DocBase } | null;

const EDIT_TITLE_KEYS: Record<DocKind, string> = {
  putyovka: "putyovkas.editTitle",
  tir: "tirs.editTitle",
  dazvol: "dazvols.editTitle",
  litsenziya: "licenses.editTitle",
  ijara: "rentals.editTitle",
};

const PAYMENT_TITLE_KEYS: Record<DocKind, string> = {
  putyovka: "putyovkas.paymentTitle",
  tir: "tirs.paymentTitle",
  dazvol: "dazvols.paymentTitle",
  litsenziya: "licenses.paymentTitle",
  ijara: "rentals.paymentTitle",
};

const DELETE_KINDS: Record<DocKind, string> = {
  putyovka: "putyovka",
  tir: "tir",
  dazvol: "dazvol",
  litsenziya: "license",
  ijara: "rental",
};

function isoToday(offsetYears = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function docStatusLabel(
  doc: DocBase,
  t: (key: string) => string,
): { label: string; tone: string } {
  if (doc.status === "FINISHED") {
    return { label: t("putyovkas.statusFinished"), tone: "bg-mist text-muted" };
  }
  if (doc.debt > 0) {
    return { label: t("putyovkas.statusDebtor"), tone: "bg-signal/12 text-signal" };
  }
  return { label: t("putyovkas.statusActive"), tone: "bg-ok/12 text-ok" };
}

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useT();
  const { dateLocale } = useLocale();
  const [data, setData] = useState<DriverDetail | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  const [addType, setAddType] = useState<DocKind | null>(null);
  const [editDoc, setEditDoc] = useState<EditDoc>(null);
  const [paymentDoc, setPaymentDoc] = useState<PaymentDoc>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [deleteDoc, setDeleteDoc] = useState<{ kind: string; id: string } | null>(null);

  const [dovOpen, setDovOpen] = useState(false);
  const [dovKind, setDovKind] = useState<"doverennost" | "blanka">("doverennost");
  const [dovForm, setDovForm] = useState({
    lastName: "",
    firstName: "",
    patronymic: "",
    passport: "",
    passportIssued: "",
    regionId: "",
    startDate: "",
    endDate: "",
  });
  const [dovLoading, setDovLoading] = useState(false);

  const regionOptions = useMemo(
    () =>
      UZ_REGIONS.map((r) => ({
        value: r.id,
        label: t(`regions.${r.id}`),
      })),
    [t],
  );

  const load = useCallback(async () => {
    if (!params.id) return;
    const d = await api<DriverDetail>(`/admin/drivers/${params.id}`);
    setData(d);
  }, [params.id]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : t("common.error")));
  }, [load, t]);

  const totalDebt = useMemo(() => {
    if (!data) return 0;
    const all = [
      ...data.putyovkas,
      ...data.tirs,
      ...data.dazvols,
      ...data.licenses,
      ...data.rentals,
    ];
    return all.reduce((s, d) => s + d.debt, 0);
  }, [data]);

  const initial = data?.fullName?.charAt(0)?.toUpperCase() || "?";

  function showToast(message: string, variant: "success" | "error" = "success") {
    setToastVariant(variant);
    setToast(message);
  }

  function openPayment(type: DocKind, doc: DocBase) {
    setPaymentError("");
    setPaymentAmount(doc.debt > 0 ? doc.debt : 0);
    setPaymentDoc({ type, item: doc });
  }

  function docRowActions(type: DocKind, doc: DocBase): ActionItem[] {
    return [
      {
        id: "payment",
        label: t("putyovkas.payment"),
        icon: <DollarSign className="h-4 w-4" />,
        onClick: () => openPayment(type, doc),
        tone: "accent",
      },
      {
        id: "edit",
        label: t("common.edit"),
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => setEditDoc({ type, item: doc }),
        tone: "accent",
        divider: true,
      },
      {
        id: "delete",
        label: t("common.delete"),
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => setDeleteDoc({ kind: DELETE_KINDS[type], id: doc.id }),
        tone: "danger",
        divider: true,
      },
    ];
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    if (!paymentDoc) return;
    if (paymentAmount <= 0) {
      setPaymentError(t("putyovkas.paymentAmountRequired"));
      return;
    }
    if (paymentAmount > paymentDoc.item.debt) {
      setPaymentError(t("putyovkas.paymentAmountTooHigh"));
      return;
    }
    const endpoint = DRIVER_DOC_CONFIGS[paymentDoc.type]?.endpoint;
    if (!endpoint) return;

    setPaymentLoading(true);
    setPaymentError("");
    try {
      await api(`${endpoint}/${paymentDoc.item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          paid: paymentDoc.item.paid + paymentAmount,
        }),
      });
      setPaymentDoc(null);
      await load();
      showToast(
        t("putyovkas.paymentSuccess", {
          amount: formatMoney(paymentAmount, dateLocale),
          name: data?.fullName || "",
        }),
      );
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : t("common.saveError"),
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  async function downloadBlanka() {
    openPassportDoc("blanka");
  }

  function openPassportDoc(kind: "doverennost" | "blanka") {
    if (!data) return;
    const parts = data.fullName.trim().split(/\s+/).filter(Boolean);
    setDovKind(kind);
    setDovForm({
      lastName: parts[0] || "",
      firstName: parts[1] || "",
      patronymic: parts.slice(2).join(" ") || "",
      passport: data.passportSeries || "",
      passportIssued: "",
      regionId: "",
      startDate: isoToday(0),
      endDate: isoToday(2),
    });
    setDovOpen(true);
  }

  function openDoverennost() {
    openPassportDoc("doverennost");
  }

  async function submitDoverennost(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (!dovForm.regionId) {
      showToast(t("doverennost.regionRequired"), "error");
      return;
    }
    if (!dovForm.startDate || !dovForm.endDate) {
      showToast(t("doverennost.periodRequired"), "error");
      return;
    }
    setDovLoading(true);
    try {
      const { regionId, ...rest } = dovForm;
      const endpoint =
        dovKind === "blanka"
          ? `/admin/drivers/${data.id}/blanka/docx`
          : `/admin/drivers/${data.id}/doverennost/docx`;
      await downloadFile(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            ...rest,
            region:
              dovKind === "blanka"
                ? regionRuFem(regionId)
                : regionRu(regionId),
          }),
        },
        dovKind === "blanka" ? "blanka.docx" : "doverennost.docx",
      );
      setDovOpen(false);
      showToast(t("drivers.downloadStarted"));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"), "error");
    } finally {
      setDovLoading(false);
    }
  }

  async function confirmDeleteDoc() {
    if (!deleteDoc) return;
    const endpoints: Record<string, string> = {
      putyovka: "putyovkalar",
      tir: "tirlar",
      dazvol: "dazvollar",
      license: "litsenziyalar",
      rental: "ijara",
    };
    const ep = endpoints[deleteDoc.kind];
    if (!ep) return;
    await api(`/admin/${ep}/${deleteDoc.id}`, { method: "DELETE" });
    setDeleteDoc(null);
    await load();
    showToast(t("common.deleteSuccess"));
  }

  if (error && !data) {
    return <p className="text-danger">{error}</p>;
  }
  if (!data) {
    return <LoadingScreen variant="panel" />;
  }

  const vehicleLine = [data.vehicle, data.plateNumber ? `№ ${data.plateNumber}` : ""]
    .filter(Boolean)
    .join(" ");
  const trailerLine = [data.trailer, data.trailerNo ? `№ ${data.trailerNo}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">{data.fullName}</h2>
          <p className="mt-1 text-muted">
            {data.phone}
            {vehicleLine ? ` · ${vehicleLine}` : ""}
            {trailerLine ? ` · ${trailerLine}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/drivers/${data.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white dark:bg-steel shadow-lg transition hover:-translate-y-0.5"
          >
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Link>
          <Link
            href={`/admin/telegram?driverId=${data.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white dark:bg-steel shadow-lg transition hover:-translate-y-0.5"
          >
            <Send className="h-4 w-4" />
            {t("drivers.sendTelegram")}
          </Link>
          <Link
            href="/admin/drivers"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-mist"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-3xl border border-line bg-paper p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-ink text-3xl font-extrabold text-white dark:bg-steel">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-extrabold text-ink">{data.fullName}</p>
              <p className="mt-1 text-muted">{data.phone}</p>
              {data.passportSeries ? (
                <p className="mt-1 text-sm text-muted">{data.passportSeries}</p>
              ) : null}
            </div>
            <div
              className={cn(
                "shrink-0 rounded-2xl px-4 py-3",
                totalDebt > 0 ? "bg-signal/10" : "bg-ok/10",
              )}
            >
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  totalDebt > 0 ? "text-signal/80" : "text-ok/80",
                )}
              >
                {t("drivers.totalDebt")}
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-extrabold whitespace-nowrap",
                  totalDebt > 0 ? "text-signal" : "text-ok",
                )}
              >
                {formatMoney(totalDebt, dateLocale)} {t("common.sum")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon={<FileText className="h-4 w-4" />}
            label={t("nav.putyovkas")}
            value={t("drivers.docsAvailable", { n: data.putyovkas.length })}
            accent="signal"
            onClick={() => setAddType("putyovka")}
          />
          <SummaryCard
            icon={<Truck className="h-4 w-4" />}
            label={t("nav.tirs")}
            value={t("drivers.docsAvailable", { n: data.tirs.length })}
            accent="steel"
            onClick={() => setAddType("tir")}
          />
          <SummaryCard
            icon={<Stamp className="h-4 w-4" />}
            label={t("nav.dazvols")}
            value={t("drivers.docsAvailable", { n: data.dazvols.length })}
            accent="ink"
            onClick={() => setAddType("dazvol")}
          />
          <SummaryCard
            icon={<FileType2 className="h-4 w-4" />}
            label={t("drivers.blanka")}
            value={t("drivers.downloadDocx")}
            accent="steel"
            onClick={downloadBlanka}
          />
          <SummaryCard
            icon={<ScrollText className="h-4 w-4" />}
            label={t("drivers.doverennost")}
            value={t("drivers.downloadDocx")}
            accent="ink"
            onClick={openDoverennost}
          />
          <SummaryCard
            icon={<Shield className="h-4 w-4" />}
            label={t("nav.licenses")}
            value={t("drivers.docsAvailable", { n: data.licenses.length })}
            accent="ok"
            onClick={() => setAddType("litsenziya")}
          />
        </div>
      </section>

      <DocTable
        title={t("nav.putyovkas")}
        onAdd={() => setAddType("putyovka")}
        columns={[
          { key: "num", label: t("putyovkas.trailerNo") },
          { key: "price", label: t("resource.price") },
          { key: "debt", label: t("resource.debt") },
          { key: "months", label: t("resource.months") },
          { key: "status", label: t("resource.status") },
        ]}
        items={data.putyovkas}
        renderRow={(doc) => {
          const st = docStatusLabel(doc, t);
          return (
            <>
              <td className="px-4 py-3">{doc.trailerNo || doc.code || "—"}</td>
              <td className="px-4 py-3 font-semibold text-ok">
                {formatMoney(doc.price, dateLocale)}
              </td>
              <td className="px-4 py-3 font-semibold text-signal">
                {formatMoney(doc.debt, dateLocale)}
              </td>
              <td className="px-4 py-3">
                {doc.months != null ? t("putyovkas.monthsShort", { n: doc.months }) : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold", st.tone)}>
                  {st.label}
                </span>
              </td>
              <td className="w-28 px-6 py-3">
                <div className="flex justify-center">
                  <ActionMenu
                    items={docRowActions("putyovka", doc)}
                    label={t("common.action")}
                    align="end"
                  />
                </div>
              </td>
            </>
          );
        }}
        t={t}
      />

      <DocTable
        title={t("nav.tirs")}
        onAdd={() => setAddType("tir")}
        columns={[
          { key: "num", label: t("tirs.tirNumber") },
          { key: "price", label: t("resource.price") },
          { key: "debt", label: t("resource.debt") },
          { key: "months", label: t("resource.months") },
          { key: "status", label: t("resource.status") },
        ]}
        items={data.tirs}
        renderRow={(doc) => {
          const st = docStatusLabel(doc, t);
          return (
            <>
              <td className="px-4 py-3">{doc.tirNumber || "—"}</td>
              <td className="px-4 py-3 font-semibold">{formatMoney(doc.price, dateLocale)}</td>
              <td className="px-4 py-3 font-semibold text-signal">
                {formatMoney(doc.debt, dateLocale)}
              </td>
              <td className="px-4 py-3">
                {doc.months != null ? t("putyovkas.monthsShort", { n: doc.months }) : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold", st.tone)}>
                  {st.label}
                </span>
              </td>
              <td className="w-28 px-6 py-3">
                <div className="flex justify-center">
                  <ActionMenu
                    items={docRowActions("tir", doc)}
                    label={t("common.action")}
                    align="end"
                  />
                </div>
              </td>
            </>
          );
        }}
        t={t}
      />

      <DocTable
        title={t("nav.dazvols")}
        onAdd={() => setAddType("dazvol")}
        columns={[
          { key: "country", label: t("dazvols.country") },
          { key: "price", label: t("resource.price") },
          { key: "debt", label: t("resource.debt") },
          { key: "end", label: t("resource.endDate") },
          { key: "status", label: t("resource.status") },
        ]}
        items={data.dazvols}
        renderRow={(doc) => {
          const st = docStatusLabel(doc, t);
          return (
            <>
              <td className="px-4 py-3">
                {doc.country || doc.dazvolNumber || "—"}
              </td>
              <td className="px-4 py-3 font-semibold">{formatMoney(doc.price, dateLocale)}</td>
              <td className="px-4 py-3 font-semibold text-signal">
                {formatMoney(doc.debt, dateLocale)}
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(doc.endDate, dateLocale)}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold", st.tone)}>
                  {st.label}
                </span>
              </td>
              <td className="w-28 px-6 py-3">
                <div className="flex justify-center">
                  <ActionMenu
                    items={docRowActions("dazvol", doc)}
                    label={t("common.action")}
                    align="end"
                  />
                </div>
              </td>
            </>
          );
        }}
        t={t}
      />

      <DocTable
        title={t("nav.licenses")}
        onAdd={() => setAddType("litsenziya")}
        columns={[
          { key: "num", label: t("licenses.licenseNumber") },
          { key: "price", label: t("resource.price") },
          { key: "debt", label: t("resource.debt") },
          { key: "end", label: t("resource.endDate") },
          { key: "status", label: t("resource.status") },
        ]}
        items={data.licenses}
        renderRow={(doc) => {
          const st = docStatusLabel(doc, t);
          return (
            <>
              <td className="px-4 py-3">{doc.licenseNumber || "—"}</td>
              <td className="px-4 py-3 font-semibold">{formatMoney(doc.price, dateLocale)}</td>
              <td className="px-4 py-3 font-semibold text-signal">
                {formatMoney(doc.debt, dateLocale)}
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(doc.endDate, dateLocale)}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold", st.tone)}>
                  {st.label}
                </span>
              </td>
              <td className="w-28 px-6 py-3">
                <div className="flex justify-center">
                  <ActionMenu
                    items={docRowActions("litsenziya", doc)}
                    label={t("common.action")}
                    align="end"
                  />
                </div>
              </td>
            </>
          );
        }}
        t={t}
      />

      <DocTable
        title={t("nav.rentals")}
        onAdd={() => setAddType("ijara")}
        columns={[
          { key: "addr", label: t("rentals.address") },
          { key: "price", label: t("resource.price") },
          { key: "debt", label: t("resource.debt") },
          { key: "end", label: t("resource.endDate") },
          { key: "status", label: t("resource.status") },
        ]}
        items={data.rentals}
        renderRow={(doc) => {
          const st = docStatusLabel(doc, t);
          return (
            <>
              <td className="px-4 py-3">{doc.address || "—"}</td>
              <td className="px-4 py-3 font-semibold">{formatMoney(doc.price, dateLocale)}</td>
              <td className="px-4 py-3 font-semibold text-signal">
                {formatMoney(doc.debt, dateLocale)}
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(doc.endDate, dateLocale)}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold", st.tone)}>
                  {st.label}
                </span>
              </td>
              <td className="w-28 px-6 py-3">
                <div className="flex justify-center">
                  <ActionMenu
                    items={docRowActions("ijara", doc)}
                    label={t("common.action")}
                    align="end"
                  />
                </div>
              </td>
            </>
          );
        }}
        t={t}
      />

      <DriverDocFormModal
        open={Boolean(addType)}
        type={addType}
        driverId={data.id}
        driverName={data.fullName}
        onClose={() => setAddType(null)}
        onSaved={() => {
          load().catch(() => undefined);
          showToast(t("common.saved"));
        }}
      />

      <DriverDocFormModal
        open={Boolean(editDoc)}
        type={editDoc?.type ?? null}
        driverId={data.id}
        driverName={data.fullName}
        editItem={editDoc ? { ...editDoc.item } : null}
        editTitleKey={editDoc ? EDIT_TITLE_KEYS[editDoc.type] : undefined}
        onClose={() => setEditDoc(null)}
        onSaved={() => {
          load().catch(() => undefined);
          showToast(t("common.saved"));
        }}
      />

      <Modal
        open={Boolean(paymentDoc)}
        onClose={() => setPaymentDoc(null)}
        title={t(
          paymentDoc
            ? PAYMENT_TITLE_KEYS[paymentDoc.type]
            : "putyovkas.paymentTitle",
          { name: data.fullName },
        )}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPaymentDoc(null)}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
            >
              {t("common.cancelFull")}
            </button>
            <button
              form="driver-doc-payment"
              type="submit"
              disabled={paymentLoading || paymentAmount <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ok px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {paymentLoading
                ? t("common.saving")
                : t("putyovkas.acceptPayment")}
            </button>
          </div>
        }
      >
        {paymentDoc ? (
          <form
            id="driver-doc-payment"
            onSubmit={submitPayment}
            className="space-y-4"
          >
            {paymentError ? (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {paymentError}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-mist-2 p-4">
              <PaymentStat
                label={t("resource.price")}
                value={formatMoney(paymentDoc.item.price, dateLocale)}
              />
              <PaymentStat
                label={t("resource.paid")}
                value={formatMoney(paymentDoc.item.paid, dateLocale)}
                tone="text-ok"
              />
              <PaymentStat
                label={t("resource.debt")}
                value={formatMoney(paymentDoc.item.debt, dateLocale)}
                tone="text-signal"
              />
            </div>

            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <DollarSign className="h-4 w-4 text-ok" />
                {t("expenses.amount")}
              </span>
              <div className="relative">
                <input
                  className="input-field pr-14"
                  inputMode="numeric"
                  required
                  value={
                    paymentAmount ? formatMoneyMask(paymentAmount) : ""
                  }
                  onChange={(e) =>
                    setPaymentAmount(parseMoneyInput(e.target.value))
                  }
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
                  {t("common.sum")}
                </span>
              </div>
            </label>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={dovOpen}
        onClose={() => setDovOpen(false)}
        title={
          dovKind === "blanka"
            ? t("drivers.blankaTitle")
            : t("drivers.doverennostTitle")
        }
        subtitle={data.fullName}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDovOpen(false)}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
            >
              {t("common.cancelFull")}
            </button>
            <button
              form="doverennost-docx-form"
              type="submit"
              disabled={dovLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-2.5 text-sm font-bold text-white dark:bg-steel shadow-lg transition hover:brightness-110 disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {dovLoading
                ? t("common.loading")
                : dovKind === "blanka"
                  ? t("doverennost.downloadBlanka")
                  : t("drivers.download")}
            </button>
          </div>
        }
      >
        <form id="doverennost-docx-form" onSubmit={submitDoverennost} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("doverennost.lastName")}
              </span>
              <input
                className="input-field"
                value={dovForm.lastName}
                onChange={(e) => setDovForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </label>
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("doverennost.firstName")}
              </span>
              <input
                className="input-field"
                value={dovForm.firstName}
                onChange={(e) => setDovForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </label>
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("doverennost.patronymic")}
              </span>
              <input
                className="input-field"
                value={dovForm.patronymic}
                onChange={(e) => setDovForm((f) => ({ ...f, patronymic: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("drivers.passportFull")}
              </span>
              <input
                className="input-field"
                value={dovForm.passport}
                onChange={(e) => setDovForm((f) => ({ ...f, passport: e.target.value }))}
              />
            </label>
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("doverennost.region")}
              </span>
              <Select
                value={dovForm.regionId}
                onChange={(v) => setDovForm((f) => ({ ...f, regionId: v }))}
                options={regionOptions}
                placeholder={t("doverennost.regionPlaceholder")}
              />
            </label>
          </div>
          <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              {t("doverennost.passportIssued")}
            </span>
            <DatePicker
              allowManual
              value={dovForm.passportIssued}
              onChange={(v) => setDovForm((f) => ({ ...f, passportIssued: v }))}
              placeholder="dd.mm.yyyy"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("resource.startDate")}
              </span>
              <DatePicker
                value={dovForm.startDate}
                onChange={(v) => setDovForm((f) => ({ ...f, startDate: v }))}
              />
            </label>
            <label className="block rounded-2xl border border-line bg-mist-2/50 p-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                {t("resource.endDate")}
              </span>
              <DatePicker
                value={dovForm.endDate}
                onChange={(v) => setDovForm((f) => ({ ...f, endDate: v }))}
              />
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteDoc)}
        title={t("common.confirmDeleteTitle")}
        message={t("common.confirmDeleteMessage")}
        onCancel={() => setDeleteDoc(null)}
        onConfirm={() => {
          confirmDeleteDoc().catch((e) =>
            showToast(e instanceof Error ? e.message : t("common.deleteError"), "error"),
          );
        }}
      />

      <Toast
        open={Boolean(toast)}
        message={toast}
        variant={toastVariant}
        onClose={() => setToast("")}
      />
    </div>
  );
}

function PaymentStat({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={cn("mt-1 text-base font-extrabold", tone)}>{value}</p>
    </div>
  );
}

const ACCENT_STYLES = {
  signal: { icon: "bg-signal/12 text-signal", hover: "hover:border-signal/20" },
  steel: { icon: "bg-steel/12 text-steel", hover: "hover:border-steel/20" },
  ink: { icon: "bg-brand/8 text-ink", hover: "hover:border-brand/15" },
  ok: { icon: "bg-ok/12 text-ok", hover: "hover:border-ok/20" },
} as const;

function SummaryCard({
  icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: keyof typeof ACCENT_STYLES;
  onClick?: () => void;
}) {
  const styles = ACCENT_STYLES[accent];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-line bg-paper p-4 text-left shadow-sm transition",
        onClick && "cursor-pointer hover:shadow-md",
        onClick && styles.hover,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles.icon)}>
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      </div>
      <p className="mt-2.5 text-sm font-bold text-ink">{value}</p>
    </Tag>
  );
}

function DocTable<T extends { id: string }>({
  title,
  onAdd,
  columns,
  items,
  renderRow,
  t,
}: {
  title: string;
  onAdd: () => void;
  columns: { key: string; label: string }[];
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <section className="rounded-3xl border border-line bg-paper shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-mist"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("common.add")}
        </button>
      </div>
      {!items.length ? (
        <p className="px-5 py-8 text-sm text-muted">{t("drivers.none")}</p>
      ) : (
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th className="w-28 px-6 py-3 text-center font-semibold">
                  {t("common.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-line/70 hover:bg-mist-2/40">
                  {renderRow(item)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
