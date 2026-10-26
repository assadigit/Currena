/**
 * MOF Japan adapter — the Japan Ministry of Finance's own daily JGB yield
 * CSVs (the 2026-10-26 gap-audit build, A-2: the jgb-10y card's daily
 * upgrade; the OECD/IRLTLT01JPM156N monthly mirror becomes the labelled
 * fallback per the spec).
 *
 * Two files, both keyless and verified live (2026-10-26, honest UA):
 *  - jgbcme.csv — the CURRENT month only (published next business day;
 *    redirects from the spec's /english/jgbs/... path to
 *    /english/policy/jgbs/..., so the FINAL url is used directly).
 *  - historical/jgbcme_all.csv — the full daily history through the last
 *    complete month (~1.2 MB, 15 maturity columns; trimmed to the
 *    percentile window at parse time to respect the Worker CPU budget).
 *
 * Format (verified against both live files): an English header row
 * "Date,1Y,2Y,…,10Y,…,40Y" — the parser ASSERTS the header tokens and
 * locates the 10Y column BY NAME, never by index (the spec's explicit
 * requirement; a maturity reshuffle must fail loudly, not mis-read).
 * Rows are "YYYY/M/D,v1,…,v15" ascending; the 10Y value is a percent.
 *
 * Licence: MOF notice page (read 2026-10-26, in Japanese): content
 * copyright belongs to the Ministry of Finance and, absent a rights
 * notice, 「公共データ利用規約（第1.0版）」(PDL1.0 — Japan's Public Data
 * Use License, the Digital Agency's CC-BY-style open licence) applies.
 * Attribution class: "Source: Ministry of Finance, Japan".
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { addDays, assertAscending, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/** The current-month daily file (verified final URL after the 2026-10-26 redirect probe). */
export const MOF_JGBCME_URL = 'https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv';
/** The full-history file (through the last complete month). */
export const MOF_JGBCME_ALL_URL =
  'https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/historical/jgbcme_all.csv';

/** The 1.2 MB all-file parses on the rung — an RBA-table-style window. */
export const MOF_TIMEOUT_MS = 45_000;

/**
 * The sanity band for a 10-year government yield (percent). The FLOOR is
 * negative: the JGB 10Y spent 2016–2023 below zero (the recorded capture
 * carries −0.021 @ 2016-09-14; the observed trough is around −0.30) — a
 * band starting at zero would fail the whole negative-rate era. −1.0
 * admits the era with margin while still catching corrupt parses.
 */
const JGB_10Y_MIN = -1;
const JGB_10Y_MAX = 15;

/** The parse window for the all-file: 10-year percentile base + margin. */
const MOF_ALL_WINDOW_DAYS = 3_700;

