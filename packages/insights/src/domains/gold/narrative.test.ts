/**
 * narrative.test.ts — GPE R11 / F1: the daily narrative's grammar, pinned
 * (s7/03 §2.3 — "the template grammar is versioned in code with tests:
 * every sentence pattern pinned against frozen scenarios"). The engine
 * under test is the pure derivation the Gold page's Zone D renders; the
 * frozen 2026-10-31 corpus archive (the gold-balance fixture of record)
 * anchors the model to a recorded day, and synthetic batteries pin the
 * rules: the one-projection consistency (§2.4 — the narrative's counts
 * are byte-identical to the balance's), the movers discipline (only
 * firing seats, raw deltas, never attribution shares — the no-fake-GRAM
 * rule), and the price fact's C1 fields.
 */

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { GOLD_LANES } from '../../shared/gold-score';
import { goldBalance } from './gold-balance';
import { NARRATIVE_MAX_MOVERS, goldNarrative } from './narrative';

const NOW = '2026-11-18T04:10:00.000Z';
const DAY = '2026-11-17';

function reading(id: IndicatorId, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: DAY,
    status: 'normal',
    sourceName: 't',
    updatedAt: NOW,
    ...extra,
  };
}

/** The corpus's recorded 2026-10-31 archive, as the page-shaped readings
 * (the gold-balance fixture of record — same loader, same day). */
function fixtureReadings(): IndicatorReading[] {
  const corpus = JSON.parse(
    readFileSync(new URL('../../../fixtures/gold-backtest-corpus.json', import.meta.url), 'utf8'),
  ) as { archives: Record<string, { generatedAt: string; readings: unknown[] }> };
  const archive = corpus.archives['2026-10-31']!;
  return archive.readings.map((raw) => {
    const r = raw as {
      id: IndicatorId;
      value: number;
      asOf: string;
      status: IndicatorReading['status'];
      percentile10y?: number;
      change30d?: number;
    };
    return {
      id: r.id,
      value: r.value,
      asOf: r.asOf,
      status: r.status,
      percentile10y: r.percentile10y,
      change30d: r.change30d,
      sourceName: 'archive 2026-10-31',
      updatedAt: archive.generatedAt,
    } satisfies IndicatorReading;
  });
}

describe('goldNarrative — the structure (the arc, s7/03 §2.1)', () => {
  it('carries exactly the five families in GOLD_LANES order, whatever the data', () => {
    const n = goldNarrative(fixtureReadings());
    expect(n.families.map((f) => f.lane)).toEqual([...GOLD_LANES]);
  });

  it('the price fact reads the gold-usd reading and NOTHING else (C1: the series + as-of are the reading\'s own)', () => {
    const n = goldNarrative([
      reading('gold-usd', {
        value: 3752.4,
        asOf: '2026-11-18',
        sourceName: 'Yahoo Finance: COMEX gold futures (GC=F)',
        sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
        change1d: -2.89,
        change30d: -9.8,
        change90d: -17.6,
      }),
    ]);
    expect(n.price).toEqual({
      value: 3752.4,
      asOf: '2026-11-18',
      seriesName: 'Yahoo Finance: COMEX gold futures (GC=F)',
      seriesUrl: 'https://finance.yahoo.com/quote/GC=F',
      change1d: -2.89,
      change30d: -9.8,
      change90d: -17.6,
    });
  });

  it('an absent gold-usd renders a null price fact (fail-closed, never a guessed price)', () => {
    const n = goldNarrative([reading('us10y', { value: 5.12 })]);
    expect(n.price).toBeNull();
  });

  it('non-finite change windows render null (a missing window is never a garbage number)', () => {
    const n = goldNarrative([
      reading('gold-usd', { value: 100, change1d: Number.NaN, change30d: Number.POSITIVE_INFINITY }),
    ]);
    expect(n.price?.change1d).toBeNull();
    expect(n.price?.change30d).toBeNull();
    expect(n.price?.change90d).toBeNull();
  });
});

