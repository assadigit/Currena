/**
 * FRED adapter — keyless `fredgraph.csv` (Gate I0 probe: no API key needed).
 * Full history per series: the 10-year percentile window trims at scoring
 * time, and the runner only stores trimmed output (D1 minification).
 *
 * 2026-10-21 (data-integrity round): MULTI-SERIES consolidation. The ingest
 * moved onto the currena-api Worker's minute cron, where the free plan's
 * 50-subrequest ceiling counts every fetch AND every KV op. fredgraph.csv
 * accepts `?id=SERIES1,SERIES2,…` and answers one wide CSV — so the ~32
 * series the pipeline needs ride FOUR requests (fetchFredSeriesBulk below)
 * instead of 32. The single-series fetch stays (tests, ad-hoc probes).
 */

import { insightsFetch } from './fetch-policy';
import { parseFredCsv, parseFredMultiCsv, parseFredMultiCsvLoose } from '../parsers';
import { isZip, readZipTextEntries } from './zip';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const FRED_CSV_BASE = 'https://fred.stlouisfed.org/graph/fredgraph.csv';

/**
 * Descriptive ingestion UA — FRED's Akamai edge HANGS on the scraper ladder's
 * Chrome browser fingerprint from the build egress (probe 2026-10-06: UA-only
 * request times out; headerless request answers in ~50 ms), so this adapter
 * overrides the browser headers. An honest UA is also the right practice for
 * programmatic CSV access; re-verified from the ingestion venue during I2.
 */
const FRED_HEADERS: Readonly<Record<string, string>> = {
  Accept: 'text/csv,*/*;q=0.8',
  // The declared identity now lives in fetch-policy.ts (T-25/F-09): every
  // Insights fetch carries CurrenaDashboard/1.0 (+contact) — a single
  // honest identity for the whole pipeline, never a browser fingerprint.
};

/** URL of a series' full-history CSV. */
export function fredSeriesUrl(seriesId: string): string {
  return `${FRED_CSV_BASE}?id=${encodeURIComponent(seriesId)}`;
}

/** URL of a multi-series wide CSV (one column per id); cosd trims history. */
export function fredMultiSeriesUrl(seriesIds: readonly string[], from?: string): string {
  const base = `${FRED_CSV_BASE}?id=${seriesIds.map(encodeURIComponent).join(',')}`;
  return from !== undefined ? `${base}&cosd=${from}` : base;
}

/** The window a bulk group requests: 'full' keeps the whole history (the
 * highest-since trio + the long-yield cards' "since {year}" math); 'decade'
 * trims to the 10-year percentile/history window + margin — the ingest's
 * CPU budget on the Worker venue (2026-10-21: the first live run hit
 * exceededCpu at the stage stringify; the decade window halves the parse
 * and every downstream series). */
export type FredBulkWindow = 'full' | 'decade';

/** The decade window's margin beyond the 10-year percentile/history window. */
export const FRED_DECADE_MARGIN_DAYS = 90;

