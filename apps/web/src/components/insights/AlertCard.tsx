/**
 * AlertCard — Block F1: the anatomy of an indicator card in the "alert"
 * state. "Show these parts, in this order: status chip, plain name, small
 * technical tag, value with unit, 7-day and 30-day change, position word
 * with a labeled range bar, consequence line, small sparkline, source and
 * date. Add an accent border on the inline-start edge. Add a light tint to
 * the surface." The long technical description lives in the details panel
 * (F5) — the card face carries the news, fast.
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
  bandWordsOf,
  consequenceLine,
  consequenceState,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  friendlySource,
  tierOf,
  type IndicatorTier,
} from './config';
import { PositionBar } from './PositionBar';
import { StatusChip } from './StatusChip';
import { formatAsOf } from './HistoryChart';

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
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  /** I10: the pin badge stays visible on the card face. */
  pinned: boolean;
}) {
  const def = definitionFor(reading.id);
  const entry = copy.indicators[reading.id];
  const isUnavailable = reading.status === 'unavailable';
  const tier: IndicatorTier = tierOf(reading);
  const isNeedsAttention = tier === 'needs-attention';
  const valueText =
    reading.value !== null ? formatIndicatorValue(reading.id, reading.value, numberLocale, copy.units) : null;
  // R6 → round 24 (roast "fix this first" #1): the needs-attention face
  // line is the indicator's MEANING — what the fired rule actually means
  // for the reader — not the "Rule: …" jargon (the roast: "a rule but no
  // meaning"). The technical rule text stays in the details panel.
  const meaningLine = isNeedsAttention ? copy.meaning[reading.id] : undefined;
  // R30 (roast 11 Oct) — the sentence-versus-number guard: a card that
  // NEEDS ATTENTION must never tell you its value "sits in its usual
  // range". When the rule fired but the percentile state reads 'typical'
  // (paired-comparison rules can fire anywhere in the range), the
  // consequence line is DROPPED — the rule line above it carries the news.
  const cs = consequenceState(reading, false);
  const showConsequence = !(isNeedsAttention && cs === 'typical');

  return (
    <article
      id={`insights-card-${reading.id}`}
      data-status={reading.status}
      data-tier={tier}
      className={`alert-card scroll-mt-24 rounded-[var(--radius-lg)] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] ring-1 ring-[var(--color-border)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 md:motion-safe:hover:-translate-y-0.5 ${pinned ? 'ring-currena-blue/30' : ''}`}
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
               * 10Y…). Decorative — the name carries the meaning. */}
              {indicatorIconUrl(reading.id) !== null ? (
                <IconImg src={indicatorIconUrl(reading.id)!} size={20} />
              ) : null}
              {entry.name}
            </span>
            {/* R30: the raw series tag ("CPI: rents", "RES_DWELL_ST") left
             * the card face — it lives in the details panel now. */}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {pinned ? <span aria-hidden="true" className="text-sm text-[var(--color-status-context)]">★</span> : null}
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
                  {formatChange(reading.change7d, def.changeKind, numberLocale, copy.units)}
                  <span className="ms-1 opacity-80">{copy.ui.days7}</span>
                </bdi>
              ) : null}
              {reading.change30d !== undefined ? (
                <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {formatChange(reading.change30d, def.changeKind, numberLocale, copy.units)}
                  <span className="ms-1 opacity-80">{copy.ui.days30}</span>
                </bdi>
              ) : null}
            </span>

            {/* R6 → round 24: the needs-attention face line — the one-line
             * meaning (softened tint; red belongs to the words). */}
            {meaningLine !== undefined ? (
              <span className="mt-2 block rounded-[var(--radius-sm)] bg-currena-warning/[0.07] px-2.5 py-1.5 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-rule-line>
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
             * opposite the marker was a lie the roast caught. */}
            {tier === 'unusual' && reading.percentile10y !== undefined ? (
              <PositionBar percentile={reading.percentile10y} zone={null} copy={copy} numberLocale={numberLocale} />
            ) : null}

            <span className="mt-2 block">
              <LazySparkline id={reading.id} />
            </span>
          </>
        )}

        <span className="mt-2 flex items-baseline justify-between gap-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <span>
            {reading.asOf
              ? interpolate(copy.ui.updatedOn, {
                  date: formatAsOf(reading.asOf, numberLocale === 'fa-IR' ? 'fa' : 'en'),
                })
              : copy.ui.na}
            <span className="mx-1.5 opacity-50">·</span>
            {/* R30: publisher only — raw series ids ("ABS (RES_DWELL_ST)")
             * never reach the card face. */}
            {friendlySource(reading.sourceName)}
          </span>
          <span className="whitespace-nowrap font-semibold text-[var(--color-status-context)]">{copy.ui.detailsButton} ›</span>
        </span>
      </button>
    </article>
  );
}
