/**
 * @vitest-environment jsdom
 *
 * signals/gold-balance-lanes.test.tsx — the gold balance consolidation's
 * component tests: the consolidated LANE balance — THE gold card for
 * every visitor since the GB-S6 flip (the ?balance=lanes preview flag,
 * the `visual` prop, the legacy branch and the two gold panels RETIRED
 * with it; the GB-S4 visual redesign is the one balance — the lane
 * WEIGHTS on brass pans, the verdict block as the hero, the
 * "Not leaning" tray and the four-row inline LEDGER; 04 §4.3 items
 * 1-7, 9, 11 re-pinned to the new anatomy + the flipped view's fresh
 * byte-stability snapshot):
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
 * GB-S5 (P3) adds: the gold Outlook DERIVED from the balance (01 §5.2
 * — the strip's gold leg reads goldOutlookOf(goldBalance(readings))
 * behind the flag; the never-opposing matrix + the footing-decoupling
 * DOM pin (AC-7) + the doctored-conditions pin (AC-4); the collapsed
 * gold takeaway rides the same engine under the flag (AC-3)).
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
import { GOLD_LANES, GOLD_LANE_VOTERS, goldBalance, type SignalReading } from '@currena/insights';
import { evaluateSignal } from '@currena/insights';
import { MergedSignalsCard } from './MergedCard';
import { BalanceScale, balanceVisualFrame, balanceVisualMetrics, balanceVisualSizeOf } from './BalanceScale';
import { balanceRimSegments } from './BalanceWeight';
import { goldOutlookOf, outlookOf } from './verdict';
import { Signals } from '../Signals';
import { PricesBoard } from '../PricesBoard';
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

/** Every one of the 37 voters (the lane ids in table order — GF-S10,
 * 2026-11-06, the standing delegation: GF-P2's twelve promotions + the
 * COBD pair + the flows pair + GF-P3's four FRED-sourced voters + GF-S10's
 * I4 household anchor; the two yield-curve seats stay demoted), for the
 * synthetic fixtures' shared quiet rows. */
const ALL_VOTERS: IndicatorId[] = [
  'real-yield-10y',
  'us10y',
  'us30y',
  'fed-target',
  'fed-expectations',
  'ecb-dfr',
  'dollar-basket',
  'usdjpy',
  'us-japan-10y-gap',
  'usd-reserve-share',
  'nyfed-custody',
  'stress-stlfsi',
  'nfci',
  'vix',
  'gold-silver',
  'term-premium-10y',
  'ebp',
  'michigan-sentiment',
  'gpr-daily',
  'epu-us',
  'sp500-breadth-ratio',
  'us-cpi-yoy',
  'us-pce-core-yoy',
  'euro-hicp',
  'breakeven-5y5y',
  'breakeven-tilt',
  't5yie',
  'michigan-1y-expectations',
  'm2-us',
  'us-deficit-12m',
  'cftc-gold-positioning',
  'cftc-gold-gross-long',
  // GF-P3 (2026-11-06, the standing delegation — audit §4 ranks 19–21, 28):
  // the four FRED-sourced voters (real-yield-5y in borrowing-costs,
  // dollar-broad + dollar-eme in dollar, bank-stress in stress).
  'real-yield-5y',
  'dollar-broad',
  'dollar-eme',
  'bank-stress',
  // GF-S10 (2026-11-06, the standing delegation — audit §4 rank 32, the
  // MEASURED POST-P4-5LANE scenario): the I4 5–10y household anchor joins
  // the inflation lane (its last seat, the table order).
  'michigan-5y-expectations',
];

/** A quiet (steady, typical) row for a voter. */
const quiet = (id: IndicatorId): IndicatorReading => reading(id, { value: 1, percentile10y: 0.5 });

/**
 * The one-sided case: borrowing costs (2 decade-high yields) and the
 * dollar (2 decade-high) read AGAINST, market stress (2 decade-high
 * indexes) reads FOR, inflation and the flows lane read steady — 1 for ·
 * 2 against · 2 neutral (engine-verified), so both pans carry lane weights
 * and the beam tips against at |−1|/3 × 10° ≈ 3.33°.
 * GF-P2 (the owner's recorded answers B/C/K): the thirteen promoted seats
 * join as quiet rows — the five-lane shape.
 */
const DIRECTIONAL: IndicatorReading[] = [
  // borrowing costs: two firing pressures (decade-high levels)
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  // GF-P1 (the owner's recorded H): the yield-curve seats demoted — no rows.
  // dollar: two firing pressures
  reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
  reading('usdjpy', { value: 155, percentile10y: 0.95 }),
  quiet('us-japan-10y-gap'),
  quiet('usd-reserve-share'),
  quiet('nyfed-custody'),
  // stress: two firing supports
  reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
  reading('nfci', { value: 0.4, percentile10y: 0.95 }),
  quiet('vix'),
  quiet('gold-silver'),
  quiet('term-premium-10y'),
  quiet('ebp'),
  quiet('michigan-sentiment'),
  quiet('gpr-daily'),
  quiet('epu-us'),
  quiet('sp500-breadth-ratio'),
  // inflation: readable, steady
  quiet('us-cpi-yoy'),
  quiet('us-pce-core-yoy'),
  quiet('euro-hicp'),
  quiet('breakeven-5y5y'),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.1 }),
  quiet('t5yie'),
  quiet('michigan-1y-expectations'),
  quiet('m2-us'),
  quiet('us-deficit-12m'),
  // flows: readable, steady (GF-P2's new lane — the CFTC pair)
  quiet('cftc-gold-positioning'),
  quiet('cftc-gold-gross-long'),
  // GF-P3 (the standing delegation): the four FRED-sourced voters as quiet
  // rows — the synthetic fixture's lanes stay readable, the new seats fire
  // nowhere on this case (DIRECTIONAL: 1 for · 2 against · 2 neutral).
  quiet('real-yield-5y'),
  quiet('dollar-broad'),
  quiet('dollar-eme'),
  quiet('bank-stress'),
  // GF-S10 (the standing delegation): the I4 household anchor as a quiet
  // row — the inflation lane stays readable and steady on this case.
  quiet('michigan-5y-expectations'),
  // gold itself: context only
  reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: 5.2 }),
];

/**
 * The leaning-FOR case (engine-verified: 3 for · 0 against · 2 neutral,
 * net +3 → the full 10° tip): falling yields + a falling dollar + high
 * stress all read for gold, inflation and flows steady.
 */
