/**
 * One pattern card (§9.3 item 3): Level 1 collapsed row → Level 2 opened →
 * Level 3 one tap deeper (Phase 3-d split of the former WorldCurrencies.tsx
 * monolith — see the slim section shell ../WorldCurrencies.tsx).
 */

import { useState } from 'react';
import type { FxPairEntry, FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import { fxRuleHasPatternCheck } from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import {
  fxChangeLine,
  fxHeadlineVerdict,
  fxRuleCopyKey,
  fxRulePairIds,
  fxRuleView,
  fxSentence,
} from '../../../lib/fx-presentation';
import { signedPct } from './display';
import { Dots13, RebasedChart } from './PatternVisuals';
import { Layer1Block } from '../layer1/Layer1Block';

/* ------------------------------------------------------------------ *
 * One pattern card (§9.3 item 3): Level 1 row → Level 2 opened → Level 3
 * ------------------------------------------------------------------ */

export function PatternCard({
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

          {/* Layer 1 — the plain-language block for this pattern card (spec
           * §6, DECISIONS D-17/D-09): oneLine lead + skipReason + the
           * "no direction" note (ifRising/ifFalling are null — a pattern
           * describes a relationship, not a level) + connections (the
           * legs + related cards) + the glossary list. Renders nothing
           * until the pattern's Layer-1 copy exists (graceful roll-out). */}
          <Layer1Block id={rule.id} locale={locale} copy={copy} />

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
