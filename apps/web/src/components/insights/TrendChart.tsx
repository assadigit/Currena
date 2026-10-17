/**
 * TrendChart — round 34 (owner): the round-33 Estimation charts grow real
 * X and Y axes and a hover inspector, and the money panel's rows wear the
 * SAME structure as mini charts ("add graphs with same structure … mini
 * graphs").
 *
 * One shared panel, two callers:
 *   - Signals.tsx VerdictStrip — the metals' own price history inside each
 *     Estimation chip (gold-usd / silver-usd), plot h-20.
 *   - MoneyPanel.tsx — a mini chart per money row, driven by the row's
 *     first chip (the indicator actually making the row speak), plot h-16.
 *     Round 35 (owner): the mini chart owns HALF the row's card — a 50/50
 *     grid with the row's data beside it — never full-width again.
 *
 * Structure (identical everywhere — the alignment rule):
 *   [ Y tick labels ] [ plot: gridlines + area/line svg + crosshair +
 *   hover dot + value/date tooltip + X tick labels ]
 *   [ range chips (quarter · 1 year · 5 years · — where a caller opts in
 *   — 10 years) … signed window delta ]
 *
 * Round 43 (owner): the DEFAULT range is per-caller — `defaultRange`
 * (quarter everywhere by default; the money panel passes '1y' — "the
 * default time frame for this section must be annual"). An explicit
 * click still wins for the session; plottability still gates the chips.
 *
 * Zero dependencies (the house Sparkline/HistoryChart pattern): the plot
 * is one stretched SVG (preserveAspectRatio="none" + non-scaling stroke)
 * for the line/area, while EVERY text — axis ticks and tooltip — renders
 * as HTML around it, so the non-uniform stretch can never distort glyphs.
 * Gridlines and tick labels are positioned from the same geometry that
 * draws the line (scaleY), so a gridline always sits exactly on the value
 * its label names.
 *
 * Data rides the module-cached /api/insights/:id/history fetch (lib/insights):
 * a 404 history_not_found is the honest "no series" answer, everything else
 * fails loudly with a retryable error row.
 *
 * Accessibility: the plot is one focusable role="img" with a localized
 * summary label; on focus/arrow keys the inspector walks the series
 * (Home/End jump, Escape clears), so the numbers are reachable without a
 * mouse. The tooltip itself is aria-hidden decoration — the label + the
 * chips + the delta carry the meaning.
 *
 * Axis labels render in the page's number locale (fa-IR gives Persian
 * digits and the Solar Hijri calendar via Intl, e.g. «مهر ۱۴۰۴»); dates
 * format in UTC so a day number never shifts a day at Tehran's +3:30.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@currena/core';
import type { IndicatorId } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ApiError, fetchIndicatorHistory } from '../../lib/insights';

export type TrendRange = 'quarter' | '1y' | '5y' | '10y';

/** The full ordered chip list a caller may offer. 2026-10-20 (owner):
 * "Add 10 year View of the gold and silver price as well" — the metals'
 * Estimation-chip charts grow the decade; the feed's history endpoint
 * already serves the full 10-year daily series, so the chip is gated by
 * the same plottability rule as its siblings. Exported as the canonical
 * order (test seam, the way chart-range.ts exposes CHART_RANGE_VALUES). */
export const TREND_RANGES: readonly TrendRange[] = ['quarter', '1y', '5y', '10y'];

/** The chips EVERY caller shows unless it opts into more — the money
 * panel's rows and the strip keep Quarter · 1 year · 5 years; only the
 * gold/silver analysis chips pass the decade (owner, 2026-10-20). */
const DEFAULT_TREND_RANGES: readonly TrendRange[] = ['quarter', '1y', '5y'];

const TREND_RANGE_DAYS: Readonly<Record<TrendRange, number>> = {
  quarter: 92,
  '1y': 366,
  '5y': 1827,
  '10y': 3653, // 10 years + leap-day slack — the details panel's 10y window
};

/** Copy key per range — shared by the chips and the delta's sr-only note. */
export const TREND_RANGE_COPY_KEY: Record<
  TrendRange,
  'rangeQuarter' | 'range1y' | 'range5y' | 'range10y'
> = {
  quarter: 'rangeQuarter',
  '1y': 'range1y',
  '5y': 'range5y',
  '10y': 'range10y',
};

/** Slice a series to the window a range chip names (days back from the
 * last point — the same rule the details panel's ranges follow). */
function trendSeries(
  points: readonly [number, number][],
  range: TrendRange,
): readonly [number, number][] {
  if (points.length === 0) return [];
  const lastDay = points[points.length - 1]![0];
  const cutoff = lastDay - TREND_RANGE_DAYS[range];
  return points.filter((p) => p[0] >= cutoff);
}

