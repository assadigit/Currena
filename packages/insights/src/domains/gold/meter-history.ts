/**
 * meter-history.ts — GPE R31 / F12 (2026-11-19, S17): the gold METER's
 * TIME MACHINE — the date-parameterized, readings-only projection of the
 * consolidated balance over the meter era (docs/specs/
 * gold-page-elevation: s8/01 R31 · s6/01 zone 4 "the F12 time-machine
 * control (Advanced, collapsed affordance)" · s6/03 zone C · s7/03 §3.4
 * THE METER-ERA BOUNDARY (binding: 2016+, never a pre-2016 verdict, the
 * only historical-meter surface) · the s17 M1 §6 records S17-D1..D3).
 *
 * THE D7-LOCKED MINIMAL SIZING (CP-C D7): a date-parameterized,
 * READINGS-ONLY projection — the day's lane sides, the beam, the lane
 * counts — NO per-voter member lists, NO historical narrative or
 * outlook re-derivation. The historical view mirrors the hero's own
 * lane-chip surface.
 *
 * THE VERSIONED VOTER TABLES (S17-D2): the dated registry
 * GOLD_METER_TABLE_VERSIONS — the authoritative lineage of
 * GOLD_SYSTEM_COMPLETE_REFERENCE §5.4 as FOUR selectable end-of-day
 * entries (the intra-day GF-P1 19-seat and GF-P3 36-seat versions are
 * recorded in the lineage comments and NEVER selected — the daily grid
 * cannot resolve intra-day transitions; the end-of-day convention is
 * the daily archive's own). The ERA BASIS for 2016-11 → 2026-10-30 is
 * the S4-frozen 20-seat table (HARNESS_GOLD_VOTERS_20 — the published
 * backtest's own frozen table; the honest label: no live meter existed
 * before late October 2026, so the reconstruction rides the published
 * record's own basis). A FUTURE table change is a new owner-gated
 * registry entry with its own frozen seat list (the governance
 * successor rule, GOLD_SYSTEM_COMPLETE_REFERENCE §12) — production
 * GOLD_LANE_VOTERS edits never silently rewrite history.
 *
 * THE DATA PLANE (S17-D1): YEAR-SHARDED KV keys
 * `insights:gold-meter-history:v1:<YYYY>` — one read per request
 * preserved (the gold-lbma/gold-premium discipline) while the era's
 * ~2,500 compact rows never form one ~1 MB blob the free-plan CPU
 * budget would parse per request. TWO provenances per row, the honesty
 * line rendered at point of use:
 *   - 'backfill' — reconstructed from the stored series (the ingest
 *     stage blob + the per-id history fallbacks — the corpus-dump
 *     pattern) at a FROZEN CLOCK with NO LOOKAHEAD (seriesUpTo, the
 *     backtest's own machinery: computeReading over the truncated
 *     series at the production rung's 04:10 anchor, the D-6
 *     real-yield cross-fill applied exactly as production does);
 *   - 'live' — the 04:47 UTC rung's forward row from the PUBLIC
 *     PROJECTION's own readings (the page's own plane; the live-prices
 *     merge never touches the voters' derived fields, so the row is
 *     byte-consistent with the page's own goldBalance — pinned by
 *     test). A live row overwrites a backfill row on date collision,
 *     never the reverse (the S16-D2 rule).
 *
 * THE RUNG (the api Worker's ever-green cron, 04:47 UTC — clear of
 * every other rung: :13 prices · :23/:53 expectations · :15-mod
 * Frankfurter · :40 watchdog · :50 narrator · the 04:xx ingest family ·
 * 10:10/20:10 sweeps · 20:33 premium): read the public projection, compute
 * today's row, upsert write-if-changed. A missing or >24 h-old snapshot
 * writes NOTHING (the last-good discipline — an honest gap, never a
 * stale reading under today's date).
 *
 * The manual runner (gold-meter-run, the gold-premium-run twin): the
 * one-time era backfill (the stage + hist reads through the KV REST
 * API, sequential year writes).
 *
 * Platform boundary: the store + job touch KV through the narrow
 * expectations-twin port (AGENTS.md rule 2); the reconstruction is
 * PURE (injected series + definitions — no clock, no fetch). Exported
 * via the "@currena/insights/meter-history" subpath so the
 * SPA-facing root export never pulls the fetch halves.
 */

