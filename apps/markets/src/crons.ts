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

/**
 * gap-closure S5-M5.4 (2026-11-02): the Australian markets board rung —
 * 07:00 UTC Mon–Fri. The ASX regular session closes 16:00 AEST = 06:00 UTC
 * (the market's own clock, no DST), and the F1 closeUtcMinute is 06:30 UTC
 * (the +30 min settlement margin); 07:00 UTC gives Yahoo one hour to index
 * the day's close before the run asks for it. Yahoo-only (the M5.1 probe
 * decision; EODHD's free quota is spent by the world board) — 18 fetches +
 * 1 read + 1 write = 20 subrequests, its OWN 50-subrequest budget (the
 * S5-M5.4 venue decision: rung3/rung4 are full at 45/50 after M5.2, and
 * piggybacking on the main/retry crons breaks their subrequest budget, so
 * the 4th cron on this Worker — the account's free 5-cron limit's last
 * slot — is the only budget-safe venue; the S5 spec explicitly allows the
 * markets worker). The AU job runs ALONE in its invocation (no fx twin):
 * it has nothing to do with the currencies section.
 */
export const AU_CRON = '0 7 * * 1-5';
