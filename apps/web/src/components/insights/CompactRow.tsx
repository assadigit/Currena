/**
 * CompactRow — Block F2: the anatomy of an indicator row in the "normal"
 * and "context" states. "Show one row with: status icon, plain name, value
 * with unit, 30-day change, tiny sparkline, position word, and a 'details'
 * button. Show the consequence line in one line under the name. Hide the
 * source and the date until the details panel opens." A reader can scan
 * ten rows in the time it takes to read three cards.
 */

import { useEffect, useRef, useState } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { Sparkline } from '../Sparkline';
import { StatusChip } from './StatusChip';
import { bandWordsOf, consequenceLine, consequenceState, definitionFor, formatChange, formatIndicatorValue, tierOf } from './config';

/** F2's tiny sparkline — same lazy pattern as the alert card's. */
function TinySparkline({ id }: { id: IndicatorId }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [points, setPoints] = useState<number[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el || points !== null) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void fetchIndicatorHistory(id)
          .then((history) => {
            if (cancelled || !history) return;
            const values = history.points.map((p) => p[1]!);
            setPoints(values.length >= 2 ? values : null);
          })
          .catch(() => {
            /* honest absence */
          });
      },
      { rootMargin: '120px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [id, points]);
  return (
    <span ref={ref} className="hidden h-5 w-16 shrink-0 sm:block" aria-hidden="true">
      {points ? <Sparkline points={points} width={64} height={20} ariaLabel="" tone="neutral" className="text-currena-muted" /> : null}
    </span>
  );
}

export function CompactRow({
  reading,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  showMixedTag,
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: boolean;
  /** The gold-silver ratio carries the gauge's "mixed evidence" tag. */
  showMixedTag?: boolean;
}) {
  const def = definitionFor(reading.id);
  const entry = copy.indicators[reading.id];
  const isUnavailable = reading.status === 'unavailable';
  const tier = tierOf(reading);
  const valueText =
    reading.value !== null ? formatIndicatorValue(reading.id, reading.value, numberLocale, copy.units) : null;
  // R6 → round 24: the needs-attention MEANING line also rides compact
  // rows when a needs-attention row renders without a card (never hidden
  // by R7) — the meaning, not the "Rule: …" jargon (see AlertCard).
  const meaningLine = tier === 'needs-attention' ? copy.meaning[reading.id] : undefined;
  // R30: the sentence-versus-number guard (see AlertCard) — a
  // needs-attention row never says "usual range" beside its rule line.
  const cs = consequenceState(reading, false);
  const showConsequence = !(tier === 'needs-attention' && cs === 'typical');

  return (
    <article
      id={`insights-card-${reading.id}`}
      data-status={reading.status}
      className="scroll-mt-24 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-2.5 ring-1 ring-[var(--color-border)]"
    >
      <button
        type="button"
        onClick={(e) => onOpenDetails(reading.id, e.currentTarget)}
        className="insights-focusable flex w-full cursor-pointer items-center gap-x-3 border-0 bg-transparent p-0 text-start"
        aria-haspopup="dialog"
        aria-label={`${copy.ui.detailsButton}: ${entry.name}`}
      >
        <span className="flex w-full min-w-0 flex-col gap-0.5">
          <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0">
            <span className="shrink-0">
              <StatusChip status={reading.status} copy={copy} tier={tier} />
            </span>
            <span className="min-w-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]">
              {entry.name}
              {pinned ? <span className="sr-only"> · {copy.ui.pinnedBadge}</span> : null}
            </span>
            {valueText !== null ? (
              <bdi dir="ltr" className="type-number shrink-0 text-[var(--color-text-primary)]">
                {valueText}
              </bdi>
            ) : isUnavailable ? (
              <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{copy.ui.unavailableCard}</span>
            ) : null}
            {reading.change30d !== undefined ? (
              <bdi dir="ltr" className="shrink-0 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                {formatChange(reading.change30d, def.changeKind, numberLocale, copy.units)}
                <span className="ms-1 opacity-80">{copy.ui.days30}</span>
              </bdi>
            ) : null}
            <TinySparkline id={reading.id} />
            {showMixedTag ? (
              <span className="shrink-0 rounded-full bg-currena-muted/15 px-2 py-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                {copy.ui.mixedEvidenceTag}
              </span>
            ) : null}
            <span className="ms-auto shrink-0 whitespace-nowrap text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)]">
              {copy.ui.detailsButton} ›
            </span>
          </span>
          {/* R6 → round 24: the meaning line on needs-attention rows. */}
          {meaningLine !== undefined ? (
            <span className="block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-rule-line>
              <bdi>{meaningLine}</bdi>
            </span>
          ) : null}
          {!isUnavailable && showConsequence ? (
            <span className="block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
              {consequenceLine(reading, entry, false, bandWordsOf(copy))}
            </span>
          ) : null}
        </span>
      </button>
    </article>
  );
}
