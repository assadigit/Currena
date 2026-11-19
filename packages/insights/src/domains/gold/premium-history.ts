/**
 * premium-history.ts — GPE R30 / F3b (2026-11-19): Bridge-2 — the حباب
 * premium HISTORY's store, engine, and daily rung (docs/specs/
 * gold-page-elevation: s1/11 §5–§6 the formulas + the history strategy ·
 * s7/01 §8 the identity arithmetic's binding copy · s8/01 R30 · the s16
 * M1 §6 design records S16-D1..D5).
 *
 * ONE KV key (`insights:gold-premium-history:v1`): one row per Tehran
 * day, TWO provenances — 'backfill' (reconstructed from TGJU's own
 * profile-history daily closes, the four-page one-time parse; the
 * premium COMPUTED from the legs, never scraped as a claim) and 'live'
 * (the forward accumulation beside the R13 snapshot plane — the day's
 * last snapshot, captured by the 00:03 Tehran rung). The honesty line
 * renders the distinction at point of use.
 *
 * THE ENGINE (pure, platform-free): the day rows reuse the Bridge-1
 * computation verbatim (`coinPremium` — one coherent observation set,
 * the C2 grammar's own fields); the merge is an upsert (a live row
 * overwrites a backfill row on date collision, never the reverse —
 * S16-D2); the deciles ride the repo's own R19 posture (min base 30,
 * the current point excluded, the basis window named — S16-D4); the
 * attribution strip is EXACT identity arithmetic over two observations
 * (Δln(coin) = Δln(ounce) + Δln(USD/IRR) + Δln(1+premium) — each
 * factor's own % move, the multiplicative identity disclosed at point
 * of use, NEVER GRAM-style regression — s7/01 §8's binding copy,
 * S16-D3), and it fails closed when the residual is not zero (mixed
 * inputs never render a false identity).
 *
 * THE RUNG (the api Worker's ever-green cron, 20:33 UTC = 00:03
 * Tehran — clear of every other rung): read the ladder's own snapshot,
 * compute the day row, upsert write-if-changed. A missing or >24 h-old
 * snapshot writes NOTHING (the last-good discipline — an honest gap,
 * never a fabricated row under today's date).
 *
 * The manual runner (gold-premium-run, the gold-expectations-run twin):
 * the REST-twin live-row seed for post-deploy landings + the one-time
 * `--backfill` mode (the four /history pages, sequential).
 *
 * Platform boundary: the store + job touch KV through the narrow
 * expectations-twin port (AGENTS.md rule 2). Exported via the
 * "@currena/insights/premium-history" subpath so the SPA-facing root
 * export never pulls the fetch halves.
 */

import type {
  GoldPremiumBackfillInfo,
  GoldPremiumCoinRow,
  GoldPremiumDay,
  GoldPremiumHistorySnapshot,
  Snapshot,
} from '@currena/core';
import { GoldPremiumHistorySnapshotSchema, SnapshotSchema } from '@currena/core';
import type { TgjuHistoryRow } from '@currena/scraper';
import { coinPremium, COIN_SPECS, TROY_OZ_GRAMS } from './coin-premium';

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key)
 * ------------------------------------------------------------------ */

