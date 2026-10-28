# Layer 2 Narrator — Research Starter (for the next session)

**Spec:** `docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md`.
**Purpose:** save the next session the lookup work for the four research
items the spec requires (current Gemini model + free-tier limits,
grounding terms, Cloudflare Worker limits, region risk). Findings are
as of 2026-10-28; the next session MUST re-verify each in the official
docs before recording the decision (per spec §5).

---

## 1. Current Gemini model + free-tier limits (re-verify in Google's docs)

**Most likely current model name (as of 2026-10):** `gemini-3.8-flash`
or `gemini-3.1-flash-lite`. Per Google's pricing page (search results
2026-10-28): Gemini 3.8 Flash is the current default for most apps;
3.1 Flash-Lite is the cheapest current-generation model. Both are
free-tier eligible.

**Free-tier rate limits (the conservative, broadly-reported numbers):**
- **RPM (requests per minute):** ~10–15 on Flash-class models (varies
  by model + tier; verify in AI Studio's "View your active rate limits"
  page).
- **RPD (requests per day):** ~1,500 for Gemini 2.5 Flash (per the
  Google AI forum); 3.x Flash is similar. Resets at midnight Pacific
  time.
- **TPM (tokens per minute):** varies (~250k for Flash models).
- **Spend-based rate limit:** NONE on the Free tier (the "spend rate
  limit" rows in the docs say "N/A" for Free — only Tiers 1/2/3 carry
  spend caps). So a project without billing can NEVER be charged.
- **Grounding with Google Search:** **5,000 grounded searches/month
  free on Gemini 3.x models**, then $14/1000. Verify per-model in the
  grounding docs.

