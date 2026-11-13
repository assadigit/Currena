/**
 * @vitest-environment jsdom
 *
 * hero-editorial.test.tsx — the 2026-10-19 editorial handoff's regression
 * guards (docs/insights/economic-indicators-editorial-spec.md):
 *
 *   §10  the mobile Global-first swipe carousel — the track's DOM order
 *        is Global → Australia (D7) so the carousel OPENS on Global in
 *        every locale; the cue names the OTHER card; the two position
 *        dots expose aria-current; the Previous/Next buttons change the
 *        active card (and disable at the ends); the cards carry their
 *        "n of m" group labels.
 *   §7   the art band — one decorative [data-hero-art] layer per region
 *        card (Sydney on Australia, the map on Global), always
 *        aria-hidden (the artwork is never content).
 *   §4   the severity pill — the verdict word rides in the compact
 *        [data-verdict-pill] tinted pill, and the four-step meter stays
 *        beside it (never colour alone).
 *   §8   the flagged rows — the leading subject-icon container, the
 *        trailing drill-down chevron (.ei-row-chevron, mirrored in RTL
 *        by index.css), and the top-3 + "+n more" → "Show fewer"
 *        disclosure with aria-expanded/aria-controls, exactly as the
 *        pre-handoff card did (the redesign changed the face, not the
 *        mechanics).
 *
 * jsdom notes: Element.scrollTo does not exist there (the Next/Previous
 * clicks stub it — the assertion is the call + the resulting active
 * card), and window.matchMedia is stubbed the same way Converter.test
 * stubs Odometer's reduced-motion check.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { HeroBlock } from './HeroBlock';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

/** A reading fixture — warning tier by default (the flagged rows are the
 * subject of §8; percentile10y feeds the extremity sort). */
function reading(id: IndicatorId, overrides: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 4.35,
    asOf: '2026-10-17',
    status: 'warning',
    sourceName: 'Test',
    updatedAt: '2026-10-18T08:38:42.878Z',
    percentile10y: 0.9,
    ...overrides,
  } as IndicatorReading;
}

/** Four flagged Global voters + two calm ones, four flagged Australia
 * voters + one calm one — real gauge members on both sides so
 * attentionTiles/sectionVerdictStep exercise their real code paths. */
const READINGS: IndicatorReading[] = [
  reading('us10y', { percentile10y: 0.97 }),
  reading('real-yield-10y', { percentile10y: 0.95 }),
  reading('fed-expectations', { percentile10y: 0.93 }),
  reading('us-cpi-yoy', { percentile10y: 0.91 }),
  reading('brent', { percentile10y: 0.7 }),
  reading('yield-curve-10y2y', { status: 'normal', percentile10y: 0.5 }),
  reading('vix', { status: 'normal', percentile10y: 0.4 }),
  reading('au-cpi', { percentile10y: 0.96 }),
  reading('au-trimmed-mean', { percentile10y: 0.94 }),
  reading('au-home-loan', { percentile10y: 0.92 }),
  reading('au-wage-growth', { percentile10y: 0.9 }),
  reading('au-10y', { percentile10y: 0.8 }),
  reading('au-rent-yoy', { status: 'normal', percentile10y: 0.5 }),
];

const noop = () => undefined;

function renderHero(copy: typeof insightsCopyEn | typeof insightsCopyFa, numberLocale: 'en-US' | 'fa-IR') {
  return render(
    <HeroBlock
      readings={READINGS}
      copy={copy}
      numberLocale={numberLocale}
      onJumpSection={noop}
      onFocusCard={noop}
    />,
  );
}

/** The carousel track element ([data-region-track]). */
function trackOf(): HTMLElement {
  const el = document.querySelector('[data-region-track]');
  expect(el).not.toBeNull();
  return el as HTMLElement;
}

/** The region cards in DOM order. */
function regionCards(): HTMLElement[] {
  return Array.from(trackOf().querySelectorAll(':scope > [data-region-card]')) as HTMLElement[];
}

