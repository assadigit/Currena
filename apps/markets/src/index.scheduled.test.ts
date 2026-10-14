/**
 * The currena-markets scheduled wrapper tests (QA audit C-4 — the wrapper
 * that selects the cron kind and chains markets → fx had zero coverage).
 *
 * Module mocks keep this hermetic: runMarketsUpdate / runFxUpdate are
 * faked at the module boundary (vi.mock) — no Workers, no live sites. The
 * REAL wrapper logic under test: main/retry kind selection, the
 * unknown-cron skip (audit A-7), fx-after-markets ordering, and the
 * fault isolation between the two jobs.
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

import worker from './index';
import { MAIN_CRON, RETRY_CRON } from './crons';

/* ------------------------------ helpers ------------------------------- */

const fakeKv = {
  get: async () => null,
  put: async () => {},
  delete: async () => {},
};

const eventWithCron = (cron: string): ScheduledController =>
  ({ cron, scheduledTime: Date.UTC(2026, 9, 14, 23, 30) }) as unknown as ScheduledController;

const waitUntil = vi.fn();
const ctx = { waitUntil } as unknown as ExecutionContext;
const env = { RATES: fakeKv };

beforeEach(() => {
  vi.clearAllMocks();
  runMarketsUpdate.mockReset();
  runFxUpdate.mockReset();
  runMarketsUpdate.mockResolvedValue({ wroteSnapshot: false, report: {} });
  runFxUpdate.mockResolvedValue({ wroteSnapshot: false, report: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Drive the wrapper and await the work it handed to ctx.waitUntil. */
async function runScheduled(cron: string): Promise<void> {
  await worker.scheduled(eventWithCron(cron), env, ctx);
  expect(waitUntil).toHaveBeenCalled();
  await waitUntil.mock.calls[waitUntil.mock.calls.length - 1]![0] as Promise<void>;
}

describe('cron-kind selection (audit A-7)', () => {
  it('the main trigger runs the markets job as kind "main"', async () => {
    await runScheduled(MAIN_CRON);
    expect(runMarketsUpdate).toHaveBeenCalledTimes(1);
    expect(runMarketsUpdate.mock.calls[0]![1]).toBe('main');
  });

  it('the retry trigger runs the markets job as kind "retry"', async () => {
    await runScheduled(RETRY_CRON);
    expect(runMarketsUpdate.mock.calls[0]![1]).toBe('retry');
  });

  it('an UNKNOWN trigger expression logs and skips both jobs entirely', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await worker.scheduled(eventWithCron('0 5 * * *'), env, ctx);
    expect(waitUntil).not.toHaveBeenCalled();
    expect(runMarketsUpdate).not.toHaveBeenCalled();
    expect(runFxUpdate).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('unknown cron expression'));
    error.mockRestore();
  });
});

describe('markets → fx chaining + fault isolation', () => {
  it('the fx job runs AFTER the markets job settles, inside one invocation', async () => {
    await runScheduled(MAIN_CRON);
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

    await expect(runScheduled(MAIN_CRON)).resolves.toBeUndefined();

    expect(runFxUpdate).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('main run failed'));
    error.mockRestore();
  });

  it('an fx failure resolves quietly — the stored markets snapshot survives', async () => {
    runFxUpdate.mockRejectedValue(new Error('Frankfurter down'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runScheduled(RETRY_CRON)).resolves.toBeUndefined();

    expect(runMarketsUpdate).toHaveBeenCalledTimes(1); // its work completed
    expect(error).toHaveBeenCalledWith(expect.stringContaining('fx] run failed'));
    error.mockRestore();
  });
});
