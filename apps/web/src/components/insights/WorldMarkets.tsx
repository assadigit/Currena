/**
 * WorldMarkets — the "World stock markets" section
 * (insights-world-markets-spec.md §6, blocks 6.2–6.9, as amended by owner
 * round 44 / spec v1.2).
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
 * Anatomy: header row (the owner's exchange-chart artwork at the regions'
 * 96/128 scale + title + as-of date) → the focal VERDICT BOX — a white
 * surface card wearing the same [state artwork][verdict word][meter]
 * anatomy as the page's other verdicts, with the market words Bullish /
 * Mixed / Correcting / Bearish and the takeaway as its reason line → the
 * Today | 3 months | From 52-week-high view switch (3 months is the NORMAL
 * timeframe — owner round 44) → a strip of three labelled groups
 * (Asia-Pacific · Europe · Americas, the world waking up east to west) →
 * "Show full table" disclosure. The source line moved to the page footer
 * (About this data) with the other credits — owner round 44.
 *
 * Quiet by default (§6.3): only Correction/Bear markets carry an extra
 * tag; Normal tiles stay plain so problems stand out. Direction is never
 * colour alone (§6.8) — the signed number, the owner's up/down artwork
 * and text chips all carry it together (round 44: the PNG arrows join
 * the number, they don't replace it); the page's warning inks appear only
 * on Correction (needs-attention tier) and Bear (unusual tier).
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
import { VerdictMeter } from './VerdictMeter';
import { stepToneClass } from './config';
import {
  DIRECTION_DOWN_URL,
  DIRECTION_UP_URL,
  IconImg,
  MARKETS_SECTION_ICON_URL,
  stateIconUrl,
} from '../icons/currena';
import { Skeleton } from '../ui';
import { SectionVerdictLine } from './SectionVerdictLine';
import { formatAsOf } from './HistoryChart';

/** The page-level feed state (owned by Insights.tsx, passed down). */
export type MarketsLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: MarketsSnapshot };

/** The section's lenses: today, the NORMAL 3-month window, or the distance
 * from the 52-week high (spec §6.3 as amended by owner round 44). */
type MarketsView = 'today' | '3m' | 'high';

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

function arrowOf(n: number): 'up' | 'flat' | 'down' {
  if (n > 0) return 'up';
  if (n < 0) return 'down';
  return 'flat';
}

/**
 * Step-1 audit item F2/F3: ONE flat threshold for every market and every
 * view — |change| < 1% is "flat" (the old code derived the trend word from
 * each market's own 50-day moving average, so ASX at −0.3% said "Down"
 * while FTSE at +1.1% said "Flat", and DAX showed +0.6% with an up arrow
 * labelled "Down"). The trend WORD and its ARROW now come from the same
 * number the row shows.
 */
export const MARKETS_FLAT_BAND_PCT = 1;

function bandedArrow(pct: number): 'up' | 'flat' | 'down' {
  if (pct > MARKETS_FLAT_BAND_PCT) return 'up';
  if (pct < -MARKETS_FLAT_BAND_PCT) return 'down';
  return 'flat';
}

/** The Trend column's word source: the 3-month change (the default lens). */
export function trendOf(m: Pick<MarketEntry, 'chg3m'>): 'up' | 'flat' | 'down' {
  return bandedArrow(m.chg3m);
}

/** The number + direction the current view shows for one market. */
function viewValue(m: MarketEntry, view: MarketsView): { pct: number; arrow: 'up' | 'flat' | 'down' } {
  if (view === 'high') {
    return { pct: m.fromHigh, arrow: bandedArrow(m.fromHigh) };
  }
  const pct = view === 'today' ? m.chg1d : m.chg3m;
  return { pct, arrow: bandedArrow(pct) };
}

/**
 * Step-1 audit item A7: how many TRADING days this market's last close sits
 * behind the snapshot's freshest close (weekends never count — "a Saturday
 * or Sunday must never appear as a trading date"). More than one trading
 * day behind → the "Delayed" tag (the provider lag the audit caught on
 * TSX/Ibovespa, honestly named instead of invisible).
 */
