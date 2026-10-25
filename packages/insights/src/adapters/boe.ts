/**
 * Bank of England adapter — the official Bank Rate history page.
 *
 * M6 Wave-4 probe (2026-10-25, this session): the BoE's own IADB
 * "Bank Rate history and data" page answers HTTP 200 from BOTH probe
 * venues (sandbox curl + the live site), carrying the COMPLETE decision
 * table (Date Changed | Rate) back to 1975 — 258 decision rows, latest
 * 3.75 since 18 Dec 2025. This replaces boe-rate's FRED OECD monthly
 * mirror (IRSTCI01GBM156N, the M2 "monthly average, lagged" relabel)
 * with the central bank's own current rate — the same upgrade shape the
 * RBA cash-rate page already uses on the Worker venue.
 *
 * Licence (register row 'boe-database'): the BoE legal page states the
 * Database's data is "subject to the terms of the UK Open Government
 * Licence, allowing and encouraging free and flexible data reuse" —
 * attribution class, like CC BY (read 2026-10-25).
 *
 * Series shape: the page is a DECISION table (one row per change). The
 * rba-cash-rate card's series is DAILY (F1), so this adapter expands the
 * decisions into a daily step series over the percentile decade window —
 * the reading's 10-year position, lastChange and fromPeak10y then work
 * exactly like the other three policy cards (fed-target, ecb-dfr,
 * rba-cash-rate). T-08 never applies (cadence 'per-change' is exempt);
 * T-03 never applies (policy rates are not trading-day series).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';
import { assertAscending } from '../series';

/** The BoE's published Bank Rate history page (HTML, decision table inside). */
export const BOE_BANK_RATE_URL = 'https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp';

const MONTHS: Readonly<Record<string, string>> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** "18 Dec 25" → "2025-12-18" (the page's only date format, 2-digit year). */
function parseBoeDate(raw: string): string | null {
  const m = /^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{2})$/.exec(raw.trim());
  if (m === null) return null;
  const month = MONTHS[m[2]!];
  if (month === undefined) return null;
  const yy = Number(m[3]!);
  // The table spans 1975 → today: two-digit years under 70 are 2000s.
  const year = yy < 70 ? 2000 + yy : 1900 + yy;
  return `${year}-${month}-${m[1]!.padStart(2, '0')}`;
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
 * Parse the Bank Rate decision table out of the page HTML. Pure and total:
 * the table is identified by its header ("Date Changed" | "Rate"); every
 * data row must carry a parseable date and a finite rate. A layout change
 * throws loudly (FormatChangedError) — never a guess.
 */
export function parseBoeBankRateHtml(html: string): SeriesPoint[] {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]!);
  let sawHeader = false;
  const out: SeriesPoint[] = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => cellText(c[1]!));
    if (cells.length === 0) continue;
    if (!sawHeader) {
      if (cells[0] === 'Date Changed' && cells[1]?.toLowerCase() === 'rate') {
        sawHeader = true;
      }
      continue;
    }
    const date = cells[0] !== undefined ? parseBoeDate(cells[0]) : null;
    if (date === null) continue; // notes/spacer rows are skipped
    const rateRaw = cells[1] ?? '';
    const value = Number(rateRaw);
    if (!Number.isFinite(value) || value <= 0) {
      throw new FormatChangedError(
        `BoE Bank Rate table: row "${cells.join(' | ')}" carries no parseable rate`,
      );
    }
    out.push({ date, value });
  }
  if (!sawHeader) {
    throw new FormatChangedError('BoE Bank Rate page: decision table header not found (layout changed?)');
  }
  if (out.length === 0) {
    throw new FormatChangedError('BoE Bank Rate page: decision table carried no rows');
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  assertAscending(out);
  return out;
}

/**
 * The percentile-decade window the daily expansion covers (10y + 90d
 * margin, the FRED cosd discipline — ecbHicpFrom's sibling).
 */
export function boeWindowStart(now: Date = new Date()): string {
  return new Date(now.getTime() - (3_650 + 90) * 86_400_000).toISOString().slice(0, 10);
}

function epochDay(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

function dayFromEpoch(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Expand the decision rows into a DAILY step series over the percentile
 * decade window (the RBA F1 shape): one point per calendar day, the rate
 * carried forward from the last decision on or before that day. Pure —
 * `decisions` must be sorted ascending (parseBoeBankRateHtml's output is).
 */
export function boeBankRateDailySeries(
  decisions: readonly SeriesPoint[],
  now: Date = new Date(),
): SeriesPoint[] {
  if (decisions.length === 0) return [];
  const startDay = epochDay(boeWindowStart(now));
  const endDay = epochDay(now.toISOString().slice(0, 10));
  const out: SeriesPoint[] = [];
  let idx = 0;
  // Skip to the last decision at/before the window start (its rate carries in).
  while (idx + 1 < decisions.length && epochDay(decisions[idx + 1]!.date) <= startDay) idx++;
  for (let day = startDay; day <= endDay; day++) {
    while (idx + 1 < decisions.length && epochDay(decisions[idx + 1]!.date) <= day) idx++;
    out.push({ date: dayFromEpoch(day), value: decisions[idx]!.value });
  }
  return out;
}

/** Fetch the Bank Rate page and parse its decision table (full history). */
export async function fetchBoeBankRateDecisions(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(BOE_BANK_RATE_URL, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  const html = await res.text();
  return parseBoeBankRateHtml(html);
}
