/**
 * The tools family's render-time formatting — the compound tool's house
 * patterns (content.ts's "Persian digits and Jalali dates applied at
 * render time — never baked into these strings"), restated once for
 * every tool that follows: digit normalization, fa digits, money and
 * percent formatting, smart rate precision, about-level rounding.
 */

import type { Locale } from "@/lib/compound/content";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Persian and Arabic digits → ASCII, the Persian decimal separator
 *  folded in, leading zeros collapsed (the compound tool's exact rule). */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/,/g, "")
    .replace(/^0+(?=\d)/, "");
}

/** ASCII digits → Persian digits (and the decimal separator), for display. */
export function toFaDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]).replace(/\./g, "٫");
}

/** Format a money amount for the page (fa → Persian digits + grouping). */
export function fmtMoney(v: number, locale: Locale, digits = 0): string {
  if (!Number.isFinite(v)) return locale === "fa" ? "۰" : "0";
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(v);
  } catch {
    return locale === "fa" ? toFaDigits(String(Math.round(v))) : String(Math.round(v));
  }
}

/** A rate that may be very small: keeps sensible significant digits.
 *  ≥1 → up to 2 decimals; <1 → 6 significant digits (0.00000341 reads
 *  better than 0.00). */
export function fmtRate(v: number, locale: Locale): string {
  if (!Number.isFinite(v) || v <= 0) return "—";
  const digits = v >= 1 ? 2 : 6;
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      maximumSignificantDigits: v >= 1 ? undefined : 6,
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(v);
  } catch {
    return String(v);
  }
}

/** Percent with the locale's sign (fa uses ٪). */
export function fmtPct(v: number, locale: Locale, digits = 1): string {
  const sign = locale === "fa" ? "٪" : "%";
  return `${fmtMoney(v, locale, digits)}${sign}`;
}

/** Round an amount the way the page speaks (the compound tool's
 *  about-level precision, restated) — used for headline shares. */
export function roundMoney(v: number): number {
  const a = Math.abs(v);
  if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
  if (a >= 10_000) return Math.round(v / 100) * 100;
  if (a >= 1_000) return Math.round(v / 10) * 10;
  return Math.round(v);
}

/** A time-of-day / date label in the reader's calendar (fa → the
 *  Persian calendar through fa-IR, exactly like the gold page's dates). */
export function fmtDateTime(
  iso: string | number | Date,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
  try {
    return new Intl.DateTimeFormat(
      locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
      opts,
    ).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

/** Today's date label (long form) in the reader's calendar. */
export function fmtToday(locale: Locale): string {
  return fmtDateTime(new Date(), locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Clamp with a step (the compound tool's clamp, restated). */
export function clamp(n: number, min: number, max: number, step = 1): number {
  const s = step > 0 ? step : 1;
  const clamped = Math.min(max, Math.max(min, n));
  return Math.round(clamped / s) * s;
}
