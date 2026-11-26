/**
 * The TE briefing Persian translation step — the SIBLING of
 * wgc-watch/src/translate.ts (docs/te-daily-briefing-spec.md §5: "the same
 * engine, the same law"), carrying the WGC translation sitting's every
 * discipline with only the payload's shape fitted to TE's briefing:
 *
 *  - the model: @cf/google/gemma-4-26b-a4b-it — the live bake-off's
 *    selected translator (the credentials sitting's record, AGENTS.md),
 *    called through the worker's [ai] binding (the platform-native path,
 *    no secret surface; the REST adapters of the seed script satisfy the
 *    same structural interface);
 *  - the contract, TE-shaped: the WGC runner's chat contract verbatim
 *    EXCEPT the JSON shape line — TE's briefing is a headline plus one
 *    body, so the strict output contract is {"headline": <string>,
 *    "body": <string>}; the WGC module itself is NOT touched (its own
 *    contract stays exactly as deployed);
 *  - max_tokens: 2048 (the bake-off's uniform envelope — a gpt-oss model's
 *    default 256-token budget vanishes into its reasoning channel);
 *  - both served response shapes read defensively ({response} and
 *    {choices: [{message: {content}}]}), fences/preamble stripped, the
 *    outermost object taken — a serving-side shape change fails closed,
 *    never garbles;
 *  - the identity discipline, per string: an output equal to its source
 *    is a non-translation (the observed llama-4-scout failure mode),
 *    refused, never stored;
 *  - the mirror discipline: a missing or empty headline or body (the
 *    observed gpt-oss empty-channel failure mode) fails the whole run —
 *    no half or padded translations are ever stored;
 *  - the freshness gate: a stored fa row with a matching hash serves
 *    forever; a re-stored English re-opens it; the AI is never called
 *    per-request and never twice for the same content;
 *  - the failure discipline: an AI failure NEVER fails the capture — the
 *    English row is already safe — it logs `translate-failed` to
 *    te_scrape_log and retries on the next fire (the pre-step at the top
 *    of every fire under the bound of one retry row per fire).
 *
 * Zero dependencies, like the rest of the worker: the AI surface is the
 * structural AiLike interface. An adapter that is not the Workers AI
 * binding declares its own sourceModel, so a translation can never be
 * misattributed to the platform model.
 */

import { getRow, logEvent, type D1Like } from "./pipeline";
import { faGlossary } from "./glossary";

/** The primary Workers AI translation model (the live bake-off's record — same as the WGC module's). */
export const TRANSLATION_MODEL = "@cf/google/gemma-4-26b-a4b-it" as const;

/**
 * The fallback chain (added 2026-11-26, the neuron-exhaustion sitting):
 * the account's daily free allocation of 10,000 neurons is ACCOUNT-WIDE
 * and shared — the markets worker's ten fires a day and the WGC watch's
 * own gemma runs can exhaust it before the 05:00 UTC te fire, and the
 * observed failure (te_scrape_log 2026-11-25/26, error 4006: "you have
 * used up your daily free allocation of 10,000 neurons") left the
 * briefing English-only for the whole day. The fallback is the cheaper
 * fp8-fast llama — live-tested with the same chat contract (a clean
 * two-field JSON translation, finish_reason stop) — tried in order when
 * the primary answers with an allocation error; every other failure
 * keeps the honest translate-failed discipline (retry next fire).
 */
export const FALLBACK_MODELS: readonly string[] = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
] as const;

/** The errors that mean "the account's free neurons ran out" — the only
 *  failures that fall through to the next model in the chain. */
function isAllocationError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("4006") ||
    m.includes("daily free allocation") ||
    m.includes("used up your daily free") ||
    m.includes("neuron")
  );
}

/**
 * The strict system contract every chat run carries — the WGC runner's own
 * contract, verbatim except the JSON shape line (TE's briefing is a
 * headline plus one body, so the segments line is replaced by the
 * two-string shape).
 */
const CHAT_SYSTEM = [
  "You are a professional English-to-Persian (Farsi) translator for gold-market financial commentary.",
  "Translate the given content into fluent, natural Persian (Farsi) — never Arabic.",
  "Preserve every number, percentage and month exactly — but write ALL numerals as Persian digits (۰۱۲۳۴۵۶۷۸۹), never Latin digits.",
  "Write the well-known institutions and places in their established Persian forms, never in Latin letters: Federal Reserve and the Fed → فدرال رزرو آمریکا، EU → اتحادیه اروپا، US / United States / US dollar → آمریکا / دلار آمریکا، Treasury → خزانه‌داری آمریکا، ECB → بانک مرکزی اروپا. (Ticker symbols like LBMA, WGC, PCE, XAU stay as they are.)",
  "Do not add, omit, or reinterpret any content. Do not explain.",
  'Output STRICT JSON only, no markdown fences: {"headline": <string>, "body": <string>}',
].join(" ");

