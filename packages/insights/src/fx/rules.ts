/**
 * The seven rules (spec §6.3) + downgrade + progress (§6.4, §6.7) — Phase 3
 * split of the former compute.ts monolith. One named function per rule
 * keeps each independently navigable while the shared leg/progress/
 * chart/pattern machinery stays in one place.
 */

import type { FxLeg, FxPatternCheck, FxRuleId, FxRuleState } from '@currena/core';
import type { SeriesPoint } from '../series';
import {
  FX_CHART_POINTS,
  FX_PAIR_IDS,
  FX_RULES,
  PATTERN_WEEKS,
  R1_AUDJPY_M1_OK,
  R1_AUDJPY_M1_WARN,
  R1_CONFIRM_EURJPY_M1,
  R1_SP500_M1_OK,
  R1_SP500_M1_WARN,
  R2_NIKKEI_M1_WARN,
  R2_USDJPY_M1_WARN,
  R2_USDJPY_M3_PRESSURE,
  R3_DOLLAR_M1_STRONG,
  R3_DOLLAR_M1_WEAK,
  R3_DOLLAR_M3_STRONG,
  R3_DOLLAR_M3_WEAK,
  R4_DOLLAR_M1_DOWN,
  R4_DOLLAR_M1_UP,
  R4_GOLD_M1_UP,
  R4_SP500_M1_DOWN,
  R5_AUDUSD_M3_FALL,
  R5_AUDUSD_M3_RISE,
  R5_USDCNY_M3_FIRM,
  R5_USDCNY_M3_WEAK,
  R6_EURCHF_M1_WARN,
  R6_EUROSTOXX_M1_WARN,
  R7_DOLLAR_FOLLOWS,
  R7_DOLLAR_QUIET,
  R7_EURUSD_M1_MOVE,
  fxRuleDefinition,
} from './definitions';
import type { FxRuleInputs } from './cross-inputs';
import { round2 } from './maths';
import { patternCheck, rebaseTo100, weekGrid } from './weekly';

/**
 * A warning-line row. Legs only exist for AVAILABLE inputs — an absent
 * input simply has no row (the engine never fabricates a 0 or a NaN);
 * push helpers below skip undefined values.
 */
function leg(name: string, value: number, line: number, met: boolean): FxLeg {
  return { name, value: round2(value), line, met };
}

/** Push a leg only when its value exists. */
function pushLeg(legs: FxLeg[], name: string, value: number | undefined, line: number, met: boolean): void {
  if (value === undefined) return;
  legs.push(leg(name, value, line, met));
}

function progressOf(mainValue: number | undefined, warnAt: number): number {
  if (mainValue === undefined) return 0;
  // Only moves in the WARNING direction count (§6.7).
  const towards = warnAt < 0 ? Math.min(0, mainValue) : Math.max(0, mainValue);
  return Math.max(0, Math.min(100, (towards / warnAt) * 100));
}

function numbersOf(entries: Array<[string, number | undefined]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of entries) if (v !== undefined) out[k] = round2(v);
  return out;
}

/* ------------------------- chart machinery ---------------------------- */

/** Chart lines (spec §9.3 Level 2 item 1: 26 weeks, rebased to 100). */
function chartSeries(inputs: FxRuleInputs, keys: readonly string[]): Array<{ id: string; points: number[] }> {
  const seriesByKey = seriesMapOf(inputs);
  // Only the keys that actually have a series ride the grid, and each
  // output line maps back to ITS key — a missing series never shifts the
  // index of the others.
  const present = keys.filter((k) => seriesByKey[k] !== undefined);
  if (present.length < 2) return [];
  const { values } = weekGrid(present.map((k) => seriesByKey[k]!), FX_CHART_POINTS);
  return present.map((id, i) => {
    const points = rebaseTo100(values[i] ?? []);
    return points.length >= 2 ? { id, points: points.slice(-FX_CHART_POINTS) } : null;
  }).filter((x): x is { id: string; points: number[] } => x !== null);
}

/** The chart/pattern series registry: pair keys, dollar, gold, stock keys. */
function seriesMapOf(inputs: FxRuleInputs): Record<string, SeriesPoint[] | undefined> {
  const map: Record<string, SeriesPoint[] | undefined> = {};
  for (const id of FX_PAIR_IDS) {
    const p = inputs.pairs[id];
    if (p !== undefined) map[id] = [...p.series];
  }
  map.dollar = [...inputs.dollar.series];
  map.gold = inputs.gold.series === undefined ? undefined : [...inputs.gold.series];
  map.sp500 = inputs.stocks.sp500;
  map.n225 = inputs.stocks.n225;
  map.stoxx50 = inputs.stocks.stoxx50;
  return map;
}

/* ---------------------- the rule table itself -------------------------- */

