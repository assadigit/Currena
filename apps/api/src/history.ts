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
 *   - a generation is appended ONLY when the rate VALUES actually changed
 *     (content fingerprint vs the last recorded entry) — a same-value
 *     re-scrape is a no-op, so writes are bounded by real market moves;
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
export interface HistoryGeneration {
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

/** Order-independent content signature — unchanged rates → identical string. */
function fingerprint(gen: HistoryGeneration): string {
  const keys = Object.keys(gen.rates).sort();
  let sig = `${gen.base}`;
  for (const k of keys) sig += `|${k}:${gen.rates[k]}`;
  return sig;
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
  if (last !== undefined && fingerprint(last) === fingerprint(gen)) return false; // no market change
  const next = [...gens.filter((g) => g.at !== gen.at), gen].slice(-HISTORY_MAX_GENERATIONS);
  const file: HistoryFile = { v: 1, gens: next };
  await kv.put(historyKey(source), JSON.stringify(file));
  return true;
}

/** Current rolling history (oldest → newest). Corrupt entries are dropped. */
export async function readHistory(kv: KVNamespace, source: SnapshotSource): Promise<HistoryGeneration[]> {
  return parseFile(await kv.get(historyKey(source)));
}