/**
 * The completion budget — a uniform envelope parameter, never a per-model
 * tune (the WGC bake-off's own law; the production runs carry it too).
 *
 * RAISED 2048 → 8192 (2026-11-25, the first live translation sitting —
 * the WGC module's own recorded raise, carried over verbatim): the
 * gemma-4-26b serving reasons first and the 2048 budget died at
 * finish_reason "length" with an empty content channel; 8192 finishes
 * (stop) inside ~3700 completion tokens. Still one call per briefing.
 */
const MAX_TOKENS = 8192;

/** The structural AI surface (the Workers AI binding satisfies this). */
export interface AiLike {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
  /**
   * The engine identity the side table's source_model records — an
   * adapter that is not the Workers AI binding declares itself here,
   * so a translation can never be misattributed to the platform model.
   */
  readonly sourceModel?: string;
}

/** The side table row (te_briefing_fa, 1:1 the DDL). */
export interface TeFaRow {
  news_id: string;
  fa_title: string;
  fa_body: string;
  source_model: string;
  translated_at: string;
  content_hash: string;
}

export type TranslateOutcome =
  | { outcome: "translated"; model: string; strings: number }
  | { outcome: "up-to-date" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "failed"; reason: string };

/* ------------------------------------------------------------------ *
 * The side-table SQL (raw D1 statements, like the rest of the pipeline)
 * ------------------------------------------------------------------ */

export async function getFaRow(db: D1Like, newsId: string): Promise<TeFaRow | null> {
  return db
    .prepare("SELECT * FROM te_briefing_fa WHERE news_id = ?")
    .bind(newsId)
    .first<TeFaRow>();
}

/* ------------------------------------------------------------------ *
 * The runner — the chat contract, one call per briefing
 * ------------------------------------------------------------------ */

/** The briefing as the chat contract carries it (and mirrors back). */
interface ChatBriefing {
  headline: string;
  body: string;
}

/**
 * One full-briefing translation under the chat contract. The REST adapters
 * (the seed script) unwrap the API's {result: …} envelope themselves; the
 * Workers AI binding returns the result object directly — either way `out`
 * is the model's result, read in BOTH served shapes: the legacy
 * {response: string} and the OpenAI-compatible
 * {choices: [{message: {content: string}}]}.
 */
async function runTranslationModelOnce(ai: AiLike, model: string, briefing: ChatBriefing): Promise<ChatBriefing> {
  const out = await ai.run(model, {
    messages: [
      { role: "system", content: CHAT_SYSTEM },
      { role: "user", content: JSON.stringify({ headline: briefing.headline, body: briefing.body }) },
    ],
    max_tokens: MAX_TOKENS,
  });

  const r = typeof out === "object" && out !== null ? (out as Record<string, unknown>) : null;
  const rawLegacy = typeof r?.response === "string" ? r.response : null;
  const rawChat =
    r && Array.isArray(r.choices)
      ? ((r.choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content ?? null)
      : null;
  const raw = typeof rawChat === "string" ? rawChat : rawLegacy;
  if (raw === null || raw.trim() === "") {
    throw new Error("the model returned no content (empty channel)");
  }

  // The defensive parse: strip fences/preamble, take the outermost object.
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last <= first) {
    throw new Error("no JSON object found in the response");
  }
  const parsed: unknown = JSON.parse(text.slice(first, last + 1));
  const p = parsed as { headline?: unknown; body?: unknown };

  // The shape contract: both fields non-empty strings — a dropped, empty
  // or non-string field is a drifted shape, the whole run fails.
  if (typeof p.headline !== "string" || !p.headline.trim()) {
    throw new Error("the headline field is missing, empty, or not a string");
  }
  if (typeof p.body !== "string" || !p.body.trim()) {
    throw new Error("the body field is missing, empty, or not a string");
  }
  const fa: ChatBriefing = { headline: p.headline.trim(), body: p.body.trim() };

  // The dictionary pass — the model leaves a few English tokens standing
  // (دلار US, Federal Reserve, EU, Fed); the established Persian forms
  // replace them before anything is judged or stored (the page's own
  // render-side twin heals the rows already stored).
  const glossed: ChatBriefing = { headline: faGlossary(fa.headline), body: faGlossary(fa.body) };

  // The identity discipline, per string: an output equal to its source is
  // a non-translation — exactly the observed llama-4-scout failure mode
  // (untranslated headings), refused here, never stored.
  if (glossed.headline === briefing.headline) {
    throw new Error("the headline came back untranslated — not a translation");
  }
  if (glossed.body === briefing.body) {
    throw new Error("the body came back untranslated — not a translation");
  }

  return glossed;
}

