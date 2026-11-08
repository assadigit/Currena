/**
 * usa-tiles — the USA page's derivations, PURE (page-division S9 + S10,
 * 2026-11-09 — docs/page-division/02-PAGE-DIVISION-SPEC.md §7 items 1–6,
 * D-29/D-30/D-31; the session prompts' S9 + S10 scopes).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles contract): every
 * value the page renders is a DISPLAY of an engine-computed reading,
 * re-derived here through the SAME pure functions the other surfaces read
 * — never a second arithmetic, never an invented composite.
 *
 *   - The D-30 verdict strip: `usaGaugeVerdicts` IS `globalGaugeTiles`
 *     (the S3 module, re-exported — one derivation, both pages): the five
 *     thematic gauges through the engine's own `gaugeReading` +
 *     `labelForVerdictStep`. The USA projection carries the gauges' full
 *     voter sets by construction (homes + the D-30 mirror inputs), so the
 *     strip's verdicts are Global's own verdicts, byte-for-byte — the §21
 *     backtest (usa-backtest-core.ts) proves it on three sides: page ≡
 *     Global's page derivation ≡ the engine over the served snapshot.
 *   - The tier cards (D-29, spec §7 items 2–6): the placement table's own
 *     groups via `pageGroupIds` (never hand-copied) — S9's tiers 1–2 plus
 *     S10's tier-3 inflation (12), tier-4 labor & growth (17) and tier-5
 *     liquidity/stress/valuation (17), 72 cards in all — the readings
 *     straight off the served projection, and the value render restating
 *     the DISPLAY registry's own decimals/units/scales — pinned
 *     byte-for-byte against `config/display.ts`'s `formatReadingValue` by
 *     usa-tiles.test.ts, so the lean restatement can never drift from the
 *     legacy renderer.
 *
 * Pure + platform-free so the unit tests drive it directly
 * (usa-tiles.test.ts) and the §21 backtest can pin it against the engine
 * without importing this module through the page (usa-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';
import { globalGaugeTiles } from './global-tiles';
import type { GlobalGaugeTile } from './global-tiles';

/* ------------------------------------------------------------------ *
 * The D-30 verdict strip — the SAME five computed verdicts as Global
 * ------------------------------------------------------------------ */

/**
 * The verdict strip's derivation — `globalGaugeTiles` itself, re-exported
 * under the USA page's own name (the S8 world-map-copy pattern: ONE
 * derivation, both pages; a second copy of the arithmetic is exactly what
 * D-48 forbids). The readings the Global board and this page feed it are
 * the same voter sets (both projections carry THEMATIC_GAUGE_MEMBER_IDS —
 * Global as mirrors, USA as homes + the D-30 mirrors), so every strip
 * value equals the Global tile's value by construction.
 */
export const usaGaugeVerdicts: (readings: readonly IndicatorReading[]) => GlobalGaugeTile[] = globalGaugeTiles;

/** One strip entry's shape (the S3 GlobalGaugeTile contract, re-named). */
export type UsaGaugeVerdict = GlobalGaugeTile;

/* ------------------------------------------------------------------ *
 * The tiers (spec §7 items 2–6) — D-29 tier 1 · tier 2 rates & the Fed ·
 * the S10 tiers 3–5 (inflation · labor & growth · liquidity/stress/
 * valuation); tier 6 is the TIC BOARD (D-31), not registry cards — it
 * rides its own feed (GET /api/insights/tic) through UsaTicSection.
 * ------------------------------------------------------------------ */

/**
 * Tier 1 — "the world watches" (D-29, §7 item 2): the seven numbers the
 * planet reacts to first. Derived from the placement table's own group,
 * never a hand-copied list (the S7 WORLD_RISK_IDS discipline, per-group).
 */
export const USA_TIER1_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-1-world-watches');

/**
 * Tier 2 — rates & the Fed (§7 item 3): the placement's authoritative 19
 * ids (the spec's own "(22)" label is the recorded AF-2 hand-count drift —
 * PLACEMENT.generated.md is the authority).
 */
export const USA_TIER2_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-2-rates-fed');

/**
 * Tier 3 — inflation (§7 item 4): the placement's 12 ids. michigan-1y-
 * expectations is AF-3 (the 184th id, absent from the spec's own §7
 * list; placed here beside its 5y twin per evident intent — owner
 * ratification pending, recorded in PLACEMENT.generated.md).
 */
