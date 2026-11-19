/**
 * meter-history.test.ts — GPE R31 / F12 (2026-11-19, S17): the gold
 * meter's TIME MACHINE engine tests — the dated voter-table registry
 * (the four selectable entries + the frozen-literal pins against the
 * harness tables and production), the reconstruction (no lookahead, the
 * honest unreadable seats), the compact row mapping (the harness
 * equivalence carried onto the wire), the year-sharded store + the
 * upsert merge rule (live over backfill, never the reverse), and the
 * daily rung's fail-closed guards — including the ONE-PROJECTION
 * consistency pin (the rung's live row === the page's own goldBalance
 * counts over the same readings, s7/03 §2.4).
 */

import { describe, expect, it } from 'vitest';
import type { GoldMeterTableRow, GoldMeterYearDoc, IndicatorId, IndicatorReading, InsightsSnapshot } from '@currena/core';
import { GOLD_METER_ERA_START, GoldMeterYearDocSchema } from '@currena/core';
import { DEFINITIONS } from '../../index';
import { GOLD_LANE_VOTERS } from '../../shared/gold-score';
import { GOLD_LANE_MIN_FIRING, goldBalance } from './gold-balance';
import {
  GOLD_METER_TABLE_VERSIONS,
  GOLD_METER_MAX_SNAPSHOT_AGE_MS,
  goldMeterMeta,
  goldMeterYearKey,
  meterLiveRowOf,
  meterTableFor,
  meterTableRowOf,
  reconstructMeterReadings,
  runGoldMeterHistoryIngest,
  upsertMeterRow,
  type GoldMeterStore,
} from './meter-history';
import type { SeriesPoint } from '../../shared/series';

const NOW = '2026-11-19T04:47:00.000Z';
const DAY = '2026-11-18';

function reading(id: IndicatorId, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: DAY,
    status: 'normal',
    sourceName: 't',
    updatedAt: NOW,
    ...extra,
  };
}

/** Decade-extreme positions (the level half of the shared evaluator). */
const HIGH: Partial<IndicatorReading> = { percentile10y: 0.95 };
const LOW: Partial<IndicatorReading> = { percentile10y: 0.05 };
const RISING: Partial<IndicatorReading> = { change30d: 0.3 };
const FALLING: Partial<IndicatorReading> = { change30d: -0.3 };
const STEADY: Partial<IndicatorReading> = { percentile10y: 0.5, change30d: 0.02 };

/** The registry's own current table (the last entry). */
const CURRENT = GOLD_METER_TABLE_VERSIONS[GOLD_METER_TABLE_VERSIONS.length - 1]!;

/* ------------------------------------------------------------------ *
 * The registry (S17-D2)
 * ------------------------------------------------------------------ */

