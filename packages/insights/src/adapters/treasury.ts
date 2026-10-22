/**
 * Treasury.gov adapter — the 2026-10-22 reliability round's FRED fallback
 * for the daily US yield family. FRED's fredgraph.csv edge intermittently
 * serves malformed bodies from the Cloudflare egress (venue-verified
 * 2026-10-22: all five bulk groups failed an 'unexpected header' parse
 * while FRED itself was healthy from other venues) — when that happens,
 * the US Treasury's OWN daily yield-curve CSV answers with the same par
 * yields FRED republishes (DGS2/DGS10/DGS30 = Treasury "2 Yr"/"10 Yr"/
 * "30 Yr"; DFII10 ≈ the daily REAL curve's "10 YR"), one day FRESHER in
 * practice (venue-probe 2026-10-22: Treasury carried 10/21 while FRED's
 * DGS10 ended 10/20).
 *
 * FALLBACK-ONLY (owner round terms): FRED stays the PRIMARY; these fetches
 * run only when a FRED bulk group failed — collect.ts wires the trigger.
 *
 * Licence: works of the US federal government — public domain
 * (17 U.S.C. § 105); attribution "U.S. Department of the Treasury".
 *
 * Venue facts (2026-10-22 probe): the endpoint answers in 18–21 s from
 * Cloudflare egress (well over the fetch-policy default timeout) — a 45 s
 * timeout like the RBA tables. Only the CURRENT year's CSV is fetched per
 * curve type (a ~16 KB document); the decade percentile window survives
 * via the caller's merge with the stored KV history (collect.ts).
 * An /all-years variant does not exist (403/404 — probed).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const TREASURY_BASE =
  'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv';

/** Nominal daily par yield curve (…/2026/all?type=daily_treasury_yield_curve). */
export const TREASURY_CURVE_NOMINAL = 'daily_treasury_yield_curve';
/** Real daily yield curve (…/2026/all?type=daily_treasury_real_yield_curve). */
export const TREASURY_CURVE_REAL = 'daily_treasury_real_yield_curve';

/** Treasury answers take ~20 s from the Worker venue — the RBA-style window. */
export const TREASURY_TIMEOUT_MS = 45_000;

/** The tenor columns this adapter reads (case-insensitive identity by NAME). */
const NOMINAL_COLUMNS = { dgs2: '2 Yr', dgs10: '10 Yr', dgs30: '30 Yr' } as const;
const REAL_COLUMNS = { dfii10: '10 YR' } as const;

/** URL of one curve type's current-year CSV (descending rows, MM/DD/YYYY). */
export function treasuryCurveUrl(curve: string, year: number): string {
  return `${TREASURY_BASE}/${year}/all?type=${curve}&field_tdr_date_value=${year}&_format=csv`;
}

/** "10/21/2026" → "2026-10-21"; anything else throws (loud, never garbage). */
export function parseTreasuryDate(raw: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (m === null) throw new FormatChangedError(`Treasury CSV: unexpected date format ${JSON.stringify(raw)}`);
  return `${m[3]}-${m[1]}-${m[2]}`;
}

/** Find a tenor column's index by name (case-insensitive, quote-stripped). */
function columnIndex(header: string[], name: string): number {
  const wanted = name.toLowerCase();
  for (let i = 0; i < header.length; i += 1) {
    if (header[i]!.trim().replace(/^"|"$/g, '').toLowerCase() === wanted) return i;
  }
  return -1;
}

