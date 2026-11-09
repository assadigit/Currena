/**
 * @vitest-environment jsdom
 *
 * UsaPage.characterization.test.tsx (S9 + S10, 2026-11-09) — the USA
 * page's DOM-level characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the
 *     data-as-of line + the absent note (the In-build chip RETIRED at
 *     S11's gate pass — BD-S10b's completion; the placeholder body
 *     retired at S10);
 *   - the S8 zoom section stays on top through EVERY state (the board
 *     feed is its own — a slow or dead projection never takes the map
 *     away): data-region-zoom="us" + the zoomed viewBox + ONLY the US
 *     cards (the S8 pins, re-proven under the new page);
 *   - the D-30 verdict strip: the five gauges in GAUGES order, each
 *     carrying the ENGINE's own word + the shared why-line + the
 *     four-step meter — the words asserted against the engine's
 *     gaugeReading over the SAME fixture (never a second arithmetic);
 *   - the tiers: D-29's 7 + the 19 rates & the Fed + S10's inflation 12
 *     + labor & growth 17 + liquidity/stress/valuation 17 (72 cards in
 *     placement order — the full card-render audit vs the placement
 *     table), each with the §21 trio (value · 10-year position ·
 *     freshness), the values rendered through the DISPLAY registry's own
 *     joins (the fed-target corridor, the trillion/billion scales, the
 *     magnitude words, the ×100 probability, the 4dp breadth ratio);
 *   - the tier-6 TIC board (D-31): the REUSED section over its own feed —
 *     the aggregates split, the separate transactions/valuation columns,
 *     the custody-hub caveat, the placeholder body RETIRED (BD-S10b);
 *   - the honest fail-closed paths: an absent reading renders the
 *     unavailable word; a dead projection with no cache renders the
 *     error state + retry;
 *   - the M-17 last-good path: a failed refresh after a good load keeps
 *     the page on screen, labelled;
 *   - the dollar-strength strip card links to /currencies (BD-S3b's
 *     mapping honoured on-page);
 *   - the fa/RTL rendering (the Persian strip title + the Persian card
 *     words + the Persian value joins).
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { IndicatorReading, MarketsSnapshot, PageProjection, TicSnapshot } from '@currena/core';
import { MarketsSnapshotSchema, PageProjectionSchema, TicSnapshotSchema } from '@currena/core';
import { GAUGES, gaugeReading, labelForVerdictStep } from '@currena/insights';
import { THEMATIC_GAUGE_IDS, pageReadingIds } from '@currena/insights/page-division';
import { summarizeMarkets } from '@currena/insights/markets';
import { MARKETS } from '@currena/insights/markets/definitions';
import { UsaPage } from './UsaPage';
import { USA_TIER1_IDS, USA_TIER2_IDS, USA_TIER3_IDS, USA_TIER4_IDS, USA_TIER5_IDS } from './usa-tiles';
import { clearProjectionCacheForTests } from '../../lib/page-division';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-08T11:23:21.693Z',
    ...partial,
  } as IndicatorReading;
}

/** The tier cards' displayed values — real-world magnitudes so the §21
 *  trio asserts the DISPLAY registry's own joins. */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  'fed-target': { value: 3.875, rangeLow: 3.75, rangeHigh: 4, percentile10y: 0.675, asOf: '2026-11-07' },
  'fed-expectations': { value: 0.48, percentile10y: 0.55 },
  'us-cpi-yoy': { value: 3.7, percentile10y: 0.9, status: 'warning', asOf: '2026-10-01' },
  'us-pce-core-yoy': { value: 2.9, percentile10y: 0.62 },
  'us-nfp': { value: 165, percentile10y: 0.44, status: 'context', asOf: '2026-10-01' },
  'us-unemployment': { value: 4.1, percentile10y: 0.3 },
  us10y: { value: 4.24, percentile10y: 0.96 },
  'yield-curve-10y2y': { value: 0.19, status: 'warning' },
  'real-yield-10y': { value: 1.86, percentile10y: 0.85 },
  us30y: { value: 4.51, percentile10y: 0.4 },
  'us-2y': { value: 4.05, percentile10y: 0.45 },
  sofr: { value: 4.3, percentile10y: 0.47 },
  'mortgage-30y': { value: 6.85, percentile10y: 0.16 },
  'nyfed-custody': { value: 3_450_000, percentile10y: 0.7 },
  'us-deficit-monthly': { value: 84_921, percentile10y: 0.6 },
  'us-deficit-12m': { value: 1_840_000, percentile10y: 0.65 },
  'treasury-auction-10y': { value: 2.63, percentile10y: 0.5 },
  'rstar-us': { value: 1.19, percentile10y: 0.5 }, // absent from the fixture on purpose (see below)
  'debt-to-gdp': { value: 121.3, percentile10y: 0.92 },
  'govt-interest-revenue': { value: 18.7, percentile10y: 0.95 },
};

