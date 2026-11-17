> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S9 — The CP-C Record (the checkpoint session)

**Session:** S9 of the Gold Page Elevation (GPE) program — the CP-C
CHECKPOINT session (the default path: the Phase-D gate had NOT lifted at
handoff) · **Date:** 2026-11-17 (~12:00 UTC) · **Branch:**
`docs/gold-page-elevation` · **Status:** Done in code (docs), not deployed
(research program; the standing constraint holds until the owner lifts it).

**What this is:** the CP-C checkpoint record — the twelve decisions D1–D12
with their answer status at this session's close, the locked P1–P4 queue
(the implementation queue of record), the Phase-D gate status reported
honestly from `main`'s read-only state, and the pre-flight checklist for
the first implementation session (P1-a). Inputs: `s8/03-CPC-BRIEF-AND-
DECISIONS.md` (the brief + the decisions), `s8/01-RECOMMENDATION-TABLE.md`
(the queue), `s8/02-DATA-SOURCE-MAP.md` (the gated rows + fallback bands).

**Answer-collection status at session close (checked three ways):** the
session's kickoff message contained no D1–D12 answers; the repo carries no
owner commit after the S8 summary (branch HEAD `cab8dd58`); PR #48 (the
open research PR) has zero comments and zero reviews (GitHub API, read-only,
2026-11-17 ~11:5x UTC). **No answer had arrived.** Per `s8/03` §3, the
defaults ARE the plan until overridden — this record therefore lists all
twelve with their standing defaults, explicitly, and the CP-C lock completes
the moment the owner's answers arrive (one sitting; any override folds as
a one-line edit to `s8/01`, named via its dependency graph §7).

**S9b addendum (2026-11-17, ~12:30 UTC — the answer-recording session):**
S9b convened to record the owner's answers (the S1b pattern) and found
**none waiting in any channel** — the re-check, three ways: the kickoff
message carried the S9b prompt verbatim with no answers appended; the
repo carries no commit after the S9 summary (branch HEAD `aa4ea6c1`,
local and remote identical); PR #48 remains at zero comments and zero
reviews, head sha `aa4ea6c1` (GitHub API, read-only). Zero of twelve
answered → every §1 status stands, the defaults bind, and the lock
remains pending the owner's answers alone. The full addendum is at the
end of §1; the session's own record is `s9b/SUMMARY.md`.

---

## 1. The twelve answers (D1–D12)

*Answer status legend: each row shows the standing default (what the
roadmap already sequences to) and the answer received at this session's
close. The defaults are executable and cheap to override — answering
anything else folds in without re-planning (`s8/03` §1).*

