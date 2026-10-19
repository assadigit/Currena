# Currena Insights: Agent Runbook (version 3)

This file tells the coding agent exactly what to do, in order, without asking questions. Read it completely first, then read every file listed below before changing anything.

Repository: assadigit/Currena (Cloudflare Workers, free KV). Owner: Ali.

## Files (all in `docs/insights/`)

| File | Purpose |
|---|---|
| `AGENT_RUNBOOK.md` | This file: the procedure. |
| `RULES.md` | Hard rules, source risk levels, public-mode mitigations, wording and data display rules. |
| `RISK_REGISTER.md` | Source levels and the owner's recorded acceptance. |
| `UI_SPEC.md` | All visual and interaction changes, with acceptance tests U-01 to U-14. |
| `SCRAPING_SPEC.md` | The only allowed ways to fetch data, per-source method cards, tests T-25 to T-34. |
| `INSIGHTS_STEP3_SPEC.md` | Indicators, definitions, relationship rules, coverage, tests T-15 to T-24 and T-35. |
| `INSIGHTS_DEFECTS_2026-10-15.md` | 24 defects found in the latest export (E-01 to E-24). |
| `INSIGHTS_FIX_SPEC.md` | Foundation, fixes, additions and tests (A-xx, B-xx, C-xx, T-01 to T-14). |
| `GLOSSARY.md` | One vocabulary for page text and specs. |
| `baseline/currena-insights-full-2026-10-15.md` | The page export the defects were found in. Evidence and test fixtures. |

If two files disagree: `RULES.md` wins, then `UI_SPEC.md` for anything visual, `SCRAPING_SPEC.md` for anything about fetching, then `INSIGHTS_STEP3_SPEC.md`, then `INSIGHTS_DEFECTS_2026-10-15.md`, then `INSIGHTS_FIX_SPEC.md`. This runbook decides the order of work.

## 1. Mission

Make the Insights page correct, self-checking, clear to read, and complete for an Australian saver and investor who buys US shares. The page stays public and non-commercial, with the owner's recorded acceptance of risk for L2 sources. When you finish, the owner can run one command to produce a self-audit and a full export, so the next audit needs no manual work.

## 2. Setup