/** The gauge-voter states that drive the strip's verdicts deterministically:
 *  borrowing-costs 1/10 warnings (cautious) · prices-heat 1/6 (cautious) ·
 *  market-stress 0 fresh warnings + a stale vix (stable — the stale voter
 *  dilutes, never inflates) · dollar-strength 0 warnings (stable) ·
 *  growth-health all calm (stable). usdjpy is carried as an unavailable
 *  reading (a voter with no reading never votes). */
const VOTER_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  'yield-curve-10y2y': CARD_OVERRIDES['yield-curve-10y2y']!,
  'us-cpi-yoy': CARD_OVERRIDES['us-cpi-yoy']!,
  vix: { status: 'stale', value: 14.84 },
  usdjpy: { status: 'unavailable', value: null, asOf: null, percentile10y: undefined },
};

/** The USA projection: the placement's own reading order (72 homes + the
 *  14 D-30 mirrors), rstar-us honestly ABSENT (the public-mode licence-gap
 *  path exercised on a real tier-2 card). */
function usaProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = [];
  for (const id of pageReadingIds('usa')) {
    if (id === 'rstar-us') continue; // honestly absent — the absentIds note speaks
    const voter = VOTER_OVERRIDES[id];
    const card = CARD_OVERRIDES[id];
    if (voter !== undefined && card !== undefined) {
      readings.push(reading(id, { ...card, ...voter }));
    } else if (voter !== undefined) {
      readings.push(reading(id, voter));
    } else {
      readings.push(reading(id, card ?? {}));
    }
  }
  return {
    page: 'usa',
    generatedAt: '2026-11-08T11:23:21.693Z',
    displayMode: 'public',
    readings,
    absentIds: ['rstar-us'],
    boards: ['markets', 'tic'],
  };
}

/** A full 16-row board (the S8 RegionPage fixture's shape). */
function boardFixture(): MarketsSnapshot {
  const markets: MarketsSnapshot['markets'] = MARKETS.map((m, i) => ({
    id: m.id,
    asOf: '2026-11-07',
    close: 19624,
    chg1d: 0.5,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: [2, 0, -2][i % 3] ?? 0,
    chg1y: 6,
    high52w: 20000,
    low52w: 17000,
    fromHigh: [-25, -12, -7, -2, -1, -0.5, -3, -8][i % 8] ?? -1,
    rangePos: 87,
    trend: 'flat' as const,
    status: (i % 8 === 0 ? 'bear' : i % 8 === 1 || i % 8 === 7 ? 'correction' : 'normal') as MarketsSnapshot['markets'][number]['status'],
    source: 'eodhd' as const,
    stale: false,
    weekly: [
      [0, 19000],
      [7, 19100],
    ],
  }));
  return { v: 1, generatedAt: '2026-11-07T23:31:00Z', markets, summary: summarizeMarkets(markets) };
}

/** The tier-6 TIC board fixture — a contract-valid snapshot (sanity-parsed
 *  inside the tests): 4 holders over 3 months, japan + china-mainland (the
 *  chart pair), belgium (a custody hub) and australia (the always-visible
 *  row), with the transactions + valuation series the separate-columns
 *  discipline renders. */
