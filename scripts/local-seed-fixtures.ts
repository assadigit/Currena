/**
 * Local-only preview harness for the Insights page (2026-10-24, the
 * economic-indicators UI redesign's verification pass).
 *
 * Builds FIXTURE markets + fx snapshots for the local wrangler-dev KV so
 * the private-mode-only world sections (world markets / US shares in AUD /
 * world currencies) render locally. The indicator snapshot + histories are
 * the REAL production public documents (fetched from the live API, seeded
 * via `wrangler kv key put --local`). Never deployed; no live provider is
 * ever called (rule 7 — fixtures only: the fx job runs against the same
 * in-memory quote world the test suite uses; markets rows are hand-built
 * but summarized by the repo's own summarizeMarkets and validated by the
 * repo's own zod schemas on the serve path).
 *
 * Usage (see docs/insights/economic-indicators-verification-notes.md):
 *   tsx scripts/local-seed-fixtures.ts          # → /tmp/currena-seed/*.json
 *   # then wrangler kv key put … --local each file (see the notes file)
 */
import { writeFileSync } from 'node:fs';
// @ts-expect-error — outside this package's tsconfig rootDirs; tsx resolves it.
import { summarizeMarkets } from '../packages/insights/src/markets/compute';
// @ts-expect-error — same.
import { runFxJob } from '../packages/insights/src/fx/job';
// @ts-expect-error — same.
import type { FxQuoteSet } from '../packages/insights/src/fx/providers';
// @ts-expect-error — same.
import type { FxJobFetchers } from '../packages/insights/src/fx/job';
// @ts-expect-error — same.
import type { FxCrossReader } from '../packages/insights/src/fx/store';
// @ts-expect-error — same.
import type { MarketEntry } from '../packages/core/src/schemas';

/* ---------------- markets ---------------- */
function weeklySeries(base: number, n: number, drift: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const day = 18262; // WEEKLY_EPOCH_BASE_DAY (2020-01-01)
  let close = Math.round(base);
  for (let i = 0; i < n; i++) {
    out.push([i === 0 ? day : 7, close]);
    close = Math.round(close * (1 + drift));
  }
  return out;
}

function entry(
  id: MarketEntry['id'],
  close: number,
  chg1d: number,
  chg3m: number,
  high52w: number,
  low52w: number,
  trend: MarketEntry['trend'],
): MarketEntry {
  const fromHigh = -(((high52w - close) / high52w) * 100);
  const rangePos = Math.round(((close - low52w) / (high52w - low52w)) * 100);
  const status: MarketEntry['status'] = fromHigh > -10 ? 'normal' : fromHigh > -20 ? 'correction' : 'bear';
  return {
    id,
    asOf: '2026-10-16',
    close,
    chg1d,
    chg1w: chg3m / 12,
    chg1m: chg3m / 3,
    chg3m,
    chg1y: chg3m * 4,
    high52w,
    low52w,
    fromHigh,
    rangePos,
    trend,
    status,
    source: 'eodhd',
    stale: false,
    weekly: weeklySeries(close * 0.9, 40, 0.001),
    bigMove: false,
  } as MarketEntry;
}

const markets: MarketEntry[] = [
  entry('n225', 69030, 0.4, 8.2, 71500, 55000, 'up'),
  entry('asx200', 8530, -0.2, 2.1, 8870, 7900, 'up'),
  entry('kospi', 4210, 0.1, 5.5, 4410, 3600, 'up'),
  entry('hsi', 26100, -0.8, 9.0, 28500, 22000, 'up'),
  entry('ssec', 4010, 0.05, 1.2, 4200, 3600, 'flat'),
  entry('taiex', 23400, 0.3, 6.0, 25000, 20000, 'up'),
  entry('nifty50', 26200, 0.2, 4.4, 27500, 22000, 'up'),
  entry('stoxx50', 5620, -0.4, 3.0, 5920, 4800, 'up'),
  entry('dax', 25170, -0.5, 2.8, 26500, 21500, 'up'),
  entry('cac', 8150, -0.3, 1.9, 8550, 7000, 'up'),
  entry('ftse', 9840, 0.1, 2.2, 10300, 8600, 'up'),
  entry('sp500', 7810, 0.6, 6.5, 8100, 6800, 'up'),
  entry('ndx', 25400, 0.8, 8.8, 26500, 21000, 'up'),
  entry('dow', 49200, 0.3, 5.1, 51200, 42000, 'up'),
  entry('tsx', 26900, -0.9, -4.5, 30600, 25500, 'down'),
  entry('ibov', 142000, -1.2, -14.0, 190000, 130000, 'down'),
];

const marketsSnapshot = {
  v: 1 as const,
  generatedAt: '2026-10-16T23:31:00Z',
  markets,
  summary: summarizeMarkets(markets),
};
writeFileSync('/tmp/currena-seed/markets.json', JSON.stringify(marketsSnapshot));
console.log('markets.json written:', markets.length, 'rows; summary:', JSON.stringify(marketsSnapshot.summary));

/* ---------------- fx ---------------- */
function fxWorld(days = 420): FxQuoteSet {
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
  let t = new Date('2026-10-16T00:00:00Z').getTime();
  while (dates.length < days) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) dates.push(date);
    t -= 86_400_000;
  }
  dates.reverse();
  const out: FxQuoteSet = {};
  for (const [code, start] of Object.entries(base)) {
    const points = dates.map((date, i) => ({ date, value: start * 1.0002 ** i }));
    out[code as keyof FxQuoteSet] = points;
  }
  return out;
}

const emptyCross: FxCrossReader = {
  getMarkets: async () => undefined,
  getGoldHistory: async () => undefined,
  getInsightsSnapshot: async () => undefined,
};

const fetchers: FxJobFetchers = {
  fetchFrankfurter: async () => ({ source: 'frankfurter' as const, quotes: fxWorld() }),
  fetchYahoo: async () => {
    throw new Error('yahoo not needed in this fixture');
  },
};

void (async () => {
  const job = await runFxJob(fetchers, undefined, emptyCross, '2026-10-16', '2026-10-16T01:30:00Z');
  if (job.snapshot === undefined) throw new Error(`fx snapshot failed: ${job.report.notes.join('; ')}`);
  writeFileSync('/tmp/currena-seed/fx.json', JSON.stringify(job.snapshot));
  console.log('fx.json written: pairs', job.snapshot.pairs.length, 'rules', job.snapshot.rules.length);
})();
