/**
 * @vitest-environment jsdom
 *
 * signals/gold-balance-lanes.test.tsx — the gold balance consolidation's
 * P2 component tests (GB-S3, docs/specs/gold-balance-consolidation/
 * 04-MIGRATION-AND-ACCEPTANCE.md §4.3 items 1-7, 9, 11-13): the
 * consolidated LANE balance behind the ?balance=lanes preview flag.
 *
 *   1. lane chips land in the right pan or tray for each side
 *   2. a split lane shows the "Split" badge and the "2 for, 2 against" line
 *   3. the detail panel lists members grouped by impact; steady group
 *      collapsed; the inflation lane shows the tilt phrase; the
 *      breakeven-5y5y row shows the card status word (B-12)
 *   4. B-12: no member line uses "elevated" unless the card status is
 *      warning (the evidence vocabulary carries no such word)
 *   5. the context line renders for a known change30d; hidden when missing
 *   6. the measured note + backtest link render without interaction
 *   7. DOM scan: no "tailwind"/"headwind"/"wind" text in the gold card
 *      under the flag, EN and fa (01 §8.3)
 *   9. RTL: the pan sides mirror; the beam sign for the heavy side is
 *      unchanged (the physical angle is direction-free)
 *  11. EN and fa dictionaries cover every new key (placeholders intact)
 *  12. keyboard: chip activation opens the detail panel; focus returns
 *      to the chip on close
 *  13. without the flag the LEGACY rendering is unchanged (a snapshot of
 *      the legacy markup — the default view stays byte-for-byte today's
 *      until the owner-gated P5/GB-S6 flip)
 *
 * Fixtures: the RECORDED 2026-10-31 corpus archive (the recipe verified
 * twice — GB-S1 + GB-S2: sourceName "archive 2026-10-31", updatedAt the
 * archive's generatedAt) reproduces 01 §7 exactly — LEVEL · 4 neutral ·
 * borrowing-costs split 2v2 (readable 8, firing 4) · dollar 1 firing ·
 * stress readable-5/firing-0 · inflation 1 firing — and a synthetic
 * one-sided case drives the pans. Conventions follow balance.test.tsx /
 * gold-panels.test.tsx.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { GOLD_LANES, goldBalance, type SignalReading } from '@currena/insights';
import { evaluateSignal } from '@currena/insights';
import { MergedSignalsCard, useBalanceLanesPreview } from './MergedCard';
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

/**
 * The one-sided case: borrowing costs (2 decade-high yields) and the
 * dollar (2 decade-high) read AGAINST, market stress (2 decade-high
 * indexes) reads FOR, inflation reads steady — 1 for · 2 against ·
 * 1 neutral, so both pans carry lane chips and the beam tips against.
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

/* ------------------------------------------------------------------ *
 * §4.3 item 1 — lane chips land in the right pan or tray for each side
 * ------------------------------------------------------------------ */
