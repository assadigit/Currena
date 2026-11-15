/**
 * gap-leg-guard.test.ts — gap-closure S1-M1.5 (2026-10-31): the AU/US
 * 10-year gap's legs must carry their own dates, and the gap may only VOTE
 * while the legs' freshest dates sit within the allowed window. The audit
 * found the AU monthly leg at 2026-09-30 silently paired with the US daily
 * leg at 2026-10-29 — the exact-date join kept the value honest, but the
 * card still voted on a month-mismatched spread.
 */

import { describe, expect, it } from 'vitest';

import type { IndicatorReading } from '@currena/core';

import {
  GAP_LEG_MAX_DIVERGENCE_DAYS,
  applyGapLegDateGuard,
  gapLegDatesDiverge,
} from './adapters/snapshot';

function gapReading(auDate: string, usDate: string, status: IndicatorReading['status'] = 'warning'): IndicatorReading {
  return {
    id: 'au-us-10y-gap',
    value: -0.007,
    asOf: auDate,
    status,
    sourceName: 'RBA F2 − FRED (DGS10)',
    updatedAt: '2026-10-31T04:20:00.000Z',
    gapLegs: { a: { id: 'au-10y', asOf: auDate }, b: { id: 'us10y', asOf: usDate } },
  } as IndicatorReading;
}

describe('gapLegDatesDiverge (the allowed window)', () => {
  it('same date → no divergence', () => {
    expect(gapLegDatesDiverge('2026-10-29', '2026-10-29')).toBe(false);
  });

  it('within the window (weekends, a publication lag) → no divergence', () => {
    expect(gapLegDatesDiverge('2026-10-29', '2026-10-26')).toBe(false);
    expect(gapLegDatesDiverge('2026-10-29', `2026-10-${String(29 - GAP_LEG_MAX_DIVERGENCE_DAYS).padStart(2, '0')}`)).toBe(false);
  });

  it('past the window (a monthly leg vs a daily leg) → divergence', () => {
    expect(gapLegDatesDiverge('2026-09-30', '2026-10-29')).toBe(true); // the audit's case: 29 days
    expect(gapLegDatesDiverge('2026-10-29', `2026-10-${String(29 - GAP_LEG_MAX_DIVERGENCE_DAYS - 1).padStart(2, '0')}`)).toBe(true);
  });
});

describe('applyGapLegDateGuard (S1-M1.5: the gap only votes on contemporaneous legs)', () => {
  it('the audit case: AU Sep 30 vs US Oct 29 — the card does NOT vote', () => {
    const out = applyGapLegDateGuard(gapReading('2026-09-30', '2026-10-29'));
    expect(out.status).toBe('stale'); // non-votable; counted by the M1.4 badge
    expect(out.datesDiffer).toBe(true); // the T-20 marker
    // The value and both leg dates stay — the card shows what it knows.
    expect(out.value).toBe(-0.007);
    expect(out.gapLegs).toEqual({
      a: { id: 'au-10y', asOf: '2026-09-30' },
      b: { id: 'us10y', asOf: '2026-10-29' },
    });
  });

  it('legs within the window keep their verdict and still mark any inequality (T-20)', () => {
    const out = applyGapLegDateGuard(gapReading('2026-10-29', '2026-10-27'));
    expect(out.status).toBe('warning'); // still votes
    expect(out.datesDiffer).toBe(true); // but the 2-day difference is marked
    expect(out.value).toBe(-0.007);
  });

  it('equal leg dates: no marker, no change', () => {
    const out = applyGapLegDateGuard(gapReading('2026-10-29', '2026-10-29'));
    expect(out.status).toBe('warning');
    expect(out.datesDiffer).toBeUndefined();
  });

  it('readings without gapLegs pass through untouched (the guard is spread-only)', () => {
    const plain = { ...gapReading('2026-09-30', '2026-10-29') } as IndicatorReading;
    delete (plain as Partial<IndicatorReading>).gapLegs;
    const out = applyGapLegDateGuard(plain);
    expect(out).toEqual(plain);
  });

  it('never invents a verdict: unavailable stays unavailable', () => {
    const out = applyGapLegDateGuard(gapReading('2026-09-30', '2026-10-29', 'unavailable'));
    expect(out.status).toBe('unavailable');
    expect(out.datesDiffer).toBe(true);
  });
});
