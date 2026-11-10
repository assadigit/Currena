/**
 * CurrenciesPairBoard — the /currencies page's pair board (page-division
 * S18, 2026-11-12 — spec §12 item 2; D-42: the 11 pairs incl. AUDNZD).
 *
 * Every pair on the board, in the fx engine's own group order (Dollar vs
 * the world · Warning lights · Australia–China · Australia–New Zealand):
 * the latest RATE, the d1/m1/m3/y1 CHANGES, the MOVE RANK (0–100 — how
 * big this month's move is against the past year's rolling one-month
 * moves), the BIG-MOVE flag (moveRank ≥ 90, the §6.2 tag) and the
 * 52-WEEK CLOSES (the stored weekly series as a sparkline — day-spaced,
 * neutral ink, the honesty rules of the prices sparkline).
 *
 * ONE ROW BUILDER (the S18 gate): the rows arrive through
 * fx-presentation's `fxPairRows` — the SAME row builder the legacy
 * /insights pairs table renders through (imported, never restated), so
 * the board's membership + order can never drift from the engine's own
 * FX_PAIRS/FX_GROUP_ORDER. The signed-percent labels ride the SAME
 * fxSignedPct join the legacy table uses.
 *
 * Platform: browser only — this module lives in the lazy Currencies
 * route chunk, never the entry graph.
 */

import { useMemo } from 'react';
import { formatNumber } from '@currena/core';
import type { FxPairEntry, FxSnapshot } from '@currena/core';
import { decodeWeeklySeries } from '@currena/insights/markets/definitions';
import type { FxGroupId } from '@currena/insights/fx/definitions';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { fxPairRows } from '../../lib/fx-presentation';
import { fxSignedPct } from '../../lib/fx-presentation/format';
import { PriceSparkline } from '../../components/insights/PriceSparkline';
import type { TrendPoint } from '../../components/insights/price-trend';
import type { TranslationKey } from '../../lib/locale';

/** The pair-name keys — TOTAL over the 11 board ids (the copy-pin test
 *  proves each matches the insights corpus byte-for-byte, both locales). */
const PAIR_NAME_KEY: Readonly<Record<FxPairEntry['id'], TranslationKey>> = {
  eurusd: 'pd.currencies.pairNames.eurusd',
  usdjpy: 'pd.currencies.pairNames.usdjpy',
  gbpusd: 'pd.currencies.pairNames.gbpusd',
  usdchf: 'pd.currencies.pairNames.usdchf',
  usdcny: 'pd.currencies.pairNames.usdcny',
  audusd: 'pd.currencies.pairNames.audusd',
  audjpy: 'pd.currencies.pairNames.audjpy',
  eurjpy: 'pd.currencies.pairNames.eurjpy',
  eurchf: 'pd.currencies.pairNames.eurchf',
  audcny: 'pd.currencies.pairNames.audcny',
  audnzd: 'pd.currencies.pairNames.audnzd',
};

/** The board group-label keys (the corpus's own fx groups block). */
const GROUP_KEY: Readonly<Record<FxGroupId, TranslationKey>> = {
  dollarWorld: 'pd.currencies.groups.dollarWorld',
  warningLights: 'pd.currencies.groups.warningLights',
  chinaLink: 'pd.currencies.groups.chinaLink',
  auLink: 'pd.currencies.groups.auLink',
};

/** A pair's 52-week closes as sparkline points (day-spaced, the stored
 *  weekly series decoded — never interpolated, never invented). */
function sparkPointsOf(entry: FxPairEntry): TrendPoint[] {
  return decodeWeeklySeries(entry.weekly).map(([day, value]) => ({ day, value }));
}

/** One pair's row payload — the shared joins both layouts render. */
function pairRowTexts(
  entry: FxPairEntry,
  numberLocale: 'en-US' | 'fa-IR',
  locale: 'en' | 'fa',
): { rate: string; d1: string; m1: string; m3: string; y1: string; rank: string } {
  return {
    rate: formatNumber(entry.rate, numberLocale, { maximumFractionDigits: 4 }),
    d1: fxSignedPct(entry.chg.d1, numberLocale, locale),
    m1: fxSignedPct(entry.chg.m1, numberLocale, locale),
    m3: fxSignedPct(entry.chg.m3, numberLocale, locale),
    y1: fxSignedPct(entry.chg.y1, numberLocale, locale),
    rank: formatNumber(entry.moveRank, numberLocale, { maximumFractionDigits: 0 }),
  };
}

