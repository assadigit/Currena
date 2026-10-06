/**
 * Phase I1 backtest — runs the scoring engine over the recorded fixtures at
 * weekly frozen-clock dates across three stress windows (2008 GFC, 2020
 * COVID, 2022 inflation) plus two calm contrast years (2017, 2025), and one
 * "today" run on the latest fixture data. Writes docs/insights/BACKTEST.md.
 *
 * Run: pnpm --filter @currena/insights backtest
 * (Manual script, not part of the test suite — tests never touch the big
 * fixtures; AGENTS.md rule 7 is about live sites either way: this reads
 * recorded files only.)
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IndicatorDefinition, IndicatorId, IndicatorReading } from '@currena/core';

import {
  DEFINITIONS,
  combineSeries,
  computeReading,
  parseAbsPeriodCsv,
  parseFrankfurterTimeseries,
  parseFredCsv,
  parseWorldBankMonthlyCsv,
  summarize,
  yoyPctSeries,
  type SeriesPoint,
} from '../src/index';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', 'fixtures');
const OUT_PATH = join(HERE, '..', '..', '..', 'docs', 'insights', 'BACKTEST.md');

function fixture(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf-8');
}

/* ------------------------------------------------------------------ *
 * Build every backtestable series from the recorded fixtures
 * ------------------------------------------------------------------ */

const fred = (id: string) => parseFredCsv(fixture(`fred-${id}.csv`));
const fx = (ccy: string) => parseFrankfurterTimeseries(fixture('frankfurter-usd-jpy-aud-cny-2004.json'), ccy);
const wb = (col: 'gold_usd_toz' | 'silver_usd_toz' | 'copper_usd_mt' | 'iron_ore_usd_dmtu' | 'brent_usd_bbl') =>
  parseWorldBankMonthlyCsv(fixture('worldbank-pink-monthly-2004.csv'), col);

const usdJpy = fx('JPY');
const usdAud = fx('AUD');
const usdCny = fx('CNY');
const wbGold = wb('gold_usd_toz');
const wbSilver = wb('silver_usd_toz');

const goldOunceUsd = wbGold; // history stand-in for the TGJU live numerator (03-data-sources.md)
const cpiIndex = parseAbsPeriodCsv(fixture('abs-cpi-all-groups-quarterly-2004.csv'));
const trimmedIndex = parseAbsPeriodCsv(fixture('abs-cpi-trimmed-mean-quarterly-2004.csv'));

/** Series per backtested indicator (composed exactly as the I2 adapters will). */
const SERIES: Partial<Record<IndicatorId, SeriesPoint[]>> = {
  'yield-curve-10y2y': fred('T10Y2Y'),
  'stress-stlfsi': fred('STLFSI4'),
  'real-yield-10y': fred('DFII10'),
  us10y: fred('DGS10'),
  'breakeven-5y5y': fred('T5YIFR'),
  'govt-interest-revenue': combineSeries(fred('A091RC1Q027SBEA'), fred('W006RC1Q027SBEA'), (a, w) => a / w),
  'dollar-broad': fred('DTWEXBGS'),
  usdjpy: usdJpy,
  'gold-silver': combineSeries(goldOunceUsd, wbSilver, (g, s) => g / s),
  'copper-gold': combineSeries(wb('copper_usd_mt'), wbGold, (c, g) => c / g),
  brent: fred('DCOILBRENTEU'),
  'm2-us': fred('M2SL'),
  usdcny: usdCny,
  audusd: usdAud.map((p) => ({ date: p.date, value: 1 / p.value })),
  audjpy: combineSeries(usdJpy, usdAud, (j, a) => j / a),
  'iron-ore': wb('iron_ore_usd_dmtu'),
  'au-cpi': yoyPctSeries(cpiIndex),
  'au-trimmed-mean': yoyPctSeries(trimmedIndex),
  'au-unemployment': parseAbsPeriodCsv(fixture('abs-unemployment-monthly-2004.csv')),
};