const FOR: IndicatorReading[] = [
  reading('real-yield-10y', { value: 1.8, percentile10y: 0.5, change30d: -0.25 }),
  reading('us10y', { value: 3.9, percentile10y: 0.5, change30d: -0.3 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  // GF-P1 (the owner's recorded H): the yield-curve seats demoted — no rows.
  reading('dollar-basket', { value: 98, percentile10y: 0.5, change30d: -1.6 }),
  reading('usdjpy', { value: 130, percentile10y: 0.08 }),
  quiet('us-japan-10y-gap'),
  quiet('usd-reserve-share'),
  quiet('nyfed-custody'),
  reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
  reading('nfci', { value: 0.4, percentile10y: 0.95 }),
  quiet('vix'),
  quiet('gold-silver'),
  quiet('term-premium-10y'),
  quiet('ebp'),
  quiet('michigan-sentiment'),
  quiet('gpr-daily'),
  quiet('epu-us'),
  quiet('sp500-breadth-ratio'),
  quiet('us-cpi-yoy'),
  quiet('us-pce-core-yoy'),
  quiet('euro-hicp'),
  quiet('breakeven-5y5y'),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.05 }),
  quiet('t5yie'),
  quiet('michigan-1y-expectations'),
  quiet('m2-us'),
  quiet('us-deficit-12m'),
  quiet('cftc-gold-positioning'),
  quiet('cftc-gold-gross-long'),
  // GF-P3 (the standing delegation): the four FRED-sourced voters as quiet
  // rows — the FOR case's 3-0-2 shape holds (3 for · 0 against · 2 neutral).
  quiet('real-yield-5y'),
  quiet('dollar-broad'),
  quiet('dollar-eme'),
  quiet('bank-stress'),
  // GF-S10 (the standing delegation): the I4 household anchor as a quiet
  // row — the FOR shape holds (3 for · 0 against · 2 neutral).
  quiet('michigan-5y-expectations'),
  reading('gold-usd', { value: 4200, percentile10y: 0.6, change30d: 5.1 }),
];

/**
 * The stack case (engine-verified: 0 for · 5 against, net −5 → the full
 * 10° tip against): ALL FIVE lanes read against — GF-P2's restatement: the
 * new seats fire on the against side of their polarities (the flows
 * pair's crowded highs pressure) — the against pan holds five weights
 * (two rows) and the tray carries its empty line.
 */
const STACK: IndicatorReading[] = [
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  // GF-P1 (the owner's recorded H): the yield-curve seats demoted — no rows.
  reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
  reading('usdjpy', { value: 155, percentile10y: 0.95 }),
  quiet('us-japan-10y-gap'),
  reading('usd-reserve-share', { value: 58, percentile10y: 0.95 }), // GF-P2 (C): D5 — a rising USD share pressures
  reading('nyfed-custody', { value: 3.4e6, percentile10y: 0.95 }), // GF-P2 (K): G4 — rising custody pressures
  reading('stress-stlfsi', { value: -0.4, percentile10y: 0.05 }),
  reading('nfci', { value: -0.3, percentile10y: 0.05 }),
  quiet('vix'),
  quiet('gold-silver'),
  reading('term-premium-10y', { value: -1.2, percentile10y: 0.05 }), // GF-P2 (K): R9 — a low term premium pressures (polarity +1)
  reading('ebp', { value: -0.3, percentile10y: 0.05 }), // GF-P2 (K): S4 — easy credit pressures
  reading('michigan-sentiment', { value: 72, percentile10y: 0.95 }), // GF-P2 (K): S13 — optimism pressures (polarity −1)
  reading('gpr-daily', { value: 0.2, percentile10y: 0.05 }), // GF-P2 (K): S7 — a calm world pressures
  reading('epu-us', { value: 60, percentile10y: 0.05 }), // GF-P2 (K): S8 — low uncertainty pressures
  reading('sp500-breadth-ratio', { value: 0.4, percentile10y: 0.95 }), // GF-P2 (C): S6 — narrow breadth pressures (polarity −1)
  reading('us-cpi-yoy', { value: 1.2, percentile10y: 0.05 }),
  reading('us-pce-core-yoy', { value: 1.3, percentile10y: 0.05 }),
  quiet('euro-hicp'),
  quiet('breakeven-5y5y'),
  reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.05 }),
  reading('t5yie', { value: 2.1, percentile10y: 0.05 }), // GF-P2 (K): R8 — cooling expectations pressure
  reading('michigan-1y-expectations', { value: 2.4, percentile10y: 0.05 }), // GF-P2 (K): I3
  reading('m2-us', { value: 21e12, percentile10y: 0.05 }), // GF-P2 (K): I7 — a shrinking money stock pressures
  reading('us-deficit-12m', { value: 1.1e12, percentile10y: 0.05 }), // GF-P2 (K): G1 — a narrowing deficit pressures
  reading('cftc-gold-positioning', { value: 60, percentile10y: 0.95 }), // GF-P2 (B): F1 — crowded net longs pressure
  reading('cftc-gold-gross-long', { value: 66, percentile10y: 0.95 }), // GF-P2 (K): F2 — crowded gross longs pressure
  // GF-P3 (the standing delegation): the four FRED-sourced voters fire on
  // the against side of their polarities (STACK: 0 for · 5 against).
  reading('real-yield-5y', { value: 2.4, percentile10y: 0.95 }), // high real yield pressures (polarity −1)
  reading('dollar-broad', { value: 130, percentile10y: 0.95 }), // a strong broad dollar pressures (polarity −1)
  reading('dollar-eme', { value: 130, percentile10y: 0.95 }), // a strong EME dollar pressures (polarity −1)
  reading('bank-stress', { value: 0.1, percentile10y: 0.05 }), // a calm funding market pressures (polarity +1)
  // GF-S10 (the standing delegation): the I4 anchor fires on the against
  // side — a low 5–10y household anchor pressures (polarity +1, the I3
  // precedent's level-leg-only read).
  reading('michigan-5y-expectations', { value: 2.2, percentile10y: 0.05 }),
  reading('gold-usd', { value: 4100, percentile10y: 0.6, change30d: -9.0 }),
];

/** The all-unread case (engine-verified: 5 unread, readable 0): every
 * voter stale — the level beam, the "Can't read" hero, no needle, both
 * pans carrying the shared nothing-read sentence, five dotted rims in
 * the tray (GF-P2's five-lane set). */
const ALL_UNREAD: IndicatorReading[] = [
  ...ALL_VOTERS.map((id) => reading(id, { status: 'stale', value: null })),
  reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: -4.2 }),
];

/** The sparse case (engine-verified: 1 readable lane, net −1): only
 * borrowing costs reads (against); the other four lanes unread — UI-40:
 * level beam + the not-enough verdict word, no needle. */
