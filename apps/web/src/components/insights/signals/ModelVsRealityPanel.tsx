/**
 * signals/ModelVsRealityPanel — the Gold Program's comparison panel (S2 →
 * S2.1, docs/insights/GOLD_SCORE_SPEC.md §4.4), rendered beside the
 * GoldTailwindPanel INSIDE the merged gold card, under the balance
 * visual (the owner's 2026-10-31 placement directive).
 *
 * ONE question: does the macro score agree with what gold actually did?
 *   - the CHIP — aligned-tailwind / aligned-headwind / diverging-up /
 *     diverging-down / neutral / no-read, in a quiet neutral pill (the
 *     signals-card discipline: no green/red — the WORD carries the
 *     meaning, a comparison is not a verdict);
 *   - the EXPLAINER — one hedged sentence naming both sides, with the
 *     reality's own number and basis ("+5.2% over the past 30 days").
 *
 * Data: `snapshot.goldSummary.modelVsReality` when the served snapshot
 * carries it; otherwise derived from the readings through the same pure
 * engine (old snapshots / instant client-side re-render). See the spec's
 * §2.4 for the honest one-tick skew against the live-prices overlay.
 *
 * BILINGUAL since S2.1 (the owner's directive): the copy rides the
 * `copy` prop from the web i18n dictionaries (signals.goldModelVsReality)
 * — EN and fa both render through the reviewed-copy path.
 */

import { useMemo } from 'react';
import type { GoldSummary, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { modelVsReality, modelVsRealityExplainerKey } from '@currena/insights';
import { GitCompareArrows } from 'lucide-react';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';

export function ModelVsRealityPanel({
  goldSummary,
  readings,
  copy,
  numberLocale,
}: {
  /** The served snapshot's compact stamp; absent → derived below. */
  goldSummary?: GoldSummary | undefined;
  /** The page's current readings (the fallback derivation). */
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const C = copy.signals.goldModelVsReality;
  const derived = useMemo(() => modelVsReality(readings), [readings]);
  const mvr = goldSummary?.modelVsReality ?? derived;

  const explainerKey = modelVsRealityExplainerKey(mvr);
  const hasValue = mvr.realityValue !== null && mvr.realityBasis !== null;
  // The fa convention: Persian percent sign with the localized digits.
  const pctSign = numberLocale === 'fa-IR' ? '٪' : '%';
  const valueText = hasValue
    ? `${mvr.realityValue! > 0 ? '+' : ''}${formatNumber(mvr.realityValue!, numberLocale, {
        maximumFractionDigits: 1,
      })}${pctSign}`
    : '';
  const explainer = interpolate(C.explainers[explainerKey], {
    value: valueText,
    basis: mvr.realityBasis !== null ? C.basisPhrases[mvr.realityBasis] : '',
  });

  return (
    <article
      id="insights-gold-model-vs-reality"
      className="gold-panel flex h-full flex-col rounded-[var(--radius-lg)] bg-currena-soft/60 p-3 ring-1 ring-[var(--color-border)]"
      data-mvr-chip={mvr.chip}
    >
      {/* The header — the card-inner block anatomy, matching the
       * GoldTailwindPanel beside it. */}
      <span className="flex w-full items-center gap-2">
        <GitCompareArrows
          aria-hidden
          strokeWidth={1.6}
          className="currena-icon shrink-0 text-[var(--color-text-secondary)]"
          style={{ '--icon-size': '18px' } as React.CSSProperties}
        />
        <span className="min-w-0 flex-1">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
            {C.title}
          </h4>
          <span className="block text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]">
            {C.subtitle}
          </span>
        </span>
      </span>

      {/* The chip — the one-word state, quiet ink (a comparison is not a
       * verdict; the word carries the meaning, never a colour). */}
      <span
        className="mt-2.5 inline-flex w-fit items-center rounded-full bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
        data-mvr-chip-word
      >
        {C.chips[mvr.chip]}
      </span>

      {/* The explainer — one hedged sentence with the reality's own
       * number and basis, isolated so a direction change can never
       * reorder the mixed-direction fragments. */}
      <bdi className="mt-2.5 block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {explainer}
      </bdi>

      {/* The honesty footnote. */}
      <span className="mt-auto block pt-2 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{C.footnote}</span>
    </article>
  );
}
