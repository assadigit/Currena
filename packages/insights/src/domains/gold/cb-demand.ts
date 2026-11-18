/**
 * cb-demand.ts — GPE R14 / F2a Tier-1 (2026-11-18): the central-bank
 * demand tracker's compute + KV store + rung job — the TIC module's
 * twin (docs/specs/gold-page-elevation: s7/01 §6 the Zone-K design ·
 * s8/01 R14 · the s12 M1 §5-6 record).
 *
 * THE COMPUTE (pure, over the parsed legs):
 *   merge    — IL primary, IRFCL the complement (a month wins when IL
 *     lacks it or it is NEWER than IL's last for that reporter);
 *   deltas   — matched pairs only: a reporter counts in month m only
 *     when it reported both m and m−1 (the honest reported-world flow:
 *     no carry-forward invention, no coverage jumps misread as moves);
 *   series   — the rolling 12-month sum of the world's monthly matched
 *     deltas, tonnes, monthly, from 2006-01 (the 20-year chart window);
 *   buyers   — the top 10 reporters by the trailing-12-month sum, each
 *     with its latest matched delta, its holdings and the IRFCL value
 *     legs (the share-of-reserves column's inputs — the S12-D1 method:
 *     gold re-valued at the live price at RENDER time, so no price is
 *     ever baked into the stored payload);
 *   reportedWorld — the STOCK: the sum of every reporter's latest
 *     holdings within the trailing 3 months, labelled as the reported
 *     world (never the whole world — non-reporters exist).
 *
 * THE JOB: the rung3 extra-source body (04:30 UTC, day 1–5 gate +
 * month-skip idempotence — the S12-D3 record). Budget 8: the 4 SDMX
 * fetches + the idempotence read + the write + headroom.
 *
 * Platform boundary: the compute is pure; the store + job touch KV
 * through the narrow TicKv-style port (AGENTS.md rule 2). Exported via
 * the "@currena/insights/cb-demand" subpath so the SPA-facing root
 * export never pulls the fetch halves — the tic pattern.
 */

import type { GoldCbBuyer, GoldCbSnapshot } from '@currena/core';
import { GoldCbSnapshotSchema } from '@currena/core';
import { classifySourceError, insightsFetch } from '../../shared/adapters/fetch-policy';
import {
  CB_MAX_MONTHLY_CHANGE_OZT,
  ImfReservesError,
  IMF_IL_VOLUME_URL,
  IMF_IRFCL_VOLUME_URL,
  fetchImfReservesRaw,
  parseCbLatestValue,
  parseCbVolume,
  type CbValueObs,
  type CbVolumeLeg,
} from './adapters/imf-reserves';

/** The troy ounce in grams. */
const TROY_OZ_GRAMS = 31.1034768;

/** ozt → tonnes. */
function toTonnes(ozt: number): number {
  return (ozt * TROY_OZ_GRAMS) / 1e6;
}

/** The chart window's first stored month (20 years back from "now"). */
export const CB_SERIES_START = '2006-01';

/** How many buyers the table carries. */
export const CB_TOP_BUYERS = 10;

