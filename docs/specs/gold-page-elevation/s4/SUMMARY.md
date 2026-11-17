> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S4 — Session Summary (Gold Page Elevation)

**Session date:** 2026-11-17 (~05:00–12:00 UTC) · **Branch:**
`docs/gold-page-elevation` · **Status:** Done in code (docs), not
deployed (research program; standing constraint: no interference with
the modularization program on `main`). Credentials used, not stored
(Cloudflare token for the temp probe worker — deleted after the read;
EODHD key from the environment only; GitHub token for pushes).

## What was delivered

1. `s4/01-wgc-goldhub-benchmark.md` (M1) — the 14-dataset Goldhub
   catalog with WGC's own per-dataset disclosure blocks (cadence,
   units, methodology); the login wall re-verified with its exact
   signature (**DU1** — and it covers methodology PDFs as well as
   data); the terms **verbatim** (the accreditation clause,
   Proprietary Rights, the IBA/ICE clause; the contact decodes to
   info@gold.org); the **data-drop vs authenticated-session**
   comparison with the binding recommendation (data-drop); the GRAM
   5-bucket ↔ Currena 5-lane mapping with the F1 honesty rule; the
   GDT XLSX structure explicitly blocked-with-reason (first-drop
   task); the Q3-2026 GDT article's public headline numbers recorded.
2. `s4/02-lbma-kitco-tradingeconomics-benchmark.md` (M2) — LBMA auction
   timing + the **midnight-delay free tier verbatim**; the
   historical-tables move (MyLBMA portal, IBA licence); the **vault
   XLSX downloaded and parsed** (124 months, arithmetic reproduces the
   printed 9,850 t / +0.29% / 28,889 t exactly); the clearing XLSX
   (360 months); the **forecast survey + accuracy retrospective**
   (2010–2026 series extracted: consensus under-forecast gold in 10 of
   16 years, mean miss −2.1%, mean-abs 8.1%, 2025 −20.2%); Kitco's
   5-driver explainer quoted verbatim + the KGX methodology + the
   unit-aware header + Turning Points; TE's daily narrative verbatim
   and the forecast-as-headline ANTI-pattern verbatim.
3. `s4/03-persian-ecosystem-map.md` (M3) — **the mesghal puzzle
   RESOLVED** (mesghal = geram24 × 3.2492 — the آبشده 4.6083 g × ~705
   convention; the naïve reading overstates by 41.8%); the
   rial/toman duality re-verified across TGJU/news chains; **the
   discovery that TGJU publishes حباب as live symbols** (an s1/11 §1
   correction — with the three-numbers-in-one-hour convention
   divergence documented); the EMA/SMA granularity (5/10/20/30/50/100/
   200) and the **5-method pivot table** (the D8 wording source + the
   anti-zoo evidence); the profile-history tables + TGJU's terms
   sentence verbatim; **persianapi.com priced** (the sanctioned route
   B); the news/retail competitive frame live.
4. `s4/04-data-source-reality-check.md` (M4) — the venue map (14
   venues probed from the planning machine AND from real Worker
   egress via the temp-probe pattern, worker deleted); **all 8
   mandatory items resolved or blocked-with-reason** (§2a–§2h);
   **23 candidates reality-checked** (16 fetch-verified live; 4
   gated-by-design; 2 venue-blocked rejections; 1 policy adoption);
   the CPI shutdown-gap **written recommendation** (§4); the
   prediction-market licence analysis with Polymarket's ToS verbatim.
5. `s4/05-adopt-reject-list.md` (M5) — the consolidated verdict
   tables per feature family (source, licence, cost, cadence, cache
   strategy, fetch-verified, ADOPT/DEFER/REJECT with reasons) — the
   direct input to S5's SWOT and S8's data-source mapping table.
6. This summary + the S5 prompt.

## Key findings in one paragraph

