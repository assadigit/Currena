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

/**
 * The yearly lens's anchor (round 47): the change vs the last close on or
 * before this many calendar days back.
 */
export const CHG1Y_ANCHOR_DAYS = 365;
/**
 * The yearly anchor's tolerance band, in calendar days either side of
 * CHG1Y_ANCHOR_DAYS — the repo's year-on-year convention (series.ts
 * yoyPctSeries reads the latest point 350–380 days earlier). Both free
 * providers cut history at ~one year, so the strict 365-day anchor often
 * lands one or two days BEFORE the series starts; when the series' own
 * first close falls inside the band, it IS the year-ago anchor. A window
 * that starts closer than 350 days to the last close has no honest yearly
 * reading — the row omits chg1y (the UI shows a dash, never a guess).
 */
export const CHG1Y_ANCHOR_TOLERANCE_DAYS = 15;

/**
 * The 5-year lens's anchor (2026-10-27 owner round — "add five year and 3
 * months to all view points"): the change vs the last close on or before
 * this many calendar days back (5 years ≈ 1826 days). Same ±15-day
 * tolerance convention as the yearly anchor: when a long provider window
 * (the job's Yahoo range=10y supplement) starts inside the band, the
 * earliest close IS the anchor; a window that starts closer than
 * (1826 − 15) days to the last close has no honest 5-year reading — the
 * row omits chg5y (the UI shows a dash, never a guess).
 */
export const CHG5Y_ANCHOR_DAYS = 1826;

/**
 * Trend rule band, in percent (up at or above +1, down at or below −1),
 * applied to the SAME window the table's own "3-month" column shows
 * (CHG_WINDOW_DAYS). Defect E-18 (2026-10-16): the Trend label is
 * reproducible from the number printed beside it — ≥ +1.0% Up, ≤ −1.0%
 * Down, otherwise Flat. (The old 50-day-average basis produced labels that
 * contradicted the displayed 3-month change — DAX +1.54% labelled "Down".)
 */
export const TREND_BAND_PCT = 1;

/** Validation R3: a one-day move of this size (percent) is suspicious. */
export const MAX_DAY_MOVE_PCT = 15;
/** Validation R4: a provider answer must carry at least this many closes. */
export const MIN_CLOSES = 200;
/** Validation R5: when both providers answered, closes must agree within this percent. */
export const PROVIDER_AGREEMENT_PCT = 0.5;
/** Validation R6: asOf older than this many calendar days marks the row stale. */
export const STALE_DAYS = 5;

/**
 * World-markets MAP (docs/insights/world-markets-map-spec.md §4.3/D2): a
 * quote at most this many minutes old counts as an OPEN market — the
 * fallback used ONLY when the provider carries no market-state field.
 * The map's market state is honest about the EOD pipeline: rows written
 * by the 23:30/01:30 UTC crons are hours past every close, so they read
 * Closed; a row whose quote is genuinely minutes old (a live Yahoo
 * session caught mid-run) reads Open.
 */
export const OPEN_MAX_AGE_MIN = 30;

/** History window asked from providers: ~400 days back (spec §4 rule 6);
 * Yahoo is asked for range=2y (round 47) so the yearly lens's 350–380-day
 * anchor band always carries real closes even though the free plans cut
 * EODHD at one year. */
export const HISTORY_WINDOW_DAYS = 400;
/** Weekly series length for the detail chart (spec §4 rule 7). */
export const WEEKLY_POINTS = 52;
/**
 * Day-zero for the delta-encoded weekly series: 2020-01-01's epoch day
 * (days since 1970-01-01 UTC). Keeps every stored day delta small so the
 * ONE stored object stays under the route's 13 KB budget (raised from
 * 12 KB by round 46 — the weekly lens field).
 */
export const WEEKLY_EPOCH_BASE_DAY = 18262;

/** EODHD base URL (free key; EOD endpoint, one call per market). */
export const EODHD_BASE_URL = 'https://eodhd.com/api';
/** Yahoo Finance chart endpoint (unofficial, keyless fallback; v7 is dead). */
export const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
/** User-Agent for Yahoo (v3 F-09/T-25): the declared honest identity. A
 *  refusal means BLOCKED — fail closed; never a browser identity. */