function ticFixture(): TicSnapshot {
  const months = (start: number): { ym: string; v: number }[] => [
    { ym: '2026-06', v: start },
    { ym: '2026-07', v: start + 10 },
    { ym: '2026-08', v: start + 20 },
  ];
  return {
    v: 1,
    dataMonth: '2026-08',
    releasedAt: '2026-10-16T20:07:27.000Z',
    fetchedAt: '2026-11-08T04:35:00.000Z',
    totalBn: 9000,
    officialBn: 3700,
    privateBn: 5300,
    holders: [
      {
        id: 'japan',
        name: 'Japan',
        holdingsBn: 1120,
        months: months(1100),
        netSalesBn: [
          { ym: '2026-06', v: 30 },
          { ym: '2026-07', v: -10 },
          { ym: '2026-08', v: 25 },
        ],
        valuationChangeBn: [
          { ym: '2026-06', v: 5 },
          { ym: '2026-07', v: -3 },
          { ym: '2026-08', v: 8 },
        ],
        isCustodyHub: false,
      },
      {
        id: 'china-mainland',
        name: 'China, Mainland',
        holdingsBn: 890,
        months: months(870),
        netSalesBn: [
          { ym: '2026-06', v: -20 },
          { ym: '2026-07', v: -15 },
          { ym: '2026-08', v: -30 },
        ],
        valuationChangeBn: [
          { ym: '2026-06', v: 12 },
          { ym: '2026-07', v: 6 },
          { ym: '2026-08', v: 9 },
        ],
        isCustodyHub: false,
      },
      {
        id: 'belgium',
        name: 'Belgium',
        holdingsBn: 390,
        months: months(370),
        netSalesBn: [{ ym: '2026-08', v: 5 }],
        isCustodyHub: true,
      },
      {
        id: 'australia',
        name: 'Australia',
        holdingsBn: 62,
        months: months(42),
        isCustodyHub: false,
      },
    ],
    sourceUrls: ['https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt'],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFound(): Response {
  return jsonResponse({ error: { code: 'not_found', message: 'nope' } }, 404);
}

/** Route the stubbed fetch: the USA projection + the board feed (the
 *  zoom's own) + the map's two static assets (404 — the land never paints
 *  in jsdom; the cards are the DOM under test). */
function stubFeeds(overrides: { projection?: () => Response; board?: () => Response; tic?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/usa')) return (overrides.projection ?? (() => jsonResponse(usaProjectionFixture())))();
      if (url.includes('/api/insights/markets')) return (overrides.board ?? (() => jsonResponse(boardFixture())))();
      if (url.includes('/api/insights/tic')) return (overrides.tic ?? (() => jsonResponse(ticFixture())))();
      if (url.includes('/assets/map/')) return new Response('not found', { status: 404 });
      return notFound();
    }),
  );
}

