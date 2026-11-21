# HANDOFF — Currena current state & next steps

## This session (2026-11-2x — GUX Session 8 COMPLETE: the mobile-first refinement, interactions and accessibility; merged to main and deployed)

**What the owner asked for (this session's prompt):** Session 8 of 9 per the master plan + the S7 pointer — the cross-page QA remediation over the S4 patterns' shipped state, with 11 §8 (the LABEL contract) + §12 read FIRST, the budget measured at EVERY milestone (240,000/55,500; the S7 close's ~15.7 kB raw headroom), Q2 stays closed, Q3 PRESENTED not decided (the gated implementation HELD; the ungated remediation meanwhile), and no Session 9 work.

**M0 the baseline audit:** `probe-s8-audit.mjs` (the nine-pass matrix) — its findings drove the session, including THREE defects the earlier sessions' evidence had hidden: (1) **the S5–S7 "dark" screenshots were LIGHT** (the harness wrote the inert `currena:theme`; the app reads the LEGACY `theme` key — the S8 set re-captures with the real key, its dark pairs measured RGB ≈ 30); (2) **the sticky nav was INVISIBLE while stuck since S5** (`sticky top-0` slid under the FIXED global header's z-1000 — the S6 captures show no chips); (3) **the partial-data crash** (below).

**M1 mobile 390 as a deliberate layout:** the section nav rebuilt as the ONE-row chip-scroller (the shipped pattern: nowrap + hidden scrollbars + JS-toggled direction-aware fades + the active chip centered, RTL-safe) — the en 3-row 132px wrap → 56px one row; chips 36→44px; the touch floor on the primary controls (the ledger link 23→44, the Signals toggle 24→44, the secondary cross-links ≥24, the inline sentence links the documented 2.5.8 exemption); the five-force patterns at 390 verified already-right (the lanes stack full-width, BeamGlyph + brass-on-tap, no truncation).

**M2 RTL/LTR + light/dark:** no horizontal overflow at 390/360/1440 en+fa both themes (held at EVERY milestone); the fa labels ride the scroller; the RTL fade on the LEFT edge verified; the sticky chrome never obscures content or focus.

**M3 the interaction contract:** the chart inspector's MISSING text equivalent fixed (a persistent polite live region reads the selected point — value + unit + full date — on every arrow/Home/End; Escape clears; 11 §8 E); the premium + vault charts' names upgraded from title-only to full readings (4 keys, both locales, copy round 94, the manifest 9,269); the sheet contract verified at BOTH widths (the same component: the desktop inline-end sheet + the mobile bottom sheet, with the focus trap, Escape, focus return, scroll lock).

**M4 the contrast matrix AS A CHECK:** `gux-s8-checks.plw.ts` (13 validations, the `gux-s8` playwright project) — the matrix in both themes × both locales with a hex/rgb/color(srgb)/oklab parser + THE TOKEN RULE (every sampled status color IS a resolved theme token) + the overflow sanctity + the touch floors + the LABEL census (expanded + the roleless-chart sweep) + the inspector readout + the sheet's two geometries + color-not-alone + reduced motion — plus the GLOBAL reduced-motion guard in index.css (the nine surviving chevron transitions now comply by construction). The measured matrix passes everywhere (the dark floor 4.77:1).

**M5 the honest states:** `gux-s8-states.plw.ts` (7 forced-state tests + captures over route interception): loading, error (+the working retry), stale/cached («آخرین نسخهٔ سالم»), unavailable, insufficient-history, partial-data, discoverability — **and the real bug the pass caught: the narrative's `windows.reduce` had no initial value, so a projection with the price reading absent CRASHED the whole route** (the error boundary instead of the honest partial page); fixed + the regression pin.

**M6 the close:** the docking fix (the nav now sticks UNDER the fixed header per 11 §12's own words — `top-16/lg:top-20` + the shared `.gold-anchor-mt` 124/140px, the anchor jumps clear by 4px, verified at both widths); the 38-capture evidence set (`baseline-screenshots/s8/` + the README); **Q3 PRESENTED (report §5): silver's canonical home — (A) the ratio-only home RECOMMENDED, (B) keep-but-secondary, (C) a dedicated silver home — the gated implementation HELD, the four-lane ledger's fate rides the answer**; the report `16-responsive-accessibility-report.md`, S8-D1..D7. **The gates 10/10 GREEN** (the record in the report §8); GoldPage **225.97/50.70 under 240/55.50** at every milestone (~14.0 kB raw headroom; no ceiling ask all session). The merge + the deploy with the D-43 re-check first (the record in `docs/DEPLOY.md`).

**The program counter: Session 8/9 complete · 1 remaining.** Q3's answer is S9's first input; Q2 stays closed by design.

## This session (2026-11-20 — GUX Session 7 COMPLETE: the owner's Q1 answered B + the lower-page S4 patterns; merged to main and deployed)

**What the owner asked for (this session's prompt):** the Q1/Q2 answers read FIRST — **Q1 = B** (adopt the five-state wording), **Q2 closed** (no horizon/scenario until a validated method; the bans hold) — then Session 7 of 9 per the master plan + the S7 pointer.

**M1 Q1-B executed:** the five-state CONDITIONS word (08 §8.1's reviewed drafts) replaces the 7-state market vocabulary at BOTH word-rendering surfaces (the gold page's BriefingCard + the /global Gold Balance tile) through ONE pure fold — `outlook-five-state.ts` (shared/components, beside the protected classifier; the fold consumes `OutlookState`, never re-derives; a parity pin proves the seven states still come out of `goldOutlookOf` — GB-S5 untouched). The counts + the not-a-forecast caveat ride the word, always. **Q2 stays closed** (pinned: no horizon chip, no scenario row, the §8.4 bans hold).

**M2 the bridge's regional chrome** (12 §3.3 row 5): `--color-bridge-accent` (Carbon Teal 50/40, both themes — S7-D2) ring-2 + the REGIONAL chapter chip ("Regional market · Tehran · Toman (IRR)"), on both the loaded and fail-closed frames.

**M3 the one LaneBar everywhere** (12 §3.3 rows 3 + 8): the on-ramp's drivers 1/2/3/5 close with the LaneBar (the education card and the live meter read the same goldBalance lanes — they can never disagree; driver 4 display-only); the time machine's five lane chips upgraded to compact LaneBar rows (steady = readable − firing, the wire's own complement).

**M4 the ProbabilityRow set** (12 §3.3 row 4): the expectations' five outcome rows carry the neutral-ink 0-100 probability bars (the venue's own yesPrice×100; the % text stays the statement; the framing locked).

**M5/M6 the close:** **10/10 gates GREEN (3m 20s)** — the suite **15,658** (+8 positive-only), lint 0/0, copy:audit clean (**round 93**; the five fa drafts PROCESSED — the owner approved the wording by choosing B), every budget held (**GoldPage 224.27/50.19 under 240/55.50 — no ceiling ask all session**). The 22-screenshot set (`baseline-screenshots/s7/` + the README) + two new fixture-server routes (the expectations key + the global projection). The report `15-session-7-implementation-report.md`, S7-D1..D5. The deploy per DEPLOY.md (the D-43 re-check first — the record there).

**The program counter: Session 7/9 complete · 2 remaining.** Q2 remains closed by design; Q3 (silver's canonical home) is S8's to decide.

## This session (2026-11-20 — GUX Session 6 COMPLETE: the relationship explorer + the context re-scope + the fa deep-content gap closed + the S5-pending deploy executed; merged to main and deployed)

**What the owner asked for (this session's prompt):** Session 6 of 9 (the gold UX redesign) — the relationship explorer (M1) · the context cards' re-scope (M2) · the Q1/Q2 owner gates presented and HELD (M3) · the fa deep-content gap (M4) · the sticky nav's S8-tier upgrade if time allows (M5) · the close (M6) — with the DEPLOY.md 2026-11-2x-c record checked FIRST (the token now carries the scripts scope: the S5 blocker cleared, `/workers/scripts` answers; production was still `4454212a` @ 100%, no drift).

**M1 the relationship explorer (12 §5.1–5.4 over 10 §5):** 10 §3's 25 R-records as the typed module `gold-relationships.ts` (M 14 · C 10 · X 1 · K 0; R-26 blocked-for-data — legend-only, never a canvas edge; both locales' one-liners as the FULL edge text) + the section `GoldRelationships.tsx` (list-first everywhere, the class chips always visible, the X pennant never fine print, the honesty footer, the class filters, the desktop canvas behind a toggle — gold hub, M solid / C dashed / K heaviest) + **the budget play**: the first build measured 260.38/61.58 (OVER both ceilings) — per S5-D1's standing rule the pre-authorized GoldTail pattern extended (the explorer rides its own near-viewport sibling chunk 21.52/7.54) and **GoldPage landed at 223.43/50.05 under 240/55.50, no ceiling ask**. The nav's seventh chip (Relationships).

**M2 the context re-scope (12 §3.1):** `ContextBandMark` — the 11 RatioCards' 10-year position bands at context strength (neutral ink, never an impact hue; fail-closed); the COT pair keeps the Chain-6 chips; gold-usd stays the hero only (F-06's dedup pinned by test).

**M3 the Q1/Q2 gates — PRESENTED, HELD (nothing renders; the BriefingCard pins 12/12):** **Q1** — keep the shipped 7-state presentation or adopt 08 §8.1's five-state drafts («شرایط به‌شدت از طلا حمایت می‌کند» … «فشار قوی بر طلا»), the honest caveat either way; the classifier itself is protected (GB-S5). **Q2** — no horizon chip / scenario row until a validated method exists and the owner approves it; the §8.4 bans hold (no probabilities, no price targets, no confidence numbers, no drawn price paths). **The owner's answers are the next session's first input.**

**M4 the fa deep-content gap (S5-D3's declared item, closed):** the blocked quartet's 12 EN-carried fields (whatItWouldShow/blockedReason/ownerLever) now fa-authored in 09's voice; the content pins updated (the fields left the locale-neutral set — they are locale content now).

**M5 the nav's S8-tier spy:** the IntersectionObserver upgrade (the plain rule unchanged, the no-observer fallback kept verbatim for jsdom/old browsers).

**M6 the close:** **10/10 gates GREEN (3m 9s)** — the suite **15,650** (+11 positive-only over the S5 close), lint 0/0, copy:audit clean (**round 92**, the manifest 9,259: the 25 chrome keys + 25 record one-liners + 12 re-authored fields), every budget held. The 20-screenshot set (`docs/gold-redesign/baseline-screenshots/s6/` + the README). The report `docs/gold-redesign/14-session-6-implementation-report.md`, S6-D1..D6. **The S5-pending deploy executed** per the 2026-11-2x-c runbook (the D-43 re-check FIRST — `4454212a` no drift; the build + deploy + the live verification; the record in `docs/DEPLOY.md`).

**The program counter: Session 6/9 complete · 3 remaining.** The Q1/Q2 answers are the standing owner asks.

## This session (2026-11-2x — THREE sittings in one conversation: (A) the S4 close-out ops + integration — DONE AND VERIFIED LIVE; (B) Session 5 opened — M1/M2/M3a done, the Q4 stop recorded; (C) Session 5 COMPLETED — the owner's Q4 answer A executed, M3b/M4/M5/M6 all done, merged to main and deployed)

**What the owner asked for (this session's prompt):** "Please first push commit deploy merge and everything of this session 4, then we go to session 5" — with fresh credentials (a GitHub token · a Cloudflare Workers deploy token + the account ID · an EODHD API key · a second Workers-AI-scoped token). **Milestones:** M1 the credential verification + the gates re-run on the S4 tree · M2 the push of the S4 branch + `main` · M3 the PL-1 integration merge (the §15.4 discipline, executed the day it was written) · M4 the deploy + the live verification (the D-43 lock re-check first) · M5 the records (this block, DEPLOY.md, S4-D15, the CHANGELOG entry, the BD-S47 status note).

**Where S4 stood at this sitting's start (S4-D14):** complete in docs, fast-forward-merged to the local `main` only — the origin push had been BLOCKED by the invalid GitHub token; `origin/main` sat at the S3 close `921821fb`; the recovery bundle + patch series recorded. **What this sitting found on arrival:** the new GitHub token VALID (the blocker cleared) — but `origin/main` had moved past `921821fb`: the owner-directed **PL-1 parallel-lane protocol** (`9121ee22`, committed from a parallel checkout two minutes after S4's close — the very disruption class the protocol answers; its records still read the gold program at 3/9 because S4 had never reached origin). The integration follows the protocol's own §15.4: **merge, never rebase-rewrite**; the three root-bookkeeping conflicts (HANDOFF · CHANGELOG · DECISIONS) consolidated keeping BOTH sessions' records; `pnpm gates` green on the merged tree (the count is now 10 — PL-1's lane-check is gate 2, `n/a` on `main`).

**The deploy posture (honest):** the merged tree is runtime-identical to production (S4 = docs-only; PL-1 = scripts/docs-only; production `5c34a14b` live) — §15.4's "docs-only waves deploy nothing" would hold — but the owner's instruction this sitting is explicit ("deploy") and the fresh EODHD key is the standing credential-rotation lever, so the sitting executes the 2026-11-19 precedent: the D-43 deploy-lock re-check FIRST (done at sitting start: `5c34a14b` @ newest, no drift), the build, the wrangler deploy (a code-identical re-anchor expected), the EODHD secret re-put on BOTH workers, and the full live verification. The results are appended to this block at the sitting's close (S4-D15 carries the record).

**The results (all milestones done):** M1 ✅ the credentials verified (the GitHub token VALID — the S4-D14 blocker cleared; the Workers deploy token VALID; the second AI-scoped token INVALID 401 and design-unneeded per D-41 — recorded, not wired) · M2 ✅ the gates on the S4 tree 9/9 GREEN (3m 4s; the suite 15,599 IDENTICAL — the zero-delta proof) + the S4 branch pushed · M3 ✅ the PL-1 integration merge (conflicts consolidated keeping both sessions' records) + the merged-tree gates **10/10 GREEN** (3m 1s; the suite 15,599 IDENTICAL again; PL-1's lane-territory check is gate 2, `n/a` on `main`) + `main` pushed → **`origin/main` = `01928d71`** · M4 ✅ the deploy: the D-43 lock re-checked clean → currena-api **`58aaaf89`** (the platform reported "No updated asset files to upload" — the code-identical re-anchor) → `EODHD_API_TOKEN` re-put on BOTH workers with the fresh owner key (the now-active **`4454212a`** @ currena-api; **`4ba79366`** @ currena-markets, code-unchanged → not deployed, secret re-put only; currena-api's full secret set re-verified intact) · M5 ✅ the records (this block, `docs/DEPLOY.md`'s 2026-11-20b sitting record, S4-D15, the CHANGELOG entry, the BD-S47 status note). **Live verification ALL GREEN:** `/api/health` 200 · the gold projection + the 8 gold-family planes 200 · `gold-episodes` 503 = the DESIGNED WGC-workbook waiting state · the workers.dev twin 200 · the served `index.html` + entry `index-BqnATyD-.js` + CSS `index-BYs2IdzG.css` byte-verified IDENTICAL to the fresh dist. **Known state (post-sitting):** production = currena-api **`4454212a` @ 100%** (the secret-put's version over the code-identical `58aaaf89` re-anchor); `origin/main` = `01928d71` (S4 + PL-1 integrated; the S4 branch also on origin); the GoldPage budget 238.90/49.57 under 240/50 and the copy manifest at round 90 — both untouched (no runtime/fa-string change). The gold program counter: **Session 4/9 · 5 remaining; the S5 prompt is at the bottom of this file, now on the integrated tree.**


**Session 5 progress (this same conversation, the sitting's second half — on the branch `feat/gold-redesign-s5-briefing`, NOT yet merged):** the program's first implementation session opened per the S5 prompt with the three reading agents' extractions (the S4 specs' contract, the gold code audit, the master-plan scope) and delivered three verified milestones: **M1 the content foundation** (commit `8793d0bd`) — 09's records transcribed byte-faithful into the typed content module (`features/gold/content/`: the eager brief tier [37 voters × plainLabel+defaultCopy] + the lazy deep tier [all 52 records, two per-locale dynamic imports] + the accessor + the count/parity tests; the audit's SOURCES/parity extended to the four content files per 08 §9's "same audit discipline" contract; the S3-D4 five-group label finals live in all four dictionary/corpus files with the pin green; the manifest round 91 opened [persian-copy-round-91-gux-s5-content.md]) · **M2 the primitives** (commit `8ff3893d`) — the three S4-D2 token consolidations executed (--shadow-card/--shadow-focal promoted + retargeted across eight surfaces; --color-accent-gold-strong defined; the GB-S6 byte-pin regenerated consciously, the diff audited as exactly the one class substitution), the LaneBar (the ONE lane-summary renderer: the anatomy, the two-channel lane-level rule, the proportional mirrored pill, the split/unread honesty rules) and the AsOfChip (the ONE freshness grammar); 17 fa strings triaged in round 91 · **M3a the hero components** (commits `e51bd9eb` + the S5-D3/D4 records) — the BriefingCard (the single focal element: kicker/headline/Q1-container/reasons/what-could-change/evidence + AsOfChip; THE Q1/Q2 GATES HELD — no horizon chip, no scenario row, no five-state word) + the CompositionStack (①–⑤: the verdict once, the brass ≥lg / BeamGlyph + brass-on-tap below, the five LaneBars, the #gold-seats ledger anchor, the caveat) + the pure derivations (S5-D2's transparent rules). **Verification at every milestone:** the web suite 13,239 passed (100 files), typecheck 6 packages, copy:audit CLEAN (9,173 entries), secret scan clean, the budget MEASURED — GoldPage 238,782/49,362 under 240/50 (unchanged: the components land in the chunk at the wiring), entry 271,125/81,975 under 296/89.5. **The M3b sitting (commits `f4188a4c` + `c1d533aa`, pushed):** M3b-0 the Zone O tail split executed FIRST (the budget-maker: GoldPage 238.78/49.51 → 209.13/44.91; the tail chunk 31.81/6.60 behind GoldTail's near-viewport boundary, the sections' DOM/anchors verbatim) · M3b the hero rebuild (the price block + GoldPriceSpark HouseTimeSeries + the ONE AsOfChip + the BriefingCard with its reason rows wired to the details panel + the CompositionStack; the view radio RETIRED; F-07 fixed — the duplicate #gold-zone-d gone, the bal-* gradient ids scoped per instance; six tests rebased + the GB-S6 snapshot consciously updated; the web suite 13,239 green; copy:audit clean at round 91, the manifest 9,177). **⚠→✅ THE Q4 GATE RESOLVED (the owner chose A) and the session COMPLETED:** the gz ceiling 50,000 → 55,500 executed with the inline justification + the tail chunk's own 34/8 ceiling (BD-S49, S5-D7; the raw ceiling STAYS 240,000) · **M4 the five-force overview** (`086d55e3`) — the LaneBar summaries + the closed member cards (the 11 §7.3 anatomy) with the SeatMark marks (12 §2's map) + the GoldRecordSheet (09's expanded + technical tiers over the lazy deep chunks [en 55.91/17.91 · fa 80.09/19.69]; the sheet's chrome on its own lazy chunk 6.52/2.11 — the raw-budget split when M4 breached 240) · **M5 the dedup + the sticky nav** (`a4d6f5c1`, 11 §5.4) — the Signals card's second BalanceScale RETIRED (the lane drill-in of five #lane-{lane} links in its place; the page's ONE instrument is the hero's CompositionStack), the VerdictStrip's focal recipe RETIRED (the BriefingCard wears the page's single focal treatment), GoldSectionNav (the sticky-nav foundation, F-03's fix) · **M6 the close** — **10/10 gates GREEN** (4m 46s; the suite **15,639** = +40 positive-only over the S4 close; the narrator vocabulary REGENERATED after the gate caught the laneDrillLabel insights-copy drift; lint 0/0), **28 screenshots** over the fixture server (en/fa × desktop/mobile × light/dark — the hero, the five-force section, the record sheet, the full page; the structural probes confirm the RTL mirror, the scrim, the pills; `baseline-screenshots/s5/README.md`), the records (the implementation report 13 · S5-D5..D8 · BD-S49 · this block · the CHANGELOG entry · the DEPLOY record). **THE BUDGETS LAND: GoldPage 238.96 raw / 55.14 gz — both ceilings held with headroom** (the raw ceiling never raised). The branch merged to `main` per the session pattern and PUSHED (`origin/main` = `d3554b9f`); the deploy is BLOCKED by credential scope (see DEPLOY.md 2026-11-2x-c).
## Previous session (2026-11-21 — PL-1, the parallel lane protocol: concurrent agents can now work different pages without disrupting each other: DONE IN CODE AND DOCS, not deployed — tooling/protocol only, no runtime code, no deploy needed)

**What the owner asked for (this session's prompt):** "add something in code base or rules that we always make sure that agents can run parallel on different pages, so they never confuse with each other… do everything necessary to ensure next concurrent sessions will not be disrupted." The repo's per-page modularization is real; the disruptions came from the workflow — one shared checkout, every session rewriting the same root bookkeeping, agents filing each other's in-flight files, and both pushing `main`. This session encoded the fix into the repo itself, so every future agent inherits it automatically.

**What changed (the four pieces — BD-S48 is the decision record):**
1. **`AGENTS.md` §15 — the parallel lane protocol** (the only agent-instruction file, mandatory reading at every session start): one agent = one lane = one git **worktree** (`git worktree add ../currena-<lane> -b lane/<lane>-<topic> origin/main`); the **lane map** (each `features[-tools]/<name>/` folder + its `docs/<name>-*` program docs is that page's territory; `engine` = `packages/`, `backend` = `apps/api` + `apps/markets`; the shared surface — root bookkeeping, `shared/**`, `components/**`, `packages/**` for page lanes — is integration-only); **wiring** files a lane may append to but must declare (`App.tsx`, `router.ts`, `route-meta`, the i18n dictionaries, the Persian copy manifest, new `visual/` specs); **lane-local bookkeeping** (session records in `docs/sessions/`, never the root files — this overrides §2's HANDOFF write, §8's root tidy-up and §10's close-out for lane sessions); lanes never deploy and never push `main`; the **integration session** (§15.4) merges lane branches one at a time, gates green after each merge, consolidates the root bookkeeping, and deploys only if runtime code changed. Two copy-paste prompts (lane start + integration) are at §15.5.
2. **`scripts/lane-check.mjs` — the mechanical enforcement.** Dependency-free (node + git): auto-discovers the page/tool lanes from the feature folders, resolves the lane from the branch name (`lane/gold-ux-s4` → gold; longest-prefix match so `asia-pacific` parses), classifies every changed file (committed · staged · unstaged · **untracked** — new files in the wrong tree are caught too) as territory / wiring / session-record / violation, attributes each violation to its owning lane or the shared surface, and warns when the lane is missing from the registry. `--overlap` additionally fetches and intersects with other `origin/lane/*` branches; `--gate` is the gates form (n/a, exit 0, on `main` or any non-lane branch — the normal single-session flow is untouched).
3. **`scripts/gates.mjs` — the protocol is now gate 2 of `pnpm gates`** (right after the secret scan, fail-fast): a lane agent that edits outside its territory fails its own gates run — the enforcement is automatic, not aspirational. On `main` it reports `n/a — not a lane branch` and passes, so the normal flow and CI are unaffected. The gate count is now 10 (docs historically said 9/9; the summary line prints the live count).
4. **`docs/sessions/` + `ACTIVE-LANES.md` — the lane registry scaffold:** the open-lanes table a lane agent appends its row to at start (§15.1) and integration clears at merge; lane session records live here as `<date>-<lane>-<n>.md`.

**Verification (honest):** exercised `scripts/lane-check.mjs` directly in a scratch git **worktree** on a `lane/gold-…` branch through five scenarios — compliant session (2 territory + 1 wiring + 1 session record → `clean`, exit 0); committed-path re-check after commit (same verdict); violations (another lane's `features/usa` file → "lane usa"; an untracked new `shared/components` file → shared surface; a root `CHANGELOG.md` edit → shared surface; exit 1 with the fix instruction); a NEW `apps/web/visual/` spec file → correctly allowed as wiring (this caught and fixed a real bug: the `git()` helper returned `''` instead of `null` on failure, which misclassified new files); the `asia-pacific` longest-prefix branch parse; and the ACTIVE-LANES unregistered-lane warning. `node --check` passes on both scripts; `node scripts/lane-check.mjs --gate` on `main` → `n/a`, exit 0; their own `secret-scan.mjs` runs clean over the staged changes. The full `pnpm gates` suite was NOT run (no package code changed; the suite does not exercise the two node scripts beyond what was run directly — the same posture as the S3 docs-only session). Nothing deployed — no runtime code changed, production `5c34a14b` remains the live truth; the D-43 deploy-lock discipline is untouched (no deploy happened, so no re-check was owed).

**Known state (post-PL-1):** production = currena-api `5c34a14b` @ 100% (unchanged); `main` = this protocol (merged fast-forward from `docs/parallel-lane-protocol`); the GoldPage budget 238.90/49.57 and the copy manifest round 90 are untouched (no runtime/fa string change). **The gold UX redesign program stands at Session 3/9 · 6 remaining (S4 visual system · S5 primary briefing · S6 global context · S7 advanced/regional · S8 mobile/a11y · S9 final verification) — its own counter is untouched by this session; the S4 copy-paste prompt is at the bottom of this file.** The S3-D1 owner decision (run the missing Session 2 first, or accept S3's derivations) is still pending and carried forward.

**Running the gold redesign concurrently now:** the owner may start S4 as a gold lane (paste the §15.5 lane-start preamble above the S4 prompt at the bottom of this file; branch `lane/gold-ux-s4`, territory `features/gold/` + `docs/gold-redesign/`) while another agent runs any OTHER page/tool lane (e.g. `lane/usa-board`, `lane/backend-crons`, `lane/engine-*` serially) — then one integration session per §15.4. Rule of thumb: parallelize *different* pages; within one page the program's own one-session-at-a-time discipline (master plan §11.1) still applies.

## Previous session (2026-11-2x — Gold UX Redesign S4, the visual system and the metric-to-visual mapping: DONE IN DOCS, not deployed — docs-only session by design)

**What S4 did (design specification + prototype/reference work; no code, no runtime copy, no model surface, no deploy):** the visual language. `11-visual-design-principles.md` — the foundation audit (the shipped system KEPT: the Insights text ramp, the Carbon status palette + chip-ink siblings, the status-vs-return two-hue split, the house chart grammar, the balance's fidelity ladder, the brass assay language, the disclosure taxonomy, the i18n/RTL mechanics; one card language on /gold + the named small consolidations for S5/S6 [the two shadow tokens, the undefined `--color-accent-gold-strong`, the Sparkline hexes]; NO new hex anywhere); the editorial-analytical art direction with the three density tiers (Briefing spacious / Secondary compact / Advanced dense) and the one-focal-moment rule (the BriefingCard is the page's single gold-field element); the **five-state semantic map** (supports / pressures / steady-mixed [no hue] / unread [dotted, data-quality, never neutral] / blocked [recessed + lock]) with the **two-channel rule** (impact = status ink + word + glyph; direction = signed + triangle, return ink — a rising value can render green on one metric and red on its neighbor); the **Composition Stack** — the DUP-2 fix (① verdict once → ② one full instrument per page [brass at briefing tier / BeamGlyph compact / word inline] → ③ the five LaneBars as the addends → ④ the ledger drill-in → ⑤ the not-a-forecast caveat at every fidelity; the ONE LaneBar renderer reused across every lane surface; every current balance-family surface assigned its fate); the metric anatomy (the 10-year RangeBand family with the mandatory reference-period disclosure, the named-window rule, the ONE AsOfChip freshness grammar); the indicator patterns (closed card → desktop popover / mobile bottom sheet → the technical `<details>`, wired to 09's default/expanded/technical tiers, reusing the shipped details-panel infrastructure); the LABEL chart-accessibility contract + the axis-direction settlement (time AND magnitude axes LTR in both locales; stacking mirrors in RTL; fa typography guards); the metaphor truth rules + the banned-imagery list; the BriefingCard outlook container (typographic, NO instrument — the deliberate identity contrast with the balance; Q1-gated five-state word, Q2-gated horizon/scenario slots, no probabilities/targets/drawn price paths anywhere); and the budget strategy recorded for the owner. `12-visualization-mapping.md` — the closed **ten-primitive vocabulary** (RangeBand family · SignedDivergingBar · ShareBar · StackedComposition · HouseTimeSeries · CorrelationStrip · FlowColumn · LevelSpark · ProbabilityRow · PriceMap — **no gauge**) and **all 68 canonical rows mapped** (the 37 voters by lane with the YoY-basis, stepped, and inverted-seat specializations; the 11 context readings; the 4 blocked → the BlockedNote non-form; the 16 modules), the six difficult cases specified (historical percentile · yield decomposition · rolling correlation · flows vs stocks · CFTC two-track · the technical PriceMap), the relationship-explorer visual contract (M solid / C dashed / X pennant-never-fine-print / K heaviest + evidence tag; blocked edges legend-only; list-first on mobile; the no-edge honesty footer), and the scenario-presentation spec. `visual-references/` — the 12-panel pattern sketch sheet (self-contained HTML in the shipped token values, illustrative data only) + browser captures at desktop 1280 / mobile 390 (VLM-reviewed clean) + the README. The decision log carries **S4-D1..S4-D14** (D14 = the blocked-push record); BD-S47 is the DECISIONS record.

**The owner gates S4 leaves standing (Q1–Q4, per S1-D6/S3-D7 — none blocks S5's opening, but Q4 shapes its scope):** (Q1) the "Conditions outlook: Bearish" line's fate — the five-state vocabulary is the drafted candidate (08 §8.1, 11 §10.2); (Q2) the outlook method/horizons — the container has the slots, nothing publishes until a method is approved; (Q3) silver's home on /gold — the one-instrument rule binds whatever survives; **(Q4) the GoldPage budget strategy — S4's recorded recommendation is "both, modestly" (a ~4–6 kB justified ceiling growth + the Zone O tail split returning ~15–20 kB); the owner's call is required before S5 implements beyond the ceiling.**

**⚠ The standing state discrepancy (S3-D1, unchanged):** Session 2's deliverables (05/06/07) still do not exist; S3 derived its inputs from the authoritative sources and S4 built on those derivations (the visual system attaches to indicator/module records and the master plan §4 architecture, not to 05/06/07 slots). The owner should still decide whether to run Session 2 (recommended — its placement/nav work is untouched) or let the S3/S4 derivations stand as the working substitute.

**Verification (honest):** the sketch sheet was rendered in a real browser and captured at two widths; both PNGs were VLM-reviewed for render defects (all 12 panels render; no overlaps/clipping/broken SVGs; the two mobile soft spots are what the spec answers with the list-first mobile explorer and the stacked mobile rows). The full `pnpm gates` suite was NOT run — no package code changed and the suite does not exercise docs/ or sketch HTML. Nothing deployed (docs-only; production untouched).

**Known state (post-S4, at S4's own close):** production = currena-api `5c34a14b` @ 100% (unchanged); `main` = the S4 docs, merged fast-forward from `docs/gold-redesign-s4-visual` **in the working clone only — the origin push is BLOCKED by the invalid GitHub token (S4-D14): `origin/main` remains at the S3 close `921821fb` until the owner pushes the local refs with a valid token or re-runs the git steps after rotating the credential; recovery artifacts: `/home/z/currena-s4-visual.bundle` + `/home/z/currena-s4-visual.patches/`**; the GoldPage budget 238.90/49.57 under 240/50 (untouched — S5 measures at every milestone per S4-D10); the copy manifest at round 90 (untouched). The Cloudflare token was verified valid (read-only) and was not needed (docs-only, no deploy); the GitHub token was verified INVALID (401 Bad credentials on `/user`). *(Resolved at the close-out sitting above: the push completed under the fresh token, `origin/main` = `01928d71` with S4 + PL-1 integrated, the redeploy + the EODHD rotation live — S4-D15. The bundle/patch artifacts stand down as historical.)*

**Program counter: Session 4/9 · 5 remaining (S5 primary briefing · S6 global context · S7 advanced/regional · S8 mobile/a11y · S9 final verification).** The full copy-paste S5 prompt is at the bottom of this file. **⚠ Git recovery note (S4-D14, at S4's own close): before starting S5, first restore this session's commits to origin — RESOLVED at the close-out sitting: origin/main now carries the S4 deliverables (`01928d71`); a fresh S5 clone is safe.**

## Previous session (2026-11-2x — Gold UX Redesign S3, the indicator taxonomy and the bilingual explanation system: the content foundation, docs-only)

**What S3 did (data/content design + copy production; no code, no runtime copy, no model surface, no deploy):** the content foundation. `08-indicator-content-schema.md` — the canonical 68-row set reconciled from the live sources (37 voters verified one-by-one against `GOLD_LANE_VOTERS` [7/7/11/10/2, polarity included] + 11 non-voter present readings + 4 licence-blocked absentees + 16 modules; NO drift — the AGENTS.md §A "54 voting" header is the insights-wide registry count, not the gold page's), the five-group label system finalized (EN/FA, engine ids frozen), the ten-dimension explanation schema + the default/expanded/technical tiers, the bilingual copy rules (approved/banned cautious-verb lists, correlation≠causation, no good/bad, no buy/sell), the briefing/outlook vocabulary DRAFTS FOR OWNER REVIEW (the five condition states, evidence-consistency words, horizon labels — Q1/Q2-dependent), and the Session-5 integration contract. `09-indicator-explanations-fa-en.md` — the full bilingual records: 37 voter records by lane (every rise/fall written through the ENGINE'S ACTUAL POLARITY; the two inverted seats marked), 11 context records, 4 blocked would-show records, 16 module records, and the coverage report: **52/52 indicators + 16/16 modules complete**, analogies on 9 records (each materially clarifying), every omission reasoned, the honest gaps declared (Q1–Q4 dependencies; runtime integration at Session 5). `10-indicator-relationship-map.md` — the four evidence classes (mechanism/observed-correlation/conditional/causal-rare), 24 relationship records with fa/en one-liners and the named break episodes, 8 claims EXCLUDED with reasons, 3 blocked, and the Session-6 explorer's record contract. The decision log carries **S3-D1..S3-D12**; the Persian terminology additions for the future manifest round are in `persian-terminology.md`; BD-S46 is the DECISIONS record.

**The S3 state discrepancy (S3-D1 — still needs the owner's attention):** the owner's Session-3 prompt referenced Session-2 deliverables (05/06/07 + S2-D1..S15) that DO NOT EXIST anywhere. S3 derived its needed inputs from the authoritative sources (the S1 CSV + `gold-score.ts` + master plan §4/§5) and flagged every derivation. **The owner should decide: run Session 2 as planned (recommended), or treat the S3/S4 derivations as its partial substitute.**

**Known state (post-S3, unchanged by S4):** production `5c34a14b` @ 100%; the GoldPage budget 238.90/49.57 under 240/50; the copy manifest at round 90.

## Previous session (2026-11-20 — Gold UX Redesign S1, the current-state audit: the nine-session Gold UX redesign program OPENS, read-only, docs-only)

**The program:** the owner's master spec `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` (repo root, v2 — the locked product direction after three clarification rounds) defines a nine-session redesign of `/gold` toward the weather-briefing model: outlook-first hero, conditions ≠ outlook, five-lane overview + dynamic highlights, bilingual explanation system, visual system, then staged implementation (S5 primary briefing · S6 global context · S7 advanced/historical/regional · S8 mobile/a11y · S9 final verification). **The master spec is the product source of truth — session reports record implementation decisions only, never rewrite product decisions.**

**What S1 did (read-only, nothing deployed):** the evidence baseline. Live production verified BYTE-IDENTICAL to `main` @ `884f2696` (three served assets `cmp`-clean against a fresh build; deploy `62bdfc10` = version `5c34a14b` per BD-S43; D-43 lock re-checked read-only). 31 baseline screenshots (en/fa × desktop-1440/mobile-390, dark pair, six expanded states; zero console/page errors everywhere), live DOM audits, and a full source audit of the 13,320-line gold feature + engine. Deliverables (all under `docs/gold-redesign/`): `01-current-state-audit.md` (findings F-01…F-14 with severity/evidence/impact/recommendation) · `02-section-and-component-map.md` (the 22-block render map, data planes, navigation reality, bundle budget) · `03-indicator-and-module-inventory.csv` (48 readings + 4 absent + 14 context homes + 37 voters + 16 modules) · `04-duplicate-and-overlap-matrix.md` (DUP-1…DUP-8, every row evidence-backed) · `baseline-screenshots/` (+README) · the program `DECISION_LOG.md` (S1-D1…S1-D8). BD-S44 in `docs/DECISIONS.md` is the decision record.

**The evidence in one breath:** the page is feature-complete and honest but long (26 sections; ~13,000 px desktop / ~25,000 px mobile), flat in hierarchy, and repetitive at the summary level — the balance verdict renders at summary strength SIX ways (hero scale · hero outlook line · the Signals section's SECOND full BalanceScale · narrative families · collapsed-signals line · on-ramp closes); CFTC ×4, price ×3, real-yield ×4 surfaces; 37 always-visible seat chips (17 steady today); NO in-page navigation; the 7-state "Conditions outlook" is the same `goldBalance()` re-worded (GB-S5) with the honest "not a forecast" caveat — a genuine forward-looking outlook does NOT exist yet and must be designed fresh in Session 2 (never by relabelling the balance). Live state at capture: "Leaning against gold" / outlook "Bearish"; 1 for · 3 against · 1 neutral lanes; price US$3,599 −3.83% 1d. Engineering health is good: zero console errors, no 390 px overflow, dark mode correct, DCL ~110 ms; the one hard constraint is the GoldPage budget headroom (~1.1 kB raw of 240,000/50,000).

**Owner-approval gates carried forward (nothing needs pre-approval to START Session 2 — it is strategy-only):** (1) the outlook method + horizons + the "Conditions outlook: Bearish" wording — design in S2, approve before implementation; (2) silver's home on /gold (S2, owner decision — a shipped feature); (3) the GoldPage budget strategy — grow-with-justification vs split (S4/S5 explicit decision). No protected model surface (membership, polarity, thresholds, scoring, balance math, percentile windows, providers, rungs) was touched.

**Standing limits (unchanged):** the WGC drops + PBoC revival remain owner-side levers (`docs/specs/gold-page-elevation/s18/02-PROGRAM-CLOSURE-RECORD.md` §3); the Kalshi leg stays dropped (S15-D1); the §21 portwatch window; the D-43 deploy-lock re-check before every deploy; R5 no-rename; the Persian copy manifest gates every fa string.

**Known state (post-S1):** production = currena-api `5c34a14b` @ 100% (unchanged — docs-only session); `main` = the audit docs (merged fast-forward from `docs/gold-redesign-s1-audit`); the GoldPage budget 238.90 raw / 49.57 gz under 240/50; the copy manifest at round 90 (8,483 entries — untouched this session).

**Next session (the program's S2 — Product hierarchy, visitor journey and information architecture; strategy only, NO implementation):** convert the owner's locked decisions + the S1 evidence into `05-product-principles-and-visitor-journey.md`, `06-final-information-architecture.md`, `07-canonical-placement-and-deduplication-plan.md`, and the updated decision log. Read `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` in full + `AGENTS.md` + `docs/gold-redesign/DECISION_LOG.md` + all four S1 deliverables BEFORE designing. The full copy-paste S2 prompt is at the bottom of this file.

## Previous session (2026-11-20 post-GPE UX OPS — BD-S43, the owner-directed gold-page relocation: the licence bookkeeping to the footer, hidden by default)

**Outcome:** the owner reviewed the live `/gold` (currena.ir) and asked
for (1) a verification pass against the gold program and (2) the
relocation of the licence/venue bookkeeping a normal user shouldn't
see — their examples: the "Not published — blocked by licence or
venue" wall and the "World gold ETF holdings — the WGC licence class…"
note — **"positioned in the footer and hidden by default."** Both done,
on `main`, with the full deploy discipline.

**The verification:** the 18-session GPE program stands COMPLETE and
live (31 of 33 rows delivered; production re-anchored on `f4926c9d` =
the code-identical `a3a8641d` tree at the 2026-11-19 ops sitting);
nothing regressed — the page renders the hero, the explanation band,
the Iran bridge, the Signals chart, the 37-seat meter, the TA band, the
context cards + Zone K, the positions, and the Zone O history tail over
today's live data; the standing owner-side levers are unchanged (the
WGC drops [R15/R23 + the prices workbook] · the EODHD plan · the Kalshi
authorisation · the CBI gerami pin · the credential rotation —
`docs/specs/gold-page-elevation/s18/02-PROGRAM-CLOSURE-RECORD.md` §3).

**The change (BD-S43, `docs/DECISIONS.md`):** the §16 licence wall —
the four blocked-quartet honest notes (WGC ETF holdings · WGC CB demand
· the PBoC/CBR official demand · the ETF short interest) + the ONE
`SOURCES.md` link-out — and the page header's absent-count line moved
BYTE-FOR-BYTE UNCHANGED out of the main reading flow into the page
TAIL: the new `GoldPublicationNotes.tsx` disclosure (the house
progressive-disclosure pattern), COLLAPSED BY DEFAULT — one neutral
summary line ("Publication notes — why some readings are not shown" ·
FA «یادداشت‌های انتشار: چرا برخی داده‌ها نمایش داده نمی‌شود»), one
tap opens the whole honest record (the same copy, the same
`GOLD_BLOCKED_NOTES` table, the same Persian-digit absent count). The
historical `#gold-blocked` anchor survives on the disclosure's root.
The hero, the context cards, Zone K, and the honest-record footnote
are untouched. AGENTS.md §11's zone map refreshed to the new render
order.

**Gates 9/9 GREEN** (2m 59s: secret scan · typecheck · lint 0/0 ·
copy:audit clean [the new FA string queued unreviewed in the manifest]
· narrator vocabulary + eval · layer1 11,969/11,969 · the suite 15,599
[the GoldPage tests rebased to the new contract — collapsed-by-default
+ the one-tap-open walk + the anchor identity + the footer position]
· build + budgets: GoldPage **238.90/49.57 under 240/50** · entry
271.13/82.12 under 296/89.5).

**The deploy + live verification:** see this session's record in
`docs/DEPLOY.md` (the version ids, the bindings, the post-deploy
smoke, and the browser verification: the wall absent from the flow at
EN desktop/mobile + FA RTL; the disclosure present, collapsed, opening
on one tap with the full quartet inside). Credentials used, not
stored (AGENTS.md §7).

**Known state (post-deploy):** production = currena-api **`5c34a14b`**
(2026-11-20, deployed from `33ea08a5`; the served entry
`index-BqnATyD-.js` byte-matches this tree's dist; the full record in
`docs/DEPLOY.md`); the GoldPage budget 238.90/49.57 under 240/50; the
WGC fold still the standing owner-side lever (data/wgc/ absent, no
owner notice).

**Next:** nothing needed — the GPE program stays COMPLETE and closed;
this sitting's owner request is fully delivered. The standing
owner-side levers remain the only open items, and they are owner-side
by design.

## Previous session (2026-11-19 post-program OPS — push + merge + deploy; NO code changes, NO new features)

**Outcome:** the owner supplied fresh session credentials (a GitHub
token · a Cloudflare Workers deploy token + the account ID · an EODHD
API key · a second Workers-AI-scoped token) and asked for the one
thing the program's close left open on the repo side: **push, deploy,
and merge to the live site.** Done, in the standing-approval lane
(AGENTS.md §5), on the closed program's tree (`a3a8641d` —
code-identical to S17's production by construction): the GPE branches
verified already on origin; **`main` fast-forwarded `19131b00` →
`a3a8641d` (61 commits — the whole 18-session program) and pushed** —
GitHub `main` now equals the production tree for the first time in the
program's life (the research branch lineage + PR #48 untouched);
gates re-run FIRST (9/9 GREEN, 3m 0s; the full suite 15,599 IDENTICAL
— the zero-delta proof re-held); the D-43 deploy-lock re-checked
(`65f7c0bb` @ 100%, no drift); currena-api redeployed **`77c6262a`**
(23:31:55Z, the bindings intact, the platform reporting ZERO changed
assets — the dist byte-identical to S17's live build);
`EODHD_API_TOKEN` re-put on BOTH workers (the owner-supplied key —
the credential-rotation lever exercised) → the now-active version
**`f4926c9d` @ 100%** (the secret-put's version). currena-markets
code-unchanged → NOT deployed (its secret re-put only). **Live-verify
all GREEN:** health 200 · the eight gold-family data planes 200 with
today's fetchedAt stamps (the minute-cron gold rungs firing on the new
version) · `gold-episodes` 503 = the designed WGC-workbook waiting
state · the served entry chunk `index-DiozkNmz.js` byte-verified
identical to the dist. The Workers-AI token: NO runtime consumer by
design (D-41 — the narrator rides the `ai` binding, no token stored
anywhere); deliberately not wired. The record: docs/DEPLOY.md (the
2026-11-19 ops record) + the CHANGELOG entry + the known-state line
below. Credentials used, not stored (AGENTS.md §7). **The GPE program
stays COMPLETE and closed — this sitting changed no code and reopens
nothing; the standing owner-side levers are unchanged.**

## Previous session (S18 — GPE THE PROGRAM CLOSEOUT — THE PROGRAM COMPLETE; bookkeeping-only: NO new features, NO deploys)

**Outcome:** the program's ninth and final session closed the Gold Page
Elevation program per its own bookkeeping rules, in three milestones,
all committed + pushed on the branch `gold-elevation/s18-closeout`
(off the S17 close `0dc85eac` — the branch tip carrying the S17
bookkeeping; `26529924` is its code parent, the tree production
`65f7c0bb` was built from — the one-line branch-base note recorded in
s18/01 §0). **M1 the research-branch reconciliation**
(`docs/specs/gold-page-elevation/s18/01-RESEARCH-BRANCH-RECONCILIATION.md`):
the program plan's D2 close-out — the read-only row-by-row disposition
of the full recommendation table (**31 of 33 queued rows DELIVERED +
deployed + live-verified; R15/R23 pending on the owner-side WGC fold
[never a defect]; R28's Kalshi leg deliberately dropped per the
pre-committed wording read; the Excluded 5 held**) + the ten divergences
each with its recorded reason (the Kalshi drop · the WGC fold · the P3
regrouping · the +1 session numbering · the D2-rule form after the
gate lift · GPE-S2-28/29 → AGENTS.md this session · GPE-S2-30 verified
fixed with R01 · the D1-locked-A wording rounds · R01's mode-A
absorption) + the WGC drop re-check (data/wgc/ absent on every branch,
no owner notice — the fold stands as the program's standing owner-side
lever). **M2 the DECISIONS + AGENTS.md reconciliation + the final sweep**:
the DECISIONS set verified COMPLETE (BD-S34…S41 against every SUMMARY's
own decision list — S10's in prose form predating the literal-ID
convention; the fold/drop decisions all recorded; the one addition
BD-S42 this session) · the two AGENTS.md drift items GPE-S2-28/29
reconciled INTO the facts (§C the dollar basket = SIX currencies, the
DXY recipe, no AUD, + the true post-modularization module path · §F
the live prices = the Yahoo minute-board [BZ=F · GC=F COMEX · SI=F ·
BTC-USD] with sourceName at point of use, gold-api = the ratio/
platinum/copper + accumulated-history legs) · GPE-S2-30 verified fixed
· the §11 project-facts refreshed to the post-program state (the GPE
COMPLETE block + the gold page's render-order zone map + the
gold-family rung registry + the gold-family KV key inventory + the
GoldPage budget 240/50) · `s18/02-PROGRAM-CLOSURE-RECORD.md` written
(the 18-session ledger — every sitting one line · the standing
owner-side levers in one place · the program-closure statement).
**M3 the close:** this HANDOFF rewrite + the CHANGELOG S18 entry +
BD-S42 + the S18 summary + the program-closure TLDR. **Gates 9/9 GREEN
re-run on the exact S18 tree (3m 05s): the full suite 15,599 IDENTICAL
to S17's close (ZERO delta — the docs-only proof, the M16 precedent) ·
the GoldPage budget 237.70/49.35 under the 240/50 ceiling · copy:audit
clean · secret scan clean · lint 0/0.** NO deploy (bookkeeping-only —
production stays S17's `65f7c0bb` @ 100%, untouched; the deploy-lock
was not re-checked because no deploy ran, per the docs-only M16
precedent). **The program counter: Session 18/18 · 0 remaining — THE
PLAN IS COMPLETE.** Nothing needed next; the standing owner-side
levers (below + s18/02 §3) are the open menu for any future session.

## Previous session (S17 — GPE P4, the Advanced tier — the LAST feature wave; DONE AND VERIFIED LIVE — P4 COMPLETE, every feature wave done)

**Outcome:** ALL THREE of the tier's rows landed, tested, deployed,
and live-verified — **R31 (F12 the time machine**, the collapsed Zone
C Advanced affordance inside the hero: the era-boundary note taught
with the Jalali month, the date picker bounded by the era + today, the
reconstructed verdict word + counts + five lane chips in the hero's
own corpus vocabulary, the as-of mapping line, the versioned-table
line, the two provenance honesty lines; the data plane: the dated
four-entry voter-table registry [the S4-frozen 20-seat era basis ·
the S6 21 · the GF-P2 32 · the current GF-S10 37 — the intra-day
versions never selected], the backtest's own reconstruction
machinery, the D7-locked compact row, the YEAR-sharded one-read store,
the 04:47 UTC rung, the /gold-meter date-parameterized READINGS-ONLY
projection with the era-boundary + future + malformed rejections ·
the meter-era boundary 2016+ NEVER crossed) · **R32 (F23 the
forecast-accuracy retrospective**, the collapsed Zone M companion
inside the honest-record footer: the LBMA analyst-survey vs actual
2010–2026 — the series EXTRACTED LIVE from the publisher's own
performance page after the "already extracted" hand-off claim was
found stale; every recorded aggregate reproduces exactly [10/16
under-forecast · mean −2.11% · mean-abs 8.13% · 2025 −20.24% · 2024
−13.71%]; the static typed module, NO KV/NO route, the bundle carries
17 pairs; the miss convention disclosed at point of use, the pending
row never scored early, the pairing note beside the no-edge backtest,
the dated attribution link) · **R33 (F26 the "if you'd bought"
calculator**, the collapsed Zone O card beside the Episode Explorer:
gold vs S&P vs BTC vs silver, the lump multiple + the $100/month
monthly DCA at month-end closes, the decile among same-length windows
with the R19 min-base 30 posture and the honest waiting line at the
121-month window, every window named at point of use, the method line
+ the first-year November note + the disclaimers + the named S&P
venue; the ONE-key store + the 04:49 UTC rung [the four running
points from the page's own planes, KV reads zero fetches] + the
/gold-ifbought route + the backfill runner [the stage for
gold/silver/btc + the markets board's own keyless Yahoo provider for
the S&P leg, recorded]). **The year-grouping verification fix** (found
live at the EN desktop pass, the S13-D4 precedent): years render
UNGROUPED (2016/۲۰۱۶, never 2,026/۲٬۰۲۶) through formatNumber's
useGrouping:false while the locale digits still apply — the $
amounts keep their grouping. **R15/R23 + the prices workbook stayed
pending** (no WGC drop — the seventh consecutive session for R15; the
fold rule). Production is currena-api **`65f7c0bb` @ 100%** (two
deploys, honestly recorded: the first `c1efe3be` at 19:01:49Z — the
D-43 deploy-lock re-checked FIRST, `ea45d06c` still active, no drift;
the year-fix redeploy at 19:06:14Z; the served GoldPage chunk
byte-verified identical to the fixed tree) **+ the two KV seeds**
(the year-sharded `insights:gold-meter-history:v1:<YYYY>` backfill
serving the full 2016-11→now era under the then-current versioned
voter tables + `insights:gold-ifbought:v1`: the 120-month four-asset
backfill 2016-11 → 2026-10 + the current running points [gold
3,726.25 · silver 45.16 · btc 63,378.22 · sp500 7,218.42]). The
branch `gold-elevation/p4-advanced` is pushed with the session's
eight commits (the M1 docs `3ec96e60` · the R31 backend `9e091db5` ·
the R31 frontend `c66ecbde` · the R32 `631a91fe` · the R33 `ca715b5f`
· the manifest round 90 + budget `268e8c50` · the lint pass `25168264`
· the year-fix commit `26529924`) + the close. Gates 9/9 GREEN
(re-run by the closing leg on the fixed tree, 3m 07s; suite **15,599**,
+89). The Persian-copy manifest round 90 landed the session's 44 fa
entries (8,439 → **8,483** entries; copy:audit clean; the terminology
additions: ماشین زمان · جدول رأی‌دهی · بازسازی از سری‌های ذخیره‌شده ·
حتی اجماع هم خطا می‌کند · گذشته‌نگری · اگر خریده بودید · پایانیِ ماه ·
پنجرهٔ هم‌طول · خرید ماهانه). The GoldPage budget bumped 218/46 →
**240/50** (measured 237.59/49.31, verified not duplication — the
justification inline in check-bundle-budget.mjs). The live-verify
matrix: EN desktop ×3 surfaces + fa RTL ×3 (the retrospective's
17-row table with ungrouped Persian-digit years + the time machine at
۱۳۹۸/۱۲/۲۶ under s4-frozen-20 + the calculator at both window shapes)
+ fa mobile 390 (no overflow, all three collapsed by default, the
touch targets ≥44px, the tap-expand working) — zero console errors;
the 9-route sibling smoke all 200; the three meter boundary probes
(the nine screenshots: s17/verify-*.png). The session ran in two legs
(one context interruption, honestly recorded): the closing leg
re-verified the production state (the deployments-API lineage + the
served-chunk byte-compare) before committing the fix. The session
summary + the S18 closeout prompt are
docs/specs/gold-page-elevation/s17/SUMMARY.md.

**Program counter: Session 17/18 · 1 remaining (S18 = the program
closeout — the research-branch reconciliation + the DECISIONS/AGENTS.md
reconciliation [the GPE-S2-28/29 drift items] + the final sweep + the
program-plan closure record; NO new features; the S18 prompt is in
s17/SUMMARY.md's next-session section — if the WGC drop has arrived,
the closeout session extends per the fold record rule FIRST).**

## Previous session (S16 — GPE P3, the Supporting tier's third + FINAL session; DONE AND VERIFIED LIVE — P3 COMPLETE)

**Outcome:** the row **R30 (F3b Bridge-2 — the حباب premium HISTORY)**
landed, tested, deployed, and live-verified: the one-time TGJU
profile-history backfill (the s4/03 §1e verified route, re-verified
live + extended to the `/history` full-list pages: 30 daily rows per
leg, BOTH calendars per row — the Gregorian column authoritative, no
calendar conversion anywhere; the four legs [sekee · sekeb · ons ·
price_dollar_rl] inner-joined on common days — 24 at launch, Tehran
Mon–Thu; the premium COMPUTED from the legs' own closes, never
scraped as a claim; the reconstructed series reconciles the s1/11 §5
probe values EXACTLY) + the forward accumulation (the 20:33 UTC =
00:03 Tehran daily rung — the PRICES_CRON_MINUTE pattern, NO new cron
trigger; the day's last snapshot over the same `coinPremium()`
computation the bridge board renders; write-if-changed; a missing or
>24 h-old snapshot writes nothing) + the premium DECILES (the R19
posture — min base 30, the current point excluded, the basis window
named; the honest sub-30 waiting line at launch) + the day-move
attribution strip (the EXACT identity arithmetic Δln(coin) =
Δln(ounce) + Δln(USD/IRR) + Δln(1+premium), the formula printed
VERBATIM at point of use — «تفکیک حسابی است، نه برآورد آماری
(رگرسیون)» — NEVER GRAM-style regression, the s7/01 §8 binding copy)
+ the honesty line («بازسازی‌شده از تاریخچهٔ منبع» vs «محاسبهٔ زنده از
اسنپ‌شات‌های خودمان» — rendered on the chart's own boundary marker
«آغاز محاسبهٔ زنده») — all on the Zone F extension below the bridge
board (`GoldPremiumHistory.tsx`, the same band, s1/11 §8's phase 2).
**The CBI gerami pin was attempted** (the WAF block re-verified; a
third-party corroboration at ~0.909 g pure recorded as corroboration
only — not the CBI primary): **the 0.90–0.92 g band stands** (S16-D5).
**R15/R23 + the prices workbook stayed pending** (no WGC drop — the
sixth consecutive session for R15; the fold rule). Production is
currena-api **`ea45d06c` @ 100%** (the D-43 deploy-lock re-checked
FIRST — `83359c39` still active, no drift; first attempt clean) **+
the gold-premium KV seed** (`insights:gold-premium-history:v1`: the
24-day backfill 2026-10-15 → 2026-11-18 + the live 2026-11-19 row —
the backfill→live boundary exact; the Emami premium 7.33% at the
backfill close → 6.78% live at the seed). The branch
`gold-elevation/p3-bridge2` is pushed with the session's five commits
(the M1 docs `1283afa1` · the backend `f848446c` · the frontend
`8fb812ff` · the manifest + budget + gates `ac05da94` + the close).
Gates 9/9 GREEN (suite **15,510**, +48: the insights 25 engine + the
scraper 9 parser + the api 8 route/cron + the web 6 component tests).
The Persian-copy manifest round 89 landed the session's 22 fa entries
(8,417 → **8,439** entries; copy:audit clean; the terminology
additions: نوار تفکیک حرکت روز · اتحادِ دقیق · مِلت · خط صداقت). The
GoldPage budget bumped 210/45.5 → **218/46** (measured 216.67/45.35,
verified not duplication — the component + client each once; the pure
engines ride the shared insights chunk). The live-verify matrix:
13/13 PASS across EN desktop + fa RTL + mobile 390, zero console
errors (the four screenshots: s16/verify-*.png). **P3 IS COMPLETE**
— every queued P3 row (R22–R30) delivered + deployed + live-verified
across S14–S16. The session summary + the S17 next-session prompt are
docs/specs/gold-page-elevation/s16/SUMMARY.md.

**Program counter: Session 16/18 · 2 remaining (S17–S18).** Next:
S17 = P4 the Advanced tier (R31 the time machine + R32 the
forecast-accuracy retrospective + R33 the "if you'd bought" calculator
— ALL THREE, the last feature wave; the S17 prompt is in
s16/SUMMARY.md's next-session section); S18 = the program closeout
(the research-branch reconciliation + the AGENTS.md drift items +
the final sweep).

## Previous session (S15 — GPE P3, the Supporting tier's second session; DONE AND VERIFIED LIVE)

**Outcome:** the rows R28 (F24 the Fed-probabilities card — **the
Kalshi leg DELIBERATELY DROPPED on the Developer-Agreement wording
read's verdict** [s15 M1 §1: the agreement's own §3/§3.1 prohibit
non-own-trading use, collecting/caching/storing, and third-party
sharing; the pre-committed worst case fired exactly as the roadmap
recorded it] — the card renders the POLYMARKET leg alone, honestly
named as ONE venue with the traders'-not-ours disclaimer, the
30-minute :23/:53 cron refresh, the rolling discovery rule, the
gold-expectations-run seed runner) · R29 (F25 the calendar strip —
the next Fed/CPI events off the SAME insights snapshot's calendar
field, zero new fetches, the zone named at point of use, Jalali
dates for fa) · R25 (F6 the Episode Explorer — the nine-record
launch list 1971→2024-26 as the typed static module with every
EN/FA editorial string riding the dictionaries, the hasData
honesty flags, the 2016+ meter-era boundary, the out-bound-only
links, and the DROP-GATED price path + comparison rider rendering
the honest waiting states until the WGC prices-workbook drop
lands — the adapter/runner/route/engine all ship READY: the day
the drop lands at data/wgc/prices/, one `gold-episodes-run` command
lights the paths) landed, tested, deployed, and live-verified.
**R15/R23 stayed pending** (no WGC drop — the fifth consecutive
session for R15; the fold rule; the wall's WGC CB line stays).
Production is currena-api **`83359c39` @ 100%** (created
2026-11-19T06:10:56Z, first attempt clean; the D-43 deploy-lock
re-checked FIRST — `61180d7f` was still active, no drift) **+ the
gold-expectations KV seed** (the December Fed event: +25 bp 91.5% ·
+50+ 6.3% · unchanged 2.4% — the :23 rung refreshed it live minutes
after the seed, the honest as-of label carrying the move). The
branch `gold-elevation/p3-expectations` is pushed with the
session's four commits (the M1 docs `75f7a55f` · the backend
`023e2e92` · the three surfaces `f0ac6b96` · the manifest round +
budget `9f7a8cc7`) + the close commit. Gates 9/9 GREEN (suite
**15,462**, +87: the insights 56 + the api 14 + the web 18 new
tests). The Persian-copy manifest round 88 landed the session's 140
fa strings (8,277 → **8,417** entries; copy:audit clean; the
terminology additions: واحد پایه · احتمال ضمن بازار · رخداد ·
میانگین ماهانه). The GoldPage budget bumped 179/40 → **210/45.5**
(measured 207.17/44.12, verified not duplication). The live-verify
matrix: 13/13 PASS across EN desktop + fa RTL + mobile 390, zero
console errors (the seven screenshots: s15/verify-*.png). One
environment incident, honestly recorded: the sandbox's direct tool
channel wedged mid-session — the remaining work ran through
delegated subagent shells with every step still verified. The
session summary + the S16 next-session prompt are
docs/specs/gold-page-elevation/s15/SUMMARY.md.

**Program counter: Session 15/18 · 3 remaining (S16–S18).** Next:
S16 = P3's third session (R30 Bridge-2 — the حباب premium history +
deciles + the day-move attribution strip + the TGJU profile-history
backfill + the CBI gerami pin attempt; **if the WGC prices workbook
has arrived, run the gold-episodes-run runner to light the
Explorer's paths** — the S15-shipped machinery; R15/R23 stay
drop-conditional — the S16 prompt is in s15/SUMMARY.md's
next-session section).

## Previous session (S14 — GPE P3, the Supporting tier's first session; DONE AND VERIFIED LIVE)

**Outcome:** the rows R22 (F11 the correlation companion — the four
mandated layers, the pre-registered windows printed) · R24 (F22 the
London vault + clearing cards — LBMA's own 9,850 t figure matched) ·
R26 (F10 the five-currency grid — EUR/AUD native + JPY/GBP/CNY derived,
the KGX validation sentence) · R27 (F14 the COT band chips + the crowd
gauge) landed, tested, deployed, and live-verified. **R15 stayed
pending** (no WGC GDT drop — the fold record §0.2 rule, the third
consecutive session; the wall's WGC CB line stays). **The R07 Treasury
flip finally verified live mid-session**: the 04:10:18Z Nov 19 rung
fired while the session deployed — the yield family now reads "U.S.
Department of the Treasury" primary with the freshest as-of (us10y 5.07
· us30y 5.41 · real-yield-10y 2.88 @ 2026-11-18), closing the carry
that ran S11 → S12 → S13. Production is currena-api **`61180d7f` @
100%** (created 2026-11-19T04:08Z, first attempt clean; the deploy-lock
checked first — `3b8a8c6a` was still active, no drift) **+ the two KV
seeds** (`insights:gold-crosses:v1`: EUR 362 native · JPY 267 · GBP 263
· CNY 261 derived · AUD 308 native, asOf 2026-11-18;
`insights:gold-lbma:v1`: vault 124 rows → 2026-10, clearing 360 rows →
2026-09). The branch `gold-elevation/p3-supporting` is pushed with the
session's four commits (the M1 docs `52489933` · the backend
`77bcc2bc` · the frontend + manifest + budget `70895a5e` · the close).
Gates 9/9 GREEN (suite **15,375**, +48; the M2 commit's 10 lint errors
cleared by the closing leg). The Persian-copy manifest round 87 landed
the session's 54 new fa strings + the faqA3 re-pin (8,223 → **8,277**
entries; copy:audit clean). The GoldPage budget bumped 152/34.5 →
**179/40** (measured 177.57/39.31, verified not duplication). The
session ran in two legs (one context interruption — the first leg
landed M1 + the entire backend + the drafted frontend; the closing leg
finished, wired, gated, deployed, seeded, verified, closed). The
session summary + the S15 next-session prompt are
docs/specs/gold-page-elevation/s14/SUMMARY.md.

**The honest live context the surfaces report:** gold sits at the
BOTTOM of its 1-year stored window in every numeraire (XAUUSD
3,793–5,513 over the year, closing 2026-11-18 at the minimum, −6.46%
over 30 days) — the grid's five rows read «bottom 0–1%», the KGX
renders the honest mixed «0 of 5 up» (S14-D5), the correlation strip
carries its first 2 rolling points (the self-widening state).

**Program counter: Session 14/18 · 4 remaining (S15–S18).** Next: S15 =
P3's second session (R28 the Fed-probabilities card — the Kalshi
developer-agreement wording read is the FIRST task · R29 the calendar
strip · R25 the Episode Explorer; R30 Bridge-2 is S16's; R15/R23 stay
drop-conditional — the S15 prompt is in s14/SUMMARY.md's next-session
section).

## Previous session (S13 — GPE P2, the interactive chart + the TA band; DONE AND VERIFIED LIVE)

**Outcome:** the rows R18 (F7 the interactive price chart) · R19 (F8 the
minimal TA band) · R20 (F4a the education on-ramp) · R21 (F4b the
one-liners + the Chain-7 physical grouping) landed, tested, deployed,
and live-verified. **R15 stayed pending** (no WGC GDT drop — the fold
record §0.2 rule; the wall's WGC CB line stays). Production is
currena-api `3b8a8c6a` @ 100% (created 2026-11-19T01:04:39Z) **+ the
gold-xau KV seed** (the `gold-xau-run` landing lever: 360 final bars
2025-11-19 → 2026-11-18, last close 3,792.59 —
`GET /api/insights/gold-ohlc` serves it). The branch
`gold-elevation/p2-chart-ta` is pushed with the session's eight commits
(the M1 docs · the R18 backend · the four rows · the manifest round 86
· the budget bump · the pivot fix · the deploy/seed/verification · the
close). Gates 9/9 GREEN (suite 15,327, +37; re-run after the fix).
The Persian-copy manifest round 86 landed the session's 93 fa strings
(8,130 → 8,223 entries; copy:audit clean). The session summary + the
S14 next-session prompt are
docs/specs/gold-page-elevation/s13/SUMMARY.md.

**The session's honest shape:** one context interruption — the first
leg (Nov 18 21:18–22:17 UTC) landed M1 + M2 + the manifest/gates +
the deploy (`62d38fa8`) + the secret + the KV seed, then died before
the deploy commit/verification/close; the second leg (Nov 19 00:46 →)
verified rather than assumed (the D-43 read, the byte-identical chunk,
the route, gates re-run), **found one real defect at the live
verification — the R19 daily-pivot basis was one session stale — fixed
it (`a012d544`), re-gated, redeployed (`3b8a8c6a`), re-verified, and
closed.**

**The honest R07 carry (one more session):** the first
Treasury-primary rung fires **04:10 UTC Nov 19** — at this session's
close re-check (01:09 UTC) the live readings still carried FRED
provenance (us10y 5.12 @ 2026-11-16 "FRED (DGS10)"; the status blob
healthy). **S14's M1 verifies the flip** — the clock has now passed it.

**Program counter: Session 13/18 · 5 remaining (S14–S18).** Next: S14 =
P3 the Supporting tier's first session (R22 F11 the correlation
companion · R24 F22 the London vault + clearing cards · R26 F10 the
multi-currency gold grid · R27 F14 the COT percentile bands; **+ R15 the
GDT stack if the owner's drop arrives** — the S14 prompt is in
s13/SUMMARY.md's next-session section).

## Previous session (S12 — GPE P1-c, the prizes; DONE AND VERIFIED LIVE)

**Outcome:** the rows R13 (Bridge-1 the Iran bridge) · R14 (the IMF
CB-demand Tier-1 tracker) · R16 (the affordances + the market-state
pill) · R17 (the #21 de-dup) landed, tested, deployed, and
live-verified. **R15 slipped to P2** (the M1(b) drop check: no WGC GDT
file, no owner notice — the fold record §0.2 rule; the wall's WGC CB
line stays until Tier-2 lands). Production was currena-api `49ae8ce7`
@ 100% (created 2026-11-18T18:51:04Z) + the gold-cb KV seed (asOf
2026-10 · 250 rolling points · the 10 buyers · reported world 35,003 t
/ 103 reporters — `GET /api/insights/gold-cb` serves it). The branch
`gold-elevation/p1c-prizes` is pushed with the session's commits.
Gates 9/9 GREEN (suite 15,290, +43). The Persian-copy manifest round 85
landed the session's 98 fa strings (8,032 → 8,130 entries; copy:audit
clean). The session summary + the S13 next-session prompt are
docs/specs/gold-page-elevation/s12/SUMMARY.md.

## Previous session (S11 — GPE P1-b, the explanation band; DONE AND VERIFIED LIVE)

**Outcome:** all six rows R07–R12 landed, tested, deployed, and
live-verified. Production is currena-api `23ce6b06` @ 100% (created
2026-11-18T14:31:20Z). The branch `gold-elevation/p1b-explanation-band`
(HEAD `6a3d55de`, 10 commits: M1 docs + R07–R12 + the manifest round +
the budget bump) is pushed. Gates 9/9 GREEN (suite 15,247, +28
positive-only). The Persian-copy manifest round 84 landed the wave's 57
fa strings (7997 → 8032 entries; copy:audit clean). The session summary
+ the S12 next-session prompt are
docs/specs/gold-page-elevation/s11/SUMMARY.md.

**The honest R07 note:** the Treasury-primary collect code is DEPLOYED
and verified in the Worker bundle, but the live KV snapshot predates
the deploy (generated 13:12 UTC) — the readings still carry FRED
provenance (as-of Nov 16). The first Treasury-primary rung fires
**04:10 UTC Nov 19**; the 10:10/20:10 sweeps correctly skip (healthy
status, under the 10-hour stale threshold). **The S12 M1 verifies the
flip** (S11-D4).

**Program counter: Session 11/18 · 7 remaining (S12–S18).** Next: S12 =
P1-c the prizes (R13 Bridge-1 the Iran bridge · R14 the IMF CB-demand
tracker · R15 the GDT stack (drop-dependent) · R16 the affordances +
market pill · R17 the #21 de-dup — the S12 prompt is in s11/SUMMARY.md's
next-session section).

## Current state (after the GPE S11 P1-b explanation-band session)

**The Gold Page Elevation (GPE) S11 P1-b explanation band is DELIVERED,
DEPLOYED + LIVE-VERIFIED. Production is now currena-api Version ID
`23ce6b06` (created 2026-11-18T14:31:20Z @ 100%, superseding the S10
P1-a deploy `f0844e59`). The code is committed + pushed to origin at the
branch `gold-elevation/p1b-explanation-band` (HEAD `6a3d55de`, off the
p1a tip `ec57261e`). Gates 9/9 GREEN (suite 15,247 — delta +28 from the
S10 close, positive-only). The session summary is
docs/specs/gold-page-elevation/s11/SUMMARY.md; the program plan is
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md.**

The six wave-1 rows shipped: the US yield family reads Treasury-direct
as PRIMARY with FRED as basis/fallback/cross-check (R07 — the deployed
swap; the first Treasury-primary rung fires 04:10 UTC Nov 19); the
outlook line speaks the conditions grammar ("Conditions outlook" + the
inline "this describes current conditions, not a forecast" — the 14
forecast-ish verdict sentences re-worded, both locales) (R08); the
licence wall states each blocked item's why + the owner's lever + the
one link-out to the public data-sources document (R09); every seat link
is a card-level #hash anchor with the name-match rule (R10); the F1
daily narrative "Why gold moved" renders the price fact + the five
driver families' states + raw deltas + the standing caveat (R11); the
F5 yield-decomposition card renders the four legs, the exact identity
(real + breakeven = nominal, the breakeven derived on matching as-ofs),
the moved block, the three named configurations + the 2022-gilt
exception, the Kim–Wright/ACM provenance, and the chain's two live
seats (R12). The Persian-copy manifest round 84 landed the 57 fa
strings; copy:audit clean. The GoldPage chunk budget bumped 82.5/21 →
89.5/22.5 (R12's binding education block, measured 88.41/21.91 — the
S11-D3 record; ~1.1 kB raw headroom for P1-c).

## The green baseline — the S10 P1-a record (2026-11-18)

- **Gates:** 9/9 GREEN (2m 50s). secret scan (clean — 8 patterns · 1053
  files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean —
  manifest round 83, 7988 → 7997 entries) · narrator vocabulary (in
  sync, 193×2 + 56×2 — regenerated after the insights-copy change) ·
  narrator eval (50) · layer1 strict (11969/11969) · **full test suite
  15,219** (core 195 · scraper 67 · insights 1391 · markets 13 · api 414
  · web 13139) · build + bundle budget (entry 270.52/81.97; GoldPage
  73.85/19.11 under the new 75/19.5 ceiling — budget bumped 72/18.5 →
  75/19.5 with justification inline).
- **Suite delta:** **15,184 → 15,219 = +35** (positive-only: the R01–R06
  characterization tests — TrendChart, GoldPositions, GoldPage,
  GoldSeats, yoy-gap, series; nothing deleted).
- **Production:** currena-api Version ID **`f0844e59`** @ 100% (created
  2026-11-18T11:37:29Z). Deploy-lock re-checked FIRST (D-43: production
  was still `6ae72ba7` @ 100% — no drift). Wrangler FIRST attempt clean
  (no 10013 retry). The §21 portwatch window clear (Wednesday). The
  served entry hash `index-sQcXoEPe.js` MATCHES the dist build.
- **Live-verify matrix (all GREEN):** EN desktop — R01 the chart chip
  "5.2 years" (not "10 years"), R02 SGE "92 tonnes" / Swiss "228 tonnes",
  R03 "30-day change", R04 the 5 dark seats' why-lines, R06 #15 absent-
  count "4...", #26 footer `/about#privacy` + `/about#terms`, #27 hero
  spacing, F17 silver note · **fa/RTL desktop** — R02 «۹۲ تن» / «۲۲۸ تن»,
  R03 «تغییر ۳۰ روزه», R04 the FA why-lines («منبع داده انتشار را متوقف
  کرده (آخرین داده: شهریور ۱۴۰۵)» etc.), R06 #15 «۴ از داده‌های...»
  (Persian digit), F17 «عمقِ نقره یک انتخابِ آگاهانه است...», dir="rtl" ·
  **mobile 390×844** — R01 chip "5.2 years", R04 5 why-lines render, the
  layout holds · **R06 #23 fresh path** — data-prices-as-of="fresh" (the
  cached "last successful" qualifier is the outage-only case, verified
  via the test) · **zero console errors** on every surface exercised.

## The prior R-5 port record (2026-11-18, earlier — superseded by S10)


- **Gates:** 9/9 GREEN ×2 (run 1 on the working tree with all edits applied uncommitted: 2m 43s; commit `f66efa44` landed; run 2 on the clean tree with `git status` empty: 2m 46s — IDENTICAL results). secret scan · typecheck (6 packages) · lint (0/0) · copy:audit (clean — zero new copy keys) · narrator vocabulary (193×2 + 56×2 — UNCHANGED) · narrator eval (50) · layer1 strict (11969/11969) · **full test suite 15,184** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,112) · build + bundle budget (entry 270.48/81.94 UNCHANGED; 10 destination-page chunks within budget; AsiaPage raw re-baselined 16.5→16.75 — +0.03 kB of opener plumbing, justified in scripts/check-bundle-budget.mjs).
- **Suite delta:** **15,165 → 15,184 = +19** (positive-only: 17 panel characterization tests + the UsaPage wiring test + the CommoditiesPage wiring test; nothing deleted). All 13,093 pre-existing web tests passed UNCHANGED before the new tests landed — the stretched-opener pattern is transparent to every characterization query.
- **Production:** currena-api Version ID **`6ae72ba7`** (`6ae72ba7-d32d-4fa2-88ee-b83546e50630`, created 2026-11-18T00:03:29Z, @ 100%). Deploy-lock re-checked FIRST (D-43: production was still `c0858d06` @ 100% — no drift). Wrangler FIRST attempt clean (no 10013 retry): 38 assets uploaded (106 content-hashed unchanged skipped), Worker Startup Time 39 ms. The deploy ran 00:03 UTC Wednesday — OUTSIDE the §21 portwatch window (Tuesday 11:00–14:00 UTC).
- **Live-verify matrix (all GREEN):** `/usa` — the fed-target card click opens the panel (role=dialog + aria-modal, the corpus name, the five F5 sections, the Layer-1 block, the chart svg, the rule line, the source footer; focus on the heading, body scroll locked; Escape closes + focus returns to the opener + scroll restored) · `/commodities` — the «More details» click opens the brent panel (the VERIFIED price-row title + the Layer-1 plainName + the changes section + the 52-week range + the chart; the §19.6 navigate-to-Global stopgap GONE) · **fa/RTL** — the Persian panel (نفت برنت + the Persian F5 sections + the chart + the Layer-1 block) · **mobile 390×844** — the /gold gold-silver context card opens the BOTTOM SHEET (full width, docked bottom, chart renders, the Persian heading + plainName) · `/world-markets` — the gpr-index risk card opens the panel with its chart · `/` — Global loads · **the §19.6 option-B redirect regression-checked** (`/insights?card=us10y` → `/usa`, title "آمریکا - Currena") · **zero console errors, zero page errors** on every surface exercised · the served entry hash `index-C4b9WhvK.js` MATCHES the dist build.

## The R-5 session record (what was done)

1. **Environment setup** (the §19.6 sandbox pattern): the repo re-cloned to `/home/z/currena`; pnpm@10.34.5; `pnpm install` (8.1s). Token verified (HTTP 200 — login `assadigit`).
2. **Baseline verification:** origin/main at the §19.6 close (`47b9a34`); production STILL `c0858d06` @ 100% (D-43 holds at session open AND re-checked before the deploy).
3. **The audit (in-session):** the retired DetailsPanel recovered from `ecc64a05^`; every dependency verified alive in the shared layer (HistoryChart · PriceDetails · layer1 · config helpers · fetchIndicatorHistory · the corpus · the insights-panel CSS); the eight §21-trio card surfaces enumerated (UsaTierCards 72 · EuropeTierCards · AsiaTierCards · AustraliaTierCards · CurrenciesTierCards · GoldContext · WorldRiskCards · the Commodities PriceTiles); the §19.6 in-file stopgap comment on CommoditiesTierCards pointed at this port by name.
4. **The spec (docs/page-division/07-R5-DETAILS-PANEL-PORT.md)** — committed + pushed FIRST (`1a072a55`): goal, scope (the eight surfaces), out of scope (R-7/R-8 unchanged, the Global hub navigates, the markets feeds have no panel), the decisions D-R5-1…D-R5-5 (later + D-R5-6 in BD-S33), the plan, the done criteria.
5. **The port (`f66efa44`, 21 files: 3 new + 18 modified):**
   - NEW `shared/components/IndicatorDetailsPanel.tsx` — the retired panel verbatim minus the pin (the five F5 sections, the rule line, CardFacts, the price-row sections, the status lines, Layer1Block, PanelHistory→HistoryChart, the source footer, the focus discipline).
   - NEW `CardDetailsOpener` (the panel module) — the stretched transparent `<button>` overlay (valid HTML, `aria-haspopup="dialog"`, the corpus `Details: <name>` label; the card DOM byte-identical).
   - NEW `shared/hooks/useIndicatorDetails.tsx` — `useIndicatorDetailsPanel(readings)` → `{ openCard, closeCard, panel }` (fail-closed on an absent reading).
   - WIRED the eight surfaces + their pages (each page: the hook call + `onOpenDetails={openCard}` + `{panel}` at the root — a three-line page diff).
   - The Commodities «more details» stopgap REPLACED by `openCard` (the legacy 2026-10-26c behaviour restored on the commodities home).
   - Tests: +19 (the panel characterization ×17 + the UsaPage wiring + the CommoditiesPage wiring).
   - Budget: the AsiaPage raw ceiling 16.5 → 16.75 (the justification comment in the script).
6. **Gates ×2 GREEN** (2m 43s / 2m 46s), suite 15,184 (+19).
7. **Commit + push** (`f66efa44`; the staged diff secret-scanned clean before the commit). Local HEAD == origin/main == `f66efa44`.
8. **Deploy + live verify** (the matrix above; the browser closed clean).

## Operational notes worth carrying

- **The stretched-opener pattern (D-R5-6)** is the house pattern for "whole card is the tap zone" over cards with real headings: a transparent `<button>` at `absolute inset-0 z-10` as the article's last child (the article carries `relative`). The card's DOM stays byte-identical — the characterization suites never noticed. Text selection inside such a card is blocked by the overlay (accepted for data cards; recorded in BD-S33 D3's revisit).
- **The panel's chunk topology:** the panel + HistoryChart + PriceDetails + the corpus ride the SHARED chunks every destination page already loads (`useInsightsCopy-*` etc.) — the per-page cost of the port is the opener button + the callback plumbing (the AsiaPage row is the measured evidence: +0.03 kB). The money page's entry graph is UNTOUCHED (the entry budget unchanged).
- **The `/api/insights/:id/history` endpoint** now has a page consumer again (the panel's chart + the tile sparklines + the price sections — one module-cached fetch, three consumers). No API change shipped.
- **The standing limits carry forward (AGENTS.md §11):** the §21 portwatch window (never run Tuesdays 11:00–14:00 UTC) + the deploy-lock re-check FIRST (D-43) + the wrangler 10013 retry rule + the `run`-required-under-pnpm-10 rule + the R5 no-renames constraint.

## Owner-side levers waiting (the GPE program's bequest — the full list is docs/specs/gold-page-elevation/s18/02-PROGRAM-CLOSURE-RECORD.md §3)

- **The WGC GDT quarterly drop → unlocks R15 (the CB-demand Tier-2 demand stack) + R23 (the ETF flows card)** — save the dated XLSX at `data/wgc/<…>` and tell the next session; the adapter path ships drop-ready; the wall's WGC CB line retires as it lands.
- **The WGC prices workbook drop → unlocks R25's drop-gated halves** (the Episode Explorer's price paths + the comparison rider) — save the dated file at `data/wgc/prices/<date>-<file-as-published>.xlsx`; ONE `gold-episodes-run` command lights the paths (the S15-shipped machinery).
- **The EODHD plan upgrade** — deepens the crosses' + the OHLC stored bases. A fresh owner-supplied key was set on BOTH workers at the 2026-11-19 ops sitting (`EODHD_API_TOKEN` re-put, idempotent); its plan level could not be probed from the sandbox, and the S13-D1 self-widening rule means a deeper entitlement deepens the stored bases automatically at the trailing re-fetch rungs — no session work rides on it.
- **The Kalshi written authorization** — re-opens R28's Kalshi leg (the card honestly renders the Polymarket leg alone until then).
- **The CBI gerami pin** — the owner's browser on a cbi.ir /coin/ press-release page tightens one constant; the 0.90–0.92 g pure band renders honestly until then.
- **The WGC authorisation letter (info@gold.org)** — the owner's own parallel action (D9, non-blocking).
- **The two operational P0s** (CFTC Saturday gate + GPR re-fetch) — open on main, outside GPE; the small ops session remains the recommendation.
- **The fa-string triage queue** (copy:audit's unreviewed entries — the manifest carries them; the audit does not fail).
- **The credential rotation** — exercised at the 2026-11-19 ops sitting (the owner supplied fresh GitHub + Cloudflare + EODHD + Workers-AI credentials; used env-only/secret-put, never stored, never printed — rotate the chat-exposed ones again when convenient).

## Known state worth knowing

- **The Persian-copy manifest: 8,483 entries (round 90, the S17 wave — the last GPE round; copy:audit clean).**
- **The dist topology (post-S17, unchanged at S18 — docs-only):** entry 271.13/82.13 (within the 296/89.5 budget); the GoldPage lazy chunk 237.70/49.35 under the 240/50 ceiling (the program's final budget). Build deterministic.
- **The narrator vocabulary: 193×2 + 56×2 (UNCHANGED).**
- **Production: currena-api `4454212a` @ 100%** (the 2026-11-20b S4 close-out sitting: the code-identical re-anchor `58aaaf89` over the same BD-S43 runtime, then the `EODHD_API_TOKEN` re-put's version at 05:45:32Z; the served entry/CSS byte-verified identical to the fresh dist; rollback `5c34a14b` remains).

## The next-session pointer — THE GOLD UX REDESIGN PROGRAM, SESSION 9 OF 9 (the copy-paste prompt — the FINAL session)

Read AGENTS.md in the repo root first and follow it for the whole session. You are continuing Session 9 of 9 (the gold UX redesign — the FINAL session: verification, regression and handoff; NO new feature scope) — start from the latest `main` (Session 8's close is merged and deployed; the state of record is the HANDOFF's session block + `docs/gold-redesign/16-responsive-accessibility-report.md` + `DECISION_LOG.md` S8-D1..D7). The scope per the master plan's Session 9: the full verification and regression pass — (1) repeat the original screenshot matrix at the same sizes, locales and themes (the S1 baseline vs the S8 set — NOTE the S5–S7 "dark" pairs were light-render captures, the S8 harness's real-key fix is the truth for any dark comparison, S8-D3); (2) the before/after comparison with the material changes recorded; (3) the indicator inventory + duplicate audit re-run; (4) the explanation coverage in both locales; (5) the canonical-rendering check; (6) the model-unchanged verification (inputs, output definitions, polarity, thresholds, scoring, data states — unless explicitly approved); (7) the full gates; (8) the performance + no-unapproved-fetch check; (9) the known limitations + the open owner decisions (Q3 — silver's canonical home, PRESENTED with recommendation A at report 16 §5, awaiting the owner's answer; Q2 stays closed); (10) the final report `docs/gold-redesign/17-final-qa-and-regression-report.md` + the handoff. Present Q3 to the owner FIRST (the answer may retire or reconcile the merged Signals card's four-lane rendering — the one-instrument rule binds whatever is decided); if the owner answers, execute the gated change inside S9's verification posture (a conscious, tested change — otherwise it records as still-open). Measure the GoldPage budget at every milestone (the ceilings 240,000 raw / 55,500 gz, BD-S49; the S8 close left ~14.0 kB raw headroom). Do not deploy without the D-43 re-check first. This session closes the 9-session program — end with the TLDR + the program's completion record.
