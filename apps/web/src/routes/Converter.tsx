/**
 * Converter route (`#/`) — THE flagship (mission §8 state machine).
 *
 *   idle → fetching (loader ≥700ms, even on an instant cache hit)
 *        → result (popup + ~800ms odometer)
 *
 * Network happens ONCE per freshness window (snapshot-store). Amount edits,
 * swap, currency changes and reverse conversions NEVER touch the network —
 * all math is local `@currena/core` over the in-memory snapshot:
 *   - either side IRR → tgju snapshot (AGENTS.md rule 8)
 *   - international pairs → frankfurter snapshot
 *   - same currency → local short-circuit (Gate 1 decision #5)
 *   - custom rate → convertWithManualRate, source "Manual" (legacy parity)
 *
 * LAYOUT (owner wireframe 2026-09-20): a single-column full-width stack —
 * converting box → GOLD & CURRENCY LED boards two-up row (the compact
 * CURRENT-only placement of the same shared board components /live-rates
 * uses — gold on the start side, currency on the end side, replacing the
 * retired "at a glance" mini-board + desktop sidebar rail) → full-width
 * Quick tools section. Mobile keeps the focused legacy form; the boards
 * stack (gold first) and the tools grid reflows 2→3→6 columns.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CURRENCIES,
  CoreError,
  convert,
  convertWithManualRate,
  formatNumber,
  formatRelative,
  reverseRate,
  tgjuProfileUrl,
  thousandSeparateInput,
  sourceForPair,
} from '@currena/core';
import type { ConversionResult, CurrencyCode, SnapshotSource } from '@currena/core';
import { AmountInput, parseInputAmount } from '../components/AmountInput';
import { CurrencySelect } from '../components/CurrencySelect';
import { LedGoldBoard } from '../components/LedGoldBoard';
import { LedRateBoard } from '../components/LedRateBoard';
import { LiveRateLine } from '../components/LiveRateLine';
import { ResultPopup } from '../components/ResultPopup';
import type { ConversionView } from '../components/ResultPopup';
import { Button, Card, LoaderDots, OfflineBanner, StaleBanner } from '../components/ui';
import { fetchMeta } from '../lib/api';
import { useCodeLabel } from '../lib/display';
import { saveHistoryEntry } from '../lib/history';
import { useI18n } from '../lib/locale';
import { addRecentPair, readRecentPairs } from '../lib/recent-pairs';
import type { RecentPair } from '../lib/recent-pairs';
import { isConfirmedStale, snapshotStore, useSnapshotStore } from '../lib/snapshot-store';
import { navigate } from '../router';
import type { RoutePath } from '../router';
import type { TranslationKey } from '../lib/locale';

type Phase = 'idle' | 'fetching' | 'result';

interface ConvertFailure {
  title: string;
  lines: string[];
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Mission §8: the fetching state is shown for at least 700ms. */
const MIN_FETCHING_MS = 700;

/** One-tap amounts — international vs IRR-appropriate magnitudes. */
const QUICK_AMOUNTS_INTL: readonly number[] = [10, 50, 100, 500, 1000];
const QUICK_AMOUNTS_IRR: readonly number[] = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

/** Quick tools (owner wireframe 2026-09-20): the six one-tap shortcuts that
 *  used to live in the desktop sidebar rail — now a full-width homepage
 *  section below the LED boards. */
const TOOLS: readonly { path: RoutePath; emoji: string; labelKey: TranslationKey }[] = [
  { path: '/calculator', emoji: '🧮', labelKey: 'nav.calculator' },
  { path: '/batch', emoji: '🛒', labelKey: 'nav.batchConverter' },
  { path: '/receipt', emoji: '📄', labelKey: 'nav.receiptGenerator' },
  { path: '/splitter', emoji: '💰', labelKey: 'nav.expenseSplitter' },
  { path: '/settle', emoji: '👥', labelKey: 'nav.splitSettle' },
  { path: '/history', emoji: '📜', labelKey: 'nav.history' },
];

