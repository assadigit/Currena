/**
 * Calculator route (`#/calculator`) — checklist #7.
 *
 * Legacy parity (captured calculator-script.js): keypad 0-9 . + − × ÷ C ⌫ =,
 * trailing-operator replacement, "=" collapses the expression into its result,
 * "Error" flash on malformed input, and a live-converted second line that
 * re-renders as you type.
 *
 * Rebuild deltas (deliberate, mission §8 + checklist #7):
 *   - the legacy `eval()` is replaced by @currena/core evaluateExpression
 *     (safe recursive-descent parser, parentheses supported, typed errors);
 *   - the live result is the EVALUATED expression (legacy converted only
 *     `parseFloat(expr)` — the first number — while typing);
 *   - the rate comes from the snapshot store (once per freshness window) and
 *     ALL math is local.
 */

import { useEffect, useMemo, useState } from 'react';
import { CalcError, evaluateExpression, formatNumber, parseAmount, sourceForPair } from '@currena/core';
import type { CurrencyCode, SnapshotSource } from '@currena/core';
import { CurrencySelect } from '../components/CurrencySelect';
import { Card } from '../components/ui';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';

/** The 13 currencies the legacy calculator offered (captured markup). */
const CALC_CURRENCIES: readonly CurrencyCode[] = [
  'USD', 'IRR', 'AUD', 'CAD', 'EUR', 'GBP', 'AED', 'CNY', 'NZD', 'TRY', 'CHF', 'JPY', 'KRW',
];


/**
 * Legacy display grouping: the raw expression string had its integer runs
 * grouped with commas ("10000*2" → "10,000*2"). Decimal fractions stay bare.
 */
function groupDisplay(expr: string): string {
  return expr.replace(/(\d+)(\.\d*)?/g, (_match, intPart: string, fracPart?: string) => {
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fracPart !== undefined ? grouped + fracPart : grouped;
  });
}

interface KeyDef {
  label: string;
  kind: 'digit' | 'op' | 'dot' | 'clear' | 'del' | 'equals';
  value?: string;
  wide?: boolean;
}

/** Legacy keypad layout (4 columns; zero spans two). */
const KEYPAD: readonly KeyDef[] = [
  { label: 'C', kind: 'clear' },
  { label: '÷', kind: 'op', value: '÷' },
  { label: '×', kind: 'op', value: '×' },
  { label: '⌫', kind: 'del' },
  { label: '7', kind: 'digit', value: '7' },
  { label: '8', kind: 'digit', value: '8' },
  { label: '9', kind: 'digit', value: '9' },
  { label: '−', kind: 'op', value: '-' },
  { label: '4', kind: 'digit', value: '4' },
  { label: '5', kind: 'digit', value: '5' },
  { label: '6', kind: 'digit', value: '6' },
  { label: '+', kind: 'op', value: '+' },
  { label: '1', kind: 'digit', value: '1' },
  { label: '2', kind: 'digit', value: '2' },
  { label: '3', kind: 'digit', value: '3' },
  { label: '.', kind: 'dot' },
  { label: '0', kind: 'digit', value: '0', wide: true },
  { label: '=', kind: 'equals' },
];

const OPERATORS = ['+', '-', '×', '÷', '.'] as const;

/** Leading number of a partial expression (legacy `parseFloat` parity). */
function leadingNumber(expr: string): number | null {
  const match = /^-?[\d,]*\.?\d*/.exec(expr);
  if (!match || match[0] === '' || match[0] === '-') return null;
  return parseAmount(match[0]);
}

