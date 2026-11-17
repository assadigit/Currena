/**
 * receipt/shared — the route's pure types, constants, date helpers and
 * the live-totals computation (Phase: WS-4 module split of the former
 * Receipt.tsx monolith — zero behavior change, code moved verbatim).
 * Everything here is pure: no hooks, no store wiring; the shell and the
 * section modules import these so the form, the summary and the paper
 * can never drift apart on types or math.
 */

import { convert, parseAmount, sourceForPair } from '@currena/core';
import type { CurrencyCode, Snapshot, SnapshotSource } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Types & constants
 * ------------------------------------------------------------------ */

export const CATEGORY_IDS = ['transport', 'food', 'groceries', 'tickets', 'snacks', 'drinks', 'custom'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_EMOJI: Record<CategoryId, string> = {
  transport: '🚕',
  food: '🍔',
  groceries: '🛒',
  tickets: '🎫',
  snacks: '🍿',
  drinks: '🥤',
  custom: '✏️',
};

export interface ItemDraft {
  id: number;
  category: CategoryId;
  amount: string;
  currency: CurrencyCode;
  time: string;
  notes: string;
}

/** A generated receipt item — amounts are raw numbers, formatting at render. */
export interface ReceiptItem {
  category: string;
  emoji: string;
  amount: number;
  currency: CurrencyCode;
  notes: string;
  time: string;
}

export interface GeneratedReceipt {
  id: number;
  date: string;
  endDate: string | null;
  items: ReceiptItem[];
  total: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  converted: number | null;
  rate: number | null;
  timestamp: string;
}

/** The live summary's numbers over the current drafts (computeTotals). */
export interface ReceiptTotals {
  count: number;
  total: number;
  converted: number | null;
  rate: number | null;
}

/* ------------------------------------------------------------------ *
 * Date helpers (local-midnight semantics — timezone-safe rendering)
 * ------------------------------------------------------------------ */

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 'YYYY-MM-DD' → local-midnight ISO (timezone-safe for date rendering). */
export function dateToIso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return new Date().toISOString();
  return new Date(y, m - 1, d).toISOString();
}

/** The route's shared text-input styling (moved verbatim). */
export const inputClass =
  'w-full rounded-[12px] border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none dark:border-white/10 dark:bg-[#222C3B]';

/* ------------------------------------------------------------------ *
 * Live totals — LOCAL math over snapshots (mission §8: never a
 * POST /api/convert per keystroke)
 * ------------------------------------------------------------------ */

/** The minimal store slice the totals read (satisfied by the snapshot
 * store's state — structural, so the private StoreState stays private). */
export type TotalsStoreSlice = Readonly<Record<SnapshotSource, { snapshot: Snapshot | null }>>;

/**
 * Sum the valid drafts in the FROM currency — per-item currencies are
 * NORMALIZED through their own snapshot before summing (legacy summed
 * mixed currencies raw — a bug). An unusable snapshot degrades to the
 * legacy raw sum (offline honesty: the number keeps meaning "what the
 * user typed"); conversion failures degrade the same way.
 */
export function computeTotals(
  items: ItemDraft[],
  perItemCurrency: boolean,
  from: CurrencyCode,
  to: CurrencyCode,
  store: TotalsStoreSlice,
): ReceiptTotals {
  const parsed = items
    .map((item) => ({ item, value: parseAmount(item.amount) }))
    .filter((p): p is { item: ItemDraft; value: number } => p.value !== null && p.value > 0);

  let total = 0;
  for (const { item, value } of parsed) {
    const currency = perItemCurrency ? item.currency : from;
    if (currency === from) {
      total += value;
      continue;
    }
    const snapshot = store[sourceForPair(currency, from)].snapshot;
    if (!snapshot) {
      total += value; // degrade to legacy behavior (raw sum) when offline
      continue;
    }
    try {
      total += convert(snapshot, currency, from, value).amount;
    } catch {
      total += value;
    }
  }

  let converted: number | null = null;
  let rate: number | null = null;
  if (from === to) {
    converted = total;
    rate = 1;
  } else {
    const snapshot = store[sourceForPair(from, to)].snapshot;
    if (snapshot) {
      try {
        converted = convert(snapshot, from, to, total).amount;
        rate = convert(snapshot, from, to, 1).rate;
      } catch {
        converted = null;
      }
    }
  }

  return { count: parsed.length, total, converted, rate };
}
