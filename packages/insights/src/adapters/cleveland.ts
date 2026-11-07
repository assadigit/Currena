/**
 * cleveland.ts — GF-S11 (2026-11-07, the owner's recorded I9 answer — the
 * round-2 decision table, the README of the gap-fill program): the
 * Cleveland Fed's INFLATION NOWCASTING page — the current-month (and the
 * still-unreleased prior-month) CPI nowcasts, the only expectations-
 * vs-realised surprise object in the audit's backlog (§4 rank 33 / I9).
 *
 * The venue (read live 2026-11-07 from this session's own probe, the
 * honest CurrenaDashboard UA): the page embeds three tables —
 *   "Inflation, month-over-month percent change"
 *   "Inflation, year-over-year percent change"
 *   "Quarterly annualized percent change"
 * each with the header [Month, CPI, Core CPI, PCE, Core PCE, Updated] and
 * one row per still-unreleased month (November 2026 + October 2026 as of
 * the read: CPI +0.19 / +0.24 MoM, SA, nonannualized). The page's own
 * note pins the release semantics: "If the cell is blank, it implies that
 * the actual data corresponding to the month for that inflation measure
 * have already been released." — the venue's own release marker, which
 * the surprise join uses to freeze a month's final nowcast.
 *
 * The methodology (quoted from the page, 2026-11-07): "The model reports
 * seasonally adjusted, month-over-month inflation rates in these four
 * measures (expressed as nonannualized percent changes)" — so the MoM
 * nowcast pairs with the SEASONALLY ADJUSTED CPI index (CPIAUCSL) as the
 * realised leg, exactly the headline print basis the BLS reports.
 *
 * The publisher serves NO nowcast history (the GF-S10 verdict — the
 * webcharts JSON endpoints 404; no XLSX archive), so the card
 * ACCUMULATES nowcasts from a standing start (the owner's recorded
 * answer): the rung-2 phase appends each day's rows to the stored
 * `insights:hist:cpi-nowcast` series (one point per reference month,
 * refined rung over rung — fetched wins on collision), and the CPI-print
 * join derives the surprise when the realised print lands.
 *
 * Licence (the register's cleveland row, L2 — the owner-acceptance
 * class): the Bank's own "Privacy and Terms of Use" (read live
 * 2026-11-07) provides the Content "free of charge as a convenience to
 * its clients, depository institutions, and the public" but quotes NO
 * affirmative reuse grant (unlike the NY Fed's terms); the site carries
 * "© 2026 Federal Reserve Bank of Cleveland" and a suggested citation
 * ("Inflation Nowcasting." Federal Reserve Bank of Cleveland.
 * https://doi.org/10.26509/frbc-inflationnowcast). The fetch runs (the
 * Bank's own public page, keyless); the DISPLAY gate stays PRIVATE until
 * the owner records acceptance — the SGE-pre-(e) standing.
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const CLEVELAND_NOWCAST_URL = 'https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting';

/** One month's nowcast rows as the page serves them. */
export interface ClevelandNowcastRow {
  /** The reference month, normalized to YYYY-MM. */
  month: string;
  /** The headline CPI MoM nowcast (SA, nonannualized percent). */
  cpiMom: number;
  /** The headline CPI YoY nowcast (NSA basis, percent) — report-only. */
  cpiYoy: number;
  /** The page's own "Updated" cell (MM/DD) — the observation stamp. */
  updated: string;
}

/** The month-name → number table the title cells carry. */
const MONTHS: Readonly<Record<string, number>> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

/** Parse "November 2026" → "2026-11" (pure; throws on anything else). */
export function parseNowcastMonth(cell: string): string {
  const m = /^([A-Z][a-z]+) (\d{4})$/.exec(cell.trim());
  if (m === null || MONTHS[m[1]!] === undefined) {
    throw new FormatChangedError(`Cleveland Fed: the nowcast month cell is not a Month-Year — "${cell}"`);
  }
  return `${m[2]}-${String(MONTHS[m[1]!]).padStart(2, '0')}`;
}

/** A blank numeric cell (the released marker) parses to undefined — never guessed. */
function blankAwareNumber(cell: string): number | undefined {
  const t = cell.trim();
  if (t === '') return undefined;
  const v = Number(t);
  return Number.isFinite(v) ? v : undefined;
}

/**
 * Parse the nowcasting page's HTML into the CPI nowcast rows (pure,
 * testable). Only the MoM table's CPI column feeds the accumulation; the
 * YoY table's CPI column rides the result for the fetch report (the
 * standing evidence). Rows whose CPI cells are blank (the print already
 * released, the venue's own marker) are skipped for that table.
 */
export function parseClevelandNowcasts(html: string): ClevelandNowcastRow[] {
  if (!html.includes('Inflation Nowcasting') && !html.includes('inflation-nowcasting')) {
    throw new FormatChangedError('Cleveland Fed: the nowcasting page marker is absent — the page shape changed');
  }
  const tables = html.match(/<table[\s\S]*?<\/table>/g) ?? [];
  if (tables.length < 2) {
    throw new FormatChangedError(`Cleveland Fed: expected 3 embedded nowcast tables, found ${tables.length}`);
  }
  const readTable = (captionNeedle: string): Map<string, { cpi?: number; updated: string }> => {
    const table = tables.find((t) => t.includes(`>${captionNeedle}<`) || t.includes(captionNeedle));
    if (table === undefined) {
      throw new FormatChangedError(`Cleveland Fed: the "${captionNeedle}" table is absent — the page shape changed`);
    }
    const rows = table.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
    const out = new Map<string, { cpi?: number; updated: string }>();
    for (const row of rows) {
      const cells =
        row
          .match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)
          ?.map((c) => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()) ?? [];
      if (cells.length < 6) continue;
      if (cells[0] === 'Month') continue; // the header row
      if (cells[0]!.startsWith('Note:')) continue; // the release-marker note
      const month = parseNowcastMonth(cells[0]!);
      const cpi = blankAwareNumber(cells[1]!);
      out.set(month, { cpi, updated: cells[5] ?? '' });
    }
    return out;
  };
  const mom = readTable('month-over-month');
  const yoy = readTable('year-over-year');
  const out: ClevelandNowcastRow[] = [];
  for (const [month, { cpi, updated }] of mom) {
    if (cpi === undefined) continue; // released per the venue's own blank-cell marker
    const yoyCpi = yoy.get(month)?.cpi;
    out.push({ month, cpiMom: cpi, cpiYoy: yoyCpi ?? Number.NaN, updated });
  }
  // Ascending by month (the page lists newest first).
  out.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  return out;
}

/** The nowcast rows as the accumulation series: one MoM point per reference month. */
export function nowcastSeriesOf(rows: readonly ClevelandNowcastRow[]): SeriesPoint[] {
  return rows.map((r) => ({ date: `${r.month}-01`, value: r.cpiMom }));
}

/**
 * Fetch the current CPI nowcast rows (one keyless request, the honest UA).
 * Throws loudly on a block, a non-2xx or a shape change; an empty result
 * means the venue serves no unreleased CPI month right now (hold, fail
 * closed — the accumulation keeps its frozen tail).
 */
export async function fetchClevelandNowcasts(deps: FetchDeps = {}): Promise<ClevelandNowcastRow[]> {
  const res = await insightsFetch(CLEVELAND_NOWCAST_URL, {}, deps);
  const html = await res.text();
  return parseClevelandNowcasts(html);
}
