/**
 * signals/icons — the condition/lean glyph set (Phase: WS-4 module split
 * of the former Signals.tsx monolith — zero behavior change, code moved
 * verbatim). Icon + word, never colour alone (S1/R26 note). No check or
 * cross glyphs anywhere (R26 — pinned by round2.test.ts's raw-source
 * guard, which now covers this file). Round 22: the word takes the
 * state's status ink (owner green/red coding), the icon inherits via
 * currentColor.
 */

import type { SignalConditionReading, SignalLean } from '@currena/insights';

/** Round 22 (owner): supportive = green ink, against = red ink,
 * neutral/unknown = stale. The icon inherits via currentColor. */
export function stateToneClass(state: SignalConditionReading['state']): string {
  switch (state) {
    case 'supportive':
      return 'text-[var(--color-status-normal)]';
    case 'against':
      return 'text-[var(--color-status-alert)]';
    default:
      return 'text-[var(--color-status-stale)]';
  }
}

export function ConditionIcon({ state }: { state: SignalConditionReading['state'] }) {
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
  switch (state) {
    case 'supportive':
      // A rising step line — "supports", not a tick.
      return (
        <svg {...common}>
          <path d="M2.5 11.5l4-4 2.5 2.5 4.5-5" />
        </svg>
      );
    case 'against':
      // A falling step line — "works against", not a cross.
      return (
        <svg {...common}>
          <path d="M2.5 6.5l4 4 2.5-2.5 4.5 5" />
        </svg>
      );
    case 'neutral':
      return (
        <svg {...common}>
          <path d="M4 8h8" />
        </svg>
      );
    case 'unknown':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.6V8l2.4 1.6" />
        </svg>
      );
  }
}

export function LeanIcon({ lean }: { lean: SignalLean }) {
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
  switch (lean) {
    case 'mostly-supportive':
      return (
        <svg {...common}>
          <path d="M2.5 11.5l4-4 2.5 2.5 4.5-5" />
        </svg>
      );
    case 'mixed':
      return (
        <svg {...common}>
          <path d="M2.5 11.5l3.5-3.5 2.5 2.5" />
          <path d="M8 6.5l2-2 3.5 3.5" opacity="0.55" />
        </svg>
      );
    case 'mostly-unsupportive':
      return (
        <svg {...common}>
          <path d="M2.5 6.5l4 4 2.5-2.5 4.5 5" />
        </svg>
      );
  }
}
