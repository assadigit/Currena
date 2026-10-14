/**
 * World currencies — provider adapters (spec §4.2): Frankfurter v1 (the
 * frozen ECB-only API, primary) and Yahoo Finance (keyless fallback)
 * returning ONE common shape: per-currency USD-side series.
 *
 * All 10 pairs come from ONE request (spec §4.1 rule 4): the crosses are
 * derived in code (compute.ts), never fetched. The Yahoo fallback fetches
 * the 6 fx currencies + the 2 basket currencies (CAD, SEK) as pair symbols
 * (one call each) and inverts the ones quoted the other way — 8 calls,
 * used only when the primary fails.
 *
 * Parse halves are pure and total: a malformed answer throws a ProviderError
 * (never returns wrong data). Fetch halves take an INJECTED fetchImpl so
 * unit tests replay saved sample responses without touching the network
 * (AGENTS.md rule 2: web-standard fetch only, no node:*).
 */

import type { FxCurrency } from '@currena/core';
import type { SeriesPoint } from '../series';
import {
  FRANKFURTER_BASE_URL,
  FX_BASKET_CURRENCIES,
  FX_CURRENCIES,
  FX_HISTORY_DAYS,
  YAHOO_BASE_URL,
  YAHOO_USER_AGENT,
} from './definitions';

/** Every currency the fx run asks providers about (6 fx + CAD + SEK for the basket). */
export type FxQuoteCurrency = FxCurrency | 'CAD' | 'SEK';
export const FX_QUOTE_CURRENCIES: readonly FxQuoteCurrency[] = [...FX_CURRENCIES, ...FX_BASKET_CURRENCIES];

/**
 * The per-currency USD-side series a run produced (units of currency X per
 * 1 USD — exactly what Frankfurter returns with base=USD). A currency the
 * provider did not serve is simply absent; the compute layer treats an
 * absent leg honestly (never a guess).
 */
export type FxQuoteSet = Partial<Record<FxQuoteCurrency, SeriesPoint[]>>;

/** One provider's whole-currency answer. */
export interface FxQuotes {
  source: 'frankfurter' | 'yahoo';
  quotes: FxQuoteSet;
}

/** Provider failure — status + short excerpt; never anything secret. */
export class FxProviderError extends Error {
  constructor(
    public readonly provider: 'frankfurter' | 'yahoo',
    message: string,
  ) {
    super(`[fx:${provider}] ${message}`);
    this.name = 'FxProviderError';
  }
}

/* ------------------------------------------------------------------ *
 * Pure parsers
 * ------------------------------------------------------------------ */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Frankfurter v1 timeseries answer:
 * `{ amount, base, start_date, end_date, rates: { "2026-10-12": { EUR: 0.9, … }, … } }`.
 * Dates ride as JSON object keys (string-sorted ascending in practice, but
 * the parser sorts anyway); a rate that is not a positive finite number is
 * dropped (V1 at the parser level).
 */
export function parseFrankfurterResponse(json: unknown): FxQuoteSet {
  if (typeof json !== 'object' || json === null) {
    throw new FxProviderError('frankfurter', 'response is not a JSON object');
  }
  const rates = (json as { rates?: unknown }).rates;
  if (typeof rates !== 'object' || rates === null) {
    throw new FxProviderError('frankfurter', 'missing rates object');
  }
  const out: FxQuoteSet = {};
  for (const [date, row] of Object.entries(rates)) {
    if (!ISO_DATE_RE.test(date)) continue;
    if (typeof row !== 'object' || row === null) continue;
    for (const [code, value] of Object.entries(row)) {
      if (!isQuoteCurrency(code)) continue;
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue; // V1
      const list = out[code] ?? (out[code] = []);
      list.push({ date, value });
    }
  }
  const served = Object.keys(out);
  if (served.length === 0) {
    throw new FxProviderError('frankfurter', 'no row carried a usable rate (V1)');
  }
  for (const code of served) {
    const points = out[code as FxQuoteCurrency]!;
    points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    // Keep the LAST rate per date (a revision wins over the earlier print).
    const byDate = new Map<string, SeriesPoint>();
    for (const p of points) byDate.set(p.date, p);
    out[code as FxQuoteCurrency] = [...byDate.values()];
  }
  return out;
}

