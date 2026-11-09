/**
 * AustraliaTierCards — the Australia page's five gauge sections + the
 * world-risk group (page-division S16, 2026-11-10 — spec §10 item 2;
 * D-37: the unchanged 3-voting + 2-shadow structure, minus the ids that
 * moved out, plus gpr-australia).
 *
 *   - Inflation & rates (§10 item 2, VOTING): the six cards.
 *   - Households (§10 item 2, VOTING): the eleven cards.
 *   - Trade & currency (§10 item 2, VOTING): rba-fed-gap · terms-of-trade
 *     + the 8 moved-out seat chips (audusd · audjpy · gold-aud · iron-ore
 *     · coal-aus · lng-japan · china-property-investment ·
 *     china-steel-output).
 *   - Trade & partners (§10 item 2, SHADOW — G-5): au-trade-balance + the
 *     3 moved-out seat chips (audnzd · nz-short-rate · nz-10y).
 *   - Activity (§10 item 2, SHADOW — G-5): the seven cards.
 *   - World risk (§10 item 2's "plus gpr-australia"; AF-4): the one card.
 *
 * Every section's heading + one-line intro are the corpus's own gauge
 * QUESTION + ANSWER (pinned byte-for-byte by australia-copy-pin.test.ts),
 * and every voting gauge states the engine's own verdict line — the step
 * word + the "{warnings} of {voting}" count — re-derived through the SAME
 * pure gaugeReading the legacy /insights AU section reads (never a second
 * arithmetic, D-48). A SHADOW gauge (G-5) never claims a verdict: its
 * header reads the honest "not scored yet" + context-count words.
 *
 * Every card renders the §21 per-page trio — the VALUE (the DISPLAY
 * registry's own decimals + units through australiaCardValueText, restated
 * lean and pinned output-for-output against `formatReadingValue` by
 * australia-tiles.test.ts — including the AU money joins 'A$97.6bn' EN /
 * '۹۷٫۶ میلیارد دلار استرالیا' fa), the 10-YEAR POSITION (the band word,
 * only when percentile10y exists — fail-closed) and the FRESHNESS (the
 * reading's own asOf date + the status word when the reading is not
 * normal). An absent reading (public mode's licence-hidden ids, a failed
 * id) renders the honest unavailable word, never a guess.
 *
 * The moved-out seat chips (§10 "Moved out"): the members these gauges
 * lost to the other pages, each a REAL link to its new home (the
 * placement's own homePageOfIndicator — the S5 seat-chip discipline),
 * never a value card (their readings live on their home pages now).
 *
 * Platform: browser only — this module lives in the lazy Australia route
 * chunk, never the entry graph.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import type { TranslationKey } from '../../lib/locale';
import {
  AUSTRALIA_INFLATION_RATES_IDS,
  AUSTRALIA_HOUSEHOLDS_IDS,
  AUSTRALIA_TRADE_CURRENCY_IDS,
  AUSTRALIA_EXTERNAL_IDS,
  AUSTRALIA_ACTIVITY_IDS,
  AUSTRALIA_WORLD_RISK_IDS,
  AUSTRALIA_SEAT_IDS,
  australiaCardValueText,
  australiaCards,
  australiaGaugeVerdicts,
  australiaSeatHref,
  type AustraliaCardEntry,
  type AustraliaCardId,
  type AustraliaGaugeId,
  type AustraliaGaugeVerdict,
  type AustraliaUnitLabels,
} from './australia-tiles';

/* ------------------------------------------------------------------ *
 * The copy maps — TOTAL against australia-tiles' own lists (a missing
 * key is a typecheck error, never a runtime undefined).
 * ------------------------------------------------------------------ */

/** The card-name keys — 28 literal keys (the copy-pin test proves each
 *  matches the insights corpus byte-for-byte, both locales). */
