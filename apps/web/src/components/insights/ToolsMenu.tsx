/**
 * ToolsMenu — round-2 Block R15: ONE "Tools" disclosure in the page header.
 *
 * Contains: search, the tier filter, the keyboard-shortcuts help, the
 * calendar (.ics) download and the CSV download. The old inline filter bar
 * and the "Keyboard: / j k" hint line are gone from the default page flow.
 * The shortcuts keep working (and "/" opens the menu and focuses the search).
 *
 * v3 UI_SPEC §10 (2026-10-20, UI-51 + RULES M-3, PH6-C): the OWNER TOOLS
 * section at the bottom of the panel — when signed in via the owner
 * session cookie: the Owner badge + Sign out (which hides the owner
 * surface until the next sign-in); otherwise the "Owner sign-in" form:
 * a masked input for the Bearer token + submit. The token is sent to
 * POST /api/insights/owner/session, never stored, never logged, and the
 * input CLEARS after every submit. 403 → "Export is disabled — the owner
 * token secret is not set"; 401 → "Token not recognised". The message is
 * aria-live=polite so the outcome is announced. The export menu itself is
 * the header's business (InsightsHeader renders it once unlocked).
 *
 * Proper disclosure: aria-expanded on the button, closes on Escape and on
 * outside click, focus returns to the button. Filter counts describe ONLY
 * the current lane (the old 41/10/20/11 row described the whole snapshot —
 * R15's "counts did not match the lane on screen" fix).
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatNumber } from '@currena/core';
import { CalendarDays, Download, KeyRound, Search, Wrench } from 'lucide-react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { StatusFilter } from './config';
import { clampPanelToViewport } from '../../lib/clamp-panel';

/** v3 UI-51: POST /api/insights/owner/session's outcomes, mapped to the
 * owner tools' messages (ok → the unlock; wrong → 401; disabled → 403). */
export type OwnerSignInResult = 'ok' | 'wrong' | 'disabled' | 'failed';

/** Grayscale redesign (2026-10-17, economic-indicators-ui-spec.md §3.5),
 * kept through the v3 merge — the filter chips are CONTROLS, not status
 * displays: the selected state is the charcoal fill (the page's one
 * "selected" language, same as the JumpNav active pill), every tier
 * identical; severity ink stays on the cards themselves. */
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
/** v3 UI-53 (2026-10-20, kept through the merge): every control's touch
 * target is ≥44px — the 36px height of the grayscale round is superseded. */
