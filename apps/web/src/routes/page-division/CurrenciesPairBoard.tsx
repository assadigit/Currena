/**
 * CurrenciesPairBoard — the Currencies page's 11-pair board (page-division
 * S18, 2026-11-11 — spec §12 item 2; D-42).
 *
 * The ELEVEN pairs the rule lights read — EURUSD · USDJPY · GBPUSD ·
 * USDCHF · USDCNY · AUDUSD · AUDJPY · EURJPY · EURCHF · AUDCNY · AUDNZD
 * (the S18 11th pair, D-42) — each card rendering straight off the fx
 * snapshot's stored row:
 *
 *   - the RATE (the legacy detail panel's own join — formatNumber with
 *     maximumFractionDigits 4);
 *   - the four period changes d1/m1/m3/y1 through the legacy
 *     world-currencies display's own `signedPct` (1dp, +/−, the fa ٪
 *     suffix), each under the corpus's own period word;
 *   - the MOVE RANK 0–100 (§6.2) as a number + a bar;
 *   - the BIG-MOVE flag (§6.2's only extra tag) when moveRank ≥ 90;
 *   - the 52-WEEK CLOSES as the house stretched-SVG line (the legacy
 *     PairYearChart drawing: 52 weekly closes, time left-to-right even in
 *     Farsi);
 *   - the honest old-data tag when the stored row is stale (the client
 *     V6 twin: the served `stale` flag OR asOf > 5 calendar days).
 *
 * The gold crosses (XAUUSD, XAUAUD) stay on /gold (D-18); the §21-trio
 * view of the seven registry pairs renders in CurrenciesTierCards — this
 * board is the pair-table surface, not a second reading.
 *
 * Platform: browser only — this module lives in the lazy Currencies route
 * chunk, never the entry graph.
 */

