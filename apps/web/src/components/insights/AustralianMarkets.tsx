/**
 * AustralianMarkets — the "Australian market up close" section
 * (gap-closure S5-M5.4).
 *
 * Anatomy top to bottom (mirrors the world board's editorial hierarchy,
 * trimmed for the AU board's 18 symbols):
 *   1. header + provenance: the editorial title over the descriptive
 *      label, the last-close badge and the as-of date (§3.1)
 *   2. the one-line "leading or lagging" summary (generated from the
 *      per-group chg1d extrema — measurements only, no news causes)
 *   3. the ASX 200 anchor label (links to the world board — G-3, no second
 *      fetch)
 *   4. the four groups: broad → sectors → banks → volatility, each a table
 *      of Index | Today | 1 week | 1 month | 1 year | From 52-week high |
 *      Last close, with the 52-week-distance tag and the stale/old chip
 *   5. the local-currency note (all returns in AUD)
 *
 * The section lives INSIDE the Australia region's mother container (the
 * `australiaMarketsSlot` in SectionLane), so it carries NO own container
 * shell — the region's soft tint + ring already wraps it. Self-contained
 * feed: own loading/empty states, never an error surface for the page.
 *
 * Page-division S16 (2026-11-10): the copy prop is NARROWED to the
 * section's own `marketsAu` contract (the TicSection discipline — the
 * /australia page feeds the SAME drawing through the lean pd.australia
 * adapter, one drawing one vocabulary D-48, without loading the whole
 * insights corpus), and the ASX 200 anchor gains an optional route target
 * — on /australia it links to the ASX 200's home board (/world-markets,
 * the S10 UsaTicSection pattern) instead of the /insights in-page scroll.
 *
 * Data: the page-level fetch of GET /api/insights/markets-au (lib/markets-au)
 * — a stored copy only; a page request can never reach a provider.
 */

import { useMemo } from 'react';
import type { AuMarketEntry, AuMarketGroupId, AuMarketId } from '@currena/core';
import { AU_MARKETS, AU_MARKET_GROUP_ORDER, auMarketDefinition } from '@currena/insights/markets-au/definitions';
import { interpolate } from '../../i18n';
import { navigate } from '../../router';
import { auGroupBreadth, auLeadingGroup, auLaggingGroup } from './au-markets/briefing';
import type { AuMarketsLoadState } from './au-markets/shared';
import {
  auFmtClose,
  auFromHighLabel,
  auIsOld,
  auReturnToneClass,
  auSignedPct,
  auTradingDaysBehind,
  auViewValue,
} from './au-markets/shared';
import type { AuMarketsView } from './au-markets/shared';
import { formatDateShort } from './world-markets/shared';

export type { AuMarketsLoadState } from './au-markets/shared';

/** The drawing's own copy contract (page-division S16 — the TicSectionCopy
 *  discipline): the REUSED drawing declares exactly the words it consumes,
 *  so the lean pd.australia adapter on /australia never loads the corpus
 *  (the legacy /insights call site passes the corpus's own marketsAu block
 *  — structurally a superset of this contract). The `latin` row labels
 *  come from the definitions (auMarketDefinition), never from copy. */
export interface AuMarketsBoardCopy {
  title: string;
  sectionLabel: string;
  subtitle: string;
  lastCloseBadge: string;
  asOf: string;
  groups: Record<AuMarketGroupId, string>;
  asx200Anchor: string;
  asx200AnchorHint: string;
  summaryLeading: string;
  summaryLagging: string;
  summaryMixed: string;
  summaryCalm: string;
  summaryNoReading: string;
  thIndex: string;
  thToday: string;
  thWeek: string;
  thMonth: string;
  thYear: string;
  thFromHigh: string;
  thClose: string;
  delayedTag: string;
  oldData: string;
  localCurrencyNote: string;
  empty: string;
  entries: Record<AuMarketId, { name: string }>;
}

