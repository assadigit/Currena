/**
 * xau-ohlc.test.ts — GPE R18: the XAUUSD OHLC adapter + store/job tests.
 * The FROZEN expectations are the session's own live-probe numbers (the
 * s13 M1 §4a record: the 2026-11-18 EODHD probe's shape — the
 * free-window rows, the trailing one-year warning, the last final bar
 * 2026-11-17 3,792.59 with the 2026-11-18 partial bar dropped per
 * S13-D3). The parse rules, the merge's revision-wins semantics, the
 * bootstrap, the daily append, the write-if-changed idempotence, and
 * the failure taxonomy.
 */

import { describe, expect, it } from 'vitest';
import { FormatChangedError } from '../../shared/adapters/fetch-policy';
import {
  parseEodhdXauusdResponse,
  xauDefaultFromDate,
  XAUUSD_SOURCE_URL,
} from './adapters/eodhd-xauusd';
import {
  GOLD_XAU_KV_KEY,
  buildXauSnapshot,
  mergeXauSeries,
  parseStoredGoldXau,
  runGoldXauIngest,
  xauFetchFromDate,
  type GoldXauStore,
} from './xau-ohlc';

const NOW = new Date('2026-11-18T17:00:00Z');
const TODAY = '2026-11-18';

/** The probe's own answer shape (trimmed to the rows the tests need). */
function probeRows(): Array<Record<string, unknown>> {
  return [
    { date: '2025-11-18', open: 4012.09, high: 4081.09, low: 3999.63, close: 4081.01, adjusted_close: 4081.01, volume: 219 },
    { date: '2026-11-16', open: 3848.87, high: 3849.44, low: 3785.65, close: 3792.59, adjusted_close: 3792.59, volume: 184 },
    { date: '2026-11-17', open: 3848.87, high: 3849.44, low: 3785.65, close: 3792.59, adjusted_close: 3792.59, volume: 184 },
    // Today's bar — the partial-bar guard must DROP it (S13-D3).
    { date: '2026-11-18', open: 3790.0, high: 3795.0, low: 3788.0, close: 3792.0, volume: 12, warning: 'Data is limited by one year as you have free subscription' },
  ];
}

/** A weekday-dated ascending series (n bars, a gentle trend + a wave). */
function synthSeries(n: number, firstDate: string): Array<{ date: string; open: number; high: number; low: number; close: number }> {
  const out: Array<{ date: string; open: number; high: number; low: number; close: number }> = [];
  let ms = Date.parse(`${firstDate}T00:00:00Z`);
  for (let i = 0; i < n; ) {
    const weekday = new Date(ms).getUTCDay();
    if (weekday !== 6 && weekday !== 0) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const close = 3000 + i * 2 + 150 * Math.sin(i / 21);
      out.push({ date, open: close - 5, high: close + 12, low: close - 15, close });
      i += 1;
    }
    ms += 86_400_000;
  }
  return out;
}

