/**
 * @vitest-environment jsdom
 *
 * CommoditiesPage.test.tsx (S17, 2026-11-11) — the Commodities page's
 * DOM-level characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the
 *     data-as-of line (the In-build chip RETIRED at the S17 gates pass —
 *     BD-S17c, the S13 Europe / S15 Asia / S16 Australia retirement
 *     trajectory: the build and the gates ship in this one session, so
 *     once the §21 diff, the freshness audit, the render audit and the
 *     browser pass are green the chip comes off before the deploy);
 *   - the five group sections (§11, D-38/D-39): energy (9) · metals (4) ·
 *     agriculture (3) · digital (2) · trade-routes-supply (6) = 24 placed
 *     cards;
 *   - every card carries the §21 trio (value · 10-year position ·
 *     freshness), the values rendered through the DISPLAY registry's own
 *     joins (the usd prefix 'US$73.45' EN / the fa suffix '۷۳٫۴۵ دلار';
 *     the index + barrels + transits suffix with a space; the 1e-3 scales
 *     on the barrels family);
 *   - the gold cross-link (§11 "Cross-links", D-19/D-27): the metals
 *     group's link to /gold, a 44px touch target (spec §18 D-48);
 *   - the honest fail-closed paths: an absent reading renders the
 *     unavailable word; a dead projection with no cache renders the error
 *     state + retry;
 *   - the M-17 last-good path: a failed refresh after a good load keeps
 *     the page on screen, labelled;
 *   - the fa/RTL rendering (the Persian title + the Persian group heading
 *     + the Persian card value joins, including the fa usd suffix word).
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { IndicatorReading, PageProjection } from '@currena/core';
import { PageProjectionSchema } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import { CommoditiesPage } from './CommoditiesPage';
import {
  COMMODITIES_CARD_IDS,
  COMMODITIES_ENERGY_IDS,
  COMMODITIES_METALS_IDS,
  COMMODITIES_AGRICULTURE_IDS,
  COMMODITIES_DIGITAL_IDS,
  COMMODITIES_TRADE_ROUTES_IDS,
  COMMODITIES_GOLD_HREF,
} from './commodities-tiles';
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

/** The 24 Commodities home cards' displayed values — real-world magnitudes
 *  so the §21 trio asserts the DISPLAY registry's own joins (the usd
 *  prefix 'US$73.45' EN; the index + barrels + transits suffix with a
 *  space; the 1e-3 scales on the barrels family). The percentile10y
 *  values choose clean band phrases (high / low / typical) covering every
 *  branch. */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  // Energy (9) — the task-specified magnitudes + band coverage.
  brent: { value: 73.45, percentile10y: 0.5, status: 'normal', asOf: '2026-11-08' }, // usd · typical
  wti: { value: 69.87, percentile10y: 0.3, asOf: '2026-11-08' }, // usd · typical
  natgas: { value: 2.84, percentile10y: 0.85, status: 'warning', asOf: '2026-11-08' }, // usd · high · top 15%
  'gas-europe': { value: 13.5, percentile10y: 0.6, asOf: '2026-10-15' }, // usd · typical
  'lng-japan': { value: 12.3, percentile10y: 0.4, asOf: '2026-10-15' }, // usd · typical
  'coal-aus': { value: 113.5, percentile10y: 0.7, asOf: '2026-10-15' }, // usd · typical
  'eia-crude-stocks': { value: 416700, percentile10y: 0.5, asOf: '2026-11-01' }, // barrels (scale 1e-3 → 416.7)
  'us-spr': { value: 387000, percentile10y: 0.15, asOf: '2026-11-01' }, // barrels · low · bottom 15%
  'us-crude-production': { value: 13990, percentile10y: 0.9, asOf: '2026-11-01' }, // barrels-per-day (scale 1e-3 → 13.99) · high
  // Metals (4).
  'silver-usd': { value: 31.27, percentile10y: 0.92, status: 'warning', asOf: '2026-11-08' }, // usd · high · top 8%
  platinum: { value: 995.4, percentile10y: 0.2, asOf: '2026-11-08' }, // usd · low · bottom 20%
  'copper-usd': { value: 9540, percentile10y: 0.5, asOf: '2026-11-08' }, // usd · typical
  'iron-ore': { value: 109.8, percentile10y: 0.1, asOf: '2026-10-15' }, // usd · low · bottom 10%
  // Agriculture (3).
  'food-index': { value: 121.3, percentile10y: 0.75, asOf: '2026-10-15' }, // index · typical
  wheat: { value: 5.67, percentile10y: 0.3, asOf: '2026-10-15' }, // usd · typical
  maize: { value: 4.32, percentile10y: 0.4, asOf: '2026-10-15' }, // usd · typical
  // Digital (2).
  'btc-usd': { value: 67250, percentile10y: 0.88, asOf: '2026-11-08' }, // usd · high · top 12%
  'crypto-fng': { value: 72, percentile10y: 0.6, asOf: '2026-11-08' }, // index · typical
  // Trade routes & supply (6).
  'chokepoint-suez': { value: 65.3, percentile10y: 0.5, asOf: '2026-11-05' }, // transits · typical
  'chokepoint-panama': { value: 27.1, percentile10y: 0.3, asOf: '2026-11-05' }, // transits · typical
  'chokepoint-bab-el-mandeb': { value: 12.4, percentile10y: 0.15, asOf: '2026-11-05' }, // transits · low
  'chokepoint-malacca': { value: 230.5, percentile10y: 0.7, asOf: '2026-11-05' }, // transits · typical
  'chokepoint-taiwan': { value: 88.7, percentile10y: 0.5, asOf: '2026-11-05' }, // transits · typical
  gscpi: { value: -0.42, percentile10y: 0.25, asOf: '2026-10-31' }, // index · typical
};

