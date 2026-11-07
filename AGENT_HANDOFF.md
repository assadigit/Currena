# AGENT_HANDOFF — Currena: the gold meter gap-fill program (P0–P4 DELIVERED WHOLE — GF-S11 landed the round-2 decisions' execution + the nine P4 context cards, live-verified; GF-S12 = P5 the acceptance walk + the program's close)

> The owner's **gold meter audit** program (`docs/specs/gold-meter-audit/`)
> is **CLOSED — COMPLETE 2026-11-05 at GA-S4**: A1–A4 whole (the taxonomy
> LOCKED v1.2 = 86 rows · the inventory + wiring pack · the coverage
> matrix + the 18 half-implementation defects · the report + the
> fill-program design). The audit's verdict:
> `docs/insights/GOLD-METER-AUDIT-REPORT.md` — the owner-readable record
> of what the meter sees and what it does not. The successor — the
> **gold meter gap-fill program** (owner-gated; its home
> `docs/specs/gold-meter-gapfill/`) — executes the fills phase by phase
> on the owner's recorded go. **The owner's answers A–K (round 1, GF-S7)
> + the round-2 answers (2026-11-07) are RECORDED — the answer sheets:
> the README's decision tables, with the standing delegation "Generally,
> I trust your decisions. go full autonomously."** GF-P1/P2/P3/P4
> delivered whole. The predecessor gold balance consolidation is
> COMPLETE, LIVE and CLOSED (2026-11-04, GB-S7): the consolidated lane
> balance is THE gold card for every visitor on currena.ir. Never record
> credentials here.

## A. What comes next

The **GF-S12 session** — P5, the dedicated close: **the acceptance walk
+ the program's close** (the owner's recorded round-2 answer). The full
acceptance table over the program's own spec (every phase's gate
re-verified from runs) + the production matrix (the live meter state
over the fresh public snapshot) + the open questions PRINTED for the
owner's final round — **(a)** the Cleveland L2 class (the I9
cpi-nowcast/cpi-surprise cards serve PRIVATE; accept for public display
or keep private) · **(b)** the X5 Yahoo class (keep private — printed
for completeness) · **(c)** the WGC reply (if the owner has sent the
draft + a reply arrived, record + unlock per its terms; else the family
stays blocked) · **(d)** the program's acceptance itself (the meter's
final shape, with the recorded-open items honestly listed: F7 MCX · F12
fail-closed · the WGC family pending · the promotion criteria recorded
in each context card's comments). Its kickoff prompt is at the foot of
`docs/specs/gold-meter-gapfill/PROMPTS.md` (the D-GA-9 convention) —
paste it into a fresh session at the repo root.

