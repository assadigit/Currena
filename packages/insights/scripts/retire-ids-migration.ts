/**
 * retire-ids-migration.ts — the OD-7 KV surgery (2026-10-23, D-42).
 *
 * Retiring indicator ids (nzd-usd + silver-btc this round) is a SCHEMA
 * MIGRATION for the stored KV documents — the eth-usd lesson (2026-10-21c):
 * the new Worker's strict Zod parse rejects every stored doc that still
 * carries a retired id (the live snapshot, the public projection, the
 * daily archives, the public archives) until they are surgically migrated:
 * strip the retired readings + changedThisWeek entries, recompute both
 * section summaries with the CURRENT gauges (the m2-us demotion rides the
 * same recompute), validate against the NEW schema, write back. The
 * orphaned histories are deleted; today's public projection + archive are
 * re-written exactly as the daily rung would (projectSnapshotToPublic).
 *
 * Run BEFORE deploying the retirement (the old code's id enum is a
 * superset — it serves the migrated 63-reading docs unchanged, so the page
 * never breaks); the next rung then rebuilds everything from source.
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (required)
 *   CLOUDFLARE_ACCOUNT_ID       (required)
 *   INSIGHTS_KV_NAMESPACE_ID    (required — the RATES namespace)
 *
 * Manual: pnpm --filter @currena/insights exec tsx scripts/retire-ids-migration.ts
 */

import { readFileSync } from 'node:fs';

import { InsightsSnapshotSchema } from '@currena/core';

import { summarizeByGauges } from '../src/gauges';
import { projectSnapshotToPublic } from '../src/adapters/index';
import { RestInsightsStore, INSIGHTS_ARCHIVE_PREFIX, INSIGHTS_ARCHIVE_PUBLIC_PREFIX } from '../src/store';
import type { IndicatorReading, InsightsSnapshot } from '@currena/core';

