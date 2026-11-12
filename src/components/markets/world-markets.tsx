/**
 * markets/WorldMarkets — the /world-markets page section.
 *
 * The flow (spec §10):
 *   1. Header — title + the period selector (Today · Week · Month · Quarter · Year)
 *   2. Summary grid — breadth (up/down/flat) + biggest movers (gainer/decliner)
 *   3. MarketsTreemap — the TE-style heat map (the deliverable)
 *   4. Region tile grids — Americas · Asia-Pacific · Europe, each a row of
 *      MarketTile buttons + the shared IndexDetailPanel (one open at a time).
 *
 * Shared state: `expanded` (the selected symbol). Selecting a treemap tile OR
 * a grid tile toggles the same panel; the treemap entry also smooth-scrolls
 * the panel into view (spec §8).
 */

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Globe2 } from 'lucide-react';
import type { EnrichedIndex, MarketsSnapshot, PeriodDef } from './types';
import {
  PERIODS,
  REGIONS,
  periodValueOf,
  periodWordOf,
  marketBreadth,
  topMovers,
  belowHighCount,
  bandedArrow,
} from '@/lib/markets';
import { fmtPct, fmtLevel, fmtCap } from '@/lib/format';
import { MarketsTreemap } from './markets-treemap';
import { MarketTile, IndexDetailPanel } from './market-tile';

export function WorldMarkets({ snapshot, loading }: { snapshot: MarketsSnapshot | null; loading: boolean }): React.JSX.Element {
  const [period, setPeriod] = useState<PeriodDef>('today');
  const [expanded, setExpanded] = useState<string | null>(null);
  const detailRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const items = useMemo(() => snapshot?.markets ?? [], [snapshot]);
  const breadth = useMemo(() => marketBreadth(items, period), [items, period]);
  const movers = useMemo(() => topMovers(items, period), [items, period]);

  // Changing the period resets the open panel: the panel's content stays, but
  // the highlighted lens moves, so closing avoids a stale scroll anchor. Done
  // in the handler (not an effect) — the idiomatic React state-adjust pattern.
  const handlePeriodChange = useCallback((next: PeriodDef) => {
    setPeriod(next);
    setExpanded(null);
  }, []);

  // The shared toggle (spec §8): clicking a treemap tile OR a grid tile opens
  // the SAME panel (one open at a time); re-clicking closes it. The treemap
  // entry also smooth-scrolls the panel into view.
  const handleSelect = useCallback(
    (symbol: string) => {
      setExpanded((cur) => {
        const next = cur === symbol ? null : symbol;
        if (next !== null) {
          // Defer the scroll so the panel mounts before we look it up.
          setTimeout(() => {
            const el = detailRefs.current.get(next);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        }
        return next;
      });
    },
    [],
  );

  const asOfDisplay = snapshot?.asOfDisplay ?? '';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* 1. Header + period selector */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--currena-accent)]">
            <Globe2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-[0.14em]">
              Currena &middot; World Markets
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            16 world indices at a glance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
            A trading-economics-style heat map: tile size approximates market capitalization, color approximates the
            selected period&apos;s return. Select any tile for the detail.
          </p>
        </div>

        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </header>

      {loading ? (
        <SkeletonBoard />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* 2. Summary grid: breadth + biggest movers */}
          <section aria-label="Market summary" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BreadthCard breadth={breadth} period={period} belowHigh={belowHighCount(items)} asOfDisplay={asOfDisplay} />
            <MoverCard kind="gainer" entry={movers.gainer} period={period} onSelect={handleSelect} />
            <MoverCard kind="decliner" entry={movers.decliner} period={period} onSelect={handleSelect} />
          </section>

          {/* 3. The treemap (the deliverable — spec §10) */}
          <MarketsTreemap
            items={items}
            period={period}
            asOfDisplay={asOfDisplay}
            selected={expanded}
            onSelect={handleSelect}
          />

          {/* 4. Region tile grids (Americas · Asia-Pacific · Europe) */}
          <div className="flex flex-col gap-8">
            {REGIONS.map((region) => {
              const regionItems = items.filter((m) => m.region === region.id);
              if (regionItems.length === 0) return null;
              return (
                <RegionGrid
                  key={region.id}
                  label={region.label}
                  shortLabel={region.shortLabel}
                  items={regionItems}
                  period={period}
                  expanded={expanded}
                  onSelect={handleSelect}
                  detailRefs={detailRefs}
                  asOfDisplay={asOfDisplay}
                />
              );
            })}
          </div>
        </>
      )}

      <footer className="mt-auto border-t border-[var(--color-border)] pt-4 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <p className="m-0">
          Currena world-markets prototype &middot; market-cap weights and index levels are illustrative demo data &middot;
          live EODHD integration planned for v2.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The period selector (Today · Week · Month · Quarter · Year)
 * ------------------------------------------------------------------ */

