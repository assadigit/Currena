/**
 * @vitest-environment jsdom
 *
 * balance-card.test.tsx — the gold/silver balance card (owner spec
 * docs/insights/gold-card/, "Balance Rework"): one template per asset
 * behind the Gold | Silver segmented control; verdict first; hairline
 * beam (level below 75% coverage); ghost chips for unread drivers; price
 * as CONTEXT, never a weight; factor rows in the fixed order; the flip
 * line only when the existing config defines a threshold.
 *
 * The pure rules (computeLean) are pinned in
 * packages/insights/src/lean.test.ts (the reference vectors). Here the
 * card is exercised through hand-built SignalReadings + readings the way
 * Signals.tsx feeds it — the evaluator itself is covered by the insights
 * package's own tests.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey, SignalConditionReading, SignalConditionState, SignalReading } from '@currena/insights';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';
import { BalanceCard } from './BalanceCard';
import { beamGeometry, buildBalanceFactors, cardMeta, FLIP_THRESHOLDS, orderFactors } from './balance-card-model';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const NOW = Date.parse('2026-10-27T12:00:00Z');

const reading = (id: IndicatorId, fields: Partial<IndicatorReading> = {}): IndicatorReading => ({
  id,
  value: 1,
  asOf: '2026-10-24',
  status: 'normal',
  sourceName: `src-${id}`,
  updatedAt: '2026-10-27T11:48:00Z',
  ...fields,
});

const DRIVER_INPUTS: Record<string, IndicatorId[]> = {
  'real-yield': ['real-yield-10y'],
  expectations: ['breakeven-5y5y'],
  stress: ['stress-stlfsi', 'nfci'],
  dollar: ['dollar-basket'],
  industrial: ['china-pmi', 'copper-gold'],
};

const signal = (metal: 'gold' | 'silver', states: Partial<Record<string, SignalConditionState>>): SignalReading => ({
  metal,
  priceId: metal === 'gold' ? 'gold-usd' : 'silver-usd',
  conditions: (Object.keys(DRIVER_INPUTS) as (keyof typeof DRIVER_INPUTS)[])
    .filter((key) => metal === 'silver' || key !== 'industrial')
    .map((key) => ({ key, state: states[key] ?? 'unknown', inputs: DRIVER_INPUTS[key]! }) as SignalConditionReading),
  metCount: 0,
  lean: null,
  position: null,
  speed: null,
});

/** A live-like reading set: readable drivers + the two price rows. */
const liveReadings = (): IndicatorReading[] => [
  reading('real-yield-10y', { value: 2.78, percentile10y: 0.88 }),
  reading('breakeven-5y5y', { value: 2.31, percentile10y: 0.7 }),
  reading('stress-stlfsi', { value: -0.42, percentile10y: 0.4 }),
  reading('nfci', { value: -0.05 }),
  reading('dollar-basket', { value: 104.2, percentile10y: 0.6 }),
  reading('china-pmi', { value: 51.2, percentile10y: 0.5 }),
  reading('copper-gold', { value: 0.00019 }),
  reading('gold-usd', { value: 4166, percentile10y: 0.94, change30d: -5.31 }),
  reading('silver-usd', { value: 57.12, percentile10y: 0.96, change30d: -12.76 }),
];

function renderCard(
  states: Partial<Record<string, SignalConditionState>>,
  opts: { fa?: boolean; silverStates?: Partial<Record<string, SignalConditionState>>; readings?: IndicatorReading[] } = {},
) {
  const gold = signal('gold', states);
  const silver = signal('silver', opts.silverStates ?? states);
  return render(
    <BalanceCard
      gold={gold}
      silver={silver}
      readings={opts.readings ?? liveReadings()}
      copy={opts.fa ? insightsCopyFa : insightsCopyEn}
      numberLocale={opts.fa ? 'fa-IR' : 'en-US'}
      now={NOW}
    />,
  );
}

const q = (selector: string): HTMLElement => document.querySelector(selector) as HTMLElement;
const qa = (selector: string): Element[] => [...document.querySelectorAll(selector)];
const cardRoot = (): HTMLElement => q('[data-gc-card]');
const beam = (): HTMLElement => q('[data-gc-beam]');
const rows = (): HTMLDetailsElement[] => qa('details[data-gc-row]') as HTMLDetailsElement[];

