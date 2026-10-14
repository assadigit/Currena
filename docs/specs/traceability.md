# World currencies — requirement traceability

Every requirement from the two governing documents, mapped to where it lives in
the code and the test that proves it. Audited 2026-10-14 after the v1.3 change
request was implemented.

**Documents:**
- Base spec: `docs/specs/insights-world-currencies.md` (v1.2)
- Change request: `docs/specs/insights-world-currencies-v1.3-change-request.md`
  (v1.3 — **wins where the two disagree**)

**Verification stack:** 1,058 tests pass workspace-wide (core 183, scraper 67,
insights 339, markets 7, api 136, web 326) · typecheck clean in all 6 packages ·
14 screenshots in `docs/screenshots/` (EN/FA × desktop/phone × all states).

---

## 1. Base spec (v1.2) — section map

| Spec section | Requirement (summary) | Implementation | Proof |
|---|---|---|---|
| §0–1 | Scope, decisions, assumptions | `packages/insights/src/fx/` module as a whole | Spec text |
| §2–3.1 | The 10 pairs | `providers.ts` pair list, `definitions.ts` | `fx.test.ts` (pairs present in every snapshot fixture) |
| §3.2 | Dollar measure (D-06: Currena basket, not spec default weights) | `compute.ts` → `basket.ts` | `fx.test.ts` dollar measure cases; `docs/DECISIONS_FOR_ALI.md` D-06 |
| §4.1–4.2 | Data principles, providers (Frankfurter, Yahoo, FRED — no EODHD quota) | `providers.ts` | Unchanged in v1.3 (see §6 below) |
| §4.3 | Validation / accuracy guard | `job.ts` validation pass | `fx.test.ts` validation tests |
| §4.4 | Schedule (daily cron) | `apps/markets/src/crons.ts` | Unchanged in v1.3 |
| §5 | Free-tier budget, 20 KB public object | `store.ts` public strip | `store.test.ts` size test |
| §6.1–6.2 | Engine changes, `big_move` tag | `compute.ts` | `fx.test.ts` |
| §6.3 | Rules R1–R7 starting thresholds | `definitions.ts` (single config block) | `fx.test.ts` per-rule tests |
| §6.4 | 13-week pattern check + downgrade | `compute.ts` downgrade pass | `fx.test.ts`; v1.3 additions in `fx-v13.test.ts` ("downgrade" describes) |
| §6.5 | Section verdict feeds hero count | `compute.ts` `summarizeFxRules` | `fx.test.ts` |
| §6.6 | Evidence run (one-off) | `packages/insights/scripts/fx-evidence.ts` → `insights-world-currencies-evidence.md` | Evidence file (re-run 2026-10-14 with v1.3) |
| §6.7 | Distance to warning | `compute.ts` (R3: nearer leg — v1.3 §3.1) | `fx.test.ts` + `fx-v13.test.ts` |
| §7 | Rule content EN+FA | `i18n/insights-copy-en.ts` / `-fa.ts` (`fx.rules.*`) | `fx-presentation.test.ts`; v1.3 rewording in `fx-v13.test.ts` T10 |
| §8 | Per-pair context content | copy files `fx.pairs.*` | `fx-presentation.test.ts` |
| §9.3 | Anatomy: verdict → In plain words → cards → chart → rows → quiet area | `WorldCurrencies.tsx` | Screenshots `en-desktop-live*.png`, `fa-desktop-live.png` |
| §9.4 | Pair detail panel (+ v1.3 S5 money line) | `WorldCurrencies.tsx` PairDetail | `fx-v13.test.ts` "S5"; screenshot `en-desktop-pair-detail.png` |
| §9.5 | States: live / stale / no-data / empty | `WorldCurrencies.tsx` state guards | Screenshots `*-stale.png`, `*-nodata.png`, `*-empty.png`; `fx.test.ts` |
| §9.6 | Farsi RTL, Persian digits, Jalali dates | `i18n` + `numberLocale` plumbing | Screenshots `fa-desktop-live.png`, `fa-phone-live.png`; `fx-v13.test.ts` T10 |
| §9.7 | Accessibility (keyboard, sr) | `WorldCurrencies.tsx` (buttons, `sr-only`) | Screenshots + component review |
| §9.8 | Not in v1 | — | — |

## 2. Change request (v1.3) — section map

