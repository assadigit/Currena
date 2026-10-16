/**
 * Server-side rolling rate history (Task 24 — sparkline honesty fix).
 *
 * The client rate-history (apps/web/src/lib/rate-history.ts) only records the
 * generations a visitor's OWN app served — a brand-new device sees 1–2 flat
 * points, and since TGJU re-quotes every currency at once, every per-currency
 * sparkline normalizes to the SAME step shape ("drop, then flat"). The owner
 * read that as a bug; the data was just too local.
 *
 * This module records DISTINCT generations in Workers KV on every live scrape
 * (cron `* * * * *` + user-triggered ladder scrapes, both keyed off
 * servedFrom === 'live'):
 *
 *   history:<source> → { v: 1, gens: HistoryGeneration[] }
 *
 * Write discipline (free-tier KV safety):
 *   - a generation is appended ONLY when a rate moves materially vs the last
 *     RECORDED generation — a relative deadband (HISTORY_RECORD_DEADBAND,
 *     0.05%) measured 2026-10-16 over 240 live TGJU ticks: per-tick re-quote
 *     jitter is median 0.01–0.04% (EUR/GBP/CHF change on nearly every tick),
 *     so exact-value dedup recorded noise every 6 minutes, burned the 240-slot
 *     window in ~24h and rendered sparklines as a full-height sawtooth (the
 *     owner's "the graph looks placeholder/buggy" report). The deadband is
 *     hysteresis around the last recorded LEVEL: sub-noise wiggles never
 *     record, and genuine slow drift records at its first cumulative
 *     ≥0.05% step — the window then spans real market movement, not hours
 *     of jitter. The upstream USD quote bobbing between two levels 0.37%
 *     apart still records (a real served quote is never rewritten); the
 *     client additionally smooths the DRAWN line, see
 *     apps/web/src/lib/live-rate.ts bucketMean;
 *   - capped at HISTORY_MAX_GENERATIONS entries (old points drop off);
 *   - single logical writer per minute (the cron) — KV last-write-wins races
 *     are limited to concurrent user-triggered scrapes and are idempotent in
 *     content terms.
 *
 * Read side: GET /api/history?source= merges this into the client window so
 * sparklines draw days of genuinely diverging per-currency movement.
 *
 * No expirationTtl — the history is the product of every past scrape; losing
 * it to a TTL would silently degrade the sparklines back to the local-only
 * behavior this task fixes.
 */

import type { Snapshot, SnapshotSource } from '@currena/core';

/** ~10 days at a handful of real re-quotes per day; ≈80 KB of JSON. */
export const HISTORY_MAX_GENERATIONS = 240;

/** One recorded generation — the same shape the client history stores. */
interface HistoryGeneration {
  /** Snapshot.fetchedAt (ISO) — the generation identity. */
  at: string;
  /** Snapshot.source. */
  source: SnapshotSource;
  /** Snapshot.base — the currency all `rates` are quoted against. */
  base: string;
  /** code → rate vs the snapshot base. */
  rates: Record<string, number>;
}

interface HistoryFile {
  v: 1;
  gens: HistoryGeneration[];
}

const historyKey = (source: SnapshotSource): string => `history:${source}`;

/**
 * Smallest per-rate relative move (vs the last RECORDED generation) that
 * counts as a market change. 0.05% sits ABOVE TGJU's per-tick re-quote
 * jitter (median 0.01–0.04%, p90 ~0.12%, measured over 240 live ticks on
 * 2026-10-16) and far BELOW real market moves (the USD window drift over
 * the same sample was 3.1%). A code appearing in / disappearing from the
 * snapshot always counts as a change.
 */
export const HISTORY_RECORD_DEADBAND = 0.0005;

/**
 * Hysteresis vs the last RECORDED level: a candidate generation is
 * material when any rate moved ≥ the deadband relative to the value the
 * history actually holds, or the rate set changed. Sub-deadband re-quote
 * jitter never accumulates into a record (each comparison restarts from
 * the recorded level), while genuine drift records at its first step that
 * crosses the band — the chart's levels stay real, the noise stays out.
 */
function materialChange(last: HistoryGeneration, gen: HistoryGeneration): boolean {
  const lastCodes = Object.keys(last.rates);
  const genCodes = Object.keys(gen.rates);
  if (lastCodes.length !== genCodes.length) return true; // rate set changed
  for (const [code, value] of Object.entries(gen.rates)) {
    const prev = last.rates[code];
    if (prev === undefined) return true; // new code
    if (!Number.isFinite(prev) || prev <= 0) return true; // poisoned baseline
    if (Math.abs(value - prev) / prev >= HISTORY_RECORD_DEADBAND) return true;
  }
  return false;
}

export function toHistoryGeneration(snapshot: Snapshot): HistoryGeneration {
  const rates: Record<string, number> = {};
  for (const r of snapshot.rates) rates[r.code] = r.rate;
  return { at: snapshot.fetchedAt, source: snapshot.source, base: snapshot.base, rates };
}

/** Structural validation for values read back from KV (poisoned-entry rule). */
function validGeneration(gen: unknown): gen is HistoryGeneration {
  if (typeof gen !== 'object' || gen === null) return false;
  const g = gen as Partial<HistoryGeneration>;
  return (
    typeof g.at === 'string' &&
    (g.source === 'tgju' || g.source === 'frankfurter') &&
    typeof g.base === 'string' &&
    typeof g.rates === 'object' &&
    g.rates !== null &&
    Object.values(g.rates).every((v) => typeof v === 'number' && Number.isFinite(v) && v > 0)
  );
}

function parseFile(raw: string | null): HistoryGeneration[] {
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw) as HistoryFile;
    if (typeof parsed !== 'object' || parsed === null || parsed.v !== 1 || !Array.isArray(parsed.gens)) {
      return [];
    }
    return parsed.gens.filter(validGeneration);
  } catch {
    return [];
  }
}

/**
 * Append the snapshot as a new generation IF its rates differ from the last
 * recorded one. Returns true when history changed (a KV write happened).
 * Exposed for the record path only — reads go through readHistory.
 */
export async function recordHistory(
  kv: KVNamespace,
  source: SnapshotSource,
  snapshot: Snapshot,
): Promise<boolean> {
  const gens = parseFile(await kv.get(historyKey(source)));
  const gen = toHistoryGeneration(snapshot);
  const last = gens[gens.length - 1];
  if (last !== undefined && !materialChange(last, gen)) return false; // sub-deadband re-quote — no write
  const next = [...gens.filter((g) => g.at !== gen.at), gen].slice(-HISTORY_MAX_GENERATIONS);
  const file: HistoryFile = { v: 1, gens: next };
  await kv.put(historyKey(source), JSON.stringify(file));
  return true;
}

/** Current rolling history (oldest → newest). Corrupt entries are dropped. */
export async function readHistory(kv: KVNamespace, source: SnapshotSource): Promise<HistoryGeneration[]> {
  return parseFile(await kv.get(historyKey(source)));
}
