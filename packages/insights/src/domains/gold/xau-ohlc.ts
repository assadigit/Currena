/**
 * xau-ohlc.ts — GPE R18 / F7 (2026-11-18): the XAUUSD daily OHLC series'
 * store + rung job — the cb-demand/tic twin (docs/specs/gold-page-elevation:
 * s8/01 R18's adapter naming · s8/02 §1a row 3 · the s13 M1 §5 S13-D1
 * record).
 *
 * ONE KV key (`insights:gold-xau:v1`): the EODHD XAUUSD.FOREX daily bars,
 * seeded at first collect to whatever depth the plan serves (~1 year on
 * the free key — the S13-D1 posture) and grown forward by the daily
 * rung4 appends, with the trailing 3 days re-fetched so a genuine
 * revision wins (the TIC revision-tolerant pattern; S13-D3 drops any
 * row dated today — the forex day wraps 22:00 UTC and today's bar can
 * be partial).
 *
 * THE JOB: the rung4 extra-source body (04:35 UTC, daily gate — the
 * S13-D1 venue record). Budget 4: the fetch + the idempotence read +
 * the write + headroom. Write-if-changed: a day with no new bar and no
 * revision writes nothing (Saturday/Sunday fetches return nothing new).
 *
 * Platform boundary: the store + job touch KV through the narrow
 * tic/cb-demand-style port (AGENTS.md rule 2). Exported via the
 * "@currena/insights/xau-ohlc" subpath so the SPA-facing root export
 * never pulls the fetch halves — the cb-demand pattern.
 */

import type { GoldXauOhlcSnapshot, GoldXauCandle } from '@currena/core';
import { GoldXauOhlcSnapshotSchema } from '@currena/core';
import { classifySourceError } from '../../shared/adapters/fetch-policy';
import { fetchEodhdXauusdOhlc, XAUUSD_SOURCE_URL } from './adapters/eodhd-xauusd';

export { XAUUSD_SOURCE_URL };

/** The trailing days re-fetched over the last stored bar (revision tolerance). */
export const XAU_TRAILING_REFETCH_DAYS = 3;

/* ------------------------------------------------------------------ *
 * The merge (pure)
 * ------------------------------------------------------------------ */

/**
 * Merge the stored series with a fresh fetch: the union by date, the
 * FETCH's row winning on any shared date (a genuine revision wins — the
 * dedupeByDate keep-last discipline). Strictly ascending by
 * construction; rows older than the fetch's window are preserved from
 * the stored series (the free tier can never re-serve them).
 */
