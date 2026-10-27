/**
 * Global companies — the EODHD adapter STUB (R10-3, 2026-10-28).
 *
 * The owner's R9-09 directive was blocked on the EODHD free-plan quota
 * (20 calls/day total — the markets board already consumes ~16–18).
 * R10-3 ships the table BEHIND A FEATURE FLAG (OFF by default): the
 * UI renders the empty state, the cron rung is NOT WIRED, and this
 * adapter makes ZERO live calls until the flag flips on.
 *
 * What this module ships TODAY:
 *  - The zod contract for EODHD's `/api/eod/{symbol}` response (the
 *    same shape the markets board consumes, parsed here against the
 *    company ticker rather than the index INDX code).
 *  - A `fetchCompanyEod` function that joins the contract to the fetch
 *    policy (insightsFetch — single-attempt, honest UA, blocked =
 *    blocked). It is exercised by unit tests against fixtures; no test
 *    ever makes a live call.
 *  - The `parseCompanyEodResponse` pure parser + a `deriveCompanyReading`
 *    helper that lifts the latest close + the daily change percent
 *    from a parsed series — exactly the columns the UI table renders.
 *
 * What this module does NOT ship today (the future flip):
 *  - A `companies` fetch rung on the markets worker. When the owner
 *    upgrades the EODHD plan (R9-09 audit: any tier that lifts the
 *    20/day ceiling OR unlocks the bulk-last-day endpoint), the flip
 *    procedure in ROUND10_REPORT.md adds the rung (one new file under
 *    apps/markets/src/ + one entry in the cron schedule) — this
 *    adapter is the rung's payload, unchanged.
 *
 * The contract mirrors the markets board's parseEodhdEodResponse
 * (packages/insights/src/markets/providers.ts) — EODHD serves the
 * same JSON shape for indices and equities. A separate zod schema
 * here keeps the company-table's failure mode isolated (a future
 * EODHD redesign that breaks equities but not indices surfaces as a
 * zod failure, not a markets-board outage).
 */

import { z } from 'zod';
import { insightsFetch } from '../adapters/fetch-policy';
import { EODHD_BASE_URL } from '../markets/definitions';
import { companyByTicker } from './definitions';
import type { CompanyDefinition } from './definitions';

/* ------------------------------------------------------------------ *
 * The zod contract — EODHD /api/eod/{symbol} response
 * ------------------------------------------------------------------ */

/**
 * ONE row of EODHD's /api/eod/{symbol} response. The full real-world
 * row carries {date, open, high, low, close, adjusted_close, volume,
 * warning?}; the company table reads only `date` + `close` (the daily
 * change % derives from the last two closes; the sparkline skeleton
 * reads the trailing 7-day slice).
 *
 * The schema is strict on the two fields it consumes and permissive on
 * the rest (EODHD adds fields over time; an upstream addition must
 * never fail the parse). `adjusted_close` is preferred when present
 * (the markets board's convention — splits and dividends adjust the
 * close, so the daily change % stays honest across corporate actions).
 */
export const CompanyEodRowSchema = z.object({
  /** ISO calendar date — the row's trading day. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'EODHD row.date must be YYYY-MM-DD'),
  /** The raw close price (a positive finite number). */
  close: z.number().finite().positive(),
  /** The split/dividend-adjusted close (EODHD's preferred series). */
  adjusted_close: z.number().finite().positive().optional(),
  /** The other EODHD fields — kept permissive so upstream additions pass. */
  open: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  volume: z.number().optional(),
  warning: z.string().optional(),
});

/**
 * The full response: a JSON array of rows. EODHD returns `[]` when the
 * ticker is unknown (the FTSE-on-free-key case) — a clean rejection
 * surfaced as a CompanyAdapterError, never an empty series.
 */
export const CompanyEodResponseSchema = z.array(CompanyEodRowSchema);

/** A parsed row (the post-zod type — the fields the table consumes). */
export type CompanyEodRow = z.infer<typeof CompanyEodRowSchema>;

/* ------------------------------------------------------------------ *
 * Errors + the pure parser
 * ------------------------------------------------------------------ */

/** A typed adapter error (mirrors the markets board's ProviderError). */
export class CompanyAdapterError extends Error {
  readonly reason: 'empty' | 'no-rows' | 'transport' | 'bad-json';
  readonly ticker: string;
  constructor(ticker: string, reason: CompanyAdapterError['reason'], message: string) {
    super(`companies:${ticker} — ${reason}: ${message}`);
    this.name = 'CompanyAdapterError';
    this.ticker = ticker;
    this.reason = reason;
  }
}

/** One point in a company's parsed daily series (date + adjusted close). */
export interface CompanySeriesPoint {
  /** ISO calendar date. */
  date: string;
  /** The adjusted close when present, else the raw close. */
  value: number;
}

/**
 * Parse + validate an EODHD /api/eod/{symbol} response against the zod
 * contract. Pure: a fetch caller passes the raw JSON, the parser
 * returns the series. An empty array throws `empty`; a malformed row
 * throws the zod error (a typed CompanyAdapterError wraps it).
 *
 * The free plan appends a trailing `{warning: "..."}` object to the
 * response — the markets board's parseEodhdEodResponse drops it
 * silently (no `date` field, so it is not a data row). This parser
 * mirrors that discipline: the filter runs BEFORE the zod schema so
 * the array parse stays strict on every remaining row.
 */
