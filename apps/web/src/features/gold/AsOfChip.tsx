/**
 * AsOfChip — the ONE freshness grammar (GUX-S5 M2, 11 §6.4 / S4-D7).
 *
 * Every timestamp/freshness line on the gold page renders through this
 * micro-component: the as-of time (type-caption, tertiary ink, trailing
 * the block's title row) + the state suffix word (fresh / delayed /
 * stale / waiting — a word, never an icon rotation, never a new color)
 * + the cache qualifier (the shipped "last successful" wording).
 *
 * The rules it enforces (S4-D7):
 *  - data-quality states NEVER borrow market-signal colors (tertiary
 *    ink only — the unread state's dotted rim is the marker grammar,
 *    not the chip's);
 *  - ONE chip per data block (never per sub-row) — the caller owns
 *    that discipline;
 *  - the time string arrives pre-formatted by the caller (locale
 *    calendar + digits through @currena/core), the chip never formats.
 */

import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';

export type AsOfState = 'fresh' | 'delayed' | 'stale' | 'waiting';

const STATE_KEY: Readonly<Record<AsOfState, TranslationKey>> = {
  fresh: 'pd.gold.asOfChipFresh',
  delayed: 'pd.gold.asOfChipDelayed',
  stale: 'pd.gold.asOfChipStale',
  waiting: 'pd.gold.asOfChipWaiting',
};

export function AsOfChip({
  asOf,
  state,
  cached = false,
  className = '',
  'data-asof-chip': dataAttr,
}: {
  /** The pre-formatted as-of time (the caller formats for the locale). */
  asOf?: string;
  /** The freshness state word (omitted when the caller has no basis). */
  state?: AsOfState;
  /** The "(last successful)" qualifier — the shipped cache sentence. */
  cached?: boolean;
  className?: string;
  'data-asof-chip'?: string;
}): React.JSX.Element | null {
  const { t } = useI18n();
  const parts: string[] = [];
  if (asOf !== undefined && asOf !== '') parts.push(t('pd.gold.asOfChipTime', { time: asOf }));
  if (state !== undefined) parts.push(t(STATE_KEY[state]));
  if (cached) parts.push(`(${t('pd.gold.asOfChipCache')})`);
  if (parts.length === 0) return null;
  return (
    <p
      data-asof-chip={dataAttr ?? state ?? true}
      className={`m-0 text-[length:var(--type-caption)] font-normal leading-relaxed text-[var(--color-text-tertiary)] ${className}`}
    >
      {parts.join(' · ')}
    </p>
  );
}
