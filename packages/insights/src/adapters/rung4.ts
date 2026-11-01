/**
 * rung4.ts — gap-closure S3-M3.2 (2026-11-01): the fourth-rung source
 * collection — the US liquidity/funding/macro FRED families whose fetches
 * must NEVER ride the 04:10 main rung (~47/50 subrequests, the free-tier
 * budget table; docs/gap-closure/RUNGS.md). The rung4 machinery
 * (apps/api/src/insights-extra-rungs.ts, the 04:35 UTC slot) registers
 * this collection as the 'fred-s3' extra source; the Node venue
 * (packages/insights/scripts/ingest.ts) runs the SAME collection inline so
 * the venues cannot drift apart (the rung-2 discipline).
 *
 *   04:10 — the main rung: full collect + snapshot + stage. The rung-4
 *           ids' readings CARRY FORWARD from the previous snapshot (their
 *           series are absent by design — see run.ts carryForwardIds).
 *   04:35 — THIS collection (the Worker's rung4 extra source): fetch the
 *           two FRED_S3_GROUPS ZIP requests, derive the S3 indicator
 *           series (the pure functions below), recompute their readings,
 *           PATCH the snapshot + public projection, update the stage, and
 *           write the rung-4 ids' OWN history keys (the 04:25/04:27 daily
 *           history phases exclude RUNG4_IDS — they run 10 minutes BEFORE
 *           this rung, so the phase owns its histories to stay fresh;
 *           see runInsightsRung4Phase in ingest/run.ts).
 *
 * Purity discipline: the derivations (repoStressSeries, netLiquiditySeries,
 * trimFutureDated) are pure and unit-tested; the collection is fail-soft
 * per group (one failing ZIP never sinks the other — the rung2 collect
 * discipline, honest report rows in insights:status).
 */

