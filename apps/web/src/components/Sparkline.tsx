/**
 * Sparkline — a zero-dependency SVG micro-trend chart (rate-history feature).
 *
 * Renders a normalized polyline with a soft gradient area fill and an end
 * dot. Round-2 R9: Insights sparklines pass tone="neutral" — ONE neutral
 * stroke token for every sparkline, direction shown by the number + arrow
 * beside it, never by colour. LiveRates (outside the round-2 scope) keeps
 * the direction colours by default.
 *
 * Static SVG only — nothing animates, so it is inherently reduced-motion
 * safe. RTL-agnostic (charts read left→right in both app locales, matching
 * common Persian financial chart convention). Screen readers get the
 * `aria-label` (callers pass a localized summary).
 */

import { useId } from 'react';

interface SparklineProps {
  /** Oldest → newest observations. Non-finite values must be pre-filtered. */
  points: number[];
  /** Rendered width in px (viewBox matches; CSS can still scale it). */
  width?: number;
  /** Rendered height in px. */
  height?: number;
  /** Localized screen-reader summary, e.g. "USD to IRR trend, up 0.4% over 12 checks". */
  ariaLabel: string;
  /** Extra classes for the root <svg>. */
  className?: string;
  /** Override the direction color (defaults to computed trend). */
  direction?: 'up' | 'down' | 'flat';
  /** R9: one neutral stroke token for ALL Insights sparklines. */
  tone?: 'direction' | 'neutral';
}

const COLORS = {
  up: { stroke: '#22c55e', dot: '#4ade80', fillFrom: 'rgba(34,197,94,0.28)' },
  down: { stroke: '#ef4444', dot: '#f87171', fillFrom: 'rgba(239,68,68,0.24)' },
  flat: { stroke: 'currentColor', dot: 'currentColor', fillFrom: 'rgba(148,163,184,0.15)' },
  neutral: { stroke: 'currentColor', dot: 'currentColor', fillFrom: 'rgba(148,163,184,0.10)' },
} as const;

/** Map a value in [min, max] to y in [pad, height - pad] (inverted: up = high). */
function scaleY(value: number, min: number, max: number, height: number, pad: number): number {
  if (max === min) return height / 2; // flat series — center line
  const t = (value - min) / (max - min);
  return height - pad - t * (height - 2 * pad);
}

export function Sparkline({
  points,
  width = 132,
  height = 40,
  ariaLabel,
  className = '',
  direction,
  tone = 'direction',
}: SparklineProps) {
  const gradId = useId();
  const clean = points.filter((p) => Number.isFinite(p));

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

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const firstVal = clean[0];
  const lastVal = clean[clean.length - 1];
  if (firstVal === undefined || lastVal === undefined) return null; // unreachable (clean.length ≥ 2)
  const trendDir = tone === 'neutral' ? 'neutral' : (direction ?? (lastVal > firstVal ? 'up' : lastVal < firstVal ? 'down' : 'flat'));
  const colors = COLORS[trendDir];

  const pad = 4;
  const stepX = (width - 2 * pad) / (clean.length - 1);
  const coords = clean.map((v, i) => ({ x: pad + i * stepX, y: scaleY(v, min, max, height, pad) }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  const firstPt = coords[0];
  const lastPt = coords[coords.length - 1];
  if (firstPt === undefined || lastPt === undefined) return null; // unreachable (clean.length ≥ 2)
  const area = `${line} L${lastPt.x.toFixed(2)},${height - 1} L${firstPt.x.toFixed(2)},${height - 1} Z`;
  const last = lastPt;

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
          <stop offset="0%" stopColor={colors.fillFrom} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      {/* Soft band between min and max — subtle context for the line. */}
      {max !== min ? (
        <rect
          x={pad}
          y={scaleY(max, min, max, height, pad)}
          width={width - 2 * pad}
          height={Math.max(2, scaleY(min, min, max, height, pad) - scaleY(max, min, max, height, pad))}
          fill="rgba(148,163,184,0.08)"
          rx={2}
        />
      ) : null}
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r={3} fill={colors.dot} stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
    </svg>
  );
}
