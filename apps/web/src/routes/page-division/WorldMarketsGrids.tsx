/**
 * WorldMarketsGrids — the three region grids (page-division S7,
 * 2026-11-08 — spec §6 item 2: Asia 7 · Europe 4 · Americas 5).
 *
 * Every row renders the session's own contract — the five return lenses
 * (chg 1d/1w/1m/3m/1y), the 52-wk range position (a visual track with
 * the position marker, the honest sr sentence beside it), the 3-month
 * trend band (trendOf's ±1% rule) and the correction −10% / bear −20%
 * status (statusWordKeyOf's L2-01 convention) — through the SAME pure
 * derivations world-markets-tiles computes off the board (D-48: the
 * numbers are the stored ones, never re-derived here). The presentation
 * follows the section's own table discipline: a real <table> with
 * <th scope> at ≥900px, a vertical row list below (the MarketsTable
 * pattern), the bright return inks + triangles for the return cells
 * (the 2026-10-27 owner round), and the UI-27 local-currency note
 * visible whenever the grids are.
 */

import type { MarketId, MarketsSnapshot, MarketGroupId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { MARKET_GROUP_ORDER } from '@currena/insights/markets/definitions';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { DirTriangle, NO_READING, returnToneClass, signOf, signedPct } from '../../components/insights/world-markets/shared';
import type { WorldMarketsRegionModel, WorldMarketsRowModel } from './world-markets-tiles';
import { worldMarketsRegionGrids } from './world-markets-tiles';

/* The group words — the corpus's own (pinned by world-markets-copy-pin). */
const GROUP_KEY: Record<MarketGroupId, TranslationKey> = {
  asia: 'pd.worldMarkets.groups.asia',
  europe: 'pd.worldMarkets.groups.europe',
  americas: 'pd.worldMarkets.groups.americas',
};

/* The trend band's words (chg3m ±1%) — the corpus's own. */
const TREND_KEY: Record<'up' | 'flat' | 'down', TranslationKey> = {
  up: 'pd.worldMarkets.trendUp',
  flat: 'pd.worldMarkets.trendFlat',
  down: 'pd.worldMarkets.trendDown',
};

/* The status words (the L2-01 −5/−10/−20 convention) — the corpus's own. */
const STATUS_KEY: Record<'statusNearHigh' | 'statusPullback' | 'statusCorrection' | 'statusBear', TranslationKey> = {
  statusNearHigh: 'pd.worldMarkets.statusNearHigh',
  statusPullback: 'pd.worldMarkets.statusPullback',
  statusCorrection: 'pd.worldMarkets.statusCorrection',
  statusBear: 'pd.worldMarkets.statusBear',
};

/* ------------------------------------------------------------------ *
 * One return cell — the MarketsTable PctCell pattern: the signed value
 * in the vivid return tokens with the crisp triangle (the ink, the sign
 * and the triangle all speak the SAME number; colour is never alone).
 * A null lens keeps the honest neutral dash.
 * ------------------------------------------------------------------ */
function PctCell({
  pct,
  numberLocale,
  locale,
  label,
}: {
  pct: number | null;
  numberLocale: 'en-US' | 'fa-IR';
  locale: 'en' | 'fa';
  /** The column's sr-only name (the mobile list's label glue). */
  label?: string;
}) {
  if (pct === null) {
    return (
      <bdi dir="ltr" className="font-semibold text-[var(--color-text-secondary)]">
        {NO_READING}
        {label ? <span className="sr-only"> {label}</span> : null}
      </bdi>
    );
  }
  const dir = signOf(pct);
  return (
    <bdi dir="ltr" className={`inline-flex items-center justify-end gap-0.5 font-semibold ${returnToneClass(dir)}`}>
      <DirTriangle dir={dir} size={8} />
      {signedPct(pct, numberLocale, locale)}
      {label ? <span className="sr-only"> {label}</span> : null}
    </bdi>
  );
}

/* ------------------------------------------------------------------ *
 * The 52-wk range position — the visual track with the position marker
 * (spec §6 item 2). The marker sits at rangePos% of the track (logical
 * inline-start, so RTL mirrors exactly like the reading order); the sr
 * sentence + the title carry the numbers. Decorative track — the words
 * carry the meaning.
 * ------------------------------------------------------------------ */
function RangeCell({ row, numberLocale, locale }: { row: WorldMarketsRowModel; numberLocale: 'en-US' | 'fa-IR'; locale: 'en' | 'fa' }) {
  const { t } = useI18n();
  if (row.rangePos === null || row.fromHigh === null) {
    return (
      <bdi dir="ltr" className="font-semibold text-[var(--color-text-secondary)]">
        {NO_READING}
      </bdi>
    );
  }
  const sr = interpolate(t('pd.worldMarkets.rangeSr'), { p: formatNumber(Math.round(row.rangePos), numberLocale) });
  const title = `${sr} · ${signedPct(row.fromHigh, numberLocale, locale)}`;
  return (
    <span className="inline-flex min-w-[84px] flex-col gap-1" title={title}>
      <span
        aria-hidden="true"
        className="relative block h-1.5 w-full rounded-full bg-currena-muted/25 ring-1 ring-[var(--color-border)]/70"
      >
        <span
          className="absolute top-1/2 block h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-text-primary)] shadow-sm"
          style={{ insetInlineStart: `calc(${Math.min(Math.max(row.rangePos, 0), 100)}% - 6px)` }}
        />
      </span>
      <span className="sr-only">{sr}</span>
    </span>
  );
}

/** The market's name line — name + the small Latin name in fa (§6.7). */
function NameLine({ id, locale }: { id: MarketId; locale: 'en' | 'fa' }) {
  const { t } = useI18n();
  return (
    <>
      {t(`pd.worldMarkets.entries.${id}.name`)}
      {locale === 'fa' ? (
        <span lang="en" dir="ltr" className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
          {t(`pd.worldMarkets.entries.${id}.latin`)}
        </span>
      ) : null}
    </>
  );
}

/** The delayed/old tags (A7 + the client-side R6) — the map's own words. */
function RowTags({ row }: { row: WorldMarketsRowModel }) {
  const { t } = useI18n();
  return (
    <>
      {row.daysBehind > 1 ? (
        <span className="rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          {t('pd.worldMarkets.delayedTag')}
        </span>
      ) : null}
      {row.old ? (
        <span className="rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          {t('pd.worldMarkets.map.oldData')}
        </span>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * One region — the desktop table (≥900px) + the mobile row list.
 * ------------------------------------------------------------------ */
function RegionGrid({ region }: { region: WorldMarketsRegionModel }) {
  const { t, locale, numberLocale } = useI18n();
  const groupWord = t(GROUP_KEY[region.group]);
  return (
    <div data-wm-region={region.group} className="min-w-0 scroll-mt-24">
      <h3 className="m-0 mb-1.5 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {groupWord}{' '}
        <span className="font-semibold text-[var(--color-text-tertiary)]">
          ({formatNumber(region.rows.length, numberLocale, { maximumFractionDigits: 0 })})
        </span>
      </h3>

      {/* Desktop (≥900px): the real table. */}
      <div className="hidden min-[900px]:block">
        <table className="w-full border-collapse text-[length:var(--type-caption)]" data-wm-table={region.group}>
          <caption className="sr-only">{interpolate(t('pd.worldMarkets.regionTableLabel'), { group: groupWord })}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thMarket')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thToday')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thWeek')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thMonth')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.th3m')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thYear')}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thRange52w')}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thTrend')}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.worldMarkets.thStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {region.rows.map((row) => (
              <tr key={row.id} id={`wm-row-${row.id}`} data-wm-row={row.id} className="border-b border-[var(--color-border)]/60 last:border-b-0">
                <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                  <NameLine id={row.id} locale={locale} />
                  <span className="ms-1.5 inline-flex gap-1 align-baseline">
                    <RowTags row={row} />
                  </span>
                </th>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <PctCell pct={row.chg1d} numberLocale={numberLocale} locale={locale} />
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <PctCell pct={row.chg1w} numberLocale={numberLocale} locale={locale} />
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <PctCell pct={row.chg1m} numberLocale={numberLocale} locale={locale} />
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <PctCell pct={row.chg3m} numberLocale={numberLocale} locale={locale} />
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <PctCell pct={row.chg1y} numberLocale={numberLocale} locale={locale} />
                </td>
                <td className="px-2 py-1.5">
                  <RangeCell row={row} numberLocale={numberLocale} locale={locale} />
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                  {row.trend !== null ? (
                    <>
                      <span aria-hidden="true" className="me-1 inline-flex align-[-2px]">
                        <DirTriangle dir={row.trend} size={10} />
                      </span>
                      {t(TREND_KEY[row.trend])}
                    </>
                  ) : (
                    <bdi dir="ltr" className="font-semibold text-[var(--color-text-secondary)]">{NO_READING}</bdi>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {row.statusKey !== null ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${row.statusToneClass ?? ''}`} data-wm-status={row.statusKey}>
                      {t(STATUS_KEY[row.statusKey])}
                    </span>
                  ) : (
                    <bdi dir="ltr" className="font-semibold text-[var(--color-text-secondary)]">{NO_READING}</bdi>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile (<900px): the same numbers as vertical rows — the
       * MarketsTable list pattern: a one-time label header, then one
       * real-button row per market (name + the five changes inline, the
       * range track + trend word + status pill under them). */}
      <p className="m-0 mb-1 flex items-baseline justify-between px-2.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)] min-[900px]:hidden">
        <span>{t('pd.worldMarkets.thMarket')}</span>
        <span dir="ltr" className="inline-flex gap-2.5">
          <span>{t('pd.worldMarkets.thToday')}</span>
          <span>{t('pd.worldMarkets.thWeek')}</span>
          <span>{t('pd.worldMarkets.thMonth')}</span>
          <span>{t('pd.worldMarkets.th3m')}</span>
          <span>{t('pd.worldMarkets.thYear')}</span>
        </span>
      </p>
      <ul className="m-0 grid list-none gap-1 p-0 min-[900px]:hidden">
        {region.rows.map((row) => (
          <li key={row.id} id={`wm-row-${row.id}`}>
            <div
              className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-start ring-1 ring-[var(--color-border)]"
              data-wm-row-card={row.id}
            >
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
                <span className="min-w-0 font-semibold text-[var(--color-text-primary)]">
                  <NameLine id={row.id} locale={locale} />
                </span>
                <RowTags row={row} />
                {row.statusKey !== null ? (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${row.statusToneClass ?? ''}`} data-wm-status={row.statusKey}>
                    {t(STATUS_KEY[row.statusKey])}
                  </span>
                ) : null}
              </span>
              <span className="inline-flex items-baseline gap-2.5 text-[length:var(--type-caption)] font-semibold tabular-nums">
                <PctCell pct={row.chg1d} numberLocale={numberLocale} locale={locale} label={t('pd.worldMarkets.thToday')} />
                <PctCell pct={row.chg1w} numberLocale={numberLocale} locale={locale} label={t('pd.worldMarkets.thWeek')} />
                <PctCell pct={row.chg1m} numberLocale={numberLocale} locale={locale} label={t('pd.worldMarkets.thMonth')} />
                <PctCell pct={row.chg3m} numberLocale={numberLocale} locale={locale} label={t('pd.worldMarkets.th3m')} />
                <PctCell pct={row.chg1y} numberLocale={numberLocale} locale={locale} label={t('pd.worldMarkets.thYear')} />
              </span>
              <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="min-w-[110px] flex-1">
                  <RangeCell row={row} numberLocale={numberLocale} locale={locale} />
                </span>
                {row.trend !== null ? (
                  <span className="inline-flex items-center text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                    <span aria-hidden="true" className="me-1 inline-flex align-[-2px]">
                      <DirTriangle dir={row.trend} size={10} />
                    </span>
                    {t(TREND_KEY[row.trend])}
                  </span>
                ) : null}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The section
 * ------------------------------------------------------------------ */

export function WorldMarketsGrids({ snapshot, todayIso }: { snapshot: MarketsSnapshot; todayIso: string }): React.JSX.Element {
  const { t } = useI18n();
  const grids = worldMarketsRegionGrids(snapshot, todayIso);
  return (
    <section aria-label={t('pd.worldMarkets.gridsAria')} data-wm-grids className="flex flex-col gap-3.5 scroll-mt-24">
      <div>
        <h2 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {t('pd.worldMarkets.gridsHeading')}
        </h2>
        {/* UI-27 (kept — the owner's "keep the new data… and reliability"):
         * returns are in each market's own currency, so the percentages
         * beside each other are not directly comparable. */}
        <p className="m-0 mt-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-local-currency-note>
          {t('pd.worldMarkets.localCurrencyNote')}
        </p>
      </div>
      {MARKET_GROUP_ORDER.map((group) => {
        const grid = grids.find((g) => g.group === group);
        return grid !== undefined ? <RegionGrid key={group} region={grid} /> : null;
      })}
    </section>
  );
}
