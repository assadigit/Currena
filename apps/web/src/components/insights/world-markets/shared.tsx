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
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { IconImg, DIRECTION_DOWN_URL, DIRECTION_UP_URL } from '../../icons/currena';

/** The page-level feed state (owned by Insights.tsx, passed down). */
export type MarketsLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | {
      kind: 'ready';
      snapshot: MarketsSnapshot;
      /**
       * MAP M17 (docs/insights/world-markets-map-spec.md): the refresh
       * failed and this is the LAST GOOD local copy — the map answers with
       * its "Showing data from {time}" line instead of pretending to be
       * fresh. Every other surface renders `ready` exactly as before.
       */
      fromCache?: boolean;
    };

/** The section's return-period lenses: daily, weekly, monthly, the NORMAL
 * quarterly window (02-ui-spec §3.3, the 2026-10-18 handoff round) and the
 * yearly lens (round 47 — the stored contract now carries chg1y). The
 * 52-week-high distance is NOT a lens — it rides every surface as secondary
 * context (tile tags, mover cards, table column). See briefing.ts for the
 * closed list.
 *
 * 2026-10-21 owner round ("unify the map time views with the other parts
 * of the website"): the SWITCH speaks the map's lenses — today | 1w | 1m |
 * 1y — replacing the retired five-option radiogroup. 2026-10-27 owner
 * round ("add five year and 3 months to all view points"): '3m' RETURNS
 * as a selectable lens (the stored contract always carried chg3m) and
 * '5y' joins from the job's Yahoo-10y-anchored chg5y — six lenses, the
 * same closed set the map switch and the prices board speak. */
export type MarketsView = 'today' | '1w' | '1m' | '3m' | '1y' | '5y';

/** The localized period word for a lens — labels, aria sentences and the
 * movers' period caption all read it, so one mapping drives every
 * mention of "which period am I in". 2026-10-21 unification: the switch
 * lenses speak the MAP's period words (today / this week / this month /
 * this year) so the verdict box, the movers, the tiles and the map's own
 * summary can never disagree; 2026-10-27: '3m' and '5y' speak the map's
 * own period words too (every lens has exactly one word). */
export function periodWord(view: MarketsView, copy: InsightsCopy): string {
  if (view === 'today') return copy.markets.map.periodWordToday;
  if (view === '1w') return copy.markets.map.periodWordWeek;
  if (view === '1m') return copy.markets.map.periodWordMonth;
  if (view === '3m') return copy.markets.map.periodWord3M;
  if (view === '5y') return copy.markets.map.periodWord5Y;
  return copy.markets.map.periodWordYear;
}

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
  if (view === '5y') {
    return m.chg5y === undefined ? { pct: null, arrow: 'flat' } : { pct: m.chg5y, arrow: bandedArrow(m.chg5y) };
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
 * so colour is never alone (§6.8). 2026-10-27 owner round ("write the
 * positive indexes with more clear and bright green please a triangle
 * showing up for green, and do the same for red, down and brighter red"):
 * the index surfaces render the crisp DirTriangle below in the BRIGHT
 * return inks; this artwork stays for any surface that has not migrated. */
export function DirectionGlyph({ arrow, size = 14, desktopSize = 16 }: { arrow: 'up' | 'flat' | 'down'; size?: number; desktopSize?: number }) {
  if (arrow === 'up') return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (arrow === 'down') return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
  return (
    <span aria-hidden="true" className="text-[0.8em] leading-none text-[var(--color-text-secondary)]">
      →
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The 2026-10-27 owner round's BRIGHT return inks + triangles
 *
 * "write the positive indexes with more clear and bright green please a
 * triangle showing up for green, and do the same for red, down and
 * brighter red": every index-return surface (tiles, movers, the table's
 * period columns, the verdict's breadth counts) renders the signed value
 * in the vivid dedicated RETURN tokens — brighter and clearer than the
 * status hues (which stay the calm state vocabulary) — with a crisp
 * filled triangle: ▲ up-bright-green, ▼ down-bright-red, a dash bar for
 * an exactly-zero reading. The ink and triangle follow the NUMBER'S OWN
 * SIGN (the universal financial convention the owner asked for — a
 * +0.5% day is a positive number in bright green), while the section's
 * trend WORDS keep the honest ±1% band (audit F2/F3: a +0.3% day is a
 * "flat" TREND even though its value is green). Direction is NEVER
 * colour alone (§6.8): the sign and the triangle ride the same number.
 * ------------------------------------------------------------------ */

/** The sign of a signed reading — the ink/triangle basis (0/absent = flat). */
export function signOf(pct: number | null): 'up' | 'flat' | 'down' {
  if (pct === null || pct === 0) return 'flat';
  return pct > 0 ? 'up' : 'down';
}

/** The bright return ink class for a signed reading. */
export function returnToneClass(arrow: 'up' | 'flat' | 'down'): string {
  if (arrow === 'up') return 'text-[var(--color-return-up)]';
  if (arrow === 'down') return 'text-[var(--color-return-down)]';
  return 'text-[var(--color-text-primary)]';
}

/** The crisp filled triangle — the same shapes the map's cards wear
 * (wm-ar2), one component for every index surface. CurrentColor: the
 * caller's ink class colours it. */
export function DirTriangle({ dir, size = 10 }: { dir: 'up' | 'flat' | 'down'; size?: number }) {
  if (dir === 'flat') {
    return (
      <svg viewBox="0 0 10 10" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
        <rect x="0.5" y="3.5" width="9" height="3" rx="1" fill="currentColor" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
      <path d={dir === 'up' ? 'M5 1 9.5 9H.5z' : 'M.5 1h9L5 9z'} fill="currentColor" />
    </svg>
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

/* MAP M9's "Updated {time} · {age}" header line is RETIRED (2026-10-21
 * owner round — the KV snapshot's write time is fixed by the nightly cron,
 * so the line always read as a stale, never-updating clock). The map
 * module's M17 "Showing data from {time}" line stays: it speaks only when
 * a refresh FAILED and the last good copy is on screen — a real event,
 * not a routine age. */

