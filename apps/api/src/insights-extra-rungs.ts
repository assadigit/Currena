/**
 * insights-extra-rungs.ts — gap-closure S1-M1.7 capacity scaffolding
 * (docs/gap-closure/S1-foundation-and-trust.md M1.7).
 *
 * The generic rung3 (04:30 UTC) and rung4 (04:35 UTC): pluggable
 * "extra source" rungs with their OWN 50-subrequest budget, their OWN
 * status record and per-source failure isolation — one failing source
 * never affects the others, the main snapshot, or the cron invocation.
 * S2–S6 register sources here (the Treasury TIC tables first) instead of
 * touching the full 04:10 main rung (47/50 subrequests — adding fetches
 * there is forbidden by the free-tier budget table).
 *
 * Scheduling: NO new cron trigger (the account's free 5-cron budget is
 * full) — the minute-cron's hour+minute gates do the scheduling, exactly
 * like every other ingest rung. The gates: 04:30 → rung3, 04:35 → rung4;
 * the ever-green rates ladder idles for those minutes (cron.ts already
 * empties the sources list on any ingest rung).
 *
 * Day-gating (the rung2 plan's first-of-month / Saturday discipline,
 * exported for the extra sources): a monthly source runs on the first of
 * the month, a weekly one on its weekday — and the 10:10/20:10 sweeps
 * HEAL any source whose last recorded row is a failure, regardless of the
 * day gate (a monthly fetch that failed must not wait a month).
 */

import type { Bindings } from './index';
import { runTicIngest, KvTicStore } from '@currena/insights/tic';
import {
  runInsightsRung4Phase,
  runInsightsCreditPhase,
  runInsightsPortwatchPhase,
  KvInsightsStore,
  HIDDEN_PUBLIC_IDS,
} from '@currena/insights/ingest';

/** The UTC minute (inside INGEST_CRON_HOUR) that fires rung3. */
export const EXTRA_RUNG3_MINUTE = 30;
/** The UTC minute (inside INGEST_CRON_HOUR) that fires rung4. */
export const EXTRA_RUNG4_MINUTE = 35;

/** The free plan's per-invocation subrequest ceiling (the rung budget). */
export const EXTRA_RUNG_SUBREQUEST_CEILING = 50;

/**
 * gap-closure S2-M2.2 — the TIC release-aware day gate: run DAILY from
 * the 15th to the 25th of each month (the SLT publishes mid-month — Aug
 * 2026 landed 2026-10-16; the daily window catches the new data month
 * within a day, then the idempotent write makes the remaining days a
 * cheap re-check), otherwise once a week on Saturdays (the CFTC gate's
 * discipline). The 10:10/20:10 sweeps HEAL a failed fetch within hours
 * with this gate BYPASSED.
 */
export function ticReleaseAwareGate(now: Date): boolean {
  const day = now.getUTCDate();
  return (day >= 15 && day <= 25) || now.getUTCDay() === 6;
}

/** The failure kinds that arm the sweep heal (mirrors sweepShouldFire). */
const HEALABLE_KINDS: ReadonlySet<string> = new Set(['failed', 'blocked', 'format-changed']);

/** Narrow a report row's optional kind onto the outcome's kind (never
 * undefined — the honest default is 'failed'). */
function reportKind(kind: 'fetched' | 'blocked' | 'format-changed' | 'failed' | 'disabled' | 'cross-check' | undefined): 'failed' | 'blocked' | 'format-changed' {
  return kind === 'blocked' || kind === 'format-changed' ? kind : 'failed';
}

