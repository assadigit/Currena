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
 *  - live-point cards (gold-btc, silver-btc, gold-aud) carry exactly one
 *    observation — honest: no daily history exists in the verified
 *    sources, so no change/percentile is invented;
 *  - TGJU is retired from Insights (unverified licence, data spec §1):
 *    gold comes from gold-api XAU exactly like silver.
 *
 * Total function: whatever provider input is MISSING simply omits the
 * affected indicators (the runner renders those unavailable). Failures
 * belong to the fetch adapters, which throw loudly.
 */

import type { IndicatorId } from '@currena/core';
import { combineSeries, yoyPctSeries, type SeriesPoint } from '../series';
import { BASKET_CURRENCIES, computeBasketValue } from '../basket';
import type { SpotPrice } from './types';
import type { WorldBankMonthly } from './worldbank';

/** Pounds per metric tonne — gold-api's HG copper quote (USD/lb) → the World Bank's USD/mt unit. */
export const COPPER_LB_PER_TONNE = 2204.62262;

export interface SeriesInputs {
  /** FRED series outputs keyed by FRED_SERIES name. */
  fred: Partial<Record<string, SeriesPoint[]>>;
  /** ECB Data Portal series (I15). */
  ecb?: { dfr?: SeriesPoint[] };
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
  };
  /** RBA series outputs (venue-dependent — see docs/insights/03-data-sources.md). */
  rba?: {
    cashRate?: SeriesPoint[];
    au10y?: SeriesPoint[];
    householdDebtRatio?: SeriesPoint[];
    homeLoanOutstanding?: SeriesPoint[];
  };
  /** Manual china-pmi observations (data/manual/china-pmi.json). */
  chinaPmi?: SeriesPoint[];
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
  /** The runner's calendar date (ISO) — stamps live points. */
  today: string;
}

/** Inverse of a USD→X quote series (X per USD → USD per X). */
function invert(series: SeriesPoint[]): SeriesPoint[] {
  return series.map((p) => ({ date: p.date, value: 1 / p.value }));
}

