/**
 * @vitest-environment jsdom
 *
 * LiveRates.test.tsx — the live-rates route's BANNER STATES, pinned at the
 * DOM level (audit C-9's scoped adoption: the jsdom environment exists so
 * WS-5's advisory refactors on this file have a characterization net).
 *
 * The banners are the honesty surface (spec §6.6):
 *   - fresh live data            → NO stale banner, NO offline banner, NO
 *                                  error card; the 8 board cards compute;
 *   - degraded (fetch fails, a
 *     last-good snapshot serves) → the "Using Cached Rates" status banner,
 *                                  cards keep serving the cached values;
 *   - error + nothing persisted  → the "Could not fetch rates" alert;
 *   - offline + cached snapshot  → the offline status banner.
 *
 * House discipline: vi.resetModules() per test (the snapshot store is a
 * module singleton), fake timers (the 30s poll and retry ladders never
 * fire), stubbed fetch (tests NEVER hit live sites — AGENTS.md rule 7).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Snapshot } from '@currena/core';
import { SnapshotSchema } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid snapshots covering the full 8-card board
 * ------------------------------------------------------------------ */

function tgjuFixture(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1 / 152_000 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 / 252_000 },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 1 / 5_800 },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 1 / 62_800 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 1 / 280_000 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1 / 168_000 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 1 / 32_500 },
    ],
    gold: [
      { id: 'gold-ounce', unit: 'USD', price: 2650 },
      { id: 'gold-18k', unit: 'TOMAN', price: 23_363_000, changePct: 0.05 },
    ],
  };
}

function frankfurterFixture(fetchedAt: string): Snapshot {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt,
    rates: [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.76 },
    ],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

interface FetchPlan {
  tgju?: () => Response | Promise<Response>;
  frankfurter?: () => Response | Promise<Response>;
}

function stubApi(plan: FetchPlan = {}): void {
  const now = new Date().toISOString();
  const handler = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('/api/rates')) {
      if (url.includes('source=tgju')) {
        return plan.tgju?.() ?? jsonResponse({ snapshot: tgjuFixture(now), stale: false, servedFrom: 'live' });
      }
      return plan.frankfurter?.() ?? jsonResponse({ snapshot: frankfurterFixture(now), stale: false, servedFrom: 'live' });
    }
    if (url.includes('/api/meta')) {
      return jsonResponse({
        currencies: [{ code: 'IRR', name: 'Iranian Rial', symbol: '﷼', minorUnits: 0 }],
        sources: {
          tgju: { base: 'IRR', currencies: ['IRR', 'USD'] },
          frankfurter: { base: 'USD', currencies: ['USD', 'EUR'] },
        },
        limitations: ['Example limitation text.'],
      });
    }
    if (url.includes('/api/history')) return jsonResponse({ source: 'tgju', count: 0, generations: [] });
    return jsonResponse({ error: { code: 'not_found', message: `unstubbed ${url}` } }, 404);
  });
  vi.stubGlobal('fetch', handler);
}

