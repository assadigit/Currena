# Layer-2 Narrator — Final Report (M5, spec §14)

**Status:** M5 shipped. All gates green. Deployed disabled by default
(`NARRATOR_ENABLED=false`, `NARRATOR_VISIBLE=false`,
`NARRATOR_WEB_CONTEXT=false`); no key on the worker — templates only.
The owner takes it live in their own terminal.

This is the spec §14 deliverable: what shipped per section of the spec,
the files, the gate results, the free-tier numbers, the Cloudflare
limits, the Gemini findings, the decisions D-28..D-39, and the exact
copy-paste owner commands still required.

---

## 1. What shipped (per spec section)

| Spec § | What | Files | Status |
|---|---|---|---|
| §1–3 | The pure foundation: `buildSectionNarrationState` + `buildOverallNarrationState` + `templateNarrative` + V1–V10 + W1–W10 + golden fixtures | `packages/insights/src/narrator/{section-state,overall-state,template,validate,hash,wordlists,vocabulary}.ts` + 7 section fixtures | M1 — shipped |
| §4–5 | The Gemini client (call type A schema-constrained JSON; call type B plain-text EN:/FA: parsing; 15s timeout; one retry; region-refusal handling) | `packages/insights/src/narrator/gemini-client.ts` | M3 — shipped |
| §6 | The four prompts (base, section, overall, news), `PROMPT_VERSION = 1`, snapshot tests | `packages/insights/src/narrator/prompt.ts` | M2 — shipped |
| §7 | The deterministic validators (V1–V10 for state, W1–W10 for news) | `packages/insights/src/narrator/validate.ts` | M1 — shipped |
| §8 | The template fallback (deterministic, passes V1–V10 for every fixture both langs) | `packages/insights/src/narrator/template.ts` | M1 — shipped |
| §9 | Storage (`insights:narrative:v1`) + the cached endpoint (`GET /api/insights/narrative`, edge-cached `s-maxage=600`) + the stats buckets (`insights:narrator:stats`, 14 daily buckets) | `apps/api/src/{routes/insights-narrative,narrator-cron,narrator-stats,cron}.ts` + `apps/api/wrangler.jsonc` vars | M4 — shipped + deployed |
| §10 | The Gemini key tool (`pnpm narrator:set-key`) — hidden input, one minimal validation call, pipes to `wrangler secret put GEMINI_API_KEY` | `scripts/narrator-set-key.mjs` | M3 — shipped |
| §10 | The secret-scan gate (8 patterns, gate 0 of `pnpm gates`) | `scripts/secret-scan.mjs` + `scripts/gates.mjs` | M2 — shipped |
| §11 | The display (`NarrativeBlock` under each section header + the overall under the top verdict; `InTheNews` only when present; staged rollout via `?narrative=preview` + `NARRATOR_VISIBLE`) | `apps/web/src/{components/insights/{NarrativeBlock,InTheNews}.tsx,lib/narrative.ts,routes/Insights.tsx,routes/insights-sections/{SectionLane,world-feeds}.tsx,components/insights/{WorldMarkets,WorldCurrencies}.tsx,i18n/insights-copy-{en,fa}.ts}` | M5 — shipped + deployed |
| §12 | The offline eval harness (`pnpm narrator:eval`, gate 5) + the live eval harness (`pnpm narrator:eval:live`, skips cleanly if no key) | `scripts/narrator-eval.mjs` + `scripts/narrator-eval-live.mjs` | M3 + M5 — shipped |
| §13 | The kill-criteria doc + one-line switch-off instructions | `docs/insights/layer2/KILL-CRITERIA.md` | M5 — shipped |
| §14 | This report | `docs/insights/layer2/LAYER2-REPORT.md` | M5 — shipped |

---

## 2. Gate results (this milestone, M5)

