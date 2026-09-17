/**
 * Batch converter route (`#/batch`) — checklist #13.
 *
 * Port of the legacy batch-converter page: currency selection with swap, 3
 * quick templates (exact legacy amounts — @currena/core BATCH_TEMPLATES),
 * two input modes (bulk textarea / individual fields with notes), one-shot
 * conversion, summary card (items / total / converted total / rate), results
 * list, Copy All / Share / Export CSV, and Android-back closes the results.
 *
 * Rebuild deltas (mission §8 + core batch.ts):
 *   - tolerant parsing via @currena/core parseBatchLines (amount, optional
 *     inline "100 usd eur" codes, notes after '#' or '|', Persian digits);
 *   - invalid lines are FLAGGED per row instead of being silently skipped —
 *     the other lines still convert;
 *   - ONE snapshot fetch per source covers every line; all math is local.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  BATCH_TEMPLATES,
  CoreError,
  convert,
  formatNumber,
  parseAmount,
  parseBatchLines,
  toCsv,
} from '@currena/core';
import type { CurrencyCode, SnapshotSource, Source } from '@currena/core';
import { CurrencySelect } from '../components/CurrencySelect';
import { Button, Card, LoaderDots, Toast } from '../components/ui';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';
import { snapshotStore } from '../lib/snapshot-store';

/** The 11 currencies the legacy batch page offered (captured markup order). */
const BATCH_CURRENCIES: readonly CurrencyCode[] = [
  'USD', 'EUR', 'GBP', 'TRY', 'AED', 'AUD', 'CAD', 'CNY', 'JPY', 'KRW', 'IRR',
];

function sourceForPair(from: string, to: string): SnapshotSource {
  return from === 'IRR' || to === 'IRR' ? 'tgju' : 'frankfurter';
}

interface BatchRowOk {
  ok: true;
  line: string;
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  note?: string;
  result: number;
  source: Source;
}

interface BatchRowErr {
  ok: false;
  line: string;
  invalid: true;
}

type BatchRow = BatchRowOk | BatchRowErr;

interface BatchResults {
  rows: BatchRow[];
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number | null;
  totalOriginal: number;
  totalConverted: number;
}

interface NoteField {
  id: number;
  amount: string;
  note: string;
}