/** A range chip is only clickable when its window can show ≥2 points. */
function trendPlottable(
  points: readonly [number, number][],
  range: TrendRange,
): boolean {
  return trendSeries(points, range).length >= 2;
}

/* Plot geometry — one coordinate space, stretched to the caller's box. */
const PLOT_W = 320;
const PLOT_H = 100;
const PLOT_PAD = 6;

/** The top/bottom gridlines' positions (percent of the plot box) — the
 * line's extreme values touch exactly these lines. */
const TOP_PCT = (PLOT_PAD / PLOT_H) * 100;
const BOTTOM_PCT = 100 - TOP_PCT;

const DAY_MS = 86_400_000;

/** The Y axis' compact value formatter — decimals follow the magnitude
 * (≥100 → none, ≥10 → one, else two), so "3,250" and "38.5" and "3.95"
 * all fit the fixed 12px label column without layout shift. Persian
 * digits come from the locale for free. */
export function trendTickFormatter(numberLocale: 'en-US' | 'fa-IR'): (v: number) => string {
  return (v: number) => {
    const abs = Math.abs(v);
    const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
    return formatNumber(v, numberLocale, { maximumFractionDigits: decimals });
  };
}

type TrendHistoryState =
  | { kind: 'loading' }
  | { kind: 'ready'; points: [number, number][] }
  | { kind: 'error' }
  | { kind: 'none' };

/** One indicator's history with the shared loading/error/none states —
 * module-cached behind fetchIndicatorHistory, so a second panel on the
 * same series (savings + shop both ride au-cpi) never refetches. */
