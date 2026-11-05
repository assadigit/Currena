/**
 * gf-p0-record-candidates.ts — the GF-P0 candidates recorder (read-only).
 *
 * Records, ONCE per calibration, every series the GF-P0 calibration needs
 * BEYOND the frozen gold-backtest corpus (fixtures/gold-backtest-corpus.json,
 * recorded 2026-11-03 — untouched), and writes two NEW fixtures beside it
 * (the fixtures discipline; the gold-corpus-dump precedent):
 *
 *  1. `fixtures/gf-p0-candidates.json` — the promotion candidates' staged
 *     series, read read-only from the live KV stage blob
 *     (`insights:ingest-stage:v1` — the exact series feeding the meter's
 *     readings; the same venue the corpus dump reads), PLUS two fresh
 *     source fetches through the repo's OWN adapters (read-only imports,
 *     the same files the production ingest reads — disclosed venues):
 *       - `ebp`  (Fed Board ebp_csv.csv) — absent from this week's stage
 *                 blob (its last credit-phase fetch failed; the file
 *                 itself is live, verified), fetched fresh;
 *       - `jgb-10y` (MOF jgbcme_all.csv) — the D-6 gap-derivation input
 *                 the corpus does not carry, fetched fresh.
 *  2. `fixtures/gf-p0-cftc-backfill.json` — the D-4 backfill measurement
 *     input: the CFTC legacy futures-only historical archive
 *     (dea/history/deacot<year>.zip, annual.txt — the LONG-format report
 *     whose gold rows carry EXACTLY the current deafut.txt's column
 *     layout: verified 2026-11-05, the 2026 file's gold row @ 2026-10-27
 *     is identical to the current deafut.txt's), parsed for the GOLD row
 *     per week with the production parse's own arithmetic-identity
 *     assertions. 2016..2026 (the corpus window's span). Read-only: no
 *     KV writes, no product code — the D-4 repair itself is GF-P1's,
 *     owner-gated; this records what the backfilled history WOULD stage.
 *
 * MANUAL script (the gold-corpus-dump discipline): never part of the test
 * suite. Credentials come from the environment ONLY
 * (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID — the same names wrangler
 * uses); they are never logged, echoed or written anywhere.
 *
 * Run: pnpm --filter @currena/insights gf-p0-record-candidates
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchEbpCsv } from '../src/adapters/credit';
import { fetchMofJgb10y } from '../src/adapters/mof';
import { insightsFetch } from '../src/adapters/fetch-policy';
import { readZipTextEntries } from '../src/adapters/zip';
import type { SeriesPoint } from '../src/series';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_CANDIDATES = join(HERE, '..', 'fixtures', 'gf-p0-candidates.json');
const OUT_CFTC = join(HERE, '..', 'fixtures', 'gf-p0-cftc-backfill.json');

/** The RATES KV namespace id (apps/api/wrangler.jsonc — public config, not a secret). */
const RATES_NAMESPACE_ID = '4627ac33a4b148ff9fc2189266b1890e';

/**
 * The promotion candidates' staged ids (the audit report §4's zero-new-fetch
 * class + the COFD questions + the object-choice alternatives — both GPR
 * objects and both EPU objects recorded so the owner's choices are
 * measurable): every id the GF-P0 scenarios seat beyond the frozen 21.
 */
const CANDIDATE_STAGE_IDS: readonly string[] = [
  'term-premium-10y', // R9 (rank 6)
  'ebp', // S4 (rank 7) — expected ABSENT (fresh-fetched below)
  'us-deficit-12m', // G1 (rank 8)
  't5yie', // R8 (rank 9) — also in the corpus; recorded here for one self-contained fixture
  'michigan-sentiment', // S13 (rank 10)
  'gpr-daily', // S7 (rank 11) — the daily object proposed
  'gpr-index', // S7 — the monthly alternative (the owner's object choice)
  'epu-us', // S8 (rank 15)
  'tpu-us', // S8 — the TPU complement (the owner's object choice)
  'michigan-1y-expectations', // I3 (rank 16)
  'sp500-breadth-ratio', // S6 ★ (rank 17, OI-GA-3)
  'usd-reserve-share', // D5 ★ (rank 13, OI-GA-3)
  'nyfed-custody', // G4 ★ (rank 18, OI-GA-3)
  'm2-us', // I7 ★ (rank 14, OI-GA-3)
  'cftc-gold-positioning', // F1 (rank 5) — the 1-point staged truth, recorded as-is
];