/** Today's UTC date as YYYY-MM-DD — the freshness clock. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AustralianMarkets({
  state,
  copy,
  locale,
  numberLocale,
  asx200AnchorTo,
}: {
  state: AuMarketsLoadState;
  copy: AuMarketsBoardCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  /** The ASX 200 anchor's route target (page-division S16): when set
   *  (the /australia page passes '/world-markets'), the anchor is a REAL
   *  link to the ASX 200's home board; the default (undefined) keeps the
   *  /insights in-page scroll to the world board section. */
  asx200AnchorTo?: string;
}) {
  const auCopy = copy;
  const today = todayIso();

  // The as-of date: the freshest close any AU market carries.
  const asOf = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const markets = state.snapshot.markets;
    return markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), markets[0]?.asOf ?? '');
  }, [state]);

  const freshest = useMemo(() => {
    if (state.kind !== 'ready') return '';
    const markets = state.snapshot.markets;
    return markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), markets[0]?.asOf ?? '');
  }, [state]);

  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <h3 id="insights-markets-au-title" className="type-section m-0">
        <span className="block">{auCopy.title}</span>
        <span className="mt-0.5 block text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {auCopy.sectionLabel}
        </span>
      </h3>
      {asOf ? (
        <span className="flex flex-col items-start gap-1 lg:items-end">
          <bdi className="inline-flex items-center rounded-full bg-currena-soft/70 px-2.5 py-0.5 text-[0.68rem] font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
            {auCopy.lastCloseBadge}
          </bdi>
          <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {interpolate(auCopy.asOf, { date: formatDateShort(asOf, locale) })}
          </bdi>
        </span>
      ) : null}
    </div>
  );

  const descriptor = (
    <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{auCopy.subtitle}</p>
  );

  if (state.kind === 'loading') {
    return (
      <section id="insights-markets-au" aria-labelledby="insights-markets-au-title" className="scroll-mt-24 flex flex-col gap-3">
        {heading}
        {descriptor}
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {auCopy.summaryNoReading}
        </p>
      </section>
    );
  }

  if (state.kind === 'empty') {
    return (
      <section id="insights-markets-au" aria-labelledby="insights-markets-au-title" className="scroll-mt-24 flex flex-col gap-3">
        {heading}
        {descriptor}
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {auCopy.empty}
        </p>
      </section>
    );
  }

  const snapshot = state.snapshot;
  const entryById = new Map<string, AuMarketEntry>(snapshot.markets.map((m) => [m.id as string, m]));

  // The one-line "leading or lagging" summary (the 'today' view's chg1d extrema).
  const summary = buildSummary(snapshot.markets, auCopy, locale, numberLocale);

  return (
    <section
      id="insights-markets-au"
      aria-labelledby="insights-markets-au-title"
      className="scroll-mt-24 flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]/40 p-3 ring-1 ring-[var(--color-border)] sm:p-4"
    >
      {heading}
      {descriptor}

      {/* The one-line leading/lagging summary — generated from the numbers. */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {summary}
      </p>

      {/* The ASX 200 anchor label — links to the world board (no second fetch, G-3).
          Page-division S16: with a route target the anchor navigates there
          (the /australia page → /world-markets); without one it keeps the
          /insights in-page scroll. */}
      <p className="m-0 flex flex-wrap items-baseline gap-x-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {asx200AnchorTo !== undefined ? (
          <a
            href={asx200AnchorTo}
            className="font-semibold text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate(asx200AnchorTo);
            }}
          >
            {auCopy.asx200Anchor}
          </a>
        ) : (
          <a
            href="#insights-markets"
            className="font-semibold text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('insights-markets')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }}
          >
            {auCopy.asx200Anchor}
          </a>
        )}
        <span>{auCopy.asx200AnchorHint}</span>
      </p>

      {/* The four groups: broad → sectors → banks → volatility. */}
      {AU_MARKET_GROUP_ORDER.map((group) => {
        const rows = AU_MARKETS.filter((m) => m.group === group);
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
              {auCopy.groups[group]} ({rows.length})
            </p>
            <AuMarketsTable
              ids={rows.map((m) => m.id)}
              entryById={entryById}
              copy={auCopy}
              locale={locale}
              todayIso={today}
              freshestIso={freshest}
            />
          </div>
        );
      })}

      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{auCopy.localCurrencyNote}</p>
    </section>
  );
}

