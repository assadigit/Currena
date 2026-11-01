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
 *
 * gap-closure S4-M4.2 (2026-11-01) — the SAME file family grows:
 *   - parseGprExportAll: the monthly export's country/threat/act columns
 *     (GPRC_{TWN,CHN,RUS,UKR,ISR,SAU,AUS} + GPRT + GPRA — all verified
 *     populated 1985-01 → 2026-09, M4.1) parsed out of the SAME download
 *     (zero extra subrequests).
 *   - parseGprDailyWorkbook: the DAILY export
 *     (gpr_files/data_gpr_daily_recent.xls, 3.3 MB, 15,274 rows) — the
 *     provider's own GPRD_MA7 7-day moving average is the timely signal
 *     (latest 2026-10-26, ~6-day lag). Reading its header required the
 *     biff SST cross-CONTINUE fix (the file's SST spans 35 CONTINUE
 *     records — see biff.ts).
 *   - parseTpuWorkbook: Baker-Bloom-Davis US Trade Policy Uncertainty,
 *     the Categorical EPU workbook's "9. Trade policy" column (column M
 *     of sheet "Indices", 1985-01 → 2026-10; the old
 *     Trade_Uncertainty_Data.xlsx is stale at 2019-07 — M4.1 rejected
 *     it). Licence: the workbook's own A504 carries the SAME "used
 *     freely with attribution" sentence as the EPU file.
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { readXlsxSheet } from './xlsx';
import { readXlsWorkbook, excelSerialToIso } from './biff';
import { assertAscending, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const EPU_URL = 'https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx';
export const GPR_URL = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls';
export const GPR_DAILY_URL = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.xls';
export const TPU_URL = 'https://policyuncertainty.com/media/Categorical_EPU_Data.xlsx';

/* gap-closure S4-M4.4 (2026-11-01): the NY Fed GSCPI — the Global Supply
 * Chain Pressure Index. The file is named .xlsx but is a LEGACY .xls
 * (OLE2/BIFF — 105,984 B, verified live in M4.1): the repo's biff reader
 * parses it. TWO sheets — Sheet1 is the NY Fed boilerplate (terms of use);
 * the DATA sheet is found structurally by its 'Date' + 'GSCPI' header row
 * (the boilerplate rows spill into the data sheet's top too — 'YORK FED
 * ECONOMIC RESEARCH', the URL — so the parse takes only the
 * DD-MMM-YYYY/number pairs below the header, never by row index). */
export const GSCPI_URL =
  'https://www.newyorkfed.org/medialibrary/research/interactives/gscpi/downloads/gscpi_data.xlsx';

export const MONTHLY_FILE_TIMEOUT_MS = 45_000;

/** The plausible EPU band (a news-based index; the observed range ~0–800). */
const EPU_MIN = 0;
const EPU_MAX = 2_000;

/** The plausible GPR band (the observed range ~0–550 across 140 years). */
const GPR_MIN = 0;
const GPR_MAX = 2_000;

/** The plausible TPU band (the observed range 6.5–7,956 across 1985–2026). */
const TPU_MIN = 0;
const TPU_MAX = 10_000;

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

/* ------------------------------------------------------------------ *
 * gap-closure S4-M4.2 (2026-11-01): the geopolitics family — the GPR
 * export's extra columns (same download), the GPR daily export, and
 * the TPU workbook.
 * ------------------------------------------------------------------ */

/** The GPR monthly export's Currena-relevant columns (all from the ONE download). */
export interface GprExportSeries {
  /** GPR — the aggregate index (the gpr-index card). */
  gpr: SeriesPoint[];
  /** GPRT — the threats sub-index. */
  threats: SeriesPoint[];
  /** GPRA — the acts sub-index. */
  acts: SeriesPoint[];
  /** GPRC_TWN — war-and-tension news mentioning Taiwan. */
  taiwan: SeriesPoint[];
  /** GPRC_CHN. */
  china: SeriesPoint[];
  /** GPRC_RUS. */
  russia: SeriesPoint[];
  /** GPRC_UKR. */
  ukraine: SeriesPoint[];
  /** GPRC_ISR. */
  israel: SeriesPoint[];
  /** GPRC_SAU. */
  saudi: SeriesPoint[];
  /** GPRC_AUS. */
  australia: SeriesPoint[];
}

/** The export's column names → series keys (asserted verbatim from the
 * header — a renamed/removed column is a format change, fail closed). */
const GPR_EXPORT_COLUMNS: ReadonlyArray<{ column: string; key: keyof GprExportSeries; allowZero: boolean }> = [
  { column: 'GPR', key: 'gpr', allowZero: false },
  { column: 'GPRT', key: 'threats', allowZero: false },
  { column: 'GPRA', key: 'acts', allowZero: false },
  // The country indices are shares of war-and-tension news mentioning the
  // country — a zero-mention month is an honest zero, so the floor is 0.
  { column: 'GPRC_TWN', key: 'taiwan', allowZero: true },
  { column: 'GPRC_CHN', key: 'china', allowZero: true },
  { column: 'GPRC_RUS', key: 'russia', allowZero: true },
  { column: 'GPRC_UKR', key: 'ukraine', allowZero: true },
  { column: 'GPRC_ISR', key: 'israel', allowZero: true },
  { column: 'GPRC_SAU', key: 'saudi', allowZero: true },
  { column: 'GPRC_AUS', key: 'australia', allowZero: true },
];

/**
 * Parse the GPR export's full column set (pure — fixture-testable). The
 * header must carry EVERY column of GPR_EXPORT_COLUMNS (a missing country
 * column is a layout change); each row contributes to every column that
 * carries a number beside a month serial. The aggregate band is (0, 2000]
 * (the existing GPR contract); the country columns allow an honest 0.
 */
export function parseGprExportAll(buf: ArrayBuffer): GprExportSeries {
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
  for (const [col, value] of header) {
    if (value === 'month') monthCol = col;
  }
  if (monthCol < 0) {
    throw new FormatChangedError('GPR export: the header carries no month column (layout change?)');
  }
  const colByKey = new Map<keyof GprExportSeries, number>();
  const missing: string[] = [];
  for (const spec of GPR_EXPORT_COLUMNS) {
    let found = -1;
    for (const [col, value] of header) {
      if (value === spec.column) found = col;
    }
    if (found < 0) missing.push(spec.column);
    else colByKey.set(spec.key, found);
  }
  if (missing.length > 0) {
    throw new FormatChangedError(
      `GPR export: the header no longer carries ${missing.join(', ')} (layout change?)`,
    );
  }
  const out = {} as GprExportSeries;
  for (const spec of GPR_EXPORT_COLUMNS) out[spec.key] = [];
  const counts = new Map<keyof GprExportSeries, number>();
  for (let r = 1; r < sheet.rows.length; r += 1) {
    const row = sheet.rows[r]!;
    const serial = row.get(monthCol);
    if (typeof serial !== 'number') continue; // pre-1985 rows / annotation rows
    // The date converts LAZILY: pre-1985 rows carry serials outside the
    // supported range but no values for this family's columns (the
    // original parseGprWorkbook discipline) — a row only counts once one
    // of the target columns carries a number beside its serial.
    let date: string | undefined;
    for (const spec of GPR_EXPORT_COLUMNS) {
      const value = row.get(colByKey.get(spec.key)!);
      if (typeof value !== 'number') continue; // a column's missing months stay out, never zeroed
      if (value < GPR_MIN || value > GPR_MAX || (value === 0 && !spec.allowZero)) {
        throw new FormatChangedError(
          `GPR export: ${spec.column} value ${value} at serial ${serial} is outside ${spec.allowZero ? '[' : '('}${GPR_MIN}, ${GPR_MAX}] (layout change?)`,
        );
      }
      date ??= excelSerialToIso(serial);
      out[spec.key].push({ date, value });
      counts.set(spec.key, (counts.get(spec.key) ?? 0) + 1);
    }
  }
  for (const spec of GPR_EXPORT_COLUMNS) {
    if ((counts.get(spec.key) ?? 0) < 100) {
      throw new FormatChangedError(
        `GPR export: only ${counts.get(spec.key) ?? 0} monthly rows parsed for ${spec.column} (expected decades)`,
      );
    }
    try {
      assertAscending(out[spec.key]);
    } catch (err) {
      throw new FormatChangedError(
        `GPR export: ${spec.column} rows are not date-ascending (${err instanceof Error ? err.message : err})`,
      );
    }
  }
  return out;
}

/** Fetch + parse the full GPR export (S4-M4.2 — the one download feeding
 * the gpr-index card AND its country/threat/act companions). */
export async function fetchGprExportAll(deps: FetchDeps = {}): Promise<GprExportSeries> {
  const res = await insightsFetch(GPR_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? MONTHLY_FILE_TIMEOUT_MS });
  return parseGprExportAll(await res.arrayBuffer());
}

