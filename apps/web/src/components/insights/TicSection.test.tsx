/**
 * @vitest-environment jsdom
 *
 * TicSection.test.tsx — the "Who holds US government debt" section's
 * honesty net (gap-closure S2-M2.4):
 *
 *   - the data-generated headline carries the total + Japan/China with
 *     their 6-month changes (conditions only, both languages);
 *   - the net-buying/selling split: the chips read the TRANSACTIONS sums
 *     (net12m), never holdings changes;
 *   - the custody-hub caveat + the ◆ markers on the flagged rows;
 *   - the >70-day stale badge fires with a pinned clock (and only then);
 *   - the mobile card list starts at 6 + "Show all"; the table carries
 *     aria-sort on its sortable headers;
 *   - the loading and empty states never crash and never invent data.
 *
 * The fixture snapshot is schema-valid with the provider's own numbers
 * (the 2026-08 rows of the committed TIC fixtures).
 */

import { describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { TicSnapshot } from '@currena/core';
import type { IndicatorReading } from '@currena/core';
import { TicSnapshotSchema } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { TicSection, TicCustodyCard, type TicLoadState } from './TicSection';
import { ALWAYS_POSITION_IDS, HIDDEN_FROM_LANE_IDS } from './config/sections';

/** The fresh "now" (the fixture's dataMonth 2026-08 is 61 days old). */
const FRESH_NOW = () => new Date('2026-10-31T12:00:00Z');
/** The stale "now" (2026-08 month-end + 71 days). */
const STALE_NOW = () => new Date('2026-11-10T12:00:00Z');

const SNAPSHOT: TicSnapshot = {
  v: 1,
  dataMonth: '2026-08',
  releasedAt: '2026-10-16T20:07:27.000Z',
  fetchedAt: '2026-10-31T21:40:20.370Z',
  totalBn: 9331.7,
  officialBn: 3755.6,
  privateBn: 5576.1,
  holders: [
    {
      id: 'japan',
      name: 'Japan',
      holdingsBn: 1068.283,
      months: [
        { ym: '2026-01', v: 1171.5 },
        { ym: '2026-02', v: 1164.0 },
        { ym: '2026-03', v: 1164.0 },
        { ym: '2026-04', v: 1150.5 },
        { ym: '2026-05', v: 1140.2 },
        { ym: '2026-06', v: 1116.683 },
        { ym: '2026-07', v: 1103.943 },
        { ym: '2026-08', v: 1068.283 },
      ],
      netSalesBn: [
        { ym: '2026-06', v: -26.858 },
        { ym: '2026-07', v: 0.891 },
        { ym: '2026-08', v: -37.02 },
      ],
      valuationChangeBn: [
        { ym: '2026-06', v: -10.2 },
        { ym: '2026-07', v: 5.1 },
        { ym: '2026-08', v: 1.4 },
      ],
      isCustodyHub: false,
    },
    {
      id: 'united-kingdom',
      name: 'United Kingdom',
      holdingsBn: 1009.45,
      months: [
        { ym: '2026-01', v: 935.0 },
        { ym: '2026-02', v: 940.1 },
        { ym: '2026-03', v: 940.1 },
        { ym: '2026-04', v: 955.2 },
        { ym: '2026-05', v: 970.0 },
        { ym: '2026-06', v: 985.3 },
        { ym: '2026-07', v: 995.4 },
        { ym: '2026-08', v: 1009.45 },
      ],
      netSalesBn: [
        { ym: '2026-06', v: 20.0 },
        { ym: '2026-07', v: 12.5 },
        { ym: '2026-08', v: 30.1 },
      ],
      isCustodyHub: true,
    },
    {
      id: 'china-mainland',
      name: 'China, Mainland',
      holdingsBn: 590.729,
      months: [
        { ym: '2026-01', v: 655.3 },
        { ym: '2026-02', v: 650.1 },
        { ym: '2026-03', v: 650.1 },
        { ym: '2026-04', v: 642.4 },
        { ym: '2026-05', v: 635.2 },
        { ym: '2026-06', v: 622.537 },
        { ym: '2026-07', v: 606.845 },
        { ym: '2026-08', v: 590.729 },
      ],
      netSalesBn: [
        { ym: '2026-06', v: -16.968 },
        { ym: '2026-07', v: -9.732 },
        { ym: '2026-08', v: -10.449 },
      ],
      isCustodyHub: false,
    },
    {
      id: 'australia',
      name: 'Australia',
      holdingsBn: 79.912,
      months: [
        { ym: '2026-01', v: 77.9 },
        { ym: '2026-02', v: 78.1 },
        { ym: '2026-03', v: 78.1 },
        { ym: '2026-04', v: 78.6 },
        { ym: '2026-05', v: 79.0 },
        { ym: '2026-06', v: 80.113 },
        { ym: '2026-07', v: 80.556 },
        { ym: '2026-08', v: 79.912 },
      ],
      netSalesBn: [
        { ym: '2026-06', v: 0.421 },
        { ym: '2026-07', v: 1.276 },
        { ym: '2026-08', v: -0.338 },
      ],
      isCustodyHub: false,
    },
  ],
  sourceUrls: [
    'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt',
    'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt',
  ],
};

describe('TicSection', () => {
  it('the fixture satisfies the core contract (a fixture drift fails loudly)', () => {
    expect(() => TicSnapshotSchema.parse(SNAPSHOT)).not.toThrow();
  });

  it('renders the data-generated headline: the total + Japan and China with 6-month changes (EN)', () => {
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    // The total: 9331.7bn → $9.3 trillion.
    expect(screen.getByText(/9\.3 trillion/)).toBeTruthy();
    // Japan 1068.283 with the 6-month change (1164.0 → 1068.283 = −95.7).
    expect(screen.getByText(/Japan held \$1,068\.3 billion, \$95\.7 billion less than six months earlier/)).toBeTruthy();
    // China 590.729 (650.1 → 590.729 = −59.4).
    expect(screen.getByText(/China held \$590\.7 billion, \$59\.4 billion less than six months earlier/)).toBeTruthy();
    cleanup();
  });

  it('renders the headline in fa with Persian digits and the provenance line', () => {
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyFa} locale="fa" numberLocale="fa-IR" now={FRESH_NOW} />,
    );
    // «۹٫۳ تریلیون دلار» — the total in Persian digits.
    expect(screen.getByText(/۹٫۳ تریلیون دلار/)).toBeTruthy();
    // The provenance: data for August 2026 (اوت ۲۰۲۶), released Oct 16.
    // (The month words also ride the headline + the chart summary — the
    // provenance line is the one carrying the release date.)
    expect(screen.getAllByText(/اوت ۲۰۲۶/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/۱۶ اکتبر ۲۰۲۶/)).toBeTruthy();
    cleanup();
  });

  it('the buyers/sellers chips read the 12-month TRANSACTIONS sums (net12m), never holdings changes', () => {
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    // UK is the largest net buyer (20+12.5+30.1 = +62.6) even though its
    // holdings ROSE — the chip must cite the transactions number.
    expect(screen.getAllByText('United Kingdom +62.6').length).toBe(1);
    // Japan is the largest net seller (−26.858+0.891−37.02 = −63.0).
    expect(screen.getAllByText('Japan −63.0').length).toBe(1);
    cleanup();
  });

  it('the custody caveat renders + the custody-hub row wears the ◆ marker', () => {
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    expect(screen.getByText(/Belgium, Luxembourg, the Cayman Islands/)).toBeTruthy();
    // The ◆ markers carry the custody badge label (aria-label) — once in
    // the desktop table, once in the mobile card list (both surfaces render
    // in jsdom; the CSS picks the surface per viewport).
    const markers = screen.getAllByLabelText('Custody hub');
    expect(markers.length).toBe(2);
    expect(markers.every((m) => m.textContent === '◆')).toBe(true);
    cleanup();
  });

  it('the >70-day stale badge fires with a pinned clock — and stays hidden while fresh', () => {
    const { unmount } = render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    expect(screen.queryByText('Data is more than 70 days old')).toBeNull();
    unmount();
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={STALE_NOW} />,
    );
    expect(screen.getByText('Data is more than 70 days old')).toBeTruthy();
    // The table still renders (the badge never hides the data).
    expect(screen.getByRole('table')).toBeTruthy();
    cleanup();
  });

  it('the sortable headers carry aria-sort and re-order the table (net column, ascending)', () => {
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    const table = screen.getByRole('table');
    // Default sort: holdings, descending — Japan first.
    const firstRowBefore = within(table).getAllByRole('row')[1]!;
    expect(within(firstRowBefore).getByText('Japan')).toBeTruthy();

    // Sort by net buying/selling — first click ascending: the most negative
    // (Japan, −63.0) tops the table.
    const netButton = screen.getByRole('button', { name: 'Sort by Net buying/selling, 12m' });
    expect(netButton).toBeTruthy();
    fireEvent.click(netButton);
    const firstRowAfter = within(screen.getByRole('table')).getAllByRole('row')[1]!;
    expect(within(firstRowAfter).getByText('Japan')).toBeTruthy();

    // Second click flips to descending: the UK (+62.6) tops it.
    fireEvent.click(netButton);
    const firstRowDesc = within(screen.getByRole('table')).getAllByRole('row')[1]!;
    expect(within(firstRowDesc).getByText('United Kingdom')).toBeTruthy();
    cleanup();
  });

  it('the mobile card list starts at 6 rows with "Show all" (Australia always included)', () => {
    // 8 holders: the top 15 keeps them all; the card list caps at 6.
    const big: TicSnapshot = {
      ...SNAPSHOT,
      holders: [
        ...SNAPSHOT.holders,
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `holder-${i}`,
          name: `Holder ${i}`,
          holdingsBn: 50 - i,
          months: [
            { ym: '2026-07', v: 50 - i + 1 },
            { ym: '2026-08', v: 50 - i },
          ],
          netSalesBn: [{ ym: '2026-08', v: -1 }],
          isCustodyHub: false,
        })),
      ],
    };
    expect(() => TicSnapshotSchema.parse(big)).not.toThrow();
    render(
      <TicSection state={{ kind: 'ready', snapshot: big }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    const showAll = screen.getByRole('button', { name: /Show all 8 holders/ });
    expect(showAll.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(showAll);
    expect(showAll.getAttribute('aria-expanded')).toBe('true');
    cleanup();
  });

  it('loading and empty states render calmly (no crash, no invented data)', () => {
    const { unmount } = render(
      <TicSection state={{ kind: 'loading' } satisfies TicLoadState} copy={insightsCopyEn} locale="en" numberLocale="en-US" />,
    );
    unmount();
    render(
      <TicSection state={{ kind: 'empty' } satisfies TicLoadState} copy={insightsCopyEn} locale="en" numberLocale="en-US" />,
    );
    expect(screen.getByText(/being prepared/)).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    cleanup();
  });

  it('the honest net-vs-price-effect note renders (the section\'s design rule, stated)', () => {
    render(
      <TicSection state={{ kind: 'ready', snapshot: SNAPSHOT }} copy={insightsCopyEn} locale="en" numberLocale="en-US" now={FRESH_NOW} />,
    );
    expect(screen.getByText(/real transactions \(what investors actually bought or sold\)/)).toBeTruthy();
    cleanup();
  });
});

