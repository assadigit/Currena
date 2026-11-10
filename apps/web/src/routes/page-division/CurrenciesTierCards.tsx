/**
 * CurrenciesTierCards — the /currencies page's two registry sections
 * (page-division S18, 2026-11-12 — spec §12 item 3 + §14's pairs group).
 *
 *   - Where the dollar stands (§12 item 3, D-32): the seven cards —
 *     Currena's own basket, the broad + EME measures, the US–Japan rate
 *     gap, the lira, the dirham, the reserve share.
 *   - The pairs over the decade (§14's `pairs` group, D-18/D-32/D-42):
 *     the seven registry pair cards with 10-year history (the board
 *     above shows this week's rates; these cards show the decade).
 *
 * Every section's heading + one-line intro are the page's own fresh copy.
 * Every card renders the §21 per-page trio — the VALUE (the DISPLAY
 * registry's own decimals + units through currenciesCardValueText,
 * restated lean and pinned output-for-output against
 * `formatReadingValue` by currencies-tiles.test.ts), the 10-YEAR POSITION
 * (the band word, only when percentile10y exists — fail-closed) and the
 * FRESHNESS (the reading's own asOf date + the status word when the
 * reading is not normal). An absent reading (public mode's licence-hidden
 * ids, a failed id) renders the honest unavailable word, never a guess.
 *
 * No gauges, no verdict lines (every Currencies id is context-only per
 * G-5 — the page reads the engine's own readings, never a second
 * scoring; the dollar-strength VERDICT mirrors on the USA page, its
 * detail cards live here per D-30/D-32).
 *
 * Platform: browser only — this module lives in the lazy Currencies
 * route chunk, never the entry graph.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import {
  CURRENCIES_DOLLAR_STANDING_IDS,
  CURRENCIES_PAIRS_IDS,
  currenciesCardValueText,
  currenciesCards,
  type CurrenciesCardEntry,
  type CurrenciesCardId,
  type CurrenciesUnitLabels,
} from './currencies-tiles';

/* ------------------------------------------------------------------ *
 * The copy maps — TOTAL against currencies-tiles' own lists (a missing
 * key is a typecheck error, never a runtime undefined).
 * ------------------------------------------------------------------ */

/** The card-name keys — 14 literal keys (the copy-pin test proves each
 *  matches the insights corpus byte-for-byte, both locales). */
const CARD_NAME_KEY: Readonly<Record<CurrenciesCardId, TranslationKey>> = {
  'dollar-basket': 'pd.currencies.cardNames.dollar-basket',
  'dollar-broad': 'pd.currencies.cardNames.dollar-broad',
  'dollar-eme': 'pd.currencies.cardNames.dollar-eme',
  'us-japan-10y-gap': 'pd.currencies.cardNames.us-japan-10y-gap',
  usdtry: 'pd.currencies.cardNames.usdtry',
  usdaed: 'pd.currencies.cardNames.usdaed',
  'usd-reserve-share': 'pd.currencies.cardNames.usd-reserve-share',
  usdjpy: 'pd.currencies.cardNames.usdjpy',
  'eur-usd': 'pd.currencies.cardNames.eur-usd',
  usdchf: 'pd.currencies.cardNames.usdchf',
  usdcny: 'pd.currencies.cardNames.usdcny',
  audusd: 'pd.currencies.cardNames.audusd',
  audjpy: 'pd.currencies.cardNames.audjpy',
  audnzd: 'pd.currencies.cardNames.audnzd',
};

/** The position word keys (the corpus's own, pinned). */
const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.currencies.positionLow',
  typical: 'pd.currencies.positionTypical',
  high: 'pd.currencies.positionHigh',
};

/** The status word keys (the corpus's own, pinned; 'context' has no key —
 *  a context reading is normal for a context-only id and speaks nothing). */
const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.currencies.statusWarning',
  stale: 'pd.currencies.statusStale',
  'check-pending': 'pd.currencies.statusCheckPending',
  unavailable: 'pd.currencies.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One Currencies card — the §21 trio (value · 10-year position · freshness)
 * ------------------------------------------------------------------ */

function CurrenciesCard({ entry, units }: { entry: CurrenciesCardEntry; units: CurrenciesUnitLabels }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);

  // The VALUE — the DISPLAY registry's own join (currenciesCardValueText).
  const valueText = currenciesCardValueText(entry.id, reading, numberLocale, units);

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.currencies.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.currencies.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.currencies.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.currencies.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the UsaTierCards / CommoditiesCard pattern).
  const statusKey = reading !== undefined ? STATUS_KEY[reading.status] : undefined;
  const statusWord = statusKey !== undefined ? t(statusKey) : null;
  const asOfText =
    reading !== undefined && reading.asOf !== null
      ? locale === 'fa'
        ? formatJalaliDate(reading.asOf, 'fa-IR')
        : formatDateWords(reading.asOf, 'en-US')
      : null;

  return (
    <article
      id={`currencies-card-${entry.id}`}
      data-currencies-card={entry.id}
      data-currencies-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueText !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-currencies-value>
          {valueText}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.currencies.valueUnavailable')}</p>
      )}
      {positionLine !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)]">
          <bdi>{positionLine}</bdi>
        </p>
      ) : null}
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[length:var(--type-caption)] leading-tight text-[var(--color-text-tertiary)]">
        {asOfText !== null ? (
          <bdi>{interpolate(t('pd.global.dataAsOf'), { date: asOfText })}</bdi>
        ) : null}
        {statusWord !== null ? <span data-currencies-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * One registry section — the page's own heading + intro + the cards.
 * ------------------------------------------------------------------ */

function CurrenciesGroupSection({
  sectionKey,
  ids,
  readings,
  units,
}: {
  sectionKey: 'dollar-standing' | 'pairs';
  ids: readonly IndicatorId[];
  readings: readonly IndicatorReading[];
  units: CurrenciesUnitLabels;
}): React.JSX.Element {
  const { t } = useI18n();
  const entries = currenciesCards(readings, ids);
  const keys =
    sectionKey === 'dollar-standing'
      ? { title: 'pd.currencies.dollarStandingTitle' as TranslationKey, intro: 'pd.currencies.dollarStandingIntro' as TranslationKey }
      : { title: 'pd.currencies.pairsTitle' as TranslationKey, intro: 'pd.currencies.pairsIntro' as TranslationKey };
  return (
    <section aria-label={t(keys.title)} data-currencies-section={sectionKey} className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(keys.title)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t(keys.intro)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <CurrenciesCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
    </section>
  );
}

export function CurrenciesTierCards({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t } = useI18n();
  // The corpus-pinned unit labels, assembled once for the render pass
  // (the copy-pin test proves each word matches the corpus byte-for-byte).
  const units: CurrenciesUnitLabels = {
    percent: t('pd.currencies.units.percent'),
    points: t('pd.currencies.units.points'),
    index: t('pd.currencies.units.index'),
    try: t('pd.currencies.units.try'),
    aed: t('pd.currencies.units.aed'),
    jpy: t('pd.currencies.units.jpy'),
    eur: t('pd.currencies.units.eur'),
    chf: t('pd.currencies.units.chf'),
    cny: t('pd.currencies.units.cny'),
    usd: t('pd.currencies.units.usd'),
    nzd: t('pd.currencies.units.nzd'),
  };
  return (
    <>
      <CurrenciesGroupSection sectionKey="dollar-standing" ids={CURRENCIES_DOLLAR_STANDING_IDS} readings={readings} units={units} />
      <CurrenciesGroupSection sectionKey="pairs" ids={CURRENCIES_PAIRS_IDS} readings={readings} units={units} />
    </>
  );
}
