/**
 * ToolsMenu — round-2 Block R15: ONE "Tools" disclosure in the page header.
 *
 * Contains: search, the tier filter, the keyboard-shortcuts help, the
 * calendar (.ics) download and the CSV download. The old inline filter bar
 * and the "Keyboard: / j k" hint line are gone from the default page flow.
 * The shortcuts keep working (and "/" opens the menu and focuses the search).
 *
 * Proper disclosure: aria-expanded on the button, closes on Escape and on
 * outside click, focus returns to the button. Filter counts describe ONLY
 * the current lane (the old 41/10/20/11 row described the whole snapshot —
 * R15's "counts did not match the lane on screen" fix).
 */

import { useEffect, useRef } from 'react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { StatusFilter } from './config';

/** Active chip surface per tier — the I6 deep-ink families. */
const CHIP_ACTIVE: Readonly<Record<StatusFilter, string>> = {
  all: 'border-currena-blue/40 bg-currena-blue/15 text-currena-blue-deep',
  warning: 'border-currena-warning/40 bg-currena-warning/15 text-currena-warning-deep',
  unusual: 'border-currena-blue/40 bg-currena-blue/15 text-currena-blue-deep',
  normal: 'border-currena-success/40 bg-currena-success/15 text-currena-success-deep',
  context: 'border-currena-blue/40 bg-currena-blue/15 text-currena-blue-deep',
};

export interface ToolsMenuProps {
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Live tier counts for the CURRENT lane (not the whole snapshot — R15). */
  counts: { all: number; warning: number; unusual: number; normal: number; context: number };
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  /** The route wires the "/" focus-shortcut to this input. */
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onDownloadCsv: () => void;
  onDownloadIcs: () => void;
}

export function ToolsMenu({
  copy,
  numberLocale,
  open,
  onOpenChange,
  counts,
  status,
  onStatusChange,
  query,
  onQueryChange,
  searchInputRef,
  buttonRef,
  onDownloadCsv,
  onDownloadIcs,
}: ToolsMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const filtering = status !== 'all' || query.trim() !== '';

  // Escape closes and returns focus to the button; outside click closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      onOpenChange(false);
      buttonRef.current?.focus();
    };
    const onClick = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open, onOpenChange, buttonRef]);

  const chips: readonly { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: copy.ui.filterAll, count: counts.all },
    { value: 'warning', label: copy.ui.filterWarning, count: counts.warning },
    { value: 'unusual', label: copy.ui.filterUnusual, count: counts.unusual },
    { value: 'normal', label: copy.ui.filterNormal, count: counts.normal },
    { value: 'context', label: copy.ui.filterContext, count: counts.context },
  ];

  return (
    <div className="no-print relative" ref={panelRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="insights-tools-panel"
        onClick={() => onOpenChange(!open)}
        className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-currena-blue/50 hover:text-[var(--color-status-context)]"
      >
        <span aria-hidden="true">🛠</span>
        {copy.ui.toolsLabel}
        {filtering ? (
          <span
            aria-hidden="true"
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-currena-blue px-1 text-[0.62rem] font-bold text-white"
          >
            !
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="insights-tools-panel"
          className="absolute end-0 z-40 mt-2 flex w-[min(92vw,420px)] flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-border)]"
          role="group"
          aria-label={copy.ui.toolsLabel}
        >
          {/* Search. */}
          <div>
            <p className="m-0 mb-1 text-[var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {copy.ui.toolsSearch}
            </p>
            <div className="relative">
              <span aria-hidden="true" className="absolute start-3 top-1/2 -translate-y-1/2 text-sm">
                🔍
              </span>
              <input
                type="text"
                inputMode="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                aria-label={copy.ui.searchLabel}
                aria-keyshortcuts="/"
                placeholder={copy.ui.searchLabel}
                ref={searchInputRef}
                className="h-10 w-full rounded-full border border-black/10 bg-white ps-9 pe-3 text-sm text-currena-dark placeholder:text-currena-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark"
              />
            </div>
          </div>

          {/* The tier filter — counts describe the current lane only. */}
          <div>
            <p className="m-0 mb-1 text-[var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {copy.ui.toolsFilter}
            </p>
            <div role="group" aria-label={copy.ui.filterLabel} className="flex flex-wrap gap-1.5">
              {chips.map((chip) => {
                const active = chip.value === status;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onStatusChange(chip.value)}
                    className={`inline-flex min-h-[36px] cursor-pointer items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                      active
                        ? CHIP_ACTIVE[chip.value]
                        : 'border-black/10 bg-white text-currena-dark hover:border-currena-blue/40 hover:bg-currena-blue/10 dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark dark:hover:border-currena-blue/40'
                    }`}
                  >
                    {chip.label}
                    <span className={`ms-1.5 tabular-nums font-bold ${active ? 'opacity-70' : 'text-currena-muted'}`}>
                      ({formatNumber(chip.count, numberLocale, { maximumFractionDigits: 0 })})
                    </span>
                  </button>
                );
              })}
            </div>
            {filtering ? (
              <button
                type="button"
                onClick={() => {
                  onStatusChange('all');
                  onQueryChange('');
                }}
                className="mt-2 inline-flex min-h-[36px] cursor-pointer items-center rounded-full px-2 text-[0.7rem] font-bold text-currena-blue-deep underline decoration-currena-blue/40 underline-offset-2 transition-colors hover:bg-currena-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:text-currena-blue"
              >
                {copy.ui.clearFilters}
              </button>
            ) : null}
          </div>

          {/* Downloads. */}
          <div>
            <p className="m-0 mb-1 text-[var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {copy.ui.toolsDownload}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={onDownloadIcs}
                className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-currena-blue/40 bg-currena-blue/15 px-3 text-[var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/25"
              >
                <span aria-hidden="true">📅</span>
                {copy.ui.icsDownload}
              </button>
              <button
                type="button"
                onClick={onDownloadCsv}
                className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-currena-blue/40 bg-currena-blue/15 px-3 text-[var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/25"
              >
                <span aria-hidden="true">⬇</span>
                {copy.ui.downloadCsv}
              </button>
            </div>
          </div>

          {/* The shortcuts help (kept — was the inline hint line). */}
          <div>
            <p className="m-0 mb-1 text-[var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {copy.ui.toolsShortcuts}
            </p>
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold text-currena-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 font-sans text-[0.65rem] font-bold text-currena-dark ring-1 ring-black/[0.08] dark:bg-[#243040] dark:text-currena-dark dark:ring-white/[0.12]">/</kbd>
                <span>{copy.ui.keyboardSearch}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 font-sans text-[0.65rem] font-bold text-currena-dark ring-1 ring-black/[0.08] dark:bg-[#243040] dark:text-currena-dark dark:ring-white/[0.12]">J</kbd>
                <span>{copy.ui.keyboardNext}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 font-sans text-[0.65rem] font-bold text-currena-dark ring-1 ring-black/[0.08] dark:bg-[#243040] dark:text-currena-dark dark:ring-white/[0.12]">K</kbd>
                <span>{copy.ui.keyboardPrev}</span>
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
