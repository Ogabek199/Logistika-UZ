"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";

export type Locale = "uz" | "ru";

type Messages = typeof uz;

const dictionaries: Record<Locale, Messages> = { uz, ru };
const STORAGE_KEY = "logistika_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dateLocale: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getByPath(obj: Messages, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "uz" || saved === "ru") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const value =
        getByPath(dictionaries[locale], key) ??
        getByPath(dictionaries.uz, key) ??
        key;
      return interpolate(value, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dateLocale: locale === "ru" ? "ru-RU" : "uz-UZ",
    }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}

export function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark" | "ink";
}) {
  const { locale, setLocale, t } = useLocale();

  const shell =
    variant === "dark"
      ? "border-white/20 bg-white/10"
      : variant === "ink"
        ? "border-white/15 bg-white/8"
        : "border-line bg-white";

  const idle =
    variant === "dark" || variant === "ink"
      ? "text-white/65 hover:text-white"
      : "text-muted hover:text-ink";

  const active =
    variant === "dark" || variant === "ink"
      ? "bg-white text-ink shadow-sm"
      : "bg-ink text-white shadow-sm";

  return (
    <div
      className={`inline-flex rounded-xl border p-0.5 text-xs font-bold ${shell}`}
      role="group"
      aria-label="Language"
    >
      {(["uz", "ru"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-lg px-2.5 py-1.5 transition ${
            locale === code ? active : idle
          }`}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
}