beforeAll(() => {
  // jsdom has no scrollIntoView — the chip handler calls it.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(cleanup);

/* ------------------------------------------------------------------ *
 * B. Structure — the fixed order: header, verdict, beam, bands, price
 *    context, rows, flip line, footnote
 * ------------------------------------------------------------------ */

describe('structure (acceptance B)', () => {
  it('renders the anatomy in the spec order', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    const order = qa(
      '[data-gc-seg], .gc-verdict, [data-gc-beam], .gc-bands, [data-gc-ctx], details[data-gc-row], [data-gc-flip], .gc-foot',
    ).map((el) => {
      if (el.hasAttribute('data-gc-seg')) return 'header';
      if (el.classList.contains('gc-verdict')) return 'verdict';
      if (el.hasAttribute('data-gc-beam')) return 'beam';
      if (el.classList.contains('gc-bands')) return 'bands';
      if (el.hasAttribute('data-gc-ctx')) return 'price';
      if (el.tagName === 'DETAILS') return 'row';
      if (el.hasAttribute('data-gc-flip')) return 'flip';
      return 'footnote';
    });
    expect(order).toEqual(['header', 'verdict', 'beam', 'bands', 'price', 'row', 'row', 'row', 'row', 'footnote']);
  });

  it('renders the bands between beam and price when unread/neutral factors exist', () => {
    renderCard({ 'real-yield': 'against', expectations: 'neutral' }); // stress + dollar unread
    const order = qa('[data-gc-beam], .gc-bands, [data-gc-ctx]').map((el) =>
      el.hasAttribute('data-gc-beam') ? 'beam' : el.classList.contains('gc-bands') ? 'bands' : 'price',
    );
    expect(order).toEqual(['beam', 'bands', 'price']);
  });

  it('shows the verdict as the card’s h3 inside aria-labelledby, with the confidence subline', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    const h3 = screen.getByRole('heading', { level: 3 });
    expect(h3.textContent).toBe('Leaning against gold');
    expect(screen.getByText('High confidence · 4 of 4 factors read')).toBeTruthy();
    expect(cardRoot().getAttribute('aria-labelledby')).toBe(h3.id);
  });

  it('renders the beam as role=img with a data-built title + desc', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    expect(beam().getAttribute('role')).toBe('img');
    const title = beam().querySelector('title')!.textContent!;
    expect(title).toContain('0 supporting');
    expect(title).toContain('2 pressuring');
    expect(title).toContain('0 not read');
    expect(title).toContain('Tilts toward pressuring.');
    expect(beam().querySelector('desc')!.textContent).toBe('Tilts toward pressuring.');
  });

  it('shows the updated meta line (newest reading ago · distinct sources)', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    // newest updatedAt = 11:48Z, NOW = 12:00Z → "12 minutes ago"; distinct
    // source names: 5 driver inputs + the gold price = 6.
    expect(screen.getByText('Updated 12 minutes ago · 6 sources')).toBeTruthy();
  });

  it('the mobile lists exist for the <520px container query (names + values)', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    const mob = q('[data-gc-mob]');
    expect(mob.querySelectorAll(':scope > div')).toHaveLength(2);
    expect(mob.textContent).toContain('Supporting · 0');
    expect(mob.textContent).toContain('Pressuring · 2');
    expect(mob.textContent).toContain('Real yields');
    expect(mob.textContent).toContain('↘ 2.78%');
  });
});

/* ------------------------------------------------------------------ *
 * The beam — tilt rules, coverage rule, geometry, RTL
 * ------------------------------------------------------------------ */

