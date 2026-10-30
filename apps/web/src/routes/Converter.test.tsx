/**
 * @vitest-environment jsdom
 *
 * Converter.characterization.test.tsx — the money page's DOM-level
 * characterization suite (audit C-9's scoped adoption: jsdom +
 * @testing-library/react exist so WS-5's hydration-effect refactors have a
 * safety net; zero bundle impact — devDependencies never ship).
 *
 * What is pinned (the designed first-paint + hydration behavior):
 *   - the money page's core form (sr-only h1, amount hero, from/to
 *     selects, swap, CTA, quick amounts);
 *   - recent-pairs hydration from localStorage (the set-state-in-effect
 *     pattern WS-5 will restructure — visible behavior must not move);
 *   - deep-link prefill `/?from=EUR&to=GBP&amount=500` + the
 *     drop-unknown-values rule + URL cleanup;
 *   - the stale banner's presence/absence per snapshot-store state
 *     (fresh live data → no banner; degraded last-good → banner);
 *   - the money conversion happy path: 100 USD → IRR @ 230,500 opens the
 *     result popup with the Toman figure.
 *
 * House discipline: vi.resetModules() per test (the snapshot store is a
 * module singleton), fake timers (the store's retry ladders and the 30s
 * polls never fire inside a test), stubbed fetch (tests NEVER hit live
 * sites — AGENTS.md rule 7).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Snapshot } from '@currena/core';
import { SnapshotSchema } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid snapshots (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

function tgjuFixture(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 / 252_000 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 1 / 280_000 },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 1 / 62_800 },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 1 / 5_800 },
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

const META_BODY = {
  currencies: [
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', minorUnits: 0 },
    { code: 'USD', name: 'US Dollar', symbol: '$', minorUnits: 2 },
  ],
  sources: {
    tgju: { base: 'IRR', currencies: ['IRR', 'USD', 'EUR'] },
    frankfurter: { base: 'USD', currencies: ['USD', 'EUR', 'GBP'] },
  },
  limitations: ['Example limitation text.'],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Routing fetch stub — every endpoint is answered from fixtures; the
 *  tgju/frankfurter answers are per-test overridable (a failing tgju
 *  shapes the degraded state; a failing frankfurter is never needed). */
interface FetchPlan {
  tgju?: () => Response | Promise<Response>;
  frankfurter?: () => Response | Promise<Response>;
}

function stubApi(plan: FetchPlan = {}): void {
  const now = new Date().toISOString();
  const handler = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('/api/rates')) {
      if (url.includes('source=tgju')) return plan.tgju?.() ?? jsonResponse({ snapshot: tgjuFixture(now), stale: false, servedFrom: 'live' });
      return plan.frankfurter?.() ?? jsonResponse({ snapshot: frankfurterFixture(now), stale: false, servedFrom: 'live' });
    }
    if (url.includes('/api/meta')) return jsonResponse(META_BODY);
    if (url.includes('/api/history')) return jsonResponse({ source: 'tgju', count: 0, generations: [] });
    return jsonResponse({ error: { code: 'not_found', message: `unstubbed ${url}` } }, 404);
  });
  vi.stubGlobal('fetch', handler);
}

