# PROGRESS — the gold balance consolidation program

The running record of the owner's program (the spec set:
`docs/specs/gold-balance-consolidation/` — README + 01–05 + the reference
prototype; the session plan: `PROMPTS.md` GB-S1..GB-S7). One line per
milestone, one block per session; every number comes from a run the session
actually executed. The gap-closure program that ran in parallel is CLOSED
(2026-11-03d) — it is not reopened here.

## The milestone table

| ID | Milestone (spec ref) | State |
|---|---|---|
| A | The missed 2026-11-02 armed re-check, run manually (GOLD_RECHECK_SPEC §3 steps 1–7) | ✅ DONE (GB-S1, 2026-11-03) — watch days 2–4 LOCKSTEP → validated-by-watch; no escalation; corpus 19 days; §1/§5 records + CHANGELOG |
| B | The P0 lane calibration (02 §6): HARNESS_GOLD_LANES_MIN2/_MIN1 beside the frozen tables; C1/C2 over all windows + the mature base | ✅ DONE (GB-S1, 2026-11-03) — MIN2: C1 PASS (level 25.0%, full-tip 49.7%) · C2 PASS (flips 8 vs net-sign 9); MIN1: PASS/PASS (26.1% / 22.6% · 8 vs 9); mature base reported (MIN2 C1 FAIL there — stated, context); frozen tables pinned byte-identical (gold-lane-calibration.test.ts, 29 tests + the session's old-code-vs-new-code run diff) |
| C | docs/insights/BACKTEST-GOLD-LANES.md (the calibration report) + the decision section appended to GOLD_BACKTEST_SPEC.md | ✅ DONE (GB-S1, 2026-11-03) — every cell with n; lineage-only tables labelled "not used for selection"; no forecasting edge claimed |
| D | The decision: MIN2 if C1+C2, else MIN1 if C1+C2, else STOP | ✅ DONE (GB-S1, 2026-11-03) — **GOLD_LANE_MIN_FIRING = 2** (D-GB-3's default; both criteria hold over all windows; no fallback needed, no STOP) |
| E | P1: the pure engine `gold-balance.ts` + unit tests + index export (04 §3) | ✅ DONE (GB-S2, 2026-11-03) — the engine exactly 02 §2–§3 over the frozen imports (D-GB-9 additive); 15 tests (04 §4.1's 13 + the harness-equivalence pin); the 2026-10-31 fixture reproduces 01 §7 (level · 4 neutral · split 2v2 · dollar 1 · inflation 1) with the no-drift pin −2/headwind/6; gates 9/9 GREEN 14,563 (insights 1,270 → 1,285); bundle byte-identical 1522.88/351.96 |
| F | P2: BalanceScale members/split/context + MergedCard wiring behind `?balance=lanes` (04 §3) | ✅ DONE (GB-S3, 2026-11-03) — PR #16 (branch gold-balance/p2-ui; code commit `71dede7`); the lane drivers from `goldBalance(readings)` through the SAME BalanceScale (members/split/tally/note + the subtitle/contextLine/measuredNote slots; geometry/animation/beam untouched); the default view byte-identical (main-vs-new render diff PROVEN, then pinned by the legacy vitest snapshot); 19 tests of 04 §4.3 items 1-7/9/11-13 on the recorded 2026-10-31 fixture; fa round-76 same-session (17 strings, copy:audit clean); screenshots EN/fa × 360/1280 + 2 detail-open (evidence/gb-s3/); gates 9/9 GREEN 14,582; Insights lazy 1533.15/354.25 — ceiling bumped to 1540/355.5 WITH justification |
| G | P2b: the visual redesign of the balance behind the same flag (05) | ✅ DONE (GB-S4 2026-11-03 + the GB-S4b parallel-session union 2026-11-04) — branch gold-balance/p2b-visual (PR #17, merged `bc566e9d`); the owner's 05-VISUAL-DESIGN-SPEC implemented from the approved reference prototype: the brass stage (beam + 11-tick dial + column + bowl pans), the lane WEIGHTS with segmented rims (the NEW BalanceWeight.tsx), the verdict word as the hero, the Not-leaning tray, the four-row inline LEDGER (the same member content contract); --bal-* tokens light+dark with the measured AA ratios (the full table in evidence/gb-s4/README.md); the default view still byte-identical (the snapshot pin untouched, the 46 pure-geometry tests green); 14 new copy keys EN+fa through round-77; the lane tests rewritten 19 → 35 + the gb-s4 Playwright V-1..V-10 suite (61 tests, 6 engine-verified scenarios, 70 screenshots); gates 9/9 GREEN 14,598 (web 12,623 → 12,639); Insights lazy 1550.46/358.81 — ceiling 1560/360 justified; the UNION (PR #18, merged `8a99e03`): the second session's verification + the dark rim hues + the 6 standing union-probe guards, deployed as currena-api `6549c5bc` @ 100% + the 8/8 production matrix (see GB-S4b below) |
| H | P3: the gold Outlook card derived from the unified balance behind the flag (01 §5.2, 04 §3) | ✅ DONE (GB-S5, 2026-11-04) — branch gold-balance/p3-outlook; `goldOutlookOf` in verdict.tsx (unread===4 → null; L≥GOLD_LANE_STRONG(3) strong-bullish / A≥3 strong-bearish; the range evidence UNCHANGED — |change30d|<2% ∧ typical band ∧ |L−A|≤1 → range-bound; L==A → mixed/neutral; else bullish/bearish; footing counted NOWHERE, AC-7) fed by the SAME goldBalance() result as the lane drivers + the verdict word (AC-3 — strip, collapsed takeaway and balance cannot disagree); silver's leg + the default view untouched (OI-4, the legacy snapshot); the 04 §4.2 table test (outlook 15 → 26) + the wiring/consistency pins (lanes 35 → 44); gates 9/9 GREEN 14,618; the gb-s4 standing guards re-run 67/67 |
| I | P4: the copy close — every new key triaged, the terminology, OI-5 (04 §3) | ✅ DONE (GB-S5, 2026-11-04) — the full GB-S3/GB-S4 set CONFIRMED in the manifest (round-76 17 + round-77 15 entries, copy:audit clean); NO new keys this session (OI-1 unanswered → the owner's existing seven sentences ship, the forecast-wording note recorded); fa round-78 NOT created; persian-terminology.md gains the gold-balance lane section (Split / «دوپاره», the lane states, the tally wording, the counts + context lines); OI-5 recorded satisfied-pending-final-owner-read |
| J | P5: the owner-gated flip — default on, delete the panels, bundle re-baseline, docs (04 §3 P5, §1) | ✅ LANDED (GB-S6 + GB-S6b, 2026-11-04) — the hard gate satisfied: the owner reviewed the live preview and recorded the explicit "GO, I love the result so far." in chat on 2026-11-04 (with the OI-1 decision: keep the forecast wording — the shipped sentences already carry the hedging language, EN "Signs point to a potential…" / fa «نشانه‌ها حاکی از احتمال…»; no copy change). **PR #22 merged `4f192c9`** (the staged branch: the gate code retired, BalanceScale visual-only, the two panels deleted, goldOutlookOf the only gold path, the collapsed-corner prose on the lane model, the bundle re-baselined downward 1535/355 measured 1526.97/354.18); CI `gates` green on the branch AND on main (run 41827725767); **DEPLOYED currena-api `0e7d7cb8` @ 100%** (deployment `7c6a0315`, 2026-11-04T12:21:01Z; the deploy-lock check cleared first — production was at GB-S5's `a803f526` @ 100%); post-deploy smoke green (health ok/kv ok · `/` 200 · `/api/insights` 200 fresh, goldSummary still on the wire, AC-9); **the production matrix 8/8 PASS, ZERO console errors** (both legs — the-default-page + the-inert-parameter — byte-identical 4/4 cells, EN + fa, 360 + 1280, fresh contexts; the lane balance everywhere, the panels absent, AC-8's honesty elements visible, the wind scan clean in both locales, the header lane prose beside the balance); the deployed chunk `Insights-B4EBvpCM.js` fetched from production and measured **1,526,974 bytes — byte-identical to the verified local build** |
| K | OI-3/GB-S7: the wire cleanup — goldSummary off the wire + the 03 §6.4 wind copy keys retired (the owner-gated round 01 §9 excluded from P0–P5) | ✅ DONE (GB-S7, 2026-11-04) — the hard gate satisfied: the GB-S1 recheck record verified present (GOLD_RECHECK_SPEC §1) + the owner's explicit in-session approval recorded ("Approve both", the structured gate question with the §3 dependency disclosed); the 14 goldScore wind keys + ALL of goldModelVsReality retired from both dictionaries with their 46 manifest entries (copy:audit CLEAN); the 5 survivors verified against MergedCard (the only reader) and pinned by the trimmed guard; the goldSummary field retired from InsightsSnapshotSchema + the 3 ingest stamp sites — GoldSummarySchema STAYS as the frozen engine's own output contract (gold-score.ts untouched, D-GB-9); the recheck lineage preserved in the same change (gold-corpus-dump reads the historical stamps from the raw archive JSON pre-parse; GOLD_RECHECK_SPEC §3 Steps 1/5 re-anchored); gates 9/9 GREEN 14,574 (the honest −4: the retired stamping/guard tests replaced by tighter retirement pins); the gb-s4 standing guards 67/67 re-run on the retired shape; Insights lazy 1520.84/352.54 — DOWN from 1526.97/354.18 |

**PROGRAM COMPLETE (2026-11-04, closed at GB-S7):** every milestone
A–K delivered; the consolidated lane balance is THE gold card for every
visitor on currena.ir, and the wire now carries exactly what the page
reads — the wind vocabulary and the `goldSummary` field retired with the
owner's recorded approval. Every OI is resolved or explicitly kept
(OI-1 resolved with the P5 go; OI-2/OI-5 shipped; OI-3 executed here;
OI-4/OI-6 kept as the recorded silver/coverage posture). The recheck
lineage (GOLD_RECHECK_SPEC §3) runs on the readings + the raw-archive
historical stamps.

## Session log

### GB-S1 (2026-11-03 ~04:35–06:1x UTC) — P0: the missed re-check + the lane calibration

- **Branch:** `gold-balance/p0-calibration` — **PR #12**
  `gold-balance(P0): the lane calibration` (draft opened early, self-merged
  when the exit gate held — the owner's incremental-merge instruction; the
  merge SHA is the PR's merge commit on main, printed in the session's
  closing report and pinned by GB-S2's prompt at its start).
- **Commits** (this branch, in order):
  1. `insights(gold-balance P0): the missed 2026-11-02 re-check, run manually + the lane calibration — the corpus refreshed (19 archive days; the FX voters re-venued read-only to insights:hist:*), the watch days 2–4 LOCKSTEP (validated-by-watch), the no-drift contract holding on every stamped day, BACKTEST-GOLD.md regenerated (the runner's stale S6 prose corrected, the frozen tables' numbers verified byte-identical over the same corpus), and HARNESS_GOLD_LANES_MIN2/_MIN1 + laneBalanceOverVoters + the C1/C2 statistics (gold-lane-calibration.test.ts, 29 tests) + BACKTEST-GOLD-LANES.md — DECISION: GOLD_LANE_MIN_FIRING = 2`
  2. `docs(gold-balance P0): the records — GOLD_RECHECK_SPEC §1/§5 + the §3 venue note, GOLD_BACKTEST_SPEC §5's re-check + calibration sections, AGENTS.md's P0-CALIBRATED paragraph, PROGRESS.md, the GB-S2 prompt rewrite + the lessons log, CHANGELOG 2026-11-03f`
- **A — the re-check:** §3 steps 1–7 all ran (the armed one-shot never
  fired). Live anchors: health ok; goldSummary −1/headwind/5 firing;
  breakeven-tilt −0.20 @ 11-02 (p10y 0.234). Real KV read passed (19 keys).
  Corpus: 19 archive days (10-15 → 11-03; 10-20 absent), recordedAt
  2026-11-03T04:43:54Z. Run: 2,512 windows (2016-11-07 → 2026-11-03);
  sign-agreements 51.6 / 47.3 / 44.3% (S6: 52.1 / 47.6 / 43.9); tilt 1,173
  (46.7%, in band); flips 263 (10.5%); mature 46.8 / 42.2 / 32.7%, spreads
  −0.01 / −0.30 / −1.98% (the 5td a hair below the 2-SE band edge — the
  S6 "just inside" reversed; the mechanical wording returns to the S4 form,
  the borderline stated; no edge claim either way). Watch days 2–4:
  LOCKSTEP — validated-by-watch. No-drift: holds on all 4 stamped days.
  No escalation rule fired. **Venue findings recorded:** the FX voters
  (dollar-basket, usdjpy) left the stage blob → the dump sources them
  read-only from `insights:hist:<id>` (gold-corpus-dump.ts, additive);
  the KV histories are rolling ~10-year windows (head trim + the dropped
  10-31 Saturday seed → windows −2); us-japan-10y-gap's monthly backfill
  left the stored window (97 → 21 points; the dollar lane ran 2-voter).
- **B — the calibration:** `HARNESS_GOLD_LANES_MIN2` / `_MIN1` in
  `gold-backtest-core.ts` (the SAME frozen 21-voter table + the crowd
  minimum) + `laneBalanceOverVoters` (02 §3's algorithm) +
  `medianFlipsPer60` / `laneCalibrationStats` (the C1/C2 arithmetic) + the
  runner's lane section. Additive only; the frozen tables' outputs pinned
  byte-identical by `gold-lane-calibration.test.ts` (29 tests: the lane
  rules, the beam-angle parity fact, the flip statistic, the C1/C2
  boundaries, the frozen-tables JSON pins) and verified live by re-running
  the pre-change runner over the same corpus (31 diff lines, all prose;
  zero numeric changes).
- **C — the report:** `docs/insights/BACKTEST-GOLD-LANES.md` (277 lines:
  the state/beam/lane tables per rule per scope, the C1/C2 verdict table,
  the mechanical decision, the lineage-only confusion tables labelled "not
  used for selection", the honesty notes) + `GOLD_BACKTEST_SPEC.md` §5's
  two 2026-11-03 sections.
- **D — the decision:** **MIN2** (`GOLD_LANE_MIN_FIRING = 2`). The mature
  base's C1 disagreement (MIN2 full-tip 66.5% > 60% there) is recorded in
  the report and the spec — the criteria were pre-registered on ALL
  windows; the mature row is context.
- **Verified for GB-S2:** the real 2026-10-31 archive in the corpus
  reproduces 01 §7 exactly under the lane engine (level · 4 neutral ·
  borrowing-costs split 2v2 · dollar 1 firing · inflation 1 firing) with
  `goldTailwindScore` = −2/headwind/6 firing on the same fixture — the
  04 §4.1 fixture test is directly constructable from
  `fixtures/gold-backtest-corpus.json`'s `archives["2026-10-31"]`.
- **Gates:** the full `pnpm gates` ran green before the push (the exact
  figures in the session's close-out note in the PR/CHANGELOG). No deploy
  (scripts + tests + docs only; the app code never imports the harness —
  the built worker is unchanged).

### GB-S1b (2026-11-03 ~05:20–06:00 UTC) — the second variant: the parallel-session union (P0 verified twice)

A second GB-S1 session ran concurrently from 10f3e65 (both variants
discovered the same 04:35 UTC Frankfurter stage-blob finding within
~50 minutes of each other). This variant's path and its record:

- **The other pre-registered resolution:** the fixture stayed on the
  **corpus-of-record** (16 days, recorded 2026-10-31T15:17:40Z —
  02 §6's calibration venue is "the same windows as the S4
  report"); the fresh dump's blocker was recorded and the fixture
  reverted. The §3 re-check over it reproduced every S6 number
  exactly (`BACKTEST-GOLD.md` byte-identical); the watch days 2–4
  read lockstep from the fresh archive reads the dump performed
  (11-01/11-02 holding over the weekend; 11-03 both +1 trading day)
  — validated-by-watch; the 11-01/02/03 `goldSummary` stamps
  (−2/headwind) === the promoted-table re-derivation, re-derived
  read-only from the archived readings (no drift; the tilt silent on
  all three).
- **The independent calibration measurement** (a separate
  implementation `lanesOverVoters`, discarded per the first-landed
  union precedent — zero code diff vs PR #12): 2,514 windows;
  MIN2 C1 level **24.7%** / full-tip **49.6%**, C2 median **9** = the
  net-sign **9**; MIN1 25.9% / 22.0%, median 8 vs 9; the same
  mature-base nuance (MIN2 full-tip 65.9% there). The 2026-10-31
  worked example reproduced 01 §7 under both rules.
- **The union result: the first-landed variant stands whole (PR #12,
  merged as 98168b4); this variant's measurement is recorded as the
  decision's robustness check** (GOLD_BACKTEST_SPEC §5 + CHANGELOG
  [2026-11-03g]): two independent implementations over two different
  corpora reached the same criteria verdicts and the same decision,
  **MIN2** — the choice is not an artifact of either corpus venue
  or either hand.
- **Main verified end-to-end post-merge (re-run and measured):** CI
  green on 98168b4; both reports regenerate byte-identically from the
  committed corpus; the full gates ALL 9 GREEN — 14,548 tests,
  Insights lazy 1522.88/351.96 (the built worker unchanged).

### GB-S2 (2026-11-03 ~12:4x–13:xx UTC) — P1: the pure engine

- **Branch:** `gold-balance/p1-engine` — **PR #15**
  `gold balance(P1): the pure engine` (draft opened early, self-merged
  when the exit gate held; the merge SHA is the PR's merge commit on
  main, printed in the session's closing report and pinned by GB-S3's
  prompt at its start). Start state pinned: main at `e683c62`
  (the GB-S1 merges #12/#13/#14).
- **Commits** (this branch, in order):
  1. `insights(gold-balance P1): the pure engine — goldBalance(readings)
     exactly 02 §2–§3 …` (gold-balance.ts + gold-balance.test.ts + the
     index export)
  2. `docs(gold-balance P1): the records — …` (PROGRESS.md, CHANGELOG
     2026-11-03h, the GB-S3 prompt rewrite + the lessons log, AGENTS.md's
     gold-balance paragraph)
- **The engine:** `packages/insights/src/gold-balance.ts` —
  `GoldBalanceSide` / `GoldBalanceMember` (impact supports/pressures/
  steady/unread + evidence rising/falling/high/low/null) /
  `GoldBalanceLane` (side, split, readable, firing, supports, pressures,
  members in table order) / `GoldBalanceReading` (4 lanes in GOLD_LANES
  order, counts, net, readable); `goldBalance(readings)`;
  `GOLD_LANE_MIN_FIRING = 2` (the P0 decision — pinned equal to
  `HARNESS_GOLD_LANES_MIN2.minFiring` by test) and `GOLD_LANE_STRONG = 3`.
  Imports ONLY the frozen sources (`GOLD_LANES`/`GOLD_LANE_VOTERS` from
  gold-score.ts, `evalLeg` from connections.ts); the readable rule
  mirrors gold-score.ts's private one (not exported; D-GB-9 forbids
  editing it — the same copy gold-backtest-core.ts carries).
  Platform-free; zero fetches/KV/wire fields/fa strings. Exported from
  `packages/insights/src/index.ts`.
- **The tests (15):** 04 §4.1's 13 — the crowd minimum (one firing →
  neutral, split false), two-firing votes, the 2v2 split tie, 3v1 strict
  majority, all-unread lanes (stale/missing/unavailable/check-pending),
  readable-but-steady → neutral NOT unread (P5), stale-voter
  immutability (full-object equality — members cover every voter, so a
  stale/missing voter is inert), mixed counts/net/readable, the polarity
  pins WITH the vix trap pinned both ways (level-only voters stay steady
  under any 30-day move; the four threshold-carrying voters fire from
  the move — dollar-basket's 1.0-point bar caught in the session),
  breakeven-tilt level-only, table integrity (21 · 8/3/5/5, member ids
  === GOLD_LANE_VOTERS in table order), the 2026-10-31 fixture, the
  no-drift pin — PLUS the equivalence pin: goldBalance ===
  laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2) on every lane
  side/split/readable/firing/supports/pressures + counts/net/readable
  over 12 batteries, and the order-independence/never-throws battery.
- **The fixture (tests 12+13), measured:** constructed from
  `fixtures/gold-backtest-corpus.json`'s `archives["2026-10-31"]`
  (sourceName `archive 2026-10-31`, updatedAt the archive's generatedAt
  `2026-10-31T04:10:19.365Z`) — LEVEL, 4 neutral: borrowing-costs SPLIT
  2v2 (readable 8, firing 4: real-yield-10y + us10y falling supports;
  us30y + fed-expectations high pressures), dollar 1 firing (usdjpy
  high → pressures), stress readable 5 / firing 0 (neutral, NOT unread),
  inflation 1 firing (breakeven-5y5y falling → pressures);
  `goldTailwindScore` on the same readings: **netScore −2 / headwind /
  6 of 21 firing** (2 tailwind, 4 headwind). The session verified these
  numbers against the harness BEFORE writing the tests.
- **Exit gate (04 §3 P1):** engine tests green (15/15) · typecheck 6/6
  clean (main + scripts) · the frozen engines' tests green (gold-score
  35 · gold-backtest-core 29 · gold-lane-calibration 29) · the index
  export compiles · full `pnpm gates` ALL 9 GREEN — **14,563** tests
  (insights 1,270 → **1,285**; baseline 14,548, no regression) ·
  Insights lazy **1522.88/351.96 unchanged**, built chunk names
  unchanged (`index-DrhFnckY.js` + `Insights-5V_N7nyu.js`) · lint 0/0 ·
  copy:audit clean · narrator checks green · layer1 strict
  11819/11819. **No deploy** (the web app does not import the engine
  yet — P2 gates the UI behind `?balance=lanes`).
- **Carried forward for the owner:** the 02 §4.1 semantic note (calm
  stress reads neutral, not "against" — one line to reverse) stays
  flagged in the PR description and the CHANGELOG.

### GB-S3 (2026-11-03 ~15:5x–17:xx UTC) — P2: the consolidated balance behind the flag

- **Branch:** `gold-balance/p2-ui` — **PR #16**
  `gold balance(P2): the consolidated balance behind ?balance=lanes`
  (draft opened with the screenshots; self-merge when the exit gate
  held — the owner's incremental-merge instruction). Start state pinned:
  main at `801cc02` (the GB-S2 merge, PR #15).
- **Commits** (this branch, in order):
  1. `web(gold-balance P2): the consolidated balance behind
     ?balance=lanes — …` (`71dede7` — BalanceScale + MergedCard +
     Signals/Insights threading + both dictionaries + the 19-test
     suite + the snapshot + the gb-s3 Playwright project/screenshots +
     the round-76 doc/manifest + the narrator hashes + the budget bump)
  2. `docs(gold-balance P2): the records — …` (PROGRESS.md, CHANGELOG
     2026-11-03i, the GB-S4 prompt rewrite + the lessons log, AGENTS.md's
     gold-balance paragraph)
- **The flag:** `?balance=lanes` read ONCE at mount by
  `useBalanceLanesPreview()` (MergedCard.tsx — the ?narrative=preview
  pattern), threaded Insights → Signals → MergedSignalsCard; no
  persistence; without it every visitor sees today's page.
- **BalanceScale (additive only — geometry/animation/beam UNTOUCHED):**
  `BalanceDriver` gains optional `members`/`split`/`tally` + `note` (the
  4th field is THIS session's one extension beyond 03 §3's list — the
  inflation tilt phrase (03 §3 item 5) needed a lane-level context-line
  carrier; recorded in the PR); the pan tiles gain the tally second
  line + the laneChipAria; the tray chips gain the Split badge + tally
  (the class string computed so LEGACY chips render the exact old
  classes); the detail panel gains the note line + the member list
  (Supports/Pressures grouped with evidence · value · the
  `/insights?card=<id>` deep link, steady collapsed in a `<details>`,
  unread listed); three optional slots — `subtitle`, `contextLine`,
  `measuredNote` — render only when passed.
- **MergedCard (flag on):** the lane drivers from `goldBalance(readings)`
  (the P1 engine, first app import — AC-3: one engine, no drift), the
  B-12 status word on the breakeven-5y5y member line
  (`copy.status[chipWordKeyOf(status)]`), the context line (hidden when
  change30d is missing), the measured note + the link aimed at
  BACKTEST-GOLD-LANES.md (the lane model's own measured record — the
  note's sentence verified against its realised-move tables);
  the C12 banner + the footing strip kept in BOTH views; the two gold
  panels retired from the PREVIEW only (never the default).
- **The default view is PINNED byte-for-byte:** a temporary harness
  rendered the flag-off card on the 2026-10-31 fixture against BOTH
  main's components (git stash) and the new ones — `cmp` reported
  byte-identical — and `gold-balance-lanes.test.tsx` item 13 pins it
  with a vitest snapshot (the repo's first; the determinism guard
  renders twice and asserts equality first).
- **The copy:** the reworded subtitle lands as the SIBLING key
  `subtitleLanes` (the shared `subtitle` still renders the default view
  — merging them is P5/GB-S6's); 16 more keys (laneTally, laneTallyNone,
  laneSplit, splitBadge, laneChipAria, memberSupports, memberPressures,
  membersSteadyTitle, membersUnreadTitle, memberOpenIndicator (the
  03 §3 item 6 link word — the second small extension), contextLine,
  measuredNote, laneIntro.*). fa triaged SAME-SESSION — **round-76**
  (`docs/localization/persian-copy-round-76-gold-balance.md`, 17
  strings processed; one polish beyond the drafts: the unread title
  moved to the «قابل ارزیابی» family); no em dashes (pinned by test);
  copy:audit clean.
- **Tests (19, `gold-balance-lanes.test.tsx`):** 04 §4.3 items 1-7, 9,
  11-13 — the chip placement per side (a synthetic one-sided case: 1
  for · 2 against · 1 neutral), the split badge + "2 for, 2 against" +
  the composed aria, the member list (the 2026-10-31 fixture's 8-member
  borrowing-costs lane; the tilt phrase «expectations fading» verified
  against `breakevenTiltLean` on the fixture; B-12 both statuses), the
  unread group shown/hidden, the context line shown/hidden, the
  measured note + link, the EN+fa wind-word DOM scan (also «باد»), the
  RTL mirror (same data-tilt + same drops; the for hanger > cx), the
  dictionary coverage (placeholders + the honesty sentences + the
  em-dash ban), the keyboard open/close + focus, the legacy snapshot,
  and the hook (pushState /insights?balance=lanes → true;
  ?narrative=preview does NOT leak into it).
- **Screenshots (evidence/gb-s3/, VLM-verified):** EN/fa × 360/1280 of
  the flag view (level + split lane — the 2026-10-31 overlay on the
  visual fixture) + the default view + two detail-open shots; captured
  via the new `gb-s3` Playwright project (the sticky bars neutralized
  for the element captures — a screenshot-only tweak, documented in the
  spec file).
- **Exit gate (04 §3 P2):** component tests green (19/19) · full
  `pnpm gates` ALL 9 GREEN — **14,582** tests (web 12,604 → 12,623;
  baseline 14,563, no regression) · lint 0/0 · copy:audit clean ·
  layer1 strict 11,819/11,819 · narrator checks green (vocabulary
  hashes refreshed — a copy-file edit after the regeneration means
  regenerate AGAIN) · Insights lazy **1533.15/354.25** (baseline
  1522.88/351.96; the engine + lane copy join the chunk) — ceiling
  bumped 1530/354 → **1540/355.5** WITH the justification in
  `scripts/check-bundle-budget.mjs` + CHANGELOG (the two panels still
  ride the chunk until P5 re-baselines downward).
- **Merge + deploy:** PR #16 merged as `0bba57a` (CI green on main
  before the deploy); the deploy-lock check passed (the active version
  was the expected `115eb1e5` @ 100%) and `wrangler deploy` shipped
  **currena-api `1bfc88c5` @ 100%** (2026-11-03T17:00:46Z; the full
  record in docs/DEPLOY.md's [2026-11-03i] session note). Browser-
  verified on production, fresh contexts, zero console errors, no
  overflow at 360 + 1280: the flag view EN + fa (today's live data
  reads LEVEL · 4 neutral with borrowing-costs split 2v2 — the badge,
  the tallies, the context line −5.11%, the measured note, the chip →
  detail-panel interaction with the tilt phrase + the B-12 row) and the
  default view EN + fa (the panels, the legacy chips, the legacy
  subtitle). The owner previews at currena.ir/insights?balance=lanes.

### GB-S4 (2026-11-03 ~19:4x–2x:xx UTC) — P2b: the visual redesign behind the flag

- **Branch:** `gold-balance/p2b-visual` — the PR
  `gold balance(P2b): the visual redesign behind ?balance=lanes`
  (draft opened with the screenshot set; self-merged when the V-1..V-10
  exit gate held). Start state pinned: main at `f6f1fdd` (the GB-S3
  re-verification record).
- **Commits** (this branch, in order):
  1. `web(gold-balance P2b): the visual redesign of the balance behind
     ?balance=lanes — …` (BalanceWeight.tsx + the BalanceScale `visual`
     branch + MergedCard wiring + the tokens/CSS + the copy EN/fa +
     round-77 + the rewritten tests + the gb-s4 Playwright suite +
     the evidence + the budget bump + the narrator hashes)
  2. `docs(gold-balance P2b): the records — …` (PROGRESS.md, CHANGELOG
     2026-11-03j, the GB-S5 prompt rewrite, AGENTS.md's gold-balance
     paragraph)
- **The stage** (05 §4.2, from the owner-approved prototype): the
  tapered brass beam with its highlight line, the brass hub over the
  11-tick ±35° dial with the 3× magnified needle (hidden when nothing
  could be read), the tapered column + rounded base + contact shadow,
  hangers redrawn every frame from the rotated joints to the pans' top
  corners, and the pans as tinted shallow bowls with the brass rim and
  the captions inside. ONE animated angle still drives everything; the
  pans translate only; the beam formula is the owner's; 650 ms ease-out
  quartic on load + data change; prefers-reduced-motion jumps. The
  pans' heights are 05's targets TUNED for the measured worst case
  (s 236→256, m/l 268→280 — the spec's own header allows tuning; the
  244/268 scrollHeight measurements that motivated it are recorded in
  the `balanceVisualMetrics` comment). The size steps read the balance
  root's measured width (s/m/l), the stage caps at 720.
- **The weight** (NEW signals/BalanceWeight.tsx, 05 §4.3 + §11): the
  round brass disc (stone for neutral/unread), the lane icon engraved
  (DQ-4 resolved to the prototype's own lucide-style set — the
  existing ConditionIcon glyphs name STATES, not lanes), the SEGMENTED
  RIM (one arc per driver, sorted supports → pressures → steady →
  unread; green/red/hairline/dotted; 4.2px firing / 3px otherwise),
  the Split badge, the label, the 44px hit area, hover/active/focus.
  Pure props; `balanceRimSegments` exported for the rim-count tests.
- **The verdict block (the hero), the tray, the ledger (05 §4.4–4.6):**
  the verdict word at 30–44px with the lane strip and the always-stated
  counts line (for/against/not-leaning, unread appended when > 0) + the
  context pill inside the block; ONE recessed "Not leaning" tray holds
  the neutral AND unread weights; the four-row LEDGER replaces the
  shared detail panel INLINE — one row open at a time, a weight press
  opens + scrolls + focuses the row, and the member list keeps the
  GB-S3 content contract (AC-2: all 21 voters reachable; evidence +
  value + deep links; steady as one muted sentence; B-12; the tilt
  phrase). Sparse keeps UI-40's honesty: the not-enough sentence IS
  the verdict word.
- **Tokens + contrast (05 §5, V-7):** the `--bal-*` tokens scoped to
  `[data-balance-visual]`, light + dark, in index.css. The AA ratios
  MEASURED from the rendered styles in both themes (the full table in
  evidence/gb-s4/README.md): the hero word 5.00/4.77 (red) and
  3.35/4.78 (green — large-text AA ≥3:1); every caption/tally surface
  ≥4.5 (5.56–13.60). The dark captions needed 05 §5's anticipated
  lightening — the site's dark chip inks read 4.28/4.35 on the 9%-
  tinted pans, so the balance's dark captions and ledger state words
  wear the prototype's own dark side hues (#4bc27d/#f07078 → 7.10/5.56).
- **The default view stays byte-for-byte:** the legacy branch renders
  verbatim (the `visual` prop gates the redesign); the legacy-markup
  vitest snapshot is untouched and green; balance.test.tsx's 46
  pure-geometry tests stay green untouched.
- **The copy:** 14 new keys EN + fa (eyebrow, verdictEyebrow, the four
  verdictCount parts, trayTitle/trayNote/trayEmpty, the four
  laneState words + laneStateSplit), triaged SAME-SESSION through
  **round-77** (`docs/localization/persian-copy-round-77-gold-balance-
  visual.md`; the manifest +15 processed, including the fa
  list-joiner «،» under the ConnectionCard precedent); no em dashes.
  The verdict word, captions, empty-pan sentences and measured note
  REUSE the existing keys (no churn).
- **Tests:** gold-balance-lanes.test.tsx REWRITTEN to the new anatomy
  (19 → **35**: placement per side incl. the FOR/stack cases, the split
  disclosure (badge + aria + ledger state), the ledger member lists,
  B-12, the context pill inside the verdict block, the rim (pure +
  rendered-vs-ledger V-4 pin), the pure visual geometry (size steps,
  metrics, the weight-fit invariant, the frame drops/needle/RTL), the
  verdict block + the all-unread/sparse states, RTL mirror +
  direction-free drops + Persian digits, keyboard open/close + focus
  landing, the legacy snapshot, the `visual` prop boundary, the flag
  hook). Every synthetic fixture was verified against `goldBalance`
  BEFORE pinning (for 3-0-1 · against 1-2-1 · split 1-1-2 · all-unread
  0-0-0-4 · sparse readable 1).
- **The gb-s4 Playwright project + the V-1..V-10 evidence (61 tests,
  all green; 70 screenshots + the README in evidence/gb-s4/):** the
  six scenarios (balanced = the recorded 2026-10-31 archive; the five
  synthetic; loading = the route's honest skeleton — the merged card
  only mounts with data, so the balance never half-renders; the
  deviation is recorded) × EN/fa × 360/1280 × light/dark; the squint
  test (the computed-size maximum + the blur(8px) capture); V-2's fill
  ratios; the 360/390/768/1280/1920 overflow sweep with the pan-clip
  checks; the rim-vs-ledger parity per scenario; the formula pins; the
  wind scan; the computed contrast in both themes; the keyboard walk;
  the reduced-motion layout equality; the default view beside it. The
  scenarios ride an in-memory `/api/insights` interception that CLEARS
  unspecified eval fields — the fixture's own change30d values
  otherwise LEAK into the scenario's voters (the leak flipped
  real-yield-10y/us10y to supports through the fixture's −0.28 moves;
  caught by V-5, fixed, recorded in the file) — and APPENDS the voter
  ids the fixture lacks (breakeven-tilt).
- **Exit gate (the prompt's V-1..V-10):** all hold — see the README's
  per-criterion evidence lines. **Gates: ALL 9 GREEN — 14,598 tests**
  (web 12,623 → 12,639; baseline 14,582, no regression) · typecheck
  6/6 · lint 0/0 · copy:audit clean (round-77) · narrator vocabulary
  refreshed · layer1 strict 11,819/11,819 · Insights lazy
  **1550.46/358.81** measured — ceiling bumped 1540/355.5 →
  **1560/360** WITH the justification in
  scripts/check-bundle-budget.mjs (SVG + CSS + copy behind the flag;
  no new dependency; the two panels still ride the chunk until the
  P5/GB-S6 flip re-baselines downward).
- **DQ-1..4 defaults held** (brass; the segmented rim; the ledger
  closed by default; the prototype's lane icons) — recorded in the PR.
- **Merge + deploy:** PR #17 merged as `bc566e9d` (CI green on the
  branch and on main before the deploy); the deploy-lock check passed
  (the active version was the expected `1bfc88c5` @ 100%) and
  `wrangler deploy` shipped **currena-api `d0eab36c` @ 100%**
  (deployment `0fc7870c`, 2026-11-03T21:13:17Z; the full record in
  docs/DEPLOY.md's [2026-11-03j] session note). Browser-verified on
  production, FRESH contexts, zero console errors, no overflow at
  360 + 1280, both views: the redesigned flag view EN + fa (today's
  live data reads **Balanced / «متعادل» · "0 for · 0 against · 4 not
  leaning"** with the borrowing-costs split lane in the tray wearing
  the Split badge — the hero word, the lane strip, the counts, the
  tray, the ledger, the weight-press → row-open interaction with focus
  landing on the row button; the VLM pass confirmed the brass
  instrument, the hero and the RTL mirror in both themes) and the
  default view EN + fa (the two panels, the legacy chips, the legacy
  subtitle — no visual-redesign element anywhere). The owner previews
  the redesign at currena.ir/insights?balance=lanes (V-11: the owner's
  live read before the P5/GB-S6 flip).

### GB-S4b (2026-11-04) — the parallel-session union + the delivery completion

A SECOND GB-S4 session (branch `gold-balance/p2b-visual`, pushed as
`gold-balance/p2b-visual-parallel` for the record) built the visual
redesign independently and COMPLETELY — its own dispatcher
(`visual="lanes"`), its own BalanceWeight + segmented rim, its own
`--bal-*` stylesheet (code-split into the lazy CSS chunk), its own
round-77 triage (19 keys + the «، » separator), its own 28-test jsdom
rewrite, its own 81-test gb-s4 evidence suite (the tint-surface
contrast asserted in-suite; the squint calibrated against the reference
prototype; the stack case pinned; VLM-verified shots) — and found the
first variant ALREADY MERGED (PR #17, `bc566e9d`) when it pushed. The
GB-S1b union precedent applies: **the first-landed variant stands
whole; the second records its verification** — and the verification
LANDED as PR #18 (`gold-balance/p2b-union`, merged as `8a99e03`).

- **The independent verification (all green, on the merged build):**
  full `pnpm gates` ALL 9 GREEN 14,598 re-run on merged main; the
  merged 61-test gb-s4 suite re-run green; the legacy snapshot
  byte-identical through the merge; the frozen files untouched.
- **The union's contributions (PR #18):** (1) the dark-theme RIM
  SEGMENTS take the reference prototype's own darker-theme side hues
  (#4bc27d/#f07078) — an independent VLM pass on the merged evidence
  flagged the pinned Green 50 as faint at a 3–4.2px stroke on #1A222E,
  the same conclusion the merged variant had already reached for the
  dark CAPTION inks (the second variant had shipped the identical fix
  independently); light mode untouched. (2) `gb-s4-union-probe.plw.ts`
  (6 tests, green against the merged build AS-IS) — the STANDING guards
  for the two acceptance areas the merged suite cannot see: the
  FOUR-weights-on-one-pan worst case at 360/390 EN+fa (the merged
  scenarios peak at three on a pan; the merged pan heights 256/280 hold
  two rows of four with zero clip) and the pan-caption AA measured ON
  the 9% side TINT (the merged contrast check's background-climb lands
  on the card because the pans' tint is a background-image gradient;
  the probe blends the live tokens at the CSS's own alpha — >=4.5:1 in
  both themes). The visual README records both files +
  `prod-verify.mjs`.
- **The delivery completion:** CI green on the union branch → PR #18
  merged as `8a99e03` → the deploy-lock check passed (the active
  version was the parallel session's `d0eab36c` @ 100% — expected, no
  third session) → `wrangler deploy` shipped **currena-api `6549c5bc`
  @ 100%** (deployment `9844fd4f`, 2026-11-03T21:41:30Z — the merged
  build + the union polish; the note in docs/DEPLOY.md's
  [2026-11-03j]→[2026-11-04a] records). The production matrix
  (visual/prod-verify.mjs — the flag view AND the default view, EN +
  fa, 360 + 1280, fresh contexts): **8/8 pass, ZERO console errors**
  — the flag view (4 weights, «متعادل»/Balanced, the «دوپاره»/Split
  badge, the tray + the ledger with the row-open interaction, the
  inflation tilt phrase + the B-12 "falling · Normal" row, no
  overflow, RTL mirrored) and the default view (the two panels + the
  wind panel + the legacy chips + the legacy subtitle — no
  visual-redesign element anywhere).
- **The parallel variant's independently-measured findings** (recorded
  for the owner, in its round-77 doc + the preserved branch): the
  reference prototype's OWN 236px mobile pan overflowed its stack
  scenario by 188px (measured in its guides readout before either
  implementation); the site's dark status inks read 4.28:1/4.35:1 on
  the 9% pan tint; the squint calibration — the brass signature reads
  first blurred in the second variant's shot AND in the owner's
  approved reference (the verdict word is the dominant TEXT).

### GB-S4c (2026-11-04 ~0x:xx UTC) — the third variant's arrival + the independent re-verification stamp

A THIRD GB-S4 session also ran concurrently (started from `f6f1fdd`,
~2.5h behind the first). It built the redesign independently
(BalanceWeight with the segmented rim, the dispatcher, its own round-77
triage, its own harness) and found the delivery closed at its first
push — PR #17 + the PR #18 union already merged, deployed and recorded.
Its implementation was never pushed (the push was rejected against the
first variant's branch) and is discarded whole, per the union
precedent. The session then became the final independent
re-verification (the f6f1fdd pattern — no state changed), re-running
everything AFTER the union's own close-out record (`00b4ccb`):

- **Gates re-run on main: ALL 9 GREEN — 14,598 tests** (web 12,639);
  Insights lazy 1550.46/358.81 as recorded. **CI green** on `bc566e9d`,
  `3c54dbe`, `8a99e03` AND the post-record main pushes (`00b4ccb`'s
  lint failure was fixed by `839ce89` — verified in the run history).
- **Deployment re-verified via the Cloudflare API:** currena-api at
  100% on deployment `9844fd4f` / version `6549c5bc`; `/api/health` ok;
  the deployed `Insights-CT99o-Ue.js` = **1,550,458 bytes raw — the
  recorded 1550.46 kB exactly**; the deployed stylesheet carries the
  union's `.dark [data-balance-visual] [data-bal-seg=…]` rim override.
- **A live production browser pass, fresh contexts, zero console
  errors:** the flag view EN (1280 + 360 — Balanced, "0 for · 0 against
  · 4 not leaning", 4 tray weights, no overflow) + fa (1280 + 360 RTL
  + a dark pass — «متعادل», «۰ موافق · ۰ مخالف · ۴ بدون گرایش») and
  the default view EN + fa (the panels, the legacy chips, the legacy
  subtitle); the wind scan clean on the flag view in both locales.
- **The landed harness re-run: 67/67 green** (gb-s4-visual's 61 + the
  union's 6 probes) with the documented apps/web invocation.
- **The third hand's independent confirmations** (two hands reaching
  the same numbers is worth more than one): the prototype's own fixed
  pan heights clip the 360px four-weight stack — this session measured
  the SAME `agOverflow: 188` the second variant recorded; the dark
  captions on the 9% tint fail 4.5:1 with the site's dark chip inks —
  4.10:1/4.23:1 by this hand's 9% blend vs the second variant's
  4.28/4.35, the same verdict. Both landed fixes are necessary.
- **Two environment notes for future sessions** (recorded so the
  failure modes are recognisable):
  1. The RTL page at 360px carries a document `scrollWidth` of 389px
     from the app's own off-canvas side menu — measured IDENTICALLY on
     the default view and the flag view (nothing inside the gold card
     overflows any edge). A PRE-EXISTING app-chrome quirk, NOT a
     balance regression; the probes' baseline-comparison pattern is
     the right guard against mistaking it for one.
  2. `gb-s4-union-probe.plw.ts` reads `visual/fixtures/snapshot.json`
     relative to the process CWD: it PASSES with the documented
     `--config=visual/playwright.config.ts` invocation from apps/web
     and FAILS when Playwright is run from `apps/web/visual` itself
     (where the config file lives — a natural but undocumented entry
     point). The guards hold; a one-line `import.meta.url` resolution
     would harden the entry point (deferred to GB-S5's harness touch).
  3. The deployed site ships ONE main stylesheet — index-*.css carries
     the `--bal-*` tokens and every visual rule (Vite merges the app's
     CSS here), so the union record's "code-split into the lazy CSS
     chunk" describes the intent, not the shipped artifact; the JS
     budget is unaffected either way.

### GB-S5 (2026-11-04 ~00:4x–0x:xx UTC) — P3+P4: the Outlook derivation + the copy close

- **Branch:** `gold-balance/p3-outlook` — the PR
  `gold balance(P3+P4): the Outlook derived from the balance + the copy close`
  (draft opened early; self-merged when the exit gate held — the owner's
  incremental-merge instruction). Start state pinned: main at `dd74242`
  (the GB-S4c re-verification record, PR #19).
- **Commits** (this branch, in order):
  1. `web(gold-balance P3): the gold Outlook DERIVED from the balance behind
     ?balance=lanes — …` (`5c48028` — verdict.tsx + MergedCard + Signals +
     the two test files + the terminology section + the union-probe CWD
     hardening + the prod-verify outlook probe + the regenerated gb-s4
     evidence set)
  2. `docs(gold-balance P3+P4): the records — …` (PROGRESS.md, CHANGELOG
     [2026-11-04b], the GB-S6 prompt rewrite, AGENTS.md's gold-balance
     paragraph)
- **The derivation (P3, 01 §5.2):** `goldOutlookOf(balance, speed, position)`
  in verdict.tsx — the gold Outlook computed from the SAME
  `goldBalance()` result that drives the lane drivers and the verdict
  word: all-4-unread → `null`; `L >= GOLD_LANE_STRONG (3)` →
  strong-bullish / `A >= 3` → strong-bearish; the range evidence
  UNCHANGED from outlookOf (|change30d| < RANGE_SPEED_PCT(2%) AND the
  10y position in the typical band AND |L−A| ≤ 1 → range-bound — price
  describes consolidation only, never direction); `L == A` → mixed if
  L > 0 else neutral; else bullish/bearish. Footing counts NOWHERE
  (AC-7 — the old gold path's 5th condition was gold's own 30-day move,
  the circularity that read Bearish beside a Balanced balance, D-GB-6).
  `speed`/`position` are the gold SignalReading's own fields — the exact
  range-evidence inputs outlookOf reads today, so the consolidation read
  is not re-derived. **The wiring (AC-3):** MergedCard passes
  `goldOutlook` to VerdictStrip ONLY under the flag (`undefined` → the
  legacy `outlookOf(gold)` derivation, byte-for-byte); silver's leg
  always reads outlookOf (OI-4 untouched); the DEFAULT view is pinned by
  the untouched legacy snapshot (balance.test.tsx 46 +
  gold-balance-lanes.test.tsx's snapshot item green).
- **ONE small extension beyond the prompt's letter (recorded, the GB-S3
  `note`-field precedent):** the COLLAPSED section takeaway's gold chip
  (Signals.tsx `CollapsedVerdict`) also rides the lane-derived state
  under the flag — AC-3 says the gold Outlook state cannot disagree with
  the balance, and the collapsed line is an Outlook-state display; the
  DIRECTIONAL fixture shows the divergence it closes (collapsed gold
  would read Mixed — footing supportive dragging the old count — beside a
  lane balance reading Leaning-against). Flag off → the collapsed line
  keeps today's derivation byte-for-byte (pinned).
- **The tests (04 §4.2):** outlook.test.ts 15 → **26** — the table test
  over (L, A, unread, speed, band) for every branch of 01 §5.2: null
  (incl. rule-1 precedence), strong-bullish (L=3, L=4, and both
  outranking the range rule on a quiet month), strong-bearish,
  range-bound (all-neutral quiet, the 2v1/1v2/1v1/1v0 thin edges, the
  negative quiet month, the rules'-order case 1-for-3-unread), NOT
  range-bound (moving price, high/low band, no position, no speed, the
  ±2% boundary excluded both signs), the |L−A| ≥ 2 clear-edge rule,
  mixed/neutral, bullish/bearish (incl. the sparse 0-1-3 shape), and the
  FOOTING-DECOUPLING PIN (AC-7): seven (L, A, unread) shapes give the
  SAME state at gold change30d −9% and +9%, and the ONLY way price
  changes the state is the range evidence (±1.5% quiet+typical reads
  range-bound where ±9% does not). outlookOf's own tests stay untouched
  and green (silver's contract + the default gold view).
  gold-balance-lanes.test.tsx 35 → **44** — the strip wiring pin (the
  gold chip's data-verdict-direction === goldOutlookOf(goldBalance(
  readings), speed, position) over a 13-variant engine-verified battery,
  every variant's counts probed against the real engine before pinning),
  the never-opposing matrix (every balance-verdict × outlook-family
  cell: for/against/balanced/none), silver's leg === outlookOf(silver),
  the ±9% DOM decoupling (the balance verdict word + counts + beam tilt
  byte-identical, the outlook identical; quiet+typical → range-bound
  with the balance still identical; quiet at the decade high → neutral),
  the all-unread null (both metals unread → the strip's own both-null
  rule hides it; silver readable → the gold chip carries verdictNone —
  the old path said Bearish there, from footing), the existing-sentences
  pin (OI-1 unanswered: the states change, the owner's wording does
  not), the doctored-conditions pin (AC-4: a gold reading with every
  legacy condition forced `against` cannot move the strip or the balance
  behind the flag — no bespoke stress/expectations rule can reach the
  Outlook), and the collapsed-takeaway pair (flag on → the lane state;
  flag off → the legacy derivation).
- **P4 (the copy close):** the full GB-S3/GB-S4 key set CONFIRMED in
  the manifest — round-76 (17 entries) + round-77 (15 entries) all
  `processed`, `pnpm copy:audit` clean (the per-session gate held
  throughout). NO new keys this session: OI-1 was asked once, early,
  with the 03 §6.3 table in front of the owner (see the report) and no
  answer had arrived at ship time, so the seven EXISTING gold sentences
  ship and fa round-78 was NOT created — per 03 §6.3's rule the report
  notes the wording still reads as a forecast
  ("Signs point to a potential …"). persian-terminology.md gains the
  gold-balance lane section: Split / «دوپاره», the four lane states
  (به نفع طلا / علیه طلا / بدون گرایش / قابل ارزیابی نبود), the tally
  wording («{firing} مورد از {readable} عامل فعال است» /
  «هیچ عاملی فعال نیست»), the counts line, the context line and the
  round-53 lane names — every term with its key path and round. **OI-5
  is satisfied-pending-final-owner-read**: every fa string behind the
  flag is reviewed + fingerprinted; the final owner read of the fa
  preview belongs to the P5 decision (with V-11).
- **Harness touches:** the GB-S4c CWD-sensitivity note CLOSED —
  gb-s4-union-probe.plw.ts resolves its fixture from `import.meta.url`
  (the probe now runs from any directory); prod-verify.mjs (the delivery
  close-out harness, reusable for GB-S6) now also reads the Outlook
  strip's gold state + sentence in the production matrix; the visual
  README records both. The gb-s4 evidence set was REGENERATED on the P3
  build (the scenarios' strips now show the lane-derived states — the
  balanced scenario's gold chip reads the neutral sentence where the
  old footing-driven read said decline).
- **Exit gate (04 §3 P3+P4):** outlook tests green (26) · component
  tests green (44) · full `pnpm gates` **ALL 9 GREEN — 14,618 tests**
  (web 12,639 → 12,659, +20; baseline 14,598, no regression) ·
  typecheck 6/6 · lint 0/0 · copy:audit clean (no new keys) · narrator
  vocabulary in sync (190×2 + 56×2) + eval 50 checks · layer1 strict
  11,819/11,819 · secret scan clean (8 patterns · 806 files) · Insights
  lazy **1550.94/358.99** measured (baseline 1550.46/358.81; +0.48 kB
  raw / +0.18 kB gz — the derivation + the prop threading + the
  collapsed override) — the 1560/360 ceiling HOLDS, no re-baseline
  needed; the chunk re-hashed `Insights-PIEDSGJA.js` →
  `Insights-Ck9A6XE3.js`. The gb-s4 standing guards re-run on the P3
  build: **67/67 green** (gb-s4-visual 61 + the union probes 6, the
  hardened invocation).
- **Merge + deploy:** PR #20 merged as `1d1211c` (CI green on the
  branch AND on main — the `gates` check, run 41754039288); the
  deploy-lock check passed (the active version was the expected
  `6549c5bc` @ 100% on deployment `9844fd4f` — no parallel session) and
  `wrangler deploy` shipped **currena-api `a803f526` @ 100%**
  (deployment `754dccb6`, 2026-11-04T01:28:07Z; the full record in
  docs/DEPLOY.md's [2026-11-04b] session note). Production verified:
  the 8/8 prod-verify matrix (both views × EN + fa × 360 + 1280, fresh
  contexts) with **ZERO console errors**, the outlook probe reading
  **neutral** in every flag cell and the legacy **bearish** in every
  default cell; the live D-GB-6 read — **Balanced · "0 for · 0 against
  · 4 not leaning" with gold −5.19% over 30 days → the gold chip
  "Signs point to a neutral outlook for gold prices."** (the falling
  month shows only as the context pill) — plus the collapsed-section
  check ("Outlook: Neutral", lane-derived, beside silver's own "Outlook:
  Mixed") and a VLM pass on the strip close-up (evidence/gb-s5/: 5
  shots + the README, incl. the sticky-row environment note — the
  app's section tabs sit over scrolled-under content identically on
  both views; pre-existing chrome, the GB-S4c pattern).

### GB-S6 (2026-11-04 ~02:1x–0x:xx UTC) — P5 STAGED: the flip behind the hard gate

- **Branch:** `gold-balance/p5-flip` — the draft PR
  `gold balance(P5): the owner-gated flip — STAGED, awaiting the recorded "go"`
  (draft opened with the work; **NOT merged, NOT deployed** — the hard
gate holds: AC-12 + V-11 + 04 §3 P5 require the owner's explicit "go"
recorded in THIS file first; the production site still serves GB-S5's
a803f526, and the preview at currena.ir/insights?balance=lanes remains
the owner's review surface).
- **The flip (staged):** the `?balance=lanes` gate code RETIRED —
  `useBalanceLanesPreview` + the `balanceLanes` threading through
  Insights/Signals/MergedCard + the `visual` prop: BalanceScale's
  visual branch is now the ONLY branch (the whole legacy branch — the
  pan tiles, the shared detail panel, the trays, the legacy stage
  geometry + gauge + pan-sizing helpers, the 500ms cubic tween —
  deleted; the pure law helpers the redesign shares stay verbatim;
  the tween's t0 now rides the first rAF tick's own timestamp, which
  also cleared a react-hooks/purity false positive at 0 warnings).
  `GoldTailwindPanel.tsx` + `ModelVsRealityPanel.tsx` + their parts of
  `gold-panels.test.tsx` DELETED (the surviving assertions moved: the
  dictionary-coverage pair + the PricesBoard pin + the card-order test
  adapted to strip → balance → footing with no panels between).
  `goldSummary` still arrives on the wire and stays validated — the UI
  simply does not read it (AC-9; its retirement is OI-3/GB-S7).
  `VerdictStrip`'s `goldOutlook` prop is now REQUIRED (the flag-off
  `outlookOf(gold)` path retired); `outlookOf` stays for silver ONLY
  (OI-4). The collapsed takeaway override is unconditional.
- **THE CORNER DECISION (recorded):** the collapsed section's gold
  PROSE **joins the lane model** — and the same sentence family at its
  second site, the merged card's header line (`metalLeanLine`). The
  legacy sentence counted FOOTING among 5 conditions (the circularity
  D-GB-5 removed) and, post-flip, would have been the only
  footing-counted prose left on the page — twice (open + collapsed),
  directly contradicting the card's own counts line on the same card.
  ONE new sibling key `metalLeanLanes` ('{metal}: {lean}, {counts}' /
  '{metal}: {lean}؛ {counts}') + one rule home
  (`balanceVerdictWordOf` + `balanceVerdictCountsParts`, exported from
  BalanceScale — the same words the card renders); gold's header lean
  icon rides the balance verdict; silver keeps the legacy per-condition
  sentence everywhere (its own model is unchanged, OI-4). fa triaged
  round-78 (1 string, copy:audit clean; the ModelVsRealityPanel
  manifest entry deleted per the workflow's expected manual edit).
- **Tests:** balance.test.tsx REWRITTEN 46 → 22 (the pure law kept
  verbatim — §4, §6 minus the pan-sizing test, §5.1/§13 + the new
  rule-home describe; §A/§B + the rendered-legacy + integration
  describes retired with the legacy branch) · outlook.test.ts 26
  UNCHANGED (outlookOf's contract tests stay as the silver leg; the
  framing comments updated) · gold-balance-lanes.test.tsx 44 → 53
  (the flag-hook + flag-off pins retired; +AC-1, +the fresh
  flipped-view snapshot pin (determinism guard first), +the
  unconditional-visual pin, +5 collapsed-prose/header pins incl. fa,
  +3 moved dictionary-coverage incl. metalLeanLanes, +the order test,
  +the PricesBoard pin) — 101/101 across the three files.
- **Harness:** gb-s4-visual.plw.ts's default-view tests CONVERTED (both
  legs now read the flipped view + the byte-identical inert-param
  proof; 66 tests) + prod-verify.mjs CONVERTED (the matrix's two legs
  are now the-default-page + the-inert-parameter, both asserting the
  lane balance, the panels absent, AC-8's honesty elements, the
  wind-word scan and the header's lane prose; the outlook probe
  unchanged). The union probes ride their `?balance=lanes` navigation
  (inert post-flip) unchanged.
- **Bundle re-baseline (the promised downward move):** measured on the
  branch build — Insights lazy **1526.97/354.18** (from GB-S5's
  1550.94/358.99; −23.97 kB raw / −4.81 kB gz), the chunk re-hashed
  `Insights-Ck9A6XE3.js` → `Insights-TjkEDaYV.js`; the ceiling
  re-based 1560/360 → **1535/355** with the justification in
  scripts/check-bundle-budget.mjs. The entry chunk 294.45/88.48
  (budgets 296/89.5 hold).
- **Docs (drafted on the branch):** GOLD_SCORE_SPEC.md (the top note +
  §4.4: panels retired from the UI, engine + goldSummary stay) ·
  docs/INDICATORS_AND_DATA_SOURCES.md (the one-balance note on the
  /api/insights shape) · AGENTS.md (the gold-balance paragraph: the
  flag language retired, the P5 state staged) · the spec README's
  Status line (P0–P4 IMPLEMENTED; P5 staged pending the recorded
  "go") · docs/DEPLOY.md (the session note with the deploy fields
  PENDING until the flip lands) · this PROGRESS.md + CHANGELOG
  [2026-11-04c] · PROMPTS.md (the GB-S7 rewrite).
- **Local gates (the branch):** the full `pnpm gates` ALL 9 GREEN —
  **14,578** tests (web 12,619; baseline 14,618 − the retired
  panels/legacy tests + the new pins) · typecheck 6/6 · lint 0/0
  (0 warnings — the rAF-clock change cleared the purity false
  positive) · copy:audit clean (round-78) · narrator vocabulary in
  sync · layer1 strict · secret scan clean · the bundle check green
  at the re-based ceiling. The gb-s4 standing guards re-run on the
  branch build: **67/67 (gb-s4-visual 61 + the union probes 6)** (gb-s4-visual 61 + the union probes 6,
  via visual/playwright.config.ts from apps/web).
- **THE GATE — satisfied, and the flip shipped (2026-11-04, the GB-S6b
  continuation session):** the owner's recorded "go" ("GO, I love the
  result so far." — chat, 2026-11-04, with "COMMIT PUSH MERGE ON THE
  MAIN BRAIN DEPLOY") + the OI-1 decision ("Keep the forecast wording,
  but with hedging language" — the shipped sentences already carry the
  hedging, both locales, so they ship unchanged). The execution, per
  DEPLOY.md's [2026-11-04c] AT-FLIP-TIME procedure verbatim:
  deploy-lock check CLEAR (production at `a803f526` @ 100% / deployment
  `754dccb6` — GB-S5's, no parallel session) → **PR #22 merged
  `4f192c9`** (marked ready + merged with a merge commit; CI `gates`
  green on the branch — runs 41766830519 on `83adbdb` and 126554141955
  on `cc1ba2c` — and on main, run 41827725767) → build + deploy (**currena-api
  `0e7d7cb8` @ 100%, deployment `7c6a0315`, 2026-11-04T12:21:01Z**; the
  built Insights lazy 1526.97/354.18 exactly at the re-based ceiling) →
  smoke green (health ok/kv ok · `/` 200 · `/api/insights` 200, fresh
  at 12:18Z — the Worker's own minute-cron ingest healthy) → **the
  production matrix 8/8 PASS, ZERO console errors** (prod-verify.mjs:
  both legs — the default page and the inert `?balance=lanes`
  parameter, proven byte-identical in all 4 EN/fa × 360/1280 cells —
  render the lane balance: 4 weights + 4 ledger rows, Balanced /
  «متعادل», the Split/«دوپاره» badge, the lane-derived outlook reading
  **neutral** in every cell with the hedged sentence, the context line
  + measured note + backtest link visible without a tap, the header
  lane prose "Gold: Balanced, 0 for · 0 against · 4 not leaning" /
  «طلا: متعادل؛ ۰ موافق · ۰ مخالف · ۴ بدون گرایش», the wind scan
  clean in both locales, zero overflow, ZERO console errors) → the
  deployed chunk `Insights-B4EBvpCM.js` fetched from currena.ir and
  measured **1,526,974 bytes, byte-identical to the verified local
  build**.
- **A pre-existing, UNRELATED failure noted honestly (not this
  program's):** the scheduled `insights-ingest` GHA run on the merge
  commit (run 41827914050, event=schedule — the belt-and-braces venue)
  failed on P1 FX fetches (frankfurter: dollar-basket, usdjpy, audusd,
  audjpy, gold-aud, audnzd — last good values held, flagged stale; the
  designed "product degraded" exit). The Worker's own minute-cron —
  the PRIMARY venue — was healthy (the live snapshot at 12:18Z is
  fresh) and the flip diff touches web UI + docs only. Flagged for the
  owner; not a balance regression.

### GB-S7 (2026-11-04 ~14:1x–1x:xx UTC) — OI-3: the wire cleanup, behind its own hard gate

- **Branch:** `gold-balance/oi3-cleanup` — the PR
  `gold balance(OI-3/GB-S7): the wire cleanup — goldSummary off the wire + the wind copy keys retired`.
- **The hard gate (both legs verified before any edit):**
  1. The GB-S1 recheck record exists — GOLD_RECHECK_SPEC §1's two
     2026-11-03 state-of-record lines + PROGRESS.md's own precondition
     note; production at the flip's `0e7d7cb8` @ 100% (deployments API
     checked, no supersession); the live API carrying goldSummary
     (netScore −1 / headwind / 5 firing — the last wire reading, recorded
     here as the retirement's "before" anchor).
  2. The owner's explicit in-session approval — asked BEFORE any edit,
     with the §3 finding disclosed in the question itself (the recheck
     procedure READS goldSummary: Step 1's live anchor + Step 5's
     stamped-vs-rederived no-drift contract → the removal requires the
     procedure+spec update in the same change). **Answer: "Approve both"
     (2026-11-04, recorded in the session).**
- **The wind copy keys (03 §6.4, both locales):** the 14 goldScore keys
  (title, subtitle, labels, noReadWord, netFiringLine, netFiringNone,
  laneCountsLabel, laneCountsLine, subGaugeWords, impactWords,
  votersTitle, votersNone, footnote, measuredNote) + ALL of
  goldModelVsReality retired from insights-copy-en.ts + insights-copy-fa.ts;
  their 46 manifest entries deleted in the same commit (the one manual
  manifest edit the workflow prescribes); **copy:audit ends CLEAN** on
  the retired shape. The five survivors — laneNames / voterNames /
  tiltWords / evidenceWords / measuredNoteLink — verified against
  MergedCard (the ONLY reader; BalanceScale/verdict/Signals read none)
  before deleting. The moved dictionary-coverage guard trimmed with the
  keys (the lanes suite 53 → 51) and now also PINS the retirement
  (labels/subGaugeWords/impactWords/measuredNote/goldModelVsReality
  asserted absent, both locales).
- **The wire field:** `goldSummary` retired from
  InsightsSnapshotSchema + the three ingest stamp sites (the 04:10
  build, the 04:20 patch, the public projection). **GoldSummarySchema
  STAYS exported** — the frozen gold-score.test.ts round-trips it and
  gold-score.ts types its return against it (the engine's own output
  contract; D-GB-9 held: gold-score.ts, goldTailwindScore and the
  harness tables untouched, byte-for-byte). Stored snapshots that
  still carry the field parse clean — zod strips the unknown key
  (pinned by the two new snapshot tests + the two updated schema
  tests; the retired stamping tests replaced by the retirement pins).
- **The recheck lineage (updated in the SAME change, as the approval
  required):** gold-corpus-dump reads the historical stamps from the
  RAW archive JSON pre-parse (post-removal the zod parse strips the
  field, which would have silently blinded the no-drift contract);
  GOLD_RECHECK_SPEC §3 Step 1 re-anchored on the readings +
  breakeven-tilt + health, Step 3's stamp note added, Step 5 re-worded
  to the STAMPED ERA (2026-10-31 → the retirement rung), §6 rule 4
  scoped to stamped days. The retirement rung = the first ingest rung
  after this deploy; every later archive day honestly reports
  present:false.
- **Gates:** ALL 9 GREEN — tests **14,574** (core 195 · scraper 67 ·
  insights 1,283 · markets 13 · api 399 · web 12,617; the honest −4
  from the 14,578 baseline: two guard tests + two stamping tests
  retired into the tighter pins); copy:audit clean; narrator
  vocabulary regenerated (the dictionary hashes moved — the retired
  words were not narrator vocabulary, the counts stayed 190+56);
  **Insights lazy 1520.84 / 352.54 — DOWN from 1526.97/354.18**
  (the retired copy left the chunk; ceiling 1535/355 holds with more
  headroom).
- **The standing guards:** the gb-s4 suite re-run on the retired
  shape — **67/67 PASS** (gb-s4-visual 61 + the union probes 6, the
  flipped-view snapshot pin included: the balance renders
  byte-identically, as it must — it never read a retired key).
- **Deploy + production verification:** the api worker redeployed
  (the snapshot shape changed on /api/insights) — the deploy-lock
  check cleared against the flip's `0e7d7cb8` @ 100% first; smoke:
  health ok + `/api/insights` 200 WITHOUT goldSummary (the wire
  contract of this round) + the page rendering the lane balance
  identically, EN + fa, 360 + 1280, fresh contexts, ZERO console
  errors. The executed facts are in DEPLOY.md's session note.

## The final acceptance walk (04 §6 AC-1..AC-12 + 05 §12 V-1..V-10)

Walked at the staging (the local gates + the jsdom/Playwright suites)
and COMPLETED at the flip (the production columns below; 2026-11-04).
Every AC is green.

| ID | Criterion | Evidence (staged + production) |
|---|---|---|
| AC-1 | One gold instrument; no wind/model-vs-reality panel remains | The AC-1 pin (gold-balance-lanes.test.tsx): no `data-gold-panels`, no `#insights-gold-tailwind`, no `#insights-gold-model-vs-reality`, no `data-gold-label` anywhere; the flipped-view snapshot carries the balance only; the gb-s4/prod-verify probes assert the same in the browser |
| AC-2 | Every one of the 21 voters reachable from a lane chip | The ledger member-list pins (the fixture's 8-member borrowing-costs row + steady/unread groups + the deep links); balance.test.tsx's export-surface pin keeps the table intact (21, D-GB-9) |
| AC-3 | Balance + verdict word + gold Outlook from the same goldBalance() result | The strip-wiring === pins (unchanged from GB-S5); the collapsed takeaway AND the summary prose now ride the same result at both sites (the corner decision); the never-opposing matrix re-pinned |
| AC-4 | evalLeg only; no bespoke stress/expectations rule in the gold path | The doctored-conditions pin (re-run in the flipped default); the engine's imports unchanged (D-GB-9) |
| AC-5 | Fewer than GOLD_LANE_MIN_FIRING firing voters never moves the beam | The engine tests (15, GB-S2) + the crowd-minimum pins in the lanes suite (unchanged) |
| AC-6 | unread ≠ neutral in engine, UI and copy | The state words (round-77) + the counts-parts pins; the tray holds both, the words differ («قابل ارزیابی نیست» vs «بدون گرایش») |
| AC-7 | Gold's 30-day move is context, counted nowhere | The ±9% DOM decoupling pin + the footing-decoupling pin in outlook.test.ts (26); the context pill never green/red |
| AC-8 | The honesty rules visible on the card, EN + FA | The subtitle + measured-note + backtest-link pins (the lanes suite) + prod-verify's AC-8 probes; the link aims at BACKTEST-GOLD-LANES.md |
| AC-9 | goldTailwindScore, goldSummary + the frozen harness tables unchanged, tests pass | Held through P0–P5 (D-GB-9: gold-score.ts/schemas/snapshot.ts/apps/api untouched; the engine tests green) and CLOSED at OI-3/GB-S7 with the owner's recorded approval: the wire field retired (the frozen engine + GoldSummarySchema as its output contract stay; the engine tests still green, gold-score.ts untouched) |
| AC-10 | The calibration report exists, states n, pre-registered criteria, no edge | BACKTEST-GOLD-LANES.md (GB-S1, unchanged) |
| AC-11 | The 2026-10-31 fixture reproduces 01 §7 | The engine fixture test (GB-S2) + the fixture pins in the lanes suite (Balanced · 0-0-4) |
| AC-12 | All gates pass + the owner's approval recorded BEFORE the flip | ✅ SATISFIED — the owner's explicit "go" recorded in chat on 2026-11-04 ("GO, I love the result so far."), AFTER the live preview review and BEFORE the merge; the gates 9/9 GREEN 14,578 on the branch + CI green on branch and main; the merge `4f192c9` and the deploy `0e7d7cb8` @ 100% followed |
| V-1..V-10 | The visual criteria (05 §12) | ✅ The gb-s4 standing guards 67/67 (gb-s4-visual 61 + the union probes 6) — walked at GB-S4, unconditional since the flip, re-verified on the merged build in a fresh environment (GB-S6b); the production matrix confirms the same view for every visitor; **V-11 = the owner's live read — SATISFIED: "GO, I love the result so far." (2026-11-04)** |

## Owner must decide

1. **THE P5 DECISION — DECIDED (2026-11-04):** the owner reviewed the
   live preview and recorded the explicit "go": **"GO, I love the
   result so far."** — followed by "COMMIT PUSH MERGE ON THE MAIN
   BRAIN DEPLOY." The flip shipped the same hour (PR #22 `4f192c9`,
   worker `0e7d7cb8` @ 100%, the 8/8 production matrix above).
2. **OI-1 — RESOLVED (2026-11-04, with the go):** "Keep the forecast
   wording, but with hedging language." The shipped sentences already
   carry the hedging — EN "Signs point to a potential rise/decline…",
   fa «نشانه‌ها حاکی از احتمال…» — so they ship UNCHANGED in both
   locales; the 03 §6.3 consequence stands (no advantage claimed
   anywhere; the measured note + the backtest link stay visible on the
   card). No rewording session is needed; 03 §6.3's proposed table
   stays on file as an option the owner can revive anytime.
3. **OI-2 shipped** (the Split badge / «دوپاره», GB-S4) and rode the
   owner's P5 review — live for every visitor since the flip.
4. **The collapsed-corner decision rode the P5 review and is LIVE:**
   the gold summary prose (the collapsed line AND the card header) on
   the lane model (`metalLeanLanes`, fa round-78); silver keeps the
   legacy sentence (OI-4). Confirmed in the production matrix (the
   header lane prose read in all 8 cells).
5. **OI-5 — the final owner read DONE** (the "go" above covers it:
   every fa string reviewed + fingerprinted, rounds 76–78).
6. OI-3 (goldSummary + the wind copy keys retirement) — **RESOLVED
   (2026-11-04, GB-S7):** the owner's explicit in-session approval
   recorded ("Approve both", after the verified preconditions + the
   disclosed §3 recheck dependency); both retirements executed with the
   recheck procedure + spec updated in the same change; the program
   closed at this round. OI-4/OI-6 unchanged (kept as recorded).

## Standing constraints (every session)

- D-GB-9: `gold-score.ts`, `goldSummary`, `GoldSummarySchema`,
  `snapshot.ts`, `apps/api/**` and the frozen harness tables are NEVER
  edited by this program; the new work is additive. *(Held through
  P0–P6; the ONE sanctioned exception — `goldSummary`'s wire field +
  the snapshot stamp sites, with `gold-score.ts` itself untouched —
  was OI-3/GB-S7's own owner-gated round, executed 2026-11-04 with
  the recorded approval; `GoldSummarySchema` stays exported as the
  engine's output contract. The constraint's original form is the
  P0–P5 rule; see 04 §1's note.)*
- No forecasting edge is claimed anywhere, ever — the standing no-edge
  record (GOLD_BACKTEST_SPEC §5, the round-55 note) is the operative
  description until a stated-in-advance rule says otherwise.
- Full `pnpm gates` green before every push; branch + PR per phase;
  self-merge when the phase's exit gate holds; deploy only when the built
  worker changes (docs + scripts + tests sessions deploy nothing).