function isQuoteCurrency(code: string): code is FxQuoteCurrency {
  return (FX_QUOTE_CURRENCIES as readonly string[]).includes(code);
}

/**
 * Yahoo chart endpoint answer (the same shape the markets providers parse):
 * `{chart: {result: [{timestamp, indicators: {quote: [{close}]}}]}}` for a
 * QUOTE-PER-USD symbol (`JPY=X`, `CHF=X`, `CNY=X`, `CAD=X`, `SEK=X`) or a
 * USD-PER-QUOTE symbol (`EURUSD=X`, `GBPUSD=X`, `AUDUSD=X`) — `inverse`
 * flips the series in the adapter below, so the parse half only extracts
 * ascending closes.
 */
export function parseYahooFxResponse(json: unknown, symbol: string): SeriesPoint[] {
  const chart = (json as { chart?: { result?: unknown[] } }).chart;
  const first = chart?.result?.[0];
  if (first === undefined) throw new FxProviderError('yahoo', `missing chart.result for ${symbol}`);
  if (typeof first !== 'object' || first === null) {
    throw new FxProviderError('yahoo', `chart.result[0] absent for ${symbol}`);
  }
  const timestamps = (first as { timestamp?: unknown }).timestamp;
  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    throw new FxProviderError('yahoo', `missing/empty timestamp array for ${symbol}`);
  }
  const quote = (first as { indicators?: { quote?: { close?: unknown }[] } }).indicators?.quote?.[0]?.close;
  if (!Array.isArray(quote)) throw new FxProviderError('yahoo', `no close series for ${symbol}`);
  const points: SeriesPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const value = quote[i];
    if (typeof ts !== 'number' || !Number.isFinite(ts)) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue; // V1
    points.push({ date: new Date(ts * 1000).toISOString().slice(0, 10), value });
  }
  if (points.length === 0) throw new FxProviderError('yahoo', `no usable close for ${symbol} (V1)`);
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const byDate = new Map<string, SeriesPoint>();
  for (const p of points) byDate.set(p.date, p);
  return [...byDate.values()];
}

/* ------------------------------------------------------------------ *
 * Fetch halves (injected fetch — tests replay saved responses)
 * ------------------------------------------------------------------ */

export interface FrankfurterFetchOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  /** First history date requested (YYYY-MM-DD); default: ~400 days back. */
  from?: string;
  timeoutMs?: number;
}

/**
 * The ONE primary call (spec §4.2's exact URL shape): all 8 currencies in a
 * single timeseries request with the dollar as base.
 */
export async function fetchFrankfurterQuotes(opts: FrankfurterFetchOptions = {}): Promise<FxQuotes> {
  const from = opts.from ?? defaultFxFromDate(new Date());
  const symbols = FX_QUOTE_CURRENCIES.join(',');
  const url =
    `${opts.baseUrl ?? FRANKFURTER_BASE_URL}/${from}..?base=USD&symbols=${encodeURIComponent(symbols)}`;
  const fetchImpl = opts.fetchImpl ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));
  let response: Response;
  try {
    response = await fetchImpl(url, { signal: timeoutSignal(opts.timeoutMs ?? 15_000) });
  } catch (err) {
    throw new FxProviderError('frankfurter', `transport failure: ${errMessage(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new FxProviderError(
      'frankfurter',
      `HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new FxProviderError('frankfurter', 'non-JSON answer');
  }
  return { source: 'frankfurter', quotes: parseFrankfurterResponse(json) };
}

