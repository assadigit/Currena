/**
 * @vitest-environment jsdom
 *
 * AsiaPage.test.tsx (S14 + S15, 2026-11-09) — the Asia & Pacific page's
 * DOM-level characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the
 *     data-as-of line (the In-build chip RETIRED at S15's gate pass —
 *     BD-S14b's completion; the §15 FRED-only CPI fills stay verified-
 *     pending-ingest, a separate engine-layer change, and their absence
 *     does not make the 11 placed cards "in build");
 *   - the S8 zoom section stays on top through EVERY state (the board
 *     feed is its own — a slow or dead projection never takes the map
 *     away): data-region-zoom="asia" + the zoomed viewBox + ONLY the
 *     six Asia cards (n225 · kospi · hsi · ssec · taiex · nifty50 — the
 *     S8 pins, re-proven under the new page);
 *   - the China section (§9 item 1): the seven China cards in placement
 *     order;
 *   - the Japan section (§9 item 2): jgb-10y · boj-rate;
 *   - the Korea/Taiwan/HK section (§9 item 3): INDEX-ONLY today — NO
 *     cards, just the honest index-only note (the markets ride the zoom
 *     above; the Korea CPI fill is verified-pending-ingest);
 *   - the India section (§9 item 4): INDEX-ONLY today — same honest
 *     note;
 *   - the Pacific New Zealand section (§9 item 5): nz-short-rate ·
 *     nz-10y;
 *   - every card carries the §21 trio (value · 10-year position ·
 *     freshness), the values rendered through the DISPLAY registry's own
 *     joins (percent binds tight, index + tonnes suffix with a space —
 *     pinned output-for-output against formatReadingValue by
 *     asia-tiles.test.ts — including china-steel-output's tonnes+scale);
 *   - the cross-links strip (§9): usdcny · usdjpy → /currencies +
 *     sge-gold → /gold, each a 44px touch target (spec §18 D-48);
 *   - the honest fail-closed paths: an absent reading renders the
 *     unavailable word; a dead projection with no cache renders the
 *     error state + retry;
 *   - the M-17 last-good path: a failed refresh after a good load keeps
 *     the page on screen, labelled;
 *   - the fa/RTL rendering (the Persian title + the Persian China
 *     section heading + the Persian card name + the Persian value joins).
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
import { AsiaPage } from './AsiaPage';
import { ASIA_CHINA_IDS, ASIA_JAPAN_IDS, ASIA_PACIFIC_NZ_IDS, ASIA_CARD_IDS } from './asia-tiles';
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

/** The eleven Asia cards' displayed values — real-world magnitudes so
 *  the §21 trio asserts the DISPLAY registry's own joins (percent binds
 *  tight; index + tonnes suffix with a space; china-steel-output's
 *  scale 1e-2 → 73.6 m tonnes). The percentile10y values choose clean
 *  band phrases (high/low/typical) covering every branch. */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  'china-pmi': { value: 49.5, percentile10y: 0.15, status: 'warning', asOf: '2026-10-31' }, // low · bottom 15%
  'china-cpi': { value: 0.4, percentile10y: 0.05, status: 'context', asOf: '2026-10-31' }, // low · bottom 5%
  'oecd-cli-cn': { value: 99.2, percentile10y: 0.5, status: 'context', asOf: '2026-09-01' }, // typical
  'gpr-china': { value: 109.87, percentile10y: 0.85, status: 'context', asOf: '2026-10-01' }, // high · top 15%
  'gpr-taiwan': { value: 131.45, percentile10y: 0.92, status: 'context', asOf: '2026-10-01' }, // high · top 8%
  'china-property-investment': { value: -9.3, percentile10y: 0.03, status: 'context', asOf: '2026-10-31' }, // low · bottom 3%
  'china-steel-output': { value: 7359, percentile10y: 0.78, status: 'context', asOf: '2026-10-31' }, // typical (scaled → 73.6 m tonnes)
  'jgb-10y': { value: 1.07, percentile10y: 0.22, status: 'context', asOf: '2026-11-08' }, // typical
  'boj-rate': { value: 0.25, percentile10y: 0.18, status: 'context', asOf: '2026-10-31' }, // low · bottom 18%
  'nz-short-rate': { value: 4.75, percentile10y: 0.88, status: 'context', asOf: '2026-09-01' }, // high · top 12%
  'nz-10y': { value: 4.55, percentile10y: 0.72, status: 'context', asOf: '2026-09-01' }, // typical
};

/** The Asia projection: the placement's own reading order (11 homes),
 *  every card present in public mode (absentIds empty — the live §21
 *  diff's own honest report). */
function asiaProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = pageReadingIds('asia-pacific').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
  return {
    page: 'asia-pacific',
    generatedAt: '2026-11-08T11:23:21.693Z',
    displayMode: 'public',
    readings,
    absentIds: [],
    boards: ['markets'],
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFound(): Response {
  return jsonResponse({ error: { code: 'not_found', message: 'nope' } }, 404);
}

/** Route the stubbed fetch: the Asia projection + the board feed (the
 *  zoom's own) + the map's static assets (404 — the land never paints
 *  in jsdom; the cards are the DOM under test). */
function stubFeeds(overrides: { projection?: () => Response; board?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/asia-pacific')) return (overrides.projection ?? (() => jsonResponse(asiaProjectionFixture())))();
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

describe('AsiaPage', () => {
  it('fixture sanity: both payloads satisfy their contracts', () => {
    expect(() => PageProjectionSchema.parse(asiaProjectionFixture())).not.toThrow();
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives — and the zoom stays on top', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    atRoute('/asia-pacific');
    const { container } = render(<AsiaPage />);
    expect(container.textContent).toContain('Reading the Asia & Pacific numbers');
    // The zoom's own feed was never stubbed alive here (404s) — the
    // section itself still renders (its honest loading/empty shapes).
    expect(document.querySelector('[data-region-zoom="asia"]')).not.toBeNull();
  });

  it('renders the shell + the zoom + the five sections + the cross-links over the real derivations', async () => {
    atRoute('/asia-pacific');
    stubFeeds();
    render(<AsiaPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-asia-section="china"]')).not.toBeNull();
    });

    // The shell: title + purpose + the data-as-of line. The In-build
    // chip is RETIRED (S15's gate pass — BD-S14b's completion); it must
    // NOT render on the Asia page anymore.
    expect(screen.getByRole('heading', { level: 1, name: 'Asia & Pacific' })).toBeTruthy();
    // S19 (2026-11-12): the wayfinding row — Home › Asia & Pacific (BD-S19b).
    expect(document.querySelector('[data-page-breadcrumbs] [aria-current=\'page\']')?.textContent).toBe('Asia & Pacific');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');

    expect(screen.queryByText('In build')).toBeNull();
    expect(document.body.textContent).toContain('Data as of Nov 8, 2026');

    // The S8 zoom section stays on top of the S14 layers.
    const zoom = document.querySelector('[data-region-zoom="asia"]');
    expect(zoom).not.toBeNull();
    expect(zoom!.querySelector('.wm')?.getAttribute('data-wm-zoom')).toBe('asia');
    // ONLY the Asia zoom's cards seat (n225 · kospi · hsi · ssec ·
    // taiex · nifty50 — the S8 pins); pin the SET (the DOM order is
    // the map's own layout).
    expect(zoom!.querySelectorAll('.wm-card')).toHaveLength(6);
    const seated = Array.from(zoom!.querySelectorAll('.wm-card')).map((c) => c.getAttribute('data-id'));
    expect([...seated].sort()).toEqual(['hsi', 'kospi', 'n225', 'nifty50', 'ssec', 'taiex']);

    // The China section (§9 item 1): the seven China cards.
    const china = document.querySelector('[data-asia-section="china"]')!;
    expect(china.querySelector('h2')?.textContent).toBe('China');
    expect(china.querySelectorAll('[data-asia-card]')).toHaveLength(ASIA_CHINA_IDS.length);
    expect(china.querySelectorAll('[data-asia-card]')).toHaveLength(7);

    // The Japan section (§9 item 2): two cards.
    const japan = document.querySelector('[data-asia-section="japan"]')!;
    expect(japan.querySelector('h2')?.textContent).toBe('Japan');
    expect(japan.querySelectorAll('[data-asia-card]')).toHaveLength(ASIA_JAPAN_IDS.length);
    expect(japan.querySelectorAll('[data-asia-card]')).toHaveLength(2);

    // The Korea/Taiwan/HK section (§9 item 3): INDEX-ONLY today — NO
    // cards, just the honest index-only note (the markets ride the zoom
    // above; the Korea CPI fill is verified-pending-ingest).
    const krTwHk = document.querySelector('[data-asia-section="korea-taiwan-hk"]')!;
    expect(krTwHk.getAttribute('data-asia-index-only')).not.toBeNull();
    expect(krTwHk.querySelectorAll('[data-asia-card]')).toHaveLength(0);
    expect(krTwHk.querySelector('h2')?.textContent).toBe('Korea · Taiwan · Hong Kong');
    // The honest index-only note speaks.
    expect(krTwHk.textContent).toContain('zoom map above');

    // The India section (§9 item 4): INDEX-ONLY today — same honest note.
    const india = document.querySelector('[data-asia-section="india"]')!;
    expect(india.getAttribute('data-asia-index-only')).not.toBeNull();
    expect(india.querySelectorAll('[data-asia-card]')).toHaveLength(0);
    expect(india.querySelector('h2')?.textContent).toBe('India');
    expect(india.textContent).toContain('zoom map above');

    // The Pacific NZ section (§9 item 5): two cards.
    const nz = document.querySelector('[data-asia-section="pacific-nz"]')!;
    expect(nz.querySelector('h2')?.textContent).toBe('Pacific — New Zealand');
    expect(nz.querySelectorAll('[data-asia-card]')).toHaveLength(ASIA_PACIFIC_NZ_IDS.length);
    expect(nz.querySelectorAll('[data-asia-card]')).toHaveLength(2);

    // The §21 trio per card — the value render (the DISPLAY registry's
    // own joins), the 10-year position (the band word, fail-closed when
    // no percentile), and the freshness (asOf + the status word when
    // the reading is not normal). Spot checks a visitor would see.
    const pmi = china.querySelector('[data-asia-card="china-pmi"]')!;
    expect(pmi.textContent).toContain('Chinese factory activity');
    expect(pmi.querySelector('[data-asia-value]')?.textContent).toBe('49.5 index');
    expect(pmi.textContent).toContain('low · bottom 15%');
    expect(pmi.querySelector('[data-asia-status-word]')?.textContent).toBe('Needs attention');
    expect(pmi.textContent).toContain('Oct 31, 2026');

    // The percent unit binds tight (china-cpi).
    const cpi = china.querySelector('[data-asia-card="china-cpi"]')!;
    expect(cpi.querySelector('[data-asia-value]')?.textContent).toBe('0.4%');
    expect(cpi.textContent).toContain('low · bottom 5%');
    // A context reading is normal for a context-only id — no status word.
    expect(cpi.querySelector('[data-asia-status-word]')).toBeNull();

    // The tonnes unit suffixes with a space AND applies the scale
    // (china-steel-output: raw 7359 × scale 1e-2 → 73.6 m tonnes — the
    // ONE Asia id beyond Europe's three-unit lean render).
    const steel = china.querySelector('[data-asia-card="china-steel-output"]')!;
    expect(steel.querySelector('[data-asia-value]')?.textContent).toBe('73.6 m tonnes');

    // The Japan section: jgb-10y (percent) + boj-rate (percent).
    const jgb = japan.querySelector('[data-asia-card="jgb-10y"]')!;
    expect(jgb.querySelector('[data-asia-value]')?.textContent).toBe('1.07%');
    expect(jgb.textContent).toContain('typical · the middle');
    const boj = japan.querySelector('[data-asia-card="boj-rate"]')!;
    expect(boj.querySelector('[data-asia-value]')?.textContent).toBe('0.25%');
    expect(boj.textContent).toContain('low · bottom 18%');

    // The whole registry surface: 11 cards in placement order, zero
    // unrendered ids (the full card-render audit vs the placement table).
    expect(document.querySelectorAll('[data-asia-card]')).toHaveLength(11);
    const renderedIds = [...document.querySelectorAll('[data-asia-card]')].map((el) => el.getAttribute('data-asia-card'));
    expect(renderedIds).toEqual([...ASIA_CHINA_IDS, ...ASIA_JAPAN_IDS, ...ASIA_PACIFIC_NZ_IDS] as string[]);
    expect(renderedIds).toEqual(ASIA_CARD_IDS as string[]);

    // The cross-links strip (§9): usdcny · usdjpy → /currencies +
    // sge-gold → /gold. Each is a 44px touch target (spec §18 D-48).
    const crossLinks = document.querySelector('[data-asia-cross-links]')!;
    expect(crossLinks.querySelector('h2')?.textContent).toBe('Currency pairs and gold that move with Asia');
    const links = crossLinks.querySelectorAll('[data-asia-cross-link]');
    expect(links).toHaveLength(3);
    expect([...links].map((a) => a.getAttribute('data-asia-cross-link'))).toEqual(['usdcny', 'usdjpy', 'sge-gold']);
    // The first two → /currencies; the third (sge-gold) → /gold.
    expect(links[0]!.getAttribute('href')).toBe('/currencies');
    expect(links[1]!.getAttribute('href')).toBe('/currencies');
    expect(links[2]!.getAttribute('href')).toBe('/gold');
    for (const link of links) {
      expect(link.tagName).toBe('A');
      // The 44px touch target (spec §18 D-48).
      expect(link.className).toContain('min-h-[44px]');
    }
    expect(links[0]!.textContent).toContain('See pairs');
    expect(links[1]!.textContent).toContain('See pairs');
    expect(links[2]!.textContent).toContain('See gold');
    // A click on the first navigates to /currencies.
    fireEvent.click(links[0]!);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/currencies');
    });

    // The In-build chip is RETIRED AND no "in build" claim remains —
    // the page's 11 placed cards are complete and verified.
    expect(document.body.textContent).not.toContain('In build');
  });

  it('the fail-closed path: an absent reading renders the unavailable word, never a guess', async () => {
    atRoute('/asia-pacific');
    // oecd-cli-cn is honestly absent (a licence-hidden id) — the
    // projection reports it in absentIds and the card speaks the word.
    const fixture = asiaProjectionFixture();
    const readings = fixture.readings.filter((r) => (r.id as string) !== 'oecd-cli-cn');
    stubFeeds({
      projection: () =>
        jsonResponse({
          ...fixture,
          readings,
          absentIds: ['oecd-cli-cn'],
        }),
    });
    render(<AsiaPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-asia-card="oecd-cli-cn"]')).not.toBeNull();
    });
    const cli = document.querySelector('[data-asia-card="oecd-cli-cn"]')!;
    expect(cli.getAttribute('data-asia-status')).toBe('absent');
    expect(cli.textContent).toContain('Cannot read yet');
    expect(cli.querySelector('[data-asia-value]')).toBeNull();
    // The 11 cards still render (the absent one speaks the word).
    expect(document.querySelectorAll('[data-asia-card]')).toHaveLength(11);
    // The absent note speaks (the projection's own honest report).
    expect(document.body.textContent).toContain('1 of this page’s readings are not published in this mode.');
  });

  it('the fail-closed path: a dead projection with no cache renders the honest error state + the retry', async () => {
    atRoute('/asia-pacific');
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<AsiaPage />);
    await waitFor(() => {
      expect(screen.getByText('The Asia & Pacific page is unavailable right now')).toBeTruthy();
    });
    expect(screen.getByText('Try again')).toBeTruthy();
    // Nothing is faked — no cards, no cross-links.
    expect(document.querySelectorAll('[data-asia-card]').length).toBe(0);
    expect(document.querySelector('[data-asia-cross-links]')).toBeNull();
    // The zoom stays (its own feed is alive).
    expect(document.querySelector('[data-region-zoom="asia"] .wm-card')).not.toBeNull();
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    atRoute('/asia-pacific');
    stubFeeds();
    render(<AsiaPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-asia-card]').length).toBe(11);
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
        if (url.includes('/api/insights/markets')) return jsonResponse(boardFixture());
        if (url.includes('/assets/map/')) return new Response('not found', { status: 404 });
        return jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503);
      }),
    );
    render(<AsiaPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-asia-card]').length).toBe(11);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    expect(document.querySelector('[data-asia-cached]')).not.toBeNull();
  });

  it('the fa/RTL rendering: the Persian title + the Persian China section + the Persian card name + the Persian value join', async () => {
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
    atRoute('/asia-pacific');
    stubFeeds();
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <AsiaPage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-asia-section="china"]')).not.toBeNull();
      });
      // The page title + the China section heading in the corpus's Persian.
      expect(screen.getByRole('heading', { level: 1, name: 'آسیا و اقیانوسیه' })).toBeTruthy();
      expect(document.querySelector('[data-asia-section="china"] h2')?.textContent).toBe('چین');
      // The card name + the fa value join (percent binds tight: ۰٫۴٪).
      const cpi = document.querySelector('[data-asia-card="china-cpi"]')!;
      expect(cpi.textContent).toContain('تورم چین (سالانه)');
      expect(cpi.querySelector('[data-asia-value]')?.textContent).toBe('۰٫۴٪');
      // The tonnes unit in Persian (the suffix-with-space join + the
      // scale: ۷۳٫۶ میلیون تن).
      const steel = document.querySelector('[data-asia-card="china-steel-output"]')!;
      expect(steel.querySelector('[data-asia-value]')?.textContent).toBe('۷۳٫۶ میلیون تن');
      // The status word in Persian (china-pmi is a warning reading).
      const pmi = document.querySelector('[data-asia-card="china-pmi"]')!;
      expect(pmi.querySelector('[data-asia-status-word]')?.textContent).toBe('نیازمند توجه');
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
