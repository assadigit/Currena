/**
 * narrator-cron.ts — M4 of the Layer-2 narrator build (spec §4 + §9): the
 * narrator's generation rung inside the existing minute cron (a NEW rung,
 * NOT a new cron trigger — D-30). Fires hourly at :50 UTC (NARRATOR_CRON_MINUTE),
 * clear of every other rung (the :13 prices rung, the :15 Frankfurter
 * quarter, the 04:10..04:40 ingest rungs, the :40 watchdog, the :10 sweeps).
 *
 * Per tick (D-38's verified budget: ~24 ticks/day):
 *   1. Read the four documents — the PUBLIC PROJECTION snapshot (the page's
 *      public face: whatever the site mode, the narrative can never leak a
 *      private-only reading — D-38), the markets + fx documents, and the
 *      stored narrative doc. 4 KV reads.
 *   2. For each unit (4 sections in page order + the overall): build the
 *      M1 state, compute stateHash. A unit needs work when its hash changed
 *      OR its text is older than 24 h OR the prompt version moved (spec §4).
 *      The stored doc's per-unit hashes ARE the pending list — no extra KV key.
 *   3. Process at most 3 units per tick (D-30's cap); the rest continue on
 *      the next hour's tick.
 *   4. A unit's text: the model (call type A) when NARRATOR_ENABLED=true
 *      AND the key exists — validate (V1–V11), ONE regeneration with the
 *      failed check names appended, then the template (spec §7) — else the
 *      template directly (no key / kill switch / api failure). Part 3
 *      (news, call type B) only when NARRATOR_WEB_CONTEXT=true and under
 *      the daily cap; a failed W check simply omits it (no retry).
 *   5. ONE KV write for the narrative doc (only when a unit changed) + ONE
 *      for the stats. ~24 reads + ≤50 writes/day total — inside every
 *      free-plan envelope with orders of magnitude of headroom.
 *
 * Fault-isolated like every rung: a throw is caught by the caller
 * (cron.ts) and logged; nothing else in the invocation is affected.
 */

import {
  GeminiClient,
  CloudflareAiClient,
  CLOUDFLARE_DEFAULT_MODEL,
  PROMPT_VERSION,
  buildNarratorUserMessage,
  buildNewsUserMessage,
  buildOverallNarrationState,
  buildSectionNarrationState,
  getNarratorVocabulary,
  newsSystemPrompt,
  sanitizeStateNarrative,
  stateHashOf,
  systemPromptFor,
  templateNarrative,
  validateNewsNote,
  validateStateNarrative,
  type NarratorModelClient,
  type NarratorProvider,
  type NarratorSectionId,
  type NarratorUnit,
  type NarratorVocabulary,
  type OverallNarrationState,
  type SectionNarrationSnapshot,
  type SectionNarrationState,
} from '@currena/insights/narrator';
import { stateIdsOf } from '@currena/insights/narrator';
import type { FxSnapshot, InsightsSnapshot, MarketsSnapshot, TicSnapshot } from '@currena/core';
import { INSIGHTS_SNAPSHOT_PUBLIC_KEY } from '@currena/insights/store';
import { FX_KV_KEY } from '@currena/insights/fx';
import { MARKETS_KV_KEY } from '@currena/insights/markets';
import { TIC_KV_KEY } from '@currena/insights/tic';
import type { Bindings } from './index';
import { readNarratorStatsDay, recordNarratorStats, type StatsDelta } from './narrator-stats';

/** The minute (UTC) of every hour the narrator rung fires. */
export const NARRATOR_CRON_MINUTE = 50;

/** The one KV key the served narrative document lives under (spec §9). */
export const NARRATIVE_KV_KEY = 'insights:narrative:v1';

/** At most this many model calls per tick (D-30: the subrequest-safe batch). */
export const NARRATOR_MAX_CALLS_PER_TICK = 3;

/** A unit's text older than this regenerates even with an unchanged hash (spec §4). */
const REGENERATE_AFTER_MS = 24 * 3_600_000;

/* ------------------------------------------------------------------ *
 * The stored document (spec §9's shape)
 * ------------------------------------------------------------------ */

export interface NarrativeUnit {
  stateHash: string;
  en: string;
  fa: string;
  source: 'ai' | 'template';
  generatedAt: string;
  news?: {
    en: string;
    fa: string;
    sources: { title: string; url: string }[];
    generatedAt: string;
    /** Google's required display element (the search suggestions HTML), when it came back. */
    requiredDisplay?: string;
  };
}