export const YAHOO_USER_AGENT = 'CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)';

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
   * R9-02 (2026-10-27 owner round — "use exchange logos instead of country
   * flags for STOXX and TSX"): when true, the card / tile / table surfaces
   * render the index's OWN logo artwork from /assets/markets/{id}.jpg (the
   * Euronext/STOXX wordmark for stoxx50, the TSX mark for tsx) instead of
   * any country/region flag. The world MAP is unaffected — it colours by
   * country tint and never reads this flag.
   */
  useExchangeLogo?: boolean;
  /**
   * EODHD INDX code, or null when the provider cannot serve this market on
   * the free key (verified live in the step-0 data check — FTSE on
   * 2026-10-12: no FTSE 100 index exists in the INDX symbol list, only
   * LSE ETFs).
   */
  eodhdCode: string | null;
  /** Yahoo Finance chart symbol (URL-encoded by the fetcher). */
  yahooSymbol: string;
  /**
   * F1 (2026-10-21 session-finality fix): the exchange's local closing
   * TIME, minutes past midnight in the exchange's own timezone (a single
   * year-round value — every index below trades in a market with no DST
   * shifts affecting these hours, and the worst case of a one-hour error
   * is a row held until a later run, never a wrong value). A run whose
   * winning series carries a close dated TODAY (UTC) may only write that
   * row once the session has fully closed by the run's clock — otherwise
   * the row is an intraday snapshot that would freeze as the "final"
   * close (the 2026-10-21 N225 incident: the 01:30 retry wrote Tokyo's
   * 14:30 JST level, 0.85% off the real 15:00 close, as today's close).
   */
  closeUtcMinute: number;
  /**
   * 2026-10-29 owner round ("when the market is shut down — holidays,
   * weekends — it must show the exchanges are not working right now"):
   * the exchange's trading CALENDAR for the public session-state banner.
   * `timezone` is the IANA zone (DST-true through Intl); `openLocalMinute`
   * and `closeLocalMinute` bound the regular session in LOCAL time (the
   * pre-open auction and the closing auction fade are ignored — the banner
   * speaks in whole sessions); `closedWeekdays` is 0-based JS day (0=Sun,
   * 6=Sat), default Sat+Sun; `holidays` carries recurring 'MM-DD' dates
   * and one-off 'YYYY-MM-DD' dates (fixed-date public holidays only —
   * floating religious/lunar holidays are NOT modelled; the honest
   * fallback on an unmodelled holiday is the map's own per-market state,
   * which tracks the quote flow). Read by the SPA's session helper
   * (world-markets/session.ts) — platform-free, no clock reads here.
   */
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

/** Fixed for v1 (spec §2 + owner round 44: the Dow Jones and CAC 40 joined
 * the original 14 after live provider verification).
 *
 * closeUtcMinute = the session's close converted to UTC (minutes past 00:00
 * UTC), plus a 30-minute settlement margin baked in. Sources: each
 * exchange's published trading hours. The list is consulted ONLY when a
 * winning series' latest close is dated the run's own UTC day (an intraday
 * print) — see compute.ts sessionClosedForWrite. */
