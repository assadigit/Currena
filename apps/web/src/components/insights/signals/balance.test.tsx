/**
 * @vitest-environment jsdom
 *
 * balance.test.tsx — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md + the v2 seesaw patch + v3 +
 * v4 + v5 + the v6 PANS directive, 2026-10-26 — Iteration 4: the
 * factor tiles REST ON real weighing pans hung from the beam by thin
 * suspension lines; the pans translate by exactly their beam-end
 * beads' drop and tilt by a restrained fraction of the beam's angle).
 * Covers:
 *
 *   §4  driver-state mapping (supportive/against/neutral/unknown →
 *       for/against/neutral/unread 1:1) and total/net/readable counts
 *   §6  the tilt rule (v1 steps 3–4, kept verbatim through v6): heavier
 *       side down, angle = |net|/total × 12° with the 4° floor, unread
 *       drivers pulling toward level, level at net 0 and readable 0,
 *       and the geometry law: the ONLY height difference is
 *       Lh × sin(angle) — in v6 both the bead pair AND the pan pair
 *       express exactly that difference (25cqw × sin θ, cqw = Lh/2 by
 *       construction), and signedTiltDeg maps the verdict to the
 *       physical sign (against heavy = positive, for = negative)
 *   §5.1/§12.1  the verdict word + " · "-joined count line (zeros
 *       omitted) and the role="group" aria label on the stage
 *   v6 structure  heading → subtitle → the two side CAPTIONS over the
 *       pan columns → THE STAGE (dotted reference, hangers+ring dots,
 *       pans with tiles, beam+beads rotating, hub, keystone) → the
 *       assessment box (verdict + count + banner) → the full factor
 *       lists → the shared panel → the trays
 *   v6 rules 1–5  the stage's geometry is FIXED (height classes never
 *       depend on any count); an empty side keeps its COMPLETE pan
 *       with the distinct panEmpty / panUnreadable markers and its
 *       full evidence-based line below (visible without any
 *       disclosure); when NOTHING could be read BOTH pans carry the
 *       "nothing to weigh yet" marker and BOTH lists the unavailable
 *       line; capacity is 2 tiles per pan, the "+{n} more" pill under
 *       the pan (never ON the pan surface — it must not read as a
 *       load) expands the side's full list; the tiles are real buttons
 *       that open the shared detail panel; RTL flips the VISUAL beam
 *       sign (--s) but the physical pan-drop sign (--t) is
 *       direction-free, and NOTHING mirrors text (no scaleX(-1))
 *   §7/§8/§12  tiles/rows/chips are real buttons with aria-expanded
 *       opening the ONE shared detail panel; trays: neutral quiet
 *       chips vs unread dashed chips, empty trays hidden
 *   §9  (integration) the merged card renders the balance between the
 *       outlook strip and the price footing strip; the retired group
 *       headings are gone
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey, SignalConditionState, SignalReading } from '@currena/insights';
import balanceSrc from './BalanceScale.tsx?raw';
import {
  BalanceScale,
  BALANCE_LH_PX,
  BALANCE_MAX_ANGLE_DEG,
  BALANCE_MIN_ANGLE_DEG,
  BALANCE_PAN_CAPACITY,
  BALANCE_PAN_TILT_FRACTION,
  balanceCounts,
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

const countsOf = (drivers: BalanceDriver[]): ReturnType<typeof balanceCounts> => balanceCounts(drivers);

afterEach(() => {
  cleanup();
});

/** Does `a` precede `b` in the document flow? (structure-order
 * assertions — compareDocumentPosition, unambiguous in jsdom.) */
