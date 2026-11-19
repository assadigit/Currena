/**
 * wgc-prices.ts — GPE R25 / F6 (2026-11-19): the WGC
 * currency-averages prices workbook adapter — the Episode Explorer's
 * price spine (docs/specs/gold-page-elevation: s8/01 R25 · s8/02 §1b
 * row 14 · s7/03 §3.3 · the s15 M1 §7 S15-D4 record).
 *
 * THE DROP-GATED SPINE (the s4/01 §5 Pattern A — the binding trade-off
 * the owner accepted): the workbook
 * (`Gold_price_averages_in_a range_of_currencies_since_1978.xlsx`, the
 * Goldhub gold-prices dataset page, "Updated weekly") sits behind the
 * publisher's login wall — a HUMAN (the owner, their free WGC account)
 * is the authenticator; the drop lands as the dated file
 * `data/wgc/prices/<YYYY-MM-DD>-<file-as-published>.xlsx` and this
 * adapter parses it DETERMINISTICALLY, fail-closed on shape. The
 * exact sheet/column mapping is a FIRST-DROP task by design (the
 * s8/02 row 12 posture for every WGC workbook — "gated-verified"):
 * this parse encodes the dataset page's own documented shape (monthly
 * averages since 1978, "currency unit per troy ounce unless otherwise
 * stated") with loud shape asserts, and the first real file either
 * parses or throws a named FormatChangedError that tunes the mapping
 * in one dated edit — never renders garbage.
 *
 * The parse halves are pure and total over the CELLS (readXlsxSheet's
 * own output) so unit tests replay handcrafted cell rows without any
 * file; the workbook half takes raw bytes (the platform-free shared
 * XLSX reader — the same reader the LBMA adapters ship in the
 * Worker).
 */

import type { EpisodePoint } from '@currena/core';
import { FormatChangedError } from '../../../shared/adapters/fetch-policy';
import { readXlsxSheet, type XlsxCell } from '../../../shared/adapters/xlsx';
import { excelSerialToYm } from './lbma-vault';

/** The Goldhub dataset page (the workbook's home + the attribution link). */
export const WGC_GOLDHUB_PRICES_URL = 'https://www.gold.org/goldhub/data/gold-prices';

/** The adapter's failure — status + short excerpt, never a secret. */
export class WgcPricesError extends Error {
  constructor(message: string) {
    super(`[wgc-prices] ${message}`);
    this.name = 'WgcPricesError';
  }
}

/* ------------------------------------------------------------------ *
 * The pure parse halves (total over the cells, fail-closed on shape)
 * ------------------------------------------------------------------ */

/** The maximum rows a header block may span before the data begins
 *  (the workbook's own layout — the first drop tunes this in a dated
 *  edit if the real file differs; the assert keeps the failure loud). */
const MAX_HEADER_SCAN_ROWS = 12;

/** Normalize ONE date cell to 'YYYY-MM' (the workbook's mixed shapes:
 *  'YYYY-MM' strings and Excel serial datetimes — the LBMA twin). */
