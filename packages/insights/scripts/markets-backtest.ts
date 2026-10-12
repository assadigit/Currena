/**
 * World stock markets — signal back-test (build step 2, spec §5.3).
 *
 * Replays the last ~12 months of daily closes for all 14 markets through
 * the EXACT production rules (statusOf's hysteresis carried day to day,
 * summarizeMarkets' thresholds and US override) and reports:
 *   - the share of days in each section signal (normal / attention / unusual);
 *   - every date the signal changed, with the driver numbers;
 *   - per-market status shares for context.
 *
 * The table is committed at docs/specs/insights-world-markets-backtest.md
 * for Ali to review (the spec's step-2 acceptance artifact).
 *
 * Data: the provider cache written by markets-data-check.ts
 * (fixtures/markets-live/, gitignored) — EODHD for 13 markets, Yahoo for
 * FTSE. Run the data-check first if the cache is missing. MANUAL script,
 * never part of the test suite, writes nothing to KV.
 *
 * Run: pnpm --filter @currena/insights markets-backtest
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { MarketEntry, MarketId, MarketStatus, MarketsSummary } from '@currena/core';
import type { MarketSeries } from '../src/markets/providers';
import { parseEodhdEodResponse, parseYahooChartResponse } from '../src/markets/providers';
import { buildEntry, summarizeMarkets } from '../src/markets/compute';
import { MARKETS, MARKET_IDS } from '../src/markets/definitions';

const cacheDir = new URL('./../fixtures/markets-live/', import.meta.url);
const outPath = new URL('./docs/specs/insights-world-markets-backtest.md', new URL('../../../', import.meta.url));

/* ---------------- load the cached year of closes ---------------- */

const seriesByMarket = new Map<MarketId, MarketSeries>();
for (const market of MARKETS) {
  const eodhdFile = new URL(`./eodhd-${market.id}.json`, cacheDir);
  const yahooFile = new URL(`./yahoo-${market.id}.json`, cacheDir);
  if (market.eodhdCode !== null && existsSync(eodhdFile)) {
    seriesByMarket.set(market.id, {
      id: market.id,
      source: 'eodhd',
      points: parseEodhdEodResponse(JSON.parse(readFileSync(eodhdFile, 'utf8')), market.id),
    });
  } else if (existsSync(yahooFile)) {
    seriesByMarket.set(
      market.id,
      (() => {
        const json = JSON.parse(readFileSync(yahooFile, 'utf8'));
        return { id: market.id, source: 'yahoo' as const, points: parseYahooChartResponse(json, market.id) };
      })(),
    );
  } else {
    console.error(`[markets-backtest] FATAL: no cached series for ${market.id} — run markets-data-check first.`);
    process.exit(1);
  }
}

/* ---------------- the replay ---------------- */

/** All weekdays covered by any series — the replay calendar. */
const allDates = new Set<string>();
for (const s of seriesByMarket.values()) for (const p of s.points) allDates.add(p.date);
const replayDays = [...allDates].sort().filter((d) => {
  const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
  return dow !== 0 && dow !== 6;
});

// A market participates from the first day it can produce a full entry
// (needs ≥ 2 closes and a close on/before one month back — the same
// requirements buildEntry enforces in production).
const participationStart = new Map<MarketId, string>();
for (const [id, s] of seriesByMarket) {
  let start: string | undefined;
  for (let i = 30; i < s.points.length; i++) {
    start = s.points[i]!.date;
    break;
  }
  if (start === undefined) {
    console.error(`[markets-backtest] FATAL: series for ${id} too short to replay.`);
    process.exit(1);
  }
  participationStart.set(id, start);
}

const prevEntries = new Map<MarketId, MarketEntry>();
const daySignal = new Map<string, MarketsSummary['signal']>();
const daySummary = new Map<string, MarketsSummary>();
const dayDriver = new Map<string, string>();

for (const day of replayDays) {
  const entries: MarketEntry[] = [];
  for (const id of MARKET_IDS) {
    const s = seriesByMarket.get(id)!;
    if (day < participationStart.get(id)!) continue;
    const points = s.points.filter((p) => p.date <= day);
    if (points.length < 2) continue;
    try {
      const entry = buildEntry(id, { id, source: s.source, points }, prevEntries.get(id), day);
      entries.push(entry);
      prevEntries.set(id, entry);
    } catch {
      // Not enough history yet for this market on this day — it simply
      // does not vote (the same honest-absence rule as production).
    }
  }
  if (entries.length === 0) continue;
  const summary = summarizeMarkets(entries);
  daySignal.set(day, summary.signal);
  daySummary.set(day, summary);
  const sp = entries.find((m) => m.id === 'sp500');
  const ndx = entries.find((m) => m.id === 'ndx');
  dayDriver.set(
    day,
    `n=${summary.nAttention + summary.nUnusual} (corr ${summary.nAttention} / bear ${summary.nUnusual}) · ` +
      `S&P ${sp?.status ?? '—'} · Nasdaq ${ndx?.status ?? '—'} · worst ${summary.worstGroup ?? '—'}`,
  );
}

