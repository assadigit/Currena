/**
 * Live prices — the refresh job, run hourly by the currena-api Worker's
 * :13 minute rung (and verbatim by the manual prices-run script — the two
 * cannot drift apart, the live-run/ingest discipline):
 *
 *   read stored → per asset: skip when fresher than the interval, fetch,
 *   hold the last good quote on failure → write ONLY if content changed.
 *
 * Budget shape (free-tier physics, all verified numbers in definitions.ts):
 *   - Yahoo: keyless, 4 chart calls per rung (no EODHD quota involvement);
 *   - KV writes: write-only-if-changed → ≤ ~24/day while prices move;
 *   - subrequests: 4 per rung — the minute cron's own ladder uses 1–2, so
 *     the rung stays far under the 50-subrequest cap.
 *
 * A failed WRITE (the account's daily KV cap, saturated by the rates cron
 * by ~18:30 UTC) is NOT fatal: the stored quotes stay last-known-good and
 * the post-midnight rung lands the next change in the fresh budget slice.
 */

import type { LivePriceEntry, LivePricesSnapshot, PriceAssetId } from '@currena/core';
import type { YahooQuoteOptions } from '../adapters/yahoo';
import { fetchLivePriceEntry } from './providers';
import { INTERVAL_SLACK_MINUTES, LIVE_PRICE_ASSETS, PRICE_ASSET_IDS } from './definitions';
import type { PricesReader, PricesWriter } from './store';
import { livePricesContentEqual } from './store';
import { providerFetchEnabled } from '../sources';

export interface PricesJobFetchers {
  fetchAsset: (assetId: PriceAssetId, rememberedSymbol?: string) => Promise<LivePriceEntry>;
}

/** Default fetchers over the real provider (tests inject fakes). */
export function defaultPricesFetchers(opts: YahooQuoteOptions = {}): PricesJobFetchers {
  return {
    fetchAsset: (assetId, rememberedSymbol) => fetchLivePriceEntry(assetId, opts, new Date(), rememberedSymbol),
  };
}

export interface PricesJobReport {
  assetId: PriceAssetId;
  outcome: 'fetched' | 'skipped-fresh' | 'held';
  note?: string;
}

export interface RunPricesUpdateDeps {
  /** The KV store (binding-backed in the Worker, REST-backed in the script). */
  store: PricesReader & PricesWriter;
  /** Provider fetchers (real ones close over global fetch). */
  fetchers: PricesJobFetchers;
  /** Injectable clock (tests drive the interval gate through it). */
  now?: Date;
}

