/**
 * @vitest-environment jsdom
 *
 * signals/gold-balance-lanes.test.tsx — the gold balance consolidation's
 * component tests: the LANE balance behind the ?balance=lanes preview
 * flag — GB-S3's data contract (04-MIGRATION-AND-ACCEPTANCE §4.3)
 * REWRITTEN for GB-S4's P2b visual anatomy (05-VISUAL-DESIGN-SPEC):
 * the brass-beam stage, the lane WEIGHTS with segmented rims, the
 * verdict hero block, the "Not leaning" tray and the four-row LEDGER
 * (the detail-panel CONTENT contract — AC-2: every voter reachable —
 * now rides inside the ledger's inline expansion).
 *
 *   1. lane weights land in the right pan or tray for each side
 *   2. a split lane shows the "Split" badge and the "2 for, 2 against"
 *      line (the badge + the ledger state text)
 *   3. the ledger's open row lists members grouped by impact; steady
 *      voters as one muted sentence; the inflation lane shows the tilt
 *      phrase; the breakeven-5y5y row shows the card status word (B-12)
 *   4. B-12: no member line uses "elevated" unless the card status is
 *      warning (the evidence vocabulary carries no such word)
 *   5. the context pill renders for a known change30d; hidden when missing
 *   6. the measured note + backtest link render without interaction
 *   7. DOM scan: no "tailwind"/"headwind"/"wind" text in the gold card
 *      under the flag, EN and fa (01 §8.3)
 *   9. RTL: the pan sides mirror; the physical angle is direction-free
 *      (data-tilt identical, the heavy side still drops)
 *  11. EN and fa dictionaries cover every new key (placeholders intact)
 *  12. keyboard: a weight opens its ledger row (focus moves + the row
 *      expands); a second activation closes; focus returns
 *  13. without the flag the LEGACY rendering is unchanged (a snapshot of
 *      the legacy markup — the default view stays byte-for-byte today's
 *      until the owner-gated P5/GB-S6 flip)
 *
 * GB-S4 visual pins (05 §12, the jsdom half of V-1..V-10):
 *  · V-1 the verdict word renders in the hero block, keyed by verdict
 *  · V-4 every weight's rim shows one segment per driver, sorted
 *    supports → pressures → steady → unread, matching the engine counts
 *  · V-5 the beam angle, needle and verdict follow the unchanged
 *    formula (pure geometry: balanceVisualFrame/balanceVisualTicks)
 *  · V-8 the weights/rows are real buttons with aria-expanded + labels
 *  · V-9 reduced motion: the first paint already carries the final angle
 *  · 05 §8 the loading skeleton renders when no driver is passed
 *
 * Fixtures: the RECORDED 2026-10-31 corpus archive (the recipe verified
 * three times — GB-S1 + GB-S2 + GB-S3: sourceName "archive 2026-10-31",
 * updatedAt the archive's generatedAt) reproduces 01 §7 exactly —
 * LEVEL · 4 neutral · borrowing-costs split 2v2 (readable 8, firing 4) ·
 * dollar 1 firing · stress readable-5/firing-0 · inflation 1 firing —
 * and a synthetic one-sided case drives the pans. Conventions follow
 * balance.test.tsx / gold-panels.test.tsx.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { GOLD_LANES, goldBalance, type GoldBalanceMember, type SignalReading } from '@currena/insights';
import { evaluateSignal } from '@currena/insights';
import { MergedSignalsCard, useBalanceLanesPreview } from './MergedCard';
import {
  BalanceScale,
  BALANCE_LH_PX,
  balanceCounts,
  balanceTilt,
  balanceVisualFrame,
  balanceVisualGeometry,
  balanceVisualSizeOfWidth,
  balanceVisualTicks,
  type BalanceDriver,
} from './BalanceScale';
import { balanceRimSegments } from './BalanceWeight';
import { formatChange } from '../config';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';

const copy = insightsCopyEn;
const copyFa = insightsCopyFa;

/** The lane model's measured record — the balance's measured-note link
 * target (03 §6.2: the note describes the lane balance's association, so
 * the link points at the lane report). */
const GOLD_BALANCE_BACKTEST_URL =
  'https://github.com/assadigit/Currena/blob/main/docs/insights/BACKTEST-GOLD-LANES.md';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

/** The corpus's recorded 2026-10-31 archive, as the page-shaped readings
 * (the fixture recipe from GB-S2's prompt, verified three times). The
 * jsdom environment serves http module URLs, so the fixture resolves
 * from the process cwd (vitest runs from apps/web — the
 * registry-sync.test.ts convention's jsdom-safe sibling). */
