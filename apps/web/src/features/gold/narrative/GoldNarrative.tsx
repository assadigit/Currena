/**
 * GoldNarrative.tsx — GPE R11 / F1 (2026-11-18): the daily narrative,
 * "Why gold moved" — the explanation layer's FIRST card (Zone D's first
 * element; the S3 verdict's co-equal-Core rule made real).
 * docs/specs/gold-page-elevation: s7/03 §2 (the binding rules) · s6/01
 * zone D · s6/03 zone D (the 390 rules) · s8/01 R11.
 *
 * THE ARC (s7/03 §2.1, binding order):
 *   1. the price fact — the TE pattern: gold's own move + its context
 *      windows, the series and as-of named at point of use (C1). One
 *      sentence, NO attribution language. Links the Signals chart
 *      (#insights-signals — the section's own stable anchor).
 *   2. the five family sentences, lane order — each its firing state
 *      (the lane word + counts, BYTE-IDENTICAL to the hero and the
 *      seats' lane cards: the same interpolate keys, the same numbers —
 *      s7/03 §2.4's one-projection rule) + the raw deltas of the seats
 *      that moved (facts about the seats, never shares of the price
 *      move — the no-fake-GRAM rule). Each family line LINKS its lane
 *      card (#lane-{lane} — R10's anchor contract).
 *   3. the demand clause is CONDITIONAL (s7/03 §2.1 item 3): it renders
 *      only when the demand data moves — Zone K's data (R14/R15) does
 *      not exist yet, so the clause never renders this session; the
 *      grammar lands with the section.
 *   4. the caveat, STANDING and ADJACENT (C7 rule 2): "the meter
 *      explains conditions, not the price move" — rendered at the
 *      band's foot, in the same visual unit as the families.
 *
 * WORDING (s7/03 §2.2): "coincided with", never "because" — the
 * component states co-movement and conditions, never causation; no
 * attribution percentages; no forecast language (C4); every number
 * carries its window (C1/C7 — R10's enforcement on this surface).
 *
 * 390 (s6/03 zone D): one paragraph + the family read as a stacked list
 * (family word right-aligned firing state); nothing collapsed — the
 * band adds ~half a screen.
 */

import { useMemo } from 'react';
import type { IndicatorReading, Locale } from '@currena/core';
import { goldNarrative, type NarrativeFamily, type NarrativeMover } from '@currena/insights';
import { formatDateWords, formatJalaliDate, formatNumber } from '@currena/core';
import { interpolate } from '../../../shared/i18n';
import { useI18n } from '../../../shared/lib/locale';
import { LANE_STATE_KEY, LANE_TITLE_KEY, VOTER_NAME_KEY } from '../GoldSeats';

type Translate = ReturnType<typeof useI18n>['t'];

/** The mover's delta in its own units, signed, window named at point of
 * use (C1/C7) — '+0.26 pts' / '−1.9٪' style per locale + changeKind. */
