/**
 * The shared insights-ingest orchestration (2026-10-21 data-integrity
 * round) — ONE code path for every venue:
 *
 *   - the currena-api Worker (src/cron.ts's 04:10/04:25/04:40 rungs — the
 *     PRIMARY venue since GitHub Actions stopped being able to start jobs
 *     on 2026-10-20: every workflow in the repo dies at runner allocation);
 *   - the GitHub Actions runner (scripts/ingest.ts — belt and braces; the
 *     writes are idempotent so double-running is harmless);
 *   - the manual runner (the same script, --dry-run supported).
 *
 * WHY THE MOVE: the account's Actions minutes are exhausted (all workflows
 * fail at startup with zero steps), and the RBA's Akamai edge 403s the CSV
 * table paths from every venue that can run Node — the Worker can still
 * read RBA's HTML cash-rate page. The Worker venue also brings the EODHD
 * secret (the ETH leg) and a KV binding (no REST write ladder).
 *
 * SUBREQUEST BUDGET (free plan: 50 per invocation, KV ops counted):
 *   04:10 rung 1 (runInsightsUpdate) — 28 fetches + 8 reads + 11 writes =
 *   47 ✓. The RBA CSV attempts are SKIPPED on the Worker
 *   (skipRbaCsvTables) — six doomed 403s would burn the budget.
 *   04:25 rung 2 (runInsightsHistoryPhase 'daily') — 1 stage read + the
 *   day-cadence history writes (unconditional: ~35) = 36 ✓.
 *   04:40 rung 3 (runInsightsHistoryPhase 'periodic') — 1 stage read + ~24
 *   read-compares + rare writes = ~26 ✓.
 *   The Node/GHA venue needs no staging: it writes every history inline
 *   (read-compared) in its own process — no subrequest ceiling applies.
 *
 * EXIT SEMANTICS — THE 2026-10-21 FIX: the old runner exited non-zero BEFORE
 * a snapshot write when a P1 indicator was unavailable, so ONE dead source
 * (the RBA outage) froze the WHOLE page (every fresh FRED/ABS/Yahoo number
 * went 46h stale while the code sat healthy). The shared run ALWAYS writes
 * the snapshot — held readings carry their last good values flagged stale
 * (H3) — and reports p1Unavailable/heldP1 so the venue surfaces the alert
 * (Worker: console.error + the /status panel; GHA: the red run + Telegram).
 */

import { z } from 'zod';
import type { InsightsSnapshot, InsightsSourceReport, IndicatorId } from '@currena/core';
import { DEFINITIONS } from '../definitions';
import {
  buildHistoryFile,
  buildIndicatorSeries,
  buildInsightsSnapshot,
  buildInsightsStatus,
  collectAllSources,
  computeHighestSinceYear,
  computePeaks,
  historyToSeries,
  projectSnapshotToPublic,
} from '../adapters/index';
import { runValidationSuite } from '../validation';
import type { InsightsStore } from '../store';
import {
  auditDisabledIds,
  CALENDAR,
  CHINA_PMI,
  CONTEXT_NOTES,
  MANUAL_EXPIRES,
  POLICY_DECISIONS,
  REGRESSION_EPISODES,
  RELEASE_SCHEDULE,
} from './data';
import type { KVLike } from './kv-store';
import { epochDay, fromEpochDay, type SeriesPoint } from '../series';

/** The accumulated-daily rows (data spec §3) — see the SEED note below. */
export const SEED_IDS: IndicatorId[] = ['gold-usd', 'silver-usd', 'copper-usd', 'btc-usd', 'gold-silver'];

/** The staged-series KV key (the Worker's history-rung hand-off). */
export const INSIGHTS_STAGE_KEY = 'insights:ingest-stage:v1';
/** The stage format version. */
const STAGE_VERSION = 1;
/** The staged series window: 10-year history + margin (the phases trim at build). */
const STAGE_WINDOW_DAYS = 3_690;

