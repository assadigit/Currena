/**
 * Render-time formatting (AGENTS.md rule 5).
 *
 * - Locale is ALWAYS a parameter; formatted output is NEVER stored
 *   (localStorage/API payloads keep canonical numbers and ISO strings).
 * - 'fa-IR' renders Persian digits (Intl default numbering system) and
 *   uses fa separators: group '٬' (U+066C), decimal '٫' (U+066B).
 * - Jalali dates come from Intl's built-in persian calendar — no jalaali
 *   dependency (checklist #8/#19).
 * - `normalizeDigits` / `parseAmount` / `thousandSeparateInput` cover the
 *   legacy amount-input behavior plus the fa-locale digit normalization
 *   the mission adds; the scraper reuses `normalizeDigits` because TGJU
 *   pages serve Persian digits in some elements (FEATURE_MAP §4).
 */

import { CoreError } from './errors';
import { getCurrency } from './currencies';

/** Locales the product renders. */
export type Locale = 'en-US' | 'fa-IR';

/* ------------------------------------------------------------------ *
 * Digit normalization (pure, shared with the scraper)
 * ------------------------------------------------------------------ */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Map Persian (U+06F0–06F9) and Arabic-Indic (U+0660–0669) digits to ASCII,
 * and the Persian decimal separator '٫' (U+066B) to '.'. Everything else
 * passes through unchanged. Group separators (',' and '٬') are NOT touched
 * here — see `parseAmount`.
 */
export function normalizeDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const persian = PERSIAN_DIGITS.indexOf(ch);
    if (persian >= 0) {
      out += String(persian);
      continue;
    }
    const arabic = ARABIC_DIGITS.indexOf(ch);
    if (arabic >= 0) {
      out += String(arabic);
      continue;
    }
    out += ch === '٫' ? '.' : ch;
  }
  return out;
}

/**
 * Tolerant numeric parse for user input (legacy `parseFloat(v.replace(/,/g,''))`
 * parity, extended for the fa locale): accepts thousands separators (',' and
 * Arabic '٬'), Persian/Arabic-Indic digits and the Persian decimal separator.
 * Returns null when no valid number is present — never NaN.
 */
export function parseAmount(input: string): number | null {
  const normalized = normalizeDigits(input).replace(/[,٬\s]/g, '');
  if (normalized === '' || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ *
 * Number formatting
 * ------------------------------------------------------------------ */

export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Locale-aware number with grouping. Defaults mirror the legacy helper
 * `formatNumber(num, decimals = 2)` → { minimumFractionDigits: 0,
 * maximumFractionDigits: 2 } — override per call site as needed. If a caller
 * raises minimumFractionDigits above maximumFractionDigits the maximum is
 * lifted to match (Intl would otherwise throw RangeError).
 */
export function formatNumber(value: number, locale: Locale, opts: NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new CoreError('invalid_number', `cannot format non-finite number: ${String(value)}`);
  }
  const resolved: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...opts,
  };
  if (
    resolved.minimumFractionDigits !== undefined &&
    resolved.maximumFractionDigits !== undefined &&
    resolved.minimumFractionDigits > resolved.maximumFractionDigits
  ) {
    resolved.maximumFractionDigits = resolved.minimumFractionDigits;
  }
  return new Intl.NumberFormat(locale, resolved).format(value);
}

/**
 * Format an amount at its currency's precision (minorUnits from
 * currencies.ts — 0 for IRR/JPY/KRW/IDR/VND, else 2). Returns the bare
 * localized number (Persian digits + fa separators for 'fa-IR'); appending
 * code/symbol/flag is UI composition. Unknown codes default to 2 decimals.
 */
export function formatCurrencyAmount(
  value: number,
  code: string,
  locale: Locale,
  opts: NumberFormatOptions = {},
): string {
  const minorUnits = getCurrency(code)?.minorUnits ?? 2;
  return formatNumber(value, locale, { maximumFractionDigits: minorUnits, ...opts });
}

/* ------------------------------------------------------------------ *
 * Date formatting
 * ------------------------------------------------------------------ */

export interface DateFormatOptions {
  /** Append HH:mm:ss (local time). */
  withTime?: boolean;
}

function parseIso(iso: string): Date {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new CoreError('invalid_date', `not a valid ISO datetime: ${iso}`);
  }
  return date;
}

/**
 * Gregorian date. NB: plain 'fa-IR' defaults to the PERSIAN calendar in
 * Intl, so the Gregorian rendering must force `-u-ca-gregory` — a raw
 * `Intl.DateTimeFormat('fa-IR')` would silently produce a Jalali date.
 */
export function formatDate(iso: string, locale: Locale, opts: DateFormatOptions = {}): string {
  const resolved = locale === 'fa-IR' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory';
  return new Intl.DateTimeFormat(resolved, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(opts.withTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}),
  }).format(parseIso(iso));
}

/**
 * Jalali (Solar Hijri) date via Intl's persian calendar — no jalaali-js
 * dependency. 'fa-IR' → Persian digits + Persian month names;
 * 'en-US' → "06/25/1405 AP" style (checklist #8/#19).
 */
export function formatJalaliDate(iso: string, locale: Locale, opts: DateFormatOptions = {}): string {
  const resolved = locale === 'fa-IR' ? 'fa-IR-u-ca-persian' : 'en-US-u-ca-persian';
  return new Intl.DateTimeFormat(resolved, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(opts.withTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}),
  }).format(parseIso(iso));
}

/* ------------------------------------------------------------------ *
 * Relative time (legacy getTimeAgo parity + fa)
 * ------------------------------------------------------------------ */

/**
 * "X minutes ago"-style rendering, localized (en strings are verbatim
 * legacy; fa strings match apps/web/src/i18n). DETERMINISTIC when `now`
 * is passed — always pass it in tests. Legacy thresholds: <1min →
 * "just now", then minutes/hours/days (no months).
 */
export function formatRelative(iso: string, locale: Locale, now: number | Date = Date.now()): string {
  const then = parseIso(iso).getTime();
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const diffMins = Math.floor((nowMs - then) / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const count = (n: number): string => formatNumber(n, locale, { maximumFractionDigits: 0 });

  if (locale === 'fa-IR') {
    if (diffMins < 1) return 'همین حالا';
    if (diffMins < 60) return `${count(diffMins)} دقیقه پیش`;
    if (diffHours < 24) return `${count(diffHours)} ساعت پیش`;
    return `${count(diffDays)} روز پیش`;
  }

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/* ------------------------------------------------------------------ *
 * Amount input: thousand separators as you type (legacy parity)
 * ------------------------------------------------------------------ */

/**
 * The legacy converter's amount-input behavior: strip existing commas,
 * then group the integer part every 3 digits ("1234567" → "1,234,567"),
 * keeping the decimal portion untouched (".5" stays ".5"). Improvements
 * over the captured code (documented deviations):
 *   - Persian/Arabic digits are normalized first, so pasting "۱۲۳۴۵۶۷"
 *     yields "1,234,567".
 *   - A second '.' collapses into the first one (the legacy batch page did
 *     this; the converter kept "1.2.3" as-is, which could never parse).
 * Non-numeric input is returned unchanged (legacy parity).
 */
export function thousandSeparateInput(value: string): string {
  const raw = normalizeDigits(value).replace(/,/g, '');
  if (raw === '') return '';
  if (!/^[0-9.]*$/.test(raw)) return value;
  const parts = raw.split('.');
  const integerPart = parts[0] ?? '';
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rest = parts.slice(1).join('');
  return rest === '' && raw.includes('.') ? `${grouped}.` : rest === '' ? grouped : `${grouped}.${rest}`;
}
