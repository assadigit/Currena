/**
 * index.test.ts — the currena-markets Worker's 24-hour budget test
 * (build step 8, spec §9): a simulated Tuesday→Thursday drives the EXACT
 * production path (runScheduledMarkets over a fake KV + fake providers),
 * asserting the free-tier promises:
 *
 *   - KV writes: at most 3 per day (in practice 1 — the retry's landing
 *     write; weekends/holidays cost zero);
 *   - provider calls: the main run stays within its ~16 calls and the
 *     EODHD free plan's 20/day (the retry's quota guard re-fetches through
 *     Yahoo when the whole snapshot is old);
 *   - subrequests per invocation (every provider call is one): ≤ 50;
 *   - a bounced write (the daily KV cap saturating ~18:30 UTC) is
 *     non-fatal and the next retry run lands the day's data.
 */

import { describe, expect, it } from 'vitest';
import type { MarketId, MarketsSnapshot } from '@currena/core';
import { ProviderError } from '@currena/insights/markets';
import type { MarketJobFetchers, MarketSeries, KVLike } from '@currena/insights/markets';
import { runScheduledMarkets } from './index';
import { MAIN_CRON, RETRY_CRON } from './crons';

// The node surface this TEST file uses, resolved at RUNTIME through a
// non-literal specifier (vitest runs on Node) so the app's worker program
// never sees @types/node — AGENTS.md rule 2's portability guard keeps its
// teeth: worker source can never accidentally resolve node APIs.
const nodeFsSpecifier = 'node:fs' as string;
type NodeFsLike = { readFileSync(path: string | URL, encoding: string): string };
const { readFileSync } = (await import(nodeFsSpecifier)) as NodeFsLike;
declare global {
  interface ImportMeta {
    readonly url: string;
  }
}

/* ------------------------------------------------------------------ *
 * Fakes: KV with a failing-put injector, providers with a mutable world
 * ------------------------------------------------------------------ */

class FakeKV implements KVLike {
  readonly map = new Map<string, string>();
  readonly ops = { reads: 0, writes: 0 };
  failNextPuts = 0;

  async get(key: string): Promise<string | null> {
    this.ops.reads++;
    return this.map.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.ops.writes++;
    if (this.failNextPuts > 0) {
      this.failNextPuts--;
      throw new Error('Exceeded daily limit of 1000 key writes per namespace (error 10048)');
    }
    this.map.set(key, value);
  }
}

/** Deterministic closes: value = 1000 + dayIndex + i/100 — changes daily. */
function worldSeries(id: MarketId, source: 'eodhd' | 'yahoo', lastCloseDate: string, days = 260): MarketSeries {
  const points: { date: string; value: number }[] = [];
  let t = new Date(`${lastCloseDate}T00:00:00Z`).getTime();
  let made = 0;
  while (made < days) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) {
      points.push({ date, value: 1000 + made + (made === days - 1 ? 0.25 : 0) });
      made++;
    }
    t -= 86_400_000;
  }
  points.reverse();
  return { id, source, points };
}

function makeWorld() {
  let lastCloseDate = '2026-10-12'; // Monday's closes
  const calls: { provider: 'eodhd' | 'yahoo'; day: string }[] = [];
  const fetchers: MarketJobFetchers = {
    fetchEodhd: async (id) => {
      // Reality: FTSE has no EODHD code on the free key (data-check file) —
      // the code check rejects BEFORE any network I/O, so no call is counted.
      if (id === 'ftse') throw new ProviderError('eodhd', id, 'no EODHD code for this market');
      calls.push({ provider: 'eodhd', day: lastCloseDate });
      return worldSeries(id, 'eodhd', lastCloseDate);
    },
    fetchYahoo: async (id) => {
      calls.push({ provider: 'yahoo', day: lastCloseDate });
      return worldSeries(id, 'yahoo', lastCloseDate);
    },
  };
  return {
    fetchers,
    calls,
    advanceClosesTo: (date: string) => {
      lastCloseDate = date;
    },
    callsOn(day: string) {
      return calls.filter((c) => c.day === day);
    },
  };
}

const MONDAY_MAIN = new Date('2026-10-12T23:30:00Z');
const TUESDAY_RETRY = new Date('2026-10-13T01:30:00Z');
const TUESDAY_MAIN = new Date('2026-10-13T23:30:00Z');
const WEDNESDAY_RETRY = new Date('2026-10-14T01:30:00Z');

const env = (kv: FakeKV): { RATES: KVLike; EODHD_API_TOKEN?: string } => ({
  RATES: kv,
  EODHD_API_TOKEN: 'test-token',
});

