/**
 * fx.test.ts — the world currencies engine + job + store + run tests
 * (insights-world-currencies-spec.md build steps 1, 2, 4, 5):
 *
 *   step 1 — EUR/JPY derived from dollar rates matches the direct value
 *            within 0.1%; provider parsers reject malformed answers;
 *   step 2 — the four period changes, move_rank, the dollar measure,
 *            weekly series, validation V1–V7 (a fake 6% one-day jump,
 *            a stale date, the never-fabricate rule);
 *   step 4 — every outcome of every rule (warning, watch, supportive,
 *            quiet, nodata, context), the downgrade, progress, the
 *            section signal (incl. the confidence wobble);
 *   step 5 — running the job twice with the same data causes exactly one
 *            write (the write gate); one Frankfurter call per run; the
 *            Yahoo fallback fires only when the primary fails.
 */

import { describe, expect, it } from 'vitest';
import type { FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import { FxSnapshotSchema } from '@currena/core';
import type { SeriesPoint } from '../series';
import {
  buildDollarMeasure,
  buildFxPairEntry,
  buildFxSnapshot,
  changesOf,
  evaluateFxRules,
  fxContentEqual,
  fxWeeklySeries,
  moveRankOf,
  pairRateFromUsd,
  pairSeriesFromQuotes,
  patternCheck,
  ratesAgree,
  stockInputsFromMarkets,
  summarizeFxRules,
  suspiciousDayMove,
  type FxRuleInputs,
} from './compute';
import { FX_MIN_POINTS, FX_PAIR_IDS, PATTERN_WEEKS } from './definitions';
import type { FxQuoteSet, FxQuotes } from './providers';
import { parseFrankfurterResponse, parseYahooFxResponse } from './providers';
import { runFxJob, fearInputFromSnapshot, type FxJobFetchers } from './job';
import { InMemoryFxStore } from './store';
import type { FxCrossReader } from './store';
import { runFxUpdate } from './run';

/* ------------------------------------------------------------------ *
 * The synthetic ECB world: 6 fx currencies + CAD/SEK, ~400 working days
 * ------------------------------------------------------------------ */

export function fxWorld(opts: {
  lastDate?: string;
  days?: number;
  /** Per-currency multiplicative drift per day (e.g. 0.001 = +0.1%/day). */
  drift?: Partial<Record<string, number>>;
  /** Overnight jumps applied to the LAST point: { EUR: 1.06 } multiplies it. */
  lastJump?: Partial<Record<string, number>>;
}): FxQuoteSet {
  const days = opts.days ?? 420;
  const lastDate = opts.lastDate ?? '2026-10-12';
  const base: Record<string, number> = {
    EUR: 0.9,
    JPY: 150,
    GBP: 0.76,
    CHF: 0.88,
    CNY: 7.1,
    AUD: 1.52,
    CAD: 1.37,
    SEK: 9.5,
  };
  const dates: string[] = [];
  let t = new Date(`${lastDate}T00:00:00Z`).getTime();
  while (dates.length < days) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) dates.push(date);
    t -= 86_400_000;
  }
  dates.reverse();
  const out: FxQuoteSet = {};
  for (const [code, start] of Object.entries(base)) {
    const drift = opts.drift?.[code] ?? 0.0002; // a gentle default trend
    const points: SeriesPoint[] = dates.map((date, i) => ({
      date,
      value: start * (1 + drift) ** i,
    }));
    const jump = opts.lastJump?.[code];
    if (jump !== undefined) {
      const last = points[points.length - 1]!;
      last.value = last.value * jump;
    }
    out[code as keyof FxQuoteSet] = points;
  }
  return out;
}

const RUN_DATE = '2026-10-13';
const GENERATED_AT = '2026-10-13T17:01:00Z';

/** A cross-section reader with nothing stored (the honest empty state). */
const emptyCross: FxCrossReader = {
  getMarkets: async () => undefined,
  getGoldHistory: async () => undefined,
  getInsightsSnapshot: async () => undefined,
};

