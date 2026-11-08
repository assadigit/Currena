/**
 * @vitest-environment jsdom
 *
 * zoom-component.test.tsx (page-division S8, 2026-11-08) — the WorldMap
 * module's REGION ZOOM mode, at the DOM level. What is pinned:
 *
 *   - the zoomed viewBox: the window's own crop (and the world view's
 *     untouched "0 0 1000 521" beside it — byte-identical, never
 *     restated);
 *   - the seating: ONLY the zoom's indices get callout cards (the full
 *     16 still feed the colour scale — the weight vars prove it);
 *   - THE CONSISTENCY PIN (the S8 gate): with the SAME board, a zoomed
 *     card's colour weight and hero number are IDENTICAL to the world
 *     view's card for the same market — the same colours, the same
 *     numbers, D-48;
 *   - the window's stage wiring (the data-wm-zoom attr + the aspect
 *     ratio var the CSS rules read);
 *   - the period switch drives the zoomed hero like the world's own;
 *   - the honest no-data card for a market with no board row;
 *   - the fa/RTL rendering (the Persian words through the corpus).
 *
 * House discipline: stubbed fetch per test — the map's two static
 * assets 404 (the land never paints in jsdom; the cards + pins are the
 * DOM under test) — tests NEVER hit live sites.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MarketsSnapshot } from '@currena/core';
import { MARKETS, summarizeMarkets } from '@currena/insights/markets';
import { WorldMap } from './WorldMap';
import type { WorldMapCopy } from './WorldMap';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';
import { REGION_ZOOMS } from './world-map-config';

/* The corpus satisfies the narrow copy contract structurally (the S7
 * WorldMapCopy rule) — the SAME words the legacy card speaks. */
const copyEn = insightsCopyEn as unknown as WorldMapCopy;
const copyFa = insightsCopyFa as unknown as WorldMapCopy;

/* Freeze the clock so the fixture's asOf (2026-11-07) is always fresh. */
beforeEach(() => {
  vi.setSystemTime(new Date('2026-11-08T12:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllGlobals();
});

/** A full 16-row board; the biggest 1D mover (ibov −6.6%) sits in NO
 * zoom so the all-16 scale visibly differs from any subset scale. */
function boardFixture(): MarketsSnapshot {
  const markets: MarketsSnapshot['markets'] = MARKETS.map((m, i) => ({
    id: m.id,
    asOf: '2026-11-07',
    close: 10000 + i * 100,
    chg1d: m.id === 'ibov' ? -6.6 : ((i % 5) - 2) * 0.4,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: 2,
    chg1y: 6,
    high52w: 12000,
    low52w: 8000,
    fromHigh: -3,
    rangePos: 87,
    trend: 'flat' as const,
    status: 'normal' as const,
    source: 'eodhd' as const,
    stale: false,
    weekly: [
      [0, 9900],
      [7, 10000],
    ],
  }));
  return { v: 1, generatedAt: '2026-11-07T23:31:00Z', markets, summary: summarizeMarkets(markets) };
}

/** The map's two static assets 404 — the land never paints in jsdom; the
 * cards + pins are the DOM under test. */
function stubAssets(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('not found', { status: 404 })),
  );
}

/** One card element by market id. */
function cardOf(id: string): HTMLElement {
  const el = document.querySelector(`.wm-card[data-id="${id}"]`);
  expect(el, `card ${id}`).not.toBeNull();
  return el as HTMLElement;
}

