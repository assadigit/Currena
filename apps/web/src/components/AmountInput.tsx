/**
 * AmountInput — legacy converter amount panel (FEATURE_MAP §1):
 * cream/gold gradient, 💰 icon, thousand separators as you type
 * (@currena/core thousandSeparateInput — Persian-digit tolerant via
 * parseAmount), currency hint under the inline-end edge.
 */

import { parseAmount, thousandSeparateInput } from '@currena/core';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';

export interface AmountInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** From-currency code for the hint ("0.00 USD"). */
  currency: string;
  invalid?: boolean;
}

export function AmountInput({ id, value, onChange, currency, invalid }: AmountInputProps) {
  const { t } = useI18n();
  const label = useCodeLabel();

  const hintAmount = value === '' ? '0.00' : value;

  return (
    <div className="amount-panel rounded-[20px] p-5 lg:px-6">
      <label htmlFor={id} className="mb-3 block text-[1.05rem] font-extrabold uppercase tracking-wide text-currena-dark">
        {t('converter.enterAmount')}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-[1.7rem]" aria-hidden="true">
          💰
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('converter.amountPlaceholder')}
          value={value}
          aria-invalid={invalid === true}
          onChange={(e) => onChange(thousandSeparateInput(e.target.value))}
          className={`w-full rounded-[15px] bg-white px-4 py-4 ps-14 text-2xl font-bold text-currena-dark shadow-[0_4px_15px_rgba(0,0,0,0.08)] placeholder:font-medium placeholder:text-[#bdc3c7] focus:outline-none focus:ring-3 focus:ring-currena-blue/30 ${
            invalid ? 'ring-3 ring-currena-warning/50' : ''
          }`}
        />
        <span className="pointer-events-none absolute end-4 bottom-2.5 text-[0.7rem] font-medium text-currena-dark/40">
          {hintAmount} <bdi>{label(currency)}</bdi>
        </span>
      </div>
      {invalid ? <p className="mt-2 text-xs font-semibold text-currena-warning">{t('converter.enterValidAmount')}</p> : null}
    </div>
  );
}

/** Parse helper shared by the converter (null-safe, separator-tolerant). */
export function parseInputAmount(value: string): number | null {
  return parseAmount(value);
}
