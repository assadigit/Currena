/**
 * gold-episodes-run.ts — GPE R25 / F6 (2026-11-19): the gold Episode
 * Explorer's data-drop runner (the s4/01 §5 Pattern A + the gold-lbma-run
 * discipline). THE DROP is the owner's own action: download the WGC
 * currency-averages prices workbook from Goldhub (their free account —
 * the login wall makes a human the authenticator) and save it as the
 * dated file `data/wgc/prices/<YYYY-MM-DD>-<file-as-published>.xlsx`.
 *
 * The runner: parse the workbook (the deterministic, fail-closed
 * wgc-prices adapter — the exact sheet/column mapping is a FIRST-DROP
 * task by design, s8/02 row 14; `--sheet NAME` tunes it), assemble the
 * comparison legs (S15-D6: silver + BTC from the stored insights
 * histories, S&P from the markets board's own weekly lens — each leg
 * named for what it is, each leg's coverage carried on the wire), and
 * write the ONE KV key through the Cloudflare REST API
 * (RestGoldEpisodesStore).
 *
 * Modes:
 *   default          parse + assemble + write
 *   --dry-run        parse + assemble + report only — no KV writes
 *   --sheet NAME     the workbook's sheet (the first-drop mapping lever;
 *                    default probes the common candidates and the reader's
 *                    own error lists the archive's real names)
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (the legs' KV reads + the write; not
 *                                needed with --no-legs --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID
 *   INSIGHTS_KV_NAMESPACE_ID    (the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-episodes-run --dry-run
 *   pnpm --filter @currena/insights gold-episodes-run
 *   pnpm --filter @currena/insights gold-episodes-run --sheet 'Prices'
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { EpisodeLeg, EpisodePoint } from '@currena/core';
import { buildGoldEpisodesSnapshot, RestGoldEpisodesStore } from '../src/domains/gold/episodes';
import { readWgcPricesWorkbook, WGC_GOLDHUB_PRICES_URL } from '../src/domains/gold/adapters/wgc-prices';
import { decodeWeeklySeries } from '../src/domains/world-markets/markets/definitions';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const dropDir = join(repoRoot, 'data', 'wgc', 'prices');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sheetArg = args.find((a) => a.startsWith('--sheet='))?.slice('--sheet='.length);
const sheetIndex = args.indexOf('--sheet');
const sheetName = sheetArg ?? (sheetIndex >= 0 ? args[sheetIndex + 1] : undefined);

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

/** The workbook sheet candidates (the first-drop mapping lever — the
 *  reader's own error lists the archive's real names on a miss). */
const SHEET_CANDIDATES = ['Data', 'Prices', 'Gold Prices', 'Sheet1'];

/** Read one KV key through the Cloudflare REST API (the runner's own
 *  landing-lever surface — read-only use for the legs). */
async function readKvKey(key: string): Promise<string | null> {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
    `/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${apiToken}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`KV REST read of ${key} failed: HTTP ${response.status}`);
  return response.text();
}

/** One month label from an epoch day (UTC). */
function monthOfEpochDay(epochDay: number): string {
  const d = new Date(epochDay * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Resample [epochDay, value] points to monthly (the month's LAST point —
 *  the month's closing value), ascending. */
function resampleMonthly(points: ReadonlyArray<[number, number]>): EpisodePoint[] {
  const byMonth = new Map<string, EpisodePoint>();
  for (const [day, value] of points) {
    if (!Number.isFinite(day) || !Number.isFinite(value) || value <= 0) continue;
    byMonth.set(monthOfEpochDay(day), { month: monthOfEpochDay(day), value });
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, p]) => p);
}

/* ------------------------------------------------------------------ *
 * 1. The workbook drop (the owner's dated file)
 * ------------------------------------------------------------------ */

const drops = readdirSync(dropDir, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.xlsx'))
  .map((e) => e.name)
  .sort()
  .reverse();
if (drops.length === 0) {
  console.error(
    `[gold-episodes-run] FATAL: no workbook drop found at data/wgc/prices/ — the owner's dated file ` +
      `(<YYYY-MM-DD>-<file-as-published>.xlsx, the Goldhub gold-prices dataset). ` +
      `Until the drop lands, the Explorer renders its honest waiting state (S15-D4).`,
  );
  process.exit(1);
}
const dropName = drops[0]!;
console.log(`[gold-episodes-run] drop: ${dropName}${drops.length > 1 ? ` (newest of ${drops.length})` : ''}`);
const bytes = readFileSync(join(dropDir, dropName));
const uint8 = new Uint8Array(bytes.byteLength);
uint8.set(bytes);

/* ------------------------------------------------------------------ *
 * 2. The deterministic parse (fail-closed on shape)
 * ------------------------------------------------------------------ */

