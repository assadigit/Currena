/**
 * FRED adapter — keyless `fredgraph.csv` (Gate I0 probe: no API key needed).
 * Full history per series: the 10-year percentile window trims at scoring
 * time, and the runner only stores trimmed output (D1 minification).
 *
 * 2026-10-21 (data-integrity round): MULTI-SERIES consolidation. The ingest
 * moved onto the currena-api Worker's minute cron, where the free plan's
 * 50-subrequest ceiling counts every fetch AND every KV op. fredgraph.csv
 * accepts `?id=SERIES1,SERIES2,…` and answers one wide CSV (or a ZIP of
 * per-frequency CSVs for mixed-frequency sets) — so the ~37 series the
 * pipeline needs ride SIX requests (fetchFredSeriesBulk below) instead of
 * one per series (the 2026-10-24 Wave-1 round added the sixth group). The
 * single-series fetch stays (tests, ad-hoc probes).
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
 * highest-since pair + the long-yield cards' "since {year}" math); 'decade'
 * trims to the 10-year percentile/history window + margin — the ingest's
 * CPU budget on the Worker venue (2026-10-21: the first live run hit
 * exceededCpu at the stage stringify; the decade window halves the parse
 * and every downstream series); 'since' pins the group's own cosd anchor
 * (Session 3 / D-4: DFII10 rides cosd=2003-01-02 — its whole available
 * history — because the no-cosd full-history answer lagged the cosd answers
 * at rung time on 10 of 10 archived days, 2026-10-21→10-30, while the
 * decade-window groups served same-morning data every time; the evidence
 * is recorded in GOLD_FRED_GAPFILL_SPEC.md §5). */
export type FredBulkWindow = 'full' | 'decade' | 'since';

/** The decade window's margin beyond the 10-year percentile/history window. */
export const FRED_DECADE_MARGIN_DAYS = 90;

/** The cosd date for a 'decade' group (today − 10y − margin, UTC). */
export function fredDecadeFrom(now: Date = new Date()): string {
  return new Date(now.getTime() - (3_650 + FRED_DECADE_MARGIN_DAYS) * 86_400_000).toISOString().slice(0, 10);
}

/**
 * DFII10's own cosd anchor (D-4, Session 3): the series' whole available
 * history starts 2003-01-02 on FRED — "full" and "2003-start" cover the
 * same days, but the EXPLICIT cosd request rides the same fresh-at-rung-time
 * answer path the decade groups do, while the no-cosd full-history request
 * served bodies a day (sometimes three) behind at 04:10/20:10 UTC on every
 * archived day of the audit window. The nominal pair (DGS10/DGS30) keeps
 * the no-cosd full request: their highest-since math needs the pre-2003
 * decades a cosd trim would cut.
 */