/** Union-merge two series by date (later list wins on collision), sorted. */
function mergeSeries(a: SeriesPoint[], b: SeriesPoint[]): SeriesPoint[] {
  const byDate = new Map<string, SeriesPoint>();
  for (const p of a) byDate.set(p.date, p);
  for (const p of b) byDate.set(p.date, p);
  return [...byDate.values()].sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

/** Append a live point dated `today` (refused when it would break order). */
function withLivePoint(series: SeriesPoint[], today: string, value: number): SeriesPoint[] {
  const last = series[series.length - 1];
  if (last && last.date >= today) return series; // stale live source vs fresher history — keep history
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
  const { fred, ecb, fx, wb, abs, rba, today } = inputs;
  const out: Partial<Record<IndicatorId, SeriesPoint[]>> = {};

  const put = (id: IndicatorId, series: SeriesPoint[] | undefined) => {
    if (series !== undefined && series.length > 0) out[id] = series;
  };

  /* ------------- Global — Is borrowing getting costlier? ------------- */
  put('yield-curve-10y2y', fred.T10Y2Y);
  put('real-yield-10y', fred.DFII10);
  put('us10y', fred.DGS10);
  if (fred.DFEDTARL && fred.DFEDTARU) {
    // The target-range midpoint — the card renders the 25bp corridor around
    // it at display time (definitions.ts fed-target note).
    put('fed-target', combineSeries(fred.DFEDTARL, fred.DFEDTARU, (l, u) => (l + u) / 2));
  } else if (fred.DFEDTARL) {
    put('fed-target', fred.DFEDTARL);
  }
  put('ecb-dfr', ecb?.dfr);
  if (fred.A091RC1Q027SBEA && fred.W006RC1Q027SBEA) {
    put(
      'govt-interest-revenue',
      combineSeries(fred.A091RC1Q027SBEA, fred.W006RC1Q027SBEA, (interest, receipts) => interest / receipts),
    );
  }

  /* ---------------- Global — Are prices heating up? ---------------- */
  if (fred.CPIAUCSL) put('us-cpi-yoy', yoyPctSeries(fred.CPIAUCSL));
  put('breakeven-5y5y', fred.T5YIFR);

  /* ---------------- Global — Are markets nervous? ---------------- */
  put('stress-stlfsi', fred.STLFSI4);
  put('nfci', fred.NFCI);
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
  put('eur-usd', fx.EUR);

  /* ---------------- Global — Is growth healthy? ---------------- */
  put('china-pmi', inputs.chinaPmi);
  put('m2-us', fred.M2SL);
  if (wb) put('copper-gold', combineSeries(wb.copper, wb.gold, (c, g) => c / g));
  put('usdcny', fx.CNY);

  /* ------------- Global — Prices board (not a gauge) ------------- */
  put('brent', fred.DCOILBRENTEU);
  // Fallback when the FRED route is down: the World Bank monthly Brent
  // (03-data-sources.md lists the Pink Sheet as serving Brent too).
  if (out.brent === undefined && wb) put('brent', wb.brent);

  // Gold: gold-api XAU live + (WB monthly ∪ accumulated daily) history.
  if (inputs.xauSpot) {
    const base = wb ? mergeSeries(wb.gold, inputs.seedHistory?.['gold-usd'] ?? []) : (inputs.seedHistory?.['gold-usd'] ?? []);
    put(
      'gold-usd',
      base.length > 0
        ? withLivePoint(base, today, inputs.xauSpot.price)
        : singlePoint(today, inputs.xauSpot.price),
    );
  } else if (wb) {
    put('gold-usd', mergeSeries(wb.gold, inputs.seedHistory?.['gold-usd'] ?? []));
  }

  // Silver: same recipe with XAG.
  if (inputs.xagSpot) {
    const base = wb ? mergeSeries(wb.silver, inputs.seedHistory?.['silver-usd'] ?? []) : (inputs.seedHistory?.['silver-usd'] ?? []);
    put(
      'silver-usd',
      base.length > 0
        ? withLivePoint(base, today, inputs.xagSpot.price)
        : singlePoint(today, inputs.xagSpot.price),
    );
  } else if (wb) {
    put('silver-usd', mergeSeries(wb.silver, inputs.seedHistory?.['silver-usd'] ?? []));
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

  // Bitcoin: accumulated daily snapshots + today's live point (no 10-year
  // position by design — data spec §3 note).
  const btcBase = inputs.seedHistory?.['btc-usd'] ?? [];
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

  // Context ratios under the Bitcoin price row (PB2: "context only, not
  // used in signals").
  if (inputs.xauSpot && inputs.btcSpot) {
    put('gold-btc', singlePoint(today, inputs.xauSpot.price / inputs.btcSpot.price));
  }
  if (inputs.xagSpot && inputs.btcSpot) {
    put('silver-btc', singlePoint(today, inputs.xagSpot.price / inputs.btcSpot.price));
  }

  /* -------- Australia — Are inflation and rates a problem? -------- */
  if (abs?.cpiIndex) put('au-cpi', yoyPctSeries(abs.cpiIndex));
  if (abs?.trimmedMeanIndex) put('au-trimmed-mean', yoyPctSeries(abs.trimmedMeanIndex));
  if (rba?.au10y && fred.DGS10) {
    put('au-us-10y-gap', combineSeries(rba.au10y, fred.DGS10, (au, us) => au - us));
  }
  put('rba-cash-rate', rba?.cashRate);
  if (abs?.automotiveFuelIndex) put('au-petrol-yoy', yoyPctSeries(abs.automotiveFuelIndex));

  /* -------- Australia — Are households under pressure? -------- */
  put('au-home-loan', rba?.homeLoanOutstanding);
  if (abs?.wageIndex) put('au-wage-growth', yoyPctSeries(abs.wageIndex));
  if (abs?.rentIndex) put('au-rent-yoy', yoyPctSeries(abs.rentIndex));
  put('au-unemployment', abs?.unemployment);
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
 * Card source attribution (name + URL) per indicator — what computeReading
 * stamps onto every reading ("Updated [date] · Source [name]"). Providers
 * requiring attribution (ABS, RBA, World Bank, ECB — CC BY / attribution
 * terms) are credited on the card AND in About-the-data (03-data-sources.md
 * §3 + the FRED notice, UI Block N1).
 */
export const READING_SOURCES: Readonly<Partial<Record<IndicatorId, { name: string; url?: string }>>> = {
  'yield-curve-10y2y': { name: 'FRED (T10Y2Y)', url: 'https://fred.stlouisfed.org/series/T10Y2Y' },
  'real-yield-10y': { name: 'FRED (DFII10)', url: 'https://fred.stlouisfed.org/series/DFII10' },
  us10y: { name: 'FRED (DGS10)', url: 'https://fred.stlouisfed.org/series/DGS10' },
  'fed-target': { name: 'FRED (DFEDTARL/U)', url: 'https://fred.stlouisfed.org/series/DFEDTARU' },
  'ecb-dfr': {
    name: 'ECB Data Portal (DFR)',
    url: 'https://data.ecb.europa.eu/data/datasets/FM/B.EUR.4F.KR.DFR.LEV',
  },
  'govt-interest-revenue': { name: 'FRED (BEA series, derived)', url: 'https://fred.stlouisfed.org/series/A091RC1Q027SBEA' },
  'us-cpi-yoy': { name: 'FRED (CPIAUCSL)', url: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
  'breakeven-5y5y': { name: 'FRED (T5YIFR)', url: 'https://fred.stlouisfed.org/series/T5YIFR' },
  'stress-stlfsi': { name: 'FRED (STLFSI4)', url: 'https://fred.stlouisfed.org/series/STLFSI4' },
  nfci: { name: 'FRED (NFCI)', url: 'https://fred.stlouisfed.org/series/NFCI' },
  'gold-silver': { name: 'gold-api.com (history: World Bank)', url: 'https://www.gold-api.com' },
  'dollar-basket': {
    name: 'Currena basket (ECB rates via Frankfurter)',
    url: 'https://frankfurter.dev',
  },
  usdjpy: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  'eur-usd': { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  'china-pmi': { name: 'China NBS (manual entry)', url: 'https://www.stats.gov.cn/english/' },
  'm2-us': { name: 'FRED (M2SL)', url: 'https://fred.stlouisfed.org/series/M2SL' },
  'copper-gold': { name: 'World Bank Pink Sheet', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  usdcny: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  brent: { name: 'FRED (DCOILBRENTEU)', url: 'https://fred.stlouisfed.org/series/DCOILBRENTEU' },
  'gold-usd': { name: 'gold-api.com (XAU)', url: 'https://www.gold-api.com' },
  'silver-usd': { name: 'gold-api.com (XAG)', url: 'https://www.gold-api.com' },
  'copper-usd': { name: 'gold-api.com (HG, history: World Bank)', url: 'https://www.gold-api.com' },
  'btc-usd': { name: 'gold-api.com (BTC)', url: 'https://www.gold-api.com' },
  'gold-btc': { name: 'gold-api.com (XAU ÷ BTC)', url: 'https://www.gold-api.com' },
  'silver-btc': { name: 'gold-api.com (XAG ÷ BTC)', url: 'https://www.gold-api.com' },
  'rba-cash-rate': { name: 'RBA F1.1', url: 'https://www.rba.gov.au/statistics/cash-rate/' },
  'au-cpi': { name: 'ABS (CPI All groups)', url: 'https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.Q' },
  'au-trimmed-mean': { name: 'ABS (CPI_Q Trimmed Mean)', url: 'https://data.api.abs.gov.au/rest/data/CPI_Q/1.999902.20.50.Q' },
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
  'gold-aud': { name: 'gold-api.com × Frankfurter (ECB)', url: 'https://www.gold-api.com' },
  'iron-ore': { name: 'World Bank Pink Sheet', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  'terms-of-trade': { name: 'ABS (ANA_AGG terms of trade)', url: 'https://data.api.abs.gov.au/rest/data/ANA_AGG/M5.TTR.20.AUS.Q' },
  'au-unemployment': { name: 'ABS (Labour Force)', url: 'https://data.api.abs.gov.au/rest/data/LF/M13.3.1599.20.AUS.M' },
  'au-home-values': { name: 'ABS (RES_DWELL_ST)', url: 'https://data.api.abs.gov.au/rest/data/RES_DWELL_ST/5.AUS.Q' },
  'au-household-debt-arrears': { name: 'RBA E2 (household ratios)', url: 'https://www.rba.gov.au/statistics/tables/' },
};
