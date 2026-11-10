/**
 * AsiaTierCards — the Asia & Pacific page's five sections (page-division
 * S14, 2026-11-09 — spec §9 items 1–5; D-35: organized by sub-region,
 * not by theme; the S25 fill session 2026-11-12 lands the three §15
 * D-36 CPI cards — BD-S23a).
 *
 *   - China section (§9 item 1): china-pmi · china-cpi · oecd-cli-cn ·
 *     gpr-china · gpr-taiwan · china-property-investment ·
 *     china-steel-output.
 *   - Japan section (§9 item 2): jgb-10y · boj-rate · japan-cpi (the
 *     S25 fill — the IMF SDMX 3.0 CPI dataflow card).
 *   - Korea · Taiwan · Hong Kong section (§9 item 3): korea-cpi (the
 *     S25 fill) — KOSPI · TAIEX · HSI ride the markets board / the
 *     Asia zoom map (the intro copy says so).
 *   - India section (§9 item 4): india-cpi (the S25 fill; the mirror
 *     lags MoSPI by 1–3 months, labelled) — NIFTY50 rides the markets
 *     board.
 *   - Pacific — New Zealand section (§9 item 5, D-17): nz-short-rate ·
 *     nz-10y + the NZX50 card (S21: the BD-S8b commitment wired at
 *     last — NZX50 is NOT a world-board index, so it cannot ride the
 *     Asia zoom; its home is the AU Markets board on /australia, and
 *     the Pacific—NZ section renders its mirror through the SAME
 *     board payload + formatting helpers, linking to /australia).
 *
 * Every card renders the §21 per-page trio — the VALUE (the DISPLAY
 * registry's own decimals + units through asiaCardValueText, restated
 * lean and pinned output-for-output against `formatReadingValue` by
 * asia-tiles.test.ts), the 10-YEAR POSITION (the band word, only when
 * percentile10y exists — fail-closed) and the FRESHNESS (the reading's
 * own asOf date + the status word when the reading is not normal) — the
 * UsaTierCards / GoldContext / WorldRiskCards / EuropeTierCards pattern.
 * An absent reading (public mode's licence-hidden ids, a failed id)
 * renders the honest unavailable word, never a guess.
 *
 * Platform: browser only — this module lives in the lazy Asia route
 * chunk, never the entry graph.
 */

import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import {
  ASIA_CHINA_IDS,
  ASIA_JAPAN_IDS,
  ASIA_KOREA_TAIWAN_HK_IDS,
  ASIA_INDIA_IDS,
  ASIA_PACIFIC_NZ_IDS,
  asiaCardValueText,
  asiaCards,
  type AsiaCardEntry,
  type AsiaCardId,
  type AsiaUnitLabels,
} from './asia-tiles';
import { AsiaNzx50Card } from './AsiaNzx50Card';

/** The section id lists, typed against asia-tiles' own (never re-derived
 *  here — the section wiring rides the pure module's single source). */
const CHINA_ENTRY_IDS: readonly AsiaCardId[] = ASIA_CHINA_IDS as readonly AsiaCardId[];
const JAPAN_ENTRY_IDS: readonly AsiaCardId[] = ASIA_JAPAN_IDS as readonly AsiaCardId[];
const KOREA_ENTRY_IDS: readonly AsiaCardId[] = ASIA_KOREA_TAIWAN_HK_IDS as readonly AsiaCardId[];
const INDIA_ENTRY_IDS: readonly AsiaCardId[] = ASIA_INDIA_IDS as readonly AsiaCardId[];
const NZ_ENTRY_IDS: readonly AsiaCardId[] = ASIA_PACIFIC_NZ_IDS as readonly AsiaCardId[];

/** The card-name keys — 14 literal keys (the copy-pin test proves each
 *  matches the insights corpus byte-for-byte, both locales). */
