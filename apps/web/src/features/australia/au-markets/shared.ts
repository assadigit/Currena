/**
 * @currena/insights au-markets/shared — the Australian markets board's
 * shared types and pure helpers (gap-closure S5-M5.4).
 *
 * Self-contained (does not import the world board's world-markets/shared
 * — that module is coupled to MarketId and the world copy dictionary).
 * The helpers mirror the world board's behaviour (signed percent, the
 * return-tone class, the view→value lookup, the stale/old flags) but over
 * the AU entry shape.
 */

import type { AuMarketEntry, AuMarketsSnapshot } from '@currena/core';

/** The AU board's load state — the markets twin (loading / empty / ready). */
export type AuMarketsLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: AuMarketsSnapshot; fromCache?: boolean };

/** The per-row view lens (the table's columns). */
export type AuMarketsView = 'today' | '1w' | '1m' | '1y';

/** The value for a given view lens, or null when the row omits it. */
export function auViewValue(entry: AuMarketEntry, view: AuMarketsView): number | null {
  switch (view) {
    case 'today':
      return entry.chg1d;
    case '1w':
      return entry.chg1w ?? null;
    case '1m':
      return entry.chg1m ?? null;
    case '1y':
      return entry.chg1y ?? null;
  }
}

/** A signed percent string (+12.3 / -4.5) — em dash for a null reading. */
export function auSignedPct(n: number | null, locale: 'en' | 'fa'): string {
  if (n === null) return '—';
  const sign = n > 0 ? '+' : '';
  const nf = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sign}${nf.format(n)}%`;
}

/** A positive/negative/neutral return-tone class for the percent cell. */
export function auReturnToneClass(n: number | null): string {
  if (n === null) return 'text-[var(--color-text-secondary)]';
  if (n >= 1) return 'text-[var(--color-return-up)]';
  if (n <= -1) return 'text-[var(--color-return-down)]';
  return 'text-[var(--color-text-secondary)]';
}

/** The 52-week-distance tag (the world board's "X% below high" / "at high"). */
export function auFromHighLabel(entry: AuMarketEntry, locale: 'en' | 'fa'): string {
  if (entry.fromHigh > -0.5) return locale === 'fa' ? 'در اوج' : 'at high';
  const nf = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const abs = nf.format(Math.abs(entry.fromHigh));
  return locale === 'fa' ? `${abs}٪ زیر اوج` : `${abs}% below high`;
}

/** Format a close level in the given locale. */
export function auFmtClose(close: number, locale: 'en' | 'fa'): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(close);
}

/** Trading days behind the freshest row in the snapshot (the "delayed" tag). */
export function auTradingDaysBehind(asOf: string, freshestIso: string): number {
  const a = new Date(`${asOf}T00:00:00Z`).getTime();
  const f = new Date(`${freshestIso}T00:00:00Z`).getTime();
  const days = Math.round((f - a) / 86_400_000);
  return days > 0 ? days : 0;
}

/** Is the row old (asOf more than STALE_DAYS behind today)? */
export function auIsOld(asOf: string, todayIso: string): boolean {
  return auTradingDaysBehind(asOf, todayIso) > 5;
}
