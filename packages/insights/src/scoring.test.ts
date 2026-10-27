import { describe, expect, it } from 'vitest';

import type { IndicatorDefinition, IndicatorReading, WarningRuleAtom } from '@currena/core';

import { addDays, type SeriesPoint } from './series';
import {
  GRACE_DAYS,
  MIN_ABOVE_LOW_OBS,
  MIN_MOVE_OBS,
  MIN_PERCENTILE_OBS,
  computeReading,
  changedSince,
  evaluateRule,
  moveScoreOf,
  percentileOf,
  staleAfterDaysFor,
} from './scoring';

/* ------------------------------------------------------------------ *
 * Test helpers
 * ------------------------------------------------------------------ */

const NOW = '2024-07-10T02:00:00.000Z';
const NOW_DAY = '2024-07-10';

function dailySeries(count: number, value: (i: number) => number, start = '2023-01-02'): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ date: addDays(start, i), value: value(i) });
  }
  return out;
}

function weeklySeries(count: number, value: (i: number) => number, start = '2023-01-06'): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ date: addDays(start, i * 7), value: value(i) });
  }
  return out;
}

function makeDef(over: Partial<IndicatorDefinition> & { rule: IndicatorDefinition['rule'] }): IndicatorDefinition {
  return {
    id: 'usdjpy',
    section: 'global',
    group: 'dollar-strength',
    name: 'test indicator',
    source: 'fred',
    sourceRef: 'test',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    ...over,
  };
}

const SRC = { name: 'Test source' };

function verdictOf(rule: IndicatorDefinition['rule'], series: SeriesPoint[], asOf = NOW_DAY) {
  return evaluateRule(makeDef({ rule }), series, asOf);
}

function readingOf(def: IndicatorDefinition, series: SeriesPoint[], now = NOW) {
  return computeReading(def, series, now, SRC);
}

/* ------------------------------------------------------------------ *
 * Rule: threshold
 * ------------------------------------------------------------------ */

describe('rule: threshold', () => {
  it.each([
    ['above triggered', { kind: 'threshold', direction: 'above', value: 0 } as const, 1, 'warning'],
    ['above not triggered', { kind: 'threshold', direction: 'above', value: 2 } as const, 1, 'normal'],
    ['below triggered', { kind: 'threshold', direction: 'below', value: 2 } as const, 1, 'warning'],
    ['tie on threshold is NOT a warning (strict comparison)', { kind: 'threshold', direction: 'above', value: 1 } as const, 1, 'normal'],
  ] as const)('%s', (_label, rule, value, expected) => {
    expect(verdictOf(rule, [{ date: NOW_DAY, value }]).status).toBe(expected);
  });

  it('no observation at or before asOf → unevaluable', () => {
    expect(verdictOf({ kind: 'threshold', direction: 'above', value: 0 }, []).status).toBe('unevaluable');
    expect(verdictOf({ kind: 'threshold', direction: 'above', value: 0 }, [{ date: '2024-07-11', value: 5 }]).status).toBe('unevaluable');
  });

  describe('sustainedWeeks (STLFSI4: above 0 for 4 weeks)', () => {
    const rule = { kind: 'threshold', direction: 'above', value: 0, sustainedWeeks: 4 } as const;

    it('four weekly observations all above → warning', () => {
      const s = weeklySeries(10, (i) => (i >= 6 ? 0.5 : -0.5));
      expect(verdictOf(rule, s, '2023-03-10').status).toBe('warning');
    });

    it('one violation inside the window → normal', () => {
      const s = weeklySeries(10, (i) => (i === 7 ? -0.5 : 0.5));
      expect(verdictOf(rule, s, '2023-03-10').status).toBe('normal');
    });

    it('window has too few observations → unevaluable, never a false sustained', () => {
      const s = weeklySeries(3, () => 0.5);
      expect(verdictOf(rule, s, '2023-01-20').status).toBe('unevaluable');
    });
  });
});

/* ------------------------------------------------------------------ *
 * Rule: percentile
 * ------------------------------------------------------------------ */

