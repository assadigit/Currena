# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 27/30 (2026-11-11) — the third reserve session (the buffer slot):
> the ecb first-check ROUND 3 + the buffer health pass — OPENED.** The owner's
> kickoff supplied NO investor §19 answers and NO §19.6 sign-off, so per the
> kickoff's own rule the slot runs the reserve branch (the retirement
> execution stays untouched, behind Gate 0). The FIRST CHECK at session open
> (~17:07 UTC) read the live status blob still the S26 evidence run
> (generatedAt 14:15:19Z — DFR ❌ 504 · AAA ✅ · HICP ❌ 504, the designed
> honest shape) with production `9861a927` @ 100 % verified — the session
> opened ~3 h BEFORE tonight's armed 20:10 sweep (the FIRST scheduled
> carrier of the new code), so neither first-check branch applies YET.
> Session shape: (M1) the first-check reading recorded; (M2) the buffer
> health pass while the sweep approaches (the full gates + the D-9 standing
> audit + the live pd-* backtests); (M3) the sweep outcome read at ~20:15
> UTC (green ecb rows → the maintenance item CLOSES; failed rows → the
> evidence round recorded, verdict PENDING on the multi-day criterion; no
> blob update → the ~19:00 KV cap ate the writes, harmless by design, the
> verdict rides tomorrow's 04:10–04:40 rungs); (M4) the records + the close.

## Current state (after the S26 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (blocked on the investor) · S24 DELIVERED (the D-9
  condition MET + the retirement checklist landed) · the S25 roadmap
  item delivered early (the Session 23 slot) · the Session 25 SLOT ran
  the first reserve session (the ecb maintenance, BD-S25) · **the
  Session 26 SLOT ran the second reserve session (the ecb first-check
  follow-through, BD-S26) — DELIVERED**. Remaining: S23's
  feedback-build scope (blocked on the investor) + the reserve S27–S30
  (the retirement execution behind the §19.6 sign-off, the ecb
  escalation decision if the rung evidence demands it, buffers).
  **Counter: Session 26/30 · 4 remaining.**
- **DEPLOYED LIVE:** currena-api **`9861a927`** (UNCHANGED this session
  — the S25 fix; production ≡ HEAD `ab1f316` modulo the records commits
  that carry no code change; verified @ 100 % via the deployments API)
  + currena-markets `8f63c8fa` (UNTOUCHED).
- **The ecb posture (BD-S25 + BD-S26, the live evidence):** the four
  portal legs ride `ECB_PORTAL_TIMEOUT_MS = 45_000` (F-11 single
  attempt kept) + the HICP request is the stable full-history URL. The
  provider-side roulette (the gateway's ~30.2 s HTTP 504, per-request)
  is ACTIVE, now measured at ALL THREE observed venues (Worker egress ·
  the GitHub runner · the work sandbox). The post-fix evidence run
  (14:15 UTC): DFR ❌ 504 · AAA ✅ (fresh) · HICP ❌ 504 — the honest
  designed failure shape; the two voting cards held on publisher-true
  values (verified EXACTLY); the status carries two `kind: failed` rows
  → tonight's 20:10 sweep is ARMED. A `failed` row naming a timeout OR
  an HTTP 504 on ANY ecb leg is an expected honest shape on bad days;
  the sweeps + the rungs + the belt-and-braces are the healing paths.
- **Gates (the records-only tree): ALL GREEN** — re-run this session
  (the full `pnpm gates` + the D-9 standing audit re-run MET,
  belt-and-braces: nothing touched indicators/definitions/placement/§A).
- **The S26 surfaces (what changed where):** the evidence run (GHA
  dispatch 43036550865 + its status blob + the public /status now
  serving the honest two-row failure shape) · the records (BD-S26 in
  DECISIONS · RISK_REGISTER row extension + change-log row · the
  roadmap's Session 26 SLOT record + progress board + current position
  · the page-division README · the CHANGELOG S26 entry · this file).
  One S25 record correction: the 11:57 run was the daily SCHEDULE
  delayed ~7.6 h by GitHub's scheduler queue (NOT a workflow_dispatch
  as BD-S25's addendum said) — the week's scheduled runs all landed
  11:22–13:00 UTC.

## Next session (Session 27/30)

**FIRST CHECK — the ecb rung evidence, round 2 (the BD-S26 revisit):**
read `GET https://currena.ir/api/insights/status` (or the KV
`insights:status` blob via the Cloudflare API). By then the new code
will have been carried by: tonight's 20:10 UTC sweep (armed — but mind
the KV write cap ~19:00 UTC: if the cap ate its writes, the blob keeps
the 14:15 stamp, harmless by design), tomorrow's 04:10–04:40 Worker
rungs, and the ~12:00 belt-and-braces (the delayed schedule). Decide:
- **Green rows / a clean rung under the new code** (the sweep or rung
  fetched the ecb legs clean): the maintenance item is CLOSED — record
  the verdict in DECISIONS.md (BD-S26's revisit) and move to the
  standing branch.
- **Honest failed rows persisting across multiple days of the NEW code**
  (the cards going user-visibly stale past their maxAge windows, not
  just failed rows on held-true values): the provider-side condition is
  confirmed persistent — present the escalation choice to the owner
  (wait it out vs the Eurostat-origin dissemination-API fallback
  session), per the options recorded in BD-S25/BD-S26 + RISK_REGISTER.

Then the standing branch — decided by the owner's kickoff prompt:
- **If the owner supplies the investor's §19 answers:** run the investor
  round (collect → D-49+ in the strategy log §5 Round 4 → the spec v2
  entries — the AF-1…AF-8 findings ride that pass, never silent edits);
  S23's deferred feedback-build scope follows it. **The §19.6 answer
  also opens (or delays) the retirement execution** — record it as
  Gate 0 in DECISIONS.md and schedule the execution session per the
  checklist's §7.
- **If not:** the roadmap's reserve slots (S27–S30) hold the retirement
  execution (ONLY behind the recorded §19.6 sign-off), the ecb
  escalation decision if the rung evidence demands it, and the buffers
  — pick per the owner's kickoff prompt (one session per slot, the
  parallel-session rule).