const SOURCE_NAMES: Partial<Record<IndicatorId, string>> = {
  'yield-curve-10y2y': 'FRED (T10Y2Y)',
  'stress-stlfsi': 'FRED (STLFSI4)',
  'real-yield-10y': 'FRED (DFII10)',
  us10y: 'FRED (DGS10)',
  'breakeven-5y5y': 'FRED (T5YIFR)',
  'govt-interest-revenue': 'FRED (A091RC1Q027SBEA ÷ W006RC1Q027SBEA)',
  'dollar-broad': 'FRED (DTWEXBGS)',
  usdjpy: 'Frankfurter (ECB)',
  'gold-silver': 'World Bank Pink Sheet (gold ÷ silver)',
  'copper-gold': 'World Bank Pink Sheet (copper ÷ gold)',
  brent: 'FRED (DCOILBRENTEU)',
  'm2-us': 'FRED (M2SL)',
  usdcny: 'Frankfurter (ECB)',
  audusd: 'Frankfurter (ECB)',
  audjpy: 'Frankfurter (ECB)',
  'iron-ore': 'World Bank Pink Sheet (iron ore)',
  'au-cpi': 'ABS (CPI All groups)',
  'au-trimmed-mean': 'ABS (CPI_Q Trimmed Mean)',
  'au-unemployment': 'ABS (Labour Force)',
};

const NOT_BACKTESTED: Readonly<Partial<Record<IndicatorId, string>>> = {
  'gold-btc': 'live sources are I2 adapters (gold-api.com BTC); info-only, never votes',
  'silver-btc': 'live sources are I2 adapters; info-only, never votes',
  'gold-aud': 'composed from live TGJU gold + Frankfurter AUD (I2); info-only, never votes',
  'rba-cash-rate': 'rba.gov.au Akamai-blocked from the sandbox (03-data-sources.md); info-only, never votes',
  'au-us-10y-gap': 'RBA F2 unreachable from the sandbox — pending the Phase I2 venue re-probe',
  'china-pmi': 'manual-entry series (data/manual/china-pmi.json) — populated from Phase I5',
  'terms-of-trade': 'ABS ANA_AGG adapter is Phase I2 work (P2 indicator)',
  'au-home-values': 'ABS RES_DWELL_ST adapter is Phase I2 work (P2 indicator)',
  'au-household-debt-arrears': 'ABS E2 adapter is Phase I2 work (P2 indicator)',
};

/**
 * Backtest-only definition tweaks (the definitions table itself is unchanged):
 * `gold-silver` is daily in production (TGJU gold ÷ gold-api silver), but its
 * percentile HISTORY is the World Bank monthly backfill — the only series the
 * fixtures carry — so the backtest evaluates it as a monthly indicator.
 */
const BACKTEST_DEF_OVERRIDES: Readonly<Partial<Record<IndicatorId, Partial<IndicatorDefinition>>>> = {
  'gold-silver': { cadence: 'monthly' },
};

/* ------------------------------------------------------------------ *
 * Run the engine
 * ------------------------------------------------------------------ */

interface WeekResult {
  date: string;
  readings: IndicatorReading[];
  global: ReturnType<typeof summarize>['global'];
  australia: ReturnType<typeof summarize>['australia'];
}

function runAt(day: string): WeekResult {
  const now = `${day}T02:00:00.000Z`;
  const readings: IndicatorReading[] = [];
  for (const base of DEFINITIONS) {
    const series = SERIES[base.id];
    if (!series) continue;
    const def: IndicatorDefinition = { ...base, ...BACKTEST_DEF_OVERRIDES[base.id] };
    readings.push(computeReading(def, series, now, { name: SOURCE_NAMES[def.id] ?? 'fixture' }));
  }
  const s = summarize(readings);
  return { date: day, readings, global: s.global, australia: s.australia };
}

function weekGrid(start: string, end: string): string[] {
  const out: string[] = [];
  let d = start;
  while (d <= end) {
    out.push(d);
    const t = Date.parse(`${d}T00:00:00Z`);
    d = new Date(t + 7 * 86_400_000).toISOString().slice(0, 10);
  }
  return out;
}