/** Regex-escape a copy string (the no-reading word contains no specials
 * today, but the guard should not break when copy evolves). */
function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------------------------------------------ *
 * §10 — the Global-first mobile carousel
 * ------------------------------------------------------------------ */

describe('editorial hero §10 — the Global-first swipe carousel', () => {
  beforeEach(() => {
    // jsdom: no matchMedia (the reduced-motion check inside goToCard).
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('the track DOM carries Global only — the carousel opens on Global (D7, single card)', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]!.getAttribute('data-region-card')).toBe('global');
    // TM7: the Australia verdict card moved to /australia — no [data-region-card="australia"] in the hero.
    expect(document.querySelector('[data-region-card="australia"]')).toBeNull();
  });

  it('each card is a labelled group ("{card} card, {n} of {m}")', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    expect(cards[0]!.getAttribute('role')).toBe('group');
    // TM7: single card → "1 of 1" (was "1 of 2" when the Australia card lived in the hero).
    expect(cards[0]!.getAttribute('aria-label')).toBe('Global card, 1 of 1');
  });

  it('the track exposes the carousel label; with a single card no swipe cue renders', () => {
    renderHero(insightsCopyEn, 'en-US');
    expect(trackOf().getAttribute('aria-label')).toBe(insightsCopyEn.ui.carouselLabel);
    // TM7: single card → the CarouselControls (cue + dots + buttons) are
    // gated behind labels.length > 1, so none of them render.
    expect(document.querySelector('[data-region-carousel]')).toBeNull();
    expect(screen.queryByText('Swipe to view', { exact: false })).toBeNull();
  });

  it('with a single card no position dots render', () => {
    renderHero(insightsCopyEn, 'en-US');
    // TM7: the CarouselControls (incl. the [data-carousel-dot] buttons) are
    // gated behind labels.length > 1, so none render when there's one card.
    const dotButtons = Array.from(document.querySelectorAll('[data-carousel-dot]')) as HTMLButtonElement[];
    expect(dotButtons).toHaveLength(0);
  });

  it('with a single card the Previous/Next buttons do not render', () => {
    renderHero(insightsCopyEn, 'en-US');
    // TM7: the [data-carousel-buttons] wrapper (Prev/Next) is gated behind
    // labels.length > 1, so neither button renders when there's one card.
    expect(document.querySelector('[data-carousel-buttons]')).toBeNull();
    expect(
      screen.queryByRole('button', { name: new RegExp(`^${insightsCopyEn.ui.prevCard}$`) }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: new RegExp(`^${insightsCopyEn.ui.nextCard}$`) }),
    ).toBeNull();
  });

  it('fa: with a single card the carousel controls do not render (RTL locale)', () => {
    renderHero(insightsCopyFa, 'fa-IR');
    expect(trackOf().getAttribute('aria-label')).toBe(insightsCopyFa.ui.carouselLabel);
    // TM7: single card → the cue, dots, and buttons are all hidden.
    expect(document.querySelector('[data-region-carousel]')).toBeNull();
    expect(document.querySelector('[data-carousel-buttons]')).toBeNull();
    expect(document.querySelectorAll('[data-carousel-dot]')).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * §7 — the art band · §4 — the severity pill · §8 — the rows
 * ------------------------------------------------------------------ */

describe('editorial hero §7/§4/§8 — art band, severity pill, flagged rows', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('the Global card carries ONE decorative art layer (the map), aria-hidden', () => {
    renderHero(insightsCopyEn, 'en-US');
    const globalArt = document.querySelector('[data-hero-art="global"]');
    expect(globalArt).not.toBeNull();
    expect(globalArt!.getAttribute('aria-hidden')).toBe('true');
    // TM7: the Australia card moved to /australia — exactly one art layer
    // remains in the hero (the Sydney art layer lives on /australia now).
    expect(document.querySelectorAll('[data-hero-art]')).toHaveLength(1);
    expect(document.querySelector('[data-hero-art="australia"]')).toBeNull();
  });

  it('the verdict word rides the tinted pill and the four-step meter stays beside it', () => {
    renderHero(insightsCopyEn, 'en-US');
    const pills = Array.from(document.querySelectorAll('[data-verdict-pill]')) as HTMLElement[];
    // TM7: single Global card → one pill (was 2 with the Australia card).
    expect(pills).toHaveLength(1);
    for (const pill of pills) {
      const step = Number(pill.getAttribute('data-step'));
      expect(step).toBeGreaterThanOrEqual(1);
      expect(step).toBeLessThanOrEqual(4);
      // the pill text is the verdict word (Critical/Stressed/Cautious/Stable)
      expect(pill.textContent).toMatch(/^(Critical|Stressed|Cautious|Stable)$/);
    }
    // the hero-size meter rides beside its pill (the per-gauge rows carry
    // their own compact meters further down the card)
    const meters = Array.from(document.querySelectorAll('.verdict-meter-lg'));
    expect(meters).toHaveLength(1);
    for (const m of meters) expect(m.getAttribute('role')).toBe('img');
  });

  it('the flagged rows keep the top-3 + "+n more" disclosure and gain the editorial anatomy', () => {
    renderHero(insightsCopyEn, 'en-US');
    const list = document.getElementById('attention-list-global');
    expect(list).not.toBeNull();
    const rows = () => Array.from(list!.querySelectorAll(':scope > li'));
    expect(rows()).toHaveLength(3); // top three, always first

    // anatomy: each row button carries the leading icon container and the
    // trailing .ei-row-chevron drill-down glyph
    const firstButton = rows()[0]!.querySelector('button');
    expect(firstButton).not.toBeNull();
    expect(firstButton!.querySelector('.ei-row-chevron')).not.toBeNull();
    expect(firstButton!.className).toContain('ei-row-accent');

    // "+2 more" reveals the remaining REAL rows in place (4 more warnings
    // in the fixture: fed-expectations, us-cpi-yoy, brent … minus shown 3
    // of 5 global warnings → +2)
    const more = Array.from(document.querySelectorAll('button[aria-controls="attention-list-global"]')).find(
      (b) => b.textContent!.includes('more'),
    );
    expect(more).toBeTruthy();
    expect(more!.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more!);
    expect(rows().length).toBe(5);
    // …and "Show fewer" collapses back, announcing the expanded state
    const fewer = Array.from(document.querySelectorAll('button[aria-controls="attention-list-global"]')).find(
      (b) => b.textContent === insightsCopyEn.ui.showFewer,
    );
    expect(fewer).toBeTruthy();
    expect(fewer!.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(fewer!);
    expect(rows()).toHaveLength(3);
  });

  it('the heading count names the FULL set, not the visible rows', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    const globalCard = within(cards[0]! as HTMLElement);
    // 5 global warnings in the fixture → the heading says "· 5"
    expect(globalCard.getByText('Needing attention now', { exact: false }).textContent).toContain('5');
  });
});

/* ------------------------------------------------------------------ *
 * UI-fidelity round (2026-10-19, the owner's correction brief) —
 * §5 the severity mapping, §7 the category rows + explanation panel +
 * bottom information strip.
 * ------------------------------------------------------------------ */

describe('fidelity round §5 — the region severity mapping', () => {
  afterEach(cleanup);

  it('each card article carries data-ei-step matching its own verdict pill', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    for (const card of cards) {
      const article = card.querySelector('article[data-ei-step]') as HTMLElement | null;
      expect(article).not.toBeNull();
      const pill = card.querySelector('[data-verdict-pill]');
      expect(pill).not.toBeNull();
      // the accent hook (index.css --ei-accent) and the pill can never
      // disagree — Australia Stressed ⇒ its rows speak the amber ink
      expect(article!.getAttribute('data-ei-step')).toBe(pill!.getAttribute('data-step'));
    }
  });
});

