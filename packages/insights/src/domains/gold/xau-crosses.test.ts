/**
 * xau-crosses.test.ts — GPE R26 / F10: the multi-currency grid's pure
 * derivations + store/job tests — the derivation arithmetic (multiply /
 * divide, inner-join), the merge (revisions win), the decile-over-stored-
 * basis posture, the KGX verdict kinds, the wire round-trip, and the
 * job's every branch (waiting on gold-xau, bootstrap, quiet day, the
 * S13-D3 final-bars-only guard riding the shared parse).
 */

import { describe, expect, it } from 'vitest';
import type { GoldXauOhlcSnapshot, GoldXauCandle, GoldCrossId, GoldCrossPoint } from '@currena/core';
import { GoldXauCrossesSnapshotSchema } from '@currena/core';
import {
  CROSS_DECILE_MIN_BASE,
  CROSS_LEGS,
  GOLD_CROSS_IDS,
  GOLD_XAU_CROSSES_KV_KEY,
  KvGoldCrossesStore,
  buildCrossesSnapshot,
  crossStats,
  deriveCrossSeries,
  kgxVerdict,
  mergeSeries,
  runGoldXauCrossesIngest,
  type GoldCrossesKv,
} from './xau-crosses';
import type { GoldXauStore } from './xau-ohlc';

/* ------------------------- fixtures ------------------------- */

/** A weekday-only XAUUSD series (the gold-xau key's shape). */
function synthGold(n: number, firstDate: string, closeAt: (i: number) => number): GoldXauCandle[] {
  const out: GoldXauCandle[] = [];
  let ms = Date.parse(`${firstDate}T00:00:00Z`);
  for (let i = 0; i < n; ) {
    const weekday = new Date(ms).getUTCDay();
    if (weekday !== 6 && weekday !== 0) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const close = closeAt(i);
      out.push({ date, open: close, high: close, low: close, close });
      i += 1;
    }
    ms += 86_400_000;
  }
  return out;
}

const GOLD_XAU_SERIES = synthGold(80, '2026-07-20', (i) => 3_000 + i * 10);
const GOLD_XAU: GoldXauOhlcSnapshot = {
  v: 1,
  asOf: GOLD_XAU_SERIES[GOLD_XAU_SERIES.length - 1]!.date,
  fetchedAt: '2026-11-19T04:35:00Z',
  series: GOLD_XAU_SERIES,
  sourceUrl: 'https://eodhd.com/api/eod/XAUUSD.FOREX',
};

/** An EODHD EOD-row fetchImpl keyed by symbol → {date, close} rows. */
function eodhdFetchOver(
  map: Record<string, Array<{ date: string; close: number }>>,
): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const code = url.pathname.split('/').pop() ?? '';
    const rows = map[code];
    if (rows === undefined) return new Response('[]', { status: 200 });
    return new Response(
      JSON.stringify(
        rows.map((r) => ({ date: r.date, open: r.close, high: r.close, low: r.close, close: r.close, adjusted_close: r.close, volume: 0 })),
      ),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
}

function weekdayDates(n: number, firstDate: string): string[] {
  return synthGold(n, firstDate, () => 1).map((c) => c.date);
}

function memoryKv(): GoldCrossesKv & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    async get(key) {
      return map.get(key) ?? null;
    },
    async put(key, value) {
      map.set(key, value);
    },
  };
}

/** A gold-xau reader over a fixed snapshot (the job's second key). */
const goldXauReader = (snapshot: GoldXauOhlcSnapshot | undefined): GoldXauStore => ({
  async getGoldXau() {
    return snapshot;
  },
  async writeGoldXau() {
    throw new Error('unexpected write');
  },
});

/* ------------------------- the pure derivations ------------------------- */

