/**
 * Together — UI spec Block T1 (I17), restructured by round-2 R7b + R27.
 *
 * The section sits above "Indicators" and starts COLLAPSED (R7b): the header
 * row carries the title, a one-line summary ("2 active, 3 show signals that
 * disagree, 1 partly active"), and a Show/Hide toggle (aria-expanded +
 * aria-controls, ≥24px target). Collapsed, one small chip per connection —
 * a chip click expands the section and scrolls to that card. Expanded, the
 * cards render in state order (active → partly → disagree → not active →
 * unreadable), three at a time behind "See all {n} connections".
 *
 * R27 (in ConnectionCard): no arrows, stat chips with units, no visible
 * "to verify" tag — the quiet section-level note replaces the placeholder,
 * which stays in the data attributes only.
 *
 * The choice is remembered in localStorage (try/catch, fail open to
 * collapsed). Pills, hash links and hero links expand via `expandToken`.
 */

import { useEffect, useMemo, useState } from 'react';
import { formatNumber } from '@currena/core';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { evaluateConnections, type ConnectionReading } from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ConnectionCard } from './ConnectionCard';
import { TOGETHER_CARD_ORDER, connectionSummaryInfo, togetherSummary } from './config';

const STORAGE_KEY = 'currena.insights.together-open.v1';

/** R30: the collapsed chips' state words speak in status ink (the roast:
 * "gray state words" carried none of the card's meaning). Icon + word
 * stays — colour is never alone: every chip is also a button with the
 * state word itself. */
const CHIP_STATE_TONE: Record<string, string> = {
  active: 'text-[var(--color-status-context)]',
  partly: 'text-[var(--color-status-context)]',
  disagree: 'text-[var(--color-text-tertiary)]',
  inactive: 'text-[var(--color-text-tertiary)]',
  pending: 'text-[var(--color-status-stale)]',
  unknown: 'text-[var(--color-text-tertiary)]',
};

/** Expanded shows 3 cards first (spec R7b). */
const EXPANDED_LIMIT = 3;

/** v3 UI_SPEC §8 (2026-10-20, PH6-B): the collapsed chip speaks the card's
 * own neutral summary, not a bare state word — "1 of 2 match" for cards
 * with counts, "Trigger not present", "Pass-through pending", "Not
 * enough fresh data", and the pass-through card's own family word. Same
 * selector as the card face (connectionSummaryInfo), so chip and face can
 * never disagree. */
function chipWordOf(reading: ConnectionReading, copy: InsightsCopy, fmt: (n: number) => string): string {
  const t = copy.together;
  const info = connectionSummaryInfo(reading);
  switch (info.kind) {
    case 'match':
      return interpolate(t.chipMatchCount, { match: fmt(info.matchCount ?? 0), moved: fmt(info.movedCount ?? 0) });
    case 'trigger-absent':
      return t.state.inactive;
    case 'pending':
      return t.state.pending;
    case 'not-enough':
      return t.state.unknown;
    default:
      // The pass-through card's active/inactive states carry no engine
      // summary: the loan either followed the decision (the usual pattern
      // held) or it did not (it differed).
      return reading.state === 'active' ? t.state.active : t.state.disagree;
  }
}

export function Together({
  readings,
  copy,
  numberLocale,
  onFocusCard,
  expandToken,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
  /** Bumped by the route when a pill/hash/hero link targets this section. */
  expandToken: number;
}) {
  const connections = useMemo(() => evaluateConnections(readings), [readings]);
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'open';
    } catch {
      return false; // fail open to collapsed (spec R7b)
    }
  });
  const [showAll, setShowAll] = useState(false);
  const [focusCard, setFocusCard] = useState<string | null>(null);

  useEffect(() => {
    // R10-5: expand-on-token — see AboutTheData.tsx for the same pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expand-on-token: external trigger → local open state
    if (expandToken > 0) setOpen(true);
  }, [expandToken]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed');
    } catch {
      /* privacy mode — session-only */
    }
  }, [open]);

  const summary = useMemo(
    () =>
      togetherSummary(connections, (connection) => {
        const key = connection as keyof typeof copy.together.connections;
        return copy.together.connections[key]?.name ?? connection;
      }, {
        active: copy.together.summaryActive,
        partly: copy.together.summaryPartly,
        pending: copy.together.summaryPending,
        inactive: copy.together.summaryInactive,
        disagree: copy.together.summaryDisagree,
        unknown: copy.together.summaryUnknown,
      }, (n) => formatNumber(n, numberLocale, { maximumFractionDigits: 0 }), numberLocale === 'fa-IR' ? '، ' : ', '),
    [connections, copy, numberLocale],
  );

  if (connections.length === 0) return null;

  const ordered = [...connections].sort(
    (a, b) => TOGETHER_CARD_ORDER.indexOf(a.state) - TOGETHER_CARD_ORDER.indexOf(b.state),
  );
  const shown = showAll ? ordered : ordered.slice(0, EXPANDED_LIMIT);
  const expandTo = (connection: string): void => {
    setFocusCard(connection);
    setOpen(true);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-connection="${connection}"]`);
      if (el) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  };

  return (
    <section id="insights-together" aria-labelledby="insights-together-title" className="scroll-mt-24">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-together-title" className="type-section m-0">
          {copy.together.title}
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="insights-together-body"
          onClick={() => setOpen(!open)}
          className="insights-focusable inline-flex min-h-[24px] min-w-[24px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
        >
          <span aria-hidden="true">
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
            />
          </span>
          {open ? copy.ui.showFewer : copy.ui.aboutShowDetails}
        </button>
      </header>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.together.subtitle}
      </p>

      {/* R27: the quiet section-level note — replaces the per-card
       * "Evidence: to verify" placeholder. */}
      <p className="m-0 mb-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-together-note>
        {copy.together.evidenceNote}
      </p>

      <div id="insights-together-body">
        {open ? (
          <>
            {/* Round 22 (owner): "such gaps must never happen" — the old
             * auto-fill grid reserved dead tracks whenever fewer cards than
             * tracks existed. .lane-fill grows the shown cards so every line
             * fills the lane edge to edge. */}
            <div className="lane-fill gap-2.5">
              {shown.map((reading) => (
                <ConnectionCard
                  key={reading.connection}
                  reading={reading}
                  readings={readings}
                  copy={copy}
                  numberLocale={numberLocale}
                  onFocusCard={onFocusCard}
                  autoFocus={focusCard === reading.connection}
                />
              ))}
            </div>
            {ordered.length > EXPANDED_LIMIT && !showAll ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="insights-focusable mt-2 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:decoration-[var(--color-status-context)]"
              >
                {interpolate(copy.together.seeAllConnections, { n: formatNumber(ordered.length, numberLocale, { maximumFractionDigits: 0 }) })}
              </button>
            ) : null}
          </>
        ) : (
          /* Collapsed: the one-line summary + one small chip per connection. */
          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]" data-together-summary>
              {summary.line}
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {ordered.map((conn) => (
                <li key={conn.connection}>
                  <button
                    type="button"
                    onClick={() => expandTo(conn.connection)}
                    className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition-colors hover:text-[var(--color-status-context)]"
                  >
                    {copy.together.connections[conn.connection as keyof typeof copy.together.connections]?.name ?? conn.connection}
                    <span
                      className={`font-bold ${CHIP_STATE_TONE[conn.state] ?? 'text-[var(--color-text-tertiary)]'}`}
                      data-chip-state={conn.state}
                    >
                      {chipWordOf(conn, copy, (n) => formatNumber(n, numberLocale, { maximumFractionDigits: 0 }))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
