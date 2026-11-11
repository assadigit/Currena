# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 29/30 (2026-11-11, opening ~23:42 UTC) — the fifth reserve
> session (the buffer slot): the first-check green-rows CONFIRMATION (the
> BD-S28 residual) + the buffer health pass — IN PROGRESS.** The owner's
> kickoff supplied NO investor §19 answers and NO §19.6 sign-off, so per
> the kickoff's own rule the slot runs the reserve branch (the retirement
> execution untouched behind Gate 0). The session opened ~1 h after the
> S28 close and ~4.5 h BEFORE the round-5 evidence window (the
> 2026-11-12 04:10–04:40 rungs) — the kickoff's premise ("the rungs
> should have landed the green rows by now") is not yet true at open (the
> S28-shape early read): the live blob still carries the S26 evidence run
> (generatedAt 14:15:19.239Z — DFR ❌ 504 · AAA ✅ · HICP ❌ 504, the two
> honest ecb failed rows, 50/52 green, T-01…T-14 green), production
> verified unchanged (currena-api `9861a927` the newest of 362 versions ·
> currena-markets `8f63c8fa` the newest), and no insights-ingest run
> since run 91 (the GHA history confirms). The plan: land the green rows
> EARLY via the sanctioned belt-and-braces dispatch (the BD-S26/S28
> precedent; the workflow's own header documents the fresh post-midnight
> KV slice — 1,000 writes/day account-wide, ~750 of headroom at 04:20),
> read the confirmation, then the buffer health pass (the gates + the
> D-9 audit + the 11 live backtests + the S20 data audit), then the
> records + the close. The retirement execution stays untouched (behind
> the recorded §19.6 sign-off).

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
> indistinguishability RESOLVED). The observable green rows ride the
> fresh-window rungs; the buffer health pass ALL GREEN (the gates 9/9 ·
> the suite 15,270 · the D-9 audit 18/18 · the 11 backtests · the S20
> audit 20/20). NO deploy (zero code changed; both workers verified
> unchanged).

> **SESSION 27/30 (2026-11-11) — the third reserve session (the buffer
> slot): the ecb first-check ROUND 3 + the buffer health pass — CLOSED
> (BD-S27).** The owner's kickoff supplied NO investor §19 answers and
> NO §19.6 sign-off, so per the kickoff's own rule the slot ran the
> reserve branch (the retirement execution untouched behind Gate 0).
> The slot ran as ONE session across an interruption: an earlier
> instance opened it (M0, ~17:07 UTC — the parallel-session rule
> verified; the first check read the blob still the S26 evidence run
> with the 20:10 sweep ~3 h out) and landed M2a (the strategy-log §8
> back-fill); this continuation re-verified everything, ran the buffer
> health pass, watched the sweep, and closed the slot. THE SWEEP READ
> (20:16–20:17 UTC): the blob UNCHANGED (generatedAt 14:15:19Z — the
> designed no-update branch: the post-~19:00 KV write-cap window
> refused the 20:10 sweep's writes, or the sweep did not fire —
> indistinguishable on the available surface; the designed fallback is
> identical: tomorrow's 04:10–04:40 Worker rungs own the heal in the
> fresh KV window). THE VERDICT: PENDING (round 3) — no CLOSE, no
> ESCALATION (one post-fix day; no card past its maxAge window). NO
> deploy (zero code changed; both workers verified unchanged). The
> buffer health pass ALL GREEN (the gates 9/9 · the suite 15,270 · the
> D-9 audit 18/18 · the 11 live backtests ALL CHECKS GREEN).