/** I11 — first-run pair suggestions until the first conversion exists.
 *  All IRR-side (TGJU open-market — the app's core use case), matching the
 *  default USD→IRR direction so the chips read as "this is what people do". */
const POPULAR_PAIRS: readonly RecentPair[] = [
  { from: 'USD', to: 'IRR' },
  { from: 'EUR', to: 'IRR' },
  { from: 'GBP', to: 'IRR' },
  { from: 'AED', to: 'IRR' },
  { from: 'TRY', to: 'IRR' },
];

export function Converter() {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const store = useSnapshotStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [amount, setAmount] = useState('');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [from, setFrom] = useState<CurrencyCode>('USD'); // legacy defaults
  const [to, setTo] = useState<CurrencyCode>('IRR');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualRate, setManualRate] = useState('');
  const [result, setResult] = useState<ConversionView | null>(null);
  /** Baseline rate from the previous snapshot generation (▲/▼ in the popup). */
  const [prevRate, setPrevRate] = useState<number | null>(null);
  const [failure, setFailure] = useState<ConvertFailure | null>(null);
  const [tgjuUrls, setTgjuUrls] = useState<Record<string, string>>({});
  const [recentPairs, setRecentPairs] = useState<RecentPair[]>([]);

  // TGJU profile links from /api/meta (core's static map is the fallback).
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
      .catch(() => {
        // Static fallback from @currena/core (same TGJU slugs).
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const c of CURRENCIES) {
          const url = tgjuProfileUrl(c.code);
          if (url) map[c.code] = url;
        }
        setTgjuUrls(map);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pairSource = sourceForPair(from, to);
  const sourceState = store[pairSource];
  // CONFIRMED staleness only (owner report 2026-09-19): the transient
  // boot-local derivation (`servedFrom: 'local-store'`, fetch already in
  // flight) must not flash the "Using cached rates" box for a blink before
  // fresh data lands — see isConfirmedStale in snapshot-store.
  const showStaleBanner = isConfirmedStale(sourceState);
  const showOfflineBanner = !store.online && sourceState.snapshot !== null;

  // Recent pairs — read once on mount (written after each conversion).
  useEffect(() => {
    setRecentPairs(readRecentPairs());
  }, []);

  // Deep-link prefill: #/?from=EUR&to=IRR&amount=500 — powers History's
  // "Repeat" action AND shareable conversion links. Unknown values are
  // dropped silently; the URL is cleaned so a later remount never re-applies.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const queryStart = hash.indexOf('?');
    if (queryStart === -1) return;
    const params = new URLSearchParams(hash.slice(queryStart + 1));
    const known = new Set<string>(CURRENCIES.map((c) => c.code));
    const from = params.get('from')?.trim().toUpperCase();
    const to = params.get('to')?.trim().toUpperCase();
    const amount = params.get('amount') ?? '';
    if (from && known.has(from)) setFrom(from as CurrencyCode);
    if (to && known.has(to)) setTo(to as CurrencyCode);
    const parsed = parseInputAmount(amount);
    if (parsed !== null && parsed > 0) setAmount(thousandSeparateInput(amount));
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
  }, []);

  const quickAmounts = from === 'IRR' ? QUICK_AMOUNTS_IRR : QUICK_AMOUNTS_INTL;
  const parsedAmount = parseInputAmount(amount);

  const fromName = t(`currencies.${from}` as TranslationKey);
  const toName = t(`currencies.${to}` as TranslationKey);

  const swap = (): void => {
    setFrom(to);
    setTo(from);
  };

  const onSubmit = async (): Promise<void> => {
    if (phase === 'fetching') return;
    const parsed = parseInputAmount(amount);
    if (parsed === null || parsed <= 0) {
      setAmountInvalid(true);
      return;
    }

    setAmountInvalid(false);
    setFailure(null);
    setPhase('fetching');
    const startedAt = Date.now();

    try {
      const { view, prevRate: baseline } = await runConversion(parsed);
      const remaining = MIN_FETCHING_MS - (Date.now() - startedAt);
      if (remaining > 0) await sleep(remaining);
      setResult(view);
      setPrevRate(baseline);
      setPhase('result');
      addRecentPair(view.from, view.to);
      setRecentPairs(readRecentPairs());
      saveHistoryEntry({
        amount: parsed,
        from: view.from,
        to: view.to,
        result: view.result,
        rate: view.rate,
        source: view.source,
        is_cached: view.stale,
        fetchedAt: view.source === 'manual' ? null : view.fetchedAt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const remaining = MIN_FETCHING_MS - (Date.now() - startedAt);
      if (remaining > 0) await sleep(remaining);
      setFailure(toFailure(err, snapshotStore.getState().online));
      setPhase('idle');
    }
  };

  const runConversion = async (parsedAmount: number): Promise<{ view: ConversionView; prevRate: number | null }> => {
    const manual = manualOpen ? parseInputAmount(manualRate) : null;

    if (manual !== null && manual > 0) {
      // Legacy parity: manual_rate overrides everything, source "Manual".
      const r = convertWithManualRate(parsedAmount, manual);
      return {
        view: {
          amount: parsedAmount,
          from,
          to,
          result: r.amount,
          rate: r.rate,
          inverse: reverseRate(r.rate),
          source: 'manual',
          fetchedAt: new Date().toISOString(),
          stale: false,
        },
        prevRate: null,
      };
    }

    if (from === to) {
      // Gate 1 decision #5: local short-circuit, rate 1, zero network.
      return {
        view: {
          amount: parsedAmount,
          from,
          to,
          result: parsedAmount,
          rate: 1,
          inverse: 1,
          source: 'local',
          fetchedAt: new Date().toISOString(),
          stale: false,
        },
        prevRate: null,
      };
    }

    const source = sourceForPair(from, to);
    const snapshot = await snapshotStore.ensureSnapshot(source);
    if (!snapshot) {
      const error = snapshotStore.getState()[source].error;
      throw error ?? new CoreError('source_unavailable', `No snapshot available for ${source}`);
    }

    let conversion: ConversionResult;
    try {
      conversion = convert(snapshot, from, to, parsedAmount);
    } catch (err) {
      if (err instanceof CoreError && err.code === 'rate_not_found') {
        throw new CoreError('currency_not_supported', `Pair ${from}→${to} not served by ${source}`);
      }
      throw err;
    }

    // Rate intelligence: baseline from the previous snapshot generation, if
    // it also knows this pair (hidden otherwise).
    const previous = snapshotStore.getState()[source].previous;
    let baseline: number | null = null;
    if (previous) {
      try {
        baseline = convert(previous, from, to, 1).rate;
      } catch {
        baseline = null;
      }
    }

    const state = snapshotStore.getState()[source];
    return {
      view: {
        amount: parsedAmount,
        from,
        to,
        result: conversion.amount,
        rate: conversion.rate,
        inverse: reverseRate(conversion.rate),
        source: conversion.source,
        fetchedAt: conversion.fetchedAt,
        // Confirmed staleness — the SAME semantics as the banners and the
        // board status LEDs (SWOT fix 2026-09-19). The old
        // `state.stale || servedFrom !== 'live'` flagged every fresh
        // server-cache copy and every fresh local snapshot as ⚠ CACHED in
        // the result popup, share text and saved history — a false positive:
        // the ladder's fresh KV generation IS the live data (identical to
        // what a scrape would return). ensureSnapshot has already resolved
        // the fetch cycle at this point, so the state read here is the
        // confirmed outcome: LIVE unless the server itself served stale
        // data or the fetch failed (degraded last-good).
        stale: isConfirmedStale(state),
      },
      prevRate: baseline,
    };
  };

  /** Friendly i18n failure card from the typed error (mission: no raw dumps). */
  const toFailure = (err: unknown, online: boolean): ConvertFailure => {
    if (err instanceof CoreError && err.code === 'currency_not_supported') {
      return { title: t('converter.unableToConvert'), lines: [t('errors.pairNotSupported')] };
    }
    if (!online) {
      // Legacy offline alert copy, verbatim from the dictionary.
      return {
        title: t('converter.unableToConvert'),
        lines: [
          t('converter.noInternet'),
          t('converter.tryingCachedRates'),
          '',
          t('converter.connectOnceHint'),
        ],
      };
    }
    return {
      title: t('converter.conversionFailed'),
      lines: [t('errors.unableToFetchRate'), t('converter.checkConnection')],
    };
  };

  const tgjuTarget = from === 'IRR' ? to : from;
  const tgjuUrl = tgjuUrls[tgjuTarget] ?? tgjuProfileUrl(tgjuTarget) ?? null;

  const notice = useMemo(() => sourceState.notice, [sourceState.notice]);

  return (
    // Owner wireframe 2026-09-20: a single-column full-width stack — the
    // converting box, then the GOLD & CURRENCY LED boards side by side
    // (compact CURRENT-only placement), then the full-width quick-tools
    // section. The former desktop two-column dashboard (form + sidebar
    // rail with the "at a glance" mini-board) is retired: mobile keeps the
    // focused legacy form (≤500px) and now gets the boards too.
    <div className="mx-auto w-full max-w-[500px] px-5 py-5 lg:max-w-[1160px] lg:px-10 lg:py-10">
      {showOfflineBanner ? <OfflineBanner source={pairSource} /> : null}
      {showStaleBanner && sourceState.snapshot ? (
        <div className="mb-5">
          <StaleBanner fetchedAt={sourceState.snapshot.fetchedAt} notice={notice} />
        </div>
      ) : null}

      {/* ── Converter card — AMOUNT-FIRST (owner request 2026-09-17: the
          number field must sit inside the first viewport, no scrolling,
          and carry hero-level visual weight). Order: amount panel (with the
          quick-amount chips inside it) → compact FROM ⇄ TO row with inline
          flags → custom rate → CTA. The legacy 65px flags section and the
          separate quick-amounts block are folded away to reclaim ~200px
          of vertical space above the fold. ── */}
      <Card padding="p-5 lg:p-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          {/* 1 — Amount hero panel (quick chips live inside the panel so they
              read as one control: tap a chip, the big field fills) */}
          <AmountInput
            id="amount"
            value={amount}
            onChange={(v) => {
              setAmount(v);
              setAmountInvalid(false);
            }}
            currency={from}
            invalid={amountInvalid}
            footer={
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((value) => {
                  const active = parsedAmount === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setAmount(thousandSeparateInput(String(value)));
                        setAmountInvalid(false);
                      }}
                      aria-pressed={active}
                      className={`min-h-[34px] cursor-pointer rounded-full border px-3 py-1 text-[0.8rem] font-bold transition-all duration-300 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                        active
                          ? 'amount-chip-active border-transparent shadow-[0_6px_18px_rgba(240,180,41,0.45)] dark:shadow-[0_6px_18px_rgba(102,126,234,0.4)]'
                          : 'border-[#EBD48A] bg-white text-currena-dark hover:border-[#E8B923] hover:shadow-[0_4px_12px_rgba(240,180,41,0.18)] dark:border-white/10 dark:bg-[#222C3B] dark:hover:border-currena-blue/40 dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                      }`}
                    >
                      {formatNumber(value, numberLocale, { maximumFractionDigits: 0 })}
                    </button>
                  );
                })}
              </div>
            }
          />

          {/* 2 — Currency pair: compact row, flags inline inside the selects */}
          <div className="mb-1.5 mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-currena-muted">{t('common.from')}</span>
            <span aria-hidden="true" className="w-11" />
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-currena-muted">{t('common.to')}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="relative">
              <img
                src={`/images/flags/${from.toLowerCase()}.png`}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute start-3 top-1/2 z-10 h-3.5 w-[22px] -translate-y-1/2 rounded-[3px] object-cover shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/60"
              />
              <CurrencySelect id="fromCurrency" value={from} onChange={setFrom} ariaLabel={t('common.from')} className="ps-10 text-[0.82rem]" />
            </div>
            <button
              type="button"
              onClick={swap}
              title={t('converter.swapCurrencies')}
              aria-label={t('converter.swapCurrencies')}
              className="h-11 w-11 cursor-pointer rounded-full border-0 bg-currena-blue text-xl font-bold text-white shadow-[0_4px_15px_rgba(74,144,226,0.3)] transition-all duration-300 hover:rotate-180 hover:scale-110 hover:shadow-[0_6px_20px_rgba(74,144,226,0.4)]"
            >
              ⇄
            </button>
            <div className="relative">
              <img
                src={`/images/flags/${to.toLowerCase()}.png`}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute start-3 top-1/2 z-10 h-3.5 w-[22px] -translate-y-1/2 rounded-[3px] object-cover shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/60"
              />
              <CurrencySelect id="toCurrency" value={to} onChange={setTo} ariaLabel={t('common.to')} className="ps-10 text-[0.82rem]" />
            </div>
          </div>
          {/* Full names caption — restores the clarity of the old flags
              section in one 16px line (the select boxes truncate long names) */}
          <p className="mt-2.5 text-center text-xs font-medium text-currena-muted">
            <bdi>{fromName}</bdi>{' '}
            <span aria-hidden="true" className="inline-block opacity-50 rtl:-scale-x-100">→</span>{' '}
            <bdi>{toName}</bdi>
          </p>

          {/* I11 — the pair's live rate, always on (previously only visible
              inside the result popup). Local math over the booted snapshot;
              hidden for same-currency pairs, unresolvable pairs and while a
              custom rate overrides the market. */}
          <LiveRateLine
            from={from}
            to={to}
            snapshot={sourceState.snapshot}
            stale={showStaleBanner}
            hidden={manualOpen}
          />

          {/* 3 — Custom rate (legacy collapsible) */}
          <div className="mb-4 mt-4">
            <button
              type="button"
              onClick={() => setManualOpen((open) => !open)}
              aria-expanded={manualOpen}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5"
            >
              <span
                className={`text-xs text-currena-blue transition-transform duration-300 ${manualOpen ? 'rotate-90' : ''}`}
                aria-hidden="true"
              >
                ▶
              </span>
              {t('converter.customRate')}
            </button>
            {manualOpen ? (
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                placeholder={t('converter.enterCustomRate')}
                aria-label={t('converter.enterCustomRate')}
                className="mt-2.5 w-full rounded-[15px] border-2 border-gray-200 bg-white px-3.5 py-3 text-sm text-currena-dark focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:bg-[#222C3B]"
              />
            ) : null}
          </div>

          <Button variant="cta" type="submit" className="w-full py-4 text-[1.15rem] sm:py-5 sm:text-[1.25rem]">
            {t('converter.convertNow')}
          </Button>
        </form>
      </Card>

      {/* Pair chips — one-tap recall. Lives BELOW the converter now: the
          amount field owns the first viewport (it used to push the input
          below the fold on phones). First-run visitors (no conversions yet)
          get POPULAR pairs instead of an empty section; after the first
          conversion their own recents take over. */}
      {(recentPairs.length > 0 || POPULAR_PAIRS.length > 0) && (
        <div className="no-print mt-5">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-currena-muted">
            {recentPairs.length > 0 ? `⚡ ${t('converter.recentPairs')}` : `🔥 ${t('converter.popularPairs')}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {(recentPairs.length > 0 ? recentPairs : POPULAR_PAIRS).map((pair) => {
              const active = pair.from === from && pair.to === to;
              return (
                <button
                  key={`${pair.from}-${pair.to}`}
                  type="button"
                  onClick={() => {
                    setFrom(pair.from);
                    setTo(pair.to);
                  }}
                  aria-pressed={active}
                  className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                    active
                      ? 'border-currena-blue bg-currena-blue/10 text-currena-blue shadow-[0_4px_12px_rgba(74,144,226,0.25)]'
                      : 'border-black/10 bg-currena-soft text-currena-dark hover:border-currena-blue/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-white/10'
                  }`}
                >
                  <img
                    src={`/images/flags/${pair.from.toLowerCase()}.png`}
                    alt=""
                    className="h-3.5 w-5 rounded-[3px] object-cover"
                  />
                  <span dir="ltr">{label(pair.from)}</span>
                  <span aria-hidden="true" className="opacity-40">→</span>
                  <img
                    src={`/images/flags/${pair.to.toLowerCase()}.png`}
                    alt=""
                    className="h-3.5 w-5 rounded-[3px] object-cover"
                  />
                  <span dir="ltr">{label(pair.to)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Failure card (legacy alert copy, rendered inline) */}
      {failure && phase === 'idle' ? (
        <Card className="mt-5 border-s-4 border-currena-warning!" padding="p-5">
          <h2 className="mb-2 text-sm font-bold text-currena-warning">⚠️ {failure.title}</h2>
          {failure.lines.map((line, i) =>
            line === '' ? (
              <div key={i} className="h-2" />
            ) : (
              <p key={i} className="text-xs text-currena-dark">
                {line}
              </p>
            ),
          )}
          {sourceState.snapshot ? (
            <p className="mt-2 text-xs text-currena-muted">
              {t('common.lastUpdated')}: {formatRelative(sourceState.snapshot.fetchedAt, numberLocale)}
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* ── LED boards two-up (owner wireframe 2026-09-20) — the SAME two
          shared board components /live-rates renders, in their compact
          CURRENT-only placement (showDayStats={false}: no DAY HIGH/DAY LOW
          columns at any viewport — the row is half the Live Rates width).
          Wireframe order: GOLD board on the start side, CURRENCY board on
          the end side; phones stack them in the same order. Both read the
          already-booted tgju snapshot — zero extra network. The former
          "at a glance" mini-board this replaces had a color-only live dot;
          these boards carry a text LIVE/CACHED/OFFLINE label next to the
          status LED (WCAG 1.4.1 non-color signifier). ── */}
      <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-2 lg:gap-8">
        <div className="led-frame led-frame-gold">
          <LedGoldBoard showDayStats={false} />
        </div>
        <div className="led-frame">
          <LedRateBoard showDayStats={false} />
        </div>
      </div>

      {/* ── Quick tools (owner wireframe 2026-09-20) — the former sidebar
          rail's tool grid as a FULL-WIDTH homepage section: 2-up on phones,
          3-up from sm, all six on one line from lg. ── */}
      <section className="no-print mt-8 lg:mt-12" aria-label={t('converter.quickTools')}>
        <h2 className="mb-4 text-base font-bold text-currena-dark">
          ⚡ {t('converter.quickTools')}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {TOOLS.map(({ path, emoji, labelKey }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-0 bg-white px-3 py-4 text-center shadow-[0_4px_16px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:bg-currena-blue/10 hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:bg-[#1A222E] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:ring-white/[0.06] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
            >
              <span className="text-2xl" aria-hidden="true">
                {emoji}
              </span>
              <span className="text-xs font-bold leading-snug text-currena-dark">
                {t(labelKey)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Fetching overlay (legacy .loading-overlay) */}
      {phase === 'fetching' ? (
        <div
          role="status"
          className="fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-[10px]"
        >
          <LoaderDots label={t('converter.fetchingLiveRates')} />
        </div>
      ) : null}

      {/* Result popup */}
      {phase === 'result' && result ? (
        <ResultPopup
          view={result}
          prevRate={prevRate}
          tgjuUrl={tgjuUrl}
          onClose={() => setPhase('idle')}
          onNewConversion={() => setPhase('idle')}
        />
      ) : null}
    </div>
  );
}
