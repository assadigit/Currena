/**
 * @currena/insights/markets-au/definitions — the Australian markets board's
 * 18 probe-verified indices (gap-closure S5-M5.4).
 *
 * Platform-free (AGENTS.md rule 2): pure data, no fetch, no clock, no
 * node:* — imported identically by the currena-markets Worker, the runner
 * scripts, the SPA and unit tests. The fetch halves live in ./providers.
 *
 * The M5.1 symbol probe (docs/gap-closure/evidence/m5.1/
 * yahoo-symbol-probe-2026-11-02.json) verified every candidate: 22/22 fresh
 * AUD-denominated ASX points 2026-10-02 → 2026-11-02, plausible vs the ASX
 * 200 anchor. EODHD is NOT used — the world board already spends the ~20
 * free calls/day, so the AU board rides the Yahoo path only (L2,
 * owner-accepted). The ASX 200 itself stays on the world board (G-3); it
 * is shown here as the anchor WITHOUT a second fetch.
 *
 * The thresholds reuse the world board's (CORRECTION_PCT, BEAR_PCT, …) —
 * the AU board's verdict is descriptive only (it never feeds the hero
 * verdict, G-5); the one-line "leading or lagging" summary reads the
 * per-group chg1d extrema.
 */

import type { AuMarketGroupId, AuMarketId } from '@currena/core';
import {
  WEEKLY_EPOCH_BASE_DAY,
} from '../markets/definitions';

/* ------------------------------------------------------------------ *
 * CONFIG BLOCK — reused from the world board (the same thresholds, the
 * same Yahoo endpoint, the same honest UA). Re-exported here so the AU
 * module is self-contained for the runner.
 * ------------------------------------------------------------------ */

// The verdict/status thresholds, the history window, the weekly encoding
// and the Yahoo endpoint constants are SHARED with the world board —
// re-exported from ../markets/definitions so a threshold change lands once.
export {
  CORRECTION_PCT,
  BEAR_PCT,
  EXIT_BUFFER_PTS,
  ATTENTION_COUNT,
  UNUSUAL_COUNT,
  SHOCK_DAY_FALL,
  SHOCK_DAY_COUNT,
  CHG_WINDOW_DAYS,
  CHG1Y_ANCHOR_DAYS,
  CHG1Y_ANCHOR_TOLERANCE_DAYS,
  CHG5Y_ANCHOR_DAYS,
  TREND_BAND_PCT,
  MAX_DAY_MOVE_PCT,
  MIN_CLOSES,
  PROVIDER_AGREEMENT_PCT,
  STALE_DAYS,
  OPEN_MAX_AGE_MIN,
  HISTORY_WINDOW_DAYS,
  WEEKLY_POINTS,
  WEEKLY_EPOCH_BASE_DAY,
  YAHOO_BASE_URL,
  YAHOO_USER_AGENT,
} from '../markets/definitions';

/** The one KV key the whole AU section is stored under (the spec §4 rule 1). */
export const MARKETS_AU_KV_KEY = 'insights:markets-au:v1';

/* ------------------------------------------------------------------ *
 * The ASX regular session (shared by all 18 AU symbols — they all trade
 * on the ASX, 10:00–16:00 AEST / UTC+10, no DST on the market's own clock).
 * Sourced from the world board's `asx200` definition (verified there).
 * closeUtcMinute = 06:00 UTC + 30-min settlement margin = 06:30 UTC.
 * ------------------------------------------------------------------ */
const ASX_TIMEZONE = 'Australia/Sydney';
const ASX_OPEN_LOCAL_MINUTE = 600; // 10:00 local
const ASX_CLOSE_LOCAL_MINUTE = 960; // 16:00 local
const ASX_CLOSE_UTC_MINUTE = 6 * 60 + 30; // 06:30 UTC
const ASX_HOLIDAYS = ['01-01', '04-25', '12-25', '12-26'] as const;

/* ------------------------------------------------------------------ *
 * The AU market definition
 * ------------------------------------------------------------------ */

export interface AuMarketDefinition {
  id: AuMarketId;
  group: AuMarketGroupId;
  /** Yahoo Finance chart symbol (URL-encoded by the fetcher). */
  yahooSymbol: string;
  /** A short Latin label for the index (shown beside the localized name
   *  in the tile — proper nouns stay Latin in both locales, RULES.md §5). */
  latin: string;
  /** The exchange's local closing time, minutes past midnight UTC, +30 min
   *  settlement margin (the F1 session-finality rule — same as the world
   *  board). Shared by all AU symbols (the ASX session). */
  closeUtcMinute: number;
  /** IANA zone (DST-true through Intl). */
  timezone: string;
  /** Regular-session open, minutes past LOCAL midnight. */
  openLocalMinute: number;
  /** Regular-session close, minutes past LOCAL midnight. */
  closeLocalMinute: number;
  /** Closed weekdays (0=Sunday … 6=Saturday); default [6, 0]. */
  closedWeekdays?: readonly number[];
  /** Fixed-date holidays: recurring 'MM-DD' and one-off 'YYYY-MM-DD'. */
  holidays?: readonly string[];
}

