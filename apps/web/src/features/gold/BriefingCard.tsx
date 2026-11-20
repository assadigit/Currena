/**
 * BriefingCard — the page's single focal element (GUX-S5 M3, 11 §10 /
 * S4-D11): the editorial, typographic outlook-first card. NO instrument,
 * NO gauge, NO dial — the deliberate identity contrast with the brass
 * balance (the conditions composition).
 *
 * The structure (master plan §3.2.1's required briefing format):
 *   kicker → headline (type-verdict — the PRESENT-TENSE conditions
 *   statement, never a forecast) → summary (the Q1 container: the
 *   shipped 7-state outlook line + counts + the not-a-forecast caveat
 *   render inside until the owner answers Q1) → the 2–3 anchored
 *   reasons (the S5-D2 dynamic highlights — each row names the voter's
 *   state and carries its 09 defaultCopy, "why it matters now") →
 *   what-could-change-this (one line, from the existing lane fields) →
 *   the evidence-consistency footer (08 §8.2's words) + the AsOfChip.
 *
 * The owner gates held (S4-D11): the Q1 five-state word renders
 * NOTHING (the shipped 7-state wording keeps its place); the Q2
 * horizon chip and scenario row render NOTHING (no slot content —
 * "the container has the slot; the slot renders nothing today").
 *
 * The focal recipe (11 §3.1): the gold-gradient field + ring-2
 * ring-gold/40 + --shadow-focal — worn by exactly ONE element per
 * page, this card.
 */

import { useI18n } from '../../shared/lib/locale';
import { formatNumber } from '@currena/core';
import type { TranslationKey } from '../../shared/lib/locale';
import type { GoldHeroModel, GoldHeroVerdictState, GoldVoterId } from './gold-tiles';
import { goldHeroCounts } from './gold-tiles';
import { briefingEvidenceOf, briefingNarrowLaneOf, briefingReasonsOf } from './gold-briefing';
import { goldBrief } from './content/gold-content';
import { LANE_BAR_LABEL_KEY } from './LaneBar';
import { AsOfChip } from './AsOfChip';

const HEADLINE_KEY: Readonly<Record<GoldHeroVerdictState, TranslationKey>> = {
  for: 'pd.gold.briefHeadlineFor',
  against: 'pd.gold.briefHeadlineAgainst',
  balanced: 'pd.gold.briefHeadlineMixed',
  none: 'pd.gold.briefHeadlineSparse',
  'not-enough': 'pd.gold.briefHeadlineSparse',
};

const OUTLOOK_WORD_KEY = {
  'strong-bullish': 'pd.global.outlookStrongBullish',
  bullish: 'pd.global.outlookBullish',
  neutral: 'pd.global.outlookNeutral',
  'range-bound': 'pd.global.outlookRangeBound',
  bearish: 'pd.global.outlookBearish',
  'strong-bearish': 'pd.global.outlookStrongBearish',
  mixed: 'pd.global.outlookMixed',
} as const;

const EVIDENCE_KEY: Readonly<Record<'aligned' | 'mixed' | 'limited', TranslationKey>> = {
  aligned: 'pd.gold.briefEvidenceAligned',
  mixed: 'pd.gold.briefEvidenceMixed',
  limited: 'pd.gold.briefEvidenceLimited',
};

const REASON_TONE: Readonly<Record<'supports' | 'pressures', string>> = {
  supports: 'text-[var(--color-status-normal)]',
  pressures: 'text-[var(--color-status-alert)]',
};

const REASON_WORD_KEY: Readonly<Record<'supports' | 'pressures', TranslationKey>> = {
  supports: 'pd.gold.seatSupports',
  pressures: 'pd.gold.seatPressures',
};

