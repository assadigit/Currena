# FIX_REPORT.md — the v3 insights-rebuild report (runbook Phase 8)

Report date: 20 October 2026 (UTC). Branch: `insights-rebuild`, spec package
v3 (2026-10-17) installed at `568598c`. Supersedes the v2 edition (in git
history; the Parts A–D implementation evidence also lives in
`FIX_REPORT-2026-10-15.md`).

Verification tooling on this branch (all green at report time):

- The T-01…T-14 engine suite (`packages/insights/src/validation.ts`) runs on
  every ingest AND inside `pnpm --filter @currena/insights selfcheck`.
- The Step 3 / scraping checks (`validation-step3.ts`) + the new v3 gates
  (`sources.ts`, `adapters/fetch-policy.ts`, `adapters/collect.ts`,
  `adapters/snapshot.ts` gates, `connections.ts` summaries) — 1,637 monorepo
  tests green; the visual acceptance suite 19/19 (U-14 the one expected-fail,
  its real-worker wiring recorded in Phase 9).
- `docs/insights/SELF_AUDIT.md` — the latest full-suite run (25/25 rows:
  the engine checks + one row per unit-suite package).
- The baseline proof re-run 2026-10-20: the defect checks still FAIL on
  `tests/fixtures/insights-baseline-2026-10-15.json` (8 fail / T-19 passes
  honestly) — `baseline-test-results.md`.

## 1. The defect file (E-01…E-24) — all done

