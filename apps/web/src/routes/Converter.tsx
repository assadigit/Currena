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
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CURRENCIES,
  CoreError,
  convert,
  convertWithManualRate,
  formatRelative,
  reverseRate,
  tgjuProfileUrl,
} from '@currena/core';
import type { ConversionResult, CurrencyCode, SnapshotSource } from '@currena/core';
import { AmountInput, parseInputAmount } from '../components/AmountInput';
import { CurrencySelect } from '../components/CurrencySelect';
import { ResultPopup } from '../components/ResultPopup';
import type { ConversionView } from '../components/ResultPopup';
import { Button, Card, LoaderDots, OfflineBanner, StaleBanner } from '../components/ui';
import { fetchMeta } from '../lib/api';
import { saveHistoryEntry } from '../lib/history';
import { useI18n } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';
import type { TranslationKey } from '../lib/locale';

type Phase = 'idle' | 'fetching' | 'result';

interface ConvertFailure {
  title: string;
  lines: string[];
}

/** Source that backs a pair (AGENTS.md rule 8 routing). */
function sourceForPair(from: string, to: string): SnapshotSource {
  return from === 'IRR' || to === 'IRR' ? 'tgju' : 'frankfurter';
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Mission §8: the fetching state is shown for at least 700ms. */
const MIN_FETCHING_MS = 700;

export function Converter() {
  const { t, numberLocale } = useI18n();
  const store = useSnapshotStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [amount, setAmount] = useState('');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [from, setFrom] = useState<CurrencyCode>('USD'); // legacy defaults
  const [to, setTo] = useState<CurrencyCode>('IRR');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualRate, setManualRate] = useState('');
  const [result, setResult] = useState<ConversionView | null>(null);
  const [failure, setFailure] = useState<ConvertFailure | null>(null);
  const [tgjuUrls, setTgjuUrls] = useState<Record<string, string>>({});

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
  const showStaleBanner = sourceState.snapshot !== null && (sourceState.stale || sourceState.degraded);
  const showOfflineBanner = !store.online && sourceState.snapshot !== null;

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
      const view = await runConversion(parsed);
      const remaining = MIN_FETCHING_MS - (Date.now() - startedAt);
      if (remaining > 0) await sleep(remaining);
      setResult(view);
      setPhase('result');
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

  const runConversion = async (parsedAmount: number): Promise<ConversionView> => {
    const manual = manualOpen ? parseInputAmount(manualRate) : null;

    if (manual !== null && manual > 0) {
      // Legacy parity: manual_rate overrides everything, source "Manual".
      const r = convertWithManualRate(parsedAmount, manual);
      return {
        amount: parsedAmount,
        from,
        to,
        result: r.amount,
        rate: r.rate,
        inverse: reverseRate(r.rate),
        source: 'manual',
        fetchedAt: new Date().toISOString(),
        stale: false,
      };
    }

    if (from === to) {
      // Gate 1 decision #5: local short-circuit, rate 1, zero network.
      return {
        amount: parsedAmount,
        from,
        to,
        result: parsedAmount,
        rate: 1,
        inverse: 1,
        source: 'local',
        fetchedAt: new Date().toISOString(),
        stale: false,
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

    const state = snapshotStore.getState()[source];
    return {
      amount: parsedAmount,
      from,
      to,
      result: conversion.amount,
      rate: conversion.rate,
      inverse: reverseRate(conversion.rate),
      source: conversion.source,
      fetchedAt: conversion.fetchedAt,
      stale: state.stale || state.servedFrom !== 'live',
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
    <div className="mx-auto w-full max-w-[500px] px-5 py-5 lg:max-w-[1200px] lg:px-10 lg:py-10">
      {showOfflineBanner ? <OfflineBanner source={pairSource} /> : null}
      {showStaleBanner && sourceState.snapshot ? (
        <div className="mb-5">
          <StaleBanner fetchedAt={sourceState.snapshot.fetchedAt} notice={notice} />
        </div>
      ) : null}

      <Card>
        {/* Flags row (legacy .flags-section) */}
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <div className="mx-auto mb-2.5 h-[65px] w-full max-w-[100px] overflow-hidden rounded-[15px] bg-currena-soft shadow-[0_4px_15px_rgba(0,0,0,0.08)] dark:bg-white/5">
              <img src={`/images/flags/${from.toLowerCase()}.png`} alt={from} className="h-full w-full object-cover" />
            </div>
            <p className="text-sm font-semibold text-currena-dark dark:text-currena-cyan">{fromName}</p>
          </div>
          <span className="text-3xl opacity-20" aria-hidden="true">
            →
          </span>
          <div className="flex-1 text-center">
            <div className="mx-auto mb-2.5 h-[65px] w-full max-w-[100px] overflow-hidden rounded-[15px] bg-currena-soft shadow-[0_4px_15px_rgba(0,0,0,0.08)] dark:bg-white/5">
              <img src={`/images/flags/${to.toLowerCase()}.png`} alt={to} className="h-full w-full object-cover" />
            </div>
            <p className="text-sm font-semibold text-currena-dark dark:text-currena-cyan">{toName}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          {/* From / swap / To (legacy .currency-selector grid) */}
          <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-currena-muted">{t('common.from')}</span>
            <span />
            <span className="text-xs font-semibold uppercase tracking-wide text-currena-muted">{t('common.to')}</span>
          </div>
          <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <CurrencySelect id="fromCurrency" value={from} onChange={setFrom} ariaLabel={t('common.from')} />
            <button
              type="button"
              onClick={swap}
              title={t('converter.swapCurrencies')}
              aria-label={t('converter.swapCurrencies')}
              className="h-[50px] w-[50px] cursor-pointer rounded-full border-0 bg-currena-blue text-2xl font-bold text-white shadow-[0_4px_15px_rgba(74,144,226,0.3)] transition-all duration-300 hover:rotate-180 hover:scale-110 hover:shadow-[0_6px_20px_rgba(74,144,226,0.4)]"
            >
              ⇄
            </button>
            <CurrencySelect id="toCurrency" value={to} onChange={setTo} ariaLabel={t('common.to')} />
          </div>

          {/* Amount panel */}
          <div className="mb-5">
            <AmountInput
              id="amount"
              value={amount}
              onChange={(v) => {
                setAmount(v);
                setAmountInvalid(false);
              }}
              currency={from}
              invalid={amountInvalid}
            />
          </div>

          {/* Custom rate (legacy collapsible) */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setManualOpen((open) => !open)}
              aria-expanded={manualOpen}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-3 py-3 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5 dark:text-white/70"
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
                className="mt-2.5 w-full rounded-[15px] border-2 border-gray-200 bg-white px-3.5 py-3.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            ) : null}
          </div>

          <Button variant="cta" type="submit" className="w-full py-5 text-[1.25rem]">
            {t('converter.convertNow')}
          </Button>
        </form>
      </Card>

      {/* Failure card (legacy alert copy, rendered inline) */}
      {failure && phase === 'idle' ? (
        <Card className="mt-5 border-s-4 !border-currena-warning">
          <h2 className="mb-2 text-sm font-bold text-currena-warning">⚠️ {failure.title}</h2>
          {failure.lines.map((line, i) =>
            line === '' ? (
              <div key={i} className="h-2" />
            ) : (
              <p key={i} className="text-xs text-currena-dark dark:text-white/80">
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
          tgjuUrl={tgjuUrl}
          onClose={() => setPhase('idle')}
          onNewConversion={() => setPhase('idle')}
        />
      ) : null}
    </div>
  );
}