/** The daily export's DAY cell: a strict 'YYYYMMDD' string. */
const GPR_DAY_CELL = /^(\d{4})(\d{2})(\d{2})$/;

/**
 * Parse the GPR DAILY export (pure — fixture-testable): the provider's
 * own GPRD_MA7 (the 7-day moving average of the daily GPR index) — the
 * timely signal. The header must carry BOTH 'DAY' and 'GPRD_MA7'; rows
 * pair a YYYYMMDD day string with the MA7 number. The var_name/var_label
 * documentation spill columns are ignored by name.
 */
export function parseGprDailyWorkbook(buf: ArrayBuffer): SeriesPoint[] {
  const wb = readXlsWorkbook(buf);
  const sheet = wb.sheets[0];
  if (sheet === undefined) {
    throw new FormatChangedError('GPR daily export: no worksheet substreams found (layout change?)');
  }
  const header = sheet.rows[0];
  if (header === undefined) {
    throw new FormatChangedError('GPR daily export: the sheet carries no rows (layout change?)');
  }
  let dayCol = -1;
  let ma7Col = -1;
  for (const [col, value] of header) {
    if (value === 'DAY') dayCol = col;
    if (value === 'GPRD_MA7') ma7Col = col;
  }
  if (dayCol < 0 || ma7Col < 0) {
    throw new FormatChangedError(
      `GPR daily export: the header carries no DAY/GPRD_MA7 pair (found ${[...header.values()].slice(0, 8).join(', ')}… — layout change?)`,
    );
  }
  const out: SeriesPoint[] = [];
  for (let r = 1; r < sheet.rows.length; r += 1) {
    const row = sheet.rows[r]!;
    const day = row.get(dayCol);
    const ma7 = row.get(ma7Col);
    if (typeof day !== 'string' || typeof ma7 !== 'number') continue; // documentation rows
    const m = GPR_DAY_CELL.exec(day.trim());
    if (!m) {
      throw new FormatChangedError(`GPR daily export: the DAY cell ${JSON.stringify(day)} is not YYYYMMDD (layout change?)`);
    }
    if (ma7 <= GPR_MIN || ma7 > GPR_MAX) {
      throw new FormatChangedError(`GPR daily export: GPRD_MA7 ${ma7} at ${day} is outside ${GPR_MIN}–${GPR_MAX} (layout change?)`);
    }
    out.push({ date: `${m[1]}-${m[2]}-${m[3]}`, value: ma7 });
  }
  if (out.length < 1_000) {
    throw new FormatChangedError(`GPR daily export: only ${out.length} daily rows parsed (expected decades of days)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`GPR daily export: rows are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Fetch + parse the GPR daily export (S4-M4.2 — the 3.3 MB file, one
 * fetch; the 45 s monthly-file timeout convention). */
export async function fetchGprDailySeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(GPR_DAILY_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? MONTHLY_FILE_TIMEOUT_MS });
  return parseGprDailyWorkbook(await res.arrayBuffer());
}

/**
 * Parse the TPU workbook (pure — fixture-testable): the Categorical EPU
 * workbook's "Indices" sheet, column M = "9. Trade policy" (the US Trade
 * Policy Uncertainty index, monthly). The header is asserted verbatim
 * (Year/Month + the trade-policy column); the trailing licence row
 * (A504, a string in the Year column) is skipped by the numeric guard.
 */
export async function parseTpuWorkbook(buf: ArrayBuffer): Promise<SeriesPoint[]> {
  const cells = await readXlsxSheet(new Uint8Array(buf), 'Indices');
  const byPos = new Map<string, string>();
  for (const c of cells) byPos.set(`${c.col}${c.row}`, c.value);
  const at = (col: string, row: number): string | undefined => byPos.get(`${col}${row}`);
  if (at('A', 1) !== 'Year' || at('B', 1) !== 'Month' || at('M', 1) !== '9. Trade policy') {
    throw new FormatChangedError(
      `TPU workbook: the Indices header is ${JSON.stringify([at('A', 1), at('B', 1), at('M', 1)])} (layout change?)`,
    );
  }
  const out: SeriesPoint[] = [];
  for (let row = 2; row <= 5_000; row += 1) {
    const yearCell = at('A', row);
    const monthCell = at('B', row);
    const valueCell = at('M', row);
    if (yearCell === undefined && monthCell === undefined) break; // past the data block
    if (yearCell === undefined || monthCell === undefined) continue;
    const year = Number(yearCell);
    const month = Number(monthCell);
    const value = Number(valueCell);
    if (!Number.isFinite(value) || value <= TPU_MIN || value > TPU_MAX) {
      // The trailing licence row lands here (its Year cell is a string) —
      // only a REAL numeric out-of-band value throws.
      if (Number.isFinite(year) && Number.isFinite(month) && valueCell !== undefined && Number.isFinite(Number(valueCell))) {
        throw new FormatChangedError(
          `TPU workbook: value ${JSON.stringify(valueCell)} at ${yearCell}-${monthCell} is outside ${TPU_MIN}–${TPU_MAX} (layout change?)`,
        );
      }
      continue;
    }
    out.push({ date: monthStartIso(year, month), value });
  }
  if (out.length < 100) {
    throw new FormatChangedError(`TPU workbook: only ${out.length} monthly rows parsed (expected the full history)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`TPU workbook: rows are not date-ascending after parse (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Fetch + parse the TPU workbook (S4-M4.2 — the epu-us pattern twin). */
export async function fetchTpuSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(TPU_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? MONTHLY_FILE_TIMEOUT_MS });
  return parseTpuWorkbook(await res.arrayBuffer());
}

/* ------------------------------------------------------------------ *
 * gap-closure S4-M4.4 (2026-11-01): the NY Fed GSCPI — the supply-chain
 * pressure measure of the geo-fragmentation lane.
 * ------------------------------------------------------------------ */

/** The plausible GSCPI band (the observed history spans ≈ −1.6…+4.6 —
 * standard-deviation units around the global average). */
const GSCPI_MIN = -5;
const GSCPI_MAX = 10;

/** The data sheet's date cell: the provider's own 'DD-MMM-YYYY' end-of-month
 * string ('31-Jan-1998' … '30-Sep-2026' — verified from the fixture). */
const GSCPI_DATE_CELL = /^(\d{1,2})-([A-Z][a-z]{2})-(\d{4})$/;

const GSCPI_MONTHS: Readonly<Record<string, number>> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

/**
 * Parse the GSCPI workbook (pure — fixture-testable): the data sheet is
 * found structurally (the row whose cells read 'Date' + 'GSCPI' — the
 * workbook's first sheet is the NY Fed boilerplate, and the data sheet's
 * own top rows carry boilerplate spill); every row pairing a DD-MMM-YYYY
 * string with a number becomes one month-start point (the provider stamps
 * month-END dates; the repo's monthly convention is month-start). The
 * publisher's own disruption notice (2025-11-06, "limited data") means
 * the series may pause — a gap never back-fills, the parse just takes the
 * rows the file carries.
 */
export function parseGscpiWorkbook(buf: ArrayBuffer): SeriesPoint[] {
  const wb = readXlsWorkbook(buf);
  // The data sheet + header row, found structurally (the row whose cells
  // read 'Date' + 'GSCPI'); the position is remembered as indices because
  // the biff rows are Map objects (reference compare would work, indices
  // read clearer and survive a reader that rebuilt the rows).
  let headerSheet = -1;
  let headerRowIdx = -1;
  outer: for (let s = 0; s < wb.sheets.length; s += 1) {
    const rows = wb.sheets[s]!.rows;
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r]!;
      if (row.get(0) === 'Date' && row.get(1) === 'GSCPI') {
        headerSheet = s;
        headerRowIdx = r;
        break outer;
      }
    }
  }
  if (headerSheet < 0 || headerRowIdx < 0) {
    throw new FormatChangedError('GSCPI workbook: no sheet carries a Date/GSCPI header row (layout change?)');
  }
  const out: SeriesPoint[] = [];
  const rows = wb.sheets[headerSheet]!.rows;
  for (let r = headerRowIdx + 1; r < rows.length; r += 1) {
    const row = rows[r]!;
    const dateCell = row.get(0);
    const value = row.get(1);
    if (typeof dateCell !== 'string' || typeof value !== 'number') continue; // boilerplate spill/annotation rows
    const m = GSCPI_DATE_CELL.exec(dateCell.trim());
    if (!m) {
      throw new FormatChangedError(`GSCPI workbook: the Date cell ${JSON.stringify(dateCell)} is not DD-MMM-YYYY (layout change?)`);
    }
    const month = GSCPI_MONTHS[m[2]!];
    if (month === undefined) {
      throw new FormatChangedError(`GSCPI workbook: unknown month "${m[2]}" in ${JSON.stringify(dateCell)} (layout change?)`);
    }
    if (value < GSCPI_MIN || value > GSCPI_MAX) {
      throw new FormatChangedError(`GSCPI workbook: value ${value} at ${dateCell} is outside ${GSCPI_MIN}–${GSCPI_MAX} (layout change?)`);
    }
    out.push({ date: `${m[3]}-${String(month).padStart(2, '0')}-01`, value });
  }
  if (out.length < 100) {
    throw new FormatChangedError(`GSCPI workbook: only ${out.length} monthly rows parsed (expected decades)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`GSCPI workbook: rows are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Fetch + parse the GSCPI workbook (S4-M4.4 — the monthly plan's fifth
 * file; Worker egress verified FAST in the S1 probe, ~0.5 s). */
export async function fetchGscpiSeries(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(GSCPI_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? MONTHLY_FILE_TIMEOUT_MS });
  return parseGscpiWorkbook(await res.arrayBuffer());
}
