/**
 * chart-range.ts unit tests (I13) — the remembered zoom level:
 * strict parsing (unknown values fall back to '10y'), fail-open
 * storage reads/writes, and the write-through on every choice.
 *
 * Environment: the same in-memory window/localStorage stubbing pattern as
 * snapshot-store.test.ts (the web vitest runs in a bare Node context).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { parseChartRange, readChartRange, writeChartRange, CHART_RANGE_VALUES } from './chart-range';

const KEY = 'currena:insights:chart-range';

/** In-memory Storage (snapshot-store.test.ts pattern). */
function stubLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: () => null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

let storage: Storage;
/** Models a browser that BLOCKS storage (private mode): every call throws. */
const throwingStorage = (): Storage =>
  ({
    get length(): number {
      throw new Error('denied');
    },
    clear: () => {
      throw new Error('denied');
    },
    getItem: () => {
      throw new Error('denied');
    },
    key: () => {
      throw new Error('denied');
    },
    removeItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  }) as Storage;

let hadWindow = false;

function installWindow(s: Storage): void {
  hadWindow = 'window' in globalThis;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: s },
  });
}

afterEach(() => {
  if (!hadWindow) delete (globalThis as { window?: unknown }).window;
});

describe('parseChartRange', () => {
  it('accepts exactly the three I9 range tokens', () => {
    expect(CHART_RANGE_VALUES).toEqual(['10y', '5y', '1y']);
    expect(parseChartRange('10y')).toBe('10y');
    expect(parseChartRange('5y')).toBe('5y');
    expect(parseChartRange('1y')).toBe('1y');
  });

  it('falls back to the 10-year default on anything unknown', () => {
    for (const junk of [null, '', '2y', '10Y', 'undefined', '{"zoom":true}', '١٠y']) {
      expect(parseChartRange(junk)).toBe('10y');
    }
  });
});

describe('readChartRange / writeChartRange', () => {
  it('round-trips a reader-chosen range', () => {
    storage = stubLocalStorage();
    installWindow(storage);
    writeChartRange('5y');
    expect(storage.getItem(KEY)).toBe('5y');
    expect(readChartRange()).toBe('5y');
    writeChartRange('1y');
    expect(readChartRange()).toBe('1y');
  });

  it('reads the default when nothing is stored yet', () => {
    installWindow(stubLocalStorage());
    expect(readChartRange()).toBe('10y');
  });

  it('fails OPEN: a throwing storage reads as the default and writes drop silently', () => {
    installWindow(throwingStorage());
    expect(readChartRange()).toBe('10y');
    expect(() => writeChartRange('5y')).not.toThrow();
  });
});
