/**
 * @vitest-environment jsdom
 *
 * balance.test.tsx — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md + v2–v6 + the v7 Iteration-5
 * addendum, 2026-10-26 — "Rotate the beam only, and visualize weight":
 * EXACTLY ONE element rotates (the beam group, by rotate(θ, cx, cy));
 * the pans translate plumb, never rotate/skew/scale; the hangers are
 * recomputed every frame from each joint to the pan's two fixed rim
 * corners; a needle + three-tick arc gauge reads the tilt. Covers:
 *
 *   §4  driver-state mapping (supportive/against/neutral/unknown →
 *       for/against/neutral/unread 1:1) and total/net/readable counts
 *   §6  the tilt rule (the v1 net/total ratio law, kept verbatim; the
 *       v7 addendum supersedes the PRESENTATION scale: |net|/total ×
 *       8° clamped to [2°, 8°] — the 2° floor keeps a one-driver lean
 *       visibly unlevel, 0° exactly for neutral and for unavailable)
 *   §A  the pure per-frame geometry: joints at
 *       (cx ± (L/2)·cos θ, cy ± (L/2)·sin θ); each pan translates by
 *       EXACTLY its joint's vertical displacement (plumb) and never
 *       moves horizontally; the hangers are joint → the pan's fixed
 *       rim corners (their angles change slightly as the pans travel);
 *       the vertical travel stays inside the envelope computed from
 *       the maximum θ; RTL flips the visual sign only
 *   §B  the gauge: three ticks only (adverse end · centre ·
 *       supportive end, labelled by verdict), the needle hides when
 *       the state is unavailable, and the drawing carries a text
 *       equivalent (never colour alone)
 *   §5.1/§12.1  the verdict word + " · "-joined count line and the
 *       role="group" aria label on the stage
 *   v7 structure  heading → subtitle → captions → stage (reference,
 *       hangers, gauge, THE ROTATING BEAM GROUP, pans) → assessment →
 *       lists → panel → trays; the ONLY transformed elements are the
 *       beam group (rotate) and the two assemblies (translate) —
 *       pans, tiles, text and pills carry NOTHING beyond translate
 *   v6 rules 1–5  fixed stage geometry; capacity + "+{n} more";
 *       complete empty pans; distinct empty/unreadable markers
 *   §7/§8/§12  tiles/rows/chips are real buttons with aria-expanded
 *       opening the shared detail panel
 *   §9  (integration) the merged card renders the balance between the
 *       outlook strip and the price footing strip
 */

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey, SignalConditionState, SignalReading } from '@currena/insights';
import balanceSrc from './BalanceScale.tsx?raw';
import {
  BalanceScale,
  BALANCE_ARC_R_PX,
  BALANCE_ARC_TICK_OUT_PX,
  BALANCE_HANG_SPREAD_PX,
  BALANCE_LH_PX,
  BALANCE_MAX_ANGLE_DEG,
  BALANCE_MIN_ANGLE_DEG,
  BALANCE_NEEDLE_LEN_PX,
  BALANCE_PAN_CAPACITY,
  BALANCE_PAN_H_DESKTOP,
  BALANCE_PAN_H_MOBILE,
  BALANCE_PAN_TOP_PX,
  BALANCE_PIVOT_Y_PX,
  BALANCE_STAGE_H_DESKTOP,
  BALANCE_STAGE_H_MOBILE,
  BALANCE_SWING_PX,
  balanceCounts,
  balanceGaugeGeometry,
  balanceStageGeometry,
  balanceTilt,
  balanceVerdictOf,
  countLineParts,
  driverStateOf,
  signedTiltDeg,
  type BalanceDriver,
} from './BalanceScale';
import { mergeSignals } from '../config';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';

const copy = insightsCopyEn;
const copyFa = insightsCopyFa;

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const d = (key: string, state: BalanceDriver['state'], label = key, valueText: string | null = null): BalanceDriver => ({
  key,
  label,
  detail: `${key} explanation sentence`,
  valueText,
  state,
});

const CASE_A: BalanceDriver[] = [
  d('real-yield', 'against', 'Real yields', '2.84%'),
  d('expectations', 'unread'),
  d('stress', 'unread'),
  d('dollar', 'unread'),
];
const CASE_A_DENSE: BalanceDriver[] = [
  d('real-yield', 'against', 'Real yields', '2.84%'),
  d('expectations', 'neutral'),
  d('stress', 'neutral'),
  d('dollar', 'neutral'),
];
// CASE_A_DENSE (v3 merge, UI-40): the old case-A anatomy tests moved to this
// DENSE twin — 1 against + 3 neutral (readable 4) renders the SAME 2-degree
// floor angle; the original CASE_A (1 against + 3 unread, readable 1) is now
// SPARSE and must render level + the not-enough line, never a direction.
const CASE_B: BalanceDriver[] = [
  d('real-yield', 'for', 'Real yields', '2.84%'),
  d('expectations', 'for', 'Inflation expectations'),
  d('stress', 'against', 'Market stress'),
  d('dollar', 'against', 'The US dollar'),
];
const CASE_C: BalanceDriver[] = [
  d('real-yield', 'for', 'Real yields', '2.84%'),
  d('expectations', 'for', 'Inflation expectations'),
  d('stress', 'for', 'Market stress'),
  d('dollar', 'neutral', 'The US dollar'),
];
const CASE_D: BalanceDriver[] = [
  d('real-yield', 'unread'),
  d('expectations', 'unread'),
  d('stress', 'unread'),
  d('dollar', 'unread'),
];
const CASE_E: BalanceDriver[] = [
  d('real-yield', 'against', 'Real yields', '2.84%'),
  d('expectations', 'against', 'Inflation expectations'),
  d('stress', 'against', 'Market stress'),
  d('dollar', 'against', 'The US dollar'),
];
/** v2 §8 case G: 1 for, 1 against, 2 unread — net 0, larger stack 1. */
const CASE_G: BalanceDriver[] = [
  d('real-yield', 'for', 'Real yields', '2.84%'),
  d('expectations', 'against', 'Inflation expectations'),
  d('stress', 'unread'),
  d('dollar', 'unread'),
];
/** v6 case H: a many-factor side (6 for / 3 against) — beyond any real
 * driver list, harness-only: proves the pans keep their capacity, the
 * "+{n} more" pills count the overflow, the full lists disclose, and
 * the stage's fixed geometry ignores the factor count. */
const CASE_H: BalanceDriver[] = [
  d('f1', 'for', 'Factor one'),
  d('f2', 'for', 'Factor two'),
  d('f3', 'for', 'Factor three'),
  d('f4', 'for', 'Factor four'),
  d('f5', 'for', 'Factor five'),
  d('f6', 'for', 'Factor six'),
  d('a1', 'against', 'Adverse one'),
  d('a2', 'against', 'Adverse two'),
  d('a3', 'against', 'Adverse three'),
];
/** Addendum-C fixtures — item count and weight disagree (the model is
 * counts-only, so the count settles it; the tests pin that honestly):
 * one adverse vs four supportive, and the exact even split. */
