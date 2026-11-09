/**
 * EuropeTierCards — the Europe page's two sections (page-division S12,
 * 2026-11-09 — spec §8 items 1–2; D-33: EU members listed apart from the
 * non-EU United Kingdom).
 *
 *   - EU section (§8 item 1): ecb-dfr · euro-hicp · euro-aaa-10y ·
 *     bund-10y · btp-bund-spread · oecd-cli-de.
 *   - Non-EU section — United Kingdom (§8 item 2): gilt-10y · boe-rate.
 *     FTSE rides the markets board (the Europe zoom map).
 *
 * Every card renders the §21 per-page trio — the VALUE (the DISPLAY
 * registry's own decimals + units through europeCardValueText, restated
 * lean and pinned output-for-output against `formatReadingValue` by
 * europe-tiles.test.ts), the 10-YEAR POSITION (the band word, only when
 * percentile10y exists — fail-closed) and the FRESHNESS (the reading's
 * own asOf date + the status word when the reading is not normal) — the
 * UsaTierCards / GoldContext / WorldRiskCards pattern. An absent reading
 * (public mode's licence-hidden ids, a failed id) renders the honest
 * unavailable word, never a guess.
 *
 * Platform: browser only — this module lives in the lazy Europe route
 * chunk, never the entry graph.
 */

import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import {
  EUROPE_EU_IDS,
  EUROPE_UK_IDS,
  europeCardValueText,
  europeCards,
  type EuropeCardEntry,
  type EuropeCardId,
  type EuropeUnitLabels,
} from './europe-tiles';

/** The section id lists, typed against europe-tiles' own (never re-derived
 *  here — the section wiring rides the pure module's single source). */
const EU_ENTRY_IDS: readonly EuropeCardId[] = EUROPE_EU_IDS as readonly EuropeCardId[];
const UK_ENTRY_IDS: readonly EuropeCardId[] = EUROPE_UK_IDS as readonly EuropeCardId[];

/** The card-name keys — 8 literal keys (the copy-pin test proves each
 *  matches the insights corpus byte-for-byte, both locales). */
const CARD_NAME_KEY: Readonly<Record<EuropeCardId, TranslationKey>> = {
  'ecb-dfr': 'pd.europe.cardNames.ecb-dfr',
  'euro-hicp': 'pd.europe.cardNames.euro-hicp',
  'euro-aaa-10y': 'pd.europe.cardNames.euro-aaa-10y',
  'bund-10y': 'pd.europe.cardNames.bund-10y',
  'btp-bund-spread': 'pd.europe.cardNames.btp-bund-spread',
  'oecd-cli-de': 'pd.europe.cardNames.oecd-cli-de',
  'gilt-10y': 'pd.europe.cardNames.gilt-10y',
  'boe-rate': 'pd.europe.cardNames.boe-rate',
};

/** The position word keys (the corpus's own, pinned). */
const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.europe.positionLow',
  typical: 'pd.europe.positionTypical',
  high: 'pd.europe.positionHigh',
};

/** The status word keys (the corpus's own, pinned; 'context' has no key —
 *  a context reading is normal for a context-only id and speaks nothing). */
const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.europe.statusWarning',
  stale: 'pd.europe.statusStale',
  'check-pending': 'pd.europe.statusCheckPending',
  unavailable: 'pd.europe.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One Europe card
 * ------------------------------------------------------------------ */

function EuropeCard({ entry, units }: { entry: EuropeCardEntry; units: EuropeUnitLabels }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);

  // The VALUE — the DISPLAY registry's own join (europeCardValueText).
  const valueText = europeCardValueText(entry.id, reading, numberLocale, units);

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  // The band word follows the legacy collapsed-line's OWN convention
  // (high → top {100−p}% · low → bottom {p}% · else the middle).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.europe.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.europe.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.europe.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.europe.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the UsaTierCards / GoldContext pattern).
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
      id={`europe-card-${entry.id}`}
      data-europe-card={entry.id}
      data-europe-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueText !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-europe-value>
          {valueText}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.europe.valueUnavailable')}</p>
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
        {statusWord !== null ? <span data-europe-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * One Europe section
 * ------------------------------------------------------------------ */

function EuropeSection({
  titleKey,
  introKey,
  ids,
  readings,
  units,
  dataSection,
}: {
  titleKey: TranslationKey;
  introKey: TranslationKey;
  ids: readonly EuropeCardId[];
  readings: readonly IndicatorReading[];
  units: EuropeUnitLabels;
  dataSection: string;
}): React.JSX.Element {
  const { t } = useI18n();
  const entries = europeCards(readings, ids);
  return (
    <section aria-label={t(titleKey)} data-europe-section={dataSection} className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(titleKey)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t(introKey)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <EuropeCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
    </section>
  );
}

export function EuropeTierCards({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t } = useI18n();
  // The corpus-pinned unit labels, assembled once for the render pass
  // (the copy-pin test proves each word matches the corpus byte-for-byte).
  const units: EuropeUnitLabels = {
    percent: t('pd.europe.unitPercent'),
    points: t('pd.europe.unitPoints'),
    index: t('pd.europe.unitIndex'),
  };
  return (
    <>
      <EuropeSection
        titleKey="pd.europe.eu.title"
        introKey="pd.europe.eu.intro"
        ids={EU_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="eu"
      />
      <EuropeSection
        titleKey="pd.europe.uk.title"
        introKey="pd.europe.uk.intro"
        ids={UK_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="uk"
      />
    </>
  );
}
