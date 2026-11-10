/**
 * currencies-tiles — the Currencies page's derivations, PURE (page-division
 * S18, 2026-11-12 — docs/page-division/02-PAGE-DIVISION-SPEC.md §12;
 * D-18/D-32/D-41/D-42; the session prompt's S18 scope).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles / S9 usa-tiles /
 * S12 europe-tiles / S14 asia-tiles / S16 australia-tiles / S17
 * commodities-tiles contract): every value the page renders is a DISPLAY
 * of an engine-computed reading or board row, re-derived here through
 * the SAME pure engine functions the other surfaces read — never a second
 * arithmetic, never an invented composite.
 *
 *   - The dollar-standing section (§12 item 3, D-32): the 7 registry
 *     cards via `pageGroupIds` (never hand-copied) — dollar-basket ·
 *     dollar-broad · dollar-eme · us-japan-10y-gap · usdtry · usdaed ·
 *     usd-reserve-share.
 *   - The pairs section (§14's own `pairs` group, D-18/D-32/D-42): the 7
 *     registry pair cards (usdjpy · eur-usd · usdchf · usdcny · audusd ·
 *     audjpy · audnzd) — the decade-history cards; the 11-pair BOARD
 *     itself rides the fx snapshot (§12 item 2, D-42), never re-fetched
 *     per pair.
 *   - The pair board (D-42): the 11 pair ids in spec order — re-exported
 *     from the fx engine's own FX_PAIR_IDS (audnzd last, the `auLink`
 *     group), each row rendering the STORED snapshot fields (rate,
 *     chg.d1/m1/m3/y1, moveRank, bigMove, weekly = the 52-week closes).
 *     The board's rows arrive through `fxPairRows` (lib/fx-presentation,
 *     imported — the SAME row builder the legacy /insights table renders
 *     through, never restated).
 *   - The rule lights (D-41): the 7 rules read from the fx snapshot's own
 *     `rules` array — the KV logic EXACTLY (the stored outcome/variant is
 *     the display's whole truth; the page NEVER re-derives a rule). The
 *     status mapping (Active/Watching/Quiet) is fx-presentation's
 *     `fxRuleView` — imported by the component, never restated.
 *   - The cards' value render restates the DISPLAY registry's own
 *     decimals/units (the S9–S17 pattern), pinned byte-for-byte against
 *     `config/display.ts`'s `formatReadingValue` by
 *     currencies-tiles.test.ts — including the eleven unit families the
 *     14 ids span: percent (usd-reserve-share) · points (us-japan-10y-gap)
 *     · index (the three dollar measures) · try (usdtry) · aed (usdaed) ·
 *     jpy (usdjpy · audjpy) · eur (eur-usd) · chf (usdchf) · cny (usdcny)
 *     · usd (audusd) · nzd (audnzd).
 *
 * Pure + platform-free so the unit tests drive it directly
 * (currencies-tiles.test.ts) and the §21 backtest can pin it against the
 * engine without importing this module through the page
 * (currencies-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';
import { FX_PAIR_IDS, FX_RULES } from '@currena/insights/fx/definitions';
import type { FxPairId, FxRuleId } from '@currena/core';

/* ------------------------------------------------------------------ *
 * The registry cards (§12 item 3 + §14's pairs group; D-32/D-42)
 * ------------------------------------------------------------------ */

/** The dollar-standing section (§12 item 3, D-32): the seven cards —
 *  Currena's own basket, the broad + EME measures, the US–Japan rate
 *  gap, the lira, the dirham and the reserve share. Derived from the
 *  placement table's own group, never a hand-copied list. */
export const CURRENCIES_DOLLAR_STANDING_IDS: readonly IndicatorId[] = pageGroupIds('currencies', 'dollar-standing');

/** The pairs section (§14's `pairs` group, D-18/D-32/D-42): the seven
 *  registry pair cards with 10-year history. The 11-pair BOARD rides the
 *  fx snapshot (below); these are the decade cards. */
