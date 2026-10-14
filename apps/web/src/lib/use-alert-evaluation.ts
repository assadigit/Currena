/**
 * use-alert-evaluation (I14) — the alert engine's heartbeat.
 *
 * Mounted once in the App shell (every route, not just the converter):
 * whenever EITHER the snapshot store emits (a generation landed — boot
 * hydration, a fresh fetch, a degraded ladder step) or the alerts store
 * changes (an alert was added/removed/acknowledged), every waiting
 * alert is re-evaluated against its pair's CURRENT snapshot rate via
 * the same `liveRateView` honesty gate the converter uses (unresolvable
 * pairs / missing snapshots simply don't fire — never a false positive
 * from a half-booted source).
 *
 * Crossings call `alertsStore.markFired` (idempotent — `crossesAlert`
 * gates on the one-way triggeredAt stamp), which:
 *   - persists the stamp (a reload keeps the ✅ state, no re-fire),
 *   - feeds the toast below.
 *
 * The toast: one line per fired alert ({pair} crossed {threshold}) plus
 * a "+N more" tail when several fired in the same pass; auto-dismisses
 * after 6s; `ackAll` (dialog open) clears it early.
 */

import { useEffect, useState } from 'react';
import { crossesAlert, formatNumber, sourceForPair } from '@currena/core';
import type { RateAlert } from '@currena/core';
import { alertsStore, useAlerts } from './alerts';
import { liveRateView } from './live-rate';
import { snapshotStore } from './snapshot-store';
import { useI18n } from './locale';
import type { TranslationKey } from './locale';

/** How long a fired toast stays up (Splitter uses 4s; alerts deserve more). */
const TOAST_MS = 6000;

export function useAlertEvaluation(): { firedToast: string | null } {
  const { t, numberLocale } = useI18n();
  const { alerts, fired } = useAlerts();
  const [toast, setToast] = useState<string | null>(null);

  // Evaluate on every store emission. Runs in the App shell — both
  // stores are already booted by the time routes render.
  useEffect(() => {
    const evaluate = (): void => {
      const state = snapshotStore.getState();
      const alertsState = alertsStore.getState().alerts;
      for (const alert of alertsState) {
        const view = liveRateView(state[sourceForPair(alert.base, alert.quote)].snapshot, alert.base, alert.quote);
        if (view && crossesAlert(alert, view.rate)) {
          alertsStore.markFired(alert.id, view.rate, Date.now());
        }
      }
    };
    evaluate();
    const unsubscribe = snapshotStore.subscribe(evaluate);
    return () => unsubscribe();
  }, [alerts]);

  // Toast feed — newest batch only; ackAll (dialog open) clears it.
  useEffect(() => {
    if (fired.length === 0) return;
    const pairName = (a: RateAlert): string =>
      `${t(`currencies.${a.base}` as TranslationKey)} → ${t(`currencies.${a.quote}` as TranslationKey)}`;
    const line = (a: RateAlert): string => {
      const irrPair = a.base === 'IRR' || a.quote === 'IRR';
      return t('alerts.firedToast', {
        pair: pairName(a),
        threshold: formatNumber(a.threshold, numberLocale, { maximumFractionDigits: irrPair ? 0 : 4 }),
      });
    };
    const first = fired[fired.length - 1];
    if (!first) return;
    const extra = fired.length - 1;
    setToast(extra > 0 ? `${line(first)}\n${t('alerts.firedMore', { count: extra })}` : line(first));
  }, [fired, t, numberLocale]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return { firedToast: toast };
}
