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
// gap-closure S6-M6.2 (2026-11-02): the China property/steel family's two
// dedicated releases — FIXED title patterns (verified live 2026-11-02,
// published 2026-10-20: "Investment in Real Estate Development from
// January to September 2026" + "Industrial Production Operation in
// September 2026"). The comprehensive "National Economy ..." release is
// deliberately NOT matched: its title is a prose headline that changes
// every month ("...was Generally Stable with New Achievement Made in..."),
// not a machine-readable pattern — the dedicated per-topic releases are.
// NOTE: the index's title attribute and the release page's own <title>
// differ by one word — the index reads "...from January to September 2026"
// while the release page reads "...from January to September in 2026"
// (both verified from the provider's own bytes 2026-11-02) — so the
// optional "in" accepts both observed forms, anchored everywhere else.
// The 2025 releases used "for January-<Month> <Year>" (verified:
// "...for January-November 2025", published 2025-12-16) and the annual
// reads "for <Year>" (verified: "...for 2025", published 2026-01-20) —
// all three forms accepted; the observation is the month-end of the
// LAST month named (December for the annual).
const REAL_ESTATE_TITLE_RE =
  /^Investment in Real Estate Development (?:from January to ([A-Z][a-z]+) (?:in )?|for January-([A-Z][a-z]+) |for )(\d{4})$/;
const INDUSTRIAL_PRODUCTION_TITLE_RE = /^Industrial Production Operation in ([A-Z][a-z]+) (\d{4})$/;

/** The newest PMI release link on the scanned index pages (page order = newest first). */
export function latestPmiRelease(links: readonly NbsReleaseLink[]): NbsReleaseLink | undefined {
  return links.find((l) => PMI_TITLE_RE.test(l.title));
}

/** The newest CPI release link on the scanned index pages (page order = newest first). */
export function latestCpiRelease(links: readonly NbsReleaseLink[]): NbsReleaseLink | undefined {
  return links.find((l) => CPI_TITLE_RE.test(l.title));
}

/** The newest real-estate-investment release link (S6-M6.2; the dedicated
 *  release — the fixed-pattern "Investment in Real Estate Development from
 *  January to <Month> in <Year>" title, verified live 2026-11-02). */
export function latestRealEstateRelease(links: readonly NbsReleaseLink[]): NbsReleaseLink | undefined {
  return links.find((l) => REAL_ESTATE_TITLE_RE.test(l.title));
}

/** The newest industrial-production release link (S6-M6.2; the fixed-pattern
 *  "Industrial Production Operation in <Month> <Year>" title, verified live
 *  2026-11-02 — carries the Output of Major Industrial Products table). */