function precedes(a: Node | null | undefined, b: Node | null | undefined): boolean {
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  return (a!.compareDocumentPosition(b!) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

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
 * §6 — the tilt rule and the physical sign (v6: the pans express the
 * SAME law the beads do — 25cqw × sin θ, 25cqw = Lh ÷ 2 by construction)
 * ------------------------------------------------------------------ */

describe('§6 beam tilt (v1 rule, v6 pan physics)', () => {
  it('case A (1 against, 3 unread): against side down at the 4° floor', () => {
    const t = balanceTilt(countsOf(CASE_A), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MIN_ANGLE_DEG);
    expect(t.heavy).toBe('against');
    // The bead pair differs by Lh × sin; each pan moves by half that.
    expect(t.endDropPx).toBeCloseTo(Math.sin((4 * Math.PI) / 180) * BALANCE_LH_PX, 10);
    expect(t.risePx).toBeCloseTo(t.endDropPx / 2, 12);
  });

  it('case B (2 for, 2 against): level', () => {
    const t = balanceTilt(countsOf(CASE_B), BALANCE_LH_PX);
    expect(t).toEqual({ angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null });
  });

  it('case C (3 for, 1 neutral): for side down at 9°', () => {
    const t = balanceTilt(countsOf(CASE_C), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(9);
    expect(t.heavy).toBe('for');
    expect(t.endDropPx).toBeCloseTo(Math.sin((9 * Math.PI) / 180) * BALANCE_LH_PX, 10);
  });

  it('case D (4 unread): readable 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_D), BALANCE_LH_PX).heavy).toBeNull();
  });

  it('case G (1 for, 1 against, 2 unread): net 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_G), BALANCE_LH_PX).heavy).toBeNull();
  });

  it('case E (4 against): the full 12°', () => {
    const t = balanceTilt(countsOf(CASE_E), BALANCE_LH_PX);
    expect(t.angleDeg).toBe(BALANCE_MAX_ANGLE_DEG);
    expect(t.endDropPx).toBeCloseTo(Math.sin((12 * Math.PI) / 180) * BALANCE_LH_PX, 10);
  });

  it('the picture shows no height difference other than Lh × sin(angle)', () => {
    for (const drivers of [CASE_A, CASE_B, CASE_C, CASE_D, CASE_E, CASE_G, CASE_H]) {
      const t = balanceTilt(countsOf(drivers), BALANCE_LH_PX);
      if (t.heavy === null) {
        expect(t.endDropPx).toBe(0);
      } else {
        expect(t.endDropPx).toBeCloseTo(Math.sin((t.angleDeg * Math.PI) / 180) * BALANCE_LH_PX, 10);
        expect(t.risePx * 2).toBeCloseTo(t.endDropPx, 12);
      }
    }
  });

  it('never dips below the 4° floor when net ≠ 0 (a one-driver lean stays visible)', () => {
    const oneVsMany: BalanceDriver[] = [...CASE_A, d('x1', 'unread'), d('x2', 'unread'), d('x3', 'unread'), d('x4', 'unread'), d('x5', 'unread'), d('x6', 'unread'), d('x7', 'unread'), d('x8', 'unread'), d('x9', 'unread')];
    const t = balanceTilt(countsOf(oneVsMany), BALANCE_LH_PX);
    expect(t.angleDeg).toBeGreaterThanOrEqual(BALANCE_MIN_ANGLE_DEG);
    expect(t.angleDeg).toBeLessThanOrEqual(BALANCE_MAX_ANGLE_DEG);
  });

  it('a zero Lh stays level (a degenerate drawing never fabricates a tilt)', () => {
    expect(balanceTilt(countsOf(CASE_A), 0).heavy).toBeNull();
  });

  it('signedTiltDeg maps the verdict to the physical sign: against heavy = positive, for = negative, level = 0', () => {
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_A), BALANCE_LH_PX))).toBe(4);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_C), BALANCE_LH_PX))).toBe(-9);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_E), BALANCE_LH_PX))).toBe(12);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_B), BALANCE_LH_PX))).toBe(0);
    expect(signedTiltDeg(balanceTilt(countsOf(CASE_D), BALANCE_LH_PX))).toBe(0);
  });

  it('the pan tilt stays a restrained fraction of the beam angle (readability rule)', () => {
    const worst = BALANCE_PAN_TILT_FRACTION * BALANCE_MAX_ANGLE_DEG;
    expect(worst).toBeLessThanOrEqual(3);
    expect(BALANCE_PAN_CAPACITY).toBe(2);
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
    expect(countLineParts(countsOf(CASE_A), copy, 'en-US')).toEqual(['1 against', "1 couldn't be read".replace('{n}', '1')].slice(0, 1).concat(["3 couldn't be read"]));
    expect(countLineParts(countsOf(CASE_B), copy, 'en-US')).toEqual(['2 for', '2 against']);
    expect(countLineParts(countsOf(CASE_C), copy, 'en-US')).toEqual(['3 for', '1 neutral']);
  });

  it('renders Persian digits in fa', () => {
    expect(countLineParts(countsOf(CASE_A), copyFa, 'fa-IR')).toEqual(['۱ به ضرر', '۳ قابل ارزیابی نیست']);
  });
});