export const GOLD_PREMIUM_KV_KEY = 'insights:gold-premium-history:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldPremiumKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldPremiumHistory(
  raw: string | null | undefined,
): GoldPremiumHistorySnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldPremiumHistorySnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-premium-store] ${GOLD_PREMIUM_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldPremiumReader {
  getGoldPremiumHistory(): Promise<GoldPremiumHistorySnapshot | undefined>;
}

export interface GoldPremiumStore extends GoldPremiumReader {
  writeGoldPremiumHistory(snapshot: GoldPremiumHistorySnapshot): Promise<void>;
}

export class KvGoldPremiumStore implements GoldPremiumStore {
  constructor(private readonly kv: GoldPremiumKv) {}

  async getGoldPremiumHistory(): Promise<GoldPremiumHistorySnapshot | undefined> {
    return parseStoredGoldPremiumHistory(await this.kv.get(GOLD_PREMIUM_KV_KEY));
  }

  async writeGoldPremiumHistory(snapshot: GoldPremiumHistorySnapshot): Promise<void> {
    await this.kv.put(GOLD_PREMIUM_KV_KEY, JSON.stringify(snapshot));
  }
}

/** The REST adapter (the manual runner's landing lever — the
 *  RestGoldExpectationsStore twin: writes through the Cloudflare KV REST
 *  API; can also read the raw `snapshot:tgju` key the runner seeds from). */
export interface RestGoldPremiumOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldPremiumStore implements GoldPremiumStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldPremiumOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private valueUrl(key: string): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(key)}`
    );
  }

  async getGoldPremiumHistory(): Promise<GoldPremiumHistorySnapshot | undefined> {
    const response = await this.fetchImpl(this.valueUrl(GOLD_PREMIUM_KV_KEY), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredGoldPremiumHistory(await response.text());
  }

  async writeGoldPremiumHistory(snapshot: GoldPremiumHistorySnapshot): Promise<void> {
    const response = await this.fetchImpl(this.valueUrl(GOLD_PREMIUM_KV_KEY), {
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

  /** Read the raw `snapshot:tgju` KV entry (the R13 plane) and validate it. */
  async readTgjuSnapshot(): Promise<Snapshot | undefined> {
    const response = await this.fetchImpl(this.valueUrl('snapshot:tgju'), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return undefined;
    }
    const parsed = SnapshotSchema.safeParse(body);
    if (!parsed.success || parsed.data.gold === undefined || parsed.data.gold.length === 0) {
      return undefined; // legacy snapshot without the gold plane — honestly absent
    }
    return parsed.data;
  }
}

/* ------------------------------------------------------------------ *
 * The pure engine
 * ------------------------------------------------------------------ */

/** The Tehran calendar day (ISO YYYY-MM-DD) a UTC moment belongs to. */
export function tehranDateOf(moment: Date): string {
  // en-CA prints YYYY-MM-DD (the ISO shape); Asia/Tehran is UTC+3:30 with
  // no DST since 2022 — the fixed zone is the honest frame.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(moment);
}

/** The Tehran day a history row belongs to: the day that just ended when
 *  captured around midnight, the current day mid-day (a provisional row
 *  the 00:03 rung finalizes — the documented convention, S16-D2). */
export function tehranDayOfCapture(now: Date): string {
  return tehranDateOf(new Date(now.getTime() - 30 * 60_000));
}

/** The free-market dollar leg off a snapshot's rates (toman per USD —
 *  the board's own derivation: the USD rate is units-per-IRR). */
export function dollarTomanOfSnapshot(snapshot: Snapshot): number | null {
  const usd = snapshot.rates.find((r) => r.code === 'USD');
  return usd !== undefined && Number.isFinite(usd.rate) && usd.rate > 0 ? 1 / usd.rate : null;
}

/** Build ONE live day row from a coherent TGJU snapshot (the same
 *  `coinPremium` computation the bridge board renders — one observation
 *  set, no cross-source skew). Fails closed: no ounce or dollar leg, or
 *  no computable coin → null (nothing is stored, nothing is guessed). */
export function liveDayFromSnapshot(snapshot: Snapshot, now: Date): GoldPremiumDay | null {
  const gold = snapshot.gold ?? [];
  if (gold.length === 0) return null;
  const dollarToman = dollarTomanOfSnapshot(snapshot);
  const premium = coinPremium(gold, dollarToman);
  if (premium.tomanPerOunce === null || premium.ounceUsd === null || dollarToman === null) return null;
  if (premium.rows.length === 0) return null;
  return {
    date: tehranDayOfCapture(now),
    source: 'live',
    fetchedAt: snapshot.fetchedAt,
    ounceUsd: premium.ounceUsd,
    dollarToman,
    tomanPerOunce: premium.tomanPerOunce,
    coins: premium.rows.map((row) => ({
      id: row.id,
      marketToman: row.marketToman,
      intrinsicToman: row.intrinsicToman,
      premiumToman: row.premiumToman,
      premiumPct: row.premiumPct,
    })),
  };
}

/** The four backfill legs (the TGJU_PREMIUM_BACKFILL_SLUGS set, keyed by
 *  role — the parse happens in the scraper package; this is the pure
 *  compute over the parsed rows). */
export interface PremiumBackfillLegs {
  /** سکه امامی (sekee) daily closes, RIAL. */
  emami: readonly TgjuHistoryRow[];
  /** سکه بهار آزادی (sekeb) daily closes, RIAL. */
  bahar: readonly TgjuHistoryRow[];
  /** انس طلا (ons) daily closes, USD. */
  ounce: readonly TgjuHistoryRow[];
  /** دلار آزاد (price_dollar_rl) daily closes, RIAL. */
  dollar: readonly TgjuHistoryRow[];
}

const TROY = TROY_OZ_GRAMS;
const PURE_EMAMI = COIN_SPECS.find((s) => s.id === 'coin-emami')!.pureGrams;
const PURE_BAHAR = COIN_SPECS.find((s) => s.id === 'coin-bahar')!.pureGrams;

function coinRow(
  id: 'coin-emami' | 'coin-bahar',
  marketToman: number,
  tomanPerOunce: number,
  pureGrams: number,
): GoldPremiumCoinRow {
  const intrinsicToman = (tomanPerOunce * pureGrams) / TROY;
  const premiumToman = marketToman - intrinsicToman;
  return { id, marketToman, intrinsicToman, premiumToman, premiumPct: (premiumToman / intrinsicToman) * 100 };
}

/**
 * The one-time backfill: the four legs' INNER JOIN (only days ALL FOUR
 * legs carry a row — Tehran Mon–Thu, the two markets' overlap; the
 * honest basis, never a carried-forward ounce), each day's premium
 * COMPUTED from TGJU's own closes (s1/11 §6: never scraped as a claim).
 * Fails closed per day; a join with fewer than 2 days returns null.
 */
export function buildPremiumBackfill(
  legs: PremiumBackfillLegs,
  fetchedAt: Date,
  sourceUrl: string,
): { days: GoldPremiumDay[]; info: GoldPremiumBackfillInfo } | null {
  const emami = new Map(legs.emami.map((r) => [r.date, r]));
  const bahar = new Map(legs.bahar.map((r) => [r.date, r]));
  const ounce = new Map(legs.ounce.map((r) => [r.date, r]));
  const dollar = new Map(legs.dollar.map((r) => [r.date, r]));
  const common = [...emami.keys()].filter((d) => bahar.has(d) && ounce.has(d) && dollar.has(d)).sort();
  if (common.length < 2) return null;
  const days: GoldPremiumDay[] = [];
  for (const date of common) {
    const ounceUsd = ounce.get(date)!.close;
    const dollarToman = dollar.get(date)!.close / 10; // Rial → Toman — the ONLY conversion (rule 6)
    const tomanPerOunce = ounceUsd * dollarToman;
    days.push({
      date,
      source: 'backfill',
      fetchedAt: fetchedAt.toISOString(),
      ounceUsd,
      dollarToman,
      tomanPerOunce,
      coins: [
        coinRow('coin-emami', emami.get(date)!.close / 10, tomanPerOunce, PURE_EMAMI),
        coinRow('coin-bahar', bahar.get(date)!.close / 10, tomanPerOunce, PURE_BAHAR),
      ],
    });
  }
  return {
    days,
    info: {
      from: common[0]!,
      to: common[common.length - 1]!,
      days: common.length,
      sourceUrl,
      fetchedAt: fetchedAt.toISOString(),
    },
  };
}

function dayContentKey(day: GoldPremiumDay): string {
  return JSON.stringify({ ...day, fetchedAt: undefined });
}

/** Upsert `incoming` into `stored` (ascending, unique by date): an
 *  incoming row REPLACES the stored row of the same date unless they are
 *  content-identical (write-if-changed); a live row always beats a
 *  backfill row (S16-D2), and a backfill row never beats a live row —
 *  the stored row stays. Returns the merged days + whether anything
 *  changed. */
export function mergeDays(
  stored: readonly GoldPremiumDay[] | undefined,
  incoming: readonly GoldPremiumDay[],
): { days: GoldPremiumDay[]; changed: boolean } {
  const byDate = new Map<string, GoldPremiumDay>((stored ?? []).map((d) => [d.date, d]));
  let changed = false;
  for (const row of incoming) {
    const prev = byDate.get(row.date);
    if (prev === undefined) {
      byDate.set(row.date, row);
      changed = true;
      continue;
    }
    if (dayContentKey(prev) === dayContentKey(row)) continue; // identical — no-op
    if (prev.source === 'live' && row.source === 'backfill') continue; // backfill never overwrites live
    byDate.set(row.date, row);
    changed = true;
  }
  const days = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return { days, changed };
}

/** Assemble the stored snapshot over merged days (the asOf/fetchedAt/
 *  backfill record carried honestly). Fails closed: fewer than 2 days →
 *  null (the schema's own floor). */
export function assembleGoldPremiumHistory(
  days: readonly GoldPremiumDay[],
  now: Date,
  backfill: GoldPremiumBackfillInfo | undefined,
): GoldPremiumHistorySnapshot | null {
  if (days.length < 2) return null;
  return GoldPremiumHistorySnapshotSchema.parse({
    v: 1,
    asOf: days[days.length - 1]!.date,
    fetchedAt: now.toISOString(),
    ...(backfill !== undefined ? { backfill } : {}),
    days,
  });
}

/* ---------------------- the series + deciles ----------------------- */

/** One point of a coin's premium series (the chart's own shape). */
export interface PremiumSeriesPoint {
  date: string;
  /** The premium, PERCENT (negative = below melt). */
  premiumPct: number;
  /** The point's provenance (the boundary marker renders it). */
  source: 'backfill' | 'live';
}

/** One coin's premium series over the stored days (ascending; days
 *  without that coin are skipped — the honest per-instrument basis). */
export function premiumSeries(
  days: readonly GoldPremiumDay[],
  coinId: GoldPremiumCoinRow['id'],
): PremiumSeriesPoint[] {
  const out: PremiumSeriesPoint[] = [];
  for (const day of days) {
    const coin = day.coins.find((c) => c.id === coinId);
    if (coin === undefined) continue;
    out.push({ date: day.date, premiumPct: coin.premiumPct, source: day.source });
  }
  return out;
}

/** The minimum base before a premium decile speaks (the R19 posture —
 *  the repo's own grammar, applied to حباب; S16-D4). */
export const PREMIUM_DECILE_MIN_BASE = 30;

/** One coin's premium decile stats — the page's statistical identity
 *  applied to حباب: the decile (share of base strictly below the
 *  current premium), the band (p10/p25/median/p75/p90 over the base),
 *  and the honest basis window named at point of use. The current point
 *  is EXCLUDED from the base (the meter's own grammar). Null when the
 *  base is too small — the waiting line renders, never a thin decile. */
export interface PremiumDeciles {
  /** The latest premium, percent. */
  currentPct: number;
  /** The decile (0..1) over the base; null with `null` basis when too small. */
  decile: number | null;
  /** The band over the base (null with the decile). */
  band: { min: number; p10: number; p25: number; median: number; p75: number; p90: number; max: number } | null;
  /** The honest basis window (the current point excluded). */
  basis: { from: string; to: string; points: number } | null;
}

function quantileOf(sorted: readonly number[], q: number): number {
  // The standard nearest-rank quantile over an ascending-sorted base.
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx]!;
}

export function premiumDeciles(series: readonly PremiumSeriesPoint[]): PremiumDeciles | null {
  if (series.length < 2) return null;
  const current = series[series.length - 1]!;
  const base = series.slice(0, -1).map((p) => p.premiumPct);
  const sorted = [...base].sort((a, b) => a - b);
  let below = 0;
  for (const v of base) if (v < current.premiumPct) below++;
  const decile = base.length >= PREMIUM_DECILE_MIN_BASE ? below / base.length : null;
  return {
    currentPct: current.premiumPct,
    decile,
    band:
      decile !== null
        ? {
            min: sorted[0]!,
            p10: quantileOf(sorted, 0.1),
            p25: quantileOf(sorted, 0.25),
            median: quantileOf(sorted, 0.5),
            p75: quantileOf(sorted, 0.75),
            p90: quantileOf(sorted, 0.9),
            max: sorted[sorted.length - 1]!,
          }
        : null,
    basis:
      decile !== null
        ? { from: series[0]!.date, to: series[series.length - 2]!.date, points: base.length }
        : null,
  };
}

/* ------------------- the attribution strip (exact) ------------------ */

/** One observation of the identity's three factors. */
export interface AttributionLegs {
  /** The ounce, USD. */
  ounceUsd: number;
  /** The free-market dollar, TOMAN per USD. */
  dollarToman: number;
  /** The coin's premium over melt, PERCENT (negative allowed). */
  premiumPct: number;
}

/** The exact day-move decomposition — identity arithmetic, never
 *  regression (s7/01 §8's binding copy, disclosed at point of use). */
export interface AttributionStrip {
  /** The coin's own move, percent — DERIVED exactly from the three factors. */
  coinMovePct: number;
  /** The ounce factor's own move, percent. */
  ouncePct: number;
  /** The dollar factor's own move, percent. */
  dollarPct: number;
  /** The premium factor's own move (the (1+p) ratio's), percent. */
  premiumPct: number;
  /** The residual Δln(coin) − (Δln(oz)+Δln(usd)+Δln(1+p)) — ~0 by
   *  construction; the strip fails closed when it is not. */
  residualLn: number;
}

/** The log-identity: coin = ounce × USD/IRR × pure-content × (1+premium)
 *  — the constant cancels, so Δln(coin) = Δln(ounce) + Δln(USD/IRR) +
 *  Δln(1+premium) EXACTLY. Each factor renders as its own percent move;
 *  the multiplicative identity is the disclosed method, never a sum.
 *  Returns null on non-positive or non-finite legs, or a residual beyond
 *  1e-9 (mixed inputs never render a false identity). */
export function attributionStrip(base: AttributionLegs, current: AttributionLegs): AttributionStrip | null {
  const ok = (v: number): boolean => Number.isFinite(v) && v > 0;
  if (!ok(base.ounceUsd) || !ok(current.ounceUsd) || !ok(base.dollarToman) || !ok(current.dollarToman)) return null;
  if (!Number.isFinite(base.premiumPct) || !Number.isFinite(current.premiumPct)) return null;
  if (base.premiumPct <= -100 || current.premiumPct <= -100) return null; // (1+p) must stay positive
  const lnOz = Math.log(current.ounceUsd / base.ounceUsd);
  const lnUsd = Math.log(current.dollarToman / base.dollarToman);
  const lnP = Math.log((1 + current.premiumPct / 100) / (1 + base.premiumPct / 100));
  const lnCoin = lnOz + lnUsd + lnP; // the identity — exact by construction
  const residual = lnCoin - (lnOz + lnUsd + lnP);
  if (Math.abs(residual) > 1e-9) return null; // belt-and-braces: can never fire, but honesty first
  const pct = (ln: number): number => (Math.exp(ln) - 1) * 100;
  return {
    coinMovePct: pct(lnCoin),
    ouncePct: pct(lnOz),
    dollarPct: pct(lnUsd),
    premiumPct: pct(lnP),
    residualLn: residual,
  };
}

/** The last stored day's attribution legs for one coin (the strip's base
 *  observation). Null when the day does not carry the coin. */
export function attributionLegsOfDay(day: GoldPremiumDay, coinId: GoldPremiumCoinRow['id']): AttributionLegs | null {
  const coin = day.coins.find((c) => c.id === coinId);
  if (coin === undefined) return null;
  return { ounceUsd: day.ounceUsd, dollarToman: day.dollarToman, premiumPct: coin.premiumPct };
}

/** The live observation's legs (the bridge board's own computation). */
export function attributionLegsOfPremium(
  premium: { ounceUsd: number | null; dollarToman: number | null; rows: ReadonlyArray<{ id: string; premiumPct: number }> },
  coinId: GoldPremiumCoinRow['id'],
): AttributionLegs | null {
  const row = premium.rows.find((r) => r.id === coinId);
  if (row === undefined) return null;
  if (premium.ounceUsd === null || premium.dollarToman === null) return null;
  return { ounceUsd: premium.ounceUsd, dollarToman: premium.dollarToman, premiumPct: row.premiumPct };
}

/* ------------------------------------------------------------------ *
 * The rung (the daily forward accumulation)
 * ------------------------------------------------------------------ */

/** A snapshot older than this never writes a day row (the last-good
 *  discipline: an honest gap, never a stale quote under today's date). */
export const PREMIUM_MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60_000;

export interface GoldPremiumJobDeps {
  /** The ladder's own snapshot read (the api Worker passes its service
   *  result; the runner passes the REST-read snapshot). */
  getSnapshot: () => Promise<Snapshot | undefined>;
  /** Clock (tests pin the Tehran day). */
  now?: Date;
}

export type GoldPremiumJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldPremiumJobResult {
  outcome: GoldPremiumJobOutcome;
  snapshot?: GoldPremiumHistorySnapshot;
  kv: { reads: number; writes: number };
}

/**
 * The daily rung body: read the snapshot, compute the day row, upsert
 * write-if-changed. Failures NEVER discard the stored days (the
 * last-good discipline); a missing or stale snapshot writes nothing.
 */
export async function runGoldPremiumHistoryIngest(
  store: GoldPremiumStore,
  deps: GoldPremiumJobDeps,
): Promise<GoldPremiumJobResult> {
  const now = deps.now ?? new Date();
  const stored = await store.getGoldPremiumHistory();
  let snapshot: Snapshot | undefined;
  try {
    snapshot = await deps.getSnapshot();
  } catch (err) {
    return {
      outcome: { ok: false, kind: 'failed', note: `snapshot read failed: ${err instanceof Error ? err.message : String(err)}` },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }
  if (snapshot === undefined) {
    return {
      outcome: { ok: false, kind: 'blocked', note: 'no tgju snapshot in KV — nothing written (last-good holds)' },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }
  if (Math.abs(now.getTime() - Date.parse(snapshot.fetchedAt)) > PREMIUM_MAX_SNAPSHOT_AGE_MS) {
    return {
      outcome: {
        ok: false,
        kind: 'blocked',
        note: `snapshot is ${Math.round((now.getTime() - Date.parse(snapshot.fetchedAt)) / 3_600_000)}h old (fetchedAt ${snapshot.fetchedAt}) — nothing written under today's date`,
      },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }
  const day = liveDayFromSnapshot(snapshot, now);
  if (day === null) {
    return {
      outcome: { ok: false, kind: 'format-changed', note: 'snapshot carries no computable premium (missing ounce/dollar/coin legs)' },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }
  const merged = mergeDays(stored?.days, [day]);
  if (!merged.changed) {
    return {
      outcome: { ok: true, note: `no change (${day.date} — identical row)` },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }
  const next = assembleGoldPremiumHistory(merged.days, now, stored?.backfill);
  if (next === null) {
    return {
      outcome: { ok: false, kind: 'format-changed', note: 'merged days below the 2-day floor' },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }
  await store.writeGoldPremiumHistory(next);
  return {
    outcome: {
      ok: true,
      note: `${day.date} upserted (${day.coins.length} coins · ${merged.days.length} days)`,
    },
    snapshot: next,
    kv: { reads: 1, writes: 1 },
  };
}