export interface IngestRunOptions {
  /** The KV or REST store (writes + previous-snapshot/seed reads). */
  store: InsightsStore;
  /**
   * The Worker venue's RATES binding — when present, the derived series are
   * STAGED under INSIGHTS_STAGE_KEY for the 04:25/04:40 history rungs (the
   * Node venue omits it and writes its histories inline instead).
   */
  stageKv?: KVLike;
  /** 'scheduled' (the Worker rung / the GHA cron) or 'manual' (a dispatch). */
  mode: 'scheduled' | 'manual';
  /** Worker venue: skip the RBA CSV attempts (Akamai 403s them from CF egress). */
  skipRbaCsvTables?: boolean;
  /** Fetch + score, no writes (the manual runner's --dry-run). */
  dryRun?: boolean;
  /** Clock injection (tests). */
  now?: Date;
  /**
   * T-07 forbidden-word corpus (the Node runner scans the copy files from
   * the repo checkout; the Worker venue omits it — the CI corpus tests
   * cover the templates, the same skip the shallow-clone runner takes).
   */
  copyTexts?: readonly string[];
  /**
   * The ids the PUBLIC projection hides (site-mode overrides — the Node
   * runner reads data/site-mode-overrides.json; the Worker passes its
   * bundle's copy; the default hides nothing and is only used by tests).
   */
  hiddenPublicIds?: ReadonlySet<string>;
}

