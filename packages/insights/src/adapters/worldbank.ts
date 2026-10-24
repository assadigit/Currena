/**
 * World Bank Pink Sheet adapter — the monthly commodity history for
 * gold / silver / copper / iron ore / Brent (CC BY 4.0, Gate I0 verified).
 *
 * Two-step fetch, on purpose: the workbook URL on thedocs.worldbank.org
 * rotates its document-hash segment with every release (observed twice in
 * Phase I0: the first probed URL served a 2024M12-stale copy). The adapter
 * therefore scrapes the CURRENT link off the commodity-markets page before
 * downloading — a rotated URL is handled by design, and a moved page fails
 * loudly instead of serving a stale workbook forever.
 *
 * The XLSX is parsed by the dependency-free web-standard reader (xlsx.ts);
 * column identities are asserted from BOTH the header row and the units row
 * so a silent column reorder cannot misattribute a metal.
 */

import { insightsFetch } from './fetch-policy';
import { assertAscending, type SeriesPoint } from '../series';
import { AdapterError, type FetchDeps } from './types';
import { readXlsxSheet } from './xlsx';

export const WB_COMMODITY_MARKETS_PAGE = 'https://www.worldbank.org/en/research/commodity-markets';

export const WB_MONTHLY_SHEET_NAME = 'Monthly Prices';

/** Header-row names → the fixture column names (worldbank-pink-monthly-2004.csv). */
const WB_COLUMNS = {
  brent: { header: 'Crude oil, Brent', unit: '($/bbl)' },
  ironOre: { header: 'Iron ore, cfr spot', unit: '($/dmtu)' },
  copper: { header: 'Copper', unit: '($/mt)' },
  gold: { header: 'Gold', unit: '($/troy oz)' },
  silver: { header: 'Silver', unit: '($/troy oz)' },
  // 2026-10-21 data-integrity round: platinum joins straight from the SAME
  // workbook (column BS in the live Pink Sheet — no new request, no new
  // licence surface; the header+unit identity check guards it like the rest).
  platinum: { header: 'Platinum', unit: '($/troy oz)' },
  // M5 Wave 2 (2026-10-24, the review's "already downloaded daily,
  // unparsed" unlock): the household-cost staples from the SAME Monthly
  // Prices sheet (columns AK + AE in the live workbook, verified 2026-10-24:
  // wheat 278.6 $/mt · maize 239.6 $/mt @ 2026M09) — zero new requests.
  wheat: { header: 'Wheat, US SRW', unit: '($/mt)' },
  maize: { header: 'Maize', unit: '($/mt)' },
} as const;

export interface WorldBankMonthly {
  gold: SeriesPoint[];
  silver: SeriesPoint[];
  copper: SeriesPoint[];
  ironOre: SeriesPoint[];
  brent: SeriesPoint[];
  platinum: SeriesPoint[];
  /** M5: the grain columns (Monthly Prices sheet, $/mt — same parse as the metals). */
  wheat: SeriesPoint[];
  maize: SeriesPoint[];
  /**
   * M5: the Food index (Monthly Indices sheet, 2010=100). Optional at the
   * type level because parseWorldBankMonthlySheet (the pure prices-sheet
   * parse) cannot fill it — fetchWorldBankMonthly always does (or throws).
   */
  foodIndex?: SeriesPoint[];
}

/**
 * M5: the Monthly Indices sheet's Food column header, verbatim from the
 * live workbook (verified 2026-10-24: cell G8 reads "Food **" — the " **"
 * is the Pink Sheet's own footnote marker, present on every sub-index row;
 * the index basis is 2010=100 per the workbook's Description sheet).
 */
export const WB_FOOD_INDEX_HEADER = 'Food **';
export const WB_INDICES_SHEET_NAME = 'Monthly Indices';

