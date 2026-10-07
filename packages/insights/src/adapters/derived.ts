/**
 * Derived-series assembly — composes every indicator's canonical series from
 * the provider adapters' outputs. This is the production twin of the backtest
 * SCRIPT's inline SERIES map (docs/insights/BACKTEST.md): the same joins and
 * the same conventions, so backtested behaviour and live behaviour cannot
 * drift apart.
 *
 * Composition rules (01-indicator-spec.md + definitions.ts):
 *  - ratios join on exact common dates (combineSeries inner join):
 *    govt-interest-revenue, gold-silver history, copper-gold, audjpy,
 *    au-us-10y-gap;
 *  - au-cpi / au-trimmed-mean are year-on-year PERCENT of the ABS index
 *    series (yoyPctSeries — base-invariant);
 *  - audusd is the inverse of the USD→AUD quote series;
 *  - live-point cards (gold-btc, silver-btc, gold-aud) carry exactly one
 *    observation — honest: no daily gold history exists in the verified
 *    sources, so no change/percentile is invented;
 *  - gold-silver = World Bank monthly history + today's live point
 *    (TGJU gold ÷ gold-api XAG) appended — the monthly percentile base is
 *    the adapter's concern by design (definitions.ts cadence note);
 *  - gold-usd / silver-usd follow the same recipe with the raw ounce
 *    prices themselves (TGJU gold; gold-api XAG) as the live point —
 *    info-only price cards (owner request 2026-10-07: "the ounce price of
 *    Gold and ounce price of Silver … in the precious metals part").
 *
 * Total function: whatever provider input is MISSING simply omits the
 * affected indicators (the runner renders those unavailable). Failures
 * belong to the fetch adapters, which throw loudly.
 */

import type { IndicatorId } from '@currena/core';
import { combineSeries, yoyPctSeries, type SeriesPoint } from '../series';
import type { SpotPrice } from './types';
import type { WorldBankMonthly } from './worldbank';

export interface SeriesInputs {
  /** FRED series outputs keyed by FRED_SERIES name. */
  fred: Partial<Record<string, SeriesPoint[]>>;
  /** Frankfurter USD→currency series (USD quote side). */
  fx: { JPY?: SeriesPoint[]; AUD?: SeriesPoint[]; CNY?: SeriesPoint[] };
  /** World Bank Pink Sheet monthly series. */
  wb?: WorldBankMonthly;
  /** TGJU gold ounce, USD per troy ounce (live). */
  tgjuGoldOunceUsd?: number;
  /** gold-api.com silver spot. */
  xagSpot?: SpotPrice;
  /** gold-api.com Bitcoin spot. */
  btcSpot?: SpotPrice;
  /** ABS series outputs. */
  abs?: {
    cpiIndex?: SeriesPoint[];
    trimmedMeanIndex?: SeriesPoint[];
    unemployment?: SeriesPoint[];
    resDwellMeanPrice?: SeriesPoint[];
    termsOfTrade?: SeriesPoint[];
  };
  /** RBA series outputs (venue-dependent — see docs/insights/03-data-sources.md). */
  rba?: {
    cashRate?: SeriesPoint[];
    au10y?: SeriesPoint[];
    householdDebtRatio?: SeriesPoint[];
  };
  /** Manual china-pmi observations (data/manual/china-pmi.json). */
  chinaPmi?: SeriesPoint[];
  /** The runner's calendar date (ISO) — stamps live points. */
  today: string;
}

