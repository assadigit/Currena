/**
 * Recent conversion pairs — one-tap recall on the converter.
 *
 * Persists the last distinct `from → to` directions in localStorage
 * (`currena:recent-pairs`, capped at 6). Written by the converter on every
 * successful conversion; read on mount. Same pattern as lib/history.ts:
 * corrupt storage fails soft to an empty list, never renders garbage.
 */

import { CURRENCIES } from '@currena/core';
import type { CurrencyCode } from '@currena/core';

export const RECENT_PAIRS_KEY = 'currena:recent-pairs';
export const RECENT_PAIRS_CAP = 6;

export interface RecentPair {
  from: CurrencyCode;
  to: CurrencyCode;
}

const KNOWN_CODES: ReadonlySet<string> = new Set(CURRENCIES.map((c) => c.code));

function isValidPair(value: unknown): value is RecentPair {
  return (
    value instanceof Object &&
    typeof (value as RecentPair).from === 'string' &&
    typeof (value as RecentPair).to === 'string' &&
    KNOWN_CODES.has((value as RecentPair).from) &&
    KNOWN_CODES.has((value as RecentPair).to)
  );
}

export function readRecentPairs(): RecentPair[] {
  try {
    const raw = window.localStorage.getItem(RECENT_PAIRS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPair).slice(0, RECENT_PAIRS_CAP);
  } catch {
    return [];
  }
}

/** Unshift the pair (dedup exact direction), keep the cap, best-effort persist. */
export function addRecentPair(from: string, to: string): void {
  if (!KNOWN_CODES.has(from) || !KNOWN_CODES.has(to)) return;
  try {
    const rest = readRecentPairs().filter((p) => !(p.from === from && p.to === to));
    const next = [{ from, to } as RecentPair, ...rest].slice(0, RECENT_PAIRS_CAP);
    window.localStorage.setItem(RECENT_PAIRS_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota — chips just won't persist.
  }
}
