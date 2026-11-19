/**
 * premium-history.test.ts — GPE R30 / F3b (2026-11-19): Bridge-2's engine
 * tests — the pure derivations (the backfill join, the merge upsert, the
 * deciles, the EXACT identity strip) + the store round-trip + the daily
 * rung's fail-closed guards. The backfill legs ride the four
 * live-captured scraper fixtures (captured 2026-11-19, the S16 M1 probe
 * — tests NEVER hit live sites, AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import type { GoldPremiumDay, Snapshot } from '@currena/core';
import { GoldPremiumHistorySnapshotSchema } from '@currena/core';
import historyLegs from '../../../fixtures/s16/tgju-history-legs-2026-11-19.json';
import {
  assembleGoldPremiumHistory,
  attributionLegsOfDay,
  attributionLegsOfPremium,
  attributionStrip,
  buildPremiumBackfill,
  liveDayFromSnapshot,
  mergeDays,
  premiumDeciles,
  premiumSeries,
  runGoldPremiumHistoryIngest,
  tehranDateOf,
  tehranDayOfCapture,
  GOLD_PREMIUM_KV_KEY,
  KvGoldPremiumStore,
  PREMIUM_DECILE_MIN_BASE,
  type AttributionLegs,
  type GoldPremiumStore,
} from './premium-history';

const PARSED_NOW = new Date('2026-11-19T15:30:00Z');

// The legs fixture is a VERBATIM EXTRACTION of the four live-captured
// scraper fixtures through the production parser (recorded 2026-11-19 —
// the s16 M1 probe pages; regenerate from packages/scraper/fixtures/
// tgju-history-*.html). Typed through the parser's own row shape.
const LEGS = {
  emami: historyLegs.sekee as unknown as import('@currena/scraper').TgjuHistoryRow[],
  bahar: historyLegs.sekeb as unknown as import('@currena/scraper').TgjuHistoryRow[],
  ounce: historyLegs.ons as unknown as import('@currena/scraper').TgjuHistoryRow[],
  dollar: historyLegs.price_dollar_rl as unknown as import('@currena/scraper').TgjuHistoryRow[],
};

/** A live-ish snapshot for the rung tests (the 2026-11-19 evening shape). */
function syntheticSnapshot(fetchedAt = '2026-11-19T20:32:00Z'): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', rate: 1, unit: 'TOMAN', symbol: '﷼' },
      { code: 'USD', name: 'US Dollar', rate: 1 / 266_330, symbol: '$' },
    ],
    gold: [
      { id: 'gold-ounce', unit: 'USD', price: 3_696.72 },
      { id: 'coin-emami', unit: 'TOMAN', price: 250_740_000 },
      { id: 'coin-bahar', unit: 'TOMAN', price: 240_750_000 },
    ],
  } as unknown as Snapshot;
}

describe('tehranDateOf / tehranDayOfCapture', () => {
  it('maps UTC moments to the Tehran calendar day (UTC+3:30, no DST)', () => {
    // 2026-11-19 15:00 UTC = 18:30 Tehran same day.
    expect(tehranDateOf(new Date('2026-11-19T15:00:00Z'))).toBe('2026-11-19');
    // 2026-11-19 20:29 UTC = 23:59 Tehran 11-19; one minute later it is 11-20.
    expect(tehranDateOf(new Date('2026-11-19T20:29:00Z'))).toBe('2026-11-19');
    expect(tehranDateOf(new Date('2026-11-19T20:31:00Z'))).toBe('2026-11-20');
  });

  it('the capture day rule: around midnight the day that JUST ENDED; mid-day the current day', () => {
    // The 00:03 Tehran rung (20:33 UTC) captures the day that just ended.
    expect(tehranDayOfCapture(new Date('2026-11-19T20:33:00Z'))).toBe('2026-11-19');
    // A mid-day runner invocation (15:00 UTC = 18:30 Tehran) captures the current day.
    expect(tehranDayOfCapture(new Date('2026-11-19T15:00:00Z'))).toBe('2026-11-19');
    // 23:50 Tehran invocation → still the current (soon-to-end) day.
    expect(tehranDayOfCapture(new Date('2026-11-19T20:20:00Z'))).toBe('2026-11-19');
  });
});