## Current state (after the S28 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (blocked on the investor) · S24 DELIVERED (the D-9
  condition MET + the retirement checklist landed) · the S25 roadmap
  item delivered early (the Session 23 slot) · the Session 25 SLOT ran
  the first reserve session (the ecb maintenance, BD-S25) · the
  Session 26 SLOT ran the second reserve session (the ecb first-check
  follow-through, BD-S26) · the Session 27 SLOT ran the third reserve
  session (the ecb first-check round 3 + the buffer health pass,
  BD-S27, + the BD-S27-parallel counterpart close) · **the Session 28
  SLOT ran the fourth reserve session (the ecb first-check round 4 +
  the buffer health pass, BD-S28) — DELIVERED, and the BD-S25
  maintenance item is CLOSED**. Remaining: S23's feedback-build scope
  (blocked on the investor) + the reserve S29–S30 (the retirement
  execution behind the §19.6 sign-off, buffers). **Counter: Session
  28/30 · 2 remaining.**
- **DEPLOYED LIVE:** currena-api **`9861a927`** (UNCHANGED this session
  — the S25 fix; verified via the Cloudflare API: the newest of 362
  versions, created 12:21:25Z, nothing newer) + currena-markets
  **`8f63c8fa`** (UNTOUCHED, newest version). Production ≡ HEAD modulo
  the records commits (zero code changed since the S25 deploy).
- **The ecb posture (BD-S28, the live evidence): THE MAINTENANCE ITEM
  IS CLOSED.** The four portal legs ride
  `ECB_PORTAL_TIMEOUT_MS = 45_000` (F-11 single attempt) + the HICP
  request is the stable full-history URL — and a real rung (the GHA
  belt-and-braces run 91, 22:07:46 UTC on main ≡ production) fetched
  ALL THREE ecb legs clean in one run: DFR `FM/D.U2.EUR.4F.KR.DFR.LEV`
  · AAA `YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` · HICP
  `M.U2.N.000000.4D0.ANR` (full history) — zero failed source rows,
  collect 46.43 s, T-01…T-14 green, the readings exactly the served
  values (ecb-dfr 2.5 @ 2026-11-11 · euro-aaa-10y 3.3308865271 @
  2026-11-10 · euro-hicp 4.0 @ 2026-10-01 — the third same-day
  independent verification after S26's 14:20 GHA leg and S27-parallel's
  17:29 sandbox fetch). The run's KV writes were ALL refused by the
  daily cap (the direct 429-10048 + the store's retry ladder; the
  15-minute job timeout cancelled the run mid-chain at 22:23:02) — the
  designed no-update branch, so the OBSERVABLE state is still the S26
  evidence run (generatedAt 14:15:19Z: DFR ❌ 504 · AAA ✅ · HICP ❌
  504) until the **2026-11-12 04:10–04:40 fresh-window rungs land the
  green rows (~750 writes of headroom)**. No card is past its maxAge
  window (DFR asOf the provider's current value · AAA 1 day · HICP day
  41 of 60). The escalation choice has RETIRED from the active levers
  — the RISK_REGISTER posture (honest failed rows on a bad roulette
  window, held-true values, the next rung retries) stands for any
  future persistent regression.
- **Gates (the records-only tree): ALL GREEN** — the full `pnpm gates`
  9/9 in 2m 37s (the suite 15,270 = the S26/S27 close count exactly)
  + the D-9 standing audit 18/18 PASS (belt-and-braces) + the 11 live
  pd-* backtests ALL ELEVEN ALL CHECKS GREEN against production + the
  S20 data audit 20/20 GREEN (seed 20261112).
- **The S28 surfaces (what changed where):** BD-S28 (DECISIONS) · the
  CHANGELOG S28 entry · the roadmap's Session 28 SLOT record + progress
  board + current position (Session 28/30 · 2 remaining) · the
  page-division README program state · the strategy-log §8 row 32 ·
  this file. Zero code, zero deploy.

## Next session (Session 29/30)

**FIRST CHECK — the green-rows confirmation read (the BD-S28 residual,
a formality):** read `GET https://currena.ir/api/insights/status` (or
the KV `insights:status` blob via the Cloudflare API). By then the
2026-11-12 04:10–04:40 Worker rungs will have run in the fresh KV
window (the GHA daily schedule's delayed ~12:00 run behind them):
- **Green ecb rows (expected):** the observable state has caught up
  with the closed verdict — note it in the session's record (a one-line
  confirmation; no new decision needed) and move to the standing
  branch.
