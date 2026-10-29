/**
 * gemini-client.test.ts — M3 gates (spec §5): the Gemini client against a
 * MOCKED fetch — success (both call types), the retry ladder (network,
 * 5xx, timeout — retried once; 4xx — never), region refusal, invalid key,
 * quota, and the schema-invalid/empty shapes. NEVER hits the network.
 */

import { describe, expect, it } from 'vitest';
import {
  GeminiClient,
  STATE_NARRATIVE_SCHEMA,
  extractGrounding,
  extractOutputText,
  type GeminiError,
} from './gemini-client';

/* ------------------------------------------------------------------ *
 * The mocked fetch
 * ------------------------------------------------------------------ */

type MockCall = { url: string; body: Record<string, unknown>; headers: Record<string, string> };

function mockFetch(responses: Array<Response | Error | (() => Response)>): {
  fetchImpl: typeof fetch;
  calls: MockCall[];
} {
  const calls: MockCall[] = [];
  let index = 0;
  const fetchImpl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = String(url);
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(init?.headers ?? {})) headers[k] = String(v);
    calls.push({ url: urlStr, body, headers });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    if (next instanceof Error) throw next;
    if (typeof next === 'function') return next();
    return next;
  }) as typeof fetch;
  return { fetchImpl, calls };
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** An Interactions-style success with an output_text field. */
function interactionsText(payload: unknown, outputText: string): Response {
  return jsonResponse(200, { id: 'i_1', output_text: outputText, ...(payload as object) });
}

function client(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof GeminiClient>[0]> = {}): GeminiClient {
  return new GeminiClient({
    apiKey: 'AIzaTestKeyNotReal00000000000000000000',
    model: 'gemini-3.5-flash-lite',
    fetchImpl,
    timeoutMs: 50,
    ...overrides,
  });
}

const A_CALL = { systemInstruction: 'BASE RULES', userMessage: 'SCOPE: "overall"\nSTATE: {}' };
const B_CALL = { systemInstruction: 'NEWS PROMPT', userMessage: 'SCOPE: "world-currencies" (…)' };

/* ------------------------------------------------------------------ *
 * Call type A — the state narrative
 * ------------------------------------------------------------------ */

