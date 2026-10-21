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

import { insightsFetch, FormatChangedError } from './fetch-policy';
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
  // F3 (2026-10-21 venue round): F2.1's MONTHLY 10-year yield — the
  // fallback while the Akamai edge 403s the f2-data.csv DAILY path from
  // Cloudflare egress (f2.1 IS served — venue-verified 2026-10-21 via the
  // rba-probe worker: f2 403, f2.1 200). Monthly granularity, same series
  // (FCMYGBAG10), published on the 2nd of each month — the au-10y card
  // goes from day-stale to at-most-a-month-stale, honestly labelled with
  // its own asOf date. Matched by Series ID: the F2.1 header carries
  // FCMYGBAG10 in its Series ID row.
  au10yMonthly: { file: 'f2.1', prefix: 'F2.1', seriesId: 'FCMYGBAG10' },
  // F3: F2.1's monthly 3-year yield (FCMYGBAG3) — the rba-expectations
  // fallback when the daily F2 family is unreachable.
  au3yMonthly: { file: 'f2.1', prefix: 'F2.1', seriesId: 'FCMYGBAG3' },
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

/** Fetch and parse one RBA table series (full history). */
export async function fetchRbaSeries(key: RbaTableKey, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const text = await fetchRbaTableText(key, deps);
  return parseRbaSeriesFromText(text, key);
}

/* ------------------------------------------------------------------ *
 * 2026-10-21 (data-integrity round) — the HTML cash-rate page.
 *
 * RBA's Akamai edge began 403ing the /statistics/tables/csv/* paths from
 * EVERY ingestion venue (build sandbox, GitHub Actions runners, and
 * Cloudflare Workers; any UA — an IP-reputation rule) on 2026-10-20. The
 * site's HTML pages are still served to Cloudflare Workers (venue-verified
 * live 2026-10-21: /statistics/cash-rate/ → HTTP 200). The currena-api
 * Worker — the new primary ingest venue — therefore reads the cash-rate
 * TARGET from that page's decision table, which carries the full history
 * (Effective Date | Change pts | Cash rate target %). The F1/F1.1 CSVs
 * stay in the chain for the day Akamai relents (and for any venue that
 * can still reach them).
 * ------------------------------------------------------------------ */

/** The cash-rate page's published URL (HTML, decision table inside). */
export const RBA_CASH_RATE_PAGE_URL = 'https://www.rba.gov.au/statistics/cash-rate/';

const MONTHS: Readonly<Record<string, string>> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** "30 Sep 2026" → "2026-09-30" (the page's only date format). */
function parseRbaDate(raw: string): string | null {
  const m = /^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/.exec(raw.trim());
  if (m === null) return null;
  const month = MONTHS[m[2]!];
  if (month === undefined) return null;
  return `${m[3]}-${month}-${m[1]!.padStart(2, '0')}`;
}

/** Strip tags + entities, collapse whitespace — one cell's text. */
function cellText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse the cash-rate decision table out of the page HTML. Pure and total:
 * the table is identified by its header ("Effective Date" … "Cash rate
 * target"); every data row must carry a parseable date and a finite target
 * (the change-points cell is optional in old rows). A layout change throws
 * loudly (FormatChangedError) — never a guess.
 */
export function parseRbaCashRateHtml(html: string): SeriesPoint[] {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]!);
  let inTable = false;
  let sawHeader = false;
  const out: SeriesPoint[] = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => cellText(c[1]!));
    if (cells.length === 0) continue;
    if (!sawHeader) {
      if (cells[0] === 'Effective Date' && cells.some((c) => c.toLowerCase().includes('cash rate target'))) {
        sawHeader = true;
        inTable = true;
      }
      continue;
    }
    if (inTable) {
      // The next table's header row (or a malformed row) ends the block.
      const date = cells[0] !== undefined ? parseRbaDate(cells[0]) : null;
      if (date === null) {
        // A row that is not a decision row (notes, spacers) is skipped; a
        // HEADER-like row closes the table (the page stacks more tables).
        if (cells.every((c) => c === '')) continue;
        const looksLikeHeader = /effective date|change|related documents/i.test(cells.join(' '));
        if (looksLikeHeader) {
          inTable = false;
          continue;
        }
        continue;
      }
      // Target: the first numeric cell after the date that is not the
      // change column's signed value — in practice column 3 ("4.60").
      // Pre-1990s rows carry a RANGE ("15.00 to 15.50"): the LOWER bound is
      // the value (the same convention the fed-target card uses for its
      // DFEDTARL/DFEDTARU corridor).
      const targetRaw = cells.find((c, i) => i >= 1 && i <= 3 && /^\d+(\.\d+)?( to \d+(\.\d+)?)?$/.test(c) && c !== cells[1]);
      if (targetRaw === undefined) {
        throw new FormatChangedError(
          `RBA cash-rate table: row "${cells.join(' | ')}" carries no parseable target percentage`,
        );
      }
      const lower = targetRaw.split(' to ')[0]!;
      const value = Number(lower);
      if (!Number.isFinite(value) || value <= 0) {
        throw new FormatChangedError(`RBA cash-rate table: non-positive target "${targetRaw}"`);
      }
      out.push({ date, value });
    }
  }
  if (!sawHeader) {
    throw new FormatChangedError('RBA cash-rate page: decision table header not found (layout changed?)');
  }
  if (out.length === 0) {
    throw new FormatChangedError('RBA cash-rate page: decision table carried no rows');
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** Fetch the cash-rate page and parse its decision table (full history). */
export async function fetchRbaCashRateDecisions(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(RBA_CASH_RATE_PAGE_URL, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  const html = await res.text();
  return parseRbaCashRateHtml(html);
}
