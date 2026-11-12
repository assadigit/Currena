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
import { marketBreadth, topMovers } from '../../components/insights/world-markets/briefing';
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

    // S19 (2026-11-12): the wayfinding row — Home › World Markets (BD-S19b).
    expect(document.querySelector('[data-page-breadcrumbs] [aria-current=\'page\']')?.textContent).toBe('World Markets');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');

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

  it('renders the briefing: the breadth headline + the two movers + the regional tile explorer (the legacy editorial layer)', async () => {
    stubFeeds();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-wm-briefing]')).not.toBeNull();
    });

    // The engines' own derivations over the same fixture — never
    // hand-counted (the characterization pins the PIPE, the engine
    // provides the numbers).
    const board = boardFixture();
    const breadth = marketBreadth(board.markets, 'today');
    const movers = topMovers(board.markets, 'today');

    // The breadth headline: the period label + the three cells carrying
    // the engine's counts + the proportional bar + the stated flat band.
    const block = document.querySelector('[data-markets-breadth-block]')!;
    expect(block.textContent).toContain('today performance');
    for (const kind of ['up', 'down', 'flat'] as const) {
      const cell = block.querySelector(`[data-breadth-kind="${kind}"]`)!;
      expect(cell.textContent, kind).toContain(String(breadth[kind]));
    }
    expect(document.querySelector('[data-markets-flat-band-note]')!.textContent).toContain('±1%');
    expect(document.querySelector('[data-markets-breadth-bar]')!.children).toHaveLength(3);

    // The two featured movers: the fixture's chg1d is a uniform +0.5, so
    // the true extrema tie and keep the first registry row (n225) — the
    // honest tie rule, never a fake winner.
    const gain = document.querySelector('[data-markets-biggest="gain"]')!;
    const fall = document.querySelector('[data-markets-biggest="fall"]')!;
    expect(gain.textContent).toContain('Biggest gain');
    expect(fall.textContent).toContain('Biggest fall');
    expect(gain.textContent).toContain(movers.gainer!.id === 'n225' ? 'Nikkei 225' : movers.gainer!.id);
    expect(gain.textContent).toContain('+0.5%');
    expect(fall.textContent).toContain('+0.5%');
    expect(gain.textContent).toContain('Selected period: today');

    // The tile explorer: three groups in registry order · Asia 7 ·
    // Europe 4 · Americas 5 — 16 tile buttons, every one an honest
    // expandable button with its 52-week tag.
    const groups = Array.from(document.querySelectorAll('[data-wm-briefing] [data-markets-region]'));
    expect(groups.map((g) => g.getAttribute('data-markets-region'))).toEqual(['asia', 'europe', 'americas']);
    expect(document.querySelectorAll('[data-wm-briefing] [data-markets-tile]')).toHaveLength(16);
    const hsi = document.querySelector<HTMLButtonElement>('[data-markets-tile="hsi"]')!;
    expect(hsi.id).toBe('insights-market-tile-hsi');
    expect(hsi.getAttribute('aria-expanded')).toBe('false');
    expect(hsi.textContent).toContain('Hang Seng');
    expect(hsi.textContent).toContain('Hong Kong');
    // The status ring hierarchy: the fixture's i%8 spread makes n225 the
    // bear row (ring /40) and asx200 the correction row (ring /30), while
    // hsi (near its high) keeps the plain border ring — the legacy
    // warning-tone discipline carried over verbatim.
    expect(document.querySelector('[data-markets-tile="n225"]')!.className).toContain('ring-currena-warning/40');
    expect(document.querySelector('[data-markets-tile="asx200"]')!.className).toContain('ring-currena-warning/30');
    expect(hsi.className).toContain('ring-[var(--color-border)]');
    // Every tile carries its 52-week distance (F5) — kospi's −7% reads
    // the corpus's own tag words.
    expect(document.querySelector('[data-markets-tile="kospi"]')!.textContent).toContain('7% below 52-week high');
  });

  it('the tile explorer expands the detail panel (one open at a time, the 52-week chart + the levels)', async () => {
    stubFeeds();
    Element.prototype.scrollIntoView = vi.fn();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-markets-tile="n225"]')).not.toBeNull();
    });

    const tile = document.querySelector<HTMLButtonElement>('[data-markets-tile="n225"]')!;
    fireEvent.click(tile);
    await waitFor(() => {
      expect(document.querySelector('#insights-market-detail-n225')).not.toBeNull();
    });
    expect(tile.getAttribute('aria-expanded')).toBe('true');

    // The panel's anatomy: the REUSED 52-week chart + the stored levels
    // (last close · 52-week high · 52-week low · from-high · as-of).
    const panel = document.querySelector('#insights-market-detail-n225')!;
    expect(panel.querySelector('[role="img"]')).not.toBeNull();
    expect(panel.textContent).toContain('Last close');
    expect(panel.textContent).toContain('52-week high');
    expect(panel.textContent).toContain('From 52-week high');
    expect(panel.textContent).toContain('as of');

    // One panel at a time (§6.3): opening hsi closes n225.
    fireEvent.click(document.querySelector<HTMLButtonElement>('[data-markets-tile="hsi"]')!);
    await waitFor(() => {
      expect(document.querySelector('#insights-market-detail-hsi')).not.toBeNull();
    });
    expect(document.querySelector('#insights-market-detail-n225')).toBeNull();

    // Toggling the open tile closes it entirely.
    fireEvent.click(document.querySelector<HTMLButtonElement>('[data-markets-tile="hsi"]')!);
    await waitFor(() => {
      expect(document.querySelector('#insights-market-detail-hsi')).toBeNull();
    });
  });

  it('the map\'s period switch drives the briefing (the ONE lens discipline)', async () => {
    stubFeeds();
    render(<WorldMarketsPage />);
    await waitFor(() => {
      expect(document.querySelector('.wm')).not.toBeNull();
      expect(document.querySelector('[data-markets-breadth-block]')).not.toBeNull();
    });

    // The briefing starts on today (the fixture's uniform +0.5% chg1d
    // is inside the ±1% band → all flat, the honest banded count).
    expect(document.querySelector('[data-markets-breadth-block]')!.textContent).toContain('today performance');

    // The map's "1 week" radio re-lenses the WHOLE briefing — the
    // 2026-10-21 unification discipline, now the page's own.
    fireEvent.click(screen.getByRole('radio', { name: '1 week' }));
    await waitFor(() => {
      expect(document.querySelector('[data-markets-breadth-block]')!.textContent).toContain('this week performance');
    });
    // The movers speak the weekly reading (+0.4 in the fixture) and the
    // period caption follows.
    expect(document.querySelector('[data-markets-biggest="gain"]')!.textContent).toContain('+0.4%');
    expect(document.querySelector('[data-markets-biggest="gain"]')!.textContent).toContain('Selected period: this week');
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
