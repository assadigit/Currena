/**
 * @vitest-environment jsdom
 *
 * GlobalPage.characterization.test.tsx (S3, 2026-11-08) — the landing
 * page's DOM-level characterization suite. What is pinned:
 *
 *   - the honest load state (the loading line, never a blank screen);
 *   - the D-21 board: all ten tiles render with a verdict or the
 *     explicit unread state — the Gold Balance outlook + counts, the
 *     five gauge verdict words + why-lines, the FX Lights signal, the
 *     World Markets verdict + counts, the D-22 ribbon values, the D-25
 *     dedollar context;
 *   - the D-23 chips row links ALL SEVEN destinations (real hrefs);
 *   - the D-24 narrator line stays absent when the narrative feed 404s
 *     (spec §11: nothing breaks);
 *   - the fail-closed path: a dead markets board renders the honest
 *     unread tile, never a guess.
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { FxSnapshot, IndicatorReading, MarketsSnapshot, PageProjection } from '@currena/core';
import { FxSnapshotSchema, MarketsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { GlobalPage } from './GlobalPage';
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

/** The Global projection: a handful of the 52 mirror inputs, enough to
 *  move the tiles — two borrowing-costs warnings, a firing gold lane,
 *  the ribbon trio and the dedollar pair. */
function projectionFixture(): PageProjection {
  const readings: IndicatorReading[] = [
    // Two borrowing-costs voters in warning over the gauge's full
    // ten-member base → 2 of 10 → step 2 (Cautious).
    reading('real-yield-10y', { value: 2.1, status: 'warning', change30d: -1.0 }),
    reading('us10y', { value: 4.3, status: 'warning', change30d: -1.0 }),
    reading('yield-curve-10y2y', { value: 0.2 }),
    reading('yield-curve-10y3m', { value: -0.1 }),
    reading('fed-expectations', { value: 0.3 }),
    reading('real-yield-5y', { value: 1.9 }),
    reading('us30y', { value: 4.5 }),
    reading('fed-target', { value: 4.0 }),
    reading('ecb-dfr', { value: 2.0 }),
    reading('govt-interest-revenue', { value: 0.35 }),
    // The ribbon trio (live-merged values).
    reading('gold-usd', { value: 4072.1, change30d: -2.5, percentile10y: 0.91 }),
    reading('brent', { value: 107.35, change7d: 1.2 }),
    reading('btc-usd', { value: 98432, change7d: -3.4 }),
    // The dedollar pair.
    reading('usd-reserve-share', { value: 57.4 }),
    reading('nyfed-custody', { value: 3210, change30d: -1.2 }),
  ];
  return {
    page: 'global',
    generatedAt: '2026-11-07T20:11:07.445Z',
    pricesAsOf: '2026-11-08T00:13:17.925Z',
    displayMode: 'public',
    readings,
    absentIds: [],
    boards: ['markets', 'fx'],
  };
}

function marketsFixture(): MarketsSnapshot {
  const market = (id: 'dax' | 'sp500', fromHigh: number): MarketsSnapshot['markets'][number] => ({
    id,
    asOf: '2026-11-07',
    close: 19624,
    chg1d: 0.5,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: 3,
    high52w: 20000,
    low52w: 17000,
    fromHigh,
    rangePos: 87,
    trend: 'flat',
    status: fromHigh <= -20 ? 'bear' : fromHigh <= -10 ? 'correction' : 'normal',
    source: 'eodhd',
    stale: false,
    weekly: [
      [0, 19000],
      [7, 19100],
    ],
  });
  return {
    v: 1,
    generatedAt: '2026-11-07T23:31:00Z',
    markets: [market('dax', -12), market('sp500', -25)],
    summary: { count: 2, roseToday: 1, nAttention: 1, nUnusual: 1, signal: 'attention', worstGroup: 'europe' },
  };
}

