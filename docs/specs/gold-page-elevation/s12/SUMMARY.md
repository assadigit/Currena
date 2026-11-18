# S12 — Session Summary (Gold Page Elevation)

**Session:** S12 of the Gold Page Elevation (GPE) program — the THIRD
Phase-D implementation session: **P1-c, the prizes (Bridge-1 + the
CB-demand section, wave 1's second half)**. **Date:** 2026-11-18
(~16:30–20:0x UTC). **Branch:** `gold-elevation/p1c-prizes` (off the
S11 close `aae44dda` — the bookkeeping commit on top of `6a3d55de`,
from which production `23ce6b06` was built; git `main` still sits at
the R-5 close `19131b0`). **Status: DONE AND VERIFIED LIVE** —
production currena-api `49ae8ce7` @ 100% (created
2026-11-18T18:51:04Z) + the gold-cb KV seed landed the same evening.

The gate state at session start (verified, not assumed): the CP-C lock
COMPLETE; the Phase-D gate OPEN; P1-a DELIVERED + DEPLOYED +
LIVE-VERIFIED (`f0844e59`); P1-b DELIVERED + DEPLOYED + LIVE-VERIFIED
(`23ce6b06` @ 100%, re-confirmed via the live API reads).

## What was delivered

**M1 — Citation re-verification + the three build-time checks** (commit
`0217a09d`; `s12/M1-CITATION-AND-CHECKS.md`). Every file path the rows
R13–R17 cite re-verified read-only — zero material drift (one expected
post-modularization address change recorded: LedGoldBoard now lives at
`features-tools/live-rates/`). The three checks, honestly recorded:
(a) **the R07 Treasury-rung outcome — the rung had NOT fired at this
session's start** (the S11 close placed it at 04:10 UTC Nov 19; this
session started ~16:31 UTC Nov 18, ~11.6 h before): the live readings
still carry FRED provenance (us10y 5.12 @ 2026-11-16 "FRED (DGS10)"
verified via the live API; the status blob healthy, failedSources
empty) — the flip rides the overnight rung and **S13's M1 re-verifies
it** (recorded as S12-D4; this session's deploy carries the same R07
code, so nothing here blocks or alters the flip). (b) **the R15
drop-calendar check → R15 SLIPS TO P2 gracefully** (no `data/wgc/`
path, no XLSX, no owner notice — the fold record §0.2 rule; the
licence wall's WGC CB line stays until Tier-2 lands). (c) **the CBI
gerami re-attempt → the default band 0.90–0.92 g pure stands**
(`cbi.ir/coin/` still WAF-blocked «درخواست رد شد»; the 5953 page
serves but carries no gerami spec; a further pin rides Bridge-2/R30).
The session also verified its rows' data planes live: the TGJU ajax
(all 10 bridge symbols incl. **mesghal** + the per-symbol `ts`
timestamps; the premium arithmetic reconciling on the day's snapshot;
the آبشده convention exact at 3.248 g-equivalent) and the IMF SDMX
dataflows (USA 261,498,926.24 ozt = 8,133.5 t exact @ 2026-M09; the
RUS IL/IRFCL complement; **the IRFCL value legs probed for the share
column — and the US book-value trap found**: USA's reported gold
"value" is the statutory $42.22/oz, so a naive gold÷total share would
print 4.4% for the largest holder).

**M2 — the rows, exactly R13 + R14 + R16 + R17 (R15 slipped):**

- **R13 · F3a Bridge-1** (the Iran bridge, Zone F — between the
  explanation band and Signals; `#gold-zone-f`). The shared data plane
  gained one symbol (`gold-mesghal` joins `GoldId` + the scraper's
  TGJU_GOLD_SYMBOLS; the LED board's own 9-row list unchanged — one
  plane, two presentations) + the per-symbol `marketAt` timestamp
  (TGJU's own `ts`, ISO-normalized; both live-observed print shapes).
  The pure engine `domains/gold/coin-premium.ts` (the C2 computation
  over ONE coherent snapshot: `tomanPerOunce = ounce × free-dollar`
  named; intrinsic/premium/pct per instrument; the CBI-primary
  constants table with the gerami BAND at its midpoint + the آبشده
  convention; fail-closed on any missing leg). The component
  `GoldIranBridge.tsx` reads the App-boot snapshot store (ZERO new
  fetches): the 8-row board (the ounce implied in the parity line),
  per-row Jalali as-of stamps, the حباب as the right-aligned
  secondary, the parity + decomposition behind one tap per row, the
  method block (formula + constants + the three notes), the four-move
  interpretation paragraph in binding order (closing at
  `#lane-dollar`), the TGJU attribution + revision caveat. HARD GATE
  satisfied: Bridge-1 before Bridge-2/R30.
- **R14 · F2a CB-demand Tier-1** (the IMF tracker, Zone K — between
  the flows cards and the wall, via GoldContext's new `zoneK` slot;
  `#gold-zone-k`). The one-key composite (the TIC pattern): the zod
  contract `GoldCbSnapshotSchema` in core; the adapter
  `domains/gold/adapters/imf-reserves.ts` (the COFER pattern + the
  S4-D4 fail-closed rules + the session's additions: G-aggregates AND
  the BIS banking book excluded — its swap ops printed −408 t across
  2022; the 350M-ozt in-window band; the 50M-ozt broken-pair guard);
  the compute/store/job `domains/gold/cb-demand.ts` (the
  IL-primary/IRFCL-complement merge, matched-pair deltas, the
  contiguous rolling-12m, the top-10 buyers, the 3-month
  reported-world stock; `insights:gold-cb:v1`); the rung3 registration
  (day 1–5 gate + month-skip idempotence, budget 8, LAST in the
  registry so a rare Saturday-1st collision refuses the monthly
  source); the route `GET /api/insights/gold-cb` (the /tic twin);
  the component `GoldCbDemand.tsx` (the hand-rolled SVG rolling chart
  with the three dated episodes + the current pace; the buyers table —
  desktop table / mobile top-5 stacked — with the S12-D1 share column
  computed at render from the live gold price, the 6-quarter vintage
  bound; all the honest exceptions; the mirror cross-link to the
  usd-reserve-share seat). Display-only — no meter membership.
- **R16 · F16b the affordances + the market-state pill.**
  `market-state.ts` (pure: the COMEX/Globex static schedule + the US
  DST rule — NO new fetch) + the pill INLINE after the hero's as-of
  ("Market open · COMEX gold futures, New York (UTC−5)" — the
  reference market + timezone named at point of use, the GPE-S3-10
  lesson). #17: the hero's lane weights gain aria-expanded +
  aria-controls + the destination tooltip (the name-match rule).
  #19: the view radio labels + the chart range chips meet the 44px
  floor (were 32px/28px).
- **R17 · the #21 de-dup (S6-D5, the space donor).** The seats lane
  cards drop the lane INTRO + TALLY (byte-identical to the Signals
  ledger rows' chrome, where they keep rendering); the keep-list
  holds: lane header + verdict + seats list. The frozen pins
  re-verified: the GoldPage lane test re-pinned; the R11 narrative's
  byte-identical consistency now pins the same-keys string over the
  same lane model. (There are no literal expanders in GoldSeats — the
  audit's #21 "same expanders" phrasing named the duplicated chrome;
  the operational definition is recorded as S12-D2.)

**M3 — the manifest round + gates + deploy + live verification:**

- **The Persian-copy manifest round 85** (commit `7315ef4d`): ONE
  round for the session's **98 fa strings** (all NEW; manifest 8,032 →
  8,130 entries; `persian-copy-round-85-gpe-s12-p1c.md`; copy:audit
  clean; the terminology doc gained the round's terms — حباب، آب‌شده،
  چرخش خریدار، دنیای گزارش‌شده…).
- **Gates 9/9 GREEN** (2m 47s): secret scan · typecheck (6) · lint
  (0/0) · copy:audit (clean) · narrator vocabulary · narrator eval ·
  layer1 strict · **full suite 15,290** (+43 vs the S11 close:
  core 195 · scraper 69 · insights 1442 · markets 13 · api 414 ·
  web 13,157) · build + budget. **The budget move (S12-D3's own
  plan):** the GoldPage chunk measured 115.12/27.46 with the two
  sections — bumped 89.5/22.5 → **116/27.5** (verified NOT
  duplication: the store/engine/dictionaries each live in their own
  chunks; the growth is the two sections' genuine component logic;
  P2's F7 chart ships its own measured bump).
- **Deploy per docs/DEPLOY.md** (commits `2dcefbc1` + `9da80ec6`):
  the D-43 deploy-lock re-checked FIRST (`23ce6b06` @ 100% — no
  drift); the portwatch window clear (Wednesday); the first attempt
  clean — **production `49ae8ce7` @ 100%** (18:51:04Z). The served
  entry hash + the deployed GoldPage chunk BYTE-VERIFIED against the
  dist. **The landing lever** (the markets-au "Path B" pattern):
  `gold-cb-run` — the manual runner/KV seeder (`RestGoldCbStore`, the
  KV REST adapter; the period normalizer gained the IRFCL value legs'
  third print shape, the daily 'YYYY-MM-DD', live-discovered on the
  dry-run) — seeded the key from the LIVE venue the same evening:
  asOf 2026-10 · 250 rolling points (2006-01 → 2026-10, last 396.7 t)
  · the 10 buyers (POL +159.1, CHN +130.9, UZB +60.0, KAZ +51.0…) ·
  reported world 35,003 t / 103 reporters. `GET /api/insights/gold-cb`
  serves it (edge-cached).
- **Live-verify per AGENTS.md §9 (all GREEN; the screenshots are
  `s12/verify-*.png`):**
  - **EN desktop** — the bridge: zone F placed between D and Signals,
    the 8 rows in order, the Emami premium **+6.9%** (live), the
    parity expansion rendering the full C2 grammar with live numbers
    ("Global ounce 3,739.87 × free-market dollar 266,330 = 996,039,577
    toman per ounce … intrinsic 234.5M · market 250.7M → premium 16.3M
    (+6.9%)"), the method block (the formula + 8 constants + the
    gerami band + the آبشده + the variant notes), the four moves in
    order with the #lane-dollar close; the CB section: zone K between
    flows and the wall, the chart + 3 episodes + the current pace, the
    10-buyer table with POL's share 28.8% at the live price, every
    caveat; the pill; R17's de-dup confirmed (5 state words, 0
    tallies in the seats headers); the hero weights' aria + tooltips;
    the 44px labels.
  - **The mirror cross-link clicked end-to-end** → lands on
    /currencies with the real usd-reserve-share card ("USD share of
    world FX reserves" 56.70%).
  - **fa/RTL desktop** — `dir=rtl` · «پل ایران» · the Emami row with
    the **Jalali date «۱۴۰۵/۰۸/۲۷»** + the **Persian-digit toman
    «۲۵۰٬۷۴۰٬۰۰۰»** + **«حباب +۶٫۹٪»** · «تقاضای بانک‌های مرکزی» ·
    the fa pill «بازار باز است · قرارداد آتی طلا در کمکس، نیویورک
    (UTC−5)» · the fa share note.
  - **mobile 390×844 (fa)** — NO horizontal overflow (390 === 390),
    the top-5 stacked buyers with the table hidden, all 8 bridge rows.
  - **zero console errors, zero page errors** on every surface
    exercised; the hero weight press scrolls to its lane card.

## Key findings in one paragraph

The prizes are live: the gold page now carries the two sections that
make it different from every Persian-market gold page — the Iran
bridge (the documented, reproducible حباب, computed from one coherent
TGJU snapshot over the CBI constants, with the four-move teaching
paragraph) and the central-bank demand tracker (the IMF
reported-world rolling series with its dated episodes, the buyers
table with the market-re-valued share column, every honest caveat
rendered). The market pill names its reference market + timezone at
the point of use; the page's third balance repetition is gone. The
honest notes: R15 slipped to P2 on its calendar (the wall's WGC CB
line stays until the drop lands); the R07 Treasury flip rides the
overnight rung (S13's M1 verifies); and the CB tracker's data is the
REPORTED world — the section says so everywhere, because the
unreported buying (the WGC's estimates) is exactly what its
cross-reference link is for.

## Decisions taken in S12 (for the program record; DECISIONS.md at reconciliation)

- **S12-D1** — the share-of-reserves method (R14): gold re-valued at
  the LIVE market price over total official reserve assets with gold
  re-valued at the same price (the WGC-consistent definition;
  discovered live: the US reports gold at the statutory $42.22/oz —
  a naive share would print 4.4% for the largest holder). Computed at
  render from the page's own gold-usd reading; a value vintage older
  than 6 quarters renders the dash (mixed vintages never blend).
- **S12-D2** — the R17 de-dup's operational definition: drop the lane
  intro + tally from the seats lane cards (the chrome byte-identical
  to the Signals ledger rows), keep the header + verdict + seats
  list per s6/01 §4 rule 5's keep-list.
- **S12-D3** — the gold-cb rung placement: rung3, day 1–5 gate +
  month-skip idempotence, budget 8, LAST in the registry (a rare
  Saturday-1st collision refuses the monthly source — self-healing);
  the due-day budget pins re-framed in the registry test.
- **S12-D4** — R07's rung-pending posture carried one session: the
  flip verification rides S13's M1 (the honest clock — the rung fires
  04:10 UTC Nov 19, after this session's close).
- **S12-D5** — the tracker's annotation set renders the data's truth:
  the spec's "2014–2018 selling→buying flip" (a pre-data sketch
  phrase) does not match the reported-world series (no selling period
  exists there — the flip was 2008→09, inside the GFC wave's own
  window). The three annotations ship as: 2009–2011 the post-GFC
  wave · 2015 China's six-year catch-up print (the step the chart
  shows, taught as the reporting event it is) · 2022 the rotation.
- **S12-D6** — the GoldPage budget bump 89.5/22.5 → 116/27.5
  (measured 115.12/27.46; verified not duplication; P2's F7 ships
  its own measured bump).

## Open questions for the owner

None blocking. The standing items carry: (1) **the WGC GDT data
drop** (R15, slipped to P2 — tell the P2 session when the quarterly
release arrives; the wall's CB line retires with it); (2) the WGC
authorisation letter (D9 locked: send — your parallel action,
non-blocking); (3) the two operational P0s (CFTC + GPR) remain open
on main, outside GPE; (4) the R07 flip — no action needed; the rung
fires overnight and S13 verifies.

## Done-criteria check (this session)

- [x] The three M1 checks performed and recorded (the R07 rung
  honestly pending — S12-D4; R15 → P2; the gerami band stands).
- [x] The rows landed (R13, R14, R16, R17 — R15 conditional on its
  drop, which did not arrive), tested, and live-verified.
- [x] The Persian-copy manifest round landed with copy:audit green
  (round 85; 98 fa strings; manifest 8,032 → 8,130; clean).
- [x] pnpm gates green (9/9; suite 15,290, +43).
- [x] Deployed per docs/DEPLOY.md and live-verified (desktop + mobile
  + RTL both locales; production `49ae8ce7` @ 100% + the KV seed; the
  deploy-lock re-checked FIRST; first attempt clean).
- [x] The session summary + the next-session prompt written (this doc
  + the S13 prompt below).
- [x] Everything committed and pushed (branch
  `gold-elevation/p1c-prizes`; this session's commits: the M1 docs ·
  the R13+R14 engines · the four rows · the manifest round · the
  gates/budget · the deploy + seed + verification · the close).

## Known problems carried forward (cite, do not re-litigate)

- **R07's first Treasury-primary rung** fires 04:10 UTC Nov 19 —
  S13's M1 verifies the flip (S12-D4).
- **R15 / the WGC GDT drop** — slipped to P2; the wall's WGC CB line
  stays; the ETF/prices drops (R23/R25) ride the same calendar.
- **The two operational P0s** (CFTC Saturday gate; GPR re-fetch) —
  open on main, outside GPE; the why-lines render their state
  honestly.
- **The Kalshi build-time read** — its fallback band stands; the
  re-attempt rides R28 (P3).
- **The CBI gerami pin** — the default band (0.90–0.92 g pure) stands
  (re-attempted this session, WAF-blocked again); a further pin rides
  Bridge-2 (R30).
- **The AGENTS.md drift items** (GPE-S2-28/29) — end-of-program
  reconciliation only.

## Next-session prompt (S13 — P2, the interactive chart)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S13 of the Gold Page Elevation (GPE) program —
the FOURTH Phase-D implementation session: P2, the interactive chart
(wave 2, first session). Gate state at this session's start: the CP-C
lock is COMPLETE (all twelve owner decisions locked as recommended —
s9/CP-C-RECORD.md §1 with its S9b + S9c addenda); the Phase-D gate is
OPEN; P1-a DELIVERED + DEPLOYED + LIVE-VERIFIED (production currena-api
f0844e59 — the S10 rows R01–R06); P1-b DELIVERED + DEPLOYED +
LIVE-VERIFIED (production currena-api 23ce6b06 — the S11 rows R07–R12;
docs/specs/gold-page-elevation/s11/SUMMARY.md); P1-c DELIVERED +
DEPLOYED + LIVE-VERIFIED (production currena-api 49ae8ce7 @ 100% + the
gold-cb KV seed — the S12 rows R13 + R14 + R16 + R17, with R15 slipped
to P2 on its drop calendar; docs/specs/gold-page-elevation/s12/
SUMMARY.md).

Read, in order: AGENTS.md, docs/specs/gold-page-elevation/
00-PROGRAM-PLAN.md (the program plan), docs/specs/gold-page-elevation/
s9/CP-C-RECORD.md (§1 the locked decisions; §2 the locked queue), docs/
specs/gold-page-elevation/s8/01-RECOMMENDATION-TABLE.md §3 (rows
R18–R21 — the scope), docs/specs/gold-page-elevation/s8/
02-DATA-SOURCE-MAP.md (the data-source map; the EODHD row), and
docs/specs/gold-page-elevation/s12/SUMMARY.md (the predecessor
session, this one).

Working mode (the repo's normal discipline): a fresh feature branch off
the S12 close (gold-elevation/p1c-prizes at HEAD — production 49ae8ce7
is built from it; git main still sits at the R-5 close 19131b0) named
gold-elevation/p2-chart-ta; small verified steps; commit + push after
each milestone; the shared bookkeeping files (docs/HANDOFF.md,
CHANGELOG.md, docs/DECISIONS.md) follow the repo's normal rules for
this session's own changes — but do NOT bulk-copy the GPE research
decision history into them (that lands in the one end-of-program
reconciliation commit with the owner). First step of the session:
RE-VERIFY every file path the rows below cite against the live tree
(the citation-re-verification discipline — the R5 no-renames constraint
and the s6/03 §2 module map govern).

M1 — The two build-time checks, before any row:
(a) The R07 Treasury-rung outcome (carried from S12-D4): the first
Treasury-primary collect fired 04:10 UTC Nov 19 — verify the live
readings flipped (the /gold yield legs + the /usa cards: the source
lines name U.S. Treasury, the as-of is the freshest date; if the rung
recorded a Treasury fetch failure, the FRED fallback carried the day —
record which, honestly).
(b) The R15 drop-calendar re-check: has the owner's WGC GDT data drop
arrived (the quarterly release; check the private data/wgc/ path or the
owner's message)? If yes → R15 SHIPS THIS SESSION (P2 is its slip
destination); if no → R15 stays pending (record; the rest of P2
proceeds).

M2 — The rows, exactly R18–R21 (s8/01 §3; the locked modes from the
CP-C record §1), plus R15 if its drop arrived:
- R18 · F7 the interactive price chart — pan/zoom/log + the unit-aware
  header + the D8 50/200 DMA overlay; the window becomes a user
  control (the #01 widening promised at D6-A). HARD GATE: R01
  DELIVERED (S10) — the gate's condition holds. EODHD XAUUSD.FOREX
  daily OHLC (the owner plan; the one-time 10y fetch at build + daily
  appends, or the server-side percentile10y pattern — s8/01 R18 names
  the registration). The chart rides the GoldPage chunk — measure the
  budget and bump with justification (the S12-D6 record left ~0.9 kB
  raw headroom; F7's module ships its own measured bump).
- R19 · F8 the minimal TA band (Zone H) — SMA 20/50/100/200 reference
  rows + the distance-from-200DMA decile + dated cross events
  (whipsaws included) + the classic daily/weekly pivots (the TGJU
  vocabulary; the classic-only guard; the honesty rules s6/02 C5).
  HARD GATE: R01 fixed — satisfied. Rides the F7 OHLC leg.
- R20 · F4a the education on-ramp — the five drivers, each closing at
  its lane anchor + the two notes + the FAQ (the s7/02 approved
  drafts are the reference wording; one Persian-copy round).
- R21 · F4b the one-liners set + the Chain-7 physical grouping — each
  ratio card gains its plain meaning sentence; the five Zone-J cards
  share the physical-market reading line (S7-D1; one coherent edit).
- R15 · F2b (ONLY if the drop arrived): the GDT quarterly demand
  stack beside the Tier-1 tracker + the four-field WGC disclosure
  block + the verbatim attribution per C6; the wall's WGC CB line
  RETIRES as it lands (update the R09 wall + the manifest).

M3 — The Persian-copy manifest round + the gates + deploy + live
verification + the close (the same discipline as S10–S12 M3): ONE
manifest round covering this session's FA strings; pnpm gates green;
deploy per docs/DEPLOY.md (the portwatch window — check the day; the
D-43 deploy-lock re-check; the wrangler 10013 retry rule); live-verify
per AGENTS.md §9 (desktop + mobile + RTL both locales); close per
AGENTS.md §10 (the S13 summary + the S14 next-session prompt + the
TLDR with the program counter).

Scope guard: EXACTLY R18–R21 (+ R15 if its drop arrived), nothing
more — no drive-by refactors, no R22+ rows, no roadmap edits (the
queue is locked). Known context to carry — cite, do not re-litigate:
R07's Treasury-primary posture (the M1(a) outcome this session
verifies); the two operational P0s (CFTC + GPR — open on main,
outside GPE; the why-lines render their state honestly); the Kalshi
fallback band (re-attempt rides R28 at P3); S4-D1..D5; S5-D1..D5;
S6-D1..D8; S7-D1..D8; S8-D1..D7; the twelve locked decisions D1–D12;
S10-D1..D4; S11-D1..D4; S12-D1..D6 (the share method, the de-dup
definition, the rung placement, the rung carry, the annotation set,
the budget bump); the hard gates (R01 before R18/R19 — SATISFIED;
Bridge-1/R13 before Bridge-2/R30 — SATISFIED at S12); the WGC letter
= the owner's parallel action (D9 locked: send; non-blocking — R15's
calendar rides it); the CBI gerami default band (0.90–0.92 g pure
until a further pin at R30).

Done-criteria: the two M1 checks performed and recorded; the rows
landed (R15 conditional on its drop), tested, and live-verified; the
Persian-copy manifest round landed with copy:audit green; pnpm gates
green; deployed per docs/DEPLOY.md and live-verified (desktop + mobile
+ RTL both locales); the session summary + the next-session prompt
written; everything committed and pushed. Use AGENTS.md §9's status
words strictly.
```

## TLDR (per AGENTS.md §10)

```
## TLDR
Status: Done and verified live
Goal of this session: S12 P1-c the prizes — implement rows R13–R17 of
  the Gold Page Elevation program on https://currena.ir/gold (R15
  slipped to P2 on its data-drop calendar, recorded).
Milestones: ✅ M1 the three build-time checks (the R07 rung honestly
  pending → S13; R15 → P2; the gerami band stands) · ✅ M2 R13 + R14 +
  R16 + R17 · ✅ M3 manifest round 85 + gates 9/9 + deploy + the KV
  seed + live-verify + close.
What changed (plain words):
  - THE IRAN BRIDGE is live: a new "پل ایران / The Iran bridge" section
    shows every Tehran coin and gold price decomposed into global gold
    × the free-market dollar × pure content + the حباب (premium) —
    every number reproducible from the stated formula, with the
    per-row dates, the method block, and a four-part teaching
    paragraph (R13).
  - CENTRAL-BANK DEMAND is live: a new section shows the IMF's
    rolling-12-month reported-world net purchases (2006 → now, the
    2009/2015/2022 episodes dated) + the top buyers with their gold
    share of reserves (re-valued at the live price) + every honest
    caveat — display-only, cross-linked to the USD-reserve-share seat
    (R14).
  - The price header now carries a market open/closed pill that names
    its reference market and timezone ("COMEX gold futures, New York")
    — no new data feed; the lane-chip weights announce themselves
    (aria + tooltips); the touch targets meet the 44px floor (R16).
  - The page's third balance repetition is gone: the seats-section
    lane cards drop their duplicated intro + tally lines (kept in the
    hero and Signals) — the space donor that funds the two new
    sections (R17).
  - The WGC GDT section (R15) waits on the quarterly data drop — it
    ships the moment the file arrives (P2).
Where it is now: pushed to branch gold-elevation/p1c-prizes; live at
  https://currena.ir/gold (production currena-api 49ae8ce7 @ 100% +
  the gold-cb KV data seeded the same evening).
What I checked: gates 9/9 GREEN (suite 15,290, +43); copy:audit clean
  (manifest round 85 — 98 fa strings); live-verified on EN desktop +
  FA/RTL desktop + mobile 390×844 — the bridge renders Jalali dates +
  Persian-digit toman + «حباب +۶٫۹٪» in FA, the parity expansion
  reproduces the live arithmetic, the CB chart + buyers + share render
  from the seeded data, the mirror link lands on the real /currencies
  card, zero console errors. The R07 Treasury flip fires overnight
  (04:10 UTC Nov 19) — S13's first check verifies it.
Decisions made: S12-D1 the share-of-reserves method (gold re-valued at
  the live price — the US book-value trap found and documented);
  S12-D2 the de-dup's operational definition; S12-D3 the gold-cb rung
  placement (day 1–5 + idempotence, last in the registry); S12-D4 the
  R07 rung carry; S12-D5 the annotation set renders the data's truth
  (no 2014–18 flip exists in the reported world); S12-D6 the GoldPage
  budget bump 89.5/22.5 → 116/27.5 (measured, verified not
  duplication). Details in docs/DECISIONS.md at the end-of-program
  reconciliation.
Needs your attention: (1) the WGC GDT data drop (R15, slipped to P2) —
  when the quarterly release arrives, tell the P2 session; the wall's
  CB line retires with it. (2) The WGC authorisation letter (D9, your
  parallel action) — non-blocking. (3) The two operational P0s (CFTC +
  GPR) remain open on main, outside GPE.
Next session: the S13 P2 prompt is below (the interactive chart + the
  TA band + the education on-ramp + the one-liners; R15 if its drop
  arrives). Program counter: Session 12/18 · 6 remaining.
```

**Credentials:** used only for the clone (read-only), the pushes, the
Cloudflare deploy + deployments API + the KV REST seed, and the live
verification reads. Not stored in any tracked file. No secret
committed. Rotate the GitHub + Cloudflare tokens at your discretion
per the standing §7 reminder.
