# Insights — Layer 2 Preparation (Spec)

Repo: assadigit/Currena. Prerequisite: Layer 1 is complete and live (see `docs/insights/layer1/FINAL-REPORT.md`; read it first, especially §9 and §10).

## 1. Why this session exists

Layer 2 will be an AI "narrator": a scheduled Worker job gives a model the already-computed state of the page plus our plain-language vocabulary, and the model explains that state in a few plain sentences, in Farsi and English. The math decides; the AI only explains.

Before that can be built safely, four problems found in the Layer 1 report must be solved. This session solves them. It builds NO AI feature, makes NO model calls, adds NO model keys or prompts. Anything that calls an AI belongs to Layer 2.

## 2. Non-negotiables

- Approved site wording always wins (D-02). Do not rewrite Layer 1 copy.
- Do not change verdict/gauge math or thresholds, and do not alter existing alert behaviour.
- Free-tier safety: report every new KV read/write and every new external fetch this session adds, with the daily total. Stay inside Cloudflare free limits.
- Do not bypass bot protection or break any site's terms (see §4). Free, legitimate data sources only.
- Web bundle must not grow beyond the existing budgets (entry 296.00/89.50, Insights lazy 1100.00/260.00). Prefer net-zero. If a budget bump is truly unavoidable, use the D-16 path (measured numbers in the changelog).
- Do not ask the owner questions. When ambiguous, read the code and existing docs, choose the most conservative option, and log it in `docs/insights/layer2/DECISIONS.md` (continue numbering after D-19 as D-20…).

## 3. Work item P1 — Freshness (data age) for every reading

Problem: three Australia readings (`au-10y`, `rba-expectations`, `au-us-10y-gap`) have been stale since 2026-09-30 and the page still presents them as normal. An AI explaining stale data as if live would be worse.

Build:
1. A pure, tested function (in `packages/insights`, no I/O) that, for each reading, returns `{ asOf, ageHours, cadence, freshness }` where `freshness` is `fresh | stale | unavailable`.
2. Staleness is relative to each series' real publishing cadence, never absolute (monthly data is legitimately weeks old). Set `cadence` per indicator from the inventory/source. Conservative defaults, which you may refine and must log: daily series stale after 4 calendar days (covers weekends and short holidays); weekly after 10 days; monthly after 45 days; quarterly after 120 days.
3. Use the timestamps the system already stores. Change the API response shape only if timestamps genuinely do not exist, and only additively.
4. Page honesty, minimal: where a reading is `stale` or `unavailable`, show a small muted "Data as of <date>" line using existing styles, in both languages, ONLY if the card does not already say so. Add the 2–3 new UI strings with Persian-safe wording and keep `copy:audit` clean. No other visual change.
5. Tests: fixtures for each cadence at the boundary (just fresh, just stale), a weekend case, a missing-timestamp case.

## 4. Work item P2 — Australia data source (RBA blocked)

Problem: the Worker's egress is blocked on rba.gov.au paths (documented in Round 10).

Do:
1. Investigate and document precisely what is blocked and why.
2. Find a legitimate fix in this order: an official RBA data feed or file that is not blocked and is permitted for automated access; another free, official source for the same figures; an existing free API the project already uses. Check each source's terms and cite them in the decisions log.
3. Do NOT use residential proxies, header spoofing, browser impersonation or any other way of evading bot protection.
4. If no clean fix exists, mark `au-10y`, `rba-expectations`, `au-us-10y-gap` as `unavailable` via P1 (never show frozen numbers as live) and write `docs/insights/layer2/AU-DATA-OPTIONS.md` with what was tried, what remains, and the single recommended next step.
5. If a fix works, verify live: fresh readings appear, P1 reports `fresh`, and the free-tier impact is stated.

## 5. Work item P3 — Make the vocabulary usable from the Worker

Problem: the Layer 1 copy and glossary live in `apps/web/src/i18n` (lazy web bundle), but the narrator will run in a Worker.

Build:
1. Make ONE source of truth importable by both web and Worker (a shared package or a build-time generated JSON, your choice, but no duplicated text and no drift). The web app must keep working exactly as today.
2. Expose `getNarratorVocabulary(ids, lang)`: returns, for ONLY the requested indicator ids, the compact fields the narrator needs (`plainName`, `oneLine`, `ifRising`, `ifFalling`, the connections between the requested ids) plus only the glossary terms those entries use. Reason: the model will receive the subset relevant to today's state, not all 129 entries.
3. Both languages, typed, with the same compile-time shape parity as today.
4. All Layer 1 gates must pass UNCHANGED: `LAYER1_STRICT=1` validator still 7809 assertions (new tests may be added separately), `copy:audit` clean, typecheck, lint, bundle budget held.

## 6. Work item P4 — The narration input contract

Build a pure, typed, tested function `buildNarrationState(snapshot, now)` that turns the existing computed page state into the small JSON the narrator will receive:
- overall verdict and its label (existing summary labels);
- alerts currently firing: id, tier, direction, plain magnitude (no raw API dumps);
- active patterns: id and tier;
- per item: its P1 freshness; items that are `stale` or `unavailable` are listed under a separate `excluded` array with reason, never mixed into the facts;
- `generatedAt` and `dataAsOf` (oldest/newest fresh timestamp).
Also produce `docs/insights/layer2/NARRATION-STATE.md` documenting the exact shape with 3 real examples taken from live data: a calm day, a stressed/alarmed day (build a realistic one from historical rules or fixtures if none exists live), and a day with excluded stale data.
Save those three as golden fixtures plus tests that fail if the contract shape changes unnoticed. Do not call any model.

## 7. Work item P5 — One command for all gates (CI is red)

GitHub Actions has been red since 2026-10-20 (account-side minutes/runner issue). Do not try to fix billing. Instead:
1. Add one command (e.g. `pnpm gates`) that runs, in order: typecheck, lint, `copy:audit`, the strict Layer 1 validator, all tests, build + bundle budget. It exits non-zero on any failure and prints a one-screen summary.
2. Write the 5-line "how to repair CI" instructions into `docs/DEPLOY.md` for the owner, stating what is owner-side.

## 8. Deployment

Follow the deploy-lock protocol from Layer 1 (check Cloudflare versions/deployments first; never deploy while a parallel session may have deployed). Deploy only when every gate passes. Redeploy markets worker only if its code changed. Verify live afterwards: health ok, readings present, P1 freshness correct on the page, no console errors, EN + FA at 360px and 1280px.

## 9. Definition of done and report

Done = P1–P5 complete, all gates green with the Layer 1 numbers unchanged, new tests passing, deploy verified (or explicitly deferred with a reason), and `docs/insights/layer2/PREP-REPORT.md` written containing: what changed per item, files, gate results, free-tier impact numbers, AU data outcome (fixed or `unavailable` + options), decisions D-20…, and a "What Layer 2 can rely on" section listing the exact imports: freshness function, `getNarratorVocabulary`, `buildNarrationState`, the fixtures, and `pnpm gates`.
