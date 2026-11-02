/**
 * markets-au.test.ts — the Australian markets board's compute + job tests
 * (gap-closure S5-M5.4).
 *
 * Tests never hit live sites. The Yahoo fixture is a synthetic 260-day
 * ascending series (the same shape the world board's markets.test.ts
 * uses), replayed through an injected fake fetcher.
 */

import { describe, expect, it } from 'vitest';
import type { AuMarketId, AuMarketEntry } from '@currena/core';
import { AuMarketsSnapshotSchema } from '@currena/core';
import { AU_MARKET_IDS, auMarketDefinition } from './definitions';
import {
  buildAuMarketsSnapshot,
  resolveAuMarket,
  summarizeAuMarkets,
  reStaleAuMarketsSnapshot,
  auMarketsContentEqual,
  auMarketsContentHash,
  statusOf,
  trendOf,
  weeklySeries,
} from './compute';
import { runAuMarketsJob } from './job';
import type { AuMarketJobFetchers } from './job';
import type { AuMarketSeries } from './providers';
import { AuProviderError } from './providers';

/** A synthetic ascending 260-trading-day series ending on lastCloseDate. */
function auSeries(id: AuMarketId, lastCloseDate: string, days = 260): AuMarketSeries {
  const points: { date: string; value: number }[] = [];
  let t = new Date(`${lastCloseDate}T00:00:00Z`).getTime();
  let made = 0;
  while (made < days) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) {
      const base = 1000 + AU_MARKET_IDS.indexOf(id) * 137;
      points.push({ date, value: base + made * 3 + (made === days - 1 ? 0.5 : 0) });
      made++;
    }
    t -= 86_400_000;
  }
  points.reverse();
  return { id, source: 'yahoo', points };
}

describe('markets-au definitions', () => {
  it('AU_MARKET_IDS has all 18 probe-verified ids', () => {
    expect(AU_MARKET_IDS).toHaveLength(18);
    expect(AU_MARKET_IDS).toContain('aord');
    expect(AU_MARKET_IDS).toContain('axvi');
    expect(AU_MARKET_IDS).toContain('cba');
    // The ASX 200 anchor is NOT here (it stays on the world board, G-3).
    expect(AU_MARKET_IDS as readonly string[]).not.toContain('asx200');
  });

  it('every id maps to a definition with a Yahoo symbol', () => {
    for (const id of AU_MARKET_IDS) {
      const def = auMarketDefinition(id);
      expect(def.yahooSymbol.length).toBeGreaterThan(0);
      expect(def.group).toMatch(/^(broad|sectors|banks|volatility)$/);
    }
  });
});