| Program | Milestone | Branch |
|---|---|---|
| gold meter audit — **CLOSED (2026-11-05)** | GA-S1 (the taxonomy, LOCKED v1.2 = 86) · GA-S2 + completion (the inventory + wiring pack) · GA-S3 (the matrix + the defects) · GA-S4 (the report + the fill design) | `ga/s1-taxonomy` … `ga/s4-report` — all merged |
| gold meter gap-fill — **P0–P4 DELIVERED WHOLE (GF-S11, 2026-11-07); GF-S12 = P5 the acceptance walk + the close NEXT** | GF-S1 delivered P0 (the calibration + the harness tables). GF-S2..GF-S6 re-issued the decision list (the lock-fallback ×5). GF-S7 recorded the owner's answers A–K + executed GF-P1. GF-S8 executed GF-P2 (the 32-seat table + the flows lane + STRONG 4-of-5 + the N-1 v1.2 amendment). GF-S9 executed GF-P3 (the four FRED voters → 36). GF-S10 executed the REMAINDER (I4 seated → **GOLD_LANE_VOTERS 37 (7/7/11/10/2)** · the real-curve + Shanghai-premium context cards · the P3 deploy live-verified · the gf-p4-verify twin). **GF-S11 executed the round-2 decisions + P4 whole (the recovery landing of an interrupted session — every claim re-verified from the recovery's own runs)**: the **(e) SGE display flip LIVE** (the Shanghai premium card READABLE PUBLICLY FOR THE FIRST TIME: −0.73% @ 2026-11-06, pct10y 39% — the L2 owner-acceptance in the register, the registry regenerated, the T-15 gate green) · the **I9 accumulator** (the Cleveland nowcast adapter + the cpi-nowcast/cpi-surprise cards — PRIVATE per the Bank's unquoted-reuse terms, the GF-S12 question; the standing start live: 0 surprises honestly) · the **(f) WGC authorisation draft** (`evidence/wgc-authorisation-draft-2026-11-07.md` — printed for the owner's review + send; the family stays blocked, no fetch wired) · **P4's nine cards live** (I10 real-gold-price $1,243 · X7 gold-platinum 2.64 · I11 global-liquidity $21.55tn · G3 debt-to-gdp 121.19 · F16 swiss-gold-flow 227.9 t · F15 sge-gold-withdrawals 92.08 t · X5 gold-equities-ratio 0.5066 PRIVATE · R11 rstar-us 1.01 · F12 etf-short-interest fail-closed awaiting data) · **the recovery's four repairs** (the I11 ECB-leg division · the F15 extractor + its 12 test suites · the I11 display-verdict trail · the premium's three-layer venue drift — each with regression pins) · tests **14,620** · copy round 82 (121 strings, clean) · gates ALL GREEN · the worker deployed live-verified (version **8f9e521e**; the fresh public snapshot 177 readings: for 2 · against 1 · neutral 2 · unread 0, 5 of 5 lanes readable) → GF-S12: P5 the acceptance walk + the program's close | `gf/p0-recalibration` (merged) · `gf/s2-reissue`…`gf/s6-reissue` (merged) · `gf/p1-repairs` (merged) · `gf/p2-promotions` (merged) · `gf/p3-new-sources` (merged) · `gf/p3-remainder-and-p4` (merged at GF-S10) · `gf/s11-decisions-and-p4` (GF-S11) → `gf/s12-acceptance-close` next |

## B. The standing rules (read before any session)

1. **The per-seat approval rule** (D-GB-9 as amended at GB-S7, inherited
   as D-GF-1): every `gold-score.ts` / `GOLD_LANE_VOTERS` edit requires
   the owner's RECORDED approval **per seat change** — the audit
   report's §4 row is the justification attached to each approval.
   **NEVER seat a sign silently.** GF-S11 seated NOTHING (no seat change
   was approved anywhere in the round-2 answers); GF-S12 is P5 — it
   verifies, never seats.
2. **No forecasting claim, ever** (D-GA-2): the fill program adds
   coverage of the classic condition set, nothing more. The no-edge
   record (GOLD_BACKTEST_SPEC §5) stands; copy says "conditions".
3. **The beam formula, the honesty rules and the no-edge record are
   inherited unchanged**; the min-2 lane rule is re-derived, not
   assumed.
4. **Free-first sourcing** (D-GA-5): every backlog source named by the
   audit is free/keyless/licence-clean; EODHD only with the owner's
   recorded per-item approval (none proposed — zero calls to date).
5. **Every number from a run; every recommendation re-checked against
   code before it is written down** (the owner's 2026-10-31
   instruction). **The GF-S11 proof: the live verification caught FOUR
   defects the committed "green gates" carried** — the gates being
   green was never the evidence; the live venue run was.
6. **Delivery discipline** (D-GA-10 lineage): branch, PR early,
   gates/CI green, self-merge on the exit gate, CI green verified on
   main. `git pull --rebase` before touching shared files (CHANGELOG,
   AGENTS.md, the indicator tables). Deploy only when the built worker
   changes.
7. **End every session with the next prompt** (D-GA-9): rewritten in
   PROMPTS.md, committed, pushed, and printed in the final message —
   never end a session without one (GF-S12's sits at PROMPTS.md's foot).

## C. The state of the world (as the GF-S11 close leaves it, 2026-11-07)

- **THE AUDIT'S VERDICT** (`docs/insights/GOLD-METER-AUDIT-REPORT.md`,
  restated to the v1.2 denominator): rows classified = 86 · voters
  mapped, ALL CLASSIFIED · defects = 18 (D-1…D-18; GF-P1 repaired
  D-2/3/4/5/6/7/8/18; GF-P2 repaired D-14 + D-17; GF-P3/GF-S10 filled
  the D-11/D-12 ride — the real curve EXISTS as context, the owner
  keeping it so per round-2 (a)); the defects remaining: D-9/D-10/D-13/
  D-15/D-16 accept-with-note (stand).
