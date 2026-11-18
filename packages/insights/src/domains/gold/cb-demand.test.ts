/**
 * cb-demand.test.ts — GPE R14: the central-bank tracker's compute + job
 * tests, over the s12 fixtures (the trimmed live payloads of
 * 2026-11-18). The FROZEN expectations are the session's own derived
 * numbers (the M1 §5 record): the merge's RUS complement, the rolling
 * series' shape, the top-buyers cast (POL + CHN leading), and the job's
 * idempotence + failure taxonomy.
 */

import { describe, expect, it } from 'vitest';
import { GoldCbSnapshotSchema } from '@currena/core';
import ilVolume from '../../../fixtures/s12/il-volume-2026-11-18.json';
import irfclVolume from '../../../fixtures/s12/irfcl-volume-2026-11-18.json';
import irfclGoldUsd from '../../../fixtures/s12/irfcl-gold-usd-2026-11-18.json';
import irfclTotalUsd from '../../../fixtures/s12/irfcl-total-usd-2026-11-18.json';
import { parseCbLatestValue, parseCbVolume } from './adapters/imf-reserves';
import {
  CB_TOP_BUYERS,
  buildGoldCbSnapshot,
  cbMatchedDeltas,
  cbReportedWorld,
  cbRollingSeries,
  cbTopBuyers,
  cbWorldMonthly,
  goldCbDayGate,
  mergeCbVolume,
  parseStoredGoldCb,
  runGoldCbIngest,
  GOLD_CB_KV_KEY,
  type GoldCbStore,
} from './cb-demand';

const NOW = new Date('2026-11-18T17:00:00Z');

function fixtureRaw(): { ilVolume: unknown; irfclVolume: unknown; irfclGoldUsd: unknown; irfclTotalUsd: unknown } {
  return { ilVolume, irfclVolume, irfclGoldUsd, irfclTotalUsd };
}

function compute() {
  const il = parseCbVolume(ilVolume);
  const irfcl = parseCbVolume(irfclVolume);
  const merged = mergeCbVolume(il, irfcl);
  const deltas = cbMatchedDeltas(merged);
  const world = cbWorldMonthly(deltas);
  return { il, irfcl, merged, deltas, world };
}

describe('the compute pipeline (the s12 fixtures)', () => {
  it('the merge: IRFCL complements RUS past IL\'s last month (fresher wins)', () => {
    const { merged } = compute();
    const rus = [...merged.get('RUS')!.keys()].sort();
    expect(rus.at(-1)).toBe('2026-09');
    expect(merged.get('RUS')!.get('2026-09')).toBe(72_800_000);
    // USA stays on IL's own prints (the primary leg — identical values anyway).
    expect(merged.get('USA')!.get('2026-09')).toBeCloseTo(261_498_926.24, 2);
  });

  it('the rolling series: monthly, ascending, 20-year window discipline', () => {
    const { world } = compute();
    const series = cbRollingSeries(world);
    expect(series.length).toBeGreaterThanOrEqual(24);
    for (let i = 1; i < series.length; i++) {
      expect(series[i]!.month > series[i - 1]!.month).toBe(true);
    }
    // The fixture's window (2023-11+) yields its first 12-month window at 2024-10.
    expect(series[0]!.month).toBe('2024-10');
    expect(series.at(-1)!.month).toBe('2026-10');
  });

  it('the top buyers: the fixture\'s cast, sorted by the trailing-12m sum', () => {
    const { merged, deltas, world } = compute();
    const goldUsd = parseCbLatestValue(irfclGoldUsd);
    const totalUsd = parseCbLatestValue(irfclTotalUsd);
    const asOf = [...world.keys()].sort().at(-1)!;
    const buyers = cbTopBuyers(deltas, merged, goldUsd, totalUsd, asOf);
    expect(buyers.length).toBe(CB_TOP_BUYERS);
    expect(buyers[0]!.code).toBe('POL');
    expect(buyers[0]!.sum12m).toBeCloseTo(159.088, 1);
    expect(buyers[0]!.latestMonth).toBe('2026-10');
    expect(buyers[0]!.latestDelta).toBeCloseTo(17.107, 1);
    expect(buyers[0]!.tonnes).toBeCloseTo(690.0, 0);
    expect(buyers[0]!.goldUsd).toBe(90_676_462_000);
    expect(buyers[0]!.valuePeriod).toBe('2026-09');
    expect(buyers[1]!.code).toBe('CHN');
    expect(buyers[1]!.sum12m).toBeCloseTo(130.946, 1);
    // descending by construction
    for (let i = 1; i < buyers.length; i++) {
      expect(buyers[i - 1]!.sum12m).toBeGreaterThanOrEqual(buyers[i]!.sum12m);
    }
  });

  it('the reported world: the 3-month stock, labelled as the reported world', () => {
    const { merged, world } = compute();
    const asOf = [...world.keys()].sort().at(-1)!;
    const rw = cbReportedWorld(merged, asOf);
    expect(rw.month).toBe('2026-10');
    expect(rw.reporters).toBe(87);
    expect(rw.tonnes).toBeCloseTo(33_070, -1);
  });

  it('the built snapshot validates against the wire contract', () => {
    const snapshot = buildGoldCbSnapshot(fixtureRaw(), NOW);
    expect(() => GoldCbSnapshotSchema.parse(snapshot)).not.toThrow();
    expect(snapshot.asOf).toBe('2026-10');
    expect(snapshot.series.at(-1)!.month).toBe('2026-10');
    expect(snapshot.sourceUrls.length).toBe(2);
  });
});