describe('fidelity round §7 — the category summary rows', () => {
  afterEach(cleanup);

  it('one compact row per gauge: label + state badge + sm meter, worst first', () => {
    renderHero(insightsCopyEn, 'en-US');
    for (const card of regionCards()) {
      const module = card.querySelector('[data-hero-gauges]');
      expect(module).not.toBeNull();
      // the visible heading names the module (heroGaugesLabel)
      expect(module!.textContent).toContain(insightsCopyEn.ui.heroGaugesLabel);
      const rows = Array.from(module!.querySelectorAll('[data-gauge]')) as HTMLElement[];
      expect(rows.length).toBeGreaterThanOrEqual(2);
      const steps = rows.map((r) => Number(r.getAttribute('data-gauge-step')));
      // worst first: the sorted head never sits below a calmer row
      const sorted = [...steps].sort((a, b) => b - a);
      expect(steps).toEqual(sorted);
      for (const row of rows) {
        expect(row.querySelector('.verdict-meter-sm')).not.toBeNull();
        // the row's badge carries a state word (or the honest no-reading)
        expect(row.textContent).toMatch(
          new RegExp(`(Stable|Cautious|Stressed|Critical|${escapeRe(insightsCopyEn.ui.gaugeNoReading)})`),
        );
      }
    }
  });
});

