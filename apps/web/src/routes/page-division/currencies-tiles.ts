/**
 * currencies-tiles — the Currencies page's derivations, PURE (page-division
 * S18, 2026-11-11 — docs/page-division/02-PAGE-DIVISION-SPEC.md §12 items;
 * D-18/D-32/D-41/D-42; the session prompt's S18 scope).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles / S9 usa-tiles /
 * S12 europe-tiles / S14 asia-tiles / S16 australia-tiles / S17
 * commodities-tiles contract): every value the page renders is a DISPLAY
 * of an engine-computed reading or board row, re-derived here through the
 * SAME pure functions the other surfaces read — never a second arithmetic,
 * never an invented composite.
 *
 *   - The two registry-card sections (§12 items 2–3, D-32/D-42): the
 *     dollar-standing group (7 cards) + the pairs group (7 cards) via
 *     `pageGroupIds` (never hand-copied) = the page's 14 placed registry
 *     cards. Each renders the §21 trio — VALUE · 10-YEAR POSITION ·
 *     FRESHNESS — every card context-only (no gauges, no verdict lines).
 *   - The cards' value render restates the DISPLAY registry's own
 *     decimals/units (the S9–S17 pattern), pinned byte-for-byte against
 *     `config/display.ts`'s `formatReadingValue` by
 *     currencies-tiles.test.ts — including the ELEVEN unit families the
 *     page spans (index · points · percent · try · aed · jpy · eur · chf ·
 *     cny · usd · nzd), with the currency units PREFIXED in EN
 *     ('US$0.66' · '€0.90' · '¥150.23' · 'CN¥7.10' · '₺34.56' ·
 *     'AED3.67' · 'CHF0.88' · 'NZ$1.23') and suffixed in fa
 *     ('۰٫۶۶ دلار' · '۰٫۹۰ یورو' …).
 *   - The 11-pair BOARD (§12 item 2, D-42): the board order is
 *     FX_PAIR_IDS — the engine table's own order (EURUSD · USDJPY ·
 *     GBPUSD · USDCHF · USDCNY · AUDUSD · AUDJPY · EURJPY · EURCHF ·
 *     AUDCNY · AUDNZD), never a hand-copied list. The board rides the fx
 *     snapshot (GET /api/insights/fx — lib/fx.ts), NOT the projection;
 *     each row renders rate · d1/m1/m3/y1 · moveRank 0–100 · the bigMove
 *     flag · the 52-week closes (delta-encoded on the wire, decoded
 *     through the markets module's own decodeWeeklySeries).
 *   - The rule lights hero (§12 item 1, D-41): the status mapping is the
 *     LEGACY §9.3 table itself — `fxRuleView` from lib/fx-presentation
 *     (the same pure function the /insights page and the Global fx tile
 *     read), imported by the page chunk, never restated here.
 *
 * Pure + platform-free so the unit tests drive it directly
 * (currencies-tiles.test.ts) and the §21 backtest can pin it against the
 * engine without importing this module through the page
 * (currencies-backtest-core.ts).
 */

