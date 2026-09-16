/**
 * CurrencySelect — native <select> over the 17 legacy currencies
 * (FEATURE_MAP §5), grouped: Iranian Toman first, then international
 * currencies. Native selects keep the legacy mobile UX (OS picker) and need
 * no search UI — the legacy app had none. Display names come from the i18n
 * dictionary (international common names in en, proper Persian in fa).
 */

import { CURRENCIES } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';

const INTERNATIONAL: readonly CurrencyCode[] = CURRENCIES.filter((c) => c.code !== 'IRR').map(
  (c) => c.code,
);

export interface CurrencySelectProps {
  id: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  ariaLabel: string;
}

export function CurrencySelect({ id, value, onChange, ariaLabel }: CurrencySelectProps) {
  const { t } = useI18n();
  const nameOf = (code: CurrencyCode): string => t(`currencies.${code}` as TranslationKey);

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      className="w-full cursor-pointer rounded-[15px] border-2 border-gray-200 bg-white px-3.5 py-3.5 text-sm font-semibold text-currena-dark transition-all duration-300 focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:text-white"
    >
      <optgroup label={t('common.currencyGroupIranian')}>
        <option value="IRR">{`IRR — ${nameOf('IRR')}`}</option>
      </optgroup>
      <optgroup label={t('common.currencyGroupInternational')}>
        {INTERNATIONAL.map((code) => (
          <option key={code} value={code}>{`${code} — ${nameOf(code)}`}</option>
        ))}
      </optgroup>
    </select>
  );
}
