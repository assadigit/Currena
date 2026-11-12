/**
 * markets/MarketTile — the region-grid tile + its expandable detail panel
 * (the IndexDetailPanel). The grid tiles below the treemap carry the SAME
 * content as the treemap tiles (name, signed return, drawdown kind) in a
 * card form factor; clicking a treemap tile or a grid tile toggles the SAME
 * detail panel (one shared `selected` symbol — spec §8).
 */

'use client';

import { ChevronDown } from 'lucide-react';
import type { EnrichedIndex, PeriodDef } from './types';
import { fmtLevel, fmtPct, fmtMinusPct, fmtCap } from '@/lib/format';
import {
  periodValueOf,
  periodWordOf,
  drawdownKindOf,
  DRAWDOWN_KIND_LABEL,
  bandedArrow,
} from '@/lib/markets';

/** The bright return ink class for a signed reading. */
function returnToneClass(arrow: 'up' | 'down' | 'flat'): string {
  if (arrow === 'up') return 'text-[var(--color-return-up)]';
  if (arrow === 'down') return 'text-[var(--color-return-down)]';
  return 'text-[var(--color-text-primary)]';
}

/** The crisp filled triangle (▲ up-green / ▼ down-red / bar flat). */
function DirTriangle({ dir, size = 10 }: { dir: 'up' | 'down' | 'flat'; size?: number }) {
  if (dir === 'flat') {
    return (
      <svg viewBox="0 0 10 10" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
        <rect x="0.5" y="3.5" width="9" height="3" rx="1" fill="currentColor" opacity={0.55} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
      <path d={dir === 'up' ? 'M5 1 9.5 9H.5z' : 'M.5 1h9L5 9z'} fill="currentColor" />
    </svg>
  );
}

/** The status chip tone for a drawdown kind (calm / attention / watch). */
function statusToneClass(kind: ReturnType<typeof drawdownKindOf>): string {
  if (kind === 'correction') return 'bg-[var(--color-return-down)]/12 text-[var(--color-return-down)]';
  if (kind === 'bear') return 'bg-[var(--currena-warning)]/12 text-[var(--currena-warning)]';
  if (kind === 'pullback') return 'bg-[var(--currena-muted)]/12 text-[var(--color-text-secondary)]';
  return 'bg-[var(--color-return-up)]/12 text-[var(--color-return-up)]';
}

/** One region-grid tile: name + country, the signed return for the selected
 *  period, the drawdown-kind tag, and the expand affordance. A real button
 *  (keyboard-operable, aria-expanded/aria-controls mirroring the treemap). */
export function MarketTile({
  entry,
  period,
  selected,
  onSelect,
}: {
  entry: EnrichedIndex;
  period: PeriodDef;
  selected: boolean;
  onSelect: (symbol: string) => void;
}): React.JSX.Element {
  const pct = periodValueOf(entry, period);
  const arrow = bandedArrow(pct);
  const kind = drawdownKindOf(entry.fromHigh);
  const periodWord = periodWordOf(period);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.symbol)}
      aria-expanded={selected}
      aria-controls={`insights-market-detail-${entry.symbol}`}
      aria-label={`${entry.name}, ${entry.country}: ${pct === null ? 'no reading' : fmtPct(pct)} over ${periodWord}, ${kind === 'nearHigh' ? 'near its high' : kind}, select for detail`}
      data-market-tile={entry.symbol}
      className={[
        'insights-focusable group flex w-full flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-left ring-1 transition-colors sm:p-4',
        selected
          ? 'ring-2 ring-[var(--currena-warning)]'
          : 'ring-[var(--color-border)] hover:ring-[var(--color-border-strong)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{entry.name}</div>
          <div className="truncate text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {entry.country}
          </div>
        </div>
        <span
          className={[
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            statusToneClass(kind),
          ].join(' ')}
        >
          {DRAWDOWN_KIND_LABEL[kind]}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className={['flex items-center gap-1.5', returnToneClass(arrow)].join(' ')}>
          <DirTriangle dir={arrow} />
          <span className="text-base font-bold tabular-nums sm:text-lg">
            {pct === null ? '\u2014' : fmtPct(pct)}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <span className="tabular-nums">{fmtLevel(entry.level)}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${selected ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </div>
    </button>
  );
}

/** The expandable detail panel (the IndexDetailPanel). One panel per tile,
 *  revealed when the tile (or a treemap tile) is selected. Carries the
 *  level, the 52-week band, the drawdown distance, the full return ladder
 *  and the demo-cap line. */
export function IndexDetailPanel({
  entry,
  period,
  asOfDisplay,
}: {
  entry: EnrichedIndex;
  period: PeriodDef;
  asOfDisplay: string;
}): React.JSX.Element {
  const kind = drawdownKindOf(entry.fromHigh);
  const pct = periodValueOf(entry, period);
  const arrow = bandedArrow(pct);

  const ladder: { key: PeriodDef; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <div
      id={`insights-market-detail-${entry.symbol}`}
      role="region"
      aria-label={`${entry.name} detail`}
      data-market-detail={entry.symbol}
      className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="m-0 text-base font-bold text-[var(--color-text-primary)] sm:text-lg">{entry.name}</h4>
          <p className="m-0 mt-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {entry.country} &middot; as of {asOfDisplay}
          </p>
        </div>
        <span
          className={[
            'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
            statusToneClass(kind),
          ].join(' ')}
        >
          {DRAWDOWN_KIND_LABEL[kind]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Metric label="Level" value={fmtLevel(entry.level)} />
        <Metric label="52-week high" value={fmtLevel(entry.high52w)} />
        <Metric label="52-week low" value={fmtLevel(entry.low52w)} />
        <Metric label="From high" value={fmtMinusPct(entry.fromHigh)} />
      </div>

      <div className="mt-4">
        <div className="text-[length:var(--type-caption)] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Returns
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {ladder.map((p) => {
            const v = periodValueOf(entry, p.key);
            const a = bandedArrow(v);
            return (
              <div
                key={p.key}
                className={[
                  'flex flex-col items-center gap-0.5 rounded-md px-1.5 py-2 ring-1 ring-inset',
                  p.key === period
                    ? 'ring-[var(--currena-warning)]'
                    : 'ring-[var(--color-border)]',
                ].join(' ')}
              >
                <span className="text-[10px] font-medium uppercase text-[var(--color-text-tertiary)]">{p.label}</span>
                <span className={['flex items-center gap-0.5 text-xs font-bold tabular-nums', returnToneClass(a)].join(' ')}>
                  <DirTriangle dir={a} size={8} />
                  {v === null ? '\u2014' : fmtPct(v)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="m-0 mt-4 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        Market cap &asymp; ${fmtCap(entry.capT)}T (illustrative) &middot; snapshot as of {asOfDisplay}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <div className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}
