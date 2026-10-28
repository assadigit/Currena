/**
 * narrator-cron.test.ts — M4 gates: the narrator's generation rung against
 * an in-memory KV + the live-captured section fixtures. NEVER hits the
 * network (the model client's fetch is mocked where the enabled path is
 * exercised); never touches live sites.
 *
 * Pins the spec's behaviours: the capped batch (3/tick) with the pending
 * continuation, the 24 h age + prompt-version regeneration rules, the
 * template path when disabled/keyless/failing, the ai path on success with
 * the V1–V10 gate, the api-error taxonomy in the stats, and ONE write per
 * changed cycle.
 */

import { describe, expect, it, vi } from 'vitest';
import type { InsightsSnapshot } from '@currena/core';
// The live-captured section fixture (both boards + the insights input) —
// a static JSON import (the api tsconfig has no node: types; the fixture
// is data, read at test time from the committed file).
import overallLiveFixture from '../../../packages/insights/fixtures/narration/sections/overall-live.json';
import { INSIGHTS_SNAPSHOT_PUBLIC_KEY } from '@currena/insights/store';
import { MARKETS_KV_KEY } from '@currena/insights/markets';
import { FX_KV_KEY } from '@currena/insights/fx';
import {
  NARRATIVE_KV_KEY,
  narratorFlagsOf,
  parseNarrativeDoc,
  runScheduledNarrator,
} from './narrator-cron';
import { NARRATOR_STATS_KEY, parseStatsDoc } from './narrator-stats';
import type { Bindings } from './index';

interface FixtureFile {
  now: string;
  input: { insights: InsightsSnapshot; fx?: unknown; markets?: unknown };
}

function loadFixture(): FixtureFile {
  return overallLiveFixture as unknown as FixtureFile;
}

function makeKv(seeded: Record<string, string> = {}): { kv: KVNamespace; map: Map<string, string> } {
  const map = new Map<string, string>(Object.entries(seeded));
  const kv = {
    get: async (key: string): Promise<string | null> => map.get(key) ?? null,
    put: async (key: string, value: string): Promise<void> => {
      map.set(key, value);
    },
    delete: async (key: string): Promise<void> => {
      map.delete(key);
    },
  } as unknown as KVNamespace;
  return { kv, map };
}

function seedDocuments(map: Map<string, string>): void {
  const fixture = loadFixture();
  map.set(INSIGHTS_SNAPSHOT_PUBLIC_KEY, JSON.stringify(fixture.input.insights));
  if (fixture.input.markets !== undefined) map.set(MARKETS_KV_KEY, JSON.stringify(fixture.input.markets));
  if (fixture.input.fx !== undefined) map.set(FX_KV_KEY, JSON.stringify(fixture.input.fx));
}

function env(overrides: Partial<Bindings> = {}): Bindings {
  return {
    RATES: undefined as unknown as KVNamespace,
    ...overrides,
  } as Bindings;
}

const NOW = new Date('2026-10-28T09:50:00.000Z');
const LATER = new Date('2026-10-28T10:50:00.000Z');
const NEXT_DAY = new Date('2026-10-30T09:50:00.000Z'); // >24 h past every stored unit

/** A mocked fetch that answers every call with the given Response body factory. */
function fetchAnswering(respond: (body: Record<string, unknown>) => Response): typeof fetch {
  return (async (_url: RequestInfo | URL, init?: RequestInit) => {
    const requestBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    return respond(requestBody);
  }) as typeof fetch;
}

/**
 * A mocked model answer that passes V1–V10 for every unit in the fixture
 * set: 4 sentences (inside both the section 3–5 and the overall 4–6
 * windows), no digits, no names, no tone words, no banned words.
 */
const AI_GOOD = JSON.stringify({
  en: 'A plain-language summary sits here. It explains the day in simple words. The wording stays short and clear. This is not financial advice.',
  fa: 'یک خلاصهٔ ساده اینجاست. روز را با کلمات ساده توضیح می‌دهد. متن کوتاه و روشن است. این یک توصیهٔ مالی نیست.',
});

