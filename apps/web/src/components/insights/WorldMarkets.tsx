/**
 * WorldMarkets — the "World stock markets" section
 * (insights-world-markets-spec.md §6, blocks 6.2–6.9).
 *
 * Where: directly after the commodity prices (PricesBoard) — both answer
 * "what is moving"; never above the verdict or alerts (§6.2).
 *
 * Anatomy (§6.3): header row (title + as-of date) → takeaway line → the
 * Today | 1 month | From 52-week-high view switch → a strip of three
 * labelled groups (Asia-Pacific · Europe · Americas, the world waking up
 * east to west — in Farsi the DOM order renders Asia-Pacific at the right,
 * exactly the reading direction) → "Show full table" disclosure → the
 * source footer line.
 *
 * Quiet by default (§6.3): only Correction/Bear markets carry an extra
 * tag; Normal tiles stay plain so problems stand out without colour
 * tricks. Direction is never colour alone — the signed number, the arrow
 * glyph and text chips carry the meaning (§6.8); the page's warning inks
 * appear only on Correction (needs-attention tier) and Bear (unusual
 * tier), matching StatusChip's tone mapping.
 *
 * States (§6.6): loading skeletons; the calm "being prepared" line; a
 * single old market keeps its last good value with an "Old data · date"
 * chip; when EVERYTHING is more than 5 days old the section collapses to
 * one line with the last update date. A market holiday is never a bug —
 * each tile shows that market's own last-close date.
 *
 * Data: the page-level fetch of GET /api/insights/markets (lib/markets) —
 * a stored copy only; a page request can never reach a provider.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { MarketEntry, MarketId, MarketsSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { Globe } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import {
  MARKETS,
  MARKET_GROUP_ORDER,
  SHOCK_DAY_COUNT,
  SHOCK_DAY_FALL,
  STALE_DAYS,
  decodeWeeklySeries,
} from '@currena/insights/markets/definitions';
import { MarketsChart } from './MarketsChart';
import { Skeleton } from '../ui';
import { formatAsOf } from './HistoryChart';

/** The page-level feed state (owned by Insights.tsx, passed down). */
export type MarketsLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: MarketsSnapshot };

type MarketsView = 'today' | '1m' | 'high';

/* ------------------------------------------------------------------ *
 * Pure display helpers
 * ------------------------------------------------------------------ */

function signedPct(n: number, numberLocale: 'en-US' | 'fa-IR', locale: 'en' | 'fa'): string {
  const num = formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  // A value that rounds to zero shows no sign — "−0.0" reads as a bug.
  const roundsToZero = Math.round(Math.abs(n) * 10) === 0;
  const sign = roundsToZero ? '' : n > 0 ? '+' : '−';
  return `${sign}${num}${locale === 'fa' ? '٪' : '%'}`;
}

function arrowOf(n: number): '↑' | '→' | '↓' {
  if (n > 0) return '↑';
  if (n < 0) return '↓';
  return '→';
}

/** The number + direction the current view shows for one market. */
function viewValue(m: MarketEntry, view: MarketsView): { pct: number; arrow: '↑' | '→' | '↓' } {
  if (view === 'high') {
    return { pct: m.fromHigh, arrow: m.fromHigh <= -1 ? '↓' : '→' };
  }
  const pct = view === 'today' ? m.chg1d : m.chg1m;
  return { pct, arrow: arrowOf(pct) };
}

