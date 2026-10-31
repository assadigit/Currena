/**
 * @currena/insights — indicator definitions, scoring engine and fixture
 * parsers for the Insights page. Pure TypeScript, platform-free (AGENTS.md
 * rule 2): no node:*, no DOM, no fetch, no clock reads — every time
 * reference is an explicit parameter.
 *
 * Modules:
 *   - series.ts      — SeriesPoint + date/lookup helpers (binary search).
 *   - parsers.ts     — fixture-format parsers (FRED CSV, Frankfurter JSON,
 *                      World Bank monthly, ABS period, RBA tables) — the
 *                      parse halves of the adapters.
 *   - definitions.ts — the v2 indicator definitions (spec verbatim, I15).
 *   - basket.ts      — the Currena dollar basket math (DXY-style weights).
 *   - gauges.ts      — question gauges: membership, steps, region verdicts,
 *                      summary lines (the flat-share summary's successor).
 *   - scoring.ts     — rule evaluation, readings (incl. move scores),
 *                      changes; per-series freshness overrides.
 *   - connections.ts — the "Together" connection cards (I17, UI spec T1):
 *                      leg leans + the uniform active/partly/inactive/
 *                      disagree/unknown state over snapshot readings.
 *   - signals.ts     — the "What the signals say" cards (I17, UI spec S1–S3):
 *                      five/six-condition checklists + lean, purely
 *                      descriptive, never advice.
 *   - gold-score.ts  — the Gold Program's directional re-cut of the gauge
 *                      voters for gold (GOLD_SCORE_SPEC.md): the tailwind
 *                      score, the four lanes, model-vs-reality, the compact
 *                      snapshot writer + the EN copy blocks.
 */

export {
  addDays,
  assertAscending,
  combineSeries,
  daysBetween,
  epochDay,
  fromEpochDay,
  pointAtOrBefore,
  sliceBetween,
  yoyPctSeries,
} from './series';
export type { SeriesPoint } from './series';

export {
  parseAbsPeriodCsv,
  parseAbsSdmxCsv,
  parseEcbDfrCsv,
  parseRbaTableCsv,
  parseFrankfurterTimeseries,
  parseFredCsv,
  parseWorldBankMonthlyCsv,
} from './parsers';
export type { RbaParseOptions } from './parsers';

export { DEFINITIONS } from './definitions';

export {
  BASKET_CURRENCIES,
  BASKET_SCALING_CONSTANT,
  BASKET_WEIGHTS,
  computeBasketValue,
} from './basket';

export {
  GAUGES,
  gaugeReading,
  gaugesForSection,
  labelForVerdictStep,
  sectionVerdictStep,
  summarizeByGauges,
  summarizeSectionByGauges,
} from './gauges';
export type { GaugeDef, GaugeReading } from './gauges';

export {
  GRACE_DAYS,
  MIN_ABOVE_LOW_OBS,
  MIN_MOVE_OBS,
  MIN_PERCENTILE_OBS,
  PERCENTILE_WINDOW_DAYS,
  YOY_MAX_DAYS_BACK,
  YOY_MIN_DAYS_BACK,
  cadenceUsesPreviousRelease,
  computeReading,
  changedSince,
  evaluateRule,
  moveScoreOf,
  percentileOf,
  staleAfterDaysFor,
} from './scoring';
export type { AuxSeries, ReadingSource, RuleVerdict } from './scoring';

export {
  CONNECTIONS,
  evalConnectionLeg,
  evalLeg,
  evaluateConnection,
  evaluateConnections,
  PASS_THROUGH_WINDOW_DAYS,
} from './connections';
export type {
  ConnectionDef,
  ConnectionId,
  ConnectionLegRule,
  ConnectionReading,
  ConnectionState,
  LegDirection,
  LegEval,
  LegLevel,
  SignalLegEval,
} from './connections';

export { evaluateSignal, evaluateSignals, LEAN_STRONG } from './signals';
export type {
  SignalConditionKey,
  SignalConditionReading,
  SignalConditionState,
  SignalLean,
  SignalMetal,
  SignalReading,
} from './signals';

