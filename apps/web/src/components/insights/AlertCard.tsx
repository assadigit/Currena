/**
 * AlertCard — Block F1: the anatomy of an indicator card in the "alert"
 * state. "Show these parts, in this order: status chip, plain name, small
 * technical tag, value with unit, 7-day and 30-day change, position word
 * with a labeled range bar, consequence line, small sparkline, source and
 * date. Add an accent border on the inline-start edge. Add a light tint to
 * the surface." The long technical description lives in the details panel
 * (F5) — the card face carries the news, fast.
 *
 * Owner request (sources off the cards): the source no longer rides the
 * card face; it is named and linked in the details panel footer and in the
 * About/sources section. The date row stays.
 *
 * The sparkline loads lazily (IntersectionObserver + the module-cached
 * history fetch — the same cache the details panel shares).
 */

import { useEffect, useRef, useState } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import { Sparkline } from '../Sparkline';
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
  tierOf,
  type IndicatorTier,
 attentionLineOf, formatPeakDistance, formatIndicatorValue } from './config';
import { PositionBar } from './PositionBar';
import { StatusChip } from './StatusChip';
import { formatAsOf } from './HistoryChart';
import type { IndicatorReading as Reading } from '@currena/core';

/** Lazy mini-sparkline: fetches on (near-)visibility, caches module-wide. */
function LazySparkline({ id }: { id: IndicatorId }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [points, setPoints] = useState<number[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el || points !== null) return;
    if (typeof IntersectionObserver === 'undefined') return; // old WebView — no sparkline, no crash
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
            /* no sparkline on fetch failure — the row stays honest */
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
    <span ref={ref} className="block h-7" aria-hidden="true">
      {points ? <Sparkline points={points} width={240} height={28} ariaLabel="" tone="neutral" className="text-currena-muted" /> : null}
    </span>
  );
}

