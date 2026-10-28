/**
 * cloudflare-ai-client.ts — the Cloudflare Workers AI narrator client (D-41).
 *
 * The owner asked to try Cloudflare's own models instead of Gemini. The
 * architectural win: the Worker uses a Workers AI **binding** (`env.AI.run`),
 * so there is NO API token and NO secret to manage at runtime — the binding
 * authenticates implicitly via the Cloudflare account. This is strictly
 * safer than the Gemini path (which needs `GEMINI_API_KEY` as a secret) and
 * eliminates D-31's region risk entirely (the call never leaves Cloudflare's
 * network → no 403 "location not supported").
 *
 * Implements the SAME `NarratorModelClient` interface as `GeminiClient`, so
 * the cron (M4) picks either from `NARRATOR_PROVIDER` with no branching at
 * the call site. Call type A is schema-constrained `{en, fa}` JSON (the
 * Workers AI `response_format: json_schema` path — re-verified live against
 * `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, the D-41 §3 pick: clean native
 * Farsi, 0% Latin, correct half-spaces, ~4s, ~50 neurons/call).
 *
 * Call type B (news, grounding): Workers AI has NO Google Search grounding.
 * Part 3 ships DISABLED on the cloudflare path (the cron clamps
 * `webContext=false` when `NARRATOR_PROVIDER=cloudflare`); this method
 * returns a clean not-available outcome so the stats stay honest if it is
 * ever reached defensively.
 *
 * Error taxonomy (a failure is a value, never a throw): quota (the neurons
 * daily cap), invalid-key (the binding is missing/misconfigured), timeout,
 * network, schema, empty. The 'region' kind is NEVER produced here — that
 * is the point of the pivot.
 *
 * Pure DI: the `ai` binding is injectable (the tests mock it; the Worker
 * passes `env.AI`). No I/O at import time.
 */

import type {
  NarratorModelClient,
  NarratorOutcome,
} from './model-client';
import type { StateNarrativeText, NewsNoteText, GeminiError } from './gemini-client';
import { STATE_NARRATIVE_SCHEMA } from './gemini-client';

/**
 * The Workers AI binding surface this client speaks. Duck-typed (the
 * `@cloudflare/workers-types` Ai type is not in this repo's installed
 * version) — `.run(model, input)` returns `{ response: string|object,
 * usage?: {...} }`. The Worker's `env.AI` matches this after the
 * `ai` binding is added to wrangler.jsonc (D-41 §4).
 */
export interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface CloudflareAiClientOptions {
  ai: AiBinding;
  model: string;
  /** Default: 15_000 ms (spec §5 — same as the Gemini client). */
  timeoutMs?: number;
}

/** The {en, fa} JSON schema sent as response_format on call type A. */
const JSON_SCHEMA_RESPONSE_FORMAT = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'narration',
    schema: STATE_NARRATIVE_SCHEMA,
    strict: true,
  },
};