const WINDOWS: { key: string; label: string; start: string; end: string }[] = [
  { key: 'gfc-2008', label: 'Global financial crisis (Jul 2007 – Jun 2009)', start: '2007-07-02', end: '2009-06-29' },
  { key: 'covid-2020', label: 'COVID shock (Jan – Dec 2020)', start: '2020-01-06', end: '2020-12-28' },
  { key: 'inflation-2022', label: 'Inflation shock (Jan – Dec 2022)', start: '2022-01-03', end: '2022-12-26' },
  { key: 'calm-2017', label: 'Calm contrast (2017)', start: '2017-01-02', end: '2017-12-25' },
  { key: 'calm-2025', label: 'Recent contrast (2025)', start: '2025-01-06', end: '2025-09-29' },
];

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id, d]));

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(digits);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

const LINES: string[] = [];
const emit = (s = '') => LINES.push(s);

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

emit('# Insights backtest — Phase I1');
emit();
emit(`Generated ${new Date().toISOString().slice(0, 10)} by \`pnpm --filter @currena/insights backtest\` from the recorded fixtures (\`packages/insights/fixtures/\`, captured 2026-10-06 — see the fixtures README). No live sites are touched. Thresholds are the spec starting points from \`01-indicator-spec.md\`; nothing here changes them — this report is the evidence the owner reviews at the Gate I1 exit.`);
emit();
emit('## Method');
emit();
emit('- Engine: `@currena/insights` scoring (rule evaluation, percentiles, stale handling) — identical code path to the future ingestion runner.');
emit('- Frozen clock: each weekly run passes its own date; nothing reads the wall clock.');
emit('- Percentile: share of the last 10 years\u2019 readings strictly below the current one; minimum 120 base observations before a percentile exists.');
emit('- Labels: score = warnings ÷ voters; <20% Relaxed · 20–39% Cautious · 40–59% Stressed · ≥60% Alarmed; no voters → no label.');
emit('- Stale exclusion: max age of the freshest observation per cadence (daily 3d, weekly 16d, monthly 95d, quarterly 190d, per-change never — release lags included, calibrated against the fixtures in this run).');
emit('- Windows: weekly Mondays across the 2008 GFC, 2020 COVID and 2022 inflation shocks, plus 2017 and 2025 as calm contrast.');
emit();

/* Coverage ---------------------------------------------------------------- */

emit('## Coverage');
emit();
emit('| Indicator | Phase | Series (fixture) | Span | Obs | In backtest |');
emit('|---|---|---|---|---|---|');
for (const def of DEFINITIONS) {
  const series = SERIES[def.id];
  if (series) {
    const span = `${series[0]!.date} → ${series[series.length - 1]!.date}`;
    emit(`| \`${def.id}\` | ${def.phase} | ${SOURCE_NAMES[def.id]} | ${span} | ${series.length} | yes |`);
  } else {
    emit(`| \`${def.id}\` | ${def.phase} | — | — | — | no — ${NOT_BACKTESTED[def.id]} |`);
  }
}
emit();
emit('Not-backtested items are info-only (never vote) or P2 indicators whose adapters are Phase I2 work; their absence changes vote denominators, which the per-window tables below state explicitly.');
emit();

/* Today run --------------------------------------------------------------- */

const today = runAt('2026-10-05');
emit('## "Today" run (latest fixture data, 2026-10-05)');
emit();
emit(`- **Global:** ${today.global.label ?? 'no label'} — ${today.global.warningCount} of ${today.global.votingCount} voting indicators in warning (${today.global.excludedCount} excluded).`);
emit(`- **Australia:** ${today.australia.label ?? 'no label'} — ${today.australia.warningCount} of ${today.australia.votingCount} in warning (${today.australia.excludedCount} excluded).`);
emit();
emit('| Indicator | Value | As of | 10y percentile | 7d | 30d | Status |');
emit('|---|---|---|---|---|---|---|');
for (const r of today.readings) {
  const name = defById.get(r.id)?.name ?? r.id;
  emit(
    `| ${name} | ${r.value === null ? '—' : fmt(r.value, Math.abs(r.value) < 10 ? 2 : 1)} | ${r.asOf ?? '—'} | ${r.percentile10y === undefined ? '—' : pct(r.percentile10y)} | ${fmt(r.change7d, 1)} | ${fmt(r.change30d, 1)} | ${r.status} |`,
  );
}
emit();