const CASE_ONE_VS_FOUR: BalanceDriver[] = [
  d('a1', 'against', 'Adverse one'),
  d('f1', 'for', 'Supportive one'),
  d('f2', 'for', 'Supportive two'),
  d('f3', 'for', 'Supportive three'),
  d('f4', 'for', 'Supportive four'),
];
const CASE_FIVE_VS_FIVE: BalanceDriver[] = [
  d('f1', 'for', 'Supportive one'),
  d('f2', 'for', 'Supportive two'),
  d('f3', 'for', 'Supportive three'),
  d('f4', 'for', 'Supportive four'),
  d('f5', 'for', 'Supportive five'),
  d('a1', 'against', 'Adverse one'),
  d('a2', 'against', 'Adverse two'),
  d('a3', 'against', 'Adverse three'),
  d('a4', 'against', 'Adverse four'),
  d('a5', 'against', 'Adverse five'),
];

const countsOf = (drivers: BalanceDriver[]): ReturnType<typeof balanceCounts> => balanceCounts(drivers);

afterEach(() => {
  cleanup();
});

/** The renders below assert the FINAL geometry deterministically: the
 * first paint already carries the verdict angle (v7: the static
 * picture IS the verdict), and a changed verdict lands immediately
 * under reduced motion — so mock matchMedia as reducing. */
beforeAll(() => {
  const mql = {
    matches: true,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  if (typeof window.matchMedia === 'function') {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  } else {
    window.matchMedia = vi.fn().mockReturnValue(mql);
  }
});

/** Does `a` precede `b` in the document flow? (structure-order
 * assertions — compareDocumentPosition, unambiguous in jsdom.) */
function precedes(a: Node | null | undefined, b: Node | null | undefined): boolean {
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  return (a!.compareDocumentPosition(b!) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

/** The component's rendered-coordinate rounding (kept in lockstep). */
const r2 = (v: number): number => Math.round(v * 100) / 100;

const radOf = (deg: number): number => (deg * Math.PI) / 180;

/* ------------------------------------------------------------------ *
 * §4 — the state map and the counts
 * ------------------------------------------------------------------ */

describe('§4 driver states and counts', () => {
  it('maps the condition states 1:1 — neutral and unread stay different', () => {
    expect(driverStateOf('supportive')).toBe('for');
    expect(driverStateOf('against')).toBe('against');
    expect(driverStateOf('neutral')).toBe('neutral');
    expect(driverStateOf('unknown')).toBe('unread');
  });

  it('counts total, net and readable per the spec definitions', () => {
    expect(countsOf(CASE_A)).toEqual({ for: 0, against: 1, neutral: 0, unread: 3, total: 4, net: -1, readable: 1 });
    expect(countsOf(CASE_C)).toEqual({ for: 3, against: 0, neutral: 1, unread: 0, total: 4, net: 3, readable: 4 });
    expect(countsOf(CASE_H)).toEqual({ for: 6, against: 3, neutral: 0, unread: 0, total: 9, net: 3, readable: 9 });
  });
});

/* ------------------------------------------------------------------ *
 * §6 — the tilt rule and the physical sign (v7 presentation scale)
 * ------------------------------------------------------------------ */

describe('§6 beam tilt (the v1 ratio law on the v7 scale)', () => {
  it('case A (1 against, 3 unread): against side down at the 2° floor', () => {
    const t = balanceTilt(countsOf(CASE_A), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MIN_ANGLE_DEG);
    expect(t.heavy).toBe('against');
    // The bead pair differs by Lh × sin; each pan moves by half that.
    expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(2)) * BALANCE_LH_PX, 10);
    expect(t.risePx).toBeCloseTo(t.endDropPx / 2, 12);
  });

  it('case B (2 for, 2 against): level', () => {
    const t = balanceTilt(countsOf(CASE_B), BALANCE_LH_PX);
    expect(t).toEqual({ angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null });
  });

  it('case C (3 for, 1 neutral): for side down at 6° (ratio 0.75 × 8°)', () => {
    const t = balanceTilt(countsOf(CASE_C), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(6);
    expect(t.heavy).toBe('for');
    expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(6)) * BALANCE_LH_PX, 10);
  });

  it('case D (4 unread): readable 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_D), BALANCE_LH_PX).heavy).toBeNull();
  });

  it('case G (1 for, 1 against, 2 unread): net 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_G), BALANCE_LH_PX).heavy).toBeNull();
  });

  it('case E (4 against): the model full range — the 8° maximum', () => {
    const t = balanceTilt(countsOf(CASE_E), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MAX_ANGLE_DEG);
    expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(8)) * BALANCE_LH_PX, 10);
  });

  it('the picture shows no height difference other than Lh × sin(angle)', () => {
    for (const drivers of [CASE_A, CASE_B, CASE_C, CASE_D, CASE_E, CASE_G, CASE_H, CASE_ONE_VS_FOUR, CASE_FIVE_VS_FIVE]) {
      const t = balanceTilt(countsOf(drivers), BALANCE_LH_PX);
      if (t.heavy === null) {
        expect(t.endDropPx).toBe(0);
      } else {
        expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(t.angleDeg)) * BALANCE_LH_PX, 10);
        expect(t.risePx * 2).toBeCloseTo(t.endDropPx, 12);
      }
    }
  });

  it('never dips below the 2° floor when net ≠ 0 (a one-driver lean stays visible)', () => {
    const oneVsMany: BalanceDriver[] = [...CASE_A, d('x1', 'unread'), d('x2', 'unread'), d('x3', 'unread'), d('x4', 'unread'), d('x5', 'unread'), d('x6', 'unread'), d('x7', 'unread'), d('x8', 'unread'), d('x9', 'unread')];
    const t = balanceTilt(countsOf(oneVsMany), BALANCE_LH_PX);
    expect(t.angleDeg).toBeGreaterThanOrEqual(BALANCE_MIN_ANGLE_DEG);
    expect(t.angleDeg).toBeLessThanOrEqual(BALANCE_MAX_ANGLE_DEG);
  });

  it('addendum-C fixtures: one adverse vs four supportive settles by COUNT (the model has no weights)', () => {
    // 1 vs 4 → net +3, total 5 → 0.6 × 8° = 4.8°, the FOR pan lower.
    const t = balanceTilt(countsOf(CASE_ONE_VS_FOUR), BALANCE_LH_PX);
    expect(t.angleDeg).toBeCloseTo(4.8, 10);
    expect(t.heavy).toBe('for');
    // 5 vs 5 → net 0 → exactly level, no directional verdict.
    expect(balanceTilt(countsOf(CASE_FIVE_VS_FIVE), BALANCE_LH_PX).heavy).toBeNull();
    expect(balanceVerdictOf(countsOf(CASE_FIVE_VS_FIVE))).toBe('balanced');
  });

  it('a zero Lh stays level (a degenerate drawing never fabricates a tilt)', () => {
    expect(balanceTilt(countsOf(CASE_A), 0).heavy).toBeNull();
  });

  it('signedTiltDeg maps the verdict to the physical sign: against heavy = positive, for = negative, level = 0', () => {
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_A), BALANCE_LH_PX))).toBe(2);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_C), BALANCE_LH_PX))).toBe(-6);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_E), BALANCE_LH_PX))).toBe(8);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_B), BALANCE_LH_PX))).toBe(0);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_D), BALANCE_LH_PX))).toBe(0);
  });

  it('the addendum presentation scale: max 8°, floor 2°, capacity 2 — the constants', () => {
    expect(BALANCE_MAX_ANGLE_DEG).toBe(8);
    expect(BALANCE_MIN_ANGLE_DEG).toBe(2);
    expect(BALANCE_PAN_CAPACITY).toBe(2);
  });
});

