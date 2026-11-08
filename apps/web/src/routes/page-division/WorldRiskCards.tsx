/**
 * WorldRiskCards — the world risk & liquidity section (page-division S7,
 * 2026-11-08 — spec §6 item 3: the 9 placement homes gpr-index ·
 * gpr-threats · gpr-acts · gpr-daily · gpr-russia · gpr-ukraine ·
 * gpr-israel · gpr-saudi · global-liquidity).
 *
 * Every card renders the §21 per-page trio — the VALUE (the DISPLAY
 * registry's own decimals + unit, restated in world-markets-tiles' lean
 * mirror and pinned by test), the 10-YEAR POSITION (the band word, only
 * when percentile10y exists — fail-closed) and the FRESHNESS (the
 * reading's own asOf date + the status word when the reading is not
 * normal) — the GoldContext pattern. An absent reading (public mode's
 * licence-hidden ids, a failed id) renders the honest unavailable word,
 * never a guess.
 */

import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { WORLD_RISK_DISPLAY, type WorldRiskEntry, type WorldRiskId, type WorldRiskUnitToken } from './world-markets-tiles';

/** The card-name keys — 9 literal keys (the copy-pin test proves each
 * matches the indicators corpus byte-for-byte). */
const CARD_NAME_KEY: Readonly<Record<WorldRiskId, TranslationKey>> = {
  'gpr-index': 'pd.worldMarkets.cardNames.gpr-index',
  'gpr-threats': 'pd.worldMarkets.cardNames.gpr-threats',
  'gpr-acts': 'pd.worldMarkets.cardNames.gpr-acts',
  'gpr-daily': 'pd.worldMarkets.cardNames.gpr-daily',
  'gpr-russia': 'pd.worldMarkets.cardNames.gpr-russia',
  'gpr-ukraine': 'pd.worldMarkets.cardNames.gpr-ukraine',
  'gpr-israel': 'pd.worldMarkets.cardNames.gpr-israel',
  'gpr-saudi': 'pd.worldMarkets.cardNames.gpr-saudi',
  'global-liquidity': 'pd.worldMarkets.cardNames.global-liquidity',
};

const UNIT_KEY: Readonly<Record<WorldRiskUnitToken, TranslationKey>> = {
  index: 'pd.worldMarkets.unitIndex',
  'usd-tr': 'pd.worldMarkets.unitUsdTr',
};

const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.worldMarkets.positionLow',
  typical: 'pd.worldMarkets.positionTypical',
  high: 'pd.worldMarkets.positionHigh',
};

const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.worldMarkets.statusWarning',
  stale: 'pd.worldMarkets.statusStale',
  'check-pending': 'pd.worldMarkets.statusCheckPending',
  unavailable: 'pd.worldMarkets.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One risk card
 * ------------------------------------------------------------------ */

function RiskCard({ entry }: { entry: WorldRiskEntry }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);
  const cfg = WORLD_RISK_DISPLAY[entry.id];

  // The VALUE — the DISPLAY registry's own decimals + unit join (the
  // indicatorValueParts convention: 'usd-tr' renders "US$23.33 trillion"
  // in EN — the corpus units.usd prefix + the magnitude word — and keeps
  // its suffix-only form in fa; 'index' suffixes everywhere).
  const valueText =
    reading !== undefined && reading.value !== null
      ? formatNumber(reading.value, numberLocale, { minimumFractionDigits: cfg.decimals, maximumFractionDigits: cfg.decimals })
      : null;
  const unit = t(UNIT_KEY[cfg.unit]);
  const valueJoin =
    valueText !== null
      ? cfg.unit === 'usd-tr' && numberLocale === 'en-US'
        ? `${t('pd.worldMarkets.unitUsd')}${valueText} ${unit}`
        : unit === ''
          ? valueText
          : `${valueText} ${unit}`
      : null;

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  // The band word follows the legacy collapsed-line's OWN convention
  // (high → top {100−p}% · low → bottom {p}% · else the middle).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.worldMarkets.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.worldMarkets.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.worldMarkets.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.worldMarkets.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the section heading already says context;
  // the warning family still speaks).
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
      id={`wm-risk-${entry.id}`}
      data-risk-card={entry.id}
      data-risk-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueJoin !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]">
          {valueJoin}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.worldMarkets.valueUnavailable')}</p>
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
        {statusWord !== null ? <span data-risk-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The section
 * ------------------------------------------------------------------ */

export function WorldRiskCards({ entries }: { entries: readonly WorldRiskEntry[] }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <section id="wm-risk" aria-label={t('pd.worldMarkets.riskAria')} data-wm-risk className="flex flex-col gap-2.5 scroll-mt-24">
      <div>
        <h2 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {t('pd.worldMarkets.riskTitle')}
        </h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]">
          {t('pd.worldMarkets.riskIntro')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-2.5">
        {entries.map((entry) => (
          <RiskCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
