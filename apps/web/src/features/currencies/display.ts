/**
 * Pure display helpers for the world-currencies blocks (Phase 3-d split of
 * the former WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx). Platform-free and pure.
 */

import { formatNumber } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Pure display helpers (shared shapes with WorldMarkets)
 * ------------------------------------------------------------------ */

export function signedPct(n: number, numberLocale: 'en-US' | 'fa-IR', locale: 'en' | 'fa'): string {
  const num = formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  // A value that rounds to zero shows no sign — "−0.0" reads as a bug.
  const roundsToZero = Math.round(Math.abs(n) * 10) === 0;
  const sign = roundsToZero ? '' : n > 0 ? '+' : '−';
  return `${sign}${num}${locale === 'fa' ? '٪' : '%'}`;
}

/** Client-side V6 (§9.5): the honest old-data evaluation. */
export function isOld(entry: { asOf: string; stale?: boolean }, todayIso: string): boolean {
  const days = Math.round(
    (Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${entry.asOf}T00:00:00Z`)) / 86_400_000,
  );
  return entry.stale === true || days > 5;
}

export function formatDateShort(iso: string, locale: 'en' | 'fa'): string {
  const localeTag = locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}
