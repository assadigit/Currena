// The TE briefing translation backfill (2026-11-26) — the missing Persian
// for item 604531 (and any other stored-but-untranslated row), run once
// from outside the worker: the REST Workers AI adapter (the same chat
// contract as the worker's [ai] binding) + the live D1, the same
// freshness-gate and mirror disciplines as translateBriefing, applied via
// the Cloudflare D1 HTTP API directly (no wrangler needed).
//
//   bun scripts/te-translate-backfill.ts            # translate + apply
//   bun scripts/te-translate-backfill.ts --dry      # show, apply nothing
//
// Env required: WORKERS_AI_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (D1).

import { TRANSLATION_MODEL, FALLBACK_MODELS } from "../te-watch/src/translate";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const AI_TOKEN = process.env.WORKERS_AI_TOKEN!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const DB_ID = "264617a4-5bfa-43af-8c9c-d4c95d257dc8"; // aurum-desk
const DRY = process.argv.includes("--dry");

if (!AI_TOKEN || !ACCOUNT_ID || !API_TOKEN) {
  console.error("WORKERS_AI_TOKEN, CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be in the environment");
  process.exit(2);
}

/* ------------------------------------------------------------------ *
 * The D1 HTTP API (read + write)
 * ------------------------------------------------------------------ */

interface D1Result<T> {
  result: { results: T[] } | Array<{ results: T[] }>;
  success: boolean;
  errors?: { message: string }[];
}

async function d1<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await res.json()) as D1Result<T>;
  if (!res.ok || !body.success) {
    throw new Error(`D1 query failed: ${body.errors?.[0]?.message ?? `HTTP ${res.status}`}`);
  }
  const r = body.result;
  return Array.isArray(r) ? r[0]?.results ?? [] : r.results;
}

/* ------------------------------------------------------------------ *
 * The chat contract (the worker's own, verbatim)
 * ------------------------------------------------------------------ */

const CHAT_SYSTEM = [
  "You are a professional English-to-Persian (Farsi) translator for gold-market financial commentary.",
  "Translate the given content into fluent, natural Persian (Farsi) — never Arabic.",
  "Preserve every number, percentage and month exactly — but write ALL numerals as Persian digits (۰۱۲۳۴۵۶۷۸۹), never Latin digits.",
  "Write the well-known institutions and places in their established Persian forms, never in Latin letters: Federal Reserve and the Fed → فدرال رزرو آمریکا، EU → اتحادیه اروپا، US / United States / US dollar → آمریکا / دلار آمریکا، Treasury → خزانه‌داری آمریکا، ECB → بانک مرکزی اروپا. (Ticker symbols like LBMA, WGC, PCE, XAU stay as they are.)",
  "Do not add, omit, or reinterpret any content. Do not explain.",
  'Output STRICT JSON only, no markdown fences: {"headline": <string>, "body": <string>}',
].join(" ");

/** The same glossary pass the worker runs before storing. */
const GLOSSARY: ReadonlyArray<[RegExp, string]> = [
  [/دلار\s*US\b/g, "دلار آمریکا"],
  [/دلار\s*آمریکا\s*US\b/g, "دلار آمریکا"],
  [/\bUS\s*dollar\b/gi, "دلار آمریکا"],
  [/\bUnited\s+States\b/g, "آمریکا"],
  [/\bthe\s+Federal\s+Reserve\b/gi, "فدرال رزرو آمریکا"],
  [/\bFederal\s+Reserve\b/gi, "فدرال رزرو آمریکا"],
  [/\bthe\s+Fed\b/g, "فدرال رزرو آمریکا"],
  [/\bFed\b/g, "فدرال رزرو"],
  [/\bEU\b/g, "اتحادیه اروپا"],
  [/\bUS\b/g, "آمریکا"],
  [/\bTreasury\b/g, "خزانه‌داری آمریکا"],
  [/\bECB\b/g, "بانک مرکزی اروپا"],
];
function faGlossary(text: string): string {
  let out = text;
  for (const [p, r] of GLOSSARY) out = out.replace(p, r);
  return out;
}