export function latestIndustrialProductionRelease(links: readonly NbsReleaseLink[]): NbsReleaseLink | undefined {
  return links.find((l) => INDUSTRIAL_PRODUCTION_TITLE_RE.test(l.title));
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

/**
 * Parse the real-estate-investment release into ONE observation: the
 * year-to-date year-on-year growth of investment in real estate
 * development (the spec's "year-to-date, annual %" reading), read from
 * Table 1's "Investment in real estate development (100 million yuan)"
 * row — the SECOND numeric cell is the Y/Y column — and cross-checked
 * against the headline sentence ("the investment in real estate
 * development was X,XXX.X billion yuan, a year-on-year decrease/increase
 * of N%"): the level (billion yuan × 10 = the table's 100-million-yuan
 * cell) AND the signed growth must agree, else FormatChangedError (a
 * column shift can never pass silently).
 *
 * Verified live 2026-11-02 (the Jan-Sep 2026 release, published
 * 2026-10-20): Table 1 row 53364 / -20.6; headline "5,336.4 billion
 * yuan, a year-on-year decrease of 20.6%" → -20.6 @ 2026-09-30. The
 * observation is dated to the MONTH-END of the title's "January to
 * <Month>" (the china-pmi/cpi convention). January is reporting-exempt
 * (the release's own Annotation 3) — the first release of each year
 * covers Jan-Feb and reads "from January to February", which the title
 * pattern matches with month = February.
 */
export function parseNbsRealEstateRelease(html: string): SeriesPoint[] {
  const lines = cellText(html).split('\n');
  // the observation date comes from the page title (three verified forms:
  // the 2026 "from January to <Month> (in) <Year>", the 2025
  // "for January-<Month> <Year>", and the annual "for <Year>")
  const titleIdx = lines.findIndex((l) => REAL_ESTATE_TITLE_RE.test(l));
  if (titleIdx < 0) {
    throw new FormatChangedError(
      'NBS real-estate release: the "Investment in Real Estate Development" title was not found',
    );
  }
  const tm = REAL_ESTATE_TITLE_RE.exec(lines[titleIdx]!)!;
  // the annual form (no month named) reads as December
  const monthName = tm[1] ?? tm[2] ?? 'December';
  const month = MONTHS[monthName];
  const year = Number(tm[3]!);
  if (month === undefined || !Number.isFinite(year)) {
    throw new FormatChangedError(`NBS real-estate release: unparsable month/year "${monthName} ${tm[3]}"`);
  }
  const date = monthEnd(year, month);
  // Table 1 — the summary table (shape-validated: the column headers must
  // sit between the table title and the row, so a renamed column fails).
  // NOTE: the table title carries THREE verified variants — the 2026
  // monthly "Table 1 Real Estate Development and Sales from January to
  // <Month> <Year>", the combined Jan-Feb form WITHOUT the "Table 1"
  // prefix, the 2025 "Real Estate Development and Sales for
  // January-<Month> <Year>" and the annual "... for <Year>" (all
  // verified from the provider's own pages 2026-11-02) — "from" and
  // "for" both accepted, the prefix optional.
  const tableIdx = lines.findIndex(
    (l) => /^(?:Table 1\s+)?Real Estate Development and Sales (?:from|for)/.test(l),
  );
  if (tableIdx < 0) {
    throw new FormatChangedError('NBS real-estate release: the Table 1 header was not found (layout changed?)');
  }
  const rowIdx = lines.findIndex((l, k) => k > tableIdx && l === 'Investment in real estate development (100 million yuan)');
  if (rowIdx < 0) {
    throw new FormatChangedError('NBS real-estate release: the investment row was not found');
  }
  const headerSlice = lines.slice(tableIdx, rowIdx).join('\n');
  if (!/Absolute Value/.test(headerSlice) || !/Growth Rate Y\/Y/.test(headerSlice)) {
    throw new FormatChangedError(
      'NBS real-estate release: the Table 1 column headers (Absolute Value / Growth Rate Y/Y) were not found (layout changed?)',
    );
  }
  // the row cells: [absolute (100 million yuan), Y/Y %]
  const cells: number[] = [];
  let j = rowIdx + 1;
  while (cells.length < 2 && j < lines.length && isNumber(lines[j]!)) {
    cells.push(Number(lines[j]!));
    j++;
  }
  if (cells.length < 2) {
    throw new FormatChangedError('NBS real-estate release: the investment row carried no Y/Y cell');
  }
  const absolute = cells[0]!;
  const value = cells[1]!;
  if (!Number.isFinite(value) || value < -60 || value > 60) {
    throw new FormatChangedError(`NBS real-estate release: out-of-range YTD Y/Y value ${value} for ${date}`);
  }
  // the headline cross-check (the paragraph before the table — applied
  // when present, like the CPI parser; a DISAGREEMENT always throws)
  const headlineIdx = lines.findIndex(
    (l, k) =>
      k < tableIdx &&
      /investment in real estate development was [\d,.]+ billion yuan, a year-on-year (decrease|increase) of \d+(\.\d+)?%/.test(l),
  );
  if (headlineIdx >= 0) {
    const headline = lines[headlineIdx]!;
    const m = /investment in real estate development was ([\d,.]+) billion yuan, a year-on-year (decrease|increase) of (\d+(?:\.\d+)?)%/.exec(
      headline,
    );
    if (m !== null) {
      const levelBillion = Number(m[1]!.replace(/,/g, ''));
      const growth = m[2] === 'decrease' ? -Number(m[3]!) : Number(m[3]!);
      // 1 billion yuan = 10 × 100 million yuan (the table's own unit)
      if (Math.abs(levelBillion * 10 - absolute) > 1) {
        throw new FormatChangedError(
          `NBS real-estate release: the headline level ${m[1]} billion yuan disagrees with the table's ${absolute} (100 million yuan) for ${date}`,
        );
      }
      if (Math.abs(growth - value) > 0.05) {
        throw new FormatChangedError(
          `NBS real-estate release: the headline ${growth}% disagrees with the table Y/Y ${value}% for ${date}`,
        );
      }
    }
  }
  return [{ date, value }];
}

/**
 * Parse the industrial-production release into ONE observation: the
 * month's crude steel output in the provider's own unit (10,000 tons),
 * read from the "Output of Major Industrial Products of Enterprises
 * Above the Designated Size" table's "Crude Steel (10,000 tons)" row —
 * the FIRST numeric cell is the month's absolute output (the row's four
 * cells are [month, month Y/Y %, Jan-current YTD, YTD Y/Y %], verified
 * against the provider's own layout 2026-11-02) — and cross-checked
 * against the headline sentence's rolled-steel figure ("the output of
 * rolled steel was 118.17 million tons, down by 3.8% year on year"):
 * the Rolled Steel row's first cell must equal the prose level × 100
 * (million tons → 10,000 tons; 118.17 × 100 = 11817) and its second cell
 * must equal the prose Y/Y — a column shift can never pass silently. Some
 * neighbour rows carry the provider's own masked cells (an ellipsis),
 * which the row scan simply stops at.
 *
 * Verified live 2026-11-02 (the Sep-2026 release, published 2026-10-20):
 * Crude Steel row 7359 / 0.1 / 72477 / -2.9; rolled-steel prose
 * 118.17 million tons / -3.8% against the Rolled Steel row 11817 / -3.8
 * → 7359 @ 2026-09-30. The observation is dated to the release month's
 * end. NOTE: the Jan/Feb releases combine the two months (verified
 * wording to be captured when one is next seen — until then a combined
 * release simply does not match the single-month title pattern and the
 * card honestly holds its previous point).
 */
export function parseNbsIndustrialProductionRelease(html: string): SeriesPoint[] {
  const lines = cellText(html).split('\n');
  // the observation date comes from the page title
  const titleIdx = lines.findIndex((l) => INDUSTRIAL_PRODUCTION_TITLE_RE.test(l));
  if (titleIdx < 0) {
    throw new FormatChangedError('NBS industrial-production release: the "Industrial Production Operation in <Month> <Year>" title was not found');
  }
  const tm = INDUSTRIAL_PRODUCTION_TITLE_RE.exec(lines[titleIdx]!)!;
  const month = MONTHS[tm[1]!];
  const year = Number(tm[2]!);
  if (month === undefined || !Number.isFinite(year)) {
    throw new FormatChangedError(`NBS industrial-production release: unparsable month/year "${tm[1]} ${tm[2]}"`);
  }
  const date = monthEnd(year, month);
  // the products table (shape anchor). NOTE: the header's wording changed
  // between 2025 and 2026 — the 2025 releases read "Output of Major
  // Industrial Products Above the Designated Size" while the 2026 ones
  // insert "of Enterprises" (both verified from the provider's own pages
  // 2026-11-02: t20251022_1961661 vs t20261020_1965665) — both accepted.
  const tableIdx = lines.findIndex((l) =>
    /^Output of Major Industrial Products (?:of Enterprises )?Above the Designated Size$/.test(l),
  );
  if (tableIdx < 0) {
    throw new FormatChangedError('NBS industrial-production release: the products table was not found (layout changed?)');
  }
  // The row labels' CASE changed between 2025 releases — August 2025
  // reads "Crude steel (10,000 tons)" where September 2025 onward reads
  // "Crude Steel (10,000 tons)" (both verified from the provider's own
  // pages 2026-11-02) — both accepted, the unit anchor stays exact.
  const readRow = (label: RegExp): { cells: number[]; idx: number } | undefined => {
    const idx = lines.findIndex((l, k) => k > tableIdx && label.test(l));
    if (idx < 0) return undefined;
    const cells: number[] = [];
    let j = idx + 1;
    while (cells.length < 4 && j < lines.length && isNumber(lines[j]!)) {
      cells.push(Number(lines[j]!));
      j++;
    }
    return { cells, idx };
  };
  const steelRow = readRow(/^Crude [Ss]teel \(10,000 tons\)$/);
  if (steelRow === undefined || steelRow.cells.length < 2) {
    throw new FormatChangedError('NBS industrial-production release: the Crude Steel row was not found');
  }
  const value = steelRow.cells[0]!;
  if (!Number.isFinite(value) || value <= 0 || value > 20000) {
    throw new FormatChangedError(`NBS industrial-production release: out-of-range crude-steel output ${value} for ${date}`);
  }
  // the rolled-steel prose cross-check (applied when the sentence is
  // present, like the CPI headline check; a DISAGREEMENT always throws).
  // The 2025 releases spell "up by 5.1 percent" where the 2026 ones write
  // "down by 3.8%" — both forms accepted (verified live 2026-11-02).
  const headlineIdx = lines.findIndex(
    (l) => /output of rolled steel was \d[\d,.]* million tons, (down|up) by \d+(\.\d+)?( percent|%)/.test(l),
  );
  if (headlineIdx >= 0) {
    const m = /output of rolled steel was (\d[\d,.]*) million tons, (down|up) by (\d+(?:\.\d+)?)(?: percent|%)/.exec(
      lines[headlineIdx]!,
    );
    const rolledRow = m !== null ? readRow(/^Rolled [Ss]teel \(10,000 tons\)$/) : undefined;
    if (m !== null && rolledRow !== undefined && rolledRow.cells.length >= 2) {
      const proseLevel = Number(m[1]!.replace(/,/g, '')) * 100; // million tons → 10,000 tons (× 100)
      const proseYoy = m[2] === 'down' ? -Number(m[3]!) : Number(m[3]!);
      if (Math.abs(proseLevel - rolledRow.cells[0]!) > 1 || Math.abs(proseYoy - rolledRow.cells[1]!) > 0.05) {
        throw new FormatChangedError(
          `NBS industrial-production release: the rolled-steel cross-check failed for ${date} — the prose says ${m[1]} million tons / ${proseYoy}%, the table says ${rolledRow.cells[0]} / ${rolledRow.cells[1]} (a column shift?)`,
        );
      }
    }
  }
  return [{ date, value }];
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

/** Fetch + parse a real-estate-investment release page (S6-M6.2: the
 *  year-to-date Y/Y observation). */
export async function fetchNbsRealEstateRelease(url: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(url, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  return parseNbsRealEstateRelease(await res.text());
}

/** Fetch + parse an industrial-production release page (S6-M6.2: the
 *  month's crude-steel output observation). */
export async function fetchNbsIndustrialProductionRelease(url: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(url, {}, { timeoutMs: deps.timeoutMs ?? 45_000, ...deps });
  return parseNbsIndustrialProductionRelease(await res.text());
}
