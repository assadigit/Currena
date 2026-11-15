/**
 * Display helpers for currency codes.
 *
 * Owner rule (2026-09-17): every user-visible "IRR" must read
 * "IRR (Toman)" — the Toman unit stays explicit wherever a code is shown
 * (board cards, results, selects, copy/share text), because the raw ISO
 * code "IRR" formally means Rial and Iranian users think in Toman.
 * All other codes render as-is.
 *
 * Machine-facing data (CSV export, localStorage, deep links, API values)
 * keeps the raw code — only human-facing labels go through here.
 */

import type { CurrencyCode } from '@currena/core';
import { useI18n } from './locale';

/** Plain form — for non-hook contexts that already hold the i18n label. */
export function codeLabel(code: CurrencyCode | string, irrLabel: string): string {
  return code === 'IRR' ? irrLabel : code;
}

/**
 * Hook form — `const label = useCodeLabel(); label(entry.to)`.
 * Resolves the localized "IRR (Toman)" string via the i18n dictionary
 * (en: "IRR (Toman)", fa: "IRR (تومان)").
 */
export function useCodeLabel(): (code: CurrencyCode | string) => string {
  const { t } = useI18n();
  return (code) => codeLabel(code, t('currencies.irrLabel'));
}
