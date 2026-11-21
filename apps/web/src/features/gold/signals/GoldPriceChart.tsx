/**
 * signals/GoldPriceChart — GPE R18 / F7 (2026-11-18): the interactive
 * gold price chart — pan/zoom/log + the unit-aware header + the D8
 * 50/200 DMA overlays + the window as a USER CONTROL (the #01 widening
 * promised at D6-A, dissolved by construction — the chip words state the
 * spans the loaded series actually carries, computed from the data).
 * docs/specs/gold-page-elevation: s8/01 R18 · s6/03 zone E · the C1/C5
 * honesty rules · the s13 M1 §5 S13-D2 record.
 *
 * Data: the R18 OHLC leg (GET /api/insights/gold-ohlc — the module-cached
 * fetch in ../gold-xau.ts, SHARED with the TA band: one fetch, two
 * surfaces). The series is XAUUSD spot daily bars, EODHD (L2 owner plan,
 * free-tier ~1y depth today — S13-D1): the header names the series at
 * point of use per C1, the ALL chip states the true stored span, and the
 * window delta names the visible window's own span — never a "10 years"
 * label over a shorter one.
 *
 * Silver's chip keeps the legacy TrendPanel (OI-4) — this chart replaces
 * the GOLD chip's fixed-range panel only (S13-D2).
 *
 * Zero dependencies (the house chart pattern): one stretched SVG
 * (preserveAspectRatio="none" + non-scaling stroke) for the line and the
 * DMA overlays, EVERY text as HTML around it. Pan = single-pointer drag;
 * zoom = wheel/pinch around the pointer; the keyboard inspector walks
 * the bars (the TrendPanel accessibility pattern). dir="ltr" root — the
 * house convention: charts read left→right in both locales.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../../shared/i18n';
import { useI18n } from '../../../shared/lib/locale';
import type { InsightsCopy } from '../../../shared/i18n/insights-copy-en';
import { useGoldXauOhlc } from '../gold-xau';
import { smaSeries } from '@currena/insights';

/** The troy ounce in grams (the gram unit's disclosed conversion — C1). */
const TROY_OZ_GRAMS = 31.1034768;

/* Plot geometry — one coordinate space, stretched to the caller's box
 * (the TrendChart conventions). */
const PLOT_W = 320;
const PLOT_H = 100;
const PLOT_PAD = 6;
const TOP_PCT = (PLOT_PAD / PLOT_H) * 100;
const BOTTOM_PCT = 100 - TOP_PCT;

/** The visible-window state: fractional bar indices into the series. */
interface ChartView {
  start: number;
  end: number;
}

/** The zoom clamps: the window never shrinks below ~10 bars, never
 * exceeds the stored series. */
const MIN_WINDOW_BARS = 10;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

