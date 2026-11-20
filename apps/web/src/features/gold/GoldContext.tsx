/**
 * GoldContext — the Gold page's context cards (D-27: the eight ratio
 * cards + the five flows & positioning cards) and the honest-record
 * footnote (D-29: the measured sign-agreement record, MIN2, the
 * descriptive-conditions-meter / no-forecasting-edge sentence).
 *
 * The four BLOCKED ids and the absent-count line no longer ride this
 * block: BD-S43 (2026-11-20, the owner-directed relocation) moved the §16
 * licence wall whole into GoldPublicationNotes — the footer-positioned,
 * collapsed-by-default disclosure at the page tail (the same honest copy,
 * one tap away).
 *
 * Every card renders the §21 per-page trio: the VALUE (the DISPLAY
 * registry's own decimals + unit, restated in gold-tiles' lean mirror
 * and pinned by test), the 10-YEAR POSITION (the band word, only when
 * percentile10y exists — fail-closed), and the FRESHNESS (the reading's
 * own asOf date + the status word when the reading is not normal). An
 * absent reading (public mode's licence-hidden quartet never reaches
 * here — the blocked notes live in the footer disclosure) renders the
 * honest unavailable word, never a guess.
 *
 * gold-usd does NOT repeat here: it is the hero (the placement note's
 * own line — "gold-usd is the hero card").
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { CardDetailsOpener } from '../../shared/components/IndicatorDetailsPanel';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { COT_BAND_IDS, GOLD_DISPLAY, cotBandOf, type GoldContextEntry, type GoldContextId, type GoldUnitToken } from './gold-tiles';
import { GoldCurrencyGrid } from './GoldCurrencyGrid';
import { GoldForecastRetrospective } from './GoldForecastRetrospective';

/** The context-card name keys — 14 literal keys (the copy-pin test proves
 *  each matches the indicators corpus byte-for-byte). */
const CARD_NAME_KEY: Readonly<Record<GoldContextId, TranslationKey>> = {
  'gold-usd': 'pd.gold.cardNames.gold-usd',
  'gold-silver': 'pd.gold.cardNames.gold-silver',
  'gold-btc': 'pd.gold.cardNames.gold-btc',
  'gold-aud': 'pd.gold.cardNames.gold-aud',
  'gold-oil-ratio': 'pd.gold.cardNames.gold-oil-ratio',
  'gold-platinum': 'pd.gold.cardNames.gold-platinum',
  'real-gold-price': 'pd.gold.cardNames.real-gold-price',
  'copper-gold': 'pd.gold.cardNames.copper-gold',
  'gold-equities-ratio': 'pd.gold.cardNames.gold-equities-ratio',
  'cftc-gold-positioning': 'pd.gold.cardNames.cftc-gold-positioning',
  'cftc-gold-gross-long': 'pd.gold.cardNames.cftc-gold-gross-long',
  'sge-gold-withdrawals': 'pd.gold.cardNames.sge-gold-withdrawals',
  'swiss-gold-flow': 'pd.gold.cardNames.swiss-gold-flow',
  'shanghai-gold-premium': 'pd.gold.cardNames.shanghai-gold-premium',
};

const UNIT_KEY: Readonly<Record<GoldUnitToken, TranslationKey>> = {
  usd: 'pd.gold.unitUsd',
  aud: 'pd.gold.unitAud',
  percent: 'pd.gold.unitPercent',
  ratio: 'pd.gold.unitRatio',
  tonnes: 'pd.gold.unitTonnes',
};

/** Units the EN render prefixes (the display config's own PREFIXED_UNITS
 *  set, restated for the gold ids: usd + aud). */
const PREFIXED_UNITS = new Set(['usd', 'aud']);

const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.gold.positionLow',
  typical: 'pd.gold.positionTypical',
  high: 'pd.gold.positionHigh',
};

const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.gold.statusWarning',
  stale: 'pd.gold.statusStale',
  'check-pending': 'pd.gold.statusCheckPending',
  unavailable: 'pd.gold.statusUnavailable',
};

/* GPE R21 / F4b (2026-11-18): the one-liner key per context card — the
 * plain meaning sentence under each card's value (the s7/02 §2.1–§2.2
 * drafts, complete against the 13 non-hero card ids). gold-usd needs no
 * one-liner (the hero price — its meaning is the as-of line + the
 * market-state pill, Zone B); the map stays total for the rest. */
