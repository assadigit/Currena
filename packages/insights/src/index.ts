/**
 * @currena/insights — indicator definitions, scoring engine and fixture
 * parsers for the Insights page. Pure TypeScript, platform-free (AGENTS.md
 * rule 2): no node:*, no DOM, no fetch, no clock reads — every time
 * reference is an explicit parameter.
 *
 * Modules:
 *   - series.ts      — SeriesPoint + date/lookup helpers (binary search).
 *   - parsers.ts     — fixture-format parsers (FRED CSV, Frankfurter JSON,
 *                      World Bank monthly, ABS period) — the parse halves of
 *                      the future I2 adapters.
 *   - definitions.ts — the 28 v1 indicator definitions (spec verbatim).
 *   - scoring.ts     — rule evaluation, readings, summary lines, changes.
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
  parseRbaTableCsv,
  parseFrankfurterTimeseries,
  parseFredCsv,
  parseWorldBankMonthlyCsv,
} from './parsers';
export type { RbaParseOptions } from './parsers';

export { DEFINITIONS } from './definitions';

export {
  GRACE_DAYS,
  MIN_ABOVE_LOW_OBS,
  MIN_PERCENTILE_OBS,
  PERCENTILE_WINDOW_DAYS,
  YOY_MAX_DAYS_BACK,
  YOY_MIN_DAYS_BACK,
  computeReading,
  changedSince,
  evaluateRule,
  labelForScore,
  percentileOf,
  summarize,
} from './scoring';
export type { ReadingSource, RuleVerdict, SummaryLabel } from './scoring';