describe('fidelity round §7 — the closing panels (round 3: rule behind a low-key toggle; round 4: both cards close with the signals box)', () => {
  afterEach(cleanup);

  it('without feeds GLOBAL keeps the word-choice rule behind the low-key toggle that reveals the real panel', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    // TM7: single Global card (was 2 with the Australia card).
    expect(cards).toHaveLength(1);
    const card = cards[0]!;
    // collapsed by default: the quiet pill carries the panel label, and
    // no panel exists in the DOM yet
    const toggle = card.querySelector('[data-ei-rule-toggle]') as HTMLElement | null;
    expect(toggle).not.toBeNull();
    expect(toggle!.getAttribute('aria-expanded')).toBe('false');
    expect(toggle!.getAttribute('aria-controls')).toMatch(/^ei-rule-panel-(global|australia)$/);
    expect(toggle!.textContent).toContain(insightsCopyEn.ui.verdictRuleLabel);
    expect(card.querySelector('[data-ei-panel]')).toBeNull();
    // the click reveals the real rule panel — the same hooks, same copy
    fireEvent.click(toggle!);
    expect(toggle!.getAttribute('aria-expanded')).toBe('true');
    const panel = card.querySelector('[data-ei-panel]') as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(panel!.id).toBe(toggle!.getAttribute('aria-controls'));
    expect(panel!.getAttribute('data-ei-panel-kind')).toBe('rule');
    const heading = panel!.querySelector('[data-ei-panel-heading]');
    expect(heading!.textContent).toContain(insightsCopyEn.ui.verdictRuleLabel);
    const rule = panel!.querySelector('[data-ei-panel-rule]');
    expect(rule!.textContent).toBe(insightsCopyEn.ui.verdictRule);
  });

  it('Global with raised signals carries the signals panel OPEN (never toggled)', () => {
    render(
      <HeroBlock
        readings={READINGS}
        copy={insightsCopyEn}
        numberLocale="en-US"
        onJumpSection={noop}
        onFocusCard={noop}
        marketsAlert={{ signal: 'attention', n: 4, count: 16 }}
        onJumpMarkets={noop}
      />,
    );
    const cards = regionCards();
    // TM7: single Global card (was 2 with the Australia card).
    expect(cards).toHaveLength(1);
    // the signals panel is the emphasized, always-open module — no toggle
    expect(cards[0]!.querySelector('[data-ei-rule-toggle]')).toBeNull();
    const globalPanel = cards[0]!.querySelector('[data-ei-panel]') as HTMLElement | null;
    expect(globalPanel).not.toBeNull();
    expect(globalPanel!.getAttribute('data-ei-panel-kind')).toBe('signals');
    // the signals panel keeps the established attention-box hook
    expect(globalPanel!.hasAttribute('data-attention-box')).toBe(true);
    expect(globalPanel!.querySelector('[data-ei-panel-heading]')!.textContent).toContain(
      insightsCopyEn.ui.worldSignalsTitle,
    );
    expect(globalPanel!.querySelector('[data-attention-bullets]')).not.toBeNull();
    // the raised market signal bullet rides with its numbers
    expect(globalPanel!.textContent).toContain('4');
    // TM7: the Australia signals box moved to /australia — only the
    // Global signals panel renders in the hero now.
    expect(document.querySelector('[data-region-card="australia"]')).toBeNull();
  });

  it('fa: the rule fallback (Global without feeds) still speaks Persian', () => {
    renderHero(insightsCopyFa, 'fa-IR');
    const global = regionCards()[0]!;
    const toggle = global.querySelector('[data-ei-rule-toggle]') as HTMLElement | null;
    expect(toggle).not.toBeNull();
    expect(toggle!.textContent).toContain(insightsCopyFa.ui.verdictRuleLabel);
    fireEvent.click(toggle!);
    const panel = global.querySelector('[data-ei-panel]') as HTMLElement | null;
    expect(panel!.querySelector('[data-ei-panel-rule]')!.textContent).toBe(insightsCopyFa.ui.verdictRule);
    expect(panel!.querySelector('[data-ei-panel-heading]')!.textContent).toContain(
      insightsCopyFa.ui.verdictRuleLabel,
    );
  });
});

