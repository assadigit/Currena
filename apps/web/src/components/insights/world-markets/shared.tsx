/**
 * world-markets/shared — the section's pure display helpers and types
 * (Phase: WS-4 module split of the former WorldMarkets.tsx monolith —
 * zero behavior change, code moved verbatim). Everything here is pure:
 * numbers/dates in, strings out; the components import these so the tile,
 * the detail panel and the table can never drift apart on formatting.
 */

import type { MarketEntry, MarketsSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { STALE_DAYS } from '@currena/insights/markets/definitions';
import { IconImg, DIRECTION_DOWN_URL, DIRECTION_UP_URL } from '../../icons/currena';

/** The page-level feed state (owned by Insights.tsx, passed down). */
export type MarketsLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: MarketsSnapshot };

/** The section's lenses: today, the NORMAL 3-month window, or the distance
 * from the 52-week high (spec §6.3 as amended by owner round 44). */
export type MarketsView = 'today' | '3m' | 'high';

/* ------------------------------------------------------------------ *
 * Pure display helpers
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

/**
 * Step-1 audit item F2/F3: ONE flat threshold for every market and every
 * view — |change| < 1% is "flat" (the old code derived the trend word from
 * each market's own 50-day moving average, so ASX at −0.3% said "Down"
 * while FTSE at +1.1% said "Flat", and DAX showed +0.6% with an up arrow
 * labelled "Down"). The trend WORD and its ARROW now come from the same
 * number the row shows.
 */
export const MARKETS_FLAT_BAND_PCT = 1;

export function bandedArrow(pct: number): 'up' | 'flat' | 'down' {
  if (pct > MARKETS_FLAT_BAND_PCT) return 'up';
  if (pct < -MARKETS_FLAT_BAND_PCT) return 'down';
  return 'flat';
}

/** The Trend column's word source: the 3-month change (the default lens). */
export function trendOf(m: Pick<MarketEntry, 'chg3m'>): 'up' | 'flat' | 'down' {
  return bandedArrow(m.chg3m);
}

/** The number + direction the current view shows for one market. */
export function viewValue(m: MarketEntry, view: MarketsView): { pct: number; arrow: 'up' | 'flat' | 'down' } {
  if (view === 'high') {
    return { pct: m.fromHigh, arrow: bandedArrow(m.fromHigh) };
  }
  const pct = view === 'today' ? m.chg1d : m.chg3m;
  return { pct, arrow: bandedArrow(pct) };
}

/**
 * Step-1 audit item A7: how many TRADING days this market's last close sits
 * behind the snapshot's freshest close (weekends never count — "a Saturday
 * or Sunday must never appear as a trading date"). More than one trading
 * day behind → the "Delayed" tag (the provider lag the audit caught on
 * TSX/Ibovespa, honestly named instead of invisible).
 */
export function tradingDaysBehind(asOf: string, freshest: string): number {
  if (asOf >= freshest) return 0;
  const from = Date.parse(`${asOf}T00:00:00Z`);
  const to = Date.parse(`${freshest}T00:00:00Z`);
  let days = 0;
  for (let t = from + 86_400_000; t <= to; t += 86_400_000) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) days += 1;
  }
  return days;
}

/** The owner's green up / red down artwork beside a signed percentage
 * (owner round 44). The flat case keeps a stroke-ish text glyph — there is
 * no "flat" artwork (the same rule as Signals.tsx' estimation strip). The
 * icons are decorative: the signed number beside them carries the meaning,
 * so colour is never alone (§6.8). */
export function DirectionGlyph({ arrow, size = 14, desktopSize = 16 }: { arrow: 'up' | 'flat' | 'down'; size?: number; desktopSize?: number }) {
  if (arrow === 'up') return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (arrow === 'down') return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
  return (
    <span aria-hidden="true" className="text-[0.8em] leading-none text-[var(--color-text-secondary)]">
      →
    </span>
  );
}

/** Client-side R6 (§6.6): the honest old-data evaluation, whatever the stored flag says. */
export function isOld(m: MarketEntry, todayIso: string): boolean {
  const days = Math.round((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${m.asOf}T00:00:00Z`)) / 86_400_000);
  return m.stale || days > STALE_DAYS;
}

export function fmtClose(close: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(close, numberLocale, { maximumFractionDigits: close >= 1000 ? 0 : 2 });
}

// Defect E-22: the L2-01 stock-state words + tones live in config/labels.ts
// (pure, shared with the full-export + CSV builders) — re-exported here for
// the section's components.
export { STATUS_TONE, statusToneOf, statusWordKeyOf } from '../config/labels';
export type { StockStateWordKey } from '../config/labels';

/** Step-1 F2: the trend WORD key for trendOf's result (chg3m-sourced). */
export const TREND_WORD_OF: Record<'up' | 'flat' | 'down', 'trendUp' | 'trendFlat' | 'trendDown'> = {
  up: 'trendUp',
  flat: 'trendFlat',
  down: 'trendDown',
};

/* ------------------------------------------------------------------ *
 * Date rendering: Jalali in Farsi (the house formatter), words in EN.
 * ------------------------------------------------------------------ */

export function formatDateShort(iso: string, locale: 'en' | 'fa'): string {
  const localeTag = locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatRelativeShort(iso: string, locale: 'en' | 'fa'): string {
  const localeTag = locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

