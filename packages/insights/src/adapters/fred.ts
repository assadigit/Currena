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
  // I15 (2026-10-08 data spec §3). Defect E-14 (2026-10-16): the BLS
  // headline annual rate is published from the NOT seasonally adjusted
  // index, so the YoY rates here compute from the NSA series (CPIAUCNS /
  // CPILFENS) — the SA siblings (CPIAUCSL / CPILFESL) can differ by a few
  // hundredths and are retired from this pipeline.
  usCpiIndex: 'CPIAUCNS', // us-cpi-yoy: 12-month % change, computed (NSA — the BLS headline basis)
  // Step-1 audit item A3: core CPI (ex food & energy) — the context
  // companion shown on the US inflation card (NSA, same defect E-14 basis).
  usCpiCoreIndex: 'CPILFENS', // us-cpi-core-yoy: 12-month % change, computed (NSA)
  fedTargetLower: 'DFEDTARL', // fed-target: the lower bound of the target range
  fedTargetUpper: 'DFEDTARU', // …and its upper bound (rangeHigh on the reading)
  nfci: 'NFCI', // Chicago Fed National Financial Conditions, weekly
  // dollar-broad (DTWEXBGS) retired: the series now lags ~5 days upstream
  // and the Currena dollar basket replaces it (data spec §3, basket.ts).
  // Step-2 add-list §B3/§B4/§B5 (all verified current 2026-10-13):
  usUnemployment: 'UNRATE', // us-unemployment: the US unemployment rate, monthly BLS
  sahmRealtime: 'SAHMREALTIME', // sahm-rule: the real-time Sahm recession indicator, monthly
  vix: 'VIXCLS', // vix: the Cboe Volatility Index close, daily (Cboe data via FRED)
  // Fix spec C-03/C-04/C-05 + T-01 (2026-10-14, each verified live on FRED):
  us2y: 'DGS2', // fed-expectations: 2-year Treasury yield (the Fed policy gap's market leg)
  us30y: 'DGS30', // us30y: the US 30-year Treasury yield, daily
  breakeven10y: 'T10YIE', // validation-only: the 10-year breakeven (T-01 reconciliation)
  phillyFed: 'GACDFSA066MSFRBPHI', // philly-fed: Philadelphia Fed manufacturing index, monthly SA
} as const;
