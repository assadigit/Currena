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

import { useCallback } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
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
  commoditiesCards,
  type CommoditiesCardEntry,
  type CommoditiesCardId,
} from './commodities-tiles';
import { PriceTile, useTileData, type TileData, type PriceLens } from '../../components/insights/PricesBoard';
import { useInsightsCopy } from '../../components/insights/useInsightsCopy';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

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
 * One Commodities card — the full price-row template (icon + title +
 * price + 7-day trend w/ sparkline + daily change + briefing + details
 * button), reusing the Insights PricesBoard's PriceTile so the
 * commodities page speaks the SAME card anatomy as the silver/gold/oil/
 * bitcoin cards. The 1-week lens is the primary trend (the template's
 * "past 7 days" row); the daily change rides below it.
 * ------------------------------------------------------------------ */

/** The combined id list for the per-card history fetch (the sparkline +
 *  daily change derive from each commodity's stored history series). */
const ALL_COMMODITY_IDS: readonly IndicatorId[] = [
  ...COMMODITIES_ENERGY_IDS,
  ...COMMODITIES_METALS_IDS,
  ...COMMODITIES_AGRICULTURE_IDS,
  ...COMMODITIES_DIGITAL_IDS,
  ...COMMODITIES_TRADE_ROUTES_IDS,
];

/** The absent-reading stub: a commodity whose reading the projection didn't
 *  carry renders the honest unavailable card (never a guess). PriceTile's
 *  isUnavailable branch handles the rest. */
const UNAVAILABLE_READING = (id: IndicatorId): IndicatorReading =>
  ({ id, value: null, asOf: null, status: 'unavailable' }) as IndicatorReading;

function CommoditiesCard({
  entry,
  copy,
  locale,
  numberLocale,
  data,
  lens,
  onFocusCard,
}: {
  entry: CommoditiesCardEntry;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  data: TileData | undefined;
  lens: PriceLens;
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}): React.JSX.Element {
  const reading = entry.reading ?? UNAVAILABLE_READING(entry.id);
  return (
    <div
      id={`commodities-card-${entry.id}`}
      data-commodities-card={entry.id}
      data-commodities-status={entry.reading?.status ?? 'absent'}
    >
      <PriceTile
        id={entry.id}
        reading={reading}
        copy={copy}
        locale={locale}
        numberLocale={numberLocale}
        data={data}
        lens={lens}
        onFocusCard={onFocusCard}
      />
    </div>
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
  copy,
  locale,
  numberLocale,
  tileData,
  lens,
  onFocusCard,
}: {
  group: string;
  ids: readonly IndicatorId[];
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  tileData: Partial<Record<string, TileData>>;
  lens: PriceLens;
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
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
          <CommoditiesCard
            key={entry.id}
            entry={entry}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            data={tileData[entry.id]}
            lens={lens}
            onFocusCard={onFocusCard}
          />
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
  // The Insights copy corpus — the SAME object the PricesBoard reads, so the
  // commodity cards speak the identical price-row anatomy + copy (title,
  // subtitle, trend words, briefing templates, units, the "more details"
  // label) as the silver/gold/oil/bitcoin cards on /insights.
  const { copy, locale, numberLocale } = useInsightsCopy();
  // The per-card history fetch — the 7-day sparkline + the daily change
  // derive from each commodity's stored history series (module-cached, so
  // the details panel reuses the same fetch).
  const tileData = useTileData(ALL_COMMODITY_IDS);
  // The primary lens: the template's "past 7 days" trend row. The daily
  // change rides below it (PriceTile hides the daily row when the lens IS
  // today, so 1w keeps both the 7-day trend AND the daily change visible).
  const lens: PriceLens = '1w';
  // The details handler: the commodities page has no side panel of its own,
  // so the "more details" button + the card body navigate to /insights (the
  // full chart + rule + source live there). A per-commodity detail panel can
  // be wired later without changing the card.
  const onFocusCard = useCallback((id: IndicatorId) => {
    void id;
    navigate('/insights');
  }, []);
  // The corpus-pinned unit labels stay assembled (the copy-pin test reads
  // them off the page-division copy, independent of the card render path).
  void t;
  return (
    <>
      <CommoditiesGroupSection group="energy" ids={COMMODITIES_ENERGY_IDS} readings={readings} copy={copy} locale={locale} numberLocale={numberLocale} tileData={tileData} lens={lens} onFocusCard={onFocusCard} />
      <CommoditiesGroupSection group="metals" ids={COMMODITIES_METALS_IDS} readings={readings} copy={copy} locale={locale} numberLocale={numberLocale} tileData={tileData} lens={lens} onFocusCard={onFocusCard} />
      <CommoditiesGroupSection group="agriculture" ids={COMMODITIES_AGRICULTURE_IDS} readings={readings} copy={copy} locale={locale} numberLocale={numberLocale} tileData={tileData} lens={lens} onFocusCard={onFocusCard} />
      <CommoditiesGroupSection group="digital" ids={COMMODITIES_DIGITAL_IDS} readings={readings} copy={copy} locale={locale} numberLocale={numberLocale} tileData={tileData} lens={lens} onFocusCard={onFocusCard} />
      <CommoditiesGroupSection group="trade-routes-supply" ids={COMMODITIES_TRADE_ROUTES_IDS} readings={readings} copy={copy} locale={locale} numberLocale={numberLocale} tileData={tileData} lens={lens} onFocusCard={onFocusCard} />
    </>
  );
}