describe('buildPremiumBackfill (the four live-captured legs)', () => {
  it('inner-joins the four legs: 24 common days, 2026-10-15 → 2026-11-18, Mon–Thu only', () => {
    const built = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history');
    expect(built).not.toBeNull();
    const { days, info } = built!;
    expect(info.days).toBe(24);
    expect(info.from).toBe('2026-10-15');
    expect(info.to).toBe('2026-11-18');
    expect(info.sourceUrl).toBe('https://www.tgju.org/profile/sekee/history');
    expect(days).toHaveLength(24);
    expect(days[0]!.date).toBe('2026-10-15');
    expect(days[23]!.date).toBe('2026-11-18');
    // Every day carries both coins + the three legs.
    for (const day of days) {
      expect(day.source).toBe('backfill');
      expect(day.coins.map((c) => c.id)).toEqual(['coin-emami', 'coin-bahar']);
      expect(day.tomanPerOunce).toBeCloseTo(day.ounceUsd * day.dollarToman, 6);
    }
  });

  it('reproduces the specs\' own recorded values EXACTLY (the s1/11 §5 reconciliation)', () => {
    const { days } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const nov16 = days.find((d) => d.date === '2026-11-16')!;
    // The s1/11 §5 probe values: dollar 268,705 toman, Emami market 250,555,000.
    expect(nov16.dollarToman).toBe(268_705);
    expect(nov16.coins.find((c) => c.id === 'coin-emami')!.marketToman).toBe(250_555_000);
    // The M1 §4 hand check: +2.48% Emami, −1.26% Bahar on 2026-11-16.
    expect(nov16.coins.find((c) => c.id === 'coin-emami')!.premiumPct).toBeCloseTo(2.48, 2);
    expect(nov16.coins.find((c) => c.id === 'coin-bahar')!.premiumPct).toBeCloseTo(-1.26, 2);
    const nov18 = days.find((d) => d.date === '2026-11-18')!;
    // The M1 §4 hand check: the ounce's −3.1% day, the premium absorbing it.
    expect(nov18.coins.find((c) => c.id === 'coin-emami')!.premiumPct).toBeCloseTo(7.33, 2);
    expect(nov18.coins.find((c) => c.id === 'coin-bahar')!.premiumPct).toBeCloseTo(3.06, 2);
  });

  it('skips days any leg lacks (the honest inner join — 2026-11-14/15 Sat/Sun absent)', () => {
    const { days } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const dates = new Set(days.map((d) => d.date));
    expect(dates.has('2026-11-14')).toBe(false); // Saturday — the ounce leg has no row
    expect(dates.has('2026-11-15')).toBe(false); // Sunday — same
    expect(dates.has('2026-11-13')).toBe(false); // Friday — the Tehran legs have no row
    expect(dates.has('2026-11-12')).toBe(true); // Thursday — both markets open
  });

  it('fails closed when the join has fewer than 2 days', () => {
    const one = LEGS.emami.slice(0, 1).map((r) => r);
    const built = buildPremiumBackfill(
      { emami: one, bahar: one, ounce: LEGS.ounce.filter((r) => r.date === one[0]!.date), dollar: LEGS.dollar.filter((r) => r.date === one[0]!.date) },
      PARSED_NOW,
      'https://www.tgju.org/profile/sekee/history',
    );
    expect(built).toBeNull();
  });
});

