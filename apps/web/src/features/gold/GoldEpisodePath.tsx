/**
 * GoldEpisodePath — GPE R25 / F6 (2026-11-19): the Episode Explorer's
 * DATA-GATED halves (the s15 M1 §7 S15-D4 record) — one record's
 * price path (the WGC workbook spine slice, the honest waiting state
 * until the drop lands) + the per-record since-episode returns and the
 * zone's comparison-rider table (the 1/5/10/20y windows per leg, each
 * window named at point of use per C1, every cell a leg's depth cannot
 * support rendering the honest not-enough-history state — the hasData
 * grammar extended to the table).
 *
 * The computations are the PURE engine's own (@currena/insights'
 * episodePath/windowReturn/sinceReturn — never a second arithmetic);
 * the components only format. Display-only: no meter membership.
 */

import { useMemo } from 'react';
import type { GoldEpisodesSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import {
  EPISODE_WINDOW_YEARS,
  episodePath,
  episodeSeriesViews,
  monthDiff,
  pathExtremes,
  sinceReturn,
  windowReturn,
} from '@currena/insights';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { GoldEpisodeRecord } from './gold-episodes-records';

/** One record's price path (the spine slice or the honest waiting state). */
export function GoldEpisodePath({
  record,
  snapshot,
}: {
  record: GoldEpisodeRecord;
  snapshot: GoldEpisodesSnapshot | null;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const num = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });

  const model = useMemo(() => {
    if (snapshot === null) return null;
    const padMonths = monthDiff(record.period.end, record.period.start) > 36 ? 6 : 3;
    const path = episodePath(snapshot, record.period.start, record.period.end, padMonths);
    if (path.length < 2) return null;
    return { path, extremes: pathExtremes(path) };
  }, [snapshot, record]);

  const monthText = (ym: string): string => {
    const date = new Date(`${ym}-01T00:00:00Z`);
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  /** The SVG polyline (the vaultSparkPath grammar). */
  const sparkPath = useMemo(() => {
    if (model === null) return '';
    const values = model.path.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    const w = 200;
    const h = 40;
    return model.path
      .map((p, i) => {
        const x = (i / (model.path.length - 1)) * w;
        const y = h - 3 - ((p.value - min) / span) * (h - 6);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [model]);

  if (model === null) {
    return (
      <div className="flex min-w-0 flex-col gap-1" data-episode-path="waiting">
        <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epPathTitle')}</h5>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-episode-path-waiting>
          <bdi>{t('pd.gold.epPathWaiting')}</bdi>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1" data-episode-path="ready">
      <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epPathTitle')}</h5>
      <div dir="ltr" className="w-full overflow-hidden" data-episode-path-chart>
        <svg viewBox="0 0 200 40" role="img" aria-label={t('pd.gold.epPathTitle')} className="h-auto w-full">
          <path d={sparkPath} fill="none" stroke="var(--color-accent-gold)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-episode-path-extremes>
        <bdi>
          {interpolate(t('pd.gold.epPathExtremes'), {
            from: num(model.path[0]!.value),
            to: num(model.path[model.path.length - 1]!.value),
            min: num(model.extremes!.min.value),
            max: num(model.extremes!.max.value),
          })}
        </bdi>
      </p>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-episode-path-source>
        <bdi>{interpolate(t('pd.gold.epPathSource'), { month: monthText(snapshot!.asOf) })}</bdi>
      </p>
    </div>
  );
}

/** The comparison legs' display rows (gold + whatever the snapshot carries). */
function windowRows(snapshot: GoldEpisodesSnapshot | null) {
  if (snapshot === null) return null;
  return episodeSeriesViews(snapshot).map((view) => ({
    view,
    windows: EPISODE_WINDOW_YEARS.map((years) => windowReturn(view, snapshot.asOf, years)),
  }));
}

/** The zone's comparison rider — the 1/5/10/20y windows table (the
 *  legs the snapshot carries, every window named at point of use,
 *  every depth-short cell the honest no-data state) + the shared
 *  past-returns footnote. */
export function GoldEpisodeComparison({ snapshot }: { snapshot: GoldEpisodesSnapshot | null }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const rows = useMemo(() => windowRows(snapshot), [snapshot]);
  const num = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });

  if (rows === null) {
    return (
      <div className="flex min-w-0 flex-col gap-1" data-episode-comparison="waiting">
        <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epComparisonTitle')}</h5>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-episode-comparison-waiting>
          <bdi>{t('pd.gold.epComparisonWaiting')}</bdi>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-episode-comparison="ready">
      <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epComparisonTitle')}</h5>
      <div className="overflow-x-auto" data-episode-comparison-table>
        <table className="w-full min-w-[420px] border-collapse text-[length:var(--type-caption)]">
          <thead>
            <tr className="text-[var(--color-text-tertiary)]">
              <th scope="col" className="px-1.5 py-1 text-start font-semibold" />
              {EPISODE_WINDOW_YEARS.map((years) => (
                <th scope="col" key={years} className="px-1.5 py-1 text-end font-semibold">
                  <bdi>{t(years === 1 ? 'pd.gold.epWindow1y' : years === 5 ? 'pd.gold.epWindow5y' : years === 10 ? 'pd.gold.epWindow10y' : 'pd.gold.epWindow20y')}</bdi>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ view, windows }) => (
              <tr key={view.seriesNamed} className="border-t border-[var(--color-border)]/60">
                <th scope="row" className="px-1.5 py-1 text-start font-semibold text-[var(--color-text-secondary)]">
                  <bdi>{view.seriesNamed}</bdi>
                </th>
                {windows.map((w, i) => (
                  <td key={i} className="px-1.5 py-1 text-end text-[var(--color-text-primary)]">
                    {w === null ? (
                      <span className="text-[var(--color-text-tertiary)]" title={t('pd.gold.epWindowNoData')}>
                        <bdi>{t('pd.gold.epWindowNoData')}</bdi>
                      </span>
                    ) : (
                      <bdi dir="ltr">{`${w.pct >= 0 ? '+' : '−'}${num(Math.abs(w.pct))}%`}</bdi>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-episode-past-note>
        <bdi>{t('pd.gold.epPastReturnsNote')}</bdi>
      </p>
    </div>
  );
}

/** One record's since-episode returns (the per-record rider line —
 *  gold + the legs the snapshot carries, each honest-null safe). */
export function GoldEpisodeSince({
  record,
  snapshot,
}: {
  record: GoldEpisodeRecord;
  snapshot: GoldEpisodesSnapshot | null;
}): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const num = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });
  const entries = useMemo(() => {
    if (snapshot === null) return null;
    // The anchor month: the record's own end month (YYYY or YYYY-MM —
    // the YYYY form anchors at December).
    const endMonth = record.period.end.length === 4 ? `${record.period.end}-12` : record.period.end;
    return episodeSeriesViews(snapshot)
      .map((view) => ({ view, since: sinceReturn(view, endMonth) }))
      .filter((r): r is { view: typeof r.view; since: NonNullable<typeof r.since> } => r.since !== null);
  }, [snapshot, record]);

  if (entries === null || entries.length === 0) return null;

  return (
    <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-episode-since>
      <bdi>
        {t('pd.gold.epSinceTitle')}:{' '}
        {entries
          .map(({ view, since }) => `${view.seriesNamed.split(' — ')[0]}: ${since.pct >= 0 ? '+' : '−'}${num(Math.abs(since.pct))}%`)
          .join(' · ')}
      </bdi>
    </p>
  );
}
