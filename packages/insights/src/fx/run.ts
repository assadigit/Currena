/**
 * World currencies — the one update orchestration shared by the
 * currena-markets Worker cron (the fx job rides its two triggers) AND the
 * manual fx-run script (the two cannot drift apart — the live-run/ingest
 * discipline):
 *
 *   read stored → read the cross-section keys → run the §4 fetch job →
 *   build the snapshot → write ONLY if the content changed.
 *
 * A failed WRITE is not fatal: the account's daily KV write budget is
 * usually saturated by ~18:30 UTC (see ../markets/store.ts), so a run's
 * write can bounce — the markets retry run two hours later re-computes and
 * lands it in the fresh post-midnight slice. The failure rides back in the
 * result for the run log.
 */

import type { FxSnapshot } from '@currena/core';
import type { FxJobReport } from './job';
import { runFxJob } from './job';
import type { FxJobFetchers } from './job';
import { fxContentEqual } from './compute';
import type { FxCrossReader, FxReader, FxWriter } from './store';

export interface RunFxDeps {
  /** The fx KV store (binding-backed in the Worker, REST-backed in the script). */
  store: FxReader & FxWriter;
  /** The cross-section reads (markets, gold, stress gauges). */
  cross: FxCrossReader;
  /** Provider fetchers (real ones close over global fetch). */
  fetchers: FxJobFetchers;
  /** Injectable clock (tests drive a whole 24 h through it). */
  now?: Date;
}

export interface RunFxResult {
  /** True when a new snapshot was written to KV this run. */
  wroteSnapshot: boolean;
  /** True when content was unchanged and the write was skipped. */
  unchanged: boolean;
  /** True when nothing honest existed to store (all-failure first run). */
  nothingToStore: boolean;
  snapshot?: FxSnapshot;
  report: FxJobReport;
  /** KV write failure (e.g. the daily cap) — informational, NOT fatal. */
  writeError?: string;
}

export async function runFxUpdate(deps: RunFxDeps): Promise<RunFxResult> {
  const now = deps.now ?? new Date();
  const runDate = now.toISOString().slice(0, 10);
  const generatedAt = now.toISOString();

  const prev = await deps.store.getFx();
  const job = await runFxJob(deps.fetchers, prev, deps.cross, runDate, generatedAt);

  if (job.snapshot === undefined) {
    // Every provider failed and there is nothing stored: nothing honest to
    // write — the page keeps its calm "being prepared" state.
    return { wroteSnapshot: false, unchanged: false, nothingToStore: true, report: job.report };
  }

  // Write-only-if-changed, comparing content (never generatedAt).
  if (fxContentEqual(prev, job.snapshot)) {
    return { wroteSnapshot: false, unchanged: true, nothingToStore: false, snapshot: job.snapshot, report: job.report };
  }

  try {
    const outcome = await deps.store.putFxIfChanged(job.snapshot);
    return {
      wroteSnapshot: outcome === 'written',
      unchanged: outcome === 'unchanged',
      nothingToStore: false,
      snapshot: job.snapshot,
      report: job.report,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      wroteSnapshot: false,
      unchanged: false,
      nothingToStore: false,
      snapshot: job.snapshot,
      report: job.report,
      writeError: message,
    };
  }
}

/** Human-readable run report (worker logs / script stdout). */
export function formatFxRunReport(result: RunFxResult): string {
  const r = result.report;
  const head =
    `# fx run — ${r.usedSource} · ` +
    `${r.providerCalls.frankfurter} Frankfurter + ${r.providerCalls.yahoo} Yahoo calls`;
  const rows = r.notes.map((n) => `  · ${n}`);
  const held = r.held.length > 0 ? [`  · held rows: ${r.held.join(', ')}`] : [];
  const tail = result.nothingToStore
    ? '  → nothing to store (providers failed; nothing previously stored)'
    : result.writeError !== undefined
      ? `  → WRITE FAILED (non-fatal, the next run lands it): ${result.writeError.slice(0, 200)}`
      : result.wroteSnapshot
        ? `  → written (${result.snapshot?.summary.signal} · counted=${result.snapshot?.summary.countedWarnings} · pairs=${result.snapshot?.pairs.length})`
        : '  → unchanged (no write spent)';
  return [head, ...rows, ...held, tail].join('\n');
}