/** Inverse of a USD→X quote series (X per USD → USD per X). */
function invert(series: SeriesPoint[]): SeriesPoint[] {
  return series.map((p) => ({ date: p.date, value: 1 / p.value }));
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

/** Compose every possible indicator series from the fetched inputs. */
export function buildIndicatorSeries(inputs: SeriesInputs): Partial<Record<IndicatorId, SeriesPoint[]>> {
  const { fred, fx, wb, abs, rba, today } = inputs;
  const out: Partial<Record<IndicatorId, SeriesPoint[]>> = {};

  const put = (id: IndicatorId, series: SeriesPoint[] | undefined) => {
    if (series !== undefined && series.length > 0) out[id] = series;
  };

  /* ---------------- Global — Rates and credit ---------------- */
  put('yield-curve-10y2y', fred.T10Y2Y);
  put('stress-stlfsi', fred.STLFSI4);
  put('real-yield-10y', fred.DFII10);
  put('us10y', fred.DGS10);
  put('breakeven-5y5y', fred.T5YIFR);
  if (fred.A091RC1Q027SBEA && fred.W006RC1Q027SBEA) {
    put(
      'govt-interest-revenue',
      combineSeries(fred.A091RC1Q027SBEA, fred.W006RC1Q027SBEA, (interest, receipts) => interest / receipts),
    );
  }

  /* ---------------- Global — Currencies ---------------- */
  put('dollar-broad', fred.DTWEXBGS);
  put('usdjpy', fx.JPY);
  put('usdcny', fx.CNY);

  /* ---------------- Global — Metals, crypto and hard assets ---------------- */
  // Ounce price cards (owner request 2026-10-07): World Bank monthly history
  // + today's live point, exactly the gold-silver recipe. Without the World
  // Bank leg they degrade to single-point live cards (no percentile); without
  // the live leg they fall back to the monthly history (reads stale — honest).
  if (inputs.tgjuGoldOunceUsd !== undefined) {
    put(
      'gold-usd',
      wb ? withLivePoint(wb.gold, today, inputs.tgjuGoldOunceUsd) : singlePoint(today, inputs.tgjuGoldOunceUsd),
    );
  } else if (wb) {
    put('gold-usd', wb.gold);
  }
  if (inputs.xagSpot) {
    put(
      'silver-usd',
      wb ? withLivePoint(wb.silver, today, inputs.xagSpot.price) : singlePoint(today, inputs.xagSpot.price),
    );
  } else if (wb) {
    put('silver-usd', wb.silver);
  }
  if (wb && inputs.tgjuGoldOunceUsd !== undefined && inputs.xagSpot) {
    const history = combineSeries(wb.gold, wb.silver, (g, s) => g / s);
    put(
      'gold-silver',
      withLivePoint(history, today, inputs.tgjuGoldOunceUsd / inputs.xagSpot.price),
    );
  } else if (wb) {
    put('gold-silver', combineSeries(wb.gold, wb.silver, (g, s) => g / s));
  }
  if (inputs.tgjuGoldOunceUsd !== undefined && inputs.btcSpot) {
    put('gold-btc', singlePoint(today, inputs.tgjuGoldOunceUsd / inputs.btcSpot.price));
  }
  if (inputs.xagSpot && inputs.btcSpot) {
    put('silver-btc', singlePoint(today, inputs.xagSpot.price / inputs.btcSpot.price));
  }
  if (wb) {
    put('copper-gold', combineSeries(wb.copper, wb.gold, (c, g) => c / g));
    put('iron-ore', wb.ironOre);
  }
  put('brent', fred.DCOILBRENTEU);
  // Fallback when the FRED route is down: the World Bank monthly Brent
  // (03-data-sources.md lists the Pink Sheet as serving Brent too).
  if (out.brent === undefined && wb) put('brent', wb.brent);
  put('m2-us', fred.M2SL);

  /* ---------------- Global — Stocks, growth and liquidity ---------------- */
  put('china-pmi', inputs.chinaPmi);

  /* ---------------- Australia — Interest and inflation ---------------- */
  put('rba-cash-rate', rba?.cashRate);
  if (abs?.cpiIndex) put('au-cpi', yoyPctSeries(abs.cpiIndex));
  if (abs?.trimmedMeanIndex) put('au-trimmed-mean', yoyPctSeries(abs.trimmedMeanIndex));

  /* ---------------- Australia — Currency and trade ---------------- */
  if (fx.AUD) put('audusd', invert(fx.AUD));
  if (fx.JPY && fx.AUD) {
    put('audjpy', combineSeries(fx.JPY, fx.AUD, (jpy, aud) => jpy / aud));
  }
  if (rba?.au10y && fred.DGS10) {
    put('au-us-10y-gap', combineSeries(rba.au10y, fred.DGS10, (au, us) => au - us));
  }
  if (inputs.tgjuGoldOunceUsd !== undefined && fx.AUD && fx.AUD.length > 0) {
    const lastAud = fx.AUD[fx.AUD.length - 1]!;
    put('gold-aud', singlePoint(today, inputs.tgjuGoldOunceUsd * lastAud.value));
  }
  put('terms-of-trade', abs?.termsOfTrade);

  /* ---------------- Australia — Jobs and housing ---------------- */
  put('au-unemployment', abs?.unemployment);
  put('au-home-values', abs?.resDwellMeanPrice);
  put('au-household-debt-arrears', rba?.householdDebtRatio);

  return out;
}

/**
 * Card source attribution (name + URL) per indicator — what computeReading
 * stamps onto every reading ("Updated [date] · Source [name]"). Providers
 * requiring attribution (ABS, RBA, World Bank — CC BY 4.0) are credited on
 * the card AND in About-the-data (03-data-sources.md §3).
 */
export const READING_SOURCES: Readonly<Partial<Record<IndicatorId, { name: string; url?: string }>>> = {
  'yield-curve-10y2y': { name: 'FRED (T10Y2Y)', url: 'https://fred.stlouisfed.org/series/T10Y2Y' },
  'stress-stlfsi': { name: 'FRED (STLFSI4)', url: 'https://fred.stlouisfed.org/series/STLFSI4' },
  'real-yield-10y': { name: 'FRED (DFII10)', url: 'https://fred.stlouisfed.org/series/DFII10' },
  us10y: { name: 'FRED (DGS10)', url: 'https://fred.stlouisfed.org/series/DGS10' },
  'breakeven-5y5y': { name: 'FRED (T5YIFR)', url: 'https://fred.stlouisfed.org/series/T5YIFR' },
  'govt-interest-revenue': { name: 'FRED (BEA series, derived)', url: 'https://fred.stlouisfed.org/series/A091RC1Q027SBEA' },
  'dollar-broad': { name: 'FRED (DTWEXBGS)', url: 'https://fred.stlouisfed.org/series/DTWEXBGS' },
  usdjpy: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  usdcny: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  'gold-usd': { name: 'TGJU (gold ounce)', url: 'https://www.tgju.org/profile/ons' },
  'silver-usd': { name: 'gold-api.com', url: 'https://www.gold-api.com' },
  'gold-silver': { name: 'TGJU ÷ gold-api.com (history: World Bank)', url: 'https://www.gold-api.com' },
  'gold-btc': { name: 'TGJU ÷ gold-api.com', url: 'https://www.gold-api.com' },
  'silver-btc': { name: 'gold-api.com', url: 'https://www.gold-api.com' },
  'copper-gold': { name: 'World Bank Pink Sheet', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  brent: { name: 'FRED (DCOILBRENTEU)', url: 'https://fred.stlouisfed.org/series/DCOILBRENTEU' },
  'm2-us': { name: 'FRED (M2SL)', url: 'https://fred.stlouisfed.org/series/M2SL' },
  'china-pmi': { name: 'China NBS (manual entry)', url: 'https://www.stats.gov.cn/english/' },
  'rba-cash-rate': { name: 'RBA F1.1', url: 'https://www.rba.gov.au/statistics/cash-rate/' },
  'au-cpi': { name: 'ABS (CPI All groups)', url: 'https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.Q' },
  'au-trimmed-mean': { name: 'ABS (CPI_Q Trimmed Mean)', url: 'https://data.api.abs.gov.au/rest/data/CPI_Q/1.999902.20.50.Q' },
  audusd: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  audjpy: { name: 'Frankfurter (ECB)', url: 'https://frankfurter.dev' },
  'au-us-10y-gap': { name: 'RBA F2 − FRED (DGS10)', url: 'https://www.rba.gov.au/statistics/tables/' },
  'gold-aud': { name: 'TGJU × Frankfurter (ECB)', url: 'https://www.tgju.org/profile/ons' },
  'iron-ore': { name: 'World Bank Pink Sheet', url: 'https://www.worldbank.org/en/research/commodity-markets' },
  'terms-of-trade': { name: 'ABS (ANA_AGG terms of trade)', url: 'https://data.api.abs.gov.au/rest/data/ANA_AGG/M5.TTR.20.AUS.Q' },
  'au-unemployment': { name: 'ABS (Labour Force)', url: 'https://data.api.abs.gov.au/rest/data/LF/M13.3.1599.20.AUS.M' },
  'au-home-values': { name: 'ABS (RES_DWELL_ST)', url: 'https://data.api.abs.gov.au/rest/data/RES_DWELL_ST/5.AUS.Q' },
  'au-household-debt-arrears': { name: 'RBA E2 (household ratios)', url: 'https://www.rba.gov.au/statistics/tables/' },
};
