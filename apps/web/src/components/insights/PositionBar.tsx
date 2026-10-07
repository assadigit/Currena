/**
 * PositionBar — the 10-year position of the current value (percentile of
 * the past decade's readings), with the rule's watched tail shaded so the
 * reader can see where "warning" lives (01-indicator-spec.md §4: every
 * threshold shown, no hidden math).
 *
 * Bidi decision: the bar is a VALUE axis (low → high), like the chart time
 * axes below it — it stays left-to-right in Farsi. Only the surrounding
 * labels mirror. (02-page-design-spec.md §7 keeps chart axes LTR; this is
 * the same analytical-reading decision applied to the percentile axis.)
 *
 * role="meter" with an explicit valuetext — screen readers hear "56 percent
 * of the last ten years were lower than this", not a bare number.
 */

import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';

export function PositionBar({
  percentile,
  zone,
  copy,
  numberLocale,
}: {
  /** 0–1: share of the past 10 years strictly below the current value. */
  percentile: number;
  /** The rule's watched fraction band, if it is a percentile rule. */
  zone: { from: number; to: number } | null;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const pct = Math.min(1, Math.max(0, percentile));
  const pctLabel = formatNumber(Math.round(pct * 100), numberLocale);
  const valueText = interpolate(copy.ui.positionValue, { pct: `${pctLabel}${copy.units.percent}` });
  return (
    <span className="mt-3 block">
      <span className="flex items-baseline justify-between gap-2 text-[0.7rem] text-currena-muted">
        <span>{copy.ui.position10y}</span>
        <bdi className="font-semibold tabular-nums">{`${pctLabel}${copy.units.percent}`}</bdi>
      </span>
      <span dir="ltr" className="mt-1 block">
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          aria-valuetext={valueText}
          aria-label={copy.ui.position10y}
          className="relative block h-2 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10"
        >
          {zone ? (
            <span
              className="absolute inset-y-0 bg-currena-warning/25"
              style={{ left: `${zone.from * 100}%`, width: `${(zone.to - zone.from) * 100}%` }}
              aria-hidden="true"
            />
          ) : null}
          <span
            className="absolute inset-y-0 w-[3px] rounded-full bg-currena-dark/70 dark:bg-white/80"
            style={{ left: `calc(${pct * 100}% - 1.5px)` }}
            aria-hidden="true"
          />
        </span>
      </span>
    </span>
  );
}
