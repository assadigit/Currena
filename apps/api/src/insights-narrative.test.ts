/**
 * insights-narrative.test.ts — M4 + M5 gates: the cached narrative endpoint.
 *
 * M4: serves the stored doc verbatim with the edge-cache headers; the clean
 * 404 envelope when nothing is generated yet; ungated by design (D-38).
 *
 * M5: the response is `{ ...doc, visible }` — the stored doc VERBATIM plus
 * the additive `visible` flag from `env.NARRATOR_VISIBLE === 'true'` (D-34 +
 * D-39). The flag is a runtime/env signal — the KV doc never carries it.
 */

import { describe, expect, it } from 'vitest';
import { createNarrativeRoutes } from './routes/insights-narrative';
import { NARRATIVE_KV_KEY, type NarrativeDoc } from './narrator-cron';
import type { Bindings } from './index';

function makeKv(seeded: Record<string, string> = {}): KVNamespace {
  const map = new Map<string, string>(Object.entries(seeded));
  return {
    get: async (key: string): Promise<string | null> => map.get(key) ?? null,
    put: async (key: string, value: string): Promise<void> => {
      map.set(key, value);
    },
    delete: async (key: string): Promise<void> => {
      map.delete(key);
    },
  } as unknown as KVNamespace;
}

const DOC: NarrativeDoc = {
  promptVersion: 1,
  model: 'gemini-3.5-flash-lite',
  generatedAt: '2026-10-28T09:50:00.000Z',
  dataAsOf: '2026-10-28',
  overall: { stateHash: 'h', en: 'Overall EN.', fa: 'خلاصهٔ کل.', source: 'template', generatedAt: '2026-10-28T09:50:00.000Z' },
  sections: {
    global: { stateHash: 'g', en: 'Global EN.', fa: 'جهانی.', source: 'template', generatedAt: '2026-10-28T09:50:00.000Z' },
  },
};

describe('M4 GET /api/insights/narrative', () => {
  it('serves the stored document verbatim with the edge-cache headers', async () => {
    const app = createNarrativeRoutes();
    const env = { RATES: makeKv({ [NARRATIVE_KV_KEY]: JSON.stringify(DOC) }) } as unknown as Bindings;
    const response = await app.request('/api/insights/narrative', {}, env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300, s-maxage=600');
    const body = (await response.json()) as NarrativeDoc & { visible: boolean };
    // The stored doc fields ride through verbatim — `visible` is the only
    // M5 additive field (asserted by its own describe block below).
    const { visible: _visible, ...docFields } = body;
    expect(docFields).toEqual(DOC);
  });

  it('answers the clean 404 envelope before the first generation (nothing breaks)', async () => {
    const app = createNarrativeRoutes();
    const env = { RATES: makeKv() } as unknown as Bindings;
    const response = await app.request('/api/insights/narrative', {}, env);
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('narrative_not_ready');
  });

  it('a poisoned stored value reads as absent (the 404, never a 500)', async () => {
    const app = createNarrativeRoutes();
    const env = { RATES: makeKv({ [NARRATIVE_KV_KEY]: 'not json' }) } as unknown as Bindings;
    const response = await app.request('/api/insights/narrative', {}, env);
    expect(response.status).toBe(404);
  });
});

describe('M5 GET /api/insights/narrative — the additive `visible` flag', () => {
  it('adds visible:false when NARRATOR_VISIBLE is unset (the staged-rollout default)', async () => {
    const app = createNarrativeRoutes();
    const env = { RATES: makeKv({ [NARRATIVE_KV_KEY]: JSON.stringify(DOC) }) } as unknown as Bindings;
    const response = await app.request('/api/insights/narrative', {}, env);
    expect(response.status).toBe(200);
    const body = (await response.json()) as NarrativeDoc & { visible: boolean };
    expect(body.visible).toBe(false);
    // The stored doc fields ride through verbatim — only `visible` is added.
    expect(body.overall).toEqual(DOC.overall);
    expect(body.sections).toEqual(DOC.sections);
    expect(body.promptVersion).toBe(DOC.promptVersion);
  });

  it('adds visible:true when NARRATOR_VISIBLE==="true" (the owner\'s one-line flip)', async () => {
    const app = createNarrativeRoutes();
    const env = {
      RATES: makeKv({ [NARRATIVE_KV_KEY]: JSON.stringify(DOC) }),
      NARRATOR_VISIBLE: 'true',
    } as unknown as Bindings;
    const response = await app.request('/api/insights/narrative', {}, env);
    expect(response.status).toBe(200);
    const body = (await response.json()) as NarrativeDoc & { visible: boolean };
    expect(body.visible).toBe(true);
  });

  it('treats any non-"true" value as false (the conservative default)', async () => {
    const app = createNarrativeRoutes();
    const env = {
      RATES: makeKv({ [NARRATIVE_KV_KEY]: JSON.stringify(DOC) }),
      NARRATOR_VISIBLE: '1',
    } as unknown as Bindings;
    const response = await app.request('/api/insights/narrative', {}, env);
    const body = (await response.json()) as NarrativeDoc & { visible: boolean };
    expect(body.visible).toBe(false);
  });
});