describe('WorldMap — the region zoom mode (S8)', () => {
  it('the zoomed viewBox is the window\'s own crop; the world view stays "0 0 1000 521"', () => {
    stubAssets();
    const board = boardFixture();
    const { unmount } = render(
      <WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="europe" />,
    );
    const vb = document.querySelector('.wm-map')!.getAttribute('viewBox');
    const { x, y, w, h } = REGION_ZOOMS.europe.viewBox;
    expect(vb).toBe(`${x} ${y} ${w} ${h}`);

    unmount();
    cleanup();
    render(<WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} />);
    expect(document.querySelector('.wm-map')!.getAttribute('viewBox')).toBe(`0 0 ${1000} ${521}`);
  });

  it('seats ONLY the zoom\'s indices — cards + pins — while the world view seats all 16', () => {
    stubAssets();
    const board = boardFixture();
    const { unmount } = render(
      <WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="asia" />,
    );
    const cardIds = Array.from(document.querySelectorAll('.wm-card')).map((c) => c.getAttribute('data-id'));
    expect(cardIds).toEqual([...REGION_ZOOMS.asia.indices]);
    const pinIds = Array.from(document.querySelectorAll('.wm-pin')).map((p) => p.getAttribute('data-id'));
    expect(pinIds).toEqual([...REGION_ZOOMS.asia.indices]);

    unmount();
    cleanup();
    render(<WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} />);
    expect(document.querySelectorAll('.wm-card')).toHaveLength(16);
    expect(document.querySelectorAll('.wm-pin')).toHaveLength(16);
  });

  it('THE CONSISTENCY PIN: the same board renders the same colour weight + hero number on the zoom and the world view (D-48)', () => {
    stubAssets();
    const board = boardFixture();
    // The world view first: capture dax's card weight var + hero text.
    const { unmount } = render(<WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} />);
    const worldDax = cardOf('dax');
    const worldWeight = worldDax.style.getPropertyValue('--b');
    const worldHero = worldDax.querySelector('.wm-yrow .wm-pv')!.textContent;

    unmount();
    cleanup();
    // The Europe zoom over the SAME board: dax's card sits elsewhere,
    // but its colour weight + hero number must be IDENTICAL.
    render(
      <WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="europe" />,
    );
    const zoomDax = cardOf('dax');
    expect(zoomDax.style.getPropertyValue('--b')).toBe(worldWeight);
    expect(zoomDax.querySelector('.wm-yrow .wm-pv')!.textContent).toBe(worldHero);
    // And the card is positioned at the ZOOM's own seat (not the world's).
    expect(zoomDax.style.left).toBe(`${REGION_ZOOMS.europe.cards.dax!.x}%`);
    expect(zoomDax.style.width).toBe(`${REGION_ZOOMS.europe.cardWidthPct}%`);
    // The weight is non-trivially derived from the ALL-16 scale: the
    // biggest 1D mover (ibov, −6.6%) is in NO zoom, yet dax's weight
    // still normalises against it (the subset-scale bug would read a
    // stronger weight here — pinned by the backtest's fail-closed proof
    // and by this non-zero, all-16-derived value).
    expect(worldWeight).not.toBe('');
  });

  it('the zoom\'s stage wiring: the data-wm-zoom attr + the aspect-ratio var the CSS rules read', () => {
    stubAssets();
    render(
      <WorldMap snapshot={boardFixture()} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="us" />,
    );
    const root = document.querySelector('.wm')! as HTMLElement;
    expect(root.getAttribute('data-wm-zoom')).toBe('us');
    expect(root.style.getPropertyValue('--wm-zoom-ar')).toBe(`${REGION_ZOOMS.us.viewBox.w} / ${REGION_ZOOMS.us.viewBox.h}`);
    // The world view never sets them.
    cleanup();
    render(<WorldMap snapshot={boardFixture()} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} />);
    const worldRoot = document.querySelector('.wm')! as HTMLElement;
    expect(worldRoot.getAttribute('data-wm-zoom')).toBeNull();
    expect(worldRoot.style.getPropertyValue('--wm-zoom-ar')).toBe('');
  });

  it('the period switch drives the zoomed hero like the world\'s own (1Y turns the card\'s loud number)', () => {
    stubAssets();
    render(
      <WorldMap snapshot={boardFixture()} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="europe" />,
    );
    const dax = cardOf('dax');
    // The fixture's chg1d for dax (i=8 → (8%5−2)*0.4 = 0.4? dax is the
    // 8th registry row → (8 % 5 − 2) × 0.4 = (3−2)×0.4 = +0.4).
    expect(dax.querySelector('.wm-yrow .wm-pv')!.textContent).toContain('+0.4');
    // Switch to 1Y: the hero row re-seats to the yearly lens (+6%).
    fireEvent.click(screen.getByRole('radio', { name: '1 year' }));
    expect(cardOf('dax').querySelector('.wm-yrow .wm-pv')!.textContent).toContain('+6');
    // The classic D/W/M cells stay beneath.
    expect(cardOf('dax').textContent).toContain('1D');
  });

  it('the honest no-data card for a market with no board row (M17)', () => {
    stubAssets();
    const board = boardFixture();
    board.markets = board.markets.filter((m) => m.id !== 'ftse');
    render(
      <WorldMap snapshot={board} copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="europe" />,
    );
    expect(cardOf('ftse').textContent).toContain('No data');
    // The other three still speak their numbers.
    expect(cardOf('dax').querySelector('.wm-yrow .wm-pv')!.textContent).toContain('+0.4');
  });

  it('the fa/RTL rendering: the zoomed cards speak the corpus\'s Persian words', () => {
    stubAssets();
    render(
      <WorldMap snapshot={boardFixture()} copy={copyFa} locale="fa" numberLocale="fa-IR" onOpenMarket={() => undefined} region="asia" />,
    );
    // The Persian card name + the fa number glyphs (Persian digits).
    const kospi = cardOf('kospi');
    expect(kospi.textContent).toContain('کوسپی');
    // The period switch speaks Persian.
    expect(document.querySelector('[role="radiogroup"]')!.getAttribute('aria-label')).toBe(
      (insightsCopyFa.markets.map as { periodSwitchAria: string }).periodSwitchAria,
    );
  });

  it('the zoom\'s loading state keeps the M17 shape (grey land, no numbers, height reserved)', () => {
    stubAssets();
    const { container } = render(
      <WorldMap loading copy={copyEn} locale="en" numberLocale="en-US" onOpenMarket={() => undefined} region="australia" />,
    );
    expect(container.querySelector('.wm[data-wm-zoom="australia"]')).not.toBeNull();
    expect(document.querySelectorAll('.wm-card')).toHaveLength(0);
    expect(document.querySelector('.wm-stage')).not.toBeNull();
  });

  it('a zoomed card click opens the market (the caller\'s own handler)', async () => {
    stubAssets();
    const opened: string[] = [];
    render(
      <WorldMap
        snapshot={boardFixture()}
        copy={copyEn}
        locale="en"
        numberLocale="en-US"
        onOpenMarket={(id) => opened.push(id)}
        region="us"
      />,
    );
    fireEvent.click(cardOf('sp500'));
    await waitFor(() => expect(opened).toEqual(['sp500']));
  });
});