export class CloudflareAiClient implements NarratorModelClient {
  private readonly ai: AiBinding;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: CloudflareAiClientOptions) {
    this.ai = options.ai;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async callStateNarrative(params: {
    systemInstruction: string;
    userMessage: string;
    maxOutputTokens?: number;
    temperature?: number;
  }): Promise<NarratorOutcome<StateNarrativeText>> {
    const input = {
      messages: [
        { role: 'system', content: params.systemInstruction },
        { role: 'user', content: params.userMessage },
      ],
      temperature: params.temperature ?? 0.2,
      max_tokens: params.maxOutputTokens ?? 900,
      response_format: JSON_SCHEMA_RESPONSE_FORMAT,
    };

    const outcome = await this.runWithRetry(input);
    if (!outcome.ok) return outcome;

    const text = extractBindingText(outcome.value);
    if (text === null || text.trim() === '') {
      return { ok: false, error: { kind: 'empty', detail: 'the model returned no text' } };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFence(text));
    } catch {
      return { ok: false, error: { kind: 'schema', detail: `not JSON: ${redact(text)}` } };
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>)['en'] !== 'string' ||
      typeof (parsed as Record<string, unknown>)['fa'] !== 'string' ||
      (parsed as Record<string, unknown>)['en'] === '' ||
      (parsed as Record<string, unknown>)['fa'] === ''
    ) {
      return { ok: false, error: { kind: 'schema', detail: `not {en, fa}: ${redact(text)}` } };
    }
    const obj = parsed as { en: string; fa: string };
    return { ok: true, value: { en: obj.en, fa: obj.fa } };
  }

  async callNewsNote(params: {
    systemInstruction: string;
    userMessage: string;
    maxOutputTokens?: number;
  }): Promise<NarratorOutcome<NewsNoteText>> {
    // Workers AI has no Google Search grounding → Part 3 is unavailable on
    // this path. The cron clamps `webContext=false` when the provider is
    // cloudflare, so this method is not reached at runtime; returning the
    // honest not-available outcome keeps the stats clean if it ever is.
    void params;
    return {
      ok: false,
      error: {
        kind: 'region',
        detail: 'workers-ai has no google-search grounding; part 3 disabled on the cloudflare path (D-41)',
      },
    };
  }

  /**
   * One call to the binding, with the 15 s timeout + ONE retry on
   * network/timeout (spec §5). A thrown binding error is classified: the
   * neurons-exhausted message → 'quota'; an auth/binding message →
   * 'invalid-key'; anything else → 'network'.
   */
  private async runWithRetry(
    input: Record<string, unknown>,
  ): Promise<NarratorOutcome<unknown>> {
    let lastError: GeminiError | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const outcome = await this.runOnce(input);
      if (outcome.ok) return outcome;
      lastError = outcome.error;
      // Retry only on transient classes (network/timeout). Quota/invalid-key/
      // schema/empty are terminal — no point retrying.
      const kind = outcome.error.kind;
      if (kind !== 'network' && kind !== 'timeout') break;
    }
    return { ok: false, error: lastError! };
  }

  private async runOnce(input: Record<string, unknown>): Promise<NarratorOutcome<unknown>> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        this.ai.run(this.model, input),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error('WORKERS_AI_TIMEOUT'));
          }, this.timeoutMs);
        }),
      ]);
      return { ok: true, value: result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'WORKERS_AI_TIMEOUT') {
        return { ok: false, error: { kind: 'timeout', detail: `workers-ai run exceeded ${this.timeoutMs}ms` } };
      }
      const lower = msg.toLowerCase();
      if (lower.includes('neuron') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('daily limit')) {
        return { ok: false, error: { kind: 'quota', detail: redact(msg) } };
      }
      if (lower.includes('auth') || lower.includes('binding') || lower.includes('not defined') || lower.includes('ai is not')) {
        return { ok: false, error: { kind: 'invalid-key', detail: 'the AI binding is missing or misconfigured (D-41)' } };
      }
      return { ok: false, error: { kind: 'network', detail: redact(msg) } };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Response parsing helpers (mirror the gemini-client discipline)
 * ------------------------------------------------------------------ */

/** Extract the plain text from a Workers AI binding result. */
export function extractBindingText(result: unknown): string | null {
  if (result === null || result === undefined) return null;
  // 1. The binding's `{ response: string|object, usage }` shape.
  if (typeof result === 'object' && !Array.isArray(result)) {
    const root = result as Record<string, unknown>;
    const resp = root['response'];
    if (typeof resp === 'string') return resp;
    if (typeof resp === 'object' && resp !== null) {
      // Some models with json_schema return the parsed object directly.
      try {
        return JSON.stringify(resp);
      } catch {
        /* fall through */
      }
    }
    // 2. The OpenAI-compatible shape (choices[0].message.content) — used by
    //    some @cf models; the reasoning models put text in `.reasoning`.
    const choices = root['choices'];
    if (Array.isArray(choices) && choices.length > 0) {
      const msg = (choices[0] as Record<string, unknown> | undefined)?.['message'];
      if (typeof msg === 'object' && msg !== null) {
        const content = (msg as Record<string, unknown>)['content'];
        if (typeof content === 'string') return content;
      }
    }
    // 3. A direct {en, fa} object (some json_schema returns).
    if (typeof root['en'] === 'string' && typeof root['fa'] === 'string') {
      try {
        return JSON.stringify(root);
      } catch {
        /* fall through */
      }
    }
  }
  if (typeof result === 'string') return result;
  return null;
}

function redact(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 120)}…` : oneLine;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const end = trimmed.lastIndexOf('```');
    if (end > 3) {
      const inner = trimmed.slice(3, end);
      // Drop an optional language tag on the first line.
      const nl = inner.indexOf('\n');
      return nl >= 0 ? inner.slice(nl + 1).trim() : inner.trim();
    }
  }
  return trimmed;
}
