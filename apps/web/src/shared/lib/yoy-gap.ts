/**
 * yoy-gap.ts — GPE R05 (S4-D1, the CPI shutdown-gap policy): the
 * point-of-use method label for a YoY reading computed against the
 * ADJACENT-MONTHS-AVERAGE base (the prior-year base month missing
 * upstream — the Oct-2025 US shutdown gap on FRED).
 *
 * Shared by every surface that renders such a reading's value — the
 * gold meter's CPI seat (GoldSeats.tsx) and the USA page's CPI card
 * (UsaTierCards.tsx) — so the disclosure can never drift between them
 * (C1's S4-D1 extension: the method named at point of use, not in a
 * distant footnote). Null when the reading did not use the gap base
 * (the common case — the flag auto-expires once the base month exists
 * again upstream).
 */

import type { IndicatorReading } from '@currena/core';
import { interpolate } from '../i18n';
import type { TranslationKey } from './locale';

/** Build the method sentence; null when the reading is not gap-based. */
export function yoyGapBaseLabel(
  reading: IndicatorReading,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
  numberLocale: 'en-US' | 'fa-IR',
): string | null {
  if (reading.yoyBaseMethod !== 'adjacent-months-average' || reading.asOf === null) return null;
  // The missing BASE month: the observation month minus one calendar
  // year (the Oct-2026 reading's missing base is Oct-2025 — «مهر ۱۴۰۴»
  // in the fa calendar). The month's first day, UTC, so the label never
  // shifts a month at a calendar edge.
  const asOf = new Date(`${reading.asOf}T00:00:00Z`);
  const baseMonth = new Date(Date.UTC(asOf.getUTCFullYear() - 1, asOf.getUTCMonth(), 1));
  const monthText = new Intl.DateTimeFormat(numberLocale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(baseMonth);
  return interpolate(t('pd.global.yoyGapBaseLabel'), { month: monthText });
}
