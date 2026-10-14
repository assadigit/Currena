/**
 * World currencies — the analysis engine (spec §6).
 *
 * Since the Phase 3 split this module is the PUBLIC BARREL of the engine:
 * the implementation lives in cohesive domain modules and everything is
 * re-exported unchanged so every importer (job.ts, run.ts, store.ts,
 * index.ts, the tests) keeps its existing surface:
 *
 *   maths.ts        — rounding + percent helpers
 *   pairs.ts        — pair derivation, the four period changes, move_rank
 *   weekly.ts       — weekly series, the shared week grid, pattern check
 *   entries.ts      — pair + dollar entry builders (V6, V7, D-06 basket)
 *   cross-inputs.ts — the typed rule-input bundle from the other sections
 *   rules.ts        — the seven rules (§6.3) + downgrade + progress
 *   summary.ts      — section summary, v1.3 plain helpers, snapshot assembly
 *   content.ts      — write-only-if-changed gate + V2/V3/V5 validation
 *
 * Everything here is PURE: provider answers and cross-section inputs go
 * in, a snapshot comes out. No fetch, no clock (dates arrive as
 * parameters), no KV — the fetch orchestration lives in job.ts, storage in
 * store.ts. This is what keeps the whole section testable and the Worker
 * thin (CPU stays far under the free-plan limit).
 */

export { pctChange } from './maths';
export { changesOf, moveRankOf, pairRateFromUsd, pairSeriesFromQuotes } from './pairs';
export { fxWeeklySeries, patternCheck, rebaseTo100, weekGrid } from './weekly';
export { buildDollarMeasure, buildFxPairEntry } from './entries';
export { goldInputFromHistory, stockInputsFromMarkets } from './cross-inputs';
export type { FxGoldInput, FxRuleInputs, FxStockInputs } from './cross-inputs';
export { evaluateFxRules } from './rules';
export { buildFxPlain, buildFxSnapshot, reStaleFxSnapshot, summarizeFxRules } from './summary';
export { fxContentEqual, fxContentHash, ratesAgree, suspiciousDayMove } from './content';
