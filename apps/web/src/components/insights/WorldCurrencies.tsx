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
 *
 * Since the Phase 3-d split this file is the SLIM SECTION SHELL: it owns
 * the FxLoadState feed type, the section-level disclosure state and the
 * all-states layout. The blocks live in ./world-currencies/ — the pure
 * display helpers (display.ts), the shared GlossaryTip, the reading aids
 * (HowToRead + PlainWords), the pattern card with its Level-2 visuals,
 * the quiet area, the dollar row, and the pairs table with the pair
 * detail panel. Composition order is unchanged.
 */

import { useCallback, useMemo, useState } from 'react';
import { formatNumber } from '@currena/core';
import type { FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { Skeleton } from '../ui';
import { fxHeadline, fxMeasureKey, fxPatternOrder } from '../../lib/fx-presentation';
import { SectionVerdictLine } from './SectionVerdictLine';
import { DollarRow } from './world-currencies/DollarRow';
import { HowToRead, PlainWords } from './world-currencies/ReadingAids';
import { PairDetail, PairsTable } from './world-currencies/PairsTable';
import { PatternCard } from './world-currencies/PatternCard';
import { QuietArea } from './world-currencies/QuietArea';
import { formatDateShort, isOld } from './world-currencies/display';

/** The page-level feed state (owned by Insights.tsx, passed down). */
export type FxLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: FxSnapshot };

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
