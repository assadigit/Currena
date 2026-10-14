/**
 * receipt/ReceiptModal — the 🧾 paper modal: the focus-trapped dialog
 * (useDialogFocus lives in the SHELL — it closes on setReceipt(null),
 * returns focus to the generating control and locks scroll; this module
 * receives the container ref + keydown + the paper/close refs), the
 * Courier-styled paper itself (always light, dir=ltr with the current
 * app locale's lang so localized fa strings keep their pronunciation/
 * braille rules), and the export/share action row. (Phase: WS-4 module
 * split of the former Receipt.tsx monolith — zero behavior change, code
 * moved verbatim; the export IMPLEMENTATIONS live in the shell so the
 * canvas capture and the lazy imports stay with the refs they read.)
 */

import type { RefObject } from 'react';
import { formatJalaliDate, formatNumber } from '@currena/core';
import { Button } from '../../components/ui';
import { useCodeLabel } from '../../lib/display';
import { useI18n } from '../../lib/locale';
import { dateToIso, type GeneratedReceipt } from './shared';

export function ReceiptModal(props: {
  receipt: GeneratedReceipt;
  onClose: () => void;
  /** The shell's useDialogFocus container ref + trap keydown. */
  dialogRef: RefObject<HTMLDivElement | null>;
  onDialogKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** The paper element html2canvas captures (shell's renderPaperCanvas). */
  paperRef: RefObject<HTMLDivElement | null>;
  /** The close button — the dialog's initial focus target (audit D-4),
   * hidden during canvas capture. */
  paperCloseRef: RefObject<HTMLButtonElement | null>;
  exporting: 'pdf' | 'image' | 'excel' | null;
  onExportPdf: () => void;
  onExportImage: () => void;
  onExportExcel: () => void;
  onShare: () => void;
}) {
  const { t, numberLocale, locale } = useI18n();
  const label = useCodeLabel();
  const {
    receipt,
    onClose,
    dialogRef,
    onDialogKeyDown,
    paperRef,
    paperCloseRef,
    exporting,
    onExportPdf,
    onExportImage,
    onExportExcel,
    onShare,
  } = props;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('receipt.expenseReceipt')}
      className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[10px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onDialogKeyDown}
    >
      <div className="popup-slide-up max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[15px] bg-white p-5 shadow-[0_25px_70px_rgba(0,0,0,0.5)] lg:p-7 dark:bg-[#1A222E]">
        <button
          ref={paperCloseRef}
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="float-end mb-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-currena-warning/10 text-2xl text-currena-warning transition-all duration-300 hover:rotate-90"
        >
          ×
        </button>

        {/* Receipt paper (legacy: Courier, dashed border, always light).
            dir=ltr with the CURRENT app locale's lang so localized (fa)
            strings inside keep their pronunciation/braille rules. */}
        <div
          ref={paperRef}
          dir="ltr"
          lang={locale}
          className="clear-both rounded-[4px] border-2 border-dashed border-gray-300 bg-white px-5 py-6 font-mono text-[#2C3E50]"
        >
          <div className="mb-5 border-b-2 border-black pb-4 text-center">
            <p className="mb-2 text-xl font-bold">{t('receipt.expenseReceipt')}</p>
            <p className="text-xs text-gray-600">
              {receipt.endDate ? `${receipt.date} - ${receipt.endDate}` : receipt.date}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {formatJalaliDate(dateToIso(receipt.date), 'en-US')}
              {receipt.endDate ? ` - ${formatJalaliDate(dateToIso(receipt.endDate), 'en-US')}` : ''}
            </p>
            <p className="mt-1 text-[0.7rem] text-gray-500">
              {t('receipt.generatedAt')}{' '}
              {new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              }).format(new Date(receipt.timestamp))}
            </p>
          </div>

          <div className="mb-4 space-y-1">
            {receipt.items.map((item, i) => (
              <div key={i} className="border-b border-dotted border-gray-300 py-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="shrink-0">{item.emoji}</span>
                    <span className="break-words">{item.category}</span>
                  </span>
                  <span className="shrink-0 font-bold" dir="ltr">
                    {formatNumber(item.amount, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <bdi>{label(item.currency)}</bdi>
                  </span>
                </div>
                {item.time !== '' ? (
                  <p className="mt-0.5 ps-6 text-[0.7rem] text-gray-500">🕒 {item.time}</p>
                ) : null}
                {item.notes ? (
                  <p className="mt-0.5 ps-6 text-xs text-gray-600">📝 {item.notes}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-black pt-4 text-lg font-bold">
            <span>{t('receipt.totalLabel')}</span>
            <span dir="ltr">
              {formatNumber(receipt.total, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <bdi>{label(receipt.fromCurrency)}</bdi>
            </span>
          </div>

          {receipt.converted !== null ? (
            <div className="mt-4 rounded-lg bg-gray-100 p-4 text-center">
              <p className="mb-2 text-xs text-gray-600">{t('receipt.convertedAmount')}</p>
              <p className="text-xl font-bold text-currena-blue" dir="ltr">
                {formatNumber(receipt.converted, numberLocale, { maximumFractionDigits: receipt.toCurrency === 'IRR' ? 0 : 2 })}{' '}
                <bdi>{label(receipt.toCurrency)}</bdi>
              </p>
              {receipt.rate !== null ? (
                <p className="mt-2 text-[0.7rem] text-gray-500" dir="ltr">
                  {t('common.rate')}: 1 <bdi>{label(receipt.fromCurrency)}</bdi> ={' '}
                  {formatNumber(receipt.rate, numberLocale, { maximumFractionDigits: receipt.toCurrency === 'IRR' ? 0 : 4 })}{' '}
                  <bdi>{label(receipt.toCurrency)}</bdi>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 border-t-2 border-black pt-4 text-center text-xs text-gray-600">
            <p>{t('common.generatedWith')}</p>
            <p className="mt-1 text-[0.7rem]">
              {t('receipt.receiptId')} {receipt.id}
            </p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Button
            variant="cta"
            className="col-span-full py-3.5"
            disabled={exporting !== null}
            onClick={onExportPdf}
          >
            {exporting === 'pdf' ? t('receipt.pdfCreating') : t('receipt.downloadPdf')}
          </Button>
          <Button
            variant="secondary"
            className="py-3"
            disabled={exporting !== null}
            onClick={onExportImage}
          >
            {exporting === 'image' ? t('receipt.creating') : t('receipt.downloadImage')}
          </Button>
          <Button
            variant="secondary"
            className="py-3"
            disabled={exporting !== null}
            onClick={onExportExcel}
          >
            {exporting === 'excel' ? t('receipt.creating') : t('receipt.downloadExcel')}
          </Button>
          <Button variant="secondary" className="col-span-full py-3" onClick={onShare}>
            📤 {t('common.share')}
          </Button>
        </div>
      </div>
    </div>
  );
}
