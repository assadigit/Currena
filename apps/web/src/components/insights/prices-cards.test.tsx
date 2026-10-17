/**
 * @vitest-environment jsdom
 *
 * prices-cards.test.tsx — the prices board's 2026-10-25b polish round
 * (asset-cards task) + the 2026-10-26c sidebar directive ("The more
 * details must show up in side bar"): the card header (title +
 * measurement-basis subtitle, icon block), the ONE-LINE price + currency
 * composition (task §5 — «۴٬۱۶۶ دلار» / "US$4,166", never separate
 * lines), the «جزئیات بیشتر» button now OPENING THE DETAILS SIDE PANEL
 * (no inline disclosure — the card never expands), the five detail
 * sections (task §9 A–E; the former F «دربارهٔ این اعداد» methodology
 * note was removed at the owner's direction, 2026-10-26b) rendering
 * INSIDE DetailsPanel, the 52-week range's bidirectional rendering
 * («۳٬۹۶۱ تا ۵٬۳۱۸ دلار» with «تا» BETWEEN the endpoints), the 10-YEAR
 * record relabel (computePeaks reads the 10-year window — never an
 * all-time claim), and the instrument-coverage notes shown ONLY when the
 * SERVED attribution actually is that instrument (task §10: the live
 * merge serves GC=F/SI=F/BZ=F futures with a futures attribution; the
 * EOD snapshot serves gold-api XAU/XAG spot — a futures note on a spot
 * price would be false).
 *
 * The tile/panel histories come from a stubbed fetch returning dense
 * synthetic series (the same endpoint the sparklines, the panel chart and
 * the price sections use), so the client-derived rows (52-week range,
 * changes) render from real code paths.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { formatJalaliDate } from '@currena/core';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { InsightsSnapshot } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { DetailsPanel } from './DetailsPanel';
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

/** Renders the side panel the «جزئیات بیشتر» button opens. */
function renderPanel(
  panelReading: IndicatorReading,
  allReadings: IndicatorReading[],
  locale: 'en' | 'fa',
  numberLocale: 'en-US' | 'fa-IR',
) {
  render(
    <DetailsPanel
      reading={panelReading}
      readings={allReadings}
      copy={locale === 'fa' ? insightsCopyFa : insightsCopyEn}
      locale={locale}
      numberLocale={numberLocale}
      onClose={vi.fn()}
      onPinChange={vi.fn()}
      pinned={false}
      returnFocusTo={null}
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

/* ------------------------------------------------------------------ *
 * The side panel's semantic sections (task §9 A–E; the former F
 * methodology note was removed 2026-10-26b)
 * ------------------------------------------------------------------ */

describe('DetailsPanel 2026-10-26c — the price sections in the side panel', () => {
  it('organises the details into the A–E sections with one «X گذشته» label family (en)', async () => {
    renderPanel(reading('gold-usd'), FOUR.map((id) => reading(id)), 'en', 'en-US');

    // The panel header carries the card's verified title — not the
    // registry's legacy "(ounce)" suffix (2026-10-26c).
    expect(screen.queryByText(/Gold price \(ounce\)/)).toBeNull();

    // A — price changes, one label family, shortest → longest.
    expect(screen.getByText('Price changes')).toBeTruthy();
    expect(screen.getAllByText('Past 7 days').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Past 30 days')).toBeTruthy();
    expect(screen.getByText('Past 90 days')).toBeTruthy();
    expect(screen.getByText('Past 6 months')).toBeTruthy();
    expect(screen.getByText('Past 1 year')).toBeTruthy();

    // B — the 52-week range section (client-derived from the stubbed history).
    expect(await screen.findByText('Price range over the past 52 weeks')).toBeTruthy();
    expect(await screen.findByText('US$3,961 – US$5,318')).toBeTruthy();

    // C — the 10-year record with its date and basis.
    expect(screen.getByText('Historical price records')).toBeTruthy();
    expect(screen.getByText('10-year high')).toBeTruthy();
    expect(screen.getByText('Jan 29, 2026')).toBeTruthy();
    expect(screen.getByText('(highest daily high)')).toBeTruthy();

    // D — reference levels.
    expect(screen.getByText('Price vs reference levels')).toBeTruthy();
    expect(screen.getByText('Price level vs 10-year range')).toBeTruthy();
    expect(screen.getByText('25.4% below its 10-year high')).toBeTruthy();
    expect(screen.getByText('8.2% below its 200-day average')).toBeTruthy();

    // E — source & freshness: attribution, observation date, fetch time.
    expect(screen.getByText('Data source & freshness')).toBeTruthy();
    expect(screen.getAllByText('gold-api.com (XAU)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('as of Oct 17, 2026').length).toBeGreaterThanOrEqual(1);

    // F — the methodology note is GONE (owner directive, 2026-10-26b):
    // neither its heading nor its body may render in the panel.
    expect(screen.queryByText('About these numbers')).toBeNull();
    expect(screen.queryByText(/share one window:/)).toBeNull();

    // The EOD spot attribution carries NO futures note (task §10).
    expect(
      screen.queryByText('The displayed price is the front-month futures contract, not the spot price.'),
    ).toBeNull();
  });

  it('renders the fa sections: the 52-week range with «تا» between the endpoints', async () => {
    renderPanel(reading('gold-usd'), FOUR.map((id) => reading(id)), 'fa', 'fa-IR');

    expect(screen.getByText('تغییرات قیمت')).toBeTruthy();
    expect(await screen.findByText('محدودهٔ قیمت در ۵۲ هفتهٔ گذشته')).toBeTruthy();
    // «۳٬۹۶۱ تا ۵٬۳۱۸ دلار» — the join word BETWEEN the numbers, the
    // currency attached once, after the range.
    expect(await screen.findByText('۳٬۹۶۱ تا ۵٬۳۱۸ دلار')).toBeTruthy();
    expect(screen.getByText('سوابق تاریخی قیمت')).toBeTruthy();
    expect(screen.getByText('بیشترین قیمت ۱۰ سال اخیر')).toBeTruthy();
    expect(screen.getByText('جایگاه قیمت نسبت به شاخص‌های مرجع')).toBeTruthy();
    expect(screen.getByText('منبع داده و زمان به‌روزرسانی')).toBeTruthy();
    // The methodology note is gone in fa too (owner directive, 2026-10-26b).
    expect(screen.queryByText('دربارهٔ این اعداد')).toBeNull();
    // The record row: value + Jalali date + basis, structured parts (the
    // date is formatAsOf's own Jalali rendering — asserted via the same
    // formatter, so the test pins the wiring, not the ICU build).
    expect(screen.getByText(formatJalaliDate('2026-01-29', 'fa-IR'))).toBeTruthy();
    expect(screen.getByText('(بالاترین سقف روزانه)')).toBeTruthy();
  });

  it('shows the fetch time as a line distinct from the observation date', async () => {
    renderPanel(reading('gold-usd'), FOUR.map((id) => reading(id)), 'en', 'en-US');
    const fetched = screen.getByText(/^Price fetched: /);
    expect(fetched.textContent!.startsWith('Price fetched: ')).toBe(true);
  });

  it('does NOT render the price sections for a non-price indicator', async () => {
    // Any non-PRICE_ROWS reading: the panel keeps its generic anatomy.
    const vix = reading('gold-usd', { id: 'vix', value: 21.4 }) as IndicatorReading;
    renderPanel(vix, [vix], 'en', 'en-US');
    expect(screen.queryByText('Price changes')).toBeNull();
    expect(screen.queryByText('Data source & freshness')).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * Instrument consistency (task §10) — the coverage notes follow the
 * SERVED attribution, not a hardcoded asset list.
 * ------------------------------------------------------------------ */

describe('DetailsPanel 2026-10-26c — instrument coverage notes', () => {
  it('shows the futures note only when the served attribution is a futures quote', async () => {
    const liveGold = reading('gold-usd', {
      sourceName: 'Yahoo Finance: COMEX gold futures (GC=F)',
      sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
    });
    renderPanel(liveGold, [liveGold], 'en', 'en-US');
    expect(
      screen.getByText('The displayed price is the front-month futures contract, not the spot price.'),
    ).toBeTruthy();
  });

  it('shows the Brent blend note for the EOD EIA+BZ=F attribution (and not the futures note)', async () => {
    const eodBrent = reading('brent', {
      sourceName: 'FRED (EIA Brent) + Yahoo Finance (BZ=F)',
      sourceUrl: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
    });
    renderPanel(eodBrent, [eodBrent], 'en', 'en-US');
    expect(
      screen.getByText(
        'The Brent series is the EIA spot price, extended past its last published date by the BZ=F futures contract.',
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText('The displayed price is the front-month futures contract, not the spot price.'),
    ).toBeNull();
  });

  it('never shows a futures note on the XAU spot attribution', async () => {
    renderPanel(reading('gold-usd'), [reading('gold-usd')], 'en', 'en-US');
    expect(
      screen.queryByText('The displayed price is the front-month futures contract, not the spot price.'),
    ).toBeNull();
    expect(
      screen.queryByText(
        'The Brent series is the EIA spot price, extended past its last published date by the BZ=F futures contract.',
      ),
    ).toBeNull();
  });
});

/* Compile-time anchor: the board also accepts a full snapshot's readings. */
void (null as unknown as InsightsSnapshot);