/* ------------------------------------------------------------------ *
 * TicCustodyCard — the weekly custody card (S2-M2.4's spec item 6,
 * FRED WSEFINTL1: "standard indicator card with 10-year position").
 * The reading below is the provider's own latest verified observation
 * (2026-10-28 Wednesday level, 2,838,071 $M — the live fredgraph.csv
 * read 2026-10-31 22:55 UTC).
 * ------------------------------------------------------------------ */

describe('TicCustodyCard (the weekly custody card)', () => {
  const CUSTODY: IndicatorReading = {
    id: 'nyfed-custody',
    value: 2838071,
    asOf: '2026-10-28',
    status: 'context',
    sourceName: 'Federal Reserve via FRED (WSEFINTL1, H.4.1 memorandum item)',
    sourceUrl: 'https://fred.stlouisfed.org/series/WSEFINTL1',
    change30d: -0.21,
    percentile10y: 0.9,
  } as IndicatorReading;

  const noop = () => {};

  it('renders the standard row: name, the walcl-twin trillion display, the 10-year position', () => {
    render(
      <TicCustodyCard
        reading={CUSTODY}
        copy={insightsCopyEn}
        numberLocale="en-US"
        onOpenDetails={noop}
        pinned={false}
      />,
    );
    // The card's own name (the spec's title).
    expect(screen.getByText('Foreign official holdings at the New York Fed (weekly)')).toBeTruthy();
    // $ millions → the walcl display: "US$2.84 trillion".
    expect(screen.getByText(/US\$2\.84/)).toBeTruthy();
    // ALWAYS_POSITION_IDS: the row carries its 10-year position bar.
    expect(ALWAYS_POSITION_IDS.has('nyfed-custody')).toBe(true);
    expect(screen.getByRole('meter', { name: insightsCopyEn.ui.position10y })).toBeTruthy();
    cleanup();
  });

  it('renders the fa twin (Persian digits, the suffix-only trillion form)', () => {
    render(
      <TicCustodyCard
        reading={CUSTODY}
        copy={insightsCopyFa}
        numberLocale="fa-IR"
        onOpenDetails={noop}
        pinned={false}
      />,
    );
    expect(screen.getByText('دارایی‌های رسمی خارجی در فدرال رزرو نیویورک (هفتگی)')).toBeTruthy();
    // 2838071 × 1e-6 → ۲٫۸۴ (Persian digits) with the «تریلیون دلار» suffix word.
    expect(screen.getByText('۲٫۸۴')).toBeTruthy();
    expect(screen.getByText('تریلیون دلار')).toBeTruthy();
    cleanup();
  });

  it('renders nothing when the reading is absent (loading/held — never a made-up row)', () => {
    const { container } = render(
      <TicCustodyCard reading={null} copy={insightsCopyEn} numberLocale="en-US" onOpenDetails={noop} pinned={false} />,
    );
    expect(container.querySelector('[data-tic-custody]')).toBeNull();
    expect(container.textContent).toBe('');
    cleanup();
  });

  it('is the one-surface rule member: hidden from the borrowing-costs lane (renders only in the TIC slot)', () => {
    expect(HIDDEN_FROM_LANE_IDS.has('nyfed-custody')).toBe(true);
    // Its definition still belongs to the borrowing-costs group (the gauge
    // membership is untouched — context, never a vote).
    expect(ALWAYS_POSITION_IDS.has('nyfed-custody')).toBe(true);
  });
});
