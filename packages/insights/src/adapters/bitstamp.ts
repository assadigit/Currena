/**
 * Bitstamp adapter — public OHLC candles for the Bitcoin daily-close history
 * (Gate I0 D3: BTC 10-year backfill source; keyless).
 *
 * Verified live 2026-10-06: `step=86400` returns one candle per UTC day;
 * `limit` is REQUIRED together with start/end and caps at 1000 candles per
 * request — deep backfills must be chunked by the caller (the runner).
 */

import { z } from 'zod';
import { fetchWithRetry } from '@currena/scraper';
import { assertAscending, type SeriesPoint } from '../series';
import { AdapterError, type FetchDeps } from './types';

export const BITSTAMP_OHLC_BASE = 'https://www.bitstamp.net/api/v2/ohlc';

/** OHLC response contract (probe 2026-10-06; zod-validated — loud on change). */
const BitstampOhlcSchema = z.object({
  data: z.object({
    pair: z.string(),
    ohlc: z.array(
      z.object({
        timestamp: z.string(),
        open: z.string(),
        high: z.string(),
        low: z.string(),
        close: z.string(),
        volume: z.string(),
      }),
    ),
  }),
});

export interface BitstampWindow {
  /** Inclusive window start (epoch seconds). */
  start?: number;
  /** Inclusive window end (epoch seconds). */
  end?: number;
  /** Candles to return — required by Bitstamp when start/end are given; max 1000. */
  limit?: number;
}

export function bitstampOhlcUrl(pair: string, stepSeconds = 86_400, window: BitstampWindow = {}): string {
  if (!/^[a-z]{6,8}$/i.test(pair)) throw new Error(`Bitstamp: pair "${pair}" is malformed`);
  const params = new URLSearchParams({ step: String(stepSeconds) });
  if (window.start !== undefined) params.set('start', String(window.start));
  if (window.end !== undefined) params.set('end', String(window.end));
  if (window.limit !== undefined) {
    if (!Number.isInteger(window.limit) || window.limit < 1 || window.limit > 1000) {
      throw new Error(`Bitstamp: limit ${window.limit} outside the 1–1000 the API accepts`);
    }
    params.set('limit', String(window.limit));
  }
  return `${BITSTAMP_OHLC_BASE}/${pair.toLowerCase()}/?${params.toString()}`;
}

/** Epoch-seconds timestamp → ISO calendar date (UTC candle start). */
function isoDateFromEpochSeconds(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

/**
 * Fetch daily (or `stepSeconds`) close prices for one pair. Candles are
 * dated by their UTC start; ascending order asserted (duplicates = upstream
 * change = loud failure).
 */
export async function fetchBitstampCloses(
  pair: string,
  window: BitstampWindow = {},
  deps: FetchDeps = {},
): Promise<SeriesPoint[]> {
  const res = await fetchWithRetry(bitstampOhlcUrl(pair, 86_400, window), {}, deps);
  const json: unknown = await res.json();
  const parsed = BitstampOhlcSchema.safeParse(json);
  if (!parsed.success) {
    throw new AdapterError(
      'bitstamp',
      `OHLC response for ${pair} failed schema validation: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  if (!parsed.data.data.pair.replace('/', '').toLowerCase().startsWith(pair.toLowerCase())) {
    throw new AdapterError('bitstamp', `asked for ${pair}, response says ${parsed.data.data.pair}`);
  }
  const out: SeriesPoint[] = [];
  for (const candle of parsed.data.data.ohlc) {
    const ts = Number(candle.timestamp);
    const close = Number(candle.close);
    if (!Number.isInteger(ts) || ts <= 0 || !Number.isFinite(close) || close <= 0) {
      throw new AdapterError('bitstamp', `unparseable candle (ts ${candle.timestamp}, close ${candle.close})`);
    }
    out.push({ date: isoDateFromEpochSeconds(ts), value: close });
  }
  assertAscending(out);
  return out;
}
