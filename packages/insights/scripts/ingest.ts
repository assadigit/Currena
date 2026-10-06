/**
 * Phase I3 ingestion runner — the production twin of live-run: fetches every
 * source (src/adapters/collect.ts), assembles the 28 indicator series,
 * computes the snapshot with the scoring engine and WRITES it to Workers KV
 * through the Cloudflare REST API (RestInsightsStore).
 *
 * Runs on GitHub Actions (.github/workflows/insights-ingest.yml) — the only
 * venue verified to reach rba.gov.au (Akamai blocks the build sandbox).
 * Schedule: daily 04:20 UTC — inside the fresh post-midnight slice of the
 * account's 1,000 KV writes/day budget (the ever-green rates cron saturates
 * the budget by ~18:30 UTC; see docs/insights/03-data-sources.md Phase I3).
 *
 * Write discipline (roadmap §2 "Write budget"):
 *   - insights:snapshot and insights:status — always written (2 writes);
 *   - insights:hist:<id> — written ONLY when the payload actually changed
 *     (read-compare) or the key is absent; single-point series never get a
 *     history key;
 *   - writes that bounce off the daily cap (429/10048) retry with backoff.
 *
 * Exit code: 1 when any P1 indicator is unavailable (the product degraded —
 * a red workflow run is the stale-feed signal) or a critical write failed.
 *
 * Manual:
 *   pnpm --filter @currena/insights ingest            # real run (writes KV)
 *   pnpm --filter @currena/insights ingest --dry-run  # fetch + score, no writes
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (required for writes)
 *   CLOUDFLARE_ACCOUNT_ID       (required for writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (required for writes — the RATES namespace)
 *   INSIGHTS_RUN_MODE           scheduled | manual (default manual)
 */

import { readFileSync } from 'node:fs';
import { CalendarEventSchema, type CalendarEvent, type IndicatorHistory } from '@currena/core';
import { z } from 'zod';

import { DEFINITIONS } from '../src/index';
import type { SeriesPoint } from '../src/series';
import {
  buildHistoryFile,
  buildIndicatorSeries,
  buildInsightsSnapshot,
  buildInsightsStatus,
  collectAllSources,
  parseManualSeries,
} from '../src/adapters/index';
import { RestInsightsStore } from '../src/store';

/** Semantic equality (JSON round-trips can reorder keys). */
function historiesEqual(a: IndicatorHistory, b: IndicatorHistory): boolean {
  return (
    a.id === b.id &&
    a.points.length === b.points.length &&
    a.points.every((p, i) => p[0] === b.points[i]![0] && p[1] === b.points[i]![1])
  );
}

const dryRun = process.argv.includes('--dry-run');

