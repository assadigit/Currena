/**
 * recent-pairs unit tests (BACKLOG #29 remainder). House pattern
 * (history.test.ts): in-memory localStorage stub, corrupt-input
 * degradation, dedupe/order semantics, cap, best-effort persist.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENCIES } from '@currena/core';

import { RECENT_PAIRS_CAP, RECENT_PAIRS_KEY, addRecentPair, readRecentPairs } from './recent-pairs';

function stubLocalStorage(): Storage {
  const map = new Map<string, string>();
  const storage: Storage = {
    get length(): number {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
  vi.stubGlobal('window', { localStorage: storage });
  return storage;
}

let storage: Storage;

beforeEach(() => {
  storage = stubLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readRecentPairs', () => {
  it('returns [] for missing, corrupt, or non-array payloads', () => {
    expect(readRecentPairs()).toEqual([]);
    storage.setItem(RECENT_PAIRS_KEY, 'not json {{{');
    expect(readRecentPairs()).toEqual([]);
    storage.setItem(RECENT_PAIRS_KEY, '{"from":"USD"}');
    expect(readRecentPairs()).toEqual([]);
  });

  it('drops pairs with unknown currency codes and keeps valid ones', () => {
    storage.setItem(
      RECENT_PAIRS_KEY,
      JSON.stringify([
        { from: 'USD', to: 'IRR' },
        { from: 'XXY', to: 'EUR' }, // not one of core's 17 codes
        { from: 'usd', to: 'EUR' }, // case-sensitive
        'garbage',
        null,
        { from: 'EUR', to: 'GBP' },
      ]),
    );
    expect(readRecentPairs()).toEqual([
      { from: 'USD', to: 'IRR' },
      { from: 'EUR', to: 'GBP' },
    ]);
  });

  it('trims oversized persisted lists to the cap (legacy of an older cap change)', () => {
    const many = Array.from({ length: RECENT_PAIRS_CAP + 4 }, (_, i) => ({
      from: CURRENCIES[i % CURRENCIES.length]!.code,
      to: CURRENCIES[(i + 1) % CURRENCIES.length]!.code,
    }));
    storage.setItem(RECENT_PAIRS_KEY, JSON.stringify(many));
    expect(readRecentPairs()).toHaveLength(RECENT_PAIRS_CAP);
  });
});

describe('addRecentPair', () => {
  it('unshifts newest-first and persists', () => {
    addRecentPair('USD', 'IRR');
    addRecentPair('EUR', 'GBP');
    expect(readRecentPairs()).toEqual([
      { from: 'EUR', to: 'GBP' },
      { from: 'USD', to: 'IRR' },
    ]);
    const persisted = JSON.parse(storage.getItem(RECENT_PAIRS_KEY) ?? '[]');
    expect(persisted).toHaveLength(2);
  });

  it('re-recalling a pair moves it to the front (dedupe exact direction)', () => {
    addRecentPair('USD', 'IRR');
    addRecentPair('EUR', 'GBP');
    addRecentPair('USD', 'IRR'); // recall → moved, not duplicated
    expect(readRecentPairs()).toEqual([
      { from: 'USD', to: 'IRR' },
      { from: 'EUR', to: 'GBP' },
    ]);
  });

  it('treats the reverse direction as a distinct pair', () => {
    addRecentPair('USD', 'EUR');
    addRecentPair('EUR', 'USD');
    expect(readRecentPairs()).toEqual([
      { from: 'EUR', to: 'USD' },
      { from: 'USD', to: 'EUR' },
    ]);
  });

  it('enforces the cap — the oldest distinct direction falls off', () => {
    // 8 distinct directions (a → a+1 over 8 codes) — 2 more than the cap.
    const codes = CURRENCIES.slice(0, 8).map((c) => c.code);
    for (let i = 0; i < 8; i++) {
      addRecentPair(codes[i]!, codes[(i + 1) % 8]!);
    }
    const pairs = readRecentPairs();
    expect(pairs).toHaveLength(RECENT_PAIRS_CAP);
    // The last-added pair is at the front; the first-added fell off.
    expect(pairs[0]).toEqual({ from: codes[7]!, to: codes[0]! });
    expect(pairs).not.toContainEqual({ from: codes[0]!, to: codes[1]! });
  });

  it('ignores unknown codes without writing', () => {
    addRecentPair('USD', 'IRR');
    addRecentPair('XXY', 'EUR');
    expect(readRecentPairs()).toEqual([{ from: 'USD', to: 'IRR' }]);
  });

  it('survives quota errors without throwing (best-effort persist)', () => {
    const throwing: Storage = {
      ...storage,
      setItem: () => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      },
    };
    vi.stubGlobal('window', { localStorage: throwing });
    expect(() => addRecentPair('USD', 'IRR')).not.toThrow();
    expect(storage.getItem(RECENT_PAIRS_KEY)).toBeNull();
  });
});
