/**
 * @vitest-environment jsdom
 *
 * balance.test.tsx — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md + the v2 seesaw patch + the
 * v3 revision + the v4 Iteration-2 directive + the v5 WIREFRAME
 * directive, 2026-10-26: the composition now matches the owner's
 * reference board docs/ui-reference/gold-silver-balance-target-wireframe.png
 * — the two opposing factor COLUMNS sit ABOVE the abstract editorial
 * beam, the beam's endpoint beads land exactly under the two columns'
 * centres, a compact assessment box follows beneath, and each column
 * progressive-discloses past 3 rows.
 * Covers:
 *
 *   §4  driver-state mapping (supportive/against/neutral/unknown →
 *       for/against/neutral/unread 1:1 — the model already separates
 *       neutral from unread), total/net/readable arithmetic
 *   §6  the tilt rule (v1 steps 3–4, kept verbatim by v2 §4, v3, v4
 *       and v5 rule 4): heavier side down, angle = |net|/total × 12°
 *       with the 4° floor, unread drivers pulling toward level, level
 *       at net 0 and at readable 0, and the geometry law: the picture
 *       shows NO height difference other than Lh × sin(angle)
 *   §5.1/§12.1  the verdict word + the " · "-joined count line (zero
 *       parts omitted, ≥14px) and the role="img" aria label
 *   Wireframe order  heading → subtitle → the two factor columns →
 *       the illustration beneath them → the assessment box (verdict +
 *       count + the banner where needed) → panel → trays
 *   v5 rules 1–5 (rendered): ONE fixed-viewBox SVG (520×88) whose
 *       parts are the beam body, the two accent endpoint beads (at
 *       x=130/390 — the two columns' centres), the hub, the keystone
 *       triangle (NO base bar), and the dotted level reference — the
 *       ONLY line in the drawing (no chains, no pans, no pillar,
 *       nothing attached to the beam); the factor rows live in the
 *       COLUMNS ABOVE the drawing, never on the beam; an empty side
 *       shows the concise evidence-based line in a soft tint block
 *       and NO dashed slot exists anywhere; when NOTHING could be
 *       read, BOTH sides carry the distinct unavailable line; the
 *       SVG's geometry never depends on the factor count or the
 *       columns' disclosure state; progressive disclosure past 3 rows
 *       per column (the "+{n} more" / "Show fewer" convention);
 *       RTL mirrors the whole SVG with scaleX(-1) and the rotation
 *       stays LTR-signed (the mirror flips the visual sign)
 *   §7/§8/§12  rows are real buttons with aria-expanded opening the
 *       one shared detail panel, trays: neutral quiet chips vs unread
 *       dashed chips with the clock icon, empty trays hidden
 *   §9  (integration) the merged card renders the balance between the
 *       outlook strip and the divider-separated price footing strip;
 *       the retired group headings are gone
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey, SignalConditionState, SignalReading } from '@currena/insights';
import {
  BalanceScale,
  BALANCE_LH_VB,
  BALANCE_LIST_REVEAL,
  BALANCE_VIEWBOX_H,
  BALANCE_VIEWBOX_W,
  balanceCounts,
  balanceTilt,
  balanceVerdictOf,
  countLineParts,
  driverStateOf,
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
/** v5 rule 5 case H: a many-factor side (6 for / 3 against) — beyond
 * any real driver list, harness-only: proves the illustration ignores
 * the factor count, the columns progressive-disclose, and the lists
 * just grow. */
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

function matchMediaStub(matches: boolean): (query: string) => MediaQueryList {
  return (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', matchMediaStub(false));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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
    const c = countsOf(CASE_A);
    expect(c).toEqual({ for: 0, against: 1, neutral: 0, unread: 3, total: 4, net: -1, readable: 1 });
    expect(countsOf(CASE_G)).toEqual({ for: 1, against: 1, neutral: 0, unread: 2, total: 4, net: 0, readable: 2 });
  });
});

/* ------------------------------------------------------------------ *
 * §6 — the beam tilt (the owner's model, unchanged by the v5 arm)
 * ------------------------------------------------------------------ */