// The Gold Program (docs/insights/GOLD_SCORE_SPEC.md): the directional
// re-cut of the gauge voters for gold — S1's pure engine, S2's compact
// snapshot writer. The SPA re-derives the full reading (voters included)
// through the SAME functions; only goldSummaryOf's compact output rides
// the KV write. The PANEL COPY lives in the web i18n dictionaries since
// the S2.1 bilingual round (see gold-score.ts's header note) — this
// package exports pure logic only.
export {
  GOLD_LANE_VOTERS,
  GOLD_LANES,
  GOLD_REALITY_SPEED_PCT,
  GOLD_STRONG_MIN_FIRING,
  GOLD_STRONG_SHARE,
  goldSummaryOf,
  goldTailwindScore,
  modelVsReality,
  modelVsRealityExplainerKey,
} from './gold-score';
export type {
  GoldLane,
  GoldLaneVoter,
  GoldModelDirection,
  GoldRealityDirection,
  GoldSubGaugeReading,
  GoldSubGaugeWord,
  GoldTailwindLabel,
  GoldTailwindReading,
  GoldVoter,
  GoldVoterEvidence,
  GoldVoterImpact,
  ModelVsRealityChip,
  ModelVsRealityReading,
} from './gold-score';

// Session 3 (docs/insights/GOLD_FRED_GAPFILL_SPEC.md): the FRED gap-fillers.
// real-yield-fill.ts — the bounded DGS10 − T10YIE cross-fill for the
// real-yield-10y scoring input (decision D-6: fills never reach the stored
// history; the ingest counts them aloud). breakeven-tilt.ts — the G2
// interplay card's pure lean selection for the gold panel's inflation-lane
// context phrase (D-5: context only, never a voter).
export {
  REAL_YIELD_FILL_CAP,
  REAL_YIELD_FILL_NOT_BEFORE,
  realYieldScoringSeries,
} from './real-yield-fill';
export type { RealYieldFillResult } from './real-yield-fill';
export { BREAKEVEN_TILT_DEADBAND_PT, breakevenTiltLean } from './breakeven-tilt';
export type { BreakevenTiltLean } from './breakeven-tilt';

export { RULE_VERSION, RULE_CHANGELOG } from './ruleVersion';
export type { RuleChangeLogEntry } from './ruleVersion';

// Layer-2 prep P1 (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §3) —
// per-reading data freshness for the narrator and the page honesty line.
// Pure, zero I/O; shares the status engine's thresholds so the two
// disciplines can never drift apart (D-20/D-21).
export {
  FRESHNESS_CADENCE_REFINEMENTS,
  FRESHNESS_STALE_DAYS,
  freshnessCadenceOf,
  freshnessOf,
  freshnessOfReading,
  freshnessStaleDaysFor,
} from './freshness';
export type { Freshness, FreshnessInfo } from './freshness';

// R10-3 (2026-10-28) — the global companies table behind a feature flag.
// The config + the adapter STUB ship with the flag OFF; the UI renders
// the empty state, the cron rung is NOT wired, no live calls fire.
// See packages/insights/src/companies/definitions.ts + adapter.ts and
// ROUND10_REPORT.md R10-3 for the flip procedure (one-line change).
export {
  COMPANIES,
  COMPANIES_COUNT,
  COMPANY_EXCHANGE_LABELS,
  COMPANY_EXCHANGES_USED,
  companyByTicker,
} from './companies/definitions';
export type {
  CompanyDefinition,
  CompanyExchangeId,
} from './companies/definitions';
export {
  CompanyEodResponseSchema,
  CompanyEodRowSchema,
  CompanyAdapterError,
  deriveCompanyReading,
  fetchCompanyEod,
  parseCompanyEodResponse,
} from './companies/adapter';
export type {
  CompanyEodRow,
  CompanyFetchOptions,
  CompanyReading,
  CompanySeriesPoint,
} from './companies/adapter';
