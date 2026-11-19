/**
 * @vitest-environment jsdom
 *
 * GoldPremiumHistory.test.tsx — GPE R30 / F3b: Bridge-2's tests — the
 * component's honest states (loading, unavailable, the seeded card with
 * the strip + chart + deciles), the EXACT identity strip's rendering
 * (the three factors + the disclosed formula — never regression copy),
 * the honesty line (reconstructed vs live), the R19-posture decile
 * waiting line at the sub-30 base, and the per-block degradation (no
 * snapshot → the strip waits, the chart still renders).
 *
 * House discipline: stubbed fetch per test — tests NEVER hit live
 * sites; contract-valid fixtures sanity-parsed. The snapshot store is
 * seeded the GoldPage.test way (localStorage + boot()).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import type { GoldPremiumHistorySnapshot, Snapshot } from '@currena/core';
import { GoldPremiumHistorySnapshotSchema } from '@currena/core';
import { GoldPremiumHistory } from './GoldPremiumHistory';
import { clearGoldPremiumCacheForTests } from './gold-premium';
import { snapshotStore } from '../../shared/lib/snapshot-store';
import { useI18n } from '../../shared/lib/locale';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (the s16 backfill's own values)
 * ------------------------------------------------------------------ */

/** A 24-day backfill + the 2026-11-19 live day (the launch shape). */
function premiumSnapshot(days: 'backfill-only' | 'with-live'): GoldPremiumHistorySnapshot {
  const rows: GoldPremiumHistorySnapshot['days'] = [];
  // The 24 common days compressed to the test's window: five backfill
  // days carrying the real reconstructed values (the M1 §4 hand check).
  const backfillDays: Array<[string, number, number, number, number, number, number]> = [
    // date, ounceUsd, dollarToman, emamiClose, emamiPct, baharClose, baharPct
    ['2026-11-11', 3986.84, 264_070, 254_365_000, 2.63, 247_275_000, -0.23],
    ['2026-11-12', 3885.08, 266_900, 253_965_000, 4.04, 247_045_000, 1.2],
    ['2026-11-16', 3865.0, 268_705, 250_555_000, 2.48, 241_405_000, -1.26],
    ['2026-11-17', 3846.32, 266_710, 251_510_000, 4.14, 242_080_000, 0.24],
    ['2026-11-18', 3725.8, 266_330, 250_740_000, 7.33, 240_750_000, 3.06],
  ];
  for (const [date, ounceUsd, dollarToman, emamiClose, emamiPct, baharClose, baharPct] of backfillDays) {
    const tomanPerOunce = ounceUsd * dollarToman;
    const intrEmami = (tomanPerOunce * 7.3224) / 31.1034768;
    const intrBahar = intrEmami;
    rows.push({
      date,
      source: 'backfill',
      fetchedAt: '2026-11-19T16:30:00.000Z',
      ounceUsd,
      dollarToman,
      tomanPerOunce,
      coins: [
        { id: 'coin-emami', marketToman: emamiClose, intrinsicToman: intrEmami, premiumToman: emamiClose - intrEmami, premiumPct: emamiPct },
        { id: 'coin-bahar', marketToman: baharClose, intrinsicToman: intrBahar, premiumToman: baharClose - intrBahar, premiumPct: baharPct },
      ],
    });
  }
  if (days === 'with-live') {
    const ounceUsd = 3696.72;
    const dollarToman = 266_330;
    const tomanPerOunce = ounceUsd * dollarToman;
    const intrEmami = (tomanPerOunce * 7.3224) / 31.1034768;
    rows.push({
      date: '2026-11-19',
      source: 'live',
      fetchedAt: '2026-11-19T20:32:00.000Z',
      ounceUsd,
      dollarToman,
      tomanPerOunce,
      coins: [
        { id: 'coin-emami', marketToman: 250_740_000, intrinsicToman: intrEmami, premiumToman: 250_740_000 - intrEmami, premiumPct: 8.18 },
        { id: 'coin-bahar', marketToman: 240_750_000, intrinsicToman: intrEmami, premiumToman: 240_750_000 - intrEmami, premiumPct: 3.87 },
      ],
    });
  }
  return GoldPremiumHistorySnapshotSchema.parse({
    v: 1,
    asOf: rows[rows.length - 1]!.date,
    fetchedAt: '2026-11-19T20:33:05.000Z',
    backfill: {
      from: rows[0]!.date,
      to: '2026-11-18',
      days: 5,
      sourceUrl: 'https://www.tgju.org/profile/sekee/history',
      fetchedAt: '2026-11-19T16:30:00.000Z',
    },
    days: rows,
  });
}

/** The LIVE snapshot fixture (the bridge board's own plane — the
 *  2026-11-18 frozen values + a fresh fetchedAt). */
function tgjuSnapshotFixture(): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt: new Date().toISOString(),
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 266_330 },
    ],
    gold: [
      { id: 'gold-ounce', unit: 'USD', price: 3696.72 },
      { id: 'coin-emami', unit: 'TOMAN', price: 250_740_000 },
      { id: 'coin-bahar', unit: 'TOMAN', price: 240_750_000 },
    ],
  } as unknown as Snapshot;
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