/** The CFTC legacy futures-only historical archive: one zip per report year. */
const CFTC_DEACOT_URL = (year: number): string => `https://www.cftc.gov/files/dea/history/deacot${year}.zip`;
const CFTC_YEARS: readonly number[] = Array.from({ length: 2026 - 2016 + 1 }, (_, i) => 2016 + i);

/** The exact gold row name (cftc.ts's own — the MICRO GOLD sibling must never match). */
const CFTC_GOLD_MARKET = 'GOLD - COMMODITY EXCHANGE INC.';

/** One week's gold positioning from the long-format historical archive. */
export interface GfCftcWeek {
  /** The report's Tuesday (ISO). */
  date: string;
  /** (NonComm Long − NonComm Short) ÷ Open Interest × 100 — the F1 production object. */
  netSharePct: number;
  /** NonComm Long ÷ Open Interest × 100 — the F2 proxy seat's object. */
  grossLongSharePct: number;
  /** NonComm Short ÷ Open Interest × 100 — the F2 design's complement (recorded, not seated). */
  grossShortSharePct: number;
  /** The row's own open-interest field. */
  openInterest: number;
}

/**
 * Parse one annual.txt body (the LONG format: a header row, then the quoted
 * market name + the SAME field layout the current deafut.txt carries after
 * the name — verified: the (All) columns sit at exactly the production
 * parse's positions). Mirrors parseCftcGoldPositioning's assertions: the
 * arithmetic identity (NonComm Long + Spread + Comm Long = Total Reportable
 * Long, both sides), finite fields, OI > 0, the share band. Failures throw
 * loudly per row — the caller discloses them, never silently skips.
 */
