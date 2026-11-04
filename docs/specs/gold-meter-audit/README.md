# Gold meter audit: spec set

**Status:** SPECIFIED (2026-11-04) — the program runs as GA-S1..GA-S4 below.
Nothing audited yet; this folder is the plan, the reference checklist and the
method. The audit program is the owner's continuation of the gold program
after the gold balance consolidation closed (COMPLETE 2026-11-04, GB-S7:
`docs/specs/gold-balance-consolidation/PROGRESS.md`).

**Owner intent (2026-11-04):** *"As a financial investor with 20 years
specialization in gold exchange, create an audit program to make sure that our
gold meter has all the required indicators which classically show the
direction of gold price. Make sure nothing is missed or half-implemented."*
The audit answers one question — **does the 21-voter lane balance measure the
full classic condition set for gold, honestly and completely?** — and ends
with the owner-gated **gap-fill program** (its spec + session prompts) for
everything found missing, half-implemented or mis-wired.

**What "the gold meter" is (the audited object):** the consolidated lane
balance live for every visitor since the P5 flip — the pure engine
`packages/insights/src/gold-balance.ts` over the frozen 21-voter table
`GOLD_LANE_VOTERS` (4 lanes: borrowing costs 8, dollar 3, market stress 5,
inflation 5), the lane vote rule (min 2 firing voters, `GOLD_LANE_MIN_FIRING
= 2`), the beam formula, the derived Outlook (`goldOutlookOf`) and the
context pill. NOT part of the audited object: the retired wind vocabulary
(gone), the visual design (shipped, owner-approved), silver (OI-4, a recorded
follow-up, out of scope here too).

## Files