export function GoldPriceChart({
  copy,
  numberLocale,
}: {
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}): React.JSX.Element | null {
  const { t, locale } = useI18n();
  const state = useGoldXauOhlc();
  const series = state.kind === 'ready' ? state.snapshot.series : null;
  const n = series?.length ?? 0;

  // The user controls (R18): the window (view), the scale, the unit, the
  // DMA overlays. The D8 mandate: both averages ON by default.
  const [view, setView] = useState<ChartView | null>(null);
  const [logScale, setLogScale] = useState(false);
  const [unit, setUnit] = useState<'oz' | 'gram'>('oz');
  const [dma50On, setDma50On] = useState(true);
  const [dma200On, setDma200On] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  // The active pointers (pan + pinch): index → {id, x}.
  const pointersRef = useRef(new Map<number, number>());
  const pinchRef = useRef<number | null>(null);

  // ALL hooks above the early returns (the rules of hooks: the loading/
  // none states must not change the hook count between renders).
  /** The SMA overlay rows aligned to series indices (null where the
   * window lacks history — fail-closed, never a partial average). */
  const sma50 = useMemo(
    () => (series !== null ? alignSma(series, 50) : []),
    [series],
  );
  const sma200 = useMemo(
    () => (series !== null ? alignSma(series, 200) : []),
    [series],
  );
  /** The value formatters (unit-aware). */
  const fmtValue = useCallback(
    (v: number): string =>
      formatNumber(unit === 'gram' ? v / TROY_OZ_GRAMS : v, numberLocale, {
        maximumFractionDigits: unit === 'gram' ? 1 : 0,
      }),
    [unit, numberLocale],
  );
  const fmtTick = useCallback(
    (v: number): string => formatNumber(unit === 'gram' ? v / TROY_OZ_GRAMS : v, numberLocale, { maximumFractionDigits: unit === 'gram' ? 1 : 0 }),
    [unit, numberLocale],
  );
  const tickDate = useMemo(
    () => new Intl.DateTimeFormat(numberLocale, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
    [numberLocale],
  );
  const fullDate = useMemo(
    () => new Intl.DateTimeFormat(numberLocale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    [numberLocale],
  );

  /* ---------------- the honest states ---------------- */
  if (state.kind === 'loading') {
    return (
      <p role="status" className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-gold-price-chart="loading">
        {copy.ui.historyLoading}
      </p>
    );
  }
  if (state.kind === 'none' || series === null || n < 2) {
    return (
      <p role="status" className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-gold-price-chart="none">
        {copy.ui.noHistory}
      </p>
    );
  }

  /* ---------------- the window (the user control) ---------------- */
  // The default view: the last ~1 year of bars (or all when fewer).
  const effectiveView: ChartView = view ?? { start: Math.max(0, n - 1 - 251), end: n - 1 };
  const spanBars = Math.max(effectiveView.end - effectiveView.start, MIN_WINDOW_BARS);
  const fromIdx = clamp(Math.ceil(effectiveView.start), 0, n - 1);
  const toIdx = clamp(Math.floor(effectiveView.end), fromIdx + 1, n - 1);
  const visible = series.slice(fromIdx, toIdx + 1);

  // The y domain: the visible closes + the visible overlay values (so a
  // toggled overlay never clips).
  let vMin = Infinity;
  let vMax = -Infinity;
  for (const bar of visible) {
    if (bar.close < vMin) vMin = bar.close;
    if (bar.close > vMax) vMax = bar.close;
  }
  if (dma50On) {
    for (let i = fromIdx; i <= toIdx; i += 1) {
      const v = sma50[i] ?? null;
      if (v !== null) {
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
  }
  if (dma200On) {
    for (let i = fromIdx; i <= toIdx; i += 1) {
      const v = sma200[i] ?? null;
      if (v !== null) {
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
  }
  if (!Number.isFinite(vMin) || !Number.isFinite(vMax)) {
    vMin = visible[0]!.close;
    vMax = vMin;
  }

  /** The y mapping: linear or log10 over the visible domain (the unit
   * conversion rides the FORMATTERS, never the geometry — the same
   * numbers map, only the labels change). */
  const yOf = (value: number): number => {
    const lo = logScale ? Math.log10(Math.max(vMin, 1e-9)) : vMin;
    const hi = logScale ? Math.log10(Math.max(vMax, 1e-9)) : vMax;
    if (hi === lo) return PLOT_H / 2;
    const v = logScale ? Math.log10(Math.max(value, 1e-9)) : value;
    const tt = (v - lo) / (hi - lo);
    return PLOT_H - PLOT_PAD - tt * (PLOT_H - 2 * PLOT_PAD);
  };
  const xOf = (i: number): number =>
    PLOT_PAD + ((i - effectiveView.start) / (spanBars || 1)) * (PLOT_W - 2 * PLOT_PAD);

  /** The close line + the overlay paths over the visible window. */
  const line = visible.map((bar, k) => {
    const i = fromIdx + k;
    const c = `${xOf(i).toFixed(1)},${yOf(bar.close).toFixed(1)}`;
    return k === 0 ? `M${c}` : `L${c}`;
  }).join(' ');
  const overlayPath = (aligned: readonly (number | null)[]): string => {
    let d = '';
    let penDown = false;
    for (let i = fromIdx; i <= toIdx; i += 1) {
      const v = aligned[i] ?? null;
      if (v === null) {
        penDown = false;
        continue;
      }
      const c = `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`;
      d += penDown ? `L${c}` : `M${c}`;
      penDown = true;
    }
    return d;
  };

  /* ---------------- the window delta (the visible span, named) ---------------- */
  const firstVal = visible[0]!.close;
  const lastVal = visible[visible.length - 1]!.close;
  const deltaPct = firstVal !== 0 ? ((lastVal - firstVal) / firstVal) * 100 : null;
  const deltaText =
    deltaPct !== null
      ? (deltaPct > 0 ? '+' : '') + formatNumber(deltaPct, numberLocale, { maximumFractionDigits: 1 })
      : null;
  const spanDays = (Date.parse(`${visible[visible.length - 1]!.date}T00:00:00Z`) - Date.parse(`${visible[0]!.date}T00:00:00Z`)) / 86_400_000;
  const spanWord =
    spanDays < 335
      ? interpolate(t('pd.gold.chartSpanMonths'), {
          n: formatNumber(Math.max(1, Math.round(spanDays / 30.4)), numberLocale, { maximumFractionDigits: 0 }),
        })
      : interpolate(copy.ui.rangeWindowYears, {
          years: formatNumber(Math.round((spanDays / 365.25) * 10) / 10, numberLocale, { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
        });

  /* ---------------- the range chips (the window shortcuts) ---------------- */
  const chipFor = (days: number): ChartView => ({
    start: Math.max(0, n - 1 - days),
    end: n - 1,
  });
  const allChip: ChartView = { start: 0, end: n - 1 };
  const allSpanDays =
    (Date.parse(`${series[n - 1]!.date}T00:00:00Z`) - Date.parse(`${series[0]!.date}T00:00:00Z`)) / 86_400_000;
  const allWord =
    allSpanDays < 335
      ? interpolate(t('pd.gold.chartSpanMonths'), {
          n: formatNumber(Math.max(1, Math.round(allSpanDays / 30.4)), numberLocale, { maximumFractionDigits: 0 }),
        })
      : interpolate(copy.ui.rangeWindowYears, {
          years: formatNumber(Math.round((allSpanDays / 365.25) * 10) / 10, numberLocale, { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
        });
  const isChipActive = (candidate: ChartView): boolean =>
    view !== null && Math.abs(view.start - candidate.start) < 0.5 && Math.abs(view.end - candidate.end) < 0.5;

  /* ---------------- the interaction handlers ---------------- */
  const indexFromClientX = (clientX: number): number => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return fromIdx;
    const frac = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return clamp(Math.round(effectiveView.start + frac * spanBars), 0, n - 1);
  };
  const zoomAt = (clientX: number, factor: number): void => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const frac = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setView((cur) => {
      const v = cur ?? effectiveView;
      const anchor = v.start + frac * (v.end - v.start);
      const newSpan = clamp((v.end - v.start) * factor, MIN_WINDOW_BARS, n - 1);
      let start = anchor - frac * newSpan;
      let end = start + newSpan;
      if (start < 0) {
        start = 0;
        end = newSpan;
      }
      if (end > n - 1) {
        end = n - 1;
        start = Math.max(0, end - newSpan);
      }
      return { start, end };
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, e.clientX);
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = Math.abs(b! - a!);
    }
    setHover(indexFromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!pointersRef.current.has(e.pointerId)) {
      // The hover inspector (mouse only — touch scrolls/taps).
      if (e.pointerType === 'mouse') setHover(indexFromClientX(e.clientX));
      return;
    }
    pointersRef.current.set(e.pointerId, e.clientX);
    if (pointersRef.current.size === 2 && pinchRef.current !== null) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.abs(b! - a!);
      if (dist > 0 && pinchRef.current > 0) {
        zoomAt((a! + b!) / 2, pinchRef.current / dist);
        pinchRef.current = dist;
      }
      return;
    }
    // Pan: the pointer delta maps to the window shift.
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const dBars = (-e.movementX / rect.width) * spanBars;
    setView((cur) => {
      const v = cur ?? effectiveView;
      const span = v.end - v.start;
      let start = v.start + dBars;
      let end = start + span;
      if (start < 0) {
        start = 0;
        end = span;
      }
      if (end > n - 1) {
        end = n - 1;
        start = Math.max(0, end - span);
      }
      return { start, end };
    });
  };
  const endPointer = (e: React.PointerEvent<HTMLDivElement>): void => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  /* ---------------- the inspector + the dates ---------------- */
  const hoverIdx = hover !== null ? clamp(hover, fromIdx, toIdx) : null;
  const hoverBar = hoverIdx !== null ? series[hoverIdx]! : null;
  const asOfText = locale === 'fa' ? formatJalaliShort(series[n - 1]!.date, numberLocale) : formatGregorianWords(series[n - 1]!.date);
  const ariaLabel = interpolate(t('pd.gold.chartAria'), { span: allWord, date: asOfText });

  const yTicks = [
    { pct: TOP_PCT, label: fmtTick(vMax) },
    { pct: 50, label: fmtTick((vMin + vMax) / 2) },
    { pct: BOTTOM_PCT, label: fmtTick(vMin) },
  ];
  const xMid = Math.round((fromIdx + toIdx) / 2);
  const xTicks = [
    { i: fromIdx, anchor: 'start' as const },
    { i: xMid, anchor: 'center' as const },
    { i: toIdx, anchor: 'end' as const },
  ];

  /* ---------------- render ---------------- */
  return (
    <div dir="ltr" className="flex min-w-0 flex-col gap-1.5" data-gold-price-chart>
      {/* The unit-aware header (R18): the series definition disclosed at
       * point of use (C1 — the anti-GPE-S3-04 clause) + the as-of + the
       * unit + scale + overlay controls. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <a
          href="https://eodhd.com/api/eod/XAUUSD.FOREX"
          target="_blank"
          rel="noopener noreferrer"
          className="insights-focusable text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
        >
          {t('pd.gold.chartSeriesLine')}
        </a>
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {interpolate(t('pd.global.dataAsOf'), { date: asOfText })}
        </span>
        {unit === 'gram' ? (
          <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {t('pd.gold.chartGramNote')}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* The unit toggle (oz/gram). */}
        <span role="group" aria-label={t('pd.gold.chartUnitLabel')} className="flex items-center rounded-full bg-currena-soft/70 p-0.5 dark:bg-white/[0.06]" data-chart-unit>
          {(['oz', 'gram'] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
              className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-3 text-[length:var(--type-caption)] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue ${
                unit === u
                  ? 'bg-white text-currena-blue-deep shadow-sm ring-1 ring-black/[0.06] dark:bg-[#243040] dark:text-currena-blue dark:ring-white/[0.1]'
                  : 'bg-transparent text-currena-muted hover:text-currena-dark dark:hover:text-currena-dark'
              }`}
            >
              {t(u === 'oz' ? 'pd.gold.chartUnitOz' : 'pd.gold.chartUnitGram')}
            </button>
          ))}
        </span>
        {/* The log-scale toggle. */}
        <button
          type="button"
          aria-pressed={logScale}
          onClick={() => setLogScale(!logScale)}
          data-chart-toggle-log={logScale ? 'on' : 'off'}
          className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-3 text-[length:var(--type-caption)] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue ${
            logScale
              ? 'bg-white text-currena-blue-deep shadow-sm ring-1 ring-black/[0.06] dark:bg-[#243040] dark:text-currena-blue dark:ring-white/[0.1]'
              : 'bg-currena-soft/70 text-currena-muted hover:text-currena-dark dark:bg-white/[0.06] dark:hover:text-currena-dark'
          }`}
        >
          {t('pd.gold.chartLog')}
        </button>
        {/* The D8 overlay toggles — only when the window has the
         * history for them (fail-closed: a missing average never renders
         * a toggle that pretends it could). */}
        {sma50.some((v) => v !== null) ? (
          <button
            type="button"
            aria-pressed={dma50On}
            onClick={() => setDma50On(!dma50On)}
            data-chart-toggle-sma50={dma50On ? 'on' : 'off'}
            className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-3 text-[length:var(--type-caption)] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue ${
              dma50On
                ? 'bg-white text-currena-blue-deep shadow-sm ring-1 ring-black/[0.06] dark:bg-[#243040] dark:text-currena-blue dark:ring-white/[0.1]'
                : 'bg-currena-soft/70 text-currena-muted hover:text-currena-dark dark:bg-white/[0.06] dark:hover:text-currena-dark'
            }`}
          >
            {t('pd.gold.chartSma50')}
          </button>
        ) : null}
        {sma200.some((v) => v !== null) ? (
          <button
            type="button"
            aria-pressed={dma200On}
            onClick={() => setDma200On(!dma200On)}
            data-chart-toggle-sma200={dma200On ? 'on' : 'off'}
            className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-3 text-[length:var(--type-caption)] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue ${
              dma200On
                ? 'bg-white text-currena-blue-deep shadow-sm ring-1 ring-black/[0.06] dark:bg-[#243040] dark:text-currena-blue dark:ring-white/[0.1]'
                : 'bg-currena-soft/70 text-currena-muted hover:text-currena-dark dark:bg-white/[0.06] dark:hover:text-currena-dark'
            }`}
          >
            {t('pd.gold.chartSma200')}
          </button>
        ) : null}
      </div>

      {/* Chart row: Y tick labels + plot. */}
      <div className="flex min-w-0 items-stretch gap-1.5">
        <span
          aria-hidden="true"
          className="relative w-12 shrink-0 select-none text-end text-[length:var(--type-caption)] leading-none tabular-nums text-[var(--color-text-tertiary)]"
        >
          {yTicks.map((tick) => (
            <span key={tick.pct} className="absolute end-0 -translate-y-1/2" style={{ top: `${tick.pct}%` }}>
              {tick.label}
            </span>
          ))}
        </span>
        <div className="relative min-w-0 flex-1">
          {/* Gridlines — positioned from the same geometry as the line. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--color-border)]" style={{ top: `${TOP_PCT}%` }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--color-border)]" style={{ top: '50%' }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--color-border)]" style={{ top: `${BOTTOM_PCT}%` }} />
          <div
            ref={plotRef}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            data-chart-plot
            onWheel={(e) => {
              // Zoom around the pointer (never the page scroll).
              e.preventDefault();
              zoomAt(e.clientX, e.deltaY > 0 ? 1.12 : 0.89);
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={(e) => {
              endPointer(e);
              setHover(null);
            }}
            onKeyDown={(e) => {
              const cur = hoverIdx ?? toIdx;
              if (e.key === 'ArrowLeft') setHover(Math.max(cur - 1, fromIdx));
              else if (e.key === 'ArrowRight') setHover(Math.min(cur + 1, toIdx));
              else if (e.key === 'Home') setHover(fromIdx);
              else if (e.key === 'End') setHover(toIdx);
              else if (e.key === 'Escape') setHover(null);
              else return;
              e.preventDefault();
            }}
            className="relative block w-full cursor-grab touch-none rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue h-40 sm:h-52"
          >
            <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              {/* The close line (the brand-gold ink — the chart IS the gold price). */}
              <path d={line} fill="none" stroke="var(--color-accent-gold-strong)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {/* The D8 overlays: the 50-day (context ink) + the 200-day
               * (the muted reference ink) — dashed so the price stays the
               * subject; never drawn where the window lacks history. */}
              {dma50On ? (
                <path d={overlayPath(sma50)} fill="none" stroke="var(--color-status-context, #475569)" strokeWidth="1.5" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" />
              ) : null}
              {dma200On ? (
                <path d={overlayPath(sma200)} fill="none" stroke="var(--color-text-tertiary, #94a3b8)" strokeWidth="1.5" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
              ) : null}
              <circle cx={xOf(toIdx).toFixed(1)} cy={yOf(lastVal).toFixed(1)} r="3.5" fill="var(--color-accent-gold-strong)" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
            </svg>
            {hoverIdx !== null && hoverBar !== null ? (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 top-0 w-px bg-currena-blue/40"
                  style={{ left: `${((xOf(hoverIdx) / PLOT_W) * 100).toFixed(2)}%` }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-currena-blue ring-2 ring-[var(--color-surface)]"
                  style={{ left: `${((xOf(hoverIdx) / PLOT_W) * 100).toFixed(2)}%`, top: `${((yOf(hoverBar.close) / PLOT_H) * 100).toFixed(2)}%` }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0.5 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-surface)] px-2 py-1 text-[length:var(--type-caption)] leading-snug shadow-[0_6px_18px_rgba(0,0,0,0.14)] ring-1 ring-[var(--color-border)]"
                  style={{ left: `${clamp((xOf(hoverIdx) / PLOT_W) * 100, 15, 85).toFixed(2)}%` }}
                >
                  <bdi className="block font-bold tabular-nums text-[var(--color-text-primary)]">
                    {fmtValue(hoverBar.close)}
                    <span className="ms-0.5 font-normal text-[var(--color-text-tertiary)]">{t(unit === 'oz' ? 'pd.gold.chartUnitOzShort' : 'pd.gold.chartUnitGramShort')}</span>
                  </bdi>
                  <bdi className="block tabular-nums text-[var(--color-text-tertiary)]">
                    O {fmtValue(hoverBar.open)} · H {fmtValue(hoverBar.high)} · L {fmtValue(hoverBar.low)}
                  </bdi>
                  <span className="block text-[var(--color-text-tertiary)]">
                    {fullDate.format(Date.parse(`${hoverBar.date}T00:00:00Z`))}
                  </span>
                </div>
              </>
            ) : null}
          </div>
          {/* GUX-S8 M3 (11 §8 item E — the keyboard inspector's readout): the
           *   visually-hidden live region that speaks the hovered point's
           *   value + unit + full date. The tooltip above stays aria-hidden
           *   (the live region is the ONE announcement — no double speech);
           *   the region itself is persistent so every arrow/Home/End move
           *   fires a polite announcement, and Escape clears it. */}
          <p role="status" aria-live="polite" data-chart-inspector-readout className="m-0 sr-only">
            {hoverIdx !== null && hoverBar !== null
              ? interpolate(t('pd.gold.chartPointReadout'), {
                  value: fmtValue(hoverBar.close),
                  unit: t(unit === 'oz' ? 'pd.gold.chartUnitOzShort' : 'pd.gold.chartUnitGramShort'),
                  date: fullDate.format(Date.parse(`${hoverBar.date}T00:00:00Z`)),
                })
              : ''}
          </p>
          {/* X tick labels — HTML, never stretched-glyph SVG text. */}
          <div aria-hidden="true" className="relative mt-1 h-4 select-none text-[length:var(--type-caption)] leading-none tabular-nums text-[var(--color-text-tertiary)]">
            {xTicks.map(({ i, anchor }) => (
              <span
                key={anchor}
                className={
                  anchor === 'start'
                    ? 'absolute start-0'
                    : anchor === 'center'
                      ? 'absolute start-1/2 -translate-x-1/2'
                      : 'absolute end-0'
                }
              >
                {tickDate.format(Date.parse(`${series[i]!.date}T00:00:00Z`))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The window row: the range chips (the window shortcuts) + the
       * named visible-window delta (the #01 discipline: the span word
       * computed from the data, never a fixed label over another span). */}
      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span
          role="group"
          aria-label={copy.ui.chartRangeLabel}
          className="flex items-center gap-1 rounded-full bg-currena-soft/70 p-0.5 dark:bg-white/[0.06]"
          data-chart-range
        >
          {([
            { key: 'quarter', days: 92, word: copy.ui.rangeQuarter, view: chipFor(92) },
            { key: '1y', days: 251, word: copy.ui.range1y, view: chipFor(251) },
            { key: 'all', days: allSpanDays, word: `${t('pd.gold.chartRangeAll')} · ${allWord}`, view: allChip },
          ] as const).map(({ key, word, view: chipView }) => (
            <button
              key={key}
              type="button"
              aria-pressed={isChipActive(chipView)}
              onClick={() => {
                setView(chipView);
                setHover(null); // the window changed — a stale index lies
              }}
              data-chart-range-chip={key}
              className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-3 text-[length:var(--type-caption)] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-currena-blue ${
                isChipActive(chipView)
                  ? 'bg-white text-currena-blue-deep shadow-sm ring-1 ring-black/[0.06] dark:bg-[#243040] dark:text-currena-blue dark:ring-white/[0.1]'
                  : 'bg-transparent text-currena-muted hover:text-currena-dark dark:hover:text-currena-dark'
              }`}
            >
              {word}
            </button>
          ))}
        </span>
        {deltaText !== null ? (
          <span className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]" data-chart-delta>
            <bdi dir="ltr">
              {deltaText}%
            </bdi>{' '}
            <span className="opacity-80">{spanWord}</span>
          </span>
        ) : null}
      </span>
      {/* The pan/zoom affordance hint (discoverability for the user
       * control — the #17 lesson applied forward). */}
      <p className="m-0 text-[length:var(--type-caption)] leading-tight text-[var(--color-text-tertiary)]">{t('pd.gold.chartPanHint')}</p>
    </div>
  );
}

/** The SMA aligned to series indices: alignedSma[i] = the average of the
 * `window` closes ending at bar i (null before the window fills). */
function alignSma(series: readonly { close: number }[], window: 50 | 200): (number | null)[] {
  const points = smaSeries(series as never, window);
  const out: (number | null)[] = series.map(() => null);
  for (let k = 0; k < points.length; k += 1) {
    out[k + window - 1] = points[k]!.value;
  }
  return out;
}

/** A short Jalali date for the as-of line (the fa mirror of the EN words). */
function formatJalaliShort(date: string, numberLocale: 'en-US' | 'fa-IR'): string {
  const fmt = new Intl.DateTimeFormat(numberLocale === 'fa-IR' ? 'fa-IR-u-ca-persian' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return fmt.format(Date.parse(`${date}T00:00:00Z`));
}

/** The EN words form of a date (the house formatDateWords pattern). */
function formatGregorianWords(date: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return fmt.format(Date.parse(`${date}T00:00:00Z`));
}