function parseGoldRows(text: string): GfCftcWeek[] {
  const out: GfCftcWeek[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (trimmed.startsWith('"Market and Exchange Names"')) continue; // the header row
    const nameMatch = /^"([^"]*)"/.exec(trimmed);
    if (nameMatch === null || nameMatch[1] !== CFTC_GOLD_MARKET) continue;
    const rest = trimmed.slice(nameMatch[0].length);
    const fields = rest.split(',');
    // The quoted-name prefix leaves a leading empty field — drop it so the
    // map starts at the YYMMDD date (the production parse's own rule).
    if (fields[0] !== undefined && fields[0]!.trim() === '') fields.shift();
    if (fields.length < 14) {
      throw new Error(`annual gold row carries ${fields.length} fields (expected ≥14 — layout change?)`);
    }
    const iso = (fields[1] ?? '').trim().replace(/"/g, '');
    const ymd = (fields[0] ?? '').trim();
    const m = /^(\d{2})(\d{2})(\d{2})$/.exec(ymd);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : m !== null ? `20${m[1]!}-${m[2]!}-${m[3]!}` : '';
    if (date === '') throw new Error('annual gold row: no parsable date');
    const oi = Number(fields[6]!.trim());
    const long = Number(fields[7]!.trim());
    const short = Number(fields[8]!.trim());
    const spread = Number(fields[9]!.trim());
    const commLong = Number(fields[10]!.trim());
    const commShort = Number(fields[11]!.trim());
    const totLong = Number(fields[12]!.trim());
    const totShort = Number(fields[13]!.trim());
    const numbers = [oi, long, short, spread, commLong, commShort, totLong, totShort];
    if (numbers.some((n) => !Number.isFinite(n))) {
      throw new Error(`annual gold row @ ${date}: non-numeric field (layout change?)`);
    }
    // The file's own arithmetic identity (the production parse's strongest
    // assertion — proves the column map on every row).
    if (long + spread + commLong !== totLong || short + spread + commShort !== totShort) {
      throw new Error(`annual gold row @ ${date}: the reportable-positions identity fails (layout change?)`);
    }
    if (oi <= 0) throw new Error(`annual gold row @ ${date}: open interest ${oi}`);
    const netSharePct = ((long - short) / oi) * 100;
    const grossLongSharePct = (long / oi) * 100;
    const grossShortSharePct = (short / oi) * 100;
    if (netSharePct < -100 || netSharePct > 100) {
      throw new Error(`annual gold row @ ${date}: net share ${netSharePct.toFixed(2)}% outside [-100, 100]`);
    }
    out.push({
      date,
      netSharePct: Math.round(netSharePct * 1e4) / 1e4,
      grossLongSharePct: Math.round(grossLongSharePct * 1e4) / 1e4,
      grossShortSharePct: Math.round(grossShortSharePct * 1e4) / 1e4,
      openInterest: oi,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * (1) The KV stage read (read-only REST — the gold-corpus-dump pattern)
 * ------------------------------------------------------------------ */

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

async function kvGetValue(key: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${RATES_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${API_TOKEN}` } },
  );
  if (!res.ok) throw new Error(`KV value read failed for ${key}: HTTP ${res.status}`);
  return await res.text();
}

const recordedAt = new Date().toISOString();
console.log(`# GF-P0 candidates recorder — ${recordedAt}`);

const stageSeries: Record<string, Array<[number, number]>> = {};
let stageWrittenAt: string | undefined;
const fetchVenues: Record<string, string> = {};

if (API_TOKEN !== undefined && API_TOKEN !== '' && ACCOUNT_ID !== undefined && ACCOUNT_ID !== '') {
  const stageRaw = await kvGetValue('insights:ingest-stage:v1');
  const stage = JSON.parse(stageRaw) as {
    v: number;
    writtenAt: string;
    series: Record<string, Array<[number, number]>>;
  };
  if (typeof stage.v !== 'number' || typeof stage.writtenAt !== 'string' || typeof stage.series !== 'object') {
    throw new Error('Stage blob shape unexpected — aborting (never record garbage).');
  }
  stageWrittenAt = stage.writtenAt;
  console.log(`stage: v${stage.v}, writtenAt ${stage.writtenAt}, ${Object.keys(stage.series).length} series`);
  for (const id of CANDIDATE_STAGE_IDS) {
    const pts = stage.series[id];
    if (pts === undefined || !Array.isArray(pts) || pts.length === 0) {
      console.log(`  ${id.padEnd(28)} ABSENT from the stage (expected for ebp — fresh-fetched below)`);
      continue;
    }
    for (let i = 1; i < pts.length; i++) {
      if (pts[i]![0] <= pts[i - 1]![0]) throw new Error(`Stage series ${id}: epoch days not ascending at index ${i}`);
      if (!Number.isFinite(pts[i]![1])) throw new Error(`Stage series ${id}: non-finite value at index ${i}`);
    }
    stageSeries[id] = pts;
    console.log(
      `  ${id.padEnd(28)} n=${String(pts.length).padStart(5)}  epochDay ${pts[0]![0]} → ${pts[pts.length - 1]![0]}`,
    );
  }
} else {
  throw new Error(
    'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set (read-only KV credentials). Nothing was read or written.',
  );
}

/* ------------------------------------------------------------------ *
 * (2) The fresh source fetches (the repo's own adapters, read-only)
 * ------------------------------------------------------------------ */

const ebpSeries: SeriesPoint[] = await fetchEbpCsv();
console.log(`ebp (fresh, Fed Board ebp_csv.csv via fetchEbpCsv): n=${ebpSeries.length} ${ebpSeries[0]!.date} → ${ebpSeries.at(-1)!.date}`);
fetchVenues['ebp'] = 'fresh: Fed Board ebp_csv.csv (fetchEbpCsv) — absent from the stage this recording';

// Stage series use epoch-day pairs; convert the fetched ISO-dated series.
const toEpochDay = (iso: string): number => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
stageSeries['ebp'] = ebpSeries.map((p) => [toEpochDay(p.date), p.value] as [number, number]);

const jgbSeries: SeriesPoint[] = await fetchMofJgb10y({ includeHistory: true });
console.log(`jgb-10y (fresh, MOF jgbcme_all.csv via fetchMofJgb10y): n=${jgbSeries.length} ${jgbSeries[0]!.date} → ${jgbSeries.at(-1)!.date}`);
stageSeries['jgb-10y'] = jgbSeries.map((p) => [toEpochDay(p.date), p.value] as [number, number]);
fetchVenues['jgb-10y'] = 'fresh: MOF jgbcme_all.csv (fetchMofJgb10y) — the D-6 gap-derivation input';

writeFileSync(
  OUT_CANDIDATES,
  JSON.stringify(
    {
      v: 1,
      recordedAt,
      stageWrittenAt,
      venues: {
        stage: 'read-only KV REST GET insights:ingest-stage:v1 (the gold-corpus-dump venue)',
        ...fetchVenues,
      },
      series: stageSeries,
    },
    null,
    2,
  ),
);
console.log(`✍ ${OUT_CANDIDATES} (${Object.keys(stageSeries).length} series)`);

/* ------------------------------------------------------------------ *
 * (3) The CFTC legacy futures-only historical archive (the D-4 source)
 * ------------------------------------------------------------------ */

const weeks: GfCftcWeek[] = [];
const files: Array<{ year: number; url: string; weeks: number; bytes: number }> = [];
const failures: Array<{ year: number; error: string }> = [];
for (const year of CFTC_YEARS) {
  const url = CFTC_DEACOT_URL(year);
  try {
    const res = await insightsFetch(url, {}, { timeoutMs: 90_000 });
    const bytes = new Uint8Array(await res.arrayBuffer());
    const entries = await readZipTextEntries(bytes);
    const annual = entries.get('annual.txt');
    if (annual === undefined) {
      throw new Error(`zip carries no annual.txt (entries: ${[...entries.keys()].join(', ')})`);
    }
    const rows = parseGoldRows(annual);
    if (rows.length === 0) throw new Error('no parsable gold rows');
    weeks.push(...rows);
    files.push({ year, url, weeks: rows.length, bytes: bytes.byteLength });
    console.log(`  deacot${year}.zip: ${bytes.byteLength} B → ${rows.length} gold weeks (${rows[0]!.date} → ${rows.at(-1)!.date})`);
  } catch (err) {
    failures.push({ year, error: err instanceof Error ? err.message : String(err) });
    console.log(`  deacot${year}.zip: FAILED — ${failures.at(-1)!.error}`);
  }
}

// Loud structural check: ascending dates, no duplicates.
weeks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
for (let i = 1; i < weeks.length; i++) {
  if (weeks[i]!.date === weeks[i - 1]!.date) {
    throw new Error(`duplicate gold week ${weeks[i]!.date} across the archive files`);
  }
}

writeFileSync(
  OUT_CFTC,
  JSON.stringify(
    {
      v: 1,
      recordedAt,
      source: 'CFTC legacy futures-only COT historical archive (dea/history/deacot<year>.zip, annual.txt — the long format; the gold rows verified identical in layout to the current deafut.txt)',
      files,
      failures,
      weeks,
    },
    null,
    2,
  ),
);
console.log(
  `✍ ${OUT_CFTC} (${weeks.length} gold weeks ${weeks[0]!.date} → ${weeks.at(-1)!.date}; ${failures.length} failed file(s))`,
);
