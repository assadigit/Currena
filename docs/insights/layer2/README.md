# Insights — Layer 2 doc set

Everything the Layer-2 preparation session (2026-10-28) produced, plus the
narrator build itself (M1 onward, also 2026-10-28). The prep set is the
preparation the spec demanded, and the contracts the narrator relies on.

| file | what it is |
|---|---|
| `INSIGHTS-L2-PREP-SPEC.md` | the spec the prep session executed (moved here from the repo root per its instruction) |
| `DECISIONS.md` | D-20…D-27 — the prep decisions; D-28… — the narrator build's decisions (research re-verified 2026-10-28, M1's calls in D-36) |
| `AU-DATA-OPTIONS.md` | the P2 investigation: precisely what is blocked and why (re-verified live), the fix-order walk, what remains, the single recommended next step |
| `NARRATION-STATE.md` | the P4 contract: `buildNarrationState`'s exact shape + the three real examples (stressed live / calm / stale-excluded) |
| `PREP-REPORT.md` | the prep session report: what changed per item, gate results, free-tier impact, the AU outcome, "What Layer 2 can rely on" |
| `INSIGHTS-L2-NARRATOR-SPEC.md` | the narrator build's own spec (the ground truth for M1–M5) |
| `RESEARCH-STARTER.md` | the pre-recorded research findings (re-verified in D-28..D-31 before use) + the 5-milestone plan |
| `SESSION-STARTER.md` | the continuation prompt for the next session |
| `SECTION-STATE.md` | the M1 contract: `buildSectionNarrationState` / `buildOverallNarrationState` / `stateHashOf` — the exact shape, field by field, with the fixtures |

Code this set points at:

- `packages/insights/src/freshness.ts` — P1 (pure, tested)
- `packages/insights/src/narrator/vocabulary.ts` + `vocabulary.generated.json` — P3 (generated from the web dictionaries; drift-gated; M1 added the section-labels block)
- `packages/insights/src/narrator/state.ts` — P4 (pure, tested, golden fixtures in `packages/insights/fixtures/narration/`)
- `packages/insights/src/narrator/wordlists.ts` — M1: the Layer-1 word canon (shared with layer1.test.ts) + the narrator's seed lists
- `packages/insights/src/narrator/section-state.ts` + `overall-state.ts` — M1: the section/overall narration states + the state hash
- `packages/insights/src/narrator/validate.ts` — M1: the V1–V10 + W1–W10 deterministic validators
- `packages/insights/src/narrator/template.ts` — M1: the template fallback (passes V1–V10 on every fixture, both languages)
- `packages/insights/fixtures/narration/sections/` — M1: the golden section fixtures (live captures + the prep inputs)
- `scripts/gates.mjs` — P5 (`pnpm gates`)
