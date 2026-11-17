/**
 * settle-storage.ts (web) — the Split & Settle persistence layer.
 *
 * Extracted verbatim from routes/Settle.tsx (same localStorage shape, the
 * legacy key `splitSettleGroups`) so the multi-tab `storage` sync (BACKLOG
 * #38 — "History has it") has a testable home next to the other lib stores
 * and the route file owns rendering only. Receipt PHOTOS stay in IndexedDB
 * (photo-store) — only `hasPhoto` flags + group metadata live here.
 *
 * Cross-tab semantics (mirrors routes/History.tsx + lib/alerts.ts): when
 * another tab writes the key — or clears the whole storage area
 * (event.key === null) — the open Settle page re-reads and re-renders.
 * Corrupt storage fails soft to [] (never render garbage); persist is
 * best-effort (private mode / quota keeps the in-session state alive).
 */

import type { CurrencyCode } from '@currena/core';

export const SETTLE_GROUPS_KEY = 'splitSettleGroups';

export interface SettleExpense {
  id: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  paidBy: string;
  splitBetween: string[];
  /** ISO datetime. */
  date: string;
  /** Photo blob lives in IndexedDB under this expense's id. */
  hasPhoto: boolean;
  isSettlement: boolean;
}

export interface SettleGroup {
  id: string;
  name: string;
  emoji: string;
  members: string[];
  expenses: SettleExpense[];
  settlements: [];
  createdAt: string;
}

export function readSettleGroups(): SettleGroup[] {
  try {
    const raw = window.localStorage.getItem(SETTLE_GROUPS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g): g is SettleGroup => {
      if (!(g instanceof Object)) return false;
      const group = g as Partial<SettleGroup>;
      return (
        typeof group.id === 'string' &&
        typeof group.name === 'string' &&
        typeof group.emoji === 'string' &&
        Array.isArray(group.members) &&
        Array.isArray(group.expenses)
      );
    });
  } catch {
    return [];
  }
}

export function persistSettleGroups(groups: SettleGroup[]): void {
  try {
    window.localStorage.setItem(SETTLE_GROUPS_KEY, JSON.stringify(groups));
  } catch (err) {
    console.warn('[settle] cannot persist groups:', err);
  }
}

/**
 * Notify `onExternalWrite` when ANOTHER tab mutates the settle key (or
 * clears the storage area). Returns the unsubscribe function. The route
 * re-reads in the callback — same semantics as History's listener.
 */
export function subscribeSettleGroups(onExternalWrite: () => void): () => void {
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== SETTLE_GROUPS_KEY) return;
    onExternalWrite();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
