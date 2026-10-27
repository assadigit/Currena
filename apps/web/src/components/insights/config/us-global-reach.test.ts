/**
 * us-global-reach.test.ts — R9-07 (2026-10-27 owner round: "special
 * container for US-based indicators that affect global markets").
 *
 * Pins the pure ANALYTICAL BRIEF generator (config/us-global-reach.ts):
 * the three legs' band selection (borrowing costs, inflation,
 * stress/liquidity), the live-value interpolation (the cards' own
 * formatted numbers, the honest em dash when unreadable), the null case,
 * and the fa rendering. The band rules ride the same honesty the
 * consequence-line machinery carries: a needs-attention status IS the
 * elevated case; percentiles only refine it.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';
import { formatIndicatorValue } from './display';
import { US_GLOBAL_REACH_IDS } from './sections';
import { usCostsBand, usGlobalBrief, usGlobalBriefLegs, usInflationBand, usStressBand } from './us-global-reach';

const copy = insightsCopyEn;
const copyFa = insightsCopyFa;

function r(id: IndicatorId, partial: Partial<IndicatorReading>): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-10-23',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-10-26T04:20:00.000Z',
    ...partial,
  } as IndicatorReading;
}

/** A full nine-reading fixture with every value readable. */
function fullFixture(overrides: Partial<Record<IndicatorId, Partial<IndicatorReading>>> = {}): IndicatorReading[] {
  const base = {
    'real-yield-10y': { value: 2.64, percentile10y: 0.94 },
    us10y: { value: 4.96, percentile10y: 0.93 },
    us30y: { value: 5.21, percentile10y: 0.97 },
    'euro-hicp': { value: 2.2, percentile10y: 0.58 },
    'us-cpi-yoy': { value: 3.0, percentile10y: 0.72 },
    'us-pce-core-yoy': { value: 2.8, percentile10y: 0.69 },
    walcl: { value: 9021000, percentile10y: 0.12 },
    'stress-stlfsi': { value: -0.31, percentile10y: 0.41 },
    nfci: { value: -0.27, percentile10y: 0.38 },
    ...overrides,
  } as Record<IndicatorId, Partial<IndicatorReading>>;
  return US_GLOBAL_REACH_IDS.map((id) => r(id, base[id] ?? {}));
}

describe('R9-07 band selection (pure)', () => {
  it('costs: the most binding percentile decides — all high → high', () => {
    expect(usCostsBand(new Map(fullFixture().map((x) => [x.id, x])))).toBe('high');
  });

  it('costs: all low percentiles → low', () => {
    const byId = new Map(
      fullFixture({
        'real-yield-10y': { value: -0.5, percentile10y: 0.08 },
        us10y: { value: 0.6, percentile10y: 0.04 },
        us30y: { value: 1.2, percentile10y: 0.2 },
      }).map((x) => [x.id, x]),
    );
    expect(usCostsBand(byId)).toBe('low');
  });

  it('costs: a needs-attention status IS the elevated case, whatever the percentile says', () => {
    const byId = new Map(
      fullFixture({
        us10y: { value: 2.0, percentile10y: 0.3, status: 'warning' },
        'real-yield-10y': { value: 0.2, percentile10y: 0.3 },
        us30y: { value: 2.4, percentile10y: 0.3 },
      }).map((x) => [x.id, x]),
    );
    expect(usCostsBand(byId)).toBe('high');
  });

  it('costs: mid-range percentiles → mid', () => {
    const byId = new Map(
      fullFixture({
        'real-yield-10y': { value: 1.1, percentile10y: 0.5 },
        us10y: { value: 3.1, percentile10y: 0.55 },
        us30y: { value: 3.6, percentile10y: 0.6 },
      }).map((x) => [x.id, x]),
    );
    expect(usCostsBand(byId)).toBe('mid');
  });

  it('inflation: any needs-attention inflation reading → above; otherwise near', () => {
    const above = new Map(
      fullFixture({ 'us-cpi-yoy': { value: 4.1, percentile10y: 0.9, status: 'warning' } }).map((x) => [x.id, x]),
    );
    expect(usInflationBand(above)).toBe('above');
    const near = new Map(fullFixture().map((x) => [x.id, x]));
    expect(usInflationBand(near)).toBe('near');
  });

  it('stress: any needs-attention stress reading → strained; otherwise calm', () => {
    const strained = new Map(
      fullFixture({ nfci: { value: 0.42, percentile10y: 0.95, status: 'warning' } }).map((x) => [x.id, x]),
    );
    expect(usStressBand(strained)).toBe('strained');
    const calm = new Map(fullFixture().map((x) => [x.id, x]));
    expect(usStressBand(calm)).toBe('calm');
  });

  it('the combined legs read back as one object', () => {
    const legs = usGlobalBriefLegs(new Map(fullFixture().map((x) => [x.id, x])));
    expect(legs).toEqual({ costs: 'high', inflation: 'near', stress: 'calm' });
  });
});