/* ------------------------------------------------------------------ *
 * §A — the pure per-frame geometry (v7's beam-only rotation)
 * ------------------------------------------------------------------ */

describe('§A stage geometry (one rotating element, plumb pans, redrawn hangers)', () => {
  it('the beam group carries rotate(θ, pivotX, pivotY) and NOTHING else is transformed by the geometry', () => {
    const g = balanceStageGeometry(640, 4.8, false);
    expect(g.beamTransform).toBe(`rotate(4.8 320 ${BALANCE_PIVOT_Y_PX})`);
    // The joints are the rotated beam ends, by the addendum's formula.
    expect(g.against.joint.x).toBeCloseTo(320 + 160 * Math.cos(radOf(4.8)), 10);
    expect(g.against.joint.y).toBeCloseTo(BALANCE_PIVOT_Y_PX + 160 * Math.sin(radOf(4.8)), 10);
    expect(g.for.joint.x).toBeCloseTo(320 - 160 * Math.cos(radOf(4.8)), 10);
    expect(g.for.joint.y).toBeCloseTo(BALANCE_PIVOT_Y_PX - 160 * Math.sin(radOf(4.8)), 10);
  });

  it('each pan translates by EXACTLY its joint\'s vertical displacement — plumb, never horizontally', () => {
    for (const theta of [-8, -2, 0, 2, 8]) {
      const g = balanceStageGeometry(640, theta, false);
      for (const side of ['for', 'against'] as const) {
        const s = g[side];
        expect(s.panDrop).toBeCloseTo(s.joint.y - BALANCE_PIVOT_Y_PX, 10);
        // The pan stays on its column: the rim anchors' x is θ-free.
        const centreX = side === 'for' ? 160 : 480;
        expect(s.rimStart.x).toBe(centreX - BALANCE_HANG_SPREAD_PX);
        expect(s.rimEnd.x).toBe(centreX + BALANCE_HANG_SPREAD_PX);
        // The rim anchors ride the pan: rim y = pan top + the drop.
        expect(s.rimStart.y).toBeCloseTo(BALANCE_PAN_TOP_PX + s.panDrop, 10);
        expect(s.rimEnd.y).toBeCloseTo(BALANCE_PAN_TOP_PX + s.panDrop, 10);
      }
    }
  });

  it('the hangers meet the joint exactly and their angles change slightly as the pans travel (the real-hanging cue)', () => {
    // At rest the two hangers of a side are mirror-symmetric...
    const level = balanceStageGeometry(640, 0, false);
    const dxStart = level.against.rimStart.x - level.against.joint.x;
    const dxEnd = level.against.rimEnd.x - level.against.joint.x;
    expect(Math.abs(dxStart)).toBe(Math.abs(dxEnd));
    // ...at ±max the joint arcs a second-order amount sideways while
    // the pan stays put, so the two hangers' angles differ slightly.
    for (const theta of [-8, 8]) {
      const g = balanceStageGeometry(640, theta, false);
      const s = g.against;
      const dxStart2 = s.rimStart.x - s.joint.x;
      const dxEnd2 = s.rimEnd.x - s.joint.x;
      expect(Math.abs(dxStart2)).not.toBeCloseTo(Math.abs(dxEnd2), 1);
      // Straight lines joint → rim: both hangers share the joint.
      expect(s.joint.y).toBeGreaterThan(0);
      expect(Math.abs(s.panDrop)).toBeGreaterThan(0);
    }
  });

  it('the heavy side dips: the LOWER pan always matches the verdict (θ sign vs panDrop sign)', () => {
    // LTR: the against pan is the right column. Physical +θ (against
    // heavy) → the right/against joint drops → the against pan drops.
    const g = balanceStageGeometry(640, 4.8, false);
    expect(g.against.panDrop).toBeGreaterThan(0);
    expect(g.for.panDrop).toBeLessThan(0);
    const gNeg = balanceStageGeometry(640, -4.8, false);
    expect(gNeg.for.panDrop).toBeGreaterThan(0);
    expect(gNeg.against.panDrop).toBeLessThan(0);
  });

  it('RTL: ONLY the visual sign flips — the against pan still drops when against is heavy, the for joint is the right end', () => {
    const g = balanceStageGeometry(640, 8, true);
    expect(g.beamAngleDeg).toBe(-8);
    expect(g.beamTransform).toBe(`rotate(-8 320 ${BALANCE_PIVOT_Y_PX})`);
    // In RTL the for pan is the RIGHT column: its joint is the right end.
    expect(g.for.joint.x).toBeGreaterThan(g.cx);
    expect(g.against.joint.x).toBeLessThan(g.cx);
    // Against-heavy: the against (left) joint drops → the pan drops.
    expect(g.against.panDrop).toBeGreaterThan(0);
    expect(g.for.panDrop).toBeLessThan(0);
    // The physical drop magnitude is direction-free: |drop| matches LTR.
    const ltr = balanceStageGeometry(640, 8, false);
    expect(g.against.panDrop).toBeCloseTo(ltr.against.panDrop, 10);
    expect(g.for.panDrop).toBeCloseTo(ltr.for.panDrop, 10);
  });

  it('the vertical travel stays inside the reserved envelope computed from the maximum θ', () => {
    expect(BALANCE_SWING_PX).toBeCloseTo((BALANCE_LH_PX / 2) * Math.sin(radOf(8)), 10);
    for (const w of [320, 480, 640]) {
      for (const theta of [-8, -2, 0, 2, 8]) {
        const g = balanceStageGeometry(w, theta, false);
        expect(Math.abs(g.for.panDrop)).toBeLessThanOrEqual((w / 4) * Math.sin(radOf(8)) + 1e-9);
        expect(Math.abs(g.against.panDrop)).toBeLessThanOrEqual((w / 4) * Math.sin(radOf(8)) + 1e-9);
      }
    }
    // The raised pan's top edge never reaches the beam (no collision),
    // at the widest stage and the maximum angle.
    const worst = BALANCE_PAN_TOP_PX - BALANCE_SWING_PX;
    expect(worst).toBeGreaterThan(BALANCE_PIVOT_Y_PX + 6); // beam bottom = 50
    // The fixed stage heights reserve the pan stack + the swing.
    expect(BALANCE_STAGE_H_DESKTOP).toBeGreaterThanOrEqual(BALANCE_PAN_TOP_PX + BALANCE_PAN_H_DESKTOP + 30 + BALANCE_SWING_PX);
    expect(BALANCE_STAGE_H_MOBILE).toBeGreaterThanOrEqual(BALANCE_PAN_TOP_PX + BALANCE_PAN_H_MOBILE + 30 + BALANCE_SWING_PX);
  });

  it('the geometry scales with the measured stage width as one piece (the arm tracks the columns)', () => {
    const g = balanceStageGeometry(360, 4.8, false);
    expect(g.cx).toBe(180);
    expect(g.halfArm).toBe(90);
    expect(g.for.joint.x).toBeCloseTo(180 - 90 * Math.cos(radOf(4.8)), 10);
    expect(g.against.rimStart.x).toBe(270 - BALANCE_HANG_SPREAD_PX);
  });
});

