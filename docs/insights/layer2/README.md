# Insights — Layer 2 prep doc set

Everything the Layer-2 preparation session (2026-10-28) produced. Layer 2
itself (the AI narrator) is NOT built — this set is the preparation the
spec demanded, and the contracts the narrator will rely on.

| file | what it is |
|---|---|
| `INSIGHTS-L2-PREP-SPEC.md` | the spec this session executed (moved here from the repo root per its instruction) |
| `DECISIONS.md` | D-20…D-27 — every ambiguity resolved conservatively, logged |
| `AU-DATA-OPTIONS.md` | the P2 investigation: precisely what is blocked and why (re-verified live), the fix-order walk, what remains, the single recommended next step |
| `NARRATION-STATE.md` | the P4 contract: `buildNarrationState`'s exact shape + the three real examples (stressed live / calm / stale-excluded) |
| `PREP-REPORT.md` | the session report: what changed per item, gate results, free-tier impact, the AU outcome, "What Layer 2 can rely on" |

Code this set points at:

- `packages/insights/src/freshness.ts` — P1 (pure, tested)
- `packages/insights/src/narrator/vocabulary.ts` + `vocabulary.generated.json` — P3 (generated from the web dictionaries; drift-gated)
- `packages/insights/src/narrator/state.ts` — P4 (pure, tested, golden fixtures in `packages/insights/fixtures/narration/`)
- `scripts/gates.mjs` — P5 (`pnpm gates`)