export function BriefingCard({
  hero,
  verdictState,
  asOf,
  onOpenRecord,
}: {
  hero: GoldHeroModel;
  /** goldHeroVerdictState(hero) — passed by the caller (the pure helper). */
  verdictState: GoldHeroVerdictState;
  /** The page-level as-of stamp (the AsOfChip's time). */
  asOf?: string;
  /** Opens the record's popover (the M4 wiring; undefined = the row
   *  renders as a plain anchored row — the closed card remains the
   *  canonical presentation either way). */
  onOpenRecord?: (id: GoldVoterId) => void;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const brief = goldBrief(locale);

  const reasons = briefingReasonsOf(hero);
  const narrowLane = briefingNarrowLaneOf(hero);
  const evidence = briefingEvidenceOf(hero);
  const counts = goldHeroCounts(hero);

  const countsParts: string[] = [];
  if (counts.for > 0) countsParts.push(t('pd.gold.heroCountFor', { n: num(counts.for) }));
  if (counts.against > 0) countsParts.push(t('pd.gold.heroCountAgainst', { n: num(counts.against) }));
  if (counts.neutral > 0) countsParts.push(t('pd.gold.heroCountNotLeaning', { n: num(counts.neutral) }));
  if (counts.unread > 0) countsParts.push(t('pd.gold.heroCountUnread', { n: num(counts.unread) }));

  return (
    <article
      data-briefing-card
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.14] via-[var(--color-accent-gold)]/[0.06] to-transparent p-4 ring-2 ring-[var(--color-accent-gold)]/40 shadow-[var(--shadow-focal)] sm:p-5 lg:p-6"
    >
      <header className="flex flex-col gap-1">
        <p className="m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {t('pd.gold.briefKicker')}
        </p>
        {/* The Q2 horizon-chip slot: renders NOTHING until a method is
         * approved (F-02: none exists). */}
        <h2 className="type-verdict m-0 font-bold text-[var(--color-text-primary)]" data-briefing-headline>
          {t(HEADLINE_KEY[verdictState])}
        </h2>
      </header>

      {/* The summary spine — Q1's container: the shipped 7-state line
       * (the same engine, GB-S5) renders inside until the owner
       * decides its fate; the caveat rides it, always. */}
      {hero.outlook !== null ? (
        <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]" data-briefing-summary>
          <span className="font-semibold text-[var(--color-text-primary)]" data-briefing-outlook={hero.outlook}>
            {t(OUTLOOK_WORD_KEY[hero.outlook])}
          </span>
          {countsParts.length > 0 ? <span className="tabular-nums"> · {countsParts.join(' · ')}</span> : null}
          {' '}
          <span className="italic">({t('pd.global.outlookCaveat')})</span>
        </p>
      ) : null}

      {reasons.length > 0 ? (
        <section className="flex flex-col gap-1.5" aria-label={t('pd.gold.briefReasonsTitle')}>
          <h3 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
            {t('pd.gold.briefReasonsTitle')}
          </h3>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {reasons.map((reason) => {
              const record = brief[reason.id];
              const label = record?.plainLabel ?? t(LANE_BAR_LABEL_KEY[reason.lane]);
              const body = record?.defaultCopy ?? '';
              const content = (
                <>
                  <span className={`shrink-0 font-semibold ${REASON_TONE[reason.impact]}`} data-brief-reason-state={reason.impact}>
                    {t(REASON_WORD_KEY[reason.impact])}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-[var(--color-text-primary)]">{label}</span>
                    {body !== '' ? ` — ${body}` : ''}
                  </span>
                </>
              );
              return (
                <li key={reason.id} className="m-0">
                  {onOpenRecord !== undefined ? (
                    <button
                      type="button"
                      data-brief-reason={reason.id}
                      aria-haspopup="dialog"
                      onClick={() => onOpenRecord(reason.id)}
                      className="insights-focusable flex w-full items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2 text-left text-[length:var(--type-label)] leading-relaxed ring-1 ring-[var(--color-border)] min-h-[44px]"
                    >
                      {content}
                    </button>
                  ) : (
                    <p
                      data-brief-reason={reason.id}
                      className="m-0 flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2 text-[length:var(--type-label)] leading-relaxed ring-1 ring-[var(--color-border)]"
                    >
                      {content}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="m-0 text-[length:var(--type-label)] italic leading-relaxed text-[var(--color-text-secondary)]">
        <span className="font-semibold not-italic">{t('pd.gold.briefChangeTitle')}: </span>
        {narrowLane !== null
          ? t('pd.gold.briefChangeNarrow', { lane: t(LANE_BAR_LABEL_KEY[narrowLane]) })
          : t('pd.gold.briefChangeFallback')}
      </p>

      <footer className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-[var(--color-border)] pt-2">
        <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]" data-briefing-evidence={evidence}>
          {t(EVIDENCE_KEY[evidence])}
        </p>
        <AsOfChip asOf={asOf} />
      </footer>
    </article>
  );
}
