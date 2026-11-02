/**
 * sp500-breadth.ts — the S&P 500 equal-weight/cap-weight ratio
 * (gap-closure S6-M6.3, 2026-11-02).
 *
 * The market-concentration PROXY: the ratio of the equal-weight S&P 500
 * ETF (RSP) to the cap-weight ETF (SPY). A falling ratio means the
 * largest companies are pulling away from the average member — the
 * index's return is concentrating in its biggest names. A rising ratio
 * means the average member is catching up (broader participation).
 *
 * The card is LABELLED a proxy in the layer-1 copy (the spec's own
 * limitation note): RSP/SPY measures the equal-weight index RELATIVE to
 * the cap-weight one — a stand-in for the share of the largest
 * companies, not their exact weight, and ETF tracking differences sit
 * inside the ratio's level.
 *
 * VENUE: Yahoo Finance chart API (query1.finance.yahoo.com — the same
 * L2 owner-accepted provider as the Brent gap-fill, the metals
 * histories, usdaed and the live-prices refresh; Worker egress served
 * since the S5-M5.1 board). Both symbols verified live 2026-11-02 from
 * the provider's own responses: 2,512 daily points each over EXACTLY
 * ten years (2016-11-03 → 2026-11-02), zero gaps longer than 15 days,
 * USD, live prices present (RSP 219.98 / SPY 752.10 — fixtures
 * packages/insights/fixtures/s6/yahoo-{rsp,spy}-10y-2026-11-02.json).
 *
 * The derivation: inner-join the two adjusted-close series on common
 * dates and divide (the combineSeries discipline — audnzd's pattern),
 * quantized to 4 decimal places (F4). The last bar of each leg is the
 * live session's provisional close, so today's provisional ratio rides
 * the tail exactly like every other daily Yahoo-derived series.
 */

import type { SeriesPoint } from '../series';
import { combineSeries } from '../series';
import { fetchYahooQuote } from './yahoo';

/** Equal-weight S&P 500 ETF (Invesco S&P 500 Equal Weight). */
export const BREADTH_RSP_SYMBOL = 'RSP';
/** Cap-weight S&P 500 ETF (SPDR S&P 500 ETF Trust). */
export const BREADTH_SPY_SYMBOL = 'SPY';
/** Both legs need the full 10-year window (the percentile basis). */
export const BREADTH_RANGE = '10y';

/** The ratio series on common dates, 4dp. Fails closed if either leg is missing. */
export function deriveBreadthRatio(rsp: SeriesPoint[], spy: SeriesPoint[]): SeriesPoint[] {
  if (rsp.length === 0 || spy.length === 0) {
    throw new Error('breadth ratio needs both legs non-empty');
  }
  // F4 (the derived.ts quantized discipline): kill the float tails a
  // division manufactures before they reach the frozen-value heuristics.
  const f = 10 ** 4;
  return combineSeries(rsp, spy, (r, s) => Math.round((r / s) * f) / f);
}

export interface BreadthFetchOptions {
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout per leg; default 15 s (the Yahoo adapter's own). */
  timeoutMs?: number;
}

/**
 * Fetch both legs and derive the ratio. Sequential (the live-prices
 * refresh's own two-call shape — rapid back-to-back calls beyond a
 * handful trip Yahoo's politeness, the S5-M5.1 probe lesson).
 */
export async function fetchSp500BreadthRatio(
  opts: BreadthFetchOptions = {},
): Promise<{ rsp: SeriesPoint[]; spy: SeriesPoint[]; ratio: SeriesPoint[] }> {
  const rsp = await fetchYahooQuote(BREADTH_RSP_SYMBOL, BREADTH_RANGE, {
    fetchImpl: opts.fetchImpl,
    baseUrl: opts.baseUrl,
    timeoutMs: opts.timeoutMs,
  });
  const spy = await fetchYahooQuote(BREADTH_SPY_SYMBOL, BREADTH_RANGE, {
    fetchImpl: opts.fetchImpl,
    baseUrl: opts.baseUrl,
    timeoutMs: opts.timeoutMs,
  });
  const ratio = deriveBreadthRatio(rsp.points, spy.points);
  return { rsp: rsp.points, spy: spy.points, ratio };
}
