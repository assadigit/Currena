/**
 * useInsightsCopy — locale-aware access to the Insights copy corpus.
 *
 * Both locale modules load with the lazy /insights route chunk, so switching
 * language re-renders instantly from memory (scroll position and open cards
 * live in route state and survive). Returns the i18n number locale for the
 * Intl formatters alongside the dictionary.
 */

import { useI18n } from '../../lib/locale';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

interface InsightsCopyApi {
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}

export function useInsightsCopy(): InsightsCopyApi {
  const { locale, numberLocale } = useI18n();
  return {
    copy: locale === 'fa' ? insightsCopyFa : insightsCopyEn,
    locale,
    numberLocale,
  };
}