/* ------------------------------------------------------------------ *
 * §B — the needle + arc gauge (three ticks, verdict-labelled)
 * ------------------------------------------------------------------ */

describe('§B gauge (needle + the three-tick arc)', () => {
  it('three ticks only: adverse end, centre, supportive end — no numeric labels', () => {
    const g = balanceGaugeGeometry(320, 44, false);
    expect(g.ticks.map((t) => t.kind)).toEqual(['adverse', 'center', 'supportive']);
    // All ticks sit behind the needle's sweep on the fixed arc.
    for (const t of g.ticks) {
      const rFrom = Math.hypot(t.from.x - 320, t.from.y - 44);
      const rTo = Math.hypot(t.to.x - 320, t.to.y - 44);
      expect(rFrom).toBeCloseTo(BALANCE_ARC_R_PX, 1);
      expect(rTo).toBeCloseTo(BALANCE_ARC_TICK_OUT_PX, 1);
    }
    // The arc itself is a small fixed span at straight-down ± max.
    expect(g.arcPath).toContain(`A ${BALANCE_ARC_R_PX} ${BALANCE_ARC_R_PX} 0 0 1`);
  });

  it('the end ticks are labelled by VERDICT: the adverse tick is where the needle lands when the against pan is heavy', () => {
    const ltr = balanceGaugeGeometry(320, 44, false);
    // LTR: the against pan is the right column; a rigid down-needle
    // swings LEFT when the right end drops → the LEFT tick is adverse.
    expect(ltr.ticks[0]!.from.x).toBeLessThan(320);
    expect(ltr.ticks[2]!.from.x).toBeGreaterThan(320);
    // The centre tick is straight below the pivot.
    expect(ltr.ticks[1]!.from.x).toBe(320);
    expect(ltr.ticks[1]!.from.y).toBeCloseTo(44 + BALANCE_ARC_R_PX, 1);
    // RTL mirrors the labelling (the against pan is the left column).
    const rtl = balanceGaugeGeometry(320, 44, true);
    expect(rtl.ticks[0]!.from.x).toBeGreaterThan(320);
    expect(rtl.ticks[2]!.from.x).toBeLessThan(320);
  });

  it('the needle sweep reaches the end ticks exactly at ±max (the tip just meets the arc)', () => {
    // The needle is rigid with the beam: its tip is the rotated point
    // (cx, cy + len); at θ = ±max it lands on the arc's radius.
    const needleTip = (theta: number): { x: number; y: number } => ({
      x: 320 - BALANCE_NEEDLE_LEN_PX * Math.sin(radOf(theta)),
      y: 44 + BALANCE_NEEDLE_LEN_PX * Math.cos(radOf(theta)),
    });
    for (const theta of [-8, 8]) {
      const tip = needleTip(theta);
      // The tip sits just inside the end tick's radial line (26 vs 27).
      expect(Math.hypot(tip.x - 320, tip.y - 44)).toBeCloseTo(BALANCE_NEEDLE_LEN_PX, 6);
      expect(tip.y).toBeGreaterThan(44 + BALANCE_NEEDLE_LEN_PX * 0.98);
    }
  });
});

/* ------------------------------------------------------------------ *
 * §5.1/§13 — the verdict word and the count line
 * ------------------------------------------------------------------ */

describe('§5.1/§13 verdict word and count line', () => {
  it('maps the cases to the verdict words', () => {
    expect(balanceVerdictOf(countsOf(CASE_A))).toBe('against');
    expect(balanceVerdictOf(countsOf(CASE_B))).toBe('balanced');
    expect(balanceVerdictOf(countsOf(CASE_C))).toBe('for');
    expect(balanceVerdictOf(countsOf(CASE_D))).toBe('none');
  });

  it('joins the non-zero parts with " · " and omits zeros', () => {
    expect(countLineParts(countsOf(CASE_A), copy, 'en-US')).toEqual(['1 against', '3 couldn\'t be read']);
    expect(countLineParts(countsOf(CASE_B), copy, 'en-US')).toEqual(['2 for', '2 against']);
    expect(countLineParts(countsOf(CASE_C), copy, 'en-US')).toEqual(['3 for', '1 neutral']);
  });

  it('renders Persian digits in fa', () => {
    expect(countLineParts(countsOf(CASE_A), copyFa, 'fa-IR')).toEqual(['۱ به ضرر', '۳ قابل ارزیابی نیست']);
  });
});

/* ------------------------------------------------------------------ *
 * BalanceScale (rendered v7 balance)
 * ------------------------------------------------------------------ */

