> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/10 — Owner Decisions on the CP-A Strategic Questions (recorded 2026-11-17, session S1b)

The three strategic questions were put to the owner at the end of S1
(`s1/SUMMARY.md` §"Open questions"), scheduled for CP-A. The owner
answered them early, in session S1b. This document records the answers
as program decisions **D6–D8**, their implications, and the honest risk
notes that survive the decisions. It also records the S1b discovery that
changes the Iran-bridge cost estimate (§2). Nothing here authorises
implementation: the standing constraint (research/spec only until the
modularization program closes) remains in force.

## 1. The answers

| # | Question (S1 framing) | Options offered | Owner answer (2026-11-17) |
|---|---|---|---|
| Q1 | Iran bridge (Idea 8, Chain 8) | A) staged bridge card now · B) full local coverage · C) stay global-only | **A — and the card must also show Iranian gold prices: سکه امامی (Seke Emami), سکه یک‌گرمی (1-gram coin), etc.** |
| Q2 | WGC data (Idea 6, Chain 4) | A) owner sends authorisation letter, wait · B) IMF IFS + LBMA fallback · C) link-out only | **Implement now — do not wait for the licence.** |
| Q3 | TA suite (S1/05 §7) | A) keep excluded (positioning bet) · B) add minimal MA/pivot tables | **B — add minimal MA/pivot tables.** |

## 2. D6 — The Iran bridge is GO, staged, with coin prices on the card

**Decision.** Build the staged bridge card (original Option A), expanded
by the owner's amendment: the card carries the live Tehran-market
instrument board — Seke Emami, Seke 1-grami (سکه گرمی), and by
extension the existing instrument family (Bahar Azadi, half, quarter,
18k/24k gold, mesghal, ounce) — alongside the parity decomposition and
the coin premium (حباب).

