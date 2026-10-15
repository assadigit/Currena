/**
 * Shared source-collection orchestration (Phase I3) — the fetch phase of the
 * I2 one-off live run, extracted verbatim so the ingestion runner and the
 * diagnostic live-run CANNOT drift apart: same fetches, same per-source
 * try/catch → report rows, same cross-checks.
 *
 * Hits live sites BY DESIGN (runner surface — never part of the test suite).
 * A failing source is recorded and simply omits its series; the affected
 * indicators then read `unavailable`/`stale` — never wrong data.
 *
 * I15 (2026-10-08 data spec): + ECB Data Portal (ecb-dfr), + gold-api HG
 * (copper price row), + RBA F6 (home-loan rate), the Frankfurter fetch now
 * carries the six basket currencies, and TGJU is RETIRED from Insights
 * (unverified licence — the gold cross-check that used TGJU is gone with
 * it; Bitstamp remains the BTC cross-check).
 */

import type { InsightsSourceReport } from '@currena/core';
import { ABS_SERIES, fetchAbsSeries } from './abs';
import { fetchBitstampCloses } from './bitstamp';
import { fetchEcbDfrSeries } from './ecb';
import { fetchFrankfurterSeries } from './frankfurter';
import { FRED_SERIES, fetchFredSeries } from './fred';
import { fetchGoldApiSpot } from './goldapi';
import { fetchRbaSeries } from './rba';
import { fetchYahooQuote } from './yahoo';
import { fetchWorldBankMonthly } from './worldbank';
import type { SeriesInputs } from './derived';
import type { SeriesPoint } from '../series';

/** Frankfurter start: 10-year percentile window + buffer (I2 live-run value). */
export const DEFAULT_FX_START = '2016-01-04';
/** Bitstamp candles for the gold-api BTC cross-check. */
export const DEFAULT_BITSTAMP_CANDLES = 10;

export interface CollectOptions {
  /** Frankfurter timeseries start (YYYY-MM-DD). */
  fxStart?: string;
  /** Bitstamp daily candles for the BTC cross-check. */
  bitstampCandles?: number;
}

