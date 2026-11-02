/**
 * rung2.ts — the second-rung source collection (the 04:20 UTC phase of the
 * 2026-10-26 gap-audit build): the feeds whose subrequest cost must NOT
 * ride the 04:10 main rung (the audit's budget arithmetic — the main rung
 * sits at its fetch ceiling, so the new daily/weekly/monthly feeds live on
 * their own minute-gated rung between the 04:10 snapshot and the 04:25
 * history writes).
 *
 *   04:10 — the main rung: full collect + snapshot + stage (unchanged
 *           fetch count; the rung-2 ids' readings are CARRIED FORWARD from
 *           the previous snapshot — their series are absent by design).
 *   04:20 — THIS phase: fetch the rung-2 feeds (MOF daily; EIA crude +
 *           CFTC on Saturdays; OECD CLI + GPR + EPU on the first of the
 *           month; anything missing = bootstrap), re-derive their series,
 *           PATCH the snapshot + public projection, and update the stage
 *           so the 04:25/04:40 history phases write the fresh data.
 *   04:25/04:40 — the history phases: unchanged (they consume the
 *           updated stage).
 *
 * The Node/GHA venue (scripts/ingest.ts) and the selfcheck run the SAME
 * collection inline after the main run (no subrequest ceiling there), so
 * the venues cannot drift apart.
 *
 * Fail-soft per source (the collect discipline): a failed fetch logs an
 * honest report row and the affected reading holds its last good value
 * (carried by the snapshot) or the labelled fallback where one exists
 * (the OECD mirror for MOF outages, per the A-2 spec).
 */

import type { IndicatorId, InsightsSourceReport } from '@currena/core';
import { classifySourceError, contentHash } from './fetch-policy';
import { providerFetchEnabled } from '../sources';
import type { SeriesPoint } from '../series';
import { fetchMofJgb10y } from './mof';
import { fetchEiaCrudeStocks, fetchEiaSprLevel, fetchEiaCrudeProduction } from './eia-stocks';
import { fetchCftcGoldPositioning } from './cftc';
import { fetchOecdCli, fetchOecdNzShortRate } from './oecd';
import { fetchFredSeries, FRED_SERIES } from './fred';
import {
  fetchEpuSeries,
  fetchGprExportAll,
  fetchGprDailySeries,
  fetchTpuSeries,
  fetchGscpiSeries,
} from './monthly-indexes';
import {
  fetchNbsIndexPage,
  fetchNbsIndustrialProductionRelease,
  fetchNbsRealEstateRelease,
  latestIndustrialProductionRelease,
  latestRealEstateRelease,
  NBS_PRESS_INDEX_URL,
  parseNbsPressIndex,
} from './nbs';
// gap-closure S6-M6.3 (2026-11-02): the de-dollarization/concentration
// family's fetchers — the IMF COFER adapter + the S&P 500 breadth pair.
import { fetchCoferUsdShare } from './cofer';
import { fetchSp500BreadthRatio } from './sp500-breadth';

/**
 * The ids this phase owns (grows with each gap-audit addition). The main
 * rung carries these readings forward from the previous snapshot instead
 * of re-deriving them (see snapshot.ts carryForwardIds).
 */
