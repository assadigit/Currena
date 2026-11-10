/**
 * @vitest-environment jsdom
 *
 * GoldPage.characterization.test.tsx (S5, 2026-11-08) — the Gold page's
 * DOM-level characterization suite. What is pinned:
 *
 *   - the honest load state (the loading line, never a blank screen);
 *   - the hero: the live price value, the day change with its window
 *     tag, the 10-year position line, the balance verdict word, the
 *     7-state outlook and the for/against/not-leaning/unread counts —
 *     every one derived from the SAME engines (asserted against
 *     goldBalance over the same fixture, never hand-counted);
 *   - S6 (BD-S6a): the hero's balance-view ALTERNATION — the classic
 *     view (the previous brass balance shape, smaller) is the DEFAULT,
 *     the minimal glyph one radio away, the choice persisted; the
 *     classic stage renders the engine's own lane sides, weights and
 *     beam tilt through the SAME extracted drawing the legacy card
 *     renders (data-balance-*), and its words are the corpus's own;
 *   - the 37 seats: every chip renders with its lean word and, when it
 *     fires, its evidence word — the impact distribution matching the
 *     engine's own member lines;
 *   - the five lanes with their side words;
 *   - the seat home links (data-seat-home) — the placement's own table;
 *   - the context cards (13 visible + the hero), the four blocked
 *     notes, the honest-record footnote;
 *   - the fail-closed path: a dead projection renders the honest error
 *     state with the retry, never a guess;
 *   - the M-17 last-good path: a failed refresh keeps the cached copy
 *     on screen, labelled.
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { IndicatorReading, PageProjection } from '@currena/core';
import { PageProjectionSchema } from '@currena/core';
import { goldBalance } from '@currena/insights';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
import { balanceTilt } from '../../components/insights/signals/BalanceScale';
import { GoldPage } from './GoldPage';
import { GOLD_CONTEXT_IDS } from './gold-tiles';
import { clearProjectionCacheForTests } from '../../lib/page-division';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-07T20:11:07.445Z',
    ...partial,
  } as IndicatorReading;
}

/** The Gold projection: all 37 voters + the 14 context homes (48 ids —
 * gold-silver and the CFTC pair serve both roles). Inputs chosen to
 * move four lanes for and one against, deterministically. */
function projectionFixture(): PageProjection {
  const readings: IndicatorReading[] = [];

  // The hero price (live-merged shape: value + changes + percentile).
  readings.push(reading('gold-usd', { value: 4072.1, change7d: 4.44, change30d: -3.42, percentile10y: 0.906 }));

  // All remaining ids — the 37 voters ∪ the 14 context homes, MERGED for
  // the dual-role ids (gold-silver + the CFTC pair are both voters and
  // context cards: one reading, both roles). The voter inputs set the
  // firing legs; the context values set the displayed numbers.
  // The firing inputs: borrowing-costs (two falling yields → supports),
  // dollar (three falling measures → supports), stress (three highs →
  // supports), inflation (three hot readings → supports), flows (two
  // crowded positioning reads → pressures, the contrarian lane).
  const inputs: Record<string, Partial<IndicatorReading>> = {
    'real-yield-10y': { change30d: -1.0 },
    us10y: { change30d: -1.0 },
    'dollar-basket': { change30d: -2.0 },
    'dollar-broad': { change30d: -2.0 },
    'dollar-eme': { change30d: -2.0 },
    'stress-stlfsi': { percentile10y: 0.9 },
    nfci: { percentile10y: 0.9 },
    vix: { percentile10y: 0.9 },
    'us-cpi-yoy': { percentile10y: 0.9 },
    'us-pce-core-yoy': { percentile10y: 0.9 },
    'euro-hicp': { percentile10y: 0.9 },
    'cftc-gold-positioning': { percentile10y: 0.9 },
    'cftc-gold-gross-long': { percentile10y: 0.9 },
  };
  const contextValues: Record<string, Partial<IndicatorReading>> = {
    'gold-silver': { value: 78.5, percentile10y: 0.366, change30d: 8.7 },
    'gold-btc': { value: 0.053727 },
    'gold-aud': { value: 5930.6095 },
    'gold-oil-ratio': { value: 41.45, percentile10y: 0.795 },
    'gold-platinum': { value: 2.64, percentile10y: 0.862 },
    'real-gold-price': { value: 1243, percentile10y: 0.931 },
    'copper-gold': { value: 3.5342265529841654, percentile10y: 0.263 },
    'gold-equities-ratio': { value: 0.5066, percentile10y: 0.587 },
    'cftc-gold-positioning': { value: 44.9804 },
    'cftc-gold-gross-long': { value: 55.2473 },
    'sge-gold-withdrawals': { value: 92.08 },
    'swiss-gold-flow': { value: 227.9, percentile10y: 0.824 },
    'shanghai-gold-premium': { value: -0.62, percentile10y: 0.439 },
  };
  const allIds = [...new Set([...GOLD_VOTER_IDS, ...GOLD_CONTEXT_IDS])];
  for (const id of allIds) {
    if (id === 'gold-usd') continue;
    readings.push(reading(id, { value: 1, ...(contextValues[id] ?? {}), ...(inputs[id] ?? { percentile10y: contextValues[id]?.percentile10y ?? 0.5 }) }));
  }

  return {
    page: 'gold',
    generatedAt: '2026-11-07T20:11:07.445Z',
    pricesAsOf: '2026-11-08T00:13:17.925Z',
    displayMode: 'public',
    readings,
    absentIds: ['wgc-etf-holdings', 'wgc-cb-demand', 'official-gold-demand', 'etf-short-interest'],
    boards: [],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFound(): Response {
  return jsonResponse({ error: { code: 'unknown_page', message: 'not found' } }, 404);
}

/** Route the stubbed fetch by URL — the Gold projection feed. */
function stubFeeds(overrides: { projection?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/gold')) return (overrides.projection ?? (() => jsonResponse(projectionFixture())))();
      return notFound();
    }),
  );
}

