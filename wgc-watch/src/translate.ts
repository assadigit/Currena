/**
 * The WGC commentary Persian translation step — spec §8's deferred phase,
 * implemented 2026-11-25: after the English row is stored (or re-stored),
 * the watch worker translates the headline and every segment ONCE per
 * monthly issue into Farsi via Cloudflare Workers AI and writes the
 * side table wgc_commentary_fa. The DB serves the translation forever;
 * the AI is never called per-request, and never called again for content
 * whose hash has not changed (the freshness gate below).
 *
 * The model bake-off record — the LIVE bake-off now run (2026-11-24, the
 * credentials sitting; evidence tests/wgc-bakeoff-2026-11-24.json, three
 * runs over the full 2026-10 payload, every candidate over REST under the
 * same strict contract): TRANSLATION_MODEL is @cf/google/gemma-4-26b-a4b-it
 * — the strongest translation on the sitting's own criteria: fluent
 * natural Persian («کف قیمت کجاست؟», «مرور اکتبر», «شباهت کمی دارد»),
 * correct gold-market terminology (asset rotation → چرخش دارایی‌ها,
 * interim bottom → کف موقتی, downturn → رکود, recovery → بازیابی قیمت
 * طلا), no English bleed-through (every heading Persian; only the
 * contract-preserved named entities such as Fed stay), numbers preserved,
 * no hallucinated additions — and COMPLETE: the sentence the incumbent
 * m2m100 dropped («Our framework shows that we may be nearing an interim
 * bottom.») rendered in full. The incumbent m2m100 was the weakest of the
 * observed candidates — garbled terminology («رویداد دارایی ها» for asset
 * rotation, «متوازن ضعیف» for a poor parallel) and that dropped sentence
 * — exactly the fluency weakness the original selection record predicted,
 * plus a content loss it did not. The other candidates, on evidence:
 * llama-4-scout left the headline and both headings in English; qwen3.8
 * bled English months into the headings («مرور October»); gpt-oss-20b
 * drifted a sentence's meaning and its 120b sibling needs the raised
 * max_tokens envelope below (the default 256-token completion budget
 * vanishes into the reasoning channel, content null — diagnosed live);
 * mistral-small-3.1 was fluent but inconsistent run-to-run («نظریه به
 * جلو» for Looking ahead); deepseek-v4.1 and glm-5.3 are paywalled on the
 * Workers Free plan (the account's own serving answers "not available on
 * the Workers Free plan"); glm-4.7-flash serves on the free plan but the
 * account's daily 10,000-neuron free allocation was exhausted mid-bake-off
 * before its full-prompt behavior could be observed. The chat-family risks
 * the original selection cited (refusal, JSON drift, bleed) are exactly
 * what the strict contract plus the defensive parse plus the per-string
 * identity/empty/mirror checks below now guard: a future month that
 * returns untranslated headings (the llama-4-scout failure mode), a
 * dropped segment, a drifted shape or an empty channel fails the whole
 * run and nothing is stored — fail-closed, retried on the next fire.
 *
 * Failure discipline (the sitting's law): an AI failure NEVER fails the
 * capture — the English row is already safe — it logs `translate-failed`
 * to wgc_scrape_log and the translation retries on the next fire (the
 * pre-step under stop-on-success). A failure inside this module is
 * swallowed after being logged; translateCommentary never throws.
 *
 * Zero dependencies, like the rest of the worker: the AI surface is the
 * structural AiLike interface (the Workers AI binding satisfies it, the
 * REST adapters of the bake-off/forced-run scripts satisfy it, and the
 * sandbox test adapter satisfied it too — its engine identity is
 * recorded in source_model, never silently).
 */

import { getRow, logEvent, type D1Like } from "./pipeline";
import type { WgcSegment } from "./parser";

/** The selected Workers AI translation model (the live bake-off record above). */
export const TRANSLATION_MODEL = "@cf/google/gemma-4-26b-a4b-it" as const;

/**
 * The strict system contract every chat run carries — the bake-off's own
 * contract, verbatim, so the production runner and the bake-off evidence
 * stay the same judgment surface.
 */
const CHAT_SYSTEM = [
  "You are a professional English-to-Persian (Farsi) translator for gold-market financial commentary.",
  "Translate the given content into fluent, natural Persian (Farsi) — never Arabic.",
  "Preserve every number, percentage, month and named entity (e.g. Fed, LBMA, WGC) exactly — but write ALL numerals as Persian digits (۰۱۲۳۴۵۶۷۸۹), never Latin digits.",
  "Do not add, omit, or reinterpret any content. Do not explain.",
  'Output STRICT JSON only, no markdown fences: {"headline": <string|null>, "segments": [{"heading": <string>, "body": <string>}, …]}',
  "The segments array must match the input's order and count exactly.",
].join(" ");

