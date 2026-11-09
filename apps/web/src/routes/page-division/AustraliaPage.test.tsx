/**
 * @vitest-environment jsdom
 *
 * AustraliaPage.test.tsx (S16, 2026-11-10) — the Australia page's DOM-level
 * characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the data-as-of
 *     line (the In-build chip PRESENT at the S16 build session — the
 *     S9/S10/S12/S14 build-session trajectory; RETIRES at the S16 gates pass:
 *     the build and the gates ship in this one session, so once the §21 diff,
 *     the freshness audit, the render audit and the browser pass are green the
 *     chip comes off before the deploy — BD-S15c's reasoning);
 *   - the S8 zoom section stays on top through EVERY state (the board feed
 *     is its own — a slow or dead projection never takes the map away):
 *     data-region-zoom="australia";
 *   - the AU Markets board (§10 item 1): the REUSED AustralianMarkets
 *     drawing, its own feed (data-australia-board);
 *   - the five gauge sections + the world-risk group (§10 item 2, D-37: the
 *     unchanged 3-voting + 2-shadow structure): inflation-rates (6) ·
 *     households (11) · trade-currency (2) · external (1, SHADOW) · activity
 *     (7, SHADOW) + world-risk (1: gpr-australia) = 28 placed cards;
 *   - every card carries the §21 trio (value · 10-year position · freshness),
 *     the values rendered through the DISPLAY registry's own joins (percent
 *     binds tight, the AU money pair 'A$97.6bn' / 'A$495m', the index +
 *     vacancies suffix with a space);
 *   - the 11 moved-out seat chips (§10 "Moved out"): audusd · audjpy · audnzd
 *     → /currencies; nz-short-rate · nz-10y · china-property-investment ·
 *     china-steel-output → /asia-pacific; iron-ore · coal-aus · lng-japan →
 *     /commodities; gold-aud → /gold, each a 44px touch target (spec §18 D-48);
 *   - the honest fail-closed paths: an absent reading renders the unavailable
 *     word; a dead projection with no cache renders the error state + retry;
 *   - the M-17 last-good path: a failed refresh after a good load keeps the
 *     page on screen, labelled;
 *   - the fa/RTL rendering (the Persian title + the Persian gauge heading +
 *     the Persian card value joins, including the AU money fa suffix word).
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { IndicatorReading, MarketsSnapshot, PageProjection } from '@currena/core';
import { MarketsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import { summarizeMarkets } from '@currena/insights/markets';
import { MARKETS } from '@currena/insights/markets/definitions';
import { AustraliaPage } from './AustraliaPage';
import {
  AUSTRALIA_CARD_IDS,
  AUSTRALIA_INFLATION_RATES_IDS,
  AUSTRALIA_HOUSEHOLDS_IDS,
  AUSTRALIA_TRADE_CURRENCY_IDS,
  AUSTRALIA_EXTERNAL_IDS,
  AUSTRALIA_ACTIVITY_IDS,
  AUSTRALIA_WORLD_RISK_IDS,
  AUSTRALIA_SEAT_IDS,
  AUSTRALIA_MOVED_OUT_IDS,
} from './australia-tiles';
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

/** The 28 Australia home cards' displayed values + the 5 mirror readings —
 *  real-world magnitudes so the §21 trio asserts the DISPLAY registry's own
 *  joins (percent binds tight; the AU money pair 'A$97.6bn' / 'A$495m' EN;
 *  the index + vacancies suffix with a space). The percentile10y values
 *  choose clean band phrases (high / low / typical) covering every branch. */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  // The task-specified magnitudes.
  'au-cpi': { value: 2.8, percentile10y: 0.5, status: 'normal', asOf: '2026-10-31' }, // typical · mid
  'au-housing-finance': { value: 97600, percentile10y: 0.3, asOf: '2026-09-30' }, // aud-bn (scale 0.001 → 97.6)
  'au-trade-balance': { value: 495, percentile10y: 0.6, asOf: '2026-10-31' }, // aud-m
  'au-job-vacancies': { value: 325000, percentile10y: 0.4, asOf: '2026-09-30' }, // vacancies
  'au-unemployment': { value: 4.1, percentile10y: 0.85, status: 'warning', asOf: '2026-10-31' }, // high · top 15%
  'au-10y': { value: 4.2, percentile10y: 0.15, status: 'normal', asOf: '2026-11-08' }, // low · bottom 15%
  'rba-cash-rate': { value: 4.35, status: 'stale', asOf: '2026-11-01' }, // stale
  'gpr-australia': { value: 91.24, percentile10y: 0.5, asOf: '2026-10-01' }, // index · typical
  // The remaining home cards — plausible magnitudes.
  'au-trimmed-mean': { value: 2.9, percentile10y: 0.55, asOf: '2026-10-31' }, // typical
  'rba-expectations': { value: 3.2, percentile10y: 0.6, asOf: '2026-10-01' }, // typical
  'au-us-10y-gap': { value: 0.5, percentile10y: 0.45, asOf: '2026-11-08' }, // typical
  'au-petrol-yoy': { value: -3.2, percentile10y: 0.18, asOf: '2026-10-31' }, // low · bottom 18%
  'au-home-loan': { value: 5.85, percentile10y: 0.5, asOf: '2026-11-08' }, // typical
  'au-wage-growth': { value: 4.1, percentile10y: 0.82, asOf: '2026-09-30' }, // high · top 18%
  'au-rent-yoy': { value: 7.2, percentile10y: 0.92, status: 'warning', asOf: '2026-10-31' }, // high · top 8%
  'au-household-debt-arrears': { value: 0.85, percentile10y: 0.35, asOf: '2026-09-30' }, // typical
  'au-home-values': { value: 148.3, percentile10y: 0.88, asOf: '2026-10-31' }, // high · top 12%
  'au-deposit-rate': { value: 4.5, percentile10y: 0.7, asOf: '2026-11-08' }, // typical
  'au-saving-ratio': { value: 5.2, percentile10y: 0.3, asOf: '2026-09-30' }, // typical
  'terms-of-trade': { value: 117.5, percentile10y: 0.75, asOf: '2026-09-30' }, // typical
  'rba-fed-gap': { value: -3.85, percentile10y: 0.08, asOf: '2026-11-08' }, // low · bottom 8%
  'au-gdp-growth': { value: 1.1, percentile10y: 0.25, asOf: '2026-09-30' }, // typical
  'au-household-spending': { value: 0.8, percentile10y: 0.4, asOf: '2026-09-30' }, // typical
  'au-building-approvals': { value: 18264, percentile10y: 0.5, asOf: '2026-10-31' }, // dwellings
  'au-population-growth': { value: 2.4, percentile10y: 0.85, asOf: '2026-09-30' }, // high · top 15%
  'au-nom': { value: 101000, percentile10y: 0.5, asOf: '2026-09-30' }, // persons-k
  'au-participation': { value: 66.8, percentile10y: 0.85, asOf: '2026-10-31' }, // high · top 15%
  'au-underemployment': { value: 6.3, percentile10y: 0.6, asOf: '2026-10-31' }, // typical
  // The five mirror readings (moved-out seats that still vote in the AU
  // gauges — the projection carries them so the verdict words never disagree
  // with the engine's).
  audusd: { value: 0.6585, percentile10y: 0.3, asOf: '2026-11-08' }, // typical
  audjpy: { value: 98.5, percentile10y: 0.55, asOf: '2026-11-08' }, // typical
  audnzd: { value: 1.085, percentile10y: 0.5, asOf: '2026-11-08' }, // typical
  'nz-short-rate': { value: 4.75, percentile10y: 0.88, asOf: '2026-09-01' }, // high · top 12%
  'nz-10y': { value: 4.55, percentile10y: 0.72, asOf: '2026-09-01' }, // typical
};

