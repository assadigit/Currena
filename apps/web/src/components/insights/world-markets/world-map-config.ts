/**
 * world-markets/world-map-config — the world-markets MAP's ONE config file
 * (docs/insights/world-markets-map-spec.md §4: "put these values in one
 * config file; the code reads only from it").
 *
 * The map is a PRESENTATION layer over the section's existing data
 * (spec §1): the same 16-market registry, the same stored snapshot, zero
 * new KV operations. This file adds only the presentation constants:
 *
 *   §4.1  the map indices in west-to-east order (= DOM order = tab order),
 *         their ISO-numeric country, their callout band and their callout
 *         position (percent of the map box — adjusted per §M8 until the
 *         §9 layout test passes);
 *   §4.2  the five-step colour thresholds per period (display only);
 *   §4.3  the layout switch width, the default period, and the re-exports
 *         of the two constants the data layer already owns (OPEN_MAX_AGE_MIN,
 *         STALE_AFTER_DAYS≡STALE_DAYS) so there is exactly one source.
 *
 * JSE All Share (South Africa, §4.1 #5) is DEFERRED: it is not in the
 * section's 16-market registry (spec hard rule 1 asked for the same
 * provider; the owner's instruction for this round is to cover only what
 * the app already carries). The map therefore has NINE callouts and the
 * bottom band holds Nifty 50 + ASX 200 only. South Africa renders neutral
 * land, exactly like every non-registry country (§M4's honest-tint rule).
 *
 * Platform-free pure data (AGENTS.md rule 2) — imported by the component
 * tree and by the §9 verification probes.
 */

import type { MarketId } from '@currena/core';
import { OPEN_MAX_AGE_MIN, STALE_DAYS } from '@currena/insights/markets/definitions';

/* ------------------------------------------------------------------ *
 * §4.3 — constants
 * ------------------------------------------------------------------ */

/** The map shows the container's own width, not the viewport's (§M2). */
export const LAYOUT_SWITCH_PX = 960;
/** The period the map opens on (§M11 — "people know it from other
 * heatmaps", Jakob's Law). Session-only state; never stored. */
export const DEFAULT_PERIOD = '1D' as const;

/** Re-exports so the UI reads ONE config module (spec §4.3 names both). */
export const STALE_AFTER_DAYS = STALE_DAYS;
export { OPEN_MAX_AGE_MIN };

/** The map's three lenses (§M11) — the three the stored contract carries
 * a display change for. NOT the section switch's five: the map speaks its
 * own quieter control and never touches the section's lens. */
export type MapPeriod = '1D' | '1M' | '1Y';

export const MAP_PERIODS: readonly MapPeriod[] = ['1D', '1M', '1Y'];

/* ------------------------------------------------------------------ *
 * §4.2 — the five colour steps per period (percent change, display only)
 * ------------------------------------------------------------------ */

export interface MapThresholds {
  /** Inside this band around zero the step is Flat. */
  flatBand: number;
  /** At or beyond this magnitude the step is Strong. */
  strongFrom: number;
}

export const MAP_THRESHOLDS: Record<MapPeriod, MapThresholds> = {
  '1D': { flatBand: 0.1, strongFrom: 1 },
  '1M': { flatBand: 1, strongFrom: 5 },
  '1Y': { flatBand: 3, strongFrom: 15 },
};

/** The five display steps, worst to best (§4.2 / §M12's legend order). */
export type MapStep = 'sf' | 'fl' | 'f' | 'r' | 'sr';

export const MAP_STEPS: readonly MapStep[] = ['sf', 'fl', 'f', 'r', 'sr'];

/** The five-step scale for one percent change under one period's
 * thresholds (pure, display-only — it never feeds the verdict or hero). */
export function mapStepOf(pct: number, period: MapPeriod): MapStep {
  const { flatBand, strongFrom } = MAP_THRESHOLDS[period];
  const a = Math.abs(pct);
  if (a <= flatBand) return 'f';
  const strong = a >= strongFrom;
  if (pct > 0) return strong ? 'sr' : 'r';
  return strong ? 'sf' : 'fl';
}

/* ------------------------------------------------------------------ *
 * §4.1 — the map indices (order = west to east = DOM order = tab order)
 * ------------------------------------------------------------------ */

/** The callout band around the map (§M8). */
export type MapBand = 'top' | 'left' | 'right' | 'bottom';

export interface MapIndexConfig {
  /** The section registry's market id — never a second list (hard rule 1). */
  id: 'sp500' | 'ibov' | 'ftse' | 'dax' | 'nifty50' | 'ssec' | 'kospi' | 'n225' | 'asx200';
  /** ISO 3166-1 numeric of the country the index tints (§M4). */
  iso: string;
  /** ISO 3166-1 alpha-2 — the flag sprite's symbol id (B2: #wm-flag-{cc}). */
  cc: 'us' | 'br' | 'gb' | 'de' | 'in' | 'cn' | 'kr' | 'jp' | 'au';
  /** The callout band (§4.1; JSE deferred — its bottom slot went to ASX). */
  band: MapBand;
  /**
   * The callout card's centre as percentages of the map box (§M8: start
   * even, adjust until the §9 layout test passes). Geographic anchors —
   * the dot positions themselves come from world-map-geo.json (build:map).
   */
  card: { x: number; y: number };
}

export const MAP_INDICES: readonly MapIndexConfig[] = [
  { id: 'sp500', cc: 'us', iso: '840', band: 'top', card: { x: 19, y: 7.5 } },
  { id: 'ibov', cc: 'br', iso: '076', band: 'left', card: { x: 9, y: 68 } },
  { id: 'ftse', cc: 'gb', iso: '826', band: 'top', card: { x: 42, y: 7.5 } },
  { id: 'dax', cc: 'de', iso: '276', band: 'top', card: { x: 58, y: 7.5 } },
  { id: 'nifty50', cc: 'in', iso: '356', band: 'bottom', card: { x: 69.9, y: 88 } },
  { id: 'ssec', cc: 'cn', iso: '156', band: 'top', card: { x: 75, y: 7.5 } },
  { id: 'kospi', cc: 'kr', iso: '410', band: 'right', card: { x: 91.5, y: 50 } },
  { id: 'n225', cc: 'jp', iso: '392', band: 'top', card: { x: 91, y: 7.5 } },
  { id: 'asx200', cc: 'au', iso: '036', band: 'bottom', card: { x: 89.6, y: 88 } },
];

/**
 * §M6 short card names: every index fits under its canonical name except
 * Shanghai Composite (17 characters) — its card uses the short form Iranian
 * stock sites show. The STRING itself lives in the i18n dictionaries
 * (markets.map.cardNameSsec, the repo's every-string-through-i18n rule);
 * this map only names WHICH index shortens.
 */
export const MAP_CARD_NAME_KEY: Partial<Record<MarketId, 'cardNameSsec'>> = { ssec: 'cardNameSsec' };

/** The callout card width, as a percentage of the map box (§M6: every
 * card the same width; 16% keeps five top cards clear of each other at
 * the §M8 positions while the 13px names fit beside the status tag). */
export const MAP_CARD_WIDTH_PCT = 16;