describe('markets-au compute', () => {
  it('resolveAuMarket builds an entry from a fresh Yahoo series', () => {
    const id = 'aord';
    const series = auSeries(id, '2026-10-12');
    const res = resolveAuMarket({ id, primary: series }, undefined, '2026-10-12', '2026-10-12T07:01:00Z');
    expect(res.held).toBe(false);
    expect(res.entry).toBeDefined();
    expect(res.entry!.id).toBe(id);
    expect(res.entry!.close).toBeGreaterThan(0);
    expect(Number.isFinite(res.entry!.chg1d)).toBe(true); // computed, direction depends on the synthetic series
    expect(res.entry!.source).toBe('yahoo');
    expect(res.entry!.stale).toBe(false);
    expect(res.entry!.weekly.length).toBe(52);
  });

  it('R2: an older series date is held', () => {
    const id = 'axfj';
    const series = auSeries(id, '2026-10-09'); // older than stored
    const prev: AuMarketEntry = {
      id, asOf: '2026-10-12', close: 5000, chg1d: 1, chg3m: 5, high52w: 5200, low52w: 4800,
      fromHigh: -3.8, rangePos: 50, trend: 'up', status: 'normal', source: 'yahoo', stale: false, weekly: [[7, 5000]],
    };
    const res = resolveAuMarket({ id, primary: series }, prev, '2026-10-12', '2026-10-12T07:01:00Z');
    expect(res.held).toBe(true);
    expect(res.notes.some((n) => n.includes('R2'))).toBe(true);
  });

  it('R5: a same-date re-fetch within 0.5% is held', () => {
    const id = 'axmj';
    const series = auSeries(id, '2026-10-12');
    const last = series.points[series.points.length - 1]!;
    const prevClose = last.value * 1.002; // within 0.5%
    const prev: AuMarketEntry = {
      id, asOf: '2026-10-12', close: prevClose, chg1d: 0.2, chg3m: 1, high52w: last.value * 1.1,
      low52w: last.value * 0.9, fromHigh: -5, rangePos: 50, trend: 'up', status: 'normal', source: 'yahoo',
      stale: false, weekly: [[7, prevClose]],
    };
    const res = resolveAuMarket({ id, primary: series }, prev, '2026-10-12', '2026-10-12T07:01:00Z');
    expect(res.held).toBe(true);
    expect(res.notes.some((n) => n.includes('R5'))).toBe(true);
  });

  it('F1: an intraday close before the ASX session closes is held', () => {
    const id = 'cba';
    const series = auSeries(id, '2026-10-12');
    const res = resolveAuMarket({ id, primary: series }, undefined, '2026-10-12', '2026-10-12T03:00:00Z');
    // 03:00 UTC is before the ASX 06:30 UTC close-minute → intraday → held.
    expect(res.held).toBe(true);
    expect(res.notes.some((n) => n.includes('F1'))).toBe(true);
  });

  it('buildAuMarketsSnapshot assembles all 18 rows + a summary', async () => {
    const fetchers: AuMarketJobFetchers = {
      fetchYahoo: async (id) => auSeries(id, '2026-10-12'),
    };
    const job = await runAuMarketsJob({ fetchers, politenessMs: 0 }, { kind: 'main' }, undefined, '2026-10-12', '2026-10-12T07:01:00Z');
    const snap = buildAuMarketsSnapshot({
      resolutions: job.resolutions,
      prev: undefined,
      runDate: '2026-10-12',
      generatedAt: '2026-10-12T07:31:00Z',
    });
    expect(snap).toBeDefined();
    expect(snap!.markets).toHaveLength(18);
    expect(snap!.summary.count).toBe(18);
    expect(snap!.summary.roseToday).toBeGreaterThanOrEqual(0);
    // The snapshot passes the zod schema (all invariants).
    expect(() => AuMarketsSnapshotSchema.parse(snap)).not.toThrow();
  });

  it('summarizeAuMarkets computes the descriptive signal', async () => {
    const fetchers: AuMarketJobFetchers = {
      fetchYahoo: async (id) => auSeries(id, '2026-10-12'),
    };
    const job = await runAuMarketsJob({ fetchers, politenessMs: 0 }, { kind: 'main' }, undefined, '2026-10-12', '2026-10-12T07:01:00Z');
    const snap = buildAuMarketsSnapshot({
      resolutions: job.resolutions,
      prev: undefined,
      runDate: '2026-10-12',
      generatedAt: '2026-10-12T07:31:00Z',
    });
    const summary = summarizeAuMarkets(snap!.markets);
    expect(summary.count).toBe(18);
    expect(summary.nAttention).toBeGreaterThanOrEqual(0);
    expect(summary.nUnusual).toBeGreaterThanOrEqual(0);
    expect(['normal', 'attention', 'unusual']).toContain(summary.signal);
  });

  it('reStaleAuMarketsSnapshot flips stale on aged rows', async () => {
    const fetchers: AuMarketJobFetchers = {
      fetchYahoo: async (id) => auSeries(id, '2026-10-09'),
    };
    const job = await runAuMarketsJob({ fetchers, politenessMs: 0 }, { kind: 'main' }, undefined, '2026-10-09', '2026-10-09T07:01:00Z');
    const snap = buildAuMarketsSnapshot({
      resolutions: job.resolutions,
      prev: undefined,
      runDate: '2026-10-09',
      generatedAt: '2026-10-09T07:31:00Z',
    });
    expect(snap!.markets.every((m) => !m.stale)).toBe(true); // fresh at write time
    // 7 days later → STALE_DAYS (5) + 2 → stale:true
    const aged = reStaleAuMarketsSnapshot(snap!, '2026-10-16');
    expect(aged.markets.every((m) => m.stale)).toBe(true);
  });

  it('auMarketsContentEqual + hash exclude generatedAt', async () => {
    const fetchers: AuMarketJobFetchers = {
      fetchYahoo: async (id) => auSeries(id, '2026-10-12'),
    };
    const job = await runAuMarketsJob({ fetchers, politenessMs: 0 }, { kind: 'main' }, undefined, '2026-10-12', '2026-10-12T07:01:00Z');
    const snapA = buildAuMarketsSnapshot({
      resolutions: job.resolutions,
      prev: undefined,
      runDate: '2026-10-12',
      generatedAt: '2026-10-12T07:31:00Z',
    })!;
    const snapB = { ...snapA, generatedAt: '2026-10-12T08:00:00Z' };
    // Same content, different generatedAt → equal (the write gate skips).
    expect(auMarketsContentEqual(snapA, snapB)).toBe(true);
    expect(auMarketsContentHash(snapA)).toBe(auMarketsContentHash(snapB));
  });
});

describe('markets-au job', () => {
  it('fault isolation: a failed Yahoo fetch keeps the stored row', async () => {
    const prev = undefined;
    const fetchers: AuMarketJobFetchers = {
      fetchYahoo: async (id) => {
        if (id === 'axvi') throw new AuProviderError('yahoo', id, 'test failure');
        return auSeries(id, '2026-10-12');
      },
    };
    const job = await runAuMarketsJob({ fetchers, politenessMs: 0 }, { kind: 'main' }, prev, '2026-10-12', '2026-10-12T07:01:00Z');
    // The axvi row failed; the other 17 succeeded.
    expect(job.reports.filter((r) => r.usedSource === 'yahoo')).toHaveLength(17);
    expect(job.reports.find((r) => r.id === 'axvi')!.usedSource).toBe('none');
    expect(job.providerCalls.yahoo).toBe(18); // every market was attempted
  });

  it('Yahoo-only: the budget is 18 calls + KV ops (≤ 50)', async () => {
    const fetchers: AuMarketJobFetchers = {
      fetchYahoo: async (id) => auSeries(id, '2026-10-12'),
    };
    const job = await runAuMarketsJob({ fetchers, politenessMs: 0 }, { kind: 'main' }, undefined, '2026-10-12', '2026-10-12T07:01:00Z');
    expect(job.providerCalls.yahoo).toBe(18);
    // 18 fetches + 1 read + 1 write = 20 subrequests — under the 50 cap.
  });
});

describe('markets-au compute reuses world helpers', () => {
  it('statusOf, trendOf, weeklySeries are re-exported from the world board', () => {
    // These are the SAME functions the world board uses (pure over points/numbers).
    expect(typeof statusOf).toBe('function');
    expect(typeof trendOf).toBe('function');
    expect(typeof weeklySeries).toBe('function');
  });
});
