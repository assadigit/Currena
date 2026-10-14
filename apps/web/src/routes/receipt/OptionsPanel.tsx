/**
 * receipt/OptionsPanel — the collapsible "Additional options" block
 * (legacy collapsible + sub-switches): multi-day date range, per-item
 * currency, per-item time, budget tracking, split-expenses preview.
 * (Phase: WS-4 module split of the former Receipt.tsx monolith — zero
 * behavior change, code moved verbatim; the shell owns the state and
 * passes the setters. The optionsOpen Switch itself lives in the shell
 * next to this panel — the disclosure pairing.)
 */

import { thousandSeparateInput } from '@currena/core';
import { Switch } from '../../components/ui';
import { useI18n } from '../../lib/locale';
import { inputClass, todayStr } from './shared';

export function OptionsPanel(props: {
  multiDay: boolean;
  setMultiDay: (v: boolean) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  perItemCurrency: boolean;
  setPerItemCurrency: (v: boolean) => void;
  withTime: boolean;
  setWithTime: (v: boolean) => void;
  budgetOn: boolean;
  setBudgetOn: (v: boolean) => void;
  budgetAmount: string;
  setBudgetAmount: (v: string) => void;
  splitOn: boolean;
  setSplitOn: (v: boolean) => void;
  splitPeople: number;
  setSplitPeople: (v: number) => void;
}) {
  const { t } = useI18n();
  const {
    multiDay,
    setMultiDay,
    endDate,
    setEndDate,
    perItemCurrency,
    setPerItemCurrency,
    withTime,
    setWithTime,
    budgetOn,
    setBudgetOn,
    budgetAmount,
    setBudgetAmount,
    splitOn,
    setSplitOn,
    splitPeople,
    setSplitPeople,
  } = props;

  return (
    <div className="mt-2 space-y-1 rounded-[15px] bg-currena-soft/50 px-3.5 py-3">
      <Switch id="multiDayToggle" checked={multiDay} onChange={setMultiDay} label={t('receipt.multiDayReceipt')} />
      {multiDay ? (
        <div className="pb-2 ps-1">
          <label htmlFor="receiptEndDate" className="mb-1 block text-xs font-semibold text-currena-muted">
            {t('receipt.endDate')}
          </label>
          <input
            id="receiptEndDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value || todayStr())}
            className={inputClass}
          />
        </div>
      ) : null}
      <Switch
        id="perItemCurrencyToggle"
        checked={perItemCurrency}
        onChange={setPerItemCurrency}
        label={t('receipt.differentCurrencyPerItem')}
      />
      <Switch id="timeToggle" checked={withTime} onChange={setWithTime} label={t('receipt.addTimeToItems')} />
      <Switch id="budgetToggle" checked={budgetOn} onChange={setBudgetOn} label={t('receipt.budgetTracking')} />
      {budgetOn ? (
        <div className="pb-2 ps-1">
          <label htmlFor="budgetAmount" className="mb-1 block text-xs font-semibold text-currena-muted">
            {t('receipt.dailyBudget')}
          </label>
          <input
            id="budgetAmount"
            type="text"
            inputMode="decimal"
            dir="ltr"
            placeholder={t('receipt.budgetPlaceholder')}
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(thousandSeparateInput(e.target.value))}
            className={inputClass}
          />
        </div>
      ) : null}
      <Switch id="splitToggle" checked={splitOn} onChange={setSplitOn} label={t('receipt.splitExpenses')} />
      {splitOn ? (
        <div className="pb-2 ps-1">
          <label htmlFor="splitPeople" className="mb-1 block text-xs font-semibold text-currena-muted">
            {t('receipt.numberOfPeople')}
          </label>
          <input
            id="splitPeople"
            type="number"
            min={2}
            max={10}
            value={splitPeople}
            onChange={(e) => setSplitPeople(Math.max(2, Math.min(10, Number(e.target.value) || 2)))}
            className={inputClass}
          />
        </div>
      ) : null}
    </div>
  );
}