const CARD_MEANING_KEY: Readonly<Record<GoldContextId, TranslationKey | null>> = {
  'gold-usd': null, // the hero — no one-liner needed (s7/02 §2's own note)
  'gold-silver': 'pd.gold.meaningGoldSilver',
  'gold-btc': 'pd.gold.meaningGoldBtc',
  'gold-aud': 'pd.gold.meaningGoldAud',
  'gold-oil-ratio': 'pd.gold.meaningGoldOilRatio',
  'gold-platinum': 'pd.gold.meaningGoldPlatinum',
  'real-gold-price': 'pd.gold.meaningRealGoldPrice',
  'copper-gold': 'pd.gold.meaningCopperGold',
  'gold-equities-ratio': 'pd.gold.meaningGoldEquitiesRatio',
  'cftc-gold-positioning': 'pd.gold.meaningCftcPositioning',
  'cftc-gold-gross-long': 'pd.gold.meaningCftcGrossLong',
  'sge-gold-withdrawals': 'pd.gold.meaningSgeWithdrawals',
  'swiss-gold-flow': 'pd.gold.meaningSwissFlow',
  'shanghai-gold-premium': 'pd.gold.meaningShanghaiPremium',
};

/** The honest-record link — the lane balance's own measured record
 *  (MergedCard's GOLD_BALANCE_BACKTEST_URL, the same document). */
const GOLD_BACKTEST_URL =
  'https://github.com/assadigit/Currena/blob/main/docs/insights/BACKTEST-GOLD-LANES.md';

/* ------------------------------------------------------------------ *
 * One context card
 * ------------------------------------------------------------------ */

