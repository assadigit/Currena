/**
 * if-bought.test.ts — GPE R33 / F26 (2026-11-19, S17): the "if you'd
 * bought" calculator's tests — the pure compute (the lump multiple,
 * the MONTHLY DCA at $100 per month-end close, the decile framing over
 * all same-length windows with the R19 min-base posture + the honest
 * waiting line, every window named at point of use), the honest
 * degradations (a year beyond the series reads null, never a guess),
 * the month-turn anchor freeze (the rung's own rule), and the daily
 * rung's fail-closed guards.
 */

import { describe, expect, it } from 'vitest';
import type { GoldIfBoughtAssetSeries, GoldIfBoughtMonth, GoldIfBoughtSnapshot, InsightsSnapshot, MarketsSnapshot } from '@currena/core';
import { GoldIfBoughtSnapshotSchema } from '@currena/core';
import {
  IF_BOUGHT_DECILE_MIN_BASE,
  IF_BOUGHT_DCA_MONTHLY,
  IF_BOUGHT_MAX_SNAPSHOT_AGE_MS,
  ifBoughtResult,
  refreshAssetSeries,
  runGoldIfBoughtRefresh,
  windowCloses,
  type GoldIfBoughtStore,
} from './if-bought';

const NOW = '2026-11-19T04:49:00.000Z';

/** A linear monthly series: ym `2016-11` + i, close from + i·step. */
function linearSeries(fromYm: string, months: number, base: number, step: number, currentClose?: number): GoldIfBoughtAssetSeries {
  const [y0 = 0, m0 = 1] = fromYm.split('-').map(Number);
  const monthly: GoldIfBoughtMonth[] = [];
  for (let i = 0; i < months; i++) {
    const y = y0 + Math.floor((m0 - 1 + i) / 12);
    const m = ((m0 - 1 + i) % 12) + 1;
    monthly.push({ ym: `${y}-${String(m).padStart(2, '0')}`, close: base + i * step });
  }
  // The running month sits AFTER the last anchor.
  const [y1 = 0, m1 = 1] = monthly[monthly.length - 1]!.ym.split('-').map(Number);
  const nextY = y1 + Math.floor(m1 / 12);
  const nextM = (m1 % 12) + 1;
  return {
    monthly,
    current: { ym: `${nextY}-${String(nextM).padStart(2, '0')}`, close: currentClose ?? base + months * step, updatedAt: NOW },
  };
}

