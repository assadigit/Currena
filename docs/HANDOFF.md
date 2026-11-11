# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

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

## Current state (after the S27 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (blocked on the investor) · S24 DELIVERED (the D-9
  condition MET + the retirement checklist landed) · the S25 roadmap
  item delivered early (the Session 23 slot) · the Session 25 SLOT ran
  the first reserve session (the ecb maintenance, BD-S25) · the
  Session 26 SLOT ran the second reserve session (the ecb first-check
  follow-through, BD-S26) · **the Session 27 SLOT ran the third
  reserve session (the ecb first-check round 3 + the buffer health
  pass, BD-S27) — DELIVERED**. Remaining: S23's feedback-build scope
  (blocked on the investor) + the reserve S28–S30 (the retirement
  execution behind the §19.6 sign-off, the ecb escalation decision if
  the rung evidence demands it, buffers). **Counter: Session 27/30 · 3
  remaining.**
- **DEPLOYED LIVE:** currena-api **`9861a927`** (UNCHANGED this session
  — the S25 fix; verified via the Cloudflare API: the newest of 362
  versions, `modified_on` 12:21:27Z, nothing newer; the markets
  endpoint serves 200) + currena-markets **`8f63c8fa`** (UNTOUCHED,
  newest version). Production ≡ HEAD modulo the records commits (zero
  code changed since the S25 deploy).
- **The ecb posture (BD-S25 + BD-S26 + BD-S27, the live evidence):**
  the four portal legs ride `ECB_PORTAL_TIMEOUT_MS = 45_000` (F-11
  single attempt kept) + the HICP request is the stable full-history
  URL. The provider-side roulette (the gateway's ~30.2 s HTTP 504,
  per-request) is ACTIVE, measured at ALL THREE observed venues. The
  observable KV state is still the S26 post-fix evidence run
  (generatedAt 14:15:19Z): DFR ❌ 504 · AAA ✅ (fresh, 3.3308865271 @
  2026-11-10) · HICP ❌ 504 — the honest designed failure shape; the
  two voting cards hold publisher-true values (DFR 2.5 @ 2026-11-11 ·
  HICP 4.0 @ 2026-10, verified EXACTLY in S26). The 20:10 sweep's
  writes did not land (the KV write-cap window — harmless by design);
  **tomorrow's 04:10–04:40 Worker rungs are the next carriers, in the
  fresh KV window.** No card is past its maxAge window (DFR asOf
  2026-11-11 · AAA asOf 2026-11-10 · HICP day 41 of 60) — the
  escalation trigger is NOT met.
- **Gates (the records-only tree): ALL GREEN** — run twice this session
  (M2 at 18:11 UTC: 9/9 in 2m 45s, the suite 15,270 = the S26 close
  count; re-run after the records landed) + the D-9 standing audit
  18/18 PASS (belt-and-braces).
- **The S27 surfaces (what changed where):** the strategy-log §8
  session-table BACK-FILL (M2a — the 15 missing rows S12 → the Session
  26 SLOT, the UTC-date convention + the progress-board date-drift
  finding recorded under the table) · the records (BD-S27 in DECISIONS
  · the CHANGELOG S27 entry · the roadmap's Session 27 SLOT record +
  progress board + current position · the page-division README · this
  file). Zero code, zero deploy.