describe('BalanceScale (rendered v7 balance)', () => {
  it('case A: heading + subtitle + captions + stage + pans with tiles + assessment + lists + panel + trays', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    // 1. The heading + subtitle.
    expect(screen.getByText('The aggregate of factors affecting the price of gold')).toBeTruthy();
    expect(
      screen.getByText(
        'Each factor is read against its usual range and weighed equally; the beam shows the combined lean of today’s readings.',
      ),
    ).toBeTruthy();
    // 2. The side captions over the pan columns, icons + side colours.
    const capFor = document.querySelector('[data-balance-caption="for"]') as HTMLElement;
    const capAgainst = document.querySelector('[data-balance-caption="against"]') as HTMLElement;
    expect(capFor.textContent).toBe('Factors supporting gold’s price');
    expect(capAgainst.textContent).toBe('Factors pressuring gold’s price');
    expect(capFor.className).toContain('text-[var(--color-status-normal)]');
    expect(capAgainst.className).toContain('text-[var(--color-status-alert)]');
    // 3. The stage: a labelled group carrying the result (§12.1).
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stage.getAttribute('role')).toBe('group');
    expect(stage.getAttribute('aria-label')).toBe('Balance for gold: 1 against · 3 neutral. Leaning against gold.');
    // The drawing's parts: reference, hangers (SVG lines + ring dots),
    // the gauge (arc + three ticks), the beam group (bar + beads +
    // pivot ring + needle), the pans.
    expect(document.querySelector('[data-balance-reference]')).not.toBeNull();
    for (const side of ['for', 'against'] as const) {
      expect(document.querySelector(`[data-balance-hanger="${side}-start"]`)).not.toBeNull();
      expect(document.querySelector(`[data-balance-hanger="${side}-end"]`)).not.toBeNull();
      expect(document.querySelector(`[data-balance-hanger="${side}-start-ring"]`)).not.toBeNull();
      expect(document.querySelector(`[data-balance-hanger="${side}-end-ring"]`)).not.toBeNull();
    }
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam).not.toBeNull();
    expect(document.querySelector('[data-balance-beam-bar]')).not.toBeNull();
    expect(document.querySelector('[data-balance-pivot]')).not.toBeNull();
    // v7: the v4 keystone is superseded by the pivot ring + needle + arc.
    expect(document.querySelector('[data-balance-fulcrum]')).toBeNull();
    expect(document.querySelector('[data-balance-bead="for"]')?.getAttribute('class')).toContain('fill-[var(--color-status-normal)]');
    expect(document.querySelector('[data-balance-bead="against"]')?.getAttribute('class')).toContain('fill-[var(--color-status-alert)]');
    // The pivot ring and the needle live INSIDE the rotating group.
    expect(beam.contains(document.querySelector('[data-balance-pivot]'))).toBe(true);
    expect(beam.contains(document.querySelector('[data-balance-needle]'))).toBe(true);
    // The needle renders for a directional verdict.
    expect(document.querySelector('[data-balance-needle]')).not.toBeNull();
    // The arc: exactly three ticks.
    expect(document.querySelectorAll('[data-balance-tick]').length).toBe(3);
    // 4. The pans: the against pan carries the ONE tile (a real
    // button resting on the pan's floor); the for pan keeps its
    // COMPLETE structure with the muted empty marker.
    const panFor = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const panAgainst = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    const tile = document.querySelector('[data-balance-tile="real-yield"]') as HTMLButtonElement;
    expect(panAgainst.contains(tile)).toBe(true);
    expect(tile.getAttribute('aria-controls')).toBe('gold-balance-detail');
    expect(tile.textContent).toContain('Real yields');
    expect(tile.textContent).toContain('2.84%');
    expect(panFor.querySelector('[data-balance-empty="for"]')?.textContent).toBe('No qualifying signals');
    // The pans are fixed-height trays with a heavier floor edge.
    for (const pan of [panFor, panAgainst]) {
      expect(pan.className).toContain('h-[118px]');
      expect(pan.className).toContain('sm:h-[88px]');
      expect(pan.className).toContain('border-b-[3px]');
    }
    // No overflow on either side → no "+n more" pills.
    expect(document.querySelector('[data-balance-more]')).toBeNull();
    // 5. The assessment box: verdict word + count line.
    expect(screen.getByText('Leaning against gold')).toBeTruthy();
    expect(screen.getByText('1 against · 3 neutral')).toBeTruthy();
    // 6. The lists: the for side's evidence-based line is visible
    // WITHOUT any disclosure; the against side's full list is hidden
    // until disclosed (its single factor already rests on the pan).
    const listFor = document.getElementById('gold-balance-list-for') as HTMLElement;
    const listAgainst = document.getElementById('gold-balance-list-against') as HTMLElement;
    expect(listFor.hidden).toBe(false);
    expect(listFor.textContent).toContain(
      'None of the factors checked shows a meaningful signal supporting gold’s price right now.',
    );
    expect(listAgainst.hidden).toBe(true);
    // 7. The panel exists, hidden, with every aria-controls valid.
    const panel = document.getElementById('gold-balance-detail') as HTMLElement;
    expect(panel.hidden).toBe(true);
    // 8. The trays on the DENSE twin: 3 NEUTRAL chips, no unread tray.
    const neutralTray = document.querySelector('[data-balance-tray="neutral"]') as HTMLElement;
    expect(neutralTray.querySelectorAll('button').length).toBe(3);
    expect(document.querySelector('[data-balance-tray="unread"]')).toBeNull();
  });

  it('addendum §A: ONLY the beam group rotates — every transformed element listed, pans/tiles/text carry nothing beyond translate', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    // Walk EVERY descendant: a "transformed" element carries a
    // transform attribute or a style transform.
    const transformed: Element[] = [];
    stage.querySelectorAll('*').forEach((el) => {
      const attr = el.getAttribute('transform');
      const style = (el as HTMLElement | SVGElement).style?.transform ?? '';
      if (attr !== null || style !== '') transformed.push(el);
    });
    // Exactly three: the beam group (rotate) + the two pan
    // assemblies (translate). Tiles, hangers, rings, beads, needle,
    // arc, text — none.
    expect(transformed.length).toBe(3);
    const beam = transformed.find((el) => el.getAttribute('transform') !== null);
    expect(beam?.getAttribute('data-balance-beam')).toBeDefined();
    const assemblies = transformed.filter((el) => el.getAttribute('transform') === null);
    expect(assemblies.length).toBe(2);
    for (const asm of assemblies) {
      const t = (asm as HTMLElement).style.transform;
      // Translate ONLY — never rotate, skew or scale.
      expect(t).toMatch(/^translate\(0px, -?\d+(\.\d+)?px\)$/);
    }
    // The tiles carry no transform at all.
    document.querySelectorAll('[data-balance-tile]').forEach((t) => {
      expect((t as HTMLElement).style.transform).toBe('');
    });
    // The source never mirrors text and never transitions a transform.
    expect(balanceSrc).not.toMatch(/scaleX\(-1\)/);
    expect(balanceSrc).not.toMatch(/transition-transform/);
  });

  it('case A: the beam rotates by the floored angle and the pans translate by exactly their joints\' drops — one frame, one law', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    const asmFor = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    const asmAgainst = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    // The visual angle (LTR: against-heavy = clockwise = positive) —
    // rotate(θ, pivotX, pivotY), the ONLY rotation in the drawing.
    expect(beam.getAttribute('transform')).toBe(`rotate(2 320 ${BALANCE_PIVOT_Y_PX})`);
    // The pans drop exactly as far as their joints: 160 × sin 2°.
    const expected = r2(160 * Math.sin(radOf(2)));
    expect(asmAgainst.style.transform).toBe(`translate(0px, ${expected}px)`);
    expect(asmFor.style.transform).toBe(`translate(0px, ${-expected}px)`);
  });

  it('the hangers are drawn joint → rim exactly (the SVG lines match the pure geometry)', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const expected = balanceStageGeometry(640, 2, false);
    for (const side of ['for', 'against'] as const) {
      const s = expected[side];
      const start = document.querySelector(`[data-balance-hanger="${side}-start"]`) as SVGLineElement;
      const end = document.querySelector(`[data-balance-hanger="${side}-end"]`) as SVGLineElement;
      expect(start.getAttribute('x1')).toBe(String(r2(s.joint.x)));
      expect(start.getAttribute('y1')).toBe(String(r2(s.joint.y)));
      expect(start.getAttribute('x2')).toBe(String(r2(s.rimStart.x)));
      expect(start.getAttribute('y2')).toBe(String(r2(s.rimStart.y)));
      expect(end.getAttribute('x1')).toBe(String(r2(s.joint.x)));
      expect(end.getAttribute('y1')).toBe(String(r2(s.joint.y)));
      expect(end.getAttribute('x2')).toBe(String(r2(s.rimEnd.x)));
      expect(end.getAttribute('y2')).toBe(String(r2(s.rimEnd.y)));
    }
  });

  it('a changed verdict lands on the new angle (the one animated value drives the whole frame)', () => {
    const { rerender } = render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const beam = () => document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam().getAttribute('transform')).toBe(`rotate(2 320 ${BALANCE_PIVOT_Y_PX})`);
    // Case E: 4 against → the model's full range, 8°.
    rerender(<BalanceScale metal="gold" drivers={CASE_E} copy={copy} numberLocale="en-US" />);
    expect(beam().getAttribute('transform')).toBe(`rotate(8 320 ${BALANCE_PIVOT_Y_PX})`);
    const drop = r2(160 * Math.sin(radOf(8)));
    expect((document.querySelector('[data-balance-assembly="against"]') as HTMLElement).style.transform).toBe(
      `translate(0px, ${drop}px)`,
    );
    expect((document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.transform).toBe(
      `translate(0px, ${-drop}px)`,
    );
    // The hangers track the new joints (they can never detach: one
    // state → one render → every coordinate).
    const e = balanceStageGeometry(640, 8, false);
    const line = document.querySelector('[data-balance-hanger="against-start"]') as SVGLineElement;
    expect(line.getAttribute('x1')).toBe(String(r2(e.against.joint.x)));
    expect(line.getAttribute('y1')).toBe(String(r2(e.against.joint.y)));
  });

  it('case C (for heavy): the physical sign is negative; fa flips ONLY the visual rotation', () => {
    const { rerender } = render(<BalanceScale metal="gold" drivers={CASE_C} copy={copy} numberLocale="en-US" />);
    const beamOf = (): SVGElement => document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beamOf().getAttribute('transform')).toBe(`rotate(-6 320 ${BALANCE_PIVOT_Y_PX})`);
    const dropEn = (document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.transform;
    expect(dropEn).toBe(`translate(0px, ${r2(160 * Math.sin(radOf(6)))}px)`);
    rerender(<BalanceScale metal="gold" drivers={CASE_C} copy={copyFa} numberLocale="fa-IR" />);
    // The PHYSICAL drop sign never flips (the for pan drops in fa
    // too); only the beam's VISUAL rotation flips so the heavy end
    // dips — in RTL the for pan is the RIGHT column.
    expect(beamOf().getAttribute('transform')).toBe(`rotate(6 320 ${BALANCE_PIVOT_Y_PX})`);
    const dropFa = (document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.transform;
    expect(dropFa).toBe(dropEn);
  });

  it('cases B, D and G render level — no direction, no drop, no needle for the unavailable state', () => {
    for (const drivers of [CASE_B, CASE_G, CASE_D]) {
      const { unmount } = render(<BalanceScale metal="gold" drivers={drivers} copy={copy} numberLocale="en-US" />);
      const beam = document.querySelector('[data-balance-beam]') as SVGElement;
      expect(beam.getAttribute('transform')).toBe(`rotate(0 320 ${BALANCE_PIVOT_Y_PX})`);
      for (const side of ['for', 'against'] as const) {
        expect((document.querySelector(`[data-balance-assembly="${side}"]`) as HTMLElement).style.transform).toBe(
          'translate(0px, 0px)',
        );
      }
      // The needle hides for the unavailable verdict (case D) AND for
      // the SPARSE case G (readable 2 < 3 — v3 UI-40: no direction from
      // too-sparse data, the gauge refuses to point); B (balanced, 4
      // readable) keeps its needle at the centre tick.
      const needle = document.querySelector('[data-balance-needle]');
      if (drivers === CASE_D || drivers === CASE_G) {
        expect(needle).toBeNull();
        const svg = document.querySelector('[data-balance-mech]') as SVGElement;
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        expect(svg.getAttribute('role')).toBeNull();
      } else {
        expect(needle).not.toBeNull();
      }
      unmount();
    }
  });

  it('the gauge carries its text equivalent (never colour alone): tilt degrees + the verdict word', () => {
    const { unmount: unmountEn } = render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const svg = document.querySelector('[data-balance-mech]') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Beam tilt: 2°, Leaning against gold.');
    unmountEn();
    const { unmount } = render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copyFa} numberLocale="fa-IR" />);
    const svgFa = document.querySelector('[data-balance-mech]') as SVGElement;
    expect(svgFa.getAttribute('aria-label')).toBe('شیب تیر: ۲ درجه، تمایل به ضرر طلا.');
    unmount();
  });

  it('case B: both pans carry two tiles and the balance is level', () => {
    render(<BalanceScale metal="gold" drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    expect(document.querySelectorAll('[data-balance-pan="for"] [data-balance-tile]').length).toBe(2);
    expect(document.querySelectorAll('[data-balance-pan="against"] [data-balance-tile]').length).toBe(2);
    expect(screen.getByText('Balanced')).toBeTruthy();
  });

  it('case D: the none verdict, the DISTINCT "nothing to weigh yet" markers in BOTH pans, the unavailable lines on both sides, level', () => {
    render(<BalanceScale metal="gold" drivers={CASE_D} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText("Can't read the conditions right now")).toBeTruthy();
    for (const side of ['for', 'against'] as const) {
      expect(document.querySelector(`[data-balance-empty="${side}"]`)?.textContent).toBe('Nothing to weigh yet');
      const list = document.getElementById(`gold-balance-list-${side}`) as HTMLElement;
      expect(list.hidden).toBe(false);
      expect(list.textContent).toContain('Nothing could be read yet, so neither side has been weighed.');
    }
    // Everything sits in the unread tray, off the pans.
    expect(document.querySelector('[data-balance-tray="unread"]')!.querySelectorAll('button').length).toBe(4);
  });

  it('case H (6 for / 3 against): the pans keep their capacity, the pills count the overflow, the full lists disclose, and the stage geometry never changes', () => {
    render(<BalanceScale metal="gold" drivers={CASE_H} copy={copy} numberLocale="en-US" />);
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    const stageClass = stage.className;
    const panFor = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const panAgainst = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    // Capacity: exactly 2 tiles per pan, no more.
    expect(panFor.querySelectorAll('[data-balance-tile]').length).toBe(BALANCE_PAN_CAPACITY);
    expect(panAgainst.querySelectorAll('[data-balance-tile]').length).toBe(BALANCE_PAN_CAPACITY);
    // The overflow pills hang UNDER their pans (inside the translating
    // assemblies — clearly attached, never ON the pan surface).
    const moreFor = document.querySelector('[data-balance-more="for"]') as HTMLButtonElement;
    const moreAgainst = document.querySelector('[data-balance-more="against"]') as HTMLButtonElement;
    expect(moreFor.textContent).toBe('+4 more');
    expect(moreAgainst.textContent).toBe('+1 more');
    expect(panFor.contains(moreFor)).toBe(false);
    expect(document.querySelector('[data-balance-assembly="for"]')!.contains(moreFor)).toBe(true);
    expect(moreFor.getAttribute('aria-controls')).toBe('gold-balance-list-for');
    expect(moreFor.getAttribute('aria-expanded')).toBe('false');
    // The full lists stay accessible: hidden until the pill expands them.
    const listFor = document.getElementById('gold-balance-list-for') as HTMLElement;
    expect(listFor.hidden).toBe(true);
    fireEvent.click(moreFor);
    expect(listFor.hidden).toBe(false);
    expect(listFor.querySelectorAll('[data-balance-block]').length).toBe(6);
    // TWO "Show fewer" controls stay reachable: the pan's own pill
    // (now flipped) and the section's collapse button under the rows.
    expect(screen.getAllByText('Show fewer').length).toBe(2);
    // The stage's geometry never depended on the count: the same class
    // (fixed heights, same anchors) as the 4-driver case A render, and
    // the drops still ride the same plumb law (net +3/9 → 8/3°).
    const dropH = r2(160 * Math.sin(radOf(8 / 3)));
    expect((document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.transform).toBe(
      `translate(0px, ${dropH}px)`,
    );
    const { unmount } = render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const stageA = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stageA.className).toBe(stageClass);
    unmount();
    // "Show fewer" collapses the list again.
    const fewer = document.querySelector('[data-balance-fewer="for"]') as HTMLButtonElement;
    fireEvent.click(fewer);
    const listForAgain = document.getElementById('gold-balance-list-for') as HTMLElement;
    expect(listForAgain.hidden).toBe(true);
  });

  it('a tile tap opens its explanation in the panel; a second tap closes it (every width)', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    const tile = document.querySelector('[data-balance-tile="real-yield"]') as HTMLButtonElement;
    const panel = document.getElementById('gold-balance-detail') as HTMLElement;
    expect(panel.hidden).toBe(true);
    fireEvent.click(tile);
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toContain('Real yields: real-yield explanation sentence');
    expect(tile.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(tile);
    expect(panel.hidden).toBe(true);
  });

  it('one panel at a time: opening a tray chip closes the tile\'s panel', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    fireEvent.click(document.querySelector('[data-balance-tile="real-yield"]')!);
    expect(document.querySelector('[data-balance-detail]')!.getAttribute('data-balance-detail')).toBe('real-yield');
    fireEvent.click(document.querySelector('[data-balance-chip="stress"]')!);
    expect(document.querySelector('[data-balance-detail]')!.getAttribute('data-balance-detail')).toBe('stress');
  });

  it('the structure order: heading → subtitle → captions → stage → assessment → lists → panel → trays', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const chain: Array<Node | null> = [
      document.querySelector('[data-balance-title]'),
      document.querySelector('[data-balance-subtitle]'),
      document.querySelector('[data-balance-captions]'),
      document.querySelector('[data-balance-stage]'),
      document.querySelector('[data-balance-verdict]'),
      document.querySelector('[data-balance-lists]'),
      document.querySelector('#gold-balance-detail'),
      document.querySelector('[data-balance-tray="unread"]'),
    ];
    for (let i = 0; i + 1 < chain.length; i += 1) {
      expect(precedes(chain[i], chain[i + 1])).toBe(true);
    }
  });

  it('renders Persian digits and captions in fa; the pans carry the Persian empty marker; NOTHING mirrors text', () => {
    const { unmount: unmountFa } = render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copyFa} numberLocale="fa-IR" />);
    expect(screen.getByText('برآیند عوامل مؤثر بر قیمت طلا')).toBeTruthy();
    expect(screen.getByText('۱ به ضرر · ۳ خنثی')).toBeTruthy();
    // The side label rides TWICE by design: once as the caption over the
    // pan, once as the (empty) side's list-section header below.
    expect(screen.getAllByText('عوامل حمایتی از قیمت طلا').length).toBe(2);
    expect(screen.getAllByText('عوامل فشارآور بر قیمت طلا').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('نشانهٔ معتبری نیست')).toBeTruthy();
    expect(
      screen.getByText('در حال حاضر، نشانهٔ معناداری از حمایت عوامل بررسی‌شده از رشد قیمت طلا دیده نمی‌شود.'),
    ).toBeTruthy();
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stage.getAttribute('aria-label')).toBe('ترازوی طلا: ۱ به ضرر · ۳ خنثی. تمایل به ضرر طلا.');
    // The source NEVER mirrors text — no scaleX(-1) anywhere.
    expect(balanceSrc).not.toMatch(/scaleX\(-1\)/);
    unmountFa();
    const { unmount } = render(<BalanceScale metal="gold" drivers={CASE_A_DENSE} copy={copy} numberLocale="en-US" />);
    expect((document.querySelector('[data-balance-beam]') as SVGElement).getAttribute('transform')).toBe(
      `rotate(2 320 ${BALANCE_PIVOT_Y_PX})`,
    );
    unmount();
  });

  it('chips are at least 44px tall by class and dashed for unread; the empty-side full line rides the list area', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    expect(chip.className).toContain('min-h-[44px]');
    expect(chip.className).toContain('border-dashed');
  });

  it('the banner sentence rides inside the assessment box where provided', () => {
    render(<BalanceScale metal="gold" drivers={CASE_A} copy={copy} numberLocale="en-US" banner={<p>the c12 note</p>} />);
    const verdict = document.querySelector('[data-balance-verdict]') as HTMLElement;
    expect(verdict.textContent).toContain('the c12 note');
  });
});