export const USA_TIER3_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-3-inflation');

/**
 * Tier 4 — labor & growth (§7 item 5): the placement's 17 ids (the spec's
 * own "(19)" label is the recorded AF-2 hand-count drift).
 */
export const USA_TIER4_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-4-labor-growth');

/**
 * Tier 5 — liquidity, stress & valuation (§7 item 6): the placement's
 * 17 ids (the Fed's plumbing, the stress indices, the valuation pair and
 * the S&P breadth ratio — the spec's own 17).
 */
export const USA_TIER5_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-5-liquidity-stress-valuation');

/** Every USA registry card id, tier order (tiers 1–5, 72 in all). */
export const USA_CARD_IDS: readonly IndicatorId[] = [
  ...USA_TIER1_IDS,
  ...USA_TIER2_IDS,
  ...USA_TIER3_IDS,
  ...USA_TIER4_IDS,
  ...USA_TIER5_IDS,
];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined). usa-tiles.test.ts
 * pins this list against the placement's own groups byte-for-byte.
 */
export type UsaCardId =
  // Tiers 1–2 (S9)
  | 'fed-target'
  | 'fed-expectations'
  | 'us-cpi-yoy'
  | 'us-pce-core-yoy'
  | 'us-nfp'
  | 'us-unemployment'
  | 'us10y'
  | 'yield-curve-10y2y'
  | 'yield-curve-10y3m'
  | 'real-yield-10y'
  | 'real-yield-5y'
  | 'real-curve-10y5y'
  | 'us30y'
  | 'us-2y'
  | 'sofr'
  | 'mortgage-30y'
  | 'nyfed-custody'
  | 'us-deficit-monthly'
  | 'us-deficit-12m'
  | 'treasury-auction-10y'
  | 'treasury-auction-10y-indirect'
  | 'treasury-auction-30y'
  | 'treasury-auction-30y-indirect'
  | 'rstar-us'
  | 'debt-to-gdp'
  | 'govt-interest-revenue'
  // Tier 3 — inflation (S10, §7 item 4)
  | 'us-cpi-core-yoy'
  | 'median-cpi'
  | 'sticky-cpi'
  | 'us-wages'
  | 't5yie'
  | 'breakeven-5y5y'
  | 'breakeven-10y'
  | 'breakeven-tilt'
  | 'cpi-nowcast'
  | 'cpi-surprise'
  | 'michigan-5y-expectations'
  | 'michigan-1y-expectations'
  // Tier 4 — labor & growth (S10, §7 item 5)
  | 'initial-jobless-claims'
  | 'continuing-claims'
  | 'job-openings'
  | 'sahm-rule'
  | 'recession-probability'
  | 'michigan-sentiment'
  | 'oecd-cli-us'
  | 'philly-fed'
  | 'empire-state'
  | 'cfnai'
  | 'gdpnow'
  | 'us-gdp-growth'
  | 'retail-sales'
  | 'housing-permits'
  | 'epu-us'
  | 'tpu-us'
  | 'm2-us'
  // Tier 5 — liquidity, stress & valuation (S10, §7 item 6)
  | 'walcl'
  | 'tga'
  | 'reverse-repo'
  | 'bank-reserves'
  | 'repo-stress'
  | 'net-liquidity'
  | 'stress-stlfsi'
  | 'nfci'
  | 'vix'
  | 'bank-stress'
  | 'ebp'
  | 'ofr-fsi'
  | 'sloos-ci-tightening'
  | 'term-premium-10y'
  | 'shiller-cape'
  | 'shiller-ecy'
  | 'sp500-breadth-ratio';

/** One tier card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface UsaCardEntry {
  id: UsaCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One tier's cards in placement order, straight off the projection (the S7
 * worldRiskCards pattern: the readings arrive already in placement order —
 * the projection is built from `pageReadingIds` — this only joins them).
 */
export function usaCards(readings: readonly IndicatorReading[], ids: readonly IndicatorId[]): UsaCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as UsaCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 72 USA ids (S9's 26 + S10's 46), restated here so the lean USA chunk
 * does not pull the config module chain (the S3 GlobalBoard / S5
 * GOLD_DISPLAY / S7 WORLD_RISK_DISPLAY pattern). The decimals/units/
 * scales/ranges are pinned against config/display.ts by usa-tiles.test.ts
 * — and the VALUE RENDER is pinned against `formatReadingValue`
 * output-for-output over every id × both locales × both range shapes (a
 * stronger pin than a table echo: the restated join can never drift from
 * the legacy renderer).
 * ------------------------------------------------------------------ */

