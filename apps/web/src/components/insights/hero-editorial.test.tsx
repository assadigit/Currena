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
import { ContinueStrip } from './ContinueStrip';

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
      changedThisWeek={[]}
      copy={copy}
      numberLocale={numberLocale}
      onJumpSection={noop}
      onJumpAbout={noop}
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

  it('the track DOM order is Global → Australia — the carousel opens on Global (D7)', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    expect(cards).toHaveLength(2);
    expect(cards[0]!.getAttribute('data-region-card')).toBe('global');
    expect(cards[1]!.getAttribute('data-region-card')).toBe('australia');
  });

  it('each card is a labelled group ("{card} card, {n} of {m}")', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    expect(cards[0]!.getAttribute('role')).toBe('group');
    expect(cards[0]!.getAttribute('aria-label')).toBe('Global card, 1 of 2');
    expect(cards[1]!.getAttribute('aria-label')).toBe('Australia card, 2 of 2');
  });

  it('the track exposes the carousel label; the cue names the OTHER card', () => {
    renderHero(insightsCopyEn, 'en-US');
    expect(trackOf().getAttribute('aria-label')).toBe(insightsCopyEn.ui.carouselLabel);
    // Global active → the cue points at Australia (spec's example cue).
    expect(screen.getByText('Swipe to view Australia', { exact: false })).toBeTruthy();
  });

  it('two position dots; the active one carries aria-current', () => {
    renderHero(insightsCopyEn, 'en-US');
    const dotButtons = Array.from(document.querySelectorAll('[data-carousel-dot]')) as HTMLButtonElement[];
    expect(dotButtons).toHaveLength(2);
    expect(dotButtons[0]!.getAttribute('aria-current')).toBe('true');
    expect(dotButtons[1]!.getAttribute('aria-current')).toBe('false');
    // the dots' accessible names are the "n of m" positions
    expect(dotButtons[0]!.getAttribute('aria-label')).toBe('Global card, 1 of 2');
    expect(dotButtons[1]!.getAttribute('aria-label')).toBe('Australia card, 2 of 2');
  });

  it('Previous is disabled on Global; Next scrolls to Australia and flips the furniture', () => {
    const scrollTo = vi.fn();
    // jsdom has no Element.scrollTo — the click path needs one.
    Object.defineProperty(window.HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      writable: true,
      value: scrollTo,
    });
    try {
      renderHero(insightsCopyEn, 'en-US');
      const prev = screen.getByRole('button', { name: new RegExp(`^${insightsCopyEn.ui.prevCard}$`) });
      const next = screen.getByRole('button', { name: new RegExp(`^${insightsCopyEn.ui.nextCard}$`) });
      expect(prev.hasAttribute('disabled')).toBe(true);
      expect(next.hasAttribute('disabled')).toBe(false);

      fireEvent.click(next);
      expect(scrollTo).toHaveBeenCalledTimes(1);
      const dots = Array.from(document.querySelectorAll('[data-carousel-dot]')) as HTMLButtonElement[];
      expect(dots[0]!.getAttribute('aria-current')).toBe('false');
      expect(dots[1]!.getAttribute('aria-current')).toBe('true');
      // On Australia the cue points BACK at Global.
      expect(screen.getByText('Swipe to view Global', { exact: false })).toBeTruthy();
      expect(prev.hasAttribute('disabled')).toBe(false);
      expect(next.hasAttribute('disabled')).toBe(true);

      fireEvent.click(prev);
      const dots2 = Array.from(document.querySelectorAll('[data-carousel-dot]')) as HTMLButtonElement[];
      expect(dots2[0]!.getAttribute('aria-current')).toBe('true');
    } finally {
      Reflect.deleteProperty(window.HTMLElement.prototype, 'scrollTo');
    }
  });

  it('fa: the cue and the dot labels speak Persian (RTL locale)', () => {
    renderHero(insightsCopyFa, 'fa-IR');
    expect(trackOf().getAttribute('aria-label')).toBe(insightsCopyFa.ui.carouselLabel);
    expect(screen.getByText('برای دیدن استرالیا بکشید', { exact: false })).toBeTruthy();
    const dotButtons = Array.from(document.querySelectorAll('[data-carousel-dot]')) as HTMLButtonElement[];
    expect(dotButtons[0]!.getAttribute('aria-label')).toBe('کارت جهانی، ۱ از ۲');
    expect(dotButtons[1]!.getAttribute('aria-label')).toBe('کارت استرالیا، ۲ از ۲');
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

  it('each region card carries ONE decorative art layer (Sydney/map), aria-hidden', () => {
    renderHero(insightsCopyEn, 'en-US');
    const auArt = document.querySelector('[data-hero-art="australia"]');
    const globalArt = document.querySelector('[data-hero-art="global"]');
    expect(auArt).not.toBeNull();
    expect(globalArt).not.toBeNull();
    expect(auArt!.getAttribute('aria-hidden')).toBe('true');
    expect(globalArt!.getAttribute('aria-hidden')).toBe('true');
    // exactly one art layer per card
    expect(document.querySelectorAll('[data-hero-art]')).toHaveLength(2);
  });

  it('the verdict word rides the tinted pill and the four-step meter stays beside it', () => {
    renderHero(insightsCopyEn, 'en-US');
    const pills = Array.from(document.querySelectorAll('[data-verdict-pill]')) as HTMLElement[];
    expect(pills).toHaveLength(2);
    for (const pill of pills) {
      const step = Number(pill.getAttribute('data-step'));
      expect(step).toBeGreaterThanOrEqual(1);
      expect(step).toBeLessThanOrEqual(4);
      // the pill text is the verdict word (Critical/Stressed/Cautious/Stable)
      expect(pill.textContent).toMatch(/^(Critical|Stressed|Cautious|Stable)$/);
    }
    // the hero-size meters ride beside their pills (the per-gauge rows carry
    // their own compact meters further down each card)
    const meters = Array.from(document.querySelectorAll('.verdict-meter-lg'));
    expect(meters).toHaveLength(2);
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

describe('fidelity round §7 — the contextual explanation panel', () => {
  afterEach(cleanup);

  it('every region card closes with a panel; without feeds it carries the word-choice rule', () => {
    renderHero(insightsCopyEn, 'en-US');
    const cards = regionCards();
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      const panel = card.querySelector('[data-ei-panel]');
      expect(panel).not.toBeNull();
      expect(panel!.getAttribute('data-ei-panel-kind')).toBe('rule');
      const heading = panel!.querySelector('[data-ei-panel-heading]');
      expect(heading!.textContent).toContain(insightsCopyEn.ui.verdictRuleLabel);
      const rule = panel!.querySelector('[data-ei-panel-rule]');
      expect(rule!.textContent).toBe(insightsCopyEn.ui.verdictRule);
    }
  });

  it('Global with raised signals carries the signals panel (heading + bullet); Australia never does', () => {
    render(
      <HeroBlock
        readings={READINGS}
        changedThisWeek={[]}
        copy={insightsCopyEn}
        numberLocale="en-US"
        onJumpSection={noop}
        onJumpAbout={noop}
        onFocusCard={noop}
        marketsAlert={{ signal: 'attention', n: 4, count: 16 }}
        onJumpMarkets={noop}
      />,
    );
    const cards = regionCards();
    const globalPanel = cards[0]!.querySelector('[data-ei-panel]') as HTMLElement | null;
    const auPanel = cards[1]!.querySelector('[data-ei-panel]') as HTMLElement | null;
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
    // Australia keeps the rule panel — the world signals are Global-scope
    expect(auPanel!.getAttribute('data-ei-panel-kind')).toBe('rule');
  });

  it('fa: the rule panel speaks Persian', () => {
    renderHero(insightsCopyFa, 'fa-IR');
    const card = regionCards()[1]!;
    const panel = card.querySelector('[data-ei-panel]') as HTMLElement | null;
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

  it('names the next sections in order and jumps on click', () => {
    const onWillNavigate = vi.fn();
    const targets = [
      { id: 'insights-prices', label: 'Prices' },
      { id: 'insights-together', label: 'Together' },
      { id: 'insights-about', label: 'About' },
    ];
    const { container } = render(
      <ContinueStrip targets={targets} copy={insightsCopyEn} onWillNavigate={onWillNavigate} />,
    );
    const nav = container.querySelector('[data-continue-strip]');
    expect(nav).not.toBeNull();
    const buttons = Array.from(nav!.querySelectorAll('[data-continue-target]')) as HTMLElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(['Prices', 'Together', 'About']);
    fireEvent.click(buttons[0]!);
    expect(onWillNavigate).toHaveBeenCalledWith('insights-prices');
    // the lead-in names the strip's purpose
    expect(nav!.textContent).toContain(insightsCopyEn.ui.continueLabel);
  });

  it('empty targets render nothing', () => {
    const { container } = render(<ContinueStrip targets={[]} copy={insightsCopyEn} />);
    expect(container.querySelector('[data-continue-strip]')).toBeNull();
  });
});
