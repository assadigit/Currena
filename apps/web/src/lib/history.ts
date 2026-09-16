/**
 * Conversion history — localStorage schema from the legacy app
 * (FEATURE_MAP §6): key `conversionHistory`, newest first, capped at 50.
 *
 * Phase 5a writes entries from the converter; the history route (5b) reads
 * them. Field names keep the legacy shape; `source` carries our internal
 * source codes ('tgju' | 'frankfurter' | 'manual' | 'local') and `is_cached`
 * maps to "served beyond the freshness window" (stale/cache/offline).
 */

export const HISTORY_KEY = 'conversionHistory';
export const HISTORY_CAP = 50;

export interface HistoryEntry {
  amount: number;
  from: string;
  to: string;
  result: number;
  rate: number;
  source: string;
  is_cached: boolean;
  /** ISO datetime of the snapshot the rate came from. */
  fetchedAt: string | null;
  /** ISO datetime of the conversion itself. */
  timestamp: string;
}

export function readHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is HistoryEntry =>
        entry instanceof Object &&
        typeof (entry as HistoryEntry).amount === 'number' &&
        typeof (entry as HistoryEntry).from === 'string' &&
        typeof (entry as HistoryEntry).to === 'string',
    );
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  try {
    const next = [entry, ...readHistory()].slice(0, HISTORY_CAP);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[history] cannot persist conversion history:', err);
  }
}
