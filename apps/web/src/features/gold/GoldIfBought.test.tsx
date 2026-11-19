/**
 * @vitest-environment jsdom
 *
 * GoldIfBought.test.tsx — GPE R33 / F26 (2026-11-19, S17): the "if you'd
 * bought" calculator's component tests — the collapsed Zone O card, the
 * honest waiting state (the pre-backfill key), the seeded card (the
 * method line + the year picker + the stacked per-asset rows with every
 * window named, the DCA line, the decile framing + the honest waiting
 * line under the min base), the year change recomputing, and the
 * disclaimers + the sources line (the S&P leg's venue named).
 *
 * House discipline: stubbed fetch per test — tests NEVER hit live
 * sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import type { GoldIfBoughtSnapshot } from '@currena/core';
import { GoldIfBoughtSnapshotSchema } from '@currena/core';
import { GoldIfBought } from './GoldIfBought';
import { clearGoldIfBoughtCacheForTests } from './gold-ifbought';
import { useI18n } from '../../shared/lib/locale';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads
 * ------------------------------------------------------------------ */

/** A linear monthly series helper. */
function linearAsset(fromYm: string, months: number, base: number, step: number, currentClose: number): GoldIfBoughtSnapshot['assets']['gold'] {
  const [y0 = 0, m0 = 1] = fromYm.split('-').map(Number);
  const monthly = [];
  for (let i = 0; i < months; i++) {
    const y = y0 + Math.floor((m0 - 1 + i) / 12);
    const m = ((m0 - 1 + i) % 12) + 1;
    monthly.push({ ym: `${y}-${String(m).padStart(2, '0')}`, close: base + i * step });
  }
  const [y1 = 0, m1 = 1] = monthly[monthly.length - 1]!.ym.split('-').map(Number);
  const nextY = y1 + Math.floor(m1 / 12);
  const nextM = (m1 % 12) + 1;
  return { monthly, current: { ym: `${nextY}-${String(nextM).padStart(2, '0')}`, close: currentClose, updatedAt: '2026-11-19T04:49:00.000Z' } };
}