import type {
  GoldMeterMeta,
  GoldMeterRowSource,
  GoldMeterTableVersionInfo,
  GoldMeterTableRow,
  GoldMeterYearDoc,
  IndicatorReading,
  InsightsSnapshot,
} from '@currena/core';
import { GOLD_METER_ERA_START, GoldMeterYearDocSchema } from '@currena/core';
import type { IndicatorDefinition } from '@currena/core';
import { type GoldLaneVoter } from '../../shared/gold-score';
import { GOLD_LANE_MIN_FIRING } from './gold-balance';
import { computeReading } from '../../shared/scoring';
import { realYieldScoringSeries } from './real-yield-fill';
import { laneBalanceOverVoters, HARNESS_GOLD_VOTERS_20, HARNESS_GOLD_VOTERS_21, seriesUpTo } from './gold-backtest-core';
import type { SeriesPoint } from '../../shared/series';

// The wire types + the era boundary re-exported (the runner + the api route
// read them from ONE home).
export type { GoldMeterYearDoc, GoldMeterTableRow, GoldMeterMeta, GoldMeterTableVersionInfo } from '@currena/core';
export { GOLD_METER_ERA_START };

/* ------------------------------------------------------------------ *
 * The versioned voter tables (S17-D2 — the dated registry)
 * ------------------------------------------------------------------ */

/** The frozen GF-P2 five-lane table (2026-11-05, 32 seats: 6/5/10/9/2 —
 * the calibration's measured POST-P2-5LANE composition). FROZEN LITERAL
 * (not derived from production): a future GOLD_LANE_VOTERS edit must
 * never rewrite this history. Pinned by test to equal production minus
 * the five GF-P3/GF-S10 additions, exactly the additive lineage. */
const GF_VOTERS_P2_32: readonly GoldLaneVoter[] = [
  // ——— Borrowing costs (6)
  { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us30y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-target', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-expectations', polarity: -1 },
  { lane: 'borrowing-costs', id: 'ecb-dfr', polarity: -1 },
  // ——— The dollar (5)
  { lane: 'dollar', id: 'dollar-basket', polarity: -1 },
  { lane: 'dollar', id: 'usdjpy', polarity: -1 },
  { lane: 'dollar', id: 'us-japan-10y-gap', polarity: -1 },
  { lane: 'dollar', id: 'usd-reserve-share', polarity: -1 },
  { lane: 'dollar', id: 'nyfed-custody', polarity: -1 },
  // ——— Market stress (10)
  { lane: 'stress', id: 'stress-stlfsi', polarity: 1 },
  { lane: 'stress', id: 'nfci', polarity: 1 },
  { lane: 'stress', id: 'vix', polarity: 1 },
  { lane: 'stress', id: 'gold-silver', polarity: 1 },
  { lane: 'stress', id: 'term-premium-10y', polarity: 1 },
  { lane: 'stress', id: 'ebp', polarity: 1 },
  { lane: 'stress', id: 'michigan-sentiment', polarity: -1 },
  { lane: 'stress', id: 'gpr-daily', polarity: 1 },
  { lane: 'stress', id: 'epu-us', polarity: 1 },
  { lane: 'stress', id: 'sp500-breadth-ratio', polarity: -1 },
  // ——— Inflation (9)
  { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 },
  { lane: 'inflation', id: 'us-pce-core-yoy', polarity: 1 },
  { lane: 'inflation', id: 'euro-hicp', polarity: 1 },
  { lane: 'inflation', id: 'breakeven-5y5y', polarity: 1 },
  { lane: 'inflation', id: 'breakeven-tilt', polarity: 1 },
  { lane: 'inflation', id: 't5yie', polarity: 1 },
  { lane: 'inflation', id: 'michigan-1y-expectations', polarity: 1 },
  { lane: 'inflation', id: 'm2-us', polarity: 1 },
  { lane: 'inflation', id: 'us-deficit-12m', polarity: 1 },
  // ——— Flows & demand (2)
  { lane: 'flows', id: 'cftc-gold-positioning', polarity: -1 },
  { lane: 'flows', id: 'cftc-gold-gross-long', polarity: -1 },
];

/** The frozen GF-S10 table (2026-11-06, 37 seats: 7/7/11/10/2 — the
 * POST-P4-5LANE measured composition, UNCHANGED since). FROZEN LITERAL:
 * pinned by test to equal production GOLD_LANE_VOTERS exactly today;
 * a future production edit is a NEW registry entry (the governance
 * successor rule), never a silent rewrite of this one. */
