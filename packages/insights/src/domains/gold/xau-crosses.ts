/**
 * xau-crosses.ts — GPE R26 / F10 (2026-11-19): the multi-currency gold
 * grid's pure derivations + store + rung job (docs/specs/
 * gold-page-elevation: s8/01 R26 · the s14 M1 §4a probe + the S14-D1
 * native+derived record · s6/03 zone I's module naming).
 *
 * THE FIVE CROSSES (the s8/01 R26 set): EUR + AUD native from EODHD
 * (XAUEUR.FOREX, XAUAUD.FOREX — the only XAU crosses the provider's
 * FOREX exchange carries); JPY + GBP + CNY DERIVED by exact arithmetic
 * over the SAME stored XAUUSD series the chart reads (the gold-xau key
 * — one series, never two, C1) and the EODHD FX legs (USDJPY ×,
 * GBPUSD ÷, USDCNY ×) — the FX_PAIRS cross-derivation grammar,
 * inner-joined on common dates, the formula named at point of use.
 *
 * THE DERIVATIONS (pure, the R19 pattern): each cross's 30-day change
 * and its decile over its own STORED basis (the S13-D1 honest posture —
 * ~1 year on the free tier, the window named at point of use,
 * self-widening), plus the KGX validation sentence's inputs (the USD
 * leg's own 30-day move vs the crosses' — genuine demand vs the dollar
 * story).
 *
 * THE JOB (the rung4 gold-xau-crosses source, weekdays, budget 8): read
 * the stored crosses + the gold-xau series, fetch the five legs (the
 * trailing 3-day re-fetch, revisions win), derive, write-if-changed.
 * The job waits (calm ok, zero writes) when the gold-xau series is
 * absent — the derived three cannot exist without it, and the wire
 * schema ships all five or nothing.
 *
 * Platform boundary: KV through the narrow tic/cb-demand-style port
 * (AGENTS.md rule 2). Exported via the "@currena/insights/xau-crosses"
 * subpath so the SPA-facing root export never pulls the fetch halves.
 */

import type { GoldXauCrossesSnapshot, GoldCross, GoldCrossId, GoldCrossPoint, GoldXauCandle } from '@currena/core';
import { GoldXauCrossesSnapshotSchema } from '@currena/core';
import { classifySourceError } from '../../shared/adapters/fetch-policy';
import { percentileOf } from '../../shared/scoring';
import { fetchEodhdSeries } from './adapters/eodhd-xau-crosses';
import type { GoldXauReader } from './xau-ohlc';

/** The grid's five currencies, in s8/01 R26 order (the wire shape's order). */
export const GOLD_CROSS_IDS: readonly GoldCrossId[] = ['eur', 'jpy', 'gbp', 'cny', 'aud'];

/** The EODHD base (the card's own C1 naming rides the formulas). */
export const CROSS_EODHD_BASE_URL = 'https://eodhd.com/api';

/** One cross's leg table: what to fetch and how the cross forms. */
export interface CrossLegDef {
  id: GoldCrossId;
  kind: 'native' | 'derived';
  /** The EODHD ticker fetched for this cross (the cross itself, or the FX leg). */
  symbol: string;
  /** The arithmetic joining the XAUUSD series with the FX leg (natives need none). */
  op: 'identity' | 'multiply' | 'divide';
  /** The C1 point-of-use formula (the KGX sentence and the grid name it). */
  formula: string;
}

export const CROSS_LEGS: readonly CrossLegDef[] = [
  { id: 'eur', kind: 'native', symbol: 'XAUEUR.FOREX', op: 'identity', formula: 'XAUEUR.FOREX' },
  { id: 'jpy', kind: 'derived', symbol: 'USDJPY.FOREX', op: 'multiply', formula: 'XAUUSD.FOREX × USDJPY.FOREX' },
  { id: 'gbp', kind: 'derived', symbol: 'GBPUSD.FOREX', op: 'divide', formula: 'XAUUSD.FOREX ÷ GBPUSD.FOREX' },
  { id: 'cny', kind: 'derived', symbol: 'USDCNY.FOREX', op: 'multiply', formula: 'XAUUSD.FOREX × USDCNY.FOREX' },
  { id: 'aud', kind: 'native', symbol: 'XAUAUD.FOREX', op: 'identity', formula: 'XAUAUD.FOREX' },
];

/** The trailing days re-fetched per leg (revision tolerance — the S13 pattern). */
export const CROSS_TRAILING_REFETCH_DAYS = 3;

