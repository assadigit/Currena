/**
 * InsightsHeader — the Insights page header: the title/subtitle/"Data as of"
 * line and the R15 Tools disclosure (search, tier filter, shortcuts, .ics /
 * CSV downloads). Moved verbatim from routes/Insights.tsx in the Phase 3-e
 * route split — the lane counts, the data-as-of line and the insights CSV /
 * .ics download handlers live here now, next to the ToolsMenu that offers
 * them; the world sections' CSV exports arrive as already-gated props.
 */

import { useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import { formatJalaliDate, formatDateWords } from '@currena/core';
import { interpolate } from '../../i18n';
import type { Locale } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ToolsMenu } from '../../components/insights/ToolsMenu';
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
    const pricesText =
      pricesIso !== undefined
        ? locale === 'fa'
          ? formatJalaliDate(pricesIso, 'fa-IR', { withTime: true })
          : new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(pricesIso))
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

  return (
    <header className="mb-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-bold tracking-tight">{t('insights.title')}</h1>
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
        {/* R15: ONE Tools disclosure — search, filter, shortcuts, .ics, CSV. */}
        {state.kind === 'ready' ? (
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
        ) : null}
      </div>
    </header>
  );
}
