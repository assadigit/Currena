// The WGC translation bake-off — the live EN→FA model comparison on the
// SAME REAL text (the current issue's headline plus ALL its segments, the
// full payload, never a snippet), per the 2026-11-25 sitting's Step 1.
//
//   WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… \
//     bun scripts/wgc-bakeoff.ts [--db db/custom.db] [--route <url>] \
//        [--month 2026-10] [--models id1,id2,…]
//
// The text source: the D1 row's bytes, read either from a local SQLite
// archive (--db, the default db/custom.db carries the same rows the
// remote D1 serves) or from the desk's own route (--route, the D1 read
// side). The candidates are the LIVE catalog's shortlist as served by the
// account-scoped models/search API (2026-11-24, the second run: the first
// run's catalog had deprecated qwen3-30b-a3b-fp8 and llama-3.1-8b on
// 2026-11-20 — both now dropped — and the account catalog now also serves
// the zai-org GLM family, which this run adds): the dedicated translation
// model, and the chat families — Qwen, Llama 3.3 / Llama 4 Scout, Gemma,
// gpt-oss, Mistral, DeepSeek, GLM.
//
// Each candidate runs over the FULL payload: m2m100 through its
// per-string contract (the production runner of wgc-watch/src/translate.ts
// re-implemented here over REST — the script runs OUTSIDE the worker);
// every chat model through a strict JSON output contract, parsed
// defensively. The script prints each model's translation beside the
// English source and flags two objective signals — Arabic-script
// contamination (ي ك tatweel — Persian writes ی ک) and dropped or
// altered numbers/percentages — as INPUTS to the human judgment the
// sitting demands (fluent Persian not Arabic, correct gold-market
// terminology, no English bleed-through, numbers preserved, no
// hallucinated additions). Evidence appends to
// tests/wgc-bakeoff-<date>.json.
//
// Credentials ride the environment only — never stored, never printed.

import { Database } from "bun:sqlite";

/* ------------------------------------------------------------------ *
 * Arguments + the run's record
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const flag = (name: string): string | null => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "") : null;
};
const DB = flag("db") ?? "db/custom.db";
const ROUTE = flag("route");
const MONTH = flag("month");
const MODELS = flag("models");
if (!(process.env.WORKERS_AI_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)) {
  console.error("WORKERS_AI_TOKEN and CLOUDFLARE_ACCOUNT_ID must be in the environment (env-only, never stored)");
  process.exit(2);
}
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const TOKEN = process.env.WORKERS_AI_TOKEN!;
const RAN_AT = new Date();
const OUT_PATH = `tests/wgc-bakeoff-${RAN_AT.toISOString().slice(0, 10)}.json`;

/* ------------------------------------------------------------------ *
 * The live shortlist (the public catalog, fetched 2026-11-24 — the
 * account-level catalog API could not be reached this sitting; the ids
 * below are the catalog's own, verifiable at
 * developers.cloudflare.com/workers-ai/models/)
 * ------------------------------------------------------------------ */

interface Candidate {
  id: string;
  family: "translation" | "chat";
}

const DEFAULT_CANDIDATES: Candidate[] = [
  { id: "@cf/meta/m2m100-1.2b", family: "translation" },
  { id: "@cf/qwen/qwen3.8-27b", family: "chat" },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", family: "chat" },
  { id: "@cf/meta/llama-4-scout-17b-16e-instruct", family: "chat" },
  { id: "@cf/google/gemma-4-26b-a4b-it", family: "chat" },
  { id: "@cf/openai/gpt-oss-20b", family: "chat" },
  { id: "@cf/openai/gpt-oss-120b", family: "chat" },
  { id: "@cf/mistralai/mistral-small-3.1-24b-instruct", family: "chat" },
  { id: "@cf/deepseek-ai/deepseek-v4.1-flash-1017", family: "chat" },
  { id: "@cf/zai-org/glm-4.7-flash", family: "chat" },
  { id: "@cf/zai-org/glm-5.3", family: "chat" },
];
const candidates: Candidate[] = MODELS
  ? MODELS.split(",").map((id) => ({
      id: id.trim(),
      family: id.includes("m2m100") ? ("translation" as const) : ("chat" as const),
    }))
  : DEFAULT_CANDIDATES;

/* ------------------------------------------------------------------ *
 * The text: the same real payload for every candidate
 * ------------------------------------------------------------------ */

interface Issue {
  month: string;
  headline: string | null;
  segments: { heading: string; body: string }[];
}