export type UsaUnitToken =
  | 'percent'
  | 'points'
  | 'ratio'
  | 'usd-tr'
  | 'usd-bn'
  // S10: the tier 3–5 word units (the corpus's own — 'index', the
  // claims count word, the permits/openings magnitude words).
  | 'index'
  | 'claims'
  | 'permits'
  | 'openings';

export interface UsaCardDisplayConfig {
  decimals: number;
  unit: UsaUnitToken;
  /** Multiplicative display scale (the DISPLAY registry's own — e.g. the
   *  deficit's raw millions → billions/trillions). */
  scale?: number;
  /** I15 fed-target: render the true published bounds (or the 25bp
   *  corridor fallback for old payloads without rangeLow/rangeHigh). */
  range?: boolean;
}

export const USA_CARD_DISPLAY: Readonly<Record<UsaCardId, UsaCardDisplayConfig>> = {
  // ---- Tiers 1–2 (S9) ----
  'fed-target': { decimals: 2, unit: 'percent', range: true },
  'fed-expectations': { decimals: 2, unit: 'points' },
  'us-cpi-yoy': { decimals: 1, unit: 'percent' },
  'us-pce-core-yoy': { decimals: 1, unit: 'percent' },
  'us-nfp': { decimals: 0, unit: 'points' },
  'us-unemployment': { decimals: 1, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  'yield-curve-10y3m': { decimals: 2, unit: 'points' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  'real-yield-5y': { decimals: 2, unit: 'percent' },
  'real-curve-10y5y': { decimals: 2, unit: 'points' },
  us30y: { decimals: 2, unit: 'percent' },
  'us-2y': { decimals: 2, unit: 'percent' },
  sofr: { decimals: 2, unit: 'percent' },
  'mortgage-30y': { decimals: 2, unit: 'percent' },
  'nyfed-custody': { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'us-deficit-monthly': { decimals: 1, unit: 'usd-bn', scale: 1e-3 },
  'us-deficit-12m': { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'treasury-auction-10y': { decimals: 2, unit: 'ratio' },
  'treasury-auction-10y-indirect': { decimals: 1, unit: 'percent' },
  'treasury-auction-30y': { decimals: 2, unit: 'ratio' },
  'treasury-auction-30y-indirect': { decimals: 1, unit: 'percent' },
  'rstar-us': { decimals: 2, unit: 'percent' },
  'debt-to-gdp': { decimals: 1, unit: 'percent' },
  'govt-interest-revenue': { decimals: 1, unit: 'percent' },
  // ---- Tier 3 — inflation (S10; the DISPLAY registry's own values) ----
  'us-cpi-core-yoy': { decimals: 1, unit: 'percent' },
  'median-cpi': { decimals: 1, unit: 'percent' },
  'sticky-cpi': { decimals: 1, unit: 'percent' },
  'us-wages': { decimals: 1, unit: 'percent' },
  t5yie: { decimals: 2, unit: 'percent' },
  'breakeven-5y5y': { decimals: 2, unit: 'percent' },
  'breakeven-10y': { decimals: 2, unit: 'percent' },
  'breakeven-tilt': { decimals: 2, unit: 'points' },
  'cpi-nowcast': { decimals: 2, unit: 'percent' },
  'cpi-surprise': { decimals: 2, unit: 'points' },
  'michigan-5y-expectations': { decimals: 1, unit: 'percent' },
  'michigan-1y-expectations': { decimals: 1, unit: 'percent' },
  // ---- Tier 4 — labor & growth ----
  'initial-jobless-claims': { decimals: 0, unit: 'claims' },
  'continuing-claims': { decimals: 0, unit: 'claims' },
  'job-openings': { decimals: 2, unit: 'openings', scale: 0.001 },
  'sahm-rule': { decimals: 2, unit: 'points' },
  'recession-probability': { decimals: 0, unit: 'percent', scale: 100 },
  'michigan-sentiment': { decimals: 1, unit: 'index' },
  'oecd-cli-us': { decimals: 1, unit: 'index' },
  'philly-fed': { decimals: 1, unit: 'points' },
  'empire-state': { decimals: 1, unit: 'index' },
  cfnai: { decimals: 2, unit: 'index' },
  gdpnow: { decimals: 1, unit: 'percent' },
  'us-gdp-growth': { decimals: 1, unit: 'percent' },
  'retail-sales': { decimals: 1, unit: 'usd-bn', scale: 0.001 },
  'housing-permits': { decimals: 2, unit: 'permits', scale: 0.001 },
  'epu-us': { decimals: 1, unit: 'index' },
  'tpu-us': { decimals: 1, unit: 'index' },
  'm2-us': { decimals: 1, unit: 'usd-tr', scale: 0.001 },
  // ---- Tier 5 — liquidity, stress & valuation ----
  walcl: { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  tga: { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'reverse-repo': { decimals: 2, unit: 'usd-bn' },
  'bank-reserves': { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'repo-stress': { decimals: 2, unit: 'percent' },
  'net-liquidity': { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'stress-stlfsi': { decimals: 2, unit: 'index' },
  nfci: { decimals: 2, unit: 'index' },
  vix: { decimals: 2, unit: 'index' },
  'bank-stress': { decimals: 2, unit: 'percent' },
  ebp: { decimals: 2, unit: 'percent' },
  'ofr-fsi': { decimals: 2, unit: 'index' },
  'sloos-ci-tightening': { decimals: 1, unit: 'index' },
  'term-premium-10y': { decimals: 2, unit: 'percent' },
  'shiller-cape': { decimals: 2, unit: 'ratio' },
  'shiller-ecy': { decimals: 2, unit: 'percent' },
  'sp500-breadth-ratio': { decimals: 4, unit: 'ratio' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by usa-copy-pin.test.ts). S10 adds the four
 *  tier 3–5 word units (index · claims · permits · openings). */
export interface UsaUnitLabels {
  percent: string;
  points: string;
  ratio: string;
  usd: string;
  'usd-tr': string;
  'usd-bn': string;
  index: string;
  claims: string;
  permits: string;
  openings: string;
}

/** The Fed target corridor's half-width (the FOMC's 25bp since 2008 —
 *  display.ts's own constant, restated lean; the equivalence pin against
 *  `formatReadingValue` keeps the two from drifting). */
const FED_CORRIDOR_HALF = 0.125;

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean (the
 *  indicatorValueParts + formatIndicatorValue join): percent binds tight
 *  ('5.31%' / '۵٫۳۱٪'), word units suffix with a space ('0.48 pts'), the
 *  trillion family prefixes the currency and suffixes the magnitude word in
 *  EN ('US$3.45 trillion') while fa keeps its suffix form, the billion
 *  family renders 'US$84.9bn' in EN, and fed-target renders the true
 *  published corridor ('3.75–4.00%') with the 25bp fallback for old
 *  payloads. null = the reading is absent or carries no value (the honest
 *  unavailable word, never a guess).
 */
export function usaCardValueText(
  id: UsaCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: UsaUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = USA_CARD_DISPLAY[id];
  const num = formatNumber(reading.value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;

  if (cfg.range === true) {
    // Step-1 audit item A1: prefer the TRUE published bounds (DFEDTARL/U);
    // the 25bp-corridor fallback only renders for old payloads.
    if (reading.rangeLow !== undefined && reading.rangeHigh !== undefined) {
      const lo = formatNumber(reading.rangeLow, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      const hi = formatNumber(reading.rangeHigh, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      return `${lo}–${hi}${unit}`;
    }
    const lo = formatNumber(reading.value - FED_CORRIDOR_HALF, numberLocale, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });
    return `${lo}–${num}${unit}`;
  }

  if (cfg.unit === 'percent') return `${num}${unit}`; // '5.31%' / '۵٫۳۱٪' — binds tight, both locales.
  if (cfg.unit === 'usd-tr') {
    // Step-1 C7: "US$3.45 trillion" — EN prefixes the currency and
    // suffixes the magnitude word; fa keeps its suffix-only form.
    return numberLocale === 'en-US' ? `${units.usd}${num} ${unit}` : `${num} ${unit}`;
  }
  if (cfg.unit === 'usd-bn') {
    // M6 Wave 3: "US$84.9bn" in EN (prefix + tight magnitude word); fa
    // keeps its suffix form ('۸۴٫۹ میلیارد').
    return numberLocale === 'en-US' ? `${units.usd}${num}${unit}` : `${num} ${unit}`;
  }
  return `${num} ${unit}`; // '0.48 pts' / '2.63 ratio' — the word units.
}
