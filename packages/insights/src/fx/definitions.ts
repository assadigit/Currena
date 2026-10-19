/**
 * World currencies — the pair table + every tunable number
 * (insights-world-currencies-spec.md §2, §3, §5, §6.3).
 *
 * CONFIG FIRST: the block immediately below is the ONE place the owner can
 * change thresholds, provider endpoints or a pair's codes without touching
 * any logic below it. Everything else in this module tree reads these
 * constants — no magic numbers anywhere else.
 *
 * Platform-free (AGENTS.md rule 2): pure data, no fetch, no clock, no
 * node:* — imported identically by the currena-markets Worker (the fx job
 * rides its two cron triggers: the account's 5-cron free limit is full,
 * spec §4.4's fallback), the runner scripts, the SPA and unit tests.
 */

import type { FxPairId, FxRuleId, FxCurrency } from '@currena/core';
import { WEEKLY_EPOCH_BASE_DAY } from '../markets/definitions';

// Re-exported for the compute module (the engine's rate maps key on it).
export type { FxCurrency } from '@currena/core';

/* ------------------------------------------------------------------ *
 * CONFIG BLOCK — owner-editable settings (spec §6.3's block, verbatim
 * numbers; the D3 decision: starting values, tuned after the evidence
 * run — Ali approves the final numbers)
 * ------------------------------------------------------------------ */

// ---- CONFIGURATION (World currencies) ----
/** The 7 in-scope currencies (spec §2); USD is the base, the other 6 ride
 * the provider answers. CAD and SEK join the provider call only because
 * the EXISTING Currena dollar basket (basket.ts, reused exactly — D-06)
 * needs them. */
export const FX_CURRENCIES: readonly FxCurrency[] = ['EUR', 'JPY', 'GBP', 'CHF', 'CNY', 'AUD'];
/** Extra currencies the reused dollar basket needs (basket.ts weights). */
export const FX_BASKET_CURRENCIES: readonly ('CAD' | 'SEK')[] = ['CAD', 'SEK'];
/** History window asked from providers: ~400 days back (spec §4.1). */
export const FX_HISTORY_DAYS = 400;
/** V4: every fx currency must carry at least this many daily points. */
export const FX_MIN_POINTS = 200;
/** V3: a one-day move of this size (percent) is suspicious. */
export const FX_MAX_DAY_MOVE_PCT = 5;
/** V3/V5: the two providers must agree within this percent. */
export const FX_PROVIDER_AGREEMENT_PCT = 0.5;
/** V6: asOf older than this many calendar days marks the row stale. */
export const FX_STALE_DAYS = 5;
/** The move_rank percentile that earns the "Unusually large move" tag (§6.2). */
export const BIG_MOVE_PERCENTILE = 90;
/** Weekly series length stored per pair (spec §5 rule 5). */
export const FX_WEEKLY_POINTS = 52;
/** Chart lines: 26 weekly points, rebased to 100 (spec §9.3 Level 2). */
export const FX_CHART_POINTS = 26;

// Rule thresholds (§6.3 — starting values, all "M1" = 1-month change in
// percent, "M3" = 3-month change)
export const R1_AUDJPY_M1_WARN = -3.0;
export const R1_SP500_M1_WARN = -2.0;
export const R1_AUDJPY_M1_OK = 2.0;
export const R1_SP500_M1_OK = 0.0;
export const R1_CONFIRM_EURJPY_M1 = -3.0;
export const R2_USDJPY_M1_WARN = -4.0;
export const R2_NIKKEI_M1_WARN = -3.0;
export const R2_USDJPY_M3_PRESSURE = 6.0;
export const R3_DOLLAR_M3_STRONG = 4.0;
export const R3_DOLLAR_M3_WEAK = -4.0;
/** v1.3 (change request §3.1): R3's FAST leg — a sharp one-month move fires
 * the rule without waiting for the three-month line (B8: a calm verdict on
 * the dollar's biggest one-month gain in a year read as an error). Starting
 * values; tuned only by the evidence-run rule in the main spec. */
