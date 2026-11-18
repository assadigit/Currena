/**
 * GoldYieldDecomposition.tsx — GPE R12 / F5 (2026-11-18): the
 * yield-decomposition card, Zone D's second element — the assembled
 * macro reading the S3 verdict demanded ("yields are 5%, why is gold
 * not collapsing?" finally answered). docs/specs/gold-page-elevation:
 * s7/01 §4 (Chain 3's content architecture) · s7/02 §2.4 (the leg
 * glosses) · s6/03 zone D (stacked rows, values right-aligned, each
 * leg's as-of inline) · s8/01 R12.
 *
 * THE STACK (s7/01 §4 item 1): four rows — nominal 10y · real 10y ·
 * breakeven (derived) · term premium — each with its value
 * right-aligned, its as-of inline (C1: the series + date named at
 * point of use) and its one-line gloss (s7/02 §2.4's approved drafts).
 * The exact relation rendered is real + breakeven = nominal (the
 * honest-first arithmetic: the derived breakeven makes the sum exact;
 * the ACM term premium is a MODEL estimate beside the market legs —
 * its provenance + revision disclosure ride the row, Idea 5's binding
 * note — never a false additive fourth leg).
 *
 * "WHICH PIECE MOVED THIS MONTH" (item 2): each leg's signed 30-day
 * change (the window named — C1/C7, R10's enforcement on this surface).
 *
 * THE THREE NAMED CONFIGURATIONS (item 3): the static education copy —
 * real-driven = the classic headwind; breakeven-driven = neutral-to-
 * positive; term-premium-driven = the debasement configuration (the
 * headline teaching). THE EXCEPTION (item 4): the funding-stress twist
 * (the 2022 gilt analog), stated before a reader meets it in the wild.
 *
 * THE LIVE SEATS (s7/01 §4): the chain's voters — term-premium-10y +
 * us-deficit-12m — linked card-level (R10's anchor contract, the
 * name-match rule). Display context: this card adds no voter.
 *
 * Fail-closed: a dark leg renders dashes + the cannot-read word, never
 * a guess; the card never hides itself on a partial stack (the honest
 * rows still teach).
 */

import { useMemo } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { yieldDecomposition, type YieldLeg } from '@currena/insights';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { VOTER_NAME_KEY } from './GoldSeats';
import { seatAnchorHref } from './gold-tiles';

type Translate = ReturnType<typeof useI18n>['t'];

/** The leg rows' labels + glosses (the s7/02 §2.4 approved drafts). */
const LEG_LABEL_KEY: Readonly<Record<YieldLeg['id'], { label: TranslationKey; gloss: TranslationKey }>> = {
  'nominal-10y': { label: 'pd.gold.yieldLegNominal', gloss: 'pd.gold.yieldGlossNominal' },
  'real-10y': { label: 'pd.gold.yieldLegReal', gloss: 'pd.gold.yieldGlossReal' },
  'breakeven-10y': { label: 'pd.gold.yieldLegBreakeven', gloss: 'pd.gold.yieldGlossBreakeven' },
  'term-premium-10y': { label: 'pd.gold.yieldLegPremium', gloss: 'pd.gold.yieldGlossPremium' },
};

