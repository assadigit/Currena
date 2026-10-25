/**
 * ECB Data Portal adapter (I15, 2026-10-08 data spec §3) — the deposit
 * facility rate series `FM/D.U2.EUR.4F.KR.DFR.LEV`, keyless, CSV.
 *
 * Series key verified live 2026-10-08 (probe from this sandbox):
 * `?format=csvdata` answers with the wide SDMX CSV; TIME_PERIOD is a
 * YYYY-MM-DD date; the series carries one row per calendar day ("date of
 * changes (raw data)" — every day repeats the standing rate). Licence
 * class Green: free reuse with attribution (data spec §1 row 5).
 */

import { insightsFetch } from './fetch-policy';
import { parseEcbDfrCsv, parseEcbMonthlyCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const ECB_DATA_BASE = 'https://data-api.ecb.europa.eu/service/data';

/** The ECB series key for the deposit facility rate (confirmed on the portal). */
export const ECB_DFR_SERIES_KEY = 'FM/D.U2.EUR.4F.KR.DFR.LEV';

/**
 * M5 Wave 2 (2026-10-24): the euro-area AAA 10-year yield — the daily fix
 * for the structurally stale OECD bund mirror. The review's four candidate
 * keys all 404'd (dotted FM/YC forms); the CORRECT key was verified live at
 * build time (2026-10-24, this sandbox):
 * `YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` — SDMX CSV title "AAA yield curve
 * - 10-year spot rate", latest 3.3844 @ 2026-10-22 (the G_N_C sibling is
 * the ALL-rated curve — not the safe-asset leg; G_N_A is the AAA one).
 */
export const ECB_AAA_10Y_SERIES_KEY = 'YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y';

/**
 * M6 Wave 3 (2026-10-25): the euro-area HICP annual rate — the euro
 * area's inflation, from the NEW post-Feb-2026 HICP dataset. The OLD
 * ICP flow (ICP.M.U2.N.000000.4.ANR — the review's candidate) DIED at
 * 2025-12 upstream (Eurostat's methodological change of 4 February 2026
 * discontinued it, per the series' own OBS_COM note); the replacement,
 * verified live at build time (2026-10-25, this sandbox): HICP flow,
 * DATA_PROVIDER 4D0 — full decade history back-filled, latest 3.8 @
 * 2026-09.
 */
export const ECB_HICP_SERIES_KEY = 'HICP/M.U2.N.000000.4D0.ANR';

/** URL of the DFR series (full history CSV). */
export function ecbDfrUrl(): string {
  return `${ECB_DATA_BASE}/${ECB_DFR_SERIES_KEY}?format=csvdata`;
}

/** The decade window's start for the AAA series request (CPU-polite parse,
 * the FRED decade-window discipline — the YC history runs from 2004). */
export function ecbAaaFrom(now: Date = new Date()): string {
  return new Date(now.getTime() - (3_650 + 90) * 86_400_000).toISOString().slice(0, 10);
}

/** URL of the AAA 10y series (decade window CSV). */
export function ecbAaa10yUrl(from: string = ecbAaaFrom()): string {
  return `${ECB_DATA_BASE}/${ECB_AAA_10Y_SERIES_KEY}?format=csvdata&startPeriod=${from}`;
}

/** The decade window's start for the HICP request (the FRED decade-window discipline). */
export function ecbHicpFrom(now: Date = new Date()): string {
  return new Date(now.getTime() - (3_650 + 90) * 86_400_000).toISOString().slice(0, 10);
}

/** URL of the HICP annual-rate series (decade window CSV). */
export function ecbHicpUrl(from: string = ecbHicpFrom()): string {
  return `${ECB_DATA_BASE}/${ECB_HICP_SERIES_KEY}?format=csvdata&startPeriod=${from}`;
}

/** Fetch and parse the ECB deposit facility rate series (full history). */
export async function fetchEcbDfrSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbDfrUrl(), {}, deps);
  const text = await res.text();
  return parseEcbDfrCsv(text);
}

/**
 * Fetch and parse the euro-area HICP annual rate series (decade window;
 * the same SDMX wide CSV shape as the DFR but with MONTHLY YYYY-MM
 * periods — parseEcbMonthlyCsv normalizes to the month start; the ANR
 * obs is the annual rate of change itself, no derivation needed).
 */
export async function fetchEcbHicpSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbHicpUrl(), {}, deps);
  const text = await res.text();
  return parseEcbMonthlyCsv(text);
}

/**
 * Fetch and parse the euro-area AAA 10-year yield series (decade window;
 * the same SDMX wide CSV as the DFR — parseEcbDfrCsv is series-agnostic).
 */
export async function fetchEcbAaa10ySeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbAaa10yUrl(), {}, deps);
  const text = await res.text();
  return parseEcbDfrCsv(text);
}