### Operational notes worth carrying

- **The KV write cap:** the account's free-tier daily KV quota exhausts
  ~19:00 UTC (HTTP 429 10048 on the REST path) — any manual KV seeding
  (rung2-run / fx-run / markets-au-run / a GHA ingest dispatch) after
  ~19:00 UTC waits for the 00:00 UTC reset; the 04:10/04:20 UTC rungs
  always land in the fresh window. At the 14:15 evidence run the budget
  read 16 writes, 0 cap-retries.
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  all week (the runs land 11:22–13:00 UTC) — still inside the fresh KV
  slice; the Worker's own 04:10–04:40 rungs run on time and remain the
  primary venue. A `workflow_dispatch` (as used by S26) runs immediately.
- **The ECB portal posture:** see "Current state" above — a failed row
  (timeout OR 504) on any ecb leg is an expected honest shape; the
  cards hold last-good meanwhile (the held values verified against the
  publisher's own API exactly: DFR 2.5 @ 2026-11-11 · HICP 4.0 @
  2026-10 · AAA 3.3308865271 @ 2026-11-10).
- **The fresh-card bootstrap is FIXED** (`patchInsightsSnapshot` ADDS
  readings for ids the stored snapshot lacks — the regression test pins
  it); the three Asia CPI fills' normal cadence takes over at the next
  first-of-month rung2 gate (Dec 1 UTC).
- **The D-9 audit is a standing gate:** `pnpm s24:d9-audit` (18 checks
  incl. the §A ↔ registry pin) — re-run it in any session that touches
  indicators, definitions, placement or §A; it exits non-zero on drift.
- **The PortWatch runbook note (BD-S21e):** never run the §21 data
  audit's portwatch leg Tuesdays 11:00–14:00 UTC (the IMF's scheduled
  maintenance window).

## Owner-side levers waiting

1. **Arrange the external investor's review of the spec (§19 — the
   seven questions): Phase K's remaining input and THE top lever.** The
   investor round re-opens at the next free slot the moment the answers
   exist (→ D-49+ in the strategy log §5 Round 4 → the spec v2 entries,
   with AF-1…AF-8 riding that pass); S23's deferred feedback-build
   scope follows it.
2. **The §19.6 retirement timing answer** (directly, or via the
   investor round): retire the legacy /insights now that the D-9 audit
   is green, or after a burn-in period of parallel running? Gate 0 of
   `06-LEGACY-RETIREMENT-S24.md` §7 — the execution session runs only
   behind the recorded sign-off. The A/B redirect decision (the
   card-aware option B recommended) and the details-panel port
   recommendation ride the same gate.
3. **The ecb escalation choice (standing, only if the rung evidence
   demands it):** if the post-fix days keep failing (the cards going
   user-visibly stale, not just honest failed rows on held-true
   values), decide between (a) waiting out the provider-side roulette
   (the sweeps keep healing on good windows — the 11:57 and 14:15 runs
   each fetched at least one leg green) and (b) the Eurostat-origin
   dissemination-API fallback session. The evidence + the options are
   recorded in BD-S25/BD-S26 + RISK_REGISTER.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
6. Ratify or redirect the BD-S3…BD-S26 decision set (the latest:
   **BD-S26** — the first-check follow-through: the post-fix evidence
   run + the three-venue roulette + the PENDING verdict riding the
   schedule; all recorded, none blocking).
7. Triage the queued unreviewed fa strings (every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) stops at S11 — the later sessions' records live
  in the roadmap delivery records + this file. A back-fill is a
  nice-to-have, never blocking.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · pd-s14 (Asia 14) ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`).
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above).
- **The parallel-session rule (hardened through BD-S18-parallel-3,
  BD-S21-parallel, BD-S23-parallel):** launch exactly ONE session
  per roadmap slot — one prompt = one session = one slot. If a kickoff
  arrives for a slot already delivered (origin/main carries its
  records), run the counterpart close, never a re-execution; if a
  duplicate is already PUSHED, reconcile onto it (the pushed
  implementation governs), archive the local duplicate, independently
  re-verify, and finish the slot's remaining milestones.
