/**
 * narrator-stats.ts — M4 of the Layer-2 narrator build (spec §9): the
 * daily-bucket stats writer behind the `insights:narrator:stats` KV key.
 *
 * Buckets (kept 14 days, pruned on write):
 *   runs · skippedUnchanged · aiValid · aiFailedByCheck (per check id) ·
 *   apiErrors (per error kind, incl. region) · templateUsed ·
 *   newsAttempted · newsValid · newsOmittedByCheck · newsOverCap
 *
 * The kill criteria (spec §13, KILL-CRITERIA.md in M5) read these numbers:
 * ">1 in 5 A-generations fail validation" is
 * aiFailedByCheck-events / (aiValid + aiFailedByCheck-events) per day.
 *
 * Storage discipline (D-30/D-38): ONE read + ONE write per narrator tick
 * (hourly) — ~24 reads + ~24 writes/day, inside the free plan's 100k/1k
 * with two orders of magnitude of headroom. Never throws: a stats failure
 * is logged and swallowed (stats must never break generation).
 */

import type { Bindings } from './index';

/** The one KV key the stats live under. */
export const NARRATOR_STATS_KEY = 'insights:narrator:stats';

/** How many daily buckets to keep. */
export const NARRATOR_STATS_KEEP_DAYS = 14;

/** One day's bucket. */
export interface NarratorStatsDay {
  runs: number;
  skippedUnchanged: number;
  aiValid: number;
  aiFailedByCheck: Record<string, number>;
  apiErrors: Record<string, number>;
  templateUsed: number;
  newsAttempted: number;
  newsValid: number;
  newsOmittedByCheck: number;
  newsOverCap: number;
}

/** The stored stats document. */
export interface NarratorStatsDoc {
  v: 1;
  days: Record<string, NarratorStatsDay>;
}

function emptyDay(): NarratorStatsDay {
  return {
    runs: 0,
    skippedUnchanged: 0,
    aiValid: 0,
    aiFailedByCheck: {},
    apiErrors: {},
    templateUsed: 0,
    newsAttempted: 0,
    newsValid: 0,
    newsOmittedByCheck: 0,
    newsOverCap: 0,
  };
}

/** The UTC calendar day of an ISO datetime ('YYYY-MM-DD'). */
function dayOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function bump(record: Record<string, number>, key: string, by = 1): void {
  record[key] = (record[key] ?? 0) + by;
}

/** Parse a stored stats doc defensively (poisoned/absent → a fresh doc). */
export function parseStatsDoc(raw: string | null): NarratorStatsDoc {
  if (raw === null) return { v: 1, days: {} };
  try {
    const parsed = JSON.parse(raw) as NarratorStatsDoc;
    if (parsed !== null && typeof parsed === 'object' && parsed.v === 1 && typeof parsed.days === 'object' && parsed.days !== null) {
      return parsed;
    }
  } catch {
    // poisoned → fresh
  }
  return { v: 1, days: {} };
}

/** Prune to the newest N days (deterministic: ISO date keys sort). */
export function pruneDays(doc: NarratorStatsDoc, keep = NARRATOR_STATS_KEEP_DAYS): NarratorStatsDoc {
  const keys = Object.keys(doc.days).sort();
  while (keys.length > keep) {
    const oldest = keys.shift()!;
    delete doc.days[oldest];
  }
  return doc;
}

/** The mutations one tick may record (all optional; zero-value fields are no-ops). */
export interface StatsDelta {
  runs?: number;
  skippedUnchanged?: number;
  aiValid?: number;
  /** One entry per failed check (a failed unit can contribute several). */
  aiFailedByCheck?: string[];
  apiErrors?: string[];
  templateUsed?: number;
  newsAttempted?: number;
  newsValid?: number;
  newsOmittedByCheck?: number;
  newsOverCap?: number;
}

/**
 * Read + mutate + write the stats for today (UTC). Never throws — a stats
 * failure is logged by the caller's catch, generation is unaffected.
 */
export async function recordNarratorStats(env: Bindings, now: Date, delta: StatsDelta): Promise<void> {
  const day = dayOf(now);
  const doc = parseStatsDoc(await env.RATES.get(NARRATOR_STATS_KEY));
  const bucket = doc.days[day] ?? emptyDay();
  bucket.runs += delta.runs ?? 0;
  bucket.skippedUnchanged += delta.skippedUnchanged ?? 0;
  bucket.aiValid += delta.aiValid ?? 0;
  for (const check of delta.aiFailedByCheck ?? []) bump(bucket.aiFailedByCheck, check);
  for (const kind of delta.apiErrors ?? []) bump(bucket.apiErrors, kind);
  bucket.templateUsed += delta.templateUsed ?? 0;
  bucket.newsAttempted += delta.newsAttempted ?? 0;
  bucket.newsValid += delta.newsValid ?? 0;
  bucket.newsOmittedByCheck += delta.newsOmittedByCheck ?? 0;
  bucket.newsOverCap += delta.newsOverCap ?? 0;
  doc.days[day] = bucket;
  pruneDays(doc);
  await env.RATES.put(NARRATOR_STATS_KEY, JSON.stringify(doc));
}

/** Read one day's bucket (the admin/kill-criteria view; absent → zeros). */
export async function readNarratorStatsDay(env: Bindings, day: string): Promise<NarratorStatsDay> {
  const doc = parseStatsDoc(await env.RATES.get(NARRATOR_STATS_KEY));
  return doc.days[day] ?? emptyDay();
}
