/**
 * EIA adapter — the 2026-10-22 reliability round's FRED fallback for the
 * energy spots. FRED's DCOILWTICO / DHHNGSP / DCOILBRENTEU republish EIA
 * data; when FRED's edge serves malformed bodies (venue-verified
 * 2026-10-22), the U.S. Energy Information Administration's own daily-spot
 * .xls workbooks answer with the FULL history from the primary source
 * (venue-probed: WTI 471 KB in 28–215 ms from Cloudflare egress).
 *
 * FALLBACK-ONLY (owner round terms): FRED stays the PRIMARY; collect.ts
 * triggers these fetches only when the EIA commodities bulk group failed.
 *
 * Licence: U.S. federal government works — public domain; attribution
 * "U.S. Energy Information Administration".
 *
 * Workbook shape (verified against the live RWTCd/RBRTEd/RNGWHHDd files,
 * 2026-10-22): sheet 1 is a "Contents" cover; the LAST sheet ("Data 1")
 * carries `row2 = ["Date", "<series title>"]`, then ascending rows of
 * [Excel-serial-date, price] (MULRK/RK/NUMBER records — see biff.ts).
 * Cross-validated: EIA 2026-10-20 WTI 107.89 == FRED DCOILWTICO 2026-10-20.
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { excelSerialToIso, readXlsWorkbook } from './biff';
import { assertAscending, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const EIA_WTI_URL = 'https://www.eia.gov/dnav/pet/hist_xls/RWTCd.xls';
export const EIA_BRENT_URL = 'https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls';
export const EIA_NATGAS_URL = 'https://www.eia.gov/dnav/ng/hist_xls/RNGWHHDd.xls';

/** The .xls workbooks are a few hundred KB — an RBA-style fetch window. */
export const EIA_TIMEOUT_MS = 45_000;

export interface EiaSpot {
  /** The workbook's own series title (identity assertion basis). */
  title: string;
  /** Full daily history, ascending. */
  series: SeriesPoint[];
}

/**
 * Parse one EIA spot workbook buffer (pure — fixture-testable): find the
 * data sheet structurally (a "Date" header at column 0), assert the title,
 * then read [serial, price] rows below it.
 */
export function parseEiaSpotXls(buf: ArrayBuffer, titleNeedle: string): EiaSpot {
  const wb = readXlsWorkbook(buf);
  let data: { rows: Array<Map<number, string | number>>; title: string; headerRow: number } | undefined;
  for (const sheet of wb.sheets) {
    for (let r = 0; r < Math.min(sheet.rows.length, 12); r += 1) {
      if (sheet.rows[r]?.get(0) === 'Date') {
        data = { rows: sheet.rows, title: String(sheet.rows[r]?.get(1) ?? ''), headerRow: r };
        break;
      }
    }
    if (data !== undefined) break;
  }
  if (data === undefined) {
    throw new FormatChangedError('EIA .xls: no sheet carries a "Date" header row (layout change?)');
  }
  if (!data.title.toLowerCase().includes(titleNeedle.toLowerCase())) {
    throw new FormatChangedError(
      `EIA .xls: series title ${JSON.stringify(data.title)} does not carry ${JSON.stringify(titleNeedle)} (wrong file or layout change?)`,
    );
  }
  const series: SeriesPoint[] = [];
  for (let r = data.headerRow + 1; r < data.rows.length; r += 1) {
    const row = data.rows[r]!;
    const serial = row.get(0);
    const price = row.get(1);
    if (typeof serial !== 'number' || typeof price !== 'number') continue; // blank/label rows
    if (!Number.isFinite(price)) {
      throw new FormatChangedError(`EIA .xls: non-finite price ${price} at row ${r}`);
    }
    // NOTE: negative prices are REAL for these series (WTI settled at
    // −$36.98 on 2020-04-20 — the same value FRED's DCOILWTICO carries);
    // only non-finite values are garbage.
    series.push({ date: excelSerialToIso(serial), value: price });
  }
  if (series.length < 100) {
    throw new FormatChangedError(`EIA .xls: only ${series.length} data rows (expected the full daily history)`);
  }
  try {
    assertAscending(series);
  } catch (err) {
    // The live workbooks arrive strictly ascending; a reorder is upstream.
    throw new FormatChangedError(`EIA .xls: rows are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return { title: data.title, series };
}

/** Fetch + parse one EIA spot workbook. */
async function fetchEiaSpot(url: string, titleNeedle: string, deps: FetchDeps = {}): Promise<EiaSpot> {
  const res = await insightsFetch(url, {}, { ...deps, timeoutMs: deps.timeoutMs ?? EIA_TIMEOUT_MS });
  return parseEiaSpotXls(await res.arrayBuffer(), titleNeedle);
}

/** WTI spot, FOB Cushing (FRED DCOILWTICO's own source), full history. */
export function fetchEiaWti(deps: FetchDeps = {}): Promise<EiaSpot> {
  return fetchEiaSpot(EIA_WTI_URL, 'WTI', deps);
}

/** Brent spot, FOB Europe (FRED DCOILBRENTEU's own source), full history. */
export function fetchEiaBrent(deps: FetchDeps = {}): Promise<EiaSpot> {
  return fetchEiaSpot(EIA_BRENT_URL, 'Brent', deps);
}

/** Henry Hub natural gas spot (FRED DHHNGSP's own source), full history. */
export function fetchEiaHenryHub(deps: FetchDeps = {}): Promise<EiaSpot> {
  return fetchEiaSpot(EIA_NATGAS_URL, 'Henry Hub', deps);
}
