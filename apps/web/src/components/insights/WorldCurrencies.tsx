/**
 * WorldCurrencies — the "World currencies" section
 * (insights-world-currencies-spec.md §9 anatomy, direction B, all states).
 *
 * Where: directly after the world stock markets (§9.2) — the two sections
 * explain each other, and each verdict names what it measures (§9.10), so
 * they can never read as one contradiction.
 *
 * Anatomy top to bottom (§9.3): header row (title + one as-of date) → the
 * VERDICT LINE (the §9.10 measure label + the page's severity chip + one
 * headline sentence) → PATTERN CARDS (Level 1 collapsed rows, the first
 * opens at Level 2; Level 3 one tap deeper) → the QUIET AREA (always one
 * closest-to-warning row with a distance bar) → DOLLAR AT A GLANCE → the
 * pairs table behind "Show all currency pairs" → the section footer line.
 *
 * Verdicts first, numbers support them (§0): every sentence is two-part —
 * what we see (fact, the real numbers) and what it usually means (a
 * hedged tendency) — and reliability is shown by the 13 dots, never a
 * label (V1). No tile strip, no period switch (A3): the four periods are
 * table columns. Time always runs LEFT TO RIGHT inside charts and the
 * dots strip, even in Farsi (§9.6). Direction is never colour alone
 * (§9.7): signs, words and glyphs carry it together.
 */

import { useCallback, useMemo, useId, useState } from 'react';
import type { ReactElement } from 'react';
import { formatNumber } from '@currena/core';
import type { FxPairEntry, FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import { decodeWeeklySeries } from '@currena/insights/markets/definitions';
import { fxRuleHasPatternCheck } from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { Skeleton } from '../ui';
import {
  fxChangeLine,
  fxChartLineLabel,
  fxDollarMeaning,
  fxClosestToWarning,
  fxHeadline,
  fxHeadlineVerdict,
  fxMoneyLine,
  fxPlainWords,
  fxQuietRules,
  fxQuietView,
  fxRuleCopyKey,
  fxMeasureKey,
  fxPairRows,
  fxRulePairIds,
  fxRuleView,
  fxSentence,
  fxTrendOf,
  fxPatternOrder,
  type FxQuietView,
} from '../../lib/fx-presentation';
import { formatAsOf } from './HistoryChart';
import { SectionVerdictLine } from './SectionVerdictLine';

/** The page-level feed state (owned by Insights.tsx, passed down). */
export type FxLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: FxSnapshot };