const CARD_NAME_KEY: Readonly<Record<AsiaCardId, TranslationKey>> = {
  'china-pmi': 'pd.asiaPacific.cardNames.china-pmi',
  'china-cpi': 'pd.asiaPacific.cardNames.china-cpi',
  'oecd-cli-cn': 'pd.asiaPacific.cardNames.oecd-cli-cn',
  'gpr-china': 'pd.asiaPacific.cardNames.gpr-china',
  'gpr-taiwan': 'pd.asiaPacific.cardNames.gpr-taiwan',
  'china-property-investment': 'pd.asiaPacific.cardNames.china-property-investment',
  'china-steel-output': 'pd.asiaPacific.cardNames.china-steel-output',
  'jgb-10y': 'pd.asiaPacific.cardNames.jgb-10y',
  'boj-rate': 'pd.asiaPacific.cardNames.boj-rate',
  // S25 (BD-S23a): the three §15 D-36 CPI cards.
  'japan-cpi': 'pd.asiaPacific.cardNames.japan-cpi',
  'korea-cpi': 'pd.asiaPacific.cardNames.korea-cpi',
  'india-cpi': 'pd.asiaPacific.cardNames.india-cpi',
  'nz-short-rate': 'pd.asiaPacific.cardNames.nz-short-rate',
  'nz-10y': 'pd.asiaPacific.cardNames.nz-10y',
};

/** The position word keys (the corpus's own, pinned). */
const POSITION_WORD_KEY: Readonly<Record<'low' | 'typical' | 'high', TranslationKey>> = {
  low: 'pd.asiaPacific.positionLow',
  typical: 'pd.asiaPacific.positionTypical',
  high: 'pd.asiaPacific.positionHigh',
};

/** The status word keys (the corpus's own, pinned; 'context' has no key —
 *  a context reading is normal for a context-only id and speaks nothing). */
const STATUS_KEY: Record<string, TranslationKey> = {
  warning: 'pd.asiaPacific.statusWarning',
  stale: 'pd.asiaPacific.statusStale',
  'check-pending': 'pd.asiaPacific.statusCheckPending',
  unavailable: 'pd.asiaPacific.statusUnavailable',
};

/* ------------------------------------------------------------------ *
 * One Asia card
 * ------------------------------------------------------------------ */