/** Seat the SPA at a route (the router reads window.location.pathname). */
function atRoute(path: string): void {
  window.history.pushState(null, '', path);
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

describe('UsaPage', () => {
  it('fixture sanity: all three payloads satisfy their contracts', () => {
    expect(() => PageProjectionSchema.parse(usaProjectionFixture())).not.toThrow();
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
    expect(() => TicSnapshotSchema.parse(ticFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives — and the zoom stays on top', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    atRoute('/usa');
    const { container } = render(<UsaPage />);
    expect(container.textContent).toContain('Reading the American numbers');
    // The zoom's own feed was never stubbed alive here (404s) — the
    // section itself still renders (its honest loading/empty shapes).
    expect(document.querySelector('[data-region-zoom="us"]')).not.toBeNull();
  });

  it('renders the shell + the zoom + the strip + both tiers over the real derivations', async () => {
    atRoute('/usa');
    stubFeeds();
    render(<UsaPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-usa-strip]')).not.toBeNull();
    });

    // The shell: title + the purpose + the data-as-of line + the absent
    // note (rstar-us). The In-build chip is RETIRED (S11's gate pass —
    // BD-S10b's completion); it must NOT render on the USA page anymore.
    expect(screen.getByText('USA')).toBeTruthy();
    expect(screen.queryByText('In build')).toBeNull();
    expect(document.body.textContent).toContain('Data as of Nov 8, 2026');
    expect(document.body.textContent).toContain('1 of this page’s readings are not published in this mode.');

    // The S8 zoom section stays on top of the S9 layers.
    const zoom = document.querySelector('[data-region-zoom="us"]');
    expect(zoom).not.toBeNull();
    expect(zoom!.querySelector('.wm')?.getAttribute('data-wm-zoom')).toBe('us');
    // ONLY the US zoom's cards seat (sp500 · ndx · dow — the S8 pins);
    // the DOM order is the registry's own west-to-east, so pin the SET.
    expect(zoom!.querySelectorAll('.wm-card')).toHaveLength(3);
    const seated = Array.from(zoom!.querySelectorAll('.wm-card')).map((c) => c.getAttribute('data-id'));
    expect([...seated].sort()).toEqual(['dow', 'ndx', 'sp500']);

    // The strip: the five gauges in GAUGES order, the ENGINE's own words.
    const strip = document.querySelector('[data-usa-strip]')!;
    const stripCards = strip.querySelectorAll('[data-usa-verdict]');
    expect(stripCards).toHaveLength(5);
    const fixture = usaProjectionFixture();
    for (const gauge of GAUGES.filter((g) => (THEMATIC_GAUGE_IDS as readonly string[]).includes(g.id))) {
      // The engine side, spelled out — never the page module.
      const engine = gaugeReading(gauge, fixture.readings);
      const engineWord = labelForVerdictStep(engine.step);
      const card = strip.querySelector(`[data-usa-verdict="${gauge.id}"]`)!;
      // The verdict word: the corpus's own language, one wording with Global.
      const wordEl = card.querySelector('[data-usa-verdict-word]');
      expect(wordEl?.textContent, `${gauge.id} word`).toBe(
        engineWord === null ? 'Cannot read yet' : { relaxed: 'Stable', cautious: 'Cautious', stressed: 'Stressed', alarmed: 'Critical' }[engineWord],
      );
      // The meter paints the engine's step.
      expect(card.querySelector('.verdict-meter')?.getAttribute('data-step')).toBe(String(engine.step));
      // The why-line is the Global board's own (one wording everywhere).
      const why = card.querySelector('[data-usa-why]')?.textContent ?? '';
      if (engine.step === 0) expect(why).toContain('Not enough readable voters');
      else if (engine.warningCount > 0) expect(why).toContain('voters need attention');
      else expect(why).toContain('No voter needs attention');
    }
    // The determinstic spot checks a visitor would see.
    expect(strip.querySelector('[data-usa-verdict="borrowing-costs"] [data-usa-why]')?.textContent).toContain('1 of 10 voters need attention');
    expect(strip.querySelector('[data-usa-verdict="market-stress"] [data-usa-verdict-word]')?.textContent).toBe('Stable');

    // Tier 1: D-29's seven, each with the §21 trio.
    const tier1 = document.querySelector('[data-usa-tier="tier-1"]')!;
    expect(tier1.querySelectorAll('[data-usa-card]')).toHaveLength(USA_TIER1_IDS.length);
    expect(tier1.querySelectorAll('[data-usa-card]')).toHaveLength(7);
    const fed = tier1.querySelector('[data-usa-card="fed-target"]')!;
    expect(fed.textContent).toContain('The US central bank’s policy rate');
    expect(fed.querySelector('[data-usa-value]')?.textContent).toBe('3.75–4.00%');
    expect(fed.textContent).toContain('typical · the middle');
    expect(fed.textContent).toContain('Data as of Nov 7, 2026');
    const cpi = tier1.querySelector('[data-usa-card="us-cpi-yoy"]')!;
    expect(cpi.querySelector('[data-usa-value]')?.textContent).toBe('3.7%');
    expect(cpi.textContent).toContain('high · top 10%');
    expect(cpi.textContent).toContain('Oct 1, 2026');
    expect(cpi.querySelector('[data-usa-status-word]')?.textContent).toBe('Needs attention');
    const nfp = tier1.querySelector('[data-usa-card="us-nfp"]')!;
    expect(nfp.querySelector('[data-usa-value]')?.textContent).toBe('165 pts');
    // A context reading is normal for a context-only id — no status word.
    expect(nfp.querySelector('[data-usa-status-word]')).toBeNull();
    expect(tier1.querySelector('[data-usa-card="us-unemployment"] [data-usa-value]')?.textContent).toBe('4.1%');
    expect(tier1.querySelector('[data-usa-card="us10y"]')?.textContent).toContain('high · top 4%');

    // Tier 2: the placement's 19, the scales rendering in their displayed
    // magnitudes (the DISPLAY registry's own joins).
    const tier2 = document.querySelector('[data-usa-tier="tier-2"]')!;
    expect(tier2.querySelectorAll('[data-usa-card]')).toHaveLength(USA_TIER2_IDS.length);
    expect(tier2.querySelectorAll('[data-usa-card]')).toHaveLength(19);
    expect(tier2.querySelector('[data-usa-card="nyfed-custody"] [data-usa-value]')?.textContent).toBe('US$3.45 trillion');
    expect(tier2.querySelector('[data-usa-card="us-deficit-monthly"] [data-usa-value]')?.textContent).toBe('US$84.9bn');
    expect(tier2.querySelector('[data-usa-card="us-deficit-12m"] [data-usa-value]')?.textContent).toBe('US$1.84 trillion');
    expect(tier2.querySelector('[data-usa-card="treasury-auction-10y"] [data-usa-value]')?.textContent).toBe('2.63 ratio');
    expect(tier2.querySelector('[data-usa-card="mortgage-30y"]')?.textContent).toContain('low · bottom 16%');
    // The honestly absent card (rstar-us): the unavailable word, never a guess.
    const rstar = tier2.querySelector('[data-usa-card="rstar-us"]')!;
    expect(rstar.getAttribute('data-usa-status')).toBe('absent');
    expect(rstar.textContent).toContain('Cannot read yet');
    expect(rstar.querySelector('[data-usa-value]')).toBeNull();

    // Tier 3 — inflation (S10): the placement's 12, the AF-3 twin seated.
    const tier3 = document.querySelector('[data-usa-tier="tier-3"]')!;
    expect(tier3.querySelectorAll('[data-usa-card]')).toHaveLength(USA_TIER3_IDS.length);
    expect(tier3.querySelectorAll('[data-usa-card]')).toHaveLength(12);
    expect(tier3.textContent).toContain('Inflation');
    expect(tier3.querySelector('[data-usa-card="us-cpi-core-yoy"]')!.textContent).toContain('Core inflation');
    expect(tier3.querySelector('[data-usa-card="michigan-1y-expectations"]')!.textContent).toContain('Expected inflation next year');

    // Tier 4 — labor & growth (S10): the placement's 17, the magnitude
    // words and the ×100 probability in their DISPLAY registry joins.
    const tier4 = document.querySelector('[data-usa-tier="tier-4"]')!;
    expect(tier4.querySelectorAll('[data-usa-card]')).toHaveLength(USA_TIER4_IDS.length);
    expect(tier4.querySelectorAll('[data-usa-card]')).toHaveLength(17);
    expect(tier4.querySelector('[data-usa-card="initial-jobless-claims"] [data-usa-value]')?.textContent).toBe('1 claims');
    expect(tier4.querySelector('[data-usa-card="recession-probability"] [data-usa-value]')?.textContent).toBe('100%');
    expect(tier4.querySelector('[data-usa-card="michigan-sentiment"] [data-usa-value]')?.textContent).toBe('1.0 index');

    // Tier 5 — liquidity, stress & valuation (S10): the spec's own 17,
    // the stale vix speaking its status word (the §21 trio's freshness leg).
    const tier5 = document.querySelector('[data-usa-tier="tier-5"]')!;
    expect(tier5.querySelectorAll('[data-usa-card]')).toHaveLength(USA_TIER5_IDS.length);
    expect(tier5.querySelectorAll('[data-usa-card]')).toHaveLength(17);
    const vixCard = tier5.querySelector('[data-usa-card="vix"]')!;
    expect(vixCard.querySelector('[data-usa-value]')?.textContent).toBe('14.84 index');
    expect(vixCard.querySelector('[data-usa-status-word]')?.textContent).toBe('Stale');
    expect(tier5.querySelector('[data-usa-card="shiller-cape"] [data-usa-value]')?.textContent).toBe('1.00 ratio');
    expect(tier5.querySelector('[data-usa-card="sp500-breadth-ratio"] [data-usa-value]')?.textContent).toBe('1.0000 ratio');

    // The whole registry surface: 72 cards in placement order, zero
    // unrendered ids (the full card-render audit vs the placement table).
    expect(document.querySelectorAll('[data-usa-card]')).toHaveLength(72);
    const renderedIds = [...document.querySelectorAll('[data-usa-card]')].map((el) => el.getAttribute('data-usa-card'));
    expect(renderedIds).toEqual([
      ...USA_TIER1_IDS,
      ...USA_TIER2_IDS,
      ...USA_TIER3_IDS,
      ...USA_TIER4_IDS,
      ...USA_TIER5_IDS,
    ] as string[]);

    // Tier 6 — the TIC board (D-31): the REUSED section over its own feed
    // (its fetch resolves on its own tracks — wait for its own content).
    const tier6 = document.querySelector('[data-usa-tier="tier-6"]')!;
    expect(tier6.textContent).toContain('Who finances America');
    await waitFor(() => {
      expect(tier6.textContent).toContain('Who holds US government debt');
    });
    expect(tier6.textContent).toContain('Foreign official vs private holders');
    // The separate-columns discipline: net buying/selling AND the price
    // effect both render (the honest-difference note speaks once).
    expect(tier6.textContent).toContain('Net buying/selling, 12m');
    expect(tier6.textContent).toContain('Price effect, 12m');
    expect(tier6.textContent).toContain('real transactions');
    // The custody-hub caveat (Treasury's own warning) + the ◆ row marker
    // (the marker carries the fuller tooltip; Belgium is the fixture's hub).
    expect(tier6.textContent).toContain('holdings are recorded where the securities are held');
    const belgiumMarker = tier6.querySelector('[aria-label="Custody hub"]');
    expect(belgiumMarker?.textContent).toBe('◆');
    expect(belgiumMarker?.getAttribute('title')).toContain('US-based custodians');

    // The placeholder body is RETIRED (BD-S10b) AND the In-build chip is
    // RETIRED (S11's gate pass — BD-S10b's completion): nothing promises
    // future tiers and no honest "in build" claim remains — the page's
    // layers are complete and verified.
    expect(document.body.textContent).not.toContain('What will live here');
    expect(document.body.textContent).not.toContain('S9–S11');
    expect(document.body.textContent).not.toContain('In build');
  });

  it('the dollar-strength strip card links to /currencies (BD-S3b honoured on-page); the other four are plain', async () => {
    atRoute('/usa');
    stubFeeds();
    render(<UsaPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-usa-strip]')).not.toBeNull();
    });
    const dollar = document.querySelector('[data-usa-verdict="dollar-strength"]')!;
    expect(dollar.tagName).toBe('A');
    expect(dollar.getAttribute('href')).toBe('/currencies');
    fireEvent.click(dollar);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/currencies');
    });
    for (const gauge of ['borrowing-costs', 'prices-heat', 'market-stress', 'growth-health'] as const) {
      const card = document.querySelector(`[data-usa-verdict="${gauge}"]`)!;
      expect(card.tagName).toBe('ARTICLE');
    }
  });

  it('the fail-closed path: a dead projection with no cache renders the honest error state + the retry', async () => {
    atRoute('/usa');
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<UsaPage />);
    await waitFor(() => {
      expect(screen.getByText('The USA page is unavailable right now')).toBeTruthy();
    });
    expect(screen.getByText('Try again')).toBeTruthy();
    // Nothing is faked — no strip, no cards.
    expect(document.querySelector('[data-usa-strip]')).toBeNull();
    expect(document.querySelectorAll('[data-usa-card]').length).toBe(0);
    // The zoom stays (its own feed is alive).
    expect(document.querySelector('[data-region-zoom="us"] .wm-card')).not.toBeNull();
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    atRoute('/usa');
    stubFeeds();
    render(<UsaPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-usa-card]').length).toBe(72);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page).
    clearProjectionCacheForTests();
    // Second visit: the projection feed dies; the cached projection paints
    // — labelled (the zoom's cached board paints with it, its own label);
    // the TIC board keeps its own last-good copy too (its own feed).
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/tic')) return jsonResponse(ticFixture());
        if (url.includes('/assets/map/')) return new Response('not found', { status: 404 });
        return jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503);
      }),
    );
    render(<UsaPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-usa-card]').length).toBe(72);
    });
    await waitFor(() => {
      expect(document.querySelector('[data-usa-tier="tier-6"]')?.textContent).toContain('Who holds US government debt');
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    expect(document.querySelector('[data-usa-cached]')).not.toBeNull();
  });

  it('the fa/RTL rendering: the Persian strip title + the Persian card words + the Persian value joins', async () => {
    // The fa locale rides the app's own locale store (the I18nApi's
    // setter — the same door the language switch uses).
    const { useI18n } = await import('../../lib/locale');
    function SetLocale({ locale }: { locale: 'en' | 'fa' }): React.JSX.Element | null {
      const { setLocale } = useI18n();
      useEffect(() => {
        setLocale(locale);
      }, [locale, setLocale]);
      return null;
    }
    atRoute('/usa');
    stubFeeds();
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <UsaPage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-usa-strip]')).not.toBeNull();
      });
      // The strip: the Persian title + the Persian question + the verdict
      // word in the corpus's own Persian (پایدار = Stable).
      expect(document.querySelector('[data-usa-strip] h2')!.textContent).toBe('آمریکا در پنج حکم');
      expect(document.querySelector('[data-usa-strip]')!.textContent).toContain('آیا استقراض در آمریکا گران‌تر می‌شود؟');
      expect(document.querySelector('[data-usa-verdict="market-stress"] [data-usa-verdict-word]')?.textContent).toBe('پایدار');
      // The tier cards: the corpus's own Persian names + the fa value
      // joins (percent binds tight; the trillion suffix form).
      const fed = document.querySelector('[data-usa-card="fed-target"]')!;
      expect(fed.textContent).toContain('نرخ سیاستی فدرال رزرو آمریکا');
      expect(fed.querySelector('[data-usa-value]')?.textContent).toBe('۳٫۷۵–۴٫۰۰٪');
      const custody = document.querySelector('[data-usa-card="nyfed-custody"] [data-usa-value]')!;
      expect(custody.textContent).toBe('۳٫۴۵ تریلیون دلار');
      // The tier-6 TIC board in Persian: the reused section's own words
      // (the corpus's Persian copy.tic through the pd.usa.tic adapter).
      const tier6 = document.querySelector('[data-usa-tier="tier-6"]')!;
      expect(tier6.textContent).toContain('چه کسی آمریکا را تأمین مالی می‌کند');
      await waitFor(() => {
        expect(tier6.textContent).toContain('چه کسی بدهی دولت آمریکا را نگه می‌دارد');
      });
      // The RTL document direction rides the store's own apply().
      expect(document.documentElement.dir).toBe('rtl');
    } finally {
      unmount();
      cleanup();
      const { useI18n: useI18n2 } = await import('../../lib/locale');
      const Probe = (): React.JSX.Element | null => {
        const { setLocale } = useI18n2();
        useEffect(() => {
          setLocale('en');
        }, [setLocale]);
        return null;
      };
      render(<Probe />);
    }
  });
});
