/**
 * World currencies — the pure presentation logic (spec §9.3, §9.10, §10.3):
 * the engine-outcome → status-word/chip mapping, the pattern-card ordering,
 * the quiet area's closest-to-warning choice, the headline templates and
 * the number formatting for the two-part sentences.
 *
 * PURE and unit-tested (fx-presentation.test.ts): a snapshot plus the copy
 * corpus go in, display decisions come out. The component stays thin —
 * this is what keeps the §9 wording rules honest (V1: only Active,
 * Watching, Quiet + the page's chips; nothing invented).
 */

import type { FxPairEntry, FxPairId, FxRuleId, FxRuleState, FxSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { FX_GROUP_ORDER, FX_PAIRS } from '@currena/insights/fx/definitions';
import type { FxGroupId } from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../i18n/insights-copy-en';
import { interpolate } from '../i18n';

/* ------------------------------------------------------------------ *
 * §9.3's status table — engine names are internal, the screen shows
 * Active / Watching / Quiet + the page's own severity chips
 * ------------------------------------------------------------------ */

export type FxScreenStatus = 'active' | 'watching' | 'quiet';

/** The copy corpus keys the seven rules ride (r1…r7), from the engine ids. */
export function fxRuleCopyKey(id: FxRuleId): 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7' {
  return id.slice(0, 2) as 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7';
}

export interface FxRuleView {
  rule: FxRuleState;
  /** The screen status word (V1: only Active / Watching / Quiet). */
  status: FxScreenStatus;
  /** The page's severity chip; null when the §9.3 table says none. */
  chip: 'normal' | 'attention' | 'unusual' | null;
}

/** The §9.3 status table, applied. Nodata rows stay rows (grey, no guess). */
export function fxRuleView(rule: FxRuleState): FxRuleView {
  switch (rule.outcome) {
    case 'warning':
      // The R4 confidence-wobble wears the Unusual chip and forces the
      // section to Unusual (§9.3 row 2); a plain warning is Needs attention.
      return { rule, status: 'active', chip: rule.variant === 'wobble' ? 'unusual' : 'attention' };
    case 'supportive':
      return { rule, status: 'active', chip: 'normal' };
    case 'watch':
      return { rule, status: 'watching', chip: null };
    case 'context':
      return { rule, status: 'active', chip: null };
    case 'quiet':
      return { rule, status: 'quiet', chip: null };
    case 'nodata':
      return { rule, status: 'quiet', chip: null };
  }
}

/* ------------------------------------------------------------------ *
 * The pattern-card ordering (§9.3 item 3)
 * ------------------------------------------------------------------ */

/** Screen seriousness: Unusual chip > Needs attention > Watching > Active
 * (healthy) > context > quiet/nodata. Ties go by rule number. */
const ORDER_SEVERITY: Record<FxRuleId, number> = {
  r1_risk_mood: 1,
  r2_carry_trade: 2,
  r3_dollar_strength: 3,
  r4_money_hiding: 4,
  r5_china_link: 5,
  r6_europe_worry: 6,
  r7_dollar_or_euro: 7,
};

function severityRank(view: FxRuleView): number {
  if (view.rule.outcome === 'nodata') return 90; // last: "Not enough data"
  if (view.status === 'quiet') return 80;
  if (view.rule.outcome === 'context') return 60;
  if (view.status === 'active' && view.chip === 'normal') return 40; // supportive
  if (view.status === 'watching') return 30;
  if (view.status === 'active' && view.chip === 'attention') return 20;
  return 10; // active + unusual (incl. the wobble)
}

/** The rules the PATTERN AREA shows (§9.3): non-quiet patterns, most
 * serious first, at most 3; R7 rides only when EUR/USD moved ≥2.5%. */
export function fxPatternOrder(rules: readonly FxRuleState[]): FxRuleState[] {
  const r7 = rules.find((r) => r.id === 'r7_dollar_or_euro');
  const r7Showing = r7 !== undefined && r7.outcome === 'context';
  return [...rules]
    .filter((r) => {
      if (r.outcome === 'quiet' || r.outcome === 'nodata') return false;
      if (r.id === 'r7_dollar_or_euro') return r7Showing; // below 2.5%: the card stays away
      return true;
    })
    .sort((a, b) => {
      const rank = severityRank(fxRuleView(a)) - severityRank(fxRuleView(b));
      return rank !== 0 ? rank : ORDER_SEVERITY[a.id] - ORDER_SEVERITY[b.id];
    })
    .slice(0, 3);
}

/** The quiet rules (§9.3 item 4): Quiet AND Nodata rows are left out of
 * the closest-to-warning choice; the quiet list holds only true Quiets. */
