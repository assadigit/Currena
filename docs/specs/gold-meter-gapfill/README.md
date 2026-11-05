# Gold meter gap-fill: spec set

**Status:** OPENED (2026-11-05) by GF-S1 — the owner-gated successor to the
CLOSED gold meter audit program (GA-S1..GA-S4, CLOSED 2026-11-05; its record:
`docs/specs/gold-meter-audit/PROGRESS.md`; the audit's verdict:
`docs/insights/GOLD-METER-AUDIT-REPORT.md`). The audit changed nothing
(D-GA-3); **every change to the meter is THIS program's, owner-gated.** The
predecessor gold balance consolidation is COMPLETE and LIVE (GB-S7,
2026-11-04): the consolidated lane balance is THE gold card for every visitor
on currena.ir.

**Owner intent (inherited from the audit's charter, 2026-11-04):** *"Make
sure nothing is missed or half-implemented."* The audit answered: 8/85 rows
fully covered as healthy voting claims (15/85 with any voting expression),
18 half-implementation defects, a 47-row ranked backlog. This program
**fills** — phase by phase, on the owner's recorded go per change — until
the meter reads over a voter set that (a) covers every classic family the
owner locked in 02 v1.1, (b) contains no half-implemented seat, and (c)
still claims nothing about the future.

**What "owner-gated" means here, concretely:** every `gold-score.ts` /
`GOLD_LANE_VOTERS` edit requires the owner's RECORDED approval **per seat
change**, with the audit report's §4 row as the justification attached to
each approval (the per-seat approval rule, D-GB-9 as amended at GB-S7).
Nothing executes without it. GF-P0 (the recalibration pre-registration) adds
**no product code at all**: the proposed voter set lives in **new read-only
harness tables beside the frozen ones** until the owner's go.

## Files

| File | Purpose |
|---|---|
| `README.md` | This index, the decision log, the owner's decision list, out of scope |
| `01-FILL-SPEC.md` | The master spec: the phases GF-P0..P5 loaded with the ranked backlog (the audit report §4/§6), the gates, the standing constraints, the end state |
| `PROMPTS.md` | The session plan with the full next-session prompt (rewritten at the end of every session — the D-GA-9 convention handed over) |
| `PROGRESS.md` | The running record, one line per milestone, one block per session. The authoritative log |
| `evidence/` | The calibration report + its runnable record (the GA evidence-pack convention: the script + the committed output) |

Reading order: 01, then PROMPTS.md, then PROGRESS.md. The founding spec is
the audit's own `04-REPORT-AND-FILL-DESIGN.md` §3–§5 (the fill design) and
the audit report's §6 (the same design made concrete) — this folder loads
them, it does not restate them.

## Decision log

| ID | Decision | Why (short) |
|---|---|---|
| D-GF-1 | **The per-seat approval rule is inherited unchanged** (D-GB-9 as amended at GB-S7): every `gold-score.ts` / `GOLD_LANE_VOTERS` edit requires the owner's RECORDED approval per seat change — the audit report's §4 row is the justification attached to each approval. GF-P0 adds no product code; the proposed set lives in new read-only harness tables beside the frozen ones (the GB-S1 precedent). | The meter is live for every visitor; the lineage rule exists so no voter seat can move silently. |
| D-GF-2 | **The beam formula, the honesty rules and the no-edge record are inherited UNCHANGED** (D-GB-8 lineage): \|net\| / (for + against) × 10 degrees, clamped [3, 10]; the readable-voter rule; the no-merge of `unread` and `neutral`; the measured no-edge record (GOLD_BACKTEST_SPEC §5) stands. **The min-2 lane rule is RE-DERIVED, not assumed** — GF-P0's whole point (the GB-S1 C1/C2 protocol re-run over every scenario). | The owner's instruction: the meter's meaning is "conditions today" (D-GB-7); a fill program that quietly re-weighted the beam would be a different meter. |
| D-GF-3 | **No forecasting claim anywhere** (D-GA-2 lineage): the calibration measures firing statistics and lane behaviour, never predictive power. Copy says "conditions". No backtest component enters any promotion decision; realised-move tables, where lineage requires them, are labelled "not used for selection" exactly as GB-S1 pre-registered. | The standing no-edge record is the operative honesty bar. |
| D-GF-4 | **Free-first** (D-GA-5 lineage): every new source the backlog names is free/keyless/licence-clean (FRED, Fed Board, CFTC, IMF, WGC, SGE, Cleveland Fed, NY Fed, Frankfurter, Yahoo-L2-accepted…). EODHD only with the owner's recorded per-item approval — **none proposed** (OI-GA-5: no use proposed by the audit). | The repo's licence register (LICENCES.md, L0/L1 rules) fail-closes; the owner's charter said "freely available". |
| D-GF-5 | **Every number from a run or a citation**; recommendations re-checked against code before they are written down (the owner's 2026-10-31 instruction, restated by the audit's evidence rules). Evidence files carry their runnable record: the script + the committed output (the GA evidence-pack convention). | A fill program that wrote numbers from memory would re-import the exact "half-implemented" class the audit just removed. |
| D-GF-6 | **P0 wraps around every voter-set change**: no new voter counts before the recalibration re-runs (the audit report §6.1's ordering note). Repairs before expansions (P1 before P2/P3); the min-firing rule, the C1/C2 verdicts and the lane-count evidence re-derive at every material set change. | The lane rule and the beam were calibrated for a specific set; a changed set invalidates the calibration silently unless re-derived. |
| D-GF-7 | **The taxonomy is LOCKED** (02 v1.1 = 85 rows, LOCKED 2026-11-05). Additions are owner-recorded amendments with dates only (D-GA-1) — N-1 (euro-hicp) is decided exactly that way if the owner amends. | The audit's denominator cannot move under the fill program's feet. |
| D-GF-8 | **The D-18 readable-rule question is decided before any new seat ships** (the input-presence rule is the audit's recommendation): a seat with neither evalLeg input reads `unread`, never `steady`. The D-4 backfill fixes the only current instance regardless. | The fake-steady class manufactured false confidence for ~30 weeks; the rule prevents the class, not the instance. |
| D-GF-9 | Delivery discipline per phase: branch `gf/<phase>`, commit and push after every milestone, PR opened early, `pnpm gates` green before every push, self-merge when the exit gate holds, CI green verified on main. Docs/scripts-only sessions deploy nothing; product-code phases deploy only when the built worker changes. | D-GA-10 / D-GB-10 lineage; the repo's standing constraint set. |

## The owner's decision list (the audit report §5, restated — it gates this program)

**Status at GF-S1 open: recorded-open on every item** (no decisions recorded
in chat or the repo before this session — the GA lock-fallback precedent
applies: GF-S1 delivers the calibration scenarios + re-issues the list).

| # | The decision | The audit's recommendation |
|---|---|---|
| OI-GA-2 | A fifth lane — flows & demand? | **Add** (the F-family's 16 rows hold one dead, solo seat — D-14); GF-P0 measures the 4-lane vs 5-lane scenarios |
| OI-GA-3 | The S6-M6.4 shadow promotion (D5 `usd-reserve-share` + S6 `sp500-breadth-ratio`) | Fold into GF-P2 as two owner-gated promotions (ranks 13, 17); D5 promote-leaning, S6 with the calibration evidence in hand |
| OI-GA-4 | WGC quarterly (F3 · F4 · F5 · F13 · F15 · F16 · H1–H4) | **Context-first**, with recorded promotion criteria revisit-able once the cards exist |
| OI-GA-5 | EODHD per-item policy (F9 · F10 · S2 · S3 · G7) | **No use proposed** — the free proxies carry these channels |
| OI-GA-6 | Copy rounds for any new context line | Standing (round 79+ when GF-P4 runs) |
| N-1 | `euro-hicp` UNCLASSICATED: amend the taxonomy or re-seat? | **Amend** (an owner-recorded amendment with its date — the denominator becomes 86) |
| The D-7/D-8 sign decision | The yield-curve polarity (four recorded options) | **(b) context demotion** per R4's own locked treatment; (d) accept-with-note the minimal-change fallback |
| The D-18 readable-rule question | Should `readable()` require evalLeg-input presence? | **Adopt the input-presence rule** (a harness-visible rule nuance, owner-gated) |
| The D-1 threshold question | Which of the 17 level-only seats deserve move thresholds? | **Derive, don't assume**: the GF-P0 calibration walks the 17 seats against their 02 treatments + the corpus distributions; D-2/D-3 (fed-expectations, usdjpy) are already P1 repairs |
| The per-row go/no-go | The 12 zero-new-fetch class: R9 · I3 · I10 · S4 · S7 · S8 · S13 · G1 · X7 · F2 · D7 · I11 | Per row: PROMOTE ×8 (R9 · I3 · S4 · S7 · S8 · S13 · G1 · F2) · CONTEXT ADD ×3 (I10 · X7 · I11) · D7 seat-or-context |

## Out of scope

Silver (OI-4 of the closed program — its own future decision). The frozen
engine and the recheck/backtest lineage (untouched except where an
owner-gated repair names them — and then behind tests + the recalibration).
Re-weighting or any forecasting claim (D-GF-3). The visual design (shipped,
owner-approved). The Persian number/digit rules. The retired
`goldSummary` wire field (GB-S7's retirement stands).

## Coordination

This program shares `AGENTS.md`, `CHANGELOG.md`,
`docs/INDICATORS_AND_DATA_SOURCES.md` and the PROMPTS convention with the
other streams: `git pull --rebase` and re-read before editing a shared file.
The audit program's evidence pack (`docs/specs/gold-meter-audit/evidence/`)
is cited, never edited. The fill program's own evidence lands here, under
`evidence/`, with its runnable record.
