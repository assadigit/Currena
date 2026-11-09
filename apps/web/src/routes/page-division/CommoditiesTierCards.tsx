/**
 * CommoditiesTierCards — the Commodities page's four commodity groups +
 * the supply group (page-division S17, 2026-11-11 — spec §11; D-38/D-39).
 *
 *   - Energy (§11, D-38): the nine cards — oil, gas, LNG, coal, crude
 *     stocks, the SPR, US production.
 *   - Metals (§11, D-19/D-27/D-38): the four price cards — silver,
 *     platinum, copper, iron ore + the gold cross-link to /gold (the
 *     gold ratios stay on the Gold page, D-27).
 *   - Agriculture (§11, D-2/D-38): the three cards — the food index,
 *     wheat, maize.
 *   - Digital (§11, D-28/D-38/D-40): the two cards — Bitcoin, the Crypto
 *     Fear & Greed index.
 *   - Trade routes & supply (§11, D-39): the six cards — the five
 *     chokepoints + the GSCPI.
 *
 * Every section's heading + one-line intro are the page's own fresh copy
 * (the §11 group purpose, condensed). Every card renders the §21
 * per-page trio — the VALUE (the DISPLAY registry's own decimals + units
 * through commoditiesCardValueText, restated lean and pinned
 * output-for-output against `formatReadingValue` by
 * commodities-tiles.test.ts), the 10-YEAR POSITION (the band word, only
 * when percentile10y exists — fail-closed) and the FRESHNESS (the
 * reading's own asOf date + the status word when the reading is not
 * normal). An absent reading (public mode's licence-hidden ids, a failed
 * id) renders the honest unavailable word, never a guess.
 *
 * No gauges, no verdict lines, no seat chips (every commodity id is
 * context-only per G-5 — the page reads the engine's own readings, never
 * a second scoring).
 *
 * Platform: browser only — this module lives in the lazy Commodities route
 * chunk, never the entry graph.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import type { TranslationKey } from '../../lib/locale';
import {
  COMMODITIES_ENERGY_IDS,
  COMMODITIES_METALS_IDS,
  COMMODITIES_AGRICULTURE_IDS,
  COMMODITIES_DIGITAL_IDS,
  COMMODITIES_TRADE_ROUTES_IDS,
  COMMODITIES_GOLD_HREF,
  commoditiesCardValueText,
  commoditiesCards,
  type CommoditiesCardEntry,
  type CommoditiesCardId,
  type CommoditiesUnitLabels,
} from './commodities-tiles';

/* ------------------------------------------------------------------ *
 * The copy maps — TOTAL against commodities-tiles' own lists (a missing
 * key is a typecheck error, never a runtime undefined).
 * ------------------------------------------------------------------ */

/** The card-name keys — 24 literal keys (the copy-pin test proves each
 *  matches the insights corpus byte-for-byte, both locales). */
const CARD_NAME_KEY: Readonly<Record<CommoditiesCardId, TranslationKey>> = {
  brent: 'pd.commodities.cardNames.brent',
  wti: 'pd.commodities.cardNames.wti',
  natgas: 'pd.commodities.cardNames.natgas',
  'gas-europe': 'pd.commodities.cardNames.gas-europe',
  'lng-japan': 'pd.commodities.cardNames.lng-japan',
  'coal-aus': 'pd.commodities.cardNames.coal-aus',
  'eia-crude-stocks': 'pd.commodities.cardNames.eia-crude-stocks',
  'us-spr': 'pd.commodities.cardNames.us-spr',
  'us-crude-production': 'pd.commodities.cardNames.us-crude-production',
  'silver-usd': 'pd.commodities.cardNames.silver-usd',
  platinum: 'pd.commodities.cardNames.platinum',
  'copper-usd': 'pd.commodities.cardNames.copper-usd',
  'iron-ore': 'pd.commodities.cardNames.iron-ore',
  'food-index': 'pd.commodities.cardNames.food-index',
  wheat: 'pd.commodities.cardNames.wheat',
  maize: 'pd.commodities.cardNames.maize',
  'btc-usd': 'pd.commodities.cardNames.btc-usd',
  'crypto-fng': 'pd.commodities.cardNames.crypto-fng',
  'chokepoint-suez': 'pd.commodities.cardNames.chokepoint-suez',
  'chokepoint-panama': 'pd.commodities.cardNames.chokepoint-panama',
  'chokepoint-bab-el-mandeb': 'pd.commodities.cardNames.chokepoint-bab-el-mandeb',
  'chokepoint-malacca': 'pd.commodities.cardNames.chokepoint-malacca',
  'chokepoint-taiwan': 'pd.commodities.cardNames.chokepoint-taiwan',
  gscpi: 'pd.commodities.cardNames.gscpi',
};

/** The group heading + intro keys (the page's own fresh copy — 5 groups). */
const GROUP_KEY: Readonly<Record<string, { title: TranslationKey; intro: TranslationKey }>> = {
  energy: { title: 'pd.commodities.groups.energy.title', intro: 'pd.commodities.groups.energy.intro' },
  metals: { title: 'pd.commodities.groups.metals.title', intro: 'pd.commodities.groups.metals.intro' },
  agriculture: { title: 'pd.commodities.groups.agriculture.title', intro: 'pd.commodities.groups.agriculture.intro' },
  digital: { title: 'pd.commodities.groups.digital.title', intro: 'pd.commodities.groups.digital.intro' },
  'trade-routes-supply': { title: 'pd.commodities.groups.trade-routes-supply.title', intro: 'pd.commodities.groups.trade-routes-supply.intro' },
};

