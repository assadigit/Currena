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

const ALL_CODES: readonly CurrencyCode[] = CURRENCIES.map((c) => c.code);

export interface CurrencySelectProps {
  id: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  ariaLabel: string;
  /**
   * Restrict the picker to a subset of the 17 currencies (per-page subsets in
   * FEATURE_MAP §5 — e.g. the calculator's 13, the batch page's 11). Defaults
   * to all 17.
   */
  codes?: readonly CurrencyCode[];
}

export function CurrencySelect({ id, value, onChange, ariaLabel, codes }: CurrencySelectProps) {
  const { t } = useI18n();
  const nameOf = (code: CurrencyCode): string => t(`currencies.${code}` as TranslationKey);
  const allowed = codes ?? ALL_CODES;
  const international = allowed.filter((c) => c !== 'IRR');

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      className="w-full cursor-pointer rounded-[15px] border-2 border-gray-200 bg-white px-3.5 py-3.5 text-sm font-semibold text-currena-dark transition-all duration-300 focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10"
    >
      {allowed.includes('IRR') ? (
        <optgroup label={t('common.currencyGroupIranian')}>
          {/* Owner rule: the raw code reads "IRR (Toman)" everywhere. */}
          <option value="IRR">{t('currencies.irrLabel')}</option>
        </optgroup>
      ) : null}
      {international.length > 0 ? (
        <optgroup label={t('common.currencyGroupInternational')}>
          {international.map((code) => (
            <option key={code} value={code}>{`${code} — ${nameOf(code)}`}</option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}
