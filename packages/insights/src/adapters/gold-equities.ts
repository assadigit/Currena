/**
 * gold-equities.ts — GF-S11 (P4, 2026-11-07 — audit report §4 rank 41 /
 * X5): the GOLD-VS-EQUITIES rotation gauge — the GLD/SPY ratio (the gold
 * ETF priced in S&P 500 units), the classic relative-valuation read
 * between the two reserve assets.
 *
 * VENUE: Yahoo Finance's chart API (query1.finance.yahoo.com — the same
 * L2 owner-accepted provider as the Brent gap-fill, the metals
 * histories, usdaed and the S&P 500 breadth ratio; both symbols verified
 * live 2026-11-07 from this session's own probe: GLD + SPY 1-month daily
 * closes served). The Yahoo L2 class is owner-accepted for FETCH
 * (2026-10-17) but carries NO public-display directive for these tiles —
 * the card serves PRIVATE until the owner records one (the honest
 * default the register carries).
 *
 * The derivation: the sp500-breadth-ratio pattern — sequential chart
 * calls (rapid back-to-back calls beyond a handful trip Yahoo's
 * politeness), the same-date inner join, 4dp.
 */

import type { SeriesPoint } from '../series';
import { combineSeries } from '../series';
import { fetchYahooQuote } from './yahoo';

/** The gold ETF (SPDR Gold Shares). */
export const GOLD_EQUITIES_GLD_SYMBOL = 'GLD';
/** The S&P 500 ETF (SPDR S&P 500 ETF Trust). */
export const GOLD_EQUITIES_SPY_SYMBOL = 'SPY';
/** Both legs need the full 10-year window (the percentile basis). */
export const GOLD_EQUITIES_RANGE = '10y';

/** The ratio series on common dates, 4dp. Fails closed if either leg is missing. */
export function deriveGoldEquitiesRatio(gld: SeriesPoint[], spy: SeriesPoint[]): SeriesPoint[] {
  if (gld.length === 0 || spy.length === 0) {
    throw new Error('gold/equities ratio needs both legs non-empty');
  }
  const f = 10 ** 4;
  return combineSeries(gld, spy, (g, s) => Math.round((g / s) * f) / f);
}

export interface GoldEquitiesFetchOptions {
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout per leg; default 15 s (the Yahoo adapter's own). */
  timeoutMs?: number;
}

/**
 * Fetch both legs and derive the ratio. Sequential (the live-prices
 * refresh's own two-call shape — the breadth discipline).
 */
export async function fetchGoldEquitiesRatio(
  opts: GoldEquitiesFetchOptions = {},
): Promise<{ gld: SeriesPoint[]; spy: SeriesPoint[]; ratio: SeriesPoint[] }> {
  const gld = await fetchYahooQuote(GOLD_EQUITIES_GLD_SYMBOL, GOLD_EQUITIES_RANGE, {
    fetchImpl: opts.fetchImpl,
    baseUrl: opts.baseUrl,
    timeoutMs: opts.timeoutMs,
  });
  const spy = await fetchYahooQuote(GOLD_EQUITIES_SPY_SYMBOL, GOLD_EQUITIES_RANGE, {
    fetchImpl: opts.fetchImpl,
    baseUrl: opts.baseUrl,
    timeoutMs: opts.timeoutMs,
  });
  const ratio = deriveGoldEquitiesRatio(gld.points, spy.points);
  return { gld: gld.points, spy: spy.points, ratio };
}