- [x] Create branch `insights-rebuild` from the current default branch.
- [x] Record: the test runner (use the repo's own; if none, add Vitest), the command that runs all tests, how the page export is generated, where indicators are defined, where rules live, how text is produced, how refresh is scheduled, the KV bindings, and how the front end is built.
- [x] Run the existing tests and record the result.
- [x] Parse `baseline/currena-insights-full-2026-10-15.md` into fixture data under `tests/fixtures/`.
- [x] Read the existing page CSS and tokens so the UI work reuses them (`UI_SPEC.md` principle 6).

## 3. Phases

After each phase: run the full test suite, fix failures, commit with `phase N: <summary>`. If an item still fails after three honest attempts, record it as blocked (what failed, what you tried, what is needed) and continue. Never leave the branch worse than the last green commit.

### Phase 0: current-state report (read-only)
Write `docs/insights/CURRENT_STATE_REPORT.md` for items S-01 to S-08 of `INSIGHTS_STEP3_SPEC.md`. Cite evidence for every claim. Do not stop afterwards; continue to Phase 1.

### Phase 1: tests first, then foundation
- [x] Implement tests T-01 to T-14 (fix spec), T-15 to T-24 and T-35 (Step 3 spec), T-25 to T-34 (scraping spec), U-01 to U-14 (UI spec), plus one extra test per defect E-04, E-05, E-06, E-10, E-11, E-18, E-24.
- [x] Run them against the baseline fixtures. Every defect test must **fail**, proving it catches the defect. Save the list as `docs/insights/baseline-test-results.md`.
- [x] Implement `INSIGHTS_FIX_SPEC.md` Part A (A-01 to A-08): single registry, generated text, validation before publish, safe failure, daily snapshot archive, context notes off by default, rule versions, status panel.
- [x] Add the source fields from `INSIGHTS_STEP3_SPEC.md` section 8 to the registry.

### Phase 2: defects and fixes
- [x] Fix every defect E-01 to E-24. After each fix its test must pass.
- [x] Implement every remaining item of `INSIGHTS_FIX_SPEC.md` Parts B and C that is not already in place (items verified as present in section B of the defects file need only a regression test).
- [x] For defects E-01 and E-02 (Yahoo Finance, gold-api): treat as L2 sources under `RULES.md` and `RISK_REGISTER.md`. Do not remove them. Name each as a futures or unofficial source on its card, add attribution, and ensure each fails closed.

### Phase 3: risk policy and public-mode mitigations
- [x] Create `LICENCES.md` and complete `RISK_REGISTER.md`: for every source, read its terms and `robots.txt`, quote the lines, set the level, record the date, and fill in the attribution text. Do not change any `owner_accepts` value. (Terms/robots re-reads for the pending sources — CNN, ASX — complete in Phase 5's discovery, recorded in RISK_REGISTER.md; no owner_accepts value changed.)
- [x] Implement `RULES.md` section 3: M-1 to M-9, including the panic switch (`ACCESS_MODE`, `PANIC_PRIVATE`), the per-source kill switch, rate limiting, minimum-data public endpoints, the owner-only export, and the contact line. (M-2/M-4/M-5/M-6 + the M-3 endpoint are done and tested; the M-1 card-face meta row, the M-7 contact line on the page and the M-8 hero disclaimer placement land with the Phase 6 UI per `UI_SPEC.md` — the spec's own visual authority.)
- [x] Implement the source gate (T-15, T-24, T-30, T-31). The page stays public by default (`ACCESS_MODE = public`).
- [x] The owner-only export and panic switch need a secret named `INSIGHTS_OWNER_TOKEN` (read from a Cloudflare secret). If it is missing, the export is disabled and the panic switch still works from the environment variable.

### Phase 4: data, definitions, relationships
- [x] Implement `INSIGHTS_STEP3_SPEC.md` sections 3 to 7: Layer 1 indicators, Layer 2 definitions (L2-01 to L2-10), Layer 3 summaries, relationship rules (R-01 to R-05), and Australian coverage.
- [x] Any indicator whose series or terms cannot be verified stays "Link out" or hidden and is listed in the report. (L1-11 NY Fed recession probability = Link out — the methodology page is JS-walled to plain fetches, so the probit coefficients cannot be verified and are never invented; L1-19 CNN = L3 blocked; L1-06 ASX = L3 terms-prohibited; L1-08 NAB + AIP petrol = link out, not verified. All listed in STEP3_REPORT.md.)
- [x] The "Know before you buy US shares" box shows only approved text from `docs/insights/approved-text/` (if the folder is empty, only the two exchange-rate and fees lines).

### Phase 5: fetching
- [x] Implement `SCRAPING_SPEC.md`: the method ladder, discovery procedure (at most three attempts per source), method cards, validation (F-13 to F-18), display rules (F-19 to F-23), manual entry (F-24 to F-27).
- [x] Run F-01 to F-07 for every source in section 8 of that spec. Record the result. Leave new L2 sources disabled until the owner sets `owner_accepts` to yes in `RISK_REGISTER.md`. (FS-01 CNN → BLOCKED (HTTP 418 to the honest UA) → L3, link out; FS-02 ASX → terms prohibit automated access verbatim → L3, link out; FS-03 Westpac-MI → M5 manual entry, disabled; FS-04 NAB → link out; FS-05 Alternative.me → already live L0; FS-06 Shiller → M2 pipeline built + monthly Action + archive, DISABLED until the owner accepts; FS-07 → no other composite sources added. Venue verification with the honest UA: FRED/gold-api/Frankfurter/Alternative.me/Yahoo all HTTP 200; RBA venue-blocked as documented — its verified venue is the GitHub Actions runner.)
- [x] Never use proxies, spoofed identities, headless-browser evasion, CAPTCHA tricks, or anyone's login. A block means stop.

### Phase 6: UI
- [ ] Implement `UI_SPEC.md` in this order: tokens and state language, card anatomy, hero, moves strip, stock table and AUD view, relationship cards, gold and silver balance, calendar, About section and data-health chip.
- [ ] Render the page from a fixture snapshot at 360, 768 and 1200 px with Playwright (or the repo's tool). Save screenshots to `docs/insights/screenshots/`. Run U-01 to U-14.
- [ ] For the gold and silver balance, check criteria UI-43 at 360 px. If any fails, implement the gauge fallback (UI-44) and say why in the report.
- [ ] Do not change anything outside the Insights page.

### Phase 7: automatic self-audit and export
- [ ] Extend the export generator with the columns from defect E-23 (published date, fetched time, stale flag, source URL, level, owner_accepts, enabled, peak value, peak date, peak basis, rule version and thresholds).
- [ ] Add `npm run insights:selfcheck` (or the repo's equivalent) that builds the current snapshot, runs every test, writes `docs/insights/exports/currena-insights-full-<UTC date>.md`, and writes `docs/insights/SELF_AUDIT.md` with every test's result and a list of stale or "can't tell" cards.
- [ ] Add a scheduled GitHub Action (or equivalent) that runs the self-check daily and fails visibly on any failing test. It must publish nothing.

### Phase 8: documents
Create in `docs/insights/`:
- [ ] `FIX_REPORT.md`: every ID in the fix spec and defects file, with done, partly done or not done, and how you checked it.
- [ ] `STEP3_REPORT.md`: as in `INSIGHTS_STEP3_SPEC.md` section 10, including the source table and the "Fetched sources" section.
- [ ] `UI_REPORT.md`: every UI-xx item, the screenshots, the U-xx results, and whether the gauge fallback was used.
- [ ] `MAINTENANCE.md`: the owner's weekly routine, and the steps to update every manual-entry value with the next release dates.
- [ ] `OWNER_SETUP.md`: only the steps the owner must do by hand, with exact commands: setting `INSIGHTS_OWNER_TOKEN`, any missing API key, reviewing the branch, deploying the preview, deploying to production after approval, rolling back, using the panic switch, enabling or disabling a source, running the self-check, producing a full export.

### Phase 9: final verification
- [ ] Run all tests and the self-check. All must pass or be recorded as blocked with a reason.
- [ ] Start the project locally or on the preview. Request every public data endpoint. Record what each exposes, and confirm: no API keys, no bulk history for L2 sources, no unauthenticated export. Then set `ACCESS_MODE = private` and confirm every Insights data endpoint returns 401 or 403 without login.
- [ ] Search the built client files and the repository for keys and tokens. Record that none are present.
- [ ] Search all generated text for forbidden words (T-07, T-19).
- [ ] Confirm that Currena's other pages are unchanged (compare the build output or screenshots).
- [ ] Push the branch. If the GitHub CLI is available, open a pull request titled "Insights rebuild" linking the four reports. Do not merge it.

## 4. Final output

Print a short summary:
1. Phases completed.
2. Counts of items done, partly done and blocked, per spec file.
3. Test results (passed and failed).
4. Sources enabled, disabled and blocked, and what the owner must flip in `RISK_REGISTER.md` to enable the disabled ones.
5. Blocked items with what is needed.
6. KV reads, KV writes and outside requests per full refresh.
7. The exact steps in `OWNER_SETUP.md` the owner must do next.
