/**
 * The currena-markets scheduled wrapper tests (QA audit C-4 — the wrapper
 * that selects the cron kind and chains markets → fx had zero coverage),
 * rewritten for the 2026-11-24 cron consolidation: the Worker now runs on
 * ONE covering trigger (COVERING_CRON "0,30,50 1,7,8,23 * * *") and the
 * wrapper selects the job by the fire's own scheduled UTC time.
 *
 * Module mocks keep this hermetic: runMarketsUpdate / runFxUpdate /
 * runAuMarketsUpdate are faked at the module boundary (vi.mock) — no
 * Workers, no live sites. The REAL wrapper logic under test: the four
 * covered job windows (main 23:30 Mon–Fri · retry 01:30 Tue–Sat · asia
 * 08:50 Tue–Sat · au 07:00 Mon–Fri, day-of-week guards included), the
 * covering wake (a no-job minute logs one line and skips every job —
 * QA audit A-7's spirit under the consolidation), the AU rung running
 * ALONE, fx-after-markets ordering, and the fault isolation between the
 * two chained jobs.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runMarketsUpdate = vi.hoisted(() => vi.fn());
const runFxUpdate = vi.hoisted(() => vi.fn());
const formatRunReport = vi.hoisted(() => vi.fn(() => 'markets report'));
const formatFxRunReport = vi.hoisted(() => vi.fn(() => 'fx report'));
const defaultFetchers = vi.hoisted(() => vi.fn(() => ({ fetchEodhd: () => {} })));
const defaultFxFetchers = vi.hoisted(() => vi.fn(() => ({ fetchFrankfurter: () => {} })));
const KvMarketsStore = vi.hoisted(() => class { constructor(public kv: unknown) {} });
const KvFxStore = vi.hoisted(() => class { constructor(public kv: unknown) {} });
const runAuMarketsUpdate = vi.hoisted(() => vi.fn());
const formatAuRunReport = vi.hoisted(() => vi.fn(() => 'au report'));
const auDefaultFetcher = vi.hoisted(() => vi.fn(() => ({})));
const KvAuMarketsStore = vi.hoisted(() => class { constructor(public kv: unknown) {} });

vi.mock('@currena/insights/markets', () => ({
  defaultFetchers,
  runMarketsUpdate,
  formatRunReport,
  KvMarketsStore,
}));
vi.mock('@currena/insights/fx', () => ({
  defaultFxFetchers,
  runFxUpdate,
  formatFxRunReport,
  KvFxStore,
}));
vi.mock('@currena/insights/markets-au', () => ({
  auDefaultFetcher,
  runAuMarketsUpdate,
  formatAuRunReport,
  KvAuMarketsStore,
}));

import worker from './index';
import { COVERING_CRON } from './crons';

/* ------------------------------ helpers ------------------------------- */

const fakeKv = {
  get: async () => null,
  put: async () => {},
  delete: async () => {},
};

/** A covering-trigger fire at an exact UTC moment (the wrapper reads only scheduledTime). */
const fireAt = (utc: string): ScheduledController =>
  ({ cron: COVERING_CRON, scheduledTime: Date.parse(utc) }) as unknown as ScheduledController;

// The reference week: 2026-11-16 is a Monday — the day-of-week guards of
// every window are pinned against it.
const MONDAY_MAIN = '2026-11-16T23:30:00Z'; // main window (Mon–Fri)
const TUESDAY_RETRY = '2026-11-17T01:30:00Z'; // retry window (Tue–Sat)
const TUESDAY_AU = '2026-11-17T07:00:00Z'; // au window (Mon–Fri)
const TUESDAY_ASIA = '2026-11-17T08:50:00Z'; // asia window (Tue–Sat)
const TUESDAY_WAKE = '2026-11-17T08:00:00Z'; // a covering wake (no job)
const SATURDAY_MAIN_TIME = '2026-11-21T23:30:00Z'; // a job time OUTSIDE main's Mon–Fri
const SUNDAY_RETRY_TIME = '2026-11-22T01:30:00Z'; // a job time OUTSIDE retry's Tue–Sat
const SUNDAY_ASIA_TIME = '2026-11-22T08:50:00Z'; // a job time OUTSIDE asia's Tue–Sat

const waitUntil = vi.fn();
const ctx = { waitUntil } as unknown as ExecutionContext;
const env = { RATES: fakeKv };