describe('§6 beam tilt (v1 rule, v5 geometry)', () => {
  it('case A (1 against, 3 unread): against side down at the 4° floor', () => {
    const t = balanceTilt(countsOf(CASE_A), BALANCE_LH_VB);
    expect(t.angleDeg).toBe(4);
    expect(t.heavy).toBe('against');
  });

  it('case B (2 for, 2 against): level', () => {
    expect(balanceTilt(countsOf(CASE_B), BALANCE_LH_VB).angleDeg).toBe(0);
  });

  it('case C (3 for, 1 neutral): for side down at 9°', () => {
    const t = balanceTilt(countsOf(CASE_C), BALANCE_LH_VB);
    expect(t.angleDeg).toBe(9);
    expect(t.heavy).toBe('for');
  });

  it('case D (4 unread): readable 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_D), BALANCE_LH_VB).angleDeg).toBe(0);
  });

  it('case G (1 for, 1 against, 2 unread): net 0 → level — no directional implication', () => {
    expect(balanceTilt(countsOf(CASE_G), BALANCE_LH_VB).angleDeg).toBe(0);
  });

  it('case E (4 against): the full 12°', () => {
    expect(balanceTilt(countsOf(CASE_E), BALANCE_LH_VB).angleDeg).toBe(12);
  });

  it('the picture shows no height difference other than Lh × sin(angle)', () => {
    for (const drivers of [CASE_A, CASE_B, CASE_C, CASE_D, CASE_E, CASE_G, CASE_H]) {
      const t = balanceTilt(countsOf(drivers), BALANCE_LH_VB);
      expect(t.endDropPx).toBeCloseTo(Math.sin((t.angleDeg * Math.PI) / 180) * BALANCE_LH_VB, 6);
      expect(t.endDropPx).toBeCloseTo(2 * t.risePx, 6);
    }
  });

  it('never dips below the 4° floor when net ≠ 0 (a one-driver lean stays visible)', () => {
    const one: BalanceDriver[] = [d('x', 'for'), d('y', 'unread'), d('z', 'unread'), d('w', 'unread'), d('v', 'unread')];
    expect(balanceTilt(countsOf(one), BALANCE_LH_VB).angleDeg).toBe(4);
  });

  it('a zero Lh stays level (a degenerate drawing never fabricates a tilt)', () => {
    expect(balanceTilt(countsOf(CASE_C), 0).angleDeg).toBe(0);
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
    expect(countLineParts(countsOf(CASE_A), copy, 'en-US')).toEqual(["1 against", "3 couldn't be read"]);
    expect(countLineParts(countsOf(CASE_B), copy, 'en-US')).toEqual(['2 for', '2 against']);
  });

  it('renders Persian digits in fa', () => {
    expect(countLineParts(countsOf(CASE_A), copyFa, 'fa-IR')).toEqual(['۱ به ضرر', '۳ قابل ارزیابی نیست']);
  });
});

/* ------------------------------------------------------------------ *
 * The rendered v5 balance
 * ------------------------------------------------------------------ */