- **THE ENGINE (as deployed)**: the **37-voter five-lane table**
  (borrowing costs 7 · dollar 7 · market stress 11 · inflation 10 ·
  flows 2 — the measured POST-P4-5LANE composition), `evalLeg`, MIN2,
  the D-18 input-presence rule, GOLD_LANE_STRONG = 4-of-5. **GF-S11
  changed NOT ONE SEAT** (none was approved). Deployed worker
  **8f9e521e-281c-4fe6-8533-a9a60840f223** (superseding this session's
  own first deploy cde1f1d7 and GF-S10's 4b8dcfc7). The live
  verification over the fresh public snapshot (generatedAt
  2026-11-07T02:40:06Z, 177 readings): for 2 · against 1 · neutral 2 ·
  unread 0 — 5 of 5 lanes readable.
- **THE (e) FLIP IS LIVE**: the `shanghai-gold-premium` card READS
  PUBLICLY (−0.73% @ 2026-11-06, pct10y 39% — the stored 488-point
  history under it); the L2 owner-acceptance recorded in the register
  (2026-11-07, the Yahoo/Shiller precedent).
- **THE CONTEXT REGISTER**: 184 ids · 130 rule:info cards · the
  public-mode hidden set 7 (cpi-nowcast · cpi-surprise ·
  etf-short-interest · gold-equities-ratio · official-gold-demand ·
  wgc-cb-demand · wgc-etf-holdings) · the M-2 bounded-history list 45 ·
  about-sources fred 57/57 + derived 28/28.
- **THE I9 STANDING START**: the Cleveland nowcasts accumulate (2026-10:
  +0.24% · 2026-11: +0.19% MoM); 0 surprises derived (the honest state —
  the first lands when the December CPI print closes the 2026-11
  nowcast); the cards serve PRIVATE (the Bank's terms quote no
  affirmative reuse grant — the GF-S12 question (a)).
- **THE WGC FAMILY STAYS BLOCKED**: the authorisation draft sits at
  `evidence/wgc-authorisation-draft-2026-11-07.md` (printed in the
  GF-S11 final message for the owner's review + send to
  info@gold.org); F3/F4/F13 + F5/F11/F13/H1–H4 stay 'awaiting data'
  until a recorded reply; no fetch is wired.
- **THE D-GF-6 PINS STAND**: the committed calibration report
  (`evidence/gf-p0-calibration-2026-11-05.md`) reproduces byte-for-byte;
  `evidence/gf-p4-verify-2026-11-06.md` remains the live pin
  (production ≡ POST-P4-5LANE in ALL 2512 windows — no voter moved at
  GF-S11, so the pin stands untouched). **The GF-S11 session evidence:
  `evidence/gf-s11-verify-2026-11-07.md`** (the venue-verification run
  + the four repairs' record + the live acceptance check).
- **The taxonomy is LOCKED** (02 v1.2 = 86 rows; additions remain
  owner-recorded amendments with dates only, D-GA-1).
- Tests **14,620** (insights 1,329); copy round **82** (121 strings,
  clean); gates ALL GREEN; main at the GF-S11 merge (PR #44).

## D. If a session is interrupted

Commit and push the branch anyway (nothing is lost if the session dies);
the next session `git pull --rebase`s and re-reads the authoritative
records — the audit program's `docs/specs/gold-meter-audit/PROGRESS.md`
(CLOSED) and the fill program's `docs/specs/gold-meter-gapfill/
PROGRESS.md` (authoritative for the fill). If PROMPTS.md's latest prompt
disagrees with PROGRESS.md, PROGRESS.md wins and the prompt gets
rewritten. The GF-P0 calibration's runnable record:
`packages/insights/scripts/gf-p0-record-candidates.ts` +
`gf-p0-calibration.ts` over the committed fixtures — re-running
reproduces the committed report byte-for-byte (re-verified POST-P1/P2/
P3/P4). The verify-twin lineage: `scripts/gf-p1-verify.ts` →
`gf-p2-verify.ts` → `gf-p3-verify.ts` → `gf-p4-verify.ts` (the live
pin); the GF-S11 venue-verification script: `gf-s11-verify.ts` (manual,
never in the suite); the backfill lineage: `gf-p1-backfill.ts` →
`gf-p2-backfill.ts` → `gf-p4-backfill.ts`; the credentials live in the
environment only, never in the repo. **The GF-S11 record is itself the
recovery discipline's proof, twice over**: the interrupted session's
commits carried four defects its "green gates" never saw (a broken
extractor, a wrong FX conversion, a stale comment, a dead derivation +
a missing pass-through + a missing merge) — the recovery's own live
runs caught all four, repaired each with its reason recorded in the
code, and pinned each with regression tests before any final claim was
written down.
