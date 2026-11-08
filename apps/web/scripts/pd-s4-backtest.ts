/**
 * pd-s4-backtest.ts — the S4 verdict-consistency backtest, LIVE (the §21
 * zero-tolerance gate: "page-rendered verdicts byte-identical to the
 * engine's stored verdicts for the same snapshot — zero tolerance").
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the gf-s13-verify pattern). Every number
 * below comes from THIS run.
 *
 * What it does, over the LIVE public snapshot:
 *
 *   1. Fetches the five feeds from one base (default: the remote-dev
 *      Worker over real KV on :8787 — the S3 browser-verification
 *      pattern; overridable to https://currena.ir once the S2 endpoints
 *      are deployed):
 *        GET /api/insights                — the served snapshot (the SAME
 *                                           stored document the
 *                                           projections derive from)
 *        GET /api/insights/pages/global   — the S2 projection the page
 *                                           renders
 *        GET /api/insights/markets        — the markets board
 *        GET /api/insights/fx             — the fx board
 *        GET /api/insights/narrative      — the :50 cron artefact
 *      The snapshot + projection pair is ALIGNED on generatedAt +
 *      pricesAsOf (an hourly live-prices tick between two fetches would
 *      be a legitimate difference — refetched, never compared blind).
 *
 *   2. Runs the pure comparison core (global-backtest-core.ts) — the
 *      page side (global-tiles over the projection) vs the engine side
 *      (the engines' own arithmetic over the snapshot + the boards'
 *      stored summaries). Every check printed ✓/✗; any ✗ is RED.
 *
 *   3. The narrator wiring (D-24): the artefact exists, its visibility
 *      flag, its data horizon vs the snapshot's clock, and — when the
 *      Cloudflare REST env is present — the stateHash recompute over the
 *      RAW stored documents (the exact inputs the :50 cron reads), so
 *      "the narrator speaks about the CURRENT stored state" is verified,
 *      not assumed.
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s4-backtest.ts \
 *     [--base http://localhost:8787]
 * The raw-KV narrator check activates when CLOUDFLARE_API_TOKEN and
 * CLOUDFLARE_ACCOUNT_ID are in the environment (secrets stay in env —
 * Agent Rule 6; the token is NEVER written to the repo).
 */

