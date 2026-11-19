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
 *   - gold-balance.ts — the consolidated balance engine (specs/gold-
 *                      balance-consolidation/ 02 §2–§3): 21 frozen voters
 *                      → 4 lane votes → one balance; additive, the frozen
 *                      engine untouched (D-GB-9).
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
} from './shared/series';
export type { SeriesPoint } from './shared/series';

export {
  parseAbsPeriodCsv,
  parseAbsSdmxCsv,
  parseEcbDfrCsv,
  parseRbaTableCsv,
  parseFrankfurterTimeseries,
  parseFredCsv,
  parseWorldBankMonthlyCsv,
} from './shared/parsers';
export type { RbaParseOptions } from './shared/parsers';

export { DEFINITIONS } from './shared/definitions';

export {
  BASKET_CURRENCIES,
  BASKET_SCALING_CONSTANT,
  BASKET_WEIGHTS,
  computeBasketValue,
} from './domains/currencies/basket';

export {
  GAUGES,
  gaugeReading,
  gaugesForSection,
  isShadowGauge,
  labelForVerdictStep,
  sectionVerdictStep,
  summarizeByGauges,
  summarizeSectionByGauges,
} from './shared/gauges';
export type { GaugeDef, GaugeReading } from './shared/gauges';

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
} from './shared/scoring';
export type { AuxSeries, ReadingSource, RuleVerdict } from './shared/scoring';

export {
  CONNECTIONS,
  evalConnectionLeg,
  evalLeg,
  evaluateConnection,
  evaluateConnections,
  PASS_THROUGH_WINDOW_DAYS,
} from './shared/connections';
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
} from './shared/connections';

export { evaluateSignal, evaluateSignals, LEAN_STRONG } from './domains/gold/signals';
export type {
  SignalConditionKey,
  SignalConditionReading,
  SignalConditionState,
  SignalLean,
  SignalMetal,
  SignalReading,
} from './domains/gold/signals';

// The Gold Program (docs/insights/GOLD_SCORE_SPEC.md): the directional
// re-cut of the gauge voters for gold — S1's pure engine, frozen (D-GB-9).
// OI-3/GB-S7 (2026-11-04, the owner's recorded approval): goldSummaryOf's
// compact output no longer rides the snapshot wire — the exports stay as
// the engine's own contract (gold-score.test.ts round-trips them; the
// backtest harness re-derives through the same functions). The PANEL COPY
// lives in the web i18n dictionaries since the S2.1 bilingual round (see
// gold-score.ts's header note) — this package exports pure logic only.
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
} from './shared/gold-score';
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
} from './shared/gold-score';

// The gold balance consolidation (docs/specs/gold-balance-consolidation/):
// the P1 pure engine — 21 frozen voters → 4 lane votes → one balance
// (02-ENGINE-AND-DECISION-TABLE.md §2–§3). Additive beside the frozen
// Gold Program engine above (D-GB-9): same voter table, same shared
// evaluator, one rule per indicator; the equivalence with the P0
// calibration harness measurement is pinned by gold-balance.test.ts.
// The web app does not import this yet (rollout P2+ gates the UI behind
// ?balance=lanes); zero fetches, zero KV, zero wire fields.
export {
  GOLD_LANE_MIN_FIRING,
  GOLD_LANE_STRONG,
  goldBalance,
} from './domains/gold/gold-balance';
export type {
  GoldBalanceLane,
  GoldBalanceMember,
  GoldBalanceReading,
  GoldBalanceSide,
} from './domains/gold/gold-balance';

// GPE R11 / F1 (docs/specs/gold-page-elevation s7/03 §2): the daily
// narrative's pure engine — "Why gold moved", the driver-family story over
// the SAME balance the hero reads (one projection, one truth; the grammar
// pinned by narrative.test.ts).
export {
  NARRATIVE_GRAMMAR_VERSION,
  NARRATIVE_MAX_MOVERS,
  goldNarrative,
} from './domains/gold/narrative';
export type {
  GoldNarrative,
  NarrativeFamily,
  NarrativeMover,
  NarrativePriceFact,
} from './domains/gold/narrative';

// GPE R12 / F5 (s7/01 §4, Chain 3): the yield-decomposition card's pure
// math — nominal 10y · real 10y · the derived breakeven · the ACM term
// premium, with the exact sum (real + breakeven = nominal) and the
// model-provenance disclosure on the term-premium leg.
export { yieldDecomposition } from './domains/gold/yield-decomposition';
export type { YieldDecomposition, YieldLeg, YieldLegId } from './domains/gold/yield-decomposition';

// GPE R19 / F8 (docs/specs/gold-page-elevation s1/13 §2–§3 · s6/02 C5 ·
// s6/03 zone H): the minimal TA band's pure computation — SMA
// 20/50/100/200, the distance-from-200DMA decile (the meter's own
// percentile grammar over the stored basis — S13-D1's honest window),
// the dated 50/200 cross events (whipsaws included), and the classic
// daily/weekly pivots. Display-only — nothing here joins the voter
// table (C5 rule 4). The input is the R18 OHLC leg's snapshot
// (GET /api/insights/gold-ohlc).
export {
  TA_DECILE_MIN_BASE,
  TA_WINDOWS,
  classicDailyPivots,
  classicWeeklyPivots,
  crossEvents,
  distanceFromSma200,
  previousWeekBars,
  smaRows,
  smaSeries,
} from './domains/gold/ta-levels';
export type {
  TaCross,
  TaDistance,
  TaPivotSet,
  TaSmaPoint,
  TaSmaRow,
  TaWindow,
} from './domains/gold/ta-levels';

