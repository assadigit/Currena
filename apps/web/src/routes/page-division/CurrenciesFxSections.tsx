/**
 * CurrenciesFxSections — the Currencies page's fx-feed drawing (page-
 * division S18, 2026-11-12 — spec §12 items 1–2; D-41/D-42): the 7 rule
 * lights hero + the 11-pair board.
 *
 *   - The hero (§12 item 1, D-41 — rules first): the fx snapshot's own
 *     `summary` (the §9.10 measure label + the page's severity chip) +
 *     the 7 rules R1–R7, each rendered through fx-presentation's
 *     `fxRuleView` — the SAME §9.3 status table the legacy /insights
 *     section renders through (Active / Watching / Quiet + the
 *     Normal / Needs attention / Unusual chips, V1: nothing invented) —
 *     with the corpus's own plain-language explanation (ruleEveryday).
 *     The stored outcome/variant is the display's whole truth: the page
 *     NEVER re-derives a rule (the KV logic exactly).
 *   - The board (§12 item 2, D-42 — the 11 pairs incl. AUDNZD): the
 *     rows arrive through fx-presentation's `fxPairRows` (the SAME row
 *     builder the legacy table renders through — group blocks in spec
 *     order), each pair showing its STORED fields: the rate, the d1/m1/
 *     m3/y1 changes, the moveRank 0–100, the bigMove flag and the
 *     52-week closes (decoded + drawn as the house stretched-SVG line,
 *     time always left to right, §9.6).
 *
 * The drawing owns its own feed states (the S16 AustraliaBoardSection
 * discipline): loading (the honest loading line), empty (the calm "being
 * prepared" line — the corpus's own fx.empty) and ready (fresh or the
 * M-17 last-good copy from localStorage, labelled). A dead projection
 * never takes these sections away, and a dead fx feed never takes the
 * registry cards away — each feed governs its own surface.
 *
 * Platform: browser only — this module lives in the lazy Currencies
 * route chunk, never the entry graph.
 */

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import type { FxPairEntry, FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import { decodeWeeklySeries } from '@currena/insights/markets/definitions';
import type { FxGroupId } from '@currena/insights/fx/definitions';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { fxMeasureKey, fxPairRows, fxRuleView } from '../../lib/fx-presentation';
import { formatDateShort, isOld, signedPct } from '../../components/insights/world-currencies/display';
import { CURRENCIES_RULE_IDS, currenciesRuleCopyKey, type CurrenciesRuleCopyKey } from './currencies-tiles';
import type { TranslationKey } from '../../lib/locale';

/* ------------------------------------------------------------------ *
 * The fx feed's load state (the S16 useAuMarketsBoard shape)
 * ------------------------------------------------------------------ */

export type FxBoardLoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: FxSnapshot; fromCache: boolean };

/** The feed's own as-of date — the newest of the pairs' and the dollar
 *  measure's own dates (the WorldCurrencies container's own join). */
function fxAsOf(snapshot: FxSnapshot): string {
  const dates = snapshot.pairs.map((p) => p.asOf);
  dates.push(snapshot.dollarMeasure.asOf);
  return dates.reduce((max, d) => (d > max ? d : max), dates[0] ?? '');
}

/* ------------------------------------------------------------------ *
 * The hero — the 7 rule lights (§12 item 1, D-41)
 * ------------------------------------------------------------------ */

/** The status word keys (the corpus's own, pinned by the copy-pin test). */
const RULE_STATUS_KEY: Readonly<Record<'active' | 'watching' | 'quiet', TranslationKey>> = {
  active: 'pd.currencies.statusActive',
  watching: 'pd.currencies.statusWatching',
  quiet: 'pd.currencies.statusQuiet',
};

/** The chip word keys (the page's own severity chips, §9.3). */
const RULE_CHIP_KEY: Readonly<Record<'normal' | 'attention' | 'unusual', TranslationKey>> = {
  normal: 'pd.currencies.chipNormal',
  attention: 'pd.currencies.chipAttention',
  unusual: 'pd.currencies.chipUnusual',
};

/** The rule-name + everyday-explanation keys (the corpus's own, pinned). */
const RULE_NAME_KEY: Readonly<Record<CurrenciesRuleCopyKey, TranslationKey>> = {
  r1: 'pd.currencies.ruleNames.r1',
  r2: 'pd.currencies.ruleNames.r2',
  r3: 'pd.currencies.ruleNames.r3',
  r4: 'pd.currencies.ruleNames.r4',
  r5: 'pd.currencies.ruleNames.r5',
  r6: 'pd.currencies.ruleNames.r6',
  r7: 'pd.currencies.ruleNames.r7',
};

