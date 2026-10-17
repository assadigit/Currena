/**
 * InsightsHeader — the Insights page header: the title/subtitle/"Data as of"
 * line and the R15 Tools disclosure (search, tier filter, shortcuts, .ics /
 * CSV downloads). Moved verbatim from routes/Insights.tsx in the Phase 3-e
 * route split — the lane counts, the data-as-of line and the insights CSV /
 * .ics download handlers live here now, next to the ToolsMenu that offers
 * them; the world sections' CSV exports arrive as already-gated props.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { formatJalaliDate, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import type { Locale } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ToolsMenu } from '../../components/insights/ToolsMenu';
import { DataExportMenu } from '../../components/insights/DataExportMenu';
import type { ExportFormat } from '../../components/insights/full-export';
import type { MarketsLoadState } from '../../components/insights/WorldMarkets';
import type { FxLoadState } from '../../components/insights/WorldCurrencies';
import { statusCounts, type StatusFilter } from '../../components/insights/config';
import type { I18nApi } from '../../lib/locale';
import type { LoadState } from './InsightsStatusBlocks';

export function InsightsHeader({
  t,
  copy,
  locale,
  numberLocale,
  state,
  toolsOpen,
  setToolsOpen,
  statusFilter,
  setStatusFilter,
  query,
  setQuery,
  searchInputRef,
  toolsButtonRef,
  marketsState,
  downloadMarketsCsv,
  fxState,
  downloadFxCsv,
}: {
  t: I18nApi['t'];
  copy: InsightsCopy;
  locale: Locale;
  numberLocale: 'en-US' | 'fa-IR';
  state: LoadState;
  toolsOpen: boolean;
  setToolsOpen: (open: boolean) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  query: string;
  setQuery: (query: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  toolsButtonRef: RefObject<HTMLButtonElement | null>;
  marketsState: MarketsLoadState;
  downloadMarketsCsv: () => void;
  fxState: FxLoadState;
  downloadFxCsv: () => void;
}) {
  // R15 → round 33: BOTH dedicated sections render on the page now, so the
  // Tools counts describe everything on screen (the whole snapshot again —
  // the old lane-scoped counts belonged to the removed switcher).
  const laneCounts = useMemo(() => {
    if (state.kind !== 'ready') return { all: 0, warning: 0, unusual: 0, normal: 0, context: 0 };
    return statusCounts(state.snapshot.readings);
  }, [state]);

  // H4/R12: "Data as of {date}" — the unambiguous word-date (no seconds:
  // a daily snapshot) with the relative age beside it. Step-1 G7: the live
  // prices' own clock rides beside it when the serve-time overlay stamped
  // one ("prices updated HH:MM") — the honest "daily snapshot + hourly
  // prices" story in one line.
  const dataAsOfLine = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const iso = state.snapshot.generatedAt;
    const dateText = locale === 'fa' ? formatJalaliDate(iso, 'fa-IR') : formatDateWords(iso, 'en-US');
    const pricesIso = state.snapshot.pricesAsOf;
    // Fix spec B-08 (2026-10-14): the time carries its time ZONE — the
    // quotes are stamped in UTC (shown in the details), never a naked clock.
    // 2026-10-16 quirk pass: fa now uses the MINUTE-precision clock
    // (withClock) instead of the second-stamped withTime — the en line
    // renders hour:minute, and fa showing ۱۰:۱۳:۱۷ against en "10:13 am"
    // read as two different precisions of the same number. LiveRates and
    // the convert result popup keep the second-stamped withTime (both
    // locales show seconds there — consistency is per-surface).
    const pricesText =
      pricesIso !== undefined
        ? locale === 'fa'
          ? `${formatJalaliDate(pricesIso, 'fa-IR', { withClock: true })} (UTC)`
          : `${new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(pricesIso))} UTC`
        : null;
    return {
      date: dateText,
      prices: pricesText,
      tooltip: copy.ui.dataAsOfTooltip,
    };
  }, [state, locale, copy.ui.dataAsOfTooltip]);

  // Downloads (R15: they live in Tools now).
  const downloadCsv = useCallback(() => {
    if (state.kind !== 'ready') return;
    void import('../../components/insights/insights-csv').then(({ buildInsightsCsv, insightsCsvFilename }) => {
      const csv = buildInsightsCsv(state.snapshot, copy);
      void import('../../lib/download').then(({ downloadBlob }) => {
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), insightsCsvFilename(state.snapshot.generatedAt));
      });
    });
  }, [state, copy]);

  const downloadIcs = useCallback(() => {
    if (state.kind !== 'ready') return;
    void Promise.all([import('../../components/insights/ics'), import('../../lib/download')]).then(
      ([{ buildInsightsIcs }, { downloadBlob }]) => {
        const ics = buildInsightsIcs(state.snapshot.calendar, locale);
        downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'currena-insights-calendar.ics');
      },
    );
  }, [state, locale]);

  // The one-file "download all data" export (owner request 2026-10-16):
  // every section of the page in one MD / TXT / CSV / XLSX file. The whole
  // builder module is dynamically imported, so the Insights page chunk
  // never carries it; the export uses the same in-memory snapshots the
  // page renders (snapshot + the two world feeds when they are ready).
  const [exportOpen, setExportOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);
  const downloadAll = useCallback(
    (format: ExportFormat) => {
      if (state.kind !== 'ready') return;
      void import('../../components/insights/full-export').then(async ({ buildInsightsExportFile, insightsExportFilename }) => {
        const file = await buildInsightsExportFile(
          {
            snapshot: state.snapshot,
            copy,
            locale,
            title: t('insights.title'),
            markets: marketsState.kind === 'ready' ? marketsState.snapshot : null,
            fx: fxState.kind === 'ready' ? fxState.snapshot : null,
          },
          format,
        );
        const { downloadBlob } = await import('../../lib/download');
        downloadBlob(file.blob, insightsExportFilename(state.snapshot.generatedAt, file.ext));
      })
        .catch((err: unknown) => {
          // Never a silent nothing-downloaded again (the 2026-10-18 export
          // finding): the failure is at least loud in the console.
          console.error('insights full export failed', err);
        });
    },
    [state, copy, locale, t, marketsState, fxState],
  );

  return (
    <header className="mb-7">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          {/* Real spec §5 (2026-10-17): the page title targets 24–28px mobile
           * / 32–36px desktop, weight 700 — and the header separates from the
           * cards by ~28–36px (mb-7 = 28px; the mb-3 was 12px). */}
          <h1 className="m-0 text-2xl font-bold tracking-tight sm:text-[2rem] sm:leading-[2.4rem]">{t('insights.title')}</h1>
          <p className="mt-1 mb-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.ui.subtitle}</p>
          {dataAsOfLine ? (
            <p className="mt-1 mb-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" title={dataAsOfLine.tooltip}>
              <bdi>
                {interpolate(copy.ui.dataAsOf, { date: dataAsOfLine.date })}
                {dataAsOfLine.prices !== null ? (
                  <span className="opacity-80"> · {interpolate(copy.ui.pricesUpdated, { time: dataAsOfLine.prices })}</span>
                ) : null}
                <span aria-hidden="true"> ⓘ</span>
              </bdi>
              <span className="sr-only">, {dataAsOfLine.tooltip}</span>
            </p>
          ) : null}
        </div>
        {/* R15: ONE Tools disclosure — search, filter, shortcuts, .ics, CSV.
            Beside it, the one-file "download all data" export (2026-10-16
            owner request): one button, four formats (MD/TXT/CSV/XLSX). */}
        {state.kind === 'ready' ? (
          <div className="flex flex-wrap items-start gap-2">
            <DataExportMenu copy={copy} open={exportOpen} onOpenChange={setExportOpen} buttonRef={exportButtonRef} onPick={downloadAll} />
            <ToolsMenu
              copy={copy}
              numberLocale={numberLocale}
              open={toolsOpen}
              onOpenChange={setToolsOpen}
              counts={laneCounts}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              query={query}
              onQueryChange={setQuery}
              searchInputRef={searchInputRef}
              buttonRef={toolsButtonRef}
              onDownloadCsv={downloadCsv}
              onDownloadIcs={downloadIcs}
              onDownloadMarketsCsv={marketsState.kind === 'ready' ? downloadMarketsCsv : undefined}
              onDownloadFxCsv={fxState.kind === 'ready' ? downloadFxCsv : undefined}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
