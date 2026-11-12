/**
 * markets/IndexDetailModal — the detail dialog opened when a treemap tile is
 * selected. Shows the index's name + country, the drawdown status, the level,
 * the 52-week band, the full five-period return ladder and the demo-cap line.
 *
 * Uses the shadcn Dialog (Radix) for the focus trap, Escape-to-close, backdrop
 * click and the a11y roles (role=dialog, aria-modal) — keyboard and
 * screen-reader users get a proper modal, not a styled div. The Dialog is
 * always rendered (never early-returned) so Radix can animate out + restore
 * focus to the treemap tile on close; the entry persists across the close
 * transition (the parent keeps the last entry until after the exit animation).
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { EnrichedIndex, PeriodDef } from './types';
import { fmtLevel, fmtPct, fmtMinusPct, fmtCap } from '@/lib/format';
import {
  periodValueOf,
  periodWordOf,
  drawdownKindOf,
  DRAWDOWN_KIND_LABEL,
  bandedArrow,
  PERIODS,
} from '@/lib/markets';
import type { DrawdownKind } from '@/lib/markets';

/** The bright return ink class for a signed reading. */
function returnToneClass(arrow: 'up' | 'down' | 'flat'): string {
  if (arrow === 'up') return 'text-[var(--color-return-up)]';
  if (arrow === 'down') return 'text-[var(--color-return-down)]';
  return 'text-[var(--color-text-primary)]';
}

/** The crisp filled triangle. */
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

/** The status chip tone for a drawdown kind. */
function statusToneClass(kind: DrawdownKind): string {
  if (kind === 'correction') return 'bg-[var(--color-return-down)]/12 text-[var(--color-return-down)]';
  if (kind === 'bear') return 'bg-[var(--currena-warning)]/12 text-[var(--currena-warning)]';
  if (kind === 'pullback') return 'bg-[var(--currena-muted)]/12 text-[var(--color-text-secondary)]';
  return 'bg-[var(--color-return-up)]/12 text-[var(--color-return-up)]';
}

/** The modal body — takes a non-null entry (guarded by the parent). */
function ModalBody({
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
  const periodWord = periodWordOf(period);

  return (
    <>
      <DialogHeader className="gap-1 border-b border-[var(--color-border)] p-5 pb-4 text-left sm:text-left">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-bold text-[var(--color-text-primary)]">
              {entry.name}
            </DialogTitle>
            <p className="m-0 mt-0.5 text-[var(--color-text-tertiary)]">
              {entry.country} &middot; {entry.symbol.toUpperCase()} &middot; as of {asOfDisplay}
            </p>
          </div>
          <span
            className={[
              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              statusToneClass(kind),
            ].join(' ')}
          >
            {DRAWDOWN_KIND_LABEL[kind]}
          </span>
        </div>
        {/* The headline return for the selected period. */}
        <div className={['mt-3 flex items-center gap-2', returnToneClass(arrow)].join(' ')}>
          <DirTriangle dir={arrow} size={16} />
          <span className="text-3xl font-bold tabular-nums">
            {pct === null ? '\u2014' : fmtPct(pct)}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-tertiary)]">{periodWord}</span>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-5 p-5">
        {/* The level + 52-week band. */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Metric label="Level" value={fmtLevel(entry.level)} />
          <Metric label="52-week high" value={fmtLevel(entry.high52w)} />
          <Metric label="52-week low" value={fmtLevel(entry.low52w)} />
          <Metric label="From high" value={fmtMinusPct(entry.fromHigh)} />
        </div>

        {/* The full five-period return ladder — the selected lens is ringed. */}
        <div>
          <div className="text-[length:var(--type-caption)] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Returns
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {PERIODS.map((p) => {
              const v = periodValueOf(entry, p.key);
              const a = bandedArrow(v);
              const active = p.key === period;
              return (
                <div
                  key={p.key}
                  className={[
                    'flex flex-col items-center gap-1 rounded-md px-1 py-2 ring-1 ring-inset',
                    active ? 'ring-[var(--currena-warning)]' : 'ring-[var(--color-border)]',
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

        <p className="m-0 border-t border-[var(--color-border)] pt-4 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          Market cap &asymp; ${fmtCap(entry.capT)}T (illustrative demo data) &middot; snapshot as of {asOfDisplay}
        </p>
      </div>
    </>
  );
}

export function IndexDetailModal({
  entry,
  period,
  asOfDisplay,
  open,
  onOpenChange,
}: {
  /** The entry to display. Kept across the close transition so the Radix
   *  Dialog can play its exit animation + restore focus to the trigger; null
   *  only before the first open (the content is not mounted while closed). */
  entry: EnrichedIndex | null;
  period: PeriodDef;
  asOfDisplay: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md rounded-[var(--radius-md)] border-[var(--color-border)] bg-[var(--color-surface)] p-0 sm:max-w-md"
      >
        {/* A stable sr-only description (no explicit id — Radix auto-links it
         *  to the content's aria-describedby via its internal descriptionId;
         *  an explicit id would break that link and trip the missing-
         *  description warning). Gives screen readers a one-line summary. */}
        <DialogDescription className="sr-only">
          {entry !== null
            ? `${entry.name}, ${entry.country}: index level, 52-week range, and the five-period return ladder.`
            : 'Index detail dialog.'}
        </DialogDescription>
        {entry !== null ? <ModalBody entry={entry} period={period} asOfDisplay={asOfDisplay} /> : null}
      </DialogContent>
    </Dialog>
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
