/**
 * model-client.ts — the provider-agnostic narrator model client (D-41).
 *
 * The narrator was built against the Gemini REST client (M3, spec §5). The
 * owner asked to try Cloudflare Workers AI instead (runs on Cloudflare's own
 * network → no egress, no region risk, no secret key — the Workers AI
 * binding authenticates implicitly). This module is the shared contract both
 * providers implement, so the cron (M4) + the eval harness (M3) can talk to
 * either without a branching call site.
 *
 * The shapes (StateNarrativeText, NewsNoteText, the Outcome/Error pair) are
 * the existing Gemini-client types — they are already provider-neutral in
 * shape (no Gemini-specific fields), so they are re-exported here under
 * neutral names. GeminiClient and CloudflareAiClient both implement this
 * interface; the cron picks one from `NARRATOR_PROVIDER` (default 'gemini'
 * → the existing behaviour is UNCHANGED).
 *
 * Pure types only — no I/O, no clock, no model calls.
 */

import type { GeminiOutcome, GeminiError, StateNarrativeText, NewsNoteText } from './gemini-client';

/** A model failure is always a VALUE, never a throw (the spec's §5 rule). */
export type NarratorError = GeminiError;
export type NarratorOutcome<T> = GeminiOutcome<T>;

/** The provider id (env var NARRATOR_PROVIDER). Default 'gemini'. */
export type NarratorProvider = 'gemini' | 'cloudflare';

/**
 * Every narrator model client (Gemini OR Cloudflare Workers AI) speaks this
 * surface. The two methods are the spec's two call types:
 *   - callStateNarrative — type A: schema-constrained {en, fa} JSON, no internet.
 *   - callNewsNote       — type B: grounded note (EN:/FA:) or NONE, with sources.
 *
 * Both return the Outcome union; a failure carries a kind from the spec's
 * taxonomy (invalid-key, quota, region, http, network, timeout, schema, empty).
 * The Cloudflare path never produces 'region' (no egress) — that is the
 * architectural win of the pivot (D-41 closes D-31's open region risk).
 */
export interface NarratorModelClient {
  callStateNarrative(params: {
    systemInstruction: string;
    userMessage: string;
    maxOutputTokens?: number;
    temperature?: number;
  }): Promise<NarratorOutcome<StateNarrativeText>>;

  callNewsNote(params: {
    systemInstruction: string;
    userMessage: string;
    maxOutputTokens?: number;
  }): Promise<NarratorOutcome<NewsNoteText>>;
}

/** The default Cloudflare Workers AI model (D-41 §3 — the re-verified pick). */
export const CLOUDFLARE_DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
