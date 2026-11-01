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

/* gap-closure S4-M4.4 (2026-11-01): the same LeafHandler page family grows
 * two more weekly series (both series ids walked from the provider's own
 * PET_STOC_WSTK_DCU_NUS_W / PET_CRD_WRPD_DCU_NUS_W indexes in M4.1 — never
 * guessed): the SPR level and the US field production. The SPR page's unit
 * line reads "Thousand Barrels" (a LEVEL, like the stocks page); the
 * production page's reads "Thousand Barrels per Day" (a RATE — the cards'
 * labels must state both units, the M4.1 note). */
export const EIA_SPR_URL =
  'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCSSTUS1&f=W';
export const EIA_CRUDE_PRODUCTION_URL =
  'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRFPUS2&f=W';

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

/** The per-series identity + plausibility spec of one LeafHandler weekly
 * page (S4-M4.4): the series id string the page must carry, the unit line
 * needle, and the plausible value band (thousand barrels / thousand barrels
 * per day — the SPR level's band differs from the production rate's). */
export interface EiaWeeklySeriesSpec {
  seriesId: string;
  unitNeedle: string;
  min: number;
  max: number;
}

/** The crude-stocks page's spec (the historical band observed 1982–2026). */
export const EIA_CRUDE_STOCKS_SPEC: EiaWeeklySeriesSpec = {
  seriesId: 'WCRSTUS1',
  unitNeedle: 'Thousand Barrels',
  min: STOCKS_MIN,
  max: STOCKS_MAX,
};

/** The SPR page's spec: the observed history spans ~347k–727k thousand
 * barrels (the 2020s drawdown low to the 2020 peak). */
export const EIA_SPR_SPEC: EiaWeeklySeriesSpec = {
  seriesId: 'WCSSTUS1',
  unitNeedle: 'Thousand Barrels',
  min: 100_000,
  max: 1_000_000,
};

/** The field-production page's spec: a RATE in thousand barrels per day;
 * the observed history spans ~5k–13.5k (the 1982 low to the 2026 high). */
export const EIA_CRUDE_PRODUCTION_SPEC: EiaWeeklySeriesSpec = {
  seriesId: 'WCRFPUS2',
  unitNeedle: 'Thousand Barrels per Day',
  min: 1_000,
  max: 20_000,
};

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
 * Parse ONE LeafHandler weekly series page into its weekly series (pure —
 * fixture-testable; S4-M4.4 generalised from the crude-stocks parse).
 * Asserts the page's identity markers (the series id + the unit needle)
 * before trusting a single number; the weekly table is found structurally
 * (the Year-Month + Week 1..5 header), never by index.
 */
export function parseEiaWeeklySeriesHtml(html: string, spec: EiaWeeklySeriesSpec): SeriesPoint[] {
  if (!html.includes(spec.seriesId)) {
    throw new FormatChangedError(`EIA ${spec.seriesId} page: the series id does not appear (wrong page or layout change?)`);
  }
  if (!html.includes(spec.unitNeedle)) {
    throw new FormatChangedError(`EIA ${spec.seriesId} page: the "${spec.unitNeedle}" unit line is absent (layout change?)`);
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
    throw new FormatChangedError(`EIA ${spec.seriesId} page: no Year-Month/Week table found (layout change?)`);
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
      if (!Number.isFinite(value) || value < spec.min || value > spec.max) {
        throw new FormatChangedError(
          `EIA ${spec.seriesId} page: value ${JSON.stringify(row[i + 1])} at ${row[i]} is outside the plausible weekly band (layout change?)`,
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
    throw new FormatChangedError(`EIA ${spec.seriesId} page: only ${out.length} weekly points parsed (expected decades of history)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`EIA ${spec.seriesId} page: points are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/**
 * Parse the stocks page's HTML into the weekly series (pure — fixture
 * testable). Asserts the page's identity markers (the series id + the
 * unit line) before trusting a single number; the weekly table is found
 * structurally (the Year-Month + Week 1..5 header), never by index.
 */
export function parseEiaCrudeStocksHtml(html: string): SeriesPoint[] {
  return parseEiaWeeklySeriesHtml(html, EIA_CRUDE_STOCKS_SPEC);
}

/** Fetch + parse the weekly crude-stocks page. */
export async function fetchEiaCrudeStocks(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(EIA_CRUDE_STOCKS_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? EIA_STOCKS_TIMEOUT_MS });
  return parseEiaCrudeStocksHtml(await res.text());
}

/** Fetch + parse the weekly SPR level page (S4-M4.4 — a LEVEL in thousand
 * barrels; WCSSTUS1, "Ending Stocks of Crude Oil in SPR"). */
export async function fetchEiaSprLevel(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(EIA_SPR_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? EIA_STOCKS_TIMEOUT_MS });
  return parseEiaWeeklySeriesHtml(await res.text(), EIA_SPR_SPEC);
}

/** Fetch + parse the weekly US field-production page (S4-M4.4 — a RATE in
 * thousand barrels per day; WCRFPUS2, "Field Production of Crude Oil"). */
export async function fetchEiaCrudeProduction(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(EIA_CRUDE_PRODUCTION_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? EIA_STOCKS_TIMEOUT_MS });
  return parseEiaWeeklySeriesHtml(await res.text(), EIA_CRUDE_PRODUCTION_SPEC);
}
