/**
 * uom.ts — GF-S10 (2026-11-06, the remaining P3 sources — the audit
 * report §4 rank 32 / I4): the University of Michigan Surveys of
 * Consumers' SIE time-series archive — the monthly 5–10-year MEDIAN
 * expected price change (Table 33), "the slow version of R7" (the
 * long-run household inflation anchor).
 *
 * The archive's download form (data.sca.isr.umich.edu/data-archive/
 * mine.php, read live 2026-11-06) is a keyless POST that serves the
 * Table 33 CSV from any requested start year — one request, the FULL
 * monthly history (verified live 2026-11-06: 227 rows from a year-2008
 * request; the 1978 request serves from 1978 — the question was first
 * asked November 1978, and the earliest months carry empty cells).
 *
 * Licence (the register's uom row, L1): the SIE usage agreement grants
 * CC-BY-NC-ND for non-commercial use with the quoted copyright notice —
 * "Surveys of Consumers, Survey Research Center, University of Michigan.
 * Copyright © 1946–2026 The Regents of the University of Michigan". The
 * median series displays VERBATIM (never recomputed).
 *
 * The parse takes ONLY the Median column; rows without a median (the
 * pre-1979 empty months, or a future unreleased month) are skipped —
 * never invented.
 */

import { insightsFetch } from './fetch-policy';
import { FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const UOM_SIE_ARCHIVE_URL = 'https://data.sca.isr.umich.edu/data-archive/mine.php';

/** Table 33 — "Expected Change in Prices During the Next 5 Years" (the
 * 5–10-year question, per the workbook's own question text). */
export const UOM_TABLE_33 = '33' as const;

/**
 * The start year the fetch requests. The corpus needs 2016+ and the
 * percentile base wants the decade window; 2008 gives a comfortable
 * margin (the same start year the archive form itself defaults to) while
 * keeping the response small (~10 kB).
 */
export const UOM_START_YEAR = 2008;

/** The CSV header the parse pins (F-16: a shape change fails loudly). */
const EXPECTED_HEADER_PREFIX = 'Month,Year,Down,Same,Up by 1-2%,Up by 3-4%,Up by 5%';

/** The parse's date/value row shape: Month,Year,...,Median (column 16, 0-based). */
interface UomRow {
  year: number;
  month: number;
  median: number;
}

/**
 * Fetch the Table 33 monthly median series (the full history from
 * UOM_START_YEAR). Throws loudly on a non-2xx, a blocked page or a
 * format change (the fetch-policy discipline: single attempt, honest
 * UA, no circumvention).
 */
export async function fetchUomExpectedPrice5y10y(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const body = new URLSearchParams({
    table: UOM_TABLE_33,
    year: String(UOM_START_YEAR),
    qorm: 'M',
    order: 'asc',
    format: 'Comma-Separated (CSV)',
  });
  const res = await insightsFetch(
    UOM_SIE_ARCHIVE_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    },
    deps,
  );
  const text = await res.text();
  return parseUomExpectedPrice5y10y(text);
}

/** Parse the Table 33 CSV into the monthly median series (pure, testable). */
export function parseUomExpectedPrice5y10y(csv: string): SeriesPoint[] {
  const lines = csv.split(/\r?\n/);
  // Line 0: the table title; line 1: the header row.
  if (lines.length < 2 || !lines[0]!.includes('Table 33')) {
    throw new FormatChangedError('UoM SIE: the response is not the Table 33 CSV (title line changed)');
  }
  const header = lines[1]!;
  if (!header.startsWith(EXPECTED_HEADER_PREFIX)) {
    throw new FormatChangedError(`UoM SIE: the Table 33 header changed — "${header.slice(0, 60)}…"`);
  }
  // The Median column index (0-based), pinned from the header row itself.
  const columns = header.split(',');
  const medianIdx = columns.findIndex((c) => c.trim() === 'Median');
  if (medianIdx < 1) {
    throw new FormatChangedError('UoM SIE: no Median column in the Table 33 header');
  }
  const rows: UomRow[] = [];
  for (const line of lines.slice(2)) {
    if (line.trim() === '') continue;
    const cells = line.split(',');
    const year = Number(cells[1]);
    const month = Number(cells[0]);
    const median = Number(cells[medianIdx]);
    if (!Number.isInteger(year) || year < 1978 || year > 2100) continue;
    if (!Number.isInteger(month) || month < 1 || month > 12) continue;
    if (!Number.isFinite(median)) continue; // an unreleased/empty month — skipped, never invented
    rows.push({ year, month, median });
  }
  if (rows.length < 24) {
    // The archive serves 18+ years from the 2008 start — anything less is
    // a truncated or reshaped response.
    throw new FormatChangedError(`UoM SIE: only ${rows.length} median rows parsed (expected 200+) — the response shape changed`);
  }
  // The series is dated by the survey month (month-start, the ABS
  // convention the engine's monthly percentile base already handles).
  const points: SeriesPoint[] = rows.map((r) => ({
    date: `${String(r.year).padStart(4, '0')}-${String(r.month).padStart(2, '0')}-01`,
    value: r.median,
  }));
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return points;
}