// GPE R13 / F3a (docs/specs/gold-page-elevation s1/11 §5 · s6/02 C2 ·
// s7/01 §8): the Iran bridge's pure premium engine — the documented,
// reproducible حباب (coin premium over melt) over ONE coherent TGJU
// snapshot, with the CBI-primary constants table (the gerami band, the
// mesghal آبشده convention). The frozen 2026-11-18 live scenario is
// pinned by coin-premium.test.ts.
export {
  COIN_SPECS,
  GERAMI_BAND,
  TROY_OZ_GRAMS,
  coinPremium,
} from './domains/gold/coin-premium';
export type { BridgeCoinId, CoinPremium, CoinPremiumRow, CoinSpec } from './domains/gold/coin-premium';

// GPE R22 / F11 (docs/specs/gold-page-elevation s7/01 §3 in full ·
// s7/03 §4.2 the pre-registered-window registry · s8/01 R22): the
// correlation companion's PURE computation — the Friday-close sampling,
// the 52-week rolling Pearson over levels, the trailing-10y display
// cap, and the fail-closed staleness rules. The scatter stays rejected
// (s7/01 §3); display-only — nothing here joins the voter table. The
// inputs are the R18 OHLC leg + the existing real-yield-10y history.
export {
  CORRELATION_DISPLAY_DAYS,
  CORRELATION_STALE_AFTER_DAYS,
  CORRELATION_WINDOW_WEEKS,
  ROTATION_DATE,
  correlationPanel,
  fridayCloses,
  fridayOf,
  pearson,
  rollingCorrelation,
} from './domains/gold/correlation';
export type {
  CorrelationDailyPoint,
  CorrelationPanel,
  CorrelationStaleness,
  CorrelationStripPoint,
  FridayClose,
} from './domains/gold/correlation';

// GPE R26 / F10 (docs/specs/gold-page-elevation s8/01 R26 · the S14-D1
// native+derived record): the multi-currency gold grid's PURE
// derivations — each cross's 30-day change + decile over its own stored
// basis (the S13-D1 honest window), and the KGX validation sentence's
// verdict inputs (genuine demand vs the dollar story). The fetch/
// store/job halves live behind the "@currena/insights/xau-crosses"
// subpath — the SPA-facing root export stays platform-free.
export {
  CROSS_DECILE_MIN_BASE,
  CROSS_LEGS,
  GOLD_CROSS_IDS,
  crossStats,
  kgxVerdict,
} from './domains/gold/xau-crosses';
export type { CrossLegDef, CrossStats, KgxKind } from './domains/gold/xau-crosses';

// GPE R25 / F6 (docs/specs/gold-page-elevation s8/01 R25 · s7/03 §3 · the
// S15-D4/D6 records): the Episode Explorer's PURE derivations — the
// month arithmetic over the workbook's own monthly-average axis, the
// 1/5/10/20y window returns + the since-episode returns per comparison
// leg (each window named at point of use; a window a leg's depth
// cannot support is null, never guessed), and the per-episode price-
// path slices + extremes. The SPINE ITSELF is drop-gated (the WGC
// prices workbook; the store/job halves live behind the
// "@currena/insights/episodes" subpath) — until the drop lands the
// card renders the honest waiting state, never an interim series.
export {
  EPISODE_WINDOW_YEARS,
  episodePath,
  episodeSeriesViews,
  goldSeriesView,
  monthAdd,
  monthDiff,
  pathExtremes,
  sinceReturn,
  windowReturn,
} from './domains/gold/episodes';
export type { EpisodeSeriesView } from './domains/gold/episodes';

// GPE R30 / F3b (docs/specs/gold-page-elevation s8/01 R30 · s7/01 §8 the
// identity arithmetic's binding copy · the s16 M1 §6 records S16-D1..D5):
// Bridge-2's PURE derivations — the per-coin premium series over the
// stored days, the premium deciles (the page's statistical identity
// applied to حباب: min base 30, the current point excluded, the basis
// window named — the R19 posture), and the exact identity-arithmetic
// attribution strip (Δln(coin) = Δln(ounce) + Δln(USD/IRR) +
// Δln(1+premium) — never GRAM-style regression, disclosed at point of
// use; fails closed on any non-zero residual). The store/job/runner
// halves live behind the "@currena/insights/premium-history" subpath —
// the SPA-facing root export stays platform-free.
export {
  PREMIUM_DECILE_MIN_BASE,
  attributionLegsOfDay,
  attributionLegsOfPremium,
  attributionStrip,
  premiumDeciles,
  premiumSeries,
} from './domains/gold/premium-history';
export type {
  AttributionLegs,
  AttributionStrip,
  PremiumDeciles,
  PremiumSeriesPoint,
} from './domains/gold/premium-history';

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
} from './domains/gold/real-yield-fill';
export type { RealYieldFillResult } from './domains/gold/real-yield-fill';
export { BREAKEVEN_TILT_DEADBAND_PT, breakevenTiltLean } from './domains/gold/breakeven-tilt';
export type { BreakevenTiltLean } from './domains/gold/breakeven-tilt';

export { RULE_VERSION, RULE_CHANGELOG } from './shared/ruleVersion';
export type { RuleChangeLogEntry } from './shared/ruleVersion';

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
} from './shared/freshness';
export type { Freshness, FreshnessInfo } from './shared/freshness';

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