const RULE_EVERYDAY_KEY: Readonly<Record<CurrenciesRuleCopyKey, TranslationKey>> = {
  r1: 'pd.currencies.ruleEveryday.r1',
  r2: 'pd.currencies.ruleEveryday.r2',
  r3: 'pd.currencies.ruleEveryday.r3',
  r4: 'pd.currencies.ruleEveryday.r4',
  r5: 'pd.currencies.ruleEveryday.r5',
  r6: 'pd.currencies.ruleEveryday.r6',
  r7: 'pd.currencies.ruleEveryday.r7',
};

/** The measure-label keys (§9.10 — fx-presentation's fxMeasureKey picks). */
const MEASURE_KEY: Readonly<Record<'measureNormal' | 'measureAttention' | 'measureUnusual', TranslationKey>> = {
  measureNormal: 'pd.currencies.measureNormal',
  measureAttention: 'pd.currencies.measureAttention',
  measureUnusual: 'pd.currencies.measureUnusual',
};

/** One rule light: the stored outcome through fxRuleView (the KV logic
 *  exactly — never a re-derivation) + the corpus's own explanation. */
function RuleLight({ rule }: { rule: FxRuleState }): React.JSX.Element {
  const { t } = useI18n();
  const view = fxRuleView(rule);
  const key = currenciesRuleCopyKey(rule.id);
  const statusWord = t(RULE_STATUS_KEY[view.status]);
  return (
    <article
      data-currencies-rule={rule.id}
      data-currencies-rule-outcome={rule.outcome}
      className={`flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ${
        view.chip === 'attention'
          ? 'ring-currena-warning/30'
          : view.chip === 'unusual'
            ? 'ring-currena-warning/40'
            : 'ring-[var(--color-border)]'
      } shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3`}
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
        {t(RULE_NAME_KEY[key])}
      </h4>
      <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] font-semibold leading-tight">
        <span data-currencies-rule-status={view.status}>{statusWord}</span>
        {view.chip !== null ? (
          <span
            data-currencies-rule-chip={view.chip}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
              view.chip === 'attention'
                ? 'bg-currena-warning/15 text-[var(--color-status-alert)]'
                : view.chip === 'unusual'
                  ? 'bg-currena-warning/10 text-[var(--color-status-watch)]'
                  : 'bg-currena-muted/15 text-[var(--color-text-secondary)]'
            }`}
          >
            {t(RULE_CHIP_KEY[view.chip])}
          </span>
        ) : null}
      </p>
      {rule.outcome === 'nodata' ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.currencies.noDataRule')}</p>
      ) : null}
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{t(RULE_EVERYDAY_KEY[key])}</bdi>
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The board — the 11 pairs (§12 item 2, D-42)
 * ------------------------------------------------------------------ */

/** The pair-name keys (the corpus's own fx entries, pinned). */
const PAIR_NAME_KEY: Readonly<Record<FxPairId, TranslationKey>> = {
  eurusd: 'pd.currencies.pairNames.eurusd',
  usdjpy: 'pd.currencies.pairNames.usdjpy',
  gbpusd: 'pd.currencies.pairNames.gbpusd',
  usdchf: 'pd.currencies.pairNames.usdchf',
  usdcny: 'pd.currencies.pairNames.usdcny',
  audusd: 'pd.currencies.pairNames.audusd',
  audjpy: 'pd.currencies.pairNames.audjpy',
  eurjpy: 'pd.currencies.pairNames.eurjpy',
  eurchf: 'pd.currencies.pairNames.eurchf',
  audcny: 'pd.currencies.pairNames.audcny',
  audnzd: 'pd.currencies.pairNames.audnzd',
};

/** The board group-label keys (the corpus's own, pinned). */
const GROUP_KEY: Readonly<Record<FxGroupId, TranslationKey>> = {
  dollarWorld: 'pd.currencies.groups.dollarWorld',
  warningLights: 'pd.currencies.groups.warningLights',
  chinaLink: 'pd.currencies.groups.chinaLink',
  auLink: 'pd.currencies.groups.auLink',
};

/** The 52-week closes as the house stretched-SVG line (the legacy
 *  PairYearChart pattern: rebased window, non-scaling stroke, time always
 *  left to right even in Farsi — §9.6). */
function PairSparkline({ entry }: { entry: FxPairEntry }): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  if (weekly.length < 2) return null;
  const PLOT_W = 120;
  const PLOT_H = 28;
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
  const name = t(PAIR_NAME_KEY[entry.id]);
  return (
    // §9.6: time always runs LEFT TO RIGHT inside charts, even in Farsi —
    // the wrapper carries dir="ltr" (the svg element takes no dir prop).
    <span dir="ltr" className="block">
      <svg
        viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
        preserveAspectRatio="none"
        className="w-full min-w-[72px]"
        style={{ height: 28 }}
        role="img"
        aria-label={`${name} — ${t('pd.currencies.th52w')} (${formatNumber(weekly.length, numberLocale, { maximumFractionDigits: 0 })})`}
        data-currencies-spark={entry.id}
      >
        <path d={line} fill="none" stroke="var(--color-text-primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

/** One pair's tags: the bigMove flag (§6.2) + the honest old-data chip
 *  (client-side V6 — the same isOld the legacy table uses). */
function PairTags({ entry, todayIso }: { entry: FxPairEntry; todayIso: string }): React.JSX.Element | null {
  const { t, locale } = useI18n();
  const old = isOld(entry, todayIso);
  if (!entry.bigMove && !old) return null;
  return (
    <span className="ms-1.5 inline-flex flex-wrap items-baseline gap-1">
      {entry.bigMove ? (
        <span data-currencies-big-move={entry.id} className="inline-flex items-center rounded-full bg-currena-warning/10 px-2 py-0.5 text-[0.66rem] font-bold text-[var(--color-status-watch)]">
          {t('pd.currencies.bigMoveTag')}
        </span>
      ) : null}
      {old ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--color-text-stale)]">
          {interpolate(t('pd.currencies.oldData'), { date: formatDateShort(entry.asOf, locale) })}
        </span>
      ) : null}
    </span>
  );
}

/** The pair's rate text — the legacy detail panel's own join (up to 4
 *  decimals, a 2-decimal floor: '1.0842' · '157.95'). */
function pairRateText(entry: FxPairEntry, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(entry.rate, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** The move-rank text — a whole number 0–100 (§6.2). */
function moveRankText(entry: FxPairEntry, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.round(entry.moveRank), numberLocale, { maximumFractionDigits: 0 });
}

/** The mobile board (<900px): every pair's full spec fields on one card —
 *  the rate + the four changes + the move rank + the 52-week closes (all
 *  the §12 item 2 fields, honestly, no detail panel needed). */
function PairCardMobile({ entry, todayIso }: { entry: FxPairEntry; todayIso: string }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  return (
    <article
      data-currencies-pair={entry.id}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
        {t(PAIR_NAME_KEY[entry.id])}
        <PairTags entry={entry} todayIso={todayIso} />
      </h4>
      <bdi dir="ltr" className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-currencies-rate={entry.id}>
        {pairRateText(entry, numberLocale)}
      </bdi>
      <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[length:var(--type-caption)]">
        <div className="flex items-baseline justify-between gap-1.5">
          <dt className="text-[var(--color-text-tertiary)]">{t('pd.currencies.thToday')}</dt>
          <dd className="m-0 font-semibold tabular-nums">
            <bdi dir="ltr">{signedPct(entry.chg.d1, numberLocale, locale)}</bdi>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-1.5">
          <dt className="text-[var(--color-text-tertiary)]">{t('pd.currencies.thM1')}</dt>
          <dd className="m-0 font-semibold tabular-nums">
            <bdi dir="ltr">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-1.5">
          <dt className="text-[var(--color-text-tertiary)]">{t('pd.currencies.thM3')}</dt>
          <dd className="m-0 font-semibold tabular-nums">
            <bdi dir="ltr">{signedPct(entry.chg.m3, numberLocale, locale)}</bdi>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-1.5">
          <dt className="text-[var(--color-text-tertiary)]">{t('pd.currencies.thY1')}</dt>
          <dd className="m-0 font-semibold tabular-nums">
            <bdi dir="ltr">{signedPct(entry.chg.y1, numberLocale, locale)}</bdi>
          </dd>
        </div>
        <div className="col-span-2 flex items-baseline justify-between gap-1.5">
          <dt className="text-[var(--color-text-tertiary)]">{t('pd.currencies.thMoveRank')}</dt>
          <dd className="m-0 font-semibold tabular-nums" data-currencies-move-rank={entry.id}>
            <bdi dir="ltr">{moveRankText(entry, numberLocale)}</bdi>
          </dd>
        </div>
      </dl>
      <PairSparkline entry={entry} />
    </article>
  );
}

/** A tbody-safe group header row injector (keeps the <table> semantic —
 *  the legacy PairsTable's FragmentByKey, restated lean). */
function FragmentOrGroup({
  children,
  groupHeader,
  groupCount,
}: {
  children: ReactElement;
  groupHeader: string | null;
  groupCount: number;
}): ReactElement {
  if (groupHeader === null) return children;
  return (
    <>
      <tr className="border-b border-[var(--color-border)]/40">
        <th scope="colgroup" colSpan={8} className="px-2 py-1 text-start text-[0.7rem] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {groupHeader} ({groupCount})
        </th>
      </tr>
      {children}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The sections
 * ------------------------------------------------------------------ */

export function CurrenciesFxSections({ state }: { state: FxBoardLoadState }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const todayIso = new Date().toISOString().slice(0, 10);

  /* ---- The hero's body (§12 item 1) — own feed, own states ---- */
  const heroBody = (() => {
    if (state.kind === 'loading') {
      return (
        <div className="flex w-full flex-col items-center gap-3 py-8" role="status">
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.currencies.loadingLine')}</p>
          <span className="flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
      );
    }
    if (state.kind === 'empty') {
      return (
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]" data-currencies-board-empty>
          <bdi>{t('pd.currencies.boardEmpty')}</bdi>
        </p>
      );
    }
    const snapshot = state.snapshot;
    const asOfText = locale === 'fa' ? formatJalaliDate(fxAsOf(snapshot), 'fa-IR') : formatDateWords(fxAsOf(snapshot), 'en-US');
    const rulesById = new Map(snapshot.rules.map((r) => [r.id as string, r]));
    return (
      <>
        <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:text-[length:var(--type-caption)]">
          {state.fromCache ? (
            <bdi className="text-[var(--color-text-tertiary)]" data-currencies-fx-cached>
              {interpolate(t('pd.global.fromCache'), { date: asOfText })}
            </bdi>
          ) : (
            <bdi>{interpolate(t('pd.global.dataAsOf'), { date: asOfText })}</bdi>
          )}
        </p>
        {/* The measure line (§9.3 item 2's hero twin): the §9.10 measure
         * label + the page's severity chip (only when not Normal — the
         * SectionVerdictLine discipline, restated lean; an active signal
         * turns the box into the section's ALARM, the 2026-10-29 owner
         * round). */}
        <div
          className={`relative mt-1 flex flex-col gap-1 overflow-hidden rounded-[var(--radius-md)] p-3.5 ring-1 shadow-[0_2px_10px_rgba(15,23,42,0.05)] ${
            snapshot.summary.signal === 'attention' || snapshot.summary.signal === 'unusual'
              ? 'bg-currena-warning/[0.09] ring-currena-warning/45'
              : 'bg-[var(--color-surface)] ring-[var(--color-border)]'
          }`}
          data-currencies-measure
          data-currencies-signal={snapshot.summary.signal}
        >
          {(snapshot.summary.signal === 'attention' || snapshot.summary.signal === 'unusual') && (
            <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-[var(--color-status-alert)]" />
          )}
          <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <bdi className="text-[length:var(--type-label)] font-extrabold text-[var(--color-text-primary)]">{t(MEASURE_KEY[fxMeasureKey(snapshot.summary.signal)])}</bdi>
            {snapshot.summary.signal !== 'normal' ? (
              <span
                data-currencies-measure-chip={snapshot.summary.signal}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${
                  snapshot.summary.signal === 'unusual'
                    ? 'bg-currena-warning/10 text-[var(--color-status-watch)]'
                    : 'bg-currena-warning/15 text-[var(--color-status-alert)]'
                }`}
              >
                {snapshot.summary.signal === 'unusual' ? t('pd.currencies.chipUnusual') : t('pd.currencies.chipAttention')}
              </span>
            ) : null}
          </p>
        </div>
        {/* The 7 rule lights — engine order (CURRENCIES_RULE_IDS ≡
         * FX_RULES), the stored outcomes through fxRuleView. */}
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
          {CURRENCIES_RULE_IDS.map((id) => {
            const rule = rulesById.get(id);
            if (rule === undefined) return null; // never-populated row: absent, never a guess
            return <RuleLight key={id} rule={rule} />;
          })}
        </div>
      </>
    );
  })();

  /* ---- The board's body (§12 item 2) — own feed, own states ---- */
  const boardBody = (() => {
    if (state.kind !== 'ready') return null;
    const snapshot = state.snapshot;
    const rows = fxPairRows(snapshot.pairs, 'group');
    // The group blocks in row order (the mobile list's own structure).
    const groupsInOrder: FxGroupId[] = [];
    for (const { group } of rows) {
      if (!groupsInOrder.includes(group)) groupsInOrder.push(group);
    }
    // The first row of each group block (precomputed — the WS-5 discipline).
    const firstOfGroup = new Set<string>();
    let prev: string | null = null;
    for (const { entry, group } of rows) {
      if (group !== prev) firstOfGroup.add(entry.id);
      prev = group;
    }
    const groupCount = (group: FxGroupId): number => rows.filter((r) => r.group === group).length;
    return (
      <>
        {/* Desktop (≥900px): the real table (§9.7) — the 8 spec columns. */}
        <div className="hidden min-[900px]:block">
          <table className="w-full border-collapse text-[length:var(--type-caption)]" data-currencies-table>
            <caption className="sr-only">{t('pd.currencies.boardTitle')}</caption>
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thPair')}</th>
                <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thRate')}</th>
                <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thToday')}</th>
                <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thM1')}</th>
                <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thM3')}</th>
                <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thY1')}</th>
                <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.thMoveRank')}</th>
                <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{t('pd.currencies.th52w')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, group }) => (
                <FragmentOrGroup key={entry.id} groupHeader={firstOfGroup.has(entry.id) ? t(GROUP_KEY[group]) : null} groupCount={groupCount(group)}>
                  <tr className="border-b border-[var(--color-border)]/60 transition-colors last:border-b-0 hover:bg-currena-soft/50">
                    <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                      {t(PAIR_NAME_KEY[entry.id])}
                      <PairTags entry={entry} todayIso={todayIso} />
                    </th>
                    <td className="px-2 py-1.5 text-end tabular-nums">
                      <bdi dir="ltr" className="font-semibold" data-currencies-rate={entry.id}>
                        {pairRateText(entry, numberLocale)}
                      </bdi>
                    </td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.d1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.m3, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.y1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums">
                      <bdi dir="ltr" className="font-semibold" data-currencies-move-rank={entry.id}>
                        {moveRankText(entry, numberLocale)}
                      </bdi>
                    </td>
                    <td className="w-[128px] px-2 py-1.5">
                      <PairSparkline entry={entry} />
                    </td>
                  </tr>
                </FragmentOrGroup>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile (<900px): every pair's full spec fields on one card. */}
        <div className="flex flex-col gap-2 min-[900px]:hidden">
          {groupsInOrder.map((group, gi) => (
            <div key={group} className={`flex flex-col gap-2 ${gi === 0 ? '' : 'mt-2'}`}>
              <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">{t(GROUP_KEY[group])}</p>
              {rows
                .filter((r) => r.group === group)
                .map(({ entry }) => (
                  <PairCardMobile key={entry.id} entry={entry} todayIso={todayIso} />
                ))}
            </div>
          ))}
        </div>
        {/* The board's source + honesty note (the corpus's own footer
         * line — §21 "source & licence badges visible"). */}
        <p className="m-0 mt-2 text-[0.66rem] text-[var(--color-text-tertiary)]">
          <bdi>{t('pd.currencies.boardSourceLine')}</bdi>
        </p>
      </>
    );
  })();

  return (
    <>
      <section aria-label={t('pd.currencies.heroTitle')} data-currencies-section="hero" className="mt-3 scroll-mt-24 sm:mt-5">
        <div className="mb-1.5 sm:mb-2">
          <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.currencies.heroTitle')}</h2>
          <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.currencies.heroIntro')}</p>
        </div>
        {heroBody}
      </section>
      <section aria-label={t('pd.currencies.boardTitle')} data-currencies-section="board" className="mt-3 scroll-mt-24 sm:mt-5">
        <div className="mb-1.5 sm:mb-2">
          <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.currencies.boardTitle')}</h2>
          <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.currencies.boardIntro')}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 ring-1 ring-[var(--color-border)] sm:p-3">
          {boardBody ??
            (state.kind === 'loading' ? (
              <p className="m-0 px-2 py-4 text-[length:var(--type-label)] text-[var(--color-text-secondary)]" role="status">
                {t('pd.currencies.loadingLine')}
              </p>
            ) : (
              <p className="m-0 px-2 py-4 text-[length:var(--type-label)] text-[var(--color-text-secondary)]" data-currencies-board-empty>
                <bdi>{t('pd.currencies.boardEmpty')}</bdi>
              </p>
            ))}
        </div>
      </section>
    </>
  );
}