export const MARKETS: readonly MarketDefinition[] = [
  // Tokyo 09:00–15:00 JST (UTC+9) → close 06:00 UTC (+30 margin = 06:30).
  { id: 'n225', group: 'asia', eodhdCode: 'N225.INDX', yahooSymbol: '^N225', closeUtcMinute: 6 * 60 + 30,
    timezone: 'Asia/Tokyo', openLocalMinute: 540, closeLocalMinute: 900,
    holidays: ['01-01','01-02','01-03','12-31'],},
  // Sydney 10:00–16:00 AEST (UTC+10; the market's own clock, no DST here) → 06:00 UTC (+30 = 06:30).
  { id: 'asx200', group: 'asia', eodhdCode: 'AXJO.INDX', yahooSymbol: '^AXJO', closeUtcMinute: 6 * 60 + 30,
    timezone: 'Australia/Sydney', openLocalMinute: 600, closeLocalMinute: 960,
    holidays: ['01-01','12-25','12-26','04-25'],},
  // Seoul 09:00–15:30 KST (UTC+9) → 06:30 UTC (+30 = 07:00).
  { id: 'kospi', group: 'asia', eodhdCode: 'KS11.INDX', yahooSymbol: '^KS11', closeUtcMinute: 7 * 60,
    timezone: 'Asia/Seoul', openLocalMinute: 540, closeLocalMinute: 930,
    holidays: ['01-01','01-02','03-01','05-05','06-06','08-15','10-03','10-09','12-25'],},
  // Hong Kong 09:30–16:00 HKT (UTC+8) → 08:00 UTC (+30 = 08:30).
  { id: 'hsi', group: 'asia', eodhdCode: 'HSI.INDX', yahooSymbol: '^HSI', closeUtcMinute: 8 * 60 + 30,
    timezone: 'Asia/Hong_Kong', openLocalMinute: 570, closeLocalMinute: 960,
    holidays: ['01-01','05-01','07-01','10-01','12-25','12-26'],},
  // Shanghai 09:30–15:00 CST (UTC+8) → 07:00 UTC (+30 = 07:30).
  { id: 'ssec', group: 'asia', eodhdCode: 'SSEC.INDX', yahooSymbol: '000001.SS', closeUtcMinute: 7 * 60 + 30,
    timezone: 'Asia/Shanghai', openLocalMinute: 570, closeLocalMinute: 900,
    holidays: ['01-01','05-01','05-02','05-03','10-01','10-02','10-03','10-04','10-05','10-06','10-07'],},
  // Taipei 09:00–13:30 TWT (UTC+8) → 05:30 UTC (+30 = 06:00).
  { id: 'taiex', group: 'asia', eodhdCode: 'TWII.INDX', yahooSymbol: '^TWII', closeUtcMinute: 6 * 60,
    timezone: 'Asia/Taipei', openLocalMinute: 540, closeLocalMinute: 810,
    holidays: ['01-01','02-28','04-04','06-06','10-10'],},
  // Mumbai 09:15–15:30 IST (UTC+5:30) → 10:00 UTC (+30 = 10:30).
  { id: 'nifty50', group: 'asia', eodhdCode: 'NSEI.INDX', yahooSymbol: '^NSEI', closeUtcMinute: 10 * 60 + 30,
    timezone: 'Asia/Kolkata', openLocalMinute: 555, closeLocalMinute: 930,
    holidays: ['01-26','08-15','10-02'],},
  // Euro Stoxx 50 (NYSE Euronext) 09:00–17:30 CET (UTC+1) → 16:30 UTC (+30 = 17:00).
  // R9-02: the Euronext/STOXX logo (stoxx50.jpg), NOT the EU flag.
  { id: 'stoxx50', group: 'europe', eodhdCode: 'STOXX50E.INDX', yahooSymbol: '^STOXX50E', closeUtcMinute: 17 * 60,
    timezone: 'Europe/Paris', openLocalMinute: 540, closeLocalMinute: 1050,
    holidays: ['01-01','05-01','12-25','12-26'], useExchangeLogo: true },
  // Xetra 09:00–17:30 CET (UTC+1) → 16:30 UTC (+30 = 17:00).
  { id: 'dax', group: 'europe', eodhdCode: 'GDAXI.INDX', yahooSymbol: '^GDAXI', closeUtcMinute: 17 * 60,
    timezone: 'Europe/Berlin', openLocalMinute: 540, closeLocalMinute: 1050,
    holidays: ['01-01','05-01','10-03','12-25','12-26'],},
  // Paris 09:00–17:30 CET (UTC+1) → 16:30 UTC (+30 = 17:00).
  { id: 'cac', group: 'europe', eodhdCode: 'FCHI.INDX', yahooSymbol: '^FCHI', closeUtcMinute: 17 * 60,
    timezone: 'Europe/Paris', openLocalMinute: 540, closeLocalMinute: 1050,
    holidays: ['01-01','05-01','12-25','12-26'],},
  // London 08:00–16:30 GMT (UTC+0) → 16:30 UTC (+30 = 17:00).
  { id: 'ftse', group: 'europe', eodhdCode: null, yahooSymbol: '^FTSE', closeUtcMinute: 17 * 60,
    timezone: 'Europe/London', openLocalMinute: 480, closeLocalMinute: 990,
    holidays: ['01-01','12-25','12-26'],},
  // NYSE/Nasdaq 09:30–16:00 ET (UTC−5) → 21:00 UTC (+30 = 21:30).
  { id: 'sp500', group: 'americas', eodhdCode: 'GSPC.INDX', yahooSymbol: '^GSPC', closeUtcMinute: 21 * 60 + 30,
    timezone: 'America/New_York', openLocalMinute: 570, closeLocalMinute: 960,
    holidays: ['01-01','06-19','07-04','11-27','12-25'],},
  { id: 'ndx', group: 'americas', eodhdCode: 'NDX.INDX', yahooSymbol: '^NDX', closeUtcMinute: 21 * 60 + 30,
    timezone: 'America/New_York', openLocalMinute: 570, closeLocalMinute: 960,
    holidays: ['01-01','06-19','07-04','11-27','12-25'],},
  { id: 'dow', group: 'americas', eodhdCode: 'DJI.INDX', yahooSymbol: '^DJI', closeUtcMinute: 21 * 60 + 30,
    timezone: 'America/New_York', openLocalMinute: 570, closeLocalMinute: 960,
    holidays: ['01-01','06-19','07-04','11-27','12-25'],},
  // Toronto 09:30–16:00 ET (UTC−5) → 21:00 UTC (+30 = 21:30).
  // R9-02: the TSX logo (tsx.jpg), NOT the Canada flag.
  { id: 'tsx', group: 'americas', eodhdCode: 'GSPTSE.INDX', yahooSymbol: '^GSPTSE', closeUtcMinute: 21 * 60 + 30,
    timezone: 'America/Toronto', openLocalMinute: 570, closeLocalMinute: 960,
    holidays: ['01-01','07-01','12-25','12-26'], useExchangeLogo: true },
  // São Paulo 10:00–17:00 BRT (UTC−3) → 20:00 UTC (+30 = 20:30).
  { id: 'ibov', group: 'americas', eodhdCode: 'BVSP.INDX', yahooSymbol: '^BVSP', closeUtcMinute: 20 * 60 + 30,
    timezone: 'America/Sao_Paulo', openLocalMinute: 600, closeLocalMinute: 1020,
    holidays: ['01-01','04-21','09-07','11-02','11-15','11-20','12-25'],},
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