function fixtureReadings(): IndicatorReading[] {
  const corpus = JSON.parse(
    readFileSync(resolve(process.cwd(), '../../packages/insights/fixtures/gold-backtest-corpus.json'), 'utf8'),
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

function reading(id: IndicatorId, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-11-03',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-11-03T04:20:00.000Z',
    ...extra,
  };
}

/**
 * The one-sided case: borrowing costs (2 decade-high yields) and the
 * dollar (2 decade-high) read AGAINST, market stress (2 decade-high
 * indexes) reads FOR, inflation reads steady — 1 for · 2 against ·
 * 1 neutral, so both pans carry lane weights and the beam tips against.
 */
const DIRECTIONAL: IndicatorReading[] = [
  // borrowing costs: two firing pressures (decade-high levels)
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  reading('us30y', { value: 5.1, percentile10y: 0.5 }),
  reading('fed-target', { value: 4.3, percentile10y: 0.5 }),
  reading('fed-expectations', { value: 3.9, percentile10y: 0.5 }),
  reading('ecb-dfr', { value: 2.0, percentile10y: 0.5 }),
  reading('yield-curve-10y2y', { value: 0.3, percentile10y: 0.5 }),
  reading('yield-curve-10y3m', { value: 0.1, percentile10y: 0.5 }),
  // dollar: two firing pressures
  reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
  reading('usdjpy', { value: 155, percentile10y: 0.95 }),
  reading('us-japan-10y-gap', { value: 2.6, percentile10y: 0.5 }),
  // stress: two firing supports
  reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
  reading('nfci', { value: 0.4, percentile10y: 0.95 }),
  reading('vix', { value: 15, percentile10y: 0.5 }),
  reading('gold-silver', { value: 88, percentile10y: 0.5 }),
  reading('cftc-gold-positioning', { value: 200, percentile10y: 0.5 }),
  // inflation: readable, steady
  reading('us-cpi-yoy', { value: 2.6, percentile10y: 0.5 }),
  reading('us-pce-core-yoy', { value: 2.7, percentile10y: 0.5 }),
  reading('euro-hicp', { value: 2.2, percentile10y: 0.5 }),
  reading('breakeven-5y5y', { value: 2.3, percentile10y: 0.5 }),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.1 }),
  // gold itself: context only
  reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: 5.2 }),
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The renders below assert the FINAL geometry deterministically: the
 * first paint already carries the verdict angle, and a changed verdict
 * lands immediately under reduced motion — so mock matchMedia as
 * reducing (the balance.test.tsx convention). */
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

/** Renders the merged card on `readings` with honest signals (the same
 * evaluateSignal the page runs) — `balanceLanes` on by default (this
 * file's subject). A stray fetch must fail loudly — the card makes NO
 * network request of its own (the charts' history fetches reject). */
function renderCard(
  readings: readonly IndicatorReading[],
  opts: { balanceLanes?: boolean; locale?: 'en-US' | 'fa-IR'; c?: typeof copy } = {},
): { gold: SignalReading; silver: SignalReading } {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
  const gold = evaluateSignal('gold', readings);
  const silver = evaluateSignal('silver', readings);
  render(
    <MergedSignalsCard
      gold={gold}
      silver={silver}
      readings={readings}
      copy={opts.c ?? copy}
      numberLocale={opts.locale ?? 'en-US'}
      balanceLanes={opts.balanceLanes ?? true}
    />,
  );
  return { gold, silver };
}

const cardEl = (): HTMLElement => document.querySelector('[data-signal-card="merged"]') as HTMLElement;
const visualEl = (): HTMLElement => document.querySelector('[data-balance-visual]') as HTMLElement;
/** The pan assembly's plumb drop — parse the SECOND translate argument
 * (the first is always 0px: the pan never moves horizontally). */
const panDropOf = (el: HTMLElement): number =>
  Number(el.style.transform.match(/translate\(0px, (-?[\d.]+)px\)/)?.[1] ?? 0);
/** A positioned pan's `left` in px (React renders unitful strings). */
const panLeftOf = (el: HTMLElement): number => Number(el.style.left.match(/^(-?[\d.]+)px$/)?.[1] ?? NaN);

/* ------------------------------------------------------------------ *
 * §4.3 item 1 — lane weights land in the right pan or tray per side
 * ------------------------------------------------------------------ */
