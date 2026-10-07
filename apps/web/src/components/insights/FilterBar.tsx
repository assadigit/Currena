/**
 * FilterBar — I8: the card-grid toolbar (status chips + text search).
 *
 * 30 cards across two sections is a lot to scan; the toolbar narrows the
 * grid without leaving the page (spec §3 option A stays intact — the story
 * blocks above are untouched, the sections below respond live). Filtering
 * is a VIEW tool only: section/group warning-count lines keep describing
 * the full data, never the filtered subset.
 *
 *  - Status chips: single-select, real buttons with aria-pressed, the same
 *    pill DNA as JumpNav (44px targets). Active state uses the status's own
 *    deep-ink tone (WCAG-AA tokens from the I6 pass).
 *  - Search: matches indicator name + ticker, case-insensitive; Persian
 *    queries are normalised (Arabic yeh/kaf → Persian, ZWNJ dropped — see
 *    config.ts) so «سرمایه گذاری» typed with a plain space still hits
 *    «سرمایه‌گذاری».
 *  - The result count is aria-live="polite" so screen-reader users hear the
 *    effect of a filter, and carries a "Clear filters" reset.
 *  - Hidden on paper (`.no-print`, index.css @media print).
 */

import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { StatusFilter } from './config';

/** Active chip surface per status — the I6 deep-ink families. */
const CHIP_ACTIVE: Readonly<Record<StatusFilter, string>> = {
  all: 'border-currena-blue/40 bg-currena-blue/15 text-currena-blue-deep',
  warning: 'border-currena-warning/40 bg-currena-warning/15 text-currena-warning-deep',
  normal: 'border-currena-success/40 bg-currena-success/15 text-currena-success-deep',
  context: 'border-currena-blue/40 bg-currena-blue/15 text-currena-blue-deep',
};

export interface FilterBarProps {
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** Total cards in the snapshot (unfiltered). */
  total: number;
  /** Cards currently visible under the filter. */
  shown: number;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export function FilterBar({
  copy,
  numberLocale,
  total,
  shown,
  status,
  onStatusChange,
  query,
  onQueryChange,
}: FilterBarProps) {
  const filtering = status !== 'all' || query.trim() !== '';
  const chips: readonly { value: StatusFilter; label: string }[] = [
    { value: 'all', label: copy.ui.filterAll },
    { value: 'warning', label: copy.ui.filterWarning },
    { value: 'normal', label: copy.ui.filterNormal },
    { value: 'context', label: copy.ui.filterContext },
  ];
  const placeholder = interpolate(copy.ui.searchPlaceholder, {
    n: formatNumber(total, numberLocale, { maximumFractionDigits: 0 }),
  });
  const clearAll = (): void => {
    onStatusChange('all');
    onQueryChange('');
  };

  return (
    <div className="no-print flex flex-col gap-2 rounded-[18px] bg-currena-soft/60 px-3 py-3 ring-1 ring-black/[0.05] dark:bg-white/[0.04] dark:ring-white/[0.07]">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={copy.ui.filterLabel} className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => {
            const active = chip.value === status;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(chip.value)}
                className={`inline-flex min-h-[44px] cursor-pointer items-center whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                  active
                    ? CHIP_ACTIVE[chip.value]
                    : 'border-black/10 bg-white text-currena-dark hover:border-currena-blue/40 hover:bg-currena-blue/10 dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark dark:hover:border-currena-blue/40'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <span aria-hidden="true" className="absolute start-3.5 top-1/2 -translate-y-1/2 text-sm">
            🔍
          </span>
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label={copy.ui.searchLabel}
            placeholder={placeholder}
            className="h-11 w-full rounded-full border border-black/10 bg-white ps-10 pe-11 text-sm text-currena-dark placeholder:text-currena-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark"
          />
          {query !== '' ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label={copy.ui.searchClear}
              className="absolute end-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-base text-currena-muted transition-colors hover:bg-black/[0.05] hover:text-currena-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:hover:bg-white/[0.08] dark:hover:text-currena-dark"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      </div>
      {filtering ? (
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold text-currena-muted" aria-live="polite">
          <span className="tabular-nums">
            {interpolate(copy.ui.resultsShown, {
              shown: formatNumber(shown, numberLocale, { maximumFractionDigits: 0 }),
              total: formatNumber(total, numberLocale, { maximumFractionDigits: 0 }),
            })}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-2 text-[0.7rem] font-bold text-currena-blue-deep underline decoration-currena-blue/40 underline-offset-2 transition-colors hover:bg-currena-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:text-currena-blue"
          >
            {copy.ui.clearFilters}
          </button>
        </p>
      ) : null}
    </div>
  );
}
