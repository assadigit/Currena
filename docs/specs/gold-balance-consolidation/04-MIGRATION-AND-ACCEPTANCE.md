# 04. Migration, tests and acceptance

## 1. File-by-file change list

### New

| File | Purpose |
|---|---|
| `packages/insights/src/gold-balance.ts` | The pure engine (02) |
| `packages/insights/src/gold-balance.test.ts` | Engine unit tests |
| `docs/insights/BACKTEST-GOLD-LANES.md` | Calibration report (02 §6) |
| `docs/localization/persian-copy-round-<next>-gold-balance.md` | FA copy review record |

### Changed

| File | Change |
|---|---|
| `packages/insights/src/index.ts` | Export the new engine |
| `packages/insights/scripts/gold-backtest.ts`, `src/gold-backtest-core.ts` | **Add** the lane tables beside the frozen ones. No edit to `HARNESS_GOLD_VOTERS_21` / `_20`. Report writer gains the lane section |
| `apps/web/src/components/insights/signals/BalanceScale.tsx` | Optional `members`, `split`, `tally` on `BalanceDriver`; detail panel member list; context line slot; measured note slot. Geometry, animation and the beam formula untouched |
| `apps/web/src/components/insights/signals/MergedCard.tsx` | Build lane drivers from `goldBalance(readings)`; drop the `data-gold-panels` grid; keep the C12 banner and the footing strip |
| `apps/web/src/components/insights/signals/verdict.tsx` | Gold Outlook derived from `GoldBalanceReading` (01 §5.2). Silver path unchanged |
| `apps/web/src/components/insights/Signals.tsx`, `apps/web/src/routes/Insights.tsx` | Stop threading `goldSummary` to the card (the snapshot field still arrives; it is simply unused by the UI) |
| `apps/web/src/i18n/insights-copy-en.ts`, `insights-copy-fa.ts` | New and changed keys (03 §6). Old keys kept until OI-3 |
| `docs/localization/persian-copy-manifest.json` | Updated by the review round (`pnpm copy:audit` gate) |
| `scripts/check-bundle-budget.mjs` | Re-baseline: two panels leave the lazy chunk, one engine module and some copy enter. Record the new figures |
| `AGENTS.md`, `CHANGELOG.md`, `docs/INDICATORS_AND_DATA_SOURCES.md`, `docs/DEPLOY.md` | Session record, the gold section note ("one balance"), superseded-by pointers |
| `docs/insights/GOLD_SCORE_SPEC.md` | One note at the top and in §4.4: the panels are retired from the UI, the engine and `goldSummary` stay (pointer to this folder) |
| `docs/insights/GOLD_BACKTEST_SPEC.md` | Append the calibration decision (02 §6) |

### Deleted (P5, after the owner flips the preview)

`GoldTailwindPanel.tsx`, `ModelVsRealityPanel.tsx`, and their parts of
`gold-panels.test.tsx` (the surviving assertions move to the new tests).

### Must NOT change

`packages/insights/src/gold-score.ts`, `packages/core/src/schemas.ts`
(`GoldSummarySchema`), `packages/insights/src/adapters/snapshot.ts`,
`apps/api/**`, `docs/insights/GOLD_RECHECK_SPEC.md` procedures. The recheck
and the armed 2026-11-02 check read `goldSummary` and must keep working.

## 2. Wire and data compatibility

- No schema change, no new KV key, no new network call, no snapshot size change.
- `goldSummary` is still stamped by the ingest and still validated.
- Old snapshots (without `goldSummary`) are unaffected: the new balance never
  reads it.
- Rollback is a web-only redeploy or a flag flip. Nothing stored needs
  migrating or undoing.

## 3. Rollout

| Phase | Work | Exit gate |
|---|---|---|
| P0 | Calibration run (02 §6). Choose `GOLD_LANE_MIN_FIRING` | `BACKTEST-GOLD-LANES.md` committed, C1 and C2 recorded, decision written. Stop if neither rule passes |
| P1 | `gold-balance.ts` + unit tests + index export | Engine tests green, typecheck clean |
| P2 | `BalanceScale` members/split/context; `MergedCard` wiring behind the preview flag `?balance=lanes` (default off) | Component tests green, screenshots EN/FA 360/1280 |
| P3 | Outlook derivation behind the same flag | Outlook table tests green |
| P4 | EN copy, FA drafts, review round, manifest | `pnpm copy:audit` clean |
| P5 | Owner reviews the preview on the live site, then: default on, delete panels, bundle re-baseline, docs | All gates in §5, owner "go" recorded |

Preview mechanism: the same style as `?narrative=preview` (a query
parameter read on the Insights route, no persistence). Without the parameter
visitors see today's page until P5. This matters because the Outlook word can
change for every visitor.

Deploy follows `docs/DEPLOY.md` (deploy-lock check first). Deploys use the
owner's credentials from the local, gitignored credentials file or the repo
secrets. **No credential is written in any spec, commit message, log or
test.**

## 4. Tests

### 4.1 Engine (`gold-balance.test.ts`)

1. Lane vote: one firing voter gives `neutral`, `split = false`.
2. Two firing, both supports: `for`. Both pressures: `against`.
3. 2 supports + 2 pressures: `neutral`, `split = true`.
4. 3 supports + 1 pressure: `for`.
5. All voters of a lane stale/missing/unavailable/check-pending: `unread`.
6. Readable but all steady: `neutral`, not `unread` (problem P5).
7. A stale voter added to a lane never changes its side.
8. `net`, `counts`, `readable` for mixed lane combinations.
9. Polarity: a falling `real-yield-10y` supports; a high `us30y` pressures; a
   rising `vix` supports; a high `cftc-gold-positioning` pressures.