export interface IngestRunResult {
  /** False when a critical write failed (dry-run returns true). */
  ok: boolean;
  /** The snapshot that was built (written unless dryRun). */
  snapshot: InsightsSnapshot;
  /** The derived series map (the Node venue's inline history writes). */
  series: Record<string, SeriesPoint[]>;
  /** P1 ids with no data this run (ALERT — the page degraded somewhere). */
  p1Unavailable: string[];
  /** P1 ids held on last good values (ALERT — flagged stale on the page). */
  heldP1: string[];
  /** Sources that failed this run (blocked/format-changed/failed). */
  failedSources: string[];
  /** Per-source report rows (the /status panel's data). */
  reports: InsightsSourceReport[];
  /** Whether the stage blob was written for the history rungs. */
  staged: boolean;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** The staged blob's shape (compact: [epochDay, value] pairs). */
interface StageBlob {
  v: number;
  writtenAt: string;
  series: Record<string, Array<[number, number]>>;
}

const StageBlobSchema = z.object({
  v: z.number(),
  writtenAt: z.iso.datetime(),
  series: z.record(z.string(), z.array(z.tuple([z.number(), z.number()]))),
});

/** Trim a series to the staging window (10y + margin), newest kept. */
function trimForStage(series: readonly SeriesPoint[], todayMs: number): Array<[number, number]> {
  const cutoffMs = todayMs - STAGE_WINDOW_DAYS * 86_400_000;
  const out: Array<[number, number]> = [];
  for (const p of series) {
    const ms = Date.parse(`${p.date}T00:00:00Z`);
    if (Number.isFinite(ms) && ms < cutoffMs) continue;
    out.push([epochDay(p.date), Math.round(p.value * 1e6) / 1e6]);
  }
  return out;
}

/** Write the stage blob (the Worker venue's history-rung hand-off). */
export async function putStage(kv: KVLike, blob: StageBlob): Promise<void> {
  await kv.put(INSIGHTS_STAGE_KEY, JSON.stringify(blob));
}

/** Read the staged series back (the history rungs' input). */
export async function readStage(kv: KVLike): Promise<StageBlob | undefined> {
  const raw = await kv.get(INSIGHTS_STAGE_KEY);
  if (raw === null) return undefined;
  try {
    const parsed = StageBlobSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return undefined;
    return parsed.data as StageBlob;
  } catch {
    return undefined;
  }
}

/**
 * THE ingest run: collect every source, derive the series, validate, write
 * the snapshot (+ status + public projection + archives + seeds + stage).
 * Always writes unless dryRun — even when P1s are held/unavailable (the
 * H3 honesty carries the outage; the result reports the alert).
 */
export async function runInsightsUpdate(opts: IngestRunOptions): Promise<IngestRunResult> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);
  const dryRun = opts.dryRun === true;

  console.log(`# Insights ingestion run — ${nowIso}`);
  console.log(`mode=${opts.mode}${dryRun ? ' DRY-RUN (no KV writes)' : ''}\n`);

  const { inputs, reports } = await collectAllSources({
    ...(opts.skipRbaCsvTables !== undefined ? { skipRbaCsvTables: opts.skipRbaCsvTables } : {}),
  });

  // v3 fail-closed inputs: kill-switched ids + per-provider blocked outcomes.
  const disabledReadings: string[] = auditDisabledIds();
  const sourceOutcomes: Record<string, 'blocked' | 'format-changed'> = {};
  for (const row of reports) {
    if (row.source === 'cross-check' || row.ok) continue;
    if (row.kind === 'blocked') sourceOutcomes[row.source] = 'blocked';
    else if (row.kind === 'format-changed') sourceOutcomes[row.source] = 'format-changed';
  }

  // Manual data + the bundle's bookkeeping (see ingest/data.ts).
  const chinaPmi: SeriesPoint[] | undefined = CHINA_PMI;
  const manualExpires: Readonly<Record<string, string>> = MANUAL_EXPIRES;
  reports.push({
    source: 'manual',
    ok: true,
    detail:
      chinaPmi === undefined
        ? 'no data files yet (Phase I5 content work)'
        : `china-pmi: ${chinaPmi.length} observations (expires ${manualExpires['china-pmi'] ?? '?'})`,
  });
  console.log(
    chinaPmi === undefined
      ? '[ingest] china-pmi: absent — reads unavailable'
      : `[ingest] china-pmi: ${chinaPmi.length} observations (expires ${manualExpires['china-pmi'] ?? '?'})`,
  );

  // The Shiller legs stay kill-switched off (T-30): the register row governs
  // (the Worker venue does not read the bulk file until the owner flips it
  // and a redeploy carries the import — the GHA runner still reads its copy).
  const shiller = undefined;

  // SEED histories: re-read the stored accumulation before deriving so each
  // run's live spot joins the previously accumulated daily points.
  const seedHistory: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
  for (const id of SEED_IDS) {
    try {
      const stored = await opts.store.getHistory(id);
      if (stored) seedHistory[id] = historyToSeries(stored);
    } catch (err) {
      console.warn(`[ingest] seed read failed for ${id}: ${errMessage(err)}`);
    }
  }
  for (const id of SEED_IDS) {
    if (seedHistory[id]) console.log(`[ingest] seed: ${id} ${seedHistory[id]!.length} accumulated points`);
  }

  const previous = await opts.store.getSnapshot();
  if (previous) {
    console.log(`\n[ingest] previous snapshot: generatedAt=${previous.generatedAt} (${previous.readings.length} readings)`);
  } else {
    console.log('\n[ingest] no previous snapshot — first run (changedThisWeek starts empty)');
  }

  const series = buildIndicatorSeries({
    ...inputs,
    chinaPmi,
    seedHistory,
    shiller,
  });

  // Peaks + "highest since {year}" (the long-history yields need the full
  // fetched series — a 10-year window cannot say 2002).
  const peaks = computePeaks(inputs, series.brent);
  for (const [id, peak] of Object.entries(peaks) as [IndicatorId, { value: number; date: string; basis: string }][]) {
    console.log(`[ingest] peak ${id}: ${peak.value} on ${peak.date} (${peak.basis})`);
  }
  const HIGHEST_SINCE_IDS: IndicatorId[] = ['us10y', 'us30y', 'real-yield-10y', 'au-10y'];
  const highestSince: Partial<Record<IndicatorId, number>> = {};
  for (const id of HIGHEST_SINCE_IDS) {
    const full = series[id];
    if (full && full.length > 1) {
      const year = computeHighestSinceYear(full);
      if (year !== undefined) highestSince[id] = year;
    }
  }

  // The draft → validation → published sequence (Part D + A-03/A-04).
  const draft = buildInsightsSnapshot({
    series,
    previous,
    calendar: CALENDAR,
    releaseSchedule: RELEASE_SCHEDULE,
    fedTargetUpper: inputs.fred.DFEDTARU,
    policyDecisions: POLICY_DECISIONS,
    peaks,
    highestSince,
    contextNotes: CONTEXT_NOTES,
    manualExpires,
    disabledReadings,
    sourceOutcomes,
    now: nowIso,
  });

  const outcome = runValidationSuite({
    series,
    readings: draft.readings,
    calendar: CALENDAR,
    now: nowIso,
    breakeven10y: inputs.fred.T10YIE,
    ...(previous !== undefined ? { previousReadings: previous.readings } : {}),
    ...(opts.copyTexts !== undefined && opts.copyTexts.length > 0 ? { copyTexts: opts.copyTexts } : {}),
    ...(REGRESSION_EPISODES !== undefined ? { episodes: REGRESSION_EPISODES } : {}),
  });

  const snapshot = buildInsightsSnapshot({
    series,
    previous,
    calendar: CALENDAR,
    releaseSchedule: RELEASE_SCHEDULE,
    fedTargetUpper: inputs.fred.DFEDTARU,
    policyDecisions: POLICY_DECISIONS,
    peaks,
    highestSince,
    contextNotes: CONTEXT_NOTES,
    manualExpires,
    disabledReadings,
    sourceOutcomes,
    flags: outcome.flags,
    now: nowIso,
  });
  const status = buildInsightsStatus({ reports, generatedAt: nowIso, mode: opts.mode, dryRun, validation: outcome.results });

  console.log('\n## Validation suite (Part D — runs before every publish)');
  for (const result of outcome.results) {
    const flagNote = result.flagged.length > 0 ? ` flagged: ${result.flagged.join(', ')}` : '';
    const note = result.notes?.length ? ` (${result.notes.join('; ')})` : '';
    console.log(`  ${result.ok ? '✅' : '❌'} ${result.test} ${result.name}${note}${flagNote}`);
    for (const failure of result.failures) console.log(`      ${failure}`);
  }

  const failedSources = reports.filter((r) => !r.ok).map((r) => r.source);
  console.log('\n## Source report');
  for (const r of reports) console.log(`  ${r.ok ? '✅' : '❌'} ${r.source} — ${r.detail}`);

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
    for (const e of snapshot.changedThisWeek) console.log(`  ${e.id}: ${e.from} → ${e.to} (@ ${e.asOf})`);
  }

  /* ---------------- Writes (always — see the module header) ---------------- */

  let ok = true;
  let staged = false;
  const hiddenIds = opts.hiddenPublicIds ?? new Set<string>();

  if (!dryRun) {
    console.log('\n## KV writes');
    // F2 (2026-10-21 stage-write fix): THE STAGE BLOB GOES FIRST. The 04:10
    // live run died at the stage stringify (exceededCpu — the blob was the
    // LAST write in the chain, after snapshot/status/archives/seeds), so the
    // 04:25/04:40 history rungs found nothing staged and every non-seed
    // history starved at its 2026-10-19 state. Writing it FIRST and
    // isolating it in its own try/catch means: (a) it lands while the CPU
    // budget is untouched; (b) a stage failure can never take the snapshot
    // family down with it (the run continues — the histories would hold,
    // but the page stays fresh); (c) a stage failure still marks the run
    // degraded (ok=false stays informational only for the snapshot family —
    // the alert surfaces via `staged:false` in the result + this log line).
    if (opts.stageKv !== undefined) {
      try {
        const todayMs = Date.parse(`${today}T00:00:00Z`);
        const blob: StageBlob = { v: STAGE_VERSION, writtenAt: nowIso, series: {} };
        for (const def of DEFINITIONS) {
          const s = series[def.id];
          if (s && s.length > 1) blob.series[def.id] = trimForStage(s, todayMs);
        }
        await putStage(opts.stageKv, blob);
        staged = true;
        console.log(`  ✍ ${INSIGHTS_STAGE_KEY} (${Object.keys(blob.series).length} series staged)`);
      } catch (err) {
        console.error(`[ingest] STAGE WRITE FAILED — the history rungs will hold: ${errMessage(err)}`);
      }
    }
    try {
      await opts.store.putSnapshot(snapshot);
      console.log('  ✍ insights:snapshot');
      await opts.store.putStatus(status);
      console.log('  ✍ insights:status');
      const archiveDate = today;
      const alreadyArchived = (await opts.store.getArchive(archiveDate)) !== undefined;
      if (!alreadyArchived) {
        await opts.store.putArchive(archiveDate, snapshot);
        console.log(`  ✍ insights:archive:v1:${archiveDate}`);
      } else {
        console.log(`  · insights:archive:v1:${archiveDate} already written today`);
      }
      await opts.store.putPublicSnapshot(projectSnapshotToPublic(snapshot, hiddenIds));
      console.log('  ✍ insights:snapshot-public');
      const publicAlreadyArchived = (await opts.store.getPublicArchive(archiveDate)) !== undefined;
      if (!publicAlreadyArchived) {
        await opts.store.putPublicArchive(archiveDate, projectSnapshotToPublic(snapshot, hiddenIds));
        console.log(`  ✍ insights:archive-public:v1:${archiveDate}`);
      } else {
        console.log(`  · insights:archive-public:v1:${archiveDate} already written today`);
      }
      // The SEED histories (the accumulated-daily rows' own appends).
      for (const id of SEED_IDS) {
        const s = series[id];
        if (!s) continue;
        const history = buildHistoryFile(id, s, { minPoints: 1 });
        if (history) {
          await opts.store.putHistory(history);
          console.log(`  ✍ insights:hist:${id} (seed append)`);
        }
      }
    } catch (err) {
      ok = false;
      console.error(`[ingest] CRITICAL — a write failed: ${errMessage(err)}`);
    }
  } else {
    console.log('\n[ingest] dry-run — nothing written to KV.');
  }

  const p1Unavailable = DEFINITIONS.filter(
    (d) => d.phase === 'P1' && snapshot.readings.find((r) => r.id === d.id)?.status === 'unavailable',
  ).map((d) => d.id);
  const heldP1 = DEFINITIONS.filter((d) => {
    if (d.phase !== 'P1') return false;
    const r = snapshot.readings.find((x) => x.id === d.id);
    return r?.status === 'stale' && !series[d.id];
  }).map((d) => d.id);

  if (p1Unavailable.length > 0) {
    console.error(`\n[ingest] ALERT — P1 indicators unavailable (page degraded): ${p1Unavailable.join(', ')}`);
  }
  if (heldP1.length > 0) {
    console.error(`\n[ingest] ALERT — P1 fetch failures held on last good values (flagged stale): ${heldP1.join(', ')}`);
  }
  if (failedSources.length > 0) {
    console.warn(`\n[ingest] WARNING — failing sources: ${failedSources.join(', ')}`);
  }
  console.log(`\n[ingest] ${dryRun ? 'dry-run complete' : 'run complete'} — snapshot ${ok ? 'written' : 'WRITE FAILED'}.`);

  return { ok, snapshot, series, p1Unavailable, heldP1, failedSources, reports, staged };
}