describe('rule: percentile', () => {
  /** A base of `below` values at 1..n and `above` values above the current. */
  function baseOf(below: number, above: number, current: number): { series: SeriesPoint[]; asOf: string } {
    const values: number[] = [];
    for (let i = 0; i < below; i++) values.push(i + 1); // strictly below `below+1`
    for (let i = 0; i < above; i++) values.push(10_000 + i); // far above
    values.push(current);
    const series = dailySeries(values.length, (i) => values[i]!);
    return { series, asOf: series[series.length - 1]!.date };
  }

  it('tail-high boundary is inclusive at exactly (1 − cutoff)', () => {
    // 96 below of 120 → p = 0.8 exactly → warning at cutoff 0.2
    const a = baseOf(96, 24, 5000);
    expect(verdictOf({ kind: 'percentile', tail: 'high', cutoff: 0.2 }, a.series, a.asOf).status).toBe('warning');
    // 95 below of 120 → p ≈ 0.7917 → normal
    const b = baseOf(95, 25, 5000);
    expect(verdictOf({ kind: 'percentile', tail: 'high', cutoff: 0.2 }, b.series, b.asOf).status).toBe('normal');
  });

  it('tail-low fires only in the low tail', () => {
    // current is the minimum: nothing below → p = 0 ≤ cutoff
    const a = baseOf(0, 120, -5);
    expect(verdictOf({ kind: 'percentile', tail: 'low', cutoff: 0.2 }, a.series, a.asOf).status).toBe('warning');
    // current above half the base → p ≈ 0.5 > 0.2
    const b = baseOf(60, 60, 5000);
    expect(verdictOf({ kind: 'percentile', tail: 'low', cutoff: 0.2 }, b.series, b.asOf).status).toBe('normal');
  });

  it('ties count as not-below (strict-lower definition)', () => {
    // 120 equal base values, current equal to them → p = 0
    expect(percentileOf(Array.from({ length: 120 }, () => 100), 100)).toBe(0);
    expect(percentileOf([1, 2, 3, 4], 5)).toBe(1);
    expect(percentileOf([1, 2, 3, 4], 0)).toBe(0);
  });

  it(`base shorter than ${MIN_PERCENTILE_OBS} observations → unevaluable`, () => {
    const s = dailySeries(MIN_PERCENTILE_OBS, (i) => i); // base = 119
    expect(verdictOf({ kind: 'percentile', tail: 'high', cutoff: 0.2 }, s).status).toBe('unevaluable');
    const ok = dailySeries(MIN_PERCENTILE_OBS + 1, (i) => i); // base = 120
    expect(verdictOf({ kind: 'percentile', tail: 'high', cutoff: 0.2 }, ok).status).toBe('warning'); // highest value, p = 1
  });

  it('the percentile base excludes the current observation and respects the 10-year window', () => {
    // 200 daily points ascending; current = last. Base = 199 others.
    const s = dailySeries(200, (i) => i);
    const v = verdictOf({ kind: 'percentile', tail: 'high', cutoff: 0.1 }, s);
    expect(v.status).toBe('warning'); // p = 199/199 = 1 ≥ 0.9
  });
});

/* ------------------------------------------------------------------ *
 * Rule: change
 * ------------------------------------------------------------------ */

describe('rule: change', () => {
  it('points mode, rise, boundary magnitude is a warning (≥)', () => {
    // asOf 2024-07-10 minus 4 weeks = 2024-06-12 (exact anchor)
    const s: SeriesPoint[] = [
      { date: '2024-06-12', value: 2.0 },
      { date: '2024-07-10', value: 2.5 },
    ];
    expect(verdictOf({ kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 }, s).status).toBe('warning');
    s[1] = { date: '2024-07-10', value: 2.49 };
    expect(verdictOf({ kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 }, s).status).toBe('normal');
  });

  it('pct mode, fall: −5% exactly is a warning; −4.9% is not; non-positive base refused', () => {
    const s: SeriesPoint[] = [
      { date: '2024-06-12', value: 100 },
      { date: '2024-07-10', value: 95 },
    ];
    const rule = { kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 } as const;
    expect(verdictOf(rule, s).status).toBe('warning');
    s[1] = { date: '2024-07-10', value: 95.1 };
    expect(verdictOf(rule, s).status).toBe('normal');
    s[0] = { date: '2024-06-12', value: 0 };
    expect(verdictOf(rule, s).status).toBe('unevaluable');
  });

  it('no observation at the window start → unevaluable (short history)', () => {
    const s: SeriesPoint[] = [{ date: '2024-07-10', value: 100 }];
    expect(verdictOf({ kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 }, s).status).toBe('unevaluable');
  });

  it('anchor far older than the window (sparse series) → unevaluable, never a mislabelled window', () => {
    const s: SeriesPoint[] = [
      { date: '2024-01-10', value: 100 },
      { date: '2024-07-10', value: 80 },
    ];
    expect(verdictOf({ kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 }, s).status).toBe('unevaluable');
  });

  it('anchors within the 3-day tolerance evaluate; one day further is refused', () => {
    // asOf 2024-07-10 → target 2024-06-12; nearest obs 2024-06-09 is 3 days stale (allowed)
    const within: SeriesPoint[] = [
      { date: '2024-06-09', value: 100 },
      { date: '2024-07-10', value: 90 },
    ];
    expect(verdictOf({ kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 }, within).status).toBe('warning');
    const beyond: SeriesPoint[] = [
      { date: '2024-06-08', value: 100 },
      { date: '2024-07-10', value: 90 },
    ];
    expect(verdictOf({ kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 }, beyond).status).toBe('unevaluable');
  });
});

