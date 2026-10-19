/**
 * DetailsPanel — Block F5: "Replace the in-grid accordion with a side panel
 * on wide screens and a bottom sheet on phones." Section order (life
 * effects first): what it means for you → why it matters → what usually
 * follows → what it cannot tell you → the technical definition. A large
 * chart with readable axis labels (caption size), the chart-data table
 * toggle (SR path), the linked source + as-of date at the bottom.
 *
 * Focus discipline (F5 note): focus TRAPS inside the panel; Escape closes;
 * focus RETURNS to the control that opened it. Deep links
 * ('#/insights?card=<id>') open the panel (Block F5: "Give each indicator
 * its own address"). Body scroll locks while open.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ApiError, fetchIndicatorHistory } from '../../lib/insights';
import { Star, X } from 'lucide-react';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import { HistoryChart, formatAsOf } from './HistoryChart';
import { PRICE_ROWS, definitionFor, formatRuleText, formatUtcHm } from './config';
import { PriceDetailsSections } from './PriceDetails';
import { staleAfterDaysFor, RULE_CHANGELOG, RULE_VERSION } from '@currena/insights';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
        {title}
      </h4>
      <p className="mt-1 mb-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
        {body}
      </p>
    </div>
  );
}

/**
 * Step-2 add-list §A (the card spec): every card's facts, shown on the
 * panel — how often the source updates, how old the data may get before the
 * card wears its "stale" tag, when this reading was fetched, and whether
 * the indicator is scored (votes toward its area verdict) or context only.
 */
