/**
 * Shared HTTP helper for upstream scrapes — web-standard APIs only
 * (AGENTS.md rule 2), so this runs identically in the Worker and in Node tests.
 *
 * - Desktop-Chrome UA + browser Accept headers (realistic client fingerprint).
 * - Per-attempt abort timeout (~12s default).
 * - Quick retries (~300ms / ~800ms backoff) for transient Cloudflare
 *   `error 1042` blips — observed once in the Phase 2 probe battery.
 * - `fetchImpl` is injectable; tests NEVER hit live sites (AGENTS.md rule 7).
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

/** Thrown when every attempt failed (network error or non-2xx after retries). */
export class HttpError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
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
