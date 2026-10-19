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

/** The section's return-period lenses: daily, weekly, monthly, the NORMAL
 * quarterly window (02-ui-spec §3.3, the 2026-10-18 handoff round) and the
 * yearly lens (round 47 — the stored contract now carries chg1y). The
 * 52-week-high distance is NOT a lens — it rides every surface as secondary
 * context (tile tags, mover cards, table column). See briefing.ts for the
 * closed list. */
export type MarketsView = 'today' | '1w' | '1m' | '3m' | '1y';

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
  return `${sign}${num}${percentGlyph(locale)}`;
}

/** The locale's percent glyph — ٪ in Persian, % otherwise. A technical
 * character (claimed by the manifest's technical.worldMarkets.percentSign
 * entry), never copy: the number beside it carries the meaning. Shared so
 * every surface renders the SAME glyph (tiles, movers, legend). */
export function percentGlyph(locale: 'en' | 'fa'): string {
  return locale === 'fa' ? '٪' : '%';
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

/** The number + direction the selected period shows for one market. A null pct
 * means the row carries no reading for that lens yet (a stored row written
 * before round 46) — the caller renders the honest dash, never a guess. */
export function viewValue(m: MarketEntry, view: MarketsView): { pct: number | null; arrow: 'up' | 'flat' | 'down' } {
  if (view === 'today') {
    return { pct: m.chg1d, arrow: bandedArrow(m.chg1d) };
  }
  if (view === '1w') {
    return m.chg1w === undefined ? { pct: null, arrow: 'flat' } : { pct: m.chg1w, arrow: bandedArrow(m.chg1w) };
  }
  if (view === '1m') {
    return m.chg1m === undefined ? { pct: null, arrow: 'flat' } : { pct: m.chg1m, arrow: bandedArrow(m.chg1m) };
  }
  if (view === '1y') {
    return m.chg1y === undefined ? { pct: null, arrow: 'flat' } : { pct: m.chg1y, arrow: bandedArrow(m.chg1y) };
  }
  return { pct: m.chg3m, arrow: bandedArrow(m.chg3m) };
}

/** Round 46: the honest no-reading placeholder for a lens the row does not
 * carry yet (a stored row written before the weekly/monthly fields existed).
 * Same rule as the fx engine's missing input: an absent row is absent —
 * never a zero, never a guess. Rendered inside the same bdi as a percentage
 * so bidi never moves it. */
export const NO_READING = '—';

/** signedPct for a lens value, with the honest dash for a missing one. */
export function signedPctOrDash(pct: number | null, numberLocale: 'en-US' | 'fa-IR', locale: 'en' | 'fa'): string {
  return pct === null ? NO_READING : signedPct(pct, numberLocale, locale);
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