beforeEach(() => {
  vi.clearAllMocks();
  runMarketsUpdate.mockReset();
  runFxUpdate.mockReset();
  runAuMarketsUpdate.mockReset();
  runMarketsUpdate.mockResolvedValue({ wroteSnapshot: false, report: {} });
  runFxUpdate.mockResolvedValue({ wroteSnapshot: false, report: {} });
  runAuMarketsUpdate.mockResolvedValue({ wroteSnapshot: false, report: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Drive the wrapper and await the work it handed to ctx.waitUntil. */
async function runScheduled(utc: string): Promise<void> {
  await worker.scheduled(fireAt(utc), env, ctx);
  expect(waitUntil).toHaveBeenCalled();
  await waitUntil.mock.calls[waitUntil.mock.calls.length - 1]![0] as Promise<void>;
}

describe('window selection (audit A-7 under the consolidation)', () => {
  it('the main window (Mon–Fri 23:30 UTC) runs the markets job as kind "main"', async () => {
    await runScheduled(MONDAY_MAIN);
    expect(runMarketsUpdate).toHaveBeenCalledTimes(1);
    expect(runMarketsUpdate.mock.calls[0]![1]).toBe('main');
  });

  it('the 01:30 retry window (Tue–Sat) runs the markets job as kind "retry"', async () => {
    await runScheduled(TUESDAY_RETRY);
    expect(runMarketsUpdate.mock.calls[0]![1]).toBe('retry');
  });

  it('the 08:50 Asia window (Tue–Sat) is retry-shaped — kind "retry"', async () => {
    await runScheduled(TUESDAY_ASIA);
    expect(runMarketsUpdate).toHaveBeenCalledTimes(1);
    expect(runMarketsUpdate.mock.calls[0]![1]).toBe('retry');
  });

  it('the 07:00 AU window (Mon–Fri) runs the AU job ALONE — no markets job, no fx twin', async () => {
    await runScheduled(TUESDAY_AU);
    expect(runAuMarketsUpdate).toHaveBeenCalledTimes(1);
    expect(runMarketsUpdate).not.toHaveBeenCalled();
    expect(runFxUpdate).not.toHaveBeenCalled();
    // The AU store shares the RATES binding.
    const auStore = (runAuMarketsUpdate.mock.calls[0]![0] as { store: { kv: unknown } }).store;
    expect(auStore.kv).toBe(fakeKv);
  });

  it('an AU failure logs and never rethrows', async () => {
    runAuMarketsUpdate.mockRejectedValue(new Error('Yahoo 429'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runScheduled(TUESDAY_AU)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('arkets-au] run failed'));
    error.mockRestore();
  });

  it('a covering WAKE (a no-job minute) logs one line and skips every job entirely', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await worker.scheduled(fireAt(TUESDAY_WAKE), env, ctx);
    expect(waitUntil).not.toHaveBeenCalled();
    expect(runMarketsUpdate).not.toHaveBeenCalled();
    expect(runFxUpdate).not.toHaveBeenCalled();
    expect(runAuMarketsUpdate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('arkets] covering-cron wake at 08:00 UTC (day 2)'));
    log.mockRestore();
  });

  it("a job time outside its day-of-week window is a WAKE: Saturday 23:30 is NOT the main run", async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await worker.scheduled(fireAt(SATURDAY_MAIN_TIME), env, ctx);
    expect(waitUntil).not.toHaveBeenCalled();
    expect(runMarketsUpdate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('covering-cron wake at 23:30'));
    log.mockRestore();
  });

  it('a job time outside its day-of-week window is a WAKE: Sunday 01:30 is NOT the retry run', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await worker.scheduled(fireAt(SUNDAY_RETRY_TIME), env, ctx);
    expect(runMarketsUpdate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('covering-cron wake at 01:30'));
    log.mockRestore();
  });

  it('a job time outside its day-of-week window is a WAKE: Sunday 08:50 is NOT the Asia run', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await worker.scheduled(fireAt(SUNDAY_ASIA_TIME), env, ctx);
    expect(runMarketsUpdate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('covering-cron wake at 08:50'));
    log.mockRestore();
  });
});

describe('markets → fx chaining + fault isolation', () => {
  it('the fx job runs AFTER the markets job settles, inside one invocation', async () => {
    await runScheduled(MONDAY_MAIN);
    expect(runMarketsUpdate).toHaveBeenCalledTimes(1);
    expect(runFxUpdate).toHaveBeenCalledTimes(1);
    // Ordering: the markets call's invocation order precedes the fx one.
    expect((runMarketsUpdate.mock.invocationCallOrder[0] ?? 0)).toBeLessThan(
      runFxUpdate.mock.invocationCallOrder[0] ?? Infinity,
    );
    // The stores share the RATES binding.
    const marketsStore = (runMarketsUpdate.mock.calls[0]![0] as { store: { kv: unknown } }).store;
    const fxStore = (runFxUpdate.mock.calls[0]![0] as { store: { kv: unknown } }).store;
    expect(marketsStore.kv).toBe(fakeKv);
    expect(fxStore.kv).toBe(fakeKv);
  });

  it('a markets failure still lets the fx job run — never rethrows', async () => {
    runMarketsUpdate.mockRejectedValue(new Error('KV write cap'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runScheduled(MONDAY_MAIN)).resolves.toBeUndefined();

    expect(runFxUpdate).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('main run failed'));
    error.mockRestore();
  });

  it('an fx failure resolves quietly — the stored markets snapshot survives', async () => {
    runFxUpdate.mockRejectedValue(new Error('Frankfurter down'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runScheduled(TUESDAY_RETRY)).resolves.toBeUndefined();

    expect(runMarketsUpdate).toHaveBeenCalledTimes(1); // its work completed
    expect(error).toHaveBeenCalledWith(expect.stringContaining('fx] run failed'));
    error.mockRestore();
  });
});