/* ------------------------------------------------------------------ *
 * §9 — the merged card integration (the v3 per-metal balances between
 * the outlook strip and the divider-separated footing strip; retired
 * headings gone; UI-40 sparse honesty on the level beams)
 * ------------------------------------------------------------------ */

function reading(partial: Partial<IndicatorReading> & { id: IndicatorReading['id'] }): IndicatorReading {
  return {
    value: 1,
    asOf: '2026-10-17',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-10-17T04:20:00.000Z',
    ...partial,
  } as IndicatorReading;
}

function signalOf(
  metal: 'gold' | 'silver',
  shared: Array<{ key: SignalConditionKey; state: SignalConditionState }>,
): SignalReading {
  const priceId: IndicatorId = metal === 'gold' ? 'gold-usd' : 'silver-usd';
  return {
    metal,
    priceId,
    conditions: [
      ...shared.map((c) => ({
        ...c,
        inputs: (c.key === 'stress'
          ? ['stress-stlfsi', 'nfci']
          : c.key === 'footing'
            ? [priceId]
            : c.key === 'industrial'
              ? ['china-pmi', 'copper-gold']
              : [c.key === 'real-yield' ? 'real-yield-10y' : c.key === 'expectations' ? 'breakeven-5y5y' : 'dollar-basket']) as IndicatorId[],
      })),
    ],
    metCount: shared.filter((c) => c.state === 'supportive').length,
    lean: 'mixed' as const,
    position: { band: 'high' as const, percentile: 0.93 },
    speed: 1.2,
  } as SignalReading;
}