/**
 * The 18 probe-verified Australian indices, in board render order:
 * broad first (the All Ordinaries + the Small Ordinaries), then the
 * eleven ASX 200 GICS sector indices, then the four major banks, then
 * the ASX 200 VIX. The ASX 200 anchor itself comes from the world board
 * (id `asx200`) — it is NOT in this array (G-3).
 */
export const AU_MARKETS: readonly AuMarketDefinition[] = [
  // --- broad ---
  { id: 'aord', group: 'broad', yahooSymbol: '^AORD', latin: 'All Ordinaries',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axso', group: 'broad', yahooSymbol: '^AXSO', latin: 'ASX Small Ordinaries',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  // --- sectors (GICS order: Financials, Materials, Energy, A-REIT, Health
  //     Care, Industrials, Communication, Consumer Discretionary, Consumer
  //     Staples, Utilities, Information Technology) ---
  { id: 'axfj', group: 'sectors', yahooSymbol: '^AXFJ', latin: 'ASX 200 Financials',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axmj', group: 'sectors', yahooSymbol: '^AXMJ', latin: 'ASX 200 Materials',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axej', group: 'sectors', yahooSymbol: '^AXEJ', latin: 'ASX 200 Energy',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axpj', group: 'sectors', yahooSymbol: '^AXPJ', latin: 'ASX 200 A-REIT',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axhj', group: 'sectors', yahooSymbol: '^AXHJ', latin: 'ASX 200 Health Care',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axij', group: 'sectors', yahooSymbol: '^AXIJ', latin: 'ASX 200 Industrials',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axnj', group: 'sectors', yahooSymbol: '^AXNJ', latin: 'ASX 200 Communication',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axdj', group: 'sectors', yahooSymbol: '^AXDJ', latin: 'ASX 200 Consumer Discretionary',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axsj', group: 'sectors', yahooSymbol: '^AXSJ', latin: 'ASX 200 Consumer Staples',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axuj', group: 'sectors', yahooSymbol: '^AXUJ', latin: 'ASX 200 Utilities',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'axtj', group: 'sectors', yahooSymbol: '^AXTJ', latin: 'ASX 200 Information Technology',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  // --- the four major banks ---
  { id: 'cba', group: 'banks', yahooSymbol: 'CBA.AX', latin: 'Commonwealth Bank',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'nab', group: 'banks', yahooSymbol: 'NAB.AX', latin: 'National Australia Bank',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'anz', group: 'banks', yahooSymbol: 'ANZ.AX', latin: 'ANZ Group',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  { id: 'wbc', group: 'banks', yahooSymbol: 'WBC.AX', latin: 'Westpac',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
  // --- volatility ---
  { id: 'axvi', group: 'volatility', yahooSymbol: '^AXVI', latin: 'ASX 200 VIX',
    closeUtcMinute: ASX_CLOSE_UTC_MINUTE, timezone: ASX_TIMEZONE,
    openLocalMinute: ASX_OPEN_LOCAL_MINUTE, closeLocalMinute: ASX_CLOSE_LOCAL_MINUTE,
    holidays: ASX_HOLIDAYS },
];

const AU_BY_ID = new Map(AU_MARKETS.map((m) => [m.id as string, m]));

/** Definition lookup — throws on unknown id (a typo must never render). */
export function auMarketDefinition(id: AuMarketId): AuMarketDefinition {
  const def = AU_BY_ID.get(id);
  if (def === undefined) throw new Error(`[markets-au] unknown market id ${JSON.stringify(id)}`);
  return def;
}

/** Group render order: broad → sectors → banks → volatility (the spec). */
export const AU_MARKET_GROUP_ORDER: readonly AuMarketGroupId[] = ['broad', 'sectors', 'banks', 'volatility'];

/** All AU market ids in board render order. */
export const AU_MARKET_IDS: readonly AuMarketId[] = AU_MARKETS.map((m) => m.id);

/** Decode the stored weekly pairs back into [epochDay, close] points for the chart. */
export function decodeAuWeeklySeries(weekly: readonly [number, number][]): [number, number][] {
  let day = WEEKLY_EPOCH_BASE_DAY;
  const out: [number, number][] = [];
  for (const [delta, close] of weekly) {
    day += delta;
    out.push([day, close]);
  }
  return out;
}