/* ------------------------------------------------------------------ *
 * The Node venue's inline history writes (read-compared, no staging).
 * ------------------------------------------------------------------ */

export interface InlineHistoryResult {
  written: number;
  unchanged: number;
  singlePoint: number;
  failed: number;
}

/**
 * Write every definition's history key with the OLD read-compare discipline
 * (the GitHub Actions / manual runner path — no subrequest ceiling, and the
 * write budget stays minimal). Single-point series get no key; SEED_IDS
 * bootstrap at minPoints 1.
 */
export async function writeAllHistoriesInline(
  store: InsightsStore,
  series: Record<string, SeriesPoint[]>,
): Promise<InlineHistoryResult> {
  let written = 0;
  let unchanged = 0;
  let singlePoint = 0;
  let failed = 0;
  for (const def of DEFINITIONS) {
    const indicatorSeries = series[def.id];
    const history = indicatorSeries
      ? buildHistoryFile(def.id, indicatorSeries, SEED_IDS.includes(def.id) ? { minPoints: 1 } : undefined)
      : undefined;
    if (!history) {
      if (indicatorSeries) singlePoint++;
      continue; // no series (unavailable) or a single live point — no history key
    }
    try {
      const stored = await store.getHistory(def.id);
      if (
        stored &&
        stored.id === history.id &&
        stored.points.length === history.points.length &&
        stored.points.every((p, i) => p[0] === history.points[i]![0] && p[1] === history.points[i]![1])
      ) {
        unchanged++;
        continue;
      }
      await store.putHistory(history);
      written++;
    } catch (err) {
      failed++;
      console.warn(`  ⚠ insights:hist:${def.id} failed: ${errMessage(err)}`);
    }
  }
  console.log(
    `\n  history: ${written} written · ${unchanged} unchanged (skipped) · ${singlePoint} single-point (no key) · ${failed} failed`,
  );
  return { written, unchanged, singlePoint, failed };
}

