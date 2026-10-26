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
import { fetchEiaCrudeStocks } from './eia-stocks';
import { fetchCftcGoldPositioning } from './cftc';

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
  // A-8..A-10 join this list as their additions land (one commit each).
];

/** Which feeds a rung-2 execution fetches. */
export interface Rung2FetchPlan {
  /** MOF jgbcme (daily; the all-file monthly/first run). */
  mof: boolean;
  /** The weekly EIA crude-stocks page (Saturday + bootstrap). */
  eiaWeekly: boolean;
  /** The weekly CFTC COT file (Saturday + bootstrap). */
  cftcWeekly: boolean;
  /** The monthly OECD CLI + GPR + EPU feeds (first-of-month + bootstrap). */
  monthly: boolean;
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
    missing.has('epu-us');
  return {
    mof: true, // daily; the all-file only on monthly/bootstrap (see collect)
    eiaWeekly: isSaturday(date) || missing.has('eia-crude-stocks'),
    cftcWeekly: isSaturday(date) || missing.has('cftc-gold-positioning'),
    monthly: isFirstOfMonth(date) || needMonthly,
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
  if (plan.eiaWeekly) {
    const stocks = await fetchLogged('eia', 'crude oil ending stocks WCRSTUS1 (weekly, keyless website route)', () =>
      fetchEiaCrudeStocks(),
    );
    if (stocks !== undefined) series['eia-crude-stocks'] = stocks;
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

  return { series, reports };
}
