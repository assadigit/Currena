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
import {
  ALWAYS_POSITION_IDS,
  bandWordsOf,
  changeScaleOf,
  changeWindowLabel,
  consequenceLine,
  consequenceState,
  dataPeriodText,
  definitionFor,
  formatChange,
  formatReadingValue,
  policyLastChangeOf,
  tierOf, attentionLineOf, formatPeakDistance, formatIndicatorValue } from './config';
import { PositionBar } from './PositionBar';
import { formatAsOf } from './HistoryChart';

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
  companionReadings = [],
  companionNote,
  nextRbaDecision,
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: boolean;
  /** The gold-silver ratio carries the gauge's "mixed evidence" tag. */
  showMixedTag?: boolean;
  /** Step-2 §B2: companion context rendered inside this row (the US 10-year
   * beside the AU 10-year when it renders as a row). */
  companionReadings?: readonly IndicatorReading[];
  companionNote?: string;
  /** Step-2 §B1: the next RBA decision date (cash-rate row). */
  nextRbaDecision?: string;
}) {
  const def = definitionFor(reading.id);
  const entry = copy.indicators[reading.id];
  const isUnavailable = reading.status === 'unavailable';
  const tier = tierOf(reading);
  const valueText = formatReadingValue(reading, numberLocale, copy.units);
  // Step-1 B5: every row carries its data date ("August 2026" / "9 Oct
  // 2026") — never hidden to the details panel, including Normal cards.
  const dataDate =
    reading.asOf !== null
      ? dataPeriodText(reading.id, reading.asOf, numberLocale === 'fa-IR' ? 'fa' : 'en', numberLocale, reading.periodEnd)
      : null;
  const changeLabel = changeWindowLabel(reading.id) === 'since-previous' ? copy.ui.sincePreviousRelease : copy.ui.days30;
  // Fix spec A-02 (2026-10-14): the needs-attention line is GENERATED from
  // the reading's own rule and value (see AlertCard) — the hand-written
  // meanings are gone.
  const meaningLine = attentionLineOf(reading, copy, numberLocale);
  // R30: the sentence-versus-number guard (see AlertCard) — a
  // needs-attention row never says "usual range" beside its rule line.
  const cs = consequenceState(reading, false);
  const showConsequence = !(tier === 'needs-attention' && cs === 'typical');
  // Step-2 §B1: the exact last decision (date + size) on the policy rows,
  // and the next RBA decision date on the cash-rate row.
  const locale = numberLocale === 'fa-IR' ? 'fa' : 'en';
  const lastChange = policyLastChangeOf(reading);
  const lastChangeText =
    lastChange !== null
      ? interpolate(copy.ui.lastChangeLine, {
          change: formatChange(lastChange.points, def.changeKind, numberLocale, copy.units, changeScaleOf(reading.id)),
          date: formatAsOf(lastChange.date, locale),
        })
      : null;
  const nextDecisionText =
    reading.id === 'rba-cash-rate' && nextRbaDecision !== undefined
      ? interpolate(copy.ui.nextDecisionLine, { date: formatAsOf(nextRbaDecision, locale) })
      : null;
  // Fix spec B-06 (2026-10-14): decided · effective on the policy rows.
  const decidedEffectiveText =
    reading.decidedDate !== undefined && reading.lastChange !== undefined
      ? interpolate(copy.ui.decidedEffectiveLine, {
          decided: formatAsOf(reading.decidedDate, locale),
          effective: formatAsOf(reading.lastChange.date, locale),
        })
      : null;

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
                {formatChange(reading.change30d, def.changeKind, numberLocale, copy.units, changeScaleOf(reading.id))}
                <span className="ms-1 opacity-80">{changeLabel}</span>
              </bdi>
            ) : null}
            {/* Step-1 B5: the data date rides every row (never the fetch
                date); Step-1 H1: a visible stale tag when the reading is
                past its release schedule. */}
            {dataDate !== null ? (
              <span className="shrink-0 whitespace-nowrap text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                {reading.status === 'stale' ? (
                  <span className="me-1 rounded-full bg-currena-muted/20 px-1.5 py-0.5 font-bold text-[var(--color-text-secondary)]">
                    {copy.ui.staleTag}
                  </span>
                ) : null}
                {reading.status === 'check-pending' ? (
                  <span className="me-1 rounded-full bg-currena-muted/20 px-1.5 py-0.5 font-bold text-[var(--color-text-secondary)]">
                    {copy.ui.checkPendingTag}
                  </span>
                ) : null}
                {interpolate(reading.status === 'stale' || reading.status === 'check-pending' ? copy.ui.dataForStale : copy.ui.dataFor, { date: dataDate })}
                {reading.nextReleaseToday === true ? <span className="ms-1 opacity-80">{copy.ui.nextReleaseToday}</span> : null}
              </span>
            ) : null}
            {/* Step-1 C9: distance from the 10-year peak (prices/gold-silver
                rows) — the same honesty the stock tiles carry. */}
            {(reading.id === 'gold-usd' || reading.id === 'silver-usd' || reading.id === 'brent' || reading.id === 'btc-usd') && reading.fromPeak10y !== undefined && reading.fromPeak10y < -0.05 ? (
              <span className="shrink-0 whitespace-nowrap text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                {formatPeakDistance(
                  reading,
                  numberLocale,
                  copy.ui,
                  (iso: string) => formatAsOf(iso, locale),
                  (value: number) => formatIndicatorValue(reading.id, value, numberLocale, copy.units),
                )}
              </span>
            ) : null}
            {reading.highestSinceYear !== undefined ? (
              <span className="shrink-0 whitespace-nowrap text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                {interpolate(copy.ui.highestSince, { year: String(reading.highestSinceYear) })}
              </span>
            ) : null}
            <TinySparkline id={reading.id} />
            {showMixedTag ? (
              <span className="shrink-0 rounded-full bg-currena-muted/15 px-2 py-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                {copy.ui.mixedEvidenceTag}
              </span>
            ) : null}
            <span className="ms-auto shrink-0 whitespace-nowrap text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)]">
              {copy.ui.detailsButton} ›
            </span>
          </span>
          {/* R6 → round 24: the meaning line on needs-attention rows. */}
          {meaningLine !== undefined ? (
            <span className="block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-rule-line>
              <bdi>{meaningLine}</bdi>
            </span>
          ) : null}
          {/* Step-2 §B1: the policy rows' exact last decision + the RBA's
           * next decision date — one line, date and size, no 30-day window. */}
          {lastChangeText !== null || nextDecisionText !== null || decidedEffectiveText !== null ? (
            <span className="block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
              {lastChangeText !== null ? <bdi>{lastChangeText}</bdi> : null}
              {lastChangeText !== null && decidedEffectiveText !== null ? <span aria-hidden="true"> · </span> : null}
              {decidedEffectiveText !== null ? <bdi>{decidedEffectiveText}</bdi> : null}
              {(lastChangeText !== null || decidedEffectiveText !== null) && nextDecisionText !== null ? <span aria-hidden="true"> · </span> : null}
              {nextDecisionText !== null ? <bdi>{nextDecisionText}</bdi> : null}
            </span>
          ) : null}
          {/* Step-2 §B2: the companion line rides rows too (US 10-year
           * beside the AU 10-year). */}
          {companionReadings.length > 0 ? (
            <span className="block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
              {companionReadings.map((companion) =>
                companion.value !== null ? (
                  <span key={companion.id} className="me-2 inline-flex items-baseline gap-1">
                    <span className="font-semibold text-[var(--color-text-primary)]">{copy.indicators[companion.id]?.name ?? companion.id}</span>
                    <bdi dir="ltr">{formatReadingValue(companion, numberLocale, copy.units)}</bdi>
                  </span>
                ) : null,
              )}
              {companionNote !== undefined ? <span>{companionNote}</span> : null}
            </span>
          ) : null}
          {/* Step-2 §B5: the VIX row always carries its 10-year position
           * (the card spec's interim presentation). */}
          {ALWAYS_POSITION_IDS.has(reading.id) && reading.percentile10y !== undefined ? (
            <PositionBar percentile={reading.percentile10y} zone={null} copy={copy} numberLocale={numberLocale} />
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
