/**
 * ResultPopup — the converter's result card (FEATURE_MAP §1, legacy
 * .result-popup): slide-up 0.4s, LIVE/CACHED indicator, gradient odometer
 * amount, pair rate + inverse, Jalali + Gregorian timestamps (core format),
 * cache warning, "View on TGJU.org" link, copy + share-as-image actions.
 *
 * Share renders the popup to PNG via html2canvas — a LAZY dynamic import so
 * it never lands in the initial chunk (mission §8 budget).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Source } from '@currena/core';
import { formatDate, formatJalaliDate, formatNumber, formatRelative } from '@currena/core';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import { Odometer } from './Odometer';
import { Button, LiveIndicator, SourceBadge } from './ui';

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

export interface ResultPopupProps {
  view: ConversionView;
  onClose: () => void;
  onNewConversion: () => void;
  /** TGJU profile URL for the non-IRR side (null → hide the link). */
  tgjuUrl: string | null;
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

export function ResultPopup({ view, onClose, onNewConversion, tgjuUrl }: ResultPopupProps) {
  const { t, numberLocale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes (legacy had X + overlay click; Escape is the a11y twin).
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

  const shareText = [
    `${t('converter.currencyConversion')}`,
    '',
    `${fmtAmount(view.amount, view.from)} ${fromName} (${view.from})`,
    `= ${fmtAmount(view.result, view.to)} ${toName} (${view.to})`,
    '',
    `📊 ${t('common.exchangeRate')}: 1 ${view.from} = ${rateText} ${view.to}`,
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
      `${fmtAmount(view.amount, view.from)} ${fromName} = ${fmtAmount(view.result, view.to)} ${toName}`,
      `${t('common.rate')}: ${rateText}`,
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
          backgroundColor: document.documentElement.classList.contains('dark') ? '#252941' : '#ffffff',
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
      role="dialog"
      aria-modal="true"
      aria-label={t('converter.conversionResult')}
      className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-5 backdrop-blur-[10px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="popup-slide-up relative w-full max-w-[450px] rounded-[30px] bg-white p-7 shadow-[0_25px_70px_rgba(0,0,0,0.5)] dark:bg-currena-card-dark dark:text-white"
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

        <div className="mb-2 flex justify-center">
          <LiveIndicator live={live} />
        </div>

        <div className="mb-2 text-center text-4xl" aria-hidden="true">
          💰
        </div>
        <h2 className="mb-2 text-center text-base font-bold text-currena-blue dark:text-currena-cyan">
          {fromName} → {toName}
        </h2>

        <div className="my-2.5">
          <p className="mb-2 text-center text-base font-semibold text-currena-muted dark:text-white/70">
            {fmtAmount(view.amount, view.from)} {view.from}
          </p>
          <p className="cta-gradient-text break-words text-center text-[2rem] leading-tight font-black">
            <Odometer value={view.result} format={(n) => `${fmtAmount(n, view.to)} ${view.to}`} />
          </p>
        </div>

        <div className="my-2.5 space-y-1 rounded-[10px] bg-currena-blue/10 px-2 py-2 text-center dark:text-white">
          <p className="text-sm">
            <strong>{t('common.rate')}:</strong> 1 {view.from} = {rateText} {view.to}{' '}
            <SourceBadge source={view.source} />
          </p>
          <p className="text-sm opacity-90">
            1 {view.to} = {inverseText} {view.from}
          </p>
        </div>

        {/* Jalali + Gregorian timestamps — render-time core formatting */}
        <div className="my-2.5 rounded-[10px] border-s-[3px] border-currena-cyan bg-currena-cyan/10 px-2.5 py-2">
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-currena-muted dark:text-white/60">
            {t('common.lastCheckedAt')}
          </p>
          <p className="text-xs text-currena-dark dark:text-white">
            {formatJalaliDate(view.fetchedAt, numberLocale)} • {formatDate(view.fetchedAt, numberLocale)}
          </p>
          <p className="text-sm font-semibold text-currena-dark dark:text-white">
            {formatDate(view.fetchedAt, numberLocale, { withTime: true })}
          </p>
        </div>

        {!live ? (
          <p className="my-3 rounded-[10px] border-s-[3px] border-currena-warning bg-currena-warning/10 px-3 py-2.5 text-sm font-semibold text-currena-warning">
            {t('converter.thisRateIsCached')} {formatRelative(view.fetchedAt, numberLocale)}
          </p>
        ) : null}

        {view.source === 'tgju' && irrPair && tgjuUrl ? (
          <div className="flex justify-center">
            <a
              href={tgjuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-currena-blue bg-currena-blue/10 px-4 py-2.5 text-sm font-semibold text-currena-blue transition-all duration-300 hover:-translate-y-0.5 hover:bg-currena-blue/20"
            >
              <span aria-hidden="true">🔗</span> {t('common.viewOnTgju')}
            </a>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Button variant="cta" className="col-span-full py-3.5 text-base" onClick={onNewConversion}>
            {t('converter.newConversion')}
          </Button>
          <Button variant="secondary" className="py-3.5" onClick={() => void onCopy()}>
            {copied ? `✅ ${t('common.copied')}` : `📋 ${t('common.copy')}`}
          </Button>
          <Button variant="secondary" className="py-3.5" disabled={sharing} onClick={() => void onShare()}>
            {sharing ? t('converter.creating') : `📤 ${t('common.share')}`}
          </Button>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fade-in fixed inset-x-4 bottom-4 z-[10001] mx-auto max-w-sm rounded-2xl bg-currena-dark/95 px-4 py-3 text-center text-sm whitespace-pre-line text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
