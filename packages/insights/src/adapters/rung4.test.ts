/**
 * rung4.test.ts — gap-closure S3-M3.2 (2026-11-01): the fourth-rung
 * collection + the pure liquidity derivations. Fixtures: the two S3
 * bulk-group ZIPs recorded in M3.1 (fetched from the provider 2026-11-01,
 * saved verbatim — tests never hit live sites).
 */

import { describe, expect, it, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { InsightsSnapshot, IndicatorHistory, IndicatorId, InsightsStatus } from '@currena/core';
import { buildInsightsSnapshot } from './snapshot';
import { buildIndicatorSeries } from './derived';
import { DEFINITIONS } from '../definitions';
import { FRED_BULK_ALL_IDS, FRED_S3_ALL_IDS, FRED_S3_GROUPS } from './fred';
import {
  collectRung4Sources,
  deriveRung4IndicatorSeries,
  netLiquiditySeries,
  repoStressSeries,
  RRP_BN_TO_M,
  RUNG4_IDS,
  trimFutureDated,
} from './rung4';
import { RUNG2_IDS } from './rung2';
import { CARRY_FORWARD_IDS, historyPhaseIds, runInsightsRung4Phase } from '../ingest/run';
import type { InsightsStore } from '../store';
import type { SeriesPoint } from '../series';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');

/** The M3.1 ZIP captures (binary — served through an injectable fetch). */
const liquidityZip = new Uint8Array(readFileSync(join(fixtures, 's3', 'fred-s3-liquidity-group-2026-11-01.zip')));
const macroZip = new Uint8Array(readFileSync(join(fixtures, 's3', 'fred-s3-macro-group-2026-11-01.zip')));

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The S3 group registry discipline (the budget guards)
 * ------------------------------------------------------------------ */

describe('FRED_S3_GROUPS (the rung4 registry discipline)', () => {
  it('never touches the 04:10 main rung — no S3 id rides FRED_BULK_GROUPS', () => {
    // The main rung sits at ~47/50 subrequests; an S3 id inside its groups
    // would silently spend budget the free-tier table says does not exist.
    for (const id of FRED_S3_ALL_IDS) {
      expect(FRED_BULK_ALL_IDS, `S3 id ${id} must not ride the main bulk groups`).not.toContain(id);
    }
  });

  it('every group stays at ≤ 12 ids (the fredgraph ZIP truncation cap) with no duplicate ids', () => {
    for (const group of FRED_S3_GROUPS) {
      expect(group.seriesIds.length).toBeLessThanOrEqual(12);
    }
    expect(new Set(FRED_S3_ALL_IDS).size).toBe(FRED_S3_ALL_IDS.length);
  });

  it('carries exactly the S3-verified series (the M3.1 set, both groups)', () => {
    expect(FRED_S3_ALL_IDS).toEqual([
      'THREEFYTP10',
      'WTREGEN',
      'RRPONTSYD',
      'WRESBAL',
      'IORB',
      'CCSA',
      'GDPNOW',
      'GACDISA066MSFRBNY',
      'MEDCPIM158SFRBCLE',
      'STICKCPIM158SFRBATL',
      'MTSDS133FMS',
      'DRTSCILM',
    ]);
  });
});

/* ------------------------------------------------------------------ *
 * The pure derivations
 * ------------------------------------------------------------------ */

describe('trimFutureDated (IORB announced rows)', () => {
  const series: SeriesPoint[] = [
    { date: '2026-10-30', value: 3.9 },
    { date: '2026-11-01', value: 3.9 },
    { date: '2026-11-02', value: 3.9 },
  ];
  it('keeps today and the past, drops strictly-future rows', () => {
    expect(trimFutureDated(series, '2026-11-01').map((p) => p.date)).toEqual(['2026-10-30', '2026-11-01']);
    expect(trimFutureDated(series, '2026-10-31').map((p) => p.date)).toEqual(['2026-10-30']);
  });
  it('is a no-op when nothing is future-dated', () => {
    expect(trimFutureDated(series, '2026-11-05')).toEqual(series);
  });
});

describe('repoStressSeries (SOFR − IORB)', () => {
  it('inner-joins on common dates and quantizes to 4dp (the F4 discipline)', () => {
    const sofr: SeriesPoint[] = [
      { date: '2026-10-29', value: 4.03 },
      { date: '2026-10-30', value: 4.31 },
      { date: '2026-10-31', value: 4.05 }, // a Saturday SOFR never prints — synthetic
    ];
    const iorb: SeriesPoint[] = [
      { date: '2026-10-29', value: 3.9 },
      { date: '2026-10-30', value: 3.9 },
    ];
    // 4.31 − 3.90 = 0.4099999999999999 in IEEE — must read 0.41.
    expect(repoStressSeries(sofr, iorb)).toEqual([
      { date: '2026-10-29', value: 0.13 },
      { date: '2026-10-30', value: 0.41 },
    ]);
  });

  it('fails closed on no common dates (empty — never a partial join)', () => {
    const sofr: SeriesPoint[] = [{ date: '2026-10-30', value: 4.3 }];
    const iorb: SeriesPoint[] = [{ date: '2026-10-29', value: 3.9 }];
    expect(repoStressSeries(sofr, iorb)).toEqual([]);
  });
});

describe('netLiquiditySeries (WALCL − TGA − RRP×1000)', () => {
  it('converts the $B RRP leg to $M before subtracting, on the shared Wednesday dates', () => {
    const walcl: SeriesPoint[] = [
      { date: '2026-10-21', value: 6_800_000 },
      { date: '2026-10-28', value: 6_850_000 },
    ];
    const tga: SeriesPoint[] = [
      { date: '2026-10-21', value: 800_000 },
      { date: '2026-10-28', value: 999_727 },
    ];
    const rrp: SeriesPoint[] = [
      { date: '2026-10-21', value: 500 }, // $B
      { date: '2026-10-28', value: 4.375 }, // $B — the fixture's own latest
    ];
    // 2026-10-28: 6,850,000 − 999,727 − 4,375 = 5,845,898 $M.
    expect(netLiquiditySeries(walcl, tga, rrp)).toEqual([
      { date: '2026-10-21', value: 5_500_000 },
      { date: '2026-10-28', value: 5_845_898 },
    ]);
    expect(RRP_BN_TO_M).toBe(1000);
  });

  it('fails closed when the legs share no date (never a partial-liquidity number)', () => {
    const walcl: SeriesPoint[] = [{ date: '2026-10-28', value: 6_850_000 }];
    const tga: SeriesPoint[] = [{ date: '2026-10-21', value: 800_000 }];
    const rrp: SeriesPoint[] = [{ date: '2026-10-21', value: 500 }];
    // tga+rrp join on the 21st, walcl only on the 28th → no common date.
    expect(netLiquiditySeries(walcl, tga, rrp)).toEqual([]);
  });
});

describe('deriveRung4IndicatorSeries (the total derivation)', () => {
  const s3: Partial<Record<string, SeriesPoint[]>> = {
    THREEFYTP10: [{ date: '2026-10-23', value: 0.9358 }],
    WTREGEN: [{ date: '2026-10-28', value: 999_727 }],
    // RRP prints DAILY: its window includes the Wednesday join date (10-28)
    // AND its own fresher Friday print (10-30) — the net-liquidity join uses
    // the shared Wednesdays; the reverse-repo card reads the Friday tail.
    RRPONTSYD: [
      { date: '2026-10-28', value: 4.375 },
      { date: '2026-10-30', value: 4.4 },
    ],
    WRESBAL: [{ date: '2026-10-28', value: 2_893_770 }],
    IORB: [{ date: '2026-10-31', value: 3.9 }],
  };
  const sofr: SeriesPoint[] = [{ date: '2026-10-31', value: 3.95 }];
  const walcl: SeriesPoint[] = [{ date: '2026-10-28', value: 6_850_000 }];

  it('derives the four direct ids and both derived spreads when the legs are present', () => {
    const out = deriveRung4IndicatorSeries(s3, { sofr, walcl });
    expect(out['term-premium-10y']).toEqual(s3.THREEFYTP10);
    expect(out.tga).toEqual(s3.WTREGEN);
    expect(out['reverse-repo']).toEqual(s3.RRPONTSYD);
    expect(out['bank-reserves']).toEqual(s3.WRESBAL);
    // SOFR − IORB on the common date: 3.95 − 3.9 = 0.049999… → 0.05.
    expect(out['repo-stress']).toEqual([{ date: '2026-10-31', value: 0.05 }]);
    // WALCL − TGA − RRP×1000: 6,850,000 − 999,727 − 4,375 = 5,845,898.
    expect(out['net-liquidity']).toEqual([{ date: '2026-10-28', value: 5_845_898 }]);
  });

  it('omits a derived id whose leg is missing (fail closed — the reading carries)', () => {
    const noLegs = deriveRung4IndicatorSeries(s3, {});
    expect(noLegs['repo-stress']).toBeUndefined();
    expect(noLegs['net-liquidity']).toBeUndefined();
    expect(noLegs['term-premium-10y']).toBeDefined();
  });

  it('is total on absent S3 fetches (nothing derived, nothing thrown)', () => {
    expect(deriveRung4IndicatorSeries(undefined, { sofr, walcl })).toEqual({});
  });
});

/* ------------------------------------------------------------------ *
 * The collection (fixture ZIPs — the M3.1 captures)
 * ------------------------------------------------------------------ */

/** A fetch serving the two fixture ZIPs by URL match (binary bodies). */
function s3FixtureFetch(failLiquidity = false, failMacro = false): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('THREEFYTP10')) {
      if (failLiquidity) return new Response('edge blip', { status: 503 });
      return new Response(liquidityZip, { status: 200 });
    }
    if (url.includes('GDPNOW')) {
      if (failMacro) return new Response('edge blip', { status: 503 });
      return new Response(macroZip, { status: 200 });
    }
    throw new Error(`unexpected fetch URL: ${url}`);
  }) as typeof fetch;
}

