/**
 * PositionBar — the 10-year position of the current value (percentile of
 * the past decade's readings) with the rule's alert zone TICKED and
 * LABELLED (Block F3 + G4: "Do not use color alone to show a range zone.
 * Add a visible tick and a text label to every range zone"), and the
 * position WORD beside the bar (F3: "Put the word beside the bar, not at
 * the opposite end of the card"). Both bar ends are labelled in Persian/
 * English (G9: "کم‌ترین در ۱۰ سال" / "بیشترین در ۱۰ سال").
 *
 * Bidi decision (G9, unchanged since I4): the bar is a VALUE axis (low →
 * high) — it stays left-to-right in Farsi. Only the surrounding labels
 * mirror.
 *
 * role="meter" with an explicit valuetext — screen readers hear "56 percent
 * of the last ten years were lower than this", not a bare number.
 */

import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { ConsequenceLines } from '../../i18n/insights-copy-en';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import { positionBand, type PositionBand } from './config';

export function PositionBar({
  percentile,
  zone,
  copy,
  numberLocale,
  isPrice,
}: {
  /** 0–1: share of the past 10 years strictly below the current value. */
  percentile: number;
  /** The rule's watched fraction band, if it is a percentile rule. */
  zone: { from: number; to: number } | null;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** Price rows use cheap/normal/expensive wording (data spec §4). */
  isPrice?: boolean;
}) {
  const pct = Math.min(1, Math.max(0, percentile));
  const pctLabel = formatNumber(Math.round(pct * 100), numberLocale);
  const valueText = interpolate(copy.ui.positionValue, { pct: `${pctLabel}${copy.units.percent}` });
  const band: PositionBand = positionBand(pct);
  const word = isPrice
    ? band === 'low'
      ? copy.ui.pricePositionLow
      : band === 'high'
        ? copy.ui.pricePositionHigh
        : copy.ui.pricePositionTypical
    : copy.ui[`position${band[0]!.toUpperCase()}${band.slice(1)}` as 'positionLow' | 'positionTypical' | 'positionHigh'];
  return (
    <span className="mt-3 block">
      <span className="flex items-baseline justify-between gap-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
        <span>{copy.ui.position10y}</span>
        {/* F3: the position WORD rides beside the value, not the far end. */}
        <span className="flex items-baseline gap-2">
          <bdi className="font-semibold tabular-nums">{`${pctLabel}${copy.units.percent}`}</bdi>
          <span className="font-bold text-[var(--color-text-primary)]">{word}</span>
        </span>
      </span>
      <span dir="ltr" className="mt-1 block">
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          aria-valuetext={valueText}
          aria-label={copy.ui.position10y}
          className="relative block h-2.5 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10"
        >
          {zone ? (
            <>
              {/* G4/F3: the alert zone gets a TICK + a text label, never fill alone. */}
              <span
                className="absolute inset-y-0 bg-currena-warning/25"
                style={{ left: `${zone.from * 100}%`, width: `${(zone.to - zone.from) * 100}%` }}
                aria-hidden="true"
              />
              <span
                className="absolute inset-y-[2px] w-[2px] rounded-full bg-[var(--color-status-alert)]"
                style={{ left: `calc(${zone.from * 100}% - 1px)` }}
                aria-hidden="true"
              />
              <span
                className="absolute inset-y-[2px] w-[2px] rounded-full bg-[var(--color-status-alert)]"
                style={{ left: `calc(${zone.to * 100}% - 1px)` }}
                aria-hidden="true"
              />
            </>
          ) : null}
          <span
            className="absolute inset-y-0 w-[3px] rounded-full bg-currena-dark/70 dark:bg-white/80"
            style={{ left: `calc(${pct * 100}% - 1.5px)` }}
            aria-hidden="true"
          />
        </span>
        {/* G9: both ends labelled — LTR axis with localized end captions. */}
        <span className="mt-1 flex justify-between text-[var(--type-caption)] text-[var(--color-text-secondary)]">
          <span>{copy.ui.rangeEndLow}</span>
          <span>{zone ? copy.ui.alertZoneLabel : ''}</span>
          <span>{copy.ui.rangeEndHigh}</span>
        </span>
      </span>
      <span className="sr-only">{zone ? copy.ui.alertZoneLabel : null}</span>
    </span>
  );
}

export type { ConsequenceLines };
