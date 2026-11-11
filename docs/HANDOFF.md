# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 27/30 (2026-11-11) — the third reserve session (the buffer
> slot): the ecb first-check ROUND 3 + the buffer health pass — DELIVERED
> (BD-S27, no code change, no deploy; production already ≡ HEAD).** The
> owner's kickoff supplied NO investor §19 answers and NO §19.6
> sign-off, so per the kickoff's own rule the slot ran the reserve
> branch (the retirement execution stays untouched, behind Gate 0). The
> session opened at 17:07 UTC — ~3 h BEFORE the armed 20:10 sweep (the
> FIRST scheduled carrier of the S25 fix) — so neither first-check
> branch could fire yet; the slot waited for the sweep and filled the
> wait with the buffer work. The 20:10 sweep FIRED armed but the daily
> KV write cap ate its write chain (the blob keeps the 14:15 stamp —
> harmless by design, exactly the anticipated branch); the verdict stays
> **PENDING**, riding tomorrow's fresh-window rungs.**

## Current state (after the S27 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (blocked on the investor) · S24 DELIVERED (the D-9
  condition MET + the retirement checklist landed) · the S25 roadmap
  item delivered early (the Session 23 slot) · the Session 25 SLOT ran
  the first reserve session (the ecb maintenance, BD-S25) · the Session
  26 SLOT ran the second reserve session (the ecb first-check
  follow-through, BD-S26) · **the Session 27 SLOT ran the third reserve
  session (the buffer slot: the first-check round 3 + the buffer health
  pass, BD-S27) — DELIVERED**. Remaining: S23's feedback-build scope
  (blocked on the investor) + the reserve S28–S30 (the retirement
  execution behind the §19.6 sign-off, the ecb escalation decision if
  the rung evidence demands it, buffers). **Counter: Session 27/30 · 3
  remaining.**
- **DEPLOYED LIVE:** currena-api **`9861a927`** (UNCHANGED this session
  — the S25 fix; production ≡ HEAD `8dcde14` modulo records commits
  that carry no code change; verified @ 100 % via the deployments API,
  created 12:21:26Z) + currena-markets `8f63c8fa` (UNTOUCHED).
- **The ecb posture (BD-S25 + BD-S26 + BD-S27, the live evidence):**
  the four portal legs ride `ECB_PORTAL_TIMEOUT_MS = 45_000` (F-11
  single attempt) + the HICP request is the stable full-history URL.
  The provider-side roulette (the gateway's ~30.2 s HTTP 504,
  per-request) is ACTIVE at all three observed venues. The new code's
  carriers so far: S26's 14:15 belt-and-braces run (DFR ❌ 504 · AAA ✅ ·
  HICP ❌ 504 — the designed honest shape) and — armed but
  write-capped — tonight's 20:10 sweep (fired; its status/snapshot/
  public writes all capped; the fetch outcome unobservable). The Rule-5
  re-verification at 17:29 UTC (sandbox, a good window, all three legs
  200 in 2–4 s): **DFR 2.5 @ 2026-11-11 · HICP 4.0 @ 2026-10 · AAA
  3.3308865271 @ 2026-11-10 — ALL EXACT matches** to the served/held
  values (the page stays truthful). Honest observation: the HICP
  full-history grew backward at the provider (429 distinct periods,
  1991-01 start vs S25's 358 from 1997-01 — content-neutral; the parser
  is window-agnostic, the tail identical).
- **Gates (the records tree): ALL GREEN** — the full `pnpm gates` run
  this session (2 m 41 s, the suite **15,270** = the S25/S26 close
  count) + the D-9 standing audit re-run MET (belt-and-braces) + the 11
  live pd-\* backtests against production ALL GREEN + the S20 data
  audit **20/20 GREEN** (the N=20 upstream cross-check over the stored
  14:15 snapshot — 100 % match; platinum the one designed live-spot arm
  at 0.83 % intraday).
- **The S27 surfaces (what changed where):** the records (BD-S27 in
  DECISIONS · the RISK_REGISTER change-log row · the roadmap's Session
  27 SLOT record + progress board + current position · the page-division
  README program state · the CHANGELOG S27 entry · this file) + the
  strategy-log **§8 session table back-filled** (the 15 missing rows
  S12 → the Session 26 SLOT, pushed as the session's own checkpoint
  `8dcde14` — with the progress-board DATE-STAMP DRIFT finding flagged
  for the owner in the table's note; the historical board rows are NOT
  rewritten).

## Next session (Session 28/30)

**FIRST CHECK — the ecb rung evidence, round 4 (the BD-S26/BD-S27
revisit):** read `GET https://currena.ir/api/insights/status` (or the
KV `insights:status` blob via the Cloudflare API). By then the new code
will have been carried by tomorrow's **04:10–04:40 Worker rungs** (the
reliable carriers — always inside the fresh post-00:00-reset KV slice)
and the **~12:00 GHA belt-and-braces** (the 04:20 schedule delayed by
GitHub's queue all week; a `workflow_dispatch` runs immediately if
needed — before ~19:00 UTC, mind the KV cap). Decide:
- **Green ecb rows / a clean rung under the new code:** the maintenance
  item is CLOSED — record the verdict in DECISIONS.md (BD-S26/BD-S27's
  revisit) and move to the standing branch.
