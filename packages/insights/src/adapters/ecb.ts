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

/**
 * The maintenance round (page-division S25, the ecb provider-timeout item,
 * 2026-11-12): the portal legs share a 45-second single-attempt timeout —
 * still F-11 (ONE honest attempt, no retry), only more patient.
 *
 * Evidence: the HICP leg's request timed out at the 12-second default on
 * EVERY rung from 2026-11-06 to 2026-11-11 (04:10 main + the 10:10 sweep;
 * the status rows read "The operation was aborted due to timeout"; the last
 * healthy HICP fetch landed 2026-11-05, the morning the 2026-10 flash
 * arrived). The venue probes (sandbox + Worker egress) then measured the
 * provider-side condition: the ECB API gateway INTERMITTENTLY routes a
 * request to a slow/dead backend and answers HTTP 504 after ~30.2 s — ANY
 * request, any series, any shape (probe v2 from Worker egress: a no-filter
 * HICP request 504'd at 30.2 s in one minute and answered 200 in ~1.9 s the
 * next; the DFR control — the module's healthiest leg — 504'd at 30.2 s in
 * that same probe run while four HICP shapes succeeded). It is a
 * per-request roulette, not a shape defect — and it is UNDOCUMENTED (the
 * ECB's own status-codes page lists 500s as "an issue on our side… try again
 * later"; the portal's own feedback form carries "Performance problems /
 * API issues" as known categories).
 *
 * The 45 s default: healthy paths answer in <3 s (unchanged); slow-but-alive
 * paths get 33 s of room they never had at 12 s; dead paths surface the
 * gateway's OWN 504 as an honest 'failed' row (HTTP 504 — single attempt,
 * no retry) instead of a client abort, and the 10:10/20:10 sweeps remain
 * the designed hours-level retry. Precedents: the IMF COFER request's own
 * 15 s single-attempt (its RISK_REGISTER row) and the brent front-month's
 * 15 s call-site override — per-source patience overrides are the
 * established pattern. All four portal legs (DFR, HICP, AAA, BSI) take
 * this default.
 */
export const ECB_PORTAL_TIMEOUT_MS = 45_000;

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

/**
 * GF-S11 (P4, 2026-11-07 — audit report §4 rank 34 / I11): the
 * EUROSYSTEM's total assets — the global-liquidity aggregate's ECB leg.
 * The series key verified live 2026-11-07 (this session's own probe, the
 * honest UA): `BSI/M.U2.N.C.T00.A.1.Z5.0000.Z01.E` — SDMX CSV title
 * "Total assets of the Eurosystem, Stocks", EUR millions, monthly
 * (September 2026 already served at the read: 9,531,118.32 — the ~5-week
 * publication lag measured live). The BSI dimension walk that found the
 * key: FREQ.REF_AREA.ADJUSTMENT.BS_REP_SECTOR(C = Eurosystem).BS_ITEM
 * (T00 = Total Assets/Liabilities)… — the CL_BS_ITEM + CL_BS_REP_SECTOR
 * codelists read live from the Data Portal's structure API.
 */
export const ECB_EUROSYSTEM_ASSETS_KEY = 'BSI/M.U2.N.C.T00.A.1.Z5.0000.Z01.E';

/** The decade window's start for the Eurosystem-assets request (the FRED decade-window discipline). */
export function ecbEurosystemAssetsFrom(now: Date = new Date()): string {
  return new Date(now.getTime() - (3_650 + 90) * 86_400_000).toISOString().slice(0, 10);
}

/** URL of the Eurosystem total-assets series (decade window CSV, month-start dated). */
export function ecbEurosystemAssetsUrl(from: string = ecbEurosystemAssetsFrom()): string {
  return `${ECB_DATA_BASE}/${ECB_EUROSYSTEM_ASSETS_KEY}?format=csvdata&startPeriod=${from}`;
}

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

/**
 * URL of the HICP annual-rate series — the FULL HISTORY, no time filter
 * (the DFR discipline; page-division S25, 2026-11-12).
 *
 * The maintenance round kept this shape deliberately, three reasons, all
 * measured: (1) the STABLE URL — the old request's rolling startPeriod
 * moved with every day (now − 3650d − 90d), so no cache along the path
 * could ever serve it; the unfiltered series key is the same URL every
 * day (the DFR leg — a 3 MB full-history fetch — is the module's
 * healthiest production leg on exactly this discipline); (2) the content
 * is IDENTICAL — the decade window is byte-equal the full history's tail
 * (verified at both venues: 358 rows 1997-01 → 2026-10, the window's
 * 120 rows match row-for-row), and parseEcbMonthlyCsv is window-agnostic
 * with the engine slicing its own 10-year windows; (3) the probe matrix
 * proved NO shape avoids the gateway's intermittent ~30 s 504 roulette
 * (csvdata filtered/unfiltered, dataonly, jsondata, lastN all answered
 * 200 within one probe while the DFR control 504'd) — so the shape is
 * chosen for stability + precedent, never as a latency claim.
 */
export function ecbHicpUrl(): string {
  return `${ECB_DATA_BASE}/${ECB_HICP_SERIES_KEY}?format=csvdata`;
}

/** Fetch and parse the ECB deposit facility rate series (full history). */
export async function fetchEcbDfrSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbDfrUrl(), {}, { timeoutMs: ECB_PORTAL_TIMEOUT_MS, ...deps });
  const text = await res.text();
  return parseEcbDfrCsv(text);
}

/**
 * Fetch and parse the euro-area HICP annual rate series (full history;
 * the same monthly SDMX CSV shape — parseEcbMonthlyCsv normalizes YYYY-MM
 * to the month start; the ANR obs is the annual rate of change itself, no
 * derivation needed).
 */
export async function fetchEcbHicpSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbHicpUrl(), {}, { timeoutMs: ECB_PORTAL_TIMEOUT_MS, ...deps });
  const text = await res.text();
  return parseEcbMonthlyCsv(text);
}

/**
 * Fetch and parse the euro-area AAA 10-year yield series (decade window;
 * the same SDMX wide CSV as the DFR — parseEcbDfrCsv is series-agnostic).
 */
export async function fetchEcbAaa10ySeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbAaa10yUrl(), {}, { timeoutMs: ECB_PORTAL_TIMEOUT_MS, ...deps });
  const text = await res.text();
  return parseEcbDfrCsv(text);
}

/**
 * GF-S11 (P4 / I11): fetch and parse the Eurosystem's total assets (decade
 * window; the same monthly SDMX CSV shape as the HICP — month-start dated,
 * EUR millions). Fails loudly on a block, a non-2xx or a shape change.
 */
export async function fetchEcbEurosystemAssets(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(ecbEurosystemAssetsUrl(), {}, { timeoutMs: ECB_PORTAL_TIMEOUT_MS, ...deps });
  const text = await res.text();
  return parseEcbMonthlyCsv(text);
}
