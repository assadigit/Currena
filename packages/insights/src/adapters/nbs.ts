/**
 * NBS adapter — China's National Bureau of Statistics English press
 * releases (M7 of the D-42 milestones, 2026-10-26).
 *
 * The probe evidence (this session, both live): the NBS English
 * PressRelease index answers HTTP 200 and lists each month's statistical
 * releases as plain anchor+date rows; the PMI release ("Purchasing
 * Managers' Index for <Month> <Year>", published on the 1st of M+1)
 * carries "Table 1 China's Manufacturing PMI and Sub-indexes" — a full
 * 13-month history in one page; the CPI release ("Consumer Price Index
 * in <Month> <Year>", published ~T+10) states the year-on-year growth in
 * its headline sentence AND its summary table row. The data.stats.gov.cn
 * easy-query API is WAF-blocked (403 UrlACL, probed 2026-10-26) and no
 * RSS feed exists — the press-release scan is the only machine-readable
 * path, so that is what this adapter rides.
 *
 * Fetch shape (the collect layer's 04:10 shape): the index page 1 (+
 * page 2 only when a release link is missing), then the two release
 * pages — 3 subrequests typical, 4 worst case. china-pmi's Table 1
 * rebuilds a 13-month rolling window on every fetch; china-cpi's release
 * carries only its own month, so the CPI series also merges the
 * committed seed (data/manual/china-cpi.json) and the stored
 * accumulation (derived.ts's union — fetched wins on collision).
 *
 * Licence (register row 'nbs-china', licences.ts 'nbs'): the NBS Terms of
 * Service (read 2026-10-26, stats.gov.cn/english/nbs/200701/
 * t20070104_59236.html): "Welcome to reprint or quote the contents of
 * this website" with the attribution line, and — Section III "Use of
 * data" item 1 — "You are allowed to download and use the statistical
 * data on this website." Attributed quotation + download-and-use are the
 * publisher's own affirmative permissions; the card carries the NBS
 * attribution and the values are verbatim (never recomputed).
 *
 * Series shape: monthly observations dated to MONTH-END (the china-pmi
 * manual seed's convention — 2026-09-30, verified identical against this
 * release table for all 10 seed observations). T-03 never applies
 * (monthly releases are not trading-day series); the monthly cadence's
 * 45-day grace covers the release cycles (PMI: month-end obs published
 * on the 1st of M+1 → max age ~33 days; CPI: published ~T+10 → max age
 * ~41 days).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';
import { assertAscending } from '../series';

/** The NBS English press-release index (15 releases per page, newest first). */
export const NBS_PRESS_INDEX_URL = 'https://www.stats.gov.cn/english/PressRelease/';
/** Page 2 of the index (index_1.html — the site's pagination convention). */
export const NBS_PRESS_INDEX_PAGE_2_URL = 'https://www.stats.gov.cn/english/PressRelease/index_1.html';

const MONTHS: Readonly<Record<string, number>> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

/** Strip tags + collapse whitespace — one text cell (the boe.ts pattern). */
function cellText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n');
}

export interface NbsReleaseLink {
  /** Absolute release-page URL. */
  url: string;
  /** The anchor's own title, e.g. "Purchasing Managers' Index for September 2026". */
  title: string;
  /** The page's publication date (YYYY-MM-DD). */
  published: string;
}

/**
 * Parse one index page's release rows. Pure and total: every
 * target=_blank anchor followed by a date <span> becomes a link entry;
 * anything else is skipped silently (the index carries a few non-release
 * anchors). Titles/entities are decoded to plain text.
 */
