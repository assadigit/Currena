/**
 * @currena/insights/markets-au — the Australian markets board (gap-closure
 * S5-M5.4). Separate export entry ("./markets-au") so the SPA-facing root
 * export never pulls the Yahoo fetch half — the markets/fx pattern.
 *
 *   definitions — the 18 probe-verified indices + the ASX session + the
 *                 shared thresholds (re-exported from the world board)
 *   providers   — the Yahoo-only provider (parse + fetch halves)
 *   compute     — the shared derived numbers (changes, 52-week, status,
 *                 weekly, stale gate) + the AU snapshot builder + the
 *                 write-only-if-changed content hash
 *   store       — the ONE KV key: insights:markets-au:v1 (reader/writer)
 *   job         — the per-market fetch chain (Yahoo-only, polite)
 *   run         — the one update orchestration (read → job → build → write)
 */

export * from './definitions';
export * from './providers';
export * from './compute';
export * from './store';
export * from './job';
export * from './run';
