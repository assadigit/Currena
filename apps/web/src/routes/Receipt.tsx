/**
 * Receipt generator route (`#/receipt`) — checklist #9, the flagship tool.
 *
 * Port of the legacy receipt-generator page: item rows (category from the 7
 * legacy CATEGORIES, amount, notes, optional per-item currency + time), from/
 * to currency, receipt date (+ Jalali), multi-day date range, budget tracking
 * with progress, split-expenses preview, live total summary, the 🧾 paper
 * modal, and PDF / Image / Excel exports + share.
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
  convert,
  formatJalaliDate,
  formatNumber,
  parseAmount,
  thousandSeparateInput,
  sourceForPair,
} from '@currena/core';
import type { CurrencyCode, SnapshotSource } from '@currena/core';
import { CurrencySelect } from '../components/CurrencySelect';
import { Button, Card, LoaderDots, Switch, Toast } from '../components/ui';
import { useCodeLabel } from '../lib/display';
import { downloadBlob } from '../lib/download';
import { uniqueId } from '../lib/id';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import { snapshotStore, useSnapshotStore } from '../lib/snapshot-store';

/* ------------------------------------------------------------------ *
 * Types & constants
 * ------------------------------------------------------------------ */

const CATEGORY_IDS = ['transport', 'food', 'groceries', 'tickets', 'snacks', 'drinks', 'custom'] as const;
type CategoryId = (typeof CATEGORY_IDS)[number];

const CATEGORY_EMOJI: Record<CategoryId, string> = {
  transport: '🚕',
  food: '🍔',
  groceries: '🛒',
  tickets: '🎫',
  snacks: '🍿',
  drinks: '🥤',
  custom: '✏️',
};

interface ItemDraft {
  id: number;
  category: CategoryId;
  amount: string;
  currency: CurrencyCode;
  time: string;
  notes: string;
}

/** A generated receipt item — amounts are raw numbers, formatting at render. */
interface ReceiptItem {
  category: string;
  emoji: string;
  amount: number;
  currency: CurrencyCode;
  notes: string;
  time: string;
}

interface GeneratedReceipt {
  id: number;
  date: string;
  endDate: string | null;
  items: ReceiptItem[];
  total: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  converted: number | null;
  rate: number | null;
  timestamp: string;
}


const pad2 = (n: number): string => String(n).padStart(2, '0');

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 'YYYY-MM-DD' → local-midnight ISO (timezone-safe for date rendering). */
function dateToIso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return new Date().toISOString();
  return new Date(y, m - 1, d).toISOString();
}

/** (moved to lib/download.ts — BACKLOG #24 dedupe.) */

const inputClass =
  'w-full rounded-[12px] border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none dark:border-white/10 dark:bg-[#222C3B]';