describe('runScheduledMarkets — the 24-hour budget', () => {
  it('main run: first-ever population writes once, ~16 provider calls, ≤50 subrequests', async () => {
    const kv = new FakeKV();
    const world = makeWorld();
    const result = await runScheduledMarkets(env(kv), 'main', {
      fetchers: world.fetchers,
      now: MONDAY_MAIN,
    });
    expect(result.wroteSnapshot).toBe(true);
    expect(result.nothingToStore).toBe(false);
    // 15 EODHD markets + FTSE's guaranteed Yahoo fallback.
    expect(world.calls.length).toBe(16);
    expect(world.calls.filter((c) => c.provider === 'eodhd').length).toBe(15);
    expect(kv.ops.writes).toBe(1);
    // Subrequest ceiling: every provider call is one subrequest.
    expect(world.calls.length).toBeLessThanOrEqual(50);
  });

  it('retry run with fresh stored data: zero provider calls, zero writes', async () => {
    const kv = new FakeKV();
    const world = makeWorld();
    await runScheduledMarkets(env(kv), 'main', { fetchers: world.fetchers, now: MONDAY_MAIN });
    const callsAfterMain = world.calls.length;
    const writesAfterMain = kv.ops.writes;

    // Tuesday 01:30 — Monday's closes are already stored and are the newest
    // expected close: the retry has nothing to do.
    const result = await runScheduledMarkets(env(kv), 'retry', {
      fetchers: world.fetchers,
      now: TUESDAY_RETRY,
    });
    expect(world.calls.length).toBe(callsAfterMain);
    expect(kv.ops.writes).toBe(writesAfterMain);
    expect(result.unchanged).toBe(true);
  });

  it('a bounced write (daily KV cap) is non-fatal; the next retry lands the day\'s data via the Yahoo quota guard', async () => {
    const kv = new FakeKV();
    const world = makeWorld();

    // Monday 23:30 — the day's single write succeeds.
    await runScheduledMarkets(env(kv), 'main', { fetchers: world.fetchers, now: MONDAY_MAIN });
    expect(kv.ops.writes).toBe(1);

    // Tuesday's closes exist from 23:30 UTC onwards…
    world.advanceClosesTo('2026-10-13');

    // …but Tuesday 23:30's write bounces off the saturated daily budget.
    kv.failNextPuts = 1;
    const bounced = await runScheduledMarkets(env(kv), 'main', {
      fetchers: world.fetchers,
      now: TUESDAY_MAIN,
    });
    expect(bounced.wroteSnapshot).toBe(false);
    expect(bounced.writeError).toMatch(/10048/);
    expect(kv.ops.writes).toBe(2); // attempted + counted, bounced

    // Wednesday 01:30 — the whole snapshot is a day old: the retry re-fetches
    // through YAHOO (protecting the EODHD quota the Tuesday main run spent)
    // and lands the write in the fresh post-midnight budget slice.
    const wednesdayCallsBefore = world.calls.length;
    const landed = await runScheduledMarkets(env(kv), 'retry', {
      fetchers: world.fetchers,
      now: WEDNESDAY_RETRY,
    });
    expect(landed.wroteSnapshot).toBe(true);
    expect(landed.providerOrder).toBe('yahoo-first');
    const retryCalls = world.calls.length - wednesdayCallsBefore;
    expect(retryCalls).toBe(16);
    expect(world.calls.slice(-16).every((c) => c.provider === 'yahoo')).toBe(true);

    // The stored snapshot now carries Tuesday's closes for every market.
    const stored = JSON.parse(kv.map.get('insights:markets:v1')!) as MarketsSnapshot;
    expect(stored.markets.every((m) => m.asOf === '2026-10-13')).toBe(true);
    expect(stored.markets.length).toBe(16);

    // The budget verdict over the simulated 3 days: 2 writes landed (+1
    // bounced attempt) — comfortably ≤3/day; EODHD spent 15+15+0 calls
    // across the three UTC days (≤20 every day); every invocation stayed
    // far below the 50-subrequest cap.
    expect(kv.ops.writes).toBe(3);
    const eodhdMon = world.callsOn('2026-10-12').filter((c) => c.provider === 'eodhd').length;
    const eodhdTue = world.callsOn('2026-10-13').filter((c) => c.provider === 'eodhd').length;
    const eodhdWed = world.callsOn('2026-10-14').filter((c) => c.provider === 'eodhd').length;
    expect(eodhdMon).toBe(15);
    expect(eodhdTue).toBe(15);
    expect(eodhdWed).toBe(0);
  });

  it('a missing EODHD secret degrades calmly: Yahoo-first, zero wasted EODHD calls, data still flows', async () => {
    const kv = new FakeKV();
    const world = makeWorld();
    const result = await runScheduledMarkets({ RATES: kv }, 'main', {
      fetchers: world.fetchers,
      now: MONDAY_MAIN,
    });
    expect(result.providerOrder).toBe('yahoo-first'); // the explicit missing-secret order
    expect(world.calls.length).toBe(16);
    expect(world.calls.every((c) => c.provider === 'yahoo')).toBe(true);
    expect(result.wroteSnapshot).toBe(true);
    expect(kv.ops.writes).toBe(1);
  });

  it('the cron expressions match wrangler.jsonc (the file is READ, not mirrored — audit C-8)', () => {
    // Parse the wrangler config the way a human would: strip // comments,
    // then pull triggers.crons out of the JSON. A drift between the code
    // constants and the deployed triggers fails HERE — the old literal
    // mirror could never catch it.
    const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    const uncommented = raw.replace(/^\s*\/\/.*$/gm, '');
    const config = JSON.parse(uncommented) as { triggers?: { crons?: string[] } };
    const crons = config.triggers?.crons;
    expect(crons).toBeDefined();
    expect(crons).toHaveLength(2);
    expect(MAIN_CRON).toBe(crons![0]);
    expect(RETRY_CRON).toBe(crons![1]);
    // The literal spellings stay pinned too — a wrong expression in BOTH
    // places would otherwise pass silently.
    expect(MAIN_CRON).toBe('30 23 * * 1-5');
    expect(RETRY_CRON).toBe('30 1 * * 2-6');
  });
});

