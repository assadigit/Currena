/**
 * eia-stocks.ts — the A-6 adapter (2026-10-26 gap-audit build): the EIA's
 * keyless weekly crude-oil stocks page (U.S. ending stocks of crude oil,
 * WCRSTUS1, thousands of barrels), fetched on the Saturday rung-2 phase.
 *
 * The KEYLESS website route (LeafHandler.ashx?n=PET&s=WCRSTUS1&f=W —
 * verified live 200, 245 KB): the EIA v2 API needs a free REGISTERED key
 * (403 API_KEY_MISSING without one) and the owner's terms forbid
 * registering one — the website route needs no key, and the repo already
 * parses this page family's workbooks for the energy spots (eia.ts).
 *
 * Page shape (verified against the live capture, 2026-10-26): the WEEKLY
 * table (the one whose header row reads Year-Month, Week 1..5, followed
 * by an End Date/Value header pair per week) carries one row per month:
 * the "YYYY-Mon" label cell then up to five (MM/DD, value) pairs. A
 * December row's last week can end in January (the year rolls +1 when
 * the cell's month is numerically smaller than the row's). Values are
 * comma-grouped thousands of barrels; '-'/'--'/NA cells are skipped.
 *
 * Licence: U.S. federal government work — public domain (17 U.S.C. §105),
 * the same register row as the EIA spot workbooks (the provider's row
 * gains its second use).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { assertAscending, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/** The keyless website route (no EIA v2 API key — see the module header). */
export const EIA_CRUDE_STOCKS_URL =
  'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRSTUSUS1'.replace('WCRSTUSUS1', 'WCRSTUS1&f=W');

/** The 245 KB page — an RBA-table-style fetch window. */
export const EIA_STOCKS_TIMEOUT_MS = 45_000;

/** The monthly label cell: "2026-Oct" (leading &nbsp; padding in the wild). */
const MONTH_LABEL = /^\s*(\d{4})-([A-Z][a-z]{2})\s*$/;

/** The week-ending date cell: "MM/DD" (leading &nbsp; padding in the wild). */
const WEEK_DATE = /^\s*(\d{2})\/(\d{2})\s*$/;

const MONTHS: Readonly<Record<string, number>> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

/** A plausible weekly stocks level (thousand barrels): the observed history spans ~300k–800k. */
const STOCKS_MIN = 50_000;
const STOCKS_MAX = 5_000_000;

/** Strip HTML tags/entities and collapse whitespace (the page's &nbsp; padding). */
function cellText(cellHtml: string): string {
  return cellHtml
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse the stocks page's HTML into the weekly series (pure — fixture
 * testable). Asserts the page's identity markers (the series id + the
 * unit line) before trusting a single number; the weekly table is found
 * structurally (the Year-Month + Week 1..5 header), never by index.
 */
export function parseEiaCrudeStocksHtml(html: string): SeriesPoint[] {
  if (!html.includes('WCRSTUS1')) {
    throw new FormatChangedError('EIA stocks page: the WCRSTUS1 series id does not appear (wrong page or layout change?)');
  }
  if (!html.includes('Thousand Barrels')) {
    throw new FormatChangedError('EIA stocks page: the "Thousand Barrels" unit line is absent (layout change?)');
  }
  const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/g) ?? [];
  let dataRows: string[][] | undefined;
  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) =>
      [...m[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => cellText(c[1]!)),
    );
    if (rows.length < 3) continue;
    const header = rows[0]!;
    if (
      header[0] === 'Year-Month' &&
      header.slice(1).every((h, i) => h === `Week ${i + 1}`)
    ) {
      dataRows = rows.slice(2); // header row 2 = the End Date/Value pairs
      break;
    }
  }
  if (dataRows === undefined) {
    throw new FormatChangedError('EIA stocks page: no Year-Month/Week table found (layout change?)');
  }
  const out: SeriesPoint[] = [];
  for (const row of dataRows) {
    const label = MONTH_LABEL.exec(row[0] ?? '');
    if (!label) continue; // the trailing footnote rows
    const year = Number(label[1]);
    const rowMonth = MONTHS[label[2]!]!;
    if (!Number.isInteger(year) || rowMonth === undefined) continue;
    // Up to five (MM/DD, value) pairs after the label cell.
    for (let i = 1; i + 1 < row.length; i += 2) {
      const dateCell = WEEK_DATE.exec(row[i] ?? '');
      const valueCell = (row[i + 1] ?? '').replace(/,/g, '');
      if (!dateCell) continue;
      const mm = Number(dateCell[1]);
      const dd = Number(dateCell[2]);
      if (!/^-?\d+(\.\d+)?$/.test(valueCell)) continue; // '-', '--', NA, empty
      const value = Number(valueCell);
      if (!Number.isFinite(value) || value < STOCKS_MIN || value > STOCKS_MAX) {
        throw new FormatChangedError(
          `EIA stocks page: value ${JSON.stringify(row[i + 1])} at ${row[i]} is outside the plausible weekly band (layout change?)`,
        );
      }
      // A December row's last week can end in January (and a month-end
      // week of month M can read as the next month's day 1-7): roll the
      // year forward when the cell's month is numerically smaller.
      const weekYear = mm < rowMonth ? year + 1 : year;
      const iso = `${weekYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
      out.push({ date: iso, value });
    }
  }
  if (out.length < 100) {
    throw new FormatChangedError(`EIA stocks page: only ${out.length} weekly points parsed (expected decades of history)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`EIA stocks page: points are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Fetch + parse the weekly crude-stocks page. */
export async function fetchEiaCrudeStocks(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(EIA_CRUDE_STOCKS_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? EIA_STOCKS_TIMEOUT_MS });
  return parseEiaCrudeStocksHtml(await res.text());
}
