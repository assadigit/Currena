/**
 * Gold Program S4 — the backtest corpus recorder (GOLD_BACKTEST_SPEC.md §2).
 *
 * Records, ONCE per corpus refresh, everything the gold backtest harness
 * needs from the read-only Cloudflare KV (the RATES namespace), and writes
 * it to `packages/insights/fixtures/gold-backtest-corpus.json` — the
 * committed, static-evidence venue the harness then reads (the fixtures
 * discipline: the harness and every test stay offline; AGENTS.md rule 7).
 *
 * What it records (and NOTHING else — no snapshot, no writes, read-only):
 *  - the `insights:ingest-stage:v1` blob's series for the 20 gold voters +
 *    breakeven-tilt + gold-usd + the cross-fill legs (us10y = DGS10,
 *    breakeven-10y = T10YIE) + t5yie (the tilt leg / the asOf-watch's
 *    decade-group member);
 *  - the `insights:hist:gold-usd` history verbatim (the B2 realized-move
 *    series, per the spec);
 *  - every `insights:archive:v1:*` day's readings for the same ids (the
 *    live out-of-sample slice), zod-validated with the production snapshot
 *    schema, plus the goldSummary presence flag.
 *
 * MANUAL script (like backtest.ts / live-run.ts): never part of the test
 * suite. Credentials come from the environment ONLY
 * (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID — the same names wrangler
 * uses); they are never logged, echoed or written anywhere.
 *
 * Run: pnpm --filter @currena/insights gold-corpus-dump
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { InsightsSnapshotSchema } from '@currena/core';

import { GOLD_LANE_VOTERS } from '../src/gold-score';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(HERE, '..', 'fixtures', 'gold-backtest-corpus.json');

/** The RATES KV namespace id (apps/api/wrangler.jsonc — public config, not a secret). */
const RATES_NAMESPACE_ID = '4627ac33a4b148ff9fc2189266b1890e';

/** The 21st voter under evaluation (D-5) — recorded so B4 can run offline. */
const TILT_ID = 'breakeven-tilt' as const;

/** Everything the harness reads: the voters, the tilt, gold, the cross-fill legs, the watch members. */
const CORPUS_SERIES_IDS: readonly string[] = [
  ...GOLD_LANE_VOTERS.map((v) => v.id as string),
  TILT_ID,
  'gold-usd', // the B2 realized-move join (stage copy — the corpus note)
  'us10y', // = DGS10 (derived.ts passthrough) — the cross-fill's nominal leg
  'breakeven-10y', // = T10YIE (passthrough) — the cross-fill's breakeven leg
  't5yie', // the tilt's 5y-spot leg + the asOf-watch's decade-group member
];

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
if (API_TOKEN === undefined || API_TOKEN === '' || ACCOUNT_ID === undefined || ACCOUNT_ID === '') {
  console.error(
    '[gold-corpus-dump] CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set (read-only KV credentials). Nothing was read or written.',
  );
  process.exit(1);
}

const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${RATES_NAMESPACE_ID}`;

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${API_TOKEN}` };
}

async function kvListKeys(prefix: string): Promise<string[]> {
  const names: string[] = [];
  let cursor = '';
  for (;;) {
    const url =
      `${BASE}/keys?limit=1000&prefix=${encodeURIComponent(prefix)}` +
      (cursor === '' ? '' : `&cursor=${encodeURIComponent(cursor)}`);
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`KV key list failed: HTTP ${res.status}`);
    const body = (await res.json()) as {
      success: boolean;
      result: { name: string }[];
      result_info?: { cursor?: string };
    };
    if (!body.success) throw new Error('KV key list failed: success=false');
    names.push(...body.result.map((k) => k.name));
    cursor = body.result_info?.cursor ?? '';
    if (cursor === '') break;
  }
  return names;
}

