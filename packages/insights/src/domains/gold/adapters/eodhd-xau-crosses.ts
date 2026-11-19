/**
 * eodhd-xau-crosses.ts — GPE R26 / F10 (2026-11-19): the EODHD series
 * adapter for the multi-currency gold grid's legs — the two NATIVE XAU
 * crosses (XAUEUR, XAUAUD — the only ones the provider's FOREX exchange
 * carries, verified live s14 M1 §4a) and the three plain FX legs the
 * derived crosses ride (USDJPY, GBPUSD, USDCNY).
 *
 * The eodhd-xauusd twin's discipline verbatim (S13-D1): the same EOD
 * endpoint URL shape, the same parse (imported — one row-shape contract,
 * never two), the same token-as-parameter rule, the same kill switch,
 * and the same S13-D3 final-bars-only guard (today's partial bar is
 * dropped at parse time).
 */

import { providerFetchEnabled } from '../../../shared/sources';
import { insightsFetch } from '../../../shared/adapters/fetch-policy';
import { BlockedError, FormatChangedError } from '../../../shared/adapters/fetch-policy';
import { EODHD_BASE_URL, parseEodhdXauusdResponse } from './eodhd-xauusd';

/** The adapter's failure — status + short excerpt, never the API token. */
export class EodhdCrossError extends Error {
  constructor(message: string) {
    super(`[eodhd-xau-crosses] ${message}`);
    this.name = 'EodhdCrossError';
  }
}

export interface EodhdSeriesFetchOptions {
  /** The EODHD ticker, e.g. 'XAUEUR.FOREX' or 'USDJPY.FOREX'. */
  code: string;
  /** The plan's API token (secret — passed in, never stored here). */
  apiToken: string;
  /** First history date requested (YYYY-MM-DD); default: ~400 days back. */
  from?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout; default 15 s. */
  timeoutMs?: number;
  /** The UTC "today" for the partial-bar guard (tests); default: the real clock. */
  todayUtc?: string;
}

/**
 * Fetch one EODHD daily series (the XAUUSD fetch's shape, parameterized
 * by ticker). ONE polite single-attempt request (F-11) — the rung
 * re-tries on its own cadence, never here.
 */
export async function fetchEodhdSeries(
  opts: EodhdSeriesFetchOptions,
): Promise<Array<{ date: string; open: number; high: number; low: number; close: number }>> {
  // v3 M-6 kill switch: a disabled register row is never requested.
  if (!providerFetchEnabled('eodhd')) {
    throw new EodhdCrossError('source disabled (kill switch M-6) — not requested');
  }
  if (opts.apiToken === '') {
    throw new EodhdCrossError('no EODHD token — skipping the fetch (the secret is unset)');
  }
  const todayUtc = opts.todayUtc ?? new Date().toISOString().slice(0, 10);
  const from =
    opts.from ??
    new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
  const url =
    `${opts.baseUrl ?? EODHD_BASE_URL}/eod/${encodeURIComponent(opts.code)}` +
    `?api_token=${encodeURIComponent(opts.apiToken)}&fmt=json&period=d&from=${from}`;
  let response: Response;
  try {
    response = await insightsFetch(url, {}, { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 });
  } catch (err) {
    if (err instanceof BlockedError) throw err; // the block taxonomy rides as-is
    throw new EodhdCrossError(`transport failure (${opts.code}): ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new EodhdCrossError(`HTTP ${response.status} (${opts.code}): ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new FormatChangedError(`non-JSON answer (${opts.code})`);
  }
  return parseEodhdXauusdResponse(json, todayUtc);
}
