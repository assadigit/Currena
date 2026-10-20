/**
 * World stock markets — the one update orchestration shared by the
 * currena-markets Worker cron AND the manual runner script (the two cannot
 * drift apart — the live-run/ingest discipline):
 *
 *   read stored → run the §3.4 fetch job (main or retry shape) →
 *   build the merged snapshot → write ONLY if the content changed.
 *
 * A failed WRITE is not fatal: the account's daily KV write budget is
 * usually saturated by ~18:30 UTC (see store.ts), so the main run's write
 * bounces and the retry run — landing in the fresh post-midnight slice —
 * performs the day's single write. The failure rides back in the result
 * for the run log; the data itself was computed and will re-compute
 * identically on the retry.
 */

import type { MarketsSnapshot } from '@currena/core';
import type { MarketJobFetchers, MarketJobReport } from './job';
import { retryRunOptions, runMarketsJob } from './job';
import { buildMarketsSnapshot } from './compute';
import { marketsContentEqual } from './compute';
import { checkE05IdenticalMoves } from '../validation-step3';
import type { MarketsReader, MarketsWriter } from './store';

export interface RunMarketsUpdateDeps {
  /** The KV store (binding-backed in the Worker, REST-backed in the script). */
  store: MarketsReader & MarketsWriter;
  /** Provider fetchers (real ones close over the EODHD token / global fetch). */
  fetchers: MarketJobFetchers;
  /** Injectable clock (tests drive a whole 24 h through it). */
  now?: Date;
}

export interface RunMarketsUpdateResult {
  kind: 'main' | 'retry';
  /** Provider order actually used (the retry's quota guard decides). */
  providerOrder: 'eodhd-first' | 'yahoo-first';
  /** True when a new snapshot was written to KV this run. */
  wroteSnapshot: boolean;
  /** True when content was unchanged and the write was skipped. */
  unchanged: boolean;
  /** True when nothing honest existed to store (all-failure first run). */
  nothingToStore: boolean;
  snapshot?: MarketsSnapshot;
  reports: readonly MarketJobReport[];
  providerCalls: { eodhd: number; yahoo: number };
  /**
   * Defect E-05 (2026-10-16): unrelated symbols whose daily moves are
   * identical to two decimals — flagged for human eyes in the run report
   * (may be a coincidence; the check exists so a copy/mapping bug cannot
   * hide). Informational, never blocks the write.
   */
  moveWarnings: readonly string[];
  /** KV write failure (e.g. the daily cap) — informational, NOT fatal. */
  writeError?: string;
}

export async function runMarketsUpdate(
  deps: RunMarketsUpdateDeps,
  kind: 'main' | 'retry',
  opts?: { providerOrder?: 'eodhd-first' | 'yahoo-first' },
): Promise<RunMarketsUpdateResult> {
  const now = deps.now ?? new Date();
  const runDate = now.toISOString().slice(0, 10);
  const generatedAt = now.toISOString();

  const prev = await deps.store.getMarkets();

  // The main run fetches everything, EODHD first (§3.4 verbatim). The retry
  // re-fetches only failed-or-old markets and guards the EODHD quota when
  // the whole snapshot is old (see job.ts for the quota math). An explicit
  // order (the Worker's missing-secret fallback) wins over both.
  const options =
    kind === 'main'
      ? { kind: 'main' as const, providerOrder: opts?.providerOrder ?? ('eodhd-first' as const) }
      : retryRunOptions(prev, runDate);
  if (opts?.providerOrder !== undefined) options.providerOrder = opts.providerOrder;

  const job = await runMarketsJob(deps.fetchers, options, prev, runDate, generatedAt);
  const snapshot = buildMarketsSnapshot({
    resolutions: job.resolutions,
    prev,
    runDate,
    generatedAt,
  });

  const base = {
    kind,
    providerOrder: options.providerOrder,
    reports: job.reports,
    providerCalls: job.providerCalls,
    moveWarnings:
      snapshot === undefined
        ? ([] as string[])
        : checkE05IdenticalMoves(snapshot.markets.map((m) => ({ id: m.id as string, chg1d: m.chg1d }))),
  };

  if (snapshot === undefined) {
    // Every provider failed and there is nothing stored: nothing honest to
    // write — the page keeps its calm "being prepared" state.
    return { ...base, wroteSnapshot: false, unchanged: false, nothingToStore: true };
  }

  // Write-only-if-changed, comparing content (never generatedAt).
  if (marketsContentEqual(prev, snapshot)) {
    return { ...base, wroteSnapshot: false, unchanged: true, nothingToStore: false, snapshot };
  }

  try {
    // A-6: the run passes its own start-of-run read as the write gate's
    // comparison base — one fewer same-invocation KV op (the worst-case
    // subrequest budget drops 50 → 48, including KV ops). The run is the
    // only writer inside this invocation, so prev cannot be stale.
    const outcome = await deps.store.putMarketsIfChanged(snapshot, prev);
    return {
      ...base,
      wroteSnapshot: outcome === 'written',
      unchanged: outcome === 'unchanged',
      nothingToStore: false,
      snapshot,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      wroteSnapshot: false,
      unchanged: false,
      nothingToStore: false,
      snapshot,
      writeError: message,
    };
  }
}

/** Human-readable one-line-per-market run report (worker logs / script stdout). */
export function formatRunReport(result: RunMarketsUpdateResult): string {
  const head =
    `# markets run — ${result.kind} (${result.providerOrder}) · ` +
    `${result.providerCalls.eodhd} EODHD + ${result.providerCalls.yahoo} Yahoo calls`;
  const rows = result.reports.map((r) => {
    const bits = [`${r.id}: ${r.usedSource}`];
    if (r.held) bits.push('HELD');
    if (r.notes.length > 0) bits.push(r.notes.join('; '));
    return `  ${bits.join(' · ')}`;
  });
  // Defect E-05: identical daily moves on unrelated symbols — for human eyes.
  const warnings = result.moveWarnings.map((w) => `  ⚠ E-05 ${w}`);
  const tail = result.nothingToStore
    ? '  → nothing to store (all providers failed; nothing previously stored)'
    : result.writeError !== undefined
      ? `  → WRITE FAILED (non-fatal, retry run will land it): ${result.writeError.slice(0, 200)}`
      : result.wroteSnapshot
        ? `  → written (${result.snapshot?.summary.signal} · n=${(result.snapshot?.summary.nAttention ?? 0) + (result.snapshot?.summary.nUnusual ?? 0)})`
        : '  → unchanged (no write spent)';
  return [head, ...rows, ...warnings, tail].join('\n');
}
