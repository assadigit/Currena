/**
 * @vitest-environment jsdom
 *
 * Receipt.characterization.test.tsx — the receipt generator's DOM-level
 * characterization suite, written BEFORE the WS-4 module split (the
 * Phase-3 recipe: thin coverage gets its net first, then code moves
 * verbatim into the module tree and this suite must stay green).
 *
 * What is pinned (the designed behavior):
 *   - the core form (h1, travel-currency hero defaulting TRY, from/to
 *     selects, date, the first expense row, add-expense, generate);
 *   - the live summary's LOCAL math over snapshots (100 + 250 TRY →
 *     350.00 TRY, converted to 2,030,000 Toman at 5,800);
 *   - the generate guard (no valid amounts → the add-at-least-one toast);
 *   - the happy path: Generate opens the paper modal (role=dialog) with
 *     the TOTAL line, the item rows and the Receipt ID footer;
 *   - per-item-currency NORMALIZATION through the snapshot (a USD item
 *     converts into the TRY total via the frankfurter snapshot — the
 *     legacy summed mixed currencies raw, a bug the rebuild fixed);
 *   - budget tracking: the progressbar's aria-valuenow rides the ratio
 *     of live total to daily budget.
 *
 * House discipline: vi.resetModules() per test (the snapshot store is a
 * module singleton), fake timers (toast/refresh ladders never fire),
 * stubbed fetch (tests NEVER hit live sites — AGENTS.md rule 7).
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
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 42.5 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.76 },
    ],
  };
}

const META_BODY = {
  currencies: [
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', minorUnits: 0 },
    { code: 'USD', name: 'US Dollar', symbol: '$', minorUnits: 2 },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', minorUnits: 2 },
  ],
  sources: {
    tgju: { base: 'IRR', currencies: ['IRR', 'USD', 'EUR', 'TRY'] },
    frankfurter: { base: 'USD', currencies: ['USD', 'EUR', 'GBP', 'TRY'] },
  },
  limitations: ['Example limitation text.'],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Routing fetch stub — every endpoint is answered from fixtures. */
function stubApi(): void {
  const now = new Date().toISOString();
  const handler = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('/api/rates')) {
      if (url.includes('source=tgju')) return jsonResponse({ snapshot: tgjuFixture(now), stale: false, servedFrom: 'live' });
      return jsonResponse({ snapshot: frankfurterFixture(now), stale: false, servedFrom: 'live' });
    }
    if (url.includes('/api/meta')) return jsonResponse(META_BODY);
    if (url.includes('/api/history')) return jsonResponse({ source: 'tgju', count: 0, generations: [] });
    return jsonResponse({ error: { code: 'not_found', message: `unstubbed ${url}` } }, 404);
  });
  vi.stubGlobal('fetch', handler);
}

