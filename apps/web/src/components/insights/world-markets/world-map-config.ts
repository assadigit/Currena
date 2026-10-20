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
 *   §4.2  the flat-band thresholds per period (display only);
 *   §4.3  the layout switch width, the default period, and the re-exports
 *         of the two constants the data layer already owns (OPEN_MAX_AGE_MIN,
 *         STALE_AFTER_DAYS≡STALE_DAYS) so there is exactly one source.
 *
 * 2026-10-20g owner round — the map now covers ALL SIXTEEN registry
 * indices ("add any remaining indice of the app to the world map"):
 *   · Dow Jones / S&P 500 / Nasdaq 100 share New York — their pins fan
 *     off the exact city (build-time fan, see build-world-map.mjs) and
 *     the three cards split between the top band and the left column.
 *   · The Euro Stoxx 50's app-country is "Eurozone" — no single country
 *     — so its iso is null: it pins at Brussels (the EU capital) and
 *     tints no country, honestly.
 *   · Hang Seng's Hong Kong (iso 344) has no path at 110 m resolution
 *     (merged into China): the pin renders at Hong Kong, the tint stays
 *     with ssec's China alone.
 *   · A country that hosts several indices (the US trio) tints by its
 *     STRONGEST fresh mover — the biggest single-index move on screen,
 *     never an average that no index actually made.
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

/** The map's three lenses (§M11 + the 2026-10-20f owner round: the cards
 * carry Day/Week/Month side by side, so the switch speaks the same three
 * periods and drives which one colours the map and emphasises the card).
 * NOT the section switch's five: the map speaks its own quieter control
 * and never touches the section's lens. */
export type MapPeriod = '1D' | '1W' | '1M';

export const MAP_PERIODS: readonly MapPeriod[] = ['1D', '1W', '1M'];

/* ------------------------------------------------------------------ *
 * §4.2 — the flat band per period (percent change, display only)
 *
 * 2026-10-20f owner round: the five discrete steps retired in favour of
 * a RELATIVE continuous scale — "more down = more red, more up = more
 * saturated green". What survives from the old thresholds is the honest
 * FLAT band: inside it a market is neutral grey (a ±0.09% day is not a
 * rise), exactly as before. Beyond it the colour weight grows with the
 * move's size RELATIVE to the biggest move on screen in that period.
 * ------------------------------------------------------------------ */

export const MAP_THRESHOLDS: Record<MapPeriod, number> = {
  '1D': 0.1,
  '1W': 0.5,
  '1M': 1,
};

/** The colour direction of one reading (null = flat / no honest data —
 * the country, pin and card stay neutral grey). */
export type MapDir = 'u' | 'd';

/** The relative scale's normaliser: the biggest |chg| among the period's
 * fresh readings (0 when nothing carries data — then every weight is 0). */
export function mapScaleOf(pcts: readonly (number | null)[]): number {
  let max = 0;
  for (const p of pcts) if (p !== null && Math.abs(p) > max) max = Math.abs(p);
  return max;
}

/**
 * The RELATIVE colour weight of one percent change, 0…1 (owner round
 * 2026-10-20f): 0 inside the period's flat band, 1 for the biggest mover
 * on screen, a 0.75-power curve between so mid-size moves keep visible
 * colour. Pure display arithmetic — it never feeds the verdict or hero.
 */
export function mapWeightOf(pct: number, period: MapPeriod, scaleMax: number): number {
  const flat = MAP_THRESHOLDS[period];
  const a = Math.abs(pct);
  if (a <= flat) return 0;
  const span = Math.max(scaleMax - flat, flat); // never divide by ~0
  const w = Math.min((a - flat) / span, 1);
  return w ** 0.75;
}

/* ------------------------------------------------------------------ *
 * §4.1 — the map indices (order = west to east = DOM order = tab order)
 * ------------------------------------------------------------------ */

/** The callout band around the map (§M8; documentation of intent — the
 * card's x/y below is what renders). */
export type MapBand = 'top' | 'left' | 'right' | 'bottom' | 'float';

/** The flag sprite's country codes (B2: #wm-flag-{cc}). */
export type MapCc = 'us' | 'ca' | 'br' | 'gb' | 'fr' | 'de' | 'eu' | 'in' | 'hk' | 'cn' | 'tw' | 'kr' | 'jp' | 'au';

