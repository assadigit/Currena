/**
 * gemini-client.ts — M3 of the Layer-2 narrator build (spec §5): the
 * Gemini REST client. Two call types:
 *
 *   - **Call type A (state narratives, no internet):** one call per unit
 *     returning both languages as JSON `{"en": string, "fa": string}`,
 *     schema-constrained, temperature 0.2, short max tokens, a 15 s
 *     timeout, ONE retry on network/5xx/timeout.
 *   - **Call type B (news context, Google Search grounding):** a SEPARATE
 *     plain-text call per section (never mixed with A) parsing the fixed
 *     two-block `EN: … / FA: …` format (or the single word NONE), with
 *     the grounding sources (url_citation title+url) and Google's
 *     required search-suggestions display element when present.
 *
 * Speaks the CURRENT canonical REST surface — the Interactions API
 * (D-28, re-verified 2026-10-28): `POST
 * https://generativelanguage.googleapis.com/v1beta/interactions` with the
 * `x-goog-api-key` header and `{model, system_instruction, input,
 * generation_config, response_format, tools}`. The response's plain-text
 * JSON shape is not published statically; `extractOutputText` reads the
 * documented shapes defensively (`output_text`, the output/outputs
 * content blocks, and the generateContent-style candidates as a
 * compatibility fallback). The set-key tool's one validation call is the
 * live shape check.
 *
 * Error taxonomy (every failure is a VALUE, never a throw): invalid-key,
 * quota, region (the documented 403 "location not supported"), http,
 * network, timeout, schema, empty. Region refusals and HTTP errors carry
 * a SHORT redacted detail — never the key, never the full prompt or raw
 * output (spec §5's "never log the key, full prompts with state, or raw
 * model output beyond a short truncated debug line").
 *
 * Pure DI: `fetchImpl` is injectable (the tests mock it; the Worker and
 * the scripts pass the platform's fetch). No I/O at import time, no
 * clock, no globals.
 */

/* ------------------------------------------------------------------ *
 * The result types (a failure is a value, never a throw)
 * ------------------------------------------------------------------ */

export type GeminiErrorKind =
  | 'invalid-key'
  | 'quota'
  | 'region'
  | 'http'
  | 'network'
  | 'timeout'
  | 'schema'
  | 'empty';

export interface GeminiError {
  kind: GeminiErrorKind;
  /** A short, redacted detail line (never the key, prompt or raw output). */
  detail: string;
  /** The HTTP status when the error came from a response. */
  status?: number;
}

export type GeminiOutcome<T> = { ok: true; value: T } | { ok: false; error: GeminiError };

/** Call type A's payload: both languages. */
export interface StateNarrativeText {
  en: string;
  fa: string;
}

/** Call type B's payload: the note (or NONE) + the grounding metadata. */
export interface NewsNoteText {
  /** Exactly 'none' when the model answered the single word NONE. */
  kind: 'note' | 'none';
  en: string;
  fa: string;
  /** The grounding sources (unique by url; title + url), for W1 + display. */
  sources: { title: string; url: string }[];
  /** Google's required search-suggestions display element (HTML), when present. */
  searchSuggestionsHtml: string | null;
}

/* ------------------------------------------------------------------ *
 * The client
 * ------------------------------------------------------------------ */

export interface GeminiClientOptions {
  apiKey: string;
  model: string;
  /** Default: https://generativelanguage.googleapis.com/v1beta */
  baseUrl?: string;
  /** Default: the platform fetch (injectable for tests). */
  fetchImpl?: typeof fetch;
  /** Default: 15_000 ms (spec §5). */
  timeoutMs?: number;
}

