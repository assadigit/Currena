/**
 * Receipt generator route (`#/receipt`) — checklist #9, the flagship tool.
 *
 * Port of the legacy receipt-generator page: item rows (category from the 7
 * legacy CATEGORIES, amount, notes, optional per-item currency + time), from/
 * to currency, receipt date (+ Jalali), multi-day date range, budget tracking
 * with progress, split-expenses preview, live total summary, the 🧾 paper
 * modal, and PDF / Image / Excel exports + share.
 *
 * Since the WS-4 module split this file is the SHELL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim):
 *
 *   receipt/shared.ts           — pure types/constants/date helpers +
 *                                 computeTotals (the LOCAL math)
 *   receipt/ExpenseItemRow.tsx  — one expense draft's editable row
 *   receipt/OptionsPanel.tsx    — the collapsible options block
 *   receipt/SummaryPanel.tsx    — the sticky summary + action row
 *   receipt/ReceiptModal.tsx    — the 🧾 paper modal + export buttons
 *
 * The shell keeps: all state, the dialog-focus wiring (useDialogFocus),
 * the snapshot ensure effect, the live totals memo (over shared's
 * computeTotals), generate, and ALL export implementations (jsPDF /
 * html2canvas / xlsx-writer stay LAZY here next to the refs they read).
 *
 * Rebuild deltas (mission §8 + budget guardrails):
 *   - jsPDF, xlsx AND html2canvas are route-level LAZY dynamic imports —
 *     none of them touch the initial bundle (legacy loaded 3 CDNs upfront);
 *   - per-item currencies are NORMALIZED into the from-currency through the
 *     snapshot before summing (legacy summed mixed currencies raw — a bug);
 *   - all conversions are local math over the snapshot store (the legacy
 *     called POST /api/convert on every keystroke).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatJalaliDate,
  formatNumber,
  parseAmount,
  sourceForPair,
} from '@currena/core';
import type { CurrencyCode, SnapshotSource } from '@currena/core';
import { CurrencySelect } from '../components/CurrencySelect';
import { Button, Card, LoaderDots, Switch, Toast } from '../components/ui';
import { useDialogFocus } from '../components/useDialogFocus';
import { useCodeLabel } from '../lib/display';
import { downloadBlob } from '../lib/download';
import { uniqueId } from '../lib/id';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';
import { ExpenseItemRow } from './receipt/ExpenseItemRow';
import { OptionsPanel } from './receipt/OptionsPanel';
import { ReceiptModal } from './receipt/ReceiptModal';
import { SummaryPanel } from './receipt/SummaryPanel';
import {
  CATEGORY_EMOJI,
  computeTotals,
  dateToIso,
  inputClass,
  todayStr,
  type CategoryId,
  type GeneratedReceipt,
  type ItemDraft,
  type ReceiptItem,
} from './receipt/shared';

export function Receipt() {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const store = useSnapshotStore();

  const [from, setFrom] = useState<CurrencyCode>('TRY'); // legacy defaults
  const [to, setTo] = useState<CurrencyCode>('IRR');
  const [date, setDate] = useState(todayStr());

  // Options (legacy collapsible switches)
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [multiDay, setMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(todayStr());
  const [perItemCurrency, setPerItemCurrency] = useState(false);
  const [withTime, setWithTime] = useState(false);
  const [budgetOn, setBudgetOn] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [splitOn, setSplitOn] = useState(false);
  const [splitPeople, setSplitPeople] = useState(2);

  const [items, setItems] = useState<ItemDraft[]>([
    { id: 1, category: 'food', amount: '', currency: 'TRY', time: '', notes: '' },
  ]);

  const [receipt, setReceipt] = useState<GeneratedReceipt | null>(null);
  /** The control that opened the receipt modal — focus returns there on close (audit D-4). */
  const receiptOpenerRef = useRef<HTMLElement | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'image' | 'excel' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const paperRef = useRef<HTMLDivElement>(null);
  const paperCloseRef = useRef<HTMLButtonElement>(null);

  // Dialog focus discipline (QA audit D-4): the receipt paper modal now
  // moves focus in on open (the close button — the audit's fix), traps Tab,
  // closes on Escape, returns focus to the generating control on close, and
  // locks body scroll while open. The `active` flag drives the
  // conditionally-rendered modal from the route level.
  const {
    containerRef: receiptDialogRef,
    onKeyDown: receiptDialogKeyDown,
  } = useDialogFocus({
    onClose: () => setReceipt(null),
    returnFocusToRef: receiptOpenerRef,
    active: receipt !== null,
    initialFocusRef: paperCloseRef,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Ensure the snapshots the current form needs (no-op when fresh).
  const neededSources = useMemo(() => {
    const sources = new Set<SnapshotSource>([sourceForPair(from, to)]);
    if (perItemCurrency) {
      for (const item of items) {
        if (item.currency !== from) sources.add(sourceForPair(item.currency, from));
      }
    }
    return [...sources];
  }, [from, to, perItemCurrency, items]);
  useEffect(() => {
    for (const source of neededSources) void snapshotStore.ensureSnapshot(source);
  }, [neededSources]);

  /* ---------------- Live totals (local math over snapshots) ---------------- */

  const totals = useMemo(
    () => computeTotals(items, perItemCurrency, from, to, store),
    [items, perItemCurrency, from, to, store],
  );

  const budgetValue = parseAmount(budgetAmount);
  const remaining = budgetOn && budgetValue !== null ? budgetValue - totals.total : null;
  const perPerson = splitOn && splitPeople > 0 ? totals.total / splitPeople : null;
  const progress =
    budgetOn && budgetValue !== null && budgetValue > 0
      ? Math.min(100, (totals.total / budgetValue) * 100)
      : null;

  /* ---------------- Helpers ---------------- */

  const categoryLabel = (id: CategoryId): string =>
    t(`receipt.categories.${id}` as TranslationKey).replace(/^\S+\s+/, ''); // strip the emoji

  const addItem = (): void => {
    setItems((prev) => [
      ...prev,
      { id: uniqueId(), category: 'food', amount: '', currency: from, time: '', notes: '' },
    ]);
  };

  const patchItem = (id: number, patch: Partial<ItemDraft>): void => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: number): void => {
    setItems((prev) => (prev.filter((item) => item.id !== id)));
  };

  const clearAll = (): void => {
    if (window.confirm(t('receipt.clearConfirm'))) {
      setItems([{ id: uniqueId(), category: 'food', amount: '', currency: from, time: '', notes: '' }]);
    }
  };

  const generate = (): void => {
    if (totals.count === 0) {
      setToast(t('receipt.addAtLeastOneExpense'));
      return;
    }
    const built: ReceiptItem[] = items
      .map((item) => {
        const value = parseAmount(item.amount);
        if (value === null || value <= 0) return null;
        // Legacy custom-category semantics: the note IS the category.
        const isCustom = item.category === 'custom';
        return {
          category: isCustom ? item.notes.trim() || categoryLabel('custom') : categoryLabel(item.category),
          emoji: CATEGORY_EMOJI[item.category],
          amount: value,
          currency: perItemCurrency ? item.currency : from,
          notes: isCustom ? '' : item.notes.trim(),
          time: withTime ? item.time : '',
        };
      })
      .filter((i): i is ReceiptItem => i !== null);

    // Capture the opener BEFORE the modal mounts (audit D-4).
    receiptOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setReceipt({
      id: uniqueId(),
      date,
      endDate: multiDay ? endDate : null,
      items: built,
      total: totals.total,
      fromCurrency: from,
      toCurrency: to,
      converted: totals.converted,
      rate: totals.rate,
      timestamp: new Date().toISOString(),
    });
  };

  /* ---------------- Export helpers (ALL lazy) ---------------- */

  const renderPaperCanvas = async (): Promise<HTMLCanvasElement> => {
    const { default: html2canvas } = await import('html2canvas');
    const paper = paperRef.current;
    if (!paper) throw new Error('receipt paper not mounted');
    if (paperCloseRef.current) paperCloseRef.current.style.display = 'none';
    try {
      return await html2canvas(paper, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
    } finally {
      if (paperCloseRef.current) paperCloseRef.current.style.display = '';
    }
  };

  // BACKLOG #27: share/copy text goes through the dictionary +
  // formatNumber(numberLocale) — fa users get Persian labels AND Persian
  // digits (raw toFixed used to leak Latin digits into shared text).
  const shareText = (r: GeneratedReceipt): string => {
    const dateLine = r.endDate
      ? `${r.date} - ${r.endDate}`
      : r.date;
    const fmtAmount = (value: number): string =>
      formatNumber(value, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtConverted = (value: number): string =>
      formatNumber(value, numberLocale, { maximumFractionDigits: r.toCurrency === 'IRR' ? 0 : 2 });
    const fmtRate = (value: number): string =>
      formatNumber(value, numberLocale, { maximumFractionDigits: r.toCurrency === 'IRR' ? 0 : 4 });
    const lines: string[] = [t('receipt.expenseReceipt'), `📅 ${dateLine}`, ''];
    for (const item of r.items) {
      lines.push(`${item.emoji} ${item.category}: ${fmtAmount(item.amount)} ${label(item.currency)}`);
      if (item.notes) lines.push(`  📝 ${item.notes}`);
    }
    lines.push('', '━━━━━━━━━━━━━━━━━━━━', `${t('receipt.shareTotalLabel')} ${fmtAmount(r.total)} ${label(r.fromCurrency)}`, '');
    if (r.converted !== null) {
      lines.push(`${t('receipt.shareConvertedLabel')} ${fmtConverted(r.converted)} ${label(r.toCurrency)}`);
    }
    if (r.rate !== null) {
      lines.push(
        `${t('receipt.shareRateLabel')} 1 ${label(r.fromCurrency)} = ${fmtRate(r.rate)} ${label(r.toCurrency)}`,
      );
    }
    lines.push('', t('common.generatedWith'), `${t('receipt.receiptId')} ${r.id}`);
    return lines.join('\n');
  };

  const exportImage = async (): Promise<void> => {
    if (!receipt) return;
    setExporting('image');
    try {
      const canvas = await renderPaperCanvas();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) downloadBlob(blob, `currena_receipt_${receipt.id}.png`);
      setToast(t('receipt.downloaded'));
    } catch (err) {
      console.warn('[receipt] image export failed:', err);
      setToast(t('receipt.exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async (): Promise<void> => {
    if (!receipt) return;
    setExporting('pdf');
    try {
      const canvas = await renderPaperCanvas();
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      // Legacy A4 fit logic (captured downloadPDF).
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const a4Width = 210;
      const a4Height = 297;
      let pdfWidth = a4Width - 20;
      let pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      if (pdfHeight > a4Height - 20) {
        pdfHeight = a4Height - 20;
        pdfWidth = (imgWidth * pdfHeight) / imgHeight;
      }
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', (a4Width - pdfWidth) / 2, 10, pdfWidth, pdfHeight);
      pdf.save(`currena_receipt_${receipt.id}.pdf`);
      setToast(t('receipt.downloaded'));
    } catch (err) {
      console.warn('[receipt] pdf export failed:', err);
      setToast(t('receipt.exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async (): Promise<void> => {
    if (!receipt) return;
    setExporting('excel');
    try {
      // Zero-dependency writer (replaces the CVE-laden npm xlsx package).
      // BACKLOG #27: headers/sheet name go through the dictionary (fa users
      // get Persian headers); cell NUMBERS stay raw numbers — a spreadsheet
      // is a data artifact, and the writer types them as numbers.
      const { buildXlsxBlob } = await import('../lib/xlsx-writer');
      const data: (string | number | null)[][] = [
        [t('receipt.excelHeading')],
        [t('common.date'), receipt.date],
        [null],
        [t('receipt.excelCategory'), t('common.amount'), t('common.currency'), t('receipt.excelNotes')],
        ...receipt.items.map((item) => [item.category, item.amount, item.currency, item.notes]),
        [null],
        [t('receipt.totalLabel'), receipt.total, receipt.fromCurrency],
        [t('common.converted'), ...(receipt.converted !== null ? [receipt.converted, receipt.toCurrency] : [])],
        ...(receipt.rate !== null ? [[t('common.rate'), receipt.rate] as (string | number)[]] : []),
      ];
      const blob = buildXlsxBlob([{ name: t('receipt.excelSheetName'), rows: data }]);
      downloadBlob(blob, `currena_receipt_${receipt.id}.xlsx`);
      setToast(t('receipt.downloaded'));
    } catch (err) {
      console.warn('[receipt] excel export failed:', err);
      setToast(t('receipt.exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  const onCopy = async (): Promise<void> => {
    if (!receipt) {
      setToast(t('receipt.generateFirst'));
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText(receipt));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast(t('receipt.exportFailed'));
    }
  };

  const onShare = async (): Promise<void> => {
    if (!receipt) {
      setToast(t('receipt.generateFirst'));
      return;
    }
    const text = shareText(receipt);
    let canvas: HTMLCanvasElement | null = null;
    try {
      canvas = await renderPaperCanvas();
    } catch (err) {
      console.warn('[receipt] screenshot failed, sharing text only:', err);
    }
    try {
      if (canvas && navigator.share) {
        const blob = await new Promise<Blob | null>((resolve) => canvas!.toBlob(resolve, 'image/png'));
        const file = blob ? new File([blob], `currena_receipt_${receipt.id}.png`, { type: 'image/png' }) : null;
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: t('receipt.shareTitle'), text, files: [file] });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: t('receipt.shareTitle'), text });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('[receipt] share failed:', err);
    }
    try {
      await navigator.clipboard.writeText(text);
      setToast(t('batchConverter.copiedToast'));
    } catch {
      setToast(t('receipt.exportFailed'));
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-5 sm:max-w-[600px] lg:max-w-[1200px] lg:px-10">
      <h1 className="mb-1 text-xl font-bold text-currena-dark lg:text-2xl">
        📄 {t('receipt.title')}
      </h1>
      <p className="mb-5 text-sm text-currena-muted">{t('receipt.subtitle')}</p>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-6">
        {/* ---------- Left: form ---------- */}
        <Card>
          {/* Travel currency hero (legacy .main-currency-display) */}
          <div className="mb-6 rounded-[18px] bg-currena-soft px-4 py-5 text-center">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-currena-muted">
              {t('receipt.travelCurrency')}
            </p>
            <img
              src={`/images/flags/${from.toLowerCase()}.png`}
              alt={from}
              className="mx-auto mb-2.5 h-[52px] w-[74px] rounded-[10px] object-cover shadow"
            />
            <p className="text-base font-bold text-currena-dark">
              {t(`currencies.${from}` as TranslationKey)}
            </p>
            <p className="text-xs font-semibold text-currena-blue">{label(from)}</p>
          </div>

          <p className="mb-3 text-sm font-bold text-currena-dark">
            {t('receipt.expenseDetails')}
          </p>

          {/* From / To / Date */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="receiptFrom" className="mb-1.5 block text-xs font-semibold text-currena-muted">
                {t('receipt.fromCurrency')}
              </label>
              <CurrencySelect id="receiptFrom" value={from} onChange={setFrom} ariaLabel={t('receipt.fromCurrency')} />
            </div>
            <div>
              <label htmlFor="receiptTo" className="mb-1.5 block text-xs font-semibold text-currena-muted">
                {t('receipt.toCurrency')}
              </label>
              <CurrencySelect id="receiptTo" value={to} onChange={setTo} ariaLabel={t('receipt.toCurrency')} />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="receiptDate" className="mb-1.5 block text-xs font-semibold text-currena-muted">
              {t('receipt.receiptDate')}
            </label>
            <input
              id="receiptDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayStr())}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-currena-blue">
              {formatJalaliDate(dateToIso(date), numberLocale)}
            </p>
          </div>

          {/* Additional options (legacy collapsible + sub-switches) */}
          <Switch
            id="receiptOptionsToggle"
            checked={optionsOpen}
            onChange={setOptionsOpen}
            label={t('receipt.additionalOptions')}
          />
          {optionsOpen ? (
            <OptionsPanel
              multiDay={multiDay}
              setMultiDay={setMultiDay}
              endDate={endDate}
              setEndDate={setEndDate}
              perItemCurrency={perItemCurrency}
              setPerItemCurrency={setPerItemCurrency}
              withTime={withTime}
              setWithTime={setWithTime}
              budgetOn={budgetOn}
              setBudgetOn={setBudgetOn}
              budgetAmount={budgetAmount}
              setBudgetAmount={setBudgetAmount}
              splitOn={splitOn}
              setSplitOn={setSplitOn}
              splitPeople={splitPeople}
              setSplitPeople={setSplitPeople}
            />
          ) : null}

          {/* Expense items */}
          <p className="mb-3 mt-6 text-sm font-bold text-currena-dark">
            {t('receipt.expenseItems')}
          </p>
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <ExpenseItemRow
                key={item.id}
                item={item}
                index={index}
                perItemCurrency={perItemCurrency}
                withTime={withTime}
                onPatch={patchItem}
                onRemove={removeItem}
              />
            ))}
          </div>

          <Button variant="secondary" className="mt-3 w-full border-2 border-dashed !border-currena-blue/40 py-3 text-sm" onClick={addItem}>
            + {t('receipt.addExpense')}
          </Button>
        </Card>

        {/* ---------- Right: summary + actions (sticky on desktop) ---------- */}
        <SummaryPanel
          from={from}
          to={to}
          totals={totals}
          budgetOn={budgetOn}
          budgetValue={budgetValue}
          remaining={remaining}
          perPerson={perPerson}
          progress={progress}
          copied={copied}
          onGenerate={generate}
          onCopy={() => void onCopy()}
          onShare={() => void onShare()}
          onClearAll={clearAll}
        />
      </div>

      {/* ---------- Receipt modal ---------- */}
      {receipt ? (
        <ReceiptModal
          receipt={receipt}
          onClose={() => setReceipt(null)}
          dialogRef={receiptDialogRef}
          onDialogKeyDown={receiptDialogKeyDown}
          paperRef={paperRef}
          paperCloseRef={paperCloseRef}
          exporting={exporting}
          onExportPdf={() => void exportPdf()}
          onExportImage={() => void exportImage()}
          onExportExcel={() => void exportExcel()}
          onShare={() => void onShare()}
        />
      ) : null}

      {/* Export overlay */}
      {exporting !== null ? (
        <div
          role="status"
          className="fade-in fixed inset-0 z-[10001] flex items-center justify-center bg-black/85 backdrop-blur-[10px]"
        >
          <LoaderDots label={exporting === 'pdf' ? t('receipt.pdfCreating') : t('receipt.creating')} />
        </div>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
