# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 29/30 (2026-11-11 → 2026-11-12) — the fifth reserve session
> (the buffer slot): the first-check green-rows CONFIRMATION (the
> BD-S28 residual) + the EIA-trio wire-honesty heal + the buffer health
> pass — CLOSED (BD-S29). THE OBSERVABLE STATE HAS CAUGHT UP WITH THE
> CLOSED VERDICT.** The owner's kickoff supplied NO investor §19 answers
> and NO §19.6 sign-off, so per the kickoff's own rule the slot ran the
> reserve branch (the retirement execution untouched behind Gate 0). The
> session opened 23:42 UTC on 2026-11-11 — ~1 h after the S28 close and
> ~4.5 h BEFORE the round-5 evidence window (the 2026-11-12 04:10–04:40
> rungs), the early read finding the blob still the S26 evidence run
> (14:15:19Z). Rather than wait, the session landed the green rows
> EARLY via the sanctioned dispatch in the fresh post-midnight KV slice
> (GHA insights-ingest run 92, 00:01:44Z — success in 2m36s, all writes
> landed): **failedSources EMPTY, all three ecb rows GREEN in the served
> blob for the first time** (DFR · AAA · HICP; the values exactly the
> publisher-true trio) — the one-line confirmation, no new decision
> needed. The fresh rung surfaced a NEW finding — the EIA weekly trio
> past the 12-day wire-guard grace at the day boundary (T-04 red, age
> 13) — Rule-5-verified as the provider's own release delay (the 11/11
> release slipped to 11/12 per its own LeafHandler footer; the served
> values EXACT) and healed on the wire via the DESIGNED `rung2-run --eia`
> landing lever (the honest [stale] re-marking, ~10 KV writes; the trio
> self-heals at the Saturday 11-14 gate). The buffer health pass ALL
> GREEN (the gates 9/9 · the suite 15,270 · the D-9 audit exit 0 · the
> 11 backtests 705 checks/0 red · the S20 audit 20/20). NO deploy (zero
> code changed; both workers verified unchanged).

> **SESSION 28/30 (2026-11-11) — the fourth reserve session (the buffer
> slot): the ecb first-check ROUND 4 + the buffer health pass — CLOSED
> (BD-S28). THE BD-S25 PROVIDER-TIMEOUT MAINTENANCE ITEM IS CLOSED.**
> The owner's kickoff supplied NO investor §19 answers and NO §19.6
> sign-off, so per the kickoff's own rule the slot ran the reserve
> branch (the retirement execution untouched behind Gate 0). The session
> opened 22:01 UTC — ~1.5 h after the S27 counterpart close and ~6 h
> BEFORE the round-4 evidence window (the 2026-11-12 04:10–04:40
> rungs), the early read finding the blob still the S26 evidence run.
> NEW evidence at open (the :13 prices write landed at 21:13 — the write
> budget alive an hour past the S27 close) prompted the session to
> dispatch the sanctioned belt-and-braces rung (GHA insights-ingest run
> 91, 22:07:46Z): **the collect ran the NEW CODE CLEAN — all three ecb
> legs green in one rung for the first time** (DFR · AAA · HICP; zero
> failed source rows; T-01…T-14 green; the readings exactly the served
> publisher-true values — the third same-day independent verification),
> **while its writes were all refused by the daily KV cap** (the direct
> 429-10048 + retry-ladder evidence; the 15-minute job timeout
> cancelled the run mid-chain at 22:23:02, nothing partial — S27's
> indistinguishability RESOLVED). The observable green rows rode the
> 04:10–04:40 fresh-window rungs — CONFIRMED by the Session 29 slot
> (landed early via its own fresh-slice dispatch).

## Current state (after the S29 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (blocked on the investor) · S24 DELIVERED (the D-9
  condition MET + the retirement checklist landed) · the S25 roadmap
  item delivered early (the Session 23 slot) · the Session 25–29 SLOTS
  ran the five reserve sessions (BD-S25 the ecb maintenance, deployed
  `9861a927` · BD-S26/BD-S27/BD-S28 the first-check rounds 1–4 — the
  maintenance item CLOSED · **BD-S29 the green-rows confirmation + the
  EIA-trio heal — DELIVERED**). Remaining: S23's feedback-build scope
  (blocked on the investor) + the final reserve slot S30 (the
  retirement execution behind the §19.6 sign-off, buffers).
  **Counter: Session 29/30 · 1 remaining.**
