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

import type { InsightsSourceReport, IndicatorId } from '@currena/core';
import { classifySourceError, contentHash } from './fetch-policy';
import { providerFetchEnabled } from '../sources';
import { ABS_SERIES, fetchAbsSeries } from './abs';
import { fetchBitstampCloses } from './bitstamp';
import { fetchEiaBrent, fetchEiaHenryHub, fetchEiaWti } from './eia';
import { fetchEcbDfrSeries } from './ecb';
import { fetchCryptoFng } from './fng';
import { fetchFrankfurterSeries } from './frankfurter';
import { FRED_BULK_GROUPS, FRED_BULK_ALL_IDS, fetchFredSeriesBulk, fredDecadeFrom } from './fred';
import { fetchGoldApiSpot } from './goldapi';
import { fetchRbaCashRateDecisions, fetchRbaTableText, parseRbaSeriesFromText, type RbaTableKey } from './rba';
import { fetchTreasuryCurves, treasuryT10y2y } from './treasury';
import { fetchYahooQuote } from './yahoo';
import { fetchWorldBankMonthly } from './worldbank';
import { mergeSeries, type SeriesInputs } from './derived';
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
  /**
   * 2026-10-21 (data-integrity round): SKIP the RBA CSV-table attempts on
   * venues whose egress the Akamai edge 403s on those paths (Cloudflare
   * Workers — venue-verified 2026-10-21). The HTML cash-rate page remains
   * the Worker's RBA source; each skipped table logs an honest report row
   * instead of six doomed 403 subrequests (the Worker's 50-subrequest
   * budget counts every attempt).
   */
  skipRbaCsvTables?: boolean;
  /**
   * 2026-10-22 (reliability round): the stored-history reader the FALLBACK
   * fills merge with (Treasury's current-year curves join the stored 10y
   * windows so percentile10y keeps its true base — the same merge pattern
   * as the Brent Yahoo extension). Optional: without it the Treasury fills
   * carry the current year alone.
   */
  historyReader?: (id: string) => Promise<SeriesPoint[] | undefined>;
}

/** A per-reading source-attribution override (a fallback filled the slot). */
export interface ReadingSourceOverride {
  name: string;
  url: string;
}