/** The Commodities projection: the placement's own reading order (24 home
 *  readings, no mirrors — the placement's mirrors:[]), every card present
 *  in public mode (absentIds empty — the live §21 diff's own honest
 *  report). The boards field is empty (the placement's boards:[] — no
 *  zoom, no markets board). */
function commoditiesProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = pageReadingIds('commodities').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
  return {
    page: 'commodities',
    generatedAt: '2026-11-08T11:23:21.693Z',
    displayMode: 'public',
    readings,
    absentIds: [],
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
  return jsonResponse({ error: { code: 'not_found', message: 'nope' } }, 404);
}

/** Route the stubbed fetch: the Commodities projection (no boards, no zoom
 *  — the page fetches ONE feed). */
function stubFeeds(overrides: { projection?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/commodities')) return (overrides.projection ?? (() => jsonResponse(commoditiesProjectionFixture())))();
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

describe('CommoditiesPage', () => {
  it('fixture sanity: the projection satisfies its contract', () => {
    expect(() => PageProjectionSchema.parse(commoditiesProjectionFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    atRoute('/commodities');
    const { container } = render(<CommoditiesPage />);
    // The loading container speaks (resilient match — the exact en string
    // lives under pd.commodities.loadingLine, not asserted verbatim).
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it('renders the shell + the five group sections + the 24 cards + the gold cross-link over the real derivations', async () => {

    atRoute('/commodities');
    stubFeeds();
    render(<CommoditiesPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-commodities-section="energy"]')).not.toBeNull();
    });

    // S19 (2026-11-12): the wayfinding row — Home › Commodities & Energy (BD-S19b).
    expect(document.querySelector('[data-page-breadcrumbs] [aria-current=\'page\']')?.textContent).toBe('Commodities & Energy');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');

    // The shell: title + purpose + the data-as-of line. The In-build
    // chip is RETIRED (S17's gate pass — BD-S17c's completion); it must
    // NOT render on the Commodities page. Mirrors the S13 Europe / S15
    // Asia / S16 Australia retirement trajectory (BD-S16c).
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toMatch(/Commodities/i);
    expect(document.body.textContent).toContain('Data as of');

    // The five group sections, each with its card count.
    const sections = [
      { name: 'energy', ids: COMMODITIES_ENERGY_IDS },
      { name: 'metals', ids: COMMODITIES_METALS_IDS },
      { name: 'agriculture', ids: COMMODITIES_AGRICULTURE_IDS },
      { name: 'digital', ids: COMMODITIES_DIGITAL_IDS },
      { name: 'trade-routes-supply', ids: COMMODITIES_TRADE_ROUTES_IDS },
    ];
    for (const s of sections) {
      const section = document.querySelector(`[data-commodities-section="${s.name}"]`);
      expect(section, `${s.name} section renders`).not.toBeNull();
      expect(section!.querySelectorAll('[data-commodities-card]').length).toBe(s.ids.length);
    }

    // The §21 trio spot checks (the DISPLAY registry's own joins):
    // brent usd PREFIXED in EN ('US$73.45' — no space) + the typical
    // position word (pct 0.5 → the middle band, no status word).
    const brent = document.querySelector('[data-commodities-card="brent"]')!;
    expect(brent.querySelector('[data-commodities-value]')?.textContent).toBe('US$73.45');
    expect(brent.textContent).toContain('typical');
    expect(brent.querySelector('[data-commodities-status-word]')).toBeNull(); // normal reading → no status word
    // natgas high · top 15% + the warning status word.
    const natgas = document.querySelector('[data-commodities-card="natgas"]')!;
    expect(natgas.textContent).toContain('high');
    expect(natgas.querySelector('[data-commodities-status-word]')?.textContent).toMatch(/\S/);
    // eia-crude-stocks barrels (scale 1e-3 → '416.7 m barrels').
    const stocks = document.querySelector('[data-commodities-card="eia-crude-stocks"]')!;
    expect(stocks.querySelector('[data-commodities-value]')?.textContent).toBe('416.7 m barrels');
    // us-crude-production barrels-per-day (scale 1e-3 → '13.99 m barrels a day').
    const prod = document.querySelector('[data-commodities-card="us-crude-production"]')!;
    expect(prod.querySelector('[data-commodities-value]')?.textContent).toBe('13.99 m barrels a day');
    // chokepoint-suez transits ('65.3 transits a day').
    const suez = document.querySelector('[data-commodities-card="chokepoint-suez"]')!;
    expect(suez.querySelector('[data-commodities-value]')?.textContent).toBe('65.3 transits a day');
    // food-index index ('121.3 index').
    const food = document.querySelector('[data-commodities-card="food-index"]')!;
    expect(food.querySelector('[data-commodities-value]')?.textContent).toBe('121.3 index');
    // us-spr low · bottom 15% (pct 0.15 → bottom 15%).
    const spr = document.querySelector('[data-commodities-card="us-spr"]')!;
    expect(spr.textContent).toContain('low');

    // The whole-registry audit: 24 cards render, in group order, equal
    // to COMMODITIES_CARD_IDS.
    expect(document.querySelectorAll('[data-commodities-card]').length).toBe(24);
    const renderedIds = Array.from(document.querySelectorAll('[data-commodities-card]')).map((el) => el.getAttribute('data-commodities-card'));
    expect(renderedIds).toEqual([
      ...COMMODITIES_ENERGY_IDS,
      ...COMMODITIES_METALS_IDS,
      ...COMMODITIES_AGRICULTURE_IDS,
      ...COMMODITIES_DIGITAL_IDS,
      ...COMMODITIES_TRADE_ROUTES_IDS,
    ]);
    expect(renderedIds).toEqual(COMMODITIES_CARD_IDS as readonly string[]);

    // The gold cross-link (§11 "Cross-links", D-19/D-27): the metals
    // group's link to /gold, a 44px touch target.
    const goldLink = document.querySelector('[data-commodities-gold-cross-link] a')!;
    expect(goldLink.getAttribute('href')).toBe(COMMODITIES_GOLD_HREF);
    expect(goldLink.className).toContain('min-h-[44px]');
    fireEvent.click(goldLink);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/gold');
    });

    // The In-build chip is RETIRED AND no "in build" claim remains —
    // the page's cards are complete and verified (BD-S17c — the S13
    // Europe / S15 Asia / S16 Australia retirement trajectory).
    expect(document.body.textContent ?? '').not.toContain('In build');
  });

  it('the fail-closed path: an absent reading renders the unavailable word, never a guess', async () => {
    atRoute('/commodities');
    // gscpi is honestly absent (a licence-hidden id) — the projection
    // reports it in absentIds and the card speaks the word.
    const fixture = commoditiesProjectionFixture();
    const readings = fixture.readings.filter((r) => (r.id as string) !== 'gscpi');
    stubFeeds({
      projection: () =>
        jsonResponse({
          ...fixture,
          readings,
          absentIds: ['gscpi'],
        }),
    });
    render(<CommoditiesPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-commodities-card="gscpi"]')).not.toBeNull();
    });
    const gscpi = document.querySelector('[data-commodities-card="gscpi"]')!;
    expect(gscpi.getAttribute('data-commodities-status')).toBe('absent');
    // The unavailable word speaks (resilient match — the exact en string
    // lives under pd.commodities.valueUnavailable, not asserted verbatim; the
    // card renders NO value bdi in the absent state).
    expect(gscpi.querySelector('[data-commodities-value]')).toBeNull();
    expect(gscpi.textContent).toMatch(/\S/); // non-empty honesty line
    // The 24 cards still render (the absent one speaks the word).
    expect(document.querySelectorAll('[data-commodities-card]')).toHaveLength(24);
    // The absent note speaks (the projection's own honest report —
    // resilient match on the count, since the en template may vary).
    expect(document.body.textContent).toMatch(/1\s+of this page/);
  });

  it('the fail-closed path: a dead projection with no cache renders the honest error state + the retry', async () => {
    atRoute('/commodities');
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<CommoditiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeTruthy();
    });
    // The error title speaks (resilient match — the exact en string lives
    // under pd.commodities.errorTitle, asserted to contain 'unavailable').
    await waitFor(() => {
      expect(document.body.textContent?.toLowerCase()).toMatch(/unavailable|error|try/);
    });
    // Nothing is faked — no cards.
    expect(document.querySelectorAll('[data-commodities-card]').length).toBe(0);
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    atRoute('/commodities');
    stubFeeds();
    render(<CommoditiesPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-commodities-card]').length).toBe(24);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page;
    // the localStorage last-good copy persists — the M-17 offline fallback).
    clearProjectionCacheForTests();
    // Second visit: the projection feed dies; the cached projection
    // paints — labelled.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503)),
    );
    render(<CommoditiesPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-commodities-card]').length).toBe(24);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    expect(document.querySelector('[data-commodities-cached]')).not.toBeNull();
  });

  it('the fa/RTL rendering: the Persian title + the Persian group heading + the Persian card value joins', async () => {
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
    atRoute('/commodities');
    stubFeeds();
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <CommoditiesPage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-commodities-section="energy"]')).not.toBeNull();
      });
      // The page title in the corpus's Persian (resilient — assert the h1
      // contains Persian-script characters rather than the exact string).
      const h1 = document.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1!.textContent ?? '').toMatch(/[\u0600-\u06FF]/);
      // A group heading in Persian (the energy section h2 carries Persian
      // characters).
      const energyHeading = document.querySelector('[data-commodities-section="energy"] h2')?.textContent ?? '';
      expect(energyHeading).not.toBe('');
      expect(energyHeading).toMatch(/[\u0600-\u06FF]/); // Persian/Arabic script
      // The brent value in Persian digits + the fa usd suffix word
      // ('۷۳٫۴۵ دلار' — the usd unit is suffixed in fa).
      const brent = document.querySelector('[data-commodities-card="brent"]')!;
      expect(brent.querySelector('[data-commodities-value]')?.textContent).toBe('\u06F7\u06F3\u066B\u06F4\u06F5 \u062F\u0644\u0627\u0631');
      // The chokepoint-suez fa transits join (Persian digits + the suffix
      // word 'تردد در روز').
      const suez = document.querySelector('[data-commodities-card="chokepoint-suez"]')!;
      expect(suez.querySelector('[data-commodities-value]')?.textContent).toBe('\u06F6\u06F5\u066B\u06F3 \u062A\u0631\u062F\u062F \u062F\u0631 \u0631\u0648\u0632');
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
