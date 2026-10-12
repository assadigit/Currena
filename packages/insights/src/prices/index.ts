/**
 * @currena/insights/prices — the live-prices module tree (the volatility-
 * scaled refresh, 2026-10-12). SEPARATE export entry ("./prices") so the
 * SPA-facing root export (".") stays pure, exactly like "./markets".
 *
 *   definitions — the four assets + the owner-editable intervals CONFIG
 *   providers   — Yahoo quote → stored entry (live value + 7/30-day changes)
 *   job         — the hourly refresh (interval gating, hold-on-failure)
 *   store       — the ONE KV key: read port + write-only-if-changed port
 *   merge       — the PURE serve-time overlay (GET /api/insights)
 */

export * from './definitions';
export * from './providers';
export * from './job';
export * from './store';
export * from './merge';
