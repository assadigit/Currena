/**
 * @currena/insights/adapters — the Phase I2 source adapters (fetch halves).
 *
 * Import surface is SPLIT from the package root on purpose: the SPA must
 * never pull network code (bundle discipline), so the pure root export
 * (".") stays platform- and fetch-free while this entry point is runner-only
 * (GitHub Actions ingestion / one-off live runs / Worker cron if ever on the
 * paid plan). See packages/insights/package.json "exports".
 */

export { AdapterError } from './types';
export type { FetchDeps, LivePoint, SpotPrice } from './types';

export { FRED_SERIES, fetchFredSeries, fredSeriesUrl, FRED_CSV_BASE } from './fred';
export {
  FRANKFURTER_INSIGHTS_CURRENCIES,
  fetchFrankfurterSeries,
  frankfurterTimeseriesUrl,
  FRANKFURTER_BASE,
} from './frankfurter';
export { ABS_SERIES, absDataUrl, fetchAbsSeries, ABS_DATA_BASE } from './abs';
export {
  WB_COMMODITY_MARKETS_PAGE,
  WB_MONTHLY_SHEET_NAME,
  fetchWorldBankMonthly,
  findPinkSheetMonthlyUrl,
  parseWorldBankMonthlySheet,
} from './worldbank';
export { GOLDAPI_SYMBOLS, fetchGoldApiSpot, goldApiPriceUrl, GOLDAPI_BASE } from './goldapi';
export { ECB_DFR_SERIES_KEY, ecbDfrUrl, fetchEcbDfrSeries, ECB_DATA_BASE } from './ecb';
export { bitstampOhlcUrl, fetchBitstampCloses } from './bitstamp';
export type { BitstampWindow } from './bitstamp';
export { RBA_TABLES, fetchRbaSeries, rbaTableUrl, RBA_CSV_BASE } from './rba';
export type { RbaTableKey, RbaTableSpec } from './rba';
export { ManualSeriesFileSchema, parseManualSeries } from './manual';
export type { ManualSeriesFile } from './manual';
export { buildIndicatorSeries, READING_SOURCES } from './derived';
export type { SeriesInputs } from './derived';
export { readXlsxSheet } from './xlsx';
export type { XlsxCell } from './xlsx';
export { collectAllSources, DEFAULT_BITSTAMP_CANDLES, DEFAULT_FX_START } from './collect';
export type { CollectOptions, CollectResult } from './collect';
export {
  buildInsightsSnapshot,
  buildHistoryFile,
  buildInsightsStatus,
  downsampleSeries,
  historyToSeries,
  HISTORY_MAX_POINTS,
  HISTORY_WINDOW_DAYS,
} from './snapshot';
