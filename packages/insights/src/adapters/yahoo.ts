/**
 * Yahoo Finance chart adapter — the GENERIC symbol fetch (any ticker, not
 * just the world-markets indices in ../markets/providers.ts, whose fetchers
 * are MarketId-bound). Two consumers share this one adapter so their wire
 * behaviour cannot drift:
 *
 *   1. the live-prices refresh (src/prices/) — hourly quotes for the
 *      Prices board (Brent BZ=F, gold GC=F, silver SI=F, Bitcoin BTC-USD);
 *   2. the daily ingestion's Brent gap-fill (collect.ts) — when EIA's spot
 *      series on FRED lags (it stopped publishing 2026-10-06 while the
 *      market kept moving), Yahoo's daily closes extend the series so the
 *      stored history, percentiles and 7/30-day changes never rot.
 *
 * Keyless, unofficial — a browser-like UA avoids the 429/999 blocks a plain
 * curl UA gets (verified in the world-markets step-0 data check; the same
 * constants live in ../markets/definitions.ts for the index fetchers).
 */

import type { SeriesPoint } from '../series';

/** Yahoo chart endpoint (unofficial, keyless; v7 is dead — v8 only). */
export const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
/** User-Agent for Yahoo — a plain curl UA gets blocked with 429/999. */
export const YAHOO_CHART_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

/** One symbol's answer: the live quote plus its daily closes. */
export interface YahooQuote {
  /** The symbol requested (echoed from the definition, not the response). */
  symbol: string;
  /** Latest traded price (Yahoo `regularMarketPrice`). */
  livePrice: number;
  /** Daily closes, ascending by date; the LAST bar is the live session's provisional close. */
  points: SeriesPoint[];
  /**
   * Fix spec B-01 (2026-10-14): daily session HIGHS keyed by date — the
   * record-peak basis for the metals and Bitcoin ("highest daily high").
   * Absent when the response carries no high series (the closes still work).
   */
  highs?: ReadonlyMap<string, number>;
}

/** Thrown with the symbol in the message so per-asset fault isolation can log it. */
export class YahooQuoteError extends Error {
  constructor(symbol: string, message: string) {
    super(`[yahoo ${symbol}] ${message}`);
    this.name = 'YahooQuoteError';
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export interface YahooQuoteOptions {
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** User-Agent override (tests). */
  userAgent?: string;
  /** Request timeout; default 15 s. */
  timeoutMs?: number;
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return undefined; // environments without AbortSignal.timeout — fetch without a signal
  }
}

/**
 * Parse a v8 chart response into daily closes + the live price. Mirrors the
 * markets parser's rules: `adjclose` preferred, `close` accepted, deduped by
 * date keeping the last print, non-finite closes dropped. Throws loudly on
 * any shape drift — never returns partial guesses.
 */
export function parseYahooQuoteResponse(json: unknown, symbol: string): Omit<YahooQuote, 'symbol'> {
  let result: unknown;
  try {
    result = (json as { chart?: { result?: unknown[] } }).chart?.result?.[0];
  } catch {
    throw new YahooQuoteError(symbol, 'malformed chart envelope');
  }
  if (result === undefined || result === null) {
    const description = (json as { chart?: { error?: { description?: string } } })?.chart?.error?.description;
    throw new YahooQuoteError(symbol, `no chart.result${description !== undefined ? `: ${description}` : ''}`);
  }
  const r = result as {
    timestamp?: number[];
    indicators?: { quote?: { close?: (number | null)[]; high?: (number | null)[] }[]; adjclose?: { adjclose?: (number | null)[] }[] };
    meta?: { regularMarketPrice?: number };
  };
  const stamps = r.timestamp;
  if (!Array.isArray(stamps) || stamps.length === 0) {
    throw new YahooQuoteError(symbol, 'missing/empty timestamp array');
  }
  const closes = r.indicators?.quote?.[0]?.close;
  const adjcloses = r.indicators?.adjclose?.[0]?.adjclose;
  const highs = r.indicators?.quote?.[0]?.high;
  const series = Array.isArray(adjcloses) ? adjcloses : closes;
  if (!Array.isArray(series)) {
    throw new YahooQuoteError(symbol, 'neither adjclose nor close series present');
  }

  const byDate = new Map<string, number>();
  const highsByDate = new Map<string, number>();
  let livePrice = r.meta?.regularMarketPrice;
  for (let i = 0; i < stamps.length; i++) {
    const value = series[i];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    const day = new Date(stamps[i]! * 1000).toISOString().slice(0, 10);
    byDate.set(day, value); // keep the LAST print per date (a revision wins)
    // A session's provisional close is fresher than any printed close — the
    // live price always wins when it is present and sane.
    if (i === stamps.length - 1 && typeof livePrice !== 'number') livePrice = value;
    const high = highs?.[i];
    if (typeof high === 'number' && Number.isFinite(high) && high > 0) {
      highsByDate.set(day, Math.max(highsByDate.get(day) ?? 0, high));
    }
  }
  if (byDate.size === 0) {
    throw new YahooQuoteError(symbol, 'no date carried a positive close');
  }
  if (typeof livePrice !== 'number' || !Number.isFinite(livePrice) || livePrice <= 0) {
    throw new YahooQuoteError(symbol, 'missing/invalid regularMarketPrice');
  }
  const points: SeriesPoint[] = [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
  return { livePrice, points, ...(highsByDate.size > 0 ? { highs: highsByDate } : {}) };
}

/** Fetch one symbol's chart (daily interval). Range must cover the 30-day change window. */
export async function fetchYahooQuote(
  symbol: string,
  range = '40d',
  opts: YahooQuoteOptions = {},
): Promise<YahooQuote> {
  const url = `${opts.baseUrl ?? YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=1d`;
  const fetchImpl = opts.fetchImpl ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { 'user-agent': opts.userAgent ?? YAHOO_CHART_USER_AGENT, accept: 'application/json' },
      signal: timeoutSignal(opts.timeoutMs ?? 15_000),
    });
  } catch (err) {
    throw new YahooQuoteError(symbol, `transport failure: ${errMessage(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new YahooQuoteError(
      symbol,
      `HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new YahooQuoteError(symbol, 'non-JSON answer');
  }
  return { symbol, ...parseYahooQuoteResponse(json, symbol) };
}
