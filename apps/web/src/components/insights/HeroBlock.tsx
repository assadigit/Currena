/**
 * HeroBlock — the page's first screen (Blocks H1–H5 + N2).
 *
 * Top to bottom: the two verdict meters (Australia first in reading order
 * with a one-setting swap, Block H1 note), the big-mover callout (H3,
 * replacing the old "biggest 30-day changes" list), the what-changed
 * one-liner (H5, replacing the block), and the single disclaimer line
 * (N2) linking to the full text in About. A quiet week renders the calm
 * line + the next scheduled event (H5).
 */

import { useMemo, useState } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatJalaliDate, formatDate, formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { formatChange, consequenceLine, definitionFor, bigMovers, PRICE_ROWS } from './config';
import { VerdictBlock } from './VerdictMeter';
import { readStoredHeroOrder, HERO_ORDER_STORAGE_KEY } from './config';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

export function HeroBlock({
  readings,
  changedThisWeek,
  calendar,
  copy,
  locale,
  numberLocale,
  onJumpSection,
  onJumpAbout,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  changedThisWeek: readonly { id: IndicatorId; to: string }[];
  calendar: readonly { id: string; date: string; titleEn: string; titleFa: string }[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
}) {
  // H1 note: Australia first (the owner's Australia-based readers) with the
  // one-setting swap; remembered in localStorage, fail-open.
  const [order, setOrder] = useState<'australia' | 'global'>(() => readStoredHeroOrder());
  const toggleOrder = (): void => {
    setOrder((prev) => {
      const next = prev === 'australia' ? 'global' : 'australia';
      try {
        window.localStorage.setItem(HERO_ORDER_STORAGE_KEY, next);
      } catch {
        /* privacy mode — session-only setting */
      }
      return next;
    });
  };
  const blocks: readonly InsightsSection[] = order === 'australia' ? ['australia', 'global'] : ['global', 'australia'];

  // H3: ONE callout for the largest single move (|z| ≥ 2), stale items
  // excluded by the engine (stale readings never carry a move score).
  const mover = useMemo(() => bigMovers(readings, 1)[0] ?? null, [readings]);

  // H5: one line — the week's status changes, or the calm quiet-week line
  // naming the next scheduled event.
  const changedLine = useMemo(() => {
    if (changedThisWeek.length === 0) {
      const next = [...calendar]
        .filter((e) => Number.isFinite(Date.parse(e.date)) && e.date >= new Date().toISOString().slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      if (next) {
        const dateText = locale === 'fa' ? formatJalaliDate(next.date, 'fa-IR') : formatDate(next.date, 'en-US');
        return interpolate(copy.ui.quietWeekNext, {
          event: locale === 'fa' ? next.titleFa : next.titleEn,
          date: dateText,
        });
      }
      return copy.ui.quietWeekLine;
    }
    const names = changedThisWeek
      .slice(0, 3)
      .map((e) => `${copy.indicators[e.id].name}${e.to === 'warning' ? ' ↑' : ' ↓'}`)
      .join(' · ');
    const suffix = changedThisWeek.length > 3 ? ` +${num(changedThisWeek.length - 3, numberLocale)}` : '';
    return interpolate(copy.ui.whatChangedLine, { changes: `${names}${suffix}` });
  }, [changedThisWeek, calendar, copy, locale, numberLocale]);

  const moverEntry = mover ? copy.indicators[mover.id] : null;
  const moverReading = mover ? readings.find((r) => r.id === mover.id) : null;

  return (
    <section aria-label={copy.ui.heroTitle} className="m-0">
      <h2 className="sr-only">{copy.ui.heroTitle}</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-start">
        {blocks.map((section) => (
          <VerdictBlock
            key={section}
            section={section}
            sectionLabel={copy.sections[section]}
            readings={readings}
            copy={copy}
            numberLocale={numberLocale}
            onJumpSection={onJumpSection}
            onJumpAbout={onJumpAbout}
            onFocusCard={onFocusCard}
          />
        ))}
      </div>

      {/* H1 note: the swap setting — a small, quiet control. */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={toggleOrder}
          className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center gap-1 rounded-full border border-[var(--color-border)] bg-transparent px-3 py-1 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-brand)]/50 hover:text-[var(--color-status-context)]"
        >
          <span aria-hidden="true">⇄</span>
          {interpolate(copy.ui.orderSwap, {
            other: copy.sections[order === 'australia' ? 'global' : 'australia'],
          })}
        </button>
      </div>

      {/* H3: the big-mover callout — only when a move clears the threshold. */}
      {mover && moverReading && moverEntry ? (
        <aside
          className="mt-3 rounded-[var(--radius-lg)] bg-currena-coral/10 p-4 ring-1 ring-currena-coral/30"
          aria-label={copy.ui.bigMoverTitle}
        >
          <p className="m-0 text-[var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {copy.ui.bigMoverTitle}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => onFocusCard(mover.id)}
              className="insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-[var(--type-label)] font-bold text-[var(--color-text-primary)] underline decoration-currena-coral/50 underline-offset-4 transition-colors hover:decoration-currena-coral"
            >
              {moverEntry.name}
            </button>
            <bdi dir="ltr" className="type-number shrink-0 text-[var(--color-text-primary)]">
              {formatChange(mover.change30d, mover.changeKind, numberLocale, copy.units)}
              <span className="ms-1.5 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                {copy.ui.days30}
              </span>
            </bdi>
          </div>
          {moverEntry.lines || moverEntry.oneLiner ? (
            <p className="mt-1 mb-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
              {consequenceLine(moverReading, moverEntry, PRICE_ROWS.includes(mover.id))}
            </p>
          ) : null}
        </aside>
      ) : null}

      {/* H5: what changed — one line under the hero (or the calm line). */}
      <p className="mt-3 mb-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{changedLine}</bdi>
      </p>

      {/* N2: ONE short disclaimer line — links to the full text below. */}
      <div role="note" className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[var(--type-caption)] text-[var(--color-text-secondary)]">{copy.ui.disclaimerBar}</span>
        <button
          type="button"
          onClick={onJumpAbout}
          className="insights-focusable -my-1.5 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-1.5 text-[var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
        >
          {copy.ui.aboutTitle} ↧
        </button>
      </div>
    </section>
  );
}