export const FRED_DFII10_COSD = '2003-01-02';

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
  // 2026-10-26 gap-audit build, A-1: the 10y−3m curve leg (the Fed's own
  // preferred recession lens; rides the same daily bulk group as T10Y2Y).
  yieldCurve10y3m: 'T10Y3M',
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
  // boe-rate left this mirror 2026-10-25 (M6 Wave-4 probe fix): the BoE's
  // own Bank Rate history page serves the current rate at every decision —
  // IRSTCI01GBM156N retired from the enum and its bulk group.
  // ---- M4 Wave 1 — the early-warning pack (OD-8/D-42, 2026-10-24; each
  // live-verified on FRED the same day, licence classes T-16-scanned) ----
  initialClaims: 'ICSA', // initial-jobless-claims: weekly claims level (public domain)
  sofr: 'SOFR', // sofr: the overnight funding rate (citation-required — NY Fed via FRED)
  recessionProbability: 'RECPROUSM156N', // recession-probability: smoothed recession probs (public domain)
  michiganSentiment: 'UMCSENT', // michigan-sentiment: U. Michigan consumer sentiment (citation-required)
  michigan1yInflation: 'MICH', // michigan-1y-expectations: median expected 1y price change (citation-required)
  pceCoreIndex: 'PCEPILFE', // us-pce-core-yoy: core PCE price index → 12-month % change (public domain)
  // ---- M6 Wave 3 — the leading-edge batch (OD-8/D-42, 2026-10-25; each
  // live-verified on FRED the same day + T-16-scanned, see
  // data/fred-copyright.json) ----
  mortgage30y: 'MORTGAGE30US', // mortgage-30y: 30y fixed mortgage average, weekly (citation-required — Freddie Mac)
  walcl: 'WALCL', // walcl: Fed total assets, weekly $m (public domain)
  // gap-closure S2-M2.4 (2026-10-31): the weekly custody card — rides the
  // SAME mixed-frequency bulk group as WALCL (both Fed H.4.1-family
  // Wednesday-level weeklies; the live 11-id probe 2026-10-31 22:55 UTC
  // answered the ZIP member weekly,_as_of_wednesday.csv carrying BOTH
  // columns). ZERO new subrequests — one more id inside an existing
  // request.
  custodyHoldings: 'WSEFINTL1', // nyfed-custody: NY Fed custody holdings for foreign official accounts, weekly $m (public domain)
  retailSales: 'RSAFS', // retail-sales: advance retail sales, monthly $m (public domain)
  housingPermits: 'PERMIT', // housing-permits: new units authorized, monthly k SAAR (public domain)
  cfnai: 'CFNAI', // cfnai: Chicago Fed National Activity Index, monthly (citation-required)
  jobOpenings: 'JTSJOL', // job-openings: JOLTS total nonfarm, monthly k (public domain)
  t5yie: 'T5YIE', // t5yie: 5-year breakeven inflation, daily (citation-required)
  averageHourlyEarnings: 'AHETPI', // us-wages: avg hourly earnings → 12-month % change (public domain)
  // NOTE (M3/D-44, 2026-10-24): the ICE BofA credit-spread series
  // (BAMLH0A0HYM2 / BAMLC0A0CM) are deliberately ABSENT: the T-16 scan
  // found FRED's "copyright-pre-approval" tag on them — the publisher's
  // permission is required before any fetch or display, so no hy-oas /
  // ig-oas card ships (the OD-5 honest no-go; see licences.ts +
  // data/fred-copyright.json for the recorded evidence).
} as const;

/**
 * The multi-series request groups (2026-10-21): every FRED_SERIES id rides
 * exactly one group; seven requests cover the whole register (six before
 * the Session-3 trio split). Grouped by cadence/source so a single failing
 * group degrades coherent families. The 2026-10-21b CPU fix: only the
 * highest-since yields (DGS10/DGS30 — the "highest since {year}" math needs
 * decades) keep FULL history; DFII10 rides its own whole-history 'since'
 * window (D-4, Session 3); every other group rides the decade window (the
 * 10-year percentile/history basis + margin) — the Worker venue's CPU
 * budget killed the first live run at the stage write, and the parse +
 * downstream halve with the trim.
 */
export interface FredBulkGroup {
  seriesIds: readonly string[];
  window: FredBulkWindow;
  /**
   * The cosd anchor for window 'since' groups (the group's whole-history
   * start, pinned by the series it carries — see FRED_DFII10_COSD).
   */
  since?: string;
}

/** The cosd a group requests, or undefined for the no-cosd full history. */
export function fredGroupFrom(group: FredBulkGroup, now: Date = new Date()): string | undefined {
  if (group.window === 'decade') return fredDecadeFrom(now);
  if (group.window === 'since') {
    if (group.since === undefined) {
      throw new Error("FRED bulk group window 'since' needs a since anchor (missing on its definition)");
    }
    return group.since;
  }
  return undefined;
}

