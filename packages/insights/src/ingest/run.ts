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
 *   04:10 rung 1 (runInsightsUpdate) — ~35 fetches + 9 reads + 6 writes =
 *   50 ✓ (AT the fetch-subrequest ceiling — the M6 Wave-4 accounting,
 *   2026-10-25b: the Wave-3 round added 5 fetches — the ECB HICP, the
 *   gold-api XPT and the ABS leading-edge trio — and paid for them by
 *   REMOVING the 5 redundant seed-append writes (the 04:25 phase writes
 *   the identical content from the stage); the BoE fix then swapped the
 *   FRED OECD mirror group member for the BoE Bank-Rate page fetch (+1
 *   fetch, the group still one request). Empirical note: the 00:15 UTC
 *   publish rung completed with 41 fetch-rows + 6 writes — KV operations
 *   do not consume the fetch-subrequest budget, so the working headroom
 *   is the fetch count alone (~42/50). The recorded follow-up if a future
 *   wave needs headroom: consolidate the 6 seed HISTORY reads into one
 *   stage-blob read (−4) or pre-stage the slow monthly/quarterly families
 *   on a 04:05 rung.)
 *   The RBA CSV attempts are SKIPPED on the Worker
 *   (skipRbaCsvTables) — six doomed 403s would burn the budget.
 *   04:25 rung 2 (runInsightsHistoryPhase 'daily') — 1 stage read + the
 *   day-cadence history writes (unconditional: ~39, the M6 daily/weekly
 *   additions included) = 40 ✓.
 *   04:40 rung 3 (runInsightsHistoryPhase 'periodic') — 1 stage read + ~33
 *   read-compares + rare writes = ~34 ✓.
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
import type { InsightsSnapshot, InsightsSourceReport, IndicatorId, IndicatorReading } from '@currena/core';
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
  patchInsightsSnapshot,
  READING_SOURCES,
  mergeSeries,
  type SeriesInputs,
} from '../adapters/index';
import { runValidationSuite } from '../validation';
import type { InsightsStore } from '../store';
import {
  auditDisabledIds,
  CALENDAR,
  CHINA_CPI,
  CHINA_PMI,
  CONTEXT_NOTES,
  MANUAL_EXPIRES,
  POLICY_DECISIONS,
  REGRESSION_EPISODES,
  RELEASE_SCHEDULE,
  SHILLER,
  SHILLER_LATEST_DATE,
} from './data';
import { providerFetchEnabled, SANITY_RANGES, withinSanityRange } from '../sources';
import { collectRung2Sources, rung2FetchPlanFor, RUNG2_IDS, type Rung2FetchPlan } from '../adapters/rung2';
import type { ReadingSourceOverride } from '../adapters/collect';
import { computeReading, type ReadingSource } from '../scoring';
import type { KVLike } from './kv-store';
import { combineSeries, epochDay, fromEpochDay, type SeriesPoint } from '../series';

/**
 * The live-priced rows whose value series accumulate one observation per
 * run (the seed appends). M6 Wave 3 (2026-10-25): platinum joins (the daily
 * XPT cadence fix — the gold-usd pattern). NOTE the same round REMOVED the
 * main rung's seed-append writes: the 04:25 daily-history phase writes the
 * identical content from the stage 15 minutes later (verified — the phase
 * covers every daily/weekly cadence id and the seeds are all daily), so the
 * main rung no longer burns 5 of its 50-subrequest budget on redundant
 * appends. The Node/GHA venue's writeAllHistoriesInline still writes every
 * seed inline (no ceiling there).
 */
