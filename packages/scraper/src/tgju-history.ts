/**
 * tgju-history.ts — GPE R30 / F3b (2026-11-19): the TGJU profile-HISTORY
 * parse — Bridge-2's one-time backfill source (docs/specs/
 * gold-page-elevation: s1/11 §6 item 2 the backfill legs · s4/03 §1e the
 * verified route · s4/04 §2a the terms posture · s8/01 R30 · s8/02 row 21).
 *
 * THE ROUTE (live-verified 2026-11-19, all four legs 200 in ~1.9–2.3 s
 * each — the s16 M1 §4 record): every `https://www.tgju.org/profile/<slug>`
 * page links its own "full history list" («مشاهده لیست کامل تاریخچه»)
 * at `profile/<slug>/history`, which serves the 30 most recent DAILY rows
 * (~6 weeks of Tehran trading days; NO deeper pagination exists —
 * `?page=2` serves the identical page, `/history/2` redirects onto it,
 * and the page source carries no AJAX offset endpoint). Each row prints
 * BOTH calendars — columns (verified on all four legs):
 *
 *   بازگشایی (open) · کمترین (low) · بیشترین (high) · پایانی (close) ·
 *   میزان تغییر · درصد تغییر · تاریخ / میلادی (Gregorian) · تاریخ / شمسی (Jalali)
 *
 * so the parse is calendar-exact with NO Jalali→Gregorian conversion —
 * the Gregorian column is authoritative. Values print in the symbol's
 * own unit (RIAL for the Tehran items — the same ÷10-to-Toman rule the
 * ajax path applies happens downstream; USD for `ons`).
 *
 * THE FOUR-PAGE SET (the verified scope, s8/01 R30): `sekee` (Emami) ·
 * `sekeb` (Bahar) · `ons` (the ounce leg) · `price_dollar_rl` (the
 * free-dollar leg) — exactly the legs the premium history computes from.
 * The premium itself is NEVER scraped as a claim (s1/11 §6): the engine
 * COMPUTES it from the four legs' own closes.
 *
 * Fetch discipline (s4/04 §2a): one-time, off-hours, SEQUENTIAL (one
 * page at a time — never concurrent), riding the owner's accepted
 * production posture for TGJU (attribution "Source: TGJU" + the revision
 * caveat; the terms sentence recorded verbatim in s4/03 §1e).
 *
 * Platform-free (AGENTS.md rule 2): pure parse + web-standard fetch.
 */

import { fetchWithRetry } from './http';
import type { FetchRetryOptions } from './http';
import { ScraperError } from './errors';
import { normalizeTgjuNumber } from './tgju';

/** The profile-history page base: `https://www.tgju.org/profile/<slug>/history`. */
export const TGJU_PROFILE_HISTORY_SUFFIX = 'history';

/** The four backfill slugs (the s8/01 R30 set — s16-D1). */
export const TGJU_PREMIUM_BACKFILL_SLUGS = ['sekee', 'sekeb', 'ons', 'price_dollar_rl'] as const;
export type TgjuBackfillSlug = (typeof TGJU_PREMIUM_BACKFILL_SLUGS)[number];

export function tgjuProfileHistoryUrl(slug: string): string {
  return `https://www.tgju.org/profile/${slug}/history`;
}

/** One day of a symbol's history — the symbol's OWN unit (Rial for Tehran items, USD for `ons`). */
export interface TgjuHistoryRow {
  /** The Gregorian calendar day, ISO `YYYY-MM-DD` (the row's own میلادی column). */
  date: string;
  /** Day open. */
  open: number;
  /** Day low. */
  low: number;
  /** Day high. */
  high: number;
  /** Day close (پایانی) — the value the backfill computes the premium over. */
  close: number;
}

/** Match one `<tr>…</tr>` of the history table (spans/comments stripped first). */
const ROW_TD_RE = /<td[^>]*>([\s\S]*?)<\/td>/g;

/** A Gregorian `YYYY/MM/DD` cell (ASCII digits — the میلادی column's own print). */
const GREG_DATE_RE = /^(\d{4})\/(\d{2})\/(\d{2})$/;

/** A Jalali `YYYY/MM/DD` cell — present-shape check only (never converted; the Gregorian column is authoritative). */
const JALALI_DATE_RE = /^\d{4}\/\d{2}\/\d{2}$/;