/* ------------------------------------------------------------------ *
 * The history rungs (04:25 daily-cadence, 04:40 periodic) — the Worker
 * venue's phased writes (the Node venue writes histories inline instead).
 * ------------------------------------------------------------------ */

export interface HistoryPhaseResult {
  ok: boolean;
  written: number;
  unchanged: number;
  singlePoint: number;
  ids: string[];
}

export interface HistoryPhaseOptions {
  /** The Worker's RATES binding (stage read + history writes). */
  kv: KVLike;
  /** 'daily' — the day/week-cadence ids (unconditional writes); 'periodic' — monthly/quarterly (read-compare). */
  phase: 'daily' | 'periodic';
  /** Clock injection (tests). */
  now?: Date;
}

/** The ids a phase covers — derived FROM the definitions (self-maintaining). */
export function historyPhaseIds(phase: 'daily' | 'periodic'): IndicatorId[] {
  return DEFINITIONS.filter((d) =>
    phase === 'daily'
      ? d.cadence === 'daily' || d.cadence === 'weekly'
      : d.cadence === 'monthly' || d.cadence === 'quarterly' || d.cadence === 'per-change' || d.cadence === 'manual',
  ).map((d) => d.id);
}

/**
 * One history rung: read the stage, rebuild the history files for the
 * phase's ids, write them. The DAILY phase writes unconditionally (the
 * subrequest budget: ~35 writes, no reads — content is idempotent); the
 * PERIODIC phase read-compares (reads are cheap, writes stay rare).
 */