- **DEPLOYED LIVE:** currena-api **`9861a927`** (UNCHANGED this session
  — the S25 fix; verified via the Cloudflare API: the newest of 362
  versions, created 12:21:25Z, nothing newer) + currena-markets
  **`8f63c8fa`** (UNTOUCHED, newest version). Production ≡ HEAD modulo
  the records commits (zero code changed since the S25 deploy).
- **The ecb posture (BD-S29 — the observable state has caught up):**
  the served blob (generatedAt 2026-11-12T00:02:45.793Z, run 92) shows
  **failedSources EMPTY — all three ecb rows green** for the first time
  (DFR `FM/D.U2.EUR.4F.KR.DFR.LEV` · AAA
  `YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` · HICP
  `M.U2.N.000000.4D0.ANR`), the readings exactly the publisher-true
  values (ecb-dfr 2.5 @ 2026-11-11 normal · euro-aaa-10y
  3.3308865271 @ 2026-11-10 · euro-hicp 4.0 @ 2026-10-01). The BD-S25
  maintenance item stays CLOSED; the per-request ECB roulette remains
  REAL (a failed row — timeout OR 504 — on any rung is the documented
  RISK_REGISTER honest shape: the cards hold last-good, the next rung
  retries). Only the persistent multi-day stale-past-maxAge shape
  (DFR/AAA past ~2026-11-17/18 · HICP past ~2026-11-30, never
  refreshed) would re-open the escalation question.
- **The EIA trio posture (BD-S29's NEW finding — healed, self-healing
  at the Saturday gate):** the provider's own release delay (the 11/11
  weekly release slipped to 11/12 per its own LeafHandler footer) left
  `eia-crude-stocks` · `us-spr` · `us-crude-production` at asOf
  2026-10-30 — the age crossed the 12-day wire grace at the 2026-11-12
  day boundary (T-04 red on the run-92 blob; the values verified EXACT
  against the provider's page: 691,944 · 282,184 · 14,003). The
  designed `rung2-run --eia` landing lever re-scored the trio to the
  honest **[stale]** status at 00:12:25 UTC (values unchanged); the
  pd-s17 freshness arm passes (beyond-grace + honestly stale); the
  status summary's T-04 row re-validates green at the next full collect
  (the 04:10 rung — the rung-2 phase appends rows, it does not re-run
  the suite). The 11/12 release (~15:30 UTC) covers the week ending
  11/06; the Saturday 11-14 rung-2 gate lands it → the trio returns to
  fresh/context at age ~8. Only a multi-week stall (still stale past
  ~2026-11-28 with the Saturday gates failing) raises a new provider
  question. The RISK_REGISTER eia row carries the posture note.
- **Gates (the records-only tree): ALL GREEN** — the full `pnpm gates`
  9/9 in 2m35s (the suite **15,270** = the S26/S27/S28 close count
  exactly) + the D-9 standing audit exit 0 (the condition MET,
  belt-and-braces) + the 11 live pd-* backtests ALL ELEVEN ALL CHECKS
  GREEN against production (705 checks/0 red) + the S20 data audit
  20/20 GREEN (seed 20261112 — both EIA sample members EXACT).
- **The S29 surfaces (what changed where):** BD-S29 (DECISIONS) · the
  RISK_REGISTER eia-row schedule note · the CHANGELOG S29 entry · the
  roadmap's Session 29 SLOT record + progress board + current position
  (Session 29/30 · 1 remaining) · the page-division README program
  state · the strategy-log §8 row 33 · this file. Zero code, zero
  deploy. The session's live actions: the run-92 GHA dispatch (the
  fresh-slice ingest — the blob + histories refreshed), the
  `rung2-run --eia` patch (the honest stale-marking), and one KV
  scope-test write/delete pair — all inside the 2026-11-12 quota day.

## Next session (Session 30/30 — the FINAL slot)

The standing branch — decided by the owner's kickoff prompt:
- **If the owner supplies the investor's §19 answers:** run the
  INVESTOR ROUND (collect → D-49+ in the strategy log §5 Round 4 → the
  spec v2 entries — the AF-1…AF-8 findings ride that pass, never silent
  edits); S23's deferred feedback-build scope follows it. **The §19.6
  answer also opens (or delays) the retirement execution** — record it
  as Gate 0 in DECISIONS.md and schedule the execution per the
  checklist's §7 (this final slot or a later one).
- **If the owner supplies the §19.6 sign-off (directly):** the
  retirement execution may run in the final slot per
  `06-LEGACY-RETIREMENT-S24.md` §7 (the checklist) — ONLY behind the
  recorded sign-off.