The feasibility layer came back **cleaner than the S1 drafts
assumed, with two sharp corrections**: the CB-demand Tier-1 is not
"IFS" at all — the IMF's modern SDMX 3.0 API has **no IFS dataflow**;
the gold-reserves series live in **IL (`RGV_REVS`, 188 countries, USA
history to 1956) and IRFCL (`IRFCL56V_FTO`, the reserves template)**,
both keyless, L1, monthly, current to Oct 2026, Worker-egress
verified, with USA's 8,133.5 t reproducing exactly — and the parse
surfaced the adapter's real traps (Brazil/Angola scale outliers; the
G163 euro-area aggregate that must not be summed; no world total).
The bridge's two open specs closed: **CBI's own page pins the
900-in-1000 coin family verbatim** (8.136 g full coin), and the
gerami resolves — by triangulation across CBI's own family table,
the EN-Wikipedia spec table, and both TGJU's and the Union's حباب
arithmetic — as the **1/8-Bahar size (~1.01 g total, 900 fineness,
~0.909 g pure)**, falsifying s1/11's "1.0149 g at 999.9" reading and
recomputing the gerami premium from +5.7% to **+18.6%** (the premium
ladder becomes monotone: full +3.3% < half +8.5% < quarter +18.1% ≈
gerami +18.6%). And the sharpest competitive correction: **TGJU (and
the news chains) already publish حباب values** — so the bridge's
prize is not "computing the premium" but **the documented,
reproducible premium** in an ecosystem where the same word printed
three different numbers within one hour (7.88M / 8.08M / 5.99M toman).
Around these: WGC Tier-2 is a catalogued data-drop with verbatim
attribution terms; LBMA vault/clearing are free parsed XLSX workbooks
with exact arithmetic; Treasury-direct is verified fresher than FRED
from both venues; Kalshi/Polymarket are keyless-readable with the ToS
postures read (one wording pending); and the program's adopt set
contains **zero new paid feeds**.

## Decisions taken in S4 (for the program record; DECISIONS.md at reconciliation)

- **S4-D1 (the CPI shutdown-gap policy recommendation):** adopt the
  adjacent-months-average base for gap-affected YoY months, computed
  at read time, labelled at point of use («مبنا: میانگین دو ماه
  مجاور»), auto-expiring when the base month exists again; stored
  levels stay pure. Rejected alternatives recorded with reasons
  (S4/04 §4). For the S8 spec.
