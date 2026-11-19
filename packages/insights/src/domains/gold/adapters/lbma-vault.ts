/**
 * lbma-vault.ts — GPE R24 / F22 (2026-11-19): the LBMA London vault
 * holdings adapter — the free monthly workbook from cdn.lbma.org.uk
 * (docs/specs/gold-page-elevation: s8/01 R24 · s8/02 §1b row 15 · the
 * s14 M1 §4b live probe: the October-2026 file HTTP 200, 23,732 B, 124
 * monthly rows 2016-07 → 2026-10, newest-first, gold + silver in troy
 * ounces '000s).
 *
 * The workbook IS the full history (every file carries the whole
 * 124-month series) — one download bootstraps or refreshes the family.
 * The parse is deterministic and fail-closed on shape (the World Bank
 * discipline: the header + unit rows are asserted before any data row
 * is read; a drifted shape throws, never renders garbage). The date
 * cells are MIXED in the wild — the newest rows carry string 'YYYY-MM'
 * cells, the oldest carry Excel serial datetimes — the parser
 * normalizes both (measured live: row 125's '42614' is 2016-08-01).
 *
 * Parse halves are pure and total; fetch halves take an INJECTED
 * fetchImpl so unit tests replay saved workbooks without touching the
 * network (AGENTS.md rule 2: web-standard fetch only, no node:*).
 */

import { insightsFetch } from '../../../shared/adapters/fetch-policy';
import { BlockedError, FormatChangedError } from '../../../shared/adapters/fetch-policy';
import { readXlsxSheet, type XlsxCell } from '../../../shared/adapters/xlsx';
import type { GoldLbmaVaultRow } from '@currena/core';

/** The LBMA CDN (the S4-verified free direct download venue). */
export const LBMA_CDN_BASE = 'https://cdn.lbma.org.uk/downloads';

/** The workbook's single sheet (verified live 2026-11-19). */
export const LBMA_VAULT_SHEET = 'London Vault Holdings Data';

/** The provider URL the card names at point of use (C1/C6). */
export function lbmaVaultUrl(dataMonth: string): string {
  return `${LBMA_CDN_BASE}/LBMA-London-Vault-Holdings-Data-${monthNameEn(dataMonth)}-${dataMonth.slice(0, 4)}.xlsx`;
}

/** The English month name the file names carry ('2026-10' → 'October'). */
function monthNameEn(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(d);
}

/** The adapter's failure — status + short excerpt, never a secret. */
export class LbmaVaultError extends Error {
  constructor(message: string) {
    super(`[lbma-vault] ${message}`);
    this.name = 'LbmaVaultError';
  }
}

/** An Excel serial date cell → 'YYYY-MM' (the 1899-12-30 epoch; the
 * 1900 leap-year bug is baked into every serial XLSX emits). */
export function excelSerialToYm(serial: number): string {
  const ms = Math.round((serial - 25_569) * 86_400_000); // 25,569 = days 1899-12-30 → 1970-01-01
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new LbmaVaultError(`serial ${serial} is not a date`);
  return d.toISOString().slice(0, 7);
}

/** A month cell's value → 'YYYY-MM' (string or Excel serial — both live). */
export function monthCellToYm(value: string): string {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  const serial = Number(value);
  if (Number.isInteger(serial) && serial > 0 && value.trim() !== '') return excelSerialToYm(serial);
  throw new LbmaVaultError(`a month cell carried "${value}" — neither YYYY-MM nor an Excel serial`);
}

/**
 * Parse the vault sheet's cells into the ascending monthly rows. The
 * shape assertions (fail-closed): the header row reads
 * `Month End | Gold | Silver`, the unit row reads `Troy Ounces ('000s)`
 * on both value columns, and every data row carries two finite
 * non-negative numbers.
 */
