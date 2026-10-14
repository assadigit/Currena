/**
 * ResultPopup — the converter's result card (FEATURE_MAP §1, legacy
 * .result-popup): slide-up 0.4s, LIVE/CACHED indicator, gradient odometer
 * amount, pair rate + inverse, Jalali + Gregorian timestamps (core format),
 * cache warning, "View on TGJU.org" link, copy + share-as-image actions.
 *
 * Share renders the popup to PNG via html2canvas — a LAZY dynamic import so
 * it never lands in the initial chunk (mission §8 budget).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Source } from '@currena/core';
import { formatDate, formatJalaliDate, formatNumber, formatRelative } from '@currena/core';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import { seriesForPair, trendOf, useRateHistory } from '../lib/rate-history';
import { Odometer } from './Odometer';
import { RateDeltaChip } from './RateDeltaChip';
import { Sparkline } from './Sparkline';
import { Button, LiveIndicator, SourceBadge } from './ui';
import { useDialogFocus } from './useDialogFocus';

/** Everything the popup renders — produced by the converter's state machine. */
export interface ConversionView {
  amount: number;
  from: string;
  to: string;
  result: number;
  /** Units of `to` per 1 `from`. */
  rate: number;
  /** Units of `from` per 1 `to`. */
  inverse: number;
  source: Source;
  /** ISO datetime of the snapshot (null → manual override; caller stamps now). */
  fetchedAt: string;
  /** Served beyond the freshness window (cache/offline). */
  stale: boolean;
}

interface ResultPopupProps {
  view: ConversionView;
  onClose: () => void;
  onNewConversion: () => void;
  /** TGJU profile URL for the non-IRR side (null → hide the link). */
  tgjuUrl: string | null;
  /** Baseline rate from the previous snapshot generation (null → hide ▲/▼). */
  prevRate?: number | null;
  /** REF to the control that opened the popup — focus returns there on close. */
  returnFocusToRef?: Readonly<React.RefObject<HTMLElement | null>>;
}

const SOURCE_KEY: Record<Source, TranslationKey> = {
  tgju: 'sources.tgju',
  frankfurter: 'sources.frankfurter',
  manual: 'sources.manual',
  local: 'sources.local',
};

/** Legacy rate-precision rule: IRR pairs 0 decimals, else 4; tiny rates 8. */
function rateMaxFractionDigits(rate: number, irrPair: boolean): number {
  if (rate < 1) return 8;
  return irrPair ? 0 : 4;
}