- **Failed ecb rows on a fresh rung (a bad roulette window):** the
  RISK_REGISTER posture governs — honest rows, the cards hold the
  publisher-true values, the next rung/sweep retries; NOT a reopening
  of the maintenance item. Only the persistent multi-day
  stale-past-maxAge shape (DFR/AAA past ~2026-11-17/18 · HICP past
  ~2026-11-30, never refreshed) would re-open the escalation question
  for the owner.

Then the standing branch — decided by the owner's kickoff prompt:
- **If the owner supplies the investor's §19 answers:** run the investor
  round (collect → D-49+ in the strategy log §5 Round 4 → the spec v2
  entries — the AF-1…AF-8 findings ride that pass, never silent
  edits); S23's deferred feedback-build scope follows it. **The §19.6
  answer also opens (or delays) the retirement execution** — record it
  as Gate 0 in DECISIONS.md and schedule the execution session per the
  checklist's §7 (a reserve slot).
- **If not:** the roadmap's reserve slots (S29–S30) hold the retirement
  execution (ONLY behind the recorded §19.6 sign-off) and the buffers —
  pick per the owner's kickoff prompt (one session per slot, the
  parallel-session rule).

### Operational notes worth carrying

- **The KV write cap (now with direct evidence, BD-S28):** the
  account's free-tier daily KV quota exhausts ~18:30–19:00 UTC on the
  REST path (HTTP 429 10048) — run 91's write chain was refused in
  full at 22:09 UTC with the store's retry ladder (60 s + 120 s per
  key) burning down until the GHA job's 15-minute timeout cancelled
  the run mid-chain. The tail is path- and time-dependent: the
  Worker-binding :13 prices writes still landed at 21:13 AND 22:13 the
  same evening while the REST ingest path was refused — the
  ~18:30–19:00 estimate stays the right planning window for MANUAL KV
  seeding (rung2-run / fx-run / markets-au-run / a GHA ingest
  dispatch), and a post-window dispatch costs one refused run and
  nothing else (the designed no-update branch; the 04:10/04:20 UTC
  rungs always land in the fresh window).
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  all week (the runs land 11:22–13:00 UTC) — still inside the fresh KV
  slice; the Worker's own 04:10–04:40 rungs run on time and remain the
  primary venue. A `workflow_dispatch` runs immediately.
- **The ECB portal posture (post-CLOSE):** the provider-side roulette
  (the gateway's ~30.2 s HTTP 504, per-request) remains REAL — a
  failed row (timeout OR 504) on any ecb leg is an expected honest
  shape on bad windows; the 45 s patient single attempt absorbs the
  slow-200s (run 91's clean collect is the proof) and the cards hold
  last-good meanwhile. The maintenance item is closed because the code
  demonstrably fetches clean on good windows — the per-request
  condition is the provider's, documented in RISK_REGISTER.
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
3. **The ecb escalation choice: CLOSED (BD-S28).** The maintenance
   item is closed — a rung ran the new code clean with all three ecb
   legs green (values exact), and no card ever went stale past its
   maxAge window. The wait-vs-Eurostat-fallback choice retires from
   the active levers; the RISK_REGISTER row keeps the standing posture
   (honest failed rows on bad roulette windows, held-true values, the
   rungs' daily retry) and the Eurostat-origin fallback remains the
   recorded option IF a persistent multi-day stale-past-maxAge shape
   ever returns.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
6. Ratify or redirect the BD-S3…BD-S28 decision set (the latest:
   **BD-S28** — the first-check round 4: the dispatched evidence rung,
   the maintenance item CLOSED, the observable green rows riding the
   fresh-window rungs; all recorded, none blocking).
7. Triage the queued unreviewed fa strings (every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) is COMPLETE through the Session 28 SLOT (row 32,
  added by the S28 close).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · pd-s14 (Asia 14) ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`; the pd-s4
  stateHash arm needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in
  env). S28 re-ran all eleven ALL GREEN (2026-11-11 22:2x–22:4x UTC).
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
