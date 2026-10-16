/**
 * LiveRateLine (I11) — the always-on mid-market rate for the converter's
 * selected pair, between the currency row and the CTA.
 *
 * Before this, the pair's rate was ONLY visible inside the result popup —
 * the single most-asked question on a converter homepage ("what's the
 * dollar?") needed an amount + a tap. Now:
 *
 *   1 US Dollar = 230,500 Iranian Toman   [TGJU · LIVE]
 *   ~~~sparkline~~~  ▲ 0.4%   updated 2 minutes ago   [copy ⧉]
 *
 * - Pure local math over the already-booted snapshot (swap / currency
 *   changes re-render instantly, zero network — same rule as the form).
 * - Trend + sparkline from the recorded rate-history generations (the whole
 *   ≤240-generation window, drawn bucket-averaged), same source the
 *   ResultPopup's micro-trend uses.
 * - Honest states: stale snapshot → warning-tinted freshness + LIVE→CACHED
 *   badge; unresolvable pair / same-currency / no snapshot → renders null.
 * - Copy copies a localized share line; "Copied" feedback (2s, same
 *   pattern as the Insights share pill).
 * - Hidden while a custom rate is open (a market rate next to a manual
 *   override would mislead).
 * - Reduced-motion: no hover lift. Print: the line itself prints (it is
 *   the headline number on paper); only the copy button is .no-print.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber, formatRelative } from '@currena/core';
import type { CurrencyCode, Snapshot, SnapshotSource } from '@currena/core';
import { RateDeltaChip } from './RateDeltaChip';
import { Sparkline } from './Sparkline';
import { SourceBadge } from './ui';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import { bucketMean, liveRateView, rateDecimals, rateShareText, TREND_BUCKETS } from '../lib/live-rate';
import { seriesForPair, trendOf, useRateHistory } from '../lib/rate-history';

interface LiveRateLineProps {
  from: CurrencyCode;
  to: CurrencyCode;
  /** Booted snapshot for the PAIR'S source (store[sourceForPair(from, to)]). */
  snapshot: Snapshot | null;
  /** Confirmed staleness only (same rule as the form's stale banner). */
  stale: boolean;
  /** Hide while the custom-rate override is open. */
  hidden?: boolean;
}

export function LiveRateLine({ from, to, snapshot, stale, hidden = false }: LiveRateLineProps) {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  const view = liveRateView(snapshot, from, to);
  const historySource: SnapshotSource | null =
    view === null ? null : view.source === 'tgju' || view.source === 'frankfurter' ? view.source : null;
  const generations = useRateHistory(historySource);
  const rawSeries = useMemo(
    () => (historySource ? seriesForPair(generations, from, to) : []),
    [generations, historySource, from, to],
  );
  const trendSeries = useMemo(() => bucketMean(rawSeries, TREND_BUCKETS), [rawSeries]);
  const trend = trendOf(rawSeries);

  if (hidden || view === null) return null;

  const irrPair = from === 'IRR' || to === 'IRR';
  const rateText = formatNumber(view.rate, numberLocale, {
    maximumFractionDigits: rateDecimals(view.rate, irrPair),
  });
  const prev = rawSeries.length >= 2 ? rawSeries[rawSeries.length - 2] : null;
  const freshness = formatRelative(view.fetchedAt, numberLocale);
  const pctText =
    trend === null
      ? ''
      : `${trend.pct >= 0 ? '+' : ''}${formatNumber(trend.pct, numberLocale, { maximumFractionDigits: 2 })}%`;

  const copyRate = (): void => {
    const text = rateShareText(
      view,
      t(`currencies.${from}` as TranslationKey),
      t(`currencies.${to}` as TranslationKey),
      t('app.name'),
      numberLocale,
      irrPair,
    );
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard unavailable (insecure context / old WebView) — no-op.
      });
  };

  return (
    <section
      aria-label={t('converter.liveRate')}
      className={`mt-4 rounded-2xl border-s-[3px] px-3.5 py-3 transition-colors ${
        stale
          ? 'border-currena-warning bg-currena-warning/[0.08]'
          : 'border-currena-cyan bg-currena-cyan/[0.08]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="m-0 text-sm font-semibold text-currena-dark">
          <bdi dir="ltr">{formatNumber(1, numberLocale, { maximumFractionDigits: 0 })}</bdi>{' '}
          <bdi>{label(from)}</bdi>
          <span aria-hidden="true" className="mx-1 opacity-50 rtl:-scale-x-100">
            =
          </span>
          <span className="text-[0.95rem] font-black sm:text-base">{rateText}</span>{' '}
          <bdi>{label(to)}</bdi>
        </p>
        <SourceBadge source={view.source} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {trendSeries.length >= 2 ? (
            <Sparkline
              points={trendSeries}
              width={104}
              height={28}
              ariaLabel={t('trend.summary', {
                pair: `${label(from)} → ${label(to)}`,
                dir: t(`trend.${trend?.dir ?? 'flat'}` as TranslationKey),
                pct: pctText,
              })}
              className="h-7 w-26 shrink-0"
            />
          ) : null}
          {prev !== null && typeof prev === 'number' && prev > 0 ? (
            <RateDeltaChip
              delta={{ current: view.rate, previous: prev }}
              decimals={rateDecimals(view.rate, irrPair)}
              size="sm"
            />
          ) : null}
        </div>
        <div className="flex items-center gap-2.5">
          <p
            className={`m-0 text-[0.7rem] font-semibold ${
              stale ? 'text-currena-warning' : 'text-currena-muted'
            }`}
          >
            {stale ? '⚠ ' : ''}
            {t('converter.updatedAgo', { ago: freshness })}
          </p>
          <button
            type="button"
            onClick={copyRate}
            aria-label={copied ? t('converter.rateCopied') : t('converter.copyRate')}
            className={`no-print inline-flex h-9 min-w-[2rem] cursor-pointer items-center justify-center gap-1 rounded-full border-0 px-2.5 text-[0.7rem] font-bold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
              copied
                ? 'bg-currena-success/15 text-currena-success'
                : 'bg-currena-blue/10 text-currena-blue hover:bg-currena-blue/20 motion-safe:hover:-translate-y-0.5'
            }`}
          >
            {copied ? `✓ ${t('converter.rateCopied')}` : `⧉ ${t('converter.copyRate')}`}
          </button>
        </div>
      </div>
    </section>
  );
}