export function fxQuietRules(rules: readonly FxRuleState[]): FxRuleState[] {
  return rules.filter((r) => r.outcome === 'quiet');
}

/** The quiet pattern closest to its warning (highest progress; §6.7).
 * Nodata rows are excluded (spec §9.5). */
export function fxClosestToWarning(rules: readonly FxRuleState[]): FxRuleState | null {
  const quiet = rules.filter((r) => r.outcome === 'quiet' && r.progress > 0);
  if (quiet.length === 0) return null;
  return quiet.reduce((best, r) => (r.progress > best.progress ? r : best), quiet[0]!);
}

/* ------------------------------------------------------------------ *
 * The headline (§10.3) and the verdict line's measure label (§9.10)
 * ------------------------------------------------------------------ */

export type FxMeasureLabel = 'measureNormal' | 'measureAttention' | 'measureUnusual';

/** §9.10's measure label for the section's current signal. */
export function fxMeasureKey(signal: FxSnapshot['summary']['signal']): FxMeasureLabel {
  if (signal === 'unusual') return 'measureUnusual';
  if (signal === 'attention') return 'measureAttention';
  return 'measureNormal';
}

/** The §10.3 headline sentence — generated from the numbers, never free text. */
export function fxHeadline(
  snapshot: Pick<FxSnapshot, 'rules' | 'summary'>,
  copy: InsightsCopy['fx'],
): string {
  const { summary } = snapshot;
  // The confidence wobble gets its own headline (§10.3 row 4).
  const wobble = snapshot.rules.find((r) => r.id === 'r4_money_hiding' && r.variant === 'wobble' && r.counted);
  if (wobble !== undefined) return copy.headlineWobble;
  const nameOf = (id: FxRuleId): string => copy.rules[fxRuleCopyKey(id)].name;
  if (summary.signal === 'unusual' && summary.headlineRule !== null) {
    return interpolate(copy.headlineUnusual, { top: nameOf(summary.headlineRule) });
  }
  const active = fxPatternOrder(snapshot.rules).filter((r) => fxRuleView(r).status === 'active');
  if (active.length >= 1) {
    const top = nameOf(active[0]!.id);
    const more = active.length - 1;
    // §10.3's "{, plus {n} more}" is an OPTIONAL tail — two templates.
    return interpolate(more > 0 ? copy.headlineActiveMore : copy.headlineActive, {
      top,
      ...(more > 0 ? { n: String(more) } : {}),
    });
  }
  // Calm: name the pattern closest to a warning (§10.3 row 1).
  const closest = fxClosestToWarning(snapshot.rules);
  return interpolate(copy.headlineCalm, { name: closest !== null ? nameOf(closest.id) : '—' });
}

/* ------------------------------------------------------------------ *
 * The pairs table (§9.3 item 6)
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * The two-part sentences (§7): what we see (the real numbers) and what
 * it usually means — filled from the rule state, never free text
 * ------------------------------------------------------------------ */

export interface FxSentence {
  see: string;
  means: string;
}

