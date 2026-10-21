/**
 * The section's three cron expressions — ONE source shared by wrangler.jsonc
 * consumers and the tests. Lives in its own module (NOT the entrypoint):
 * the Workers runtime rejects non-function top-level exports, so the
 * entry file must only export handlers.
 */

/** Main run: 23:30 UTC Mon–Fri — every market has closed by then. */
export const MAIN_CRON = '30 23 * * 1-5';
/** Retry run: 01:30 UTC Tue–Sat — lands the day's write in the fresh budget slice. */
export const RETRY_CRON = '30 1 * * 2-6';
/**
 * F1 (2026-10-21 session-finality round): the Asia rung — 08:50 UTC Tue–Sat.
 * By 08:50 UTC every Asian session has closed (the last, Mumbai, closes
 * 10:00 UTC — its row lands on the NEXT rung or the 23:30 main; the other
 * seven land here). The 01:30 retry run now HOLDS intraday Asian points
 * (compute.ts sessionClosedForWrite) instead of freezing them as final
 * closes; this rung re-fetches those markets after their real closes and
 * lands the day's rows while the KV write budget is still fresh. A retry-
 * kind run (only failed/old markets) — EODHD-first when few markets need
 * data, Yahoo-first when many do, exactly like the 01:30 twin.
 */
export const ASIA_CRON = '50 8 * * 2-6';
