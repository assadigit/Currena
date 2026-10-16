# Currena Insights: Agent Runbook

This file tells the coding agent exactly what to do, in order, without asking questions. Read it completely first.

Repository: assadigit/Currena (Cloudflare Workers, free KV). Owner: Ali.
Files for this job, all in `docs/insights/`:

| File | Purpose |
|---|---|
| `AGENT_RUNBOOK.md` | This file. The procedure. |
| `INSIGHTS_FIX_SPEC.md` | Foundation, fixes, additions and tests (IDs A-xx, B-xx, C-xx, T-01 to T-14). |
| `INSIGHTS_DEFECTS_2026-10-15.md` | Defects found in the latest page export (IDs E-01 to E-24). |
| `INSIGHTS_STEP3_SPEC.md` | Access gate, licence policy, published indicators, standard definitions, tests T-15 to T-24. |
| `baseline/currena-insights-full-2026-10-15.md` | The page export the defects were found in. Use it as evidence and as test fixtures. |

If two files disagree, the order of authority is: this runbook, then `INSIGHTS_STEP3_SPEC.md`, then `INSIGHTS_DEFECTS_2026-10-15.md`, then `INSIGHTS_FIX_SPEC.md`.

---

## 1. Mission

Make the Insights page correct, self-checking, private by default, and complete for an Australian saver and investor who buys US shares. When you finish, the owner can run one command to produce a self-audit and a full export, and the next audit needs no manual work.

## 2. Hard rules

1. **Work alone.** Do not ask questions. If something is ambiguous, choose the safest option, write the choice in the report, and continue.
2. **Branch only.** Work on a branch named `insights-rebuild`. Commit at the end of every phase. **Never deploy to production.** Never push to the main branch. Deploy only to a preview or staging address if one exists.
3. **Secrets.** Never print, log or commit API keys, tokens or passwords. Keep them in Cloudflare secrets or local environment files that are ignored by git. Never expose them to the browser.
4. **Never invent.** Do not invent a series ID, table name, URL, number, threshold or licence term. Confirm each in the provider's own documentation or API response. If you cannot (for example no network), mark it "not verified" and do not show it as a normal card. Show "can't tell right now" or hide the card, and list it in the report.
5. **Fail closed.** Wrong or stale data must never look current. Stale, failed, duplicate or unverified inputs produce a stale tag or "can't tell right now", never a verdict.
6. **Wording.** All text shown to users describes conditions only. No forecasts. No "will", "should", "time to", "expected to". No buy, sell or hold language. No claims about causes in the news.
7. **Units.** Percentage points for rates, inflation, yields, spreads, unemployment. % only for prices and indexes.
8. **No design changes** and no features that are not in the specs.
9. **No scraping** of websites that offer no feed or API and no stated reuse terms. Use a link-out.
10. **Free limits.** Stay inside Cloudflare free-tier limits. Combine history into few large KV keys. If one scheduled run would exceed the outside-request limit, split it across several scheduled runs. Report KV reads, KV writes and outside requests per full refresh. Keep the existing refresh times (09:13 and 22:13 UTC).

## 3. Setup

