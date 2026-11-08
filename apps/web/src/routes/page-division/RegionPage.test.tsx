/**
 * @vitest-environment jsdom
 *
 * RegionPage.characterization.test.tsx (S8, 2026-11-08) — the four
 * region pages' DOM-level characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the
 *     honest still-building chip (the region's own cards/verdicts are
 *     the page build sessions' scope — S9–S16) + the placeholder body
 *     (what will live here · builds in · the legacy link);
 *   - the D-44 index section: the region's own heading + intro line +
 *     the board's stamp, and the REUSED map in region mode (the wm root
 *     carrying data-wm-zoom, the zoomed viewBox, ONLY the zoom's cards —
 *     the same drawing, the same corpus-pinned adapter words);
 *   - the route→region mapping: /usa→us · /europe→europe ·
 *     /asia-pacific→asia · /australia→australia;
 *   - the honest fail-closed paths: a dead board with no cache renders
 *     the calm cannot-read line, never a guess;
 *   - the M-17 last-good path: a failed refresh keeps the cached copy
 *     on screen, labelled;
 *   - a zoomed card click opens the market's full home today
 *     (/world-markets — the S7 grids);
 *   - the fa/RTL rendering (the Persian section heading + the Persian
 *     card words through the pinned adapter).
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { MarketsSnapshot } from '@currena/core';
import { MarketsSnapshotSchema } from '@currena/core';
import { MARKETS, summarizeMarkets } from '@currena/insights/markets';
import { RegionPage } from './RegionPage';
import { REGION_ZOOMS } from '../../components/insights/world-markets/world-map-config';
import type { MapRegionId } from '../../components/insights/world-markets/world-map-config';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

/** A full 16-row board (the S7 characterization fixture's shape). */
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Route the stubbed fetch: the board feed + the map's two static
 * assets (404 — the land never paints in jsdom; the cards are the DOM
 * under test). */
function stubFeeds(overrides: { board?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/markets')) return (overrides.board ?? (() => jsonResponse(boardFixture())))();
      if (url.includes('/assets/map/')) return new Response('not found', { status: 404 });
      return jsonResponse({ error: { code: 'not_found', message: 'nope' } }, 404);
    }),
  );
}

/** Seat the SPA at a route (the router reads window.location.pathname). */
function atRoute(path: string): void {
  window.history.pushState(null, '', path);
}

beforeEach(() => {
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

const ROUTE_TITLES: Readonly<Record<string, [string, string]>> = {
  // [route, [region, expected section heading]] — en locale.
  '/usa': ['us', 'US stock indexes'],
  '/europe': ['europe', 'European stock indexes'],
  '/asia-pacific': ['asia', 'Asia & Pacific stock indexes'],
  '/australia': ['australia', 'Australian stock indexes'],
};

describe('RegionPage', () => {
  it('fixture sanity: the board satisfies its contract', () => {
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
  });

  for (const [route, [region, heading]] of Object.entries(ROUTE_TITLES)) {
    it(`${route}: the destination shell + the D-44 index section (the ${region} zoom)`, async () => {
      atRoute(route);
      stubFeeds();
      render(<RegionPage />);

      // The shell: the destination's own title + the honest still-building
      // chip + the purpose line + the placeholder body's traceability.
      expect(document.querySelector('h1')!.textContent).toMatch(/USA|Europe|Asia|Australia/);
      expect(document.body.textContent).toContain('In build');
      expect(document.body.textContent).toContain('What will live here');
      expect(document.body.textContent).toContain('docs/page-division');

      // The section: the region's own heading + the intro line + the
      // board's stamp.
      await waitFor(() => {
        expect(document.querySelector(`[data-region-zoom="${region}"]`)).not.toBeNull();
      });
      expect(document.querySelector(`[data-region-zoom="${region}"] h2`)!.textContent).toBe(heading);
      expect(document.querySelector(`[data-region-zoom="${region}"]`)!.textContent).toContain('same board data');

      // The REUSED map in region mode: the zoomed viewBox + ONLY the
      // zoom's cards (the same drawing, the corpus-pinned words).
      await waitFor(() => {
        expect(document.querySelector('.wm')).not.toBeNull();
      });
      const { x, y, w, h } = REGION_ZOOMS[region as MapRegionId].viewBox;
      expect(document.querySelector('.wm-map')!.getAttribute('viewBox')).toBe(`${x} ${y} ${w} ${h}`);
      expect(document.querySelectorAll('.wm-card')).toHaveLength(REGION_ZOOMS[region as MapRegionId].indices.length);
      // A zoomed card's numbers come from the board's own rows.
      expect(document.querySelector('.wm-card')!.textContent).toContain('+0.5');
    });
  }

  it('the four routes map to the four zooms (no cross-talk)', async () => {
    for (const [route, [region]] of Object.entries(ROUTE_TITLES)) {
      atRoute(route);
      stubFeeds();
      const { unmount } = render(<RegionPage />);
      await waitFor(() => {
        expect(document.querySelector(`[data-region-zoom="${region}"] .wm`)).not.toBeNull();
      });
      expect(document.querySelector('.wm')!.getAttribute('data-wm-zoom')).toBe(region);
      unmount();
      cleanup();
      window.localStorage.clear();
    }
  });

  it('the honest fail-closed path: a dead board with no cache renders the calm cannot-read line, never a guess', async () => {
    atRoute('/europe');
    stubFeeds({ board: () => jsonResponse({ error: { code: 'markets_not_ready', message: 'being prepared' } }, 503) });
    render(<RegionPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-region-zoom-empty]')).not.toBeNull();
    });
    expect(document.querySelector('[data-region-zoom-empty]')!.textContent).toContain('Cannot read yet');
    // No map, no cards — nothing is faked.
    expect(document.querySelector('.wm')).toBeNull();
  });

  it('the M-17 last-good path: a failed refresh keeps the cached copy on screen, labelled', async () => {
    atRoute('/asia-pacific');
    // Boot from a cached copy (the localStorage pattern's own key).
    window.localStorage.setItem('currena:insights:markets', JSON.stringify(boardFixture()));
    stubFeeds({ board: () => jsonResponse({ error: { code: 'markets_not_ready', message: 'being prepared' } }, 503) });
    render(<RegionPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-region-zoom="asia"] .wm')).not.toBeNull();
    });
    // The cached caption speaks (a real event, never a routine age).
    expect(document.querySelector('[data-region-board-cached]')).not.toBeNull();
    // The cards still render the cached board's numbers.
    expect(document.querySelectorAll('.wm-card')).toHaveLength(REGION_ZOOMS.asia.indices.length);
  });

  it('a zoomed card click opens the market\'s full home today (/world-markets)', async () => {
    atRoute('/usa');
    stubFeeds();
    render(<RegionPage />);
    await waitFor(() => {
      expect(document.querySelector('.wm-card')).not.toBeNull();
    });
    const before = window.location.pathname;
    expect(before).toBe('/usa');
    fireEvent.click(document.querySelector('.wm-card')!);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/world-markets');
    });
  });

  it('the fa/RTL rendering: the Persian section heading + the Persian card words', async () => {
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
    atRoute('/europe');
    stubFeeds();
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <RegionPage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-region-zoom="europe"] .wm')).not.toBeNull();
      });
      expect(document.querySelector('[data-region-zoom="europe"] h2')!.textContent).toBe('شاخص‌های سهام اروپا');
      // The card words are the corpus's own Persian (through the pinned
      // adapter — the same words the legacy card speaks).
      expect(document.querySelector('.wm-card')!.textContent).toContain('بسته');
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