/* ------------------------------------------------------------------ *
 * Rule: yoy-negative
 * ------------------------------------------------------------------ */

describe('rule: yoy-negative', () => {
  function m2(path: 'falling' | 'rising' | 'flat'): SeriesPoint[] {
    // A year-ago observation (2023-01-15) and a current one (2024-01-10, 360 days later).
    const second = path === 'falling' ? 88 : path === 'rising' ? 112 : 100;
    return [
      { date: '2023-01-15', value: 100 },
      { date: '2024-01-10', value: second },
    ];
  }

  it('falling year-on-year → warning', () => {
    expect(verdictOf({ kind: 'yoy-negative' }, m2('falling'), '2024-01-10').status).toBe('warning');
  });
  it('rising or exactly flat → normal (strict <)', () => {
    expect(verdictOf({ kind: 'yoy-negative' }, m2('rising'), '2024-01-10').status).toBe('normal');
    expect(verdictOf({ kind: 'yoy-negative' }, m2('flat'), '2024-01-10').status).toBe('normal');
  });
  it('no observation 350–380 days back → unevaluable', () => {
    const s = dailySeries(10, (i) => 100 - i);
    expect(verdictOf({ kind: 'yoy-negative' }, s).status).toBe('unevaluable');
  });
});

/* ------------------------------------------------------------------ *
 * Rule: consecutive-decline
 * ------------------------------------------------------------------ */

describe('rule: consecutive-decline', () => {
  const rule = { kind: 'consecutive-decline', periods: 3 } as const;

  it('three strict declines in a row → warning', () => {
    const s = [10, 9, 8, 7].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
    expect(verdictOf(rule, s, '2024-09-28').status).toBe('warning');
  });
  it('a flat period breaks the streak (strict <)', () => {
    const s = [10, 9, 9, 7].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
    expect(verdictOf(rule, s, '2024-09-28').status).toBe('normal');
  });
  it('too few observations → unevaluable', () => {
    const s = [10, 9, 8].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
    expect(verdictOf(rule, s).status).toBe('unevaluable');
  });
  it('periods = 1 needs just two observations', () => {
    const rule1 = { kind: 'consecutive-decline', periods: 1 } as const;
    expect(verdictOf(rule1, [{ date: '2024-01-01', value: 5 }, { date: '2024-04-01', value: 4 }]).status).toBe('warning');
  });
});

/* ------------------------------------------------------------------ *
 * Rule: growth (2026-10-26 gap-audit build, A-8 — the OECD CLI's
 * annualised N-month turning-point convention)
 * ------------------------------------------------------------------ */

