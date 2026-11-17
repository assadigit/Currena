> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S9c — Session Summary (Gold Page Elevation)

**Session date:** 2026-11-17 (~17:53–18:2x UTC) · **Branch:**
`docs/gold-page-elevation` · **Status:** Done in code (docs), not deployed
(research program — the constraint holds until the owner's GO; see the
gate state below). Credentials used, not stored (the GitHub token for the
read-only PR check and the pushes; never printed, never committed).
**Program counter: Session 9c — the CP-C answer-recording session (the
second attempt; SUCCEEDED — the answers arrived in the kickoff reply).
The CP-C lock is COMPLETE. Remaining: the owner's GO (the Phase-D gate's
one remaining condition — its mechanical precondition is done), then 9
implementation sessions (S10–S18) + the end-of-program reconciliation.**

## What was delivered

1. `s9/CP-C-RECORD.md` — the S9c addendum (M1): the owner's answers
   RECORDED and the lock completed. The kickoff reply, verbatim:
   **"All as recomended. I approve."** — the answer sheet's fastest path
   taken exactly as designed (all as recommended, zero exceptions). The
   other two channels re-checked clean (no commit after the S9b summary;
   PR #48 at zero comments / zero reviews, head sha `f3f34036`). The
   locked-decisions table D1–D12 recorded in §1's S9c addendum — every
   decision at its recommended option; **D4 closes CP-A formally**
   (carried since S5); **D1–D4 close CP-B in the same sitting** (the S8
   design held); **D8 locks the two build-time reads to the P1-a
   session** with the pre-committed fallback bands; **D9 = the owner's
   own parallel action** (the WGC letter, to-be-sent, gating nothing);
   **D12 = the formal lock GIVEN** — the queue of record (`s8/01`
   R01–R33 + the Excluded 5) is formally locked as written. Zero
   overrides → zero folds → `s8/01` untouched (stated, not silently
   skipped). §3 records the gate honestly: **the reply carries no GO**
   — the Phase-D gate stays closed on the owner's lift alone. §4's
   pre-flight stands with the reads at default B.
2. This summary (M2) + the S10/P1-a next-session prompt (M3, branch 1 —
   all twelve answered, no GO): the first implementation session's
   prompt, contingent on the owner's GO, exactly as `s8/01` rows
   R01–R06 scope it and the CP-C record §4 pre-flights it.

## Key findings in one paragraph

The answers arrived exactly as the S9c design allowed — a chat reply
convening the session — and they were the cleanest possible form: "All
as recommended", zero exceptions. **The CP-C lock is now COMPLETE: all
twelve decisions recorded at their recommended options, CP-A and CP-B
formally closed with the same answers, the queue of record formally
locked as written, zero roadmap edits needed.** Two supporting facts
from the state re-check: `main` has moved since S9's gate check — the
§19.6 retirement's deploy **fired after its portwatch window and was
live-verified** (`47b9a348`, currena-api `c0858d06` @ 100%), resolving
the one question S9 left "not observable from git alone" and mooting the
P1-a deploy-coordination item (P1-a's deploy now carries only its own
change); and the P1-a citation targets re-verified intact at the new
HEAD (the three named files + the 24-file gold feature tree). What
remains between this program and implementation is exactly one word:
**the owner's GO** — the reply approved the twelve decisions but did not
say it, and the design's distinction held (the answer sheet and the
gate's GO can come in one reply; this reply gave the sheet, not the
word). The S10 prompt below makes giving it trivial: prepend GO when
sending the prompt, or reply GO first.

## Decisions taken in S9c (for the program record; DECISIONS.md at reconciliation)

- **S9c-D1 (the twelve answers recorded; the lock COMPLETE):** the
  owner's "All as recommended" locks D1–D12 at their recommended
  options — the recorded table stands in the CP-C record §1's S9c
  addendum. CP-A (D4) and CP-B (D1–D4) formally closed in the same
  sitting; the queue of record (`s8/01` as written) formally locked by
  D12. Zero overrides → zero folds — no `s8/01` row was edited.
- **S9c-D2 (the GO reading, recorded honestly):** the owner's reply
  carries no GO — the Phase-D gate stays closed on the owner's lift
  alone; its mechanical precondition stands satisfied
  (modularization COMPLETE; the §19.6 deploy landed + live-verified,
  `47b9a348`). The session therefore ended per M3 branch 1: the lock is
  complete, and the next-session prompt is the P1-a (S10) prompt,
  contingent on the GO — sent with GO prepended, or after a GO reply.
