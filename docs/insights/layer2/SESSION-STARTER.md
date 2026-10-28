# Layer 2 Narrator — Continuation Prompt for Session N+1

**Read this first.** This is the prompt to paste into the next
autonomous session. It is self-contained — the next session does not
need any context from the previous chat.

---

## The prompt (copy everything below this line into the next session)

````
You are working in the repo assadigit/Currena (Cloudflare Workers; the
Insights page at currena.ir/#/insights).

Layer 1 (plain-language copy) and Layer 2 prep are complete and live.
The Layer 2 NARRATOR spec is at docs/insights/layer2/
INSIGHTS-L2-NARRATOR-SPEC.md — read it completely. The research starter
at docs/insights/layer2/RESEARCH-STARTER.md has the four research
findings (Gemini model + free-tier limits, grounding terms, Cloudflare
Worker limits, region risk) — RE-VERIFY each in the official docs
before recording the decisions. The decision log is at
docs/insights/layer2/DECISIONS.md (continues from D-20…D-27, the L2
prep decisions; reserve D-28..D-36+ per the research starter).

Goal: build the AI narrator exactly as specified — a plain-language
narrative for EVERY Insights section plus an overall summary
(Farsi + English), the four prompts, the deterministic validation
checks, the template fallback, the optional web-grounded "In the news"
notes (behind the Google terms check), KV storage, the cached endpoint,
the minimal display, the hidden-until-enabled rollout, the kill
switches, stats, the key-setting tool, and the offline evaluation
harness.

Milestone plan (from RESEARCH-STARTER.md §7):

  M1 — Pure foundation: buildSectionNarrationState +
       buildOverallNarrationState + templateNarrative + the V1–V10 +
       W1–W10 validators + golden section fixtures + SECTION-STATE.md.
       Decisions D-28..D-32. No AI, no deploy. Commit + push.

  M2 — Prompts + secret-scan gate: the four prompts (base, section,
       overall, news) in packages/insights/src/narrator/prompt.ts with
       PROMPT_VERSION + snapshot tests. scripts/secret-scan.mjs
       integrated into scripts/gates.mjs as gate 0. Decision D-33.
       No AI, no deploy. Commit + push.

  M3 — Gemini client + set-key tool + offline eval: the Gemini REST
       client (call type A schema-constrained JSON; call type B
       plain-text EN:/FA: parsing; 15s timeout; one retry;
       region-refusal handling). scripts/narrator-set-key.mjs
       (pnpm narrator:set-key) with hidden input, one minimal Gemini
       call for validation, pipes to wrangler secret put GEMINI_API_KEY
       via stdin. scripts/narrator-eval.mjs (pnpm narrator:eval)
       added to pnpm gates. Decision D-34. No deploy. Commit + push.

  M4 — Generation rung + KV storage + the cached endpoint (deploy,
       disabled by default): apps/api/src/routes/insights-narrative.ts
       (edge-cached s-maxage=600). apps/api/src/narrator-cron.ts (a
       new rung in the existing minute cron, hour+minute-gated; stateHash
       per unit; capped 3 model calls per tick; pending list in KV).
       apps/api/src/narrator-stats.ts (daily-bucket stats). Wire the
       new rung into apps/api/src/cron.ts. Add GEMINI_API_KEY +
       NARRATOR_ENABLED + NARRATOR_VISIBLE + NARRATOR_WEB_CONTEXT +
       NARRATOR_WEB_DAILY_CAP + NARRATOR_MODEL to
       apps/api/wrangler.jsonc vars (GEMINI_API_KEY is a SECRET, not
       a var). Decision D-35. Deploy with NARRATOR_ENABLED=false +
       NARRATOR_VISIBLE=false; without a key, templates only.
       Live-verify the endpoint. Commit + push.

  M5 — Display + live eval + kill criteria + final report:
       apps/web/src/components/insights/NarrativeBlock.tsx (the muted
       block under each section header + the overall narrative under
       the top verdict(s); hidden-until-enabled via NARRATOR_VISIBLE
       with preview URL marker ?narrative=preview on the hash router).
       apps/web/src/components/insights/InTheNews.tsx (the visually
       separate "In the news" block; only when present). 2-3 new UI
       strings (Persian-safe, triaged through copy:audit).
       scripts/narrator-eval-live.mjs (pnpm narrator:eval:live; skips
       cleanly if no key). docs/insights/layer2/KILL-CRITERIA.md.
       docs/insights/layer2/LAYER2-REPORT.md (the final report per
       spec §14, with the exact copy-paste owner commands).
       Decisions D-36+. Deploy + live-verify. Commit + push.

Rules (from the spec, unchanged):

- Do NOT ask me any questions. Ambiguity → read the code/docs, choose
  the most conservative option, log it in docs/insights/layer2/
  DECISIONS.md (continue after D-27). The research starter has the
  decision numbers reserved (D-28..D-36+).

- SECRETS — CRITICAL: the Gemini API key is a Worker secret only.
  Never accept it in chat. Never pass it as a command-line argument.
  Never print, log or store it. Build pnpm narrator:set-key (M3) so
  the owner enters it themselves in their own terminal with hidden
  input. The code MUST run safely WITHOUT a key (templates only, no
  errors). If a Gemini-looking key was pasted anywhere in the
  conversation history, IGNORE it. The owner will create a fresh
  AI Studio key (starts with AIza) and enter it themselves via
  pnpm narrator:set-key. If any key was pasted publicly, the owner
  must rotate it immediately — note this in docs/DEPLOY.md.

- Do not change verdict math, thresholds, alert behaviour or Layer 1
  copy. You MAY add new pure derived inputs for the narrator (e.g.
  per-section state) without displaying new verdict labels.

- All earlier gates must stay green with the same numbers (pnpm gates,
  plus the new secret scan added in M2). Layer 1 validator 7809/7809.
  Web bundle budgets hold (entry 296.00/89.50, Insights lazy
  1100.00/260.00); D-16 path only if truly unavoidable. Every new KV
  read/write and every new external call must be reported with daily
  totals.

- Look up the CURRENT Gemini model, free-tier limits, Google Search
  grounding terms and Cloudflare Worker limits in the official
  documentation and record findings + decisions in the decisions log.
  The research starter has the 2026-10-28 findings — RE-VERIFY each in
  the official docs before recording the decisions (the next session
  must not blindly trust the prior research).

- The spec is at docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md
  (moved into the docs folder per the task instructions). The research
  starter is at docs/insights/layer2/RESEARCH-STARTER.md. The decision
  log is at docs/insights/layer2/DECISIONS.md (D-20..D-27 are the L2
  prep decisions; reserve D-28..D-36+ per the research starter).

- Follow the deploy-lock protocol from docs/DEPLOY.md. Check
  Cloudflare versions/deployments APIs first; never deploy while a
  parallel session may have deployed. Never deploy while any gate
  fails. Verify live after deploying (EN + FA, 360px and 1280px).

- Commit + push incrementally per milestone (so a stopped session
  preserves its work). Each milestone is independently shippable.

- Finish by writing docs/insights/layer2/LAYER2-REPORT.md as the spec
  describes (§14): what shipped per section of the spec, files, gate
  results, free-tier numbers, Cloudflare limits found + how the design
  stays within them, the Gemini model/limits/grounding findings, the
  grounding-terms decision, region-risk findings, decisions D-28…, and
  the exact owner steps still required as copy-paste commands
  (pnpm narrator:set-key, the preview URL, the visibility flip).

Credentials (in the env, do not echo):

  GitHub:    https://github.com/assadigit/Currena
             (token in the env — gh auth or HTTPS clone with the token)

  Cloudflare Workers API token: in the env
  Cloudflare Account ID:        in the env
  EODHD (stocks API) key:       in the env (not used in L2 narrator)

  Gemini API key: NOT IN THE ENV. The owner will enter it themselves
                  via pnpm narrator:set-key (M3) in their own terminal.

Start with M1. Read the spec + the research starter + the existing
narrator module (packages/insights/src/narrator/) + the L2 prep
decisions (D-20..D-27) first. Then ship M1 end to end. Commit + push.
Then move to M2.

The five-milestone split means a stopped session never loses more than
one milestone of work. Each milestone's commit is a clean, shippable
state.
````

---

## Notes for the owner (read this before starting the next session)

1. **The Gemini key.** You pasted a string starting with `AQ.Ab8…` in
   the credentials. That is NOT a standard Google AI Studio API key
   (those start with `AIza…` and are 39 chars after the prefix). The
   `AQ.Ab8…` form looks like a Google OAuth refresh token or an
   Auth/Exchange token — it will NOT work as `GEMINI_API_KEY` for the
   `generativelanguage.googleapis.com` REST endpoint. **Rotate it
   immediately** if it was pasted anywhere public. To get a real
   Gemini free-tier key:
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with a Google account
   - Make sure the Cloud project has NO billing enabled (so the free
     tier can never charge — the spec §10 requirement)
   - Click "Create API key" → copy the `AIza…` string
   - Run `pnpm narrator:set-key` (built in M3) in your own terminal
     and paste the key when prompted (hidden input — no echo, no log,
     no repo storage)

2. **The spec is saved.** It is at
   `docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md` (166 lines).
   The research starter is at `docs/insights/layer2/RESEARCH-STARTER.md`.
   Both are committed to the repo as ground truth for future
   verification.

3. **The five-milestone split.** Each milestone is independently
   shippable — a stopped session never loses more than one milestone
   of work. The full build is ~5 sessions of work; M1 (the pure
   foundation) is the smallest and the safest to start with.

4. **The first deploy happens in M4.** M1–M3 ship code without
   touching the Worker's runtime behaviour (no new KV ops, no new
   fetches from the Worker). M4 is the first deploy. M5 is the
   final deploy with the display.

5. **The hidden-until-enabled rollout.** The default is
   `NARRATOR_VISIBLE=false` — narratives are generated and stored but
   shown only at `?narrative=preview`. You read real text on the real
   page for about a week, then flip visibility (one `wrangler secret`
   or `wrangler vars` update). The spec §11 + §13 detail the kill
   criteria (one-line switch-off instructions in
   `docs/insights/layer2/KILL-CRITERIA.md`).