describe('rule: growth (annualised N-month)', () => {
  /** Monthly points: [value, monthsAgo] pairs → a dated ascending series. */
  const monthly = (pairs: Array<[number, number]>, anchor = '2026-09-01'): SeriesPoint[] =>
    pairs
      .map(([value, monthsAgo]) => {
        const d = new Date(Date.parse(`${anchor}T00:00:00Z`));
        d.setUTCMonth(d.getUTCMonth() - monthsAgo);
        return { date: d.toISOString().slice(0, 10), value };
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));

  it('6-month annualised below −1 (turning down) → warning', () => {
    // 103 → 100 over six months: (100/103 − 1) × 100 × 2 ≈ −5.83 annualised.
    const s = monthly([
      [100, 0],
      [101, 1],
      [102, 2],
      [102, 3],
      [103, 4],
      [102.5, 5],
      [103, 6],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('warning');
  });

  it('a mild six-month drift stays normal', () => {
    // 100.2 → 100: (100/100.2 − 1) × 100 × 2 ≈ −0.4 annualised.
    const s = monthly([
      [100, 0],
      [100.1, 1],
      [100.15, 2],
      [100.2, 3],
      [100.1, 4],
      [100.2, 5],
      [100.2, 6],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('normal');
  });

  it('the exact −1 boundary is a warning (strict <)', () => {
    // 100 → 99.5: (99.5/100 − 1) × 100 × 2 = −1.0 exactly → warning.
    const s = monthly([
      [99.5, 0],
      [99.6, 1],
      [99.7, 2],
      [99.8, 3],
      [99.9, 4],
      [100, 5],
      [100, 6],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('warning');
  });

  it('the 3-month V-turn above +2 → warning (the direction above case)', () => {
    // 100.3 → 101 in three months: (101/100.3 − 1) × 100 × 4 ≈ +2.79 annualised.
    const s = monthly([
      [101, 0],
      [100.7, 1],
      [100.5, 2],
      [100.3, 3],
      [100.2, 4],
      [100.2, 5],
      [100.3, 6],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'above', value: 2, months: 3 }, s, '2026-09-30').status).toBe('warning');
  });

  it('monthly stamps land inside the ±25-day anchor tolerance (the CLI dating)', () => {
    // Six calendar months = 181–184 days; the tolerance centres on
    // 6 × 30.44 = 182.6 — an exactly-6-month anchor evaluates.
    const s = monthly([
      [100, 0],
      [101, 1],
      [102, 2],
      [102, 3],
      [103, 4],
      [102.5, 5],
      [110, 6],
    ]);
    // 110 → 100: (100/110 − 1) × 100 × 2 ≈ −18 annualised → warning.
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('warning');
  });

  it('no anchor within the ±25-day tolerance → unevaluable, never a mislabelled window', () => {
    // A 10-month gap where the rule wants 6: the anchor is ~121 days off.
    const s = monthly([
      [100, 0],
      [101, 1],
      [102, 2],
      [103, 10],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('unevaluable');
  });

  it('a non-positive base refuses the ratio (unevaluable)', () => {
    const s = monthly([
      [100, 0],
      [101, 1],
      [102, 2],
      [103, 3],
      [104, 4],
      [105, 5],
      [-103, 6],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('unevaluable');
  });

  it('no observation ~months back at all → unevaluable', () => {
    const s = monthly([
      [100, 0],
      [101, 1],
    ]);
    expect(verdictOf({ kind: 'growth', direction: 'below', value: -1, months: 6 }, s, '2026-09-30').status).toBe('unevaluable');
  });
});

/* ------------------------------------------------------------------ *
 * sd10y (2026-10-26 gap-audit build, A-9/A-10 — the rolling 10-year
 * z-score the GPR/EPU cards' zones read)
 * ------------------------------------------------------------------ */

describe('sd10y (the rolling 10-year z-score)', () => {
  const def = makeDef({ rule: { kind: 'info' } });

  it('a base of 30+ observations carries the z-score of the current value', () => {
    // 40 monthly observations: 39 at 100/101 alternating, then 120 now.
    const s: SeriesPoint[] = [];
    for (let i = 40; i >= 1; i--) {
      const d = new Date(Date.parse('2026-09-01T00:00:00Z'));
      d.setUTCMonth(d.getUTCMonth() - i);
      s.push({ date: d.toISOString().slice(0, 10), value: i % 2 === 0 ? 100 : 101 });
    }
    s.push({ date: '2026-09-01', value: 120 });
    const reading = readingOf(def, s, '2026-09-30T02:00:00.000Z');
    expect(reading.sd10y).toBeDefined();
    // base = 40 alternating points → mean 100.5, sample sd = sqrt(40×0.25/39)
    // ≈ 0.5064 → z = (120 − 100.5)/0.5064 ≈ 38.51.
    expect(reading.sd10y).toBeCloseTo(38.509, 2);
    // The percentile rides the same base (both are decade-position measures).
    expect(reading.percentile10y).toBe(1);
  });

  it('a base below MIN_PERCENTILE_OBS carries no z (never a guess)', () => {
    const s: SeriesPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.parse('2026-09-01T00:00:00Z'));
      d.setUTCMonth(d.getUTCMonth() - i);
      s.push({ date: d.toISOString().slice(0, 10), value: 100 + (i % 3) });
    }
    const reading = readingOf(def, s, '2026-09-30T02:00:00.000Z');
    expect(reading.sd10y).toBeUndefined();
  });

  it('a zero-variance base (every value identical) carries no z', () => {
    const s: SeriesPoint[] = [];
    for (let i = 40; i >= 0; i--) {
      const d = new Date(Date.parse('2026-09-01T00:00:00Z'));
      d.setUTCMonth(d.getUTCMonth() - i);
      s.push({ date: d.toISOString().slice(0, 10), value: 100 });
    }
    const reading = readingOf(def, s, '2026-09-30T02:00:00.000Z');
    expect(reading.sd10y).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * Rule: above-low
 * ------------------------------------------------------------------ */

describe('rule: above-low', () => {
  const rule = { kind: 'above-low', rise: 0.5 } as const;

  function unemployment(final: number): SeriesPoint[] {
    // 12 monthly observations at 5.0…5.4 with a 12-month low of 5.0, then the final month
    const s = dailySeries(12, (i) => 5 + (i % 5) * 0.1, '2023-08-01');
    s.forEach((p, i) => (p.date = addDays('2023-08-01', i * 30)));
    s.push({ date: addDays('2024-07-01', 0), value: final });
    return s;
  }

  it(`rise of exactly ${0.5} from the 12-month low is a warning (≥)`, () => {
    expect(verdictOf(rule, unemployment(5.5)).status).toBe('warning');
  });
  it('smaller rise → normal', () => {
    expect(verdictOf(rule, unemployment(5.49)).status).toBe('normal');
  });
  it(`fewer than ${MIN_ABOVE_LOW_OBS} observations in the window → unevaluable`, () => {
    const s = [5, 5.1, 5.2, 5.3, 5.4].map((v, i) => ({ date: addDays('2024-01-01', i * 30), value: v }));
    expect(verdictOf(rule, s).status).toBe('unevaluable');
  });
});

/* ------------------------------------------------------------------ *
 * Rule: any-of composite
 * ------------------------------------------------------------------ */

describe('rule: any-of (us10y)', () => {
  const percentileThin: WarningRuleAtom = { kind: 'percentile', tail: 'high', cutoff: 0.1 };
  const changeHit: WarningRuleAtom = { kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 };
  const changeMiss: WarningRuleAtom = { kind: 'change', mode: 'points', direction: 'rise', magnitude: 50, windowWeeks: 4 };

  const shortSeries: SeriesPoint[] = [
    { date: '2024-06-12', value: 2.0 },
    { date: '2024-07-10', value: 2.6 },
  ];

  it('a warning arm wins even when the other arm is unevaluable', () => {
    expect(verdictOf({ kind: 'any-of', of: [percentileThin, changeHit] }, shortSeries).status).toBe('warning');
  });
  it('normal beats unevaluable', () => {
    expect(verdictOf({ kind: 'any-of', of: [percentileThin, changeMiss] }, shortSeries).status).toBe('normal');
  });
  it('all arms unevaluable → unevaluable', () => {
    expect(verdictOf({ kind: 'any-of', of: [percentileThin, { kind: 'yoy-negative' }] }, shortSeries).status).toBe('unevaluable');
  });
});

/* ------------------------------------------------------------------ *
 * computeReading — statuses, changes, percentile field
 * ------------------------------------------------------------------ */

describe('computeReading', () => {
  it('empty series → unavailable with null value/asOf', () => {
    const r = readingOf(makeDef({ rule: { kind: 'threshold', direction: 'above', value: 0 } }), []);
    expect(r).toMatchObject({ status: 'unavailable', value: null, asOf: null, sourceName: 'Test source' });
  });

  it('series with only future observations → unavailable', () => {
    const r = readingOf(makeDef({ rule: { kind: 'threshold', direction: 'above', value: 0 } }), [
      { date: '2024-08-01', value: 1 },
    ]);
    expect(r.status).toBe('unavailable');
  });

  it('fresh value but unmeetable rule → no-history (value shown, no verdict)', () => {
    const s: SeriesPoint[] = [{ date: NOW_DAY, value: 1 }];
    const r = readingOf(makeDef({ rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 } }), s);
    expect(r).toMatchObject({ status: 'no-history', value: 1, asOf: NOW_DAY });
  });

  it('info rule → context regardless of history', () => {
    const r = readingOf(makeDef({ rule: { kind: 'info' } }), [{ date: NOW_DAY, value: 3.5 }]);
    expect(r.status).toBe('context');
  });

  it(`data older than cadence + grace → stale (a would-be warning vote is suppressed)`, () => {
    const def = makeDef({ rule: { kind: 'threshold', direction: 'above', value: 0 } });
    const lastObs = addDays(NOW_DAY, -(1 + GRACE_DAYS.daily! + 1)); // 5 days old
    const r = readingOf(def, [{ date: lastObs, value: 10 }]);
    expect(r.status).toBe('stale');
  });

  it("I15: staleAfterDays overrides the cadence grace (Brent's 12-day limit beats the 3-day daily grace)", () => {
    const def = makeDef({ rule: { kind: 'info' }, staleAfterDays: 12 });
    expect(staleAfterDaysFor(def)).toBe(12);
    // 5 days old — daily grace would call it stale, the override keeps it fresh.
    const r = readingOf(def, [{ date: addDays(NOW_DAY, -5), value: 82 }]);
    expect(r.status).toBe('context'); // info rule → context once fresh
    // 13 days old — past the limit → stale.
    const r2 = readingOf(def, [{ date: addDays(NOW_DAY, -13), value: 82 }]);
    expect(r2.status).toBe('stale');
  });

  it('R10-2: a weekly series with staleAfterDays:14 absorbs one missed weekly release (STLFSI4, FRED 2026-10-27)', () => {
    // The live incident this pins: FRED STLFSI4's last observation was
    // 2026-10-16 (the 2026-10-23 Thursday release never landed). With the
    // 10-day weekly default the 11-day-old reading would flag stale at
    // 2026-10-27; the 14-day override — matching NFCI's documented
    // precedent — keeps it fresh until the second consecutive missed week.
    const def = makeDef({
      cadence: 'weekly',
      rule: { kind: 'threshold', direction: 'above', value: 0, sustainedWeeks: 4 },
      staleAfterDays: 14,
    });
    expect(staleAfterDaysFor(def)).toBe(14);
    // 11 days old (one missed Thursday) — fresh.
    const r11 = readingOf(def, [{ date: addDays(NOW_DAY, -11), value: -0.63 }]);
    expect(r11.status).not.toBe('stale');
    // 14 days old (still inside the window) — fresh.
    const r14 = readingOf(def, [{ date: addDays(NOW_DAY, -14), value: -0.63 }]);
    expect(r14.status).not.toBe('stale');
    // 15 days old (past the limit) — stale. The second missed Thursday
    // would put the observation 18 days old, well past 14.
    const r15 = readingOf(def, [{ date: addDays(NOW_DAY, -15), value: -0.63 }]);
    expect(r15.status).toBe('stale');
  });

  it('per-change cadence never goes stale (cash rate is a level)', () => {
    const def = makeDef({ cadence: 'per-change', rule: { kind: 'info' } });
    const r = readingOf(def, [{ date: '2019-06-05', value: 1.5 }], NOW);
    expect(r.status).toBe('context');
  });

  it('change7d/change30d: pct and points conversions; monthly/quarterly speak "since the previous release"', () => {
    const daily = dailySeries(40, (i) => 100 + i); // current 139 at 2023-02-10
    const pct = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'pct' }), daily);
    expect(pct.change7d).toBeCloseTo(((139 - 132) / 132) * 100, 6);
    expect(pct.change30d).toBeCloseTo(((139 - 109) / 109) * 100, 6);
    const pts = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'points' }), daily);
    expect(pts.change7d).toBe(7);
    expect(pts.change30d).toBe(30);

    // Step-1 audit item C6: quarterly series — the change is vs the PREVIOUS
    // OBSERVATION (the previous release), and there is no 7-day change.
    const quarterly = [0, 90, 180].map((d) => ({ date: addDays('2024-01-01', d), value: 100 + d }));
    const q = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'pct', cadence: 'quarterly' }), quarterly, '2024-07-05T00:00:00Z');
    expect(q.change7d).toBeUndefined();
    // current 280 (2024-06-29) vs previous 190 (2024-03-31) → +47.37%
    expect(q.change30d).toBeCloseTo(((280 - 190) / 190) * 100, 6);
    const qPts = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'points', cadence: 'quarterly' }), quarterly, '2024-07-05T00:00:00Z');
    expect(qPts.change30d).toBe(90); // 280 − 190: percentage points vs previous release
    // Monthly cadence behaves the same way.
    const monthly = [0, 31, 59].map((d) => ({ date: addDays('2024-01-01', d), value: 3.0 + d / 100 }));
    const m = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'points', cadence: 'monthly' }), monthly, '2024-03-15T00:00:00Z');
    expect(m.change7d).toBeUndefined();
    expect(m.change30d).toBeCloseTo((3.59 - 3.31), 6); // points vs previous release
  });

  it('percentile10y appears once the base clears the floor, else absent', () => {
    const short = dailySeries(20, (i) => i); // base 19 < floor
    expect(readingOf(makeDef({ rule: { kind: 'info' } }), short).percentile10y).toBeUndefined();
    const long = dailySeries(200, (i) => i);
    expect(readingOf(makeDef({ rule: { kind: 'info' } }), long).percentile10y).toBeCloseTo(1, 6);
  });

  /* Step-2 add-list §B1: the last step change (date + size) — the exact
   * policy decision, not a rolling 30-day window. */
  it('lastChange: the most recent observation whose value differs from the one before it', () => {
    // A policy-rate ladder: flat, then a +0.25 step on 2024-06-05, flat since.
    const ladder: SeriesPoint[] = [
      { date: '2024-01-02', value: 4.35 },
      { date: '2024-01-03', value: 4.35 },
      { date: '2024-06-05', value: 4.6 },
      { date: '2024-06-06', value: 4.6 },
    ];
    const r = readingOf(
      makeDef({ id: 'rba-cash-rate', cadence: 'per-change', changeKind: 'points', rule: { kind: 'info' } }),
      ladder,
    );
    expect(r.lastChange).toEqual({ date: '2024-06-05', points: 0.25 });
  });

  it('lastChange: a cut is negative; a one-observation series has none', () => {
    const cut: SeriesPoint[] = [
      { date: '2024-01-02', value: 4.35 },
      { date: '2024-03-20', value: 4.1 },
    ];
    const r = readingOf(
      makeDef({ id: 'rba-cash-rate', cadence: 'per-change', changeKind: 'points', rule: { kind: 'info' } }),
      cut,
    );
    expect(r.lastChange).toEqual({ date: '2024-03-20', points: -0.25 });
    const only = readingOf(
      makeDef({ id: 'rba-cash-rate', cadence: 'per-change', changeKind: 'points', rule: { kind: 'info' } }),
      [cut[0]!],
    );
    expect(only.lastChange).toBeUndefined();
  });

  it('lastChange: survives staleness — a stale reading still states its last decision', () => {
    const oldLadder: SeriesPoint[] = [
      { date: '2024-01-02', value: 4.35 },
      { date: '2024-01-03', value: 4.6 },
    ];
    // per-change cadence never goes stale; force staleness with a daily def.
    const dailyDef = makeDef({ id: 'us10y', cadence: 'daily', changeKind: 'points', rule: { kind: 'info' }, staleAfterDays: 1 });
    const stale = readingOf(dailyDef, oldLadder, '2024-07-10T00:00:00Z');
    expect(stale.status).toBe('stale');
    expect(stale.lastChange).toEqual({ date: '2024-01-03', points: 0.25 });
  });
});