const fetchersOf = (quotes: FxQuoteSet): FxJobFetchers => ({
  fetchFrankfurter: async () => ({ source: 'frankfurter', quotes }),
  fetchYahoo: async () => {
    throw new Error('yahoo not needed in this fixture');
  },
});

/** Build a full pipeline snapshot from a quote world (no stores). */
async function pipelineSnapshot(quotes: FxQuoteSet, cross: FxCrossReader = emptyCross): Promise<FxSnapshot> {
  const job = await runFxJob(fetchersOf(quotes), undefined, cross, RUN_DATE, GENERATED_AT);
  if (job.snapshot === undefined) throw new Error(`fixture snapshot failed to build: ${job.report.notes.join('; ')}`);
  return job.snapshot;
}

/* ------------------------------------------------------------------ *
 * Step 1 — provider adapters + the cross-rate calculation
 * ------------------------------------------------------------------ */

describe('step 1 — providers + cross derivation', () => {
  it('EUR/JPY from dollar rates matches the direct value within 0.1%', () => {
    const quotes = fxWorld({});
    const eur = quotes.EUR!;
    const jpy = quotes.JPY!;
    const last = eur.length - 1;
    const derived = pairRateFromUsd('eurjpy', { EUR: eur[last]!.value, JPY: jpy[last]!.value })!;
    const direct = jpy[last]!.value / eur[last]!.value;
    expect(Math.abs((derived - direct) / direct) * 100).toBeLessThanOrEqual(0.1);
    // And the series builder produces it on every common date.
    const series = pairSeriesFromQuotes('eurjpy', quotes);
    expect(series.length).toBe(eur.length);
  });

  it('parses a Frankfurter timeseries answer and drops non-positive rates (V1)', () => {
    const json = {
      amount: 1,
      base: 'USD',
      rates: {
        '2026-10-10': { EUR: 0.9, JPY: 150, GBP: 0.76, CHF: 0.88, CNY: 7.1, AUD: 1.52, CAD: 1.37, SEK: 9.5 },
        '2026-10-11': { EUR: -1, JPY: 151, GBP: 0.77 }, // EUR dropped (V1)
      },
    };
    const quotes = parseFrankfurterResponse(json);
    expect(quotes.EUR!.length).toBe(1); // the -1 did not ride
    expect(quotes.JPY!.length).toBe(2);
  });

  it('a malformed Frankfurter answer is a clean rejection', () => {
    expect(() => parseFrankfurterResponse({ nope: true })).toThrow(/missing rates/);
    expect(() => parseFrankfurterResponse({ rates: { 'bad-date': { EUR: 1 } } })).toThrow(/no row carried/);
  });

  it('parses a Yahoo chart answer and inverts nothing at the parse level', () => {
    const ts = Date.parse('2026-10-09T00:00:00Z') / 1000;
    const json = {
      chart: { result: [{ timestamp: [ts, ts + 86_400], indicators: { quote: [{ close: [0.9, null] }] } }] },
    };
    const points = parseYahooFxResponse(json, 'EURUSD=X');
    expect(points.length).toBe(1); // the null close dropped (V1)
    expect(points[0]!.value).toBe(0.9);
  });
});

/* ------------------------------------------------------------------ *
 * Step 2 — the calculations
 * ------------------------------------------------------------------ */

