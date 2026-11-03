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
| G | P2b: the visual redesign of the balance behind the same flag (05) | ✅ DONE (GB-S4, 2026-11-03) — branch gold-balance/p2b-visual; the owner's 05-VISUAL-DESIGN-SPEC implemented from the approved reference prototype: the brass stage (beam + 11-tick dial + column + bowl pans), the lane WEIGHTS with segmented rims (the NEW BalanceWeight.tsx), the verdict word as the hero, the Not-leaning tray, the four-row inline LEDGER (the same member content contract); --bal-* tokens light+dark with the measured AA ratios (the full table in evidence/gb-s4/README.md); the default view still byte-identical (the snapshot pin untouched, the 46 pure-geometry tests green); 14 new copy keys EN+fa through round-77; the lane tests rewritten 19 → 35 + the gb-s4 Playwright V-1..V-10 suite (61 tests, 6 engine-verified scenarios, 70 screenshots); gates 9/9 GREEN 14,598 (web 12,623 → 12,639); Insights lazy 1550.46/358.81 — ceiling 1560/360 justified |

Next: GB-S5 (P3+P4 — the Outlook derivation + the copy close), then
GB-S6 (P5 — **the owner-gated flip**), GB-S7 (OI-3,
its own owner round).

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

## Owner must decide

1. **Confirm the calibration decision** (or reverse it): the pre-registered
   rule selected **MIN2** (`GOLD_LANE_MIN_FIRING = 2`, D-GB-3's default) —
   and the parallel-session union measured it TWICE, independently, over two
   different corpora (the corpus-of-record 16-day run and the fresh 19-day
   run): the same criteria verdicts, the same decision, from two hands.
   The measured tables are in `docs/insights/BACKTEST-GOLD-LANES.md`; the
   one number worth your eyes is the mature-base row: from 2021-09-23 the
   MIN2 balance reads fully tipped (10°, one-sided) in **66.5%** of windows
   (over ALL windows: 49.7%, inside the ≤60% criterion). That is the
   honest shape of 2021–2026's macro (the same era the frozen table reads
   headwind-heavy) — if you want a calmer recent beam, MIN1's mature
   full-tip is 30.7% (and MIN1 also passed C1+C2); one constant decides.
   Reversing later means a dedicated gated session (the 02 §6 protocol
   again), never a silent edit.
2. **OI-1 remains open:** the Outlook sentences still state a forecast the
   backtest does not support — the rewording (03 §6) rides GB-S5 (P4);
   the fa round for it is round-78 (round-77 was GB-S4's visual copy).
3. **OI-2 is now visible in the redesigned preview:** the split badge
   ships as "Split" / «دوپاره» behind `?balance=lanes` — now rendered
   as the weight's badge + the ledger's "Split: 2 for, 2 against"
   state word. The owner's live read of the REDESIGN (V-11: the look
   itself, plus the split badge OI-2 and the calm-stress semantic
   02 §4.1) belongs to the P5 decision.
4. No other open item moved this session (OI-3's precondition — the re-check
   record — is now satisfied; OI-4/OI-5/OI-6 unchanged).

## Standing constraints (every session)

- D-GB-9: `gold-score.ts`, `goldSummary`, `GoldSummarySchema`,
  `snapshot.ts`, `apps/api/**` and the frozen harness tables are NEVER
  edited by this program; the new work is additive.
- No forecasting edge is claimed anywhere, ever — the standing no-edge
  record (GOLD_BACKTEST_SPEC §5, the round-55 note) is the operative
  description until a stated-in-advance rule says otherwise.
- Full `pnpm gates` green before every push; branch + PR per phase;
  self-merge when the phase's exit gate holds; deploy only when the built
  worker changes (docs + scripts + tests sessions deploy nothing).
