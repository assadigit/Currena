/**
 * Currena world-markets library — the 16 indices, the regions, the labels,
 * the cap table and the pure derivations (breadth, movers, drawdown kind).
 *
 * Everything here is pure: data in, data out. No fetch, no clock, no React —
 * imported by both the API route (server) and the page components (client),
 * so the treemap, the grid tiles and the summary can never disagree on what
 * "the selected period" means or which bucket a market sits in.
 */

import type { EnrichedIndex, PeriodDef } from '@/components/markets/types';

/* ------------------------------------------------------------------ *
 * The 16 world indices (spec §3) — symbol, name, country, region.
 * Region groups follow TE's treemap grouping: AMERICAS · ASIA-PACIFIC ·
 * EUROPE. The shortName avoids label overflow on narrow tiles (spec §3).
 * ------------------------------------------------------------------ */

export type RegionId = 'americas' | 'asia' | 'europe';

export interface IndexMeta {
  symbol: string;
  name: string;
  /** Short label for narrow treemap tiles (spec §3). */
  shortName: string;
  country: string;
  /** Short country form for narrow treemap tiles. */
  shortCountry: string;
  region: RegionId;
}

export const INDICES: readonly IndexMeta[] = [
  // Americas (5)
  { symbol: 'sp500', name: 'S&P 500', shortName: 'S&P 500', country: 'United States', shortCountry: 'USA', region: 'americas' },
  { symbol: 'ndx', name: 'Nasdaq 100', shortName: 'Nasdaq 100', country: 'United States', shortCountry: 'USA', region: 'americas' },
  { symbol: 'dow', name: 'Dow Jones', shortName: 'Dow Jones', country: 'United States', shortCountry: 'USA', region: 'americas' },
  { symbol: 'tsx', name: 'S&P/TSX Composite', shortName: 'S&P/TSX', country: 'Canada', shortCountry: 'Canada', region: 'americas' },
  { symbol: 'ibov', name: 'Ibovespa', shortName: 'Ibovespa', country: 'Brazil', shortCountry: 'Brazil', region: 'americas' },
  // Asia-Pacific (7)
  { symbol: 'ssec', name: 'Shanghai Composite', shortName: 'Shanghai', country: 'China', shortCountry: 'China', region: 'asia' },
  { symbol: 'n225', name: 'Nikkei 225', shortName: 'Nikkei 225', country: 'Japan', shortCountry: 'Japan', region: 'asia' },
  { symbol: 'hsi', name: 'Hang Seng', shortName: 'Hang Seng', country: 'Hong Kong', shortCountry: 'Hong Kong', region: 'asia' },
  { symbol: 'nifty50', name: 'Nifty 50', shortName: 'Nifty 50', country: 'India', shortCountry: 'India', region: 'asia' },
  { symbol: 'taiex', name: 'TAIEX', shortName: 'TAIEX', country: 'Taiwan', shortCountry: 'Taiwan', region: 'asia' },
  { symbol: 'kospi', name: 'KOSPI', shortName: 'KOSPI', country: 'South Korea', shortCountry: 'S. Korea', region: 'asia' },
  { symbol: 'asx200', name: 'ASX 200', shortName: 'ASX 200', country: 'Australia', shortCountry: 'Australia', region: 'asia' },
  // Europe (4)
  { symbol: 'stoxx50', name: 'Euro Stoxx 50', shortName: 'Stoxx 50', country: 'Eurozone', shortCountry: 'Eurozone', region: 'europe' },
  { symbol: 'ftse', name: 'FTSE 100', shortName: 'FTSE 100', country: 'United Kingdom', shortCountry: 'UK', region: 'europe' },
  { symbol: 'cac', name: 'CAC 40', shortName: 'CAC 40', country: 'France', shortCountry: 'France', region: 'europe' },
  { symbol: 'dax', name: 'DAX', shortName: 'DAX', country: 'Germany', shortCountry: 'Germany', region: 'europe' },
];

/** Region display order (TE treemap order, biggest cap first). The treemap
 *  itself sorts regions by summed cap desc (deterministic from the cap
 *  table); this constant drives the region GRID sections below the treemap
 *  so they read in the same order the reader just scanned. */
export const REGIONS: readonly { id: RegionId; label: string; shortLabel: string }[] = [
  { id: 'americas', label: 'Americas', shortLabel: 'AMERICAS' },
  { id: 'asia', label: 'Asia-Pacific', shortLabel: 'ASIA-PACIFIC' },
  { id: 'europe', label: 'Europe', shortLabel: 'EUROPE' },
];

/** Region label for the treemap header band (uppercase, TE-style). */
export function regionLabel(r: RegionId): string {
  return REGIONS.find((x) => x.id === r)?.shortLabel ?? r.toUpperCase();
}

/* ------------------------------------------------------------------ *
 * The market-cap table (spec §3) — approx constituent market cap, USD
 * TRILLIONS. ILLUSTRATIVE DEMO DATA: the stored contract carries no cap
 * field, so the card's footer says so plainly. Update from EODHD
 * fundamentals or WFE stats when live caps join the contract.
 * ------------------------------------------------------------------ */

export const MARKET_CAP_T: Record<string, number> = {
  sp500: 55,
  ndx: 44,
  dow: 19,
  tsx: 3.2,
  ibov: 1.1,
  ssec: 9.5,
  n225: 6.8,
  hsi: 4.6,
  nifty50: 5.4,
  taiex: 3.0,
  kospi: 2.4,
  asx200: 1.8,
  stoxx50: 4.4,
  ftse: 3.3,
  cac: 3.1,
  dax: 2.7,
};