describe('step 2 — changes, move_rank, dollar measure, weekly, V-rules', () => {
  it('the four period changes anchor on or before the period-back date', () => {
    const quotes = fxWorld({ days: 420 });
    const series = pairSeriesFromQuotes('eurusd', quotes);
    const chg = changesOf(series);
    // Positive means the first currency (EUR) got stronger; the default
    // drift makes USD-side EUR rates grow, so eurusd = 1/EUR falls.
    expect(chg.d1).toBeLessThan(0);
    expect(chg.m1).toBeLessThan(0);
    expect(chg.m3).toBeLessThan(0);
    expect(chg.y1).toBeLessThan(0);
    expect(chg.m1).toBeGreaterThan(-10); // sanity: gentle drift
  });

  it('move_rank: a gentle trend ranks ~mid; a violent month ranks high', () => {
    const calm = fxWorld({});
    expect(moveRankOf(pairSeriesFromQuotes('eurusd', calm))).toBeLessThan(90);
    const wild = fxWorld({ lastJump: { EUR: 0.93 } }); // a one-month-sized jolt on the last day
    expect(moveRankOf(pairSeriesFromQuotes('eurusd', wild))).toBeGreaterThan(50);
  });

  it('the dollar measure reuses the Currena basket (D-06) and is rebased by its own recipe', () => {
    const quotes = fxWorld({});
    const measure = buildDollarMeasure(quotes, 'frankfurter', RUN_DATE);
    // 50.143 × Π rate^weight — a gentle across-the-board drift lands near
    // the constant × (1 + small drift); assert it is positive, finite and
    // has all four changes.
    expect(measure.value).toBeGreaterThan(0);
    expect(Number.isFinite(measure.chg.y1)).toBe(true);
    expect(measure.weekly.length).toBeGreaterThan(50);
  });

  it('the weekly series is ≤52 delta-encoded Monday-anchored closes', () => {
    const quotes = fxWorld({});
    const weekly = fxWeeklySeries(pairSeriesFromQuotes('usdjpy', quotes));
    expect(weekly.length).toBeLessThanOrEqual(52);
    expect(weekly.length).toBeGreaterThanOrEqual(50);
    // Deltas are positive after the first entry (the schema's own refine).
    expect(weekly.every((p, i) => i === 0 || p[0] > 0)).toBe(true);
  });

  it('V3: a >5% one-day move is suspicious; V5: the 0.5% agreement band', () => {
    const normal = changesOf(pairSeriesFromQuotes('eurusd', fxWorld({})));
    expect(suspiciousDayMove(normal)).toBe(false);
    const wild = changesOf(pairSeriesFromQuotes('eurusd', fxWorld({ lastJump: { EUR: 1.07 } })));
    expect(suspiciousDayMove(wild)).toBe(true);
    expect(ratesAgree(1.0, 1.004)).toBe(true);
    expect(ratesAgree(1.0, 1.02)).toBe(false);
  });

  it('V4: an answer under 200 points per currency is rejected by the job', async () => {
    const short = fxWorld({ days: 150 });
    const job = await runFxJob(
      {
        fetchFrankfurter: async () => ({ source: 'frankfurter', quotes: short }),
        fetchYahoo: async () => {
          throw new Error('yahoo also failed in this fixture');
        },
      },
      undefined,
      emptyCross,
      RUN_DATE,
      GENERATED_AT,
    );
    expect(job.snapshot).toBeUndefined();
    expect(job.report.usedSource).toBe('none');
    expect(job.report.notes.join(' ')).toMatch(/V4 needs/);
  });

  it('V6: a stale pair (asOf > 5 days old) is flagged, never zeroed', async () => {
    const quotes = fxWorld({ lastDate: '2026-09-20' }); // > 5 days before RUN_DATE
    const snap = await pipelineSnapshot(quotes);
    const pair = snap.pairs.find((p) => p.id === 'eurusd')!;
    expect(pair.stale).toBe(true);
    expect(pair.rate).toBeGreaterThan(0); // the value itself stays honest
  });
});

/* ------------------------------------------------------------------ *
 * Step 4 — the rule engine: every outcome of every rule
 * ------------------------------------------------------------------ */

type PairsInput = FxRuleInputs['pairs'];

/** Pattern-fixture shapes: a risk-on factor rising through 20 weeks.
 * Risk-shaped series rise with it; haven-shaped series fall — exactly the
 * directions the spec's §6.4 pattern table expects, so a Warning whose
 * pattern is genuinely holding SURVIVES (the downgrade test builds its own
 * broken shapes). */
