/**
 * if-bought.ts — GPE R33 / F26 (2026-11-19, S17): the "if you'd bought"
 * calculator's PURE compute + its ONE-key store and daily rung
 * (docs/specs/gold-page-elevation: s8/01 R33 · s5/02 F26 · s1/07 §4 the
 * SA precedent ("$X/month since year Y") · s6/01 zone 16 "F26 the
 * calculator is P4's" · s6/03 zone O "year picker + stacked result rows
 * at 390" · the s17 M1 §5 + S17-D5 records).
 *
 * THE FRAMING (the R33 row's own words): gold vs S&P vs BTC vs silver,
 * LUMP + DCA since year Y, EVERY WINDOW NAMED AT POINT OF USE, and the
 * DECILE framing where a 10y history exists — Currena's version adds
 * the statistical identity the SA precedent lacks. Past returns are no
 * guarantee of future results (the disclaimer the episodes rider
 * already carries); nothing here is advice.
 *
 * THE DATA PLANE (S17-D5): ONE KV key `insights:gold-ifbought:v1` (the
 * gold-lbma pattern): per-asset MONTH-END closes since 2016-11 —
 * backfilled by the runner (the ingest stage blob for gold/silver/btc
 * + the markets board's OWN keyless Yahoo provider for the S&P leg —
 * recorded, the R33 row's "all series in-repo" claim verified in the
 * provider sense) — plus the CURRENT running point refreshed daily by
 * the 04:49 UTC rung from the page's OWN planes (the public
 * projection's readings + the markets board's stored close — KV reads,
 * zero fetches); the month-turn freezes the prior month's last point as
 * the new anchor.
 *
 * THE ENGINE (pure, platform-free): the lump multiple, the MONTHLY DCA
 * (the SA convention — $100 per month at each month-end close), and the
 * decile of the window's lump return among ALL same-length windows over
 * the asset's own series (the R19 posture: min base 30 windows, the
 * basis named, the honest waiting line below it). Windows are named at
 * point of use — the result always carries its own from → to months.
 *
 * The rung fires 04:49 UTC — clear of every other rung (:13 prices ·
 * :23/:53 expectations · :15-mod Frankfurter · :40 watchdog · :50
 * narrator · the 04:xx ingest family · the 04:47 meter rung · 10:10/
 * 20:10 sweeps · 20:33 premium — the PRICES_CRON_MINUTE pattern, NO new
 * cron trigger). Write-if-changed; a missing key or stale projection
 * writes nothing.
 *
 * Platform boundary: the store + job touch KV through the narrow
 * expectations-twin port (AGENTS.md rule 2). Exported via the
 * "@currena/insights/if-bought" subpath so the SPA-facing root export
 * never pulls the fetch halves.
 */

import type {
  GoldIfBoughtAssetSeries,
  GoldIfBoughtBackfillInfo,
  GoldIfBoughtMonth,
  GoldIfBoughtSnapshot,
  InsightsSnapshot,
  MarketsSnapshot,
} from '@currena/core';
import { GoldIfBoughtSnapshotSchema } from '@currena/core';

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key)
 * ------------------------------------------------------------------ */

