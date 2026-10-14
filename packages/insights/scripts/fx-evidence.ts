/**
 * World currencies — the evidence run (spec §6.6, build step 3).
 *
 * Replays the last ~10 years WEEKLY through the fx rule engine (R1–R7) and
 * reports, per rule: how many separate Warning episodes fired, the share of
 * weeks spent in Warning, what the S&P 500 did over the month after each
 * Warning started, whether the known episodes (2008-window edge, the euro
 * crisis, 2015, 2018–19, March 2020, 2022, August 2024, April 2025) show
 * up, and how often the 13-week pattern check read Holding / Mixed / Not
 * holding. Writes docs/specs/insights-world-currencies-evidence.md — the
 * committed step-3 artifact the spec's finish line requires (threshold
 * tuning evidence for Ali).
 *
 * Data (one-off, NOT from the EODHD free quota — spec §6.6):
 *   - currencies: Frankfurter, one call back to 2016 (the frozen v1 API
 *     serves 1999+);
 *   - S&P 500 / Nikkei 225 / Euro Stoxx 50 / gold: Yahoo chart calls;
 *   - the fear leg: FRED STLFSI4 (the R1 stand-in the production engine
 *     reads from the stored stress gauges — D-05).
 *
 * Manual script: hits live providers by design, never in the test suite,
 * writes NOTHING to KV.
 *
 * Run:  pnpm --filter @currena/insights fx-evidence
 */

import { writeFileSync } from 'node:fs';
import type { FxPairId, FxRuleState } from '@currena/core';
import {
  evaluateFxRules,
  changesOf,
  pairSeriesFromQuotes,
  type FxRuleInputs,
} from '../src/fx/compute';
import { fetchFrankfurterQuotes } from '../src/fx/providers';
import { FX_PAIRS, FX_STALE_DAYS } from '../src/fx/definitions';
import { pointAtOrBefore, daysBetween, addDays, type SeriesPoint } from '../src/series';

const repoRoot = new URL('../../../', import.meta.url);
const outPath = new URL('./docs/specs/insights-world-currencies-evidence.md', repoRoot);
const YAHOO_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

// 22 months of history before the first replay date: the change windows
// (1m/3m/13w pattern) and the dollar measure need their period bases.
const FROM = '2015-01-01';

/* ------------------------------------------------------------------ *
 * Fetch the one-off history
 * ------------------------------------------------------------------ */

console.log('# fx evidence run — fetching one-off history (not from the EODHD quota)');
const frankfurter = (await fetchFrankfurterQuotes({ from: FROM })).quotes;

async function yahooSeries(symbol: string, interval: '1d' | '1wk'): Promise<SeriesPoint[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&period1=${Math.floor(new Date(FROM).getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': YAHOO_UA, accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: (number | null)[] }> } }> };
      };
      const r = json.chart?.result?.[0];
      const ts = r?.timestamp ?? [];
      const closes = r?.indicators?.quote?.[0]?.close ?? [];
      const points: SeriesPoint[] = [];
      for (let i = 0; i < ts.length; i++) {
        const v = closes[i];
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
          points.push({ date: new Date(ts[i]! * 1000).toISOString().slice(0, 10), value: v });
        }
      }
      const byDate = new Map<string, SeriesPoint>();
      for (const p of points) byDate.set(p.date, p);
      const sorted = [...byDate.values()];
      if (sorted.length < 100) throw new Error(`only ${sorted.length} points`);
      return sorted;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error('unreachable');
}

const [sp500, n225, stoxx50, gold] = await Promise.all([
  yahooSeries('^GSPC', '1wk'),
  yahooSeries('^N225', '1wk'),
  yahooSeries('^STOXX50E', '1wk'),
  yahooSeries('GC=F', '1wk'),
]);
console.log(`weekly series: sp500=${sp500.length} n225=${n225.length} stoxx50=${stoxx50.length} gold=${gold.length}`);