export const R3_DOLLAR_M1_STRONG = 3.0;
export const R3_DOLLAR_M1_WEAK = -3.0;
export const R4_DOLLAR_M1_UP = 2.0;
export const R4_SP500_M1_DOWN = -3.0;
export const R4_DOLLAR_M1_DOWN = -2.0;
export const R4_GOLD_M1_UP = 3.0;
export const R5_USDCNY_M3_WEAK = 2.0;
export const R5_AUDUSD_M3_FALL = -2.0;
export const R5_USDCNY_M3_FIRM = -1.5;
export const R5_AUDUSD_M3_RISE = 2.0;
export const R6_EURCHF_M1_WARN = -2.0;
export const R6_EUROSTOXX_M1_WARN = -2.0;
export const R7_EURUSD_M1_MOVE = 2.5;
export const R7_DOLLAR_FOLLOWS = 1.5;
/** R7's euro-led boundary (the dollar moved less than this) — spec §6.3 R7. */
export const R7_DOLLAR_QUIET = 1.0;

/** Pattern check window (§6.4). */
export const PATTERN_WEEKS = 13;
export const PATTERN_HOLDING_MIN = 9;
export const PATTERN_MIXED_MIN = 7;

/** Section signal (§6.5). */
export const VERDICT_ATTENTION_COUNT = 1;
export const VERDICT_UNUSUAL_COUNT = 3;
// -------------------------------------------

/** Frankfurter's frozen ECB-only v1 API (spec §4.2 — pin the version). */
export const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1';
/** Yahoo Finance chart endpoint (unofficial, keyless fallback). */
export const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
/** User-Agent for Yahoo (v3 F-09/T-25): the declared honest identity. A
 *  refusal means BLOCKED — fail closed; never a browser identity. */
export const YAHOO_USER_AGENT = 'CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)';

/** The one KV key the whole section is stored under (spec §5 rule 1). */
export const FX_KV_KEY = 'insights:fx:v1';

/* ------------------------------------------------------------------ *
 * The 10 pairs (spec §3.1) — crosses are code, never a provider call
 * ------------------------------------------------------------------ */

/** The three table groups (spec §3.1 + §10.2 render order). */
export type FxGroupId = 'dollarWorld' | 'warningLights' | 'chinaLink';

export interface FxPairDefinition {
  id: FxPairId;
  group: FxGroupId;
  /**
   * How the pair's rate comes out of the USD-side rates (spec §3.1 + §4.1
   * rule 4): `direct` = the currency's own USD-side rate (quote per 1 USD);
   * `inverse` = 1 ÷ that rate; `cross` = quote-side ÷ base-side (computed
   * where both legs spoke — see compute.ts).
   */
  derivation: 'direct' | 'inverse' | 'cross';
}

/** Fixed for v1 (spec §3.1, order = the spec table's order). */
export const FX_PAIRS: readonly FxPairDefinition[] = [
  { id: 'eurusd', group: 'dollarWorld', derivation: 'inverse' },
  { id: 'usdjpy', group: 'dollarWorld', derivation: 'direct' },
  { id: 'gbpusd', group: 'dollarWorld', derivation: 'inverse' },
  { id: 'usdchf', group: 'dollarWorld', derivation: 'direct' },
  { id: 'usdcny', group: 'dollarWorld', derivation: 'direct' },
  { id: 'audusd', group: 'dollarWorld', derivation: 'inverse' },
  { id: 'audjpy', group: 'warningLights', derivation: 'cross' },
  { id: 'eurjpy', group: 'warningLights', derivation: 'cross' },
  { id: 'eurchf', group: 'warningLights', derivation: 'cross' },
  { id: 'audcny', group: 'chinaLink', derivation: 'cross' },
];

/** All pair ids in spec-table order. */
export const FX_PAIR_IDS: readonly FxPairId[] = FX_PAIRS.map((p) => p.id);

