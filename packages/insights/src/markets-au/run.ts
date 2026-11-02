/**
 * @currena/insights/markets-au/run — the one update orchestration for the
 * Australian markets board (gap-closure S5-M5.4).
 *
 * The world board's runMarketsUpdate twin, Yahoo-only: read stored → run
 * the job → build the snapshot → write-only-if-changed. A bounced KV
 * write is non-fatal (the next cron run lands it).
 */

import type { AuMarketsSnapshot } from '@currena/core';
import type { AuMarketsReader, AuMarketsWriter } from './store';
import {
  auMarketsContentEqual,
  buildAuMarketsSnapshot,
  reStaleAuMarketsSnapshot,
} from './compute';
import type { AuMarketJobFetchers, AuMarketJobResult, AuMarketRunKind, AuMarketJobOptions } from './job';
import { runAuMarketsJob } from './job';

export interface RunAuMarketsUpdateDeps {
  store: AuMarketsReader & AuMarketsWriter;
  fetchers: AuMarketJobFetchers;
  now?: Date;
  /** Politeness pause between Yahoo calls (ms); defaults to the job's 300. */
  politenessMs?: number;
}

export interface RunAuMarketsUpdateResult {
  kind: AuMarketRunKind;
  wroteSnapshot: boolean;
  unchanged: boolean;
  nothingToStore: boolean;
  snapshot?: AuMarketsSnapshot;
  job: AuMarketJobResult;
  writeError?: string;
}

/**
 * Read stored → run the job → build the snapshot → write-only-if-changed.
 * The store's own start-of-run read is passed as `prev` to the write gate
 * (one fewer KV op per invocation). A bounced write carries back in
 * `writeError`, NON-FATAL — the data is computed; the next run lands it.
 */
export async function runAuMarketsUpdate(
  deps: RunAuMarketsUpdateDeps,
  kind: AuMarketRunKind,
  options?: Pick<AuMarketJobOptions, 'onlyIds'>,
): Promise<RunAuMarketsUpdateResult> {
  const now = deps.now ?? new Date();
  const runDate = now.toISOString().slice(0, 10);
  const runTimeIso = now.toISOString();

  const prev = await deps.store.getAuMarkets();
  const job = await runAuMarketsJob(
    { fetchers: deps.fetchers, politenessMs: deps.politenessMs },
    { kind, ...(options?.onlyIds !== undefined ? { onlyIds: options.onlyIds } : {}) },
    prev,
    runDate,
    runTimeIso,
  );

  // Re-stale the stored rows before assembly so held rows carry the
  // honest stale flag for the run date (mirrors the world board).
  const prevReStaled = prev === undefined ? undefined : reStaleAuMarketsSnapshot(prev, runDate);
  const snapshot = buildAuMarketsSnapshot({
    resolutions: job.resolutions,
    prev: prevReStaled,
    runDate,
    generatedAt: runTimeIso,
  });

  if (snapshot === undefined) {
    return {
      kind,
      wroteSnapshot: false,
      unchanged: false,
      nothingToStore: true,
      job,
    };
  }

  if (auMarketsContentEqual(prev, snapshot)) {
    return { kind, wroteSnapshot: false, unchanged: true, nothingToStore: false, snapshot, job };
  }

  try {
    await deps.store.putAuMarketsIfChanged(snapshot, prev);
    return { kind, wroteSnapshot: true, unchanged: false, nothingToStore: false, snapshot, job };
  } catch (err) {
    return {
      kind,
      wroteSnapshot: false,
      unchanged: false,
      nothingToStore: false,
      snapshot,
      job,
      writeError: err instanceof Error ? err.message : String(err),
    };
  }
}

/** A short human-readable run report (the runner / worker log line). */
export function formatAuRunReport(result: RunAuMarketsUpdateResult): string {
  const { job, wroteSnapshot, unchanged, nothingToStore, writeError } = result;
  const ok = job.reports.filter((r) => !r.held).length;
  const held = job.reports.filter((r) => r.held).length;
  const lines = [
    `[markets-au] ${result.kind}: ${ok} written · ${held} held · ${job.providerCalls.yahoo} Yahoo calls`,
  ];
  if (wroteSnapshot) lines.push('snapshot written');
  else if (unchanged) lines.push('snapshot unchanged (write skipped)');
  else if (nothingToStore) lines.push('nothing to store (every fetch failed)');
  if (writeError !== undefined) lines.push(`write error (non-fatal): ${writeError}`);
  return lines.join(' · ');
}
