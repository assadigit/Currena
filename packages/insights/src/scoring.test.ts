import { describe, expect, it } from 'vitest';

import type { IndicatorDefinition, IndicatorReading, WarningRuleAtom } from '@currena/core';

import { addDays, type SeriesPoint } from './series';
import {
  GRACE_DAYS,
  MIN_ABOVE_LOW_OBS,
  MIN_PERCENTILE_OBS,
  computeReading,
  changedSince,
  evaluateRule,
  labelForScore,
  percentileOf,
  summarize,
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
    group: 'currencies',
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
  const series = dailySeries(10, () => 1);

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
    expect(summarize([r]).global).toMatchObject({ votingCount: 0, warningCount: 0, excludedCount: 1, label: null });
  });

  it('per-change cadence never goes stale (cash rate is a level)', () => {
    const def = makeDef({ cadence: 'per-change', rule: { kind: 'info' } });
    const r = readingOf(def, [{ date: '2019-06-05', value: 1.5 }], NOW);
    expect(r.status).toBe('context');
  });

  it('change7d/change30d: pct and points conversions; sparse anchors show undefined', () => {
    const daily = dailySeries(40, (i) => 100 + i); // current 139 at 2023-02-10
    const pct = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'pct' }), daily);
    expect(pct.change7d).toBeCloseTo(((139 - 132) / 132) * 100, 6);
    expect(pct.change30d).toBeCloseTo(((139 - 109) / 109) * 100, 6);
    const pts = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'points' }), daily);
    expect(pts.change7d).toBe(7);
    expect(pts.change30d).toBe(30);

    // Quarterly series: 7d/30d anchors are far away → undefined, never mislabelled
    const quarterly = [0, 90, 180].map((d) => ({ date: addDays('2024-01-01', d), value: 100 + d }));
    const q = readingOf(makeDef({ rule: { kind: 'info' }, changeKind: 'pct', cadence: 'quarterly' }), quarterly, '2024-07-05T00:00:00Z');
    expect(q.change7d).toBeUndefined();
    expect(q.change30d).toBeUndefined();
  });

  it('percentile10y appears once the base clears the floor, else absent', () => {
    const short = dailySeries(20, (i) => i); // base 19 < floor
    expect(readingOf(makeDef({ rule: { kind: 'info' } }), short).percentile10y).toBeUndefined();
    const long = dailySeries(200, (i) => i);
    expect(readingOf(makeDef({ rule: { kind: 'info' } }), long).percentile10y).toBeCloseTo(1, 6);
  });
});

/* ------------------------------------------------------------------ *
 * summarize — labels, boundaries, exclusion counting
 * ------------------------------------------------------------------ */

describe('summarize', () => {
  function reading(id: IndicatorDefinition['id'], status: IndicatorReading['status']): IndicatorReading {
    const unavailable = status === 'unavailable';
    return {
      id,
      value: unavailable ? null : 1,
      asOf: unavailable ? null : NOW_DAY,
      status,
      sourceName: 't',
      updatedAt: NOW,
    };
  }

  it.each([
    ['0 of 5 → relaxed', 0, 5, 'relaxed'],
    ['1 of 5 (0.2) → cautious (boundary inclusive)', 1, 5, 'cautious'],
    ['1 of 6 (<0.2) → relaxed', 1, 6, 'relaxed'],
    ['2 of 5 (0.4) → stressed', 2, 5, 'stressed'],
    ['3 of 5 (0.6) → alarmed', 3, 5, 'alarmed'],
  ] as const)('%s', (_label, warnings, voters, expected) => {
    const readings: IndicatorReading[] = [];
    for (let i = 0; i < warnings; i++) readings.push(reading('usdjpy', 'warning'));
    for (let i = 0; i < voters - warnings; i++) readings.push(reading('us10y', 'normal'));
    expect(summarize(readings).global.label).toBe(expected);
  });

  it('labelForScore boundaries', () => {
    expect(labelForScore(0)).toBe('relaxed');
    expect(labelForScore(0.199999)).toBe('relaxed');
    expect(labelForScore(0.2)).toBe('cautious');
    expect(labelForScore(0.399999)).toBe('cautious');
    expect(labelForScore(0.4)).toBe('stressed');
    expect(labelForScore(0.599999)).toBe('stressed');
    expect(labelForScore(0.6)).toBe('alarmed');
    expect(labelForScore(1)).toBe('alarmed');
  });

  it('sections are summarised independently; context cards are not "excluded"', () => {
    const readings: IndicatorReading[] = [
      reading('usdjpy', 'warning'),
      reading('us10y', 'normal'),
      reading('gold-btc', 'context'),
      reading('audusd', 'stale'),
      reading('au-unemployment', 'unavailable'),
      reading('audjpy', 'no-history'),
    ];
    const s = summarize(readings);
    expect(s.global).toEqual({ section: 'global', label: 'stressed', warningCount: 1, votingCount: 2, excludedCount: 0 });
    expect(s.australia).toEqual({ section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 3 });
  });

  it('nothing can vote → null label, never an invented one', () => {
    const s = summarize([reading('gold-btc', 'context')]);
    expect(s.global.label).toBeNull();
    expect(s.australia.label).toBeNull();
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