const DOWNLOAD_BUTTON_CLASS =
  'insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-secondary)]/50 hover:text-[var(--color-text-primary)]';

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
  /** v3 UI-51: the owner-session cookie state (drives badge + sign-out). */
  ownerSignedIn: boolean;
  /** v3 UI-51: POST /owner/session with the pasted Bearer token. */
  onOwnerSignIn: (token: string) => Promise<OwnerSignInResult>;
  /** v3 UI-51: hides the owner surface until the next sign-in. */
  onOwnerSignOut: () => void;
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
  ownerSignedIn,
  onOwnerSignIn,
  onOwnerSignOut,
}: ToolsMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const filtering = status !== 'all' || query.trim() !== '';

  // v3 UI-51: the owner sign-in form's state. The TOKEN lives only in this
  // uncontrolled-ish input value — cleared after EVERY submit (success or
  // failure), never copied anywhere else, never logged.
  const [token, setToken] = useState('');
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInMessage, setSignInMessage] = useState<'' | 'wrong' | 'disabled' | 'failed' | 'signed-out'>('');
  const ownerTokenInputRef = useRef<HTMLInputElement | null>(null);
  const ownerSignOutRef = useRef<HTMLButtonElement | null>(null);

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
    // v3 UI_SPEC §4 (2026-10-20, PH6-A): the "Unusual" display word is
    // RETIRED from the page — the tier stays internal (sorting, movers,
    // the data exports keep their E-21 tier words), but no visible label
    // may say "Unusual" anymore while the cards it would select show the
    // "Normal" chip (GLOSSARY: one vocabulary; do not invent new status
    // words). The filter option left with the word; counts.unusual stays
    // in the pure statusCounts shape for its other consumers.
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
                    className={`inline-flex min-h-[44px] cursor-pointer items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)] ${
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
                className="mt-2 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-2 text-[0.7rem] font-bold text-[var(--color-text-primary)] underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:decoration-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
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

          {/* v3 UI-51 + RULES M-3: the owner tools. Signed in via the owner
           * session cookie → the Owner badge + Sign out (the export menu
           * button appears beside Tools in the header). Not signed in → the
           * brief's small "Owner sign-in" entry: a masked input for the
           * Bearer token. The token is cleared after EVERY submit and never
           * stored or logged. */}
          <div data-owner-tools>
            <p className="type-kicker m-0 mb-1 text-[var(--color-text-tertiary)]">
              {/* The entry itself is named "Owner sign-in" (the brief's
               * word); once signed in the same slot reads "Owner tools". */}
              {ownerSignedIn ? copy.ui.ownerToolsLabel : copy.ui.ownerSignIn}
            </p>
            {ownerSignedIn ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-currena-success/15 px-2.5 py-1 text-[length:var(--type-caption)] font-bold text-currena-success-deep">
                  <KeyRound aria-hidden size={13} strokeWidth={1.9} className="shrink-0" />
                  {copy.ui.ownerBadge}
                </span>
                <button
                  ref={ownerSignOutRef}
                  type="button"
                  onClick={() => {
                    onOwnerSignOut();
                    setSignInMessage('signed-out');
                    setToken('');
                    // UI-54 focus continuity: this button unmounts with the
                    // swap — land focus on the token input that takes its
                    // place (after the commit, one frame out).
                    requestAnimationFrame(() => ownerTokenInputRef.current?.focus());
                  }}
                  className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-[var(--color-border)] bg-transparent px-3 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-currena-blue/50 hover:text-[var(--color-status-context)]"
                >
                  {copy.ui.ownerSignOut}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (signInBusy) return;
                  // No secrets policy: the pasted token goes to the request
                  // and nowhere else — never logged, cleared right after.
                  const value = token;
                  setSignInBusy(true);
                  setSignInMessage('');
                  void onOwnerSignIn(value)
                    .then((result) => {
                      if (result === 'ok') {
                        setSignInMessage('');
                        // UI-54 focus continuity: the form is about to
                        // unmount (the badge + Sign out take its place) —
                        // carry focus to the Sign out button after the swap.
                        requestAnimationFrame(() => ownerSignOutRef.current?.focus());
                      } else {
                        setSignInMessage(result);
                      }
                    })
                    .finally(() => {
                      setToken('');
                      setSignInBusy(false);
                      // On failure the form stays mounted: re-focus the
                      // (now-cleared) input so the retry path is one keystroke
                      // away. On success this is a no-op (input unmounted).
                      ownerTokenInputRef.current?.focus();
                    });
                }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="insights-owner-token"
                  className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]"
                >
                  {copy.ui.ownerTokenLabel}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    id="insights-owner-token"
                    ref={ownerTokenInputRef}
                    type="password"
                    autoComplete="off"
                    inputMode="text"
                    disabled={signInBusy}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    aria-describedby="insights-owner-token-message"
                    className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3 text-sm text-currena-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark"
                  />
                  <button
                    type="submit"
                    disabled={signInBusy}
                    className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-currena-blue/40 bg-currena-blue/15 px-4 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/25 disabled:cursor-wait disabled:opacity-60"
                  >
                    <KeyRound aria-hidden size={15} strokeWidth={1.9} className="shrink-0" />
                    {copy.ui.ownerSignInSubmit}
                  </button>
                </div>
                <p
                  id="insights-owner-token-message"
                  aria-live="polite"
                  className={`m-0 min-h-[1em] text-[0.7rem] font-semibold ${
                    signInMessage === 'disabled' || signInMessage === 'failed'
                      ? 'text-[var(--color-status-alert)]'
                      : signInMessage === 'wrong'
                        ? 'text-[var(--color-status-watch)]'
                        : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {signInMessage === 'wrong'
                    ? copy.ui.ownerSignInWrong
                    : signInMessage === 'disabled'
                      ? copy.ui.ownerSignInDisabled
                      : signInMessage === 'failed'
                        ? copy.ui.ownerSignInFailed
                        : signInMessage === 'signed-out'
                          ? copy.ui.ownerSignedOutNote
                          : ''}
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
