/**
 * World stock markets — one-off LENS BACKFILL runner (round 46).
 *
 * Why this exists: `markets-run` refuses to rewrite a row whose date and
 * close already match the stored one (the R5 same-date stability rule —
 * it keeps the 23:30→01:30 double-run write-free on weekends). That is
 * right for CLOSES, but it also keeps a stored snapshot written BEFORE a
 * new derived field existed (round 46's chg1w) until the next trading day
 * moves a close — over a weekend that leaves the new lens honest-dashed
 * for two days.
 *
 * This runner backfills the derived fields WITHOUT touching the write
 * discipline:
 *
 *   read stored (write-gate base ONLY) → run the SAME fetch job with
 *   prev=undefined (every row resolves fresh; the closes are re-derived
 *   from live provider answers, never fabricated) → build → write ONLY
 *   if the content differs from the stored snapshot.
 *
 * The KV key is never deleted (no "being prepared" window) and a failure
 * anywhere simply leaves the stored snapshot untouched. The closes this
 * produces are the provider's own answers — on a weekend they measure
 * 0.000% from the stored ones, so the ONLY content change is the new
 * derived fields.
 *
 * Environment (same as markets-run):
 *   EODHD_API_TOKEN             (live fetch; required)
 *   CLOUDFLARE_API_TOKEN        (writes; required)
 *   CLOUDFLARE_ACCOUNT_ID       (writes; required)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes; required)
 *
 * Manual:
 *   pnpm --filter @currena/insights markets-backfill --dry-run
 */

import { defaultFetchers } from '../src/markets/job';
import { runMarketsJob } from '../src/markets/job';
import type { MarketJobFetchers } from '../src/markets/job';
import { buildMarketsSnapshot, marketsContentEqual } from '../src/markets/compute';
import { checkE05IdenticalMoves } from '../src/validation-step3';
import { InMemoryMarketsStore, RestMarketsStore } from '../src/markets/store';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;
const eodhdToken = process.env.EODHD_API_TOKEN;

if (!apiToken || !accountId || !namespaceId || !eodhdToken) {
  console.error(
    '\n[markets-backfill] FATAL: needs EODHD_API_TOKEN, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or --dry-run against the in-memory store).',
  );
  process.exit(1);
}

// Dry-run writes to MEMORY only — no REST call can escape with fake creds.
const store = dryRun
  ? new InMemoryMarketsStore()
  : new RestMarketsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });
const fetchers: MarketJobFetchers = defaultFetchers({ apiToken: eodhdToken! });

const now = new Date();
const runDate = now.toISOString().slice(0, 10);
const generatedAt = now.toISOString();

console.log(`# markets-backfill — round 46 lens backfill (${dryRun ? 'DRY-RUN' : 'live'}) · runDate ${runDate}\n`);

// The write-gate base: the TRUE stored snapshot (a dry-run with no stored
// value behaves like a first-ever write — acceptable for a --dry-run).
const stored = dryRun ? undefined : await store.getMarkets();
if (stored === undefined && !dryRun) {
  console.error('[markets-backfill] FATAL: nothing stored under insights:markets:v1 — a backfill has nothing to compare against; use markets-run to populate first.');
  process.exit(1);
}

// The job runs with prev=undefined: every row resolves fresh from the
// live provider answers. R5's same-date hold cannot keep a pre-lens row.
const job = await runMarketsJob(fetchers, { kind: 'main', providerOrder: 'eodhd-first' }, undefined, runDate);
const snapshot = buildMarketsSnapshot({
  resolutions: job.resolutions,
  prev: undefined,
  runDate,
  generatedAt,
});
if (snapshot === undefined) {
  console.error('[markets-backfill] every provider failed — the stored snapshot stays untouched.');
  process.exit(1);
}

const lensRows = snapshot.markets.filter((m) => m.chg1w !== undefined && m.chg1m !== undefined).length;
console.log(`resolved ${snapshot.markets.length} rows · ${lensRows} carry both lenses (chg1w + chg1m)`);

const moveWarnings = checkE05IdenticalMoves(snapshot.markets.map((m) => ({ id: m.id as string, chg1d: m.chg1d })));
for (const w of moveWarnings) console.log(`  ⚠ E-05 ${w}`);

if (marketsContentEqual(stored, snapshot)) {
  console.log('→ unchanged (no write spent) — the stored snapshot already carries this content.');
  process.exit(0);
}

if (dryRun) {
  console.log('DRY-RUN — no KV writes were made.');
  console.log(`would write: asOf ${snapshot.markets[0]!.asOf} · payload ${JSON.stringify(snapshot).length} bytes · signal ${snapshot.summary.signal}`);
  process.exit(0);
}

const outcome = await store.putMarketsIfChanged(snapshot, stored);
if (outcome !== 'written') {
  console.error(`→ KV write did not land (${outcome}) — the stored snapshot stays untouched; re-run later.`);
  process.exit(1);
}
console.log(`→ written: asOf ${snapshot.markets[0]!.asOf} · payload ${JSON.stringify(snapshot).length} bytes · signal ${snapshot.summary.signal}`);

// Post-write verification: re-read and confirm every row carries chg1w.
const after = await store.getMarkets();
if (after === undefined || !after.markets.every((m) => m.chg1w !== undefined && m.chg1m !== undefined)) {
  console.error('→ VERIFICATION FAILED: the stored snapshot does not carry both lenses on every row.');
  process.exit(1);
}
console.log(`verified: all ${after.markets.length} stored rows carry both lenses.`);
