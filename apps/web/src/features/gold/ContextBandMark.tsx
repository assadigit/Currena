/**
 * ContextBandMark — the context card's compact 10-year position band
 * (GUX-S6 M2, 12 §3.1's RatioCard: "the ratio's RangeBand + the compare
 * sentence"): the same band geometry the five-force cards wear
 * (SeatMark's 6px track + the 20–80 soft zone + the marker), at CONTEXT
 * strength.
 *
 * THE CONTEXT RULE (12 §3.1): context readings never vote — the marker
 * is NEUTRAL ink (the primary text tone, never a market hue, never an
 * impact ink). The position is carried in words by the card's own
 * position line; the mark is the geometry, not a verdict. Fail-closed:
 * no percentile10y, no mark (the caller guards, the component holds the
 * rule anyway).
 *
 * dir="ltr" root (the magnitude-axis rule, 11 §8: bands read left→right
 * in both locales — the .verdict-meter precedent).
 */

import { useI18n } from '../../shared/lib/locale';
import { formatNumber } from '@currena/core';

export function ContextBandMark({ percentile, label }: { percentile: number | undefined; label: string }): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  if (percentile === undefined || !Number.isFinite(percentile)) return null;
  const pct = Math.round(percentile * 100 * 100) / 100;
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 1 });

  return (
    <div
      dir="ltr"
      role="img"
      aria-label={`${label}: ${t('pd.gold.markBandAria', { p: num(pct) })}`}
      data-context-mark="band"
      data-context-mark-pct={pct}
      className="relative h-1.5 w-full rounded-full bg-[var(--color-border)]/60"
    >
      {/* The 20–80 soft zone (the typical band, the shared geometry). */}
      <span aria-hidden="true" className="absolute inset-y-0 rounded-full bg-[var(--color-border)]" style={{ insetInlineStart: '20%', width: '60%' }} data-mark-zone />
      {/* The marker — neutral ink (a context reading never votes). */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-text-secondary)] ring-2 ring-[var(--color-surface)]"
        style={{ insetInlineStart: `${Math.min(Math.max(pct, 0), 100)}%` }}
        data-mark-marker={pct}
      />
      <span className="sr-only">{t('pd.gold.markZoneAria')}</span>
    </div>
  );
}