/** Evaluate the whole rule table. Pure; returns all seven states in rule order. */
export function evaluateFxRules(inputs: FxRuleInputs): FxRuleState[] {
  const out: FxRuleState[] = [];
  for (const def of FX_RULES) {
    out.push(evaluateRule(def.id, inputs));
  }
  // The downgrade pass (§6.4): Warning + Not-holding → Watch, not counted.
  for (let i = 0; i < out.length; i++) {
    const r = out[i]!;
    if (r.outcome === 'warning' && r.pattern.status === 'not_holding') {
      out[i] = { ...r, outcome: 'watch', counted: false, downgraded: true };
    }
  }
  return out;
}

type FxChartSeriesLike = { id: string; points: number[] };

/** The no-data rule state: never a guess (§6.3's fifth outcome). */
function nodataRule(
  id: FxRuleId,
  chart: { expect: 'together' | 'opposite'; series: FxChartSeriesLike[] },
  pattern: FxPatternCheck,
  numbers: Record<string, number | undefined>,
): FxRuleState {
  return {
    id,
    outcome: 'nodata',
    counted: false,
    numbers: numbersOf(Object.entries(numbers)),
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern,
    chart: chart.series.length >= 2 ? chart : { expect: chart.expect, series: [] },
  };
}

function evaluateRule(id: FxRuleId, inputs: FxRuleInputs): FxRuleState {
  const def = fxRuleDefinition(id);
  const seriesMap = seriesMapOf(inputs);
  const chart = { expect: def.expect, series: chartSeries(inputs, def.chartSeries) };
  const pattern: FxPatternCheck = def.hasPatternCheck
    ? patternCheck(seriesMap[def.chartSeries[0]!], seriesMap[def.chartSeries[1]!], def.expect)
    : { status: 'nodata', agreeWeeks: 0, ofWeeks: PATTERN_WEEKS, weeks: [] };

  switch (id) {
    case 'r1_risk_mood': {
      const audjpy = inputs.pairs.audjpy?.chg;
      const eurjpy = inputs.pairs.eurjpy?.chg;
      const sp = inputs.stocks.sp500_m1;
      // The spec's no-data letter (§6.3): the rule's other-section input
      // (S&P 500) is missing AND the fear signal is unreadable → the row
      // says "Not enough data right now"; never a guess. (A readable fear
      // leg can still confirm a warning on its own.)
      if (audjpy === undefined || (sp === undefined && !inputs.fearAvailable)) {
        return nodataRule(id, chart, pattern, { audjpy_m1: audjpy?.m1, sp500_m1: sp });
      }
      const confirmed = eurjpy !== undefined && eurjpy.m1 <= R1_CONFIRM_EURJPY_M1;
      const stockConfirm = sp !== undefined && sp <= R1_SP500_M1_WARN;
      const confirmMet = stockConfirm || inputs.fear;
      const numbers = numbersOf([
        ['audjpy_m1', audjpy.m1],
        ['sp500_m1', sp],
        ['eurjpy_m1', eurjpy?.m1],
        ['market_fear', inputs.fear ? 1 : undefined],
      ]);
      const legs: FxLeg[] = [leg('audjpy_m1', audjpy.m1, R1_AUDJPY_M1_WARN, audjpy.m1 <= R1_AUDJPY_M1_WARN)];
      pushLeg(legs, 'sp500_m1', sp, R1_SP500_M1_WARN, stockConfirm);
      if (inputs.fear) legs.push(leg('market_fear', 1, 1, true));
      const okSide = audjpy.m1 >= R1_AUDJPY_M1_OK && sp !== undefined && sp >= R1_SP500_M1_OK;
      let outcome: FxRuleState['outcome'] = 'quiet';
      if (audjpy.m1 <= R1_AUDJPY_M1_WARN && confirmMet) outcome = 'warning';
      else if (audjpy.m1 <= R1_AUDJPY_M1_WARN) outcome = 'watch';
      else if (okSide) outcome = 'supportive';
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: confirmed ? ['eurjpy'] : [],
        progress: progressOf(audjpy.m1, R1_AUDJPY_M1_WARN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r2_carry_trade': {
      const usdjpy = inputs.pairs.usdjpy?.chg;
      const nikkei = inputs.stocks.nikkei_m1;
      if (usdjpy === undefined) return nodataRule(id, chart, pattern, { usdjpy_m1: undefined });
      const numbers = numbersOf([
        ['usdjpy_m1', usdjpy.m1],
        ['usdjpy_m3', usdjpy.m3],
        ['nikkei_m1', nikkei],
      ]);
      const unwind = usdjpy.m1 <= R2_USDJPY_M1_WARN && nikkei !== undefined && nikkei <= R2_NIKKEI_M1_WARN;
      const pressure = usdjpy.m3 >= R2_USDJPY_M3_PRESSURE;
      const legs: FxLeg[] = [
        leg('usdjpy_m1', usdjpy.m1, R2_USDJPY_M1_WARN, unwind),
        leg('usdjpy_m3', usdjpy.m3, R2_USDJPY_M3_PRESSURE, pressure),
      ];
      pushLeg(legs, 'nikkei_m1', nikkei, R2_NIKKEI_M1_WARN, nikkei !== undefined && nikkei <= R2_NIKKEI_M1_WARN);
      const outcome: FxRuleState['outcome'] = unwind ? 'warning' : pressure ? 'watch' : 'quiet';
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: progressOf(usdjpy.m1, R2_USDJPY_M1_WARN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r3_dollar_strength': {
      const d = inputs.dollar.chg;
      const numbers = numbersOf([['dollar_m3', d.m3], ['dollar_m1', d.m1]]);
      // v1.3 (CR §3.1): the fast one-month leg fires the rule on its own —
      // M1 ≥ +3.0 or M3 ≥ +4.0 → Warning; M1 ≤ −3.0 or M3 ≤ −4.0 →
      // Supportive. `variant` records WHICH leg fired so the sentence names
      // its period honestly (the M1 leg wins the wording when both fire:
      // the fast trigger is the story of the week).
      const m1Strong = d.m1 >= R3_DOLLAR_M1_STRONG;
      const m1Weak = d.m1 <= R3_DOLLAR_M1_WEAK;
      const m3Strong = d.m3 >= R3_DOLLAR_M3_STRONG;
      const m3Weak = d.m3 <= R3_DOLLAR_M3_WEAK;
      const legs: FxLeg[] = [
        leg('dollar_m1_up', d.m1, R3_DOLLAR_M1_STRONG, m1Strong),
        leg('dollar_m1_down', d.m1, R3_DOLLAR_M1_WEAK, m1Weak),
        leg('dollar_m3_up', d.m3, R3_DOLLAR_M3_STRONG, m3Strong),
        leg('dollar_m3_down', d.m3, R3_DOLLAR_M3_WEAK, m3Weak),
      ];
      let outcome: FxRuleState['outcome'] = 'quiet';
      let variant: FxRuleState['variant'] | undefined;
      if (m1Strong || m3Strong) {
        outcome = 'warning';
        variant = m1Strong ? 'm1' : 'm3';
      } else if (m1Weak || m3Weak) {
        outcome = 'supportive';
        variant = m1Weak ? 'm1' : 'm3';
      }
      // §6.7 + CR §3.1: progress counts the NEARER of the two legs
      // (M1 against ±3.0, M3 against ±4.0), either direction.
      const progress = Math.max(
        0,
        Math.min(100, Math.max((Math.abs(d.m1) / R3_DOLLAR_M1_STRONG) * 100, (Math.abs(d.m3) / R3_DOLLAR_M3_STRONG) * 100)),
      );
      return { id, outcome, counted: outcome === 'warning', variant, numbers, confirmedBy: [], progress, legs, pattern, chart };
    }
    case 'r4_money_hiding': {
      const d = inputs.dollar.chg;
      const sp = inputs.stocks.sp500_m1;
      const g = inputs.gold.m1;
      if (sp === undefined) return nodataRule(id, chart, pattern, { sp500_m1: undefined });
      const numbers = numbersOf([
        ['sp500_m1', sp],
        ['dollar_m1', d.m1],
        ['gold_m1', g],
      ]);
      const flight = d.m1 >= R4_DOLLAR_M1_UP && sp <= R4_SP500_M1_DOWN;
      const wobble = d.m1 <= R4_DOLLAR_M1_DOWN && sp <= R4_SP500_M1_DOWN && g !== undefined && g >= R4_GOLD_M1_UP;
      const legs: FxLeg[] = [
        leg('sp500_m1', sp, R4_SP500_M1_DOWN, sp <= R4_SP500_M1_DOWN),
        leg('dollar_m1_up', d.m1, R4_DOLLAR_M1_UP, d.m1 >= R4_DOLLAR_M1_UP),
        leg('dollar_m1_down', d.m1, R4_DOLLAR_M1_DOWN, d.m1 <= R4_DOLLAR_M1_DOWN),
      ];
      pushLeg(legs, 'gold_m1', g, R4_GOLD_M1_UP, g !== undefined && g >= R4_GOLD_M1_UP);
      const outcome: FxRuleState['outcome'] = wobble || flight ? 'warning' : 'quiet';
      return {
        id,
        outcome,
        variant: wobble ? 'wobble' : flight ? 'flight' : undefined,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: progressOf(sp, R4_SP500_M1_DOWN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r5_china_link': {
      const cny = inputs.pairs.usdcny?.chg;
      const aud = inputs.pairs.audusd?.chg;
      if (cny === undefined && aud === undefined) return nodataRule(id, chart, pattern, {});
      const numbers = numbersOf([
        ['usdcny_m3', cny?.m3],
        ['audusd_m3', aud?.m3],
      ]);
      const cnyWeak = cny !== undefined && cny.m3 >= R5_USDCNY_M3_WEAK;
      const audFall = aud !== undefined && aud.m3 <= R5_AUDUSD_M3_FALL;
      const cnyFirm = cny !== undefined && cny.m3 <= R5_USDCNY_M3_FIRM;
      const audRise = aud !== undefined && aud.m3 >= R5_AUDUSD_M3_RISE;
      let outcome: FxRuleState['outcome'] = 'quiet';
      if (cnyWeak && audFall) outcome = 'warning';
      else if (cnyFirm && audRise) outcome = 'supportive';
      else if (cnyWeak || audFall) outcome = 'watch'; // one of the two only (§6.3)
      const legs: FxLeg[] = [];
      pushLeg(legs, 'usdcny_m3', cny?.m3, R5_USDCNY_M3_WEAK, cnyWeak);
      pushLeg(legs, 'audusd_m3', aud?.m3, R5_AUDUSD_M3_FALL, audFall);
      const main = cny?.m3;
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: main === undefined ? 0 : progressOf(main, R5_USDCNY_M3_WEAK),
        legs,
        pattern,
        chart,
      };
    }
    case 'r6_europe_worry': {
      const eurchf = inputs.pairs.eurchf?.chg;
      const stoxx = inputs.stocks.stoxx50_m1;
      if (eurchf === undefined) return nodataRule(id, chart, pattern, { eurchf_m1: undefined });
      const numbers = numbersOf([
        ['eurchf_m1', eurchf.m1],
        ['stoxx50_m1', stoxx],
      ]);
      const francFall = eurchf.m1 <= R6_EURCHF_M1_WARN;
      const stocksFall = stoxx !== undefined && stoxx <= R6_EUROSTOXX_M1_WARN;
      let outcome: FxRuleState['outcome'] = 'quiet';
      if (francFall && stocksFall) outcome = 'warning';
      else if (francFall) outcome = 'watch';
      const legs: FxLeg[] = [leg('eurchf_m1', eurchf.m1, R6_EURCHF_M1_WARN, francFall)];
      pushLeg(legs, 'stoxx50_m1', stoxx, R6_EUROSTOXX_M1_WARN, stocksFall);
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: progressOf(eurchf.m1, R6_EURCHF_M1_WARN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r7_dollar_or_euro': {
      const eurusd = inputs.pairs.eurusd?.chg;
      const d = inputs.dollar.chg;
      if (eurusd === undefined) return nodataRule(id, chart, pattern, { eurusd_m1: undefined });
      const numbers = numbersOf([
        ['eurusd_m1', eurusd.m1],
        ['dollar_m1', d.m1],
      ]);
      if (Math.abs(eurusd.m1) < R7_EURUSD_M1_MOVE) {
        // Below the trigger the context card stays away entirely (§9.3).
        return { id, outcome: 'quiet', counted: false, numbers, confirmedBy: [], progress: 0, legs: [], pattern, chart };
      }
      // v1.3 — the CORRECTED R7 (CR §3.3, fix B1): work in DOLLAR
      // strength. EUR/USD down means the dollar got stronger against the
      // euro, so e = −eurusd.m1 (positive = the dollar gained on the euro).
      // The old code compared the dollar measure with EUR/USD itself, so a
      // euro fall read as "the dollar barely moved".
      const e = -eurusd.m1;
      const sameWay = Math.sign(d.m1) === Math.sign(e);
      const dollarLed = sameWay && Math.abs(d.m1) >= R7_DOLLAR_FOLLOWS;
      const euroLed = Math.abs(d.m1) < R7_DOLLAR_QUIET;
      if (!dollarLed && !euroLed) {
        // Between 1.0 and 1.5, or the dollar moved the OPPOSITE way to the
        // euro: show NO card — do not guess (CR §3.3 item 5).
        return { id, outcome: 'quiet', counted: false, numbers, confirmedBy: [], progress: 0, legs: [], pattern, chart };
      }
      return {
        id,
        outcome: 'context',
        variant: dollarLed ? 'dollar-led' : 'euro-led',
        counted: false,
        numbers,
        confirmedBy: [],
        progress: 0,
        legs: [
          leg('eurusd_m1', eurusd.m1, R7_EURUSD_M1_MOVE, true),
          leg('dollar_m1', d.m1, R7_DOLLAR_FOLLOWS, dollarLed),
        ],
        pattern,
        chart,
      };
    }
  }
}
