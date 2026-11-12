/**
 * WorldMarketsBriefing — the legacy section's editorial layer restored on
 * the standalone /world-markets page (the 2026-11-12 owner round: the
 * "pulse of world markets" briefing the refactored page had omitted).
 *
 * Three surfaces, each a faithful port of the legacy /insights section's
 * own anatomy (the owner: "I worked hard on their UI/UX, so make sure
 * they are present in this new page"):
 *
 *   1. THE BREADTH HEADLINE (MarketsVerdict's R9-06 layer, §3.2): the
 *      selected period's up/down/flat counts as LARGE numbers over a
 *      proportional green/red/grey bar, under the period's own label,
 *      with the stated flat band — marketBreadth's ONE ±1% definition,
 *      raw values, honest denominator (coverage note when a stored row
 *      predates the lens).
 *   2. THE TWO FEATURED MOVERS (MarketMovers, §3.4): true extrema of the
 *      RAW selected-period values — topMovers, never a fake winner; the
 *      96/112 wordmark, the signed hero number in the bright return inks
 *      with the crisp triangle, the separate 52-week-distance line with
 *      its status chip, and the unambiguous period caption.
 *   3. THE REGIONAL TILE EXPLORER (MarketTile + MarketDetail, §3.5/§6.3):
 *      three labelled groups east→west (Asia-Pacific · Europe ·
 *      Americas), one quiet button-tile per index — the stacked ≥96px
 *      wordmark, the canonical name + country, the selected-period
 *      return + triangle, the 52-week-distance tag EVERY tile carries
 *      (the correcting/bear rings the warning tone), the delayed/old
 *      honesty tags — expanding the detail panel (the 52-week chart +
 *      the levels) under its group, one open at a time.
 *
 * D-48 discipline (never a second arithmetic): every number flows through
 * the SAME pure helpers the legacy section reads — marketBreadth /
 * topMovers / periodValueOf (briefing.ts), viewValue / signOf /
 * returnToneClass / DirTriangle / statusToneOf / statusWordKeyOf / isOld /
 * tradingDaysBehind (shared.tsx) — and the REUSED MarketsChart drawing.
 * The words arrive through the corpus-pinned pd.worldMarkets keys
 * (world-markets-copy-pin.test.ts pins them byte-for-byte against the
 * insights corpus in both locales — the lean chunk never imports the
 * corpus, the WorldMapCopy adapter pattern).
 *
 * The lens: the page owns the MarketsView and hands it to the hero's map
 * as a CONTROLLED period (PERIOD_OF_VIEW below — the legacy bridge), so
 * the map's segmented switch stays the page's ONE period control, exactly
 * as the 2026-10-21 unification round established on the legacy section.
 */