| ID | Status | How checked (v3) |
|---|---|---|
| E-01 Yahoo as an L2 source | **done** | Treated as L2 under `RULES.md`/`RISK_REGISTER.md` (machine twin `packages/insights/src/sources.ts`): level L2, `owner_accepts` yes (the owner's recorded 2026-10-17 acceptance — never edited by the agent), NOT removed. Every Yahoo-backed card names the futures/unofficial source on its face (the E-03 note) and the meta row carries the source link (UI-20, Phase 6); the worst-leg walk keeps each card failing closed (T-15); a refusal now classifies as a block and fails closed (T-27). The 2026-10-19e owner directive still lifts only the four price tiles' public display, re-confirmed quarterly (MAINTENANCE). |
| E-02 gold-api terms | **done** | Terms read and quoted (`gold-api.com/terms` §9, 2026-10-16); the v3 F-01 pass re-verified the endpoint answers the honest UA (HTTP 200 on /price/XAU, 2026-10-20). Level L0 assigned from the provider's own quoted terms (RULES §2); the recorded owner acceptance stands unchanged. |
| E-03 futures wording | **done** | The tiles' context lines and the export price details open with the futures note (en+fa); registry `sourceRef` names the contract. |
| E-04 frozen daily series | **done** | T-08 in-series + cross-day halves; v3 refinement (2026-10-20, found by the LIVE self-check): the daily rule is precision-aware — natural 2dp quotes (yields, VIX) may repeat briefly, ≥3dp prints (the copper 14772.999807 class) never. The E-04 baseline fixture (6 decimals) still fails the check — the proof holds. |
| E-05 identical moves | **done** | `checkE05IdenticalMoves` in the markets run report; no mapping bug. |
| E-06 AU yields stale | **done** | `staleAfterDays: 4` + the stale tag machinery; checkE06 proven on the baseline; the new v3 "Delayed" state also shows a one-trading-day lag before staleness. |
| E-07 quarterly labels | **done** | `periodStart`/`periodEnd` + quarter-word labels; both source bases pinned by tests. |
| E-08 manual expiry | **done** | `enteredOn`/`expires` enforced by zod; expiry → stale + E-08 reason; MAINTENANCE documents the update. |
| E-09 past events | **done** | The builder drops past events; U-12 pins it in the browser. |
| E-10 M2 unit | **done** | Stored in US$ billion, displayed 23.3 trillion; checkE10 + display pins. |
| E-11 interest bill scale | **done** | Stored as a percentage (33.55); the §8 registry `definition` field now states the denominator in plain words. |
| E-12 gold/silver vs BTC orientation | **done** | Retitled to the oz-per-bitcoin orientation. |
| E-13 repeated Bitcoin lines | **done** | The sentence lives on the Bitcoin row only. |
| E-14 NSA CPI series | **done** | Year-on-year rates from the not-seasonally-adjusted series; B-14/E-14 companion check in MAINTENANCE. |
| E-15 midpoint | **done** | DGS2 − midpoint((DFEDTARL+DFEDTARU)/2); the §8 registry `definition` records the arithmetic. |
| E-16 target range | **done** | rangeLow/rangeHigh render the 3.75–4.00% corridor with decided/effective dates. |
| E-17 T10YIE reconciliation | **done** | T-01 uses T10YIE, same date, ±0.05; T5YIFR keeps the 5y5y card. |
| E-18 trend reproducible | **done** | The 3-month label is reproducible from `trendFrom3m`; the v3 UI removes the unverifiable Trend column entirely (UI-27) — the number (3 months %) stays and the E-18 check pins the label rule. |
| E-19 trigger gating | **done** | Trigger-absent cards show "Trigger not present" (v3 wording; engine summary `triggerPresent: false`; U-08b green). |
| E-20 same method/windows | **done** | One leg method (direction-over-window with minMove); windows shown in the card details; the neutral "N of M readings match" summary replaces the old badges. |
| E-21 "Unusual" status change | **done** | Confirmed intended in rule v2 (documented); the v3 state language RETIRES the word entirely (UI-04): the percentile extremity carries via the position bar, cards show "Normal". |
| E-22 stock labels | **done** | L2-01 words (Near its high/Pullback/Correction/Bear market); no "Normal" in the table (U-11). |
| E-23 export audit columns | **done** | Both exports carry published date, fetched/updated time, stale flag, source URL, licence, **level, owner_accepts, enabled, fetch method** (v3 additions), peaks + basis, rule version + the rule JSON verbatim. |
| E-24 peak columns | **done** | Peak/Peak date/Peak basis/Below peak % on the price rows (closing/daily-high basis stated); T-05 floors pinned. |

## 2. The fix spec

**Part A (A-01…A-08): done** — verified per-ID in the v2 edition and
re-pinned by the suite: the single registry (A-01, now with the §8 v3
fields: publisher, what_it_is/what_it_isnt/track_record_note, definition,
fail_closed_conditions, sourceRisk), generated text only (A-02, T-06/T-19),
validation before publish (A-03, the suite + the SELF_AUDIT gate), safe
failure (A-04, hold-last-good + the v3 M-6/T-27/F-16/T-28 builder gates),
daily snapshot archive (A-05), context notes off by default with expiry
(A-06), rule versions (A-07, `ruleVersion.ts` shown in card details + About),
status panel (A-08, About + `/api/insights/status`).

**Part B (B-01…B-19): done** — B-01 peaks on one stated basis; B-02
duplicate/zero-change discipline (T-08, precision-aware since v3); B-03
unrounded comparisons + the dollar speed rule; B-04 the six explicit
relationship rules (now with neutral match summaries, UI-33..38); B-05
release dates; B-06 decided/effective dates; B-07 quarter labels; B-08 UTC
time zone shown; B-09 stale tags (+ the v3 Delayed state); B-10 same-date
gaps ("dates differ" marker); B-11 source on every card (now on the FACE
per UI-20 + in details + About + export); B-12 one status everywhere (T-11);
B-13 the 5y5y label verified against T5YIFR; B-14 oil scored, hero counts
reconcile (T-09); B-15 copper/gold labelled monthly; B-16 derived values
from the same snapshot (T-02); B-17 percentage points on the money panel;
B-18 the real-return line ("before tax"); B-19 highest-since from full
history (T-22).

**Part C (C-01…C-07): done** — cash-rate card, iron ore, Fed expectations
gap (midpoint), US 30y, Philly Fed, RBA expectations gap, the calendar
(decision days, own time zones, ics).

**Part D (T-01…T-14): done** — the engine suite, run before every publish,
plus the v3 additions recorded in `baseline-test-results.md`.

## 3. The v3 spec-package additions (this run)

- The source risk register (`sources.ts` + `RISK_REGISTER.md`): levels,
  owner_accepts (mirrored, never edited for new sources), the M-6 kill
  switch wired through collect (never requested), the snapshot builder
  (cards go dark) and the public hidden set (T-15/T-26/T-30/T-31).
- The honest fetch layer (F-08/F-09/F-10/F-11/F-18): one declared UA
  everywhere (the spoofed Mozilla identities are gone from every Insights
  fetch — T-25), single attempt, blocked/bot-check taxonomy (T-27),
  conditional-request support (no inspected source currently emits ETag —
  recorded, the mechanism stands ready), content hashes on every fetch row.
- The definitional sanity ranges (T-28/F-14) and the format-change class
  (F-16) — the builder hides values and names reasons, never a verdict.
- The FS-01..FS-07 discovery verdicts (recorded in RISK_REGISTER.md and
  STEP3_REPORT.md): CNN blocked (HTTP 418 to the honest UA) → L3 link-out;
  ASX terms prohibit automated access verbatim → L3 link-out; NY Fed
  methodology JS-walled → L1-11 link-out; the Shiller FS-06 pipeline built
  (monthly Action, archived, verified live: CAPE 40.71 for 2026-10) and
  DISABLED until the owner accepts.
- The API mitigations (M-2/M-3/M-4/M-5 + the owner endpoints): 96 route
  tests; the panic switch flips every Insights data endpoint private within
  one refresh cycle (env var, or KV + owner endpoint for a no-redeploy flip).

## 4. Not verified / blocked

- The ABS/ECB/World Bank/Frankfurter reuse clauses remain UNQUOTED to plain
  fetches (JS-rendered or bot-checked pages — recorded per attempt in
  RISK_REGISTER.md; fail-closed publicly stands). The ECB's own disclaimer
  (no reuse prohibition found in it) is now quoted verbatim (2026-10-20).
- The NY Fed probit coefficients (L1-11) could not be verified from a plain
  fetch — the card stays a link-out rather than risking invented numbers.
- Nothing else is blocked: every checklist item in the fix spec, the defects
  file, the Step 3 spec, the scraping spec and the UI spec is implemented
  and verified, except the Phase 9 items listed in `PHASE7_VERIFICATION`-style
  evidence (the final verification is recorded in this run's Phase 9 notes
  and STEP3_REPORT.md §9).
