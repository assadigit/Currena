/**
 * @vitest-environment jsdom
 *
 * prices-cards.test.tsx — the prices board's card header, price line, the
 * «جزئیات بیشتر» button behaviour (onFocusCard), and the 52-week / 10-year
 * record display. §19.6 (2026-11-17): the DetailsPanel side-panel tests
 * (the five detail sections, the instrument-coverage notes) were RETIRED
 * with the legacy /insights page — the panel lived in the deleted
 * features/insights-legacy/ folder. The PricesBoard tests (the shared
 * drawing the destination pages render) stay.
 *
 * The tile histories come from a stubbed fetch returning dense synthetic
 * series (the same endpoint the sparklines and the price sections use),
 * so the client-derived rows (52-week range, changes) render from real
 * code paths.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { InsightsSnapshot } from '@currena/core';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { insightsCopyFa } from '../i18n/insights-copy-fa';
import { PricesBoard } from './PricesBoard';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

/** Today's epoch day — the synthetic series end at "now". */
const T = Math.floor(Date.now() / 86_400_000);

/**
 * A dense 401-day daily series for one asset. Gold's carries a known
 * 52-week window: a 3,961 dip 200 days back and a 5,318 spike 100 days
 * back (both inside the last 365 days; the pre-window week sits at 4,500
 * and is excluded by the 52-week guard).
 */
function historyBody(id: string): { v: 1; id: string; points: [number, number][] } {
  const points: [number, number][] = [];
  for (let d = T - 400; d <= T; d += 1) {
    let v = 4500;
    if (id === 'gold-usd') {
      if (d === T - 200) v = 3961;
      else if (d === T - 100) v = 5318;
      else if (d === T) v = 4166;
    } else if (d === T) {
      v = id === 'silver-usd' ? 57.12 : id === 'brent' ? 109.86 : 81582.86;
    }
    points.push([d, v]);
  }
  return { v: 1, id, points };
}

/** A prices-board reading fixture (EOD-spot attribution by default). */
function reading(
  id: IndicatorId,
  overrides: Partial<IndicatorReading> = {},
): IndicatorReading {
  const base: IndicatorReading = {
    id,
    value: 4166.1,
    asOf: '2026-10-17',
    status: 'context',
    updatedAt: '2026-10-17T08:38:42.878Z',
    change7d: -1.19,
    change30d: -5.31,
    change90d: 3.67,
    percentile10y: 0.92,
    ma200GapPct: -8.23,
    fromPeak10y: -25.42,
    peak: { value: 5586.2, date: '2026-01-29', basis: 'daily-high' },
    sourceName: 'gold-api.com (XAU)',
    sourceUrl: 'https://gold-api.com',
  };
  return { ...base, ...overrides } as IndicatorReading;
}

const onFocusCard = vi.fn();

function renderBoard(
  readings: IndicatorReading[],
  locale: 'en' | 'fa',
  numberLocale: 'en-US' | 'fa-IR',
) {
  render(
    <PricesBoard
      readings={readings}
      copy={locale === 'fa' ? insightsCopyFa : insightsCopyEn}
      locale={locale}
      numberLocale={numberLocale}
      onFocusCard={onFocusCard}
    />,
  );
}

const FOUR = ['gold-usd', 'silver-usd', 'brent', 'btc-usd'] as const;

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: unknown) => {
      const id = FOUR.find((a) => String(url).includes(`/api/insights/${a}/history`));
      const body = id !== undefined ? historyBody(id) : null;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => body,
      } as unknown as Response);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  onFocusCard.mockClear();
});

/* ------------------------------------------------------------------ *
 * The card header + the one-line price (task §4/§5/§6)
 * ------------------------------------------------------------------ */

