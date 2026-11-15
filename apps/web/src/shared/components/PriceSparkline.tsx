/**
 * PriceSparkline — the prices-board tile's seven-day line
 * (financial-asset-cards spec pack, 04 §4).
 *
 * Sibling of the shared Sparkline.tsx (which stays untouched — LiveRates
 * and the compact rows keep their index-spaced chart): this variant
 * upgrades X positions to DAY-BASED spacing, the spec's honesty rule —
 * a weekend/market-holiday gap renders as the honest passage of time
 * between two real observations. Nothing is interpolated, and no
 * observation is implied where none exists.
 *
 * Inherited honesty rules (from the shared chart + R9):
 *  - neutral ink only (direction rides in the signed percentage and the
 *    trend word beside the chart — never colour alone);
 *  - amplitude is honest: the y-domain is padded to ≥2.5% of the series'
 *    mid-level so sub-percent re-quote jitter never renders as a
 *    dramatic full-height zigzag;
 *  - fewer than two usable points ⇒ the dashed "not enough data" line,
 *    never a fabricated flat line;
 *  - static SVG — inherently reduced-motion safe;
 *  - charts read left→right in both app locales (the Persian financial
 *    chart convention);
 *  - accessible through the caller's aria-label (asset + window + move).
 */

import { useId } from 'react';
import type { TrendPoint } from './price-trend';

interface PriceSparklineProps {
  /** Oldest → newest real observations (already validated by price-trend). */
  points: TrendPoint[];
  /** Rendered width in px (viewBox matches; CSS can still scale it). */
  width?: number;
  /** Rendered height in px. */
  height?: number;
  /** Localized screen-reader summary (asset + window + movement). */
  ariaLabel: string;
  /** Extra classes for the root <svg>. */
  className?: string;
}

/** Minimum plot range as a fraction of the series' mid-level (honesty pad). */
const MIN_REL_RANGE = 0.025;

export function PriceSparkline({
  points,
  width = 300,
  height = 46,
  ariaLabel,
  className = '',
}: PriceSparklineProps) {
  const gradId = useId();
  const clean = points.filter((p) => Number.isFinite(p.value));

  // Placeholder: fewer than 2 usable points — honest "not enough data yet".
  if (clean.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className={`${className} text-currena-muted/50`}
        preserveAspectRatio="none"
      >
        <line
          x1={4}
          x2={width - 4}
          y1={height / 2}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="3 5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const dataMin = Math.min(...clean.map((p) => p.value));
  const dataMax = Math.max(...clean.map((p) => p.value));
  // Padded plot domain: [mid − half, mid + half] with half ≥ dataRange/2, so
  // the data ALWAYS fits and calm series get proportionally calm amplitude.
  const mid = (dataMin + dataMax) / 2;
  const dataRange = dataMax - dataMin;
  const halfRange = Math.max(dataRange / 2, (Math.abs(mid) * MIN_REL_RANGE) / 2);
  const domainMin = mid - halfRange;
  const domainMax = mid + halfRange;

  const pad = 4;
  // DAY-BASED x positions: the honest calendar spacing between observations.
  const firstDay = clean[0]!.day;
  const lastDay = clean[clean.length - 1]!.day;
  const daySpan = Math.max(1, lastDay - firstDay);
  const xOf = (day: number) => pad + ((day - firstDay) / daySpan) * (width - 2 * pad);
  const yOf = (value: number) => {
    if (domainMax === domainMin) return height / 2; // flat series — center line
    const t = (value - domainMin) / (domainMax - domainMin);
    return height - pad - t * (height - 2 * pad);
  };

  const coords = clean.map((p) => ({ x: xOf(p.day), y: yOf(p.value) }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  const firstPt = coords[0]!;
  const lastPt = coords[coords.length - 1]!;
  if (firstPt === undefined || lastPt === undefined) return null; // unreachable (clean.length ≥ 2)
  const area = `${line} L${lastPt.x.toFixed(2)},${height - 1} L${firstPt.x.toFixed(2)},${height - 1} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(148,163,184,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      {/* A quiet baseline under the line (a reference, not an axis). */}
      <line
        x1={pad}
        x2={width - pad}
        y1={height - 1.5}
        y2={height - 1.5}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.15}
      />
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastPt.x} cy={lastPt.y} r={3} fill="currentColor" opacity={0.9} />
    </svg>
  );
}
