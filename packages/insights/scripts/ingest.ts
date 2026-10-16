/**
 * Phase I3 ingestion runner — the production twin of live-run: fetches every
 * source (src/adapters/collect.ts), assembles the 30 indicator series,
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
 *     history key, EXCEPT the accumulated-daily rows (SEED_IDS) whose first
 *     point IS the bootstrap of the accumulation (minPoints 1 — the
 *     btc-usd 2026-10-08 lesson: a row with no monthly base otherwise
 *     rebuilds a single live point every run and the 7/30-day changes can
 *     never appear);
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
import type { IndicatorId } from '@currena/core';
import type { SeriesPoint } from '../src/series';
import {
  buildHistoryFile,
  buildIndicatorSeries,
  buildInsightsSnapshot,
  buildInsightsStatus,
  collectAllSources,
  computeHighestSinceYear,
  computePeaks,
  historyToSeries,
  parseContextNotes,
  parseManualSeries,
  parsePolicyDecisions,
  parseReleaseSchedule,
} from '../src/adapters/index';
import { runValidationSuite } from '../src/validation';
import type { RegressionEpisode } from '../src/validation';
import { RestInsightsStore } from '../src/store';

/** Semantic equality (JSON round-trips can reorder keys). */
function historiesEqual(a: IndicatorHistory, b: IndicatorHistory): boolean {
  return (
    a.id === b.id &&
    a.points.length === b.points.length &&
    a.points.every((p, i) => p[0] === b.points[i]![0] && p[1] === b.points[i]![1])
  );
}

/**
 * The accumulated-daily rows (data spec §3): the runner re-reads their stored
 * history before deriving, so each run's live spot joins the previously
 * accumulated daily points — that is what makes 7/30-day changes measurable
 * on those rows. gold-silver rides the same mechanism (derived.ts already
 * merges its seedHistory; its daily points accumulate like the price rows').
 */
const SEED_IDS: IndicatorId[] = ['gold-usd', 'silver-usd', 'copper-usd', 'btc-usd', 'gold-silver'];

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
const pmiParsed = pmiRaw === undefined ? undefined : parseManualSeries(pmiRaw, 'china-pmi');
const chinaPmi: SeriesPoint[] | undefined = pmiParsed?.points;
// Defect E-08: the manual file's own expiry rides into the snapshot — an
// entry older than its next scheduled release shows stale, never fresh.
const manualExpires: Readonly<Record<string, string>> = pmiParsed ? { 'china-pmi': pmiParsed.expires } : {};
console.log(
  pmiRaw === undefined
    ? '[ingest] data/manual/china-pmi.json: absent — china-pmi reads unavailable (Phase I5/I6 content work)'
    : `[ingest] china-pmi: ${chinaPmi?.length ?? 0} observations (entered ${pmiParsed?.enteredOn ?? '?'}, expires ${pmiParsed?.expires ?? '?'})`,
);
reports.push({
  source: 'manual',
  ok: true,
  detail:
    pmiRaw === undefined
      ? 'no data files yet (Phase I5 content work)'
      : `china-pmi: ${chinaPmi?.length ?? 0} observations (expires ${pmiParsed?.expires ?? '?'})`,
});

// Step-1 audit items A2/A3: the hand-maintained release schedule (official
// publication dates for the monthly series). Absence is soft (cards then
// show the data month only); a PRESENT file must validate loudly.
const scheduleUrl = new URL('data/insights-release-schedule.json', repoRoot);
const scheduleRaw = loadJsonFile(scheduleUrl);
const releaseSchedule =
  scheduleRaw === undefined ? undefined : parseReleaseSchedule(scheduleRaw);
console.log(
  scheduleRaw === undefined
    ? '[ingest] data/insights-release-schedule.json: absent — cards show the data month only'
    : `[ingest] release schedule: ${releaseSchedule!.length} entries`,
);

// Fix spec B-06 (2026-10-14): the hand-maintained policy decision dates
// (decided vs effective) — absent is soft (cards then show the effective
// date only), present-but-malformed fails loudly.
const decisionsUrl = new URL('data/policy-decisions.json', repoRoot);
const decisionsRaw = loadJsonFile(decisionsUrl);
const policyDecisions = decisionsRaw === undefined ? undefined : parsePolicyDecisions(decisionsRaw);
console.log(
  decisionsRaw === undefined
    ? '[ingest] data/policy-decisions.json: absent — policy cards show the effective date only'
    : `[ingest] policy decisions: ${policyDecisions!.length} entries`,
);

// Fix spec A-06 (2026-10-14): the optional human-written context notes —
// absent by default (nothing shows); expired ones never leave the builder.
const notesUrl = new URL('data/insights-context-notes.json', repoRoot);
const notesRaw = loadJsonFile(notesUrl);
const contextNotes = notesRaw === undefined ? undefined : parseContextNotes(notesRaw);
console.log(
  notesRaw === undefined
    ? '[ingest] data/insights-context-notes.json: absent — no notes (off by default)'
    : `[ingest] context notes: ${contextNotes!.length} entries`,
);

