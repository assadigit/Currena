/**
 * world-markets/ViewSwitch — the Today | 3 months | From 52-week-high
 * lens switch (§6.3; split from WorldMarkets.tsx, code moved verbatim).
 * A real radiogroup, arrow keys work; the NORMAL timeframe is 3 months.
 */

import { useRef } from 'react';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import type { MarketsView } from './shared';

/* ------------------------------------------------------------------ *
 * The view switch (§6.3): a real radiogroup, arrow keys work. The NORMAL
 * timeframe is 3 months — it is the lens the section opens on (owner
 * round 44; Today stays one tap away).
 * ------------------------------------------------------------------ */

const VIEWS: readonly MarketsView[] = ['today', '3m', 'high'];
const VIEW_LABEL: Record<MarketsView, 'viewToday' | 'view3m' | 'viewFromHigh'> = {
  today: 'viewToday',
  '3m': 'view3m',
  high: 'viewFromHigh',
};

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
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % VIEWS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + VIEWS.length) % VIEWS.length;
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
      className="inline-flex max-w-full overflow-x-auto rounded-full bg-currena-muted/[0.08] p-0.5 ring-1 ring-[var(--color-border)]"
    >
      {VIEWS.map((v, i) => {
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

