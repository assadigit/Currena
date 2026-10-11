/**
 * LaneSwitch — Block L1: "Add a two-option segmented control: Australia and
 * Global. Default to Australia on the first visit. Remember the last choice
 * in local storage inside a try/catch block. Show only the chosen lane.
 * Keep both verdicts visible in the hero at all times." On phones the
 * control sits in a thumb-reachable sticky bar (M1).
 */

import type { InsightsSection } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { LANE_STORAGE_KEY } from './config';

export function LaneSwitch({
  lane,
  onLaneChange,
  copy,
}: {
  lane: InsightsSection;
  onLaneChange: (lane: InsightsSection) => void;
  copy: InsightsCopy;
}) {
  const options: readonly { value: InsightsSection; label: string }[] = [
    // R1: Global first, Australia second (decision D7).
    { value: 'global', label: copy.ui.laneGlobal },
    { value: 'australia', label: copy.ui.laneAustralia },
  ];
  const pick = (value: InsightsSection): void => {
    onLaneChange(value);
    try {
      window.localStorage.setItem(LANE_STORAGE_KEY, value);
    } catch {
      /* privacy mode — the choice stays session-only (Block L1's try/catch) */
    }
  };
  return (
    <div
      role="group"
      aria-label={copy.ui.laneLabel}
      className="insights-lane-mobile-bar mx-auto w-fit max-w-full rounded-full bg-[var(--color-surface)] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-[var(--color-border)]"
    >
      <span className="flex items-center gap-1">
        {options.map(({ value, label }) => {
          const active = value === lane;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => pick(value)}
              className={`insights-focusable inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-5 text-[length:var(--type-label)] font-bold transition-colors duration-200 ${
                active
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-currena-soft/60 dark:hover:bg-white/[0.06]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </span>
    </div>
  );
}
