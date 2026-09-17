/**
 * History route (`#/history`) — checklist #8 + History 2.0. Port of the
 * legacy history page: reads `conversionHistory` from localStorage (written
 * by the converter), renders each entry with Jalali + Gregorian dates + time,
 * per-entry rate and source badge, clear-all with confirm, and the empty state.
 *
 * History 2.0 additions:
 *   - Stats row: total conversions, unique pairs, most-used pair, last conversion
 *   - Search (codes + amounts) + one-tap pair filter chips
 *   - Per-entry delete (animated) and "Repeat" — re-runs the conversion at
 *     today's rate via the converter's deep-link prefill
 *     (`#/?from=…&to=…&amount=…`, also shareable)
 *   - CSV export (plain Blob — zero dependencies)
 *
 * Jalali dates render exactly like the legacy page ("25 Farvardin 1405") —
 * rebuilt with Intl's persian calendar (no dependency) plus the dictionary's
 * month-name lists (English transliterations in en, Persian month names in fa).
 */

import { useEffect, useMemo, useState } from 'react';
import type { Source } from '@currena/core';
import { formatDate, formatNumber, formatRelative } from '@currena/core';
import { Button, Card, SourceBadge, Toast } from '../components/ui';
import { getDictionary } from '../i18n';
import { downloadHistoryCsv, readHistory, removeHistoryEntry, HISTORY_KEY } from '../lib/history';
import type { HistoryEntry } from '../lib/history';
import { useI18n } from '../lib/locale';
import { navigate } from '../router';

const SOURCE_VALUES: readonly Source[] = ['tgju', 'frankfurter', 'manual', 'local'];

function asSource(value: string): Source {
  return SOURCE_VALUES.find((s) => s === value) ?? 'local';
}

/** Jalali year/month/day via Intl's persian calendar (no jalaali-js). */
function jalaliParts(iso: string): { jy: number; jm: number; jd: number } {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type)?.value ?? '0';
    return Number(part.replace(/[^0-9]/g, ''));
  };
  return { jy: get('year'), jm: get('month'), jd: get('day') };
}

const pairKey = (entry: HistoryEntry): string => `${entry.from}→${entry.to}`;

/** A history entry plus its index in the FULL storage list (delete-safe). */
interface IndexedEntry {
  entry: HistoryEntry;
  storageIndex: number;
}