async function loadIssue(): Promise<Issue> {
  if (ROUTE) {
    const res = await fetch(`${ROUTE}${ROUTE.includes("?") ? "&" : "?"}${MONTH ? `month=${MONTH}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`the route responded ${res.status}`);
    const body = (await res.json()) as Partial<Issue> & { status: string };
    if (body.status !== "ok" || !body.segments) throw new Error(`the route answered status ${body.status}`);
    return { month: body.month ?? "", headline: body.headline ?? null, segments: body.segments };
  }
  const db = new Database(DB, { readonly: true });
  const row = MONTH
    ? (db.prepare("SELECT month_key, headline, highlights_json FROM wgc_commentary WHERE month_key = ?").get(MONTH) as
        | { month_key: string; headline: string | null; highlights_json: string }
        | undefined)
    : (db
        .prepare("SELECT month_key, headline, highlights_json FROM wgc_commentary WHERE status = 'ok' ORDER BY month_key DESC LIMIT 1")
        .get() as { month_key: string; headline: string | null; highlights_json: string } | undefined);
  db.close();
  if (!row) throw new Error(`no commentary row found (${MONTH ?? "latest"}) in ${DB}`);
  return {
    month: row.month_key,
    headline: row.headline,
    segments: JSON.parse(row.highlights_json) as { heading: string; body: string }[],
  };
}

/* ------------------------------------------------------------------ *
 * The REST run (one model, one input — the envelope unwrapped)
 * ------------------------------------------------------------------ */

async function restRun(model: string, input: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(120_000),
    },
  );
  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; result?: unknown; errors?: { message?: string }[] }
    | null;
  if (!res.ok || !body || body.success !== true) {
    const why = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(why);
  }
  return body.result;
}

/* ------------------------------------------------------------------ *
 * The two family runners
 * ------------------------------------------------------------------ */

/** m2m100's per-string contract — the same ladder the production runner uses. */
const TARGET_LANG_CANDIDATES = ["fa", "persian", "farsi"] as const;

function extractTranslated(result: unknown): string | null {
  const r = typeof result === "object" && result !== null ? (result as Record<string, unknown>) : null;
  const c = r ? (r.translated_text ?? r.response) : null;
  return typeof c === "string" && c.trim() !== "" ? c.trim() : null;
}

async function runM2m100(issue: Issue): Promise<{ headline: string | null; segments: { heading: string; body: string }[] }> {
  let lang: string | null = null;
  const one = async (text: string): Promise<string> => {
    let lastError: unknown = null;
    for (const form of TARGET_LANG_CANDIDATES) {
      try {
        const out = extractTranslated(
          await restRun("@cf/meta/m2m100-1.2b", { text, source_lang: "en", target_lang: form }),
        );
        if (out === null || out === text) throw new Error("empty or untranslated");
        lang ??= form;
        return out;
      } catch (e) {
        lastError = e;
        if (lang !== null) break; // the form already resolved — a mid-run failure is real
      }
    }
    throw new Error(String(lastError).slice(0, 120));
  };
  const headline = issue.headline !== null ? await one(issue.headline) : null;
  const segments: { heading: string; body: string }[] = [];
  for (const s of issue.segments) {
    segments.push({ heading: await one(s.heading), body: await one(s.body) });
  }
  return { headline, segments };
}

/** The chat contract — a strict JSON output, parsed defensively. */
const CHAT_SYSTEM = [
  "You are a professional English-to-Persian (Farsi) translator for gold-market financial commentary.",
  "Translate the given content into fluent, natural Persian (Farsi) — never Arabic.",
  "Preserve every number, percentage, month and named entity (e.g. Fed, LBMA, WGC) exactly.",
  "Do not add, omit, or reinterpret any content. Do not explain.",
  'Output STRICT JSON only, no markdown fences: {"headline": <string|null>, "segments": [{"heading": <string>, "body": <string>}, …]}',
  "The segments array must match the input's order and count exactly.",
].join(" ");

async function runChat(model: string, issue: Issue): Promise<{ headline: string | null; segments: { heading: string; body: string }[] }> {
  // The uniform envelope every chat candidate runs under: the same strict
  // contract, plus max_tokens 2048 — gpt-oss spends its default 256-token
  // completion budget inside its reasoning channel and returns content
  // null with finish_reason "length" (diagnosed live 2026-11-24); the
  // raised budget is an envelope fix shared by every candidate, not a
  // per-model prompt tune.
  const result = await restRun(model, {
    messages: [
      { role: "system", content: CHAT_SYSTEM },
      {
        role: "user",
        content: JSON.stringify({ headline: issue.headline, segments: issue.segments }),
      },
    ],
    max_tokens: 2048,
  });
  const r = typeof result === "object" && result !== null ? (result as Record<string, unknown>) : null;
  // Both served shapes: the legacy {response: string} and the
  // OpenAI-compatible {choices: [{message: {content: string}}]} — the newer
  // families (qwen3.8, llama-3.3/4, gemma-4, gpt-oss, mistral, deepseek,
  // glm) return the latter; some carry `reasoning` beside the content.
  const rawLegacy = typeof r?.response === "string" ? r.response : null;
  const rawChat =
    r && Array.isArray(r.choices)
      ? ((r.choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content ?? null)
      : null;
  const raw = typeof rawChat === "string" ? rawChat : rawLegacy;
  if (raw === null || raw.trim() === "") throw new Error("no response field in the result");
  // The defensive parse: strip fences/preamble, take the outermost object.
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("no JSON object found in the response");
  const parsed: unknown = JSON.parse(text.slice(first, last + 1));
  const p = parsed as { headline?: unknown; segments?: unknown };
  if (!Array.isArray(p.segments) || p.segments.length !== issue.segments.length) {
    throw new Error(`segments shape drifted (got ${Array.isArray(p.segments) ? p.segments.length : "non-array"}, want ${issue.segments.length})`);
  }
  const segments = p.segments.map((s: unknown) => {
    const seg = s as { heading?: unknown; body?: unknown };
    if (typeof seg.heading !== "string" || typeof seg.body !== "string" || !seg.heading || !seg.body) {
      throw new Error("a segment is not {heading, body} strings");
    }
    return { heading: seg.heading, body: seg.body };
  });
  const headline =
    p.headline === null || p.headline === undefined ? null : typeof p.headline === "string" ? p.headline : null;
  return { headline, segments };
}

/* ------------------------------------------------------------------ *
 * The objective signals (inputs to the human judgment, never the verdict)
 * ------------------------------------------------------------------ */

const ARABIC_ONLY_CHARS = /[\u064A\u0643\u0640]/; // Arabic ي / ك and tatweel — Persian writes ی / ک
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function numbersOf(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.match(/-?\d+(?:\.\d+)?%?/g) ?? []) out.add(m);
  return [...out];
}

function persianToLatinDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Arabic-script contamination seen in the output (Persian writes ی/ک). */
function arabicBleed(t: { headline: string | null; segments: { heading: string; body: string }[] }): string[] {
  const whole = [t.headline ?? "", ...t.segments.flatMap((s) => [s.heading, s.body])].join(" ");
  return [...new Set([...whole.matchAll(new RegExp(ARABIC_ONLY_CHARS.source, "g"))].map((m) => m[0]!))];
}

/** EN numbers missing from the output (each checked in Latin or Persian digits). */
function numbersLost(en: Issue, fa: { headline: string | null; segments: { heading: string; body: string }[] }): string[] {
  const whole = persianToLatinDigits(
    [fa.headline ?? "", ...fa.segments.flatMap((s) => [s.heading, s.body])].join(" "),
  );
  const want = new Set<string>([
    ...numbersOf([en.headline ?? "", ...en.segments.flatMap((s) => [s.heading, s.body])].join(" ")),
    ...numbersOf(en.month.replace("-", " ")),
  ]);
  return [...want].filter((n) => !whole.includes(n));
}

/* ------------------------------------------------------------------ *
 * The bake-off
 * ------------------------------------------------------------------ */

const issue = await loadIssue();
const enWhole = [issue.headline ?? "", ...issue.segments.flatMap((s) => [s.heading, s.body])].join(" ");
console.log(`WGC translation bake-off — ${RAN_AT.toISOString()}`);
console.log(`text: the ${issue.month} issue — ${issue.segments.length} segments, ${enWhole.length} chars (the FULL payload)\n`);
console.log(`EN headline: ${issue.headline}`);
for (const s of issue.segments) console.log(`EN [${s.heading}] ${s.body}`);
console.log("");

const verdicts: Array<Record<string, unknown>> = [];
for (const cand of candidates) {
  console.log(`───────── ${cand.id} (${cand.family}) ─────────`);
  const verdict: Record<string, unknown> = { model: cand.id, family: cand.family };
  try {
    const out = cand.family === "translation" ? await runM2m100(issue) : await runChat(cand.id, issue);
    const bleed = arabicBleed(out);
    const lost = numbersLost(issue, out);
    const okShape = out.segments.length === issue.segments.length;
    verdict.ok = true;
    verdict.shapeOk = okShape;
    verdict.arabicBleedChars = bleed;
    verdict.numbersLost = lost;
    verdict.output = out;
    console.log(`headline: ${out.headline}`);
    for (const s of out.segments) console.log(`  [${s.heading}]\n  ${s.body}`);
    console.log(`signals: shape ${okShape ? "ok" : "DRIFTED"} · arabic-bleed ${bleed.length ? bleed.join(" ") : "none"} · numbers ${lost.length ? `LOST ${lost.join(", ")}` : "preserved"}`);
  } catch (e) {
    verdict.ok = false;
    verdict.error = String(e).slice(0, 240);
    console.log(`FAILED — ${verdict.error}`);
  }
  verdicts.push(verdict);
  console.log("");
}

console.log("The judgment is the operator's (the sitting's criteria): fluent Persian (not");
console.log("Arabic), correct gold-market terminology, no English bleed-through, numbers");
console.log("preserved, no hallucinated additions. The signals above are inputs only.");

/* ------------------------------------------------------------------ *
 * The evidence append
 * ------------------------------------------------------------------ */

const evidence = { runs: [] as Array<Record<string, unknown>> };
try {
  const prev = await Bun.file(OUT_PATH).json();
  if (Array.isArray(prev.runs)) evidence.runs = prev.runs;
} catch {
  /* the first run */
}
evidence.runs.push({
  ranAt: RAN_AT.toISOString(),
  source: ROUTE ? `route:${ROUTE}` : `db:${DB}`,
  month: issue.month,
  english: { headline: issue.headline, segments: issue.segments },
  candidates,
  verdicts,
});
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`\nevidence appended → ${OUT_PATH} (${evidence.runs.length} run(s) recorded)`);
