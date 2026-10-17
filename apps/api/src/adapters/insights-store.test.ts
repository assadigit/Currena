import type { InsightsSnapshot, InsightsStatus, IndicatorHistory } from '@currena/core';
import { describe, expect, it, vi } from 'vitest';
import { KvFxReader, KvInsightsReader, KvMarketsReader, KvPricesReader } from './insights-store';

/** Minimal in-memory KVNamespace fake (get only — the reader never writes). */
class FakeKV {
  private readonly entries = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.entries.get(key) ?? null;
  }

  put(key: string, value: string): Promise<void> {
    this.entries.set(key, value);
    return Promise.resolve();
  }
}

const snapshot: InsightsSnapshot = {
  generatedAt: '2026-10-07T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
    australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
  },
  readings: [
    { id: 'us10y', value: 3.9, asOf: '2026-10-06', status: 'normal', sourceName: 'FRED (DGS10)', updatedAt: '2026-10-07T04:20:00.000Z' },
    { id: 'rba-cash-rate', value: null, asOf: null, status: 'unavailable', sourceName: 'RBA F1.1', updatedAt: '2026-10-07T04:20:00.000Z' },
  ],
  changedThisWeek: [],
  calendar: [],
};

const history: IndicatorHistory = { v: 1, id: 'us10y', points: [[19723, 3.88]] };

const status: InsightsStatus = {
  v: 1,
  generatedAt: '2026-10-07T04:21:00.000Z',
  mode: 'manual',
  dryRun: true,
  sources: [{ source: 'fred', ok: true, detail: '10/10 series' }],
};

function reader(kv: FakeKV): KvInsightsReader {
  return new KvInsightsReader(kv as unknown as KVNamespace);
}

