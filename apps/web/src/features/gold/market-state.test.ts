/**
 * market-state.test.ts — GPE R16 / F16b: the COMEX schedule's pure
 * engine — both DST regimes, the weekly boundaries, the daily break,
 * and the named-market contract (the pill renders the market + its
 * timezone at point of use, the GPE-S3-10 lesson).
 */

import { describe, expect, it } from 'vitest';
import { comexMarketState, newYorkOffsetHours } from './market-state';

describe('newYorkOffsetHours (the US DST rule)', () => {
  it('standard time in winter, daylight in summer, exact at the transitions', () => {
    expect(newYorkOffsetHours(new Date('2026-01-15T12:00:00Z'))).toBe(-5);
    expect(newYorkOffsetHours(new Date('2026-07-15T12:00:00Z'))).toBe(-4);
    // 2026: DST starts Sunday March 8 (02:00 EST = 07:00 UTC), ends Sunday Nov 1 (02:00 EDT = 06:00 UTC).
    expect(newYorkOffsetHours(new Date('2026-03-08T06:59:00Z'))).toBe(-5);
    expect(newYorkOffsetHours(new Date('2026-03-08T07:00:00Z'))).toBe(-4);
    expect(newYorkOffsetHours(new Date('2026-11-01T05:59:00Z'))).toBe(-4);
    expect(newYorkOffsetHours(new Date('2026-11-01T06:00:00Z'))).toBe(-5);
  });
});

describe('comexMarketState (the GC regular hours)', () => {
  it('open inside the regular session (a Tuesday afternoon, both DST regimes)', () => {
    // Tuesday 2026-11-17 17:00 UTC = 12:00 EST — mid-session.
    const tue = comexMarketState(new Date('2026-11-17T17:00:00Z'));
    expect(tue.open).toBe(true);
    expect(tue.market).toBe('COMEX gold futures');
    expect(tue.venue).toBe('New York');
    expect(tue.tzLabel).toBe('UTC−5');
    // A summer Tuesday: 2026-07-14 17:00 UTC = 13:00 EDT.
    const summer = comexMarketState(new Date('2026-07-14T17:00:00Z'));
    expect(summer.open).toBe(true);
    expect(summer.tzLabel).toBe('UTC−4');
  });

  it('closed Saturday, Sunday pre-open, and after the Friday close', () => {
    // Saturday 2026-11-14 any time.
    expect(comexMarketState(new Date('2026-11-14T15:00:00Z')).open).toBe(false);
    // Sunday 2026-11-15 20:00 UTC = 15:00 EST — before the 18:00 ET open.
    expect(comexMarketState(new Date('2026-11-15T20:00:00Z')).open).toBe(false);
    // Sunday 2026-11-15 23:01 UTC = 18:01 EST — the session opens 18:00 ET.
    expect(comexMarketState(new Date('2026-11-15T23:01:00Z')).open).toBe(true);
    // Friday 2026-11-13 22:01 UTC = 17:01 EST — after the 17:00 ET close.
    expect(comexMarketState(new Date('2026-11-13T22:01:00Z')).open).toBe(false);
    // Friday 2026-11-13 21:59 UTC = 16:59 EST — still open.
    expect(comexMarketState(new Date('2026-11-13T21:59:00Z')).open).toBe(true);
  });

  it('the daily 60-minute maintenance break counts as closed', () => {
    // Tuesday 2026-11-17 22:30 UTC = 17:30 EST — inside the 17:00-18:00 ET break.
    expect(comexMarketState(new Date('2026-11-17T22:30:00Z')).open).toBe(false);
    // Tuesday 2026-11-17 23:01 UTC = 18:01 EST — the evening session resumes.
    expect(comexMarketState(new Date('2026-11-17T23:01:00Z')).open).toBe(true);
  });

  it('the Sunday open shifts with DST (22:00 UTC in summer, 23:00 UTC in winter)', () => {
    // Summer Sunday 2026-07-12 21:59 UTC = 17:59 EDT — closed; 22:01 UTC = 18:01 EDT — open.
    expect(comexMarketState(new Date('2026-07-12T21:59:00Z')).open).toBe(false);
    expect(comexMarketState(new Date('2026-07-12T22:01:00Z')).open).toBe(true);
  });
});