export interface MapIndexConfig {
  /** The section registry's market id — never a second list (hard rule 1). */
  id: MarketId;
  /**
   * ISO 3166-1 numeric of the country the index tints (§M4); null when
   * the index has no single country (the Euro Stoxx 50 = Eurozone) —
   * such a row pins and cards but tints nothing. Hong Kong is "344":
   * honest in the data, path-less on the 110 m map, so it tints nothing
   * by construction (no path carries that iso).
   */
  iso: string | null;
  /** ISO 3166-1 alpha-2 — the flag sprite's symbol id (B2: #wm-flag-{cc}). */
  cc: MapCc;
  /** The callout band (§4.1; documentation — the position below renders). */
  band: MapBand;
  /**
   * The callout card's centre as percentages of the map box (§M8: start
   * even, adjust until the §9 layout test passes). Geographic anchors —
   * the pin positions themselves come from world-map-geo.json (build:map).
   */
  card: { x: number; y: number };
}

export const MAP_INDICES: readonly MapIndexConfig[] = [
  { id: 'dow', iso: '840', cc: 'us', band: 'left', card: { x: 9.5, y: 44.5 } },
  { id: 'tsx', iso: '124', cc: 'ca', band: 'top', card: { x: 9.5, y: 8.5 } },
  { id: 'sp500', iso: '840', cc: 'us', band: 'left', card: { x: 9.5, y: 26.5 } },
  { id: 'ndx', iso: '840', cc: 'us', band: 'top', card: { x: 26, y: 8.5 } },
  { id: 'ibov', iso: '076', cc: 'br', band: 'left', card: { x: 9.5, y: 68.5 } },
  { id: 'ftse', iso: '826', cc: 'gb', band: 'top', card: { x: 43, y: 8.5 } },
  { id: 'cac', iso: '250', cc: 'fr', band: 'float', card: { x: 41, y: 26 } },
  { id: 'dax', iso: '276', cc: 'de', band: 'top', card: { x: 59, y: 8.5 } },
  { id: 'stoxx50', iso: null, cc: 'eu', band: 'float', card: { x: 61, y: 33 } },
  { id: 'nifty50', iso: '356', cc: 'in', band: 'bottom', card: { x: 57, y: 88 } },
  { id: 'hsi', iso: '344', cc: 'hk', band: 'bottom', card: { x: 72, y: 88 } },
  { id: 'ssec', iso: '156', cc: 'cn', band: 'top', card: { x: 75.5, y: 8.5 } },
  { id: 'taiex', iso: '158', cc: 'tw', band: 'right', card: { x: 91.5, y: 59 } },
  { id: 'kospi', iso: '410', cc: 'kr', band: 'right', card: { x: 91.5, y: 39 } },
  { id: 'n225', iso: '392', cc: 'jp', band: 'top', card: { x: 92, y: 8.5 } },
  { id: 'asx200', iso: '036', cc: 'au', band: 'right', card: { x: 91.5, y: 77 } },
];

/**
 * §M6 short card names: indices whose canonical name is too long for the
 * 2026-10-20g fourteen-and-a-half-percent card at the §9.2 fixture width.
 * The STRING itself lives in the i18n dictionaries (the repo's
 * every-string-through-i18n rule); this map only names WHICH index
 * shortens. Euro Stoxx 50 → "Stoxx 50", S&P/TSX Composite → "S&P/TSX",
 * Nasdaq 100 → "Nasdaq", Shanghai Composite → "Shanghai" (§M6's original).
 */
export type MapCardNameKey = 'cardNameSsec' | 'cardNameStoxx' | 'cardNameTsx' | 'cardNameNdx';

export const MAP_CARD_NAME_KEY: Partial<Record<MarketId, MapCardNameKey>> = {
  ssec: 'cardNameSsec',
  stoxx50: 'cardNameStoxx',
  tsx: 'cardNameTsx',
  ndx: 'cardNameNdx',
};

/** The callout card width, as a percentage of the map box (§M6: every
 * card the same width; 14.5% fits SIX cards across the top band at the
 * 2026-10-20g sixteen-index density — with ~2% gutters — while the names
 * fit beside the status dot at the §9.2 fixture width). */
export const MAP_CARD_WIDTH_PCT = 14.5;

