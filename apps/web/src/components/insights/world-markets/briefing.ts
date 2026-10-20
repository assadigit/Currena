/**
 * world-markets/briefing — the pure decision layer of the editorial
 * market-briefing redesign (the 2026-10-18 world-indices handoff round,
 * 02-ui-spec §3.2–§3.6, §8). Everything here is pure: rows in, numbers
 * out — the summary card, the movers and the heatmap all read the SAME
 * helpers so they can never drift apart on what "the selected period"
 * means.
 *
 * DATA TRUTH (handoff §"Data truth and scope boundaries", as amended by
 * round 47): the stored contract (MarketEntrySchema) carries FIVE return
 * horizons — chg1d, chg1w (optional), chg1m (optional), chg3m and chg1y
 * (optional, round 47). There is still NO YTD and no year-start date, and
 * the weekly series is chart-rounded, so no other horizon may ever be
 * derived in the frontend. PERIOD_VIEWS is therefore closed at five.
 *  - The 52-week-high distance (fromHigh) is a separate context metric,
 *    never a sixth period (02-ui-spec §3.3).
 *  - Every count and ranking reads RAW stored values, never rounded
 *    display strings: a −9.96% distance displays as −10% but is NOT
 *    "at least 10% below" (§3.2's rounding-boundary rule).
 */

import type { MarketEntry } from '@currena/core';
import { CORRECTION_PCT } from '@currena/insights/markets/definitions';
import { bandedArrow, viewValue, type MarketsView } from './shared';

/* ------------------------------------------------------------------ *
 * The period lenses
 * ------------------------------------------------------------------ */

/**
 * The section's return-period lenses (02-ui-spec §3.3 as amended by round
 * 47). 2026-10-21 owner round ("unify the map time views with the other
 * parts of the website"): the list closes at the MAP's four — today,
 * 1w, 1m, 1y — matching world-map-config's MAP_PERIODS exactly, because
 * the map's segmented control is now the section's ONE period switch
 * (the old five-option Daily|Weekly|Monthly|Quarterly|Yearly radiogroup
 * is retired). '3m' stays a valid MarketsView VALUE (the stored contract
 * carries chg3m; trendOf and the table's Trend column keep reading it)
 * but is no longer offered as a lens. Adding a horizon here without the
 * matching stored field would still fabricate data — the yearly lens
 * exists because round 47 added chg1y to the stored contract.
 */
export const PERIOD_VIEWS: readonly MarketsView[] = ['today', '1w', '1m', '1y'];

/** The raw selected-period return of one row, or null when the row does
 * not carry that lens yet (a pre-round-46 stored row without chg1w/chg1m)
 * — an absent reading is absent, never a zero, never a guess. */
export function periodValueOf(m: MarketEntry, view: MarketsView): number | null {
  return viewValue(m, view).pct;
}

/* ------------------------------------------------------------------ *
 * Market breadth (02-ui-spec §3.2)
 * ------------------------------------------------------------------ */

export interface MarketBreadth {
  /** Indices meaningfully up over the selected period. */
  up: number;
  /** Indices meaningfully down over the selected period. */
  down: number;
  /** Indices without a meaningful move over the selected period. */
  flat: number;
  /** Rows with a valid reading for the lens — the honest denominator
   * (§8: the UI never implies all 16 values exist when they do not). */
  valid: number;
  /** Every row in the snapshot, missing readings included. */
  total: number;
}

/**
 * The up/down/flat counts over the selected period, from raw values.
 * "Meaningful" reuses the section's ONE existing flat definition —
 * MARKETS_FLAT_BAND_PCT (|change| < 1% is flat, step-1 audit F2/F3) — so
 * the summary's words can never disagree with the arrows the rows show.
 * Rows without a reading for the lens join no bucket and lower the
 * denominator instead.
 */