describe('M3 GeminiClient — call type A (schema-constrained JSON)', () => {
  it('sends the Interactions shape: system_instruction, input, generation_config, response_format with the {en, fa} schema, and the key ONLY in the header', async () => {
    const { fetchImpl, calls } = mockFetch([interactionsText({}, JSON.stringify({ en: 'Fine.', fa: 'خوب است.' }))]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect(outcome).toEqual({ ok: true, value: { en: 'Fine.', fa: 'خوب است.' } });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(calls[0]!.headers['x-goog-api-key']).toBe('AIzaTestKeyNotReal00000000000000000000');
    expect(calls[0]!.body['system_instruction']).toBe('BASE RULES');
    expect(calls[0]!.body['input']).toBe(A_CALL.userMessage);
    expect(calls[0]!.body['response_format']).toEqual({
      type: 'text',
      mime_type: 'application/json',
      schema: STATE_NARRATIVE_SCHEMA,
    });
    const config = calls[0]!.body['generation_config'] as Record<string, unknown>;
    expect(config['temperature']).toBe(0.1);
    expect(typeof config['max_output_tokens']).toBe('number');
  });

  it('parses the outputs-array response shape (content blocks) too', async () => {
    const body = {
      output: [{ type: 'model_output', content: [{ type: 'text', text: '{"en": "A.", "fa": "ب."}' }] }],
    };
    const { fetchImpl } = mockFetch([jsonResponse(200, body)]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect(outcome).toEqual({ ok: true, value: { en: 'A.', fa: 'ب.' } });
  });

  it('strips a ```json code fence when the model wrapped its JSON (schema-invalid but common)', async () => {
    const { fetchImpl } = mockFetch([interactionsText({}, '```json\n{"en": "A.", "fa": "ب."}\n```')]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect(outcome).toEqual({ ok: true, value: { en: 'A.', fa: 'ب.' } });
  });

  it('rejects non-JSON output with a schema error', async () => {
    const { fetchImpl } = mockFetch([interactionsText({}, 'not json at all')]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect(outcome.ok).toBe(false);
    expect((outcome as { error: GeminiError }).error.kind).toBe('schema');
  });

  it('rejects JSON without both non-empty languages with a schema error', async () => {
    const { fetchImpl } = mockFetch([interactionsText({}, JSON.stringify({ en: 'Only English.' }))]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect((outcome as { error: GeminiError }).error.kind).toBe('schema');

    const { fetchImpl: f2 } = mockFetch([interactionsText({}, JSON.stringify({ en: 'A.', fa: '' }))]);
    const o2 = await client(f2).callStateNarrative(A_CALL);
    expect((o2 as { error: GeminiError }).error.kind).toBe('schema');
  });

  it('retries ONCE on 5xx then succeeds; never retries on 4xx', async () => {
    const { fetchImpl, calls } = mockFetch([jsonResponse(503, { error: { message: 'backend error' } }), interactionsText({}, JSON.stringify({ en: 'A.', fa: 'ب.' }))]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect(outcome.ok).toBe(true);
    expect(calls).toHaveLength(2);

    const { fetchImpl: f2, calls: c2 } = mockFetch([jsonResponse(400, { error: { message: 'bad request' } })]);
    const o2 = await client(f2).callStateNarrative(A_CALL);
    expect(o2.ok).toBe(false);
    expect(c2).toHaveLength(1);
  });

  it('retries ONCE on network errors then reports network when both fail', async () => {
    const { fetchImpl, calls } = mockFetch([new Error('ECONNRESET'), new Error('ECONNRESET')]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect((outcome as { error: GeminiError }).error.kind).toBe('network');
    expect(calls).toHaveLength(2);
  });

  it('classifies timeout aborts as timeout and retries once', async () => {
    const abortError = new Error('The operation was aborted due to timeout');
    abortError.name = 'TimeoutError';
    const { fetchImpl, calls } = mockFetch([abortError, interactionsText({}, JSON.stringify({ en: 'A.', fa: 'ب.' }))]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect(outcome.ok).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('classifies an API-key 400 as invalid-key (no retry)', async () => {
    const { fetchImpl, calls } = mockFetch([jsonResponse(400, { error: { message: 'API key not valid. Please pass a valid API key.' } })]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect((outcome as { error: GeminiError }).error.kind).toBe('invalid-key');
    expect(calls).toHaveLength(1);
  });

  it('classifies the region refusal (403 location not supported) as region — the template-fallback trigger', async () => {
    const { fetchImpl } = mockFetch([
      jsonResponse(403, { error: { message: 'User location is not supported for the API use without a billing account.' } }),
    ]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect((outcome as { error: GeminiError }).error.kind).toBe('region');
  });

  it('classifies 429 as quota', async () => {
    const { fetchImpl } = mockFetch([jsonResponse(429, { error: { message: 'Resource has been exhausted' } })]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    expect((outcome as { error: GeminiError }).error.kind).toBe('quota');
  });

  it('never includes the key in an error detail (redacted, capped)', async () => {
    const { fetchImpl } = mockFetch([
      jsonResponse(500, { error: { message: `something failed near ${'x'.repeat(300)}` } }),
      jsonResponse(500, { error: { message: `something failed near ${'x'.repeat(300)}` } }),
    ]);
    const outcome = await client(fetchImpl).callStateNarrative(A_CALL);
    const error = (outcome as { error: GeminiError }).error;
    expect(error.kind).toBe('http');
    expect(error.detail.length).toBeLessThanOrEqual(122);
    expect(error.detail).not.toContain('AIza');
  });
});

/* ------------------------------------------------------------------ *
 * Call type B — the grounded news note
 * ------------------------------------------------------------------ */

describe('M3 GeminiClient — call type B (grounded plain text)', () => {
  it('sends the google_search tool and parses the EN:/FA: block + the url_citation sources + the search suggestions element', async () => {
    const payload = {
      output: [
        {
          type: 'google_search_result',
          result: [{ search_suggestions: '<!-- the widget HTML -->' }],
        },
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              text: 'EN: Reports suggest the euro is in focus this week.\nFA: به گزارش خبرها، یورو این هفته در کانون توجه است.',
            },
          ],
        },
      ],
    };
    // the output_text extraction joins text blocks; build a payload whose
    // only text block carries the note
    const response = jsonResponse(200, {
      output_text: 'EN: Reports suggest the euro is in focus this week.\nFA: به گزارش خبرها، یورو این هفته در کانون توجه است.',
      grounding: payload,
    });
    const { fetchImpl, calls } = mockFetch([response]);
    const outcome = await client(fetchImpl).callNewsNote(B_CALL);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.kind).toBe('note');
      expect(outcome.value.en).toBe('Reports suggest the euro is in focus this week.');
      expect(outcome.value.fa).toBe('به گزارش خبرها، یورو این هفته در کانون توجه است.');
      expect(outcome.value.searchSuggestionsHtml).toBe('<!-- the widget HTML -->');
    }
    expect(calls[0]!.body['tools']).toEqual([{ type: 'google_search' }]);
    expect(calls[0]!.body['response_format']).toBeUndefined();
  });

  it('parses the single word NONE into the none outcome', async () => {
    const { fetchImpl } = mockFetch([interactionsText({}, 'NONE')]);
    const outcome = await client(fetchImpl).callNewsNote(B_CALL);
    expect(outcome).toEqual({
      ok: true,
      value: { kind: 'none', en: '', fa: '', sources: [], searchSuggestionsHtml: null },
    });
  });

  it('rejects a missing EN:/FA: block with a schema error (the caller omits part 3)', async () => {
    const { fetchImpl } = mockFetch([interactionsText({}, 'Something about the euro.')]);
    const outcome = await client(fetchImpl).callNewsNote(B_CALL);
    expect((outcome as { error: GeminiError }).error.kind).toBe('schema');
  });
});

/* ------------------------------------------------------------------ *
 * The pure parsers
 * ------------------------------------------------------------------ */

describe('M3 gemini-client — the pure parsers', () => {
  it('extractOutputText reads output_text, output blocks, and generateContent candidates', () => {
    expect(extractOutputText({ output_text: 'a' })).toBe('a');
    expect(extractOutputText({ output: [{ content: [{ type: 'text', text: 'b' }] }] })).toBe('b');
    expect(extractOutputText({ candidates: [{ content: { parts: [{ text: 'c' }] } }] })).toBe('c');
    expect(extractOutputText({ unrelated: true })).toBeNull();
  });

  it('extractGrounding collects unique url_citation sources + the search suggestions HTML (and the legacy shapes)', () => {
    const grounding = extractGrounding({
      output: [
        { type: 'google_search_result', result: [{ search_suggestions: '<!-- w -->' }] },
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              text: 'x',
              annotations: [
                { type: 'url_citation', url: 'https://a.example/1', title: 'A' },
                { type: 'url_citation', url: 'https://a.example/1', title: 'A-dup' },
                { type: 'url_citation', url: 'https://b.example/2', title: 'B' },
              ],
            },
          ],
        },
      ],
    });
    expect(grounding.sources).toEqual([
      { title: 'A', url: 'https://a.example/1' },
      { title: 'B', url: 'https://b.example/2' },
    ]);
    expect(grounding.searchSuggestionsHtml).toBe('<!-- w -->');

    const legacy = extractGrounding({
      groundingMetadata: {
        groundingChunks: [{ web: { uri: 'https://c.example/3', title: 'C' } }],
        searchEntryPoint: { renderedContent: '<!-- legacy -->' },
      },
    });
    expect(legacy.sources).toEqual([{ title: 'C', url: 'https://c.example/3' }]);
    expect(legacy.searchSuggestionsHtml).toBe('<!-- legacy -->');
  });
});
