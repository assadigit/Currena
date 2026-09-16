/**
 * Shared typed error base for @currena/core.
 *
 * Every public function in this package that can fail throws a `CoreError`
 * (or a subclass) carrying a machine-readable `code`, so callers — including
 * the Hono API and the React SPA — can branch on the code and localize the
 * human message themselves. Messages here are English developer-facing text,
 * NOT user-facing copy (UI strings live in apps/web/src/i18n).
 */
export class CoreError extends Error {
  /** Machine-readable error code, e.g. 'rate_not_found'. */
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CoreError';
    this.code = code;
  }
}
