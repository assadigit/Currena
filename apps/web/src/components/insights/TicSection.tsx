/**
 * TicSection — "Who holds US government debt" (gap-closure S2-M2.4, the
 * owner's top-priority feature; docs/gap-closure/S2-treasury-foreign-holders.md §M2.4).
 *
 * Renders INSIDE the Global mother container, directly after the
 * borrowing-costs gauge group (the SectionLane's `ticSlot` — the
 * australiaSlot pattern). Anatomy top to bottom:
 *
 *   1. the sub-heading + the descriptive subtitle + the provenance line
 *      ("Data for <month>, released <date>" — the TIC's own ~6–7 week lag)
 *      + the calm out-of-date badge when dataMonth is >70 days old
 *      (the M1.4 wording family; the badge never hides the table).
 *   2. the data-generated headline (conditions only): the foreign total,
 *      then Japan and China with their 6-month changes.
 *   3. the official/private split bar (Table 5's "Of Which: Foreign
 *      Official" row; the remainder is private).
 *   4. the buyers/sellers chips — TRANSACTIONS over 12 months (Table 3's
 *      "Net U.S. Sales"), never holdings changes; the honest difference
 *      between the two is stated in plain language (netVsValueNote).
 *   5. the Japan + China 24-month trend chart (two SVG lines, dir="ltr"
 *      root — the house financial-chart convention) with a visible
 *      text summary (the accessible path).
 *   6. the holders table (≥900px: a real <table> with <th scope> and
 *      sortable <button> headers carrying aria-sort; below 900px: the
 *      card list — first 6 + "Show all"). Top 15 by holdings + Australia
 *      always visible; custody-hub rows wear the ◆ marker whose tooltip
 *      paraphrases Treasury's own caveat.
 *   7. the custody caveat line + the "?" tooltip with the fuller
 *      Treasury paraphrase.
 *
 * States: loading (skeleton), empty (the calm "being prepared" line —
 * this feed NEVER surfaces an error state, the markets/fx §6.6 family),
 * ready (+stale: derived at RENDER time from dataMonth via the shared
 * pure ticIsStale — the endpoint serves verbatim, the UI never presents
 * a >70-day-old table as current).
 *
 * Data: GET /api/insights/tic via lib/tic.ts (own last-good localStorage
 * cache). A page request can never reach a provider.
 *
 * Numbers: formatNumber (Intl, fa-IR → Persian digits). The $ unit lives
 * in the column headers and the phrase copy, never glued to the numbers.
 */

import { useMemo, useState } from 'react';
import type { IndicatorId, IndicatorReading, TicHolder, TicSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { ticHolderDerived, ticIsStale, ticTopMovers } from '@currena/insights/tic';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { Skeleton } from '../ui';
import { CompactRow } from './CompactRow';
import type { DailyPeers } from './config';

/** The section's own load state (the markets/fx discipline). */
export type TicLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: TicSnapshot; fromCache?: boolean };

/* ------------------------------------------------------------------ *
 * Formatting helpers (pure, module-scope).
 * ------------------------------------------------------------------ */

type NumberLocale = 'en-US' | 'fa-IR';
type Locale = 'en' | 'fa';

const NO_READING = '—';