/** How each currency maps onto a Yahoo pair symbol + its quoting direction. */
const YAHOO_SYMBOLS: Readonly<Record<FxQuoteCurrency, { symbol: string; inverse: boolean }>> = {
  // quote-per-USD symbols ride directly
  JPY: { symbol: 'JPY=X', inverse: false },
  CHF: { symbol: 'CHF=X', inverse: false },
  CNY: { symbol: 'CNY=X', inverse: false },
  CAD: { symbol: 'CAD=X', inverse: false },
  SEK: { symbol: 'SEK=X', inverse: false },
  // USD-per-quote symbols need the reciprocal
  EUR: { symbol: 'EURUSD=X', inverse: true },
  GBP: { symbol: 'GBPUSD=X', inverse: true },
  AUD: { symbol: 'AUDUSD=X', inverse: true },
};

export interface YahooFxFetchOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
  /** Restrict the fallback to these currencies (default: all 8). */
  only?: readonly FxQuoteCurrency[];
}

/**
 * The fallback: one chart call per currency (8 calls, spec §4.2's Yahoo
 * column), inverted where Yahoo quotes USD-per-currency, so the answer has
 * the same USD-side shape as Frankfurter's. A single currency's failure
 * drops just that currency (the compute layer degrades honestly) — but the
 * whole fallback fails when NO currency answered.
 */
export async function fetchYahooQuotes(opts: YahooFxFetchOptions = {}): Promise<FxQuotes> {
  const fetchImpl = opts.fetchImpl ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));
  const wanted = opts.only ?? FX_QUOTE_CURRENCIES;
  const out: FxQuoteSet = {};
  let failures = 0;
  for (const code of wanted) {
    const def = YAHOO_SYMBOLS[code];
    if (def === undefined) continue; // not a quote currency — skip honestly
    // range=2y (D-14, was 1y): the y1 change needs a point on/before
    // last.date − 12 months; a 1y window has ~zero margin for that anchor
    // (a leap-year 12-month span or a post-weekend first bar leaves it
    // missing → the pair is held exactly when Frankfurter is down — the
    // fallback's whole purpose). 2y gives ~125 days of margin for the same
    // 8 calls; the primary's own window stays 400 days (FX_HISTORY_DAYS).
    const url =
      `${opts.baseUrl ?? YAHOO_BASE_URL}/${encodeURIComponent(def.symbol)}` + `?range=2y&interval=1d`;
    try {
      let response: Response;
      try {
        response = await fetchImpl(url, {
          headers: { 'user-agent': opts.userAgent ?? YAHOO_USER_AGENT, accept: 'application/json' },
          signal: timeoutSignal(opts.timeoutMs ?? 15_000),
        });
      } catch (err) {
        throw new FxProviderError('yahoo', `transport failure for ${def.symbol}: ${errMessage(err)}`);
      }
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new FxProviderError(
          'yahoo',
          `HTTP ${response.status} for ${def.symbol}: ${body.slice(0, 120).replace(/\s+/g, ' ')}`,
        );
      }
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new FxProviderError('yahoo', `non-JSON answer for ${def.symbol}`);
      }
      const points = parseYahooFxResponse(json, def.symbol);
      out[code] = def.inverse ? points.map((p) => ({ date: p.date, value: 1 / p.value })) : points;
    } catch (err) {
      failures++;
      console.warn(`[fx:yahoo] ${code} failed: ${errMessage(err)}`);
    }
  }
  if (Object.keys(out).length === 0) {
    throw new FxProviderError('yahoo', `every currency failed (${failures} calls)`);
  }
  return { source: 'yahoo', quotes: out };
}

/** The `from` date for the primary call: ~400 days back from today (UTC). */
export function defaultFxFromDate(now: Date): string {
  return new Date(now.getTime() - FX_HISTORY_DAYS * 86_400_000).toISOString().slice(0, 10);
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return undefined; // Very old runtimes — the platform's own timeout applies.
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
