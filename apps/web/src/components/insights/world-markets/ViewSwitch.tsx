/**
 * world-markets/ViewSwitch — the period radiogroup (02-ui-spec §3.3, the
 * 2026-10-18 world-indices handoff round, as amended by round 47): Daily |
 * Weekly | Monthly | Quarterly | Yearly — ascending duration, and NOTHING
 * else. The yearly lens rides the stored chg1y field (round 47); no YTD
 * exists in the contract and the 52-week-high distance is secondary
 * context, not a period (see briefing.ts).
 *
 * A real radiogroup, arrow keys work; the NORMAL timeframe stays the
 * quarterly window (owner round 44) — the lens the section opens on.
 */

import { useRef } from 'react';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { PERIOD_VIEWS } from './briefing';
import type { MarketsView } from './shared';

/* ------------------------------------------------------------------ *
 * The view switch (§6.3 as amended): a real radiogroup, arrow keys
 * work. The NORMAL timeframe is the quarterly window — it is the lens
 * the section opens on (owner round 44); the shorter lenses stay one
 * tap away.
 * ------------------------------------------------------------------ */

const VIEW_LABEL: Record<MarketsView, 'viewDaily' | 'viewWeekly' | 'viewMonthly' | 'viewQuarterly' | 'viewYearly'> = {
  today: 'viewDaily',
  '1w': 'viewWeekly',
  '1m': 'viewMonthly',
  '3m': 'viewQuarterly',
  '1y': 'viewYearly',
};

/** The localized period word for a lens — labels, aria sentences and the
 * movers' period caption all read it, so one mapping drives every
 * mention of "which period am I in". */
export function periodWord(view: MarketsView, copy: InsightsCopy): string {
  return copy.markets[VIEW_LABEL[view]];
}

export function ViewSwitch({
  view,
  copy,
  onChange,
}: {
  view: MarketsView;
  copy: InsightsCopy;
  onChange: (v: MarketsView) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % PERIOD_VIEWS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + PERIOD_VIEWS.length) % PERIOD_VIEWS.length;
    else return;
    e.preventDefault();
    const target = refs.current[next];
    target?.focus();
    target?.click();
  };
  return (
    <div
      role="radiogroup"
      aria-label={copy.markets.viewSwitchAria}
      className="inline-flex max-w-full overflow-x-auto rounded-full bg-currena-soft/70 p-0.5 ring-1 ring-[var(--color-border)]"
    >
      {PERIOD_VIEWS.map((v, i) => {
        const selected = view === v;
        return (
          <button
            key={v}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(v)}
            className={`insights-focusable min-h-[36px] cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-[length:var(--type-caption)] font-semibold transition-colors ${
              selected
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {copy.markets[VIEW_LABEL[v]]}
          </button>
        );
      })}
    </div>
  );
}
