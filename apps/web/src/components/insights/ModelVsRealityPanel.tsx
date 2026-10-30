/**
 * ModelVsRealityPanel — the Gold Program's comparison panel (S2,
 * docs/insights/GOLD_SCORE_SPEC.md §4.4), rendered beside the
 * GoldTailwindPanel on the prices-board strip.
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
 * LOCALE NOTE (deliberate, S5-gated): EN copy in both locales for now —
 * the fa translation is the S5 audit-gated round (the copy lives in the
 * package, not the web dictionaries, so `pnpm copy:audit` stays clean).
 */

import { useMemo } from 'react';
import type { GoldSummary, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { MODEL_VS_REALITY_COPY_EN, modelVsReality, modelVsRealityExplainerKey } from '@currena/insights';
import { GitCompareArrows } from 'lucide-react';
import { interpolate } from '../../i18n';

export function ModelVsRealityPanel({
  goldSummary,
  readings,
  numberLocale,
}: {
  /** The served snapshot's compact stamp; absent → derived below. */
  goldSummary?: GoldSummary | undefined;
  /** The page's current readings (the fallback derivation). */
  readings: readonly IndicatorReading[];
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const C = MODEL_VS_REALITY_COPY_EN;
  const derived = useMemo(() => modelVsReality(readings), [readings]);
  const mvr = goldSummary?.modelVsReality ?? derived;

  const explainerKey = modelVsRealityExplainerKey(mvr);
  const hasValue = mvr.realityValue !== null && mvr.realityBasis !== null;
  const valueText = hasValue
    ? `${mvr.realityValue! > 0 ? '+' : ''}${formatNumber(mvr.realityValue!, numberLocale, {
        maximumFractionDigits: 1,
      })}%`
    : '';
  const explainer = interpolate(C.explainers[explainerKey], {
    value: valueText,
    basis: mvr.realityBasis !== null ? C.basisPhrases[mvr.realityBasis] : '',
  });

  return (
    <article
      id="insights-gold-model-vs-reality"
      className="gold-panel flex h-full flex-col rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
      data-mvr-chip={mvr.chip}
    >
      {/* The header — the same tinted icon-box + title-block anatomy. */}
      <span className="flex w-full items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-currena-muted/[0.08] ring-1 ring-[var(--color-border)]"
        >
          <GitCompareArrows
            aria-hidden
            strokeWidth={1.4}
            className="currena-icon h-6 w-6 text-[var(--color-text-secondary)]"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold leading-snug text-[var(--color-text-primary)]">{C.title}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-text-secondary)]">{C.subtitle}</span>
        </span>
      </span>

      {/* The chip — the one-word state, quiet ink (a comparison is not a
       * verdict; the word carries the meaning, never a colour). */}
      <span
        className="mt-3 inline-flex w-fit items-center rounded-full bg-currena-muted/[0.08] px-3 py-1 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
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
      <span className="mt-auto block pt-2.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{C.footnote}</span>
    </article>
  );
}