function fail(message: string): never {
  console.error(`\n[ingest] FATAL: ${message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Environment
 * ------------------------------------------------------------------ */

const mode = z.enum(['scheduled', 'manual']).catch('manual').parse(process.env.INSIGHTS_RUN_MODE);

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  fail(
    'missing environment — a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run)',
  );
}

/* ------------------------------------------------------------------ *
 * Fetch + assemble (identical pipeline to live-run)
 * ------------------------------------------------------------------ */

const now = new Date();
const nowIso = now.toISOString();

console.log(`# Insights ingestion run — ${nowIso}`);
console.log(`mode=${mode}${dryRun ? ' DRY-RUN (no KV writes)' : ''}\n`);

const { inputs, reports } = await collectAllSources();

// Hand-maintained data files (roadmap §2 "Package layout") — Phase I5/I6
// content work populates them; their ABSENCE is expected and soft, but a
// PRESENT file must validate loudly (rule #3).
const repoRoot = new URL('../../../', import.meta.url);

function loadJsonFile(url: URL): unknown | undefined {
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err; // present but unreadable/malformed JSON — loud
  }
}

const calendarUrl = new URL('data/insights-calendar.json', repoRoot);
const calendarRaw = loadJsonFile(calendarUrl);
const calendar: CalendarEvent[] =
  calendarRaw === undefined ? [] : z.array(CalendarEventSchema).parse(calendarRaw);
console.log(
  calendarRaw === undefined
    ? `[ingest] data/insights-calendar.json: absent — empty calendar (Phase I5 populates it)`
    : `[ingest] calendar: ${calendar.length} entries`,
);

const pmiUrl = new URL('data/manual/china-pmi.json', repoRoot);
const pmiRaw = loadJsonFile(pmiUrl);
const chinaPmi: SeriesPoint[] | undefined = pmiRaw === undefined ? undefined : parseManualSeries(pmiRaw, 'china-pmi');
console.log(
  pmiRaw === undefined
    ? '[ingest] data/manual/china-pmi.json: absent — china-pmi reads unavailable (Phase I5/I6 content work)'
    : `[ingest] china-pmi: ${chinaPmi?.length ?? 0} observations`,
);
reports.push({
  source: 'manual',
  ok: true,
  detail:
    pmiRaw === undefined
      ? 'no data files yet (Phase I5 content work)'
      : `china-pmi: ${chinaPmi?.length ?? 0} observations`,
});

const series = buildIndicatorSeries({ ...inputs, chinaPmi });

/* ------------------------------------------------------------------ *
 * Snapshot (needs the previous snapshot for changedThisWeek continuity)
 * ------------------------------------------------------------------ */

const store = dryRun
  ? undefined
  : new RestInsightsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const previous = store ? await store.getSnapshot() : undefined; // undefined on first run / 404
if (previous) {
  console.log(
    `\n[ingest] previous snapshot: generatedAt=${previous.generatedAt} (${previous.readings.length} readings)`,
  );
} else {
  console.log('\n[ingest] no previous snapshot — first run (changedThisWeek starts empty)');
}

const snapshot = buildInsightsSnapshot({ series, previous, calendar, now: nowIso });
const status = buildInsightsStatus({ reports, generatedAt: nowIso, mode, dryRun });

/* ------------------------------------------------------------------ *
 * Report (compact — live-run prints the full sanity table)
 * ------------------------------------------------------------------ */

const failedSources = reports.filter((r) => !r.ok);
console.log('\n## Source report');
for (const r of reports) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.source} — ${r.detail}`);
}

console.log('\n## Readings');
for (const reading of snapshot.readings) {
  const def = DEFINITIONS.find((d) => d.id === reading.id)!;
  const value = reading.value === null ? '—' : String(reading.value);
  console.log(
    `  ${def.phase} ${reading.id}: ${value} @ ${reading.asOf ?? '—'} [${reading.status}]${
      reading.percentile10y !== undefined ? ` pct10y=${(reading.percentile10y * 100).toFixed(0)}%` : ''
    }`,
  );
}
console.log(
  `\n## Summary — Global: ${snapshot.summary.global.label ?? 'no label'} (${snapshot.summary.global.warningCount}/${snapshot.summary.global.votingCount} warning, ${snapshot.summary.global.excludedCount} excluded)` +
    ` · Australia: ${snapshot.summary.australia.label ?? 'no label'} (${snapshot.summary.australia.warningCount}/${snapshot.summary.australia.votingCount} warning, ${snapshot.summary.australia.excludedCount} excluded)`,
);
if (snapshot.changedThisWeek.length > 0) {
  console.log('\n## Changed this week');
  for (const e of snapshot.changedThisWeek) {
    console.log(`  ${e.id}: ${e.from} → ${e.to} (@ ${e.asOf})`);
  }
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

if (!store) {
  console.log('\n[ingest] dry-run — nothing written to KV.');
} else {
  console.log('\n## KV writes');
  try {
    await store.putSnapshot(snapshot);
    console.log('  ✍ insights:snapshot');
    await store.putStatus(status);
    console.log('  ✍ insights:status');
  } catch (err) {
    fail(`critical write failed — snapshot/status not stored: ${err instanceof Error ? err.message : String(err)}`);
  }

  let written = 0;
  let unchanged = 0;
  let singlePoint = 0;
  let failed = 0;
  for (const def of DEFINITIONS) {
    const indicatorSeries = series[def.id];
    const history = indicatorSeries ? buildHistoryFile(def.id, indicatorSeries) : undefined;
    if (!history) {
      if (indicatorSeries) singlePoint++;
      continue; // no series (unavailable) or a single live point — no history key
    }
    try {
      const existing = await store.getHistory(def.id);
      if (existing && historiesEqual(existing, history)) {
        unchanged++;
        continue; // write only when data changed (roadmap budget rule)
      }
      await store.putHistory(history);
      written++;
      console.log(`  ✍ insights:hist:${def.id} (${history.points.length} points)`);
    } catch (err) {
      failed++;
      console.warn(`  ⚠ insights:hist:${def.id} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(
    `\n  history: ${written} written · ${unchanged} unchanged (skipped) · ${singlePoint} single-point (no key) · ${failed} failed`,
  );
  const { reads, writes, retriedWrites } = store.ops;
  console.log(
    `  KV ops this run: ${reads} reads, ${writes} writes (${retriedWrites} retried after the daily cap) — free limits: 100,000 reads / 1,000 writes per day.`,
  );
}

/* ------------------------------------------------------------------ *
 * Exit criterion: every P1 indicator must have data
 * ------------------------------------------------------------------ */

const p1Unavailable = DEFINITIONS.filter(
  (d) => d.phase === 'P1' && snapshot.readings.find((r) => r.id === d.id)?.status === 'unavailable',
).map((d) => d.id);

if (p1Unavailable.length > 0) {
  fail(`P1 indicators unavailable (product degraded): ${p1Unavailable.join(', ')}`);
}
if (failedSources.length > 0) {
  console.warn(`\n[ingest] WARNING — failing sources: ${failedSources.map((s) => s.source).join(', ')}`);
}
console.log(`\n[ingest] ${dryRun ? 'dry-run complete' : 'run complete'} — P1 COMPLETE.`);