export interface RunPricesUpdateResult {
  /** True when a new snapshot was written to KV this run. */
  wroteSnapshot: boolean;
  /** True when content was unchanged and the write was skipped. */
  unchanged: boolean;
  /** True when nothing honest existed to store (all fetches failed, nothing stored). */
  nothingToStore: boolean;
  /** The snapshot this run computed (entries: fetched + held). */
  snapshot?: LivePricesSnapshot;
  reports: readonly PricesJobReport[];
  /** KV write failure (e.g. the daily cap) — informational, NOT fatal. */
  writeError?: string;
  /** v3 M-6: the run was skipped because its source is disabled (kill switch). */
  skippedReason?: string;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** True when the stored quote is still inside its volatility interval (with scheduling slack). */
export function withinInterval(entry: LivePriceEntry, assetId: PriceAssetId, now: Date): boolean {
  const intervalMinutes = LIVE_PRICE_ASSETS[assetId].intervalMinutes;
  const elapsedMs = now.getTime() - Date.parse(entry.updatedAt);
  return elapsedMs < Math.max(0, intervalMinutes - INTERVAL_SLACK_MINUTES) * 60_000;
}

export async function runPricesUpdate(deps: RunPricesUpdateDeps): Promise<RunPricesUpdateResult> {
  const now = deps.now ?? new Date();

  // v3 M-6 kill switch (2026-10-20): every live quote comes from Yahoo —
  // with the register row disabled the whole job is skipped (nothing
  // fetched, nothing written; the stored quotes keep aging honestly).
  if (!providerFetchEnabled('yahoo')) {
    return {
      wroteSnapshot: false,
      unchanged: false,
      nothingToStore: true,
      reports: [],
      skippedReason: 'source disabled (kill switch M-6) — not requested',
    };
  }

  const stored = await deps.store.getLivePrices();

  const assets: Partial<Record<PriceAssetId, LivePriceEntry>> = {};
  const reportsList: PricesJobReport[] = [];
  for (const assetId of PRICE_ASSET_IDS) {
    const prevEntry = stored?.assets[assetId];
    if (prevEntry !== undefined && withinInterval(prevEntry, assetId, now)) {
      assets[assetId] = prevEntry;
      reportsList.push({ assetId, outcome: 'skipped-fresh' });
      continue;
    }
    try {
      // 2026-10-29 (the Brent wrong-contract fix): the previous entry's
      // sourceSymbol rides along — Brent's front-month probe re-tries the
      // remembered contract FIRST (one call in the steady state).
      const entry = await deps.fetchers.fetchAsset(assetId, prevEntry?.sourceSymbol);
      assets[assetId] = entry;
      reportsList.push({ assetId, outcome: 'fetched' });
    } catch (err) {
      // Fault isolation (R7 discipline): one symbol's failure never fails
      // the run — the stored quote survives; absent means absent.
      if (prevEntry !== undefined) {
        assets[assetId] = prevEntry;
        reportsList.push({ assetId, outcome: 'held', note: errMessage(err).slice(0, 160) });
      } else {
        reportsList.push({ assetId, outcome: 'held', note: `no stored quote either: ${errMessage(err).slice(0, 120)}` });
      }
    }
  }

  const entries = Object.fromEntries(
    (Object.keys(assets) as PriceAssetId[]).map((id) => [id, assets[id]!]),
  ) as Record<PriceAssetId, LivePriceEntry>;

  const presentCount = Object.keys(entries).length;
  if (presentCount === 0) {
    // Every fetch failed and nothing was stored — nothing honest to write.
    return { wroteSnapshot: false, unchanged: false, nothingToStore: true, reports: reportsList };
  }

  const snapshot: LivePricesSnapshot = {
    v: 1,
    generatedAt: now.toISOString(),
    assets: entries,
  };

  // Write-only-if-changed, comparing content (never generatedAt/updatedAt).
  if (livePricesContentEqual(stored, snapshot)) {
    return { wroteSnapshot: false, unchanged: true, nothingToStore: false, snapshot, reports: reportsList };
  }

  try {
    const outcome = await deps.store.putLivePricesIfChanged(snapshot);
    return {
      wroteSnapshot: outcome === 'written',
      unchanged: outcome === 'unchanged',
      nothingToStore: false,
      snapshot,
      reports: reportsList,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      wroteSnapshot: false,
      unchanged: false,
      nothingToStore: false,
      snapshot,
      reports: reportsList,
      writeError: message,
    };
  }
}

/** Human-readable one-line-per-asset run report (worker logs / script stdout). */
export function formatPricesReport(result: RunPricesUpdateResult): string {
  const head = `# prices run — ${result.reports.filter((r) => r.outcome === 'fetched').length} fetched · ` +
    `${result.reports.filter((r) => r.outcome === 'skipped-fresh').length} skipped (fresh) · ` +
    `${result.reports.filter((r) => r.outcome === 'held').length} held`;
  const rows = result.reports.map((r) => {
    const bits = [`${r.assetId}: ${r.outcome}`];
    if (r.note !== undefined) bits.push(r.note);
    return `  ${bits.join(' · ')}`;
  });
  const tail = result.nothingToStore
    ? '  → nothing to store (all fetches failed; nothing previously stored)'
    : result.writeError !== undefined
      ? `  → WRITE FAILED (non-fatal, next rung retries): ${result.writeError.slice(0, 200)}`
      : result.wroteSnapshot
        ? `  → written (${Object.keys(result.snapshot?.assets ?? {}).length} assets)`
        : '  → unchanged (no write spent)';
  return [head, ...rows, tail].join('\n');
}