/** The previous month string ("2026-10" → "2026-09"). */
function prevMonth(month: string): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1;
  return m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, '0')}`;
}

/** "2026-10" → 24322 (for contiguity arithmetic). */
function monthNumber(month: string): number {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
}

/** The merged monthly legs: IL primary, IRFCL complement (fresher wins). */
export function mergeCbVolume(il: CbVolumeLeg, irfcl: CbVolumeLeg): Map<string, Map<string, number>> {
  const merged = new Map<string, Map<string, number>>();
  for (const [country, months] of il) {
    merged.set(country, new Map(months));
  }
  for (const [country, months] of irfcl) {
    const base = merged.get(country);
    if (base === undefined) continue; // IL's 188 cover IRFCL's 89 — but never assume
    let ilLast = '';
    for (const m of base.keys()) if (m > ilLast) ilLast = m;
    for (const [m, v] of months) {
      if (m > ilLast) base.set(m, v);
    }
  }
  return merged;
}

/** The matched-pair monthly deltas per reporter, tonnes. */
export function cbMatchedDeltas(
  merged: ReadonlyMap<string, ReadonlyMap<string, number>>,
): Map<string, Map<string, number>> {
  const deltas = new Map<string, Map<string, number>>();
  for (const [country, months] of merged) {
    const dm = new Map<string, number>();
    for (const m of months.keys()) {
      const pm = prevMonth(m);
      const before = months.get(pm);
      const after = months.get(m);
      if (before === undefined || after === undefined) continue;
      const change = after - before;
      if (Math.abs(change) > CB_MAX_MONTHLY_CHANGE_OZT) continue; // a broken pair
      dm.set(m, toTonnes(change));
    }
    if (dm.size > 0) deltas.set(country, dm);
  }
  return deltas;
}

/** The world's monthly matched-pair total, tonnes (the sum over reporters). */
export function cbWorldMonthly(
  deltas: ReadonlyMap<string, ReadonlyMap<string, number>>,
): Map<string, number> {
  const world = new Map<string, number>();
  for (const dm of deltas.values()) {
    for (const [m, v] of dm) {
      world.set(m, (world.get(m) ?? 0) + v);
    }
  }
  return world;
}

/** The rolling-12-month series over the world's monthly totals (contiguous
 *  windows only — a coverage gap never bridges). */
export function cbRollingSeries(
  world: ReadonlyMap<string, number>,
): Array<{ month: string; tonnes: number }> {
  const months = [...world.keys()].sort();
  const series: Array<{ month: string; tonnes: number }> = [];
  for (let i = 0; i < months.length; i++) {
    const m = months[i]!;
    if (m < CB_SERIES_START) continue;
    const window: string[] = [m];
    for (let j = i - 1; j >= 0 && window.length < 12; j--) {
      const prev = months[j]!;
      if (monthNumber(window[0]!) - monthNumber(prev) !== 1) break; // not contiguous
      window.unshift(prev);
    }
    if (window.length === 12) {
      let sum = 0;
      for (const w of window) sum += world.get(w) ?? 0;
      series.push({ month: m, tonnes: Number(sum.toFixed(3)) });
    }
  }
  return series;
}

/** The reported-world stock: every reporter's latest holdings within the
 *  trailing 3 months of the data month. */
export function cbReportedWorld(
  merged: ReadonlyMap<string, ReadonlyMap<string, number>>,
  asOf: string,
): { tonnes: number; reporters: number; month: string } {
  const cutoff = new Date(`${asOf}-01T00:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 2); // the trailing 3 months incl. asOf
  const limit = cutoff.toISOString().slice(0, 7);
  let tonnes = 0;
  let reporters = 0;
  for (const months of merged.values()) {
    let best = '';
    for (const m of months.keys()) if (m > best && m <= asOf && m >= limit) best = m;
    if (best !== '') {
      tonnes += months.get(best)!;
      reporters++;
    }
  }
  return { tonnes: Number(toTonnes(tonnes).toFixed(0)), reporters, month: asOf };
}