function normalizeMonthCell(raw: string): string | null {
  const text = raw.trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) return text;
  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 25_000 && numeric < 60_000) {
    try {
      return excelSerialToYm(numeric);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Parse the monthly USD-per-ounce series from the sheet's cells.
 * SHAPE (asserted, fail-closed): a header row inside the first
 * MAX_HEADER_SCAN_ROWS rows carrying a date-like column label AND a
 * USD-like column label; the data rows below it carry the monthly
 * dates ascending and the USD values numeric. Any drift throws
 * FormatChangedError — never a guessed column.
 */
export function parseWgcPricesCells(cells: readonly XlsxCell[]): readonly EpisodePoint[] {
  // 1. Build the rectangular grid (col → row → value) once.
  const grid = new Map<string, Map<number, string>>();
  let maxRow = 0;
  let maxCol = 0;
  const colIndex = (col: string): number => {
    let n = 0;
    for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n;
  };
  for (const cell of cells) {
    let rows = grid.get(cell.col);
    if (rows === undefined) {
      rows = new Map<number, string>();
      grid.set(cell.col, rows);
    }
    rows.set(cell.row, cell.value);
    if (cell.row > maxRow) maxRow = cell.row;
    const ci = colIndex(cell.col);
    if (ci > maxCol) maxCol = ci;
  }
  const colOf = (n: number): string => {
    let s = '';
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  // 2. Find the header row: a row carrying BOTH a date-like label and
  //    a USD-like label (the workbook's own column headers).
  const DATE_LABEL = /^(date|month|period|time)/i;
  const USD_LABEL = /^(usd|u\.s\.|us dollar|dollar|us\$)/i;
  let headerRow = -1;
  let dateCol: string | null = null;
  let usdCol: string | null = null;
  for (let r = 1; r <= Math.min(MAX_HEADER_SCAN_ROWS, maxRow); r++) {
    let dCol: string | null = null;
    let uCol: string | null = null;
    for (let c = 1; c <= maxCol; c++) {
      const col = colOf(c);
      const value = grid.get(col)?.get(r);
      if (value === undefined) continue;
      const text = value.trim();
      if (dCol === null && DATE_LABEL.test(text)) dCol = col;
      if (uCol === null && USD_LABEL.test(text)) uCol = col;
    }
    if (dCol !== null && uCol !== null) {
      headerRow = r;
      dateCol = dCol;
      usdCol = uCol;
      break;
    }
  }
  if (headerRow < 0 || dateCol === null || usdCol === null) {
    throw new FormatChangedError(
      `no header row with a date column + a USD column inside the first ${MAX_HEADER_SCAN_ROWS} rows (the first-drop mapping task — s8/02 row 14)`,
    );
  }

  // 3. Read the data rows below the header (both cells present; the
  //    date normalizable; the USD value numeric + positive). Rows are
  //    collected wherever they sit; strict ascending months asserted
  //    at the end (the workbook's own newest-first/oldest-first order
  //    is normalized either way — whichever direction it arrives).
  const dateRows = grid.get(dateCol) ?? new Map<number, string>();
  const usdRows = grid.get(usdCol) ?? new Map<number, string>();
  const rows: Array<{ row: number; point: EpisodePoint }> = [];
  for (const [r, dateRaw] of dateRows) {
    if (r <= headerRow) continue;
    const month = normalizeMonthCell(dateRaw);
    if (month === null) continue; // a label/total/footnote row — skipped, never guessed
    const usdRaw = usdRows.get(r);
    if (usdRaw === undefined) continue;
    const value = Number(usdRaw);
    if (!Number.isFinite(value) || value <= 0) continue;
    rows.push({ row: r, point: { month, value } });
  }
  if (rows.length < 60) {
    throw new FormatChangedError(
      `only ${rows.length} monthly rows parsed (expected the full since-1978 series) — the workbook shape has drifted`,
    );
  }
  rows.sort((a, b) => a.row - b.row);
  const byRow = rows.map((r) => r.point);
  const ascending = byRow.every((p, i) => i === 0 || p.month > byRow[i - 1]!.month);
  const descending = byRow.every((p, i) => i === 0 || p.month < byRow[i - 1]!.month);
  if (!ascending && !descending) {
    throw new FormatChangedError('the monthly dates are not in one strict order — the workbook shape has drifted');
  }
  return ascending ? byRow : [...byRow].reverse();
}

/* ------------------------------------------------------------------ *
 * The workbook half (bytes → cells → the pure parse)
 * ------------------------------------------------------------------ */

/** Read + parse the dropped workbook's bytes for ONE named sheet (the
 *  sheet name is part of the first-drop mapping task — s8/02 row 14's
 *  "gated-verified" posture: the runner names the sheet, a wrong name
 *  throws the archive's own sheet list for the dated mapping edit,
 *  never a guessed sheet). */
export async function readWgcPricesWorkbook(
  bytes: Uint8Array<ArrayBuffer>,
  sheetName: string,
): Promise<readonly EpisodePoint[]> {
  const cells = await readXlsxSheet(bytes, sheetName);
  return parseWgcPricesCells(cells);
}