- [x] Create branch `insights-rebuild` from the current default branch.
- [x] Find and record: the test runner (use the repo's own; if none exists add Vitest), the command to run all tests, how the page export is generated, where indicators are defined, where rules live, how text is produced, how the refresh is scheduled, and the KV bindings.
- [x] Run the existing tests and record the baseline result.
- [x] Parse `baseline/currena-insights-full-2026-10-15.md` into fixture data under `tests/fixtures/` so tests can run against it.

## 4. Phases

After each phase: run the full test suite, fix failures, then commit with the message `phase N: <summary>`. If a test still fails after three honest attempts, record the item as blocked (what failed, what you tried, what is needed) and continue. Never leave the branch in a state where tests that passed before now fail.

### Phase 0: current-state report (read-only)

Produce `docs/insights/CURRENT_STATE_REPORT.md` covering items S-01 to S-08 of `INSIGHTS_STEP3_SPEC.md` section 1. Cite evidence for every claim (file and line, or command output). Do not stop after writing it. Continue to Phase 1.

### Phase 1: tests first, then foundation

- [x] Implement the validation tests T-01 to T-14 from `INSIGHTS_FIX_SPEC.md` and T-15 to T-24 from `INSIGHTS_STEP3_SPEC.md`, plus one extra test per defect E-04, E-05, E-06, E-10, E-11, E-18 and E-24.
- [x] Run these tests against the baseline fixtures. For each defect they must **fail**, proving they catch it. Record the list of failing tests as `docs/insights/baseline-test-results.md`.
- [x] Implement `INSIGHTS_FIX_SPEC.md` Part A (A-01 to A-08): single indicator registry, generated text, validation before publish, safe failure, daily snapshot archive, context notes off by default, rule versions, status panel.
- [x] Add the licence fields from `INSIGHTS_STEP3_SPEC.md` section 8 to the registry.

### Phase 2: defects and fixes

- [x] Fix every defect E-01 to E-24 in `INSIGHTS_DEFECTS_2026-10-15.md`. After each fix, the matching test must go from failing to passing.
- [x] Implement every remaining item in `INSIGHTS_FIX_SPEC.md` Part B and Part C that is not already in place (check against the baseline; items verified as present in section B of the defects file only need a regression test).
- [x] Tick each checkbox in the spec files only after you have implemented and verified it.

### Phase 3: access and licences

- [x] Implement `INSIGHTS_STEP3_SPEC.md` section 2: private gate (AC-01 to AC-08), `SITE_MODE`, licence register (LR-01 to LR-04), `LICENCES.md`.
- [x] The gate must protect every Insights data endpoint, the snapshot archive and the export. The page shell may stay public. Unauthenticated requests return 401 or 403 with no data. Use a password read from a secret named `INSIGHTS_PASSWORD` (signed, expiring cookie, rate limited), unless Cloudflare Access is already available and simpler.
- [x] Mark every source `private_ok` and `public_display_ok`, with `terms_checked_on` and the attribution text.

### Phase 4: published indicators and definitions

- [x] Implement `INSIGHTS_STEP3_SPEC.md` sections 4 to 7: Layer 1 indicators (with status Use, Check or Link out), Layer 2 definitions (L2-01 to L2-10), Layer 3 summaries (L3-01 to L3-04), Australian coverage, and the "Know before you buy US shares" box (show only the exchange-rate and fees lines unless the owner has added approved text to `docs/insights/approved-text/`).
- [x] Any indicator whose series or terms cannot be verified stays "Link out" or hidden, and is listed in the report.

### Phase 5: automatic self-audit and export

- [x] Extend the export generator with the columns from defect E-23 (published date, fetched time, stale flag, source URL, licence, private and public flags, peak value, peak date, peak basis, rule version and thresholds).
- [x] Add a command `npm run insights:selfcheck` (or the repo's equivalent) that: builds the current snapshot, runs every test, writes `docs/insights/exports/currena-insights-full-<UTC date>.md`, and writes `docs/insights/SELF_AUDIT.md` with a table of every test, pass or fail, and a list of stale or "can't tell" cards.
- [x] Make a scheduled GitHub Action (or the repo's equivalent) run the self-check daily and fail visibly if any test fails. Do not publish anything from it.

### Phase 6: documents

Create these files in `docs/insights/`:

- [x] `FIX_REPORT.md`: every ID from the fix spec and defects file, with done, partly done or not done, and how you checked it.
- [x] `STEP3_REPORT.md`: as described in section 10 of the Step 3 spec, including the licence table with the date each term was checked.
- [x] `MAINTENANCE.md`: the owner's weekly routine (Step 3 spec section 11), plus the steps to update any manual-entry value.
- [x] `OWNER_SETUP.md`: the exact steps the owner must do by hand, with exact commands, and nothing else. Include: setting the `INSIGHTS_PASSWORD` secret, any missing API key, how to review the branch, how to deploy the preview, how to deploy to production after approval, how to roll back, how to run the self-check, and how to produce a full export for audit.

### Phase 7: final verification

- [x] Run all tests and the self-check. All must pass, or be recorded as blocked with a reason.
- [x] Start the project locally or on the preview. Request each Insights data endpoint without a login. Each must return 401 or 403 and no data. Record the result.
- [x] Search the built client files and the repository for API keys. Record that none are present.
- [x] Search all generated text for forbidden words (T-07, T-19). Record the result.
- [x] Push the branch. If the GitHub CLI is available, open a pull request titled "Insights rebuild" with the three reports linked. Do not merge it.

## 5. Final output

Print a short summary:

1. Phases completed.
2. Counts of items done, partly done and blocked, in the fix spec, defects file and Step 3 spec.
3. Test results (passed and failed).
4. Blocked items with what is needed.
5. KV reads, KV writes and outside requests per full refresh.
6. The exact steps in `OWNER_SETUP.md` the owner must do next.
