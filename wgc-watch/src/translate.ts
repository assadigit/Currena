/**
 * The WGC commentary Persian translation step — spec §8's deferred phase,
 * implemented 2026-11-25: after the English row is stored (or re-stored),
 * the watch worker translates the headline and every segment ONCE per
 * monthly issue into Farsi via Cloudflare Workers AI and writes the
 * side table wgc_commentary_fa. The DB serves the translation forever;
 * the AI is never called per-request, and never called again for content
 * whose hash has not changed (the freshness gate below).
 *
 * The model bake-off record (AGENTS.md, the 2026-11-25 sitting):
 * TRANSLATION_MODEL is @cf/meta/m2m100-1.2b — the only model on the
 * free-plan catalog served under the Translation task and the only one
 * whose target-language contract includes Persian by construction
 * (M2M100's 100-language set, fairseq-documented). Its fluency is the
 * weakest of the shortlist and the card's honest «ترجمهٔ ماشینی» label
 * covers exactly that; the chat families (Qwen3, Llama 3.x/4, Gemma 4,
 * gpt-oss) carry no documented Persian coverage at the serving level —
 * Llama's official language lists exclude it outright — and are the
 * risk class the live bake-off must clear before one ever replaces this
 * (scripts/wgc-bakeoff.ts re-opens the selection the moment a valid
 * token exists; the swap is this one constant plus the runner).
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

/** The selected Workers AI translation model (the bake-off record above). */
export const TRANSLATION_MODEL = "@cf/meta/m2m100-1.2b" as const;

/**
 * The m2m100 input schema (the model page's raw sync-input.json) takes a
 * language CODE ("en" → "es"); the page's usage examples spell the names
 * ("english" → "french"). The runner resolves which form the serving
 * accepts on the first string and reuses the winner — the resolution and
 * the winning form are recorded in the log line.
 */
const SOURCE_LANG = "en";
const TARGET_LANG_CANDIDATES = ["fa", "persian", "farsi"] as const;

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
  | { outcome: "translated"; model: string; strings: number; targetLang: string }
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
 * The runner
 * ------------------------------------------------------------------ */

/** The translation of one string under one target-language form, or the throw reason. */
async function translateStringOnce(
  ai: AiLike,
  text: string,
  targetLang: string,
): Promise<string> {
  // The REST adapters (the bake-off / forced-run scripts) unwrap the API's
  // {result: …} envelope themselves; the Workers AI binding returns the
  // result object directly. Either way `out` is the model's result — read
  // the known field defensively, and treat an empty or source-identical
  // answer as a non-translation (never a stored fake translation).
  const out = await ai.run(TRANSLATION_MODEL, {
    text,
    source_lang: SOURCE_LANG,
    target_lang: targetLang,
  });
  const r = typeof out === "object" && out !== null ? (out as Record<string, unknown>) : null;
  const candidate = r ? (r.translated_text ?? r.response) : null;
  if (typeof candidate !== "string" || candidate.trim() === "") {
    throw new Error("the model returned no translated text");
  }
  const trimmed = candidate.trim();
  if (trimmed === text) {
    throw new Error("the model returned the source unchanged — not a translation");
  }
  return trimmed;
}

/** The strings one issue translation works through, in order. */
function stringsOf(headline: string | null, segments: WgcSegment[]): string[] {
  const out: string[] = [];
  if (headline !== null) out.push(headline);
  for (const s of segments) {
    out.push(s.heading);
    out.push(s.body);
  }
  return out;
}

/**
 * Translate one issue's headline and segments. The m2m100 contract is
 * per-string — the {"heading","body"} shape and the order are preserved
 * STRUCTURALLY (this module reassembles them), which is the strict JSON
 * contract the sitting asked for, made immune to the chat models'
 * prompted-JSON drift: there is nothing for the model to re-format.
 */
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

    // 4. Resolve the target-language form the serving accepts, on the
    //    first string; the winner serves the rest.
    const headline = row.headline ?? null;
    const texts = stringsOf(headline, segments);
    let targetLang: string = TARGET_LANG_CANDIDATES[0];
    let translations: string[] = [];
    let resolved = false;
    let lastError: unknown = null;
    for (const form of TARGET_LANG_CANDIDATES) {
      try {
        const first = await translateStringOnce(ai, texts[0]!, form);
        targetLang = form;
        translations = [first];
        resolved = true;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!resolved) {
      throw new Error(
        `no target_lang form accepted for ${monthKey} (${TARGET_LANG_CANDIDATES.join("/")}): ${String(lastError).slice(0, 120)}`,
      );
    }

    // 5. The rest of the strings — one failure fails the whole run
    //    (fail-closed: a half-translated row is never stored).
    for (const text of texts.slice(1)) {
      translations.push(await translateStringOnce(ai, text, targetLang));
    }

    // 6. Reassemble in the SAME order and shape.
    let i = 0;
    const faHeadline = headline !== null ? translations[i++]! : null;
    const faSegments: WgcSegment[] = segments.map((s) => ({
      heading: translations[i++]!,
      body: translations[i++]!,
    }));

    // 7. The side-table write (keyed by month; a re-translation replaces).
    await db
      .prepare(
        `INSERT OR REPLACE INTO wgc_commentary_fa
           (month_key, fa_headline, fa_json, source_model, translated_at, content_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(monthKey, faHeadline, JSON.stringify(faSegments), recordedModel, nowIso, row.content_hash)
      .run();

    await logEvent(
      db,
      nowIso,
      monthKey,
      "translated",
      `model ${recordedModel} (${targetLang}), ${texts.length} strings, ${faSegments.length} segments`,
    );
    return { outcome: "translated", model: recordedModel, strings: texts.length, targetLang };
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
