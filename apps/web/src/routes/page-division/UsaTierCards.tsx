/**
 * UsaTierCards — the USA page's tier sections (page-division S9 + S10,
 * 2026-11-09 — spec §7 items 2–6: D-29 tier 1 "the world watches" (7) +
 * tier 2 "Rates & the Fed" (the placement's authoritative 19) + the S10
 * tiers: 3 inflation (12) · 4 labor & growth (17) · 5 liquidity/stress/
 * valuation (17) — 72 registry cards in all; tier 6 is the TIC BOARD,
 * which rides its own feed through UsaTicSection, not this module).
 *
 * Every card renders the §21 per-page trio — the VALUE (the DISPLAY
 * registry's own decimals + units + scales + ranges through
 * usaCardValueText, restated lean and pinned output-for-output against
 * `formatReadingValue` by usa-tiles.test.ts), the 10-YEAR POSITION (the
 * band word, only when percentile10y exists — fail-closed) and the
 * FRESHNESS (the reading's own asOf date + the status word when the
 * reading is not normal) — the GoldContext / WorldRiskCards pattern. An
 * absent reading (public mode's licence-hidden ids, a failed id) renders
 * the honest unavailable word, never a guess.
 *
 * Platform: browser only — this module lives in the lazy USA route
 * chunk, never the entry graph.
 */

import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import {
  USA_TIER1_IDS,
  USA_TIER2_IDS,
  USA_TIER3_IDS,
  USA_TIER4_IDS,
  USA_TIER5_IDS,
  usaCardValueText,
  usaCards,
  type UsaCardEntry,
  type UsaCardId,
  type UsaUnitLabels,
} from './usa-tiles';

/** The tier id lists, typed against usa-tiles' own (never re-derived here
 *  — the section wiring rides the pure module's single source). */
const USA_TIER1_ENTRY_IDS: readonly UsaCardId[] = USA_TIER1_IDS as readonly UsaCardId[];
const USA_TIER2_ENTRY_IDS: readonly UsaCardId[] = USA_TIER2_IDS as readonly UsaCardId[];
const USA_TIER3_ENTRY_IDS: readonly UsaCardId[] = USA_TIER3_IDS as readonly UsaCardId[];
const USA_TIER4_ENTRY_IDS: readonly UsaCardId[] = USA_TIER4_IDS as readonly UsaCardId[];
const USA_TIER5_ENTRY_IDS: readonly UsaCardId[] = USA_TIER5_IDS as readonly UsaCardId[];

/** The card-name keys — 72 literal keys (the copy-pin test proves each
 *  matches the insights corpus byte-for-byte, both locales). */
