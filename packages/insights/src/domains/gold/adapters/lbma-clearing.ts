/**
 * lbma-clearing.ts — GPE R24 / F22 (2026-11-19): the LBMA clearing
 * volumes adapter — the LPMCL monthly statistics workbook from
 * cdn.lbma.org.uk (docs/specs/gold-page-elevation: s8/01 R24 · s8/02
 * §1b row 16 · the s14 M1 §4b live probe: the September-2026 file HTTP
 * 200, 38,272 B, 360 monthly rows 1996-11 → 2026-09, newest-first,
 * `Month | Gold: Ounces (mns), Value US$ (bns), Transfers | Silver:
 * Ounces (mns), Value US$ (bns), Transfers`).
 *
 * The vault twin's discipline verbatim: the workbook IS the full
 * history (every file carries the whole 360-month series); the parse
 * asserts the header shape before any data row; the clearing rhythm
 * runs ~one month deeper in arrears than the vault (measured live —
 * the candidate month arithmetic in lbma.ts encodes it). All-silver
 * string month cells in the wild, but the serial normalizer rides
 * along for the same robustness.
 */

import { insightsFetch } from '../../../shared/adapters/fetch-policy';
import { BlockedError, FormatChangedError } from '../../../shared/adapters/fetch-policy';
import { readXlsxSheet, type XlsxCell } from '../../../shared/adapters/xlsx';
import {
  LBMA_CDN_BASE,
  monthCellToYm,
  LbmaVaultError,
  LbmaVaultNotPublished,
} from './lbma-vault';
import type { GoldLbmaClearingRow } from '@currena/core';

/** The workbook's single sheet (verified live 2026-11-19). */
export const LBMA_CLEARING_SHEET = 'Clearing Data';

/** The provider URL the card names at point of use (C1/C6). */
export function lbmaClearingUrl(dataMonth: string): string {
  return `${LBMA_CDN_BASE}/LBMA-Clearing-Data-${monthName(dataMonth)}-${dataMonth.slice(0, 4)}.xlsx`;
}

function monthName(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(d);
}

/**
 * Parse the clearing sheet's cells into the ascending monthly rows. The
 * shape assertions (fail-closed): the column header row reads
 * `Month | Ounces (mns) | Value US$ (bns) | Transfers | Ounces (mns) |
 * Value US$ (bns) | Transfers`, the group row above it reads
 * `· Gold · · · Silver · ·`, and every data row carries six finite
 * non-negative numbers.
 */
export function parseLbmaClearingSheet(cells: readonly XlsxCell[]): GoldLbmaClearingRow[] {
  const byRow = new Map<number, Map<string, string>>();
  for (const c of cells) {
    const row = byRow.get(c.row) ?? new Map<string, string>();
    row.set(c.col, c.value);
    byRow.set(c.row, row);
  }
  // The column header row: A='Month', B='Ounces (mns)', C='Value US$
  // (bns)', D='Transfers', E/F/G the silver trio (row 3 live).
  const headerRow = [...byRow.entries()].find(([, cols]) => cols.get('A') === 'Month');
  if (headerRow === undefined) {
    throw new FormatChangedError('no "Month" header row — the clearing workbook layout changed');
  }
  const [headerIdx, headerCols] = headerRow;
  const expected: ReadonlyArray<[string, string]> = [
    ['B', 'Ounces (mns)'],
    ['C', 'Value US$ (bns)'],
    ['D', 'Transfers'],
    ['E', 'Ounces (mns)'],
    ['F', 'Value US$ (bns)'],
    ['G', 'Transfers'],
  ];
  for (const [col, label] of expected) {
    if (headerCols.get(col) !== label) {
      throw new FormatChangedError(
        `the clearing header ${col} reads "${headerCols.get(col) ?? ''}" — expected "${label}"`,
      );
    }
  }
  // The group row above: B='Gold', E='Silver'.
  const groupCols = byRow.get(headerIdx - 1);
  if (groupCols === undefined || groupCols.get('B') !== 'Gold' || groupCols.get('E') !== 'Silver') {
    throw new FormatChangedError('the clearing group row no longer reads Gold | Silver');
  }

  const num = (v: string | undefined, what: string, month: string): number => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      throw new FormatChangedError(`the clearing row ${month} carries a non-numeric ${what} ("${v ?? ''}")`);
    }
    return n;
  };

  const rows: GoldLbmaClearingRow[] = [];
  for (const [idx, cols] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
    if (idx <= headerIdx) continue;
    const monthCell = cols.get('A');
    if (monthCell === undefined) continue; // the trailing empty row — skip
    const month = monthCellToYm(monthCell);
    rows.push({
      month,
      goldMoz: num(cols.get('B'), 'gold ounces', month),
      goldValueBn: num(cols.get('C'), 'gold value', month),
      goldTransfers: num(cols.get('D'), 'gold transfers', month),
      silverMoz: num(cols.get('E'), 'silver ounces', month),
      silverValueBn: num(cols.get('F'), 'silver value', month),
      silverTransfers: num(cols.get('G'), 'silver transfers', month),
    });
  }
  if (rows.length < 120) {
    throw new FormatChangedError(`the clearing sheet carried only ${rows.length} data rows (expected the full 360-month series)`);
  }
  rows.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const months = rows.map((r) => r.month);
  if (months.some((m, i) => i > 0 && m <= months[i - 1]!)) {
    throw new FormatChangedError('the clearing months are not unique after normalization');
  }
  return rows;
}

export interface LbmaClearingFetchOptions {
  /** The data month sought, 'YYYY-MM' (the URL is derived from it). */
  dataMonth: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Request timeout; default 15 s. */
  timeoutMs?: number;
  /** Base URL override (tests). */
  baseUrl?: string;
}

/**
 * Download + parse one month's clearing workbook (the vault twin). A
 * 403/404 answers the calm not-published error (the measured venue
 * semantics — the translateNotPublished record in lbma-vault.ts); any
 * other failure fails loudly.
 */
export async function fetchLbmaClearing(
  opts: LbmaClearingFetchOptions,
): Promise<GoldLbmaClearingRow[]> {
  const url =
    opts.baseUrl !== undefined
      ? `${opts.baseUrl}/LBMA-Clearing-Data-${monthName(opts.dataMonth)}-${opts.dataMonth.slice(0, 4)}.xlsx`
      : lbmaClearingUrl(opts.dataMonth);
  let response: Response;
  try {
    response = await insightsFetch(url, {}, { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 });
  } catch (err) {
    // The measured not-published shapes (the house fetch policy throws
    // before an adapter sees a status — see lbma-vault.ts's record).
    if (err instanceof BlockedError && err.status === 403) throw new LbmaVaultNotPublished(opts.dataMonth);
    if (err instanceof Error && /^HTTP 404 from /.test(err.message)) throw new LbmaVaultNotPublished(opts.dataMonth);
    if (err instanceof BlockedError) throw err;
    throw new LbmaVaultError(`transport failure: ${err instanceof Error ? err.message : String(err)}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const cells = await readXlsxSheet(bytes, LBMA_CLEARING_SHEET);
  const rows = parseLbmaClearingSheet(cells);
  const newest = rows[rows.length - 1]!.month;
  if (newest !== opts.dataMonth) {
    throw new FormatChangedError(
      `the ${opts.dataMonth} clearing workbook's newest row is ${newest} — the file/name contract changed`,
    );
  }
  return rows;
}