export async function runInsightsHistoryPhase(opts: HistoryPhaseOptions): Promise<HistoryPhaseResult> {
  const now = opts.now ?? new Date();
  const ids = historyPhaseIds(opts.phase);
  console.log(`# Insights history phase '${opts.phase}' — ${now.toISOString()} (${ids.length} ids)`);
  const stage = await readStage(opts.kv);
  if (stage === undefined) {
    console.warn(`[ingest] no stage blob under ${INSIGHTS_STAGE_KEY} — nothing to write (the 04:10 rung did not stage)`);
    return { ok: true, written: 0, unchanged: 0, singlePoint: 0, ids: [] };
  }
  const ageMs = Date.parse(stage.writtenAt);
  const stageAgeH = Number.isFinite(ageMs) ? (now.getTime() - ageMs) / 3_600_000 : Number.POSITIVE_INFINITY;
  if (stageAgeH > 25) {
    console.warn(
      `[ingest] stage blob is ${stageAgeH.toFixed(1)}h old (written ${stage.writtenAt}) — writing anyway (idempotent content)`,
    );
  }

  let written = 0;
  let unchanged = 0;
  let singlePoint = 0;
  let ok = true;
  for (const id of ids) {
    const pairs = stage.series[id];
    if (pairs === undefined) {
      singlePoint++; // no series this run (unavailable/held) — the stored key stays
      continue;
    }
    const series: SeriesPoint[] = pairs.map(([day, value]) => ({ date: fromEpochDay(day), value }));
    const history = buildHistoryFile(id, series, SEED_IDS.includes(id) ? { minPoints: 1 } : undefined);
    if (!history) {
      if (series.length > 0) singlePoint++;
      continue;
    }
    try {
      if (opts.phase === 'periodic') {
        const storedRaw = await opts.kv.get(`insights:hist:${id}`);
        if (storedRaw !== null) {
          try {
            const stored = JSON.parse(storedRaw) as { id: string; points: Array<[number, number]> };
            if (
              stored.id === history.id &&
              stored.points.length === history.points.length &&
              stored.points.every((p, i) => p[0] === history.points[i]![0] && p[1] === history.points[i]![1])
            ) {
              unchanged++;
              continue;
            }
          } catch {
            // poisoned stored history — the write below replaces it
          }
        }
      }
      await opts.kv.put(`insights:hist:${id}`, JSON.stringify(history));
      written++;
    } catch (err) {
      ok = false;
      console.warn(`  ⚠ insights:hist:${id} failed: ${errMessage(err)}`);
    }
  }
  console.log(
    `  history: ${written} written · ${unchanged} unchanged (skipped) · ${singlePoint} no-series/point (kept)${ok ? '' : ' · SOME FAILED'}`,
  );
  return { ok, written, unchanged, singlePoint, ids };
}