async function parseWorkbook(): Promise<ReturnType<typeof readWgcPricesWorkbook>> {
  const candidates = sheetName !== undefined ? [sheetName] : SHEET_CANDIDATES;
  const failures: string[] = [];
  for (const sheet of candidates) {
    try {
      return await readWgcPricesWorkbook(uint8, sheet);
    } catch (err) {
      failures.push(`"${sheet}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`no sheet parsed — tried ${failures.length} candidate(s):\n  ${failures.join('\n  ')}`);
}

const spine = await parseWorkbook();
console.log(
  `[gold-episodes-run] spine parsed: ${spine.length} monthly rows ${spine[0]!.month} → ${spine[spine.length - 1]!.month}`,
);

/* ------------------------------------------------------------------ *
 * 3. The comparison legs (S15-D6 — the in-repo sources, honestly named)
 * ------------------------------------------------------------------ */

const legs: EpisodeLeg[] = [];
const legNotes: string[] = [];

if (apiToken && accountId && namespaceId) {
  // silver + BTC from the stored insights histories (insights:hist:<id>).
  for (const [id, seriesNamed] of [
    ['silver-usd', 'Silver (troy ounce, US$) — the stored insights history'],
    ['btc-usd', 'Bitcoin (BTC, US$) — the stored insights history'],
  ] as const) {
    try {
      const raw = await readKvKey(`insights:hist:${id}`);
      if (raw === null) {
        legNotes.push(`${id}: no stored history (absent leg, never faked)`);
        continue;
      }
      const parsed = JSON.parse(raw) as { points?: [number, number][] };
      const rows = resampleMonthly(parsed.points ?? []);
      if (rows.length < 2) {
        legNotes.push(`${id}: stored history too short to resample (absent leg)`);
        continue;
      }
      legs.push({ id: id === 'silver-usd' ? 'silver' : 'btc', seriesNamed, rows });
      legNotes.push(`${id}: ${rows.length} monthly rows ${rows[0]!.month} → ${rows[rows.length - 1]!.month}`);
    } catch (err) {
      legNotes.push(`${id}: read failed (${err instanceof Error ? err.message : String(err)}) — absent leg, never faked`);
    }
  }
  // S&P from the markets board's own weekly lens (the S25 decode).
  try {
    const raw = await readKvKey('insights:markets:v1');
    if (raw === null) {
      legNotes.push('sp500: no stored markets document (absent leg)');
    } else {
      const doc = JSON.parse(raw) as { markets?: Array<{ id?: string; weekly?: [number, number][] }> };
      const sp = doc.markets?.find((m) => m.id === 'sp500');
      if (sp === undefined || !Array.isArray(sp.weekly)) {
        legNotes.push('sp500: the markets document carries no sp500 weekly series (absent leg)');
      } else {
        const rows = resampleMonthly(decodeWeeklySeries(sp.weekly));
        if (rows.length < 2) {
          legNotes.push('sp500: weekly lens too short to resample (absent leg)');
        } else {
          legs.push({ id: 'sp500', seriesNamed: 'S&P 500 (index close) — the markets board weekly lens', rows });
          legNotes.push(`sp500: ${rows.length} monthly rows ${rows[0]!.month} → ${rows[rows.length - 1]!.month}`);
        }
      }
    }
  } catch (err) {
    legNotes.push(`sp500: read failed (${err instanceof Error ? err.message : String(err)}) — absent leg, never faked`);
  }
} else {
  legNotes.push('legs: no KV credentials — the spine alone writes (--no-legs posture)');
}

for (const note of legNotes) console.log(`[gold-episodes-run]   leg: ${note}`);

/* ------------------------------------------------------------------ *
 * 4. The snapshot write (the ONE KV key)
 * ------------------------------------------------------------------ */

const now = new Date();
const snapshot = buildGoldEpisodesSnapshot(spine, legs, { sourceUrl: WGC_GOLDHUB_PRICES_URL, fileName: dropName }, now);

if (dryRun) {
  console.log(
    `[gold-episodes-run] DRY RUN — would write insights:gold-episodes:v1: asOf ${snapshot.asOf}` +
      ` · spine ${snapshot.spine.rows.length} rows · ${snapshot.legs.length} leg(s)` +
      ` · sourceUrl ${snapshot.spine.sourceUrl} · file ${snapshot.spine.fileName}`,
  );
  process.exit(0);
}

if (!apiToken || !accountId || !namespaceId) {
  console.error(
    '[gold-episodes-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = new RestGoldEpisodesStore({ apiToken, accountId, namespaceId });
await store.writeGoldEpisodes(snapshot);
console.log(
  `[gold-episodes-run] OK — insights:gold-episodes:v1 written: asOf ${snapshot.asOf}` +
    ` · spine ${snapshot.spine.rows.length} rows (${spine[0]!.month} → ${spine[spine.length - 1]!.month})` +
    ` · ${snapshot.legs.length} leg(s) · fetchedAt ${snapshot.fetchedAt}`,
);