import { useCallback, useMemo, useState } from 'react';
import type { MarketEntry, MarketId, MarketGroupId, MarketsSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { MARKETS, MARKET_GROUP_ORDER, decodeWeeklySeries } from '@currena/insights/markets/definitions';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { MarketsChart } from '../../components/insights/MarketsChart';
import type { MarketsChartCopy } from '../../components/insights/MarketsChart';
import { MarketLogo } from '../../components/insights/world-markets/MarketLogo';
import { MarketsTreemap } from '../../components/insights/world-markets/MarketsTreemap';
import { formatAsOf } from '../../components/insights/HistoryChart';
import { marketBreadth, topMovers, periodValueOf } from '../../components/insights/world-markets/briefing';
import type { MarketBreadth } from '../../components/insights/world-markets/briefing';
import {
  DirTriangle,
  NO_READING,
  returnToneClass,
  signOf,
  signedPct,
  signedPctOrDash,
  statusToneOf,
  statusWordKeyOf,
  tradingDaysBehind,
  trendOf,
  viewValue,
  isOld,
  type MarketsView,
} from '../../components/insights/world-markets/shared';
import type { StockStateWordKey } from '../../components/insights/world-markets/shared';
import type { MapPeriod } from '../../components/insights/world-markets/world-map-config';

/* ------------------------------------------------------------------ *
 * The lens bridge — the legacy section's own closed-set lookup tables
 * (2026-10-21 unification round): the map's switch speaks MapPeriod,
 * the briefing speaks MarketsView; the page owns the view and hands the
 * map the period, so ONE switch drives the hero, the breadth, the movers
 * and the tiles.
 * ------------------------------------------------------------------ */

export const PERIOD_OF_VIEW: Record<MarketsView, MapPeriod> = {
  today: '1D',
  '1w': '1W',
  '1m': '1M',
  '3m': '3M',
  '1y': '1Y',
  '5y': '5Y',
};

export const VIEW_OF_PERIOD: Record<MapPeriod, MarketsView> = {
  '1D': 'today',
  '1W': '1w',
  '1M': '1m',
  '3M': '3m',
  '1Y': '1y',
  '5Y': '5y',
};

/* The localized period word for a lens — one mapping drives every
 * mention of "which period am I in" (the corpus's own map period words,
 * pinned byte-for-byte). */
const PERIOD_WORD_KEY: Record<MarketsView, TranslationKey> = {
  today: 'pd.worldMarkets.map.periodWordToday',
  '1w': 'pd.worldMarkets.map.periodWordWeek',
  '1m': 'pd.worldMarkets.map.periodWordMonth',
  '3m': 'pd.worldMarkets.map.periodWord3M',
  '1y': 'pd.worldMarkets.map.periodWordYear',
  '5y': 'pd.worldMarkets.map.periodWord5Y',
};

/* The status words (the L2-01 −5/−10/−20 convention) — the corpus's own,
 * the same keys the region grids speak. */
const STATUS_KEY: Record<StockStateWordKey, TranslationKey> = {
  statusNearHigh: 'pd.worldMarkets.statusNearHigh',
  statusPullback: 'pd.worldMarkets.statusPullback',
  statusCorrection: 'pd.worldMarkets.statusCorrection',
  statusBear: 'pd.worldMarkets.statusBear',
};

/* The trend band's words (chg3m ±1%) — the corpus's own. */
const TREND_KEY: Record<'up' | 'flat' | 'down', TranslationKey> = {
  up: 'pd.worldMarkets.trendUp',
  flat: 'pd.worldMarkets.trendFlat',
  down: 'pd.worldMarkets.trendDown',
};

const GROUP_KEY: Record<MarketGroupId, TranslationKey> = {
  asia: 'pd.worldMarkets.groups.asia',
  europe: 'pd.worldMarkets.groups.europe',
  americas: 'pd.worldMarkets.groups.americas',
};

/* ------------------------------------------------------------------ *
 * 1 — the breadth headline (MarketsVerdict's R9-06 layer, §3.2)
 * ------------------------------------------------------------------ */

const BREADTH_TONE: Record<'up' | 'down' | 'flat', string> = {
  up: 'text-[var(--color-return-up)]',
  down: 'text-[var(--color-return-down)]',
  flat: 'text-[var(--color-text-secondary)]',
};

const BREADTH_BAR: Record<'up' | 'down' | 'flat', string> = {
  up: 'bg-[var(--color-return-up)]',
  down: 'bg-[var(--color-return-down)]',
  flat: 'bg-[var(--color-text-tertiary)] opacity-40',
};

function BreadthBlock({ breadth, periodWord }: { breadth: MarketBreadth; periodWord: string }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const cells: Array<['up' | 'down' | 'flat', string, number]> = [
    ['up', t('pd.worldMarkets.breadthUp'), breadth.up],
    ['down', t('pd.worldMarkets.breadthDown'), breadth.down],
    ['flat', t('pd.worldMarkets.breadthFlat'), breadth.flat],
  ];
  const barTotal = breadth.up + breadth.down + breadth.flat;
  return (
    <div
      data-markets-breadth-block
      className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
    >
      <p className="m-0 mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          <bdi>{interpolate(t('pd.worldMarkets.breadthPeriod'), { period: periodWord })}</bdi>
        </span>
        {breadth.valid < breadth.total ? (
          <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(t('pd.worldMarkets.coverageNote'), { count: num(breadth.valid), total: num(breadth.total) })}</bdi>
          </span>
        ) : null}
      </p>
      {/* DOM order keeps dt → dd (label then number) inside each block;
       * the blocks lay out number-first via flex-col-reverse (§3.2). */}
      <dl className="m-0 grid grid-cols-3 gap-2" data-markets-breadth>
        {cells.map(([kind, label, count]) => (
          <div
            key={kind}
            data-breadth-kind={kind}
            className="flex flex-col-reverse items-center justify-end gap-1.5 rounded-[var(--radius-sm)] bg-currena-soft/50 px-1.5 py-2.5 ring-1 ring-[var(--color-border)]/60"
          >
            <dt className="text-center text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">{label}</dt>
            <dd className={`m-0 text-[1.75rem] font-bold leading-none tabular-nums sm:text-[2rem] ${BREADTH_TONE[kind]}`}>
              <bdi>{num(count)}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      {/* The proportional breadth bar (R9-06): decorative — aria-hidden,
       * the numbers carry the meaning; in RTL the row mirrors with the
       * document direction, which is exactly the reading order the
       * counts above already speak. */}
      {barTotal > 0 ? (
        <div
          aria-hidden="true"
          data-markets-breadth-bar
          className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full ring-1 ring-[var(--color-border)]/70"
        >
          <span style={{ flexGrow: breadth.up }} className={BREADTH_BAR.up} />
          <span style={{ flexGrow: breadth.down }} className={BREADTH_BAR.down} />
          <span style={{ flexGrow: breadth.flat }} className={BREADTH_BAR.flat} />
        </div>
      ) : null}
      {/* S1-M1.6 #2: the flat threshold stated — the band that decides
       * up/flat/down is a rule the reader can check against the numbers. */}
      <p className="m-0 mt-1.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-markets-flat-band-note>
        {t('pd.worldMarkets.flatBandNote')}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — the two featured movers (MarketMovers, §3.4)
 * ------------------------------------------------------------------ */

function MoverCard({
  entry,
  kind,
  view,
  periodWord,
}: {
  entry: MarketEntry;
  kind: 'gain' | 'fall';
  view: MarketsView;
  periodWord: string;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const pct = periodValueOf(entry, view);
  // The ink + triangle follow the NUMBER'S own sign; the gainer/decliner
  // VALENCE stays on the card's title label (a decliner card can still
  // carry a bright green weekly number when that week rose).
  const dir = signOf(pct);
  const atHigh = entry.fromHigh > -0.5;
  const name = t(`pd.worldMarkets.entries.${entry.id}.name`);
  const country = t(`pd.worldMarkets.entries.${entry.id}.country`);
  const latin = t(`pd.worldMarkets.entries.${entry.id}.latin`);
  const aria = interpolate(t('pd.worldMarkets.valueAria'), {
    name,
    country,
    value: pct === null ? t('pd.worldMarkets.noReadingAria') : signedPct(pct, numberLocale, locale),
    period: periodWord,
  });
  return (
    <article
      data-markets-biggest={kind}
      aria-label={aria}
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
    >
      {/* The card's own role label wears the calm valence ink. */}
      <p
        className={`m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide ${
          kind === 'gain' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
        }`}
      >
        {kind === 'gain' ? t('pd.worldMarkets.moverGain') : t('pd.worldMarkets.moverLoss')}
      </p>
      <div className="flex min-w-0 items-center gap-3">
        {/* The featured mover wordmark: 96px (112 on desktop) — the
         * 2026-10-18 owner follow-up's ≥96px floor. */}
        <MarketLogo id={entry.id} latin={latin} size={96} desktopSize={112} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1rem] font-bold leading-snug text-[var(--color-text-primary)]">
            {name}
            {locale === 'fa' ? (
              <span lang="en" dir="ltr" className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
                {latin}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{country}</span>
        </span>
      </div>
      {/* The hero number: the bright return inks + the crisp triangle; a
       * missing lens reading renders the honest dash (never a fake 0). */}
      <p
        className={`m-0 inline-flex items-center gap-1.5 text-[length:var(--type-number)] font-bold leading-none ${
          dir === 'flat' ? 'text-[var(--color-text-primary)]' : returnToneClass(dir)
        }`}
      >
        <bdi dir="ltr" className="type-number tabular-nums">
          {pct === null ? NO_READING : signedPct(pct, numberLocale, locale)}
        </bdi>
        {pct === null ? null : <DirTriangle dir={dir} size={14} />}
      </p>
      {/* The quiet secondary line: the distance from the 52-week high — a
       * SEPARATE metric, never the period's return (§3.3). */}
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <span>{t('pd.worldMarkets.thFromHigh')}:</span>
        <bdi dir="ltr" className="font-semibold tabular-nums text-[var(--color-text-secondary)]">
          {signedPct(entry.fromHigh, numberLocale, locale)}
        </bdi>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
            atHigh ? 'bg-currena-success/10 text-[var(--color-status-normal)]' : statusToneOf(entry.fromHigh)
          }`}
        >
          {atHigh ? t('pd.worldMarkets.atHighTag') : t(STATUS_KEY[statusWordKeyOf(entry.fromHigh)])}
        </span>
      </p>
      {/* The unambiguous period caption (§3.4). */}
      <p className="m-0 mt-auto text-[0.68rem] font-semibold text-[var(--color-text-tertiary)]">
        <bdi>{interpolate(t('pd.worldMarkets.moverPeriodLabel'), { period: periodWord })}</bdi>
      </p>
    </article>
  );
}

/** §3.4's honest empty state — no valid values, no fake winner. */
function MoverEmpty({ kind }: { kind: 'gain' | 'fall' }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <article
      data-markets-biggest={kind}
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-4"
    >
      <p
        className={`m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide ${
          kind === 'gain' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
        }`}
      >
        {kind === 'gain' ? t('pd.worldMarkets.moverGain') : t('pd.worldMarkets.moverLoss')}
      </p>
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {t('pd.worldMarkets.moversNone')}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * 3a — one market tile (MarketTile, §6.3: quiet by default, real button)
 * ------------------------------------------------------------------ */

function BriefingTile({
  entry,
  view,
  open,
  todayIso,
  freshestIso,
  onToggle,
}: {
  entry: MarketEntry;
  view: MarketsView;
  open: boolean;
  todayIso: string;
  /** The snapshot's freshest close — the delayed tag's baseline (A7). */
  freshestIso: string;
  onToggle: (id: MarketId) => void;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const { pct } = viewValue(entry, view);
  const dir = signOf(pct);
  const old = isOld(entry, todayIso);
  const delayed = !old && tradingDaysBehind(entry.asOf, freshestIso) > 1;
  // F5: EVERY tile shows its distance from the 52-week high (not only the
  // correcting markets); the correcting/bear tiles keep their warning ring.
  const tagX = formatNumber(Math.abs(entry.fromHigh), numberLocale, { maximumFractionDigits: 0 });
  const name = t(`pd.worldMarkets.entries.${entry.id}.name`);
  const country = t(`pd.worldMarkets.entries.${entry.id}.country`);
  const latin = t(`pd.worldMarkets.entries.${entry.id}.latin`);
  const periodWord = t(PERIOD_WORD_KEY[view]);
  const srValue = pct === null ? t('pd.worldMarkets.noReadingAria') : signedPct(pct, numberLocale, locale);
  return (
    <button
      type="button"
      id={`insights-market-tile-${entry.id}`}
      aria-expanded={open}
      aria-controls={`insights-market-detail-${entry.id}`}
      data-markets-tile={entry.id}
      onClick={() => onToggle(entry.id)}
      className={`insights-focusable flex min-h-[44px] w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] px-2.5 py-2 text-start ring-1 transition-colors ${
        entry.status === 'correction'
          ? 'ring-currena-warning/30 hover:bg-currena-warning/[0.06]'
          : entry.status === 'bear'
            ? 'ring-currena-warning/40 hover:bg-currena-warning/[0.06]'
            : 'ring-[var(--color-border)] hover:bg-currena-soft/60'
      } ${open ? 'bg-currena-warning/[0.05]' : 'bg-[var(--color-surface)]'} ${old ? 'opacity-80' : ''}`}
    >
      {/* The identity row: the stacked ≥96px wordmark above the canonical
       * name + country (the explorer tiles stay narrow at 2→7 columns). */}
      <span className="flex w-full flex-col gap-1.5">
        <MarketLogo id={entry.id} latin={latin} size={96} desktopSize={96} />
        <span className="min-w-0">
          <span className="block truncate text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-secondary)]">
            {name}
          </span>
          <span className="block truncate text-[0.68rem] leading-snug text-[var(--color-text-tertiary)]">{country}</span>
        </span>
      </span>
      {/* The selected-period return: the bright return inks + the crisp
       * triangle; a missing lens shows the honest dash, never a guess. */}
      <span className={`inline-flex items-center gap-1 font-semibold ${returnToneClass(dir)}`}>
        <bdi dir="ltr" className="type-number tabular-nums">
          {signedPctOrDash(pct, numberLocale, locale)}
        </bdi>
        {pct === null ? null : <DirTriangle dir={dir} size={11} />}
      </span>
      {/* The 52-week distance tag EVERY tile carries. */}
      {entry.fromHigh > -0.5 ? (
        <span className="inline-flex items-center rounded-full bg-currena-success/10 px-2 py-0.5 text-[0.68rem] font-bold text-[var(--color-status-normal)]">
          {t('pd.worldMarkets.atHighTag')}
        </span>
      ) : (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${statusToneOf(entry.fromHigh)}`}>
          {interpolate(t('pd.worldMarkets.tileTagBelow'), { x: tagX })}
        </span>
      )}
      {delayed ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          {t('pd.worldMarkets.delayedTag')}
        </span>
      ) : null}
      {old ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-stale)]">
          {interpolate(t('pd.worldMarkets.oldDataLine'), { date: formatAsOf(entry.asOf, locale) })}
        </span>
      ) : null}
      {/* §9: the screen reader hears name, country, selected period and
       * value, then the trend word + the status word + the as-of date. */}
      <span className="sr-only">
        {interpolate(t('pd.worldMarkets.valueAria'), { name, country, value: srValue, period: periodWord })}
        , {t(TREND_KEY[trendOf(entry)])}, {t(STATUS_KEY[statusWordKeyOf(entry.fromHigh)])},{' '}
        {interpolate(t('pd.worldMarkets.asOfLine'), { date: formatAsOf(entry.asOf, locale) })}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * 3b — the detail panel (MarketDetail's board-true anatomy, §6.5): the
 * identity row, the REUSED 52-week chart, and the levels — every value a
 * stored field, never a re-derivation.
 * ------------------------------------------------------------------ */

function BriefingDetail({ entry }: { entry: MarketEntry }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  const atHigh = entry.fromHigh > -0.5;
  const name = t(`pd.worldMarkets.entries.${entry.id}.name`);
  const country = t(`pd.worldMarkets.entries.${entry.id}.country`);
  const latin = t(`pd.worldMarkets.entries.${entry.id}.latin`);
  const chartCopy = useMemo<MarketsChartCopy>(
    () => ({
      markets: {
        chartAria: t('pd.worldMarkets.chartAria'),
        high52wLabel: t('pd.worldMarkets.high52wLabel'),
        low52wLabel: t('pd.worldMarkets.low52wLabel'),
        lastCloseLabel: t('pd.worldMarkets.lastCloseLabel'),
      },
      ui: { na: t('pd.worldMarkets.naWord') },
    }),
    [t],
  );
  const levels: Array<[string, string]> = [
    [t('pd.worldMarkets.lastCloseLabel'), formatNumber(entry.close, numberLocale, { maximumFractionDigits: entry.close >= 1000 ? 0 : 2 })],
    [t('pd.worldMarkets.high52wLabel'), formatNumber(entry.high52w, numberLocale, { maximumFractionDigits: entry.high52w >= 1000 ? 0 : 2 })],
    [t('pd.worldMarkets.low52wLabel'), formatNumber(entry.low52w, numberLocale, { maximumFractionDigits: entry.low52w >= 1000 ? 0 : 2 })],
  ];
  return (
    <div
      id={`insights-market-detail-${entry.id}`}
      className="mt-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
    >
      {/* The heading row: the same ≥96px wordmark + name + country + the
       * 52-week status chip every surface wears. */}
      <p className="m-0 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <MarketLogo id={entry.id} latin={latin} size={96} desktopSize={96} />
        <span className="min-w-0">
          <span className="block truncate text-[length:var(--type-number)] font-bold leading-tight text-[var(--color-text-primary)]">
            {name}
          </span>
          <span className="block truncate text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
            {country}
            {locale === 'fa' ? (
              <span lang="en" dir="ltr" className="ms-1.5">
                {latin}
              </span>
            ) : null}
          </span>
        </span>
        <span className={`ms-auto inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${statusToneOf(entry.fromHigh)}`}>
          {atHigh ? t('pd.worldMarkets.atHighTag') : t(STATUS_KEY[statusWordKeyOf(entry.fromHigh)])}
        </span>
      </p>
      {/* §6.5: time runs left to right on the chart in Farsi too. */}
      <div dir="ltr" className="not-prose">
        <MarketsChart weekly={weekly} close={entry.close} high52w={entry.high52w} low52w={entry.low52w} copy={chartCopy} numberLocale={numberLocale} />
      </div>
      <dl className="m-0 mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {levels.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{label}</dt>
            <dd className="m-0">
              <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
                {value}
              </bdi>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.worldMarkets.thFromHigh')}</dt>
          <dd className="m-0">
            <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
              {signedPct(entry.fromHigh, numberLocale, locale)}
            </bdi>
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dd className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(t('pd.worldMarkets.asOfLine'), { date: formatAsOf(entry.asOf, locale) })}</bdi>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The section
 * ------------------------------------------------------------------ */

export function WorldMarketsBriefing({
  snapshot,
  view,
  todayIso,
}: {
  snapshot: MarketsSnapshot;
  /** The selected return lens — the page-owned view the map's switch
   * drives (one period control for the whole page). */
  view: MarketsView;
  todayIso: string;
}): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const [openId, setOpenId] = useState<MarketId | null>(null);
  const periodWord = t(PERIOD_WORD_KEY[view]);

  const onToggleTile = useCallback((id: MarketId) => {
    // One panel open at a time (§6.3); the newly opened panel scrolls
    // into view so a keyboard/tap activation is never answered with an
    // invisible panel (the legacy onOpenRow discipline).
    setOpenId((prev) => {
      const next = prev === id ? null : id;
      if (next !== null) {
        requestAnimationFrame(() => {
          document.getElementById(`insights-market-detail-${next}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }
      return next;
    });
  }, []);

  const breadth = useMemo(() => marketBreadth(snapshot.markets, view), [snapshot, view]);
  const movers = useMemo(() => topMovers(snapshot.markets, view), [snapshot, view]);
  // The freshest close any market carries — the delayed tag's baseline.
  const freshestIso = useMemo(
    () => snapshot.markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), snapshot.markets[0]?.asOf ?? todayIso),
    [snapshot, todayIso],
  );

  const groups = useMemo(
    () =>
      MARKET_GROUP_ORDER.map((group) => ({
        group,
        entries: MARKETS.filter((m) => m.group === group)
          .map((m) => snapshot.markets.find((e) => e.id === m.id))
          .filter((e): e is MarketEntry => e !== undefined),
      })),
    [snapshot],
  );

  return (
    <section aria-label={t('pd.worldMarkets.briefingAria')} data-wm-briefing className="mt-3 flex flex-col gap-3 scroll-mt-24 sm:mt-5 sm:gap-4">
      <h2 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {t('pd.worldMarkets.briefingHeading')}
      </h2>

      {/* The breadth headline + the two featured movers — the owner's
       * approved three-card row (breadth · biggest gain · biggest fall). */}
      <div className="grid gap-3 lg:grid-cols-3">
        <BreadthBlock breadth={breadth} periodWord={periodWord} />
        {movers.gainer !== null ? (
          <MoverCard entry={movers.gainer} kind="gain" view={view} periodWord={periodWord} />
        ) : (
          <MoverEmpty kind="gain" />
        )}
        {movers.decliner !== null ? (
          <MoverCard entry={movers.decliner} kind="fall" view={view} periodWord={periodWord} />
        ) : (
          <MoverEmpty kind="fall" />
        )}
      </div>

      {/* UI-27 (the legacy §3.3 note): returns are in each market's own
       * currency — explaining every tile below it. */}
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-local-currency-note>
        {t('pd.worldMarkets.localCurrencyNote')}
      </p>

      {/* The market heat map (the 2026-11-12 treemap round): the TE-style
       * treemap between the movers and the regional explorer — tile size
       * ≈ market cap, colour ≈ the selected period's return, the tiles
       * opening the SAME detail panel the explorer's tiles open (the
       * shared openId — one panel at a time, never two entry points
       * diverging). */}
      <MarketsTreemap snapshot={snapshot} view={view} openId={openId} onToggle={onToggleTile} />

      {/* The regional tile explorer (§3.5): three labelled groups, the
       * world waking up east to west (§6.3) — DOM order = trading-day
       * order; in Farsi the RTL flow puts Asia-Pacific at the right. */}
      <div className="flex flex-col gap-3">
        {groups.map(({ group, entries }) => {
          if (entries.length === 0) return null;
          const openEntry = entries.find((e) => e.id === openId) ?? null;
          return (
            <div key={group} data-markets-region={group} aria-label={t(GROUP_KEY[group])}>
              {/* Region headings create the explorer's rhythm (§3.5) —
               * counts from the loaded dataset, never a hardcoded 16. */}
              <h3 className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                {t(GROUP_KEY[group])}{' '}
                <span className="font-semibold">
                  ({formatNumber(entries.length, numberLocale, { maximumFractionDigits: 0 })})
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {entries.map((entry) => (
                  <BriefingTile
                    key={entry.id}
                    entry={entry}
                    view={view}
                    open={openId === entry.id}
                    todayIso={todayIso}
                    freshestIso={freshestIso}
                    onToggle={onToggleTile}
                  />
                ))}
              </div>
              {/* The open market's detail panel renders under ITS group
               * (§6.3) — only one panel is open at a time. */}
              {openEntry !== null ? <BriefingDetail entry={openEntry} /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