export const SEED_IDS: IndicatorId[] = ['gold-usd', 'silver-usd', 'copper-usd', 'btc-usd', 'gold-silver', 'platinum'];

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
   * 2026-10-22 reliability round — SWEEP mode: an intra-day re-run (the
   * 10:10/20:10 rungs) after a rung with failed sources. Same collect →
   * derive → validate → write path, trimmed for the subrequest budget:
   * the day's archives already exist (their checks + writes skip) and the
   * seed appends skip (the 04:10/04:25 rungs already landed today's
   * points; the sweep's fresher spots re-land at the next full rung).
   */
  sweep?: boolean;
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
  /**
   * 2026-10-26 gap-audit build (the rung-2 split): fetched rung-2 series,
   * merged into the build's inputs so the NODE venue and the selfcheck
   * derive everything in ONE run (no subrequest ceiling there). The
   * Worker's 04:10 main rung passes nothing — its rung-2 ids carry
   * forward (carryForwardIds) until the 04:20 phase patches them.
   */
  rung2Series?: Partial<Record<IndicatorId, SeriesPoint[]>>;
  /**
   * The OECD mirror armed as the jgb-10y fallback (the Node venue passes
   * the FRED mirror it already collected; the 04:20 phase reads it from
   * the stage helper the main rung writes).
   */
  jgbMirrorFallback?: SeriesPoint[];
  /**
   * 2026-10-22 reliability round, refined 2026-10-26: the SWEEP rungs skip
   * the stage write — the morning's real stage (04:20-updated) must stand
   * for the 04:25/04:40 history phases; a sweep's stage blob would lack
   * the rung-2 entries (its build carries them) and starve the phases.
   */
  skipStageWrite?: boolean;
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

  const tStart = performance.now();
  const collected = await collectAllSources({
    ...(opts.skipRbaCsvTables !== undefined ? { skipRbaCsvTables: opts.skipRbaCsvTables } : {}),
    // The fallback fills merge with the STORED histories so the 10-year
    // percentile base survives a FRED outage (Treasury's current-year
    // curves alone would shrink the window to months).
    historyReader: (id: string) =>
      opts.store
        .getHistory(id as Parameters<typeof opts.store.getHistory>[0])
        .then((h) => (h ? historyToSeries(h) : undefined))
        .catch(() => undefined),
  });
  const { inputs, reports } = collected;
  // Mutable: the inline rung-2 mirror fallback adds its honest attribution.
  const readingSourceOverrides: Partial<Record<IndicatorId, ReadingSourceOverride>> = { ...collected.readingSourceOverrides };
  const tCollect = performance.now();

  // v3 fail-closed inputs: kill-switched ids + per-provider blocked outcomes.
  const disabledReadings: string[] = auditDisabledIds();
  const sourceOutcomes: Record<string, 'blocked' | 'format-changed'> = {};
  for (const row of reports) {
    if (row.source === 'cross-check' || row.ok) continue;
    if (row.kind === 'blocked') sourceOutcomes[row.source] = 'blocked';
    else if (row.kind === 'format-changed') sourceOutcomes[row.source] = 'format-changed';
  }

  // M7 (2026-10-26): the committed China SEED histories + the manual-expiry
  // bookkeeping. The NBS fetches (inputs.nbs) come from collectAllSources;
  // the STORED accumulations below join them so the china-cpi series grows
  // monthly (each CPI release carries only its own month).
  const chinaPmi: SeriesPoint[] | undefined = CHINA_PMI;
  const chinaCpi: SeriesPoint[] | undefined = CHINA_CPI;
  const manualExpires: Readonly<Record<string, string>> = MANUAL_EXPIRES;
  const nbsStored: NonNullable<SeriesInputs['nbsStored']> = {};
  for (const id of ['china-pmi', 'china-cpi'] as const) {
    try {
      const stored = await opts.store.getHistory(id);
      if (stored) nbsStored[id] = historyToSeries(stored);
    } catch {
      // a poisoned stored key must not sink the run — the seed + fetch carry the card
    }
  }
  reports.push({
    source: 'manual',
    ok: true,
    detail: `committed seeds: china-pmi ${chinaPmi?.length ?? 0} obs · china-cpi ${chinaCpi?.length ?? 0} obs (data/manual/, the M7 NBS automation merges over them; stored accumulation ${Object.keys(nbsStored).length || 'empty'})`,
  });
  console.log(
    `[ingest] nbs: seeds china-pmi ${chinaPmi?.length ?? 0} · china-cpi ${chinaCpi?.length ?? 0} obs` +
      (Object.keys(nbsStored).length > 0
        ? ` · stored ${Object.entries(nbsStored)
            .map(([k, v]) => `${k} ${v.length}`)
            .join(' · ')}`
        : ''),
  );

  // The Shiller legs — the T-30 flip landed 2026-10-23 (the owner's
  // OD-1/D-42 approval; licences.ts + sources.ts carry the record). The
  // register row still governs here: a disabled row passes undefined and
  // the cards read unavailable, so a future un-flip fails closed.
  const shiller = providerFetchEnabled('shiller') ? SHILLER : undefined;
  if (shiller) {
    console.log(
      `[ingest] shiller: cape ${shiller.cape.length} · ecy ${shiller.ecy.length} rows (latest ${SHILLER_LATEST_DATE ?? '?'})`,
    );
  } else {
    console.log('[ingest] shiller: register row disabled — reads unavailable');
  }

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

  // The Node venue / selfcheck pass rung2Series (the inline collection).
  // When their MOF fetch failed, the OECD mirror the main collect ALREADY
  // fetched arms itself as the labelled fallback (the 04:20 Worker phase
  // reads the same mirror from the stage helper instead).
  const mirrorArmsItself =
    opts.rung2Series !== undefined &&
    opts.rung2Series['jgb-10y'] === undefined &&
    inputs.fred.IRLTLT01JPM156N !== undefined &&
    inputs.fred.IRLTLT01JPM156N.length > 0;
  // 2026-10-26 wave-3: the weekly/monthly additions ride the inline build
  // too (the Rung2SeriesInputs.series contract, at last consumed) — each
  // fetched series first merges with its STORED accumulation (the same
  // merge the 04:20 phase performs) so the CFTC single-point file and the
  // monthly files accumulate on this venue exactly as they do on the
  // Worker. A dry-run's no-op store simply skips the merge (raw fetched).
  const inlineRung2Series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
  for (const [id, fetched] of Object.entries(opts.rung2Series ?? {}) as [IndicatorId, SeriesPoint[]][]) {
    if (fetched === undefined) continue;
    if (id === 'jgb-10y') continue; // its merge path is the mirror-aware one below
    const stored = await storedSeriesOf(opts.store, id);
    inlineRung2Series[id] = stored !== undefined ? mergeSeries(stored, fetched) : fetched;
  }
  const rung2Inputs = opts.rung2Series !== undefined || opts.jgbMirrorFallback !== undefined
    ? {
        jgb10y: opts.rung2Series?.['jgb-10y'],
        jgbMirror: opts.jgbMirrorFallback ?? (mirrorArmsItself ? inputs.fred.IRLTLT01JPM156N : undefined),
        ...(Object.keys(inlineRung2Series).length > 0 ? { series: inlineRung2Series } : {}),
      }
    : undefined;
  if (mirrorArmsItself) {
    // The honest attribution when the mirror fills (the readingSourceOverrides
    // discipline — the same line the 04:20 phase stamps on a MOF outage).
    console.log('[ingest] jgb-10y: the inline MOF fetch failed — the OECD mirror fills, labelled');
    readingSourceOverrides['jgb-10y'] = {
      name: 'OECD via FRED (IRLTLT01JPM156N, monthly average — MOF outage fallback)',
      url: 'https://fred.stlouisfed.org/series/IRLTLT01JPM156N',
    };
  }
  const series = buildIndicatorSeries({
    ...inputs,
    ...(rung2Inputs !== undefined ? { rung2: rung2Inputs } : {}),
    chinaPmi,
    chinaCpi,
    nbsStored,
    seedHistory,
    shiller,
  });
  const tDerive = performance.now();

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
  // 2026-10-23 CPU round: BOTH builds share the deterministic per-reading
  // base via the cache — the final build replays instead of recomputing
  // (the double percentile pass was what pushed the 04:10 rung past the
  // free plan's CPU budget; the runs died between peaks and the first
  // write, leaving status frozen at the last good run).
  const baseReadingCache = new Map<string, IndicatorReading>();
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
    ...(readingSourceOverrides !== undefined && Object.keys(readingSourceOverrides).length > 0
      ? { sourceOverrides: readingSourceOverrides }
      : {}),
    now: nowIso,
    baseReadingCache,
    carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
  });
  const tDraft = performance.now();

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
  const tValidation = performance.now();

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
    ...(readingSourceOverrides !== undefined && Object.keys(readingSourceOverrides).length > 0
      ? { sourceOverrides: readingSourceOverrides }
      : {}),
    now: nowIso,
    baseReadingCache,
    carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
  });
  const tFinal = performance.now();
  // 2026-10-23 CPU round: the phase budget, one line per run — the number
  // the free-plan CPU limit makes existential (wall ≈ CPU for the pure
  // phases; collect's wall is network-dominated but its parse CPU rides
  // inside it).
  console.log(
    `[ingest] phases — collect ${((tCollect - tStart) / 1000).toFixed(2)}s wall · derive+peaks ${((tDerive - tCollect) / 1000).toFixed(2)}s · draft ${((tDraft - tDerive) / 1000).toFixed(2)}s · validation ${((tValidation - tDraft) / 1000).toFixed(2)}s · final ${((tFinal - tValidation) / 1000).toFixed(2)}s`,
  );
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
    if (opts.stageKv !== undefined && opts.skipStageWrite === true) {
      console.log('  · stage write SKIPPED (sweep mode — the morning rung-2-updated stage stands)');
    } else if (opts.stageKv !== undefined) {
      try {
        const todayMs = Date.parse(`${today}T00:00:00Z`);
        const blob: StageBlob = { v: STAGE_VERSION, writtenAt: nowIso, series: {} };
        for (const def of DEFINITIONS) {
          const s = series[def.id];
          if (s && s.length > 1) blob.series[def.id] = trimForStage(s, todayMs);
        }
        // 2026-10-26 gap-audit build: HELPER series the 04:20 rung-2 phase
        // needs — the OECD mirror armed as the jgb-10y outage fallback (the
        // phase cannot read the FRED group's raw output, only the stage).
        const mirror = inputs.fred.IRLTLT01JPM156N;
        if (mirror !== undefined && mirror.length > 1) {
          blob.series['jgb-mirror'] = trimForStage(mirror, todayMs);
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
      if (opts.sweep !== true) {
        // The sweep skips the day's archive pair — the main rung already
        // wrote them, and the sweep's subrequest budget needs the headroom.
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
      } else {
        // SWEEP: the public projection still refreshes (it is the product
        // surface); only the day's archive pair is skipped.
        await opts.store.putPublicSnapshot(projectSnapshotToPublic(snapshot, hiddenIds));
        console.log('  ✍ insights:snapshot-public (sweep)');
      }
      // M6 Wave 3 (2026-10-25) — the SEED APPENDS LEFT THE MAIN RUNG: the
      // 04:25 daily-history phase writes the identical content from the
      // stage (buildHistoryFile over the same series), so the main rung's
      // five seed writes were pure budget burn under the free plan's
      // 50-subrequest ceiling — the M6 additions (ECB HICP + gold-api XPT
      // + the ABS trio) needed the headroom. The GHA/Node venue is
      // unaffected (writeAllHistoriesInline writes every history inline,
      // seeds included, in its own ceiling-free process).
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
 * The rung-2 phase (2026-10-26 gap-audit build) — the 04:20 UTC rung that
 * owns the additions whose fetches must not ride the 04:10 main rung (the
 * audit's subrequest arithmetic). Fetches the planned feeds (MOF daily;
 * the weekly pair on Saturdays; the monthly trio on the first of the
 * month; anything missing = bootstrap), re-derives the affected series
 * against the stored accumulations, PATCHES the snapshot + the public
 * projection, and updates the stage so the 04:25/04:40 history phases
 * write the fresh data. The Node venue runs the same collection INLINE
 * (rung2Series on runInsightsUpdate) — no ceiling there.
 * ------------------------------------------------------------------ */

export interface Rung2PhaseResult {
  /** The re-derived series (the ids the phase refreshed this run). */
  series: Record<string, SeriesPoint[]>;
  /** Per-source report rows (appended to insights:status). */
  reports: InsightsSourceReport[];
  /** The fetch plan that ran. */
  plan: Rung2FetchPlan;
  /** Whether the snapshot + public projection were patched and written. */
  patched: boolean;
}

export interface Rung2PhaseOptions {
  /** The KV or REST store (snapshot read + stored-history reads + writes). */
  store: InsightsStore;
  /** The Worker venue's RATES binding (stage read/update). The Node venue omits it. */
  stageKv?: KVLike;
  /** 'scheduled' (the Worker rung) or 'manual' (a dispatch). */
  mode: 'scheduled' | 'manual';
  /** Clock injection (tests). */
  now?: Date;
  /** The ids the PUBLIC projection hides. */
  hiddenPublicIds?: ReadonlySet<string>;
  /** Force a plan (tests / the manual runner); default: the date + stage contents. */
  plan?: Rung2FetchPlan;
}

/** The derived US−Japan gap: inner join on common dates, 4dp quantized. */
function quantizedGap(us: SeriesPoint[], jp: SeriesPoint[]): SeriesPoint[] {
  const gap = combineSeries(us, jp, (a, b) => a - b);
  const f = 10_000;
  return gap.map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
}

/** Read a stored history as series, poison-tolerant (the collect pattern). */
async function storedSeriesOf(store: InsightsStore, id: IndicatorId): Promise<SeriesPoint[] | undefined> {
  try {
    const stored = await store.getHistory(id);
    return stored ? historyToSeries(stored) : undefined;
  } catch {
    return undefined; // a poisoned stored key must not sink the phase
  }
}

/**
 * THE rung-2 phase. Subrequest budget at 04:20: 1 stage read + 1 snapshot
 * read + 1 status read + the stored-history reads (one per refreshed id) +
 * the planned fetches (1 daily / 3 Saturday / 4 first-of-month max) + 4
 * writes (snapshot, public, stage, status) — comfortably inside 50.
 */
export async function runInsightsRung2Phase(opts: Rung2PhaseOptions): Promise<Rung2PhaseResult> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  console.log(`# Insights rung-2 phase — ${nowIso}`);

  // The stage: the parents the phase re-derives from (us10y for the gap —
  // A-3) + the jgb-mirror helper (the labelled MOF-outage fallback) + the
  // missing-id check that arms the bootstrap fetches.
  const stage = opts.stageKv !== undefined ? await readStage(opts.stageKv) : undefined;
  const missing = new Set<string>(RUNG2_IDS.filter((id) => (stage ? stage.series[id] === undefined : true)));
  const plan = opts.plan ?? rung2FetchPlanFor(now, missing);
  console.log(
    `[rung2] plan — mof=${plan.mof} eiaWeekly=${plan.eiaWeekly} cftcWeekly=${plan.cftcWeekly} monthly=${plan.monthly}` +
      (stage === undefined ? ' (no stage — the Node/manual venue)' : ` (bootstrap-missing: ${[...missing].join(', ') || 'none'})`),
  );

  // 1. Fetch the planned feeds (fail-soft per source; honest report rows).
  const collected = await collectRung2Sources(plan, { now });
  for (const row of collected.reports) console.log(`  ${row.ok ? '✅' : '❌'} ${row.source} — ${row.detail}`);

  // 2. Merge with the stored accumulations + re-derive. A-2 (jgb-10y): the
  // MOF fetch wins; the stored history extends it backwards (the daily
  // tail the phase itself has written since the upgrade + the OECD
  // mirror's monthly tail from before it); on a MOF outage the mirror
  // helper fills, LABELLED (the reading's source line switches — the
  // readingSourceOverrides discipline).
  const series: Record<string, SeriesPoint[]> = {};
  const sourceOverrides: Partial<Record<IndicatorId, ReadingSource>> = {};
  // A-3: the gap card's legs' own dates, captured at derivation time.
  const gapLegDates: Partial<Record<'us-japan-10y-gap', { us: string; jp: string }>> = {};
  const defOf = (id: IndicatorId) => DEFINITIONS.find((d) => d.id === id)!;

  if (plan.mof) {
    const stored = await storedSeriesOf(opts.store, 'jgb-10y');
    const fetched = collected.series['jgb-10y'];
    const mirror = stage?.series['jgb-mirror']?.map(([day, value]) => ({ date: fromEpochDay(day), value }));
    if (fetched !== undefined) {
      // MOF day: the fetched file carries the full month (+ the all-file
      // on monthly rungs); the stored accumulation extends the daily tail
      // backwards between all-file refreshes (fetched wins on collision).
      series['jgb-10y'] = stored !== undefined ? mergeSeries(stored, fetched) : fetched;
    } else if (mirror !== undefined && mirror.length > 0) {
      // MOF outage: the OECD mirror fills, LABELLED (the spec's fallback
      // terms — the stored daily tail stays the fresher truth on its own
      // dates, the mirror's monthly stamps carry the base).
      series['jgb-10y'] = stored !== undefined ? mergeSeries(mirror, stored) : mirror;
      sourceOverrides['jgb-10y'] = {
        name: 'OECD via FRED (IRLTLT01JPM156N, monthly average — MOF outage fallback)',
        url: 'https://fred.stlouisfed.org/series/IRLTLT01JPM156N',
      };
      console.log('  · jgb-10y: MOF unavailable — the OECD mirror fills, labelled');
    } else if (stored !== undefined) {
      // Neither fetch worked: hold the stored accumulation (the reading
      // ages under its own cadence grace — honest staleness in a few days).
      series['jgb-10y'] = stored;
      console.log('  · jgb-10y: MOF and the mirror both unavailable — holding the stored tail');
    }

    // A-3 (2026-10-26 gap-audit build): the US−Japan 10-year gap — the
    // staged us10y (DGS10, the 04:10 build's own series) minus the jgb
    // series this phase just resolved. Inner join on common dates, 4dp
    // quantized (F4), fail closed on either parent missing (never a
    // stale gap — the au-us-10y-gap discipline).
    const stagedUs10y = stage?.series['us10y']?.map(([day, value]) => ({ date: fromEpochDay(day), value }));
    const jgbSeries = series['jgb-10y'];
    if (stagedUs10y !== undefined && jgbSeries !== undefined) {
      const gap = quantizedGap(stagedUs10y, jgbSeries);
      if (gap.length > 0) {
        series['us-japan-10y-gap'] = gap;
        console.log(`  · us-japan-10y-gap: ${gap.at(-1)!.value} @ ${gap.at(-1)!.date}`);
      } else {
        // No common dates (a desynchronised stage) — fail closed, never a
        // stale gap: the reading carries, the next rung re-derives.
        console.log('  · us-japan-10y-gap: the parents share no dates — holding (fail closed)');
      }
    } else {
      console.log('  · us-japan-10y-gap: a parent is missing — holding (fail closed)');
    }
    // The gap card's legs' own dates (the B-10 pattern): the staged US leg
    // and this phase's jgb series.
    const us10yLegLast = stagedUs10y?.at(-1)?.date;
    const jgbLegLast = jgbSeries?.at(-1)?.date;
    if (us10yLegLast !== undefined && jgbLegLast !== undefined) {
      gapLegDates['us-japan-10y-gap'] = { us: us10yLegLast, jp: jgbLegLast };
    }
  }

  // A-6/A-7 (2026-10-26 gap-audit build): the weekly pair — the fetched
  // series merge with the stored accumulations (the CFTC file carries
  // only the latest week; the EIA page its full history — fetched wins on
  // date collisions either way, and the stored tail carries the weeks a
  // missed Saturday would otherwise lose). 2026-10-26 wave-3 fix: the
  // accumulation base also arms from the STAGE entry when the stored
  // history key does not exist yet — the CFTC file's FIRST point lives
  // only in the stage until the 04:25 daily phase writes the 2-point
  // history (buildHistoryFile's floor), and without the stage base the
  // second week's fetch would replace rather than join the first (the
  // accumulation deadlock the A-7 commit shipped with).
  for (const id of ['eia-crude-stocks', 'cftc-gold-positioning'] as const) {
    const fetched = collected.series[id];
    if (fetched === undefined) continue;
    const stored =
      (await storedSeriesOf(opts.store, id)) ??
      stage?.series[id]?.map(([day, value]) => ({ date: fromEpochDay(day), value }));
    series[id] = stored !== undefined ? mergeSeries(stored, fetched) : fetched;
  }

  // A-8..A-10 (2026-10-26 gap-audit build): the monthly trio — the CLI
  // family, the GPR export and the EPU workbook (first-of-month +
  // bootstrap). Each fetch carries its full history, so the stored merge
  // is belt-and-braces (fetched wins on collision); the stage base arms
  // the same bootstrap the weekly pair uses.
  for (const id of ['oecd-cli-us', 'oecd-cli-cn', 'oecd-cli-de', 'gpr-index', 'epu-us'] as const) {
    const fetched = collected.series[id];
    if (fetched === undefined) continue;
    const stored =
      (await storedSeriesOf(opts.store, id)) ??
      stage?.series[id]?.map(([day, value]) => ({ date: fromEpochDay(day), value }));
    series[id] = stored !== undefined ? mergeSeries(stored, fetched) : fetched;
  }

  if (Object.keys(series).length === 0) {
    console.log('[rung2] nothing to patch (no fetch succeeded and no fallback filled)');
    return { series, reports: collected.reports, plan, patched: false };
  }

  // 3. Rebuild the affected readings (computeReading + the sanity gates —
  // the same engine the main build uses; the enrichments that apply:
  // jgb-10y carries none of the special ones).
  const storedSnapshot = await opts.store.getSnapshot();
  if (storedSnapshot === undefined) {
    console.warn('[rung2] no stored snapshot to patch — the next main rung builds from scratch');
    return { series, reports: collected.reports, plan, patched: false };
  }
  const patchedReadings: IndicatorReading[] = [];
  for (const [id, idSeries] of Object.entries(series) as [IndicatorId, SeriesPoint[]][]) {
    const def = defOf(id);
    const source: ReadingSource = sourceOverrides[id] ?? READING_SOURCES[id] ?? { name: def.sourceRef };
    let reading = computeReading(def, idSeries, nowIso, source);
    // A-3: the gap card's legs' own dates (the B-10 gapLegs pattern — the
    // us10y leg rides the 04:10 stage, the jgb leg this phase's series).
    const legs = gapLegDates['us-japan-10y-gap'];
    if (id === 'us-japan-10y-gap' && reading.asOf !== null && legs !== undefined) {
      reading = {
        ...reading,
        gapLegs: { a: { id: 'us10y', asOf: legs.us }, b: { id: 'jgb-10y', asOf: legs.jp } },
      };
    }
    // The definitional sanity range (T-28/F-14) — the same gate the main
    // build applies after the deterministic base.
    const sanityBand = SANITY_RANGES[id as string];
    if (sanityBand !== undefined && reading.value !== null && !withinSanityRange(id as string, reading.value)) {
      const bandText = sanityBand.minExclusive
        ? 'must be greater than zero'
        : `must sit in ${sanityBand.min ?? '-∞'} to ${sanityBand.max ?? '∞'}`;
      reading = {
        ...reading,
        value: null,
        asOf: null,
        status: 'unavailable',
        flag: { test: 'T-28', reason: `value outside its allowed range (${bandText}) — rejected, can't tell right now` },
      };
    }
    patchedReadings.push(reading);
    console.log(
      `  🔄 ${id}: ${reading.value ?? '—'} @ ${reading.asOf ?? '—'} [${reading.status}]${reading.percentile10y !== undefined ? ` pct10y=${(reading.percentile10y * 100).toFixed(0)}%` : ''}`,
    );
  }

  // 4. Patch + write the snapshot family (the main rung wrote the day's
  // archive 10 minutes ago — the patch touches only the live keys).
  const patched = patchInsightsSnapshot(storedSnapshot, patchedReadings, nowIso);
  await opts.store.putSnapshot(patched);
  console.log('  ✍ insights:snapshot (patched)');
  const hiddenIds = opts.hiddenPublicIds ?? new Set<string>();
  await opts.store.putPublicSnapshot(projectSnapshotToPublic(patched, hiddenIds));
  console.log('  ✍ insights:snapshot-public (patched)');

  // 5. Update the stage so the 04:25/04:40 history phases write the fresh
  // series (the phases read the stage, never the snapshot). 2026-10-26
  // wave-3 fix: a SINGLE-point series stages too (the gate was > 1) — the
  // CFTC file's first weekly point must reach the stage so (a) the
  // bootstrap-missing check clears and (b) next week's merge has a base;
  // buildHistoryFile's own minPoints floor still keeps a 1-point history
  // from being written.
  if (opts.stageKv !== undefined) {
    const base = (await readStage(opts.stageKv)) ?? { v: STAGE_VERSION, writtenAt: nowIso, series: {} };
    for (const [id, idSeries] of Object.entries(series)) {
      const trimmed = trimForStage(idSeries, todayMs);
      if (trimmed.length > 0) base.series[id] = trimmed;
    }
    base.writtenAt = nowIso;
    await putStage(opts.stageKv, base);
    console.log(`  ✍ ${INSIGHTS_STAGE_KEY} (updated ${Object.keys(series).join(', ')})`);
  }

  // 6. Append the rung's report rows to insights:status (the /admin panel
  // + the sweep gate see the honest fetch outcomes).
  try {
    const status = await opts.store.getStatus();
    if (status !== undefined) {
      const merged = [...status.sources, ...collected.reports];
      await opts.store.putStatus({ ...status, sources: merged, generatedAt: nowIso });
      console.log(`  ✍ insights:status (+${collected.reports.length} rung-2 rows)`);
    }
  } catch (err) {
    console.warn(`  ⚠ insights:status append failed: ${errMessage(err)}`);
  }

  return { series, reports: collected.reports, plan, patched: true };
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
  /** 'daily' — every day/week-cadence id (the Node venue / one-shot shape);
   * 'daily-a'/'daily-b' — the Worker's SPLIT daily rungs (2026-10-26 wave-3:
   * the gap-audit ids grew the daily set past the free plan's per-invocation
   * CPU ceiling — the 04:25 rung died exceededCpu with zero writes, the
   * M1† rung-split follow-up at last applied; each half ≈ half the builds
   * + stringifies + writes); 'periodic' — monthly/quarterly (read-compare). */
  phase: 'daily' | 'daily-a' | 'daily-b' | 'periodic';
  /** Clock injection (tests). */
  now?: Date;
}

/** The ids a phase covers — derived FROM the definitions (self-maintaining). */
export function historyPhaseIds(phase: 'daily' | 'daily-a' | 'daily-b' | 'periodic'): IndicatorId[] {
  const daily = DEFINITIONS.filter((d) => d.cadence === 'daily' || d.cadence === 'weekly').map((d) => d.id);
  if (phase === 'daily-a') return daily.slice(0, Math.ceil(daily.length / 2));
  if (phase === 'daily-b') return daily.slice(Math.ceil(daily.length / 2));
  if (phase === 'daily') return daily;
  return DEFINITIONS.filter(
    (d) => d.cadence === 'monthly' || d.cadence === 'quarterly' || d.cadence === 'per-change' || d.cadence === 'manual',
  ).map((d) => d.id);
}

/**
 * One history rung: read the stage, rebuild the history files for the
 * phase's ids, write them. The DAILY phase writes unconditionally (the
 * subrequest budget: ~35 writes, no reads — content is idempotent — and,
 * on the Worker, SPLIT across two minutes so each invocation stays under
 * the CPU ceiling); the PERIODIC phase read-compares (reads are cheap,
 * writes stay rare).
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