- **Honest failed rows persisting across multiple days of the NEW code**
  (the cards going user-visibly stale past their maxAge windows —
  ecb-dfr's maxAge 7, euro-hicp's 60 — not just failed rows on
  held-true values): the provider-side condition is confirmed
  persistent — present the escalation choice to the owner (wait it out
  vs the Eurostat-origin dissemination-API fallback session), per
  BD-S25/BD-S26/BD-S27 + RISK_REGISTER.

Then the standing branch — decided by the owner's kickoff prompt:
- **If the owner supplies the investor's §19 answers:** run the investor
  round (collect → D-49+ in the strategy log §5 Round 4 → the spec v2
  entries — the AF-1…AF-8 findings ride that pass, never silent edits);
  S23's deferred feedback-build scope follows it. **The §19.6 answer
  also opens (or delays) the retirement execution** — record it as
  Gate 0 in DECISIONS.md and schedule the execution session per the
  checklist's §7.
- **If not:** the roadmap's reserve slots (S28–S30) hold the retirement
  execution (ONLY behind the recorded §19.6 sign-off), the ecb
  escalation decision if the rung evidence demands it, and the buffers
  — pick per the owner's kickoff prompt (one session per slot, the
  parallel-session rule).

### Operational notes worth carrying

- **The KV write cap:** the account's free-tier daily KV quota (1,000
  writes/day, account-wide) exhausts ~18:30–19:00 UTC — any manual KV
  seeding (rung2-run / fx-run / markets-au-run / a GHA ingest dispatch)
  after ~19:00 UTC waits for the 00:00 UTC reset; the 04:10/04:20 UTC
  rungs always land in the fresh window. NEW EVIDENCE (S27, tonight):
  the cap ate the 20:10 sweep's write chain (the blob/snapshot/public
  all kept the 14:15 stamps) while the :13 prices rung's write still
  landed at 20:13:18Z — the cap bites at the quota's very tail, and a
  sweep whose writes cap leaves its fetch outcome unobservable (the
  status blob is the only outside-visible channel; the Worker
  observability telemetry query API returns no event rows for this
  account — probed and dropped, BD-S27).
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  all week (the runs land 11:22–13:00 UTC) — still inside the fresh KV
  slice; the Worker's own 04:10–04:40 rungs run on time and remain the
  primary venue. A `workflow_dispatch` (as S26 used at 14:15) runs
  immediately — fine before the cap window, useless after it.
- **The ECB portal posture:** see "Current state" above — a failed row
  (timeout OR 504) on any ecb leg is an expected honest shape; the
  cards hold last-good meanwhile (the held values verified against the
  publisher's own API exactly, re-verified 17:29 UTC this session).
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
   (the sweeps keep healing on good windows) and (b) the
   Eurostat-origin dissemination-API fallback session. The evidence +
   the options are recorded in BD-S25/BD-S26/BD-S27 + RISK_REGISTER.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
6. **Note the progress-board date-stamp drift finding (BD-S27):** the
   S16–S25 SLOT date stamps in the roadmap's progress board run 1–2
   days later than the git/Cloudflare record (e.g. the board says
   S19–S21 delivered 2026-11-12; the deploys + close commits are
   2026-11-10 UTC). The delivery records' content stands; the
   strategy-log §8 back-fill table carries the verified dates + the
   note. No action needed unless you want the board normalized — say
   the word and a later session can annotate it.
7. Ratify or redirect the BD-S3…BD-S27 decision set (the latest:
   **BD-S27** — the first-check round 3 + the buffer health pass + the
   sweep's write-capped outcome; all recorded, none blocking).
8. Triage the queued unreviewed fa strings (every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- **The strategy log's §8 session table is now COMPLETE through the
  Session 27 SLOT** (back-filled this session, rows 16–31; the deep
  per-session records remain the roadmap's delivery records + this file
  + CHANGELOG).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · pd-s14 (Asia 14) ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`); **re-run ALL
  GREEN this session**.
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above; **re-run 20/20 GREEN this session**).
- **The parallel-session rule (hardened through BD-S18-parallel-3,
  BD-S21-parallel, BD-S23-parallel):** launch exactly ONE session
  per roadmap slot — one prompt = one session = one slot. If a kickoff
  arrives for a slot already delivered (origin/main carries its
  records), run the counterpart close, never a re-execution; if a
  duplicate is already PUSHED, reconcile onto it (the pushed
  implementation governs), archive the local duplicate, independently
  re-verify, and finish the slot's remaining milestones.