describe('collectRung4Sources (the shared collect, fixture ZIPs)', () => {
  it('fetches both groups, serves every id, and future-trims IORB', async () => {
    // The capture's own dates: fetched 2026-11-01, so IORB rows dated
    // 2026-11-01 stay and the announced 2026-11-02 row is dropped.
    const out = await collectRung4Sources({ fetchImpl: s3FixtureFetch(), now: new Date('2026-11-01T04:35:00Z') });

    // The liquidity group: 6 ids from 4 ZIP members.
    expect(out.fred.THREEFYTP10!.at(-1)).toEqual({ date: '2026-10-23', value: 0.9358 });
    expect(out.fred.THREEFYTP10!.length).toBe(2554); // non-missing observations
    expect(out.fred.WTREGEN!.at(-1)).toEqual({ date: '2026-10-28', value: 999_727 });
    expect(out.fred.WRESBAL!.at(-1)).toEqual({ date: '2026-10-28', value: 2_893_770 });
    expect(out.fred.RRPONTSYD!.at(-1)).toEqual({ date: '2026-10-30', value: 4.375 });
    expect(out.fred.IORB!.at(-1)).toEqual({ date: '2026-11-01', value: 3.9 });
    expect(out.fred.IORB!.every((p) => p.date <= '2026-11-01')).toBe(true);
    expect(out.fred.CCSA!.at(-1)).toEqual({ date: '2026-10-17', value: 1_701_000 });

    // The macro group: 6 ids from 2 ZIP members (the M3.4/M3.5 legs).
    expect(out.fred.GDPNOW!.at(-1)).toEqual({ date: '2026-10-01', value: 3.2217 });
    expect(out.fred.GACDISA066MSFRBNY!.at(-1)).toEqual({ date: '2026-10-01', value: 25.5 });
    expect(out.fred.MEDCPIM158SFRBCLE!.at(-1)!.value).toBeCloseTo(2.8081575376, 9);
    expect(out.fred.STICKCPIM158SFRBATL!.at(-1)!.value).toBeCloseTo(3.401271558, 9);
    expect(out.fred.MTSDS133FMS!.at(-1)!.value).toBeCloseTo(-26_900.34710202, 6);
    expect(out.fred.DRTSCILM!.at(-1)).toEqual({ date: '2026-07-01', value: 0 });

    // Two fetches exactly (the rung's subrequest arithmetic) + honest rows.
    expect(out.reports.filter((r) => r.ok)).toHaveLength(2);
    expect(out.reports.every((r) => r.source === 'fred-s3')).toBe(true);
  });

  it('fail-soft per group: one failing ZIP never sinks the other (the rung2 discipline)', async () => {
    const out = await collectRung4Sources({ fetchImpl: s3FixtureFetch(true, false), now: new Date('2026-11-01T04:35:00Z') });
    expect(out.fred.THREEFYTP10).toBeUndefined();
    expect(out.fred.WTREGEN).toBeUndefined();
    expect(out.fred.GDPNOW!.at(-1)).toEqual({ date: '2026-10-01', value: 3.2217 });
    expect(out.reports.filter((r) => !r.ok)).toHaveLength(1);
    expect(out.reports.find((r) => !r.ok)!.kind).toBe('failed');
  });

  it('the cosd decade window is pinned on the request (the percentile basis)', async () => {
    let seenUrl = '';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      seenUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(liquidityZip, { status: 200 });
    }) as typeof fetch;
    await collectRung4Sources({ fetchImpl, now: new Date('2026-11-01T04:35:00Z') });
    // The request pins today − 10y − 90d (2026-11-01 → 2016-08-05), exactly
    // like the main rung's decade groups. NOTE (probed live 2026-11-01):
    // the fredgraph ZIP path IGNORES cosd — every member serves its series'
    // full history (daily.csv from 2003, the CCSA weekly from 1967) — so the
    // pin is the request shape, not a data trim; the parse sizes stay modest
    // (12.5k rows across both groups).
    expect(seenUrl).toContain('cosd=2016-08-05');
  });
});