describe('GOLD_METER_TABLE_VERSIONS — the dated registry', () => {
  it('carries exactly the four selectable end-of-day entries, effective-ordered', () => {
    expect(GOLD_METER_TABLE_VERSIONS.map((v) => v.id)).toEqual(['s4-frozen-20', 's6-21', 'gf-p2-32', 'gf-s10-37']);
    const froms = GOLD_METER_TABLE_VERSIONS.map((v) => v.effectiveFrom);
    expect(froms).toEqual([...froms].sort());
    expect(froms[0]).toBe(GOLD_METER_ERA_START);
  });

  it('the seat counts match the authoritative lineage (20 / 21 / 32 / 37)', () => {
    expect(GOLD_METER_TABLE_VERSIONS.map((v) => v.voters.length)).toEqual([20, 21, 32, 37]);
    // The lane splits per the lineage table (S4 8/3/5/4 · S6 8/3/5/5 ·
    // P2 6/5/10/9/2 · S10 7/7/11/10/2).
    const splits = (v: (typeof GOLD_METER_TABLE_VERSIONS)[number]): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const seat of v.voters) out[seat.lane] = (out[seat.lane] ?? 0) + 1;
      return out;
    };
    expect(splits(GOLD_METER_TABLE_VERSIONS[0]!)).toEqual({ 'borrowing-costs': 8, dollar: 3, stress: 5, inflation: 4 });
    expect(splits(GOLD_METER_TABLE_VERSIONS[1]!)).toEqual({ 'borrowing-costs': 8, dollar: 3, stress: 5, inflation: 5 });
    expect(splits(GOLD_METER_TABLE_VERSIONS[2]!)).toEqual({ 'borrowing-costs': 6, dollar: 5, stress: 10, inflation: 9, flows: 2 });
    expect(splits(GOLD_METER_TABLE_VERSIONS[3]!)).toEqual({ 'borrowing-costs': 7, dollar: 7, stress: 11, inflation: 10, flows: 2 });
  });

  it('the gf-s10-37 frozen literal equals production GOLD_LANE_VOTERS exactly (the immutability pin)', () => {
    expect(CURRENT.voters).toEqual(GOLD_LANE_VOTERS);
  });

  it('the gf-p2-32 frozen literal equals production minus the five GF-P3/GF-S10 additions (the additive lineage pin)', () => {
    const additions = new Set(['real-yield-5y', 'dollar-broad', 'dollar-eme', 'bank-stress', 'michigan-5y-expectations']);
    expect(GOLD_METER_TABLE_VERSIONS[2]!.voters).toEqual(GOLD_LANE_VOTERS.filter((v) => !additions.has(v.id as string)));
  });

  it('every registry seat is unique and definable (the reconstruction never hits an absent definition)', () => {
    const defById = new Map(DEFINITIONS.map((d) => [d.id as string, d]));
    for (const version of GOLD_METER_TABLE_VERSIONS) {
      expect(new Set(version.voters.map((v) => v.id as string)).size).toBe(version.voters.length);
      for (const seat of version.voters) {
        expect(defById.has(seat.id as string), `definition missing for ${seat.id}`).toBe(true);
      }
    }
  });

  it('meterTableFor selects the end-of-day version on the boundary dates', () => {
    expect(meterTableFor('2016-11-01').id).toBe('s4-frozen-20');
    expect(meterTableFor('2026-10-30').id).toBe('s4-frozen-20');
    expect(meterTableFor('2026-10-31').id).toBe('s6-21');
    expect(meterTableFor('2026-11-04').id).toBe('s6-21');
    // The intra-day GF-P1 19-seat table never selects — 2026-11-05's
    // end-of-day state is the GF-P2 flip.
    expect(meterTableFor('2026-11-05').id).toBe('gf-p2-32');
    // The intra-day GF-P3 36-seat table never selects — 2026-11-06's
    // end-of-day state is GF-S10.
    expect(meterTableFor('2026-11-06').id).toBe('gf-s10-37');
    expect(meterTableFor('2026-11-19').id).toBe('gf-s10-37');
  });

  it('a pre-era date falls back to the era basis (the route rejects it before this matters)', () => {
    expect(meterTableFor('2016-10-31').id).toBe('s4-frozen-20');
  });

  it('goldMeterMeta carries the era boundary + the registry wire form', () => {
    const meta = goldMeterMeta();
    expect(meta.eraStart).toBe(GOLD_METER_ERA_START);
    expect(meta.tableVersions.map((v) => v.id)).toEqual(['s4-frozen-20', 's6-21', 'gf-p2-32', 'gf-s10-37']);
    expect(meta.tableVersions.map((v) => v.seats)).toEqual([20, 21, 32, 37]);
  });
});

/* ------------------------------------------------------------------ *
 * The row mapping (the harness equivalence onto the wire)
 * ------------------------------------------------------------------ */