/**
 * The completion budget — a uniform envelope parameter, never a per-model
 * tune: gpt-oss spends its default 256-token completion budget inside its
 * reasoning channel and returns content null with finish_reason "length"
 * (diagnosed live, 2026-11-24). Every candidate in the bake-off ran under
 * this same budget; the production runs carry it too.
 *
 * RAISED 2048 → 8192 (2026-11-25, the first live translation sitting):
 * the gemma-4-26b serving (the -external variant) now reasons FIRST —
 * the first forced run died at finish_reason "length" with an EMPTY
 * content channel and ~7k reasoning characters under the 2048 budget;
 * the re-probe of this module's own contract payload finished (stop)
 * inside 3682 completion tokens with a parseable Persian result at
 * 8192, at ~78s latency. Still one call per payload, still uniform
 * across every model.
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

/** The side table row (wgc_commentary_fa, 1:1 the DDL). */
export interface WgcFaRow {
  month_key: string;
  fa_headline: string | null;
  fa_json: string;
  source_model: string;
  translated_at: string;
  content_hash: string;
}

export type TranslateOutcome =
  | { outcome: "translated"; model: string; strings: number; segments: number }
  | { outcome: "up-to-date" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "failed"; reason: string };

/* ------------------------------------------------------------------ *
 * The side-table SQL (raw D1 statements, like the rest of the pipeline)
 * ------------------------------------------------------------------ */

export async function getFaRow(db: D1Like, monthKey: string): Promise<WgcFaRow | null> {
  return db
    .prepare("SELECT * FROM wgc_commentary_fa WHERE month_key = ?")
    .bind(monthKey)
    .first<WgcFaRow>();
}

/* ------------------------------------------------------------------ *
 * The runner — the chat contract, one call per issue
 * ------------------------------------------------------------------ */

/** The issue as the chat contract carries it (and mirrors back). */
interface ChatIssue {
  headline: string | null;
  segments: WgcSegment[];
}

/** The total string count one issue translation covers (headline + each segment's heading and body). */
function stringCountOf(headline: string | null, segments: WgcSegment[]): number {
  return (headline !== null ? 1 : 0) + 2 * segments.length;
}

/**
 * One full-issue translation under the chat contract. The REST adapters
 * (the bake-off / forced-run scripts) unwrap the API's {result: …}
 * envelope themselves; the Workers AI binding returns the result object
 * directly — either way `out` is the model's result, read in BOTH served
 * shapes: the legacy {response: string} and the OpenAI-compatible
 * {choices: [{message: {content: string}}]} (the account's current
 * serving returns the latter for the selected model; the extraction is
 * defensive so a serving-side shape change fails closed, never garbles).
 */
