/**
 * @currena/insights/tic — the foreign-holdings-of-US-Treasuries module
 * (gap-closure S2). Separate export entry ("./tic") so the SPA-facing
 * root export never pulls the fetch halves — the markets/fx pattern.
 *
 *   parse   — the two pure SLT-table parsers (fail closed)
 *   model   — the published-name ↔ slug map, custody hubs, the snapshot builder
 *   compute — the shared derived numbers (changes, net-12m, ranks, movers, stale gate)
 *   store   — the ONE KV key: insights:tic:v1 (reader/writer ports)
 *   job     — the rung3 run body (2 fetches, idempotent write)
 */

export * from './parse';
export * from './model';
export * from './compute';
export * from './store';
export * from './job';
