/**
 * receipt/ExpenseItemRow — one expense draft's editable row: category
 * select + remove, the amount / per-item-currency / time grid (columns
 * appear per the options switches), and the notes line (Phase: WS-4
 * module split of the former Receipt.tsx monolith — zero behavior
 * change, code moved verbatim; the shell owns the drafts state and
 * passes patch/remove callbacks).
 *
 * The row's controls are labeled BY POSITION ("Amount 2") — the legacy
 * labeling, kept deliberately: the number is the only stable reference
 * a row has while categories change underneath it.
 */

import { thousandSeparateInput } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { CATEGORY_IDS, inputClass, type CategoryId, type ItemDraft } from './shared';

export function ExpenseItemRow({
  item,
  index,
  perItemCurrency,
  withTime,
  onPatch,
  onRemove,
}: {
  item: ItemDraft;
  index: number;
  perItemCurrency: boolean;
  withTime: boolean;
  onPatch: (id: number, patch: Partial<ItemDraft>) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-[15px] bg-currena-soft/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <select
          aria-label={`${t('common.description')} ${index + 1}`}
          value={item.category}
          onChange={(e) => onPatch(item.id, { category: e.target.value as CategoryId })}
          className="min-w-0 flex-1 cursor-pointer rounded-[10px] border-2 border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-currena-dark dark:border-white/10 dark:bg-[#222C3B]"
        >
          {CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>
              {t(`receipt.categories.${id}` as const)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={t('common.delete')}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-full border-0 bg-currena-warning/15 text-base font-bold text-currena-warning transition-all duration-300 hover:bg-currena-warning/25"
        >
          ×
        </button>
      </div>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: ['1fr', perItemCurrency ? 'auto' : null, withTime ? 'auto' : null]
            .filter(Boolean)
            .join(' '),
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          placeholder={t('receipt.amountPlaceholder')}
          aria-label={`${t('common.amount')} ${index + 1}`}
          value={item.amount}
          onChange={(e) => onPatch(item.id, { amount: thousandSeparateInput(e.target.value) })}
          className={`${inputClass} !py-2`}
        />
        {perItemCurrency ? (
          <select
            aria-label={`${t('common.currency')} ${index + 1}`}
            value={item.currency}
            onChange={(e) => onPatch(item.id, { currency: e.target.value as CurrencyCode })}
            className="w-[74px] cursor-pointer rounded-[10px] border-2 border-gray-200 bg-white px-1.5 py-2 text-xs font-semibold text-currena-dark dark:border-white/10 dark:bg-[#222C3B]"
          >
            {(['USD', 'IRR', 'AUD', 'EUR', 'TRY', 'AED', 'CNY', 'GBP', 'CAD', 'NZD', 'CHF', 'JPY', 'KRW', 'MYR', 'IDR', 'PHP', 'VND'] as const).map(
              (code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ),
            )}
          </select>
        ) : null}
        {withTime ? (
          <input
            type="time"
            aria-label={`${t('common.time')} ${index + 1}`}
            value={item.time}
            onChange={(e) => onPatch(item.id, { time: e.target.value })}
            className="w-[96px] rounded-[10px] border-2 border-gray-200 bg-white px-1.5 py-2 text-xs text-currena-dark dark:border-white/10 dark:bg-[#222C3B] dark:[color-scheme:dark]"
          />
        ) : null}
      </div>
      <input
        type="text"
        placeholder={t('receipt.notesPlaceholder')}
        aria-label={`${t('common.description')} ${index + 1}`}
        value={item.notes}
        onChange={(e) => onPatch(item.id, { notes: e.target.value })}
        className={`${inputClass} mt-2 !py-2`}
      />
    </div>
  );
}
