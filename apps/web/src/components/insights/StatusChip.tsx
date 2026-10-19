/**
 * StatusChip — SVG icon + word, never colour alone (spec §9 + Block G5).
 * Emoji glyphs are gone (G5: "Emoji glyphs look different on each operating
 * system"): inline SVG icons, 16px, stroke-currentColor, aria-hidden
 * (the word carries the meaning).
 *
 * v3 UI_SPEC §4 (2026-10-20): ONE state language on the page — exactly six
 * words: Normal · Needs attention · Context · Stale · Delayed · Can't tell
 * right now. Retired display words: "Unusual" (the tier stays internal for
 * sorting/movers/exports — its card shows the Normal word and the 10-year
 * position bar carries the extremity), "Check pending", "Limited history"
 * (no-history displays as Context), "No data" (unavailable displays as
 * Can't tell right now, UI-17).
 *
 * UI-15 contrast (tone classes live in index.css as .chip-* so the ink
 * tokens sit beside their measured ratios): the light-theme chip TEXT inks
 * are darker siblings of the owner-pinned state hues — measured before →
 * after (WCAG, against the card surface AND each chip's own tint):
 *   Normal   #24a148 → #0E6027 : 3.35:1 → 7.71:1 (white) / 6.70:1 (tint)
 *   Unusual  #f1c21b → (retired; the Delayed chip now uses the bronze
 *                     #7A5D00 watch ink: 1.61:1 → 6.19:1 / 5.87:1)
 *   Attention #da1e28 → #B91C1C : 4.99:1 white but 4.31:1 on its coral tint
 *                     → 6.47:1 white / 5.57:1 tint
 *   Context  #245E9F unchanged (6.63:1 / 6.23:1) · Muted #46505C (8.20/6.80).
 * The owner-pinned state palette itself (meters, icons, verdict instrument)
 * is untouched — only the chip's own text/icon ink changed.
 */

import type { IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { IndicatorTier } from './config';

/** The copy.status key whose word this chip renders (v3 six-word table). */
export type ChipWordKey =
  | 'warning'
  | 'normal'
  | 'context'
  | 'stale'
  | 'delayed'
  | 'check-pending'
  | 'unavailable';

/** The v3 §4 word for one reading: one lookup, shared by every chip. */
export function chipWordKeyOf(
  status: IndicatorReading['status'],
  tier?: IndicatorTier,
): ChipWordKey {
  if (tier === 'delayed') return 'delayed';
  switch (status) {
    case 'warning':
      return 'warning';
    case 'normal':
      return 'normal'; // the unusual tier renders the Normal word (v3)
    case 'context':
    case 'no-history':
      return 'context'; // v3: no-history displays as Context
    case 'stale':
      return 'stale';
    case 'check-pending':
      return 'check-pending'; // word: Can't tell right now (value hidden)
    case 'unavailable':
      return 'unavailable'; // word: Can't tell right now (reason one-liner)
  }
}

/** The icon shape per (status, tier) — word + icon, never colour alone. */
function chipIconKind(
  status: IndicatorReading['status'],
  tier?: IndicatorTier,
): IndicatorReading['status'] | 'unusual' | 'delayed' {
  if (tier === 'delayed') return 'delayed';
  if (tier === 'unusual') return 'normal'; // retired diamond: a Normal face
  if (status === 'no-history') return 'context';
  return status;
}

/** Inline SVG icons (16×16, stroke = currentColor). */
function StatusIcon({ kind }: { kind: IndicatorReading['status'] | 'unusual' | 'delayed' }) {
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
      // attention: triangle (spec §4)
      return (
        <svg {...common}>
          <path d="M8 1.8 14.6 13.4H1.4L8 1.8Z" />
          <path d="M8 6.2v3.4" />
          <path d="M8 11.7h.01" />
        </svg>
      );
    case 'unusual':
      // R5: a diamond — "notable", not good or bad (kept for internal
      // consumers; the card face renders the Normal check below).
      return (
        <svg {...common}>
          <path d="M8 1.8 14.2 8 8 14.2 1.8 8 8 1.8Z" />
        </svg>
      );
    case 'normal':
      // Normal: check circle (spec §4)
      return (
        <svg {...common}>
          <path d="M2.8 8.4l3.4 3.4L13.2 4.4" />
        </svg>
      );
    case 'context':
      // Context: info circle (spec §4)
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 7.4v4" />
          <path d="M8 4.6h.01" />
        </svg>
      );
    case 'stale':
      // Stale: clock (spec §4)
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.6V8l2.4 1.6" />
        </svg>
      );
    case 'delayed':
      // Delayed: clock with a lagging hand (spec §4 — clock; the trailing
      // hand tells it apart from Stale's at-a-glance, the word says the rest)
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M5.2 8.8 8 8l1.6-2.8" />
          <path d="M8 12.2h.01" />
        </svg>
      );
    // Fix spec A-03/A-04: the held-value state — a clock with a question
    // mark's pause, same muted tone as stale (word: Can't tell right now).
    case 'check-pending':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M6.4 6.2a1.8 1.8 0 1 1 2.6 1.7c-.6.3-1 .7-1 1.4" />
          <path d="M8 11.6h.01" />
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
      // v3 §4: unavailable — dashed circle ("failed, blocked, unverified")
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" strokeDasharray="2.4 2.2" />
          <path d="M8 7.4v3" />
          <path d="M8 5.2h.01" />
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
  /** The display tier (unusual/delayed re-word the chip, v3 §4). */
  tier?: IndicatorTier;
}) {
  const wordKey = chipWordKeyOf(status, tier);
  const toneClass =
    wordKey === 'warning'
      ? 'chip-danger'
      : wordKey === 'normal'
        ? 'chip-success'
        : wordKey === 'context'
          ? 'chip-info'
          : wordKey === 'delayed'
            ? 'chip-watch'
            : 'chip-muted';
  const title =
    status === 'normal' && tier === 'unusual' ? copy.ui.unusualAria : undefined;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${toneClass}`}
      title={title}
    >
      <StatusIcon kind={chipIconKind(status, tier)} />
      {copy.status[wordKey]}
    </span>
  );
}
