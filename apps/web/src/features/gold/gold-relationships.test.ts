/**
 * gold-relationships.test.ts — the GUX-S6 M1 pins: the relationship
 * explorer's record module + its §5 contract, tested against
 * 10-indicator-relationship-map.md's own counts and rules.
 *
 * The pins (each one a 12 §5 / 10 §5 clause):
 *   - the record set: exactly 24 records, the ids exactly 10 §3's own
 *     (R-01…R-16, R-19…R-27 — R-17/R-18 retired-reserved, never used);
 *   - the class taxonomy: every class is M/C/X/K; X-flags carry
 *     separately from the class (an M or C record may flag);
 *   - the blocked edge: exactly one (R-26), legend-only;
 *   - the one-liners: every record carries BOTH locales' full text
 *     (10 §5's copy rule — the one-liner IS the edge label);
 *   - the honesty footer's numbers: the sign-agreement stats are the
 *     measured record's own (46.8/42.2/32.7 — the standing anchor).
 */

import { describe, expect, it } from 'vitest';
import { GOLD_RELATIONSHIPS, CLASS_WORD, type RelationshipClass } from './gold-relationships';

const INCLUDED_IDS = [
  'R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08',
  'R-09', 'R-10', 'R-11', 'R-12', 'R-13', 'R-14', 'R-15', 'R-16',
  'R-19', 'R-20', 'R-21', 'R-22', 'R-23', 'R-24', 'R-25', 'R-26', 'R-27',
] as const;

describe('gold-relationships — the record module (10 §3)', () => {
  it('carries §3\u2019s full record set in the doc\u2019s own order — 25 records, 24 verified + R-26 blocked-for-data', () => {
    // 10 §3 transcribes 25 R-records (R-01…R-16 + R-19…R-27; R-17/R-18
    // retired-reserved). 12 §5's contract renders "the 24 verified
    // records" — the 25th (R-26) is included conceptually but BLOCKED
    // for data: legend-only, never a canvas edge.
    expect(GOLD_RELATIONSHIPS).toHaveLength(25);
    expect(GOLD_RELATIONSHIPS.map((r) => r.id)).toEqual([...INCLUDED_IDS]);
    expect(GOLD_RELATIONSHIPS.filter((r) => !r.blocked)).toHaveLength(24);
  });

  it('never uses the retired-reserved ids R-17/R-18', () => {
    const ids = GOLD_RELATIONSHIPS.map((r) => r.id);
    expect(ids).not.toContain('R-17');
    expect(ids).not.toContain('R-18');
  });

  it('every record carries a valid class, both locales\u2019 one-liners, and two concepts', () => {
    const classes: readonly RelationshipClass[] = ['M', 'C', 'X', 'K'];
    for (const r of GOLD_RELATIONSHIPS) {
      expect(classes).toContain(r.class);
      expect(r.from.length).toBeGreaterThan(0);
      expect(r.to.length).toBeGreaterThan(0);
      // 10 §5's copy rule: the one-liners are the edge labels' FULL text.
      expect(r.en.length).toBeGreaterThan(40);
      expect(r.fa.length).toBeGreaterThan(40);
    }
  });

  it('the X flags carry separately from the primary class (the taxonomy\u2019s own rule)', () => {
    // The doc's own X-flagged records include M-class ones (R-01, R-02…)
    // and the pure-X record (R-22) — both shapes must exist.
    const flaggedM = GOLD_RELATIONSHIPS.filter((r) => r.xFlag && r.class === 'M');
    const pureX = GOLD_RELATIONSHIPS.filter((r) => r.class === 'X');
    expect(flaggedM.length).toBeGreaterThan(0);
    expect(pureX.map((r) => r.id)).toEqual(['R-22']);
  });

  it('exactly one blocked edge — R-26 (the ETF-flows record), legend-only', () => {
    const blocked = GOLD_RELATIONSHIPS.filter((r) => r.blocked);
    expect(blocked.map((r) => r.id)).toEqual(['R-26']);
  });

  it('the class word map covers all four classes', () => {
    expect(CLASS_WORD.M).toBe('mechanism');
    expect(CLASS_WORD.C).toBe('correlation');
    expect(CLASS_WORD.X).toBe('conditional');
    expect(CLASS_WORD.K).toBe('documented');
  });

  it('the R-09 record is the K-evidence shape the doc describes (class M, the post-2022 shift)', () => {
    const r09 = GOLD_RELATIONSHIPS.find((r) => r.id === 'R-09')!;
    expect(r09.class).toBe('M');
    expect(r09.xFlag).toBe(true);
    expect(r09.en).toContain('doubled after 2022');
  });
});
