# Layer 2 — Preparation Report

**Spec executed:** `docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md`
(moved into this folder from the repo root, per its instruction).
**Session:** 2026-10-28. **Mode:** fully autonomous — no questions asked;
every ambiguity resolved conservatively and logged as **D-20…D-27** in
`DECISIONS.md`. **No AI feature was built:** zero model calls, zero keys,
zero prompts. **Zero changes** to Layer-1 copy, verdict math,
thresholds, alert behaviour, KV topology or the ingest's request budget.

**Status: P1–P5 complete, all gates green with the Layer-1 numbers
holding, deployed and live-verified.**

---

## 1. What changed, per work item

### P1 — Freshness (data age) for every reading — DONE

- **`packages/insights/src/freshness.ts`** (new, pure, no I/O):
  `freshnessOf(def, asOf, now)` → `{ asOf, ageHours, cadence, freshness
  }` with the tri-state `fresh | stale | unavailable`. Thresholds: the
  spec's conservative cadence defaults (daily 4 · weekly 10 · monthly 45
  · quarterly 120 — deliberately equal to the status engine's
  GRACE_DAYS, test-pinned) refined per indicator by importing each
  definition's documented `staleAfterDays` override (D-20). `per-change`
  and `manual` never go stale by age. The AU trio is REPORTED at its
  real served cadence (`monthly`, the live F2.1 fallback) while its
  threshold stays the definition's own 40-day override — one tripwire
  with the status engine (D-21; freeze tests included).
- **`packages/insights/src/freshness.test.ts`** (new, 21 tests): each
  cadence at the boundary (just fresh / just stale), the weekend case
  (Friday→Sunday fresh, Friday→Wednesday stale), the missing-timestamp
  case (`unavailable`), hour math, the override-import agreement with
  the status engine (FRESHNESS_STALE_DAYS == GRACE_DAYS +
  per-definition threshold equality), and the AU-trio refinement.
- **Page honesty (spec §3.4):** `FreshnessAsOfLine` in
  `apps/web/src/components/insights/CardMeta.tsx` (rendered by AlertCard
  AND CompactRow through the shared CardMetaRow — zero prop threading):
  a small muted "Data as of {date}" line that fires ONLY when the
  reading's freshness is stale/unavailable AND its card does not already
  say so (status-stale cards flag + age their data; every card's meta
  row dates its data — D-22). **Today it renders nowhere by design**
  (freshness agrees with the status engine on every threshold); it is
  the tested safety net for the frozen-feed case. One new UI string
  pair: `ui.cardDataAsOf` — EN "Data as of {date}" / FA «آخرین داده:
  {date}» (Persian-safe; deliberately unlike the header's currency-
  claiming `ui.dataAsOf`), triaged in the copy manifest round
  `2026-10-28-l2-prep`.
- **`apps/web/src/components/insights/freshness-line.test.tsx`** (new, 8
  tests): the pure gate + the rendered line in both languages + the
  invariant that a fresh reading renders byte-for-byte the old meta row.