10. `breakeven-tilt` fires on level only.
11. Table integrity: the engine's lane membership equals `GOLD_LANE_VOTERS`
    (21 voters, 8/3/5/5).
12. Fixture test: the 2026-10-31 reading (the readings behind the archive of
    that day) produces level, 4 neutral, borrowing costs split 2 vs 2, dollar
    1 firing, inflation 1 firing. This pins 01 §7.
13. No-drift: `goldTailwindScore` output on the same fixture is unchanged
    (netScore -2, headwind, 6 of 21 firing), proving the frozen engine is
    untouched.

### 4.2 Outlook (`verdict` tests)

A table test over `(L, A, unread, speed, band)` for every branch of 01 §5.2:
null, strong-bullish (L=3, L=4), strong-bearish, range-bound with and
without quiet price, mixed, neutral, bullish, bearish. Plus: footing no
longer changes the state (same lanes, gold change30d of -9% and +9% give the
same state unless range evidence differs). Silver outlook tests unchanged and
green.

### 4.3 Web component

1. Lane chips land in the right pan or tray for each side.
2. A split lane shows the "Split" badge and the "2 for, 2 against" line.
3. Detail panel lists members grouped by impact; steady group collapsed;
   inflation lane shows the tilt phrase; `breakeven-5y5y` row shows the
   card status.
4. B-12: no member line uses "elevated" unless the card status is `warning`.
5. Context line renders for a known `change30d`; hidden when missing.
6. Measured note and backtest link render without interaction.
7. DOM scan: no "tailwind", "headwind" or "wind" text in the gold card, EN and
   FA.
8. No element with `data-gold-label`, `data-gold-panels` or
   `id="insights-gold-tailwind"` (after P5).
9. RTL: pan sides mirror; beam sign for the heavy side unchanged.
10. 360px and 1280px: no overflow, no clipped chips (the existing balance
    layout tests extended).
11. EN and FA dictionaries both cover every new key (the existing
    dictionary-coverage pattern from `gold-panels.test.tsx`).
12. Keyboard: Enter/Space opens the detail panel; focus returns on close.
13. Flag: without `?balance=lanes` (P2 to P4) the legacy rendering is
    unchanged (snapshot of the legacy markup).

### 4.4 Harness

The lane tables run in the harness test (`gold-backtest-core.test.ts`
pattern) on a small synthetic corpus: states, flip counts, C1 and C2
computations are unit tested. The frozen tables' outputs stay byte-identical
(a regression test on the stored report numbers).

## 5. Gates (all must pass before P5)

`pnpm -r test`, `pnpm -r typecheck` (6 of 6), lint clean on touched files,
`pnpm copy:audit`, the bundle budget check (re-baselined and recorded), the
narrator-vocabulary drift check and `LAYER1_STRICT=1` suites as AGENTS.md
requires, plus live verification in both locales at 1280px and 360px with
zero console errors.

## 6. Acceptance criteria

| ID | Criterion |
|---|---|
| AC-1 | The gold card contains exactly one gold instrument: the balance. No wind or model-vs-reality panel remains (after P5). |
| AC-2 | Every one of the 21 voters is reachable from a lane chip's detail panel. |
| AC-3 | The balance, its verdict word and the gold Outlook state are computed from the same `goldBalance()` result and cannot disagree. |
| AC-4 | Each indicator is evaluated by `evalLeg` only. No bespoke stress or expectations rule remains in the gold path. |
| AC-5 | A lane with fewer than `GOLD_LANE_MIN_FIRING` firing voters never moves the beam. |
| AC-6 | `unread` and `neutral` are distinct states in engine, UI and copy. |
| AC-7 | Gold's 30-day move is shown as context and counted nowhere in the verdict or the Outlook. |
| AC-8 | The honesty rules in 01 §8 are visible on the card, in EN and FA. |
| AC-9 | `goldTailwindScore`, `goldSummary` and the frozen harness tables are unchanged and their tests pass. |
| AC-10 | The calibration report exists, states n for every cell, applies the pre-registered criteria, and claims no forecasting edge. |
| AC-11 | The 2026-10-31 fixture reproduces 01 §7. |
| AC-12 | All gates in §5 pass. Owner approval of the live preview is recorded before the default is flipped. |

## 7. Risks

| Risk | Mitigation |
|---|---|
| The page reads "Neutral" or "Balanced" more often and feels less decisive | Intended and stated in 01 §7. The price chart sits directly above. Revisit rule parameters only through the harness and an owner round |
| Calibration shows both min rules degenerate | Stop, report to the owner (02 §6). Do not ship |
| Users miss the detail the wind panel showed | Everything is one tap away (AC-2). The chip tally keeps the evidence count visible |
| FA review delays the flip | Preview stays off by default; EN and engine work are unaffected |
| Parallel gap-closure edits to shared files | `git pull --rebase` and re-read before editing shared files; keep commits small |
| The recheck watch (2026-11-02) is disturbed | The frozen engine, `goldSummary` and ingest are untouched (AC-9) |
| Silver Outlook keeps its circular footing | Recorded as OI-4, separate decision |
| Calm no longer counts as pressure | Flagged in the PR description; one line to reverse |

## 8. Suggested commit and PR shape

- Branch: `spec/gold-balance-consolidation` (this spec set). Implementation
  branches: `gold-balance/p0-calibration`, `p1-engine`, `p2-ui`, and so on,
  one PR per phase, each referencing this folder.
- Commit subjects follow the gold program's recent style in `git log`, for
  example `insights(gold-balance P1): ...` for code and
  `docs(gold-balance P0): ...` for reports.
- The PR description for P0 must include the calibration table. The PR for P2
  must include the screenshots from 03 §7.