const GF_VOTERS_S10_37: readonly GoldLaneVoter[] = [
  // ——— Borrowing costs (7)
  { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us30y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-target', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-expectations', polarity: -1 },
  { lane: 'borrowing-costs', id: 'ecb-dfr', polarity: -1 },
  { lane: 'borrowing-costs', id: 'real-yield-5y', polarity: -1 },
  // ——— The dollar (7)
  { lane: 'dollar', id: 'dollar-basket', polarity: -1 },
  { lane: 'dollar', id: 'usdjpy', polarity: -1 },
  { lane: 'dollar', id: 'us-japan-10y-gap', polarity: -1 },
  { lane: 'dollar', id: 'usd-reserve-share', polarity: -1 },
  { lane: 'dollar', id: 'nyfed-custody', polarity: -1 },
  { lane: 'dollar', id: 'dollar-broad', polarity: -1 },
  { lane: 'dollar', id: 'dollar-eme', polarity: -1 },
  // ——— Market stress (11)
  { lane: 'stress', id: 'stress-stlfsi', polarity: 1 },
  { lane: 'stress', id: 'nfci', polarity: 1 },
  { lane: 'stress', id: 'vix', polarity: 1 },
  { lane: 'stress', id: 'gold-silver', polarity: 1 },
  { lane: 'stress', id: 'term-premium-10y', polarity: 1 },
  { lane: 'stress', id: 'ebp', polarity: 1 },
  { lane: 'stress', id: 'michigan-sentiment', polarity: -1 },
  { lane: 'stress', id: 'gpr-daily', polarity: 1 },
  { lane: 'stress', id: 'epu-us', polarity: 1 },
  { lane: 'stress', id: 'sp500-breadth-ratio', polarity: -1 },
  { lane: 'stress', id: 'bank-stress', polarity: 1 },
  // ——— Inflation (10)
  { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 },
  { lane: 'inflation', id: 'us-pce-core-yoy', polarity: 1 },
  { lane: 'inflation', id: 'euro-hicp', polarity: 1 },
  { lane: 'inflation', id: 'breakeven-5y5y', polarity: 1 },
  { lane: 'inflation', id: 'breakeven-tilt', polarity: 1 },
  { lane: 'inflation', id: 't5yie', polarity: 1 },
  { lane: 'inflation', id: 'michigan-1y-expectations', polarity: 1 },
  { lane: 'inflation', id: 'm2-us', polarity: 1 },
  { lane: 'inflation', id: 'us-deficit-12m', polarity: 1 },
  { lane: 'inflation', id: 'michigan-5y-expectations', polarity: 1 },
  // ——— Flows & demand (2)
  { lane: 'flows', id: 'cftc-gold-positioning', polarity: -1 },
  { lane: 'flows', id: 'cftc-gold-gross-long', polarity: -1 },
];

/** One registry entry — a dated, frozen voter table. */
export interface GoldMeterTableVersion {
  /** The registry id (rides every row's own tableVersion field). */
  id: string;
  /** The first day (inclusive) this version is the then-current table. */
  effectiveFrom: string;
  /** The frozen seat list. */
  voters: readonly GoldLaneVoter[];
  /** The lineage note (rendered nowhere by itself; the registry is the record). */
  note: string;
}

/**
 * The dated voter-table registry — the authoritative lineage
 * (GOLD_SYSTEM_COMPLETE_REFERENCE §5.4) as FOUR selectable end-of-day
 * entries. The two intra-day versions are recorded here in the notes,
 * never selectable:
 *   - GF-P1 (2026-11-05, 19 seats — the two yield-curve seats demoted
 *     to context, decision H) lived only hours before GF-P2 flipped
 *     the five-lane composition the same day;
 *   - GF-P3 (2026-11-06, 36 seats) lived only hours before GF-S10
 *     seated michigan-5y-expectations the same day.
 * Selection = the LAST entry with effectiveFrom <= date (end-of-day,
 * the daily archive's own convention).
 */
