/**
 * GoldPriceSpark — the hero price block's HouseTimeSeries spark
 * (GUX-S5 M3b, 12 §3.1 row 4.1 + 12 §1.5): a compact zero-dependency
 * line of the XAUUSD daily closes over the stored series' own true
 * span — the house chart grammar in its smallest fidelity (stretched
 * SVG geometry, every word as HTML, dir="ltr" root, the series and its
 * window NAMED at point of use per C1, honest spans — never a "1 year"
 * label over a different series length).
 *
 * NOT the shared Sparkline: that component is the entry-graph's (the
 * converter's live-rate rows ride it); the gold route's lean chunk
 * composes this from the page's own OHLC leg (the module-cached
 * useGoldXauOhlc fetch — ONE fetch shared with the interactive chart
 * and the TA band, never a second download). The grammar rules are the
 * same family (normalized polyline, end dot, MIN_REL_RANGE-style honest
 * padding, aria from the record's word fidelity).
 *
 * Honest states: loading (the dashed waiting line), unavailable (the
 * calm no-series line, never a guess) — the chart fail-closes exactly
 * like its R18 siblings.
 */

import { useMemo } from 'react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldXauOhlc } from './gold-xau';

/** Plot geometry (the house stretched-SVG convention). */
const W = 320;
const H = 56;
const PAD = 5;

/** Minimum relative range — the Sparkline's own honesty rule: a calm
 *  series renders proportionally calm, never a full-amplitude sawtooth
 *  over re-quote jitter. */
const MIN_REL_RANGE = 0.025;

/** The months window the spark draws — the LAST 90 stored bars (~3
 *  months of trading days), a named, honest span (C1: the label states
 *  what is actually drawn; the full series stays the interactive
 *  chart's own). */
const SPARK_BARS = 90;

export function GoldPriceSpark(): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const state = useGoldXauOhlc();
  const series = state.kind === 'ready' ? state.snapshot.series : null;

  const view = useMemo(() => {
    if (series === null) return null;
    const bars = series.slice(-SPARK_BARS);
    if (bars.length < 2) return null;
    const closes = bars.map((b) => b.close);
    const first = closes[0]!;
    const last = closes[closes.length - 1]!;
    const changePct = ((last - first) / first) * 100;
    return {
      n: bars.length,
      from: bars[0]!.date,
      to: bars[bars.length - 1]!.date,
      changePct,
      closes,
    };
  }, [series]);

  // The honest states — fail-closed, never a guess.
  if (view === null) {
    if (state.kind === 'loading' || state.kind === 'ready') {
      return (
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-price-spark="waiting" role="status">
          {t('pd.gold.loadingLine')}
        </p>
      );
    }
    return (
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-price-spark="unavailable">
        {t('pd.gold.sparkUnavailable')}
      </p>
    );
  }

  const { closes } = view;
  const dataMin = Math.min(...closes);
  const dataMax = Math.max(...closes);
  const mid = (dataMin + dataMax) / 2;
  const halfRange = Math.max((dataMax - dataMin) / 2, (Math.abs(mid) * MIN_REL_RANGE) / 2);
  const domainMin = mid - halfRange;
  const domainMax = mid + halfRange;
  const scaleY = (v: number): number =>
    domainMax === domainMin ? H / 2 : H - PAD - ((v - domainMin) / (domainMax - domainMin)) * (H - 2 * PAD);
  const stepX = (W - 2 * PAD) / (closes.length - 1);
  const line = closes.map((v, i) => `${i === 0 ? 'M' : 'L'}${(PAD + i * stepX).toFixed(2)},${scaleY(v).toFixed(2)}`).join(' ');

  // The C1 labels: the series named + the window's own true span + the
  // window's signed change (return ink, the two-channel rule).
  const months = Math.max(1, Math.round(view.n / 21));
  const fromText = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${view.from}T00:00:00Z`));
  const toText = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${view.to}T00:00:00Z`));
  const changeTone = view.changePct > 0 ? 'text-[var(--color-return-up)]' : view.changePct < 0 ? 'text-[var(--color-return-down)]' : 'text-[var(--color-text-secondary)]';
  const sign = view.changePct > 0 ? '+' : view.changePct < 0 ? '−' : '';
  const changeText = `${sign}${formatNumber(Math.abs(view.changePct), numberLocale, { maximumFractionDigits: 1 })}%`;

  const aria = t('pd.gold.sparkAria', {
    n: formatNumber(view.n, numberLocale, { maximumFractionDigits: 0 }),
    months: formatNumber(months, numberLocale, { maximumFractionDigits: 0 }),
    change: changeText,
    from: fromText,
    to: toText,
  });

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-1" data-price-spark="ready">
      {/* dir="ltr" wrapper — the house convention: charts read left→right in
       * both locales. The polyline is the decorative layer; the aria name
       * carries the whole reading. */}
      <div dir="ltr">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={aria}
          className="h-14 w-full text-[var(--color-accent-gold-strong)]"
          data-price-spark-plot
        >
          <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {/* The end dot — the current close. */}
          <circle cx={W - PAD} cy={scaleY(closes[closes.length - 1]!)} r={3} fill="currentColor" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <figcaption className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        {/* The series named per C1 (the interactive chart's own name). */}
        <span>{t('pd.gold.sparkSeriesName')}</span>
        <bdi dir="ltr" className={`font-semibold ${changeTone}`} data-price-spark-window>
          {changeText}
        </bdi>
        <span>{interpolate(t('pd.gold.sparkWindowLabel'), { n: formatNumber(view.n, numberLocale, { maximumFractionDigits: 0 }), from: fromText, to: toText })}</span>
      </figcaption>
    </figure>
  );
}