**Decision the next session should log (D-28 reserved):**
- `NARRATOR_MODEL` env var default = `gemini-3.1-flash-lite` (the
  cheapest free-tier Flash model — adequate for ≤120 words of plain
  explanation per call; the spec's tasks are not reasoning-hard).
- Per-minute spacing: 1 call per cron tick at most (the minute cron
  runs every minute; spacing ≥60s respects 10–15 RPM trivially).
- Per-day budget: ~5 sections + 1 overall + 5 grounded = ~11 calls/day
  → well under 1,500 RPD and under 20 grounded/day default cap.

**Re-verify sources:**
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/pricing
- https://aistudio.google.com/docs/rate-limits (the AI Studio mirror)

---

## 2. Google Search grounding — free-tier terms + display requirements
   (re-verify in the Grounding docs)

**Findings (2026-10-28):**
- Grounding with Google Search IS available on the free tier for
  Gemini 3.x Flash models (5,000/month free per project).
- The Gemini API Additional Terms of Service (effective 2025-05-20)
  explicitly says: for **Unpaid Services** (free tier), "Google uses
  the content you submit to the Services and any generated responses
  to provide, improve, and develop Google products" — our inputs are
  PUBLIC market data (no PII, no confidential data), so this is
  acceptable per the spec's "Free-tier terms" rule. The next session
  must note this in `docs/DEPLOY.md` (per spec §5 "Free-tier terms").
- The Cloudflare Worker egress is from one of Google's supported
  regions; if a 403 "location not supported" appears, the mitigation
  is an AI Gateway or a different Cloudflare colocation hint.

**Display requirements the next session must verify (spec §5):**
- Google's grounding metadata returns `groundingMetadata` with
  `webSearchQueries`, `groundingChunks` (URL + title), and
  `searchEntryPoint` (an HTML snippet Google requires sites to render
  when displaying grounded content). The spec §11 "any display element
  Google's terms require" = the `searchEntryPoint.renderedContent`
  HTML, which must be rendered unescaped next to the grounded text.
- Verify in: https://ai.google.dev/gemini-api/docs/grounding

**Storage/redistribution:**
- The Additional Terms allow caching generated content (the spec's
  KV cache + many-visitors pattern is permitted, as long as the
  required display elements are rendered). Re-verify in the grounding
  docs.

**Decision the next session should log (D-29 reserved):**
- If the grounding terms are clear and the display requirements are
  implementable → ship part 3 with `NARRATOR_WEB_CONTEXT=true`.
- If any requirement is unclear or unimplementable → ship part 3
  DISABLED (`NARRATOR_WEB_CONTEXT=false`) and say so in the report.
- Conservative default: SHIP PART 3 DISABLED until the next session
  has read the current grounding terms in full and confirmed each
  requirement is implementable. (The base A-section + A-overall
  narratives work without grounding and ship first.)

---

## 3. Cloudflare Worker limits (re-verify in Cloudflare's docs)

**Findings (2026-10-28):**
- **Cron triggers on the free plan:** max 5 cron triggers per Worker
  (the existing currena-api Worker uses ONE: `"* * * * *"` — the minute
  cron). No new cron trigger is needed; the narrator runs as a new
  hour+minute-gated rung inside the existing minute cron (the same
  pattern as `insights-ingest-cron.ts`).
- **Subrequests per invocation:** **50 on the free plan** (1000 on
  paid). The existing ingest rungs use 47 (main) + 36 (daily history)
  + 26 (monthly history) — close to the limit. The narrator's per-tick
  batch MUST be ≤3 model calls per cron tick to stay safely under 50
  (the cron also runs the keep-warm + watchdog rungs in the same
  invocation). The spec's "process a capped batch per run + carry the
  pending list in KV" pattern is correct.
- **CPU time per invocation:** free plan = 10ms CPU limit per
  request, but CRON TRIGGERS on the paid plan get up to 30s (15 min
  beta). The free plan's CPU limit for cron is 30s wall-clock with
  10ms CPU — verify. The Gemini call (15s timeout, one retry) plus
  JSON parsing should fit within 30s wall-clock for ≤3 calls/tick.
- **KV operations:** free plan = 100,000 reads/day + 1,000 writes/day.
  The narrative endpoint is edge-cached (`s-maxage=600`) so visitors
  do NOT become KV reads; the only writes are the generation cycle
  (one write per cycle that changed something → ~5-10 writes/day).
  Reads: the cron rung reads the snapshot + the narrative KV (2 reads
  per tick = 2,880/day) — well under 100,000. Verify in
  https://developers.cloudflare.com/workers/platform/limits/.

**Decision the next session should log (D-30 reserved):**
- Narrator runs as a new rung in the existing minute cron (e.g.
  `:50` UTC, after the history rungs at :25 and :40). Per-tick cap:
  3 model calls. Pending units continue in the next tick via KV
  state. Free-tier KV reads: ~2,880/day from the cron; writes: ~10/day
  from the generation cycle; visitor reads: 0 (edge-cached).

---

## 4. Region risk (re-verify live)

**Findings (2026-10-28):**
- Cloudflare Worker egress is from one of Google's supported regions
  (US/EU). 403 "location not supported" is documented for some
  Cloudflare colocations (the spec mentions this).
- Mitigations:
  (a) `placement` hints in wrangler.jsonc (the `placement: { mode:
      "smart" }` option lets Cloudflare pick the colocation closest to
      the Gemini API endpoint);
  (b) Cloudflare AI Gateway (a proxy that adds region routing);
  (c) Fallback to template (always available; the spec's template
      fallback path).

**Decision the next session should log (D-31 reserved):**
- Conservative default: rely on template fallback for the first week
  of live traffic; if region errors exceed 1 in 5 A-generations,
  switch to `placement: { mode: "smart" }` and re-test. If still
  failing, ship with `NARRATOR_ENABLED=false` and document.

---

## 5. Discover-the-sections (spec §1)

The existing `InsightsSection` enum is `['global', 'australia']`
(`packages/core/src/schemas.ts`). But the spec says "discover the
sections from the code" — meaning the page's visible sections in the
broader UI sense. The conservative enumeration:

| section id | source | plain label (existing UI) |
|---|---|---|
| `global` | `packages/insights/src/definitions.ts` indicators with `section: 'global'` (the 6 groups: borrowing-costs, dollar-strength, growth-health, market-stress, prices-board, prices-heat) | "Global indicators" |
| `australia` | same, `section: 'australia'` (3 groups: au-inflation-rates, au-households, au-trade-currency) | "Australia" |
| `world-markets` | `packages/insights/src/markets/definitions.ts` (16 indices) | "World markets" |
| `world-currencies` | `packages/insights/src/fx/definitions.ts` (10 pairs + 7 patterns) | "Currencies" |
| `prices-board` | the live ticker (gold, silver, oil, btc-usd) — overlaps with `global`/`prices-board` group; decide if separate | "Live prices" |

**Decision the next session should log (D-32 reserved):**
- Section list = `['global', 'australia', 'world-markets', 'world-currencies']`
  (4 sections + 1 overall). The `prices-board` group is part of the
  `global` section (its indicators are already in `section: 'global'`).
- The Markets snapshot (`/api/insights/markets`) and the FX snapshot
  (`/api/insights/fx`) feed the new `world-markets` and
  `world-currencies` section states.

---

## 6. Reserved decision numbers

The next session will populate:

- **D-28** — the Gemini model + free-tier limits findings (§1 above)
- **D-29** — the grounding-terms decision (§2 above; ship part 3
  disabled by default until the next session has read the current
  terms in full)
- **D-30** — the Cloudflare limits findings + the cron-rung design
  (§3 above)
- **D-31** — the region-risk findings + the template-fallback
  default (§4 above)
- **D-32** — the section-list enumeration (§5 above)
- **D-33** — the secret-scan addition to `pnpm gates` (spec §10)
- **D-34** — the staged-rollout visibility flag (spec §11;
  `NARRATOR_VISIBLE=false` default; preview via `?narrative=preview`
  with the hash router)
- **D-35** — the kill criteria defaults (spec §13; per the
  KILL-CRITERIA.md doc)
- **D-36+** — per-implementation-call decisions (prompt version
  bump, validation check seed lists, etc.)

---

## 7. Milestones for the multi-session build

The spec is large (P1-level effort). Conservative split into 5
sessions, each ending with commit + push (so a stopped session
preserves its work). Each milestone is independently shippable.

### Milestone 1 — Pure foundation (no AI, no deploy)
**Scope:** §3 (additive state builders) + §8 (template fallback) +
§7 (validation, deterministic).
**Files:**
- `packages/insights/src/narrator/section-state.ts` — pure
  `buildSectionNarrationState(snapshot, sectionId, now)` + tests.
- `packages/insights/src/narrator/overall-state.ts` — pure
  `buildOverallNarrationState(snapshot, now)` + tests.
- `packages/insights/src/narrator/template.ts` — deterministic
  `templateNarrative(state, unit, lang)` + tests (must pass V1–V10).
- `packages/insights/src/narrator/validate.ts` — pure V1–V10 +
  W1–W10 + tests (with deliberately bad fixtures).
- `docs/insights/layer2/SECTION-STATE.md` — the shape, documented.
- Golden section fixtures (calm, alerted, excluded, global, australia)
  under `packages/insights/fixtures/narration/`.
- Decisions D-28..D-32 reserved in DECISIONS.md.
**Verification:** `pnpm gates` green with the Layer 1 numbers
unchanged; new tests added cleanly. No deploy (no Worker code
changed yet).
**Commit message prefix:** `insights(L2): M1 — section state + template + validation`

### Milestone 2 — Prompts + the secret-scan gate (no AI, no deploy)
**Scope:** §6 (the four prompts, versioned `PROMPT_VERSION`) + §10's
secret-scan addition to `pnpm gates`.
**Files:**
- `packages/insights/src/narrator/prompt.ts` — the four prompts
  (base + section + overall + news), `PROMPT_VERSION`, and the
  user-message builder.
- `packages/insights/src/narrator/prompt.test.ts` — snapshot tests
  pinning the prompt text (drift = test failure).
- `scripts/secret-scan.mjs` — the AIza-pattern + generic-long-secret
  scanner, integrated into `scripts/gates.mjs` as gate 0 (before
  typecheck).
- Decisions D-33 reserved.
**Verification:** `pnpm gates` green (the new secret scan is gate 0
in the gates runner).
**Commit message prefix:** `insights(L2): M2 — prompts + secret scan gate`

### Milestone 3 — The Gemini client + the key-set tool + offline eval harness (no deploy)
**Scope:** §5 (the Gemini client) + §10 (the key-set tool) + §12
(offline eval harness).
**Files:**
- `packages/insights/src/narrator/gemini-client.ts` — the Gemini
  REST client (call type A: schema-constrained JSON; call type B:
  plain-text with EN:/FA: parsing). 15s timeout, one retry on
  network/5xx, region-refusal handling.
- `packages/insights/src/narrator/gemini-client.test.ts` — mocked
  fetch tests (success, 5xx-retry, region refusal, schema-invalid).
- `scripts/narrator-set-key.mjs` — `pnpm narrator:set-key`: hidden
  input, one minimal Gemini call for validation, pipes to
  `wrangler secret put GEMINI_API_KEY` via stdin.
- `scripts/narrator-eval.mjs` — `pnpm narrator:eval`: all fixtures
  through templates + mocked model outputs (including deliberately
  bad ones). Add to `pnpm gates`.
- Decisions D-34 reserved (the staged-rollout flag).
**Verification:** `pnpm gates` green; `pnpm narrator:eval` clean.
**Commit message prefix:** `insights(L2): M3 — Gemini client + set-key + eval harness`

### Milestone 4 — The generation rung + KV storage + the cached endpoint (deploy)
**Scope:** §4 (when to run) + §9 (storage + endpoint + stats).
**Files:**
- `apps/api/src/routes/insights-narrative.ts` — the
  `/api/insights/narrative` endpoint (edge-cached
  `s-maxage=600`); reads `insights:narrative:v1` from KV; returns
  the current narrative JSON.
- `apps/api/src/narrator-cron.ts` — the new rung inside the minute
  cron (hour+minute-gated, e.g. `:50` UTC). Computes `stateHash` per
  unit; regenerates only changed units; capped at 3 model calls per
  tick; carries pending list in KV.
- `apps/api/src/narrator-stats.ts` — the daily-bucket stats writer
  (`insights:narrator:stats`).
- Wire the new rung into `apps/api/src/cron.ts` (one line in the
  minute routing).
- Add `GEMINI_API_KEY`, `NARRATOR_ENABLED`, `NARRATOR_VISIBLE`,
  `NARRATOR_WEB_CONTEXT`, `NARRATOR_WEB_DAILY_CAP`, `NARRATOR_MODEL`
  to `apps/api/wrangler.jsonc` `vars` (the KEY is NOT in vars; it's a
  secret set via `pnpm narrator:set-key`).
- Decisions D-35 reserved.
**Verification:** `pnpm gates` green; deploy with
`NARRATOR_ENABLED=false`, `NARRATOR_VISIBLE=false`; without a key,
templates only. Live-verify the endpoint returns a JSON with template
narratives.
**Commit message prefix:** `insights(L2): M4 — generation rung + KV + endpoint (deploy, disabled by default)`

### Milestone 5 — Display + the live eval harness + the kill criteria + the final report
**Scope:** §11 (display) + §12's live eval + §13 (kill criteria) +
§14 (deploy + final report).
**Files:**
- `apps/web/src/components/insights/NarrativeBlock.tsx` — the
  muted block under each section header + the overall narrative under
  the top verdict(s). Hidden-until-enabled via `NARRATOR_VISIBLE`
  (preview URL marker `?narrative=preview` with the hash router).
- `apps/web/src/components/insights/InTheNews.tsx` — the
  visually-separate "In the news" block (only when present).
- 2-3 new UI strings (Persian-safe) for the labels + disclaimers;
  triaged through the copy manifest.
- `scripts/narrator-eval-live.mjs` — `pnpm narrator:eval:live`:
  skips cleanly if no key; runs fixtures through the real model +
  writes `docs/insights/layer2/EVAL-OUTPUTS.md`.
- `docs/insights/layer2/KILL-CRITERIA.md` — the kill criteria +
  one-line switch-off instructions.
- `docs/insights/layer2/LAYER2-REPORT.md` — the final report per
  spec §14, with the exact copy-paste owner commands.
- Decisions D-36+ populated.
**Verification:** `pnpm gates` green; deploy; live-verify preview URL
shows narratives EN + FA at 360px + 1280px; normal URL shows nothing
new; no console errors.
**Commit message prefix:** `insights(L2): M5 — display + live eval + kill criteria + final report`

---

## 8. The continuation prompt for session N+1

See the next section of this file (saved as
`docs/insights/layer2/SESSION-STARTER.md` for the next session to read
on first load).
