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
import type { FxCurrency } from '@currena/core';
import { formatNumber } from '@currena/core';
import {
  FX_BIG_MOVE_M1_PCT,
  FX_GROUP_ORDER,
  FX_PAIRS,
  R1_AUDJPY_M1_WARN,
  R1_SP500_M1_WARN,
  R2_NIKKEI_M1_WARN,
  R2_USDJPY_M1_WARN,
  R3_DOLLAR_M1_STRONG,
  R3_DOLLAR_M3_STRONG,
  R4_DOLLAR_M1_UP,
  R4_SP500_M1_DOWN,
  R5_USDCNY_M3_WEAK,
  R6_EURCHF_M1_WARN,
  R6_EUROSTOXX_M1_WARN,
} from '@currena/insights/fx/definitions';
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
 * the closest-to-warning choice; the quiet list holds only true Quiets.
 * R7 never rides the list — it is a context rule: it either shows its card
 * or stays away entirely (a "quiet" R7 renders no row, so counting it
 * would break the "{n} more" number). v1.3 fix B6: pass the closest
 * pattern's id and it is LEFT OUT of the list — the closest row and the
 * "more quiet patterns" list must never repeat the same pattern. */
export function fxQuietRules(rules: readonly FxRuleState[], excludeId?: FxRuleId): FxRuleState[] {
  return rules.filter((r) => r.outcome === 'quiet' && r.id !== 'r7_dollar_or_euro' && r.id !== excludeId);
}

/** The quiet pattern closest to its warning (highest progress; §6.7).
 * Nodata rows are excluded (spec §9.5). */
export function fxClosestToWarning(rules: readonly FxRuleState[]): FxRuleState | null {
  const quiet = rules.filter((r) => r.outcome === 'quiet' && r.progress > 0);
  if (quiet.length === 0) return null;
  return quiet.reduce((best, r) => (r.progress > best.progress ? r : best), quiet[0]!);
}

/* ------------------------------------------------------------------ *
 * The headline (§10.3 + CR §3.2) and the verdict line's measure label (§9.10)
 * ------------------------------------------------------------------ */

export type FxMeasureLabel = 'measureNormal' | 'measureAttention' | 'measureUnusual';

/** §9.10's measure label for the section's current signal. */
export function fxMeasureKey(signal: FxSnapshot['summary']['signal']): FxMeasureLabel {
  if (signal === 'unusual') return 'measureUnusual';
  if (signal === 'attention') return 'measureAttention';
  return 'measureNormal';
}

/*
 * The big mover (CR §3.2): when the section signal is Normal but the dollar
 * measure or a pair made a visible big move (|M1| ≥ 3.0, or the pair's
 * stored bigMove tag), the headline says so — a calm verdict over a visible
 * big move reads as an error (fix B8's honest-verdict half).
 */
export interface FxBigMover {
  kind: 'dollar' | 'pair';
  pairId?: FxPairId;
  /** The 1-month change, percent (signed). */
  m1: number;
}

/** The biggest qualifying mover, or null on a genuinely quiet day. */
export function fxBigMoverOf(snapshot: FxSnapshot): FxBigMover | null {
  const candidates: FxBigMover[] = [];
  const d = snapshot.dollarMeasure.chg.m1;
  if (Math.abs(d) >= FX_BIG_MOVE_M1_PCT) candidates.push({ kind: 'dollar', m1: d });
  for (const p of snapshot.pairs) {
    if (Math.abs(p.chg.m1) >= FX_BIG_MOVE_M1_PCT || p.bigMove) {
      candidates.push({ kind: 'pair', pairId: p.id, m1: p.chg.m1 });
    }
  }
  if (candidates.length === 0) return null;
  // Biggest |M1| wins; ties go to the dollar measure (it is the headline row).
  candidates.sort((a, b) => Math.abs(b.m1) - Math.abs(a.m1) || (a.kind === 'dollar' ? -1 : 1));
  return candidates[0]!;
}