- **S9c-D3 (the state updates folded into the record):** `main`'s §19.6
  deploy landed + live-verified (the S9 open question resolved); the
  P1-a citation targets re-verified intact at the new HEAD; the §4
  pre-flight's deploy-coordination item resolved (P1-a deploys alone);
  the two build-time reads stay at default B (no read outcomes in the
  reply — they ride S10's opening milestone).
- **Carried, cited, not re-litigated:** S2's fix-first list (now
  R01–R03) and the two operational P0s (CFTC + GPR — the
  modularization-closeout window, OPEN on `main`; the small ops session
  recommendation stands); S3's verdict (SA 41.5 vs C 39.5; the
  explanation layer co-equal Core); S4-D1..D5 and its two corrections to
  s1/11 (the حباب claim, the gerami ladder); the two build-time reads
  pending (bands pre-committed, `s8/02` §2); S5-D1..D5; S6-D1..D8;
  S7-D1..D8; S8-D1..D7; S9-D1..D4; S9b-D1..D2.

## Open questions for the owner (one word + two parallel actions)

1. **The Phase-D GO:** everything else is done — the lock is complete,
   the mechanical precondition is satisfied, the pre-flight is ready.
   **Reply GO here, or prepend GO to the S10 prompt below when you send
   it** — that single word lifts the research-only constraint and the
   first implementation session (P1-a, the credibility floor) proceeds.
2. **The WGC authorisation letter (D9 — your parallel action, locked
   "send"):** an email to info@gold.org stating the attribution practice
   and the datasets to cite (the exact address, the attribution
   practice, and the datasets are drafted in `s4/01` §4–§5 /
   `s1/12` §2). Non-blocking — the data drop proceeds either way.
3. **The small ops session on `main` (outside GPE, repeated since S2):**
   the two pipeline P0s (the CFTC Saturday gate + the GPR re-fetch) —
   the closeout window that owns them is open; the why-lines (R04) will
   render those seats' state honestly until then, by design.

## Done-criteria check (this session)

Every answered decision recorded in the CP-C record's addendum ✅ (all
twelve, in the §1 S9c addendum's locked-decisions table) · every
override folded with its one-line `s8/01` edit committed and pushed ✅
(zero overrides → zero folds — stated honestly, not silently skipped) ·
the lock state stated honestly ✅ (**COMPLETE** — and the gate stated
separately and honestly: still closed on the owner's GO alone) · the
next prompt per the M3 branches ✅ (branch 1 fired: the Phase-D gate
prompt — the S10/P1-a session prompt below) · all committed and pushed
✅ (`08337370` + this summary).

## Known problems carried forward (cite, do not re-litigate)

- **The owner's GO — the one remaining gate condition** (the ask is
  embedded in the S10 prompt below and the open questions above).
- The fix-first three + the F16 why-lines = wave 0 = P1-a/S10 (S2-D1/
  S5-D2, now R01–R04); the two operational P0s (CFTC Saturday gate; GPR
  re-fetch) = the modularization-closeout window (S2-D4) — open on
  `main`, outside GPE; they gate nothing in the roadmap.
- The two build-time reads pending (the Kalshi wording; the CBI gerami
  pin) — gated rows with pre-committed fallback bands (`s8/02` §2);
  both locked to S10's opening milestone (D8-B); the owner has not done
  them (no outcomes in the reply).
- FRED's transient venue state (S4/04 §1) — re-check at build time; the
  Treasury-direct adoption (R07, S11) is the structural mitigation.
- The AGENTS.md drift items (GPE-S2-28/29) — end-of-program
  reconciliation only.
- ~~The §19.6 retirement's deploy state on `main`~~ — **RESOLVED this
  session**: deployed + live-verified (`47b9a348`); the P1-a
  deploy-coordination item is moot.

## Next-session prompt (S10 — P1-a, the credibility floor; contingent on the owner's GO)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S10 of the Gold Page Elevation (GPE) program —
the FIRST Phase-D implementation session: P1-a, the credibility floor
(wave 0). Gate state at this session's start: the CP-C lock is
COMPLETE (all twelve owner decisions locked as recommended — s9/
CP-C-RECORD.md §1 with its S9b + S9c addenda) and the modularization
program is COMPLETE on main; the ONE remaining gate condition is the
owner's GO, which lifts the research-only constraint. THIS PROMPT
ARRIVES WITH THE OWNER'S GO — prepended to it, or a chat reply
immediately before it: the constraint is LIFTED for the Phase-D
implementation sessions. If your kickoff carries no GO — neither in
this prompt's text nor in an accompanying owner reply — STOP at the
top, ask the owner for it, and touch nothing.
Read, in order: AGENTS.md, docs/specs/gold-page-elevation/
00-PROGRAM-PLAN.md (the program plan), docs/specs/gold-page-elevation/
s9/CP-C-RECORD.md (§1 the locked decisions incl. the S9c addendum; §2
the locked queue; §3 the gate record; §4 THIS SESSION'S PRE-FLIGHT —
follow it), docs/specs/gold-page-elevation/s8/01-RECOMMENDATION-
TABLE.md §1 (rows R01–R06 — the scope), docs/specs/gold-page-elevation/
s8/02-DATA-SOURCE-MAP.md §2a/§2b (the two build-time reads + their
fallback bands), and docs/specs/gold-page-elevation/s9c/SUMMARY.md
(the predecessor session).