const CARD_NAME_KEY: Readonly<Record<UsaCardId, TranslationKey>> = {
  'fed-target': 'pd.usa.cardNames.fed-target',
  'fed-expectations': 'pd.usa.cardNames.fed-expectations',
  'us-cpi-yoy': 'pd.usa.cardNames.us-cpi-yoy',
  'us-pce-core-yoy': 'pd.usa.cardNames.us-pce-core-yoy',
  'us-nfp': 'pd.usa.cardNames.us-nfp',
  'us-unemployment': 'pd.usa.cardNames.us-unemployment',
  us10y: 'pd.usa.cardNames.us10y',
  'yield-curve-10y2y': 'pd.usa.cardNames.yield-curve-10y2y',
  'yield-curve-10y3m': 'pd.usa.cardNames.yield-curve-10y3m',
  'real-yield-10y': 'pd.usa.cardNames.real-yield-10y',
  'real-yield-5y': 'pd.usa.cardNames.real-yield-5y',
  'real-curve-10y5y': 'pd.usa.cardNames.real-curve-10y5y',
  us30y: 'pd.usa.cardNames.us30y',
  'us-2y': 'pd.usa.cardNames.us-2y',
  sofr: 'pd.usa.cardNames.sofr',
  'mortgage-30y': 'pd.usa.cardNames.mortgage-30y',
  'nyfed-custody': 'pd.usa.cardNames.nyfed-custody',
  'us-deficit-monthly': 'pd.usa.cardNames.us-deficit-monthly',
  'us-deficit-12m': 'pd.usa.cardNames.us-deficit-12m',
  'treasury-auction-10y': 'pd.usa.cardNames.treasury-auction-10y',
  'treasury-auction-10y-indirect': 'pd.usa.cardNames.treasury-auction-10y-indirect',
  'treasury-auction-30y': 'pd.usa.cardNames.treasury-auction-30y',
  'treasury-auction-30y-indirect': 'pd.usa.cardNames.treasury-auction-30y-indirect',
  'rstar-us': 'pd.usa.cardNames.rstar-us',
  'debt-to-gdp': 'pd.usa.cardNames.debt-to-gdp',
  'govt-interest-revenue': 'pd.usa.cardNames.govt-interest-revenue',
  // ---- Tier 3 — inflation (S10) ----
  'us-cpi-core-yoy': 'pd.usa.cardNames.us-cpi-core-yoy',
  'median-cpi': 'pd.usa.cardNames.median-cpi',
  'sticky-cpi': 'pd.usa.cardNames.sticky-cpi',
  'us-wages': 'pd.usa.cardNames.us-wages',
  t5yie: 'pd.usa.cardNames.t5yie',
  'breakeven-5y5y': 'pd.usa.cardNames.breakeven-5y5y',
  'breakeven-10y': 'pd.usa.cardNames.breakeven-10y',
  'breakeven-tilt': 'pd.usa.cardNames.breakeven-tilt',
  'cpi-nowcast': 'pd.usa.cardNames.cpi-nowcast',
  'cpi-surprise': 'pd.usa.cardNames.cpi-surprise',
  'michigan-5y-expectations': 'pd.usa.cardNames.michigan-5y-expectations',
  'michigan-1y-expectations': 'pd.usa.cardNames.michigan-1y-expectations',
  // ---- Tier 4 — labor & growth ----
  'initial-jobless-claims': 'pd.usa.cardNames.initial-jobless-claims',
  'continuing-claims': 'pd.usa.cardNames.continuing-claims',
  'job-openings': 'pd.usa.cardNames.job-openings',
  'sahm-rule': 'pd.usa.cardNames.sahm-rule',
  'recession-probability': 'pd.usa.cardNames.recession-probability',
  'michigan-sentiment': 'pd.usa.cardNames.michigan-sentiment',
  'oecd-cli-us': 'pd.usa.cardNames.oecd-cli-us',
  'philly-fed': 'pd.usa.cardNames.philly-fed',
  'empire-state': 'pd.usa.cardNames.empire-state',
  cfnai: 'pd.usa.cardNames.cfnai',
  gdpnow: 'pd.usa.cardNames.gdpnow',
  'us-gdp-growth': 'pd.usa.cardNames.us-gdp-growth',
  'retail-sales': 'pd.usa.cardNames.retail-sales',
  'housing-permits': 'pd.usa.cardNames.housing-permits',
  'epu-us': 'pd.usa.cardNames.epu-us',
  'tpu-us': 'pd.usa.cardNames.tpu-us',
  'm2-us': 'pd.usa.cardNames.m2-us',
  // ---- Tier 5 — liquidity, stress & valuation ----
  walcl: 'pd.usa.cardNames.walcl',
  tga: 'pd.usa.cardNames.tga',
  'reverse-repo': 'pd.usa.cardNames.reverse-repo',
  'bank-reserves': 'pd.usa.cardNames.bank-reserves',
  'repo-stress': 'pd.usa.cardNames.repo-stress',
  'net-liquidity': 'pd.usa.cardNames.net-liquidity',
  'stress-stlfsi': 'pd.usa.cardNames.stress-stlfsi',
  nfci: 'pd.usa.cardNames.nfci',
  vix: 'pd.usa.cardNames.vix',
  'bank-stress': 'pd.usa.cardNames.bank-stress',
  ebp: 'pd.usa.cardNames.ebp',
  'ofr-fsi': 'pd.usa.cardNames.ofr-fsi',
  'sloos-ci-tightening': 'pd.usa.cardNames.sloos-ci-tightening',
  'term-premium-10y': 'pd.usa.cardNames.term-premium-10y',
  'shiller-cape': 'pd.usa.cardNames.shiller-cape',
  'shiller-ecy': 'pd.usa.cardNames.shiller-ecy',
  'sp500-breadth-ratio': 'pd.usa.cardNames.sp500-breadth-ratio',
};