describe('deriveCrossSeries', () => {
  const gold: GoldXauCandle[] = [
    { date: '2026-11-16', open: 1, high: 1, low: 1, close: 2_000 },
    { date: '2026-11-17', open: 1, high: 1, low: 1, close: 2_100 },
    { date: '2026-11-18', open: 1, high: 1, low: 1, close: 2_200 },
  ];

  it('multiplies (XAUJPY = XAUUSD × USDJPY), inner-joined on common dates', () => {
    const fx = [
      { date: '2026-11-16', close: 150 },
      { date: '2026-11-18', close: 160 }, // the 17th missing — the join skips it, never invents
    ];
    const out = deriveCrossSeries(gold, fx, 'multiply');
    expect(out).toEqual([
      { date: '2026-11-16', close: 300_000 },
      { date: '2026-11-18', close: 352_000 },
    ]);
  });

  it('divides (XAUGBP = XAUUSD ÷ GBPUSD)', () => {
    const fx = [
      { date: '2026-11-16', close: 1.25 },
      { date: '2026-11-17', close: 1.25 },
      { date: '2026-11-18', close: 1.25 },
    ];
    const out = deriveCrossSeries(gold, fx, 'divide');
    expect(out.map((p) => p.close)).toEqual([1_600, 1_680, 1_760]);
  });
});

describe('mergeSeries', () => {
  it('the union by date, the FETCH winning on shared dates (revisions win)', () => {
    const stored: GoldCrossPoint[] = [
      { date: '2026-11-16', close: 100 },
      { date: '2026-11-17', close: 101 },
    ];
    const fetched: GoldCrossPoint[] = [
      { date: '2026-11-17', close: 999 }, // a genuine revision
      { date: '2026-11-18', close: 103 },
    ];
    expect(mergeSeries(stored, fetched)).toEqual([
      { date: '2026-11-16', close: 100 },
      { date: '2026-11-17', close: 999 },
      { date: '2026-11-18', close: 103 },
    ]);
  });
});

describe('crossStats (the decile over the stored basis)', () => {
  it('the 30-day change, the decile (current point excluded), the named basis', () => {
    // 60 weekday points from 2026-08-03; closes 100..159 rising.
    const dates = weekdayDates(60, '2026-08-03');
    const series: GoldCrossPoint[] = dates.map((d, i) => ({ date: d, close: 100 + i }));
    const stats = crossStats('eur', series)!;
    expect(stats.last).toBe(159);
    // The engine's reference: the last point at/before (last − 30 days).
    const cutoff = Date.parse(`${dates[dates.length - 1]!}T00:00:00Z`) - 30 * 86_400_000;
    const ref = series.filter((p) => Date.parse(`${p.date}T00:00:00Z`) <= cutoff).pop()!;
    expect(stats.change30d).toBeCloseTo(((159 - ref.close) / ref.close) * 100, 9);
    // A strictly-rising series: the last close is above every base point
    // → decile 1.0 (the base EXCLUDES the current point).
    expect(stats.decile).toBe(1);
    expect(stats.basis!.points).toBe(59);
    expect(stats.basis!.from).toBe(series[0]!.date);
    expect(stats.basis!.to).toBe(series[series.length - 2]!.date);
  });

  it('a short basis carries no decile (fail-closed, the R19 posture)', () => {
    const series: GoldCrossPoint[] = weekdayDates(20, '2026-10-05').map((d, i) => ({ date: d, close: 100 + i }));
    const stats = crossStats('jpy', series)!;
    expect(stats.decile).toBeNull();
    expect(stats.basis).toBeNull();
    expect(CROSS_DECILE_MIN_BASE).toBe(30);
  });
});

describe('kgxVerdict (the validation sentence\'s inputs)', () => {
  const changes = (vals: Array<number | null>) =>
    vals.map((v, i) => ({ id: GOLD_CROSS_IDS[i]!, change30d: v }));

  it('USD up + every cross up = genuine demand', () => {
    expect(kgxVerdict(2.5, changes([1, 2, 3, 4, 5]))!.kind).toBe('genuine-demand');
  });
  it('USD up + every cross down = the dollar story', () => {
    expect(kgxVerdict(2.5, changes([-1, -2, -3, -4, -5]))!.kind).toBe('dollar-story');
  });
  it('USD down + every cross up = dollar weakness', () => {
    expect(kgxVerdict(-2.5, changes([1, 2, 3, 4, 5]))!.kind).toBe('dollar-weakness');
  });
  it('anything split = mixed; unknown windows = null (never a guess)', () => {
    expect(kgxVerdict(2.5, changes([1, -2, 3, -4, 5]))!.kind).toBe('mixed');
    expect(kgxVerdict(null, changes([1, 2, 3, 4, 5]))).toBeNull();
    expect(kgxVerdict(1, changes([null, null, null, null, null]))).toBeNull();
  });
});

