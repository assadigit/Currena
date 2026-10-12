/**
 * World stock markets — the market table + every tunable number
 * (insights-world-markets-spec.md §2, §3.5, §5).
 *
 * CONFIG FIRST: the block immediately below is the ONE place the owner can
 * change thresholds, provider endpoints or a market's codes without
 * touching any logic below it. Everything else in this module tree reads
 * these constants — no magic numbers anywhere else.
 *
 * Platform-free (AGENTS.md rule 2): pure data, no fetch, no clock, no
 * node:* — imported identically by the currena-markets Worker, the runner
 * scripts, the SPA and unit tests.
 */

import type { MarketGroupId, MarketId } from '@currena/core';

/* ------------------------------------------------------------------ *
 * CONFIG BLOCK — owner-editable settings (spec §5.3's ask)
 * ------------------------------------------------------------------ */

/** Market status: enters Correction at −10% from the 52-week high. */
export const CORRECTION_PCT = -10;
/** Market status: enters Bear market at −20% from the 52-week high. */
export const BEAR_PCT = -20;
/** Points a market must recover above a line before its status gets milder. */
export const EXIT_BUFFER_PTS = 2;
/** Markets in Correction or worse that make the section "Needs attention". */
export const ATTENTION_COUNT = 4;
/** Markets in Correction or worse that make the section "Unusual". */
export const UNUSUAL_COUNT = 8;
/** A one-day fall (percent) that counts towards the shock-day line. */
export const SHOCK_DAY_FALL = -2;
/** Markets that must fall that much on the same day for the shock-day line. */
export const SHOCK_DAY_COUNT = 5;

/**
 * The section's NORMAL timeframe (owner round 44, spec v1.2): the second
 * lens and the table/CSV column show the change over the last ~three
 * months — the window providers are asked about, in calendar days.
 */
export const CHG_WINDOW_DAYS = 90;

/** Trend rule: moving-average length in trading days (spec §5.1). */
export const TREND_MA_DAYS = 50;
/** Trend rule: band around the average, in percent (up above +1, down below −1). */
export const TREND_BAND_PCT = 1;

/** Validation R3: a one-day move of this size (percent) is suspicious. */
export const MAX_DAY_MOVE_PCT = 15;
/** Validation R4: a provider answer must carry at least this many closes. */
export const MIN_CLOSES = 200;
/** Validation R5: when both providers answered, closes must agree within this percent. */
export const PROVIDER_AGREEMENT_PCT = 0.5;
/** Validation R6: asOf older than this many calendar days marks the row stale. */
export const STALE_DAYS = 5;

/** History window asked from providers: ~400 days back (spec §4 rule 6). */
export const HISTORY_WINDOW_DAYS = 400;
/** Weekly series length for the detail chart (spec §4 rule 7). */
export const WEEKLY_POINTS = 52;
/**
 * Day-zero for the delta-encoded weekly series: 2020-01-01's epoch day
 * (days since 1970-01-01 UTC). Keeps every stored day delta small so the
 * ONE stored object stays under the route's 12 KB budget.
 */
export const WEEKLY_EPOCH_BASE_DAY = 18262;

/** EODHD base URL (free key; EOD endpoint, one call per market). */
export const EODHD_BASE_URL = 'https://eodhd.com/api';
/** Yahoo Finance chart endpoint (unofficial, keyless fallback; v7 is dead). */
export const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
/** User-Agent for Yahoo — a plain curl UA gets blocked with 429/999. */
export const YAHOO_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

/** The one KV key the whole section is stored under (spec §4 rule 1). */
export const MARKETS_KV_KEY = 'insights:markets:v1';

/* ------------------------------------------------------------------ *
 * The 16 markets (spec §2 as amended by owner round 44 — order follows
 * the trading day, east to west)
 * ------------------------------------------------------------------ */