describe('GoldPremiumHistory (the component)', () => {
  beforeEach(() => {
    clearGoldPremiumCacheForTests();
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
    renderWithLocale(<GoldPremiumHistory />);
    expect(document.querySelector('[data-gold-premium="loading"]')).toBeTruthy();
  });

  it('renders the honest unavailable line when the key is empty (the pre-rung state)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    renderWithLocale(<GoldPremiumHistory />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-premium="none"]')).toBeTruthy();
    });
    expect(document.querySelector('[data-premium-unavailable]')?.textContent).toContain(
      'The premium history could not be read yet.',
    );
  });

  it('WITHOUT a live snapshot the strip waits (the honest per-block degradation) while the chart still renders', async () => {
    const snapshot = premiumSnapshot('backfill-only');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes('/api/insights/gold-premium') ? jsonResponse(snapshot) : jsonResponse({}, 404)),
    );
    renderWithLocale(<GoldPremiumHistory />);
    await waitFor(() => {
      expect(document.querySelector('[data-premium-strip-waiting]')).toBeTruthy();
    });
    expect(document.querySelector('[data-premium-chart]')).toBeTruthy();
  });

  it('renders the seeded card: the strip + the disclosed identity + the chart + the decile waiting lines', async () => {
    // The live snapshot side: seed the App-boot store (the bridge's own plane).
    window.localStorage.setItem('currena:snapshot:tgju', JSON.stringify(tgjuSnapshotFixture()));
    snapshotStore.boot();
    const snapshot = premiumSnapshot('backfill-only');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes('/api/insights/gold-premium') ? jsonResponse(snapshot) : jsonResponse({}, 404)),
    );
    renderWithLocale(<GoldPremiumHistory />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-premium]:not([data-gold-premium="loading"])')).toBeTruthy();
    });
    const root = document.querySelector('[data-gold-premium]')!;
    // The strip: today vs the LAST STORED day (2026-11-18) — the exact factors.
    const strip = root.querySelector('[data-premium-strip]')!;
    expect(strip.textContent).toContain('Today vs');
    // formatDateWords renders "Nov 18, 2026" style — the base day's own words.
    expect(strip.textContent).toMatch(/Nov 18,? 2026/);
    // The ounce factor is the big down day (−3.1% on 2026-11-18 → the live −0.77% off 3,696.72): the factor prints.
    expect(strip.textContent).toMatch(/−\d/);
    // The BINDING disclosure (s7/01 §8): the identity formula, never regression.
    const method = root.querySelector('[data-premium-strip-method]')!;
    expect(method.textContent).toContain('Δln(coin) = Δln(ounce) + Δln(USD/IRR) + Δln(1+premium)');
    expect(method.textContent).toContain('not a regression estimate');
    // The chart: both coins + the melt label + the window's dates.
    const chart = root.querySelector('[data-premium-chart]')!;
    expect(chart.querySelector('[data-premium-emami-line]')).toBeTruthy();
    expect(chart.querySelector('[data-premium-bahar-line]')).toBeTruthy();
    expect(chart.textContent).toContain('melt');
    // The honesty line: the two provenances named.
    const honesty = root.querySelector('[data-premium-honesty]')!;
    expect(honesty.textContent).toContain('reconstructed from TGJU');
    expect(honesty.textContent).toContain('computed live from our own snapshots');
    // The deciles: the R19-posture waiting line (the sub-30 base).
    const rows = [...root.querySelectorAll('[data-premium-decile-row]')];
    expect(rows).toHaveLength(2);
    expect(rows[0]!.textContent).toContain('lights at 30');
    // The method footer: the day-close convention + the source note.
    expect(root.querySelector('[data-premium-method]')?.textContent).toContain('00:03 Tehran');
    expect(root.querySelector('[data-premium-method]')?.textContent).toContain('Source: TGJU');
  });

  it('the boundary marker renders when the window carries BOTH provenances', async () => {
    window.localStorage.setItem('currena:snapshot:tgju', JSON.stringify(tgjuSnapshotFixture()));
    snapshotStore.boot();
    const snapshot = premiumSnapshot('with-live');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes('/api/insights/gold-premium') ? jsonResponse(snapshot) : jsonResponse({}, 404)),
    );
    renderWithLocale(<GoldPremiumHistory />);
    await waitFor(() => {
      expect(document.querySelector('[data-premium-boundary]')).toBeTruthy();
    });
    expect(document.querySelector('[data-premium-chart]')?.textContent).toContain('live compute begins');
  });

  it('a poisoned payload (schema-invalid) renders the honest unavailable line, never garbage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes('/api/insights/gold-premium') ? jsonResponse({ v: 1, days: 'nope' }) : jsonResponse({}, 404)),
    );
    renderWithLocale(<GoldPremiumHistory />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-premium="none"]')).toBeTruthy();
    });
  });
});
