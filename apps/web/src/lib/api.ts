/**
 * Typed API client for the Currena Worker (AGENTS.md rule 4: SPA-only, all
 * data via the JSON API; rule 3: zod-validate everything crossing the trust
 * boundary — garbage fails loudly, never renders).
 *
 * Shapes are THE contracts from @currena/core (schemas.ts) and
 * apps/api/src/meta.ts. Errors collapse into a typed ApiError with three
 * kinds: 'network' (fetch threw / offline), 'rates' (the API answered with a
 * RatesError envelope — has a machine code), 'parse' (2xx but invalid body).
 */

import { RatesErrorSchema, RatesResponseSchema } from '@currena/core';
import type { RatesResponse, SnapshotSource } from '@currena/core';
import { z } from 'zod';

export type ApiErrorKind = 'network' | 'rates' | 'parse';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** RatesError machine code (kind === 'rates' only), e.g. 'source_unavailable'. */
  readonly code?: string;
  readonly status?: number;
  readonly retryAfterSec?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    opts: { code?: string; status?: number; retryAfterSec?: number } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.code = opts.code;
    this.status = opts.status;
    this.retryAfterSec = opts.retryAfterSec;
  }
}

/** Default request timeout — the ladder retries server-side; 20s is generous. */
const TIMEOUT_MS = 20_000;

async function requestJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(url, {
      signal: combined,
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (err) {
    // Caller-initiated aborts propagate untouched (hot reload, unmount).
    if (err instanceof DOMException && err.name === 'AbortError' && signal?.aborted) {
      throw err;
    }
    throw new ApiError('network', err instanceof Error ? err.message : 'Network request failed');
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('parse', `Non-JSON response from ${url} (status ${response.status})`, {
      status: response.status,
    });
  }
  if (!response.ok) {
    const envelope = RatesErrorSchema.safeParse(body);
    if (envelope.success) {
      throw new ApiError('rates', envelope.data.error.message, {
        code: envelope.data.error.code,
        status: response.status,
        retryAfterSec: envelope.data.error.retryAfterSec,
      });
    }
    throw new ApiError('parse', `Error response from ${url} (status ${response.status})`, {
      status: response.status,
    });
  }
  return body;
}

/** GET /api/rates?source= — the fallback-ladder snapshot endpoint. */
export async function fetchRates(
  source: SnapshotSource,
  signal?: AbortSignal,
): Promise<RatesResponse> {
  const body = await requestJson(`/api/rates?source=${encodeURIComponent(source)}`, signal);
  const parsed = RatesResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('parse', `Invalid rates payload: ${parsed.error.message}`, { status: 200 });
  }
  return parsed.data;
}

/* ------------------------------------------------------------------ *
 * /api/meta — mirrors apps/api/src/meta.ts (MetaResponseSchema).
 * The schema is duplicated here (not imported) so the web bundle never
 * depends on the Hono app package; the API's own tests keep both in sync.
 * ------------------------------------------------------------------ */

const MetaCurrencySchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  name: z.string().min(1),
  symbol: z.string(),
  minorUnits: z.number().int().min(0),
  tgjuProfileUrl: z.url().optional(),
});

const MetaResponseSchema = z.object({
  currencies: z.array(MetaCurrencySchema).min(1),
  sources: z.object({
    tgju: z.object({
      base: z.string().regex(/^[A-Z]{3}$/),
      currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1),
    }),
    frankfurter: z.object({
      base: z.string().regex(/^[A-Z]{3}$/),
      currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1),
    }),
  }),
  limitations: z.array(z.string().min(1)),
});

export type MetaResponse = z.infer<typeof MetaResponseSchema>;

let metaPromise: Promise<MetaResponse> | null = null;

/**
 * GET /api/meta — static payload, fetched once per session and memoized.
 * Throws ApiError loudly so callers can degrade to core's static currency
 * metadata (currencies.ts carries the same TGJU profile slugs).
 */
export function fetchMeta(): Promise<MetaResponse> {
  metaPromise ??= (async () => {
    const body = await requestJson('/api/meta');
    const parsed = MetaResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('parse', `Invalid meta payload: ${parsed.error.message}`, { status: 200 });
    }
    return parsed.data;
  })();
  return metaPromise;
}