/** Fallback cap for an unknown symbol (never used by the closed 16-id set). */
export const CAP_FALLBACK_T = 1;

/* ------------------------------------------------------------------ *
 * The period lenses (spec §5) — Today · Week · Month · Quarter · Year.
 * ------------------------------------------------------------------ */

export interface PeriodDefOption {
  key: PeriodDef;
  /** Short label for the segmented control. */
  label: string;
  /** The period word used in aria sentences, tooltips and the footer. */
  word: string;
  /** |change|% where the colour saturates for this period (spec §5). */
  clamp: number;
}

export const PERIODS: readonly PeriodDefOption[] = [
  { key: 'today', label: 'Today', word: 'today', clamp: 3 },
  { key: 'week', label: 'Week', word: 'this week', clamp: 5 },
  { key: 'month', label: 'Month', word: 'this month', clamp: 8 },
  { key: 'quarter', label: 'Quarter', word: 'this quarter', clamp: 12 },
  { key: 'year', label: 'Year', word: 'this year', clamp: 15 },
];

/** The clamp bound for a period (spec §5: CLAMP_PCT). */
export function clampOf(period: PeriodDef): number {
  return PERIODS.find((p) => p.key === period)?.clamp ?? 3;
}

/** The period word for aria/tooltip/footer copy. */
export function periodWordOf(period: PeriodDef): string {
  return PERIODS.find((p) => p.key === period)?.word ?? 'the period';
}

/* ------------------------------------------------------------------ *
 * Drawdown kind — the 52-week-high distance ladder (spec §7, §8).
 * ------------------------------------------------------------------ */

export type DrawdownKind = 'nearHigh' | 'pullback' | 'correction' | 'bear';

export const DRAWDOWN_KIND_LABEL: Record<DrawdownKind, string> = {
  nearHigh: 'Near its high',
  pullback: 'Pullback',
  correction: 'Correction',
  bear: 'Bear market',
};

/** The drawdown kind from a raw from-high percent (spec §7 ladder:
 *  > −5 near high · −5 to −10 pullback · −10 to −20 correction · ≤ −20 bear). */
export function drawdownKindOf(fromHigh: number): DrawdownKind {
  if (fromHigh > -5) return 'nearHigh';
  if (fromHigh > -10) return 'pullback';
  if (fromHigh > -20) return 'correction';
  return 'bear';
}

/* ------------------------------------------------------------------ *
 * Breadth — the up/down/flat split for the selected period (spec §10).
 * ------------------------------------------------------------------ */

export type BreadthKind = 'up' | 'down' | 'flat';

export const BREADTH_KIND_LABEL: Record<BreadthKind, string> = {
  up: 'Up',
  down: 'Down',
  flat: 'Flat',
};

/** The flat band: |change| < 1% is flat (audit F2/F3 — one threshold). */
export const FLAT_BAND_PCT = 1;

export function bandedArrow(pct: number | null): BreadthKind {
  if (pct === null) return 'flat';
  if (pct > FLAT_BAND_PCT) return 'up';
  if (pct < -FLAT_BAND_PCT) return 'down';
  return 'flat';
}

export interface MarketBreadth {
  up: number;
  down: number;
  flat: number;
  /** Rows with a valid reading for the lens (honest denominator). */
  valid: number;
  total: number;
}

export function marketBreadth(items: readonly EnrichedIndex[], period: PeriodDef): MarketBreadth {
  let up = 0;
  let down = 0;
  let flat = 0;
  let valid = 0;
  for (const m of items) {
    const pct = periodValueOf(m, period);
    if (pct === null) continue;
    valid += 1;
    const arrow = bandedArrow(pct);
    if (arrow === 'up') up += 1;
    else if (arrow === 'down') down += 1;
    else flat += 1;
  }
  return { up, down, flat, valid, total: items.length };
}

export interface MarketMovers {
  gainer: EnrichedIndex | null;
  decliner: EnrichedIndex | null;
  valid: number;
}

/** The selected period's true extrema (spec §10 summary). Missing readings
 *  are excluded — never ranked as zero. Ties keep the earlier row. */
export function topMovers(items: readonly EnrichedIndex[], period: PeriodDef): MarketMovers {
  let gainer: EnrichedIndex | null = null;
  let gainerPct = -Infinity;
  let decliner: EnrichedIndex | null = null;
  let declinerPct = Infinity;
  let valid = 0;
  for (const m of items) {
    const pct = periodValueOf(m, period);
    if (pct === null) continue;
    valid += 1;
    if (pct > gainerPct) {
      gainerPct = pct;
      gainer = m;
    }
    if (pct < declinerPct) {
      declinerPct = pct;
      decliner = m;
    }
  }
  return { gainer, decliner, valid };
}

/* ------------------------------------------------------------------ *
 * The period-value read (spec §3: changes[period] drives colour).
 * ------------------------------------------------------------------ */

/** The raw selected-period return of one index, or null when the row does
 *  not carry that lens (an absent reading is absent — never a zero). */
export function periodValueOf(m: EnrichedIndex, period: PeriodDef): number | null {
  const v = m.changes[period];
  return v === undefined ? null : v;
}

/** How many indices sit at least 10% below their 52-week high. */
export function belowHighCount(items: readonly EnrichedIndex[]): number {
  return items.filter((m) => m.fromHigh <= -10).length;
}