describe('ifBoughtResult — the pure compute', () => {
  it('a rising linear series: the lump multiple + the DCA at $100/month, every window named', () => {
    // 120 anchors 2016-11 → 2026-10 rising 100 → 219 (step 1); running
    // 2026-11 at close 220.
    const series = linearSeries('2016-11', 120, 100, 1, 220);
    const result = ifBoughtResult(series, 2016)!;
    expect(result).not.toBeNull();
    expect(result.fromYm).toBe('2016-11');
    expect(result.toYm).toBe('2026-11');
    expect(result.months).toBe(121); // the 120 anchors + the running month
    // The lump: 220 / 100 − 1 = +120%.
    expect(result.lumpPct).toBeCloseTo(120, 6);
    // The DCA: Σ(100 / close_i) units × 220.
    let units = 0;
    const closes = [...series.monthly, { ym: series.current.ym, close: series.current.close }];
    for (const m of closes) units += IF_BOUGHT_DCA_MONTHLY / m.close;
    expect(result.dcaInvested).toBe(12_100); // 121 × $100
    expect(result.dcaValue).toBeCloseTo(units * 220, 6);
    expect(result.dcaPct).toBeCloseTo(((units * 220) / 12_100 - 1) * 100, 6);
  });

  it('"since" a LATER year cuts the window to the first month at/after January (the window named at point of use)', () => {
    const series = linearSeries('2016-11', 120, 100, 1, 220);
    const result = ifBoughtResult(series, 2021)!;
    expect(result.fromYm).toBe('2021-01');
    expect(result.months).toBe(71); // 2021-01 → 2026-11
    // The lump: 220 / (100 + 50) − 1 = +46.67%.
    expect(result.lumpPct).toBeCloseTo(((220 / 150) - 1) * 100, 6);
  });

  it('"since" a year BEYOND the series reads null — never a guess', () => {
    const series = linearSeries('2016-11', 120, 100, 1, 220);
    expect(ifBoughtResult(series, 2027)).toBeNull();
    expect(windowCloses(series, 2030)).toBeNull();
  });

  it('the decile framing: the window\'s lump return among ALL same-length windows (the R19 posture)', () => {
    // A mostly-flat series with ONE early spike window: the CURRENT
    // (last) window's return sits mid-pack among its same-length peers.
    const months: GoldIfBoughtMonth[] = [];
    for (let i = 0; i < 40; i++) {
      const y = 2020 + Math.floor(i / 12);
      const m = (i % 12) + 1;
      months.push({ ym: `${y}-${String(m).padStart(2, '0')}`, close: 100 });
    }
    const series: GoldIfBoughtAssetSeries = {
      monthly: months.slice(0, 39), // 39 anchors
      current: { ym: '2023-04', close: 110, updatedAt: NOW }, // 40th month = the running
    };
    // A 4-month window (2023-01 → 2023-04): 37 same-length windows exist
    // over the 40 points (≥ the min base 30).
    const result = ifBoughtResult(series, 2023)!;
    expect(result.fromYm).toBe('2023-01');
    expect(result.months).toBe(4);
    // All same-length windows except the current are flat (0%), the
    // current is +10% → the TOP decile (10).
    expect(result.decile).toBe(10);
    expect(result.decileBase).toBe(37);
  });

  it('the decile waits honestly under the min base (30 windows)', () => {
    // A 30-anchor series + running: a 30-month window has ONE same-length
    // window — the honest waiting line.
    const series = linearSeries('2021-01', 30, 100, 1, 131);
    const result = ifBoughtResult(series, 2021)!;
    expect(result.months).toBe(31);
    expect(result.decile).toBeNull();
    expect(result.decileBase).toBe(1); // only the current window itself
    expect(IF_BOUGHT_DECILE_MIN_BASE).toBe(30);
  });

  it('a falling series reads honest NEGATIVE returns (both lump + DCA)', () => {
    const series = linearSeries('2023-01', 12, 200, -5, 135);
    const result = ifBoughtResult(series, 2023)!;
    expect(result.lumpPct).toBeCloseTo(((135 / 200) - 1) * 100, 6);
    expect(result.lumpPct).toBeLessThan(0);
    expect(result.dcaPct).toBeLessThan(0);
  });
});

describe('refreshAssetSeries — the month-turn rule', () => {
  const base = linearSeries('2026-08', 3, 100, 1, 104); // anchors 08,09,10; running 11 @ 104

  it('a same-month fresh close updates the running point (write-if-changed)', () => {
    const { asset, changed } = refreshAssetSeries(base, 106, '2026-11', '2026-11-20T04:49:00.000Z');
    expect(changed).toBe(true);
    expect(asset.current.close).toBe(106);
    expect(asset.monthly.length).toBe(3); // no new anchor
    // The identical close is a no-op.
    expect(refreshAssetSeries(asset, 106, '2026-11', NOW).changed).toBe(false);
  });

  it('the month-turn freezes the prior running point as the new anchor + sets the fresh current', () => {
    const { asset, changed } = refreshAssetSeries(base, 108, '2026-12', '2026-12-01T04:49:00.000Z');
    expect(changed).toBe(true);
    expect(asset.monthly.length).toBe(4);
    expect(asset.monthly[3]).toEqual({ ym: '2026-11', close: 104 }); // the frozen prior running point
    expect(asset.current).toEqual({ ym: '2026-12', close: 108, updatedAt: '2026-12-01T04:49:00.000Z' });
  });

  it('a null close keeps the stored point honest (no fresh input — never a guess)', () => {
    const { asset, changed } = refreshAssetSeries(base, null, '2026-11', NOW);
    expect(changed).toBe(false);
    expect(asset).toBe(base);
  });
});