describe('the store + the job (the rung3 body)', () => {
  class MemoryKv implements GoldCbStore {
    stored: string | null = null;
    async getGoldCb() {
      return parseStoredGoldCb(this.stored);
    }
    async writeGoldCb(snapshot: import('@currena/core').GoldCbSnapshot) {
      this.stored = JSON.stringify(snapshot);
    }
  }

  it('fetches, builds, writes — and re-runs skip (the month idempotence)', async () => {
    const store = new MemoryKv();
    // The mock dispatches by URL — each dataflow answers with ITS payload.
    const fetchImpl = (async (url: unknown) => {
      const u = String(url);
      const body = u.includes('/IL/')
        ? ilVolume
        : u.endsWith('IRFCL56V_FTO.*') || u.includes('IRFCL56V_FTO')
          ? irfclVolume
          : u.includes('IRFCL56_USD')
            ? irfclGoldUsd
            : irfclTotalUsd;
      return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const first = await runGoldCbIngest(store, { fetchImpl, now: NOW });
    expect(first.outcome.ok).toBe(true);
    if (!first.outcome.ok) throw new Error(`unreachable: ${first.outcome.note}`);
    expect(first.outcome.note).toContain('asOf 2026-10');
    expect(first.kv).toEqual({ reads: 1, writes: 1 });
    // The second run the same month: the idempotence skip (no fetches fire).
    const second = await runGoldCbIngest(store, { fetchImpl, now: new Date('2026-11-19T04:30:00Z') });
    expect(second.outcome.ok).toBe(true);
    expect(second.kv.writes).toBe(0);
    if (!second.outcome.ok) throw new Error('unreachable');
    expect(second.outcome.note).toContain('already collected this month');
    // A new month fetches again.
    const third = await runGoldCbIngest(store, { fetchImpl, now: new Date('2026-12-01T04:30:00Z') });
    expect(third.outcome.ok).toBe(true);
    expect(third.kv.writes).toBe(1);
  });

  it('a failed fetch fails the whole job honestly (all four legs or none)', async () => {
    const store = new MemoryKv();
    const fetchImpl = (async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;
    const result = await runGoldCbIngest(store, { fetchImpl, now: NOW });
    expect(result.outcome.ok).toBe(false);
    if (result.outcome.ok) throw new Error('unreachable');
    expect(result.outcome.kind).toBe('failed');
    expect(result.outcome.note).toContain('boom');
    expect(store.stored).toBeNull();
  });

  it('the stored key round-trips through parseStoredGoldCb (poison fails to absent)', () => {
    expect(parseStoredGoldCb(null)).toBeUndefined();
    expect(parseStoredGoldCb('not json')).toBeUndefined();
    expect(parseStoredGoldCb('{}')).toBeUndefined();
    const snapshot = buildGoldCbSnapshot(fixtureRaw(), NOW);
    expect(parseStoredGoldCb(JSON.stringify(snapshot))?.asOf).toBe('2026-10');
    expect(GOLD_CB_KV_KEY).toBe('insights:gold-cb:v1');
  });

  it('the day gate fires on the 1st–5th only', () => {
    expect(goldCbDayGate(new Date('2026-11-01T04:30:00Z'))).toBe(true);
    expect(goldCbDayGate(new Date('2026-11-05T04:30:00Z'))).toBe(true);
    expect(goldCbDayGate(new Date('2026-11-06T04:30:00Z'))).toBe(false);
    expect(goldCbDayGate(new Date('2026-11-15T04:30:00Z'))).toBe(false);
  });
});