/* ------------------------------------------------------------------ *
 * The pure derivations (no fetch, no clock)
 * ------------------------------------------------------------------ */

/** The inner join of the XAUUSD closes with one FX leg (common dates only). */
export function deriveCrossSeries(
  xauusd: readonly GoldXauCandle[],
  fxLeg: ReadonlyArray<{ date: string; close: number }>,
  op: 'multiply' | 'divide',
): GoldCrossPoint[] {
  const fxByDate = new Map(fxLeg.map((r) => [r.date, r.close] as const));
  const out: GoldCrossPoint[] = [];
  for (const candle of xauusd) {
    const fx = fxByDate.get(candle.date);
    if (fx === undefined || fx <= 0) continue; // inner join — a missing day never invents a value
    out.push({ date: candle.date, close: op === 'multiply' ? candle.close * fx : candle.close / fx });
  }
  return out;
}

/** Merge two series of one symbol: the union by date, the FETCH's row
 *  winning on any shared date (a genuine revision wins — mergeXauSeries). */
export function mergeSeries<T extends { date: string }>(stored: readonly T[], fetched: readonly T[]): T[] {
  const byDate = new Map<string, T>();
  for (const row of stored) byDate.set(row.date, row);
  for (const row of fetched) byDate.set(row.date, row);
  const out = [...byDate.values()];
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** The minimum points before a cross's decile speaks (the R19 posture). */
export const CROSS_DECILE_MIN_BASE = 30;

/** One cross's display stats — the decile over the cross's OWN stored
 *  basis (the current point excluded — the meter's own grammar), the
 *  30-day change, and the honest basis window named at point of use. */
export interface CrossStats {
  id: GoldCrossId;
  /** The latest close. */
  last: number;
  /** The latest close's date. */
  lastDate: string;
  /** The 30-calendar-day change, percent (null when the window is too short). */
  change30d: number | null;
  /** The decile (0..1) over the stored basis, current point excluded; null when the basis is too small. */
  decile: number | null;
  /** The honest basis window the decile was computed over (null with the decile). */
  basis: { from: string; to: string; points: number } | null;
}

/** The ~30-calendar-day-ago point (the last point strictly older than 30 days). */
function pointAbout30dBack(series: readonly GoldCrossPoint[], lastDate: string): GoldCrossPoint | null {
  const cutoff = Date.parse(`${lastDate}T00:00:00Z`) - 30 * 86_400_000;
  let out: GoldCrossPoint | null = null;
  for (const p of series) {
    if (Date.parse(`${p.date}T00:00:00Z`) <= cutoff) out = p;
    else break;
  }
  return out;
}

/** Compute one cross's stats over its stored series (pure). */
export function crossStats(id: GoldCrossId, series: readonly GoldCrossPoint[]): CrossStats | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1]!;
  const ref = pointAbout30dBack(series, last.date);
  const change30d = ref !== null && ref.close > 0 ? ((last.close - ref.close) / ref.close) * 100 : null;
  const base = series.slice(0, -1).map((p) => p.close); // the current point excluded
  const decile = base.length >= CROSS_DECILE_MIN_BASE ? percentileOf(base, last.close) : null;
  return {
    id,
    last: last.close,
    lastDate: last.date,
    change30d,
    decile,
    basis:
      decile !== null
        ? { from: series[0]!.date, to: series[series.length - 2]!.date, points: base.length }
        : null,
  };
}

/** The KGX validation sentence's verdict inputs (the s7/01 §4 wording's
 *  own two paths): gold rose in USD AND in the other crosses = genuine
 *  demand; in USD only = the dollar story. The mixed case is honest. */
export type KgxKind = 'genuine-demand' | 'dollar-story' | 'dollar-weakness' | 'mixed';

export function kgxVerdict(
  usdChange30d: number | null,
  crossChanges: ReadonlyArray<{ id: GoldCrossId; change30d: number | null }>,
): { kind: KgxKind; ups: number; known: number } | null {
  const known = crossChanges.filter((c): c is { id: GoldCrossId; change30d: number } => c.change30d !== null);
  if (usdChange30d === null || known.length === 0) return null;
  const ups = known.filter((c) => c.change30d > 0).length;
  const downs = known.length - ups;
  const usdUp = usdChange30d > 0;
  if (usdUp && downs === 0) return { kind: 'genuine-demand', ups, known: known.length };
  if (usdUp && ups === 0) return { kind: 'dollar-story', ups, known: known.length };
  if (!usdUp && downs === 0) return { kind: 'dollar-weakness', ups, known: known.length };
  return { kind: 'mixed', ups, known: known.length };
}