import { useMemo } from 'react';
import type { FxPairEntry, FxPairId, FxSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { decodeWeeklySeries } from '@currena/insights/markets/definitions';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { signedPct } from '../../components/insights/world-currencies/display';
import { CURRENCIES_BOARD_PAIR_IDS } from './currencies-tiles';

/** The pair-name keys — 11 literal keys (the copy-pin test proves each
 *  matches the insights corpus's own fx.entries name, both locales). */
const PAIR_NAME_KEY: Readonly<Record<FxPairId, TranslationKey>> = {
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

/** §9.4's 1-year line chart — the house stretched-SVG pattern, zero deps
 *  (the legacy PairYearChart drawing restated lean for the 52-week
 *  closes). Time left-to-right even in Farsi. */
function PairYearChart({ weekly }: { weekly: readonly [number, number][] }): React.JSX.Element | null {
  if (weekly.length < 2) return null;
  const PLOT_W = 320;
  const PLOT_H = 56;
  let min = Infinity;
  let max = -Infinity;
  for (const [, v] of weekly) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const pad = (max - min) * 0.05 || max * 0.001 || 1;
  min -= pad;
  max += pad;
  const firstDay = weekly[0]![0];
  const lastDay = weekly[weekly.length - 1]![0];
  const span = Math.max(1, lastDay - firstDay);
  const scaleY = (v: number): number => PLOT_H - ((v - min) / (max - min)) * PLOT_H;
  const scaleX = (day: number): number => ((day - firstDay) / span) * PLOT_W;
  const line = weekly
    .map(([day, v], i) => `${i === 0 ? 'M' : 'L'}${scaleX(day).toFixed(2)} ${Math.max(1, Math.min(PLOT_H - 1, scaleY(v))).toFixed(2)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: 56 }}
      aria-hidden="true"
    >
      <path d={line} fill="none" stroke="var(--color-text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** One pair's card — the D-42 fields (rate · d1/m1/m3/y1 · moveRank ·
 *  bigMove · 52-week closes). */
function PairCard({ entry, todayIso }: { entry: FxPairEntry; todayIso: string }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  // Client-side V6 (§9.5): the honest old-data evaluation — the served
  // stale flag OR asOf more than 5 calendar days back.
  const days = Math.round((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${entry.asOf}T00:00:00Z`)) / 86_400_000);
  const old = entry.stale === true || days > 5;
  const rateText = formatNumber(entry.rate, numberLocale, { maximumFractionDigits: 4 });
  const moveRankText = formatNumber(Math.round(entry.moveRank), numberLocale);

  const periods: { key: TranslationKey; value: number }[] = [
    { key: 'pd.currencies.thToday', value: entry.chg.d1 },
    { key: 'pd.currencies.thM1', value: entry.chg.m1 },
    { key: 'pd.currencies.thM3', value: entry.chg.m3 },
    { key: 'pd.currencies.thY1', value: entry.chg.y1 },
  ];

  return (
    <article
      id={`currencies-pair-${entry.id}`}
      data-currencies-pair={entry.id}
      data-currencies-pair-big-move={entry.bigMove ? 'true' : undefined}
      data-currencies-pair-stale={old ? 'true' : undefined}
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
          {t(PAIR_NAME_KEY[entry.id])}
        </h4>
        {entry.bigMove ? (
          <span className="inline-flex items-center rounded-full bg-currena-warning/10 px-2 py-0.5 text-[0.66rem] font-bold text-[var(--color-status-watch)]">
            {t('pd.currencies.bigMoveTag')}
          </span>
        ) : null}
        {old ? (
          <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--color-text-stale)]">
            {interpolate(t('pd.currencies.oldData'), { date: entry.asOf })}
          </span>
        ) : null}
      </div>
      {/* The RATE — the legacy detail panel's own join. */}
      <bdi dir="ltr" className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-currencies-pair-rate>
        {rateText}
      </bdi>
      {/* The four period changes, each under the corpus's own word. */}
      <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-0.5 sm:grid-cols-4">
        {periods.map((p) => (
          <div key={p.key} className="flex min-w-0 items-baseline gap-1.5">
            <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t(p.key)}</dt>
            <dd className="m-0">
              <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-primary)]">
                {signedPct(p.value, numberLocale, locale)}
              </bdi>
            </dd>
          </div>
        ))}
      </dl>
      {/* The move rank 0–100 — the number + the bar. */}
      <div className="flex items-center gap-2">
        <span className="verdict-meter !h-1.5 max-w-[120px]" data-progress={Math.round(entry.moveRank)} aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`verdict-meter-seg ${entry.moveRank >= i * 25 ? `on-${Math.min(i, 4)}` : ''}`} />
          ))}
        </span>
        <span className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
          <bdi>{t('pd.currencies.thMoveRank')}: </bdi>
          <bdi dir="ltr" data-currencies-pair-moverank>{moveRankText}</bdi>
        </span>
      </div>
      {/* The 52-week closes — the house stretched-SVG line. */}
      <div dir="ltr" className="not-prose">
        <span className="sr-only">{t('pd.currencies.weeks52Label')}</span>
        <PairYearChart weekly={weekly} />
      </div>
    </article>
  );
}

export function CurrenciesPairBoard({ snapshot, todayIso }: { snapshot: FxSnapshot; todayIso: string }): React.JSX.Element {
  const { t } = useI18n();
  // D-42's order — the engine table's own (audnzd last), never the wire's
  // incidental order; an absent pair simply renders no card (never a zero).
  const byId = new Map(snapshot.pairs.map((p) => [p.id as string, p]));
  return (
    <section aria-label={t('pd.currencies.boardTitle')} data-currencies-section="board" className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.currencies.boardTitle')}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.currencies.boardIntro')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {CURRENCIES_BOARD_PAIR_IDS.flatMap((id) => {
          const entry = byId.get(id);
          return entry === undefined ? [] : [<PairCard key={id} entry={entry} todayIso={todayIso} />];
        })}
      </div>
      <p className="m-0 mt-2 text-[0.66rem] text-[var(--color-text-tertiary)]">
        <bdi>{t('pd.currencies.boardFooter')}</bdi>
      </p>
    </section>
  );
}
