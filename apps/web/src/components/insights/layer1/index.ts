/**
 * Layer 1 — plain-language copy accessors
 * (docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md §5).
 *
 * The Layer-1 copy lives as a new top-level `layer1` object on the existing
 * `insights-copy-{en,fa}.ts` dictionaries (decision D-01). These accessors
 * are the typed contract Layer 2 (a later, AI-driven live-state explainer)
 * will import. NO AI runs here — the copy is static and bundled.
 *
 * `getIndicatorCopy(id, lang)` returns ONLY the NEW Layer-1 fields
 * (`plainName`, `oneLine`, `ifRising`, `ifFalling`, `connections`,
 * `australiaAngle?`, `glossaryTerms`) for an id, or `undefined` if no
 * entry has been written yet (graceful during the batched roll-out). The
 * approved `whatItIs` / `whyItMatters` are NOT duplicated here — they are
 * reused from the existing `copy.indicators[id]` (decision D-02); a
 * consumer reads them from the existing copy structure that matches the
 * surface (indicator card, market tile, FX pair).
 *
 * Zero KV operations, zero external calls (spec §5 + G10).
 */

import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';
import type {
  Layer1Entry,
  Layer1GlossaryEntry,
  Layer1Ui,
} from '../../../i18n/insights-copy-en';

export type Layer1Lang = 'en' | 'fa';
export type { Layer1Entry, Layer1Connection, Layer1GlossaryEntry, Layer1Ui } from '../../../i18n/insights-copy-en';

/** The Layer-1 entry for one indicator id, or undefined if not yet written. */
export function getIndicatorCopy(id: string, lang: Layer1Lang): Layer1Entry | undefined {
  const copy = lang === 'fa' ? insightsCopyFa : insightsCopyEn;
  return copy.layer1.indicators[id as keyof typeof copy.layer1.indicators];
}

/** The whole glossary for a language, keyed by term id. */
export function getGlossary(lang: Layer1Lang): Record<string, Layer1GlossaryEntry> {
  const copy = lang === 'fa' ? insightsCopyFa : insightsCopyEn;
  return copy.layer1.glossary;
}

/** One glossary term, or undefined. */
export function getGlossaryTerm(termId: string, lang: Layer1Lang): Layer1GlossaryEntry | undefined {
  return getGlossary(lang)[termId];
}

/** The Layer-1 UI labels for the expanded panel block. */
export function getLayer1Ui(lang: Layer1Lang): Layer1Ui {
  const copy = lang === 'fa' ? insightsCopyFa : insightsCopyEn;
  return copy.layer1.ui;
}

/** The ids that currently have Layer-1 copy (drives G1's advisory completeness list). */
export const LAYER1_INDICATOR_IDS: readonly string[] = Object.keys(insightsCopyEn.layer1.indicators);

/** The glossary term ids currently defined. */
export const LAYER1_GLOSSARY_IDS: readonly string[] = Object.keys(insightsCopyEn.layer1.glossary);

/**
 * The FULL inventory the validator (G1) checks against — every indicator id
 * found in code (111 indicators + 16 markets + 10 FX pairs + 7 FX patterns =
 * 144). Sourced from the code definitions (see INVENTORY.md); kept in this
 * module so the validator and any Layer-2 caller share one list. When an id
 * is added/removed in the code, this list MUST move with it (G1 fails
 * otherwise — by design).
 */
