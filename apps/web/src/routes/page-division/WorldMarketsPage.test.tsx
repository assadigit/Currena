/**
 * @vitest-environment jsdom
 *
 * WorldMarketsPage.characterization.test.tsx (S7, 2026-11-08) — the World
 * Markets page's DOM-level characterization suite. What is pinned:
 *
 *   - the honest load state (the loading line, never a blank screen);
 *   - the hero: the status summary (the verdict word + the §5.3 measure
 *     label + the RAW below-high line + the stated rule with the
 *     definitions' own thresholds) and the REUSED map module rendering
 *     the board's own rows (the wm root + its callout cards, the pinned
 *     adapter words);
 *   - the region grids: the three groups in registry order, every one of
 *     the 16 indexes rendered with its five lenses + range position +
 *     trend word + status pill — each asserted against the page's own
 *     pure derivations over the same fixture (never hand-counted);
 *   - the world risk & liquidity cards: the 9 placement homes with
 *     value + 10-year position + freshness;
 *   - the map-callout → row scroll wiring (the on-page answer to the
 *     legacy detail panel);
 *   - the fail-closed path: a dead projection renders the honest error
 *     state with the retry, never a guess; a dead board keeps the
 *     section's calm discipline;
 *   - the M-17 last-good path: a failed refresh keeps the cached copy on
 *     screen, labelled.
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { IndicatorReading, MarketsSnapshot, PageProjection } from '@currena/core';
import { MarketsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { MARKETS } from '@currena/insights/markets/definitions';
import { summarizeMarkets } from '@currena/insights/markets';
import { WorldMarketsPage } from './WorldMarketsPage';
import { worldMarketsRows, worldMarketsStatus } from './world-markets-tiles';
import { clearProjectionCacheForTests } from '../../lib/page-division';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

const RISK_IDS = [
  'gpr-index',
  'gpr-threats',
  'gpr-acts',
  'gpr-daily',
  'gpr-russia',
  'gpr-ukraine',
  'gpr-israel',
  'gpr-saudi',
  'global-liquidity',
] as const;

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    status: 'context',
    sourceName: 'fixture',
    updatedAt: '2026-11-07T20:11:07.445Z',
    percentile10y: 0.75,
    ...partial,
  } as IndicatorReading;
}

/** The World Markets projection: the 9 world-risk homes. */
function projectionFixture(): PageProjection {
  return {
    page: 'world-markets',
    generatedAt: '2026-11-07T20:11:07.445Z',
    displayMode: 'public',
    readings: RISK_IDS.map((id, i) =>
      reading(id, { value: id === 'global-liquidity' ? 21.55 : 100 + i * 10 + 0.5, asOf: id === 'gpr-daily' ? '2026-11-02' : '2026-10-01' }),
    ),
    absentIds: [],
    boards: ['markets'],
  };
}

/** A full 16-row board (deterministic distances for the status bands). */
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
  return jsonResponse({ error: { code: 'unknown_page', message: 'not found' } }, 404);
}