export function parseLbmaVaultSheet(cells: readonly XlsxCell[]): GoldLbmaVaultRow[] {
  // The header row: A='Month End', B='Gold', C='Silver' (row 2 live).
  const byRow = new Map<number, Map<string, string>>();
  for (const c of cells) {
    const row = byRow.get(c.row) ?? new Map<string, string>();
    row.set(c.col, c.value);
    byRow.set(c.row, row);
  }
  const headerRow = [...byRow.entries()].find(([, cols]) => cols.get('A') === 'Month End');
  if (headerRow === undefined) {
    throw new FormatChangedError('no "Month End" header row — the vault workbook layout changed');
  }
  const [headerIdx, headerCols] = headerRow;
  if (headerCols.get('B') !== 'Gold' || headerCols.get('C') !== 'Silver') {
    throw new FormatChangedError(
      `the vault header reads B="${headerCols.get('B') ?? ''}" C="${headerCols.get('C') ?? ''}" — expected Gold | Silver`,
    );
  }
  // The unit row (the row after the header): both value columns say
  // Troy Ounces ('000s) — the unit identity is asserted, never assumed.
  const unitCols = byRow.get(headerIdx + 1);
  if (
    unitCols === undefined ||
    unitCols.get('B') !== "Troy Ounces ('000s)" ||
    unitCols.get('C') !== "Troy Ounces ('000s)"
  ) {
    throw new FormatChangedError('the vault unit row no longer reads Troy Ounces (\'000s) on both columns');
  }

  const rows: GoldLbmaVaultRow[] = [];
  for (const [idx, cols] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
    if (idx <= headerIdx + 1) continue;
    const monthCell = cols.get('A');
    if (monthCell === undefined) continue; // a fully empty row — skip
    const month = monthCellToYm(monthCell);
    const gold = Number(cols.get('B'));
    const silver = Number(cols.get('C'));
    if (!Number.isFinite(gold) || gold < 0 || !Number.isFinite(silver) || silver < 0) {
      throw new FormatChangedError(`the vault row ${month} carries non-numeric holdings (gold="${cols.get('B') ?? ''}" silver="${cols.get('C') ?? ''}")`);
    }
    rows.push({ month, goldKoz: gold, silverKoz: silver });
  }
  if (rows.length < 24) {
    throw new FormatChangedError(`the vault sheet carried only ${rows.length} data rows (expected the full 124-month series)`);
  }
  // The workbook is newest-first in the wild — normalize to ascending.
  rows.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const months = rows.map((r) => r.month);
  if (months.some((m, i) => i > 0 && m <= months[i - 1]!)) {
    throw new FormatChangedError('the vault months are not unique after normalization');
  }
  return rows;
}

export interface LbmaVaultFetchOptions {
  /** The data month sought, 'YYYY-MM' (the URL is derived from it). */
  dataMonth: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Request timeout; default 15 s (the CDN answered in ~40 ms live). */
  timeoutMs?: number;
  /** Base URL override (tests). */
  baseUrl?: string;
}

/** The calm "not yet published" answer (the file does not exist yet). */
export class LbmaVaultNotPublished extends Error {
  constructor(dataMonth: string) {
    super(`the ${dataMonth} vault workbook is not published yet`);
    this.name = 'LbmaVaultNotPublished';
  }
}

/**
 * Translate the house fetch-policy's thrown shapes into the calm
 * not-published answer — FOR THIS VENUE, measured live twice (S4/02 §1b
 * + the s14 M1 §4b probe): cdn.lbma.org.uk answers 403 for a
 * not-yet-existing file path and 200 for an existing one (a genuine
 * unknown path elsewhere answers 404; the venue has never been observed
 * blocking the house UA — both probes served the files cleanly). The
 * fetch-policy layer throws BlockedError(403) / the plain HTTP-404 error
 * before an adapter can see a status, so the translation matches those
 * two thrown shapes; every other failure propagates and fails the rung
 * loudly. If the venue ever 403-blocks the house UA, the honest staling
 * carries it: the stored month stops advancing and the card's as-of
 * shows it.
 */
function translateNotPublished(err: unknown, dataMonth: string): void {
  if (err instanceof BlockedError && err.status === 403) {
    throw new LbmaVaultNotPublished(dataMonth);
  }
  if (err instanceof Error && /^HTTP 404 from /.test(err.message)) {
    throw new LbmaVaultNotPublished(dataMonth);
  }
}

/**
 * Download + parse one month's vault workbook. ONE polite single-attempt
 * request (F-11) through the house fetch policy. A 403/404 answers the
 * calm not-published error (the expected pre-publication state — never a
 * rung failure); any other failure fails loudly.
 */
export async function fetchLbmaVault(
  opts: LbmaVaultFetchOptions,
): Promise<GoldLbmaVaultRow[]> {
  const url =
    opts.baseUrl !== undefined
      ? `${opts.baseUrl}/LBMA-London-Vault-Holdings-Data-${monthNameEn(opts.dataMonth)}-${opts.dataMonth.slice(0, 4)}.xlsx`
      : lbmaVaultUrl(opts.dataMonth);
  let response: Response;
  try {
    response = await insightsFetch(url, {}, { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 });
  } catch (err) {
    translateNotPublished(err, opts.dataMonth);
    if (err instanceof BlockedError) throw err; // the block taxonomy rides as-is
    throw new LbmaVaultError(`transport failure: ${err instanceof Error ? err.message : String(err)}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const cells = await readXlsxSheet(bytes, LBMA_VAULT_SHEET);
  const rows = parseLbmaVaultSheet(cells);
  // The file's own month must match the month its name promises (never a
  // silent mismatch — the S13-D3 row-dating discipline's sibling).
  const newest = rows[rows.length - 1]!.month;
  if (newest !== opts.dataMonth) {
    throw new FormatChangedError(
      `the ${opts.dataMonth} vault workbook's newest row is ${newest} — the file/name contract changed`,
    );
  }
  return rows;
}
