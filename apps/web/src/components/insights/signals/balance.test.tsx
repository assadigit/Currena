/**
 * @vitest-environment jsdom
 *
 * balance.test.tsx — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, 2026-10-17e). Covers:
 *
 *   §4  driver-state mapping (supportive/against/neutral/unknown →
 *       for/against/neutral/unread 1:1 — the model already separates
 *       neutral from unread), total/net/readable arithmetic
 *   §6  the tilt rule: heavier side down, angle = |net|/total × 14°,
 *       the 3° floor, unread drivers pulling toward level, level at
 *       net 0 and at readable 0, the drop cap keeping beam ends and
 *       pans EXACTLY coupled, the RTL sign flip
 *   §5.1/§12.1  the verdict word + the " · "-joined count line (zero
 *       parts omitted) and the role="img" aria label
 *   §7  blocks are real buttons with aria-expanded, the wide-screen
 *       inline sentence, one open detail panel at a time, second tap
 *       closes
 *   §8  trays: neutral quiet chips vs unread dashed chips with the
 *       clock icon, empty trays hidden, chips open the same panel
 *   §9  (integration) the merged card renders the balance between the
 *       outlook strip and the divider-separated price footing strip;
 *       the retired group headings are gone
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey, SignalConditionState, SignalReading } from '@currena/insights';
import {
  BALANCE_DROP_CAP_PX,
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
  });
});

/* ------------------------------------------------------------------ *
 * §6 — the tilt rule
 * ------------------------------------------------------------------ */

describe('§6 beam tilt', () => {
  it('case A (1 against, 3 unread): against side down at the floored ratio angle', () => {
    const tilt = balanceTilt(countsOf(CASE_A), 170);
    expect(tilt.heavy).toBe('against');
    expect(tilt.angleDeg).toBeCloseTo(3.5, 6); // |−1|/4 × 14°
    expect(tilt.dropPx).toBeCloseTo(Math.sin((3.5 * Math.PI) / 180) * 170, 6);
  });

  it('case B (2 for, 2 against): level', () => {
    const tilt = balanceTilt(countsOf(CASE_B), 170);
    expect(tilt.heavy).toBeNull();
    expect(tilt.angleDeg).toBe(0);
    expect(tilt.dropPx).toBe(0);
  });

  it('case C (3 for, 1 neutral): for side down (raw formula on a short beam)', () => {
    const tilt = balanceTilt(countsOf(CASE_C), 100);
    expect(tilt.heavy).toBe('for');
    expect(tilt.angleDeg).toBeCloseTo(10.5, 6); // 3/4 × 14°, uncapped
    expect(tilt.dropPx).toBeCloseTo(Math.sin((10.5 * Math.PI) / 180) * 100, 6);
  });

  it('case D (4 unread): readable 0 → level', () => {
    const tilt = balanceTilt(countsOf(CASE_D), 170);
    expect(tilt.heavy).toBeNull();
    expect(tilt.angleDeg).toBe(0);
  });

  it('case E (4 against): the full 14° when the beam is short', () => {
    const tilt = balanceTilt(countsOf(CASE_E), 100);
    expect(tilt.heavy).toBe('against');
    expect(tilt.angleDeg).toBeCloseTo(14, 6);
  });

  it('bounds the swing with the drop cap (the angle is re-derived from the capped drop)', () => {
    // At a 170px half-beam the raw 14° swing (41px) exceeds the 30px cap.
    const tilt = balanceTilt(countsOf(CASE_E), 170);
    expect(tilt.heavy).toBe('against');
    expect(tilt.dropPx).toBeCloseTo(BALANCE_DROP_CAP_PX, 6);
    expect(Math.sin((tilt.angleDeg * Math.PI) / 180) * 170).toBeCloseTo(tilt.dropPx, 6);
  });

  it('caps the PAN DROP and re-derives the angle so the pans follow the beam ends exactly', () => {
    const tilt = balanceTilt(countsOf(CASE_E), 360); // a wide beam
    expect(tilt.dropPx).toBe(BALANCE_DROP_CAP_PX);
    const back = Math.sin((tilt.angleDeg * Math.PI) / 180) * 360;
    expect(back).toBeCloseTo(tilt.dropPx, 6);
  });

  it('never dips below the 3° floor when net ≠ 0 (a one-driver lean stays visible)', () => {
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
    const tilt = balanceTilt(countsOf(oneOfMany), 170);
    expect(tilt.angleDeg).toBeGreaterThanOrEqual(3);
  });

  it('a zero half-beam stays level (measured-width fallbacks never fabricate a tilt)', () => {
    expect(balanceTilt(countsOf(CASE_A), 0)).toEqual({ angleDeg: 0, dropPx: 0, heavy: null });
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
  });

  it('joins the non-zero parts with " · " and omits zeros', () => {
    expect(countLineParts(countsOf(CASE_A), copy, 'en-US')).toEqual(['1 against', "3 couldn't be read"]);
    expect(countLineParts(countsOf(CASE_B), copy, 'en-US')).toEqual(['2 for', '2 against']);
    expect(countLineParts(countsOf(CASE_D), copy, 'en-US')).toEqual(["4 couldn't be read"]);
  });

  it('renders Persian digits in fa', () => {
    expect(countLineParts(countsOf(CASE_A), copyFa, 'fa-IR')).toEqual(['۱ به ضرر', '۳ قابل ارزیابی نیست']);
  });
});