/**
 * The chain runner: the primary model first, then each fallback in order
 * when the failure is the account's neuron allocation (error 4006). Any
 * other failure rethrows immediately — the honest translate-failed
 * discipline stands; only "the free neurons ran out" moves down the
 * chain. The winning model's id rides the result so the side table and
 * the log record the engine that actually did the work.
 */
async function runTranslationModel(ai: AiLike, briefing: ChatBriefing): Promise<{ fa: ChatBriefing; model: string }> {
  const chain = [TRANSLATION_MODEL, ...FALLBACK_MODELS];
  let lastAllocationError: unknown = null;
  for (const model of chain) {
    try {
      const fa = await runTranslationModelOnce(ai, model, briefing);
      return { fa, model };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (isAllocationError(message)) {
        lastAllocationError = e;
        continue; // the next model in the chain — a cheaper engine, same contract
      }
      throw e;
    }
  }
  throw lastAllocationError instanceof Error
    ? lastAllocationError
    : new Error("every model in the chain reported the account's neuron allocation exhausted");
}

/* ------------------------------------------------------------------ *
 * The step (freshness gate + one model run + the side-table write)
 * ------------------------------------------------------------------ */

export async function translateBriefing(
  db: D1Like,
  ai: AiLike,
  newsId: string,
  now: Date,
): Promise<TranslateOutcome> {
  const adapterModel = ai.sourceModel ?? null; // declared only when the adapter is not the platform binding
  const nowIso = now.toISOString();
  try {
    // 1. The English row must be a real, captured briefing.
    const row = await getRow(db, newsId);
    if (!row || row.status !== "ok" || !row.title || !row.body) {
      return { outcome: "skipped", reason: `no captured briefing content for item ${newsId}` };
    }

    // 2. The freshness gate — the DB serves forever; re-translate only
    //    when the English content actually changed (the re-store path) or
    //    no translation is stored yet.
    const existing = await getFaRow(db, newsId);
    if (existing && existing.content_hash === row.content_hash) {
      return { outcome: "up-to-date" };
    }

    // 3. One chat-contract run for the whole briefing — either string
    //    failing (empty, untranslated, dropped, drifted shape) fails the
    //    whole run: fail-closed, a half-translated row is never stored.
    //    The chain: the primary gemma, then the cheaper fp8 llama when
    //    the account's neuron allocation is the failure (error 4006).
    //    The attribution discipline: a non-binding adapter's declared
    //    sourceModel wins (the adapter's own engine identity); the
    //    platform binding records the chain's winning model.
    const { fa, model } = await runTranslationModel(ai, { headline: row.title, body: row.body });
    const recordedModel = adapterModel ?? model;

    // 4. The side-table write (keyed by news_id; a re-translation replaces).
    await db
      .prepare(
        `INSERT OR REPLACE INTO te_briefing_fa
           (news_id, fa_title, fa_body, source_model, translated_at, content_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(newsId, fa.headline, fa.body, recordedModel, nowIso, row.content_hash)
      .run();

    await logEvent(db, newsId, "translated", `model ${recordedModel} (chat contract, 2 strings), item ${newsId}`);
    return { outcome: "translated", model: recordedModel, strings: 2 };
  } catch (e) {
    // The failure discipline: log honestly, never fail the capture. If the
    // log write itself fails (a D1 outage), swallow after recording it in
    // the invocation log only — the English row is already safe.
    const reason = String(e instanceof Error ? e.message : e).slice(0, 240);
    const failedModel = adapterModel ?? TRANSLATION_MODEL;
    try {
      await logEvent(db, newsId, "translate-failed", `model ${failedModel}: ${reason}`);
    } catch (logErr) {
      console.error(`[te-watch] translate-failed could not be logged (${newsId}): ${String(logErr).slice(0, 120)}`);
    }
    return { outcome: "failed", reason };
  }
}

/**
 * The observability note a fire appends to its result when the
 * translation step did something worth saying (a refresh, or a failure
 * that will retry on the next fire). Up-to-date and skipped are silence.
 */
export function translateNote(outcome: TranslateOutcome): string | undefined {
  if (outcome.outcome === "translated") {
    return `fa translation stored (${outcome.model}, ${outcome.strings} strings)`;
  }
  if (outcome.outcome === "failed") {
    return `fa translation FAILED — logged, retried on the next fire: ${outcome.reason}`;
  }
  return undefined;
}
