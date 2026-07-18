import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, locale = "uz-UZ") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

/** +998 90 123 45 67 */
export function formatPhoneMask(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  let out = "+998";
  if (digits.length > 0) out += ` ${digits.slice(0, 2)}`;
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += ` ${digits.slice(5, 7)}`;
  if (digits.length > 7) out += ` ${digits.slice(7, 9)}`;
  return out;
}

/** AA 1234567 */
export function formatPassportMask(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const letters = cleaned.replace(/[^A-Z]/g, "").slice(0, 2);
  const digits = cleaned.replace(/[^0-9]/g, "").slice(0, 7);
  if (!letters && !digits) return "";
  if (digits) return `${letters} ${digits}`.trim();
  return letters;
}

/** dd.mm.yyyy */
export function formatDateMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/**
 * O‘zbekiston davlat raqami:
 * - eski: 01 A 333 BA
 * - yangi: 01 333 AAA
 */
export function formatPlateMask(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let i = 0;

  let region = "";
  while (i < cleaned.length && region.length < 2) {
    if (/\d/.test(cleaned[i])) region += cleaned[i];
    i += 1;
  }
  if (region.length < 2) return region;

  while (i < cleaned.length && !/[A-Z0-9]/.test(cleaned[i])) i += 1;
  const next = cleaned[i];

  // Yangi format: 01 333 AAA
  if (next && /\d/.test(next)) {
    let nums = "";
    while (i < cleaned.length && nums.length < 3) {
      if (/\d/.test(cleaned[i])) nums += cleaned[i];
      i += 1;
    }
    let letters = "";
    while (i < cleaned.length && letters.length < 3) {
      if (/[A-Z]/.test(cleaned[i])) letters += cleaned[i];
      i += 1;
    }
    let out = region;
    if (nums) out += ` ${nums}`;
    if (letters) out += ` ${letters}`;
    return out;
  }

  // Eski format: 01 A 333 BA
  let letter1 = "";
  while (i < cleaned.length && !letter1) {
    if (/[A-Z]/.test(cleaned[i])) letter1 = cleaned[i];
    i += 1;
  }
  let nums = "";
  while (i < cleaned.length && nums.length < 3) {
    if (/\d/.test(cleaned[i])) nums += cleaned[i];
    i += 1;
  }
  let letters2 = "";
  while (i < cleaned.length && letters2.length < 2) {
    if (/[A-Z]/.test(cleaned[i])) letters2 += cleaned[i];
    i += 1;
  }

  let out = region;
  if (letter1) out += ` ${letter1}`;
  if (nums) out += ` ${nums}`;
  if (letters2) out += ` ${letters2}`;
  return out;
}

/** 1 500 000 */
export function formatMoneyMask(value: string | number) {
  const digits = String(value).replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function parseMoneyInput(value: string | number) {
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatPersonName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
