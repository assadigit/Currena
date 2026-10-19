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
import { parseEcbDfrCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const ECB_DATA_BASE = 'https://data-api.ecb.europa.eu/service/data';

/** The ECB series key for the deposit facility rate (confirmed on the portal). */
export const ECB_DFR_SERIES_KEY = 'FM/D.U2.EUR.4F.KR.DFR.LEV';

/** URL of the DFR series (full history CSV). */
export function ecbDfrUrl(): string {
  return `${ECB_DATA_BASE}/${ECB_DFR_SERIES_KEY}?format=csvdata`;
}

/** Fetch and parse the ECB deposit facility rate series (full history). */
export async function fetchEcbDfrSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbDfrUrl(), {}, deps);
  const text = await res.text();
  return parseEcbDfrCsv(text);
}
