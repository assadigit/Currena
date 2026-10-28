/**
 * cloudflare-ai-client.test.ts — D-41 gates: the Cloudflare Workers AI
 * narrator client against a MOCKED Ai binding. Mirrors the gemini-client
 * test discipline: success (call type A schema JSON), the retry ladder
 * (network + timeout retried once; quota/invalid-key terminal), the
 * schema-invalid/empty shapes, and the Part-3 not-available outcome.
 * NEVER hits the network (the binding is a fake).
 */

import { describe, expect, it, vi } from 'vitest';
import { CloudflareAiClient, extractBindingText, type AiBinding } from './cloudflare-ai-client';

/* ------------------------------------------------------------------ *
 * The mocked Ai binding
 * ------------------------------------------------------------------ */

type RunCall = { model: string; input: Record<string, unknown> };

function mockAi(responses: Array<unknown | Error | (() => unknown)>): { ai: AiBinding; calls: RunCall[] } {
  const calls: RunCall[] = [];
  let index = 0;
  const ai: AiBinding = {
    async run(model: string, input: Record<string, unknown>): Promise<unknown> {
      calls.push({ model, input });
      const next = responses[Math.min(index, responses.length - 1)];
      index += 1;
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next();
      return next;
    },
  };
  return { ai, calls };
}

/** The binding's `{ response: "<json string>", usage }` shape (Llama 3.3). */
function bindingResponse(en: string, fa: string): unknown {
  return { response: JSON.stringify({ en, fa }), usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 } };
}

const GOOD_EN = 'The Global section reads Stressed today. A few readings sit in warning. This explains the data and is not financial advice.';
const GOOD_FA = 'بخش جهانی امروز پرتنش است. چند شاخص در وضعیت هشدار است. این صفحه داده‌ها را ساده می‌کند و توصیهٔ مالی نیست.';