/** Route the stubbed fetch by URL — the projection + the board feeds. */
function stubFeeds(overrides: { projection?: () => Response; board?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/world-markets')) return (overrides.projection ?? (() => jsonResponse(projectionFixture())))();
      if (url.includes('/api/insights/markets')) return (overrides.board ?? (() => jsonResponse(boardFixture())))();
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

describe('WorldMarketsPage', () => {
  it('fixture sanity: both payloads satisfy their contracts', () => {
    expect(() => PageProjectionSchema.parse(projectionFixture())).not.toThrow();
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    const { container } = render(<WorldMarketsPage />);
    expect(container.textContent).toContain('Reading the world');
  });

  it('renders the hero: the status summary + the REUSED map (the engines\' own values)', async () => {
    stubFeeds();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-wm-status-box]')).not.toBeNull();
    });

    // The engine's own derivations over the same fixture — never
    // hand-counted (the characterization pins the PIPE, the engine
    // provides the numbers).
    const board = boardFixture();
    const status = worldMarketsStatus(board);

    // The verdict word (the WM_VERDICT_WORD mapping over the engine step)
    // + the §5.3 measure label + the RAW below-high line + the stated
    // rule with the definitions' own thresholds (4 / 8 / 16).
    const box = document.querySelector('[data-wm-status-box]')!;
    expect(box.textContent).toContain(status.signal === 'unusual' ? 'far below their highs' : status.signal === 'attention' ? 'several well below their highs' : 'near their yearly highs');
    expect(box.textContent).toContain(`${status.inCorrection} of 16 indices are at least 10% below`);
    expect(document.querySelector('[data-wm-rule-line]')!.textContent).toContain('4+ of 16');
    expect(document.querySelector('[data-wm-rule-line]')!.textContent).toContain('8+');

    // The REUSED map module renders the board's own rows (the wm root +
    // its callout cards — the same drawing the legacy section shows).
    await waitFor(() => {
      expect(document.querySelector('.wm')).not.toBeNull();
    });
    expect(document.querySelectorAll('.wm-card')).toHaveLength(16);
  });

  it('renders the region grids: 3 groups × the 16 registry indexes, every row with the full metrics', async () => {
    stubFeeds();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-wm-grids]')).not.toBeNull();
    });

    // The groups in registry order, the counts the registry's own.
    const regions = Array.from(document.querySelectorAll('[data-wm-region]'));
    expect(regions.map((r) => r.getAttribute('data-wm-region'))).toEqual(['asia', 'europe', 'americas']);
    expect(regions[0]!.querySelectorAll('[data-wm-row]')).toHaveLength(7);
    expect(regions[1]!.querySelectorAll('[data-wm-row]')).toHaveLength(4);
    expect(regions[2]!.querySelectorAll('[data-wm-row]')).toHaveLength(5);

    // Every row's five lenses + range + trend + status — the page's own
    // pure derivations over the same fixture provide the expected words.
    const board = boardFixture();
    const todayIso = new Date().toISOString().slice(0, 10);
    const rows = worldMarketsRows(board, todayIso);
    const trendWord = { up: 'Up', flat: 'Flat', down: 'Down' } as const;
    const statusWord = {
      statusNearHigh: 'Near its high',
      statusPullback: 'Pullback',
      statusCorrection: 'Correction',
      statusBear: 'Bear market',
    } as const;
    for (const row of rows) {
      const el = document.querySelector(`[data-wm-row="${row.id}"]`);
      expect(el, row.id).not.toBeNull();
      // The five signed lenses render (chg1d +0.5% in the fixture).
      expect(el!.textContent, row.id).toContain('+0.5%');
      // The range position rides the track's title + the sr sentence.
      expect(el!.textContent, row.id).toContain('87 percent of its 52-week range');
      // The trend word + the status pill (the corpus's own words).
      expect(el!.textContent, row.id).toContain(trendWord[row.trend!]);
      expect(el!.textContent, row.id).toContain(statusWord[row.statusKey!]);
    }

    // The UI-27 local-currency note rides the section.
    expect(document.querySelector('[data-wm-grids]')!.textContent).toContain('Returns in each market');

    // 16 unique row ids — every registry market seated exactly once.
    expect(new Set(Array.from(document.querySelectorAll('[data-wm-row]')).map((el) => el.getAttribute('data-wm-row')))).toHaveLength(16);
  });

  it('renders the world risk & liquidity cards: the 9 placement homes with the §21 trio', async () => {
    stubFeeds();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-wm-risk]')).not.toBeNull();
    });

    const cards = Array.from(document.querySelectorAll('[data-risk-card]'));
    expect(cards.map((c) => c.getAttribute('data-risk-card'))).toEqual([...RISK_IDS]);
    // The value + the 10-year position + the freshness (the §21 trio) on
    // the first card: the fixture's gpr-index value 100.5, a typical
    // position (0.75), the asOf date.
    const first = cards[0]!;
    expect(first.textContent).toContain('100.5');
    expect(first.textContent).toContain('typical');
    expect(first.textContent).toContain('Oct 1, 2026');
    // global-liquidity renders the EN prefix form: US$21.55 trillion.
    const liquidity = cards[8]!;
    expect(liquidity.textContent).toContain('US$21.55');
    expect(liquidity.textContent).toContain('trillion');
  });

  it('the map-callout click scrolls to the market\'s region-grid row (the on-page detail answer)', async () => {
    stubFeeds();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('.wm-card')).not.toBeNull();
    });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    // The map's first callout card (dow — the MAP_INDICES west-to-east
    // order) opens the region-grid row.
    const card = document.querySelector<HTMLButtonElement>('.wm-card')!;
    fireEvent.click(card);
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
    // The target row exists (the scroll's destination).
    expect(document.getElementById('wm-row-dow')).not.toBeNull();
  });

  it('FAIL-CLOSED: a dead projection renders the honest error state with the retry', async () => {
    stubFeeds({ projection: () => notFound() });
    // No cached projection in localStorage → the honest error.
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(screen.getByText('The World Markets page is unavailable right now')).toBeDefined();
    });
    expect(screen.getByText('Try again')).toBeDefined();
  });

  it('FAIL-CLOSED: a dead board keeps the calm discipline (no error surface, no map rows)', async () => {
    stubFeeds({ board: () => jsonResponse({ error: { code: 'markets_not_ready', message: 'not ready' } }, 503) });
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-wm-status-empty]')).not.toBeNull();
    });
    // The calm one-line answer — never an error, never zeros (§6.6).
    expect(document.querySelector('[data-wm-status-empty]')!.textContent).toContain('Cannot read yet');
    // The grids never render without a board.
    expect(document.querySelector('[data-wm-grids]')).toBeNull();
    // The risk cards still render (their feed is alive).
    expect(document.querySelectorAll('[data-risk-card]')).toHaveLength(9);
  });

  it('M-17: a failed refresh keeps the cached board copy on screen, labelled', async () => {
    // Seed the last-good board in localStorage, then fail the refresh.
    window.localStorage.setItem('currena:insights:markets', JSON.stringify(boardFixture()));
    stubFeeds({ board: () => jsonResponse({ error: { code: 'markets_not_ready', message: 'not ready' } }, 503) });
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-wm-board-cached]')).not.toBeNull();
    });
    // The cached copy RENDERS (the grids + the status box stay), labelled.
    expect(document.querySelector('[data-wm-grids]')).not.toBeNull();
    expect(document.querySelector('[data-wm-board-cached]')!.textContent).toContain('Last good copy');
  });
});