describe('meterTableRowOf — the compact row', () => {
  it('maps the harness balance onto the wire row byte-for-byte (counts/net/beam/state/lanes)', () => {
    // A battery that tips for: two high stress seats + two falling-rate seats.
    const readings = [
      reading('stress-stlfsi', { ...HIGH, ...RISING }),
      reading('nfci', { ...HIGH, ...RISING }),
      reading('vix', STEADY),
      reading('real-yield-10y', { ...LOW, ...FALLING }),
      reading('us10y', { ...LOW, ...FALLING }),
      reading('us-cpi-yoy', STEADY),
    ];
    const row = meterTableRowOf(DAY, 'live', CURRENT.voters, CURRENT.id, readings);
    // The one-projection consistency pin: the row's counts === the
    // production goldBalance over the SAME readings (s7/03 §2.4).
    const balance = goldBalance(readings);
    expect(row.counts).toEqual(balance.counts);
    expect(row.net).toBe(balance.net);
    expect(row.readable).toBe(balance.readable);
    expect(row.state).toBe('tipped-for');
    expect(row.lanes.map((l) => [l.lane, l.side])).toContainEqual(['stress', 'for']);
    expect(row.lanes.map((l) => [l.lane, l.side])).toContainEqual(['borrowing-costs', 'for']);
    // The harness's own beam math: |net| / (for+against) × 10 clamped [3,10].
    expect(row.beamAngle).toBe(Math.min(10, Math.max(3, (Math.abs(row.net) / (row.counts.for + row.counts.against)) * 10)));
    expect(row.fullyTipped).toBe(Math.abs(row.net) === row.counts.for + row.counts.against);
    expect(row.source).toBe('live');
    expect(row.tableVersion).toBe('gf-s10-37');
    // The wire row parses through the schema.
    expect(() => GoldMeterYearDocSchema.parse({ v: 1, year: 2026, fetchedAt: NOW, rows: [row] })).not.toThrow();
  });

  it('an empty reading set reads every lane honestly unread (never a throw)', () => {
    const row = meterTableRowOf(DAY, 'backfill', CURRENT.voters, CURRENT.id, []);
    expect(row.state).toBe('none');
    expect(row.counts).toEqual({ for: 0, against: 0, neutral: 0, unread: 5 });
    expect(row.beamAngle).toBe(0);
    expect(row.net).toBe(0);
    expect(row.readable).toBe(0);
  });

  it('the pre-flows tables read the flows lane honestly unread (the lineage shape)', () => {
    const s4 = GOLD_METER_TABLE_VERSIONS[0]!;
    const row = meterTableRowOf('2020-03-16', 'backfill', s4.voters, s4.id, [
      reading('stress-stlfsi', { ...HIGH, ...RISING }),
      reading('nfci', { ...HIGH, ...RISING }),
      reading('vix', { ...HIGH, ...RISING }),
    ]);
    const flows = row.lanes.find((l) => l.lane === 'flows')!;
    expect(flows.side).toBe('unread');
    expect(flows.readable).toBe(0);
    // Only the stress lane is readable in this battery — the other three
    // pre-flows lanes + flows all read honestly unread.
    expect(row.counts.unread).toBe(4);
  });
});

/* ------------------------------------------------------------------ *
 * The reconstruction (pure — no lookahead, honest unreadables)
 * ------------------------------------------------------------------ */