describe('the lane view — chip placement (04 §4.3 item 1)', () => {
  it('a for lane chip rests on the supporting pan, against chips on the pressuring pan, a quiet lane in the Neutral tray', () => {
    renderCard(DIRECTIONAL);
    const b = goldBalance(DIRECTIONAL);
    // The UI mirrors the engine exactly (AC-3: one engine, no drift).
    expect(b.counts).toEqual({ for: 1, against: 2, neutral: 1, unread: 0 });
    const forAssembly = document.querySelector('[data-balance-assembly="for"]') as HTMLElement;
    const againstAssembly = document.querySelector('[data-balance-assembly="against"]') as HTMLElement;
    // stress (for) on the supporting pan; borrowing-costs + dollar (against) on the pressuring pan.
    expect(forAssembly.querySelector('[data-balance-tile="stress"]')).not.toBeNull();
    expect(againstAssembly.querySelector('[data-balance-tile="borrowing-costs"]')).not.toBeNull();
    expect(againstAssembly.querySelector('[data-balance-tile="dollar"]')).not.toBeNull();
    expect(forAssembly.querySelector('[data-balance-tile]')).not.toBeNull();
    // inflation (neutral, below the crowd minimum) in the Neutral tray — never on a pan.
    const tray = document.querySelector('[data-balance-tray="neutral"]') as HTMLElement;
    expect(tray.querySelector('[data-balance-chip="inflation"]')).not.toBeNull();
    // At most 4 chips total (one per lane).
    expect(document.querySelectorAll('[data-balance-tile], [data-balance-chip]').length).toBe(4);
    // The beam tips against (net −1 → the against pan drops).
    const tilt = Number(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'));
    expect(tilt).toBeGreaterThan(0);
    expect(document.querySelector('[data-balance-verdict]')?.getAttribute('data-balance-verdict')).toBe('against');
  });

  it('the 2026-10-31 fixture: all four lanes neutral — no pan chips, the level beam, the "Balanced" verdict, 4 neutral counted', () => {
    renderCard(fixtureReadings());
    expect(document.querySelectorAll('[data-balance-tile]').length).toBe(0);
    expect(document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt')).toBe('0');
    expect(document.querySelector('[data-balance-verdict]')?.textContent).toContain('Balanced');
    // The count line counts LANES (the non-zero parts only — the unchanged structure).
    expect(document.querySelector('[data-balance-count]')?.textContent).toBe('4 neutral');
    const tray = document.querySelector('[data-balance-tray="neutral"]') as HTMLElement;
    expect(tray.querySelectorAll('button').length).toBe(4);
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
  it('shows the "Split" badge and the "2 for, 2 against" line inside the Neutral tray', () => {
    renderCard(fixtureReadings());
    const chip = document.querySelector('[data-balance-chip="borrowing-costs"]') as HTMLElement;
    expect(chip).not.toBeNull();
    expect(chip.querySelector('[data-balance-split-badge]')?.textContent).toBe('Split');
    expect(chip.querySelector('[data-balance-tally]')?.textContent).toBe('2 for, 2 against');
    // The single most important disclosure: contested, not empty (the tally says so).
    expect(chip.getAttribute('aria-label')).toBe('Borrowing costs: Sitting neutral. Split, 2 for, 2 against.');
    // The quiet lanes carry the plain tally, no badge.
    const dollar = document.querySelector('[data-balance-chip="dollar"]') as HTMLElement;
    expect(dollar.querySelector('[data-balance-split-badge]')).toBeNull();
    expect(dollar.querySelector('[data-balance-tally]')?.textContent).toBe('1 of 3 drivers firing');
    const stress = document.querySelector('[data-balance-chip="stress"]') as HTMLElement;
    expect(stress.querySelector('[data-balance-split-badge]')).toBeNull();
    expect(stress.querySelector('[data-balance-tally]')?.textContent).toBe('No driver firing');
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 3 — the detail panel's member list
 * ------------------------------------------------------------------ */
describe('the detail panel member list (04 §4.3 item 3)', () => {
  it('lists the firing members grouped Supports/Pressures with evidence, values and the indicator deep link; steady collapsed by name', () => {
    renderCard(fixtureReadings());
    fireEvent.click(document.querySelector('[data-balance-chip="borrowing-costs"]')!);
    const panel = document.getElementById('gold-balance-detail') as HTMLElement;
    expect(panel.hidden).toBe(false);
    // The lane's intro sentence (laneIntro).
    expect(panel.textContent).toContain('The cost of borrowing dollars');
    // Grouped: the two falling yields under Supports gold, the two highs under Pressures gold.
    const supports = panel.querySelector('[data-balance-member-group="supports"]') as HTMLElement;
    expect(supports.querySelectorAll('[data-balance-member]').length).toBe(2);
    expect(supports.textContent).toContain('Real yields');
    expect(supports.textContent).toContain('falling');
    expect(supports.textContent).toContain('US 10-year yield');
    const pressures = panel.querySelector('[data-balance-member-group="pressures"]') as HTMLElement;
    expect(pressures.querySelectorAll('[data-balance-member]').length).toBe(2);
    expect(pressures.textContent).toContain('US 30-year yield');
    expect(pressures.textContent).toContain('high in its decade');
    // Every firing row carries the value text and the deep link to its indicator card.
    const row = pressures.querySelector('[data-balance-member="us30y"]') as HTMLElement;
    expect(row.querySelector('a')?.getAttribute('href')).toBe('/insights?card=us30y');
    expect(row.querySelector('a')?.textContent).toBe('Open indicator');
    // The steady voters: collapsed by default, listed by name inside.
    const steady = panel.querySelector('[data-balance-member-group="steady"]') as HTMLDetailsElement;
    expect(steady).not.toBeNull();
    expect(steady.tagName).toBe('DETAILS');
    expect(steady.open).toBe(false);
    expect(steady.querySelectorAll('[data-balance-member-impact="steady"]').length).toBe(4);
    // The 21 voters are all reachable (AC-2): 8 members in this lane.
    expect(panel.querySelectorAll('[data-balance-member]').length).toBe(8);
  });

  it('the inflation lane shows the tilt phrase as a context line, and the breakeven-5y5y row shows the card status word (B-12)', () => {
    renderCard(fixtureReadings());
    fireEvent.click(document.querySelector('[data-balance-chip="inflation"]')!);
    const panel = document.getElementById('gold-balance-detail') as HTMLElement;
    // The fixture's breakeven-tilt reading leans fading (verified: value −0.24, change30d −0.24).
    expect(panel.querySelector('[data-balance-lane-note]')?.textContent).toBe('expectations fading');
    // B-12: the breakeven-5y5y member line carries the indicator card's OWN status word
    // beside the lean phrase (the fixture's card reads Normal).
    const row = panel.querySelector('[data-balance-member="breakeven-5y5y"]') as HTMLElement;
    expect(row.textContent).toContain('falling');
    expect(row.textContent).toContain('Normal');
    // No tilt phrase on the other lanes (inflation only — 03 §3 item 5).
    fireEvent.click(document.querySelector('[data-balance-chip="dollar"]')!);
    expect(document.getElementById('gold-balance-detail')?.querySelector('[data-balance-lane-note]')).toBeNull();
  });

  it('an unread member group renders only when a voter could not be read', () => {
    // Clone the fixture with two borrowing-costs voters turned stale.
    const readings = fixtureReadings().map((r) =>
      r.id === 'ecb-dfr' || r.id === 'yield-curve-10y2y' ? { ...r, status: 'stale' as const, value: null } : r,
    );
    renderCard(readings);
    fireEvent.click(document.querySelector('[data-balance-chip="borrowing-costs"]')!);
    const panel = document.getElementById('gold-balance-detail') as HTMLElement;
    const unread = panel.querySelector('[data-balance-member-group="unread"]') as HTMLElement;
    expect(unread).not.toBeNull();
    expect(unread.textContent).toContain('Could not be read (2)');
    expect(unread.querySelectorAll('[data-balance-member-impact="unread"]').length).toBe(2);
    // The clean fixture has no unread group.
    cleanup();
    renderCard(fixtureReadings());
    fireEvent.click(document.querySelector('[data-balance-chip="borrowing-costs"]')!);
    expect(
      document.getElementById('gold-balance-detail')?.querySelector('[data-balance-member-group="unread"]'),
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
      fireEvent.click(document.querySelector('[data-balance-chip="inflation"]')!);
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
 * §4.3 item 5 — the context line
 * ------------------------------------------------------------------ */
describe('the context line (04 §4.3 item 5)', () => {
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
    // Missing change30d → the line hides (01 §6: hidden when the value is missing).
    cleanup();
    const noChange = DIRECTIONAL.map((r) => (r.id === 'gold-usd' ? { ...r, change30d: undefined } : r));
    renderCard(noChange);
    expect(document.querySelector('[data-balance-context-line]')).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * §4.3 item 6 — the measured note
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
    // The for hangers meet the beam end on the RIGHT half of the stage in RTL.
    const forHangerX = Number(document.querySelector('[data-balance-hanger="for-start"]')?.getAttribute('x1'));
    expect(forHangerX).toBeGreaterThan(320);
    // Persian digits render in the tally (the locale formatter) — the dollar
    // lane rides the against pan on this fixture: 2 of its 3 voters firing.
    expect(document.querySelector('[data-balance-tile="dollar"] [data-balance-tally]')?.textContent).toBe(
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
  ];
  const NEW_PLAIN_KEYS: Array<keyof typeof copy.signals.balance> = [
    'subtitleLanes',
    'laneTallyNone',
    'splitBadge',
    'memberSupports',
    'memberPressures',
    'memberOpenIndicator',
    'measuredNote',
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
describe('keyboard (04 §4.3 item 12)', () => {
  it('chip activation opens the detail panel; a second activation closes it and focus stays/returns on the chip', () => {
    renderCard(fixtureReadings());
    const chip = document.querySelector('[data-balance-chip="borrowing-costs"]') as HTMLButtonElement;
    expect(chip.tagName).toBe('BUTTON'); // keyboard-reachable by construction (Enter/Space activate buttons)
    chip.focus();
    expect(document.activeElement).toBe(chip);
    // Button activation (Enter/Space synthesize click per the HTML spec — jsdom tests the handler path).
    fireEvent.click(chip);
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('gold-balance-detail')?.hidden).toBe(false);
    expect(document.activeElement).toBe(chip);
    // Close: the panel hides and focus never left the toggle (focus returns on close).
    fireEvent.click(chip);
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('gold-balance-detail')?.hidden).toBe(true);
    expect(document.activeElement).toBe(chip);
    // Opening another chip swaps the panel (one open at a time).
    const dollar = document.querySelector('[data-balance-chip="dollar"]') as HTMLButtonElement;
    fireEvent.click(chip);
    fireEvent.click(dollar);
    expect(document.getElementById('gold-balance-detail')?.getAttribute('data-balance-detail')).toBe('dollar');
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
    expect(document.querySelector('[data-balance-chip="borrowing-costs"]')).toBeNull();
    // None of the lane-view elements render.
    expect(document.querySelector('[data-balance-context-line]')).toBeNull();
    expect(document.querySelector('[data-balance-measured-note]')).toBeNull();
    expect(document.querySelector('[data-balance-split-badge]')).toBeNull();
    expect(document.querySelector('[data-balance-tally]')).toBeNull();
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
