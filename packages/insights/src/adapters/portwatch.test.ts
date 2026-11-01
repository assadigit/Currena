/**
 * portwatch.test.ts — gap-closure S4-M4.3 (2026-11-01): the IMF PortWatch
 * chokepoint transits. Fixtures: the three query pages + the error body
 * recorded live 2026-11-01 (this session's own probes, saved verbatim —
 * tests never hit live sites).
 *
 * The provider-exact expectations (the MA7 values, the vsPrior4w and
 * vsYearAgo comparisons) are computed from the provider's own fixture
 * rows — never invented numbers.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { InsightsSnapshot } from '@currena/core';
import {
  buildChokepointCompare,
  CHOKEPOINT_DEFS,
  collectPortwatchRows,
  derivePortwatchIndicatorSeries,
  ma7Series,
  mergePortwatchHistory,
  parsePortwatchPage,
  parseStoredPortwatch,
  PortwatchHistorySchema,
  PORTWATCH_IDS,
  PORTWATCH_KV_KEY,
  portwatchQueryUrl,
  PORTWATCH_QUERY_URL,
  PORTWATCH_WINDOW_DAYS,
  priorFourWeekMean,
  yearAgoMa7,
} from './portwatch';
import { DEFINITIONS } from '../definitions';
import { computeReading } from '../scoring';
import type { SeriesPoint } from '../series';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');

/** The 2026-11-01 captures (verbatim provider bodies). */
const page1 = readFileSync(join(fixtures, 's4', 'portwatch-query-page1-2026-11-01.json'), 'utf8');
const page2 = readFileSync(join(fixtures, 's4', 'portwatch-query-page2-2026-11-01.json'), 'utf8');
const sixtyDay = readFileSync(join(fixtures, 's4', 'portwatch-query-sixtyday-2026-11-01.json'), 'utf8');
const errorBody = readFileSync(join(fixtures, 's4', 'portwatch-query-error-2026-11-01.json'), 'utf8');

/** Every fixture row, merged (the two bootstrap pages = the full window). */
const bootstrapRows = [
  ...parsePortwatchPage(page1).rows,
  ...parsePortwatchPage(page2).rows,
];

/** The merged 400-day history off the fixture pair (deterministic now). */
const FIXTURE_NOW = new Date('2026-11-01T12:00:00.000Z');
const mergedFile = mergePortwatchHistory(undefined, bootstrapRows, FIXTURE_NOW);

/** The derived per-id MA7 series (shared by the comparison tests). */
const series = derivePortwatchIndicatorSeries(mergedFile);

describe('portwatchQueryUrl (the M4.1-verified query shape)', () => {
  it('builds the batched IN-list + DATE-literal query with the paging params', () => {
    const url = portwatchQueryUrl('2025-10-01', 1000);
    expect(url.startsWith(`${PORTWATCH_QUERY_URL}?`)).toBe(true);
    // The IN list (equality 400s — the M4.1 lesson) with all five portids.
    const where = new URL(url).searchParams.get('where');
    expect(where).toBe(
      "portid IN ('chokepoint1','chokepoint2','chokepoint4','chokepoint5','chokepoint11') AND date >= DATE '2025-10-01'",
    );
    for (const param of [
      'outFields=portid%2Cportname%2Cdate%2Cn_total',
      'orderByFields=portid%2Cdate',
      'resultRecordCount=1000',
      'resultOffset=1000',
      'returnGeometry=false',
      'f=json',
    ]) {
      expect(url).toContain(param);
    }
  });
});