// The fear leg: FRED STLFSI4 (weekly). The production engine reads the
// stored stress gauges; for the replay, the same series straight from FRED.
const stlfsiRes = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=STLFSI4', {
  headers: { 'User-Agent': 'CurrenaInsights/1.0 (evidence run)' },
});
const stlfsiText = await stlfsiRes.text();
const stlfsi: SeriesPoint[] = [];
for (const line of stlfsiText.trim().split('\n').slice(1)) {
  const [date, raw] = line.split(',');
  if (date !== undefined && raw !== undefined && raw !== '.' && Number.isFinite(Number(raw))) {
    stlfsi.push({ date, value: Number(raw) });
  }
}
console.log(`stlfsi4: ${stlfsi.length} observations`);

/* ------------------------------------------------------------------ *
 * The weekly replay grid
 * ------------------------------------------------------------------ */

/** A weekly grid of Fridays from the first date all inputs cover. */
function fridays(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  while (d.toISOString().slice(0, 10) <= to) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

const grid = fridays('2016-10-14', new Date().toISOString().slice(0, 10));
console.log(`replaying ${grid.length} weeks…`);

/** Slice a series to everything at/before a date (binary-search cutoff). */
function sliceTo(series: readonly SeriesPoint[], date: string): SeriesPoint[] {
  let lo = 0;
  let hi = series.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid]!.date <= date) lo = mid + 1;
    else hi = mid;
  }
  return series.slice(0, lo);
}

/** 1-month % change of a series at a date (production: pctChange + ±15d tolerance). */
function m1Of(series: readonly SeriesPoint[], date: string): number | undefined {
  const last = pointAtOrBefore(series, date);
  if (!last) return undefined;
  if (daysBetween(last.date, date) > 10) return undefined;
  const monthAgo = pointAtOrBefore(series, addDays(last.date, -30));
  if (!monthAgo || monthAgo.date === last.date) return undefined;
  if (daysBetween(monthAgo.date, addDays(last.date, -30)) > 15) return undefined;
  return ((last.value - monthAgo.value) / monthAgo.value) * 100;
}

/** 3-month % change of a series at a date. */
function m3Of(series: readonly SeriesPoint[], date: string): number | undefined {
  const last = pointAtOrBefore(series, date);
  if (!last) return undefined;
  if (daysBetween(last.date, date) > 10) return undefined;
  const quarterAgo = pointAtOrBefore(series, addDays(last.date, -91));
  if (!quarterAgo || quarterAgo.date === last.date) return undefined;
  if (daysBetween(quarterAgo.date, addDays(last.date, -91)) > 20) return undefined;
  return ((last.value - quarterAgo.value) / quarterAgo.value) * 100;
}

const BASKET_KEYS = ['EUR', 'JPY', 'GBP', 'CAD', 'SEK', 'CHF'] as const;

/* Precompute EVERY series once over the full history; the weekly loop only
 * slices (the per-week rebuild was O(all-dates × currencies) and slow). */
const pairSeriesFull: Partial<Record<FxPairId, SeriesPoint[]>> = {};
for (const pair of FX_PAIRS) {
  const series = pairSeriesFromQuotes(pair.id, frankfurter as never);
  if (series.length >= 30) pairSeriesFull[pair.id] = series;
}

const BASKET_WEIGHTS: Record<(typeof BASKET_KEYS)[number], number> = {
  EUR: 0.576, JPY: 0.136, GBP: 0.119, CAD: 0.091, SEK: 0.042, CHF: 0.036,
};
const basketDates = new Set<string>();
for (const ccy of BASKET_KEYS) for (const p of frankfurter[ccy] ?? []) basketDates.add(p.date);
const byCcy: Partial<Record<string, SeriesPoint[]>> = {};
for (const [ccy, list] of Object.entries(frankfurter)) byCcy[ccy] = list;
const dollarFull: SeriesPoint[] = [];
for (const d of [...basketDates].sort()) {
  let ln = Math.log(50.14348112);
  let complete = true;
  for (const ccy of BASKET_KEYS) {
    const q = pointAtOrBefore(byCcy[ccy] ?? [], d);
    if (q === undefined) complete = false;
    else ln += BASKET_WEIGHTS[ccy] * Math.log(q.value);
  }
  if (complete) dollarFull.push({ date: d, value: Math.exp(ln) });
}
console.log(`precomputed: dollar=${dollarFull.length} points, pairs=${Object.keys(pairSeriesFull).length}/10`);

