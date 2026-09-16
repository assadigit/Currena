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

export interface RateDelta {
  /** Current rate (units of `to` per 1 `from`). */
  current: number;
  /** Baseline rate from the previous snapshot generation. */
  previous: number;
}

export interface RateDeltaChipProps {
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
        className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white/50 ${
          size === 'sm' ? 'text-[0.65rem]' : 'text-xs'
        }`}
        title={t('liveRates.noChangeSincePrevious')}
      >
        — {t('common.noChange')}
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
        up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
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
