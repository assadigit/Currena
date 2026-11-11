# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 25/30 (2026-11-12) — the first reserve session: the ecb
> provider-timeout maintenance — DELIVERED (BD-S25, ships code, deployed
> currena-api `9861a927`).** The owner's kickoff supplied NO investor
> §19 answers, so per the kickoff's own rule the slot ran the queued
> maintenance lever. The diagnosis: the failing leg is the ECB **HICP**
> fetch (`HICP/M.U2.N.000000.4D0.ANR` — the euro-hicp voter; the
> handoff note had named the lever "ecb-drf" — the source row's own
> name; its substance right, its id wrong) — "The operation was aborted
> due to timeout" at the 12 s default on EVERY rung 2026-11-06→11 (the
> last healthy fetch 2026-11-05, the morning the 2026-10 flash landed;
> DFR + AAA green throughout; euro-hicp held on last-good 4.0 @
> 2026-10 — Eurostat's own 2026-11-04 flash print, verified EXACTLY:
> 4.0 Oct · 3.8 Sep · 3.2 Aug). The venue probe matrix (the
> temp-probe pattern) measured the provider-side cause: the ECB API
> gateway INTERMITTENTLY answers HTTP 504 after ~30.2 s on ANY request
> from Worker egress (the DFR control itself 504'd in the same probe
> run that four HICP shapes answered 200 in <2 s; the sandbox venue
> fast throughout — a per-request roulette, undocumented by the
> provider). The fix (strictly-improving-or-neutral): the stable
> unfiltered full-history HICP URL (the DFR discipline; content
> byte-equal at both venues — 358 rows, the old decade window as the
> exact tail) + `ECB_PORTAL_TIMEOUT_MS = 45_000` on all four portal
> legs (F-11 kept — one honest attempt, more patient) + the two
> regression pins + the truthfulness updates (sources.ts usedFor ·
> RISK_REGISTER row + change-log · IADS §2). The rung-level proof
> rides the standing schedule — see the FIRST CHECK below.**

## Current state (after the S25 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; Phase K: S22 closed as a WAITING slot ·
  S23 DEFERRED (blocked on the investor) · S24 DELIVERED (the D-9
  condition MET + the retirement checklist landed) · the S25 roadmap
  item itself was delivered early (pulled forward into the Session 23
  slot) · **the Session 25 SLOT ran the first reserve session (the
  ecb maintenance) — DELIVERED**. Remaining: S23's feedback-build
  scope (blocked on the investor) + the reserve S26–S30 (the
  retirement execution behind the §19.6 sign-off, the ecb follow-up if
  the rung evidence demands it, buffers). **Counter: Session 25/30 ·
  5 remaining.**
- **DEPLOYED LIVE:** currena-api **`9861a927`** (this session — the
  two-step deploy `3e568964` → `9861a927`; production ≡ HEAD `0568232`;
  the SPA byte-identical, the entry chunk `index-De-odUOp.js`) +
  currena-markets `8f63c8fa` (UNTOUCHED — the code-unchanged
  convention).
- **Gates (the shipped tree, run twice): ALL GREEN** — 2m 39s + 2m 41s
  · secret scan 8/1027 · typecheck 6/6 · eslint 0/0 · copy:audit
  clean · narrator 193×2 + 56×2, eval 50 · layer1 11,969/11,969 · the
  suite **15,270** (= the S24 close 15,268 + the two new pins) · build
  + budgets held (entry 272.88/82.55). **The D-9 standing audit re-run:
  MET** (nothing touched indicators/definitions/placement/§A — the
  re-run is belt-and-braces per the session rules).
- **The S25 surfaces (what changed where):** the adapter
  (`packages/insights/src/adapters/ecb.ts` — `ecbHicpUrl()` the stable
  full-history URL + `ECB_PORTAL_TIMEOUT_MS = 45_000` on DFR · HICP ·
  AAA · BSI, both with the full evidence comments) · the pins
  (`adapters.test.ts` — the URL + the timeout) · the truthfulness
  updates (`sources.ts` ecb-portal usedFor names all four legs + the
  notes record · `docs/insights/RISK_REGISTER.md` row + change-log row
  · IADS §2 ecb row) · the records (DEPLOY.md session record ·
  CHANGELOG · BD-S25 · the roadmap's Reserve entry + progress board +
  current position · the page-division README · this file).