/** The position word keys (the corpus's own, pinned). */
const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.usa.positionLow',
  typical: 'pd.usa.positionTypical',
  high: 'pd.usa.positionHigh',
};

/** The status word keys (the corpus's own, pinned; 'context' has no key —
 *  a context reading is normal for a context-only id and speaks nothing). */
const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.usa.statusWarning',
  stale: 'pd.usa.statusStale',
  'check-pending': 'pd.usa.statusCheckPending',
  unavailable: 'pd.usa.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One tier card
 * ------------------------------------------------------------------ */

function TierCard({ entry, units }: { entry: UsaCardEntry; units: UsaUnitLabels }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);

  // The VALUE — the DISPLAY registry's own join (usaCardValueText).
  const valueText = usaCardValueText(entry.id, reading, numberLocale, units);

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  // The band word follows the legacy collapsed-line's OWN convention
  // (high → top {100−p}% · low → bottom {p}% · else the middle).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.usa.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.usa.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.usa.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.usa.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the GoldContext / WorldRiskCards pattern).
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
      id={`usa-card-${entry.id}`}
      data-usa-card={entry.id}
      data-usa-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueText !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-usa-value>
          {valueText}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.usa.valueUnavailable')}</p>
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
        {statusWord !== null ? <span data-usa-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * One tier section
 * ------------------------------------------------------------------ */

function TierSection({
  titleKey,
  introKey,
  ids,
  readings,
  units,
  dataTier,
}: {
  titleKey: TranslationKey;
  introKey: TranslationKey;
  ids: readonly UsaCardId[];
  readings: readonly IndicatorReading[];
  units: UsaUnitLabels;
  dataTier: string;
}): React.JSX.Element {
  const { t } = useI18n();
  const entries = usaCards(readings, ids);
  return (
    <section aria-label={t(titleKey)} data-usa-tier={dataTier} className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(titleKey)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t(introKey)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-4 lg:gap-3">
        {entries.map((entry) => (
          <TierCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
    </section>
  );
}

export function UsaTierCards({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t } = useI18n();
  // The corpus-pinned unit labels, assembled once for the render pass
  // (the copy-pin test proves each word matches the corpus byte-for-byte).
  const units: UsaUnitLabels = {
    percent: t('pd.usa.unitPercent'),
    points: t('pd.usa.unitPoints'),
    ratio: t('pd.usa.unitRatio'),
    usd: t('pd.usa.unitUsd'),
    'usd-tr': t('pd.usa.unitUsdTr'),
    'usd-bn': t('pd.usa.unitUsdBn'),
    index: t('pd.usa.unitIndex'),
    claims: t('pd.usa.unitClaims'),
    permits: t('pd.usa.unitPermits'),
    openings: t('pd.usa.unitOpenings'),
  };
  return (
    <>
      <TierSection
        titleKey="pd.usa.tier1.title"
        introKey="pd.usa.tier1.intro"
        ids={USA_TIER1_ENTRY_IDS}
        readings={readings}
        units={units}
        dataTier="tier-1"
      />
      <TierSection
        titleKey="pd.usa.tier2.title"
        introKey="pd.usa.tier2.intro"
        ids={USA_TIER2_ENTRY_IDS}
        readings={readings}
        units={units}
        dataTier="tier-2"
      />
      <TierSection
        titleKey="pd.usa.tier3.title"
        introKey="pd.usa.tier3.intro"
        ids={USA_TIER3_ENTRY_IDS}
        readings={readings}
        units={units}
        dataTier="tier-3"
      />
      <TierSection
        titleKey="pd.usa.tier4.title"
        introKey="pd.usa.tier4.intro"
        ids={USA_TIER4_ENTRY_IDS}
        readings={readings}
        units={units}
        dataTier="tier-4"
      />
      <TierSection
        titleKey="pd.usa.tier5.title"
        introKey="pd.usa.tier5.intro"
        ids={USA_TIER5_ENTRY_IDS}
        readings={readings}
        units={units}
        dataTier="tier-5"
      />
    </>
  );
}
