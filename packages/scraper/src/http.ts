/**
 * Shared HTTP helper for upstream scrapes — web-standard APIs only
 * (AGENTS.md rule 2), so this runs identically in the Worker and in Node tests.
 *
 * - Desktop-Chrome UA + browser Accept headers (realistic client fingerprint).
 * - Per-attempt abort timeout (~12s default).
 * - Quick retries (~300ms / ~800ms backoff) for transient Cloudflare
 *   `error 1042` blips — observed once in the Phase 2 probe battery.
 * - `fetchImpl` is injectable; tests NEVER hit live sites (AGENTS.md rule 7).
 * - `HttpError` carries a machine-readable `code` (BACKLOG #33, SWOT W24):
 *   timeout / dns_or_network / rate_limited / blocked / http_4xx / http_5xx —
 *   the ladder and /api/status can classify failures without parsing
 *   message strings (flows into errorToCodeMessage automatically).
 */

/** Desktop Chrome on Windows — same fingerprint family the Phase 2 probe used. */
export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/** Browser-like request headers sent on every upstream fetch. */
export const BROWSER_HEADERS: Readonly<Record<string, string>> = {
  'User-Agent': BROWSER_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export interface FetchRetryOptions {
  /** Per-attempt abort timeout. Default 12s. */
  timeoutMs?: number;
  /** Number of retries AFTER the first attempt. Default 2. */
  retries?: number;
  /** Injectable fetch (tests). Default: global fetch. */
  fetchImpl?: typeof fetch;
  /** Backoff before retry #1, #2, … Default [300, 800] ms. */
  backoffMs?: readonly number[];
}

/** Machine-readable failure classification (BACKLOG #33) — stable codes
 *  for the API ladder, /api/status and admin telemetry. `dns_or_network`
 *  is honest: the fetch web standard cannot distinguish DNS failure from a
 *  dropped connection — both surface as TypeError. */
export type HttpErrorCode =
  | 'timeout'
  | 'dns_or_network'
  | 'rate_limited'
  | 'blocked'
  | 'http_4xx'
  | 'http_5xx';

/** Classify an HTTP status (undefined = the request never got a response). */
function codeForStatus(status: number | undefined): HttpErrorCode {
  if (status === undefined) return 'dns_or_network';
  if (status === 429) return 'rate_limited';
  if (status === 403 || status === 451) return 'blocked';
  if (status >= 500) return 'http_5xx';
  return 'http_4xx';
}

/** Classify a network-level rejection (AbortSignal.timeout raises a
 *  DOMException named TimeoutError; a caller-supplied signal aborts with
 *  AbortError — both mean the attempt never completed). */
function codeForNetworkError(err: unknown): HttpErrorCode {
  if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return 'timeout';
  }
  return 'dns_or_network';
}

/** Thrown when every attempt failed (network error or non-2xx after retries). */
export class HttpError extends Error {
  readonly status: number | undefined;
  readonly code: HttpErrorCode;

  constructor(message: string, status?: number, code?: HttpErrorCode) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code ?? codeForStatus(status);
  }
}

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS: readonly number[] = [300, 800];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Browser headers merged with (and overridden by) any caller-provided headers. */
function mergedHeaders(init: RequestInit): Record<string, string> {
  const headers: Record<string, string> = { ...BROWSER_HEADERS };
  const extra = init.headers;
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(extra)) {
      for (const [key, value] of extra) headers[key] = value;
    } else {
      Object.assign(headers, extra);
    }
  }
  return headers;
}

/**
 * Fetch a URL, retrying transient failures. Resolves ONLY with a 2xx Response —
 * network errors, 5xx/429 (after retries) and other 4xx statuses throw
 * `HttpError`. 4xx (other than 429) is not retried: it will not heal.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const backoffMs = opts.backoffMs ?? DEFAULT_BACKOFF_MS;
  const doFetch = opts.fetchImpl ?? fetch;

  const attempts = retries + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) {
      const delay = backoffMs[attempt - 2] ?? backoffMs[backoffMs.length - 1] ?? 0;
      if (delay > 0) await sleep(delay);
    }
    // Fresh signal per attempt (an aborted signal cannot be reused).
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    try {
      const res = await doFetch(url, { ...init, headers: mergedHeaders(init), signal: init.signal ?? timeoutSignal });
      if (res.ok) return res;
      const error = new HttpError(`GET ${url} failed with HTTP ${res.status}`, res.status);
      if (res.status >= 500 || res.status === 429) {
        lastError = error; // transient — maybe retry
        continue;
      }
      throw error; // permanent client error — no retry
    } catch (err) {
      if (err instanceof HttpError && err.status !== undefined && err.status < 500 && err.status !== 429) {
        throw err;
      }
      lastError = err; // network/abort error — maybe retry
    }
  }

  if (lastError instanceof HttpError) throw lastError;
  throw new HttpError(
    `GET ${url} failed after ${attempts} attempt(s): ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
    undefined,
    codeForNetworkError(lastError),
  );
}

/**
 * Run an async mapper over items with bounded parallelism (used by the TGJU
 * profile-page fallback: 16 pages, ~4 at a time — polite to the upstream).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await mapper(items[index]!, index);
    }
  });
  await Promise.all(workers);
  return results;
}