| File | Purpose |
|---|---|
| `README.md` | This index, the decision log, open items, out of scope |
| `01-AUDIT-SPEC.md` | The master spec: the problem, the audit's contract, the honesty rules, the completeness guarantee, the classification rubric |
| `02-REFERENCE-TAXONOMY.md` | **The specialist's checklist**: the canonical classic indicator set for gold direction — 9 families, every row with its classic claim, sign, free source, cadence and treatment. The audit's fixed denominator, locked at GA-S1 |
| `03-METHOD-AND-EVIDENCE.md` | How each audit session works: the inventory, the wiring trace, the coverage matrix, the half-implementation checks, evidence and citation rules |
| `04-REPORT-AND-FILL-DESIGN.md` | The report format, the severity ranking, and the design of the follow-up gap-fill program (phases, gates, owner decisions) |
| `PROMPTS.md` | The session plan GA-S1..GA-S4 with the full next-session prompt (rewritten at the end of every session — the owner's standing instruction) |
| `PROGRESS.md` | The running record, one line per milestone, one block per session. The authoritative log |

Reading order: 01, 02, 03, 04, then PROMPTS.md.

## Decision log

| ID | Decision | Why (short) |
|---|---|---|
| D-GA-1 | The reference checklist (02) is written and locked **before** any wiring is mapped. Pre-registration discipline, the same philosophy as the lane calibration (GB 02 §6): the denominator cannot be moved after the coverage is counted. | An audit against a checklist that was fitted to the implementation measures nothing. |
| D-GA-2 | The audit measures **coverage and honesty of the classic condition set**, never predictive power. No forecasting claim is added, implied or tested for. The standing no-edge record (GOLD_BACKTEST_SPEC §5) stays operative. | The meter's meaning is "conditions today" (D-GB-7). Adding voters is about completeness of the description, not an edge claim. |
| D-GA-3 | The audit is **read-only against the code**: `gold-score.ts`, `GOLD_LANE_VOTERS`, `gold-balance.ts`, the harness tables, the wire — untouched (D-GB-9 lineage). Audit sessions may add read-only scripts and docs only, and deploy nothing. | The audit has no mandate to change the meter. Every change is the fill program's, owner-gated. |
| D-GA-4 | "Ingested but not wired" is a first-class gap class. The repo already holds dozens of gold-classic series as context-only cards (GPR, EBP, OFR FSI, M2, Michigan expectations, term premium, COFER USD share, TIC, …); the audit enumerates them and states, for each, whether the classic set wants it as a voter, as context, or not at all. | The cheapest correct fix is often a promotion, not a new source. And a card that exists but never votes is invisible to the meter — exactly the "missed" the owner fears. |
| D-GA-5 | **Free-first sourcing.** Every gap the fill program addresses must name a free, keyless, licence-clean source (FRED, ECB, IMF, CFTC, Treasury/TIC, WGC, US Mint, SGE, Cleveland Fed, NY Fed, Frankfurter, Bitstamp, …). Paid or ToS-thin sources (LME, CME real-time, LBMA forwards, Bloomberg) are recorded as MISSING-PAID with a free proxy where one exists. The owner's EODHD key is an explicit, flagged exception usable only with the owner's recorded approval. | The owner's instruction: "all needed indicators which are available freely, do not miss anything." The repo's own licence table (docs/insights/LICENCES.md, L0/L1 rules) governs. |
| D-GA-6 | The classification rubric is fixed here, in advance: `COVERED` / `PARTIAL` / `MISSING-FREE` / `MISSING-PAID` / `CONTEXT-ONLY-BY-DESIGN` / `NOT-APPLICABLE`, each with a mandatory reason (01 §6). Every taxonomy row ends with exactly one class; every existing voter maps to exactly one row (or is flagged `UNCLASSICATED` — a defect by definition). | Nothing unclassified, nothing silently waved through. This is the "nothing missed" guarantee, mechanically enforced. |
| D-GA-7 | Half-implementation checks are part of the audit proper, not an appendix: cadence-vs-rule fit (monthly series under a 30-day-move evaluator), history depth for decade-extreme percentiles, the self-flagged thin voters (`cftc-gold-positioning` one stored point, `us-japan-10y-gap` stale most windows, `gold-silver` thin history), sign conventions vs the classic literature (the yield-curve polarity the frozen spec itself calls ambiguous), staleness degradation, and the crowd-min's muting of structurally solo voters. | "Make sure nothing is … half-implemented." A voter that can never fire, or fires on the wrong sign, is worse than a missing one — it manufactures false confidence. |
| D-GA-8 | The program ends with the **fill-program design** (04 §4): phase-by-phase, free-first, every voter-seat change behind the owner's recorded approval, and a pre-registered recalibration (lane rule, thresholds) before any new voter counts — the beam formula and the honesty rules unchanged. | The owner's instruction: "give me a prompt to fill gaps … then design an implementation plan phase by phase." |
| D-GA-9 | Every session ends with the next session's prompt rewritten in `PROMPTS.md`, committed and pushed, and printed for the owner. | The owner's standing instruction, inherited from the GB program's PROMPTS.md convention. |
| D-GA-10 | Delivery discipline per phase: branch `ga/<phase>`, commit and push after every milestone, PR opened early, self-merge when the exit gate holds, CI green verified on main. Docs/scripts-only sessions deploy nothing. | D-GB-10 lineage; the repo's standing constraint set. |

## Open items for the owner

| ID | Question | When it must be answered |
|---|---|---|
| OI-GA-1 | **The taxonomy lock.** GA-S1 delivers 02 as a draft (v1) for the owner's read; the owner amends or locks it. Unlocked, the audit cannot count coverage (D-GA-1). | At GA-S1's end (or in chat before GA-S2 runs) |
| OI-GA-2 | **A fifth lane?** The classic set wants a flows/positioning family (CFTC, ETF flows, central-bank buying, Asian premiums) that today has exactly one voter (`cftc-gold-positioning`) hidden inside market stress, where it can never tip the lane alone. Fold into the 4 lanes, or add a "flows & demand" lane? | GA-S4 proposes; the fill program executes only on the owner's recorded decision |
| OI-GA-3 | **The S6-M6.4 promotion, revisited.** The repo already holds a `dedollar-concentration` shadow lane (`usd-reserve-share` from IMF COFER + `sp500-breadth-ratio`) that "never votes until the S6-M6.4 promotion decision." Is that decision part of the fill program? | GA-S4's proposal |
| OI-GA-4 | **WGC quarterly data** (central-bank purchases, ETF holdings/flows, mine supply): free but quarterly with a lag. Voters, or context-only with promotion criteria? The classic answer is context-first (they set the structural regime, not the month's direction) — but the owner calls it. | GA-S4's proposal |
| OI-GA-5 | **EODHD policy**: the owner's paid key may cleanly cover the paid-only gaps (lease rates/forwards, LME, real-time COMEX). Free-first per D-GA-5; any EODHD use needs the owner's explicit recorded approval per item. | GA-S4's proposal, item by item |
| OI-GA-6 | Any new context line the fill program adds gets fresh EN + fa copy (round 79+ in the persian-copy manifest). | The fill program's sessions |

## Out of scope

Silver (OI-4 of the closed program — its own future decision). The frozen
engine and the recheck/backtest lineage (untouched, D-GA-3). Re-weighting or
any forecasting claim (D-GA-2). The visual design (shipped). The Persian
number/digit rules. Any change to the wire or the UI — the audit ships no
user-visible anything.

## Coordination

This program is docs + read-only research. It shares `AGENTS.md`,
`CHANGELOG.md`, `docs/INDICATORS_AND_DATA_SOURCES.md` and `PROMPTS.md`-style
records with other streams: `git pull --rebase` and re-read before editing a
shared file. Credentials are never pasted into files, commits, logs or tests
(the standing rule since the GB program's PROMPTS.md).
