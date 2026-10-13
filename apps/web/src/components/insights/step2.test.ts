/**
 * Step-2 add-list web wiring — the pure helpers the new cards ride on:
 *  - COMPANIONS / companionParentOf (the au-10y ↔ us10y comparison line, §B2)
 *  - ALWAYS_POSITION_IDS (the VIX card's interim presentation, §B5)
 *  - policyLastChangeOf (the exact last decision, §B1)
 *  - nextEventDate (the next RBA decision from the calendar, §B1)
 *  - moneyAreaRow savings leading with the real deposit rate (§B7)
 */

import { describe, expect, it } from 'vitest';

import type { CalendarEvent, IndicatorReading } from '@currena/core';
import {
  ALWAYS_POSITION_IDS,
  COMPANIONS,
  COMPANION_ONLY_IDS,
  DISPLAY,
  companionParentOf,
  moneyAreaRow,
  nextEventDate,
  policyLastChangeOf,
} from './config';

const reading = (over: Partial<IndicatorReading>): IndicatorReading =>
  ({
    id: 'rba-cash-rate',
    value: 4.6,
    asOf: '2026-10-12',
    status: 'context',
    sourceName: 'Test',
    updatedAt: '2026-10-13T04:20:00Z',
    ...over,
  }) as IndicatorReading;

describe('Step-2 §B2: COMPANIONS (comparison lines inside parent cards)', () => {
  it('the AU 10-year card carries the US 10-year beside it; core CPI stays companion-ONLY', () => {
    expect(COMPANIONS['au-10y']).toEqual(['us10y']);
    expect(COMPANIONS['us-cpi-yoy']).toEqual(['us-cpi-core-yoy']);
    expect(companionParentOf('us10y')).toBe('au-10y');
    expect(companionParentOf('us-cpi-core-yoy')).toBe('us-cpi-yoy');
    // us10y is NOT companion-only — it keeps its own card in borrowing-costs.
    expect(COMPANION_ONLY_IDS.has('us10y')).toBe(false);
    expect(COMPANION_ONLY_IDS.has('us-cpi-core-yoy')).toBe(true);
  });

  it('a companion rides nowhere when its parent is absent', () => {
    expect(companionParentOf('brent')).toBeNull();
    expect(companionParentOf('vix')).toBeNull();
  });
});

describe('Step-2 §B5: ALWAYS_POSITION_IDS (the VIX card always shows its 10-year position)', () => {
  it('only the VIX rides the always-position set', () => {
    expect(ALWAYS_POSITION_IDS.has('vix')).toBe(true);
    expect(ALWAYS_POSITION_IDS.has('us-unemployment')).toBe(false);
    expect(ALWAYS_POSITION_IDS.size).toBe(1);
  });

  it('the new cards have display configs (units: percent/points, never percent-of-percent)', () => {
    expect(DISPLAY.vix).toEqual({ decimals: 2, unit: 'index' });
    expect(DISPLAY['us-unemployment']!.unit).toBe('percent');
    expect(DISPLAY['sahm-rule']!.unit).toBe('points');
    expect(DISPLAY['au-10y']!.unit).toBe('percent');
    expect(DISPLAY['au-deposit-rate']!.unit).toBe('percent');
  });
});

describe('Step-2 §B1: policyLastChangeOf (the exact last decision, not a 30-day window)', () => {
  it('returns the engine lastChange on policy cards; null elsewhere and when absent', () => {
    const last = { date: '2026-09-29', points: 0.25 };
    expect(policyLastChangeOf(reading({ lastChange: last }))).toEqual(last);
    expect(policyLastChangeOf(reading({ id: 'au-home-loan', lastChange: last }))).toBeNull();
    expect(policyLastChangeOf(reading({ status: 'unavailable', value: null, asOf: null, lastChange: undefined }))).toBeNull();
  });
});

describe('Step-2 §B1: nextEventDate (the next decision from the calendar)', () => {
  const cal: CalendarEvent[] = [
    { id: 'rba-past', date: '2026-09-29', titleEn: 'past', titleFa: 'past', kind: 'rba' },
    { id: 'rba-next', date: '2026-11-03', titleEn: 'next', titleFa: 'next', kind: 'rba' },
    { id: 'rba-later', date: '2026-12-08', titleEn: 'later', titleFa: 'later', kind: 'rba' },
    { id: 'fed-next', date: '2026-10-28', titleEn: 'fed', titleFa: 'fed', kind: 'fed' },
  ];
  it('picks the first event of the kind dated today or later', () => {
    expect(nextEventDate(cal, 'rba', '2026-10-13')).toBe('2026-11-03');
    expect(nextEventDate(cal, 'fed', '2026-10-13')).toBe('2026-10-28');
  });
  it('today counts as upcoming (decision day itself)', () => {
    expect(nextEventDate(cal, 'fed', '2026-10-28')).toBe('2026-10-28');
  });
  it('undefined when the calendar carries none ahead', () => {
    expect(nextEventDate(cal, 'rba', '2027-01-01')).toBeUndefined();
    expect(nextEventDate([], 'rba', '2026-10-13')).toBeUndefined();
  });
});

describe('Step-2 §B7: the savings row leads with the REAL deposit rate', () => {
  it('calm savings shows the deposit rate first (F4.1), falling back to the cash rate', () => {
    const dep = reading({ id: 'au-deposit-rate', value: 4.8, asOf: '2026-08-31', status: 'context' });
    const cash = reading({ id: 'rba-cash-rate', value: 4.6 });
    const cpi = reading({ id: 'au-cpi', value: 3.97, status: 'warning', percentile10y: 0.85, change30d: 0.07 });
    const row = moneyAreaRow('savings', [dep, cash, cpi]);
    expect(row.state).toBe('attention');
    expect(row.chipIds[0]).toBe('au-deposit-rate');

    // Deposit series absent → the cash rate leads (the old Step-1 fallback).
    const rowNoDep = moneyAreaRow('savings', [cash, cpi]);
    expect(rowNoDep.chipIds[0]).toBe('rba-cash-rate');

    // Calm case: the deposit rate is still the row's number.
    const calmCpi = reading({ id: 'au-cpi', value: 2.5, status: 'normal', percentile10y: 0.5 });
    const calm = moneyAreaRow('savings', [dep, calmCpi]);
    expect(calm.state).toBe('calm');
    expect(calm.chipIds).toEqual(['au-deposit-rate']);
  });
});