export function marketBreadth(markets: readonly MarketEntry[], view: MarketsView): MarketBreadth {
  let up = 0;
  let down = 0;
  let flat = 0;
  let valid = 0;
  for (const m of markets) {
    const pct = periodValueOf(m, view);
    if (pct === null) continue;
    valid += 1;
    const arrow = bandedArrow(pct);
    if (arrow === 'up') up += 1;
    else if (arrow === 'down') down += 1;
    else flat += 1;
  }
  return { up, down, flat, valid, total: markets.length };
}

/**
 * How many indices sit at least 10% below their 52-week high. The RAW
 * fromHigh decides (never the rounded display), and the threshold is
 * CORRECTION_PCT from the markets config block — the same constant the
 * stored status rules read, so the frontend never owns a competing
 * definition (02-ui-spec §3.2). Note this counts the raw distance, not
 * the stored status flags: the status band keeps a 2-point exit buffer,
 * which is a rule about *staying* in a state, not about *being* 10% down.
 */
export function belowHighCount(markets: readonly MarketEntry[]): number {
  return markets.filter((m) => m.fromHigh <= CORRECTION_PCT).length;
}

/* ------------------------------------------------------------------ *
 * Market movers (02-ui-spec §3.4)
 * ------------------------------------------------------------------ */

export interface MarketMovers {
  /** The largest raw return of the selected period, or null when no row
   * carries the lens — never a fake winner. */
  gainer: MarketEntry | null;
  /** The smallest raw return of the selected period, or null likewise. */
  decliner: MarketEntry | null;
  /** Rows with a valid reading for the lens. */
  valid: number;
}

/**
 * The selected period's true extrema (acceptance: "top movers are true
 * extrema of the selected-period data"). Missing readings are excluded —
 * never ranked as zero (§3.4) — and ties keep the earlier row (the
 * trading-day order), which is also how the table's stable sort behaves.
 */
export function topMovers(markets: readonly MarketEntry[], view: MarketsView): MarketMovers {
  let gainer: MarketEntry | null = null;
  let gainerPct = -Infinity;
  let decliner: MarketEntry | null = null;
  let declinerPct = Infinity;
  let valid = 0;
  for (const m of markets) {
    const pct = periodValueOf(m, view);
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
 * The heatmap's colour scale (02-ui-spec §3.6)
 * ------------------------------------------------------------------ */

/**
 * The heatmap's symmetric scale for the selected period: the largest
 * |raw return| among valid rows, rounded UP to a "nice" step so the
 * legend's endpoints read cleanly. The scale is dynamic per period (a
 * daily ±2% and a quarterly ±20% must not share one axis) and the legend
 * says so — intensity is relative to the selected period, never a
 * market-cap or importance weight. Tile AREA stays equal regardless.
 */
export function heatmapScale(markets: readonly MarketEntry[], view: MarketsView): number {
  let max = 0;
  for (const m of markets) {
    const pct = periodValueOf(m, view);
    if (pct !== null) max = Math.max(max, Math.abs(pct));
  }
  if (max <= 0) return 1; // all flat / no data — a degenerate scale keeps every tile neutral
  const steps = [1, 2, 5, 10, 20, 50, 100];
  for (const s of steps) if (max <= s) return s;
  return Math.ceil(max / 100) * 100; // beyond ±100%: round to hundreds
}

/** One of the heatmap's six intensity buckets (three per direction) plus
 * the neutral zero bucket a missing reading keeps. */
export type HeatTone = 'zero' | 'pos1' | 'pos2' | 'pos3' | 'neg1' | 'neg2' | 'neg3';

/** The tile's intensity bucket: the raw return's share of the current
 * scale, split into thirds. Colour is never the only signal — every tile
 * also shows its name and exact signed percentage, and the list view
 * carries the same content (§3.6). */
export function heatToneOf(pct: number | null, scale: number): HeatTone {
  if (pct === null || scale <= 0 || pct === 0) return 'zero';
  const ratio = Math.min(Math.abs(pct) / scale, 1);
  const positive = pct > 0;
  if (ratio <= 1 / 3) return positive ? 'pos1' : 'neg1';
  if (ratio <= 2 / 3) return positive ? 'pos2' : 'neg2';
  return positive ? 'pos3' : 'neg3';
}
