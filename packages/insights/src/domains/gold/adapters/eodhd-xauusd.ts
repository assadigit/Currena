/**
 * eodhd-xauusd.ts — GPE R18 / F7 (2026-11-18): the XAUUSD daily OHLC
 * adapter — EODHD `XAUUSD.FOREX` bars (docs/specs/gold-page-elevation:
 * s8/01 R18's adapter naming · s8/02 §1a row 3 · the s13 M1 §4a probe).
 *
 * The markets worker's EODHD client pattern, reused verbatim in the gold
 * domain (S13-D1): the same EOD endpoint URL shape, the same parse
 * discipline (pure + total — a malformed answer throws, never returns
 * wrong data), the same token-as-parameter rule (the secret is injected,
 * never a module constant, never in an error message), and the same
 * `providerFetchEnabled('eodhd')` kill switch (M-6 — a disabled register
 * row is never requested).
 *
 * The free-tier depth posture (S13-D1): the plan serves ~1 year of
 * history (the 2026-11-18 probe: 361 rows + the provider's own "Data is
 * limited by one year" warning). `from` is honored inside that window —
 * the bootstrap asks wide and receives the window; the daily append asks
 * for the trailing days and receives exactly those.
 *
 * Parse halves are pure and total; fetch halves take an INJECTED
 * fetchImpl so unit tests replay saved responses without touching the
 * network (AGENTS.md rule 2: web-standard fetch only, no node:*).
 */

import { providerFetchEnabled } from '../../../shared/sources';
import { insightsFetch } from '../../../shared/adapters/fetch-policy';
import { BlockedError, FormatChangedError } from '../../../shared/adapters/fetch-policy';

/** The EODHD base (the markets providers' own constant, restated per the lean-domain rule). */
export const EODHD_BASE_URL = 'https://eodhd.com/api';

/** The gold chart's series ticker (EODHD's forex spot gold — the C1-named series). */
export const XAUUSD_EODHD_CODE = 'XAUUSD.FOREX';

/** The provider URL the card names at point of use (C1/C6). */
export const XAUUSD_SOURCE_URL = `${EODHD_BASE_URL}/eod/${XAUUSD_EODHD_CODE}`;

/** The adapter's failure — status + short excerpt, never the API token. */
export class EodhdXauError extends Error {
  constructor(message: string) {
    super(`[eodhd-xauusd] ${message}`);
    this.name = 'EodhdXauError';
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse an EODHD EOD answer into final daily bars. The row shape is the
 * markets provider's own (`{date, open, high, low, close, adjusted_close,
 * volume, warning?}` — the trailing `warning` rides on the LAST row on
 * the free plan and is ignored). Fail-closed rules:
 *   - not a JSON array / an empty array → FormatChangedError (F-16);
 *   - a row without a well-formed date or a positive finite OHLC quad →
 *     dropped (the R1 discipline); no usable row at all → FormatChangedError;
 *   - keep the LAST row per date (a genuine revision wins on merge).
 * `todayUtc` (YYYY-MM-DD) drops rows dated today or later — the forex day
 * wraps 22:00 UTC and today's bar can still be partial (S13-D3).
 */
export function parseEodhdXauusdResponse(
  json: unknown,
  todayUtc: string,
): Array<{ date: string; open: number; high: number; low: number; close: number }> {
  if (!Array.isArray(json)) {
    throw new FormatChangedError('response is not a JSON array');
  }
  const byDate = new Map<string, { date: string; open: number; high: number; low: number; close: number }>();
  for (const row of json) {
    if (typeof row !== 'object' || row === null) continue;
    const r = row as Record<string, unknown>;
    const date = r['date'];
    if (typeof date !== 'string' || !ISO_DATE_RE.test(date)) continue;
    if (date >= todayUtc) continue; // S13-D3: final bars only
    const open = r['open'];
    const high = r['high'];
    const low = r['low'];
    const close = r['close'];
    if (
      typeof open !== 'number' || !Number.isFinite(open) || open <= 0 ||
      typeof high !== 'number' || !Number.isFinite(high) || high <= 0 ||
      typeof low !== 'number' || !Number.isFinite(low) || low <= 0 ||
      typeof close !== 'number' || !Number.isFinite(close) || close <= 0
    ) {
      continue; // a malformed row is dropped, never guessed
    }
    byDate.set(date, { date, open, high, low, close });
  }
  if (byDate.size === 0) {
    throw new FormatChangedError('no final bar carried a positive finite OHLC quad');
  }
  const out = [...byDate.values()];
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

export interface EodhdXauFetchOptions {
  /** The plan's API token (secret — passed in, never stored here). */
  apiToken: string;
  /** First history date requested (YYYY-MM-DD); default: ~400 days back (the markets client's window). */
  from?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout; default 15 s (the EOD endpoint's own cadence). */
  timeoutMs?: number;
  /** The UTC "today" for the partial-bar guard (tests); default: the real clock. */
  todayUtc?: string;
}

/** The default `from` (~400 days back — the markets client's own window). */
export function xauDefaultFromDate(now: Date): string {
  return new Date(now.getTime() - 400 * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Fetch the XAUUSD daily bars. ONE polite single-attempt request (F-11) —
 * the rung re-tries on its own cadence, never here.
 */
export async function fetchEodhdXauusdOhlc(
  opts: EodhdXauFetchOptions,
): Promise<Array<{ date: string; open: number; high: number; low: number; close: number }>> {
  // v3 M-6 kill switch: a disabled register row is never requested.
  if (!providerFetchEnabled('eodhd')) {
    throw new EodhdXauError('source disabled (kill switch M-6) — not requested');
  }
  if (opts.apiToken === '') {
    // The markets worker's own calm degradation: a missing secret fails
    // fast rather than spending a subrequest on a guaranteed 401.
    throw new EodhdXauError('no EODHD token — skipping the fetch (the secret is unset)');
  }
  const todayUtc = opts.todayUtc ?? new Date().toISOString().slice(0, 10);
  const from = opts.from ?? xauDefaultFromDate(new Date());
  const url =
    `${opts.baseUrl ?? EODHD_BASE_URL}/eod/${encodeURIComponent(XAUUSD_EODHD_CODE)}` +
    `?api_token=${encodeURIComponent(opts.apiToken)}&fmt=json&period=d&from=${from}`;
  let response: Response;
  try {
    response = await insightsFetch(url, {}, { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 });
  } catch (err) {
    if (err instanceof BlockedError) throw err; // the block taxonomy rides as-is
    throw new EodhdXauError(`transport failure: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new EodhdXauError(`HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new FormatChangedError('non-JSON answer');
  }
  return parseEodhdXauusdResponse(json, todayUtc);
}