/* Windows ------------------------------------------------------------------ */

for (const w of WINDOWS) {
  const grid = weekGrid(w.start, w.end);
  const weeks = grid.map(runAt);
  const voting = weeks.filter((x) => x.global.votingCount > 0);
  const peakGlobal = voting.reduce((a, b) =>
    b.global.warningCount / b.global.votingCount > a.global.warningCount / a.global.votingCount ? b : a,
  );
  const peakAus = weeks
    .filter((x) => x.australia.votingCount > 0)
    .reduce((a, b) => (b.australia.warningCount / b.australia.votingCount > a.australia.warningCount / a.australia.votingCount ? b : a));

  const labelDist = (get: (x: WeekResult) => string | null) => {
    const counts = new Map<string, number>();
    for (const x of weeks) {
      const l = get(x) ?? 'no label';
      counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    return [...counts.entries()].map(([l, n]) => `${l} ×${n}`).join(', ');
  };

  emit(`## ${w.label}`);
  emit();
  emit(`Weeks: ${weeks.length}. Global label distribution: ${labelDist((x) => x.global.label)}. Australia: ${labelDist((x) => x.australia.label)}.`);
  emit();
  emit(`Peak global week: **${peakGlobal.date}** — ${peakGlobal.global.label} (${peakGlobal.global.warningCount}/${peakGlobal.global.votingCount} in warning). Peak Australia week: **${peakAus.date}** — ${peakAus.australia.label} (${peakAus.australia.warningCount}/${peakAus.australia.votingCount}).`);
  emit();
  emit('Month-end traces:');
  emit();
  emit('| Week of | Global | Votes | Australia | Votes |');
  emit('|---|---|---|---|---|');
  for (const x of weeks) {
    if (x.date.slice(8, 10) >= '25') {
      emit(`| ${x.date} | ${x.global.label ?? '—'} | ${x.global.warningCount}/${x.global.votingCount} | ${x.australia.label ?? '—'} | ${x.australia.warningCount}/${x.australia.votingCount} |`);
    }
  }
  emit();
  emit(`Voting indicators at the peak global week (${peakGlobal.date}):`);
  emit();
  emit('| Indicator | Value | 10y pct | Status |');
  emit('|---|---|---|---|');
  for (const r of peakGlobal.readings) {
    if (r.status === 'warning' || r.status === 'normal') {
      emit(
        `| ${defById.get(r.id)?.name ?? r.id} | ${fmt(r.value, Math.abs(r.value ?? 0) < 10 ? 2 : 1)} | ${r.percentile10y === undefined ? '—' : pct(r.percentile10y)} | **${r.status}** |`,
      );
    }
  }
  emit();
  emit('Share of weeks each voting indicator spent in warning:');
  emit();
  const warnRate = new Map<string, { n: number; total: number }>();
  for (const x of weeks) {
    for (const r of x.readings) {
      if (r.status === 'warning' || r.status === 'normal') {
        const e = warnRate.get(r.id) ?? { n: 0, total: 0 };
        e.total++;
        if (r.status === 'warning') e.n++;
        warnRate.set(r.id, e);
      }
    }
  }
  emit('| Indicator | Weeks in warning | Voting weeks |');
  emit('|---|---|---|');
  for (const [id, e] of [...warnRate.entries()].sort((a, b) => b[1].n / b[1].total - a[1].n / a[1].total)) {
    emit(`| ${defById.get(id)?.name ?? id} | ${e.n} | ${e.total} |`);
  }
  emit();
}

emit('## Calibration observations (auto-generated)');
emit();
emit('- See the tables above: any indicator that spends ~0% or ~100% of a stress window in warning is a threshold the owner may want to re-tune at this gate.');
emit('- Info-only cards (gold-btc, silver-btc, gold-aud, rba-cash-rate, usdcny) never vote by construction.');
emit();

/* Write -------------------------------------------------------------------- */

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, `${LINES.join('\n')}\n`, 'utf-8');
console.log(`Wrote ${OUT_PATH} (${LINES.length} lines)`);
console.log('Today run:', JSON.stringify({ global: today.global, australia: today.australia }));
