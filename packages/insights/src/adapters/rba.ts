/**
 * RBA adapter — statistical-table CSVs fetched from rba.gov.au with the
 * browser header set (the Akamai edge 403s non-browser clients; probed
 * from the ingestion venue 2026-10-06 — GitHub Actions runner, HTTP 200 on
 * every table below). The build sandbox remains Akamai-blocked, so tests
 * run against the venue-recorded fixtures only.
 *
 * Series served (docs/insights/03-data-sources.md):
 *  - F1.1 'Cash Rate Target'  — monthly average (per-change indicator;
 *    F1.1 is the table the planning docs chose; the daily F1 table is a
 *    documented one-line upgrade if daily precision is ever wanted).
 *  - F2  'Australian Government 10 year bond' — daily, publishes with a
 *    2–4 business-day lag (drives the au-us-10y-gap cadence decision).
 *  - E2  'Household debt to income' — quarterly ABS-calculated ratios
 *    republished by the RBA; future quarters arrive pre-scaffolded empty
 *    and are skipped by the parser.
 */

import { fetchWithRetry } from '@currena/scraper';
import { parseRbaTableCsv } from '../parsers';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const RBA_CSV_BASE = 'https://www.rba.gov.au/statistics/tables/csv';

export interface RbaTableSpec {
  /** File name without extension, e.g. 'f1.1'. */
  file: string;
  /** Title-line prefix, e.g. 'F1.1' (loud identity check). */
  prefix: string;
  /** Exact series title in the 'Title' header row. */
  series: string;
}

export const RBA_TABLES = {
  cashRate: { file: 'f1.1', prefix: 'F1.1', series: 'Cash Rate Target' },
  au10y: { file: 'f2', prefix: 'F2', series: 'Australian Government 10 year bond' },
  householdDebtToIncome: { file: 'e2', prefix: 'E2', series: 'Household debt to income' },
} as const satisfies Record<string, RbaTableSpec>;

export type RbaTableKey = keyof typeof RBA_TABLES;

export function rbaTableUrl(spec: RbaTableSpec): string {
  return `${RBA_CSV_BASE}/${spec.file}-data.csv`;
}

/** Fetch and parse one RBA table series (full history). */
export async function fetchRbaSeries(key: RbaTableKey, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const spec = RBA_TABLES[key];
  // RBA tables are a few hundred KB and Akamai-throttled — a wider timeout
  // than the 12s default, still overridable.
  const { timeoutMs, ...rest } = deps;
  const res = await fetchWithRetry(rbaTableUrl(spec), {}, { ...rest, timeoutMs: timeoutMs ?? 45_000 });
  const text = await res.text();
  return parseRbaTableCsv(text, { tablePrefix: spec.prefix, seriesTitle: spec.series });
}