describe('M4 narratorFlagsOf — the env flag resolution', () => {
  it('defaults: disabled, invisible, no web context, cap 20, gemini-3.5-flash-lite, no key, provider gemini', () => {
    const flags = narratorFlagsOf(env({}));
    expect(flags).toEqual({
      enabled: false,
      webContext: false,
      webDailyCap: 20,
      model: 'gemini-3.5-flash-lite',
      hasKey: false,
      provider: 'gemini',
    });
  });

  it('reads the wrangler vars + the secret', () => {
    const flags = narratorFlagsOf(
      env({
        NARRATOR_ENABLED: 'true',
        NARRATOR_WEB_CONTEXT: 'true',
        NARRATOR_WEB_DAILY_CAP: '5',
        NARRATOR_MODEL: 'gemini-3.8-flash',
        GEMINI_API_KEY: 'AIzaTestKeyNotReal00000000000000000000',
      }),
    );
    expect(flags.enabled).toBe(true);
    expect(flags.webContext).toBe(true);
    expect(flags.webDailyCap).toBe(5);
    expect(flags.model).toBe('gemini-3.8-flash');
    expect(flags.hasKey).toBe(true);
    expect(flags.provider).toBe('gemini');
  });
});

describe('M4 runScheduledNarrator — the template-only deployments (the M4 default)', () => {
  it('no public projection yet: logs, counts the run, writes only stats', async () => {
    const { kv, map } = makeKv();
    const result = await runScheduledNarrator(env({ RATES: kv }), { now: NOW });
    expect(result).toMatchObject({ evaluated: 0, regenerated: 0, wrote: false });
    expect(map.has(NARRATIVE_KV_KEY)).toBe(false);
    expect(parseStatsDoc(map.get(NARRATOR_STATS_KEY)!).days['2026-10-28']!.runs).toBe(1);
  });

  it('disabled (NARRATOR_ENABLED=false): writes TEMPLATE narratives, capped 3 units per tick, pending continues', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const e = env({ RATES: kv, NARRATOR_ENABLED: 'false' });

    const tick1 = await runScheduledNarrator(e, { now: NOW });
    expect(tick1.evaluated).toBe(5); // 4 sections + overall
    expect(tick1.regenerated).toBe(3); // the cap: overall + global + australia
    expect(tick1.templateUsed).toBe(3);
    expect(tick1.wrote).toBe(true);

    const doc1 = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(doc1.promptVersion).toBe(2);
    // page order: the overall + the first two sections; the rest pending
    expect(Object.keys(doc1.sections).sort()).toEqual(['australia', 'global']);
    expect(doc1.overall.source).toBe('template');
    expect(doc1.overall.en.length).toBeGreaterThan(0);
    for (const unit of Object.values(doc1.sections)) {
      expect(unit.source).toBe('template');
      expect(unit.en.length).toBeGreaterThan(0);
      expect(unit.fa.length).toBeGreaterThan(0);
    }

    const tick2 = await runScheduledNarrator(e, { now: LATER });
    expect(tick2.regenerated).toBe(2); // world-markets + world-currencies
    const doc2 = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(Object.keys(doc2.sections).sort()).toEqual(['australia', 'global', 'world-currencies', 'world-markets']);
    expect(doc2.overall.source).toBe('template');
    expect(doc2.overall.en.length).toBeGreaterThan(0);
    expect(doc2.dataAsOf).toBe('2026-10-28');

    // Nothing changed → the next tick writes nothing.
    const tick3 = await runScheduledNarrator(e, { now: new Date('2026-10-28T11:50:00.000Z') });
    expect(tick3.regenerated).toBe(0);
    expect(tick3.skippedUnchanged).toBe(5);
    expect(tick3.wrote).toBe(false);
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.runs).toBe(3);
    expect(stats.days['2026-10-28']!.templateUsed).toBe(5); // 3 (tick 1) + 2 (tick 2)
    expect(stats.days['2026-10-28']!.skippedUnchanged).toBe(8); // 0 + 3 (tick 2) + 5 (tick 3)
  });

  it('a unit older than 24 h regenerates even with an unchanged hash', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const e = env({ RATES: kv, NARRATOR_ENABLED: 'false' });
    await runScheduledNarrator(e, { now: NOW });
    await runScheduledNarrator(e, { now: LATER });
    const before = map.get(NARRATIVE_KV_KEY)!;
    const tick = await runScheduledNarrator(e, { now: NEXT_DAY });
    expect(tick.regenerated).toBeGreaterThanOrEqual(3); // everything is >24h old now
    expect(map.get(NARRATIVE_KV_KEY)!).not.toBe(before);
  });

  it('missing feeds roll up honestly: no markets/fx documents → 3 units only', async () => {
    const { kv, map } = makeKv();
    const fixture = loadFixture();
    map.set(INSIGHTS_SNAPSHOT_PUBLIC_KEY, JSON.stringify(fixture.input.insights));
    const result = await runScheduledNarrator(env({ RATES: kv }), { now: NOW });
    expect(result.evaluated).toBe(3); // global + australia + overall
    const doc = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(Object.keys(doc.sections).sort()).toEqual(['australia', 'global']);
  });
});

