/**
 * The Level-2 pattern visuals (Phase 3-d split of the former
 * WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx): the 13 reliability dots (§9.3 Level 2 item 3)
 * and the two-line rebased chart (§9.3 Level 2 item 1).
 */

import { formatNumber } from '@currena/core';
import type { FxRuleState } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { interpolate } from '../../../i18n';
import { fxChartLineLabel } from '../../../lib/fx-presentation';

/* ------------------------------------------------------------------ *
 * The 13 dots (§9.3 Level 2 item 3) — time runs left to right, always
 * ------------------------------------------------------------------ */

export function Dots13({
  pattern,
  copy,
  numberLocale,
}: {
  pattern: FxRuleState['pattern'];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  return (
    <div>
      <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
        {copy.fx.dotsTitle}
      </p>
      {/* §9.6: the strip runs left→right even in Farsi — the end labels say so. */}
      <div dir="ltr" className="not-prose flex items-center gap-2">
        <span className="text-[0.62rem] font-semibold text-[var(--color-text-tertiary)]">{copy.fx.dotsEndStart}</span>
        <span aria-hidden="true" className="flex items-center gap-1" role="img">
          {pattern.weeks.map((held, i) =>
            held === null ? (
              <span
                key={i}
                className="inline-block h-[3px] w-[7px] rounded-full bg-[var(--color-text-tertiary)]/60"
              />
            ) : (
              <span
                key={i}
                className={`inline-block h-2 w-2 rounded-full ${
                  held
                    ? 'bg-[var(--color-text-primary)]'
                    : 'bg-transparent ring-1.5 ring-inset ring-[var(--color-text-primary)]/60'
                }`}
              />
            ),
          )}
        </span>
        <span className="text-[0.62rem] font-semibold text-[var(--color-text-tertiary)]">{copy.fx.dotsEndNow}</span>
      </div>
      <p className="m-0 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.66rem] text-[var(--color-text-tertiary)]">
        {/* §9.7: the dots are readable as text — count + legend. */}
        <span className="font-semibold text-[var(--color-text-secondary)]">
          {interpolate(copy.fx.reliabilityDetail, { k: num(pattern.agreeWeeks) })}
        </span>
        <span>
          ● {copy.fx.dotsLegendHeld} · ○ {copy.fx.dotsLegendNotHeld} · – {copy.fx.dotsLegendNoChange}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The two-line rebased chart (§9.3 Level 2 item 1)
 * ------------------------------------------------------------------ */

export function RebasedChart({
  series,
  expect,
  copy,
  locale,
  numberLocale,
}: {
  series: readonly { id: string; points: number[] }[];
  expect: 'together' | 'opposite';
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  if (series.length < 2) return null;
  const PLOT_W = 320;
  const PLOT_H = 96;
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    for (const v of s.points) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    max = min + 1;
  }
  const pad = (max - min) * 0.05 || 1;
  min -= pad;
  max += pad;
  const maxLen = Math.max(...series.map((s) => s.points.length));
  const scaleY = (v: number): number => PLOT_H - ((v - min) / (max - min)) * PLOT_H;
  const scaleX = (i: number, len: number): number => (len <= 1 ? 0 : (i / (len - 1)) * PLOT_W);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  // Solid vs dashed + direct labels — never colour alone (§9.3/§9.7).
  const solid = series[0]!;
  const dashed = series[1]!;
  const path = (s: { points: number[] }): string =>
    s.points
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i, s.points.length).toFixed(2)} ${Math.max(1, Math.min(PLOT_H - 1, scaleY(v))).toFixed(2)}`)
      .join(' ');
  return (
    <figure className="m-0">
      <div dir="ltr" className="not-prose relative">
        <svg
          viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
          preserveAspectRatio="none"
          className="h-24 w-full"
          role="img"
          aria-label={copy.fx.chartAria}
        >
          <path d={path(solid)} fill="none" stroke="var(--color-text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path
            d={path(dashed)}
            fill="none"
            stroke="var(--color-text-primary)"
            strokeWidth="2"
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
            opacity="0.85"
          />
          {series.length > 2 ? (
            <path
              d={path(series[2]!)}
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
        {/* v1.3 (CR §4.8): the caption says what the relationship means. */}
        <span>{expect === 'together' ? copy.fx.chartCaptionTogether : copy.fx.chartCaptionOpposite}</span>
        <span>{copy.fx.chartStartsAt100}</span>
        {/* v1.3 (CR §4.7): plain names + the window's change at each line's
         * end — never a raw code (fix B4). */}
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-[var(--color-text-primary)]" />
          <bdi>{fxChartLineLabel(solid.id, solid.points, copy.fx, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[var(--color-text-primary)]" />
          <bdi>{fxChartLineLabel(dashed.id, dashed.points, copy.fx, numberLocale, locale)}</bdi>
        </span>
        <span className="sr-only">
          {interpolate(copy.fx.chartAria, {})}, {num(maxLen)} points
        </span>
      </figcaption>
    </figure>
  );
}