export const RUNG2_IDS: readonly IndicatorId[] = [
  'jgb-10y', // A-2: the MOF daily upgrade (the OECD mirror stays the labelled fallback)
  'us-japan-10y-gap', // A-3: derived at 04:20 from the staged us10y + MOF
  'eia-crude-stocks', // A-6: the EIA keyless weekly stocks page, Saturday
  'cftc-gold-positioning', // A-7: the CFTC weekly COT file, Saturday
  'oecd-cli-us', // A-8: the OECD CLI trio — one filtered fetch, first-of-month
  'oecd-cli-cn',
  'oecd-cli-de',
  'gpr-index', // A-9: Iacoviello's monthly GPR export, first-of-month
  'epu-us', // A-10: Baker-Bloom-Davis's monthly EPU workbook, first-of-month
  // gap-closure S4-M4.2 (2026-11-01): the geopolitics family — the GPR
  // export's threat/act/country columns ride the SAME monthly download
  // (zero extra subrequests on the monthly fetch), the GPR daily export
  // fetches daily (the 3.3 MB MA7 file), and the TPU workbook joins the
  // monthly plan (one more policyuncertainty fetch on first-of-month
  // days). All context-only per G-5.
  'gpr-threats',
  'gpr-acts',
  'gpr-taiwan',
  'gpr-china',
  'gpr-russia',
  'gpr-ukraine',
  'gpr-israel',
  'gpr-saudi',
  'gpr-australia',
  'gpr-daily',
  'tpu-us',
  // gap-closure S4-M4.4 (2026-11-01): the supply-chain and energy family
  // — the NY Fed GSCPI joins the monthly plan (one more first-of-month
  // fetch), and the EIA SPR level + US field production join the eiaWeekly
  // Saturday gate (two more LeafHandler pages, the crude-stocks pattern).
  // The Pink Sheet energy trio (coal-aus/lng-japan/gas-europe) rides the
  // MAIN rung's existing world-bank fetch — NOT a rung-2 id (zero new
  // subrequests anywhere).
  'gscpi',
  'us-spr',
  'us-crude-production',
  // gap-closure S6-M6.1 (2026-11-02): the New Zealand link family's two
  // monthly mirrors — the OECD FINMARK NZ short rate + the FRED NZ 10y
  // OECD mirror. First-of-month + bootstrap (the monthly trio's
  // discipline); TWO more fetches on the monthly plan (~+2 subrequests on
  // an all-gates day's ~39 — the ceiling arithmetic stays safe). All
  // context-only per G-5.
  'nz-short-rate',
  'nz-10y',
  // gap-closure S6-M6.2 (2026-11-02): the China property/steel family —
  // the NBS dedicated releases' YTD property-investment Y/Y + crude-steel
  // monthly output. The releases publish ~the 19th-20th of M+1, so the
  // gate is the 21st-25th UTC window (the freshest data, the release
  // always on index page 1) + bootstrap; the two release fetches share
  // ONE index-page fetch (~+3 subrequests on window days — which never
  // coincide with the first-of-month gates). All context-only per G-5.
  'china-property-investment',
  'china-steel-output',
  // gap-closure S6-M6.3 (2026-11-02): the de-dollarization/concentration
  // family's two fetched members — the IMF COFER USD share (quarterly,
  // the Saturday re-check of a quarterly file + bootstrap: idempotent, the
  // eiaWeekly/cftcWeekly discipline) + the S&P 500 breadth ratio (daily,
  // two sequential Yahoo calls — the live-prices refresh's own shape).
  // All context-only per G-5.
  'usd-reserve-share',
  'sp500-breadth-ratio',
];

/** Which feeds a rung-2 execution fetches. */
export interface Rung2FetchPlan {
  /** MOF jgbcme (daily; the all-file monthly/first run). */
  mof: boolean;
  /** The weekly EIA crude-stocks page (Saturday + bootstrap). */
  eiaWeekly: boolean;
  /** The weekly CFTC COT file (Saturday + bootstrap). */
  cftcWeekly: boolean;
  /** The monthly OECD CLI + GPR + EPU + TPU feeds (first-of-month + bootstrap). */
  monthly: boolean;
  /** The GPR daily export (S4-M4.2: daily + bootstrap). */
  gprDaily: boolean;
  /** gap-closure S6-M6.1: the NZ monthly mirrors (OECD short rate + FRED
   * NZ 10y) — first-of-month + bootstrap, the monthly trio's gate. */
  nzMonthly: boolean;
  /** gap-closure S6-M6.2: the NBS China property/steel releases — the
   * 21st-25th UTC window (the releases publish ~the 19th-20th of M+1)
   * + bootstrap. */
  nbsMonthly: boolean;
  /** gap-closure S6-M6.3: the IMF COFER USD reserve share — quarterly
   * data, re-checked every Saturday + bootstrap (idempotent fetch of a
   * ~127 kB dataset; the publication cadence is ~1 quarter). */
  coferQuarterly: boolean;
  /** gap-closure S6-M6.3: the S&P 500 breadth ratio (RSP + SPY) — daily
   * + bootstrap (a missing stage entry IS the bootstrap itself). */
  breadthDaily: boolean;
}