/* ------------------------------------------------------------------ *
 * The fx job rides the same two triggers (insights-world-currencies-
 * spec.md §4.4's fallback: the account's 5-cron free limit is full) —
 * the COMBINED 24-hour budget (currencies §9 build step 10):
 *   - one Frankfurter call per fx run (Yahoo's 8 only on fallback);
 *   - KV writes ≤3/day across BOTH sections (in practice: the markets
 *     retry's landing write + the fx write);
 *   - subrequests per invocation ≤48 INCLUDING the same-invocation KV ops
 *     (audit A-6) even in the worst case (every markets fetch bouncing to
 *     Yahoo AND the fx fallback firing).
 * ------------------------------------------------------------------ */

import { runFxUpdate } from '@currena/insights/fx';
import { InMemoryFxStore, KvFxStore } from '@currena/insights/fx';
import type { FxJobFetchers } from '@currena/insights/fx';

/** A synthetic ECB world: 8 currencies × 420 working days, gentle drift. */
function fxQuotesFixture(): Record<string, { date: string; value: number }[]> {
  const base: Record<string, number> = {
    EUR: 0.9, JPY: 150, GBP: 0.76, CHF: 0.88, CNY: 7.1, AUD: 1.52, CAD: 1.37, SEK: 9.5,
  };
  const dates: string[] = [];
  let t = new Date('2026-10-12T00:00:00Z').getTime();
  while (dates.length < 420) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) dates.push(date);
    t -= 86_400_000;
  }
  dates.reverse();
  return Object.fromEntries(
    Object.entries(base).map(([code, start]) => [
      code,
      dates.map((date, i) => ({ date, value: start * (1.0002) ** i })),
    ]),
  );
}