function fail(message: string): never {
  console.error(`\n[retire-migration] FATAL: ${message}`);
  process.exit(1);
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;
if (!apiToken || !accountId || !namespaceId) {
  fail('missing environment — needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID');
}

/** The retired ids (OD-7, D-42, 2026-10-23). */
const RETIRED: ReadonlySet<string> = new Set(['nzd-usd', 'silver-btc']);

/** DRY_RUN=1: run every read + transform + validate, write nothing. */
const DRY_RUN = process.env.DRY_RUN === '1';

const store = new RestInsightsStore({ apiToken, accountId, namespaceId, retryDelaysMs: [] });

/** Write gate: every mutation goes through here so DRY_RUN holds them all. */
async function commit(label: string, write: () => Promise<unknown>): Promise<void> {
  if (DRY_RUN) {
    console.log(`[dry-run] would apply: ${label}`);
    return;
  }
  await write();
  console.log(`✍ ${label}`);
}

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`;

/** Raw key read — bypasses the store's schema parse (the stored doc still carries retired ids). */
async function rawGet(key: string): Promise<unknown | null> {
  const res = await fetch(`${baseUrl}/values/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) fail(`GET ${key} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return JSON.parse(await res.text()) as unknown;
}

/** Raw key delete (the store has no delete method; the orphaned history must go). */
async function rawDelete(key: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`[dry-run] would delete: ${key}`);
    return;
  }
  const res = await fetch(`${baseUrl}/values/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (res.ok) {
    console.log(`🗑 ${key}`);
  } else if (res.status === 404) {
    console.log(`–  ${key} (already absent)`);
  } else {
    fail(`DELETE ${key} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

/** The strip + recompute + validate step shared by every snapshot-family doc. */
function migrateDoc(raw: unknown, label: string): { snapshot: InsightsSnapshot; stripped: number } {
  if (typeof raw !== 'object' || raw === null) fail(`${label}: not an object`);
  const doc = raw as {
    readings?: unknown[];
    changedThisWeek?: { id: string }[];
    [k: string]: unknown;
  };
  if (!Array.isArray(doc.readings)) fail(`${label}: no readings array`);
  // The raw readings are validated by the final schema parse below; the
  // intermediate type only lets summarizeByGauges read id + status.
  const readingsBefore = doc.readings.length;
  const readings = doc.readings.filter(
    (r): r is IndicatorReading =>
      typeof r === 'object' && r !== null && !RETIRED.has((r as { id: string }).id),
  );
  const changedThisWeek = Array.isArray(doc.changedThisWeek)
    ? doc.changedThisWeek.filter((e) => !RETIRED.has(e.id))
    : [];
  const stripped = readingsBefore - readings.length;
  // The OD-7 demotion rides the same surgery: m2-us's STORED reading still
  // carries its scored status (normal/warning) from the old yoy-negative
  // rule; the new engine produces 'context' for an info rule — set it now
  // so the served card and the recomputed 22-voter summary agree until the
  // next rung rebuilds the reading from source.
  for (const r of readings) {
    if (r.id === 'm2-us') r.status = 'context';
  }
  const migrated = InsightsSnapshotSchema.parse({
    ...doc,
    summary: summarizeByGauges(readings),
    readings,
    changedThisWeek,
  });
  return { snapshot: migrated, stripped };
}

/* ---------------------------------------------------------------- *
 * 1. The live private snapshot
 * ---------------------------------------------------------------- */
console.log('[retire-migration] OD-7 KV surgery — retiring:', [...RETIRED].join(', '));
const liveRaw = await rawGet('insights:snapshot');
if (!liveRaw) fail('no stored snapshot under insights:snapshot');
const live = migrateDoc(liveRaw, 'insights:snapshot');
await commit(
  `insights:snapshot (${live.stripped} readings stripped, ${live.snapshot.readings.length} remain, ` +
    `summary: global ${live.snapshot.summary.global.label ?? '—'}/${live.snapshot.summary.global.votingCount}v · ` +
    `australia ${live.snapshot.summary.australia.label ?? '—'}/${live.snapshot.summary.australia.votingCount}v)`,
  () => store.putSnapshot(live.snapshot),
);

/* ---------------------------------------------------------------- *
 * 2. The public projection + today's public archive (as the rung writes them)
 * ---------------------------------------------------------------- */
const repoRoot = new URL('../../../', import.meta.url);
const overrides = JSON.parse(
  readFileSync(new URL('data/site-mode-overrides.json', repoRoot), 'utf8'),
) as { hiddenIndicatorIds: string[] };
const hiddenIds: ReadonlySet<string> = new Set(overrides.hiddenIndicatorIds);
const publicSnapshot = projectSnapshotToPublic(live.snapshot, hiddenIds);
await commit(
  `insights:snapshot-public (${publicSnapshot.readings.length} public readings)`,
  () => store.putPublicSnapshot(publicSnapshot),
);
const today = live.snapshot.generatedAt.slice(0, 10);
await commit(`insights:archive-public:v1:${today}`, () => store.putPublicArchive(today, publicSnapshot));

/* ---------------------------------------------------------------- *
 * 3. Every stored archive + public archive still carrying a retired id
 * ---------------------------------------------------------------- */
const keysRes = await fetch(`${baseUrl}/keys?prefix=insights:archive&limit=100`, {
  headers: { Authorization: `Bearer ${apiToken}` },
});
if (!keysRes.ok) fail(`list archive keys → HTTP ${keysRes.status}`);
const keyNames = ((await keysRes.json()) as { result: { name: string }[] }).result.map((k) => k.name);
for (const key of keyNames.sort()) {
  const raw = await rawGet(key);
  if (!raw) continue;
  const doc = raw as { readings?: { id: string }[] };
  const carries = Array.isArray(doc.readings) && doc.readings.some((r) => RETIRED.has(r.id));
  if (!carries) {
    console.log(`–  ${key} (carries neither retired id — untouched)`);
    continue;
  }
  if (key.startsWith(INSIGHTS_ARCHIVE_PUBLIC_PREFIX)) {
    const date = key.slice(INSIGHTS_ARCHIVE_PUBLIC_PREFIX.length);
    const migrated = migrateDoc(raw, key);
    await commit(
      `${key} (${migrated.stripped} stripped, each day's own hidden-set filtering preserved)`,
      () => store.putPublicArchive(date, migrated.snapshot),
    );
  } else if (key.startsWith(INSIGHTS_ARCHIVE_PREFIX)) {
    const date = key.slice(INSIGHTS_ARCHIVE_PREFIX.length);
    const migrated = migrateDoc(raw, key);
    await commit(`${key} (${migrated.stripped} stripped)`, () => store.putArchive(date, migrated.snapshot));
  }
}

/* ---------------------------------------------------------------- *
 * 4. The orphaned history keys
 * ---------------------------------------------------------------- */
await rawDelete('insights:hist:nzd-usd');
await rawDelete('insights:hist:silver-btc');

console.log(
  `\n[retire-migration] ${DRY_RUN ? 'DRY RUN complete — nothing written. ' : 'done — '}${store.ops.writes} writes, ${store.ops.reads} reads. ` +
    'The next scheduled rung rebuilds everything from source.',
);