describe('liveDayFromSnapshot', () => {
  it('computes the day row from one coherent snapshot (the board\'s own computation)', () => {
    const day = liveDayFromSnapshot(syntheticSnapshot(), new Date('2026-11-19T20:33:00Z'))!;
    expect(day.date).toBe('2026-11-19');
    expect(day.source).toBe('live');
    expect(day.ounceUsd).toBe(3_696.72);
    expect(day.dollarToman).toBeCloseTo(266_330, 0);
    expect(day.tomanPerOunce).toBeCloseTo(3_696.72 * 266_330, 0);
    expect(day.coins.map((c) => c.id)).toEqual(['coin-emami', 'coin-bahar']);
    // intrinsic Emami = tpo × 7.3224 / 31.1034768
    const intrinsicEmami = (day.tomanPerOunce * 7.3224) / 31.1034768;
    expect(day.coins[0]!.intrinsicToman).toBeCloseTo(intrinsicEmami, 0);
    expect(day.coins[0]!.premiumPct).toBeCloseTo(((250_740_000 - intrinsicEmami) / intrinsicEmami) * 100, 6);
    expect(day.fetchedAt).toBe('2026-11-19T20:32:00Z');
  });

  it('fails closed with no gold plane, no dollar leg, or no ounce leg', () => {
    const noGold = { ...syntheticSnapshot(), gold: [] } as unknown as Snapshot;
    expect(liveDayFromSnapshot(noGold, PARSED_NOW)).toBeNull();
    const noUsd = syntheticSnapshot();
    (noUsd as { rates: unknown }).rates = [{ code: 'IRR', rate: 1 }];
    expect(liveDayFromSnapshot(noUsd, PARSED_NOW)).toBeNull();
    const noOunce = syntheticSnapshot();
    (noOunce as { gold: unknown }).gold = syntheticSnapshot().gold!.filter((g) => g.id !== 'gold-ounce');
    expect(liveDayFromSnapshot(noOunce, PARSED_NOW)).toBeNull();
  });
});

describe('mergeDays (the S16-D2 upsert)', () => {
  const base: GoldPremiumDay[] = [
    {
      date: '2026-11-17', source: 'backfill', fetchedAt: '2026-11-19T15:30:00Z',
      ounceUsd: 3_846.32, dollarToman: 266_710, tomanPerOunce: 3_846.32 * 266_710,
      coins: [{ id: 'coin-emami', marketToman: 251_510_000, intrinsicToman: 241_506_722, premiumToman: 10_003_278, premiumPct: 4.14 }],
    },
    {
      date: '2026-11-18', source: 'backfill', fetchedAt: '2026-11-19T15:30:00Z',
      ounceUsd: 3_725.8, dollarToman: 266_330, tomanPerOunce: 3_725.8 * 266_330,
      coins: [{ id: 'coin-emami', marketToman: 250_740_000, intrinsicToman: 233_606_078, premiumToman: 17_133_922, premiumPct: 7.33 }],
    },
  ];

  it('appends a new date and reports changed', () => {
    const live: GoldPremiumDay = {
      date: '2026-11-19', source: 'live', fetchedAt: '2026-11-19T20:32:00Z',
      ounceUsd: 3_696.72, dollarToman: 266_330, tomanPerOunce: 3_696.72 * 266_330,
      coins: [{ id: 'coin-emami', marketToman: 250_740_000, intrinsicToman: 231_783_000, premiumToman: 18_957_000, premiumPct: 8.18 }],
    };
    const merged = mergeDays(base, [live]);
    expect(merged.changed).toBe(true);
    expect(merged.days.map((d) => d.date)).toEqual(['2026-11-17', '2026-11-18', '2026-11-19']);
    expect(merged.days[2]!.source).toBe('live');
  });

  it('a content-identical row is a no-op (write-if-changed)', () => {
    const twin = JSON.parse(JSON.stringify(base[1])) as GoldPremiumDay;
    const merged = mergeDays(base, [twin]);
    expect(merged.changed).toBe(false);
    expect(merged.days).toHaveLength(2);
  });

  it('a live row REPLACES a backfill row of the same date (never the reverse)', () => {
    const liveSameDate: GoldPremiumDay = {
      ...base[1]!,
      source: 'live',
      fetchedAt: '2026-11-19T20:32:00Z',
    };
    const merged = mergeDays(base, [liveSameDate]);
    expect(merged.changed).toBe(true);
    expect(merged.days.find((d) => d.date === '2026-11-18')!.source).toBe('live');

    const backfillAgain: GoldPremiumDay = {
      ...base[0]!,
      source: 'backfill',
      coins: [{ id: 'coin-emami', marketToman: 999, intrinsicToman: 1, premiumToman: 998, premiumPct: 99_800 }],
    };
    const storedLive: GoldPremiumDay = { ...base[0]!, source: 'live' };
    const merged2 = mergeDays([storedLive], [backfillAgain]);
    expect(merged2.changed).toBe(false);
    expect(merged2.days[0]!.source).toBe('live');
  });

  it('fetchedAt differences alone are NOT a content change (the stamp is not the row)', () => {
    const later: GoldPremiumDay = { ...base[1]!, fetchedAt: '2026-11-20T00:03:00Z' };
    const merged = mergeDays(base, [later]);
    expect(merged.changed).toBe(false);
  });
});