export const GOLD_METER_TABLE_VERSIONS: readonly GoldMeterTableVersion[] = [
  {
    id: 's4-frozen-20',
    effectiveFrom: GOLD_METER_ERA_START,
    voters: HARNESS_GOLD_VOTERS_20,
    note: 'The era basis 2016-11 → 2026-10-30: the published backtest\u2019s own frozen 20-seat table (HARNESS_GOLD_VOTERS_20). No live meter existed before 2026-10-31 — the reconstruction rides the published record\u2019s own basis, honestly labelled on the card.',
  },
  {
    id: 's6-21',
    effectiveFrom: '2026-10-31',
    voters: HARNESS_GOLD_VOTERS_21,
    note: 'Session 6 (D-5): breakeven-tilt promoted — the 21-seat table (HARNESS_GOLD_VOTERS_21).',
  },
  {
    id: 'gf-p2-32',
    effectiveFrom: '2026-11-05',
    voters: GF_VOTERS_P2_32,
    note: 'GF-P2 (the owner\u2019s recorded answers B/C/G/K): the five-lane flip + 12 promotions + the COBD pair — 32 seats. The intra-day GF-P1 19-seat table (decision H) never selects at daily granularity.',
  },
  {
    id: 'gf-s10-37',
    effectiveFrom: '2026-11-06',
    voters: GF_VOTERS_S10_37,
    note: 'GF-S10: michigan-5y-expectations seated — the current 37-seat table, UNCHANGED since 2026-11-06. The intra-day GF-P3 36-seat table never selects at daily granularity.',
  },
];

/** The then-current table for a date — the LAST registry entry with
 * effectiveFrom <= date. Dates before the era start (the route's own
 * boundary rejection) fall back to the era basis; the registry is
 * effective-ordered by construction (pinned by test). */
export function meterTableFor(date: string): GoldMeterTableVersion {
  let chosen = GOLD_METER_TABLE_VERSIONS[0]!;
  for (const entry of GOLD_METER_TABLE_VERSIONS) {
    if (entry.effectiveFrom <= date) chosen = entry;
  }
  return chosen;
}

/** The registry's wire form (the meta document — S17-D2's record). */
export function goldMeterTableVersionInfos(): GoldMeterTableVersionInfo[] {
  return GOLD_METER_TABLE_VERSIONS.map((entry) => ({
    id: entry.id,
    effectiveFrom: entry.effectiveFrom,
    seats: entry.voters.length,
  }));
}

/** The meta document (no KV read — the constants are the record). */
export function goldMeterMeta(): GoldMeterMeta {
  return { v: 1, eraStart: GOLD_METER_ERA_START, tableVersions: goldMeterTableVersionInfos() };
}

/* ------------------------------------------------------------------ *
 * The reconstruction (pure — the backtest's own machinery)
 * ------------------------------------------------------------------ */

/** The real-yield scoring-input cross-fill legs (derived.ts passthroughs). */
const REAL_YIELD_ID = 'real-yield-10y' as const;
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;

/** The frozen clock anchor — the production main rung's own time-of-day
 * (day-boundary only, the backtest's frozenNow verbatim). */
const frozenNow = (day: string): string => `${day}T04:10:00.000Z`;

/**
 * One day's voter readings, reconstructed from the stored series with
 * NO LOOKAHEAD (seriesUpTo truncates every series at the day BEFORE any
 * scoring math sees it) — the backtest harness's own loop, factored pure:
 * for each seat of the given table, computeReading over the truncated
 * series at the frozen clock, with the D-6 real-yield cross-fill applied
 * to the SCORING INPUT exactly as production applies it
 * (realYieldScoringSeries — the bounded DGS10−T10YIE fill; the stored
 * history stays pure DFII10). A seat without a series reads honestly
 * unreadable (computeReading's own unavailable/stale vocabulary — never
 * a guess); a seat without a definition is simply absent (the caller's
 * registry tables always carry definable ids — pinned by test).
 */
export function reconstructMeterReadings(
  seriesById: ReadonlyMap<string, readonly SeriesPoint[]>,
  day: string,
  voters: readonly GoldLaneVoter[],
  defsById: ReadonlyMap<string, IndicatorDefinition>,
): IndicatorReading[] {
  const now = frozenNow(day);
  const readings: IndicatorReading[] = [];
  for (const seat of voters) {
    const def = defsById.get(seat.id);
    if (def === undefined) continue;
    // The D-6 cross-fill for the real-yield SCORING INPUT, exactly as the
    // backtest applies it (and production does at ingest).
    const fill =
      seat.id === REAL_YIELD_ID
        ? realYieldScoringSeries(
            seriesUpTo(seriesById.get(REAL_YIELD_ID) ?? [], day),
            seriesUpTo(seriesById.get(FILL_LEGS.nominal) ?? [], day),
            seriesUpTo(seriesById.get(FILL_LEGS.breakeven) ?? [], day),
            now,
          )
        : undefined;
    const series =
      seat.id === REAL_YIELD_ID && fill !== undefined && fill.fills > 0
        ? fill.series ?? seriesUpTo(seriesById.get(REAL_YIELD_ID) ?? [], day)
        : seriesUpTo(seriesById.get(seat.id) ?? [], day);
    readings.push(computeReading(def, series, now, { name: 'stored history (stage blob)' }));
  }
  return readings;
}

