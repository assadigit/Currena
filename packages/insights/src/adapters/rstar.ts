/**
 * rstar.ts — GF-S11 (P4, 2026-11-07 — audit report §4 rank 42 / R11): the
 * Holston–Laubach–Williams r-star — the NY Fed's own estimate of the US
 * natural rate of interest, the regime label the whole rates complex
 * orbits. Context-only BY TREATMENT (the audit's own classification).
 *
 * The venue (verified live 2026-11-07, the honest CurrenaDashboard UA):
 * the rstar page links the current-estimates workbook —
 *   /medialibrary/media/research/economists/williams/data/
 *    Holston_Laubach_Williams_current_estimates.xlsx
 * (178,850 bytes at the read; "Final data point: 2026Q2"). The "HLW
 * Estimates" sheet carries the quarterly estimates: column A = the date
 * (Excel serial), column K = the US r* — the parse walks exactly those,
 * dating each point at its quarter START (the FRED convention the
 * engine's quarterly handling expects).
 *
 * Licence (the register's nyfed row, L1): the NY Fed's Terms of Use
 * quote the affirmative reuse licence — "You may: Access the Content…
 * Download, store, and use Content in any format or media, Copy and
 * distribute the Content in any format or media, and Modify and create
 * derivative works from the Content."
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { readXlsxSheet, type XlsxCell } from './xlsx';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const NYFED_HLW_URL =
  'https://www.newyorkfed.org/medialibrary/media/research/economists/williams/data/Holston_Laubach_Williams_current_estimates.xlsx';

/** The estimates sheet's own name (the workbook's second sheet). */
export const HLW_SHEET_NAME = 'HLW Estimates';

/** The column the US r* rides (the sheet's own layout: K = Natural Rate (r*), US). */
const RSTAR_COLUMN = 'K';
/** The column the dates ride. */
const DATE_COLUMN = 'A';

/** The row the data starts on (row 5 holds "Final data point:", row 6 the headers, row 7 the first estimate). */
const FIRST_DATA_ROW = 7;

/** The Excel serial-epoch offset (days since 1899-12-30, the 1900 leap-year workaround). */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

/** Convert an Excel serial date to its quarter-START ISO date (the FRED convention). */
export function excelSerialToQuarterStart(serial: number): string {
  const date = new Date(EXCEL_EPOCH_MS + serial * 86_400_000);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth(); // 0-based
  const quarterStartMonth = Math.floor(m / 3) * 3;
  return `${y}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
}

/**
 * Parse the HLW Estimates sheet's cells into the US r* series (pure).
 * Only rows with BOTH a numeric date and a numeric r* emit points — an
 * "NA" cell (the Euro Area's early quarters) is skipped, never guessed.
 */
export function parseHlwRstar(cells: readonly XlsxCell[]): SeriesPoint[] {
  const byRow = new Map<number, { date?: number; rstar?: number }>();
  for (const cell of cells) {
    if (cell.row < FIRST_DATA_ROW) continue;
    const value = Number(cell.value);
    if (!Number.isFinite(value)) continue; // "NA" and blanks — skipped
    const entry = byRow.get(cell.row) ?? {};
    if (cell.col === DATE_COLUMN) entry.date = value;
    if (cell.col === RSTAR_COLUMN) entry.rstar = value;
    byRow.set(cell.row, entry);
  }
  const out: SeriesPoint[] = [];
  for (const entry of byRow.values()) {
    if (entry.date === undefined || entry.rstar === undefined) continue;
    if (entry.date < 60 || entry.date > 80_000) continue; // a sane serial window (1960–2119)
    out.push({ date: excelSerialToQuarterStart(entry.date), value: Math.round(entry.rstar * 100) / 100 });
  }
  if (out.length < 40) {
    // The HLW history runs 1961+ (~260 quarters) — anything less is a
    // reshaped workbook.
    throw new FormatChangedError(`HLW: only ${out.length} US r* rows parsed (expected 200+) — the workbook layout changed`);
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/**
 * Fetch the HLW current-estimates workbook and parse the US r* series
 * (one keyless request, the honest UA). Throws loudly on a block, a
 * non-2xx or a workbook layout change.
 */
export async function fetchHlwRstar(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(NYFED_HLW_URL, {}, { timeoutMs: 30_000, ...deps });
  const xlsx = new Uint8Array(await res.arrayBuffer());
  const cells = await readXlsxSheet(xlsx, HLW_SHEET_NAME);
  return parseHlwRstar(cells);
}