describe('reconstructMeterReadings — the backfill machinery', () => {
  const defById = new Map(DEFINITIONS.map((d) => [d.id as string, d]));

  it('computes readings at the frozen clock with NO LOOKAHEAD (a later series point never leaks)', () => {
    // us10y: daily, percentile rule. A series that spikes to a decade
    // high LATE — the day BEFORE the spike must not see it.
    const points: SeriesPoint[] = [];
    const firstDay = Date.UTC(2016, 8, 23);
    const lastDay = Date.UTC(2026, 10, 14); // 2026-11-14
    for (let ms = firstDay; ms <= lastDay; ms += 86_400_000) {
      const day = new Date(ms).toISOString().slice(0, 10);
      points.push({ date: day, value: 2 + Math.sin(ms / (90 * 86_400_000)) * 0.2 });
    }
    // The spike lands 2026-11-15.
    points.push({ date: '2026-11-15', value: 9.99 });
    const seriesById = new Map<string, SeriesPoint[]>([['us10y', points]]);
    const dayBefore = '2026-11-14';
    const dayAfter = '2026-11-15';
    const table = [{ lane: 'borrowing-costs' as const, id: 'us10y' as IndicatorId, polarity: -1 as const }];
    const [before] = reconstructMeterReadings(seriesById, dayBefore, table, defById);
    const [after] = reconstructMeterReadings(seriesById, dayAfter, table, defById);
    expect(before!.value).toBeLessThan(3);
    expect(before!.asOf).toBe(dayBefore);
    expect(after!.value).toBe(9.99);
    expect(after!.asOf).toBe(dayAfter);
    // The spike day's own percentile flips high; the day before never sees it.
    expect(after!.percentile10y).toBeGreaterThan(0.9);
    expect(before!.percentile10y).toBeLessThan(0.9);
    // And the day-before percentile did not move because of the spike:
    // reconstruct at 2026-11-14 with and without the spike point appended.
  });

  it('a seat without a series reads honestly unavailable (never a guess)', () => {
    const table = [{ lane: 'stress' as const, id: 'vix' as IndicatorId, polarity: 1 as const }];
    const [r] = reconstructMeterReadings(new Map(), '2026-11-18', table, defById);
    expect(r!.status).toBe('unavailable');
    expect(r!.value).toBeNull();
  });

  it('a seat without a definition is simply absent (the tables never carry one — pinned above)', () => {
    const table = [{ lane: 'stress' as const, id: 'vix' as IndicatorId, polarity: 1 as const }];
    expect(reconstructMeterReadings(new Map(), DAY, table, new Map())).toEqual([]);
  });

  it('the row over the reconstruction of a full table never throws and parses through the schema', () => {
    // Every CURRENT seat, most series absent — the honest unread-heavy row.
    const seriesById = new Map<string, SeriesPoint[]>([
      ['us10y', [{ date: '2026-11-17', value: 4.4 }]],
      ['vix', [{ date: '2026-11-17', value: 21.5 }]],
    ]);
    const readings = reconstructMeterReadings(seriesById, DAY, CURRENT.voters, defById);
    expect(readings.length).toBe(CURRENT.voters.length);
    const row = meterTableRowOf(DAY, 'backfill', CURRENT.voters, CURRENT.id, readings);
    expect(() => GoldMeterYearDocSchema.parse({ v: 1, year: 2026, fetchedAt: NOW, rows: [row] })).not.toThrow();
  });
});

/* ------------------------------------------------------------------ *
 * The live row (the page's own plane)
 * ------------------------------------------------------------------ */