function CardFacts({
  reading,
  copy,
  numberLocale,
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const def = definitionFor(reading.id);
  const cadence = copy.ui.cadence[def.cadence];
  const staleAfter = staleAfterDaysFor(def);
  const staleText =
    staleAfter === null
      ? copy.ui.staleNever
      : interpolate(copy.ui.staleAfterLine, {
          n: formatNumber(staleAfter, numberLocale, { maximumFractionDigits: 0 }),
        });
  return (
    <p className="m-0 mb-4 flex flex-wrap gap-x-2 gap-y-1 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
      <span>
        <span className="font-semibold">{copy.ui.updatesLabel}:</span> {cadence}
      </span>
      <span aria-hidden="true" className="opacity-50">·</span>
      <span>{staleText}</span>
      <span aria-hidden="true" className="opacity-50">·</span>
      <span>
        {/* v3 UI-22 (2026-10-20): the fetched line now speaks the UTC TIME
         * too — the same clock every card face's meta row speaks
         * ("Fetched: {date} · {time} UTC", RULES §6). */}
        <bdi>
          {interpolate(copy.ui.fetchedAtUtc, {
            date: formatAsOf(reading.updatedAt.slice(0, 10), numberLocale === 'fa-IR' ? 'fa' : 'en'),
            time: formatUtcHm(reading.updatedAt, numberLocale),
          })}
        </bdi>
      </span>
      <span aria-hidden="true" className="opacity-50">·</span>
      <span className={def.rule.kind === 'info' ? '' : 'font-semibold'}>
        {def.rule.kind === 'info' ? copy.ui.contextOnlyFact : copy.ui.scoredFact}
      </span>
      {/* Fix spec A-07 (2026-10-14): the scoring-rule version, visible in
       * "How is this calculated?" — every threshold change is dated. */}
      <span aria-hidden="true" className="opacity-50">·</span>
      <span>
        {interpolate(copy.ui.ruleVersionLine, {
          v: formatNumber(RULE_VERSION, numberLocale, { maximumFractionDigits: 0 }),
          date: formatAsOf(RULE_CHANGELOG[RULE_CHANGELOG.length - 1]!.date, numberLocale === 'fa-IR' ? 'fa' : 'en'),
        })}
      </span>
    </p>
  );
}

/** The panel's chart block — fetches on panel mount (module-cached fetch). */
function PanelHistory({
  id,
  copy,
  locale,
  numberLocale,
}: {
  id: IndicatorId;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'ready'; points: [number, number][] } | { kind: 'error' } | { kind: 'none' }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchIndicatorHistory(id)
      .then((history) => {
        if (cancelled) return;
        setState(history && history.points.length > 0 ? { kind: 'ready', points: history.points } : { kind: 'none' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === 'history_not_found') {
          setState({ kind: 'none' });
          return;
        }
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === 'loading') {
    return <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.ui.historyLoading}</p>;
  }
  if (state.kind === 'error') {
    return <p className="m-0 text-[length:var(--type-label)] text-[var(--color-status-alert)]">{copy.ui.historyError}</p>;
  }
  if (state.kind === 'none') {
    return <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.ui.noHistory}</p>;
  }
  return <HistoryChart id={id} points={state.points} copy={copy} locale={locale} numberLocale={numberLocale} />;
}

export function DetailsPanel({
  reading,
  readings,
  copy,
  locale,
  numberLocale,
  onClose,
  onPinChange,
  pinned,
  returnFocusTo,
}: {
  reading: IndicatorReading;
  /** The full snapshot's readings — the price sections' companion lines
   * read other assets (gold's A$ line, Bitcoin's metal ratios). */
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onClose: () => void;
  onPinChange: (id: IndicatorId, next: boolean) => void;
  pinned: boolean;
  /** The element that opened the panel — focus returns here on close. */
  returnFocusTo: HTMLElement | null;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const entry = copy.indicators[reading.id];
  const indicatorDef = definitionFor(reading.id);

  // 2026-10-26c: the four asset cards' «جزئیات بیشتر» sections render
  // INSIDE this side panel (owner directive) — the same sections that
  // used to expand inline in the tile, unchanged in content.
  const isPriceRow = PRICE_ROWS.includes(reading.id);
  const byId = useMemo(
    () => new Map(readings.map((r) => [r.id as string, r])),
    [readings],
  );

  // Focus trap + Escape (F5).
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const list = [...focusables].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const panel = panelRef.current;
    // Opening: focus the heading (announced by role=dialog).
    const focusTarget = panel?.querySelector<HTMLElement>('[data-panel-heading]');
    focusTarget?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // scroll lock while open
    return () => {
      document.body.style.overflow = previousOverflow;
      // F5: focus returns to the control that opened the panel.
      if (returnFocusTo && document.contains(returnFocusTo)) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
  }, [returnFocusTo]);

  return (
    <>
      <div className="insights-panel-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={onKeyDown}
        className="insights-panel"
      >
        {/* Header: the plain name + technical tag + close. */}
        <header className="flex items-start justify-between gap-3 border-block-end border-[var(--color-border)] p-4">
          <div className="min-w-0">
            <h3
              id={headingId}
              data-panel-heading=""
              tabIndex={-1}
              className="type-section m-0 flex items-center gap-2 leading-snug text-[var(--color-text-primary)] outline-none"
            >
              {/* Round 29 (owner): the panel's subject mark grows to 32/44px
               * — it identifies the card at a glance and deserves real size. */}
              {indicatorIconUrl(reading.id) !== null ? <IconImg src={indicatorIconUrl(reading.id)!} size={32} desktopSize={44} /> : null}
              <span>
                {/* 2026-10-26c: the four asset cards' panels carry the SAME
                 * verified title the card face uses (2026-10-25b) — the
                 * registry's legacy "(ounce)" suffix would contradict the
                 * card's measurement-basis subtitle one screen apart. */}
                {isPriceRow ? (copy.ui.priceCardTitles[reading.id] ?? entry.name) : entry.name}
              {entry.ticker ? (
                <span lang="en" dir="ltr" className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                  {entry.ticker}
                </span>
              ) : null}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="insights-focusable inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--color-border)] px-3 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-status-alert)]/50 hover:text-[var(--color-status-alert)]"
          >
            <X aria-hidden size={17} strokeWidth={2} />
            <span className="sr-only">{copy.ui.panelClose}</span>
          </button>
        </header>

        {/* Scrollable body. */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* The rule, in plain language (01 spec: every threshold shown). */}
          <p className="m-0 mb-4 rounded-[var(--radius-md)] bg-currena-soft/70 px-3 py-2.5 text-[length:var(--type-label)] font-medium text-[var(--color-text-primary)] dark:bg-white/[0.05]">
            <span className="font-bold">{copy.ui.ruleTitle}: </span>
            <span>{formatRuleText(indicatorDef.rule, reading.id, copy.rule, copy.units, numberLocale)}</span>
          </p>

          {/* Step-2 §A: the card-spec facts (updates · stale age · fetched ·
           * scored/context). */}
          <CardFacts reading={reading} copy={copy} numberLocale={numberLocale} />

          {/* 2026-10-26c: the asset cards' five detail sections (A–E) —
           * تغییرات قیمت … منبع داده و زمان به‌روزرسانی — ride the panel
           * for the four price rows, directly under the facts. */}
          {isPriceRow ? (
            <div className="mb-4">
              <PriceDetailsSections
                id={reading.id}
                reading={reading}
                copy={copy}
                locale={locale}
                numberLocale={numberLocale}
                byId={byId}
              />
            </div>
          ) : null}

          {/* Step-2 §B5: the VIX card's interim-presentation note (the
           * calm/nervous words are a Step-3 deliverable computed from the
           * stored history — stated, never faked). */}
          {reading.id === 'vix' ? (
            <p className="m-0 mb-4 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
              {copy.ui.vixNote}
            </p>
          ) : null}

          {reading.status === 'stale' && reading.asOf ? (
            <p className="m-0 mb-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-alert)]">
              <bdi>{interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}</bdi>
            </p>
          ) : null}
          {reading.status === 'no-history' ? (
            <p className="m-0 mb-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
              {copy.ui.noHistoryStatus}
            </p>
          ) : null}
          {/* Fix spec A-03/A-04: why the reading sits in check-pending — the
           * validation test that flagged it, in plain words. */}
          {reading.status === 'check-pending' && reading.flag ? (
            <p className="m-0 mb-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
              <bdi>{interpolate(copy.ui.checkPendingLine, { reason: reading.flag.reason })}</bdi>
            </p>
          ) : null}
          {/* Fix spec A-06: a dated, expiring human-written context note (off
           * by default — only shows when one exists and has not expired). */}
          {reading.note ? (
            <p className="m-0 mb-4 rounded-[var(--radius-sm)] bg-currena-soft/70 px-3 py-2 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
              <bdi>{reading.note.text}</bdi>
              <span className="mt-1 block opacity-80">
                {formatAsOf(reading.note.authored, locale)} — {formatAsOf(reading.note.expires, locale)}
              </span>
            </p>
          ) : null}
          {indicatorDef.rule.kind === 'info' ? (
            <p className="m-0 mb-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)]">
              {copy.ui.infoOnly}
            </p>
          ) : null}

          {/* F5 order — life effects FIRST. */}
          <div className="flex flex-col gap-4">
            <Section title={copy.ui.forYou} body={entry.forYou} />
            <Section title={copy.ui.whyItMatters} body={entry.whyItMatters} />
            <Section title={copy.ui.tendedToMean} body={entry.tendedToMean} />
            <Section title={copy.ui.cantTell} body={entry.cantTell} />
            <Section title={copy.ui.whatItIs} body={entry.whatItIs} />
          </div>

          {/* The large chart (labels ≥ caption size — the HistoryChart
           * renders its ticks at caption size). v3 UI-17 (2026-10-20): the
           * chart renders for UNAVAILABLE readings too — the last good
           * value lives HERE (the face hides it); a source with no stored
           * history degrades honestly to the "no stored history" line. */}
          <div className="mt-4">
            <PanelHistory id={reading.id} copy={copy} locale={locale} numberLocale={numberLocale} />
          </div>
        </div>

        {/* Footer: source + as-of + the watchlist pin (F5: at the bottom). */}
        <footer className="flex flex-wrap items-center gap-2 border-block-start border-[var(--color-border)] p-4">
          {reading.sourceUrl ? (
            <a
              href={reading.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="insights-focusable inline-flex items-center gap-1 rounded-full bg-currena-blue/10 px-3 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/20"
            >
              {reading.sourceName}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">{copy.ui.viewSource}</span>
            </a>
          ) : (
            <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{reading.sourceName}</span>
          )}
          {reading.asOf ? (
            <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
              {interpolate(copy.ui.updatedOn, { date: formatAsOf(reading.asOf, locale) })}
            </bdi>
          ) : null}
          <button
            type="button"
            onClick={() => onPinChange(reading.id, !pinned)}
            aria-pressed={pinned}
            className={`insights-focusable ms-auto inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-[length:var(--type-caption)] font-semibold transition-colors ${
              pinned
                ? 'border-currena-blue/40 bg-currena-blue/15 text-[var(--color-status-context)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-status-context)] hover:bg-currena-blue/10'
            }`}
          >
            <Star
              aria-hidden
              size={16}
              strokeWidth={1.9}
              className={`shrink-0 ${pinned ? 'fill-current' : ''}`}
            />
            {pinned ? copy.ui.unpinAction : copy.ui.pinAction}
          </button>
        </footer>
      </div>
    </>
  );
}