describe('beam (spec 02 geometry + spec 03 rules)', () => {
  it('tilts toward the heavier side and carries the tilt as data', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    expect(beam().getAttribute('data-gc-tilt')).toBe('4.5'); // net 2 → 3 + 1.5
    // Heavier-side tokens ride DOWN by dy (≈ 240·sin 4.5° = 18.83).
    const styles = qa('.gc-tok').map((t) => t.getAttribute('style') ?? '');
    expect(styles[0]).toContain('--gc-dy: 18.83'); // pressures (heavier) down
  });

  it('stays LEVEL below the 75% coverage rule and says so in the verdict', () => {
    renderCard({ expectations: 'neutral' }); // 1 of 4 read
    expect(beam().getAttribute('data-gc-tilt')).toBe('0');
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Not enough readings to call');
    expect(screen.getByText('Low confidence · 1 of 4 factors read')).toBeTruthy();
  });

  it('the nothing-readable state: verdict none, no subline, both ends empty', () => {
    renderCard({});
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('No readings available right now');
    expect(screen.queryByText(/factors read/)).toBeNull();
    const empties = beam().querySelectorAll('text.gc-none');
    expect(empties).toHaveLength(2);
    expect(empties[0]!.textContent).toBe('None right now');
  });

  it('balanced: level beam, balanced verdict, no flip line', () => {
    renderCard({ 'real-yield': 'against', expectations: 'supportive', stress: 'neutral', dollar: 'neutral' });
    expect(beam().getAttribute('data-gc-tilt')).toBe('0');
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Balanced for gold');
    expect(qa('[data-gc-flip]')).toHaveLength(0);
  });

  it('caps the tilt at 7° and mirrors both the ends and the rotation in RTL', () => {
    const { rerender } = renderCard({
      'real-yield': 'against',
      dollar: 'against',
      stress: 'against',
      expectations: 'against',
    });
    expect(beam().getAttribute('data-gc-tilt')).toBe('7'); // net 4 → capped

    rerender(
      <BalanceCard
        gold={signal('gold', { 'real-yield': 'against', dollar: 'against', stress: 'against', expectations: 'against' })}
        silver={signal('silver', { 'real-yield': 'against', dollar: 'against', stress: 'against', expectations: 'against' })}
        readings={liveReadings()}
        copy={insightsCopyFa}
        numberLocale="fa-IR"
        now={NOW}
      />,
    );
    // RTL: supports end sits at CX + HALF, and the rotation flips sign.
    const beamGroup = beam().querySelector('g.gc-beam')! as SVGGElement;
    expect(beamGroup.getAttribute('style') ?? '').toContain('--gc-rot: -7deg');
    const supportsCircle = beam().querySelectorAll('circle')[0]!;
    expect(supportsCircle.getAttribute('cx')).toBe(String(340 + 240));
  });

  it('beamGeometry: tokens stack upward from the beam end; height reserves the stack', () => {
    const g = beamGeometry(2, 0, 3, 1);
    expect(g.tokenY(0)).toBe(g.beamY - 10 - 44);
    expect(g.tokenY(1)).toBe(g.tokenY(0) - 50);
    expect(g.height).toBe(g.beamY + 72);
    expect(g.dy).toBeCloseTo(240 * Math.sin((3 * Math.PI) / 180), 5);
  });
});

/* ------------------------------------------------------------------ *
 * B. Price is not a weight (never counted, never a "Works against" row)
 * ------------------------------------------------------------------ */

