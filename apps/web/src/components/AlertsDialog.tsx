/**
 * AlertsDialog (I14) — create, review and delete rate alerts.
 *
 * The converter's section row opens this overlay (ResultPopup pattern:
 * role="dialog" + aria-modal, Escape closes, backdrop click closes,
 * focus starts on the close button). Two zones:
 *
 *   1. CREATE — pair selects (the same CurrencySelect the form uses,
 *      pre-filled with the converter's current pair), an above/below
 *      segmented control and a target-rate input (AmountInput parsing:
 *      Persian digits + thousands separators). The pair's CURRENT rate
 *      sits right under the input so the user never guesses a target.
 *   2. LIST — every alert with its honest status: ⏳ waiting (with the
 *      live rate) or ✅ triggered (rate + relative time), plus delete.
 *
 * Honesty rules (mission §"never mislead"): the footer says alerts are
 * checked while Currena is open — no background-push claims. A custom
 * exchange rate in the converter does NOT affect evaluation (alerts
 * always read the market snapshot).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALERTS_CAP,
  formatNumber,
  formatRelative,
  sourceForPair,
} from '@currena/core';
import type { AlertDirection, CurrencyCode } from '@currena/core';
import { CurrencySelect } from './CurrencySelect';
import { parseInputAmount } from './AmountInput';
import { Button, Card } from './ui';
import { alertsStore, useAlerts } from '../lib/alerts';
import { liveRateView, rateDecimals } from '../lib/live-rate';
import { useSnapshotStore } from '../lib/snapshot-store';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';

export interface AlertsDialogProps {
  /** The converter's current pair — pre-fills the create form. */
  defaultBase: CurrencyCode;
  defaultQuote: CurrencyCode;
  onClose: () => void;
}