describe('fidelity round §7 — the bottom information strip', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    // jsdom: no scrollIntoView / matchMedia (the strip's jump path).
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
  });

  // 2026-10-21 owner round: the ContinueStrip component itself is RETIRED
  // (the sticky JumpNav pills already carry the same labels and the same
  // expand-then-scroll navigation — the strip read as a redundant second
  // set of the same buttons), so its regression guards retire with it.
  it('the strip is retired — no [data-continue-strip] renders anywhere', () => {
    renderHero(insightsCopyEn, 'en-US');
    expect(document.querySelector('[data-continue-strip]')).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * Gap-closure S1-M1.4 (2026-10-31) — the stale-voter honesty badge:
 * a calm "n of m readings out of date" chip on the hero verdict card
 * (and the gauge headers) whenever gauge members' readings sit past
 * their staleness window. The card is never hidden; the verdict comes
 * from the fresh voters only (the stale members dilute, never vote).
 * ------------------------------------------------------------------ */

describe('S1-M1.4 — the out-of-date badge on the hero verdict cards', () => {
  afterEach(cleanup);

  /** The base fixture plus the RBA trio all stale (au-10y is flipped in
   * place; rba-expectations and au-us-10y-gap are added as stale readings
   * — the fixture never carried them). */
  const withRbaStale: IndicatorReading[] = [
    ...READINGS.map((r) => (r.id === 'au-10y' ? { ...r, status: 'stale' as const } : r)),
    reading('rba-expectations', { status: 'stale', percentile10y: 0.6 }),
    reading('au-us-10y-gap', { status: 'stale', percentile10y: 0.55 }),
  ];

  it('no stale members → no badge anywhere (the calm default)', () => {
    renderHero(insightsCopyEn, 'en-US');
    expect(document.querySelector('[data-stale-badge]')).toBeNull();
  });

  it('the badge counts only STALE members — unavailable readings never trigger it', () => {
    const withUnavailable = READINGS.map((r) =>
      r.id === 'au-10y' ? { ...r, status: 'unavailable' as const, value: null, asOf: null } : r,
    );
    render(
      <HeroBlock
        readings={withUnavailable}
        copy={insightsCopyEn}
        numberLocale="en-US"
        onJumpSection={noop}
        onFocusCard={noop}
      />,
    );
    expect(document.querySelector('[data-stale-badge]')).toBeNull();
  });

});