describe('parsePortwatchPage (fail closed on every shape drift)', () => {
  it('parses the sixty-day page: 205 rows, all five chokepoints, no more pages', () => {
    const page = parsePortwatchPage(sixtyDay);
    expect(page.rows).toHaveLength(205);
    expect(page.more).toBe(false);
    const portids = new Set(page.rows.map((r) => r.portid));
    expect([...portids].sort()).toEqual(['chokepoint1', 'chokepoint11', 'chokepoint2', 'chokepoint4', 'chokepoint5']);
  });

  it('parses bootstrap page 1: 1000 rows and exceededTransferLimit (another page follows)', () => {
    const page = parsePortwatchPage(page1);
    expect(page.rows).toHaveLength(1000);
    expect(page.more).toBe(true);
  });

  it('fails closed on the host\'s HTTP-200-with-error body (the "Invalid URL" class)', () => {
    expect(() => parsePortwatchPage(errorBody)).toThrow(/the provider returned an error body \(code 400/);
  });

  it('fails closed on an unknown portid (a layer change)', () => {
    const body = JSON.stringify({
      features: [{ attributes: { portid: 'chokepoint99', portname: 'New Strait', date: '2026-10-01', n_total: 10 } }],
    });
    expect(() => parsePortwatchPage(body)).toThrow(/unknown portid "chokepoint99"/);
  });

  it('fails closed on a renamed portname (the identity check)', () => {
    const body = JSON.stringify({
      features: [{ attributes: { portid: 'chokepoint1', portname: 'Suez Canal Zone', date: '2026-10-01', n_total: 40 } }],
    });
    expect(() => parsePortwatchPage(body)).toThrow(/portname for chokepoint1 changed/);
  });

  it('fails closed on a malformed date', () => {
    const body = JSON.stringify({
      features: [{ attributes: { portid: 'chokepoint1', portname: 'Suez Canal', date: '10/01/2026', n_total: 40 } }],
    });
    expect(() => parsePortwatchPage(body)).toThrow(/malformed date/);
  });

  it('fails closed on a non-integer or implausible n_total', () => {
    const mk = (nTotal: unknown) =>
      JSON.stringify({
        features: [{ attributes: { portid: 'chokepoint1', portname: 'Suez Canal', date: '2026-10-01', n_total: nTotal } }],
      });
    expect(() => parsePortwatchPage(mk(40.5))).toThrow(/implausible n_total/);
    expect(() => parsePortwatchPage(mk(-1))).toThrow(/implausible n_total/);
    expect(() => parsePortwatchPage(mk(999999))).toThrow(/implausible n_total/);
    expect(() => parsePortwatchPage(mk('40'))).toThrow(/implausible n_total/);
  });

  it('fails closed on a missing features array', () => {
    expect(() => parsePortwatchPage('{"objectIdFieldName":"ObjectId"}')).toThrow(/no features array/);
    expect(() => parsePortwatchPage('not json')).toThrow(/not JSON/);
  });
});

describe('ma7Series (the card\'s own series)', () => {
  it('averages the 7 calendar days ending at each day, 1dp, and skips incomplete windows', () => {
    const raw: SeriesPoint[] = [
      { date: '2026-01-01', value: 10 },
      { date: '2026-01-02', value: 20 },
      { date: '2026-01-03', value: 30 },
      { date: '2026-01-04', value: 40 },
      { date: '2026-01-05', value: 50 },
      { date: '2026-01-06', value: 60 },
      { date: '2026-01-07', value: 70 },
    ];
    const out = ma7Series(raw);
    // Days 01-01..01-06 have no complete window; 01-07 averages all seven.
    expect(out).toEqual([{ date: '2026-01-07', value: 40 }]);
  });

  it('a gap inside the window skips the day (never a partial average presented as the 7-day number)', () => {
    const raw: SeriesPoint[] = [
      { date: '2026-01-01', value: 10 },
      { date: '2026-01-02', value: 20 },
      { date: '2026-01-03', value: 30 },
      { date: '2026-01-05', value: 50 },
      { date: '2026-01-06', value: 60 },
      { date: '2026-01-07', value: 70 },
      { date: '2026-01-08', value: 80 },
    ];
    const out = ma7Series(raw);
    // 01-08's window misses 01-04 → no MA7 at all in this series.
    expect(out).toEqual([]);
  });
});

describe('mergePortwatchHistory (the ONE combined key\'s merge)', () => {
  it('fetched rows win date collisions (the provider\'s revision) and the window trims to 400 days', () => {
    const now = new Date('2026-11-01T00:00:00.000Z');
    const todayDay = Math.floor(now.getTime() / 86_400_000);
    const day = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
    const stored = PortwatchHistorySchema.parse({
      v: 1,
      fetchedAt: '2026-10-01T00:00:00.000Z',
      sourceUrl: PORTWATCH_QUERY_URL,
      chokepoints: [
        // day('2025-08-01') is ~456 days back — outside the 400-day window,
        // dropped at merge; the two October days stay.
        { portid: 'chokepoint1', portname: 'Suez Canal', days: [[day('2025-08-01'), 40], [day('2026-10-24'), 45], [day('2026-10-25'), 46]] },
      ],
    });
    // The fetched rows revise 2026-10-25 (the provider's fresher estimate)
    // and add 2026-10-26.
    const fetched = [
      { portid: 'chokepoint1', date: '2026-10-25', nTotal: 47 },
      { portid: 'chokepoint1', date: '2026-10-26', nTotal: 48 },
    ];
    const merged = mergePortwatchHistory(stored, fetched, now);
    expect(merged.chokepoints).toHaveLength(CHOKEPOINT_DEFS.length);
    const suez = merged.chokepoints.find((c) => c.portid === 'chokepoint1')!;
    expect(suez.days).toEqual([
      [day('2026-10-24'), 45],
      [day('2026-10-25'), 47], // the fetched revision wins
      [day('2026-10-26'), 48],
    ]);
    // The 400-day window boundary is honoured (today − 399 stays, today −
    // 400 would not: 2026-10-24 sits 8 days back, well inside).
    expect(todayDay - day('2026-10-24')).toBe(8);
    expect(todayDay - day('2025-08-01')).toBeGreaterThan(399);
  });

  it('every chokepoint carries the full fixture window (390 days each, zero gaps)', () => {
    for (const def of CHOKEPOINT_DEFS) {
      const entry = mergedFile.chokepoints.find((c) => c.portid === def.portid)!;
      expect(entry.days.length, `${def.portid} day count`).toBe(390);
      // Strictly ascending days.
      for (let i = 1; i < entry.days.length; i++) {
        expect(entry.days[i]![0]).toBeGreaterThan(entry.days[i - 1]![0]);
      }
    }
  });
});

describe('parseStoredPortwatch (the poisoned-entry defense)', () => {
  it('round-trips a valid file and degrades poison to undefined', () => {
    const json = JSON.stringify(mergedFile);
    expect(parseStoredPortwatch(json)?.chokepoints.length).toBe(CHOKEPOINT_DEFS.length);
    expect(parseStoredPortwatch('{"v":2}')).toBeUndefined();
    expect(parseStoredPortwatch('not json')).toBeUndefined();
    expect(parseStoredPortwatch(null)).toBeUndefined();
    // The key is part of the module contract (the phase + the store read it).
    expect(PORTWATCH_KV_KEY).toBe('insights:portwatch:v1');
  });
});

describe('derivePortwatchIndicatorSeries + buildChokepointCompare (provider-exact, from the fixtures)', () => {

  it('derives all five ids with 384 MA7 points each', () => {
    expect(Object.keys(series).sort()).toEqual([...PORTWATCH_IDS].sort());
    for (const id of PORTWATCH_IDS) {
      expect(series[id]!, `${id} MA7 point count`).toHaveLength(384);
    }
  });

  it('the latest MA7 values match the provider\'s own rows (41.3 Suez · 28.7 Panama · 28.9 Bab el-Mandeb · 228.0 Malacca · 190.0 Taiwan, all @ 2026-10-25)', () => {
    expect(series['chokepoint-suez']!.at(-1)).toEqual({ date: '2026-10-25', value: 41.3 });
    expect(series['chokepoint-panama']!.at(-1)).toEqual({ date: '2026-10-25', value: 28.7 });
    expect(series['chokepoint-bab-el-mandeb']!.at(-1)).toEqual({ date: '2026-10-25', value: 28.9 });
    expect(series['chokepoint-malacca']!.at(-1)).toEqual({ date: '2026-10-25', value: 228.0 });
    expect(series['chokepoint-taiwan']!.at(-1)).toEqual({ date: '2026-10-25', value: 190.0 });
  });

  it('the comparisons match the provider\'s own rows (vsPrior4w · vsYearAgo)', () => {
    expect(buildChokepointCompare(series['chokepoint-suez']!)).toEqual({ vsPrior4w: -0.9, vsYearAgo: -1.4 });
    expect(buildChokepointCompare(series['chokepoint-panama']!)).toEqual({ vsPrior4w: 2.0, vsYearAgo: -4.2 });
    expect(buildChokepointCompare(series['chokepoint-bab-el-mandeb']!)).toEqual({ vsPrior4w: 1.3, vsYearAgo: -8.5 });
    expect(buildChokepointCompare(series['chokepoint-malacca']!)).toEqual({ vsPrior4w: 3.3, vsYearAgo: -9.1 });
    expect(buildChokepointCompare(series['chokepoint-taiwan']!)).toEqual({ vsPrior4w: -41.4, vsYearAgo: 38.3 });
  });

  it('buildChokepointCompare is absent when the base is too short (fail closed, never a partial comparison)', () => {
    // 40 days: the prior-4w window has ~27 present days (≥14, ok) but the
    // year-ago leg does not exist — vsYearAgo absent, vsPrior4w present.
    const short: SeriesPoint[] = [];
    for (let i = 39; i >= 0; i--) {
      const d = new Date(Date.UTC(2026, 9, 25) - i * 86_400_000);
      short.push({ date: d.toISOString().slice(0, 10), value: 40 + (i % 5) });
    }
    const compare = buildChokepointCompare(short)!;
    expect(compare.vsPrior4w).toBeTypeOf('number');
    expect(compare.vsYearAgo).toBeUndefined();
    // 13 days of data: the prior-4w window holds < 14 of its 28 days — the
    // whole block is absent (never a partial "4-week average").
    expect(buildChokepointCompare(short.slice(-13))).toBeUndefined();
    expect(buildChokepointCompare([])).toBeUndefined();
  });
});

describe('priorFourWeekMean + yearAgoMa7 (the window arithmetic)', () => {
  it('the prior window is exactly the 28 days ending 7 days before the latest point', () => {
    // A flat series of 45s for 60 days: the mean is exactly 45.
    const flat: SeriesPoint[] = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date(Date.UTC(2026, 9, 25) - i * 86_400_000);
      flat.push({ date: d.toISOString().slice(0, 10), value: 45 });
    }
    expect(priorFourWeekMean(flat)).toBe(45);
    // The year-ago lookup finds the point 364 days back when it exists.
    const withYearAgo: SeriesPoint[] = [
      { date: '2025-10-26', value: 50 },
      ...flat,
    ];
    expect(yearAgoMa7(withYearAgo)).toBe(50);
    // Nothing within ±7 days of 364 days back → undefined.
    expect(yearAgoMa7(flat)).toBeUndefined();
  });
});