describe('buildCrossesSnapshot (the wire round-trip)', () => {
  it('all five crosses + the three FX legs round-trip through the schema', () => {
    const dates = weekdayDates(40, '2026-09-01');
    const seriesByld = new Map<GoldCrossId, GoldCrossPoint[]>(
      GOLD_CROSS_IDS.map((id) => [id, dates.map((d, i) => ({ date: d, close: 1_000 + i * (id === 'jpy' ? 100 : 1) }))] as const),
    );
    const fxLegs = CROSS_LEGS.filter((l) => l.kind === 'derived').map((l) => ({
      symbol: l.symbol,
      series: dates.map((d, i) => ({ date: d, close: 1 + i / 100 })),
    }));
    const snapshot = buildCrossesSnapshot(seriesByld, fxLegs, new Date('2026-11-19T04:35:00Z'));
    const wire = GoldXauCrossesSnapshotSchema.parse(JSON.parse(JSON.stringify(snapshot)));
    expect(wire.crosses.map((c) => c.id)).toEqual([...GOLD_CROSS_IDS]);
    expect(wire.fxLegs.map((l) => l.symbol)).toEqual(['USDJPY.FOREX', 'GBPUSD.FOREX', 'USDCNY.FOREX']);
    expect(wire.sourceUrls[0]).toBe('https://eodhd.com/api/eod/XAUEUR.FOREX');
  });
});

/* ------------------------- the job ------------------------- */