**The S1b discovery that re-prices the work.** S1/09 rated Idea 8 the
highest-cost idea of the ten ("new domestic data sources — licence,
reliability, rial/toman UX"). That estimate is now known to be wrong in
Currena's favour. The repo **already ingests every instrument the owner
named**:

- `packages/scraper/src/tgju.ts` — TGJU gold symbol table:
  `coin-emami` (`sekee`), `coin-gram` (`gerami`), `coin-bahar`
  (`sekeb`), `coin-half` (`nim`), `coin-quarter` (`rob`), `gold-18k`
  (`geram18`), `gold-24k` (`geram24`), `gold-used`
  (`gold_mini_size`), `gold-ounce` (`ons`, USD) — plus
  `price_dollar_rl` (USD/IRR free-market) as the converter's base.
- Rial→toman ÷10 conversion is already the app's canonical rule
  (owner request 2026-09-19, AGENTS.md §6).
- The gold quotes ride the KV snapshot (`snapshot.gold`,
  `GoldQuoteSchema`) end-to-end and are already rendered on
  `/live-rates` and `/converter` by `LedGoldBoard.tsx`.
- Live feed re-verified 2026-11-17 (`call1.tgju.org/ajax.json`,
  1052 symbols, all nine gold symbols present) — see `s1/11` §2.

So the bridge is **assembly + one derived analytics family (the premium)
+ interpretation**, not new data plumbing. What does *not* exist yet:
gold-symbol price **history** (only current snapshots are stored), the
premium **computation**, and the gold-page **presentation** — all
specified in `s1/11`.

**What this does not change.** The identity question (S1/04: "a
positioning decision masquerading as a feature") is now answered by the
owner: global-first with a local bridge. The editorial sensitivity
(premium commentary touches Iranian household finance) stays a design
constraint, handled in `s1/11` §8 and S6/S7.

## 3. D7 — WGC data is implementable now (owner-accepted)

**Decision.** Do not wait for the WGC authorisation letter. Implement
the Chain-4 demand stack using WGC data, with attribution.

**What the owner is accepting (the honest note that survives).** The
repo's own licence ladder (`docs/SOURCES.md`) classifies WGC as **L3 —
prior written authorisation required; never fetched**. The owner has the
right to accept that risk, and per AGENTS.md §0 the owner's explicit
instruction governs. The program records WGC as **L2-owner-accepted
(2026-11-17): fetch allowed, attribution required, letter still
recommended in parallel** (it is free to send and converts the residual
risk to zero if granted; it can also unlock the deeper Goldhub
datasets and press access).

**Mechanical reality found in S1b (probed 2026-11-17).** WGC has no
public API; the Goldhub dataset pages are public but the XLSX files are
behind a free-account login wall (direct download returns the login
page / 403 — verified). And crucially: the central-bank reserve tables
WGC publishes (`World_official_gold_holdings_as_of_Nov2026_IFS.xlsx`,
`Changes_latest_as_of_Nov2026_IFS.xlsx`) are **IFS-derived** — the same
underlying IMF data Currena already licenses directly at L1. Full probe
results and the two-tier build in `s1/12`.

**Recommended reading of D7.** Tier 1 of the CB-demand tracker is
licence-clean **today** via IMF IFS (no gate at all); Tier 2 adds the
WGC-unique datasets (quarterly demand-stack tables, daily ETF flows)
through the owner's authenticated download. This satisfies "implement
now" without pretending the login wall doesn't exist.

## 4. D8 — Minimal TA suite is GO (a reversal of the S1 recommendation)

**Decision.** Add the minimal TA layer: moving averages + pivot tables.
This reverses S1/05 §7 (which recommended staying TA-free as a
positioning bet). The owner's call; the program's job is now to make
the TA layer **consistent with the page's descriptive identity** rather
than argue against it.

**Scope guard (what "minimal" means — binding for S6/S8).**
- IN: SMA 20/50/100/200 on XAUUSD daily; distance-from-200DMA as a
  decile statistic; golden/death crosses as *dated event annotations*;
  classic daily + weekly pivot levels (P, R1–R3, S1–S3) as a reference
  table.
- OUT (unless new owner instruction or measured user demand): RSI,
  MACD, Bollinger, Ichimoku, pivot variants, any signal language, any
  prediction framing.
- No existing MA/pivot code exists in the repo (verified S1b) — this is
  new derived-series work of low complexity over data already present.

Full spec prep in `s1/13`.

## 5. Program-consequence table

| Area | What D6–D8 change |
|---|---|
| S2 (deep audit, next) | Audits with the integration lens: where the bridge card, TA block, and CB-demand section integrate into the current page + the modularized `features/gold/` tree. Revised prompt in `s1/SUMMARY.md`. |
| S4 (data verification) | New verification items: TGJU unit conventions (mesghal vs geram24 reconciliation puzzle, `s1/11` §4), CBI mint specs for coin pure-gold content, WGC attribution text + ToS wording, WGC authenticated-download workflow, IMF IFS monthly reserves series IDs for the top CB buyers. |
| S5 (SWOT + master list) | The three features move from "decision-gated" to "decided — spec prep exists" (`s1/11`–`s1/13`). CP-A reduces to SWOT review + scope lock. |
| S6 (IA) | IA must place three new elements: the Iran-bridge section, the TA reference block, the CB-demand section. |
| S8 (roadmap) | The two "strategic prizes" and the TA layer enter the P1/P2 candidate pool with re-priced (lower) complexity. |
| Bookkeeping | `docs/DECISIONS.md` (shared file, modularization-owned) gets D6–D8 only at the end-of-program reconciliation commit, per D2. |

## 6. Standing constraints reaffirmed (owner, S1b)

Research and spec work only. No code, no `main`, no shared-bookkeeping
edits. Implementation of these findings begins only after the
modularization program completes and the owner lifts the constraint.
Every market number in the S1b docs is a dated observation from the
probe session (2026-11-17) or a cited repo file — never invented.