import type { FxPairId, FxRuleState, IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { FX_PAIR_IDS } from '@currena/insights/fx/definitions';
import { pageGroupIds } from '@currena/insights/page-division';

/* ------------------------------------------------------------------ *
 * The two registry-card sections (spec §12 items 2–3; D-32/D-42)
 * ------------------------------------------------------------------ */

/** The Dollar standing section (§12 item 3, D-32): the seven cards — the
 *  basket, the broad + EM measures, the US-Japan rate gap, the lira, the
 *  dirham, the reserve share. Derived from the placement table's own
 *  group, never a hand-copied list. */
export const CURRENCIES_DOLLAR_STANDING_IDS: readonly IndicatorId[] = pageGroupIds('currencies', 'dollar-standing');

/** The Pair context section (§12 item 2's registry leg, D-32/D-42): the
 *  seven registry pair cards — the §21-trio view of the pairs (the
 *  10-year position the BOARD rows do not carry). */
export const CURRENCIES_PAIR_CARD_IDS: readonly IndicatorId[] = pageGroupIds('currencies', 'pairs');

/**
 * Every Currencies registry card id, group order (7 + 7 = 14 in all).
 */
export const CURRENCIES_CARD_IDS: readonly IndicatorId[] = [
  ...CURRENCIES_DOLLAR_STANDING_IDS,
  ...CURRENCIES_PAIR_CARD_IDS,
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
 * The 11-pair board (§12 item 2, D-42) — the fx snapshot's own order
 * ------------------------------------------------------------------ */

/**
 * The pair board's order (D-42): the engine table's own FX_PAIR_IDS —
 * EURUSD · USDJPY · GBPUSD · USDCHF · USDCNY · AUDUSD · AUDJPY · EURJPY ·
 * EURCHF · AUDCNY · AUDNZD (audnzd last, the S18 11th pair). Re-derived
 * from the definitions, never hand-copied, so an engine pair change
 * surfaces as visible drift against this page (regenerate + review).
 */
export const CURRENCIES_BOARD_PAIR_IDS: readonly FxPairId[] = FX_PAIR_IDS;

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 14 Currencies ids, restated here so the lean Currencies chunk does not
 * pull the config module chain (the S3–S17 pattern). The decimals/units
 * are pinned against config/display.ts by currencies-tiles.test.ts — and
 * the VALUE RENDER is pinned against `formatReadingValue`
 * output-for-output over every id × both locales.
 *
 * The 14 ids span ELEVEN unit families: index (3 — the basket, broad,
 * EME), points (1 — the rate gap), percent (1 — the reserve share), and
 * the eight CURRENCY units (try · aed · jpy · eur · chf · cny · usd ·
 * nzd) — every one of them a PREFIXED unit in EN and a suffix word in fa
 * (the config/display.ts PREFIXED_UNITS discipline). No id carries a
 * display scale.
 * ------------------------------------------------------------------ */

export type CurrenciesUnitToken =
  | 'index'
  | 'points'
  | 'percent'
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
  index: string;
  points: string;
  percent: string;
  try: string;
  aed: string;
  jpy: string;
  eur: string;
  chf: string;
  cny: string;
  usd: string;
  nzd: string;
}

/** The unit families the join PREFIXES in EN (config/display.ts's own
 *  PREFIXED_UNITS set, restated lean — note the AED dirham is NOT a
 *  prefixed unit: it suffixes with a space in both locales). */
const PREFIXED: ReadonlySet<CurrenciesUnitToken> = new Set(['try', 'jpy', 'eur', 'chf', 'cny', 'usd', 'nzd']);

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean
 * (the indicatorValueParts + formatIndicatorValue join): the currency
 * units are PREFIXED in EN ('US$0.66' · '€0.9012' · '¥150.23' ·
 * 'CN¥7.1025' · '₺34.56' · 'CHF0.8795' · 'NZ$1.2283' — no
 * space, the unit before the number) and suffixed in fa ('۰٫۶۶ دلار' —
 * the number then the word); the AED dirham suffixes with a space in
 * BOTH locales ('3.67 AED' — the registry's own non-prefixed set); the
 * percent binds tight in both locales
 * ('56.70%' / '۵۶٫۷۰٪'); the word units (index · points) suffix with a
 * space in both ('112.34 index' · '3.41 pts'). null = the reading is
 * absent or carries no value (the honest unavailable word, never a
 * guess).
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
  // The percent binds tight with no space in both locales ('56.70%').
  if (cfg.unit === 'percent') return `${num}${unit}`;
  // The currency units are PREFIXED in EN ('US$0.66'), suffixed in fa
  // ('۰٫۶۶ دلار') — the PREFIXED_UNITS discipline from
  // config/display.ts's indicatorValueParts, restated lean.
  if (PREFIXED.has(cfg.unit)) {
    return numberLocale === 'en-US' ? `${unit}${num}` : `${num} ${unit}`;
  }
  // The word units (index · points) suffix with a space in both locales.
  return `${num} ${unit}`;
}

/* ------------------------------------------------------------------ *
 * The rule lights hero (§12 item 1, D-41) — the headline-key derivation
 * ------------------------------------------------------------------ */

/** The pd.currencies.ruleLights copy key a rule's CURRENT state speaks
 *  (null = no headline sentence: nodata rows speak the noData word, and a
 *  quiet R7 has no sentence at all — the legacy §9.3 card stays away
 *  below the 2.5% trigger, so the corpus carries no quiet wording for
 *  it). */
export type CurrenciesHeadlineKey =
  | 'headlineWarning'
  | 'headlineWatch'
  | 'headlineSupportive'
  | 'headlineQuiet'
  | 'headlineFlight'
  | 'headlineWobble'
  | 'headlineDollarLed'
  | 'headlineEuroLed';

/**
 * Which headline sentence one rule's stored state renders — the SAME
 * discipline the legacy surface's §7 sentences use (sentences.ts: "A
 * DOWNGRADED warning (§6.4: fired but not holding lately) keeps its
 * WARNING sentence — the numbers are facts; the Watching status word and
 * the caution line carry the reliability caveat"): a downgraded warning
 * shows its warning-shape headline while fxRuleView keeps the Watching
 * status word, and the light adds the downgrade caution line.
 *
 * R4's two warning shapes pick their own headline by variant (flight /
 * wobble); R7's context card picks its lead (dollar-led / euro-led); R3
 * has no watch wording because its only watch shape IS the downgrade.
 */
export function currenciesRuleHeadlineKey(rule: FxRuleState): CurrenciesHeadlineKey | null {
  // The downgrade pass (§6.4): a Warning whose pattern is not holding
  // lately became a Watch — the warning sentence stays (the caveat rides
  // the status word + the caution line).
  const downgraded = rule.outcome === 'watch' && rule.downgraded === true;
  switch (rule.id) {
    case 'r1_risk_mood':
    case 'r5_china_link':
      if (rule.outcome === 'warning' || downgraded) return 'headlineWarning';
      if (rule.outcome === 'watch') return 'headlineWatch';
      if (rule.outcome === 'supportive') return 'headlineSupportive';
      return rule.outcome === 'quiet' ? 'headlineQuiet' : null; // nodata/context
    case 'r2_carry_trade':
      if (rule.outcome === 'warning' || downgraded) return 'headlineWarning';
      if (rule.outcome === 'watch') return 'headlineWatch';
      return rule.outcome === 'quiet' ? 'headlineQuiet' : null;
    case 'r3_dollar_strength':
      // No headlineWatch exists in the corpus: R3's only watch shape is
      // the downgrade, which keeps its warning headline.
      if (rule.outcome === 'warning' || downgraded) return 'headlineWarning';
      if (rule.outcome === 'supportive') return 'headlineSupportive';
      return rule.outcome === 'quiet' ? 'headlineQuiet' : null;
    case 'r4_money_hiding':
      if (rule.outcome === 'warning' || downgraded) {
        return rule.variant === 'wobble' ? 'headlineWobble' : 'headlineFlight';
      }
      return rule.outcome === 'quiet' ? 'headlineQuiet' : null;
    case 'r6_europe_worry':
      if (rule.outcome === 'warning' || downgraded) return 'headlineWarning';
      if (rule.outcome === 'watch') return 'headlineWatch';
      return rule.outcome === 'quiet' ? 'headlineQuiet' : null;
    case 'r7_dollar_or_euro':
      if (rule.outcome === 'context') {
        return rule.variant === 'euro-led' ? 'headlineEuroLed' : 'headlineDollarLed';
      }
      // Below the 2.5% trigger the legacy card stays away entirely — no
      // quiet sentence exists for R7, and none is invented here.
      return null;
  }
}
