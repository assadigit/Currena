/**
 * settle/AddExpenseModal — the add-expense modal: description, amount +
 * currency (the legacy 8), payer, the split-between checkbox list, the
 * optional receipt photo (objectURL preview; the File itself stays in
 * the shell's state for the IndexedDB write) (Phase: WS-4 module split
 * of the former Settle.tsx monolith — zero behavior change, code moved
 * verbatim; the shell owns every piece of state and the add action).
 */

import type { RefObject } from 'react';
import type { CurrencyCode } from '@currena/core';
import { Button } from '../../components/ui';
import { useCodeLabel } from '../../lib/display';
import { useI18n } from '../../lib/locale';
import type { SettleGroup } from '../../lib/settle-storage';
import { Modal } from './Modal';
import { EXPENSE_CURRENCIES, inputClass } from './shared';

export function AddExpenseModal(props: {
  openGroup: SettleGroup;
  expDesc: string;
  setExpDesc: (v: string) => void;
  expAmount: string;
  setExpAmount: (v: string) => void;
  expCurrency: CurrencyCode;
  setExpCurrency: (v: CurrencyCode) => void;
  expPaidBy: string;
  setExpPaidBy: (v: string) => void;
  expSplit: Set<string>;
  setExpSplit: (updater: (prev: Set<string>) => Set<string>) => void;
  photoUrl: string | null;
  onPhotoSelected: (file: File | null) => void;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const label = useCodeLabel();
  const {
    openGroup,
    expDesc,
    setExpDesc,
    expAmount,
    setExpAmount,
    expCurrency,
    setExpCurrency,
    expPaidBy,
    setExpPaidBy,
    expSplit,
    setExpSplit,
    photoUrl,
    onPhotoSelected,
    photoInputRef,
    onClose,
    onAdd,
  } = props;

  return (
    <Modal title={t('splitSettle.addExpense')} onClose={onClose}>
      <label htmlFor="expDesc" className="mb-1.5 block text-sm font-bold">
        {t('common.description')}
      </label>
      <input
        id="expDesc"
        type="text"
        className={`${inputClass} mb-4`}
        placeholder={t('splitSettle.descriptionPlaceholder')}
        value={expDesc}
        onChange={(e) => setExpDesc(e.target.value)}
      />

      <label htmlFor="expAmount" className="mb-1.5 block text-sm font-bold">
        {t('common.amount')}
      </label>
      <div className="mb-4 grid grid-cols-[1fr_auto] gap-2.5">
        <input
          id="expAmount"
          type="text"
          inputMode="decimal"
          dir="ltr"
          className={inputClass}
          placeholder={t('splitSettle.amountPlaceholder')}
          value={expAmount}
          onChange={(e) => setExpAmount(e.target.value)}
        />
        <select
          aria-label={t('common.currency')}
          value={expCurrency}
          onChange={(e) => setExpCurrency(e.target.value as CurrencyCode)}
          className="cursor-pointer rounded-[12px] border-2 border-gray-200 bg-white px-2.5 text-sm font-semibold text-currena-dark dark:border-white/10 dark:bg-[#222C3B]"
        >
          {EXPENSE_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {label(code)}
            </option>
          ))}
        </select>
      </div>

      <label htmlFor="expPaidBy" className="mb-1.5 block text-sm font-bold">
        {t('splitSettle.paidBy')}
      </label>
      <select
        id="expPaidBy"
        className={`${inputClass} mb-4 cursor-pointer`}
        value={expPaidBy}
        onChange={(e) => setExpPaidBy(e.target.value)}
      >
        {openGroup.members.map((member) => (
          <option key={member} value={member}>
            {member}
          </option>
        ))}
      </select>

      <p className="mb-1.5 text-sm font-bold">{t('splitSettle.splitBetween')}</p>
      <div className="mb-4 space-y-1.5">
        {openGroup.members.map((member) => (
          <label
            key={member}
            className="flex cursor-pointer items-center gap-2.5 rounded-[12px] bg-currena-soft/60 px-3 py-2.5 text-sm"
          >
            <input
              type="checkbox"
              checked={expSplit.has(member)}
              onChange={(e) =>
                setExpSplit((prev) => {
                  const next = new Set(prev);
                  if (e.target.checked) next.add(member);
                  else next.delete(member);
                  return next;
                })
              }
              className="h-5 w-5 cursor-pointer accent-[#4A90E2]"
            />
            {member}
          </label>
        ))}
      </div>

      <p className="mb-1.5 text-sm font-bold">{t('splitSettle.receiptPhotoOptional')}</p>
      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        className="mb-2 flex w-full cursor-pointer flex-col items-center gap-1 rounded-[12px] border-2 border-dashed border-gray-300 px-3 py-5 text-xs text-currena-muted transition-all duration-300 hover:border-currena-blue hover:text-currena-blue dark:border-white/15"
      >
        <span className="text-2xl" aria-hidden="true">
          📸
        </span>
        {t('splitSettle.clickToAddPhoto')}
      </button>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
      />
      {photoUrl ? (
        <div className="relative mb-4">
          <img src={photoUrl} alt={t('splitSettle.expensePhoto')} className="max-h-48 w-full rounded-[12px] object-cover" />
          <button
            type="button"
            onClick={() => {
              if (photoInputRef.current) photoInputRef.current.value = '';
              onPhotoSelected(null);
            }}
            className="absolute end-2 top-2 cursor-pointer rounded-full border-0 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
          >
            {t('splitSettle.removePhoto')}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="secondary" className="py-3" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="cta" className="py-3" onClick={onAdd}>
          {t('splitSettle.addExpense')}
        </Button>
      </div>
    </Modal>
  );
}
