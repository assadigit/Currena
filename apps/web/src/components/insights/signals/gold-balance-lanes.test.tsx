/**
 * @vitest-environment jsdom
 *
 * signals/gold-balance-lanes.test.tsx — the gold balance consolidation's
 * component tests: the consolidated LANE balance behind the
 * ?balance=lanes preview flag, REWRITTEN for the GB-S4 visual redesign
 * (P2b, docs/specs/gold-balance-consolidation/05-VISUAL-DESIGN-SPEC.md —
 * the lane WEIGHTS on brass pans, the verdict block as the hero, the
 * "Not leaning" tray and the four-row inline LEDGER; 04 §4.3 items
 * 1-7, 9, 11-13 re-pinned to the new anatomy):
 *
 *   1. lane weights land in the right pan or tray for each side
 *   2. a split lane shows the "Split" badge, the aria contest and the
 *      ledger's "Split: 2 for, 2 against" state word
 *   3. the LEDGER row's member list (the detail panel, inline): members
 *      grouped by impact; steady collapsed to one muted sentence; the
 *      inflation lane shows the tilt phrase; the breakeven-5y5y row
 *      shows the card status word (B-12)
 *   4. B-12: no member line uses "elevated" unless the card status is
 *      warning (the evidence vocabulary carries no such word)
 *   5. the context pill renders for a known change30d; hidden when
 *      missing
 *   6. the measured note + backtest link render without interaction
 *   7. DOM scan: no "tailwind"/"headwind"/"wind" text in the gold card
 *      under the flag, EN and fa (01 §8.3)
 *   9. RTL: the pan sides mirror; the beam sign for the heavy side is
 *      unchanged (the physical angle is direction-free)
 *  11. EN and fa dictionaries cover every new key (placeholders intact)
 *  12. keyboard: a weight opens its ledger row (focus lands on the row
 *      button); the row button closes it; one row open at a time
 *  13. without the flag the LEGACY rendering is unchanged (the snapshot
 *      of the legacy markup — the default view stays byte-for-byte
 *      today's until the owner-gated P5/GB-S6 flip)
 *
 * Plus the GB-S4-specific pins: the segmented rim (V-4 — one segment
 * per driver, sorted, matching the ledger counts), the visual stage
 * geometry (05 §4.2 — the pure metrics/frame), the verdict block
 * (05 §4.4), the tray's empty state (05 §4.5), the all-unread and
 * sparse states (05 §8, UI-40 held through the redesign).
 *
 * Fixtures: the RECORDED 2026-10-31 corpus archive (the recipe verified
 * twice — GB-S1 + GB-S2: sourceName "archive 2026-10-31", updatedAt the
 * archive's generatedAt) reproduces 01 §7 exactly — LEVEL · 4 neutral ·
 * borrowing-costs split 2v2 (readable 8, firing 4) · dollar 1 firing ·
 * stress readable-5/firing-0 · inflation 1 firing — plus five synthetic
 * cases (DIRECTIONAL 1 for · 2 against · 1 neutral; FOR 3-0-1; STACK
 * 0-4-0; ALL_UNREAD 0-0-0-4; SPARSE readable 1), each verified against
 * the real engine before pinning (the numbers printed in the session
 * log). Conventions follow balance.test.tsx / gold-panels.test.tsx.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { GOLD_LANES, goldBalance, type SignalReading } from '@currena/insights';
import { evaluateSignal } from '@currena/insights';
import { MergedSignalsCard, useBalanceLanesPreview } from './MergedCard';
import { BalanceScale, balanceVisualFrame, balanceVisualMetrics, balanceVisualSizeOf } from './BalanceScale';
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
 * (the fixture recipe from GB-S2's prompt, verified twice). The jsdom
 * environment serves http module URLs, so the fixture resolves from the
 * process cwd (vitest runs from apps/web — the registry-sync.test.ts
 * convention's jsdom-safe sibling). */
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

/** Every one of the 21 voters (the lane ids in table order), for the
 * synthetic fixtures' shared quiet rows. */
const ALL_VOTERS: IndicatorId[] = [
  'real-yield-10y',
  'us10y',
  'us30y',
  'fed-target',
  'fed-expectations',
  'ecb-dfr',
  'yield-curve-10y2y',
  'yield-curve-10y3m',
  'dollar-basket',
  'usdjpy',
  'us-japan-10y-gap',
  'stress-stlfsi',
  'nfci',
  'vix',
  'gold-silver',
  'cftc-gold-positioning',
  'us-cpi-yoy',
  'us-pce-core-yoy',
  'euro-hicp',
  'breakeven-5y5y',
  'breakeven-tilt',
];

/** A quiet (steady, typical) row for a voter. */
const quiet = (id: IndicatorId): IndicatorReading => reading(id, { value: 1, percentile10y: 0.5 });