/** The per-group table — desktop real table, mobile stacked rows. */
function AuMarketsTable({
  ids,
  entryById,
  copy,
  locale,
  todayIso,
  freshestIso,
}: {
  ids: readonly AuMarketId[];
  entryById: Map<string, AuMarketEntry>;
  copy: AuMarketsBoardCopy;
  locale: 'en' | 'fa';
  todayIso: string;
  freshestIso: string;
}) {
  const views: AuMarketsView[] = ['today', '1w', '1m', '1y'];
  const viewHeaders: Record<AuMarketsView, string> = {
    today: copy.thToday,
    '1w': copy.thWeek,
    '1m': copy.thMonth,
    '1y': copy.thYear,
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-[length:var(--type-caption)]">
        <thead>
          <tr className="text-left text-[var(--color-text-tertiary)]">
            <th scope="col" className="border-b border-[var(--color-border)] py-1.5 pr-3 font-bold">
              {copy.thIndex}
            </th>
            {views.map((v) => (
              <th key={v} scope="col" className="border-b border-[var(--color-border)] px-2 py-1.5 text-right font-bold">
                {viewHeaders[v]}
              </th>
            ))}
            <th scope="col" className="border-b border-[var(--color-border)] px-2 py-1.5 text-right font-bold">
              {copy.thFromHigh}
            </th>
            <th scope="col" className="border-b border-[var(--color-border)] px-2 py-1.5 text-right font-bold">
              {copy.thClose}
            </th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const entry = entryById.get(id);
            const def = auMarketDefinition(id);
            const rowCopy = copy.entries[id];
            return (
              <tr key={id} className="even:bg-currena-soft/30">
                <th scope="row" className="py-1.5 pr-3 text-left font-semibold text-[var(--color-text-primary)]">
                  <span className="block">{rowCopy.name}</span>
                  <span className="block text-[0.62rem] text-[var(--color-text-tertiary)]">{def.latin}</span>
                </th>
                {views.map((v) => {
                  const val = entry ? auViewValue(entry, v) : null;
                  return (
                    <td key={v} className={`px-2 py-1.5 text-right tabular-nums ${auReturnToneClass(val)}`}>
                      {auSignedPct(val, locale)}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-right text-[var(--color-text-secondary)]">
                  {entry ? auFromHighLabel(entry, locale) : '—'}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-[var(--color-text-primary)]">
                  {entry ? auFmtClose(entry.close, locale) : '—'}
                  {entry && auIsOld(entry.asOf, todayIso) ? (
                    <span className="ml-1 text-[0.62rem] text-[var(--color-text-tertiary)]">
                      {interpolate(copy.oldData, { date: formatDateShort(entry.asOf, locale) })}
                    </span>
                  ) : null}
                  {entry && auTradingDaysBehind(entry.asOf, freshestIso) > 1 ? (
                    <span className="ml-1 text-[0.62rem] text-[var(--color-text-tertiary)]">{copy.delayedTag}</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Build the one-line "leading or lagging" summary from the per-group chg1d extrema. */
function buildSummary(
  markets: readonly AuMarketEntry[],
  copy: AuMarketsBoardCopy,
  locale: 'en' | 'fa',
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const breadths = auGroupBreadth(markets, 'today');
  const leader = auLeadingGroup(breadths);
  const laggard = auLaggingGroup(breadths);

  // No readings at all → the calm "being prepared" line.
  if (leader === null || laggard === null) {
    return copy.summaryNoReading;
  }

  const fmtPct = (n: number | null): string => {
    if (n === null) return '—';
    const nf = new Intl.NumberFormat(numberLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const sign = n > 0 ? '+' : '';
    return `${sign}${nf.format(n)}%`;
  };

  const leaderLabel = copy.groups[leader.group];
  const laggardLabel = copy.groups[laggard.group];

  // Calm: every group's best is within ±1% (the trend band).
  const allCalm = breadths.every(
    (b) => b.valid === 0 || (Math.abs(b.best ?? 0) < 1 && Math.abs(b.worst ?? 0) < 1),
  );
  if (allCalm) return copy.summaryCalm;

  // Only a leader, no real laggard (laggard's worst within ±1% while leader is up).
  const laggardIsDown = (laggard.worst ?? 0) <= -1;
  const leaderIsUp = (leader.best ?? 0) >= 1;

  if (leaderIsUp && laggardIsDown && leader.group !== laggard.group) {
    return interpolate(copy.summaryMixed, {
      leader: leaderLabel,
      val: fmtPct(leader.best),
      laggard: laggardLabel,
      val2: fmtPct(laggard.worst),
    });
  }
  if (leaderIsUp) {
    return interpolate(copy.summaryLeading, {
      leader: leaderLabel,
      val: fmtPct(leader.best),
    });
  }
  if (laggardIsDown) {
    return interpolate(copy.summaryLagging, {
      laggard: laggardLabel,
      val: fmtPct(laggard.worst),
    });
  }
  return copy.summaryCalm;
}