/* ------------------------------------------------------------------ *
 * The snapshot builder (pure)
 * ------------------------------------------------------------------ */

/** Build the wire snapshot over the five finished series (ascending,
 *  final bars only — the S13-D3 guard rode the parse) + the merged FX
 *  legs they derive over (stored so the next run MERGES, never
 *  truncates). */
export function buildCrossesSnapshot(
  seriesByld: ReadonlyMap<GoldCrossId, GoldCrossPoint[]>,
  fxLegs: ReadonlyArray<{ symbol: string; series: GoldCrossPoint[] }>,
  now: Date,
): GoldXauCrossesSnapshot {
  const crosses: GoldCross[] = GOLD_CROSS_IDS.map((id) => {
    const leg = CROSS_LEGS.find((l) => l.id === id)!;
    const series = seriesByld.get(id);
    if (series === undefined || series.length < 2) {
      throw new Error(`the ${id} cross has no computable series (needs its legs — never a guess)`);
    }
    return { id, kind: leg.kind, formula: leg.formula, series };
  });
  const asOf = crosses.reduce(
    (acc, c) => (c.series[c.series.length - 1]!.date > acc ? c.series[c.series.length - 1]!.date : acc),
    crosses[0]!.series[crosses[0]!.series.length - 1]!.date,
  );
  return GoldXauCrossesSnapshotSchema.parse({
    v: 1,
    asOf,
    fetchedAt: now.toISOString(),
    crosses,
    fxLegs,
    sourceUrls: CROSS_LEGS.map((l) => `${CROSS_EODHD_BASE_URL}/eod/${l.symbol}`),
  });
}

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key — the xau-ohlc pattern)
 * ------------------------------------------------------------------ */

export const GOLD_XAU_CROSSES_KV_KEY = 'insights:gold-xau-crosses:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldCrossesKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredCrosses(raw: string | null | undefined): GoldXauCrossesSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldXauCrossesSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-xau-crosses-store] ${GOLD_XAU_CROSSES_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldCrossesReader {
  getGoldCrosses(): Promise<GoldXauCrossesSnapshot | undefined>;
}

export interface GoldCrossesStore extends GoldCrossesReader {
  writeGoldCrosses(snapshot: GoldXauCrossesSnapshot): Promise<void>;
}

export class KvGoldCrossesStore implements GoldCrossesStore {
  constructor(private readonly kv: GoldCrossesKv) {}

  async getGoldCrosses(): Promise<GoldXauCrossesSnapshot | undefined> {
    return parseStoredCrosses(await this.kv.get(GOLD_XAU_CROSSES_KV_KEY));
  }

  async writeGoldCrosses(snapshot: GoldXauCrossesSnapshot): Promise<void> {
    await this.kv.put(GOLD_XAU_CROSSES_KV_KEY, JSON.stringify(snapshot));
  }
}

/** The REST adapter (the manual runner's landing lever — the twin of
 *  RestGoldXauStore). */