async function runTranslationModel(ai: AiLike, issue: ChatIssue): Promise<ChatIssue> {
  const out = await ai.run(TRANSLATION_MODEL, {
    messages: [
      { role: "system", content: CHAT_SYSTEM },
      { role: "user", content: JSON.stringify({ headline: issue.headline, segments: issue.segments }) },
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
  const p = parsed as { headline?: unknown; segments?: unknown };

  // The shape contract: exactly the input's segments, in order, each a
  // non-empty {heading, body} string pair.
  if (!Array.isArray(p.segments) || p.segments.length !== issue.segments.length) {
    throw new Error(
      `the segments shape drifted (got ${Array.isArray(p.segments) ? p.segments.length : "non-array"}, want ${issue.segments.length})`,
    );
  }
  const segments: WgcSegment[] = p.segments.map((s: unknown) => {
    const seg = s as { heading?: unknown; body?: unknown };
    if (typeof seg.heading !== "string" || typeof seg.body !== "string" || !seg.heading.trim() || !seg.body.trim()) {
      throw new Error("a segment is not a non-empty {heading, body} string pair");
    }
    return { heading: seg.heading.trim(), body: seg.body.trim() };
  });

  // The headline must mirror the input exactly: a non-null source headline
  // answered with null is a dropped string; a null source answered with a
  // headline is an added one. Either fails the run — no half or padded
  // translations are ever stored.
  let headline: string | null;
  if (p.headline === null || p.headline === undefined) {
    headline = null;
    if (issue.headline !== null) {
      throw new Error("the source headline was dropped (answered null)");
    }
  } else if (typeof p.headline === "string") {
    headline = p.headline.trim();
    if (headline === "") {
      throw new Error("the source headline was dropped (answered empty)");
    }
    if (issue.headline === null) {
      throw new Error("a headline was added where the source had none");
    }
  } else {
    throw new Error("the headline field is not a string or null");
  }

  // The identity/empty discipline, per string: an output equal to its
  // source is a non-translation — exactly the observed llama-4-scout
  // failure mode (untranslated headings), refused here, never stored.
  if (headline !== null && issue.headline !== null && headline === issue.headline) {
    throw new Error("the headline came back untranslated — not a translation");
  }
  for (let i = 0; i < segments.length; i++) {
    if (segments[i]!.heading === issue.segments[i]!.heading) {
      throw new Error("a segment heading came back untranslated — not a translation");
    }
    if (segments[i]!.body === issue.segments[i]!.body) {
      throw new Error("a segment body came back untranslated — not a translation");
    }
  }

  return { headline, segments };
}

/* ------------------------------------------------------------------ *
 * The step (freshness gate + one model run + the side-table write)
 * ------------------------------------------------------------------ */

export async function translateCommentary(
  db: D1Like,
  ai: AiLike,
  monthKey: string,
  now: Date,
): Promise<TranslateOutcome> {
  const recordedModel = ai.sourceModel ?? TRANSLATION_MODEL;
  const nowIso = now.toISOString();
  try {
    // 1. The English row must be a real, captured box.
    const row = await getRow(db, monthKey);
    if (!row || row.status !== "ok" || row.highlights_json === "[]" || row.highlights_json === "") {
      return { outcome: "skipped", reason: "no captured commentary content for this month" };
    }

    // 2. The freshness gate — the DB serves forever; re-translate only
    //    when the English content actually changed (the re-store path) or
    //    no translation is stored yet.
    const existing = await getFaRow(db, monthKey);
    if (existing && existing.content_hash === row.content_hash) {
      return { outcome: "up-to-date" };
    }

    // 3. Parse the English segments defensively (the stored JSON is the
    //    pipeline's own canonical form, but the parse is still guarded).
    let segments: WgcSegment[];
    try {
      const parsed: unknown = JSON.parse(row.highlights_json);
      if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isSegment)) {
        throw new Error("the stored highlights JSON is not a non-empty segment array");
      }
      segments = parsed as WgcSegment[];
    } catch (e) {
      return { outcome: "failed", reason: `stored segments unparseable: ${String(e).slice(0, 120)}` };
    }

    // 4. One chat-contract run for the whole issue — any one string
    //    failing (empty, untranslated, dropped, drifted shape) fails the
    //    whole run: fail-closed, a half-translated row is never stored.
    const issue: ChatIssue = { headline: row.headline ?? null, segments };
    const fa = await runTranslationModel(ai, issue);

    // 5. The side-table write (keyed by month; a re-translation replaces).
    await db
      .prepare(
        `INSERT OR REPLACE INTO wgc_commentary_fa
           (month_key, fa_headline, fa_json, source_model, translated_at, content_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(monthKey, fa.headline, JSON.stringify(fa.segments), recordedModel, nowIso, row.content_hash)
      .run();

    await logEvent(
      db,
      nowIso,
      monthKey,
      "translated",
      `model ${recordedModel} (chat contract, ${stringCountOf(fa.headline, fa.segments)} strings), ${fa.segments.length} segments`,
    );
    return {
      outcome: "translated",
      model: recordedModel,
      strings: stringCountOf(fa.headline, fa.segments),
      segments: fa.segments.length,
    };
  } catch (e) {
    // The failure discipline: log honestly, never fail the capture. If the
    // log write itself fails (a D1 outage), swallow after recording it in
    // the invocation log only — the English row is already safe.
    const reason = String(e instanceof Error ? e.message : e).slice(0, 240);
    try {
      await logEvent(db, nowIso, monthKey, "translate-failed", `model ${recordedModel}: ${reason}`);
    } catch (logErr) {
      console.error(`[wgc-watch] translate-failed could not be logged (${monthKey}): ${String(logErr).slice(0, 120)}`);
    }
    return { outcome: "failed", reason };
  }
}

function isSegment(v: unknown): v is WgcSegment {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as WgcSegment).heading === "string" &&
    (v as WgcSegment).heading !== "" &&
    typeof (v as WgcSegment).body === "string" &&
    (v as WgcSegment).body !== ""
  );
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