- Timestamps: the `asOf` the system already stores — **no API response
  shape change at all** (the spec's §3.3 conditional was not needed).

### P2 — Australia data source — DONE (investigated; the live monthly path IS the official fix; no new source wired)

The precise, re-verified truth (full record:
`AU-DATA-OPTIONS.md`):

- **What is blocked and why:** ONLY `rba.gov.au/…/f2-data.csv` (the
  DAILY 10y/3y yields) is Akamai-403 from Cloudflare Workers egress —
  re-verified LIVE this session by invoking the still-deployed
  `rba-probe` worker (HTTP 403). Everything else RBA serves fine to the
  same egress: the 04:10 UTC ingest's own KV status blob shows F1, F1.1,
  E2, F6, F4.1, BOTH F2.1 monthly series and the cash-rate HTML page
  `fetched` this morning (the only RBA row is the honest `disabled` skip
  of the f2 path). **Round 10's "every rba.gov.au path blocked" claim is
  corrected with evidence (D-27).**
- **The trio is NOT frozen:** it rides the F2.1 MONTHLY table — official
  RBA data, CC BY 4.0 (LICENCES.md L0), fetched successfully every
  ingest run, honestly dated (`asOf 2026-09-30` = the September file,
  published 02-Oct-2026, the freshest monthly print that exists;
  October's publishes ~02-Nov-2026). This satisfies the spec's fix-order
  item 1 ("an official RBA data feed or file that is not blocked and is
  permitted") — so P2.4's "mark unavailable" branch is NOT triggered;
  P2.5's flow applies instead: fresh readings appear, P1 reports
  `fresh` (monthly cadence), free-tier impact zero.
- **No legitimate DAILY alternative exists today:** AOFM answers HTTP
  520 from Worker egress (dead venue — and its terms could not be read
  honestly either way); data.gov.au is reachable but has no daily AGS
  10y/3y yield dataset; FRED's AU long-term series is OECD-sourced
  monthly (no granularity gain); ASX terms PROHIBIT automated access
  (L3 — never fetched); Yahoo has no AU-10y yield ticker and its
  endpoints are L2-limited to the four price tiles. Nothing was
  circumvented anywhere (the production fetch policy stays the honest
  declared-UA F-09/T-25).
- **The single recommended next step** (AU-DATA-OPTIONS.md §4): watch
  the f2 path (not "RBA") — when it serves again from Worker egress,
  remove the ingest skip + the three freshness cadence refinements, and
  the daily discipline re-tightens. The GHA venue (different egress)
  remains the owner-side fallback once Actions minutes reset
  (docs/DEPLOY.md "Repairing CI").

### P3 — The vocabulary usable from the Worker — DONE

- **`packages/insights/scripts/generate-narrator-vocabulary.ts`** +
  `pnpm narrator:vocabulary`: generates a DETERMINISTIC snapshot of the
  web dictionaries' `layer1` objects (129 indicators + 23 glossary
  terms + the UI labels, both languages) into
  **`packages/insights/src/narrator/vocabulary.generated.json`** (262
  kB, sha256-stamped, no timestamps — changes only when the copy
  changes). The web dictionaries remain the ONE hand-edited source; the
  web app imports none of this (D-23 — the generated-JSON option the
  spec sanctions, chosen over moving the dictionaries because the
  Persian-copy audit's SOURCES are path-anchored and the web must keep
  working exactly as today).
- **`packages/insights/src/narrator/vocabulary.ts`** (exported as
  `@currena/insights/narrator`): **`getNarratorVocabulary(ids, lang)`**
  returns, for ONLY the requested ids, the compact fields — `plainName`,
  `oneLine`, `ifRising`/`ifFalling` (null + `skipReason` for the 7
  pattern cards, D-09), the connections BETWEEN the requested ids
  (dangling links dropped), `australiaAngle` where written — plus ONLY
  the glossary terms those entries use; unknown ids are reported in
  `missing`, never guessed. Both languages, typed; en↔fa parity enforced
  at generation time AND by 12 tests
  (`src/narrator/vocabulary.test.ts`).
- **Drift gate:** `pnpm narrator:vocabulary:check`
  (`scripts/check-narrator-vocabulary.ts`) regenerates in memory and
  byte-compares — it runs inside `pnpm gates`, so any copy change
  without regeneration breaks the build.

### P4 — The narration input contract — DONE

- **`packages/insights/src/narrator/state.ts`**:
  **`buildNarrationState(snapshot, now)`** — a pure, typed projection of
  the ALREADY-COMPUTED page state (the math decides; the AI only
  explains — D-24). The output: `generatedAt` (= `now`),
  `dataAsOf` (oldest/newest FRESH asOf), `verdict` (the snapshot's own
  summary lines, verbatim — the existing labels), `fxSignal` (the fx
  document's own rollup, null when absent), `alerts` (warning-status
  readings: id, tier `needs-attention`, direction, ONE plain magnitude
  — rounded value + unit + window — never a raw dump), `patterns` (fx
  rules with outcome warning/watch + counted), `items` (every FRESH
  reading with its P1 freshness), `excluded` (stale/unavailable with
  reasons — never mixed into the facts; partition test-pinned).
- **`docs/insights/layer2/NARRATION-STATE.md`**: the exact shape,
  field by field, with the three real examples.
- **Golden fixtures** — `packages/insights/fixtures/narration/`:
  `stressed-live.json` (REAL live data captured 2026-10-28: both
  sections stressed, 16 alerts, the r6 Europe-worry pattern active),
  `calm.json` (constructed: every warning calmed, summaries recomputed
  with the REAL `summarizeByGauges`), `stale-excluded.json`
  (constructed: the AU trio frozen 75 days + one unavailable reading →
  4 excluded, 96 items, 14 alerts). Each is `{scenario, description,
  provenance, now, input, output}`.
- **`src/narrator/state.test.ts`** (17 tests): golden re-derivation
  (byte-semantics equality), the shape freeze (exact key sets at every
  level — an unnoticed contract change fails a test), the core
  invariants (excluded never in facts; items+excluded partition the
  readings; dataAsOf spans fresh items only; deterministic ordering),
  and unit behaviour (plain magnitudes + windows, fx-absent minimum,
  the electorate count, the AU trio narrated as MONTHLY data with its
  own asOf).

### P5 — One command for all gates — DONE

- **`scripts/gates.mjs` + `pnpm gates`**: seven gates in order —
  typecheck → lint → copy:audit → narrator-vocabulary drift → the
  `LAYER1_STRICT=1` validator → the full suite → build + bundle budget
  — one-screen summary with the key numbers, per-failure output tails,
  non-zero exit on any failure (D-25). Every step runs even when an
  earlier one fails.
- **`docs/DEPLOY.md`** gained the 5-line owner-side **"Repairing CI"**
  note (billing/minutes check, plan or self-hosted runner, re-run the
  workflow, secret rotation, keep the local-gate discipline).
- `AGENTS.md` Commands now lists `pnpm gates` as the pre-deploy rule.

---

## 2. Files

| area | files |
|---|---|
| new modules | `packages/insights/src/freshness.ts`, `packages/insights/src/narrator/{index,vocabulary,state}.ts`, `packages/insights/src/narrator/vocabulary.generated.json` |
| new tests | `packages/insights/src/freshness.test.ts` (21), `packages/insights/src/narrator/vocabulary.test.ts` (12), `packages/insights/src/narrator/state.test.ts` (17), `apps/web/src/components/insights/freshness-line.test.tsx` (8) |
| new scripts | `packages/insights/scripts/{generate-narrator-vocabulary,check-narrator-vocabulary,build-narration-fixtures}.ts`, `scripts/gates.mjs` |
| new fixtures | `packages/insights/fixtures/narration/{stressed-live,calm,stale-excluded}.json` |
| web (minimal) | `apps/web/src/components/insights/CardMeta.tsx` (the safety net), `apps/web/src/i18n/insights-copy-{en,fa}.ts` (one UI string pair), `docs/localization/persian-copy-manifest.json` (+1 triaged entry) |
| docs | `docs/insights/layer2/{INSIGHTS-L2-PREP-SPEC,DECISIONS,AU-DATA-OPTIONS,NARRATION-STATE,README,PREP-REPORT}.md`, `docs/DEPLOY.md` (CI note + session record), `CHANGELOG.md` (2026-10-28b), `AGENTS.md`, screenshots `docs/insights/screenshots/layer2-prep/` (5) |
| package manifests | root `package.json` (+`gates`, +`narrator:vocabulary[:check]`), `packages/insights/package.json` (+`./narrator` export, +scripts), `packages/insights/src/index.ts` (freshness exports) |

## 3. Gate results (clean run, 2026-10-28, `pnpm gates`)

| gate | result | Layer-1 record | delta |
|---|---|---|---|
| typecheck | 6/6 packages | 6/6 | — |
| lint | 0 errors / 0 warnings | 0 errors | — |
| copy:audit | ✓ clean (manifest 4,547) | ✓ clean (4,546) | +1 triaged string (the P1 line) |
| narrator vocabulary | in sync (129×2 + 23×2) | — | new gate |
| `LAYER1_STRICT=1` validator | **7,809 / 7,809** | **7,809** | **unchanged** |
| full suite | **9,875 passed** | 9,817 | +58 new tests (insights 677→727, web 8,525→8,533) |
| build + budget | entry 295.37/88.84 · Insights lazy 1094.09/256.83 | 295.37/88.84 · 1092.56/256.31 vs budgets 296/89.5 · 1100/260 | **held, no bump** (+1.53 raw / +0.52 gz — the safety net + the string) |

**Deployment:** deploy-lock re-checked clear (newest currena-api
deployment still the L1 session's `c6d1a13f`, 09:03Z; origin/main at
this session's `f56bfaa`) → currena-api **`39c7a4b0-4563-4121-83e4-
9ce953ad689b`** (2026-10-28 ~10:16 UTC). currena-markets NOT redeployed
(neither worker imports the new modules — additive only). **Live
verification:** health ok · 100 readings (generatedAt unchanged — zero
data changes: au-10y 5.283 @ 2026-09-30 before AND after) · markets/fx/
status 200 · the page verified EN+FA at 1280px and 360px with ZERO
console/page errors, zero horizontal overflow, the Layer-1 blocks
rendering, the AU card dating its data in both languages, and the
freshness-line count exactly 0 everywhere (the designed state). 5
screenshots in `docs/insights/screenshots/layer2-prep/`.

## 4. Free-tier impact (the daily totals)

- **New KV operations added: 0** (read or write). The freshness function
  is pure client/Worker-side computation; the vocabulary and narration
  modules import generated code, not storage.
- **New external fetches added: 0.** The ingest's request budget is
  untouched (the F2.1 daily fetch predates this session).
- **One-off diagnostics this session (not production load):** 5 requests
  through the two EXISTING probe workers (rba-probe ×4, currena-r10-
  probe ×1) + one read of `insights:status` via the Cloudflare API +
  the live fixture capture (2 GETs to currena.ir). Nothing recurring.
- Bundle: the web entry chunk byte-identical in size; the Insights lazy
  chunk +1.53 kB raw / +0.52 kB gz — inside the documented ceiling, no
  D-16 bump needed. Worker script unchanged in behaviour (assets-only
  deploy).

## 5. The AU data outcome

**Fixed — at monthly granularity, by the already-live official path**
(RBA F2.1, CC BY 4.0, venue-served, honestly dated), with the DAILY
granularity documented as venue-blocked (f2-data.csv, re-verified) and
no legitimate daily alternative existing. The spec's
"mark as unavailable" fallback was NOT needed; the freeze tripwire
(40-day status + freshness window, one shared threshold) protects
against the frozen case, and the narrator can never mistake the trio
for live daily prints (monthly cadence + asOf + ageHours in its input).
Full options record with the recommended next step:
`AU-DATA-OPTIONS.md`. Decisions: D-21, D-26, D-27.

## 6. Decisions

**D-20** freshness thresholds (cadence defaults + documented override
import; one discipline with the status engine) · **D-21** the AU trio
reported at its real served monthly cadence · **D-22** the
"already says so" resolution (safety-net line; the visitor clock) ·
**D-23** the generated-JSON vocabulary (web untouched) · **D-24** the
narration-state shape (projection, never re-derivation) · **D-25**
`pnpm gates` composition · **D-26** the P2 outcome · **D-27** the R10
block-claim correction. Full texts: `DECISIONS.md`.

## 7. What Layer 2 can rely on — the exact imports

```ts
// P1 — freshness for every reading (pure, tested, Worker-safe):
import { freshnessOf, freshnessOfReading } from '@currena/insights';
// → { asOf, ageHours, cadence, freshness: 'fresh'|'stale'|'unavailable' }

// P3 — the vocabulary subset for exactly the ids you are narrating:
import { getNarratorVocabulary, getNarratorUi } from '@currena/insights/narrator';
// getNarratorVocabulary(ids, 'en' | 'fa') → { ids, missing, entries, glossary }
// (plainName · oneLine · ifRising/ifFalling · connections between the
//  requested ids · australiaAngle · glossaryTerms → the used glossary only)

// P4 — the narration input contract (pure, typed, golden-pinned):
import { buildNarrationState } from '@currena/insights/narrator';
// buildNarrationState({ insights, fx? }, now) → NarrationState
// (verdict · fxSignal · alerts · patterns · items with freshness · excluded)

// The golden fixtures (regenerate ONLY on an intentional contract change):
// packages/insights/fixtures/narration/{stressed-live,calm,stale-excluded}.json
// + docs/insights/layer2/NARRATION-STATE.md (the shape, field by field)

// The one command that runs every gate (run before ANY deploy):
// pnpm gates
```

Also relied upon: `VOCABULARY_IDS` (the 129), `VOCABULARY_SOURCE` (the
sha256 provenance), the drift gate `pnpm narrator:vocabulary:check`
(inside `pnpm gates`), and `scripts/build-narration-fixtures.ts` for
regenerating the fixtures from a fresh live capture.

**Not built (Layer 2's own work):** any model call, prompt, key,
endpoint, cron rung or KV write — this session prepared the contracts
and the gates only.