/** Parse one Treasury curve CSV into the named tenors (pure — fixture-testable). */
export function parseTreasuryCurveCsv(
  text: string,
  columns: Readonly<Record<string, string>>,
): Record<string, SeriesPoint[]> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new FormatChangedError('Treasury CSV: fewer than 2 non-empty lines');
  const header = lines[0]!.split(',');
  if (header[0]!.trim() !== 'Date') {
    throw new FormatChangedError(`Treasury CSV: unexpected header (expected "Date,…" — got ${JSON.stringify(lines[0]!.slice(0, 60))})`);
  }
  const idx: Record<string, number> = {};
  for (const [key, name] of Object.entries(columns)) {
    const at = columnIndex(header, name);
    if (at === -1) throw new FormatChangedError(`Treasury CSV: no "${name}" column (layout change?)`);
    idx[key] = at;
  }
  const out: Record<string, SeriesPoint[]> = {};
  for (const key of Object.keys(columns)) out[key] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i]!.split(',');
    const date = parseTreasuryDate(cells[0] ?? '');
    for (const [key, at] of Object.entries(idx)) {
      const raw = (cells[at] ?? '').trim();
      if (raw === '') continue; // a tenor not quoted that day
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= 0) {
        throw new FormatChangedError(`Treasury CSV: non-numeric ${key} value ${JSON.stringify(raw)} on ${date}`);
      }
      out[key]!.push({ date, value });
    }
  }
  for (const key of Object.keys(columns)) {
    if (out[key]!.length === 0) throw new FormatChangedError(`Treasury CSV: column "${columns[key]}" carried no points`);
  }
  // Rows arrive newest-first; series must leave ascending.
  for (const key of Object.keys(columns)) out[key]!.reverse();
  return out;
}

export interface TreasuryCurves {
  /** Nominal 2-year par yield (FRED DGS2's own source). */
  dgs2: SeriesPoint[];
  /** Nominal 10-year par yield (FRED DGS10's own source). */
  dgs10: SeriesPoint[];
  /** Nominal 30-year par yield (FRED DGS30's own source). */
  dgs30: SeriesPoint[];
  /** Real 10-year yield (≈ FRED DFII10); present only when `real` requested. */
  real10y?: SeriesPoint[];
}

export interface TreasuryFetchOptions extends FetchDeps {
  /** Fetch the real curve too (only needed when the DFII10 group failed). */
  real?: boolean;
  /** Clock for the current-year URL (tests). */
  now?: Date;
}

/**
 * Fetch the Treasury's current-year daily curves. Two subrequests (nominal +
 * real) — deliberately the ONLY requests: the fallback must stay cheap, and
 * the decade window rides the caller's stored-history merge.
 */
export async function fetchTreasuryCurves(opts: TreasuryFetchOptions = {}): Promise<TreasuryCurves> {
  const { real, now, ...deps } = opts;
  const year = (now ?? new Date()).getUTCFullYear();
  const nominalRes = await insightsFetch(treasuryCurveUrl(TREASURY_CURVE_NOMINAL, year), {}, { ...deps, timeoutMs: deps.timeoutMs ?? TREASURY_TIMEOUT_MS });
  const nominal = parseTreasuryCurveCsv(await nominalRes.text(), NOMINAL_COLUMNS);
  const out: TreasuryCurves = {
    dgs2: nominal.dgs2!,
    dgs10: nominal.dgs10!,
    dgs30: nominal.dgs30!,
  };
  if (real === true) {
    const realRes = await insightsFetch(treasuryCurveUrl(TREASURY_CURVE_REAL, year), {}, { ...deps, timeoutMs: deps.timeoutMs ?? TREASURY_TIMEOUT_MS });
    const parsed = parseTreasuryCurveCsv(await realRes.text(), REAL_COLUMNS);
    out.real10y = parsed.dfii10!;
  }
  return out;
}

/**
 * T10Y2Y from Treasury legs: FRED's T10Y2Y is exactly DGS10 − DGS2, so the
 * fallback recomputes it at FRED's 2-decimal presentation. Points exist only
 * where BOTH legs are quoted that day.
 */
export function treasuryT10y2y(curves: TreasuryCurves): SeriesPoint[] {
  const tenByDate = new Map(curves.dgs10.map((p) => [p.date, p.value]));
  const out: SeriesPoint[] = [];
  for (const p of curves.dgs2) {
    const ten = tenByDate.get(p.date);
    if (ten === undefined) continue;
    out.push({ date: p.date, value: Math.round((ten - p.value) * 100) / 100 });
  }
  return out;
}