export const CURRENCIES_PAIRS_IDS: readonly IndicatorId[] = pageGroupIds('currencies', 'pairs');

/**
 * Every Currencies registry card id, group order (7 + 7 = 14 in all).
 */
export const CURRENCIES_CARD_IDS: readonly IndicatorId[] = [
  ...CURRENCIES_DOLLAR_STANDING_IDS,
  ...CURRENCIES_PAIRS_IDS,
];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined).
 * currencies-tiles.test.ts pins this list against the placement's own
 * groups byte-for-byte.
 */
export type CurrenciesCardId =
  | 'dollar-basket'
  | 'dollar-broad'
  | 'dollar-eme'
  | 'us-japan-10y-gap'
  | 'usdtry'
  | 'usdaed'
  | 'usd-reserve-share'
  | 'usdjpy'
  | 'eur-usd'
  | 'usdchf'
  | 'usdcny'
  | 'audusd'
  | 'audjpy'
  | 'audnzd';

/** One card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface CurrenciesCardEntry {
  id: CurrenciesCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One group's cards in placement order, straight off the projection
 * (the S7/S9/S12/S14/S16/S17 pattern: the readings arrive already in
 * placement order — the projection is built from `pageReadingIds` — this
 * only joins them).
 */
export function currenciesCards(
  readings: readonly IndicatorReading[],
  ids: readonly IndicatorId[],
): CurrenciesCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as CurrenciesCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The pair board (§12 item 2, D-42 — the 11 pairs incl. AUDNZD)
 * ------------------------------------------------------------------ */

/**
 * The 11 board pair ids in spec order (D-42: eurusd · usdjpy · gbpusd ·
 * usdchf · usdcny · audusd · audjpy · eurjpy · eurchf · audcny · audnzd).
 * Re-exported from the fx engine's own FX_PAIR_IDS — the SAME list the
 * snapshot writer computes over, never a hand-copied second list (a
 * board the engine does not write is a board the page cannot render).
 */
export const CURRENCIES_BOARD_PAIR_IDS: readonly FxPairId[] = FX_PAIR_IDS;

/* ------------------------------------------------------------------ *
 * The rule lights (§12 item 1, D-41 — the 7 rules R1–R7)
 * ------------------------------------------------------------------ */

/**
 * The 7 rule ids in spec order (R1 risk-mood · R2 carry unwind · R3
 * dollar strength · R4 money-hiding · R5 China link · R6 Europe worry ·
 * R7 dollar-or-euro), re-exported from the fx engine's own FX_RULES. The
 * hero renders the STORED rule states (outcome/variant) through
 * fxRuleView — the KV logic exactly, never a re-derivation.
 */
export const CURRENCIES_RULE_IDS: readonly FxRuleId[] = FX_RULES.map((r) => r.id);

/** The rule's copy key (r1…r7) — the corpus's own mapping, restated lean
 *  (the fxRuleCopyKey contract: the engine id's first two letters). */
export type CurrenciesRuleCopyKey = 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7';

/** r1_risk_mood → 'r1' … r7_dollar_or_euro → 'r7' (the copy map key). */
export function currenciesRuleCopyKey(id: FxRuleId): CurrenciesRuleCopyKey {
  return id.slice(0, 2) as CurrenciesRuleCopyKey;
}

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 14 Currencies ids, restated here so the lean Currencies chunk does not
 * pull the config module chain (the S3–S17 pattern). The decimals/units
 * are pinned against config/display.ts by currencies-tiles.test.ts — and
 * the VALUE RENDER is pinned against `formatReadingValue` output-for-
 * output over every id × both locales.
 *
 * The 14 ids span ELEVEN unit families: percent (1) · points (1) ·
 * index (3 — the three dollar measures) · try (1) · aed (1) · jpy (2 —
 * the two yen pairs) · eur (1) · chf (1) · cny (1) · usd (1) · nzd (1).
 * The equivalence pin proves the join matches formatReadingValue over
 * all eleven shapes, including the EN-prefixed families (₺ · ¥ · € ·
 * CHF · CN¥ · US$ · NZ$) and the two suffixed words (index · pts · AED).
 * ------------------------------------------------------------------ */