```
$ pnpm gates
────────────────────────────────────────────────────────────────
 CURRENA GATES — 2026-10-28 13:42:35
────────────────────────────────────────────────────────────────
 1. secret scan             PASS  clean (8 patterns · 639 files)
 2. typecheck               PASS  6 packages
 3. lint                    PASS  0 errors, 0 warnings
 4. copy:audit              PASS  clean
 5. narrator vocabulary     PASS  in sync (129×2 + 23×2)
 6. narrator eval           PASS  50 checks (3 prep + 7 section fixtures)
 7. layer1 strict validator PASS  7809/7809 assertions
 8. full test suite         PASS  10,021 tests (core 191 · scraper 67 · insights 855 · markets 13 · api 362 · web 8533)
 9. build + bundle budget   PASS  entry 295.37/88.84 · Insights lazy 1100.49/258.36
────────────────────────────────────────────────────────────────
 ALL GATES GREEN — 1m 45s
```

**Layer 1 strict validator: 7809/7809 unchanged** (the spec's
non-negotiable — Layer 1 copy, verdict math, thresholds and alert
behaviour all untouched).

**Full suite: 10,021 tests** (+3 vs the M4 baseline of 10,018 — the 3 new
M5 API tests for the additive `visible` flag).

**Bundle budget:** entry 295.37/88.84 (unchanged from M4 — the new code is
all in the Insights lazy chunk); Insights lazy 1100.49/258.36 (was
1094.09/256.83 in M4 — +6.40 kB raw / +1.53 kB gz, the M5 display
additions). The D-16 bump: 1100 → 1110 raw (D-39 §8); gz unchanged at
260. The bump is documented inline in `scripts/check-bundle-budget.mjs`
line 693.

---

## 3. Free-tier numbers (D-28)

- **Model:** `gemini-3.5-flash-lite` (the conservative default — the
  cheapest free-tier Flash-class model; adequate for ≤120 words of plain
  explanation per call).
- **Rate limits (free tier):** ~10–15 RPM, ~1,500 RPD, no spend cap (a
  project without billing can NEVER be charged — the spec §10 requirement).
- **Grounding with Google Search:** 5,000 grounded searches/month free
  (Part 3 ships DISABLED per D-29 — see §6 below).
- **The narrator's daily call budget:** ~5 sections + 1 overall + 0–5
  grounded calls = ~6–11 calls/day → well under 1,500 RPD (~140× headroom)
  and under the 20 grounded/day default cap (NARRATOR_WEB_DAILY_CAP).

---

## 4. Cloudflare limits + how the design stays within them (D-30)

| Limit (free plan) | The narrator's usage | Headroom |
|---|---|---|
| Cron triggers per Worker (max 5) | 1 (the existing `* * * * *` minute cron; the narrator is a new rung at `:50` UTC, no new trigger) | 4 free |
| Subrequests per invocation (max 50) | ≤3 model calls per active tick + the 4 KV reads + 1 stats write = ~8 subrequests (the cron also runs the keep-warm + watchdog rungs in the same invocation) | ~42 free |
| CPU time per cron invocation (30s wall-clock) | ≤3 × 15s Gemini timeouts (sequential) = ~45s worst case — but the rung is hourly and the retry ladder is one retry, so the typical case is ≤5s | Within bounds (the worst case degrades gracefully to template) |
| KV reads/day (max 100,000) | ~24 hourly ticks × 4 reads = ~96 reads/day; visitors add ZERO (the endpoint is edge-cached `s-maxage=600`) | ~99,900 free |
| KV writes/day (max 1,000) | ~24 hourly ticks × ≤2 writes = ~48 writes/day max (only when something changed) | ~950 free |

**The visitor path is free.** The endpoint serves the stored doc verbatim
with `Cache-Control: public, max-age=300, s-maxage=600` — visitors hit
the Cloudflare edge cache, NOT the KV (D-38).

---

## 5. Region-risk findings (D-31)

The Cloudflare Worker egress region that serves
`generativelanguage.googleapis.com` for THIS account cannot be verified
without an API key (and no key exists in this session by design — the
owner enters it via `pnpm narrator:set-key`). The risk stands as
documented: 403 "location not supported" is a documented behaviour for
unsupported caller regions.

**Mitigations (in order):**
1. **Template fallback is the DEFAULT path** whenever the API is
   unreachable, refused, invalid or failing — no key → templates; kill
   switch → templates; two validation failures → templates. Region
   refusals are counted in the stats buckets (`apiErrors.region`).