/* ------------------------------------------------------------------ *
 * Pure display helpers (shared shapes with WorldMarkets)
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

/** Client-side V6 (§9.5): the honest old-data evaluation. */
function isOld(entry: { asOf: string; stale?: boolean }, todayIso: string): boolean {
  const days = Math.round(
    (Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${entry.asOf}T00:00:00Z`)) / 86_400_000,
  );
  return entry.stale === true || days > 5;
}

function formatDateShort(iso: string, locale: 'en' | 'fa'): string {
  const localeTag = locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/* ------------------------------------------------------------------ *
 * v1.3 — the glossary tip (CR §4.6): a small "?" after a term opens the
 * one-sentence definition. Tap or keyboard, never hover-only.
 * ------------------------------------------------------------------ */

function GlossaryTip({ def, srLabel }: { def: string; srLabel: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={srLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="insights-focusable ms-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-currena-muted/25 align-middle text-[0.66rem] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/45"
      >
        ?
      </button>
      {open ? (
        <span
          id={panelId}
          className="mt-1 block rounded-[var(--radius-md)] bg-currena-soft/70 px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
        >
          <bdi>{def}</bdi>
        </span>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * v1.3 — "How to read this section" (CR §4.5): a small button next to the
 * title, closed by default; five short items + the glossary tips.
 * ------------------------------------------------------------------ */

function HowToRead({ copy }: { copy: InsightsCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="insights-fx-howto"
        onClick={() => setOpen((v) => !v)}
        className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
      >
        {copy.fx.howToRead}
        <span aria-hidden="true" className="ms-1">{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <div
          id="insights-fx-howto"
          className="mt-2 flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
        >
          <ol className="m-0 flex list-decimal flex-col gap-1.5 ps-5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.fx.howToReadItems.map((item, i) => (
              <li key={i}>
                <bdi>{item}</bdi>
              </li>
            ))}
          </ol>
          <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
            {copy.fx.glossaryTitle}
          </p>
          <ul className="m-0 grid list-none gap-1 p-0">
            {Object.values(copy.fx.glossary).map((g) => (
              <li key={g.term} className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
                <span className="font-semibold">{g.term}</span>
                <GlossaryTip def={g.def} srLabel={g.term} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * v1.3 — the "In plain words" block (CR §4.2), directly under the verdict
 * line: three to four short lines built from the numbers. This is what
 * most visitors read.
 * ------------------------------------------------------------------ */

function PlainWords({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const words = useMemo(() => fxPlainWords(snapshot, copy.fx, numberLocale), [snapshot, copy, numberLocale]);
  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
        {copy.fx.plainTitle}
      </p>
      <ul className="m-0 grid list-none gap-1 p-0">
        <li className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
          <bdi>{words.s1}</bdi>
        </li>
        {words.s2 !== null ? (
          <li className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{words.s2}</bdi>
          </li>
        ) : null}
        {words.s3 !== null ? (
          <li className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{words.s3}</bdi>
          </li>
        ) : null}
        <li className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{words.s4}</bdi>
        </li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The 13 dots (§9.3 Level 2 item 3) — time runs left to right, always
 * ------------------------------------------------------------------ */

function Dots13({
  pattern,
  copy,
  numberLocale,
}: {
  pattern: FxRuleState['pattern'];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  return (
    <div>
      <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
        {copy.fx.dotsTitle}
      </p>
      {/* §9.6: the strip runs left→right even in Farsi — the end labels say so. */}
      <div dir="ltr" className="not-prose flex items-center gap-2">
        <span className="text-[0.62rem] font-semibold text-[var(--color-text-tertiary)]">{copy.fx.dotsEndStart}</span>
        <span aria-hidden="true" className="flex items-center gap-1" role="img">
          {pattern.weeks.map((held, i) =>
            held === null ? (
              <span
                key={i}
                className="inline-block h-[3px] w-[7px] rounded-full bg-[var(--color-text-tertiary)]/60"
              />
            ) : (
              <span
                key={i}
                className={`inline-block h-2 w-2 rounded-full ${
                  held
                    ? 'bg-[var(--color-text-primary)]'
                    : 'bg-transparent ring-1.5 ring-inset ring-[var(--color-text-primary)]/60'
                }`}
              />
            ),
          )}
        </span>
        <span className="text-[0.62rem] font-semibold text-[var(--color-text-tertiary)]">{copy.fx.dotsEndNow}</span>
      </div>
      <p className="m-0 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.66rem] text-[var(--color-text-tertiary)]">
        {/* §9.7: the dots are readable as text — count + legend. */}
        <span className="font-semibold text-[var(--color-text-secondary)]">
          {interpolate(copy.fx.reliabilityDetail, { k: num(pattern.agreeWeeks) })}
        </span>
        <span>
          ● {copy.fx.dotsLegendHeld} · ○ {copy.fx.dotsLegendNotHeld} · – {copy.fx.dotsLegendNoChange}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The two-line rebased chart (§9.3 Level 2 item 1)
 * ------------------------------------------------------------------ */

function RebasedChart({
  series,
  expect,
  copy,
  locale,
  numberLocale,
}: {
  series: readonly { id: string; points: number[] }[];
  expect: 'together' | 'opposite';
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  if (series.length < 2) return null;
  const PLOT_W = 320;
  const PLOT_H = 96;
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    for (const v of s.points) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    max = min + 1;
  }
  const pad = (max - min) * 0.05 || 1;
  min -= pad;
  max += pad;
  const maxLen = Math.max(...series.map((s) => s.points.length));
  const scaleY = (v: number): number => PLOT_H - ((v - min) / (max - min)) * PLOT_H;
  const scaleX = (i: number, len: number): number => (len <= 1 ? 0 : (i / (len - 1)) * PLOT_W);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  // Solid vs dashed + direct labels — never colour alone (§9.3/§9.7).
  const solid = series[0]!;
  const dashed = series[1]!;
  const path = (s: { points: number[] }): string =>
    s.points
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i, s.points.length).toFixed(2)} ${Math.max(1, Math.min(PLOT_H - 1, scaleY(v))).toFixed(2)}`)
      .join(' ');
  return (
    <figure className="m-0">
      <div dir="ltr" className="not-prose relative">
        <svg
          viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
          preserveAspectRatio="none"
          className="h-24 w-full"
          role="img"
          aria-label={copy.fx.chartAria}
        >
          <path d={path(solid)} fill="none" stroke="var(--color-text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path
            d={path(dashed)}
            fill="none"
            stroke="var(--color-text-primary)"
            strokeWidth="2"
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
            opacity="0.85"
          />
          {series.length > 2 ? (
            <path
              d={path(series[2]!)}
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
        {/* v1.3 (CR §4.8): the caption says what the relationship means. */}
        <span>{expect === 'together' ? copy.fx.chartCaptionTogether : copy.fx.chartCaptionOpposite}</span>
        <span>{copy.fx.chartStartsAt100}</span>
        {/* v1.3 (CR §4.7): plain names + the window's change at each line's
         * end — never a raw code (fix B4). */}
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-[var(--color-text-primary)]" />
          <bdi>{fxChartLineLabel(solid.id, solid.points, copy.fx, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[var(--color-text-primary)]" />
          <bdi>{fxChartLineLabel(dashed.id, dashed.points, copy.fx, numberLocale, locale)}</bdi>
        </span>
        <span className="sr-only">
          {interpolate(copy.fx.chartAria, {})}, {num(maxLen)} points
        </span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * One pattern card (§9.3 item 3): Level 1 row → Level 2 opened → Level 3
 * ------------------------------------------------------------------ */

function PatternCard({
  rule,
  snapshot,
  open,
  onToggle,
  copy,
  locale,
  numberLocale,
}: {
  rule: FxRuleState;
  snapshot: FxSnapshot;
  open: boolean;
  onToggle: (id: FxRuleState['id']) => void;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const [level3, setLevel3] = useState(false);
  const view = fxRuleView(rule);
  const sentence = fxSentence(rule, copy.fx, numberLocale);
  const ruleCopy = copy.fx.rules[fxRuleCopyKey(rule.id)];
  // v1.3 (CR §4.3): the Level-1 HEADLINE VERDICT — "Investors look nervous".
  const verdict = fxHeadlineVerdict(rule, copy.fx);
  // v1.3 (CR §4.3, fix B5): the alarm level in words replaces the raw
  // warning-line row; a context card (R7) carries none at all.
  const changeLine = fxChangeLine(rule, copy.fx, numberLocale);
  const statusWord =
    view.status === 'active' ? copy.fx.statusActive : view.status === 'watching' ? copy.fx.statusWatching : copy.fx.statusQuiet;
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  // §9.3: "Pairs used in this pattern" — the four periods for the pairs
  // this rule reads (from the chart series keys).
  const pairIds = fxRulePairIds(rule);
  const pairRow = (id: FxPairId): FxPairEntry | undefined => snapshot.pairs.find((p) => p.id === id);

  return (
    <div
      className={`rounded-[var(--radius-md)] bg-[var(--color-surface)] ring-1 ${
        view.chip === 'attention'
          ? 'ring-currena-warning/30'
          : view.chip === 'unusual'
            ? 'ring-currena-warning/40'
            : 'ring-[var(--color-border)]'
      } shadow-[0_2px_10px_rgba(15,23,42,0.05)]`}
    >
      {/* Level 1 — the collapsed row (§9.3): name, status, chip, the two-part sentence. */}
      <button
        type="button"
        id={`insights-fx-rule-${rule.id}`}
        aria-expanded={open}
        aria-controls={`insights-fx-rule-panel-${rule.id}`}
        onClick={() => onToggle(rule.id)}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-col gap-1 rounded-[var(--radius-md)] px-3 py-2.5 text-start transition-colors hover:bg-currena-soft/50"
      >
        <span className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {ruleCopy.name}
          </span>
          <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
            {statusWord}
          </span>
          {view.chip !== null ? (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
                view.chip === 'attention'
                  ? 'bg-currena-warning/15 text-[var(--color-status-alert)]'
                  : view.chip === 'unusual'
                    ? 'bg-currena-warning/10 text-[var(--color-status-watch)]'
                    : 'bg-currena-muted/15 text-[var(--color-text-secondary)]'
              }`}
            >
              {view.chip === 'attention' ? copy.fx.chipAttention : view.chip === 'unusual' ? copy.fx.chipUnusual : copy.fx.chipNormal}
            </span>
          ) : null}
          {rule.outcome === 'nodata' ? (
            <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.noDataRow}</span>
          ) : null}
        </span>
        {verdict !== null ? (
          <span className="text-[length:var(--type-label)] font-bold leading-relaxed text-[var(--color-text-primary)]">
            <bdi>{verdict}</bdi>
          </span>
        ) : null}
        {rule.outcome !== 'nodata' && sentence !== null ? (
          <span className="flex flex-col gap-0.5">
            {/* The two-part sentence on two short lines (§9.3 Level 1). */}
            <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
              <bdi>{sentence.see}</bdi>
            </span>
            <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
              <bdi>{sentence.means}</bdi>
            </span>
          </span>
        ) : null}
      </button>

      {/* Level 2 — the opened card (§9.3 + CR §4.3): chart, the alarm
       * level in words, and the 13 dots for rules WITH a pattern check. */}
      {open && rule.outcome !== 'nodata' ? (
        <div id={`insights-fx-rule-panel-${rule.id}`} className="flex flex-col gap-3 px-3 pb-3">
          {rule.chart.series.length >= 2 ? (
            <RebasedChart series={rule.chart.series} expect={rule.chart.expect} copy={copy} locale={locale} numberLocale={numberLocale} />
          ) : null}
          {changeLine !== null ? (
            <div>
              <p className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                {copy.fx.changeLineLabel}
              </p>
              <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                <bdi>{changeLine}</bdi>
              </p>
            </div>
          ) : null}
          {/* v1.3 fix B3: rules without a pattern check (R4, R7) show no
           * dots, no "Held in" line and no end labels. */}
          {fxRuleHasPatternCheck(rule.id) && rule.pattern.weeks.length > 0 ? (
            <Dots13 pattern={rule.pattern} copy={copy} numberLocale={numberLocale} />
          ) : null}
          {rule.confirmedBy.length > 0 ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
              <bdi>{copy.fx.rules.r1.confirmLine}</bdi>
            </p>
          ) : null}
          {rule.downgraded === true ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-alert)]">
              <bdi>{copy.fx.downgradeCaution}</bdi>
            </p>
          ) : null}

          {/* Level 3 — one tap deeper (§9.3 item 4): the three meaning lines + the pairs table. */}
          <button
            type="button"
            aria-expanded={level3}
            aria-controls={`insights-fx-rule-deep-${rule.id}`}
            onClick={() => setLevel3((v) => !v)}
            className="insights-focusable inline-flex min-h-[36px] w-fit cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
          >
            {copy.fx.level3Toggle}
            <span aria-hidden="true" className="ms-1">{level3 ? '▴' : '▾'}</span>
          </button>
          {level3 ? (
            <div id={`insights-fx-rule-deep-${rule.id}`} className="flex flex-col gap-2">
              <dl className="m-0 flex flex-col gap-1.5">
                {/* v1.3 (CR §4.3): Level 3 starts with "In everyday terms". */}
                <div>
                  <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
                    {copy.fx.everydayLabel}
                  </dt>
                  <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
                    <bdi>{'everyday' in ruleCopy ? ruleCopy.everyday : ''}</bdi>
                  </dd>
                </div>
                <div>
                  <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
                    {copy.fx.labelWhy}
                  </dt>
                  <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
                    <bdi>{ruleCopy.why}</bdi>
                  </dd>
                </div>
                <div>
                  <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
                    {copy.fx.labelSeenBefore}
                  </dt>
                  <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
                    <bdi>{'seenBefore' in ruleCopy ? ruleCopy.seenBefore : ''}</bdi>
                  </dd>
                </div>
                <div>
                  <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
                    {copy.fx.labelForYou}
                  </dt>
                  <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
                    <bdi>{'forYou' in ruleCopy ? ruleCopy.forYou : ''}</bdi>
                  </dd>
                </div>
              </dl>
              {pairIds.length > 0 ? (
                <div>
                  <p className="m-0 mb-1 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                    {copy.fx.pairsUsed}
                  </p>
                  <table className="w-full border-collapse text-[length:var(--type-caption)]">
                    <caption className="sr-only">{copy.fx.pairsUsed}</caption>
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th scope="col" className="py-1 text-start font-bold text-[var(--color-text-secondary)]">{copy.fx.thPair}</th>
                        <th scope="col" className="py-1 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thToday}</th>
                        <th scope="col" className="py-1 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thM1}</th>
                        <th scope="col" className="py-1 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thM3}</th>
                        <th scope="col" className="py-1 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thY1}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pairIds.map((id) => {
                        const row = pairRow(id);
                        if (row === undefined) return null;
                        return (
                          <tr key={id} className="border-b border-[var(--color-border)]/60 last:border-b-0">
                            <th scope="row" className="py-1 text-start font-semibold text-[var(--color-text-primary)]">
                              {copy.fx.entries[id].name}
                            </th>
                            <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(row.chg.d1, numberLocale, locale)}</bdi></td>
                            <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(row.chg.m1, numberLocale, locale)}</bdi></td>
                            <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(row.chg.m3, numberLocale, locale)}</bdi></td>
                            <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(row.chg.y1, numberLocale, locale)}</bdi></td>
                          </tr>
                        );
                      })}
                      {rule.id === 'r3_dollar_strength' || rule.id === 'r4_money_hiding' || rule.id === 'r7_dollar_or_euro' ? (
                        <tr className="border-t border-[var(--color-border)]/60">
                          <th scope="row" className="py-1 text-start font-semibold text-[var(--color-text-primary)]">
                            {copy.fx.dollarRowTitle}
                          </th>
                          <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(snapshot.dollarMeasure.chg.d1, numberLocale, locale)}</bdi></td>
                          <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(snapshot.dollarMeasure.chg.m1, numberLocale, locale)}</bdi></td>
                          <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(snapshot.dollarMeasure.chg.m3, numberLocale, locale)}</bdi></td>
                          <td className="py-1 text-end tabular-nums"><bdi dir="ltr">{signedPct(snapshot.dollarMeasure.chg.y1, numberLocale, locale)}</bdi></td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The quiet area (§9.3 item 4 + CR §4.4): the "Nearest to sounding the
 * alarm" row + the "{n} more quiet patterns" toggle (the closest pattern
 * is never repeated in the list — fix B6).
 * ------------------------------------------------------------------ */

function QuietArea({
  rules,
  copy,
  locale,
  numberLocale,
}: {
  rules: readonly FxRuleState[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const [open, setOpen] = useState(false);
  const closest = useMemo(() => fxClosestToWarning(rules), [rules]);
  // v1.3 fix B6: the list shows the OTHER quiet patterns only.
  const quiet = useMemo(() => fxQuietRules(rules, closest?.id), [rules, closest]);
  const closestView = useMemo(
    () => (closest !== null ? fxQuietView(closest, copy.fx, numberLocale) : null),
    [closest, copy, numberLocale],
  );
  const num = (n: number): string => formatNumber(Math.round(n), numberLocale, { maximumFractionDigits: 0 });
  if (quiet.length === 0 && closestView === null) return null;

  // One quiet row: line 1 (title · quiet headline), line 2 (the numbers in
  // words), and the bar with its label + text value — never bar-only (§9.7).
  const row = (view: FxQuietView, labelId: string): ReactElement => (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]">
        <bdi>{view.line1}</bdi>
      </p>
      {view.line2 !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{view.line2}</bdi>
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <span id={labelId} className="shrink-0 text-[0.66rem] font-semibold text-[var(--color-text-tertiary)]">
          {copy.fx.barLabel}
        </span>
        <span
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuenow={Math.round(view.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-currena-muted/20"
        >
          <span
            className="block h-full rounded-full bg-[var(--color-text-secondary)]"
            style={{ width: `${Math.max(2, Math.min(100, view.progress))}%` }}
          />
        </span>
        <bdi dir="ltr" className="shrink-0 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
          {num(view.progress)}{locale === 'fa' ? '٪' : '%'}
        </bdi>
      </div>
    </div>
  );

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
      {closestView !== null ? (
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
            {copy.fx.quietAreaTitle}
          </p>
          {row(closestView, 'insights-fx-closest-bar-label')}
        </div>
      ) : null}
      {quiet.length > 0 ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls="insights-fx-quiet-list"
          onClick={() => setOpen((v) => !v)}
          className="insights-focusable mt-2 inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
        >
          {interpolate(copy.fx.quietMore, { n: num(quiet.length) })}
          <span aria-hidden="true" className="ms-1">{open ? '▴' : '▾'}</span>
        </button>
      ) : null}
      {open ? (
        <ul id="insights-fx-quiet-list" className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0">
          {quiet.map((rule, i) => {
            const view = fxQuietView(rule, copy.fx, numberLocale);
            if (view === null) return null;
            return <li key={rule.id}>{row(view, `insights-fx-quiet-bar-label-${i}`)}</li>;
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dollar at a glance (§9.3 item 5) — one slim row
 * ------------------------------------------------------------------ */

function DollarRow({
  snapshot,
  copy,
  locale,
  numberLocale,
}: {
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const d = snapshot.dollarMeasure;
  // v1.3 (CR §4.9, fix B7): the meaning line FOLLOWS the direction — the
  // old fixed sentence was wrong whenever the dollar was weak or steady.
  const meaning = fxDollarMeaning(d.chg.m1, copy.fx);
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
      <p className="m-0 inline-flex flex-wrap items-baseline text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {copy.fx.dollarRowTitle}
        {/* v1.3 (CR §4.9): the row title carries its glossary tip. */}
        <GlossaryTip def={copy.fx.glossary.dollarStrength.def} srLabel={copy.fx.glossary.dollarStrength.term} />
      </p>
      <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
        <span className="inline-flex gap-1">
          <span>{copy.fx.thToday}</span>
          <bdi dir="ltr">{signedPct(d.chg.d1, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex gap-1">
          <span>{copy.fx.thM1}</span>
          <bdi dir="ltr">{signedPct(d.chg.m1, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex gap-1">
          <span>{copy.fx.thM3}</span>
          <bdi dir="ltr">{signedPct(d.chg.m3, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex gap-1">
          <span>{copy.fx.thY1}</span>
          <bdi dir="ltr">{signedPct(d.chg.y1, numberLocale, locale)}</bdi>
        </span>
      </span>
      <span className="w-full text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{meaning}</bdi>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The pairs table (§9.3 item 6) + the pair detail panel (§9.4)
 * ------------------------------------------------------------------ */

function PairDetail({
  entry,
  snapshot,
  copy,
  locale,
  numberLocale,
  onClose,
}: {
  entry: FxPairEntry;
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onClose: () => void;
}) {
  const entryCopy = copy.fx.entries[entry.id];
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  const num = (n: number, dp = 4): string => formatNumber(n, numberLocale, { maximumFractionDigits: dp });
  // v1.3 (CR §4.2 S5): the "what it means in money" line — the same line
  // in every pair's panel, using that pair's currencies.
  const moneyLine = useMemo(() => fxMoneyLine(entry, copy.fx, numberLocale), [entry, copy, numberLocale]);
  // §9.4: the patterns that use this pair, each linking back to its card.
  const usingRules = snapshot.rules.filter((r) => r.chart.series.some((s) => s.id === entry.id));
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <p className="m-0 mb-1 flex flex-wrap items-baseline justify-between gap-2 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        <span>{entryCopy.name}</span>
        <button
          type="button"
          onClick={onClose}
          className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
        >
          {copy.fx.hideTable}
        </button>
      </p>
      <dl className="m-0 mb-2 flex flex-col gap-1">
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailWhat}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{entryCopy.what}</bdi>
          </dd>
        </div>
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailYou}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{entryCopy.you}</bdi>
          </dd>
        </div>
        {moneyLine !== null ? (
          <div>
            <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
              {copy.fx.moneyLabel}
            </dt>
            <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
              <bdi>{moneyLine}</bdi>
            </dd>
          </div>
        ) : null}
      </dl>
      {/* §9.4/§9.6: the 1-year line chart, time left to right even in Farsi. */}
      <div dir="ltr" className="not-prose">
        <PairYearChart weekly={weekly} copy={copy} />
      </div>
      <dl className="m-0 mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.csvColRate}</dt>
          <dd className="m-0">
            <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
              {num(entry.rate)}
            </bdi>
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thToday}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.d1, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thM1}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thM3}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.m3, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thY1}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.y1, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dd className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(copy.fx.asOf, { date: formatAsOf(entry.asOf, locale) })}</bdi>
          </dd>
        </div>
      </dl>
      {usingRules.length > 0 ? (
        <p className="m-0 mt-2 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
          <bdi>
            {copy.fx.pairsUsed}: {usingRules.map((r) => copy.fx.rules[fxRuleCopyKey(r.id)].name).join(' · ')}
          </bdi>
        </p>
      ) : null}
    </div>
  );
}

/** §9.4's 1-year line chart — the house stretched-SVG pattern, zero deps. */
function PairYearChart({ weekly, copy }: { weekly: readonly [number, number][]; copy: InsightsCopy }) {
  if (weekly.length < 2) {
    return <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{copy.ui.na}</p>;
  }
  const PLOT_W = 320;
  const PLOT_H = 72;
  let min = Infinity;
  let max = -Infinity;
  for (const [, v] of weekly) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const pad = (max - min) * 0.05 || max * 0.001 || 1;
  min -= pad;
  max += pad;
  const firstDay = weekly[0]![0];
  const lastDay = weekly[weekly.length - 1]![0];
  const span = Math.max(1, lastDay - firstDay);
  const scaleY = (v: number): number => PLOT_H - ((v - min) / (max - min)) * PLOT_H;
  const scaleX = (day: number): number => ((day - firstDay) / span) * PLOT_W;
  const line = weekly
    .map(([day, v], i) => `${i === 0 ? 'M' : 'L'}${scaleX(day).toFixed(2)} ${Math.max(1, Math.min(PLOT_H - 1, scaleY(v))).toFixed(2)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: 72 }}
      role="img"
      aria-label={copy.fx.dollarChartAria}
    >
      <path d={line} fill="none" stroke="var(--color-text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function PairsTable({
  snapshot,
  copy,
  locale,
  numberLocale,
  todayIso,
  onOpenPair,
}: {
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  todayIso: string;
  onOpenPair: (id: FxPairId) => void;
}) {
  const rows = useMemo(() => fxPairRows(snapshot.pairs, 'group'), [snapshot.pairs]);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const trendWord = { up: copy.fx.trendUp, flat: copy.fx.trendFlat, down: copy.fx.trendDown } as const;
  const trendGlyph = { up: '▲', flat: '→', down: '▼' } as const;
  let lastGroup: string | null = null;

  return (
    <>
      {/* Desktop (≥900px): the real table (§9.7). */}
      <div className="hidden min-[900px]:block">
        {/* §9.3: the one-line legend under the header (v1.3 §4.6: the
         * stronger/weaker term carries its glossary tip). */}
        <p className="m-0 mb-1 flex flex-wrap items-baseline text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {copy.fx.directionLegend}
          <GlossaryTip def={copy.fx.glossary.stronger.def} srLabel={copy.fx.glossary.stronger.term} />
        </p>
        <table className="w-full border-collapse text-[length:var(--type-caption)]">
          <caption className="sr-only">{copy.fx.tableLabel}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">
                <span className="inline-flex items-baseline">
                  {copy.fx.thPair}
                  <GlossaryTip def={copy.fx.glossary.pair.def} srLabel={copy.fx.glossary.pair.term} />
                </span>
              </th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thToday}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thM1}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thM3}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thY1}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.fx.thTrend}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, group }) => {
              const groupHeader = group !== lastGroup ? copy.fx.groups[group] : null;
              lastGroup = group;
              const trend = fxTrendOf(entry);
              const old = isOld(entry, todayIso);
              return (
                <FragmentByKey key={entry.id} groupHeader={groupHeader} groupCount={rows.filter((r) => r.group === group).length}>
                  <tr
                    onClick={() => onOpenPair(entry.id)}
                    className="cursor-pointer border-b border-[var(--color-border)]/60 transition-colors last:border-b-0 hover:bg-currena-soft/50"
                  >
                    <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                      {copy.fx.entries[entry.id].name}
                      {entry.bigMove ? (
                        <span className="ms-1.5 inline-flex items-center rounded-full bg-currena-warning/10 px-2 py-0.5 text-[0.66rem] font-bold text-[var(--color-status-watch)]">
                          {copy.fx.bigMoveTag}
                        </span>
                      ) : null}
                      {old ? (
                        <span className="ms-1.5 inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--color-text-stale)]">
                          {interpolate(copy.fx.oldData, { date: formatAsOf(entry.asOf, locale) })}
                        </span>
                      ) : null}
                    </th>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.d1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.m3, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.y1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                      <span aria-hidden="true" className="me-1">{trendGlyph[trend]}</span>
                      {trendWord[trend]}
                    </td>
                  </tr>
                </FragmentByKey>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile (<900px): rows show the 1-month change; tapping shows the
       * detail panel with all four periods (§9.3 item 6). */}
      <ul className="m-0 grid list-none gap-1 p-0 min-[900px]:hidden">
        {rows.map(({ entry, group }) => {
          const groupHeader = copy.fx.groups[group];
          const showGroup = entry.id === rows.find((r) => r.group === group)!.entry.id;
          return (
            <li key={entry.id}>
              {showGroup ? (
                <p className="m-0 mb-0.5 mt-2 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                  {groupHeader}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => onOpenPair(entry.id)}
                className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-soft/50"
              >
                <span className="min-w-0 flex-1 font-semibold text-[var(--color-text-primary)]">
                  {copy.fx.entries[entry.id].name}
                </span>
                <span className="text-[length:var(--type-caption)] font-semibold tabular-nums">
                  <bdi dir="ltr">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="m-0 mt-2 text-[0.66rem] text-[var(--color-text-tertiary)]">
        {copy.fx.footerLine}
      </p>
    </>
  );
}

/** A tbody-safe group header row injector (keeps the <table> semantic). */
function FragmentByKey({
  children,
  groupHeader,
  groupCount,
}: {
  children: ReactElement;
  groupHeader: string | null;
  groupCount: number;
}) {
  if (groupHeader === null) return children;
  return (
    <>
      <tr className="border-b border-[var(--color-border)]/40">
        <th scope="colgroup" colSpan={6} className="px-2 py-1 text-start text-[0.7rem] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {groupHeader} ({groupCount})
        </th>
      </tr>
      {children}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The section
 * ------------------------------------------------------------------ */

export function WorldCurrencies({
  state,
  copy,
  locale,
  numberLocale,
}: {
  state: FxLoadState;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const [openRuleId, setOpenRuleId] = useState<FxRuleState['id'] | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [openPairId, setOpenPairId] = useState<FxPairId | null>(null);
  const todayIso = new Date().toISOString().slice(0, 10);

  const asOf = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const dates = state.snapshot.pairs.map((p) => p.asOf);
    dates.push(state.snapshot.dollarMeasure.asOf);
    return dates.reduce((max, d) => (d > max ? d : max), dates[0] ?? '');
  }, [state]);

  const patternRules = useMemo(() => (state.kind === 'ready' ? fxPatternOrder(state.snapshot.rules) : []), [state]);
  const hiddenPatterns = useMemo(() => {
    if (state.kind !== 'ready') return 0;
    const showing = new Set(fxPatternOrder(state.snapshot.rules).map((r) => r.id));
    return state.snapshot.rules.filter((r) => !showing.has(r.id) && r.outcome !== 'nodata' && r.outcome !== 'quiet').length;
  }, [state]);
  const hiddenNodata = useMemo(() => {
    if (state.kind !== 'ready') return 0;
    const showing = new Set(fxPatternOrder(state.snapshot.rules).map((r) => r.id));
    return state.snapshot.rules.filter((r) => !showing.has(r.id) && r.outcome === 'nodata').length;
  }, [state]);

  const onToggleRule = useCallback((id: FxRuleState['id']) => {
    setOpenRuleId((prev) => (prev === id ? null : id));
  }, []);

  const onOpenPair = useCallback((id: FxPairId) => {
    setOpenPairId((prev) => (prev === id ? null : id));
    requestAnimationFrame(() => {
      document.getElementById(`insights-fx-pair-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  // The mother container — the same soft field + hairline ring + quiet
  // shadow the markets section wears (one visual family, §9.10).
  const shell =
    'scroll-mt-24 flex flex-col gap-4 rounded-[var(--radius-lg)] bg-currena-soft/60 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.07)] ring-1 ring-[var(--color-border)] sm:gap-5 sm:p-6 dark:shadow-[0_14px_44px_rgba(0,0,0,0.4)]';

  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h2 id="insights-fx-title" className="type-section m-0">
          {copy.fx.title}
        </h2>
        {/* v1.3 (CR §4.5): "How to read this section" — a small button next
         * to the title, closed by default. */}
        <HowToRead copy={copy} />
      </div>
      {asOf ? (
        <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {interpolate(copy.fx.asOf, { date: formatDateShort(asOf, locale) })}
        </bdi>
      ) : null}
    </div>
  );

  if (state.kind === 'loading') {
    return (
      <section id="insights-fx" aria-labelledby="insights-fx-title" className={shell}>
        {heading}
        <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.fx.subtitle}</p>
        {/* §9.5 Loading: skeleton verdict line, two skeleton pattern rows,
         * the quiet row and the dollar row, with the table button in place. */}
        <Skeleton className="h-6 w-2/3 rounded-full" />
        <Skeleton className="h-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-14 rounded-[var(--radius-md)]" />
        <Skeleton className="h-12 rounded-[var(--radius-md)]" />
      </section>
    );
  }

  if (state.kind === 'empty') {
    return (
      <section id="insights-fx" aria-labelledby="insights-fx-title" className={shell}>
        {heading}
        <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.fx.subtitle}</p>
        {/* §9.5 Never populated: ONE calm line — no zeros, no empty tables. */}
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.fx.empty}
        </p>
      </section>
    );
  }

  const snapshot = state.snapshot;

  // §9.5 Everything stale (>5 days): the section collapses to one line.
  const everythingOld =
    snapshot.pairs.length > 0 &&
    snapshot.pairs.every((p) => isOld(p, todayIso)) &&
    isOld(snapshot.dollarMeasure, todayIso);
  if (everythingOld) {
    return (
      <section id="insights-fx" aria-labelledby="insights-fx-title" className={shell}>
        {heading}
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {interpolate(copy.fx.collapsedStale, {
            date: formatDateShort(snapshot.generatedAt.slice(0, 10), locale),
          })}
        </p>
      </section>
    );
  }

  const { summary } = snapshot;
  const measureKey = fxMeasureKey(summary.signal);
  const openPair = openPairId !== null ? snapshot.pairs.find((p) => p.id === openPairId) : undefined;

  return (
    <section id="insights-fx" aria-labelledby="insights-fx-title" className={shell}>
      {heading}
      <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.fx.subtitle}</p>

      {/* The verdict line (§9.3 item 2): the §9.10 measure label + the
       * page's severity chip + one short headline sentence (§10.3). No
       * chips naming the patterns — the cards below already do. */}
      <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
        <SectionVerdictLine
          label={copy.fx[measureKey]}
          chip={summary.signal === 'normal' ? null : summary.signal}
          copy={copy}
        />
        <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{fxHeadline(snapshot, copy.fx, numberLocale)}</bdi>
        </p>
      </div>

      {/* v1.3 (CR §4.2): the "In plain words" block, directly under the
       * verdict line — this is what most visitors read. */}
      <PlainWords snapshot={snapshot} copy={copy} numberLocale={numberLocale} />

      {/* The pattern cards (§9.3 item 3) — at most 3, the first open at
       * Level 2 only (the spec's "only the first card is open by default"):
       * the first CARD opens when the visitor has not picked one yet. */}
      <div className="flex flex-col gap-2">
        {/* §9.3: only the FIRST card opens by default (Level 2 only); the
           * visitor's own pick always wins. */}
        {patternRules.map((rule) => (
          <PatternCard
            key={rule.id}
            rule={rule}
            snapshot={snapshot}
            open={rule.id === (openRuleId ?? patternRules[0]?.id)}
            onToggle={onToggleRule}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
          />
        ))}
        {hiddenPatterns > 0 ? (
          <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {interpolate(copy.fx.morePatterns, {
              n: formatNumber(hiddenPatterns + hiddenNodata, numberLocale, { maximumFractionDigits: 0 }),
            })}
          </p>
        ) : null}
      </div>

      {/* The quiet area (§9.3 item 4) — never empty on a calm day. */}
      <QuietArea rules={snapshot.rules} copy={copy} locale={locale} numberLocale={numberLocale} />

      {/* Dollar at a glance (§9.3 item 5). */}
      <DollarRow snapshot={snapshot} copy={copy} locale={locale} numberLocale={numberLocale} />

      {/* The pair detail panel (§9.4) — one at a time, above the table. */}
      {openPair !== undefined ? (
        <div id={`insights-fx-pair-${openPair.id}`}>
          <PairDetail
            entry={openPair}
            snapshot={snapshot}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onClose={() => setOpenPairId(null)}
          />
        </div>
      ) : null}

      {/* "Show all currency pairs" (§9.3 item 6, closed by default). */}
      <div>
        <button
          type="button"
          aria-expanded={tableOpen}
          aria-controls="insights-fx-table"
          onClick={() => setTableOpen((v) => !v)}
          className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
        >
          {tableOpen ? copy.fx.hideTable : copy.fx.showTable}
          <span aria-hidden="true" className="ms-1">{tableOpen ? '▴' : '▾'}</span>
        </button>
        {tableOpen ? (
          <div id="insights-fx-table" className="mt-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 ring-1 ring-[var(--color-border)] sm:p-3">
            <PairsTable
              snapshot={snapshot}
              copy={copy}
              locale={locale}
              numberLocale={numberLocale}
              todayIso={todayIso}
              onOpenPair={onOpenPair}
            />
          </div>
        ) : null}
      </div>

      {/* The footer line (§9.3 item 7) — the shared page disclaimer stays
       * in the page footer (About this data). */}
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <bdi>{copy.fx.footerLine}</bdi>
      </p>
    </section>
  );
}
