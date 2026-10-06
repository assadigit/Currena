import type { InsightsSnapshot, InsightsStatus, IndicatorHistory } from '@currena/core';
import { describe, expect, it, vi } from 'vitest';
import { KvInsightsReader } from './insights-store';

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