export function parseNbsPressIndex(html: string, baseUrl: string): NbsReleaseLink[] {
  const out: NbsReleaseLink[] = [];
  const anchorRe = /<a\s([^>]*target="_blank"[^>]*)>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(anchorRe)) {
    const attrs = m[1]!;
    const titleMatch = /title="([^"]*)"/.exec(attrs);
    const hrefMatch = /href="([^"]*)"/.exec(attrs);
    if (titleMatch === null || hrefMatch === null) continue;
    const title = titleMatch[1]!
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&amp;/gi, '&')
      .replace(/\u2019/g, "'")
      .trim();
    const href = hrefMatch[1]!.trim();
    if (!/^\d{6}\/t\d+_/.test(href.replace(/^\.\//, ''))) continue; // only ./YYYYMM/tYYYYMMDD_id.html rows
    // the publication date rides the <span> inside the SAME list row —
    // never past the next anchor (nav chrome carries no span)
    const after = html.slice((m.index ?? 0) + m[0]!.length);
    const until = after.search(/<a\s/);
    const window = until >= 0 ? after.slice(0, until) : after.slice(0, 200);
    const spanMatch = /<span>\s*(\d{4}-\d{2}-\d{2})\s*<\/span>/.exec(window);
    if (spanMatch === null) continue;
    let url: string;
    try {
      url = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    out.push({ url, title, published: spanMatch[1]! });
  }
  return out;
}

const PMI_TITLE_RE = /^Purchasing Managers' Index for ([A-Z][a-z]+) (\d{4})$/;
const CPI_TITLE_RE = /^Consumer Price Index in ([A-Z][a-z]+) (\d{4})$/;

/** The newest PMI release link on the scanned index pages (page order = newest first). */
export function latestPmiRelease(links: readonly NbsReleaseLink[]): NbsReleaseLink | undefined {
  return links.find((l) => PMI_TITLE_RE.test(l.title));
}

/** The newest CPI release link on the scanned index pages (page order = newest first). */
export function latestCpiRelease(links: readonly NbsReleaseLink[]): NbsReleaseLink | undefined {
  return links.find((l) => CPI_TITLE_RE.test(l.title));
}

/** Last calendar day of (year, month) as YYYY-MM-DD (UTC — a date, never a timestamp). */
function monthEnd(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** A numeric line (the text-dump tables render each cell on its own line). */
function isNumber(line: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(line);
}

/**
 * Parse a PMI release page into the manufacturing-PMI series (Table 1's
 * first numeric column). Pure and total; a missing/renamed table throws
 * FormatChangedError (F-16) — never a guess.
 *
 * Table shape (verified live 2026-10-26, the Sep-2026 release): a
 * "Table 1" header, column labels, then month rows — the FIRST row
 * carries an explicit year ("2025-September"), the following rows are
 * bare month names ("October"…), each followed by six numeric cells
 * (PMI, Production, New Order, Raw Materials Inventory, Employment,
 * Supplier Delivery). The year increments when a bare month's number is
 * lower than its predecessor (January after December).
 */
export function parseNbsPmiRelease(html: string): SeriesPoint[] {
  const lines = cellText(html).split('\n');
  const tableStart = lines.findIndex((l) => /Table 1\b/.test(l) && /PMI/.test(l));
  if (tableStart < 0) {
    throw new FormatChangedError('NBS PMI release: the Table 1 header was not found (layout changed?)');
  }
  const out: SeriesPoint[] = [];
  let year: number | undefined;
  let prevMonth: number | undefined;
  let i = tableStart + 1;
  // skip past the column-label lines until the first month row
  while (i < lines.length) {
    const label = lines[i]!;
    let m = /^(\d{4})-([A-Z][a-z]+)$/.exec(label);
    if (m !== null) {
      const mn = MONTHS[m[2]!];
      if (mn === undefined) {
        i++;
        continue;
      }
      year = Number(m[1]!);
      prevMonth = mn;
      // the six numeric cells follow
      const cells: number[] = [];
      let j = i + 1;
      while (cells.length < 6 && j < lines.length && isNumber(lines[j]!)) {
        cells.push(Number(lines[j]!));
        j++;
      }
      if (cells.length === 0) throw new FormatChangedError(`NBS PMI Table 1: month row "${label}" carried no values`);
      out.push({ date: monthEnd(year, mn), value: cells[0]! });
      i = j;
      continue;
    }
    m = /^([A-Z][a-z]+)$/.exec(label);
    if (m !== null && year !== undefined) {
      const mn = MONTHS[m[1]!];
      if (mn === undefined) {
        i++;
        continue;
      }
      if (prevMonth !== undefined && mn < prevMonth) year += 1; // January after December
      prevMonth = mn;
      const cells: number[] = [];
      let j = i + 1;
      while (cells.length < 6 && j < lines.length && isNumber(lines[j]!)) {
        cells.push(Number(lines[j]!));
        j++;
      }
      if (cells.length === 0) throw new FormatChangedError(`NBS PMI Table 1: month row "${label}" carried no values`);
      out.push({ date: monthEnd(year, mn), value: cells[0]! });
      i = j;
      continue;
    }
    // a second table's month labels must never be picked up: stop at Table 2
    if (/Table 2\b/.test(label)) break;
    i++;
  }
  if (out.length < 12) {
    throw new FormatChangedError(`NBS PMI Table 1: expected the 13-month history, found ${out.length} month rows`);
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const p of out) {
    if (p.value < 0 || p.value > 100) {
      throw new FormatChangedError(`NBS PMI Table 1: out-of-range value ${p.value} on ${p.date}`);
    }
  }
  assertAscending(out);
  return out;
}

/**
 * Parse a CPI release page into a single YoY observation (the release
 * month's year-on-year growth). The value is read from the summary
 * table's "Consumer Price Index" row — the second numeric cell is the
 * Y/Y column (M/M, Y/Y, Jan-year-to-date; the January release drops the
 * third column) — and cross-checked against the headline sentence
 * ("increased by X% year on year" / "decreased by X%"); a disagreement
 * beyond 0.05 throws FormatChangedError.
 */
export function parseNbsCpiRelease(html: string): SeriesPoint[] {
  const lines = cellText(html).split('\n');
  // the observation date comes from the page title
  const titleIdx = lines.findIndex((l) => CPI_TITLE_RE.test(l));
  if (titleIdx < 0) {
    throw new FormatChangedError('NBS CPI release: the "Consumer Price Index in <Month> <Year>" title was not found');
  }
  const tm = CPI_TITLE_RE.exec(lines[titleIdx]!)!;
  const month = MONTHS[tm[1]!];
  const year = Number(tm[2]!);
  if (month === undefined || !Number.isFinite(year)) {
    throw new FormatChangedError(`NBS CPI release: unparsable month/year "${tm[1]} ${tm[2]}"`);
  }
  const date = monthEnd(year, month);
  // the summary table's row: the exact "Consumer Price Index" cell after
  // the "Consumer Price Indexes in …" header
  const headerIdx = lines.findIndex((l, k) => k > titleIdx && /^Consumer Price Indexes in /.test(l));
  if (headerIdx < 0) {
    throw new FormatChangedError('NBS CPI release: the summary table header was not found (layout changed?)');
  }
  const rowIdx = lines.findIndex((l, k) => k > headerIdx && l === 'Consumer Price Index');
  if (rowIdx < 0) {
    throw new FormatChangedError('NBS CPI release: the "Consumer Price Index" table row was not found');
  }
  const cells: number[] = [];
  let j = rowIdx + 1;
  while (cells.length < 3 && j < lines.length && isNumber(lines[j]!)) {
    cells.push(Number(lines[j]!));
    j++;
  }
  if (cells.length < 2) {
    throw new FormatChangedError('NBS CPI release: the Consumer Price Index row carried no Y/Y cell');
  }
  const value = cells[1]!;
  if (!Number.isFinite(value) || value < -10 || value > 20) {
    throw new FormatChangedError(`NBS CPI release: out-of-range Y/Y value ${value} for ${date}`);
  }
  // the headline sentence cross-check (the paragraph before the table)
  const headlineIdx = lines.findIndex(
    (l, k) => k < headerIdx && /Consumer Price Index \(CPI\) (increased|decreased|was flat|remained flat|was unchanged)/.test(l),
  );
  if (headlineIdx >= 0) {
    const headline = lines[headlineIdx]!;
    const inc = /increased by (-?\d+(?:\.\d+)?)%/.exec(headline);
    const dec = /decreased by (-?\d+(?:\.\d+)?)%/.exec(headline);
    const flat = /(was flat|remained flat|was unchanged)/.test(headline);
    const headlineValue = inc !== null ? Number(inc[1]) : dec !== null ? -Number(dec[1]) : flat ? 0 : null;
    if (headlineValue !== null && Math.abs(headlineValue - value) > 0.05) {
      throw new FormatChangedError(
        `NBS CPI release: the headline ${headlineValue}% disagrees with the table Y/Y ${value}% for ${date}`,
      );
    }
  }
  return [{ date, value }];
}

/** Fetch one index page (page 1 = the live index; page 2 = index_1.html). */
export async function fetchNbsIndexPage(page: 1 | 2, deps: FetchDeps = {}): Promise<string> {
  const url = page === 1 ? NBS_PRESS_INDEX_URL : NBS_PRESS_INDEX_PAGE_2_URL;
  const res = await insightsFetch(url, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  return res.text();
}

/** Fetch + parse a PMI release page (Table 1's 13-month history). */
export async function fetchNbsPmiRelease(url: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(url, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  return parseNbsPmiRelease(await res.text());
}

/** Fetch + parse a CPI release page (the release month's YoY observation). */
export async function fetchNbsCpiRelease(url: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(url, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  return parseNbsCpiRelease(await res.text());
}