export function GoldYieldDecomposition({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const decomposition = useMemo(() => yieldDecomposition(readings), [readings]);

  const fmtDate = (iso: string): string =>
    locale === 'fa' ? formatJalaliDate(iso, 'fa-IR') : formatDateWords(iso, 'en-US');
  const fmtValue = (v: number): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDelta = (v: number): string => {
    const sign = v >= 0 ? '+' : '−';
    return interpolate(t('pd.gold.narrativeDeltaPts'), {
      v: `${sign}${formatNumber(Math.abs(v), numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    });
  };

  const [nominal, real, breakeven] = decomposition.legs;
  const identityText =
    decomposition.identityHolds && nominal.value !== null && real.value !== null && breakeven.value !== null
      ? interpolate(t('pd.gold.yieldIdentity'), {
          real: fmtValue(real.value),
          be: fmtValue(breakeven.value),
          nominal: fmtValue(nominal.value),
        })
      : null;

  /* The chain's live seats — card-level links (R10's builder + the
   * name-match rule: the link text is the seat's own compact name). */
  const seatLinks = (['term-premium-10y', 'us-deficit-12m'] as const).map((id) => ({
    id,
    name: t(VOTER_NAME_KEY[id as keyof typeof VOTER_NAME_KEY]),
    href: seatAnchorHref({ id, homePage: 'usa' as const }),
  }));

  return (
    <section
      aria-labelledby="gold-yield-title"
      data-gold-yield
      className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-3.5"
    >
      <h3 id="gold-yield-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {t('pd.gold.yieldTitle')}
      </h3>

      {/* The stack: four rows, values right-aligned, each leg's as-of
       * inline + its one-line gloss (s6/03 zone D · s7/02 §2.4). */}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {decomposition.legs.map((leg) => (
          <LegRow key={leg.id} leg={leg} t={t} fmtDate={fmtDate} fmtValue={fmtValue} />
        ))}
      </ul>

      {/* The exact relation — real + breakeven = nominal (honest-first:
       * the derived breakeven makes the sum exact; the term premium is
       * the model estimate BESIDE the market legs, disclosed below). */}
      {identityText !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]" data-yield-identity>
          <bdi>{identityText}</bdi>
        </p>
      ) : null}

      {/* "Which piece moved this month" — each leg's signed 30-day
       * change, the window named (C1/C7). */}
      <div className="flex flex-col gap-0.5" data-yield-moved>
        <h4 className="m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {t('pd.gold.yieldMovedTitle')}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          {decomposition.legs.map((leg) => (
            <li key={leg.id} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
              {/* The window named at point of use (C1/C7 — R10's
               * enforcement): the same narrativeMover grammar the F1
               * family lines use, the label as the name. */}
              <bdi>
                {interpolate(t('pd.gold.narrativeMover'), {
                  name: t(LEG_LABEL_KEY[leg.id]!.label),
                  delta: leg.delta30d !== null ? fmtDelta(leg.delta30d) : t('pd.gold.valueUnavailable'),
                })}
              </bdi>
            </li>
          ))}
        </ul>
      </div>

      {/* The three named configurations + the exception (the static
       * education block — dated examples, no live verdict). */}
      <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60">
        <h4 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
          {t('pd.gold.yieldConfigTitle')}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          <li><bdi>{t('pd.gold.yieldConfigReal')}</bdi></li>
          <li><bdi>{t('pd.gold.yieldConfigBreakeven')}</bdi></li>
          <li><bdi>{t('pd.gold.yieldConfigPremium')}</bdi></li>
          <li className="text-[var(--color-text-tertiary)]"><bdi>{t('pd.gold.yieldException')}</bdi></li>
        </ul>
      </div>

      {/* The model-provenance disclosure (Idea 5's binding note). */}
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-yield-premium-note>
        <bdi>{t('pd.gold.yieldPremiumNote')}</bdi>
      </p>

      {/* The chain's live seats — card-level links (s7/01 §4; R10's
       * builder + the name-match rule: the link text is the seat's own
       * compact name). */}
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[length:var(--type-caption)] leading-relaxed">
        <bdi className="font-semibold text-[var(--color-text-secondary)]">{t('pd.gold.yieldSeats')}</bdi>
        {seatLinks.map((seat, i) => (
          <span key={seat.id} className="flex items-baseline gap-1.5">
            {i > 0 ? <span aria-hidden="true">·</span> : null}
            <a href={seat.href ?? '#'} className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
              {seat.name}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}

/** One stacked leg row: label + gloss on the left, the value + its
 * as-of right-aligned (s6/03's D-zone pattern); a dark leg renders
 * dashes + the cannot-read word (fail-closed). */
function LegRow({
  leg,
  t,
  fmtDate,
  fmtValue,
}: {
  leg: YieldLeg;
  t: Translate;
  fmtDate: (iso: string) => string;
  fmtValue: (v: number) => string;
}): React.JSX.Element {
  const { label, gloss } = LEG_LABEL_KEY[leg.id]!;
  return (
    <li className="flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60" data-yield-leg={leg.id}>
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t(label)}</span>
        <span className="flex shrink-0 items-baseline gap-1.5">
          {leg.value !== null ? (
            <>
              <bdi className="text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)]">{fmtValue(leg.value)}</bdi>
              <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">%</span>
            </>
          ) : (
            <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.gold.valueUnavailable')}</span>
          )}
        </span>
      </div>
      <p className="m-0 flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi className="min-w-0">{t(gloss)}</bdi>
        <bdi className="shrink-0 text-[var(--color-text-tertiary)]">
          {leg.asOf !== null ? interpolate(t('pd.gold.yieldAsOf'), { date: fmtDate(leg.asOf) }) : ''}
        </bdi>
      </p>
      {leg.sourceName !== null ? (
        <p className="m-0 line-clamp-1 text-[10px] leading-tight text-[var(--color-text-tertiary)]" title={leg.sourceName}>
          {leg.sourceName}
        </p>
      ) : null}
    </li>
  );
}