/** The cosd date for a 'decade' group (today − 10y − margin, UTC). */
export function fredDecadeFrom(now: Date = new Date()): string {
  return new Date(now.getTime() - (3_650 + FRED_DECADE_MARGIN_DAYS) * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Fetch and parse one FRED series (full history). Throws loudly on any
 * non-2xx (after retries) or format change — never returns partial guesses.
 */
export async function fetchFredSeries(seriesId: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(fredSeriesUrl(seriesId), { headers: FRED_HEADERS }, deps);
  const text = await res.text();
  return parseFredCsv(text);
}

/**
 * Fetch MANY series in ONE request. The answer shape adapts to the request:
 * a same-frequency set answers as ONE wide CSV (observation_date + one
 * column per id); a mixed-frequency set (or a large set) answers as a ZIP
 * carrying one CSV per frequency label (daily.csv, weekly,_ending_friday.csv,
 * …). Both are parsed by the same per-column discipline: every requested id
 * must come back as a column SOMEWHERE — an absent id throws loudly (a
 * renamed/retired series must never silently read as "no data"), and a
 * missing-value-only series (empty answer for the whole window) also throws,
 * mirroring the empty-array discipline of the other adapters.
 */
export async function fetchFredSeriesBulk(
  seriesIds: readonly string[],
  deps: FetchDeps = {},
  from?: string,
): Promise<Record<string, SeriesPoint[]>> {
  if (seriesIds.length === 0) return {};
  const res = await insightsFetch(fredMultiSeriesUrl(seriesIds, from), { headers: FRED_HEADERS }, deps);
  const body = new Uint8Array(await res.arrayBuffer());
  if (isZip(body)) {
    const entries = await readZipTextEntries(body);
    const csvs = [...entries.entries()]
      .filter(([name]) => name.endsWith('.csv'))
      .map(([name, text]) => ({ name, text }));
    if (csvs.length === 0) {
      throw new Error('FRED multi CSV: the zip answer carried no .csv member (format changed?)');
    }
    const out: Record<string, SeriesPoint[]> = {};
    for (const csv of csvs) {
      // Each member is a wide CSV covering a subset of the requested ids;
      // absent columns in a member are simply not that member's frequency.
      const parsed = parseFredMultiCsvLoose(csv.text, seriesIds);
      for (const [id, series] of Object.entries(parsed)) out[id] = series;
    }
    for (const id of seriesIds) {
      if (out[id] === undefined) {
        throw new Error(`FRED multi CSV: series "${id}" appears in no zip member (retired or renamed?)`);
      }
    }
    return out;
  }
  const text = new TextDecoder().decode(body);
  return parseFredMultiCsv(text, seriesIds);
}

/** The FRED series ids the Insights indicators consume (I2 route + I15 additions, keyless). */
export const FRED_SERIES = {
  yieldCurve10y2y: 'T10Y2Y',
  stressStlfsi: 'STLFSI4',
  realYield10y: 'DFII10',
  us10y: 'DGS10',
  breakeven5y5y: 'T5YIFR',
  govtInterest: 'A091RC1Q027SBEA',
  govtReceipts: 'W006RC1Q027SBEA',
  brent: 'DCOILBRENTEU',
  m2Us: 'M2SL',
  // I15 (2026-10-08 data spec §3). Defect E-14 (2026-10-16): the BLS
  // headline annual rate is published from the NOT seasonally adjusted
  // index, so the YoY rates here compute from the NSA series (CPIAUCNS /
  // CPILFENS) — the SA siblings (CPIAUCSL / CPILFESL) can differ by a few
  // hundredths and are retired from this pipeline.
  usCpiIndex: 'CPIAUCNS', // us-cpi-yoy: 12-month % change, computed (NSA — the BLS headline basis)
  // Step-1 audit item A3: core CPI (ex food & energy) — the context
  // companion shown on the US inflation card (NSA, same defect E-14 basis).
  usCpiCoreIndex: 'CPILFENS', // us-cpi-core-yoy: 12-month % change, computed (NSA)
  fedTargetLower: 'DFEDTARL', // fed-target: the lower bound of the target range
  fedTargetUpper: 'DFEDTARU', // …and its upper bound (rangeHigh on the reading)
  nfci: 'NFCI', // Chicago Fed National Financial Conditions, weekly
  // dollar-broad (DTWEXBGS) retired: the series now lags ~5 days upstream
  // and the Currena dollar basket replaces it (data spec §3, basket.ts).
  // Step-2 add-list §B3/§B4/§B5 (all verified current 2026-10-13):
  usUnemployment: 'UNRATE', // us-unemployment: the US unemployment rate, monthly BLS
  sahmRealtime: 'SAHMREALTIME', // sahm-rule: the real-time Sahm recession indicator, monthly
  vix: 'VIXCLS', // vix: the Cboe Volatility Index close, daily (Cboe data via FRED)
  // Fix spec C-03/C-04/C-05 + T-01 (2026-10-14, each verified live on FRED):
  us2y: 'DGS2', // fed-expectations: 2-year Treasury yield (the Fed policy gap's market leg)
  us30y: 'DGS30', // us30y: the US 30-year Treasury yield, daily
  breakeven10y: 'T10YIE', // validation-only: the 10-year breakeven (T-01 reconciliation)
  phillyFed: 'GACDFSA066MSFRBPHI', // philly-fed: Philadelphia Fed manufacturing index, monthly SA
  // ---- 2026-10-21 data-integrity round (each live-verified on FRED) ----
  wti: 'DCOILWTICO', // wti: WTI crude spot, USD/barrel (EIA, weekly-ish batch like Brent)
  natgas: 'DHHNGSP', // natgas: Henry Hub natural gas spot, USD/MMBtu (EIA)
  usGdpGrowth: 'A191RL1Q225SBEA', // us-gdp-growth: real GDP growth QoQ annualized, quarterly
  payrolls: 'PAYEMS', // us-nfp: nonfarm payrolls LEVEL; the card's value is the monthly change (derived)
  bund10y: 'IRLTLT01DEM156N', // bund-10y: German 10Y govt yield, monthly OECD (citation-required)
  jgb10y: 'IRLTLT01JPM156N', // jgb-10y: Japan 10Y govt yield, monthly OECD
  gilt10y: 'IRLTLT01GBM156N', // gilt-10y: UK 10Y govt yield, monthly OECD
  bojCallRate: 'IRSTCI01JPM156N', // boj-rate: Japan overnight call rate avg, monthly OECD (≈ policy)
  boeCallRate: 'IRSTCI01GBM156N', // boe-rate: UK overnight rate avg, monthly OECD (≈ Bank Rate)
} as const;

/**
 * The multi-series request groups (2026-10-21): every FRED_SERIES id rides
 * exactly one group; four requests cover the whole register. Grouped by
 * cadence/source so a single failing group degrades coherent families.
 * The 2026-10-21b CPU fix: only the highest-since trio (DGS10/DGS30/DFII10 —
 * the "highest since {year}" math needs decades) keeps FULL history; every
 * other group rides the decade window (the 10-year percentile/history
 * basis + margin) — the Worker venue's CPU budget killed the first live
 * run at the stage write, and the parse + downstream halve with the trim.
 */
export interface FredBulkGroup {
  seriesIds: readonly string[];
  window: FredBulkWindow;
}

export const FRED_BULK_GROUPS: readonly FredBulkGroup[] = [
  // FULL history — the highest-since trio (us10y/us30y/real-yield-10y).
  {
    seriesIds: [FRED_SERIES.us10y, FRED_SERIES.us30y, FRED_SERIES.realYield10y],
    window: 'full',
  },
  // Daily rates/stress, decade window (7 series).
  {
    seriesIds: [
      FRED_SERIES.yieldCurve10y2y,
      FRED_SERIES.stressStlfsi,
      FRED_SERIES.breakeven5y5y,
      FRED_SERIES.us2y,
      FRED_SERIES.breakeven10y,
      FRED_SERIES.vix,
      FRED_SERIES.nfci,
    ],
    window: 'decade',
  },
  // Monthly US macro, decade window (10 series).
  {
    seriesIds: [
      FRED_SERIES.m2Us,
      FRED_SERIES.usCpiIndex,
      FRED_SERIES.usCpiCoreIndex,
      FRED_SERIES.fedTargetLower,
      FRED_SERIES.fedTargetUpper,
      FRED_SERIES.usUnemployment,
      FRED_SERIES.sahmRealtime,
      FRED_SERIES.phillyFed,
      FRED_SERIES.payrolls,
      FRED_SERIES.usGdpGrowth,
    ],
    window: 'decade',
  },
  // Quarterly + EIA commodities, decade window (5 series).
  {
    seriesIds: [
      FRED_SERIES.govtInterest,
      FRED_SERIES.govtReceipts,
      FRED_SERIES.brent,
      FRED_SERIES.wti,
      FRED_SERIES.natgas,
    ],
    window: 'decade',
  },
  // OECD international yields/rates (5 series, all citation-required → the
  // sovereign-yield cards they feed are private-only by the licence walk).
  // NOTE: au-10y deliberately stays RBA-F2-sourced (public, held stale with
  // an honest flag during the Akamai outage) — an OECD AU fallback would
  // flip the card's licence level and remove it from the public site.
  {
    seriesIds: [
      FRED_SERIES.bund10y,
      FRED_SERIES.jgb10y,
      FRED_SERIES.gilt10y,
      FRED_SERIES.bojCallRate,
      FRED_SERIES.boeCallRate,
    ],
    window: 'decade',
  },
];

/** Every series the bulk groups must cover (the collect layer asserts this). */
export const FRED_BULK_ALL_IDS: readonly string[] = FRED_BULK_GROUPS.flatMap((g) => g.seriesIds);
