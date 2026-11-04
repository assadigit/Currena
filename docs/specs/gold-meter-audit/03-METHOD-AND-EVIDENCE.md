# 03. Method and evidence

How the audit is executed. Every claim in the report traces to evidence
produced by these procedures — file-and-line citations, executed scripts, or
API reads. "Probably" is not an evidence class.

## 1. The inventory (GA-S2's first half)

Enumerate, once, completely:

1. **The voters.** The 21 seats of `GOLD_LANE_VOTERS` (id, lane, polarity,
   the evalLeg rule that applies) — transcribed verbatim from `gold-score.ts`
   with line numbers.
2. **The readings.** The full indicator table of
   `docs/INDICATORS_AND_DATA_SOURCES.md` (~90 series): id, source, cadence,
   staleness window, layer, licence row. Plus the live wire's reading set
   (the `/api/insights` payload — the ground truth of what the meter can
   actually see today).
3. **The derived-series recipes.** Every `derived` row (the repo's own
   arithmetic: breakeven-tilt, dollar-basket, gold-silver, fed-expectations,
   us-japan-10y-gap, …) with its exact formula and inputs.
4. **The rungs.** The ingest schedule (04:10 build / 04:20 patch / Saturday /
   first-of-month gates) — which source lands in which rung, hence the
   freshest possible age of each reading.

Output: `evidence/inventory.md` — three tables (voters, readings, rungs)
with a `gold-relevant?` column on the readings table (the mirror sweep,
01 §5.4: every series marked `voter` / `context` / `not-gold` with a
one-word reason).

## 2. The wiring trace (GA-S2's second half)

For **each of the 21 voters**, trace the full chain and record it as a
single row in `evidence/wiring.md`:

```
source endpoint → adapter (file, fn) → rung → reading id → staleness window
→ evalLeg inputs (which history, which percentile basis) → seat (lane, polarity)
→ what the visitor sees (member line / ledger row)
```

Plus the same trace, abbreviated, for every `context`-marked gold-relevant
series (D-GA-4) — ending in the card it renders on, and the explicit note
"never votes."

Evidence rules:

- Cite `path:line` for every hop. If a hop cannot be shown in code, mark the
  row `TRACE-BROKEN` — that is itself a finding (a half-implemented voter).
- The history depth each voter's decade-extreme percentile actually sees:
  read the stored corpus (`packages/insights/fixtures/` archives + KV dump
  scripts) — count the points, per voter, that `evalLeg` can reach today.
  This is where "one stored point: never fires" (the spec's own note on
  `cftc-gold-positioning`) gets its number.
- Do not run the production worker or write KV. Read-only scripts under
  `packages/insights/scripts/` (the `gold-corpus-dump` precedent, GB-S7's
  raw-archive pre-parse rule for the retired-stamp era).

## 3. The coverage matrix (GA-S3's first half)

One row per taxonomy row (02), columns:

| Column | Content |
|---|---|
| Taxonomy id + name | from 02 v1 (the locked version) |
| Current footprint | the reading(s)/voter(s) that touch this indicator — by id, or `none` |
| Class | one of the six (01 §6) |
| Reason | one line, citing wiring.md's row or the absence |
| Fill program? | `yes` (seeds the backlog) / `no` — with the severity components (04 §3) |

Rules: the `Class` cell must satisfy its definition's *necessary and
sufficient* conditions (01 §6) — in particular no `COVERED` without a
wiring citation and a fire-history that shows the voter can actually fire
in the current corpus era; no `NOT-APPLICABLE` where the honest class is
`CONTEXT-ONLY-BY-DESIGN` without a recorded decision.

The header arithmetic (01 §5): `rows classified == taxonomy rows`,
`voters mapped == 21`, stated in the file.

## 4. The half-implementation audit (GA-S3's second half)

For each voter, a defect check with these seven questions — any `yes` is a
finding, worded as a defect with evidence:

| # | Check | Question |
|---|---|---|
| H1 | Cadence fit | Does the series' cadence (monthly CPI/PCE/HICP; weekly STLFSI/CFTC) give `evalLeg`'s 30-day-move rule enough distinct points to express a move, or does the voter sit `steady` across releases by construction? |
| H2 | History depth | Does the decade-extreme percentile have ≥ ~250 points (≈ a year of dailies / a decade of monthlies) behind it? The known suspects: `cftc-gold-positioning`, `gold-silver`, `us-japan-10y-gap`. Quantify. |
| H3 | Sign vs classic | Does the seat's polarity match the classic claim (02)? Known live question: the yield-curve seats (`yield-curve-10y2y`/`10y3m`) — the frozen spec itself says "polarity is ambiguous"; the classic reading (R4) is regime-dependent. |
| H4 | Granularity | Does the voter read the classic object or a proxy of it? (e.g. nominal `us10y`/`us30y` where the classic is the real rate — acceptable as belt-and-braces only if `real-yield-10y` is healthy; the basket vs DXY vs trade-weighted dollar, D1/D2.) |
| H5 | Solo-muting | Is this the only voter of its classic family in its lane — hence structurally unable to tip the lane (min-2 rule)? Expected findings: CFTC in market stress (the F-family's only seat anywhere), and the dollar lane's thin third seat. |
| H6 | Degradation | Does the voter degrade to `unread` honestly on staleness (no fake steady)? The engine guarantees the lane-level behaviour; the check is per-voter input quality. |
| H7 | Copy coherence | Does the member line the visitor sees state the classic claim without overclaiming (the B-12 precedent: never "elevated" beside a Normal card)? |

Output: `evidence/half-implementation.md` — one defect row per `yes`, each
with the H-question, the evidence, and the proposed fill-program treatment
(repair / promote / re-seat / accept-with-note).

## 5. Evidence storage

All under `docs/specs/gold-meter-audit/evidence/`: `inventory.md`,
`wiring.md`, `coverage-matrix.md`, `half-implementation.md`, plus any
read-only scripts' output summaries. Scripts themselves go to
`packages/insights/scripts/` (run-able, cited from the evidence files).
Numbers quoted in PROGRESS.md or the report must name the script that
produced them (01 §4.3).

## 6. What a session may not do

- Edit `gold-score.ts`, `gold-balance.ts`, `GOLD_LANE_VOTERS`, the harness
  tables, any schema, any adapter, any copy dictionary (D-GA-3).
- Deploy anything. Docs + read-only scripts only.
- Classify a taxonomy row without either a wiring citation or a recorded
  absence — and never `NOT-APPLICABLE` for convenience (01 §6).
- Move a number into the report that a script did not print.