- **The standing next-verification (NOT yet proven — rides the
  schedule):** mid-session, a **Node-venue ingest ran at 11:57:33 UTC**
  (a GHA `insights-ingest` workflow_dispatch — the fetched F2 row proves
  the Node venue; the tree was the pre-fix S24 close): the HICP leg
  **FETCHED** (a good roulette window — same value 4.0 @ 2026-10) while
  the **AAA leg timed out instead** — the roulette confirmed PER-REQUEST
  within a single run, and venue-independent (it hits the Node venue too;
  `euro-aaa-10y` is held-stale until the next good run). The current
  status therefore carries the AAA failure row — so the 20:10 UTC sweep
  TONIGHT still fires (`sweepShouldFire` true) and runs the full collect
  with the NEW code (45 s timeouts + the stable HICP URL) from the
  production Worker venue; tomorrow's 04:10 rung owns the day. The card
  itself stays honestly held at the publisher's own freshest print
  meanwhile.

## Next session (Session 26/30)

**FIRST CHECK — the ecb rung evidence (the S25 follow-up):** read
`GET https://currena.ir/api/insights/status` (or the KV
`insights:status` blob — the /admin console itself needs the owner's
REFRESH_SECRET). Expected: the `ecb` row green (or an honest HTTP-504
row naming the gateway — a different, truthful failure kind than the
old timeout abort) and `euro-hicp` still served at its held-or-fresh
print. If the HICP leg is STILL failing across the coming days of
rungs+sweeps, the provider-side condition is confirmed persistent —
the recorded escalation options (RISK_REGISTER + BD-S25): (a) the ECB
provider channel (their feedback form lists "Performance problems /
API issues"), (b) the **Eurostat-origin dissemination-API fallback**
for the HICP leg — a new-adapter session of its own (Rule 5 venue
verification + the licence read + the full §A discipline). Bring the
choice to the owner.

Then the standing branch: **the investor round if the answers exist,
else the next reserve slot.** Read `AGENTS.md` (§14 — the owner's
rules, incl. the §A indicator maintenance discipline) first, then
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
  execution (ONLY behind the recorded §19.6 sign-off), the ecb
  escalation decision if the rung evidence demands it, and the
  buffers — pick per the owner's kickoff prompt (one session per slot,
  the parallel-session rule).

### Operational notes worth carrying

- **The KV write cap:** the account's free-tier daily KV quota exhausts
  ~19:00 UTC (HTTP 429 10048 on the REST path) — any manual KV seeding
  (rung2-run / fx-run / markets-au-run) after ~19:00 UTC waits for the
  00:00 UTC reset; the 04:10/04:20 UTC Worker rungs always land in the
  fresh window (DEPLOY.md's insights-ingestion note). NOTE: tonight's
  20:10 sweep writes KV late in the day — if the quota is already
  exhausted its writes fail loudly and tomorrow's 04:10 rung carries
  the heal (harmless, by design).
- **The ECB portal posture (BD-S25):** the four portal legs ride
  `ECB_PORTAL_TIMEOUT_MS = 45_000` (F-11 single attempt kept) + the
  HICP request is the stable full-history URL. The provider-side
  condition (the ~30.2 s 504/timeout roulette) is UNDOCUMENTED,
  intermittent, **per-request and venue-independent** — measured from
  the Worker-egress probe venue, observed on the production schedule
  (the HICP leg's six-day failure streak), and from the Node venue
  (the 11:57 GHA run: HICP fetched while the AAA leg timed out in the
  SAME run). A `failed` row — naming either a timeout or HTTP 504 —
  on ANY ecb leg is now an expected honest shape on bad days; the
  10:10/20:10 sweeps + the GHA belt-and-braces are the healing paths,
  and the affected card holds last-good meanwhile (the euro-hicp hold
  verified exactly against the publisher's own releases).
- **The fresh-card bootstrap is FIXED** (`patchInsightsSnapshot` ADDS
  readings for ids the stored snapshot lacks — the regression test pins
  it); the three Asia CPI fills' normal cadence takes over at the next
  first-of-month rung2 gate (Dec 1 UTC).
- **The D-9 audit is a standing gate:** `pnpm s24:d9-audit` (18 checks
  incl. the §A ↔ registry pin) — re-run it in any session that touches
  indicators, definitions, placement or §A; it exits non-zero on
  drift.
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
3. **The ecb escalation choice (NEW, only if the rung evidence demands
   it):** if the ECB HICP leg still fails across the coming days after
   the S25 fix, decide between (a) waiting out the provider-side
   condition (the sweeps keep healing on good windows — the card stays
   honestly held meanwhile) and (b) the Eurostat-origin
   dissemination-API fallback session. The evidence + the options are
   recorded in BD-S25 + RISK_REGISTER.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
6. Ratify or redirect the BD-S3…BD-S25 decision set (the latest:
   **BD-S25** — the ecb maintenance + the provider-side 504 roulette
   record + the escalation options; all recorded, none blocking).
7. Triage the queued unreviewed fa strings (now 1,217 of 7,965 manifest
   entries; every session's corpus-pinned values are verified
   byte-for-byte by their copy-pin tests).

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