| CR section | Requirement | Implementation | Proof |
|---|---|---|---|
| §1 | Data accuracy check | Informational — numbers matched public sources | CR text itself |
| §2 B1 | R7 "barely moved" wording wrong | Corrected R7 (below) | `fx-v13.test.ts` T2 |
| §2 B2 | Context card counted as active | `fxHeadline` counts only counted Active/Watching; R7 excluded | T3 "R7 never leads the headline"; T1 |
| §2 B3 | Dots/"Held in" on pattern-check-less rules | `fxRuleView` + `fxRuleHasPatternCheck` gate (R4, R7) | T3 first `it` |
| §2 B4 | Raw codes on screen | Plain names everywhere (below) | T5 |
| §2 B5 | Alarm line on context card / signed next to unsigned | R7 card shows no alarm line; `fxChangeLine` words | T3 |
| §2 B6 | Closest pattern repeated in quiet list | `fxQuietRules(excludeId)` | T4 third `it` |
| §2 B7 | Fixed dollar meaning line | `fxDollarMeaning` follows direction | T7 |
| §2 B8 | "Calm" during biggest 1-month dollar move | R3 M1 trigger + big-mover headline (below) | T1, T8 |
| §3.1 | R3 one-month trigger (M1 ±3.0 OR M3 ±4.0), variant names the leg, distance = nearer leg | `definitions.ts` `R3_DOLLAR_M1_STRONG/WEAK`; `compute.ts` R3 dual-leg | T1, T8; `fx.test.ts` R3 cases |
| §3.2 | Calm + big mover headline template | `fxHeadline` big-mover branch; `fxMoverSentence` | T7 second `it` ("the big mover") |
| §3.3 | Corrected R7: ≥2.5% EUR/USD gate, dollar-led (same sign, \|d\|≥1.5) / euro-led (\|d\|<1.0) / no card | `compute.ts` R7 (e = −eurusd.m1) | T2, T9 |
| §4.1 | Writing rules (≤20 words, no raw codes, direction named, period named, three statement kinds, Persian rules) | All copy + `fx-v13.test.ts` enforcement | T11, T5, T10 |
| §4.2 S1 | Dollar plain line (5 bands + year-extreme clause) | `fxPlainWords` S1; `plain.dollarYearExtreme` flag | T6 first `it` |
| §4.2 S2 | Two biggest movers, own-change maths (USD/X inversion) | `plain.movers` + `fxMoversOf` fallback; `buildFxPlain` | T6 second + fifth `it` |
| §4.2 S3 | Australian dollar line (always) | `fxPlainWords` S3 | T6 third `it` |
| §4.2 S4 | Mood line (counted warnings only) | `fxPlainWords` S4 | T6 fourth `it` |
| §4.2 S5 | Money line (1,000 units, old = new ÷ (1+M1/100), \|M1\|<0.5 "about the same") | `fxMoneyLine` in PairDetail | `fx-v13.test.ts` "S5" describe |
| §4.3 | Four-answer cards; Level 1 headline verdict + sentence; Level 2 "What would change this"; Level 3 "In everyday terms"; R1–R7 plain titles + verdicts EN/FA | copy files (`rules.rN.headline.*`, `everyday`, `changeLine`); `fxHeadlineVerdict`, `fxChangeLine`; `WorldCurrencies.tsx` levels | T1 (headline), screenshots `en-desktop-live-level3.png`; downgraded-warning verdict tests |
| §4.4 | Quiet area wording (line1/line2, bar label, section title, "{n} more" toggle, no repeat) | `fxQuietView`, copy `quietArea.*` | T4; screenshots `*-quiet*.png` |
| §4.5 | "How to read this section" (5 items, button, closed default) | `HowToRead` component; copy `howToReadItems` | Screenshot `en-desktop-howto-glossary.png` |
| §4.6 | Glossary tooltips (10 exact definitions, tap/keyboard) | `GlossaryTip` component; copy `glossary` | Same screenshot; T10 key-parity test |
| §4.7 | Plain names (15 codes, chart labels + period change) | `fxChartLineLabel`; copy `names` | T5 both `it`s |
| §4.8 | Chart captions ("When one goes up…" + "Both lines start at 100 six months ago.") | `WorldCurrencies.tsx` chart captions | T5; `fx-presentation.test.ts` |
| §4.9 | Dollar row: direction-following meaning, title "US dollar strength", glossary tip | `fxDollarMeaning`; `DollarRow` | T7 first `it` |
| §5 T1–T11 | Acceptance tests with the screenshot numbers | `apps/web/src/lib/fx-v13.test.ts` | All pass (31 tests) |
| §6 | No new API calls; stored object < 1 KB growth; evidence re-run; files touched list respected; do-not-change list respected | `plain` fields only (`dollarYearExtreme` + `movers`); git diff scope check | Scope audit 2026-10-14: no stock/KV/cron/provider file touched; `schemas.ts` diff = FxPlain only |

## 3. Evidence re-run (CR §6, third bullet)

Re-run 2026-10-14T01:20Z, 522 weeks replayed through the v1.3 engine:
- R3 Warning 14.2% of weeks (M1 leg alone 10.7%) — under the 25% change bar → **thresholds kept** (D-07)
- R7 dollar-led 20.3%, euro-led 0 in 10 years — honest finding recorded for Ali (D-08)
- R5 at 15.3% flagged, not changed (D-09)
- All recorded in `docs/DECISIONS_FOR_ALI.md` D-07…D-09 and in
  `docs/specs/insights-world-currencies-evidence.md`

## 4. Screenshots (CR build step, spec §6.6 evidence)

`docs/screenshots/` — 14 files: EN desktop (live, level3, pair-detail, r7-card,
quiet, quiet-list-open, stale, nodata, empty, howto-glossary), EN phone (live),
FA desktop (live, quiet), FA phone (live). Visually QA'd 2026-10-14: RTL clean,
Persian digits, no raw codes, no NaN/zero/empty blocks, mobile stacks without
overflow.

## 5. Open items for Ali

- D-08: the "Mostly a euro story" card never fired in 10 years (basket maths).
  Any change needs Ali's approval.
- D-09: R5 sits a touch above the spec's 15% usefulness bar (15.3%); kept under
  the change request's 25% rule.
- Deployment: not deployed — the change request work stays on this branch until
  Ali approves.