/* ------------------------------------------------------------------ *
 * §7.9 — the second pan column
 * ------------------------------------------------------------------ */

describe('§7.9 pan columns', () => {
  it('stacks up to four blocks in one column, extras go to the second', () => {
    expect(panColumnCounts(3)).toEqual([3, 0]);
    expect(panColumnCounts(4)).toEqual([4, 0]);
    expect(panColumnCounts(5)).toEqual([4, 1]);
    expect(panColumnCounts(7)).toEqual([4, 3]);
  });
});

/* ------------------------------------------------------------------ *
 * §7/§8/§12 — rendered behaviour
 * ------------------------------------------------------------------ */

describe('BalanceScale (rendered, narrow screen)', () => {
  it('case A: the verdict line, the aria label, the trays and the block', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('Leaning against gold')).toBeTruthy();
    expect(screen.getByText('1 against · 3 couldn\'t be read')).toBeTruthy();
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.getAttribute('role')).toBe('img');
    expect(graphic.getAttribute('aria-label')).toBe(
      'Balance for gold: 1 against · 3 couldn\'t be read. Leaning against gold.',
    );
    // The against pan carries the one readable block; the for pan is empty.
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(forPan.querySelectorAll('button').length).toBe(0);
    expect(againstPan.querySelectorAll('button').length).toBe(1);
    expect(screen.getByText('Real yields')).toBeTruthy();
    // Trays: no neutral chips → the neutral tray is absent; 3 unread chips.
    expect(document.querySelector('[data-balance-tray="neutral"]')).toBeNull();
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(3);
    // Blocks are real buttons with aria-expanded and a 44px class floor.
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    expect(block.tagName).toBe('BUTTON');
    expect(block.getAttribute('aria-expanded')).toBe('false');
    expect(block.className).toContain('min-h-[44px]');
  });

  it('a block tap opens its explanation in the panel; a second tap closes it', () => {
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

  it('case B (narrow): both pans carry two blocks and the beam is level', () => {
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('Balanced')).toBeTruthy();
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    expect(forPan.querySelectorAll('button').length).toBe(2);
    expect(againstPan.querySelectorAll('button').length).toBe(2);
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    expect(beam.style.transform).toContain('rotate(0deg)');
  });

  it('case D: the none verdict, everything in the unread tray, nothing on the beam', () => {
    render(<BalanceScale drivers={CASE_D} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText("Can't read the conditions right now")).toBeTruthy();
    expect(document.querySelector('[data-balance-pan="for"] button')).toBeNull();
    expect(document.querySelector('[data-balance-pan="against"] button')).toBeNull();
    const unreadTray = document.querySelector('[data-balance-tray="unread"]') as HTMLElement;
    expect(unreadTray.querySelectorAll('button').length).toBe(4);
  });

  it('renders Persian digits and flips the rotation sign in fa', () => {
    render(<BalanceScale drivers={CASE_A} copy={copyFa} numberLocale="fa-IR" />);
    expect(screen.getByText('تمایل به ضرر طلا')).toBeTruthy();
    expect(screen.getByText('۱ به ضرر · ۳ قابل ارزیابی نیست')).toBeTruthy();
    const graphic = document.querySelector('[data-balance-graphic]') as HTMLElement;
    expect(graphic.getAttribute('aria-label')).toBe('ترازوی طلا: ۱ به ضرر · ۳ قابل ارزیابی نیست. تمایل به ضرر طلا.');
    // LTR leans against → the inline-start end goes down (negative);
    // RTL flips the sign so the heavier side still lowers.
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    expect(beam.style.transform).toMatch(/rotate\(-?3\.5deg\)/);
    cleanup();
    vi.stubGlobal('matchMedia', matchMediaStub(false));
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const enBeam = document.querySelector('[data-balance-beam]') as HTMLElement;
    const faAngle = parseFloat(beam.style.transform.match(/rotate\((-?[\d.]+)deg\)/)![1]!);
    const enAngle = parseFloat(enBeam.style.transform.match(/rotate\((-?[\d.]+)deg\)/)![1]!);
    expect(faAngle).toBe(-enAngle);
  });

  it('chips are at least 44px tall by class and dashed for unread', () => {
    render(<BalanceScale drivers={CASE_A} copy={copy} numberLocale="en-US" />);
    const chip = document.querySelector('[data-balance-chip="stress"]') as HTMLButtonElement;
    expect(chip.className).toContain('min-h-[44px]');
    expect(chip.className).toContain('border-dashed');
  });
});

describe('BalanceScale (rendered, wide screen ≥900px)', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', matchMediaStub(true));
  });

  it('case B: the explanation sentence lives inside the block; no tap needed', () => {
    render(<BalanceScale drivers={CASE_B} copy={copy} numberLocale="en-US" />);
    const block = document.querySelector('[data-balance-block="real-yield"]') as HTMLButtonElement;
    expect(block.textContent).toContain('real-yield explanation sentence');
    expect(block.getAttribute('aria-expanded')).toBe('true');
    const panel = document.querySelector('#gold-balance-detail') as HTMLElement;
    expect(panel.hidden).toBe(true);
    fireEvent.click(block);
    // The sentence is already visible — the tap opens nothing.
    expect(panel.hidden).toBe(true);
    expect(block.getAttribute('aria-expanded')).toBe('true');
  });

  it('a tray chip still opens the shared detail panel (§8.4, every width)', () => {
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