export function History() {
  const { t, numberLocale, locale } = useI18n();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [filterPair, setFilterPair] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<ReadonlySet<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Load once on mount; re-read on storage events (other tabs).
  useEffect(() => {
    setEntries(readHistory());
    const onStorage = (e: StorageEvent): void => {
      if (e.key === null || e.key === HISTORY_KEY) setEntries(readHistory());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const months = getDictionary(locale).jalaliMonths;

  /* --------------------------- stats (full list) -------------------------- */

  const stats = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    const counts = new Map<string, { count: number; from: string; to: string }>();
    for (const e of entries) {
      const key = pairKey(e);
      const current = counts.get(key);
      counts.set(key, current ? { count: current.count + 1, from: e.from, to: e.to } : { count: 1, from: e.from, to: e.to });
    }
    let top: { count: number; from: string; to: string } | null = null;
    for (const value of counts.values()) {
      if (!top || value.count > top.count) top = value;
    }
    return {
      total: entries.length,
      pairs: counts.size,
      top,
      lastAt: entries[0]?.timestamp ?? null,
    };
  }, [entries]);

  /* ----------------------------- pair filters ----------------------------- */

  const pairChips = useMemo(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(pairKey(e), (counts.get(pairKey(e)) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([pair, count]) => ({ pair, count }));
  }, [entries]);

  /* ------------------------------ filtered view --------------------------- */

  const filtered = useMemo<IndexedEntry[] | null>(() => {
    if (!entries) return null;
    const needle = search.trim().toLowerCase();
    return entries
      .map((entry, storageIndex) => ({ entry, storageIndex }))
      .filter(({ entry }) => {
        if (filterPair !== 'all' && pairKey(entry) !== filterPair) return false;
        if (needle === '') return true;
        const haystack = `${entry.from} ${entry.to} ${entry.amount} ${entry.result}`.toLowerCase();
        return haystack.includes(needle);
      });
  }, [entries, filterPair, search]);

  /* ------------------------------- actions -------------------------------- */

  const repeat = (entry: HistoryEntry): void => {
    navigate(`/?from=${encodeURIComponent(entry.from)}&to=${encodeURIComponent(entry.to)}&amount=${entry.amount}`);
  };

  const removeEntry = (storageIndex: number): void => {
    setDeleting((prev) => new Set(prev).add(storageIndex));
    window.setTimeout(() => {
      setEntries(removeHistoryEntry(storageIndex));
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(storageIndex);
        return next;
      });
    }, 260);
  };

  const clearAll = (): void => {
    if (entries === null || entries.length === 0) return;
    if (window.confirm(t('history.clearConfirm'))) {
      window.localStorage.removeItem(HISTORY_KEY);
      setEntries([]);
      setFilterPair('all');
      setSearch('');
    }
  };

  const exportCsv = (): void => {
    if (!entries || entries.length === 0) return;
    downloadHistoryCsv(entries);
    setToast(t('history.exported'));
  };

  /* -------------------------------- render -------------------------------- */

  const empty = entries !== null && entries.length === 0;
  const noMatch = entries !== null && entries.length > 0 && filtered?.length === 0;

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-6 sm:max-w-[600px] lg:max-w-[1020px] lg:px-10">
      {/* Title + CSV export */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-currena-dark dark:text-white lg:text-2xl">📜 {t('history.title')}</h1>
        {entries !== null && entries.length > 0 ? (
          <Button
            variant="secondary"
            className="gap-1.5 px-4 py-2.5 text-xs"
            onClick={exportCsv}
            title={t('history.exportCsv')}
          >
            📊 {t('history.exportCsv')}
          </Button>
        ) : null}
      </div>

      {/* Stats row */}
      {stats ? (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-currena-soft p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:bg-white/5">
            <div className="mb-1 text-xl" aria-hidden="true">🔄</div>
            <div className="text-lg font-black text-currena-blue dark:text-currena-cyan">
              {formatNumber(stats.total, numberLocale)}
            </div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-currena-muted">
              {t('history.totalConversions')}
            </div>
          </div>
          <div className="rounded-2xl bg-currena-soft p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:bg-white/5">
            <div className="mb-1 text-xl" aria-hidden="true">💱</div>
            <div className="text-lg font-black text-currena-blue dark:text-currena-cyan">
              {formatNumber(stats.pairs, numberLocale)}
            </div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-currena-muted">
              {t('history.uniquePairs')}
            </div>
          </div>
          {stats.top ? (
            <div className="rounded-2xl bg-currena-soft p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:bg-white/5">
              <div className="mb-1 flex items-center justify-center gap-1" aria-hidden="true">
                <img src={`/images/flags/${stats.top.from.toLowerCase()}.png`} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                <span className="text-xs font-bold">→</span>
                <img src={`/images/flags/${stats.top.to.toLowerCase()}.png`} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
              </div>
              <div className="text-lg font-black text-currena-blue dark:text-currena-cyan" dir="ltr">
                {stats.top.from}→{stats.top.to}
              </div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-currena-muted">
                {t('history.mostUsed')} · {formatNumber(stats.top.count, numberLocale)}×
              </div>
            </div>
          ) : null}
          {stats.lastAt ? (
            <div className="rounded-2xl bg-currena-soft p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:bg-white/5">
              <div className="mb-1 text-xl" aria-hidden="true">🕐</div>
              <div className="text-sm font-black text-currena-blue dark:text-currena-cyan">
                {formatRelative(stats.lastAt, numberLocale)}
              </div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-currena-muted">
                {t('history.lastConversion')}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Search + pair filters */}
      {entries !== null && entries.length > 0 ? (
        <div className="mb-5">
          <div className="relative mb-3">
            <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-lg" aria-hidden="true">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('history.searchPlaceholder')}
              aria-label={t('history.searchPlaceholder')}
              className="w-full rounded-full border-2 border-gray-200 bg-white py-3 ps-12 pe-4 text-sm font-medium text-currena-dark transition-all duration-300 placeholder:font-normal placeholder:text-currena-muted/70 focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterPair('all')}
              aria-pressed={filterPair === 'all'}
              className={`min-h-[36px] cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                filterPair === 'all'
                  ? 'border-currena-blue bg-currena-blue/10 text-currena-blue shadow-[0_4px_12px_rgba(74,144,226,0.25)]'
                  : 'border-black/10 bg-currena-soft text-currena-dark dark:border-white/10 dark:bg-white/5 dark:text-white/85'
              }`}
            >
              {t('history.filterAll')} ({formatNumber(entries.length, numberLocale)})
            </button>
            {pairChips.map(({ pair, count }) => {
              const [from = '', to = ''] = pair.split('→');
              const active = filterPair === pair;
              return (
                <button
                  key={pair}
                  type="button"
                  onClick={() => setFilterPair(active ? 'all' : pair)}
                  aria-pressed={active}
                  className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                    active
                      ? 'border-currena-blue bg-currena-blue/10 text-currena-blue shadow-[0_4px_12px_rgba(74,144,226,0.25)]'
                      : 'border-black/10 bg-currena-soft text-currena-dark dark:border-white/10 dark:bg-white/5 dark:text-white/85'
                  }`}
                >
                  <img src={`/images/flags/${from.toLowerCase()}.png`} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                  <span dir="ltr">{pair}</span>
                  <span className="opacity-60">{formatNumber(count, numberLocale)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Entries — single column on mobile, 2-up grid on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
      {filtered?.map(({ entry, storageIndex }) => {
        const irrPair = entry.from === 'IRR' || entry.to === 'IRR';
        const decimals = irrPair ? 0 : 2;
        const rateDecimals = irrPair ? 0 : 4;
        const { jy, jm, jd } = jalaliParts(entry.timestamp);
        const monthName = months[(jm - 1 + 12) % 12] ?? '';
        // Time-of-day (render-time Intl, same locale as the core formatters).
        const time = new Intl.DateTimeFormat(numberLocale, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(entry.timestamp));
        const isDeleting = deleting.has(storageIndex);
        return (
          <Card
            key={`${entry.timestamp}-${storageIndex}`}
            className={`mb-4 p-5 transition-all duration-250 lg:mb-0 ${
              isDeleting ? 'pointer-events-none scale-95 opacity-0 blur-sm' : 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-black/5 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2 text-base font-bold text-currena-dark dark:text-white">
                <img src={`/images/flags/${entry.from.toLowerCase()}.png`} alt="" className="h-4 w-6 rounded-[3px] object-cover" />
                <span dir="ltr">{entry.from}</span>
                <span aria-hidden="true" className="opacity-40">→</span>
                <img src={`/images/flags/${entry.to.toLowerCase()}.png`} alt="" className="h-4 w-6 rounded-[3px] object-cover" />
                <span dir="ltr">{entry.to}</span>
              </div>
              <div className="text-end text-[0.7rem] leading-snug text-currena-muted">
                <div className="font-semibold text-currena-blue dark:text-currena-cyan">
                  {formatNumber(jd, numberLocale)} {monthName} {formatNumber(jy, numberLocale)}
                </div>
                <div>{formatDate(entry.timestamp, numberLocale)}</div>
                <div>{time}</div>
              </div>
            </div>
            <p className="text-sm text-currena-dark dark:text-white/85">
              {formatNumber(entry.amount, numberLocale, { maximumFractionDigits: decimals })}{' '}
              {entry.from}
            </p>
            <p className="text-lg font-bold text-currena-blue dark:text-currena-cyan">
              = {formatNumber(entry.result, numberLocale, { maximumFractionDigits: decimals })}{' '}
              {entry.to}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-currena-muted">
              {t('common.rate')}: 1 {entry.from} ={' '}
              {formatNumber(entry.rate, numberLocale, { maximumFractionDigits: rateDecimals })}{' '}
              {entry.to}
              <SourceBadge source={asSource(entry.source)} />
            </p>
            {/* Per-entry actions: repeat at today's rate / delete */}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => repeat(entry)}
                title={t('history.repeatTitle')}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-currena-blue/10 px-4 py-2 text-xs font-bold text-currena-blue transition-all duration-300 hover:-translate-y-0.5 hover:bg-currena-blue/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:text-currena-cyan dark:bg-currena-cyan/10 dark:hover:bg-currena-cyan/20"
              >
                🔁 {t('history.repeat')}
              </button>
              <button
                type="button"
                onClick={() => removeEntry(storageIndex)}
                title={t('history.deleteEntry')}
                aria-label={t('history.deleteEntry')}
                className="inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full text-base text-currena-muted transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                🗑️
              </button>
            </div>
          </Card>
        );
      })}
      </div>

      {/* No search/filter results */}
      {noMatch ? (
        <Card className="py-10 text-center">
          <div className="mb-3 text-4xl opacity-40" aria-hidden="true">🔎</div>
          <h2 className="mb-1.5 text-base font-bold text-currena-dark dark:text-white">
            {t('history.noResults')}
          </h2>
          <Button
            variant="secondary"
            className="mt-2 px-5 py-2.5 text-xs"
            onClick={() => {
              setSearch('');
              setFilterPair('all');
            }}
          >
            {t('history.clearFilters')}
          </Button>
        </Card>
      ) : null}

      {/* Empty state (legacy .empty-state) */}
      {empty ? (
        <Card className="py-12 text-center">
          <div className="mb-3 text-5xl opacity-40" aria-hidden="true">
            📋
          </div>
          <h2 className="mb-1.5 text-lg font-bold text-currena-dark dark:text-white">
            {t('history.noConversionsYet')}
          </h2>
          <p className="text-sm text-currena-muted">{t('history.emptyHint')}</p>
        </Card>
      ) : null}

      {/* Clear all (legacy confirm + removeItem) */}
      {entries !== null && entries.length > 0 ? (
        <div className="mt-2 text-center">
          <Button
            variant="secondary"
            className="border-s-4 !border-currena-warning px-6 py-3"
            onClick={clearAll}
          >
            {t('history.clearHistory')}
          </Button>
        </div>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