function ContextCard({
  entry,
  onOpenDetails,
}: {
  entry: GoldContextEntry;
  /** The R-5 details-panel opener (the page's useIndicatorDetailsPanel). */
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);
  const cfg = GOLD_DISPLAY[entry.id];

  // The VALUE — the DISPLAY registry's own decimals + unit join.
  const valueText =
    reading !== undefined && reading.value !== null
      ? formatNumber(reading.value, numberLocale, { minimumFractionDigits: cfg.decimals, maximumFractionDigits: cfg.decimals })
      : null;
  const unit = t(UNIT_KEY[cfg.unit]);
  const valueJoin =
    valueText !== null
      ? PREFIXED_UNITS.has(cfg.unit) && numberLocale === 'en-US'
        ? `${unit}${valueText}`
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
      ? interpolate(t('pd.gold.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.gold.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.gold.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.gold.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the context state IS the card's honest
  // non-voting state — the section heading already says it; the warning
  // family still speaks).
  const statusKey = reading !== undefined ? STATUS_KEY[reading.status] : undefined;
  const statusWord = statusKey !== undefined ? t(statusKey) : null;
  const asOfText =
    reading !== undefined && reading.asOf !== null
      ? locale === 'fa'
        ? formatJalaliDate(reading.asOf, 'fa-IR')
        : formatDateWords(reading.asOf, 'en-US')
      : null;

  /* GPE R27 / F14 (2026-11-19): the COT percentile band + the crowd
   * gauge — the Zone J positioning pair gains the compact band chip and
   * the crowd-gauge flag (s7/01 §7 Chain 6, binding: position + band,
   * NEVER direction; the days–weeks horizon label always renders with
   * the flag). The chip REPLACES the generic position line on these two
   * cards (the same position+band information, the Chain-6 framing);
   * fail-closed without percentile10y. The D5-locked convention is
   * named at point of use per C1/C7. */
  const isCot = (COT_BAND_IDS as readonly string[]).includes(entry.id);
  const cotBand = isCot ? cotBandOf(reading?.percentile10y) : null;
  const cotBandWord =
    cotBand !== null
      ? cotBand === 'high'
        ? interpolate(t('pd.gold.cotChipTop'), { p: formatNumber(Math.round((1 - pct!) * 100), numberLocale) })
        : cotBand === 'low'
          ? interpolate(t('pd.gold.cotChipBottom'), { p: formatNumber(Math.round(pct! * 100), numberLocale) })
          : t('pd.gold.cotChipMid')
      : null;
  const cotGaugeKey =
    cotBand === 'high' ? 'pd.gold.cotCrowdHigh' : cotBand === 'low' ? 'pd.gold.cotCrowdLow' : cotBand === 'mid' ? 'pd.gold.cotCrowdMid' : null;

  return (
    <article
      id={`gold-card-${entry.id}`}
      data-context-card={entry.id}
      data-context-status={reading?.status ?? 'absent'}
      className="relative flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueJoin !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]">
          {valueJoin}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.gold.valueUnavailable')}</p>
      )}
      {/* GPE R21 / F4b: the one-liner — one plain meaning sentence under
       * the card's value («نسبت ۸۲ یعنی چه» answered, the #12 fix). No
       * number restated, no forecast; the series/convention notes ride
       * their existing places per C1. */}
      {CARD_MEANING_KEY[entry.id] !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]" data-card-meaning>
          <bdi>{t(CARD_MEANING_KEY[entry.id]!)}</bdi>
        </p>
      ) : null}
      {positionLine !== null && !isCot ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)]">
          <bdi>{positionLine}</bdi>
        </p>
      ) : null}
      {/* GPE R27 / F14: the compact band chip (the 10-year percentile as
       * a badge — no new rows at 390, the chip rides the card). */}
      {cotBand !== null && cotBandWord !== null ? (
        <p
          className="m-0 inline-flex w-fit items-center rounded-[var(--radius-sm)] bg-currena-soft/70 px-2 py-0.5 text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/70"
          data-cot-band={cotBand}
        >
          <bdi>{interpolate(t('pd.gold.cotBandChip'), { band: cotBandWord })}</bdi>
        </p>
      ) : null}
      {/* GPE R27 / F14: the crowd-gauge flag — the mandated treatment
       * (extremes = vulnerability in EITHER direction; mid-range carries
       * little information; the days–weeks horizon rides every line). */}
      {cotGaugeKey !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]" data-cot-gauge={cotBand}>
          <bdi>{t(cotGaugeKey)}</bdi>
        </p>
      ) : null}
      {/* The D5-locked convention, named at point of use (C1/C7): the
       * positioning pair's own series definition, on the card itself. */}
      {isCot ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-cot-convention={entry.id}>
          <bdi>{t(entry.id === 'cftc-gold-positioning' ? 'pd.gold.cotConventionNet' : 'pd.gold.cotConventionGross')}</bdi>
        </p>
      ) : null}
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[length:var(--type-caption)] leading-tight text-[var(--color-text-tertiary)]">
        {asOfText !== null ? (
          <bdi>
            {interpolate(t('pd.global.dataAsOf'), { date: asOfText })}
          </bdi>
        ) : null}
        {statusWord !== null ? <span data-context-status-word>{statusWord}</span> : null}
      </p>
      {/* The R-5 details-panel opener — the stretched tap zone over the
       * whole card (only when a reading exists; an absent id stays the
       * honest non-interactive unavailable card, D-R5-3). */}
      {reading !== undefined ? <CardDetailsOpener id={entry.id} onOpenDetails={onOpenDetails} /> : null}
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The two context groups + the honest record
 * ------------------------------------------------------------------ */

function ContextGroup({
  title,
  entries,
  onOpenDetails,
  after,
}: {
  title: string;
  entries: readonly GoldContextEntry[];
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  /** GPE R26 / F10 (2026-11-19): the ratios group's compact sub-card —
   * rendered inside the section, after the cards grid (s6/01 zone I:
   * 390 = one row expanding to the stacked grid). */
  after?: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{title}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5">
        {entries.map((entry) => (
          <ContextCard key={entry.id} entry={entry} onOpenDetails={onOpenDetails} />
        ))}
      </div>
      {after !== null && after !== undefined ? after : null}
    </section>
  );
}

