/**
 * WorldMarkets — the "World stock markets" section
 * (insights-world-markets-spec.md §6, blocks 6.2–6.9, as amended by owner
 * round 44 / spec v1.2).
 *
 * Since the WS-4 module split this file is the SHELL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim):
 *
 *   world-markets/shared.tsx      — pure helpers + the section's types
 *   world-markets/ViewSwitch.tsx  — the §6.3 lens radiogroup
 *   world-markets/MarketTile.tsx  — one market's tile + detail panel
 *   world-markets/MarketsVerdict.tsx — the focal verdict box + takeaway
 *   world-markets/MarketsTable.tsx   — the full table disclosure
 *
 * The shell keeps: the mother container, the header row, the §6.6 load
 * states (skeletons / being-prepared / collapsed-stale), the group strips
 * and the table disclosure. External surface unchanged: Insights.tsx
 * imports WorldMarkets from here; MarketsLoadState and the verdict
 * functions re-export for their existing importers.
 *
 * Where: directly after the commodity prices (PricesBoard) — both answer
 * "what is moving"; never above the verdict or alerts (§6.2).
 *
 * MOTHER CONTAINER (owner round 44, mirroring the regions' round 39): the
 * whole section — heading, verdict, tiles, panels, table — lives inside ONE
 * soft-tinted container with a hairline ring and a quiet shadow, so the
 * heading never reads stray and the white cards inside (the verdict box,
 * the tiles) sit as a LAYER on the field: depth by structure.
 *
 * Quiet by default (§6.3): only Correction/Bear markets carry an extra
 * tag; Normal tiles stay plain so problems stand out. Direction is never
 * colour alone (§6.8). States (§6.6): loading skeletons; the calm "being
 * prepared" line; a single old market keeps its last good value with an
 * "Old data · date" chip; when EVERYTHING is more than 5 days old the
 * section collapses to one line. A market holiday is never a bug.
 *
 * Data: the page-level fetch of GET /api/insights/markets (lib/markets) —
 * a stored copy only; a page request can never reach a provider.
 */

import { useCallback, useMemo, useState } from 'react';
import type { MarketEntry, MarketId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { MARKETS, MARKET_GROUP_ORDER } from '@currena/insights/markets/definitions';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, MARKETS_SECTION_ICON_URL } from '../icons/currena';
import { Skeleton } from '../ui';
import { MarketDetail, MarketTile } from './world-markets/MarketTile';
import { MarketsVerdictBox } from './world-markets/MarketsVerdict';
import { MarketsTable } from './world-markets/MarketsTable';
import { ViewSwitch } from './world-markets/ViewSwitch';
import { formatDateShort, formatRelativeShort, isOld, type MarketsLoadState, type MarketsView } from './world-markets/shared';

// Stable external surface (the pre-split importers keep working):
export type { MarketsLoadState } from './world-markets/shared';
export { marketsVerdictStep, marketsTakeaway } from './world-markets/MarketsVerdict';

