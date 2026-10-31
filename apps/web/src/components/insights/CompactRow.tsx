/**
 * CompactRow — Block F2 → v3 UI_SPEC §6 (UI-20..UI-23, 2026-10-20). ONE
 * anatomy, the same order as the AlertCard face (the two faces are
 * normalized; only the value's type size differs):
 *
 *   title → value + unit (tabular LTR bdi) → change line (arrow, size,
 *   period) → status chip (end-aligned) → one-line meaning → meta row
 *   ("data for {period} · released {date} · updated {HH:mm UTC} · Source
 *   link", CardMeta) → details control.
 *
 * A can't-tell face (unavailable / check-pending) hides its value and
 * change and shows the one-line reason instead (v3 §4, UI-17); the v3
 * Delayed tier rides the chip; no-history keeps its value with the
 * Context word + reason line.
 *
 * The row's tiny sparkline left with the v3 anatomy (UI-20 has no
 * sparkline slot; the details panel carries the chart) — the lane scans
 * as ten rows in the time it takes to read three cards (F2's brief).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import { StatusChip } from './StatusChip';
import { CardMetaRow, ChangeText, faceReasonOf } from './CardMeta';
import { PositionBar } from './PositionBar';
import { formatAsOf } from './HistoryChart';
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
  tierOf,
  attentionLineOf,
  type DailyPeers,
  type IndicatorTier,
} from './config';

export function CompactRow({
  reading,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  peers,
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
  /** The snapshot's daily peers — unlocks the v3 Delayed tier (movers.ts). */
  peers?: DailyPeers;
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
  const locale = numberLocale === 'fa-IR' ? 'fa' : 'en';
  const tier: IndicatorTier = tierOf(reading, peers);
  const hidesValue = reading.status === 'unavailable' || reading.status === 'check-pending';
  const faceReason = faceReasonOf(reading, copy);
  const valueParts =
    !hidesValue && reading.value !== null
      ? indicatorValueParts(reading.id, reading.value, numberLocale, copy.units)
      : null;
  // Fix spec A-02 (2026-10-14): the needs-attention line is GENERATED from
  // the reading's own rule and value (see AlertCard).
  const meaningLine = attentionLineOf(reading, copy, numberLocale);
  // R30: the sentence-versus-number guard (see AlertCard).
  const cs = consequenceState(reading, false);
  const showConsequence = !(tier === 'needs-attention' && cs === 'typical');
  // Step-2 §B1: the exact last decision (date + size) on the policy rows.
  const lastChange = policyLastChangeOf(reading);
  const lastChangeText =
    lastChange !== null
      ? interpolate(copy.ui.lastChangeLine, {
          change: formatChange(lastChange.points, def.changeKind, numberLocale, copy.units, changeScaleOf(reading.id, def.changeKind)),
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
      data-tier={tier}
      className="scroll-mt-24 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-2.5 ring-1 ring-[var(--color-border)] md:px-4"
    >
      {/* The face (UI-20 items 1–5): the big tap zone (UI-53). */}
      <button
        type="button"
        onClick={(e) => onOpenDetails(reading.id, e.currentTarget)}
        className="insights-focusable block w-full cursor-pointer border-0 bg-transparent p-0 text-start"
        aria-haspopup="dialog"
        aria-label={`${copy.ui.detailsButton}: ${entry.name}`}
      >
        {/* 1. Title. */}
        <span className="flex items-center gap-1.5 text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-primary)]">
          {indicatorIconUrl(reading.id) !== null ? (
            <IconImg src={indicatorIconUrl(reading.id)!} size={22} desktopSize={26} />
          ) : null}
          <span className="min-w-0">{entry.name}</span>
          {pinned ? <span className="sr-only"> · {copy.ui.pinnedBadge}</span> : null}
        </span>

        {/* 2. Value + unit — or the UI-17 reason when it cannot be told. */}
        {hidesValue ? (
          faceReason !== null ? (
            <span className="mt-1 block text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-face-reason>
              {faceReason}
            </span>
          ) : null
        ) : (
          valueParts !== null && (
            <bdi dir="ltr" className="type-number mt-1 block font-bold tabular-nums text-[var(--color-text-primary)]">
              <span>{valueParts.value}</span>
              {valueParts.unit !== null ? (
                <span className="ms-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                  {valueParts.unit}
                </span>
              ) : null}
            </bdi>
          )
        )}

        {/* 3 + 4. Change line with the chip end-aligned on its row. */}
        <span className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {!hidesValue ? (
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 text-[length:var(--type-caption)]">
              <ChangeText reading={reading} copy={copy} numberLocale={numberLocale} />
              {/* Step-1 C9: distance from the 10-year peak (price rows). */}
              {(reading.id === 'gold-usd' || reading.id === 'silver-usd' || reading.id === 'brent' || reading.id === 'btc-usd') &&
              reading.fromPeak10y !== undefined &&
              reading.fromPeak10y < -0.05 ? (
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
              {reading.highestSinceYear !== undefined ? (
                <span className="text-[var(--color-text-tertiary)]">
                  {interpolate(copy.ui.highestSince, { year: String(reading.highestSinceYear) })}
                </span>
              ) : null}
              {showMixedTag ? (
                <span className="rounded-full bg-currena-muted/15 px-2 py-0.5 font-bold text-[var(--color-text-secondary)]">
                  {copy.ui.mixedEvidenceTag}
                </span>
              ) : null}
            </span>
          ) : null}
          <span className="ms-auto shrink-0">
            <StatusChip status={reading.status} copy={copy} tier={tier} />
          </span>
        </span>

        {/* 5. One-line meaning (generated) + the policy/companion lines. */}
        {reading.status === 'no-history' && faceReason !== null ? (
          <span className="mt-1 block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-rule-line>
            <bdi>{faceReason}</bdi>
          </span>
        ) : null}
        {meaningLine !== undefined ? (
          <span className="mt-1 block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-rule-line>
            <bdi>{meaningLine}</bdi>
          </span>
        ) : null}
        {lastChangeText !== null || nextDecisionText !== null || decidedEffectiveText !== null ? (
          <span className="mt-1 block text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
            {lastChangeText !== null ? <bdi>{lastChangeText}</bdi> : null}
            {lastChangeText !== null && decidedEffectiveText !== null ? <span aria-hidden="true"> · </span> : null}
            {decidedEffectiveText !== null ? <bdi>{decidedEffectiveText}</bdi> : null}
            {(lastChangeText !== null || decidedEffectiveText !== null) && nextDecisionText !== null ? (
              <span aria-hidden="true"> · </span>
            ) : null}
            {nextDecisionText !== null ? <bdi>{nextDecisionText}</bdi> : null}
          </span>
        ) : null}
        {companionReadings.length > 0 ? (
          <span className="mt-1 block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            {companionReadings.map((companion) =>
              companion.value !== null ? (
                <span key={companion.id} className="me-2 inline-flex items-baseline gap-1">
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
        {!hidesValue && showConsequence ? (
          <span className="mt-1 block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            {consequenceLine(reading, entry, false, bandWordsOf(copy))}
          </span>
        ) : null}
        {/* Step-2 §B5: the VIX row always carries its 10-year position. */}
        {ALWAYS_POSITION_IDS.has(reading.id) && reading.percentile10y !== undefined ? (
          <PositionBar percentile={reading.percentile10y} zone={null} copy={copy} numberLocale={numberLocale} />
        ) : null}
      </button>

      {/* 6. Meta row (wraps — U-02's fix). */}
      <CardMetaRow reading={reading} copy={copy} numberLocale={numberLocale} />

      {/* 7. Details control. */}
      <div className="mt-0.5 flex justify-end">
        <button
          type="button"
          onClick={(e) => onOpenDetails(reading.id, e.currentTarget)}
          className="insights-focusable -my-1 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-0 bg-transparent px-1 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          aria-haspopup="dialog"
        >
          {copy.ui.detailsButton} ›
          <span className="sr-only">, {entry.name}</span>
        </button>
      </div>
    </article>
  );
}