export function GoldContext({
  entries,
  onOpenDetails,
  zoneK,
}: {
  entries: readonly GoldContextEntry[];
  /** The R-5 details-panel opener (the page's useIndicatorDetailsPanel). */
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  /** GPE R14 — Zone K (the central-bank demand section), rendered between
   *  the flows cards and the licence wall (s6/01 §2b slot A); the trust
   *  band (wall + honest record) stays contiguous behind it. */
  zoneK?: React.ReactNode;
}): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  // The two D-27 groups in placement order — gold-usd (the hero)
  // excepted from the ratios group; the flows & positioning five
  // complete. The split derives from the entries' own order (placement
  // group order), never a hand-copied list.
  const withoutHero = entries.filter((e) => e.id !== 'gold-usd');
  const ratios = withoutHero.slice(0, 8);
  const flows = withoutHero.slice(8);
  // GPE R21 / Chain 7 (s7/01 §7): the physical subgroup inside Zone J —
  // the three physical cards (SGE withdrawals, the Swiss flow, the
  // Shanghai premium) under their own «بازار فیزیکی» mini-header with ONE
  // shared sensor-not-verdict reading line; the COT positioning pair
  // stays above them (Chain 6's fuel-not-driver, F14's wave-3 riders).
  const PHYSICAL_IDS: ReadonlySet<string> = new Set(['sge-gold-withdrawals', 'swiss-gold-flow', 'shanghai-gold-premium']);
  const physical = flows.filter((e) => PHYSICAL_IDS.has(e.id));
  const positioning = flows.filter((e) => !PHYSICAL_IDS.has(e.id));
  const pct = (v: number): string => formatNumber(v, numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section id="gold-context" aria-label={t('pd.gold.contextAria')} data-gold-context className="flex flex-col gap-3.5 scroll-mt-24">
      {/* GPE R26 / F10: the multi-currency gold grid — Zone I's compact
       * sub-card under the ratios (the same ounce through five
       * numeraires; self-fetching, display-only). */}
      <ContextGroup title={t('pd.gold.ratiosTitle')} entries={ratios} onOpenDetails={onOpenDetails} after={<GoldCurrencyGrid />} />

      {/* Zone J — FLOWS & POSITIONING, now with the Chain-7 physical
       * subgroup (one coherent edit, S7-D1): the positioning pair, then
       * the physical mini-header + the shared reading line + the three
       * physical cards grouped under it. */}
      <section className="flex min-w-0 flex-col gap-2" data-flows-group>
        <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{t('pd.gold.flowsTitle')}</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5">
          {positioning.map((entry) => (
            <ContextCard key={entry.id} entry={entry} onOpenDetails={onOpenDetails} />
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60" data-physical-group>
          <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {t('pd.gold.physicalHeader')}
          </h4>
          {/* The ONE shared reading line (s7/01 §7: renders once under the
           * mini-header, not per card) — the sensor-not-verdict framing. */}
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-physical-line>
            <bdi>{t('pd.gold.physicalLine')}</bdi>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-2.5">
            {physical.map((entry) => (
              <ContextCard key={entry.id} entry={entry} onOpenDetails={onOpenDetails} />
            ))}
          </div>
        </div>
      </section>

      {/* GPE R14 — Zone K: the central-bank demand section, directly after
       *  the FLOWS cards (positioning → demand, the natural hand-off); the
       *  honest record closes the block (the licence wall moved to the
       *  page-tail disclosure, BD-S43). */}
      {zoneK !== null && zoneK !== undefined ? zoneK : null}

      {/* ---- The honest-record footnote (D-29). ---- */}
      <footer id="gold-honest-record" data-gold-honest-record className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-currena-soft/50 p-3 ring-1 ring-[var(--color-border)]/60 scroll-mt-24 sm:p-3.5">
        <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">{t('pd.gold.honestTitle')}</h3>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{t('pd.gold.measuredNote')}</bdi>{' '}
          <a
            href={GOLD_BACKTEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
          >
            {t('pd.gold.measuredLink')}
          </a>
        </p>
        {/* The measured sign-agreement record (05-GOLD-INDICATORS §10):
            the 21-voter frozen table's mature-base numbers, stated as
            data — all below a coin flip. */}
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{interpolate(t('pd.gold.signAgreement'), { d5: pct(46.8), d20: pct(42.2), d60: pct(32.7) })}</bdi>
        </p>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
          <bdi>{t('pd.gold.min2Note')}</bdi>
        </p>
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{t('pd.gold.noEdge')}</bdi>
        </p>
        {/* GPE R32 / F23 (2026-11-19, S17) — the forecast-accuracy
            retrospective: the COLLAPSED COMPANION inside this zone
            (s6/01 zone 14 — trust-band contiguity preserved, S6-D2).
            LBMA's own analyst-survey record (the professionals'
            published consensus missed by mean −2.1% / mean-abs 8.1%
            over 2010–2025) BESIDE our own no-edge record — the honesty
            device SA cannot copy (O8). */}
        <GoldForecastRetrospective />
      </footer>
    </section>
  );
}
