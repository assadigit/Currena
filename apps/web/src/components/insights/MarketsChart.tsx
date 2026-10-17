/**
 * MarketsChart — the world-markets detail panel's 52-week line chart
 * (insights-world-markets-spec.md §6.5).
 *
 * The house chart pattern (TrendChart/HistoryChart): ONE stretched SVG
 * (preserveAspectRatio="none" + non-scaling stroke) for the line, while
 * every text — axis ticks — renders as HTML around it, so the non-uniform
 * stretch can never distort glyphs. Time runs LEFT TO RIGHT even in Farsi
 * (spec §6.5: the caller wraps this component in dir="ltr"); dates
 * format in the page's number locale (fa-IR → Persian digits + Solar
 * Hijri via Intl) and in UTC so a day never shifts at Tehran's +3:30.
 *
 * Zero dependencies, zero fetches: the weekly series rides the snapshot.
 * Accessibility: one focusable role="img" whose label names the span
 * (high, low, last close) — the meaning never rides on colour alone.
 */

import { useMemo } from 'react';
import { formatNumber } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

const PLOT_W = 320;
const PLOT_H = 96;

function epochDayToDate(day: number): Date {
  return new Date(day * 86_400_000);
}

export function MarketsChart({
  weekly,
  close,
  high52w,
  low52w,
  copy,
  numberLocale,
}: {
  /** Decoded [epochDay, close] pairs (oldest first). */
  weekly: readonly [number, number][];
  close: number;
  high52w: number;
  low52w: number;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const geometry = useMemo(() => {
    if (weekly.length < 2) return null;
    const firstDay = weekly[0]![0];
    const lastDay = weekly[weekly.length - 1]![0];
    const span = Math.max(1, lastDay - firstDay);
    // The Y scale spans the chart's own values with the close included —
    // a hair of padding keeps the line off the box edge.
    let min = Infinity;
    let max = -Infinity;
    for (const [, v] of weekly) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const pad = (max - min) * 0.04 || max * 0.001 || 1;
    min -= pad;
    max += pad;
    const scaleY = (v: number): number => PLOT_H - ((v - min) / (max - min)) * PLOT_H;
    const scaleX = (day: number): number => ((day - firstDay) / span) * PLOT_W;
    const points = weekly.map(([day, v]) => [scaleX(day), scaleY(v)] as const);
    // A 1-unit top pad keeps the stroke visible at the extremes.
    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${Math.max(1, Math.min(PLOT_H - 1, y)).toFixed(2)}`).join(' ');
    const area = `${line} L${PLOT_W} ${PLOT_H} L0 ${PLOT_H} Z`;
    return { points, line, area, firstDay, lastDay, min, max };
  }, [weekly]);

  if (geometry === null) {
    return <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{copy.ui.na}</p>;
  }

  const num = (n: number): string =>
    formatNumber(n, numberLocale, { maximumFractionDigits: n >= 1000 ? 0 : 1 });

  // X ticks: ~5 evenly spaced DATES (quarters of the window).
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const day = geometry.firstDay + (geometry.lastDay - geometry.firstDay) * f;
    return {
      left: `${f * 100}%`,
      label: new Intl.DateTimeFormat(numberLocale, {
        year: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }).format(epochDayToDate(Math.round(day))),
    };
  });

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{copy.markets.chartAria}</figcaption>
      <div
        role="img"
        aria-label={`${copy.markets.chartAria}: ${copy.markets.high52wLabel} ${num(high52w)}, ${copy.markets.low52wLabel} ${num(low52w)}, ${copy.markets.lastCloseLabel} ${num(close)}`}
        tabIndex={0}
        className="insights-focusable flex w-full flex-col gap-1 rounded-[var(--radius-md)] bg-currena-soft/40 p-2 ring-1 ring-[var(--color-border)]"
      >
        <div className="flex w-full items-stretch gap-1.5">
          {/* Y labels: top = high, bottom = low (the chart's own span). */}
          <span className="flex w-14 shrink-0 flex-col justify-between py-0.5 text-end text-[0.62rem] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            <bdi dir="ltr">{num(Math.max(...weekly.map((w) => w[1])))}</bdi>
            <bdi dir="ltr">{num(Math.min(...weekly.map((w) => w[1])))}</bdi>
          </span>
          {/* The plot: stretched SVG + non-scaling stroke. */}
          <span className="relative block h-24 min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <path
                d={`M0 ${PLOT_H / 2} H${PLOT_W}`}
                stroke="var(--color-border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="3 4"
              />
              <path d={geometry.area} fill="var(--color-status-context)" opacity="0.1" />
              <path
                d={geometry.line}
                fill="none"
                stroke="var(--color-text-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
        </div>
        {/* X ticks as HTML under the plot (glyphs never stretch). */}
        <div className="flex w-full items-baseline gap-1.5 ps-[3.7rem] text-[0.62rem] tabular-nums text-[var(--color-text-tertiary)]">
          {xTicks.map((t) => (
            <span key={t.left} className="min-w-0 flex-1 truncate text-center" style={{}}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
