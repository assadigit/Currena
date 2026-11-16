/**
 * @currena/insights/fx — the world currencies module tree
 * (insights-world-currencies-spec.md). SEPARATE export entry ("./fx") so
 * the SPA-facing root export (".") never pulls the provider fetch halves,
 * exactly like "./markets" before it.
 *
 *   definitions — the 10 pairs + the owner-editable CONFIG block
 *   providers   — Frankfurter + Yahoo adapters, one common quote shape
 *   compute     — pair derivation, changes, move_rank, rules R1–R7,
 *                 pattern checks, the write gate's content hash
 *   job         — the §4 fetch chain (one call + the V3 second voice)
 *   store       — the ONE KV key: read port + write-only-if-changed port
 *                 + the cross-section reads the rules need
 *   run         — the shared update orchestration (Worker cron + script)
 */

export * from './definitions';
export * from './providers';
export * from './compute';
export * from './job';
export * from './store';
export * from './run';