| # | Decision (one line) | Standing default [the plan until overridden] | Answer at S9 close |
|---|---|---|---|
| **D1** | The wording read — F4/F1/FAQ drafts + the F15 resolution *(CP-B residual)* | **A** — approve the drafts as reference wording for the Phase-D manifest rounds (the structure and honest-limits content are the binding part, S7's record) | **NOT ANSWERED** — default stands |
| **D2** | The pre-registered windows *(CP-B residual)* | **A** — confirm as registered: Friday weekly closes, 52-week rolling Pearson, levels, trailing-10y display, both series named on the face (S7-D7) | **NOT ANSWERED** — default stands |
| **D3** | The episode launch list *(CP-B residual)* | **A** — confirm the nine records 1971→2024-26; the Iran-market episode = a Bridge-2 follow-up, not a launch blocker (S7-D6) | **NOT ANSWERED** — default stands |
| **D4** | The CP-A scope lock, final confirmation *(carried since S5)* | **A** — confirm the S5-D1 tiers (F1–F27: Core 9 / Supporting 9 / Advanced 4 / Excluded 5) | **NOT ANSWERED** — default stands |
| **D5** | The COT display convention (S3-D3d) | **A** — keep legacy non-commercial share-of-OI, named at point of use per C1/C7 (no voter-table change; the backtest lineage untouched) | **NOT ANSWERED** — default stands |
| **D6** | The #01 fix mode (the flagship chart's window) | **A** — relabel now (the chip and readout state the true window), widen later with F7/R18 where the window becomes a user control | **NOT ANSWERED** — default stands |
| **D7** | The F12 API surface sizing | **A** — minimal: a date-parameterized, readings-only projection (the 2016+ boundary rule needs exactly this) | **NOT ANSWERED** — default stands |
| **D8** | The two build-time reads (the M2 gated rows) | **B** — the first implementation session does them (Kalshi developer-agreement wording; the CBI gerami pin), the pre-committed fallback bands standing (`s8/02` §2a/§2b) | **NOT ANSWERED** — default stands; **the owner has not done the reads** (no indication in the chat, the repo, or the PR) |
| **D9** | The WGC authorisation letter (info@gold.org) | **A** — send it (the parallel owner action; removes residual terms exposure at zero cost; non-blocking either way) | **NOT ANSWERED** — default stands |
| **D10** | The Treasury-direct switch, final confirmation | **A** — adopt (Treasury primary, FRED fallback/cross-check; R07 at P1-b) | **NOT ANSWERED** — default stands |
| **D11** | The S8 deferred-item verdicts + the P1 session split | **A** — confirm as proposed: the Chain-5 gap chart and the premiums workbook stay deferred (P4-conditional); Bridge-2 ships at P3 with both deferred components; P1 splits into three small sessions (floor → explanation band → prizes) | **NOT ANSWERED** — default stands |
| **D12** | CP-C itself — the priority lock | **A** — lock P1–P4 as proposed (33 queued rows R01–R33 + the Excluded 5; 9 sessions; zero new paid feeds; every data path verified live) | **NOT ANSWERED** — the queue stands as proposed under the defaults; **the formal lock awaits this answer** (see §2) |

**The fastest completion path for the owner:** reply "All as recommended"
(plus any exceptions by number) — D1–D12 all carry recommendations, and
CP-B's residuals (D1–D4) close in the same sitting, exactly as the S8
prompt designed.

**S9b addendum — the answer-recording re-check (2026-11-17, ~12:30 UTC,
per the S9b prompt's M1):** the session's objective was to record the
owner's D1–D12 answers and complete the CP-C lock; **the answers had not
arrived**, and the record says so honestly — the kickoff's
twelve-decision list is the prompt's own context text ("as S9 left
them", the recommendations marked), not the owner's choices, and no
owner answer text was appended to it. The three channels, re-checked:
(1) the kickoff message — the S9b prompt verbatim (no "All as
recommended", no per-decision choice, no GO, no build-time-read
outcome; credentials aside, nothing owner-authored beyond the prompt
itself); (2) the repo — no commit after the S9 summary `aa4ea6c1`
(branch HEAD; local and remote identical after fetch); (3) PR #48 —
open, zero comments, zero reviews, head sha `aa4ea6c1` (GitHub API,
read-only, ~12:2x UTC). **Zero of twelve answered: every row above
remains NOT ANSWERED, its standing default the binding plan until
overridden (`s8/03` §3).** Consequences, recorded: no override
received → no fold → `s8/01` stands as written (no row edited); the
lock remains pending the owner's answers alone (§2's
locked-in-substance state unchanged); CP-B's residuals (D1–D4) remain
open and close with the same answers when they arrive; the two
build-time reads received no owner outcomes (§4 stays at default B);
`main` is unchanged since §3's gate check (HEAD `21f2209e` at 12:30
UTC), so the gate record stands — the Phase-D gate stays closed on the
owner's lift alone. The session ended per its M3 branch 3 (the answers
still partial — none arrived): the next prompt is **S9c**, the second
answer-recording attempt (exactly the twelve remaining items listed,
the answers to arrive with its kickoff), in `s9b/SUMMARY.md`.

---

## 2. The locked P1–P4 queue (the implementation queue of record)