const PAIR_BY_ID = new Map(FX_PAIRS.map((p) => [p.id as string, p]));

/** Definition lookup — throws on unknown id (a typo must never render). */
export function fxPairDefinition(id: FxPairId): FxPairDefinition {
  const def = PAIR_BY_ID.get(id);
  if (def === undefined) throw new Error(`[fx] unknown pair id ${JSON.stringify(id)}`);
  return def;
}

/** Group render order (spec §3.1: Dollar vs the world · Warning lights · Australia–China). */
export const FX_GROUP_ORDER: readonly FxGroupId[] = ['dollarWorld', 'warningLights', 'chinaLink'];

/* ------------------------------------------------------------------ *
 * The seven rules (spec §6.3 + §6.4's pattern table)
 * ------------------------------------------------------------------ */

export type FxExpectation = 'together' | 'opposite';

export interface FxRuleDefinition {
  id: FxRuleId;
  /**
   * The chart/pattern series registry keys (compute.ts's seriesMapOf): a
   * pair id, `dollar`, `gold`, `sp500`, `n225` or `stoxx50`. R4 rides three
   * (spec §9.3: "R4 can show three").
   */
  chartSeries: readonly string[];
  /** What the pattern expects the two series to do (§6.4). */
  expect: FxExpectation;
  /** Whether §6.4's 13-week health check applies (R4 and R7 have none). */
  hasPatternCheck: boolean;
}

/** The rules in spec order (§6.3's table). */
export const FX_RULES: readonly FxRuleDefinition[] = [
  { id: 'r1_risk_mood', chartSeries: ['audjpy', 'sp500'], expect: 'together', hasPatternCheck: true },
  { id: 'r2_carry_trade', chartSeries: ['usdjpy', 'n225'], expect: 'together', hasPatternCheck: true },
  { id: 'r3_dollar_strength', chartSeries: ['dollar', 'gold'], expect: 'opposite', hasPatternCheck: true },
  { id: 'r4_money_hiding', chartSeries: ['sp500', 'dollar', 'gold'], expect: 'opposite', hasPatternCheck: false },
  { id: 'r5_china_link', chartSeries: ['audusd', 'usdcny'], expect: 'opposite', hasPatternCheck: true },
  { id: 'r6_europe_worry', chartSeries: ['eurchf', 'stoxx50'], expect: 'together', hasPatternCheck: true },
  { id: 'r7_dollar_or_euro', chartSeries: ['eurusd', 'dollar'], expect: 'opposite', hasPatternCheck: false },
];

const RULE_BY_ID = new Map(FX_RULES.map((r) => [r.id as string, r]));

/** Rule lookup — throws on unknown id. */
export function fxRuleDefinition(id: FxRuleId): FxRuleDefinition {
  const def = RULE_BY_ID.get(id);
  if (def === undefined) throw new Error(`[fx] unknown rule id ${JSON.stringify(id)}`);
  return def;
}

/**
 * Whether the §6.4 pattern check (the 13 dots) applies to a rule. v1.3 fix
 * B3: rules WITHOUT a pattern check (R4, R7) show no dots, no "Held in"
 * line and no end labels — "Held in 0 of the last 13 weeks" on a rule with
 * no check reads as a failure.
 */
export function fxRuleHasPatternCheck(id: FxRuleId): boolean {
  return fxRuleDefinition(id).hasPatternCheck;
}

/**
 * v1.3 (CR §3.2): the |M1| size that makes the dollar measure or a pair a
 * "big mover" for the Normal-with-a-big-mover headline. A pair also counts
 * when its stored `bigMove` flag is true (§6.2's 90th-percentile tag).
 */
export const FX_BIG_MOVE_M1_PCT = 3.0;

// Re-exported for the compute module's delta-decoding (one base day for the
// whole page — the markets section's).
export { WEEKLY_EPOCH_BASE_DAY };