/** One source's run result — recorded verbatim in the rung's status. */
export type ExtraSourceOutcome =
  | { id: string; ok: true; note?: string }
  | { id: string; ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

/** `run`'s return shape — the outcome minus the id (distributive: the
 * failure branch keeps its `kind`). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type ExtraSourceRunResult = DistributiveOmit<ExtraSourceOutcome, 'id'>;

/** A pluggable extra source (S2+ registers these; the list starts EMPTY). */
export interface ExtraSourceDef {
  /** The status row id (e.g. 'tic-table5'). */
  id: string;
  /** Which rung carries the source (3 = 04:30, 4 = 04:35). */
  rung: 3 | 4;
  /**
   * The day gate — the rung2 plan's discipline: firstOfMonthGate() for a
   * monthly file, weekdayGate(6) for a Saturday one, dailyGate() otherwise.
   */
  gate: (now: Date) => boolean;
  /**
   * The subrequests this source promises (fetches + its own KV ops). The
   * rung REFUSES to start a source whose budget would cross the ceiling —
   * registering more than the ceiling is a loud configuration error, never
   * a silent runtime death.
   */
  budget: number;
  /** Fetch + parse + write. MUST NOT throw past its budget; errors are
   * caught and recorded (failure isolation). */
  run: (env: Bindings, now: Date) => Promise<ExtraSourceRunResult>;
}

/**
 * The registry — gap-closure S2-M2.2 lands the first source: the Treasury
 * TIC SLT tables (the owner's top-priority feature). Budget 4 = the TWO
 * file fetches (each 8–10 s under the honest 12 s single-attempt policy)
 * + the idempotence read + the write. The two fetches share this rung
 * with NOTHING else (the S2 session rule: they never share an invocation
 * with anything heavy).
 *
 * gap-closure S3-M3.2 (2026-11-01) registers the second: the S3 FRED
 * liquidity/funding/macro groups — the 'fred-s3' rung4 source (the 04:35
 * slot the S1-M1.7 scaffolding reserved). TWO fredgraph ZIP fetches + the
 * stage read (the sofr/walcl legs) + the snapshot read + the status read
 * + the patch writes (snapshot, public, stage, status) + the 14 OWN
 * history writes (the M3.2 liquidity six + the M3.4 macro six + the M3.5
 * deficit pair) = 23 live; declared budget 24 (rounding headroom). Day
 * gate: daily — the groups carry daily series (term premium, RRP, IORB),
 * and the 10:10/20:10 sweeps heal a failed day within hours (gate
 * bypassed). The M3.5 AUCTION four never touch this phase (Node-venue
 * only — the Worker cannot reach the FiscalData host).
 *
 * gap-closure S3-M3.3 (2026-11-01) registers the THIRD and FOURTH: the
 * credit-stress pair, in TWO sources so their failure domains stay
 * isolated (different hosts than FRED, and different rhythms from each
 * other). 'frb-ebp' — the Fed Board's monthly EBP file, re-checked
 * Saturdays (the CFTC gate's discipline; a monthly file needs no daily
 * fetch, and the sweeps heal failures within hours, gate bypassed).
 * 'ofr-fsi' — the OFR's daily FSI file, daily gate. Each budget 10:
 * 1 fetch + 1 snapshot read + 1 status read + 4 patch writes + 1 history
 * write = 8, declared with headroom. The rung4 registry total on the day
 * every gate fires: 1 status + 24 + 10 + 10 = 45 ≤ 50.
 */
export const EXTRA_SOURCES: readonly ExtraSourceDef[] = [
  {
    id: 'tic-slt',
    rung: 3,
    gate: ticReleaseAwareGate,
    budget: 4,
    run: async (env: Bindings) => (await runTicIngest(new KvTicStore(env.RATES))).outcome,
  },
  {
    // gap-closure S4-M4.3 (2026-11-01): the IMF PortWatch chokepoints — the
    // daily transit estimates for the five shipping chokepoints. Rides
    // RUNG3 (NOT rung4: that rung carries fred-s3 + the credit pair + the
    // declared 45/50 on all-gates days; rung3 has its own 50-subrequest
    // budget and only the TIC's 4 — the session plan's explicit routing).
    // DAILY gate (the provider refreshes daily with a ~7-day lag; the
    // 10:10/20:10 sweeps heal a failed day within hours, gate bypassed).
    // Budget 18: the daily run is 1 fetch + 5 reads + 10 writes = 16; the
    // BOOTSTRAP path (no stored combined history, or older than 45 days)
    // adds ≤2 more pages of the same single-batched query — 18 covers it.
    // The fetch pins its own 30 s timeout (services9.arcgis.com answered
    // 12.5 s first byte from Worker egress in the S1 probe — the TIC
    // precedent) with a politeness pause between pages AND one backed-off
    // retry for the host's own transient 400-Invalid-URL slow-start class
    // (the M4.1 back-off-and-retry prescription — NOT a block; every other
    // failure stays single-attempt, F-11; live-observed 2026-11-01: the
    // first GHA run died to it before the retry landed).
    id: 'portwatch',
    rung: 3,
    gate: dailyGate(),
    budget: 18,
    run: async (env: Bindings, now: Date) => {
      const result = await runInsightsPortwatchPhase({
        store: new KvInsightsStore(env.RATES),
        kv: env.RATES,
        mode: 'scheduled',
        hiddenPublicIds: HIDDEN_PUBLIC_IDS,
        now,
      });
      const failed = result.reports.filter((r) => !r.ok);
      if (failed.length > 0) {
        return {
          ok: false as const,
          kind: reportKind(failed[0]!.kind),
          note: `PortWatch fetch failed: ${failed.map((r) => r.detail).join(' | ')}`,
        };
      }
      return {
        ok: true as const,
        ...(result.patched
          ? {
              note:
                `patched ${Object.keys(result.series).join(', ')} · raw days ${Object.entries(result.rawDays)
                  .map(([pid, n]) => `${pid}:${n}`)
                  .join(' ')} · histories ${result.histories.written} written`,
            }
          : { note: 'nothing to patch (no rows parsed or no snapshot)' }),
      };
    },
  },
  {
    id: 'fred-s3',
    rung: 4,
    gate: dailyGate(),
    budget: 24,
    run: async (env: Bindings, now: Date) => {
      const result = await runInsightsRung4Phase({
        store: new KvInsightsStore(env.RATES),
        kv: env.RATES,
        mode: 'scheduled',
        hiddenPublicIds: HIDDEN_PUBLIC_IDS,
        now,
      });
      const failed = result.reports.filter((r) => !r.ok);
      if (failed.length === result.reports.length && failed.length > 0) {
        // EVERY group failed (the FRED-edge blip class): a failed row so the
        // sweeps heal it within hours. A partial failure still patched what
        // it could — ok, with the honest note.
        return {
          ok: false,
          kind: 'failed' as const,
          note: `both S3 groups failed: ${failed.map((r) => r.detail).join(' | ')}`,
        };
      }
      return {
        ok: true,
        ...(result.patched
          ? { note: `patched ${Object.keys(result.series).join(', ')} · histories ${result.histories.written} written` }
          : { note: 'nothing to patch (no group parsed)' }),
      };
    },
  },
  {
    // gap-closure S3-M3.3: the Fed Board EBP file (monthly, Saturday
    // re-check — the CFTC gate's discipline; the sweeps heal failures).
    id: 'frb-ebp',
    rung: 4,
    gate: weekdayGate(6),
    budget: 10,
    run: async (env: Bindings, now: Date) => {
      const result = await runInsightsCreditPhase({
        files: ['ebp'],
        store: new KvInsightsStore(env.RATES),
        kv: env.RATES,
        mode: 'scheduled',
        hiddenPublicIds: HIDDEN_PUBLIC_IDS,
        now,
      });
      const failed = result.reports.filter((r) => !r.ok);
      if (failed.length > 0) {
        return { ok: false, kind: reportKind(failed[0]!.kind), note: `EBP file failed: ${failed.map((r) => r.detail).join(' | ')}` };
      }
      return {
        ok: true,
        ...(result.patched
          ? { note: `ebp patched · history written` }
          : { note: 'nothing to patch (no file parsed or no snapshot yet)' }),
      };
    },
  },
  {
    // gap-closure S3-M3.3: the OFR FSI aggregate file (daily).
    id: 'ofr-fsi',
    rung: 4,
    gate: dailyGate(),
    budget: 10,
    run: async (env: Bindings, now: Date) => {
      const result = await runInsightsCreditPhase({
        files: ['ofr'],
        store: new KvInsightsStore(env.RATES),
        kv: env.RATES,
        mode: 'scheduled',
        hiddenPublicIds: HIDDEN_PUBLIC_IDS,
        now,
      });
      const failed = result.reports.filter((r) => !r.ok);
      if (failed.length > 0) {
        return { ok: false, kind: reportKind(failed[0]!.kind), note: `OFR FSI file failed: ${failed.map((r) => r.detail).join(' | ')}` };
      }
      return {
        ok: true,
        ...(result.patched
          ? { note: `ofr-fsi patched · history written` }
          : { note: 'nothing to patch (no file parsed or no snapshot yet)' }),
      };
    },
  },
];

/* ------------------------------------------------------------------ *
 * Day-gate helpers (the rung2 plan's first-of-month / Saturday rules).
 * ------------------------------------------------------------------ */

/** True on the first day of the UTC month (the monthly trio's gate). */
export function firstOfMonthGate(now: Date): boolean {
  return now.getUTCDate() === 1;
}

/** True on the given UTC weekday (0=Sun … 6=Sat — the CFTC Saturday gate). */
export function weekdayGate(weekday: number): (now: Date) => boolean {
  return (now: Date) => now.getUTCDay() === weekday;
}

/** Always true (a daily source). */
export function dailyGate(): (now: Date) => boolean {
  return () => true;
}

/* ------------------------------------------------------------------ *
 * The status record (ONE KV write per rung, its own key).
 * ------------------------------------------------------------------ */

export interface ExtraRungStatus {
  generatedAt: string;
  rung: 3 | 4;
  /** The rows that ran (due + healed), in registry order. */
  rows: ExtraSourceOutcome[];
  /** The rung's declared-budget arithmetic (the honest ceiling record). */
  budget: { ceiling: number; used: number; refused: string[] };
}

export function extraRungStatusKey(rung: 3 | 4): string {
  return `insights:extra-status:rung${rung}`;
}

/** The minimal KV surface the rung needs (env.RATES satisfies it; tests mock it). */
export interface ExtraRungKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface ExtraRungOptions {
  /** Clock injection (tests). */
  now?: Date;
  /** Heal mode (the sweep): run sources whose last row failed, ignoring the day gate. */
  heal?: boolean;
  /** Force mode (the manual /internal lever): run EVERY registry source
   * for the rung, day gates ignored — the owner-triggered equivalent of
   * the sweep heal, for post-deploy verification of a new source. */
  force?: boolean;
  /** KV override (tests); default env.RATES. */
  kv?: ExtraRungKv;
  /** Registry override (tests / future manual dispatch); default EXTRA_SOURCES. */
  sources?: readonly ExtraSourceDef[];
}

/**
 * Run one extra rung. Failure isolation: every source's error is caught
 * and recorded as { ok:false, kind:'failed' } — the rung itself always
 * completes and always writes its status record (1 KV write; +1 read in
 * heal mode). An empty registry writes the status and exits: the live
 * proof the machinery runs (S1-M1.7's acceptance).
 */
export async function runExtraRung(
  env: Bindings,
  rung: 3 | 4,
  opts: ExtraRungOptions = {},
): Promise<ExtraRungStatus> {
  const now = opts.now ?? new Date();
  const kv = opts.kv ?? env.RATES;
  const registry = (opts.sources ?? EXTRA_SOURCES).filter((s) => s.rung === rung);
  const due = opts.force === true ? registry : registry.filter((s) => s.gate(now));
  let healed: ExtraSourceDef[] = [];
  if (opts.heal) {
    const prev = await readStatus(kv, rung);
    const failedIds = new Set(
      (prev?.rows ?? []).filter((r) => !r.ok && HEALABLE_KINDS.has(r.kind)).map((r) => r.id),
    );
    healed = registry.filter((s) => failedIds.has(s.id) && !due.includes(s));
  }
  const toRun = [...due, ...healed];

  const rows: ExtraSourceOutcome[] = [];
  const refused: string[] = [];
  let used = 1; // the status write itself
  if (opts.heal) used += 1; // the heal's status read
  for (const source of toRun) {
    if (used + source.budget > EXTRA_RUNG_SUBREQUEST_CEILING) {
      // Loud, recorded, never a silent runtime death.
      refused.push(source.id);
      rows.push({
        id: source.id,
        ok: false,
        kind: 'failed',
        note: `budget refused: ${source.budget} subrequests on top of ${used} would cross the ${EXTRA_RUNG_SUBREQUEST_CEILING} ceiling`,
      });
      continue;
    }
    try {
      const outcome = await source.run(env, now);
      rows.push({ id: source.id, ...outcome });
    } catch (err) {
      rows.push({
        id: source.id,
        ok: false,
        kind: 'failed',
        note: err instanceof Error ? err.message : String(err),
      });
    }
    used += source.budget;
  }
  const status: ExtraRungStatus = {
    generatedAt: now.toISOString(),
    rung,
    rows,
    budget: { ceiling: EXTRA_RUNG_SUBREQUEST_CEILING, used, refused },
  };
  await kv.put(extraRungStatusKey(rung), JSON.stringify(status));
  console.log(
    `[extra-rung${rung}] ${rows.length} source(s) ran · budget ${used}/${EXTRA_RUNG_SUBREQUEST_CEILING}${refused.length > 0 ? ` · REFUSED: ${refused.join(', ')}` : ''} · status written`,
  );
  return status;
}

/** Does either extra rung need the sweep's heal? (2 KV reads.) */
export async function extraRungsNeedHealing(kv: ExtraRungKv): Promise<boolean> {
  for (const rung of [3, 4] as const) {
    const prev = await readStatus(kv, rung);
    if (prev === undefined) continue; // never ran (or poison) — the day gates own it
    if (prev.rows.some((r) => !r.ok && HEALABLE_KINDS.has(r.kind))) return true;
  }
  return false;
}

async function readStatus(kv: ExtraRungKv, rung: 3 | 4): Promise<ExtraRungStatus | undefined> {
  try {
    const raw = await kv.get(extraRungStatusKey(rung));
    if (raw === null) return undefined;
    return JSON.parse(raw) as ExtraRungStatus;
  } catch {
    return undefined; // a poisoned status key must not sink the sweep
  }
}
