/**
 * fx-presentation/pairs — the pairs table (§9.3 item 6) and the pair-level
 * chart/money labels: the spec-order row builder, the trend column, the
 * chart line's end label (CR §4.7) and the S5 "what it means in money"
 * line (CR §4.2) (Phase: WS-4 module split of the former
 * fx-presentation.ts monolith — zero behavior change, code moved
 * verbatim). PAIR_CURRENCIES is the presentation's own pair→currencies
 * map — the headline's mover sentence imports it too.
 */

import type { FxPairEntry, FxPairId, FxRuleState } from '@currena/core';
import type { FxCurrency } from '@currena/core';
import { FX_GROUP_ORDER, FX_PAIRS } from '@currena/insights/fx/definitions';
import type { FxGroupId } from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { fxSignedPct, whole0 } from './format';

/** {first, second} currency codes of a pair (presentation's own map). */
export const PAIR_CURRENCIES: Record<FxPairId, readonly [FxCurrency | 'USD', FxCurrency | 'USD']> = {
  eurusd: ['EUR', 'USD'],
  usdjpy: ['USD', 'JPY'],
  gbpusd: ['GBP', 'USD'],
  usdchf: ['USD', 'CHF'],
  usdcny: ['USD', 'CNY'],
  audusd: ['AUD', 'USD'],
  audjpy: ['AUD', 'JPY'],
  eurjpy: ['EUR', 'JPY'],
  eurchf: ['EUR', 'CHF'],
  audcny: ['AUD', 'CNY'],
};

export interface FxPairRow {
  entry: FxPairEntry;
  group: FxGroupId;
  /** The §6.2 tag rides only when bigMove is true. */
  bigMove: boolean;
}

/** The table's rows in spec order (group blocks), or sorted by the size of
 * the 1-month move (§9.3: "One sort only: by the size of the 1-month
 * move"). */
export function fxPairRows(pairs: readonly FxPairEntry[], sort: 'group' | 'm1' = 'group'): FxPairRow[] {
  const byId = new Map(pairs.map((p) => [p.id as string, p]));
  const rows: FxPairRow[] = [];
  for (const group of FX_GROUP_ORDER) {
    for (const def of FX_PAIRS.filter((p) => p.group === group)) {
      const entry = byId.get(def.id);
      if (entry === undefined) continue; // never-populated row: absent, never zero
      rows.push({ entry, group, bigMove: entry.bigMove });
    }
  }
  if (sort === 'm1') {
    rows.sort((a, b) => Math.abs(b.entry.chg.m1) - Math.abs(a.entry.chg.m1));
  }
  return rows;
}

/** The pair ids one rule uses (§9.3 Level 3: "Pairs used in this pattern")
 * — from the rule's chart series keys, mapped back to pair rows. */
export function fxRulePairIds(rule: FxRuleState): FxPairId[] {
  const ids: FxPairId[] = [];
  for (const key of ['eurusd', 'usdjpy', 'gbpusd', 'usdchf', 'usdcny', 'audusd', 'audjpy', 'eurjpy', 'eurchf', 'audcny'] as FxPairId[]) {
    // A pair rides the rule's Level-3 table when it appears in the chart
    // series or the legs (the numbers the sentence used).
    if (rule.chart.series.some((s) => s.id === key)) ids.push(key);
  }
  return ids;
}

/** The Trend column (§9.3): the weekly closes' own direction — the last
 * weekly close vs the one ~4 weeks back (up > +0.5%, down < −0.5%). */
export function fxTrendOf(entry: FxPairEntry): 'up' | 'flat' | 'down' {
  const w = entry.weekly;
  if (w.length < 2) return 'flat';
  const last = w[w.length - 1]![1];
  const backIdx = Math.max(0, w.length - 5);
  const back = w[backIdx]![1];
  if (back <= 0) return 'flat';
  const pct = ((last - back) / back) * 100;
  if (pct > 0.5) return 'up';
  if (pct < -0.5) return 'down';
  return 'flat';
}

/** The chart line's end label (CR §4.7): the plain name plus the change
 * over the chart's window (the lines are rebased to 100, so the last point
 * IS the change since the window's start). */
export function fxChartLineLabel(
  id: string,
  points: readonly number[],
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR',
  locale: 'en' | 'fa',
): string {
  const entries = copy.entries as Record<string, { name: string } | undefined>;
  const name = entries[id]?.name ?? copy.seriesNames[id as keyof typeof copy.seriesNames] ?? id;
  const last = points.length > 0 ? points[points.length - 1]! : 100;
  return `${name} ${fxSignedPct(last - 100, numberLocale, locale)}`;
}

/** The S5 "what it means in money" line (CR §4.2) for one pair's detail
 * panel: old = new ÷ (1 + M1/100) from the stored rate and one-month
 * change; whole numbers; "about the same" under 0.5%. */
export function fxMoneyLine(entry: FxPairEntry, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): string | null {
  const pair = PAIR_CURRENCIES[entry.id];
  if (pair === undefined || !Number.isFinite(entry.rate) || entry.rate <= 0) return null;
  const [firstCcy, secondCcy] = pair;
  const first = copy.currencyPlural[firstCcy];
  const second = copy.currencyPlural[secondCcy];
  const m1 = entry.chg.m1;
  const now = 1000 * entry.rate;
  const was = now / (1 + m1 / 100);
  const diff = Math.abs(now - was);
  if (Math.abs(m1) < 0.5) {
    return interpolate(copy.moneySame, { first, second, old: whole0(was, numberLocale) });
  }
  const template = now < was ? copy.moneyWorse : copy.moneyBetter;
  return interpolate(template, {
    first,
    second,
    old: whole0(was, numberLocale),
    new: whole0(now, numberLocale),
    diff: whole0(diff, numberLocale),
  });
}