describe('runGoldIfBoughtRefresh — the 04:49 rung', () => {
  const NOW_DATE = new Date(NOW);

  function snapshotFixture(): GoldIfBoughtSnapshot {
    return GoldIfBoughtSnapshotSchema.parse({
      v: 1,
      asOf: '2026-11-18',
      fetchedAt: '2026-11-18T04:49:00.000Z',
      backfill: { from: '2016-11', to: '2026-10', months: 121, sp500Source: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=10y&interval=1d', fetchedAt: '2026-11-18T04:49:00.000Z' },
      assets: {
        gold: linearSeries('2026-08', 3, 2600, 10, 3900),
        silver: linearSeries('2026-08', 3, 44, 0.1, 45),
        btc: linearSeries('2026-08', 3, 60_000, 500, 87_500),
        sp500: linearSeries('2026-08', 3, 5600, 10, 5900),
      },
    });
  }

  function fakeStore(initial: GoldIfBoughtSnapshot) {
    let doc: GoldIfBoughtSnapshot = initial;
    let writes = 0;
    const store: GoldIfBoughtStore = {
      getGoldIfBought: async () => doc,
      writeGoldIfBought: async (next) => {
        writes++;
        doc = next;
      },
    };
    return { store, get writes() { return writes; }, get doc() { return doc; } };
  }

  const projection = (readings: Array<[string, number]>, generatedAt = NOW): InsightsSnapshot =>
    ({
      generatedAt,
      readings: readings.map(([id, value]) => ({ id, value, asOf: '2026-11-18', status: 'normal', sourceName: 's', updatedAt: NOW })),
    }) as unknown as InsightsSnapshot;

  const markets = (close: number): MarketsSnapshot =>
    ({ generatedAt: NOW, markets: [{ id: 'sp500', close }], summary: { count: 1 } }) as unknown as MarketsSnapshot;

  it('refreshes the four running points from the page\'s planes (write-if-changed)', async () => {
    const fake = fakeStore(snapshotFixture());
    const result = await runGoldIfBoughtRefresh(fake.store, {
      getPublicSnapshot: async () => projection([['gold-usd', 3921], ['silver-usd', 44.5], ['btc-usd', 88_000]]),
      getMarketsSnapshot: async () => markets(5912),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(true);
    expect(fake.writes).toBe(1);
    expect(fake.doc.assets.gold.current.close).toBe(3921);
    expect(fake.doc.assets.sp500.current.close).toBe(5912);
    expect(fake.doc.assets.gold.monthly.length).toBe(3); // no month turn
    // The identical re-run writes nothing.
    const second = await runGoldIfBoughtRefresh(fake.store, {
      getPublicSnapshot: async () => projection([['gold-usd', 3921], ['silver-usd', 44.5], ['btc-usd', 88_000]]),
      getMarketsSnapshot: async () => markets(5912),
      now: NOW_DATE,
    });
    expect(second.outcome.ok).toBe(true);
    expect(second.kv.writes).toBe(0);
  });

  it('a missing key writes nothing (the backfill runner owns the first write)', async () => {
    const store: GoldIfBoughtStore = {
      getGoldIfBought: async () => undefined,
      writeGoldIfBought: async () => {
        throw new Error('never');
      },
    };
    const result = await runGoldIfBoughtRefresh(store, {
      getPublicSnapshot: async () => projection([]),
      getMarketsSnapshot: async () => markets(5900),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(false);
    expect((result.outcome as { kind: string }).kind).toBe('blocked');
  });

  it(`a projection older than ${IF_BOUGHT_MAX_SNAPSHOT_AGE_MS / 3_600_000}h writes nothing (the last-good discipline)`, async () => {
    const fake = fakeStore(snapshotFixture());
    const stale = new Date(NOW_DATE.getTime() - IF_BOUGHT_MAX_SNAPSHOT_AGE_MS - 3_600_000).toISOString();
    const result = await runGoldIfBoughtRefresh(fake.store, {
      getPublicSnapshot: async () => projection([['gold-usd', 3921]], stale),
      getMarketsSnapshot: async () => markets(5912),
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(false);
    expect(fake.writes).toBe(0);
  });

  it('a leg whose reading is missing keeps its stored point (the honest per-leg degradation)', async () => {
    const fake = fakeStore(snapshotFixture());
    const result = await runGoldIfBoughtRefresh(fake.store, {
      // No silver/btc readings; no markets board.
      getPublicSnapshot: async () => projection([['gold-usd', 4000]]),
      getMarketsSnapshot: async () => undefined,
      now: NOW_DATE,
    });
    expect(result.outcome.ok).toBe(true);
    expect(fake.writes).toBe(1);
    expect(fake.doc.assets.gold.current.close).toBe(4000);
    expect(fake.doc.assets.silver.current.close).toBe(45); // the stored point held
    expect(fake.doc.assets.sp500.current.close).toBe(5900);
  });
});
