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

export { RULE_VERSION, RULE_CHANGELOG } from './ruleVersion';
export type { RuleChangeLogEntry } from './ruleVersion';