export function Calculator() {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const store = useSnapshotStore();

  const [expr, setExpr] = useState('0');
  const [from, setFrom] = useState<CurrencyCode>('USD'); // legacy defaults
  const [to, setTo] = useState<CurrencyCode>('IRR');
  const [errorFlash, setErrorFlash] = useState(false);

  const source = sourceForPair(from, to);
  const state = store[source];

  // Fetch the pair's snapshot when it changes (once per freshness window —
  // the store skips fresh ones, everything after is local math).
  useEffect(() => {
    void snapshotStore.ensureSnapshot(source);
  }, [source]);

  /** Pair rate (units of `to` per 1 `from`), or null while unavailable. */
  const pairRate = useMemo(() => {
    const snapshot = state.snapshot;
    if (!snapshot) return null;
    if (from === to) return 1;
    // Cross rate through the snapshot base — local math only.
    const rateFrom = snapshot.rates.find((r) => r.code === from)?.rate;
    const rateTo = snapshot.rates.find((r) => r.code === to)?.rate;
    if (rateFrom === undefined || rateTo === undefined || rateFrom <= 0) return null;
    return rateTo / rateFrom;
  }, [state.snapshot, from, to]);

  /**
   * Live value: the safe evaluator on every keystroke. Falls back to the
   * legacy behavior (parseFloat of the expression — its first number) while
   * the expression is mid-edit and cannot parse yet.
   */
  const liveValue = useMemo(() => {
    if (errorFlash) return null;
    try {
      return evaluateExpression(expr);
    } catch (err) {
      if (!(err instanceof CalcError)) throw err;
    }
    // Mid-edit (e.g. "100+"): legacy converted the leading number.
    const leading = leadingNumber(expr);
    return leading !== null && leading > 0 ? leading : null;
  }, [expr, errorFlash]);

  const toDecimals = to === 'IRR' ? 0 : 2;
  const converted =
    pairRate !== null && liveValue !== null ? formatNumber(liveValue * pairRate, numberLocale, { maximumFractionDigits: toDecimals }) : null;

  const press = (key: KeyDef): void => {
    if (errorFlash) setErrorFlash(false);
    switch (key.kind) {
      case 'digit':
        setExpr((prev) => (prev === '0' ? (key.value ?? '0') : prev + (key.value ?? '')));
        break;
      case 'op':
      case 'dot':
        setExpr((prev) => {
          const last = prev[prev.length - 1];
          // Legacy inputOperator: replace a trailing operator/dot.
          if (last !== undefined && (OPERATORS as readonly string[]).includes(last)) {
            return prev.slice(0, -1) + (key.value ?? (key.kind === 'dot' ? '.' : ''));
          }
          return prev + (key.value ?? (key.kind === 'dot' ? '.' : ''));
        });
        break;
      case 'clear':
        setExpr('0');
        break;
      case 'del':
        setExpr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
        break;
      case 'equals': {
        try {
          const result = evaluateExpression(expr);
          setExpr(String(result));
        } catch (err) {
          if (!(err instanceof CalcError)) throw err;
          // Legacy: "Error" for 1.5s, then clear.
          setErrorFlash(true);
          window.setTimeout(() => {
            setExpr('0');
            setErrorFlash(false);
          }, 1500);
        }
        break;
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-5 sm:max-w-[600px] lg:max-w-[900px] lg:px-10 lg:py-8">
      <Card>
        <h1 className="mb-1 text-xl font-bold text-currena-dark lg:text-2xl">
          🧮 {t('calculator.title')}
        </h1>
        <p className="mb-5 text-sm text-currena-muted">{t('calculator.subtitle')}</p>

        {/* Desktop (lg+): two columns — currency + display on the start side,
            keypad on the end side. Mobile keeps the legacy single column. */}
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          <div>
            {/* Currency selection (legacy .currency-section) */}
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <div>
                <label htmlFor="calcInputCurrency" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-currena-muted">
                  {t('calculator.inputCurrency')}
                </label>
                <CurrencySelect
                  id="calcInputCurrency"
                  value={from}
                  onChange={setFrom}
                  ariaLabel={t('calculator.inputCurrency')}
                  codes={CALC_CURRENCIES}
                />
              </div>
              <div>
                <label htmlFor="calcOutputCurrency" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-currena-muted">
                  {t('calculator.convertTo')}
                </label>
                <CurrencySelect
                  id="calcOutputCurrency"
                  value={to}
                  onChange={setTo}
                  ariaLabel={t('calculator.convertTo')}
                  codes={CALC_CURRENCIES}
                />
              </div>
            </div>

            {/* Display (legacy .display) */}
            <div className="mb-5 rounded-[18px] bg-currena-soft px-4 py-5 text-center lg:py-7">
              <div
                className="min-h-[2.4rem] overflow-x-auto text-3xl font-bold break-all text-currena-dark lg:text-4xl"
                aria-live="polite"
              >
                {errorFlash ? t('calculator.error') : groupDisplay(expr)}
              </div>
              {/* Live evaluated value (only when the expression isn't already a plain number) */}
              {liveValue !== null && !errorFlash && expr !== String(liveValue) ? (
                <div className="mt-1 text-sm font-semibold text-currena-muted">
                  = {formatNumber(liveValue, numberLocale, { maximumFractionDigits: 8 })}{' '}
                  <bdi>{label(from)}</bdi>
                </div>
              ) : null}
              <div className="mt-2 text-lg font-semibold text-currena-blue">
                {converted !== null ? (
                  <>
                    = {converted}{' '}
                    <span className="text-[0.75em] font-bold opacity-80">
                      <bdi>{label(to)}</bdi>
                    </span>
                  </>
                ) : state.status === 'error' ? (
                  t('calculator.rateUnavailable')
                ) : (
                  <>
                    = 0{' '}
                    <span className="text-[0.75em] font-bold opacity-80">
                      <bdi>{label(to)}</bdi>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Keypad (legacy .calculator-grid) */}
          <div className="grid grid-cols-4 gap-2.5 lg:content-center">
            {KEYPAD.map((key) => {
              const isClear = key.kind === 'clear';
              const isEquals = key.kind === 'equals';
              const isOp = key.kind === 'op' || key.kind === 'dot';
              return (
                <button
                  key={key.label}
                  type="button"
                  onClick={() => press(key)}
                  className={`h-[60px] cursor-pointer rounded-[15px] border-0 text-xl font-bold transition-all duration-300 active:scale-95 lg:h-[68px] ${
                    key.wide ? 'col-span-2' : ''
                  } ${
                    isEquals
                      ? 'bg-currena-blue text-white shadow-[0_4px_15px_rgba(74,144,226,0.35)] hover:-translate-y-0.5'
                      : isClear
                        ? 'bg-currena-warning/15 text-currena-warning hover:bg-currena-warning/25'
                        : isOp
                          ? 'bg-currena-cyan/20 text-currena-dark hover:bg-currena-cyan/30'
                          : 'bg-currena-soft text-currena-dark hover:bg-currena-blue/10'
                  }`}
                >
                  {key.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legacy .convert-info */}
        <p className="mt-5 text-center text-xs text-currena-muted">
          {t('calculator.convertInfo', { from, to })}
        </p>
      </Card>
    </div>
  );
}