describe('D-41 CloudflareAiClient.callStateNarrative — the success path', () => {
  it('parses the {en, fa} JSON string from the binding response', async () => {
    const { ai, calls } = mockAi([bindingResponse(GOOD_EN, GOOD_FA)]);
    const client = new CloudflareAiClient({ ai, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' });
    const outcome = await client.callStateNarrative({
      systemInstruction: 'base rules + section task',
      userMessage: 'SCOPE: global\nSTATE: {...}\nVOCABULARY: {...}',
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.en).toBe(GOOD_EN);
      expect(outcome.value.fa).toBe(GOOD_FA);
    }
    // The call carried the json_schema response_format + temperature 0.2.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    const input = calls[0]!.input;
    expect(input['temperature']).toBe(0.2);
    expect(input['max_tokens']).toBe(600);
    expect((input['response_format'] as Record<string, unknown>)['type']).toBe('json_schema');
    const messages = input['messages'] as Array<{ role: string; content: string }>;
    expect(messages[0]!.role).toBe('system');
    expect(messages[1]!.role).toBe('user');
  });

  it('accepts a response that is already a parsed {en, fa} object', async () => {
    const { ai } = mockAi([{ response: { en: GOOD_EN, fa: GOOD_FA }, usage: {} }]);
    const client = new CloudflareAiClient({ ai, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.value.fa).toBe(GOOD_FA);
  });

  it('accepts the OpenAI-compatible choices[0].message.content shape', async () => {
    const { ai } = mockAi([
      { choices: [{ message: { content: JSON.stringify({ en: GOOD_EN, fa: GOOD_FA }) } }] },
    ]);
    const client = new CloudflareAiClient({ ai, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(true);
  });

  it('strips a ```json code fence before parsing', async () => {
    const { ai } = mockAi([{ response: '```json\n' + JSON.stringify({ en: GOOD_EN, fa: GOOD_FA }) + '\n```' }]);
    const client = new CloudflareAiClient({ ai, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(true);
  });
});

describe('D-41 CloudflareAiClient.callStateNarrative — the failure taxonomy', () => {
  it('a network throw retries ONCE then returns network', async () => {
    const { ai, calls } = mockAi([new Error('connection reset'), bindingResponse(GOOD_EN, GOOD_FA)]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(true); // the retry succeeded
    expect(calls).toHaveLength(2);
  });

  it('two network throws → network error (retry exhausted)', async () => {
    const { ai, calls } = mockAi([new Error('connection reset'), new Error('connection reset')]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('network');
    expect(calls).toHaveLength(2);
  });

  it('a quota message is terminal (no retry) → quota', async () => {
    const { ai, calls } = mockAi([new Error('Daily neuron limit exceeded for this account')]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('quota');
    expect(calls).toHaveLength(1);
  });

  it('a missing-binding error → invalid-key (no retry)', async () => {
    const { ai, calls } = mockAi([new Error('env.AI is not defined')]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('invalid-key');
    expect(calls).toHaveLength(1);
  });

  it('a timeout retries once then returns timeout', async () => {
    // Two slow responses that each exceed the 50ms timeout.
    const slow = (): Promise<unknown> => new Promise((_, reject) => setTimeout(() => reject(new Error('WORKERS_AI_TIMEOUT')), 200));
    const { ai, calls } = mockAi([slow, slow]);
    const client = new CloudflareAiClient({ ai, model: 'm', timeoutMs: 50 });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('timeout');
    expect(calls).toHaveLength(2);
  }, 10000);

  it('an empty response → empty (terminal)', async () => {
    const { ai } = mockAi([{ response: '' }]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('empty');
  });

  it('a non-JSON response → schema', async () => {
    const { ai } = mockAi([{ response: 'this is not json at all' }]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('schema');
  });

  it('JSON missing the fa field → schema', async () => {
    const { ai } = mockAi([{ response: JSON.stringify({ en: GOOD_EN }) }]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('schema');
  });

  it('JSON with an empty en → schema', async () => {
    const { ai } = mockAi([{ response: JSON.stringify({ en: '', fa: GOOD_FA }) }]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('schema');
  });
});

describe('D-41 CloudflareAiClient.callNewsNote — Part 3 unavailable', () => {
  it('returns the not-available outcome (workers-ai has no grounding)', async () => {
    const { ai, calls } = mockAi([]);
    const client = new CloudflareAiClient({ ai, model: 'm' });
    const outcome = await client.callNewsNote({ systemInstruction: 'news rules', userMessage: 'SCOPE: global' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('region');
    // Never reached the binding.
    expect(calls).toHaveLength(0);
  });
});

describe('D-41 extractBindingText — the shape parser', () => {
  it('reads response as a string', () => {
    expect(extractBindingText({ response: 'hello' })).toBe('hello');
  });
  it('reads response as an object (stringified)', () => {
    expect(extractBindingText({ response: { en: 'a', fa: 'ب' } })).toBe(JSON.stringify({ en: 'a', fa: 'ب' }));
  });
  it('reads the OpenAI choices shape', () => {
    expect(extractBindingText({ choices: [{ message: { content: 'hi' } }] })).toBe('hi');
  });
  it('reads a bare {en, fa} root', () => {
    expect(extractBindingText({ en: 'a', fa: 'ب' })).toBe(JSON.stringify({ en: 'a', fa: 'ب' }));
  });
  it('reads a bare string', () => {
    expect(extractBindingText('plain')).toBe('plain');
  });
  it('null → null', () => {
    expect(extractBindingText(null)).toBeNull();
  });
});

describe('D-41 CloudflareAiClient — the spy confirms the json_schema request body', () => {
  it('sends temperature 0.2 + max_tokens 600 + the json_schema format', async () => {
    const run = vi.fn(async (sourceModel: string, sourceInput: Record<string, unknown>) => {
      void sourceModel;
      void sourceInput;
      return bindingResponse(GOOD_EN, GOOD_FA);
    });
    const ai: AiBinding = { run };
    const client = new CloudflareAiClient({ ai, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' });
    await client.callStateNarrative({ systemInstruction: 's', userMessage: 'u', temperature: 0.2 });
    expect(run).toHaveBeenCalledTimes(1);
    const calls = run.mock.calls as Array<[string, Record<string, unknown>]>;
    const [, input] = calls[0]!;
    expect(input['temperature']).toBe(0.2);
    const rf = input['response_format'] as Record<string, unknown>;
    expect(rf['type']).toBe('json_schema');
    expect((rf['json_schema'] as Record<string, unknown>)['strict']).toBe(true);
  });
});
