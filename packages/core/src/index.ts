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

export { CORE_VERSION } from './version';

export { CoreError } from './errors';

export {
  SourceSchema,
  SnapshotSourceSchema,
  CurrencyCodeSchema,
  RateUnitSchema,
  RateSchema,
  SnapshotSchema,
  RatesResponseSchema,
  RatesErrorSchema,
  SourceConfigSchema,
  FRESH_TTL_SEC,
  MIN_SCRAPE_INTERVAL_SEC,
  CACHE_HARD_TTL_SEC,
} from './schemas';
export type { Source, SnapshotSource, Rate, Snapshot, RatesResponse, RatesError, SourceConfig } from './schemas';

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
} from './calc';
export type { CalcErrorCode } from './calc';

export {
  parseBatchLine,
  parseBatchLines,
  csvEscapeField,
  toCsv,
  BATCH_TEMPLATES,
  isBatchTemplateId,
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
} from './batch';
