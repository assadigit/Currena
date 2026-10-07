/**
 * HistoryChart — the card's expanded 10-year chart (Phase I4).
 *
 * Zero-dependency SVG, modelled on Sparkline.tsx (the house chart pattern):
 * normalized polyline + soft gradient area + end dot, min/max annotations,
 * start/end year labels. Static rendering — inherently reduced-motion safe.
 *
 *  - Time runs LEFT → RIGHT in BOTH locales (02-page-design-spec.md §7 —
 *    Persian financial-chart convention); the svg root is dir="ltr".
 *  - Stroke/fill follow the theme via currentColor (text-currena-blue) —
 *    no hardcoded colours.
 *  - The data-table alternative (spec §9) lives in a real <details><table>
 *    so screen readers reach it; sampleHistoryRows keeps the decade's
 *    shape in ≤12 rows.
 *
 * I7 (BACKLOG #48, audit F16): hover/focus reading — pointermove tracks the
 * nearest point (guide line + dot + date/value tooltip); the chart is also
 * keyboard-focusable with ← → Home End stepping the same focus point, so
 * the exact value under inspection is readable without a mouse. The
 * tooltip is visual (aria-hidden) — the SR table remains the text path.
 *
 * Label values are rendered with plain Intl digits (no long unit words) so
 * every SVG <text> run stays a single bidi-safe numeric run.
 */

