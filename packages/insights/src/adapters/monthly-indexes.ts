/**
 * epu.ts + gpr.ts's fetching halves live here as one monthly-file module —
 * the A-9/A-10 adapters (2026-10-26 gap-audit build), both monthly
 * academic series fetched on the first-of-month rung-2 phase.
 *
 * A-10 epu-us — Baker-Bloom-Davis, US Economic Policy Uncertainty:
 *   https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx
 *   (71 KB OOXML — the repo's dependency-free xlsx.ts reader handles it
 *   directly, the Pink Sheet path). The workbook's licence rides IN the
 *   file itself (row 1523, quoted in the register row): "These data can
 *   be used freely with attribution to the authors, the paper, and the
 *   website." Sheet "Main News Index", columns A=Year B=Month C=the
 *   headline index; rows DESCENDING (newest first) — sorted ascending
 *   here. Verified live 2026-10-26: 2026-09 = 218.94.
 *
 * A-9 gpr-index — Iacoviello, Geopolitical Risk Index:
 *   https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls
 *   (2.7 MB legacy CDFV2 .xls — the repo's dependency-free biff.ts OLE2+
 *   BIFF8 reader, the EIA-workbook path, parses it directly; the spec's
 *   honest build note assumed only OOXML was supported and expected a
 *   BLOCKED outcome — the live file proved otherwise 2026-10-26: sheet 1,
 *   header row [month, GPR, GPRT, GPRA, GPRH, GPRHT, …], Excel-serial
 *   first-of-month dates, 501 GPR points 1985-01 → 2026-09). Never a
 *   hand-entered value, exactly as the spec demands.
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { readXlsxSheet } from './xlsx';
import { readXlsWorkbook, excelSerialToIso } from './biff';
import { assertAscending, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const EPU_URL = 'https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx';
export const GPR_URL = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls';

export const MONTHLY_FILE_TIMEOUT_MS = 45_000;

/** The plausible EPU band (a news-based index; the observed range ~0–800). */
const EPU_MIN = 0;
const EPU_MAX = 2_000;

/** The plausible GPR band (the observed range ~0–550 across 140 years). */
const GPR_MIN = 0;
const GPR_MAX = 2_000;

/** "YYYY-M" → month-start ISO. */
function monthStartIso(year: number, month: number): string {
  if (!Number.isInteger(year) || year < 1900 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new FormatChangedError(`EPU: the Year/Month cells give ${year}-${month} (layout change?)`);
  }
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Parse the EPU workbook (pure — fixture-testable): the Main News Index
 * sheet, header Year/Month/News_Based_Policy_Uncert_Index asserted, the
 * DESCENDING rows sorted ascending.
 */
export async function parseEpuWorkbook(buf: ArrayBuffer): Promise<SeriesPoint[]> {
  const cells = await readXlsxSheet(new Uint8Array(buf), 'Main News Index');
  const byPos = new Map<string, string>();
  for (const c of cells) byPos.set(`${c.col}${c.row}`, c.value);
  const at = (col: string, row: number): string | undefined => byPos.get(`${col}${row}`);
  // The header row is asserted verbatim (a renamed sheet/column is a
  // format change — fail loudly).
  if (at('A', 1) !== 'Year' || at('B', 1) !== 'Month' || at('C', 1) !== 'News_Based_Policy_Uncert_Index') {
    throw new FormatChangedError(
      `EPU workbook: the Main News Index header is ${JSON.stringify([at('A', 1), at('B', 1), at('C', 1)])} (layout change?)`,
    );
  }
  const out: SeriesPoint[] = [];
  for (let row = 2; row <= 3_000; row += 1) {
    const yearCell = at('A', row);
    const monthCell = at('B', row);
    const valueCell = at('C', row);
    if (yearCell === undefined && monthCell === undefined) break; // past the data block
    if (yearCell === undefined || monthCell === undefined || valueCell === undefined) continue;
    const year = Number(yearCell);
    const month = Number(monthCell);
    const value = Number(valueCell);
    if (!Number.isFinite(value) || value <= EPU_MIN || value > EPU_MAX) {
      throw new FormatChangedError(
        `EPU workbook: value ${JSON.stringify(valueCell)} at ${yearCell}-${monthCell} is outside ${EPU_MIN}–${EPU_MAX} (layout change?)`,
      );
    }
    out.push({ date: monthStartIso(year, month), value });
  }
  if (out.length < 100) {
    throw new FormatChangedError(`EPU workbook: only ${out.length} monthly rows parsed (expected the full history)`);
  }
  // The file arrives newest-first: sort ascending, then assert.
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`EPU workbook: rows are not date-ascending after sort (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Fetch + parse the EPU workbook (A-10). */
export async function fetchEpuSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(EPU_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? MONTHLY_FILE_TIMEOUT_MS });
  return parseEpuWorkbook(await res.arrayBuffer());
}

/**
 * Parse the GPR export (pure — fixture-testable): sheet 1 structurally
 * identified by its header (a 'month' column and a 'GPR' column — the
 * biff reader names sheets positionally), Excel-serial month dates, the
 * GPR values banded. The GPR column begins 1985-01 in the current file
 * (earlier rows carry only the historical-variant columns) — the parse
 * takes whatever rows carry BOTH a serial and a GPR value.
 */
export function parseGprWorkbook(buf: ArrayBuffer): SeriesPoint[] {
  const wb = readXlsWorkbook(buf);
  const sheet = wb.sheets[0];
  if (sheet === undefined) {
    throw new FormatChangedError('GPR export: no worksheet substreams found (layout change?)');
  }
  const header = sheet.rows[0];
  if (header === undefined) {
    throw new FormatChangedError('GPR export: the sheet carries no rows (layout change?)');
  }
  let monthCol = -1;
  let gprCol = -1;
  for (const [col, value] of header) {
    if (value === 'month') monthCol = col;
    if (value === 'GPR') gprCol = col;
  }
  if (monthCol < 0 || gprCol < 0) {
    throw new FormatChangedError(
      `GPR export: the header carries no month/GPR pair (found ${[...header.values()].slice(0, 8).join(', ')}… — layout change?)`,
    );
  }
  const out: SeriesPoint[] = [];
  for (let r = 1; r < sheet.rows.length; r += 1) {
    const row = sheet.rows[r]!;
    const serial = row.get(monthCol);
    const gpr = row.get(gprCol);
    if (typeof serial !== 'number' || typeof gpr !== 'number') continue; // pre-1985 rows carry no GPR
    if (gpr <= GPR_MIN || gpr > GPR_MAX) {
      throw new FormatChangedError(`GPR export: value ${gpr} at serial ${serial} is outside ${GPR_MIN}–${GPR_MAX} (layout change?)`);
    }
    out.push({ date: excelSerialToIso(serial), value: gpr });
  }
  if (out.length < 100) {
    throw new FormatChangedError(`GPR export: only ${out.length} monthly rows parsed (expected decades)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`GPR export: rows are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Fetch + parse the GPR export (A-9 — the legacy .xls via biff.ts). */
export async function fetchGprSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(GPR_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? MONTHLY_FILE_TIMEOUT_MS });
  return parseGprWorkbook(await res.arrayBuffer());
}
