/**
 * gf-s11-verify.ts — the GF-S11 live venue verification (the D-GF-5
 * discipline: every number from a run). A MANUAL script, never part of
 * the test suite: calls each new adapter against the LIVE venues with
 * the honest UA and prints the parsed values + the derived series'
 * tails, so the session's evidence file carries only numbers this run
 * produced. Writes NOTHING (no KV, no repo file).
 *
 * Usage: pnpm --filter @currena/insights exec tsx scripts/gf-s11-verify.ts
 */
import { fetchClevelandNowcasts, nowcastSeriesOf } from '../src/adapters/cleveland';
import { fetchFredSeries, FRED_SERIES } from '../src/adapters/fred';
import { fetchEcbEurosystemAssets } from '../src/adapters/ecb';
import { fetchBazgGoldImports } from '../src/adapters/bazg';
import { fetchSgeMonthlyWithdrawal } from '../src/adapters/sge-monthly';
import { fetchGoldEquitiesRatio } from '../src/adapters/gold-equities';
import { fetchHlwRstar } from '../src/adapters/rstar';
import { fetchYahooQuote } from '../src/adapters/yahoo';
import { fetchFrankfurterSeries } from '../src/adapters/frankfurter';
import {
  cpiSurpriseSeries,
  globalLiquiditySeries,
  realGoldPriceSeries,
} from '../src/adapters/derived';
import type { SeriesPoint } from '../src/series';

const DECADE_START = '2016-11-01';

function tail(series: readonly SeriesPoint[], n = 3): string {
  return series
    .slice(-n)
    .map((p) => `${p.date}=${p.value}`)
    .join(' · ');
}

async function step(label: string, fn: () => Promise<string | void>): Promise<void> {
  process.stdout.write(`→ ${label} … `);
  try {
    const out = await fn();
    console.log(`OK${out !== undefined && out !== '' ? ` — ${out}` : ''}`);
  } catch (err) {
    console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main(): Promise<void> {
  console.log(`# GF-S11 live venue verification — ${new Date().toISOString()}`);

  await step('Cleveland Fed nowcasting page (I9)', async () => {
    const rows = await fetchClevelandNowcasts();
    return rows.map((r) => `${r.month}: CPI MoM ${r.cpiMom.toFixed(2)}% (updated ${r.updated})`).join(' · ');
  });

  await step('FRED CPIAUCSL (the I9 realised leg)', async () => {
    const cpi = await fetchFredSeries(FRED_SERIES.usCpiIndexSa);
    const months: string[] = [];
    for (let i = Math.max(1, cpi.length - 2); i < cpi.length; i++) {
      const mom = (cpi[i]!.value / cpi[i - 1]!.value - 1) * 100;
      months.push(`${cpi[i]!.date.slice(0, 7)}: ${mom.toFixed(2)}% MoM`);
    }
    return `${cpi.length} points · realised MoM — ${months.join(' · ')}`;
  });

  await step('the I9 surprise join (the standing start — months still on the page are held)', async () => {
    const rows = await fetchClevelandNowcasts();
    const cpi = await fetchFredSeries(FRED_SERIES.usCpiIndexSa);
    const nowcast = nowcastSeriesOf(rows);
    const months = new Set(rows.map((r) => r.month));
    const surprise = cpiSurpriseSeries(nowcast, months, cpi, []);
    return `${surprise.length} surprises derived (the honest standing start: every CPI-printed month predates the accumulation or is still on the page)`;
  });

  await step('the I9 join mechanics (a synthetic frozen nowcast for a released month derives its surprise)', async () => {
    const cpi = await fetchFredSeries(FRED_SERIES.usCpiIndexSa);
    const synthetic: SeriesPoint[] = [{ date: `${cpi[cpi.length - 1]!.date.slice(0, 7)}-01`, value: 0.24 }];
    const months = new Set<string>(); // the synthetic month is NOT on the page (released)
    const surprise = cpiSurpriseSeries(synthetic, months, cpi, []);
    return surprise.length === 1
      ? `synthetic nowcast 0.24 for ${surprise[0]!.date.slice(0, 7)} → surprise ${surprise[0]!.value}pp (mechanics check, not data)`
      : `unexpected ${surprise.length}`;
  });

  await step('ECB Eurosystem total assets (the I11 ECB leg)', async () => {
    const ecb = await fetchEcbEurosystemAssets();
    return `${ecb.length} points · ${tail(ecb)} (EUR millions)`;
  });

  await step('FRED JPNASSETS (the I11 BoJ leg)', async () => {
    const boj = await fetchFredSeries(FRED_SERIES.bojAssets);
    return `${boj.length} points · ${tail(boj)} (¥100 millions)`;
  });

  await step('FRED WALCL (the I11 Fed leg)', async () => {
    const walcl = await fetchFredSeries(FRED_SERIES.walcl);
    return `${walcl.length} points · ${tail(walcl, 2)} ($ millions)`;
  });

  await step('the I11 global-liquidity derivation (the live legs, USD trillions)', async () => {
    const [ecb, boj, walcl, fx] = await Promise.all([
      fetchEcbEurosystemAssets(),
      fetchFredSeries(FRED_SERIES.bojAssets),
      fetchFredSeries(FRED_SERIES.walcl),
      fetchFrankfurterSeries(DECADE_START, ['EUR', 'JPY']),
    ]);
    const aggregate = globalLiquiditySeries(walcl, ecb, boj, fx.EUR ?? [], fx.JPY ?? []);
    return `${aggregate.length} months · ${tail(aggregate, 4)} ($tn)`;
  });

  await step('BAZG gold imports (F16 — the Swiss flow)', async () => {
    const flow = await fetchBazgGoldImports();
    const values = flow.map((p) => p.value);
    return `${flow.length} months (${flow[0]!.date.slice(0, 7)} → ${flow.at(-1)!.date.slice(0, 7)}) · min ${Math.min(...values)} t · max ${Math.max(...values)} t · ${tail(flow, 3)}`;
  });

  await step('SGE monthly Data Highlights (F15 — the withdrawals PDF)', async () => {
    const point = await fetchSgeMonthlyWithdrawal();
    return `${point.value} tonnes withdrawn @ ${point.date}`;
  });

  await step('the GLD/SPY ratio (X5)', async () => {
    const ratio = await fetchGoldEquitiesRatio();
    return `${ratio.ratio.length} points · ${tail(ratio.ratio, 2)}`;
  });

  await step('the NY Fed HLW r-star workbook (R11)', async () => {
    const rstar = await fetchHlwRstar();
    return `${rstar.length} quarters (${rstar[0]!.date.slice(0, 4)} → ${rstar.at(-1)!.date.slice(0, 4)}) · ${tail(rstar, 3)}`;
  });

  await step('the I10 real gold price derivation (gold month-close ÷ CPIAUCNS)', async () => {
    const [gold, cpi] = await Promise.all([
      fetchYahooQuote('GC=F', '10y'),
      fetchFredSeries(FRED_SERIES.usCpiIndex),
    ]);
    const real = realGoldPriceSeries(gold.points, cpi);
    return `${real.length} months · ${tail(real, 3)} (1982–84 dollars)`;
  });

  console.log('# done');
}

void main();
