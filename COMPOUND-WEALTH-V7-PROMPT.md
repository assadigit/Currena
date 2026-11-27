# Start prompt for the v7 session — the tax estimate, trust and mobile pass

## Addendum (2026-11-26, before any v7 work): v8 ships first; re-base this plan on main

The owner's next direction was the outcome-visuals pass (**v8**), and it was scheduled before this one. Nothing below is retired, but before starting v7:

- **Do not branch from `compound-wealth-v6`** (the preflight instruction below is superseded): branch from **main**, which now carries the consolidated tools suite, the shared site chrome, and the v8 visual surface.
- Read `COMPOUND-WEALTH-V8-PROMPT.md` (repo root, main) and the v8 section of `COMPOUND-WEALTH-REPORT.md` first — the v8 audit records what the tool's surfaces already show.
- The v7 work itself is unchanged, with **three joins onto the v8 surface**: (1) the tax row still lives inside More options → Costs; (2) when tax is on, the share bar under the tiles shows the after-tax split and its caption line gains the same "after tax (estimate)" wording as the tiles' caption; (3) the "tax takes X" line joins the costs what-if card and takes the same micro-bar treatment as the other cards.
- The fa language-toggle label-in-name fix and the AA checks for new elements: if v8 already shipped them, do not redo — re-check only.

Everything below this addendum is the original v7 prompt, unchanged.

---

You are working in the Currena repository (github.com/assadigit/Currena, Cloudflare Workers, site currena.ir). The **Compound Wealth** tool is live at https://currena.ir/tools/compound-wealth and **complete to spec v6**: every gate was green on 2026-11-26 — maths 94/94, browser harness 64/64 on the live build, the reference grid 1200/1200 with 15/15 through the real interface, Phase A 32/32, Lighthouse 98/97, lint clean. The record is in `COMPOUND-WEALTH-REPORT.md` §10 and `COMPOUND-WEALTH-TEST-REPORT.md`.

My direction for this session: make the tool **more reliable, accurate and trustworthy**, add **income/savings tax estimates for Australia and the USA**, and keep the **mobile experience excellent**. This prompt is the **v7 addendum** (it is also committed as `COMPOUND-WEALTH-V7-PROMPT.md` in the repo root). `COMPOUND-WEALTH-SPEC.md` (v6) stays the governing document except for the specific amendments in step 3; every other v6 rule — above all the simplicity contract — applies unchanged.

The most important rule is unchanged: **the tool must stay simple.** The tax feature is a small, optional, clearly-labelled estimate behind "More options". It is **off by default**, and with it off the tool must behave exactly as v6 does today. If anything here conflicts with simplicity, simplicity wins: simplify the feature, push it deeper into "More options", or cut it and say so in the report.

## Where things stand (read this first, do not re-discover it)

- v6 state and evidence: `COMPOUND-WEALTH-REPORT.md` (§10 the verification record, §7 the decisions log, §8 the unfinished list) and `COMPOUND-WEALTH-TEST-REPORT.md` (the full pass, the defect list, the data-source table).
- The code: `src/lib/compound/maths.ts` (one module, config block at the top), `src/lib/compound/figures.ts` (the model for the new tax file), `src/lib/compound/content.ts` (all copy, EN + fa), `src/components/compound/` (app, cards, chart). The independent reference engine is `compound_reference_check.py` at the repo root.
- Known open items from v6 — do not silently drop them: the figures' common quarter-end could not be aligned from the sandbox (blocked doors recorded in `docs/compound-tests/figures-research-2026-11-26.md`); the MSCI 20/30-year rows are login-gated (the US World row carries a 15-year label); the shared site palette has two sub-AA contrast tokens and the fa language toggle lacks label-in-name (both site-wide, owner decisions in the test report).
- The page currently says "No taxes are included." Taxes were out of scope in v6 (spec §2 and Appendix A). Moving them in as an optional estimate is **my decision this session**; record it as such in the decisions log.

## Do this, in order, on your own

0. **Preflight.** Branch `compound-wealth-v7` from `compound-wealth-v6`. Run the v6 gates unmodified and record the starting state: `python3 compound_reference_check.py --selftest` (six PASS lines), `bun test tests/compound-maths.test.ts` (94/94), `bun tests/compound-browser-harness.ts` (64/64), `bun tests/compound-grid-replay.ts` (1200/1200 engine + 15/15 live), `bun run lint`. If any gate is red, stop the feature work: fix the regression first and record it.

