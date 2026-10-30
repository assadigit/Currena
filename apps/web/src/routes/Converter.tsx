/**
 * Converter route (`/`) — THE flagship (mission §8 state machine).
 *
 *   idle → fetching (loader ≥700ms, even on an instant cache hit)
 *        → result (popup + ~800ms odometer)
 *
 * Since the WS-4 module split this file is the SHELL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim):
 *
 *   converter/shared.ts           — pure constants/types (quick amounts,
 *                                   TOOLS, POPULAR_PAIRS, sleep, failure)
 *   converter/RetryCountdown.tsx  — I12's live auto-retry countdown
 *   converter/ConvertForm.tsx     — the amount-first converting card
 *   converter/AlertsSectionRow.tsx — the I14 alerts section row
 *   converter/PairChips.tsx       — recent/popular pair chips
 *   converter/FailureCard.tsx     — the I12 honest failure card
 *   converter/QuickTools.tsx      — the quick-tools anchor grid
 *
 * The shell keeps the conversion STATE MACHINE (phase, onSubmit,
 * runConversion, toFailure), every effect (meta fetch, recents hydration,
 * the A-key shortcut, I12 self-heal, deep-link prefill), the LED boards
 * row, the overlays and the dialog wiring — the machine's hook wiring is
 * the route's behavior-sensitive core (D-17's documented patterns).
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

import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CURRENCIES,
  CoreError,
  convert,
  convertWithManualRate,
  reverseRate,
  tgjuProfileUrl,
  thousandSeparateInput,
  sourceForPair,
} from '@currena/core';
import type { ConversionResult, CurrencyCode } from '@currena/core';
import { parseInputAmount } from '../components/AmountInput';
import { LedGoldBoard } from '../components/LedGoldBoard';
import { LedRateBoard } from '../components/LedRateBoard';
import { ResultPopup } from '../components/ResultPopup';
import type { ConversionView } from '../components/ResultPopup';
import { LoaderDots, OfflineBanner, StaleBanner } from '../components/ui';
import { ApiError, fetchMeta } from '../lib/api';
import { alertsStore, useAlerts } from '../lib/alerts';
import { saveHistoryEntry } from '../lib/history';
import { useI18n } from '../lib/locale';
import { addRecentPair, readRecentPairs } from '../lib/recent-pairs';
import type { RecentPair } from '../lib/recent-pairs';
import { routeQuery } from '../router';
import { isConfirmedStale, snapshotStore, useSnapshotStore } from '../lib/snapshot-store';
import { AlertsSectionRow } from './converter/AlertsSectionRow';
import { ConvertForm } from './converter/ConvertForm';
import { FailureCard } from './converter/FailureCard';
import { PairChips } from './converter/PairChips';
import { QuickTools } from './converter/QuickTools';
import { MIN_FETCHING_MS, sleep, type ConvertFailure } from './converter/shared';

// I14 — the alerts dialog is LAZY (bundle budget: the money page's entry
// chunk carries the section row + badge + evaluation engine; the dialog's
// form + list only download when the user actually opens it — same rule
// as the seven tool routes in App.tsx).
const AlertsDialog = lazy(() => import('../components/AlertsDialog').then((m) => ({ default: m.AlertsDialog })));

type Phase = 'idle' | 'fetching' | 'result';

export function Converter() {
  const { t } = useI18n();
  const store = useSnapshotStore();
  // I14 — rate alerts: the section row's badge/dialog wiring.
  const { alerts, seenAt } = useAlerts();
  const [alertsOpen, setAlertsOpen] = useState(false);

  const [phase, setPhase] = useState<Phase>('idle');
  /** The control that opened the result popup — focus returns there on close (audit D-3). */
  const resultOpenerRef = useRef<HTMLElement | null>(null);
  const [amount, setAmount] = useState('');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [from, setFrom] = useState<CurrencyCode>('USD'); // legacy defaults
  const [to, setTo] = useState<CurrencyCode>('IRR');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualRate, setManualRate] = useState('');
  /** The custom-rate region's id — the collapsible button's aria-controls
   *  points here (ToolsMenu pattern; the input mounts only while open). */
  const manualRateId = useId();
  const [result, setResult] = useState<ConversionView | null>(null);
  /** Baseline rate from the previous snapshot generation (▲/▼ in the popup). */
  const [prevRate, setPrevRate] = useState<number | null>(null);
  const [failure, setFailure] = useState<ConvertFailure | null>(null);
  const [tgjuUrls, setTgjuUrls] = useState<Record<string, string>>({});
  // Recent pairs — read ONCE via the lazy initializer (WS-5: the mount
  // effect's set-state was the D-17-accepted shape; the lazy read is the
  // lint-clean equivalent — same first paint, one fewer render pass).
  // Written after each conversion (addRecentPair → setRecentPairs).
  const [recentPairs, setRecentPairs] = useState<RecentPair[]>(() => readRecentPairs());

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

  // I14 — `A` opens the alerts dialog (desktop keyboards; the same guard
  // family as Insights' / J K: skip while typing, with modifiers, or when
  // a dialog is already open). Live in THIS route only — Insights keeps
  // its own key namespace.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (alertsOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== 'a') return;
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      alertsStore.ackAll();
      setAlertsOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [alertsOpen]);

  // I14 — badge: triggered-but-unseen alerts (one-way seenAt stamp; a
  // reload never re-nags). The sub-line summarizes the list when it has
  // entries (waiting/triggered counts, Persian digits in fa).
  const unseenTriggered = alerts.filter((a) => a.triggeredAt !== undefined && (seenAt === null || a.triggeredAt > seenAt)).length;
  const waitingCount = alerts.filter((a) => a.triggeredAt === undefined).length;
  const triggeredCount = alerts.length - waitingCount;

  // Deep-link prefill: /?from=EUR&to=IRR&amount=500 — powers History's
  // "Repeat" action AND shareable conversion links. Unknown values are
  // dropped silently; the URL is cleaned so a later remount never re-applies.
  useEffect(() => {
    const params = routeQuery();
    if ([...params.keys()].length === 0) return;
    const known = new Set<string>(CURRENCIES.map((c) => c.code));
    const from = params.get('from')?.trim().toUpperCase();
    const to = params.get('to')?.trim().toUpperCase();
    const amount = params.get('amount') ?? '';
    // R10-5: one-time URL prefill on mount. The setState calls hydrate
    // the component from the URL — the documented "initialize state from
    // an external source" pattern (the empty dep array is intentional:
    // this runs once). A lazy useState initializer cannot reach
    // window.location.search at module-eval time (SSR safety).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time URL prefill on mount (external source → local state)
    if (from && known.has(from)) setFrom(from as CurrencyCode);
    if (to && known.has(to)) setTo(to as CurrencyCode);
    const parsed = parseInputAmount(amount);
    if (parsed !== null && parsed > 0) setAmount(thousandSeparateInput(amount));
    window.history.replaceState(null, '', '/');
  }, []);

  const parsedAmount = parseInputAmount(amount);

  const swap = (): void => {
    setFrom(to);
    setTo(from);
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

  /** Friendly i18n failure card from the typed error (mission: no raw
   *  dumps). I12: HONEST about WHO failed — the API answering with an
   *  error envelope (ApiError kind 'rates'/'parse', e.g. the 2026-10-07
   *  incident's 500 windows) is a temporary SERVER issue: never tell the
   *  user to "check your connection" while their network is fine. Only a
   *  network-layer failure (fetch threw) or being offline blames the
   *  connection. */
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
    if (err instanceof ApiError && err.kind !== 'network') {
      // The server ANSWERED with an error — self-healing retry is already
      // scheduled by the store; the card says so and counts down. The title
      // stays neutral (no "check your connection" — their network is fine).
      return {
        title: t('converter.conversionFailedServer'),
        lines: [t('errors.serverTemporarilyUnavailable'), t('errors.retryingAutomatically')],
      };
    }
    return {
      title: t('converter.conversionFailed'),
      lines: [t('errors.cantReachServer'), t('converter.checkConnection')],
    };
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
    // The dialog discipline returns focus here on close (audit D-3) —
    // capture the submit control BEFORE the async gap blurs it.
    resultOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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


  // I12 self-heal completion: when the CURRENT pair's source recovers
  // (error → ready — the store's retry ladder landed data) while a failure
  // card is on screen, finish the interrupted conversion automatically.
  // The user already asked for it; the app just needed the outage window
  // to pass. 'loading' is transitional (error → loading → ready): skipped
  // so the remembered status stays 'error' until the fetch SETTLES.
  // (WS-5: moved below onSubmit's declaration — the access-before-declared
  // advisory was pure declaration order; effect behavior unchanged.)
  // R10-5: onSubmit is held in a ref so the effect's dep array stays
  // focused on the transition signals (store/pairSource/failure/phase).
  // Adding onSubmit directly to the deps would re-fire on every render
  // (it's a closure that changes identity each render), breaking the
  // "only fire on error→ready transition" contract. The ref assignment
  // rides a layout-effect so it never reads/writes the ref during render
  // (the react-hooks/refs rule).
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });
  const prevSourceStatusRef = useRef<'idle' | 'loading' | 'ready' | 'error' | undefined>(undefined);
  useEffect(() => {
    const status = store[pairSource].status;
    if (status === 'loading') return; // transitional — keep the memory
    const prev = prevSourceStatusRef.current;
    prevSourceStatusRef.current = status;
    if (prev === 'error' && status === 'ready' && failure !== null && phase === 'idle') {
      void onSubmitRef.current();
    }
  }, [store, pairSource, failure, phase]);

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
      {/* The page's h1 (QA audit D-2): every other route has one; the
          converter is the money page — its heading stays screen-reader-only
          so the owner's amount-first first viewport is untouched visually. */}
      <h1 className="sr-only">{t('converter.title')}</h1>
      {showOfflineBanner ? <OfflineBanner source={pairSource} /> : null}
      {showStaleBanner && sourceState.snapshot ? (
        <div className="mb-5">
          <StaleBanner fetchedAt={sourceState.snapshot.fetchedAt} notice={notice} />
        </div>
      ) : null}

      {/* ── Converter card — AMOUNT-FIRST (owner request 2026-09-17) ── */}
      <ConvertForm
        amount={amount}
        setAmount={setAmount}
        amountInvalid={amountInvalid}
        setAmountInvalid={setAmountInvalid}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        swap={swap}
        parsedAmount={parsedAmount}
        manualOpen={manualOpen}
        setManualOpen={setManualOpen}
        manualRate={manualRate}
        setManualRate={setManualRate}
        manualRateId={manualRateId}
        pairSnapshot={sourceState.snapshot}
        showStaleBanner={showStaleBanner}
        onSubmit={() => void onSubmit()}
      />

      {/* I14 — Rate alerts section row: the one-tap door to the alerts
          dialog (A key on desktop too). Badge = triggered-but-unseen; the
          sub-line summarizes the list once entries exist. */}
      <AlertsSectionRow
        alertsLength={alerts.length}
        waitingCount={waitingCount}
        triggeredCount={triggeredCount}
        unseenTriggered={unseenTriggered}
        onOpen={() => {
          alertsStore.ackAll();
          setAlertsOpen(true);
        }}
      />

      {/* Pair chips — one-tap recall. Lives BELOW the converter now: the
          amount field owns the first viewport (it used to push the input
          below the fold on phones). First-run visitors (no conversions yet)
          get POPULAR pairs instead of an empty section; after the first
          conversion their own recents take over. */}
      <PairChips
        recentPairs={recentPairs}
        from={from}
        to={to}
        onPick={(pair) => {
          setFrom(pair.from);
          setTo(pair.to);
        }}
      />

      {/* Failure card (I12 redesign: honest kind-aware copy + Try again +
          the live auto-retry countdown while the store self-heals). */}
      {failure && phase === 'idle' ? (
        <FailureCard
          failure={failure}
          nextRetryAt={sourceState.nextRetryAt}
          snapshotFetchedAt={sourceState.snapshot?.fetchedAt ?? null}
          onRetry={() => void onSubmit()}
        />
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

      <QuickTools />

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
          returnFocusToRef={resultOpenerRef}
        />
      ) : null}

      {/* I14 — Rate alerts dialog (A key or the section row; lazy chunk) */}
      {alertsOpen ? (
        <Suspense fallback={null}>
          <AlertsDialog defaultBase={from} defaultQuote={to} onClose={() => setAlertsOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}
