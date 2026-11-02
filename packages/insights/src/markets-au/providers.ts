/**
 * @currena/insights/markets-au/providers — the Yahoo-only provider for the
 * Australian markets board (gap-closure S5-M5.4).
 *
 * Yahoo-only by the M5.1 probe decision (EODHD's free-plan ~20 calls/day
 * are already spent by the world board; the 18 AU symbols all returned
 * 22/22 fresh AUD-denominated ASX points — docs/gap-closure/evidence/m5.1/
 * yahoo-symbol-probe-2026-11-02.json). The parser is a verbatim clone of
 * the world board's parseYahooChartResponse/parseYahooQuoteMeta (same
 * shape, same R1, same dedupe), typed for AuMarketId so the two boards
 * can never collide.
 *
 * Pure parsers + injected fetch — tests replay saved sample responses
 * without touching the network (AGENTS.md rule 2: web-standard fetch
 * only, no node:*). The honest declared UA is the world board's
 * (YAHOO_USER_AGENT — re-exported from ./definitions); a refusal means
 * BLOCKED — fail closed, never a browser identity.
 */

import type { AuMarketId, AuMarketSource } from '@currena/core';
import type { SeriesPoint } from '../series';
import { insightsFetch } from '../adapters/fetch-policy';
import { providerFetchEnabled } from '../sources';
import { YAHOO_BASE_URL, YAHOO_USER_AGENT, auMarketDefinition } from './definitions';

/** One provider's answer for one AU market: ascending daily closes. */
export interface AuMarketSeries {
  id: AuMarketId;
  source: AuMarketSource;
  /** Daily closes, ascending by date, every close finite and > 0 (R1). */
  points: SeriesPoint[];
  /**
   * The quote's freshness metadata, when Yahoo carries any (its chart meta
   * carries regularMarketTime and usually marketState). Absent → the row
   * honestly renders Closed.
   */
  quoteMeta?: {
    marketState?: string;
    quoteTime?: string;
  };
}

/** Provider failure — status + short excerpt, never an API token. */
export class AuProviderError extends Error {
  constructor(
    public readonly provider: 'yahoo',
    public readonly marketId: AuMarketId,
    message: string,
  ) {
    super(`[yahoo-au] ${marketId}: ${message}`);
    this.name = 'AuProviderError';
  }
}

/* ------------------------------------------------------------------ *
 * Pure parsers (verbatim clones of the world board's Yahoo parsers)
 * ------------------------------------------------------------------ */

/**
 * Yahoo chart endpoint answer: `{chart: {result: [{timestamp, indicators:
 * {adjclose?: [{adjclose}], quote: [{close}]}}]}}`. Timestamps are seconds
 * since epoch — dates render in UTC so a day never shifts. `adjclose` is
 * preferred; `close` is the fallback.
 */
export function parseAuYahooChartResponse(json: unknown, marketId: AuMarketId): SeriesPoint[] {
  const chart = (json as { chart?: { result?: unknown[] } }).chart;
  const first = chart?.result?.[0];
  if (first === undefined) {
    throw new AuProviderError('yahoo', marketId, 'missing chart.result');
  }
  const result: unknown = first;
  if (typeof result !== 'object' || result === null) {
    throw new AuProviderError('yahoo', marketId, 'chart.result[0] is absent');
  }
  const timestamps = (result as { timestamp?: unknown }).timestamp;
  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    throw new AuProviderError('yahoo', marketId, 'missing/empty timestamp array');
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
    throw new AuProviderError('yahoo', marketId, 'neither adjclose nor close series present');
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
    throw new AuProviderError('yahoo', marketId, 'no timestamp carried a positive close (R1)');
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return dedupeAuByDate(points, marketId);
}

/**
 * Yahoo chart meta → quoteMeta. Pure and total: a missing meta, a
 * non-numeric regularMarketTime or an unknown marketState shape all
 * degrade to an absent field — never a throw, never a guess.
 */
export function parseAuYahooQuoteMeta(json: unknown): AuMarketSeries['quoteMeta'] {
  const result = (json as { chart?: { result?: unknown[] } }).chart?.result?.[0];
  if (typeof result !== 'object' || result === null) return undefined;
  const meta = (result as { meta?: Record<string, unknown> }).meta;
  if (typeof meta !== 'object' || meta === null) return undefined;
  const out: NonNullable<AuMarketSeries['quoteMeta']> = {};
  const state = meta['marketState'];
  if (typeof state === 'string' && state.length > 0) out.marketState = state;
  const time = meta['regularMarketTime'];
  if (typeof time === 'number' && Number.isFinite(time) && time > 0) {
    out.quoteTime = new Date(time * 1000).toISOString();
  }
  return out.marketState === undefined && out.quoteTime === undefined ? undefined : out;
}

/** Keep the LAST close per date (a genuine revision wins). */
function dedupeAuByDate(points: SeriesPoint[], marketId: AuMarketId): SeriesPoint[] {
  const byDate = new Map<string, SeriesPoint>();
  for (const p of points) byDate.set(p.date, p);
  const out = [...byDate.values()];
  if (out.length === 0) throw new AuProviderError('yahoo', marketId, 'series empty after dedupe');
  return out;
}

/* ------------------------------------------------------------------ *
 * Fetch half (injected fetch — tests replay saved responses)
 * ------------------------------------------------------------------ */

export interface AuYahooFetchOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
}

/**
 * Yahoo chart endpoint — keyless; the honest declared UA (the world
 * board's YAHOO_USER_AGENT — a refusal means BLOCKED, fail closed, never
 * a spoofed browser identity). range=10y so the 5-year lens's 1826-day
 * anchor always carries real closes (the world board's round-47 growth,
 * kept here so the AU tiles' 5-year column is honest, never a dash when
 * Yahoo itself serves the data). One polite request per market, 15 s
 * timeout.
 */
export async function fetchAuYahooSeries(
  marketId: AuMarketId,
  opts: AuYahooFetchOptions = {},
): Promise<AuMarketSeries> {
  if (!providerFetchEnabled('yahoo')) {
    throw new AuProviderError('yahoo', marketId, 'source disabled (kill switch M-6) — not requested');
  }
  const def = auMarketDefinition(marketId);
  const url =
    `${opts.baseUrl ?? YAHOO_BASE_URL}/${encodeURIComponent(def.yahooSymbol)}` +
    `?range=10y&interval=1d`;
  let response: Response;
  try {
    response = await insightsFetch(
      url,
      {
        headers: {
          accept: 'application/json',
          // The honest declared UA (v3 SCRAPING_SPEC T-25/F-09) — never a
          // spoofed browser identity; a refusal means BLOCKED (fail closed).
          'user-agent': opts.userAgent ?? YAHOO_USER_AGENT,
        },
      },
      { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 },
    );
  } catch (err) {
    throw new AuProviderError('yahoo', marketId, `transport failure: ${auErrMessage(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AuProviderError(
      'yahoo',
      marketId,
      `HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AuProviderError('yahoo', marketId, 'non-JSON answer');
  }
  return {
    id: marketId,
    source: 'yahoo',
    points: parseAuYahooChartResponse(json, marketId),
    quoteMeta: parseAuYahooQuoteMeta(json),
  };
}

function auErrMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