describe('computeReading stamps the chokepointCompare block for portwatch-source readings', () => {
  it('the standard engine derives the reading + the comparison from the MA7 series (both venues identically)', () => {
    const def = DEFINITIONS.find((d) => d.id === 'chokepoint-suez')!;
    const reading = computeReading(def, series['chokepoint-suez']!, '2026-11-01T04:30:00.000Z', {
      name: 'International Monetary Fund, PortWatch (Suez Canal daily transits)',
      url: 'https://portwatch.imf.org/',
    });
    expect(reading.value).toBe(41.3);
    expect(reading.asOf).toBe('2026-10-25');
    expect(reading.status).toBe('context'); // info rule — never a vote (G-5)
    expect(reading.chokepointCompare).toEqual({ vsPrior4w: -0.9, vsYearAgo: -1.4 });
    // The 30-day change is the MA7 move vs the point 30 days back
    // (provider-exact: 41.3 − 40.0, the MA7 @ 2026-09-25).
    expect(reading.change30d).toBeCloseTo(1.3, 5);
  });

  it('a non-portwatch source never carries the block (the stamp is source-gated)', () => {
    const def = DEFINITIONS.find((d) => d.id === 'wti')!;
    const reading = computeReading(def, series['chokepoint-suez']!, '2026-11-01T04:30:00.000Z', {
      name: 'FRED (EIA WTI spot)',
      url: 'https://fred.stlouisfed.org/series/DCOILWTICO',
    });
    expect(reading.chokepointCompare).toBeUndefined();
  });
});