describe('M4 runScheduledNarrator — the enabled path (mocked fetch)', () => {
  const KEY = 'AIzaTestKeyNotReal00000000000000000000';

  it('enabled + a valid model answer: the units carry source "ai" and pass the validators', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const fetchImpl = fetchAnswering(() => new Response(JSON.stringify({ output_text: AI_GOOD }), { status: 200 }));
    const result = await runScheduledNarrator(env({ RATES: kv, NARRATOR_ENABLED: 'true', GEMINI_API_KEY: KEY }), {
      now: NOW,
      fetchImpl,
    });
    expect(result.aiValid).toBe(3);
    expect(result.templateUsed).toBe(0);
    const doc = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(doc.sections['global']!.source).toBe('ai');
    expect(doc.sections['global']!.en).toContain('A plain-language summary sits here.');
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.aiValid).toBe(3);
  });

  it('a validation failure retries ONCE with the failed checks named, then falls back to the template', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      // deliberately bad both times: a banned advice word (V4) + a wrong tone
      return new Response(JSON.stringify({ output_text: JSON.stringify({ en: 'You should buy gold now.', fa: 'حتماً طلا بخرید.' }) }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await runScheduledNarrator(env({ RATES: kv, NARRATOR_ENABLED: 'true', GEMINI_API_KEY: KEY }), {
      now: NOW,
      fetchImpl,
    });
    // 3 units × 2 attempts each = 6 model calls, all templates in the end
    expect(calls).toBe(6);
    expect(result.templateUsed).toBe(3);
    const doc = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(doc.sections['global']!.source).toBe('template');
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.aiFailedByCheck['V4']).toBeGreaterThanOrEqual(3);
  });

  it('an api error (region refusal) falls back to the template and counts in the stats', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const fetchImpl = fetchAnswering(
      () =>
        new Response(
          JSON.stringify({ error: { message: 'User location is not supported for the API use without a billing account.' } }),
          { status: 403 },
        ),
    );
    const result = await runScheduledNarrator(env({ RATES: kv, NARRATOR_ENABLED: 'true', GEMINI_API_KEY: KEY }), {
      now: NOW,
      fetchImpl,
    });
    expect(result.templateUsed).toBe(3);
    expect(result.apiErrors).toBe(3);
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.apiErrors['region']).toBe(3);
  });

  it('enabled but NO key: templates, zero model calls (the safe-without-key rule)', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const result = await runScheduledNarrator(env({ RATES: kv, NARRATOR_ENABLED: 'true' }), { now: NOW, fetchImpl });
    expect(result.templateUsed).toBe(3);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('part 3 (news) never runs while NARRATOR_WEB_CONTEXT=false (the D-29 default)', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ output_text: AI_GOOD }), { status: 200 }),
    ) as unknown as typeof fetch;
    await runScheduledNarrator(env({ RATES: kv, NARRATOR_ENABLED: 'true', GEMINI_API_KEY: KEY }), {
      now: NOW,
      fetchImpl,
    });
    // every fetch was a call-type-A interactions POST (no google_search tool)
    expect(fetchImpl).toHaveBeenCalled();
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.newsAttempted).toBe(0);
  });
});

