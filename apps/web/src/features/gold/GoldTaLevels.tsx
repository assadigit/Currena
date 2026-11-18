/**
 * GoldTaLevels — GPE R19 / F8 (2026-11-18): the minimal TA band, Zone H
 * (s6/01 §4 rule 2 · s6/03 zone H · s8/01 R19 · the C5 honesty rules).
 * The SMA 20/50/100/200 reference rows + the distance-from-200DMA
 * decile + the dated 50/200 cross events (whipsaws included) + the
 * classic daily/weekly pivots («سطوح پیوت» vocabulary, classic-only
 * guard). Every level labelled DESCRIPTIVE REFERENCE (C5 rule 1);
 * display-only, no meter membership (C5 rule 4).
 *
 * Data: the R18 OHLC leg via the SHARED module-cached hook (one fetch
 * for the chart + this band). The decile's basis window is the STORED
 * series' own span (S13-D1's honest posture — the sentence names it;
 * the basis self-widens when the owner's plan does).
 *
 * Placement: Zone H — between the seats (G) and the RATIOS (I). The
 * distance-decile sentence cross-links the chart (#insights-signals —
 * the Signals section's own stable anchor).
 *
 * 390 (s6/03 zone H): the header + the distance-decile sentence stay
 * visible; the tables sit behind ONE tap (the session-only toggle, the
 * bridge's pattern). Desktop renders expanded by default.
 */

import { useMemo, useState } from 'react';
import { formatJalaliDate, formatNumber } from '@currena/core';
import {
  classicDailyPivots,
  classicWeeklyPivots,
  crossEvents,
  distanceFromSma200,
  smaRows,
  type TaPivotSet,
} from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldXauOhlc } from './gold-xau';

