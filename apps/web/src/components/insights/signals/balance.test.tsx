/**
 * @vitest-environment jsdom
 *
 * balance.test.tsx — the gold card's balance: the PURE LAW tests (the
 * owner spec docs/insights/gold-balance-card-spec.md + the v7
 * Iteration-5 addendum, kept verbatim through the redesign).
 *
 * GB-S6 (P5, 2026-11-04 — the owner's recorded "go"): the visual
 * redesign (05-VISUAL-DESIGN-SPEC.md) is THE balance for every visitor.
 * The legacy branch — the v8 pan tiles, the shared detail panel, the
 * trays, the legacy stage geometry (balanceStageGeometry), the gauge
 * (balanceGaugeGeometry) and the legacy pan-sizing helpers — RETIRED
 * with the flip, and its rendered-legacy test describes went with it
 * (the visual's own law pins live in gold-balance-lanes.test.tsx +
 * the gb-s4 Playwright suite). What survives here is the pure law the
 * redesign still shares:
 *
 *   §4  driver-state mapping (supportive/against/neutral/unknown →
 *       for/against/neutral/unread 1:1) and total/net/readable counts
 *   §6  the tilt rule (the 2026-10-21c owner presentation scale: the
 *       |net|/(for+against) × 10° law clamped to [3°, 10°]; level at
 *       net 0 / sparse / nothing readable) + the physical sign
 *   §5.1/§13  the verdict word, the " · "-joined count line and the
 *       verdict word + counts-line parts the summary prose composes
 *       from (GB-S6: the collapsed line + the card header joined the
 *       lane model — one rule, balanceVerdictWordOf +
 *       balanceVerdictCountsParts, pinned here)
 */