function ifBoughtSnapshot(): GoldIfBoughtSnapshot {
  return GoldIfBoughtSnapshotSchema.parse({
    v: 1,
    // The running month is 2020-01 (the last asset's current.ym — the
    // schema's own month-agreement refine).
    asOf: '2020-01-28',
    fetchedAt: '2026-11-19T04:49:00.000Z',
    backfill: { from: '2016-11', to: '2019-12', months: 38, sp500Source: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=10y&interval=1d', fetchedAt: '2026-11-19T04:49:00.000Z' },
    assets: {
      // 38 anchors 2016-11 → 2019-12 rising; running 2020-01 @ the top.
      gold: linearAsset('2016-11', 38, 100, 1, 220),
      silver: linearAsset('2016-11', 38, 40, 0.2, 45),
      btc: linearAsset('2016-11', 38, 10_000, 500, 20_000),
      sp500: linearAsset('2016-11', 38, 2000, 10, 2100),
    },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** The locale wrapper (the GoldPositions pattern). */
function renderWithLocale(ui: React.ReactNode): ReturnType<typeof render> {
  function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    const { locale } = useI18n();
    void locale;
    return <>{children}</>;
  }
  return render(ui, { wrapper: Wrapper });
}

describe('GoldIfBought (the Zone O card)', () => {
  beforeEach(() => {
    clearGoldIfBoughtCacheForTests();
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders COLLAPSED by default with the takeaway line (progressive disclosure — the daily reader pays nothing)', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    renderWithLocale(<GoldIfBought />);
    expect(document.querySelector('[data-gold-ifbought]')).toBeTruthy();
    expect(document.querySelector('[data-ib-body]')).toBeNull(); // collapsed
    expect(document.querySelector('[data-gold-ifbought]')?.textContent).toContain('If you’d bought');
    expect(document.querySelector('[data-gold-ifbought]')?.textContent).toContain('$100-a-month');
  });

  it('renders the honest waiting line when the key is empty (the pre-backfill state — never an interim series)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    renderWithLocale(<GoldIfBought />);
    await fireEvent.click(document.querySelector('[data-gold-ifbought] button')!);
    await waitFor(() => {
      expect(document.querySelector('[data-ib-waiting]')).toBeTruthy();
    });
    expect(document.querySelector('[data-ib-waiting]')?.textContent).toContain('one-time backfill');
  });

  it('the seeded card: the method line, the year picker (the first year carries the November note), the four stacked rows with named windows', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(ifBoughtSnapshot())));
    renderWithLocale(<GoldIfBought />);
    await fireEvent.click(document.querySelector('[data-gold-ifbought] button')!);
    await waitFor(() => {
      expect(document.querySelector('[data-ib-rows]')).toBeTruthy();
    });
    // The method line (the DCA convention disclosed at point of use).
    expect(document.querySelector('[data-ib-method]')?.textContent).toContain('$100');
    // The year picker: 2016 (the first year, with the from-November
    // note) → 2020 (the running year).
    const select = document.querySelector('[data-ib-year-select]') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect([...select.options].map((o) => o.value)).toEqual(['2016', '2017', '2018', '2019', '2020']);
    expect(select.options[0]!.textContent).toContain('from November');
    // The four stacked rows, in the R33 row's own order.
    expect([...document.querySelectorAll('[data-ib-row]')].map((r) => r.getAttribute('data-ib-row'))).toEqual(['gold', 'sp500', 'btc', 'silver']);
    // Every row names its window: the default pick = 2019 (the last
    // year BEFORE the running year) → from Jan 2019.
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-window]')?.textContent).toContain('Jan 2019');
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-window]')?.textContent).toContain('Jan 2020');
    // The lump + the DCA lines render on every row.
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-lump]')?.textContent).toMatch(/[+−]/);
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-dca]')?.textContent).toContain('DCA:');
    // The disclaimers + the sources line (the S&P leg's venue named).
    expect(document.querySelector('[data-ib-disclaimer]')?.textContent).toContain('no guarantee');
    expect(document.querySelector('[data-ib-sources]')?.textContent).toContain('Yahoo');
  });

  it('a decile lights where the base supports it; the honest waiting line where it does not', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(ifBoughtSnapshot())));
    renderWithLocale(<GoldIfBought />);
    await fireEvent.click(document.querySelector('[data-gold-ifbought] button')!);
    await waitFor(() => {
      expect(document.querySelector('[data-ib-rows]')).toBeTruthy();
    });
    // The default pick (2019): a 13-month window over the 41 points → 29
    // same-length windows — under the min base 30 → the waiting line.
    const decile = document.querySelector('[data-ib-row="gold"] [data-ib-decile]');
    expect(decile?.getAttribute('data-ib-decile')).toBe('waiting');
    expect(decile?.textContent).toContain('lights at 30');
    // Switch to 2020 (the running year — a 1-month window: 41 windows
    // ≥ 30 → the decile lights).
    const select = document.querySelector('[data-ib-year-select]') as HTMLSelectElement;
    await fireEvent.change(select, { target: { value: '2020' } });
    await waitFor(() => {
      expect(document.querySelector('[data-ib-row="gold"] [data-ib-decile]')?.getAttribute('data-ib-decile')).not.toBe('waiting');
    });
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-decile]')?.textContent).toContain('same-length windows');
  });

  it('changing the year recomputes the rows (the window named moves)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(ifBoughtSnapshot())));
    renderWithLocale(<GoldIfBought />);
    await fireEvent.click(document.querySelector('[data-gold-ifbought] button')!);
    await waitFor(() => {
      expect(document.querySelector('[data-ib-rows]')).toBeTruthy();
    });
    const select = document.querySelector('[data-ib-year-select]') as HTMLSelectElement;
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-window]')?.textContent).toContain('Jan 2019');
    await fireEvent.change(select, { target: { value: '2016' } });
    await waitFor(() => {
      expect(document.querySelector('[data-ib-row="gold"] [data-ib-window]')?.textContent).toContain('Nov 2016');
    });
    expect(document.querySelector('[data-ib-row="gold"] [data-ib-window]')?.textContent).toContain('39 months');
  });

  it('a failed fetch renders the waiting line (the calm degradation — the cached copy paints if present)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    renderWithLocale(<GoldIfBought />);
    await fireEvent.click(document.querySelector('[data-gold-ifbought] button')!);
    await waitFor(() => {
      expect(document.querySelector('[data-ib-waiting]')).toBeTruthy();
    });
  });
});