const CARD_NAME_KEY: Readonly<Record<AustraliaCardId, TranslationKey>> = {
  'au-cpi': 'pd.australia.cardNames.au-cpi',
  'au-trimmed-mean': 'pd.australia.cardNames.au-trimmed-mean',
  'rba-expectations': 'pd.australia.cardNames.rba-expectations',
  'au-10y': 'pd.australia.cardNames.au-10y',
  'au-us-10y-gap': 'pd.australia.cardNames.au-us-10y-gap',
  'au-petrol-yoy': 'pd.australia.cardNames.au-petrol-yoy',
  'au-home-loan': 'pd.australia.cardNames.au-home-loan',
  'au-wage-growth': 'pd.australia.cardNames.au-wage-growth',
  'au-rent-yoy': 'pd.australia.cardNames.au-rent-yoy',
  'au-household-debt-arrears': 'pd.australia.cardNames.au-household-debt-arrears',
  'au-unemployment': 'pd.australia.cardNames.au-unemployment',
  'au-home-values': 'pd.australia.cardNames.au-home-values',
  'au-housing-finance': 'pd.australia.cardNames.au-housing-finance',
  'rba-cash-rate': 'pd.australia.cardNames.rba-cash-rate',
  'au-deposit-rate': 'pd.australia.cardNames.au-deposit-rate',
  'au-saving-ratio': 'pd.australia.cardNames.au-saving-ratio',
  'au-job-vacancies': 'pd.australia.cardNames.au-job-vacancies',
  'terms-of-trade': 'pd.australia.cardNames.terms-of-trade',
  'rba-fed-gap': 'pd.australia.cardNames.rba-fed-gap',
  'au-trade-balance': 'pd.australia.cardNames.au-trade-balance',
  'au-gdp-growth': 'pd.australia.cardNames.au-gdp-growth',
  'au-household-spending': 'pd.australia.cardNames.au-household-spending',
  'au-building-approvals': 'pd.australia.cardNames.au-building-approvals',
  'au-population-growth': 'pd.australia.cardNames.au-population-growth',
  'au-nom': 'pd.australia.cardNames.au-nom',
  'au-participation': 'pd.australia.cardNames.au-participation',
  'au-underemployment': 'pd.australia.cardNames.au-underemployment',
  'gpr-australia': 'pd.australia.cardNames.gpr-australia',
};

/** The seat-name keys — the 11 moved-out ids (the copy-pin test proves
 *  each matches the corpus byte-for-byte, both locales). */
const SEAT_NAME_KEY: Readonly<Record<string, TranslationKey>> = {
  audusd: 'pd.australia.seatNames.audusd',
  audjpy: 'pd.australia.seatNames.audjpy',
  audnzd: 'pd.australia.seatNames.audnzd',
  'nz-short-rate': 'pd.australia.seatNames.nz-short-rate',
  'nz-10y': 'pd.australia.seatNames.nz-10y',
  'china-property-investment': 'pd.australia.seatNames.china-property-investment',
  'china-steel-output': 'pd.australia.seatNames.china-steel-output',
  'iron-ore': 'pd.australia.seatNames.iron-ore',
  'coal-aus': 'pd.australia.seatNames.coal-aus',
  'lng-japan': 'pd.australia.seatNames.lng-japan',
  'gold-aud': 'pd.australia.seatNames.gold-aud',
};

/** A seat chip's link-text key — by the chip's placement home (the S16
 *  moved-out map: the three pair chips → /currencies, the four Asia
 *  chips → /asia-pacific, the three commodity chips → /commodities, the
 *  gold chip → /gold). */
const SEAT_LINK_KEY: Readonly<Record<string, TranslationKey>> = {
  currencies: 'pd.australia.movedOut.seePairs',
  'asia-pacific': 'pd.australia.movedOut.seeAsia',
  commodities: 'pd.australia.movedOut.seeCommodities',
  gold: 'pd.australia.movedOut.seeGold',
};

/** The gauge question + answer keys (the corpus's own, pinned — TOTAL
 *  over the five AU gauge ids). */
const GAUGE_KEY: Readonly<Record<AustraliaGaugeId, { question: TranslationKey; answer: TranslationKey }>> = {
  'au-inflation-rates': { question: 'pd.australia.gauges.au-inflation-rates.question', answer: 'pd.australia.gauges.au-inflation-rates.answer' },
  'au-households': { question: 'pd.australia.gauges.au-households.question', answer: 'pd.australia.gauges.au-households.answer' },
  'au-trade-currency': { question: 'pd.australia.gauges.au-trade-currency.question', answer: 'pd.australia.gauges.au-trade-currency.answer' },
  'au-external': { question: 'pd.australia.gauges.au-external.question', answer: 'pd.australia.gauges.au-external.answer' },
  'au-activity': { question: 'pd.australia.gauges.au-activity.question', answer: 'pd.australia.gauges.au-activity.answer' },
};

/** The verdict word keys (the corpus's own, pinned). */
const VERDICT_WORD_KEY: Readonly<Record<'relaxed' | 'cautious' | 'stressed' | 'alarmed', TranslationKey>> = {
  relaxed: 'pd.australia.verdictWords.relaxed',
  cautious: 'pd.australia.verdictWords.cautious',
  stressed: 'pd.australia.verdictWords.stressed',
  alarmed: 'pd.australia.verdictWords.alarmed',
};

/** The position word keys (the corpus's own, pinned). */
const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.australia.positionLow',
  typical: 'pd.australia.positionTypical',
  high: 'pd.australia.positionHigh',
};

/** The status word keys (the corpus's own, pinned; 'context' has no key —
 *  a context reading is normal for a context-only id and speaks nothing). */