describe('KvInsightsReader (over FakeKV)', () => {
  it('round-trips snapshot, history and status from the insights:* keys', async () => {
    const kv = new FakeKV();
    await kv.put('insights:snapshot', JSON.stringify(snapshot));
    await kv.put('insights:hist:us10y', JSON.stringify(history));
    await kv.put('insights:status', JSON.stringify(status));

    expect(await reader(kv).getSnapshot()).toEqual(snapshot);
    expect(await reader(kv).getHistory('us10y')).toEqual(history);
    expect(await reader(kv).getStatus()).toEqual(status);
  });

  it('reads absent keys as undefined (before the first ingestion run)', async () => {
    const kv = new FakeKV();
    expect(await reader(kv).getSnapshot()).toBeUndefined();
    expect(await reader(kv).getHistory('us10y')).toBeUndefined();
    expect(await reader(kv).getStatus()).toBeUndefined();
  });

  it('treats poisoned entries as absent (rule #3 — never render garbage)', async () => {
    const kv = new FakeKV();
    await kv.put('insights:snapshot', '{"generatedAt":not-json');
    await kv.put('insights:hist:us10y', JSON.stringify({ v: 1, id: 'us10y', points: [[5, 1], [3, 2]] }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await reader(kv).getSnapshot()).toBeUndefined();
    expect(await reader(kv).getHistory('us10y')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

/* ------------------------------------------------------------------ *
 * The three section readers (QA audit C-5 — they had zero tests):
 * round-trip + poisoned-entry + the KV cacheTtl contract that D-13
 * pinned (KV cacheTtl must equal the route's s-maxage or the KV edge
 * cache keeps regenerating stale responses after an edge TTL change).
 * ------------------------------------------------------------------ */

/** KV fake that records the options each get() was called with. */
class RecordingKV {
  readonly calls: Array<{ key: string; opts?: { cacheTtl?: number } }> = [];
  private readonly entries = new Map<string, string>();

  async get(key: string, opts?: { cacheTtl?: number }): Promise<string | null> {
    this.calls.push({ key, opts });
    return this.entries.get(key) ?? null;
  }

  put(key: string, value: string): Promise<void> {
    this.entries.set(key, value);
    return Promise.resolve();
  }
}

const marketsSnapshot = {
  v: 1,
  generatedAt: '2026-10-12T23:31:00Z',
  markets: [
    {
      id: 'sp500', asOf: '2026-10-12', close: 5000, chg1d: 0.5, chg1w: 0.4, chg1m: 1.2, chg3m: 3,
      high52w: 5100, low52w: 4500, fromHigh: -2, rangePos: 85, trend: 'up',
      status: 'normal', source: 'eodhd', stale: false, weekly: [[0, 4500], [7, 4600]],
    },
  ],
  summary: { count: 1, roseToday: 1, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
};

const fxSnapshot = {
  v: 1,
  generatedAt: '2026-10-13T17:01:00Z',
  dollarMeasure: {
    asOf: '2026-10-13', value: 100,
    chg: { d1: 0, m1: 0, m3: 0, y1: 0 }, weekly: [[0, 100], [7, 101]],
  },
  pairs: [
    {
      id: 'eurusd', asOf: '2026-10-13', rate: 1.08,
      chg: { d1: 0.1, m1: -1, m3: -2, y1: 3 }, moveRank: 40, bigMove: false,
      source: 'frankfurter', stale: false, weekly: [[0, 1.05], [7, 1.06]],
    },
  ],
  rules: [
    {
      id: 'r1_risk_mood', outcome: 'quiet', counted: false, numbers: {}, confirmedBy: [],
      progress: 0, legs: [],
      pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
      chart: { expect: 'together', series: [] },
    },
  ],
  summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
};

const pricesSnapshot = {
  v: 1,
  generatedAt: '2026-10-12T12:13:00Z',
  assets: {
    brent: { value: 107.5, asOf: '2026-10-12', sourceSymbol: 'BZ=F', updatedAt: '2026-10-12T12:13:00Z' },
  },
};

describe('KvMarketsReader (audit C-5)', () => {
  it('round-trips a valid snapshot and reads with cacheTtl 300 (D-13 contract)', async () => {
    const kv = new RecordingKV();
    await kv.put('insights:markets:v1', JSON.stringify(marketsSnapshot));
    const got = await new KvMarketsReader(kv as unknown as KVNamespace).getMarkets();
    expect(got).toEqual(marketsSnapshot);
    expect(kv.calls[0]).toEqual({ key: 'insights:markets:v1', opts: { cacheTtl: 300 } });
  });

  it('treats poisoned entries as absent — malformed JSON and wrong shape', async () => {
    const kv = new RecordingKV();
    await kv.put('insights:markets:v1', 'not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await new KvMarketsReader(kv as unknown as KVNamespace).getMarkets()).toBeUndefined();
    await kv.put('insights:markets:v1', JSON.stringify({ v: 1, generatedAt: '2026-10-12T23:31:00Z', markets: [], summary: { count: 5 } }));
    expect(await new KvMarketsReader(kv as unknown as KVNamespace).getMarkets()).toBeUndefined();
    warn.mockRestore();
  });

  it('reads an absent key as undefined', async () => {
    const kv = new RecordingKV();
    expect(await new KvMarketsReader(kv as unknown as KVNamespace).getMarkets()).toBeUndefined();
  });
});

describe('KvFxReader (audit C-5)', () => {
  it('round-trips a valid snapshot and reads with cacheTtl 300 (D-13 contract)', async () => {
    const kv = new RecordingKV();
    await kv.put('insights:fx:v1', JSON.stringify(fxSnapshot));
    const got = await new KvFxReader(kv as unknown as KVNamespace).getFx();
    expect(got).toEqual(fxSnapshot);
    expect(kv.calls[0]).toEqual({ key: 'insights:fx:v1', opts: { cacheTtl: 300 } });
  });

  it('treats poisoned entries as absent — malformed JSON and wrong shape', async () => {
    const kv = new RecordingKV();
    await kv.put('insights:fx:v1', '{"v":1,'.repeat(3));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await new KvFxReader(kv as unknown as KVNamespace).getFx()).toBeUndefined();
    await kv.put('insights:fx:v1', JSON.stringify({ v: 2, pairs: [] }));
    expect(await new KvFxReader(kv as unknown as KVNamespace).getFx()).toBeUndefined();
    warn.mockRestore();
  });
});

describe('KvPricesReader (audit C-5)', () => {
  it('round-trips a valid snapshot and reads with cacheTtl 60 (matches max-age=60)', async () => {
    const kv = new RecordingKV();
    await kv.put('insights:prices-live:v1', JSON.stringify(pricesSnapshot));
    const got = await new KvPricesReader(kv as unknown as KVNamespace).getLivePrices();
    expect(got).toEqual(pricesSnapshot);
    expect(kv.calls[0]).toEqual({ key: 'insights:prices-live:v1', opts: { cacheTtl: 60 } });
  });

  it('treats poisoned entries as absent', async () => {
    const kv = new RecordingKV();
    await kv.put('insights:prices-live:v1', 'nope');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await new KvPricesReader(kv as unknown as KVNamespace).getLivePrices()).toBeUndefined();
    warn.mockRestore();
  });
});