describe('collectPortwatchRows (paged, single attempt per page)', () => {
  const jsonRes = (body: string) =>
    new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });

  it('pages through the two bootstrap pages until exceededTransferLimit clears', async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string | URL | Request): Promise<Response> => {
      const u = String(url);
      urls.push(u);
      return jsonRes(u.includes('resultOffset=1000') ? page2 : page1);
    }) as typeof fetch;
    const result = await collectPortwatchRows('2025-10-01', { fetchImpl, pagePauseMs: 0, now: FIXTURE_NOW });
    expect(result.pages).toBe(2);
    expect(result.rows).toHaveLength(1950);
    expect(result.reports).toHaveLength(1);
    expect(result.reports[0]!.ok).toBe(true);
    expect(result.reports[0]!.detail).toContain('1950 rows over 2 page(s)');
    // Both pages carry the same batched where clause.
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain('resultOffset=1000');
  });

  it('a failing page fails the whole collection (F-11: no retry) with the honest report row', async () => {
    const fetchImpl = (async (): Promise<Response> => jsonRes(errorBody)) as typeof fetch;
    const result = await collectPortwatchRows('2025-10-01', { fetchImpl, pagePauseMs: 0, now: FIXTURE_NOW });
    expect(result.rows).toEqual([]);
    expect(result.reports[0]!.ok).toBe(false);
    expect(result.reports[0]!.kind).toBe('failed');
    expect(result.reports[0]!.detail).toContain('the provider returned an error body');
  });

  it('a window wider than the 3-page budget is refused loudly (never a silent runaway)', async () => {
    const fetchImpl = (async (): Promise<Response> => jsonRes(page1)) as typeof fetch; // always "more"
    const result = await collectPortwatchRows('2020-01-01', { fetchImpl, pagePauseMs: 0, now: FIXTURE_NOW });
    expect(result.rows).toEqual([]);
    expect(result.reports[0]!.detail).toContain('too wide for the 3-page budget');
  });
});

