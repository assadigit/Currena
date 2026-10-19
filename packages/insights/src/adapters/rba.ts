/**
 * RBA adapter — statistical-table CSVs fetched from rba.gov.au with the
 * browser header set (the Akamai edge 403s non-browser clients; probed
 * from the ingestion venue 2026-10-06 — GitHub Actions runner, HTTP 200 on
 * every table below). The build sandbox remains Akamai-blocked, so tests
 * run against the venue-recorded fixtures only.
 *
 * Series served (docs/insights/03-data-sources.md):
 *  - F1  'Cash Rate Target'  — DAILY (Step-1 audit item A4: the actual
 *    target, so a decision-day move shows at once — the September-2026
 *    hike reads 4.60% from its effective date, not the month's average).
 *    F1.1 (monthly average) stays fetched as the fallback: derived.ts
 *    prefers the daily series and falls back to F1.1 if the daily table
 *    ever fails to parse.
 *  - F2  'Australian Government 10 year bond' — daily, publishes with a
 *    2–4 business-day lag (drives the au-us-10y-gap cadence decision).
 *  - E2  'Household debt to income' — quarterly ABS-calculated ratios
 *    republished by the RBA; future quarters arrive pre-scaffolded empty
 *    and are skipped by the parser.
 *  - F6  Series ID FLRHOOTA (I15, 2026-10-08 data spec §3) — the average
 *    rate on OUTSTANDING owner-occupier housing loans, all loans, all
 *    institutions: "the home-loan rate people actually pay". Matched by
 *    Series ID, not title — the RBA rewords titles over time (external
 *    parsers use the same convention). Latest venue-verified value: 6.21%
 *    (2026-08, cross-checked against the RBA's published F6 page).
 *  - F4.1 Series ID PDRNTH (Step-2 add-list §B7) — the weighted-average
 *    PAID rate on new household term deposits, monthly since Jul-2019
 *    (the table's full extent). Venue-verified 2026-10-13; matched by
 *    Series ID like F6.
 */

import { insightsFetch } from './fetch-policy';
import { parseRbaTableCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const RBA_CSV_BASE = 'https://www.rba.gov.au/statistics/tables/csv';

export interface RbaTableSpec {
  /** File name without extension, e.g. 'f1.1'. */
  file: string;
  /** Title-line prefix, e.g. 'F1.1' (loud identity check). */
  prefix: string;
  /** Exact series title in the 'Title' header row (mutually exclusive with seriesId). */
  series?: string;
  /** Exact Series ID in the 'Series ID' metadata row (I15 — the stable identifier). */
  seriesId?: string;
}

export const RBA_TABLES = {
  cashRateDaily: { file: 'f1', prefix: 'F1', series: 'Cash Rate Target' },
  cashRate: { file: 'f1.1', prefix: 'F1.1', series: 'Cash Rate Target' },
  au10y: { file: 'f2', prefix: 'F2', series: 'Australian Government 10 year bond' },
  // Fix spec C-06 (2026-10-14): F2's 3-year series — the RBA-expectations
  // card (3-year government bond yield minus the cash rate). Series ID
  // FCMYGBAG3D confirmed from the F2 CSV's own Series ID row.
  au3y: { file: 'f2', prefix: 'F2', seriesId: 'FCMYGBAG3D' },
  householdDebtToIncome: { file: 'e2', prefix: 'E2', series: 'Household debt to income' },
  homeLoanOutstanding: { file: 'f6', prefix: 'F6', seriesId: 'FLRHOOTA' },
  // Step-2 add-list §B7: F4.1 "Paid Deposit Rates" (the RBA's monthly table
  // of the rates banks actually PAY, replacing the retired F5 layout —
  // venue-verified 2026-10-13, table published 08-Oct-2026). PDRNTH = the
  // weighted-average rate on NEW household term deposits — the number a
  // saver shopping today can get, and the savings twin of F6's
  // "what borrowers actually pay".
  depositRateNewTermHouseholds: { file: 'f4.1', prefix: 'F4.1', seriesId: 'PDRNTH' },
} as const satisfies Record<string, RbaTableSpec>;

export type RbaTableKey = keyof typeof RBA_TABLES;

export function rbaTableUrl(spec: RbaTableSpec): string {
  return `${RBA_CSV_BASE}/${spec.file}-data.csv`;
}

/** Fetch and parse one RBA table series (full history). */
/**
 * Fetch ONE RBA table's CSV text. v3 F-08 (2026-10-20): pass a `memo` map so
 * a single refresh downloads each table document exactly ONCE no matter how
 * many series are parsed from it (the F2 10y + 3y pair previously cost two
 * identical downloads per run).
 */
export async function fetchRbaTableText(
  key: RbaTableKey,
  deps: FetchDeps = {},
  memo?: Map<string, Promise<string>>,
): Promise<string> {
  const spec: RbaTableSpec = RBA_TABLES[key];
  // RBA tables are a few hundred KB and Akamai-throttled — a wider timeout
  // than the 12s default, still overridable.
  const { timeoutMs, ...rest } = deps;
  const url = rbaTableUrl(spec);
  const existing = memo?.get(url);
  if (existing) return existing; // one request per table per refresh (F-08/T-32)
  const pending = insightsFetch(url, {}, { ...rest, timeoutMs: timeoutMs ?? 45_000 }).then((res) => res.text());
  memo?.set(url, pending);
  return pending;
}

/** Parse ONE series out of an already-downloaded RBA table CSV. */
export function parseRbaSeriesFromText(text: string, key: RbaTableKey): SeriesPoint[] {
  const spec: RbaTableSpec = RBA_TABLES[key];
  const opts: import('../parsers').RbaParseOptions =
    spec.seriesId !== undefined
      ? { tablePrefix: spec.prefix, seriesId: spec.seriesId }
      : { tablePrefix: spec.prefix, seriesTitle: spec.series };
  return parseRbaTableCsv(text, opts);
}

export async function fetchRbaSeries(key: RbaTableKey, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const text = await fetchRbaTableText(key, deps);
  return parseRbaSeriesFromText(text, key);
}