**The queue of record is `s8/01-RECOMMENDATION-TABLE.md` as written —
R01–R33 queued across P1–P4 (P1-a: R01–R06 · P1-b: R07–R17 · P2: R18–R21 ·
P3: R22–R30 · P4: R31–R33) + R34–R38 (the Excluded 5) not queued — with
every `[default]` posture binding per §1 above.** No override was received
at this session's close, so **no fold was needed and no row was edited.**

*(S9b re-check, 2026-11-17 ~12:30 UTC: still no override — zero answers
found in any channel; the queue stands as written, no row edited.)*

Two honest qualifications, recorded:

1. **Locked in substance, pending in form.** The defaults ARE the plan
   until overridden (`s8/03` §3): the queue is executable as written —
   every data path verified live, both pending reads banded, both hard
   gates explicit. What remains is D12's *formal* confirmation (or the
   owner's adjustments), which is the checkpoint act itself. When the
   answers arrive, this record's §1 is updated (addendum session or the
   first implementation session's opening milestone) and the lock is
   complete; any override folds as its one-line `s8/01` edit at that
   moment, named via the dependency graph §7.
2. **The session numbering shifts by one.** The finalized Phase-D
   sequence (S8-D4: "S9 P1-a → S10 P1-b → … → S17 P4") assumed the gate
   lifted at S9's start. It did not — S9 ran as the CP-C checkpoint (the
   S8-written prompt's default path). The nine implementation sessions
   therefore run as **S10–S18** (S9's slot consumed by this checkpoint;
   a short S9b addendum may record the owner's answers before them, per
   the S1b precedent). The program plan's Phase-D row carries a dated
   one-line note to this effect in the same change as this record; the
   row's *content* (what ships in which order) is unchanged.

**The queue's binding constraints, restated from the record (cited, not
re-litigated):** the two hard gates (#01/R01 before the interactive chart
R18 and the TA band R19 — S2 §5c); Bridge-1/R13 gates Bridge-2/R30; the
WGC drop calendar gates R15/R23/R25's data, never the code; the Kalshi
wording read gates only R28's Kalshi leg (band pre-committed); the
Persian-copy manifest gate applies to every FA string in every row (C7);
the two operational P0s (CFTC Saturday gate; GPR re-fetch) gate nothing
(S2-D4).

---

## 3. The Phase-D gate status (reported honestly, from `main` read-only)

**The gate has two conditions (program plan): the modularization program
COMPLETE, and the owner lifting the research-only constraint.**

