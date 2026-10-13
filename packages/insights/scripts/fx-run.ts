/**
 * World currencies — manual runner / KV seeder (the fx twin of
 * markets-run.ts). Runs the SAME orchestration as the currena-markets
 * Worker cron (runFxUpdate — the two cannot drift) and writes through the
 * Cloudflare REST API (RestFxStore, "Path B").
 *
 * Modes:
 *   default    live fetch (Frankfurter ONE call, Yahoo fallback), compute,
 *              write-if-changed
 *   --dry-run  fetch + compute + report only — no KV writes
 *
 * Environment:
 *   EODHD_API_TOKEN             (unused here — the fx job is keyless)
 *   CLOUDFLARE_API_TOKEN        (reads + writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (reads + writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights fx-run --dry-run
 *   pnpm --filter @currena/insights fx-run
 */

import { defaultFxFetchers } from '../src/fx/job';
import { runFxUpdate, formatFxRunReport } from '../src/fx/run';
import { RestFxStore } from '../src/fx/store';
import type { FxCrossReader, FxReader, FxWriter } from '../src/fx/store';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[fx-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

/* ---------------- store ---------------- */

let store: FxReader & FxWriter & FxCrossReader;
if (dryRun) {
  const memory: { fx: string | null; markets: string | null; gold: string | null; insights: string | null } = {
    fx: null,
    markets: null,
    gold: null,
    insights: null,
  };
  store = {
    getFx: async () => {
      try {
        return memory.fx === null ? undefined : (JSON.parse(memory.fx) as never);
      } catch {
        return undefined;
      }
    },
    putFxIfChanged: async (next) => {
      memory.fx = JSON.stringify(next);
      return 'written';
    },
    getMarkets: async () => {
      try {
        return memory.markets === null ? undefined : (JSON.parse(memory.markets) as never);
      } catch {
        return undefined;
      }
    },
    getGoldHistory: async () => {
      try {
        return memory.gold === null ? undefined : (JSON.parse(memory.gold) as never);
      } catch {
        return undefined;
      }
    },
    getInsightsSnapshot: async () => {
      try {
        return memory.insights === null ? undefined : (JSON.parse(memory.insights) as never);
      } catch {
        return undefined;
      }
    },
  };
  console.log('# fx-run — DRY-RUN (in-memory store, no KV reads or writes)\n');
} else {
  store = new RestFxStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });
  console.log('# fx-run — live fetch (Frankfurter → Yahoo), REST writes\n');
}

/* ---------------- run ---------------- */

const result = await runFxUpdate({ store, cross: store, fetchers: defaultFxFetchers() });
console.log(formatFxRunReport(result));
console.log();

if (dryRun) {
  console.log('DRY-RUN — no KV reads or writes were made.');
  if (result.snapshot !== undefined) {
    console.log(
      `Snapshot summary: pairs=${result.snapshot.pairs.length} · signal=${result.snapshot.summary.signal} · ` +
        `counted=${result.snapshot.summary.countedWarnings} · headline=${result.snapshot.summary.headlineRule ?? '—'} · ` +
        `payload=${JSON.stringify(result.snapshot).length} bytes`,
    );
  }
}

if (result.writeError !== undefined) {
  // A bounced write is not fatal for the data (the next cron run lands it),
  // but a manual runner should still exit non-zero so the operator sees it.
  console.error(`\n[fx-run] KV write failed: ${result.writeError}`);
  process.exit(1);
}