/** The header the files must carry (asserted verbatim, order included). */
const EXPECTED_HEADER = ['Date', '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '15Y', '20Y', '25Y', '30Y', '40Y'];

/** ISO date from the files' own "YYYY/M/D" cells (zero-padding varies by era). */
function isoOfMofDate(cell: string): string | undefined {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(cell.trim());
  if (!m) return undefined;
  const [, y, mo, d] = m;
  return `${y}-${mo!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
}

/**
 * Parse one MOF CSV body into the 10Y series (pure — fixture-testable).
 * `from` trims the parse window (the all-file's decade trim); the header
 * row is asserted so a maturity reshuffle fails loudly.
 */
export function parseMofJgbCsv(text: string, opts: { from?: string } = {}): SeriesPoint[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 3) {
    throw new FormatChangedError(`MOF jgbcme: only ${lines.length} non-empty lines (layout change?)`);
  }
  // Row 1 is the banner ("Interest Rate (October 2026),,,,(Unit : %)") —
  // row 2 carries the maturity header. Assert it verbatim.
  const header = lines[1]!.split(',').map((t) => t.trim());
  if (header.length !== EXPECTED_HEADER.length || header.some((h, i) => h !== EXPECTED_HEADER[i])) {
    throw new FormatChangedError(
      `MOF jgbcme: header row is ${JSON.stringify(header.slice(0, 6))}… (expected ${JSON.stringify(EXPECTED_HEADER.slice(0, 6))}… — maturity layout change?)`,
    );
  }
  // The 10Y column BY NAME (the spec: assert the header, never trust indices).
  const col10y = header.indexOf('10Y');
  if (col10y < 1) throw new FormatChangedError('MOF jgbcme: no 10Y column in the header (layout change?)');
  const from = opts.from;
  const out: SeriesPoint[] = [];
  for (let i = 2; i < lines.length; i += 1) {
    const cells = lines[i]!.split(',');
    if (cells.length < EXPECTED_HEADER.length) {
      throw new FormatChangedError(`MOF jgbcme: row ${i + 1} carries ${cells.length} cells (expected ${EXPECTED_HEADER.length})`);
    }
    const dateCell = cells[0]!.trim();
    // The files' own trailing convention (verified in both live captures):
    // a padding row of empty cells, then a QUOTED footer note ("  ※If you
    // cannot download the latest csv data…", Shift-JIS-encoded — the UTF-8
    // text decode renders its mark as replacement characters). Empty and
    // quoted-text rows are skipped; any OTHER non-date row is a layout
    // change and fails loudly.
    if (dateCell === '' || dateCell.startsWith('"')) continue;
    const date = isoOfMofDate(dateCell);
    if (date === undefined) {
      throw new FormatChangedError(`MOF jgbcme: row ${i + 1} date cell ${JSON.stringify(cells[0])} is not YYYY/M/D`);
    }
    if (from !== undefined && date < from) continue; // the all-file's window trim
    const value = Number(cells[col10y]!.trim());
    if (!Number.isFinite(value) || value <= JGB_10Y_MIN || value > JGB_10Y_MAX) {
      throw new FormatChangedError(
        `MOF jgbcme: 10Y value ${JSON.stringify(cells[col10y])} at ${date} is outside ${JGB_10Y_MIN} to ${JGB_10Y_MAX} (wrong file or layout change?)`,
      );
    }
    out.push({ date, value });
  }
  if (out.length < 2) {
    throw new FormatChangedError(`MOF jgbcme: only ${out.length} parsed rows in the window (empty month or layout change?)`);
  }
  try {
    assertAscending(out);
  } catch (err) {
    throw new FormatChangedError(`MOF jgbcme: rows are not date-ascending (${err instanceof Error ? err.message : err})`);
  }
  return out;
}

/** Union-merge two MOF windows by date (the later list wins on collision). */
export function mergeMofSeries(a: SeriesPoint[], b: SeriesPoint[]): SeriesPoint[] {
  const byDate = new Map<string, SeriesPoint>();
  for (const p of a) byDate.set(p.date, p);
  for (const p of b) byDate.set(p.date, p);
  return [...byDate.values()].sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

export interface MofFetchOptions {
  deps?: FetchDeps;
  /** Include the full-history file (first-of-month rungs + bootstrap; the current-month file alone carries the month). */
  includeHistory?: boolean;
  /** The all-file's parse-window floor (ISO date; default: the 10y window + margin around today). */
  from?: string;
  /** Clock injection (tests). */
  now?: Date;
}

/**
 * Fetch the MOF 10Y series: the current-month file always, the historical
 * all-file when asked (monthly refresh + first-run bootstrap). Both files
 * parse through the same loud assertions.
 */
export async function fetchMofJgb10y(opts: MofFetchOptions = {}): Promise<SeriesPoint[]> {
  const now = opts.now ?? new Date();
  const from =
    opts.from ?? new Date(now.getTime() - MOF_ALL_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const deps = { ...opts.deps, timeoutMs: opts.deps?.timeoutMs ?? MOF_TIMEOUT_MS };

  const currentRes = await insightsFetch(MOF_JGBCME_URL, {}, deps);
  const current = parseMofJgbCsv(await currentRes.text());

  if (opts.includeHistory !== true) return current;

  const allRes = await insightsFetch(MOF_JGBCME_ALL_URL, {}, deps);
  const history = parseMofJgbCsv(await allRes.text(), { from });
  // The all-file must reach back meaningfully (the percentile base).
  if (history.length < 100) {
    throw new FormatChangedError(`MOF jgbcme_all: only ${history.length} rows in the ${from} window (expected the decade)`);
  }
  return mergeMofSeries(history, current);
}

/** Convenience for callers that only need the latest observation (report rows). */
export function mofWindowStart(now: Date = new Date()): string {
  return addDays(now.toISOString().slice(0, 10), -MOF_ALL_WINDOW_DAYS);
}