/* ------------------------------------------------------------------ *
 * The row (pure — the compact, readings-only projection)
 * ------------------------------------------------------------------ */

/** The day's compact meter row over the given table + readings — the
 * consolidated balance through the HARNESS twin (laneBalanceOverVoters
 * with GOLD_LANE_MIN_FIRING and inputPresence=true — the production
 * goldBalance's own semantics, equivalence pinned by gold-balance.test),
 * mapped onto the wire row. Pure; never throws (missing readings read
 * honestly unreadable). */
export function meterTableRowOf(
  date: string,
  source: GoldMeterRowSource,
  table: readonly GoldLaneVoter[],
  tableVersionId: string,
  readings: readonly IndicatorReading[],
): GoldMeterTableRow {
  const balance = laneBalanceOverVoters(readings, table, GOLD_LANE_MIN_FIRING, true);
  return {
    date,
    source,
    tableVersion: tableVersionId,
    state: balance.state,
    beamAngle: balance.beamAngle,
    fullyTipped: balance.fullyTipped,
    net: balance.net,
    readable: balance.readable,
    counts: balance.counts,
    lanes: balance.lanes.map((l) => ({
      lane: l.lane,
      side: l.side,
      split: l.split,
      readable: l.readable,
      firing: l.firing,
      supports: l.supports,
      pressures: l.pressures,
    })),
  };
}

/** The live row for TODAY from the public projection's own readings —
 * the rung's forward accumulation. The current registry table (the last
 * entry — always production-equivalent, pinned by test); the readings
 * filtered to the table's seats. Byte-consistent with the page's own
 * goldBalance over the same readings (the live-prices merge never
 * touches the voters' derived fields — pinned by test). */
export function meterLiveRowOf(date: string, snapshot: InsightsSnapshot): GoldMeterTableRow {
  const version = GOLD_METER_TABLE_VERSIONS[GOLD_METER_TABLE_VERSIONS.length - 1]!;
  const seatIds = new Set(version.voters.map((v) => v.id as string));
  const readings = snapshot.readings.filter((r) => seatIds.has(r.id as string));
  return meterTableRowOf(date, 'live', version.voters, version.id, readings);
}

/* ------------------------------------------------------------------ *
 * The store (the YEAR-sharded ONE-read-per-request data plane, S17-D1)
 * ------------------------------------------------------------------ */

export const GOLD_METER_KV_PREFIX = 'insights:gold-meter-history:v1:';

/** `insights:gold-meter-history:v1:<YYYY>` — one year's shard. */
export function goldMeterYearKey(year: number): string {
  return `${GOLD_METER_KV_PREFIX}${year}`;
}

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldMeterKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldMeterYear(
  raw: string | null | undefined,
): GoldMeterYearDoc | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldMeterYearDocSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-meter-store] a meter-history shard failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldMeterReader {
  getYear(year: number): Promise<GoldMeterYearDoc | undefined>;
}

export interface GoldMeterStore extends GoldMeterReader {
  putYear(doc: GoldMeterYearDoc): Promise<void>;
}

export class KvGoldMeterStore implements GoldMeterStore {
  constructor(private readonly kv: GoldMeterKv) {}

  async getYear(year: number): Promise<GoldMeterYearDoc | undefined> {
    return parseStoredGoldMeterYear(await this.kv.get(goldMeterYearKey(year)));
  }

  async putYear(doc: GoldMeterYearDoc): Promise<void> {
    await this.kv.put(goldMeterYearKey(doc.year), JSON.stringify(doc));
  }
}

/* ------------------------------------------------------------------ *
 * The upsert (the S16-D2 live-over-backfill rule, per shard)
 * ------------------------------------------------------------------ */

/**
 * Upsert one row into its year shard — the merge rule: a LIVE row
 * overwrites a BACKFILL row on date collision, never the reverse; an
 * identical row is a no-op (write-if-changed). Returns the merged doc
 * (the same reference when nothing changed) + whether a write is needed.
 * Pure; never mutates the input.
 */
