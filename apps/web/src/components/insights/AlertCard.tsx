/**
 * AlertCard — the full-width indicator card face (Block F1 → v3 UI_SPEC §6,
 * UI-20..UI-23, 2026-10-20). ONE anatomy, in this order:
 *
 *   title → value + unit (tabular LTR bdi) → change line (arrow, size,
 *   period) → status chip (end-aligned, UI-12) → one-line meaning →
 *   meta row ("data for {period} · released {date} · updated {HH:mm UTC} ·
 *   Source link", CardMeta) → details control.
 *
 * v3 §4 state language (2026-10-20): unavailable and check-pending readings
 * hide their value on the face and show a ONE-LINE REASON instead (UI-17 —
 * the last good value lives inside the details panel only); the retired
 * display words ("No data", "Check pending", "Unusual") are gone — an
 * unusual-tier card now shows the Normal word (the tier stays internal:
 * this card keeps its amber top border and the 10-year position bar).
 *
 * Owner round-2 decree REVERSED here: the source is BACK ON the face
 * (v3 UI-20 item 6 + M-1 attribution) — the v3 UI_SPEC is the only
 * authority for visual changes; the details panel keeps its footer link.
 *
 * The lazy sparkline left the face with the v3 anatomy (UI-20 has no
 * sparkline slot; the details panel carries the full chart — one place,
 * one history fetch, no near-viewport double-fetch).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import {
  ALWAYS_POSITION_IDS,
  bandWordsOf,
  changeScaleOf,
  consequenceLine,
  consequenceState,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  formatPeakDistance,
  indicatorValueParts,
  policyLastChangeOf,
  attentionLineOf,
  tierOf,
  type DailyPeers,
  type IndicatorTier,
} from './config';
import { CardMetaRow, ChangeText, faceReasonOf } from './CardMeta';
import { PositionBar } from './PositionBar';
import { StatusChip } from './StatusChip';
import { formatAsOf } from './HistoryChart';
import { getIndicatorCopy } from './layer1';
import type { IndicatorReading as Reading } from '@currena/core';

export function AlertCard({
  reading,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  peers,
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
  /** The snapshot's daily peers — unlocks the v3 Delayed tier (movers.ts). */
  peers?: DailyPeers;
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
  const locale = numberLocale === 'fa-IR' ? 'fa' : 'en';
  // Layer 1 (docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md §6): the
  // ALWAYS-TRUE one-line plain effect, shown as small muted text on the
  // collapsed card face. Renders only when Layer-1 copy exists for this id
  // (graceful during the batched roll-out — D-04). State-independent, so it
  // never contradicts a live gauge or alert.
  const l1 = getIndicatorCopy(reading.id, locale);
  const tier: IndicatorTier = tierOf(reading, peers);
  const isNeedsAttention = tier === 'needs-attention';
  // v3 §4 (UI-17): a reading that cannot be told hides its value AND its
  // change on the face; the one-line reason takes the value's place. The
  // last good value is in the details panel only.
  const hidesValue = reading.status === 'unavailable' || reading.status === 'check-pending';
  const faceReason = faceReasonOf(reading, copy);
  const valueParts =
    !hidesValue && reading.value !== null
      ? indicatorValueParts(reading.id, reading.value, numberLocale, copy.units)
      : null;
  // Fix spec A-02 (2026-10-14): the needs-attention face line is GENERATED
  // from the reading's rule and value — hand-written meanings are gone.
  const meaningLine = attentionLineOf(reading, copy, numberLocale);
  // R30 — the sentence-versus-number guard: a card that NEEDS ATTENTION
  // never tells you its value "sits in its usual range" (paired-comparison
  // rules can fire anywhere in the range) — the rule line carries the news.
  const cs = consequenceState(reading, false);
  const showConsequence = !(isNeedsAttention && cs === 'typical');
  // Step-2 §B1: the exact last decision (date + size) on the policy cards,
  // and the next RBA decision date on the cash-rate card.
  const lastChange = policyLastChangeOf(reading);
  const lastChangeText =
    lastChange !== null
      ? interpolate(copy.ui.lastChangeLine, {
          change: formatChange(
            lastChange.points,
            def.changeKind,
            numberLocale,
            copy.units,
            changeScaleOf(reading.id),
          ),
          date: formatAsOf(lastChange.date, locale),
        })
      : null;
  const nextDecisionText =
    reading.id === 'rba-cash-rate' && nextRbaDecision !== undefined
      ? interpolate(copy.ui.nextDecisionLine, { date: formatAsOf(nextRbaDecision, locale) })
      : null;
  // Fix spec B-06 (2026-10-14): the policy cards show BOTH dates —
  // "decided 16 Sep 2026 · effective 17 Sep 2026".
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
      className={`alert-card scroll-mt-24 rounded-[var(--radius-lg)] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] ring-1 ring-[var(--color-border)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] md:p-5 motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 md:motion-safe:hover:-translate-y-0.5 ${pinned ? 'ring-currena-blue/30' : ''}`}
    >
      {/* The face (UI-20 items 1–5): one big button — title, value, change
       * + chip, meaning — a ≥44px tap zone (UI-53) that opens the details
       * panel (aria-label carries the "Details:" name; the explicit
       * details control after the meta row is the same action for
       * keyboards). */}
      <button
        type="button"
        onClick={(e) => onOpenDetails(reading.id, e.currentTarget)}
        className="insights-focusable block w-full cursor-pointer border-0 bg-transparent p-0 text-start"
        aria-haspopup="dialog"
        aria-label={`${copy.ui.detailsButton}: ${entry.name}`}
      >
        {/* 1. Title. */}
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-primary)]">
              {indicatorIconUrl(reading.id) !== null ? (
                <IconImg src={indicatorIconUrl(reading.id)!} size={26} desktopSize={34} />
              ) : null}
              {entry.name}
            </span>
          </span>
          {pinned ? (
            <span aria-hidden="true" className="shrink-0 text-sm text-[var(--color-status-context)]">
              ★
            </span>
          ) : null}
        </span>

        {/* 2. Value + unit (UI-12: tabular figures, shared baseline) — or
         * the UI-17 one-line reason when the value cannot be told. */}
        {hidesValue ? (
          faceReason !== null ? (
            <span className="mt-2 block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-face-reason>
              {faceReason}
            </span>
          ) : null
        ) : (
          <span className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {valueParts !== null ? (
              <bdi dir="ltr" className="type-number font-bold tabular-nums text-[var(--color-text-primary)]">
                <span>{valueParts.value}</span>
                {valueParts.unit !== null ? (
                  <span className="ms-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                    {valueParts.unit}
                  </span>
                ) : null}
              </bdi>
            ) : null}
          </span>
        )}

        {/* 3 + 4. Change line (arrow · size · period) with the status chip
         * end-aligned on the same row (UI-12). Hidden change on a
         * can't-tell face — the chip keeps its row. */}
        <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {!hidesValue ? (
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 text-[length:var(--type-caption)]">
              <ChangeText reading={reading} copy={copy} numberLocale={numberLocale} />
              {/* Step-1 C9: distance from the 10-year peak on the price rows. */}
              {/* Fix spec B-01: the record distance names the peak, its date
               * and its basis, computed from the full stored history. */}
              {reading.id === 'gold-usd' || reading.id === 'silver-usd' || reading.id === 'brent' || reading.id === 'btc-usd' ? (
                <span className="text-[var(--color-text-tertiary)]">
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
                <span className="text-[var(--color-text-tertiary)]">
                  {interpolate(copy.ui.highestSince, { year: String(reading.highestSinceYear) })}
                </span>
              ) : null}
            </span>
          ) : null}
          <span className="ms-auto shrink-0">
            <StatusChip status={reading.status} copy={copy} tier={tier} />
          </span>
        </span>

        {/* 5. One-line meaning — the generated attention rule line on
         * needs-attention cards, the no-history reason beside a kept
         * value, the consequence line otherwise. Neutral text (UI-14:
         * state colour only on the dot/icon/chip/top border). */}
        {reading.status === 'no-history' && faceReason !== null ? (
          <span className="mt-2 block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]" data-rule-line>
            <bdi>{faceReason}</bdi>
          </span>
        ) : null}
        {meaningLine !== undefined ? (
          <span className="mt-2 block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-rule-line>
            <bdi>{meaningLine}</bdi>
          </span>
        ) : null}
        {!hidesValue && showConsequence ? (
          <span className="mt-2 block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
            {consequenceLine(reading, entry, false, bandWordsOf(copy))}
          </span>
        ) : null}

        {/* Extra small lines the honest cards keep (spec'd elsewhere,
         * tested in step2): companions, the exact policy decisions, the
         * gap card's differing dates, the copper/gold monthly-average
         * note, a release landing today. */}
        {companionReadings.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
            {companionReadings.map((companion) =>
              companion.value !== null ? (
                <span key={companion.id} className="flex items-baseline gap-1">
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {copy.indicators[companion.id]?.name ?? companion.id}
                  </span>
                  <bdi dir="ltr">{formatIndicatorValue(companion.id, companion.value, numberLocale, copy.units)}</bdi>
                </span>
              ) : null,
            )}
            {companionNote !== undefined ? <span>{companionNote}</span> : null}
          </span>
        ) : null}
        {lastChangeText !== null || nextDecisionText !== null || decidedEffectiveText !== null ? (
          <span className="mt-1.5 block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
            {lastChangeText !== null ? <bdi>{lastChangeText}</bdi> : null}
            {lastChangeText !== null && decidedEffectiveText !== null ? <span aria-hidden="true"> · </span> : null}
            {decidedEffectiveText !== null ? <bdi>{decidedEffectiveText}</bdi> : null}
            {(lastChangeText !== null || decidedEffectiveText !== null) && nextDecisionText !== null ? (
              <span aria-hidden="true"> · </span>
            ) : null}
            {nextDecisionText !== null ? <bdi>{nextDecisionText}</bdi> : null}
          </span>
        ) : null}
        {/* Fix spec B-10: the gap card shows both legs' dates and the
         * "dates differ" tag when the freshest AU and US prints disagree —
         * the gap VALUE is always same-date (exact join). */}
        {reading.id === 'au-us-10y-gap' && reading.gapLegs !== undefined && reading.gapLegs.a.asOf !== reading.gapLegs.b.asOf ? (
          <span className="mt-1.5 block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-status-watch)]">{copy.ui.datesDiffer}</span>
            <span className="ms-1 opacity-80">
              {interpolate(copy.ui.gapLegDates, {
                a: copy.indicators[reading.gapLegs.a.id]?.name ?? reading.gapLegs.a.id,
                aDate: formatAsOf(reading.gapLegs.a.asOf, locale),
                b: copy.indicators[reading.gapLegs.b.id]?.name ?? reading.gapLegs.b.id,
                bDate: formatAsOf(reading.gapLegs.b.asOf, locale),
              })}
            </span>
          </span>
        ) : null}
        {reading.id === 'copper-gold' ? (
          <span className="mt-1.5 block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            {copy.ui.monthlyAverageNote}
          </span>
        ) : null}
        {reading.nextReleaseToday === true ? (
          <span className="mt-1.5 block text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
            {copy.ui.nextReleaseToday}
          </span>
        ) : null}
      </button>

      {/* R6 → R30: the 10-year position shows on UNUSUAL cards (word + bar
       * — the retired word's extremity carrier, v3); needs-attention cards
       * keep it in Details. Step-2 §B5: the VIX card ALWAYS shows it. */}
      {(tier === 'unusual' || ALWAYS_POSITION_IDS.has(reading.id)) && reading.percentile10y !== undefined ? (
        <PositionBar percentile={reading.percentile10y} zone={null} copy={copy} numberLocale={numberLocale} />
      ) : null}

      {/* 6. Meta row (wraps — U-02's fix): data period · released · updated
       * UTC · source link. */}
      <CardMetaRow reading={reading} copy={copy} numberLocale={numberLocale} />

      {/* Layer 1 — the always-true one-line plain effect (D-04): a single
       * caption-sized muted line on the collapsed card. Rendered only when
       * Layer-1 copy exists for this id; never contradicts a live gauge. */}
      {l1 ? (
        <p className="m-0 mt-1 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-layer1-oneline>
          <bdi>{l1.oneLine}</bdi>
        </p>
      ) : null}

      {/* 7. Details control — the explicit, always-labelled details trigger
       * (UI-54); the face above is the same action with a bigger zone. */}
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          onClick={(e) => onOpenDetails(reading.id, e.currentTarget)}
          className="insights-focusable -my-1.5 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-0 bg-transparent px-1.5 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          aria-haspopup="dialog"
        >
          {copy.ui.detailsButton} ›
          <span className="sr-only">, {entry.name}</span>
        </button>
      </div>
    </article>
  );
}