describe('assembleGoldPremiumHistory + the store', () => {
  it('assembles a schema-valid snapshot with asOf + the backfill record', () => {
    const { days, info } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const snapshot = assembleGoldPremiumHistory(days, PARSED_NOW, info)!;
    expect(snapshot.asOf).toBe('2026-11-18');
    expect(snapshot.backfill?.days).toBe(24);
    expect(() => GoldPremiumHistorySnapshotSchema.parse(snapshot)).not.toThrow();
  });

  it('round-trips through the KV store', async () => {
    const kv = new Map<string, string>();
    const store: GoldPremiumStore = new KvGoldPremiumStore({
      get: async (k) => kv.get(k) ?? null,
      put: async (k, v) => {
        kv.set(k, v);
      },
    });
    const { days, info } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const snapshot = assembleGoldPremiumHistory(days, PARSED_NOW, info)!;
    await store.writeGoldPremiumHistory(snapshot);
    expect(kv.has(GOLD_PREMIUM_KV_KEY)).toBe(true);
    const read = await store.getGoldPremiumHistory();
    expect(read?.days).toHaveLength(24);
    expect(read?.asOf).toBe('2026-11-18');
  });
});

describe('premiumSeries + premiumDeciles (the S16-D4 posture)', () => {
  it('extracts the per-coin series with each point\'s provenance', () => {
    const { days } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const emami = premiumSeries(days, 'coin-emami');
    expect(emami).toHaveLength(24);
    expect(emami[0]).toMatchObject({ date: '2026-10-15', source: 'backfill' });
    expect(emami[23]!.date).toBe('2026-11-18');
    const bahar = premiumSeries(days, 'coin-bahar');
    expect(bahar[23]!.premiumPct).toBeCloseTo(3.06, 2);
  });

  it('the decile waits for the 30-point base (the R19 posture) — the launch basis renders its waiting line', () => {
    const { days } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const emami = premiumSeries(days, 'coin-emami');
    const deciles = premiumDeciles(emami)!;
    expect(deciles.decile).toBeNull();
    expect(deciles.band).toBeNull();
    expect(deciles.basis).toBeNull();
    expect(deciles.currentPct).toBeCloseTo(7.33, 2);
  });

  it('computes the decile + band over a ≥30-point base, the current point EXCLUDED', () => {
    // 40 synthetic points: 1..40; the current = 50 (above all).
    const series = Array.from({ length: 40 }, (_, i) => ({
      date: `2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      premiumPct: i + 1,
      source: 'live' as const,
    }));
    series.push({ date: '2026-02-12', premiumPct: 50, source: 'live' });
    const deciles = premiumDeciles(series)!;
    expect(deciles.basis!.points).toBe(40);
    expect(deciles.basis!.from).toBe(series[0]!.date);
    expect(deciles.basis!.to).toBe(series[40]!.date);
    // All 40 base points are strictly below 50 → decile 1.0.
    expect(deciles.decile).toBe(1);
    expect(deciles.band!.min).toBe(1);
    expect(deciles.band!.max).toBe(40);
    expect(deciles.band!.median).toBe(20); // nearest-rank median of 1..40
    expect(deciles.band!.p10).toBe(4);
    expect(deciles.band!.p90).toBe(36);
  });

  it('the decile base boundary is exactly PREMIUM_DECILE_MIN_BASE', () => {
    expect(PREMIUM_DECILE_MIN_BASE).toBe(30);
  });
});

describe('attributionStrip (the EXACT identity, s7/01 §8)', () => {
  it('decomposes the day move exactly — the three factors\' product IS the coin move', () => {
    // 2026-11-17 → 2026-11-18 over the real backfilled legs (Emami).
    const base: AttributionLegs = { ounceUsd: 3_846.32, dollarToman: 266_710, premiumPct: 4.1417 };
    const current: AttributionLegs = { ounceUsd: 3_725.8, dollarToman: 266_330, premiumPct: 7.3325 };
    const strip = attributionStrip(base, current)!;
    // The identity: (1+coin) = (1+oz)·(1+usd)·(1+p) — exact.
    const coinFromFactors = (1 + strip.ouncePct / 100) * (1 + strip.dollarPct / 100) * (1 + strip.premiumPct / 100);
    expect(coinFromFactors - 1).toBeCloseTo(strip.coinMovePct / 100, 12);
    expect(Math.abs(strip.residualLn)).toBeLessThan(1e-12);
    // The ounce factor is the day's big mover (−3.1%), the premium absorbs it.
    expect(strip.ouncePct).toBeCloseTo(-3.13, 2);
    expect(strip.premiumPct).toBeCloseTo(3.06, 2);
    // And the coin itself barely moved (−0.31%).
    expect(strip.coinMovePct).toBeCloseTo(-0.31, 2);
  });

  it('fails closed on non-positive legs or a premium at/below −100%', () => {
    expect(attributionStrip({ ounceUsd: 0, dollarToman: 1, premiumPct: 1 }, { ounceUsd: 1, dollarToman: 1, premiumPct: 1 })).toBeNull();
    expect(attributionStrip({ ounceUsd: 1, dollarToman: 1, premiumPct: 1 }, { ounceUsd: -5, dollarToman: 1, premiumPct: 1 })).toBeNull();
    expect(attributionStrip({ ounceUsd: 1, dollarToman: 1, premiumPct: -100 }, { ounceUsd: 1, dollarToman: 1, premiumPct: 1 })).toBeNull();
    expect(attributionStrip({ ounceUsd: 1, dollarToman: 1, premiumPct: 1 }, { ounceUsd: 1, dollarToman: 1, premiumPct: -150 })).toBeNull();
    expect(attributionStrip({ ounceUsd: 1, dollarToman: 1, premiumPct: Number.NaN }, { ounceUsd: 1, dollarToman: 1, premiumPct: 1 })).toBeNull();
  });

  it('the day-legs + live-legs adapters carry the three factors from each side', () => {
    const { days } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const lastDay = days[days.length - 1]!;
    const base = attributionLegsOfDay(lastDay, 'coin-emami')!;
    expect(base).toEqual({ ounceUsd: 3_725.8, dollarToman: 266_330, premiumPct: lastDay.coins[0]!.premiumPct });
    expect(attributionLegsOfDay(lastDay, 'coin-half')).toBeNull();

    const live = attributionLegsOfPremium(
      { ounceUsd: 3_696.72, dollarToman: 266_330, rows: [{ id: 'coin-emami', premiumPct: 8.18 }] },
      'coin-emami',
    )!;
    expect(live.ounceUsd).toBe(3_696.72);
    expect(attributionLegsOfPremium({ ounceUsd: null, dollarToman: null, rows: [] }, 'coin-emami')).toBeNull();
  });
});

describe('runGoldPremiumHistoryIngest (the daily rung)', () => {
  function memoryStore(initial?: GoldPremiumDay[]): { store: GoldPremiumStore; days: () => GoldPremiumDay[]; writes: () => number } {
    let days = initial ? [...initial] : [];
    let writeCount = 0;
    const snapshotOf = (): import('@currena/core').GoldPremiumHistorySnapshot | undefined =>
      days.length >= 2
        ? ({
            v: 1,
            asOf: days[days.length - 1]!.date,
            fetchedAt: '2026-11-19T20:33:00Z',
            backfill: { from: days[0]!.date, to: days[0]!.date, days: 1, sourceUrl: 'https://www.tgju.org/profile/sekee/history', fetchedAt: '2026-11-19T15:30:00Z' },
            days,
          } as import('@currena/core').GoldPremiumHistorySnapshot)
        : undefined;
    return {
      store: {
        getGoldPremiumHistory: async () => snapshotOf(),
        writeGoldPremiumHistory: async (snap) => {
          writeCount++;
          days = [...snap.days];
        },
      },
      days: () => days,
      writes: () => writeCount,
    };
  }

  it('upserts the day row from a fresh snapshot (write-if-changed)', async () => {
    const { days: backfillDays } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const mem = memoryStore(backfillDays);
    const result = await runGoldPremiumHistoryIngest(mem.store, {
      getSnapshot: async () => syntheticSnapshot(),
      now: new Date('2026-11-19T20:33:00Z'),
    });
    expect(result.outcome.ok).toBe(true);
    expect(result.kv).toEqual({ reads: 1, writes: 1 });
    expect(mem.days()).toHaveLength(25);
    expect(mem.days()[24]!.date).toBe('2026-11-19');
    expect(mem.days()[24]!.source).toBe('live');

    // Re-running with the identical snapshot content → no second write.
    const again = await runGoldPremiumHistoryIngest(mem.store, {
      getSnapshot: async () => syntheticSnapshot(),
      now: new Date('2026-11-19T20:33:00Z'),
    });
    expect(again.outcome.ok).toBe(true);
    expect(again.kv.writes).toBe(0);
  });

  it('writes NOTHING when no snapshot exists (blocked — last-good holds)', async () => {
    const mem = memoryStore();
    const result = await runGoldPremiumHistoryIngest(mem.store, {
      getSnapshot: async () => undefined,
      now: new Date('2026-11-19T20:33:00Z'),
    });
    if (result.outcome.ok) throw new Error('expected the blocked branch');
    expect(result.outcome).toEqual({ ok: false, kind: 'blocked', note: expect.stringContaining('no tgju snapshot') });
    expect(mem.writes()).toBe(0);
  });

  it('writes NOTHING for a >24h-old snapshot (never a stale quote under today\'s date)', async () => {
    const mem = memoryStore();
    const result = await runGoldPremiumHistoryIngest(mem.store, {
      getSnapshot: async () => syntheticSnapshot('2026-11-16T20:32:00Z'),
      now: new Date('2026-11-19T20:33:00Z'),
    });
    if (result.outcome.ok) throw new Error('expected the blocked branch');
    expect(result.outcome.kind).toBe('blocked');
    expect(mem.writes()).toBe(0);
  });

  it('a snapshot read throw is a failed rung, the stored days preserved', async () => {
    const { days: backfillDays } = buildPremiumBackfill(LEGS, PARSED_NOW, 'https://www.tgju.org/profile/sekee/history')!;
    const mem = memoryStore(backfillDays);
    const result = await runGoldPremiumHistoryIngest(mem.store, {
      getSnapshot: async () => {
        throw new Error('KV read blew up');
      },
      now: new Date('2026-11-19T20:33:00Z'),
    });
    if (result.outcome.ok) throw new Error('expected the failed branch');
    expect(result.outcome.kind).toBe('failed');
    expect(mem.days()).toHaveLength(24);
  });
});