describe('D-41 narratorFlagsOf — the cloudflare provider path', () => {
  it('provider=cloudflare: hasKey follows the AI binding, webContext is clamped false', () => {
    const flagsWithBinding = narratorFlagsOf(
      env({
        NARRATOR_ENABLED: 'true',
        NARRATOR_PROVIDER: 'cloudflare',
        NARRATOR_WEB_CONTEXT: 'true', // ignored on the cloudflare path
        AI: { async run() { return { response: '' }; } },
      }),
    );
    expect(flagsWithBinding.provider).toBe('cloudflare');
    expect(flagsWithBinding.hasKey).toBe(true); // the binding exists
    expect(flagsWithBinding.webContext).toBe(false); // clamped (no grounding)
    expect(flagsWithBinding.model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  });

  it('provider=cloudflare but NO binding: hasKey false → templates (the safe-without-binding rule)', () => {
    const flags = narratorFlagsOf(env({ NARRATOR_PROVIDER: 'cloudflare' }));
    expect(flags.provider).toBe('cloudflare');
    expect(flags.hasKey).toBe(false);
  });

  it('provider=cloudflare honours NARRATOR_MODEL override', () => {
    const flags = narratorFlagsOf(
      env({ NARRATOR_PROVIDER: 'cloudflare', NARRATOR_MODEL: '@cf/qwen/qwen3-30b-a3b-fp8' }),
    );
    expect(flags.model).toBe('@cf/qwen/qwen3-30b-a3b-fp8');
  });

  it('provider=cloudflare with the inherited gemini default model → falls back to the cloudflare default (the live-deploy scenario)', () => {
    // This is exactly the live state after flipping provider=cloudflare while
    // NARRATOR_MODEL still carries the gemini default from wrangler.jsonc.
    const flags = narratorFlagsOf(
      env({ NARRATOR_PROVIDER: 'cloudflare', NARRATOR_MODEL: 'gemini-3.5-flash-lite' }),
    );
    expect(flags.model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  });

  it('an unknown provider falls back to gemini', () => {
    const flags = narratorFlagsOf(env({ NARRATOR_PROVIDER: 'mistral' }));
    expect(flags.provider).toBe('gemini');
  });
});

describe('D-41 runScheduledNarrator — the cloudflare provider path (mocked AI binding)', () => {
  it('enabled + cloudflare provider + a valid binding answer: source "ai", no fetch used', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const fetchImpl = vi.fn() as unknown as typeof fetch; // must NOT be called
    const ai = {
      run: vi.fn(async () => ({
        response: AI_GOOD,
        usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 },
      })),
    };
    const result = await runScheduledNarrator(
      env({ RATES: kv, NARRATOR_ENABLED: 'true', NARRATOR_PROVIDER: 'cloudflare', AI: ai }),
      { now: NOW, fetchImpl },
    );
    expect(result.aiValid).toBe(3);
    expect(result.templateUsed).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(ai.run).toHaveBeenCalledTimes(3); // 3 units × 1 attempt (passed validators)
    const doc = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(doc.sections['global']!.source).toBe('ai');
    expect(doc.model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.aiValid).toBe(3);
  });

  it('enabled + cloudflare provider but NO binding: templates, zero binding calls', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const result = await runScheduledNarrator(
      env({ RATES: kv, NARRATOR_ENABLED: 'true', NARRATOR_PROVIDER: 'cloudflare' }),
      { now: NOW },
    );
    expect(result.templateUsed).toBe(3);
    expect(result.aiValid).toBe(0);
    const doc = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(doc.sections['global']!.source).toBe('template');
  });

  it('a validation failure retries ONCE via the binding, then falls back to template', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const ai = {
      run: vi.fn(async () => ({
        // deliberately bad both times: banned advice word (V4)
        response: JSON.stringify({ en: 'You should buy gold now.', fa: 'حتماً طلا بخرید.' }),
      })),
    };
    const result = await runScheduledNarrator(
      env({ RATES: kv, NARRATOR_ENABLED: 'true', NARRATOR_PROVIDER: 'cloudflare', AI: ai }),
      { now: NOW },
    );
    expect(ai.run).toHaveBeenCalledTimes(6); // 3 units × 2 attempts
    expect(result.templateUsed).toBe(3);
    const doc = parseNarrativeDoc(map.get(NARRATIVE_KV_KEY)!)!;
    expect(doc.sections['global']!.source).toBe('template');
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.aiFailedByCheck['V4']).toBeGreaterThanOrEqual(3);
  });

  it('webContext=true is ignored on the cloudflare path (Part 3 stays disabled)', async () => {
    const { kv, map } = makeKv();
    seedDocuments(map);
    const ai = {
      run: vi.fn(async () => ({ response: AI_GOOD, usage: {} })),
    };
    await runScheduledNarrator(
      env({
        RATES: kv,
        NARRATOR_ENABLED: 'true',
        NARRATOR_PROVIDER: 'cloudflare',
        NARRATOR_WEB_CONTEXT: 'true', // must be clamped to false
        AI: ai,
      }),
      { now: NOW },
    );
    const stats = parseStatsDoc(map.get(NARRATOR_STATS_KEY)!)!;
    expect(stats.days['2026-10-28']!.newsAttempted).toBe(0);
  });
});

describe('M4 parseNarrativeDoc — the defensive read', () => {
  it('null/poisoned/foreign JSON → null (a fresh cycle, never a crash)', () => {
    expect(parseNarrativeDoc(null)).toBeNull();
    expect(parseNarrativeDoc('not json')).toBeNull();
    expect(parseNarrativeDoc('{"unrelated": true}')).toBeNull();
    expect(parseNarrativeDoc(JSON.stringify({ promptVersion: 1, overall: { en: 'x' }, sections: {} }))).not.toBeNull();
  });
});
