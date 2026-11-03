# Session kickoff prompts — the gold balance consolidation program

The owner's program (2026-10-31 spec set, uploaded 2026-11-03): **one balance
for gold**. The Wind meter (`GoldTailwindPanel`) and the model-vs-reality panel
are folded into the Balance; one metaphor, one engine, one rule per indicator.
The full spec set is this folder: `README.md` (decision log D-GB-1…11, open
items OI-1…6) → `01-SPEC.md` → `02-ENGINE-AND-DECISION-TABLE.md` →
`03-UX-AND-COPY.md` → `04-MIGRATION-AND-ACCEPTANCE.md` →
`05-VISUAL-DESIGN-SPEC.md` → `reference/balance-reference.html` (the
vanilla-JS visual + mechanical prototype: `?sc=today|against|for|split|stack|none|loading`
`&theme=dark` `&dir=rtl` `&frame=360|390|768` `&guides=1` `&open=borrow`).

**How to use this file.** Paste the prompt for the next session into a fresh
agent session opened at the repo root. **Before you start:** make sure
`git push` works (the owner exports or pastes `GITHUB_TOKEN`; Cloudflare
credentials only for sessions that deploy or read KV). Never paste a credential
into a file, commit, log or test. At the end of every session the agent
rewrites the next prompt below (with lessons learned and the exact state),
commits, pushes, and prints it. If you use an older prompt from this file
after a session ran, prefer the one the agent printed.