const replay: Array<{ date: string; rules: FxRuleState[] }> = [];
let staleWeeks = 0;

for (const date of grid) {
  const pairs: Partial<Record<FxPairId, { chg: ReturnType<typeof changesOf>; series: SeriesPoint[] }>> = {};
  for (const [id, full] of Object.entries(pairSeriesFull) as Array<[FxPairId, SeriesPoint[]]>) {
    const trimmed = sliceTo(full, date).slice(-320);
    if (trimmed.length < 30) continue;
    if (trimmed[trimmed.length - 1]!.date < addDays(date, -FX_STALE_DAYS)) continue;
    pairs[id] = { chg: changesOf(trimmed), series: trimmed };
  }
  const dollarTail = sliceTo(dollarFull, date).slice(-320);
  if (dollarTail.length < 30 || dollarTail[dollarTail.length - 1]!.date < addDays(date, -FX_STALE_DAYS)) {
    staleWeeks++;
    continue;
  }

  const fearPoint = pointAtOrBefore(stlfsi, date);
  const fear = fearPoint !== undefined && fearPoint.value > 0 && daysBetween(fearPoint.date, date) <= 45;

  const inputs: FxRuleInputs = {
    pairs,
    dollar: { chg: changesOf(dollarTail), series: dollarTail },
    stocks: {
      sp500_m1: m1Of(sp500, date),
      nikkei_m1: m1Of(n225, date),
      stoxx50_m1: m3Of(stoxx50, date) === undefined ? undefined : m1Of(stoxx50, date),
      sp500: sliceTo(sp500, date).slice(-160),
      n225: sliceTo(n225, date).slice(-160),
      stoxx50: sliceTo(stoxx50, date).slice(-160),
    },
    gold: { m1: m1Of(gold, date), series: sliceTo(gold, date).slice(-160) },
    fear,
    fearAvailable: fearPoint !== undefined && daysBetween(fearPoint.date, date) <= 45,
  };

  replay.push({ date, rules: evaluateFxRules(inputs) });
}

console.log(`replayed ${replay.length} weeks (${staleWeeks} skipped as stale/unavailable)`);

/* ------------------------------------------------------------------ *
 * Aggregate per rule
 * ------------------------------------------------------------------ */

const RULE_IDS = ['r1_risk_mood', 'r2_carry_trade', 'r3_dollar_strength', 'r4_money_hiding', 'r5_china_link', 'r6_europe_worry', 'r7_dollar_or_euro'] as const;
const RULE_LABELS: Record<(typeof RULE_IDS)[number], string> = {
  r1_risk_mood: 'R1 · Nervous or relaxed?',
  r2_carry_trade: 'R2 · Yen carry trade',
  r3_dollar_strength: 'R3 · Strong or weak dollar',
  r4_money_hiding: 'R4 · Where does money hide?',
  r5_china_link: 'R5 · China link',
  r6_europe_worry: 'R6 · Europe worry',
  r7_dollar_or_euro: 'R7 · Dollar or euro? (context)',
};
const KNOWN_EPISODES: Array<{ name: string; from: string; to: string }> = [
  { name: 'euro crisis', from: '2010-01-01', to: '2012-12-31' },
  { name: '2015 (SNB/China)', from: '2015-01-01', to: '2015-12-31' },
  { name: '2018–19 (Fed hikes/trade)', from: '2018-01-01', to: '2019-12-31' },
  { name: 'March 2020', from: '2020-02-15', to: '2020-06-30' },
  { name: '2022 (Fed sprint / yen)', from: '2022-01-01', to: '2022-12-31' },
  { name: 'August 2024 (yen carry unwind)', from: '2024-07-15', to: '2024-09-15' },
  { name: 'April 2025', from: '2025-03-15', to: '2025-06-15' },
];