describe('price context (acceptance B)', () => {
  it('shows price + phrase + 30-day change + range bar, labelled context-not-a-weight', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    expect(screen.getByText('What gold is doing · context, not a weight')).toBeTruthy();
    const priceLine = q('.gc-ctx-price');
    expect(priceLine.textContent).toContain('US$4,166');
    expect(priceLine.textContent).toContain('near its 10-year high but fading');
    expect(priceLine.textContent).toContain('−5.31% in 30 days');
    const labels = q('.gc-bar-labels');
    expect(labels.textContent).toBe('10-yr lowhigh');
    // The marker sits at the 94th percent of the range.
    const marker = q('[data-gc-ctx] .gc-bar i');
    expect(marker.getAttribute('style')).toContain('inset-inline-start: 94%');
  });

  it('footing is NEVER a factor row and the price line carries no state colour', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    const keys = rows().map((r) => r.getAttribute('data-gc-row'));
    expect(keys).not.toContain('footing');
    expect(keys).toEqual(['real-yield', 'dollar', 'expectations', 'stress']); // P, S, N order
    expect(q('[data-gc-ctx]').querySelector('.gc-s-pressures, .gc-s-supports')).toBeNull();
    expect(q('[data-gc-ctx]').textContent).not.toContain('Works against');
  });

  it('hides the section entirely when the price reading is unreadable', () => {
    const noPrice = liveReadings().map((r) =>
      r.id === 'gold-usd' ? { ...r, value: null, asOf: null, status: 'unavailable' as const } : r,
    );
    renderCard({ 'real-yield': 'against' }, { readings: noPrice });
    expect(qa('[data-gc-ctx]')).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * D. Unread drivers are never hidden (ghost chips + rows)
 * ------------------------------------------------------------------ */

describe('neutral + unread bands (acceptance B)', () => {
  it('unread drivers render as dashed ghost chips AND always keep a row', () => {
    renderCard({ 'real-yield': 'against', expectations: 'neutral' }); // stress + dollar unread
    const chips = qa('[data-gc-chip]');
    expect(chips).toHaveLength(3); // 1 neutral chip + 2 dashed unread chips
    const unreadChips = chips.filter((c) => c.className.includes('gc-chip u'));
    expect(unreadChips.map((c) => c.getAttribute('data-gc-chip'))).toEqual(['stress', 'dollar']);
    expect(screen.getByText('Couldn’t read · 2')).toBeTruthy();
    const keys = rows().map((r) => r.getAttribute('data-gc-row'));
    expect(keys).toContain('stress');
    expect(keys).toContain('dollar');
  });

  it('neutral drivers render as solid chips on the tint', () => {
    renderCard({ 'real-yield': 'against', expectations: 'neutral', stress: 'neutral', dollar: 'against' });
    const chip = q('[data-gc-chip="expectations"]');
    expect(chip.className).toContain('gc-chip n');
    expect(screen.getByText('Neutral · 2')).toBeTruthy();
  });

  it('an unread row states its reason and the last known value when one exists', () => {
    const stale = liveReadings().map((r) =>
      r.id === 'stress-stlfsi' ? { ...r, status: 'stale' as const, asOf: '2026-10-20' } : r,
    );
    renderCard({ 'real-yield': 'against', expectations: 'neutral', stress: 'unknown' }, { readings: stale });
    expect(screen.getByText('couldn’t read, last data 7 days ago')).toBeTruthy();
    // Stale readings keep their last good value → "Last known: -0.42".
    const stressRow = rows().find((r) => r.getAttribute('data-gc-row') === 'stress')!;
    expect(stressRow.textContent).toContain('Last known:');
    expect(stressRow.textContent).toContain('-0.42');
  });

  it('a missing reading says "not available yet"', () => {
    const noDollar = liveReadings().filter((r) => r.id !== 'dollar-basket');
    renderCard(
      { 'real-yield': 'against', expectations: 'neutral', stress: 'unknown', dollar: 'unknown' },
      { readings: noDollar },
    );
    const dollarRow = rows().find((r) => r.getAttribute('data-gc-row') === 'dollar')!;
    expect(dollarRow.textContent).toContain('not available yet');
    expect(dollarRow.textContent).not.toContain('Last known:');
  });

  it('a chip click opens and scrolls to its row', () => {
    renderCard({ 'real-yield': 'against', expectations: 'neutral' });
    fireEvent.click(q('[data-gc-chip="stress"]'));
    const opened = rows().find((r) => r.getAttribute('data-gc-row') === 'stress')!;
    expect(opened.open).toBe(true);
  });

  it('hides a band whose count is zero', () => {
    // P=2 S=2 — no neutral, no unread: both bands hidden.
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'supportive', expectations: 'supportive' });
    expect(qa('.gc-bands')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Balanced for gold');
  });
});

/* ------------------------------------------------------------------ *
 * G. The flip line — only config-defined thresholds, never invented
 * ------------------------------------------------------------------ */

describe('flip line (acceptance B + G)', () => {
  it('hides when the heavier side has no config-defined threshold', () => {
    // Pressures-heavy: real-yield + dollar press, no pressure-side flips.
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' });
    expect(qa('[data-gc-flip]')).toHaveLength(0);
  });

  it('picks the closest threshold on the heavier (supports) side and softens the lean wording', () => {
    // expectations + stress supportive, others neutral → net −2 → lean_for.
    // Closest threshold: expectations (2.31 vs 2.4), not stress (0.42 vs 0).
    renderCard({ expectations: 'supportive', stress: 'supportive', 'real-yield': 'neutral', dollar: 'neutral' });
    const flip = q('[data-gc-flip]');
    expect(flip.textContent).toBe('The lean would soften if Inflation expectations fell below 2.40%');
  });

  it('uses the balance-out wording when one flip levels the beam', () => {
    // Only stress supportive, others neutral → net −1 → slight_for.
    renderCard({ stress: 'supportive', 'real-yield': 'neutral', dollar: 'neutral', expectations: 'neutral' });
    const flip = q('[data-gc-flip]');
    expect(flip.textContent).toContain('This would balance out if');
    expect(flip.textContent).toContain('Market stress');
    expect(flip.textContent).toContain('0'); // the stress threshold (index units)
  });

  it('FLIP_THRESHOLDS carries only the two config-defined thresholds', () => {
    expect(Object.keys(FLIP_THRESHOLDS).sort()).toEqual(['expectations', 'stress']);
  });
});

/* ------------------------------------------------------------------ *
 * A. The Gold | Silver segmented control (keyboard accessible)
 * ------------------------------------------------------------------ */

describe('Gold | Silver control (acceptance B)', () => {
  it('is a tablist with aria-selected and renders 4 gold rows / 5 silver rows', () => {
    renderCard(
      { 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' },
      {
        silverStates: {
          'real-yield': 'against',
          dollar: 'against',
          stress: 'neutral',
          expectations: 'neutral',
          industrial: 'unknown',
        },
      },
    );
    const seg = q('[data-gc-seg]');
    expect(seg.getAttribute('role')).toBe('tablist');
    const tabs = [...seg.querySelectorAll('button')];
    expect(tabs).toHaveLength(2);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');
    expect(rows()).toHaveLength(4); // gold: no industrial row

    fireEvent.click(tabs[1]!);
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(cardRoot().getAttribute('data-gc-asset')).toBe('silver');
    expect(rows()).toHaveLength(5); // silver adds industrial demand
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Leaning against silver');
    // Silver with industrial unread and the other four read IS enough
    // (4 of 5 = the 75% rule).
    expect(screen.getByText('Medium confidence · 4 of 5 factors read')).toBeTruthy();
  });

  it('arrow keys move the selection (roving tabindex)', () => {
    renderCard({ 'real-yield': 'against' });
    const seg = q('[data-gc-seg]');
    const tabs = [...seg.querySelectorAll('button')];
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[1]!.tabIndex).toBe(-1);
    fireEvent.keyDown(seg, { key: 'ArrowRight' });
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(seg, { key: 'ArrowLeft' });
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(seg, { key: 'End' });
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(seg, { key: 'Home' });
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
  });

  it('switching assets replays the beam settle (the svg remounts)', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against' });
    const firstSvg = q('[data-gc-beam]');
    fireEvent.click([...q('[data-gc-seg]').querySelectorAll('button')][1]!);
    const secondSvg = q('[data-gc-beam]');
    expect(secondSvg).not.toBe(firstSvg); // remounted → CSS animation replays
  });
});