function moverDeltaText(mover: NarrativeMover, numberLocale: Locale, t: Translate): string {
  const digits = formatNumber(Math.abs(mover.delta30d), numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const sign = mover.delta30d >= 0 ? '+' : '−';
  const signed = `${sign}${digits}`;
  return interpolate(t(mover.changeKind === 'points' ? 'pd.gold.narrativeDeltaPts' : 'pd.gold.narrativeDeltaPct'), { v: signed });
}

export function GoldNarrative({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const narrative = useMemo(() => goldNarrative(readings), [readings]);

  /* The price fact — the TE pattern. The windows render only those the
   * reading carries (a missing window is never a garbage number), each
   * named (C1); the series + as-of are the reading's OWN fields. */
  const price = narrative.price;
  const windows: string[] = [];
  if (price?.change1d !== null && price?.change1d !== undefined) {
    windows.push(interpolate(t('pd.gold.narrativeWindow1d'), { v: signedPct(price.change1d, numberLocale) }));
  }
  if (price?.change30d !== null && price?.change30d !== undefined) {
    windows.push(interpolate(t('pd.gold.narrativeWindow30d'), { v: signedPct(price.change30d, numberLocale) }));
  }
  if (price?.change90d !== null && price?.change90d !== undefined) {
    windows.push(interpolate(t('pd.gold.narrativeWindow90d'), { v: signedPct(price.change90d, numberLocale) }));
  }
  const windowsText = windows.reduce((acc, w) =>
    acc === '' ? w : interpolate(t('pd.gold.narrativePriceJoin'), { a: acc, b: w }),
  );
  const priceSentence =
    price !== null && windowsText !== '' && price.asOf !== null
      ? interpolate(t('pd.gold.narrativePriceFact'), {
          windows: windowsText,
          series: price.seriesName ?? '',
          date: locale === 'fa' ? formatJalaliDate(price.asOf, 'fa-IR') : formatDateWords(price.asOf, 'en-US'),
        })
      : null;
  return (
    <section
      id="gold-zone-d"
      aria-labelledby="gold-zone-d-title"
      data-gold-narrative
      className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-3.5"
    >
      <h3 id="gold-zone-d-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {t('pd.gold.narrativeTitle')}
      </h3>

      {/* 1. The price fact — one sentence, no attribution language; the
       * sentence links the Signals chart (s7/03 §2.1 item 5). */}
      {priceSentence !== null ? (
        <p className="m-0">
          <a href="#insights-signals" className="insights-focusable text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-primary)] underline-offset-2 hover:underline">
            <bdi>{priceSentence}</bdi>
          </a>
        </p>
      ) : (
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
          <bdi>{t('pd.gold.narrativePriceMissing')}</bdi>
        </p>
      )}

      {/* 2. The five families — the stacked list (390: family word left,
       * firing state right-aligned; the tally + the movers under). Each
       * line links its lane card (#lane-{lane} — the R10 anchors). */}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {narrative.families.map((family) => (
          <FamilyLine key={family.lane} family={family} numberLocale={numberLocale} t={t} />
        ))}
      </ul>

      {/* 4. The caveat — standing and adjacent (C7 rule 2), in the same
       * visual unit as the families (never paragraphs away). */}
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-narrative-caveat>
        <bdi>{t('pd.gold.narrativeCaveat')}</bdi>
      </p>
    </section>
  );
}

function FamilyLine({
  family,
  numberLocale,
  t,
}: {
  family: NarrativeFamily;
  numberLocale: Locale;
  t: Translate;
}): React.JSX.Element {
  const laneName = t(LANE_TITLE_KEY[family.lane]);
  const stateWord = t(LANE_STATE_KEY[family.side]);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  /* The tally — the SEATS SECTION'S OWN key over the SAME counts
   * (byte-identical rendering: the one-projection rule, s7/03 §2.4). */
  const tally =
    family.firing > 0
      ? interpolate(t('pd.gold.laneTally'), { firing: num(family.firing), readable: num(family.readable) })
      : t('pd.gold.laneTallyNone');
  const moversText =
    family.movers.length > 0
      ? ` — ${family.movers
          .map((m) =>
            interpolate(t('pd.gold.narrativeMover'), {
              name: t(VOTER_NAME_KEY[m.id as keyof typeof VOTER_NAME_KEY]),
              delta: moverDeltaText(m, numberLocale, t),
            }),
          )
          .join('; ')}`
      : '';
  return (
    <li className="flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60" data-narrative-family={family.lane}>
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        {/* The family sentence links its lane card (s7/03 §2.1 item 5) —
         * the link text IS the lane's own name (the name-match rule). */}
        <a href={`#lane-${family.lane}`} className="insights-focusable text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)] underline-offset-2 hover:underline">
          {laneName}
        </a>
        <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{stateWord}</span>
      </div>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>
          {tally}
          {moversText}
        </bdi>
      </p>
    </li>
  );
}

/** A signed percent, e.g. '−2.9%' / '−۲٫۹٪' per locale (the hero's own
 * signedPct discipline; the sign always explicit). */
function signedPct(v: number, numberLocale: Locale): string {
  const digits = formatNumber(Math.abs(v), numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const sign = v >= 0 ? '+' : '−';
  return numberLocale === 'fa-IR' ? `${sign}${digits}٪` : `${sign}${digits}%`;
}