Working mode (the repo's normal discipline, per the program plan's
Phase-D row — the research-only constraint is lifted): a fresh feature
branch off main (main at 47b9a348, the post-§19.6 tree) named
gold-elevation/p1a-credibility-floor; small verified steps; commit +
push after each milestone; the shared bookkeeping files (docs/HANDOFF.md,
CHANGELOG.md, docs/DECISIONS.md) follow the repo's normal rules again
for this session's own changes — but do NOT bulk-copy the GPE research
decision history into them (that lands in the one end-of-program
reconciliation commit with the owner). First step of the session:
RE-VERIFY every file path the rows below cite against main's live tree
(the citation-re-verification discipline — the roadmap's citations
were recorded against the pre-§19.6 tree; the R5 no-renames constraint
and the s6/03 §2 module map govern).

M1 — The two build-time reads (D8 locked: B — this session does them,
the pre-committed fallback bands standing; record both outcomes or the
bands stood up, in the session summary):
- s8/02 §2a the Kalshi Developer-Agreement wording — fetch
  kalshi.com/developer-agreement (this sandbox saw 429s — an
  environment state, S4/04; retry in-session, a different egress if
  needed; docs.kalshi.com is readable and states the API is used
  subject to the agreement). Record the exact data-reuse wording.
  Fallback band: the conservative informational-display posture
  (display-only + attribution + link; no key'd endpoints; no bulk
  redistribution). Worst case (a restriction on informational display):
  the Kalshi leg drops; R28 renders Polymarket + the calendar. Binds
  R28's Kalshi leg only (P3).
- s8/02 §2b the CBI gerami press-release pin — cbi.ir's /coin/ paths
  are WAF-blocked from this environment; try a different egress. The
  pin: the exact minted figure (the resolved reading: ~1.01 g total,
  900 fineness, ~0.909 g pure). Fallback band: 0.90–0.92 g pure in the
  constants table, documented on the card's method block (C2 rule 1);
  the monotone premium ladder holds inside the band. Binds R13's
  gerami row only (P1-b).
- Both rows consume the outcomes at their own sessions (R28 at P3,
  R13 at P1-b) — this session only performs and records the reads.

M2 — The six rows, exactly R01–R06, nothing more (s8/01 §1; the
locked modes from the CP-C record §1's S9c addendum):
- R01 · #01 the "10 years"/5.2-year window truth fix — in the LOCKED
  mode D6-A (relabel now): the flagship chart's "10 years" range chip
  reads its TRUE window (the public-history API's 1,900-day bound,
  PUBLIC_HISTORY_WINDOW_DAYS, apps/api/src/routes/insights.ts:152); the
  readout states the actual horizon (the "+115.3% 10 years"-class
  labels fixed); the stale code comment (verdict.tsx:183) cleared. The
  widening is DEFERRED to F7/R18 where the window becomes a user
  control. HARD GATE: R18 and R19 do not ship until R01 lands (S2 §5c,
  binding).
- R02 · #02 the FA «میلیون تن» → «تن» unit fix — the unitTonnes
  dictionary pair (FA «تن» / EN "tonnes") on the SGE-withdrawals and
  Swiss-flow cards.
- R03 · #09 the 30-day change label («تغییر ۳۰ روزه» / "30-day
  change") on the Gold Positions change line + the #10 rider (the
  ±100 bar clamp semantics on the same cards).