import { useId, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { formatNumber, formatDate, formatJalaliDate } from '@currena/core';
import type { IndicatorId } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { sampleHistoryRows, epochDayToIso } from './config';

const WIDTH = 640;
const HEIGHT = 200;
const PAD_X = 10;
const PAD_TOP = 26; // room for the max label above its point
const PAD_BOTTOM = 24; // room for the year axis labels

export interface HistoryChartProps {
  id: IndicatorId;
  points: readonly [number, number][];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}

function scaleY(value: number, min: number, max: number): number {
  if (max === min) return (HEIGHT - PAD_BOTTOM - PAD_TOP) / 2 + PAD_TOP;
  const t = (value - min) / (max - min);
  return HEIGHT - PAD_BOTTOM - t * (HEIGHT - PAD_BOTTOM - PAD_TOP);
}

function num(value: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(value, numberLocale, { maximumFractionDigits: 2 });
}

/** Card-local ISO date rendering: Gregorian in en, Jalali in fa (spec §7). */
export function formatAsOf(iso: string, locale: 'en' | 'fa'): string {
  return locale === 'fa' ? formatJalaliDate(iso, 'fa-IR') : formatDate(iso, 'en-US');
}

export function HistoryChart({ id, points, copy, locale, numberLocale }: HistoryChartProps) {
  const gradId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  // I7 (#48): the point under inspection — set by pointermove or arrow keys.
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const clean = points.filter((p) => Number.isFinite(p[1]));
  const ind = copy.indicators[id];

  if (clean.length < 2) {
    return (
      <p className="mt-2 text-sm text-currena-muted">{copy.ui.noHistory}</p>
    );
  }

  const days = clean.map((p) => p[0]);
  const values = clean.map((p) => p[1]);
  const dayMin = days[0]!;
  const dayMax = days[days.length - 1]!;
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const scaleX = (day: number): number => {
    if (dayMax === dayMin) return WIDTH / 2;
    return PAD_X + ((day - dayMin) / (dayMax - dayMin)) * (WIDTH - 2 * PAD_X);
  };
  const coords = clean.map((p) => ({ x: scaleX(p[0]), y: scaleY(p[1], vMin, vMax), v: p[1] }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const firstPt = coords[0]!;
  const lastPt = coords[coords.length - 1]!;
  const area = `${line} L${lastPt.x.toFixed(1)},${HEIGHT - PAD_BOTTOM} L${firstPt.x.toFixed(1)},${HEIGHT - PAD_BOTTOM} Z`;

  // Min/max marker points (first occurrence keeps ties stable).
  let minIdx = 0;
  let maxIdx = 0;
  coords.forEach((c, i) => {
    if (c.v < coords[minIdx]!.v) minIdx = i;
    if (c.v > coords[maxIdx]!.v) maxIdx = i;
  });
  const minPt = coords[minIdx]!;
  const maxPt = coords[maxIdx]!;

  // I6 audit F8/F12: years are codes, not quantities — no grouping separators
  // ("2,016"/"۲٬۰۱۶" was wrong in both locales) — and the axis gets a
  // middle year tick so a 10-year span reads start → mid → end.
  const year = (day: number): string =>
    formatNumber(new Date(day * 86_400_000).getUTCFullYear(), numberLocale, {
      maximumFractionDigits: 0,
      useGrouping: false,
    });

  const ariaLabel = interpolate(copy.ui.chartAria, {
    name: ind.name,
    low: num(vMin, numberLocale),
    high: num(vMax, numberLocale),
    latest: num(lastPt.v, numberLocale),
  });

  const tableRows = sampleHistoryRows(clean);

  /* Focus-reading plumbing (I7 #48) ------------------------------------- */

  /** clientX → nearest clean point index (viewBox → day → scan). */
  const pointerToIdx = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const xView = ((clientX - rect.left) / rect.width) * WIDTH;
    const day =
      dayMax === dayMin
        ? dayMax
        : dayMin + ((xView - PAD_X) / (WIDTH - 2 * PAD_X)) * (dayMax - dayMin);
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    clean.forEach((p, i) => {
      const dist = Math.abs(p[0] - day);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>): void => {
    setFocusIdx(pointerToIdx(e.clientX));
  };

  const onKeyDown = (e: ReactKeyboardEvent<SVGSVGElement>): void => {
    const last = clean.length - 1;
    const step = (dir: 1 | -1): void => {
      e.preventDefault();
      setFocusIdx((prev) => Math.min(last, Math.max(0, (prev ?? last) + dir)));
    };
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIdx(last);
    }
  };

  const focusPt = focusIdx !== null ? coords[focusIdx] : undefined;
  const focusIso = focusIdx !== null ? epochDayToIso(clean[focusIdx]![0]) : '';

  return (
    <figure className="mt-3 m-0">
      <figcaption className="mb-1 text-[0.72rem] font-semibold uppercase tracking-wide text-currena-muted">
        {copy.ui.chartTitle}
      </figcaption>
      <span dir="ltr" className="relative block text-currena-blue">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full cursor-crosshair touch-pan-y rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setFocusIdx(null)}
          onPointerCancel={() => setFocusIdx(null)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocusIdx((prev) => prev ?? clean.length - 1)}
          onBlur={() => setFocusIdx(null)}
        >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Baseline + year axis labels (old → new, left → right, both locales). */}
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={HEIGHT - PAD_BOTTOM}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
        <text
          x={PAD_X}
          y={HEIGHT - 6}
          fontSize="12"
          fill="currentColor"
          fillOpacity="0.7"
          textAnchor="start"
        >
          {year(dayMin)}
        </text>
        {/* Mid-axis year tick — orientation on a decade-long axis (I6 F12). */}
        <text
          x={WIDTH / 2}
          y={HEIGHT - 6}
          fontSize="12"
          fill="currentColor"
          fillOpacity="0.7"
          textAnchor="middle"
        >
          {year(Math.round((dayMin + dayMax) / 2))}
        </text>
        <text
          x={WIDTH - PAD_X}
          y={HEIGHT - 6}
          fontSize="12"
          fill="currentColor"
          fillOpacity="0.7"
          textAnchor="end"
        >
          {year(dayMax)}
        </text>
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
        {/* Min / max annotations — numeric runs only (bidi-safe). */}
        <circle cx={minPt.x} cy={minPt.y} r="3" fill="currentColor" fillOpacity="0.55" />
        <text
          x={Math.min(Math.max(minPt.x, PAD_X + 24), WIDTH - PAD_X - 24)}
          y={Math.min(minPt.y + 16, HEIGHT - PAD_BOTTOM - 4)}
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.75"
          textAnchor="middle"
        >
          {num(vMin, numberLocale)}
        </text>
        <circle cx={maxPt.x} cy={maxPt.y} r="3" fill="currentColor" fillOpacity="0.55" />
        <text
          x={Math.min(Math.max(maxPt.x, PAD_X + 24), WIDTH - PAD_X - 24)}
          y={Math.max(maxPt.y - 10, PAD_TOP - 8)}
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.75"
          textAnchor="middle"
        >
          {num(vMax, numberLocale)}
        </text>
        <circle cx={lastPt.x} cy={lastPt.y} r="4" fill="currentColor" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
        {/* Focus reading (I7 #48): guide line + dot at the inspected point. */}
        {focusPt ? (
          <g>
            <line
              x1={focusPt.x}
              x2={focusPt.x}
              y1={PAD_TOP - 6}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={focusPt.x}
              cy={focusPt.y}
              r="4.5"
              fill="currentColor"
              className="stroke-white dark:stroke-[#1A222E]"
              strokeWidth="2"
            />
          </g>
        ) : null}
      </svg>
        {focusPt ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[135%] whitespace-nowrap rounded-lg bg-currena-dark px-2 py-1 text-[0.7rem] font-bold text-white shadow-md dark:bg-white dark:text-currena-dark"
            style={{
              left: `${Math.min(88, Math.max(12, (focusPt.x / WIDTH) * 100))}%`,
              top: `${(focusPt.y / HEIGHT) * 100}%`,
            }}
          >
            <bdi>{formatAsOf(focusIso, locale)}</bdi>
            <span className="mx-1 opacity-50">·</span>
            <bdi>{num(focusPt.v, numberLocale)}</bdi>
          </span>
        ) : null}
      </span>
      {/* Data-table alternative (spec §9) — real table, collapsed by default.
          I6 audit F7: the summary is a full-width row with a 44px hit area. */}
      <details className="mt-2 rounded-xl bg-currena-soft/60 px-3 py-1 dark:bg-white/[0.04]">
        <summary className="-mx-3 flex min-h-[44px] cursor-pointer select-none items-center px-3 text-xs font-semibold text-currena-muted">
          {copy.ui.chartTable}
        </summary>
        <table className="mt-2 w-full text-xs tabular-nums">
          <thead>
            <tr className="text-currena-muted">
              <th scope="col" className="py-1 text-start font-semibold">
                {copy.ui.chartColDate}
              </th>
              <th scope="col" className="py-1 text-end font-semibold">
                {copy.ui.chartColValue}
              </th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.iso} className="border-t border-black/[0.05] dark:border-white/[0.06]">
                <td className="py-1 text-start">
                  <bdi>{formatAsOf(row.iso, locale)}</bdi>
                </td>
                <td className="py-1 text-end">
                  <bdi>{num(row.value, numberLocale)}</bdi>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