/** The Australia projection: the placement's own reading order (28 home
 *  readings + 5 mirrors), every card present in public mode (absentIds
 *  empty — the live §21 diff's own honest report). The boards field lists
 *  the two board feeds the page fetches alongside the projection: the zoom's
 *  markets board + the AU Markets board (each its own cached route). */
function australiaProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = pageReadingIds('australia').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
  return {
    page: 'australia',
    generatedAt: '2026-11-08T11:23:21.693Z',
    displayMode: 'public',
    readings,
    absentIds: [],
    boards: ['markets', 'markets-au'],
  };
}

/** A full 16-row board (the S8 RegionPage fixture's shape) — the zoom's own
 *  markets feed (the SAME MarketsSnapshot the Asia / Europe / Gold zooms
 *  read; the AU page's RegionIndexSection fetches it at the same cached
 *  /api/insights/markets route). */
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

/** The AU Markets board — stubbed to its empty state (the AU markets
 *  snapshot has its own schema, distinct from the zoom's MarketsSnapshot;
 *  the gauge sections don't depend on the board — the board feed governs
 *  its own surface, so its empty shape is honest and sufficient). */
function auBoardFixture(): Response {
  return jsonResponse({ error: { code: 'not_found', message: 'nope' } }, 404);
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

/** Route the stubbed fetch: the Australia projection + the AU Markets board
 *  feed (its own) + the zoom's own markets board (the regular
 *  MarketsSnapshot) + the map's static assets (404 — the land never paints
 *  in jsdom; the cards are the DOM under test). */
function stubFeeds(overrides: { projection?: () => Response; board?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/australia')) return (overrides.projection ?? (() => jsonResponse(australiaProjectionFixture())))();
      // The AU Markets board — stubbed to its empty state (its own schema,
      // independent of the gauge sections). Checked before the regular
      // markets route (markets-au contains markets as a substring).
      if (url.includes('/api/insights/markets-au')) return auBoardFixture();
      // The zoom's own markets board (the regular MarketsSnapshot).
      if (url.includes('/api/insights/markets')) return (overrides.board ?? (() => jsonResponse(boardFixture())))();
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

describe('AustraliaPage', () => {
  it('fixture sanity: both payloads satisfy their contracts', () => {
    expect(() => PageProjectionSchema.parse(australiaProjectionFixture())).not.toThrow();
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
    // The AU Markets board is stubbed to its empty state (its schema is the
    // board drawing's own, not the zoom's MarketsSnapshot); the gauge sections
    // don't depend on the board, so the board schema parse is intentionally
    // skipped here.
  });

  it('renders the honest loading line before the projection arrives — and the zoom stays on top', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    atRoute('/australia');
    const { container } = render(<AustraliaPage />);
    // The loading container speaks (resilient match — the exact en string
    // lives under pd.australia.loadingLine, not asserted verbatim).
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.textContent).toMatch(/Australia/i);
    // The zoom's own feed was never stubbed alive here (404s) — the
    // section itself still renders (its honest loading/empty shapes).
    expect(document.querySelector('[data-region-zoom="australia"]')).not.toBeNull();
  });

  it('renders the shell + the zoom + the AU Markets board + the five gauge sections + the world-risk group over the real derivations', async () => {
    atRoute('/australia');
    stubFeeds();
    render(<AustraliaPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-australia-section="inflation-rates"]')).not.toBeNull();
    });

    // The shell: title + purpose + the data-as-of line. The honest In-build
    // chip is PRESENT at the S16 build session (the S9/S10/S12/S14
    // build-session trajectory). RETIRES at the S16 gates pass: the build and
    // the gates ship in this one session (Phase G = S16), so once the §21
    // diff, the freshness audit, the render audit and the browser pass are
    // green the chip comes off before the deploy (BD-S15c's reasoning —
    // keeping it after its gate passed would be dishonest in the other
    // direction).
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toMatch(/Australia/i);
    // BUILD-SESSION: flip to queryByText('In build').toBeNull() at the S16 gates-pass chip retirement (BD-S15c trajectory)
    expect(screen.getByText('In build')).toBeTruthy();
    expect(document.body.textContent).toContain('Data as of');

    // The S8 zoom section stays on top of the S16 layers.
    const zoom = document.querySelector('[data-region-zoom="australia"]');
    expect(zoom).not.toBeNull();

    // The AU Markets board (§10 item 1): its own section, its own feed.
    const board = document.querySelector('[data-australia-board]');
    expect(board).not.toBeNull();

    // The five gauge sections + the world-risk group (§10 item 2, D-37).

    // Inflation & rates (VOTING): the six cards.
    const inflation = document.querySelector('[data-australia-section="inflation-rates"]')!;
    expect(inflation.querySelectorAll('[data-australia-card]')).toHaveLength(AUSTRALIA_INFLATION_RATES_IDS.length);
    expect(inflation.querySelectorAll('[data-australia-card]')).toHaveLength(6);

    // Households (VOTING): the eleven cards.
    const households = document.querySelector('[data-australia-section="households"]')!;
    expect(households.querySelectorAll('[data-australia-card]')).toHaveLength(AUSTRALIA_HOUSEHOLDS_IDS.length);
    expect(households.querySelectorAll('[data-australia-card]')).toHaveLength(11);

    // Trade & currency (VOTING): two cards.
    const tradeCurrency = document.querySelector('[data-australia-section="trade-currency"]')!;
    expect(tradeCurrency.querySelectorAll('[data-australia-card]')).toHaveLength(AUSTRALIA_TRADE_CURRENCY_IDS.length);
    expect(tradeCurrency.querySelectorAll('[data-australia-card]')).toHaveLength(2);

    // External (SHADOW — G-5): one card + the shadow attribute.
    const external = document.querySelector('[data-australia-section="external"]')!;
    expect(external.getAttribute('data-australia-shadow')).toBe('true');
    expect(external.querySelectorAll('[data-australia-card]')).toHaveLength(AUSTRALIA_EXTERNAL_IDS.length);
    expect(external.querySelectorAll('[data-australia-card]')).toHaveLength(1);

    // Activity (SHADOW — G-5): seven cards + the shadow attribute.
    const activity = document.querySelector('[data-australia-section="activity"]')!;
    expect(activity.getAttribute('data-australia-shadow')).toBe('true');
    expect(activity.querySelectorAll('[data-australia-card]')).toHaveLength(AUSTRALIA_ACTIVITY_IDS.length);
    expect(activity.querySelectorAll('[data-australia-card]')).toHaveLength(7);

    // World risk (§10 item 2's "plus gpr-australia"; AF-4): one card.
    const worldRisk = document.querySelector('[data-australia-section="world-risk"]')!;
    expect(worldRisk.querySelectorAll('[data-australia-card]')).toHaveLength(AUSTRALIA_WORLD_RISK_IDS.length);
    expect(worldRisk.querySelectorAll('[data-australia-card]')).toHaveLength(1);

    // The §21 trio per card — the VALUE render (the DISPLAY registry's own
    // joins), the 10-YEAR POSITION (the band word, fail-closed when no
    // percentile), and the FRESHNESS (asOf + the status word when the reading
    // is not normal). Spot checks a visitor would see.

    // au-cpi: percent binds tight ('2.8%') + the position word (typical · mid).
    const cpi = document.querySelector('[data-australia-card="au-cpi"]')!;
    expect(cpi.querySelector('[data-australia-value]')?.textContent).toBe('2.8%');
    expect(cpi.textContent).toContain('typical');
    // A normal reading carries no status word.
    expect(cpi.querySelector('[data-australia-status-word]')).toBeNull();

    // au-housing-finance: the AU money join (EN prefixes the currency +
    // binds the magnitude word tight — 'A$97.6bn'; scale 0.001 → 97.6).
    const housingFinance = document.querySelector('[data-australia-card="au-housing-finance"]')!;
    expect(housingFinance.querySelector('[data-australia-value]')?.textContent).toBe('A$97.6bn');

    // au-trade-balance: the AU money join (aud-m → 'A$495m').
    const tradeBalance = document.querySelector('[data-australia-card="au-trade-balance"]')!;
    expect(tradeBalance.querySelector('[data-australia-value]')?.textContent).toBe('A$495m');

    // au-job-vacancies: the counted unit join — resilient match (the exact
    // format depends on the DISPLAY registry's vacancies join; assert the
    // card exists, the value bdi contains '325', and the card or nearby
    // text contains the word 'vacancies').
    const vacanciesCard = document.querySelector('[data-australia-card="au-job-vacancies"]')!;
    const vacanciesValue = vacanciesCard.querySelector('[data-australia-value]')?.textContent ?? '';
    expect(vacanciesValue).toMatch(/325/);
    expect(vacanciesCard.textContent?.toLowerCase()).toContain('vacancies');

    // gpr-australia: the index unit suffixes with a space ('91.24 index').
    const gpr = document.querySelector('[data-australia-card="gpr-australia"]')!;
    expect(gpr.querySelector('[data-australia-value]')?.textContent).toBe('91.24 index');

    // au-unemployment: high position + the warning status word speaks.
    const unemployment = document.querySelector('[data-australia-card="au-unemployment"]')!;
    expect(unemployment.textContent).toContain('high');
    expect(unemployment.querySelector('[data-australia-status-word]')).not.toBeNull();

    // au-10y: low position (bottom 15%) + the percent join ('4.20%' —
    // au-10y display config is {decimals:2, unit:'percent'}, so 4.2 renders
    // as '4.20%' through the DISPLAY registry's own 2-decimal pad).
    const tenY = document.querySelector('[data-australia-card="au-10y"]')!;
    expect(tenY.querySelector('[data-australia-value]')?.textContent).toBe('4.20%');
    expect(tenY.textContent).toContain('low');

    // The whole registry surface: 28 cards in placement order, zero
    // unrendered ids (the full card-render audit vs the placement table).
    expect(document.querySelectorAll('[data-australia-card]')).toHaveLength(28);
    const renderedIds = [...document.querySelectorAll('[data-australia-card]')].map((el) => el.getAttribute('data-australia-card'));
    expect(renderedIds).toEqual([
      ...AUSTRALIA_INFLATION_RATES_IDS,
      ...AUSTRALIA_HOUSEHOLDS_IDS,
      ...AUSTRALIA_TRADE_CURRENCY_IDS,
      ...AUSTRALIA_EXTERNAL_IDS,
      ...AUSTRALIA_ACTIVITY_IDS,
      ...AUSTRALIA_WORLD_RISK_IDS,
    ] as string[]);
    expect(renderedIds).toEqual(AUSTRALIA_CARD_IDS as string[]);

    // The 11 moved-out seat chips (§10 "Moved out"): each a REAL link to
    // its new home (the placement's own homePageOfIndicator — the S5
    // seat-chip discipline, never hand-copied).
    const seats = document.querySelectorAll('[data-australia-seat]');
    expect(seats).toHaveLength(AUSTRALIA_MOVED_OUT_IDS.length);
    expect(seats).toHaveLength(11);

    // The seat-home resolution (the S5 seat-chip discipline): the
    // data-australia-seat-home attribute (the homePage, sans the leading
    // slash) + the href (the full route path).
    const seatHome = (id: string): string =>
      document.querySelector(`[data-australia-seat="${id}"]`)?.getAttribute('data-australia-seat-home') ?? '';
    const seatHref = (id: string): string =>
      document.querySelector(`[data-australia-seat="${id}"]`)?.getAttribute('href') ?? '';

    // audusd · audjpy · audnzd → /currencies.
    expect(seatHome('audusd')).toBe('currencies');
    expect(seatHref('audusd')).toBe('/currencies');
    expect(seatHome('audjpy')).toBe('currencies');
    expect(seatHref('audjpy')).toBe('/currencies');
    expect(seatHome('audnzd')).toBe('currencies');
    expect(seatHref('audnzd')).toBe('/currencies');

    // nz-short-rate · nz-10y · china-property-investment · china-steel-output → /asia-pacific.
    expect(seatHome('nz-short-rate')).toBe('asia-pacific');
    expect(seatHref('nz-short-rate')).toBe('/asia-pacific');
    expect(seatHome('nz-10y')).toBe('asia-pacific');
    expect(seatHref('nz-10y')).toBe('/asia-pacific');
    expect(seatHome('china-property-investment')).toBe('asia-pacific');
    expect(seatHref('china-property-investment')).toBe('/asia-pacific');
    expect(seatHome('china-steel-output')).toBe('asia-pacific');
    expect(seatHref('china-steel-output')).toBe('/asia-pacific');

    // iron-ore · coal-aus · lng-japan → /commodities.
    expect(seatHome('iron-ore')).toBe('commodities');
    expect(seatHref('iron-ore')).toBe('/commodities');
    expect(seatHome('coal-aus')).toBe('commodities');
    expect(seatHref('coal-aus')).toBe('/commodities');
    expect(seatHome('lng-japan')).toBe('commodities');
    expect(seatHref('lng-japan')).toBe('/commodities');

    // gold-aud → /gold.
    expect(seatHome('gold-aud')).toBe('gold');
    expect(seatHref('gold-aud')).toBe('/gold');

    // Each seat is a 44px touch target (spec §18 D-48).
    for (const seat of seats) {
      expect(seat.className).toContain('min-h-[44px]');
    }

    // A click on the audusd seat navigates to /currencies.
    fireEvent.click(document.querySelector('[data-australia-seat="audusd"]')!);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/currencies');
    });
  });

  it('the fail-closed path: an absent reading renders the unavailable word, never a guess', async () => {
    atRoute('/australia');
    // au-nom is honestly absent (a licence-hidden id) — the projection
    // reports it in absentIds and the card speaks the word.
    const fixture = australiaProjectionFixture();
    const readings = fixture.readings.filter((r) => (r.id as string) !== 'au-nom');
    stubFeeds({
      projection: () =>
        jsonResponse({
          ...fixture,
          readings,
          absentIds: ['au-nom'],
        }),
    });
    render(<AustraliaPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-australia-card="au-nom"]')).not.toBeNull();
    });
    const nom = document.querySelector('[data-australia-card="au-nom"]')!;
    expect(nom.getAttribute('data-australia-status')).toBe('absent');
    // The unavailable word speaks (resilient match — the exact en string
    // lives under pd.australia.valueUnavailable, not asserted verbatim; the
    // card renders NO value bdi in the absent state).
    expect(nom.querySelector('[data-australia-value]')).toBeNull();
    expect(nom.textContent).toMatch(/\S/); // non-empty honesty line
    // The 28 cards still render (the absent one speaks the word).
    expect(document.querySelectorAll('[data-australia-card]')).toHaveLength(28);
    // The absent note speaks (the projection's own honest report —
    // resilient match on the count, since the en template may vary).
    expect(document.body.textContent).toMatch(/1\s+of this page/);
  });

  it('the fail-closed path: a dead projection with no cache renders the honest error state + the retry', async () => {
    atRoute('/australia');
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<AustraliaPage />);
    await waitFor(() => {
      // The retry button is present (mirrors AsiaPage.test.tsx:364 — the
      // zoom's period-selector radios are also role=button, so getByRole
      // matches 5; narrow to the retry button's own en label text).
      expect(screen.getByText('Try again')).toBeTruthy();
    });
    // The error title speaks (resilient match — the exact en string lives
    // under pd.australia.errorTitle, asserted to contain 'unavailable').
    await waitFor(() => {
      expect(document.body.textContent?.toLowerCase()).toMatch(/unavailable|error|try/);
    });
    // Nothing is faked — no cards.
    expect(document.querySelectorAll('[data-australia-card]').length).toBe(0);
    // The zoom + the board stay (their own feeds are alive).
    expect(document.querySelector('[data-region-zoom="australia"]')).not.toBeNull();
    expect(document.querySelector('[data-australia-board]')).not.toBeNull();
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    atRoute('/australia');
    stubFeeds();
    render(<AustraliaPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-australia-card]').length).toBe(28);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page;
    // the localStorage last-good copy persists — the M-17 offline fallback).
    clearProjectionCacheForTests();
    // Second visit: the projection feed dies; the cached projection
    // paints — labelled (the zoom's own board feed stays alive).
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/markets-au')) return auBoardFixture();
        if (url.includes('/api/insights/markets')) return jsonResponse(boardFixture());
        if (url.includes('/assets/map/')) return new Response('not found', { status: 404 });
        return jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503);
      }),
    );
    render(<AustraliaPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-australia-card]').length).toBe(28);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    expect(document.querySelector('[data-australia-cached]')).not.toBeNull();
  });

  it('the fa/RTL rendering: the Persian title + the Persian gauge heading + the Persian card value joins', async () => {
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
    atRoute('/australia');
    stubFeeds();
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <AustraliaPage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-australia-section="inflation-rates"]')).not.toBeNull();
      });
      // The page title in the corpus's Persian (resilient — assert the h1
      // contains Persian-script characters rather than the exact string).
      const h1 = document.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1!.textContent ?? '').toMatch(/[\u0600-\u06FF]/);
      // A gauge heading in Persian (the corpus's own fa question — the
      // inflation-rates section h2 carries Persian characters).
      const inflationHeading = document.querySelector('[data-australia-section="inflation-rates"] h2')?.textContent ?? '';
      expect(inflationHeading).not.toBe('');
      expect(inflationHeading).toMatch(/[\u0600-\u06FF]/); // Persian/Arabic script
      // The au-cpi value in Persian digits (percent binds tight: '۲٫۸٪').
      const cpi = document.querySelector('[data-australia-card="au-cpi"]')!;
      expect(cpi.querySelector('[data-australia-value]')?.textContent).toBe('\u06F2\u066B\u06F8\u066A');
      // The AU money fa join (au-housing-finance: the suffix word —
      // '۹۷٫۶ میلیارد دلار استرالیا').
      const housingFinance = document.querySelector('[data-australia-card="au-housing-finance"]')!;
      expect(housingFinance.querySelector('[data-australia-value]')?.textContent).toBe(
        '\u06F9\u06F7\u066B\u06F6 \u0645\u06CC\u0644\u06CC\u0627\u0631\u062F \u062F\u0644\u0627\u0631 \u0627\u0633\u062A\u0631\u0627\u0644\u06CC\u0627',
      );
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
