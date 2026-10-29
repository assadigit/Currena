/**
 * TopMoversStrip — 2026-10-29 owner round ("the section pills are too
 * small and not really emphasized … it only shows one item; it can show
 * top 5 changes"): the TOP-5 CHANGES strip that rides the sticky JumpNav
 * under the section pills.
 *
 * Ranking rules (pure, honest):
 *  - only readings with a live value (stale/unavailable/check-pending
 *    never headline — the same guard bigMovers uses);
 *  - only PERCENT-kind changes: a points move (yield gaps) and a ratio
 *    move are not comparable with a percent move, and ranking across
 *    kinds would order them arbitrarily;
 *  - ranked by |change30d| (the universally present window — the same
 *    window the hero's biggest-move callout uses), descending, top 5;
 *  - each chip opens the indicator's details panel (the card's own
 *    numbers stay the source of truth).
 *
 * RTL-safe: the signed change rides its own ltr <bdi> island (the app's
 * standing number rule); the chip is a button, 44px target.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { definitionFor, formatChange, changeToneClass } from './config';

export interface MoverRow {
  id: IndicatorId;
  /** The signed 30-day change the strip shows. */
  change30d: number;
}

/** The top-N |change30d| rows among percent-kind readings (pure). */
export function topMovers(
  readings: readonly IndicatorReading[],
  limit = 5,
): MoverRow[] {
  const rows: MoverRow[] = [];
  for (const r of readings) {
    if (r.status === 'stale' || r.status === 'unavailable' || r.status === 'check-pending') continue;
    if (r.change30d === undefined || !Number.isFinite(r.change30d)) continue;
    const def = definitionFor(r.id);
    if (def.changeKind !== 'pct') continue; // percents only — comparable ranking
    rows.push({ id: r.id, change30d: r.change30d });
  }
  rows.sort((a, b) => Math.abs(b.change30d) - Math.abs(a.change30d));
  return rows.slice(0, limit);
}

export function TopMoversStrip({
  readings,
  copy,
  numberLocale,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const movers = useMemo(() => topMovers(readings, 5), [readings]);
  if (movers.length === 0) return null;
  return (
    <div
      className="no-print flex flex-wrap items-center gap-1.5 pt-1"
      data-top-movers
      aria-label={copy.ui.moversTitle}
    >
      <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
        {copy.ui.moversTitle}
      </span>
      {movers.map((m) => {
        const tone = changeToneClass(m.change30d);
        return (
          <button
            key={m.id}
            type="button"
            onClick={(e) => onFocusCard(m.id, e.currentTarget)}
            className="insights-focusable inline-flex min-h-[36px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition-colors hover:text-[var(--color-text-primary)] hover:ring-[var(--color-text-secondary)]/40"
            aria-label={`${copy.indicators[m.id].name}: ${formatChange(m.change30d, 'pct', numberLocale, copy.units)}, ${copy.ui.days30}`}
          >
            <span className="max-w-[11rem] truncate">{copy.indicators[m.id].name}</span>
            <bdi dir="ltr" className={`tabular-nums font-bold ${tone}`}>
              {formatChange(m.change30d, 'pct', numberLocale, copy.units)}
            </bdi>
          </button>
        );
      })}
    </div>
  );
}
