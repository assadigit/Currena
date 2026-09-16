/**
 * Expense splitter route (`#/splitter`) — checklist #10.
 *
 * Port of the legacy expense-splitter page: total amount, currency, people
 * count, optional second-currency display, breakdown list.
 *
 * Rebuild deltas:
 *   - the split uses LARGEST-REMAINDER rounding at the currency's precision,
 *     so per-person shares sum EXACTLY to the total (legacy just divided and
 *     formatted, leaking cents);
 *   - the second-currency view converts per-person amounts locally through
 *     the snapshot store (network once per freshness window) and labels the
 *     rate used.
 */

import { useEffect, useMemo, useState } from 'react';
import { convert, formatNumber, parseAmount, thousandSeparateInput } from '@currena/core';
import type { CurrencyCode, SnapshotSource } from '@currena/core';
import { CurrencySelect } from '../components/CurrencySelect';
import { Button, Card, Switch, Toast } from '../components/ui';
import { useI18n } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';

function sourceForPair(from: string, to: string): SnapshotSource {
  return from === 'IRR' || to === 'IRR' ? 'tgju' : 'frankfurter';
}

/**
 * Largest-remainder split: floor every share at `decimals`, then hand the
 * leftover units to the earliest people — the shares sum to EXACTLY total
 * (rounded to `decimals`), no drift.
 */
function splitEvenly(total: number, people: number, decimals: number): number[] {
  const scale = 10 ** decimals;
  const totalUnits = Math.round(total * scale);
  const base = Math.floor(totalUnits / people);
  let remainder = totalUnits - base * people;
  const shares = Array.from({ length: people }, () => base);
  for (let i = 0; remainder > 0; i = (i + 1) % people, remainder--) {
    shares[i] = (shares[i] ?? 0) + 1;
  }
  return shares.map((units) => units / scale);
}

interface SplitResult {
  total: number;
  shares: number[];
  perPersonSecond: number | null;
  rate: number | null;
}