const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.australia.statusWarning',
  stale: 'pd.australia.statusStale',
  'check-pending': 'pd.australia.statusCheckPending',
  unavailable: 'pd.australia.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One Australia card
 * ------------------------------------------------------------------ */

function AustraliaCard({ entry, units }: { entry: AustraliaCardEntry; units: AustraliaUnitLabels }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);

  // The VALUE — the DISPLAY registry's own join (australiaCardValueText).
  const valueText = australiaCardValueText(entry.id, reading, numberLocale, units);

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  // The band word follows the legacy collapsed-line's OWN convention
  // (high → top {100−p}% · low → bottom {p}% · else the middle).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.australia.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.australia.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.australia.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.australia.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the UsaTierCards / GoldContext / AsiaCard
  // pattern).
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
      id={`australia-card-${entry.id}`}
      data-australia-card={entry.id}
      data-australia-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueText !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-australia-value>
          {valueText}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.australia.valueUnavailable')}</p>
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
        {statusWord !== null ? <span data-australia-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * One moved-out seat chip — a REAL link to the member's new home
 * (§10 "Moved out": their seat chips remain in the AU gauges and link
 * to the new homes; the readings live there now, never a value card).
 * ------------------------------------------------------------------ */

function AustraliaSeatChip({ id }: { id: IndicatorId }): React.JSX.Element | null {
  const { t } = useI18n();
  const nameKey = SEAT_NAME_KEY[id as string];
  const href = australiaSeatHref(id);
  // Fail-closed: an id with no name key or no placement home renders no
  // chip (never a dead anchor, never a guess).
  if (nameKey === undefined || href === null) return null;
  const homePage = href === '/' ? 'global' : href.startsWith('/') ? href.slice(1) : href;
  const linkKey = SEAT_LINK_KEY[homePage];
  if (linkKey === undefined) return null;
  const name = t(nameKey);
  const linkText = t(linkKey);
  return (
    <li className="min-w-[156px] flex-1">
      <a
        href={href}
        data-australia-seat={id}
        data-australia-seat-home={homePage}
        aria-label={`${name}. ${linkText}`}
        title={linkText}
        onClick={(e) => {
          e.preventDefault();
          navigate(href);
        }}
        className="insights-focusable flex min-h-[44px] cursor-pointer flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 no-underline ring-1 ring-[var(--color-border)] motion-safe:transition-shadow hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
      >
        <span className="text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</span>
        <span className="text-[length:var(--type-caption)] font-semibold leading-tight text-currena-blue">{linkText}</span>
      </a>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * One gauge section — the corpus's own question + answer, the engine's
 * own verdict line (voting) or the honest not-scored words (shadow),
 * the member cards, and the moved-out seat chips.
 * ------------------------------------------------------------------ */

function AustraliaGaugeSection({
  gauge,
  ids,
  readings,
  units,
  dataSection,
}: {
  gauge: AustraliaGaugeVerdict;
  ids: readonly AustraliaCardId[];
  readings: readonly IndicatorReading[];
  units: AustraliaUnitLabels;
  dataSection: string;
}): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const entries = australiaCards(readings, ids);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  // The verdict line — the engine's own words (the legacy QuestionGroup
  // header, restated lean): a voting gauge states its step word + the
  // "{warnings} of {voting}" count; a shadow gauge (G-5) never claims a
  // verdict and reads the "not scored yet" + context-count words (the
  // count reads the gauge's full membership — the homes + the moved-out
  // seats, whose mirror readings the projection carries, exactly the
  // readings /insights counts). The stale badge speaks only when the
  // gauge carries stale members.
  const seats = AUSTRALIA_SEAT_IDS[gauge.gauge];
  const memberIds = new Set<string>([...ids, ...seats] as readonly string[]);
  const verdictWord =
    gauge.word !== null
      ? t(VERDICT_WORD_KEY[gauge.word])
      : gauge.shadow
        ? t('pd.australia.gaugeNotScored')
        : t('pd.australia.gaugeNoReading');
  const countLine = gauge.shadow
    ? interpolate(t('pd.australia.gaugeContextCount'), {
        n: num(readings.filter((r) => r.status === 'context' && memberIds.has(r.id as string)).length),
      })
    : interpolate(t('pd.australia.inAlert'), {
        warnings: num(gauge.reading.warningCount),
        voting: num(gauge.reading.votingCount),
      });

  return (
    <section aria-label={t(GAUGE_KEY[gauge.gauge].question)} data-australia-section={dataSection} data-australia-shadow={gauge.shadow ? 'true' : undefined} className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(GAUGE_KEY[gauge.gauge].question)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t(GAUGE_KEY[gauge.gauge].answer)}</p>
        <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5" data-australia-gauge-verdict={gauge.gauge}>
          <span
            className={`text-[length:var(--type-caption)] font-bold ${
              gauge.word === null
                ? 'text-[var(--color-text-tertiary)]'
                : gauge.word === 'relaxed'
                  ? 'text-[var(--color-status-calm)]'
                  : gauge.word === 'cautious'
                    ? 'text-[var(--color-status-watch)]'
                    : 'text-[var(--color-status-alert)]'
            }`}
            data-australia-verdict-word
          >
            {verdictWord}
          </span>
          <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]" data-australia-gauge-count>
            {countLine}
          </bdi>
          {gauge.reading.staleCount > 0 ? (
            <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]" data-australia-gauge-stale>
              {interpolate(t('pd.australia.staleReadingsBadge'), { n: num(gauge.reading.staleCount), total: num(gauge.reading.votingCount + gauge.reading.staleCount) })}
            </bdi>
          ) : null}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <AustraliaCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
      {seats.length > 0 ? (
        <div className="mt-2" data-australia-moved-out={gauge.gauge}>
          <p className="m-0 mb-1.5 text-[length:var(--type-caption)] font-semibold leading-snug text-[var(--color-text-tertiary)]">{t('pd.australia.movedOut.label')}</p>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {seats.map((id) => (
              <AustraliaSeatChip key={id} id={id} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The world-risk group (§10 item 2's "plus gpr-australia" — AF-4: a
 * GLOBAL-section registry id whose page home is Australia).
 * ------------------------------------------------------------------ */

function AustraliaWorldRiskSection({
  ids,
  readings,
  units,
}: {
  ids: readonly AustraliaCardId[];
  readings: readonly IndicatorReading[];
  units: AustraliaUnitLabels;
}): React.JSX.Element {
  const { t } = useI18n();
  const entries = australiaCards(readings, ids);
  return (
    <section aria-label={t('pd.australia.worldRisk.title')} data-australia-section="world-risk" className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.australia.worldRisk.title')}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t('pd.australia.worldRisk.intro')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <AustraliaCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
    </section>
  );
}

export function AustraliaTierCards({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t } = useI18n();
  // The engine's own gauge verdicts over the projection (the SAME pure
  // gaugeReading the legacy AU section reads — the 5 mirrors included, so
  // the verdict words can never disagree with the engine's).
  const verdicts = australiaGaugeVerdicts(readings);
  const verdictOf = (gauge: string): AustraliaGaugeVerdict =>
    verdicts.find((v) => v.gauge === gauge) ?? {
      gauge: 'au-inflation-rates',
      reading: { gauge: 'au-inflation-rates', section: 'australia', step: 0, votingCount: 0, warningCount: 0, staleCount: 0 },
      word: null,
      shadow: false,
    };
  // The corpus-pinned unit labels, assembled once for the render pass
  // (the copy-pin test proves each word matches the corpus byte-for-byte).
  const units: AustraliaUnitLabels = {
    percent: t('pd.australia.units.percent'),
    points: t('pd.australia.units.points'),
    index: t('pd.australia.units.index'),
    aud: t('pd.australia.units.aud'),
    'aud-bn': t('pd.australia.units.audBn'),
    'aud-m': t('pd.australia.units.audM'),
    vacancies: t('pd.australia.units.vacancies'),
    dwellings: t('pd.australia.units.dwellings'),
    'persons-k': t('pd.australia.units.personsK'),
  };
  return (
    <>
      <AustraliaGaugeSection
        gauge={verdictOf('au-inflation-rates')}
        ids={AUSTRALIA_INFLATION_RATES_IDS as readonly AustraliaCardId[]}
        readings={readings}
        units={units}
        dataSection="inflation-rates"
      />
      <AustraliaGaugeSection
        gauge={verdictOf('au-households')}
        ids={AUSTRALIA_HOUSEHOLDS_IDS as readonly AustraliaCardId[]}
        readings={readings}
        units={units}
        dataSection="households"
      />
      <AustraliaGaugeSection
        gauge={verdictOf('au-trade-currency')}
        ids={AUSTRALIA_TRADE_CURRENCY_IDS as readonly AustraliaCardId[]}
        readings={readings}
        units={units}
        dataSection="trade-currency"
      />
      <AustraliaGaugeSection
        gauge={verdictOf('au-external')}
        ids={AUSTRALIA_EXTERNAL_IDS as readonly AustraliaCardId[]}
        readings={readings}
        units={units}
        dataSection="external"
      />
      <AustraliaGaugeSection
        gauge={verdictOf('au-activity')}
        ids={AUSTRALIA_ACTIVITY_IDS as readonly AustraliaCardId[]}
        readings={readings}
        units={units}
        dataSection="activity"
      />
      <AustraliaWorldRiskSection ids={AUSTRALIA_WORLD_RISK_IDS as readonly AustraliaCardId[]} readings={readings} units={units} />
    </>
  );
}
