/**
 * Frankfurter adapter (ECB reference rates, USD base) — the timeseries
 * endpoint feeding the FX indicators' 10-year percentile histories.
 * Open-ended end date (`start..`) is verified live: Frankfurter fills it
 * with the latest business day (probe 2026-10-06).
 */

import { insightsFetch } from './fetch-policy';
import { parseFrankfurterTimeseries } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';

/**
 * The currencies the Insights FX indicators need (USD quote side): the
 * original three PLUS the dollar-basket six (I15, data spec §3 — one
 * Frankfurter timeseries request covers every business day's full quote
 * set, so nine currencies ride one fetch) AND NZD (2026-10-21 data-integrity
 * round: the nzd-usd card — the agenda's missing pair; still one request).
 */
export const FRANKFURTER_INSIGHTS_CURRENCIES = [
  'JPY',
  'AUD',
  'CNY',
  'EUR',
  'GBP',
  'CAD',
  'SEK',
  'CHF',
  'NZD',
] as const;

/** URL of the USD-base timeseries for `currencies` from `start` (ISO date). */
export function frankfurterTimeseriesUrl(
  start: string,
  currencies: readonly string[] = FRANKFURTER_INSIGHTS_CURRENCIES,
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error(`Frankfurter: start "${start}" is not an ISO date`);
  return `${FRANKFURTER_BASE}/${start}..?from=USD&to=${currencies.join(',')}`;
}

/**
 * Fetch the USD→`currencies` timeseries from `start`, returning one series
 * per currency. One request covers all currencies (Frankfurter serves the
 * full quote set per business day).
 */
export async function fetchFrankfurterSeries(
  start: string,
  currencies: readonly string[] = FRANKFURTER_INSIGHTS_CURRENCIES,
  deps: FetchDeps = {},
): Promise<Record<string, SeriesPoint[]>> {
  const res = await insightsFetch(frankfurterTimeseriesUrl(start, currencies), {}, deps);
  const text = await res.text();
  const out: Record<string, SeriesPoint[]> = {};
  for (const ccy of currencies) {
    out[ccy] = parseFrankfurterTimeseries(text, ccy);
  }
  return out;
}
