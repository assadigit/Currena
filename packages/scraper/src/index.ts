/**
 * @currena/scraper — source modules + normalizers (TGJU, Frankfurter).
 *
 * Phase 4 implements the real extraction (docs/FEATURE_MAP.md §4):
 *   - tgju.ts        — ajax.json primary + profile-page fallback, Rial→Toman
 *   - frankfurter.ts — ECB reference rates, base USD
 *   - http.ts        — fetchWithRetry (Chrome UA, timeout, quick retries)
 *   - store.ts       — RateStore port + in-memory reference implementation
 *
 * RULES (AGENTS.md):
 *   - Web-standard APIs only (fetch, Request/Response, URL, crypto) — runs
 *     identically in the Cloudflare Worker and Node tests.
 *   - All storage access goes through the RateStore interface (rule 2); the
 *     Workers KV adapter lives in apps/api/src/adapters/, never here.
 *   - Scraper output is zod-validated against @currena/core contracts —
 *     upstream changes fail loudly (rule 3).
 *   - Tests run against fixtures in ./fixtures — never live sites (rule 7).
 */

export const SCRAPER_VERSION = '0.1.0'; // matches package.json — keep in sync

export { ScraperError, errorToCodeMessage } from './errors';

export type { RateStore, SourceStatus } from './store';
export { InMemoryRateStore } from './store';

export {
  BROWSER_HEADERS,
  BROWSER_UA,
  fetchWithRetry,
  mapWithConcurrency,
} from './http';
export { HttpError } from './http';
export type { FetchRetryOptions } from './http';

export {
  TGJU_AJAX_URL,
  TGJU_PROFILE_BASE,
  TGJU_PROFILE_CONCURRENCY,
  TGJU_PROFILES,
  buildTgjuSnapshot,
  normalizeTgjuNumber,
  parseTgjuAjax,
  parseTgjuGold,
  parseTgjuProfilePrice,
  rialToToman,
  scrapeTgju,
  scrapeTgjuProfiles,
  tgjuProfilePageUrl,
  validateSnapshot,
} from './tgju';
export type { TgjuScrapeOptions } from './tgju';

export {
  FRANKFURTER_LATEST_URL,
  buildFrankfurterSnapshot,
  currencyDisplayName,
  scrapeFrankfurter,
} from './frankfurter';
export type { FrankfurterScrapeOptions } from './frankfurter';