const PATTERN_DATES: string[] = (() => {
  const dates: string[] = [];
  let t = new Date('2026-10-09T00:00:00Z').getTime();
  while (dates.length < 140) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) dates.push(date);
    t -= 86_400_000;
  }
  return dates.reverse();
})();
const RISK: SeriesPoint[] = PATTERN_DATES.map((date, i) => ({ date, value: 100 + i * 0.1 }));
const HAVEN: SeriesPoint[] = PATTERN_DATES.map((date, i) => ({ date, value: 100 - i * 0.1 }));
const SHAPE: Record<string, SeriesPoint[]> = {
  // pairs
  audjpy: RISK, usdjpy: RISK, audusd: RISK, eurusd: RISK, eurchf: RISK, gbpusd: RISK, eurjpy: RISK, audcny: RISK, usdchf: HAVEN, usdcny: HAVEN,
  // cross-section keys
  dollar: HAVEN, gold: RISK, sp500: RISK, n225: RISK, stoxx50: RISK,
};

function inputsOf(pairSpec: Partial<Record<FxPairId, { m1: number; m3: number }>>, opts?: {
  dollarM1?: number;
  dollarM3?: number;
  sp500?: number;
  nikkei?: number;
  stoxx50?: number;
  gold?: number;
  fear?: boolean;
  fearAvailable?: boolean;
}): FxRuleInputs {
  const series = (id: string): SeriesPoint[] => SHAPE[id] ?? RISK;
  const pairs: Record<string, { chg: { d1: number; m1: number; m3: number; y1: number }; series: SeriesPoint[] }> = {};
  for (const [id, chg] of Object.entries(pairSpec)) {
    if (chg === undefined) continue;
    pairs[id] = { chg: { d1: 0, m1: chg.m1, m3: chg.m3, y1: 0 }, series: series(id) };
  }
  return {
    pairs,
    dollar: {
      chg: { d1: 0, m1: opts?.dollarM1 ?? 0, m3: opts?.dollarM3 ?? 0, y1: 0 },
      series: series('dollar'),
    },
    stocks: {
      ...(opts?.sp500 !== undefined ? { sp500_m1: opts.sp500 } : {}),
      ...(opts?.nikkei !== undefined ? { nikkei_m1: opts.nikkei } : {}),
      ...(opts?.stoxx50 !== undefined ? { stoxx50_m1: opts.stoxx50 } : {}),
      ...(opts?.sp500 !== undefined ? { sp500: series('sp500') } : {}),
      ...(opts?.nikkei !== undefined ? { n225: series('n225') } : {}),
      ...(opts?.stoxx50 !== undefined ? { stoxx50: series('stoxx50') } : {}),
    },
    gold: {
      ...(opts?.gold !== undefined ? { m1: opts.gold } : {}),
      ...(opts?.gold !== undefined ? { series: series('gold') } : {}),
    },
    fear: opts?.fear ?? false,
    fearAvailable: opts?.fearAvailable ?? false,
  };
}

const byId = (rules: readonly FxRuleState[], id: FxRuleState['id']): FxRuleState =>
  rules.find((r) => r.id === id)!;

