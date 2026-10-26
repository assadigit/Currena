/**
 * Derived-series assembly — composes every indicator's canonical series from
 * the provider adapters' outputs. This is the production twin of the backtest
 * SCRIPT's inline SERIES map (docs/insights/BACKTEST.md): the same joins and
 * the same conventions, so backtested behaviour and live behaviour cannot
 * drift apart.
 *
 * Composition rules (01-indicator-spec.md + definitions.ts + the I15 spec):
 *  - ratios join on exact common dates (combineSeries inner join):
 *    govt-interest-revenue, gold-silver history, copper-gold, audjpy,
 *    au-us-10y-gap, fed-target midpoint;
 *  - au-cpi / au-trimmed-mean / us-cpi-yoy / au-wage-growth / au-rent-yoy /
 *    au-petrol-yoy are year-on-year PERCENT of an index series
 *    (yoyPctSeries — base-invariant);
 *  - audusd is the inverse of the USD→AUD quote series;
 *  - dollar-basket is the DXY-style weighted geometric mean of the six
 *    basket currencies (src/basket.ts — dollar_basket.py's recipe);
 *  - price rows (gold/silver/copper/bitcoin) = World Bank monthly history ∪
 *    the runner's accumulated daily snapshots (seedHistory) ∪ today's live
 *    spot — union by date, live wins, so 7/30-day changes are measurable
 *    while the percentile base keeps its decade of monthly history;
 *  - live-point cards (gold-btc, gold-aud) carry exactly one
 *    observation — honest: no daily history exists in the verified
 *    sources, so no change/percentile is invented (silver-btc retired
 *    2026-10-23, OD-7);
 *  - TGJU is retired from Insights (unverified licence, data spec §1):
 *    gold comes from gold-api XAU exactly like silver.
 *
 * Total function: whatever provider input is MISSING simply omits the
 * affected indicators (the runner renders those unavailable). Failures
 * belong to the fetch adapters, which throw loudly.
 */

import type { IndicatorId } from '@currena/core';
import { combineSeries, yoyPctSeries, addDays, type SeriesPoint } from '../series';
import { boeBankRateDailySeries } from './boe';
import { BASKET_CURRENCIES, computeBasketValue } from '../basket';
import { PERCENTILE_WINDOW_DAYS } from '../scoring';
import type { Rung2SeriesInputs } from './rung2-inputs';
import type { SpotPrice } from './types';
import type { WorldBankMonthly } from './worldbank';
import type { YahooQuote } from './yahoo';

/** Pounds per metric tonne — gold-api's HG copper quote (USD/lb) → the World Bank's USD/mt unit. */
const COPPER_LB_PER_TONNE = 2204.62262;

export interface SeriesInputs {
  /** FRED series outputs keyed by FRED_SERIES name. */
  fred: Partial<Record<string, SeriesPoint[]>>;
  /**
   * Yahoo BZ=F daily closes (2026-10-12 stale-oil fix): EIA's Brent spot
   * on FRED can lag by days or weeks (it stopped publishing 2026-10-06
   * while the market kept moving). These closes EXTEND the Brent series
   * past FRED's last date — FRED stays authoritative on every overlapping
   * date, so the series self-corrects when EIA catches up. Optional: an
   * absent/failed fetch simply leaves the FRED series as-is.
   */
  brentYahoo?: SeriesPoint[];
  /** ECB Data Portal series (I15; M5 Wave 2 adds the AAA 10y; M6 Wave 3
   * 2026-10-25 adds the HICP annual rate — the new post-Feb-2026 dataset). */
  ecb?: { dfr?: SeriesPoint[]; aaa10y?: SeriesPoint[]; hicp?: SeriesPoint[] };
  /** Bank of England Bank Rate decisions (M6 Wave-4 probe fix,
   * 2026-10-25 — the full decision-table history from the BoE's own page). */
  boe?: { bankRateDecisions?: SeriesPoint[] };
  /**
   * 2026-10-26 gap-audit build: the second-rung feeds (the 04:20 phase —
   * MOF daily + the weekly/monthly additions) whose subrequest cost must
   * not ride the 04:10 main rung. The MAIN rung passes undefined (the
   * rung-2 ids' readings carry forward from the previous snapshot); the
   * Node venue + selfcheck pass the fetched series so one build derives
   * everything. See adapters/rung2.ts.
   */
  rung2?: Rung2SeriesInputs;
  /** Frankfurter USD→currency series (USD quote side, USD base). */
  fx: {
    JPY?: SeriesPoint[];
    AUD?: SeriesPoint[];
    CNY?: SeriesPoint[];
    EUR?: SeriesPoint[];
    GBP?: SeriesPoint[];
    CAD?: SeriesPoint[];
    SEK?: SeriesPoint[];
    CHF?: SeriesPoint[];
    /** NZD joined 2026-10-21 for the nzd-usd card — retired 2026-10-23
     *  (OD-7): the leg stays out of the one Frankfurter request again.
     *  M5 Wave 2 (2026-10-24): TRY joins as the ninth leg (the usdtry card,
     *  the EM-pressure first member). */
    TRY?: SeriesPoint[];
  };
  /** World Bank Pink Sheet monthly series. */
  wb?: WorldBankMonthly;
  /** gold-api.com gold spot (the primary gold source — TGJU retired). */
  xauSpot?: SpotPrice;
  /** gold-api.com silver spot. */
  xagSpot?: SpotPrice;
  /** gold-api.com Bitcoin spot. */
  btcSpot?: SpotPrice;
  /** gold-api.com copper spot (USD per pound — converted to USD/mt). */
  hgSpot?: SpotPrice;
  /** gold-api.com platinum spot (USD per troy ounce — M6 Wave 3 2026-10-25:
   *  the platinum card's daily cadence fix, the gold-usd pattern). */
  xptSpot?: SpotPrice;
  /** ABS series outputs. */
  abs?: {
    cpiIndex?: SeriesPoint[];
    trimmedMeanIndex?: SeriesPoint[];
    unemployment?: SeriesPoint[];
    resDwellMeanPrice?: SeriesPoint[];
    termsOfTrade?: SeriesPoint[];
    rentIndex?: SeriesPoint[];
    automotiveFuelIndex?: SeriesPoint[];
    wageIndex?: SeriesPoint[];
    /** M6 Wave 3 (2026-10-25): new housing loan commitments, total
     * dwellings, SA, quarterly $ millions (LEND_HOUSING). */
    housingFinance?: SeriesPoint[];
    /** M6 Wave 3 (2026-10-25): household saving ratio, SA, quarterly %
     * (ANA_AGG M7.HSR). */
    savingRatio?: SeriesPoint[];
    /** M6 Wave 3 (2026-10-25): job vacancies, all sectors, SA, quarterly
     * thousands (JV M1.7.TOT). */
    jobVacancies?: SeriesPoint[];
  };
  /** RBA series outputs (venue-dependent — see docs/insights/03-data-sources.md). */
  rba?: {
    /** 'Cash Rate Target' — the DAILY F1 series when it parsed, else the F1.1 monthly average. */
    cashRate?: SeriesPoint[];
    /** The F1.1 monthly-average series (kept separately for diagnostics). */
    cashRateMonthly?: SeriesPoint[];
    /**
     * 2026-10-21: the cash-rate DECISION table parsed from the
     * /statistics/cash-rate/ HTML page — the Worker venue's reliable source
     * while the CSV paths stay Akamai-403'd (collect prefers it in the
     * cashRate chain when the daily table is unavailable).
     */
    cashRateDecisions?: SeriesPoint[];
    au10y?: SeriesPoint[];
    /** Fix spec C-06: F2 FCMYGBAG3D — the 3-year government bond yield. */
    au3y?: SeriesPoint[];
    householdDebtRatio?: SeriesPoint[];
    homeLoanOutstanding?: SeriesPoint[];
    /** Step-2 §B7: F4.1 PDRNTH — the paid rate on new household term deposits. */
    depositRateNewTermHouseholds?: SeriesPoint[];
  };
  /** The committed china-pmi SEED history (data/manual/china-pmi.json —
   *  the M5 manual file, kept as the fetch-failure fallback history; all
   *  10 observations verified identical against the NBS's own Table 1,
   *  2026-10-26; the fetched series wins on collisions). */
  chinaPmi?: SeriesPoint[];
  /** M7 (2026-10-26): the committed china-cpi SEED history
   *  (data/manual/china-cpi.json — 13 YoY observations, Sep 2025 → Sep
   *  2026, each month's value read from that month's own NBS release page;
   *  the fetch appends new months, the stored accumulation keeps them). */
  chinaCpi?: SeriesPoint[];
  /** M7 (2026-10-26): the NBS English press-release fetches — the PMI
   *  Table-1 history (13 months, rebuilt every rung) + the CPI release's
   *  own YoY month. Union-merged over the seeds + the stored
   *  accumulation in buildIndicatorSeries (fetched wins on collision). */
  nbs?: { pmi?: SeriesPoint[]; cpi?: SeriesPoint[] };
  /** M7 (2026-10-26): the previously-STORED monthly accumulations — the
   *  union of every observation the automation has ever collected (the CPI
   *  release carries only its own month; the committed seeds are static,
   *  so this is what grows the china-cpi series over time). */
  nbsStored?: { 'china-pmi'?: SeriesPoint[]; 'china-cpi'?: SeriesPoint[] };
  /** Step 3 L1-18: the Alternative.me crypto Fear and Greed index (context only). */
  cryptoFng?: SeriesPoint[];
  /**
   * Step 3 L1-14 / FS-06 (v3, 2026-10-20): the monthly Shiller CAPE and
   * Excess CAPE Yield series, read from the converted bulk file
   * (data/shiller/shiller-cape.json — fetched by the monthly
   * shiller-fetch Action, never by the Worker). The source is L2 and
   * stays disabled until the owner accepts (T-30).
   */
  shiller?: { cape?: SeriesPoint[]; ecy?: SeriesPoint[] };
  /**
   * I15: previously-STORED daily history (epoch-day points decoded back to
   * dates by the runner) for the live-priced rows — gold/silver/copper/
   * bitcoin accumulate one observation per ingestion run, which is what
   * makes 7/30-day changes on those rows measurable (data spec §3 note:
   * "show the 7-day and 30-day changes from your own stored daily
   * snapshots"). Optional; the first run builds from the monthly/backfill
   * base alone and the history grows from there.
   */
  seedHistory?: Partial<Record<IndicatorId, SeriesPoint[]>>;
  /**
   * Fix spec B-01 (2026-10-14): 10-year Yahoo daily quotes for the price
   * rows (gold GC=F, silver SI=F, Bitcoin BTC-USD) — the record-history
   * backfill. The gold/silver/bitcoin VALUE series ride these daily closes
   * (the monthly World Bank history no longer carries them); the daily
   * HIGH series computes the record peaks (see computePeaks).
   */
  yahooHistories?: Partial<Record<'gold-usd' | 'silver-usd' | 'btc-usd', YahooQuote>>;
  /** The runner's calendar date (ISO) — stamps live points. */
  today: string;
}