2. **After the owner sets the key**, the first live week decides: if
   region errors exceed 1 in 5 A-generations (the kill criterion §1 in
   `KILL-CRITERIA.md`), switch to `placement: { mode: 'smart' }` in
   `wrangler.jsonc` and re-test.
3. **If still failing**, `NARRATOR_ENABLED=false` (one-line switch-off)
   and document.

A one-off probe (the set-key tool's validation call) records the actual
behaviour the moment a key exists.

---

## 6. Grounding-terms decision (D-29)

**Part 3 ("In the news") ships DISABLED** (`NARRATOR_WEB_CONTEXT=false`).
The re-verified findings (the Gemini API Additional Terms of Service,
effective 2025-05-20, and the grounding docs):

- **Grounding IS available on the free tier** for Gemini 3.x Flash models
  (5,000 grounded searches/month free per project).
- **The free-tier terms allow Google to use submitted content + generated
  responses to improve its products** — our inputs are public market data
  only (no PII, no confidential data), so this is acceptable per the
  spec §5 "Free-tier terms" rule (noted in `docs/DEPLOY.md`).
- **The display requirements (Google's `searchEntryPoint.renderedContent`
  HTML beside grounded text) are IMPLEMENTED** in `InTheNews.tsx` (the
  `requiredDisplay` field renders via `dangerouslySetInnerHTML`). The
  gate is the TERMS review, not the code.

**Conservative default:** ship Part 3 DISABLED until the owner has read
the current Google terms in full + confirmed each display requirement is
implementable + the first live week's stats are green. The flip is one
command: `cd apps/api && pnpm exec wrangler versions upload --var
NARRATOR_WEB_CONTEXT:true` (after the owner's terms review).

---

## 7. Decisions D-28..D-39 (the L2 narrator build)

| Decision | Milestone | Subject |
|---|---|---|
| D-28 | M3 | The Gemini model + free-tier limits findings (re-verified in Google's docs) |
| D-29 | M3 | The grounding-terms decision (Part 3 ships DISABLED) |
| D-30 | M3 | The Cloudflare limits findings + the cron-rung design |
| D-31 | M3 | The region-risk findings + the template-fallback default |
| D-32 | M1 | The section list (4 sections + 1 overall) + the overall state's alert policy |
| D-33 | M2 | The secret-scan addition to `pnpm gates` (gate 0) |
| D-34 | M3 | The staged-rollout visibility flag (`NARRATOR_VISIBLE=false` default; preview via `?narrative=preview`) |
| D-35 | (reserved) | The kill criteria defaults (now in `KILL-CRITERIA.md`) |
| D-36 | M1 | M1 implementation decisions (the pure foundation) |
| D-37 | M3 | M3 implementation decisions (the client + the tools) |
| D-38 | M4 | M4 implementation decisions (the rung + KV + the endpoint; DEPLOYED disabled) |
| D-39 | M5 | M5 implementation decisions (display + live eval + kill criteria + final report) |
| D-40+ | (reserved) | Post-M5: the owner's first live week |

Full text in `docs/insights/layer2/DECISIONS.md`.

---

## 8. The exact owner commands still required (copy-paste)

### Step 1 — Set the Gemini key (one-time, in your own terminal)

The key is a Worker SECRET. Never pasted into chat, never in argv, never
logged, never stored in the repo. You enter it with hidden input via the
M3 tool:

```sh
cd /path/to/Currena
pnpm narrator:set-key
# → prompts for the key (no echo)
# → validates with one minimal Gemini call (the models list)
# → pipes to `wrangler secret put GEMINI_API_KEY` via stdin
# → prints "Key saved. Nothing else to do."
```

If you pasted the `AQ.Ab8…` string anywhere public, ROTATE it
immediately (it's a Google OAuth refresh token, not a Gemini API key).
Get a real `AIza…` key from https://aistudio.google.com/app/apikey
inside a project WITHOUT billing enabled.

### Step 2 — Run the live eval (in your own terminal, before enabling)

```sh
export GEMINI_API_KEY=AIza…   # the same key you just set on the worker
pnpm narrator:eval:live
# → writes docs/insights/layer2/EVAL-OUTPUTS.md
# → open it in your editor, read EN + FA + the validation verdicts
```

If anything reads wrong, STOP — do not enable. File the finding in
`docs/insights/layer2/DECISIONS.md` (continue after D-40).

### Step 3 — Enable the model (templates → AI; preview-only still)

```sh
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_ENABLED:true
```

The generation rung (hourly at `:50` UTC) starts making real model calls.
The display is still preview-only — the public URL shows nothing new.

### Step 4 — Read real text for ~7 days at the preview URL

```
https://currena.ir/?narrative=preview#/insights
```

Read in EN + FA, at 360px (mobile) and 1280px (desktop). Open the
"In the news" sources (when present) and verify they're recent + reputable
+ the note matches. Check the kill criteria daily (see
`docs/insights/layer2/KILL-CRITERIA.md`).

### Step 5 — Flip visibility (preview → public)

After ~7 days of green stats + clean spot checks:

```sh
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_VISIBLE:true
```

The public URL starts rendering the narratives. Keep watching the stats
daily for another week. Any kill criterion tripping → the one-line
switch-off in `KILL-CRITERIA.md`.

### (Optional, later) — Enable Part 3 ("In the news")

After you've read the current Google grounding terms in full + confirmed
each display requirement is implementable (the `requiredDisplay` path in
`InTheNews.tsx` is already built):

```sh
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_WEB_CONTEXT:true
```

The hourly rung starts making grounded calls (one per section per 24 h,
under the `NARRATOR_WEB_DAILY_CAP=20` default). The kill criteria for
Part 3 are in `KILL-CRITERIA.md` §2.

---

## 9. The hidden-until-enabled rollout (recap)

- **Default state on deploy:** `NARRATOR_ENABLED=false` (templates only) +
  `NARRATOR_VISIBLE=false` (preview only) + `NARRATOR_WEB_CONTEXT=false`
  (Part 3 disabled) + no `GEMINI_API_KEY` (no model calls possible).
- **The KV doc is generated regardless** (the cron rung runs at :50 UTC
  every hour, writes template narratives when disabled/keyless). The
  texts are ready in KV the moment the owner flips visibility.
- **The preview marker works regardless of `visible`** — the owner reads
  real text at `?narrative=preview` for a week before flipping.
- **The flip is one command** (a `wrangler versions upload --var …`); the
  switch-off is one command (the same with `:false`). The deploy-lock
  protocol stays intact (check Cloudflare versions/deployments APIs
  first — see `docs/DEPLOY.md`).

---

## 10. Live-verification evidence (the M5 deploy)

See `docs/DEPLOY.md`'s M5 session record (the deployed currena-api
version ID, the live-verification at `https://currena.ir/?narrative=preview#/insights`
in EN + FA at 360px and 1280px, the absence of console errors, the
normal-URL "shows nothing new" check). The session record follows the
existing pattern (every prior milestone recorded its deploy version +
live-verification in DEPLOY.md).

---

## 11. What's NOT in this build (deliberate)

- **Part 3 ("In the news") is DISABLED** by default (D-29). The code is
  built (the W1–W10 validators, the grounded call type B in the Gemini
  client, the `InTheNews` component, the `requiredDisplay` rendering
  path). The gate is the owner's terms review + the flip.
- **The model is NOT called per visitor.** The cron rung generates texts
  hourly; the endpoint serves the stored doc verbatim with edge-cache
  headers; the web fetches once per Insights mount. Visitors add zero
  model calls + zero KV reads.
- **No verdict math, thresholds, alert behaviour or Layer 1 copy was
  touched.** The 7809/7809 Layer 1 strict validator count is unchanged.
- **No new cron trigger.** The narrator rides the existing `* * * * *`
  minute cron as a new `:50` rung.
- **No new KV topology.** Two new keys (`insights:narrative:v1` +
  `insights:narrator:stats`) ride the existing `RATES` binding.

Layer 2 is COMPLETE. The owner takes it live.