export function ResultPopup({ view, onClose, onNewConversion, tgjuUrl, prevRate, returnFocusToRef }: ResultPopupProps) {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Dialog focus discipline (QA audit D-3): focus moves in on open (the
  // pair heading, announced by role=dialog), Tab is trapped inside,
  // Escape closes, focus returns to the convert button on close, and body
  // scroll locks while open — the DetailsPanel-proven pattern, shared.
  const { containerRef, onKeyDown } = useDialogFocus({ onClose, returnFocusToRef });

  // Micro-trend (rate-history sparkline): only for live sources, not manual/local.
  const historySource = view.source === 'tgju' || view.source === 'frankfurter' ? view.source : null;
  const generations = useRateHistory(historySource);
  const trendSeries = useMemo(
    () => (historySource ? seriesForPair(generations, view.from, view.to) : []),
    [generations, historySource, view.from, view.to],
  );
  const trend = trendOf(trendSeries);
  const trendPctText =
    trend === null
      ? ''
      : `${trend.pct >= 0 ? '+' : ''}${formatNumber(trend.pct, numberLocale, { maximumFractionDigits: 2 })}%`;

  // Escape closes (legacy had X + overlay click; the shared hook now owns
  // the full discipline incl. Escape — this window listener stays as
  // belt-and-braces for focus-outside edge cases).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fromName = t(`currencies.${view.from}` as TranslationKey);
  const toName = t(`currencies.${view.to}` as TranslationKey);
  const irrPair = view.from === 'IRR' || view.to === 'IRR';
  const live = !view.stale;

  const fmtAmount = useCallback(
    (value: number, code: string): string => {
      const minor = code === 'IRR' || code === 'JPY' || code === 'KRW' || code === 'IDR' || code === 'VND' ? 0 : 2;
      return formatNumber(value, numberLocale, { maximumFractionDigits: minor });
    },
    [numberLocale],
  );

  const rateText = formatNumber(view.rate, numberLocale, {
    maximumFractionDigits: rateMaxFractionDigits(view.rate, irrPair),
  });
  const inverseText = formatNumber(view.inverse, numberLocale, {
    maximumFractionDigits: rateMaxFractionDigits(view.inverse, irrPair),
  });
  // ▲/▼ only for real snapshot sources with a usable baseline.
  const showDelta =
    (view.source === 'tgju' || view.source === 'frankfurter') &&
    typeof prevRate === 'number' &&
    Number.isFinite(prevRate) &&
    prevRate > 0;

  // Owner rule: IRR renders as "IRR (Toman)" in amount/rate/share text.
  // For name-based share lines, IRR uses the label directly (its full name
  // already says "Iranian Toman" — "Iranian Toman (IRR (Toman))" would be
  // noise); other codes keep the "Name (CODE)" shape.
  const amountLine = (value: number, code: string, name: string): string =>
    `${fmtAmount(value, code)} ${code === 'IRR' ? label(code) : `${name} (${code})`}`;

  const shareText = [
    `${t('converter.currencyConversion')}`,
    '',
    amountLine(view.amount, view.from, fromName),
    `= ${amountLine(view.result, view.to, toName)}`,
    '',
    `📊 ${t('common.exchangeRate')}: 1 ${label(view.from)} = ${rateText} ${label(view.to)}`,
    `📡 ${t('common.source')}: ${t(SOURCE_KEY[view.source])}`,
    live
      ? `✅ ${t('common.liveUpdate')}`
      : `⚠️ ${t('common.cachedData')} (${formatRelative(view.fetchedAt, numberLocale)})`,
    '',
    `🕐 ${formatDate(view.fetchedAt, numberLocale, { withTime: true })}`,
    '',
    t('converter.convertedWith'),
  ].join('\n');

  const onCopy = async (): Promise<void> => {
    const copyLines = [
      `${amountLine(view.amount, view.from, fromName)} = ${amountLine(view.result, view.to, toName)}`,
      `${t('common.rate')}: 1 ${label(view.from)} = ${rateText} ${label(view.to)}`,
      `${t('common.source')}: ${t(SOURCE_KEY[view.source])}`,
    ];
    if (!live) {
      copyLines.push(`⚠️ ${t('common.cachedData')} (${formatRelative(view.fetchedAt, numberLocale)})`);
    }
    try {
      await navigator.clipboard.writeText(copyLines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast(t('converter.checkConnection'));
    }
  };

  const onShare = async (): Promise<void> => {
    setSharing(true);
    let canvas: HTMLCanvasElement | null = null;
    try {
      // Lazy chunk: html2canvas stays out of the initial bundle.
      const { default: html2canvas } = await import('html2canvas');
      const card = cardRef.current;
      if (card) {
        const wasHidden = closeRef.current?.style.display;
        if (closeRef.current) closeRef.current.style.display = 'none';
        canvas = await html2canvas(card, {
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1A222E' : '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        });
        if (closeRef.current) closeRef.current.style.display = wasHidden ?? '';
      }
    } catch (err) {
      console.warn('[share] screenshot failed, falling back to text:', err);
    }

    let shared = false;
    try {
      if (canvas && navigator.share) {
        const blob = await new Promise<Blob | null>((resolve) => canvas!.toBlob(resolve, 'image/png'));
        if (blob && navigator.canShare?.({ files: [new File([blob], 'currena-conversion.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: t('converter.shareTitle'),
            text: shareText,
            files: [new File([blob], 'currena-conversion.png', { type: 'image/png' })],
          });
          shared = true;
        }
      }
      if (!shared && navigator.share) {
        await navigator.share({ title: t('converter.shareTitle'), text: shareText });
        shared = true;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setSharing(false);
        return; // user dismissed the share sheet — not an error
      }
      console.warn('[share] navigator.share failed:', err);
    }

    if (!shared) {
      // Legacy fallback: save the screenshot + copy the text.
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'currena-conversion.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      try {
        await navigator.clipboard.writeText(shareText);
        setToast(t('converter.screenshotSaved'));
      } catch {
        setToast(t('converter.checkConnection'));
      }
    }
    setSharing(false);
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('converter.conversionResult')}
      className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-5 backdrop-blur-[10px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={cardRef}
        className="popup-slide-up relative w-full max-w-[450px] rounded-[30px] bg-white p-4 shadow-[0_25px_70px_rgba(0,0,0,0.5)] sm:max-w-[540px] sm:p-7 dark:bg-[#1A222E]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute end-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-currena-warning/10 text-2xl text-currena-warning transition-all duration-300 hover:rotate-90 hover:bg-currena-warning/20"
        >
          ×
        </button>

        {/* Task 24 (compact mobile): the header collapsed from three stacked
            rows (indicator / 💰 / title) into ONE row — indicator + title side
            by side, emoji only on sm+. Sections below tightened: single-line
            timestamp, smaller sparkline, reduced paddings/margins. */}
        <div className="mb-1 flex items-center justify-center gap-2.5 sm:mb-2 sm:gap-3">
          <LiveIndicator live={live} />
          {/* data-dialog-heading: the shared focus discipline focuses this on
              open so the announced dialog starts at its heading. */}
          <h2
            data-dialog-heading
            tabIndex={-1}
            className="text-sm font-bold text-currena-blue focus:outline-none sm:text-base"
          >
            {fromName} → {toName}
          </h2>
        </div>
        <div className="mb-1 hidden text-center text-4xl sm:mb-2 sm:block" aria-hidden="true">
          💰
        </div>

        <div className="my-1.5 sm:my-2.5">
          <p className="mb-1 text-center text-xs font-semibold text-currena-muted sm:mb-2 sm:text-sm">
            {fmtAmount(view.amount, view.from)} <bdi>{label(view.from)}</bdi>
          </p>
          <p className="cta-gradient-text break-words text-center text-[1.6rem] leading-tight font-black sm:text-[2rem]">
            <Odometer value={view.result} format={(n) => fmtAmount(n, view.to)} />{' '}
            <span className="text-[0.8rem] font-bold sm:text-[0.85rem]">
              <bdi>{label(view.to)}</bdi>
            </span>
          </p>
        </div>

        <div className="my-1.5 space-y-0.5 rounded-[10px] bg-currena-blue/10 px-2 py-1.5 text-center sm:my-2.5 sm:space-y-1 sm:py-2">
          <p className="text-xs sm:text-sm">
            <strong>{t('common.rate')}:</strong> 1 <bdi>{label(view.from)}</bdi> = {rateText}{' '}
            <bdi>{label(view.to)}</bdi> <SourceBadge source={view.source} />
          </p>
          <p className="text-[0.75rem] opacity-90 sm:text-sm">
            1 <bdi>{label(view.to)}</bdi> = {inverseText} <bdi>{label(view.from)}</bdi>
          </p>
          {showDelta ? (
            <div className="flex justify-center pt-0.5 sm:pt-1">
              <RateDeltaChip
                delta={{ current: view.rate, previous: prevRate }}
                decimals={irrPair ? 0 : 4}
                size="sm"
              />
            </div>
          ) : null}
        </div>

        {/* Jalali + time in ONE compact line on mobile (was a 3-line block);
            sm+ adds the Gregorian date on a second line. */}
        <div className="my-1.5 rounded-[10px] border-s-[3px] border-currena-cyan bg-currena-cyan/10 px-2.5 py-1.5 sm:my-2.5 sm:py-2">
          <p className="text-[0.7rem] text-currena-dark">
            <span className="font-semibold" aria-hidden="true">
              🕐{' '}
            </span>
            <bdi>{formatJalaliDate(view.fetchedAt, numberLocale, { withTime: true })}</bdi>
            <span className="hidden sm:inline"> • <bdi>{formatDate(view.fetchedAt, numberLocale)}</bdi></span>
          </p>
        </div>

        {/* Micro-trend over recorded generations (server + local — Task 24). */}
        {trendSeries.length >= 2 && trend ? (
          <div className="my-1.5 rounded-[10px] border-s-[3px] border-currena-success/60 bg-currena-success/[0.07] px-2.5 py-1.5 sm:my-2.5 sm:py-2">
            <div className="mb-0.5 flex items-baseline justify-between gap-2 sm:mb-1">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-currena-muted">
                📈 {t('trend.recentChecks', { n: trendSeries.length })}
              </p>
              <p
                className={`text-[0.7rem] font-bold sm:text-xs ${
                  trend.dir === 'up'
                    ? 'text-currena-success'
                    : trend.dir === 'down'
                      ? 'text-[#dc2626] dark:text-red-400'
                      : 'text-currena-muted'
                }`}
              >
                {trend.dir === 'flat' ? t('trend.flat') : trendPctText}
              </p>
            </div>
            <Sparkline
              points={trendSeries}
              width={280}
              height={44}
              ariaLabel={t('trend.summary', {
                pair: `${label(view.from)} → ${label(view.to)}`,
                dir: t(`trend.${trend.dir}` as TranslationKey),
                pct: trendPctText,
              })}
              className="h-auto w-full"
            />
            <p className="mt-0.5 flex flex-wrap items-center justify-between gap-1 text-[0.6rem] text-currena-muted sm:mt-1 sm:text-[0.68rem]">
              <span>
                {t('trend.range', {
                  min: formatNumber(Math.min(...trendSeries), numberLocale, {
                    maximumFractionDigits: rateMaxFractionDigits(Math.min(...trendSeries), irrPair),
                  }),
                  max: formatNumber(Math.max(...trendSeries), numberLocale, {
                    maximumFractionDigits: rateMaxFractionDigits(Math.max(...trendSeries), irrPair),
                  }),
                })}
              </span>
              <span className="italic">{t('trend.honestNote')}</span>
            </p>
          </div>
        ) : null}

        {!live ? (
          <p className="my-2 rounded-[10px] border-s-[3px] border-currena-warning bg-currena-warning/10 px-2.5 py-1.5 text-xs font-semibold text-currena-warning sm:my-3 sm:px-3 sm:py-2.5 sm:text-sm">
            {t('converter.thisRateIsCached')} {formatRelative(view.fetchedAt, numberLocale)}
          </p>
        ) : null}

        {view.source === 'tgju' && irrPair && tgjuUrl ? (
          <div className="flex justify-center">
            <a
              href={tgjuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-currena-blue bg-currena-blue/10 px-3 py-1.5 text-xs font-semibold text-currena-blue transition-all duration-300 hover:-translate-y-0.5 hover:bg-currena-blue/20 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <span aria-hidden="true">🔗</span> {t('common.viewOnTgju')}
            </a>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-6">
          <Button variant="cta" className="col-span-full py-3 text-sm sm:py-3.5 sm:text-base" onClick={onNewConversion}>
            {t('converter.newConversion')}
          </Button>
          <Button variant="secondary" className="py-3 text-sm sm:py-3.5" onClick={() => void onCopy()}>
            {copied ? `✅ ${t('common.copied')}` : `📋 ${t('common.copy')}`}
          </Button>
          <Button variant="secondary" className="py-3 text-sm sm:py-3.5" disabled={sharing} onClick={() => void onShare()}>
            {sharing ? t('converter.creating') : `📤 ${t('common.share')}`}
          </Button>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fade-in fixed inset-x-4 bottom-4 z-[10001] mx-auto max-w-sm rounded-2xl bg-[#2C3E50]/95 px-4 py-3 text-center text-sm whitespace-pre-line text-white shadow-lg dark:bg-[#2A3A52]/95"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
