/**
 * alerts store unit tests (I14) — hydration, fail-open storage, the
 * add/remove/trigger/ack lifecycle, the cap, and cross-tab `storage`
 * events (the same listener BACKLOG #38 wants for Settle — proven here).
 *
 * Everything the store touches is faked: window/localStorage in-memory
 * (snapshot-store.test.ts pattern), plus the singleton's __resetForTests
 * seam for a clean store per test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALERTS_CAP } from '@currena/core';
import type { RateAlert } from '@currena/core';

import { ALERTS_KEY, ALERTS_SEEN_KEY, alertsStore } from './alerts';

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
    },
  });
}

const draft = {
  base: 'USD' as const,
  quote: 'IRR' as const,
  direction: 'above' as const,
  threshold: 280_000,
};

/** Simulate another tab's storage write reaching this tab's listener. */
const dispatchStorage = (key: string | null): void => {
  listeners.get('storage')?.({ key } as unknown as Event);
};

beforeEach(() => {
  installGlobals();
  alertsStore.__resetForTests();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

describe('boot hydration', () => {
  it('reads the persisted list and seen-stamp', () => {
    const alert: RateAlert = {
      id: 7,
      base: 'USD',
      quote: 'IRR',
      direction: 'above',
      threshold: 280_000,
      createdAt: 123,
    };
    storage.setItem(ALERTS_KEY, JSON.stringify([alert]));
    storage.setItem(ALERTS_SEEN_KEY, '999');
    expect(alertsStore.getState()).toEqual({ alerts: [alert], seenAt: 999, fired: [] });
  });

  it('degrades to empty on corrupt storage (fail-open)', () => {
    storage.setItem(ALERTS_KEY, '{corrupt');
    expect(alertsStore.getState().alerts).toEqual([]);
    expect(alertsStore.getState().seenAt).toBeNull();
  });

  it('boots only once (double getState does not re-read storage)', () => {
    storage.setItem(ALERTS_KEY, '[]');
    alertsStore.getState();
    storage.setItem(ALERTS_KEY, 'corrupt-after-boot');
    alertsStore.getState();
    expect(alertsStore.getState().alerts).toEqual([]);
  });
});

describe('add / remove lifecycle', () => {
  it('adds newest-first and persists', () => {
    expect(alertsStore.add(draft)).toBe(true);
    expect(alertsStore.add({ ...draft, base: 'EUR', threshold: 60_000 })).toBe(true);
    const state = alertsStore.getState();
    expect(state.alerts.map((a) => a.base)).toEqual(['EUR', 'USD']);
    expect(state.alerts[0]?.triggeredAt).toBeUndefined();
    const persisted = JSON.parse(storage.getItem(ALERTS_KEY) ?? '[]') as RateAlert[];
    expect(persisted).toHaveLength(2);
  });

  it('enforces the cap (ALERTS_CAP) and reports failure', () => {
    for (let i = 0; i < ALERTS_CAP; i++) expect(alertsStore.add(draft)).toBe(true);
    expect(alertsStore.getState().alerts).toHaveLength(ALERTS_CAP);
    expect(alertsStore.add(draft)).toBe(false);
    expect(alertsStore.getState().alerts).toHaveLength(ALERTS_CAP);
  });

  it('removes by id and persists the remainder', () => {
    alertsStore.add(draft);
    const id = alertsStore.getState().alerts[0]?.id as number;
    alertsStore.add({ ...draft, base: 'GBP' });
    alertsStore.remove(id);
    const state = alertsStore.getState();
    expect(state.alerts).toHaveLength(1);
    expect(state.alerts[0]?.base).toBe('GBP');
    expect((JSON.parse(storage.getItem(ALERTS_KEY) ?? '[]') as RateAlert[]).map((a) => a.base)).toEqual(['GBP']);
  });
});

describe('markFired (crossing stamp + toast feed)', () => {
  it('stamps triggeredAt/triggeredRate, persists and feeds the toast queue', () => {
    alertsStore.add(draft);
    const id = alertsStore.getState().alerts[0]?.id as number;
    alertsStore.markFired(id, 281_111, 42_000);
    const state = alertsStore.getState();
    expect(state.alerts[0]?.triggeredAt).toBe(42_000);
    expect(state.alerts[0]?.triggeredRate).toBe(281_111);
    expect(state.fired.map((f) => f.id)).toEqual([id]);
    const persisted = JSON.parse(storage.getItem(ALERTS_KEY) ?? '[]') as RateAlert[];
    expect(persisted[0]?.triggeredAt).toBe(42_000);
  });

  it('is idempotent — a second fire for the same id is a no-op', () => {
    alertsStore.add(draft);
    const id = alertsStore.getState().alerts[0]?.id as number;
    alertsStore.markFired(id, 281_111, 42_000);
    alertsStore.markFired(id, 299_999, 90_000);
    const state = alertsStore.getState();
    expect(state.alerts[0]?.triggeredAt).toBe(42_000); // first stamp wins
    expect(state.alerts[0]?.triggeredRate).toBe(281_111);
    expect(state.fired).toHaveLength(1);
  });
});

describe('ackAll (badge semantics)', () => {
  it('stamps seenAt, persists it and clears the toast feed', () => {
    vi.spyOn(Date, 'now').mockReturnValue(777_000);
    alertsStore.add(draft);
    const id = alertsStore.getState().alerts[0]?.id as number;
    alertsStore.markFired(id, 281_111, 700_000);
    expect(alertsStore.getState().fired).toHaveLength(1);
    alertsStore.ackAll();
    expect(alertsStore.getState().seenAt).toBe(777_000);
    expect(alertsStore.getState().fired).toEqual([]);
    expect(storage.getItem(ALERTS_SEEN_KEY)).toBe('777000');
    vi.mocked(Date.now).mockRestore();
  });
});

describe('cross-tab storage events', () => {
  it('re-hydrates when another tab writes the list', () => {
    alertsStore.getState(); // boot + register the listener
    const otherTabAlert: RateAlert = {
      id: 55,
      base: 'EUR',
      quote: 'USD',
      direction: 'below',
      threshold: 1.05,
      createdAt: 5,
    };
    storage.setItem(ALERTS_KEY, JSON.stringify([otherTabAlert]));
    dispatchStorage(ALERTS_KEY);
    expect(alertsStore.getState().alerts).toEqual([otherTabAlert]);
  });

  it('ignores unrelated keys', () => {
    alertsStore.getState();
    storage.setItem(ALERTS_KEY, '[]');
    dispatchStorage('currena:recent-pairs');
    expect(alertsStore.getState().alerts).toEqual([]);
  });

  it('picks up a seen-stamp written by another tab', () => {
    alertsStore.getState();
    storage.setItem(ALERTS_SEEN_KEY, '123456');
    dispatchStorage(ALERTS_SEEN_KEY);
    expect(alertsStore.getState().seenAt).toBe(123_456);
  });
});