const series = buildIndicatorSeries({ ...inputs, chinaPmi });

/* ------------------------------------------------------------------ *
 * Snapshot (needs the previous snapshot for changedThisWeek continuity)
 * ------------------------------------------------------------------ */

const store = dryRun
  ? undefined
  : new RestInsightsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

/* ------------------------------------------------------------------ *
 * I15: seed the accumulated-daily series for the live-priced rows
 * (gold/silver/copper/bitcoin) from the stored history — this is what
 * makes 7/30-day changes measurable on those rows (data spec §3 note).
 * ------------------------------------------------------------------ */

if (store) {
  const seedHistory: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
  for (const id of SEED_IDS) {
    try {
      const stored = await store.getHistory(id);
      if (stored) seedHistory[id] = historyToSeries(stored);
    } catch (err) {
      console.warn(`[ingest] seed read failed for ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (Object.keys(seedHistory).length > 0) {
    for (const id of SEED_IDS) {
      if (seedHistory[id]) console.log(`[ingest] seed: ${id} ${seedHistory[id]!.length} accumulated points`);
    }
    Object.assign(series, buildIndicatorSeries({ ...inputs, chinaPmi, seedHistory }));
  }
}

const previous = store ? await store.getSnapshot() : undefined; // undefined on first run / 404
if (previous) {
  console.log(
    `\n[ingest] previous snapshot: generatedAt=${previous.generatedAt} (${previous.readings.length} readings)`,
  );
} else {
  console.log('\n[ingest] no previous snapshot — first run (changedThisWeek starts empty)');
}

/* ------------------------------------------------------------------ *
 * Fix spec Part D + A-03 (2026-10-14): the validation suite runs AFTER
 * the fetch and BEFORE anything is published. A draft snapshot is built
 * first; the suite judges it; flagged readings are then held on their
 * last good values when the PUBLISHED snapshot is rebuilt with the flags.
 * ------------------------------------------------------------------ */

// The assembled Brent series rides along: its close-peak (within the stored
// 10-year window) is the card's record — not the 40-day Yahoo window alone.
const peaks = computePeaks(inputs, series.brent);
for (const [id, peak] of Object.entries(peaks) as [IndicatorId, { value: number; date: string; basis: string }][]) {
  console.log(`[ingest] peak ${id}: ${peak.value} on ${peak.date} (${peak.basis})`);
}

// Fix spec B-19: "highest since {year}" for the long-history yields,
// computed from the full fetched series (DGS10/DGS30/DFII10/F2 go back
// decades — a 10-year window cannot say 2002).
const HIGHEST_SINCE_IDS: IndicatorId[] = ['us10y', 'us30y', 'real-yield-10y', 'au-10y'];
const highestSince: Partial<Record<IndicatorId, number>> = {};
for (const id of HIGHEST_SINCE_IDS) {
  const full = series[id];
  if (full && full.length > 1) {
    const year = computeHighestSinceYear(full);
    if (year !== undefined) highestSince[id] = year;
  }
}

// Fix spec T-07: scan the copy corpus for the forbidden forecast wording —
// the registry templates plus the web copy dictionaries, read from the repo.
const copyTexts: string[] = [];
for (const dictPath of ['apps/web/src/i18n/insights-copy-en.ts', 'apps/web/src/i18n/insights-copy-fa.ts']) {
  try {
    const raw = readFileSync(new URL(dictPath, repoRoot), 'utf8');
    // Strip comments first (2026-10-15, live-run evidence): quote-marked
    // phrases inside comments are not user-facing text, and the naive
    // literal scan flagged them. URLs survive (their // follows a colon,
    // never whitespace).
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '');
    // Extract the string literals (template-safe: the corpus is data, not code).
    for (const match of stripped.matchAll(/'((?:[^'\\]|\\.)*)'/g)) copyTexts.push(match[1]!);
    for (const match of stripped.matchAll(/"((?:[^"\\]|\\.)*)"/g)) copyTexts.push(match[1]!);
  } catch {
    // The runner may execute from a shallow clone without apps/ — T-07
    // records a skip note instead (the CI corpus tests cover the templates).
  }
}

// Fix spec T-14: the saved regression episodes (fixtures/regression-episodes.json —
// cut from live history by scripts/generate-regression-episodes.ts).
let episodes: readonly RegressionEpisode[] | undefined;
try {
  const parsed: unknown = JSON.parse(readFileSync(new URL('../fixtures/regression-episodes.json', import.meta.url), 'utf8'));
  // The file carries { version, episodes } — the version wrapper documents the
  // fixture format; the replay consumes the episodes array inside.
  episodes = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { episodes?: unknown }).episodes) ? (parsed as { episodes: readonly RegressionEpisode[] }).episodes : undefined;
} catch {
  episodes = undefined;
}

const draft = buildInsightsSnapshot({
  series,
  previous,
  calendar,
  releaseSchedule,
  fedTargetUpper: inputs.fred.DFEDTARU,
  policyDecisions,
  peaks,
  highestSince,
  contextNotes,
  manualExpires,
  now: nowIso,
});

const outcome = runValidationSuite({
  series,
  readings: draft.readings,
  calendar,
  now: nowIso,
  breakeven10y: inputs.fred.T10YIE,
  // Defect E-04: the previous snapshot feeds the cross-day frozen-value check.
  ...(previous !== undefined ? { previousReadings: previous.readings } : {}),
  ...(copyTexts.length > 0 ? { copyTexts } : {}),
  ...(episodes !== undefined ? { episodes } : {}),
});

// The published snapshot: same inputs + the suite's flags (A-04 — a flagged
// reading holds its last good value and never reaches the live page fresh).
const snapshot = buildInsightsSnapshot({
  series,
  previous,
  calendar,
  releaseSchedule,
  fedTargetUpper: inputs.fred.DFEDTARU,
  policyDecisions,
  peaks,
  highestSince,
  contextNotes,
  manualExpires,
  flags: outcome.flags,
  now: nowIso,
});
const status = buildInsightsStatus({ reports, generatedAt: nowIso, mode, dryRun, validation: outcome.results });

console.log('\n## Validation suite (Part D — runs before every publish)');
for (const result of outcome.results) {
  const flagNote = result.flagged.length > 0 ? ` flagged: ${result.flagged.join(', ')}` : '';
  const note = result.notes?.length ? ` (${result.notes.join('; ')})` : '';
  console.log(
    `  ${result.ok ? '✅' : '❌'} ${result.test} ${result.name}${note}${flagNote}`,
  );
  for (const failure of result.failures) console.log(`      ${failure}`);
}

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
    // Fix spec A-05 (2026-10-14): the daily archive — one dated file per
    // day (the exact snapshot the page showed, with its rule version).
    // One extra KV write per day; two years of daily keys keep the history.
    const archiveDate = nowIso.slice(0, 10);
    const alreadyArchived = (await store.getArchive(archiveDate)) !== undefined;
    if (!alreadyArchived) {
      await store.putArchive(archiveDate, snapshot);
      console.log(`  ✍ insights:archive:v1:${archiveDate}`);
    } else {
      console.log(`  · insights:archive:v1:${archiveDate} already written today`);
    }
  } catch (err) {
    fail(`critical write failed — snapshot/status not stored: ${err instanceof Error ? err.message : String(err)}`);
  }

  let written = 0;
  let unchanged = 0;
  let singlePoint = 0;
  let failed = 0;
  for (const def of DEFINITIONS) {
    const indicatorSeries = series[def.id];
    // SEED_IDS bootstrap at minPoints 1: the accumulated-daily rows persist
    // their FIRST point so the accumulation can start (see SEED_IDS note).
    const history = indicatorSeries
      ? buildHistoryFile(def.id, indicatorSeries, SEED_IDS.includes(def.id) ? { minPoints: 1 } : undefined)
      : undefined;
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
  // Fix spec Part 0 rule 6: the free-tier budget report (KV reads, KV
  // writes and OUTSIDE requests one full refresh uses).
  const providerRows = reports.filter((r) => !['manual', 'cross-check'].includes(r.source)).length;
  // One logged row ≈ one outside HTTP request, except the World Bank row
  // (page scrape + workbook = 2 round-trips in one row).
  const outsideRequests = providerRows + 1;
  console.log(
    `  KV ops this run: ${reads} reads, ${writes} writes (${retriedWrites} retried after the daily cap) — free limits: 100,000 reads / 1,000 writes per day.`,
  );
  console.log(
    `  Outside requests this run: ${outsideRequests} (${providerRows} provider fetches + 1 for the World Bank's page-then-workbook round trip) — within the free Workers plan's 50-subrequest-per-invocation ceiling, and this ingest runs on GitHub Actions (its own venue), not a Worker invocation.`,
  );
}

/* ------------------------------------------------------------------ *
 * Exit criterion: every P1 indicator must have data
 * ------------------------------------------------------------------ */

const p1Unavailable = DEFINITIONS.filter(
  (d) => d.phase === 'P1' && snapshot.readings.find((r) => r.id === d.id)?.status === 'unavailable',
).map((d) => d.id);

// Step-1 audit item H3 companion: a held-stale P1 reading (last good value
// carried forward after a failed fetch) must still light the red run — the
// page degrades gracefully, the operator still gets the signal.
const heldP1 = DEFINITIONS.filter((d) => {
  if (d.phase !== 'P1') return false;
  const r = snapshot.readings.find((x) => x.id === d.id);
  return r?.status === 'stale' && !series[d.id];
}).map((d) => d.id);

if (p1Unavailable.length > 0) {
  fail(`P1 indicators unavailable (product degraded): ${p1Unavailable.join(', ')}`);
}
if (heldP1.length > 0) {
  fail(`P1 fetch failures held on last good values (marked stale): ${heldP1.join(', ')}`);
}
if (failedSources.length > 0) {
  console.warn(`\n[ingest] WARNING — failing sources: ${failedSources.map((s) => s.source).join(', ')}`);
}
console.log(`\n[ingest] ${dryRun ? 'dry-run complete' : 'run complete'} — P1 COMPLETE.`);
