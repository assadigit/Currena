/**
 * @currena/core — shared data contracts and pure logic.
 *
 * Platform-free by construction (AGENTS.md rule 2): no node:*, no DOM, no
 * fetch — pure functions + data only. Everything here runs identically in
 * the Cloudflare Worker, the browser SPA and tests.
 *
 * Modules:
 *   - schemas.ts    — zod contracts (Rate, Snapshot, RatesResponse,
 *                     RatesError, SourceConfig) + TTL constants. The ONLY
 *                     place these are defined — import, never redefine.
 *   - currencies.ts — the 17 legacy currencies + TGJU profile slugs.
 *   - math.ts       — conversion math (same-currency short-circuit, cross
 *                     rates through the snapshot base, manual override).
 *   - format.ts     — render-time Intl formatting (en/fa, Jalali dates,
 *                     Persian digits, legacy amount-input separators).
 *   - settle.ts     — greedy Split & Settle algorithm (checklist #11).
 *   - calc.ts       — safe arithmetic evaluator replacing legacy eval (#7).
 *   - batch.ts      — batch-converter parsing, CSV, quick templates (#13).
 */

// /api/meta contract (B-4 consolidation: was duplicated api↔web).
export { buildMeta, MetaCurrencySchema, MetaResponseSchema } from './meta';
export type { MetaCurrency, MetaResponse } from './meta';

export { CORE_VERSION } from './version';

export { CoreError } from './errors';

export { ALERTS_CAP, crossesAlert, markTriggered, parseRateAlerts, serializeRateAlerts } from './alerts';
export type { AlertDirection, RateAlert } from './alerts';

export {
  SourceSchema,
  SnapshotSourceSchema,
  sourceForPair,
  CurrencyCodeSchema,
  RateUnitSchema,
  RateSchema,
  GoldIdSchema,
  GoldUnitSchema,
  GoldQuoteSchema,
  SnapshotSchema,
  RatesResponseSchema,
  RatesErrorSchema,
  SourceConfigSchema,
  SourceStatusSchema,
  SourceStatusErrorSchema,
  FRESH_TTL_SEC_BY_SOURCE,
  freshTtlSec,
  MIN_SCRAPE_INTERVAL_SEC,
  CACHE_HARD_TTL_SEC,
  IndicatorIdSchema,
  IndicatorGroupIdSchema,
  InsightsSectionSchema,
  IndicatorCadenceSchema,
  IndicatorPhaseSchema,
  IndicatorSourceSchema,
  WarningRuleAtomSchema,
  WarningRuleSchema,
  IndicatorDefinitionSchema,
  IndicatorReadingSchema,
  IndicatorReadingStatusSchema,
  SummaryLineSchema,
  ChangedEventSchema,
  CalendarEventSchema,
  GoldLaneSchema,
  GoldSubGaugeWordSchema,
  GoldSubGaugeSummarySchema,
  GoldTailwindLabelSchema,
  ModelVsRealityChipSchema,
  GoldSummarySchema,
  InsightsSnapshotSchema,
  IndicatorHistorySchema,
  InsightsSourceReportSchema,
  InsightsStatusSchema,
  ValidationTestResultSchema,
  MarketIdSchema,
  MarketGroupIdSchema,
  MarketTrendSchema,
  MarketStatusSchema,
  MarketSourceSchema,
  MarketEntrySchema,
  MarketsSummarySchema,
  MarketsSnapshotSchema,
  FxPairIdSchema,
  FxCurrencySchema,
  FxChgSchema,
  FxSourceSchema,
  FxPairEntrySchema,
  FxDollarMeasureSchema,
  FxPatternCheckSchema,
  FxLegSchema,
  FxChartSeriesSchema,
  FxRuleIdSchema,
  FxRuleStateSchema,
  FxPlainSchema,
  FxSummarySchema,
  FxSnapshotSchema,
  PriceAssetIdSchema,
  LivePriceEntrySchema,
  LivePricesSnapshotSchema,
} from './schemas';
export type {
  Source,
  SnapshotSource,
  Rate,
  GoldId,
  GoldUnit,
  GoldQuote,
  Snapshot,
  RatesResponse,
  RatesError,
  SourceConfig,
  SourceStatus,
  SourceStatusError,
  IndicatorId,
  IndicatorGroupId,
  InsightsSection,
  IndicatorCadence,
  IndicatorPhase,
  IndicatorSource,
  WarningRuleAtom,
  WarningRule,
  IndicatorDefinition,
  IndicatorReading,
  IndicatorReadingStatus,
  SummaryLine,
  ChangedEvent,
  CalendarEvent,
  GoldLane,
  GoldSubGaugeWord,
  GoldSubGaugeSummary,
  GoldTailwindLabel,
  ModelVsRealityChip,
  GoldSummary,
  InsightsSnapshot,
  IndicatorHistory,
  InsightsSourceReport,
  InsightsStatus,
  ValidationTestResult,
  MarketId,
  MarketGroupId,
  MarketTrend,
  MarketStatus,
  MarketSource,
  MarketEntry,
  MarketsSummary,
  MarketsSnapshot,
  FxPairId,
  FxCurrency,
  FxChg,
  FxSource,
  FxPairEntry,
  FxDollarMeasure,
  FxPatternCheck,
  FxLeg,
  FxChartSeries,
  FxRuleId,
  FxRuleState,
  FxPlain,
  FxSummary,
  FxSnapshot,
  PriceAssetId,
  LivePriceEntry,
  LivePricesSnapshot,
} from './schemas';

export {
  CURRENCIES,
  tgjuProfileUrl,
  getCurrency,
  isCurrencyCode,
} from './currencies';
export type { CurrencyCode, CurrencyMeta } from './currencies';

export {
  COMPUTE_SIGNIFICANT_DIGITS,
  roundSignificant,
  getRate,
  convert,
  reverseRate,
  convertWithManualRate,
} from './math';
export type { ConversionResult, ManualConversionResult } from './math';

export {
  normalizeDigits,
  parseAmount,
  formatNumber,
  formatCurrencyAmount,
  formatDate,
  formatDateWords,
  formatJalaliDate,
  formatRelative,
  thousandSeparateInput,
} from './format';
export type { Locale, NumberFormatOptions, DateFormatOptions } from './format';

export {
  SETTLE_EPSILON,
  computeBalances,
  settleDebts,
  computeSettlements,
  buildSettlementExpense,
} from './settle';
export type { SplitExpense, Transfer } from './settle';

export {
  CalcError,
  normalizeCalcExpression,
  evaluateExpression,
  MAX_NESTING_DEPTH,
} from './calc';
export type { CalcErrorCode } from './calc';

export {
  splitEvenly,
  SplitError,
} from './split';
export type { SplitErrorCode } from './split';

export {
  parseBatchLine,
  parseBatchLines,
  csvEscapeField,
  csvNeutralizeFormula,
  toCsv,
  BATCH_TEMPLATES,
  isBatchTemplateId,
  BatchError,
  MAX_BATCH_LINES,
  MAX_BATCH_LINE_CHARS,
} from './batch';
export type {
  ParsedBatchLine,
  BatchLineError,
  BatchLineErrorCode,
  BatchParseResult,
  BatchLineDefaults,
  BatchCsvRow,
  BatchCsvOptions,
  BatchTemplateId,
  BatchErrorCode,
} from './batch';
