> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S18/01 — The Research-Branch Reconciliation (the program plan's D2 close-out)

**Session:** S18 of the Gold Page Elevation (GPE) program — the NINTH and
FINAL session: **the program closeout** (bookkeeping only: NO new
features, NO deploys). **Date:** 2026-11-19 (~20:0x → ~22:xx UTC).
**Branch:** `gold-elevation/s18-closeout` (off the S17 close — see §0's
branch-base note). **What this is:** the ONE reconciliation commit the
program plan's **D2 rule** reserved for the close — the read-only
reconciliation of the research branch's record
(`origin/docs/gold-page-elevation`, the research phases' docs) against
what actually shipped (the S10–S17 implementation record), with **every
divergence recorded with its reason**. The research docs themselves are
the historical record and are **never rewritten** (program rule 2 /
AGENTS.md §8's add-only discipline); this doc is the dated closeout
record the plan reserved.

**Companion docs:** `s18/02-PROGRAM-CLOSURE-RECORD.md` (the final sweep:
the full status column, the 18-session ledger, the standing owner-side
levers) and `s18/SUMMARY.md` (the session record + the program-closure
TLDR).

---

## 0. Method, and the branch-base note

**Method (read-only, two-sided):** the research side is
`origin/docs/gold-page-elevation` at its final head `b177ad25` (the S9c
summary — the branch went quiet after the CP-C lock completed, exactly
as the plan's Phase D handover designed: the implementation record then
lives in the per-session folders `s10`–`s17` on the implementation
branches, plus the shared bookkeeping). The shipped side is the eight
implementation sessions' records (SUMMARY + HANDOFF + CHANGELOG +
DECISIONS BD-S34…S41) and the production lineage
(`f0844e59` → `23ce6b06` → `49ae8ce7` → `3b8a8c6a` → `61180d7f` →
`83359c39` → `ea45d06c` → `65f7c0bb`, each live-verified at its
session). Every divergence below cites its own session record; nothing
is inferred.

**The branch-base note (one line, recorded for the tree's honesty):**
the S18 prompt's "branch off the S17 close 26529924 on
gold-elevation/p4-advanced" names the S17 **code** close (the year-fix
commit that production `65f7c0bb` was built from); the S17 session's
full close state — carrying the S17 bookkeeping commit `0dc85eac` (the
HANDOFF rewrite + CHANGELOG + BD-S41 + this program's own s17/SUMMARY.md
with the S18 prompt itself) — is the branch tip. This session branches
off `0dc85eac` (the tip; `26529924` is its direct parent, and the
docs-only close commit touches no build input, so the production
equivalence holds for both). Recorded here so the tree's lineage
statement is exact.

**The WGC drop re-check (the fold record §0.2 rule, one last time):**
`data/wgc/` is absent on every branch (the implementation branch, the
research branch, and the working tree — checked at M1) and no owner
notice arrived in this session's kickoff. **The fold stands: R15/R23 +
the prices workbook are the program's standing owner-side lever, never
a defect** (§2 D2 below). The closeout proceeded bookkeeping-only.

---

## 1. The row-by-row disposition (the full recommendation table, closed out)

The queue of record is `s8/01-RECOMMENDATION-TABLE.md` as written
(CP-C locked, zero overrides — the s9/CP-C-RECORD §1 S9c addendum:
"All as recomended. I approve.", zero exceptions → zero folds). The
status column below is the FINAL disposition at the program close;
every "DELIVERED" row is delivered + deployed + live-verified at its
named session (the AGENTS.md §9 status words).

| Row | Item (s8/01) | Queued priority | FINAL disposition at program close |
|---|---|---|---|
| R01 | #01 the "10 years"/5.2-year window truth fix | P1-a | **DELIVERED** — S10 (mode B relabel per D6 locked; production `f0844e59`); the mode-A widening absorbed into R18 exactly as the table recorded (S13-D2: the window became a USER control, the mislabel "dissolved by construction") |
| R02 | #02 the FA «میلیون تن» unit fix | P1-a | **DELIVERED** — S10 (the `unitTonnes` pair; `f0844e59`) |
| R03 | #09 the 30-day change label + #10 clamp rider | P1-a | **DELIVERED** — S10 (the labeled window + the clamp semantics note; `f0844e59`) |
| R04 | F16a the why-unread lines (four cause classes) | P1-a | **DELIVERED** — S10 (the four cause classes + the gold-tiles status metadata; `f0844e59`) |
| R05 | INF-2 the CPI shutdown-gap policy (S4-D1) | P1-a | **DELIVERED** — S10 (the S4-D1 label rendered at the CPI seat; `f0844e59`) |
| R06 | The LOW riders (#15/#23/#24/#26/#27) + the F17 footer note | P1-a | **DELIVERED** — S10 (the riders + the silver keep-small note; `f0844e59`) |
| R07 | INF-1 the Treasury-direct yield switch (S4-D5, D10 locked) | P1-b | **DELIVERED** — S11 (the Treasury-primary collect code deployed, `23ce6b06`; the live flip verified mid-S14 — the 04:10 rung firing — closing the S11-D4 carry) |
| R08 | F15 the outlook-language resolution (C3's four clauses) | P1-b | **DELIVERED** — S11 (`23ce6b06`) |
| R09 | F13 the sharpened licence wall | P1-b | **DELIVERED** — S11 (`23ce6b06`); the wall's WGC CB line **stays standing by design** until R15's drop retires it (the row's own recorded payoff condition) |
| R10 | INF-3 the S7 integration infrastructure (anchors + one-projection consistency) | P1-b | **DELIVERED** — S11 (the anchor-id builder + the consistency test family; `23ce6b06`) |
| R11 | F1 the daily narrative | P1-b | **DELIVERED** — S11 (the engine + template + binding rules; `23ce6b06`) |
| R12 | F5 the yield-decomposition card | P1-b | **DELIVERED** — S11 (s7/01 §4's architecture verbatim; `23ce6b06`) |
| R13 | F3a Bridge-1 (board + parity + حباب grammar + interpretation) | P1-b→P1-c session | **DELIVERED** — S12 (production `49ae8ce7` + the TGJU legs' own plane; the hard gate for R30 satisfied) |
| R14 | F2a CB-demand Tier-1 (IMF IL/IRFCL tracker) | P1-b→P1-c session | **DELIVERED** — S12 (`49ae8ce7` + the `insights:gold-cb:v1` KV seed; rung3 day 1–5 + month-skip idempotence, S12-D3) |
| R15 | F2b CB-demand Tier-2 (the first GDT drop + demand stack) | P1-b (drop-dependent; slips to P2) | **PENDING — owner-side lever (the WGC fold)**: no drop across S12→S18 (the seventh session per the s17 record; the eighth re-check at this closeout found no drop and no owner notice). The slip ran gracefully through P2 and P3 exactly as the fold record §0.2 pre-registered ("nothing blocks on it"); the wall's WGC CB line stays; the adapter path ships drop-ready |
| R16 | F16b the affordances + the market-state pill | P1-b→P1-c session | **DELIVERED** — S12 (the #17/#19/#18 affordances + the COMEX-named market pill, `49ae8ce7`) |
| R17 | The #21 de-dup (the space donor) | P1-b→P1-c session | **DELIVERED** — S12 (the operational definition per S12-D2; `49ae8ce7`) |
| R18 | F7 the interactive price chart | P2 | **DELIVERED** — S13 (production `3b8a8c6a` + the `insights:gold-xau:v1` KV seed; the D6-A "widening rides F7" made literal — the window is a user control) |
| R19 | F8 the minimal TA band | P2 | **DELIVERED** — S13 (SMA/decile/crosses/classic pivots + the R01-gate satisfied before it, `3b8a8c6a`; the pivot-basis correction S13-D4) |
| R20 | F4a the education on-ramp | P2 | **DELIVERED** — S13 (the five drivers + two notes + FAQ; `3b8a8c6a`) |
| R21 | F4b the one-liners + the Chain-7 physical grouping | P2 | **DELIVERED** — S13 (the one-liners set + the Chain-7 grouping; `3b8a8c6a`) |
| R22 | F11 the correlation companion | P3 | **DELIVERED** — S14 (the four mandated layers, the pre-registered windows printed; production `61180d7f`) |
| R23 | F9 the ETF flows card | P3 (after the drop pipeline is routine) | **PENDING — owner-side lever (the WGC fold)**: the row's own priority condition ("after R15's first drop") never fired; the drop never arrived. Same fold as R15, never a defect |
| R24 | F22 the LBMA vault + clearing cards | P3 | **DELIVERED** — S14 (`61180d7f` + the `insights:gold-lbma:v1` KV seed; LBMA's own 9,850 t figure matched) |
| R25 | F6 the Episode Explorer | P3 | **DELIVERED** — S15 (production `83359c39`; the nine-record launch list + hasData honesty + the out-bound-only links) — **with its prices-workbook halves PENDING (owner-side lever)**: the drop-gated price path + comparison rider render their honest waiting states until the workbook lands at `data/wgc/prices/` (the adapter/runner/route/engine all ship READY — one `gold-episodes-run` lights them) |
| R26 | F10 the multi-currency gold grid | P3 | **DELIVERED** — S14 (EUR/AUD native + JPY/GBP/CNY derived + the KGX validation line; `61180d7f` + the `insights:gold-xau-crosses:v1` seed) |
| R27 | F14 the COT percentile bands + crowd gauge | P3 | **DELIVERED** — S14 (the band chips + the crowd gauge, the legacy convention per D5 locked; `61180d7f`) |
| R28 | F24 the Fed-probabilities card | P3 (gated row) | **DELIVERED with ONE leg DROPPED (deliberate, pre-committed)** — S15 (production `83359c39` + the `insights:gold-expectations:v1` seed): the **Kalshi leg dropped per the Developer-Agreement wording read's verdict** (S15-D1 — §2 D1 below); the card renders the Polymarket leg alone, honestly named as ONE venue with the traders'-not-ours disclaimer |
| R29 | F25 the calendar strip | P3 | **DELIVERED** — S15 (the same snapshot's calendar field, zero new fetches, Jalali dates for fa; `83359c39`) |
| R30 | F3b Bridge-2 (premium history + deciles + attribution strip + backfill) | P3 | **DELIVERED** — S16 (production `ea45d06c` + the `insights:gold-premium-history:v1` seed; both s7/01 §9 deferred components D-c/D-d shipped inside it; the CBI gerami pin attempted — the band stands, S16-D5) |
| R31 | F12 the time machine | P4 | **DELIVERED** — S17 (production `65f7c0bb` + the year-sharded `insights:gold-meter-history:v1:<YYYY>` backfill; the D7-locked minimal readings-only projection exactly; the era boundary never crossed) |
| R32 | F23 the forecast-accuracy retrospective | P4 | **DELIVERED** — S17 (the series re-extracted live from the publisher's own page — the "already extracted" hand-off claim found stale; every recorded aggregate reproduces exactly; the static typed module, NO KV/NO route) |
| R33 | F26 the "if you'd bought" calculator | P4 | **DELIVERED** — S17 (production `65f7c0bb` + the `insights:gold-ifbought:v1` seed; the lump + monthly DCA + the R19-posture deciles + the honest waiting lines) |
| R34 | F18 gold-miner equities/ETF layer | Excluded | **HELD (exclusion held)** — never queued, never rendered; the link-out posture stands |
| R35 | F19 the full TA zoo | Excluded | **HELD (exclusion held)** — the scope guard held through R19's minimal band |
| R36 | F20 Qaurum-style scenario tool | Excluded | **HELD (exclusion held)** — the concept rides the F6 episodes as recorded |
| R37 | F21 tick-by-tick everything | Excluded | **HELD (exclusion held)** — the honest-cadence rule held (no surface ever added) |
| R38 | F27 the retail jewelry calculator | Excluded | **HELD (exclusion held)** — owner-instructed only; no instruction arrived |

**The count at close: 31 of the 33 queued rows DELIVERED + deployed +
live-verified; 2 rows PENDING on the owner-side WGC drop (R15 + R23 —
the pre-registered fold, plus R25's drop-gated halves); 1 leg of a third
row dropped deliberately with its reason (R28's Kalshi leg); the
Excluded 5 held as excluded.** No queued row was silently dropped, no
exclusion was silently relitigated — the program's own accounting rule
("revisiting any requires new evidence or owner instruction, never a
silent relitigation", s8/01 §5) held to the end.

---

## 2. The divergences, each with its reason

Every divergence between the research branch's record and what shipped,
read-only, with its recorded reason. Divergences are numbered D1…D10 in
this doc (the S18 reconciliation's own numbering, not the CP-C D1–D12).

### D1 — R28's Kalshi leg: DROPPED (the one deliberate content divergence)

**The research record:** `s8/01` R28 sequenced both venues ("Kalshi +
Polymarket"), explicitly gated: "**gated on the Kalshi
Developer-Agreement wording read** (`s8/02`'s gated row — fallback
band: … worst case the Kalshi leg drops and the card renders Polymarket
+ the calendar)". The CP-C lock (D8 locked: B) sent the read to the
build sessions with the fallback bands standing.

**What shipped:** the read's verdict fired the pre-committed worst case
exactly. S10's attempt hit the bot-wall (429/Vercel checkpoint); S15's
first-milestone read succeeded and returned the agreement text, and the
wording read's verdict (**S15-D1**, the s15 M1 §1 record): the
agreement's own §3/§3.1 prohibit non-own-trading use,
collecting/caching/storing, and third-party sharing — outside the
conservative display-only posture for a **cached, re-published
probability feed**. The leg dropped; the card renders the Polymarket
leg alone, honestly named as ONE venue with the traders'-not-ours
disclaimer; the re-opening path is a written authorization (owner-side,
recorded in the standing levers).

**The verdict: this is the roadmap's own designed degradation firing,
not a deviation from it.** The s8/01 §7 dependency graph recorded "the
Kalshi wording gates R28's Kalshi leg only" — the gate gated exactly
that leg and nothing else; R28 itself delivered.

### D2 — R15/R23 + the prices workbook: the WGC fold (the pre-registered break, now the standing lever)

**The research record:** the fold record §0.2's single pre-registered
BROKEN item — "F2b may slip from wave 1 to P2 without demoting
anything… the drop depends on an owner action on a quarterly release
calendar… Nothing else in P1 depends on it." R23's priority carried the
same condition ("after the drop pipeline is routine — i.e. after R15's
first drop"); R25's price path carried the workbook gate; D-b (the
India/China premiums workbook) was deferred P4-conditional.

**What shipped:** the drop never arrived — checked at every session
from S12 to S18 (no file at `data/wgc/`, no owner notice; the seventh
consecutive session for R15 per the s17 record, the eighth re-check at
this closeout). R15 slipped gracefully through P2 and P3 (its own
pre-registered right), R23's condition never fired, and R25 shipped
with its drop-gated halves rendering honest waiting states on
drop-READY machinery. **The fold is the program's standing owner-side
lever, never a defect** — the closeout records it in one place in
`s18/02` §3.

### D3 — The P3 intra-wave regrouping (scheduling drift, not content drift)

**The research record** (`s8/01` §8's effort estimate): "S14:
R22+R23+R24; S15: R25+R26; S16: R27+R28+R29+R30".

**What shipped:** S14 = R22+R24+R26+R27; S15 = R28+R29+R25; S16 = R30.
**The reason:** R23's drop-condition freed a P3 slot at S14 (the rows
re-grouped around the owner's short-session rule — the effort estimate's
own §9 limitation: "session-level, sized against the complexity
ratings… the first Phase-D session calibrates them"); every queued P3
row still delivered inside the wave's three sessions (P3 COMPLETE
across S14–S16). No row's content, priority tier, or ordering guarantee
changed; only the per-session packing shifted.

### D4 — The session numbering +1 (the S9 checkpoint slot)

**The research record:** the plan's finalized Phase-D sequence ran
"S9 P1-a → … → S17 P4" (9 sessions, S9–S17).

**What shipped:** the gate had NOT lifted at S9's start, so S9 ran as
the CP-C checkpoint session and the nine implementation sessions ran as
**S10–S18** — recorded at the time in the CP-C record §2 qualification
2 ("the session numbering shifts by one; the row's content is
unchanged"), with the plan's Phase-D row carrying its dated note. The
actual shape: 8 feature sessions (S10–S17) + this closeout (S18).

### D5 — The D2 rule's form: per-session bookkeeping replaced the single-commit vision after the gate lifted

**The research record:** D2 (2026-11-17, the standing research-only
constraint): "Do not edit `docs/HANDOFF.md` / `CHANGELOG.md` /
`docs/DECISIONS.md` during research phases — a single reconciliation
commit at program close."

**What happened:** the research phases held D2 exactly (the research
branch never touched the shared bookkeeping — verified: the research
branch's diffs carry only `docs/specs/gold-page-elevation/` +
`docs/audits/` files). Then the owner's GO (sent with the S10 kickoff)
lifted the research-only constraint, and Phase D ran under **the repo's
normal branch discipline** (the program plan's own Phase-D rule:
"Implementation sessions then follow the repo's normal feature-branch
discipline… each ending with the standard TLDR + next-session prompt")
— which includes the shared bookkeeping per session (BD-S34…S41,
HANDOFF rewrites, CHANGELOG entries). **The reserved reconciliation
therefore lands now in the form the program actually took:** this dated
closeout doc (the research-vs-shipped divergence record) + the
`s18/02` closure record + the AGENTS.md drift-item reconciliation (D6/
D7 below) — the D2 commit's content, delivered at the close the rule
reserved it for. The research branch's own records were never rewritten
at any point.

### D6 — GPE-S2-28 (the AGENTS.md dollar-basket count): reconciled INTO AGENTS.md this session

**The research record** (the S2 deep audit, "Docs drift — record-only"):
"AGENTS.md §C describes the dollar basket as 7 currencies (incl. AUD);
the code and the live card say 6 (DXY recipe, `BASKET_WEIGHTS` in
`domains/currencies/basket.ts`; card title 'The dollar vs six big
currencies'). Reconcile at program close."

**The verified code reality at the S17 close:** `BASKET_WEIGHTS` in
`packages/insights/src/domains/currencies/basket.ts` carries **six**
currencies — EUR 0.576 · JPY 0.136 · GBP 0.119 · CAD 0.091 · SEK
0.042 · CHF 0.036 (the DXY recipe, no AUD; weights sum asserted = 1 in
`basket.test.ts`). **Reconciled into AGENTS.md §C this session** (the
facts refresh): the basket reads as SIX currencies with the true
post-modularization module path — closing the drift item at the
end-of-program window the research record reserved for it.

### D7 — GPE-S2-29 (the AGENTS.md live-price source attribution): reconciled INTO AGENTS.md this session

**The research record:** "AGENTS.md §F attributes the live prices to
gold-api; the projection's `gold-usd` sourceName is 'Yahoo Finance:
COMEX gold futures (GC=F)' (gold-api still sources the
ratio/platinum/premium legs). Record for the reconciliation commit."

**The verified code reality at the S17 close:** the live-price board
(`packages/insights/src/shared/prices/definitions.ts`) sources its four
tiles from the Yahoo minute-board — gold = "Yahoo Finance: COMEX gold
futures (GC=F)" (the hero's market-state pill names the same reference
market at point of use) — while gold-api sources the ratio/platinum/
copper legs (`gold-silver` XAU÷XAG, `platinum` XPT, `copper-usd` HG)
plus the indicator registry's accumulated XAU/XAG history legs.
**Reconciled into AGENTS.md this session:** the Prices-board rows' source
column now names the Yahoo minute-board for the live tiles with
gold-api's remaining legs named separately.

### D8 — GPE-S2-30 (the verdict.tsx stale comment): fixed with R01 at S10 (verified)

The S2 audit's third drift item ("`verdict.tsx`'s 'complete 10-year
daily series' comment is stale vs the 1,900-day public bound — the
code-level twin of #01. Fixing #01 should fix the comment."). **Verified
at this closeout:** the stale comment is gone from
`apps/web/src/features/gold/signals/verdict.tsx` at the S17 close (the
R01 record's own claim — "the R01 record's stale comment cleared",
S13-D2 — re-verified read-only this session). Closed with R01; no
action needed at the closeout.

### D9 — Wording-level drift inside the shipped surfaces (the D1-locked-A rounds working as designed)

**The research record:** D1 locked A — the S6/S7 reference drafts are
"reference wording for the Phase-D manifest rounds (the structure and
honest-limits content are the binding part, the rounds polish)".

**What shipped:** the rounds did exactly that, and every
wording-level divergence between the s6/s7 drafts and the shipped
strings was recorded in its own session at its own manifest round —
the standing example being S11-D2 (the narrativeCaveat harmonization:
s6/02's C7 record «توصیف» over s7/03's draft sketch «توضیح می‌دهد»,
one word apart, decided on the copy-principles record). The Persian
copy manifest rounds 83–90 (8,032→8,483 entries) are the per-string
record of every such divergence; each round doc carries its binding
reference. **No unrecorded wording drift exists** — verified by the
copy:audit gate (clean at every session close, including this one).

### D10 — R01's mode-A absorption: happened exactly as the table recorded it

Not a divergence but a closure note: the table's R01 recorded "mode A —
widen server-side… naturally absorbed by R18/F7 where the window
becomes a user control". **What shipped:** exactly that — R18's window
chips (quarter/1y/ALL + pan/zoom) made the window a user control over
the full stored series, and the #01 mislabel "dissolved by
construction" (S13-D2). The 1,900-day public-history bound itself still
stands for the non-chart history projections (recorded, working as
designed — the chart surface is the window control's own plane).

---

## 3. The Excluded 5 + the s7/01 §9 deferred verdicts (held as decided)

**The Excluded 5 (R34–R38):** held — every one of the five recorded
exclusions stood to the end (no surface ever rendered for F18/F19/F20/
F21/F27; no relitigation occurred; the positioning asset stands).

**The s7/01 §9 deferred list, each verdict held:**

| Deferred item | S8 verdict | Held at close |
|---|---|---|
| D-a the Chain-5 gap chart | DEFER — P4-conditional only | **HELD deferred** — never pulled (no owner instruction at CP-C or after); remains a P4-conditional candidate with its own pre-registered window if ever requested |
| D-b the WGC premiums workbook (India/China local premiums) | DEFER — P4-conditional, after drops are routine + measured demand | **HELD deferred** — the precondition (routine drops) never formed; rides the same WGC-drop owner lever family |
| D-c the Bridge-2 day-move attribution strip | SHIP at P3 (inside R30) | **SHIPPED** — S16 (the exact identity arithmetic, the formula printed verbatim, never regression) |
| D-d the Bridge-2 premium-history deciles | SHIP at P3 (inside R30) | **SHIPPED** — S16 (the R19 posture, min base 30, the honest waiting line) |
| Bridge-3 (the education deep-dive + optional alerts) | NOT QUEUED as a feature | **HELD not-queued** — the education core rode R20 + R13's interpretation paragraph; the decomposition contributions shipped as D-c's strip; the remainder stays owner-instructed only |

---

## 4. The research branch's final state (the historical record)

- `origin/docs/gold-page-elevation` stands at `b177ad25` (the S9c
  summary — the CP-C lock COMPLETE), its folders `s1`…`s9c` + the
  program plan untouched since. **The branch is the program's
  historical record and is never rewritten** (the program's own rule;
  the reconciliation lives in this s18 folder on the implementation
  branch).
- **PR #48 ("Gold Page Elevation (GPE) — Session 1: research
  foundation") remains OPEN** (verified read-only via the GitHub API at
  this session's close — state `open`, unmerged), per D3's "leave it
  open" rule. The research record stays visible on the repo page; the
  implementation record (the merged lineage) is the shipped side of
  this reconciliation.
- The pre-S10 research specs are readable on the implementation branch
  only via the research branch (`git show origin/docs/gold-page-
  elevation:<path>`) — the implementation branches carry only the
  s10+ session folders (the standing note every implementation prompt
  carried).

---

## 5. Method and limitations

(1) This reconciliation is read-only on the research side — the
divergences were diffed from the two records' own text (the s8/01 table
+ the CP-C record + the research summaries vs the s10–s17 summaries +
HANDOFF + CHANGELOG + DECISIONS BD-S34…S41); no research doc was
edited, and none needed to be (zero overrides were received at CP-C,
so `s8/01` stood as written throughout). (2) The "delivered" statuses
rely on each session's own live-verification record (the per-session
verification matrices + the production lineage) — re-verifying the live
page was out of this bookkeeping session's scope (NO deploys; the
production state at the session's start is S17's `65f7c0bb` @ 100%,
itself live-verified at S17's close and untouched since). (3) The two
wording-level facts (the basket's six currencies; the live-price
attribution) were re-verified against the code at the S17 close tree
this session (§2 D6/D7) — the code is the source of truth, per the
repo's own rule. (4) Dated market values quoted in the research docs
remain dated snapshots (program rule 6); nothing here re-litigates
them.
