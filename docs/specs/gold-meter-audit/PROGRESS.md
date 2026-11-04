# PROGRESS — the gold meter audit program

The running record of the owner's audit program (the spec set:
`docs/specs/gold-meter-audit/` — README + 01–04 + PROMPTS; the session plan
GA-S1..GA-S4). One line per milestone, one block per session; every number
comes from a run or a citation the session actually made. The audited
predecessor program (gold balance consolidation) is CLOSED — COMPLETE,
LIVE 2026-11-04 (its record: `docs/specs/gold-balance-consolidation/
PROGRESS.md`); this program changes nothing it shipped (D-GA-3).

## The milestone table

| ID | Milestone (spec ref) | State |
|---|---|---|
| A | The reference taxonomy verified + v1 delivered for the owner's lock; the blind-spot sweep; the presence pre-scan (01 §2 A1; 02) | ✅ COMPLETE — GA-S1 (2026-11-04): 02 is v1 (82 rows: v0 72 + 10 sweep adds − 0 strikes), every row verified live, the sweep + pre-scan recorded, PR merged. **LOCKED 2026-11-05 (OI-GA-1 RESOLVED): the owner delegated the research-and-lock to the audit's pre-lock research pass — coverage cross-checked against the canonical driver frameworks (Chicago Fed Letter 464 · WGC demand-side), every named free source re-verified live (52 FRED ids + 11 providers), 3 rows added (S13 · F16 · X7) → v1.1 = 85 rows, LOCKED. The record: 02's lock record at the file's foot** |
| B | The inventory + wiring evidence pack; the mirror sweep (01 §2 A2; 03 §1–§2) | ✅ **COMPLETE — GA-S2 (2026-11-04, source-side) + GA-S2-completion (2026-11-05, the lock + the deferred halves)**: `evidence/inventory.md` (the 161-row readings table with the mirror-sweep column **voter 21 · context 63 · not-gold 77 = 161**, the 25 derived-series recipes, the rung map, **+ §5 the voters table — the 21 seats verbatim with the evalLeg rule per seat**); `evidence/wiring.md` (**the 21 full wiring traces — no TRACE-BROKEN hops — + the 63 context traces with their never-votes notes + the five recorded findings**); `evidence/history-depths-2026-11-05.txt` (the runnable record `packages/insights/scripts/ga-s2-history-depths.sh`: 15 healthy bases 2,495–3,649 pts; cftc-gold-positioning **1 pt / base 0 / 0-of-9 days**; us-japan-10y-gap **21 pts / base 20 / pct 6-of-9 days**; gold-silver **122 pts / base 119 / ch30d 0-of-19 days**); the scan record `ga-s2-wire-scan.sh` + its runs 2026-11-04/-05. Delivered AFTER the lock was resolved in-session (the owner's delegated research-and-lock — see row A) |
| C | The coverage matrix classified + the half-implementation defect list; the header arithmetic (01 §2 A3, §5; 03 §3–§4) | ✅ **COMPLETE — GA-S3 (2026-11-05)**: `evidence/coverage-matrix.md` — **all 85 rows classified, one class each** (COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3, + the 3 cross-lists resolved to primaries I5→R7 · I6→R8 · X6→I10; header arithmetic stated: rows classified = 85, voters mapped = 21), every reason citing wiring.md or a recorded absence, the fill column seeding the backlog (yes 47 = 7 PARTIAL + 36 MISSING-FREE + 4 promote-worthy COBD, the severity components per 04 §2 — the 27-band: R4 · R6 · R8 · R9 · R10 · D4 · S4 · S7 · S13 · F1 · F2 · G1); the 21-voter mapping (20 rows + **1 UNCLASSICATED: `euro-hicp` — finding N-1, the owner decides amend-vs-re-seat**); `evidence/half-implementation.md` — the H1–H7 checks per voter, **18 defect rows** (D-1 the structural 17-of-21 level-only finding + 17 per-voter rows across 10 voters; H1 3 · H2 3 · H3 2 · H4 5 · H5 4 · H6 1 · H7 0-verified), incl. **D-18 the fake-steady finding** (cftc reads `steady`, not `unread` — the lean check's discovery) + the new read-only `ga-s3-lean-check.sh` with its committed run `evidence/lean-check-2026-11-05.txt` (6 seats fire today; all four lanes `neutral`) |
| D | The audit report `docs/insights/GOLD-METER-AUDIT-REPORT.md` (01 §2 A4; 04 §1–§2) | ⏳ PENDING — GA-S4 |
| E | The fill-program design + its GF-S1.. prompts; the owner's decision list stated (04 §3–§5) | ⏳ PENDING — GA-S4 |

## Session log

### GA-S3 (2026-11-05) — the coverage matrix classified + the half-implementation defects (A3 delivered)

- **The lock held; the denominator untouched.** 02 stayed v1.1 = 85 rows,
  LOCKED (no amendments, no owner in-session decisions to record — D-GA-1
  respected). Before any classification the two read-only re-verification
  runs: `ga-s2-history-depths.sh` re-run → **identical** (the corpus
  fixture: 15 healthy bases 2,495–3,649 · the monthly three 118–119 ·
  cftc 1 pt/base 0/0-of-9 · us-japan-10y-gap 21/20/pct 6-of-9 ·
  gold-silver 122/119/ch30d 0-of-19) and `ga-s2-wire-scan.sh` re-run
  2026-11-05 00:30 +0330 → **byte-identical to the committed
  `wire-scan-2026-11-05.txt`** (the same 20:10-UTC snapshot served — the
  committed run IS today's wire truth; no new scan file needed).
- **The new read-only script + its committed run (this session's one
  addition to the runnable record):**
  `packages/insights/scripts/ga-s3-lean-check.sh` — the per-seat lean
  check replicating read-only the exact client-side computation
  (goldBalance at MergedCard.tsx:113 — evalLeg connections.ts:595-614
  over the 21-seat table with the readable() rule gold-balance.ts:127-129
  and GOLD_LANE_MIN_FIRING=2). Its committed run
  `evidence/lean-check-2026-11-05.txt`: **6 seats fire on the fresh
  wire** — real-yield-10y + us10y supports (both move-leg fires beyond
  their 0.1/0.15 thresholds) · us30y + fed-expectations + usdjpy
  pressures (level-leg fires at decade highs 0.984/0.826/0.946 — the
  structural finding's live proof that level-only seats DO fire at the
  bands) · breakeven-5y5y pressures (a move-leg fire) — 14 readable seats
  honestly `steady` mid-band, ecb-dfr `unread` (the hold), and **all four
  lanes read `neutral` today** (borrowing-costs a 2/2 split; dollar 1
  firing; stress 0; inflation 1 — the min-2 rule holding the lanes
  honest on a day with firing evidence but no crowd).
- **THE COVERAGE MATRIX (03 §3) — `evidence/coverage-matrix.md`.** All
  **85 rows classified, one class each** (01 §6's
  necessary-and-sufficient conditions; the header arithmetic stated:
  **rows classified = 85** (82 own classes + the 3 cross-lists resolved
  to their primaries I5→R7 · I6→R8 · X6→I10, stated in the header) ·
  **voters mapped = 21**). Class tally: **COVERED 8** (R1 · R5 · R7 ·
  D1 · I1 · I2 · S1 · S5 — each with a wiring citation AND a
  fire-history: HD bases + the LC fresh-wire fires where live) ·
  **PARTIAL 7** (R4 · R6 · R8 · R10 · D4 · X1 · F1) · **MISSING-FREE
  36** (12 of them needing ZERO new fetches — the promotion class: R9 ·
  I3 · I10 · S4 · S7 · S8 · S13 · G1 · X7 · F2 · D7 · I11's US legs) ·
  **MISSING-PAID 10** (R3 · R13 · S2 · S3 · S12 · F9 · F10 · F14 · G7 ·
  M2) · **CONTEXT-ONLY-BY-DESIGN 18** (each citing its recorded
  decision: the row's own locked treatment, the frozen curation
  comments gold-score.ts:127-131, the G-5 shadow design, or the
  D-GB-5 circularity record) · **NOT-APPLICABLE 3** (R12 the era row's
  own recorded candidacy · M3/M4 the meta rows' own reasons — never
  convenience). The fill column seeds the backlog per 04 §2's fixed
  components: **yes 47** (7 PARTIAL + 36 MISSING-FREE + 4 promote-worthy
  COBD: D5 · I7 · S6 · G4) with the 27-band named (R4 · R6 · R8 · R9 ·
  R10 · D4 · S4 · S7 · S13 · F1 · F2 · G1 — every one a core-channel
  claim with the data in hand).
- **THE VOTER MAPPING (01 §5.2) — all 21 seats.** 20 map to exactly one
  row each: R1 ×3 (real-yield-10y the exact object + **us10y/us30y as
  belt-and-braces nominal proxies — the H4 accept-with-note resolution,
  legal because the real object is healthy**) · R4 ×2 · R5 · R6 · R7 ×2
  (**breakeven-tilt mapped to R7's change accent — the honest correction
  of 02 R13's own "free proxy" note: the repo's tilt (T5YIFR−T5YIE) has
  NO swap leg, so it is the expectations term-structure, not the TIPS
  liquidity basis; R13 therefore classes MISSING-PAID on its own
  footing**) · R10 ×2 (ecb-dfr + us-japan-10y-gap) · D1 · D4 · S1 ·
  S5 ×2 · X1 · F1 · I1 · I2. **1 UNCLASSICATED — finding N-1:
  `euro-hicp`** (the locked checklist holds NO euro-area
  realised-inflation row — the I-family is US-centric, R10 is foreign
  policy rates, I11 the global liquidity aggregate; the owner decides
  amend-vs-re-seat; recorded in the matrix §1 + the H-file D-17). The
  prompt's named live questions resolved: the yield-curve seats → R4
  PARTIAL (the H3 sign defect); cftc → F1 PARTIAL (the never-fires
  number as the evidence); **michigan-sentiment's mirror-sweep mark
  revisited and recorded against S13** (the `not-gold — consumer-mood`
  mark was correct as a wiring fact; S13 classes MISSING-FREE —
  promotion-class, with the sign nuance recorded: the growth-health
  rule reads bottom-quintile sentiment as growth-NEGATIVE, S13's claim
  reads pessimism as gold-POSITIVE — the re-seat needs the owner's
  polarity decision).
- **THE HALF-IMPLEMENTATION AUDIT (03 §4) —
  `evidence/half-implementation.md`.** The H1–H7 checks per voter; **18
  defect rows** — **D-1 the structural finding** (17 of 21 seats
  level-leg only: connections.ts:575-585 defines thresholds for 4 ids,
  so a readable-but-typical seat reads `steady` by construction — the
  shared finding, one row) + **17 per-voter defect rows across 10
  voters** (11 carry none): **H1** 3 (D-1 shared · D-2 fed-expectations
  — R6's change-led claim with no move leg · D-3 usdjpy — D4's "change
  emphasis" with the pct changeKind unconsumed) · **H2** 3 (D-4 cftc
  1 pt/base 0/0-of-9 days · D-5 gold-silver 122 pts/base 119/ch30d
  0-of-19 recorded days · D-6 us-japan-10y-gap 21 pts/base 20/pct
  6-of-9 days) · **H3** 2 (D-7/D-8 the yield-curve pair: the fixed −1
  on R4's regime-dependent claim, the frozen spec's own "ambiguous"
  record — the options recorded for the owner's re-seat decision) ·
  **H4** 5 (D-9/D-10 us10y/us30y nominal-vs-real belt-and-braces ·
  D-11/D-12 the nominal curve vs the real curve, riding R2's DFII5
  fill · D-13 the 10y market gap vs R10's policy-gap object) · **H5**
  4 (D-14 cftc — the F-family's only seat anywhere = OI-GA-2's exact
  evidence · D-15 gold-silver the only X in stress · D-16
  us-japan-10y-gap the dollar lane's thin third seat · D-17 euro-hicp
  the solo euro leg, riding N-1) · **H6 1 — D-18 the fake-steady
  finding, the lean check's discovery**: `cftc-gold-positioning` reads
  **`steady`, not `unread`** on the wire (LC) — its fresh
  warning-status value passes `readable()` (gold-balance.ts:127-129)
  while NEITHER evalLeg input exists, so the member line says
  "readable, honestly not firing" when the evaluator had nothing to
  evaluate; the honest `unread` path never engages because the CFTC
  fetch succeeds each Saturday — the exact false-confidence class
  D-GA-7 named, now with the member-line word recorded · **H7 0**
  (verified coherent: the member line speaks only the evaluator's own
  evidence words, the B-12 pin holds, the breakeven-tilt dual-role
  quirk noted for the owner). The **ecb-dfr hold verified honest**
  (the H6 mechanism re-read: adapters/snapshot.ts:451-465 — the
  2026-11-05 drift record's answer stands). **Treatments proposed:**
  repair 6 (D-2 · D-3 · D-4 · D-5 · D-6 · D-18, the last riding D-4's
  backfill + the readable-rule question) · repair-if-filled 2 (D-11 ·
  D-12 riding R2) · re-seat 2 (D-7 · D-8 — one sign decision) ·
  owner-decisions 3 (D-14 = OI-GA-2 · D-16's lane half · D-17 = N-1) ·
  accept-with-note 5 (D-9 · D-10 · D-13 · D-15 + the structural D-1
  acceptance pending GA-S4's threshold question).
- **Milestone row C flipped to COMPLETE.** A3 is whole: the classified
  matrix + the mapped voters + the defect list, every number from a run
  or a citation (the four committed runs: history-depths · wire-scan
  11-04/-05 · the new lean-check; the wiring pack; the code re-reads).
- **Nothing classified silently, nothing wired, nothing deployed**
  (D-GA-3/D-GA-6/D-GA-2): docs + one read-only script + its committed
  output only; no code, worker, schema, adapter or copy file touched;
  no forecasting claim anywhere (the severity ranking is
  classic-literature importance × availability × wiring cost only).
- **Not blocked on the owner for GA-S4's start.** The next session is
  **GA-S4** (the report + the fill-program design, 04 §1–§3) — its
  prompt is in PROMPTS.md and printed in this session's final message.
  The owner's decision list GA-S4 will state: **OI-GA-2..OI-GA-6 + the
  new finding N-1 (euro-hicp unclassified) + the D-7/D-8 sign decision
  + the D-18 readable-rule question + the 4 promote-worthy COBD
  questions (D5/I7/S6/G4)**.

### GA-S2-completion, attempt 3 (2026-11-05) — THE LOCK RESOLVED + A2 COMPLETED

- **The lock first (OI-GA-1) — RESOLVED this session.** The owner reached
  back in chat and **delegated the research-and-lock**: *"I am not gold or
  finance expert, I just advice you to audit and investigate and research
  wheter those 82 items are enough for our indicator or not, do we have
  reliable data streams for them, and questions like this for
  feasbility/accuracy and reliability. If you find new items, add them. if
  not , you can lock and continue. it depends on your research, I trust
  your research and judgement. if you think its enough, it's enough and
  locked by me."* The research pass performed before the lock (every check
  run this session; the full record with the verbatim instruction is 02's
  lock record at the file's foot):
  1. **Coverage cross-check** against the canonical driver frameworks —
     the Chicago Fed's four-driver model (*"What Drives Gold Prices?"*,
     Chicago Fed Letter 464, 2021: real 10y rate · long-run inflation
     expectations · **pessimistic expectations** · world income) and the
     WGC demand-side framework (jewellery · technology · central banks ·
     bar & coin · ETFs · OTC). Three classic objects found absent from v1
     and **ADDED as the owner's pre-lock amendment (v1 → v1.1)**: **S13**
     US household pessimism (Michigan — the Chicago Fed's named pessimism
     driver; `UMCSENT` re-verified live on FRED: 887 pts, 1952-12 →
     2026-09; the object is already ingested as `michigan-sentiment`, a
     growth-health voter outside the gold lanes — promotion-class) ·
     **F16** Swiss gold net exports by destination (the
     London↔Switzerland↔Asia physical-flow read behind the F6/F7 premium
     rows; the BAZG SwissImpex tables verified live, free/keyless, monthly
     by country 2012→) · **X7** gold/platinum ratio (the second
     precious-bloc internal ratio; gold-api **XPT verified live beside
     XAU**; both legs already in the repo's price-row family). The rest of
     the candidates recorded as considered-not-added with reasons (China
     real rates — no verifiable free source from this venue, ChinaBond
     HTTP 000; world income growth; MOVE; AISC; HUI — the sweep's open
     call now resolved NOT added; India import tonnage — carried inside
     F16 + WGC commentary). **v1.1 = 85 rows, LOCKED by the owner's
     delegated instruction, 2026-11-05** (row-count arithmetic verified by
     script: R14+D9+I11+S13+F16+X7+G7+H4+M4 = 85).
  2. **Data-stream reliability re-verification** — `ga-s1-fred-verify.sh`
     re-run (49 ids) + `DPCREDIT`/`MPCREDIT`/`H41RESPPALDKNWW` by curl:
     **the identical live/dead pattern GA-S1 recorded** (every live leg
     still live; every dead id still dead — DFII2 404, the BAML pair
     still a rolling ~3y window now starting 2023-11-07). Provider
     spot-checks: Frankfurter (JPY 178.30 · CHF 0.9188 · CNY 7.5177 ·
     INR 106.6318 @ 2026-11-04) · gold-api (XAU **and XPT**) · MOF jgbcme
     (10Y 2.817 @ 2026-11-02) · CFTC deafut.txt (439,640 B — byte-identical
     to GA-S1) · WGC GDT + ETF pages · GPR (2,718,208 B) · OFR FSI
     (517,372 B) · EBP (44,606 B) · IMF COFER (126,820 B) · BAZG — all
     HTTP 200 live.
  3. Downstream arithmetic restated: README's file table + OI-GA-1 row ·
     row A above — all quote v1.1 = 85 rows, locked.
- **The voters table (03 §1.1) — `inventory.md` §5:** the 21 seats of
  `GOLD_LANE_VOTERS` (`gold-score.ts:155-184`) transcribed **verbatim with
  line numbers, verified against the file** (the scan's §2 agrees on all
  21), each with the definitions.ts source/ref/cadence/staleness line and
  **the evalLeg rule that applies**: 4 of 21 seats carry a
  `SIGNAL_LEG_MOVE` threshold (real-yield-10y 0.1 pts · us10y 0.15 ·
  dollar-basket 1.0 · breakeven-5y5y 0.1 — connections.ts:575-585); **17
  are level-leg only**; the level leg = percentile10y bands <0.2/>0.8 over
  the trailing-3650d of the LEVEL (scoring.ts:63/115-120, ≥30-obs gate
  scoring.ts:72 — no voter sets `percentileBasis: 'yoy'`); the monthly
  seats express previous-release change; usdjpy is the only pct-changeKind
  seat; breakeven-tilt the only context-status seat.
- **The wiring trace (03 §2) — `evidence/wiring.md`:** the full chain for
  each of the 21 voters (source endpoint → adapter file:fn → rung →
  reading + staleness → evalLeg inputs → seat → the visitor's member line
  at `MergedCard.tsx:113/220-224`), **no TRACE-BROKEN hops**, plus the 63
  context traces (D-GA-4) ending in "never votes", plus the history
  depths restated. **Five recorded findings** (facts for GA-S3's
  H-questions): (1) `cftc-gold-positioning` — the never-fires seat now
  numbered; (2) `us-japan-10y-gap` — the intermittent percentile (the
  reading-time join at ingest/run.ts:886-899); (3) `gold-silver` — the
  thin union base; (4) **`ecb-dfr` — the 2026-11-05 drift record's open
  question answered**: the failed-fetch hold carries value+asOf with
  status `stale` and drops both derived fields (snapshot.ts:451-465, the
  H3 hold rule); (5) the structural 17-of-21 level-only finding.
- **The history depths (03 §2) — the runnable record
  `packages/insights/scripts/ga-s2-history-depths.sh`** (read-only,
  keyless, fetchless — the corpus fixture + source parses only) + its
  committed run `evidence/history-depths-2026-11-05.txt` (corpus
  recordedAt 2026-11-03T04:43:54Z). **Every number from that run:** 15
  voters PASS with bases 2,495–3,649 pts and 17–19/19-day input
  availability; the monthly three 118–119 pts (a decade at cadence); the
  suspects — `cftc-gold-positioning` **1 staged point, base 0, 0/9
  archive days with either input**; `us-japan-10y-gap` **21 staged
  points, base 20, pct10y 6/9 · change30d 1/9 recorded days**;
  `gold-silver` **122 staged points, base 119, change30d 0/19 recorded
  days** (both fields present on the 2026-11-04/05 wires — the union's
  live tail aged past 30 days).
- **Milestone row B flipped to COMPLETE.** A2 is whole: the inventory
  (readings + recipes + rungs + voters table) + the wiring evidence pack
  (traces + context traces + history depths). GA-S3 can classify.
- **Nothing classified, nothing wired into the meter, nothing deployed**
  (D-GA-3/D-GA-6/D-GA-2): docs + one read-only script + its committed
  output only; no code, worker, schema, adapter or copy file touched.
- **Not blocked on the owner anymore.** The next session is **GA-S3** (the
  coverage matrix + the half-implementation audit, 03 §3–§4) — its prompt
  is in PROMPTS.md and printed in this session's final message. The
  owner's decision list that REMAINS open: OI-GA-2..OI-GA-6 (GA-S4's
  proposal territory).

### GA-S2-completion (2026-11-05) — the lock still open: the re-verification drift record only

- **The lock first (OI-GA-1):** the owner was **not reachable in-session — the
  second consecutive session** — and no owner decision exists in the repo
  either (checked before any work: no commits after the GA-S2 merge a87ba24;
  PR #28 carries 0 comments; no issues opened; `02-REFERENCE-TAXONOMY.md`'s
  status header still reads "v1 … delivered for the owner's lock" — no lock
  line, no amendment block at the file's foot). The session therefore took
  the GA-S2-completion prompt's explicit fallback — **the lock-nothing
  re-verification only** — and did NOT start the voters table (03 §1.1), the
  wiring trace, the context traces or the history depths (03 §2): all wiring
  work against the unlocked denominator (D-GA-1). **The lock question is
  printed at the head of this session's final message and opens the next
  prompt.**
- **The drift record (the day-to-day re-verification):**
  `packages/insights/scripts/ga-s2-wire-scan.sh` re-run against the live wire
  — the script untouched since GA-S2 (read-only, keyless; D-GA-3 respected:
  nothing it parses moved). Run 2026-11-05 00:22 +0330
  (2026-11-04T20:52Z UTC) against the 20:10-UTC-sweep snapshot (generatedAt
  `2026-11-04T20:10:18.690Z`, 81,002 bytes; the 2026-11-04 baseline was the
  12:18Z snapshot, 79,247 bytes). Full output committed as
  `evidence/wire-scan-2026-11-05.txt`. **Every number below is from that
  run** (01 §4.3); deltas are vs `evidence/wire-scan-2026-11-04.txt`,
  computed by differencing the two committed outputs' §4 tables (reproducible
  from the two files alone: 21 rows drifted, 140 identical, 0 static-column
  differences).
- **The holds (the continuity anchors, unchanged between the two runs):** the
  wire serves **161 readings (161 unique ids)** and `DEFINITIONS` holds **161
  ids** — still exactly equal (48 scored-gauge rules + 113 info) ·
  `goldSummary` **ABSENT** — the OI-3/GB-S7 retirement verified holding on
  the live wire, the **second consecutive scan** · **all 21 gold-lane voters
  present** · the doc's inventory table still **159 rows** (term-premium-10y
  + tga still missing from it; its header still claims 161, its `**Counts:**`
  line still 145 — the recorded doc drift, unchanged) · GAUGES still **12
  gauges / 68 listed members / 48 scored voters in the 8 non-shadow gauges +
  4 shadow gauges with 20 context-only members** · the doc's per-row voter
  flags still **AGREE with gauges.ts on all 159 rows** · every static §4
  column (group · source · sourceRef · cadence · staleAfterDays · gauge
  membership · gold-lane-voter flag) **identical on all 161 rows** across the
  two runs — no code moved.
- **The deltas (day-to-day drift, facts not defects):** status tally
  `context 100 → 104 · normal 26 → 29 · stale 20 → 13 · warning 15 → 14 ·
  check-pending 0 → 1`. Gold-lane: **the dollar lane healed** —
  `dollar-basket` + `usdjpy` stale → normal, both now carrying `change30d`
  AND `percentile10y` (the 2026-11-04 record's 2/3-unread dollar lane reads
  3/3 on the fresh wire) · **`ecb-dfr` flipped normal → stale** with asOf
  unchanged (2026-11-04) and BOTH evalLeg input fields now absent — it
  enters the snapshot's global `staleVoters` beside the persistent
  `govt-interest-revenue` (the 2026-11-04 staleVoters were
  govt-interest-revenue · dollar-basket · usdjpy); **why the ECB seat aged
  out between the 12:18Z and 20:10Z snapshots is a wiring question this
  session does not answer — the post-lock wiring trace (03 §2) owns it** ·
  `fed-target` asOf 2026-11-03 → 2026-11-04 · `stress-stlfsi` + `nfci` asOf
  2026-10-23 → 2026-10-30 (the weekly roll) · `vix` 2026-11-02 → 2026-11-03.
  The known suspects' day-states HOLD unchanged: `cftc-gold-positioning`
  `warning` (asOf 2026-10-27) with **neither** evalLeg input on the wire ·
  `us-japan-10y-gap` percentile-only · `gold-silver` normal with both fields
  · `breakeven-tilt` still a `context`-status seat. Non-gold-lane drift,
  recorded for completeness: the Frankfurter family healed broadly
  (audjpy/audnzd/audusd/eur-usd/usdtry stale → normal/context at asOf
  2026-11-04; **`usdcny` → `check-pending`, the only one** — the
  validation-suite flag status, `packages/core/src/schemas.ts:875`);
  `brent` warning → normal; the RBA daily-10y monthly fallback visible
  (`au-10y` · `rba-expectations` · `au-us-10y-gap` asOf back to 2026-09-30,
  `au-us-10y-gap` normal → stale); `gold-oil-ratio` stale → context.
- **Nothing classified, nothing wired, nothing deployed** (D-GA-3/D-GA-6/
  D-GA-2). No code, worker, schema, adapter or copy file touched; the scan
  script itself untouched; one committed scan output + docs only.
- **Blocked on the owner:** **OI-GA-1 — the taxonomy lock** (second
  consecutive session). LOCK or AMEND the 82-row v1 taxonomy; the completion
  work items (the voters table 03 §1.1 + the wiring trace + the context
  traces + the history depths 03 §2) start by resolving it. The re-issued
  GA-S2-completion prompt is in PROMPTS.md.

### GA-S2 (2026-11-04) — the source-side inventory delivered under the lock fallback

- **The lock first (OI-GA-1):** the owner was **not reachable in-session**, so
  the session took the GA-S2 prompt's explicit fallback path — the
  inventory's **source-side work only (03 §1.2–§1.4)**, which locks nothing,
  and a hard stop before the voter wiring trace (03 §2). `02-REFERENCE-
  TAXONOMY.md` is **untouched** (v1, delivered, still awaiting the owner's
  lock — no lock line, no amendment). **The lock question is printed at the
  head of this session's final message and opens the next prompt.**
- **Delivery:** `evidence/inventory.md` — the readings table (161 rows,
  every id with source · ref, cadence, staleness window, layer, licence,
  gauge role, the mirror-sweep mark and today's wire state), the
  derived-series recipes (the 25 `derived`-provider rows with exact
  formulas + code cites, plus the CFTC positioning metric, the S&P breadth
  ratio and the price-row composition family), and the rung map (04:10
  main / 04:20 rung-2 / 04:25+04:27 daily-history halves / 04:30 rung-3 /
  04:35 rung-4 / 04:40 periodic, the Saturday + first-of-month + 21st–25th
  gates, the hourly :13/:50 and quarter-hour slots, the 10:10/20:10
  sweeps — per `docs/gap-closure/RUNGS.md`, the canonical map).
- **The runnable record:** `packages/insights/scripts/ga-s2-wire-scan.sh`
  (read-only, keyless — GET /api/insights + read-only parses of
  definitions.ts, gold-score.ts, gauges.ts and the doc's inventory table;
  the `ga-s1-fred-verify.sh` precedent). Its full output is committed as
  `evidence/wire-scan-2026-11-04.txt`. **Every number below is from that
  run** (01 §4.3).
- **The denominators, cross-checked:** the live wire serves **161 readings**
  (161 unique ids; generatedAt 2026-11-04T12:18:13.290Z; `goldSummary`
  ABSENT — the OI-3/GB-S7 retirement verified holding on the live wire) ·
  DEFINITIONS holds **161 ids** (48 scored-gauge rules + 113 info rules) ·
  GAUGES holds **12 gauges, 48 scored voters in the 8 non-shadow gauges**
  (borrowing-costs 9 · prices-heat 5 · market-stress 5 · dollar-strength 3
  · growth-health 10 · au-inflation-rates 5 · au-households 7 ·
  au-trade-currency 4) **+ 4 shadow gauges (G-5) with 20 context-only
  members** · the doc's inventory table has **159 rows** (missing
  `term-premium-10y` + `tga`, both live rung-4 ids since S3-M3.2) while
  its own header claims 161 and its `**Counts:**` line claims 145 — the
  doc drift is recorded as inventory facts; the doc's per-row voter flags
  **agree with gauges.ts on all 159 rows**.
- **The mirror sweep (01 §5.4, D-GA-4):** every one of the 161 ids marked
  **voter / context / not-gold with a one-word reason** (the method and
  criteria are stated in inventory.md §4; the marks are today's wiring
  facts, not classes — D-GA-6, and nothing maps against the unlocked
  taxonomy — D-GA-1). **Tally: voter 21 · context 63 · not-gold 77 = 161**
  (counted by `grep -c` of the three mark strings over the delimited
  readings-table region of inventory.md — the commands are stated in the
  file).
- **Today's wire facts recorded (not defects — the day's states):** all 21
  gold-lane voters present; `dollar-basket` + `usdjpy` read `stale` with
  no `change30d`/`percentile10y` (the dollar lane runs 2/3 unread today —
  the whole Frankfurter family reads stale on 2026-11-04);
  `cftc-gold-positioning` reads `warning` (46.99 % @ 2026-10-27) but
  carries neither `change30d` nor `percentile10y` — neither `evalLeg` leg
  has an input on today's wire; `us-japan-10y-gap` is percentile-only
  today; `breakeven-tilt` carries wire status `context` (a prices-heat
  context card holding a gold-lane seat — `readable()` admits it).
- **Doc-drift facts found and recorded (inventory.md):** the doc's
  inventory table is 2 rows short of the wire (term-premium-10y, tga) and
  its counts line is 14 stale; the doc's provider-key list names only 20
  of the 25 `derived`-provider ids; the doc's rung table's "Saturday 04:25
  +2 fetches" line is superseded by RUNGS.md (the CFTC + EIA fetches ride
  the 04:20 rung-2 Saturday gate — rung2.ts:68-69).
- **Nothing classified, nothing wired, nothing deployed** (D-GA-3/D-GA-6:
  the mirror-sweep marks are wiring facts with reasons, not classes; GA-S3
  classifies against the locked taxonomy). No code, worker, schema,
  adapter or copy file touched; one read-only script + its committed
  output + docs only.
- **Blocked on the owner:** **OI-GA-1 — the taxonomy lock.** LOCK or AMEND
  the 82-row v1 taxonomy; the completion session (voters table + wiring
  trace + history depths — 03 §1.1 + §2) starts by resolving it. The
  GA-S2-completion prompt is in PROMPTS.md.

### GA-S1 (2026-11-04) — the taxonomy verified, swept, delivered as v1

- **Delivery:** `02-REFERENCE-TAXONOMY.md` is **v1 — delivered for the owner's
  lock (OI-GA-1)**. Every v0 row verified against the live source this
  session; the blind-spot sweep (01 §5.3) ran with the 13-question walk;
  10 rows added before the v1 stamp, 0 struck; the presence pre-scan
  (labelled, bounded) appended at the file's foot; a per-row changelog at
  the file's foot. The runnable verification record:
  `packages/insights/scripts/ga-s1-fred-verify.sh` (read-only, keyless —
  FRED's public `fredgraph.csv` route, the same route the ingest reads).
- **Row arithmetic:** v0 72 rows → **+10 adds** (R13 TIPS liquidity/
  breakeven–swap basis · R14 JGB 10y/YCC regime · D7 USD/CHF · D8 EM
  devaluation episodes · D9 EME trade-weighted dollar · I11 global
  liquidity/CB balance-sheet aggregate · S12 EM sovereign stress (EMBI-class)
  · F13 official-sector monthly purchases · F14 COMEX–LBMA EFP basis ·
  F15 SGE monthly withdrawals) → **−0 strikes** (the pruning walk found no
  v0 row that fails the classic bar — recorded, with the close calls and
  the considered-not-added list, in 02's sweep record) → **v1 = 82 rows**
  (R14 + D9 + I11 + S12 + F15 + X6 + G7 + H4 + M4; cross-listed
  placeholders I5/I6/X6 resolve to primaries at classification).
- **Rows amended by verification** (the one-line reasons are in 02's
  changelog): R3 (`DFII2` does not exist — 404; proxy-only), R4 (live
  tenors), R9 (the repo's `term-premium-10y` is FRED `THREEFYTP10`
  Kim-Wright, not ACM — code-verified; both free objects named), R10 (ECB
  venue-block note), I4 (FRED has no 5–10y Michigan series — SIE portal is
  the source), I8 (id fixed: `MEDCPIM158SFRBCLE`, not `…SFRBCML`), S2/S3
  (ICE BofA pair: pre-approval licence tag + a rolling ~3-year served
  window, first obs 2023-11-06 — honest D-GA-5 re-class with the S5-proxy
  named), S9 (pinned to FRED `DPCREDIT`, weekly, live; BTFP series ended
  2026-05-06, `DISCBORR` dead 2020-08), F1 (legacy file carries
  *non-commercial*, not managed money — wording corrected), F3 (WGC
  monthly XLSX is the clean free object; SPDR export is JS-driven), F4/F5/
  H1–H4 (WGC GDT URL amended to the live `/goldhub/research/` page), F6
  (SGE UA-sensitive; LBMA leg bot-challenged — free-first derivation
  named), F8 (CME automation-hostile), F11 (US Mint venue-blocked).
- **Pre-scan tally** (02's foot; presence against
  `docs/INDICATORS_AND_DATA_SOURCES.md` ONLY): PRESENT-VOTER 15 ·
  PRESENT-CONTEXT 23 · ABSENT 41 · UNKNOWN 0, over 79 primary rows —
  directional only; GA-S2/GA-S3 decide.
- **Sources checked this session, each opened and read** (curl, UA
  `CurrenaDashboard/1.0` or a browser UA where noted; the FRED batch ran
  via `ga-s1-fred-verify.sh`):
  - FRED series pages + `fredgraph.csv` (keyless):
    `https://fred.stlouisfed.org/series/{DFII10,DFII5,DFII7,DFII20,DFII30,
    DFEDTARU,DFEDTARL,DFF,DGS2,DGS10,DGS30,T10Y2Y,T5YIFR,T5YIE,T10YIE,
    CPIAUCSL,CPILFESL,PCEPILFE,MICH,UMCSENT,M2SL,MEDCPIM158SFRBCLE,
    STICKCPIM158SFRBATL,VIXCLS,BAMLH0A0HYM2,BAMLC0A0CM,NFCI,STLFSI4,
    DTWEXBGS,DTWEXAFEGS,DTWEXEMEGS,GFDEGDQ188S,WSEFINTL1,MTSDS133FMS,
    WALCL,WRESBAL,SOFR,IORB,RRPONTSYD,WTREGEN,DPCREDIT,MPCREDIT,
    H41RESPPALDKNWW,DISCBORR}` — the live ones dated to their last
    observation (DFII10 → 2026-11-02; DFEDTARU/L → 2026-11-04; T5YIFR/
    T5YIE/T10YIE/VIXCLS → 2026-11-03; NFCI/STLFSI4/DTWEXBGS/DTWEXEMEGS →
    2026-10-30; CPI/PCE/MICH/M2SL/median/sticky → 2026-09; GFDEGDQ188S →
    2026-04-01; WSEFINTL1/WALCL → 2026-10-28; DPCREDIT → 2026-11-02);
    the dead/wrong ones recorded (DFII2 404; MEDCPIM158SFRBCML 404;
    STICKCPIM158SFRBCLE 404; STLFSI2 ends 2022-01-07; DISCBORR ends
    2020-08-01; H41RESPPALDKNWW ends 2026-05-06; BAML pair: first obs
    2023-11-06 — the rolling ~3y window). FRED search pages used for the
    absences: Michigan expectations (only MICH/UMCSENT), discount window
    (`DPCREDIT`/`MPCREDIT`/`RIFSRPF02NA`), BTFP (`H41RESPPALDKNWW`),
    TIPS tenor enumeration (DFII5/7/10/20/30), negative-yielding (none).
    FRED copyright-tag pass over 22 named series (public-domain vs
    citation-required vs pre-approval) — recorded per-row in 02.
  - Providers: `https://api.frankfurter.app/latest` (200; CHF 0.81548,
    JPY 158.25, TRY 50.022 @ 2026-11-04) · `https://api.gold-api.com/price/XAU`
    (200) · `https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp`
    (200) · `https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv`
    (200) · `https://www.boj.or.jp/en/index.htm` (200) ·
    `https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv`
    (200, 44,606 B) · `https://www.financialresearch.gov/financial-stress-index/data/fsi.csv`
    (200, 517,372 B) · `https://www.cftc.gov/dea/newcot/deafut.txt` (200,
    439,640 B; `deacot.txt`/`dfut.txt` 404 — not cited) ·
    `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt`
    (200) · `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?size=1`
    (200) · `https://www.newyorkfed.org/medialibrary/media/research/data_indicators/ACMTermPremium.xls`
    (200, 10,168,832 B) · `https://www.newyorkfed.org/research/policy/rstar`
    (200; the `Holston_Laubach_Williams_current_estimates.xlsx` link present)
    · `https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls` (200,
    2,718,208 B) + `data_gpr_daily_recent.xls` (200, 3,276,288 B) ·
    `https://www.gold.org/goldhub/research/gold-demand-trends` (200; the
    `/goldhub/data/` variant 404s) · `https://www.gold.org/goldhub/data/gold-etfs-holdings-and-flows`
    (200; serves `Flows_2026-10-02_1401.xlsx`) · `https://www.spdrgoldshares.com/`
    (200; export JS-driven) · `https://en.sge.com.cn/` (403 default UA, 200
    browser UA) · `https://www.lbma.org.uk/prices-and-data/precious-metal-prices`
    (200 but Cloudflare-style interstitial to automation) ·
    `https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting`
    (200) · `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/COFER/7.0.1/*`
    (Accept: application/json → 200, 126,820 B — matches the repo's own
    recorded payload) · `https://data.sca.isr.umich.edu/` (200 — the UoM
    SIE portal).
  - **Venue blocks recorded, never circumvented** (the RULES 4.3 lineage):
    ECB Data Portal + `data-api.ecb.europa.eu` (WAF block page; availability
    grounded by the repo's own live `ecb-dfr`/`euro-hicp` voters + the
    licence register) · `policyuncertainty.com` workbooks (403 both hosts,
    both UAs; grounded by the repo's live `epu-us`/`tpu-us` first-of-month
    ingest) · `usmint.gov` (403) · `www.usgs.gov` gold statistics (405) ·
    `cmegroup.com` (403).
  - Code grounding (read-only, per the owner's re-check instruction):
    `packages/insights/src/sources.ts`, `adapters/{fred,derived,cftc,
    mof,boe,goldapi,monthly-indexes,rung4}.ts`, `licences.ts` — the exact
    series ids the repo ingests (`fed-target`=DFEDTARL/U,
    `term-premium-10y`=THREEFYTP10, `stress-stlfsi`=STLFSI4,
    `michigan-1y-expectations`=MICH, `m2-us`=M2SL, `median-cpi`=
    MEDCPIM158SFRBCLE, `sticky-cpi`=STICKCPIM158SFRBATL, `repo-stress`=
    SOFR−IORB, `us-deficit-12m`=MTSDS133FMS, COFER=`G001.AFXRA.CI_USD.SHRO_PT.Q`,
    CFTC=`dea/newcot/deafut.txt`, GPR/EPU URLs).
- **Nothing classified, nothing wired, nothing deployed** (D-GA-3/D-GA-6:
  the pre-scan's marks are not classes; GA-S3 classifies). No code, worker,
  schema, adapter or copy file touched; one read-only script added.
- **Blocked on the owner:** **OI-GA-1 — the taxonomy lock.** Amend or lock
  82-row v1; until then GA-S2 must not map wiring against an unlocked
  denominator (its prompt starts by resolving the lock).

### Spec session (2026-11-04) — the program specified

- **Delivery:** the spec set written and delivered on `spec/gold-meter-audit`
  (this PR) — README (decisions D-GA-1..10, open items OI-GA-1..6),
  01-AUDIT-SPEC (the contract, honesty rules, completeness guarantee,
  classification rubric), 02-REFERENCE-TAXONOMY (draft v0: 9 families,
  72 rows, every row with classic claim + sign + free source + cadence +
  treatment), 03-METHOD-AND-EVIDENCE (inventory, wiring trace, matrix,
  H1–H7 defect checks, evidence rules), 04-REPORT-AND-FILL-DESIGN (report
  shape, severity components, the GF-P0..P5 fill phases, standing
  constraints), PROMPTS (the GA-S1 kickoff prompt, full), PROGRESS (this
  file). AGENT_HANDOFF.md rewritten for the audit program; CHANGELOG entry.
- **Grounding facts used (verified against the repo at spec time):** the
  21-voter table (borrowing costs 8 · dollar 3 · market stress 5 ·
  inflation 5; `docs/specs/gold-balance-consolidation/
  02-ENGINE-AND-DECISION-TABLE.md` §4); the self-flagged thin voters
  (`cftc-gold-positioning` "one stored point: never fires today";
  `us-japan-10y-gap` "stale most windows"; `gold-silver` "thin history";
  the yield-curve polarity "ambiguous"); the ingested-but-not-voting
  context set (`docs/INDICATORS_AND_DATA_SOURCES.md`: gpr-* ×10, ebp,
  ofr-fsi, sloos-ci-tightening, term-premium-10y, tga, reverse-repo,
  bank-reserves, repo-stress, net-liquidity, m2-us,
  michigan-1y-expectations, usd-reserve-share [the dedollar shadow,
  S6-M6.4 pending], sp500-breadth-ratio, us-deficit-12m,
  govt-interest-revenue, treasury-auction-10y/30y + indirect, nyfed-custody,
  btp-bund-spread, t5yie, breakeven-10y, median-cpi, sticky-cpi,
  gold-oil-ratio, gold-btc, gold-aud, copper-gold); the free-source
  licence table (L0/L1). None of this pre-classifies anything — the matrix
  is GA-S3's, against the locked taxonomy (D-GA-1).
- **Nothing audited yet.** The program's first finding will be GA-S1's.

## Owner must decide

1. **OI-GA-1 — the taxonomy lock: RESOLVED 2026-11-05** (the owner
   delegated the research-and-lock to the audit in chat; the pre-lock
   research pass added S13 · F16 · X7 and locked **v1.1 = 85 rows** — the
   record in 02's lock record). Further additions are owner-recorded
   amendments with dates only (D-GA-1).
2. OI-GA-2..OI-GA-6 — as scheduled in the README's table (GA-S4's decision
   list, unless the owner calls them earlier in chat).

## Standing constraints (every session)

- D-GA-3: read-only against the meter — no edits to `gold-score.ts`,
  `gold-balance.ts`, `GOLD_LANE_VOTERS`, the harness tables, schemas,
  adapters or copy dictionaries; docs + read-only scripts only; deploy
  nothing.
- D-GA-2: no forecasting claim, anywhere, ever (the no-edge record stands).
- D-GA-1: the taxonomy is the fixed denominator; amendments after the lock
  are owner-recorded decisions with dates.
- Every number from a run or a citation; recommendations re-checked against
  code before they are written down (the owner's 2026-10-31 instruction).
- Full gates green before every push; branch + PR per phase; self-merge when
  the exit gate holds; CI green verified on main after every merge.
- D-GA-9: end every session with the next prompt rewritten, committed,
  pushed, and printed.