export interface RestGoldCrossesOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldCrossesStore implements GoldCrossesStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldCrossesOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private url(): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(GOLD_XAU_CROSSES_KV_KEY)}`
    );
  }

  async getGoldCrosses(): Promise<GoldXauCrossesSnapshot | undefined> {
    const response = await this.fetchImpl(this.url(), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredCrosses(await response.text());
  }

  async writeGoldCrosses(snapshot: GoldXauCrossesSnapshot): Promise<void> {
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

export interface GoldCrossesJobDeps {
  /** The plan's API token (from the worker's EODHD_API_TOKEN secret). */
  apiToken: string;
  /** The gold-xau series' reader (the SAME key the chart reads — C1). */
  goldXau: GoldXauReader;
  /** Injectable fetch (tests replay fixtures — never live sites). */
  fetchImpl?: typeof fetch;
  /** Clock (tests). */
  now?: Date;
}

export type GoldCrossesJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldCrossesJobResult {
  outcome: GoldCrossesJobOutcome;
  snapshot?: GoldXauCrossesSnapshot;
  kv: { reads: number; writes: number };
}

/** The `from` date for a leg's fetch: the trailing window behind the
 *  stored series' own last date (bootstrap: undefined — ask wide, take
 *  the plan's depth). */
function legFetchFrom(storedLeg: ReadonlyArray<{ date: string }> | undefined): string | undefined {
  if (storedLeg === undefined || storedLeg.length === 0) return undefined;
  const last = storedLeg[storedLeg.length - 1]!.date;
  return new Date(Date.parse(`${last}T00:00:00Z`) - CROSS_TRAILING_REFETCH_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * The rung body: read both keys, fetch the five legs (revision-tolerant
 * trailing windows), merge each with its stored rows (the fetch wins on
 * shared dates), derive the three crosses from the MERGED FX legs + the
 * gold-xau series, and write ONLY when something changed. A missing
 * gold-xau series = the calm waiting note (the derived three cannot
 * exist without it; the schema ships all five or nothing).
 */
export async function runGoldXauCrossesIngest(
  store: GoldCrossesStore,
  deps: GoldCrossesJobDeps,
): Promise<GoldCrossesJobResult> {
  const now = deps.now ?? new Date();
  const stored = await store.getGoldCrosses();
  const goldXau = await deps.goldXau.getGoldXau();
  let reads = 2; // the crosses read + the gold-xau read
  if (goldXau === undefined || goldXau.series.length < 2) {
    return {
      outcome: { ok: true, note: 'waiting on the gold-xau series (the derived crosses need it)' },
      kv: { reads, writes: 0 },
    };
  }

  // The stored rows the merges start from: the natives' own series, and
  // the FX legs the snapshot carries for the derived three.
  const storedNativeByld = new Map<GoldCrossId, GoldCrossPoint[]>(
    (stored?.crosses ?? []).filter((c) => c.kind === 'native').map((c) => [c.id, c.series] as const),
  );
  const storedFxLegs = new Map<string, GoldCrossPoint[]>((stored?.fxLegs ?? []).map((l) => [l.symbol, l.series] as const));

  const seriesByld = new Map<GoldCrossId, GoldCrossPoint[]>();
  const mergedFxLegs: Array<{ symbol: string; series: GoldCrossPoint[] }> = [];
  try {
    for (const leg of CROSS_LEGS) {
      const storedLeg =
        leg.kind === 'native'
          ? (storedNativeByld.get(leg.id) ?? [])
          : (storedFxLegs.get(leg.symbol) ?? []);
      const fetched = await fetchEodhdSeries({
        code: leg.symbol,
        apiToken: deps.apiToken,
        from: legFetchFrom(storedLeg),
        fetchImpl: deps.fetchImpl,
        todayUtc: now.toISOString().slice(0, 10),
      });
      const fetchedCloses = fetched.map((r) => ({ date: r.date, close: r.close }));
      if (leg.kind === 'native') {
        seriesByld.set(leg.id, mergeSeries(storedLeg, fetchedCloses));
      } else {
        mergedFxLegs.push({ symbol: leg.symbol, series: mergeSeries(storedLeg, fetchedCloses) });
      }
    }
    // The derivations: every derived cross recomputes over its MERGED FX
    // leg ∩ the gold-xau series (inner join — a missing day never
    // invents a value; a plan upgrade deepens via the same legs).
    for (const leg of CROSS_LEGS) {
      if (leg.kind !== 'derived') continue;
      const merged = mergedFxLegs.find((l) => l.symbol === leg.symbol)!;
      seriesByld.set(leg.id, deriveCrossSeries(goldXau.series, merged.series, leg.op === 'divide' ? 'divide' : 'multiply'));
    }
  } catch (err) {
    return {
      outcome: { ok: false, kind: classifySourceError(err), note: err instanceof Error ? err.message : String(err) },
      kv: { reads, writes: 0 },
    };
  }

  for (const id of GOLD_CROSS_IDS) {
    if (!seriesByld.has(id)) {
      return {
        outcome: { ok: false, kind: 'failed', note: `the ${id} cross had no computable series after the fetch round` },
        kv: { reads, writes: 0 },
      };
    }
  }

  const snapshot = buildCrossesSnapshot(seriesByld, mergedFxLegs, now);
  if (stored !== undefined && stripVolatile(stored) === stripVolatile(snapshot)) {
    return {
      outcome: { ok: true, note: `no change (asOf ${snapshot.asOf})` },
      snapshot: stored,
      kv: { reads, writes: 0 },
    };
  }
  await store.writeGoldCrosses(snapshot);
  return {
    outcome: {
      ok: true,
      note: `asOf ${snapshot.asOf} · ${snapshot.crosses.map((c) => `${c.id}:${c.series.length}`).join(' ')}`,
    },
    snapshot,
    kv: { reads, writes: 1 },
  };
}

/** The write-if-changed comparator's basis: everything but fetchedAt. */
function stripVolatile(snapshot: GoldXauCrossesSnapshot): string {
  return JSON.stringify({ ...snapshot, fetchedAt: '' });
}