export const FRED_BULK_GROUPS: readonly FredBulkGroup[] = [
  // FULL history — the nominal highest-since pair (us10y/us30y). Session 3
  // (D-4, GOLD_FRED_GAPFILL_SPEC §2 G1d): the trio SPLIT — DGS10/DGS30 keep
  // the no-cosd full request (the "highest since {year}" math needs their
  // pre-2003 decades), while DFII10 moved to its own 'since' group below.
  // One extra subrequest per rung (7 FRED groups total; the main rung sits
  // at ~43/50 fetches — the budget note in ingest/run.ts's header).
  {
    seriesIds: [FRED_SERIES.us10y, FRED_SERIES.us30y],
    window: 'full',
  },
  // The real 10-year, whole history, on the cosd path (D-4): 2003-01-02 IS
  // DFII10's first observation date, so this trims nothing — it only picks
  // the fresher answer path. The cross-fill + the Treasury real-curve
  // fallback (collect.ts) cover this group's own failure days.
  {
    seriesIds: [FRED_SERIES.realYield10y],
    window: 'since',
    since: FRED_DFII10_COSD,
  },
  // Daily rates/stress, decade window (9 series — M6 adds the 5-year
  // breakeven beside the 5y5y forward it belongs to; all-daily set).
  // NOTE (M6, probed 2026-10-25): fredgraph answers 9+ ids as a ZIP
  // organized by sub-cadence (daily / weekly,_ending_friday / daily,_close)
  // — parseFredMultiCsvLoose serves every member shape. The 15-id probe
  // showed the request TRUNCATES past ~12 ids (the last 3 silently
  // absent) — the groups below stay at 12 or fewer, and
  // fetchFredSeriesBulk still fails loudly if any requested id comes back
  // absent, so a future cap change can never read as "no data".
  {
    seriesIds: [
      FRED_SERIES.yieldCurve10y2y,
      FRED_SERIES.yieldCurve10y3m,
      FRED_SERIES.stressStlfsi,
      FRED_SERIES.breakeven5y5y,
      FRED_SERIES.us2y,
      FRED_SERIES.breakeven10y,
      FRED_SERIES.vix,
      FRED_SERIES.nfci,
      FRED_SERIES.sofr,
      FRED_SERIES.t5yie,
    ],
    window: 'decade',
  },
  // Monthly US macro, decade window (12 series — M6 adds retail sales
  // and building permits beside the labor/CPI family they ride with;
  // the fed-target pair answers from its own daily,_7-day zip member).
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
      FRED_SERIES.retailSales,
      FRED_SERIES.housingPermits,
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
  // OECD international yields/rates (4 series, all citation-required → the
  // sovereign-yield cards they feed are private-only by the licence walk).
  // NOTE: au-10y deliberately stays RBA-F2-sourced (public, held stale with
  // an honest flag during the Akamai outage) — an OECD AU fallback would
  // flip the card's licence level and remove it from the public site.
  // NOTE (M6 probes, 2026-10-25): boe-rate LEFT this group — the BoE's own
  // Bank Rate page serves the current rate at every decision (the Wave-4
  // probe fix). china-cpi rides NO group — BOTH OECD mirrors
  // (CHNCPIALLMINMEI / CPALTT01CHM659N) died upstream at 2025-04; the NBS
  // automation carries the follow-up (M7).
  {
    seriesIds: [
      FRED_SERIES.bund10y,
      FRED_SERIES.jgb10y,
      FRED_SERIES.gilt10y,
      FRED_SERIES.bojCallRate,
    ],
    window: 'decade',
  },
  // M4 Wave 1 (2026-10-24) + M6 Wave 3 (2026-10-25) — the early-warning
  // pack's weekly/monthly leg, now ALSO the mortgage/balance-sheet/wage/
  // activity family: claims, recession probability, Michigan (sentiment +
  // 1y), core PCE, the 30y mortgage, the Fed's balance sheet, CFNAI, JOLTS
  // and average hourly earnings — ONE coherent mixed-frequency group so a
  // failing request degrades the pack together (the ZIP path serves four
  // members: weekly,_ending_saturday + weekly,_ending_thursday +
  // weekly,_as_of_wednesday + monthly; venue-verified 2026-10-25, every
  // id served).
  {
    seriesIds: [
      FRED_SERIES.initialClaims,
      FRED_SERIES.recessionProbability,
      FRED_SERIES.michiganSentiment,
      FRED_SERIES.michigan1yInflation,
      FRED_SERIES.pceCoreIndex,
      FRED_SERIES.mortgage30y,
      FRED_SERIES.walcl,
      // gap-closure S2-M2.4: the custody series joins its WALCL twin in
      // this group (11/12 — the ZIP truncates past ~12 ids). The live
      // 11-id probe (2026-10-31): the weekly,_as_of_wednesday member
      // carries WALCL and WSEFINTL1 side by side, latest 2026-10-28.
      FRED_SERIES.custodyHoldings,
      FRED_SERIES.cfnai,
      FRED_SERIES.jobOpenings,
      FRED_SERIES.averageHourlyEarnings,
    ],
    window: 'decade',
  },
];

/** Every series the bulk groups must cover (the collect layer asserts this). */
export const FRED_BULK_ALL_IDS: readonly string[] = FRED_BULK_GROUPS.flatMap((g) => g.seriesIds);
