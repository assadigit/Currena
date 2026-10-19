/**
 * World stock markets — provider adapters (spec §3.2): EODHD (primary) and
 * Yahoo Finance (fallback) returning ONE common series shape.
 *
 * Parse halves are pure and total: a malformed answer throws a ProviderError
 * (never returns wrong data — the same discipline as every Insights parser).
 * Fetch halves take an INJECTED fetchImpl so unit tests replay saved sample
 * responses without touching the network (AGENTS.md rule 2: web-standard
 * fetch only, no node:*).
 *
 * The API token is a parameter, never a module constant: the Worker reads it
 * from its EODHD_API_TOKEN secret, the manual scripts from the environment —
 * it never appears in code or in error messages (rule: secrets stay secrets).
 */

import type { MarketId } from '@currena/core';
import type { SeriesPoint } from '../series';
import { insightsFetch } from '../adapters/fetch-policy';
import { providerFetchEnabled } from '../sources';
import {
  EODHD_BASE_URL,
  HISTORY_WINDOW_DAYS,
  YAHOO_BASE_URL,
  marketDefinition,
} from './definitions';

/** One provider's answer for one market: ascending daily closes. */
export interface MarketSeries {
  id: MarketId;
  source: 'eodhd' | 'yahoo';
  /** Daily closes, ascending by date, every close finite and > 0 (R1). */
  points: SeriesPoint[];
}

/** Provider failure — status + short excerpt, never the API token. */
export class ProviderError extends Error {
  constructor(
    public readonly provider: 'eodhd' | 'yahoo',
    public readonly marketId: MarketId,
    message: string,
  ) {
    super(`[${provider}] ${marketId}: ${message}`);
    this.name = 'ProviderError';
  }
}

/* ------------------------------------------------------------------ *
 * Pure parsers
 * ------------------------------------------------------------------ */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * EODHD EOD endpoint answer: `[{date, open, high, low, close,
 * adjusted_close, volume, warning?}, …]` (the trailing `warning` rides on
 * the LAST row on the free plan: "Data is limited by one year…").
 * An empty array is the provider's "no data for this ticker" answer (the
 * FTSE case) — a clean rejection, surfaced as a ProviderError.
 */
export function parseEodhdEodResponse(json: unknown, marketId: MarketId): SeriesPoint[] {
  if (!Array.isArray(json)) {
    throw new ProviderError('eodhd', marketId, 'response is not a JSON array');
  }
  if (json.length === 0) {
    throw new ProviderError('eodhd', marketId, 'empty answer — no data for this ticker');
  }
  const points: SeriesPoint[] = [];
  for (const row of json) {
    if (typeof row !== 'object' || row === null) continue;
    const date = (row as { date?: unknown }).date;
    const close = (row as { close?: unknown }).close;
    if (typeof date !== 'string' || !ISO_DATE_RE.test(date)) continue;
    // R1 at the parser level: a row without a positive finite close is dropped;
    // a response with no usable rows at all is a rejection.
    if (typeof close !== 'number' || !Number.isFinite(close) || close <= 0) continue;
    points.push({ date, value: close });
  }
  if (points.length === 0) {
    throw new ProviderError('eodhd', marketId, 'no row carried a positive close (R1)');
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return dedupeByDate(points, 'eodhd', marketId);
}

/**
 * Yahoo chart endpoint answer: `{chart: {result: [{timestamp: number[],
 * indicators: {adjclose?: [{adjclose: (number|null)[]}], quote: [{close:
 * (number|null)[]}]}}]}}`. Timestamps are seconds since epoch — dates render
 * in UTC so a day never shifts at Tehran's +3:30 (the house chart rule).
 * `adjclose` is preferred (it is what Yahoo's own UI charts); `close` is the
 * fallback when the adjclose block is absent (some index answers omit it).
 */
export function parseYahooChartResponse(json: unknown, marketId: MarketId): SeriesPoint[] {
  const chart = (json as { chart?: { result?: unknown[] } }).chart;
  const first = chart?.result?.[0];
  if (first === undefined) {
    throw new ProviderError('yahoo', marketId, 'missing chart.result');
  }
  const result: unknown = first;
  if (typeof result !== 'object' || result === null) {
    throw new ProviderError('yahoo', marketId, 'chart.result[0] is absent');
  }
  const timestamps = (result as { timestamp?: unknown }).timestamp;
  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    throw new ProviderError('yahoo', marketId, 'missing/empty timestamp array');
  }
  const indicators = (result as { indicators?: { adjclose?: { adjclose?: unknown }[]; quote?: { close?: unknown }[] } })
    .indicators;
  const adjclose = indicators?.adjclose?.[0]?.adjclose;
  const close = indicators?.quote?.[0]?.close;
  const values: unknown[] | undefined = Array.isArray(adjclose)
    ? adjclose
    : Array.isArray(close)
      ? close
      : undefined;
  if (values === undefined) {
    throw new ProviderError('yahoo', marketId, 'neither adjclose nor close series present');
  }
  const points: SeriesPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const value = values[i];
    if (typeof ts !== 'number' || !Number.isFinite(ts)) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue; // R1
    const date = new Date(ts * 1000).toISOString().slice(0, 10);
    points.push({ date, value });
  }
  if (points.length === 0) {
    throw new ProviderError('yahoo', marketId, 'no timestamp carried a positive close (R1)');
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return dedupeByDate(points, 'yahoo', marketId);
}

