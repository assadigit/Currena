/**
 * History route (`#/history`) — checklist #8. Port of the legacy history page:
 * reads `conversionHistory` from localStorage (written by the converter),
 * renders each entry with Jalali + Gregorian dates + time, per-entry rate and
 * source badge, clear-all with confirm, and the empty state.
 *
 * Jalali dates render exactly like the legacy page ("25 Farvardin 1405" via
 * jalaali-js) — rebuilt with Intl's persian calendar (no dependency) plus the
 * dictionary's month-name lists (English transliterations in en, Persian
 * month names in fa).
 */

import { useEffect, useState } from 'react';
import type { Source } from '@currena/core';
import { formatDate, formatNumber } from '@currena/core';
import { Button, Card, SourceBadge } from '../components/ui';
import { getDictionary } from '../i18n';
import { readHistory, HISTORY_KEY } from '../lib/history';
import { useI18n } from '../lib/locale';
import type { HistoryEntry } from '../lib/history';

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

export function History() {
  const { t, locale, numberLocale } = useI18n();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  // Load once on mount; re-read on storage events (other tabs).
  useEffect(() => {
    setEntries(readHistory());
    const onStorage = (e: StorageEvent): void => {
      if (e.key === null || e.key === HISTORY_KEY) setEntries(readHistory());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const months = getDictionary(locale).jalaliMonths;

  const clearAll = (): void => {
    if (entries === null || entries.length === 0) return;
    if (window.confirm(t('history.clearConfirm'))) {
      window.localStorage.removeItem(HISTORY_KEY);
      setEntries([]);
    }
  };

  const empty = entries !== null && entries.length === 0;

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-6 lg:max-w-[600px] lg:px-10">
      <h1 className="mb-5 text-center text-xl font-bold text-currena-dark dark:text-white">
        📜 {t('history.title')}
      </h1>

      {/* Entries */}
      {entries?.map((entry, index) => {
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
        return (
          <Card key={`${entry.timestamp}-${index}`} className="mb-4 p-5">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-black/5 pb-3 dark:border-white/10">
              <div className="text-base font-bold text-currena-dark dark:text-white">
                {entry.from} <span aria-hidden="true">→</span> {entry.to}
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
          </Card>
        );
      })}

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
    </div>
  );
}