/** One month's honest wording for a stored-basis span (in days). */
function basisWord(spanDays: number, t: ReturnType<typeof useI18n>['t'], numberLocale: 'en-US' | 'fa-IR'): string {
  if (spanDays < 335) {
    return interpolate(t('pd.gold.chartSpanMonths'), {
      n: formatNumber(Math.max(1, Math.round(spanDays / 30.4)), numberLocale, { maximumFractionDigits: 0 }),
    });
  }
  return interpolate(t('pd.gold.chartSpanYears'), {
    years: formatNumber(Math.round((spanDays / 365.25) * 10) / 10, numberLocale, { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
  });
}

/** The EN ordinal suffix (78th, 21st, 2nd, 3rd) for the percentile word. */
function ordinalEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export function GoldTaLevels(): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const state = useGoldXauOhlc();
  const series = state.kind === 'ready' ? state.snapshot.series : null;
  // The 390 rule (s6/03 zone H): collapsed by default on small viewports,
  // expanded on desktop — session-only (the bridge's pattern). The
  // matchMedia probe is guarded (environments without the media query
  // implementation degrade to the desktop default).
  const [open, setOpen] = useState(() => {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 640px)').matches !== true ? false : true;
    } catch {
      return true;
    }
  });

  // The pure derivations (the engine, imported — no arithmetic here).
  const sma = useMemo(() => (series !== null ? smaRows(series) : []), [series]);
  const distance = useMemo(() => (series !== null ? distanceFromSma200(series) : null), [series]);
  const crosses = useMemo(() => (series !== null ? crossEvents(series) : []), [series]);
  const dailyPivots = useMemo(() => (series !== null ? classicDailyPivots(series) : null), [series]);
  const weeklyPivots = useMemo(() => (series !== null ? classicWeeklyPivots(series) : null), [series]);

  if (state.kind === 'loading') {
    return (
      <section aria-label={t('pd.gold.taTitle')} data-gold-ta-levels="loading" className="mt-3 scroll-mt-24 sm:mt-5" role="status">
        <h3 className="type-section m-0">{t('pd.gold.taTitle')}</h3>
        <p className="m-0 mt-1 text-[length:var(--type-label)] text-currena-muted">{t('pd.gold.loadingLine')}</p>
      </section>
    );
  }
  if (series === null || series.length < 2) {
    // The honest absent state (the rung has not landed / nothing stored).
    return (
      <section aria-label={t('pd.gold.taTitle')} data-gold-ta-levels="none" className="mt-3 scroll-mt-24 sm:mt-5">
        <h3 className="type-section m-0">{t('pd.gold.taTitle')}</h3>
        <p className="m-0 mt-1 text-[length:var(--type-label)] text-currena-muted">{t('pd.gold.taUnavailable')}</p>
      </section>
    );
  }

  const fmt = (v: number, digits = 0): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dateText = (date: string): string =>
    locale === 'fa' ? formatJalaliDate(date, 'fa-IR') : formatShortEn(date);

  /* The distance-decile sentence — the zone's ALWAYS-VISIBLE takeaway
   * (the 390 rule). The basis window is named from the data (S13-D1). */
  const distanceSentence = (() => {
    if (distance === null) return null;
    const pctText = `${distance.pct > 0 ? '+' : ''}${fmt(Math.abs(distance.pct), 1)}%`;
    if (distance.decile === null || distance.basis === null) {
      return interpolate(t('pd.gold.taDistanceNoDecile'), {
        pct: pctText,
        dir: t(distance.pct >= 0 ? 'pd.gold.taDirAbove' : 'pd.gold.taDirBelow'),
      });
    }
    const spanDays = (Date.parse(distance.basis.to) - Date.parse(distance.basis.from)) / 86_400_000;
    const decileWord =
      locale === 'fa'
        ? interpolate(t('pd.gold.taDecile'), { n: formatNumber(Math.round(distance.decile * 100), numberLocale, { maximumFractionDigits: 0 }) })
        : ordinalEn(Math.round(distance.decile * 100));
    return interpolate(t('pd.gold.taDistance'), {
      pct: pctText,
      dir: t(distance.pct >= 0 ? 'pd.gold.taDirAbove' : 'pd.gold.taDirBelow'),
      decile: decileWord,
      window: basisWord(spanDays, t, numberLocale),
    });
  })();

  /** One pivot block (the classic levels, values right-aligned). */
  const pivotBlock = (pivots: TaPivotSet, oneLinerKey: 'pd.gold.taPivotOneLinerDaily' | 'pd.gold.taPivotOneLinerWeekly'): React.JSX.Element => (
    <div className="flex min-w-0 flex-col gap-1.5" data-ta-pivot-set>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-currena-muted">
        <bdi>{t(oneLinerKey)}</bdi>
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {/* Supports then resistances (the s6/03 390 order), each block's
         * rows values right-aligned; PP spans above them. */}
        <div className="rounded-[var(--radius-sm)] bg-currena-soft/50 p-2 ring-1 ring-[var(--color-border)]/60">
          <h5 className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">{t('pd.gold.taPivotSupport')}</h5>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {(['s1', 's2', 's3'] as const).map((k) => (
              <li key={k} className="flex items-baseline justify-between gap-2 text-[length:var(--type-label)]">
                <span className="font-semibold text-currena-muted">{k.toUpperCase()}</span>
                <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="font-bold tabular-nums text-[var(--color-text-primary)]">
                  {fmt(pivots[k], 1)}
                </bdi>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-currena-soft/50 p-2 ring-1 ring-[var(--color-border)]/60">
          <h5 className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">{t('pd.gold.taPivotResistance')}</h5>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {(['r1', 'r2', 'r3'] as const).map((k) => (
              <li key={k} className="flex items-baseline justify-between gap-2 text-[length:var(--type-label)]">
                <span className="font-semibold text-currena-muted">{k.toUpperCase()}</span>
                <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="font-bold tabular-nums text-[var(--color-text-primary)]">
                  {fmt(pivots[k], 1)}
                </bdi>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {interpolate(t('pd.gold.taPivotFrom'), { date: dateText(pivots.date) })}
      </p>
    </div>
  );

  return (
    <section
      id="gold-ta"
      aria-labelledby="gold-ta-title"
      data-gold-ta-levels
      className="mt-3 scroll-mt-24 sm:mt-5"
    >
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="gold-ta-title" className="type-section m-0">{t('pd.gold.taTitle')}</h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="gold-ta-body"
          onClick={() => setOpen(!open)}
          className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          data-ta-toggle
        >
          <span aria-hidden="true">
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
            />
          </span>
          {open ? t('pd.gold.taHide') : t('pd.gold.taShow')}
        </button>
      </header>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {t('pd.gold.taSubtitle')}
      </p>

      {/* The ALWAYS-VISIBLE takeaway (the 390 rule): the distance-decile
       * sentence, its basis named (S13-D1), cross-linking the chart. */}
      {distanceSentence !== null ? (
        <p className="m-0 mb-2 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-ta-distance>
          <bdi>
            {distanceSentence}
            {' '}
            <a href="#insights-signals" className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
              {t('pd.gold.taChartLink')}
            </a>
          </bdi>
        </p>
      ) : null}

      {open ? (
        <div id="gold-ta-body" className="flex flex-col gap-3.5">
          {/* The SMA rows — the series named at the table header (C1:
           * the anti-GPE-S3-04 clause), the shared one-liner under it. */}
          <div className="flex flex-col gap-1.5">
            <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.taSmaTitle')}</h4>
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]" data-ta-series-note>
              <bdi>{t('pd.gold.taSeriesNote')}</bdi>
            </p>
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-currena-muted">
              <bdi>{t('pd.gold.taSmaOneLiner')}</bdi>
            </p>
            <ul className="m-0 grid grid-cols-2 gap-1.5 p-0 sm:grid-cols-4" data-ta-sma-rows>
              {sma.map((row) => (
                <li
                  key={row.window}
                  data-ta-sma={row.window}
                  className="flex items-baseline justify-between gap-2 rounded-[var(--radius-sm)] bg-currena-soft/50 px-2 py-1.5 ring-1 ring-[var(--color-border)]/60"
                >
                  <span className="text-[length:var(--type-caption)] font-semibold text-currena-muted">
                    {interpolate(t('pd.gold.taSmaRow'), { n: formatNumber(row.window, numberLocale, { maximumFractionDigits: 0 }) })}
                  </span>
                  <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)]">
                    {fmt(row.value, 1)}
                  </bdi>
                </li>
              ))}
            </ul>
            {sma.length === 0 ? (
              <p className="m-0 text-[length:var(--type-caption)] text-currena-muted">{t('pd.gold.taSmaNone')}</p>
            ) : null}
          </div>

          {/* The dated cross events — C5 rule 2: events with what followed,
           * whipsaws included, newest first. */}
          <div className="flex flex-col gap-1.5">
            <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.taCrossTitle')}</h4>
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-currena-muted">
              <bdi>{t('pd.gold.taCrossOneLiner')}</bdi>
            </p>
            {crosses.length > 0 ? (
              <ul className="m-0 flex list-none flex-col gap-1 p-0" data-ta-crosses>
                {crosses.map((cross) => (
                  <li
                    key={cross.date}
                    data-ta-cross={cross.kind}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-[var(--radius-sm)] bg-currena-soft/50 px-2 py-1.5 text-[length:var(--type-label)] ring-1 ring-[var(--color-border)]/60"
                  >
                    <bdi className="font-semibold text-[var(--color-text-secondary)]">{dateText(cross.date)}</bdi>
                    <span className={`font-bold ${cross.kind === 'golden' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'}`}>
                      {t(cross.kind === 'golden' ? 'pd.gold.taCrossGolden' : 'pd.gold.taCrossDeath')}
                    </span>
                    {cross.followedBy20d !== null ? (
                      <bdi dir="ltr" className="ms-auto text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                        {interpolate(t('pd.gold.taCrossFollow'), {
                          v: `${cross.followedBy20d > 0 ? '+' : ''}${fmt(Math.abs(cross.followedBy20d), 1)}%`,
                        })}
                      </bdi>
                    ) : (
                      <span className="ms-auto text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.gold.taCrossTruncated')}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[length:var(--type-caption)] text-currena-muted" data-ta-cross-none>{t('pd.gold.taCrossNone')}</p>
            )}
          </div>

          {/* The classic pivots — daily first, then weekly (the second
           * table behind the same expansion, per the s6/03 zone H note). */}
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.taPivotsDailyTitle')}</h4>
              {dailyPivots !== null ? (
                pivotBlock(dailyPivots, 'pd.gold.taPivotOneLinerDaily')
              ) : (
                <p className="m-0 text-[length:var(--type-caption)] text-currena-muted">{t('pd.gold.taPivotNone')}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.taPivotsWeeklyTitle')}</h4>
              {weeklyPivots !== null ? (
                pivotBlock(weeklyPivots, 'pd.gold.taPivotOneLinerWeekly')
              ) : (
                <p className="m-0 text-[length:var(--type-caption)] text-currena-muted">{t('pd.gold.taPivotNone')}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** A short EN date (the words form, UTC). */
function formatShortEn(date: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return fmt.format(Date.parse(`${date}T00:00:00Z`));
}