/** Extract the current monthly workbook URL from the commodity-markets page HTML. */
export function findPinkSheetMonthlyUrl(pageHtml: string): string {
  const urls = [...pageHtml.matchAll(/https:\/\/thedocs\.worldbank\.org\/[^"'\s<>]+?CMO-Historical-Data-Monthly\.xlsx/g)].map((m) => m[0]!);
  const unique = [...new Set(urls)];
  if (unique.length === 0) {
    throw new AdapterError('world-bank', 'commodity-markets page has no CMO-Historical-Data-Monthly.xlsx link');
  }
  if (unique.length > 1) {
    throw new AdapterError('world-bank', `page carries ${unique.length} different monthly workbook links — needs a human look`);
  }
  return unique[0]!;
}

/** True for the World Bank's missing-value markers ('…', '..' and blanks). */
function isWbMissing(value: string): boolean {
  const v = value.trim();
  return v === '' || v === '…' || v === '..' || v === '-';
}

/**
 * M5 (2026-10-24): parse the Food index out of the Monthly Indices sheet
 * (pure — fixture-testable). The sheet's headers sit on a two-tier header
 * block (rows ~6–9 in the live workbook; 'Food **' itself sits on a sub-row)
 * with NO units row below — the 2010=100 basis lives in the Description
 * sheet, so the identity check is the exact header cell + the first-value
 * plausibility (positive, finite), and the data rows are the 'YYYYMnn'
 * months below the header block in column A.
 */
export function parseWorldBankFoodIndexSheet(
  cells: { col: string; row: number; value: string; sharedString: boolean }[],
): SeriesPoint[] {
  // Locate the Food header cell (exact verbatim match — the '**' suffix is
  // the Pink Sheet's own footnote marker, observed in the live workbook).
  const headerCell = cells.find((c) => c.value.trim() === WB_FOOD_INDEX_HEADER);
  if (headerCell === undefined) {
    throw new AdapterError('world-bank', `Monthly Indices sheet has no "${WB_FOOD_INDEX_HEADER}" header cell (renamed?)`);
  }
  const cellByRowCol = new Map<string, string>();
  for (const c of cells) cellByRowCol.set(`${c.row}:${c.col}`, c.value);
  const monthRe = /^(\d{4})M(\d{2})$/;
  const out: SeriesPoint[] = [];
  for (const c of cells) {
    if (c.col !== 'A' || c.row <= headerCell.row) continue;
    const m = monthRe.exec(c.value.trim());
    if (!m) continue;
    const value = cellByRowCol.get(`${c.row}:${headerCell.col}`);
    if (value === undefined || isWbMissing(value)) continue;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      throw new AdapterError('world-bank', `food index ${m[1]}-${m[2]}: value "${value}" is not a positive finite number`);
    }
    out.push({ date: `${m[1]}-${m[2]}-01`, value: num });
  }
  if (out.length === 0) {
    throw new AdapterError('world-bank', 'the food index parsed to zero observations');
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  assertAscending(out);
  return out;
}

/**
 * Parse the five Insight-relevant series out of the Monthly Prices sheet
 * (pure — fixture-testable). Month cells are 'YYYYMnn' shared strings; the
 * first data month observed is 1960M01, the cadence is strictly monthly and
 * duplicates would throw via the ascending assertion.
 */
export function parseWorldBankMonthlySheet(cells: { col: string; row: number; value: string; sharedString: boolean }[]): WorldBankMonthly {
  // (row, col) → cell value, for O(1) lookups below.
  const cellByRowCol = new Map<string, string>();
  for (const c of cells) cellByRowCol.set(`${c.row}:${c.col}`, c.value);

  // Header row = the unique row containing ALL five commodity names.
  const headerRow = ((): number => {
    const namesByRow = new Map<number, Set<string>>();
    for (const c of cells) {
      if (!namesByRow.has(c.row)) namesByRow.set(c.row, new Set());
      namesByRow.get(c.row)!.add(c.value.trim());
    }
    const wanted = Object.values(WB_COLUMNS).map((c) => c.header);
    const hits = [...namesByRow.entries()].filter(([, names]) => wanted.every((w) => names.has(w)));
    if (hits.length === 0) {
      throw new AdapterError('world-bank', 'Monthly Prices sheet has no row carrying all five commodity headers');
    }
    if (hits.length > 1) {
      throw new AdapterError('world-bank', `${hits.length} rows carry the full commodity header set — ambiguous`);
    }
    return hits[0]![0];
  })();

  const colByHeader = new Map<string, string>();
  const unitByCol = new Map<string, string>();
  for (const c of cells) {
    if (c.row === headerRow) colByHeader.set(c.value.trim(), c.col);
    else if (c.row === headerRow + 1) unitByCol.set(c.col, c.value.trim());
  }

  const targets: Record<keyof typeof WB_COLUMNS, SeriesPoint[]> = {
    gold: [], silver: [], copper: [], ironOre: [], brent: [], platinum: [], wheat: [], maize: [],
  };
  const colOf = new Map<string, keyof typeof WB_COLUMNS>();
  for (const [key, spec] of Object.entries(WB_COLUMNS) as [keyof typeof WB_COLUMNS, (typeof WB_COLUMNS)[keyof typeof WB_COLUMNS]][]) {
    const col = colByHeader.get(spec.header);
    if (col === undefined) {
      throw new AdapterError('world-bank', `header "${spec.header}" not found on the header row`);
    }
    const unit = unitByCol.get(col);
    if (unit !== spec.unit) {
      throw new AdapterError('world-bank', `"${spec.header}" unit is ${JSON.stringify(unit)}, expected "${spec.unit}" (column identity check)`);
    }
    colOf.set(col, key);
  }

  // Month cells in column A below the units row; values from the target columns.
  const monthRe = /^(\d{4})M(\d{2})$/;
  for (const c of cells) {
    if (c.col !== 'A' || c.row <= headerRow + 1) continue;
    const m = monthRe.exec(c.value.trim());
    if (!m) continue; // non-month annotation cells (notes, blank tail) are skipped
    const date = `${m[1]!}-${m[2]!}-01`;
    for (const [col, key] of colOf) {
      const value = cellByRowCol.get(`${c.row}:${col}`);
      if (value === undefined || isWbMissing(value)) continue;
      const num = Number(value);
      if (!Number.isFinite(num) || num <= 0) {
        throw new AdapterError('world-bank', `${key} ${date}: value "${value}" is not a positive finite number`);
      }
      targets[key].push({ date, value: num });
    }
  }

  for (const key of Object.keys(targets) as (keyof typeof WB_COLUMNS)[]) {
    targets[key].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (targets[key].length === 0) {
      throw new AdapterError('world-bank', `series "${key}" parsed to zero observations`);
    }
    assertAscending(targets[key]);
  }
  return targets;
}

/**
 * Fetch the current Pink Sheet monthly workbook and parse the series
 * (the metals + energy from Monthly Prices; the Food index from Monthly
 * Indices — ONE workbook download, two sheet reads, zero extra requests).
 * Two network round-trips: the commodity-markets page (link discovery) and
 * the workbook itself.
 */
export async function fetchWorldBankMonthly(deps: FetchDeps = {}): Promise<WorldBankMonthly> {
  const pageRes = await insightsFetch(WB_COMMODITY_MARKETS_PAGE, {}, deps);
  const pageHtml = await pageRes.text();
  const workbookUrl = findPinkSheetMonthlyUrl(pageHtml);

  const wbRes = await insightsFetch(workbookUrl, {}, { ...deps, timeoutMs: deps.timeoutMs ?? 60_000 });
  const bytes = new Uint8Array(await wbRes.arrayBuffer());
  const cells = await readXlsxSheet(bytes, WB_MONTHLY_SHEET_NAME);
  const out = parseWorldBankMonthlySheet(cells);
  // M5 (2026-10-24): the Food index rides the SAME workbook — a second
  // sheet read, never a second download. An indices-sheet failure throws
  // loudly (the workbook shape changed — never guess).
  const indicesCells = await readXlsxSheet(bytes, WB_INDICES_SHEET_NAME);
  out.foodIndex = parseWorldBankFoodIndexSheet(indicesCells);
  return out;
}