/**
 * The one-sided case: borrowing costs (2 decade-high yields) and the
 * dollar (2 decade-high) read AGAINST, market stress (2 decade-high
 * indexes) reads FOR, inflation reads steady — 1 for · 2 against ·
 * 1 neutral (engine-verified), so both pans carry lane weights and the
 * beam tips against at |−1|/3 × 10° ≈ 3.33°.
 */
const DIRECTIONAL: IndicatorReading[] = [
  // borrowing costs: two firing pressures (decade-high levels)
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  quiet('yield-curve-10y2y'),
  quiet('yield-curve-10y3m'),
  // dollar: two firing pressures
  reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
  reading('usdjpy', { value: 155, percentile10y: 0.95 }),
  quiet('us-japan-10y-gap'),
  // stress: two firing supports
  reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
  reading('nfci', { value: 0.4, percentile10y: 0.95 }),
  quiet('vix'),
  quiet('gold-silver'),
  quiet('cftc-gold-positioning'),
  // inflation: readable, steady
  quiet('us-cpi-yoy'),
  quiet('us-pce-core-yoy'),
  quiet('euro-hicp'),
  quiet('breakeven-5y5y'),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.1 }),
  // gold itself: context only
  reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: 5.2 }),
];

/**
 * The leaning-FOR case (engine-verified: 3 for · 0 against · 1 neutral,
 * net +3 → the full 10° tip): falling yields + a falling dollar + high
 * stress all read for gold, inflation steady.
 */
const FOR: IndicatorReading[] = [
  reading('real-yield-10y', { value: 1.8, percentile10y: 0.5, change30d: -0.25 }),
  reading('us10y', { value: 3.9, percentile10y: 0.5, change30d: -0.3 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  quiet('yield-curve-10y2y'),
  quiet('yield-curve-10y3m'),
  reading('dollar-basket', { value: 98, percentile10y: 0.5, change30d: -1.6 }),
  reading('usdjpy', { value: 130, percentile10y: 0.08 }),
  quiet('us-japan-10y-gap'),
  reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
  reading('nfci', { value: 0.4, percentile10y: 0.95 }),
  quiet('vix'),
  quiet('gold-silver'),
  quiet('cftc-gold-positioning'),
  quiet('us-cpi-yoy'),
  quiet('us-pce-core-yoy'),
  quiet('euro-hicp'),
  quiet('breakeven-5y5y'),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.05 }),
  reading('gold-usd', { value: 4200, percentile10y: 0.6, change30d: 5.1 }),
];

/**
 * The stack case (engine-verified: 0 for · 4 against, net −4 → the full
 * 10° tip against): ALL FOUR lanes read against — the against pan holds
 * four weights (two rows) and the tray carries its empty line.
 */
const STACK: IndicatorReading[] = [
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  quiet('yield-curve-10y2y'),
  quiet('yield-curve-10y3m'),
  reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
  reading('usdjpy', { value: 155, percentile10y: 0.95 }),
  quiet('us-japan-10y-gap'),
  reading('stress-stlfsi', { value: -0.4, percentile10y: 0.05 }),
  reading('nfci', { value: -0.3, percentile10y: 0.05 }),
  quiet('vix'),
  quiet('gold-silver'),
  quiet('cftc-gold-positioning'),
  reading('us-cpi-yoy', { value: 1.2, percentile10y: 0.05 }),
  reading('us-pce-core-yoy', { value: 1.3, percentile10y: 0.05 }),
  quiet('euro-hicp'),
  quiet('breakeven-5y5y'),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.05 }),
  reading('gold-usd', { value: 4100, percentile10y: 0.6, change30d: -9.0 }),
];

/** The all-unread case (engine-verified: 4 unread, readable 0): every
 * voter stale — the level beam, the "Can't read" hero, no needle, both
 * pans carrying the shared nothing-read sentence, four dotted rims in
 * the tray. */
const ALL_UNREAD: IndicatorReading[] = [
  ...ALL_VOTERS.map((id) => reading(id, { status: 'stale', value: null })),
  reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: -4.2 }),
];

/** The sparse case (engine-verified: 1 readable lane, net −1): only
 * borrowing costs reads (against); the other three lanes unread — UI-40:
 * level beam + the not-enough verdict word, no needle. */
const SPARSE: IndicatorReading[] = [
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  quiet('yield-curve-10y2y'),
  quiet('yield-curve-10y3m'),
  ...ALL_VOTERS.slice(8).map((id) => reading(id, { status: 'stale', value: null })),
  reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: -4.2 }),
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
/** Opens a ledger row via its row button (the inline detail panel). */
const openRow = (key: string): void => {
  fireEvent.click(document.getElementById(`gold-balance-row-btn-${key}`) as HTMLButtonElement);
};

/* ------------------------------------------------------------------ *
 * §4.3 item 1 — lane weights land in the right pan or tray per side
 * ------------------------------------------------------------------ */