const sp500NextMonth = (date: string): number | undefined => m1Of(sp500, addDays(date, 30));

const reportRows: string[] = [];
const lines: string[] = [];

lines.push('# World currencies — the evidence run (spec §6.6, build step 3)');
lines.push('');
lines.push(`**Run:** ${new Date().toISOString()} · one-off history (Frankfurter currencies, Yahoo stocks/gold, FRED STLFSI4 — nothing from the EODHD free quota). Replayed **${replay.length} weeks** (${grid[0]} → ${grid[grid.length - 1]}) through the production rule engine (R1–R7 incl. the §6.4 downgrade pass).`);
lines.push('');
lines.push('**v1.3 changes under test** (change request §3): R3 now fires on a one-month move of ±3.0% OR a three-month move of ±4.0% (the M1/M3 columns below split the two legs), and R7 works in dollar strength (dollar-led / euro-led / no card). The replay grid is WEEKLY, so shares are shares of weeks — the closest honest proxy for the change request\'s "share of days".');
lines.push('');
lines.push('Thresholds below are the spec §6.3 starting values + the v1.3 additions (`R3_DOLLAR_M1_STRONG = +3.0`, `R3_DOLLAR_M1_WEAK = −3.0` in src/fx/definitions.ts). Ali approves or adjusts them; nothing on the page shows these counts.');
lines.push('');
lines.push('| Rule | Warning episodes | Weeks in Warning | Share of weeks | S&P next month after a Warning start (n · median) | Known episodes it caught |');
lines.push('|---|---|---|---|---|---|');

for (const rid of RULE_IDS) {
  const states = replay
    .map((r) => ({ date: r.date, rule: r.rules.find((x) => x.id === rid) }))
    .filter((x): x is { date: string; rule: FxRuleState } => x.rule !== undefined);
  if (states.length === 0) {
    lines.push(`| ${RULE_LABELS[rid]} | — no data — | | | | |`);
    continue;
  }
  // Episodes: consecutive weeks in warning (counted or downgraded — both are
  // "the rule fired"; the §6.4 downgrade is recorded per state).
  const episodes: string[] = [];
  let inEpisode = false;
  let episodeStart = '';
  let warnWeeks = 0;
  const forwardReturns: Array<number | undefined> = [];
  const caught = new Set<string>();
  for (const { date, rule } of states) {
    const active = rule.outcome === 'warning' || (rule.outcome === 'watch' && (rule.downgraded ?? false));
    if (active) {
      warnWeeks++;
      if (!inEpisode) {
        inEpisode = true;
        episodeStart = date;
        forwardReturns.push(sp500NextMonth(date));
      }
      for (const ep of KNOWN_EPISODES) if (date >= ep.from && date <= ep.to) caught.add(ep.name);
    } else if (inEpisode) {
      inEpisode = false;
      episodes.push(episodeStart);
    }
  }
  if (inEpisode) episodes.push(episodeStart);
  const defined = forwardReturns.filter((v): v is number => v !== undefined).sort((a, b) => a - b);
  const median = defined.length > 0 ? defined[Math.floor(defined.length / 2)] : undefined;
  const lower = defined.filter((v) => v < 0).length;
  // v1.3 (CR §3.1/§3.3): report WHICH leg/variant fired — R3's new one-month
  // trigger and R7's corrected leads each get their own share.
  let variantNote = '';
  if (rid === 'r3_dollar_strength') {
    const viaM1 = states.filter((s) => s.rule.variant === 'm1').length;
    const viaM3 = states.filter((s) => s.rule.variant === 'm3').length;
    const supportive = states.filter((s) => s.rule.outcome === 'supportive').length;
    variantNote = ` · M1-leg ${viaM1}w (${((viaM1 / states.length) * 100).toFixed(1)}%) · M3-leg ${viaM3}w · supportive ${supportive}w`;
  }
  if (rid === 'r7_dollar_or_euro') {
    const dollarLed = states.filter((s) => s.rule.variant === 'dollar-led').length;
    const euroLed = states.filter((s) => s.rule.variant === 'euro-led').length;
    const moved = states.filter((s) => Math.abs(s.rule.numbers.eurusd_m1 ?? 0) >= 2.5).length;
    variantNote = ` · dollar-led ${dollarLed}w (${((dollarLed / states.length) * 100).toFixed(1)}%) · euro-led ${euroLed}w · EUR/USD ≥2.5% in ${moved}w`;
  }
  lines.push(
    `| ${RULE_LABELS[rid]}${variantNote ? ` **(v1.3)**` : ''} | ${episodes.length} | ${warnWeeks} | ${((warnWeeks / states.length) * 100).toFixed(1)}%${variantNote} | ${defined.length} reads · median ${median !== undefined ? median.toFixed(1) + '%' : '—'} · lower in ${lower} | ${[...caught].join(', ') || '—'} |`,
  );
  reportRows.push(rid);
}

