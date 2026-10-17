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

import { useEffect, useLayoutEffect, useRef } from 'react';
import { formatNumber } from '@currena/core';
import { CalendarDays, Download, Search, Wrench } from 'lucide-react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { StatusFilter } from './config';
import { clampPanelToViewport } from '../../lib/clamp-panel';

/** Grayscale redesign (2026-10-17, economic-indicators-ui-spec.md §3.5):
 * the filter chips are CONTROLS, not status displays — the selected state
 * is the charcoal fill (the page's one "selected" language, same as the
 * JumpNav active pill), every tier identical; severity ink stays on the
 * cards themselves. One shared string — every tier speaks it. */
const CHIP_SELECTED =
  'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-surface)]';
const CHIP_ACTIVE: Readonly<Record<StatusFilter, string>> = {
  all: CHIP_SELECTED,
  warning: CHIP_SELECTED,
  unusual: CHIP_SELECTED,
  normal: CHIP_SELECTED,
  context: CHIP_SELECTED,
};

/** The one download-button surface (grayscale): shared by every export
 * control in the menu. */
const DOWNLOAD_BUTTON_CLASS =
  'insights-focusable inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-secondary)]/50 hover:text-[var(--color-text-primary)]';

interface ToolsMenuProps {
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
  /** World markets table export (spec §6.4) — rendered only when provided. */
  onDownloadMarketsCsv?: () => void;
  /** World currencies pairs export (spec §9.3 item 6) — rendered only when provided. */
  onDownloadFxCsv?: () => void;
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
  onDownloadMarketsCsv,
  onDownloadFxCsv,
}: ToolsMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const filtering = status !== 'all' || query.trim() !== '';

  // 2026-10-16 fix: the `end-0` anchor flips side with the writing
  // direction and slid this panel 75 px off-screen at 375 px EN (and did
  // the mirrored thing in fa) — clamp the open panel inside the viewport
  // (the same treatment the export panel got the same day).
  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current?.querySelector<HTMLElement>('#insights-tools-panel');
    if (panel) clampPanelToViewport(panel);
  }, [open]);

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
        className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-secondary)]/50 hover:text-[var(--color-text-primary)]"
      >
        <Wrench aria-hidden size={17} strokeWidth={1.9} className="shrink-0" />
        {copy.ui.toolsLabel}
        {filtering ? (
          <span
            aria-hidden="true"
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-1 text-[0.62rem] font-bold text-[var(--color-surface)]"
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
            <p className="type-kicker m-0 mb-1 text-[var(--color-text-tertiary)]">
              {copy.ui.toolsSearch}
            </p>
            <div className="relative">
              <span aria-hidden="true" className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                <Search size={18} strokeWidth={1.9} />
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
                className="h-10 w-full rounded-full border border-black/10 bg-white ps-9 pe-3 text-sm text-currena-dark placeholder:text-currena-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)] dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark"
              />
            </div>
          </div>

          {/* The tier filter — counts describe the current lane only. */}
          <div>
            <p className="type-kicker m-0 mb-1 text-[var(--color-text-tertiary)]">
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
                    className={`inline-flex min-h-[36px] cursor-pointer items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)] ${
                      active
                        ? CHIP_ACTIVE[chip.value]
                        : 'border-black/10 bg-white text-currena-dark hover:border-[var(--color-text-secondary)]/40 hover:bg-currena-muted/10 dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark dark:hover:border-[var(--color-text-secondary)]/40'
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
                className="mt-2 inline-flex min-h-[36px] cursor-pointer items-center rounded-full px-2 text-[0.7rem] font-bold text-[var(--color-text-primary)] underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:decoration-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
              >
                {copy.ui.clearFilters}
              </button>
            ) : null}
          </div>

          {/* Downloads. */}
          <div>
            <p className="type-kicker m-0 mb-1 text-[var(--color-text-tertiary)]">
              {copy.ui.toolsDownload}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={onDownloadIcs}
                className={DOWNLOAD_BUTTON_CLASS}
              >
                <CalendarDays aria-hidden size={16} strokeWidth={1.9} className="shrink-0" />
                {copy.ui.icsDownload}
              </button>
              <button
                type="button"
                onClick={onDownloadCsv}
                className={DOWNLOAD_BUTTON_CLASS}
              >
                <Download aria-hidden size={16} strokeWidth={1.9} className="shrink-0" />
                {copy.ui.downloadCsv}
              </button>
              {onDownloadMarketsCsv ? (
                <button
                  type="button"
                  onClick={onDownloadMarketsCsv}
                  className={DOWNLOAD_BUTTON_CLASS}
                >
                  <Download aria-hidden size={16} strokeWidth={1.9} className="shrink-0" />
                  {copy.markets.csvDownload}
                </button>
              ) : null}
              {onDownloadFxCsv ? (
                <button
                  type="button"
                  onClick={onDownloadFxCsv}
                  className={DOWNLOAD_BUTTON_CLASS}
                >
                  <Download aria-hidden size={16} strokeWidth={1.9} className="shrink-0" />
                  {copy.fx.csvDownload}
                </button>
              ) : null}
            </div>
          </div>

          {/* The shortcuts help (kept — was the inline hint line). */}
          <div>
            <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
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