const SPARSE: IndicatorReading[] = [
  reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
  reading('us10y', { value: 4.6, percentile10y: 0.95 }),
  quiet('us30y'),
  quiet('fed-target'),
  quiet('fed-expectations'),
  quiet('ecb-dfr'),
  // GF-P1 (the owner's recorded H): the yield-curve seats demoted — no rows.
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
 * evaluateSignal the page runs) — the consolidated lane balance IS the
 * card since the GB-S6 flip (the flag retired). A stray fetch must fail
 * loudly — the card makes NO network request of its own (the charts'
 * history fetches reject). */
function renderCard(
  readings: readonly IndicatorReading[],
  opts: { locale?: 'en-US' | 'fa-IR'; c?: typeof copy } = {},
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
    // GF-P2 (B/C/K): five lanes — inflation AND the flows pair sit in the tray.
    expect(b.counts).toEqual({ for: 1, against: 2, neutral: 2, unread: 0 });
    const forAssembly = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    const againstAssembly = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    // stress (for) on the supporting pan; borrowing-costs + dollar (against) on the pressuring pan.
    expect(forAssembly.querySelector('[data-balance-weight="stress"]')).not.toBeNull();
    expect(againstAssembly.querySelector('[data-balance-weight="borrowing-costs"]')).not.toBeNull();
    expect(againstAssembly.querySelector('[data-balance-weight="dollar"]')).not.toBeNull();
    // inflation + flows (neutral, below the crowd minimum) in the tray — never on a pan.
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelector('[data-balance-weight="inflation"]')).not.toBeNull();
    expect(tray.querySelector('[data-balance-weight="flows"]')).not.toBeNull();
    // Exactly one weight per lane (5 total — pans + tray; the ledger rows
    // carry plain discs, not weight buttons).
    expect(document.querySelectorAll('[data-balance-weight]').length).toBe(5);
    // The beam tips against (net −1 → |−1|/3 × 10° ≈ 3.33°, the unchanged formula).
    const tilt = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    expect(tilt).toBeCloseTo(3.33, 1);
    expect(document.querySelector('[data-balance-verdict]')?.getAttribute('data-balance-verdict')).toBe('against');
    expect(document.querySelector('[data-balance-verdict-word]')?.getAttribute('data-side')).toBe('against');
  });

  it('the 2026-10-31 fixture: borrowing-costs FOR — one pan weight, the tipped beam, the "Leaning for gold" hero, the full counts line (4 not leaning · 1 unread), 4 tray weights', () => {
    // GF-P1 (2026-11-05, the owner's recorded answers H/I/J) restated the
    // recorded fixture once; GF-P2 (the owner's recorded answers B/C/K)
    // restates it again: the twelve promoted seats' readings are absent from
    // the 2026-10-31 archive (unread members, never a guess); t5yie fires on
    // J's P1 threshold (R8's promotion) flipping inflation to a 1v1 split;
    // the flows lane reads unread (the D-18 inputless cftc member + the
    // absent gross-long seat).
    // Engine-verified: for 1 · against 0 · neutral 3 · unread 1, net +1 over
    // 1 tipped → the full 10° tip for.
    renderCard(fixtureReadings());
    const b = goldBalance(fixtureReadings());
    expect(b.counts).toEqual({ for: 1, against: 0, neutral: 3, unread: 1 });
    expect(
      document.querySelector('[data-balance-assembly="for"] [data-balance-weight="borrowing-costs"]'),
    ).not.toBeNull();
    expect(document.querySelectorAll('[data-balance-assembly="against"] [data-balance-weight]').length).toBe(0);
    expect(Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'))).toBe(-10);
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toBe('Leaning for gold');
    // The counts line states the whole shape (05 §4.4): for/against
    // always, not-leaning always, unread only when > 0 — the flows lane's
    // unread part renders (GF-P2).
    expect(document.querySelector('[data-balance-count]')?.textContent).toBe('1 for · 0 against · 3 not leaning · 1 unread');
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelectorAll('[data-balance-weight]').length).toBe(4);
    // The lane strip: five segments, one for + three neutral + one unread
    // (decorative, aria-hidden — the flows rim dotted).
    const strip = document.querySelector('[data-balance-lane-strip]') as HTMLElement;
    expect(strip.getAttribute('aria-hidden')).toBe('true');
    expect(strip.querySelectorAll('i').length).toBe(5);
    expect(strip.querySelectorAll('i[data-side="neutral"]').length).toBe(3);
    expect(strip.querySelectorAll('i[data-side="for"]').length).toBe(1);
    expect(strip.querySelectorAll('i[data-side="unread"]').length).toBe(1);
  });

  it('the FOR case: three weights on the supporting pan, the full 10° tip for (the signed angle is for-heavy NEGATIVE), the tray still holds the quiet lane', () => {
    renderCard(FOR);
    const forAssembly = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    expect(forAssembly.querySelectorAll('[data-balance-weight]').length).toBe(3);
    expect(Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'))).toBe(-10);
    expect(document.querySelector('[data-balance-verdict-word]')?.getAttribute('data-side')).toBe('for');
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toBe('Leaning for gold');
  });

  it('the stack case: all five weights on ONE pan (two rows) and the tray shows its empty line (05 §4.5)', () => {
    // GF-P2 (B/C/K): the new seats fire on the against side — ALL FIVE
    // lanes read against (engine-verified: 0 for · 5 against).
    renderCard(STACK);
    const againstAssembly = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    expect(againstAssembly.querySelectorAll('[data-balance-weight]').length).toBe(5);
    expect(document.querySelector('[data-balance-assembly="for"] [data-balance-weight]')).toBeNull();
    const tray = document.querySelector('[data-balance-tray="not-leaning"]') as HTMLElement;
    expect(tray.querySelector('[data-balance-weight]')).toBeNull();
    expect(tray.querySelector('.bal-tray-empty')?.textContent).toBe('Every driver is on a pan.');
    expect(Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'))).toBe(10);
  });

  it('AC-1: exactly ONE gold instrument — the balance; no wind or model-vs-reality panel remains anywhere', () => {
    renderCard(fixtureReadings());
    expect(document.querySelector('[data-gold-panels]')).toBeNull();
    expect(document.querySelector('#insights-gold-tailwind')).toBeNull();
    expect(document.querySelector('#insights-gold-model-vs-reality')).toBeNull();
    expect(document.querySelector('[data-gold-label]')).toBeNull();
    // The C12 banner mechanism and the footing strip stay (the spec keeps them).
    expect(document.querySelectorAll('[data-footing-metal]').length).toBe(2);
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 2 — the split lane
 * ------------------------------------------------------------------ */
describe('the split lane (04 §4.3 item 2)', () => {
  it('shows the "Split" badge on the tray weight, the contest in the accessible name, and the ledger state word names it', () => {
    // GF-P1: the recorded fixture no longer splits (borrowing-costs reads
    // FOR 3v1 — the fed-expectations threshold flip), so the split shape is
    // built by cloning the fixture and turning us10y RISING (change30d
    // +0.3 > the 0.15pt threshold → pressures): supports {real-yield-10y
    // falling, fed-expectations falling} v pressures {us10y rising, us30y
    // high} — 2 v 2, engine-verified.
    const split = fixtureReadings().map((r) =>
      r.id === 'us10y' ? { ...r, change30d: 0.3, percentile10y: 0.5 } : r,
    );
    expect(goldBalance(split).lanes.find((l) => l.lane === 'borrowing-costs')!.split).toBe(true);
    renderCard(split);
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
    // Grouped (GF-P1: the fed-expectations threshold (J) moved its fixture
    // seat into Supports — three falling readings): real-yield-10y,
    // us10y AND fed-expectations under Supports gold; us30y alone under
    // Pressures gold (engine-verified: 3 supports · 1 pressure).
    const supports = members.querySelector('[data-balance-member-group="supports"]') as HTMLElement;
    expect(supports.querySelectorAll('[data-balance-member]').length).toBe(3);
    expect(supports.textContent).toContain('Real yields');
    expect(supports.textContent).toContain('falling');
    expect(supports.textContent).toContain('US 10-year yield');
    expect(supports.textContent).toContain('Fed expectations');
    const pressures = members.querySelector('[data-balance-member-group="pressures"]') as HTMLElement;
    expect(pressures.querySelectorAll('[data-balance-member]').length).toBe(1);
    expect(pressures.textContent).toContain('US 30-year yield');
    expect(pressures.textContent).toContain('high in its decade');
    // Every firing row carries the value text and the deep link to its indicator card.
    const memberRow = pressures.querySelector('[data-balance-member="us30y"]') as HTMLElement;
    expect(memberRow.querySelector('a')?.getAttribute('href')).toBe('/insights?card=us30y');
    expect(memberRow.querySelector('a')?.textContent).toBe('Open indicator');
    // The steady voters: collapsed to ONE muted sentence naming them (05 §4.6).
    const steady = members.querySelector('[data-balance-member-group="steady"]') as HTMLElement;
    expect(steady).not.toBeNull();
    expect(steady.querySelectorAll('[data-balance-member-impact="steady"]').length).toBe(2);
    expect(steady.textContent).toContain('Not firing (2)');
    expect(steady.textContent).toContain('Fed funds target');
    // GF-P3 (the standing delegation): the 4 new FRED-sourced voters' readings
    // are absent from the 2026-10-31 archive → real-yield-5y renders as a third
    // unread member in this lane (the other 3 new voters sit in the dollar and
    // stress lanes). The lane is still readable (6 readable voters) → still FOR.
    const unreadGroup = members.querySelector('[data-balance-member-group="unread"]') as HTMLElement;
    expect(unreadGroup).not.toBeNull();
    expect(unreadGroup.textContent).toContain('Could not be read (1)');
    expect(unreadGroup.textContent).toContain('Real yield (5y)');
    // The 36-voter table's borrowing-costs lane has 7 members (GF-P1 H: the two
    // yield-curve seats demoted — 8 → 6; GF-P3: real-yield-5y seated — 6 → 7).
    expect(members.querySelectorAll('[data-balance-member]').length).toBe(7);
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
    // Clone the fixture with two borrowing-costs voters turned stale
    // (GF-P1 H: both are actual members — the demoted curve seats are not).
    // GF-P3: real-yield-5y is also absent from the 2026-10-31 archive → the
    // borrowing-costs unread group lists 3 members on this staled clone.
    const readings = fixtureReadings().map((r) =>
      r.id === 'ecb-dfr' || r.id === 'fed-target' ? { ...r, status: 'stale' as const, value: null } : r,
    );
    renderCard(readings);
    openRow('borrowing-costs');
    const members = document.getElementById('gold-balance-row-borrowing-costs') as HTMLElement;
    const unread = members.querySelector('[data-balance-member-group="unread"]') as HTMLElement;
    expect(unread).not.toBeNull();
    expect(unread.textContent).toContain('Could not be read (3)');
    expect(unread.querySelectorAll('[data-balance-member-impact="unread"]').length).toBe(3);
    // The clean fixture's borrowing row now carries GF-P3's real-yield-5y as a
    // single unread member (the archive predates GF-P3) — the new voter's seat
    // renders unread, never a steady word (D-18 input-presence rule).
    cleanup();
    renderCard(fixtureReadings());
    openRow('borrowing-costs');
    const cleanUnread = document.getElementById('gold-balance-row-borrowing-costs')?.querySelector(
      '[data-balance-member-group="unread"]',
    ) as HTMLElement;
    expect(cleanUnread).not.toBeNull();
    expect(cleanUnread.textContent).toContain('Could not be read (1)');
    expect(cleanUnread.textContent).toContain('Real yield (5y)');
    // …and GF-P1's D-18 input-presence rule (the owner's recorded decision
    // I, 2026-11-05) renders the FLOWS row's unread group naturally, and
    // GF-P2 (B/C/K) restates the shape twice: the six promoted stress
    // voters' readings are absent from the 2026-10-31 archive → the stress
    // row's unread group lists them; the cftc member (readable-but-inputless,
    // the 1-point staged truth) now lives in the FLOWS row beside the
    // gross-long seat whose reading the archive does not carry — unread,
    // never a steady word (audit D-18). GF-P3 (the standing delegation):
    // bank-stress joins the stress unread group (7 voters total).
    openRow('stress');
    const stressUnread = document.getElementById('gold-balance-row-stress')?.querySelector(
      '[data-balance-member-group="unread"]',
    ) as HTMLElement;
    expect(stressUnread).not.toBeNull();
    expect(stressUnread.textContent).toContain('Could not be read (7)');
    expect(stressUnread.textContent).toContain('10-year term premium');
    expect(stressUnread.textContent).toContain('Excess bond premium');
    expect(stressUnread.textContent).toContain('Bank stress');
    openRow('flows');
    const flowsUnread = document.getElementById('gold-balance-row-flows')?.querySelector(
      '[data-balance-member-group="unread"]',
    ) as HTMLElement;
    expect(flowsUnread).not.toBeNull();
    expect(flowsUnread.textContent).toContain('Could not be read (2)');
    expect(flowsUnread.textContent).toContain('Gold positioning');
    expect(flowsUnread.textContent).toContain('Gold long positioning');
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
    // borrowing-costs (GF-P1): 3 supports, 1 pressure, 2 steady, 1 unread —
    // 7 members (engine-verified; the demotion H removed the two curve seats,
    // the threshold J flipped fed-expectations into the supports, and GF-P3
    // seated real-yield-5y whose reading the 2026-10-31 archive does not carry).
    const weight = document.querySelector('[data-balance-weight="borrowing-costs"]') as HTMLElement;
    expect(weight.querySelectorAll('[data-bal-seg]').length).toBe(7);
    expect(weight.querySelectorAll('[data-bal-seg="supports"]').length).toBe(3);
    expect(weight.querySelectorAll('[data-bal-seg="pressures"]').length).toBe(1);
    expect(weight.querySelectorAll('[data-bal-seg="steady"]').length).toBe(2);
    expect(weight.querySelectorAll('[data-bal-seg="unread"]').length).toBe(1);
    // The ledger row's open list agrees — the rim is a picture of the same counts.
    openRow('borrowing-costs');
    const members = document.getElementById('gold-balance-row-borrowing-costs') as HTMLElement;
    expect(members.querySelectorAll('[data-balance-member-impact="supports"]').length).toBe(3);
    expect(members.querySelectorAll('[data-balance-member-impact="pressures"]').length).toBe(1);
    expect(members.querySelectorAll('[data-balance-member-impact="steady"]').length).toBe(2);
    expect(members.querySelectorAll('[data-balance-member-impact="unread"]').length).toBe(1);
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

  it('the counts line appends the unread part only when > 0 (all-unread: "0 for · 0 against · 0 not leaning · 5 unread")', () => {
    // GF-P2 (B/C/K): five lanes — the all-unread case carries five dotted rims.
    renderCard(ALL_UNREAD);
    expect(document.querySelector('[data-balance-count]')?.textContent).toBe(
      '0 for · 0 against · 0 not leaning · 5 unread',
    );
  });

  it('all five lanes unread: level beam, the "Can\'t read" hero in primary ink, no needle, both pans carry the shared nothing-read sentence, five dotted rims in the tray', () => {
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
    expect(trayWeights.length).toBe(5);
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
    // dollar lane reads against on this fixture: 2 of its 7 voters firing
    // (GF-P2 C/K: D5 + G4 seat — the quiet rows read steady; GF-P3: the
    // broad + EME dollar twins join as quiet rows — 5 → 7 readable).
    expect(document.querySelector('[data-balance-row="dollar"] [data-balance-tally]')?.textContent).toBe(
      '۲ مورد از ۷ عامل فعال است',
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
 * GB-S6 — the flipped view's byte-stability pin: a FRESH snapshot of
 * the flipped view replaces the flag-era legacy-markup snapshot (which
 * retired with the legacy branch). Any change to the DEFAULT view —
 * now the visual lane balance — updates this snapshot CONSCIOUSLY.
 * ------------------------------------------------------------------ */
describe('the flipped view byte-stability pin (GB-S6)', () => {
  it('the flipped view is pinned byte-for-byte (the snapshot — any change to the default view must be conscious)', () => {
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
    // The pin itself: the flipped view (the visual lane balance) is THE
    // default — every visitor's markup, byte-for-byte.
    expect(html2).toMatchSnapshot();
    // And the retired elements stay retired inside the pinned markup.
    expect(document.querySelector('[data-gold-panels]')).toBeNull();
    expect(document.querySelector('[data-balance-tile]')).toBeNull();
    expect(document.querySelector('[data-balance-visual]')).not.toBeNull();
    // The reworded lane subtitle, not the legacy one.
    expect(document.querySelector('[data-balance-subtitle]')?.textContent).toBe(
      copy.signals.balance.subtitleLanes,
    );
  });
});

/* ------------------------------------------------------------------ *
 * GB-S6 — the visual design is THE balance (the `visual` prop and the
 * legacy branch retired with the flag).
 * ------------------------------------------------------------------ */
describe('the unconditional visual (GB-S6)', () => {
  it('BalanceScale renders the redesign root with no prop — there is no other branch', () => {
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
    render(<BalanceScale drivers={drivers} copy={copy} numberLocale="en-US" />);
    expect(document.querySelector('[data-balance-visual]')).not.toBeNull();
    expect(document.querySelector('[data-balance-visual]')?.getAttribute('data-size')).toBe('l');
    // The legacy condition-chip markup retired with the branch.
    expect(document.querySelector('[data-balance-chip]')).toBeNull();
    expect(document.querySelector('[data-balance-tile]')).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * GB-S5 (P3) — the gold Outlook DERIVED from the balance (01 §5.2):
 * the strip's gold leg, the AC-3 consistency pins and the AC-7
 * footing decoupling, all behind ?balance=lanes.
 * ------------------------------------------------------------------ */
describe('the gold Outlook derived from the balance (GB-S5, 01 §5.2)', () => {
  /** Gold's price row overridden — the voters (and so the whole lane
   * balance) are untouched; only the OUTLOOK's range evidence changes. */
  const withGold = (base: readonly IndicatorReading[], change30d: number, percentile = 0.6): IndicatorReading[] =>
    base.map((r) => (r.id === 'gold-usd' ? { ...r, change30d, percentile10y: percentile } : r));
  /** A lane's firing voters neutralized to quiet rows (side -> neutral). */
  const quieten = (base: readonly IndicatorReading[], ids: IndicatorId[]): IndicatorReading[] =>
    base.map((r) => (ids.includes(r.id) ? quiet(r.id) : r));

  /** The battery: every (balance verdict × outlook family) cell, each
   * variant's counts verified against the real engine before pinning
   * (the probe numbers are in the GB-S5 session log). */
  const BATTERY: Array<[name: string, readings: () => IndicatorReading[], expected: string]> = [
    // GF-P1 (2026-11-05): the recorded fixture's balance is FOR 1 now (the
    // fed-expectations flip, decision J) — L1 A0 with the price moving →
    // bullish (was neutral on the pre-P1 level balance).
    ['the recorded fixture (L1 A0, price moving)', () => fixtureReadings(), 'bullish'],
    ['DIRECTIONAL (1 for · 2 against, price moving)', () => DIRECTIONAL, 'bearish'],
    // GF-P2 (the owner's recorded answer B): the strong bar is 4-of-5 — 3
    // for is a majority, not strong (the old 3-of-4 bar moved).
    ['FOR (3 for — the 4-of-5 bar keeps it bullish)', () => FOR, 'bullish'],
    ['STACK (5 against)', () => STACK, 'strong-bearish'],
    ['SPARSE (1 against · 4 unread, price moving)', () => SPARSE, 'bearish'],
    ['fixture · gold -9%', () => withGold(fixtureReadings(), -9), 'bullish'],
    ['fixture · gold +9%', () => withGold(fixtureReadings(), 9), 'bullish'],
    ['fixture · gold quiet + typical band', () => withGold(fixtureReadings(), 0.8, 0.5), 'range-bound'],
    ['DIRECTIONAL · gold quiet + typical band', () => withGold(DIRECTIONAL, 0.8), 'range-bound'],
    ['FOR minus stress (L2 A0)', () => quieten(FOR, ['stress-stlfsi', 'nfci']), 'bullish'],
    ['FOR minus stress minus dollar (L1 A0)', () => quieten(FOR, ['stress-stlfsi', 'nfci', 'dollar-basket', 'usdjpy']), 'bullish'],
    ['FOR minus stress minus dollar · gold quiet', () => withGold(quieten(FOR, ['stress-stlfsi', 'nfci', 'dollar-basket', 'usdjpy']), 0.8), 'range-bound'],
    ['DIRECTIONAL minus dollar (L1 A1)', () => quieten(DIRECTIONAL, ['dollar-basket', 'usdjpy']), 'mixed'],
  ];

  it('the strip\'s gold chip reads exactly goldOutlookOf(goldBalance(readings)) — the SAME engine result as the balance (AC-3)', () => {
    for (const [name, make, expected] of BATTERY) {
      cleanup();
      const readings = make();
      const { gold } = renderCard(readings);
      const balance = goldBalance(readings);
      const direction = document.querySelector('[data-verdict-metal="gold"]')?.getAttribute('data-verdict-direction');
      // The engine-derived state, recomputed here from the same readings
      // the card rendered on — the strip and the derivation cannot drift.
      expect(direction, `${name}: DOM vs goldOutlookOf`).toBe(goldOutlookOf(balance, gold.speed, gold.position));
      // The engine-verified expectation from the session's probe.
      expect(direction, `${name}: DOM direction`).toBe(expected);
    }
  });

  it('the Outlook never OPPOSES the beam: every battery verdict/outlook pair agrees (AC-3, D-GB-6)', () => {
    const CALM = new Set(['neutral', 'range-bound', 'mixed']);
    const BULL = new Set(['bullish', 'strong-bullish']);
    const BEAR = new Set(['bearish', 'strong-bearish']);
    for (const [name, make] of BATTERY) {
      cleanup();
      renderCard(make());
      const balanceVerdict = document.querySelector('[data-balance-verdict]')?.getAttribute('data-balance-verdict');
      const outlook = document.querySelector('[data-verdict-metal="gold"]')?.getAttribute('data-verdict-direction');
      expect(balanceVerdict, `${name}: verdict attr`).toBeTruthy();
      if (balanceVerdict === 'for') {
        // net > 0: the outlook may understate (range-bound on a quiet
        // month) but never flip or fence-sit
        expect(BULL.has(outlook ?? '') || outlook === 'range-bound', `${name}: for vs ${outlook}`).toBe(true);
      } else if (balanceVerdict === 'against') {
        expect(BEAR.has(outlook ?? '') || outlook === 'range-bound', `${name}: against vs ${outlook}`).toBe(true);
      } else if (balanceVerdict === 'balanced') {
        // net === 0: never directional — the old page said Bearish here
        expect(CALM.has(outlook ?? ''), `${name}: balanced vs ${outlook}`).toBe(true);
      } else {
        // readable === 0: nothing could be read — the gold chip carries none
        expect(outlook, `${name}: none`).toBe('none');
      }
    }
  });

  it('silver\'s leg is UNTOUCHED: the silver chip still reads outlookOf(silver) under the flag (OI-4)', () => {
    for (const [name, make] of BATTERY.slice(0, 5)) {
      cleanup();
      const { silver } = renderCard(make());
      expect(document.querySelector('[data-verdict-metal="silver"]')?.getAttribute('data-verdict-direction'), name).toBe(
        outlookOf(silver),
      );
    }
  });

  it('the footing decoupling in the DOM (AC-7): gold change30d of -9% and +9% leave BOTH the balance and the Outlook unchanged', () => {
    const snapshotOf = (): { verdict: string | null | undefined; count: string | null | undefined; tilt: string | null | undefined; direction: string | null | undefined } => ({
      verdict: document.querySelector('[data-balance-verdict-word]')?.textContent,
      count: document.querySelector('[data-balance-count]')?.textContent,
      tilt: document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'),
      direction: document.querySelector('[data-verdict-metal="gold"]')?.getAttribute('data-verdict-direction'),
    });
    renderCard(withGold(fixtureReadings(), -9));
    const down = snapshotOf();
    cleanup();
    renderCard(withGold(fixtureReadings(), 9));
    const up = snapshotOf();
    // The old gold path counted the move (a falling month dragged the
    // verdict toward bearish). The lane path: the sign of a large move
    // changes NOTHING — price is context, counted nowhere. (GF-P1: the
    // fixture's balance itself now reads FOR — the recorded decisions
    // changed the balance, never the decoupling.)
    expect(up).toEqual(down);
    expect(down).toEqual({
      verdict: 'Leaning for gold',
      // GF-P2 (B/C/K): the counts line states the unread flows lane.
      count: '1 for · 0 against · 3 not leaning · 1 unread',
      tilt: '-10',
      direction: 'bullish',
    });
    // The ONLY price effect: quiet + typical band reads range-bound —
    // consolidation described, never direction — while the balance stays
    // byte-identical.
    cleanup();
    renderCard(withGold(fixtureReadings(), 0.8, 0.5));
    const quiet = snapshotOf();
    expect(quiet.direction).toBe('range-bound');
    expect(quiet.verdict).toBe('Leaning for gold');
    expect(quiet.count).toBe(down.count);
    expect(quiet.tilt).toBe(down.tilt);
    // …and a quiet month at the decade high is NOT range evidence.
    cleanup();
    renderCard(withGold(fixtureReadings(), 0.8, 0.95));
    expect(snapshotOf().direction).toBe('bullish');
  });

  it('all four lanes unread: the gold chip carries the honest none (verdictNone); with both metals unread the whole strip hides', () => {
    renderCard(ALL_UNREAD);
    // Both metals read nothing → the strip's own both-null rule hides it.
    expect(document.querySelector('[data-signal-verdict]')).toBeNull();
    // Silver readable → the strip renders and the GOLD chip states it
    // could not be read (the OLD path said Bearish here, from footing).
    cleanup();
    renderCard([...ALL_UNREAD, reading('silver-usd', { value: 55, percentile10y: 0.5, change30d: 3 })]);
    const goldChip = document.querySelector('[data-verdict-metal="gold"]') as HTMLElement;
    expect(goldChip.getAttribute('data-verdict-direction')).toBe('none');
    expect(goldChip.textContent).toContain(copy.signals.verdictNone);
  });

  it('the owner\'s EXISTING outlook sentences ship (OI-1 unanswered — the states change, the wording does not)', () => {
    // GF-P1: the recorded fixture reads FOR 1 now → the bullish sentence
    // (was the neutral one on the pre-P1 level balance).
    renderCard(fixtureReadings());
    expect(document.querySelector('[data-verdict-metal="gold"]')?.textContent).toContain(
      copy.signals.verdictStates.bullish.gold,
    );
    cleanup();
    renderCard(withGold(fixtureReadings(), 0.8, 0.5));
    expect(document.querySelector('[data-verdict-metal="gold"]')?.textContent).toContain(
      copy.signals.verdictStates['range-bound'].gold,
    );
    cleanup();
    renderCard(FOR);
    // GF-P2 (the owner's recorded answer B): 3 of 5 is a majority, not the
    // strong bar — the bullish sentence (was strong-bullish under 3-of-4).
    expect(document.querySelector('[data-verdict-metal="gold"]')?.textContent).toContain(
      copy.signals.verdictStates.bullish.gold,
    );
  });

  it('behind the flag the strip reads the ENGINE, not the gold conditions (AC-4: no bespoke stress/expectations rule can reach the Outlook)', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    const readings = fixtureReadings();
    const gold = evaluateSignal('gold', readings);
    const silver = evaluateSignal('silver', readings);
    // A doctored gold reading: EVERY legacy condition reads against (the
    // bespoke stress/expectations/footing states at their most bearish —
    // the old path would say strong-bearish from this). The lane view
    // derives from goldBalance(readings) + speed/position only, so neither
    // the strip nor the balance can see the doctored conditions.
    const doctored: SignalReading = {
      ...gold,
      conditions: gold.conditions.map((c) => ({ ...c, state: 'against' as const })),
      metCount: gold.conditions.length,
      lean: 'mostly-unsupportive',
    };
    render(
      <MergedSignalsCard
        gold={doctored}
        silver={silver}
        readings={readings}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    expect(document.querySelector('[data-verdict-metal="gold"]')?.getAttribute('data-verdict-direction')).toBe(
      goldOutlookOf(goldBalance(readings), gold.speed, gold.position),
    );
    expect(document.querySelector('[data-balance-verdict-word]')?.textContent).toContain('Leaning for gold'); // GF-P1: the fixture's balance reads FOR
  });
});

/* ------------------------------------------------------------------ *
 * GB-S5 (P3, GB-S6 flip) — the COLLAPSED gold takeaway AND PROSE derive
 * from the balance (AC-3: the Outlook state cannot disagree with the
 * balance in any presentation of the card). The collapsed-corner
 * DECISION at the flip: the gold PROSE joined the lane model — the
 * legacy sentence ("Gold: mixed, 2 of 5 conditions met") counted
 * FOOTING among 5 conditions (the circularity D-GB-5 removed) and
 * would have contradicted the card's own counts line on the same
 * page; silver's prose keeps the legacy per-condition sentence (its
 * own model is unchanged, OI-4). The same sentence rides the merged
 * card's header (MergedCard metalLeanLine) — one key (metalLeanLanes),
 * one rule home (balanceVerdictWordOf + balanceVerdictCountsParts).
 * ------------------------------------------------------------------ */
describe('the collapsed gold takeaway + prose (GB-S5/GB-S6, AC-3)', () => {
  const renderSignals = (readings: readonly IndicatorReading[] = DIRECTIONAL, c: typeof copy = copy, locale: 'en-US' | 'fa-IR' = 'en-US') => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    render(
      <Signals
        readings={readings}
        copy={c}
        numberLocale={locale}
        expandToken={0}
      />,
    );
    // Collapse the section (session-only toggle) so the summary lines render.
    fireEvent.click(document.querySelector('button[aria-controls="insights-signals-body"]') as HTMLButtonElement);
    const lineOf = (metal: string): string | null =>
      document.querySelector(`li[data-signal-metal="${metal}"]`)?.textContent ?? null;
    const verdictOf = (metal: string): string | null | undefined =>
      document.querySelector(`li[data-signal-metal="${metal}"] [data-collapsed-verdict]`)?.getAttribute('data-collapsed-verdict');
    return { lineOf, verdictOf };
  };

  it('the collapsed gold line reads the LANE state (bearish: 1 for · 2 against), not the old mixed (which footing dragged up)', () => {
    const { verdictOf } = renderSignals();
    expect(verdictOf('gold')).toBe('bearish');
    // Silver's collapsed takeaway keeps its own legacy derivation (OI-4).
    expect(verdictOf('silver')).toBe(outlookOf(evaluateSignal('silver', DIRECTIONAL)));
  });

  it('THE CORNER DECISION: the collapsed gold PROSE speaks the lane model — the verdict word + the counts line, the same words the card renders', () => {
    // DIRECTIONAL: 1 for · 2 against · 2 neutral (GF-P2's five-lane battery —
    // inflation AND the flows pair quiet) — the engine-verified battery.
    const b = goldBalance(DIRECTIONAL);
    expect(b.counts).toEqual({ for: 1, against: 2, neutral: 2, unread: 0 });
    const { lineOf } = renderSignals();
    const goldLine = lineOf('gold') ?? '';
    // The verdict word + the counts parts, exactly as the card renders them.
    expect(goldLine).toContain('Leaning against gold');
    expect(goldLine).toContain('1 for · 2 against · 2 not leaning');
    // The legacy 5-condition count is GONE from the gold prose (the
    // circularity D-GB-5 removed; the counts line is the lane counts).
    expect(goldLine).not.toContain('of 5 conditions met');
    // The footing band sentence still rides the line (context only).
    expect(goldLine).toContain('price in the');
    // Silver's prose keeps the legacy per-condition sentence (OI-4).
    const silverLine = lineOf('silver') ?? '';
    expect(silverLine).toContain('of 6 conditions met');
  });

  it('the collapsed gold PROSE on the recorded fixture: "Leaning for gold, 1 for · 0 against · 3 not leaning · 1 unread" (GF-P2 restates GF-P1\'s recorded flip)', () => {
    const { lineOf } = renderSignals(fixtureReadings());
    const goldLine = lineOf('gold') ?? '';
    expect(goldLine).toContain('Leaning for gold');
    expect(goldLine).toContain('1 for · 0 against · 3 not leaning');
    // The outlook chip still rides the line's end (AC-3: same engine) —
    // the fixture reads bullish now (L1 A0, price moving).
    expect(goldLine).toContain('Outlook: Bullish');
  });

  it('the card header speaks the same lane prose for gold; silver keeps the legacy sentence (one key, two models by metal)', () => {
    renderCard(fixtureReadings());
    const goldHeader = document.querySelector('[data-signal-card="merged"] [data-signal-metal="gold"]')?.textContent ?? '';
    const silverHeader = document.querySelector('[data-signal-card="merged"] [data-signal-metal="silver"]')?.textContent ?? '';
    expect(goldHeader).toContain('Leaning for gold');
    expect(goldHeader).toContain('1 for · 0 against · 3 not leaning');
    expect(goldHeader).not.toContain('of 5 conditions met');
    expect(silverHeader).toContain('of 6 conditions met');
  });

  it('fa: the collapsed gold prose renders the Persian verdict word + Persian counts with Persian digits', () => {
    const { lineOf } = renderSignals(fixtureReadings(), copyFa, 'fa-IR');
    const goldLine = lineOf('gold') ?? '';
    // GF-P1: the fixture reads FOR now — the Persian for-word
    // ('تمایل به نفع طلا') + the 1-for counts.
    expect(goldLine).toContain('تمایل به نفع طلا');
    expect(goldLine).toContain('۱ موافق · ۰ مخالف · ۳ بدون گرایش · ۱ ناخوانده');
    // The legacy Persian count clause is gone from the gold line.
    expect(goldLine).not.toContain('از ۵ شرط');
    // Silver keeps its own Persian sentence.
    const silverLine = lineOf('silver') ?? '';
    expect(silverLine).toContain('از ۶ شرط');
  });
});

/* ------------------------------------------------------------------ *
 * Moved from gold-panels.test.tsx (retired with the panels at the
 * GB-S6 flip — 04 §1: the surviving assertions move to the new tests):
 * the dictionary coverage of the engine vocabulary + the PricesBoard
 * no-panels pin + the card order. OI-3/GB-S7 (2026-11-04, the owner's
 * recorded approval): trimmed WITH the keys — only the five blocks the
 * lane view reads (laneNames / voterNames / tiltWords / evidenceWords /
 * measuredNoteLink) stay under test; the panels' own vocabulary
 * (labels, subGaugeWords, impactWords, netFiring*, laneCounts*,
 * votersTitle/votersNone, measuredNote, all of goldModelVsReality)
 * retired with them (03 §6.4).
 * ------------------------------------------------------------------ */

describe('gold copy — both dictionaries cover the whole engine vocabulary (moved from gold-panels, trimmed at OI-3)', () => {
  for (const [name, c] of [['en', copy], ['fa', copyFa]] as const) {
    it(`${name}: every lane/voter/evidence/tilt key the lane view reads is non-empty`, () => {
      const g = c.signals.goldScore;
      for (const lane of GOLD_LANES) expect(g.laneNames[lane], `${name} ${lane}`).toBeTruthy();
      for (const e of ['rising', 'falling', 'high', 'low'] as const) {
        expect(g.evidenceWords[e], `${name} ${e}`).toBeTruthy();
      }
      // Session 3 (G2): the inflation lane's tilt phrase keys — both locales.
      for (const t of ['building', 'fading', 'steady'] as const) {
        expect(g.tiltWords[t], `${name} tilt ${t}`).toBeTruthy();
      }
      // Session 5 (C4a): the measured note's link word — both locales (the
      // note itself is balance.measuredNote since the flip).
      expect(g.measuredNoteLink, `${name} measuredNoteLink`).toBeTruthy();
      // the voter names cover EXACTLY the 21-voter table (Session 6: the
      // D-5 promotion added breakeven-tilt to both dictionaries)
      const tableIds = GOLD_LANE_VOTERS.map((v) => v.id as string);
      expect(Object.keys(g.voterNames).sort()).toEqual([...new Set(tableIds)].sort());
      for (const id of tableIds) expect(g.voterNames[id as keyof typeof g.voterNames], `${name} ${id}`).toBeTruthy();
      // OI-3/GB-S7: the retired panels' vocabulary is GONE from the
      // dictionaries (03 §6.4) — the wind words never render again.
      expect('labels' in g, `${name} labels retired`).toBe(false);
      expect('subGaugeWords' in g, `${name} subGaugeWords retired`).toBe(false);
      expect('impactWords' in g, `${name} impactWords retired`).toBe(false);
      expect('measuredNote' in g, `${name} measuredNote retired`).toBe(false);
      expect('goldModelVsReality' in c.signals, `${name} goldModelVsReality retired`).toBe(false);
    });

    it(`${name}: the summary-prose key carries its placeholders (metalLeanLanes, round-78)`, () => {
      expect(c.signals.metalLeanLanes).toContain('{metal}');
      expect(c.signals.metalLeanLanes).toContain('{lean}');
      expect(c.signals.metalLeanLanes).toContain('{counts}');
      if (name === 'fa') {
        expect(c.signals.metalLeanLanes).not.toContain('—');
      }
    });
  }
});

describe('MergedSignalsCard order — the balance then the footing strip (moved from gold-panels, post-flip)', () => {
  it('the card renders the outlook strip, then the balance, then the footing strip — no panels between (order pinned)', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    const readings = fixtureReadings();
    const gold = evaluateSignal('gold', readings);
    const silver = evaluateSignal('silver', readings);
    const { container } = render(
      <MergedSignalsCard gold={gold} silver={silver} readings={readings} copy={copy} numberLocale="en-US" />,
    );
    const card = container.querySelector<HTMLElement>('[data-signal-card="merged"]')!;
    const strip = card.querySelector<HTMLElement>('[data-signal-verdict]')!;
    const balance = card.querySelector<HTMLElement>('[data-balance="gold"]')!;
    const footing = card.querySelector<HTMLElement>('[data-footing-metal="gold"]')!;
    expect(strip).toBeTruthy();
    expect(balance).toBeTruthy();
    expect(footing).toBeTruthy();
    // The owner's order: strip → balance → footing (the panels that sat
    // between balance and footing retired with the flip).
    expect(strip.compareDocumentPosition(balance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(balance.compareDocumentPosition(footing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card.querySelector('[data-gold-panels]')).toBeNull();
  });
});

describe('PricesBoard — the strip is the four price tiles again (moved from gold-panels)', () => {
  it('the board renders NO gold panels, with or without price rows', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => null } as unknown as Response)),
    );
    const { container } = render(
      <PricesBoard
        readings={[reading('gold-usd', { value: 4166, change30d: 5.2 })]}
        copy={copy}
        locale="en"
        numberLocale="en-US"
        onFocusCard={vi.fn()}
      />,
    );
    const board = container.querySelector<HTMLElement>('#insights-prices')!;
    expect(board.querySelector('#insights-card-gold-usd')).toBeTruthy();
    expect(board.querySelector('#insights-gold-tailwind')).toBeNull();
    expect(board.querySelector('#insights-gold-model-vs-reality')).toBeNull();
    // and with no price rows at all, still nothing
    const empty = render(
      <PricesBoard readings={[]} copy={copy} locale="en" numberLocale="en-US" onFocusCard={vi.fn()} />,
    );
    expect(empty.container.querySelector('#insights-gold-tailwind')).toBeNull();
  });
});