/**
 * Extract the history table's rows from one profile-history page's HTML
 * (PURE — fixture-testable). Returns the rows in PAGE ORDER (newest
 * first — the page's own order); the caller sorts.
 *
 * Fail-closed per the repo's parser culture: NO table whose header
 * carries «پایانی» + «تاریخ / میلادی», or any row that does not parse
 * into exactly 8 well-formed cells (4 positive numbers + 2 change cells +
 * 2 date cells), throws a typed ScraperError — an upstream layout change
 * must fail loudly, never render garbage (rule 3).
 */
export function parseTgjuProfileHistory(html: string): TgjuHistoryRow[] {
  // Strip spans + comments FIRST: the change cells wrap their values in
  // <span class="high|low" dir="ltr">…</span>.
  const cleaned = html
    .replace(/<span[^>]*>|<\/span>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // The history table's signature: a <thead> whose header cells include
  // پایانی AND تاریخ / میلادی (the /history page's own 8-column shape —
  // distinct from the profile page's 7-column page-1 table and the
  // «امروز» live table, neither of which carries the میلادی column).
  const tableMatch = [...cleaned.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)].find((m) => {
    const thead = /<thead[\s\S]*?<\/thead>/.exec(m[0]);
    return thead !== null && thead[0].includes('پایانی') && thead[0].includes('تاریخ / میلادی');
  });
  if (tableMatch === undefined) {
    throw new ScraperError(
      'tgju_history_parse_failed',
      'TGJU profile-history HTML has no daily history table (پایانی + تاریخ / میلادی header) — upstream layout change?',
    );
  }

  const rows: TgjuHistoryRow[] = [];
  for (const tr of tableMatch[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells: string[] = [];
    ROW_TD_RE.lastIndex = 0;
    let td: RegExpExecArray | null;
    while ((td = ROW_TD_RE.exec(tr[1] ?? '')) !== null) {
      cells.push((td[1] ?? '').replace(/<[^>]+>/g, '').trim());
    }
    if (cells.length === 0) continue; // the header row carries <th>, not <td>
    if (cells.length !== 8) {
      throw new ScraperError(
        'tgju_history_parse_failed',
        `TGJU history row has ${cells.length} cells (expected 8: open/low/high/close/Δ/Δ%/میلادی/شمسی) — upstream layout change?`,
      );
    }
    const greg = GREG_DATE_RE.exec(cells[6] ?? '');
    if (greg === null || !JALALI_DATE_RE.test(cells[7] ?? '')) {
      throw new ScraperError(
        'tgju_history_parse_failed',
        `TGJU history row date cells do not match the میلادی/شمسی shape (${JSON.stringify(cells[6])} / ${JSON.stringify(cells[7])})`,
      );
    }
    let open: number;
    let low: number;
    let high: number;
    let close: number;
    try {
      open = normalizeTgjuNumber(cells[0] ?? '');
      low = normalizeTgjuNumber(cells[1] ?? '');
      high = normalizeTgjuNumber(cells[2] ?? '');
      close = normalizeTgjuNumber(cells[3] ?? '');
    } catch (err) {
      throw new ScraperError(
        'tgju_history_parse_failed',
        `TGJU history row OHLC cells do not parse (${err instanceof Error ? err.message : String(err)})`,
      );
    }
    // The میزان تغییر / درصد تغییر cells (4/5) are TGJU's own derived
    // columns — not consumed (the engine recomputes every change it
    // renders); their presence is part of the row shape either way.
    rows.push({
      date: `${greg[1] ?? ''}-${greg[2] ?? ''}-${greg[3] ?? ''}`,
      open,
      low,
      high,
      close,
    });
  }
  if (rows.length === 0) {
    throw new ScraperError(
      'tgju_history_parse_failed',
      'TGJU profile-history table matched but yielded zero rows — upstream layout change?',
    );
  }
  return rows;
}

export type TgjuHistoryFetchOptions = FetchRetryOptions;

/**
 * Fetch ONE slug's profile-history page and parse it. The backfill caller
 * invokes this SEQUENTIALLY over the four slugs (the off-hours one-time
 * discipline — never concurrent, s4/04 §2a). `fetchImpl` is injectable
 * through FetchRetryOptions — tests replay saved pages, never live sites.
 */
export async function fetchTgjuProfileHistory(
  slug: TgjuBackfillSlug | string,
  opts: TgjuHistoryFetchOptions = {},
): Promise<TgjuHistoryRow[]> {
  const res = await fetchWithRetry(tgjuProfileHistoryUrl(slug), {}, opts);
  return parseTgjuProfileHistory(await res.text());
}