/* ------------------------------------------------------------------ *
 * BalanceScale (rendered v6 balance)
 * ------------------------------------------------------------------ */

describe('BalanceScale (rendered v6 balance)', () => {
  it('case A: heading + subtitle + captions + stage + pans with tiles + assessment + lists + panel + trays', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
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
    expect(stage.getAttribute('aria-label')).toBe('Balance for gold: 1 against · 3 couldn\'t be read. Leaning against gold.');
    // The drawing's parts: reference, hangers (lines + ring dots),
    // pans, beam + beads, hub, keystone.
    expect(document.querySelector('[data-balance-reference]')).not.toBeNull();
    for (const side of ['for', 'against'] as const) {
      expect(document.querySelector(`[data-balance-hanger="${side}-start"]`)).not.toBeNull();
      expect(document.querySelector(`[data-balance-hanger="${side}-end"]`)).not.toBeNull();
      expect(document.querySelector(`[data-balance-hanger="${side}-start-ring"]`)).not.toBeNull();
      expect(document.querySelector(`[data-balance-hanger="${side}-end-ring"]`)).not.toBeNull();
    }
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    const hub = document.querySelector('[data-balance-pivot]') as HTMLElement;
    const fulcrum = document.querySelector('[data-balance-fulcrum]') as HTMLElement;
    expect(beam).not.toBeNull();
    expect(hub).not.toBeNull();
    expect(fulcrum).not.toBeNull();
    expect(document.querySelector('[data-balance-bead="for"]')?.className).toContain('bg-[var(--color-status-normal)]');
    expect(document.querySelector('[data-balance-bead="against"]')?.className).toContain('bg-[var(--color-status-alert)]');
    // The beam tapers (the clipped shape) and spans half the stage.
    expect(beam.className).toContain('w-1/2');
    expect(beam.className).toContain('left-1/4');
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
    expect(screen.getByText('1 against · 3 couldn\'t be read')).toBeTruthy();
    // 6. The lists: the for side's evidence-based line is visible
    // WITHOUT any disclosure (the explanatory message is never hidden
    // behind a click); the against side's full list is hidden until
    // disclosed (its single factor already rests on the pan).
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
    // 8. The trays: 3 unread chips, no neutral tray.
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(3);
    expect(document.querySelector('[data-balance-tray="neutral"]')).toBeNull();
  });

  it('case A: the beam rotates by the floored angle and the pans translate by exactly their beads\' drop — one physical law in CSS', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    const asmFor = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    const asmAgainst = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    // The visual angle (LTR: against-heavy = clockwise = positive).
    expect(stage.style.getPropertyValue('--t')).toBe('4deg');
    expect(stage.style.getPropertyValue('--s')).toBe('4deg');
    expect(beam.style.transform).toBe('rotate(var(--s))');
    // The drop: 25cqw is Lh ÷ 2 BY CONSTRUCTION (the beam spans half
    // the stage), so the pans drop exactly as far as their beads.
    expect(stage.style.getPropertyValue('--lh-half')).toBe('25cqw');
    expect(stage.style.getPropertyValue('--drop-against')).toBe('calc(var(--lh-half) * sin(var(--t)))');
    expect(stage.style.getPropertyValue('--drop-for')).toBe('calc(var(--lh-half) * sin(var(--t)) * -1)');
    // Both assemblies carry the drop + the restrained pan tilt.
    expect(asmFor.style.transform).toBe('translateY(var(--drop-for)) rotate(var(--pan-tilt))');
    expect(asmAgainst.style.transform).toBe('translateY(var(--drop-against)) rotate(var(--pan-tilt))');
    expect(asmFor.style.transformOrigin).toBe('50% 0');
    expect(stage.style.getPropertyValue('--pan-tilt')).toBe(`calc(var(--s) * ${BALANCE_PAN_TILT_FRACTION})`);
  });

  it('case C (for heavy): the physical sign is negative and drives BOTH pans; fa flips ONLY the visual sign', () => {
    const { rerender } = render(<BalanceScale drivers={CASE_C} copy={copy} numberLocale="en-US" />);
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stage.style.getPropertyValue('--t')).toBe('-9deg');
    expect(stage.style.getPropertyValue('--s')).toBe('-9deg');
    rerender(<BalanceScale drivers={CASE_C} copy={copyFa} numberLocale="fa-IR" />);
    const stageFa = document.querySelector('[data-balance-stage]') as HTMLElement;
    // The PHYSICAL drop sign never flips (the for pan drops in fa too);
    // only the beam's VISUAL rotation flips so the heavy end dips.
    expect(stageFa.style.getPropertyValue('--t')).toBe('-9deg');
    expect(stageFa.style.getPropertyValue('--s')).toBe('9deg');
  });

  it('cases B, D and G render level — no direction, no drop, no tilt', () => {
    for (const drivers of [CASE_B, CASE_D, CASE_G]) {
      const { unmount } = render(<BalanceScale drivers={drivers} copy={copy} numberLocale="en-US" />);
      const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
      expect(stage.style.getPropertyValue('--t')).toBe('0deg');
      expect(stage.style.getPropertyValue('--s')).toBe('0deg');
      unmount();
    }
  });

  it('case B: both pans carry two tiles and the balance is level', () => {
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    expect(document.querySelectorAll('[data-balance-pan="for"] [data-balance-tile]').length).toBe(2);
    expect(document.querySelectorAll('[data-balance-pan="against"] [data-balance-tile]').length).toBe(2);
    expect(screen.getByText('Balanced')).toBeTruthy();
  });

  it('case D: the none verdict, the DISTINCT "nothing to weigh yet" markers in BOTH pans, the unavailable lines on both sides, level', () => {
    render(<BalanceScale drivers={CASE_D} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText("Can't read the conditions right now")).toBeTruthy();
    for (const side of ['for', 'against'] as const) {
      expect(document.querySelector(`[data-balance-empty="${side}"]`)?.textContent).toBe('Nothing to weigh yet');
      const list = document.getElementById(`gold-balance-list-${side}`) as HTMLElement;
      expect(list.hidden).toBe(false);
      expect(list.textContent).toContain('Nothing could be read yet, so neither side has been weighed.');
    }
    expect((document.querySelector('[data-balance-stage]') as HTMLElement).style.getPropertyValue('--t')).toBe('0deg');
    // Everything sits in the unread tray, off the pans.
    expect(document.querySelector('[data-balance-tray="unread"]')!.querySelectorAll('button').length).toBe(4);
  });

  it('case H (6 for / 3 against): the pans keep their capacity, the pills count the overflow, the full lists disclose, and the stage geometry never changes', () => {
    render(<BalanceScale drivers={CASE_H} copy={copy} numberLocale="en-US" />);
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
    // (fixed heights, same anchors) as the 4-driver case A render.
    const { unmount } = render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const stageA = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stageA.className).toBe(stageClass);
    expect((document.querySelector('[data-balance-assembly="against"]') as HTMLElement).style.transform).toBe(
      'translateY(var(--drop-against)) rotate(var(--pan-tilt))',
    );
    unmount();
    // "Show fewer" collapses the list again.
    const fewer = document.querySelector('[data-balance-fewer="for"]') as HTMLButtonElement;
    fireEvent.click(fewer);
    const listForAgain = document.getElementById('gold-balance-list-for') as HTMLElement;
    expect(listForAgain.hidden).toBe(true);
  });

  it('a tile tap opens its explanation in the panel; a second tap closes it (every width)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
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
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    fireEvent.click(document.querySelector('[data-balance-tile="real-yield"]')!);
    expect(document.querySelector('[data-balance-detail]')!.getAttribute('data-balance-detail')).toBe('real-yield');
    fireEvent.click(document.querySelector('[data-balance-chip="stress"]')!);
    expect(document.querySelector('[data-balance-detail]')!.getAttribute('data-balance-detail')).toBe('stress');
  });

  it('the structure order: heading → subtitle → captions → stage → assessment → lists → panel → trays', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
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
    const { unmount: unmountFa } = render(<BalanceScale drivers={CASE_A} copy={copyFa} numberLocale="fa-IR" />);
    expect(screen.getByText('برآیند عوامل مؤثر بر قیمت طلا')).toBeTruthy();
    expect(screen.getByText('۱ به ضرر · ۳ قابل ارزیابی نیست')).toBeTruthy();
    // The side label rides TWICE by design: once as the caption over the
    // pan, once as the (empty) side's list-section header below.
    expect(screen.getAllByText('عوامل حمایتی از قیمت طلا').length).toBe(2);
    expect(screen.getAllByText('عوامل فشارآور بر قیمت طلا').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('نشانهٔ معتبری نیست')).toBeTruthy();
    expect(
      screen.getByText('در حال حاضر، نشانهٔ معناداری از حمایت عوامل بررسی‌شده از رشد قیمت طلا دیده نمی‌شود.'),
    ).toBeTruthy();
    const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
    expect(stage.getAttribute('aria-label')).toBe('ترازوی طلا: ۱ به ضرر · ۳ قابل ارزیابی نیست. تمایل به ضرر طلا.');
    // The visual sign flipped for RTL (see the case C test); the
    // source NEVER mirrors text — no scaleX(-1) anywhere.
    expect(balanceSrc).not.toMatch(/scaleX\(-1\)/);
    unmountFa();
    const { unmount } = render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    expect((document.querySelector('[data-balance-stage]') as HTMLElement).style.getPropertyValue('--s')).toBe('4deg');
    unmount();
  });

  it('chips are at least 44px tall by class and dashed for unread; the empty-side full line rides the list area', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    expect(chip.className).toContain('min-h-[44px]');
    expect(chip.className).toContain('border-dashed');
  });

  it('the banner sentence rides inside the assessment box where provided', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" banner={<p>the c12 note</p>} />);
    const verdict = document.querySelector('[data-balance-verdict]') as HTMLElement;
    expect(verdict.textContent).toContain('the c12 note');
  });
});