const SHARED_A: Array<{ key: SignalConditionKey; state: SignalConditionState }> = [
  { key: 'real-yield', state: 'against' },
  { key: 'expectations', state: 'unknown' },
  { key: 'stress', state: 'unknown' },
  { key: 'dollar', state: 'unknown' },
  { key: 'footing', state: 'supportive' },
];

describe('MergedSignalsCard integration', () => {
  it('renders the balance between the outlook strip and the price footing strip; the group headings are gone', async () => {
    // A stray fetch must fail loudly (AGENTS.md rule 7) — the balance and
    // the merged card make NO network request of their own.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    const { MergedSignalsCard } = await import('./MergedCard');
    const gold = signalOf('gold', SHARED_A);
    const silver = signalOf('silver', [
      ...SHARED_A,
      { key: 'industrial', state: 'unknown' },
    ]);
    const readings: IndicatorReading[] = [
      reading({ id: 'gold-usd', value: 4180, percentile10y: 0.93, change30d: 1.2 }),
      reading({ id: 'silver-usd', value: 53.2, percentile10y: 0.88, change30d: -0.4 }),
      reading({ id: 'real-yield-10y', value: 2.84 }),
      reading({ id: 'breakeven-5y5y', status: 'stale', value: null }),
      reading({ id: 'stress-stlfsi', status: 'stale', value: null }),
      reading({ id: 'nfci', status: 'stale', value: null }),
      reading({ id: 'dollar-basket', status: 'stale', value: null }),
      reading({ id: 'china-pmi', status: 'stale', value: null }),
      reading({ id: 'copper-gold', status: 'stale', value: null }),
    ];
    render(
      <MergedSignalsCard gold={gold} silver={silver} readings={readings} copy={copy} numberLocale="en-US" />,
    );
    // The balance replaced the groups. v3 UI-45 (2026-10-19 merge): TWO
    // balances render, one per metal; the readable count on this fixture
    // is 1 (< 3) so BOTH beams stay level with the honest not-enough line
    // (UI-40) — never a directional word from sparse data.
    expect(document.querySelector('[data-balance="gold"]')).not.toBeNull();
    expect(document.querySelector('[data-balance="silver"]')).not.toBeNull();
    expect(document.querySelector('[data-balance="gold"] [data-balance-stage]')).not.toBeNull();
    // Both metals' fixtures are sparse (readable 1) — the honest line
    // renders once per balance, never a direction from sparse data (UI-40).
    expect(screen.getAllByText('Not enough readable conditions to weigh').length).toBe(2);
    expect(
      document.querySelector('[data-balance="gold"] [data-balance-beam]')?.getAttribute('data-tilt'),
    ).toBe('0');
    expect(
      document.querySelector('[data-balance="silver"] [data-balance-beam]')?.getAttribute('data-tilt'),
    ).toBe('0');
    expect(screen.getByText('The aggregate of factors affecting the price of gold')).toBeTruthy();
    expect(screen.getByText('The aggregate of factors affecting the price of silver')).toBeTruthy();
    // The retired group headings never render again.
    expect(screen.queryByText('Works against')).toBeNull();
    expect(screen.queryByText('Sitting neutral')).toBeNull();
    // v6: the against PAN carries the one readable tile; the for side
    // keeps its pan with the evidence-based line below (no dashed slot).
    expect(document.querySelector('[data-balance-tile="real-yield"]')).not.toBeNull();
    // UI-45: BOTH balances' for sides are empty on this fixture — the
    // evidence-based line renders once per balance.
    expect(
      screen.getAllByText('None of the factors checked shows a meaningful signal supporting gold’s price right now.')
        .length,
    ).toBe(2);
    expect(document.querySelector('[data-balance-empty="for"]')?.textContent).toBe('No qualifying signals');
    expect(document.querySelector('[data-balance-slot]')).toBeNull();
    // The unread drivers sit in the tray, off the pans.
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(3);
    // The merged card shares the conditions once; UI-45: the silver-only
    // industrial condition rides SILVER's balance alone (the separate
    // short list is retired) — it renders in silver's unread tray here
    // and NEVER inside gold's balance.
    expect(mergeSignals(gold, silver).shared.length).toBe(4);
    const goldBox = document.querySelector('[data-balance="gold"]') as HTMLElement;
    const silverBox = document.querySelector('[data-balance="silver"]') as HTMLElement;
    expect(silverBox.querySelector('[data-balance-chip="industrial"]')).not.toBeNull();
    expect(goldBox.querySelector('[data-balance-chip="industrial"]')).toBeNull();
    expect(silverBox.querySelector('[data-balance-tray="unread"]')?.querySelectorAll('button').length).toBe(4);
    // The price footing strip: divider-separated, below the trays (§9).
    const footing = screen.getByText('Price footing') as HTMLElement;
    const footingBox = footing.parentElement as HTMLElement;
    expect(footingBox.className).toContain('border-t');
    expect(footingBox.compareDocumentPosition(unreadTray) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("UI-45: a DENSE silver balance speaks silver's own copy and weighs when readable ≥ 3", async () => {
    const { BalanceScale } = await import('./BalanceScale');
    const silverDense: BalanceDriver[] = [
      d('real-yield', 'for'),
      d('expectations', 'for'),
      d('stress', 'for'),
      d('dollar', 'against'),
      d('industrial', 'unread'),
    ];
    render(<BalanceScale metal="silver" drivers={silverDense} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('The aggregate of factors affecting the price of silver')).toBeTruthy();
    expect(screen.getByText('Leaning for silver')).toBeTruthy();
    expect(document.querySelector('[data-balance-readable-line]')?.textContent).toContain('4 of 5 conditions readable');
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('-3.2');
    // silver's aria speaks silver, never gold
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stage.getAttribute('aria-label')).toMatch(/^Balance for silver: /);
  });
});