export function AlertCard({
  reading,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  companionReadings = [],
  companionNote,
  nextRbaDecision,
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  /** I10: the pin badge stays visible on the card face. */
  pinned: boolean;
  /** Step-1 A3: companion context readings rendered inside this card
   * (core CPI on the US inflation card) — never their own row. */
  companionReadings?: readonly Reading[];
  /** Step-2 §B2: the companion block's note line, per parent card
   * ("the gap is mainly energy" / "shown for comparison"). */
  companionNote?: string;
  /** Step-2 §B1: the next RBA decision date (calendar, kind 'rba') —
   * rendered on the cash-rate card. */
  nextRbaDecision?: string;
}) {
  const def = definitionFor(reading.id);
  const entry = copy.indicators[reading.id];
  const isUnavailable = reading.status === 'unavailable';
  const tier: IndicatorTier = tierOf(reading);
  const isNeedsAttention = tier === 'needs-attention';
  const valueText = formatReadingValue(reading, numberLocale, copy.units);
  // Step-1 B5: the data date speaks the data PERIOD ("August 2026"), the
  // official release date follows when the schedule knows it, and a stale
  // reading wears its tag — never a fetch-date "Updated Jul 31".
  const locale = numberLocale === 'fa-IR' ? 'fa' : 'en';
  const dataDate =
    reading.asOf !== null
      ? dataPeriodText(reading.id, reading.asOf, locale, numberLocale, reading.periodEnd)
      : null;
  const releaseText =
    reading.releaseDate !== undefined
      ? formatAsOf(reading.releaseDate, locale)
      : null;
  const changeLabel = changeWindowLabel(reading.id) === 'since-previous' ? copy.ui.sincePreviousRelease : copy.ui.days30;
  // Fix spec A-02 (2026-10-14): the needs-attention face line is GENERATED
  // from the reading's own rule and value — the hand-written meanings are
  // gone (they could contradict the card's numbers). The technical rule
  // text stays in the details panel.
  const meaningLine = attentionLineOf(reading, copy, numberLocale);
  // R30 (roast 11 Oct) — the sentence-versus-number guard: a card that
  // NEEDS ATTENTION must never tell you its value "sits in its usual
  // range". When the rule fired but the percentile state reads 'typical'
  // (paired-comparison rules can fire anywhere in the range), the
  // consequence line is DROPPED — the rule line above it carries the news.
  const cs = consequenceState(reading, false);
  const showConsequence = !(isNeedsAttention && cs === 'typical');
  // Step-2 §B1: the exact last decision (date + size) on the policy cards,
  // and the next RBA decision date on the cash-rate card.
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
  // Fix spec B-06 (2026-10-14): the policy cards show BOTH dates —
  // "decided 16 Sep 2026 · effective 17 Sep 2026" (the series' step is the
  // effective date; the decision date comes from data/policy-decisions.json).
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
      data-tier={tier}
      className={`alert-card scroll-mt-24 rounded-[var(--radius-lg)] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] ring-1 ring-[var(--color-border)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 md:motion-safe:hover:-translate-y-0.5 ${pinned ? 'ring-[var(--color-text-primary)]/25' : ''}`}
    >
      <button
        type="button"
        onClick={(e) => onOpenDetails(reading.id, e.currentTarget)}
        className="insights-focusable block w-full cursor-pointer border-0 bg-transparent p-0 text-start"
        aria-haspopup="dialog"
        aria-label={`${copy.ui.detailsButton}: ${entry.name}`}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-primary)]">
              {/* Round 28 (owner): the indicator wears its own artwork when
               * one exists (oil barrel, gold bar, bills, housing, the US
               * 10Y…). Decorative — the name carries the meaning. Round 29
               * (owner): 26/34px — the artwork reads at the title's scale. */}
              {indicatorIconUrl(reading.id) !== null ? (
                <IconImg src={indicatorIconUrl(reading.id)!} size={26} desktopSize={34} />
              ) : null}
              {entry.name}
            </span>
            {/* R30: the raw series tag ("CPI: rents", "RES_DWELL_ST") left
             * the card face — it lives in the details panel now. */}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {pinned ? <span aria-hidden="true" className="text-sm text-[var(--color-text-secondary)]">★</span> : null}
            <StatusChip status={reading.status} copy={copy} tier={tier} />
          </span>
        </span>

        {isUnavailable ? (
          <span className="mt-2 block text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
            {copy.ui.unavailableCard}
          </span>
        ) : (
          <>
            <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {valueText !== null ? (
                <bdi dir="ltr" className="type-number text-[var(--color-text-primary)]">
                  {valueText}
                </bdi>
              ) : null}
              {reading.change7d !== undefined ? (
                <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {formatChange(reading.change7d, def.changeKind, numberLocale, copy.units, changeScaleOf(reading.id))}
                  <span className="ms-1 opacity-80">{copy.ui.days7}</span>
                </bdi>
              ) : null}
              {reading.change30d !== undefined ? (
                <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {formatChange(reading.change30d, def.changeKind, numberLocale, copy.units, changeScaleOf(reading.id))}
                  <span className="ms-1 opacity-80">{changeLabel}</span>
                </bdi>
              ) : null}
              {/* Step-1 C9: distance from the 10-year peak on the price rows
               * ("the same way stocks show distance from the 52-week high"). */}
              {/* Fix spec B-01: the record distance names the peak, its date
               * and its basis, computed from the full stored history. */}
              {reading.id === 'gold-usd' || reading.id === 'silver-usd' || reading.id === 'brent' || reading.id === 'btc-usd' ? (
                <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                  {formatPeakDistance(
                    reading,
                    numberLocale,
                    copy.ui,
                    (iso: string) => formatAsOf(iso, locale),
                    (value: number) => formatIndicatorValue(reading.id, value, numberLocale, copy.units),
                  )}
                </span>
              ) : null}
              {/* Fix spec B-19: yields carry "highest since {year}" from the
               * full stored history — a 10-year window cannot say 2002. */}
              {reading.highestSinceYear !== undefined ? (
                <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                  {interpolate(copy.ui.highestSince, { year: String(reading.highestSinceYear) })}
                </span>
              ) : null}
            </span>

            {/* Step-1 A3: companion context values ride inside this card —
             * core CPI next to headline ("the gap is mainly energy"), the US
             * 10-year beside the AU 10-year (Step-2 §B2, "for comparison"). */}
            {companionReadings.length > 0 ? (
              <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                {companionReadings.map((companion) =>
                  companion.value !== null ? (
                    <span key={companion.id} className="flex items-baseline gap-1">
                      <span className="font-semibold text-[var(--color-text-primary)]">{copy.indicators[companion.id]?.name ?? companion.id}</span>
                      <bdi dir="ltr">{formatReadingValue(companion, numberLocale, copy.units)}</bdi>
                    </span>
                  ) : null,
                )}
                {companionNote !== undefined ? <span>{companionNote}</span> : null}
              </span>
            ) : null}

            {/* Step-2 §B1: the exact last decision (date + size) and — on the
             * RBA cash-rate card — the next decision date, each its own line
             * beside the level (the Step-1 D3 two-line discipline). */}
            {lastChangeText !== null ? (
              <span className="mt-1.5 block text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
                <bdi>{lastChangeText}</bdi>
                {decidedEffectiveText !== null ? <bdi> · {decidedEffectiveText}</bdi> : null}
                {nextDecisionText !== null ? <bdi> · {nextDecisionText}</bdi> : null}
              </span>
            ) : nextDecisionText !== null ? (
              <span className="mt-1.5 block text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
                <bdi>{nextDecisionText}</bdi>
              </span>
            ) : null}

            {/* R6 → round 24 → grayscale redesign (spec §6): the needs-attention
             * face line — the one-line meaning on a NEUTRAL tint box (red
             * belongs to the chip/border words, not a wall of pink). */}
            {meaningLine !== undefined ? (
              <span className="mt-2 block rounded-[var(--radius-sm)] bg-currena-muted/[0.07] px-2.5 py-1.5 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-rule-line>
                <bdi>{meaningLine}</bdi>
              </span>
            ) : null}

            {/* F1: consequence line — state-keyed, hedged, life-first
             * (R30: never on a needs-attention card whose numbers say
             * "typical" — see the guard above). */}
            {showConsequence ? (
              <span className="mt-2 block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                {consequenceLine(reading, entry, false, bandWordsOf(copy))}
              </span>
            ) : null}

            {/* R6 → R30: the 10-year position shows on UNUSUAL cards (word
             * + bar); needs-attention cards keep it in Details. NO rule
             * zone here — no rule fired on this tier, so the zone tick
             * opposite the marker was a lie the roast caught. Step-2 §B5:
             * the VIX card ALWAYS shows its 10-year position (the card
             * spec's interim presentation before the Step-3 words). */}
            {(tier === 'unusual' || ALWAYS_POSITION_IDS.has(reading.id)) && reading.percentile10y !== undefined ? (
              <PositionBar percentile={reading.percentile10y} zone={null} copy={copy} numberLocale={numberLocale} />
            ) : null}

            <span className="mt-2 block">
              <LazySparkline id={reading.id} />
            </span>
          </>
        )}

        <span className="mt-2 flex items-baseline justify-between gap-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <span>
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
            {dataDate !== null
              ? interpolate(copy.ui.dataFor, { date: dataDate })
              : reading.asOf
                ? interpolate(copy.ui.updatedOn, { date: formatAsOf(reading.asOf, numberLocale === 'fa-IR' ? 'fa' : 'en') })
                : copy.ui.na}
            {releaseText !== null ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                {interpolate(copy.ui.releasedOn, { date: releaseText })}
              </>
            ) : null}
            {/* Fix spec B-10: the gap card shows both legs' dates and the
             * "dates differ" tag when the freshest AU and US prints disagree —
             * the gap VALUE is always same-date (exact join). */}
            {reading.id === 'au-us-10y-gap' && reading.gapLegs !== undefined && reading.gapLegs.a.asOf !== reading.gapLegs.b.asOf ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="font-semibold text-[var(--color-status-watch)]">{copy.ui.datesDiffer}</span>
                <span className="ms-1 opacity-80">
                  {interpolate(copy.ui.gapLegDates, {
                    a: copy.indicators[reading.gapLegs.a.id]?.name ?? reading.gapLegs.a.id,
                    aDate: formatAsOf(reading.gapLegs.a.asOf, locale),
                    b: copy.indicators[reading.gapLegs.b.id]?.name ?? reading.gapLegs.b.id,
                    bDate: formatAsOf(reading.gapLegs.b.asOf, locale),
                  })}
                </span>
              </>
            ) : null}
            {/* Fix spec B-15: the copper/gold card's value is the monthly
             * average, not a live price. */}
            {reading.id === 'copper-gold' ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                {copy.ui.monthlyAverageNote}
              </>
            ) : null}
            {reading.nextReleaseToday === true ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                {copy.ui.nextReleaseToday}
              </>
            ) : null}
          </span>
          <span className="whitespace-nowrap font-semibold text-[var(--color-text-primary)]">{copy.ui.detailsButton} ›</span>
        </span>
      </button>
    </article>
  );
}