function PeriodSelector({ value, onChange }: { value: PeriodDef; onChange: (p: PeriodDef) => void }): React.JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label="Performance period"
      className="markets-treemap-scroll flex w-full shrink-0 gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-surface)] p-1 ring-1 ring-[var(--color-border)] sm:w-auto"
    >
      {PERIODS.map((p) => {
        const active = p.key === value;
        return (
          <button
            key={p.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p.key)}
            className={[
              'insights-focusable whitespace-nowrap rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-[var(--color-text-primary)] text-[var(--color-surface)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]',
            ].join(' ')}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The breadth card (up / down / flat + below-high count)
 * ------------------------------------------------------------------ */

function BreadthCard({
  breadth,
  period,
  belowHigh,
  asOfDisplay,
}: {
  breadth: { up: number; down: number; flat: number; valid: number; total: number };
  period: PeriodDef;
  belowHigh: number;
  asOfDisplay: string;
}): React.JSX.Element {
  const { up, down, flat, valid, total } = breadth;
  const segments = [
    { kind: 'up' as const, count: up, tone: 'bg-[var(--color-return-up)]', label: 'Up' },
    { kind: 'down' as const, count: down, tone: 'bg-[var(--color-return-down)]', label: 'Down' },
    { kind: 'flat' as const, count: flat, tone: 'bg-[var(--color-text-tertiary)]', label: 'Flat' },
  ];
  const denom = Math.max(valid, 1);

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] sm:p-5">
      <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
        <Activity className="h-4 w-4" aria-hidden="true" />
        <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-[0.14em]">
          Market breadth
        </span>
      </div>
      <p className="mt-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {periodWordOf(period)} &middot; {valid} of {total} with a reading &middot; as of {asOfDisplay}
      </p>

      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full ring-1 ring-[var(--color-border)]">
        {segments.map((s) => (
          <div
            key={s.kind}
            className={s.tone}
            style={{ width: `${(s.count / denom) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {segments.map((s) => (
          <div key={s.kind} className="flex items-center gap-1.5">
            <span className={['h-2.5 w-2.5 rounded-full', s.tone].join(' ')} aria-hidden="true" />
            <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{s.label}</span>
            <span className="ml-auto text-sm font-bold tabular-nums text-[var(--color-text-primary)]">{s.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-[var(--color-border)] pt-3 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <span className="font-semibold text-[var(--color-return-down)]">{belowHigh}</span> of {total} indices at least
        10% below their 52-week high.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The mover card (gainer / decliner for the selected period)
 * ------------------------------------------------------------------ */

function MoverCard({
  kind,
  entry,
  period,
  onSelect,
}: {
  kind: 'gainer' | 'decliner';
  entry: EnrichedIndex | null;
  period: PeriodDef;
  onSelect: (symbol: string) => void;
}): React.JSX.Element {
  const isGain = kind === 'gainer';
  const Icon = isGain ? TrendingUp : TrendingDown;
  const tone = isGain ? 'text-[var(--color-return-up)]' : 'text-[var(--color-return-down)]';

  return (
    <button
      type="button"
      onClick={() => entry && onSelect(entry.symbol)}
      disabled={!entry}
      aria-label={`${isGain ? 'Biggest gainer' : 'Biggest decliner'} ${periodWordOf(period)}: ${entry ? entry.name : 'none'}`}
      className={[
        'insights-focusable flex flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-left ring-1 transition-colors disabled:opacity-60 sm:p-5',
        entry ? 'ring-[var(--color-border)] hover:ring-[var(--color-border-strong)]' : 'ring-[var(--color-border)]',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
        <Icon className={['h-4 w-4', tone].join(' ')} aria-hidden="true" />
        <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-[0.14em]">
          {isGain ? 'Top gainer' : 'Top decliner'}
        </span>
      </div>
      {entry ? (
        <>
          <div className="mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">{entry.name}</div>
          <div className="truncate text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{entry.country}</div>
          <div className={['mt-1 text-xl font-bold tabular-nums', tone].join(' ')}>
            {fmtPct(periodValueOf(entry, period))}
          </div>
          <div className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            Level {fmtLevel(entry.level)} &middot; cap &asymp; ${fmtCap(entry.capT)}T
          </div>
        </>
      ) : (
        <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">No reading for {periodWordOf(period)}.</div>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * One region grid: header + the tile row + the open detail panel
 * ------------------------------------------------------------------ */

function RegionGrid({
  label,
  shortLabel,
  items,
  period,
  expanded,
  onSelect,
  detailRefs,
  asOfDisplay,
}: {
  label: string;
  shortLabel: string;
  items: readonly EnrichedIndex[];
  period: PeriodDef;
  expanded: string | null;
  onSelect: (symbol: string) => void;
  detailRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  asOfDisplay: string;
}): React.JSX.Element {
  const count = items.length;
  const up = items.filter((m) => bandedArrow(periodValueOf(m, period)) === 'up').length;
  const openEntry = expanded ? items.find((m) => m.symbol === expanded) : null;

  return (
    <section aria-label={`${label} indices`} data-region-grid={shortLabel.toLowerCase()}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
          {label}
        </h2>
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {count} indices &middot; {up} up {periodWordOf(period)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry) => (
          <MarketTile
            key={entry.symbol}
            entry={entry}
            period={period}
            selected={expanded === entry.symbol}
            onSelect={onSelect}
          />
        ))}
      </div>

      {openEntry ? (
        <div
          ref={(el) => {
            detailRefs.current.set(openEntry.symbol, el);
          }}
          className="mt-3"
        >
          <IndexDetailPanel entry={openEntry} period={period} asOfDisplay={asOfDisplay} />
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Loading + empty states
 * ------------------------------------------------------------------ */

function SkeletonBoard(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-border)]/40" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-border)]/40" />
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-10 text-center ring-1 ring-[var(--color-border)]">
      <Globe2 className="h-8 w-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      <p className="m-0 text-sm font-medium text-[var(--color-text-secondary)]">No market data available right now.</p>
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        The board refreshes shortly.
      </p>
    </div>
  );
}