/** The top buyers by the trailing-12-month sum (the table's rows). */
export function cbTopBuyers(
  deltas: ReadonlyMap<string, ReadonlyMap<string, number>>,
  merged: ReadonlyMap<string, ReadonlyMap<string, number>>,
  goldUsd: ReadonlyMap<string, CbValueObs>,
  totalUsd: ReadonlyMap<string, CbValueObs>,
  asOf: string,
): GoldCbBuyer[] {
  const windowStart = new Date(`${asOf}-01T00:00:00Z`);
  windowStart.setUTCMonth(windowStart.getUTCMonth() - 11);
  const from = windowStart.toISOString().slice(0, 7);
  const rows: GoldCbBuyer[] = [];
  for (const [country, dm] of deltas) {
    let sum12m = 0;
    let latestMonth = '';
    for (const [m, v] of dm) {
      if (m >= from && m <= asOf) sum12m += v;
      if (m > latestMonth && m <= asOf) latestMonth = m;
    }
    if (latestMonth === '') continue;
    const holdings = merged.get(country);
    let holdingsMonth = '';
    if (holdings !== undefined) {
      for (const m of holdings.keys()) if (m > holdingsMonth && m <= asOf) holdingsMonth = m;
    }
    if (holdingsMonth === '') continue;
    const holdingsNow = holdings?.get(holdingsMonth);
    if (holdingsNow === undefined) continue;
    const row: GoldCbBuyer = {
      code: country,
      latestMonth,
      latestDelta: Number((dm.get(latestMonth) ?? 0).toFixed(3)),
      sum12m: Number(sum12m.toFixed(3)),
      tonnes: Number(toTonnes(holdingsNow).toFixed(1)),
      holdingsMonth,
    };
    const gold = goldUsd.get(country);
    const total = totalUsd.get(country);
    if (gold !== undefined && total !== undefined) {
      row.goldUsd = Math.round(gold.usd);
      row.totalUsd = Math.round(total.usd);
      row.valuePeriod = gold.quarter;
    }
    rows.push(row);
  }
  rows.sort((a, b) => b.sum12m - a.sum12m);
  return rows.slice(0, CB_TOP_BUYERS);
}

/** Build the stored snapshot from the four parsed legs (pure). */
export function buildGoldCbSnapshot(
  raw: { ilVolume: unknown; irfclVolume: unknown; irfclGoldUsd: unknown; irfclTotalUsd: unknown },
  now: Date,
): GoldCbSnapshot {
  const il = parseCbVolume(raw.ilVolume);
  const irfcl = parseCbVolume(raw.irfclVolume);
  const goldUsd = parseCbLatestValue(raw.irfclGoldUsd);
  const totalUsd = parseCbLatestValue(raw.irfclTotalUsd);

  const merged = mergeCbVolume(il, irfcl);
  if (merged.size < 50) {
    throw new ImfReservesError(`only ${merged.size} reporters merged (expected ≥50 — the answer is truncated)`);
  }
  const deltas = cbMatchedDeltas(merged);
  const world = cbWorldMonthly(deltas);
  const series = cbRollingSeries(world);
  if (series.length < 24) {
    throw new ImfReservesError(`rolling series has only ${series.length} points (expected ≥24)`);
  }
  let asOf = '';
  for (const m of world.keys()) if (m > asOf) asOf = m;
  if (asOf === '') throw new ImfReservesError('no monthly data parsed');
  const buyers = cbTopBuyers(deltas, merged, goldUsd, totalUsd, asOf);
  if (buyers.length === 0) throw new ImfReservesError('no buyers parsed');

  return GoldCbSnapshotSchema.parse({
    v: 1,
    asOf,
    fetchedAt: now.toISOString(),
    series,
    buyers,
    reportedWorld: cbReportedWorld(merged, asOf),
    sourceUrls: [IMF_IL_VOLUME_URL, IMF_IRFCL_VOLUME_URL],
  });
}

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key — the tic pattern)
 * ------------------------------------------------------------------ */

export const GOLD_CB_KV_KEY = 'insights:gold-cb:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldCbKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldCb(raw: string | null | undefined): GoldCbSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldCbSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-cb-store] ${GOLD_CB_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldCbReader {
  getGoldCb(): Promise<GoldCbSnapshot | undefined>;
}

export interface GoldCbStore extends GoldCbReader {
  writeGoldCb(snapshot: GoldCbSnapshot): Promise<void>;
}

export class KvGoldCbStore implements GoldCbStore {
  constructor(private readonly kv: GoldCbKv) {}

  async getGoldCb(): Promise<GoldCbSnapshot | undefined> {
    return parseStoredGoldCb(await this.kv.get(GOLD_CB_KV_KEY));
  }