/* ------------------------------------------------------------------ *
 * Rule: below-aux (I15 — wage growth vs yearly inflation)
 * ------------------------------------------------------------------ */

describe('rule: below-aux', () => {
  const wage = [3.4, 3.4].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
  const cpiAbove = [3.9, 3.9].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
  const cpiBelow = [2.5, 2.5].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
  const cpiLater = [3.4, 3.9].map((v, i) => ({ date: addDays('2024-03-30', i * 90), value: v }));

  it('value below the paired series at the same date → warning', () => {
    const def = makeDef({ rule: { kind: 'below-aux' } });
    expect(evaluateRule(def, wage, '2024-03-29', { series: cpiAbove }).status).toBe('warning');
  });
  it('value at or above the paired series → normal (ties keep up)', () => {
    const def = makeDef({ rule: { kind: 'below-aux' } });
    expect(evaluateRule(def, wage, '2024-03-29', { series: cpiBelow }).status).toBe('normal');
    const equalCpi = [3.4, 3.4].map((v, i) => ({ date: addDays('2024-01-01', i * 90), value: v }));
    expect(evaluateRule(def, wage, '2024-03-29', { series: equalCpi }).status).toBe('normal');
  });
  it('the aux series is sampled at or BEFORE the reading date (a later aux point never leaks back)', () => {
    const def = makeDef({ rule: { kind: 'below-aux' } });
    // cpiLater starts 2024-03-30 — after the wage reading's date (2024-03-29)
    // — so there is no aux point at or before it → unevaluable.
    expect(evaluateRule(def, wage, '2024-03-29', { series: cpiLater }).status).toBe('unevaluable');
  });
  it('no aux supplied → honestly unevaluable, never guessed', () => {
    const def = makeDef({ rule: { kind: 'below-aux' } });
    expect(evaluateRule(def, wage, '2024-03-29').status).toBe('unevaluable');
    expect(evaluateRule(def, wage, '2024-03-29', { series: [] }).status).toBe('unevaluable');
  });
  it('computeReading marks an un-supplied aux rule no-history (value still shown)', () => {
    const def = makeDef({ rule: { kind: 'below-aux' }, cadence: 'quarterly' });
    const r = readingOf(def, wage, '2024-06-28T02:00:00.000Z');
    expect(r).toMatchObject({ status: 'no-history', value: 3.4 });
  });
});

