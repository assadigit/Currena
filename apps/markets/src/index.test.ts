/**
 * index.test.ts — the currena-markets Worker's 24-hour budget test
 * (build step 8, spec §9): a simulated Tuesday→Thursday drives the EXACT
 * production path (runScheduledMarkets over a fake KV + fake providers),
 * asserting the free-tier promises:
 *
 *   - KV writes: at most 3 per day (in practice 1 — the retry's landing
 *     write; weekends/holidays cost zero);
 *   - provider calls: the main run stays within its ~14 calls and the
 *     EODHD free plan's 20/day (the retry's quota guard re-fetches through
 *     Yahoo when the whole snapshot is old);
 *   - subrequests per invocation (every provider call is one): ≤ 50;
 *   - a bounced write (the daily KV cap saturating ~18:30 UTC) is
 *     non-fatal and the next retry run lands the day's data.
 */

import { describe, expect, it } from 'vitest';
import type { MarketId, MarketsSnapshot } from '@currena/core';
import { MARKETS, ProviderError } from '@currena/insights/markets';
import type { MarketJobFetchers, MarketSeries, KVLike } from '@currena/insights/markets';
import { runScheduledMarkets } from './index';
import { MAIN_CRON, RETRY_CRON } from './crons';

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
  it('main run: first-ever population writes once, ~14 provider calls, ≤50 subrequests', async () => {
    const kv = new FakeKV();
    const world = makeWorld();
    const result = await runScheduledMarkets(env(kv), 'main', {
      fetchers: world.fetchers,
      now: MONDAY_MAIN,
    });
    expect(result.wroteSnapshot).toBe(true);
    expect(result.nothingToStore).toBe(false);
    // 13 EODHD markets + FTSE's guaranteed Yahoo fallback.
    expect(world.calls.length).toBe(14);
    expect(world.calls.filter((c) => c.provider === 'eodhd').length).toBe(13);
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
    expect(retryCalls).toBe(14);
    expect(world.calls.slice(-14).every((c) => c.provider === 'yahoo')).toBe(true);

    // The stored snapshot now carries Tuesday's closes for every market.
    const stored = JSON.parse(kv.map.get('insights:markets:v1')!) as MarketsSnapshot;
    expect(stored.markets.every((m) => m.asOf === '2026-10-13')).toBe(true);
    expect(stored.markets.length).toBe(14);

    // The budget verdict over the simulated 3 days: 2 writes landed (+1
    // bounced attempt) — comfortably ≤3/day; EODHD spent 13+13+0 calls
    // across the three UTC days (≤20 every day); every invocation stayed
    // far below the 50-subrequest cap.
    expect(kv.ops.writes).toBe(3);
    const eodhdMon = world.callsOn('2026-10-12').filter((c) => c.provider === 'eodhd').length;
    const eodhdTue = world.callsOn('2026-10-13').filter((c) => c.provider === 'eodhd').length;
    const eodhdWed = world.callsOn('2026-10-14').filter((c) => c.provider === 'eodhd').length;
    expect(eodhdMon).toBe(13);
    expect(eodhdTue).toBe(13);
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
    expect(world.calls.length).toBe(14);
    expect(world.calls.every((c) => c.provider === 'yahoo')).toBe(true);
    expect(result.wroteSnapshot).toBe(true);
    expect(kv.ops.writes).toBe(1);
  });

  it('the cron expressions match wrangler.jsonc', () => {
    expect(MAIN_CRON).toBe('30 23 * * 1-5');
    expect(RETRY_CRON).toBe('30 1 * * 2-6');
  });
});