/** The position word keys (the corpus's own, pinned). */
const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.commodities.positionLow',
  typical: 'pd.commodities.positionTypical',
  high: 'pd.commodities.positionHigh',
};

/** The status word keys (the corpus's own, pinned; 'context' has no key —
 *  a context reading is normal for a context-only id and speaks nothing). */
const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.commodities.statusWarning',
  stale: 'pd.commodities.statusStale',
  'check-pending': 'pd.commodities.statusCheckPending',
  unavailable: 'pd.commodities.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One Commodities card — the §21 trio (value · 10-year position · freshness)
 * ------------------------------------------------------------------ */

function CommoditiesCard({ entry, units }: { entry: CommoditiesCardEntry; units: CommoditiesUnitLabels }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);

  // The VALUE — the DISPLAY registry's own join (commoditiesCardValueText).
  const valueText = commoditiesCardValueText(entry.id, reading, numberLocale, units);

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  // The band word follows the legacy collapsed-line's OWN convention
  // (high → top {100−p}% · low → bottom {p}% · else the middle).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.commodities.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.commodities.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.commodities.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.commodities.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the UsaTierCards / AustraliaCard pattern).
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
      id={`commodities-card-${entry.id}`}
      data-commodities-card={entry.id}
      data-commodities-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueText !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-commodities-value>
          {valueText}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.commodities.valueUnavailable')}</p>
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
        {statusWord !== null ? <span data-commodities-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The gold cross-link chip (§11 "Cross-links", D-19/D-27): gold and its
 * ratios live on /gold — the ONE commodity exception. The metals group
 * carries a single cross-link chip to /gold.
 * ------------------------------------------------------------------ */

function GoldCrossLink(): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div className="mt-2" data-commodities-gold-cross-link>
      <a
        href={COMMODITIES_GOLD_HREF}
        aria-label={`${t('pd.commodities.goldCrossLink.label')}. ${t('pd.commodities.goldCrossLink.text')}`}
        title={t('pd.commodities.goldCrossLink.label')}
        onClick={(e) => {
          e.preventDefault();
          navigate(COMMODITIES_GOLD_HREF);
        }}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-3 py-2 no-underline ring-1 ring-[var(--color-border)] motion-safe:transition-shadow hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)] sm:w-fit"
      >
        <span className="text-[length:var(--type-label)] font-semibold leading-tight text-[var(--color-text-secondary)]">{t('pd.commodities.goldCrossLink.label')}</span>
        <span className="text-[length:var(--type-caption)] font-bold leading-tight text-currena-blue">{t('pd.commodities.goldCrossLink.text')}</span>
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One group section — the page's own heading + intro, the member cards,
 * and (the metals group only) the gold cross-link.
 * ------------------------------------------------------------------ */

function CommoditiesGroupSection({
  group,
  ids,
  readings,
  units,
}: {
  group: string;
  ids: readonly IndicatorId[];
  readings: readonly IndicatorReading[];
  units: CommoditiesUnitLabels;
}): React.JSX.Element | null {
  const { t } = useI18n();
  const entries = commoditiesCards(readings, ids);
  const keys = GROUP_KEY[group];
  // Fail-closed: an unknown group id renders no section (never a blank
  // heading, never a guess). The TOTAL display/copy map turns a missing
  // group into a typecheck error long before this could fire at runtime.
  if (keys === undefined) return null;
  return (
    <section aria-label={t(keys.title)} data-commodities-section={group} className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(keys.title)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t(keys.intro)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <CommoditiesCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
      {/* The gold cross-link — only on the metals group (§11 "Cross-links",
          D-19/D-27: gold and its ratios stay on /gold). */}
      {group === 'metals' ? <GoldCrossLink /> : null}
    </section>
  );
}

export function CommoditiesTierCards({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t } = useI18n();
  // The corpus-pinned unit labels, assembled once for the render pass
  // (the copy-pin test proves each word matches the corpus byte-for-byte).
  const units: CommoditiesUnitLabels = {
    usd: t('pd.commodities.units.usd'),
    index: t('pd.commodities.units.index'),
    barrels: t('pd.commodities.units.barrels'),
    'barrels-per-day': t('pd.commodities.units.barrels-per-day'),
    transits: t('pd.commodities.units.transits'),
  };
  return (
    <>
      <CommoditiesGroupSection group="energy" ids={COMMODITIES_ENERGY_IDS} readings={readings} units={units} />
      <CommoditiesGroupSection group="metals" ids={COMMODITIES_METALS_IDS} readings={readings} units={units} />
      <CommoditiesGroupSection group="agriculture" ids={COMMODITIES_AGRICULTURE_IDS} readings={readings} units={units} />
      <CommoditiesGroupSection group="digital" ids={COMMODITIES_DIGITAL_IDS} readings={readings} units={units} />
      <CommoditiesGroupSection group="trade-routes-supply" ids={COMMODITIES_TRADE_ROUTES_IDS} readings={readings} units={units} />
    </>
  );
}
