/**
 * @vitest-environment jsdom
 *
 * GoldExpectations.test.tsx — GPE R28 / F24 + R29 / F25: the
 * expectations strip's tests — the calendar JOIN (the pure
 * expectationsJoin: the paired top line, the leading pick, the ±45-day
 * window, the unpaired split), the component's honest states (the
 * loading line, the unavailable line, the seeded card), the five
 * outcome rows with the leading emphasis, the honest disclaimer, the
 * venue attribution + link, and R29's calendar strip (the next fed +
 * us-cpi events, the zone named at point of use, the reader-locale
 * calendar rendering).
 *
 * THE KALSHI LEG IS DELIBERATELY ABSENT everywhere (S15-D1 — the
 * wording read's verdict): one venue, honestly named.
 *
 * House discipline: stubbed fetch per test — tests NEVER hit live
 * sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CalendarEvent, GoldExpectationsSnapshot } from '@currena/core';
import { GoldExpectationsSnapshotSchema } from '@currena/core';
import { GoldExpectations, expectationsJoin } from './GoldExpectations';
import { clearGoldExpectationsCacheForTests } from './gold-expectations';
import { useI18n } from '../../shared/lib/locale';

/** A contract-valid snapshot (the wire's own shape — the s15 fixture's own values). */
const snapshot: GoldExpectationsSnapshot = GoldExpectationsSnapshotSchema.parse({
  v: 1,
  fetchedAt: '2026-11-19T05:23:00.000Z',
  source: 'polymarket',
  event: {
    slug: 'fed-decision-in-december-20260729232808632',
    title: 'Fed Decision in December?',
    endDate: '2026-12-10T04:59:00Z',
    url: 'https://polymarket.com/event/fed-decision-in-december-20260729232808632',
  },
  markets: [
    { move: 'hike50plus', question: 'Will the Fed increase interest rates by 50+ bps after the December 2026 meeting?', slug: 'm1', yesPrice: 0.0625 },
    { move: 'hike25', question: 'Will the Fed increase interest rates by 25 bps after the December 2026 meeting?', slug: 'm2', yesPrice: 0.915 },
    { move: 'hold', question: 'Will there be no change in Fed interest rates after the December 2026 meeting?', slug: 'm3', yesPrice: 0.0225 },
    { move: 'cut25', question: 'Will the Fed decrease interest rates by 25 bps after the December 2026 meeting?', slug: 'm4', yesPrice: 0.0035 },
    { move: 'cut50plus', question: 'Will the Fed decrease interest rates by 50+ bps after the December 2026 meeting?', slug: 'm5', yesPrice: 0.0015 },
  ],
});

const calendar: readonly CalendarEvent[] = [
  { id: 'fomc-2026-12', date: '2026-12-09', titleEn: 'US Fed interest rate decision (FOMC)', titleFa: 'تصمیم فدرال رزرو آمریکا درباره نرخ بهره', kind: 'fed', tz: 'America/New_York' },
  { id: 'us-cpi-2026-11', date: '2026-12-10', titleEn: 'US consumer price index: November 2026', titleFa: 'شاخص قیمت مصرف‌کنندهٔ آمریکا، نوامبر ۲۰۲۶', kind: 'us-cpi', tz: 'America/New_York' },
  { id: 'abs-jobs-2026-10', date: '2026-11-19', titleEn: 'ABS jobs report', titleFa: 'گزارش بازار کار استرالیا', kind: 'abs-jobs', tz: 'Australia/Sydney' },
];

/** The locale wrapper (the GoldPositions pattern). */
function renderWithLocale(ui: React.ReactNode): ReturnType<typeof render> {
  function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    const { locale } = useI18n();
    void locale;
    return <>{children}</>;
  }
  return render(ui, { wrapper: Wrapper });
}

const TODAY = '2026-11-19';

describe('expectationsJoin (the pure calendar join — S15-D3)', () => {
  it('pairs the calendar fed event with the market inside ±45 days', () => {
    const join = expectationsJoin(snapshot.markets, snapshot.event.endDate, calendar, TODAY);
    expect(join.fedEvent?.id).toBe('fomc-2026-12');
    expect(join.leading?.move).toBe('hike25'); // the highest implied probability
    expect(join.paired).toBe(true); // 2026-12-09 vs 2026-12-10: paired
  });

  it('a market event beyond the window renders SEPARATELY (never a wrong join)', () => {
    const farCalendar: readonly CalendarEvent[] = [
      { id: 'fomc-2027-06', date: '2027-06-15', titleEn: 'Fed', titleFa: 'فدرال', kind: 'fed', tz: 'America/New_York' },
    ];
    const join = expectationsJoin(snapshot.markets, snapshot.event.endDate, farCalendar, TODAY);
    expect(join.fedEvent?.id).toBe('fomc-2027-06');
    expect(join.paired).toBe(false); // 2027-06-15 vs 2026-12-10: beyond the window
  });

  it('no calendar event renders the join with no fed row (the card still serves)', () => {
    const join = expectationsJoin(snapshot.markets, snapshot.event.endDate, undefined, TODAY);
    expect(join.fedEvent).toBeNull();
    expect(join.leading?.move).toBe('hike25');
    expect(join.paired).toBe(false);
  });
});