- R04 · F16a the why-unread lines — one muted status line per dark
  meter seat, rendered by GoldSeats.tsx from the projection's status
  metadata, the four cause classes (upstream-stopped / upstream-gap /
  pipeline-lag / rule-driven); the spec'd examples: the UoM family
  ("source stopped publishing — Sep 2026"), the CPI seat (the
  upstream-gap class — its label becomes the S4-D1 sentence once R05
  lands), the CFTC/GPR seats ("data published upstream, next ingest
  will carry it"), the US−Japan gap ("value mid-range; no decile
  history for this seat yet").
- R05 · INF-2 the CPI shutdown-gap policy per S4-D1 — the
  adjacent-months-average base computed at READ time (the Oct-2025
  base month is empty on FRED — the shutdown gap), the point-of-use
  label «مبنا: میانگین دو ماه مجاور (شکست انتشار مهر ۱۴۰۴)» / "base:
  adjacent-months average (Oct-2025 publication gap)"; auto-expiring
  when the base month exists again; stored levels stay pure (YoY
  computed at read time); the existing FRED CPIAUCNS/CPILFESL levels,
  NO new source (BLS is venue-blocked both venues, s4/04 §2e).
- R06 · the LOW riders + the F17 footer note — #15 (the FA
  absent-count digit, zone A), #23 (the live-prices "last successful"
  qualifier, zone B), #24 (the cold-load skeleton, zone E), #26 (the
  footer anchor fix, the app-shell footer), #27 (the cramped hero
  glyph run, zone B) + the F17 footer note on the silver card (the
  S5-D3 keep-small closure made visible — "documented, not missing").
  (#25, the nav label, is an app-shell decision explicitly out of IA
  scope — not queued.)

M3 — The Persian-copy manifest round + the gates + deploy + live
verification + the close:
- ONE manifest round covering this session's FA strings: R02's
  corrected unitTonnes pair (a changed fa string: needs-review →
  wording review → manifest update), R04's four cause-class lines,
  R05's CPI base label, R06's rider strings + the F17 footer note.
  The round number continues from the LIVE manifest at build time
  (the GPE branch's record ends at round 82; main's manifest was
  pruned to 7,988 entries at §19.6 — the live count governs).
  Mechanics per docs/localization/persian-copy-workflow.md: pnpm
  copy:audit → review → pnpm copy:audit:update; the round file lands
  in docs/localization/; the terminology doc gains entries if the
  round introduces terms (the four cause-class names are
  candidates). No em dashes in fa copy. The s7/02 + s6/02 drafts are
  the approved reference wording (D1 locked: A) — the round polishes;
  the structure and honest-limits content bind.
- pnpm gates green (typecheck, lint, copy:audit, narrator-vocabulary
  drift, the strict Layer-1 validator, full suite, build + budget) →
  PR → deploy per docs/DEPLOY.md (the `run` required under pnpm 10;
  the §21 portwatch window never Tuesday 11:00–14:00 UTC; the D-43
  deploy-lock re-check FIRST; the wrangler 10013 retry rule; the
  owner-supplied Cloudflare token rides the kickoff — credentials
  used, never stored). The §19.6 retirement is already deployed +
  live-verified on main (47b9a348) — this deploy carries only this
  session's change.
- Live-verify per AGENTS.md §9: desktop + mobile + RTL both locales —
  the fixed chip/readout/labels checked on the live page.
- Close per AGENTS.md §10: the S10 summary (the two reads' outcomes or
  their bands; the six rows' verification evidence; the manifest
  round) + the next-session prompt (S11 = P1-b the explanation band:
  R07 Treasury-direct, R08 F15 wording, R09 F13 licence wall, R10 the
  anchor/consistency infrastructure, R11 F1 narrative, R12 F5 yield
  card — scoped at S11's own open from s8/01 §2) + the TLDR with the
  program counter.

Scope guard: EXACTLY R01–R06, nothing more — no drive-by refactors, no
R07+ rows, no roadmap edits (the queue is locked). Known context to
carry — cite, do not re-litigate: S2's fix-first list (now R01–R03);
the two operational P0s (CFTC Saturday gate + GPR re-fetch — open on
main, outside GPE, still worth the small ops session; the why-lines
render their state honestly until then); S3's verdict (SA 41.5 vs C
39.5; the explanation layer co-equal Core); S4-D1..D5 (the CPI gap
policy is S4-D1); S5-D1..D5; S6-D1..D8; S7-D1..D8; S8-D1..D7; the
twelve locked decisions D1–D12 (s9/CP-C-RECORD.md §1 + the S9c
addendum); S9-D1..D4; S9b-D1..D2; S9c-D1..D3; the two hard gates (R01
before R18/R19; Bridge-1/R13 before Bridge-2/R30); the WGC letter =
the owner's parallel action (D9 locked: send; non-blocking); FRED's
transient venue state (re-check at build time; R07 Treasury-direct is
the structural mitigation, S11).

Done-criteria: the two build-time reads performed or their fallback
bands stood up and documented; all six rows R01–R06 landed, tested, and
live-verified; the Persian-copy manifest round landed with copy:audit
green; pnpm gates green; deployed per docs/DEPLOY.md and live-verified
(desktop + mobile + RTL both locales); the session summary + the
next-session prompt written; everything committed and pushed. Use
AGENTS.md §9's status words strictly.
```