function fmtBn(v: number, locale: NumberLocale): string {
  return formatNumber(v, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtBn0(v: number, locale: NumberLocale): string {
  return formatNumber(v, locale, { maximumFractionDigits: 0 });
}

/** A signed $bn cell value: +57.3 / −48.4 (the sign is the meaning). */
function fmtSignedBn(v: number, locale: NumberLocale): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${fmtBn(Math.abs(v), locale)}`;
}

function fmtPct(v: number, locale: NumberLocale): string {
  return `${formatNumber(v, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** '2026-08' → "August 2026" / «اوت ۲۰۲۶» (Gregorian months in both). */
function monthWords(ym: string, locale: Locale): string {
  const [y, m] = ym.split('-');
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 15));
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/** '2026-08' → "Aug" / «اوت» (chart tick labels). */
function monthShort(ym: string, locale: Locale): string {
  const [y, m] = ym.split('-');
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 15));
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory', {
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

/** An ISO date → words ("Oct 16, 2026" / «۱۶ اکتبر ۲۰۲۶»). */
function dateWords(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
}

/** The display name: OUR dictionary first, the provider's own string as
 * the honest fallback (a new entrant never crashes the section). */
function holderName(holder: TicHolder, copy: InsightsCopy): string {
  return copy.tic.countries[holder.id as keyof typeof copy.tic.countries] ?? holder.name;
}

/* ------------------------------------------------------------------ *
 * The derived row (one per holder, memoised by the parent).
 * ------------------------------------------------------------------ */

interface Row {
  holder: TicHolder;
  name: string;
  d: ReturnType<typeof ticHolderDerived>;
}

/* ------------------------------------------------------------------ *
 * The 24-month sparkline (aria-hidden decoration — the row's numbers
 * are the text path, exactly the markets-table discipline).
 * ------------------------------------------------------------------ */

function Sparkline({ months, className = '' }: { months: readonly { ym: string; v: number }[]; className?: string }) {
  if (months.length < 2) return null;
  const w = 84;
  const h = 22;
  const min = Math.min(...months.map((m) => m.v));
  const max = Math.max(...months.map((m) => m.v));
  const span = max - min || 1;
  const pts = months
    .map((m, i) => {
      const x = (i / (months.length - 1)) * (w - 2) + 1;
      const y = h - 2 - ((m.v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const rising = months.at(-1)!.v >= months[0]!.v;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`h-[22px] w-[84px] ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={pts}
        fill="none"
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={rising ? 'stroke-currena-success' : 'stroke-currena-coral'}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The Japan + China chart: two lines, 24 months, shared Y scale (the
 * MarketsChart geometry discipline), dir="ltr" root.
 * ------------------------------------------------------------------ */

function JapanChinaChart({
  snapshot,
  copy,
  locale,
  numberLocale,
}: {
  snapshot: TicSnapshot;
  copy: InsightsCopy;
  locale: Locale;
  numberLocale: NumberLocale;
}) {
  const japan = snapshot.holders.find((h) => h.id === 'japan');
  const china = snapshot.holders.find((h) => h.id === 'china-mainland');
  const chart = useMemo(() => {
    if (japan === undefined || china === undefined) return null;
    const months = japan.months;
    if (months.length < 2) return null;
    const values = [...japan.months.map((m) => m.v), ...china!.months.map((m) => m.v)];
    let min = Math.min(...values);
    let max = Math.max(...values);
    const pad = (max - min) * 0.06 || max * 0.001 || 1;
    min -= pad;
    max += pad;
    const w = 560;
    const h = 150;
    const x = (i: number): number => (i / (months.length - 1)) * (w - 8) + 4;
    const y = (v: number): number => h - 6 - ((v - min) / (max - min)) * (h - 12);
    const line = (holder: TicHolder): string =>
      holder.months
        .map((m, i) => `${x(i).toFixed(1)},${y(m.v).toFixed(1)}`)
        .join(' ');
    return { w, h, x, y, line, n: months.length };
  }, [japan, china]);
  if (japan === undefined || china === undefined || chart === null) return null;

  const japanName = holderName(japan, copy);
  const chinaName = holderName(china, copy);
  const japanFirst = japan.months[0]!;
  const japanLast = japan.months.at(-1)!;
  const chinaFirst = china.months[0]!;
  const chinaLast = china.months.at(-1)!;
  const phrase = (delta: number): string =>
    interpolate(delta < 0 ? copy.tic.phraseDown : copy.tic.phraseUp, {
      amount: interpolate(copy.tic.phraseBillion, { n: fmtBn(Math.abs(delta), numberLocale) }),
    });
  const summary = interpolate(copy.tic.chartSummary, {
    from: interpolate(copy.tic.phraseBillion, { n: fmtBn(japanFirst.v, numberLocale) }),
    to: interpolate(copy.tic.phraseBillion, { n: fmtBn(japanLast.v, numberLocale) }),
    phrase: phrase(japanLast.v - japanFirst.v),
    cFrom: interpolate(copy.tic.phraseBillion, { n: fmtBn(chinaFirst.v, numberLocale) }),
    cTo: interpolate(copy.tic.phraseBillion, { n: fmtBn(chinaLast.v, numberLocale) }),
    cPhrase: phrase(chinaLast.v - chinaFirst.v),
    month: monthWords(snapshot.dataMonth, locale),
  });

  const tickIdx = [0, Math.floor((chart.n - 1) / 2), chart.n - 1];
  return (
    <figure className="m-0">
      <figcaption className="mb-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        {copy.tic.chartTitle}
      </figcaption>
      <div dir="ltr" className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 ring-1 ring-[var(--color-border)]">
        <svg
          viewBox={`0 0 ${chart.w} ${chart.h + 16}`}
          className="block h-auto w-full"
          role="img"
          aria-label={summary}
        >
          {/* Japan — the accent blue; China — the coral. Both labelled in
              the legend; colour is never the only carrier (the summary
              text + the table carry the same numbers). */}
          <polyline
            points={chart.line(japan)}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-currena-blue"
          />
          <polyline
            points={chart.line(china)}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-currena-coral"
          />
          {tickIdx.map((i) => (
            <text
              key={i}
              x={chart.x(i)}
              y={chart.h + 12}
              textAnchor={i === 0 ? 'start' : i === chart.n - 1 ? 'end' : 'middle'}
              className="fill-[var(--color-text-tertiary)] text-[10px]"
            >
              {monthShort(japan.months[i]!.ym, locale)}
            </text>
          ))}
        </svg>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-[3px] w-4 rounded-full bg-currena-blue" />
            {japanName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-[3px] w-4 rounded-full bg-currena-coral" />
            {chinaName}
          </span>
        </div>
      </div>
      <p className="mt-1.5 mb-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{summary}</p>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * The official/private split bar.
 * ------------------------------------------------------------------ */

function SplitBar({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: TicSnapshot;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
}) {
  if (snapshot.officialBn === undefined || snapshot.privateBn === undefined) return null;
  const total = snapshot.officialBn + snapshot.privateBn;
  const officialPct = total > 0 ? (snapshot.officialBn / total) * 100 : 0;
  const privatePct = 100 - officialPct;
  return (
    <div>
      <p className="m-0 mb-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        {copy.tic.splitTitle}
      </p>
      <div
        dir="ltr"
        role="img"
        aria-label={`${copy.tic.officialWord}: ${fmtPct(officialPct, numberLocale)}; ${copy.tic.privateWord}: ${fmtPct(privatePct, numberLocale)}`}
        className="flex h-7 w-full overflow-hidden rounded-full ring-1 ring-[var(--color-border)]"
      >
        <div
          className="flex items-center justify-center bg-currena-blue/45 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]"
          style={{ width: `${officialPct}%` }}
        >
          {officialPct >= 18 ? <bdi>{fmtPct(officialPct, numberLocale)}</bdi> : null}
        </div>
        <div
          className="flex items-center justify-center bg-currena-muted/40 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]"
          style={{ width: `${privatePct}%` }}
        >
          {privatePct >= 18 ? <bdi>{fmtPct(privatePct, numberLocale)}</bdi> : null}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-currena-blue/45" />
          {copy.tic.officialWord}
          <bdi className="font-semibold">
            {interpolate(copy.tic.phraseBillion, { n: fmtBn(snapshot.officialBn, numberLocale) })}
          </bdi>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-currena-muted/40" />
          {copy.tic.privateWord}
          <bdi className="font-semibold">
            {interpolate(copy.tic.phraseBillion, { n: fmtBn(snapshot.privateBn, numberLocale) })}
          </bdi>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The chips: the 3 largest net buyers and net sellers over 12 months
 * (TRANSACTIONS — the net12m number, never holdings changes).
 * ------------------------------------------------------------------ */

function MoverChips({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: TicSnapshot;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
}) {
  const { buyers, sellers } = ticTopMovers(snapshot, 3);
  if (buyers.length === 0 && sellers.length === 0) return null;
  const chip = (name: string, net12mBn: number): string =>
    `${name} ${fmtSignedBn(net12mBn, numberLocale)}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {buyers.length > 0 ? (
        <div className="rounded-[var(--radius-md)] bg-currena-success/10 p-3 ring-1 ring-currena-success/25">
          <p className="m-0 mb-1.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            {copy.tic.buyersTitle}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {buyers.map((b) => (
              <li
                key={b.id}
                className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)] ring-1 ring-currena-success/30"
                title={copy.tic.netBuyingWord}
              >
                {chip(
                  copy.tic.countries[b.id as keyof typeof copy.tic.countries] ?? b.name,
                  b.net12mBn,
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {sellers.length > 0 ? (
        <div className="rounded-[var(--radius-md)] bg-currena-coral/10 p-3 ring-1 ring-currena-coral/25">
          <p className="m-0 mb-1.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            {copy.tic.sellersTitle}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {sellers.map((s) => (
              <li
                key={s.id}
                className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)] ring-1 ring-currena-coral/30"
                title={copy.tic.netSellingWord}
              >
                {chip(
                  copy.tic.countries[s.id as keyof typeof copy.tic.countries] ?? s.name,
                  s.net12mBn,
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The table (≥900px) — sortable, real <table>, aria-sort.
 * ------------------------------------------------------------------ */

type SortKey = 'holdingsBn' | 'chg1m' | 'chg12m' | 'net12m';

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  copy,
  numeric,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (key: SortKey) => void;
  copy: InsightsCopy;
  numeric: boolean;
}) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className="px-2 py-2 text-start align-bottom">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={interpolate(copy.tic.sortAria, { column: label })}
        className={`insights-focusable inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-[length:var(--type-caption)] font-bold transition-colors hover:bg-currena-blue/10 ${
          active ? 'text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/50 underline-offset-2' : 'text-[var(--color-text-secondary)]'
        } ${numeric ? 'sm:justify-end' : ''}`}
      >
        {label}
        <span aria-hidden="true" className="text-[9px] leading-none">
          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

function HoldersTable({
  rows,
  snapshot,
  copy,
  locale,
  numberLocale,
}: {
  rows: readonly Row[];
  snapshot: TicSnapshot;
  copy: InsightsCopy;
  locale: Locale;
  numberLocale: NumberLocale;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'holdingsBn', dir: 'desc' });
  const onSort = (key: SortKey): void => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'holdingsBn' ? 'desc' : 'asc' }));
  };
  const sorted = (() => {
    const val = (r: Row): number | null => {
      if (sort.key === 'holdingsBn') return r.holder.holdingsBn;
      if (sort.key === 'chg1m') return r.d.chg1mBn;
      if (sort.key === 'chg12m') return r.d.chg12mBn;
      return r.d.net12mBn;
    };
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1; // nulls last, either direction
      if (bv === null) return -1;
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
  })();

  const cell = (v: number | null, fmt: (n: number) => string): string => (v === null ? NO_READING : fmt(v));
  const tone = (v: number | null): string =>
    v === null || v === 0
      ? 'text-[var(--color-text-secondary)]'
      : v > 0
        ? 'text-currena-success'
        : 'text-currena-coral';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[length:var(--type-label)]">
        <caption className="sr-only">
          {interpolate(copy.tic.tableCaption, { month: monthWords(snapshot.dataMonth, locale) })}
        </caption>
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <SortHeader label={copy.tic.colCountry} sortKey="holdingsBn" sort={sort} onSort={onSort} copy={copy} numeric={false} />
            <SortHeader label={copy.tic.colHoldings} sortKey="holdingsBn" sort={sort} onSort={onSort} copy={copy} numeric />
            <th scope="col" className="px-2 py-2 text-end align-bottom text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
              {copy.tic.colShare}
            </th>
            <SortHeader label={copy.tic.col1m} sortKey="chg1m" sort={sort} onSort={onSort} copy={copy} numeric />
            <SortHeader label={copy.tic.col12m} sortKey="chg12m" sort={sort} onSort={onSort} copy={copy} numeric />
            <SortHeader label={copy.tic.colNet} sortKey="net12m" sort={sort} onSort={onSort} copy={copy} numeric />
            <th scope="col" className="px-2 py-2 text-end align-bottom text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
              {copy.tic.colVal}
            </th>
            <th scope="col" className="px-2 py-2 text-center align-bottom text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
              {copy.tic.colTrend}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.holder.id}
              className="border-b border-[var(--color-border)]/60 last:border-b-0"
              title={
                r.holder.flaggedMonths !== undefined && r.holder.flaggedMonths.length > 0 ? copy.tic.flaggedNote : undefined
              }
            >
              <th scope="row" className="px-2 py-2 text-start font-semibold text-[var(--color-text-primary)]">
                {r.name}
                {r.holder.isCustodyHub ? (
                  <span
                    className="ms-1 align-super text-[10px] leading-none text-[var(--color-text-tertiary)]"
                    title={copy.tic.custodyTooltip}
                    aria-label={copy.tic.custodyBadge}
                  >
                    ◆
                  </span>
                ) : null}
              </th>
              <td className="px-2 py-2 text-end font-semibold text-[var(--color-text-primary)]">
                <bdi>{fmtBn(r.holder.holdingsBn, numberLocale)}</bdi>
              </td>
              <td className="px-2 py-2 text-end text-[var(--color-text-secondary)]">
                <bdi>{fmtPct(r.d.sharePct, numberLocale)}</bdi>
              </td>
              <td className={`px-2 py-2 text-end font-semibold ${tone(r.d.chg1mBn)}`}>
                <bdi>{cell(r.d.chg1mBn, (n) => fmtSignedBn(n, numberLocale))}</bdi>
              </td>
              <td className={`px-2 py-2 text-end font-semibold ${tone(r.d.chg12mBn)}`}>
                <bdi>{cell(r.d.chg12mBn, (n) => fmtSignedBn(n, numberLocale))}</bdi>
              </td>
              <td
                className={`px-2 py-2 text-end font-bold ${tone(r.d.net12mBn)}`}
                title={r.d.netMonths > 0 && r.d.netMonths < 12 ? interpolate(copy.tic.netMonthsNote, { n: fmtBn0(r.d.netMonths, numberLocale) }) : undefined}
              >
                <bdi>{cell(r.d.net12mBn, (n) => fmtSignedBn(n, numberLocale))}</bdi>
              </td>
              <td className="px-2 py-2 text-end text-[var(--color-text-secondary)]">
                <bdi>{cell(r.d.val12mBn, (n) => fmtSignedBn(n, numberLocale))}</bdi>
              </td>
              <td className="px-2 py-2 text-center">
                <Sparkline months={r.holder.months} className="mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The mobile card list (<900px): first 6 + "Show all".
 * ------------------------------------------------------------------ */

function HolderCards({
  rows,
  copy,
  numberLocale,
}: {
  rows: readonly Row[];
  copy: InsightsCopy;
  numberLocale: NumberLocale;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, 6);
  const tone = (v: number | null): string =>
    v === null || v === 0
      ? 'text-[var(--color-text-secondary)]'
      : v > 0
        ? 'text-currena-success'
        : 'text-currena-coral';
  return (
    <div className="flex flex-col gap-2">
      {visible.map((r) => (
        <div
          key={r.holder.id}
          className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
          title={
            r.holder.flaggedMonths !== undefined && r.holder.flaggedMonths.length > 0 ? copy.tic.flaggedNote : undefined
          }
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
              {r.name}
              {r.holder.isCustodyHub ? (
                <span
                  className="ms-1 align-super text-[10px] leading-none text-[var(--color-text-tertiary)]"
                  title={copy.tic.custodyTooltip}
                  aria-label={copy.tic.custodyBadge}
                >
                  ◆
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
              <bdi>{fmtBn(r.holder.holdingsBn, numberLocale)}</bdi>
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
            <span>
              {copy.tic.colShare} <bdi>{fmtPct(r.d.sharePct, numberLocale)}</bdi>
            </span>
            <span className={tone(r.d.chg1mBn)}>
              {copy.tic.col1m}: <bdi>{r.d.chg1mBn === null ? NO_READING : fmtSignedBn(r.d.chg1mBn, numberLocale)}</bdi>
            </span>
            <span className={tone(r.d.chg12mBn)}>
              {copy.tic.col12m}: <bdi>{r.d.chg12mBn === null ? NO_READING : fmtSignedBn(r.d.chg12mBn, numberLocale)}</bdi>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-[length:var(--type-label)] font-bold ${tone(r.d.net12mBn)}`}
              title={r.d.netMonths > 0 && r.d.netMonths < 12 ? copy.tic.netMonthsNote : undefined}
            >
              {copy.tic.colNet}:{' '}
              <bdi>{r.d.net12mBn === null ? NO_READING : fmtSignedBn(r.d.net12mBn, numberLocale)}</bdi>
            </span>
            <Sparkline months={r.holder.months} />
          </div>
        </div>
      ))}
      {rows.length > 6 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-[var(--color-border)] bg-transparent px-3.5 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/10"
        >
          {showAll
            ? copy.tic.showFewerRows
            : interpolate(copy.tic.showAllRows, { n: fmtBn0(rows.length, numberLocale) })}
          <span aria-hidden="true" className={`ms-1 transition-transform ${showAll ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The weekly custody card (S2-M2.4's spec item 6 — FRED WSEFINTL1)
 * ------------------------------------------------------------------ */

/**
 * TicCustodyCard — the standard indicator card (the CompactRow anatomy,
 * with its 10-year position bar via ALWAYS_POSITION_IDS) that closes the
 * TIC section: the WEEKLY foreign-official custody level beside the
 * monthly country table that lags ~6–7 weeks. Renders inside the
 * SectionLane's ticSlot right below the TicSection (Insights.tsx); the
 * reading rides the main insights snapshot (HIDDEN_FROM_LANE_IDS keeps it
 * out of the borrowing-costs lane — one reading, one surface).
 *
 * null reading → nothing (the snapshot is loading or the series is held;
 * the TIC section's own states are independent and never wait on this).
 */
export function TicCustodyCard({
  reading,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  peers,
}: {
  reading: IndicatorReading | null;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: boolean;
  peers?: DailyPeers;
}) {
  if (reading === null) return null;
  return (
    <div className="lane-fill lane-fill-rows gap-1.5" data-tic-custody>
      <CompactRow
        reading={reading}
        copy={copy}
        numberLocale={numberLocale}
        onOpenDetails={onOpenDetails}
        pinned={pinned}
        peers={peers}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The section.
 * ------------------------------------------------------------------ */

export function TicSection({
  state,
  copy,
  locale,
  numberLocale,
  now = () => new Date(),
}: {
  state: TicLoadState;
  copy: InsightsCopy;
  locale: Locale;
  numberLocale: NumberLocale;
  /** Clock injection (tests pin the >70-day gate deterministically). */
  now?: () => Date;
}) {
  if (state.kind === 'loading') {
    return (
      <div id="insights-tic" className="scroll-mt-24 flex flex-col gap-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (state.kind === 'empty') {
    return (
      <div id="insights-tic" className="scroll-mt-24">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">{copy.tic.title}</h3>
        <p className="mt-2 mb-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.tic.empty}
        </p>
      </div>
    );
  }

  const snapshot = state.snapshot;
  const stale = ticIsStale(snapshot, now());
  const month = monthWords(snapshot.dataMonth, locale);
  const released =
    snapshot.releasedAt !== undefined ? dateWords(snapshot.releasedAt, locale) : undefined;

  // The table's rows: the top 15 by holdings + Australia (always visible).
  // Plain computation (no memo) — the hooks-above-early-returns rule; 21
  // rows of arithmetic per render is nothing.
  const byHoldings = [...snapshot.holders].sort((a, b) => b.holdingsBn - a.holdingsBn);
  const top15 = byHoldings.slice(0, 15);
  const australia = byHoldings.find((h) => h.id === 'australia');
  const chosen = australia !== undefined && !top15.includes(australia) ? [...top15, australia] : top15;
  const rows: Row[] = chosen.map((h) => ({ holder: h, name: holderName(h, copy), d: ticHolderDerived(h, snapshot) }));

  // The headline: the total, Japan and China with their 6-month changes.
  const byId = new Map(snapshot.holders.map((h) => [h.id, h]));
  const headlinePhrase = (delta: number | null): string =>
    delta === null
      ? ''
      : interpolate(delta < 0 ? copy.tic.phraseDown : copy.tic.phraseUp, {
          amount: interpolate(copy.tic.phraseBillion, { n: fmtBn(Math.abs(delta), numberLocale) }),
        });
  const bnPhrase = (v: number): string => interpolate(copy.tic.phraseBillion, { n: fmtBn(v, numberLocale) });
  const holdersPart = (id: string): { amount: string; phrase: string } | null => {
    const h = byId.get(id);
    if (h === undefined) return null;
    const d = ticHolderDerived(h, snapshot);
    return { amount: bnPhrase(h.holdingsBn), phrase: headlinePhrase(d.chg6mBn) };
  };
  const jp = holdersPart('japan');
  const cn = holdersPart('china-mainland');
  const headline = interpolate(copy.tic.headline, {
    total: interpolate(copy.tic.phraseTrillion, { n: fmtBn(snapshot.totalBn / 1000, numberLocale) }),
    month,
    japan: jp?.amount ?? NO_READING,
    japanPhrase: jp?.phrase ?? '',
    china: cn?.amount ?? NO_READING,
    chinaPhrase: cn?.phrase ?? '',
  });

  return (
    <div id="insights-tic" className="scroll-mt-24 flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">{copy.tic.title}</h3>
        {stale ? (
          <span className="rounded-full bg-currena-muted/25 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
            {copy.tic.staleBadge}
          </span>
        ) : null}
      </div>
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        {copy.tic.subtitle}
        {released !== undefined ? (
          <>
            {' · '}
            <bdi>{interpolate(copy.tic.provenance, { month, date: released })}</bdi>
          </>
        ) : null}
      </p>

      {/* The data-generated headline (conditions only). */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]">{headline}</p>

      <SplitBar snapshot={snapshot} copy={copy} numberLocale={numberLocale} />

      <MoverChips snapshot={snapshot} copy={copy} numberLocale={numberLocale} />

      <JapanChinaChart snapshot={snapshot} copy={copy} locale={locale} numberLocale={numberLocale} />

      {/* The honest-difference note (transactions vs price effect) — the
          design rule of the whole section, stated once in plain language. */}
      <p className="m-0 rounded-[var(--radius-md)] bg-currena-soft/70 px-3.5 py-2.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)] dark:bg-white/[0.04]">
        {copy.tic.netVsValueNote}
      </p>

      {/* The table (desktop) / the card list (mobile) — the same numbers
          either way, exactly the markets-table discipline. */}
      <div className="hidden min-[900px]:block">
        <HoldersTable rows={rows} snapshot={snapshot} copy={copy} locale={locale} numberLocale={numberLocale} />
      </div>
      <div className="min-[900px]:hidden">
        <HolderCards rows={rows} copy={copy} numberLocale={numberLocale} />
      </div>

      {/* The custody caveat — Treasury's own warning, paraphrased; the "?"
          tooltip carries the fuller version (the ◆ rows point here too). */}
      <p className="m-0 flex items-start gap-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        <span aria-hidden="true" className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center text-[11px] font-bold text-[var(--color-text-secondary)]" title={copy.tic.custodyTooltip}>
          ?
        </span>
        {copy.tic.custodyCaveat}
      </p>
    </div>
  );
}