describe('BalanceScale (rendered v5 balance)', () => {
  it('case A: heading + subtitle + verdict + count line + aria label + the SVG parts + the columns + trays + the empty state', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    // The concept's own heading and its explanatory subtitle lead the
    // block; the heading speaks in the card-question voice, the
    // subtitle in the quiet caption voice.
    const title = document.querySelector('[data-balance-title]') as HTMLElement;
    expect(title.textContent).toBe('The aggregate of factors affecting the price of gold');
    expect(title.tagName).toBe('H4');
    expect(title.className).toContain('type-question');
    const subtitle = document.querySelector('[data-balance-subtitle]') as HTMLElement;
    expect(subtitle.textContent).toContain('weighed equally');
    expect(subtitle.className).toContain('text-[var(--color-text-secondary)]');
    expect(screen.getByText('Leaning against gold')).toBeTruthy();
    const count = document.querySelector('[data-balance-count]') as HTMLElement;
    expect(count.textContent).toBe("1 against · 3 couldn't be read");
    expect(count.className).toContain('text-[length:var(--type-label)]');
    expect(count.className).toContain('text-[var(--color-text-secondary)]');
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.getAttribute('role')).toBe('img');
    expect(graphic.getAttribute('aria-label')).toBe(
      'Balance for gold: 1 against · 3 couldn\'t be read. Leaning against gold.',
    );
    // The v5 drawing: the tapered beam body, the two accent endpoint
    // beads, the hub, the keystone triangle (NO base bar) and the level
    // reference — all inside ONE flat 520×88 SVG.
    const svg = graphic.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${BALANCE_VIEWBOX_W} ${BALANCE_VIEWBOX_H}`);
    expect(document.querySelector('[data-balance-beam]')).not.toBeNull();
    expect(document.querySelector('[data-balance-beam-body]')).not.toBeNull();
    expect(document.querySelector('[data-balance-pivot]')).not.toBeNull();
    expect(document.querySelector('[data-balance-fulcrum]')).not.toBeNull();
    expect(document.querySelector('[data-balance-reference]')).not.toBeNull();
    const forBead = document.querySelector('[data-balance-end="for"]') as SVGCircleElement;
    const againstBead = document.querySelector('[data-balance-end="against"]') as SVGCircleElement;
    expect(forBead).not.toBeNull();
    expect(againstBead).not.toBeNull();
    // The beads carry the side accents; everything else is neutral ink.
    expect(forBead.getAttribute('fill')).toBe('var(--color-status-normal)');
    expect(againstBead.getAttribute('fill')).toBe('var(--color-status-alert)');
    // The beads sit at the two factor columns' centres (25%/75% of the
    // 520-wide canvas): x=130 and x=390 — the reference board's
    // endpoint-to-column alignment.
    expect(Number(forBead.getAttribute('cx'))).toBe(130);
    expect(Number(againstBead.getAttribute('cx'))).toBe(390);
    // v4/v5 rule 1: NO hanging machinery — the reference is the ONLY
    // line (v3's four chains are gone) and the fulcrum is one triangle
    // path (no base bar, no pillar).
    expect(svg.querySelectorAll('line').length).toBe(1);
    const fulcrum = document.querySelector('[data-balance-fulcrum]') as SVGGElement;
    expect(fulcrum.querySelectorAll('path').length).toBe(1);
    expect(fulcrum.querySelectorAll('rect').length).toBe(0);
    // The SVG is presentational: aria-hidden, not focusable.
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    // v5 rule 3: the factor rows live in the COLUMNS ABOVE the beam,
    // never on the beam.
    const forList = document.querySelector('[data-balance-list="for"]') as HTMLElement;
    const againstList = document.querySelector('[data-balance-list="against"]') as HTMLElement;
    expect(forList.querySelectorAll('button').length).toBe(0);
    expect(againstList.querySelectorAll('button').length).toBe(1);
    expect(screen.getByText('Real yields')).toBeTruthy();
    // v5 rule 2: the EMPTY for side gets the concise evidence-based
    // line in a soft tint block under its heading — and NO dashed slot
    // exists anywhere.
    expect(
      screen.getByText('None of the factors checked shows a meaningful signal supporting gold’s price right now.'),
    ).toBeTruthy();
    const emptyFor = document.querySelector('[data-balance-empty="for"]') as HTMLElement;
    expect(emptyFor).not.toBeNull();
    expect(emptyFor.className).toContain('bg-currena-soft/60');
    expect(document.querySelector('[data-balance-empty="against"]')).toBeNull();
    expect(document.querySelector('[data-balance-slot]')).toBeNull();
    // Trays: no neutral chips → the neutral tray is absent; 3 unread chips.
    expect(document.querySelector('[data-balance-tray="neutral"]')).toBeNull();
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(3);
    // Rows are real buttons with aria-expanded and the fixed 56px size.
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    expect(block.tagName).toBe('BUTTON');
    expect(block.getAttribute('aria-expanded')).toBe('false');
    expect(block.className).toContain('h-[56px]');
    // v2 §5.5.1 (kept): NO sentence inside a row at any width.
    expect(block.textContent).not.toContain('explanation sentence');
  });

  it('case A: the beam rotates by the floored angle around the pivot — the heavy (against, inline-end) end goes down: clockwise = +4° in LTR; the fulcrum never moves', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toMatch(/rotate\(4deg\)/);
    expect(beam.style.transformOrigin).toContain(`${260}`);
    expect(beam.style.transformBox).toBe('view-box');
    expect((document.querySelector('[data-balance-fulcrum]') as SVGElement).style.transform).toBe('');
    // The endpoint beads are INSIDE the rotating group (rigid): no pan
    // group ever translates separately (v3's pans are gone).
    expect(document.querySelector('[data-balance-pan]')).toBeNull();
    expect(beam.contains(document.querySelector('[data-balance-end="against"]'))).toBe(true);
  });

  it('case C (for heavy): the rotation is LTR-signed negative — counter-clockwise, the inline-start end down', () => {
    render(<BalanceScale drivers={CASE_C} copy={copy} numberLocale="en-US" />);
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toMatch(/rotate\(-9deg\)/);
  });

  it('a row tap opens its explanation in the panel; a second tap closes it (v2: every width)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    const panel = document.querySelector('#gold-balance-detail') as HTMLElement;
    expect(panel.hidden).toBe(true);
    fireEvent.click(block);
    expect(panel.hidden).toBe(false);
    expect(panel.getAttribute('data-balance-detail')).toBe('real-yield');
    expect(panel.textContent).toContain('real-yield explanation sentence');
    expect(block.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(block);
    expect(panel.hidden).toBe(true);
  });

  it('one panel at a time: opening a chip closes the row\'s panel', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    fireEvent.click(block);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    fireEvent.click(chip);
    const panel = document.querySelector('[data-balance-detail]') as HTMLElement;
    expect(panel.getAttribute('data-balance-detail')).toBe('stress');
    expect(block.getAttribute('aria-expanded')).toBe('false');
  });

  it('case B (2 for, 2 against): both columns carry two rows and the beam is level', () => {
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('Balanced')).toBeTruthy();
    const forList = document.querySelector('[data-balance-list="for"]') as HTMLElement;
    const againstList = document.querySelector('[data-balance-list="against"]') as HTMLElement;
    expect(forList.querySelectorAll('button').length).toBe(2);
    expect(againstList.querySelectorAll('button').length).toBe(2);
    expect(document.querySelector('[data-balance-empty]')).toBeNull();
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toBe('rotate(0deg)');
  });

  it('case G (1 for, 1 against, 2 unread): level beam, one row per column, no empty state', () => {
    render(<BalanceScale drivers={CASE_G} copy={copy} numberLocale="en-US" />);
    const forList = document.querySelector('[data-balance-list="for"]') as HTMLElement;
    const againstList = document.querySelector('[data-balance-list="against"]') as HTMLElement;
    expect(forList.querySelectorAll('button').length).toBe(1);
    expect(againstList.querySelectorAll('button').length).toBe(1);
    expect(document.querySelector('[data-balance-empty]')).toBeNull();
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toBe('rotate(0deg)');
  });

  it('case D: the none verdict, the DISTINCT unavailable empty line on BOTH sides, everything in the unread tray, level beam', () => {
    render(<BalanceScale drivers={CASE_D} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText("Can't read the conditions right now")).toBeTruthy();
    // The unavailable case is DISTINCT from the no-qualifying-factors
    // case: both sides carry the listEmptyNone wording, never the
    // evidence-based line (an absence of readings is not an absence of
    // pressure — Iteration-2 §5).
    expect(screen.getAllByText('Nothing could be read yet, so neither side has been weighed.').length).toBe(2);
    expect(screen.queryByText('None of the factors checked shows a meaningful signal supporting gold’s price right now.')).toBeNull();
    expect(screen.queryByText('None of the factors checked shows a meaningful signal working against gold’s price right now.')).toBeNull();
    expect(document.querySelector('[data-balance-empty="for"]')).not.toBeNull();
    expect(document.querySelector('[data-balance-empty="against"]')).not.toBeNull();
    expect(document.querySelector('[data-balance-list="for"] button')).toBeNull();
    expect(document.querySelector('[data-balance-list="against"] button')).toBeNull();
    // No directional implication: the beam stays level (v5 rule 4).
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toBe('rotate(0deg)');
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(4);
  });

  it('case H (6 for / 3 against): the for column reveals 3 rows + the "+3 more" pill; expanding shows all 6 + "Show fewer"; the illustration is untouched (v5 rule 5)', () => {
    render(<BalanceScale drivers={CASE_H} copy={copy} numberLocale="en-US" />);
    const forList = document.querySelector('[data-balance-list="for"]') as HTMLElement;
    const againstList = document.querySelector('[data-balance-list="against"]') as HTMLElement;
    // The reveal: 3 rows visible (the site's attention-tile
    // convention), the rest behind the disclosure pill.
    expect(BALANCE_LIST_REVEAL).toBe(3);
    expect(forList.querySelectorAll('[data-balance-block]').length).toBe(3);
    expect(againstList.querySelectorAll('[data-balance-block]').length).toBe(3);
    const more = document.querySelector('[data-balance-more="for"]') as HTMLButtonElement;
    expect(more).not.toBeNull();
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(more.getAttribute('aria-controls')).toBe('gold-balance-list-for');
    expect(more.textContent).toBe('+3 more');
    // The against column has exactly 3 rows → no disclosure pill.
    expect(document.querySelector('[data-balance-more="against"]')).toBeNull();
    expect(document.querySelector('[data-balance-fewer="for"]')).toBeNull();
    // The SVG's geometry is a constant: the same viewBox and the same
    // tilt as any other 3-net-for case, whatever the list lengths —
    // and the expansion never touches it either.
    const zoneHtmlBefore = document.querySelector('[data-balance-zone]')!.innerHTML;
    const svg = document.querySelector('[data-balance-graphic] svg') as SVGSVGElement;
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${BALANCE_VIEWBOX_W} ${BALANCE_VIEWBOX_H}`);
    expect(svg.querySelectorAll('line').length).toBe(1); // the reference only
    const tilt = balanceTilt(countsOf(CASE_H), BALANCE_LH_VB);
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toBe(`rotate(${-tilt.angleDeg}deg)`);
    // Expand: all 6 rows + the "Show fewer" pill (aria-expanded=true).
    fireEvent.click(more);
    expect(forList.querySelectorAll('[data-balance-block]').length).toBe(6);
    const fewer = document.querySelector('[data-balance-fewer="for"]') as HTMLButtonElement;
    expect(fewer.getAttribute('aria-expanded')).toBe('true');
    expect(fewer.textContent).toBe('Show fewer');
    expect(document.querySelector('[data-balance-more="for"]')).toBeNull();
    expect(document.querySelector('[data-balance-zone]')!.innerHTML).toBe(zoneHtmlBefore);
    // Collapse back to 3.
    fireEvent.click(fewer);
    expect(forList.querySelectorAll('[data-balance-block]').length).toBe(3);
    expect(document.querySelector('[data-balance-zone]')!.innerHTML).toBe(zoneHtmlBefore);
  });

  it('the illustration is ONE SVG whose geometry never depends on the factor count (v5 rule 5, V9 successor)', () => {
    const zoneHtmlOf = (drivers: BalanceDriver[]): string => {
      render(<BalanceScale drivers={drivers} copy={copy} numberLocale="en-US" />);
      const zone = document.querySelector('[data-balance-zone]') as HTMLElement;
      const html = zone.innerHTML;
      cleanup();
      return html;
    };
    // Case A (1 row) vs case B (2 rows) vs case H (6 rows): the SVG
    // markup is byte-identical modulo the tilt transforms and the
    // case-dependent aria-label (content, not geometry).
    const a = zoneHtmlOf(CASE_A);
    const b = zoneHtmlOf(CASE_B);
    const h = zoneHtmlOf(CASE_H);
    const strip = (html: string): string =>
      html.replace(/transform:[^;"]+/g, 'transform:T').replace(/aria-label="[^"]*"/, 'aria-label=L');
    expect(strip(a)).toBe(strip(b));
    expect(strip(b)).toBe(strip(h));
    // No inline height is ever set on the zone: the SVG scales by its
    // viewBox aspect alone.
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    const zone = document.querySelector('[data-balance-zone]') as HTMLElement;
    expect(zone.style.height).toBe('');
    expect(zone.querySelector('svg')!.getAttribute('viewBox')).toBe(`0 0 ${BALANCE_VIEWBOX_W} ${BALANCE_VIEWBOX_H}`);
  });

  it('the column headings carry both side captions with their icons and side colours (v2 §5.7 → the v5 side labels)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const forCaption = document.querySelector('[data-balance-caption="for"]') as HTMLElement;
    const againstCaption = document.querySelector('[data-balance-caption="against"]') as HTMLElement;
    expect(forCaption.textContent).toContain('Factors supporting gold’s price');
    expect(againstCaption.textContent).toContain('Factors pressuring gold’s price');
    expect(forCaption.className).toContain('text-[var(--color-status-normal)]');
    expect(againstCaption.className).toContain('text-[var(--color-status-alert)]');
    // The captions head the columns — they are NOT inside the SVG.
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.contains(forCaption)).toBe(false);
    expect(graphic.contains(againstCaption)).toBe(false);
    // The columns share the drawing's own max-w footprint so each
    // column sits over ITS side's beam bead.
    const lists = document.querySelector('[data-balance-lists]') as HTMLElement;
    const zone = document.querySelector('[data-balance-zone]') as HTMLElement;
    expect(lists.className).toContain('max-w-[640px]');
    expect(zone.className).toContain('max-w-[640px]');
  });

  it('the order is heading → subtitle → the two factor columns → the beam beneath them → the assessment box (+ count + banner) → panel → trays (the wireframe §3)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" banner={<p>banner sentence</p>} />);
    const root = document.querySelector('[data-balance]') as HTMLElement;
    const orderOf = (el: Element | null): number => {
      expect(el).not.toBeNull();
      return Array.prototype.indexOf.call(
        root.querySelectorAll(
          '[data-balance-title], [data-balance-subtitle], [data-balance-lists], [data-balance-zone], [data-balance-verdict], [data-balance-count], p, #gold-balance-detail, [data-balance-tray]',
        ),
        el,
      );
    };
    const seq = [
      orderOf(document.querySelector('[data-balance-title]')),
      orderOf(document.querySelector('[data-balance-subtitle]')),
      orderOf(document.querySelector('[data-balance-lists]')),
      orderOf(document.querySelector('[data-balance-zone]')),
      orderOf(document.querySelector('[data-balance-verdict]')),
      orderOf(document.querySelector('[data-balance-count]')),
      orderOf(document.querySelector('[data-balance-verdict] p')),
      orderOf(document.querySelector('#gold-balance-detail')),
      orderOf(document.querySelector('[data-balance-tray="unread"]')),
    ];
    const sorted = [...seq].sort((a, b) => a - b);
    expect(seq).toEqual(sorted);
    expect(new Set(seq).size).toBe(seq.length);
  });

  it('renders Persian digits, mirrors the whole SVG in fa, keeps the rotation LTR-signed, and the assessment rides in the soft centred box', () => {
    const { rerender } = render(<BalanceScale drivers={CASE_A} copy={copyFa} numberLocale="fa-IR" />);
    expect(screen.getByText('برآیند عوامل مؤثر بر قیمت طلا')).toBeTruthy();
    expect(screen.getByText('۱ به ضرر · ۳ قابل ارزیابی نیست')).toBeTruthy();
    expect(
      screen.getByText('در حال حاضر، نشانهٔ معناداری از حمایت عوامل بررسی‌شده از رشد قیمت طلا دیده نمی‌شود.'),
    ).toBeTruthy();
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.getAttribute('aria-label')).toBe('ترازوی طلا: ۱ به ضرر · ۳ قابل ارزیابی نیست. تمایل به ضرر طلا.');
    // v4/v5: RTL mirrors the ENTIRE SVG with scaleX(-1) — the geometry
    // is pure shapes, so one transform relocates the `for` bead to the
    // inline-end AND flips the VISUAL rotation sign.
    const faSvg = graphic.querySelector('svg') as SVGSVGElement;
    expect(faSvg.style.transform).toBe('scaleX(-1)');
    // The rotation stays LTR-SIGNED (the mirror does the flipping) —
    // the same number as the en render for the same case.
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    expect(beam.style.transform).toMatch(/rotate\(4deg\)/);
    const faAngle = parseFloat(beam.style.transform.match(/rotate\((-?[\d.]+)deg\)/)![1]!);
    rerender(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const enSvg = document.querySelector('[data-balance-graphic] svg') as SVGSVGElement;
    expect(enSvg.style.transform).toBe('');
    const enAngle = parseFloat(
      (document.querySelector('[data-balance-beam]') as SVGElement).style.transform.match(/rotate\((-?[\d.]+)deg\)/)![1]!,
    );
    expect(faAngle).toBe(enAngle);
    // The overall assessment is the reference board's soft centred box
    // (the conclusion-box translation), centred under the drawing.
    const verdict = document.querySelector('[data-balance-verdict]') as HTMLElement;
    expect(verdict.className).toContain('bg-currena-soft/60');
    expect(verdict.className).toContain('mx-auto');
    // The verdict word speaks in the question voice (the box's focal
    // line) over the count line's label voice.
    const verdictWord = verdict.querySelector('span span') as HTMLElement;
    expect(verdictWord.className).toContain('type-question');
  });

  it('chips are at least 44px tall by class and dashed for unread', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    expect(chip.className).toContain('min-h-[44px]');
    expect(chip.className).toContain('border-dashed');
  });
});

