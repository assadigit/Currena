import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HISTORY_CAP,
  HISTORY_KEY,
  downloadHistoryCsv,
  historyEntryId,
  historyToCsv,
  readHistory,
  removeHistoryEntry,
  saveHistoryEntry,
  type HistoryEntry,
} from './history';

/** In-memory localStorage (the lib touches window.localStorage directly). */
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

function entry(over: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    amount: 100,
    from: 'USD',
    to: 'IRR',
    result: 230_500 * 100,
    rate: 230_500,
    source: 'tgju',
    is_cached: false,
    fetchedAt: '2026-09-24T10:00:00.000Z',
    timestamp: '2026-09-24T10:00:00.000Z',
    ...over,
  };
}

describe('readHistory', () => {
  it('returns [] for missing, corrupt, or non-array payloads', () => {
    expect(readHistory()).toEqual([]);
    storage.setItem(HISTORY_KEY, 'not json {{{');
    expect(readHistory()).toEqual([]);
    storage.setItem(HISTORY_KEY, '{"a":1}');
    expect(readHistory()).toEqual([]);
  });

  it('drops malformed entries and keeps valid ones', () => {
    storage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        entry(),
        { amount: 'nope', from: 'USD', to: 'IRR' }, // bad amount type
        'garbage',
        null,
        entry({ timestamp: '2026-09-24T11:00:00.000Z' }),
      ]),
    );
    const entries = readHistory();
    expect(entries).toHaveLength(2);
    expect(entries[1]!.timestamp).toBe('2026-09-24T11:00:00.000Z');
  });
});

describe('saveHistoryEntry', () => {
  it('prepends newest-first and caps at HISTORY_CAP', () => {
    for (let i = 0; i < HISTORY_CAP + 7; i++) {
      saveHistoryEntry(entry({ timestamp: new Date(1_700_000_000_000 + i * 1000).toISOString() }));
    }
    const entries = readHistory();
    expect(entries).toHaveLength(HISTORY_CAP);
    // The newest 50 survive, oldest dropped.
    expect(entries[0]!.timestamp).toBe(new Date(1_700_000_000_000 + 56 * 1000).toISOString());
    expect(entries[entries.length - 1]!.timestamp).toBe(new Date(1_700_000_000_000 + 7 * 1000).toISOString());
  });

  it('survives quota errors without throwing (best-effort persist)', () => {
    const throwing: Storage = {
      ...storage,
      setItem: () => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      },
    };
    vi.stubGlobal('window', { localStorage: throwing });
    expect(() => saveHistoryEntry(entry())).not.toThrow();
  });
});

describe('removeHistoryEntry — identity-based delete (regression: index race)', () => {
  it('removes the targeted entry even when other deletes shifted the array', () => {
    const a = entry({ timestamp: '2026-09-24T10:00:00.000Z', amount: 10 });
    const b = entry({ timestamp: '2026-09-24T09:00:00.000Z', amount: 20 });
    const c = entry({ timestamp: '2026-09-24T08:00:00.000Z', amount: 30 });
    storage.setItem(HISTORY_KEY, JSON.stringify([a, b, c]));

    // The OLD bug: two rapid deletes captured indices 1 and 2; deleting
    // index 1 first shifted 2→1 and the second delete removed the WRONG row.
    // Identity-based deletes must both hit their targets.
    expect(removeHistoryEntry(b)).toEqual([a, c]);
    expect(removeHistoryEntry(c)).toEqual([a]);
    expect(readHistory()).toEqual([a]);
  });

  it('is a no-op when the entry is already gone (double-fire / other tab)', () => {
    const a = entry();
    storage.setItem(HISTORY_KEY, JSON.stringify([a]));
    removeHistoryEntry(a);
    expect(removeHistoryEntry(a)).toEqual([]); // second fire misses cleanly
    expect(readHistory()).toEqual([]);
  });

  it('distinguishes duplicate-looking entries by full identity', () => {
    const sameMoment = entry({ timestamp: '2026-09-24T10:00:00.000Z', amount: 10 });
    const sameMomentOtherPair = entry({
      timestamp: '2026-09-24T10:00:00.000Z',
      amount: 10,
      from: 'EUR',
      to: 'IRR',
    });
    storage.setItem(HISTORY_KEY, JSON.stringify([sameMoment, sameMomentOtherPair]));
    expect(removeHistoryEntry(sameMomentOtherPair)).toEqual([sameMoment]);
  });

  it('historyEntryId is stable across JSON round-trips', () => {
    const original = entry();
    const revived = JSON.parse(JSON.stringify(original)) as HistoryEntry;
    expect(historyEntryId(revived)).toBe(historyEntryId(original));
  });
});

describe('CSV export', () => {
  it('renders the header + one row per entry with the legacy column order', () => {
    const csv = historyToCsv([
      entry({ is_cached: true, timestamp: '2026-09-24T10:00:00.000Z', amount: 2, result: 461_000, rate: 230_500 }),
    ]);
    expect(csv).toBe(
      'timestamp,from,to,amount,result,rate,source,cached\n' +
        '2026-09-24T10:00:00.000Z,USD,IRR,2,461000,230500,tgju,yes',
    );
  });
});

describe('downloadHistoryCsv', () => {
  it('triggers a download with a BOM-prefixed CSV blob (no crash, URL revoked)', () => {
    const urls: string[] = [];
    let createdObjectUrl = '';
    let clicked: HTMLAnchorElement | null = null;
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => {
        createdObjectUrl = `blob:fake-${urls.length}`;
        urls.push(createdObjectUrl);
        return createdObjectUrl;
      },
      revokeObjectURL: (url: string) => {
        expect(urls).toContain(url);
      },
    });
    const doc = {
      createElement: () => {
        const anchor = {
          href: '',
          download: '',
          click: () => {
            clicked = anchor as unknown as HTMLAnchorElement;
          },
        };
        return anchor;
      },
    };
    vi.stubGlobal('document', doc);

    downloadHistoryCsv([entry()]);
    expect(clicked).not.toBeNull();
    expect(clicked!.download).toMatch(/^currena-history-\d{8}\d{4}\.csv$/);
    expect(urls).toHaveLength(1);
  });
});