1. **The tax layer — engine first, then one row of UI.**
   - **The maths (one rule, applied everywhere).** `PlanInput` gains `taxRate` (decimal; make it optional defaulting to 0 so every existing test and call site compiles and passes unmodified). Transform, after the existing cost rule: `r_net = r − cost` (cost stays 0 for Cash; `APPLY_COST_TO_CASH = false` unchanged), then `r_after = r_net × (1 − taxRate)`. The monthly rate derives from `r_after` exactly as today. Every rate the engine touches — baseline, both band ends, custom rate and range, the compare table, Cash, every what-if — passes through the same transformation, so the whole page stays consistent with one switch. Deposits, the purchase fee and the pending rule are untouched: tax never touches money you put in, only growth.
   - **Tax applies to Cash growth too.** Bank interest is taxable income, and cash has no fund cost — keep the two rules separate and state both plainly.
   - **Today's money deflates the after-tax result.** State the order in the How fold: cost first, then tax, then inflation for the today view.
   - **New on the result:** the effective after-tax annual rate (for captions and the How fold), and a `tax takes` figure computed by running the same projection at `taxRate = 0` and differencing the finals — shown as one what-if line in the existing style ("Tax (estimate) takes X."), only when tax is on, beside the costs line, never on the default screen.
   - **Config block additions** (each with a plain-English comment): `TAX_MIN = 0`, `TAX_MAX = 0.60` (a ceiling, not a suggestion), stepper step 1, default 0.
   - **The interface — all inside More options → Costs; nothing new on the default screen.** One new row in the **Costs** group: "Tax on your growth (estimate)" — off unless set. A rate box (clamped 0–60% with one small plain message) and, when the country is AU or US, a small link "Estimate from my income" that expands inline (no modal). The estimator: an income box ("a rough yearly income is fine — it only sets the bracket"), plus for USA a filing-status control offering exactly the statuses the data file carries (default: single). One plain live line, `aria-live="polite"`, shaped like "At that income, about N% of extra investment earnings goes to tax: (parts in words)." with the source and its date on a small line, and one button "Use this rate" that writes the rate into the box. Full precision internally; the line rounds to 0.1 points. The income is session state only — never on a card, never in the URL, never stored.
   - **When tax is on:** the headline and tiles simply become after-tax, plus one small caption in the W3 inflation-caption style ("After tax at N% a year (estimate)."). No before/after split on the main screen; the How fold may show both.
   - **The cards:** the assumptions box gains one line when tax is on ("Tax on growth: N% a year (estimate, your setting)") and never shows the income. The "No taxes are included." copy in `content.ts` becomes the on/off-aware pair (EN + fa).
   - **The How fold** replaces "No taxes are included." with the plain model: tax is assumed paid each year on growth at the rate you set; the guided rate is an estimate from official schedules (source + date shown); and a plain list of **what is not included**: US state taxes (raise the rate yourself to allow for them), capital-gains timing and discounts (real tax on shares can be lower because some gains are taxed later or discounted), tax-sheltered accounts (super, 401(k), ISA-style), offsets and credits, franking credits, and any levy not named in the breakdown. Keep the existing note that the measured figures themselves are before tax.
   - **Wording:** the word "marginal" never appears on screen — plain words: "the tax rate on extra earnings at your income level". Every new string in EN and fa, RTL-correct, Persian digits in fa.

2. **The tax data file — same discipline as the figures file.**
   - New `src/lib/compound/tax.ts`, modelled on `figures.ts`: marked configuration block, plain-English comments, one `TAX_CHECKED_ON` date, per country: the latest published individual income-tax schedule (thresholds and rates) the estimator uses, plus exactly the extra components the estimator names — AU: the Medicare levy; USA: the filing statuses present and the net-investment-income threshold and rate if you verify them — each with source name, source URL, the income-year label, and a plain note. An 18-month staleness rule like the figures file, with a warning line in the estimator when stale.
   - **Sourcing, same rules as spec §7:** official pages only, fetched this session, never from memory, never paid or restricted data, no scraping of sites that forbid it. AU: the ATO's published individual income-tax-rates page and Medicare-levy page. USA: the IRS's published federal brackets / Form 1040 instructions or an official IRS release. If an official door is blocked from the sandbox, try the search and page-reading tools; if it stays closed, fall back to one secondary source only if it names the official schedule it transcribes — and record which door you used. If nothing verifiable is reachable, ship step 1 with the manual rate only, hide the estimator for that country, and write the blocked-door record exactly like the figures one.
   - **One pure function, no engine coupling:** `estimateTaxOnEarnings(country, income, status?) → { rate, breakdown, yearLabel, sourceName, sourceUrl, checkedOn }`, where AU adds the Medicare levy to the bracket rate, and USA adds the net-investment-income component only above its threshold. The engine never reads `tax.ts` — it only ever sees `PlanInput.taxRate`.

3. **Tests and the spec amendments.**
   - **Reference engine first:** extend `compound_reference_check.py` with the tax parameter under the same annual rule. The six existing selftest lines must still PASS unmodified; add taxed selftest lines.
   - **Fixed vectors:** at least two taxed scenarios, computed by the reference engine and pinned from its output — never a number chosen first. Plus the strongest regression: `taxRate = 0` reproduces today's results exactly.
   - **Grid:** extend the replay with a tax dimension (at least three tax levels across the strata), engine-side and a stratified subset through the live interface.
   - **Unit tests:** monotonicity (higher tax → lower final, put-in unchanged); tax + cost order; tax on Cash; band under tax; estimator bracket edges, threshold edges, the net-investment-income boundary, every status; staleness warning; clamping.
   - **Browser harness:** the default screen's control inventory is unchanged; tax flows through the real interface (manual and guided, AU and US), caption, tax-takes line, cards, fa + RTL + dark; store-nothing and no-network re-checked; one-screen fit at 360×800 / 390×844 / 430×932 with More options open; full keyboard path; plain-language and sentence-length checks over the new copy.
   - **Spec amendments** (edit `COMPOUND-WEALTH-SPEC.md` in place, minimal diffs): remove "taxes" from the out-of-scope list and Appendix A; the Costs group in §5.3 gains the row; §5.4's "no taxes" becomes the model wording; §6.1 gains the tax rule and its order; §9's known-limits line updates; §11's config block gains the tax constants; §12 gains the new tests numbered onward from 39; §13 gains this file's definition of done. Everything else in the spec is untouched.

