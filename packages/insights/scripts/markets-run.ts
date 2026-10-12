/**
 * World stock markets — manual runner / KV seeder (the markets twin of
 * ingest.ts). Runs the SAME orchestration as the currena-markets Worker
 * cron (runMarketsUpdate — the two cannot drift) and writes through the
 * Cloudflare REST API (RestMarketsStore, "Path B").
 *
 * Modes:
 *   default          live fetch (EODHD → Yahoo), compute, write-if-changed
 *   --dry-run        fetch + compute + report only — no KV writes
 *   --seed-from DIR  use the cached provider answers written by
 *                    markets-data-check.ts instead of live calls — the
 *                    post-deploy initial seed costs ZERO EODHD quota.
 *
 * Environment:
 *   EODHD_API_TOKEN             (live fetch; not needed with --seed-from)
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights markets-run --dry-run
 *   pnpm --filter @currena/insights markets-run --seed-from fixtures/markets-live
 */

import { readFileSync, existsSync } from 'node:fs';
import { parseEodhdEodResponse, parseYahooChartResponse, ProviderError } from '../src/markets/providers';
import type { MarketSeries } from '../src/markets/providers';
import { defaultFetchers } from '../src/markets/job';
import type { MarketJobFetchers } from '../src/markets/job';
import { runMarketsUpdate, formatRunReport } from '../src/markets/run';
import { RestMarketsStore } from '../src/markets/store';
import type { MarketsReader, MarketsWriter } from '../src/markets/store';
import { MARKETS } from '../src/markets/definitions';
import type { MarketId } from '@currena/core';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const seedIndex = args.indexOf('--seed-from');
const seedDir = seedIndex >= 0 ? args[seedIndex + 1] : undefined;

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;
const eodhdToken = process.env.EODHD_API_TOKEN;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[markets-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}
if (seedDir === undefined && !eodhdToken) {
  console.error('\n[markets-run] FATAL: live fetch needs EODHD_API_TOKEN (or pass --seed-from <dir> to replay cached answers).');
  process.exit(1);
}

/* ---------------- fetchers ---------------- */

let fetchers: MarketJobFetchers;

if (seedDir !== undefined) {
  const dir = seedDir.endsWith('/') ? seedDir : `${seedDir}/`;
  const cached = (provider: 'eodhd' | 'yahoo', id: MarketId): string | null => {
    const file = `${dir}${provider}-${id}.json`;
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  fetchers = {
    fetchEodhd: async (id) => {
      const market = MARKETS.find((m) => m.id === id)!;
      if (market.eodhdCode === null) throw new ProviderError('eodhd', id, 'no EODHD code for this market');
      const raw = cached('eodhd', id);
      if (raw === null) throw new ProviderError('eodhd', id, `no cached answer at ${dir}eodhd-${id}.json`);
      return { id, source: 'eodhd', points: parseEodhdEodResponse(JSON.parse(raw), id) };
    },
    fetchYahoo: async (id) => {
      const raw = cached('yahoo', id);
      if (raw === null) throw new ProviderError('yahoo', id, `no cached answer at ${dir}yahoo-${id}.json`);
      return { id, source: 'yahoo', points: parseYahooChartResponse(JSON.parse(raw), id) };
    },
  };
  console.log(`# markets-run — SEED mode (${dir}) — zero live provider calls\n`);
} else {
  fetchers = defaultFetchers({ apiToken: eodhdToken! });
  console.log('# markets-run — live fetch\n');
}

/* ---------------- store ---------------- */

let store: MarketsReader & MarketsWriter;
if (dryRun) {
  const memory: { value: string | null } = { value: null };
  store = {
    getMarkets: async () => {
      try {
        return memory.value === null ? undefined : (JSON.parse(memory.value) as never);
      } catch {
        return undefined;
      }
    },
    putMarketsIfChanged: async () => 'written',
  };
} else {
  store = new RestMarketsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });
}

/* ---------------- run ---------------- */

const result = await runMarketsUpdate({ store, fetchers }, 'main');
console.log(formatRunReport(result));
console.log();

if (dryRun) {
  console.log('DRY-RUN — no KV writes were made.');
  if (result.snapshot !== undefined) {
    console.log(
      `Snapshot summary: count=${result.snapshot.summary.count} · rose=${result.snapshot.summary.roseToday} · ` +
        `attention=${result.snapshot.summary.nAttention} · unusual=${result.snapshot.summary.nUnusual} · ` +
        `signal=${result.snapshot.summary.signal} · worst=${result.snapshot.summary.worstGroup ?? '—'} · ` +
        `payload=${JSON.stringify(result.snapshot).length} bytes`,
    );
  }
}

if (result.writeError !== undefined) {
  // A bounced write is not fatal for the data (the retry run lands it), but
  // a manual runner should still exit non-zero so the operator sees it.
  console.error(`\n[markets-run] KV write failed: ${result.writeError}`);
  process.exit(1);
}