describe('R9-07 the analytical brief (generated from the live values)', () => {
  it('selects and interpolates the three sentences — every one of the nine values rides its own formatted number', () => {
    const readings = fullFixture();
    const brief = usGlobalBrief(readings, copy, 'en-US');
    expect(brief).not.toBeNull();
    // The high-costs sentence (percentiles 0.93–0.97).
    expect(brief!.startsWith('US borrowing costs sit high in their ten-year range')).toBe(true);
    // Near-target inflation (no warnings) + calm stress (no warnings).
    expect(brief!).toContain("Inflation is close to the central banks' goals");
    expect(brief!).toContain('US money markets are calm');
    // The interpolated values are the cards' own formatted numbers.
    for (const id of US_GLOBAL_REACH_IDS) {
      const reading = readings.find((x) => x.id === id)!;
      expect(brief!).toContain(formatIndicatorValue(id, reading.value!, 'en-US', copy.units));
    }
  });

  it('a warning inflation reading switches the second sentence', () => {
    const brief = usGlobalBrief(
      fullFixture({ 'us-pce-core-yoy': { value: 3.4, percentile10y: 0.92, status: 'warning' } }),
      copy,
      'en-US',
    );
    expect(brief!).toContain("Inflation is still above the central banks' goals");
  });

  it('a warning stress reading switches the third sentence', () => {
    const brief = usGlobalBrief(
      fullFixture({ 'stress-stlfsi': { value: 1.1, percentile10y: 0.98, status: 'warning' } }),
      copy,
      'en-US',
    );
    expect(brief!).toContain('US money markets show strain');
  });

  it('low costs get their own sentence', () => {
    const brief = usGlobalBrief(
      fullFixture({
        'real-yield-10y': { value: -0.4, percentile10y: 0.05 },
        us10y: { value: 0.7, percentile10y: 0.03 },
        us30y: { value: 1.3, percentile10y: 0.1 },
      }),
      copy,
      'en-US',
    );
    expect(brief!.startsWith('US borrowing costs sit low in their ten-year range')).toBe(true);
  });

  it('an unreadable value renders the honest em dash, never a guess', () => {
    const brief = usGlobalBrief(
      fullFixture({ walcl: { value: null, status: 'stale' } }),
      copy,
      'en-US',
    );
    expect(brief).not.toBeNull();
    // walcl is the sentence's LAST value: the dash rides before the
    // closing parenthesis — "Fed balance sheet —), supporting...".
    expect(brief!.includes('Fed balance sheet —')).toBe(true);
  });

  it('fa: the fa templates render with Persian digits and the fa sentence set', () => {
    const brief = usGlobalBrief(fullFixture(), copyFa, 'fa-IR');
    expect(brief).not.toBeNull();
    expect(brief!.startsWith('هزینهٔ استقرار آمریکا در بخش بالایی از محدودهٔ ده‌سالهٔ خود است')).toBe(true);
    expect(brief!).toContain('تورم نزدیک به هدف بانک‌های مرکزی است');
    expect(brief!).toContain('بازارهای پولی آمریکا آرام‌اند');
    // The values render in Persian digits (fa-IR Intl at render time).
    const us10y = formatIndicatorValue('us10y', 4.96, 'fa-IR', copyFa.units);
    expect(brief!).toContain(us10y);
  });

  it('returns null only when the page carries none of the nine readings', () => {
    expect(usGlobalBrief([], copy, 'en-US')).toBeNull();
    expect(usGlobalBrief([r('vix', { value: 20 })], copy, 'en-US')).toBeNull();
  });
});
