/**
 * fetch-policy.ts — the ONLY way Insights fetches an outside source
 * (SCRAPING_SPEC §2 method ladder is enforced at the collect layer; this
 * module enforces the §5 politeness rules and the block taxonomy).
 *
 *  - F-09/T-25 honest identity: every request carries the declared
 *    CurrenaDashboard UA with the About contact URL. A caller-supplied
 *    UA is OVERRIDDEN — nothing may present a browser identity.
 *  - F-11 no retry loops: a single attempt; on failure the source waits
 *    for the next scheduled refresh and fails closed.
 *  - T-27 a block is a block: 403/418/451 (+429 rate-limit) and bot-check
 *    pages raise BlockedError; nothing downstream may try to get around it.
 *  - F-10 conditional requests: pass `etag` to send If-None-Match; a 304
 *    response is surfaced so the caller reuses its last good value.
 *  - F-16 FormatChangedError: adapters throw it when a response no longer
 *    matches the expected shape; collect classifies it via
 *    classifySourceError and the status panel says "format changed".
 *  - F-18 contentHash: a small stable hash of the fetched value block so
 *    unchanged repeats can be detected without re-parsing.
 */

/** The declared identity (F-09). The contact URL is the About section's. */
export const CURRENA_UA = 'CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)';

/** A site refusing our honest request (T-27). Never circumvented. */
export class BlockedError extends Error {
  readonly reason: 'blocked' | 'rate_limited' | 'bot_check';
  readonly status?: number;
  constructor(message: string, reason: 'blocked' | 'rate_limited' | 'bot_check', status?: number) {
    super(
      reason === 'rate_limited'
        ? `blocked by the site (rate-limited${status !== undefined ? `, HTTP ${status}` : ''}) — waiting for the next scheduled refresh`
        : reason === 'bot_check'
          ? 'blocked by the site (bot-check page) — waiting for the next scheduled refresh'
          : `blocked by the site${status !== undefined ? ` (HTTP ${status})` : ''} — waiting for the next scheduled refresh`,
    );
    this.name = 'BlockedError';
    this.reason = reason;
    this.status = status;
  }
}

/** The response no longer matches the expected shape (F-16). */
export class FormatChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormatChangedError';
  }
}

/** Machine-readable classification for the ingest report + status panel. */
export type SourceErrorKind = 'blocked' | 'format-changed' | 'failed';
export function classifySourceError(err: unknown): SourceErrorKind {
  if (err instanceof BlockedError) return 'blocked';
  if (err instanceof FormatChangedError) return 'format-changed';
  return 'failed';
}

export interface InsightsFetchDeps {
  /** Injectable fetch (tests). Default: global fetch. */
  fetchImpl?: typeof fetch;
  /** Per-attempt abort timeout. Default 12s. */
  timeoutMs?: number;
  /** A cached ETag to send as If-None-Match (F-10). */
  etag?: string | null;
}

const DEFAULT_TIMEOUT_MS = 12_000;

/** Bot-check page markers — ordinary 200 HTML pages that are really refusals. */
const BOT_CHECK_MARKERS: readonly string[] = [
  'just a moment',
  'checking your browser',
  'verify you are human',
  'pardon our interruption',
  'cf-chl',
  'captcha',
  'are you a robot',
  'access denied',
];

function mergeHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  // The declared identity ALWAYS wins (T-25) — callers cannot spoof.
  headers.set('User-Agent', CURRENA_UA);
  if (!headers.has('Accept')) headers.set('Accept', '*/*');
  return headers;
}

/**
 * One honest, single-attempt fetch. Resolves ONLY with 2xx or 304 — a
 * refusal (BlockedError), a format change (upstream parse), or any other
 * failure throws exactly once (F-11: no retries, no circumvention).
 */
export async function insightsFetch(
  url: string,
  init: RequestInit = {},
  deps: InsightsFetchDeps = {},
): Promise<Response> {
  const doFetch = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headers = mergeHeaders(init);
  if (deps.etag) headers.set('If-None-Match', deps.etag);
  const signal = AbortSignal.timeout(timeoutMs);
  const res = await doFetch(url, { ...init, headers, signal });
  if (res.status === 304) return res; // F-10: caller reuses its last good value
  if (res.status === 429) throw new BlockedError('rate limited', 'rate_limited', 429);
  if (res.status === 403 || res.status === 418 || res.status === 451) {
    throw new BlockedError('refused', 'blocked', res.status);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${new URL(url).host} — single attempt, no retry (F-11)`);
  }
  // A 200 HTML page may be a bot-check wall rather than data (T-27).
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    const body = await res.clone().text();
    const lower = body.toLowerCase();
    if (BOT_CHECK_MARKERS.some((m) => lower.includes(m))) {
      throw new BlockedError('bot check page', 'bot_check', 200);
    }
  }
  return res;
}

/** F-18: a small stable hash (djb2 hex) of a fetched value block. */
export function contentHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