/** Trigger a browser download for a Blob (CSV export parity). */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BatchConverter() {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();

  const [from, setFrom] = useState<CurrencyCode>('TRY'); // legacy defaults
  const [to, setTo] = useState<CurrencyCode>('IRR');
  const [mode, setMode] = useState<'bulk' | 'notes'>('bulk');
  const [bulkText, setBulkText] = useState('');
  const [fields, setFields] = useState<NoteField[]>([{ id: 1, amount: '', note: '' }]);
  const [results, setResults] = useState<BatchResults | null>(null);
  const [converting, setConverting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Android back (legacy parity): back closes the results section first.
  useEffect(() => {
    if (!results) return;
    // Extra history entry so Back keeps us on #/batch while results close.
    window.history.pushState(null, '', window.location.href);
    const onPop = (): void => {
      setResults(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [results]);

  const swap = (): void => {
    setFrom(to);
    setTo(from);
  };

  const loadTemplate = (id: 'shopping' | 'comparison' | 'wishlist'): void => {
    setBulkText(BATCH_TEMPLATES[id].map((n) => n.toFixed(2)).join('\n'));
    setMode('bulk');
  };

  const fmtOriginal = (value: number): string =>
    formatNumber(value, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtConverted = (value: number, code: string): string =>
    formatNumber(value, numberLocale, { maximumFractionDigits: code === 'IRR' ? 0 : 2 });
  const fmtRate = (value: number, code: string): string =>
    formatNumber(value, numberLocale, { maximumFractionDigits: code === 'IRR' ? 0 : 4 });

  const convertAll = async (): Promise<void> => {
    if (converting) return;

    // Gather parse results (line errors kept, not dropped).
    const parsed =
      mode === 'bulk'
        ? parseBatchLines(bulkText, { from, to })
        : fields.map((f) => {
            const amount = parseAmount(f.amount);
            if (amount === null || amount <= 0) {
              return { ok: false as const, error: { code: 'invalid_amount' as const, message: '', line: f.amount } };
            }
            return {
              ok: true as const,
              value: { amount, from, to, ...(f.note.trim() !== '' && { note: f.note.trim() }) },
            };
          });

    const valid = parsed.filter(
      (p): p is { ok: true; value: { amount: number; from: CurrencyCode; to: CurrencyCode; note?: string } } =>
        p.ok && p.value.from !== undefined && p.value.to !== undefined,
    );
    if (valid.length === 0) {
      setToast(t('batchConverter.enterAtLeastOne'));
      return;
    }
    if (from === to) {
      setToast(t('batchConverter.selectDifferent'));
      return;
    }

    setConverting(true);
    try {
      // ONE snapshot fetch per distinct source (usually just one).
      const sources = new Set<SnapshotSource>(valid.map((v) => sourceForPair(v.value.from, v.value.to)));
      await Promise.all([...sources].map((s) => snapshotStore.ensureSnapshot(s)));
      const storeNow = snapshotStore.getState();

      const invalidRow = (line: string): BatchRowErr => ({ ok: false, line, invalid: true });
      const rows: BatchRow[] = parsed.map((p): BatchRow => {
        if (!p.ok) {
          return invalidRow(p.error.line);
        }
        const { amount, from: f, to: tt, note } = p.value;
        if (f === undefined || tt === undefined || f === tt) {
          return invalidRow(`${amount} ${f ?? ''} ${tt ?? ''}`.trim());
        }
        const snapshot = storeNow[sourceForPair(f, tt)].snapshot;
        if (!snapshot) return invalidRow(`${amount} ${f} ${tt}`);
        try {
          const conversion = convert(snapshot, f, tt, amount);
          return { ok: true, line: '', amount, from: f, to: tt, note, result: conversion.amount, source: conversion.source };
        } catch (err) {
          if (!(err instanceof CoreError)) throw err;
          return invalidRow(`${amount} ${f} ${tt}`);
        }
      });

      // Totals over rows matching the page pair (per-line overrides are
      // listed individually but do not mix into the pair totals).
      const pageRows = rows.filter((r): r is BatchRowOk => r.ok && r.from === from && r.to === to);
      const pairSnapshot = storeNow[sourceForPair(from, to)].snapshot;
      let rate: number | null = null;
      if (pairSnapshot) {
        try {
          rate = convert(pairSnapshot, from, to, 1).rate;
        } catch (err) {
          if (!(err instanceof CoreError)) throw err;
        }
      }
      setResults({
        rows,
        from,
        to,
        rate,
        totalOriginal: pageRows.reduce((sum, r) => sum + r.amount, 0),
        totalConverted: pageRows.reduce((sum, r) => sum + r.result, 0),
      });
    } finally {
      setConverting(false);
    }
  };

  const shareText = useMemo(() => {
    if (!results) return '';
    const lines: string[] = ['🛒 Batch Currency Conversion', `${label(results.from)} → ${label(results.to)}`];
    if (results.rate !== null) {
      lines.push(`Rate: 1 ${label(results.from)} = ${fmtRate(results.rate, results.to)} ${label(results.to)}`);
    }
    lines.push('', ...(results.rows
      .filter((r): r is BatchRowOk => r.ok)
      .map(
        (r, i) =>
          `${i + 1}. ${fmtOriginal(r.amount)} ${label(r.from)} = ${fmtConverted(r.result, r.to)} ${label(r.to)}` +
          (r.note ? `\n   📝 ${r.note}` : ''),
      )));
    lines.push(
      '',
      '━━━━━━━━━━━━━━━━━━━━',
      `Total: ${fmtOriginal(results.totalOriginal)} ${label(results.from)}`,
      `Converted: ${fmtConverted(results.totalConverted, results.to)} ${label(results.to)}`,
      '',
      '✨ Converted with Currena',
    );
    return lines.join('\n');
  }, [results, numberLocale]);

  const onCopyAll = async (): Promise<void> => {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast(t('batchConverter.conversionFailed'));
    }
  };

  const onShare = async (): Promise<void> => {
    if (!results) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Batch Currency Conversion', text: shareText });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setToast(t('batchConverter.copiedToast'));
    } catch {
      setToast(t('batchConverter.conversionFailed'));
    }
  };

  const onExportCsv = (): void => {
    if (!results) return;
    const rows = results.rows
      .filter((r): r is BatchRowOk => r.ok && r.from === results.from && r.to === results.to)
      .map((r) => ({ original: r.amount, converted: r.result, ...(r.note !== undefined && { note: r.note }) }));
    const csv = toCsv(rows, {
      from: results.from,
      to: results.to,
      ...(results.rate !== null && { rate: results.rate }),
    });
    downloadBlob(new Blob([csv], { type: 'text/csv' }), `currena_batch_conversion_${Date.now()}.csv`);
    setToast(t('batchConverter.downloaded'));
  };

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-5 sm:max-w-[600px] lg:max-w-[1080px] lg:px-10">
      <h1 className="mb-1 text-xl font-bold text-currena-dark lg:text-2xl">
        {t('batchConverter.title')}
      </h1>
      <p className="mb-5 text-sm text-currena-muted">{t('batchConverter.subtitle')}</p>

      {/* Mobile: stacked form → results. Desktop: two columns — inputs
          start-side, results (or a placeholder until the first conversion)
          end-side. */}
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <Card>
        {/* Currency selection + swap */}
        <p className="mb-2.5 text-sm font-bold text-currena-dark">
          {t('batchConverter.currencySelection')}
        </p>
        <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <CurrencySelect
            id="batchFrom"
            value={from}
            onChange={setFrom}
            ariaLabel={t('common.from')}
            codes={BATCH_CURRENCIES}
          />
          <button
            type="button"
            onClick={swap}
            aria-label={t('converter.swapCurrencies')}
            className="h-[46px] w-[46px] cursor-pointer rounded-full border-0 bg-currena-blue text-xl font-bold text-white transition-all duration-300 hover:rotate-180 hover:scale-110"
          >
            ⇄
          </button>
          <CurrencySelect
            id="batchTo"
            value={to}
            onChange={setTo}
            ariaLabel={t('common.to')}
            codes={BATCH_CURRENCIES}
          />
        </div>

        {/* Quick templates */}
        <p className="mb-2 text-xs font-semibold text-currena-muted">
          {t('batchConverter.quickTemplates')}
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          <Button variant="secondary" className="px-3.5 py-2.5 text-xs" onClick={() => loadTemplate('shopping')}>
            {t('batchConverter.templateShopping')}
          </Button>
          <Button variant="secondary" className="px-3.5 py-2.5 text-xs" onClick={() => loadTemplate('comparison')}>
            {t('batchConverter.templateComparison')}
          </Button>
          <Button variant="secondary" className="px-3.5 py-2.5 text-xs" onClick={() => loadTemplate('wishlist')}>
            {t('batchConverter.templateWishlist')}
          </Button>
        </div>

        {/* Input mode toggle */}
        <p className="mb-2.5 text-sm font-bold text-currena-dark">
          {t('batchConverter.enterAmounts')}
        </p>
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-[12px] bg-currena-soft p-1.5">
          {(['bulk', 'notes'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`cursor-pointer rounded-[9px] border-0 px-3 py-2.5 text-xs font-semibold transition-all duration-300 ${
                mode === m
                  ? 'bg-white text-currena-blue shadow dark:bg-[#2A3648]'
                  : 'text-currena-muted hover:text-currena-dark'
              }`}
            >
              {t(m === 'bulk' ? 'batchConverter.bulkInput' : 'batchConverter.withNotes')}
            </button>
          ))}
        </div>

        {/* Bulk textarea */}
        {mode === 'bulk' ? (
          <div className="mb-5">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={7}
              dir="ltr"
              placeholder={'Enter amounts, one per line:\n4556\n4545\n3443.50\n2199.99\n\n100 usd eur\n150.99 USD | iPhone 15 Pro'}
              aria-label={t('batchConverter.bulkInput')}
              className="w-full resize-y rounded-[15px] border-2 border-gray-200 bg-white px-4 py-3 text-sm text-currena-dark focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:bg-[#222C3B]"
            />
            <p className="mt-2 text-xs text-currena-muted">{t('batchConverter.bulkHint')}</p>
          </div>
        ) : (
          <div className="mb-5 space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-[15px] bg-currena-soft/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    value={field.amount}
                    placeholder={`${index + 1}. ${t('batchConverter.amountFieldPlaceholder')}`}
                    aria-label={`${t('common.amount')} ${index + 1}`}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((f) => (f.id === field.id ? { ...f, amount: e.target.value } : f)),
                      )
                    }
                    className="min-w-0 flex-1 rounded-[12px] border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none dark:border-white/10 dark:bg-[#222C3B]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFields((prev) => (prev.length > 1 ? prev.filter((f) => f.id !== field.id) : prev))
                    }
                    aria-label={t('common.delete')}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-full border-0 bg-currena-warning/15 text-lg font-bold text-currena-warning transition-all duration-300 hover:bg-currena-warning/25"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={field.note}
                  placeholder={t('batchConverter.noteFieldPlaceholder')}
                  aria-label={`${t('common.description')} ${index + 1}`}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, note: e.target.value } : f)),
                    )
                  }
                  className="w-full rounded-[12px] border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none dark:border-white/10 dark:bg-[#222C3B]"
                />
              </div>
            ))}
            <Button
              variant="secondary"
              className="w-full py-2.5 text-xs"
              onClick={() => setFields((prev) => [...prev, { id: Date.now(), amount: '', note: '' }])}
            >
              {t('batchConverter.addAnotherAmount')}
            </Button>
          </div>
        )}

        <Button variant="cta" className="w-full py-4" disabled={converting} onClick={() => void convertAll()}>
          {t('batchConverter.convertAllPrices')}
        </Button>
      </Card>

      {/* Results */}
      {results ? (
        <Card className="mt-5 lg:sticky lg:top-24 lg:mt-0">
          {/* Summary (legacy .summary-card) */}
          <div className="mb-5 rounded-[15px] bg-currena-blue/10 px-4 py-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-currena-muted">{t('batchConverter.totalItems')}</span>
              <span className="font-bold text-currena-dark">
                {formatNumber(results.rows.filter((r) => r.ok).length, numberLocale, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-currena-muted">{t('batchConverter.totalCost')}</span>
              <span className="font-bold text-currena-dark">
                {fmtOriginal(results.totalOriginal)} <bdi>{label(results.from)}</bdi>
              </span>
            </div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-currena-muted">{t('batchConverter.convertedTotal')}</span>
              <span className="font-bold text-currena-blue">
                {fmtConverted(results.totalConverted, results.to)} <bdi>{label(results.to)}</bdi>
              </span>
            </div>
            {results.rate !== null ? (
              <p className="text-xs text-currena-muted">
                {t('common.exchangeRate')}: 1 <bdi>{label(results.from)}</bdi> = {fmtRate(results.rate, results.to)}{' '}
                <bdi>{label(results.to)}</bdi>
              </p>
            ) : null}
          </div>

          {/* Rows (invalid lines flagged, others converted) */}
          <p className="mb-2.5 text-sm font-bold text-currena-dark">
            {t('batchConverter.convertedPrices')}
          </p>
          <div className="mb-5 space-y-2">
            {results.rows.map((row, i) =>
              row.ok ? (
                <div key={i} className="rounded-[12px] bg-currena-soft/60 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-currena-dark">
                      {fmtOriginal(row.amount)} <bdi>{label(row.from)}</bdi>
                    </span>
                    <span className="text-currena-muted" aria-hidden="true">
                      →
                    </span>
                    <span className="font-bold text-currena-blue">
                      {fmtConverted(row.result, row.to)} <bdi>{label(row.to)}</bdi>
                    </span>
                  </div>
                  {row.note ? (
                    <p className="mt-1 text-xs text-currena-muted">📝 {row.note}</p>
                  ) : null}
                </div>
              ) : (
                <div
                  key={i}
                  className="rounded-[12px] border-s-4 border-currena-warning bg-currena-warning/10 px-3.5 py-2.5 text-sm"
                >
                  <span className="font-semibold text-currena-warning">
                    {t('batchConverter.invalidLine')}
                  </span>
                  {row.line.trim() !== '' ? (
                    <span className="ms-2 text-currena-muted" dir="ltr">
                      {row.line.trim()}
                    </span>
                  ) : null}
                </div>
              ),
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" className="px-2 py-3 text-xs" onClick={() => void onCopyAll()}>
              {copied ? `✅ ${t('common.copied')}` : t('batchConverter.copyAll')}
            </Button>
            <Button variant="secondary" className="px-2 py-3 text-xs" onClick={() => void onShare()}>
              📤 {t('common.share')}
            </Button>
            <Button variant="secondary" className="px-2 py-3 text-xs" onClick={onExportCsv}>
              {t('batchConverter.exportCsv')}
            </Button>
          </div>
        </Card>
      ) : (
        // Desktop-only placeholder: keeps the two-column layout balanced
        // before the first conversion (hidden on phones — results simply
        // appear below the form there).
        <Card className="hidden border-2 border-dashed !border-currena-blue/30 py-16 text-center lg:block">
          <div className="mb-3 text-5xl opacity-30" aria-hidden="true">
            🛒
          </div>
          <h2 className="mb-2 text-base font-bold text-currena-dark">
            {t('batchConverter.convertedPrices')}
          </h2>
          <p className="mx-auto max-w-sm text-sm text-currena-muted">
            {t('batchConverter.resultsPlaceholder')}
          </p>
        </Card>
      )}
      </div>

      {/* Loading overlay (legacy .loading-overlay) */}
      {converting ? (
        <div
          role="status"
          className="fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-[10px]"
        >
          <LoaderDots label={t('batchConverter.convertingPrices')} />
        </div>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
