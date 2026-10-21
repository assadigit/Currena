/**
 * EODHD crypto adapter (2026-10-21 data-integrity round) — the ETH-USD.CC
 * daily close series for the eth-usd indicator card.
 *
 * Why EODHD for Ethereum: the owner's own API key (the same register row and
 * owner directive that make the world-markets board public-display-ok), a
 * verified-live symbol on the free plan (probed 2026-10-21: ETH-USD.CC
 * closes through 2026-10-20), and one call a day — comfortably inside the
 * free plan's quota once the world-markets main run has spent its 15.
 *
 * Platform-free (AGENTS.md rule 2): the token is a parameter, never a module
 * constant; the honest UA and the single-attempt policy come from
 * insightsFetch (F-09/T-25/F-11).
 */

import { insightsFetch } from './fetch-policy';
import { ISO_DATE_RE, parseEodhdEodRows } from './eodhd-parse';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const EODHD_BASE_URL = 'https://eodhd.com/api';

/** The crypto symbols the Insights indicators consume (EODHD free plan). */
export const EODHD_CRYPTO_SYMBOLS = {
  eth: 'ETH-USD.CC',
} as const;

/** URL of one symbol's daily EOD history from `from` (ISO date). */
export function eodhdEodUrl(symbol: string, apiToken: string, from: string): string {
  return `${EODHD_BASE_URL}/eod/${encodeURIComponent(symbol)}?api_token=${encodeURIComponent(apiToken)}&fmt=json&period=d&from=${from}`;
}

/**
 * The `from` date: the 10-year percentile + history window plus margin
 * (crypto trades daily, so ~3,700 daily bars ride one answer).
 */
export function defaultCryptoFrom(now: Date): string {
  return new Date(now.getTime() - 3_700 * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Fetch one crypto symbol's daily closes (ascending). Throws loudly on
 * HTTP errors, non-JSON answers, empty arrays (the "delisted/changed
 * ticker" silent-failure mode), or non-positive closes — the same
 * discipline as the markets provider.
 */
export async function fetchEodhdCryptoSeries(
  symbol: string,
  apiToken: string,
  opts: { from?: string; now?: Date; timeoutMs?: number } & FetchDeps = {},
): Promise<SeriesPoint[]> {
  const from = opts.from ?? defaultCryptoFrom(opts.now ?? new Date());
  const res = await insightsFetch(
    eodhdEodUrl(symbol, apiToken, from),
    {},
    { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 },
  );
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`EODHD ${symbol}: non-JSON answer`);
  }
  return parseEodhdEodRows(json, symbol);
}

export { ISO_DATE_RE };