/* ------------------------------------------------------------------ *
 * Route
 * ------------------------------------------------------------------ */

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
  const [exporting, setExporting] = useState<'pdf' | 'image' | 'excel' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const paperRef = useRef<HTMLDivElement>(null);
  const paperCloseRef = useRef<HTMLButtonElement>(null);

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

  const totals = useMemo(() => {
    const storeNow = store;
    const parsed = items
      .map((item) => ({ item, value: parseAmount(item.amount) }))
      .filter((p): p is { item: ItemDraft; value: number } => p.value !== null && p.value > 0);

    let total = 0;
    for (const { item, value } of parsed) {
      const currency = perItemCurrency ? item.currency : from;
      if (currency === from) {
        total += value;
        continue;
      }
      const snapshot = storeNow[sourceForPair(currency, from)].snapshot;
      if (!snapshot) {
        total += value; // degrade to legacy behavior (raw sum) when offline
        continue;
      }
      try {
        total += convert(snapshot, currency, from, value).amount;
      } catch {
        total += value;
      }
    }

    let converted: number | null = null;
    let rate: number | null = null;
    if (from === to) {
      converted = total;
      rate = 1;
    } else {
      const snapshot = storeNow[sourceForPair(from, to)].snapshot;
      if (snapshot) {
        try {
          converted = convert(snapshot, from, to, total).amount;
          rate = convert(snapshot, from, to, 1).rate;
        } catch {
          converted = null;
        }
      }
    }

    return { count: parsed.length, total, converted, rate };
  }, [items, perItemCurrency, from, to, store]);

  const budgetValue = parseAmount(budgetAmount);
  const remaining = budgetOn && budgetValue !== null ? budgetValue - totals.total : null;
  const perPerson = splitOn && splitPeople > 0 ? totals.total / splitPeople : null;
  const progress =
    budgetOn && budgetValue !== null && budgetValue > 0
      ? Math.min(100, (totals.total / budgetValue) * 100)
      : null;

  /* ---------------- Helpers ---------------- */

  const fmt = (value: number, code: string): string =>
    formatNumber(value, numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: code === 'IRR' ? 0 : 2,
    });

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
          ) : null}

          {/* Expense items */}
          <p className="mb-3 mt-6 text-sm font-bold text-currena-dark">
            {t('receipt.expenseItems')}
          </p>
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-[15px] bg-currena-soft/50 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <select
                    aria-label={`${t('common.description')} ${index + 1}`}
                    value={item.category}
                    onChange={(e) => patchItem(item.id, { category: e.target.value as CategoryId })}
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
                    onClick={() => removeItem(item.id)}
                    aria-label={t('common.delete')}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-0 bg-currena-warning/15 text-base font-bold text-currena-warning transition-all duration-300 hover:bg-currena-warning/25"
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
                    onChange={(e) => patchItem(item.id, { amount: thousandSeparateInput(e.target.value) })}
                    className={`${inputClass} !py-2`}
                  />
                  {perItemCurrency ? (
                    <select
                      aria-label={`${t('common.currency')} ${index + 1}`}
                      value={item.currency}
                      onChange={(e) => patchItem(item.id, { currency: e.target.value as CurrencyCode })}
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
                      onChange={(e) => patchItem(item.id, { time: e.target.value })}
                      className="w-[96px] rounded-[10px] border-2 border-gray-200 bg-white px-1.5 py-2 text-xs text-currena-dark dark:border-white/10 dark:bg-[#222C3B] dark:[color-scheme:dark]"
                    />
                  ) : null}
                </div>
                <input
                  type="text"
                  placeholder={t('receipt.notesPlaceholder')}
                  aria-label={`${t('common.description')} ${index + 1}`}
                  value={item.notes}
                  onChange={(e) => patchItem(item.id, { notes: e.target.value })}
                  className={`${inputClass} mt-2 !py-2`}
                />
              </div>
            ))}
          </div>

          <Button variant="secondary" className="mt-3 w-full border-2 border-dashed !border-currena-blue/40 py-3 text-sm" onClick={addItem}>
            + {t('receipt.addExpense')}
          </Button>
        </Card>

        {/* ---------- Right: summary + actions (sticky on desktop) ---------- */}
        <div className="mt-5 lg:mt-0 lg:sticky lg:top-24">
          <div className="rounded-[20px] cta-gradient p-5 text-white shadow-[0_12px_35px_rgba(102,126,234,0.4)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm opacity-90">{t('common.total')}</span>
              <span className="text-xl font-extrabold" dir="ltr">
                {fmt(totals.total, from)} <bdi>{label(from)}</bdi>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">{t('common.converted')}</span>
              <span className="text-lg font-bold" dir="ltr">
                {totals.converted !== null ? (
                  <>
                    {fmt(totals.converted, to)} <bdi>{label(to)}</bdi>
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>

            {budgetOn && budgetValue !== null ? (
              <div className="mt-3 border-t border-white/30 pt-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="opacity-90">{t('receipt.budget')}</span>
                  <span dir="ltr">{fmt(budgetValue, from)} <bdi>{label(from)}</bdi></span>
                </div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="opacity-90">{t('receipt.remaining')}</span>
                  <span className={`font-bold ${remaining !== null && remaining < 0 ? 'text-[#ffb4b4]' : ''}`} dir="ltr">
                    {remaining !== null ? (
                      <>
                        {fmt(remaining, from)} <bdi>{label(from)}</bdi>
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                {progress !== null ? (
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    className="h-2 overflow-hidden rounded-full bg-white/25"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-[#FF6B6B]' : 'bg-white'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {perPerson !== null ? (
              <div className="mt-3 flex items-center justify-between border-t border-white/30 pt-3 text-sm">
                <span className="opacity-90">👥 {t('receipt.perPerson')}</span>
                <span dir="ltr">{fmt(perPerson, from)} <bdi>{label(from)}</bdi></span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Button variant="cta" className="col-span-full py-3.5" onClick={generate}>
              {t('receipt.generate')}
            </Button>
            <Button variant="secondary" className="py-3" onClick={() => void onCopy()}>
              {copied ? `✅ ${t('common.copied')}` : `📋 ${t('common.copy')}`}
            </Button>
            <Button variant="secondary" className="py-3" onClick={() => void onShare()}>
              📤 {t('common.share')}
            </Button>
            <Button variant="secondary" className="col-span-full py-3 !text-currena-warning" onClick={clearAll}>
              🗑️ {t('common.clear')}
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- Receipt modal ---------- */}
      {receipt ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('receipt.expenseReceipt')}
          className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[10px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReceipt(null);
          }}
        >
          <div className="popup-slide-up max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[15px] bg-white p-5 shadow-[0_25px_70px_rgba(0,0,0,0.5)] lg:p-7 dark:bg-[#1A222E]">
            <button
              ref={paperCloseRef}
              type="button"
              onClick={() => setReceipt(null)}
              aria-label={t('common.close')}
              className="float-end mb-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-currena-warning/10 text-2xl text-currena-warning transition-all duration-300 hover:rotate-90"
            >
              ×
            </button>

            {/* Receipt paper (legacy: Courier, dashed border, always light) */}
            <div
              ref={paperRef}
              dir="ltr"
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
                onClick={() => void exportPdf()}
              >
                {exporting === 'pdf' ? t('receipt.pdfCreating') : t('receipt.downloadPdf')}
              </Button>
              <Button
                variant="secondary"
                className="py-3"
                disabled={exporting !== null}
                onClick={() => void exportImage()}
              >
                {exporting === 'image' ? t('receipt.creating') : t('receipt.downloadImage')}
              </Button>
              <Button
                variant="secondary"
                className="py-3"
                disabled={exporting !== null}
                onClick={() => void exportExcel()}
              >
                {exporting === 'excel' ? t('receipt.creating') : t('receipt.downloadExcel')}
              </Button>
              <Button variant="secondary" className="col-span-full py-3" onClick={() => void onShare()}>
                📤 {t('common.share')}
              </Button>
            </div>
          </div>
        </div>
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