/** One decimal, no sign — the sentence's words carry the direction (§7). */
function abs1(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** The §7 sentence pair for a rule state, numbers formatted per locale. */
export function fxSentence(
  rule: FxRuleState,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR',
): FxSentence | null {
  const n = (key: string): number | undefined => {
    const v = rule.numbers[key];
    return v === undefined ? undefined : v;
  };
  const fmt = (key: string): string | undefined => {
    const v = n(key);
    return v === undefined ? undefined : abs1(v, numberLocale);
  };
  const fill = (template: string, params: Record<string, string>): string =>
    interpolate(template, params);
  const c = copy.rules;

  switch (rule.id) {
    case 'r1_risk_mood': {
      const audjpy = fmt('audjpy_m1');
      if (audjpy === undefined) return null;
      // {stocks}: the S&P variant when its number exists, the fear variant
      // when it was the fear leg that confirmed (§7's {stocks} rule).
      const sp = n('sp500_m1');
      const fear = rule.numbers.market_fear !== undefined;
      const stocks =
        sp !== undefined
          ? fill(c.r1.stocksSp500, { y: abs1(sp, numberLocale) })
          : fear
            ? c.r1.stocksFear
            : c.r1.stocksSp500; // nodata guard — the row never renders as a sentence
      if (rule.outcome === 'warning') {
        return {
          see: fill(c.r1.warning.see, { x: audjpy, stocks }),
          means: c.r1.warning.means,
        };
      }
      if (rule.outcome === 'supportive') {
        return {
          see: fill(c.r1.supportive.see, {
            x: audjpy,
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
          }),
          means: c.r1.supportive.means,
        };
      }
      if (rule.outcome === 'watch') {
        return { see: fill(c.r1.watch.see, { x: audjpy }), means: c.r1.watch.means };
      }
      return null;
    }
    case 'r2_carry_trade': {
      const usdjpy = rule.numbers.usdjpy_m1;
      if (usdjpy === undefined) return null;
      if (rule.outcome === 'warning') {
        const nikkei = rule.numbers.nikkei_m1;
        return {
          see: fill(c.r2.warning.see, {
            x: abs1(usdjpy, numberLocale),
            y: nikkei !== undefined ? abs1(nikkei, numberLocale) : '—',
          }),
          means: c.r2.warning.means,
        };
      }
      if (rule.outcome === 'watch') {
        const m3 = rule.numbers.usdjpy_m3;
        return {
          see: fill(c.r2.watch.see, { x: m3 !== undefined ? abs1(m3, numberLocale) : '—' }),
          means: c.r2.watch.means,
        };
      }
      return null;
    }
    case 'r3_dollar_strength': {
      const m3 = rule.numbers.dollar_m3;
      if (m3 === undefined) return null;
      if (rule.outcome === 'warning') {
        return { see: fill(c.r3.warning.see, { x: abs1(m3, numberLocale) }), means: c.r3.warning.means };
      }
      if (rule.outcome === 'supportive') {
        return { see: fill(c.r3.supportive.see, { x: abs1(m3, numberLocale) }), means: c.r3.supportive.means };
      }
      return null;
    }
    case 'r4_money_hiding': {
      const sp = rule.numbers.sp500_m1;
      const d = rule.numbers.dollar_m1;
      const g = rule.numbers.gold_m1;
      if (rule.variant === 'wobble') {
        return {
          see: fill(c.r4.wobble.see, {
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
            x: d !== undefined ? abs1(d, numberLocale) : '—',
            g: g !== undefined ? abs1(g, numberLocale) : '—',
          }),
          means: c.r4.wobble.means,
        };
      }
      if (rule.outcome === 'warning') {
        return {
          see: fill(c.r4.flight.see, {
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
            x: d !== undefined ? abs1(d, numberLocale) : '—',
          }),
          means: c.r4.flight.means,
        };
      }
      return null;
    }
    case 'r5_china_link': {
      const cny = rule.numbers.usdcny_m3;
      const aud = rule.numbers.audusd_m3;
      if (rule.outcome === 'warning') {
        if (cny === undefined || aud === undefined) return null;
        return {
          see: fill(c.r5.warning.see, { x: abs1(cny, numberLocale), y: abs1(aud, numberLocale) }),
          means: c.r5.warning.means,
        };
      }
      if (rule.outcome === 'supportive') {
        if (cny === undefined || aud === undefined) return null;
        return {
          see: fill(c.r5.supportive.see, { x: abs1(cny, numberLocale), y: abs1(aud, numberLocale) }),
          means: c.r5.supportive.means,
        };
      }
      if (rule.outcome === 'watch') {
        // {leg}: whichever of the two moved (§7's {leg} rule).
        const leg =
          cny !== undefined
            ? fill(c.r5.legCny, { x: abs1(cny, numberLocale) })
            : aud !== undefined
              ? fill(c.r5.legAud, { y: abs1(aud, numberLocale) })
              : '—';
        return { see: fill(c.r5.watch.see, { leg }), means: c.r5.watch.means };
      }
      return null;
    }
    case 'r6_europe_worry': {
      const eurchf = rule.numbers.eurchf_m1;
      if (eurchf === undefined) return null;
      if (rule.outcome === 'warning') {
        const stoxx = rule.numbers.stoxx50_m1;
        return {
          see: fill(c.r6.warning.see, {
            x: abs1(eurchf, numberLocale),
            y: stoxx !== undefined ? abs1(stoxx, numberLocale) : '—',
          }),
          means: c.r6.warning.means,
        };
      }
      if (rule.outcome === 'watch') {
        return { see: fill(c.r6.watch.see, { x: abs1(eurchf, numberLocale) }), means: c.r6.watch.means };
      }
      return null;
    }
    case 'r7_dollar_or_euro': {
      const eurusd = rule.numbers.eurusd_m1;
      const d = rule.numbers.dollar_m1;
      if (eurusd === undefined || d === undefined) return null;
      if (rule.variant === 'dollar-led') {
        return {
          see: fill(c.r7.dollarLed.see, { x: abs1(eurusd, numberLocale), d: abs1(d, numberLocale) }),
          means: c.r7.dollarLed.means,
        };
      }
      if (rule.variant === 'euro-led') {
        return {
          see: fill(c.r7.euroLed.see, { x: abs1(eurusd, numberLocale), d: abs1(d, numberLocale) }),
          means: c.r7.euroLed.means,
        };
      }
      return null;
    }
  }
}