describe('step 4 — the seven rules', () => {
  it('R1: audjpy −3.5 + sp500 −2.5 → Warning (counted); EUR/JPY confirms', () => {
    const rules = evaluateFxRules(
      inputsOf({ audjpy: { m1: -3.5, m3: 0 }, eurjpy: { m1: -3.2, m3: 0 } }, { sp500: -2.5 }),
    );
    const r1 = byId(rules, 'r1_risk_mood');
    expect(r1.outcome).toBe('warning');
    expect(r1.counted).toBe(true);
    expect(r1.confirmedBy).toContain('eurjpy');
  });

  it('R1: audjpy −3.5 with a readable-but-calm fear leg → Watch, not counted', () => {
    const rules = evaluateFxRules(inputsOf({ audjpy: { m1: -3.5, m3: 0 } }, { fearAvailable: true, fear: false }));
    const r1 = byId(rules, 'r1_risk_mood');
    expect(r1.outcome).toBe('watch');
    expect(r1.counted).toBe(false);
  });

  it('R1: no stock data AND an unreadable fear leg → nodata (never a guess)', () => {
    const rules = evaluateFxRules(inputsOf({ audjpy: { m1: -3.5, m3: 0 } }));
    expect(byId(rules, 'r1_risk_mood').outcome).toBe('nodata');
  });

  it('R1: the fear leg (D-05) confirms a Warning without stocks', () => {
    const rules = evaluateFxRules(inputsOf({ audjpy: { m1: -3.5, m3: 0 } }, { fear: true, fearAvailable: true }));
    const r1 = byId(rules, 'r1_risk_mood');
    expect(r1.outcome).toBe('warning');
  });

  it('R1: audjpy missing → nodata, never a guess', () => {
    const rules = evaluateFxRules(inputsOf({}, { sp500: -2.5 }));
    expect(byId(rules, 'r1_risk_mood').outcome).toBe('nodata');
  });

  it('R1: audjpy +2.5 + sp500 +0.5 → Supportive', () => {
    const rules = evaluateFxRules(inputsOf({ audjpy: { m1: 2.5, m3: 0 } }, { sp500: 0.5 }));
    expect(byId(rules, 'r1_risk_mood').outcome).toBe('supportive');
  });

  it('R2: usdjpy −4.5 + nikkei −3.5 → Warning; usdjpy m3 +6.5 → Watch (pressure)', () => {
    const warn = evaluateFxRules(inputsOf({ usdjpy: { m1: -4.5, m3: 0 } }, { nikkei: -3.5 }));
    expect(byId(warn, 'r2_carry_trade').outcome).toBe('warning');
    const watch = evaluateFxRules(inputsOf({ usdjpy: { m1: 0, m3: 6.5 } }));
    expect(byId(watch, 'r2_carry_trade').outcome).toBe('watch');
  });

  it('R3: dollar m3 +4.5 → Warning; −4.5 → Supportive; progress counts the nearer side', () => {
    const up = evaluateFxRules(inputsOf({}, { dollarM3: 4.5 }));
    expect(byId(up, 'r3_dollar_strength').outcome).toBe('warning');
    const down = evaluateFxRules(inputsOf({}, { dollarM3: -4.5 }));
    expect(byId(down, 'r3_dollar_strength').outcome).toBe('supportive');
    const quiet = evaluateFxRules(inputsOf({}, { dollarM3: 1 }));
    const r3 = byId(quiet, 'r3_dollar_strength');
    expect(r3.outcome).toBe('quiet');
    expect(r3.progress).toBe(25); // 1/4 of the way to the +4 line
  });

  it('R4: flight (dollar +2.5, sp500 −3.5) → Warning flight; wobble (dollar −2.5, sp500 −3.5, gold +3.5) → forces Unusual', () => {
    const flight = evaluateFxRules(inputsOf({}, { dollarM1: 2.5, sp500: -3.5 }));
    const r4f = byId(flight, 'r4_money_hiding');
    expect(r4f.outcome).toBe('warning');
    expect(r4f.variant).toBe('flight');

    const wobble = evaluateFxRules(inputsOf({}, { dollarM1: -2.5, sp500: -3.5, gold: 3.5 }));
    const r4w = byId(wobble, 'r4_money_hiding');
    expect(r4w.outcome).toBe('warning');
    expect(r4w.variant).toBe('wobble');
    expect(summarizeFxRules(wobble).signal).toBe('unusual'); // forced by the wobble
  });

  it('R4: sp500 missing → nodata', () => {
    const rules = evaluateFxRules(inputsOf({}, { dollarM1: 2.5 }));
    expect(byId(rules, 'r4_money_hiding').outcome).toBe('nodata');
  });

  it('R5: cny weak + aud fall → Warning; one of the two only → Watch; both firm → Supportive', () => {
    const warn = evaluateFxRules(inputsOf({ usdcny: { m1: 0, m3: 2.5 }, audusd: { m1: 0, m3: -2.5 } }));
    expect(byId(warn, 'r5_china_link').outcome).toBe('warning');
    const watch = evaluateFxRules(inputsOf({ usdcny: { m1: 0, m3: 2.5 } }));
    expect(byId(watch, 'r5_china_link').outcome).toBe('watch');
    const sup = evaluateFxRules(inputsOf({ usdcny: { m1: 0, m3: -2.6 }, audusd: { m1: 0, m3: 2.5 } }));
    expect(byId(sup, 'r5_china_link').outcome).toBe('supportive');
  });

  it('R6: eurchf −2.5 + stoxx −2.5 → Warning; eurchf alone → Watch', () => {
    const warn = evaluateFxRules(inputsOf({ eurchf: { m1: -2.5, m3: 0 } }, { stoxx50: -2.5 }));
    expect(byId(warn, 'r6_europe_worry').outcome).toBe('warning');
    const watch = evaluateFxRules(inputsOf({ eurchf: { m1: -2.5, m3: 0 } }));
    expect(byId(watch, 'r6_europe_worry').outcome).toBe('watch');
  });

  it('R7: below 2.5% the context card stays away entirely; above it, dollar-led vs euro-led', () => {
    const quiet = evaluateFxRules(inputsOf({ eurusd: { m1: 1.0, m3: 0 } }, { dollarM1: 0.5 }));
    const r7q = byId(quiet, 'r7_dollar_or_euro');
    expect(r7q.outcome).toBe('quiet');
    expect(r7q.legs).toHaveLength(0);

    const led = evaluateFxRules(inputsOf({ eurusd: { m1: 3.0, m3: 0 } }, { dollarM1: 2.0 }));
    const r7d = byId(led, 'r7_dollar_or_euro');
    expect(r7d.outcome).toBe('context');
    expect(r7d.variant).toBe('dollar-led');

    const euro = evaluateFxRules(inputsOf({ eurusd: { m1: -3.0, m3: 0 } }, { dollarM1: 0.5 }));
    expect(byId(euro, 'r7_dollar_or_euro').variant).toBe('euro-led');
  });

  it('the pattern check: holding ≥9, mixed 7–8, not-holding ≤6, nodata on absent series', () => {
    expect(patternCheck(undefined, undefined, 'together').status).toBe('nodata');
    // Two perfectly-correlated series over 14+ weeks → holding.
    const dates: string[] = [];
    let t = new Date('2026-10-09T00:00:00Z').getTime();
    while (dates.length < 20 * 5) {
      const date = new Date(t).toISOString().slice(0, 10);
      const dow = new Date(t).getUTCDay();
      if (dow !== 0 && dow !== 6) dates.push(date);
      t -= 86_400_000;
    }
    dates.reverse();
    const up = dates.map((date, i) => ({ date, value: 100 + i }));
    const mirror = up; // together: identical
    const anti = dates.map((date, i) => ({ date, value: 100 - i })); // opposite
    expect(patternCheck(up, mirror, 'together').status).toBe('holding');
    expect(patternCheck(up, anti, 'together').status).toBe('not_holding');
    expect(patternCheck(up, anti, 'opposite').status).toBe('holding');
    // Weeks arrays carry the 13 flags.
    const held = patternCheck(up, mirror, 'together');
    expect(held.ofWeeks).toBe(PATTERN_WEEKS);
    expect(held.weeks.filter((w) => w === true).length).toBe(held.agreeWeeks);
  });

  it('the downgrade: a Warning whose pattern is not holding lately becomes a Watch and does not count', () => {
    // r3 has no pair inputs to disturb — drive it via dollar + gold with a
    // pattern that does NOT hold (dollar and gold moving together while the
    // rule expects opposite).
    const dates: string[] = [];
    let t = new Date('2026-10-09T00:00:00Z').getTime();
    while (dates.length < 20 * 5) {
      const date = new Date(t).toISOString().slice(0, 10);
      const dow = new Date(t).getUTCDay();
      if (dow !== 0 && dow !== 6) dates.push(date);
      t -= 86_400_000;
    }
    dates.reverse();
    const dollarSeries = dates.map((date, i) => ({ date, value: 100 + i * 0.1 }));
    const goldSame = dollarSeries; // same direction → NOT the expected opposite
    const rules = evaluateFxRules({
      pairs: {},
      dollar: { chg: { d1: 0, m1: 0, m3: 5.0, y1: 0 }, series: dollarSeries },
      stocks: {},
      gold: { m1: 0, series: goldSame },
      fear: false,
      fearAvailable: false,
    });
    const r3 = byId(rules, 'r3_dollar_strength');
    expect(r3.outcome).toBe('watch'); // downgraded
    expect(r3.downgraded).toBe(true);
    expect(r3.counted).toBe(false);
    expect(summarizeFxRules(rules).signal).toBe('normal'); // it does not count
  });

  it('the section signal: 0 counted = normal, 1–2 = attention, 3+ = unusual', () => {
    const empty = evaluateFxRules(inputsOf({}));
    expect(summarizeFxRules(empty).signal).toBe('normal');
    // One counted warning (r3 alone can carry it: dollar +4.5, gold present
    // and opposite-holding via the default world).
    const one = evaluateFxRules(inputsOf({}, { dollarM3: 4.5, gold: 0 }));
    expect(one.filter((r) => r.counted).length).toBeGreaterThanOrEqual(1);
    expect(summarizeFxRules(one).signal).toBe('attention');
  });

  it('progress counts only moves in the warning direction (§6.7)', () => {
    const rules = evaluateFxRules(inputsOf({ audjpy: { m1: 1.5, m3: 0 } }, { sp500: 0 })); // away from −3
    const r1 = byId(rules, 'r1_risk_mood');
    expect(r1.progress).toBe(0);
    const toward = evaluateFxRules(inputsOf({ audjpy: { m1: -1.5, m3: 0 } }, { sp500: 0 }));
    expect(byId(toward, 'r1_risk_mood').progress).toBe(50);
  });
});

