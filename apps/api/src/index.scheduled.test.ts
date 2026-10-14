/**
 * The keep-warm cron wrapper tests (QA audit C-4 — `runScheduled` had zero
 * coverage; it is the backbone of "always live").
 *
 * Module mocks keep this hermetic: the scrapers and the prices job are
 * faked at the module boundary (vi.mock), the KV binding is an in-memory
 * fake — no Workers, no live sites. The REAL wrapper logic under test:
 * minute routing (tgju every minute, frankfurter on quarter-hours, the
 * live-prices rung at :13), history recording on live scrapes, and the
 * never-rethrow error isolation.
 */

import type { Snapshot } from '@currena/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const scrapeTgju = vi.hoisted(() => vi.fn());
const scrapeFrankfurter = vi.hoisted(() => vi.fn());
const errorToCodeMessage = vi.hoisted(() => vi.fn(() => ({ code: 'scrape_failed', message: 'upstream down' })));
const runPricesUpdate = vi.hoisted(() => vi.fn());
const formatPricesReport = vi.hoisted(() => vi.fn(() => 'prices report'));
const defaultPricesFetchers = vi.hoisted(() => vi.fn(() => ({ fetchBrent: () => {} })));
const KvPricesStore = vi.hoisted(() => class {});

vi.mock('@currena/scraper', () => ({
  scrapeTgju,
  scrapeFrankfurter,
  errorToCodeMessage,
}));
vi.mock('@currena/insights/prices', () => ({
  runPricesUpdate,
  formatPricesReport,
  defaultPricesFetchers,
  KvPricesStore,
}));

const api = await import('./index');
const worker = api.default;

/* --------------------------- fakes + helpers --------------------------- */

function tgjuSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
    ],
  };
}

function frankfurterSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt,
    rates: [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
    ],
  };
}

function makeKv(): { kv: KVNamespace; map: Map<string, string> } {
  const map = new Map<string, string>();
  const kv = {
    get: async (key: string): Promise<string | null> => map.get(key) ?? null,
    put: async (key: string, value: string): Promise<void> => {
      map.set(key, value);
    },
    delete: async (key: string): Promise<void> => {
      map.delete(key);
    },
  } as unknown as KVNamespace;
  return { kv, map };
}

/** A scheduled event at the given UTC minute (2026-10-14, hour 10). */
const eventAtMinute = (minute: number): ScheduledController =>
  ({ cron: '* * * * *', scheduledTime: Date.UTC(2026, 9, 14, 10, minute) }) as unknown as ScheduledController;

let map: Map<string, string>;
let kv: KVNamespace;
const waitUntil = vi.fn();
const ctx = { waitUntil } as unknown as ExecutionContext;

beforeEach(() => {
  vi.clearAllMocks();
  ({ kv, map } = makeKv());
  api.__resetSnapshotMemoForTests();
  scrapeTgju.mockReset();
  scrapeFrankfurter.mockReset();
  runPricesUpdate.mockReset();
  runPricesUpdate.mockResolvedValue({ wroteSnapshot: false, report: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the minute-cron wrapper (keep-warm backbone, audit C-4)', () => {
  it('a quarter-hour tick (minute 0) keep-warms BOTH sources', async () => {
    scrapeTgju.mockResolvedValue(tgjuSnapshot('2026-10-14T10:00:05.000Z'));
    scrapeFrankfurter.mockResolvedValue(frankfurterSnapshot('2026-10-14T10:00:05.000Z'));

    await worker.scheduled(eventAtMinute(0), { RATES: kv }, ctx);

    expect(scrapeTgju).toHaveBeenCalledTimes(1);
    expect(scrapeFrankfurter).toHaveBeenCalledTimes(1);
    // Both snapshots + statuses landed in KV (the ladder's live rung).
    expect(map.has('snapshot:tgju')).toBe(true);
    expect(map.has('snapshot:frankfurter')).toBe(true);
    expect(map.has('status:tgju')).toBe(true);
  });

  it('an off-quarter tick (minute 7) keep-warms ONLY tgju', async () => {
    scrapeTgju.mockResolvedValue(tgjuSnapshot('2026-10-14T10:07:05.000Z'));
    scrapeFrankfurter.mockResolvedValue(frankfurterSnapshot('2026-10-14T10:07:05.000Z'));

    await worker.scheduled(eventAtMinute(7), { RATES: kv }, ctx);

    expect(scrapeTgju).toHaveBeenCalledTimes(1);
    expect(scrapeFrankfurter).not.toHaveBeenCalled();
  });

  it('a LIVE tgju scrape records a history generation (Task 24 wiring)', async () => {
    scrapeTgju.mockResolvedValue(tgjuSnapshot('2026-10-14T10:07:05.000Z'));

    await worker.scheduled(eventAtMinute(7), { RATES: kv }, ctx);

    expect(map.has('history:tgju')).toBe(true);
    const file = JSON.parse(map.get('history:tgju')!) as { gens: Array<{ at: string }> };
    expect(file.gens[0]!.at).toBe('2026-10-14T10:07:05.000Z');
  });

  it('the hourly :13 rung refreshes the live prices (fault-isolated from the ladder)', async () => {
    scrapeTgju.mockResolvedValue(tgjuSnapshot('2026-10-14T10:13:05.000Z'));

    await worker.scheduled(eventAtMinute(13), { RATES: kv }, ctx);

    expect(runPricesUpdate).toHaveBeenCalledTimes(1);
    expect(scrapeTgju).toHaveBeenCalledTimes(1); // the ladder kept running too
  });

  it('a scraping failure never rethrows — the cron resolves and other work still lands', async () => {
    scrapeTgju.mockRejectedValue(new Error('TGJU down'));
    scrapeFrankfurter.mockResolvedValue(frankfurterSnapshot('2026-10-14T10:00:05.000Z'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      worker.scheduled(eventAtMinute(0), { RATES: kv }, ctx),
    ).resolves.toBeUndefined();

    // The failed source left no snapshot; the healthy one still landed.
    expect(map.has('snapshot:tgju')).toBe(false);
    expect(map.has('snapshot:frankfurter')).toBe(true);
    // The failure was recorded in the source's status (operational history).
    expect(map.has('status:tgju')).toBe(true);
    expect(JSON.parse(map.get('status:tgju')!).lastError.code).toBe('scrape_failed');
    warn.mockRestore();
  });

  it('a prices-rung failure never marks the whole invocation failed', async () => {
    scrapeTgju.mockResolvedValue(tgjuSnapshot('2026-10-14T10:13:05.000Z'));
    runPricesUpdate.mockRejectedValue(new Error('yahoo hiccup'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      worker.scheduled(eventAtMinute(13), { RATES: kv }, ctx),
    ).resolves.toBeUndefined();

    expect(map.has('snapshot:tgju')).toBe(true); // the ladder's work survived
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('prices refresh failed'), expect.anything());
    warn.mockRestore();
  });
});
