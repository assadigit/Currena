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

/**
 * Identity key for one entry — stable across re-reads and array shifts
 * (timestamp + pair + amount; results are deterministic given those).
 */
export function historyEntryId(entry: HistoryEntry): string {
  return `${entry.timestamp}|${entry.from}|${entry.to}|${entry.amount}`;
}

/**
 * Remove one entry, matched by identity (NOT by index — indices shift when
 * several deletes are in flight, which used to remove the wrong row).
 * No-op when the entry is already gone (double-fire, other tab).
 */
export function removeHistoryEntry(target: HistoryEntry): HistoryEntry[] {
  const entries = readHistory();
  const id = historyEntryId(target);
  const index = entries.findIndex((entry) => historyEntryId(entry) === id);
  if (index === -1) return entries;
  const next = entries.filter((_, i) => i !== index);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[history] cannot persist history deletion:', err);
  }
  return next;
}

/** CSV export (RFC 4180-ish; every field is numeric/code/ISO — no escaping needed). */
export function historyToCsv(entries: readonly HistoryEntry[]): string {
  const header = 'timestamp,from,to,amount,result,rate,source,cached';
  const lines = entries.map((e) =>
    [
      e.timestamp,
      e.from,
      e.to,
      String(e.amount),
      String(e.result),
      String(e.rate),
      e.source,
      e.is_cached ? 'yes' : 'no',
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

/** Download the CSV as a Blob (no dependency — plain text, BOM for Excel). */
export function downloadHistoryCsv(entries: readonly HistoryEntry[]): void {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T-]/g, '');
  const blob = new Blob([`\uFEFF${historyToCsv(entries)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `currena-history-${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
