/**
 * Typed error for scraper failures. Machine-readable `code` so the API ladder
 * can record it in SourceStatus and map it to the RatesError envelope; the
 * message is English developer text (the SPA re-localizes, core errors.ts
 * convention).
 */

export class ScraperError extends Error {
  /** Machine-readable error code, e.g. 'tgju_missing_slug'. */
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScraperError';
    this.code = code;
  }
}

/** Best-effort { code, message } extraction from any thrown value. */
export function errorToCodeMessage(err: unknown): { code: string; message: string } {
  if (err instanceof ScraperError) return { code: err.code, message: err.message };
  if (err instanceof Error && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return { code: (err as { code: string }).code, message: err.message };
  }
  return { code: 'scrape_failed', message: err instanceof Error ? err.message : String(err) };
}