export function mergeXauSeries(
  stored: readonly GoldXauCandle[],
  fetched: readonly GoldXauCandle[],
): GoldXauCandle[] {
  const byDate = new Map<string, GoldXauCandle>();
  for (const candle of stored) byDate.set(candle.date, candle);
  for (const candle of fetched) byDate.set(candle.date, candle); // the fetch wins
  const out = [...byDate.values()];
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** The `from` date for the next fetch: the trailing window behind the
 * last stored bar (the bootstrap answer — `undefined` — asks wide and
 * takes whatever depth the plan serves). */
export function xauFetchFromDate(stored: GoldXauOhlcSnapshot | undefined): string | undefined {
  if (stored === undefined) return undefined;
  const last = stored.series[stored.series.length - 1]!.date;
  const ms = Date.parse(`${last}T00:00:00Z`) - XAU_TRAILING_REFETCH_DAYS * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Build the snapshot over a merged series (asOf = the last bar's date). */
export function buildXauSnapshot(series: readonly GoldXauCandle[], now: Date): GoldXauOhlcSnapshot {
  if (series.length < 2) {
    throw new Error('the XAUUSD series needs at least 2 final bars to store');
  }
  return GoldXauOhlcSnapshotSchema.parse({
    v: 1,
    asOf: series[series.length - 1]!.date,
    fetchedAt: now.toISOString(),
    series: [...series],
    sourceUrl: XAUUSD_SOURCE_URL,
  });
}

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key — the tic/cb-demand pattern)
 * ------------------------------------------------------------------ */

export const GOLD_XAU_KV_KEY = 'insights:gold-xau:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldXauKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldXau(raw: string | null | undefined): GoldXauOhlcSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldXauOhlcSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-xau-store] ${GOLD_XAU_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldXauReader {
  getGoldXau(): Promise<GoldXauOhlcSnapshot | undefined>;
}

export interface GoldXauStore extends GoldXauReader {
  writeGoldXau(snapshot: GoldXauOhlcSnapshot): Promise<void>;
}

export class KvGoldXauStore implements GoldXauStore {
  constructor(private readonly kv: GoldXauKv) {}

  async getGoldXau(): Promise<GoldXauOhlcSnapshot | undefined> {
    return parseStoredGoldXau(await this.kv.get(GOLD_XAU_KV_KEY));
  }

  async writeGoldXau(snapshot: GoldXauOhlcSnapshot): Promise<void> {
    await this.kv.put(GOLD_XAU_KV_KEY, JSON.stringify(snapshot));
  }
}

/* ------------------------------------------------------------------ *
 * The REST adapter (the manual runner's landing lever — the
 * RestGoldCbStore twin: writes through the Cloudflare KV REST API so a
 * fresh deploy can land the series without waiting for the next rung).
 * ------------------------------------------------------------------ */

export interface RestGoldXauOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldXauStore implements GoldXauStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldXauOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private url(): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(GOLD_XAU_KV_KEY)}`
    );
  }

  async getGoldXau(): Promise<GoldXauOhlcSnapshot | undefined> {
    const response = await this.fetchImpl(this.url(), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredGoldXau(await response.text());
  }

  async writeGoldXau(snapshot: GoldXauOhlcSnapshot): Promise<void> {
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
      throw new Error(`KV REST write failed: HTTP ${response.status}: ${body.slice(0, 160)}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * The job (the rung4 body)
 * ------------------------------------------------------------------ */

export interface GoldXauJobDeps {
  /** The plan's API token (from the worker's EODHD_API_TOKEN secret). */
  apiToken: string;
  /** Injectable fetch (tests replay fixtures — never live sites). */
  fetchImpl?: typeof fetch;
  /** Clock (tests). */
  now?: Date;
}

export type GoldXauJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldXauJobResult {
  outcome: GoldXauJobOutcome;
  snapshot?: GoldXauOhlcSnapshot;
  kv: { reads: number; writes: number };
}

/**
 * The rung body: read the stored series, fetch the trailing window (or
 * the full plan depth on bootstrap), merge (revisions win), and write
 * ONLY when something changed — a quiet weekend costs zero writes.
 * A failed fetch fails the rung honestly (the stored series survives;
 * the sweeps re-attempt within hours).
 */
export async function runGoldXauIngest(store: GoldXauStore, deps: GoldXauJobDeps): Promise<GoldXauJobResult> {
  const now = deps.now ?? new Date();
  const stored = await store.getGoldXau();
  try {
    const fetched = await fetchEodhdXauusdOhlc({
      apiToken: deps.apiToken,
      from: xauFetchFromDate(stored),
      fetchImpl: deps.fetchImpl,
      todayUtc: now.toISOString().slice(0, 10),
    });
    const merged = mergeXauSeries(stored?.series ?? [], fetched);
    if (stored !== undefined && merged.length === stored.series.length && JSON.stringify(merged) === JSON.stringify(stored.series)) {
      return {
        outcome: { ok: true, note: `no change (last final bar ${stored.asOf}; ${stored.series.length} bars)` },
        snapshot: stored,
        kv: { reads: 1, writes: 0 },
      };
    }
    const snapshot = buildXauSnapshot(merged, now);
    await store.writeGoldXau(snapshot);
    return {
      outcome: {
        ok: true,
        note: `asOf ${snapshot.asOf} · ${snapshot.series.length} bars (${stored === undefined ? 'bootstrap' : '+appended'})`,
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