/* ------------------------------------------------------------------ *
 * The derived.ts wiring (the inline build path)
 * ------------------------------------------------------------------ */

describe('buildIndicatorSeries consumes the rung4 inputs', () => {
  it('derives the six liquidity ids when the S3 map + the main-rung legs are present', () => {
    const series = buildIndicatorSeries({
      fred: {
        SOFR: [{ date: '2026-10-31', value: 3.95 }],
        WALCL: [{ date: '2026-10-28', value: 6_850_000 }],
      },
      fx: {},
      rung4: {
        fredS3: {
          THREEFYTP10: [{ date: '2026-10-23', value: 0.9358 }],
          WTREGEN: [{ date: '2026-10-28', value: 999_727 }],
          RRPONTSYD: [{ date: '2026-10-28', value: 4.375 }],
          WRESBAL: [{ date: '2026-10-28', value: 2_893_770 }],
          IORB: [{ date: '2026-10-31', value: 3.9 }],
        },
      },
      today: '2026-11-01',
    });
    expect(series['term-premium-10y']!.at(-1)!.value).toBe(0.9358);
    expect(series.tga!.at(-1)!.value).toBe(999_727);
    expect(series['reverse-repo']!.at(-1)!.value).toBe(4.375);
    expect(series['bank-reserves']!.at(-1)!.value).toBe(2_893_770);
    expect(series['repo-stress']!.at(-1)).toEqual({ date: '2026-10-31', value: 0.05 });
    expect(series['net-liquidity']!.at(-1)).toEqual({ date: '2026-10-28', value: 5_845_898 });
  });

  it('omits every rung4 id when the rung4 inputs are absent (the main rung carries them)', () => {
    const series = buildIndicatorSeries({
      fred: { SOFR: [{ date: '2026-10-31', value: 3.95 }], WALCL: [{ date: '2026-10-28', value: 6_850_000 }] },
      fx: {},
      today: '2026-11-01',
    });
    for (const id of RUNG4_IDS) {
      expect(series[id], `${id} must be absent without rung4 inputs`).toBeUndefined();
    }
  });
});

