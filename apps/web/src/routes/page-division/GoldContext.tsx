/**
 * GoldContext — the Gold page's context cards (D-27: the eight ratio
 * cards + the five flows & positioning cards), the four BLOCKED ids as
 * honest notes only (spec §16 — never cards), and the honest-record
 * footnote (D-29: the measured sign-agreement record, MIN2, the
 * descriptive-conditions-meter / no-forecasting-edge sentence).
 *
 * Every card renders the §21 per-page trio: the VALUE (the DISPLAY
 * registry's own decimals + unit, restated in gold-tiles' lean mirror
 * and pinned by test), the 10-YEAR POSITION (the band word, only when
 * percentile10y exists — fail-closed), and the FRESHNESS (the reading's
 * own asOf date + the status word when the reading is not normal). An
 * absent reading (public mode's licence-hidden quartet never reaches
 * here — the blocked notes are static) renders the honest unavailable
 * word, never a guess.
 *
 * gold-usd does NOT repeat here: it is the hero (the placement note's
 * own line — "gold-usd is the hero card").
 */

import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { GOLD_BLOCKED_NOTES, GOLD_DISPLAY, type GoldContextEntry, type GoldContextId, type GoldUnitToken } from './gold-tiles';

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

/** The blocked-note copy keys, keyed by the placement table's own ids
 *  (BLOCKED_NOTES drives the list; the copy map stays total — the cast
 *  rides the placement's own quartet, pinned by gold-tiles.test.ts). */
type BlockedNoteId = 'wgc-etf-holdings' | 'wgc-cb-demand' | 'official-gold-demand' | 'etf-short-interest';
const BLOCKED_KEY: Readonly<Record<BlockedNoteId, TranslationKey>> = {
  'wgc-etf-holdings': 'pd.gold.blockedWgcEtf',
  'wgc-cb-demand': 'pd.gold.blockedWgcCb',
  'official-gold-demand': 'pd.gold.blockedOfficial',
  'etf-short-interest': 'pd.gold.blockedEtfShort',
};

/** The honest-record link — the lane balance's own measured record
 *  (MergedCard's GOLD_BALANCE_BACKTEST_URL, the same document). */
const GOLD_BACKTEST_URL =
  'https://github.com/assadigit/Currena/blob/main/docs/insights/BACKTEST-GOLD-LANES.md';

/* ------------------------------------------------------------------ *
 * One context card
 * ------------------------------------------------------------------ */

function ContextCard({ entry }: { entry: GoldContextEntry }): React.JSX.Element {
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

  return (
    <article
      id={`gold-card-${entry.id}`}
      data-context-card={entry.id}
      data-context-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueJoin !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]">
          {valueJoin}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.gold.valueUnavailable')}</p>
      )}
      {positionLine !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)]">
          <bdi>{positionLine}</bdi>
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
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The two context groups + the blocked notes + the honest record
 * ------------------------------------------------------------------ */

function ContextGroup({ title, entries }: { title: string; entries: readonly GoldContextEntry[] }): React.JSX.Element {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{title}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5">
        {entries.map((entry) => (
          <ContextCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

export function GoldContext({ entries }: { entries: readonly GoldContextEntry[] }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  // The two D-27 groups in placement order — gold-usd (the hero)
  // excepted from the ratios group; the flows & positioning five
  // complete. The split derives from the entries' own order (placement
  // group order), never a hand-copied list.
  const withoutHero = entries.filter((e) => e.id !== 'gold-usd');
  const ratios = withoutHero.slice(0, 8);
  const flows = withoutHero.slice(8);
  const pct = (v: number): string => formatNumber(v, numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section id="gold-context" aria-label={t('pd.gold.contextAria')} data-gold-context className="flex flex-col gap-3.5 scroll-mt-24">
      <ContextGroup title={t('pd.gold.ratiosTitle')} entries={ratios} />
      <ContextGroup title={t('pd.gold.flowsTitle')} entries={flows} />

      {/* ---- The blocked quartet (§16): honest notes, never cards. ---- */}
      <section aria-label={t('pd.gold.blockedTitle')} data-gold-blocked className="flex flex-col gap-1.5">
        <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {t('pd.gold.blockedTitle')}
        </h3>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {GOLD_BLOCKED_NOTES.map((note) => (
            <li
              key={note.id}
              data-blocked-note={note.id}
              className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]"
            >
              <bdi>{t(BLOCKED_KEY[note.id as BlockedNoteId])}</bdi>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- The honest-record footnote (D-29). ---- */}
      <footer data-gold-honest-record className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-currena-soft/50 p-3 ring-1 ring-[var(--color-border)]/60 sm:p-3.5">
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
      </footer>
    </section>
  );
}