describe('GoldExpectations (the component)', () => {
  beforeEach(() => {
    clearGoldExpectationsCacheForTests();
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the honest loading state first (never a blank)', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    renderWithLocale(<GoldExpectations calendar={calendar} />);
    expect(document.querySelector('[data-gold-expectations="loading"]')).toBeTruthy();
  });

  it('renders the honest unavailable line when the key is empty (the pre-rung state)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    renderWithLocale(<GoldExpectations calendar={calendar} />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-expectations="none"]')).toBeTruthy();
    });
    expect(screen.getByText(/could not be read yet/i)).toBeTruthy();
  });

  it('seeds: the paired top line renders the calendar date + the leading probability', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(snapshot), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderWithLocale(<GoldExpectations calendar={calendar} />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-expectations]')).not.toBeNull();
      expect(document.querySelector('[data-gold-expectations="loading"]')).toBeNull();
      expect(document.querySelector('[data-gold-expectations="none"]')).toBeNull();
    });
    const topline = document.querySelector('[data-expect-topline]')!;
    expect(topline.textContent).toContain('+25 bp');
    expect(topline.textContent).toContain('91.5%');
    // The timezone named at point of use (GPE-S3-10).
    expect(topline.textContent).toContain('New York time');
  });

  it('expanded: the five outcome rows, the leading emphasis, the honest disclaimer, the venue link, and R29\'s calendar strip', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(snapshot), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderWithLocale(<GoldExpectations calendar={calendar} />);
    await waitFor(() => expect(document.querySelector('[data-expect-topline]')).not.toBeNull());
    await fireEvent.click(screen.getByRole('button', { name: /show the market/i }));
    const detail = document.querySelector('[data-expect-detail]')!;
    // The five outcome rows (the move word + the percentage).
    const rows = detail.querySelectorAll('[data-expect-markets] li');
    expect(rows.length).toBe(5);
    expect(detail.textContent).toContain('+50 bp or more');
    expect(detail.textContent).toContain('no change');
    expect(detail.textContent).toContain('−25 bp');
    // The honest trader-expectations disclaimer (the R28 wording).
    expect(detail.textContent).toContain('traders’ expectation, not our forecast');
    // The venue attribution + the event link (the one honest venue).
    const link = detail.querySelector<HTMLAnchorElement>('[data-expect-source] a');
    expect(link?.href).toBe('https://polymarket.com/event/fed-decision-in-december-20260729232808632');
    // The as-of stamp (the 30-min cadence's own label).
    expect(detail.textContent).toContain('UTC');
    // R29: the calendar strip — the next fed + us-cpi events, the zone named.
    const strip = document.querySelector('[data-expect-calendar]')!;
    expect(strip.textContent).toContain('US Fed interest rate decision');
    expect(strip.textContent).toContain('US consumer price index');
    expect(strip.textContent).toContain('New York time');
    expect(strip.textContent).toContain('in 20 days'); // 2026-12-09 from 2026-11-19
  });

  it('an unpaired join renders the calendar-only top line + the mismatch note inside (never a wrong join)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(snapshot), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const farCalendar: readonly CalendarEvent[] = [
      { id: 'fomc-2027-06', date: '2027-06-15', titleEn: 'Fed (June)', titleFa: 'فدرال', kind: 'fed', tz: 'America/New_York' },
    ];
    renderWithLocale(<GoldExpectations calendar={farCalendar} />);
    await waitFor(() => expect(document.querySelector('[data-expect-topline]')).not.toBeNull());
    const topline = document.querySelector('[data-expect-topline]')!;
    expect(topline.textContent).toContain('Next: Fed');
    expect(topline.textContent).not.toContain('91.5%'); // never a wrong join
    await fireEvent.click(screen.getByRole('button', { name: /show the market/i }));
    const detail = document.querySelector('[data-expect-detail]')!;
    expect(detail.querySelector('[data-expect-mismatch]')?.textContent).toContain('differ');
  });

  /* ---------------------------------------------------------------- *
   * GUX-S7 M4 — the ProbabilityRow set (12 §3.3 row 4)
   * ---------------------------------------------------------------- */

  it('GUX-S7 M4: every outcome row carries the probability bar — neutral ink, the fill = the venue\u2019s own implied probability, the leading row emphasized', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(snapshot), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderWithLocale(<GoldExpectations calendar={calendar} />);
    await waitFor(() => expect(document.querySelector('[data-expect-topline]')).not.toBeNull());
    await fireEvent.click(screen.getByRole('button', { name: /show the market/i }));
    const rows = [...document.querySelectorAll('[data-expect-row]')];
    expect(rows.length).toBe(5);
    for (const row of rows) {
      const bar = row.querySelector('[data-expect-prob-row]')!;
      expect(bar).not.toBeNull();
      // Neutral analytical ink — never a market hue.
      const fill = bar.querySelector('[data-expect-prob-fill]') as HTMLElement;
      expect(fill.className).toContain('bg-[var(--color-text-secondary)]');
      expect(fill.className).not.toContain('status-normal');
      expect(fill.className).not.toContain('status-alert');
      // The aria names the row in words.
      expect(bar.getAttribute('aria-label')).toContain('%');
    }
    // The leading row is emphasized (the venue's own leader — hike25 at 91.5%).
    const leading = document.querySelector('[data-expect-leading]')!;
    expect(leading.getAttribute('data-expect-row')).toBe('m2');
    // The fill width tracks the implied probability.
    const pct = Number(leading.querySelector('[data-expect-prob-row]')!.getAttribute('data-expect-prob-pct'));
    expect(pct).toBeCloseTo(91.5, 5);
    const fillWidth = (leading.querySelector('[data-expect-prob-fill]') as HTMLElement).style.width;
    expect(fillWidth).toBe('91.5%');
  });
});