/* ------------------------------------------------------------------ *
 * The carry-forward (the main rung's half — the rung2 pattern)
 * ------------------------------------------------------------------ */

/** A minimal in-memory InsightsStore (the rung2 test's shape). */
class MemoryStore implements InsightsStore {
  snapshot: InsightsSnapshot | undefined;
  status: InsightsStatus | undefined;
  histories = new Map<IndicatorId, IndicatorHistory>();

  async getSnapshot() {
    return this.snapshot;
  }
  async putSnapshot(s: InsightsSnapshot) {
    this.snapshot = s;
  }
  async getHistory(id: IndicatorId) {
    return this.histories.get(id);
  }
  async putHistory(h: IndicatorHistory) {
    this.histories.set(h.id, h);
  }
  async getStatus() {
    return this.status;
  }
  async putStatus(s: InsightsStatus) {
    this.status = s;
  }
  async getArchive() {
    return undefined;
  }
  async putArchive() {
    /* test store */
  }
  async getPublicSnapshot() {
    return undefined;
  }
  async putPublicSnapshot() {
    /* test store */
  }
  async getPublicArchive() {
    return undefined;
  }
  async putPublicArchive() {
    /* test store */
  }
}

/** A KV map for the stage + history writes (get/put by key). */
class MemoryKv {
  map = new Map<string, string>();
  async get(key: string) {
    return this.map.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe('runInsightsRung4Phase (the 04:35 orchestration)', () => {
  it('fetches both groups, derives against the staged legs, patches the snapshot + stage + histories, appends status rows', async () => {
    const original = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('THREEFYTP10')) return new Response(liquidityZip, { status: 200 });
      if (url.includes('GDPNOW')) return new Response(macroZip, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      // The pre-state: the 04:10 main build's snapshot (the rung-4 ids
      // carried/unavailable) + a stage carrying the sofr/walcl legs.
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-31', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({
        series,
        calendar: [],
        now: '2026-11-01T04:10:00.000Z',
        carryForwardIds: new Set(CARRY_FORWARD_IDS),
      });
      store.status = {
        v: 1,
        generatedAt: '2026-11-01T04:10:00.000Z',
        mode: 'scheduled',
        sources: [],
        validation: [],
      } as unknown as InsightsStatus;
      const kv = new MemoryKv();
      // The stage: sofr + walcl legs (the main rung's own collect), keyed
      // by epoch day — 20757 = 2026-10-31 (SOFR), 20754 = 2026-10-28 (walcl).
      kv.map.set(
        'insights:ingest-stage:v1',
        JSON.stringify({
          v: 1,
          writtenAt: '2026-11-01T04:10:00.000Z',
          series: {
            sofr: [
              [20740, 3.96],
              [20757, 3.95],
            ],
            walcl: [
              [20747, 6_800_000],
              [20754, 6_850_000],
            ],
          },
        }),
      );

      const result = await runInsightsRung4Phase({
        store: store as unknown as InsightsStore,
        kv: kv as unknown as Parameters<typeof runInsightsRung4Phase>[0]['kv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:35:00Z'),
      });

      // Both groups fetched (the rung's two subrequests).
      expect(urls.filter((u) => u.includes('fredgraph.csv'))).toHaveLength(2);
      expect(result.patched).toBe(true);
      // The six readings patched from the fixture + the staged legs.
      const reading = (id: IndicatorId) => store.snapshot!.readings.find((r) => r.id === id)!;
      expect(reading('term-premium-10y')!.value).toBe(0.9358);
      expect(reading('term-premium-10y')!.asOf).toBe('2026-10-23');
      expect(reading('tga')!.value).toBe(999_727);
      expect(reading('tga')!.asOf).toBe('2026-10-28');
      expect(reading('reverse-repo')!.value).toBe(4.375);
      expect(reading('bank-reserves')!.value).toBe(2_893_770);
      // repo-stress: SOFR (3.95 @ 2026-10-31) − IORB (3.90 @ ≤2026-11-01)
      // joined on their common dates — the last fixture IORB row at or
      // before 2026-10-31 carries 3.90.
      expect(reading('repo-stress')!.value).not.toBeNull();
      expect(reading('net-liquidity')!.value).not.toBeNull();
      // The derived cards' percentiles exist (the decade basis parsed).
      expect(reading('tga')!.percentile10y).toBeDefined();
      // The stage updated with THIS phase's series (the sweep bootstrap
      // record). gap-closure S3-M3.3: scoped to the phase's refreshed ids —
      // the credit pair (ebp/ofr-fsi) joined RUNG4_IDS but is written by its
      // OWN phase (adapters/credit.ts), not this one.
      const stage = JSON.parse(kv.map.get('insights:ingest-stage:v1')!) as { series: Record<string, unknown> };
      for (const id of Object.keys(result.series)) {
        expect(stage.series[id], `${id} must be staged`).toBeDefined();
      }
      // The phase's OWN history keys written (the 04:25 halves' exclusion).
      expect(result.histories.written).toBe(6); // the liquidity family only — the M3.3 credit pair has its own phase
      for (const id of Object.keys(result.series)) {
        expect(kv.map.has(`insights:hist:${id}`), `${id} history key`).toBe(true);
      }
      // Honest report rows appended to the status.
      expect(store.status!.sources.filter((r) => r.source === 'fred-s3' && r.ok)).toHaveLength(2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('a stage-less first deploy: the direct cards still patch; the derived cards carry (fail closed)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('THREEFYTP10')) return new Response(liquidityZip, { status: 200 });
      if (url.includes('GDPNOW')) return new Response(macroZip, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-31', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({ series, calendar: [], now: '2026-11-01T04:10:00.000Z' });
      const kv = new MemoryKv(); // NO stage → no legs

      const result = await runInsightsRung4Phase({
        store: store as unknown as InsightsStore,
        kv: kv as unknown as Parameters<typeof runInsightsRung4Phase>[0]['kv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:35:00Z'),
      });

      expect(result.patched).toBe(true);
      expect(result.series['term-premium-10y']).toBeDefined();
      expect(result.series['repo-stress']).toBeUndefined(); // no SOFR leg
      expect(result.series['net-liquidity']).toBeUndefined(); // no WALCL leg
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('historyPhaseIds excludes the rung4 ids (the phase owns its histories)', () => {
  it('no RUNG4 id rides the daily or periodic phases', () => {
    for (const phase of ['daily', 'daily-a', 'daily-b', 'periodic'] as const) {
      for (const id of RUNG4_IDS) {
        expect(historyPhaseIds(phase), `${id} must not ride phase '${phase}'`).not.toContain(id);
      }
    }
    // The daily halves still partition cleanly (the split invariant).
    const whole = historyPhaseIds('daily');
    const a = historyPhaseIds('daily-a');
    const b = historyPhaseIds('daily-b');
    expect([...a, ...b]).toEqual(whole);
  });

  it('CARRY_FORWARD_IDS covers exactly the rung-2 + rung-4 families (the main rung carries both)', () => {
    expect(CARRY_FORWARD_IDS).toEqual([...RUNG2_IDS, ...RUNG4_IDS]);
    expect(new Set(CARRY_FORWARD_IDS).size).toBe(CARRY_FORWARD_IDS.length);
  });
});


describe('the rung-4 carry-forward at the main build (carryForwardIds)', () => {
  const NOW = '2026-11-01T04:10:00.000Z';

  /** A snapshot where every NON-rung-4 id has a series (they compute) and the rung-4 ids carry. */
  function snapshotWith(tgaReading: { value: number; asOf: string; status: 'context' } | null): InsightsSnapshot {
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-10-31', value: 1 }];
    }
    const base = buildInsightsSnapshot({ series, calendar: [], now: '2026-10-31T04:10:00.000Z' });
    if (tgaReading === null) return base;
    // Simulate yesterday's 04:35 patch: tga fresh at its Wednesday level.
    return {
      ...base,
      readings: base.readings.map((r) =>
        r.id === 'tga'
          ? { ...r, value: tgaReading.value, asOf: tgaReading.asOf, status: tgaReading.status, updatedAt: '2026-10-31T04:35:00.000Z' }
          : r,
      ),
    } as InsightsSnapshot;
  }

  it('a rung-4 id with NO series keeps its previous reading VERBATIM (status, value, asOf) — not the H3 stale-hold', () => {
    const previous = snapshotWith({ value: 999_727, asOf: '2026-10-28', status: 'context' });
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-11-01', value: 1 }];
    }
    const today = buildInsightsSnapshot({
      series,
      previous,
      calendar: [],
      now: NOW,
      carryForwardIds: new Set(RUNG4_IDS as readonly string[]),
    });
    const tga = today.readings.find((r) => r.id === 'tga')!;
    expect(tga.value).toBe(999_727);
    expect(tga.asOf).toBe('2026-10-28');
    expect(tga.status).toBe('context');
    expect(tga.updatedAt).toBe(NOW);
  });

  it('a NON-rung-4 id with no series still takes the honest stale-hold (the carry is scoped)', () => {
    const previous = snapshotWith(null);
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if (def.id === 'vix' || (RUNG4_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-11-01', value: 1 }];
    }
    const today = buildInsightsSnapshot({
      series,
      previous,
      calendar: [],
      now: NOW,
      carryForwardIds: new Set(RUNG4_IDS as readonly string[]),
    });
    expect(today.readings.find((r) => r.id === 'vix')!.status).toBe('stale'); // the H3 honesty, unchanged
  });
});