export interface NarrativeDoc {
  promptVersion: number;
  model: string;
  generatedAt: string;
  dataAsOf: string | null;
  overall: NarrativeUnit;
  sections: Record<string, NarrativeUnit>;
}

/** Parse the stored doc defensively (absent/poisoned → null: a fresh cycle). */
export function parseNarrativeDoc(raw: string | null): NarrativeDoc | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as NarrativeDoc;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.promptVersion === 'number' &&
      typeof parsed.overall === 'object' &&
      parsed.overall !== null &&
      typeof parsed.sections === 'object'
    ) {
      return parsed;
    }
  } catch {
    // poisoned → treat as absent
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Env flag resolution (strings from wrangler vars; conservative defaults)
 * ------------------------------------------------------------------ */

export interface NarratorFlags {
  enabled: boolean;
  webContext: boolean;
  webDailyCap: number;
  model: string;
  hasKey: boolean;
  /** D-41 — the model provider ('gemini' default | 'cloudflare'). */
  provider: NarratorProvider;
}

export function narratorFlagsOf(env: Bindings): NarratorFlags {
  const provider: NarratorProvider =
    env.NARRATOR_PROVIDER === 'cloudflare' ? 'cloudflare' : 'gemini';
  const hasKey =
    provider === 'cloudflare'
      ? env.AI !== undefined
      : typeof env.GEMINI_API_KEY === 'string' && env.GEMINI_API_KEY !== '';
  // D-41 §5: workers-ai has no google-search grounding → Part 3 is unavailable
  // on the cloudflare path. Clamp webContext to false so generateNews is never
  // called (the client's callNewsNote also returns the not-available outcome
  // defensively, but this avoids the stats noise + the daily-cap read).
  const webContext =
    provider === 'cloudflare' ? false : env.NARRATOR_WEB_CONTEXT === 'true';
  // D-41 §3: on the cloudflare path, a NARRATOR_MODEL that is unset OR still
  // the inherited gemini default ('gemini-3.5-flash-lite') is NOT a valid
  // Workers AI model id — fall back to CLOUDFLARE_DEFAULT_MODEL. An explicit
  // '@cf/...' override is honoured. (Without this, flipping provider=cloudflare
  // while NARRATOR_MODEL still carries the gemini default would call
  // env.AI.run('gemini-3.5-flash-lite', …) — an invalid model id → every call
  // fails + the template fallback kicks in for every unit.)
  const model =
    provider === 'cloudflare'
      ? !env.NARRATOR_MODEL || env.NARRATOR_MODEL === 'gemini-3.5-flash-lite'
        ? CLOUDFLARE_DEFAULT_MODEL
        : env.NARRATOR_MODEL
      : env.NARRATOR_MODEL || 'gemini-3.5-flash-lite';
  return {
    enabled: env.NARRATOR_ENABLED === 'true',
    webContext,
    webDailyCap: Number(env.NARRATOR_WEB_DAILY_CAP ?? '20') || 20,
    model,
    hasKey,
    provider,
  };
}

/* ------------------------------------------------------------------ *
 * The rung
 * ------------------------------------------------------------------ */

/** One unit's identity + fresh state. */
interface UnitWork {
  id: 'overall' | NarratorSectionId;
  state: SectionNarrationState | OverallNarrationState;
  hash: string;
  unit: NarratorUnit;
}

export interface NarratorRungResult {
  evaluated: number;
  skippedUnchanged: number;
  regenerated: number;
  aiValid: number;
  templateUsed: number;
  apiErrors: number;
  newsAttempted: number;
  newsValid: number;
  wrote: boolean;
}

/**
 * The hourly narrator rung (exported for tests; cron.ts calls it at :50).
 * Never throws — every failure degrades to the template path and the stats.
 */
export async function runScheduledNarrator(
  env: Bindings,
  deps: { now?: Date; fetchImpl?: typeof fetch } = {},
): Promise<NarratorRungResult> {
  const now = deps.now ?? new Date();
  const nowIso = now.toISOString();
  const flags = narratorFlagsOf(env);
  const stats: StatsDelta = { runs: 1 };
  const result: NarratorRungResult = {
    evaluated: 0,
    skippedUnchanged: 0,
    regenerated: 0,
    aiValid: 0,
    templateUsed: 0,
    apiErrors: 0,
    newsAttempted: 0,
    newsValid: 0,
    wrote: false,
  };

  // 1. The four documents. The PUBLIC PROJECTION is the input by design
  //    (D-38): the narrative can never name a private-only reading.
  const [snapshotRaw, marketsRaw, fxRaw, narrativeRaw, ticRaw] = await Promise.all([
    env.RATES.get(INSIGHTS_SNAPSHOT_PUBLIC_KEY),
    env.RATES.get(MARKETS_KV_KEY),
    env.RATES.get(FX_KV_KEY),
    env.RATES.get(NARRATIVE_KV_KEY),
    // gap-closure S2-M2.5: the foreign-holders document (the GLOBAL
    // section's tic facts). A missing/poisoned key degrades calmly to
    // no-tic-facts — the narrative renders without them.
    env.RATES.get(TIC_KV_KEY),
  ]);
  if (snapshotRaw === null) {
    // No public projection yet (a fresh deploy before the first ingest
    // writes it): log honestly, count the run, nothing to do.
    console.log('[narrator] no public projection snapshot — nothing to narrate yet');
    await recordNarratorStats(env, now, stats).catch(() => undefined);
    return result;
  }
  const insights = JSON.parse(snapshotRaw) as InsightsSnapshot;
  const markets = marketsRaw === null ? null : (JSON.parse(marketsRaw) as MarketsSnapshot);
  const fx = fxRaw === null ? null : (JSON.parse(fxRaw) as FxSnapshot);
  // The tic document is zod-validated on ingest; the narrator trusts the
  // stored shape (the same trust it extends to the snapshot/markets/fx) —
  // a poisoned key would fail JSON.parse and land in the catch below.
  const tic = ticRaw === null ? null : (JSON.parse(ticRaw) as TicSnapshot);
  const snapshot: SectionNarrationSnapshot = {
    insights,
    ...(fx !== null ? { fx } : {}),
    ...(markets !== null ? { markets } : {}),
    ...(tic !== null ? { tic } : {}),
  };
  const stored = parseNarrativeDoc(narrativeRaw);

  // 2. Build every unit's fresh state + hash; decide what needs work.
  const units: UnitWork[] = [];
  const overallState = buildOverallNarrationState(snapshot, nowIso);
  units.push({ id: 'overall', state: overallState, hash: stateHashOf(overallState), unit: { kind: 'overall' } });
  for (const section of ['global', 'australia', 'world-markets', 'world-currencies'] as const) {
    const feedMissing =
      (section === 'world-markets' && markets === null) || (section === 'world-currencies' && fx === null);
    if (feedMissing) continue;
    const state = buildSectionNarrationState(snapshot, section, nowIso);
    units.push({ id: section, state, hash: stateHashOf(state), unit: { kind: 'section', section } });
  }

  const storedUnit = (id: UnitWork['id']): NarrativeUnit | undefined =>
    stored === null ? undefined : id === 'overall' ? stored.overall : stored.sections[id];

  const needsWork = (u: UnitWork): boolean => {
    const existing = storedUnit(u.id);
    if (existing === undefined) return true;
    if (stored !== null && stored.promptVersion !== PROMPT_VERSION) return true;
    if (existing.stateHash !== u.hash) return true;
    return now.getTime() - Date.parse(existing.generatedAt) > REGENERATE_AFTER_MS;
  };

  const pending = units.filter(needsWork);
  result.evaluated = units.length;
  result.skippedUnchanged = units.length - pending.length;
  stats.skippedUnchanged = result.skippedUnchanged;

  if (pending.length === 0) {
    console.log(`[narrator] ${units.length} units up to date — no write`);
    await recordNarratorStats(env, now, stats).catch(() => undefined);
    return result;
  }

  // 3. The capped batch (page order; the rest continue next tick).
  const batch = pending.slice(0, NARRATOR_MAX_CALLS_PER_TICK);
  const client: NarratorModelClient | null =
    flags.enabled && flags.hasKey
      ? flags.provider === 'cloudflare'
        ? // D-41: the Workers AI binding — no token, no fetch, no region risk.
          new CloudflareAiClient({ ai: env.AI!, model: flags.model })
        : new GeminiClient({
            apiKey: env.GEMINI_API_KEY!,
            model: flags.model,
            ...(deps.fetchImpl !== undefined ? { fetchImpl: deps.fetchImpl } : {}),
          })
      : null;

  // The doc being written: start from the stored one (unchanged units keep
  // their texts), or a fresh skeleton.
  const doc: NarrativeDoc =
    stored !== null
      ? stored
      : {
          promptVersion: PROMPT_VERSION,
          model: flags.model,
          generatedAt: nowIso,
          dataAsOf: null,
          overall: { stateHash: '', en: '', fa: '', source: 'template', generatedAt: nowIso },
          sections: {},
        };
  doc.promptVersion = PROMPT_VERSION;
  doc.model = flags.model;

  let modelCalls = 0;
  let anythingChanged = false;

  for (const work of batch) {
    const existing = storedUnit(work.id);
    const generation = await generateUnit({
      client,
      flags,
      env,
      work,
      now,
      stats,
      result,
      newsBudget: () => modelCalls < NARRATOR_MAX_CALLS_PER_TICK,
      onModelCall: () => {
        modelCalls += 1;
      },
    });
    if (work.id === 'overall') {
      doc.overall = generation.unit;
    } else {
      doc.sections[work.id] = generation.unit;
    }
    if (
      existing === undefined ||
      existing.stateHash !== generation.unit.stateHash ||
      existing.source !== generation.unit.source ||
      existing.en !== generation.unit.en ||
      existing.fa !== generation.unit.fa ||
      (generation.news !== undefined) !== (existing.news !== undefined)
    ) {
      anythingChanged = true;
    }
    result.regenerated += 1;
  }

  // 4. ONE write for the doc (only when something changed), one for stats.
  if (anythingChanged || stored === null) {
    doc.generatedAt = nowIso;
    doc.dataAsOf = overallState.dataAsOf.newest;
    await env.RATES.put(NARRATIVE_KV_KEY, JSON.stringify(doc));
    result.wrote = true;
    console.log(
      `[narrator] regenerated ${batch.length} unit(s)${pending.length > batch.length ? `, ${pending.length - batch.length} pending next tick` : ''} — doc written`,
    );
  } else {
    console.log('[narrator] batch produced no changes — no write');
  }

  await recordNarratorStats(env, now, stats).catch((err: unknown) => {
    console.warn('[narrator] stats write failed:', err instanceof Error ? err.message : err);
  });
  return result;
}

/* ------------------------------------------------------------------ *
 * One unit's generation (model → validate → retry once → template)
 * ------------------------------------------------------------------ */

interface UnitGeneration {
  unit: NarrativeUnit;
  news?: NonNullable<NarrativeUnit['news']>;
}

/** The vocabulary subset for a state's ids (the prompt + validators share the derivation). */
function vocabularyForState(state: SectionNarrationState | OverallNarrationState): NarratorVocabulary {
  return getNarratorVocabulary(stateIdsOf(state), 'en');
}

async function generateUnit(args: {
  client: NarratorModelClient | null;
  flags: NarratorFlags;
  env: Bindings;
  work: UnitWork;
  now: Date;
  stats: StatsDelta;
  result: NarratorRungResult;
  newsBudget: () => boolean;
  onModelCall: () => void;
}): Promise<UnitGeneration> {
  const { client, flags, env, work, now, stats, result } = args;

  // The template path (no key, kill switch, or the fallback after failures).
  const template = (): UnitGeneration => {
    stats.templateUsed = (stats.templateUsed ?? 0) + 1;
    result.templateUsed += 1;
    return {
      unit: {
        stateHash: work.hash,
        en: templateNarrative(work.state, work.unit, 'en'),
        fa: templateNarrative(work.state, work.unit, 'fa'),
        source: 'template',
        generatedAt: now.toISOString(),
      },
    };
  };

  if (client === null) return template();

  const userMessage = buildNarratorUserMessage({
    unit: work.unit,
    state: work.state,
    vocabulary: vocabularyForState(work.state),
  });

  // Attempt 1 + the spec's single regeneration with the failed checks + their
  // details named (the detail tells the model WHAT to fix, e.g. "V11: only 2
  // sections represented (need 3); covered: global, australia" → the model
  // knows to add world-markets/world-currencies readings on the retry).
  let lastFailures: { check: string; detail: string }[] = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const failureSummary = lastFailures.map((f) => `${f.check}: ${f.detail}`).join('; ');
    const message =
      attempt === 0
        ? userMessage
        : `${userMessage}\n\nYOUR PREVIOUS ATTEMPT FAILED THESE CHECKS: ${failureSummary}. Rewrite the answer so it passes them.`;
    args.onModelCall();
    const outcome = await client.callStateNarrative({
      systemInstruction: systemPromptFor(work.unit),
      userMessage: message,
    });
    if (!outcome.ok) {
      // api error → template (the retry ladder already ran inside the client)
      stats.apiErrors = [...(stats.apiErrors ?? []), outcome.error.kind];
      result.apiErrors += 1;
      break;
    }
    // PROMPT_VERSION 5: sanitize the model's output before validation —
    // strip the spurious "some data is out of date" clause when the state
    // lists no excluded items (V10 false positive), and remove stray CJK
    // characters the model occasionally hallucinates in Farsi (V9 fail).
    // Pure; never adds content; only fixes the model's non-deterministic
    // mistakes so the rich multi-reading AI paragraph passes V1–V11.
    const sanitized = sanitizeStateNarrative(outcome.value, work.state);
    const failures = validateStateNarrative({ text: sanitized, unit: work.unit, state: work.state });
    if (failures.length === 0) {
      stats.aiValid = (stats.aiValid ?? 0) + 1;
      result.aiValid += 1;
      // Part 3 (news, call type B) — never mixed with the state call; only
      // for sections, only when the flag + the daily cap + the tick budget
      // allow (D-29: ships DISABLED; exercised by tests + the live eval).
      let news: UnitGeneration['news'];
      if (work.unit.kind === 'section' && flags.webContext && args.newsBudget()) {
        news = await generateNews({ client, flags, env, work, now, stats, result, onModelCall: args.onModelCall });
      }
      return {
        unit: {
          stateHash: work.hash,
          en: sanitized.en,
          fa: sanitized.fa,
          source: 'ai',
          generatedAt: now.toISOString(),
        },
        ...(news !== undefined ? { news } : {}),
      };
    }
    // V11b soft-accept: if the ONLY failures are V11b (multi-section coverage),
    // accept the AI output anyway on the SECOND attempt. The rich global+australia
    // AI paragraph is better than the template fallback (which names just 1 alert).
    // The prompt (v8) is the primary enforcement for multi-section coverage; V11b
    // is logged in the stats for monitoring but doesn't cause template fallback.
    if (attempt === 1 && failures.every((f) => f.check === 'V11b')) {
      stats.aiValid = (stats.aiValid ?? 0) + 1;
      result.aiValid += 1;
      console.log(`[narrator] ${work.id}: accepted with V11b soft-failure (multi-section coverage) — ${failures.map((f) => f.detail.slice(0, 80)).join('; ')}`);
      return {
        unit: {
          stateHash: work.hash,
          en: sanitized.en,
          fa: sanitized.fa,
          source: 'ai',
          generatedAt: now.toISOString(),
        },
      };
    }
    lastFailures = failures.map((f) => ({ check: f.check, detail: f.detail }));
    stats.aiFailedByCheck = [...(stats.aiFailedByCheck ?? []), ...failures.map((f) => f.check)];
  }
  return template();
}