/** Fresh module graph per test — the snapshot store is a singleton. */
async function loadLiveRates(): Promise<{
  LiveRates: typeof import('./LiveRates')['LiveRates'];
  snapshotStore: typeof import('../lib/snapshot-store')['snapshotStore'];
}> {
  const { snapshotStore } = await import('../lib/snapshot-store');
  const { LiveRates } = await import('./LiveRates');
  return { LiveRates, snapshotStore };
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LiveRates — the banner states (characterization for WS-5)', () => {
  it('fresh live data: the 8 board cards compute, NO stale/offline banner, NO error card', async () => {
    stubApi();
    const { LiveRates, snapshotStore } = await loadLiveRates();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<LiveRates />);
    await act(async () => {});
    // The page h1 (the currency board heading).
    expect(screen.getByRole('heading', { level: 1, name: 'Currency Rate Board: Toman' })).toBeTruthy();
    // The 8 detail cards render, each carrying its computed Toman rate
    // (1 USD = 230,500 — local math over the ONE snapshot).
    const usdCard = screen.getByText('1 USD =').closest('article')!;
    expect(usdCard.textContent).toContain('230,500');
    const cards = document.querySelectorAll('article');
    expect(cards.length).toBe(8);
    // Honesty surface: none of the banners fire on a fresh live serve.
    expect(screen.queryByText('Using Cached Rates')).toBeNull();
    expect(screen.queryByText(/Offline: showing rates from/i)).toBeNull();
    expect(screen.queryByText(/Could not fetch rates/i)).toBeNull();
  });

  it('degraded mode (fetch fails, last-good serves): the cached-rates banner appears, cards keep serving values', async () => {
    // A 10-day-old persisted snapshot + a failing network.
    window.localStorage.setItem(
      'currena:snapshot:tgju',
      JSON.stringify(tgjuFixture(new Date(Date.now() - 10 * 86_400_000).toISOString())),
    );
    stubApi({ tgju: () => Promise.reject(new TypeError('offline')) });
    const { LiveRates, snapshotStore } = await loadLiveRates();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<LiveRates />);
    await act(async () => {});
    // The stale banner: a live-region status, not an alert (calm honesty).
    const banner = screen.getByText('Using Cached Rates');
    expect(banner.closest('[role="status"]')).toBeTruthy();
    // The cards still show the cached values (never zero, never NaN).
    const usdCard = screen.getByText('1 USD =').closest('article')!;
    expect(usdCard.textContent).toContain('230,500');
    // No error card while a last-good snapshot serves.
    expect(screen.queryByText(/Could not fetch rates/i)).toBeNull();
  });

  it('error state with nothing persisted: the could-not-fetch alert (no silent skeleton)', async () => {
    stubApi({ tgju: () => jsonResponse({ error: { code: 'source_unavailable', message: 'upstream down' } }, 503) });
    const { LiveRates, snapshotStore } = await loadLiveRates();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<LiveRates />);
    await act(async () => {});
    // The error card is a role=alert (it IS a problem, unlike staleness).
    const alert = screen.getByText(/Could not fetch rates/i);
    expect(alert.closest('[role="alert"]')).toBeTruthy();
    // No cached values to serve → no stale banner either.
    expect(screen.queryByText('Using Cached Rates')).toBeNull();
  });

  it('offline with a cached snapshot: the offline banner (status, not alert)', async () => {
    // Fresh persisted snapshot + navigator offline: the boot-local serve
    // is usable, so NO network is even attempted.
    window.localStorage.setItem('currena:snapshot:tgju', JSON.stringify(tgjuFixture(new Date().toISOString())));
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    stubApi({ tgju: () => Promise.reject(new TypeError('unreachable')) });
    const { LiveRates, snapshotStore } = await loadLiveRates();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<LiveRates />);
    await act(async () => {});
    // The offline banner names the source the cached rates came from.
    const banner = screen.getByText(/Offline: showing rates from TGJU/i);
    expect(banner.closest('[role="status"]')).toBeTruthy();
    // The cached values still serve (PWA offline behavior, spec §6.6).
    const usdCard = screen.getByText('1 USD =').closest('article')!;
    expect(usdCard.textContent).toContain('230,500');
  });

  it('a card copy button writes "1 USD = 230,500 IRR (Toman)" to the clipboard', async () => {
    stubApi();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { LiveRates, snapshotStore } = await loadLiveRates();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<LiveRates />);
    await act(async () => {});
    const usdCard = screen.getByText('1 USD =').closest('article')!;
    const copyButton = usdCard.querySelector<HTMLButtonElement>('button[title], button[aria-label]');
    // Every card carries a copy affordance (a11y-labeled).
    expect(copyButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(copyButton!);
    });
    expect(writeText).toHaveBeenCalledWith('1 USD = 230,500 IRR (Toman)');
  });
});

/* Fixture sanity — a drifted fixture must fail loudly, never silently. */
describe('LiveRates test fixtures', () => {
  it('the tgju fixture parses against the core Snapshot contract (gold-bearing, full 8-card board)', () => {
    const snap = tgjuFixture(new Date().toISOString());
    expect(() => SnapshotSchema.parse(snap)).not.toThrow();
    expect(snap.rates.length).toBe(9); // IRR + the 8 board currencies
  });
});
