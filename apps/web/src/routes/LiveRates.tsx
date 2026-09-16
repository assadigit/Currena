/**
 * Live rates route (`#/live-rates`) — the 8 legacy TGJU cards
 * (FEATURE_MAP §2 #3): USD EUR AUD GBP CAD TRY AED CNY → IRR (Toman).
 *
 * The legacy page fired 8 POST /api/convert calls every 30s; the rebuild
 * reads ONE snapshot (checklist #4) and computes all 8 values locally via
 * @currena/core. Auto-refresh every 30s calls snapshotStore.refresh, which
 * re-fetches only when the freshness window has lapsed — the network stays
 * "once per window". Visual identity is the legacy gold-on-dark board.
 *
 * Rate intelligence: each card carries a ▲/▼ delta chip vs the previous
 * snapshot generation (snapshot-store `previous` baseline) and flashes
 * green/red for ~1.6s when its rate changes between updates. A per-card
 * copy button puts "1 USD = 230,500 IRR" on the clipboard.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { convert, formatDate, formatNumber } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import { RateDeltaChip } from '../components/RateDeltaChip';
import { Skeleton } from '../components/ui';
import { fetchMeta } from '../lib/api';
import { useI18n } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';
import type { TranslationKey } from '../lib/locale';

/** The 8 legacy board currencies, in legacy order. */
const BOARD: readonly CurrencyCode[] = ['USD', 'EUR', 'AUD', 'GBP', 'CAD', 'TRY', 'AED', 'CNY'];

const REFRESH_INTERVAL_MS = 30_000;
const FLASH_MS = 1600;

interface BoardCard {
  code: CurrencyCode;
  rate: number | null;
  ok: boolean;
}

export function LiveRates() {
  const { t, numberLocale } = useI18n();
  const store = useSnapshotStore();
  const [tgjuUrls, setTgjuUrls] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<CurrencyCode | null>(null);
  const [flash, setFlash] = useState<Partial<Record<CurrencyCode, 'up' | 'down'>>>({});
  const lastRatesRef = useRef<Map<CurrencyCode, number>>(new Map());

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
  const previous = state.previous;

  const cards = useMemo<BoardCard[] | null>(() => {
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

  /** Baseline rates from the previous snapshot generation (delta chips). */
  const prevRates = useMemo<Map<CurrencyCode, number>>(() => {
    const map = new Map<CurrencyCode, number>();
    if (!previous) return map;
    for (const code of BOARD) {
      try {
        map.set(code, convert(previous, code, 'IRR', 1).rate);
      } catch {
        // Previous generation didn't know this pair — chip stays hidden.
      }
    }
    return map;
  }, [previous]);

  // Flash green/red when a board rate changes between rendered generations.
  useEffect(() => {
    if (!cards) return;
    const before = lastRatesRef.current;
    if (before.size > 0) {
      const nextFlash: Partial<Record<CurrencyCode, 'up' | 'down'>> = {};
      for (const card of cards) {
        if (!card.ok || card.rate === null) continue;
        const prior = before.get(card.code);
        if (prior !== undefined && prior !== card.rate) {
          nextFlash[card.code] = card.rate > prior ? 'up' : 'down';
        }
      }
      if (Object.keys(nextFlash).length > 0) {
        setFlash(nextFlash);
        const timer = window.setTimeout(() => setFlash({}), FLASH_MS);
        lastRatesRef.current = new Map(
          cards.filter((c) => c.ok && c.rate !== null).map((c) => [c.code, c.rate as number]),
        );
        return () => window.clearTimeout(timer);
      }
    }
    lastRatesRef.current = new Map(
      cards.filter((c) => c.ok && c.rate !== null).map((c) => [c.code, c.rate as number]),
    );
    return undefined;
  }, [cards]);

  const copyRate = async (code: CurrencyCode, rate: number): Promise<void> => {
    const text = `1 ${code} = ${formatNumber(rate, numberLocale, { maximumFractionDigits: 0 })} IRR`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard denied — silent no-op keeps the board calm.
    }
  };

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
          {cards
            ? BOARD.map((code) => {
                const card = cards.find((c) => c.code === code);
                const rate = card?.rate ?? null;
                const rateText =
                  card?.ok && rate !== null
                    ? `${formatNumber(rate, numberLocale, { maximumFractionDigits: 0 })} IRR`
                    : loading
                      ? '--'
                      : t('common.error');
                const profileUrl = tgjuUrls[code];
                const prevRate = prevRates.get(code);
                const flashDir = flash[code];
                const copied = copiedCode === code;
                return (
                  <article
                    key={code}
                    className={`rounded-[18px] bg-board-card p-5 shadow-[10px_10px_20px_rgba(0,0,0,0.7),-10px_-10px_20px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1 ${
                      flashDir === 'up' ? 'rate-flash-up' : flashDir === 'down' ? 'rate-flash-down' : ''
                    }`}
                  >
                    <header className="mb-4 flex items-center gap-3">
                      <img
                        src={`/images/flags/${code.toLowerCase()}.png`}
                        alt={code}
                        className="h-[35px] w-[50px] rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[1.05rem] font-semibold text-gold-vibrant">
                          {t(`currencies.${code}` as TranslationKey)}
                        </h3>
                        <p className="text-xs opacity-70">{code} → IRR</p>
                      </div>
                      {copied ? (
                        <span className="shrink-0 text-[0.7rem] font-bold text-currena-success">✅</span>
                      ) : null}
                    </header>
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-gold-primary/10 p-4">
                      <span className="shrink-0 text-sm opacity-80">1 {code} =</span>
                      <span className={`text-lg font-bold text-gold-vibrant ${card?.ok ? '' : 'rate-loading'}`}>
                        {rateText}
                      </span>
                    </div>
                    {/* ▲/▼ vs the previous snapshot generation */}
                    {card?.ok && rate !== null && prevRate !== undefined ? (
                      <div className="mb-3">
                        <RateDeltaChip delta={{ current: rate, previous: prevRate }} decimals={0} size="sm" />
                      </div>
                    ) : null}
                    <footer className="flex flex-wrap items-center justify-between gap-2">
                      {profileUrl ? (
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs text-[#42a5f5] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500/20"
                        >
                          🔗 {t('common.viewOnTgju')}
                        </a>
                      ) : (
                        <span />
                      )}
                      {card?.ok && rate !== null ? (
                        <button
                          type="button"
                          onClick={() => void copyRate(code, rate)}
                          title={t('liveRates.copyRate')}
                          aria-label={t('liveRates.copyRate')}
                          className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-vibrant ${
                            copied
                              ? 'border-currena-success/40 bg-currena-success/15 text-currena-success'
                              : 'border-white/15 bg-white/5 text-white/75 hover:border-white/30 hover:bg-white/10'
                          }`}
                        >
                          {copied ? t('liveRates.rateCopied') : `📋 ${t('liveRates.copyRate')}`}
                        </button>
                      ) : null}
                    </footer>
                  </article>
                );
              })
            : // First load (no snapshot yet): 8 shimmer skeletons.
              BOARD.map((code) => (
                <div key={code} className="rounded-[18px] bg-board-card p-5" aria-hidden="true">
                  <header className="mb-4 flex items-center gap-3">
                    <Skeleton className="h-[35px] w-[50px] rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </header>
                  <Skeleton className="h-[60px] w-full rounded-xl" />
                  <div className="mt-3 flex justify-between">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                </div>
              ))}
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