export const LAYER1_INVENTORY_IDS: readonly string[] = [
  // ----- 111 indicators (packages/insights/src/definitions.ts) -----
  'yield-curve-10y2y', 'yield-curve-10y3m', 'real-yield-10y', 'us10y', 'us30y', 'fed-target',
  'ecb-dfr', 'fed-expectations', 'govt-interest-revenue', 'us-2y', 'sofr',
  'mortgage-30y', 'jgb-10y', 'bund-10y', 'gilt-10y', 'euro-aaa-10y', 'boe-rate',
  'boj-rate', 'dollar-basket', 'usdjpy', 'us-japan-10y-gap', 'eur-usd', 'usdtry',
  // 2026-10-29 owner round ("add dollar against UAE currency") → 101.
  'usdaed',
  'us-unemployment', 'sahm-rule', 'china-pmi', 'china-cpi', 'copper-gold',
  'michigan-sentiment', 'initial-jobless-claims', 'philly-fed', 'recession-probability',
  'oecd-cli-us', 'm2-us', 'retail-sales', 'housing-permits', 'job-openings',
  'us-gdp-growth', 'us-nfp', 'usdcny', 'michigan-1y-expectations', 'cfnai',
  'oecd-cli-cn', 'oecd-cli-de', 'epu-us', 'copper-usd', 'stress-stlfsi', 'nfci',
  'vix', 'gold-silver', 'cftc-gold-positioning', 'walcl', 'crypto-fng', 'shiller-cape',
  'shiller-ecy', 'gpr-index', 'brent', 'gold-usd', 'silver-usd', 'btc-usd', 'gold-btc',
  'us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp', 'breakeven-5y5y', 'us-cpi-core-yoy',
  'us-wages', 'breakeven-10y', 't5yie', 'wti', 'natgas', 'eia-crude-stocks', 'platinum',
  'gold-oil-ratio', 'food-index', 'wheat', 'maize', 'au-cpi', 'au-trimmed-mean', 'au-10y',
  'rba-expectations', 'au-us-10y-gap', 'au-petrol-yoy', 'rba-cash-rate', 'au-home-loan',
  'au-deposit-rate', 'au-wage-growth', 'au-rent-yoy', 'au-unemployment', 'au-home-values',
  'au-household-debt-arrears', 'au-housing-finance', 'au-saving-ratio', 'au-job-vacancies',
  'audusd', 'rba-fed-gap', 'audjpy', 'terms-of-trade', 'iron-ore', 'gold-aud',
  // Session 3 (GOLD_FRED_GAPFILL_SPEC G2, 2026-10-31): the breakeven
  // interplay context card → 102.
  'breakeven-tilt',
  // gap-closure S2-M2.4 (2026-10-31): the weekly custody card → 103.
  'nyfed-custody',
  // gap-closure S3-M3.2 (2026-11-01): the US liquidity/funding family → 109.
  'term-premium-10y',
  'tga',
  'reverse-repo',
  'bank-reserves',
  'repo-stress',
  'net-liquidity',
  // gap-closure S3-M3.3 (2026-11-01): the credit pair → 111.
  'ebp',
  'ofr-fsi',
  // gap-closure S3-M3.4 (2026-11-01): the growth-nowcast and survey
  // family → 117.
  'gdpnow',
  'empire-state',
  'continuing-claims',
  'median-cpi',
  'sticky-cpi',
  'sloos-ci-tightening',
  // gap-closure S3-M3.5 (2026-11-01): the fiscal and Treasury-supply
  // family → 123 (us-deficit-monthly + the two auction indirect shares
  // are companion-only ids — they still carry layer-1 copy, the
  // michigan-1y-expectations precedent).
  'us-deficit-12m',
  'us-deficit-monthly',
  'treasury-auction-10y',
  'treasury-auction-10y-indirect',
  'treasury-auction-30y',
  'treasury-auction-30y-indirect',
  // ----- 16 markets (packages/insights/src/markets/definitions.ts) -----
  'n225', 'asx200', 'kospi', 'hsi', 'ssec', 'taiex', 'nifty50', 'stoxx50', 'dax',
  'cac', 'ftse', 'sp500', 'ndx', 'dow', 'tsx', 'ibov',
  // ----- 10 FX pairs + 7 patterns (packages/insights/src/fx/definitions.ts) -----
  'eurusd', 'usdjpy', 'gbpusd', 'usdchf', 'usdcny', 'audusd', 'audjpy', 'eurjpy',
  'eurchf', 'audcny', 'r1_risk_mood', 'r2_carry_trade', 'r3_dollar_strength',
  'r4_money_hiding', 'r5_china_link', 'r6_europe_worry', 'r7_dollar_or_euro',
];
