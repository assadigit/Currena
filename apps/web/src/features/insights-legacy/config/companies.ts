/**
 * The COMPANIES_TABLE feature flag (R10-3, 2026-10-28).
 *
 * The owner's R9-09 directive — a table of ~50 world-leading companies
 * below the markets tiles — was BLOCKED on the EODHD free-plan quota
 * (20 API calls/day total; the markets board already consumes ~16–18).
 * R10-3 pre-builds the table behind this flag, OFF by default:
 *
 *  - The UI renders the EMPTY STATE when the flag is off (an honest
 *    "this feature is not yet enabled" panel — never a fake loading
 *    spinner or a half-rendered table).
 *  - The cron rung is NOT WIRED while the flag is off (the markets
 *    worker has no `companies` fetch rung in apps/markets/src/). Zero
 *    live calls; zero daily-pipeline changes.
 *  - The adapter STUB (packages/insights/src/companies/adapter.ts) is
 *    exercised by unit tests against fixtures only.
 *
 * ## The flip procedure (one-line change; the owner's future paid plan)
 *
 *  1. The owner upgrades the EODHD plan to any tier that EITHER lifts
 *     the daily request ceiling above ~70 calls/day (16 index + ~50
 *     company + margin) OR unlocks the bulk-last-day endpoint (the
 *     cheaper path — ~5 calls/day covers the whole table; see the R9-09
 *     audit in ROUND9_REPORT.md).
 *  2. Flip this constant to `true` (the one-line change).
 *  3. Wire the `companies` fetch rung on the markets worker (one new
 *     file under apps/markets/src/ + one entry in the cron schedule
 *     — see ROUND10_REPORT.md R10-3 for the exact procedure). The
 *     rung uses `fetchCompanyEod` per ticker, split across the
 *     budget; or `bulk-last-day/{exchange}` if the paid plan unlocks
 *     it (one call per exchange).
 *  4. Add a `insights:companies:v1` KV key + a public read endpoint
 *     on currena-api (mirroring `insights:markets:v1`).
 *  5. The UI's empty state is replaced automatically by the live
 *     table once the endpoint serves data — the same `marketsState`-
 *     style feed contract the WorldMarkets component uses.
 *
 * While the flag is off, this file is the only edit site. The config,
 * the adapter, the fixtures and the tests all stay in place.
 */

/**
 * The master switch. OFF (`false`) by default — R10-3 ships the table
 * behind the flag without wiring the live data feed. Flip to `true`
 * after the owner's EODHD plan upgrade + the cron rung + the KV
 * endpoint land (see the flip procedure above).
 */
export const COMPANIES_TABLE_ENABLED = false;