export interface CollectResult {
  /** Everything buildIndicatorSeries accepts, EXCEPT chinaPmi (caller loads the manual file). */
  inputs: Omit<SeriesInputs, 'chinaPmi'>;
  /** Per-source fetch outcome rows (source, ok, detail) — the /admin freshness table. */
  reports: InsightsSourceReport[];
  /**
   * 2026-10-22 (reliability round): reading-id → honest attribution for
   * every reading whose FRED slot a fallback source filled this run (the
   * card's source line switches from "FRED (DGS10)" to the actual source).
   * Empty on a healthy run.
   */
  readingSourceOverrides: Partial<Record<IndicatorId, ReadingSourceOverride>>;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function collectAllSources(opts: CollectOptions = {}): Promise<CollectResult> {
  const fxStart = opts.fxStart ?? DEFAULT_FX_START;
  const bitstampCandles = opts.bitstampCandles ?? DEFAULT_BITSTAMP_CANDLES;
  const today = new Date().toISOString().slice(0, 10);

  const reports: InsightsSourceReport[] = [];
  const report = (source: string, ok: boolean, detail: string, kind?: InsightsSourceReport['kind'], hash?: string) =>
    reports.push(hash !== undefined && kind ? { source, ok, detail, kind, hash } : kind ? { source, ok, detail, kind } : { source, ok, detail });

  // v3 (2026-10-20) SCRAPING_SPEC gates ride every fetch:
  //  - M-6 kill switch: a disabled source is never requested (T-30/T-31).
  //  - T-27: a block (403/418/429/bot-check) is recorded as 'blocked' — no
  //    retry, no circumvention; the next scheduled refresh tries again.
  //  - F-16: a format change is recorded as 'format-changed' (the status
  //    panel says so; the card fails closed).
  //  - F-18: the content hash of the fetched value block rides the report
  //    so unchanged repeats can be detected across refreshes.
  async function fetchLogged<T>(source: string, label: string, fn: () => Promise<T>): Promise<T | undefined> {
    if (!providerFetchEnabled(source)) {
      report(source, false, `${label}: skipped — source disabled (kill switch M-6)`, 'disabled');
      return undefined;
    }
    try {
      const value = await fn();
      report(source, true, label, 'fetched', safeHash(value));
      return value;
    } catch (err) {
      const kind = classifySourceError(err);
      const detail =
        kind === 'blocked'
          ? `${label}: blocked by the site — no retry, waiting for the next scheduled refresh (${errMessage(err)})`
          : kind === 'format-changed'
            ? `${label}: format changed — the card shows can't tell right now until the shape is re-verified (${errMessage(err)})`
            : `${label}: ${errMessage(err)}`;
      report(source, false, detail, kind);
      return undefined;
    }
  }

  /** F-18: hash the fetched VALUE BLOCK (undefined on unserialisable results). */
  function safeHash(value: unknown): string | undefined {
    try {
      return contentHash(JSON.stringify(value));
    } catch {
      return undefined;
    }
  }

  // FRED — the 2026-10-21 consolidation: FIVE multi-series fredgraph.csv
  // requests cover the whole register (~31 series; see FRED_BULK_GROUPS in
  // fred.ts). One failing GROUP fails as a unit (loud row); the individual
  // series that group carried are then simply absent from `fred`, and the
  // affected indicators read stale/unavailable — never wrong data. The
  // 2026-10-21b CPU fix: only the highest-since trio keeps FULL history —
  // every other group rides the decade window (cosd), halving the parse
  // and every downstream series (the Worker's CPU limit killed the first
  // live run at the stage write).
  const fred: Partial<Record<string, SeriesPoint[]>> = {};
  const fredGroupFailed = new Set<number>();
  let fredGroupIndex = 0;
  for (const group of FRED_BULK_GROUPS) {
    fredGroupIndex += 1;
    const from = group.window === 'decade' ? fredDecadeFrom() : undefined;
    const label = `bulk group ${fredGroupIndex} (${group.seriesIds.length} series${from !== undefined ? `, from ${from}` : ''}: ${group.seriesIds.join(', ')})`;
    const fetched = await fetchLogged('fred', label, () => fetchFredSeriesBulk(group.seriesIds, {}, from));
    if (fetched) Object.assign(fred, fetched);
    else fredGroupFailed.add(fredGroupIndex);
  }

  /* ---------------- 2026-10-22 reliability round ----------------
   * FALLBACK fills (the owner round's terms: the API stays PRIMARY; these
   * fetches run ONLY when the primary's bulk group failed). Venue evidence
   * (2026-10-22): FRED's Akamai edge intermittently answers the multi-series
   * requests with unparseable bodies from the Cloudflare egress — all five
   * groups failed one 'unexpected header' parse while FRED itself served
   * healthy bodies to other venues within the hour. The fallbacks:
   *
   *   groups 1/2 (the daily US yield family) → the US Treasury's OWN daily
   *     par + real yield-curve CSVs — the same numbers FRED republishes
   *     (DGS2/10/30 = "2/10/30 Yr", DFII10 ≈ the real curve's "10 YR"),
   *     a day FRESHER in practice. T10Y2Y recomputes as 10Y−2Y (FRED's own
   *     formula). Two subrequests (nominal + real; the real curve only when
   *     group 1 — the DFII10 carrier — failed). Current-year CSVs; the
   *     caller's stored-history merge keeps the 10-year percentile base.
   *
   *   group 4 (the EIA energy spots) → the U.S. Energy Information
   *     Administration's own daily-spot .xls workbooks — WTI, Henry Hub and
   *     Brent, each the FULL history from the primary source (public
   *     domain). Cross-validated 2026-10-22: EIA 2026-10-20 WTI 107.89 ==
   *     FRED DCOILWTICO 2026-10-20 exactly. Three subrequests.
   *
   * Series with NO licence-safe fallback (VIX, STLFSI4, NFCI, T5YIFR,
   * T10YIE, the BEA/BLS monthlies, the OECD family) hold their last good
   * values flagged stale — fail-closed honesty, and the intra-day sweep
   * rungs (apps/api insights-ingest-cron) re-attempt the primary.
   */
  const overrides: Partial<Record<IndicatorId, ReadingSourceOverride>> = {};
  const readStoredHistory = async (id: string): Promise<SeriesPoint[] | undefined> => {
    if (opts.historyReader === undefined) return undefined;
    try {
      return await opts.historyReader(id);
    } catch {
      return undefined; // a poisoned stored key must not sink the fallback
    }
  };

  if (fredGroupFailed.has(1) || fredGroupFailed.has(2)) {
    const needReal = fredGroupFailed.has(1); // group 1 carries DFII10
    const treasury = await fetchLogged(
      'treasury',
      `daily yield curves (${needReal ? 'nominal + real' : 'nominal'}) — FRED fallback`,
      () => fetchTreasuryCurves(needReal ? { real: true } : {}),
    );
    if (treasury !== undefined) {
      const TREASURY_SRC: ReadingSourceOverride = {
        name: 'U.S. Department of the Treasury (daily par yield curve)',
        url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
      };
      // Fill ONLY the slots whose group failed — a successful group's data
      // is the primary's and is never overridden.
      const fillTreasury = async (
        slot: 'DGS10' | 'DGS30' | 'DFII10' | 'DGS2',
        fetched: SeriesPoint[] | undefined,
        storedId: string | undefined,
        override: IndicatorId,
        source: ReadingSourceOverride,
      ) => {
        if (fetched === undefined || fred[slot] !== undefined) return;
        const stored = storedId !== undefined ? await readStoredHistory(storedId) : undefined;
        fred[slot] = stored !== undefined ? mergeSeries(stored, fetched) : fetched;
        overrides[override] = source;
      };
      await fillTreasury('DGS10', treasury.dgs10, 'us10y', 'us10y', TREASURY_SRC);
      await fillTreasury('DGS30', treasury.dgs30, 'us30y', 'us30y', TREASURY_SRC);
      await fillTreasury(
        'DFII10',
        treasury.real10y,
        'real-yield-10y',
        'real-yield-10y',
        {
          name: 'U.S. Department of the Treasury (daily real yield curve)',
          url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_real_yield_curve',
        },
      );
      // DGS2: no stored raw-2y history exists (fed-expectations' stored key
      // is the DERIVED gap) — the current-year fill stands alone; the
      // reading's percentile is not rendered for this card.
      if (fred.DGS2 === undefined && treasury.dgs2.length > 0) {
        fred.DGS2 = treasury.dgs2;
        if (fred.DFEDTARL !== undefined && fred.DFEDTARU !== undefined) {
          overrides['fed-expectations'] = {
            name: 'U.S. Treasury (2 Yr par yield) − FRED (DFEDTAR midpoint)',
            url: TREASURY_SRC.url,
          };
        }
      }
      // T10Y2Y: recompute from the Treasury legs (FRED's own formula),
      // merged with the stored curve history so the 10y percentile base
      // survives.
      if (fred.T10Y2Y === undefined) {
        const computed = treasuryT10y2y(treasury);
        if (computed.length > 0) {
          const stored = await readStoredHistory('yield-curve-10y2y');
          fred.T10Y2Y = stored !== undefined ? mergeSeries(stored, computed) : computed;
          overrides['yield-curve-10y2y'] = {
            name: 'U.S. Department of the Treasury (10 Yr − 2 Yr par yields)',
            url: TREASURY_SRC.url,
          };
        }
      }
      // The AU−US gap's US leg: honest mixed-legs attribution when the
      // Treasury filled DGS10 and the RBA leg exists.
      if (overrides.us10y !== undefined) {
        overrides['au-us-10y-gap'] = {
          name: 'RBA F2 − U.S. Treasury (10 Yr)',
          url: 'https://www.rba.gov.au/statistics/tables/',
        };
      }
    }
  }

  if (fredGroupFailed.has(4)) {
    const wti = await fetchLogged('eia', 'WTI spot (RWTCd.xls) — FRED fallback', () => fetchEiaWti());
    const natgas = await fetchLogged('eia', 'Henry Hub spot (RNGWHHDd.xls) — FRED fallback', () => fetchEiaHenryHub());
    const brentEia = await fetchLogged('eia', 'Brent spot (RBRTEd.xls) — FRED fallback', () => fetchEiaBrent());
    if (wti !== undefined) {
      fred.DCOILWTICO = wti.series;
      overrides.wti = {
        name: 'U.S. Energy Information Administration (WTI spot, FOB Cushing)',
        url: 'https://www.eia.gov/dnav/pet/hist/RWTCd.htm',
      };
    }
    if (natgas !== undefined) {
      fred.DHHNGSP = natgas.series;
      overrides.natgas = {
        name: 'U.S. Energy Information Administration (Henry Hub spot)',
        url: 'https://www.eia.gov/dnav/ng/hist/RNGWHHDd.htm',
      };
    }
    if (brentEia !== undefined) {
      fred.DCOILBRENTEU = brentEia.series;
      // derived.ts's fillBrentGap keeps Yahoo's fresher closes past EIA's
      // last official spot date — the attribution names both legs.
      overrides.brent = {
        name: 'U.S. EIA (Brent spot) + Yahoo Finance (BZ=F)',
        url: 'https://www.eia.gov/dnav/pet/hist/RBRTEd.htm',
      };
    }
  }
  // Sanity gate: every registered series must ride exactly one group — a
  // series added to FRED_SERIES but forgotten in the groups silently never
  // fetches; this makes that impossible.
  if (FRED_BULK_ALL_IDS.length !== new Set(FRED_BULK_ALL_IDS).size) {
    throw new Error('collect: FRED bulk groups carry a duplicate series id');
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

  // Frankfurter (USD→JPY/AUD/CNY/NZD + the six basket currencies, 10y window).
  const fx = await fetchLogged('frankfurter', `USD→JPY,AUD,CNY,EUR,GBP,CAD,SEK,CHF,NZD since ${fxStart}`, () =>
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

  // RBA (venue-dependent: rba.gov.au's Akamai edge 403s the CSV table
  // paths from the build sandbox AND — since 2026-10-20 — GitHub Actions
  // runners and Cloudflare Workers; the HTML pages remain served to
  // Workers). Step-1 audit item A4: the DAILY F1 'Cash Rate Target' is
  // fetched first; F1.1 (monthly average) stays as the fallback when the
  // daily table fails. v3 F-08/T-32 (2026-10-20): each RBA TABLE document
  // downloads exactly once per refresh.
  //
  // 2026-10-21: the HTML cash-rate DECISION TABLE is fetched FIRST — the
  // one RBA surface the Worker venue can still read (venue-verified live:
  // 4.60% effective 30 Sep 2026).
  //
  // F3 (2026-10-21 venue round): the blanket skipRbaCsvTables is NARROWED
  // to the f2-data.csv path ONLY — the venue probe (rba-probe worker,
  // 2026-10-21) showed the Akamai rule 403s f2 but SERVES f1, f1.1, f2.1,
  // e2, f6 and f4.1 from Cloudflare egress. The daily F1/F1.1/E2/F6/F4.1
  // tables fetch as before; only the daily-F2 family goes down its
  // fallback ladder (F2.1 monthly → held stale). Six of the seven tables
  // come back live: au-10y and its family ride the monthly F2.1 yields
  // instead of day-stale holds.
  const rbaCashRateDecisions = await fetchLogged('rba', 'cash-rate page decision table (HTML)', () =>
    fetchRbaCashRateDecisions(),
  );
  const rbaTables = new Map<string, Promise<string>>();
  // A rejected table download rejects every series parsed from it — the
  // identical error row on each is honest; the table is fetched ONCE.
  const rbaSeriesVia = (key: RbaTableKey) => () =>
    fetchRbaTableText(key, {}, rbaTables).then((text) => parseRbaSeriesFromText(text, key));
  const rbaTablesList: [RbaTableKey, string][] = [
    ['cashRateDaily', 'F1 Cash Rate Target (daily'],
    ['cashRate', 'F1.1 Cash Rate Target'],
    ['householdDebtToIncome', 'E2 Household debt to income'],
    ['homeLoanOutstanding', 'F6 FLRHOOTA owner-occupier outstanding home-loan rate'],
    ['depositRateNewTermHouseholds', 'F4.1 PDRNTH new household term-deposit rate'],
    // F3: the monthly F2.1 yields are fetched FIRST when the daily F2 path
    // is venue-skipped (the f2 403 would waste a subrequest and poison the
    // shared table memo) — they are the au10y/au3y fallbacks.
    ['au10yMonthly', 'F2.1 FCMYGBAG10 10-year bond yield (monthly)'],
    ['au3yMonthly', 'F2.1 FCMYGBAG3 3-year bond yield (monthly)'],
  ];
  const rbaSkipTablesList: [RbaTableKey, string][] = [
    ['au10y', 'F2 Australian Government 10 year bond'],
    ['au3y', 'F2 FCMYGBAG3D Australian Government 3 year bond'],
  ];
  const rbaSeries: Partial<Record<RbaTableKey, SeriesPoint[]>> = {};
  if (opts.skipRbaCsvTables === true) {
    // F3: fetch every SERVED table (the F2.1 monthly pair included), skip
    // ONLY the f2-data.csv daily pair — one consolidated honest row for the
    // skipped path (ok:false, kind:'disabled' — not 'blocked': the rba
    // provider itself serves its other tables this run).
    for (const [key, label] of rbaTablesList) {
      const series = await fetchLogged('rba', label, rbaSeriesVia(key));
      if (series) rbaSeries[key] = series;
    }
    reports.push({
      source: 'rba',
      ok: false,
      kind: 'disabled',
      detail:
        'F2 (f2-data.csv) daily yields not requested on this venue — the Akamai edge 403s that one path from Cloudflare egress (venue-verified 2026-10-21; f1/f1.1/f2.1/e2/f6/f4.1 all serve). au-10y & rba-expectations ride the F2.1 monthly yields instead (month granularity, own asOf)',
    });
  } else {
    const allTables: [RbaTableKey, string][] = [
      ...rbaTablesList.slice(0, 5),
      ...rbaSkipTablesList,
      ...rbaTablesList.slice(5),
    ];
    for (const [key, label] of allTables) {
      const series = await fetchLogged('rba', label, rbaSeriesVia(key));
      if (series) rbaSeries[key] = series;
    }
  }

  // Step 3 L1-18 (2026-10-16): the Alternative.me crypto Fear and Greed
  // index (context card; attribution shown next to the data).
  const cryptoFng = await fetchLogged('alternative-me', 'Crypto Fear and Greed (daily history)', () =>
    fetchCryptoFng(),
  );

  // EODHD crypto (2026-10-21 data-integrity round): RETIRED with the
  // eth-usd card (2026-10-21c owner round — a second crypto price is not a
  // market-stress indicator; the prices board carries crypto prices). The
  // markets worker's EODHD usage is untouched (the world-markets board).

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
        NZD: fx?.NZD,
      },
      wb,
      xauSpot,
      xagSpot,
      btcSpot,
      hgSpot,
      cryptoFng,
      abs: absSeries,
      rba: {
        // The 2026-10-21 preference chain: the HTML decision table (the
        // Worker venue's reliable source, exact targets + change dates)
        // first, then the daily F1 CSV, then the F1.1 monthly average.
        cashRate: rbaSeries.cashRateDaily ?? rbaCashRateDecisions ?? rbaSeries.cashRate,
        cashRateMonthly: rbaSeries.cashRate,
        cashRateDecisions: rbaCashRateDecisions,
        // F3 (2026-10-21 venue round): the daily F2 pair when the venue
        // serves it, else the F2.1 MONTHLY pair — au-10y and the
        // rba-expectations/au-us-10y-gap legs stay live at month
        // granularity (own asOf) instead of holding day-stale.
        au10y: rbaSeries.au10y ?? rbaSeries.au10yMonthly,
        au3y: rbaSeries.au3y ?? rbaSeries.au3yMonthly,
        householdDebtRatio: rbaSeries.householdDebtToIncome,
        homeLoanOutstanding: rbaSeries.homeLoanOutstanding,
        depositRateNewTermHouseholds: rbaSeries.depositRateNewTermHouseholds,
      },
    },
    reports,
    readingSourceOverrides: overrides,
  };
}