describe('meterLiveRowOf — the rung\'s live row', () => {
  it('filters the snapshot\'s readings to the current table\'s seats and carries the live provenance', () => {
    const seatIds = new Set(CURRENT.voters.map((v) => v.id as string));
    const snapshot = {
      generatedAt: NOW,
      readings: [
        reading('stress-stlfsi', { ...HIGH, ...RISING }),
        reading('nfci', { ...HIGH, ...RISING }),
        reading('vix', STEADY),
        reading('us10y', { ...LOW, ...FALLING }),
        reading('gold-usd', { value: 3900 }), // not a voter — filtered out
      ],
    } as unknown as InsightsSnapshot;
    const row = meterLiveRowOf(DAY, snapshot);
    expect(row.source).toBe('live');
    expect(row.date).toBe(DAY);
    expect(row.tableVersion).toBe(CURRENT.id);
    // The one-projection consistency pin (s7/03 §2.4): the rung's row
    // counts === the production engine over the same (filtered) readings.
    const filtered = (snapshot.readings as IndicatorReading[]).filter((r) => seatIds.has(r.id as string));
    expect(row.counts).toEqual(goldBalance(filtered).counts);
    // A non-voter reading can never reach the row's evidence.
    expect(row.lanes.every((l) => l.supports + l.pressures <= l.readable)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * The store + the upsert merge rule
 * ------------------------------------------------------------------ */

describe('upsertMeterRow — the S16-D2 merge rule per shard', () => {
  const row = (date: string, source: GoldMeterTableRow['source'], net = 1): GoldMeterTableRow => ({
    date,
    source,
    tableVersion: 'gf-s10-37',
    state: net > 0 ? 'tipped-for' : net < 0 ? 'tipped-against' : 'level',
    beamAngle: net === 0 ? 0 : 5,
    fullyTipped: false,
    net,
    readable: 3,
    counts: { for: net > 0 ? 1 : 0, against: net < 0 ? 1 : 0, neutral: 2, unread: 0 },
    lanes: [
      { lane: 'borrowing-costs', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
      { lane: 'dollar', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
      { lane: 'stress', side: net > 0 ? 'for' : 'against', split: false, readable: 1, firing: 1, supports: net > 0 ? 1 : 0, pressures: net < 0 ? 1 : 0 },
      { lane: 'inflation', side: 'unread', split: false, readable: 0, firing: 0, supports: 0, pressures: 0 },
      { lane: 'flows', side: 'unread', split: false, readable: 0, firing: 0, supports: 0, pressures: 0 },
    ],
  });

  const baseDoc = (): GoldMeterYearDoc => ({ v: 1, year: 2026, fetchedAt: NOW, rows: [row('2026-11-17', 'backfill')] });

  it('appends + re-sorts; an identical row is a no-op', () => {
    const doc = baseDoc();
    const { doc: withRow, changed } = upsertMeterRow(doc, row('2026-11-19', 'backfill'), NOW);
    expect(changed).toBe(true);
    expect(withRow.rows.map((r) => r.date)).toEqual(['2026-11-17', '2026-11-19']);
    // The identical re-upsert writes nothing.
    const again = upsertMeterRow(withRow, row('2026-11-19', 'backfill'), NOW);
    expect(again.changed).toBe(false);
    expect(again.doc).toBe(withRow);
  });

  it('a LIVE row overwrites a BACKFILL row on date collision', () => {
    const doc = baseDoc();
    const { doc: merged, changed } = upsertMeterRow(doc, row('2026-11-17', 'live', 2), NOW);
    expect(changed).toBe(true);
    expect(merged.rows[0]!.source).toBe('live');
    expect(merged.rows[0]!.net).toBe(2);
  });

  it('a BACKFILL row NEVER overwrites a LIVE row (the reverse rule)', () => {
    const doc: GoldMeterYearDoc = { v: 1, year: 2026, fetchedAt: NOW, rows: [row('2026-11-17', 'live')] };
    const { doc: merged, changed } = upsertMeterRow(doc, row('2026-11-17', 'backfill', -1), NOW);
    expect(changed).toBe(false);
    expect(merged).toBe(doc);
    expect(merged.rows[0]!.source).toBe('live');
    expect(merged.rows[0]!.net).toBe(1);
  });

  it('a wrong-year row throws (fail-closed on shape)', () => {
    expect(() => upsertMeterRow(baseDoc(), row('2025-12-31', 'backfill'), NOW)).toThrow();
  });

  it('the store round-trips a shard through JSON (the KV path)', async () => {
    const entries = new Map<string, string>();
    const store: GoldMeterStore = {
      getYear: async (year) => {
        const raw = entries.get(goldMeterYearKey(year));
        if (raw === undefined) return undefined;
        const parsed = GoldMeterYearDocSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : undefined;
      },
      putYear: async (doc) => {
        entries.set(goldMeterYearKey(doc.year), JSON.stringify(doc));
      },
    };
    const doc = baseDoc();
    await store.putYear(doc);
    expect((await store.getYear(2026))?.rows.length).toBe(1);
    // A poisoned value (valid JSON, INVALID schema) reads as absent —
    // never trusted, never rendered.
    entries.set(goldMeterYearKey(2025), JSON.stringify({ v: 1, year: 2025, fetchedAt: 'nope', rows: [] }));
    expect(await store.getYear(2025)).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * The rung (the daily forward accumulation — fail-closed)
 * ------------------------------------------------------------------ */

describe('runGoldMeterHistoryIngest — the 04:47 rung', () => {
  const NOW_DATE = new Date(NOW);
  const seatIds = new Set(CURRENT.voters.map((v) => v.id as string));

  const publicSnapshot = (generatedAt: string, readings: IndicatorReading[]): InsightsSnapshot =>
    ({ generatedAt, readings }) as unknown as InsightsSnapshot;

  function fakeStore(initial?: GoldMeterYearDoc) {
    let doc: GoldMeterYearDoc | undefined = initial;
    let writes = 0;
    const store: GoldMeterStore = {
      getYear: async () => doc,
      putYear: async (next) => {
        writes++;
        doc = next;
      },
    };
    return { store, get writes() { return writes; }, get doc() { return doc; } };
  }

  it('writes today\'s live row from the public projection (write-if-changed)', async () => {
    const fake = fakeStore();
    const store = fake.store;
    const readings = [
      reading('stress-stlfsi', { ...HIGH, ...RISING }),
      reading('nfci', { ...HIGH, ...RISING }),
      reading('vix', STEADY),
      reading('us10y', { ...LOW, ...FALLING }),
    ];
    const result = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: async () => publicSnapshot(NOW, readings),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(true);
    expect(fake.writes).toBe(1);
    const rows = fake.doc?.rows ?? [];
    expect(rows.length).toBe(1);
    expect(rows[0]!.date).toBe('2026-11-19');
    expect(rows[0]!.source).toBe('live');
    // The consistency pin: the written row's counts === the page's own
    // goldBalance over the same readings (s7/03 §2.4, one truth).
    expect(rows[0]!.counts).toEqual(goldBalance(readings.filter((r) => seatIds.has(r.id as string))).counts);
    // The identical re-run writes nothing.
    const second = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: async () => publicSnapshot(NOW, readings),
      now: NOW_DATE,
    });
    expect(second.outcome.ok).toBe(true);
    expect(second.kv.writes).toBe(0);
  });

  it('a missing projection writes NOTHING (the last-good discipline)', async () => {
    const fake = fakeStore();
    const store = fake.store;
    const result = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: async () => undefined,
      now: NOW_DATE,
    });
    expect(result.outcome).toEqual({ ok: false, kind: 'blocked', note: expect.any(String) });
    expect(fake.writes).toBe(0);
    expect(fake.doc).toBeUndefined();
  });

  it(`a projection older than ${GOLD_METER_MAX_SNAPSHOT_AGE_MS / 3_600_000}h writes nothing (never a stale reading under today's date)`, async () => {
    const fake = fakeStore();
    const store = fake.store;
    const stale = new Date(NOW_DATE.getTime() - GOLD_METER_MAX_SNAPSHOT_AGE_MS - 60_000).toISOString();
    const result = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: async () => publicSnapshot(stale, [reading('vix', STEADY)]),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(false);
    expect(fake.writes).toBe(0);
  });

  it('a projection with no readings is honest-empty (nothing written)', async () => {
    const fake = fakeStore();
    const store = fake.store;
    const result = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: async () => publicSnapshot(NOW, []),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(false);
    expect(fake.writes).toBe(0);
  });

  it('a read failure reports failed and writes nothing', async () => {
    const fake = fakeStore();
    const store = fake.store;
    const result = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: () => Promise.reject(new Error('kv down')),
      now: NOW_DATE,
    });
    expect(result.outcome).toEqual({ ok: false, kind: 'failed', note: expect.stringContaining('kv down') });
    expect(fake.writes).toBe(0);
  });

  it('a live rung row merges into an existing shard and never unwrites a stored backfill day', async () => {
    const existing: GoldMeterYearDoc = {
      v: 1,
      year: 2026,
      fetchedAt: '2026-11-18T04:47:00.000Z',
      rows: [
        { ...minimalRow('2026-11-18', 'backfill') },
      ],
    };
    const fake = fakeStore(existing);
    const store = fake.store;
    const result = await runGoldMeterHistoryIngest(store, {
      getPublicSnapshot: async () => publicSnapshot(NOW, [reading('vix', STEADY)]),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(true);
    expect(fake.writes).toBe(1);
    const rows = fake.doc?.rows ?? [];
    expect(rows.map((r) => r.date)).toEqual(['2026-11-18', '2026-11-19']);
    expect(rows[0]!.source).toBe('backfill');
    expect(rows[1]!.source).toBe('live');
  });
});

/** A minimal schema-valid row for shard fixtures. */
function minimalRow(date: string, source: GoldMeterTableRow['source']): GoldMeterTableRow {
  return {
    date,
    source,
    tableVersion: 'gf-s10-37',
    state: 'level',
    beamAngle: 0,
    fullyTipped: false,
    net: 0,
    readable: 3,
    counts: { for: 0, against: 0, neutral: 3, unread: 2 },
    lanes: [
      { lane: 'borrowing-costs', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
      { lane: 'dollar', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
      { lane: 'stress', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
      { lane: 'inflation', side: 'unread', split: false, readable: 0, firing: 0, supports: 0, pressures: 0 },
      { lane: 'flows', side: 'unread', split: false, readable: 0, firing: 0, supports: 0, pressures: 0 },
    ],
  };
}