export interface CollectResult {
  /** Everything buildIndicatorSeries accepts, EXCEPT chinaPmi (caller loads the manual file). */
  inputs: Omit<SeriesInputs, 'chinaPmi'>;
  /** Per-source fetch outcome rows (source, ok, detail) — the /admin freshness table. */
  reports: InsightsSourceReport[];
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function collectAllSources(opts: CollectOptions = {}): Promise<CollectResult> {
  const fxStart = opts.fxStart ?? DEFAULT_FX_START;
  const bitstampCandles = opts.bitstampCandles ?? DEFAULT_BITSTAMP_CANDLES;
  const today = new Date().toISOString().slice(0, 10);

  const reports: InsightsSourceReport[] = [];
  const report = (source: string, ok: boolean, detail: string) => reports.push({ source, ok, detail });

  async function fetchLogged<T>(source: string, label: string, fn: () => Promise<T>): Promise<T | undefined> {
    try {
      const value = await fn();
      report(source, true, label);
      return value;
    } catch (err) {
      report(source, false, `${label}: ${errMessage(err)}`);
      return undefined;
    }
  }

  // FRED (15 series, keyless fredgraph.csv, full history) — keyed by series id.
  const fred: Partial<Record<string, SeriesPoint[]>> = {};
  for (const seriesId of Object.values(FRED_SERIES)) {
    const series = await fetchLogged('fred', seriesId, () => fetchFredSeries(seriesId));
    if (series) fred[seriesId] = series;
  }

  // Yahoo Brent futures (2026-10-12, the stale-oil fix): EIA's DCOILBRENTEU
  // stopped publishing on 2026-10-06 while the market kept moving — Yahoo's
  // BZ=F daily closes extend the Brent series past FRED's last date so the
  // stored history, percentiles and 7/30-day changes never rot (derived.ts
  // keeps FRED authoritative on every overlapping date, so the series
  // self-corrects back to pure EIA spot when FRED catches up).
  const brentYahooQuote = await fetchLogged('yahoo', 'BZ=F daily closes (Brent gap-fill)', () =>
    fetchYahooQuote('BZ=F', '40d'),
  );

  // Fix spec B-01 (2026-10-14): the record-history backfill for the price
  // rows — 10 years of Yahoo daily quotes for gold (GC=F), silver (SI=F) and
  // Bitcoin (BTC-USD). The peaks for the metals and Bitcoin read the DAILY
  // HIGH series (Bitstamp cross-checks BTC); Brent's peak reads its own
  // close-based series (FRED EIA spot + the BZ=F extension). These power the
  // reading.peak / fromPeak10y fields and T-05's record floors.
  const goldYahooQuote = await fetchLogged('yahoo', 'GC=F daily quotes (10-year record history)', () =>
    fetchYahooQuote('GC=F', '10y'),
  );
  const silverYahooQuote = await fetchLogged('yahoo', 'SI=F daily quotes (10-year record history)', () =>
    fetchYahooQuote('SI=F', '10y'),
  );
  const btcYahooQuote = await fetchLogged('yahoo', 'BTC-USD daily quotes (10-year record history)', () =>
    fetchYahooQuote('BTC-USD', '10y'),
  );

  // ECB Data Portal (deposit facility rate, full history).
  const ecbDfr = await fetchLogged('ecb', 'FM/D.U2.EUR.4F.KR.DFR.LEV', () => fetchEcbDfrSeries());

  // Frankfurter (USD→JPY/AUD/CNY + the six basket currencies, 10y window).
  const fx = await fetchLogged('frankfurter', `USD→JPY,AUD,CNY,EUR,GBP,CAD,SEK,CHF since ${fxStart}`, () =>
    fetchFrankfurterSeries(fxStart),
  );

  // World Bank Pink Sheet monthly.
  const wb = await fetchLogged('world-bank', 'Pink Sheet monthly workbook', () => fetchWorldBankMonthly());

  // gold-api.com spots (XAU is the primary gold source — TGJU retired I15).
  const xauSpot = await fetchLogged('gold-api', 'XAU spot', () => fetchGoldApiSpot('XAU'));
  const xagSpot = await fetchLogged('gold-api', 'XAG spot', () => fetchGoldApiSpot('XAG'));
  const btcSpot = await fetchLogged('gold-api', 'BTC spot', () => fetchGoldApiSpot('BTC'));
  const hgSpot = await fetchLogged('gold-api', 'HG (copper) spot', () => fetchGoldApiSpot('HG'));

  // ABS (8 series, keyless SDMX CSV).
  const absSeries: NonNullable<SeriesInputs['abs']> = {};
  for (const [name, key] of Object.entries(ABS_SERIES) as [keyof typeof ABS_SERIES, string][]) {
    const series = await fetchLogged('abs', key, () => fetchAbsSeries(key));
    if (series) absSeries[name] = series;
  }

  // Bitstamp (BTC close sanity cross-check against gold-api).
  const bitstamp = await fetchLogged('bitstamp', `btcusd last ${bitstampCandles} daily candles`, () =>
    fetchBitstampCloses('btcusd', { limit: bitstampCandles }),
  );

  // RBA (venue-dependent: rba.gov.au is Akamai-blocked from the build sandbox
  // but verified HTTP 200 from the GitHub Actions runner — 03-data-sources.md).
  // Step-1 audit item A4: the DAILY F1 'Cash Rate Target' is fetched first;
  // F1.1 (monthly average) stays as the fallback when the daily table fails.
  const rbaCashRateDaily = await fetchLogged('rba', 'F1 Cash Rate Target (daily)', () => fetchRbaSeries('cashRateDaily'));
  const rbaCashRate = await fetchLogged('rba', 'F1.1 Cash Rate Target', () => fetchRbaSeries('cashRate'));
  const rbaAu10y = await fetchLogged('rba', 'F2 Australian Government 10 year bond', () => fetchRbaSeries('au10y'));
  // Fix spec C-06: F2's 3-year series (FCMYGBAG3D) — the RBA-expectations leg.
  const rbaAu3y = await fetchLogged('rba', 'F2 FCMYGBAG3D Australian Government 3 year bond', () => fetchRbaSeries('au3y'));
  const rbaHouseholdDebt = await fetchLogged('rba', 'E2 Household debt to income', () =>
    fetchRbaSeries('householdDebtToIncome'),
  );
  const rbaHomeLoan = await fetchLogged('rba', 'F6 FLRHOOTA owner-occupier outstanding home-loan rate', () =>
    fetchRbaSeries('homeLoanOutstanding'),
  );
  // Step-2 add-list §B7: F4.1 PDRNTH — the paid rate on new household term
  // deposits (the "Savings and interest" card's real number).
  const rbaDepositRate = await fetchLogged('rba', 'F4.1 PDRNTH new household term-deposit rate', () =>
    fetchRbaSeries('depositRateNewTermHouseholds'),
  );

  // Cross-checks (03-data-sources.md): independent sources must agree.
  if (bitstamp && btcSpot) {
    const last = bitstamp.at(-1)!;
    const drift = ((btcSpot.price - last.value) / last.value) * 100;
    report(
      'cross-check',
      Math.abs(drift) < 3,
      `gold-api BTC ${btcSpot.price.toFixed(0)} vs Bitstamp close ${last.value.toFixed(0)} (${last.date}) → ${drift.toFixed(2)}%`,
    );
  }

  return {
    inputs: {
      today,
      fred,
      brentYahoo: brentYahooQuote?.points,
      yahooHistories: {
        'gold-usd': goldYahooQuote,
        'silver-usd': silverYahooQuote,
        'btc-usd': btcYahooQuote,
      },
      ecb: { dfr: ecbDfr },
      fx: {
        JPY: fx?.JPY,
        AUD: fx?.AUD,
        CNY: fx?.CNY,
        EUR: fx?.EUR,
        GBP: fx?.GBP,
        CAD: fx?.CAD,
        SEK: fx?.SEK,
        CHF: fx?.CHF,
      },
      wb,
      xauSpot,
      xagSpot,
      btcSpot,
      hgSpot,
      abs: absSeries,
      rba: {
        cashRate: rbaCashRateDaily ?? rbaCashRate,
        cashRateMonthly: rbaCashRate,
        au10y: rbaAu10y,
        au3y: rbaAu3y,
        householdDebtRatio: rbaHouseholdDebt,
        homeLoanOutstanding: rbaHomeLoan,
        depositRateNewTermHouseholds: rbaDepositRate,
      },
    },
    reports,
  };
}