describe('PricesBoard 2026-10-25b — header, price line, hierarchy', () => {
  it('renders the title with the measurement-basis subtitle beneath it (en)', () => {
    renderBoard(FOUR.map((id) => reading(id)), 'en', 'en-US');
    expect(screen.getByText('Gold price')).toBeTruthy();
    // Gold AND silver are quoted per troy ounce — the subtitle renders on both.
    expect(screen.getAllByText('per troy ounce').length).toBe(2);
    expect(screen.getByText('Brent crude oil')).toBeTruthy();
    expect(screen.getByText('per barrel')).toBeTruthy();
    expect(screen.getByText('Bitcoin price')).toBeTruthy();
    expect(screen.getByText('per bitcoin')).toBeTruthy();
  });

  it('renders the fa titles and subtitles', () => {
    renderBoard(FOUR.map((id) => reading(id)), 'fa', 'fa-IR');
    expect(screen.getByText('قیمت طلا')).toBeTruthy();
    expect(screen.getAllByText('هر اونس تروی').length).toBe(2);
    expect(screen.getByText('قیمت نفت برنت')).toBeTruthy();
    expect(screen.getByText('هر بشکه')).toBeTruthy();
  });

  it('keeps the price and its currency on ONE line — one flex row, both parts inside it (en + fa)', () => {
    const { container } = render(
      <PricesBoard
        readings={[reading('gold-usd')]}
        copy={insightsCopyEn}
        locale="en"
        numberLocale="en-US"
        onFocusCard={onFocusCard}
      />,
    );
    const number = screen.getByText('4,166');
    // The en currency rides as a prefix element in the SAME price row.
    const prefix = screen.getByText('US$');
    const row = number.closest('span');
    expect(row).toBeTruthy();
    expect(row!.contains(prefix)).toBe(true);
    expect(row!.className).toContain('items-baseline');

    cleanup();
    const { container: faContainer } = render(
      <PricesBoard
        readings={[reading('gold-usd')]}
        copy={insightsCopyFa}
        locale="fa"
        numberLocale="fa-IR"
        onFocusCard={onFocusCard}
      />,
    );
    const faNumber = screen.getByText('۴٬۱۶۶');
    const faUnit = screen.getByText('دلار');
    const faRow = faNumber.closest('span');
    expect(faRow).toBeTruthy();
    expect(faRow!.contains(faUnit)).toBe(true);
    expect(faRow!.className).toContain('items-baseline');
    void container;
    void faContainer;
  });

  it('labels the trend block and the daily change with their own periods', () => {
    renderBoard(FOUR.map((id) => reading(id)), 'en', 'en-US');
    expect(screen.getAllByText('Past 7 days').length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText('Daily change').length).toBe(4);
  });
});

/* ------------------------------------------------------------------ *
 * The sidebar directive (2026-10-26c): «جزئیات بیشتر» opens the side
 * panel; the card itself never expands.
 * ------------------------------------------------------------------ */

describe('PricesBoard 2026-10-26c — the more-details sidebar', () => {
  it('opens the details panel instead of expanding inline — onFocusCard carries the id + the opener', () => {
    renderBoard(FOUR.map((id) => reading(id)), 'en', 'en-US');

    const triggers = screen.getAllByRole('button', { name: /more details/i });
    expect(triggers.length).toBe(4);
    // Not a disclosure anymore: no exposed expand state, no controlled region.
    expect(triggers[0]!.getAttribute('aria-expanded')).toBeNull();
    expect(triggers[0]!.getAttribute('aria-haspopup')).toBe('dialog');

    fireEvent.click(triggers[0]!);
    expect(onFocusCard).toHaveBeenCalledTimes(1);
    const [calledId, opener] = onFocusCard.mock.calls[0]!;
    expect(calledId).toBe('gold-usd');
    // The opener element rides along — the panel returns focus to it on close.
    expect(opener).toBe(triggers[0]!);
  });

  it('never renders the detail sections on the card itself (fa)', () => {
    renderBoard(FOUR.map((id) => reading(id)), 'fa', 'fa-IR');
    expect(screen.queryByText('تغییرات قیمت')).toBeNull();
    expect(screen.queryByText('محدودهٔ قیمت در ۵۲ هفتهٔ گذشته')).toBeNull();
    expect(screen.queryByText('منبع داده و زمان به‌روزرسانی')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'جزئیات بیشتر' }).length).toBe(4);
  });
});

/* Compile-time anchor: the board also accepts a full snapshot's readings. */
void (null as unknown as InsightsSnapshot);
