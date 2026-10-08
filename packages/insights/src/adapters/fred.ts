/**
 * FRED adapter — keyless `fredgraph.csv` (Gate I0 probe: no API key needed).
 * Full history per series: the 10-year percentile window trims at scoring
 * time, and the runner only stores trimmed output (D1 minification).
 */

import { fetchWithRetry } from '@currena/scraper';
import { parseFredCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const FRED_CSV_BASE = 'https://fred.stlouisfed.org/graph/fredgraph.csv';

/**
 * Descriptive ingestion UA — FRED's Akamai edge HANGS on the scraper ladder's
 * Chrome browser fingerprint from the build egress (probe 2026-10-06: UA-only
 * request times out; headerless request answers in ~50 ms), so this adapter
 * overrides the browser headers. An honest UA is also the right practice for
 * programmatic CSV access; re-verified from the ingestion venue during I2.
 */
const FRED_HEADERS: Readonly<Record<string, string>> = {
  'User-Agent': 'CurrenaInsights/1.0 (market-indicator ingestion; github.com/assadigit/Currena)',
  Accept: 'text/csv,*/*;q=0.8',
};

/** URL of a series' full-history CSV. */
export function fredSeriesUrl(seriesId: string): string {
  return `${FRED_CSV_BASE}?id=${encodeURIComponent(seriesId)}`;
}

/**
 * Fetch and parse one FRED series (full history). Throws loudly on any
 * non-2xx (after retries) or format change — never returns partial guesses.
 */
export async function fetchFredSeries(seriesId: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await fetchWithRetry(fredSeriesUrl(seriesId), { headers: FRED_HEADERS }, deps);
  const text = await res.text();
  return parseFredCsv(text);
}

/** The FRED series ids the Insights indicators consume (I2 route + I15 additions, keyless). */
export const FRED_SERIES = {
  yieldCurve10y2y: 'T10Y2Y',
  stressStlfsi: 'STLFSI4',
  realYield10y: 'DFII10',
  us10y: 'DGS10',
  breakeven5y5y: 'T5YIFR',
  govtInterest: 'A091RC1Q027SBEA',
  govtReceipts: 'W006RC1Q027SBEA',
  brent: 'DCOILBRENTEU',
  m2Us: 'M2SL',
  // I15 (2026-10-08 data spec §3):
  usCpiIndex: 'CPIAUCSL', // us-cpi-yoy: 12-month % change, computed
  fedTargetLower: 'DFEDTARL', // fed-target: (L + U) / 2 midpoint series
  fedTargetUpper: 'DFEDTARU',
  nfci: 'NFCI', // Chicago Fed National Financial Conditions, weekly
  // dollar-broad (DTWEXBGS) retired: the series now lags ~5 days upstream
  // and the Currena dollar basket replaces it (data spec §3, basket.ts).
} as const;