export function tradingDaysBehind(asOf: string, freshest: string): number {
  if (asOf >= freshest) return 0;
  const from = Date.parse(`${asOf}T00:00:00Z`);
  const to = Date.parse(`${freshest}T00:00:00Z`);
  let days = 0;
  for (let t = from + 86_400_000; t <= to; t += 86_400_000) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) days += 1;
  }
  return days;
}

/** The owner's green up / red down artwork beside a signed percentage
 * (owner round 44). The flat case keeps a stroke-ish text glyph — there is
 * no "flat" artwork (the same rule as Signals.tsx' estimation strip). The
 * icons are decorative: the signed number beside them carries the meaning,
 * so colour is never alone (§6.8). */
function DirectionGlyph({ arrow, size = 14, desktopSize = 16 }: { arrow: 'up' | 'flat' | 'down'; size?: number; desktopSize?: number }) {
  if (arrow === 'up') return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (arrow === 'down') return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
  return (
    <span aria-hidden="true" className="text-[0.8em] leading-none text-[var(--color-text-secondary)]">
      →
    </span>
  );
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

const TREND_ARROW: Record<MarketEntry['trend'], 'up' | 'flat' | 'down'> = { up: 'up', flat: 'flat', down: 'down' };

/** Step-1 F2: the trend WORD key for trendOf's result (chg3m-sourced). */
const TREND_WORD_OF: Record<'up' | 'flat' | 'down', 'trendUp' | 'trendFlat' | 'trendDown'> = {
  up: 'trendUp',
  flat: 'trendFlat',
  down: 'trendDown',
};

/* ------------------------------------------------------------------ *
 * The view switch (§6.3): a real radiogroup, arrow keys work. The NORMAL
 * timeframe is 3 months — it is the lens the section opens on (owner
 * round 44; Today stays one tap away).
 * ------------------------------------------------------------------ */

const VIEWS: readonly MarketsView[] = ['today', '3m', 'high'];
const VIEW_LABEL: Record<MarketsView, 'viewToday' | 'view3m' | 'viewFromHigh'> = {
  today: 'viewToday',
  '3m': 'view3m',
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
  freshestIso,
  onToggle,
}: {
  entry: MarketEntry;
  view: MarketsView;
  open: boolean;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  todayIso: string;
  /** Step-1 A7: the snapshot's freshest close — the delayed tag's baseline. */
  freshestIso: string;
  onToggle: (id: MarketId, opener: HTMLElement | null) => void;
}) {
  const marketCopy = copy.markets.entries[entry.id];
  const { pct, arrow } = viewValue(entry, view);
  const old = isOld(entry, todayIso);
  const delayed = !old && tradingDaysBehind(entry.asOf, freshestIso) > 1;
  // Step-1 F5: EVERY tile shows its distance from the 52-week high
  // (S&P 500 and Nasdaq included — not only the correcting markets).
  const tagX = formatNumber(Math.abs(entry.fromHigh), numberLocale, { maximumFractionDigits: 0 });
  const oldDate = formatAsOf(entry.asOf, locale);
  const trendWord = copy.markets[TREND_WORD_OF[trendOf(entry)]];

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
      {/* The number + the owner's up/down artwork: the signed number
       * carries the meaning, the green/red zigzags ride beside it (round
       * 44) — direction is never colour alone (§6.8). */}
      <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
        <bdi dir="ltr" className="type-number tabular-nums">
          {signedPct(pct, numberLocale, locale)}
        </bdi>
        <DirectionGlyph arrow={arrow} />
      </span>
      {/* Step-1 F5: the 52-week distance rides EVERY tile — the correcting
       * markets keep their warning tone; a market at its high says so. */}
      {entry.fromHigh > -0.5 ? (
        <span className="inline-flex items-center rounded-full bg-currena-success/10 px-2 py-0.5 text-[0.68rem] font-bold text-[var(--color-status-normal)]">
          {copy.markets.atHighTag}
        </span>
      ) : (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
            entry.status === 'normal' ? 'bg-currena-muted/15 text-[var(--color-text-secondary)]' : STATUS_TONE[entry.status]
          }`}
        >
          {interpolate(copy.markets.tileTagBelow, { x: tagX })}
        </span>
      )}
      {delayed ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          {copy.markets.delayedTag}
        </span>
      ) : null}
      {old ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-stale)]">
          {interpolate(copy.markets.oldData, { date: oldDate })}
        </span>
      ) : null}
      <span className="sr-only">
        {trendWord}, {copy.markets[STATUS_WORD[entry.status]]}, {interpolate(copy.markets.asOf, { date: oldDate })}
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
      className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
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
 * The section verdict (owner round 44) — the focal box's word, computed
 * from the numbers like every other verdict on this page: the §5.3
 * signal sets the band (unusual → 4 Bearish, attention → 3 Correcting),
 * and a calm signal splits on 3-month BREADTH — most markets up → 1
 * Bullish, otherwise 2 Mixed. Pure and exported: the test drives it
 * directly (markets-verdict.test.ts).
 * ------------------------------------------------------------------ */

export type MarketsVerdictStep = 1 | 2 | 3 | 4;

export function marketsVerdictStep(snapshot: Pick<MarketsSnapshot, 'markets' | 'summary'>): MarketsVerdictStep {
  const { summary, markets } = snapshot;
  if (summary.signal === 'unusual') return 4;
  if (summary.signal === 'attention') return 3;
  if (markets.length === 0) return 2;
  const up = markets.filter((m) => m.chg3m > 0).length;
  return up > markets.length / 2 ? 1 : 2;
}

/** How many of the snapshot's markets sit in correction or a bear market. */
export function marketsInCorrectionCount(markets: readonly MarketEntry[]): number {
  return markets.filter((m) => m.status === 'correction' || m.status === 'bear').length;
}

const VERDICT_WORD: Record<MarketsVerdictStep, 'verdictBullish' | 'verdictMixed' | 'verdictCorrecting' | 'verdictBearish'> = {
  1: 'verdictBullish',
  2: 'verdictMixed',
  // Step-1 audit item E2: the attention tier says "Mixed" with the count
  // ("Mixed: 5 of 16 in correction"), NOT a section-wide "Correcting" —
  // 11 calm markets are not a correction. The dedicated word returns with
  // the Step-3 verdict rules.
  3: 'verdictMixed',
  4: 'verdictBearish',
};

/** The verdict box — the section's focal point, wearing the page's verdict
 * anatomy ([state artwork][word][meter], round 41 order: the artwork LEADS)
 * on a white surface card LAYERED on the mother container's soft field.
 * The takeaway line rides inside as its computed reason — one box answers
 * "calm or stressed" before any tile is read. */
function MarketsVerdictBox({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: MarketsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const step = marketsVerdictStep(snapshot);
  const word = copy.markets[VERDICT_WORD[step]];
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const ariaLabel = interpolate(copy.markets.verdictAria, { label: word, step: num(step) });
  // Step-1 E2: the attention tier's concrete count — "5 of 16 in correction"
  // beside the Mixed word (never a bare section-wide "Correcting").
  const inCorrection = marketsInCorrectionCount(snapshot.markets);
  const showCorrectionCount = step === 3 && inCorrection > 0;
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4">
      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        {stateIconUrl(step) !== null ? (
          <IconImg src={stateIconUrl(step)!} size={44} desktopSize={60} className="drop-shadow-sm" />
        ) : null}
        <span className={`type-verdict ${stepToneClass(step)}`}>{word}</span>
        {showCorrectionCount ? (
          <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
            <bdi>
              {interpolate(copy.markets.inCorrectionCount, {
                n: num(inCorrection),
                count: num(snapshot.markets.length),
              })}
            </bdi>
          </span>
        ) : null}
        <VerdictMeter step={step} label={word} ariaLabel={ariaLabel} size="lg" />
      </p>
      {/* §6.11: the verdict line — the MEASURE LABEL plus the page's
       * severity chip, ABOVE the takeaway. Every section verdict names
       * what it measures (shared with the currencies section). */}
      <div className="mt-2">
        <SectionVerdictLine
          label={
            snapshot.summary.signal === 'unusual'
              ? copy.markets.measureUnusual
              : snapshot.summary.signal === 'attention'
                ? copy.markets.measureAttention
                : copy.markets.measureNormal
          }
          chip={snapshot.summary.signal}
          copy={copy}
        />
      </div>
      {/* §8.3, generated from the numbers — never free text. */}
      <p className="m-0 mt-1.5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{marketsTakeaway(snapshot, copy, numberLocale)}</bdi>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The takeaway line (§8.3): generated from the numbers, never free text
 * ------------------------------------------------------------------ */

export function marketsTakeaway(
  snapshot: Pick<MarketsSnapshot, 'markets' | 'summary'>,
  copy: InsightsCopy,
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const { summary, markets } = snapshot;
  const stressed = summary.nAttention + summary.nUnusual;
  const count = num(markets.length);
  let line: string;
  if (summary.signal === 'normal') {
    line = interpolate(copy.markets.takeawayCalm, { up: num(summary.roseToday), count });
  } else if (summary.signal === 'attention') {
    line = interpolate(copy.markets.takeawaySome, {
      n: num(stressed),
      count,
      group: summary.worstGroup !== null ? copy.markets.groups[summary.worstGroup] : copy.markets.groups.asia,
    });
  } else {
    line = interpolate(copy.markets.takeawayHeavy, { n: num(stressed), count });
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
  // Step-1 F2: the trend word AND arrow come from the same 3-month number
  // the row shows (the old 50-day-MA word contradicted the row beside it).
  const trendCell = (m: MarketEntry): string => copy.markets[TREND_WORD_OF[trendOf(m)]];
  const arrow = (m: MarketEntry): 'up' | 'flat' | 'down' => trendOf(m);
  // Step-1 A7: the delayed tag's baseline — the freshest close in the payload.
  const freshestIso = snapshot.markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), snapshot.markets[0]?.asOf ?? '');

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
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.th3m}</th>
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
                  {/* §6.7: the English index name in small Latin text beside
                   * the Persian name — same rule as the detail panel. */}
                  {locale === 'fa' ? (
                    <span dir="ltr" className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
                      {copy.markets.entries[m.id].latin}
                    </span>
                  ) : null}
                </th>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.chg1d, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.chg3m, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.fromHigh, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                  <span aria-hidden="true" className="me-1 inline-flex align-[-2px]">
                    <DirectionGlyph arrow={arrow(m)} size={13} desktopSize={14} />
                  </span>
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
                  {tradingDaysBehind(m.asOf, freshestIso) > 1 ? (
                    <span className="ms-1.5 rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
                      {copy.markets.delayedTag}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile (<900px): the same three numbers as vertical rows. Step-1
       * F1: a one-time label header states which number is which (the
       * desktop table has <th>; the list never did). */}
      <p className="m-0 mb-1 flex items-baseline justify-between px-2.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)] min-[900px]:hidden">
        <span>{copy.markets.thMarket}</span>
        <span dir="ltr" className="inline-flex gap-3">
          <span>{copy.markets.thToday}</span>
          <span>{copy.markets.th3m}</span>
          <span>{copy.markets.thFromHigh}</span>
        </span>
      </p>
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
                {/* §6.7: the small Latin name rides the mobile row list too
                 * (the table's mobile form — same three numbers, same names). */}
                {locale === 'fa' ? (
                  <span dir="ltr" className="ms-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
                    {copy.markets.entries[m.id].latin}
                  </span>
                ) : null}
              </span>
              <span className="inline-flex items-baseline gap-3 text-[length:var(--type-caption)] font-semibold tabular-nums">
                <bdi dir="ltr">
                  {signedPct(m.chg1d, numberLocale, locale)}
                  <span className="sr-only"> {copy.markets.thToday}</span>
                </bdi>
                <bdi dir="ltr">
                  {signedPct(m.chg3m, numberLocale, locale)}
                  <span className="sr-only"> {copy.markets.th3m}</span>
                </bdi>
                <bdi dir="ltr">
                  {signedPct(m.fromHigh, numberLocale, locale)}
                  <span className="sr-only"> {copy.markets.thFromHigh}</span>
                </bdi>
              </span>
              <span className="sr-only">{copy.markets[TREND_WORD_OF[trendOf(m)]]}, {copy.markets[STATUS_WORD[m.status]]}</span>
              {tradingDaysBehind(m.asOf, freshestIso) > 1 ? (
                <span className="rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
                  {copy.markets.delayedTag}
                </span>
              ) : null}
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
