/**
 * @vitest-environment jsdom
 *
 * balance.test.tsx — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md + the v2 seesaw patch
 * docs/insights/gold-balance-card-v2-seesaw-patch-spec.md). Covers:
 *
 *   §4  driver-state mapping (supportive/against/neutral/unknown →
 *       for/against/neutral/unread 1:1 — the model already separates
 *       neutral from unread), total/net/readable arithmetic
 *   §6  the tilt rule (v1 steps 3–4, kept by v2 §4): heavier side down,
 *       angle = |net|/total × 12° with the 4° floor, unread drivers
 *       pulling toward level, level at net 0 and at readable 0, and the
 *       v2 geometry law: the picture shows NO height difference other
 *       than Lh × sin(angle) (risePx per plate, no v1 drop cap)
 *   §5.1/§12.1  the verdict word + the " · "-joined count line (zero
 *       parts omitted, ≥14px) and the role="img" aria label
 *   §5.2–5.8 (v2)  the seesaw drawing: beam + up-pointing fulcrum + base
 *       + level reference line, level plates that only translate by
 *       risePx and never depend on their block count, compact 56px
 *       blocks with no sentence at any width, dashed aria-hidden empty
 *       slots, the fixed caption row, the reserved stable zone height
 *   §7/§8/§12  blocks are real buttons with aria-expanded opening the
 *       one shared detail panel (every width — v2 §5.5.6), trays: neutral
 *       quiet chips vs unread dashed chips with the clock icon, empty
 *       trays hidden
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
  balanceCounts,
  balanceTilt,
  balanceVerdictOf,
  countLineParts,
  driverStateOf,
  panColumnCounts,
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
    const a = countsOf(CASE_A);
    expect(a).toMatchObject({ for: 0, against: 1, neutral: 0, unread: 3, total: 4, net: -1, readable: 1 });
    const c = countsOf(CASE_C);
    expect(c).toMatchObject({ for: 3, neutral: 1, total: 4, net: 3, readable: 4 });
    const g = countsOf(CASE_G);
    expect(g).toMatchObject({ for: 1, against: 1, unread: 2, total: 4, net: 0, readable: 2 });
  });
});

/* ------------------------------------------------------------------ *
 * §6 / v2 §5.1 — the tilt rule and the seesaw geometry law
 * ------------------------------------------------------------------ */

describe('§6 beam tilt (v1 rule, v2 geometry)', () => {
  it('case A (1 against, 3 unread): against side down at the 4° floor', () => {
    const tilt = balanceTilt(countsOf(CASE_A), 160);
    expect(tilt.heavy).toBe('against');
    expect(tilt.angleDeg).toBeCloseTo(4, 6); // max(4°, |−1|/4 × 12° = 3°)
    expect(tilt.endDropPx).toBeCloseTo(Math.sin((4 * Math.PI) / 180) * 160, 6);
    expect(tilt.risePx).toBeCloseTo(tilt.endDropPx / 2, 6);
  });

  it('case B (2 for, 2 against): level', () => {
    const tilt = balanceTilt(countsOf(CASE_B), 160);
    expect(tilt.heavy).toBeNull();
    expect(tilt.angleDeg).toBe(0);
    expect(tilt.risePx).toBe(0);
    expect(tilt.endDropPx).toBe(0);
  });

  it('case C (3 for, 1 neutral): for side down at 9°', () => {
    const tilt = balanceTilt(countsOf(CASE_C), 160);
    expect(tilt.heavy).toBe('for');
    expect(tilt.angleDeg).toBeCloseTo(9, 6); // 3/4 × 12°
    expect(tilt.endDropPx).toBeCloseTo(Math.sin((9 * Math.PI) / 180) * 160, 6);
  });

  it('case D (4 unread): readable 0 → level', () => {
    const tilt = balanceTilt(countsOf(CASE_D), 160);
    expect(tilt.heavy).toBeNull();
    expect(tilt.angleDeg).toBe(0);
  });

  it('case G (1 for, 1 against, 2 unread): net 0 → level', () => {
    const tilt = balanceTilt(countsOf(CASE_G), 160);
    expect(tilt.heavy).toBeNull();
    expect(tilt.angleDeg).toBe(0);
  });

  it('case E (4 against): the full 12°', () => {
    const tilt = balanceTilt(countsOf(CASE_E), 160);
    expect(tilt.heavy).toBe('against');
    expect(tilt.angleDeg).toBeCloseTo(12, 6);
  });

  it('the picture shows no height difference other than Lh × sin(angle) — the v1 drop cap is retired (v2 §5.1)', () => {
    // On a long hinge distance the raw angle now survives: Lh is bounded
    // by the ~520px zone, so the swing is modest by construction.
    const tilt = balanceTilt(countsOf(CASE_E), 490);
    expect(tilt.endDropPx).toBeCloseTo(Math.sin((12 * Math.PI) / 180) * 490, 6);
    expect(tilt.risePx).toBeCloseTo(tilt.endDropPx / 2, 6);
    expect(tilt.angleDeg).toBeCloseTo(12, 6);
  });

  it('never dips below the 4° floor when net ≠ 0 (a one-driver lean stays visible)', () => {
    const oneOfMany: BalanceDriver[] = [
      d('a', 'for'),
      d('b', 'unread'),
      d('c', 'unread'),
      d('d', 'unread'),
      d('e', 'unread'),
      d('f', 'unread'),
      d('g', 'unread'),
      d('h', 'unread'),
      d('i', 'unread'),
      d('j', 'unread'),
    ];
    const tilt = balanceTilt(countsOf(oneOfMany), 160);
    expect(tilt.angleDeg).toBeGreaterThanOrEqual(4);
  });

  it('a zero Lh stays level (measured-width fallbacks never fabricate a tilt)', () => {
    expect(balanceTilt(countsOf(CASE_A), 0)).toEqual({ angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null });
  });
});

