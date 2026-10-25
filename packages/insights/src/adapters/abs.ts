/**
 * ABS Data API adapter — keyless `/rest/data` CSV route (Gate I0 probe).
 * Series keys verified live 2026-10-06; every key's response is parsed by
 * the header-driven SDMX parser (column order varies by flow).
 *
 * Step-1 audit item A2 (2026-10-13): au-cpi / au-trimmed-mean switched to
 * the ABS MONTHLY CPI (the full monthly measure the ABS now publishes —
 * headline annual 4.0% / trimmed mean 3.6% for August 2026, both verified
 * live against the series). The quarterly stale grace in the scoring
 * engine absorbs ABS release lags; nothing here retries on
 * "NoRecordsFound" — that is an upstream/key change and must fail loudly.
 */

import { insightsFetch } from './fetch-policy';
import { parseAbsSdmxCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const ABS_DATA_BASE = 'https://data.api.abs.gov.au/rest/data';

/**
 * The ABS series keys the Insights indicators consume (verified live
 * 2026-10-06; flow/dimension meanings recorded in docs/insights/03-data-sources.md):
 *  - CPI All groups index, original, Australia, MONTHLY (Step-1: the full
 *    monthly CPI; August 2026 annual change 3.97% verified live)
 *  - CPI Trimmed Mean index, seasonally adjusted, MONTHLY (Step-1: August
 *    2026 annual change 3.57% verified live — matches the published 3.6%)
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
 *  - M6 Wave 3 (2026-10-25) — the AU leading-edge trio, each key verified
 *    live the same day (the codelist walk: CL_ANA_AGG_ITEM → HSR; the JV
 *    wildcard sweep → M1.7.TOT; the LEND_HOUSING xlsx cross-check → the
 *    total-dwellings commitments key):
 *  - New housing loan commitments, total dwellings, all lenders, SA,
 *    quarterly $ millions — 2026-Q2 = AU$97,647.9m. NOTE: the ABS
 *    publishes Lending Indicators QUARTERLY in the SDMX API (the
 *    xlsx's 28 obs since 2019-09 confirm; the SDMX series carries
 *    2002-Q3 onward — the pre-2019 years are the old monthly sums).
 *  - Household saving ratio (ANA_AGG, M7 = ratio, HSR, SA) — 2026-Q2 = 6.5.
 *  - Job vacancies, all sectors, SA, quarterly thousands (JV, M1 = level,
 *    sector 7 = all, TSEST 20 = SA) — 2026-Q3 = 325.0k.
 */
export const ABS_SERIES = {
  cpiIndex: 'CPI/1.10001.10.50.M',
  trimmedMeanIndex: 'CPI/1.999902.20.50.M',
  unemployment: 'LF/M13.3.1599.20.AUS.M',
  resDwellMeanPrice: 'RES_DWELL_ST/5.AUS.Q',
  termsOfTrade: 'ANA_AGG/M5.TTR.20.AUS.Q',
  rentIndex: 'CPI/1.115522.10.50.M',
  automotiveFuelIndex: 'CPI/1.40081.10.50.M',
  wageIndex: 'WPI/1.OHRPEB.7.TOT.10.AUS.Q',
  housingFinance: 'LEND_HOUSING/FIN_VAL.NEWCOMMITS.DV8368.TOTDWELL.TOT.TOT.20.AUS.Q',
  savingRatio: 'ANA_AGG/M7.HSR.20.AUS.Q',
  jobVacancies: 'JV/M1.7.TOT.20.AUS.Q',
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
  const res = await insightsFetch(absDataUrl(key), {}, deps);
  const text = await res.text();
  if (text.trim() === 'NoRecordsFound') {
    throw new Error(`ABS: series "${key}" returned NoRecordsFound (key or flow changed upstream?)`);
  }
  return parseAbsSdmxCsv(text);
}