- **If neither:** the final buffer slot — the buffer health pass + the
  program close-out records (the counter reaches 30/30; the project
  finishes, the remaining levers stay with the owner).

Two OPTIONAL observation reads (no decisions pending on either — record
only if convenient):
- The 04:10 UTC rung re-validates T-04 against the patched snapshot
  (expected green — the trio now stale-marked).
- The Saturday 11-14 rung-2 gate lands the 11/12 EIA release (expected:
  the trio returns to fresh/context at age ~8).

### Operational notes worth carrying

- **The KV write cap (the fresh post-midnight slice, now CONFIRMED):**
  the account's free-tier daily KV quota is 1,000 writes/day
  account-wide; the REST path exhausts ~18:30–19:00 UTC. The Session 29
  dispatch at 00:01:44 UTC (run 92) landed ALL its writes cleanly in
  the brand-new quota day (2m36s, no retry ladder) — the fresh
  post-midnight slice is the right window for MANUAL KV seeding (a GHA
  ingest dispatch, rung2-run, fx-run, markets-au-run) when something
  must land outside the 04:10–04:40 rungs; a post-~18:30 dispatch just
  costs one refused run (the designed no-update branch).
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  all week (the runs land 11:22–13:00 UTC) — still inside the fresh KV
  slice; the Worker's own 04:10–04:40 rungs run on time and remain the
  primary venue. A `workflow_dispatch` runs immediately.
- **The ECB portal posture (post-CLOSE):** the provider-side roulette
  (the gateway's ~30.2 s HTTP 504, per-request) remains REAL — a failed
  row (timeout OR 504) on any ecb leg is an expected honest shape on
  bad windows; the 45 s patient single attempt absorbs the slow-200s
  and the cards hold last-good meanwhile. The maintenance item is
  closed because the code demonstrably fetches clean on good windows
  (runs 91 AND 92 both fetched all three legs green) — the per-request
  condition is the provider's, documented in RISK_REGISTER.
- **The EIA weekly-release schedule note (BD-S29):** the EIA's weekly
  petroleum releases can slip a day (11/11 → 11/12 observed); the
  trio's 12-day wire grace has ~1 day of slack over the Saturday-gate
  cadence, so a slipped release surfaces as an honest T-04 red at the
  day boundary. The designed heal path: the `rung2-run --eia` lever
  re-marks staleness; the next Saturday gate lands the slipped release.
  The user view stays honest throughout (the asOf dates + the
  client-side freshness safety net).
- **The observability telemetry query API** (the Workers logs): answers
  success but projects ZERO rows for the query shapes tried in S27
  (both supplied tokens; the `deployments/by_script` endpoint also
  401s on the first token's scope — use the `scripts`/`versions`/
  `environments` endpoints for deploy posture instead). Do not plan on
  Worker-log reads; the KV blob + the GHA history are the evidence
  surface.
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
3. Ratify the `/converter` relocation (S1's build-session decision).
4. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
5. Ratify or redirect the BD-S3…BD-S29 decision set (the latest:
   **BD-S29** — the green-rows confirmation landed early via the
   fresh-slice dispatch, the EIA-trio release-delay finding + the
   designed-lever heal, the buffer health pass ALL GREEN; all recorded,
   none blocking).
6. Triage the queued unreviewed fa strings (every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) is COMPLETE through the Session 29 SLOT (row 33,
  added by the S29 close).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57 — the count scales with
  the served board's present readings) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8) ·
  pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities 24) ·
  pd-s18 (Currencies 53 incl. the rules + board gates) — all
  re-runnable against production from apps/web/scripts/ (pass
  `--base https://currena.ir`; the pd-s4 stateHash arm needs
  CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in env). S29 re-ran all
  eleven ALL GREEN (2026-11-12 00:13–00:14 UTC, 705 checks/0 red).
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above).
- **The parallel-session rule (hardened through BD-S18-parallel-3,
  BD-S21-parallel, BD-S23-parallel, and the S27 interruption):**
  launch exactly ONE session per roadmap slot — one prompt = one
  session = one slot. If a kickoff arrives for a slot already delivered
  (origin/main carries its records), run the counterpart close, never a
  re-execution; if a duplicate is already PUSHED, reconcile onto it (the
  pushed implementation governs), archive the local duplicate,
  independently re-verify, and finish the slot's remaining milestones.
  The S27 shape (an interrupted session continued to completion, its
  earlier commits kept, nothing duplicated) is the worked precedent.