/** The {en, fa} JSON schema sent as response_format on call type A (the Interactions API's structured output). */
export const STATE_NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    en: { type: 'string' },
    fa: { type: 'string' },
  },
  required: ['en', 'fa'],
  additionalProperties: false,
} as const;

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: GeminiClientOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  /**
   * Call type A — one state narrative, schema-constrained, both languages.
   * One retry on network/5xx/timeout (spec §5). Returns the parsed
   * {en, fa} or a typed error.
   */
  async callStateNarrative(params: {
    systemInstruction: string;
    userMessage: string;
    maxOutputTokens?: number;
    temperature?: number;
  }): Promise<GeminiOutcome<StateNarrativeText>> {
    const body = {
      model: this.model,
      system_instruction: params.systemInstruction,
      input: params.userMessage,
      generation_config: {
        temperature: params.temperature ?? 0.2,
        max_output_tokens: params.maxOutputTokens ?? 600,
      },
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: STATE_NARRATIVE_SCHEMA,
      },
    };

    const outcome = await this.postWithRetry(body);
    if (!outcome.ok) return outcome;
    const text = outcome.text;
    if (text.trim() === '') {
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

  /**
   * Call type B — the grounded news note (NEVER mixed with call type A).
   * Plain text (grounding cannot ride the schema-constrained format),
   * parsing the fixed `EN: … / FA: …` block or the single word NONE.
   */
  async callNewsNote(params: {
    systemInstruction: string;
    userMessage: string;
    maxOutputTokens?: number;
  }): Promise<GeminiOutcome<NewsNoteText>> {
    const body = {
      model: this.model,
      system_instruction: params.systemInstruction,
      input: params.userMessage,
      generation_config: {
        max_output_tokens: params.maxOutputTokens ?? 300,
      },
      tools: [{ type: 'google_search' }],
    };

    const outcome = await this.postWithRetry(body);
    if (!outcome.ok) return outcome;
    const { text, response } = outcome;

    if (text.trim() === 'NONE' || text.trim() === '') {
      return {
        ok: true,
        value: { kind: 'none', en: '', fa: '', sources: [], searchSuggestionsHtml: null },
      };
    }

    const en = matchLabeledBlock(text, 'EN');
    const fa = matchLabeledBlock(text, 'FA');
    if (en === null || fa === null) {
      return {
        ok: false,
        error: { kind: 'schema', detail: `no EN:/FA: block: ${redact(text)}` },
      };
    }

    const grounding = extractGrounding(response);
    return {
      ok: true,
      value: {
        kind: 'note',
        en,
        fa,
        sources: grounding.sources,
        searchSuggestionsHtml: grounding.searchSuggestionsHtml,
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * The transport (POST + one retry on network/5xx/timeout)
   * ---------------------------------------------------------------- */

  private async postWithRetry(
    body: Record<string, unknown>,
  ): Promise<{ ok: true; text: string; response: unknown } | { ok: false; error: GeminiError }> {
    const attempt = () => this.postOnce(body);

    const first = await attempt();
    if (first.ok) return first;
    const retryable =
      first.error.kind === 'network' || first.error.kind === 'timeout' || (first.error.kind === 'http' && (first.error.status ?? 0) >= 500);
    if (!retryable) return first;

    const second = await attempt();
    if (second.ok) return second;
    return { ok: false, error: second.error };
  }

  private async postOnce(
    body: Record<string, unknown>,
  ): Promise<{ ok: true; text: string; response: unknown } | { ok: false; error: GeminiError }> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('abort') || (err as { name?: string }).name === 'TimeoutError') {
        return { ok: false, error: { kind: 'timeout', detail: `request timed out after ${this.timeoutMs} ms` } };
      }
      return { ok: false, error: { kind: 'network', detail: redact(message) } };
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return { ok: false, error: classifyHttpError(response.status, errorBody) };
    }

    const json: unknown = await response.json().catch(() => null);
    if (json === null) {
      return { ok: false, error: { kind: 'schema', detail: 'the response is not JSON' } };
    }
    const text = extractOutputText(json);
    if (text === null) {
      return { ok: false, error: { kind: 'schema', detail: 'no output text in the response' } };
    }
    return { ok: true, text, response: json };
  }
}

/* ------------------------------------------------------------------ *
 * Error classification
 * ------------------------------------------------------------------ */

/** Classify an HTTP failure by status + the body's error message (redacted). */
export function classifyHttpError(status: number, body: string): GeminiError {
  const message = extractErrorMessage(body);
  const detail = message !== null ? redact(message) : `HTTP ${status}`;
  if (status === 400 && /api[\s_-]?key/i.test(body)) {
    return { kind: 'invalid-key', status, detail };
  }
  if (status === 401 || status === 403) {
    if (/location|region|country/i.test(body) || /location is not supported/i.test(body)) {
      return { kind: 'region', status, detail };
    }
    if (/api[\s_-]?key|permission|unauthenticated/i.test(body)) {
      return { kind: 'invalid-key', status, detail };
    }
    return { kind: 'http', status, detail };
  }
  if (status === 429) {
    return { kind: 'quota', status, detail };
  }
  return { kind: 'http', status, detail };
}

function extractErrorMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message ?? null;
  } catch {
    return body.trim() === '' ? null : body.trim();
  }
}