export function CurrenciesPairBoard({ snapshot }: { snapshot: FxSnapshot }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  // ONE row builder (the S18 gate): fxPairRows — the legacy table's own.
  const rows = useMemo(() => fxPairRows(snapshot.pairs, 'group'), [snapshot.pairs]);
  const todayIso = new Date().toISOString().slice(0, 10);
  // The board's as-of line: the newest date any pair or the dollar
  // measure carries (the WorldCurrencies asOf discipline).
  const asOf = useMemo(() => {
    const dates = snapshot.pairs.map((p) => p.asOf);
    dates.push(snapshot.dollarMeasure.asOf);
    return dates.reduce((max, d) => (d > max ? d : max), dates[0] ?? '');
  }, [snapshot]);

  const rowOf = (entry: FxPairEntry, group: FxGroupId, showGroup: boolean): React.JSX.Element => {
    const text = pairRowTexts(entry, numberLocale, locale);
    const stale = entry.stale || entry.asOf < todayIso;
    const points = sparkPointsOf(entry);
    const name = t(PAIR_NAME_KEY[entry.id]);
    return (
      <tr key={entry.id} data-currencies-pair={entry.id} data-currencies-pair-stale={stale ? 'true' : 'false'} className="border-b border-[var(--color-border)]/60 last:border-b-0">
        <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
          {showGroup ? (
            <span className="mb-0.5 block text-[0.66rem] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]" data-currencies-board-group>
              {t(GROUP_KEY[group])}
            </span>
          ) : null}
          {name}
          {entry.bigMove ? (
            <span className="ms-1.5 inline-flex items-center rounded-full bg-currena-warning/10 px-2 py-0.5 text-[0.66rem] font-bold text-[var(--color-status-watch)]" data-currencies-big-move>
              {t('pd.currencies.bigMoveTag')}
            </span>
          ) : null}
          {stale ? (
            <span className="ms-1.5 inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--color-text-tertiary)]" data-currencies-old-data>
              {interpolate(t('pd.currencies.oldData'), { date: entry.asOf })}
            </span>
          ) : null}
        </th>
        <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-bold">{text.rate}</bdi></td>
        <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr">{text.d1}</bdi></td>
        <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr">{text.m1}</bdi></td>
        <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr">{text.m3}</bdi></td>
        <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr">{text.y1}</bdi></td>
        <td className="px-2 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]"><bdi dir="ltr">{text.rank}</bdi></td>
        <td className="w-[130px] px-2 py-1">
          <div dir="ltr" className="not-prose">
            <PriceSparkline points={points} width={120} height={34} ariaLabel={`${name} — ${t('pd.currencies.th52w')}`} />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section aria-labelledby="currencies-board-title" data-currencies-board className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:mb-2">
        <div className="min-w-0">
          <h2 id="currencies-board-title" className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">
            {t('pd.currencies.boardTitle')}
          </h2>
          <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.currencies.boardIntro')}</p>
        </div>
        {asOf !== '' ? (
          <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {interpolate(t('pd.global.dataAsOf'), { date: asOf })}
          </bdi>
        ) : null}
      </div>

      {/* Desktop (≥900px): the table — every column D-42 lists. */}
      <div className="hidden min-[900px]:block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 ring-1 ring-[var(--color-border)] sm:p-3">
        <table className="w-full border-collapse text-[length:var(--type-caption)]">
          <caption className="sr-only">{t('pd.currencies.boardTitle')}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thPair')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thRate')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thToday')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thM1')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thM3')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thY1')}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thMoveRank')}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.th52w')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, group }, i) => rowOf(entry, group, i === 0 || rows[i - 1]!.group !== group))}
          </tbody>
        </table>
      </div>

      {/* Mobile (<900px): one card per pair — the same joins, stacked. */}
      <ul className="m-0 grid list-none gap-1.5 p-0 min-[900px]:hidden">
        {rows.map(({ entry, group }, i) => {
          const text = pairRowTexts(entry, numberLocale, locale);
          const stale = entry.stale || entry.asOf < todayIso;
          const points = sparkPointsOf(entry);
          const name = t(PAIR_NAME_KEY[entry.id]);
          const showGroup = i === 0 || rows[i - 1]!.group !== group;
          return (
            <li
              key={entry.id}
              data-currencies-pair={entry.id}
              data-currencies-pair-stale={stale ? 'true' : 'false'}
              className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)]"
            >
              {showGroup ? (
                <p className="m-0 mb-1 text-[0.66rem] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]" data-currencies-board-group>
                  {t(GROUP_KEY[group])}
                </p>
              ) : null}
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <h3 className="m-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h3>
                <bdi dir="ltr" className="text-[length:var(--type-label)] font-extrabold tabular-nums text-[var(--color-text-primary)]">{text.rate}</bdi>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[length:var(--type-caption)] tabular-nums">
                <span className="font-semibold text-[var(--color-text-secondary)]">{t('pd.currencies.thToday')} <bdi dir="ltr">{text.d1}</bdi></span>
                <span className="font-semibold text-[var(--color-text-secondary)]">{t('pd.currencies.thM1')} <bdi dir="ltr">{text.m1}</bdi></span>
                <span className="font-semibold text-[var(--color-text-secondary)]">{t('pd.currencies.thM3')} <bdi dir="ltr">{text.m3}</bdi></span>
                <span className="font-semibold text-[var(--color-text-secondary)]">{t('pd.currencies.thY1')} <bdi dir="ltr">{text.y1}</bdi></span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[length:var(--type-caption)]">
                <span className="font-semibold text-[var(--color-text-tertiary)]">{t('pd.currencies.thMoveRank')} <bdi dir="ltr">{text.rank}</bdi></span>
                {entry.bigMove ? (
                  <span className="inline-flex items-center rounded-full bg-currena-warning/10 px-2 py-0.5 text-[0.66rem] font-bold text-[var(--color-status-watch)]" data-currencies-big-move>
                    {t('pd.currencies.bigMoveTag')}
                  </span>
                ) : null}
                {stale ? (
                  <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--color-text-tertiary)]" data-currencies-old-data>
                    {interpolate(t('pd.currencies.oldData'), { date: entry.asOf })}
                  </span>
                ) : null}
              </div>
              <div dir="ltr" className="not-prose mt-1.5">
                <PriceSparkline points={points} width={280} height={40} ariaLabel={`${name} — ${t('pd.currencies.th52w')}`} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