describe('the rung3 registration shape (PORTWATCH_IDS)', () => {
  it('PORTWATCH_IDS is exactly the five chokepoint ids (the carry/history-exclusion family)', () => {
    expect(PORTWATCH_IDS).toEqual([
      'chokepoint-suez',
      'chokepoint-panama',
      'chokepoint-bab-el-mandeb',
      'chokepoint-malacca',
      'chokepoint-taiwan',
    ]);
    // Hormuz stays absent BY DECISION (the M4.1 source-side collapse).
    expect(PORTWATCH_IDS).not.toContain('chokepoint-hormuz' as never);
    expect(PORTWATCH_WINDOW_DAYS).toBe(400);
  });
});

/* ------------------------------------------------------------------ *
 * The phase (the 04:30 rung3 orchestration)
 * ------------------------------------------------------------------ */

import { vi, afterEach } from 'vitest';
import type { IndicatorHistory, IndicatorId, InsightsStatus } from '@currena/core';
import { buildInsightsSnapshot } from './snapshot';
import { CARRY_FORWARD_IDS, runInsightsPortwatchPhase } from '../ingest/run';
import type { InsightsStore } from '../store';

afterEach(() => {
  vi.restoreAllMocks();
});

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

class MemoryKv {
  map = new Map<string, string>();
  async get(key: string) {
    return this.map.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe('runInsightsPortwatchPhase (the 04:30 rung3 orchestration)', () => {
  const jsonRes = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });

  /** The main-rung-shaped pre-state: every NON-portwatch id has a series. */
  const buildStore = () => {
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if ((PORTWATCH_IDS as readonly string[]).includes(def.id)) continue;
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
    return store;
  };

  it('bootstraps from an empty store: pages the full window, writes the combined key, patches the snapshot + stage, writes its OWN histories', async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string | URL | Request): Promise<Response> => {
      const u = String(url);
      urls.push(u);
      return jsonRes(u.includes('resultOffset=1000') ? page2 : page1);
    }) as typeof fetch;
    const store = buildStore();
    const kv = new MemoryKv();

    const result = await runInsightsPortwatchPhase({
      store: store as unknown as InsightsStore,
      kv: kv as unknown as Parameters<typeof runInsightsPortwatchPhase>[0]['kv'],
      mode: 'scheduled',
      now: new Date('2026-11-01T04:30:00Z'),
      fetchImpl,
      pagePauseMs: 0,
    });