import type { IndicatorId, InsightsSourceReport } from '@currena/core';
import { FRED_SERIES, fetchFredSeriesBulk, FRED_S3_GROUPS, fredGroupFrom } from './fred';
import { combineSeries, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/**
 * The ids this rung owns (grows with each S3 milestone). The main rung's
 * build carries these forward; the 04:35 phases + the Node venue's inline
 * build derive them fresh. M3.4/M3.5 append their ids here. gap-closure
 * S3-M3.3 (2026-11-01): the credit pair joins the FAMILY (the rung's
 * carry/history-exclusion discipline) but is FETCHED + patched by its OWN
 * phase (runInsightsCreditPhase — adapters/credit.ts), not this module's
 * FRED phase: different hosts, different cadence gates.
 */
export const RUNG4_IDS: readonly IndicatorId[] = [
  'term-premium-10y',
  'tga',
  'reverse-repo',
  'bank-reserves',
  'repo-stress', // derived: SOFR − IORB
  'net-liquidity', // derived: WALCL − TGA − RRP
  'ebp', // gap-closure S3-M3.3: the Fed Board EBP file (its own phase)
  'ofr-fsi', // gap-closure S3-M3.3: the OFR FSI aggregate file (its own phase)
];

/** The rung-4 collection's output: raw FRED series + honest report rows. */
export interface Rung4CollectResult {
  /** The fetched series keyed by FRED series id (IORB future-trimmed). */
  fred: Partial<Record<string, SeriesPoint[]>>;
  /** Per-group fetch outcome rows (appended to insights:status). */
  reports: InsightsSourceReport[];
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Fetch deps + the collection's clock (the rung2 collect's shape). */
export type Rung4CollectDeps = FetchDeps & { now?: Date };

/**
 * Collect the S3 FRED groups (fail-soft per group, F-11 single attempt).
 * IORB's administratively announced FUTURE rows are trimmed to today at
 * this boundary (the M3.1 finding: the series carries e.g. 2026-11-02
 * while today is 2026-11-01 — a future IORB must never join a same-day
 * SOFR leg or lead the card's asOf).
 */
export async function collectRung4Sources(deps: Rung4CollectDeps = {}): Promise<Rung4CollectResult> {
  const reports: InsightsSourceReport[] = [];
  const fred: Partial<Record<string, SeriesPoint[]>> = {};
  const now = deps.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  for (const [index, group] of FRED_S3_GROUPS.entries()) {
    const label = `fred-s3 group ${index + 1} (${group.seriesIds.join(',')})`;
    try {
      const fetched = await fetchFredSeriesBulk(group.seriesIds, deps, fredGroupFrom(group, now));
      for (const [id, series] of Object.entries(fetched)) {
        // IORB: drop the announced-but-not-yet-effective rows (future dates).
        fred[id] = id === FRED_SERIES.iorb ? trimFutureDated(series, today) : series;
      }
      reports.push({ source: 'fred-s3', ok: true, detail: `${label}: ${Object.keys(fetched).length} series`, kind: 'fetched' });
    } catch (err) {
      reports.push({ source: 'fred-s3', ok: false, detail: `${label}: ${errMessage(err)}`, kind: 'failed' });
    }
  }
  return { fred, reports };
}

/** Drop observations dated strictly after `today` (IORB's announced rows). Pure. */
export function trimFutureDated(series: readonly SeriesPoint[], today: string): SeriesPoint[] {
  return series.filter((p) => p.date <= today);
}

/** Quantize to `dp` decimal places (the F4 float-noise discipline). */
function quantized(series: SeriesPoint[], dp: number): SeriesPoint[] {
  const f = 10 ** dp;
  return series.map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
}

/**
 * The funding-pressure spread: SOFR − IORB, inner-joined on common dates
 * (the same-date rule — the breakeven-tilt discipline; no leg-divergence
 * gapLegs because the join date IS the reading date by construction).
 * 4dp quantized. Pure; returns [] when the legs share no date (the caller
 * fails closed — no repo-stress reading that run).
 */
export function repoStressSeries(sofr: readonly SeriesPoint[], iorb: readonly SeriesPoint[]): SeriesPoint[] {
  return quantized(combineSeries(sofr, iorb, (s, i) => s - i), 4);
}

/**
 * RRPONTSYD is $ BILLIONS; WALCL/WTREGEN are $ MILLIONS — the conversion
 * (×1000) is the derivation's own documented constant, never a display
 * scale (the net-liquidity card stores $ millions like its legs).
 */
export const RRP_BN_TO_M = 1000;

/**
 * Net liquidity = WALCL − TGA − RRP(×1000 $B→$M), inner-joined on the
 * shared Wednesday dates (all three legs are Wednesday-keyd weeklies in
 * practice; the join is the same-date rule). 4dp quantized. Pure; [] when
 * the legs share no date (fail closed — never a partial-liquidity number).
 */
export function netLiquiditySeries(
  walcl: readonly SeriesPoint[],
  tga: readonly SeriesPoint[],
  rrp: readonly SeriesPoint[],
): SeriesPoint[] {
  // First the $B → $M conversion, then one subtraction chain on common dates.
  const rrpMillions = rrp.map((p) => ({ date: p.date, value: p.value * RRP_BN_TO_M }));
  const drain = combineSeries(tga, rrpMillions, (t, r) => t + r);
  return quantized(combineSeries(walcl, drain, (w, d) => w - d), 4);
}

/** The staged/main-collect legs the S3 derivations join (the phase reads
 * sofr/walcl from the stage; the inline build reads them from inputs.fred). */
export interface Rung4DeriveLegs {
  /** FRED SOFR (the main rung's daily group) — the repo-stress leg. */
  sofr?: readonly SeriesPoint[];
  /** FRED WALCL (the main rung's mixed-frequency group) — the net-liquidity leg. */
  walcl?: readonly SeriesPoint[];
}

/**
 * Derive the rung-4 indicator series from the fetched S3 map + the legs.
 * Pure; total (a missing input simply omits the affected indicator — the
 * runner renders those unavailable / carries the previous reading).
 * M3.4/M3.5 append their derivations here.
 */
export function deriveRung4IndicatorSeries(
  fredS3: Partial<Record<string, SeriesPoint[]>> | undefined,
  legs: Rung4DeriveLegs,
): Partial<Record<IndicatorId, SeriesPoint[]>> {
  const out: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
  const put = (id: IndicatorId, series: SeriesPoint[] | undefined) => {
    if (series !== undefined && series.length > 0) out[id] = series;
  };
  const s3 = fredS3 ?? {};

  put('term-premium-10y', s3[FRED_SERIES.termPremium10y]);
  put('tga', s3[FRED_SERIES.tga]);
  put('reverse-repo', s3[FRED_SERIES.reverseRepo]);
  put('bank-reserves', s3[FRED_SERIES.bankReserves]);

  const iorb = s3[FRED_SERIES.iorb];
  if (legs.sofr !== undefined && iorb !== undefined) {
    put('repo-stress', repoStressSeries(legs.sofr, iorb));
  }
  const tga = s3[FRED_SERIES.tga];
  const rrp = s3[FRED_SERIES.reverseRepo];
  if (legs.walcl !== undefined && tga !== undefined && rrp !== undefined) {
    put('net-liquidity', netLiquiditySeries(legs.walcl, tga, rrp));
  }
  return out;
}