describe('BalanceScale (wide viewport — no width branch exists in v5 either)', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', matchMediaStub(true));
  });

  it('even on a wide viewport the row stays compact (no sentence) and the tap opens the panel', () => {
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    expect(block.textContent).not.toContain('real-yield explanation sentence');
    const panel = document.querySelector('#gold-balance-detail') as HTMLElement;
    expect(panel.hidden).toBe(true);
    fireEvent.click(block);
    expect(panel.hidden).toBe(false);
    expect(block.getAttribute('aria-expanded')).toBe('true');
  });

  it('a tray chip opens the shared detail panel (§8.4, every width)', () => {
    render(<BalanceScale drivers={CASE_D} copy={copy} numberLocale="en-US" />);
    const chip = document.querySelector('[data-balance-chip="dollar"]') as HTMLButtonElement;
    fireEvent.click(chip);
    const panel = document.querySelector('[data-balance-detail]') as HTMLElement;
    expect(panel.hidden).toBe(false);
    expect(panel.getAttribute('data-balance-detail')).toBe('dollar');
    expect(chip.getAttribute('aria-expanded')).toBe('true');
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
    expect(document.querySelector('[data-balance-graphic]')).not.toBeNull();
    expect(screen.getByText('Leaning against gold')).toBeTruthy();
    expect(screen.getByText('The aggregate of factors affecting the price of gold')).toBeTruthy();
    // The retired group headings never render again.
    expect(screen.queryByText('Works against')).toBeNull();
    expect(screen.queryByText('Sitting neutral')).toBeNull();
    // v5: the against column carries the one readable row; the for side
    // shows the evidence-based empty line (no dashed slot anywhere).
    expect(document.querySelector('[data-balance-list="against"] button')).not.toBeNull();
    expect(
      screen.getByText('None of the factors checked shows a meaningful signal supporting gold’s price right now.'),
    ).toBeTruthy();
    expect(document.querySelector('[data-balance-slot]')).toBeNull();
    // The unread drivers sit in the tray, off the beam.
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