    // The bootstrap: TWO paged fetches (the 400-day window), offset 0 + 1000.
    expect(result.patched).toBe(true);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('resultOffset=0');
    expect(urls[1]).toContain('resultOffset=1000');
    // The combined key: all five chokepoints, 390 raw days each.
    const combined = JSON.parse(kv.map.get(PORTWATCH_KV_KEY)!) as ReturnType<typeof mergePortwatchHistory>;
    expect(combined.chokepoints).toHaveLength(5);
    for (const c of combined.chokepoints) expect(c.days.length, `${c.portid} raw days`).toBe(390);
    // The readings: provider-exact (the fixture's own rows).
    const reading = (id: IndicatorId) => store.snapshot!.readings.find((r) => r.id === id)!;
    expect(reading('chokepoint-suez')!.value).toBe(41.3);
    expect(reading('chokepoint-suez')!.asOf).toBe('2026-10-25');
    expect(reading('chokepoint-suez')!.status).toBe('context');
    expect(reading('chokepoint-suez')!.chokepointCompare).toEqual({ vsPrior4w: -0.9, vsYearAgo: -1.4 });
    expect(reading('chokepoint-taiwan')!.value).toBe(190.0);
    expect(reading('chokepoint-taiwan')!.chokepointCompare).toEqual({ vsPrior4w: -41.4, vsYearAgo: 38.3 });
    expect(reading('chokepoint-suez')!.sourceName).toContain('International Monetary Fund');
    // The stage + the phase's OWN history keys (the halves exclude them).
    const stage = JSON.parse(kv.map.get('insights:ingest-stage:v1')!) as { series: Record<string, unknown> };
    expect(stage.series['chokepoint-suez']).toBeDefined();
    expect(result.histories.written).toBe(5);
    for (const id of PORTWATCH_IDS) expect(kv.map.has(`insights:hist:${id}`)).toBe(true);
    // The honest report row appended to the status.
    expect(store.status!.sources.filter((r) => r.source === 'portwatch' && r.ok)).toHaveLength(1);
    expect(result.rawDays['chokepoint1']).toBe(390);
  });

  it('the daily run after bootstrap fetches only the days since the stored latest (the merge path)', async () => {
    // Seed the combined key from the fixture pages (the bootstrap state).
    const seedKv = new MemoryKv();
    seedKv.map.set(PORTWATCH_KV_KEY, JSON.stringify(mergedFile));
    const fetchImpl = (async (url: string | URL | Request): Promise<Response> => {
      const u = String(url);
      // The daily window: from (stored latest − 7) = 2026-10-18.
      expect(u).toContain('resultOffset=0');
      expect(new URL(u).searchParams.get('where')).toBe(
        "portid IN ('chokepoint1','chokepoint2','chokepoint4','chokepoint5','chokepoint11') AND date >= DATE '2026-10-18'",
      );
      return jsonRes(sixtyDay); // a fresh short page, complete (no more)
    }) as typeof fetch;
    const store = buildStore();

    const result = await runInsightsPortwatchPhase({
      store: store as unknown as InsightsStore,
      kv: seedKv as unknown as Parameters<typeof runInsightsPortwatchPhase>[0]['kv'],
      mode: 'scheduled',
      now: new Date('2026-11-01T04:30:00Z'),
      fetchImpl,
      pagePauseMs: 0,
    });

    expect(result.patched).toBe(true);
    // The merge kept the stored 390 days (the sixty-day page overlaps them).
    const combined = JSON.parse(seedKv.map.get(PORTWATCH_KV_KEY)!) as ReturnType<typeof mergePortwatchHistory>;
    for (const c of combined.chokepoints) expect(c.days.length).toBe(390);
    // The daily fetch is ONE page.
    expect(result.reports[0]!.detail).toContain('1 page(s)');
  });

  it('a failing fetch fails the phase closed (F-11: no retry) — nothing patched, the honest row recorded', async () => {
    const fetchImpl = (async (): Promise<Response> => jsonRes(errorBody)) as typeof fetch;
    const store = buildStore();
    const kv = new MemoryKv();

    const result = await runInsightsPortwatchPhase({
      store: store as unknown as InsightsStore,
      kv: kv as unknown as Parameters<typeof runInsightsPortwatchPhase>[0]['kv'],
      mode: 'scheduled',
      now: new Date('2026-11-01T04:30:00Z'),
      fetchImpl,
      pagePauseMs: 0,
    });

    expect(result.patched).toBe(false);
    expect(kv.map.has(PORTWATCH_KV_KEY)).toBe(false); // the combined key never written on failure
    expect(result.reports[0]!.ok).toBe(false);
    // The store's snapshot was never touched (the readings carry).
    expect(store.snapshot!.readings.find((r) => r.id === 'chokepoint-suez')!.status).toBe('unavailable');
  });
});