/* ------------------------------------------------------------------ *
 * Farsi / RTL rendering
 * ------------------------------------------------------------------ */

describe('Farsi rendering (acceptance C)', () => {
  it('speaks the Farsi corpus with Persian digits and the repo’s terms', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' }, { fa: true });
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('به ضرر طلا');
    expect(screen.getByText('اطمینان بالا · ۴ از ۴ عامل خوانده شد')).toBeTruthy();
    expect(q('[data-gc-flip]') instanceof HTMLElement).toBe(false); // no pressure-side threshold
  });

  it('the unread band uses the repo’s established term with Persian digits', () => {
    renderCard({ 'real-yield': 'against', expectations: 'neutral' }, { fa: true });
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('برای ارزیابی، داده کافی نیست');
    expect(screen.getByText('اطمینان پایین · ۲ از ۴ عامل خوانده شد')).toBeTruthy();
    expect(screen.getByText('قابل ارزیابی نیست · ۲')).toBeTruthy();
  });

  it('the price line keeps its number order and Persian units', () => {
    renderCard({ 'real-yield': 'against', dollar: 'against', stress: 'neutral', expectations: 'neutral' }, { fa: true });
    const priceLine = q('.gc-ctx-price');
    expect(priceLine.textContent).toContain('۴٬۱۶۶');
    expect(priceLine.textContent).toContain('دلار');
    expect(priceLine.textContent).toContain('−۵٫۳۱٪ در ۳۰ روز');
    expect(priceLine.textContent).toContain('نزدیک اوج ۱۰ سال اخیر، اما در حال عقب‌نشینی');
  });

  it('the flip line speaks Farsi with the threshold in Persian digits', () => {
    renderCard({ stress: 'supportive', 'real-yield': 'neutral', dollar: 'neutral', expectations: 'neutral' }, { fa: true });
    const flip = q('[data-gc-flip]');
    expect(flip.textContent).toContain('اگر تنش بازار به زیر');
    expect(flip.textContent).toContain('برسد، شرایط متعادل می‌شود');
  });
});