describe('runGoldXauCrossesIngest (the rung body)', () => {
  it('waits calmly when the gold-xau series is absent (the derived three need it)', async () => {
    const kv = memoryKv();
    const result = await runGoldXauCrossesIngest(new KvGoldCrossesStore(kv), {
      apiToken: 'tok',
      goldXau: goldXauReader(undefined),
      now: new Date('2026-11-19T04:35:00Z'),
      fetchImpl: eodhdFetchOver({}),
    });
    expect(result.outcome.ok).toBe(true);
    expect(result.outcome.note).toContain('waiting on the gold-xau series');
    expect(result.kv.writes).toBe(0);
    expect(kv.map.size).toBe(0);
  });

  it('the bootstrap: five legs fetched, three derived, one write', async () => {
    const kv = memoryKv();
    const dates = GOLD_XAU.series.map((c) => c.date);
    const legs: Record<string, Array<{ date: string; close: number }>> = {
      'XAUEUR.FOREX': dates.map((d, i) => ({ date: d, close: 3_400 + i })),
      'XAUAUD.FOREX': dates.map((d, i) => ({ date: d, close: 5_500 + i })),
      'USDJPY.FOREX': dates.map((d, i) => ({ date: d, close: 150 + i / 100 })),
      'GBPUSD.FOREX': dates.map((d, i) => ({ date: d, close: 1.3 - i / 10_000 })),
      'USDCNY.FOREX': dates.map((d, i) => ({ date: d, close: 6.7 + i / 1_000 })),
    };
    const result = await runGoldXauCrossesIngest(new KvGoldCrossesStore(kv), {
      apiToken: 'tok',
      goldXau: goldXauReader(GOLD_XAU),
      now: new Date('2026-11-19T04:35:00Z'),
      fetchImpl: eodhdFetchOver(legs),
    });
    expect(result.outcome.ok).toBe(true);
    expect(result.kv).toEqual({ reads: 2, writes: 1 });
    const snapshot = result.snapshot!;
    // The natives: their own fetched closes.
    const eur = snapshot.crosses.find((c) => c.id === 'eur')!;
    expect(eur.kind).toBe('native');
    expect(eur.series[eur.series.length - 1]!.close).toBe(3_400 + dates.length - 1);
    // The derived: XAUJPY = XAUUSD × USDJPY on the LAST common date.
    const jpy = snapshot.crosses.find((c) => c.id === 'jpy')!;
    const lastGold = GOLD_XAU.series[GOLD_XAU.series.length - 1]!;
    const lastUsdjpy = legs['USDJPY.FOREX']![legs['USDJPY.FOREX']!.length - 1]!;
    expect(jpy.kind).toBe('derived');
    expect(jpy.formula).toBe('XAUUSD.FOREX × USDJPY.FOREX');
    expect(jpy.series[jpy.series.length - 1]!.close).toBeCloseTo(lastGold.close * lastUsdjpy.close, 6);
    // The derived GBP: XAUUSD ÷ GBPUSD.
    const gbp = snapshot.crosses.find((c) => c.id === 'gbp')!;
    const lastGbpusd = legs['GBPUSD.FOREX']![legs['GBPUSD.FOREX']!.length - 1]!;
    expect(gbp.series[gbp.series.length - 1]!.close).toBeCloseTo(lastGold.close / lastGbpusd.close, 6);
    // The legs stored for the next run's merge.
    expect(snapshot.fxLegs.map((l) => l.symbol)).toEqual(['USDJPY.FOREX', 'GBPUSD.FOREX', 'USDCNY.FOREX']);
  });

  it('the S13-D3 guard: a row dated today never lands (the shared parse)', async () => {
    const kv = memoryKv();
    const dates = GOLD_XAU.series.map((c) => c.date);
    const withToday = [...dates, '2026-11-19']; // todayUtc in the job is 2026-11-19
    const rows = withToday.map((d, i) => ({ date: d, close: 3_400 + i }));
    const result = await runGoldXauCrossesIngest(new KvGoldCrossesStore(kv), {
      apiToken: 'tok',
      goldXau: goldXauReader(GOLD_XAU),
      now: new Date('2026-11-19T04:35:00Z'),
      fetchImpl: eodhdFetchOver({
        'XAUEUR.FOREX': rows,
        'XAUAUD.FOREX': rows,
        'USDJPY.FOREX': rows.map((r) => ({ ...r, close: 150 })),
        'GBPUSD.FOREX': rows.map((r) => ({ ...r, close: 1.3 })),
        'USDCNY.FOREX': rows.map((r) => ({ ...r, close: 6.7 })),
      }),
    });
    const eur = result.snapshot!.crosses.find((c) => c.id === 'eur')!;
    // Today's partial row never lands — the last stored bar is the
    // fixture's own last FINAL date.
    expect(eur.series[eur.series.length - 1]!.date).toBe(GOLD_XAU_SERIES[GOLD_XAU_SERIES.length - 1]!.date);
    expect(eur.series.some((p) => p.date === '2026-11-19')).toBe(false);
  });

  it('the quiet day: identical data → no write', async () => {
    const kv = memoryKv();
    const dates = GOLD_XAU.series.map((c) => c.date);
    const legs: Record<string, Array<{ date: string; close: number }>> = {
      'XAUEUR.FOREX': dates.map((d, i) => ({ date: d, close: 3_400 + i })),
      'XAUAUD.FOREX': dates.map((d, i) => ({ date: d, close: 5_500 + i })),
      'USDJPY.FOREX': dates.map((d) => ({ date: d, close: 150 })),
      'GBPUSD.FOREX': dates.map((d) => ({ date: d, close: 1.3 })),
      'USDCNY.FOREX': dates.map((d) => ({ date: d, close: 6.7 })),
    };
    const store = new KvGoldCrossesStore(kv);
    await runGoldXauCrossesIngest(store, {
      apiToken: 'tok',
      goldXau: goldXauReader(GOLD_XAU),
      now: new Date('2026-11-19T04:35:00Z'),
      fetchImpl: eodhdFetchOver(legs),
    });
    const again = await runGoldXauCrossesIngest(store, {
      apiToken: 'tok',
      goldXau: goldXauReader(GOLD_XAU),
      now: new Date('2026-11-19T10:10:00Z'),
      fetchImpl: eodhdFetchOver(legs),
    });
    expect(again.outcome.ok).toBe(true);
    expect(again.kv.writes).toBe(0);
    expect(again.outcome.note).toContain('no change');
  });

  it('a leg failure fails the rung honestly (nothing written)', async () => {
    const kv = memoryKv();
    const result = await runGoldXauCrossesIngest(new KvGoldCrossesStore(kv), {
      apiToken: 'tok',
      goldXau: goldXauReader(GOLD_XAU),
      now: new Date('2026-11-19T04:35:00Z'),
      fetchImpl: (async () => new Response('boom', { status: 500 })) as typeof fetch,
    });
    expect(result.outcome).toMatchObject({ ok: false, kind: 'failed' });
    expect(kv.map.size).toBe(0);
  });

  it('the KV key is the one the route serves', () => {
    expect(GOLD_XAU_CROSSES_KV_KEY).toBe('insights:gold-xau-crosses:v1');
  });
});