export function AlertsDialog({ defaultBase, defaultQuote, onClose }: AlertsDialogProps) {
  const { t, numberLocale } = useI18n();
  const { alerts } = useAlerts();
  const store = useSnapshotStore();

  const [base, setBase] = useState<CurrencyCode>(defaultBase);
  const [quote, setQuote] = useState<CurrencyCode>(defaultQuote);
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Escape closes (ResultPopup a11y twin); initial focus on the close X.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const source = sourceForPair(base, quote);
  const view = liveRateView(store[source].snapshot, base, quote);
  const irrPair = base === 'IRR' || quote === 'IRR';
  const decimals = view ? rateDecimals(view.rate, irrPair) : irrPair ? 0 : 4;
  const currentRateText = view
    ? formatNumber(view.rate, numberLocale, { maximumFractionDigits: decimals })
    : null;

  // Live "waiting" rates for each distinct list pair (one shared lookup map).
  const listRates = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of alerts) {
      const key = `${a.base}/${a.quote}`;
      if (map.has(key)) continue;
      const v = liveRateView(store[sourceForPair(a.base, a.quote)].snapshot, a.base, a.quote);
      if (v) {
        const pairIrr = a.base === 'IRR' || a.quote === 'IRR';
        map.set(
          key,
          formatNumber(v.rate, numberLocale, { maximumFractionDigits: rateDecimals(v.rate, pairIrr) }),
        );
      } else {
        map.set(key, t('common.na'));
      }
    }
    return map;
  }, [alerts, store, numberLocale]);

  const addAlert = (): void => {
    const parsed = parseInputAmount(threshold);
    if (base === quote) {
      setError(t('alerts.sameCurrency'));
      return;
    }
    if (parsed === null || parsed <= 0) {
      setError(t('alerts.invalidThreshold'));
      return;
    }
    const ok = alertsStore.add({ base, quote, direction, threshold: parsed });
    if (!ok) {
      setError(t('alerts.capReached', { max: formatNumber(ALERTS_CAP, numberLocale) }));
      return;
    }
    setError(null);
    setThreshold('');
  };

  const pairLabel = (from: CurrencyCode, to: CurrencyCode): string =>
    `${t(`currencies.${from}` as TranslationKey)} → ${t(`currencies.${to}` as TranslationKey)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('alerts.openDialog')}
      className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[10px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        padding="p-4 sm:p-6"
        className="popup-slide-up relative max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-[26px]"
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

        <h2 className="mb-1 me-10 text-base font-bold text-currena-dark">🔔 {t('alerts.title')}</h2>
        <p className="mb-4 text-xs text-currena-muted">{t('alerts.honestNote')}</p>

        {/* ── 1 — CREATE ─────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addAlert();
          }}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="alert-base" className="mb-1 block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-currena-muted">
                {t('alerts.from')}
              </label>
              <CurrencySelect id="alert-base" value={base} onChange={setBase} ariaLabel={t('alerts.from')} className="text-[0.82rem]" />
            </div>
            <div>
              <label htmlFor="alert-quote" className="mb-1 block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-currena-muted">
                {t('alerts.to')}
              </label>
              <CurrencySelect id="alert-quote" value={quote} onChange={setQuote} ariaLabel={t('alerts.to')} className="text-[0.82rem]" />
            </div>
            <div className="col-span-2 sm:col-span-1 sm:self-end">
              <span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-currena-muted">
                {t('alerts.direction')}
              </span>
              <div
                role="radiogroup"
                aria-label={t('alerts.direction')}
                className="flex h-11 items-center gap-1 rounded-[15px] bg-currena-soft p-1 dark:bg-[#222C3B]"
              >
                {(['above', 'below'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    role="radio"
                    aria-checked={direction === dir}
                    onClick={() => setDirection(dir)}
                    className={`h-full flex-1 cursor-pointer rounded-xl border-0 px-2 text-[0.72rem] font-bold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                      direction === dir
                        ? // I6-audited selected pattern (FilterBar chips): tinted
                          // surface + the -deep text token — WCAG-AA in BOTH
                          // themes (white-on-currena-blue measured 2.35:1 dark).
                          'bg-currena-blue/15 text-currena-blue-deep shadow-[inset_0_0_0_1.5px_rgba(74,144,226,0.4)]'
                        : 'text-currena-muted hover:text-currena-dark dark:hover:text-slate-200'
                    }`}
                  >
                    {dir === 'above' ? `↑ ${t('alerts.above')}` : `↓ ${t('alerts.below')}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="alert-threshold" className="mb-1 block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-currena-muted">
              {t('alerts.threshold')}
            </label>
            <input
              id="alert-threshold"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setError(null);
              }}
              dir="ltr"
              placeholder={view ? formatNumber(view.rate, numberLocale, { maximumFractionDigits: decimals }) : '0'}
              className="w-full rounded-[15px] border-2 border-gray-200 bg-white px-3.5 py-3 text-sm font-semibold text-currena-dark focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:bg-[#222C3B] dark:text-slate-100"
            />
            <p className="mt-1.5 text-xs text-currena-muted">
              {currentRateText !== null ? (
                <>
                  {t('alerts.currentRateLabel')}{' '}
                  <span dir="ltr" className="font-bold text-currena-dark dark:text-slate-200">
                    {currentRateText}
                  </span>
                </>
              ) : (
                t('alerts.sameCurrency')
              )}
            </p>
          </div>

          {error ? (
            <p role="alert" className="mt-2 text-xs font-semibold text-currena-warning-deep">
              {error}
            </p>
          ) : null}

          <Button variant="cta" type="submit" className="mt-3 w-full py-3 text-sm">
            {t('alerts.add')}
          </Button>
        </form>

        {/* ── 2 — LIST ───────────────────────────────────────────────── */}
        {alerts.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-currena-soft px-4 py-4 text-center text-xs leading-relaxed text-currena-muted dark:bg-[#222C3B]">
            {t('alerts.empty')}
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {alerts.map((a) => {
              const key = `${a.base}/${a.quote}`;
              const rateText = listRates.get(key) ?? t('common.na');
              const triggered = a.triggeredAt !== undefined;
              const triggeredRateText =
                a.triggeredRate !== undefined
                  ? formatNumber(a.triggeredRate, numberLocale, {
                      maximumFractionDigits: a.base === 'IRR' || a.quote === 'IRR' ? 0 : 4,
                    })
                  : '';
              return (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 rounded-2xl border-s-[3px] px-3 py-2.5 ${
                    triggered
                      ? 'border-currena-success bg-currena-success/[0.08]'
                      : 'border-currena-cyan bg-currena-cyan/[0.06]'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[0.82rem] font-bold text-currena-dark">
                      {pairLabel(a.base, a.quote)}
                    </p>
                    <p className="m-0 mt-0.5 text-[0.7rem] font-semibold text-currena-muted">
                      {t(`alerts.${a.direction}`)}{' '}
                      <span dir="ltr">
                        {formatNumber(a.threshold, numberLocale, {
                          maximumFractionDigits: a.base === 'IRR' || a.quote === 'IRR' ? 0 : 4,
                        })}
                      </span>
                      {' · '}
                      {triggered
                        ? `${t('alerts.triggered', { rate: triggeredRateText })}${
                            a.triggeredAt !== undefined
                              ? ` · ${formatRelative(new Date(a.triggeredAt).toISOString(), numberLocale)}`
                              : ''
                          }`
                        : t('alerts.waiting', { rate: rateText })}
                    </p>
                  </span>
                  <span className="text-lg" aria-hidden="true">
                    {triggered ? '✅' : '⏳'}
                  </span>
                  <button
                    type="button"
                    onClick={() => alertsStore.remove(a.id)}
                    aria-label={`${t('alerts.remove')}: ${pairLabel(a.base, a.quote)}`}
                    className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-currena-warning/10 text-base text-currena-warning-deep transition-all duration-300 hover:bg-currena-warning/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
                  >
                    🗑
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
