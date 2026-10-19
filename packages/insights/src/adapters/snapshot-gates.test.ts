/**
 * snapshot-gates.test.ts — the v3 fail-closed gates inside the snapshot
 * builder: T-28 (definitional sanity range), M-6 (the kill switch), T-27
 * (a blocked source) and F-16 (a format change). Written first; every gate
 * must hide the value and name its reason — never a verdict.
 */

import { describe, expect, it } from 'vitest';
import { addDays, type SeriesPoint } from '../series';
import { buildInsightsSnapshot } from './snapshot';

const NOW = '2026-10-07T04:20:00.000Z';

function daily(start: string, n: number, v: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < n; i++) out.push({ date: addDays(start, i), value: v });
  return out;
}

/** A series long enough to compute percentiles/positions from. */
function longDaily(id: string, v: number): SeriesPoint[] {
  const n = id === 'crypto-fng' ? 120 : 900;
  return daily('2024-01-01', n, v);
}

describe('T-28: a value outside its definitional range is rejected (can\u2019t tell right now)', () => {
  it('a crypto F&G reading of 142 (0..100 by the publisher\u2019s own definition) hides its value', () => {
    const snap = buildInsightsSnapshot({
      series: { 'crypto-fng': daily('2026-06-01', 130, 142) } as Record<string, SeriesPoint[]>,
      calendar: [],
      now: NOW,
    });
    const r = snap.readings.find((x) => x.id === 'crypto-fng')!;
    expect(r.value).toBeNull(); // the value is hidden
    expect(r.status).toBe('unavailable');
    expect(r.flag?.test).toBe('T-28');
    expect(r.flag?.reason).toContain('outside its allowed range');
  });

  it('a negative Brent price is rejected the same way', () => {
    const snap = buildInsightsSnapshot({
      series: { brent: daily('2024-01-01', 800, -1.5) } as Record<string, SeriesPoint[]>,
      calendar: [],
      now: NOW,
    });
    const r = snap.readings.find((x) => x.id === 'brent')!;
    expect(r.value).toBeNull();
    expect(r.status).toBe('unavailable');
    expect(r.flag?.test).toBe('T-28');
  });

  it('an in-range value passes untouched, and unbounded series never trip the gate', () => {
    const snap = buildInsightsSnapshot({
      series: {
        'crypto-fng': daily('2026-06-01', 130, 55),
        us10y: daily('2024-01-01', 900, 5.24), // yields can go negative — no band, no trip
      } as Record<string, SeriesPoint[]>,
      calendar: [],
      now: NOW,
    });
    expect(snap.readings.find((x) => x.id === 'crypto-fng')!.value).toBe(55);
    expect(snap.readings.find((x) => x.id === 'us10y')!.value).toBe(5.24);
  });
});

describe('M-6: the kill switch turns a source\u2019s cards dark (value hidden, reason named)', () => {
  it('a disabled reading goes unavailable with the kill-switch reason, whatever it computed before', () => {
    const snap = buildInsightsSnapshot({
      series: { us10y: longDaily('us10y', 5.24) } as Record<string, SeriesPoint[]>,
      calendar: [],
      disabledReadings: ['us10y'],
      now: NOW,
    });
    const r = snap.readings.find((x) => x.id === 'us10y')!;
    expect(r.value).toBeNull();
    expect(r.status).toBe('unavailable');
    expect(r.flag?.test).toBe('M-6');
    expect(r.flag?.reason).toContain('kill switch');
  });
});

describe('T-27 + F-16: blocked and format-changed sources name their reason on every reading they feed', () => {
  it('a blocked provider leaves no series: the reading is unavailable AND carries the block reason (gold-usd ← yahoo)', () => {
    const snap = buildInsightsSnapshot({
      series: {} as Record<string, SeriesPoint[]>,
      calendar: [],
      sourceOutcomes: { yahoo: 'blocked' },
      now: NOW,
    });
    const r = snap.readings.find((x) => x.id === 'gold-usd')!;
    expect(r.status).toBe('unavailable'); // fail closed — a block is a block
    expect(r.value).toBeNull();
    expect(r.flag?.test).toBe('T-27');
    expect(r.flag?.reason).toContain('blocked by the site');
  });

  it('a format change leaves no series: unavailable with the format reason (fed-target ← fred)', () => {
    const snap = buildInsightsSnapshot({
      series: {} as Record<string, SeriesPoint[]>,
      calendar: [],
      sourceOutcomes: { fred: 'format-changed' },
      now: NOW,
    });
    const r = snap.readings.find((x) => x.id === 'fed-target')!;
    expect(r.status).toBe('unavailable'); // can't tell right now — the shape must be re-verified first
    expect(r.value).toBeNull();
    expect(r.flag?.test).toBe('F-16');
    expect(r.flag?.reason).toContain('format changed');
  });

  it('an unrelated provider\u2019s outcome touches only its own legs', () => {
    const snap = buildInsightsSnapshot({
      series: { us10y: longDaily('us10y', 5.24) } as Record<string, SeriesPoint[]>,
      calendar: [],
      sourceOutcomes: { yahoo: 'blocked' },
      now: NOW,
    });
    const r = snap.readings.find((x) => x.id === 'us10y')!;
    expect(r.flag?.test).toBeUndefined(); // fred-only card, yahoo outcome irrelevant
  });
});
