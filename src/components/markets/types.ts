/**
 * Currena world-markets shared types.
 *
 * EnrichedIndex — the derived view one API row becomes after the page adds
 *   the period-change map and the drawdown kind. This is the shape every
 *   markets component reads (the treemap, the grid tile, the detail panel).
 * PeriodDef    — the five return lenses: Today · Week · Month · Quarter · Year.
 * MarketViewProps — the page-level props the WorldMarkets section receives.
 */

export type PeriodDef = 'today' | 'week' | 'month' | 'quarter' | 'year';

/** The per-period change map. A missing lens is `undefined` (rendered as a
 *  dash, never a zero — an absent reading is absent). */
export type ChangeMap = Partial<Record<PeriodDef, number>>;

export interface EnrichedIndex {
  /** Stable id (sp500, ndx, …). */
  symbol: string;
  name: string;
  /** Short label for narrow treemap tiles. */
  shortName: string;
  country: string;
  /** Short country form for narrow treemap tiles (e.g. "USA" for "United
   *  States"). The full country rides the tooltip, aria and the modal. */
  shortCountry: string;
  region: 'americas' | 'asia' | 'europe';
  /** Last close / index level. */
  level: number;
  /** 52-week closing high. */
  high52w: number;
  /** 52-week closing low. */
  low52w: number;
  /** Percent below the 52-week high (≤ 0, e.g. −7.3). */
  fromHigh: number;
  /** The five return lenses (drives colour + the summary). */
  changes: ChangeMap;
  /** Approx constituent market cap, USD trillions (illustrative demo). */
  capT: number;
}

/** The snapshot the /api/markets route returns. */
export interface MarketsSnapshot {
  asOf: string;
  /** Human-readable as-of line, e.g. "Nov 12, 2026". */
  asOfDisplay: string;
  markets: EnrichedIndex[];
}

/** The props the WorldMarkets page section receives. */
export interface MarketViewProps {
  snapshot: MarketsSnapshot | null;
  loading: boolean;
}