/** The same SHA-256 content hash the pipeline computes (canonical JSON {title, body}). */
async function contentHash(title: string, body: string): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify({ title, body }));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function runModel(model: string, headline: string, body: string): Promise<{ headline: string; body: string }> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${AI_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: CHAT_SYSTEM },
        { role: "user", content: JSON.stringify({ headline, body }) },
      ],
      max_tokens: 8192,
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const body_ = (await res.json().catch(() => null)) as { success?: boolean; result?: unknown; errors?: { message?: string }[] } | null;
  if (!res.ok || !body_ || body_.success !== true) {
    throw new Error(body_?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  const r = body_.result as Record<string, unknown> | null;
  const rawChat = r && Array.isArray(r.choices)
    ? ((r.choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content ?? null)
    : null;
  const rawLegacy = typeof r?.response === "string" ? r.response : null;
  const raw = typeof rawChat === "string" ? rawChat : rawLegacy;
  if (raw === null || raw.trim() === "") throw new Error("the model returned no content (empty channel)");
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("no JSON object found in the response");
  const p = JSON.parse(text.slice(first, last + 1)) as { headline?: unknown; body?: unknown };
  if (typeof p.headline !== "string" || !p.headline.trim()) throw new Error("the headline field is missing, empty, or not a string");
  if (typeof p.body !== "string" || !p.body.trim()) throw new Error("the body field is missing, empty, or not a string");
  return { headline: faGlossary(p.headline.trim()), body: faGlossary(p.body.trim()) };
}

/* ------------------------------------------------------------------ *
 * The run: every stored-but-untranslated row, in order
 * ------------------------------------------------------------------ */

interface TeRow {
  news_id: string;
  title: string;
  body: string;
  content_hash: string;
  status: string;
}
interface FaRow {
  news_id: string;
  content_hash: string;
}

const rows = await d1<TeRow>(
  `SELECT b.news_id, b.title, b.body, b.content_hash, b.status FROM te_briefing b
     LEFT JOIN te_briefing_fa f ON f.news_id = b.news_id
    WHERE b.status = 'ok' AND b.body <> '' AND (f.news_id IS NULL OR f.content_hash <> b.content_hash)
    ORDER BY b.published_at DESC LIMIT 10`,
);
console.log(`stored-but-untranslated rows: ${rows.length}${rows.length > 0 ? ` (${rows.map((r) => r.news_id).join(", ")})` : ""}`);

for (const row of rows) {
  const hashCheck = await contentHash(row.title, row.body);
  console.log(`\n=== ${row.news_id} — hash ${row.content_hash.slice(0, 12)}… (recomputed ${hashCheck.slice(0, 12)}… ${hashCheck === row.content_hash ? "MATCH" : "DIFFERS"})`);

  let fa: { headline: string; body: string } | null = null;
  let usedModel = "";
  const chain = [TRANSLATION_MODEL, ...FALLBACK_MODELS];
  for (const model of chain) {
    try {
      console.log(`trying ${model}…`);
      fa = await runModel(model, row.title, row.body);
      usedModel = model;
      break;
    } catch (e) {
      console.log(`  failed: ${e instanceof Error ? e.message : String(e)}`.slice(0, 220));
    }
  }
  if (fa === null) {
    console.log(`  ✗ every model failed — skipping ${row.news_id}`);
    continue;
  }
  if (fa.headline === row.title || fa.body === row.body) {
    console.log(`  ✗ identity discipline — the output equals its source, refusing to store`);
    continue;
  }
  console.log(`  ✓ ${usedModel}`);
  console.log(`  fa_title: ${fa.headline.slice(0, 100)}`);
  console.log(`  fa_body:  ${fa.body.slice(0, 100)}…`);

  if (DRY) {
    console.log("  (dry — not applied)");
    continue;
  }
  const nowIso = new Date().toISOString();
  await d1(
    `INSERT OR REPLACE INTO te_briefing_fa (news_id, fa_title, fa_body, source_model, translated_at, content_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.news_id, fa.headline, fa.body, usedModel, nowIso, row.content_hash],
  );
  await d1(`INSERT INTO te_scrape_log (ts, news_id, event, detail) VALUES (?, ?, 'translated', ?)`, [
    nowIso,
    row.news_id,
    `model ${usedModel} (chat contract, 2 strings), item ${row.news_id} — the backfill sitting`,
  ]);
  console.log(`  ✓ stored to te_briefing_fa + logged`);
}

console.log("\ndone.");