describe('goldNarrative — the one-projection consistency (s7/03 §2.4, binding)', () => {
  it('the narrative\'s counts are byte-identical to the balance\'s (one goldBalance truth, deterministic)', () => {
    const readings = fixtureReadings();
    const n = goldNarrative(readings);
    const b = goldBalance(readings);
    expect(n.counts).toEqual(b.counts);
    // The narrative carries its own derivation of the SAME pure engine —
    // deterministic over the same readings, so deep-equal byte-for-byte
    // (the engine calls goldBalance exactly once, internally).
    expect(n.balance).toStrictEqual(b);
  });

  it('every family line\'s counts are the lane card\'s own counts (the hero = the narrative = the seats)', () => {
    const readings = fixtureReadings();
    const n = goldNarrative(readings);
    const b = goldBalance(readings);
    n.families.forEach((family, i) => {
      const lane = b.lanes[i]!;
      expect(family.lane).toBe(lane.lane);
      expect(family.side).toBe(lane.side);
      expect(family.split).toBe(lane.split);
      expect(family.supports).toBe(lane.supports);
      expect(family.pressures).toBe(lane.pressures);
      expect(family.readable).toBe(lane.readable);
      expect(family.firing).toBe(lane.firing);
    });
  });
});

describe('goldNarrative — the movers discipline (the no-fake-GRAM rule, s7/03 §2.2)', () => {
  it('movers come ONLY from firing seats with a finite 30-day change (never steady/unread, never shares of the move)', () => {
    const readings = fixtureReadings();
    const n = goldNarrative(readings);
    const b = goldBalance(readings);
    for (const family of n.families) {
      const lane = b.lanes.find((l) => l.lane === family.lane)!;
      const firingIds = new Set(
        lane.members.filter((m) => m.impact === 'supports' || m.impact === 'pressures').map((m) => m.id),
      );
      for (const mover of family.movers) {
        expect(firingIds.has(mover.id), `${mover.id} fires in ${family.lane}`).toBe(true);
      }
    }
  });

  it('at most NARRATIVE_MAX_MOVERS per family, sorted by |30-day change| (the biggest facts, compactly)', () => {
    const n = goldNarrative(fixtureReadings());
    for (const family of n.families) {
      expect(family.movers.length).toBeLessThanOrEqual(NARRATIVE_MAX_MOVERS);
      const abs = family.movers.map((m) => Math.abs(m.delta30d));
      expect([...abs]).toEqual([...abs].sort((a, b) => b - a));
    }
  });

  it('the changeKind follows the series\' own quoting (yields/spreads in points, the rest in percent)', () => {
    const n = goldNarrative(fixtureReadings());
    for (const family of n.families) {
      for (const mover of family.movers) {
        const expected = [
          'us10y',
          'real-yield-10y',
          'us30y',
          'fed-expectations',
          'vix',
          't5yie',
          'breakeven-5y5y',
          'breakeven-tilt',
          'michigan-5y-expectations',
          'michigan-1y-expectations',
        ].includes(mover.id)
          ? 'points'
          : 'pct';
        expect(mover.changeKind, `${mover.id}`).toBe(expected);
      }
    }
  });
});

describe('goldNarrative — the frozen 2026-10-31 scenario (the recorded day, pinned)', () => {
  it('the full model over the recorded archive: FOR 1 · neutral 3 · unread 1, the borrowing lane 3v1 with its movers, the price fact from the archive\'s own gold-usd', () => {
    const n = goldNarrative(fixtureReadings());
    // The archive carries gold-usd (the backtest corpus's own record) —
    // the price fact is the archive reading's OWN fields (C1).
    expect(n.price?.asOf).toBe('2026-10-31');
    expect(n.price?.value).toBeCloseTo(3876.399902, 6);
    expect(n.price?.seriesName).toBe('archive 2026-10-31'); // the reading's own source line
    // The balance of record (gold-balance test 12): the same counts.
    expect(n.counts).toEqual({ for: 1, against: 0, neutral: 3, unread: 1 });
    const borrowing = n.families[0]!;
    expect(borrowing.side).toBe('for');
    expect(borrowing.supports).toBe(3);
    expect(borrowing.pressures).toBe(1);
    // The recorded day's firing borrowing seats: real-yield-10y · us10y ·
    // fed-expectations (supports, falling) + us30y (pressures, high). The
    // movers are the biggest |change30d| among them, at most two.
    expect(borrowing.movers.length).toBeLessThanOrEqual(2);
    const moverIds = borrowing.movers.map((m) => m.id);
    for (const id of moverIds) {
      expect(['real-yield-10y', 'us10y', 'fed-expectations', 'us30y']).toContain(id);
    }
  });
});