describe('the lane view — weight placement (04 §4.3 item 1, 05 §4.2-§4.5)', () => {
  it('a for lane weight rests on the supporting pan, against weights on the pressuring pan, a quiet lane in the "Not leaning" tray', () => {
    renderCard(DIRECTIONAL);
    const b = goldBalance(DIRECTIONAL);
    // The UI mirrors the engine exactly (AC-3: one engine, no drift).
    expect(b.counts).toEqual({ for: 1, against: 2, neutral: 1, unread: 0 });
    const forAssembly = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    const againstAssembly = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    // stress (for) on the supporting pan; borrowing-costs + dollar (against) on the pressuring pan.
    expect(forAssembly.querySelector('[data-balance-weight="stress"]')).not.toBeNull();
    expect(againstAssembly.querySelector('[data-balance-weight="borrowing-costs"]')).not.toBeNull();
    expect(againstAssembly.querySelector('[data-balance-weight="dollar"]')).not.toBeNull();
    // inflation (neutral, below the crowd minimum) in the tray — never on a pan.
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelector('[data-balance-weight="inflation"]')).not.toBeNull();
    // Exactly one weight per lane (4 total — pans + tray; the ledger rows
    // carry plain discs, not weight buttons).
    expect(document.querySelectorAll('[data-balance-weight]').length).toBe(4);
    // The beam tips against (net −1 → |−1|/3 × 10° ≈ 3.33°, the unchanged formula).
    const tilt = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    expect(tilt).toBeCloseTo(3.33, 1);
    expect(document.querySelector('[data-balance-verdict]')?.getAttribute('data-balance-verdict')).toBe('against');
    expect(document.querySelector('[data-balance-verdict-word]')?.getAttribute('data-side')).toBe('against');
  });

  it('the 2026-10-31 fixture: all four lanes neutral — no pan weights, the level beam, the "Balanced" hero, the full counts line, 4 tray weights', () => {
    renderCard(fixtureReadings());
    expect(document.querySelectorAll('[data-balance-assembly] [data-balance-weight]').length).toBe(0);
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toContain('Balanced');
    // The counts line states the whole shape (05 §4.4): for/against
    // always, not-leaning always, unread only when > 0.
    expect(document.querySelector('[data-balance-count]')?.textContent).toBe('0 for · 0 against · 4 not leaning');
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelectorAll('[data-balance-weight]').length).toBe(4);
    // The lane strip: four segments, all neutral (decorative, aria-hidden).
    const strip = document.querySelector('[data-balance-lane-strip]') as HTMLElement;
    expect(strip.getAttribute('aria-hidden')).toBe('true');
    expect(strip.querySelectorAll('i').length).toBe(4);
    expect(strip.querySelectorAll('i[data-side="neutral"]').length).toBe(4);
  });

  it('the FOR case: three weights on the supporting pan, the full 10° tip for (the signed angle is for-heavy NEGATIVE), the tray still holds the quiet lane', () => {
    renderCard(FOR);
    const forAssembly = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    expect(forAssembly.querySelectorAll('[data-balance-weight]').length).toBe(3);
    expect(Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'))).toBe(-10);
    expect(document.querySelector('[data-balance-verdict-word]')?.getAttribute('data-side')).toBe('for');
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toBe('Leaning for gold');
  });

  it('the stack case: all four weights on ONE pan (two rows) and the tray shows its empty line (05 §4.5)', () => {
    renderCard(STACK);
    const againstAssembly = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    expect(againstAssembly.querySelectorAll('[data-balance-weight]').length).toBe(4);
    expect(document.querySelector('[data-balance-assembly="for"] [data-balance-weight]')).toBeNull();
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelector('[data-balance-weight]')).toBeNull();
    expect(tray.querySelector('.bal-tray-empty')?.textContent).toBe('Every driver is on a pan.');
    expect(Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'))).toBe(10);
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
  it('shows the "Split" badge on the tray weight, the contest in the accessible name, and the ledger state word names it', () => {
    renderCard(fixtureReadings());
    const weight = document.querySelector('[data-balance-weight="borrowing-costs"]') as HTMLElement;
    expect(weight).not.toBeNull();
    expect(weight.querySelector('[data-balance-split-badge]')?.textContent).toBe('Split');
    // The single most important disclosure: contested, not empty — the
    // accessible name carries the badge word + the contest.
    expect(weight.getAttribute('aria-label')).toBe('Borrowing costs: Sitting neutral. Split, 2 for, 2 against.');
    // The ledger row's state text names the contest (05 §4.6).
    expect(document.querySelector('[data-balance-row="borrowing-costs"] .bal-row-state')?.textContent).toBe(
      'Split: 2 for, 2 against',
    );
    // The quiet lanes carry no badge and the plain tally in their ledger row.
    const dollar = document.querySelector('[data-balance-weight="dollar"]') as HTMLElement;
    expect(dollar.querySelector('[data-balance-split-badge]')).toBeNull();
    expect(document.querySelector('[data-balance-row="dollar"] [data-balance-tally]')?.textContent).toBe(
      '1 of 3 drivers firing',
    );
    expect(document.querySelector('[data-balance-row="stress"] [data-balance-tally]')?.textContent).toBe(
      'No driver firing',
    );
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 3 — the ledger rows' member lists (the detail panel, inline)
 * ------------------------------------------------------------------ */
describe('the ledger member lists (04 §4.3 item 3, 05 §4.6)', () => {
  it('the open row lists the firing members grouped Supports/Pressures with evidence, values and the indicator deep link; steady collapses to one muted sentence', () => {
    renderCard(fixtureReadings());
    openRow('borrowing-costs');
    const row = document.querySelector('[data-balance-row="borrowing-costs"]') as HTMLElement;
    const members = document.getElementById('gold-balance-row-borrowing-costs') as HTMLElement;
    expect(members.hidden).toBe(false);
    expect(row.getAttribute('data-open')).toBe('true');
    // The lane's intro sentence (laneIntro) opens the expansion.
    expect(members.textContent).toContain('The cost of borrowing dollars');
    // Grouped: the two falling yields under Supports gold, the two highs under Pressures gold.
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
    // The steady voters: collapsed to ONE muted sentence naming them (05 §4.6).
    const steady = members.querySelector('[data-balance-member-group="steady"]') as HTMLElement;
    expect(steady).not.toBeNull();
    expect(steady.querySelectorAll('[data-balance-member-impact="steady"]').length).toBe(4);
    expect(steady.textContent).toContain('Not firing (4)');
    expect(steady.textContent).toContain('Fed funds target');
    // The 21 voters are all reachable (AC-2): 8 members in this lane.
    expect(members.querySelectorAll('[data-balance-member]').length).toBe(8);
    // A closed row's expansion is hidden.
    expect(document.getElementById('gold-balance-row-dollar')?.hidden).toBe(true);
  });

  it('the inflation row shows the tilt phrase as its lane note, and the breakeven-5y5y member line shows the card status word (B-12)', () => {
    renderCard(fixtureReadings());
    openRow('inflation');
    const members = document.getElementById('gold-balance-row-inflation') as HTMLElement;
    // The fixture's breakeven-tilt reading leans fading (verified: value −0.24, change30d −0.24).
    expect(members.querySelector('[data-balance-lane-note]')?.textContent).toBe('expectations fading');
    // B-12: the breakeven-5y5y member line carries the indicator card's OWN status word
    // beside the lean phrase (the fixture's card reads Normal).
    const rowEl = members.querySelector('[data-balance-member="breakeven-5y5y"]') as HTMLElement;
    expect(rowEl.textContent).toContain('falling');
    expect(rowEl.textContent).toContain('Normal');
    // No tilt phrase on the other lanes (inflation only — 03 §3 item 5).
    openRow('dollar');
    expect(document.getElementById('gold-balance-row-dollar')?.querySelector('[data-balance-lane-note]')).toBeNull();
  });

  it('an unread member group renders only when a voter could not be read', () => {
    // Clone the fixture with two borrowing-costs voters turned stale.
    const readings = fixtureReadings().map((r) =>
      r.id === 'ecb-dfr' || r.id === 'yield-curve-10y2y' ? { ...r, status: 'stale' as const, value: null } : r,
    );
    renderCard(readings);
    openRow('borrowing-costs');
    const members = document.getElementById('gold-balance-row-borrowing-costs') as HTMLElement;
    const unread = members.querySelector('[data-balance-member-group="unread"]') as HTMLElement;
    expect(unread).not.toBeNull();
    expect(unread.textContent).toContain('Could not be read (2)');
    expect(unread.querySelectorAll('[data-balance-member-impact="unread"]').length).toBe(2);
    // The clean fixture has no unread group.
    cleanup();
    renderCard(fixtureReadings());
    openRow('borrowing-costs');
    expect(
      document.getElementById('gold-balance-row-borrowing-costs')?.querySelector('[data-balance-member-group="unread"]'),
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
      openRow('inflation');
      const rowEl = document.querySelector('[data-balance-member="breakeven-5y5y"]') as HTMLElement;
      expect(rowEl.textContent).toContain('falling');
      if (name === 'warning card') {
        expect(rowEl.textContent).toContain('Needs attention');
      } else {
        expect(rowEl.textContent).toContain('Normal');
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
describe('the context pill (04 §4.3 item 5, 05 §4.4)', () => {
  it("renders gold's 30-day move as context inside the verdict block, never counted; hidden when the value is missing", () => {
    renderCard(DIRECTIONAL);
    const pill = document.querySelector('[data-balance-context-line]') as HTMLElement;
    const expected = formatChange(5.2, 'pct', 'en-US', copy.units);
    expect(pill.textContent).toBe(`Gold over the last 30 days: ${expected}. Shown for context, not counted in the balance.`);
    // The pill is part of the verdict block (05 §4.4).
    expect(document.querySelector('[data-balance-verdict]')?.contains(pill)).toBe(true);
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
 * GB-S4 — the visual stage geometry (05 §4.2), pure
 * ------------------------------------------------------------------ */
describe('the visual stage geometry (GB-S4, 05 §4.2)', () => {
  it('the size steps read the balance root\'s width: <560 s, 560-759 m, >=760 l; the stage caps at 720', () => {
    expect(balanceVisualSizeOf(326)).toBe('s');
    expect(balanceVisualSizeOf(559)).toBe('s');
    expect(balanceVisualSizeOf(560)).toBe('m');
    expect(balanceVisualSizeOf(759)).toBe('m');
    expect(balanceVisualSizeOf(760)).toBe('l');
    expect(balanceVisualSizeOf(1200)).toBe('l');
    expect(balanceVisualMetrics(1200).stageWidth).toBe(720);
    expect(balanceVisualMetrics(700).stageWidth).toBe(700);
  });

  it('the metrics: pan width, pin-to-pin length, the swing envelope and the height reserve (never data-dependent)', () => {
    // At the 720-wide stage the pan is min(280, 38%) = 273.6 → 274 (the
    // cap only bites on a hypothetical >737px stage — the stage caps at 720).
    const m = balanceVisualMetrics(760);
    expect(m.stageWidth).toBe(720);
    expect(m.pw).toBe(274);
    expect(m.L).toBe(446);
    expect(m.swing).toBeCloseTo((446 / 2) * Math.sin((10 * Math.PI) / 180), 5);
    expect(m.hanger).toBe(Math.round(m.swing + 22));
    expect(m.stageH).toBe(Math.round(m.pivotY + m.hanger + m.panH + m.swing + 40));
    const s = balanceVisualMetrics(326);
    expect(s.pw).toBe(Math.round(326 * 0.46));
    expect(s.pivotY).toBe(56);
    // 05 §4.2's 236/268 targets, tuned for the measured worst case (the
    // two-line EN/fa captions + four weights in two rows) — never clips.
    expect(s.panH).toBe(256);
    expect(balanceVisualMetrics(760).panH).toBe(280);
  });

  it('two pan weights + the column gap always fit the pan\'s inner width (the stack scenario, every s-size width)', () => {
    for (const w of [280, 300, 320, 326, 340, 360, 400, 440, 500, 540, 559]) {
      const m = balanceVisualMetrics(w);
      expect(2 * m.weightW + 8, `width ${w}`).toBeLessThanOrEqual(m.pw - 12);
      expect(m.discPx, `width ${w}`).toBeLessThanOrEqual(58);
    }
  });

  it('the frame: the heavy side drops, the pans translate only vertically, the needle is the 3x readout clamped to ±32', () => {
    const m = balanceVisualMetrics(720);
    const f = balanceVisualFrame(m, 6.67, false);
    expect(f.beamDeg).toBe(6.67);
    expect(f.againstDrop).toBeGreaterThan(0);
    expect(f.forDrop).toBeCloseTo(-f.againstDrop, 6);
    expect(f.forCentreX + f.againstCentreX).toBe(m.stageWidth); // the symmetric rest columns
    expect(f.needleDeg).toBeCloseTo(6.67 * 3, 6);
    // The clamp protects the formula (the beam itself never exceeds ±10°).
    expect(balanceVisualFrame(m, 12, false).needleDeg).toBe(32);
    expect(balanceVisualFrame(m, -12, false).needleDeg).toBe(-32);
  });

  it('RTL: ONLY the visual sign flips — the physical drops are direction-free and the columns swap', () => {
    const m = balanceVisualMetrics(720);
    const radOf6 = (6 * Math.PI) / 180;
    const ltrF = balanceVisualFrame(m, 6, false);
    const rtlF = balanceVisualFrame(m, 6, true);
    expect(rtlF.beamDeg).toBe(-6);
    // The PHYSICAL drops are identical across directions (the for pan rises
    // when against is heavy, whichever column it hangs from) — the two
    // computation paths differ only in the last ULP.
    expect(rtlF.forDrop).toBeCloseTo(ltrF.forDrop, 9);
    expect(rtlF.againstDrop).toBeCloseTo(ltrF.againstDrop, 9);
    expect(ltrF.againstDrop).toBeGreaterThan(0);
    expect(ltrF.forDrop).toBeCloseTo(-ltrF.againstDrop, 9);
    expect(rtlF.forCentreX).toBe(ltrF.againstCentreX);
    // The for JOINT is the rotated beam end on the right half (it arcs by
    // (L/2)·cos off its rest column — the real-hanging cue).
    expect(rtlF.forJoint.x).toBeGreaterThan(m.stageWidth / 2);
    expect(rtlF.forJoint.x).toBeCloseTo(m.stageWidth / 2 + (m.L / 2) * Math.cos(radOf6), 6);
  });
});

/* ------------------------------------------------------------------ *
 * GB-S4 — the segmented rim (05 §4.3, V-4)
 * ------------------------------------------------------------------ */
describe('the segmented rim (GB-S4, 05 §4.3 + V-4)', () => {
  it('one segment per member, sorted supports → pressures → steady → unread; firing strokes thicker; unread dotted', () => {
    const segs = balanceRimSegments([
      { impact: 'steady' },
      { impact: 'supports' },
      { impact: 'unread' },
      { impact: 'pressures' },
      { impact: 'supports' },
    ]);
    expect(segs.length).toBe(5);
    expect(segs.map((s) => s.impact)).toEqual(['supports', 'supports', 'pressures', 'steady', 'unread']);
    expect(segs[0]?.strokeWidth).toBe(4.2);
    expect(segs[2]?.strokeWidth).toBe(4.2);
    expect(segs[3]?.strokeWidth).toBe(3);
    expect(segs[4]?.dotted).toBe(true);
    expect(segs.slice(0, 4).every((s) => !s.dotted)).toBe(true);
    // Every segment is a real arc on the 60×60 disc.
    for (const s of segs) expect(s.d).toMatch(/^M [\d.-]+ [\d.-]+ A 27 27 0 0 1 /);
    expect(balanceRimSegments([])).toEqual([]);
  });

  it('the rendered rim matches the ledger counts on the recorded fixture (V-4)', () => {
    renderCard(fixtureReadings());
    // borrowing-costs: 2 supports, 2 pressures, 4 steady — 8 members (engine-verified).
    const weight = document.querySelector('[data-balance-weight="borrowing-costs"]') as HTMLElement;
    expect(weight.querySelectorAll('[data-bal-seg]').length).toBe(8);
    expect(weight.querySelectorAll('[data-bal-seg="supports"]').length).toBe(2);
    expect(weight.querySelectorAll('[data-bal-seg="pressures"]').length).toBe(2);
    expect(weight.querySelectorAll('[data-bal-seg="steady"]').length).toBe(4);
    // The ledger row's open list agrees — the rim is a picture of the same counts.
    openRow('borrowing-costs');
    const members = document.getElementById('gold-balance-row-borrowing-costs') as HTMLElement;
    expect(members.querySelectorAll('[data-balance-member-impact="supports"]').length).toBe(2);
    expect(members.querySelectorAll('[data-balance-member-impact="pressures"]').length).toBe(2);
    expect(members.querySelectorAll('[data-balance-member-impact="steady"]').length).toBe(4);
  });

  it('brass faces on the pans, stone faces in the tray (neutral and unread weigh stone)', () => {
    renderCard(DIRECTIONAL);
    const panWeight = document.querySelector('[data-balance-assembly="against"] [data-balance-weight="borrowing-costs"]') as HTMLElement;
    expect(panWeight.querySelector('.bal-disc-face circle')?.getAttribute('fill')).toBe('url(#bal-face-brass)');
    const trayWeight = document.querySelector('[data-balance-tray] [data-balance-weight="inflation"]') as HTMLElement;
    expect(trayWeight.querySelector('.bal-disc-face circle')?.getAttribute('fill')).toBe('url(#bal-face-stone)');
  });
});

/* ------------------------------------------------------------------ *
 * GB-S4 — the verdict block + the states (05 §4.4, §8)
 * ------------------------------------------------------------------ */
describe('the verdict block and the states (GB-S4, 05 §4.4 + §8)', () => {
  it('the eyebrow renders over the instrument and the verdict eyebrow over the hero word', () => {
    renderCard(fixtureReadings());
    expect(document.querySelector('[data-balance-eyebrow]')?.textContent).toBe('Gold · today’s conditions');
    const verdict = document.querySelector('.bal-verdict') as HTMLElement;
    expect(verdict.querySelector('.bal-verdict-eyebrow')?.textContent).toBe('Today’s lean');
  });

  it('the counts line appends the unread part only when > 0 (all-unread: "0 for · 0 against · 0 not leaning · 4 unread")', () => {
    renderCard(ALL_UNREAD);
    expect(document.querySelector('[data-balance-count]')?.textContent).toBe(
      '0 for · 0 against · 0 not leaning · 4 unread',
    );
  });

  it('all four lanes unread: level beam, the "Can\'t read" hero in primary ink, no needle, both pans carry the shared nothing-read sentence, four dotted rims in the tray', () => {
    renderCard(ALL_UNREAD);
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
    const word = document.querySelector('[data-balance-verdict-word]') as HTMLElement;
    expect(word.textContent).toContain("Can't read the conditions right now");
    expect(word.getAttribute('data-side')).toBeNull();
    expect(document.querySelector('[data-balance-needle]')).toBeNull();
    for (const side of ['for', 'against'] as const) {
      expect(document.querySelector(`[data-balance-empty="${side}"]`)?.textContent).toBe(
        'Nothing could be read yet, so neither side has been weighed.',
      );
    }
    const trayWeights = document.querySelectorAll('[data-balance-tray] [data-balance-weight]');
    expect(trayWeights.length).toBe(4);
    for (const w of trayWeights) {
      const segs = w.querySelectorAll('[data-bal-seg]');
      expect(segs.length).toBeGreaterThan(0);
      for (const seg of segs) expect(seg.getAttribute('data-bal-seg')).toBe('unread');
    }
  });

  it('fewer than 3 readable lanes: level beam + the not-enough sentence AS the verdict word, no needle (UI-40 held through the redesign)', () => {
    renderCard(SPARSE);
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toBe(
      'Not enough readable conditions to weigh',
    );
    expect(document.querySelector('[data-balance-verdict-word]')?.getAttribute('data-side')).toBeNull();
    expect(document.querySelector('[data-balance-needle]')).toBeNull();
  });

  it('the pan captions render inside the pans in the side\'s readable ink (the caption keys unchanged)', () => {
    renderCard(DIRECTIONAL);
    const forCap = document.querySelector('[data-balance-pan="for"] .bal-pan-cap') as HTMLElement;
    expect(forCap.textContent).toContain('Factors supporting gold’s price');
    const againstCap = document.querySelector('[data-balance-pan="against"] .bal-pan-cap') as HTMLElement;
    expect(againstCap.textContent).toContain('Factors pressuring gold’s price');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 9 — RTL
 * ------------------------------------------------------------------ */
describe('RTL (04 §4.3 item 9)', () => {
  /** The pan assembly's plumb drop — parse the SECOND translate argument
   * (the first is always 0px: the pan never moves horizontally). */
  const panDropOf = (el: HTMLElement): number =>
    Number(el.style.transform.match(/translate\(0px, (-?[\d.]+)px\)/)?.[1] ?? 0);

  it('the pan sides mirror (the for pan hangs from the RIGHT beam end) and the heavy side still drops — the physical sign is direction-free', () => {
    // LTR first: the for joint is the LEFT beam end, the against-heavy beam tips the
    // against (right) pan down.
    renderCard(DIRECTIONAL);
    const tiltLtr = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    const dropAgainstLtr = panDropOf(document.querySelector('[data-balance-assembly="against"]') as HTMLElement);
    const dropForLtr = panDropOf(document.querySelector('[data-balance-assembly="for"]') as HTMLElement);
    expect(tiltLtr).toBeGreaterThan(0);
    expect(dropAgainstLtr).toBeGreaterThan(0);
    expect(dropForLtr).toBeLessThan(0);
    cleanup();
    // fa: the SAME physical angle drives the drops (data-tilt identical); the for
    // joint is now the RIGHT beam end (the drawing mirrors with the document).
    renderCard(DIRECTIONAL, { locale: 'fa-IR', c: copyFa });
    const tiltRtl = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    expect(tiltRtl).toBe(tiltLtr);
    expect(panDropOf(document.querySelector('[data-balance-assembly="against"]') as HTMLElement)).toBe(dropAgainstLtr);
    expect(panDropOf(document.querySelector('[data-balance-assembly="for"]') as HTMLElement)).toBe(dropForLtr);
    // The for hangers meet the beam end on the RIGHT half of the stage in RTL
    // (the pre-measurement default geometry: the 720-wide stage, cx = 360).
    const forHangerX = Number(document.querySelector('[data-balance-hanger="for-start"]')?.getAttribute('x1'));
    expect(forHangerX).toBeGreaterThan(360);
    // The for ASSEMBLY itself sits on the right half (the mirrored column).
    const forLeft = Number((document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.left.replace('px', ''));
    expect(forLeft).toBeGreaterThan(360);
    // Persian digits render in the ledger tally (the locale formatter) — the
    // dollar lane reads against on this fixture: 2 of its 3 voters firing.
    expect(document.querySelector('[data-balance-row="dollar"] [data-balance-tally]')?.textContent).toBe(
      '۲ مورد از ۳ عامل فعال است',
    );
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
    ['verdictCountFor', ['{n}']],
    ['verdictCountAgainst', ['{n}']],
    ['verdictCountNotLeaning', ['{n}']],
    ['verdictCountUnread', ['{n}']],
    ['laneStateSplit', ['{supports}', '{pressures}']],
  ];
  const NEW_PLAIN_KEYS: Array<keyof typeof copy.signals.balance> = [
    'subtitleLanes',
    'laneTallyNone',
    'splitBadge',
    'memberSupports',
    'memberPressures',
    'memberOpenIndicator',
    'measuredNote',
    // GB-S4 (05 §11): the visual redesign's own keys.
    'eyebrow',
    'verdictEyebrow',
    'trayTitle',
    'trayNote',
    'trayEmpty',
    'laneStateFor',
    'laneStateAgainst',
    'laneStateNeutral',
    'laneStateUnread',
  ];
  for (const [name, c] of [['en', copy], ['fa', copyFa]] as const) {
    it(`${name}: every new lane key is non-empty with its placeholders intact; no em dashes in fa`, () => {
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
        expect(b.eyebrow).toContain('Gold');
        expect(b.verdictEyebrow).toContain('lean');
      } else {
        expect(b.subtitleLanes).toContain('پیش‌بینی نیست');
        expect(b.measuredNote).toContain('رابطهٔ مثبتی');
        expect(b.measuredNote).not.toContain('باد');
        expect(b.eyebrow).toContain('طلا');
        expect(b.verdictEyebrow).toContain('گرایش');
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
 * §4.3 item 12 — keyboard: weights + ledger rows
 * ------------------------------------------------------------------ */
describe('keyboard (04 §4.3 item 12, 05 §4.3/§4.6)', () => {
  it('a weight opens its ledger row and focus lands on the row button; the row button closes it; one row open at a time', () => {
    renderCard(fixtureReadings());
    const weight = document.querySelector('[data-balance-weight="borrowing-costs"]') as HTMLButtonElement;
    expect(weight.tagName).toBe('BUTTON'); // keyboard-reachable by construction (Enter/Space activate buttons)
    weight.focus();
    expect(document.activeElement).toBe(weight);
    // Button activation (Enter/Space synthesize click per the HTML spec — jsdom tests the handler path).
    fireEvent.click(weight);
    const rowBtn = document.getElementById('gold-balance-row-btn-borrowing-costs') as HTMLButtonElement;
    expect(rowBtn.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('gold-balance-row-borrowing-costs')?.hidden).toBe(false);
    // The weight's own aria-expanded reflects the row it controls; focus
    // moved to the row button (the pending-focus effect).
    expect(weight.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(rowBtn);
    // Close from the row button: the expansion hides, focus stays on the toggle.
    fireEvent.click(rowBtn);
    expect(rowBtn.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('gold-balance-row-borrowing-costs')?.hidden).toBe(true);
    expect(document.activeElement).toBe(rowBtn);
    // Opening another row swaps the expansion (one open at a time).
    fireEvent.click(rowBtn);
    const dollarBtn = document.getElementById('gold-balance-row-btn-dollar') as HTMLButtonElement;
    fireEvent.click(dollarBtn);
    expect(document.getElementById('gold-balance-row-borrowing-costs')?.hidden).toBe(true);
    expect(document.getElementById('gold-balance-row-dollar')?.getAttribute('data-balance-detail')).toBe('dollar');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 13 — the legacy default rendering, byte-for-byte
 * ------------------------------------------------------------------ */
describe('the legacy default rendering (04 §4.3 item 13)', () => {
  it('without the flag: the two gold panels stay, the balance keeps the legacy condition chips, no lane view renders', () => {
    renderCard(fixtureReadings(), { balanceLanes: false });
    // The two panels stay under the balance (they retire from the DEFAULT view only at P5/GB-S6).
    expect(document.querySelector('[data-gold-panels]')).not.toBeNull();
    expect(document.querySelector('#insights-gold-tailwind')).not.toBeNull();
    // The legacy condition chips (not lanes) drive the balance.
    expect(document.querySelector('[data-balance-tile="real-yield"]')).not.toBeNull();
    expect(document.querySelector('[data-balance-weight="borrowing-costs"]')).toBeNull();
    expect(document.querySelector('[data-balance-row="borrowing-costs"]')).toBeNull();
    // None of the lane-view elements render.
    expect(document.querySelector('[data-balance-context-line]')).toBeNull();
    expect(document.querySelector('[data-balance-measured-note]')).toBeNull();
    expect(document.querySelector('[data-balance-split-badge]')).toBeNull();
    expect(document.querySelector('[data-balance-tally]')).toBeNull();
    expect(document.querySelector('[data-balance-visual]')).toBeNull();
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
 * The BalanceScale `visual` prop — the branch boundary itself
 * ------------------------------------------------------------------ */
describe('the visual prop boundary (GB-S4)', () => {
  it('BalanceScale with visual renders the redesign root; without it the legacy markup (never both)', () => {
    const drivers = [
      {
        key: 'borrowing-costs',
        label: 'Borrowing costs',
        detail: 'intro',
        valueText: null,
        state: 'neutral' as const,
        split: true,
        tally: '2 for, 2 against',
        members: [
          { key: 'real-yield-10y', label: 'Real yields', impact: 'supports' as const, evidenceText: 'falling', valueText: null },
          { key: 'us10y', label: 'US 10-year yield', impact: 'supports' as const, evidenceText: 'falling', valueText: null },
          { key: 'us30y', label: 'US 30-year yield', impact: 'pressures' as const, evidenceText: 'high', valueText: null },
          { key: 'fed-target', label: 'Fed funds target', impact: 'pressures' as const, evidenceText: 'high', valueText: null },
        ],
      },
    ];
    const { unmount } = render(
      <BalanceScale drivers={drivers} copy={copy} numberLocale="en-US" visual />,
    );
    expect(document.querySelector('[data-balance-visual]')).not.toBeNull();
    expect(document.querySelector('[data-balance-visual]')?.getAttribute('data-size')).toBe('l');
    unmount();
    render(<BalanceScale drivers={drivers} copy={copy} numberLocale="en-US" />);
    expect(document.querySelector('[data-balance-visual]')).toBeNull();
    // The neutral lane driver renders as the legacy TRAY CHIP (the tiles are
    // for pan drivers) — the legacy markup, not the redesign.
    expect(document.querySelector('[data-balance-chip="borrowing-costs"]')).not.toBeNull();
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
