/**
 * local-snapshot-preview.mjs — Step 4's local real-data verification feed:
 * builds the SAME live 100-reading snapshot the selfcheck builds (collect
 * every source + the inline rung-2 collection) and writes it to
 * /tmp/local-snapshot.json, so a local static server can feed the built SPA
 * the exact post-deploy payload shape.
 *
 * Usage: cd packages/insights && ./node_modules/.bin/tsx ../../scripts/local-snapshot-preview.mjs
 */
import { writeFileSync } from 'node:fs';

const REPO = '/home/z/my-project/Currena';

const { runInsightsUpdate } = await import(`${REPO}/packages/insights/src/ingest/run.ts`);
const { HIDDEN_PUBLIC_IDS } = await import(`${REPO}/packages/insights/src/ingest/data.ts`);
const { collectRung2Sources, rung2FetchPlanFor, RUNG2_IDS } = await import(`${REPO}/packages/insights/src/adapters/rung2.ts`);

// The inline rung-2 collection — the same bootstrap plan the selfcheck runs.
const rung2Plan = rung2FetchPlanFor(new Date(), new Set(RUNG2_IDS));
console.log(`[preview] rung-2 plan — mof=${rung2Plan.mof} eiaWeekly=${rung2Plan.eiaWeekly} cftcWeekly=${rung2Plan.cftcWeekly} monthly=${rung2Plan.monthly}`);
const rung2 = await collectRung2Sources(rung2Plan);
for (const row of rung2.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} — ${row.detail}`);

// The no-op dry-run store: runInsightsUpdate skips every write; the build
// runs against the live fetches only.
const noopStore = { getSnapshot: async () => undefined, getHistory: async () => undefined };
const result = await runInsightsUpdate({
  store: noopStore,
  mode: 'manual',
  dryRun: true,
  hiddenPublicIds: HIDDEN_PUBLIC_IDS,
  rung2Series: rung2.series,
});
const snapshot = result.snapshot;
writeFileSync('/tmp/local-snapshot.json', JSON.stringify(snapshot));
console.log(`[preview] wrote /tmp/local-snapshot.json — ${snapshot.readings.length} readings, generatedAt=${snapshot.generatedAt}`);
for (const id of ['oecd-cli-us', 'oecd-cli-cn', 'oecd-cli-de', 'gpr-index', 'epu-us', 'jgb-10y', 'us-japan-10y-gap', 'cftc-gold-positioning', 'eia-crude-stocks']) {
  const r = snapshot.readings.find((x) => x.id === id);
  if (!r) { console.log(`  ${id}: MISSING`); continue; }
  const pct = r.percentile10y !== undefined ? ` pct10y=${Math.round(r.percentile10y * 100)}%` : '';
  const z = r.sd10y !== undefined ? ` z=${r.sd10y.toFixed(2)}` : '';
  console.log(`  ${id}: ${r.value} @ ${r.asOf} [${r.status}]${pct}${z}`);
}