/* ------------------------------------------------------------------ *
 * The model (pure) — driver mapping, flips, reasons, row order
 * ------------------------------------------------------------------ */

describe('balance-card-model', () => {
  const byId = (): Map<string, IndicatorReading> => new Map(liveReadings().map((r) => [r.id as string, r]));

  it('maps the evaluator states 1:1 and drops footing', () => {
    const gold = signal('gold', {
      'real-yield': 'against',
      expectations: 'supportive',
      stress: 'neutral',
      dollar: 'unknown',
    });
    const factors = buildBalanceFactors(gold, byId(), NOW);
    expect(factors.map((f) => [f.key, f.state])).toEqual([
      ['real-yield', 'pressures'],
      ['expectations', 'supports'],
      ['stress', 'neutral'],
      ['dollar', 'unread'],
    ]);
    expect(buildBalanceFactors(signal('silver', {}), byId(), NOW)).toHaveLength(5);
    expect(buildBalanceFactors(signal('silver', {}), byId(), NOW).map((f) => f.key)).toContain('industrial');
  });

  it('the flip rides only the supports state of its config-defined input', () => {
    const supportive = buildBalanceFactors(signal('gold', { expectations: 'supportive' }), byId(), NOW).find(
      (f) => f.key === 'expectations',
    )!;
    expect(supportive.flip).toEqual({ dir: 'below', at: 2.4 });
    const pressured = buildBalanceFactors(signal('gold', { expectations: 'against' }), byId(), NOW).find(
      (f) => f.key === 'expectations',
    )!;
    expect(pressured.flip).toBeUndefined();
    // Real yields carry no config threshold at all.
    const real = buildBalanceFactors(signal('gold', { 'real-yield': 'supportive' }), byId(), NOW).find(
      (f) => f.key === 'real-yield',
    )!;
    expect(real.flip).toBeUndefined();
  });

  it('unread reasons: missing reading → not_available_yet; unavailable → source_unavailable', () => {
    const missing = buildBalanceFactors(signal('gold', { dollar: 'unknown' }), new Map(), NOW).find(
      (f) => f.key === 'dollar',
    )!;
    expect(missing.unreadReason).toBe('not_available_yet');
    const unavailable = liveReadings().map((r) =>
      r.id === 'dollar-basket' ? { ...r, value: null, asOf: null, status: 'unavailable' as const } : r,
    );
    const unread = buildBalanceFactors(
      signal('gold', { dollar: 'unknown' }),
      new Map(unavailable.map((r) => [r.id as string, r])),
      NOW,
    ).find((f) => f.key === 'dollar')!;
    expect(unread.unreadReason).toBe('source_unavailable');
  });

  it('row order: pressuring, supporting, neutral, unread (spec 01 §F.1)', () => {
    const factors = buildBalanceFactors(
      signal('gold', { 'real-yield': 'against', expectations: 'supportive', stress: 'neutral' }),
      byId(),
      NOW,
    );
    expect(orderFactors(factors).map((f) => f.state)).toEqual(['pressures', 'supports', 'neutral', 'unread']);
  });

  it('cardMeta: newest reading + distinct sources across drivers and price', () => {
    const factors = buildBalanceFactors(signal('gold', {}), byId(), NOW);
    const meta = cardMeta(factors, byId().get('gold-usd')!);
    // All fixtures share one updatedAt; sources = 5 driver inputs + price.
    expect(meta.newestUpdatedAt).toBe('2026-10-27T11:48:00Z');
    expect(meta.sourcesCount).toBe(6);
  });
});
