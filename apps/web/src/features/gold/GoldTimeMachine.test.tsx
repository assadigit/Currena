/**
 * @vitest-environment jsdom
 *
 * GoldTimeMachine.test.tsx — GPE R31 / F12 (2026-11-19, S17): the time
 * machine's component tests — the collapsed-by-default affordance (the
 * Advanced control costs the daily reader nothing until the tap), the
 * era-boundary note, the picked day's row rendering (the verdict word +
 * the counts + the five lane chips — the hero's own vocabulary), the
 * as-of mapping (a between-grid day names the LAST reading day honestly),
 * the versioned-table line, the TWO provenance honesty lines, and the
 * degradation states (the honest gap, the unavailable fetch).
 *
 * House discipline: stubbed fetch per test — tests NEVER hit live
 * sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import type { GoldMeterResponse } from '@currena/core';
import { GoldTimeMachine } from './GoldTimeMachine';
import { clearGoldMeterCacheForTests } from './gold-meter';
import { useI18n } from '../../shared/lib/locale';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads
 * ------------------------------------------------------------------ */

const META = {
  v: 1 as const,
  eraStart: '2016-11-01',
  tableVersions: [
    { id: 's4-frozen-20', effectiveFrom: '2016-11-01', seats: 20 },
    { id: 's6-21', effectiveFrom: '2026-10-31', seats: 21 },
    { id: 'gf-p2-32', effectiveFrom: '2026-11-05', seats: 32 },
    { id: 'gf-s10-37', effectiveFrom: '2026-11-06', seats: 37 },
  ],
};