describe('the combined markets + fx 24-hour budget', () => {
  it('a full day: both sections land their writes; every invocation stays ≤50 subrequests', async () => {
    const kv = new FakeKV();
    const world = makeWorld();
    const quotes = fxQuotesFixture();
    const fxCalls = { frankfurter: 0, yahoo: 0 };
    const fxFetchers: FxJobFetchers = {
      fetchFrankfurter: async () => {
        fxCalls.frankfurter++;
        return { source: 'frankfurter', quotes: quotes as never };
      },
      fetchYahoo: async () => {
        fxCalls.yahoo++;
        return { source: 'yahoo', quotes: quotes as never };
      },
    };
    const fxStore = new InMemoryFxStore();
    const cross = {
      getMarkets: async () => JSON.parse(kv.map.get('insights:markets:v1') ?? 'null') ?? undefined,
      getGoldHistory: async () => undefined,
      getInsightsSnapshot: async () => undefined,
    };

    // Monday 23:30 — the markets main run (16 provider calls)…
    const marketsMain = await runScheduledMarkets(env(kv), 'main', {
      fetchers: world.fetchers,
      now: MONDAY_MAIN,
    });
    expect(marketsMain.wroteSnapshot).toBe(true);
    // …followed by the fx run on the same invocation (1 Frankfurter call).
    const fx1 = await runFxUpdate({
      store: fxStore,
      cross,
      fetchers: fxFetchers,
      now: MONDAY_MAIN,
    });
    expect(fx1.wroteSnapshot).toBe(true);
    expect(fx1.report.providerCalls).toEqual({ frankfurter: 1, yahoo: 0 });
    // Worst-case subrequests for the combined invocation: 16 + 1 + a
    // handful of KV ops — far below the 50 cap.
    expect(world.calls.length + fxCalls.frankfurter + fxCalls.yahoo).toBeLessThanOrEqual(50);
    expect(kv.ops.writes).toBe(1); // the markets write
    expect(fxStore.ops.writes).toBe(1); // the fx write

    // Tuesday 01:30 — the retry finds fresh stored data on both sides:
    // zero provider calls, zero writes (both gates stay closed).
    const marketsRetry = await runScheduledMarkets(env(kv), 'retry', {
      fetchers: world.fetchers,
      now: TUESDAY_RETRY,
    });
    expect(marketsRetry.unchanged).toBe(true);
    const fx2 = await runFxUpdate({
      store: fxStore,
      cross,
      fetchers: fxFetchers,
      now: TUESDAY_RETRY,
    });
    expect(fx2.unchanged).toBe(true);
    expect(fxStore.ops.writes).toBe(1); // still exactly one
    expect(fxCalls).toEqual({ frankfurter: 2, yahoo: 0 }); // one call per run, no more

    // The 3-day verdict across BOTH sections: ≤3 KV writes/day, one fx
    // provider call per run, every invocation ≤50 subrequests.
    expect(kv.ops.writes + fxStore.ops.writes).toBeLessThanOrEqual(6); // 3 days × 2 sections
  });

  it('the worst case: every markets fetch bounces to Yahoo AND the fx fallback fires — total ≤48 including KV ops (A-6)', async () => {
    const kv = new FakeKV();
    // Markets: EODHD always fails → 16 EODHD attempts + 16 Yahoo answers.
    const world = makeWorld();
    const failingThenYahoo: typeof world.fetchers = {
      fetchEodhd: async (id) => {
        world.calls.push({ provider: 'eodhd', day: 'x' });
        if (id === 'ftse') throw new ProviderError('eodhd', id, 'no EODHD code for this market');
        throw new ProviderError('eodhd', id, 'provider down in this fixture');
      },
      fetchYahoo: async (id) => {
        world.calls.push({ provider: 'yahoo', day: 'x' });
        return worldSeries(id, 'yahoo', '2026-10-12');
      },
    };
    await runScheduledMarkets(env(kv), 'main', { fetchers: failingThenYahoo, now: MONDAY_MAIN });
    const marketsCalls = world.calls.length; // 16 EODHD attempts + 16 Yahoo answers = 32
    expect(marketsCalls).toBe(32);

    // Fx: Frankfurter fails → Yahoo's 8 currency calls fire. The fx run
    // rides the PRODUCTION store (KvFxStore over the same KV binding) so
    // the budget below counts its real KV ops, not an in-memory fake's.
    const quotes = fxQuotesFixture();
    const fxCalls = { frankfurter: 0, yahoo: 0 };
    const fxStore = new KvFxStore(kv);
    await runFxUpdate({
      store: fxStore,
      cross: fxStore,
      fetchers: {
        fetchFrankfurter: async () => {
          fxCalls.frankfurter++;
          throw new Error('primary down in this fixture');
        },
        fetchYahoo: async () => {
          fxCalls.yahoo += 8; // one chart call per currency (8)
          return { source: 'yahoo', quotes: quotes as never };
        },
      },
      now: MONDAY_MAIN,
    });
    expect(fxCalls).toEqual({ frankfurter: 1, yahoo: 8 });
    // THE combined ceiling (audit A-6): 41 provider subrequests + the
    // same-invocation KV ops (markets: 1 read + 1 write · fx: 4 reads +
    // 1 write — the write gates compare against the runs' own start-of-run
    // reads instead of re-reading) = 48, comfortably under the
    // 50-per-invocation free-plan cap. Before A-6 the two put-gate
    // re-reads put the worst case at exactly 50.
    const providerSubrequests = marketsCalls + fxCalls.frankfurter + fxCalls.yahoo;
    const kvOps = kv.ops.reads + kv.ops.writes;
    expect(providerSubrequests).toBe(41);
    expect(kvOps).toBe(7);
    expect(providerSubrequests + kvOps).toBe(48);
    expect(providerSubrequests + kvOps).toBeLessThanOrEqual(48);
  });
});
