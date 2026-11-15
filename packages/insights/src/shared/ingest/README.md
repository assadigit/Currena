# shared/ingest/ (engine)

The ingestion plumbing — `data.ts` (the bundled root `data/*.json` reads — the depth-sensitive imports re-counted at move time, risk R8), `kv-store.ts`, `run.ts` (the rung orchestration) and `index.ts`. The exports-map `./ingest` entry repoints here at move time (entry name frozen); apps/api's cron rungs import it by that stable name, so no consumer changes.
