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

import { MetaResponseSchema, RatesErrorSchema, RatesResponseSchema } from '@currena/core';
import type { MetaResponse, RatesResponse, SnapshotSource } from '@currena/core';

type ApiErrorKind = 'network' | 'rates' | 'parse';

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
 * /api/meta — the contract lives in @currena/core (B-4 consolidation:
 * the schema was previously duplicated here and in apps/api/src/meta.ts
 * with only comments keeping them in sync; both sides now import THE one
 * definition — parity by construction, not discipline).
 * ------------------------------------------------------------------ */

let metaPromise: Promise<MetaResponse> | null = null;

/**
 * GET /api/meta — static payload, fetched once per session and memoized.
 * Throws ApiError loudly so callers can degrade to core's static currency
 * metadata (currencies.ts carries the same TGJU profile slugs).
 *
 * Retry-after-failure (QA audit C-2): a rejected memo must not poison the
 * whole session — one transient /api/meta failure at boot used to make
 * every later call return the same dead promise. The memo resets on
 * rejection so the next natural trigger (route change, converter mount)
 * refetches; successful memoization is unchanged.
 */
export function fetchMeta(): Promise<MetaResponse> {
  if (metaPromise === null) {
    const promise = (async () => {
      const body = await requestJson('/api/meta');
      const parsed = MetaResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('parse', `Invalid meta payload: ${parsed.error.message}`, { status: 200 });
      }
      return parsed.data;
    })();
    void promise.catch(() => {
      if (metaPromise === promise) metaPromise = null;
    });
    metaPromise = promise;
  }
  return metaPromise;
}

/** Test-only: reset the meta memo between test cases (module state). */
export function __resetMetaMemoForTests(): void {
  metaPromise = null;
}