4. **Trust extras (small, high-value, in this order).**
   - **Source-and-date visibility:** wherever a guided tax rate is used or explained (estimator line, How fold, card), the source name and its date appear on the same surface.
   - **Retry the blocked figures doors once** (the CFS PDF, MSCI interactive, LBMA, RBA/BLS) with a hard 30-minute timebox. If a door opens, complete the common quarter-end re-anchoring per spec §7 and record it; if not, keep the per-row disclosed period ends and record the retry.
   - **Apply the fa label-in-name fix** to the language toggle in the site chrome (add the visible "EN"/"فا" text to its aria-label) — one line, no visual change, already recommended in the test report's owner decisions.
   - Every **new** element passes AA contrast in light and dark. Leave the shared site palette tokens alone (site-wide restyle, outside this tool's remit) and keep that recorded as an owner decision.
   - **Deliberately not built**, listed in the How fold and the report: state-by-state US tables, capital-gains modelling, account wrappers, franking credits, offsets, auto-updating scrapers. Each fails the simplicity contract or the sourcing rules.

5. **The mobile pass.**
   - Re-verify the simplicity contract's one-screen rule at the three sizes with the tax UI present (it lives inside the collapsed Costs group; opening More options at 360×800 must not clip).
   - The sticky results bar keeps working, with the tax caption when on; safe-area insets respected.
   - New inputs: labelled, `inputmode` decimal, at least 16px font, at least 44px targets, visible focus, full keyboard path.
   - Lighthouse (mobile, live, after deploy): performance and accessibility must not regress from 98/97 — record the new numbers either way.
   - axe (light + dark, EN + fa) on the new UI: zero new violations.

6. **Finish.**
   - Run the complete v6 acceptance set unmodified plus every new v7 test; all green with evidence pasted into the report.
   - Deploy exactly as v6 did: `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy` with the Cloudflare token in the environment. Then re-verify the live page: the stratified grid subset through the real interface, the golden path with tax on and off (manual and guided), mobile screenshots into `docs/compound-tests/`, zero console errors.
   - Update `COMPOUND-WEALTH-REPORT.md` with the v7 section (what changed, the decisions log, the tax data table — every value, source URL, income-year label, retrieval date, and any blocked doors) and `COMPOUND-WEALTH-TEST-REPORT.md` with the v7 pass (verdicts, the test table, defects → fixes → regression tests).
   - Small, clear commits on `compound-wealth-v7`; push. Rollback: revert the v7 commits, or `git checkout compound-wealth-v6 && NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy`.

## Rules

- Simplicity first. The default screen keeps the exact v6 control inventory; with tax off the tool behaves identically to v6.
- Never ask me questions. Make the best decision, write it in the report, and continue.
- Never invent a number. Every tax value comes from `tax.ts`, and every `tax.ts` value from an official source opened this session, with its URL and date recorded. No bracket, rate, threshold or levy from memory. Never mark a test PASS without evidence.
- Never show the person's income or salary on a card, in the URL, or in storage. Store nothing; no data network calls.
- Do not break, move, rename or restyle existing pages. Insights, the converter, the narrator and the gold pages stay unchanged.
- Plain language everywhere, calm tone, the one strong sentence unchanged, no finance jargon in visible text ("marginal" never appears).
- Every new or touched module keeps a clearly-marked configuration block at the top, with comments in plain English.

## Definition of done (v7)

1. Preflight gates recorded; any red gate fixed before feature work.
2. Tax off = v6 exactly: the unmodified v6 suites all pass (94/94, 64/64, 1200/1200 + 15/15, 32/32, lint).
3. Tax on: engine, reference engine, grid, unit and browser tests green with evidence; at least two reference-computed fixed vectors; the tax = 0 exact-equality regression.
4. `tax.ts` fully sourced (official URLs, dates, income-year labels, notes) — or the estimator hidden with the blocked-door recorded.
5. Spec amended per step 3; report and test report updated with the v7 sections and decisions log.
6. Mobile contract re-verified at the three sizes; sticky bar intact; new UI AA-clean; Lighthouse not below 98/97, recorded; zero new axe violations.
7. Live deploy verified end-to-end: the grid subset through the real interface, the golden path with tax on and off, EN + fa, screenshots in `docs/compound-tests/`, zero console errors.
8. Insights, the converter, the narrator and the gold pages unaffected.

## Credentials

I will give you the GitHub push token and the Cloudflare deploy token + account ID at the start of the session. Never write them into a file, a commit, or the report.
