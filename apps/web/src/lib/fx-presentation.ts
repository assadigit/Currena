/**
 * World currencies — the pure presentation logic (spec §9.3, §9.10, §10.3):
 * the engine-outcome → status-word/chip mapping, the pattern-card ordering,
 * the quiet area's closest-to-warning choice, the headline templates and
 * the number formatting for the two-part sentences.
 *
 * Since the WS-4 module split this file is the BARREL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim; the public
 * surface is byte-identical, every importer keeps working):
 *
 *   fx-presentation/format.ts     — abs1 / fxSignedPct / threshold1 / whole0
 *   fx-presentation/rules.ts      — §9.3 status table, ordering, quiet area
 *   fx-presentation/headline.ts   — §10.3 headline + §9.10 measure label
 *   fx-presentation/pairs.ts      — §9.3 pairs table + chart/money labels
 *   fx-presentation/sentences.ts  — the §7 two-part sentences
 *   fx-presentation/plain.ts      — the v1.3 plain-language layer (CR §4)
 *
 * PURE and unit-tested (fx-presentation.test.ts, fx-v13.test.ts): a
 * snapshot plus the copy corpus go in, display decisions come out. The
 * component stays thin — this is what keeps the §9 wording rules honest
 * (V1: only Active, Watching, Quiet + the page's chips; nothing invented).
 */

export { fxRuleCopyKey, fxRuleView, fxPatternOrder, fxQuietRules, fxClosestToWarning } from './fx-presentation/rules';
export { fxMeasureKey, fxBigMoverOf, fxHeadline } from './fx-presentation/headline';
export type { FxBigMover } from './fx-presentation/headline';
export { fxPairRows, fxRulePairIds, fxTrendOf, fxChartLineLabel, fxMoneyLine } from './fx-presentation/pairs';
export { fxSentence } from './fx-presentation/sentences';
export { fxMoversOf, fxPlainWords, fxHeadlineVerdict, fxChangeLine, fxQuietView, fxDollarMeaning } from './fx-presentation/plain';
export type { FxQuietView } from './fx-presentation/plain';