/* ------------------------------------------------------------------ *
 * §9 — the merged card integration (balance between the outlook strip
 * and the divider-separated footing strip; retired headings gone)
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
    // The balance replaced the groups.
    expect(document.querySelector('[data-balance]')).not.toBeNull();
    expect(document.querySelector('[data-balance-stage]')).not.toBeNull();
    expect(screen.getByText('Leaning against gold')).toBeTruthy();
    expect(screen.getByText('The aggregate of factors affecting the price of gold')).toBeTruthy();
    // The retired group headings never render again.
    expect(screen.queryByText('Works against')).toBeNull();
    expect(screen.queryByText('Sitting neutral')).toBeNull();
    // v6: the against PAN carries the one readable tile; the for side
    // keeps its pan with the evidence-based line below (no dashed slot).
    expect(document.querySelector('[data-balance-tile="real-yield"]')).not.toBeNull();
    expect(
      screen.getByText('None of the factors checked shows a meaningful signal supporting gold’s price right now.'),
    ).toBeTruthy();
    expect(document.querySelector('[data-balance-empty="for"]')?.textContent).toBe('No qualifying signals');
    expect(document.querySelector('[data-balance-slot]')).toBeNull();
    // The unread drivers sit in the tray, off the pans.
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(3);
    // The merged card shares the conditions once: the balance reads GOLD's
    // list (identical by construction), the silver-only condition stays.
    expect(mergeSignals(gold, silver).shared.length).toBe(4);
    expect(screen.getByText('Silver only')).toBeTruthy();
    // The price footing strip: divider-separated, below the trays (§9).
    const footing = screen.getByText('Price footing') as HTMLElement;
    const footingBox = footing.parentElement as HTMLElement;
    expect(footingBox.className).toContain('border-t');
    expect(footingBox.compareDocumentPosition(unreadTray) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