/* ---------------- the report ---------------- */

const days = [...daySignal.keys()].sort();
const total = days.length;
const counts = { normal: 0, attention: 0, unusual: 0 } as Record<MarketsSummary['signal'], number>;
for (const d of days) counts[daySignal.get(d)!]++;

interface Transition {
  date: string;
  from: MarketsSummary['signal'];
  to: MarketsSummary['signal'];
  driver: string;
}
const transitions: Transition[] = [];
let prevSignal: MarketsSummary['signal'] | undefined;
for (const d of days) {
  const s = daySignal.get(d)!;
  if (prevSignal !== undefined && s !== prevSignal) {
    transitions.push({ date: d, from: prevSignal, to: s, driver: dayDriver.get(d)! });
  }
  prevSignal = s;
}

// Per-market status shares over the replay (context for the review).
const statusShareLines: string[] = [];
for (const id of MARKET_IDS) {
  const s = seriesByMarket.get(id)!;
  const share: Record<MarketStatus, number> = { normal: 0, correction: 0, bear: 0 };
  let counted = 0;
  const rolling = new Map<MarketId, MarketEntry>();
  for (const d of days) {
    if (d < participationStart.get(id)!) continue;
    const pts = s.points.filter((p) => p.date <= d);
    if (pts.length < 2) continue;
    try {
      const e = buildEntry(id, { id, source: s.source, points: pts }, rolling.get(id), d);
      rolling.set(id, e);
      share[e.status]++;
      counted++;
    } catch {
      /* pre-history day */
    }
  }
  if (counted === 0) continue;
  const pct = (n: number) => `${((n / counted) * 100).toFixed(0)}%`;
  statusShareLines.push(
    `| ${MARKETS.find((m) => m.id === id)!.eodhdCode ?? id} | ${counted} | ${pct(share.normal)} | ${pct(share.correction)} | ${pct(share.bear)} |`,
  );
}

const pctOfDays = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

const lines: string[] = [];
lines.push(`| Signal | Days | Share of the year |`);
lines.push(`|---|---|---|`);
lines.push(`| Normal | ${counts.normal} | ${pctOfDays(counts.normal)} |`);
lines.push(`| Needs attention | ${counts.attention} | ${pctOfDays(counts.attention)} |`);
lines.push(`| Unusual | ${counts.unusual} | ${pctOfDays(counts.unusual)} |`);

const transitionLines = transitions.map(
  (t) => `| ${t.date} | ${t.from} → **${t.to}** | ${t.driver} |`,
);

const md = `# World stock markets — signal back-test (build step 2)

**Run:** ${new Date().toISOString()} · spec §5.3 (D4): the starting thresholds replayed over the last year of daily closes for all 14 markets, through the exact production rules (2-point status buffer carried day to day, the n-count thresholds, the US override).

Data: the step-0 provider cache (EODHD for 13 markets, Yahoo for FTSE), one full year. The replay calendar is every weekday; each market votes with its own last close as of that day, exactly like a production run.

## Section signal over the year (${total} trading days)

${lines.join('\n')}

## Signal change dates (${transitions.length})

| Date | Change | Drivers at the moment of the change |
|---|---|---|
${transitionLines.length > 0 ? transitionLines.join('\n') : '| — | no changes: the signal stayed Normal all year | — |'}

## Per-market status shares (context)

| Market | Days voting | Normal | Correction | Bear |
|---|---|---|---|---|
${statusShareLines.join('\n')}

## Reading the results (the spec's own acceptance bar)

The spec asks: "These are right if Normal covers most of the year and Unusual appears only in genuinely stressful weeks."

- Normal covered ${pctOfDays(counts.normal)} of the year.
- Needs attention covered ${pctOfDays(counts.attention)}, unusual ${pctOfDays(counts.unusual)}.
- The threshold block at the top of \`packages/insights/src/markets/definitions.ts\` (CORRECTION_PCT, BEAR_PCT, EXIT_BUFFER_PTS, ATTENTION_COUNT, UNUSUAL_COUNT) is where Ali can retune any number without touching logic; re-run \`pnpm --filter @currena/insights markets-backtest\` afterwards to see the new distribution.
`;

writeFileSync(outPath, md);
console.log(`# World stock markets — signal back-test — ${new Date().toISOString()}`);
console.log();
console.log(`Replay days: ${total}`);
console.log(`Normal ${counts.normal} (${pctOfDays(counts.normal)}) · attention ${counts.attention} (${pctOfDays(counts.attention)}) · unusual ${counts.unusual} (${pctOfDays(counts.unusual)})`);
console.log();
console.log('Signal changes:');
for (const t of transitions) console.log(`  ${t.date}  ${t.from} -> ${t.to}  (${t.driver})`);
console.log();
console.log(`Written: ${outPath.pathname}`);
