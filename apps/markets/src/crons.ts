/**
 * The section's two cron expressions — ONE source shared by wrangler.jsonc
 * consumers and the tests. Lives in its own module (NOT the entrypoint):
 * the Workers runtime rejects non-function top-level exports, so the
 * entry file must only export handlers.
 */

/** Main run: 23:30 UTC Mon–Fri — every market has closed by then. */
export const MAIN_CRON = '30 23 * * 1-5';
/** Retry run: 01:30 UTC Tue–Sat — lands the day's write in the fresh budget slice. */
export const RETRY_CRON = '30 1 * * 2-6';