- **The counterpart close (BD-S27-parallel):** the slot's duplicate
  arrival reconciled — a second concurrent instance ran the same
  session; the pushed close `a052631` governs (it integrates the
  earlier instance's M0/M2a), the rejected local close is archived on
  `archive/s27-duplicate-m4`. The earlier instance's unique evidence is
  folded into the record: the **17:29 UTC live Rule-5 publisher
  verification** (all three ecb legs HTTP 200 in 2–4 s — DFR 2.5 @
  2026-11-11 · HICP 4.0 @ 2026-10 · AAA 3.3308865271 @ 2026-11-10, ALL
  EXACT matches to the served values: the "publisher-true" claim now
  rests on a same-day live fetch) · the HICP full-history backward
  growth at the provider (429 distinct periods from 1991-01 vs S25's
  358 from 1997-01 — content-neutral: the parser is window-agnostic,
  the tail identical) · the **pricesAsOf 20:13:18Z evidence** (the :13
  prices rung's write landed — the minute-cron alive at the sweep
  minute + the quota at its very tail, strongly favoring "the sweep
  FIRED and the cap refused its writes" over "did not fire") · the
  **S20 data audit 20/20 GREEN** (seed 20261112 — the buffer health
  pass's fourth leg, matching the S20/S21 regression standard).

## Next session (Session 28/30)

**FIRST CHECK — the ecb rung evidence, round 4 (the BD-S27 revisit):**
read `GET https://currena.ir/api/insights/status` (or the KV
`insights:status` blob via the Cloudflare API). By then the new code
will have been carried by: tomorrow's (2026-11-12) 04:10–04:40 Worker
rungs (the fresh-KV-window carriers — the primary evidence), and the
~12:00 UTC belt-and-braces behind them (the GHA daily schedule, delayed
~7–9 h by GitHub's queue all week). Decide:
- **Green ecb rows / a clean rung under the new code** (a rung or sweep
  fetched the ecb legs clean): the maintenance item is CLOSED — record
  the verdict in DECISIONS.md (BD-S27's revisit) and move to the
  standing branch.
- **Honest failed rows persisting across multiple days of the NEW code**
  (the cards going user-visibly stale past their maxAge windows — HICP
  passes its 60-day window ~2026-11-30; DFR/AAA pass 7 days on
  2026-11-18/17 if never refreshed — not just failed rows on held-true
  values): the provider-side condition is confirmed persistent —
  present the escalation choice to the owner (wait it out vs the
  Eurostat-origin dissemination-API fallback session), per
  BD-S25/BD-S26/BD-S27 + RISK_REGISTER.
- **Still the 14:15:19Z stamp after the morning rungs** (unlikely — the
  fresh KV window): read the GHA run history + the Worker versions for
  a deploy-side explanation before concluding; the ~12:00
  belt-and-braces is the next carrier.

Then the standing branch — decided by the owner's kickoff prompt:
- **If the owner supplies the investor's §19 answers:** run the investor
  round (collect → D-49+ in the strategy log §5 Round 4 → the spec v2
  entries — the AF-1…AF-8 findings ride that pass, never silent edits);
  S23's deferred feedback-build scope follows it. **The §19.6 answer
  also opens (or delays) the retirement execution** — record it as
  Gate 0 in DECISIONS.md and schedule the execution session per the
  checklist's §7 (a reserve slot).
- **If not:** the roadmap's reserve slots (S28–S30) hold the retirement
  execution (ONLY behind the recorded §19.6 sign-off), the ecb
  escalation decision if the rung evidence demands it, and the buffers
  — pick per the owner's kickoff prompt (one session per slot, the
  parallel-session rule).

### Operational notes worth carrying

- **The KV write cap:** the account's free-tier daily KV quota exhausts
  ~18:30–19:00 UTC (HTTP 429 10048 on the REST path) — any manual KV
  seeding (rung2-run / fx-run / markets-au-run / a GHA ingest dispatch)
  after ~18:30 UTC waits for the 00:00 UTC reset; the 04:10/04:20 UTC
  rungs always land in the fresh window. S27's 20:10 sweep read
  demonstrated the designed consequence live: a sweep past the cap
  leaves the blob unchanged (harmless — the held cards stay
  publisher-true; the morning rungs own the heal).
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  all week (the runs land 11:22–13:00 UTC) — still inside the fresh KV
  slice; the Worker's own 04:10–04:40 rungs run on time and remain the
  primary venue. A `workflow_dispatch` runs immediately.
- **The ECB portal posture:** see "Current state" above — a failed row
  (timeout OR 504) on any ecb leg is an expected honest shape on bad
  days; the cards hold last-good meanwhile (all three verified against
  the publisher's own API exactly, S26).
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
3. **The ecb escalation choice (standing, only if the rung evidence
   demands it):** if the post-fix days keep failing (the cards going
   user-visibly stale past their maxAge windows — the nearest concrete
   dates: DFR/AAA 2026-11-17/18, HICP ~2026-11-30 — not just honest
   failed rows on held-true values), decide between (a) waiting out the
   provider-side roulette (the sweeps keep healing on good windows) and
   (b) the Eurostat-origin dissemination-API fallback session. The
   evidence + the options are recorded in BD-S25/BD-S26/BD-S27 +
   RISK_REGISTER.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
6. Ratify or redirect the BD-S3…BD-S27 decision set (the latest:
   **BD-S27** — the first-check round 3: the sweep-watch session, the
   designed no-update branch recorded, the verdict PENDING riding
   tomorrow's rungs; all recorded, none blocking).
7. Triage the queued unreviewed fa strings (every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) is now COMPLETE through the Session 27 SLOT (the
  M2a back-fill landed the 15 missing rows 2026-11-11; the S27 close
  added its own row — the back-fill note under the table records the
  convention).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · pd-s14 (Asia 14) ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`; the pd-s4
  stateHash arm needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in
  env). S27 re-ran all eleven ALL GREEN (2026-11-11 18:15–18:31 UTC).
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above).
- **The parallel-session rule (hardened through BD-S18-parallel-3,
  BD-S21-parallel, BD-S23-parallel, and now the S27 interruption):**
  launch exactly ONE session per roadmap slot — one prompt = one
  session = one slot. If a kickoff arrives for a slot already delivered
  (origin/main carries its records), run the counterpart close, never a
  re-execution; if a duplicate is already PUSHED, reconcile onto it (the
  pushed implementation governs), archive the local duplicate,
  independently re-verify, and finish the slot's remaining milestones.
  The S27 shape (an interrupted session continued to completion, its
  earlier commits kept, nothing duplicated) is the worked precedent.
