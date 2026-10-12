/**
 * @currena/insights/markets — the world stock markets module tree
 * (insights-world-markets-spec.md). SEPARATE export entry ("./markets") so
 * the SPA-facing root export (".") never pulls the provider fetch halves,
 * exactly like "./adapters" vs "." before it.
 *
 *   definitions — the 16 markets + the owner-editable CONFIG block
 *   providers   — EODHD + Yahoo adapters, one common series shape
 *   compute     — validation R1–R7, derived numbers, status, signal, hash
 *   job         — the §3.4 fetch chain (main + retry runs)
 *   store       — the ONE KV key: read port + write-only-if-changed port
 */

export * from './definitions';
export * from './providers';
export * from './compute';
export * from './job';
export * from './store';
export * from './run';