export const GOLD_IF_BOUGHT_KV_KEY = 'insights:gold-ifbought:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldIfBoughtKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldIfBought(
  raw: string | null | undefined,
): GoldIfBoughtSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldIfBoughtSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-ifbought-store] ${GOLD_IF_BOUGHT_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldIfBoughtReader {
  getGoldIfBought(): Promise<GoldIfBoughtSnapshot | undefined>;
}

export interface GoldIfBoughtStore extends GoldIfBoughtReader {
  writeGoldIfBought(snapshot: GoldIfBoughtSnapshot): Promise<void>;
}

export class KvGoldIfBoughtStore implements GoldIfBoughtStore {
  constructor(private readonly kv: GoldIfBoughtKv) {}

  async getGoldIfBought(): Promise<GoldIfBoughtSnapshot | undefined> {
    return parseStoredGoldIfBought(await this.kv.get(GOLD_IF_BOUGHT_KV_KEY));
  }

  async writeGoldIfBought(snapshot: GoldIfBoughtSnapshot): Promise<void> {
    await this.kv.put(GOLD_IF_BOUGHT_KV_KEY, JSON.stringify(snapshot));
  }
}

/* ------------------------------------------------------------------ *
 * The pure engine (the SPA's own compute — the root-barrel half)
 * ------------------------------------------------------------------ */

/** The DCA monthly amount (the SA precedent's own convention, $100). */
export const IF_BOUGHT_DCA_MONTHLY = 100;

/** The decile base rule (the R19 posture): a window's decile lights only
 *  when at least this many same-length windows exist. */
export const IF_BOUGHT_DECILE_MIN_BASE = 30;

/** The first month at or after `${year}-01`. */
function monthAtOrAfter(months: readonly string[], year: number): string | null {
  for (const ym of months) {
    if (Number(ym.slice(0, 4)) >= year) return ym;
  }
  return null;
}

/** The window's monthly closes (the anchors + the running point), or
 *  null when the series has nothing at/after the year. */
export function windowCloses(asset: GoldIfBoughtAssetSeries, sinceYear: number): { ym: string; close: number }[] | null {
  const all: readonly GoldIfBoughtMonth[] = [...asset.monthly, { ym: asset.current.ym, close: asset.current.close }];
  const first = monthAtOrAfter(all.map((m) => m.ym), sinceYear);
  if (first === null) return null;
  return all.filter((m) => m.ym >= first);
}

/** One asset's result for a "since year Y" window. */
export interface IfBoughtResult {
  /** The window's own months, named at point of use. */
  fromYm: string;
  toYm: string;
  /** How many monthly closes the window spans (the DCA's own count). */
  months: number;
  /** The lump multiple's percent — (current ÷ base − 1) × 100. */
  lumpPct: number;
  /** The DCA result: $100 per month at each month-end close. */
  dcaInvested: number;
  dcaValue: number;
  /** (value ÷ invested − 1) × 100. */
  dcaPct: number;
  /** The decile of this window's lump return among ALL same-length
   *  windows over the series (null under the min base — the honest
   *  waiting line) + the named basis. */
  decile: number | null;
  decileBase: number;
}

/**
 * The "if you'd bought" compute for one asset since a year — pure over
 * the series. The base is the first available month-end at/after
 * January of the year (the series starts 2016-11: "since 2016" honestly
 * reads since November 2016 — the window's own months render at point
 * of use). The DCA buys IF_BOUGHT_DCA_MONTHLY at EVERY monthly close in
 * the window INCLUDING the running month; the value marks at the
 * running month's close. The decile rides the R19 posture.
 */
export function ifBoughtResult(asset: GoldIfBoughtAssetSeries, sinceYear: number): IfBoughtResult | null {
  const closes = windowCloses(asset, sinceYear);
  if (closes === null || closes.length === 0) return null;
  const base = closes[0]!;
  const last = closes[closes.length - 1]!;
  const lumpPct = ((last.close / base.close) - 1) * 100;
  let units = 0;
  for (const m of closes) units += IF_BOUGHT_DCA_MONTHLY / m.close;
  const dcaInvested = IF_BOUGHT_DCA_MONTHLY * closes.length;
  const dcaValue = units * last.close;
  const dcaPct = ((dcaValue / dcaInvested) - 1) * 100;

  // The decile: this window's lump return among ALL same-length windows
  // over the whole series (anchors + running point, sliding by month).
  const all: readonly GoldIfBoughtMonth[] = [...asset.monthly, { ym: asset.current.ym, close: asset.current.close }];
  const windowLength = closes.length;
  const windows: number[] = [];
  for (let i = 0; i + windowLength - 1 < all.length; i++) {
    const from = all[i]!.close;
    const to = all[i + windowLength - 1]!.close;
    if (from > 0) windows.push(((to / from) - 1) * 100);
  }
  // The CURRENT window is the LAST of them (its end is the running
  // month); the decile counts how many of the others sit at or below it.
  const mine = windows[windows.length - 1] ?? lumpPct;
  const base_n = windows.length;
  let decile: number | null = null;
  if (base_n >= IF_BOUGHT_DECILE_MIN_BASE) {
    const atOrBelow = windows.filter((w) => w <= mine + 1e-12).length;
    decile = Math.min(10, Math.max(1, Math.ceil((atOrBelow / base_n) * 10)));
  }
  return {
    fromYm: base.ym,
    toYm: last.ym,
    months: closes.length,
    lumpPct,
    dcaInvested,
    dcaValue,
    dcaPct,
    decile,
    decileBase: base_n,
  };
}

/* ------------------------------------------------------------------ *
 * The rung (the daily refresh + the month-turn anchor)
 * ------------------------------------------------------------------ */

/** A public projection older than this never updates the running point
 *  (the last-good discipline — an honest gap, never a stale close under
 *  a fresh month). */
export const IF_BOUGHT_MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60_000;

export interface GoldIfBoughtJobDeps {
  /** The public projection read (the gold/silver/btc daily closes — the
   *  page's own plane). */
  getPublicSnapshot: () => Promise<InsightsSnapshot | undefined>;
  /** The markets board read (the sp500 stored close — the board's own plane). */
  getMarketsSnapshot: () => Promise<MarketsSnapshot | undefined>;
  /** Clock (tests pin the month turn). */
  now?: Date;
}

export type GoldIfBoughtJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldIfBoughtJobResult {
  outcome: GoldIfBoughtJobOutcome;
  snapshot?: GoldIfBoughtSnapshot;
  kv: { reads: number; writes: number };
}

/** The reading's value for one leg (the page's own planes). */
function readingValueOf(snapshot: InsightsSnapshot, id: string): number | null {
  const reading = snapshot.readings.find((r) => (r.id as string) === id);
  if (reading === undefined || reading.value === null || !Number.isFinite(reading.value) || reading.value <= 0) return null;
  return reading.value;
}

/** The sp500 stored close off the markets board. */
function sp500CloseOf(markets: MarketsSnapshot): number | null {
  const entry = markets.markets.find((m) => m.id === 'sp500');
  if (entry === undefined || !Number.isFinite(entry.close) || entry.close <= 0) return null;
  return entry.close;
}

/** Update ONE asset's running point (+ the month-turn anchor) — pure. */
export function refreshAssetSeries(
  asset: GoldIfBoughtAssetSeries,
  close: number | null,
  ym: string,
  updatedAt: string,
): { asset: GoldIfBoughtAssetSeries; changed: boolean } {
  if (close === null) return { asset, changed: false }; // no fresh input — the stored point holds (honest)
  const monthly = [...asset.monthly];
  const current = { ym, close, updatedAt };
  if (ym > asset.current.ym) {
    // The month turned: freeze the prior running point as the new
    // anchor (it was the prior month's last close — the rung's own
    // daily refresh kept it current through the month's final day).
    if (asset.current.ym > monthly[monthly.length - 1]!.ym) monthly.push({ ym: asset.current.ym, close: asset.current.close });
  } else if (ym === asset.current.ym) {
    if (asset.current.close === close) return { asset, changed: false }; // write-if-changed
  }
  // ym < the stored month never happens (the clock moves forward).
  return { asset: { monthly, current }, changed: true };
}

/**
 * The daily rung body: read the stored key + the two planes, refresh
 * the four running points, write-if-changed. Failures NEVER discard the
 * stored series (the last-good discipline); a missing key or a stale
 * (>24 h) public projection writes nothing.
 */
export async function runGoldIfBoughtRefresh(
  store: GoldIfBoughtStore,
  deps: GoldIfBoughtJobDeps,
): Promise<GoldIfBoughtJobResult> {
  const now = deps.now ?? new Date();
  const ym = now.toISOString().slice(0, 7);
  const updatedAt = now.toISOString();
  let reads = 0;
  let writes = 0;

  const stored = await store.getGoldIfBought();
  reads++;
  if (stored === undefined) {
    return {
      outcome: { ok: false, kind: 'blocked', note: 'no if-bought key in KV — nothing written (the backfill runner owns the first write)' },
      kv: { reads, writes },
    };
  }

  let projection: InsightsSnapshot | undefined;
  try {
    projection = await deps.getPublicSnapshot();
  } catch (err) {
    return {
      outcome: { ok: false, kind: 'failed', note: `public projection read failed: ${err instanceof Error ? err.message : String(err)}` },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads, writes },
    };
  }
  if (projection === undefined) {
    return { outcome: { ok: false, kind: 'blocked', note: 'no public projection in KV — nothing written (last-good holds)' }, snapshot: stored, kv: { reads, writes } };
  }
  const generatedMs = Date.parse(projection.generatedAt);
  if (!Number.isFinite(generatedMs) || now.getTime() - generatedMs > IF_BOUGHT_MAX_SNAPSHOT_AGE_MS) {
    return {
      outcome: { ok: false, kind: 'blocked', note: `public projection too old (${projection.generatedAt}) — nothing written (last-good holds)` },
      snapshot: stored,
      kv: { reads, writes },
    };
  }

  let markets: MarketsSnapshot | undefined;
  try {
    markets = await deps.getMarketsSnapshot();
    reads++;
  } catch (err) {
    markets = undefined; // the sp500 leg keeps its stored point (honest)
    void err;
  }

  const gold = readingValueOf(projection, 'gold-usd');
  const silver = readingValueOf(projection, 'silver-usd');
  const btc = readingValueOf(projection, 'btc-usd');
  const sp500 = markets !== undefined ? sp500CloseOf(markets) : null;

  const a1 = refreshAssetSeries(stored.assets.gold, gold, ym, updatedAt);
  const a2 = refreshAssetSeries(stored.assets.silver, silver, ym, updatedAt);
  const a3 = refreshAssetSeries(stored.assets.btc, btc, ym, updatedAt);
  const a4 = refreshAssetSeries(stored.assets.sp500, sp500, ym, updatedAt);
  if (!a1.changed && !a2.changed && !a3.changed && !a4.changed) {
    return { outcome: { ok: true, note: 'no change (identical running points)' }, snapshot: stored, kv: { reads, writes } };
  }
  const next: GoldIfBoughtSnapshot = {
    ...stored,
    fetchedAt: updatedAt,
    assets: {
      gold: a1.asset,
      silver: a2.asset,
      btc: a3.asset,
      sp500: a4.asset,
    },
  };
  try {
    await store.writeGoldIfBought(next);
    writes++;
  } catch (err) {
    return {
      outcome: { ok: false, kind: 'failed', note: `write failed: ${err instanceof Error ? err.message : String(err)}` },
      snapshot: stored,
      kv: { reads, writes },
    };
  }
  return { outcome: { ok: true, note: `refreshed the running points (${ym})` }, snapshot: next, kv: { reads, writes } };
}

export type { GoldIfBoughtBackfillInfo };