  async writeGoldCb(snapshot: GoldCbSnapshot): Promise<void> {
    await this.kv.put(GOLD_CB_KV_KEY, JSON.stringify(snapshot));
  }
}

/* ------------------------------------------------------------------ *
 * The REST adapter (the manual runner's landing lever — the
 * RestAuMarketsStore twin: writes through the Cloudflare KV REST API
 * so a fresh deploy can land the section's data without waiting for
 * the next month's rung, exactly the markets-au "Path B" pattern).
 * ------------------------------------------------------------------ */

export interface RestGoldCbOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldCbStore implements GoldCbStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldCbOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private url(): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(GOLD_CB_KV_KEY)}`
    );
  }

  async getGoldCb(): Promise<GoldCbSnapshot | undefined> {
    const response = await this.fetchImpl(this.url(), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new ImfReservesError(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredGoldCb(await response.text());
  }

  async writeGoldCb(snapshot: GoldCbSnapshot): Promise<void> {
    const response = await this.fetchImpl(this.url(), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.opts.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ImfReservesError(`KV REST write failed: HTTP ${response.status}: ${body.slice(0, 160)}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * The job (the rung3 body)
 * ------------------------------------------------------------------ */

export interface GoldCbJobDeps {
  /** Injectable fetch (tests replay fixtures — never live sites). */
  fetchImpl?: typeof fetch;
  /** Clock (tests). */
  now?: Date;
}

export type GoldCbJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldCbJobResult {
  outcome: GoldCbJobOutcome;
  snapshot?: GoldCbSnapshot;
  kv: { reads: number; writes: number };
}

/** True when the stored snapshot was already written this UTC month (the
 *  month-skip idempotence — the S12-D3 record). */
function storedThisMonth(stored: GoldCbSnapshot | undefined, now: Date): boolean {
  if (stored === undefined) return false;
  return stored.fetchedAt.slice(0, 7) === now.toISOString().slice(0, 7);
}

/** The day 1–5 gate (the S12-D3 record: one real collect per month, cheap
 *  re-checks after, and a rare Saturday-1st budget collision self-heals on
 *  the next day's gate). */
export function goldCbDayGate(now: Date): boolean {
  const day = now.getUTCDate();
  return day >= 1 && day <= 5;
}

/**
 * The rung body: fetch the four dataflows, parse, compute, write —
 * SKIPPING the fetches when the stored snapshot is already from this
 * UTC month (the idempotence read). One failed fetch fails the whole
 * job honestly (all four legs are one coherent snapshot or none).
 */
export async function runGoldCbIngest(store: GoldCbStore, deps: GoldCbJobDeps = {}): Promise<GoldCbJobResult> {
  const now = deps.now ?? new Date();
  const stored = await store.getGoldCb();
  if (stored !== undefined && storedThisMonth(stored, now)) {
    return {
      outcome: { ok: true, note: `already collected this month (asOf ${stored.asOf})` },
      snapshot: stored,
      kv: { reads: 1, writes: 0 },
    };
  }
  try {
    const raw = await fetchImfReservesRaw({ fetchImpl: deps.fetchImpl });
    const snapshot = buildGoldCbSnapshot(raw, now);
    await store.writeGoldCb(snapshot);
    return {
      outcome: {
        ok: true,
        note: `asOf ${snapshot.asOf} · ${snapshot.series.length} rolling points · ${snapshot.buyers.length} buyers · reported world ${snapshot.reportedWorld.tonnes} t / ${snapshot.reportedWorld.reporters} reporters`,
      },
      snapshot,
      kv: { reads: 1, writes: 1 },
    };
  } catch (err) {
    return {
      outcome: { ok: false, kind: classifySourceError(err), note: err instanceof Error ? err.message : String(err) },
      kv: { reads: 1, writes: 0 },
    };
  }
}

// Re-export the fetch policy's insightsFetch for the job's callers.
export { insightsFetch };