describe('parseEodhdXauusdResponse (the fail-closed parse rules)', () => {
  it('parses final bars and DROPS today\'s partial bar (S13-D3)', () => {
    const bars = parseEodhdXauusdResponse(probeRows(), TODAY);
    expect(bars.map((b) => b.date)).toEqual(['2025-11-18', '2026-11-16', '2026-11-17']);
    expect(bars[2]).toEqual({ date: '2026-11-17', open: 3848.87, high: 3849.44, low: 3785.65, close: 3792.59 });
  });

  it('sorts ascending and keeps the LAST row per date (a revision wins)', () => {
    const rows = [
      { date: '2026-11-17', open: 1, high: 2, low: 0.5, close: 1.5 },
      { date: '2026-11-16', open: 1, high: 2, low: 0.5, close: 1.4 },
      { date: '2026-11-16', open: 1, high: 2, low: 0.5, close: 1.45 }, // the revision
    ];
    const bars = parseEodhdXauusdResponse(rows, TODAY);
    expect(bars.map((b) => b.date)).toEqual(['2026-11-16', '2026-11-17']);
    expect(bars[0]!.close).toBe(1.45);
  });

  it('drops malformed rows and fails closed on shape drift', () => {
    expect(() => parseEodhdXauusdResponse('nope', TODAY)).toThrow(FormatChangedError);
    expect(() => parseEodhdXauusdResponse([], TODAY)).toThrow(FormatChangedError);
    // Every row malformed (a bad OHLC quad) → no usable bar → FormatChanged.
    expect(() => parseEodhdXauusdResponse([{ date: '2026-11-17', open: 1, high: 2, low: 0.5 }], TODAY)).toThrow(FormatChangedError);
    // A malformed row among good ones is DROPPED, never guessed.
    const bars = parseEodhdXauusdResponse(
      [
        { date: '2026-11-17', open: 1, high: 2, low: 0.5, close: 1.5 },
        { date: '2026-11-13', open: 'x', high: 2, low: 0.5, close: 1.5 },
      ],
      TODAY,
    );
    expect(bars.map((b) => b.date)).toEqual(['2026-11-17']);
  });

  it('the source URL the cards name at point of use (C1/C6)', () => {
    expect(XAUUSD_SOURCE_URL).toBe('https://eodhd.com/api/eod/XAUUSD.FOREX');
  });

  it('the default from-date: ~400 days back (the markets client\'s window)', () => {
    expect(xauDefaultFromDate(NOW)).toBe('2025-10-14');
  });
});

