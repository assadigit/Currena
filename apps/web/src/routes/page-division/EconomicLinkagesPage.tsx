/**
 * EconomicLinkagesPage — `/economic-linkages`, the dedicated page for the
 * macroeconomic connection cards (پیوندهای اقتصادی).
 *
 * Shows ALL the analytical connections between indicators — the "Together"
 * component that was on /insights (and briefly on /australia). Each
 * connection card shows how indicators move together: real yields → gold,
 * dollar → gold → oil, oil → breakevens → yields, copper → China PMI,
 * iron ore → terms of trade → AUD, China demand → iron ore, RBA rate →
 * home loan → household debt, oil → geopolitical chokepoints, energy
 * exports → terms of trade → AUD, supply pressure → inflation.
 *
 * Data: the full insights snapshot (the connections reference indicators
 * across every page — USA rates, gold, oil, China, Australia, currencies).
 * Boot from the last-good cache, refresh async (M-17 discipline).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { InsightsSnapshot } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { fetchInsightsSnapshot, readCachedSnapshot } from '../../lib/insights';
import { useInsightsCopy } from '../../components/insights/useInsightsCopy';
import { Together } from '../../components/insights/Together';
import { homePageOfIndicator } from '@currena/insights/page-division';
import { navigate } from '../../router';
import type { IndicatorId } from '@currena/core';
import { PageBreadcrumbs } from '../../components/PageBreadcrumbs';

export function EconomicLinkagesPage(): React.JSX.Element {
  const { t, locale } = useI18n();
  const { copy, numberLocale } = useInsightsCopy();

  const [snapshot, setSnapshot] = useState<InsightsSnapshot | null>(() => {
    try {
      return readCachedSnapshot();
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchInsightsSnapshot(controller.signal)
      .then((s) => {
        if (controller.signal.aborted) return;
        setSnapshot(s);
      })
      .catch(() => {
        /* honest absence — the connection cards don't render until a
         * snapshot arrives; a failed fetch stays null */
      });
    return () => controller.abort();
  }, []);

  const onFocusCard = useCallback((id: IndicatorId) => {
    const home = homePageOfIndicator(id);
    if (home !== undefined) navigate(home);
  }, []);

  const dataAsOf = useMemo(() => {
    if (snapshot === null) return null;
    const iso = snapshot.generatedAt;
    return locale === 'fa'
      ? formatJalaliDate(iso, 'fa-IR')
      : formatDateWords(iso, 'en-US');
  }, [snapshot, locale]);

  const fromCache = snapshot !== null && snapshot.generatedAt !== undefined;

  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      <header className="mb-2.5 sm:mb-4">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          <PageBreadcrumbs pageKey="pd.economicLinkages.title" />
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">
            {t('pd.economicLinkages.title')}
          </h1>
        </div>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.economicLinkages.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf })}</bdi>
            ) : (
              <bdi className="text-[var(--color-text-tertiary)]">
                {interpolate(t('pd.global.fromCache'), { date: dataAsOf })}
              </bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The connection cards — all macroeconomic linkages in one place. */}
      {snapshot !== null ? (
        <Together
          readings={snapshot.readings}
          copy={copy}
          numberLocale={numberLocale}
          onFocusCard={onFocusCard}
          expandToken={0}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-10 text-center ring-1 ring-[var(--color-border)]">
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
            {t('pd.economicLinkages.loading')}
          </p>
          <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
      )}
    </div>
  );
}