export function WorldMarkets({
  state,
  copy,
  locale,
  numberLocale,
}: {
  state: MarketsLoadState;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  // The NORMAL timeframe opens the section (owner round 44): 3 months.
  const [view, setView] = useState<MarketsView>('3m');
  const [openId, setOpenId] = useState<MarketId | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

  // The as-of date: the freshest close any market carries (§6.3 header row;
  // Jalali in Farsi via the house formatter).
  const asOf = useMemo(() => {
    if (state.kind !== 'ready') return null;
    return state.snapshot.markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), state.snapshot.markets[0]?.asOf ?? '');
  }, [state]);

  const onToggleTile = useCallback((id: MarketId) => {
    setOpenId((prev) => (prev === id ? null : id)); // one panel open at a time (§6.3)
  }, []);

  const onOpenRow = useCallback((id: MarketId) => {
    setOpenId(id);
    // Row click opens the same detail panel (§6.4) — scroll the tile into view.
    requestAnimationFrame(() => {
      document.getElementById(`insights-market-tile-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  /* The mother container (owner round 44, the regions' round-39 pattern):
   * the soft family tint, a hairline ring and a quiet shadow — the heading,
   * the verdict box, the tiles, the panels and the table ALL live inside it,
   * so nothing reads stray and the white cards layer on the field. */
  const shell =
    'scroll-mt-24 flex flex-col gap-4 rounded-[var(--radius-lg)] bg-currena-soft/60 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.07)] ring-1 ring-[var(--color-border)] sm:gap-5 sm:p-6 dark:shadow-[0_14px_44px_rgba(0,0,0,0.4)]';

  /** The header row: the owner's exchange-chart artwork at the regions'
   * 96/128 scale, the title, and the as-of date on the far side. */
  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <h2 id="insights-markets-title" className="type-section m-0 flex items-center gap-4">
        <IconImg src={MARKETS_SECTION_ICON_URL} size={96} desktopSize={128} className="shrink-0" />
        <span className="min-w-0">{copy.markets.title}</span>
      </h2>
      {asOf ? (
        <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {interpolate(copy.markets.asOf, { date: formatDateShort(asOf, locale) })}
        </bdi>
      ) : null}
    </div>
  );

  if (state.kind === 'loading') {
    return (
      <section id="insights-markets" aria-labelledby="insights-markets-title" className={shell}>
        {heading}
        <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.markets.subtitle}</p>
        {/* The verdict box's skeleton keeps the layout honest while loading. */}
        <Skeleton className="h-28 rounded-[var(--radius-md)]" />
        {/* §6.6 Loading: grey skeleton tiles with the group labels in place. */}
        {MARKET_GROUP_ORDER.map((group) => (
          <div key={group}>
            <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
              {copy.markets.groups[group]} ({MARKETS.filter((m) => m.group === group).length})
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {MARKETS.filter((m) => m.group === group).map((m) => (
                <Skeleton key={m.id} className="h-14 rounded-[var(--radius-md)]" />
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (state.kind === 'empty') {
    return (
      <section id="insights-markets" aria-labelledby="insights-markets-title" className={shell}>
        {heading}
        <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.markets.subtitle}</p>
        {/* §6.6 Never populated: ONE calm line — no zeros, no empty tiles. */}
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.markets.empty}
        </p>
      </section>
    );
  }

  const snapshot = state.snapshot;

  // §6.6 Everything stale (>5 days): the section collapses to one line.
  const everythingOld =
    snapshot.markets.length > 0 && snapshot.markets.every((m) => isOld(m, todayIso));
  if (everythingOld) {
    return (
      <section id="insights-markets" aria-labelledby="insights-markets-title" className={shell}>
        {heading}
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {interpolate(copy.markets.collapsedStale, {
            date: formatRelativeShort(snapshot.generatedAt, locale),
          })}
        </p>
      </section>
    );
  }

  return (
    <section id="insights-markets" aria-labelledby="insights-markets-title" className={shell}>
      {heading}
      <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.markets.subtitle}</p>

      {/* The focal verdict box (owner round 44): the market verdict word in
       * the page's verdict anatomy, with the takeaway as its reason line. */}
      <MarketsVerdictBox snapshot={snapshot} copy={copy} numberLocale={numberLocale} />

      {/* The view switch (§6.3). Default: the NORMAL 3-month timeframe.
       * Step-1 F4: the local-currency note rides right beside it — returns
       * are in each market's own currency (Ibovespa's +17.5% is not
       * comparable with the others' USD terms). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ViewSwitch view={view} copy={copy} onChange={setView} />
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.markets.localCurrencyNote}</span>
      </div>

      {/* The strip: three labelled groups, the world waking up east to west
       * (§6.3). DOM order = trading-day order; in Farsi the RTL flow puts
       * Asia-Pacific at the right — the reading direction (§6.7). */}
      <div className="flex flex-col gap-3">
        {MARKET_GROUP_ORDER.map((group) => {
          const groupMarkets = MARKETS.filter((m) => m.group === group)
            .map((m) => snapshot.markets.find((e) => e.id === m.id))
            .filter((e): e is MarketEntry => e !== undefined);
          if (groupMarkets.length === 0) return null;
          return (
            <div key={group} aria-label={copy.markets.groups[group]}>
              <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                {copy.markets.groups[group]} ({formatNumber(groupMarkets.length, numberLocale, { maximumFractionDigits: 0 })})
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {groupMarkets.map((m) => (
                  <MarketTile
                    key={m.id}
                    entry={m}
                    view={view}
                    open={openId === m.id}
                    copy={copy}
                    locale={locale}
                    numberLocale={numberLocale}
                    todayIso={todayIso}
                    freshestIso={asOf ?? todayIso}
                    onToggle={onToggleTile}
                  />
                ))}
              </div>
              {/* The open market's detail panel renders under ITS group
               * (§6.3) — only one panel is open at a time. */}
              {groupMarkets.some((m) => m.id === openId) ? (
                <div className="mt-1.5">
                  <MarketDetail
                    entry={groupMarkets.find((m) => m.id === openId)!}
                    copy={copy}
                    locale={locale}
                    numberLocale={numberLocale}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* The "Show full table" disclosure (§6.3, closed by default). */}
      <div>
        <button
          type="button"
          aria-expanded={tableOpen}
          aria-controls="insights-markets-table"
          onClick={() => setTableOpen((v) => !v)}
          className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
        >
          {tableOpen ? copy.markets.hideTable : copy.markets.showTable}
          <span aria-hidden="true" className="ms-1">{tableOpen ? '▴' : '▾'}</span>
        </button>
        {tableOpen ? (
          <div id="insights-markets-table" className="mt-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 ring-1 ring-[var(--color-border)] sm:p-3">
            <MarketsTable snapshot={snapshot} copy={copy} locale={locale} numberLocale={numberLocale} onOpenRow={onOpenRow} />
          </div>
        ) : null}
      </div>

      {/* The source line lives in the page footer now (About this data,
       * owner round 44) — beside every other source credit on the page. */}
    </section>
  );
}