/* ------------------------------------------------------------------ *
 * §5.1 / §13 — verdict word, count line, aria label
 * ------------------------------------------------------------------ */

describe('§5.1/§13 verdict word and count line', () => {
  it('maps the cases to the verdict words', () => {
    expect(balanceVerdictOf(countsOf(CASE_A))).toBe('against');
    expect(balanceVerdictOf(countsOf(CASE_B))).toBe('balanced');
    expect(balanceVerdictOf(countsOf(CASE_C))).toBe('for');
    expect(balanceVerdictOf(countsOf(CASE_D))).toBe('none');
    expect(balanceVerdictOf(countsOf(CASE_E))).toBe('against');
    expect(balanceVerdictOf(countsOf(CASE_G))).toBe('balanced');
  });

  it('joins the non-zero parts with " · " and omits zeros', () => {
    expect(countLineParts(countsOf(CASE_A), copy, 'en-US')).toEqual(['1 against', "3 couldn't be read"]);
    expect(countLineParts(countsOf(CASE_B), copy, 'en-US')).toEqual(['2 for', '2 against']);
    expect(countLineParts(countsOf(CASE_D), copy, 'en-US')).toEqual(["4 couldn't be read"]);
    expect(countLineParts(countsOf(CASE_G), copy, 'en-US')).toEqual(['1 for', '1 against', "2 couldn't be read"]);
  });

  it('renders Persian digits in fa', () => {
    expect(countLineParts(countsOf(CASE_A), copyFa, 'fa-IR')).toEqual(['۱ به ضرر', '۳ قابل ارزیابی نیست']);
  });
});

/* ------------------------------------------------------------------ *
 * v1 §7.9 — the second plate column
 * ------------------------------------------------------------------ */

describe('§7.9 plate columns', () => {
  it('stacks up to four blocks in one column, extras go to the second', () => {
    expect(panColumnCounts(3)).toEqual([3, 0]);
    expect(panColumnCounts(4)).toEqual([4, 0]);
    expect(panColumnCounts(5)).toEqual([4, 1]);
    expect(panColumnCounts(7)).toEqual([4, 3]);
  });
});

/* ------------------------------------------------------------------ *
 * v2 §5 — the rendered seesaw
 * ------------------------------------------------------------------ */