function AsiaCard({ entry, units }: { entry: AsiaCardEntry; units: AsiaUnitLabels }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const name = t(CARD_NAME_KEY[entry.id]);

  // The VALUE — the DISPLAY registry's own join (asiaCardValueText).
  const valueText = asiaCardValueText(entry.id, reading, numberLocale, units);

  // The 10-YEAR POSITION — the position word + band, only when the
  // reading carries percentile10y (fail-closed: no percentile, no line).
  // The band word follows the legacy collapsed-line's OWN convention
  // (high → top {100−p}% · low → bottom {p}% · else the middle).
  const pct = reading?.percentile10y;
  const positionLine =
    pct !== undefined && Number.isFinite(pct)
      ? interpolate(t('pd.asiaPacific.positionWordLine'), {
          word:
            pct > 0.8
              ? t(POSITION_WORD_KEY.high)
              : pct < 0.2
                ? t(POSITION_WORD_KEY.low)
                : t(POSITION_WORD_KEY.typical),
          band:
            pct > 0.8
              ? interpolate(t('pd.asiaPacific.bandTop'), { p: formatNumber(Math.round((1 - pct) * 100), numberLocale) })
              : pct < 0.2
                ? interpolate(t('pd.asiaPacific.bandBottom'), { p: formatNumber(Math.round(pct * 100), numberLocale) })
                : t('pd.asiaPacific.bandMid'),
        })
      : null;

  // The FRESHNESS — the reading's own asOf + the status word when the
  // reading is not normal (the UsaTierCards / GoldContext / EuropeCard
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
      id={`asia-card-${entry.id}`}
      data-asia-card={entry.id}
      data-asia-status={reading?.status ?? 'absent'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
      {valueText !== null ? (
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-asia-value>
          {valueText}
        </bdi>
      ) : (
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.asiaPacific.valueUnavailable')}</p>
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
        {statusWord !== null ? <span data-asia-status-word>{statusWord}</span> : null}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * One Asia card section
 * ------------------------------------------------------------------ */

function AsiaSection({
  titleKey,
  introKey,
  ids,
  readings,
  units,
  dataSection,
  children,
}: {
  titleKey: TranslationKey;
  introKey: TranslationKey;
  ids: readonly AsiaCardId[];
  readings: readonly IndicatorReading[];
  units: AsiaUnitLabels;
  dataSection: string;
  /** Extra grid members after the registry cards (the Pacific—NZ
   * section's NZX50 mirror card, S21 — a board-row display, not a
   * registry card). */
  children?: React.ReactNode;
}): React.JSX.Element {
  const { t } = useI18n();
  const entries = asiaCards(readings, ids);
  return (
    <section aria-label={t(titleKey)} data-asia-section={dataSection} className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(titleKey)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t(introKey)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <AsiaCard key={entry.id} entry={entry} units={units} />
        ))}
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * One Asia index-note section (Korea/Taiwan/HK, India — their markets
 * ride the zoom map above; the §15 CPI cards render inside the same
 * sections' grids). The honest note names what rides the map, never a
 * silently-empty claim.
 * ------------------------------------------------------------------ */

function AsiaIndexNoteSection({
  titleKey,
  introKey,
  noteKey,
  ids,
  readings,
  units,
  dataSection,
}: {
  titleKey: TranslationKey;
  introKey: TranslationKey;
  noteKey: TranslationKey;
  ids: readonly AsiaCardId[];
  readings: readonly IndicatorReading[];
  units: AsiaUnitLabels;
  dataSection: string;
}): React.JSX.Element {
  const { t } = useI18n();
  const entries = asiaCards(readings, ids);
  return (
    <section aria-label={t(titleKey)} data-asia-section={dataSection} data-asia-index-note className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(titleKey)}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t(introKey)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {entries.map((entry) => (
          <AsiaCard key={entry.id} entry={entry} units={units} />
        ))}
      </div>
      {/* The honest index note — these markets ride the zoom map above;
          the CPI card beside it is the section's data card (S25, BD-S23a). */}
      <p className="m-0 mt-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
        <bdi>{t(noteKey)}</bdi>
      </p>
    </section>
  );
}

export function AsiaTierCards({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t } = useI18n();
  // The corpus-pinned unit labels, assembled once for the render pass
  // (the copy-pin test proves each word matches the corpus byte-for-byte).
  const units: AsiaUnitLabels = {
    percent: t('pd.asiaPacific.unitPercent'),
    points: t('pd.asiaPacific.unitPoints'),
    index: t('pd.asiaPacific.unitIndex'),
    tonnes: t('pd.asiaPacific.unitTonnes'),
  };
  return (
    <>
      <AsiaSection
        titleKey="pd.asiaPacific.china.title"
        introKey="pd.asiaPacific.china.intro"
        ids={CHINA_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="china"
      />
      <AsiaSection
        titleKey="pd.asiaPacific.japan.title"
        introKey="pd.asiaPacific.japan.intro"
        ids={JAPAN_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="japan"
      />
      <AsiaIndexNoteSection
        titleKey="pd.asiaPacific.koreaTaiwanHk.title"
        introKey="pd.asiaPacific.koreaTaiwanHk.intro"
        noteKey="pd.asiaPacific.koreaTaiwanHk.indexNote"
        ids={KOREA_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="korea-taiwan-hk"
      />
      <AsiaIndexNoteSection
        titleKey="pd.asiaPacific.india.title"
        introKey="pd.asiaPacific.india.intro"
        noteKey="pd.asiaPacific.india.indexNote"
        ids={INDIA_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="india"
      />
      <AsiaSection
        titleKey="pd.asiaPacific.pacificNz.title"
        introKey="pd.asiaPacific.pacificNz.intro"
        ids={NZ_ENTRY_IDS}
        readings={readings}
        units={units}
        dataSection="pacific-nz"
      >
        {/* S21 (BD-S21b): the §9 item 5 NZX50 leg — the AU board's own
            row mirrored here (one board, one vocabulary), linking to its
            home on /australia. */}
        <AsiaNzx50Card />
      </AsiaSection>
    </>
  );
}

/* The two index-note groups' id lists are re-exported here so the
 * render audit (AsiaPage.test.tsx) can assert their membership (the
 * honest index-note contract — the CPI cards render inside these
 * sections, the markets ride the zoom). */
export { ASIA_KOREA_TAIWAN_HK_IDS, ASIA_INDIA_IDS };