/* ------------------------------------------------------------------ *
 * 2026-10-20g owner round — the SELECTED COUNTRY's name label. When one
 * of a country's cards is active, its short name is written across the
 * country at 60% ink opacity (the owner's ask). The default anchor is
 * the build-time geo label (world-map-geo.json's largest-polygon
 * centroid — "USA" lands on Kansas, not Alaska); the entries below
 * nudge that anchor where the sixteen pins and leader lines now crowd
 * the classic spot, and set a smaller size for the small countries
 * whose full-size name cannot sit anywhere near them. Hong Kong and the
 * Eurozone have no geo anchor (no single path) — their entries carry an
 * absolute anchor near their pin.
 * ------------------------------------------------------------------ */

export interface MapLabelSpec {
  /** The anchor as percentages of the map box (absolute — tuned). */
  x: number;
  y: number;
  /** Font size in viewBox units (1000-unit box; 20 ≈ 20px at the desktop
   * stage width, 13–14 for the small countries). */
  size: number;
}

export const MAP_LABEL_SIZE_DEFAULT = 20;

/** Keyed by the row's cc (one label per country, not per index — the US
 * trio all say "USA"). Absent → the geo centroid at the default size. */
export const MAP_LABELS: Partial<Record<MapCc, MapLabelSpec>> = {
  // USA: under the S&P 500's horizontal leader line, over Oklahoma.
  us: { x: 23.5, y: 29, size: 20 },
  // Canada: below the top band, above the Toronto/New York pin fan.
  ca: { x: 26.84, y: 17.5, size: 20 },
  // UK: west of the London pin, over the Irish Sea (the island is tiny).
  gb: { x: 48, y: 16.8, size: 14 },
  // France: the corridor between the CAC card and the Stoxx leader line.
  fr: { x: 50.8, y: 24, size: 14 },
  // Germany: east of the Dax line, over the country's eastern half.
  de: { x: 54.5, y: 17.5, size: 14 },
  // India: nudged east off the Stoxx card's corner.
  in: { x: 72.2, y: 35.89, size: 20 },
  // S. Korea: the Sea of Japan gap between the Shanghai and Tokyo pins.
  kr: { x: 85.6, y: 30, size: 14 },
  // Japan: south of Honshu, clear of the Tokyo and Shanghai lines.
  jp: { x: 84.6, y: 29.4, size: 14 },
  // Taiwan: the East China Sea gap NE of the island (the island is 0.6%).
  tw: { x: 84.8, y: 31.8, size: 13 },
  // Hong Kong: no path — SW of the pin, clear of the Hang Seng line.
  hk: { x: 77.8, y: 39.2, size: 13 },
  // Eurozone: no path — east of the Brussels pin, over Austria.
  eu: { x: 58, y: 24.5, size: 14 },
};

/* ------------------------------------------------------------------ *
 * 2026-10-20f owner round — the RELATIVE colour ramps. One weight
 * (0…1, from mapWeightOf) drives three CSS mix percentages; the mix
 * anchors are theme-agnostic shares of the existing status tokens so a
 * single set of numbers holds in light AND dark:
 *   --t   the country tint   (alert/normal vs surface)   34% → 66%
 *   --m   the pin fill       (alert/normal vs ink)      55% → 100%
 *   --m2  the pin rim        (a stronger cut of --m)     m + 22, ≤100
 *   --b   the card border    (alert/normal, alpha)      35% → 75%
 *   --i   the card cell ink  (chip ink vs ink)          58% → 100%
 * ------------------------------------------------------------------ */
export const MAP_TINT_LO = 34;
export const MAP_TINT_HI = 66;
export const MAP_MARK_LO = 60;
export const MAP_MARK_HI = 90;
export const MAP_BORDER_LO = 35;
export const MAP_BORDER_HI = 75;
export const MAP_INK_LO = 58;
export const MAP_INK_HI = 100;

const ramp = (lo: number, hi: number, w: number) => Math.round((lo + (hi - lo) * w) * 10) / 10;

export const tintMixOf = (w: number) => ramp(MAP_TINT_LO, MAP_TINT_HI, w);
export const markMixOf = (w: number) => ramp(MAP_MARK_LO, MAP_MARK_HI, w);
/** The 3D pin's rim runs the same ramp ~22 points hotter than its fill —
 * a cut strong enough to hold the ≥3:1 mark floor on every backdrop. */
export const rimMixOf = (w: number) => Math.min(100, markMixOf(w) + 22);
export const borderMixOf = (w: number) => ramp(MAP_BORDER_LO, MAP_BORDER_HI, w);
export const inkMixOf = (w: number) => ramp(MAP_INK_LO, MAP_INK_HI, w);