describe('BalanceScale (rendered seesaw)', () => {
  it('case A: verdict + count line + aria label + seesaw parts + trays + block + empty slot', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('Leaning against gold')).toBeTruthy();
    const count = document.querySelector('[data-balance-count]') as HTMLElement;
    expect(count.textContent).toBe("1 against · 3 couldn't be read");
    // v2 §6.2: the count line is label-sized (≥14px) in the secondary ink.
    expect(count.className).toContain('text-[length:var(--type-label)]');
    expect(count.className).toContain('text-[var(--color-text-secondary)]');
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.getAttribute('role')).toBe('img');
    expect(graphic.getAttribute('aria-label')).toBe(
      'Balance for gold: 1 against · 3 couldn\'t be read. Leaning against gold.',
    );
    // The seesaw parts all exist: beam, up-pointing fulcrum, base, level
    // reference line (v2 §5.1–5.3).
    expect(document.querySelector('[data-balance-beam]')).not.toBeNull();
    expect(document.querySelector('[data-balance-fulcrum]')).not.toBeNull();
    expect(document.querySelector('[data-balance-base]')).not.toBeNull();
    expect(document.querySelector('[data-balance-reference]')).not.toBeNull();
    // The against plate carries the one readable block; the for plate is
    // EMPTY and shows the dashed slot (v2 §5.6).
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(forPan.querySelectorAll('button').length).toBe(0);
    expect(againstPan.querySelectorAll('button').length).toBe(1);
    const slot = forPan.querySelector('[data-balance-slot="for"]') as HTMLElement;
    expect(slot).not.toBeNull();
    expect(slot.getAttribute('aria-hidden')).toBe('true');
    expect(slot.textContent).toBe('');
    expect(againstPan.querySelector('[data-balance-slot]')).toBeNull();
    expect(screen.getByText('Real yields')).toBeTruthy();
    // Trays: no neutral chips → the neutral tray is absent; 3 unread chips.
    expect(document.querySelector('[data-balance-tray="neutral"]')).toBeNull();
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(3);
    // Blocks are real buttons with aria-expanded and the fixed 56px size.
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    expect(block.tagName).toBe('BUTTON');
    expect(block.getAttribute('aria-expanded')).toBe('false');
    expect(block.className).toContain('h-[56px]');
    // v2 §5.5.1: NO sentence inside a block at any width.
    expect(block.textContent).not.toContain('explanation sentence');
  });

  it('case A: the heavy plate moved DOWN by risePx, the light one UP by it — 2 × rise = Lh × sin(angle)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    // jsdom fallback zone width 340 → blockW 158 → lh 182; angle 4°.
    const endDrop = Math.sin((4 * Math.PI) / 180) * 182;
    const rise = endDrop / 2;
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(forPan.style.transform).toBe(`translateY(${-rise}px)`);
    expect(againstPan.style.transform).toBe(`translateY(${rise}px)`);
    // The beam rotates by the floored angle — the heavy (against,
    // inline-end) end goes down: clockwise = +4° in LTR. The fulcrum
    // does not move.
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    expect(beam.style.transform).toMatch(/rotate\(4deg\)/);
    expect((document.querySelector('[data-balance-fulcrum]') as HTMLElement).style.transform).toBe('');
  });

  it('a block tap opens its explanation in the panel; a second tap closes it (v2: every width)', () => {
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

  it('one panel at a time: opening a chip closes the block\'s panel', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    fireEvent.click(block);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    fireEvent.click(chip);
    const panel = document.querySelector('[data-balance-detail]') as HTMLElement;
    expect(panel.getAttribute('data-balance-detail')).toBe('stress');
    expect(block.getAttribute('aria-expanded')).toBe('false');
  });

  it('case B (2 for, 2 against): both plates carry two blocks, the beam is level, the plates unmoved', () => {
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('Balanced')).toBeTruthy();
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(forPan.querySelectorAll('button').length).toBe(2);
    expect(againstPan.querySelectorAll('button').length).toBe(2);
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    expect(beam.style.transform).toContain('rotate(0deg)');
    expect(forPan.style.transform).toBe('translateY(0px)');
    expect(againstPan.style.transform).toBe('translateY(0px)');
  });

  it('case G (1 for, 1 against, 2 unread): level beam, both plates carry one block (V2 stack independence)', () => {
    render(<BalanceScale drivers={CASE_G} copy={copy} numberLocale="en-US" />);
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(forPan.querySelectorAll('button').length).toBe(1);
    expect(againstPan.querySelectorAll('button').length).toBe(1);
    expect(forPan.style.transform).toBe('translateY(0px)');
    expect(againstPan.style.transform).toBe('translateY(0px)');
  });

  it('case D: the none verdict, everything in the unread tray, dashed slots on BOTH plates', () => {
    render(<BalanceScale drivers={CASE_D} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText("Can't read the conditions right now")).toBeTruthy();
    expect(document.querySelector('[data-balance-pan="for"] button')).toBeNull();
    expect(document.querySelector('[data-balance-pan="against"] button')).toBeNull();
    expect(document.querySelector('[data-balance-slot="for"]')).not.toBeNull();
    expect(document.querySelector('[data-balance-slot="against"]')).not.toBeNull();
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(4);
  });

  it('the zone height is reserved from the larger stack and stable across same-stack cases (v2 §5.8, V9)', () => {
    const zoneHeightOf = (drivers: BalanceDriver[]): string => {
      render(<BalanceScale drivers={drivers} copy={copy} numberLocale="en-US" />);
      const zone = document.querySelector('[data-balance-zone]') as HTMLElement;
      const height = zone.style.height;
      cleanup();
      return height;
    };
    // Case A (0 for, 1 against) and case G (1 for, 1 against): the same
    // larger stack (1 row) → the SAME zone height, although A tilts and
    // G sits level.
    expect(zoneHeightOf(CASE_A)).toBe(zoneHeightOf(CASE_G));
    // A bigger stack reserves a taller zone.
    expect(parseFloat(zoneHeightOf(CASE_E))).toBeGreaterThan(parseFloat(zoneHeightOf(CASE_B)));
  });

  it('the fixed caption row carries both side captions with their icons (v2 §5.7)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const captions = document.querySelector('[data-balance-captions]') as HTMLElement;
    expect(captions.className).toContain('grid-cols-2');
    expect(captions.textContent).toContain('For gold');
    expect(captions.textContent).toContain('Against gold');
    // The captions are NOT inside the tilted plates — a separate row.
    expect(document.querySelector('[data-balance-pan="for"]')!.contains(captions)).toBe(false);
  });

  it('the order is verdict → count → banner → zone → captions → panel → trays (v2 §5)', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" banner={<p>banner sentence</p>} />);
    const root = document.querySelector('[data-balance]') as HTMLElement;
    const orderOf = (el: Element | null): number => {
      expect(el).not.toBeNull();
      return Array.prototype.indexOf.call(root.querySelectorAll('[data-balance-verdict], [data-balance-count], p, [data-balance-zone], [data-balance-captions], #gold-balance-detail, [data-balance-tray]'), el);
    };
    const seq = [
      orderOf(document.querySelector('[data-balance-verdict]')),
      orderOf(document.querySelector('[data-balance-count]')),
      orderOf(root.querySelector('p')),
      orderOf(document.querySelector('[data-balance-zone]')),
      orderOf(document.querySelector('[data-balance-captions]')),
      orderOf(document.querySelector('#gold-balance-detail')),
      orderOf(document.querySelector('[data-balance-tray="unread"]')),
    ];
    const sorted = [...seq].sort((a, b) => a - b);
    expect(seq).toEqual(sorted);
    expect(new Set(seq).size).toBe(seq.length);
  });

  it('renders Persian digits, flips the rotation sign in fa, keeps the plates side-agnostic', () => {
    render(<BalanceScale drivers={CASE_A} copy={copyFa} numberLocale="fa-IR" />);
    expect(screen.getByText('تمایل به ضرر طلا')).toBeTruthy();
    expect(screen.getByText('۱ به ضرر · ۳ قابل ارزیابی نیست')).toBeTruthy();
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.getAttribute('aria-label')).toBe('ترازوی طلا: ۱ به ضرر · ۳ قابل ارزیابی نیست. تمایل به ضرر طلا.');
    // LTR leans against → the inline-start end goes down (negative);
    // RTL flips the sign so the heavier side still lowers.
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    expect(beam.style.transform).toMatch(/rotate\(-?4deg\)/);
    cleanup();
    vi.stubGlobal('matchMedia', matchMediaStub(false));
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const enBeam = document.querySelector('[data-balance-beam]') as HTMLElement;
    const faAngle = parseFloat(beam.style.transform.match(/rotate\((-?[\d.]+)deg\)/)![1]!);
    const enAngle = parseFloat(enBeam.style.transform.match(/rotate\((-?[\d.]+)deg\)/)![1]!);
    expect(faAngle).toBe(-enAngle);
    // The heavy plate moves DOWN in both languages (the heavy side is
    // side-agnostic — only the rotation sign flips).
    const faAgainst = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(faAgainst.style.transform).toMatch(/translateY\((?!-)[\d.]+px\)/);
  });

  it('chips are at least 44px tall by class and dashed for unread', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    expect(chip.className).toContain('min-h-[44px]');
    expect(chip.className).toContain('border-dashed');
  });
});

describe('BalanceScale (wide viewport — v2 §5.5.1/§5.5.6: no width branch any more)', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', matchMediaStub(true));
  });

  it('even on a wide viewport the block stays compact (no sentence) and the tap opens the panel', () => {
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
  };
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
    // The retired group headings never render again.
    expect(screen.queryByText('Works against')).toBeNull();
    expect(screen.queryByText('Sitting neutral')).toBeNull();
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