/** {first, second} currency codes of a pair (presentation's own map). */
const PAIR_CURRENCIES: Record<FxPairId, readonly [FxCurrency | 'USD', FxCurrency | 'USD']> = {
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

/** CR §3.2's {mover sentence} — "the US dollar is up {x}% this month" or
 * "the euro lost {x}% against the US dollar this month". */
export function fxMoverSentence(mover: FxBigMover, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): string {
  const x = abs1(mover.m1, numberLocale);
  if (mover.kind === 'dollar') {
    return interpolate(mover.m1 > 0 ? copy.moverDollarUp : copy.moverDollarDown, { x });
  }
  const [firstCcy, secondCcy] = PAIR_CURRENCIES[mover.pairId!]!;
  const params = {
    x,
    first: copy.currencyNames[firstCcy],
    second: copy.currencyNames[secondCcy],
  };
  return interpolate(mover.m1 < 0 ? copy.moverPairDown : copy.moverPairUp, params);
}

/** The §10.3 headline sentence — generated from the numbers, never free text.
 * v1.3 fix B2: only a pattern that COUNTS (a counted Warning) can lead the
 * headline — never a context card, never a supportive row. When nothing
 * counts: the calm headline, or the big-mover template when a big move is
 * visible (CR §3.2). */
export function fxHeadline(
  snapshot: FxSnapshot,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR' = 'en-US',
): string {
  const { summary, rules } = snapshot;
  // The confidence wobble gets its own headline (§10.3 row 4).
  const wobble = rules.find((r) => r.id === 'r4_money_hiding' && r.variant === 'wobble' && r.counted);
  if (wobble !== undefined) return copy.headlineWobble;
  const nameOf = (id: FxRuleId): string => copy.rules[fxRuleCopyKey(id)].name;
  if (summary.signal === 'unusual' && summary.headlineRule !== null) {
    return interpolate(copy.headlineUnusual, { top: nameOf(summary.headlineRule) });
  }
  if (summary.countedWarnings >= 1 && summary.headlineRule !== null) {
    const more = summary.countedWarnings - 1;
    // §10.3's "{, plus {n} more}" is an OPTIONAL tail — two templates.
    return interpolate(more > 0 ? copy.headlineActiveMore : copy.headlineActive, {
      top: nameOf(summary.headlineRule),
      ...(more > 0 ? { n: String(more) } : {}),
    });
  }
  // Normal signal with a visible big move (CR §3.2).
  const mover = fxBigMoverOf(snapshot);
  if (mover !== null) {
    return interpolate(copy.headlineBigMover, { mover: fxMoverSentence(mover, copy, numberLocale) });
  }
  // Calm: name the pattern closest to a warning (§10.3 row 1).
  const closest = fxClosestToWarning(rules);
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

/** The §7 sentence pair for a rule state, numbers formatted per locale.
 * A DOWNGRADED warning (§6.4: fired but not holding lately) keeps its
 * WARNING sentence — the numbers are facts; the Watching status word and
 * the caution line carry the reliability caveat. */
export function fxSentence(
  rule: FxRuleState,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR',
): FxSentence | null {
  const state: FxRuleState =
    rule.outcome === 'watch' && rule.downgraded === true ? { ...rule, outcome: 'warning' } : rule;
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

  switch (state.id) {
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
      if (state.outcome === 'warning') {
        return {
          see: fill(c.r1.warning.see, { x: audjpy, stocks }),
          means: c.r1.warning.means,
        };
      }
      if (state.outcome === 'supportive') {
        return {
          see: fill(c.r1.supportive.see, {
            x: audjpy,
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
          }),
          means: c.r1.supportive.means,
        };
      }
      if (state.outcome === 'watch') {
        return { see: fill(c.r1.watch.see, { x: audjpy }), means: c.r1.watch.means };
      }
      return null;
    }
    case 'r2_carry_trade': {
      const usdjpy = rule.numbers.usdjpy_m1;
      if (usdjpy === undefined) return null;
      if (state.outcome === 'warning') {
        const nikkei = rule.numbers.nikkei_m1;
        return {
          see: fill(c.r2.warning.see, {
            x: abs1(usdjpy, numberLocale),
            y: nikkei !== undefined ? abs1(nikkei, numberLocale) : '—',
          }),
          means: c.r2.warning.means,
        };
      }
      if (state.outcome === 'watch') {
        const m3 = rule.numbers.usdjpy_m3;
        return {
          see: fill(c.r2.watch.see, { x: m3 !== undefined ? abs1(m3, numberLocale) : '—' }),
          means: c.r2.watch.means,
        };
      }
      return null;
    }
    case 'r3_dollar_strength': {
      const m1 = rule.numbers.dollar_m1;
      const m3 = rule.numbers.dollar_m3;
      if (state.outcome === 'warning') {
        // v1.3 (CR §3.1): the variant names the leg that fired, so the
        // sentence says "over the past month" or "over the past three
        // months" honestly.
        const useM1 = rule.variant === 'm1';
        const v = useM1 ? m1 : m3;
        if (v === undefined) return null;
        return {
          see: fill(useM1 ? c.r3.warningM1See : c.r3.warning.see, { x: abs1(v, numberLocale) }),
          means: c.r3.warning.means,
        };
      }
      if (state.outcome === 'supportive') {
        const useM1 = rule.variant === 'm1';
        const v = useM1 ? m1 : m3;
        if (v === undefined) return null;
        return {
          see: fill(useM1 ? c.r3.supportiveM1See : c.r3.supportive.see, { x: abs1(v, numberLocale) }),
          means: c.r3.supportive.means,
        };
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
      if (state.outcome === 'warning') {
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
      if (state.outcome === 'warning') {
        if (cny === undefined || aud === undefined) return null;
        return {
          see: fill(c.r5.warning.see, { x: abs1(cny, numberLocale), y: abs1(aud, numberLocale) }),
          means: c.r5.warning.means,
        };
      }
      if (state.outcome === 'supportive') {
        if (cny === undefined || aud === undefined) return null;
        return {
          see: fill(c.r5.supportive.see, { x: abs1(cny, numberLocale), y: abs1(aud, numberLocale) }),
          means: c.r5.supportive.means,
        };
      }
      if (state.outcome === 'watch') {
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
      if (state.outcome === 'warning') {
        const stoxx = rule.numbers.stoxx50_m1;
        return {
          see: fill(c.r6.warning.see, {
            x: abs1(eurchf, numberLocale),
            y: stoxx !== undefined ? abs1(stoxx, numberLocale) : '—',
          }),
          means: c.r6.warning.means,
        };
      }
      if (state.outcome === 'watch') {
        return { see: fill(c.r6.watch.see, { x: abs1(eurchf, numberLocale) }), means: c.r6.watch.means };
      }
      return null;
    }
    case 'r7_dollar_or_euro': {
      const eurusd = rule.numbers.eurusd_m1;
      const d = rule.numbers.dollar_m1;
      if (eurusd === undefined || d === undefined) return null;
      // v1.3 (CR §3.3): the euro's own move carries the verb (lost/gained),
      // and the euro-up/euro-down halves pick their own template.
      if (rule.variant === 'dollar-led') {
        const t = eurusd < 0 ? c.r7.dollarLedEuroDown : c.r7.dollarLedEuroUp;
        return { see: fill(t.see, { x: abs1(eurusd, numberLocale), d: abs1(d, numberLocale) }), means: t.means };
      }
      if (rule.variant === 'euro-led') {
        const t = eurusd < 0 ? c.r7.euroLedEuroDown : c.r7.euroLedEuroUp;
        return { see: fill(t.see, { x: abs1(eurusd, numberLocale), d: abs1(d, numberLocale) }), means: t.means };
      }
      return null;
    }
  }
}

/* ------------------------------------------------------------------ *
 * v1.3 — the plain-language layer (change request §4)
 * ------------------------------------------------------------------ */

/** A signed percentage for on-screen labels ("−3.6%"). A value that rounds
 * to zero carries no sign — "−0.0%" reads as a bug. */
export function fxSignedPct(n: number, numberLocale: 'en-US' | 'fa-IR', locale: 'en' | 'fa'): string {
  const num = formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const roundsToZero = Math.round(Math.abs(n) * 10) === 0;
  const sign = roundsToZero ? '' : n > 0 ? '+' : '−';
  return `${sign}${num}${locale === 'fa' ? '٪' : '%'}`;
}

/** One decimal, no sign — the CR's {line} threshold format ("3.0"). */
function threshold1(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Whole numbers — the S5 money line's {old}/{new}/{diff}. */
function whole0(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.round(n), numberLocale, { maximumFractionDigits: 0 });
}

/** Each big currency's OWN 1-month change against the US dollar, percent,
 * positive = the currency gained on the dollar (CR §4.2 S2). Reads the
 * stored `plain.movers` when present; a pre-v1.3 cached snapshot (no
 * `plain`) derives the same numbers from the stored pair rows — the section
 * never shows an error for missing data. */
export function fxMoversOf(snapshot: FxSnapshot): Partial<Record<FxCurrency, number>> {
  if (snapshot.plain !== undefined) return snapshot.plain.movers;
  const byId = new Map(snapshot.pairs.map((p) => [p.id as string, p]));
  const own = (id: FxPairId): number | undefined => byId.get(id)?.chg.m1;
  const inv = (id: FxPairId): number | undefined => {
    const m1 = byId.get(id)?.chg.m1;
    return m1 === undefined ? undefined : Math.round((1 / (1 + m1 / 100) - 1) * 10000) / 100;
  };
  return {
    EUR: own('eurusd'),
    JPY: inv('usdjpy'),
    GBP: own('gbpusd'),
    CNY: inv('usdcny'),
    CHF: inv('usdchf'),
    AUD: own('audusd'),
  };
}

/** 'high'/'low' when the dollar measure sits at its 52-week extreme (S1's
 * optional clause); derived from the stored weekly closes when a pre-v1.3
 * snapshot has no `plain`. */
export function fxDollarYearExtremeOf(snapshot: FxSnapshot): 'high' | 'low' | null {
  if (snapshot.plain !== undefined) return snapshot.plain.dollarYearExtreme;
  const window = snapshot.dollarMeasure.weekly.map(([, v]) => v).slice(-52);
  if (window.length === 0) return null;
  const max = Math.max(...window);
  const min = Math.min(...window);
  const v = snapshot.dollarMeasure.value;
  if (v >= max && v > min) return 'high';
  if (v <= min && v < max) return 'low';
  return null;
}

/** S1's "steady" band: −1.0 < M1 < +1.0 (CR §4.2). */
const S1_STEADY_BAND = 1.0;

/** The "In plain words" block (CR §4.2): three to four short lines built
 * from the numbers — S1 the dollar, S2 the biggest movers, S3 the
 * Australian dollar, S4 the mood. Null lines are skipped, never blank. */
export interface FxPlainWords {
  s1: string;
  s2: string | null;
  s3: string | null;
  s4: string;
}

export function fxPlainWords(
  snapshot: FxSnapshot,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR',
): FxPlainWords {
  // S1 — the dollar (1 month; the ±3.0 bands share R3's fast-leg line).
  const m1 = snapshot.dollarMeasure.chg.m1;
  const x = abs1(m1, numberLocale);
  const extreme =
    m1 >= R3_DOLLAR_M1_STRONG && fxDollarYearExtremeOf(snapshot) === 'high'
      ? copy.s1ExtremeHigh
      : m1 <= -R3_DOLLAR_M1_STRONG && fxDollarYearExtremeOf(snapshot) === 'low'
        ? copy.s1ExtremeLow
        : '';
  let s1: string;
  if (m1 >= R3_DOLLAR_M1_STRONG) s1 = interpolate(copy.s1MuchStronger, { x, extreme });
  else if (m1 >= S1_STEADY_BAND) s1 = interpolate(copy.s1Stronger, { x });
  else if (m1 > -S1_STEADY_BAND) s1 = interpolate(copy.s1Steady, { x });
  else if (m1 > -R3_DOLLAR_M1_STRONG) s1 = interpolate(copy.s1Weaker, { x });
  else s1 = interpolate(copy.s1MuchWeaker, { x, extreme });

  // S2 — the two biggest changes against the dollar (each currency's OWN move).
  let s2: string | null = null;
  const movers = (Object.entries(fxMoversOf(snapshot)) as Array<[FxCurrency, number | undefined]>).filter(
    (entry): entry is [FxCurrency, number] => entry[1] !== undefined,
  );
  if (movers.length >= 2) {
    movers.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const [A, B] = [movers[0]!, movers[1]!];
    s2 = interpolate(copy.s2Line, {
      A: copy.currencyNames[A[0]],
      a: abs1(A[1], numberLocale),
      dirA: A[1] < 0 ? copy.wordLost : copy.wordGained,
      B: copy.currencyNames[B[0]],
      b: abs1(B[1], numberLocale),
      dirB: B[1] < 0 ? copy.wordLost : copy.wordGained,
    });
  }

  // S3 — the Australian dollar (always shown when the pair exists).
  let s3: string | null = null;
  const aud = snapshot.pairs.find((p) => p.id === 'audusd');
  if (aud !== undefined) {
    const a = aud.chg.m1;
    if (a <= -S1_STEADY_BAND) s3 = interpolate(copy.s3Weaker, { x: abs1(a, numberLocale) });
    else if (a >= S1_STEADY_BAND) s3 = interpolate(copy.s3Stronger, { x: abs1(a, numberLocale) });
    else s3 = interpolate(copy.s3Steady, { x: abs1(a, numberLocale) });
  }

  // S4 — the mood, from the counted warnings.
  const counted = snapshot.rules.filter((r) => r.outcome === 'warning' && r.counted);
  let s4: string;
  if (counted.length === 0) {
    const closest = fxClosestToWarning(snapshot.rules);
    s4 = interpolate(copy.s4None, {
      name: closest !== null ? copy.rules[fxRuleCopyKey(closest.id)].name : '—',
    });
  } else {
    const names = counted.map((r) => copy.rules[fxRuleCopyKey(r.id)].name).join(' · ');
    s4 =
      counted.length === 1
        ? interpolate(copy.s4One, { names })
        : interpolate(copy.s4Many, {
            n: formatNumber(counted.length, numberLocale, { maximumFractionDigits: 0 }),
            names,
          });
  }

  return { s1, s2, s3, s4 };
}

/** The card's Level-1 HEADLINE VERDICT (CR §4.3): one short line per
 * outcome — "Investors look nervous". Null for nodata rows (they show the
 * no-data line instead). A DOWNGRADED warning (§6.4: fired but the pattern
 * is not holding lately) keeps its WARNING headline — the move did happen;
 * the caution line below carries the honesty. */
export function fxHeadlineVerdict(rule: FxRuleState, copy: InsightsCopy['fx']): string | null {
  if (rule.outcome === 'nodata') return null;
  const downgradedWarning = rule.outcome === 'watch' && rule.downgraded === true;
  const asWarning: FxRuleState = downgradedWarning ? { ...rule, outcome: 'warning' } : rule;
  switch (rule.id) {
    case 'r1_risk_mood': {
      const c = copy.rules.r1;
      return asWarning.outcome === 'warning'
        ? c.headlineWarning
        : asWarning.outcome === 'supportive'
          ? c.headlineSupportive
          : asWarning.outcome === 'watch'
            ? c.headlineWatch
            : c.headlineQuiet;
    }
    case 'r2_carry_trade': {
      const c = copy.rules.r2;
      return asWarning.outcome === 'warning' ? c.headlineWarning : asWarning.outcome === 'watch' ? c.headlineWatch : c.headlineQuiet;
    }
    case 'r3_dollar_strength': {
      const c = copy.rules.r3;
      return asWarning.outcome === 'warning'
        ? c.headlineWarning
        : asWarning.outcome === 'supportive'
          ? c.headlineSupportive
          : c.headlineQuiet;
    }
    case 'r4_money_hiding': {
      const c = copy.rules.r4;
      if (asWarning.outcome === 'warning') return asWarning.variant === 'wobble' ? c.headlineWobble : c.headlineFlight;
      return c.headlineQuiet;
    }
    case 'r5_china_link': {
      const c = copy.rules.r5;
      return asWarning.outcome === 'warning'
        ? c.headlineWarning
        : asWarning.outcome === 'supportive'
          ? c.headlineSupportive
          : asWarning.outcome === 'watch'
            ? c.headlineWatch
            : c.headlineQuiet;
    }
    case 'r6_europe_worry': {
      const c = copy.rules.r6;
      return asWarning.outcome === 'warning' ? c.headlineWarning : asWarning.outcome === 'watch' ? c.headlineWatch : c.headlineQuiet;
    }
    case 'r7_dollar_or_euro': {
      const c = copy.rules.r7;
      return rule.variant === 'dollar-led' ? c.headlineDollarLed : rule.variant === 'euro-led' ? c.headlineEuroLed : null;
    }
  }
}

/** Level 2's "What would change this" (CR §4.3): the alarm level in words,
 * {line}/{line1}/{line2} filled from the config thresholds (no sign, one
 * decimal). Null for R7 — a context card has no alarm line (fix B5). */
export function fxChangeLine(rule: FxRuleState, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): string | null {
  switch (rule.id) {
    case 'r1_risk_mood':
      return interpolate(copy.rules.r1.changeLine, {
        line: threshold1(R1_AUDJPY_M1_WARN, numberLocale),
        line2: threshold1(R1_SP500_M1_WARN, numberLocale),
      });
    case 'r2_carry_trade':
      return interpolate(copy.rules.r2.changeLine, {
        line: threshold1(R2_USDJPY_M1_WARN, numberLocale),
        line2: threshold1(R2_NIKKEI_M1_WARN, numberLocale),
      });
    case 'r3_dollar_strength':
      return interpolate(copy.rules.r3.changeLine, {
        line1: threshold1(R3_DOLLAR_M1_STRONG, numberLocale),
        line2: threshold1(R3_DOLLAR_M3_STRONG, numberLocale),
      });
    case 'r4_money_hiding':
      return interpolate(copy.rules.r4.changeLine, {
        line1: threshold1(R4_SP500_M1_DOWN, numberLocale),
        line2: threshold1(R4_DOLLAR_M1_UP, numberLocale),
      });
    case 'r5_china_link':
      return interpolate(copy.rules.r5.changeLine, { line: threshold1(R5_USDCNY_M3_WEAK, numberLocale) });
    case 'r6_europe_worry':
      return interpolate(copy.rules.r6.changeLine, {
        line1: threshold1(R6_EURCHF_M1_WARN, numberLocale),
        line2: threshold1(R6_EUROSTOXX_M1_WARN, numberLocale),
      });
    case 'r7_dollar_or_euro':
      return null;
  }
}

/** One quiet row's display shape (CR §4.4): line 1 the plain title and its
 * quiet headline; line 2 the numbers in words; the progress bar's value. */
export interface FxQuietView {
  rule: FxRuleState;
  /** "Europe worry · No sign of Europe worry". */
  line1: string;
  /** "The euro is down 1.5% against the Swiss franc this month. The alarm
   * sounds at 2.0%." — null only when the leg's number is absent. */
  line2: string | null;
  progress: number;
}

export function fxQuietView(rule: FxRuleState, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): FxQuietView | null {
  if (rule.outcome !== 'quiet') return null;
  const c = copy.rules[fxRuleCopyKey(rule.id)];
  const headline = fxHeadlineVerdict(rule, copy);
  const line1 = headline === null ? c.name : `${c.name} · ${headline}`;
  const n = rule.numbers;
  const currencyDir = (v: number): string => (v < 0 ? copy.dirDownCurrency : copy.dirUpCurrency);
  const stockDir = (v: number): string => (v < 0 ? copy.dirDownStock : copy.dirUpStock);
  let line2: string | null = null;
  switch (rule.id) {
    case 'r1_risk_mood': {
      const v = n.audjpy_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r1, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R1_AUDJPY_M1_WARN, numberLocale) });
      }
      break;
    }
    case 'r2_carry_trade': {
      const v = n.usdjpy_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r2, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R2_USDJPY_M1_WARN, numberLocale) });
      }
      break;
    }
    case 'r3_dollar_strength': {
      // The NEARER of the two legs carries the wording (CR §3.1).
      const m1 = n.dollar_m1;
      const m3 = n.dollar_m3;
      if (m1 !== undefined && m3 !== undefined) {
        const m1Nearer = Math.abs(m1) / R3_DOLLAR_M1_STRONG >= Math.abs(m3) / R3_DOLLAR_M3_STRONG;
        const v = m1Nearer ? m1 : m3;
        line2 = interpolate(m1Nearer ? copy.quietNumbers.r3M1 : copy.quietNumbers.r3M3, {
          dir: currencyDir(v),
          x: abs1(v, numberLocale),
          line: threshold1(m1Nearer ? R3_DOLLAR_M1_STRONG : R3_DOLLAR_M3_STRONG, numberLocale),
        });
      }
      break;
    }
    case 'r4_money_hiding': {
      const v = n.sp500_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r4, { dir: stockDir(v), x: abs1(v, numberLocale), line: threshold1(R4_SP500_M1_DOWN, numberLocale) });
      }
      break;
    }
    case 'r5_china_link': {
      const v = n.usdcny_m3;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r5, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R5_USDCNY_M3_WEAK, numberLocale) });
      }
      break;
    }
    case 'r6_europe_worry': {
      const v = n.eurchf_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r6, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R6_EURCHF_M1_WARN, numberLocale) });
      }
      break;
    }
    case 'r7_dollar_or_euro':
      return null; // a quiet R7 shows no card at all (§9.3)
  }
  return { rule, line1, line2, progress: rule.progress };
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

/** The dollar row's meaning line (CR §4.9, fix B7): follows the dollar's
 * 1-month direction — the old fixed sentence was wrong on weak or steady
 * days. */
export function fxDollarMeaning(dollarM1: number, copy: InsightsCopy['fx']): string {
  if (dollarM1 >= 1.0) return copy.dollarMeaningStrong;
  if (dollarM1 <= -1.0) return copy.dollarMeaningWeak;
  return copy.dollarMeaningSteady;
}
