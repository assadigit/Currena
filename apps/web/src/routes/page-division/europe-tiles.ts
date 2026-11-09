/**
 * europe-tiles — the Europe page's derivations, PURE (page-division S12,
 * 2026-11-09 — docs/page-division/02-PAGE-DIVISION-SPEC.md §8 items 1–4;
 * D-15/D-33/D-34; the session prompt's S12 scope).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles / S9 usa-tiles
 * contract): every value the page renders is a DISPLAY of an engine-
 * computed reading, re-derived here through the SAME pure functions the
 * other surfaces read — never a second arithmetic, never an invented
 * composite.
 *
 *   - The EU section (D-33, §8 item 1): the placement table's own
 *     `eu-members` group via `pageGroupIds` (never hand-copied) — the
 *     six euro-area cards (ecb-dfr · euro-hicp · euro-aaa-10y ·
 *     bund-10y · btp-bund-spread · oecd-cli-de). The §15 FRED-only fills
 *     (D-34) land in a later session after live verification (Rule 5:
 *     the S12 verification attempt is recorded in DECISIONS.md — none
 *     ingested unverified).
 *   - The non-EU United Kingdom section (D-33, §8 item 2): the
 *     placement's `non-eu-uk` group — gilt-10y · boe-rate. FTSE rides
 *     the markets board (the Europe zoom map, the S8 section).
 *   - The cards' value render restates the DISPLAY registry's own
 *     decimals/units (the S9 usa-tiles pattern), pinned byte-for-byte
 *     against `config/display.ts`'s `formatReadingValue` by
 *     europe-tiles.test.ts, so the lean restatement can never drift
 *     from the legacy renderer.
 *
 * Europe has NO thematic gauge of its own (ecb-dfr votes in borrowing-
 * costs, euro-hicp in prices-heat — both are Global gauges); there is
 * no verdict strip on this page and no TIC board. The §21 diff is the
 * card trio (value · 10-year position · freshness) over the 8 placed
 * ids, page ≡ the served snapshot (europe-backtest-core.ts).
 *
 * Pure + platform-free so the unit tests drive it directly
 * (europe-tiles.test.ts) and the §21 backtest can pin it against the
 * engine without importing this module through the page
 * (europe-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';

/* ------------------------------------------------------------------ *
 * The two sections (spec §8 items 1–2; D-33 — EU members listed apart
 * from the non-EU United Kingdom)
 * ------------------------------------------------------------------ */

/**
 * The EU section (§8 item 1): the six euro-area cards. Derived from the
 * placement table's own group, never a hand-copied list (the S7
 * WORLD_RISK_IDS / S9 USA_TIER*_IDS discipline, per-group).
 */
export const EUROPE_EU_IDS: readonly IndicatorId[] = pageGroupIds('europe', 'eu-members');

/**
 * The non-EU United Kingdom section (§8 item 2): gilt-10y · boe-rate.
 * FTSE rides the markets board (the Europe zoom map — the S8 section
 * the page seats under its own layers).
 */
export const EUROPE_UK_IDS: readonly IndicatorId[] = pageGroupIds('europe', 'non-eu-uk');

/** Every Europe registry card id, section order (EU then UK, 8 in all). */
export const EUROPE_CARD_IDS: readonly IndicatorId[] = [...EUROPE_EU_IDS, ...EUROPE_UK_IDS];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined). europe-tiles.test.ts
 * pins this list against the placement's own groups byte-for-byte.
 */
export type EuropeCardId =
  | 'ecb-dfr'
  | 'euro-hicp'
  | 'euro-aaa-10y'
  | 'bund-10y'
  | 'btp-bund-spread'
  | 'oecd-cli-de'
  | 'gilt-10y'
  | 'boe-rate';

/** One card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface EuropeCardEntry {
  id: EuropeCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One section's cards in placement order, straight off the projection
 * (the S7 worldRiskCards / S9 usaCards pattern: the readings arrive
 * already in placement order — the projection is built from
 * `pageReadingIds` — this only joins them).
 */
export function europeCards(readings: readonly IndicatorReading[], ids: readonly IndicatorId[]): EuropeCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as EuropeCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 8 Europe ids, restated here so the lean Europe chunk does not pull the
 * config module chain (the S3 GlobalBoard / S5 GOLD_DISPLAY / S7
 * WORLD_RISK_DISPLAY / S9 USA_CARD_DISPLAY pattern). The decimals/units
 * are pinned against config/display.ts by europe-tiles.test.ts — and the
 * VALUE RENDER is pinned against `formatReadingValue` output-for-output
 * over every id × both locales (a stronger pin than a table echo: the
 * restated join can never drift from the legacy renderer).
 *
 * Europe's 8 ids are all percent / points / index — no scale, no range,
 * no currency family (the lean render handles exactly these three unit
 * shapes; the equivalence pin proves the join matches formatReadingValue).
 * ------------------------------------------------------------------ */

export type EuropeUnitToken = 'percent' | 'points' | 'index';

export interface EuropeCardDisplayConfig {
  decimals: number;
  unit: EuropeUnitToken;
}

export const EUROPE_CARD_DISPLAY: Readonly<Record<EuropeCardId, EuropeCardDisplayConfig>> = {
  'ecb-dfr': { decimals: 2, unit: 'percent' },
  'euro-hicp': { decimals: 1, unit: 'percent' },
  'euro-aaa-10y': { decimals: 2, unit: 'percent' },
  'bund-10y': { decimals: 2, unit: 'percent' },
  'btp-bund-spread': { decimals: 2, unit: 'points' },
  'oecd-cli-de': { decimals: 1, unit: 'index' },
  'gilt-10y': { decimals: 2, unit: 'percent' },
  'boe-rate': { decimals: 2, unit: 'percent' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by europe-copy-pin.test.ts). */
export interface EuropeUnitLabels {
  percent: string;
  points: string;
  index: string;
}

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean
 *  (the indicatorValueParts + formatIndicatorValue join): percent binds
 *  tight ('3.50%' / '۳٫۵۰٪'), the word units (points · index) suffix
 *  with a space ('1.28 pts' / '100.5 index'). null = the reading is
 *  absent or carries no value (the honest unavailable word, never a
 *  guess).
 *
 * Pinned output-for-output against `formatReadingValue` over every id ×
 * both locales by europe-tiles.test.ts — the lean restatement can never
 * drift from the legacy renderer.
 */
export function europeCardValueText(
  id: EuropeCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: EuropeUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = EUROPE_CARD_DISPLAY[id];
  const num = formatNumber(reading.value, numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;
  // percent binds tight (both locales); points and index suffix with a
  // space — exactly the formatIndicatorValue join for these unit shapes.
  if (cfg.unit === 'percent') return `${num}${unit}`;
  return `${num} ${unit}`;
}