- **S4-D2 (the WGC Tier-2 access pattern):** the **data-drop** is the
  binding recommendation (no stored credentials; auditability; the
  terms' anti-scrape clause makes session-replay the worst posture);
  the release-day calendar is documented; the letter to info@gold.org
  remains the parallel owner action.
- **S4-D3 (the s1/11 corrections, carried to S5/S6/S7):** (a) the
  حباب differentiation claim narrows to "documented, reproducible"
  (the raw value is published by incumbents); (b) the gerami spec
  table is corrected (≈1.01 g / 0.900 / ~0.909 g pure) and the
  premium ladder recomputed; (c) the mesghal convention documented
  (آبشده 705) — the premium engine may include mesghal with the
  convention stated on the card.
- **S4-D4 (the Tier-1 adapter rules, for the S8 spec):** IL primary +
  IRFCL complement (or per-country merge); tonnes = ozt ×
  31.1034768/1e6; fail-closed band check (drop outlier rows);
  aggregate-exclusion from sums (G163); the "reported-world" total
  (31,365 t over 86 reporters) labelled as such — never claimed as
  the world total.
- **S4-D5 (Treasury-direct):** verified adoptable from both venues
  (+2 trading days fresher than FRED's mirror, same licence class);
  the switch is priced for the S8 roadmap; FRED stays as fallback
  and cross-check leg.
- **Carried, cited, not re-litigated:** S2-D1 (the fix-first list
  GPE-S2-01/02/09), S2-D4 (the CFTC + GPR pipeline P0s —
  modularization-closeout window), S3-D1 (SA 41.5 vs C 39.5; the
  explanation layer is co-equal Core in the first wave), S3-D3a–d
  (all four resolved this session: Treasury ✓, prediction markets ✓,
  the series-named-at-point-of-use rule — extended to the CPI base
  label, the COT convention choice → S6/S8 spec).

## Open questions for the owner (non-blocking for S5)

1. **The WGC authorisation letter** (the unchanged parallel action —
   s1/12 §2): now with the exact address (info@gold.org), the
   attribution practice, and the datasets to cite. A) send it (the
   program's standing recommendation), B) skip. *Recommend A.*
2. **Two build-time reads that this environment could not perform**
   (both one-page fetches from a normal browser): the Kalshi
   Developer Agreement's data-reuse wording (kalshi.com/developer-agreement
   — the site rate-limited this sandbox), and the CBI gerami
   press-release spec pin (cbi.ir's coin pages are WAF-blocked here;
   the 0.90–0.92 g pure band is established by triangulation). The
   owner can do both in five minutes, or the first implementation
   session does them. *Recommend: the implementation session, with
   the band as the fallback.*
3. **Nothing else is owner-gated:** every Core/Supporting candidate
   now has a verified data path or a recorded blocker.

## Done-criteria check (this session)

All four benchmark families verified live with named sources and
dates ✅ (WGC: S4/01; LBMA+Kitco+TE: S4/02; Persian ecosystem:
S4/03) · every mandatory verification item resolved or explicitly
blocked-with-reason ✅ (8/8 — S4/04 §2; the two sub-blocks with
reasons: the GDT XLSX structure (login wall, by design — first-drop
task) and the Kalshi developer-agreement wording (429 venue state);
the FRED long-run supplement deferred-with-reason (venue down)) ·
≥15 candidate indicators reality-checked with verdicts ✅ (23 —
S4/04 §5) · the adopt/reject table complete ✅ (S4/05) · all
committed and pushed ✅ · S5 prompt written ✅ (below).

## Known problems carried forward (cite, do not re-litigate)

- The fix-first three (GPE-S2-01/-02/-09) and the two operational P0s
  (CFTC Saturday gate; GPR re-fetch) — owned by the
  modularization-closeout window per S2-D4.
- FRED's transient unreachability from the planning machine this
  session (+ a 520 from Worker egress) — a venue note to re-check at
  build time; production FRED rides the Node ingest venue.
- The AGENTS.md drift items (GPE-S2-28/29) — end-of-program
  reconciliation only.

## Next-session prompt (S5)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S5 of the Gold Page Elevation (GPE) program on
branch docs/gold-page-elevation. Read, in order: AGENTS.md,
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md (the program plan and
its rules, decisions D1–D8),
docs/specs/gold-page-elevation/s1/SUMMARY.md (S1 + the S1b addendum),
docs/specs/gold-page-elevation/s2/SUMMARY.md (S2),
docs/specs/gold-page-elevation/s3/SUMMARY.md (S3),
docs/specs/gold-page-elevation/s4/SUMMARY.md (S4 — this session's
predecessor), then the S4 deliverables you need: s4/04 (the data-source
reality check — the feasibility layer) and s4/05 (the adopt/reject
list — the verdict tables), plus s4/01 §2 (the GRAM/lane mapping for
the narrative), s4/02 §2–§3 (the adoptable patterns vs the TE
anti-pattern) and s4/03 §1c (the حباب reproducibility gap — the
bridge's sharpened differentiation claim). Then the two audits' verdict
inputs: docs/audits/2026-11-17-gold-page-deep-audit.md (§4 scores,
the fix-first list §2, the integration map §5) and
docs/audits/2026-11-17-gold-head-to-head-matrix.md (§2 the feature
matrix, §5 the SA-41.5-vs-C-39.5 verdict — S6's governing input).
Then s1/14 (the F1–F21 first-pass tier draft this session finalises)
and s1/11 §8–§9, s1/12 §3–§4, s1/13 §6 (the phased-build proposals the
roadmap inherits).

Standing constraints (owner-reaffirmed S1b): research and spec
preparation ONLY. Do NOT touch main, any code, or the shared
bookkeeping files (docs/HANDOFF.md, CHANGELOG.md, docs/DECISIONS.md) —
the modularization program owns them. Do not implement anything —
implementation waits until the modularization program completes and
the owner lifts the constraint. Work only on docs/gold-page-elevation.
Commit and push after each milestone. Credentials: use any supplied
tokens from the environment only, never in tracked files; say
"credentials used, not stored".

S5 objective: the SWOT (page + competitive position) + the
missing-indicator master list FINALISATION (Core / Supporting /
Advanced / Excluded) — the checkpoint-CP-A deliverables the owner
reviews for scope lock.

M1 — Currena gold-page SWOT: Strengths (from the S2 audit's verified
strengths + the S4 feasibility layer: the zero-new-paid-feeds adopt
set, the IL/IRFCL Tier-1 at L1, the documented-حباب differentiation),
Weaknesses (the S2 issue log's HIGH/MED items — the fix-first three
and the explanation-layer gaps the S3 verdict quantified), Opportunities
(the S3 head-to-head's five SA-winning dimensions, each now backed by
a verified data path or pattern from S4/02 and S4/04–05), Threats
(competitor freshness GPE-S3-24, TGJU's reach numbers from S4/03 §1f,
the mislabel trio's public-gap conversion risk from the S3 §5
verdict). Every cell cites its evidence (issue IDs, S4 section refs).

M2 — The master list finalisation: take s1/14's F1–F21 draft and
finalise the Core/Supporting/Advanced/Excluded tiers using: (a) the
S3 matrix's feature table (what SA has/lacks) and verdict; (b) the
S4/05 adopt/reject verdicts (feasibility now verified, not assumed);
(c) the S4 corrections (the حباب differentiation claim, the gerami
ladder, the GRAM/lane mapping, the CPI gap policy); (d) S3-D1's rule
that the explanation layer is co-equal Core. Record every tier
change from the s1/14 draft with its reason. The list feeds CP-A.

M3 — The checkpoint report: a one-screen CP-A brief for the owner —
the SWOT verdict, the finalised tier list, the build-wave proposal
for S8 to sequence (fix-first three → explanation+prizes wave →
chart/TA wave → Supporting → Advanced), the residual owner decisions
(the letter; the two build-time reads; the Treasury switch), and the
program's remaining path to Phase B (S6–S7 design, CP-B).

Write the deliverables to docs/specs/gold-page-elevation/s5/ (SWOT
doc + finalised master list + CP-A brief; exact filenames your call,
keep AGENTS.md §3 format), commit, push, then write
docs/specs/gold-page-elevation/s5/SUMMARY.md with findings, decisions,
open questions, and the S6 next-session prompt (the Phase B start:
information architecture for the elevated page — the section map,
density tiers, placement of the three decided features at the S2
audit's measured slots, copy principles, mobile behaviour; the
modularized-tree inventory from the S2 audit §6 is its code map).

Done-criteria: SWOT complete with per-cell evidence citations; the
F1–F21(+ any S4-added candidates) tier list finalised with per-change
reasons; the CP-A brief owner-readable; all committed and pushed; S6
prompt written. Known context to carry — cite, do not re-litigate:
S2's fix-first list (GPE-S2-01/02/09) and the two operational P0s
(CFTC + GPR pipeline misses); S3's verdict (SA 41.5 vs C 39.5 raw, S6
must treat the explanation layer as co-equal Core); S4's decisions
S4-D1..D5 and its two corrections to s1/11; the two build-time reads
pending (Kalshi developer-agreement wording; the CBI gerami pin).
```
