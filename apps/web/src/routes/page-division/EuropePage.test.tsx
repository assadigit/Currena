/**
 * @vitest-environment jsdom
 *
 * EuropePage.characterization.test.tsx (S12 + S13, 2026-11-09) — the Europe
 * page's DOM-level characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the
 *     data-as-of line (the In-build chip RETIRED at S13's gate pass —
 *     BD-S12b's completion; the §15 fills stay verified-pending-ingest,
 *     a separate engine-layer change, and their absence does not make
 *     the 8 placed cards "in build");
 *   - the S8 zoom section stays on top through EVERY state (the board
 *     feed is its own — a slow or dead projection never takes the map
 *     away): data-region-zoom="europe" + the zoomed viewBox + ONLY the
 *     four Europe cards (ftse · cac · dax · stoxx50 — the S8 pins,
 *     re-proven under the new page);
 *   - the EU section (D-33, §8 item 1): the six euro-area cards in
 *     placement order (ecb-dfr · euro-hicp · euro-aaa-10y · bund-10y ·
 *     btp-bund-spread · oecd-cli-de);
 *   - the non-EU United Kingdom section (D-33, §8 item 2): gilt-10y ·
 *     boe-rate, listed APART from the EU;
 *   - every card carries the §21 trio (value · 10-year position ·
 *     freshness), the values rendered through the DISPLAY registry's own
 *     joins (percent binds tight, points + index suffix with a space —
 *     pinned output-for-output against formatReadingValue by
 *     europe-tiles.test.ts);
 *   - the cross-links strip (§8 item 4): eur-usd · usdchf · usdtry →
 *     /currencies, each a 44px touch target (spec §18 D-48 — the S11
 *     polish inherited on Europe);
 *   - the honest fail-closed paths: an absent reading renders the
 *     unavailable word; a dead projection with no cache renders the
 *     error state + retry;
 *   - the M-17 last-good path: a failed refresh after a good load keeps
 *     the page on screen, labelled;
 *   - the fa/RTL rendering (the Persian title + the Persian EU section
 *     heading + the Persian card name + the Persian value joins).
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
import { EuropePage } from './EuropePage';
import { EUROPE_EU_IDS, EUROPE_UK_IDS, EUROPE_CARD_IDS } from './europe-tiles';
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

/** The eight Europe cards' displayed values — real-world magnitudes so
 *  the §21 trio asserts the DISPLAY registry's own joins (percent binds
 *  tight; points + index suffix with a space). The percentile10y values
 *  choose clean band phrases (high/low/typical) covering every branch. */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  'ecb-dfr': { value: 2.5, percentile10y: 0.76, asOf: '2026-11-08' }, // typical
  'euro-hicp': { value: 4.0, percentile10y: 0.9, status: 'warning', asOf: '2026-10-01' }, // high · top 10%
  'euro-aaa-10y': { value: 3.29, percentile10y: 0.98, status: 'context', asOf: '2026-11-05' }, // high · top 2%
  'bund-10y': { value: 3.47, percentile10y: 0.95, status: 'context', asOf: '2026-09-01' }, // high · top 5%
  'btp-bund-spread': { value: 0.8, percentile10y: 0.04, status: 'stale', asOf: '2026-08-01' }, // low · bottom 4%
  'oecd-cli-de': { value: 101.0, percentile10y: 0.78, status: 'context', asOf: '2026-09-01' }, // typical
  'gilt-10y': { value: 5.24, percentile10y: 0.92, status: 'context', asOf: '2026-09-01' }, // high · top 8%
  'boe-rate': { value: 4.0, percentile10y: 0.71, status: 'context', asOf: '2026-11-08' }, // typical
};

/** The Europe projection: the placement's own reading order (8 homes),
 *  every card present in public mode (absentIds empty — the live §21
 *  diff's own honest report). */
function europeProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = pageReadingIds('europe').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
  return {
    page: 'europe',
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

/** Route the stubbed fetch: the Europe projection + the board feed (the
 *  zoom's own) + the map's static assets (404 — the land never paints
 *  in jsdom; the cards are the DOM under test). */
function stubFeeds(overrides: { projection?: () => Response; board?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/europe')) return (overrides.projection ?? (() => jsonResponse(europeProjectionFixture())))();
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

describe('EuropePage', () => {
  it('fixture sanity: both payloads satisfy their contracts', () => {
    expect(() => PageProjectionSchema.parse(europeProjectionFixture())).not.toThrow();
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives — and the zoom stays on top', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    atRoute('/europe');
    const { container } = render(<EuropePage />);
    expect(container.textContent).toContain('Reading the European numbers');
    // The zoom's own feed was never stubbed alive here (404s) — the
    // section itself still renders (its honest loading/empty shapes).
    expect(document.querySelector('[data-region-zoom="europe"]')).not.toBeNull();
  });

  it('renders the shell + the zoom + the EU + UK sections + the cross-links over the real derivations', async () => {
    atRoute('/europe');
    stubFeeds();
    render(<EuropePage />);
    await waitFor(() => {
      expect(document.querySelector('[data-europe-section="eu"]')).not.toBeNull();
    });

    // The shell: title + purpose + the data-as-of line. The In-build
    // chip is RETIRED (S13's gate pass — BD-S12b's completion); it must
    // NOT render on the Europe page anymore.
    expect(screen.getByText('Europe')).toBeTruthy();
    expect(screen.queryByText('In build')).toBeNull();
    expect(document.body.textContent).toContain('Data as of Nov 8, 2026');

    // The S8 zoom section stays on top of the S12 layers.
    const zoom = document.querySelector('[data-region-zoom="europe"]');
    expect(zoom).not.toBeNull();
    expect(zoom!.querySelector('.wm')?.getAttribute('data-wm-zoom')).toBe('europe');
    // ONLY the Europe zoom's cards seat (ftse · cac · dax · stoxx50 —
    // the S8 pins); pin the SET (the DOM order is the map's own layout).
    expect(zoom!.querySelectorAll('.wm-card')).toHaveLength(4);
    const seated = Array.from(zoom!.querySelectorAll('.wm-card')).map((c) => c.getAttribute('data-id'));
    expect([...seated].sort()).toEqual(['cac', 'dax', 'ftse', 'stoxx50']);

    // The EU section (D-33, §8 item 1): the six euro-area cards.
    const eu = document.querySelector('[data-europe-section="eu"]')!;
    expect(eu.querySelector('h2')?.textContent).toBe('European Union');
    expect(eu.querySelectorAll('[data-europe-card]')).toHaveLength(EUROPE_EU_IDS.length);
    expect(eu.querySelectorAll('[data-europe-card]')).toHaveLength(6);

    // The non-EU UK section (D-33, §8 item 2): listed APART, two cards.
    const uk = document.querySelector('[data-europe-section="uk"]')!;
    expect(uk.querySelector('h2')?.textContent).toBe('United Kingdom');
    expect(uk.querySelectorAll('[data-europe-card]')).toHaveLength(EUROPE_UK_IDS.length);
    expect(uk.querySelectorAll('[data-europe-card]')).toHaveLength(2);

    // The §21 trio per card — the value render (the DISPLAY registry's
    // own joins), the 10-year position (the band word, fail-closed when
    // no percentile), and the freshness (asOf + the status word when
    // the reading is not normal). Spot checks a visitor would see.
    const dfr = eu.querySelector('[data-europe-card="ecb-dfr"]')!;
    expect(dfr.textContent).toContain('The euro area');
    expect(dfr.querySelector('[data-europe-value]')?.textContent).toBe('2.50%');
    expect(dfr.textContent).toContain('typical · the middle');
    expect(dfr.textContent).toContain('Data as of Nov 8, 2026');
    // A normal reading carries no status word.
    expect(dfr.querySelector('[data-europe-status-word]')).toBeNull();

    const hicp = eu.querySelector('[data-europe-card="euro-hicp"]')!;
    expect(hicp.querySelector('[data-europe-value]')?.textContent).toBe('4.0%');
    expect(hicp.textContent).toContain('high · top 10%');
    expect(hicp.querySelector('[data-europe-status-word]')?.textContent).toBe('Needs attention');
    expect(hicp.textContent).toContain('Oct 1, 2026');

    // The points unit suffixes with a space (the DISPLAY registry's
    // own join — the btp-bund-spread is a spread in points). The stale
    // status speaks the engine's own word (the §21 freshness leg).
    const btp = eu.querySelector('[data-europe-card="btp-bund-spread"]')!;
    expect(btp.querySelector('[data-europe-value]')?.textContent).toBe('0.80 pts');
    expect(btp.textContent).toContain('low · bottom 4%');
    expect(btp.querySelector('[data-europe-status-word]')?.textContent).toBe('Stale');
    expect(btp.getAttribute('data-europe-status')).toBe('stale');
    expect(btp.textContent).toContain('Aug 1, 2026');

    // The index unit suffixes with a space (oecd-cli-de).
    const cli = eu.querySelector('[data-europe-card="oecd-cli-de"]')!;
    expect(cli.querySelector('[data-europe-value]')?.textContent).toBe('101.0 index');
    // A context reading is normal for a context-only id — no status word.
    expect(cli.querySelector('[data-europe-status-word]')).toBeNull();

    // The UK section: the gilt (percent) + the boe-rate (percent).
    const gilt = uk.querySelector('[data-europe-card="gilt-10y"]')!;
    expect(gilt.querySelector('[data-europe-value]')?.textContent).toBe('5.24%');
    expect(gilt.textContent).toContain('high · top 8%');
    const boe = uk.querySelector('[data-europe-card="boe-rate"]')!;
    expect(boe.querySelector('[data-europe-value]')?.textContent).toBe('4.00%');
    expect(boe.textContent).toContain('typical · the middle');

    // The whole registry surface: 8 cards in placement order, zero
    // unrendered ids (the full card-render audit vs the placement table).
    expect(document.querySelectorAll('[data-europe-card]')).toHaveLength(8);
    const renderedIds = [...document.querySelectorAll('[data-europe-card]')].map((el) => el.getAttribute('data-europe-card'));
    expect(renderedIds).toEqual([...EUROPE_EU_IDS, ...EUROPE_UK_IDS] as string[]);
    expect(renderedIds).toEqual(EUROPE_CARD_IDS as string[]);

    // The cross-links strip (§8 item 4): eur-usd · usdchf · usdtry →
    // /currencies. Each is a 44px touch target (spec §18 D-48 — the S11
    // polish inherited on Europe).
    const crossLinks = document.querySelector('[data-europe-cross-links]')!;
    expect(crossLinks.querySelector('h2')?.textContent).toBe('Currency pairs that move with Europe');
    const links = crossLinks.querySelectorAll('[data-europe-cross-link]');
    expect(links).toHaveLength(3);
    expect([...links].map((a) => a.getAttribute('data-europe-cross-link'))).toEqual(['eur-usd', 'usdchf', 'usdtry']);
    for (const link of links) {
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBe('/currencies');
      // The 44px touch target (spec §18 D-48).
      expect(link.className).toContain('min-h-[44px]');
      expect(link.textContent).toContain('See pairs');
    }
    // A click navigates to /currencies (their detail cards live there).
    fireEvent.click(links[0]!);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/currencies');
    });

    // The In-build chip is RETIRED AND no "in build" claim remains —
    // the page's 8 placed cards are complete and verified.
    expect(document.body.textContent).not.toContain('In build');
  });

  it('the fail-closed path: an absent reading renders the unavailable word, never a guess', async () => {
    atRoute('/europe');
    // oecd-cli-de is honestly absent (a licence-hidden id) — the
    // projection reports it in absentIds and the card speaks the word.
    const fixture = europeProjectionFixture();
    const readings = fixture.readings.filter((r) => (r.id as string) !== 'oecd-cli-de');
    stubFeeds({
      projection: () =>
        jsonResponse({
          ...fixture,
          readings,
          absentIds: ['oecd-cli-de'],
        }),
    });
    render(<EuropePage />);
    await waitFor(() => {
      expect(document.querySelector('[data-europe-card="oecd-cli-de"]')).not.toBeNull();
    });
    const cli = document.querySelector('[data-europe-card="oecd-cli-de"]')!;
    expect(cli.getAttribute('data-europe-status')).toBe('absent');
    expect(cli.textContent).toContain('Cannot read yet');
    expect(cli.querySelector('[data-europe-value]')).toBeNull();
    // The 8 cards still render (the absent one speaks the word).
    expect(document.querySelectorAll('[data-europe-card]')).toHaveLength(8);
    // The absent note speaks (the projection's own honest report).
    expect(document.body.textContent).toContain('1 of this page’s readings are not published in this mode.');
  });

  it('the fail-closed path: a dead projection with no cache renders the honest error state + the retry', async () => {
    atRoute('/europe');
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<EuropePage />);
    await waitFor(() => {
      expect(screen.getByText('The Europe page is unavailable right now')).toBeTruthy();
    });
    expect(screen.getByText('Try again')).toBeTruthy();
    // Nothing is faked — no cards, no cross-links.
    expect(document.querySelectorAll('[data-europe-card]').length).toBe(0);
    expect(document.querySelector('[data-europe-cross-links]')).toBeNull();
    // The zoom stays (its own feed is alive).
    expect(document.querySelector('[data-region-zoom="europe"] .wm-card')).not.toBeNull();
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    atRoute('/europe');
    stubFeeds();
    render(<EuropePage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-europe-card]').length).toBe(8);
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
    render(<EuropePage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-europe-card]').length).toBe(8);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    expect(document.querySelector('[data-europe-cached]')).not.toBeNull();
  });

  it('the fa/RTL rendering: the Persian title + the Persian EU section + the Persian card name + the Persian value join', async () => {
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
        <EuropePage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-europe-section="eu"]')).not.toBeNull();
      });
      // The page title + the EU section heading in the corpus's Persian.
      expect(screen.getByText('اروپا')).toBeTruthy();
      expect(document.querySelector('[data-europe-section="eu"] h2')?.textContent).toBe('اتحادیهٔ اروپا');
      // The card name + the fa value join (percent binds tight: ۲٫۵۰٪).
      const dfr = document.querySelector('[data-europe-card="ecb-dfr"]')!;
      expect(dfr.textContent).toContain('نرخ سپردهٔ بانک مرکزی اروپا');
      expect(dfr.querySelector('[data-europe-value]')?.textContent).toBe('۲٫۵۰٪');
      // The points unit in Persian (the suffix-with-space join).
      const btp = document.querySelector('[data-europe-card="btp-bund-spread"]')!;
      expect(btp.querySelector('[data-europe-value]')?.textContent).toBe('۰٫۸۰ واحد درصد');
      expect(btp.querySelector('[data-europe-status-word]')?.textContent).toBe('قدیمی');
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