/** Saturday is fetch day for the weekly pair (data Tue, publish Fri 17:30 ET). */
function isSaturday(date: Date): boolean {
  return date.getUTCDay() === 6;
}

/** The first-of-month rung refreshes the monthly feeds. */
function isFirstOfMonth(date: Date): boolean {
  return date.getUTCDate() === 1;
}

/**
 * gap-closure S6-M6.2: the NBS release window — the dedicated
 * real-estate and industrial-production releases publish ~the 19th-20th
 * of M+1 (verified: the Jan-Sep 2026 pair out 2026-10-20), so the rung
 * re-checks on the 21st-25th of every month (idempotent fetches; a
 * slipped release is caught by a later day in the window, and a release
 * that slips past the whole window self-heals at the NEXT window — the
 * link finder always takes the newest release). The window never
 * coincides with the first-of-month gates, so the subrequest peaks stay
 * separate.
 */
function isNbsReleaseWindow(date: Date): boolean {
  const day = date.getUTCDate();
  return day >= 21 && day <= 25;
}

/**
 * The plan for a given clock: the cadence gates, plus a bootstrap fetch
 * for anything whose series is missing (first deploy on any day of the
 * month, and KV disaster recovery — the cards must not wait for the next
 * Saturday / first-of-month to exist).
 */
export function rung2FetchPlanFor(date: Date, missing: ReadonlySet<string>): Rung2FetchPlan {
  const needMonthly =
    missing.has('oecd-cli-us') ||
    missing.has('oecd-cli-cn') ||
    missing.has('oecd-cli-de') ||
    missing.has('gpr-index') ||
    missing.has('epu-us') ||
    // S4-M4.2: the geopolitics monthly family bootstraps the same way.
    missing.has('gpr-threats') ||
    missing.has('gpr-acts') ||
    missing.has('tpu-us') ||
    missing.has('gpr-taiwan') ||
    missing.has('gpr-australia') ||
    // S4-M4.4: the GSCPI bootstraps the same way.
    missing.has('gscpi');
  // gap-closure S6-M6.1: the NZ monthly mirrors bootstrap the same way
  // (a fresh deploy on any day of the month must not wait for the 1st).
  const needNzMonthly = missing.has('nz-short-rate') || missing.has('nz-10y');
  // gap-closure S6-M6.2: the NBS China pair bootstraps the same way.
  const needNbsMonthly = missing.has('china-property-investment') || missing.has('china-steel-output');
  // gap-closure S6-M6.3: the COFER share + the breadth ratio bootstrap
  // the same way (a fresh deploy on any day must not wait for Saturday).
  const needCoferQuarterly = missing.has('usd-reserve-share');
  return {
    mof: true, // daily; the all-file only on monthly/bootstrap (see collect)
    eiaWeekly:
      isSaturday(date) ||
      missing.has('eia-crude-stocks') ||
      // S4-M4.4: the SPR + production pages bootstrap with the stocks page.
      missing.has('us-spr') ||
      missing.has('us-crude-production'),
    cftcWeekly: isSaturday(date) || missing.has('cftc-gold-positioning'),
    monthly: isFirstOfMonth(date) || needMonthly,
    gprDaily: true, // S4-M4.2: the daily GPR MA7 file, every day (a missing stage entry is the bootstrap itself)
    // S6-M6.1: the NZ pair rides the same first-of-month gate (never a
    // daily fetch — both mirrors are monthly).
    nzMonthly: isFirstOfMonth(date) || needNzMonthly,
    // S6-M6.2: the NBS China pair rides the 21st-25th release window
    // (the releases publish ~the 19th-20th; the window keeps the data
    // fresh AND the release link on index page 1).
    nbsMonthly: isNbsReleaseWindow(date) || needNbsMonthly,
    // S6-M6.3: the COFER share rides the Saturday gate (a quarterly file
    // needs no daily fetch — the eiaWeekly/cftcWeekly discipline; the
    // sweeps heal a missed Saturday within hours anyway).
    coferQuarterly: isSaturday(date) || needCoferQuarterly,
    // S6-M6.3: the breadth ratio fetches every day (a missing stage entry
    // IS the bootstrap itself — the mof/gpr-daily pattern).
    breadthDaily: true,
  };
}