import { describe, expect, it } from 'vitest';
import {
  BalanceScale,
  BALANCE_LH_PX,
  BALANCE_MAX_ANGLE_DEG,
  BALANCE_MIN_ANGLE_DEG,
  balanceCounts,
  balanceTilt,
  balanceVerdictCountsParts,
  balanceVerdictOf,
  balanceVerdictWordOf,
  countLineParts,
  driverStateOf,
  signedTiltDeg,
  type BalanceDriver,
} from './BalanceScale';
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
const CASE_G: BalanceDriver[] = [
  d('real-yield', 'for', 'Real yields', '2.84%'),
  d('expectations', 'against', 'Inflation expectations'),
  d('stress', 'unread'),
  d('dollar', 'unread'),
];
const CASE_H: BalanceDriver[] = [
  d('r1', 'for', 'Supportive one'),
  d('r2', 'for', 'Supportive two'),
  d('r3', 'for', 'Supportive three'),
  d('r4', 'for', 'Supportive four'),
  d('r5', 'for', 'Supportive five'),
  d('r6', 'for', 'Supportive six'),
  d('a1', 'against', 'Adverse one'),
  d('a2', 'against', 'Adverse two'),
  d('a3', 'against', 'Adverse three'),
];
const CASE_ONE_VS_FOUR: BalanceDriver[] = [
  d('a1', 'against', 'Adverse one', '1.0'),
  d('s1', 'for', 'Supportive one'),
  d('s2', 'for', 'Supportive two'),
  d('s3', 'for', 'Supportive three'),
  d('s4', 'for', 'Supportive four'),
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
const radOf = (deg: number): number => (deg * Math.PI) / 180;

/* ------------------------------------------------------------------ *
 * §4 — driver states and counts (the spec's 1:1 map)
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
 * §6 — the tilt rule and the physical sign (the owner presentation scale)
 * ------------------------------------------------------------------ */

describe('§6 beam tilt (the v1 ratio law on the owner scale)', () => {
  it('case A (1 against, 3 unread): a one-sided directional load tips the beam the WHOLE way (10°)', () => {
    const t = balanceTilt(countsOf(CASE_A), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MAX_ANGLE_DEG);
    expect(t.heavy).toBe('against');
    // The bead pair differs by Lh × sin; each pan moves by half that.
    expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(10)) * BALANCE_LH_PX, 10);
    expect(t.risePx).toBeCloseTo(t.endDropPx / 2, 12);
  });

  it('case B (2 for, 2 against): level', () => {
    const t = balanceTilt(countsOf(CASE_B), BALANCE_LH_PX);
    expect(t).toEqual({ angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null });
  });

  it('case C (3 for, 1 neutral): all directional load on one side → the full 10° tilt', () => {
    const t = balanceTilt(countsOf(CASE_C), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(10);
    expect(t.heavy).toBe('for');
    expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(10)) * BALANCE_LH_PX, 10);
  });

  it('case D (4 unread): readable 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_D), BALANCE_LH_PX).heavy).toBeNull();
  });

  it('case G (1 for, 1 against, 2 unread): net 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_G), BALANCE_LH_PX).heavy).toBeNull();
  });

  it('case E (4 against): the full directional range — the 10° maximum', () => {
    const t = balanceTilt(countsOf(CASE_E), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MAX_ANGLE_DEG);
    expect(t.endDropPx).toBeCloseTo(Math.sin(radOf(10)) * BALANCE_LH_PX, 10);
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

  it('never dips below the 3° floor when net ≠ 0 (a narrow directional lean stays visible)', () => {
    // 8 for vs 7 against — net 1 over 15 directional: ratio 0.067 → the 3° floor.
    const narrow: BalanceDriver[] = [
      ...CASE_FIVE_VS_FIVE,
      d('f6', 'for', 'Supportive six'),
      d('f7', 'for', 'Supportive seven'),
      d('f8', 'for', 'Supportive eight'),
    ];
    const t = balanceTilt(countsOf(narrow), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MIN_ANGLE_DEG);
    expect(t.angleDeg).toBeLessThanOrEqual(BALANCE_MAX_ANGLE_DEG);
    // And a one-driver lean against a wall of unread conditions still
    // tips the whole way (the owner's case: one item on one pan).
    const oneVsMany: BalanceDriver[] = [...CASE_A, d('x1', 'unread'), d('x2', 'unread'), d('x3', 'unread'), d('x4', 'unread'), d('x5', 'unread'), d('x6', 'unread'), d('x7', 'unread'), d('x8', 'unread'), d('x9', 'unread')];
    expect(balanceTilt(countsOf(oneVsMany), BALANCE_LH_PX).angleDeg).toBe(BALANCE_MAX_ANGLE_DEG);
  });

  it('addendum-C fixtures: one adverse vs four supportive settles by COUNT (the model has no weights)', () => {
    // 1 vs 4 → net +3 over 5 directional → 0.6 × 10° = 6°, the FOR pan lower.
    const t = balanceTilt(countsOf(CASE_ONE_VS_FOUR), BALANCE_LH_PX);
    expect(t.angleDeg).toBeCloseTo(6, 10);
    expect(t.heavy).toBe('for');
    // 5 vs 5 → net 0 → exactly level, no directional verdict.
    expect(balanceTilt(countsOf(CASE_FIVE_VS_FIVE), BALANCE_LH_PX).heavy).toBeNull();
    expect(balanceVerdictOf(countsOf(CASE_FIVE_VS_FIVE))).toBe('balanced');
  });

  it('a zero Lh stays level (a degenerate drawing never fabricates a tilt)', () => {
    expect(balanceTilt(countsOf(CASE_A), 0).heavy).toBeNull();
  });

  it('signedTiltDeg maps the verdict to the physical sign: against heavy = positive, for = negative, level = 0', () => {
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_A), BALANCE_LH_PX))).toBe(10);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_C), BALANCE_LH_PX))).toBe(-10);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_E), BALANCE_LH_PX))).toBe(10);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_B), BALANCE_LH_PX))).toBe(0);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_D), BALANCE_LH_PX))).toBe(0);
  });

  it('the 2026-10-21c presentation scale: max 10°, floor 3° — the constants', () => {
    expect(BALANCE_MAX_ANGLE_DEG).toBe(10);
    expect(BALANCE_MIN_ANGLE_DEG).toBe(3);
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
 * GB-S6 — the verdict word + counts-line parts the summary prose
 * composes from (the collapsed line + the card header joined the lane
 * model at the flip; ONE rule home so the prose can never drift from
 * the card).
 * ------------------------------------------------------------------ */

describe('GB-S6 verdict word + counts parts (the summary prose rule home)', () => {
  it('balanceVerdictWordOf speaks the verdict word the card renders as the hero', () => {
    expect(balanceVerdictWordOf(countsOf(CASE_B), copy)).toBe(copy.signals.balance.verdictBalanced);
    expect(balanceVerdictWordOf(countsOf(CASE_C), copy)).toBe(copy.signals.balance.verdictFor);
    // CASE_E: readable 4 (2 or more on a side) — the directional word.
    expect(balanceVerdictWordOf(countsOf(CASE_E), copy)).toBe(copy.signals.balance.verdictAgainst);
    expect(balanceVerdictWordOf(countsOf(CASE_D), copy)).toBe(copy.signals.balance.verdictNone);
  });

  it('sparse is not a reading: readable 0 keeps the cannot-read word, 1-2 readable shows the not-enough line (UI-40)', () => {
    // CASE_A: readable 1 (1 against + 3 unread) — the explicit line.
    expect(balanceVerdictWordOf(countsOf(CASE_A), copy)).toBe(copy.signals.notEnoughReadable);
    // CASE_D: readable 0 — the component's own stronger word.
    expect(balanceVerdictWordOf(countsOf(CASE_D), copy)).toBe(copy.signals.balance.verdictNone);
    // Persian digits carry into the fa words the same way.
    expect(balanceVerdictWordOf(countsOf(CASE_A), copyFa)).toBe(copyFa.signals.notEnoughReadable);
  });

  it('balanceVerdictCountsParts always renders for/against/not-leaning (zeros included), unread only when > 0', () => {
    expect(balanceVerdictCountsParts(countsOf(CASE_B), copy, 'en-US')).toEqual(['2 for', '2 against', '0 not leaning']);
    expect(balanceVerdictCountsParts(countsOf(CASE_A_DENSE_SHAPE()), copy, 'en-US')).toEqual(['0 for', '0 against', '4 not leaning']);
    expect(balanceVerdictCountsParts(countsOf(CASE_D), copy, 'en-US')).toEqual([
      '0 for',
      '0 against',
      '0 not leaning',
      '4 unread',
    ]);
  });

  it('the counts parts render Persian digits in fa', () => {
    expect(balanceVerdictCountsParts(countsOf(CASE_D), copyFa, 'fa-IR')).toEqual([
      '۰ موافق',
      '۰ مخالف',
      '۰ بدون گرایش',
      '۴ ناخوانده',
    ]);
  });
});

/** The live balance shape at the flip preview: 0 for · 0 against · 4 not
 * leaning (the 2026-10-31 archive fixture's LEVEL reading) — for the
 * counts-parts zero-row pin above. */
function CASE_A_DENSE_SHAPE(): BalanceDriver[] {
  return [d('borrowing-costs', 'neutral'), d('dollar', 'neutral'), d('stress', 'neutral'), d('inflation', 'neutral')];
}

/* ------------------------------------------------------------------ *
 * The component re-export contract: the pure law above is all the
 * surviving surface — the visual redesign's own law pins (the frame,
 * the weights, the ledger, the prose) live in
 * gold-balance-lanes.test.tsx and the gb-s4 Playwright suite.
 * ------------------------------------------------------------------ */

describe('the BalanceScale export surface (post-flip)', () => {
  it('the component is exported and the retired legacy helpers are gone', () => {
    expect(typeof BalanceScale).toBe('function');
    // The legacy stage geometry/gauge/pan-sizing retired with the flip —
    // importing them is a type error; their runtime absence is pinned by
    // the module having no such keys.
    const mod = BalanceScale as unknown as Record<string, unknown>;
    for (const retired of ['balanceStageGeometry', 'balanceGaugeGeometry', 'balancePanHeightPx', 'balanceStageHeightPx']) {
      expect(mod[retired]).toBeUndefined();
    }
  });
});
