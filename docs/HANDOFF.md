# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 24/30 (2026-11-12) — Phase K: the legacy retirement readiness
> review (S24) — DELIVERED (BD-S24, a records session, NO deploy).** The
> D-9 condition is MET: every one of the 187 registry ids is verified
> categorized (exactly one engine lane + exactly one page home each;
> registry ↔ engine ↔ placement reconciled — 18 checks ALL GREEN via the
> new re-runnable `pnpm s24:d9-audit`, which now also pins AGENTS §A
> against the registry). The retirement checklist landed as the
> spec-grade `docs/page-division/06-LEGACY-RETIREMENT-S24.md` (per-item
> evidence: the redirect A/B decision — the card-aware option B
> recommended; the deprecation banner's exit; the /insights-only engine
> surfaces — the region verdicts, the two global shadow-gauge question
> headers, the details panels + the per-id history [the largest gap, the
> port recommended], the narrator's full set, the watchlist/search/
> exports, the calendar/About/Together/MoneyPanel; the per-page gap
> table; the sign-off-gated execution plan + done criteria). EXECUTION
> DOES NOT SHIP — the timing is investor question §19.6. The audit's
> doc-side drift was reconciled same-session doc-only (AGENTS §A's stale
> headers + 23 missing + 3 misplaced rows · IADS §1 · the 04 audit
> basis). The full gates ALL GREEN on the records tree (the suite
> 15,268 = the S23 count — zero code changed).**

## Current state (after the S24 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (its slot ran the pulled-forward S25 fill session) ·
  **S24 DELIVERED**. Remaining: S23's feedback-build scope (blocked on
  the investor) + the reserve S26–S30 (the retirement execution behind
  the §19.6 sign-off, fix rounds, buffers). **Counter: Session 24/30 ·
  6 remaining.**
- **DEPLOYED LIVE (unchanged by this session):** currena-api `33ff60c0`
  + currena-markets `8f63c8fa`. The S24 session shipped NO code (docs +
  one new audit script only) — production is exactly the S23 close.
- **Gates (the records tree, S24 close): ALL GREEN 2m 36s** — secret
  scan 8/1027 · typecheck 6/6 · eslint 0/0 · copy:audit clean ·
  narrator 193×2 + 56×2, eval 50 · layer1 11,969/11,969 · the suite
  **15,268** (= exactly the S23 close count — zero code changed) ·
  build + budgets held (entry 272.88/82.55; AsiaPage 16.20/4.07 within
  its 16.5/6.0 row).
- **The S24 surfaces (what changed where):** the audit
  (`scripts/s24-d9-audit.ts` + the `pnpm s24:d9-audit` script — 18
  checks, the per-id evidence table, non-zero exit on red; the H checks
  pin AGENTS §A ↔ the registry) · the checklist
  (`docs/page-division/06-LEGACY-RETIREMENT-S24.md` — §2 the D-9
  verdict · §3 the findings + the reconciliation · §4 the per-item
  what-breaks [R-1…R-8] · §5 the per-page gaps · §6 what retirement
  does not touch · §7 the execution plan [Gate 0 = the owner's §19.6
  sign-off + 10 steps] · §8 the done criteria) · the doc reconciliation
  (AGENTS §A → 187/54/133 + the 23 rows + the 3 moved; IADS §1 → the
  187 header + the voter counts + the 25 rows; 04 → 187 +
  growth-health 30 + the 183-of-187 public line) · the records
  (CHANGELOG · BD-S24 · the roadmap's S24 entry + progress board +
  current position · the page-division README · this file).
- **The D-9 audit's headline facts (for any later session):** 187 ids =
  54 voting + 133 context; 13 lanes (12 gauges + the prices strip); the
  placement: gold 14 + 4 blocked · world-markets 9 · usa 72 · europe 8
  · asia-pacific 14 · australia 28 · commodities 24 · currencies 14 =
  187 (+ Global 0 by design); the one documented gauge≠lane id is brent
  (B-14); the four shadow gauges mirror context members only (G-5); the
  gold meter's 37 voters are the documented dual-membership engine.

## Next session (Session 25/30)

**The investor round if the answers exist, else the first reserve
slot.** Read `AGENTS.md` (§14 — the owner's rules, incl. the §A
indicator maintenance discipline) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the progress board + the
current-position note), this file, and — for the retirement path —
`docs/page-division/06-LEGACY-RETIREMENT-S24.md`.

- **If the owner supplies the investor's §19 answers:** run the investor
  round (collect → D-49+ in the strategy log §5 Round 4 → the spec v2
  entries — the AF-1…AF-8 findings ride that pass, never silent edits);
  S23's deferred feedback-build scope follows it. **The §19.6 answer
  also opens (or delays) the retirement execution** — record it as
  Gate 0 in DECISIONS.md and schedule the execution session per the
  checklist's §7.
- **If not:** the roadmap's reserve slots (S26–S30) hold the retirement
  execution (ONLY behind the recorded §19.6 sign-off), the ecb-drf
  provider timeout maintenance item (the runbook: the /admin console's
  per-source status, which needs the owner's REFRESH_SECRET), and the
  buffers — pick per the owner's kickoff prompt (one session per slot,
  the parallel-session rule).

### Operational notes worth carrying

- **The KV write cap:** the account's free-tier daily KV quota exhausts
  ~19:00 UTC (HTTP 429 10048 on the REST path) — any manual KV seeding
  (rung2-run / fx-run / markets-au-run) after ~19:00 UTC waits for the
  00:00 UTC reset; the 04:10/04:20 UTC Worker rungs always land in the
  fresh window (DEPLOY.md's insights-ingestion note).
- **The fresh-card bootstrap is FIXED** (`patchInsightsSnapshot` ADDS
  readings for ids the stored snapshot lacks — the regression test pins
  it); the three Asia CPI fills' normal cadence takes over at the next
  first-of-month rung2 gate (Dec 1 UTC) — JP/KR at T+0, IN at its
  measured T+1..T+3-month mirror lag (maxAge 150, labelled in copy).
- **The D-9 audit is now a standing gate:** `pnpm s24:d9-audit` (18
  checks incl. the §A ↔ registry pin) — re-run it in any session that
  touches indicators, definitions, placement or §A; it exits non-zero
  on drift.
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
5. Ratify or redirect the BD-S3…BD-S24 decision set (the latest:
   **BD-S24** — the D-9 audit green + the checklist landed + the
   doc-only reconciliation; all recorded, none blocking).
6. Triage the queued unreviewed fa strings (now 1,217 of 7,965 manifest
   entries; every session's corpus-pinned values are verified
   byte-for-byte by their copy-pin tests).
7. The ecb-drf provider timeout (a maintenance-session item): the
   S18/S19 data-refresh runs kept it held on last-good (2.5%, flagged
   stale) — it did NOT self-clear across rungs. The fail-closed design
   is holding the correct value honestly; a maintenance session should
   look at the ECB fetch.

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
  BD-S21-parallel, and BD-S23-parallel):** launch exactly ONE session
  per roadmap slot — one prompt = one session = one slot. If a kickoff
  arrives for a slot already delivered (origin/main carries its
  records), run the counterpart close, never a re-execution; if a
  duplicate is already PUSHED, reconcile onto it (the pushed
  implementation governs), archive the local duplicate, independently
  re-verify, and finish the slot's remaining milestones.