/** Inverse of a USD→X quote series (X per USD → USD per X). */
function invert(series: SeriesPoint[]): SeriesPoint[] {
  return series.map((p) => ({ date: p.date, value: 1 / p.value }));
}

/**
 * F4 (2026-10-21 precision round): quantize every value of a derived
 * POINTS-based series to `dp` decimals — division/subtraction on decimal
 * quotes manufactures float tails (0.8949999999999996) that render verbatim
 * and false-positive T-08's frozen-value heuristics. Pure, order-preserving.
 */
function quantized(series: SeriesPoint[], dp: number): SeriesPoint[] {
  const f = 10 ** dp;
  return series.map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
}

/**
 * 2026-10-21 data-integrity round: the monthly CHANGE series of a level
 * series (PAYEMS → nonfarm payrolls print, in the level's own units —
 * thousands of jobs). Pure: one output point per consecutive input pair,
 * dated at the LATER observation, ascending preserved, first point dropped.
 */
function monthlyChangeSeries(series: SeriesPoint[]): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]!;
    const curr = series[i]!;
    out.push({ date: curr.date, value: curr.value - prev.value });
  }
  return out;
}

/** Union-merge two series by date (later list wins on collision), sorted. */
export function mergeSeries(a: SeriesPoint[], b: SeriesPoint[]): SeriesPoint[] {
  const byDate = new Map<string, SeriesPoint>();
  for (const p of a) byDate.set(p.date, p);
  for (const p of b) byDate.set(p.date, p);
  return [...byDate.values()].sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

/**
 * M7 (2026-10-26): the NBS series union — committed seed, then stored
 * accumulation, then the fetched release(s), each layer winning date
 * collisions over the last (the fetched value is the publisher's freshest
 * print; the layers below it carry the history the release tables no
 * longer do). undefined when every layer is absent (the card reads
 * unavailable — never a partial guess).
 */
export function nbsUnionSeries(
  seed: SeriesPoint[] | undefined,
  stored: SeriesPoint[] | undefined,
  fetched: SeriesPoint[] | undefined,
): SeriesPoint[] | undefined {
  let out: SeriesPoint[] = [];
  for (const layer of [seed, stored, fetched]) {
    if (layer !== undefined && layer.length > 0) out = mergeSeries(out, layer);
  }
  return out.length > 0 ? out : undefined;
}

/**
 * The Brent gap-fill (2026-10-12): FRED's EIA spot series stays verbatim and
 * Yahoo's daily closes extend it STRICTLY past FRED's last date — a lagging
 * EIA batch never overwrites fresher market truth, and Yahoo never rewinds
 * or rewrites the official spot prints (when FRED later publishes those
 * dates, FRED wins again on the overlap and the series self-corrects).
 */
export function fillBrentGap(fred: SeriesPoint[], yahoo: SeriesPoint[] | undefined): SeriesPoint[] {
  if (yahoo === undefined || yahoo.length === 0) return fred;
  const lastFredDate = fred[fred.length - 1]?.date;
  if (lastFredDate === undefined) return yahoo;
  const extension = yahoo.filter((p) => p.date > lastFredDate);
  return extension.length === 0 ? fred : [...fred, ...extension];
}

/**
 * Append a live point dated `today`. Order rules:
 *  - history strictly newer than `today` → keep history (a lagging live
 *    source must never rewind the series);
 *  - history dated exactly `today` → REPLACE the value: this run's live
 *    fetch is the day's freshest observation, and the stored same-day
 *    point came from an earlier run of the same day. Production evidence
 *    (2026-10-08): the seeded price rows kept the first-of-day price
 *    while the unseeded gold-silver ratio carried the live one, so cards
 *    stamped the same date disagreed — 4136.20 / 60.17 on the board vs a
 *    69.97 ratio (68.74 implied);
 *  - otherwise append.
 */
function withLivePoint(series: SeriesPoint[], today: string, value: number): SeriesPoint[] {
  const last = series[series.length - 1];
  if (last && last.date > today) return series; // stale live source vs fresher history — keep history
  if (last && last.date === today) return [...series.slice(0, -1), { date: today, value }];
  return [...series, { date: today, value }];
}

/** One observation, dated today — the honest live-point card series. */
function singlePoint(today: string, value: number): SeriesPoint[] {
  return [{ date: today, value }];
}

/**
 * The Currena dollar-basket series: one basket value per business day where
 * ALL six quote series carry an observation (exact-date inner join — a
 * missing currency makes the day un-computable, never guessed).
 */
function basketSeries(fx: SeriesInputs['fx']): SeriesPoint[] | undefined {
  const lists = BASKET_CURRENCIES.map((c) => fx[c as keyof SeriesInputs['fx']]);
  if (lists.some((l) => l === undefined || l.length === 0)) return undefined;
  const byDate = new Map<string, Record<string, number>>();
  for (let i = 0; i < BASKET_CURRENCIES.length; i++) {
    const code = BASKET_CURRENCIES[i]!;
    const list = lists[i]!;
    for (const p of list) {
      const row = byDate.get(p.date) ?? {};
      row[code] = p.value;
      byDate.set(p.date, row);
    }
  }
  const out: SeriesPoint[] = [];
  for (const [date, row] of byDate) {
    // Every basket currency must be present for the geometric mean (and
    // every weight must have a rate — computeBasketValue enforces it).
    let complete = true;
    for (const code of BASKET_CURRENCIES) {
      if (row[code] === undefined) {
        complete = false;
        break;
      }
    }
    if (!complete) continue;
    try {
      out.push({ date, value: computeBasketValue(row) });
    } catch {
      // A non-positive rate would corrupt the geometric mean — skip the day.
    }
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out.length > 0 ? out : undefined;
}

/** Compose every possible indicator series from the fetched inputs. */
export function buildIndicatorSeries(inputs: SeriesInputs): Partial<Record<IndicatorId, SeriesPoint[]>> {
  const { fred, ecb, boe, fx, wb, abs, rba, today } = inputs;
  const out: Partial<Record<IndicatorId, SeriesPoint[]>> = {};

  const put = (id: IndicatorId, series: SeriesPoint[] | undefined) => {
    if (series !== undefined && series.length > 0) out[id] = series;
  };

  /* ------------- Global — Is borrowing getting costlier? ------------- */
  put('yield-curve-10y2y', fred.T10Y2Y);
  // 2026-10-26 gap-audit build, A-1: the 10y−3m leg (T10Y3M rides the same
  // daily bulk group as T10Y2Y — zero new fetches).
  put('yield-curve-10y3m', fred.T10Y3M);
  put('real-yield-10y', fred.DFII10);
  put('us10y', fred.DGS10);
  // Step-1 audit item A1: the fed-target series is the range's LOWER bound
  // (DFEDTARL); the snapshot builder attaches the upper bound (DFEDTARU)
  // as `rangeHigh` so the card renders the true "3.75–4.00%" corridor.
  put('fed-target', fred.DFEDTARL);
  // M4 Wave 1 (OD-8/D-42, 2026-10-24): the funding leg + the 2y display
  // (the transmission check the rates panel was missing; DGS2 already
  // collected for fed-expectations — the card is a pure surface add).
  put('sofr', fred.SOFR);
  // M6 Wave 3 (2026-10-25): the mortgage leg of the transmission chain —
  // the US household's own borrowing cost (the au-home-loan US twin).
  put('mortgage-30y', fred.MORTGAGE30US);
  put('us-2y', fred.DGS2);
  // M5 Wave 2 (2026-10-24): the euro long end's daily fix — the AAA 10y
  // beside its policy-rate sibling (the OECD bund mirror keeps its honest
  // "monthly average, lagged" stopgap label until the owner's fix-or-retire
  // call in M6).
  put('euro-aaa-10y', ecb?.aaa10y);
  put('ecb-dfr', ecb?.dfr);
  if (fred.A091RC1Q027SBEA && fred.W006RC1Q027SBEA) {
    put(
      'govt-interest-revenue',
      // Defect E-11 (2026-10-16): the share is stored as a PERCENTAGE
      // (33.55), not a fraction labelled '%' — the display scale becomes 1
      // and the export/CSV no longer show 0.335539 under a % header.
      combineSeries(fred.A091RC1Q027SBEA, fred.W006RC1Q027SBEA, (interest, receipts) => (interest / receipts) * 100),
    );
  }
  // Fix spec C-03 (2026-10-14), amended by defect E-15 (2026-10-16): the
  // 2-year yield minus the policy-rate MIDPOINT (L2-08: (DFEDTARL +
  // DFEDTARU)/2) — the lower bound understated the gap by half a step
  // (0.125 pts at the current 25bp corridor).
  // F4 (2026-10-21 precision round): the derived gap is quantized to 4
  // decimals — raw IEEE subtraction prints 0.8949999999999996 (4.645 −
  // 3.875), which the card shows verbatim AND which trips T-08's
  // frozen-value heuristic (decimalsOf ≥ 3 → cross-day 6-decimal compare).
  // Rates are quoted at 2–3 decimals in reality; 4dp keeps every honest
  // digit while collapsing the float-noise class. The same quantization
  // guards the other points-based derived gaps below.
  if (fred.DGS2 && fred.DFEDTARL && fred.DFEDTARU) {
    const mid = combineSeries(fred.DFEDTARL, fred.DFEDTARU, (lower, upper) => (lower + upper) / 2);
    put('fed-expectations', quantized(combineSeries(fred.DGS2, mid, (two, policy) => two - policy), 4));
  }
  // Fix spec C-04 (2026-10-14): the US 30-year Treasury yield.
  put('us30y', fred.DGS30);
  // 2026-10-21 data-integrity round: the sovereign-yield + policy-rate
  // coverage (context rows — never gauge voters). The OECD monthly
  // benchmarks (Bund/JGB/Gilt) and the overnight-rate averages that track
  // the BoJ/BoE policy settings (IRSTCI01*: Japan's uncollateralized
  // overnight call rate ≈ the BoJ target; the UK's ≈ the Bank Rate).
  // Private-only cards: every IRLTLT01*/IRSTCI01* series carries FRED's
  // "copyright-citation-required" tag (T-16 scanned 2026-10-21).
  put('bund-10y', fred.IRLTLT01DEM156N);
  // A-2 (2026-10-26 gap-audit build): jgb-10y upgrades to the MOF's own
  // DAILY file — the OECD mirror (IRLTLT01JPM156N) retires to the labelled
  // fallback it always was (rung2.jgbMirror; the main rung passes nothing
  // and the reading carries forward until the 04:20 phase refreshes it).
  put('jgb-10y', inputs.rung2?.jgb10y ?? inputs.rung2?.jgbMirror);
  put('gilt-10y', fred.IRLTLT01GBM156N);
  put('boj-rate', fred.IRSTCI01JPM156N);
  put('boe-rate', boe === undefined ? undefined : boeBankRateDaily(boe.bankRateDecisions));

  /* ---------------- Global — Are prices heating up? ---------------- */
  if (fred.CPIAUCNS) put('us-cpi-yoy', yoyPctSeries(fred.CPIAUCNS));
  if (fred.CPILFENS) put('us-cpi-core-yoy', yoyPctSeries(fred.CPILFENS));
  // M4 Wave 1 (OD-8/D-42): the Fed's preferred gauge — core PCE YoY from
  // the PCEPILFE index, the same derived 12-month % change as CPI.
  if (fred.PCEPILFE) put('us-pce-core-yoy', yoyPctSeries(fred.PCEPILFE));
  // M6 Wave 3 (2026-10-25): the euro area's inflation — the annual rate
  // direct from the new ECB HICP dataset (no derivation; the ANR obs IS
  // the yearly change) + the 5y spot breakeven and the wage leg.
  put('euro-hicp', ecb?.hicp);
  put('t5yie', fred.T5YIE);
  if (fred.AHETPI) put('us-wages', yoyPctSeries(fred.AHETPI));
  // M5 Wave 2 (2026-10-24): the household-cost staples from the SAME
  // Pink Sheet download (zero new requests) — the Food index from the
  // Monthly Indices sheet, the grains from the Monthly Prices sheet.
  put('food-index', inputs.wb?.foodIndex);
  put('wheat', wb?.wheat);
  put('maize', wb?.maize);
  put('breakeven-5y5y', fred.T5YIFR);
  // M4 Wave 1 (OD-8/D-42): the 10y breakeven leaves validation-only and
  // becomes a context card (the series was already collected for T-01).
  put('breakeven-10y', fred.T10YIE);
  // 2026-10-21 data-integrity round: the two EIA energy spots ride the
  // same FRED bulk request as Brent's spot — context rows in the prices
  // lane beside Brent's own scored card (never prices-board tiles; the
  // board's four-tile layout is spec-fixed).
  put('wti', fred.DCOILWTICO);
  put('natgas', fred.DHHNGSP);

  /* ---------------- Global — Are markets nervous? ---------------- */
  put('stress-stlfsi', fred.STLFSI4);
  // M6 Wave 3 (2026-10-25): the liquidity level beside the plumbing gauges.
  put('walcl', fred.WALCL);
  put('nfci', fred.NFCI);
  // Step-2 add-list §B5: the Cboe VIX close (daily, full history — the
  // stored history keeps the 10-year daily window the Step-3 verdicts
  // will compute their calm/nervous thresholds from).
  put('vix', fred.VIXCLS);
  if (inputs.xauSpot && inputs.xagSpot) {
    if (wb) {
      const history = combineSeries(wb.gold, wb.silver, (g, s) => g / s);
      put(
        'gold-silver',
        withLivePoint(
          mergeSeries(history, inputs.seedHistory?.['gold-silver'] ?? []),
          today,
          inputs.xauSpot.price / inputs.xagSpot.price,
        ),
      );
    } else {
      put('gold-silver', singlePoint(today, inputs.xauSpot.price / inputs.xagSpot.price));
    }
  } else if (wb) {
    put('gold-silver', combineSeries(wb.gold, wb.silver, (g, s) => g / s));
  }

  /* ---------------- Global — Is the dollar strong? ---------------- */
  put('dollar-basket', basketSeries(fx));
  put('usdjpy', fx.JPY);
  // 2026-10-26 gap-audit build, A-3: the US−Japan 10-year yield gap —
  // DGS10 − the MOF daily 10Y (both parents collected; inner join on
  // common dates, quantized 4dp). Only derivable when the rung-2 inputs
  // carry a jgb series (the Node venue's inline collection / a future
  // armed context); the Worker's 04:20 phase derives its own copy from
  // the stage + MOF fetch.
  if (fred.DGS10 && inputs.rung2?.jgb10y !== undefined) {
    put(
      'us-japan-10y-gap',
      quantized(combineSeries(fred.DGS10, inputs.rung2.jgb10y, (us, jp) => us - jp), 4),
    );
  }
  put('eur-usd', fx.EUR);
  // M5 Wave 2 (2026-10-24): the EM-pressure first member — the dollar
  // against the Turkish lira (context; the fx-module EM block may follow
  // in a later round once TRY proves the slot).
  put('usdtry', fx.TRY);
  // nzd-usd retired 2026-10-23 (OD-7, D-42): an indicator card for an
  // audience that doesn't exist — no replacement, the Frankfurter request
  // drops the NZD leg again.

  /* ---------------- Global — Is growth healthy? ---------------- */
  put('china-pmi', nbsUnionSeries(inputs.chinaPmi, inputs.nbsStored?.['china-pmi'], inputs.nbs?.pmi));
  put('china-cpi', nbsUnionSeries(inputs.chinaCpi, inputs.nbsStored?.['china-cpi'], inputs.nbs?.cpi));
  // Step 3 L1-18 (2026-10-16): the crypto Fear and Greed index — CONTEXT
  // ONLY (rule info; L3-03 forbids composite sentiment scores, and the
  // card never presents the index as a signal).
  put('crypto-fng', inputs.cryptoFng);
  // 2026-10-21c owner round: the eth-usd card (EODHD crypto context row,
  // 2026-10-21 data-integrity round) is RETIRED — the owner's verdict: not
  // a market-stress indicator. The prices board carries crypto prices.
  // Step 3 L1-14 / FS-06 (v3, 2026-10-20): the Shiller cards read the
  // publisher's own columns from the converted bulk file — never recomputed.
  put('shiller-cape', inputs.shiller?.cape);
  put('shiller-ecy', inputs.shiller?.ecy);
  put('m2-us', fred.M2SL);
  // Step-2 add-list §B3/§B4: the US labour-market pair — the unemployment
  // LEVEL and the Sahm recession alarm, both straight from FRED (monthly,
  // full history) so their stored histories cover the 10-year window.
  put('us-unemployment', fred.UNRATE);
  put('sahm-rule', fred.SAHMREALTIME);
  // M4 Wave 1 (OD-8/D-42, 2026-10-24): the early-warning pack's labor /
  // probability / sentiment legs — claims (weekly level, raw counts), the
  // Chauvet recession probability (stored as the published fraction; the
  // display scales ×100), Michigan sentiment + its 1y-expectations
  // companion (both rendered on the michigan-sentiment card).
  put('initial-jobless-claims', fred.ICSA);
  put('recession-probability', fred.RECPROUSM156N);
  put('michigan-sentiment', fred.UMCSENT);
  // M6 Wave 3 (2026-10-25): the leading-edge batch — the consumption pulse,
  // the long-leading housing signal, the composite activity gauge and the
  // Powell-era labor leading edge.
  put('retail-sales', fred.RSAFS);
  put('housing-permits', fred.PERMIT);
  put('cfnai', fred.CFNAI);
  put('job-openings', fred.JTSJOL);
  put('michigan-1y-expectations', fred.MICH);
  // Fix spec C-05 (2026-10-14): the Philadelphia Fed manufacturing index.
  put('philly-fed', fred.GACDFSA066MSFRBPHI);
  if (wb) put('copper-gold', combineSeries(wb.copper, wb.gold, (c, g) => c / g));
  put('usdcny', fx.CNY);
  // 2026-10-21 data-integrity round: growth coverage — the quarterly real
  // GDP growth rate straight from FRED (already QoQ annualized percent),
  // and the monthly nonfarm-payrolls CHANGE derived from the PAYEMS level
  // (the NFP print the market watches; value in thousands of jobs).
  put('us-gdp-growth', fred.A191RL1Q225SBEA);
  put('us-nfp', fred.PAYEMS !== undefined ? monthlyChangeSeries(fred.PAYEMS) : undefined);
  // Platinum: the precious/industrial metal from the SAME Pink Sheet
  // workbook the other metals ride (zero extra requests, L1 licence).
  // M6 Wave 3 (2026-10-25): the platinum CADENCE FIX — the gold-usd
  // recipe on XPT (USD per troy ounce, no unit conversion needed): the
  // Pink Sheet monthly history stays the percentile base, the live spot
  // rides today's point, and the accumulated seeds (SEED_IDS) make the
  // 7/30-day changes measurable between monthly prints.
  if (inputs.xptSpot) {
    const base = wb
      ? mergeSeries(wb.platinum, inputs.seedHistory?.['platinum'] ?? [])
      : (inputs.seedHistory?.['platinum'] ?? []);
    put(
      'platinum',
      base.length > 0 ? withLivePoint(base, today, inputs.xptSpot.price) : singlePoint(today, inputs.xptSpot.price),
    );
  } else if (wb) {
    put('platinum', mergeSeries(wb.platinum, inputs.seedHistory?.['platinum'] ?? []));
  }

  /* ------------- Global — Prices board (not a gauge) ------------- */
  // Brent: EIA spot (FRED) extended past its last published date by Yahoo's
  // BZ=F daily closes (the 2026-10-12 stale-oil fix — see fillBrentGap). The
  // Yahoo-alone rung covers a total FRED outage; the World Bank monthly
  // stays the last resort (03-data-sources.md lists the Pink Sheet as
  // serving Brent too).
  put('brent', fred.DCOILBRENTEU !== undefined ? fillBrentGap(fred.DCOILBRENTEU, inputs.brentYahoo) : undefined);
  if (out.brent === undefined && inputs.brentYahoo !== undefined) put('brent', inputs.brentYahoo);
  if (out.brent === undefined && wb) put('brent', wb.brent);

  // Gold (fix B-01): the Yahoo 10-year daily closes are the value history;
  // today's gold-api spot stamps the live point; the WB monthly and any
  // accumulated seeds only cover a Yahoo outage.
  {
    const yahoo = inputs.yahooHistories?.['gold-usd'];
    const fallback = wb
      ? mergeSeries(wb.gold, inputs.seedHistory?.['gold-usd'] ?? [])
      : (inputs.seedHistory?.['gold-usd'] ?? []);
    const base = yahoo !== undefined && yahoo.points.length > 0 ? yahoo.points : fallback;
    if (inputs.xauSpot) {
      put(
        'gold-usd',
        base.length > 0 ? withLivePoint(base, today, inputs.xauSpot.price) : singlePoint(today, inputs.xauSpot.price),
      );
    } else if (base.length > 0) {
      put('gold-usd', base);
    }
  }

  // Silver: same recipe with XAG.
  {
    const yahoo = inputs.yahooHistories?.['silver-usd'];
    const fallback = wb
      ? mergeSeries(wb.silver, inputs.seedHistory?.['silver-usd'] ?? [])
      : (inputs.seedHistory?.['silver-usd'] ?? []);
    const base = yahoo !== undefined && yahoo.points.length > 0 ? yahoo.points : fallback;
    if (inputs.xagSpot) {
      put(
        'silver-usd',
        base.length > 0 ? withLivePoint(base, today, inputs.xagSpot.price) : singlePoint(today, inputs.xagSpot.price),
      );
    } else if (base.length > 0) {
      put('silver-usd', base);
    }
  }
  // Copper: live HG (USD/lb) converted to USD/mt so it joins the World Bank
  // monthly history and the accumulated dailies in one consistent unit.
  if (inputs.hgSpot) {
    const livePerTonne = inputs.hgSpot.price * COPPER_LB_PER_TONNE;
    const base = wb
      ? mergeSeries(wb.copper, inputs.seedHistory?.['copper-usd'] ?? [])
      : (inputs.seedHistory?.['copper-usd'] ?? []);
    put(
      'copper-usd',
      base.length > 0
        ? withLivePoint(base, today, livePerTonne)
        : singlePoint(today, livePerTonne),
    );
  } else if (wb) {
    put('copper-usd', mergeSeries(wb.copper, inputs.seedHistory?.['copper-usd'] ?? []));
  }

  // 2026-10-26 gap-audit build, A-4: gold measured in oil — the value
  // ratio on the two assembled price series' common dates (gold-usd's
  // daily closes ∪ brent's EIA+Yahoo dailies). 2dp quantized; CONTEXT.
  if (out['gold-usd'] !== undefined && out.brent !== undefined) {
    const f = 100;
    put(
      'gold-oil-ratio',
      combineSeries(out['gold-usd'], out.brent, (g, o) => Math.round((g / o) * f) / f),
    );
  }

  // Bitcoin (fix B-01): the Yahoo 10-year daily closes are the value
  // history; the gold-api spot stamps today's point; accumulated seeds only
  // cover a Yahoo outage. (The 10-year position now EXISTS — the data spec's
  // "no multi-year history" note no longer applies.)
  {
    const yahoo = inputs.yahooHistories?.['btc-usd'];
    const btcBase = yahoo !== undefined && yahoo.points.length > 0 ? yahoo.points : (inputs.seedHistory?.['btc-usd'] ?? []);
    put(
      'btc-usd',
      inputs.btcSpot
        ? btcBase.length > 0
          ? withLivePoint(btcBase, today, inputs.btcSpot.price)
          : singlePoint(today, inputs.btcSpot.price)
        : btcBase.length > 0
          ? btcBase
          : undefined,
    );
  }

  // Context ratios under the Bitcoin price row (PB2: "context only, not
  // used in signals"). silver-btc retired 2026-10-23 (OD-7, D-42) — the
  // weaker twin; gold-btc stays.
  if (inputs.xauSpot && inputs.btcSpot) {
    put('gold-btc', singlePoint(today, inputs.xauSpot.price / inputs.btcSpot.price));
  }

  /* -------- Australia — Are inflation and rates a problem? -------- */
  if (abs?.cpiIndex) put('au-cpi', yoyPctSeries(abs.cpiIndex));
  if (abs?.trimmedMeanIndex) put('au-trimmed-mean', yoyPctSeries(abs.trimmedMeanIndex));
  // Step-2 add-list §B2: the AU 10-year yield card (RBA F2 FCMYGBAG10D —
  // the same series the gap card subtracts, now also its own scored card).
  put('au-10y', rba?.au10y);
  // Fix spec C-06 (2026-10-14): the 3-year bond yield minus the cash rate.
  // F4: quantized (the fed-expectations twin — float tails otherwise trip
  // T-08 and render as 0.30900000000000016-style noise).
  if (rba?.au3y && rba?.cashRate) {
    put('rba-expectations', quantized(combineSeries(rba.au3y, rba.cashRate, (three, cash) => three - cash), 4));
  }
  if (rba?.au10y && fred.DGS10) {
    put('au-us-10y-gap', quantized(combineSeries(rba.au10y, fred.DGS10, (au, us) => au - us), 4));
  }
  // 2026-10-26 gap-audit build, A-5: the RBA−Fed POLICY-rate gap — the
  // cash-rate target minus the Fed corridor midpoint (the E-15 basis:
  // (DFEDTARL + DFEDTARU)/2, the same mid fed-expectations subtracts).
  // Per-change: the series steps only on decisions, like rba-cash-rate.
  // F4 quantization: raw subtraction manufactures float tails
  // (4.60 − 3.875 = 0.7249999999999996) that render verbatim and trip T-08.
  if (rba?.cashRate && fred.DFEDTARL && fred.DFEDTARU) {
    const fedMid = combineSeries(fred.DFEDTARL, fred.DFEDTARU, (lower, upper) => (lower + upper) / 2);
    put('rba-fed-gap', quantized(combineSeries(rba.cashRate, fedMid, (rba, fed) => rba - fed), 4));
  }
  // Step-1 audit item A4: `cashRate` prefers the DAILY F1 target (a
  // decision-day move shows at once — the Sep-2026 hike reads 4.60% from
  // its effective date); collect.ts already falls back to the F1.1 monthly
  // average when the daily table fails to parse.
  put('rba-cash-rate', rba?.cashRate);
  // Step-2 add-list §B7: the real savings rate (F4.1 PDRNTH).
  put('au-deposit-rate', rba?.depositRateNewTermHouseholds);
  if (abs?.automotiveFuelIndex) put('au-petrol-yoy', yoyPctSeries(abs.automotiveFuelIndex));

  /* -------- Australia — Are households under pressure? -------- */
  put('au-home-loan', rba?.homeLoanOutstanding);
  if (abs?.wageIndex) put('au-wage-growth', yoyPctSeries(abs.wageIndex));
  if (abs?.rentIndex) put('au-rent-yoy', yoyPctSeries(abs.rentIndex));
  put('au-unemployment', abs?.unemployment);
  // M6 Wave 3 (2026-10-25): the AU leading-edge trio — the mortgage
  // pipeline (scored on YoY), the hunkering-down gauge and the vacancies.
  put('au-housing-finance', abs?.housingFinance);
  put('au-saving-ratio', abs?.savingRatio);
  put('au-job-vacancies', abs?.jobVacancies);
  put('au-home-values', abs?.resDwellMeanPrice);
  put('au-household-debt-arrears', rba?.householdDebtRatio);

  /* -------- Australia — How is trade and the currency? -------- */
  if (fx.AUD) put('audusd', invert(fx.AUD));
  if (fx.JPY && fx.AUD) {
    put('audjpy', combineSeries(fx.JPY, fx.AUD, (jpy, aud) => jpy / aud));
  }
  put('terms-of-trade', abs?.termsOfTrade);
  put('iron-ore', wb?.ironOre);
  if (inputs.xauSpot && fx.AUD && fx.AUD.length > 0) {
    const lastAud = fx.AUD[fx.AUD.length - 1]!;
    put('gold-aud', singlePoint(today, inputs.xauSpot.price * lastAud.value));
  }

  return out;
}

/**
 * Fix spec B-01 (2026-10-14): the price rows' full-history PEAKS — the
 * metals and Bitcoin read their Yahoo daily HIGH series (the record basis);
 * Brent reads its own close-based series (FRED EIA spot + the BZ=F
 * extension — the spec's "do not mix intraday peaks with closing prices").
 * Each peak carries its value, date and basis so the card can state all
 * three; the T-05 record floors verify them.
 */
export function computePeaks(
  inputs: SeriesInputs,
  /** The assembled Brent series (EIA spot ∪ BZ=F gap-fill — buildIndicatorSeries' output) — its close-peak is the card's record. */
  brentSeries?: readonly SeriesPoint[],
): Partial<Record<IndicatorId, { value: number; date: string; basis: 'daily-high' | 'daily-close' }>> {
  const peaks: Partial<Record<IndicatorId, { value: number; date: string; basis: 'daily-high' | 'daily-close' }>> = {};
  // The record is the highest DAILY HIGH (its own date — the max high can
  // land on a different day than the max close); a response without highs
  // falls back to the highest close.
  const fromHigh = (quote: YahooQuote | undefined): { value: number; date: string } | undefined => {
    if (quote === undefined) return undefined;
    let best: { value: number; date: string } | undefined;
    if (quote.highs !== undefined) {
      for (const [date, high] of quote.highs) {
        if (best === undefined || high > best.value) best = { value: high, date };
      }
      if (best !== undefined) return best;
    }
    for (const point of quote.points) {
      if (best === undefined || point.value > best.value) best = point;
    }
    return best;
  };
  const gold = fromHigh(inputs.yahooHistories?.['gold-usd']);
  if (gold) peaks['gold-usd'] = { ...gold, basis: 'daily-high' };
  const silver = fromHigh(inputs.yahooHistories?.['silver-usd']);
  if (silver) peaks['silver-usd'] = { ...silver, basis: 'daily-high' };
  const btc = fromHigh(inputs.yahooHistories?.['btc-usd']);
  if (btc) peaks['btc-usd'] = { ...btc, basis: 'daily-high' };
  // Brent: the highest CLOSE of the assembled series (EIA spot + BZ=F
  // gap-fill), constrained to the same 10-year window the stored history
  // keeps — the card says "10-year peak", so a 2008 record outside the
  // stored window is not the claim being made (the 2026-04-07 138.21 close
  // is the window's own record; T-05's 127 floor still passes). The
  // Yahoo-only fallback covers a missing FRED fetch (a short, honest peak
  // the T-05 test flags anyway).
  const brentSource = brentSeries ?? inputs.brentYahoo;
  const brent =
    brentSource !== undefined && brentSource.length > 0
      ? brentSource
          .filter((p) => p.date >= addDays(brentSource[brentSource.length - 1]!.date, -PERCENTILE_WINDOW_DAYS))
          .reduce((best, p) => (best === undefined || p.value > best.value ? p : best), undefined as SeriesPoint | undefined)
      : undefined;
  if (brent) peaks.brent = { value: brent.value, date: brent.date, basis: 'daily-close' };
  return peaks;
}

/**
 * Fix spec B-19 (2026-10-14): the year of the last time the value was this
 * high, found by searching the full stored history backward from the newest
 * observation — a 10-year window cannot say "highest since 2002".
 *
 * Episode-aware (live-run evidence 2026-10-15): the backward search first
 * SKIPS the trailing run at approximately the current level (±2%) — the
 * current move itself. Without the skip, a reading that sits a hair under
 * its own recent high claims "highest since {this year}" — true and
 * useless (the 10-year at 5.21 under October's own 5.31). With it, the
 * claim names the last INDEPENDENT time the level was reached. Returns
 * undefined when no multi-year claim is honest (the level was also reached
 * within the reading's own year, or the history is too short).
 */
export function computeHighestSinceYear(series: readonly SeriesPoint[]): number | undefined {
  if (series.length < 2) return undefined;
  const current = series[series.length - 1]!;
  const currentYear = Number(current.date.slice(0, 4));
  // 1. Skip the trailing episode: the contiguous run within ±2% of the
  //    current level (a 2% band: the yield cluster of one move, not the
  //    decade's highs).
  const floor = current.value * 0.98;
  const ceiling = current.value * 1.02;
  let i = series.length - 2;
  while (i >= 0 && series[i]!.value >= floor && series[i]!.value <= ceiling) i--;
  // 2. The last independent time the level was reached.
  for (; i >= 0; i--) {
    if (series[i]!.value >= current.value) {
      const year = Number(series[i]!.date.slice(0, 4));
      // Reached again within the reading's own year (after the episode) —
      // no multi-year claim is honest; say nothing.
      return year >= currentYear ? undefined : year;
    }
  }
  // 3. Nothing before the episode ever reached this level — the current
  //    value is the highest of the whole stored history; the first
  //    observation's year is the honest floor (and only when it is a
  //    genuinely earlier year).
  const firstYear = Number(series[0]!.date.slice(0, 4));
  return firstYear < currentYear ? firstYear : undefined;
}

/**
 * The aux-series wiring for `below-aux` rules (I15): wage growth compares
 * against the au-cpi yearly series — the runner passes this map's au-cpi
 * entry to computeReading. Kept next to the composition so the pairing is
 * visible where the series are built.
 */
export const AUX_RULE_WIRING: Readonly<
  Partial<Record<IndicatorId, (series: Partial<Record<IndicatorId, SeriesPoint[]>>) => SeriesPoint[] | undefined>>
> = {
  'au-wage-growth': (series) => series['au-cpi'],
};

/**
 * The BoE decision rows expanded to the daily F1-shaped step series
 * (undefined when the page fetch failed — the slot then reads the stored
 * history like every other failed source).
 */
function boeBankRateDaily(decisions: readonly SeriesPoint[] | undefined): SeriesPoint[] | undefined {
  if (decisions === undefined || decisions.length === 0) return undefined;
  return boeBankRateDailySeries(decisions);
}

/**
 * Card source attribution (name + URL) per indicator — what computeReading
 * stamps onto every reading ("Updated [date] · Source [name]"). Providers
 * requiring attribution (ABS, RBA, World Bank, ECB — CC BY / attribution
 * terms) are credited on the card AND in About-the-data (03-data-sources.md
 * §3 + the FRED notice, UI Block N1).
 */
export const READING_SOURCES: Readonly<Partial<Record<IndicatorId, { name: string; url?: string }>>> = {
  'yield-curve-10y2y': {
    name: 'Federal Reserve Bank of St. Louis via FRED (T10Y2Y)',
    url: 'https://fred.stlouisfed.org/series/T10Y2Y',
  },
  // 2026-10-26 gap-audit build, A-1.
  'yield-curve-10y3m': {
    name: 'Federal Reserve Bank of St. Louis via FRED (T10Y3M)',
    url: 'https://fred.stlouisfed.org/series/T10Y3M',
  },
  'real-yield-10y': { name: 'FRED (DFII10)', url: 'https://fred.stlouisfed.org/series/DFII10' },
  us10y: { name: 'FRED (DGS10)', url: 'https://fred.stlouisfed.org/series/DGS10' },
  'fed-target': { name: 'FRED (DFEDTARL/U)', url: 'https://fred.stlouisfed.org/series/DFEDTARU' },
  'ecb-dfr': {
    name: 'ECB Data Portal (DFR)',
    url: 'https://data.ecb.europa.eu/data/datasets/FM/B.EUR.4F.KR.DFR.LEV',
  },
  // M5 Wave 2 (2026-10-24) — the euro long end + the household-cost staples.
  'euro-aaa-10y': {
    name: 'ECB Data Portal (euro-area AAA 10-year yield)',
    url: 'https://data.ecb.europa.eu/data/datasets/YC/YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y',
  },
  'food-index': { name: 'The World Bank: Commodity Markets (Pink Sheet, Food index)', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  wheat: { name: 'The World Bank: Commodity Markets (Pink Sheet, Wheat US SRW)', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  maize: { name: 'The World Bank: Commodity Markets (Pink Sheet, Maize)', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  usdtry: { name: 'Frankfurter (ECB USD→TRY reference rate)', url: 'https://frankfurter.dev' },
  'govt-interest-revenue': { name: 'FRED (BEA series, derived)', url: 'https://fred.stlouisfed.org/series/A091RC1Q027SBEA' },
  'fed-expectations': { name: 'FRED (DGS2 − policy-rate midpoint)', url: 'https://fred.stlouisfed.org/series/DGS2' },
  us30y: { name: 'FRED (DGS30)', url: 'https://fred.stlouisfed.org/series/DGS30' },
  'philly-fed': {
    name: 'Philadelphia Fed via FRED (GACDFSA066MSFRBPHI)',
    url: 'https://fred.stlouisfed.org/series/GACDFSA066MSFRBPHI',
  },
  'us-cpi-yoy': { name: 'FRED (CPIAUCNS, not seasonally adjusted)', url: 'https://fred.stlouisfed.org/series/CPIAUCNS' },
  'us-cpi-core-yoy': { name: 'FRED (CPILFENS, not seasonally adjusted)', url: 'https://fred.stlouisfed.org/series/CPILFENS' },
  // M4 Wave 1 (OD-8/D-42, 2026-10-24) — the early-warning pack's sources.
  'initial-jobless-claims': {
    name: 'US Department of Labor via FRED (ICSA)',
    url: 'https://fred.stlouisfed.org/series/ICSA',
  },
  sofr: { name: 'New York Fed via FRED (SOFR)', url: 'https://fred.stlouisfed.org/series/SOFR' },
  'recession-probability': {
    name: 'FRED (RECPROUSM156N, Marcelle-Chauvet smoothed recession probability)',
    url: 'https://fred.stlouisfed.org/series/RECPROUSM156N',
  },
  'michigan-sentiment': {
    name: 'University of Michigan via FRED (UMCSENT)',
    url: 'https://fred.stlouisfed.org/series/UMCSENT',
  },
  'michigan-1y-expectations': {
    name: 'University of Michigan via FRED (MICH)',
    url: 'https://fred.stlouisfed.org/series/MICH',
  },
  'us-pce-core-yoy': { name: 'FRED (PCEPILFE, 12-month % change)', url: 'https://fred.stlouisfed.org/series/PCEPILFE' },
  'us-2y': { name: 'FRED (DGS2)', url: 'https://fred.stlouisfed.org/series/DGS2' },
  'breakeven-10y': { name: 'FRED (T10YIE)', url: 'https://fred.stlouisfed.org/series/T10YIE' },
  // M6 Wave 3 (OD-8/D-42, 2026-10-25) — the leading-edge batch's sources.
  'mortgage-30y': {
    name: 'Freddie Mac via FRED (MORTGAGE30US)',
    url: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
  },
  walcl: { name: 'Federal Reserve via FRED (WALCL, H.41 table)', url: 'https://fred.stlouisfed.org/series/WALCL' },
  'retail-sales': {
    name: 'US Census Bureau via FRED (RSAFS)',
    url: 'https://fred.stlouisfed.org/series/RSAFS',
  },
  'housing-permits': {
    name: 'US Census Bureau via FRED (PERMIT)',
    url: 'https://fred.stlouisfed.org/series/PERMIT',
  },
  cfnai: { name: 'Chicago Fed via FRED (CFNAI)', url: 'https://fred.stlouisfed.org/series/CFNAI' },
  'job-openings': { name: 'US Bureau of Labor Statistics via FRED (JTSJOL)', url: 'https://fred.stlouisfed.org/series/JTSJOL' },
  t5yie: { name: 'Federal Reserve Bank of St. Louis via FRED (T5YIE)', url: 'https://fred.stlouisfed.org/series/T5YIE' },
  'us-wages': { name: 'US Bureau of Labor Statistics via FRED (AHETPI, 12-month % change)', url: 'https://fred.stlouisfed.org/series/AHETPI' },
  'euro-hicp': {
    name: 'ECB Data Portal / Eurostat (HICP annual rate)',
    url: 'https://data.ecb.europa.eu/data/datasets/ICP/ICP.M.U2.N.000000.4.ANR',
  },
  'au-housing-finance': {
    name: 'Australian Bureau of Statistics (LEND_HOUSING, new housing loan commitments)',
    url: 'https://data.api.abs.gov.au/rest/data/LEND_HOUSING/FIN_VAL.NEWCOMMITS.DV8368.TOTDWELL.TOT.TOT.20.AUS.Q',
  },
  'au-saving-ratio': {
    name: 'Australian Bureau of Statistics (ANA_AGG, household saving ratio)',
    url: 'https://data.api.abs.gov.au/rest/data/ANA_AGG/M7.HSR.20.AUS.Q',
  },
  'au-job-vacancies': {
    name: 'Australian Bureau of Statistics (JV, job vacancies)',
    url: 'https://data.api.abs.gov.au/rest/data/JV/M1.7.TOT.20.AUS.Q',
  },
  'breakeven-5y5y': {
    name: 'Federal Reserve Bank of St. Louis via FRED (T5YIFR)',
    url: 'https://fred.stlouisfed.org/series/T5YIFR',
  },
  'stress-stlfsi': { name: 'St. Louis Fed via FRED (STLFSI4)', url: 'https://fred.stlouisfed.org/series/STLFSI4' },
  nfci: { name: 'Chicago Fed via FRED (NFCI)', url: 'https://fred.stlouisfed.org/series/NFCI' },
  vix: {
    name: 'Cboe via FRED (VIXCLS)',
    url: 'https://fred.stlouisfed.org/series/VIXCLS',
  },
  'crypto-fng': {
    name: 'Alternative.me (Crypto Fear and Greed Index)',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
  },
  'shiller-cape': {
    name: 'Robert Shiller, Irrational Exuberance data (ie_data.xls)',
    url: 'https://shillerdata.com/', // the provider's current home (https, verified 2026-10-20); the Yale mirror is http-only
  },
  'shiller-ecy': {
    name: 'Robert Shiller, Irrational Exuberance data (ie_data.xls)',
    url: 'https://shillerdata.com/',
  },
  'gold-silver': { name: 'gold-api.com (history: The World Bank Pink Sheet)', url: 'https://www.gold-api.com' },
  'dollar-basket': {
    name: 'Currena basket (ECB rates via Frankfurter)',
    url: 'https://frankfurter.dev',
  },
  usdjpy: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  // 2026-10-26 gap-audit build, A-3.
  'us-japan-10y-gap': {
    name: 'FRED (DGS10) − Japan Ministry of Finance (jgbcme 10Y)',
    url: 'https://fred.stlouisfed.org/series/DGS10',
  },
  'eur-usd': { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  // 2026-10-21 data-integrity round — the coverage additions' attributions.
  wti: { name: 'FRED (EIA WTI spot)', url: 'https://fred.stlouisfed.org/series/DCOILWTICO' },
  // 2026-10-26 gap-audit build, A-6/A-7.
  'eia-crude-stocks': {
    name: 'U.S. Energy Information Administration (crude oil ending stocks, WCRSTUS1)',
    url: 'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRSTUS1&f=W',
  },
  'cftc-gold-positioning': {
    name: 'U.S. Commodity Futures Trading Commission (Commitments of Traders, gold)',
    url: 'https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm',
  },
  natgas: { name: 'FRED (EIA Henry Hub spot)', url: 'https://fred.stlouisfed.org/series/DHHNGSP' },
  platinum: { name: 'gold-api.com (XPT spot; history: World Bank Pink Sheet)', url: 'https://www.gold-api.com' },
  'bund-10y': { name: 'OECD via FRED (IRLTLT01DEM156N)', url: 'https://fred.stlouisfed.org/series/IRLTLT01DEM156N' },
  // A-2 (2026-10-26 gap-audit build): the MOF's own daily file is the
  // primary; the mirror attribution appears only when the fallback fills
  // (the readingSourceOverrides mechanism, the 04:20 phase).
  'jgb-10y': {
    name: 'Japan Ministry of Finance (JGB interest rates, daily)',
    url: 'https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv',
  },
  'gilt-10y': { name: 'OECD via FRED (IRLTLT01GBM156N)', url: 'https://fred.stlouisfed.org/series/IRLTLT01GBM156N' },
  'boj-rate': {
    name: 'OECD via FRED (IRSTCI01JPM156N — Japan overnight call rate)',
    url: 'https://fred.stlouisfed.org/series/IRSTCI01JPM156N',
  },
  'boe-rate': {
    name: 'Bank of England (official Bank Rate history)',
    url: 'https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp',
  },
  'us-gdp-growth': { name: 'FRED (BEA real GDP growth)', url: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA' },
  'us-nfp': { name: 'FRED (BLS PAYEMS, monthly change)', url: 'https://fred.stlouisfed.org/series/PAYEMS' },
  'china-pmi': {
    name: 'National Bureau of Statistics of China (Purchasing Managers Index)',
    url: 'https://www.stats.gov.cn/english/PressRelease/',
  },
  'china-cpi': {
    name: 'National Bureau of Statistics of China (Consumer Price Index)',
    url: 'https://www.stats.gov.cn/english/PressRelease/',
  },
  'm2-us': { name: 'FRED (M2SL)', url: 'https://fred.stlouisfed.org/series/M2SL' },
  'us-unemployment': { name: 'FRED (UNRATE), US BLS', url: 'https://fred.stlouisfed.org/series/UNRATE' },
  'sahm-rule': {
    name: 'FRED (SAHMREALTIME)',
    url: 'https://fred.stlouisfed.org/series/SAHMREALTIME',
  },
  'copper-gold': { name: 'The World Bank Pink Sheet (copper ÷ gold)', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  usdcny: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  brent: {
    name: 'FRED (EIA Brent) + Yahoo Finance (BZ=F)',
    url: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
  },
  // 2026-10-26 gap-audit build, A-4.
  'gold-oil-ratio': {
    name: 'gold-api.com (XAU) ÷ FRED/EIA Brent (both collected)',
    url: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
  },
  'gold-usd': { name: 'gold-api.com (XAU)', url: 'https://www.gold-api.com' },
  'silver-usd': { name: 'gold-api.com (XAG)', url: 'https://www.gold-api.com' },
  'copper-usd': { name: 'gold-api.com (HG, history: The World Bank Pink Sheet)', url: 'https://www.gold-api.com' },
  'btc-usd': { name: 'gold-api.com (BTC)', url: 'https://www.gold-api.com' },
  'gold-btc': { name: 'gold-api.com (XAU ÷ BTC)', url: 'https://www.gold-api.com' },
  'rba-cash-rate': {
    name: 'RBA (Cash Rate Target — F1/decision table)',
    url: 'https://www.rba.gov.au/statistics/cash-rate/',
  },
  'au-10y': {
    name: 'RBA F2/F2.1 (10-year bond yield)',
    url: 'https://www.rba.gov.au/statistics/tables/#f2',
  },
  'au-deposit-rate': {
    name: 'RBA F4.1 (new term deposits)',
    url: 'https://www.rba.gov.au/statistics/tables/#f4-1',
  },
  'au-cpi': { name: 'ABS (monthly CPI All groups)', url: 'https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.M' },
  'au-trimmed-mean': { name: 'ABS (monthly CPI Trimmed Mean)', url: 'https://data.api.abs.gov.au/rest/data/CPI/1.999902.20.50.M' },
  'au-petrol-yoy': {
    name: 'ABS (CPI Automotive fuel)',
    url: 'https://data.api.abs.gov.au/rest/data/CPI/1.40081.10.50.M',
  },
  'au-home-loan': { name: 'RBA F6 (owner-occupier outstanding)', url: 'https://www.rba.gov.au/statistics/tables/' },
  'au-wage-growth': {
    name: 'ABS (Wage Price Index)',
    url: 'https://data.api.abs.gov.au/rest/data/WPI/1.OHRPEB.7.TOT.10.AUS.Q',
  },
  'au-rent-yoy': { name: 'ABS (CPI Rents)', url: 'https://data.api.abs.gov.au/rest/data/CPI/1.115522.10.50.M' },
  audusd: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  audjpy: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  'au-us-10y-gap': { name: 'RBA F2 − FRED (DGS10)', url: 'https://www.rba.gov.au/statistics/tables/' },
  // 2026-10-26 gap-audit build, A-5.
  'rba-fed-gap': {
    name: 'RBA Cash Rate Target − Fed target midpoint (FRED DFEDTARL/U)',
    url: 'https://www.rba.gov.au/statistics/cash-rate/',
  },
  'rba-expectations': { name: 'RBA F2 (FCMYGBAG3D) − RBA F1', url: 'https://www.rba.gov.au/statistics/tables/' },
  'gold-aud': { name: 'gold-api.com × Frankfurter (ECB)', url: 'https://www.gold-api.com' },
  'iron-ore': {
    name: 'The World Bank Pink Sheet — iron ore',
    url: 'https://www.worldbank.org/en/research/commodity-markets',
  },
  'terms-of-trade': { name: 'ABS (ANA_AGG terms of trade)', url: 'https://data.api.abs.gov.au/rest/data/ANA_AGG/M5.TTR.20.AUS.Q' },
  'au-unemployment': { name: 'ABS (Labour Force)', url: 'https://data.api.abs.gov.au/rest/data/LF/M13.3.1599.20.AUS.M' },
  'au-home-values': { name: 'ABS (RES_DWELL_ST)', url: 'https://data.api.abs.gov.au/rest/data/RES_DWELL_ST/5.AUS.Q' },
  'au-household-debt-arrears': { name: 'RBA E2 (household ratios)', url: 'https://www.rba.gov.au/statistics/tables/' },
};
