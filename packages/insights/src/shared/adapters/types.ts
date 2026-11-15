/**
 * Shared types for the Phase I2 source adapters (packages/insights/src/adapters/).
 *
 * The adapters are the FETCH halves that pair with the pure parsers: they build
 * provider URLs, fetch with the scraper's retry ladder (web-standard APIs only,
 * AGENTS.md rule 2 — identical behaviour in the GitHub Actions runner and in a
 * Worker), and parse via the fixture-tested parsers. An upstream change fails
 * LOUDLY (rule 3): every adapter throws; the runner turns a throw into a stale
 * or unavailable reading, never wrong data.
 *
 * Tests NEVER hit live sites: `fetchImpl` is injectable (FetchRetryOptions from
 * @currena/scraper) and every test feeds recorded fixtures through it.
 */

/** Injectable fetch + retry/timeout options (see @currena/scraper http.ts). */
export type FetchDeps = {
  /**
   * Injectable fetch for tests (AGENTS.md rule 7 — tests run against
   * packages/insights/fixtures, never live sites). Default: global fetch.
   */
  fetchImpl?: typeof fetch;
  /** Per-attempt abort timeout (ms). Default 12s (scraper default). */
  timeoutMs?: number;
  /** Retries after the first attempt. Default 2 (scraper default). */
  retries?: number;
};

/** Thrown when a source responds in a shape the adapter cannot trust. */
export class AdapterError extends Error {
  readonly source: string;

  constructor(source: string, message: string, options?: { cause?: unknown }) {
    super(`[${source}] ${message}`, options);
    this.name = 'AdapterError';
    this.source = source;
  }
}

/** One live spot price (gold-api.com style sources). */
export interface SpotPrice {
  /** Provider symbol, e.g. 'XAG' or 'BTC'. */
  symbol: string;
  /** Price in USD. */
  price: number;
  /** Provider timestamp of the quote (ISO 8601 UTC). */
  updatedAt: string;
}

/** A single-date live observation used for derived (ratio) live points. */
export interface LivePoint {
  date: string;
  value: number;
}