/** Fresh module graph per test — the snapshot store is a singleton. */
async function loadReceipt(): Promise<{
  Receipt: typeof import('./Receipt')['Receipt'];
  snapshotStore: typeof import('../lib/snapshot-store')['snapshotStore'];
}> {
  const { snapshotStore } = await import('../lib/snapshot-store');
  const { Receipt } = await import('./Receipt');
  return { Receipt, snapshotStore };
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  window.localStorage.clear();
  window.location.hash = '';
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Receipt — the form (characterization for the WS-4 split)', () => {
  it('renders the core form: h1, TRY hero, TRY→IRR selects, date, first expense row, generate', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    expect(screen.getByRole('heading', { level: 1, name: '📄 Receipt Generator' })).toBeTruthy();
    // Legacy defaults: travel currency TRY, converting to IRR (Toman).
    expect((screen.getByLabelText('From Currency') as HTMLSelectElement).value).toBe('TRY');
    expect((screen.getByLabelText('To Currency') as HTMLSelectElement).value).toBe('IRR');
    // The travel-currency hero shows the TRY name from the dictionary.
    expect(screen.getByText('Turkish Lira')).toBeTruthy();
    // The date input defaults to today and the Jalali line renders.
    expect((screen.getByLabelText('Receipt Date') as HTMLInputElement).value).not.toBe('');
    // One expense row exists by default, labeled by position.
    expect(screen.getByLabelText('Amount 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Add Expense' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '📄 Generate' })).toBeTruthy();
  });

  it('Add Expense appends a second row', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+ Add Expense' }));
    });
    expect(screen.getByLabelText('Amount 2')).toBeTruthy();
  });

  it('the live summary does LOCAL math: 100 + 250 TRY → 350.00 TRY → 2,030,000 Toman', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '100' } });
    });
    // One item only: 100 TRY → 580,000 Toman at 5,800.
    // The summary card carries Total and Converted on one line each.
    const summary = screen.getByText('Total').closest('div')!.parentElement!;
    expect(summary.textContent).toContain('100.00');
    expect(summary.textContent).toContain('580,000');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+ Add Expense' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 2'), { target: { value: '250' } });
    });
    expect(summary.textContent).toContain('350.00');
    expect(summary.textContent).toContain('2,030,000');
    expect(summary.textContent).toContain('IRR (Toman)');
  });

  it('generate with no valid amounts → the add-at-least-one toast', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '📄 Generate' }));
    });
    expect(screen.getByText('⚠️ Please add at least one expense')).toBeTruthy();
    // No modal opened.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('the happy path: Generate opens the paper modal with the item rows, TOTAL and Receipt ID', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '100' } });
    });
    // The notes input is the row's second "Description 1"-labeled control
    // (the category select owns the same aria-label) — its placeholder is
    // unique in a one-row form.
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Notes (optional)'), {
        target: { value: 'kebab' },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '📄 Generate' }));
    });
    // The paper modal is a real dialog carrying the receipt.
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('🧾 EXPENSE RECEIPT');
    expect(dialog.textContent).toContain('TOTAL');
    expect(dialog.textContent).toContain('100.00');
    // One item of 100 TRY at 5,800 → 580,000 Toman.
    expect(dialog.textContent).toContain('580,000');
    expect(dialog.textContent).toContain('kebab');
    expect(dialog.textContent).toContain('Receipt ID:');
    // The export actions ride the modal.
    expect(screen.getByRole('button', { name: '📕 Download PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '📊 Excel' })).toBeTruthy();
  });

  it('per-item currencies NORMALIZE into the from-total through the snapshot (legacy bug fixed)', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    // Open the options panel, switch per-item currency on.
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: '⚙️ Additional Options' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: '💱 Different Currency Per Item' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '100' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+ Add Expense' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 2'), { target: { value: '10' } });
    });
    // Second row's currency: USD (aria-label "Currency 2").
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Currency 2'), { target: { value: 'USD' } });
    });
    // 10 USD × 42.5 TRY/USD (frankfurter) = 425 → total 525.00 TRY.
    // The snapshot fetch for the USD→TRY pair settles within the act flush.
    await act(async () => {});
    await act(async () => {});
    const summary = screen.getByText('Total').closest('div')!.parentElement!;
    expect(summary.textContent).toContain('525.00');
  });

  it('budget tracking renders the progressbar riding the live-total ratio', async () => {
    stubApi();
    const { Receipt, snapshotStore } = await loadReceipt();
    await act(async () => {
      snapshotStore.boot();
    });
    render(<Receipt />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '100' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+ Add Expense' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount 2'), { target: { value: '250' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: '⚙️ Additional Options' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: '💳 Budget Tracking' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Daily Budget'), { target: { value: '1000' } });
    });
    // 350 / 1000 → 35% — the progressbar's valuenow is the rounded ratio.
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('35');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    // Remaining renders: 650.00.
    expect(screen.getByText('Remaining').closest('div')!.textContent).toContain('650.00');
  });
});

/* Fixture sanity — a drifted fixture must fail loudly, never silently. */
describe('Receipt test fixtures', () => {
  it('the tgju fixture parses against the core Snapshot contract (gold-bearing)', () => {
    const snap = tgjuFixture(new Date().toISOString());
    expect(() => SnapshotSchema.parse(snap)).not.toThrow();
  });

  it('the frankfurter fixture parses against the core Snapshot contract', () => {
    const snap = frankfurterFixture(new Date().toISOString());
    expect(() => SnapshotSchema.parse(snap)).not.toThrow();
  });
});