- **Condition 1 — SATISFIED (verified read-only, 2026-11-17 ~11:4x UTC).**
  `main`'s history shows the 16-session modularization program **COMPLETE**:
  the M16 bookkeeping commit `cf62efbe` (2026-11-17 09:23 UTC, "modularization
  COMPLETE") closes M1–M16, including the two moves the program plan names —
  **M12 global** (`fc856449`, 16 web files into `features/global/`) and
  **M13 insights-legacy** (`73dd3be9`, 46 web files into
  `features/insights-legacy/`). A post-modularization successor session has
  ALSO landed since: the §19.6 legacy `/insights` page retirement
  (`ecc64a05`, 2026-11-17 11:33 UTC — option-B card-aware redirect +
  dead-code sweep; gates 9/9 GREEN ×2; suite 15,165), with its deploy
  **pending the §21 portwatch window** per `main`'s HANDOFF at HEAD
  `21f2209e` (scheduled after 14:00 UTC 2026-11-17 — at this session's
  ~12:00 UTC close, still within the window; whether the deploy fires is
  **not observable from git alone** and is outside this session's scope —
  the owner-side lever list on `main`'s HANDOFF records it).
- **Condition 2 — NOT SATISFIED.** The owner has not lifted the
  research-only constraint: this session's kickoff reaffirms it ("research
  and spec preparation ONLY until the modularization program completes and
  the owner lifts the constraint"), and no GO appears in the chat, the
  repo, or PR #48. **The Phase-D gate therefore remains CLOSED — on the
  owner's lift alone; its mechanical precondition is done.**

  *(S9b re-check, 2026-11-17 ~12:30 UTC: `main`'s HEAD unchanged at
  `21f2209e` — both conditions' statuses stand exactly as written above;
  the §19.6 deploy question remains owned by `main`'s HANDOFF.)*

**Consequences, recorded:**

1. **The modularization-closeout window is now OPEN on `main`** — the
   window that owns the two operational P0s (the CFTC Saturday-gate miss
   and the GPR re-fetch, S2-D4, carried and cited, never re-litigated).
   The program's repeated recommendation since S2 — a small ops session
   on `main` for the two P0s (+ the one-string #02 fix if it waits) — is
   now actionable, outside GPE, the owner's call. The why-lines (R04)
   render the seats' state honestly until then, by design.
2. **The §19.6 retirement's effect on this queue: none material, verified.**
   The P1-a citation targets all survive on `main` post-retirement
   (checked read-only against `origin/main`): `apps/api/src/routes/insights.ts`
   (the public-history endpoint R01 sizes — its own copy, explicitly
   unaffected by the retirement per `main`'s HANDOFF),
   `apps/web/src/features/gold/signals/verdict.tsx` (the stale comment
   R01 clears), `apps/web/src/features/gold/GoldSeats.tsx` (R04's
   renderer), and the gold feature tree intact (24 files under
   `features/gold/`). Discipline note: the roadmap's file citations were
   recorded against the pre-§19.6 tree; **every implementation session
   re-verifies its citations against `main`'s live tree at start** (the
   R5 no-renames constraint and the post-M8/M13 module map in `s6/03` §2
   are the governing references).

---

## 4. The pre-flight checklist for the first implementation session (P1-a)

*The session that runs when (a) the owner's D1–D12 answers have arrived
and been recorded (the lock complete) AND (b) the owner has said GO (the
gate lifted). Everything below is standing-ready; nothing blocks.*

- [ ] **The two build-time reads (D8, default B — the session does them):**
  - [ ] §2a **The Kalshi Developer-Agreement wording** — one page from a
    normal browser (kalshi.com/developer-agreement; this sandbox's 429 is
    an environment state, S4/04). Fallback band pre-committed: the
    conservative informational-display posture; worst case the Kalshi leg
    drops and R28 renders Polymarket + the calendar. Binds R28's Kalshi
    leg only (P3) — the read nevertheless rides this session per the
    default, closing the gate at its earliest moment.
  - [ ] §2b **The CBI gerami press-release pin** — the owner's browser or
    a different egress (cbi.ir's /coin/ paths are WAF-blocked here).
    Fallback band pre-committed: **0.90–0.92 g pure** in the constants
    table, documented on the card's method block (C2 rule 1); the
    monotone premium ladder holds inside the band (full +3.3% < half
    +8.5% < quarter +18.1% ≈ gerami +18.6% ± ~1 pp). Binds R13's gerami
    row only (P1-b) — the pin tightens one constant.
  - **The owner has not done the reads** (verified: no indication at this
    session's close). If the owner does them before the session, the
    answers go in the kickoff and the checkboxes close at session start.
    *(S9b re-check, 2026-11-17 ~12:30 UTC: no owner outcomes received in
    any channel — both reads stay at default B; the pre-flight stands as
    written.)*
- [ ] **Branch + base:** a fresh feature branch off `main` (the
  post-§19.6 tree), named **`gold-elevation/p1a-credibility-floor`**
  (the repo's feature-branch discipline — the `gold-balance/*` pattern).
- [ ] **Scope — exactly R01–R06, nothing more (s8/01 §1):**
  - R01 · #01 the "10 years"/5.2-year window truth fix — **in its decided
    mode [default: relabel now]** (the chip and readout state the true
    window; the stale `verdict.tsx:183` comment cleared; the widening
    deferred to F7/R18 where the window becomes a user control). Hard
    gate: R18 and R19 do not ship until R01 lands.
  - R02 · #02 the FA «میلیون تن» → «تن» unit-pair fix.
  - R03 · #09 the 30-day-change window label («تغییر ۳۰ روزه») + the #10
    clamp-semantics rider.
  - R04 · F16a the why-unread lines — the four cause classes
    (upstream-stopped / upstream-gap / pipeline-lag / rule-driven),
    rendered from the projection's status metadata by `GoldSeats.tsx`.
  - R05 · INF-2 the CPI shutdown-gap policy per S4-D1 (the
    adjacent-months-average base, computed at read time, labelled at point
    of use — «مبنا: میانگین دو ماه مجاور (شکست انتشار مهر ۱۴۰۴)» —
    auto-expiring; stored levels stay pure). Pairs with R04.
  - R06 · the LOW riders (#15/#23/#24/#26/#27) + the F17 footer note on
    the silver card.
- [ ] **The Persian-copy manifest round plan for P1-a's FA strings: ONE
  round** covering: R02's corrected `unitTonnes` pair («تن»/"tonnes" — a
  changed fa string: needs-review → wording review → manifest update);
  R04's four why-unread cause-class lines; R05's CPI base label; R06's
  rider strings + the F17 footer note. The round number continues from
  the **live manifest at build time** (this branch's record ends at
  round 82; `main`'s manifest was pruned to 7,988 entries at §19.6 — the
  live count governs). Mechanics per `docs/localization/
  persian-copy-workflow.md`: `pnpm copy:audit` → review → `pnpm
  copy:audit:update`; the round file lands in `docs/localization/`; the
  terminology doc gains entries if the round introduces terms (the four
  cause-class names are candidates). No em dashes in fa copy.
- [ ] **The gates + deploy discipline (the repo's, not GPE's):** `pnpm
  gates` green before merge; deploy per `docs/DEPLOY.md` (the `run`
  required under pnpm 10; the §21 portwatch window never Tuesday
  11:00–14:00 UTC; the D-43 deploy-lock re-check FIRST; the wrangler
  10013 retry rule); live-verify per AGENTS.md §9 (desktop + mobile +
  RTL both locales) — including the §19.6 retirement's own deploy state
  at that moment (coordinate so one deploy carries both if still
  pending).
- [ ] **Citation re-verification at session start:** every file path this
  session's rows cite, re-checked read-only against `main`'s live tree
  (the discipline note in §3 above).
- [ ] **The standing carries (cited, not re-litigated):** S2's fix-first
  list (now R01–R03) and the two operational P0s (CFTC + GPR — the
  modularization-closeout window, NOW OPEN on `main`; still worth the
  small ops session); S3's verdict (SA 41.5 vs C 39.5; the explanation
  layer co-equal Core); S4's decisions S4-D1..D5 and its two corrections
  to s1/11 (the حباب claim, the gerami ladder); the two build-time reads
  pending (bands pre-committed); S5-D1..D5; S6-D1..D8; S7-D1..D8;
  S8-D1..D7.

---

## 5. Method and limitations

The record was assembled by: (1) reading the S8 deliverables in full and
the S1–S8 summaries in order (the session prompt's reading list, followed
exactly); (2) checking the three answer channels (kickoff message, repo
commits, PR #48 comments/reviews via the GitHub API, read-only); (3)
checking `main`'s recent history and HANDOFF read-only for the gate
status, and spot-verifying the P1-a citation targets against `origin/main`'s
tree post-§19.6. Limitations: (1) the D1–D12 statuses are as of this
session's close (~12:00 UTC 2026-11-17) — answers arriving after are
recorded by the addendum/first session, not here; (2) whether the §19.6
retirement's deploy fired after its window is not observable from git
alone and was not probed (out of this docs session's scope; `main`'s
HANDOFF owns it); (3) nothing in the queue changed this session — this is
the checkpoint's *record*, not a re-planning; (4) credentials used, not
stored (the GitHub token for the read-only PR check and pushes; never
printed, never committed).
