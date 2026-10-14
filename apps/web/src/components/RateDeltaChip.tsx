/**
 * RateDeltaChip — ▲/▼/— pill showing how a rate moved since the previous
 * snapshot generation (see snapshot-store's `previous` baseline).
 *
 * Green ▲ when the rate rose, red ▼ when it fell, muted "no change" when
 * identical. Hidden entirely (null) when no baseline exists. Percent uses
 * 2 significant decimals; the absolute delta uses the caller's precision.
 */

import { formatNumber } from '@currena/core';
import { useI18n } from '../lib/locale';

interface RateDelta {
  /** Current rate (units of `to` per 1 `from`). */
  current: number;
  /** Baseline rate from the previous snapshot generation. */
  previous: number;
}

interface RateDeltaChipProps {
  delta: RateDelta;
  /** Maximum fraction digits for the absolute delta (0 for IRR pairs). */
  decimals?: number;
  /** `sm` fits inside dense rows (live-rates cards). */
  size?: 'sm' | 'md';
}

export function RateDeltaChip({ delta, decimals = 0, size = 'md' }: RateDeltaChipProps) {
  const { t, numberLocale } = useI18n();
  const diff = delta.current - delta.previous;
  if (diff === 0) {
    return (
      <span
        /* WCAG 1.4.3 (owner audit 2026-09-20): the muted "no change" text
         * was ~4.0:1 on the pill's translucent-gray surface (and ~4.5:1 in
         * dark mode) — under AA on the lightest placements. Fixed explicit
         * grays: #374151 ≈ 8.6:1 on the light pill, #D1D5DB ≈ 8.0:1 on the
         * dark pill, at every placement (the up/down chips already passed). */
        className={`inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2 py-0.5 font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-300 ${
          size === 'sm' ? 'text-[0.65rem]' : 'text-xs'
        }`}
        title={t('liveRates.noChangeSincePrevious')}
      >
        {t('common.noChange')}
      </span>
    );
  }
  const up = diff > 0;
  const pct = (diff / delta.previous) * 100;
  const pctText = formatNumber(Math.abs(pct), numberLocale, { maximumFractionDigits: 2 });
  const diffText = formatNumber(Math.abs(diff), numberLocale, { maximumFractionDigits: decimals });
  return (
    <span
      title={t('liveRates.changedSincePrevious')}
      className={`inline-flex items-center gap-1 rounded-full font-bold ${
        up
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-500/15 text-red-600 dark:text-red-400'
      } ${size === 'sm' ? 'px-2 py-0.5 text-[0.65rem]' : 'px-2.5 py-1 text-xs'}`}
      dir="ltr"
    >
      {up ? '▲' : '▼'} {diffText}{' '}
      <span className="opacity-70">
        ({pctText}%)
      </span>
    </span>
  );
}
