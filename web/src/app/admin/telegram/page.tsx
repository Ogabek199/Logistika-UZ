"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  RefreshCw,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatMoney } from "@/lib/utils";
import { SearchSelect } from "@/components/ui/search-select";
import { Toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/loading-screen";
import { useLocale, useT } from "@/i18n";

type DriverOption = {
  id: string;
  fullName: string;
  phone: string;
  plateNumber: string | null;
  totalDebt: number;
};

type TelegramLink = {
  url: string;
  linked: boolean;
  chatIdMasked: string | null;
  linkedAt: string | null;
};

function TelegramPageInner() {
  const t = useT();
  const { dateLocale } = useLocale();
  const searchParams = useSearchParams();
  const preselectId = searchParams.get("driverId") || "";

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [booting, setBooting] = useState(true);
  const [driverId, setDriverId] = useState(preselectId);
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [template, setTemplate] = useState<"debt" | "custom">("debt");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success",
  );
  const [sentCount, setSentCount] = useState(0);

  const selected = useMemo(
    () => drivers.find((d) => d.id === driverId) || null,
    [drivers, driverId],
  );

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

  const linked = Boolean(link?.linked);

  function showToast(msg: string, variant: "success" | "error" = "success") {
    setToastVariant(variant);
    setToast(msg);
  }

  const loadLink = useCallback(
    async (id: string, silent = false) => {
      if (!id) {
        setLink(null);
        return;
      }
      if (!silent) setLinkLoading(true);
      else setRefreshing(true);
      try {
        const data = await api<TelegramLink>(
          `/admin/drivers/${id}/telegram-link`,
        );
        setLink(data);
        if (!silent) setError("");
      } catch (err) {
        if (!silent) {
          setLink(null);
          setError(err instanceof Error ? err.message : t("common.error"));
        }
      } finally {
        setLinkLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    api<DriverOption[]>("/admin/drivers")
      .then((list) => {
        setDrivers(list);
        if (preselectId && list.some((d) => d.id === preselectId)) {
          setDriverId(preselectId);
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("common.error")),
      )
      .finally(() => setBooting(false));
  }, [preselectId, t]);

  useEffect(() => {
    if (!driverId) {
      setLink(null);
      setSentCount(0);
      setMessage("");
      setError("");
      return;
    }
    setSentCount(0);
    setMessage("");
    setTemplate("debt");
    void loadLink(driverId);
  }, [driverId, loadLink]);

  // Poll while waiting for driver to press Start
  useEffect(() => {
    if (!driverId || linked || linkLoading) return;
    const timer = window.setInterval(() => {
      void loadLink(driverId, true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [driverId, linked, linkLoading, loadLink]);

  function debtPreview() {
    if (!selected) return "";
    const now = new Date();
    const date = now.toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Tashkent",
    });
    const time = now.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tashkent",
    });
    return [
      "📢 OOO \"MUSFIRA SAVDO TRANS\"",
      `📅 ${date}  🕐 ${time}`,
      "",
      selected.fullName,
      selected.phone,
      `${t("drivers.totalDebt")}: ${formatMoney(selected.totalDebt, dateLocale)} ${t("common.sum")}`,
      "",
      "OOO \"MUSFIRA SAVDO TRANS\"",
    ].join("\n");
  }

  async function copyLink() {
    if (!link?.url) return;
    try {
      await navigator.clipboard.writeText(link.url);
      showToast(t("drivers.telegramLinkCopied"));
    } catch {
      showToast(t("common.error"), "error");
    }
  }

  async function submitMessage(e: FormEvent) {
    e.preventDefault();
    if (!driverId || !linked) return;
    setSending(true);
    setError("");
    try {
      await api(`/admin/drivers/${driverId}/telegram`, {
        method: "POST",
        body: JSON.stringify(
          template === "debt"
            ? { template: "debt" }
            : { template: "custom", message },
        ),
      });
      setSentCount((n) => n + 1);
      showToast(t("drivers.telegramSent"));
      if (template === "custom") setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSending(false);
    }
  }

  if (booting) return <LoadingScreen variant="page" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">
          {t("telegram.pageTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("telegram.pageHint")}</p>
      </div>

      <section className="rounded-3xl border border-line bg-paper p-5 shadow-sm sm:p-6">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            {t("telegram.selectDriver")}
          </span>
          <SearchSelect
            value={driverId}
            onChange={setDriverId}
            options={options}
            placeholder={t("telegram.selectDriverPlaceholder")}
          />
        </label>

        {driverId ? (
          <div className="mt-5 space-y-5">
            {error ? (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <div className="rounded-2xl border border-line bg-mist-2/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white dark:bg-steel">
                  1
                </span>
                <h3 className="text-sm font-bold text-ink">
                  {t("telegram.stepLink")}
                </h3>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted" />
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold",
                      linked
                        ? "bg-ok/12 text-ok"
                        : "bg-signal/12 text-signal",
                    )}
                  >
                    {linkLoading
                      ? t("common.loading")
                      : linked
                        ? t("drivers.telegramLinked")
                        : t("drivers.telegramNotLinked")}
                  </span>
                  {link?.chatIdMasked ? (
                    <span className="text-xs text-muted">
                      {link.chatIdMasked}
                    </span>
                  ) : null}
                  {linked ? <Check className="h-4 w-4 text-ok" /> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void loadLink(driverId, true)}
                  disabled={refreshing || linkLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-mist disabled:opacity-50"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                  />
                  {t("telegram.refreshStatus")}
                </button>
              </div>

              <p className="mt-3 text-xs text-muted">
                {linked ? t("telegram.linkedReady") : t("telegram.waitStart")}
              </p>

              {!linked ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    disabled={!link?.url || linkLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    {t("drivers.copyTelegramLink")}
                  </button>
                  {link?.url ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white dark:bg-steel transition hover:-translate-y-0.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("telegram.openBot")}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                "rounded-2xl border p-4 transition",
                linked
                  ? "border-line bg-mist-2/50"
                  : "border-dashed border-line/70 bg-mist/30 opacity-60",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                      linked ? "bg-ink dark:bg-steel" : "bg-muted",
                    )}
                  >
                    2
                  </span>
                  <h3 className="text-sm font-bold text-ink">
                    {t("telegram.stepSend")}
                  </h3>
                </div>
                {sentCount > 0 ? (
                  <span className="text-xs font-semibold text-muted">
                    {t("telegram.sentCount", { n: sentCount })}
                  </span>
                ) : null}
              </div>

              {!linked ? (
                <p className="text-xs text-muted">{t("telegram.sendLocked")}</p>
              ) : (
                <form onSubmit={submitMessage} className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setTemplate("debt")}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition",
                        template === "debt"
                          ? "border-ink bg-ink text-white dark:border-steel dark:bg-steel"
                          : "border-line bg-paper text-ink hover:bg-mist",
                      )}
                    >
                      {t("drivers.telegramTemplateDebt")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplate("custom")}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition",
                        template === "custom"
                          ? "border-ink bg-ink text-white dark:border-steel dark:bg-steel"
                          : "border-line bg-paper text-ink hover:bg-mist",
                      )}
                    >
                      {t("drivers.telegramTemplateCustom")}
                    </button>
                  </div>

                  {template === "debt" ? (
                    <div className="rounded-2xl border border-line bg-paper p-3">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                        {t("drivers.telegramPreview")}
                      </span>
                      <pre className="whitespace-pre-wrap font-sans text-sm text-ink">
                        {debtPreview()}
                      </pre>
                    </div>
                  ) : (
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                        {t("drivers.telegramMessage")}
                      </span>
                      <textarea
                        className="input-field min-h-32"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("telegram.messagePlaceholder")}
                      />
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={
                      sending || (template === "custom" && !message.trim())
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white dark:bg-steel shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? t("common.saving") : t("drivers.sendTelegram")}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <Toast
        open={Boolean(toast)}
        message={toast}
        variant={toastVariant}
        onClose={() => setToast("")}
      />
    </div>
  );
}

export default function TelegramPage() {
  return (
    <Suspense fallback={<LoadingScreen variant="page" />}>
      <TelegramPageInner />
    </Suspense>
  );
}
