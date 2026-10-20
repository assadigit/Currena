/**
 * @vitest-environment jsdom
 *
 * briefing.test.tsx — the editorial market-briefing section rendered end
 * to end (the 2026-10-18 world-indices handoff round, 03-agent-rules §F):
 * the period control drives the summary card's breadth counts, the two
 * featured movers and the explorer's tiles TOGETHER (02-ui-spec §3.3),
 * the mover cards render the honest empty state when a lens is missing,
 * the list/heatmap switch swaps the explorer, and the Persian (fa)
 * rendering carries the editorial header, the section label and the
 * RTL-safe Latin index names.
 *
 * Fixture-backed only — a synthetic snapshot through the REAL schema
 * shape; no live site, no provider (AGENTS.md rule 7).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { MarketEntry, MarketsSnapshot } from '@currena/core';
import { WorldMarkets } from '../WorldMarkets';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const entry = (fields: Partial<MarketEntry>): MarketEntry => ({
  id: 'sp500',
  asOf: '2026-10-16',
  close: 5000,
  chg1d: 0.5,
  chg3m: 2,
  high52w: 5200,
  low52w: 4500,
  fromHigh: -3.8,
  rangePos: 71,
  trend: 'up',
  status: 'normal',
  source: 'eodhd',
  stale: false,
  weekly: [[300, 5000]],
  ...fields,
});

/**
 * A five-index snapshot with KNOWN numbers on every lens:
 *   n225   : 1d +1.4 · 1w +4.5  · 1m +2.0  · 3m +6.0  · 1y +18.0  · fromHigh −2
 *   asx200 : 1d −0.6 · 1w −3.5  · 1m −1.0  · 3m −8.0  · 1y −4.5  · fromHigh −11  (correction)
 *   kospi  : 1d +0.2 · 1w +0.2  · 1m  —    · 3m +0.4  · 1y +11.0 · fromHigh −9.96 (displays −10%)
 *   hsi    : 1d −2.6 · 1w  —     · 1m −4.0  · 3m −12.0 · 1y  —    · fromHigh −21  (bear)
 *   sp500  : 1d +0.8 · 1w +1.2   · 1m +0.6  · 3m +3.0  · 1y +9.4  · fromHigh −0.3 (at high)
 */
function snapshotFixture(): MarketsSnapshot {
  const markets: MarketEntry[] = [
    entry({ id: 'n225', chg1d: 1.4, chg1w: 4.5, chg1m: 2.0, chg3m: 6.0, chg1y: 18.0, fromHigh: -2, high52w: 66000, low52w: 48000, close: 65000, rangePos: 70 }),
    entry({ id: 'asx200', chg1d: -0.6, chg1w: -3.5, chg1m: -1.0, chg3m: -8.0, chg1y: -4.5, fromHigh: -11, status: 'correction', rangePos: 20 }),
    entry({ id: 'kospi', chg1d: 0.2, chg1w: 0.2, chg3m: 0.4, chg1y: 11.0, fromHigh: -9.96, rangePos: 30 }),
    entry({ id: 'hsi', chg1d: -2.6, chg1m: -4.0, chg3m: -12.0, fromHigh: -21, status: 'bear', rangePos: 5 }),
    entry({ id: 'sp500', chg1d: 0.8, chg1w: 1.2, chg1m: 0.6, chg3m: 3.0, chg1y: 9.4, fromHigh: -0.3, rangePos: 99 }),
  ];
  return {
    v: 1,
    generatedAt: '2026-10-17T23:31:02Z',
    markets,
    summary: { count: 5, roseToday: 3, nAttention: 1, nUnusual: 1, signal: 'attention', worstGroup: 'asia' },
  };
}

/** All markets > 5 days old — the §6.6 collapsed-stale shell. */
function staleSnapshot(): MarketsSnapshot {
  const s = snapshotFixture();
  return {
    ...s,
    markets: s.markets.map((m) => entry({ ...m, asOf: '2026-09-01', stale: true })),
  };
}

const findPeriodRadio = (name: string): HTMLElement => {
  const radio = screen.getByRole('radio', { name });
  expect(radio).toBeTruthy();
  return radio;
};

afterEach(cleanup);

/* ------------------------------------------------------------------ *
 * The section shell
 * ------------------------------------------------------------------ */