function fxFixture(): FxSnapshot {
  const rule = (id: FxSnapshot['rules'][number]['id'], outcome: FxSnapshot['rules'][number]['outcome']): FxSnapshot['rules'][number] => ({
    id,
    outcome,
    counted: outcome === 'warning',
    numbers: {},
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
    chart: { expect: 'together', series: [] },
  });
  return {
    v: 1,
    generatedAt: '2026-11-07T17:01:00Z',
    dollarMeasure: {
      asOf: '2026-11-06',
      value: 100.25,
      chg: { d1: 0.1, m1: -0.5, m3: 1.2, y1: 2.0 },
      weekly: [
        [0, 100],
        [7, 100.5],
      ],
    },
    pairs: [],
    rules: [
      rule('r1_risk_mood', 'warning'),
      rule('r2_carry_trade', 'supportive'),
      rule('r3_dollar_strength', 'watch'),
      rule('r4_money_hiding', 'quiet'),
      rule('r5_china_link', 'context'),
      rule('r6_europe_worry', 'quiet'),
      rule('r7_dollar_or_euro', 'quiet'),
    ],
    summary: { signal: 'attention', countedWarnings: 1, headlineRule: 'r1_risk_mood' },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFound(): Response {
  return jsonResponse({ error: { code: 'narrative_not_ready', message: 'not ready' } }, 404);
}

/** A visible narrative doc (the :50 artefact's served shape). */
function narrativeDocFixture(visible = true): Record<string, unknown> {
  return {
    promptVersion: 9,
    model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    generatedAt: '2026-11-08T01:50:18.070Z',
    dataAsOf: '2026-11-07',
    overall: {
      stateHash: 'abc123',
      en: 'Today’s verdicts: Global reads Stressed (11 of 37 in warning). This page explains the data and is not financial advice.',
      fa: 'حکم‌های امروز صفحه: جهانی در وضعیت فشار است. این صفحه داده‌ها را ساده می‌کند و توصیهٔ مالی نیست.',
      source: 'template',
      generatedAt: new Date().toISOString(), // same-day → the “today” stamp
    },
    sections: {},
    visible,
  };
}

/** Route the stubbed fetch by URL — every feed the page asks for. */
function stubFeeds(overrides: { markets?: () => Response; fx?: () => Response; narrative?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/global')) return jsonResponse(projectionFixture());
      if (url.includes('/api/insights/markets')) return (overrides.markets ?? (() => jsonResponse(marketsFixture())))();
      if (url.includes('/api/insights/fx')) return (overrides.fx ?? (() => jsonResponse(fxFixture())))();
      if (url.includes('/api/insights/narrative')) return (overrides.narrative ?? notFound)();
      return notFound();
    }),
  );
}

