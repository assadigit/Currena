/**
 * Live rates route (`#/live-rates`) — the 8 legacy TGJU cards
 * (FEATURE_MAP §2 #3): USD EUR AUD GBP CAD TRY AED CNY → IRR (Toman).
 *
 * The legacy page fired 8 POST /api/convert calls every 30s; the rebuild
 * reads ONE snapshot (checklist #4) and computes all 8 values locally via
 * @currena/core. Auto-refresh every 30s calls snapshotStore.refresh, which
 * re-fetches only when the freshness window has lapsed — the network stays
 * "once per window". Visual identity is the legacy gold-on-dark board.
 */

import { useEffect, useMemo, useState } from 'react';
import { convert, formatDate, formatNumber } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import { fetchMeta } from '../lib/api';
import { useI18n } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';
import type { TranslationKey } from '../lib/locale';

/** The 8 legacy board currencies, in legacy order. */
const BOARD: readonly CurrencyCode[] = ['USD', 'EUR', 'AUD', 'GBP', 'CAD', 'TRY', 'AED', 'CNY'];

const REFRESH_INTERVAL_MS = 30_000;

export function LiveRates() {
  const { t, numberLocale } = useI18n();
  const store = useSnapshotStore();
  const [tgjuUrls, setTgjuUrls] = useState<Record<string, string>>({});

  // Auto-refresh (legacy: setInterval(fetchAllRates, 30000)) — the store
  // itself enforces the freshness window, so a fresh snapshot is a no-op.
  useEffect(() => {
    const timer = window.setInterval(() => {
      void snapshotStore.refresh('tgju');
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  // TGJU profile links from /api/meta.
  useEffect(() => {
    let cancelled = false;
    fetchMeta()
      .then((meta) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const c of meta.currencies) {
          if (c.tgjuProfileUrl) map[c.code] = c.tgjuProfileUrl;
        }
        setTgjuUrls(map);
      })
      .catch(() => undefined); // cards simply hide the link on failure
    return () => {
      cancelled = true;
    };
  }, []);

  const state = store.tgju;
  const loading = state.status === 'loading';
  const snapshot = state.snapshot;

  const cards = useMemo(() => {
    if (!snapshot) return null;
    return BOARD.map((code) => {
      try {
        // 1 unit of `code` in Toman — local math over the snapshot.
        const { rate } = convert(snapshot, code, 'IRR', 1);
        return { code, rate, ok: true as const };
      } catch {
        return { code, rate: null, ok: false as const };
      }
    });
  }, [snapshot]);

  return (
    // Legacy board identity: gold on dark, always (the legacy page had no
    // theme toggle and rendered its own dark design).
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] pb-24 text-[#eee]">
      <div className="mx-auto w-full max-w-[480px] px-4 py-5">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2.5 text-2xl font-bold text-gold-vibrant">{t('liveRates.iranianTomanRates')}</h2>
          <div className="inline-flex items-center gap-2 rounded-full bg-currena-success/20 px-4 py-2 text-sm font-semibold text-currena-success">
            <span className="live-dot !h-2.5 !w-2.5" aria-hidden="true" />
            {t('liveRates.liveUpdates')}
          </div>
          <p className="mt-2.5 text-xs opacity-70">
            {t('common.lastUpdated')}:{' '}
            {snapshot
              ? formatDate(snapshot.fetchedAt, numberLocale, { withTime: true })
              : t('common.loading')}
          </p>
        </div>

        {/* Banners */}
        {!store.online && snapshot ? (
          <div className="slide-down mb-4 flex items-center gap-3 rounded-[15px] border-s-4 border-currena-muted bg-currena-muted/15 px-4 py-3.5">
            <span aria-hidden="true">🔌</span>
            <p className="text-sm font-medium">{t('common.offlineRatesFrom', { source: t('sources.tgju') })}</p>
          </div>
        ) : null}
        {snapshot && (state.stale || state.degraded) ? (
          <div
            role="status"
            className="slide-down mb-4 flex items-center gap-3 rounded-[15px] border-s-4 border-currena-warning bg-currena-warning/15 px-4 py-3.5"
          >
            <span className="warning-pulse text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-semibold text-currena-warning">{t('converter.usingCachedRates')}</p>
              <p className="text-xs opacity-80">
                {t('common.lastUpdated')}: {formatDate(snapshot.fetchedAt, numberLocale, { withTime: true })}
              </p>
            </div>
          </div>
        ) : null}

        {/* Error state (legacy .error-message) */}
        {state.status === 'error' && !snapshot ? (
          <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-4 text-sm text-[#ff5252]">
            {t('liveRates.couldNotFetch')}
          </div>
        ) : null}

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {BOARD.map((code) => {
            const card = cards?.find((c) => c.code === code);
            const rateText = card?.ok
              ? `${formatNumber(card.rate, numberLocale, { maximumFractionDigits: 0 })} IRR`
              : loading
                ? '--'
                : t('common.error');
            const profileUrl = tgjuUrls[code];
            return (
              <article
                key={code}
                className="rounded-[18px] bg-board-card p-5 shadow-[10px_10px_20px_rgba(0,0,0,0.7),-10px_-10px_20px_rgba(255,255,255,0.05)] transition-transform duration-300 hover:-translate-y-1"
              >
                <header className="mb-4 flex items-center gap-3">
                  <img
                    src={`/images/flags/${code.toLowerCase()}.png`}
                    alt={code}
                    className="h-[35px] w-[50px] rounded-md object-cover"
                  />
                  <div>
                    <h3 className="text-[1.05rem] font-semibold text-gold-vibrant">
                      {t(`currencies.${code}` as TranslationKey)}
                    </h3>
                    <p className="text-xs opacity-70">{code} → IRR</p>
                  </div>
                </header>
                <div className="mb-3 flex items-center justify-between rounded-xl bg-gold-primary/10 p-4">
                  <span className="text-sm opacity-80">1 {code} =</span>
                  <span className={`text-lg font-bold text-gold-vibrant ${card?.ok ? '' : 'rate-loading'}`}>
                    {rateText}
                  </span>
                </div>
                {profileUrl ? (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs text-[#42a5f5] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500/20"
                  >
                    🔗 {t('common.viewOnTgju')}
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>

      </div>

      {/* Manual refresh FAB (legacy gold, spins while fetching) */}
      <button
        type="button"
        onClick={() => void snapshotStore.refresh('tgju')}
        title={t('liveRates.refresh')}
        aria-label={t('liveRates.refresh')}
        className={`fixed bottom-5 end-5 z-[999] h-[60px] w-[60px] cursor-pointer rounded-full border-0 bg-gold-vibrant text-2xl text-black shadow-[0_6px_20px_rgba(255,215,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:rotate-180 ${loading ? 'refresh-spinning' : ''}`}
      >
        🔄
      </button>
    </div>
  );
}