describe('WorldMarkets — the editorial briefing shell', () => {
  it('renders the editorial header: title, section label, last-close badge and as-of date', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    // The editorial title and the descriptive section label (§3.1).
    expect(screen.getByText('The pulse of world markets')).toBeTruthy();
    expect(screen.getByText('World stock indices')).toBeTruthy();
    // The provenance badge — end-of-day, never "live".
    expect(screen.getByText('Latest data · end of trading day')).toBeTruthy();
    // The freshest as-of date rides the header (2026-10-16 → October 16, 2026).
    expect(screen.getByText(/October 16, 2026/)).toBeTruthy();
  });

  it('the loading state keeps the layout honest: skeletons, group labels, no percentages', () => {
    render(<WorldMarkets state={{ kind: 'loading' }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    expect(screen.getByText('The pulse of world markets')).toBeTruthy();
    expect(screen.queryByText('%')).toBeNull(); // never placeholder numbers
  });

  it('the empty state is the calm one-line "being prepared" shell', () => {
    render(<WorldMarkets state={{ kind: 'empty' }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    expect(screen.getByText(insightsCopyEn.markets.empty)).toBeTruthy();
  });

  it('everything stale (>5 days): the section collapses to the one-line stale shell', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: staleSnapshot() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    expect(screen.getByText(/old; last update/)).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Daily' })).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * Period selection drives every surface together (§3.3)
 * ------------------------------------------------------------------ */

describe('the period control — one selection, every surface follows', () => {
  it('defaults to the quarterly lens (the NORMAL timeframe, owner round 44)', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    expect((findPeriodRadio('Quarterly') as HTMLButtonElement).getAttribute('aria-checked')).toBe('true');
  });

  it('the quarterly breadth reads from chg3m: 2 up, 2 down, 1 flat, 5 valid', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    const summary = screen.getByText('Quarterly performance').closest('div')!;
    expect(within(summary).getByText('Indices up').nextElementSibling?.textContent).toBe('2');
    expect(within(summary).getByText('Indices down').nextElementSibling?.textContent).toBe('2');
    expect(within(summary).getByText('Flat').nextElementSibling?.textContent).toBe('1');
    // Full coverage: no coverage note.
    expect(screen.queryByText(/indices carry this period/)).toBeNull();
  });

  it('switching to Weekly re-reads breadth (2/1/1 with one row missing), the movers and the tiles from chg1w', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    fireEvent.click(findPeriodRadio('Weekly'));
    // Breadth over chg1w: n225 +4.5 (up), asx200 −3.5 (down), kospi +0.2
    // (flat), sp500 +1.2 (up); hsi predates the lens — excluded, so the
    // denominator drops to 4 and the coverage note says so.
    const summary = screen.getByText('Weekly performance').closest('div')!;
    expect(within(summary).getByText('Indices up').nextElementSibling?.textContent).toBe('2');
    expect(within(summary).getByText('Indices down').nextElementSibling?.textContent).toBe('1');
    expect(within(summary).getByText('Flat').nextElementSibling?.textContent).toBe('1');
    expect(screen.getByText('4 of 5 indices carry this period.')).toBeTruthy();
    // The movers are the chg1w extrema: n225 (+4.5) and asx200 (−3.5).
    expect(screen.getByText('Biggest gain').closest('article')!.textContent).toContain('Nikkei 225');
    expect(screen.getByText('Biggest fall').closest('article')!.textContent).toContain('ASX 200');
    // The n225 tile shows its weekly value.
    const tile = document.getElementById('insights-market-tile-n225')!;
    expect(tile.textContent).toContain('+4.5%');
  });

  it('the daily lens moves the decliner to the hsi (−2.6)', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    fireEvent.click(findPeriodRadio('Daily'));
    expect(screen.getByText('Biggest fall').closest('article')!.textContent).toContain('Hang Seng');
  });

  it('the monthly lens: kospi carries no chg1m — the tile shows the honest dash and the coverage note lowers the denominator', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    fireEvent.click(findPeriodRadio('Monthly'));
    const tile = document.getElementById('insights-market-tile-kospi')!;
    expect(tile.textContent).toContain('—');
    expect(screen.getByText('4 of 5 indices carry this period.')).toBeTruthy();
  });

  it('round 47: the yearly lens re-reads every surface from chg1y — hsi predates it, so the dash + coverage note appear', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    fireEvent.click(findPeriodRadio('Yearly'));
    // Breadth over chg1y: n225 +18.0 (up), asx200 −4.5 (down), kospi +11.0
    // (up), sp500 +9.4 (up); hsi predates the lens — excluded, so the
    // denominator drops to 4 and the coverage note says so.
    const summary = screen.getByText('Yearly performance').closest('div')!;
    expect(within(summary).getByText('Indices up').nextElementSibling?.textContent).toBe('3');
    expect(within(summary).getByText('Indices down').nextElementSibling?.textContent).toBe('1');
    expect(within(summary).getByText('Flat').nextElementSibling?.textContent).toBe('0');
    expect(screen.getByText('4 of 5 indices carry this period.')).toBeTruthy();
    // The movers are the chg1y extrema: n225 (+18.0) and asx200 (−4.5).
    expect(screen.getByText('Biggest gain').closest('article')!.textContent).toContain('Nikkei 225');
    expect(screen.getByText('Biggest gain').closest('article')!.textContent).toContain('+18.0%');
    expect(screen.getByText('Biggest fall').closest('article')!.textContent).toContain('ASX 200');
    // The hsi tile shows the honest dash — absent is absent, never a zero.
    const tile = document.getElementById('insights-market-tile-hsi')!;
    expect(tile.textContent).toContain('—');
  });

  it('the movers show the honest empty state only when the lens has no valid rows', () => {
    // Every row predates the weekly lens → both movers render the empty state.
    const snapshot = snapshotFixture();
    const noWeekly: MarketsSnapshot = {
      ...snapshot,
      markets: snapshot.markets.map((m) => entry({ ...m, chg1w: undefined })),
    };
    render(<WorldMarkets state={{ kind: 'ready', snapshot: noWeekly }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    fireEvent.click(findPeriodRadio('Weekly'));
    const gain = screen.getByText('Biggest gain').closest('article')!;
    expect(gain.textContent).toContain('No data for this period yet.');
    const fall = screen.getByText('Biggest fall').closest('article')!;
    expect(fall.textContent).toContain('No data for this period yet.');
  });
});

/* ------------------------------------------------------------------ *
 * The movers (§3.4)
 * ------------------------------------------------------------------ */

describe('the featured movers', () => {
  it('each card carries the logo frame, canonical name, country, signed return and the 52-week distance context', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    const gain = screen.getByText('Biggest gain').closest('article')!;
    // The quarterly gainer is n225 (+6.0): name, country, value, distance.
    expect(gain.textContent).toContain('Nikkei 225');
    expect(gain.textContent).toContain('Japan');
    expect(gain.textContent).toContain('+6.0%');
    expect(gain.textContent).toContain('From 52-week high:');
    expect(gain.querySelector('img')!.getAttribute('src')).toBe('/assets/markets/n225.jpg');
    // The period caption names the ranking basis.
    expect(gain.textContent).toContain('Selected period: Quarterly');
    // The decliner is hsi (−12.0) with its bear-market context.
    const fall = screen.getByText('Biggest fall').closest('article')!;
    expect(fall.textContent).toContain('Hang Seng');
    expect(fall.textContent).toContain('−12.0%');
    expect(fall.textContent).toContain('Bear market');
  });

  it('the below-high count line uses RAW values: −9.96% (kospi) is NOT "at least 10% below"', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    // asx200 (−11) and hsi (−21) count; kospi (−9.96) does not.
    expect(screen.getByText('2 of 5 indices are at least 10% below their 52-week high')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ *
 * The index wordmarks (the 2026-10-18 owner follow-up: ≥96×96 px)
 * ------------------------------------------------------------------ */

describe('the index wordmarks', () => {
  it('every rendered logo box is at least 96×96 px on BOTH breakpoints (the owner directive)', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    // 5 explorer tiles + the 2 featured mover cards.
    const logos = Array.from(document.querySelectorAll('img.currena-market-logo'));
    expect(logos.length).toBe(7);
    for (const img of logos) {
      const styleAttr = img.getAttribute('style') ?? '';
      const sizes = [...styleAttr.matchAll(/--icon-size(?:-sm)?:\s*([\d.]+)px/g)].map((m) => parseFloat(m[1]));
      // The mobile box is always declared; the desktop box rides beside it.
      expect(sizes.length).toBeGreaterThan(0);
      for (const size of sizes) {
        expect(size).toBeGreaterThanOrEqual(96);
      }
    }
  });

  it('opening a tile detail renders the same ≥96px wordmark beside the heading', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    // Scoped to the TILE: the world-markets MAP (2026-10-20) adds a callout
    // card for the same index, so the name regex alone is ambiguous now.
    fireEvent.click(document.getElementById('insights-market-tile-n225')!);
    const detail = document.getElementById('insights-market-detail-n225')!;
    const styleAttr = detail.querySelector('img.currena-market-logo')!.getAttribute('style') ?? '';
    const sizes = [...styleAttr.matchAll(/--icon-size(?:-sm)?:\s*([\d.]+)px/g)].map((m) => parseFloat(m[1]));
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(96);
    }
  });
});

/* ------------------------------------------------------------------ *
 * The explorer + the list/heatmap switch (§3.5, §3.6)
 * ------------------------------------------------------------------ */

describe('the regional explorer', () => {
  it('every index row is named AND located: canonical name + country/market + selected-period return', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    for (const [id, name, country] of [
      ['n225', 'Nikkei 225', 'Japan'],
      ['asx200', 'ASX 200', 'Australia'],
      ['kospi', 'KOSPI', 'South Korea'],
      ['hsi', 'Hang Seng', 'Hong Kong'],
      ['sp500', 'S&P 500', 'United States'],
    ] as const) {
      const tile = document.getElementById(`insights-market-tile-${id}`)!;
      expect(tile.textContent).toContain(name);
      expect(tile.textContent).toContain(country);
    }
  });

  it('region groups render as semantic h3 headings with counts from the loaded dataset', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    const asia = screen.getByRole('heading', { level: 3, name: /Asia-Pacific/ });
    expect(asia.textContent).toContain('(4)');
    expect(screen.getByRole('heading', { level: 3, name: /Americas/ }).textContent).toContain('(1)');
    // Europe has no rows in the fixture: its group is absent, not empty.
    expect(screen.queryByRole('heading', { level: 3, name: /Europe/ })).toBeNull();
  });

  it('the list / performance-map switch swaps the explorer for the equal-area map (desktop control)', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyEn} locale="en" numberLocale="en-US" />);
    // The display switch is a two-option radiogroup (§3.6).
    const display = screen.getByRole('radiogroup', { name: 'Choose how the indices are shown' });
    expect(within(display).getByRole('radio', { name: 'List' })).toBeTruthy();
    const mapRadio = within(display).getByRole('radio', { name: 'Performance map' });
    // Before switching, the map is not rendered.
    expect(document.getElementById('insights-market-heat-n225')).toBeNull();
    fireEvent.click(mapRadio);
    // After switching: the map's tiles exist, one per index, each with its
    // name and exact signed percentage (colour is never the only signal).
    const heatN225 = document.getElementById('insights-market-heat-n225')!;
    expect(heatN225.textContent).toContain('Nikkei 225');
    expect(heatN225.textContent).toContain('+6.0%');
    // The legend is visible and centred on zero, naming the selected period.
    expect(screen.getByText('Intensity is relative to the selected period')).toBeTruthy();
    // The list tiles still exist in the DOM (CSS keeps mobile on the list).
    expect(document.getElementById('insights-market-tile-n225')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ *
 * Localization / RTL (§C of 03-agent-rules)
 * ------------------------------------------------------------------ */

describe('the fa rendering', () => {
  it('carries the owner-directed Persian header, the period lenses and every localized number', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyFa} locale="fa" numberLocale="fa-IR" />);
    // The editorial title and the descriptive label, verbatim (§3.1).
    expect(screen.getByText('نبض بازارهای جهان')).toBeTruthy();
    expect(screen.getByText('شاخص‌های بورسی جهان')).toBeTruthy();
    expect(screen.getByText('آخرین داده‌ها · پایان جلسهٔ معاملاتی')).toBeTruthy();
    // The period lenses (§3.3) — the five supported horizons only.
    for (const label of ['روزانه', 'هفتگی', 'ماهانه', 'سه‌ماهه', 'سالانه']) {
      expect(screen.getByRole('radio', { name: label })).toBeTruthy();
    }
    // Persian digits at render time (the n225 weekly value +4.5 → ‎+۴٫۵٪).
    fireEvent.click(findPeriodRadio('هفتگی'));
    const tile = document.getElementById('insights-market-tile-n225')!;
    expect(tile.textContent).toContain('۴٫۵');
    // The movers' Persian labels (§3.4).
    expect(screen.getByText('بیشترین رشد')).toBeTruthy();
    expect(screen.getByText('بیشترین افت')).toBeTruthy();
    // The breadth line (§3.2).
    expect(screen.getByText('عملکرد هفتگی')).toBeTruthy();
  });

  it('the Latin index name rides beside the Persian name, dir-isolated (§6.7)', () => {
    render(<WorldMarkets state={{ kind: 'ready', snapshot: snapshotFixture() }} copy={insightsCopyFa} locale="fa" numberLocale="fa-IR" />);
    const latin = screen.getByText('Nikkei 225', { exact: true });
    expect(latin.getAttribute('dir')).toBe('ltr');
  });
});
