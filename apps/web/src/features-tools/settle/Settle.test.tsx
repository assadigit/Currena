/**
 * @vitest-environment jsdom
 *
 * Settle.characterization.test.tsx — the Split & Settle route's DOM-level
 * characterization suite, written BEFORE the WS-4 module split (the
 * Phase-3 recipe: thin coverage gets its net first, then code moves
 * verbatim into the module tree and this suite must stay green).
 *
 * What is pinned (the designed behavior):
 *   - the empty state (no groups yet → the create-first-group CTA);
 *   - the create-group flow (FAB → modal → name + comma members → the
 *     group card with member count and "All settled up");
 *   - localStorage persistence through lib/settle-storage (the
 *     post-hydration persist effect — groups survive a reload);
 *   - the group detail view (stats grid, the REAL tablist with three
 *     tabs, the expenses empty state);
 *   - the add-expense flow (FAB in a group → modal → the expense lands
 *     in the Expenses tab; balances +50.00/−50.00; the settle
 *     suggestion Ali → You 50.00);
 *   - mark-as-settled (confirm stubbed → the settlement clears the
 *     balances, the celebration line, the toast).
 *
 * House discipline: vi.resetModules() per test, fake timers, stubbed
 * fetch (never needed — Settle is pure local storage math — but the
 * global stays stubbed so a stray fetch fails loudly, AGENTS.md rule 7).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

/** Fresh module graph per test — the route reads localStorage at mount. */
async function loadSettle(): Promise<{
  Settle: typeof import('./Settle')['Settle'];
}> {
  const { Settle } = await import('./Settle');
  return { Settle };
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
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Settle — the shared-expense flow (characterization for the WS-4 split)', () => {
  it('empty state: no groups yet, the create-first-group CTA', async () => {
    const { Settle } = await loadSettle();
    render(<Settle />);
    expect(screen.getByRole('heading', { level: 1, name: '👥 Split & Settle' })).toBeTruthy();
    expect(screen.getByText('No Groups Yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: '➕ Create First Group' })).toBeTruthy();
  });

  it('create-group flow: FAB → modal → name + members → the group card + persistence', async () => {
    const { Settle } = await loadSettle();
    render(<Settle />);
    // The FAB (aria-label flips per context) opens the create modal.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create New Group' }));
    });
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Create New Group');
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Group Name'), { target: { value: 'Dubai Trip' } });
      fireEvent.change(screen.getByLabelText('Members (comma separated)'), { target: { value: 'Ali, Sara' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));
    });
    // The card: name, "You" auto-added → 3 members, fresh group settled up.
    expect(screen.getByText('Dubai Trip')).toBeTruthy();
    expect(screen.getByText('👥 3 members')).toBeTruthy();
    expect(screen.getByText('💰 0 expenses')).toBeTruthy();
    expect(screen.getByText('All settled up ✅')).toBeTruthy();
    // Persistence: the settle key holds the group.
    const stored = JSON.parse(window.localStorage.getItem('splitSettleGroups') ?? '[]') as Array<{ name: string; members: string[] }>;
    expect(stored).toHaveLength(1);
    expect(stored[0]!.name).toBe('Dubai Trip');
    expect(stored[0]!.members).toEqual(['You', 'Ali', 'Sara']);
  });

  it('guard: creating without a name → the enter-group-name toast', async () => {
    const { Settle } = await loadSettle();
    render(<Settle />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create New Group' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));
    });
    expect(screen.getByText('Please enter a group name')).toBeTruthy();
  });

  it('group detail: stats grid + the REAL tablist + the expenses empty state', async () => {
    window.localStorage.setItem(
      'splitSettleGroups',
      JSON.stringify([
        {
          id: 'g1',
          name: 'Dubai Trip',
          emoji: '✈️',
          members: ['You', 'Ali'],
          expenses: [],
          settlements: [],
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const { Settle } = await loadSettle();
    render(<Settle />);
    // Open the group (the card's role=button region).
    await act(async () => {
      fireEvent.click(screen.getByText('Dubai Trip').closest('[role="button"]')!);
    });
    // The stats grid: Members / Expenses / Total.
    expect(screen.getByText('Members')).toBeTruthy();
    expect(screen.getByText('Expenses')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    // The REAL tablist (audit WS-3 #1): three tabs, Expenses selected.
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');
    // The expenses panel's designed empty state.
    expect(screen.getByText('No expenses yet. Add your first expense!')).toBeTruthy();
    // The FAB now says Add Expense.
    expect(screen.getByRole('button', { name: 'Add Expense' })).toBeTruthy();
  });

  it('add-expense flow: the expense lands, balances ±50, the settle suggestion fires', async () => {
    window.localStorage.setItem(
      'splitSettleGroups',
      JSON.stringify([
        {
          id: 'g1',
          name: 'Dubai Trip',
          emoji: '✈️',
          members: ['You', 'Ali'],
          expenses: [],
          settlements: [],
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const { Settle } = await loadSettle();
    render(<Settle />);
    await act(async () => {
      fireEvent.click(screen.getByText('Dubai Trip').closest('[role="button"]')!);
    });
    // FAB opens the add-expense modal.
    // The FAB (aria-label) opens the modal — but the modal's own submit
    // button shares the visible name, so the FAB is queried first.
    const fab = screen.getAllByRole('button', { name: 'Add Expense' })[0]!;
    await act(async () => {
      fireEvent.click(fab);
    });
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Add Expense');
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Hotel' } });
      fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add Expense' }));
    });
    // Expenses tab: the expense row (description, amount, payer, split) —
    // the amount and its <bdi> currency label are separate text nodes; the
    // payer/split lines live one container up.
    const expenseCard = screen.getByText('Hotel').closest('div')!.parentElement!;
    expect(expenseCard.textContent).toContain('100.00');
    expect(expenseCard.textContent).toContain('IRR (Toman)');
    expect(expenseCard.textContent).toContain('You');
    // Balances tab: You +50.00, Ali −50.00.
    await act(async () => {
      fireEvent.click(screen.getAllByRole('tab')[1]!);
    });
    expect(screen.getByText('+50.00')).toBeTruthy();
    expect(screen.getByText('-50.00')).toBeTruthy();
    // Settle tab: Ali pays You 50.00.
    await act(async () => {
      fireEvent.click(screen.getAllByRole('tab')[2]!);
    });
    const settleRow = screen.getByText('Ali').closest('div')!;
    expect(settleRow.textContent).toContain('You');
    expect(settleRow.textContent).toContain('50.00');
    expect(screen.getByRole('button', { name: '✓ Settle' })).toBeTruthy();
  });

  it('mark-as-settled: confirm → balances clear, celebration, toast', async () => {
    window.localStorage.setItem(
      'splitSettleGroups',
      JSON.stringify([
        {
          id: 'g1',
          name: 'Dubai Trip',
          emoji: '✈️',
          members: ['You', 'Ali'],
          expenses: [
            {
              id: 'e1',
              description: 'Hotel',
              amount: 100,
              currency: 'IRR',
              paidBy: 'You',
              splitBetween: ['You', 'Ali'],
              date: new Date().toISOString(),
              hasPhoto: false,
              isSettlement: false,
            },
          ],
          settlements: [],
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { Settle } = await loadSettle();
    render(<Settle />);
    await act(async () => {
      fireEvent.click(screen.getByText('Dubai Trip').closest('[role="button"]')!);
    });
    // Straight to the settle tab.
    await act(async () => {
      fireEvent.click(screen.getAllByRole('tab')[2]!);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '✓ Settle' }));
    });
    // The suggestion cleared → the celebration line; the toast fires.
    expect(screen.getByText('All settled up!')).toBeTruthy();
    expect(screen.getByText('✅ Payment marked as settled!')).toBeTruthy();
    // Balances cleared too (the settlement cancels the pair exactly).
    await act(async () => {
      fireEvent.click(screen.getAllByRole('tab')[1]!);
    });
    expect(screen.queryByText('-50.00')).toBeNull();
    expect(screen.getAllByText('0.00')).toHaveLength(2);
  });
});