function useIndicatorHistory(id: IndicatorId): TrendHistoryState {
  const [state, setState] = useState<TrendHistoryState>({ kind: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchIndicatorHistory(id)
      .then((history) => {
        if (cancelled) return;
        setState(
          history && history.points.length > 0
            ? { kind: 'ready', points: history.points }
            : { kind: 'none' },
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // A 404 history_not_found is the expected "no series" answer.
        if (err instanceof ApiError && err.code === 'history_not_found') {
          setState({ kind: 'none' });
          return;
        }
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return state;
}

/**
 * The shared history-trend panel — chart with X/Y axes + hover inspector,
 * range chips, signed window delta. Callers supply the indicator id, the
 * aria-label builder, and the value formatters (units belong to them).
 */
export function TrendPanel({
  id,
  copy,
  numberLocale,
  ariaLabelFor,
  formatValue,
  formatTickValue,
  plotHeightClass = 'h-20',
  rangeGroupData,
  deltaData,
  plotData,
  defaultRange = 'quarter',
  deltaKind,
  ranges = DEFAULT_TREND_RANGES,
}: {
  id: IndicatorId;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  ariaLabelFor: (range: TrendRange) => string;
  /** Tooltip value, units included (formatIndicatorValue at the caller). */
  formatValue: (value: number) => string;
  /** Y tick value, compact — no unit room on the axis. */
  formatTickValue: (value: number) => string;
  plotHeightClass?: string;
  /** Extra data-* hooks for the caller's QA selectors. */
  rangeGroupData?: Record<string, string>;
  deltaData?: Record<string, string>;
  plotData?: Record<string, string>;
  /** R43: the range the chips open on — quarter by default; the money
   *  panel's rows open on the annual window (owner round 43). */
  defaultRange?: TrendRange;
  /** 2026-10-20 (owner): which chips to render, in order — defaults to
   *  Quarter · 1 year · 5 years; the metals' analysis chips pass the
   *  decade too ("Add 10 year View of the gold and silver price as well").
   *  A window with <2 plottable points still renders disabled. */
  ranges?: readonly TrendRange[];
  /**
   * Fix spec B-17 (2026-10-14): how the signed window delta is expressed —
   * 'pct' (prices and indexes) or 'points' (rates, inflation, yields and
   * unemployment). Defaults to 'pct'; the money panel passes the
   * indicator's changeKind so a rate chart never shows "+12.7%".
   */
  deltaKind?: 'pct' | 'points';
}) {
  const { ui } = copy;
  const gradId = useId();
  const state = useIndicatorHistory(id);
  const [range, setRange] = useState<TrendRange>(defaultRange);
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);

  // Tick/tooltip date formatters — UTC so day numbers never shift a day.
  const tickDate = useMemo(
    () =>
      new Intl.DateTimeFormat(numberLocale, {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [numberLocale],
  );
  const fullDate = useMemo(
    () =>
      new Intl.DateTimeFormat(numberLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [numberLocale],
  );

  if (state.kind === 'loading') {
    return (
      <p role="status" className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {ui.historyLoading}
      </p>
    );
  }
  if (state.kind === 'error') {
    return (
      <p role="status" className="m-0 text-[length:var(--type-caption)] text-[var(--color-status-alert)]">
        {ui.historyError}
      </p>
    );
  }
  if (state.kind === 'none') {
    return (
      <p role="status" className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {ui.noHistory}
      </p>
    );
  }

  const clean = state.points.filter((p) => Number.isFinite(p[1]));
  const series = trendSeries(clean, range);
  if (series.length < 2) {
    return (
      <p role="status" className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {ui.noHistory}
      </p>
    );
  }

  const values = series.map((p) => p[1]);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const stepX = (PLOT_W - 2 * PLOT_PAD) / (series.length - 1);
  const scaleY = (v: number): number => {
    if (vMax === vMin) return PLOT_H / 2;
    const t = (v - vMin) / (vMax - vMin);
    return PLOT_H - PLOT_PAD - t * (PLOT_H - 2 * PLOT_PAD);
  };
  const coords = series.map((p, i) => ({ x: PLOT_PAD + i * stepX, y: scaleY(p[1]) }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const firstPt = coords[0]!;
  const lastPt = coords[coords.length - 1]!;
  const area = `${line} L${lastPt.x.toFixed(1)},${PLOT_H - PLOT_PAD} L${firstPt.x.toFixed(1)},${PLOT_H - PLOT_PAD} Z`;

  // The window's move, in the series' own units — one signed percent
  // (prices and indexes) or percentage POINTS (rates, inflation, yields and
  // unemployment — fix spec B-17: never "+12.7%" on a home-loan rate).
  // Quiet ink either way (the verdict word beside it already speaks in colour).
  const firstVal = series[0]![1];
  const lastVal = series[series.length - 1]![1];
  const kind = deltaKind ?? 'pct';
  const deltaValue = kind === 'points' ? lastVal - firstVal : firstVal !== 0 ? ((lastVal - firstVal) / firstVal) * 100 : null;
  const deltaText =
    deltaValue !== null
      ? (deltaValue > 0 ? '+' : '') + formatNumber(deltaValue, numberLocale, { maximumFractionDigits: 1 }) // sign rides with the number (never colour alone)
      : null;

  const lastDay = series[series.length - 1]![0];

  // Axis ticks — Y at the line's max / mid / min (gridlines sit exactly on
  // their values), X at the window's first / middle / last point.
  const yTicks = [
    { pct: TOP_PCT, label: formatTickValue(vMax) },
    { pct: 50, label: formatTickValue((vMin + vMax) / 2) },
    { pct: BOTTOM_PCT, label: formatTickValue(vMin) },
  ];
  const xMidIdx = Math.round((series.length - 1) / 2);
  const xTicks = [
    { pct: 0, label: tickDate.format(series[0]![0] * DAY_MS), anchor: 'start' },
    { pct: 50, label: tickDate.format(series[xMidIdx]![0] * DAY_MS), anchor: 'center' },
    { pct: 100, label: tickDate.format(lastDay * DAY_MS), anchor: 'end' },
  ] as const;

  // Hover inspector — nearest point to the pointer/tap; arrows walk it.
  const hoverIdx = hover !== null ? Math.min(Math.max(hover, 0), series.length - 1) : null;
  const hoverPt = hoverIdx !== null ? coords[hoverIdx]! : null;
  const hoverXPct = hoverPt !== null ? (hoverPt.x / PLOT_W) * 100 : 0;
  const hoverYPct = hoverPt !== null ? (hoverPt.y / PLOT_H) * 100 : 0;
  const tooltipLeftPct = Math.min(Math.max(hoverXPct, 15), 85);

  const indexFromClientX = (clientX: number): number => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const t = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Math.round(t * (series.length - 1));
  };

  const ariaLabel = ariaLabelFor(range);

  return (
    /* dir="ltr" on the ROOT — in RTL pages the whole block (Y labels,
     * plot, X tick labels, chips row) lays out left→right so every tick
     * label sits exactly under/over its point on the time axis (the SVG
     * line is drawn in fixed coordinates and never mirrors). The house
     * chart convention: charts read left→right in both locales. */
    <div dir="ltr" className="flex min-w-0 flex-col gap-1.5" data-trend-chart={id}>
      {/* Chart row: Y tick labels + plot. */}
      <div className="flex min-w-0 items-stretch gap-1.5">
        <span
          aria-hidden="true"
          className="relative w-12 shrink-0 select-none text-end text-[length:var(--type-caption)] leading-none tabular-nums text-[var(--color-text-tertiary)]"
        >
          {yTicks.map((t) => (
            <span key={t.pct} className="absolute end-0 -translate-y-1/2" style={{ top: `${t.pct}%` }}>
              {t.label}
            </span>
          ))}
        </span>
        <div className="relative min-w-0 flex-1">
          {/* Gridlines — positioned from the same scaleY geometry as the
           * line, so each gridline sits exactly on its labeled value. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--color-border)]" style={{ top: `${TOP_PCT}%` }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--color-border)]" style={{ top: '50%' }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--color-border)]" style={{ top: `${BOTTOM_PCT}%` }} />
          <div
            {...plotData}
            ref={plotRef}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            className={`relative block w-full cursor-crosshair rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue ${plotHeightClass}`}
            onPointerMove={(e) => {
              if (e.pointerType !== 'mouse') return; // touch scrolls; tap inspects
              setHover(indexFromClientX(e.clientX));
            }}
            onPointerDown={(e) => setHover(indexFromClientX(e.clientX))}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover((cur) => cur ?? series.length - 1)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              const cur = hoverIdx ?? series.length - 1;
              if (e.key === 'ArrowLeft') setHover(Math.max(cur - 1, 0));
              else if (e.key === 'ArrowRight') setHover(Math.min(cur + 1, series.length - 1));
              else if (e.key === 'Home') setHover(0);
              else if (e.key === 'End') setHover(series.length - 1);
              else if (e.key === 'Escape') setHover(null);
              else return;
              e.preventDefault();
            }}
          >
            <svg
              viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gradId})`} />
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill="currentColor" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
            </svg>
            {hoverIdx !== null && hoverPt !== null ? (
              <>
                {/* Crosshair + inspector dot + the value/date tooltip —
                 * all aria-hidden decoration (the label carries meaning). */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 top-0 w-px bg-currena-blue/40"
                  style={{ left: `${hoverXPct}%` }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-currena-blue ring-2 ring-[var(--color-surface)]"
                  style={{ left: `${hoverXPct}%`, top: `${hoverYPct}%` }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0.5 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-surface)] px-2 py-1 text-[length:var(--type-caption)] leading-snug shadow-[0_6px_18px_rgba(0,0,0,0.14)] ring-1 ring-[var(--color-border)]"
                  style={{ left: `${tooltipLeftPct}%` }}
                >
                  <bdi className="block font-bold tabular-nums text-[var(--color-text-primary)]">
                    {formatValue(series[hoverIdx]![1])}
                  </bdi>
                  <span className="block text-[var(--color-text-tertiary)]">
                    {fullDate.format(series[hoverIdx]![0] * DAY_MS)}
                  </span>
                </div>
              </>
            ) : null}
          </div>
          {/* X tick labels — HTML, never stretched-glyph SVG text. */}
          <div
            aria-hidden="true"
            className="relative mt-1 h-4 select-none text-[length:var(--type-caption)] leading-none tabular-nums text-[var(--color-text-tertiary)]"
          >
            {xTicks.map((t) => (
              <span
                key={t.pct}
                className={
                  t.anchor === 'start'
                    ? 'absolute start-0'
                    : t.anchor === 'center'
                      ? 'absolute start-1/2 -translate-x-1/2'
                      : 'absolute end-0'
                }
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Range chips + signed window delta — the same row the round-33
       * strip shipped, now shared with the money panel's mini charts. */}
      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span
          role="group"
          aria-label={ui.chartRangeLabel}
          className="no-print flex items-center gap-1 rounded-full bg-currena-soft/70 p-0.5 dark:bg-white/[0.06]"
          data-trend-range={id}
          {...rangeGroupData}
        >
          {ranges.map((r) => {
            const active = r === range;
            const plottable = trendPlottable(clean, r);
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                disabled={!plottable}
                onClick={() => {
                  if (r === range) return;
                  setRange(r);
                  setHover(null); // the window changed — a stale index lies
                }}
                className={`inline-flex min-h-[28px] cursor-pointer items-center rounded-full px-2.5 text-[length:var(--type-caption)] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'bg-white text-currena-blue-deep shadow-sm ring-1 ring-black/[0.06] dark:bg-[#243040] dark:text-currena-blue dark:ring-white/[0.1]'
                    : 'bg-transparent text-currena-muted hover:text-currena-dark dark:hover:text-currena-dark'
                }`}
              >
                {ui[TREND_RANGE_COPY_KEY[r]]}
              </button>
            );
          })}
        </span>
        {deltaText !== null ? (
          <span
            className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]"
            data-trend-delta={id}
            {...deltaData}
          >
            {/* Step-1 audit item C11: the range word is VISIBLE — "−5.5%"
             * alone (with "Quarter" hidden in sr-only) read as a forecast;
             * it is the PAST window's measured change. */}
            <bdi dir="ltr">
              {deltaText}
              {kind === 'points' ? '' : '%'}
            </bdi>{' '}
            <span className="opacity-80">{ui[TREND_RANGE_COPY_KEY[range]]}</span>
          </span>
        ) : null}
      </span>
    </div>
  );
}