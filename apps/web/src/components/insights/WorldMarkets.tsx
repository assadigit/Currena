/**
 * WorldMarkets — the "World stock markets" section
 * (insights-world-markets-spec.md §6, as amended by owner round 44 /
 * round 46, then reshaped into the editorial market briefing of the
 * 2026-10-18 world-indices handoff round — 02-ui-spec §3).
 *
 * Anatomy top to bottom (the handoff's editorial hierarchy, §5):
 *   1. header + provenance: «نبض بازارهای جهان» over the descriptive
 *      label «شاخص‌های بورسی جهان», the last-close badge, the as-of date
 *      and the descriptor sentence — never "live", never one shared
 *      closing time implied (§3.1)
 *   2. the focal summary card (MarketsVerdict): verdict word + measure
 *      label + takeaway + the SELECTED-period breadth counts and the
 *      below-52-week-high line (§3.2)
 *   3. the two featured movers: «بیشترین رشد» / «بیشترین افت» (§3.4)
 *   4. the period control: Daily | Weekly | Monthly | Quarterly — the
 *      four horizons the contract carries; the annual horizon does not
 *      exist in the stored data and is NOT offered (§3.3, briefing.ts)
 *   5. the regional index explorer: three groups east→west, each row a
 *      logo + canonical name + country + selected-period return +
 *      52-week-distance tag (§3.5); desktop may switch to the
 *      equal-area performance map (§3.6)
 *   6. the full-table disclosure (§6.4 — unchanged, the textual twin of
 *      every number above)
 *
 * Since the WS-4 module split this file is the SHELL ONLY: the pure
 * helpers live in world-markets/{shared,briefing}.ts, the switch in
 * ViewSwitch.tsx, tiles + detail in MarketTile.tsx, movers in
 * MarketMovers.tsx, the heatmap in MarketsHeatmap.tsx and the verdict
 * summary in MarketsVerdict.tsx.
 *
 * MOTHER CONTAINER (owner round 44): the whole section lives inside ONE
 * soft-tinted container with a hairline ring and a quiet shadow; the
 * white cards inside sit as a LAYER on the field.
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
import { MarketMovers } from './world-markets/MarketMovers';
import { MarketsHeatmap } from './world-markets/MarketsHeatmap';
import { formatDateShort, formatRelativeShort, isOld, type MarketsLoadState, type MarketsView } from './world-markets/shared';

// Stable external surface (the pre-split importers keep working):
export type { MarketsLoadState } from './world-markets/shared';
export { marketsVerdictStep, marketsTakeaway } from './world-markets/MarketsVerdict';

/** The explorer's presentation: the readable list (default, mobile's only
 * mode) or the desktop performance map (§3.6). */