const ROW = {
  date: '2026-11-18',
  source: 'live',
  tableVersion: 'gf-s10-37',
  state: 'tipped-against',
  beamAngle: 6,
  fullyTipped: false,
  net: -1,
  readable: 4,
  counts: { for: 0, against: 1, neutral: 3, unread: 1 },
  lanes: [
    { lane: 'borrowing-costs', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
    { lane: 'dollar', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
    { lane: 'stress', side: 'against', split: false, readable: 1, firing: 1, supports: 0, pressures: 1 },
    { lane: 'inflation', side: 'neutral', split: false, readable: 1, firing: 0, supports: 0, pressures: 0 },
    { lane: 'flows', side: 'unread', split: false, readable: 0, firing: 0, supports: 0, pressures: 0 },
  ],
};

function meterResponse(row: typeof ROW | null, requestedDate: string): GoldMeterResponse {
  return { v: 1, requestedDate, row, meta: META } as unknown as GoldMeterResponse;
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

describe('GoldTimeMachine (the component)', () => {
  beforeEach(() => {
    clearGoldMeterCacheForTests();
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders COLLAPSED by default — the Advanced control costs nothing until the tap', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    renderWithLocale(<GoldTimeMachine />);
    expect(document.querySelector('[data-gold-time-machine]')).toBeTruthy();
    expect(document.querySelector('[data-tm-body]')).toBeNull(); // collapsed
    // The title row renders (the affordance).
    expect(document.querySelector('[data-gold-time-machine]')?.textContent).toContain('The time machine');
  });

  it('expands on tap: the era-boundary note teaches itself (2016+, never synthesized)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    await waitFor(() => {
      expect(document.querySelector('[data-tm-body]')).toBeTruthy();
    });
    expect(document.querySelector('[data-tm-era-note]')?.textContent).toContain('November 2016');
    expect(document.querySelector('[data-tm-era-note]')?.textContent).toContain('is ever synthesized');
    // The picker exists with the era as its min bound.
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.min).toBe('2016-11-01');
  });

  it('a picked day renders the row: the verdict word, the counts, the five lane chips, the version line + the LIVE provenance', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('date=2026-11-18');
      return jsonResponse(meterResponse(ROW, '2026-11-18'));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    await fireEvent.change(input, { target: { value: '2026-11-18' } });
    await waitFor(() => {
      expect(document.querySelector('[data-tm-row]')).toBeTruthy();
    });
    // The verdict word — the hero's own corpus key, never a parallel word.
    expect(document.querySelector('[data-tm-verdict]')?.textContent).toContain('Leaning against gold');
    // The counts line — the hero's own vocabulary.
    expect(document.querySelector('[data-tm-verdict]')?.textContent).toContain('0 for');
    expect(document.querySelector('[data-tm-verdict]')?.textContent).toContain('1 against');
    // The five lane chips with the seats' own state words.
    expect(document.querySelectorAll('[data-tm-lane]').length).toBe(5);
    expect(document.querySelector('[data-tm-lane="stress"]')?.getAttribute('data-tm-lane-side')).toBe('against');
    expect(document.querySelector('[data-tm-lane="flows"]')?.textContent).toContain("Couldn’t be read");
    // The versioned table line.
    expect(document.querySelector('[data-tm-version]')?.textContent).toContain('gf-s10-37');
    expect(document.querySelector('[data-tm-version]')?.textContent).toContain('37 seats');
    // The LIVE provenance line.
    expect(document.querySelector('[data-tm-provenance="live"]')?.textContent).toContain("The day’s own snapshot");
  });

  it('a between-grid picked day names the LAST reading day honestly (the as-of mapping)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(meterResponse({ ...ROW, date: '2026-11-14', source: 'backfill' }, '2026-11-16'))),
    );
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    await fireEvent.change(input, { target: { value: '2026-11-16' } });
    await waitFor(() => {
      expect(document.querySelector('[data-tm-row]')).toBeTruthy();
    });
    // The row's OWN date renders (Nov 14), named as the last reading day
    // on or before the picked day (Nov 16) — never the picked day silently.
    expect(document.querySelector('[data-tm-as-of]')?.textContent).toContain('Nov 14, 2026');
    expect(document.querySelector('[data-tm-as-of]')?.textContent).toContain('Nov 16, 2026');
  });

  it('a BACKFILL row renders the reconstructed provenance line (the two-row honesty story)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(meterResponse({ ...ROW, source: 'backfill', date: '2020-03-16', tableVersion: 's4-frozen-20' }, '2020-03-16'))),
    );
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    await fireEvent.change(input, { target: { value: '2020-03-16' } });
    await waitFor(() => {
      expect(document.querySelector('[data-tm-row]')).toBeTruthy();
    });
    expect(document.querySelector('[data-tm-provenance="backfill"]')?.textContent).toContain('Reconstructed from the stored series');
    expect(document.querySelector('[data-tm-version]')?.textContent).toContain('s4-frozen-20');
    expect(document.querySelector('[data-tm-version]')?.textContent).toContain('20 seats');
  });

  it('a day with no stored row renders the honest gap line (never a guess)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(meterResponse(null, '2016-11-03'))),
    );
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    await fireEvent.change(input, { target: { value: '2016-11-03' } });
    await waitFor(() => {
      expect(document.querySelector('[data-tm-no-row]')).toBeTruthy();
    });
    expect(document.querySelector('[data-tm-no-row]')?.textContent).toContain('never a guess');
  });

  it('a failed fetch renders the honest unavailable line (the calm degradation)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    await fireEvent.change(input, { target: { value: '2026-11-18' } });
    await waitFor(() => {
      expect(document.querySelector('[data-tm-unavailable]')).toBeTruthy();
    });
    expect(document.querySelector('[data-tm-unavailable]')?.textContent).toContain('could not be read');
  });

  it('the loading state renders while the archive reads (never a blank)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    renderWithLocale(<GoldTimeMachine />);
    await fireEvent.click(document.querySelector('[data-gold-time-machine] button')!);
    const input = document.querySelector('[data-tm-date-input]') as HTMLInputElement;
    await fireEvent.change(input, { target: { value: '2026-11-18' } });
    expect(document.querySelector('[data-tm-loading]')?.textContent).toContain('Reading the archive');
  });
});