describe('mergeXauSeries + the snapshot build', () => {
  it('the union by date, the FETCH winning on shared dates (revisions win)', () => {
    const stored = synthSeries(4, '2026-11-10');
    const fetched: Array<{ date: string; open: number; high: number; low: number; close: number }> = [
      // A revision of the stored 3rd bar + a new trailing bar.
      { ...stored[2]!, close: stored[2]!.close + 3 },
      { date: '2026-11-19', open: 3000, high: 3010, low: 2990, close: 3005 },
    ];
    const merged = mergeXauSeries(stored, fetched);
    expect(merged.map((c) => c.date)).toEqual([...stored.slice(0, 2).map((c) => c.date), stored[2]!.date, stored[3]!.date, '2026-11-19']);
    expect(merged[2]!.close).toBe(stored[2]!.close + 3);
  });

  it('the snapshot: asOf = the last bar, strictly ascending, the source URL carried', () => {
    const series = synthSeries(10, '2026-01-05');
    const snap = buildXauSnapshot(series, NOW);
    expect(snap.asOf).toBe(series[series.length - 1]!.date);
    expect(snap.fetchedAt).toBe(NOW.toISOString());
    expect(snap.sourceUrl).toBe(XAUUSD_SOURCE_URL);
    expect(snap.series.length).toBe(10);
    // The round trip through the stored parse is identity.
    expect(parseStoredGoldXau(JSON.stringify(snap))?.asOf).toBe(snap.asOf);
  });

  it('a poisoned stored value is ignored, never trusted (the parseStored discipline)', () => {
    expect(parseStoredGoldXau(null)).toBeUndefined();
    expect(parseStoredGoldXau('not json')).toBeUndefined();
    expect(parseStoredGoldXau(JSON.stringify({ v: 2 }))).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * The job (the rung4 body) — an in-memory KV fake, fetch injected
 * ------------------------------------------------------------------ */

class FakeKv {
  readonly map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    if (key !== GOLD_XAU_KV_KEY) throw new Error(`unexpected key ${key}`);
    this.map.set(key, value);
  }
}

function makeStore(): { store: GoldXauStore; kv: FakeKv } {
  const kv = new FakeKv();
  return { store: {
    getGoldXau: async () => parseStoredGoldXau(await kv.get(GOLD_XAU_KV_KEY)),
    writeGoldXau: async (s) => void kv.put(GOLD_XAU_KV_KEY, JSON.stringify(s)),
  }, kv };
}

function eodFetchOptions(rows: () => Array<Record<string, unknown>>): EodhdXauFetchOptions {
  return {
    apiToken: 'test-token',
    fetchImpl: async () => jsonResponse(rows()),
    todayUtc: TODAY,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('runGoldXauIngest (the rung body)', () => {
  it('the bootstrap: seeds the plan\'s depth, writes once, names the span', async () => {
    const { store, kv } = makeStore();
    const result = await runGoldXauIngest(store, { apiToken: 'test-token', now: NOW, fetchImpl: async () => jsonResponse(probeRows()) });
    expect(result.outcome.ok).toBe(true);
    expect(result.snapshot?.series.length).toBe(3);
    expect(result.snapshot?.asOf).toBe('2026-11-17');
    expect(kv.map.size).toBe(1);
    if (result.outcome.ok) expect(result.outcome.note).toContain('bootstrap');
  });

  it('the daily append: yesterday\'s final bar lands, the write fires', async () => {
    const { store } = makeStore();
    // Bootstrap with rows through the 16th.
    await runGoldXauIngest(store, { apiToken: 'test-token', now: NOW, fetchImpl: async () => jsonResponse(probeRows().slice(0, 2)) });
    // The next rung: the venue now serves through the 17th.
    const result = await runGoldXauIngest(store, { apiToken: 'test-token', now: NOW, fetchImpl: async () => jsonResponse(probeRows()) });
    expect(result.outcome.ok).toBe(true);
    expect(result.snapshot?.asOf).toBe('2026-11-17');
    if (result.outcome.ok) expect(result.outcome.note).toContain('appended');
  });

  it('the idempotence: a quiet day (no new bar, no revision) writes NOTHING', async () => {
    const { store, kv } = makeStore();
    await runGoldXauIngest(store, { apiToken: 'test-token', now: NOW, fetchImpl: async () => jsonResponse(probeRows()) });
    const writesBefore = kv.map.size;
    const result = await runGoldXauIngest(store, { apiToken: 'test-token', now: NOW, fetchImpl: async () => jsonResponse(probeRows()) });
    expect(result.outcome.ok).toBe(true);
    expect(kv.map.size).toBe(writesBefore);
    expect(result.kv.writes).toBe(0);
    if (result.outcome.ok) expect(result.outcome.note).toContain('no change');
  });

  it('a failed fetch fails the rung honestly — the stored series survives', async () => {
    const { store } = makeStore();
    await runGoldXauIngest(store, { apiToken: 'test-token', now: NOW, fetchImpl: async () => jsonResponse(probeRows()) });
    const result = await runGoldXauIngest(store, {
      apiToken: 'test-token',
      now: NOW,
      fetchImpl: async () => new Response('boom', { status: 500 }),
    });
    expect(result.outcome).toEqual({ ok: false, kind: 'failed', note: expect.stringContaining('HTTP 500') });
    // The stored series is untouched (the read-only failure path).
    expect((await store.getGoldXau())?.asOf).toBe('2026-11-17');
  });

  it('a missing token fails fast (the markets worker\'s calm degradation)', async () => {
    const { store } = makeStore();
    const result = await runGoldXauIngest(store, { apiToken: '', now: NOW });
    expect(result.outcome.ok).toBe(false);
    if (!result.outcome.ok) expect(result.outcome.note).toContain('no EODHD token');
  });

  it('xauFetchFromDate: the trailing window behind the last stored bar (revision tolerance)', () => {
    expect(xauFetchFromDate(undefined)).toBeUndefined();
    // synthSeries(5, '2026-11-10') = 11-10, 11, 12, 13, 16 (the Sat skipped) —
    // the last bar 2026-11-16 → the trailing window 3 days back = 2026-11-13.
    const snap = buildXauSnapshot(synthSeries(5, '2026-11-10'), NOW);
    expect(xauFetchFromDate(snap)).toBe('2026-11-13');
  });
});