describe('the lane visual — weight placement (04 §4.3 item 1)', () => {
  it('a for lane weight rests on the supporting pan, against weights on the pressuring pan, a quiet lane in the Not-leaning tray', () => {
    renderCard(DIRECTIONAL);
    const b = goldBalance(DIRECTIONAL);
    // The UI mirrors the engine exactly (AC-3: one engine, no drift).
    expect(b.counts).toEqual({ for: 1, against: 2, neutral: 1, unread: 0 });
    const forPan = document.querySelector('[data-balance-pan="for"]') as HTMLElement;
    const againstPan = document.querySelector('[data-balance-pan="against"]') as HTMLElement;
    // stress (for) on the supporting pan; borrowing-costs + dollar (against) on the pressuring pan.
    expect(forPan.querySelector('[data-balance-weight="stress"]')).not.toBeNull();
    expect(againstPan.querySelector('[data-balance-weight="borrowing-costs"]')).not.toBeNull();
    expect(againstPan.querySelector('[data-balance-weight="dollar"]')).not.toBeNull();
    // inflation (neutral, below the crowd minimum) in the tray — never on a pan.
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelector('[data-balance-weight="inflation"]')).not.toBeNull();
    // At most 4 weights total (one per lane) + the 4 ledger discs carry no weight buttons.
    expect(document.querySelectorAll('[data-balance-weight]').length).toBe(4);
    // The beam tips against (net −1 → the against pan drops).
    const tilt = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    expect(tilt).toBeGreaterThan(0);
    expect(document.querySelector('[data-balance-verdict]')?.getAttribute('data-balance-verdict')).toBe('against');
  });

  it('the 2026-10-31 fixture: all four lanes neutral — empty pans, the level beam, the "Balanced" hero verdict, 4 in the tray, 4 ledger rows', () => {
    renderCard(fixtureReadings());
    // No lane lands on a pan — every lane is neutral, so the weights sit in the tray.
    expect(document.querySelectorAll('[data-balance-pan] [data-balance-weight]').length).toBe(0);
    expect(document.querySelectorAll('[data-balance-weight]').length).toBe(4);
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
    // V-1: the verdict word is the hero of its block (05 §4.4).
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toBe('Balanced');
    expect(document.querySelector('[data-balance-verdict-eyebrow]')?.textContent).toBe('Today’s lean');
    // The counts line states the lanes in words (for/against/not leaning always, unread only when any).
    expect(document.querySelector('[data-balance-count]')?.textContent).toBe('0 for · 0 against · 4 not leaning');
    // The lane strip: four bars, one per lane in fixed order (decorative).
    expect(document.querySelectorAll('[data-balance-lane-strip] i').length).toBe(4);
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelectorAll('button[data-balance-weight]').length).toBe(4);
    expect(tray.querySelector('[data-balance-tray-title]')?.textContent).toBe('Not leaning');
    // The ledger: one row per lane (05 §4.6).
    expect(document.querySelectorAll('[data-balance-row]').length).toBe(4);
    // Both pans carry the evidence sentence (the empty state).
    expect(document.querySelector('[data-balance-empty="for"]')?.textContent).toContain(
      'None of the factors checked shows a meaningful signal supporting gold',
    );
    expect(document.querySelector('[data-balance-empty="against"]')?.textContent).toContain(
      'None of the factors checked shows a meaningful signal working against gold',
    );
  });

  it('the two gold panels are RETIRED from the preview (nothing about gold outside the balance)', () => {
    renderCard(fixtureReadings());
    expect(document.querySelector('[data-gold-panels]')).toBeNull();
    expect(document.querySelector('#insights-gold-tailwind')).toBeNull();
    // The C12 banner mechanism and the footing strip stay (the prompt keeps them).
    expect(document.querySelectorAll('[data-footing-metal]').length).toBe(2);
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 2 — the split lane
 * ------------------------------------------------------------------ */
describe('the split lane (04 §4.3 item 2)', () => {
  it('carries the "Split" badge on the tray weight and names its contest in the ledger row', () => {
    renderCard(fixtureReadings());
    const weight = document.querySelector('[data-balance-weight="borrowing-costs"]') as HTMLElement;
    expect(weight).not.toBeNull();
    expect(weight.querySelector('[data-balance-split-badge]')?.textContent).toBe('Split');
    // The single most important disclosure: contested, not empty (the weight's aria says so).
    expect(weight.getAttribute('aria-label')).toBe('Borrowing costs: Not leaning. Split, 2 for, 2 against.');
    // The ledger row's state text names the contest too (05 §4.6).
    const row = document.querySelector('[data-balance-row="borrowing-costs"]') as HTMLElement;
    expect(row.querySelector('.row-state')?.textContent).toBe('Split: 2 for, 2 against');
    expect(row.querySelector('[data-balance-tally]')?.textContent).toBe('2 for, 2 against');
    // The quiet lanes carry no badge and keep the plain tallies in their rows.
    const dollar = document.querySelector('[data-balance-weight="dollar"]') as HTMLElement;
    expect(dollar.querySelector('[data-balance-split-badge]')).toBeNull();
    const dollarRow = document.querySelector('[data-balance-row="dollar"]') as HTMLElement;
    expect(dollarRow.querySelector('[data-balance-tally]')?.textContent).toBe('1 of 3 drivers firing');
    const stressRow = document.querySelector('[data-balance-row="stress"]') as HTMLElement;
    expect(stressRow.querySelector('[data-balance-tally]')?.textContent).toBe('No driver firing');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 3 — the ledger's open row (the member list content)
 * ------------------------------------------------------------------ */
describe('the ledger row expansion (04 §4.3 item 3 + AC-2)', () => {
  it('lists the firing members grouped by impact with evidence, values and the indicator deep link; steady voters as one muted sentence', () => {
    renderCard(fixtureReadings());
    // Opening the weight scrolls to and opens the lane's ledger row (05 §4.3).
    fireEvent.click(document.querySelector('[data-balance-weight="borrowing-costs"]')!);
    const row = document.querySelector('[data-balance-row="borrowing-costs"]') as HTMLElement;
    expect(row.getAttribute('data-open')).toBe('true');
    const members = row.querySelector('[data-balance-row-members="borrowing-costs"]') as HTMLElement;
    expect(members.hidden).toBe(false);
    // The lane's intro sentence (laneIntro) rides above the rows.
    expect(members.textContent).toContain('The cost of borrowing dollars');
    // Grouped: the two falling yields under supports, the two highs under pressures.
    const supports = members.querySelector('[data-balance-member-group="supports"]') as HTMLElement;
    expect(supports.querySelectorAll('[data-balance-member]').length).toBe(2);
    expect(supports.textContent).toContain('Real yields');
    expect(supports.textContent).toContain('falling');
    expect(supports.textContent).toContain('US 10-year yield');
    const pressures = members.querySelector('[data-balance-member-group="pressures"]') as HTMLElement;
    expect(pressures.querySelectorAll('[data-balance-member]').length).toBe(2);
    expect(pressures.textContent).toContain('US 30-year yield');
    expect(pressures.textContent).toContain('high in its decade');
    // Every firing row carries the value text and the deep link to its indicator card.
    const memberRow = pressures.querySelector('[data-balance-member="us30y"]') as HTMLElement;
    expect(memberRow.querySelector('a')?.getAttribute('href')).toBe('/insights?card=us30y');
    expect(memberRow.querySelector('a')?.textContent).toBe('Open indicator');
    // The steady voters: one muted sentence, every name present (AC-2).
    const steady = members.querySelector('[data-balance-member-group="steady"]') as HTMLElement;
    expect(steady).not.toBeNull();
    expect(steady.textContent).toContain('Not firing (4):');
    expect(steady.querySelectorAll('[data-balance-member-impact="steady"]').length).toBe(4);
    // The 21 voters are all reachable (AC-2): 8 members in this lane.
    expect(members.querySelectorAll('[data-balance-member]').length).toBe(8);
  });

  it('the inflation lane shows the tilt phrase in its row, and the breakeven-5y5y row shows the card status word (B-12)', () => {
    renderCard(fixtureReadings());
    fireEvent.click(document.querySelector('[data-balance-weight="inflation"]')!);
    const members = document.querySelector('[data-balance-row-members="inflation"]') as HTMLElement;
    // The fixture's breakeven-tilt reading leans fading (verified: value −0.24, change30d −0.24).
    expect(members.querySelector('[data-balance-lane-note]')?.textContent).toBe('expectations fading');
    // B-12: the breakeven-5y5y member line carries the indicator card's OWN status word
    // beside the lean phrase (the fixture's card reads Normal).
    const row = members.querySelector('[data-balance-member="breakeven-5y5y"]') as HTMLElement;
    expect(row.textContent).toContain('falling');
    expect(row.textContent).toContain('Normal');
    // No tilt phrase on the other lanes (inflation only — 03 §3 item 5).
    fireEvent.click(document.querySelector('[data-balance-weight="dollar"]')!);
    expect(document.querySelector('[data-balance-row-members="dollar"] [data-balance-lane-note]')).toBeNull();
  });

  it('an unread member group renders only when a voter could not be read', () => {
    // Clone the fixture with two borrowing-costs voters turned stale.
    const readings = fixtureReadings().map((r) =>
      r.id === 'ecb-dfr' || r.id === 'yield-curve-10y2y' ? { ...r, status: 'stale' as const, value: null } : r,
    );
    renderCard(readings);
    fireEvent.click(document.querySelector('[data-balance-weight="borrowing-costs"]')!);
    const members = document.querySelector('[data-balance-row-members="borrowing-costs"]') as HTMLElement;
    const unread = members.querySelector('[data-balance-member-group="unread"]') as HTMLElement;
    expect(unread).not.toBeNull();
    expect(unread.textContent).toContain('Unread');
    expect(unread.querySelectorAll('[data-balance-member-impact="unread"]').length).toBe(2);
    // The clean fixture has no unread group.
    cleanup();
    renderCard(fixtureReadings());
    fireEvent.click(document.querySelector('[data-balance-weight="borrowing-costs"]')!);
    expect(
      document.querySelector('[data-balance-row-members="borrowing-costs"] [data-balance-member-group="unread"]'),
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 4 — B-12: no member line uses "elevated"
 * ------------------------------------------------------------------ */
describe('B-12 (04 §4.3 item 4)', () => {
  it('no member line uses "elevated" — the warning card shows its own word, the normal card shows Normal', () => {
    const warning = fixtureReadings().map((r) =>
      r.id === 'breakeven-5y5y' ? { ...r, status: 'warning' as const } : r,
    );
    for (const [name, readings] of [
      ['normal card', fixtureReadings()],
      ['warning card', warning],
    ] as const) {
      cleanup();
      renderCard(readings);
      fireEvent.click(document.querySelector('[data-balance-weight="inflation"]')!);
      const row = document.querySelector('[data-balance-member="breakeven-5y5y"]') as HTMLElement;
      expect(row.textContent).toContain('falling');
      if (name === 'warning card') {
        expect(row.textContent).toContain('Needs attention');
      } else {
        expect(row.textContent).toContain('Normal');
      }
      // The evidence vocabulary never carries the word "elevated" (02 §4.2).
      for (const line of document.querySelectorAll('[data-balance-member]')) {
        expect(line.textContent?.toLowerCase()).not.toContain('elevated');
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 5 — the context pill
 * ------------------------------------------------------------------ */
describe('the context pill (04 §4.3 item 5)', () => {
  it("renders gold's 30-day move as context, never counted; hidden when the value is missing", () => {
    renderCard(DIRECTIONAL);
    const line = document.querySelector('[data-balance-context-line]') as HTMLElement;
    const expected = formatChange(5.2, 'pct', 'en-US', copy.units);
    expect(line.textContent).toBe(`Gold over the last 30 days: ${expected}. Shown for context, not counted in the balance.`);
    // The recorded fixture's move: −7.755…% renders with the locale's sign and digits.
    cleanup();
    renderCard(fixtureReadings());
    const recorded = formatChange(-7.755274916938848, 'pct', 'en-US', copy.units);
    expect(document.querySelector('[data-balance-context-line]')?.textContent).toContain(recorded);
    // Missing change30d → the pill hides (01 §6: hidden when the value is missing).
    cleanup();
    const noChange = DIRECTIONAL.map((r) => (r.id === 'gold-usd' ? { ...r, change30d: undefined } : r));
    renderCard(noChange);
    expect(document.querySelector('[data-balance-context-line]')).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 6 — the measured note (the footnote)
 * ------------------------------------------------------------------ */
describe('the measured note (04 §4.3 item 6)', () => {
  it('renders with the backtest link without any interaction (01 §8.2)', () => {
    renderCard(fixtureReadings());
    const note = document.querySelector('[data-balance-measured-note]') as HTMLElement;
    expect(note.textContent).toContain('no positive association with the next 5 to 60 days');
    expect(note.textContent).toContain('It describes conditions, not direction.');
    const link = note.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(GOLD_BALANCE_BACKTEST_URL);
    expect(link.textContent).toBe('Read the full backtest');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 7 — the DOM wind-word scan, EN + fa
 * ------------------------------------------------------------------ */
describe('the DOM wind scan (04 §4.3 item 7)', () => {
  for (const [name, c, locale] of [
    ['EN', copy, 'en-US'],
    ['fa', copyFa, 'fa-IR'],
  ] as const) {
    it(`${name}: no "tailwind", "headwind" or "wind" text renders in the gold card under the flag`, () => {
      renderCard(fixtureReadings(), { c, locale });
      const text = cardEl().textContent?.toLowerCase() ?? '';
      expect(text).not.toContain('wind');
      // (the substring above covers all three words; stated separately for the failure message)
      expect(text).not.toContain('tailwind');
      expect(text).not.toContain('headwind');
      // The Persian copy carries its own wind vocabulary nowhere either.
      expect(text).not.toContain('باد');
    });
  }
});

/* ------------------------------------------------------------------ *
 * §4.3 item 9 — RTL: the sides mirror, the physical sign is direction-free
 * ------------------------------------------------------------------ */
describe('RTL (04 §4.3 item 9)', () => {
  it('the for pan hangs from the RIGHT beam end in fa and the heavy side still drops — the physical sign is direction-free', () => {
    // LTR first: the for pan is the LEFT column, the against-heavy beam
    // tips the against (right) pan down.
    renderCard(DIRECTIONAL);
    const tiltLtr = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    const dropAgainstLtr = panDropOf(document.querySelector('[data-balance-pan="against"]') as HTMLElement);
    const dropForLtr = panDropOf(document.querySelector('[data-balance-pan="for"]') as HTMLElement);
    const forPanLeftLtr = panLeftOf(document.querySelector('[data-balance-pan="for"]') as HTMLElement);
    expect(tiltLtr).toBeGreaterThan(0);
    expect(dropAgainstLtr).toBeGreaterThan(0);
    expect(dropForLtr).toBeLessThan(0);
    // jsdom measures no widths: the stage falls back to the 720 design
    // width, so the for pan starts at the stage's LEFT edge in LTR.
    expect(forPanLeftLtr).toBeLessThan(50);
    cleanup();
    // fa: the SAME physical angle drives the drops (data-tilt identical);
    // the for pan is now the RIGHT column (the drawing mirrors with the
    // document).
    renderCard(DIRECTIONAL, { locale: 'fa-IR', c: copyFa });
    const tiltRtl = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    expect(tiltRtl).toBe(tiltLtr);
    expect(panDropOf(document.querySelector('[data-balance-pan="against"]') as HTMLElement)).toBe(dropAgainstLtr);
    expect(panDropOf(document.querySelector('[data-balance-pan="for"]') as HTMLElement)).toBe(dropForLtr);
    // The for hangers meet the beam end on the RIGHT half of the stage in RTL.
    const forHangerX = Number(document.querySelector('[data-balance-hanger="for-start"]')?.getAttribute('x1'));
    expect(forHangerX).toBeGreaterThan(320);
    // The for pan sits at the stage's RIGHT edge in RTL.
    const forPanLeftRtl = panLeftOf(document.querySelector('[data-balance-pan="for"]') as HTMLElement);
    expect(forPanLeftRtl).toBeGreaterThan(400);
    // Persian digits render in the tally (the locale formatter) — the
    // dollar lane rides the against pan on this fixture: 2 of its 3
    // voters firing (the row's tally line).
    expect(document.querySelector('[data-balance-row="dollar"] [data-balance-tally]')?.textContent).toBe(
      '۲ مورد از ۳ عامل فعال است',
    );
    // The state words render in Persian (05 §4.6).
    expect(document.querySelector('[data-balance-row="stress"] .row-state')?.textContent).toBe('به نفع طلاست');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 11 — dictionary coverage, EN + fa
 * ------------------------------------------------------------------ */
describe('dictionary coverage (04 §4.3 item 11)', () => {
  const NEW_PLACEHOLDER_KEYS: Array<[keyof typeof copy.signals.balance, string[]]> = [
    ['laneTally', ['{firing}', '{readable}']],
    ['laneSplit', ['{supports}', '{pressures}']],
    ['laneChipAria', ['{lane}', '{side}', '{tally}']],
    ['membersSteadyTitle', ['{n}']],
    ['membersUnreadTitle', ['{n}']],
    ['contextLine', ['{change}']],
    ['laneCountFor', ['{n}']],
    ['laneCountAgainst', ['{n}']],
    ['laneCountNeutral', ['{n}']],
    ['laneCountUnread', ['{n}']],
    ['laneStateSplit', ['{supports}', '{pressures}']],
    ['laneSteadySentence', ['{n}', '{names}']],
  ];
  const NEW_PLAIN_KEYS: Array<keyof typeof copy.signals.balance> = [
    'subtitleLanes',
    'laneTallyNone',
    'splitBadge',
    'memberSupports',
    'memberPressures',
    'memberOpenIndicator',
    'measuredNote',
    // GB-S4 (05 §11): the visual's own strings.
    'eyebrow',
    'verdictEyebrow',
    'panCapFor',
    'panCapAgainst',
    'trayTitleLanes',
    'trayNote',
    'trayEmpty',
    'laneStateFor',
    'laneStateAgainst',
    'laneStateNeutral',
    'laneStateUnread',
    'memberWordSupports',
    'memberWordPressures',
    'memberWordUnread',
  ];
  for (const [name, c] of [['en', copy], ['fa', copyFa]] as const) {
    it(`${name}: every lane key is non-empty with its placeholders intact; no em dashes in fa`, () => {
      const b = c.signals.balance;
      for (const key of NEW_PLAIN_KEYS) {
        expect(b[key], `${name} ${String(key)}`).toBeTruthy();
      }
      for (const [key, placeholders] of NEW_PLACEHOLDER_KEYS) {
        const value = b[key] as string;
        expect(value, `${name} ${String(key)}`).toBeTruthy();
        for (const p of placeholders) expect(value, `${name} ${String(key)} ${p}`).toContain(p);
      }
      for (const lane of GOLD_LANES) {
        expect(b.laneIntro[lane], `${name} laneIntro ${lane}`).toBeTruthy();
      }
      // The honesty rules ride the subtitle (01 §8.1) and the measured note
      // (§8.2) — each locale in its own words.
      if (name === 'en') {
        expect(b.subtitleLanes).toContain('not a forecast');
        expect(b.measuredNote).toContain('no positive association');
      } else {
        expect(b.subtitleLanes).toContain('پیش‌بینی نیست');
        expect(b.measuredNote).toContain('رابطهٔ مثبتی');
        expect(b.measuredNote).not.toContain('باد');
      }
      if (name === 'fa') {
        for (const key of [...NEW_PLAIN_KEYS, ...NEW_PLACEHOLDER_KEYS.map(([k]) => k)] as string[]) {
          const value = b[key as keyof typeof b] as unknown as string;
          expect(value, `fa ${key} em dash`).not.toContain('—');
        }
        for (const lane of GOLD_LANES) expect(b.laneIntro[lane], `fa laneIntro ${lane}`).not.toContain('—');
      }
    });
  }
});

/* ------------------------------------------------------------------ *
 * §4.3 item 12 — keyboard open/close + focus
 * ------------------------------------------------------------------ */
describe('keyboard (04 §4.3 item 12 + V-8)', () => {
  it('a weight activation opens its ledger row and moves focus there; a second activation on the row closes it; one row open at a time', () => {
    renderCard(fixtureReadings());
    const weight = document.querySelector('[data-balance-weight="borrowing-costs"]') as HTMLButtonElement;
    expect(weight.tagName).toBe('BUTTON'); // keyboard-reachable by construction (Enter/Space activate buttons)
    weight.focus();
    expect(document.activeElement).toBe(weight);
    // Button activation (Enter/Space synthesize click per the HTML spec).
    fireEvent.click(weight);
    expect(weight.getAttribute('aria-expanded')).toBe('true');
    const row = document.querySelector('[data-balance-row-btn="borrowing-costs"]') as HTMLButtonElement;
    expect(row.getAttribute('aria-expanded')).toBe('true');
    // Focus moved to the opened row (05 §4.3: press scrolls to and opens
    // the lane's ledger row).
    expect(document.activeElement).toBe(row);
    // The member content is inside the expansion (aria-controls is valid).
    expect(document.getElementById('gold-balance-members-borrowing-costs')?.hidden).toBe(false);
    // Close: the row hides and focus stays on the row's toggle.
    fireEvent.click(row);
    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('gold-balance-members-borrowing-costs')?.hidden).toBe(true);
    expect(document.activeElement).toBe(row);
    // Opening another lane's row swaps the open row (one open at a time).
    const dollarWeight = document.querySelector('[data-balance-weight="dollar"]') as HTMLButtonElement;
    fireEvent.click(weight);
    fireEvent.click(document.querySelector('[data-balance-row-btn="dollar"]')!);
    expect(document.querySelector('[data-balance-row="dollar"]')?.getAttribute('data-open')).toBe('true');
    expect(document.querySelector('[data-balance-row="borrowing-costs"]')?.getAttribute('data-open')).toBe('false');
    expect(dollarWeight.getAttribute('aria-expanded')).toBe('true');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 13 — the legacy default rendering, byte-for-byte
 * ------------------------------------------------------------------ */
describe('the legacy default rendering (04 §4.3 item 13)', () => {
  it('without the flag: the two gold panels stay, the balance keeps the legacy condition chips, no lane visual renders', () => {
    renderCard(fixtureReadings(), { balanceLanes: false });
    // The two panels stay under the balance (they retire from the DEFAULT view only at P5/GB-S6).
    expect(document.querySelector('[data-gold-panels]')).not.toBeNull();
    expect(document.querySelector('#insights-gold-tailwind')).not.toBeNull();
    // The legacy condition chips (not lanes) drive the balance.
    expect(document.querySelector('[data-balance-tile="real-yield"]')).not.toBeNull();
    expect(document.querySelector('[data-balance-chip="borrowing-costs"]')).toBeNull();
    // None of the visual's elements render.
    expect(document.querySelector('[data-balance-visual]')).toBeNull();
    expect(document.querySelector('[data-balance-weight]')).toBeNull();
    expect(document.querySelector('[data-balance-ledger]')).toBeNull();
    expect(document.querySelector('[data-balance-context-line]')).toBeNull();
    expect(document.querySelector('[data-balance-measured-note]')).toBeNull();
    expect(document.querySelector('[data-balance-split-badge]')).toBeNull();
    // The legacy subtitle, not the reworded one.
    expect(document.querySelector('[data-balance-subtitle]')?.textContent).toBe(
      'Each factor is read against its usual range and weighed equally; the beam shows the combined lean of today’s readings.',
    );
  });

  it('the legacy markup is pinned byte-for-byte (the snapshot — any change to the default view must be conscious)', () => {
    // Determinism guard: two independent renders must produce identical markup
    // before the snapshot is allowed to speak.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    const readings = fixtureReadings();
    const gold = evaluateSignal('gold', readings);
    const silver = evaluateSignal('silver', readings);
    const first = render(
      <MergedSignalsCard
        gold={gold}
        silver={silver}
        readings={readings}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    const html1 = cardEl().innerHTML;
    cleanup();
    const second = render(
      <MergedSignalsCard
        gold={gold}
        silver={silver}
        readings={readings}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    const html2 = cardEl().innerHTML;
    expect(html2).toBe(html1);
    expect(first.container).toBeTruthy();
    expect(second.container).toBeTruthy();
    // The pin itself: without ?balance=lanes the card renders today's markup,
    // byte-for-byte (04 §3 P2: "without the parameter visitors see today's
    // page until P5"). A future session that changes the DEFAULT view
    // updates this snapshot CONSCIOUSLY (with the spec's blessing recorded).
    expect(html2).toMatchSnapshot();
  });
});

/* ------------------------------------------------------------------ *
 * GB-S4 — the visual's own pins (05 §4.2/§4.3/§7/§8 + V-1/4/5/9)
 * ------------------------------------------------------------------ */
describe('the segmented rim (05 §4.3 + V-4)', () => {
  it('one arc segment per driver, sorted supports → pressures → steady → unread, dotted only for unread', () => {
    const impacts: GoldBalanceMember['impact'][] = [
      'unread',
      'steady',
      'pressures',
      'supports',
      'supports',
      'pressures',
    ];
    const segs = balanceRimSegments(impacts);
    expect(segs).toHaveLength(6);
    expect(segs.map((s) => s.impact)).toEqual(['supports', 'supports', 'pressures', 'pressures', 'steady', 'unread']);
    expect(segs[0]!.stroke).toBe('for');
    expect(segs[2]!.stroke).toBe('against');
    expect(segs[4]!.stroke).toBe('hairline');
    expect(segs[5]!.dashed).toBe(true);
    expect(segs.filter((s) => s.dashed)).toHaveLength(1);
    // Firing segments stroke 4.2, the rest 3 (05 §4.3).
    expect(segs[0]!.strokeWidth).toBe(4.2);
    expect(segs[4]!.strokeWidth).toBe(3);
    // An empty lane renders no rim (never throws).
    expect(balanceRimSegments([])).toEqual([]);
  });

  it('every weight rim matches the engine counts in every scenario (V-4)', () => {
    for (const [name, readings] of [
      ['the 2026-10-31 fixture', fixtureReadings()],
      ['the one-sided case', DIRECTIONAL],
    ] as const) {
      cleanup();
      renderCard(readings);
      const balance = goldBalance(readings);
      for (const lane of balance.lanes) {
        const disc = document.querySelector(`[data-balance-weight="${lane.lane}"] [data-balance-disc]`) as HTMLElement | null;
        const rowDisc = document.querySelector(`[data-balance-row="${lane.lane}"] [data-balance-disc]`) as HTMLElement | null;
        // The weight (pan or tray) + the ledger disc both exist for every lane.
        expect(disc ?? rowDisc).not.toBeNull();
        for (const el of [disc, rowDisc]) {
          if (el === null) continue;
          const segs = el.querySelectorAll('[data-balance-seg]');
          expect(segs.length, `${name} ${lane.lane} segments`).toBe(lane.members.length);
          expect(el.querySelectorAll('[data-balance-seg="supports"]').length, `${name} ${lane.lane} supports`).toBe(
            lane.members.filter((m) => m.impact === 'supports').length,
          );
          expect(el.querySelectorAll('[data-balance-seg="pressures"]').length, `${name} ${lane.lane} pressures`).toBe(
            lane.members.filter((m) => m.impact === 'pressures').length,
          );
          expect(el.querySelectorAll('[data-balance-seg="unread"]').length, `${name} ${lane.lane} unread`).toBe(
            lane.members.filter((m) => m.impact === 'unread').length,
          );
        }
      }
    }
  });
});

describe('the visual geometry (05 §4.2/§7 + V-5/V-9)', () => {
  it('the size classes follow the card width: s < 560, m 560–759, l >= 760', () => {
    expect(balanceVisualSizeOfWidth(359)).toBe('s');
    expect(balanceVisualSizeOfWidth(560)).toBe('m');
    expect(balanceVisualSizeOfWidth(760)).toBe('l');
  });

  it('the stage reserves the worst case and the pans keep a fixed height (nothing resizes with the data)', () => {
    const l = balanceVisualGeometry(720, 'l');
    expect(l.pw).toBe(274);
    expect(l.L).toBe(446);
    expect(l.pivotY).toBe(72);
    expect(l.restTop).toBe(l.pivotY + l.hanger);
    // The stage's height never depends on the data: pivot + hanger + pan + swing + base.
    expect(l.H).toBeGreaterThanOrEqual(l.pivotY + l.hanger + l.panH + l.swing);
    expect(l.panH).toBe(268);
    const s = balanceVisualGeometry(320, 's');
    // Mobile: two weights + the column gap fit a pan's inner width (the
    // four-weights stack wraps to two rows of two, never one per row).
    expect(2 * s.weightW + 6).toBeLessThanOrEqual(s.pw - 12);
    expect(s.discD).toBeLessThanOrEqual(52);
  });

  it('the dial carries 11 ticks over ±35° with a longer centre tick (05 §4.2)', () => {
    const ticks = balanceVisualTicks(360, 72, 42);
    expect(ticks).toHaveLength(11);
    expect(ticks.filter((t) => t.center)).toHaveLength(1);
    // Every tick sits above the pivot (the dial arcs over the beam) and
    // spans exactly ±35°: the first tick on the left of centre, the last
    // on the right, the centre tick at 12 o'clock.
    for (const t of ticks) {
      expect(t.from.y).toBeLessThan(72);
      expect(t.to.y).toBeGreaterThan(t.from.y); // pointing inward, toward the pivot
    }
    expect(ticks[0]!.from.x).toBeLessThan(360);
    expect(ticks[10]!.from.x).toBeGreaterThan(360);
    expect(ticks[5]!.from.x).toBe(360);
    expect(ticks[5]!.from.y).toBe(30); // 72 − 42
  });

  it('the frame: pans translate ONLY vertically, by exactly their joint displacement; the needle magnifies 3× clamped to ±32', () => {
    const geo = balanceVisualGeometry(720, 'l');
    const f = balanceVisualFrame(geo, 6.66, false);
    // against-heavy (positive) in LTR: the right end (against) drops.
    expect(f.forIsLeft).toBe(true);
    expect(f.againstDrop).toBeGreaterThan(0);
    expect(f.forDrop).toBe(-f.againstDrop);
    expect(f.jointRight.y).toBe(geo.pivotY + f.againstDrop);
    expect(f.jointLeft.y).toBe(geo.pivotY + f.forDrop);
    expect(f.needleDeg).toBe(19.98); // 6.66 × 3
    // RTL: the visual sign flips so the heavy side still dips; the drops
    // keep their meaning (the for pan is the right column).
    const fr = balanceVisualFrame(geo, 6.66, true);
    expect(fr.visDeg).toBe(-6.66);
    expect(fr.forIsLeft).toBe(false);
    expect(fr.forDrop).toBe(-f.againstDrop); // the for pan (right in RTL) rises
    expect(fr.againstDrop).toBe(f.againstDrop); // the against pan (left) drops
    // The needle clamps at ±32 (a 10° tip reads 30; nothing exceeds the dial).
    expect(balanceVisualFrame(geo, 12, false).needleDeg).toBe(32);
    expect(balanceVisualFrame(geo, -12, false).needleDeg).toBe(-32);
  });

  it('the beam angle, needle and verdict follow the unchanged formula for nets −3..+3 (V-5)', () => {
    // The pure law (already pinned by balance.test.tsx §6) drives the new
    // drawing through the SAME helpers: for every (for, against) split of
    // 4 lanes the tilt angle matches |net|/(f+a) × 10 clamped to [3, 10];
    // net 0 is exactly level.
    for (const f of [0, 1, 2, 3, 4]) {
      for (const a of [0, 1, 2, 3, 4]) {
        const net = f - a;
        const directional = f + a;
        const drivers: BalanceDriver[] = [];
        for (let i = 0; i < f; i++) drivers.push({ key: `f${i}`, label: 'F', detail: '', valueText: null, state: 'for' });
        for (let i = 0; i < a; i++) drivers.push({ key: `a${i}`, label: 'A', detail: '', valueText: null, state: 'against' });
        for (let i = drivers.length; i < 4; i++) drivers.push({ key: `n${i}`, label: 'N', detail: '', valueText: null, state: 'neutral' });
        const tilt = balanceTilt(balanceCounts(drivers), BALANCE_LH_PX);
        if (net === 0 || directional === 0) {
          expect(tilt.angleDeg).toBe(0);
        } else {
          const expected = Math.min(10, Math.max(3, (Math.abs(net) / directional) * 10));
          expect(tilt.angleDeg).toBeCloseTo(expected, 10);
        }
      }
    }
    // The component's own sparse rule (UI-40, kept): fewer than 3
    // READABLE lanes is not a reading — the beam stays level and the
    // not-enough line rides under the counts (05 §8). Unread lanes do
    // not count as readable (1 for + 3 unread → readable 1).
    cleanup();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    const sparseDrivers: BalanceDriver[] = [
      { key: 'f', label: 'F', detail: '', valueText: null, state: 'for' },
      { key: 'u1', label: 'U1', detail: '', valueText: null, state: 'unread' },
      { key: 'u2', label: 'U2', detail: '', valueText: null, state: 'unread' },
      { key: 'u3', label: 'U3', detail: '', valueText: null, state: 'unread' },
    ];
    render(<BalanceScale drivers={sparseDrivers} copy={copy} numberLocale="en-US" visual="lanes" />);
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
    expect(document.querySelector('[data-balance-not-enough]')?.textContent).toBe(
      'Not enough readable conditions to weigh',
    );
  });

  it('reduced motion: the first paint already carries the final angle (V-9)', () => {
    renderCard(DIRECTIONAL);
    const beam = document.querySelector('[data-balance-beam]') as SVGElement;
    const target = document.querySelector('[data-balance-visual]')?.getAttribute('data-balance-tilt-target');
    expect(target).not.toBe('0');
    expect(beam.getAttribute('data-tilt')).toBe(target);
    // And the visual rotation is the physical angle (rounded to the
    // drawing's 2-decimal determinism), positive in LTR.
    const geo = balanceVisualGeometry(720, 'l');
    expect(beam.getAttribute('transform')).toBe(
      `rotate(${Number(target)!.toFixed(2)} ${geo.cx} ${geo.pivotY})`,
    );
  });

  it('the loading skeleton: no drivers → the level drawing + grey discs, no tray, no ledger (05 §8)', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    render(
      <BalanceScale drivers={[]} copy={copy} numberLocale="en-US" visual="lanes" />,
    );
    const visual = visualEl();
    expect(visual).not.toBeNull();
    expect(visual.querySelectorAll('.sk').length).toBeGreaterThanOrEqual(6); // 4 discs + 2 verdict bars + eyebrow… at least the stage + verdict skeletons
    expect(visual.querySelector('[data-balance-ledger]')).toBeNull();
    expect(visual.querySelector('[data-balance-tray]')).toBeNull();
    expect(visual.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
  });
});

/* ------------------------------------------------------------------ *
 * The flag itself — the ?narrative=preview pattern
 * ------------------------------------------------------------------ */
describe('useBalanceLanesPreview — the ?balance=lanes query flag', () => {
  it('reads the parameter once from the canonical path URL; absent → false (no persistence)', () => {
    const probe = (): boolean => {
      let value = false;
      function Probe(): React.JSX.Element {
        value = useBalanceLanesPreview();
        return <p>probe</p>;
      }
      render(<Probe />);
      cleanup();
      return value;
    };
    window.history.pushState({}, '', '/insights?balance=lanes');
    expect(probe()).toBe(true);
    window.history.pushState({}, '', '/insights');
    expect(probe()).toBe(false);
    // The narrative flag's parameter does NOT leak into the balance flag.
    window.history.pushState({}, '', '/insights?narrative=preview');
    expect(probe()).toBe(false);
    window.history.pushState({}, '', '/insights');
  });
});