/** Client-side R6 (§6.6): the honest old-data evaluation, whatever the stored flag says. */
function isOld(m: MarketEntry, todayIso: string): boolean {
  const days = Math.round((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${m.asOf}T00:00:00Z`)) / 86_400_000);
  return m.stale || days > STALE_DAYS;
}

function fmtClose(close: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(close, numberLocale, { maximumFractionDigits: close >= 1000 ? 0 : 2 });
}

/** Correction → the needs-attention tone; Bear → the unusual tone (§8.2). */
const STATUS_TONE: Record<MarketEntry['status'], string> = {
  normal: 'bg-currena-muted/15 text-[var(--color-text-secondary)]',
  correction: 'bg-currena-warning/15 text-[var(--color-status-alert)]',
  bear: 'bg-currena-warning/10 text-[var(--color-status-watch)]',
};

const STATUS_WORD: Record<MarketEntry['status'], 'statusNormal' | 'statusCorrection' | 'statusBear'> = {
  normal: 'statusNormal',
  correction: 'statusCorrection',
  bear: 'statusBear',
};

const TREND_WORD: Record<MarketEntry['trend'], 'trendUp' | 'trendFlat' | 'trendDown'> = {
  up: 'trendUp',
  flat: 'trendFlat',
  down: 'trendDown',
};

const TREND_ARROW: Record<MarketEntry['trend'], string> = { up: '↑', flat: '→', down: '↓' };

/* ------------------------------------------------------------------ *
 * The view switch (§6.3): a real radiogroup, arrow keys work
 * ------------------------------------------------------------------ */

const VIEWS: readonly MarketsView[] = ['today', '1m', 'high'];
const VIEW_LABEL: Record<MarketsView, 'viewToday' | 'view1m' | 'viewFromHigh'> = {
  today: 'viewToday',
  '1m': 'view1m',
  high: 'viewFromHigh',
};

function ViewSwitch({
  view,
  copy,
  onChange,
}: {
  view: MarketsView;
  copy: InsightsCopy;
  onChange: (v: MarketsView) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % VIEWS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + VIEWS.length) % VIEWS.length;
    else return;
    e.preventDefault();
    const target = refs.current[next];
    target?.focus();
    target?.click();
  };
  return (
    <div
      role="radiogroup"
      aria-label={copy.markets.viewSwitchAria}
      className="inline-flex max-w-full overflow-x-auto rounded-full bg-currena-soft/70 p-0.5 ring-1 ring-[var(--color-border)]"
    >
      {VIEWS.map((v, i) => {
        const selected = view === v;
        return (
          <button
            key={v}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(v)}
            className={`insights-focusable min-h-[36px] cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-[length:var(--type-caption)] font-semibold transition-colors ${
              selected
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {copy.markets[VIEW_LABEL[v]]}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One market tile (§6.3): quiet by default, real button, aria-expanded
 * ------------------------------------------------------------------ */

function MarketTile({
  entry,
  view,
  open,
  copy,
  locale,
  numberLocale,
  todayIso,
  onToggle,
}: {
  entry: MarketEntry;
  view: MarketsView;
  open: boolean;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  todayIso: string;
  onToggle: (id: MarketId, opener: HTMLElement | null) => void;
}) {
  const marketCopy = copy.markets.entries[entry.id];
  const { pct, arrow } = viewValue(entry, view);
  const old = isOld(entry, todayIso);
  // Quiet by default: the tag rides ONLY on correction/bear tiles, and only
  // when the view doesn't already show the distance itself.
  const showTag = entry.status !== 'normal' && view !== 'high';
  const tagX = formatNumber(Math.abs(entry.fromHigh), numberLocale, { maximumFractionDigits: 0 });
  const oldDate = formatAsOf(entry.asOf, locale);

  return (
    <button
      type="button"
      id={`insights-market-tile-${entry.id}`}
      aria-expanded={open}
      onClick={(e) => onToggle(entry.id, e.currentTarget)}
      className={`insights-focusable flex min-h-[44px] w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] px-2.5 py-2 text-start ring-1 transition-colors ${
        entry.status === 'correction'
          ? 'ring-currena-warning/30 hover:bg-currena-warning/[0.06]'
          : entry.status === 'bear'
            ? 'ring-currena-warning/40 hover:bg-currena-warning/[0.06]'
            : 'ring-[var(--color-border)] hover:bg-currena-soft/60'
      } ${old ? 'opacity-80' : ''} bg-[var(--color-surface)]`}
    >
      {/* §6.3 "short name" — the full name wraps to at most two lines
       * ("Shanghai Composite"); never truncated into guesswork. */}
      <span className="w-full text-[length:var(--type-caption)] font-bold leading-snug text-[var(--color-text-secondary)]">
        {marketCopy.name}
      </span>
      {/* The number + arrow: neutral ink — direction rides on the signed
       * number and the glyph, never on colour (§6.8). */}
      <span className="inline-flex items-baseline gap-0.5 font-semibold text-[var(--color-text-primary)]">
        <bdi dir="ltr" className="type-number tabular-nums">
          {signedPct(pct, numberLocale, locale)}
        </bdi>
        <span aria-hidden="true" className="text-[0.8em] leading-none">
          {arrow}
        </span>
      </span>
      {showTag ? (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${STATUS_TONE[entry.status]}`}
        >
          {interpolate(copy.markets.tileTagBelow, { x: tagX })}
        </span>
      ) : null}
      {old ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-stale)]">
          {interpolate(copy.markets.oldData, { date: oldDate })}
        </span>
      ) : null}
      <span className="sr-only">
        {copy.markets[TREND_WORD[entry.trend]]}, {copy.markets[STATUS_WORD[entry.status]]}, {interpolate(copy.markets.asOf, { date: oldDate })}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The detail panel (§6.5): three plain-language lines, the 52-week chart
 * (always left-to-right), and the numbers.
 * ------------------------------------------------------------------ */

function MarketDetail({
  entry,
  copy,
  locale,
  numberLocale,
}: {
  entry: MarketEntry;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const marketCopy = copy.markets.entries[entry.id];
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  const rows: Array<[string, string]> = [
    [copy.markets.lastCloseLabel, fmtClose(entry.close, numberLocale)],
    [copy.markets.high52wLabel, fmtClose(entry.high52w, numberLocale)],
    [copy.markets.low52wLabel, fmtClose(entry.low52w, numberLocale)],
  ];
  return (
    <div
      id={`insights-market-detail-${entry.id}`}
      className="rounded-[var(--radius-md)] bg-currena-soft/40 p-3 ring-1 ring-[var(--color-border)]"
    >
      <p className="m-0 mb-1 flex flex-wrap items-baseline gap-x-2 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {marketCopy.name}
        {locale === 'fa' ? (
          <span dir="ltr" className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
            {marketCopy.latin}
          </span>
        ) : null}
        <span className={`ms-auto inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${STATUS_TONE[entry.status]}`}>
          {copy.markets[STATUS_WORD[entry.status]]}
        </span>
      </p>
      <dl className="m-0 mb-2 flex flex-col gap-1">
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailWhat}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {marketCopy.what}
          </dd>
        </div>
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailWhy}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {marketCopy.why}
          </dd>
        </div>
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailYou}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {marketCopy.you}
          </dd>
        </div>
      </dl>
      {/* §6.5: time runs left to right on the chart in Farsi too. */}
      <div dir="ltr" className="not-prose">
        <MarketsChart
          weekly={weekly}
          close={entry.close}
          high52w={entry.high52w}
          low52w={entry.low52w}
          copy={copy}
          numberLocale={numberLocale}
        />
      </div>
      <dl className="m-0 mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{label}</dt>
            <dd className="m-0">
              <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
                {value}
              </bdi>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline gap-1.5">
          <dd className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(copy.markets.asOf, { date: formatAsOf(entry.asOf, locale) })}</bdi>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The takeaway line (§8.3): generated from the numbers, never free text
 * ------------------------------------------------------------------ */

export function marketsTakeaway(
  snapshot: MarketsSnapshot,
  copy: InsightsCopy,
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const { summary, markets } = snapshot;
  const stressed = summary.nAttention + summary.nUnusual;
  let line: string;
  if (summary.signal === 'normal') {
    line = interpolate(copy.markets.takeawayCalm, { up: num(summary.roseToday) });
  } else if (summary.signal === 'attention') {
    line = interpolate(copy.markets.takeawaySome, {
      n: num(stressed),
      group: summary.worstGroup !== null ? copy.markets.groups[summary.worstGroup] : copy.markets.groups.asia,
    });
  } else {
    line = interpolate(copy.markets.takeawayHeavy, { n: num(stressed) });
  }
  // The shock-day line (§5.3): takeaway text only, never part of the count.
  const shocks = markets.filter((m) => m.chg1d <= SHOCK_DAY_FALL).length;
  if (shocks >= SHOCK_DAY_COUNT) {
    line += ' ' + interpolate(copy.markets.takeawayShock, { k: num(shocks) });
  }
  return line;
}

/* ------------------------------------------------------------------ *
 * The full table (§6.4): real <table> with <th scope> at ≥900px; a
 * vertical row list below — the same three numbers either way.
 * ------------------------------------------------------------------ */

function MarketsTable({
  snapshot,
  copy,
  locale,
  numberLocale,
  onOpenRow,
}: {
  snapshot: MarketsSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onOpenRow: (id: MarketId) => void;
}) {
  // One sort only (§6.4): from the 52-week high, worst first — a stable
  // sort keeps the trading-day order inside equal distances.
  const rows = [...snapshot.markets].sort((a, b) => a.fromHigh - b.fromHigh);
  const trendCell = (m: MarketEntry): string => copy.markets[TREND_WORD[m.trend]];
  const arrow = (m: MarketEntry): string => TREND_ARROW[m.trend];

  return (
    <>
      {/* Desktop (≥900px): the real table. */}
      <div className="hidden min-[900px]:block">
        <table className="w-full border-collapse text-[length:var(--type-caption)]">
          <caption className="sr-only">{copy.markets.tableLabel}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.markets.thMarket}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.thToday}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.th1m}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.thFromHigh}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.markets.thTrend}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.markets.thStatus}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.thClose}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.id}
                onClick={() => onOpenRow(m.id)}
                className="cursor-pointer border-b border-[var(--color-border)]/60 transition-colors last:border-b-0 hover:bg-currena-soft/50"
              >
                <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                  {copy.markets.entries[m.id].name}
                </th>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.chg1d, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.chg1m, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.fromHigh, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                  <span aria-hidden="true" className="me-1">{arrow(m)}</span>
                  {trendCell(m)}
                </td>
                <td className="px-2 py-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${STATUS_TONE[m.status]}`}>
                    {copy.markets[STATUS_WORD[m.status]]}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{fmtClose(m.close, numberLocale)}</bdi>
                  <span className="ms-1 text-[var(--color-text-tertiary)]">({formatAsOf(m.asOf, locale)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile (<900px): the same three numbers as vertical rows. */}
      <ul className="m-0 grid list-none gap-1 p-0 min-[900px]:hidden">
        {rows.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onOpenRow(m.id)}
              className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-soft/50"
            >
              <span className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text-primary)]">
                {copy.markets.entries[m.id].name}
              </span>
              <span className="inline-flex items-baseline gap-3 text-[length:var(--type-caption)] font-semibold tabular-nums">
                <bdi dir="ltr">{signedPct(m.chg1d, numberLocale, locale)}</bdi>
                <bdi dir="ltr">{signedPct(m.chg1m, numberLocale, locale)}</bdi>
                <bdi dir="ltr">{signedPct(m.fromHigh, numberLocale, locale)}</bdi>
              </span>
              <span className="sr-only">{copy.markets[TREND_WORD[m.trend]]}, {copy.markets[STATUS_WORD[m.status]]}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The section
 * ------------------------------------------------------------------ */

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
  const [view, setView] = useState<MarketsView>('today');
  const [openId, setOpenId] = useState<MarketId | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

  // The as-of date: the freshest close any market carries (§6.3 header row;
  // Jalali in Farsi via the house formatter).
  const asOf = useMemo(() => {
    if (state.kind !== 'ready') return null;
    return state.snapshot.markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), state.snapshot.markets[0]?.asOf ?? '');
  }, [state]);

  const onToggleTile = useCallback((id: MarketId, _opener: HTMLElement | null) => {
    setOpenId((prev) => (prev === id ? null : id)); // one panel open at a time (§6.3)
  }, []);

  const onOpenRow = useCallback((id: MarketId) => {
    setOpenId(id);
    // Row click opens the same detail panel (§6.4) — scroll the tile into view.
    requestAnimationFrame(() => {
      document.getElementById(`insights-market-tile-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  if (state.kind === 'loading') {
    return (
      <section id="insights-markets" aria-labelledby="insights-markets-title" className="scroll-mt-24">
        <h2 id="insights-markets-title" className="type-section m-0 mb-1">
          <span className="inline-flex items-center gap-1.5">
            <Globe aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
            {copy.markets.title}
          </span>
        </h2>
        {/* §6.6 Loading: 14 grey skeleton tiles with the group labels in place. */}
        {MARKET_GROUP_ORDER.map((group) => (
          <div key={group} className="mt-2">
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
      <section id="insights-markets" aria-labelledby="insights-markets-title" className="scroll-mt-24">
        <h2 id="insights-markets-title" className="type-section m-0 mb-1">
          <span className="inline-flex items-center gap-1.5">
            <Globe aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
            {copy.markets.title}
          </span>
        </h2>
        {/* §6.6 Never populated: ONE calm line — no zeros, no empty tiles. */}
        <p className="m-0 rounded-[var(--radius-md)] bg-currena-soft/50 px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.markets.empty}
        </p>
        <p className="m-0 mt-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.markets.footer}</p>
      </section>
    );
  }

  const snapshot = state.snapshot;

  // §6.6 Everything stale (>5 days): the section collapses to one line.
  const everythingOld =
    snapshot.markets.length > 0 && snapshot.markets.every((m) => isOld(m, todayIso));
  if (everythingOld) {
    return (
      <section id="insights-markets" aria-labelledby="insights-markets-title" className="scroll-mt-24">
        <h2 id="insights-markets-title" className="type-section m-0 mb-1">
          <span className="inline-flex items-center gap-1.5">
            <Globe aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
            {copy.markets.title}
          </span>
        </h2>
        <p className="m-0 rounded-[var(--radius-md)] bg-currena-soft/50 px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {interpolate(copy.markets.collapsedStale, {
            date: formatRelativeShort(snapshot.generatedAt, locale),
          })}
        </p>
      </section>
    );
  }

  return (
    <section id="insights-markets" aria-labelledby="insights-markets-title" className="scroll-mt-24">
      {/* §6.3 Header row: title, and the as-of date on the far side. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-markets-title" className="type-section m-0">
          <span className="inline-flex items-center gap-1.5">
            <Globe aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
            {copy.markets.title}
          </span>
        </h2>
        {asOf ? (
          <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {interpolate(copy.markets.asOf, { date: formatDateShort(asOf, locale) })}
          </bdi>
        ) : null}
      </div>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.markets.subtitle}</p>

      {/* The takeaway line (§8.3), generated from the numbers. */}
      <p className="m-0 mb-2 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
        <bdi>{marketsTakeaway(snapshot, copy, numberLocale)}</bdi>
      </p>

      {/* The view switch (§6.3). Default Today. */}
      <div className="mb-2">
        <ViewSwitch view={view} copy={copy} onChange={setView} />
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
      <button
        type="button"
        aria-expanded={tableOpen}
        aria-controls="insights-markets-table"
        onClick={() => setTableOpen((v) => !v)}
        className="insights-focusable mt-3 inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
      >
        {tableOpen ? copy.markets.hideTable : copy.markets.showTable}
        <span aria-hidden="true" className="ms-1">{tableOpen ? '▴' : '▾'}</span>
      </button>
      {tableOpen ? (
        <div id="insights-markets-table" className="mt-2">
          <MarketsTable snapshot={snapshot} copy={copy} locale={locale} numberLocale={numberLocale} onOpenRow={onOpenRow} />
        </div>
      ) : null}

      {/* The footer line (§6.3): source, end-of-day, local currency. */}
      <p className="m-0 mt-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.markets.footer}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Date rendering: Jalali in Farsi (the house formatter), words in EN.
 * ------------------------------------------------------------------ */

function formatDateShort(iso: string, locale: 'en' | 'fa'): string {
  const localeTag = locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatRelativeShort(iso: string, locale: 'en' | 'fa'): string {
  const localeTag = locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