export interface MarketDefinition {
  id: MarketId;
  group: MarketGroupId;
  /**
   * EODHD INDX code, or null when the provider cannot serve this market on
   * the free key (verified live in the step-0 data check — see
   * docs/specs/insights-world-markets-data-check.md; FTSE on 2026-10-12:
   * no FTSE 100 index exists in the INDX symbol list, only LSE ETFs).
   */
  eodhdCode: string | null;
  /** Yahoo Finance chart symbol (URL-encoded by the fetcher). */
  yahooSymbol: string;
}

/** Fixed for v1 (spec §2 + owner round 44: the Dow Jones and CAC 40 joined
 * the original 14 after live provider verification — see
 * docs/specs/insights-world-markets-data-check.md). */
export const MARKETS: readonly MarketDefinition[] = [
  { id: 'n225', group: 'asia', eodhdCode: 'N225.INDX', yahooSymbol: '^N225' },
  { id: 'asx200', group: 'asia', eodhdCode: 'AXJO.INDX', yahooSymbol: '^AXJO' },
  { id: 'kospi', group: 'asia', eodhdCode: 'KS11.INDX', yahooSymbol: '^KS11' },
  { id: 'hsi', group: 'asia', eodhdCode: 'HSI.INDX', yahooSymbol: '^HSI' },
  { id: 'ssec', group: 'asia', eodhdCode: 'SSEC.INDX', yahooSymbol: '000001.SS' },
  { id: 'taiex', group: 'asia', eodhdCode: 'TWII.INDX', yahooSymbol: '^TWII' },
  { id: 'nifty50', group: 'asia', eodhdCode: 'NSEI.INDX', yahooSymbol: '^NSEI' },
  { id: 'stoxx50', group: 'europe', eodhdCode: 'STOXX50E.INDX', yahooSymbol: '^STOXX50E' },
  { id: 'dax', group: 'europe', eodhdCode: 'GDAXI.INDX', yahooSymbol: '^GDAXI' },
  { id: 'cac', group: 'europe', eodhdCode: 'FCHI.INDX', yahooSymbol: '^FCHI' },
  { id: 'ftse', group: 'europe', eodhdCode: null, yahooSymbol: '^FTSE' },
  { id: 'sp500', group: 'americas', eodhdCode: 'GSPC.INDX', yahooSymbol: '^GSPC' },
  { id: 'ndx', group: 'americas', eodhdCode: 'NDX.INDX', yahooSymbol: '^NDX' },
  { id: 'dow', group: 'americas', eodhdCode: 'DJI.INDX', yahooSymbol: '^DJI' },
  { id: 'tsx', group: 'americas', eodhdCode: 'GSPTSE.INDX', yahooSymbol: '^GSPTSE' },
  { id: 'ibov', group: 'americas', eodhdCode: 'BVSP.INDX', yahooSymbol: '^BVSP' },
];

const BY_ID = new Map(MARKETS.map((m) => [m.id as string, m]));

/** Definition lookup — throws on unknown id (a typo must never render). */
export function marketDefinition(id: MarketId): MarketDefinition {
  const def = BY_ID.get(id);
  if (def === undefined) throw new Error(`[markets] unknown market id ${JSON.stringify(id)}`);
  return def;
}

/** Decode the stored weekly pairs back into [epochDay, close] points for the chart. */
export function decodeWeeklySeries(weekly: readonly [number, number][]): [number, number][] {
  let day = WEEKLY_EPOCH_BASE_DAY;
  const out: [number, number][] = [];
  for (const [delta, close] of weekly) {
    day += delta;
    out.push([day, close]);
  }
  return out;
}

/** The US override markets (spec §5.3): S&P 500 and Nasdaq 100. */
export const US_OVERRIDE_IDS: readonly MarketId[] = ['sp500', 'ndx'];

/** Group render order, east to west (spec §6.3). */
export const MARKET_GROUP_ORDER: readonly MarketGroupId[] = ['asia', 'europe', 'americas'];

/** All market ids in trading-day order. */
export const MARKET_IDS: readonly MarketId[] = MARKETS.map((m) => m.id);