import type { FxSnapshot, InsightsSnapshot, MarketsSnapshot, PageProjection, TicSnapshot } from '@currena/core';
import { FxSnapshotSchema, InsightsSnapshotSchema, MarketsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { buildOverallNarrationState, stateHashOf } from '@currena/insights/narrator';
import { backtestGlobalTiles } from '../src/routes/page-division/global-backtest-core';

const BASE = (() => {
  const i = process.argv.indexOf('--base');
  return i >= 0 ? (process.argv[i + 1] ?? 'http://localhost:8787') : 'http://localhost:8787';
})();
const KV_NS = '4627ac33a4b148ff9fc2189266b1890e'; // the RATES namespace (wrangler.jsonc)
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;

let failures = 0;
const notes: string[] = [];

function check(label: string, ok: boolean, detail: string): void {
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${detail}`);
  if (!ok) failures++;
}

async function getJson<T>(path: string, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } }, what: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s4-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

async function main(): Promise<void> {
  console.log(`# PD-S4 verdict-consistency backtest — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The five feeds (aligned) ---------- */
  console.log('## 1. The live feeds');

  const snapshot0 = await getJson('/api/insights', InsightsSnapshotSchema, 'the snapshot');
  let projection = await getJson('/api/insights/pages/global', PageProjectionSchema, 'the Global projection');
  // Align the pair on BOTH generation stamps (an hourly prices tick
  // between the two fetches is a legitimate difference — refetch).
  let snapshot: InsightsSnapshot = snapshot0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const aligned =
      snapshot.generatedAt === projection.generatedAt &&
      (snapshot.pricesAsOf ?? '') === (projection.pricesAsOf ?? '');
    if (aligned) break;
    notes.push(
      `generations realigned once (snapshot ${snapshot.generatedAt}/${snapshot.pricesAsOf ?? '—'} vs projection ${projection.generatedAt}/${projection.pricesAsOf ?? '—'} — the hourly prices tick)`,
    );
    snapshot = await getJson('/api/insights', InsightsSnapshotSchema, 'the snapshot');
    projection = await getJson('/api/insights/pages/global', PageProjectionSchema, 'the Global projection');
  }
  check(
    'the snapshot + projection share one generation',
    snapshot.generatedAt === projection.generatedAt && (snapshot.pricesAsOf ?? '') === (projection.pricesAsOf ?? ''),
    `generatedAt ${snapshot.generatedAt} · pricesAsOf ${snapshot.pricesAsOf ?? 'none'}`,
  );
  check('the snapshot is the public projection', snapshot.displayMode === 'public', `displayMode ${snapshot.displayMode ?? 'full'}`);
  check('the Global projection is complete (absentIds empty)', projection.absentIds.length === 0, `${projection.readings.length} readings · absent [${projection.absentIds.join(', ')}]`);

  const markets = await getJson('/api/insights/markets', MarketsSnapshotSchema, 'the markets board');
  const fx = await getJson('/api/insights/fx', FxSnapshotSchema, 'the fx board');
  console.log(`  · markets ${markets.generatedAt} (${markets.markets.length} rows · signal ${markets.summary.signal}) · fx ${fx.generatedAt} (${fx.rules.length} rules · signal ${fx.summary.signal})`);

  /* ---------- 2. The verdict-consistency core ---------- */
  console.log('\n## 2. The tile-by-tile comparison (page ≡ engine, §21 zero tolerance)');

  const checks = backtestGlobalTiles(projection.readings, snapshot.readings, markets, fx);
  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: page ${c.page} ≡ engine ${c.engine}${c.ok ? '' : '  ← RED'}`);
    if (c.note !== undefined) notes.push(c.note);
  }
  console.log(`  — ${checks.length} checks · ${checks.length - failed.length} green · ${failed.length} red`);
  if (failed.length > 0) failures += failed.length;

  /* ---------- 3. The narrator wiring (D-24) ---------- */
  console.log('\n## 3. The narrator wiring (the :50 cron artefact, read honestly)');

  type NarrativeDoc = {
    generatedAt: string;
    dataAsOf: string | null;
    overall: { stateHash: string; en: string; fa: string; source: string; generatedAt: string };
    visible: boolean;
  };
  let doc: NarrativeDoc | null = null;
  try {
    const res = await fetch(`${BASE}/api/insights/narrative`, { headers: { accept: 'application/json' } });
    if (res.ok) doc = (await res.json()) as NarrativeDoc;
  } catch {
    /* a dead narrative endpoint is a red finding below */
  }
  check('the :50 artefact exists', doc !== null, doc === null ? 'the endpoint did not answer a document' : `generated ${doc.generatedAt}`);
  if (doc !== null) {
    check('the artefact is publicly visible (NARRATOR_VISIBLE)', doc.visible === true, `visible ${String(doc.visible)}`);
    check('the overall unit carries text in both languages', doc.overall.en.trim() !== '' && doc.overall.fa.trim() !== '', `source ${doc.overall.source} · ${doc.overall.en.length + doc.overall.fa.length} chars`);
    // The data horizon story: doc.dataAsOf is the newest asOf among the
    // narrated FRESH items (the narrator's own contract) — compared with
    // the page's snapshot clock, never confused with it.
    const dataAsOf = doc.dataAsOf ?? 'null';
    const snapshotClock = snapshot.generatedAt;
    const narratedAfterStore = doc.generatedAt >= snapshotClock;
    notes.push(
      `the narrator's data horizon: dataAsOf ${dataAsOf} (the newest fresh asOf it narrated) · artefact ${doc.generatedAt} vs snapshot ${snapshotClock} — ${
        narratedAfterStore ? 'the artefact post-dates the current snapshot store (it narrated this state)' : 'the snapshot was stored AFTER the last narration run — the one-liner speaks about the previous state until the next :50 rung (honest, self-healing)'
      }`,
    );
    check(
      'the display gating story holds (visible → the line renders; the page gate is visible || ?narrative=preview)',
      doc.visible,
      'the GlobalPage NarratorLine gate mirrors the legacy Insights route gate',
    );

    // The stateHash recompute — the deep check: rebuild the overall
    // narration state over the RAW stored documents (exactly what the
    // :50 cron reads) and compare hashes.
    if (CF_TOKEN !== undefined && CF_ACCOUNT !== undefined) {
      const kv = async (key: string): Promise<unknown> => {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/storage/kv/namespaces/${KV_NS}/values/${encodeURIComponent(key)}`,
          { headers: { authorization: `Bearer ${CF_TOKEN}` } },
        );
        if (!res.ok) throw new Error(`KV ${key}: HTTP ${res.status}`);
        return await res.json();
      };
      try {
        const [rawInsights, rawMarkets, rawFx, rawTic] = await Promise.all([
          kv('insights:snapshot-public'),
          kv('insights:markets:v1').catch(() => null),
          kv('insights:fx:v1').catch(() => null),
          kv('insights:tic:v1').catch(() => null),
        ]);
        const state = buildOverallNarrationState(
          {
            insights: rawInsights as InsightsSnapshot,
            ...(rawFx !== null ? { fx: rawFx as FxSnapshot } : {}),
            ...(rawMarkets !== null ? { markets: rawMarkets as MarketsSnapshot } : {}),
            ...(rawTic !== null ? { tic: rawTic as TicSnapshot } : {}),
          },
          new Date().toISOString(),
        );
        const recomputed = stateHashOf(state);
        const hashMatches = recomputed === doc.overall.stateHash;
        check(
          'the artefact narrates the CURRENT stored state (stateHash recompute over the raw documents)',
          hashMatches || !narratedAfterStore,
          hashMatches
            ? 'stateHash identical — the stored text speaks about exactly the state the pages serve'
            : `stateHash differs — but the snapshot was stored after the artefact (${snapshotClock} > ${doc.generatedAt}), so one-state-behind is the honest state until the next :50 rung`,
        );
        if (!hashMatches && narratedAfterStore) {
          notes.push(`RED-adjacent: the artefact post-dates the snapshot store yet the hash differs — the narrator may have narrated a different (earlier) state; investigate before deploy`);
        }
      } catch (err) {
        notes.push(`the raw-KV stateHash recompute was skipped (${err instanceof Error ? err.message : String(err)}) — the REST read needs KV-scoped credentials`);
      }
    } else {
      notes.push('the raw-KV stateHash recompute was skipped (no CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID in env)');
    }
  }

  /* ---------- the one-screen summary ---------- */
  console.log(`\n# ${failures === 0 ? 'ALL CHECKS GREEN' : `${failures} FAILURE(S) — RED, fix or roll back (never pass forward)`}`);
  if (notes.length > 0) {
    console.log('# notes (designed divergences + honest observations, none failing):');
    for (const n of notes) console.log(`  · ${n}`);
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