export function upsertMeterRow(
  doc: GoldMeterYearDoc,
  row: GoldMeterTableRow,
  fetchedAt: string,
): { doc: GoldMeterYearDoc; changed: boolean } {
  if (row.date.slice(0, 4) !== String(doc.year)) {
    throw new Error(`upsertMeterRow: ${row.date} does not belong to shard year ${doc.year}`);
  }
  const existing = doc.rows.find((r) => r.date === row.date);
  if (existing !== undefined) {
    if (existing.source === 'live' && row.source === 'backfill') {
      return { doc, changed: false }; // the reverse overwrite never happens
    }
    const { source: _s, ...rest } = row;
    const { source: _es, ...existingRest } = existing;
    if (_s === _es && JSON.stringify(rest) === JSON.stringify(existingRest)) {
      return { doc, changed: false }; // identical row (same provenance) — no write
    }
  }
  const rows = doc.rows.filter((r) => r.date !== row.date);
  rows.push(row);
  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  return { doc: { ...doc, rows, fetchedAt }, changed: true };
}

/* ------------------------------------------------------------------ *
 * The rung (the daily forward accumulation)
 * ------------------------------------------------------------------ */

/** A public projection older than this never writes a day row (the
 *  last-good discipline: an honest gap, never a stale reading under
 *  today's date). */
export const GOLD_METER_MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60_000;

export interface GoldMeterJobDeps {
  /** The public projection read (the api Worker passes its KV reader; the
   *  runner passes the REST-read document). */
  getPublicSnapshot: () => Promise<InsightsSnapshot | undefined>;
  /** Clock (tests pin the day). */
  now?: Date;
}

export type GoldMeterJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'empty' | 'format-changed'; note: string };

export interface GoldMeterJobResult {
  outcome: GoldMeterJobOutcome;
  kv: { reads: number; writes: number };
}

/**
 * The daily rung body: read the public projection, compute today's row
 * (the LIVE provenance — the page's own plane), upsert into the current
 * year's shard, write-if-changed. Failures NEVER discard the stored rows
 * (the last-good discipline); a missing or >24 h-old projection writes
 * nothing.
 */
export async function runGoldMeterHistoryIngest(
  store: GoldMeterStore,
  deps: GoldMeterJobDeps,
): Promise<GoldMeterJobResult> {
  const now = deps.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const year = Number(day.slice(0, 4));
  let reads = 0;
  let writes = 0;

  const stored = await store.getYear(year);
  reads++;
  let snapshot: InsightsSnapshot | undefined;
  try {
    snapshot = await deps.getPublicSnapshot();
  } catch (err) {
    return {
      outcome: { ok: false, kind: 'failed', note: `public projection read failed: ${err instanceof Error ? err.message : String(err)}` },
      kv: { reads, writes },
    };
  }
  if (snapshot === undefined) {
    return {
      outcome: { ok: false, kind: 'blocked', note: 'no public projection in KV — nothing written (last-good holds)' },
      kv: { reads, writes },
    };
  }
  // The last-good guard: a projection older than 24 h would write a stale
  // reading under today's date — the honest gap instead.
  const generatedMs = Date.parse(snapshot.generatedAt);
  if (!Number.isFinite(generatedMs) || now.getTime() - generatedMs > GOLD_METER_MAX_SNAPSHOT_AGE_MS) {
    return {
      outcome: {
        ok: false,
        kind: 'blocked',
        note: `public projection too old (${snapshot.generatedAt}) — nothing written (last-good holds)`,
      },
      kv: { reads, writes },
    };
  }
  if (snapshot.readings.length === 0) {
    return {
      outcome: { ok: false, kind: 'empty', note: 'public projection carries no readings — nothing written' },
      kv: { reads, writes },
    };
  }

  const row = meterLiveRowOf(day, snapshot);
  const base: GoldMeterYearDoc =
    stored !== undefined
      ? stored
      : { v: 1, year, fetchedAt: now.toISOString(), rows: [] };
  if (base.year !== year) {
    return {
      outcome: { ok: false, kind: 'format-changed', note: `stored shard ${base.year} does not match the day ${day}` },
      kv: { reads, writes },
    };
  }
  const { doc, changed } = upsertMeterRow(base, row, now.toISOString());
  if (!changed) {
    return { outcome: { ok: true, note: `no change (${day} — identical live row)` }, kv: { reads, writes } };
  }
  await store.putYear(doc);
  writes++;
  return { outcome: { ok: true, note: `wrote ${day} (live row, ${doc.rows.length} rows in shard ${year})` }, kv: { reads, writes } };
}