export type CurrenciesUnitToken =
  | 'percent'
  | 'points'
  | 'index'
  | 'try'
  | 'aed'
  | 'jpy'
  | 'eur'
  | 'chf'
  | 'cny'
  | 'usd'
  | 'nzd';

export interface CurrenciesCardDisplayConfig {
  decimals: number;
  unit: CurrenciesUnitToken;
}

export const CURRENCIES_CARD_DISPLAY: Readonly<Record<CurrenciesCardId, CurrenciesCardDisplayConfig>> = {
  'dollar-basket': { decimals: 2, unit: 'index' },
  'dollar-broad': { decimals: 2, unit: 'index' },
  'dollar-eme': { decimals: 2, unit: 'index' },
  'us-japan-10y-gap': { decimals: 2, unit: 'points' },
  usdtry: { decimals: 2, unit: 'try' },
  usdaed: { decimals: 2, unit: 'aed' },
  'usd-reserve-share': { decimals: 2, unit: 'percent' },
  usdjpy: { decimals: 2, unit: 'jpy' },
  'eur-usd': { decimals: 4, unit: 'eur' },
  usdchf: { decimals: 4, unit: 'chf' },
  usdcny: { decimals: 4, unit: 'cny' },
  audusd: { decimals: 4, unit: 'usd' },
  audjpy: { decimals: 2, unit: 'jpy' },
  audnzd: { decimals: 4, unit: 'nzd' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by currencies-copy-pin.test.ts). */
export interface CurrenciesUnitLabels {
  percent: string;
  points: string;
  index: string;
  try: string;
  aed: string;
  jpy: string;
  eur: string;
  chf: string;
  cny: string;
  usd: string;
  nzd: string;
}

/** The units rendered as a PREFIX in English (suffix everywhere in
 *  Farsi) — the DISPLAY registry's own PREFIXED_UNITS set, restated lean
 *  over this page's eleven families (aed is NOT prefixed: '3.67 AED'). */
const PREFIXED_UNITS: ReadonlySet<CurrenciesUnitToken> = new Set(['usd', 'eur', 'jpy', 'cny', 'try', 'nzd', 'chf']);

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean
 * (the indicatorValueParts + formatIndicatorValue join): the percent unit
 * binds tight in both locales ('56.70%' / '۵۶٫۷۰٪' — no space); the EN
 * render PREFIXES the currency families ('₺34.55' · '¥157.95' · '€1.1193'
 * · 'CHF0.8812' · 'CN¥7.2345' · 'US$0.6578' · 'NZ$1.0988') while fa
 * suffixes the word ('۳۴٫۵۵ لیر ترکیه'); the word units (index · pts ·
 * AED) suffix with a space in both locales ('101.85 index' · '3.02 pts'
 * · '3.67 AED'). null = the reading is absent or carries no value (the
 * honest unavailable word, never a guess).
 *
 * Pinned output-for-output against `formatReadingValue` over every id ×
 * both locales by currencies-tiles.test.ts — the lean restatement can
 * never drift from the legacy renderer.
 */
export function currenciesCardValueText(
  id: CurrenciesCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: CurrenciesUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = CURRENCIES_CARD_DISPLAY[id];
  const num = formatNumber(reading.value, numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;
  // The percent unit binds tight in both locales ('56.70%').
  if (cfg.unit === 'percent') return `${num}${unit}`;
  // The currency families are PREFIXED in EN ('₺34.55'), suffixed in fa
  // ('۳۴٫۵۵ لیر ترکیه') — the PREFIXED_UNITS discipline from
  // config/display.ts's indicatorValueParts, restated lean.
  if (numberLocale === 'en-US' && PREFIXED_UNITS.has(cfg.unit)) return `${unit}${num}`;
  // The word units (index · pts · AED) suffix with a space in both
  // locales ('101.85 index' · '3.02 pts' · '3.67 AED').
  return `${num} ${unit}`;
}