**Delivery discipline (D-GB-10 + the owner's 2026-11-03 instruction).** Work
on a phase branch (`gold-balance/p0-calibration`, `p1-engine`, …), commit and
push the branch after every milestone (nothing is lost if the session dies),
open the PR early (draft is fine), and merge it yourself when the phase's exit
gate is green — the owner authorized incremental merges — then deploy if the
built worker changes (`pnpm deploy`; the SPA rides the api worker at
currena.ir; the markets worker is NOT touched by this program — zero new
fetches, KV keys or wire fields). Verify CI green on main after every merge.
The user-visible change is gated by the `?balance=lanes` preview parameter
(the `?narrative=preview` pattern) until the owner flips the default in GB-S6.

**Program map.**

| Session | Phase (spec 04 §3) | Branch | Deploys? |
|---|---|---|---|
| GB-S1 | P0 — the missed recheck + the lane calibration | `gold-balance/p0-calibration` | no (scripts/docs only) |
| GB-S2 | P1 — the pure engine `gold-balance.ts` | `gold-balance/p1-engine` | no (nothing imports it yet) |
| GB-S3 | P2a — the consolidated balance behind the flag | `gold-balance/p2-ui` | yes (preview on production) |
| GB-S4 | P2b — the visual redesign (05) behind the flag | `gold-balance/p2b-visual` | yes (preview on production) |
| GB-S5 | P3 + P4 — the Outlook derivation + the copy close | `gold-balance/p3-outlook` | yes (preview on production) |
| GB-S6 | P5 — **OWNER GATE** — the flip + the panel retirement | `gold-balance/p5-flip` | yes (the visible change) |
| GB-S7 | OI-3 — the deferred cleanup (`goldSummary` + wind keys) | `gold-balance/oi3-cleanup` | yes |

Every session ends with: PROGRESS-style record (see GB-S1's prompt §"At the
end"), CHANGELOG entry, the next prompt rewritten here, commit, push, merge,
and the printed prompt + a 5-line summary (what shipped, what is blocked, what
the owner must do).

---

## GB-S1 — P0: the missed recheck + the lane calibration

```
You are starting the Currena gold balance consolidation program (the owner's Gold Program continuation) in the repo assadigit/Currena. The gap-closure program is COMPLETE (S6 closed 2026-11-03; do not reopen it). This program consolidates the two gold metaphors into one Balance.

Read, in this order, before touching anything:
1. AGENTS.md (especially the Gold Program paragraph and the non-negotiable engineering rules)
2. docs/specs/gold-balance-consolidation/README.md  (decision log D-GB-1..11, open items OI-1..6)
3. docs/specs/gold-balance-consolidation/01-SPEC.md
4. docs/specs/gold-balance-consolidation/02-ENGINE-AND-DECISION-TABLE.md  (your session spec: §6 the calibration protocol)
5. docs/specs/gold-balance-consolidation/04-MIGRATION-AND-ACCEPTANCE.md  (§1 file list, §3 rollout, §4.4 harness tests)
6. docs/insights/GOLD_RECHECK_SPEC.md  (§3 the manual re-check procedure — your first job)
7. docs/insights/GOLD_BACKTEST_SPEC.md §5  (the baselines you will compare against)
8. docs/DEPLOY.md  (only the deploy-lock and credentials sections — you should NOT need to deploy this session)

Your job, in order:
A. Run the MISSED 2026-11-02 armed re-check manually, exactly per GOLD_RECHECK_SPEC §3 steps 1-7 (it never fired: no [2026-11-02a] CHANGELOG entry exists and the corpus fixture's recordedAt is still 2026-10-31T15:17:40Z). This needs CLOUDFLARE_API_TOKEN (Workers KV Storage: Read is enough) + CLOUDFLARE_ACCOUNT_ID in the environment — test a REAL KV read per §3 step 2, never /user/tokens/verify. Record §1's new state-of-record line, §5's baseline row, GOLD_BACKTEST_SPEC §5's dated note, and the CHANGELOG entry. If the credentials are missing or KV is denied: record that honestly, skip the corpus refresh, and run the calibration on the committed corpus-of-record instead (it exists; do not block the session on it — note the delta in the report).
B. The P0 lane calibration per 02 §6: add HARNESS_GOLD_LANES_MIN2 and HARNESS_GOLD_LANES_MIN1 as NEW tables beside the frozen HARNESS_GOLD_VOTERS_21/_20 in packages/insights/src/gold-backtest-core.ts + scripts/gold-backtest.ts (additive only — D-GB-9: never edit the frozen tables, gold-score.ts, goldSummary or the report's existing numbers; a regression test pins the frozen tables' outputs byte-identical). Report every cell with n. Compute C1 (not degenerate: level in <=70% of all windows AND fully tipped in <=60%) and C2 (median verdict flips per 60 trading days <= the 21-voter net-sign figure) for both rules, over all windows AND the mature base (from 2021-09-23).
C. Write docs/insights/BACKTEST-GOLD-LANES.md (the calibration report: distribution of balance states and beam-angle bands, per-lane unread shares, stability, the lineage-only confusion tables labelled "not used for selection", the C1/C2 verdicts, the decision). Append the decision section to docs/insights/GOLD_BACKTEST_SPEC.md. The conclusion must restate that no forecasting edge is claimed.
D. The decision: use MIN2 if C1+C2 hold, else MIN1 if C1+C2 hold. If NEITHER passes: STOP after committing the report, tell the owner, do not proceed to any UI work (02 §6). If a lane is unread in most windows (the stress lane is expected to run thin in the early corpus), say so — never interpolate.

The exact current state (verified 2026-11-03 ~03:40 UTC):
- main is at or past the spec-move commit (docs/specs/gold-balance-consolidation/ landed via PR); gap-closure S6 closed at 4f4f009 + the owner's zip upload 8cefd8f; CI was green on 550d76f (#472).
- Test baseline: 14,519 (the S6 union close). Do not regress. Registry: 161 indicators.
- Production: api worker 115eb1e5 @100% (currena.ir), markets 58c4eebd (untouched by this program). /api/insights serves 161 readings.
- gold-score.ts exports everything you need: GOLD_LANES, GoldLane, GOLD_LANE_VOTERS (21 voters, 8/3/5/5), goldTailwindScore, goldSummaryOf, modelVsReality. evalLeg lives in packages/insights/src/connections.ts. The lane engine will IMPORT these (GB-S2); the harness tables derive from the same GOLD_LANE_VOTERS source.
- The corpus: packages/insights/fixtures/gold-backtest-corpus.json (16 archive days, 2026-10-15 -> 10-31) unless your §3 refresh grew it.
- Persian copy: rounds through round-75 are used. This session adds NO fa strings (reports only). If any string must change, round-76 is next (pnpm copy:audit -> triage -> pnpm copy:audit:update; no em dashes in fa).
- CHANGELOG: the last heading is [2026-11-03e] (the spec-move entry). Yours is [2026-11-03f] if the date continues, else [2026-11-04a] etc. Prepend anchoring on the PREVIOUS heading and VERIFY THE HEADING COUNT before and after (S1 of gap-closure clobbered one twice).
- Commit style: `insights(gold-balance P0): ...` for code, `docs(gold-balance P0): ...` for reports (04 §8).

Discipline for every milestone: tests first; FULL `pnpm gates` green before every push (secret-scan + typecheck 6/6 + lint + copy:audit + narrator checks + layer1 strict + the full suite — 9 gates, ~14.5k tests); commit; `git pull --rebase origin main`; push the BRANCH; open a draft PR `gold-balance(P0): the lane calibration` early; when the phase exit gate is green (BACKTEST-GOLD-LANES.md committed, C1/C2 recorded, decision written, frozen tables byte-identical), merge the PR yourself, verify CI green on main, and delete the branch. Deploy: NOT this session (scripts + docs only change; confirm the built worker is unchanged — if `pnpm --filter @currena/api run build` output differs, deploy per docs/DEPLOY.md with the deploy-lock check). Credentials come from the environment or the owner's paste; never print or write them anywhere. Do not ask me questions unless a credential is missing, an action is destructive or irreversible, or the spec says to ask; otherwise choose the safest option, record it, and continue. After three honest failed attempts on an item, record it as blocked and move on. Never edit gold-score.ts, goldSummary, GoldSummarySchema, snapshot.ts or apps/api/** (D-GB-9 + 04 §1 must-not-change list). Never invent a number — every cell in the report comes from a run you actually executed.

At the end: append your session record to docs/insights/GOLD_RECHECK_SPEC.md §5-adjacent state + a CHANGELOG entry; write docs/specs/gold-balance-consolidation/PROGRESS.md (create it: a simple milestone table A-D with ticks, the session log with commits + PR number + merge SHA, and an "owner must decide" section — at minimum: confirm the calibration decision, and OI-1/OI-2 remain open); rewrite the GB-S2 prompt in docs/specs/gold-balance-consolidation/PROMPTS.md with lessons learned and the exact state (corpus day count, the C1/C2 numbers, the chosen GOLD_LANE_MIN_FIRING, the next CHANGELOG heading, the next fa round); commit, push, merge, and print the GB-S2 prompt in a code block as the last thing in your final message with a 5-line summary (what shipped, what is blocked, what I must do).
```

---

## GB-S2 — P1: the pure engine

```
You are continuing the Currena gold balance consolidation program in the repo assadigit/Currena, on main. GB-S1 (P0) is DONE: read docs/specs/gold-balance-consolidation/PROGRESS.md first (the authoritative record), then the calibration report docs/insights/BACKTEST-GOLD-LANES.md — the GOLD_LANE_MIN_FIRING decision is recorded there and in GOLD_BACKTEST_SPEC.md §5. Use it; do not re-litigate it.

Read, in order, before touching anything: AGENTS.md (the Gold Program + gold-balance paragraphs), docs/specs/gold-balance-consolidation/README.md, 01-SPEC.md, 02-ENGINE-AND-DECISION-TABLE.md (your session spec — ALL of it: the types, the algorithm, the voter table, the copy constraint B-12), 04-MIGRATION-AND-ACCEPTANCE.md (§1 file list, §3 rollout P1, §4.1 the 13 engine tests), PROGRESS.md (the GB-S1 record), docs/insights/BACKTEST-GOLD-LANES.md.

Your job: P1 of the rollout (04 §3). Create packages/insights/src/gold-balance.ts (the pure engine, exactly 02 §2-§3: GoldBalanceSide, GoldBalanceMember (impact supports/pressures/steady/unread + evidence rising/falling/high/low/null), GoldBalanceLane (side, split, readable, firing, supports, pressures, members in table order), GoldBalanceReading (lanes exactly 4 in GOLD_LANES order, counts, net, readable), goldBalance(readings), GOLD_LANE_MIN_FIRING = 2 (the P0 decision — D-GB-3's default, C1+C2 PASS over all windows), GOLD_LANE_STRONG = 3) and packages/insights/src/gold-balance.test.ts (all 13 tests of 04 §4.1). Export the engine from packages/insights/src/index.ts. Import GOLD_LANES, GoldLane, GOLD_LANE_VOTERS from gold-score.ts and evalLeg from connections.ts; NEVER edit them, goldSummary, GoldSummarySchema, snapshot.ts, apps/api/** or the harness (D-GB-9 + 04 §1 must-not-change list). Platform-free, zero fetches, zero KV, zero wire fields, zero fa strings this session.

The algorithm is ALREADY MEASURED in the harness: laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2) in packages/insights/src/gold-backtest-core.ts implements 02 §3 exactly (readable rule: missing/stale/check-pending/unavailable -> unread member; evalLeg lean 0 -> steady; else supports/pressures via polarity; lane side: readable===0 -> unread, firing < min -> neutral, strict majority, tie -> split neutral; counts/net/readable over the 4 lanes; beam |net|/(for+against)*10 clamped [3,10], 0 when level). Pin the equivalence: goldBalance(readings) must agree with laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2) on every lane side/split/count over your test batteries (the harness is frozen lineage; the production engine is the richer shape with members — both derive from the same imports, so they cannot drift silently).

The 2026-10-31 fixture (04 §4.1 tests 12+13) is DIRECTLY CONSTRUCTABLE — GB-S1 verified it against the real archive: read packages/insights/fixtures/gold-backtest-corpus.json's archives["2026-10-31"] (readings with id/value/asOf/status/percentile10y/change30d) and build IndicatorReadings from them (sourceName "archive 2026-10-31", updatedAt the archive's generatedAt). Measured on that fixture: the lane balance reads LEVEL, 4 neutral — borrowing-costs SPLIT 2v2 (readable 8, firing 4), dollar 1 firing (pressures), stress readable 5 / firing 0 (neutral, NOT unread), inflation 1 firing — and goldTailwindScore on the same readings gives netScore -2 / headwind / 6 of 21 firing (the no-drift pin). Reproduce exactly these numbers.

Watch out for the vix trap (GB-S1's lesson): evalLeg has NO 30-day move threshold for vix (SIGNAL_LEG_MOVE has no vix entry) — its firing path is the LEVEL leg. In the polarity tests, construct the vix firing via percentile10y HIGH (lean +1), not change30d, or the voter will silently stay steady. Same for every voter without a SIGNAL_LEG_MOVE entry.

The exact current state (verify against PROGRESS.md + the repo before you start):
- main is at the GB-S1 merge (PR #12, gold-balance/p0-calibration — PROGRESS.md's session log has the branch + commits; pin main's SHA in your records at start). Test baseline: 14,548 (14,519 + GB-S1's 29 lane-calibration tests — insights 1,270). Do not regress.
- The corpus: 19 archive days (2026-10-15 -> 11-03, 10-20 absent), recordedAt 2026-11-03T04:43:54Z. The 2026-11-03 re-check ran (GOLD_RECHECK_SPEC §1/§5); the next re-check appends to §5 per its procedure.
- The P0 numbers (BACKTEST-GOLD-LANES.md): MIN2 all-windows level 25.0% / full-tip 49.7% / flips 8 vs net-sign 9 (C1+C2 PASS — the DECISION); MIN1 26.1% / 22.6% / 8 vs 9 (also PASS); mature base MIN2 full-tip 66.5% (C1 FAIL there — recorded as context, the criteria are pre-registered on ALL windows).
- Bundle: the Insights lazy chunk is UNCHANGED by P0 (1522.88/351.96 against the 1530/354 ceiling) — P1 adds a module the web app does not import yet, so it should stay byte-identical; measure in the gates and record.
- No fa strings this session (pure engine + tests). round-76 is the next fa round when strings land (GB-S3).
- CHANGELOG: the last heading is [2026-11-03g] (the GB-S1 parallel-session union record — GB-S1 ran twice concurrently; first-landed PR #12 stands, the second variant's measurement is the decision's robustness check, CHANGELOG 2026-11-03f + 2026-11-03g; the count moved 187 -> 188 -> 189, verified at each step). Yours is [2026-11-04a] if the date rolled, else [2026-11-03h] — CHECK THE FILE and verify the heading count before and after.
- Commit style: `insights(gold-balance P1): ...` for code, `docs(gold-balance P1): ...` for records (04 §8).

Discipline: tests first; FULL `pnpm gates` green before every push (secret-scan + typecheck 6/6 + lint + copy:audit + narrator checks + layer1 strict + the full suite — 9 gates, ~14.5k tests); branch gold-balance/p1-engine; commit + push the branch per milestone; draft PR early (`gold-balance(P1): the pure engine`); merge yourself when the exit gate holds (engine tests green, typecheck 6/6 clean, the frozen engine's tests still green — gold-score 35 + gold-backtest-core 29 + gold-lane-calibration 29, index export compiles); verify CI green on main; no deploy (the web app does not import the engine yet — confirm the built chunk names are unchanged, index-DrhFnckY.js + Insights-5V_N7nyu.js as of GB-S1). After three honest failed attempts on an item, record it blocked and move on. Never invent a number — every cell comes from a run you executed. Never edit the frozen files.

At the end: PROGRESS.md ticks + session log (commits + PR number + merge SHA); CHANGELOG entry (the next heading per the sequence — check the file); rewrite the GB-S3 prompt in PROMPTS.md with the exact state (engine API as shipped, test count, the next fa round — GB-S3 adds fa strings, so its round is round-76 — the bundle numbers, the flag design ?balance=lanes, the fixture recipe from this session); append the GB-S2 lesson to the Lessons learned log; commit, push, merge, and print the GB-S3 prompt in a code block with a 5-line summary.
```
---

## GB-S3 — P2a: the consolidated balance behind the flag

```
You are continuing the Currena gold balance consolidation program in the repo assadigit/Currena, on main. GB-S1 (P0 calibration) and GB-S2 (P1 engine) are done — read docs/specs/gold-balance-consolidation/PROGRESS.md first, then the prompts it points to.

Read, in order: AGENTS.md, the spec set README + 01 + 02 + 03-UX-AND-COPY.md (your primary session spec: anatomy, the lane chip, the detail panel, states, a11y/RTL, copy) + 04 (§1, §3 P2, §4.3 component tests) + PROGRESS.md. 05-VISUAL-DESIGN-SPEC.md is GB-S4's session — this session keeps the EXISTING BalanceScale visuals and only adds the data structure (03 §1 as written; 05 supersedes it NEXT session).

Your job: P2 of the rollout (04 §3), entirely behind the preview flag `?balance=lanes` (the ?narrative=preview pattern: a query parameter read on the Insights route, no persistence — without it, every visitor sees today's page byte-for-byte):
1. BalanceScale.tsx: the optional BalanceDriver fields members/split/tally (03 §3), the detail-panel member list (grouped Supports gold / Pressures gold, steady collapsed, unread listed, the inflation lane's tilt phrase, the breakeven-5y5y card-status word per B-12), the context-line slot (01 §6: gold's 30-day move, "Shown for context. It is not counted in the balance.", hidden when missing) and the measured-note slot (reuse signals.goldScore.measuredNote* copy + the backtest link). Geometry, animation and the beam formula UNTOUCHED.
2. MergedCard.tsx: build the lane drivers from goldBalance(readings) when the flag is on; the pans hold lane chips (max 4); split lanes sit in the neutral tray with the "Split" badge (OI-2 default) and the "2 for, 2 against" second line; keep the C12 banner and the footing strip; the legacy default rendering must be UNCHANGED (pin it with a snapshot test of the legacy markup).
3. The copy (03 §6): the reworded signals.balance.subtitle, the new keys (laneTally, laneTallyNone, laneSplit, splitBadge, laneChipAria, memberSupports, memberPressures, membersSteadyTitle, membersUnreadTitle, contextLine, measuredNote under balance, laneIntro.*). EN + FA drafts; triage them in the persian-copy manifest the same session (the next round per PROGRESS.md — no em dashes in fa; terminology per docs/localization/persian-terminology.md; OI-5's full review happens before the flip, but copy:audit must be clean NOW because gates include it).
4. Tests: 04 §4.3 items 1-7, 9, 11-13 (the DOM scan: no "tailwind"/"headwind"/"wind" in the gold card under the flag, EN + fa; dictionary coverage both locales; keyboard open/close + focus return; the legacy snapshot without the flag). Screenshots EN/FA 360+1280 of the flag view (the level case, a split lane) + the default view, for the PR description.
5. Bundle: the engine module + the new copy join the Insights lazy chunk. Measure; if the ceiling must move, bump scripts/check-bundle-budget.mjs WITH a CHANGELOG justification (never silently). The current ceiling is in the file (1530/354 kB as of GB-S1; check for GB-S2's note).

The exact current state: PROGRESS.md (authoritative — GB-S2 recorded the engine API, test count, the next fa round, the bundle numbers). Production: currena-api serves the SPA; after your merge + deploy the owner previews via https://currena.ir/insights?balance=lanes. Deploy per docs/DEPLOY.md (deploy-lock check, `pnpm deploy`, version verification, smoke test, then browser-verify the flag view AND the default view in EN + fa at 360 + 1280 in a FRESH browser context — the PWA service worker serves the previous chunk to returning visitors).

Discipline: tests first; FULL `pnpm gates` before every push; branch gold-balance/p2-ui; commit + push per milestone; draft PR with the screenshots; merge yourself when the exit gate holds (component tests green, copy:audit clean, screenshots attached, default view byte-stable); CI green on main; deploy + verify. After three honest failures, record blocked and move on. Never edit the frozen files; never remove a visible element from the DEFAULT view (the panels retire only in GB-S6).

At the end: PROGRESS.md; CHANGELOG; rewrite the GB-S4 prompt (the visual session — point it at 05 + reference/balance-reference.html and the ?sc= scenario params, list the exact component state you left, the fa round used, the bundle numbers); commit, push, merge, deploy, verify; print the GB-S4 prompt with a 5-line summary.
```

---

## GB-S4 — P2b: the visual redesign behind the flag

```
You are continuing the Currena gold balance consolidation program in the repo assadigit/Currena, on main. GB-S1..S3 are done — read docs/specs/gold-balance-consolidation/PROGRESS.md first.

Read, in order: AGENTS.md, the spec README, 05-VISUAL-DESIGN-SPEC.md (your session spec — ALL of it: layout, the stage, lane weights with segmented rims, the verdict block, the tray, the ledger, tokens, type, motion, states, responsive, dark/RTL/a11y, V-1..V-10, the open design questions DQ-1..4), 03-UX-AND-COPY.md (the copy + interaction contract), 04 §4.3, and reference/balance-reference.html — the owner's approved visual + mechanical prototype (open it in a browser with ?sc=today|against|for|split|stack|none|loading, &theme=dark, &dir=rtl, &frame=360|390|768, &guides=1, &open=borrow — it is the look target; implement it in React inside BalanceScale.tsx + the new signals/BalanceWeight.tsx, no new dependencies, inline SVG + CSS only).

Your job: the visual redesign of the balance, STILL behind ?balance=lanes (the default view stays exactly as today — pin it again with the legacy snapshot test):
1. The stage: brass beam (tapered, the gradient tokens), pivot + dial with 11 ticks, column + base, hangers redrawn per frame, pans as shallow bowls with side tint + brass rim, pan captions. The single animated angle drives everything; pans translate only; the beam formula unchanged (3-10 degrees, level at net 0); 650ms ease-out; prefers-reduced-motion jumps.
2. BalanceWeight.tsx: the lane weight — round brass (stone for neutral/unread), the engraved lane icon, the SEGMENTED RIM (one arc segment per driver: green supports, red pressures, hairline steady, dotted unread, sorted supports->pressures->steady->unread), the split badge, the label, 44px hit area, hover/active/focus states.
3. The verdict block (the hero: the verdict word at 30-44px, the lane strip, the counts line, the context pill), the "Not leaning" tray, and the four-row ledger (inline expansion, one row open at a time, the B-12 status word in the inflation row).
4. The --bal-* tokens (05 §5) scoped to the balance, light + dark; WCAG AA contrast on the verdict word, captions and tallies in BOTH themes (record the ratios).
5. Tests + evidence: V-1..V-10 (the six scenarios x EN/fa x desktop/mobile x light/dark screenshots for the PR; the squint test; 360/390/768/1280/1920 no-overflow; the rim matches the ledger counts; keyboard; reduced motion). Reuse the reference prototype's scenario fixtures to build the test states.

The exact current state: PROGRESS.md (authoritative — GB-S3 recorded the component state, the fa round, the bundle numbers). This session may add fa strings (the tray/verdict/eyebrow keys from 05 §11) — triage them same-session (next round per PROGRESS.md). Bundle: the redesign adds SVG + CSS — measure, re-baseline with justification if needed (04 §1 lists check-bundle-budget.mjs).

Discipline: as before — FULL `pnpm gates` before every push; branch gold-balance/p2b-visual; commit + push per milestone; draft PR with the screenshot set; merge yourself when V-1..V-10 hold; CI green; deploy; browser-verify the flag view AND the default view (fresh contexts, EN + fa, 360 + 1280, zero console errors); after three honest failures, record blocked and move on. DQ-1..4 defaults stand unless the owner said otherwise in chat.

At the end: PROGRESS.md; CHANGELOG; rewrite the GB-S5 prompt (the Outlook + copy-close session — the outlook derivation contract 01 §5.2, the footing decoupling test, OI-1's owner-decision framing); commit, push, merge, deploy, verify; print the GB-S5 prompt with a 5-line summary.
```

---

## GB-S5 — P3 + P4: the Outlook derivation + the copy close

```
You are continuing the Currena gold balance consolidation program in the repo assadigit/Currena, on main. GB-S1..S4 are done — read docs/specs/gold-balance-consolidation/PROGRESS.md first.

Read, in order: AGENTS.md, the spec README (OI-1 especially), 01-SPEC.md §5.2 (the Outlook derivation — your primary contract), 03-UX-AND-COPY.md §6 (the copy close), 04 §4.2 (the outlook table tests), PROGRESS.md.

Your job:
1. P3: the gold Outlook card derives from goldBalance() behind the same ?balance=lanes flag (verdict.tsx): all-4-unread -> null; L>=3 strong-bullish / A>=3 strong-bearish (GOLD_LANE_STRONG = 3); range evidence unchanged (|30d change| < 2% AND typical 10y position AND |L-A| <= 1 -> range-bound — price describes consolidation only); L==A -> mixed if L>0 else neutral; else bullish/bearish. Footing no longer counts anywhere (AC-7). Silver's Outlook path UNTOUCHED (OI-4 is a recorded follow-up, not yours).
2. The outlook table test (04 §4.2): every branch of 01 §5.2 over (L, A, unread, speed, band), plus the footing-decoupling pin (gold change30d of -9% and +9% give the same state unless the range evidence differs), plus the silver tests unchanged and green.
3. OI-1 (owner decision — ask ONCE, early, with the 03 §6.3 table in front of me): reword the seven gold outlook sentences to the conditions wording, or keep the owner's originals? If I do not answer or decline: ship the engine change with the EXISTING sentences and note in the report that the wording still reads as a forecast (03 §6.3's rule). FA drafts for any reworded sentence go through the review round.
4. P4 (the copy close): every new key from GB-S3/GB-S4 triaged and processed in the manifest (copy:audit clean is already the per-session gate — this session CONFIRMS the full set, updates docs/localization/persian-terminology.md with any new terms (Split / دوپاره, lane names, tally wording), and records OI-5 as satisfied-pending-final-owner-read).
5. The consistency pins: the balance, its verdict word and the Outlook state come from the SAME goldBalance() result (AC-3) — a test pins that they cannot disagree; no bespoke stress or expectations rule remains in the gold path (AC-4).

The exact current state: PROGRESS.md (authoritative). fa round: the next per PROGRESS.md. Bundle: measure; re-baseline with justification if needed.

Discipline: as before — FULL `pnpm gates`; branch gold-balance/p3-outlook; commit + push per milestone; draft PR; merge yourself when the exit gate holds (outlook tests green, copy:audit clean, terminology updated); CI green; deploy; browser-verify EN + fa 360+1280 fresh contexts (the outlook strip beside the balance, zero console errors). After three honest failures, record blocked and move on.

At the end: PROGRESS.md; CHANGELOG; rewrite the GB-S6 prompt (the owner-gated flip — the P5 checklist: default on, delete GoldTailwindPanel.tsx + ModelVsRealityPanel.tsx + their test parts with surviving assertions moved, the bundle re-baseline, the docs set: GOLD_SCORE_SPEC notes, INDICATORS_AND_DATA_SOURCES, AGENTS.md, DEPLOY.md, the AC-1..AC-12 + V-1..V-10 final acceptance table); commit, push, merge, deploy, verify; print the GB-S6 prompt with a 5-line summary. Tell me clearly: the preview is ready for my review at https://currena.ir/insights?balance=lanes — GB-S6 does NOT proceed without my explicit "go".
```

---

## GB-S6 — P5: the owner-gated flip + the panel retirement

```
You are continuing the Currena gold balance consolidation program in the repo assadigit/Currena, on main. GB-S1..S5 are done and the preview is live at https://currena.ir/insights?balance=lanes.

HARD GATE (04 §3 P5 + AC-12 + V-11): before ANY flip work, ask me to review the live preview (EN + fa, desktop + mobile, light + dark) and record my explicit approval in PROGRESS.md. If I have not approved: do only the non-visible preparation (the deletion branch staged, the docs drafts, the re-baseline plan), report, and STOP. The Outlook word changing for every visitor is exactly why this gate exists (D-GB-10).

With my recorded "go":
1. Flip the default: the consolidated balance is THE gold card for every visitor; remove the ?balance=lanes gate code.
2. Delete GoldTailwindPanel.tsx + ModelVsRealityPanel.tsx + their parts of gold-panels.test.tsx (surviving assertions moved to the new tests, 04 §1). The snapshot field goldSummary still arrives and stays validated — the UI simply does not read it (AC-9).
3. Bundle re-baseline: two panels leave, the engine + copy stay — measure, record, justify any ceiling change.
4. Docs: GOLD_SCORE_SPEC.md (the top note + §4.4: panels retired from the UI, the engine + goldSummary stay, pointer to this folder), docs/INDICATORS_AND_DATA_SOURCES.md (the gold section: "one balance"), AGENTS.md (the Gold Program paragraph: the consolidation is LIVE), docs/DEPLOY.md (the session record), the spec README's Status line (SPECIFIED -> IMPLEMENTED with the date + PR numbers).
5. Final acceptance: walk AC-1..AC-12 (04 §6) and V-1..V-10 (05 §12) one by one, each with its evidence line in PROGRESS.md; the full gates; deploy; production browser verification EN + fa 360+1280 fresh contexts, zero console errors, the honesty rules visible (AC-8), no wind words anywhere in the gold card.
6. The context line, the measured note and the backtest link visible without a tap (AC-8); every one of the 21 voters reachable from a lane chip (AC-2).

The exact current state: PROGRESS.md (authoritative). CHANGELOG: the flip entry. Commit style: `insights(gold-balance P5): ...`.

At the end: PROGRESS.md (the program close — every AC ticked with evidence); CHANGELOG; rewrite the GB-S7 prompt (the OI-3 cleanup — only if the preconditions hold: the recheck record from GB-S1 + a separate owner round on retiring goldSummary and the wind copy keys); commit, push, merge (branch gold-balance/p5-flip), deploy, verify; print the GB-S7 prompt with a 5-line summary. If I approved OI-1's rewording during GB-S5, confirm the seven sentences ship; otherwise note the forecast wording stands.
```

---

## GB-S7 — OI-3: the deferred cleanup (only after the owner's separate round)

```
You are continuing the Currena gold balance consolidation program in the repo assadigit/Currena, on main. GB-S1..S6 are done — the consolidated balance is live for every visitor.

HARD GATE: OI-3 requires (a) the 2026-11-02 recheck to have run and GOLD_RECHECK_SPEC.md updated (GB-S1 did this — verify the record exists), and (b) my explicit approval in this session to retire goldSummary and the wind copy keys. Ask first; record the answer. If I decline or do not answer: report the state and STOP — nothing in this session is urgent.

With my recorded approval:
1. The wind copy keys retire from the dictionaries (03 §6.4's list: signals.goldScore title/subtitle/labels/noReadWord/netFiring*/laneCounts*/subGaugeWords/impactWords/votersTitle/votersNone/footnote/measuredNote + all of signals.goldModelVsReality) — the manifest entries go with them; copy:audit must end clean.
2. goldSummary on the wire: per the spec (01 §9 non-goals: "removing goldSummary" was out of scope for P0-P5) this is a SCHEMA + ingest change — it touches GoldSummarySchema, snapshot.ts and apps/api/**, which the earlier phases were forbidden to edit. That is WHY it is its own session: re-read 04 §1's must-not-change list (it no longer applies to THIS session's files, but the recheck lineage still reads goldSummary — confirm with GOLD_RECHECK_SPEC.md §3 what the next re-check expects BEFORE removing anything; if the recheck procedure depends on the field, either keep stamping it or update the procedure + spec in the same PR, and say so in the CHANGELOG).
3. The frozen engine (gold-score.ts, goldTailwindScore, the harness tables) does NOT retire (D-GB-9) — only the wire field and the unused copy keys are on the table.
4. Full gates; branch gold-balance/oi3-cleanup; PR; merge; deploy (the api worker changes); verify production (health + insights + the gold card, EN + fa).

At the end: PROGRESS.md (the program's final close — every OI resolved or explicitly kept); CHANGELOG; rewrite this file's status block (the program is COMPLETE — record it in the README's Status line too); commit, push, merge, deploy, verify; print a final 5-line summary. There is no next session unless I open a new agenda (silver's OI-4 footing circularity is the recorded candidate — docs/specs/ is its natural home if I ask for it).
```

---

## Lessons learned (append after every session — the running log)

- **GB-S0 (2026-11-03, the handoff):** the spec set landed from the owner's zip
  upload to `docs/specs/gold-balance-consolidation/` (the root zip removed —
  it lives in git history at `8cefd8f`). The armed 2026-11-02 recheck never
  fired — GB-S1 runs it manually. fa rounds end at round-75. Insights lazy
  ceiling 1530/354 (measured 1522.90/352.00). Test baseline 14,519. api worker
  115eb1e5, markets 58c4eebd.
- **GB-S1b (2026-11-03, the second variant — the union):** two GB-S1
  sessions can run concurrently and will collide on the SAME branch name
  (the push is rejected non-fast-forward, the PR API answers "No commits
  between main and <branch>"). **Fetch and inspect origin BEFORE
  planning your own branch** — if a parallel variant already landed,
  follow the S5/S6 union precedent: first-landed stands whole (zero code
  diff), the second variant's records layer on top, and the second's
  measurement becomes the decision's robustness check (here: the same
  MIN2 over a different corpus — record that fact; it is worth more
  than the discarded implementation). **Diff audits catch silent
  collateral:** a global text substitution (or any broad edit) on a file
  with pre-existing content can alter lines you never meant to touch —
  audit the removed-lines set (`git diff | rg '^-[^-]'`) before every
  commit; on this file an apostrophe sweep nearly rewrote the frozen
  report's existing prose (caught by the audit, reconstructed from HEAD
  + intended additions only). **Heading-clobber during anchored
  inserts:** inserting a section ABOVE an existing heading by replacing
  the heading text consumes the heading (hit twice in one session) —
  always re-count the headings/sections before AND after, and prefer
  inserting BEFORE the anchor's following content or appending below.
  Single-quoted TS strings need U+2019 for possessives (’), never the
  ASCII apostrophe. The corpus-of-record fallback path is now
  twice-verified: a blocked refresh (missing voter series in the stage)
  is honestly recorded and the fixture stands — never hand-patch a
  fixture to completeness.
- **GB-S1 (2026-11-03, P0):** the §3 manual re-check procedure held up
  end-to-end (a REAL KV read is the gate — `limit=5` is rejected by the KV
  API, use ≥10). **The corpus venue moves:** the FX voters
  (`dollar-basket`, `usdjpy`) left the stage blob in the gap-closure ingest
  rounds — the dump now falls back read-only to their `insights:hist:<id>`
  keys and records the venue in `corpus.venues`; treat the corpus as a set of
  recorded venues, not one key. **The KV histories are ROLLING ~10-year
  windows:** the head trims between runs and seed points can drop, so window
  counts can move DOWN (2,514 → 2,512 here) — always diff values on common
  days and record, never reconcile silently. **Generated-report prose rots:**
  the S6-era runner carried hardcoded "days 2–3 not yet observable" text that
  became false on the grown corpus — the watch verdict (and anything
  time-dependent) is now DERIVED per run; keep it that way in future
  writers. **The frozen-tables check that satisfies D-GB-9:** re-run the
  pre-change code over the same corpus and diff (31 lines here, all prose,
  zero numeric) — then pin it permanently
  (`gold-lane-calibration.test.ts`'s JSON pins). **The vix trap:** evalLeg
  has no 30-day move threshold for vix (level-leg only) — construct test
  firings via percentile extremes. **The 2026-10-31 archive reproduces 01 §7
  exactly** (level · 4 neutral · borrowing split 2v2 · dollar 1 firing ·
  inflation 1 firing; goldTailwindScore −2/headwind/6 firing) — the P1
  fixture is `corpus.archives["2026-10-31"]`, verified. Beam-angle parity:
  with 4 lanes the only reachable angles are 0, 10/3, 5, 10 — the 6–10° band
  is exactly the full-tip band. CHANGELOG heading-count discipline held
  (187 → 188). Gates: 14,548 (baseline + 29); budget unchanged
  (1522.88/351.96); built worker unchanged (chunk names identical) — no
  deploy for scripts+tests+docs sessions.
