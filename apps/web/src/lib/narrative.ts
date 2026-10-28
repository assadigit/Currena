/**
 * Layer-2 narrator — the narrative document API client
 * (GET /api/insights/narrative, M4 endpoint + M5 display).
 *
 * Follows lib/markets.ts + lib/fx.ts discipline verbatim: ONE endpoint,
 * last-good localStorage snapshot for instant/offline paint, and this
 * feed NEVER surfaces an error state — the spec §11 rule is "Missing/
 * failed fetch → render nothing; nothing breaks", so any failure
 * resolves to null and the caller (the Insights route) decides whether
 * to render a NarrativeBlock at all.
 *
 * The response is the stored KV document VERBATIM plus the additive
 * `visible` flag (M5: `env.NARRATOR_VISIBLE === 'true'`, D-34 + D-39).
 * The web reads `visible` to gate the public URL path; the
 * `?narrative=preview` URL marker works REGARDLESS of `visible` (the
 * owner's "read real text for a week" preview path).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy
 * /insights route chunk, never the entry graph.
 */

/** One unit's text (a section, or the overall summary). Mirrors the M4
 * `NarrativeUnit` from apps/api/src/narrator-cron.ts (duplicated here so
 * the web bundle never imports the worker-only types). */
export interface NarrativeUnit {
  stateHash: string;
  en: string;
  fa: string;
  source: 'ai' | 'template';
  generatedAt: string;
  news?: {
    en: string;
    fa: string;
    sources: { title: string; url: string }[];
    generatedAt: string;
    /** Google's required display element (search suggestions HTML), when
     * grounding metadata returned one. Rendered via dangerouslySetInnerHTML
     * beside the news note (spec §11). */
    requiredDisplay?: string;
  };
}

/** The narrative document (M4 KV shape) + the M5 additive `visible` flag. */
export interface NarrativeDoc {
  promptVersion: number;
  model: string;
  generatedAt: string;
  dataAsOf: string | null;
  overall: NarrativeUnit;
  sections: Record<string, NarrativeUnit>;
  /** M5: derived from `env.NARRATOR_VISIBLE === 'true'` by the route. False
   * until the owner flips visibility (the staged rollout). The
   * `?narrative=preview` URL marker overrides this locally. */
  visible: boolean;
}

const TIMEOUT_MS = 20_000;
const NARRATIVE_CACHE_KEY = 'currena:insights:narrative';

/** GET /api/insights/narrative — null when anything at all goes wrong. */
export async function fetchNarrativeDoc(signal?: AbortSignal): Promise<NarrativeDoc | null> {
  const url = '/api/insights/narrative';
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetch(url, {
      signal: combined,
      headers: { accept: 'application/json' },
      // The route answers public, max-age=300 s-maxage=600 — the browser's
      // HTTP cache does revalidation for us (visitors hit the edge, not KV).
      cache: 'default',
    });
    if (!response.ok) {
      // 404 narrative_not_ready is the EXPECTED "first hour after a fresh
      // deploy" answer; every other failure is equally non-fatal for the
      // page — null means the display renders nothing.
      if (response.status !== 404) {
        // Drain the error envelope quietly (no diagnostics needed — null is
        // the whole error surface for this feed).
        await response.text().catch(() => '');
      }
      return null;
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return null;
    }
    const doc = parseNarrativeDoc(body);
    if (doc === null) return null; // poisoned payload — treat as absent
    writeCachedNarrative(doc);
    return doc;
  } catch {
    // Network/timeout/abort — null, never an error state.
    return null;
  }
}

/** Last-good document from localStorage (defensively parsed on read; an
 * older contract or poisoned JSON fails validation and is discarded). */
export function readCachedNarrative(): NarrativeDoc | null {
  try {
    const raw = window.localStorage.getItem(NARRATIVE_CACHE_KEY);
    if (!raw) return null;
    return parseNarrativeDoc(JSON.parse(raw));
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedNarrative(doc: NarrativeDoc): void {
  try {
    window.localStorage.setItem(NARRATIVE_CACHE_KEY, JSON.stringify(doc));
  } catch {
    // Private mode or quota — caching is best-effort only.
  }
}

/** Pure defensive parser — the route answers `{ ...doc, visible }` and we
 * never trust the shape blindly (an older cached payload or a poisoned KV
 * value must read as absent, never as a partial render). */
function parseNarrativeDoc(body: unknown): NarrativeDoc | null {
  if (typeof body !== 'object' || body === null) return null;
  const obj = body as Record<string, unknown>;
  if (
    typeof obj.promptVersion === 'number' &&
    typeof obj.model === 'string' &&
    typeof obj.generatedAt === 'string' &&
    (obj.dataAsOf === null || typeof obj.dataAsOf === 'string') &&
    isNarrativeUnit(obj.overall) &&
    typeof obj.sections === 'object' &&
    obj.sections !== null &&
    typeof obj.visible === 'boolean'
  ) {
    return obj as unknown as NarrativeDoc;
  }
  return null;
}

function isNarrativeUnit(value: unknown): value is NarrativeUnit {
  if (typeof value !== 'object' || value === null) return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.stateHash === 'string' &&
    typeof u.en === 'string' &&
    typeof u.fa === 'string' &&
    (u.source === 'ai' || u.source === 'template') &&
    typeof u.generatedAt === 'string'
  );
}
