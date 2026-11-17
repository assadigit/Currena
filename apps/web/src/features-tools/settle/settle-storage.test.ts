/**
 * settle-storage unit tests (BACKLOG #38 — the multi-tab `storage` sync
 * settling Wave 4's leftover; alerts.test.ts pattern, in-memory
 * window/localStorage + dispatched storage events).
 *
 * The suite covers the layer the Settle route delegates to: fail-soft
 * reads (corrupt storage never renders garbage), best-effort persist
 * (private mode / quota), and the cross-tab listener — including the
 * route's re-hydrate-on-foreign-write semantics end-to-end at the
 * storage layer.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SETTLE_GROUPS_KEY,
  persistSettleGroups,
  readSettleGroups,
  subscribeSettleGroups,
} from './settle-storage';
import type { SettleGroup } from './settle-storage';

/* ------------------------------------------------------------------ *
 * Environment stubs
 * ------------------------------------------------------------------ */

function stubLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
  } as Storage;
}

const listeners = new Map<string, EventListener>();
let storage: Storage;

function installGlobals(): void {
  storage = stubLocalStorage();
  listeners.clear();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: storage,
      addEventListener: (type: string, handler: EventListener) => listeners.set(type, handler),
      removeEventListener: (type: string) => listeners.delete(type),
    },
  });
}

/** Simulate another tab's storage write reaching this tab's listener. */
const dispatchStorage = (key: string | null): void => {
  listeners.get('storage')?.({ key } as unknown as Event);
};

function group(over: Partial<SettleGroup> = {}): SettleGroup {
  return {
    id: 'g1',
    name: 'Trip',
    emoji: '✈️',
    members: ['You', 'Ali'],
    expenses: [
      {
        id: 'e1',
        description: 'Dinner',
        amount: 120,
        currency: 'IRR',
        paidBy: 'You',
        splitBetween: ['You', 'Ali'],
        date: '2026-10-08T10:00:00.000Z',
        hasPhoto: false,
        isSettlement: false,
      },
    ],
    settlements: [],
    createdAt: '2026-10-07T09:00:00.000Z',
    ...over,
  };
}

beforeEach(() => {
  installGlobals();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

describe('readSettleGroups (fail-soft)', () => {
  it('returns [] for missing, corrupt, or non-array payloads', () => {
    expect(readSettleGroups()).toEqual([]);
    storage.setItem(SETTLE_GROUPS_KEY, 'not json {{{');
    expect(readSettleGroups()).toEqual([]);
    storage.setItem(SETTLE_GROUPS_KEY, '{"id":"g1"}');
    expect(readSettleGroups()).toEqual([]);
  });

  it('drops malformed groups and keeps valid ones (legacy shape)', () => {
    storage.setItem(
      SETTLE_GROUPS_KEY,
      JSON.stringify([
        group(),
        { id: 7, name: 'nope', emoji: '🏠', members: [], expenses: [] }, // id not a string
        'garbage',
        null,
        group({ id: 'g2', expenses: [] }),
      ]),
    );
    const groups = readSettleGroups();
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(groups[0]?.expenses[0]?.description).toBe('Dinner');
  });

  it('degrades to [] when localStorage access itself throws', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => {
            throw new DOMException('blocked', 'SecurityError');
          },
        },
      },
    });
    expect(readSettleGroups()).toEqual([]);
  });
});

describe('persistSettleGroups (best-effort)', () => {
  it('round-trips through readSettleGroups', () => {
    persistSettleGroups([group(), group({ id: 'g2' })]);
    expect(readSettleGroups().map((g) => g.id)).toEqual(['g1', 'g2']);
  });

  it('warns and does not throw on quota errors (session state lives on)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const throwing: Storage = {
      ...storage,
      setItem: () => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      },
    };
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: throwing },
    });
    expect(() => persistSettleGroups([group()])).not.toThrow();
    expect(warn).toHaveBeenCalledWith('[settle] cannot persist groups:', expect.any(DOMException));
    warn.mockRestore();
  });
});

describe('subscribeSettleGroups — cross-tab sync (BACKLOG #38)', () => {
  it('re-hydrates when another tab writes the settle key', () => {
    const otherTabGroup = group({ id: 'from-tab-b', name: 'Beach day' });
    // "Mount": the open Settle page hydrates once and owns its state…
    persistSettleGroups([group()]);
    let groups = readSettleGroups();
    const stop = subscribeSettleGroups(() => {
      // …the route's callback: re-read on a foreign write (Settle.tsx wiring).
      groups = readSettleGroups();
    });
    // Another tab replaces the whole list and the event arrives here.
    storage.setItem(SETTLE_GROUPS_KEY, JSON.stringify([otherTabGroup]));
    dispatchStorage(SETTLE_GROUPS_KEY);
    expect(groups).toEqual([otherTabGroup]); // this tab picked up tab B's state
    stop();
  });

  it('fires when the whole storage area is cleared (key === null)', () => {
    persistSettleGroups([group()]);
    let notified = false;
    const stop = subscribeSettleGroups(() => {
      notified = true;
    });
    storage.clear();
    dispatchStorage(null);
    expect(notified).toBe(true);
    expect(readSettleGroups()).toEqual([]);
    stop();
  });

  it('ignores unrelated keys (History, alerts, locale…)', () => {
    let notified = false;
    const stop = subscribeSettleGroups(() => {
      notified = true;
    });
    dispatchStorage('conversionHistory');
    dispatchStorage('currena:rate-alerts');
    dispatchStorage('currena:locale');
    expect(notified).toBe(false);
    stop();
  });

  it('detaches on unsubscribe — no further notifications', () => {
    let notified = 0;
    const stop = subscribeSettleGroups(() => {
      notified += 1;
    });
    dispatchStorage(SETTLE_GROUPS_KEY);
    stop();
    dispatchStorage(SETTLE_GROUPS_KEY);
    expect(notified).toBe(1);
    expect(listeners.has('storage')).toBe(false);
  });
});
