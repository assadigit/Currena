/**
 * sge.ts — GF-S10 (2026-11-06, the remaining P3 sources — the audit
 * report §4 rank 22 / F6): the Shanghai Gold Exchange's Au99.99 daily
 * close (CNY/gram) — the Shanghai premium derivation's SGE leg, "the
 * classic scarcity tell".
 *
 * The venue (read live 2026-11-06, the honest CurrenaDashboard UA — no
 * identity circumvention): the daily-report endpoint
 *   /sjzx/quotation_daily_new?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * serves the day's full contract table (Au99.99 among ~15 contracts,
 * ~20 rows per page). One page per day requested; the rung asks for
 * ONLY the latest trading day (one subrequest), and the derived premium
 * accumulates from there. The archive reaches back to ~2024 (measured
 * this session: 2024-10 serves, 2023-10 does not) — the GF-P4 backfill
 * wrote the ~2-year history the venue offers.
 *
 * Licence (the register's sge row, L2): the exchange's own footer reads
 * "Copyright 2016 上海黄金交易所 All Right Reserved" — no affirmative
 * reuse grant quoted; the card serves PRIVATE until the owner records
 * acceptance (the agent never edits ownerAccepts).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const SGE_DAILY_URL = 'https://www.sge.com.cn/sjzx/quotation_daily_new';

/** The parse pins these column headers (F-16: a shape change fails loudly). */
const EXPECTED_HEADERS = ['Date', 'Contract', 'Open', 'Highest', 'Lowest', 'Close'] as const;

/** The contract the premium derivation reads (the main-board 99.99 gold). */
export const SGE_AU9999 = 'Au99.99' as const;

/** One day's Au99.99 row. */
export interface SgeAu9999Point {
  date: string;
  /** The CLOSE, CNY/gram. */
  close: number;
}

/**
 * Fetch the Au99.99 daily closes for a date range (ONE page — the
 * endpoint paginates at 20 rows ≈ 1.3 trading days; callers ask for a
 * single day). Fails loudly on a block, a non-2xx or a shape change.
 *
 * `page` (default 1) and `instIds` (default '' = every contract) exist
 * for the one-off GF-P4 backfill's archive walk — the production rung
 * always reads page 1 unfiltered (the latest trading days, exactly what
 * the daily derivation needs; zero subrequest growth). The venue MEASURES
 * (live 2026-11-06): ranges longer than ~45 days serve an EMPTY table,
 * and a PAST-THE-END page serves page 1's content again — a walk uses
 * ≤31-day windows, `instIds: SGE_AU9999` (20 trading days per page) and
 * stops on the first non-advancing page, never on an empty one.
 */
export async function fetchSgeAu9999(
  start: string,
  end: string,
  deps: FetchDeps = {},
  page = 1,
  instIds = '',
): Promise<SgeAu9999Point[]> {
  const url =
    `${SGE_DAILY_URL}?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}` +
    `&inst_ids=${encodeURIComponent(instIds)}&p=${page}`;
  const res = await insightsFetch(url, {}, deps);
  const html = await res.text();
  return parseSgeAu9999(html);
}

/**
 * Parse the daily-report HTML's Au99.99 rows (pure, testable). The page
 * serves other contracts beside Au99.99 (iAu99.99 is a DIFFERENT
 * contract — the international board — and must never be confused with
 * the main-board row).
 */
export function parseSgeAu9999(html: string): SgeAu9999Point[] {
  if (!html.includes('daily_new_table')) {
    throw new FormatChangedError('SGE: the daily-report table marker (daily_new_table) is absent — the page shape changed');
  }
  // Every data row: <tr>…<td>serial</td><td>DATE</td><td>Contract</td>…</tr>
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];
  const out: SgeAu9999Point[] = [];
  for (const row of rows) {
    const cells =
      row
        .match(/<td[^>]*>([\s\S]*?)<\/td>/g)
        ?.map((c) => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()) ?? [];
    if (cells.length < 6) continue;
    // Pin the column semantics (serial, date, contract, open, high, low, close, …).
    if (cells[1] === undefined || cells[2] === undefined || cells[6] === undefined) continue;
    const date = cells[1]!;
    const contract = cells[2]!;
    const close = Number(cells[6]!);
    if (contract !== SGE_AU9999) continue; // iAu99.99 and the other contracts are NOT the main board
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new FormatChangedError(`SGE: the Au99.99 date cell is not a date — "${date}"`);
    }
    if (!Number.isFinite(close) || close <= 0) {
      throw new FormatChangedError(`SGE: the Au99.99 close is not a positive number — "${cells[6]}"`);
    }
    out.push({ date, close });
  }
  if (out.length === 0) {
    // A queried non-trading day legitimately carries no Au99.99 row — the
    // caller re-asks the previous day. (A format change already threw above.)
    return out;
  }
  return out;
}

/** The parse's column-header pin, exported for the tests. */
export const SGE_EXPECTED_HEADERS = EXPECTED_HEADERS;

/** A convenience: one point (the latest trading day's close) or none. */
export async function fetchSgeAu9999Latest(day: string, deps: FetchDeps = {}): Promise<SgeAu9999Point | undefined> {
  const points = await fetchSgeAu9999(day, day, deps);
  return points.at(-1);
}

/**
 * The rung's fetch: ONE page over the trailing 7-day window — page 1
 * carries the LATEST ~1–2 trading days (the endpoint orders
 * descending), so weekends and CN/US holidays never leave the rung
 * empty-handed. Returns the Au99.99 closes the page carries (0–2
 * points), sorted ascending.
 */
export async function fetchSgeAu9999Recent(now: Date, deps: FetchDeps = {}): Promise<SgeAu9999Point[]> {
  const end = now.toISOString().slice(0, 10);
  const startMs = now.getTime() - 6 * 24 * 60 * 60 * 1000;
  const start = new Date(startMs).toISOString().slice(0, 10);
  return fetchSgeAu9999(start, end, deps);
}

/** SeriesPoint shape for the derivation (date + close). */
export function sgeSeriesOf(points: readonly SgeAu9999Point[]): SeriesPoint[] {
  return points.map((p) => ({ date: p.date, value: p.close }));
}