/** Redact a detail line: cap the length (never a full prompt or raw output). */
function redact(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 120)}…` : oneLine;
}

/* ------------------------------------------------------------------ *
 * Response parsing (the documented shapes, defensively)
 * ------------------------------------------------------------------ */

/**
 * Extract the model's plain-text output from an Interactions response.
 * The static docs publish SDK helpers (`output_text`) but not the raw
 * JSON; read the plausible shapes in order, then the generateContent-style
 * candidates as a compatibility fallback.
 */
export function extractOutputText(json: unknown): string | null {
  if (typeof json !== 'object' || json === null) return null;
  const root = json as Record<string, unknown>;

  // 1. The documented helper's likely REST mirror.
  if (typeof root['output_text'] === 'string' && root['output_text'].trim() !== '') {
    return root['output_text'];
  }

  // 2. The outputs / output step arrays: content blocks of type text.
  for (const key of ['outputs', 'output', 'steps']) {
    const arr = root[key];
    if (Array.isArray(arr)) {
      const text = collectTextBlocks(arr);
      if (text !== null) return text;
    }
  }

  // 3. generateContent-style candidates (compatibility fallback).
  const candidates = root['candidates'];
  if (Array.isArray(candidates)) {
    const parts = (candidates[0] as Record<string, unknown> | undefined)?.['content'];
    if (typeof parts === 'object' && parts !== null) {
      const partsArr = (parts as Record<string, unknown>)['parts'];
      if (Array.isArray(partsArr)) {
        const text = collectTextBlocks(partsArr);
        if (text !== null) return text;
      }
    }
  }

  return null;
}

/** Walk an array of content blocks collecting `type: 'text'` texts (or `text` strings). */
function collectTextBlocks(blocks: readonly unknown[]): string | null {
  const out: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') return;
    if (value === null || typeof value !== 'object') return;
    const obj = value as Record<string, unknown>;
    if (obj['type'] === 'text' && typeof obj['text'] === 'string') {
      out.push(obj['text'] as string);
      return;
    }
    if (typeof obj['text'] === 'string' && Object.keys(obj).length <= 3) {
      out.push(obj['text'] as string);
      return;
    }
    for (const key of ['content', 'parts', 'outputs', 'output']) {
      const child = obj[key];
      if (Array.isArray(child)) {
        for (const c of child) walk(c);
      } else if (typeof child === 'object' && child !== null) {
        walk(child);
      }
    }
  };
  for (const block of blocks) walk(block);
  return out.length > 0 ? out.join('') : null;
}

/** Strip a ```json code fence if the model wrapped its JSON (schema-invalid but common). */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  }
  return trimmed;
}

/** Match `LABEL: <the rest of the line>` (call type B's fixed two-block format). */
function matchLabeledBlock(text: string, label: 'EN' | 'FA'): string | null {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'm');
  const m = text.match(re);
  return m === null ? null : m[1]!.trim();
}

/** The grounding metadata the news call needs: the url_citation sources + Google's search-suggestions display element. */
export function extractGrounding(json: unknown): {
  sources: { title: string; url: string }[];
  searchSuggestionsHtml: string | null;
} {
  const sources: { title: string; url: string }[] = [];
  const seenUrls = new Set<string>();
  let searchSuggestionsHtml: string | null = null;

  const walk = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const v of value) walk(v);
      return;
    }
    const obj = value as Record<string, unknown>;

    // url_citation annotations (the current grounding shape, D-29)
    if (obj['type'] === 'url_citation' && typeof obj['url'] === 'string' && typeof obj['title'] === 'string') {
      if (!seenUrls.has(obj['url'])) {
        seenUrls.add(obj['url']);
        sources.push({ title: obj['title'], url: obj['url'] });
      }
    }
    // the legacy groundingChunks shape (compatibility)
    if ('web' in obj) {
      const web = obj['web'];
      if (typeof web === 'object' && web !== null) {
        const w = web as Record<string, unknown>;
        if (typeof w['uri'] === 'string' && typeof w['title'] === 'string' && !seenUrls.has(w['uri'])) {
          seenUrls.add(w['uri']);
          sources.push({ title: w['title'], url: w['uri'] });
        }
      }
    }
    // Google's required display element (the search suggestions widget HTML)
    if (searchSuggestionsHtml === null && typeof obj['search_suggestions'] === 'string') {
      searchSuggestionsHtml = obj['search_suggestions'];
    }
    if (searchSuggestionsHtml === null && typeof obj['searchEntryPoint'] === 'object' && obj['searchEntryPoint'] !== null) {
      const rendered = (obj['searchEntryPoint'] as Record<string, unknown>)['renderedContent'];
      if (typeof rendered === 'string') searchSuggestionsHtml = rendered;
    }

    for (const v of Object.values(obj)) walk(v);
  };

  walk(json);
  return { sources, searchSuggestionsHtml };
}
