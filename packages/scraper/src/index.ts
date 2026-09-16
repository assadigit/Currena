/**
 * @currena/scraper — source modules + normalizers (TGJU, Frankfurter).
 *
 * Phase 0: scaffold only. Phase 4 ports the legacy extraction — full spec is in
 * docs/FEATURE_MAP.md §4 (exact URLs, selectors, Toman unit rule, asset list).
 *
 * RULES (see /AGENTS.md):
 *   - Web-standard APIs only (fetch, Request/Response, URL, crypto).
 *   - Platform-specific storage (KV, D1) is injected via the RateStore
 *     interface defined in apps/api/src/adapters — never imported here.
 *   - Tests run against HTML fixtures in ./fixtures — never live sites.
 */
export const SCRAPER_VERSION = '0.1.0';