export function Splitter() {
  const { t, numberLocale } = useI18n();
  const store = useSnapshotStore();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD'); // legacy default
  const [people, setPeople] = useState(2);
  const [secondOpen, setSecondOpen] = useState(false);
  const [second, setSecond] = useState<CurrencyCode>('IRR'); // legacy default
  const [result, setResult] = useState<SplitResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const secondSource = secondOpen ? sourceForPair(currency, second) : null;
  useEffect(() => {
    if (secondSource) void snapshotStore.ensureSnapshot(secondSource);
  }, [secondSource]);

  const decimals = currency === 'IRR' ? 0 : 2;
  const fmt = (value: number, code: string): string =>
    formatNumber(value, numberLocale, {
      minimumFractionDigits: code === 'IRR' ? 0 : 2,
      maximumFractionDigits: code === 'IRR' ? 0 : 2,
    });

  const onSplit = async (): Promise<void> => {
    const total = parseAmount(amount);
    if (total === null || total <= 0 || !Number.isFinite(total)) {
      setToast(t('expenseSplitter.validTotal'));
      return;
    }
    if (!Number.isInteger(people) || people < 1 || people > 100) {
      setToast(t('expenseSplitter.validPeople'));
      return;
    }

    const shares = splitEvenly(total, people, decimals);

    let perPersonSecond: number | null = null;
    let rate: number | null = null;
    if (secondOpen && secondSource && currency !== second) {
      const snapshot = await snapshotStore.ensureSnapshot(secondSource);
      if (snapshot) {
        try {
          const perPerson = total / people;
          const conversion = convert(snapshot, currency, second, perPerson);
          perPersonSecond = conversion.amount;
          rate = convert(snapshot, currency, second, 1).rate;
        } catch {
          perPersonSecond = null;
        }
      }
    }

    setResult({ total, shares, perPersonSecond, rate });
  };

  const state = secondSource ? store[secondSource] : null;
  const secondError =
    secondOpen && result !== null && result.perPersonSecond === null && currency !== second;

  const peopleLabel = useMemo(
    () => formatNumber(people, numberLocale, { maximumFractionDigits: 0 }),
    [people, numberLocale],
  );

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-6 lg:px-10">
      <h1 className="mb-1 text-xl font-bold text-currena-dark dark:text-white">
        💰 {t('expenseSplitter.title')}
      </h1>

      <Card className="mb-5">
        {/* Total amount */}
        <label htmlFor="splitTotal" className="mb-1.5 block text-sm font-bold text-currena-dark dark:text-white">
          {t('expenseSplitter.totalExpenseAmount')}
        </label>
        <input
          id="splitTotal"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          dir="ltr"
          value={amount}
          placeholder={t('expenseSplitter.totalPlaceholder')}
          onChange={(e) => setAmount(thousandSeparateInput(e.target.value))}
          className="mb-4 w-full rounded-[15px] border-2 border-gray-200 bg-white px-4 py-3.5 text-lg font-bold text-currena-dark focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:text-white"
        />

        {/* Currency */}
        <label htmlFor="splitCurrency" className="mb-1.5 block text-sm font-bold text-currena-dark dark:text-white">
          {t('expenseSplitter.amountCurrency')}
        </label>
        <div className="mb-4">
          <CurrencySelect
            id="splitCurrency"
            value={currency}
            onChange={(v) => {
              setCurrency(v);
              setResult(null);
            }}
            ariaLabel={t('expenseSplitter.amountCurrency')}
          />
        </div>

        {/* People stepper (legacy: number input 1-100) */}
        <label htmlFor="splitPeople" className="mb-1.5 block text-sm font-bold text-currena-dark dark:text-white">
          {t('expenseSplitter.numberOfPeople')}
        </label>
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            aria-label="-"
            onClick={() => setPeople((p) => Math.max(1, p - 1))}
            className="h-11 w-11 cursor-pointer rounded-full border-0 bg-currena-soft text-xl font-bold text-currena-dark transition-all duration-300 hover:bg-currena-blue/15 active:scale-95 dark:bg-white/10 dark:text-white"
          >
            −
          </button>
          <output
            id="splitPeople"
            aria-live="polite"
            className="min-w-16 flex-1 rounded-[15px] border-2 border-gray-200 bg-white py-2.5 text-center text-lg font-bold text-currena-dark dark:border-white/10 dark:text-white"
          >
            {peopleLabel}
          </output>
          <button
            type="button"
            aria-label="+"
            onClick={() => setPeople((p) => Math.min(100, p + 1))}
            className="h-11 w-11 cursor-pointer rounded-full border-0 bg-currena-soft text-xl font-bold text-currena-dark transition-all duration-300 hover:bg-currena-blue/15 active:scale-95 dark:bg-white/10 dark:text-white"
          >
            +
          </button>
        </div>

        {/* Second currency */}
        <Switch
          id="splitSecondToggle"
          checked={secondOpen}
          onChange={(checked) => {
            setSecondOpen(checked);
            setResult(null);
          }}
          label={t('expenseSplitter.showInSecondCurrency')}
        />
        {secondOpen ? (
          <div className="mt-2 mb-1">
            <label htmlFor="splitSecond" className="mb-1.5 block text-xs font-semibold text-currena-muted">
              {t('expenseSplitter.secondCurrency')}
            </label>
            <CurrencySelect
              id="splitSecond"
              value={second}
              onChange={setSecond}
              ariaLabel={t('expenseSplitter.secondCurrency')}
            />
          </div>
        ) : null}

        <Button variant="cta" className="mt-5 w-full py-4" onClick={() => void onSplit()}>
          {t('expenseSplitter.splitExpense')}
        </Button>
      </Card>

      {/* Results */}
      {result ? (
        <Card>
          <h2 className="mb-4 text-base font-bold text-currena-dark dark:text-white">
            {t('expenseSplitter.splitResults')}
          </h2>

          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-currena-muted">{t('expenseSplitter.totalAmount')}</span>
              <span className="font-bold text-currena-dark dark:text-white">
                {fmt(result.total, currency)} {currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-currena-muted">👤 {t('expenseSplitter.eachPersonPays')}</span>
              <span className="text-lg font-bold text-currena-blue dark:text-currena-cyan">
                {fmt(result.shares[0] ?? 0, currency)} {currency}
              </span>
            </div>
            {/* Second currency view (converted locally, rate labeled) */}
            {result.perPersonSecond !== null ? (
              <div className="ps-6 text-sm">
                <span dir="ltr">= </span>
                <strong>
                  {fmt(result.perPersonSecond, second)} {second}
                </strong>
                {result.rate !== null ? (
                  <p className="mt-1 text-xs text-currena-muted">
                    {t('expenseSplitter.rateLabel', {
                      from: currency,
                      to: second,
                      rate: formatNumber(result.rate, numberLocale, {
                        maximumFractionDigits: second === 'IRR' ? 0 : 4,
                      }),
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
            {secondError ? (
              <p className="ps-6 text-sm text-currena-warning">
                {state?.status === 'error'
                  ? t('expenseSplitter.networkError')
                  : t('expenseSplitter.conversionFailed')}
              </p>
            ) : null}
          </div>

          {/* Breakdown (legacy list) */}
          <p className="mb-2 text-sm font-bold text-currena-dark dark:text-white">
            {t('expenseSplitter.breakdown')}
          </p>
          <div className="space-y-1.5">
            {result.shares.map((share, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-[10px] bg-currena-soft/70 px-3 py-2 text-sm dark:bg-white/5"
              >
                <span aria-hidden="true">👤</span>
                <span className="text-currena-muted">
                  {t('expenseSplitter.personLabel', { n: formatNumber(i + 1, numberLocale, { maximumFractionDigits: 0 }) })}
                </span>
                <span className="ms-auto font-bold text-currena-dark dark:text-white">
                  {fmt(share, currency)} {currency}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