/** Keep the LAST close per date (a genuine revision wins over the earlier print). */
function dedupeByDate(points: SeriesPoint[], provider: 'eodhd' | 'yahoo', marketId: MarketId): SeriesPoint[] {
  const byDate = new Map<string, SeriesPoint>();
  for (const p of points) byDate.set(p.date, p);
  const out = [...byDate.values()];
  if (out.length === 0) throw new ProviderError(provider, marketId, 'series empty after dedupe');
  return out;
}

/* ------------------------------------------------------------------ *
 * Fetch halves (injected fetch — tests replay saved responses)
 * ------------------------------------------------------------------ */

export interface EodhdFetchOptions {
  /** Free-plan API token (secret — passed in, never stored here). */
  apiToken: string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** First history date requested (YYYY-MM-DD); default: ~400 days back. */
  from?: string;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout; default 15 s. */
  timeoutMs?: number;
}

/** EODHD EOD endpoint — one call per market (spec §3.2's exact URL shape). */
export async function fetchEodhdSeries(
  marketId: MarketId,
  opts: EodhdFetchOptions,
): Promise<MarketSeries> {
  // v3 M-6 kill switch (2026-10-20): a disabled register row is never requested.
  if (!providerFetchEnabled('eodhd')) {
    throw new ProviderError('eodhd', marketId, 'source disabled (kill switch M-6) — not requested');
  }
  const def = marketDefinition(marketId);
  if (def.eodhdCode === null) {
    // Verified unavailable on the free key (data-check file) — a clean
    // rejection so the chain falls through to Yahoo without wasting a call.
    throw new ProviderError('eodhd', marketId, 'no EODHD code for this market (see data-check)');
  }
  const from = opts.from ?? defaultFromDate(new Date());
  const url =
    `${opts.baseUrl ?? EODHD_BASE_URL}/eod/${encodeURIComponent(def.eodhdCode)}` +
    `?api_token=${encodeURIComponent(opts.apiToken)}&fmt=json&period=d&from=${from}`;
  let response: Response;
  try {
    response = await insightsFetch(url, {}, { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 });
  } catch (err) {
    throw new ProviderError('eodhd', marketId, `transport failure: ${errMessage(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ProviderError(
      'eodhd',
      marketId,
      `HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProviderError('eodhd', marketId, 'non-JSON answer');
  }
  return { id: marketId, source: 'eodhd', points: parseEodhdEodResponse(json, marketId) };
}

export interface YahooFetchOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
}

/** Yahoo chart endpoint — keyless fallback; a browser-like UA avoids 429s. */
export async function fetchYahooSeries(
  marketId: MarketId,
  opts: YahooFetchOptions = {},
): Promise<MarketSeries> {
  // v3 M-6 kill switch (2026-10-20): a disabled register row is never requested.
  if (!providerFetchEnabled('yahoo')) {
    throw new ProviderError('yahoo', marketId, 'source disabled (kill switch M-6) — not requested');
  }
  const def = marketDefinition(marketId);
  const url =
    `${opts.baseUrl ?? YAHOO_BASE_URL}/${encodeURIComponent(def.yahooSymbol)}` +
    `?range=1y&interval=1d`;
  let response: Response;
  try {
    response = await insightsFetch(
      url,
      { headers: { accept: 'application/json' } },
      { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 },
    );
  } catch (err) {
    throw new ProviderError('yahoo', marketId, `transport failure: ${errMessage(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ProviderError(
      'yahoo',
      marketId,
      `HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProviderError('yahoo', marketId, 'non-JSON answer');
  }
  return { id: marketId, source: 'yahoo', points: parseYahooChartResponse(json, marketId) };
}

/** The `from` date for EODHD: ~400 days back from today (UTC). */
export function defaultFromDate(now: Date): string {
  return new Date(now.getTime() - HISTORY_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
