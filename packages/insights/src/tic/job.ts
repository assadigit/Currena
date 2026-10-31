/**
 * TIC ingest job (gap-closure S2-M2.2) — the run body the rung3
 * extra-source registers (apps/api/src/insights-extra-rungs.ts).
 *
 * Budget: exactly TWO fetches (both files, the honest 12 s single-attempt
 * policy — ticdata.treasury.gov answers in 8–10 s from Worker egress; the
 * probes live in docs/gap-closure/VERIFIED-SOURCES.md) + one KV read (the
 * idempotence check) + at most one KV write. Declared budget 4.
 *
 * Idempotent: when the fetched data month equals the stored one the write
 * is SKIPPED (the 15th–25th daily gate re-checks cheaply; a failed fetch
 * heals via the 10:10/20:10 sweeps, day gate bypassed).
 *
 * Failure taxonomy: BlockedError → 'blocked', FormatChangedError →
 * 'format-changed', anything else → 'failed' (classifySourceError).
 */

import { classifySourceError } from '../adapters/fetch-policy';
import { insightsFetch } from '../adapters/fetch-policy';
import { buildTicSnapshot, TIC_TABLE3_URL, TIC_TABLE5_URL } from './model';
import { parseTicTable3, parseTicTable5 } from './parse';
import type { TicStore } from './store';

export { TIC_TABLE5_URL, TIC_TABLE3_URL };

/** The honest single-attempt timeout for the TIC files. The S1-M1.1
 *  probe measured 8–10 s per file from Worker egress, but the first live
 *  rung3 firing (2026-10-31 21:31 UTC) died at the fetch-policy DEFAULT
 *  12 s ("The operation was aborted due to timeout" — the status record
 *  evidence) — the exact slow-host case VERIFIED-SOURCES prescribes a
 *  longer timeoutMs for (the ArcGIS note; the treasury yield-curve adapter
 *  uses 45 s for the same host family). Still ONE attempt, no retries
 *  (F-11); the rung is alone in its invocation, so 2×30 s wall is safe. */
export const TIC_TIMEOUT_MS = 30_000;

export interface TicJobDeps {
  /** Injectable fetch (tests replay fixtures — never live sites). */
  fetchImpl?: typeof fetch;
  /** Per-attempt timeout. Default: TIC_TIMEOUT_MS (30 s — the slow-host
   *  prescription, still a single honest attempt, F-11). */
  timeoutMs?: number;
  /** Clock (tests). */
  now?: Date;
}

/** The rung-visible outcome shape (mirrors ExtraSourceRunResult). */
export type TicJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface TicJobResult {
  outcome: TicJobOutcome;
  /** The built snapshot when the run succeeded (undefined on failure / unchanged read-back). */
  snapshot?: import('@currena/core').TicSnapshot;
  /** The honest KV accounting for the budget report. */
  kv: { reads: number; writes: number };
}

/**
 * Fetch both tables, parse, cross-check, and write the snapshot when the
 * data month changed. One honest attempt per file — no retries (F-11).
 * The store ports (TicReader + TicWriter) keep the idempotence check on
 * the SAME validated read path the endpoint serves.
 */
export async function runTicIngest(store: TicStore, deps: TicJobDeps = {}): Promise<TicJobResult> {
  const now = deps.now ?? new Date();
  const kvAccounting = { reads: 0, writes: 0 };
  try {
    const res5 = await insightsFetch(TIC_TABLE5_URL, {}, { fetchImpl: deps.fetchImpl, timeoutMs: deps.timeoutMs ?? TIC_TIMEOUT_MS });
    const res3 = await insightsFetch(TIC_TABLE3_URL, {}, { fetchImpl: deps.fetchImpl, timeoutMs: deps.timeoutMs ?? TIC_TIMEOUT_MS });
    const t5 = parseTicTable5(await res5.text());
    const t3 = parseTicTable3(await res3.text());

    // releasedAt: the provider's own file timestamp (display-only).
    const lastModified = res5.headers.get('last-modified');
    const releasedAt =
      lastModified !== null && lastModified !== '' ? new Date(lastModified).toISOString() : undefined;

    const snapshot = buildTicSnapshot(t5, t3, {
      fetchedAt: now.toISOString(),
      releasedAt,
      sourceUrls: [TIC_TABLE5_URL, TIC_TABLE3_URL],
    });

    // Idempotence: same data month → no write.
    kvAccounting.reads += 1;
    const stored = await store.getTic();
    if (stored?.dataMonth === snapshot.dataMonth) {
      return {
        outcome: { ok: true, note: `unchanged — data month ${snapshot.dataMonth} already stored (no write)` },
        snapshot,
        kv: kvAccounting,
      };
    }
    kvAccounting.writes += 1;
    await store.putTic(snapshot);
    return {
      outcome: { ok: true, note: `written — data month ${snapshot.dataMonth}, ${snapshot.holders.length} holders` },
      snapshot,
      kv: kvAccounting,
    };
  } catch (err) {
    const kind = classifySourceError(err);
    return {
      outcome: { ok: false, kind, note: err instanceof Error ? err.message : String(err) },
      kv: kvAccounting,
    };
  }
}