// Pattern-check stats (§6.4): Holding / Mixed / Not holding across all rules.
const patternTally = { holding: 0, mixed: 0, notHolding: 0, nodata: 0 };
for (const r of replay) {
  for (const rule of r.rules) {
    if (rule.pattern === undefined) patternTally.nodata++;
    else if (rule.pattern.status === 'holding') patternTally.holding++;
    else if (rule.pattern.status === 'mixed') patternTally.mixed++;
    else if (rule.pattern.status === 'not_holding') patternTally.notHolding++;
    else patternTally.nodata++;
  }
}
const patternTotal = patternTally.holding + patternTally.mixed + patternTally.notHolding + patternTally.nodata;
lines.push('');
lines.push('## The 13-week pattern check (§6.4)');
lines.push('');
lines.push(`Across all ${patternTotal} rule-weeks: **Holding ${(100 * patternTally.holding / patternTotal).toFixed(0)}% · Mixed ${(100 * patternTally.mixed / patternTotal).toFixed(0)}% · Not holding ${(100 * patternTally.notHolding / patternTotal).toFixed(0)}%** (no data ${(100 * patternTally.nodata / patternTotal).toFixed(0)}%).`);
lines.push('');
lines.push('## Reading the table');
lines.push('');
lines.push('- A share of weeks in Warning well under 15% is the spec\'s usefulness bar: a rule that is almost always on, or never on, is useless.');
lines.push('- The S&P column is descriptive, NOT a backtest of predictive power: n is small, episodes cluster, and the middle result is the honest summary.');
lines.push('- The 2008 window falls before this run\'s Frankfurter-based grid (the basket needs all six currencies); the euro-crisis years fall outside the 10-year window too — the engine\'s earliest readable weeks start once every input exists.');
lines.push('');
lines.push('## Verdict for Ali (thresholds)');
lines.push('');
lines.push('The spec §6.3 starting values (verbatim above, in src/fx/definitions.ts) are the ones now live. Adjustments belong in that ONE config block.');
lines.push('');
lines.push('## The v1.3 decision rule (change request §3.1/§4)');
lines.push('');
lines.push('Keep the starting thresholds unless a rule fires on more than 25% of days or never fires despite known episodes. The M1/M3 and dollar-led/euro-led splits above are the evidence for the two new behaviours; any change is recorded in docs/DECISIONS_FOR_ALI.md.');
lines.push('');

writeFileSync(outPath, lines.join('\n'));
console.log(lines.slice(6, 16).join('\n'));
console.log(`\nWritten: ${outPath.pathname}`);
void reportRows;