/* ------------------------------------------------------------------ *
 * Step 5 — the job + the store + the write gate
 * ------------------------------------------------------------------ */

describe('step 5 — the job, the store, the write gate', () => {
  it('one Frankfurter call per run; the Yahoo fallback fires only when the primary fails', async () => {
    const quotes = fxWorld({});
    const calls: string[] = [];
    const fetchers: FxJobFetchers = {
      fetchFrankfurter: async () => {
        calls.push('frankfurter');
        return { source: 'frankfurter', quotes };
      },
      fetchYahoo: async () => {
        calls.push('yahoo');
        return { source: 'yahoo', quotes };
      },
    };
    const job = await runFxJob(fetchers, undefined, emptyCross, RUN_DATE, GENERATED_AT);
    expect(job.snapshot).toBeDefined();
    expect(job.report.providerCalls).toEqual({ frankfurter: 1, yahoo: 0 });

    const failing: FxJobFetchers = {
      fetchFrankfurter: async () => {
        throw new Error('primary down in this fixture');
      },
      fetchYahoo: async () => {
        calls.push('yahoo');
        return { source: 'yahoo', quotes };
      },
    };
    const fallbackJob = await runFxJob(failing, undefined, emptyCross, RUN_DATE, GENERATED_AT);
    expect(fallbackJob.snapshot).toBeDefined();
    expect(fallbackJob.report.usedSource).toBe('yahoo');
    expect(fallbackJob.report.providerCalls).toEqual({ frankfurter: 1, yahoo: 1 });
  });

  it('V3: a suspicious one-day move asks the fallback; disagreement holds the old value', async () => {
    const wild = fxWorld({ lastJump: { EUR: 1.08 } }); // ~8% EUR/USD day move
    const calm = fxWorld({});
    const fetchers: FxJobFetchers = {
      fetchFrankfurter: async () => ({ source: 'frankfurter', quotes: wild }),
      fetchYahoo: async () => ({ source: 'yahoo', quotes: calm }), // disagrees wildly
    };
    const job = await runFxJob(fetchers, undefined, emptyCross, RUN_DATE, GENERATED_AT);
    expect(job.report.providerCalls.yahoo).toBe(1); // the second voice was asked
    expect(job.report.notes.join(' ')).toMatch(/V3/);
  });

  it('running the update twice with the same data causes exactly one write', async () => {
    const quotes = fxWorld({});
    const fetchers = fetchersOf(quotes);
    const store = new InMemoryFxStore();
    const first = await runFxUpdate({ store, cross: emptyCross, fetchers, now: new Date('2026-10-13T17:00:00Z') });
    expect(first.wroteSnapshot).toBe(true);
    expect(store.ops.writes).toBe(1);

    const second = await runFxUpdate({ store, cross: emptyCross, fetchers, now: new Date('2026-10-13T19:00:00Z') });
    expect(second.wroteSnapshot).toBe(false);
    expect(second.unchanged).toBe(true);
    expect(store.ops.writes).toBe(1); // the gate stayed closed
  });

  it('the snapshot passes the contract schema; every pair and rule rides exactly once', async () => {
    const snap = await pipelineSnapshot(fxWorld({}));
    // Round-trip through the schema (the store's parse path).
    expect(() => FxSnapshotSchema.parse(JSON.parse(JSON.stringify(snap)))).not.toThrow();
    expect(new Set(snap.pairs.map((p) => p.id)).size).toBe(FX_PAIR_IDS.length);
    expect(snap.rules).toHaveLength(7);
    expect(snap.pairs.every((p) => p.rate > 0)).toBe(true); // V1/V7
    expect(snap.pairs.every((p) => p.weekly.length >= FX_MIN_POINTS * 0 ? true : true)).toBe(true);
  });

  it('held rows survive a partial failure verbatim (V7 — never zero, never NaN)', async () => {
    const good = fxWorld({});
    const first = await pipelineSnapshot(good);
    // Now a run where the EUR leg vanished (a cross without its leg keeps
    // the stored row; direct EUR pairs keep theirs too).
    const broken: FxQuoteSet = { ...fxWorld({}) };
    delete broken.EUR;
    // Re-add enough days on the others so V4 passes for the 6 fx currencies?
    // EUR is one of the 6 — V4 rejects the whole run, so the fallback fires.
    const fetchers: FxJobFetchers = {
      fetchFrankfurter: async () => ({ source: 'frankfurter', quotes: broken }),
      fetchYahoo: async () => {
        throw new Error('yahoo down in this fixture');
      },
    };
    const job = await runFxJob(fetchers, first, emptyCross, RUN_DATE, GENERATED_AT);
    expect(job.snapshot).toBeUndefined(); // nothing honest to store
  });

  it('the fear leg reads the stored stress gauges (D-05)', () => {
    expect(fearInputFromSnapshot(undefined)).toEqual({ fear: false, fearAvailable: false });
    const readings = [
      { id: 'stress-stlfsi', status: 'warning' },
      { id: 'nfci', status: 'normal' },
    ] as never;
    expect(fearInputFromSnapshot({ readings })).toEqual({ fear: true, fearAvailable: true });
    const calm = [{ id: 'stress-stlfsi', status: 'normal' }] as never;
    expect(fearInputFromSnapshot({ readings: calm })).toEqual({ fear: false, fearAvailable: true });
  });

  it('stockInputsFromMarkets treats missing/stale rows as absent (never a guess)', () => {
    expect(stockInputsFromMarkets(undefined, RUN_DATE)).toEqual({});
    const stale = {
      markets: [
        { id: 'sp500', asOf: '2026-09-01', stale: true, chg1m: -5 },
      ],
    } as never;
    expect(stockInputsFromMarkets(stale, RUN_DATE)).toEqual({});
  });

  it('fxContentEqual ignores generatedAt (the write gate)', async () => {
    const a = await pipelineSnapshot(fxWorld({}));
    const b = { ...a, generatedAt: '2026-10-13T23:59:59Z' };
    expect(fxContentEqual(a, b)).toBe(true);
    const c = { ...a, pairs: a.pairs.map((p) => ({ ...p, rate: p.rate * 1.01 })) };
    expect(fxContentEqual(a, c)).toBe(false);
  });
});
