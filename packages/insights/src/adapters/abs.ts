/**
 * ABS Data API adapter — keyless `/rest/data` CSV route (Gate I0 probe).
 * Series keys verified live 2026-10-06; every key's response is parsed by
 * the header-driven SDMX parser (column order varies by flow).
 *
 * The quarterly stale grace (190d) in the scoring engine absorbs ABS
 * release lags; nothing here retries on "NoRecordsFound" — that is an
 * upstream/key change and must fail loudly.
 */

import { fetchWithRetry } from '@currena/scraper';
import { parseAbsSdmxCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const ABS_DATA_BASE = 'https://data.api.abs.gov.au/rest/data';

/**
 * The ABS series keys the Insights indicators consume (verified live
 * 2026-10-06; flow/dimension meanings recorded in docs/insights/03-data-sources.md):
 *  - CPI All groups index, original, Australia, quarterly (17th-series base)
 *  - CPI_Q Trimmed Mean index, seasonally adjusted, quarterly (2011-12 base)
 *  - LF unemployment rate, persons, SA, Australia, monthly
 *  - RES_DWELL_ST mean price of residential dwellings, Australia, quarterly
 *  - ANA_AGG terms of trade index, seasonally adjusted, quarterly
 *  - I15: CPI Rents index, original, Australia, MONTHLY (verified against
 *    the published "rose 3.6% in the 12 months to August 2026" figure)
 *  - I15: CPI Automotive fuel index, original, Australia, MONTHLY (exact
 *    +13.5% match; COVID -22.5% / 2022 +35.1% signature identification)
 *  - I15: WPI total hourly rates of pay excluding bonuses, all sectors,
 *    all industries, original, quarterly (OHRPEB = Ordinary Hourly Rates
 *    of Pay, Excluding Bonuses)
 */
export const ABS_SERIES = {
  cpiIndex: 'CPI/1.10001.10.50.Q',
  trimmedMeanIndex: 'CPI_Q/1.999902.20.50.Q',
  unemployment: 'LF/M13.3.1599.20.AUS.M',
  resDwellMeanPrice: 'RES_DWELL_ST/5.AUS.Q',
  termsOfTrade: 'ANA_AGG/M5.TTR.20.AUS.Q',
  rentIndex: 'CPI/1.115522.10.50.M',
  automotiveFuelIndex: 'CPI/1.40081.10.50.M',
  wageIndex: 'WPI/1.OHRPEB.7.TOT.10.AUS.Q',
} as const;

/** URL of one ABS series' full-history CSV. */
export function absDataUrl(key: string): string {
  if (!/^[A-Za-z0-9_.]+(\/[A-Za-z0-9_.]+)+$/.test(key)) {
    throw new Error(`ABS: series key "${key}" is malformed`);
  }
  return `${ABS_DATA_BASE}/${key}?format=csv`;
}

/** Fetch and parse one ABS series (full history). */
export async function fetchAbsSeries(key: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await fetchWithRetry(absDataUrl(key), {}, deps);
  const text = await res.text();
  if (text.trim() === 'NoRecordsFound') {
    throw new Error(`ABS: series "${key}" returned NoRecordsFound (key or flow changed upstream?)`);
  }
  return parseAbsSdmxCsv(text);
}