/* ------------------------------------------------------------------ *
 * moveScoreOf (I15 big-mover z-score)
 * ------------------------------------------------------------------ */

describe('moveScoreOf', () => {
  it('standardises the latest change against the window mean/std', () => {
    // ~400 daily points with a stable change series, then one outlier move.
    const base = dailySeries(400, (i) => 100 + Math.sin(i / 20) * 2, '2023-01-02');
    const last = base[base.length - 1]!;
    const spiked = [...base.slice(0, -1), { date: last.date, value: last.value + 30 }];
    const def = makeDef({ rule: { kind: 'info' }, changeKind: 'pct' });
    const z = moveScoreOf(def, spiked, spiked[spiked.length - 1]!);
    expect(z).toBeDefined();
    expect(Math.abs(z!)).toBeGreaterThan(2); // a 30-point spike on a ±2 band is a big mover
  });
  it('too few change observations → undefined (degenerate base guard)', () => {
    const short = dailySeries(10, (i) => 100 + i);
    const def = makeDef({ rule: { kind: 'info' }, changeKind: 'pct' });
    expect(moveScoreOf(def, short, short[short.length - 1]!)).toBeUndefined();
    expect(MIN_MOVE_OBS).toBe(30);
  });
  it('perfectly flat change series (zero std) → undefined', () => {
    // Strictly linear points: every change identical → std = 0.
    const linear = dailySeries(100, (i) => 100 + i);
    const def = makeDef({ rule: { kind: 'info' }, changeKind: 'points' });
    expect(moveScoreOf(def, linear, linear[linear.length - 1]!)).toBeUndefined();
  });
  it('computeReading carries moveScore on votable fresh readings, never on stale ones', () => {
    // 400 daily points ENDING at NOW_DAY so the reading is fresh.
    const base = dailySeries(400, (i) => 100 + Math.sin(i / 20) * 2, addDays(NOW_DAY, -399));
    const def = makeDef({ rule: { kind: 'threshold', direction: 'above', value: 0 } });
    const fresh = readingOf(def, base);
    expect(['normal', 'warning']).toContain(fresh.status); // votable — that's what matters
    expect(typeof fresh.moveScore).toBe('number');
    // The same series truncated 10 days before NOW → past the daily grace →
    // stale, and stale items never carry a move score (data spec §4).
    const old = base.slice(0, 390);
    const stale = readingOf(def, old);
    expect(stale.status).toBe('stale');
    expect(stale.moveScore).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * changedSince — frozen clock
 * ------------------------------------------------------------------ */

describe('changedSince (what changed this week)', () => {
  const t = '2024-07-10T02:00:00.000Z';

  function reading(id: IndicatorDefinition['id'], status: IndicatorReading['status'], asOf: string | null): IndicatorReading {
    return {
      id,
      value: asOf === null ? null : 1,
      asOf,
      status,
      sourceName: 't',
      updatedAt: t,
    };
  }

  it('records vote flips observed within the window (frozen clock)', () => {
    const prev = [reading('usdjpy', 'normal', '2024-07-03'), reading('us10y', 'warning', '2024-07-03')];
    const curr = [reading('usdjpy', 'warning', '2024-07-08'), reading('us10y', 'warning', '2024-07-08')];
    expect(changedSince(prev, curr, t)).toEqual([{ id: 'usdjpy', from: 'normal', to: 'warning', asOf: '2024-07-08' }]);
  });

  it('an older flip (runner was down) falls outside the 7-day window', () => {
    const prev = [reading('usdjpy', 'normal', '2024-06-01')];
    const curr = [reading('usdjpy', 'warning', '2024-06-20')];
    expect(changedSince(prev, curr, t)).toEqual([]);
    expect(changedSince(prev, curr, t, 30)).toHaveLength(1); // wider window catches it
  });

  it('transitions involving non-voting statuses never appear', () => {
    const prev = [reading('usdjpy', 'stale', '2024-07-03'), reading('us10y', 'normal', '2024-07-03')];
    const curr = [reading('usdjpy', 'warning', '2024-07-08'), reading('us10y', 'unavailable', null)];
    expect(changedSince(prev, curr, t)).toEqual([]);
  });

  it('ids missing from the previous run are ignored (first run has no diff)', () => {
    const curr = [reading('usdjpy', 'warning', '2024-07-08')];
    expect(changedSince([], curr, t)).toEqual([]);
  });
});