async function kvGetValue(key: string): Promise<string> {
  const res = await fetch(`${BASE}/values/${encodeURIComponent(key)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`KV value read failed for ${key}: HTTP ${res.status}`);
  return await res.text();
}

/* ------------------------------------------------------------------ *
 * Read the venues (read-only)
 * ------------------------------------------------------------------ */

console.log(`# Gold backtest corpus dump — ${new Date().toISOString()}`);
console.log(`venue: RATES KV (read-only REST), ${CORPUS_SERIES_IDS.length} series ids + archives\n`);

// (1) The stage blob — the exact series feeding the scoring math (G1a-audited).
const stageRaw = await kvGetValue('insights:ingest-stage:v1');
const stage = JSON.parse(stageRaw) as {
  v: number;
  writtenAt: string;
  series: Record<string, Array<[number, number]>>;
};
if (typeof stage.v !== 'number' || typeof stage.writtenAt !== 'string' || typeof stage.series !== 'object') {
  throw new Error('Stage blob shape unexpected — aborting (never record garbage).');
}
console.log(`stage: v${stage.v}, writtenAt ${stage.writtenAt}, ${Object.keys(stage.series).length} series`);

const series: Record<string, Array<[number, number]>> = {};
const seriesMissing: string[] = [];
for (const id of CORPUS_SERIES_IDS) {
  const pts = stage.series[id];
  if (pts === undefined || !Array.isArray(pts) || pts.length === 0) {
    seriesMissing.push(id);
    continue;
  }
  // Loud structural check: ascending epoch days, finite values.
  for (let i = 1; i < pts.length; i++) {
    if (pts[i]![0] <= pts[i - 1]![0]) throw new Error(`Stage series ${id}: epoch days not ascending at index ${i}`);
    if (!Number.isFinite(pts[i]![1])) throw new Error(`Stage series ${id}: non-finite value at index ${i}`);
  }
  series[id] = pts;
}
for (const id of Object.keys(series)) {
  const pts = series[id]!;
  console.log(
    `  ${id.padEnd(24)} n=${String(pts.length).padStart(5)}  epochDay ${pts[0]![0]} → ${pts[pts.length - 1]![0]}`,
  );
}
if (seriesMissing.length > 0) console.log(`  (absent from the stage: ${seriesMissing.join(', ')})`);

// (2) The realized-move series — insights:hist:gold-usd, verbatim (the spec's B2 venue).
const goldHistRaw = await kvGetValue('insights:hist:gold-usd');
const goldHist = JSON.parse(goldHistRaw) as { id: string; points: Array<[number, number]> };
if (goldHist.id !== 'gold-usd' || !Array.isArray(goldHist.points)) {
  throw new Error('insights:hist:gold-usd shape unexpected — aborting.');
}
console.log(`\ninsights:hist:gold-usd: n=${goldHist.points.length}  epochDay ${goldHist.points[0]![0]} → ${goldHist.points[goldHist.points.length - 1]![0]}`);

// (3) The daily archives — the live out-of-sample slice.
const archiveKeys = (await kvListKeys('insights:archive:v1:')).sort();
const archiveDays = archiveKeys.map((k) => k.slice('insights:archive:v1:'.length));
console.log(`\narchives: ${archiveDays.length} full day(s): ${archiveDays[0]} → ${archiveDays[archiveDays.length - 1]}`);

interface ArchiveExtract {
  generatedAt: string;
  goldSummary: { present: boolean; netScore?: number; label?: string };
  readings: Array<{
    id: string;
    value: number | null;
    asOf: string | null;
    status: string;
    percentile10y?: number;
    change30d?: number;
  }>;
}
const archives: Record<string, ArchiveExtract> = {};
const archiveIds = new Set(CORPUS_SERIES_IDS);
for (const day of archiveDays) {
  const raw = await kvGetValue(`insights:archive:v1:${day}`);
  const parsed = InsightsSnapshotSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(`Archive ${day} failed the production snapshot schema — aborting (never record garbage).`);
  }
  const snap = parsed.data;
  const readings = snap.readings
    .filter((r) => archiveIds.has(r.id as string))
    .map((r) => ({
      id: r.id as string,
      value: r.value,
      asOf: r.asOf,
      status: r.status,
      ...(r.percentile10y !== undefined ? { percentile10y: r.percentile10y } : {}),
      ...(r.change30d !== undefined ? { change30d: r.change30d } : {}),
    }));
  archives[day] = {
    generatedAt: snap.generatedAt,
    goldSummary: {
      present: snap.goldSummary !== undefined,
      ...(snap.goldSummary !== undefined
        ? { netScore: snap.goldSummary.netScore, label: snap.goldSummary.label ?? undefined }
        : {}),
    },
    readings,
  };
}
const goldSummaryDays = archiveDays.filter((d) => archives[d]!.goldSummary.present);
console.log(`goldSummary present on: ${goldSummaryDays.join(', ') || '(none)'}`);

// The asOf-watch table (the S3 known-gap; spec §0 first action) — printed for
// the session record; the corpus carries the raw readings so the harness can
// re-derive it offline.
console.log('\nasOf-watch (trio vs decade group), newest 6 archive days:');
console.log('  day         us10y       us30y       real-yield  T5YIFR(5y5y) t5yie');
for (const day of archiveDays.slice(-6)) {
  const byId = new Map(archives[day]!.readings.map((r) => [r.id, r]));
  const cell = (id: string) => byId.get(id)?.asOf ?? '—';
  console.log(
    `  ${day}  ${cell('us10y').padEnd(11)} ${cell('us30y').padEnd(11)} ${cell('real-yield-10y').padEnd(11)} ${cell('breakeven-5y5y').padEnd(12)} ${cell('t5yie')}`,
  );
}

/* ------------------------------------------------------------------ *
 * Write the corpus
 * ------------------------------------------------------------------ */

const corpus = {
  v: 1,
  recordedAt: new Date().toISOString(),
  venues: {
    stage: { key: 'insights:ingest-stage:v1', writtenAt: stage.writtenAt, seriesCount: Object.keys(stage.series).length },
    goldHist: { key: 'insights:hist:gold-usd', points: goldHist.points.length },
    archives: { keyPrefix: 'insights:archive:v1:', days: archiveDays.length },
  },
  /** The voters + tilt + gold + cross-fill legs, from the stage blob ([epochDay, value]). */
  series,
  /** The realized-move series (insights:hist:gold-usd, verbatim points). */
  goldHist: { id: goldHist.id, points: goldHist.points },
  /** Per archive day: the corpus ids' readings as that day's rung stamped them (the live slice). */
  archives,
  /** The extraction set, recorded so the shape is self-describing. */
  seriesIds: CORPUS_SERIES_IDS,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, `${JSON.stringify(corpus)}\n`, 'utf-8');
console.log(`\n✍ ${OUT_PATH} (${(JSON.stringify(corpus).length / 1024).toFixed(0)} KB)`);
console.log('Read-only session: 0 writes to KV.');
