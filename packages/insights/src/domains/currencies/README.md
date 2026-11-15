# domains/currencies/

The currencies domain's engine: the `fx/` subfolder (the FX board job — compute, content, cross-inputs, definitions, entries, job, maths, pairs, providers, rules, run, store, summary, weekly) plus `basket.ts` (the dollar-basket computation — the shared `adapters/derived.ts` assembly reads it, the documented shared→currencies edge, overlap N17) and the adapters `frankfurter` (the FX pair legs) and `cofer` (usd-reserve-share via the IMF SDMX 3.0 API). The exports-map `./fx` + `./fx/definitions` entries repoint here at move time (names frozen).