beforeEach(() => {
  // The projection client's module-level promise cache must reset between
  // tests (the S2 test's own discipline) — a cached success would mask a
  // later test's 503 stub.
  clearProjectionCacheForTests();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The board
 * ------------------------------------------------------------------ */

describe('GlobalPage', () => {
  it('fixture sanity: every payload satisfies its core contract', () => {
    expect(() => PageProjectionSchema.parse(projectionFixture())).not.toThrow();
    expect(() => MarketsSnapshotSchema.parse(marketsFixture())).not.toThrow();
    expect(() => FxSnapshotSchema.parse(fxFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    const { container } = render(<GlobalPage />);
    // The loading line + the loader dots, never a blank screen.
    expect(container.textContent).toContain('Reading the world');
  });

  it('renders all ten D-21 tiles with verdicts from the same engines', async () => {
    stubFeeds();
    render(<GlobalPage />);

    // Ten tiles in the board (data-tile attributes).
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });

    // Tile ① — the Gold Balance: the firing borrowing-costs lane (2
    // tailwind voters) + gold's own −2.5% speed → Bullish, with the
    // for/against counts.
    expect(screen.getAllByText('Bullish').length).toBeGreaterThan(0);
    expect(document.querySelector('[data-tile="gold-balance"]')?.textContent).toContain('1 for · 0 against');

    // Tiles ②–⑥ — the five gauge verdicts: borrowing-costs is Cautious
    // (2 of 10 voters need attention); the untouched gauges read Stable.
    const borrowing = document.querySelector('[data-tile="gauge-borrowing-costs"]');
    expect(borrowing?.textContent).toContain('Cautious');
    expect(borrowing?.textContent).toContain('2 of 10 voters need attention');
    expect(document.querySelector('[data-tile="gauge-prices-heat"]')?.textContent).toContain('Stable');
    expect(document.querySelector('[data-tile="gauge-market-stress"]')?.textContent).toContain('Cannot read yet');

    // Tile ⑦ — the FX Lights: the attention signal + the active count.
    const fx = document.querySelector('[data-tile="fx-lights"]');
    expect(fx?.textContent).toContain('Needs attention');
    expect(fx?.textContent).toContain('3 of 7 rules active');

    // Tile ⑧ — the World Markets: the attention-tier verdict word + the
    // RAW correction/bear counts.
    const markets = document.querySelector('[data-tile="world-markets"]');
    expect(markets?.textContent).toContain('Mixed');
    expect(markets?.textContent).toContain('2 of 2 in correction');
    expect(markets?.textContent).toContain('1 in a bear market');

    // Tile ⑨ — the ribbon: the three live values with the 7-day changes.
    const ribbon = document.querySelector('[data-tile="prices-ribbon"]');
    expect(ribbon?.textContent).toContain('Gold');
    expect(ribbon?.textContent).toContain('Brent');
    expect(ribbon?.textContent).toContain('Bitcoin');
    expect(ribbon?.textContent).toContain('4,072');
    expect(ribbon?.textContent).toContain('107.35');
    expect(ribbon?.textContent).toContain('98,432');

    // Tile ⑩ — the dedollar context: the level + the direction + the
    // display-only note.
    const dedollar = document.querySelector('[data-tile="dedollar"]');
    expect(dedollar?.textContent).toContain('57.4%');
    expect(dedollar?.textContent).toContain('−1.2%');
    expect(dedollar?.textContent).toContain('Context only');

    // The data-as-of line carries the daily snapshot + the live clock.
    expect(document.body.textContent).toContain('Data as of');
    expect(document.body.textContent).toContain('Live prices as of');
  });

  it('the D-23 chips row links all seven destinations (real hrefs, no Gold)', async () => {
    stubFeeds();
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-chip]').length).toBe(7);
    });
    const hrefs = Array.from(document.querySelectorAll('[data-chip]')).map((el) => el.getAttribute('href'));
    expect(hrefs).toEqual(['/usa', '/europe', '/asia-pacific', '/australia', '/world-markets', '/commodities', '/currencies']);
  });

  it('the D-24 narrator line stays absent when the narrative feed 404s (nothing breaks)', async () => {
    stubFeeds();
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });
    expect(document.querySelector('[data-narrator-line]')).toBeNull();
  });

  it('a dead markets board renders the honest unread tile, never a guess', async () => {
    stubFeeds({ markets: () => jsonResponse({ error: { code: 'kv_failure', message: 'down' } }, 503) });
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-tile="unread"][data-feed="world-markets"]')).not.toBeNull();
    });
    expect(document.querySelector('[data-tile="unread"][data-feed="world-markets"]')?.textContent).toContain('Cannot read yet');
  });

  it('a failed projection with no cache renders the honest error state with a retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'pages_unavailable', message: 'down' } }, 503)),
    );
    render(<GlobalPage />);
    await waitFor(() => {
      expect(screen.getByText('The world scan is unavailable right now')).toBeTruthy();
    });
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  /* ---------------------------------------------------------------- *
   * S4 (2026-11-08) — the narrator wiring + the honesty surfaces
   * ---------------------------------------------------------------- */

  it('a visible narrative doc renders the D-24 line VERBATIM with its Updated stamp (same-day → today)', async () => {
    stubFeeds({ narrative: () => jsonResponse(narrativeDocFixture(true)) });
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-narrator-line]')).not.toBeNull();
    });
    const line = document.querySelector('[data-narrator-line]')!;
    // The narrator's OWN TEXT verbatim — the trailing not-advice sentence
    // included (BD-S4b: never edited, never suppressed).
    expect(line.textContent).toContain('This page explains the data and is not financial advice.');
    // The freshness stamp rides the unit's own generatedAt.
    expect(line.textContent).toContain('Updated today');
    expect(line.getAttribute('data-narrator-source')).toBe('template');
  });

  it('a NON-visible doc without the preview marker renders NO narrator line (the staged-rollout gate)', async () => {
    stubFeeds({ narrative: () => jsonResponse(narrativeDocFixture(false)) });
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });
    expect(document.querySelector('[data-narrator-line]')).toBeNull();
  });

  it('the absentIds honesty line renders when the projection reports absent readings', async () => {
    const projection = projectionFixture();
    projection.absentIds = ['wgc-etf-holdings', 'official-gold-demand'];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/pages/global')) return jsonResponse(projection);
        if (url.includes('/api/insights/markets')) return jsonResponse(marketsFixture());
        if (url.includes('/api/insights/fx')) return jsonResponse(fxFixture());
        return notFound();
      }),
    );
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-absent-note]')).not.toBeNull();
    });
    expect(document.querySelector('[data-absent-note]')?.textContent).toContain('2');
    expect(document.querySelector('[data-absent-note]')?.textContent).toContain('not published');
  });

  it('a failed refresh with a cached copy keeps the board and shows the last-good label', async () => {
    // First visit: a good projection lands in localStorage.
    stubFeeds();
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page).
    clearProjectionCacheForTests();
    // Second visit: the feed dies, the cached projection paints — labelled.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/pages/global')) return jsonResponse({ error: { code: 'pages_unavailable', message: 'down' } }, 503);
        if (url.includes('/api/insights/markets')) return jsonResponse(marketsFixture());
        if (url.includes('/api/insights/fx')) return jsonResponse(fxFixture());
        return notFound();
      }),
    );
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
  });

  it('a failed BOARD refresh keeps the cached tile verdicts, labelled (M-17) — never the unread collapse while a good copy sits in the cache', async () => {
    // First visit: good boards land in localStorage.
    stubFeeds();
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });
    cleanup();
    vi.unstubAllGlobals();
    clearProjectionCacheForTests();
    // Second visit: BOTH board feeds die while the projection stays live —
    // the S4 mobile/empty-state pass found the old effect REPLACING the
    // cached copies with `empty` (the unread collapse); the M-17 fix keeps
    // them on screen, now LABELLED with their own stored dates (never
    // unlabelled cached data).
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/pages/global')) return jsonResponse(projectionFixture());
        if (url.includes('/api/insights/markets')) return jsonResponse({ error: { code: 'markets_not_ready', message: 'down' } }, 503);
        if (url.includes('/api/insights/fx')) return jsonResponse({ error: { code: 'fx_not_ready', message: 'down' } }, 503);
        return notFound();
      }),
    );
    render(<GlobalPage />);
    await waitFor(() => {
      // The tiles render VERDICTS (the cached copies), not the unread
      // collapse: world-markets keeps 'Mixed', fx keeps 'Needs attention'.
      const markets = document.querySelector('[data-tile="world-markets"]');
      expect(markets).not.toBeNull();
      expect(markets?.textContent).toContain('Mixed');
      expect(markets?.textContent).toContain('2 of 2 in correction');
    });
    const fx = document.querySelector('[data-tile="fx-lights"]');
    expect(fx?.textContent).toContain('Needs attention');
    expect(document.querySelector('[data-tile="unread"][data-feed="world-markets"]')).toBeNull();
    expect(document.querySelector('[data-tile="unread"][data-feed="fx"]')).toBeNull();
    // Both cached tiles carry the last-good caption with the board's own
    // stored date (the fixtures' 2026-11-07T23:31 / 17:01 generations).
    await waitFor(() => {
      expect(document.querySelectorAll('[data-cached-note]').length).toBe(2);
    });
    expect(document.querySelector('[data-tile="world-markets"] [data-cached-note]')?.textContent).toContain('Nov 7, 2026');
    expect(document.querySelector('[data-tile="fx-lights"] [data-cached-note]')?.textContent).toContain('Nov 7, 2026');
    // A FRESH feed paints no caption (the label rides the cached copies
    // only — a fresh render was already proven by the board test above).
  });

  it('the ribbon carries VISIBLE window tags — the day change when change1d rides the reading, the 7-day otherwise', async () => {
    const projection = projectionFixture();
    // gold-usd gains the S4 day change (the live entry's change1d);
    // brent/btc stay on their 7-day changes (the pre-deploy fallback).
    projection.readings = projection.readings.map((r) =>
      r.id === 'gold-usd' ? { ...r, change1d: 0.42 } : r,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/pages/global')) return jsonResponse(projection);
        if (url.includes('/api/insights/markets')) return jsonResponse(marketsFixture());
        if (url.includes('/api/insights/fx')) return jsonResponse(fxFixture());
        return notFound();
      }),
    );
    render(<GlobalPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-global-board] [data-tile]').length).toBe(10);
    });
    const gold = document.querySelector('[data-ribbon-asset="gold-usd"]')!;
    expect(gold.textContent).toContain('+0.4%');
    expect(gold.textContent).toContain('1d');
    expect(gold.textContent).toContain('over the past day');
    const brent = document.querySelector('[data-ribbon-asset="brent"]')!;
    expect(brent.textContent).toContain('7d');
    expect(brent.textContent).toContain('+1.2%');
    expect(brent.textContent).toContain('over the past 7 days');
  });
});
