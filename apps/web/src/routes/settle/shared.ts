/**
 * settle/shared — the route's pure constants and helpers (Phase: WS-4
 * module split of the former Settle.tsx monolith — zero behavior change,
 * code moved verbatim). The data model itself lives in
 * lib/settle-storage.ts (the persistence layer) and the balance/settle
 * math in @currena/core settle.ts — this file only owns what the route's
 * own rendering needs.
 */

import { formatNumber } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import type { SettleGroup } from '../../lib/settle-storage';

/**
 * The group's dominant expense currency. Settlement records are denominated
 * in it instead of a hardcoded 'IRR' — a USD-ledger group used to label its
 * settlement transfers "IRR (Toman)" (balances themselves are single-ledger
 * legacy parity; this only fixes the record's currency label).
 */
export function groupCurrency(group: SettleGroup): CurrencyCode {
  const counts = new Map<CurrencyCode, number>();
  for (const e of group.expenses) counts.set(e.currency, (counts.get(e.currency) ?? 0) + 1);
  let best: CurrencyCode = 'IRR';
  let bestCount = -1;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

/** The 8 expense currencies the legacy offered (captured markup order). */
export const EXPENSE_CURRENCIES: readonly CurrencyCode[] = [
  'IRR', 'USD', 'EUR', 'AED', 'TRY', 'GBP', 'AUD', 'CAD',
];

/** Legacy emoji picker options. */
export const EMOJIS = ['✈️', '🏠', '👨‍👩‍👧‍👦', '🍕', '🎉', '💼', '🏖️', '🎓'] as const;

/** The route's shared text-input styling (moved verbatim). */
export const inputClass =
  'w-full rounded-[12px] border-2 border-gray-200 bg-white px-3.5 py-2.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none dark:border-white/10 dark:bg-[#222C3B]';

/** The route's 2-decimal money formatter (pure over numberLocale). */
export function fmt2(value: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(value, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
