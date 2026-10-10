/**
 * StatusChip — SVG icon + word, never colour alone (spec §9 + Block G5).
 * Emoji glyphs are gone (G5: "Emoji glyphs look different on each operating
 * system"): four inline SVG icons, 16px, stroke-currentColor, aria-hidden
 * (the word carries the meaning). Tones map onto the I15 status ink tokens.
 */

import type { IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { IndicatorTier, StatusTone } from './config';

// Ink-grade tokens (G4): ≥4.5:1 on each chip's own tint in BOTH themes.
const TONE_CLASSES: Record<StatusTone, string> = {
  danger: 'bg-currena-warning/15 text-[var(--color-status-alert)]',
  success: 'bg-currena-success/15 text-[var(--color-status-normal)]',
  info: 'bg-currena-blue/10 text-[var(--color-status-context)]',
  muted: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
};

/** Inline SVG icons (16×16, stroke = currentColor). */
function StatusIcon({ kind }: { kind: IndicatorReading['status'] | 'unusual' }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (kind) {
    case 'warning':
      return (
        <svg {...common}>
          <path d="M8 1.8 14.6 13.4H1.4L8 1.8Z" />
          <path d="M8 6.2v3.4" />
          <path d="M8 11.7h.01" />
        </svg>
      );
    case 'unusual':
      // R5: a diamond — "notable", not good or bad (icon + word, no colour
      // judgement).
      return (
        <svg {...common}>
          <path d="M8 1.8 14.2 8 8 14.2 1.8 8 8 1.8Z" />
        </svg>
      );
    case 'normal':
      return (
        <svg {...common}>
          <path d="M2.8 8.4l3.4 3.4L13.2 4.4" />
        </svg>
      );
    case 'context':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 7.4v4" />
          <path d="M8 4.6h.01" />
        </svg>
      );
    case 'stale':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.6V8l2.4 1.6" />
        </svg>
      );
    case 'no-history':
      return (
        <svg {...common}>
          <path d="M2.4 12.6 6 9l2.4 2 5.2-5" />
          <path d="M10.4 6h3.2v3.2" />
        </svg>
      );
    case 'unavailable':
      return (
        <svg {...common}>
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      );
  }
}

export function StatusChip({
  status,
  copy,
  tier,
}: {
  status: IndicatorReading['status'];
  copy: InsightsCopy;
  /** R5: when the display TIER differs from the internal status (unusual),
   *  the chip shows the tier word + icon instead. */
  tier?: IndicatorTier;
}) {
  const isUnusual = tier === 'unusual';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${
        isUnusual ? TONE_CLASSES.info : TONE_CLASSES[STATUS_TONE[status]]
      }`}
      title={isUnusual ? copy.ui.unusualAria : undefined}
    >
      <StatusIcon kind={isUnusual ? 'unusual' : status} />
      {isUnusual ? copy.ui.unusualWord : copy.status[status]}
    </span>
  );
}

/** Tone per status (kept next to the icons so the mapping is visible). */
const STATUS_TONE: Record<IndicatorReading['status'], StatusTone> = {
  warning: 'danger',
  normal: 'success',
  context: 'info',
  stale: 'muted',
  'no-history': 'muted',
  unavailable: 'muted',
};