/** The news note (call type B): generate, W-check, omit on any failure (no retry). */
async function generateNews(args: {
  client: NarratorModelClient;
  flags: NarratorFlags;
  env: Bindings;
  work: UnitWork;
  now: Date;
  stats: StatsDelta;
  result: NarratorRungResult;
  onModelCall: () => void;
}): Promise<UnitGeneration['news']> {
  const { client, flags, env, work, now, stats, result, onModelCall } = args;
  if (work.unit.kind !== 'section') return undefined;

  // The daily cap: today's news attempts from the stats bucket.
  const day = await readNarratorStatsDay(env, now.toISOString().slice(0, 10));
  if (day.newsAttempted >= flags.webDailyCap) {
    stats.newsOverCap = (stats.newsOverCap ?? 0) + 1;
    return undefined;
  }

  stats.newsAttempted = (stats.newsAttempted ?? 0) + 1;
  result.newsAttempted += 1;
  onModelCall();

  const userMessage = buildNewsUserMessage({
    unit: work.unit,
    state: work.state,
    vocabulary: vocabularyForState(work.state),
  });
  const outcome = await client.callNewsNote({
    systemInstruction: newsSystemPrompt(),
    userMessage,
  });
  if (!outcome.ok) {
    stats.apiErrors = [...(stats.apiErrors ?? []), outcome.error.kind];
    result.apiErrors += 1;
    return undefined;
  }
  if (outcome.value.kind === 'none') return undefined;

  const failures = validateNewsNote({
    text: { en: outcome.value.en, fa: outcome.value.fa },
    section: work.unit.section,
    state: work.state as SectionNarrationState,
    sources: outcome.value.sources,
  });
  if (failures.length > 0) {
    stats.newsOmittedByCheck = (stats.newsOmittedByCheck ?? 0) + 1;
    return undefined;
  }
  stats.newsValid = (stats.newsValid ?? 0) + 1;
  result.newsValid += 1;
  return {
    en: outcome.value.en,
    fa: outcome.value.fa,
    sources: outcome.value.sources,
    generatedAt: now.toISOString(),
    ...(outcome.value.searchSuggestionsHtml !== null ? { requiredDisplay: outcome.value.searchSuggestionsHtml } : {}),
  };
}