beforeEach(() => {
  clearProjectionCacheForTests();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The page
 * ------------------------------------------------------------------ */

describe('GoldPage', () => {
  it('fixture sanity: the payload satisfies the projection contract', () => {
    expect(() => PageProjectionSchema.parse(projectionFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    const { container } = render(<GoldPage />);
    expect(container.textContent).toContain('Reading the gold meter');
  });

  it('renders the hero: live price + change + position + verdict + outlook + counts (the engines\' own values)', async () => {

    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-hero]')).not.toBeNull();
    });

    // S19 (2026-11-12): the wayfinding row — Home › Gold (BD-S19b).
    expect(document.querySelector('[data-page-breadcrumbs] [aria-current=\'page\']')?.textContent).toBe('Gold');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');

    // The engine's own derivations over the same fixture — never
    // hand-counted (the characterization pins the PIPE, the engine
    // provides the numbers).
    const balance = goldBalance(projectionFixture().readings);

    // The live price + its unit.
    const hero = document.querySelector('[data-gold-hero]')!;
    expect(hero.textContent).toContain('4,072');
    expect(hero.textContent).toContain('US$');
    // The day change with its VISIBLE window tag (change7d → 7d here).
    expect(hero.textContent).toContain('+4.44%');
    expect(hero.textContent).toContain('7d');
    // The 10-year position line (percentile 0.906 → top 9%).
    expect(hero.textContent).toContain('top 9%');
    // The hourly live-prices stamp.
    expect(hero.textContent).toContain('Live prices as of');

    // The balance verdict word + the outlook + the counts line.
    expect(document.querySelector('[data-hero-verdict]')?.getAttribute('data-hero-verdict')).toBe(
      balance.net > 0 ? 'for' : balance.net < 0 ? 'against' : 'balanced',
    );
    const countsText = `${balance.counts.for} for · ${balance.counts.against} against`;
    expect(hero.textContent).toContain(countsText);
    // gold's own 30-day move — the context line, never counted.
    expect(hero.textContent).toContain('Gold over the last 30 days');
    expect(hero.textContent).toContain('−3.42%');
  });

  it('S6: the hero\u2019s balance view ALTERNATES — the classic previous shape is the default, the minimal glyph one radio away, the choice persisted', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-hero]')).not.toBeNull();
    });

    // The DEFAULT is the classic view (BD-S6a): the previous shape — the
    // brass stage + weights + tray through the extracted drawing — and
    // NO minimal glyph.
    expect(document.querySelector('[data-hero-balance-view]')?.getAttribute('data-hero-balance-view')).toBe('classic');
    expect(document.querySelector('[data-balance-classic]')).not.toBeNull();
    expect(document.querySelector('[data-balance-stage]')).not.toBeNull();
    expect(document.querySelector('[data-hero-beam]')).toBeNull();

    // The radio group: two real options, the group labelled.
    const group = document.querySelector('[data-hero-balance-view]')!;
    expect(group.querySelector('legend')?.textContent).toBe('Balance view');
    const radios = group.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);

    // Toggle to the minimal view: the glyph appears, the stage leaves,
    // and the choice persists to localStorage.
    fireEvent.click(radios[1]!);
    await waitFor(() => {
      expect(document.querySelector('[data-hero-balance-view]')?.getAttribute('data-hero-balance-view')).toBe('minimal');
    });
    expect(document.querySelector('[data-hero-beam]')).not.toBeNull();
    expect(document.querySelector('[data-balance-classic]')).toBeNull();
    expect(window.localStorage.getItem('currena:pd:gold:balance-view')).toBe('minimal');

    // The engine\u2019s own lines stay in BOTH views: the verdict word +
    // the outlook + the counts ride the hero block either way.
    expect(document.querySelector('[data-hero-verdict]')?.getAttribute('data-hero-verdict')).toBe('for');
    expect(document.querySelector('[data-hero-outlook]')).not.toBeNull();
  });

  it('S6: the classic view renders the engine\u2019s own lane sides + weights + beam tilt through the SAME drawing the legacy card renders', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-balance-classic]')).not.toBeNull();
    });

    // The engine\u2019s own derivations over the same fixture — never
    // hand-counted (the pipes, the engine provides the numbers).
    const balance = goldBalance(projectionFixture().readings);

    // One WEIGHT per lane (5), each on the pan its side belongs to, its
    // accessible name the laneChipAria composition (lane + side + tally —
    // the corpus's own words, gold-copy-pin's pins).
    const LANE_NAME: Record<string, string> = {
      'borrowing-costs': 'Borrowing costs',
      dollar: 'Dollar',
      stress: 'Market stress',
      inflation: 'Inflation',
      flows: 'Flows & demand',
    };
    const SIDE_WORD: Record<string, string> = {
      for: 'Supports',
      against: 'Works against',
      neutral: 'Sitting neutral',
      unread: 'Cannot read',
    };
    const weights = document.querySelectorAll('[data-balance-weight]');
    expect(weights.length).toBe(balance.lanes.length);
    for (const lane of balance.lanes) {
      const weight = document.querySelector(`[data-balance-weight="${lane.lane}"]`) as HTMLElement;
      expect(weight, `weight ${lane.lane}`).not.toBeNull();
      expect(weight.getAttribute('aria-label')).toContain(`${LANE_NAME[lane.lane]}: ${SIDE_WORD[lane.split ? 'neutral' : lane.side]}.`);
    }
    // The pans: the for pan holds the for lanes, the against pan the
    // against lanes (the fixture: 4 for · 1 against).
    const forPan = document.querySelector('[data-balance-pan="for"]')!;
    const againstPan = document.querySelector('[data-balance-pan="against"]')!;
    expect(forPan.querySelectorAll('[data-balance-weight]').length).toBe(balance.counts.for);
    expect(againstPan.querySelectorAll('[data-balance-weight]').length).toBe(balance.counts.against);
    expect(forPan.textContent).toContain('Factors supporting gold’s price');
    expect(againstPan.textContent).toContain('Factors pressuring gold’s price');

    // The tray speaks its empty state (every lane sits on a pan in this
    // fixture) — the not-leaning well is part of the previous shape.
    expect(document.querySelector('[data-balance-tray="not-leaning"]')?.textContent).toContain('Every driver is on a pan.');

    // The beam swings on the engine\u2019s own tilt (balanceTilt over the
    // same counts — one math with the legacy card\u2019s beam).
    const beam = document.querySelector('[data-balance-beam]') as HTMLElement;
    expect(beam).not.toBeNull();
    const counts = { ...balance.counts, total: balance.lanes.length, net: balance.net, readable: balance.readable };
    const expectedTilt = balanceTilt(counts, 320);
    const expectedSigned = expectedTilt.heavy === 'against' ? expectedTilt.angleDeg : expectedTilt.heavy === 'for' ? -expectedTilt.angleDeg : 0;
    expect(beam.getAttribute('data-tilt')).toBe(String(expectedSigned));
  });

  it('renders all 37 seat chips with lean + evidence words, the impact distribution matching the engine', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });

    const balance = goldBalance(projectionFixture().readings);
    const engineImpacts = balance.lanes.flatMap((l) => l.members.map((m) => m.impact));

    // Every seat renders with its lean word + evidence word (when firing).
    const seats = document.querySelectorAll('[data-seat]');
    const impactCounts: Record<string, number> = {};
    for (const seat of seats) {
      const impact = seat.getAttribute('data-seat-impact')!;
      impactCounts[impact] = (impactCounts[impact] ?? 0) + 1;
      // The lean word rides the chip text.
      expect(seat.textContent?.length ?? 0).toBeGreaterThan(0);
    }
    for (const impact of new Set(engineImpacts)) {
      expect(impactCounts[impact]).toBe(engineImpacts.filter((i) => i === impact).length);
    }

    // A firing seat carries its evidence word (real-yield-10y falling).
    const realYield = document.querySelector('[data-seat="real-yield-10y"]');
    expect(realYield?.textContent).toContain('falling');
    expect(realYield?.textContent).toContain('Supports gold');
    // A steady seat carries no evidence word.
    const us30y = document.querySelector('[data-seat="us30y"]');
    expect(us30y?.textContent).toContain('Not leaning');
    expect(us30y?.textContent).not.toContain('rising');
  });

  it('renders the five lanes with their side words + tallies', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-lane]').length).toBe(5);
    });
    const balance = goldBalance(projectionFixture().readings);
    for (const lane of balance.lanes) {
      const card = document.querySelector(`[data-lane="${lane.lane}"]`);
      expect(card).not.toBeNull();
      expect(card!.getAttribute('data-lane-side')).toBe(lane.split ? 'split' : lane.side);
      // The tally line: firing count over readable.
      if (!lane.split && lane.side !== 'unread') {
        expect(card!.textContent).toContain(`${lane.firing} of ${lane.readable} drivers firing`);
      }
    }
    // The seat counts per lane (D-26: 7 · 7 · 11 · 10 · 2).
    expect(document.querySelectorAll('[data-lane="borrowing-costs"] [data-seat]').length).toBe(7);
    expect(document.querySelectorAll('[data-lane="dollar"] [data-seat]').length).toBe(7);
    expect(document.querySelectorAll('[data-lane="stress"] [data-seat]').length).toBe(11);
    expect(document.querySelectorAll('[data-lane="inflation"] [data-seat]').length).toBe(10);
    expect(document.querySelectorAll('[data-lane="flows"] [data-seat]').length).toBe(2);
  });

  it('the seat home links ride the placement table (gold-silver → the in-page anchor, dollar voters → /currencies)', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    const goldSilver = document.querySelector('a[data-seat="gold-silver"]');
    expect(goldSilver?.getAttribute('href')).toBe('#gold-context');
    const dollarBasket = document.querySelector('a[data-seat="dollar-basket"]');
    expect(dollarBasket?.getAttribute('href')).toBe('/currencies');
    const fedTarget = document.querySelector('a[data-seat="fed-target"]');
    expect(fedTarget?.getAttribute('href')).toBe('/usa');
    const ecbDfr = document.querySelector('a[data-seat="ecb-dfr"]');
    expect(ecbDfr?.getAttribute('href')).toBe('/europe');
    const gprDaily = document.querySelector('a[data-seat="gpr-daily"]');
    expect(gprDaily?.getAttribute('href')).toBe('/world-markets');
  });

  it('renders the context cards with values, the blocked quartet as notes, and the honest record', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-context-card]').length).toBe(13);
    });

    // The cards render their values + the position line when present.
    const silver = document.querySelector('[data-context-card="gold-silver"]');
    expect(silver?.textContent).toContain('78.5');
    expect(silver?.textContent).toContain('ratio');
    expect(silver?.textContent).toContain('typical');
    const oil = document.querySelector('[data-context-card="gold-oil-ratio"]');
    expect(oil?.textContent).toContain('41.5');
    const sge = document.querySelector('[data-context-card="sge-gold-withdrawals"]');
    expect(sge?.textContent).toContain('92');

    // The blocked quartet as honest NOTES (never cards).
    expect(document.querySelectorAll('[data-blocked-note]').length).toBe(4);
    expect(document.querySelector('[data-blocked-note="wgc-etf-holdings"]')?.textContent).toContain('WGC');

    // The honest-record footnote.
    const honest = document.querySelector('[data-gold-honest-record]');
    expect(honest?.textContent).toContain('no positive association');
    expect(honest?.textContent).toContain('46.8');
    expect(honest?.textContent).toContain('MIN2');
    expect(honest?.textContent).toContain('no forecasting edge');
  });

  it('the fail-closed path: a dead projection renders the honest error state with the retry', async () => {
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<GoldPage />);
    await waitFor(() => {
      expect(screen.getByText('The gold page is unavailable right now')).toBeTruthy();
    });
    expect(screen.getByText('Try again')).toBeTruthy();
    // Nothing is faked — no seats, no hero.
    expect(document.querySelector('[data-gold-hero]')).toBeNull();
    expect(document.querySelectorAll('[data-seat]').length).toBe(0);
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    // First visit: a good projection lands in localStorage.
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page).
    clearProjectionCacheForTests();
    // Second visit: the feed dies, the cached projection paints — labelled.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503)),
    );
    render(<GoldPage />);
    // The seats stay on screen (the cached copy), and the fromCache
    // label speaks.
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
  });
});