/** The rung-2 collection's output: indicator series + honest report rows. */
export interface Rung2CollectResult {
  /** The fetched indicator series (pre-stored-merge; the phase merges bases). */
  series: Partial<Record<IndicatorId, SeriesPoint[]>>;
  /** Per-source fetch outcome rows (appended to insights:status). */
  reports: InsightsSourceReport[];
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Collect the rung-2 feeds per the plan (fail-soft per source, F-11 single attempt). */
export async function collectRung2Sources(
  plan: Rung2FetchPlan,
  deps: { now?: Date } = {},
): Promise<Rung2CollectResult> {
  const reports: InsightsSourceReport[] = [];
  const report = (source: string, ok: boolean, detail: string, kind?: InsightsSourceReport['kind'], hash?: string) =>
    reports.push(hash !== undefined && kind ? { source, ok, detail, kind, hash } : kind ? { source, ok, detail, kind } : { source, ok, detail });

  async function fetchLogged<T>(source: string, label: string, fn: () => Promise<T>): Promise<T | undefined> {
    if (!providerFetchEnabled(source)) {
      report(source, false, `${label}: skipped — source disabled (kill switch M-6)`, 'disabled');
      return undefined;
    }
    try {
      const value = await fn();
      let hash: string | undefined;
      try {
        hash = contentHash(JSON.stringify(value));
      } catch {
        hash = undefined;
      }
      report(source, true, label, 'fetched', hash);
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

  const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};

  // A-2: MOF Japan — the jgb-10y daily primary. The full-history file only
  // rides the monthly/bootstrap rungs (it changes once a month; the
  // current-month file carries every day otherwise — politeness + CPU).
  if (plan.mof) {
    const now = deps.now ?? new Date();
    const monthlyAllFile = isFirstOfMonth(now);
    const jgb = await fetchLogged(
      'mof',
      `jgbcme.csv daily 10Y${monthlyAllFile ? ' + jgbcme_all.csv history' : ''}`,
      () => fetchMofJgb10y({ includeHistory: monthlyAllFile, now }),
    );
    if (jgb !== undefined) series['jgb-10y'] = jgb;
  }

  // A-6: the EIA keyless weekly stocks page (Saturday + bootstrap).
  // S4-M4.4 (2026-11-01): the family grows to THREE pages — the total
  // crude-stocks page, the SPR level and the US field production (the
  // series ids walked from the provider's own indexes in M4.1, never
  // guessed; the same LeafHandler page family, the same parse).
  if (plan.eiaWeekly) {
    const stocks = await fetchLogged('eia', 'crude oil ending stocks WCRSTUS1 (weekly, keyless website route)', () =>
      fetchEiaCrudeStocks(),
    );
    if (stocks !== undefined) series['eia-crude-stocks'] = stocks;

    const spr = await fetchLogged('eia', 'crude oil in the SPR WCSSTUS1 (weekly, keyless website route)', () =>
      fetchEiaSprLevel(),
    );
    if (spr !== undefined) series['us-spr'] = spr;

    const production = await fetchLogged('eia', 'US field production of crude oil WCRFPUS2 (weekly, keyless website route)', () =>
      fetchEiaCrudeProduction(),
    );
    if (production !== undefined) series['us-crude-production'] = production;
  }

  // A-7: the CFTC's weekly futures-only COT file (Saturday + bootstrap).
  // One point per file — the series accumulates in the stored history.
  if (plan.cftcWeekly) {
    const gold = await fetchLogged('cftc', 'Commitments of Traders, futures-only (gold row)', () =>
      fetchCftcGoldPositioning(),
    );
    if (gold !== undefined) {
      series['cftc-gold-positioning'] = [{ date: gold.date, value: gold.netSharePct }];
    }
  }

  // A-8 (2026-10-26 gap-audit build): the OECD's amplitude-adjusted CLI —
  // ONE filtered SDMX request carrying all three countries (USA + CHN +
  // DEU, the EA19 substitute), first-of-month + bootstrap.
  if (plan.monthly) {
    const cli = await fetchLogged('oecd', 'Composite leading indicators, amplitude-adjusted (USA, CHN, DEU)', () =>
      fetchOecdCli(),
    );
    if (cli !== undefined) {
      series['oecd-cli-us'] = cli.usa;
      series['oecd-cli-cn'] = cli.chn;
      series['oecd-cli-de'] = cli.deu;
    }

    // A-9 (S4-M4.2: the FULL column set): Iacoviello's monthly GPR export
    // (the legacy .xls via the repo's own biff reader) — ONE download
    // feeding the gpr-index card AND its threat/act/country companions.
    const gpr = await fetchLogged('gpr', 'Geopolitical Risk Index (monthly export, full column set)', () =>
      fetchGprExportAll(),
    );
    if (gpr !== undefined) {
      series['gpr-index'] = gpr.gpr;
      series['gpr-threats'] = gpr.threats;
      series['gpr-acts'] = gpr.acts;
      series['gpr-taiwan'] = gpr.taiwan;
      series['gpr-china'] = gpr.china;
      series['gpr-russia'] = gpr.russia;
      series['gpr-ukraine'] = gpr.ukraine;
      series['gpr-israel'] = gpr.israel;
      series['gpr-saudi'] = gpr.saudi;
      series['gpr-australia'] = gpr.australia;
    }

    // A-10: Baker-Bloom-Davis's monthly EPU workbook (OOXML, the Pink
    // Sheet reader path). Full history per fetch.
    const epu = await fetchLogged('epu', 'US Economic Policy Uncertainty (Main News Index workbook)', () =>
      fetchEpuSeries(),
    );
    if (epu !== undefined) series['epu-us'] = epu;

    // S4-M4.2: the US Trade Policy Uncertainty — the Categorical EPU
    // workbook's "9. Trade policy" column (the old Trade_Uncertainty file
    // is stale at 2019-07; M4.1 verified this workbook as the source of
    // record). First-of-month + bootstrap, the epu-us pattern.
    const tpu = await fetchLogged('epu', 'US Trade Policy Uncertainty (Categorical EPU workbook)', () =>
      fetchTpuSeries(),
    );
    if (tpu !== undefined) series['tpu-us'] = tpu;

    // gap-closure S4-M4.4 (2026-11-01): the NY Fed GSCPI — the Global
    // Supply Chain Pressure Index (the .xlsx-named LEGACY .xls, the biff
    // reader's path; Worker egress verified FAST in the S1 probe). The
    // provider's own 2025-11-06 notice says the index publishes with
    // limited data — the parse takes the rows the file carries, never
    // back-fills a paused month.
    const gscpi = await fetchLogged('nyfed', 'Global Supply Chain Pressure Index (GSCPI, monthly workbook)', () =>
      fetchGscpiSeries(),
    );
    if (gscpi !== undefined) series['gscpi'] = gscpi;
  }

  // gap-closure S6-M6.1 (2026-11-02): the New Zealand monthly mirrors —
  // the OECD FINMARK NZ short rate (one sdmx.oecd.org request, the
  // oecd-cli venue) + the FRED NZ 10y OECD mirror (one fredgraph.csv
  // request). First-of-month + bootstrap; fail-soft per source.
  if (plan.nzMonthly) {
    const nzShortRate = await fetchLogged('oecd', 'New Zealand short-term interest rate (OECD FINMARK, monthly average)', () =>
      fetchOecdNzShortRate(),
    );
    if (nzShortRate !== undefined) series['nz-short-rate'] = nzShortRate;

    const nz10y = await fetchLogged('fred', 'New Zealand 10-year government bond yield (FRED IRLTLT01NZM156N, OECD monthly mirror)', () =>
      fetchFredSeries(FRED_SERIES.nz10y),
    );
    if (nz10y !== undefined) series['nz-10y'] = nz10y;
  }

  // gap-closure S6-M6.2 (2026-11-02): the NBS China property/steel pair —
  // ONE index-page scan + the two dedicated releases (each parser
  // cross-checks its release's own headline against its own table, so a
  // column shift can never pass). The releases publish ~the 19th-20th of
  // M+1; the 21st-25th window keeps the newest release on page 1. On a
  // window day the newest release may be last month's (a slipped publish)
  // — the idempotent merge simply re-writes the same point. If a link is
  // missing on page 1 the honest report row says so (never page-walking
  // past page 1: the window guarantees freshness).
  if (plan.nbsMonthly) {
    const index1 = await fetchLogged('nbs', 'press-release index page 1 (property/steel scan)', () =>
      fetchNbsIndexPage(1),
    );
    const links = index1 !== undefined ? parseNbsPressIndex(index1, NBS_PRESS_INDEX_URL) : [];

    const realestate = latestRealEstateRelease(links);
    if (realestate !== undefined) {
      const property = await fetchLogged(
        'nbs',
        `real-estate release: ${realestate.title} (${realestate.published})`,
        () => fetchNbsRealEstateRelease(realestate.url),
      );
      if (property !== undefined) series['china-property-investment'] = property;
    } else {
      report('nbs', false, 'real-estate release link not found on index page 1 (layout changed?)', 'format-changed');
    }

    const indprod = latestIndustrialProductionRelease(links);
    if (indprod !== undefined) {
      const steel = await fetchLogged(
        'nbs',
        `industrial-production release: ${indprod.title} (${indprod.published})`,
        () => fetchNbsIndustrialProductionRelease(indprod.url),
      );
      if (steel !== undefined) series['china-steel-output'] = steel;
    } else {
      report(
        'nbs',
        false,
        'industrial-production release link not found on index page 1 (layout changed?)',
        'format-changed',
      );
    }
  }

  // S4-M4.2: the GPR daily export — the provider's own GPRD_MA7 7-day
  // moving average (the timely signal; ~6-day file lag). Daily fetch; a
  // missing stage entry IS the bootstrap (the fetch runs every day).
  if (plan.gprDaily) {
    const gprDaily = await fetchLogged('gpr', 'Geopolitical Risk Index (daily export, 7-day average)', () =>
      fetchGprDailySeries(),
    );
    if (gprDaily !== undefined) series['gpr-daily'] = gprDaily;
  }

  // gap-closure S6-M6.3 (2026-11-02): the IMF COFER USD reserve share —
  // one SDMX 3.0 request for the full dataset (Saturday + bootstrap; the
  // parse takes the world USD-share quarterly series and fails closed on
  // any shape drift). Cross-checked against the provider's own data brief
  // (2026-Q2 = 56.70 %, exactly).
  if (plan.coferQuarterly) {
    const cofer = await fetchLogged('imf', 'COFER — USD share of world allocated FX reserves (quarterly)', () =>
      fetchCoferUsdShare(),
    );
    if (cofer !== undefined) series['usd-reserve-share'] = cofer;
  }

  // gap-closure S6-M6.3 (2026-11-02): the S&P 500 breadth ratio — two
  // sequential Yahoo chart requests (RSP + SPY, 10y), inner-joined on
  // common dates and divided (4dp). Daily; a missing stage entry IS the
  // bootstrap.
  if (plan.breadthDaily) {
    const breadth = await fetchLogged('yahoo', 'S&P 500 breadth ratio (RSP ÷ SPY, daily closes)', () =>
      fetchSp500BreadthRatio(),
    );
    if (breadth !== undefined) series['sp500-breadth-ratio'] = breadth.ratio;
  }

  return { series, reports };
}
