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

  // FRED (14 series, keyless fredgraph.csv, full history) — keyed by series id.
  const fred: Partial<Record<string, SeriesPoint[]>> = {};
  for (const seriesId of Object.values(FRED_SERIES)) {
    const series = await fetchLogged('fred', seriesId, () => fetchFredSeries(seriesId));
    if (series) fred[seriesId] = series;
  }

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
  const rbaCashRate = await fetchLogged('rba', 'F1.1 Cash Rate Target', () => fetchRbaSeries('cashRate'));
  const rbaAu10y = await fetchLogged('rba', 'F2 Australian Government 10 year bond', () => fetchRbaSeries('au10y'));
  const rbaHouseholdDebt = await fetchLogged('rba', 'E2 Household debt to income', () =>
    fetchRbaSeries('householdDebtToIncome'),
  );
  const rbaHomeLoan = await fetchLogged('rba', 'F6 FLRHOOTA owner-occupier outstanding home-loan rate', () =>
    fetchRbaSeries('homeLoanOutstanding'),
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
        cashRate: rbaCashRate,
        au10y: rbaAu10y,
        householdDebtRatio: rbaHouseholdDebt,
        homeLoanOutstanding: rbaHomeLoan,
      },
    },
    reports,
  };
}