export function parseCompanyEodResponse(ticker: string, json: unknown): CompanySeriesPoint[] {
  if (!Array.isArray(json)) {
    throw new CompanyAdapterError(ticker, 'bad-json', 'response is not a JSON array');
  }
  // Drop the trailing warning object (no `date` field — not a data row).
  // A row-shaped object missing the date is a real layout change; the
  // zod parse below catches it. The filter only drops objects that are
  // NOT row-shaped (no string `date` key at all).
  const candidateRows = json.filter(
    (row): row is Record<string, unknown> =>
      typeof row === 'object' && row !== null && typeof (row as { date?: unknown }).date === 'string',
  );
  if (json.length > 0 && candidateRows.length === 0) {
    throw new CompanyAdapterError(ticker, 'empty', 'no row carried a string `date` (layout change?)');
  }
  if (candidateRows.length === 0) {
    throw new CompanyAdapterError(ticker, 'empty', 'EODHD returned no rows (unknown ticker on this key?)');
  }
  let rows: CompanyEodRow[];
  try {
    rows = CompanyEodResponseSchema.parse(candidateRows);
  } catch (err) {
    throw new CompanyAdapterError(ticker, 'bad-json', `zod parse failed: ${(err as Error).message.slice(0, 160)}`);
  }
  const points: CompanySeriesPoint[] = rows
    .map((row) => ({
      date: row.date,
      value: row.adjusted_close ?? row.close,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (points.length === 0) {
    throw new CompanyAdapterError(ticker, 'no-rows', 'no row carried a positive close (R1)');
  }
  return points;
}

/* ------------------------------------------------------------------ *
 * The derived reading — exactly the columns the UI table renders
 * ------------------------------------------------------------------ */

/** The UI's per-company row (the table's data shape). */
export interface CompanyReading {
  /** The company definition (ticker + Latin name + exchange label). */
  company: CompanyDefinition;
  /** The latest available daily close, in the listing currency. */
  price: number;
  /** ISO date of the latest close (the row's "as of" date). */
  asOf: string;
  /** Day-over-day change in PERCENT (close vs previous close). */
  dailyChangePct: number;
  /** Trailing 7-day series for the sparkline skeleton (oldest → newest). */
  sparkline: number[];
}

/**
 * Lift a CompanyReading out of a parsed series. Pure: the parser
 * produces the series, this helper derives the table columns.
 *
 * A one-row series carries no daily change (no previous close) — the
 * helper returns `dailyChangePct: 0` and a one-point sparkline. The UI
 * renders an em-dash for the change column when the series is too
 * short (the same honesty discipline as the markets table).
 */
export function deriveCompanyReading(ticker: string, series: CompanySeriesPoint[]): CompanyReading {
  const company = companyByTicker(ticker);
  if (series.length === 0) {
    throw new CompanyAdapterError(ticker, 'no-rows', 'deriveCompanyReading: empty series');
  }
  const last = series[series.length - 1]!;
  const prev = series.length >= 2 ? series[series.length - 2]! : null;
  const dailyChangePct = prev === null ? 0 : ((last.value - prev.value) / prev.value) * 100;
  const sparkline = series.slice(-7).map((p) => p.value);
  return {
    company,
    price: last.value,
    asOf: last.date,
    dailyChangePct,
    sparkline,
  };
}

/* ------------------------------------------------------------------ *
 * The fetch stub — exercised by tests; never invoked by the cron
 * ------------------------------------------------------------------ */

export interface CompanyFetchOptions {
  /** EODHD API token (the owner's key, env-only). */
  apiToken: string;
  /** First history date requested (YYYY-MM-DD); default: ~30 days back. */
  from?: string;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Injectable fetch (tests). */
  fetchImpl?: typeof fetch;
  /** Request timeout; default 12 s (insightsFetch default). */
  timeoutMs?: number;
}

/**
 * Fetch + parse ONE company's EOD series. STUB: zero live calls while
 * the feature flag is off — the UI never invokes this, no cron rung
 * references it. Unit tests exercise it against fixtures.
 *
 * The URL shape mirrors the markets board's fetchEodhdSeries (the same
 * /api/eod/{symbol} endpoint, the same fmt=json&period=d query, the
 * same from= window) — keeping the two consumers' EODHD footprint
 * uniform so a future plan upgrade's quota arithmetic is one calculation.
 */
export async function fetchCompanyEod(
  ticker: string,
  opts: CompanyFetchOptions,
): Promise<CompanySeriesPoint[]> {
  // Re-validate the ticker against the config — a typo never wastes a call.
  companyByTicker(ticker);
  if (!opts.apiToken) {
    throw new CompanyAdapterError(ticker, 'transport', 'no api token (env EODHD_API_TOKEN unset)');
  }
  const from = opts.from ?? defaultCompanyFromDate();
  const url =
    `${opts.baseUrl ?? EODHD_BASE_URL}/eod/${encodeURIComponent(ticker)}` +
    `?api_token=${encodeURIComponent(opts.apiToken)}&fmt=json&period=d&from=${from}`;
  let response: Response;
  try {
    response = await insightsFetch(url, {}, { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 12_000 });
  } catch (err) {
    throw new CompanyAdapterError(ticker, 'transport', `transport failure: ${(err as Error).message.slice(0, 120)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new CompanyAdapterError(
      ticker,
      'transport',
      `HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new CompanyAdapterError(ticker, 'bad-json', 'non-JSON answer');
  }
  return parseCompanyEodResponse(ticker, json);
}

/** The default `from` date — 30 days back (the table needs the trailing 7-day sparkline + the latest close). */
function defaultCompanyFromDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().slice(0, 10);
}