type DisplayMode = 'list' | 'heatmap';

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
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const todayIso = new Date().toISOString().slice(0, 10);

  // The as-of date: the freshest close any market carries (§6.3 header row;
  // Jalali in Farsi via the house formatter). Each market keeps its own
  // as-of in rows/panels — one shared closing time is never implied.
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
   * the summary card, the movers, the tiles, the panels and the table ALL
   * live inside it, so nothing reads stray and the white cards layer on
   * the field. */
  const shell =
    'scroll-mt-24 flex flex-col gap-4 rounded-[var(--radius-lg)] bg-currena-soft/60 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.07)] ring-1 ring-[var(--color-border)] sm:gap-5 sm:p-6 dark:shadow-[0_14px_44px_rgba(0,0,0,0.4)]';

  /** The header + provenance (§3.1): the owner's exchange-chart artwork at
   * the regions' 96/128 scale, the editorial title over the descriptive
   * label, and the last-close badge + as-of date on the far side. */
  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <h2 id="insights-markets-title" className="type-section m-0 flex items-center gap-4">
        <IconImg src={MARKETS_SECTION_ICON_URL} size={96} desktopSize={128} className="shrink-0" />
        <span className="min-w-0">
          <span className="block">{copy.markets.title}</span>
          {/* The descriptive section label — «شاخص‌های بورسی جهان»: the
           * section is about stock INDICES, and it says so under the
           * editorial title (§1 naming discipline). */}
          <span className="mt-0.5 block text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {copy.markets.sectionLabel}
          </span>
        </span>
      </h2>
      {asOf ? (
        <span className="flex flex-col items-start gap-1 lg:items-end">
          {/* §3.1's provenance badge — "latest data · end of trading day",
           * never "live" or "real time". */}
          <bdi className="inline-flex items-center rounded-full bg-currena-soft/70 px-2.5 py-0.5 text-[0.68rem] font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
            {copy.markets.lastCloseBadge}
          </bdi>
          <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {interpolate(copy.markets.asOf, { date: formatDateShort(asOf, locale) })}
          </bdi>
        </span>
      ) : null}
    </div>
  );

  const descriptor = (
    <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.markets.subtitle}</p>
  );

  if (state.kind === 'loading') {
    return (
      <section id="insights-markets" aria-labelledby="insights-markets-title" className={shell}>
        {heading}
        {descriptor}
        {/* The summary card's skeleton keeps the layout honest while loading. */}
        <Skeleton className="h-36 rounded-[var(--radius-md)]" />
        {/* The movers' skeletons (§3.4). */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <Skeleton className="h-32 rounded-[var(--radius-md)]" />
          <Skeleton className="h-32 rounded-[var(--radius-md)]" />
        </div>
        {/* §6.6 Loading: grey skeleton tiles with the group labels in place. */}
        {MARKET_GROUP_ORDER.map((group) => (
          <div key={group}>
            <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
              {copy.markets.groups[group]} ({MARKETS.filter((m) => m.group === group).length})
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {MARKETS.filter((m) => m.group === group).map((m) => (
                <Skeleton key={m.id} className="h-24 rounded-[var(--radius-md)]" />
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
        {descriptor}
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

  // The rows in trading-day order (east→west), used by the heatmap.
  const orderedMarkets = MARKET_GROUP_ORDER.flatMap((group) =>
    MARKETS.filter((m) => m.group === group)
      .map((m) => snapshot.markets.find((e) => e.id === m.id))
      .filter((e): e is MarketEntry => e !== undefined),
  );
  const openEntry = openId === null ? null : (orderedMarkets.find((m) => m.id === openId) ?? null);

  return (
    <section id="insights-markets" aria-labelledby="insights-markets-title" className={shell}>
      {heading}
      {descriptor}

      {/* 1 — the focal summary card (§3.2): verdict word + measure label +
       * takeaway + the selected-period breadth counts and the separate
       * below-52-week-high line. */}
      <MarketsVerdictBox snapshot={snapshot} copy={copy} numberLocale={numberLocale} view={view} />

      {/* 2 — the two featured movers (§3.4): true extrema of the selected
       * period, ranked from raw values, honest when the lens is missing. */}
      <MarketMovers markets={snapshot.markets} view={view} copy={copy} locale={locale} numberLocale={numberLocale} />

      {/* 3 — the period control (§3.3). Default: the NORMAL 3-month
       * timeframe. Step-1 F4: the local-currency note rides right beside
       * it — returns are in each market's own currency (Ibovespa's +17.5%
       * is not comparable with the others' USD terms). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ViewSwitch view={view} copy={copy} onChange={setView} />
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.markets.localCurrencyNote}</span>
      </div>

      {/* 4 — the desktop list / performance-map switch (§3.6). Hidden below
       * lg: mobile keeps the readable list (its only mode); when the map
       * is selected the list still renders under lg so nothing is lost on
       * resize, and the map's own detail panel opens below it. */}
      <div className="hidden lg:block">
        <DisplaySwitch mode={displayMode} copy={copy} onChange={setDisplayMode} />
      </div>

      {/* 5a — the performance map (desktop only, §3.6): equal-area tiles,
       * signed values, visible zero-centred legend. The open market's
       * detail panel rides under the map so a keyboard/tap activation is
       * never answered with an invisible panel. */}
      {displayMode === 'heatmap' ? (
        <div className="hidden flex-col gap-3 lg:flex">
          <MarketsHeatmap
            markets={orderedMarkets}
            view={view}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onOpenTile={onOpenRow}
          />
          {openEntry !== null ? (
            <MarketDetail entry={openEntry} copy={copy} locale={locale} numberLocale={numberLocale} />
          ) : null}
        </div>
      ) : null}

      {/* 5b — the regional index explorer (§3.5): three labelled groups,
       * the world waking up east to west (§6.3). DOM order = trading-day
       * order; in Farsi the RTL flow puts Asia-Pacific at the right — the
       * reading direction (§6.7). */}
      <div className={`flex flex-col gap-3 ${displayMode === 'heatmap' ? 'lg:hidden' : ''}`}>
        {MARKET_GROUP_ORDER.map((group) => {
          const groupMarkets = MARKETS.filter((m) => m.group === group)
            .map((m) => snapshot.markets.find((e) => e.id === m.id))
            .filter((e): e is MarketEntry => e !== undefined);
          if (groupMarkets.length === 0) return null;
          return (
            <div key={group} aria-label={copy.markets.groups[group]}>
              {/* Region headings create the explorer's rhythm (§3.5) —
               * semantic h3s under the section's h2, counts from the
               * loaded dataset, never a hardcoded 16. */}
              <h3 className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                {copy.markets.groups[group]} ({formatNumber(groupMarkets.length, numberLocale, { maximumFractionDigits: 0 })})
              </h3>
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

      {/* 6 — the "Show full table" disclosure (§6.3, closed by default):
       * the textual twin of every number above — the same period state,
       * the same values, exact and sortable-free (one sort: worst-first). */}
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

/* ------------------------------------------------------------------ *
 * The list / performance-map switch (§3.6) — a two-option radiogroup,
 * desktop only (hidden below lg in the shell above). Arrow keys cycle;
 * «فهرست» / «نقشهٔ عملکرد».
 * ------------------------------------------------------------------ */

const DISPLAY_MODES: readonly DisplayMode[] = ['list', 'heatmap'];

function DisplaySwitch({
  mode,
  copy,
  onChange,
}: {
  mode: DisplayMode;
  copy: InsightsCopy;
  onChange: (m: DisplayMode) => void;
}) {
  const labels: Record<DisplayMode, string> = {
    list: copy.markets.viewList,
    heatmap: copy.markets.viewHeatmap,
  };
  return (
    <div
      role="radiogroup"
      aria-label={copy.markets.displaySwitchAria}
      className="inline-flex max-w-full overflow-x-auto rounded-full bg-currena-soft/70 p-0.5 ring-1 ring-[var(--color-border)]"
    >
      {DISPLAY_MODES.map((m, i) => {
        const selected = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
              e.preventDefault();
              // Arrow keys cycle between the two radios; focus follows the
              // newly selected radio (roving tabindex).
              const nextIndex = (i + 1) % DISPLAY_MODES.length;
              onChange(DISPLAY_MODES[nextIndex]!);
              requestAnimationFrame(() => {
                const el = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement | undefined;
                el?.focus();
              });
            }}
            onClick={() => onChange(m)}
            className={`insights-focusable min-h-[36px] cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-[length:var(--type-caption)] font-semibold transition-colors ${
              selected
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {labels[m]}
          </button>
        );
      })}
    </div>
  );
}