/** Fresh module graph per test — the snapshot store is a singleton. */
async function loadConverter(): Promise<{
  Converter: typeof import('./Converter')['Converter'];
  snapshotStore: typeof import('../lib/snapshot-store')['snapshotStore'];
}> {
  const { snapshotStore } = await import('../lib/snapshot-store');
  const { Converter } = await import('./Converter');
  return { Converter, snapshotStore };
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  // jsdom has no ResizeObserver (the amount hero's font-fitting) and no
  // matchMedia (Odometer's reduced-motion check) — no-op stubs suffice:
  // both are visual concerns, not the behavior under characterization.
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Converter — the money page form (characterization for WS-5)', () => {
  it('renders the core form: sr-only h1, amount hero, USD→IRR selects, quick amounts, CTA', async () => {
    stubApi();
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    // The a11y floor: an h1 exists (screen-reader-only by design).
    expect(screen.getByRole('heading', { level: 1, name: 'Currena - Currency Converter' })).toBeTruthy();
    // Amount hero + the legacy default direction.
    expect(document.getElementById('amount')).toBeTruthy();
    expect((screen.getByLabelText('From') as HTMLSelectElement).value).toBe('USD');
    expect((screen.getByLabelText('To') as HTMLSelectElement).value).toBe('IRR');
    // Quick amounts for the USD side (international magnitudes).
    expect(screen.getByRole('button', { name: '100' })).toBeTruthy();
    // The CTA.
    expect(screen.getByRole('button', { name: '🔄 CONVERT NOW' })).toBeTruthy();
    // Swap is a labeled control (a11y).
    expect(screen.getByRole('button', { name: 'Swap currencies' })).toBeTruthy();
  });

  it('first-run visitors see POPULAR pairs (IRR-side suggestions); recents take over once stored', async () => {
    stubApi();
    // No stored recents → popular pairs render (the designed first run).
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    const { unmount } = render(<Converter />);
    expect(screen.getByText('🔥 Popular pairs')).toBeTruthy();
    unmount();

    // Stored recents hydrate on mount — THE set-state-in-effect WS-5
    // restructures; the visible behavior must survive byte-identical.
    window.localStorage.setItem(
      'currena:recent-pairs',
      JSON.stringify([
        { from: 'EUR', to: 'IRR' },
        { from: 'USD', to: 'TRY' },
      ]),
    );
    const fresh = await loadConverter();
    await act(async () => {
      fresh.snapshotStore.boot();
    });
    render(<fresh.Converter />);
    // The hydration effect (readRecentPairs → setState on mount) settles
    // within the render act; one microtask flush makes it deterministic.
    await act(async () => {});
    expect(screen.getByText('⚡ Recent pairs')).toBeTruthy();
    // The stored pairs' chips render (code labels, direction-aware; the
    // arrow glyph is aria-hidden so it never joins the accessible name).
    expect(
      screen.getByRole('button', { name: (n) => n.includes('EUR') && n.includes('IRR (Toman)') }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: (n) => n.includes('USD') && n.includes('TRY') })).toBeTruthy();
  });

  it('deep-link prefill applies known from/to/amount and cleans the URL', async () => {
    stubApi();
    window.history.pushState({}, '', '/?from=EUR&to=GBP&amount=500');
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    expect((screen.getByLabelText('From') as HTMLSelectElement).value).toBe('EUR');
    expect((screen.getByLabelText('To') as HTMLSelectElement).value).toBe('GBP');
    expect((document.getElementById('amount') as HTMLInputElement).value).toBe('500');
    // The URL is cleaned so a remount never re-applies the prefill.
    expect(window.location.pathname + window.location.search).toBe('/');
  });

  it('deep-link garbage is dropped silently (unknown codes, non-positive amounts)', async () => {
    stubApi();
    window.history.pushState({}, '', '/?from=XXX&to=GBP&amount=-5');
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    // Unknown from → the default USD stays; negative amount → not applied.
    expect((screen.getByLabelText('To') as HTMLSelectElement).value).toBe('GBP');
    expect((screen.getByLabelText('From') as HTMLSelectElement).value).toBe('USD');
    expect((document.getElementById('amount') as HTMLInputElement).value).toBe('');
  });

  it('typing in the amount hero updates the controlled input', async () => {
    stubApi();
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    const amount = document.getElementById('amount') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(amount, { target: { value: '250' } });
    });
    expect(amount.value).toBe('250');
  });

  it('the stale banner is ABSENT while fresh live data serves (the transient boot-local blink guard)', async () => {
    stubApi();
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    // Live fresh data: no cached-rates banner, no offline banner.
    expect(screen.queryByText('Using Cached Rates')).toBeNull();
  });

  it('the stale banner APPEARS in degraded mode (fetch fails, last-good snapshot serves)', async () => {
    // Aged persisted snapshot (10 days old) + a failing network → the
    // store serves last-good with degraded=true → isConfirmedStale → the
    // banner the UI has always shown.
    window.localStorage.setItem('currena:snapshot:tgju', JSON.stringify(tgjuFixture(new Date(Date.now() - 10 * 86_400_000).toISOString())));
    stubApi({ tgju: () => Promise.reject(new TypeError('offline')) });
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    // The refresh rejection settles through the microtask queue → the
    // store swaps to degraded mode → the banner re-renders, all inside act.
    await act(async () => {});
    expect(screen.getByText('Using Cached Rates')).toBeTruthy();
  });

  it('the money path: 100 USD → IRR opens the result popup with the Toman figure', async () => {
    stubApi();
    const { Converter, snapshotStore } = await loadConverter();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Converter />);
    const amount = document.getElementById('amount') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(amount, { target: { value: '100' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '🔄 CONVERT NOW' }));
    });
    // The conversion flow fetches (microtasks) then holds the fetching
    // state for the designed MIN_FETCHING_MS=700 — advance the fake clock
    // past it so the popup lands, then assert.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    // The popup is a real dialog (I1 a11y) carrying the converted figure:
    // 100 USD × 230,500 = 23,050,000 Toman. The Odometer counts up to the
    // figure over ~1s (rAF-backed, fake-timer controlled) — advance the
    // clock past the animation, then assert on the dialog's text content
    // (the digits render in grouped spans, not one text node).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('23,050,000');
  });
});

/* Fixture sanity — a drifted fixture must fail loudly, never silently. */
describe('Converter test fixtures', () => {
  it('the tgju fixture parses against the core Snapshot contract (gold-bearing, gold-heal-safe)', () => {
    const snap = tgjuFixture(new Date().toISOString());
    expect(() => SnapshotSchema.parse(snap)).not.toThrow();
  });

  it('the frankfurter fixture parses against the core Snapshot contract', () => {
    const snap = frankfurterFixture(new Date().toISOString());
    expect(() => SnapshotSchema.parse(snap)).not.toThrow();
  });
});
