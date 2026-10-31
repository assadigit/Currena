# GOLD_SCORE_SPEC — the gold-directional scoring engine (the Gold Program)

**Status:** S1 (engine) + S2 (API + UI integration) + S2.1 (bilingual +
placement round) shipped. FA copy shipped in S2.1 (round-53). **Session 6
(2026-10-31, the D-5 promotion): the voter table is 21 — `breakeven-tilt`
joined the inflation lane** (§2.1, the contract bump this session owes
GOLD_BACKTEST_SPEC's decision log; the panel's round-55 measured-reality
note stays the operative description).
**Modules:** `packages/insights/src/gold-score.ts` (pure engine — copy
moved to the web dictionaries in S2.1) ·
`packages/core/src/schemas.ts` (`GoldSummarySchema`, the optional snapshot field) ·
`apps/web/src/components/insights/signals/GoldTailwindPanel.tsx` + `ModelVsRealityPanel.tsx`
(mounted INSIDE the merged gold card, under the balance — the owner's S2.1 directive).
**Discipline:** pure, additive, zero new fetches, zero new KV ops. Descriptive,
hedged, never advice (the signals-card contract — words and counts, no green/red).

---

## 1. The question

The gauges answer *"how stressed is the world?"*. The signals cards answer
*"what do the five classic gold conditions say right now?"*. Neither answers
the owner's next question directly:

> **Do the macro drivers currently lean WITH gold or AGAINST it — and does
> the price agree with them?**

The gold tailwind score re-cuts the **existing gauge voters** (the same
readings the page already holds) into one directional number with a 5-step
label, four lane readings, the firing-driver list, and a model-vs-reality
comparison against what gold actually did. No new series, no new fetch, no
new KV key: the snapshot gains one optional ~0.5 KB field.

## 2. The model

### 2.1 The voter table (21 voters, 4 lanes — the D-5 promotion, Session 6)

A voter fires when the **shared signals evaluator** (`connections.ts
evalLeg` — the S1–S2 cards' own leg vocabulary) leans ±1:

- a **30-day direction** beyond the per-leg minimum move
  (`SIGNAL_LEG_MOVE`, e.g. real yields ±0.1 pt, the dollar basket ±1.0 pt),
  or else
- a **decade-extreme level** (percentile10y > 0.8 / < 0.2) when the series
  is steady — a series parked at an extreme still leans.

The lean is mapped onto gold through a fixed **polarity** (gold direction =
lean × polarity):

| Lane | Voters (polarity) | Tailwind word | Headwind word |
|---|---|---|---|
| `borrowing-costs` | real-yield-10y (−) · us10y (−) · us30y (−) · fed-target (−) · fed-expectations (−) · ecb-dfr (−) · yield-curve-10y2y (−) · yield-curve-10y3m (−) | **relief** | **tight** |
| `dollar` | dollar-basket (−) · usdjpy (−) · us-japan-10y-gap (−) | **stress** | **strong** |
| `stress` | stress-stlfsi (+) · nfci (+) · vix (+) · gold-silver (+) · cftc-gold-positioning (−, contrarian) | **elevated** | **calm** |
| `inflation` | us-cpi-yoy (+) · us-pce-core-yoy (+) · euro-hicp (+) · breakeven-5y5y (+) · breakeven-tilt (+, level-only — the Session-6 promotion) | **hot** | **cool** |

Rationale notes (the classic relationships, hedged): tight real rates are
gold's opportunity cost (−); a strong dollar is the headwind of a USD-priced
metal (−); elevated stress usually brings the safe-haven bid (+); crowded
COT longs are fragile — the squeeze-then-slump zone (−, contrarian); hot
inflation supports hedge demand (+). **The 21st seat (Session 6, D-5
decided-YES):** `breakeven-tilt` (T5YIFR − T5YIE, the priced ACCELERATION
of inflation) rides the inflation lane with polarity +1 — a building tilt
is the tailwind side, like the lane's own hot-inflation reading — and
fires on the DECADE POSITION alone (the shared evaluator carries no
30-day move threshold for it: exactly the variant S4's B4 measured — it
fired in 46.7% of the re-run windows, moved the label bucket in 10.2%,
and shifted the sign-agreements +0.4/+0.7/+0.0pp: no material difference).
The promotion is a scope choice the owner is entitled to make, NOT an
edge claim the harness supports; the S6 re-run's measured record is
`BACKTEST-GOLD.md`.

**Deliberately excluded:** `govt-interest-revenue` (a fiscal share whose
gold signal is contested — high interest costs argue both ways), the whole
growth-health lane (weak or two-sided for gold; copper-gold is already a
ratio ABOUT gold), and `brent` (supply shocks are not the hedge-demand
channel). The 21st seat went to `breakeven-tilt` on the owner's D-5 call
(Session 6) — the expectations tilt the panel already reads beside the
lane's word. Stale / check-pending / unavailable readings never fire.

### 2.2 The arithmetic

- **netScore** = tailwind voters − headwind voters (signed).
- **Lane reading**: unanimous tailwind → the lane's tailwind word;
  unanimous headwind → the headwind word; disagreement → `mixed`; nothing
  firing → `unreadable` (never a guess).
- **laneCounts**: how many of the four lanes read tailwind / headwind /
  mixed (unreadable lanes count nowhere).
- **5-step label** (share-based, the gauge-step philosophy):
  - nothing firing → `null` (the UI says "cannot read yet")
  - `strong-tailwind` — net > 0 AND ≥ 3 firing AND net/firing ≥ 0.5
  - `tailwind` — net > 0
  - `balanced` — net = 0
  - `headwind` / `strong-headwind` — the mirror
  - The crowd minimum (`GOLD_STRONG_MIN_FIRING = 3`) keeps ONE firing
    driver from ever reading "strong".

### 2.3 Model vs reality

- **Model direction**: from the label (strong-tailwind/tailwind → tailwind;
  strong-headwind/headwind → headwind; balanced → neutral; null → no read).
- **Reality**: gold-usd's `change30d` (±`GOLD_REALITY_SPEED_PCT` = **2%** —
  the SAME bar as the outlook classifier's range-bound state), falling
  back to `ma200GapPct` when the 30-day change is absent; neither → no read.
- **Chips**: `aligned-tailwind` · `aligned-headwind` · `diverging-up`
  (headwind model, rising price) · `diverging-down` (tailwind model,
  falling price) · `neutral` (no model lean OR flat price — the explainer
  names which) · `no-read`.
- **Explainer keys** (`modelVsRealityExplainerKey`): the six chips plus the
  neutral split `model-neutral` / `reality-flat` — pure, so the panel never
  chooses copy.

### 2.4 The one-tick skew (honest limitation)

The ingest stamps `modelVsReality` at build time. The serve path's
live-prices overlay can refresh gold-usd's change fields an hour later, so
the stored chip can lag the tile by one hourly tick (the ±2% bar makes a
flip rare). The panels' firing-driver list always derives from the page's
current readings, and the skew is documented here rather than hidden.

## 3. The API surface (exports from `@currena/insights`)

| Export | Kind | Purpose |
|---|---|---|
| `goldTailwindScore(readings)` | pure fn | The full reading: net score, label, counts, 4 sub-gauges, firing voters |
| `modelVsReality(readings)` | pure fn | The comparison: chip, directions, basis, value |
| `modelVsRealityExplainerKey(mvr)` | pure fn | The explainer key (7 values) |
| `goldSummaryOf(readings)` | pure fn | The COMPACT wire shape (what the ingest writes; `GoldSummary` from `@currena/core`) |
| `GOLD_LANE_VOTERS` / `GOLD_LANES` | const | The voter table / lane order |
| `GOLD_STRONG_SHARE` / `GOLD_STRONG_MIN_FIRING` / `GOLD_REALITY_SPEED_PCT` | const | The thresholds (documented above) |
| `GOLD_PANEL_COPY_EN` / `MODEL_VS_REALITY_COPY_EN` | const | RETIRED in S2.1 — the copy moved to the web dictionaries (`signals.goldScore` / `signals.goldModelVsReality`, EN + fa) |
| types `GoldVoter`, `GoldSubGaugeReading`, `GoldTailwindReading`, `ModelVsRealityReading`, … | types | The engine's vocabulary |

`GoldSummary` (core, zod-validated) is the compact shape: `netScore`,
`label`, `firingVoters`, `tailwindVoters`, `headwindVoters`, `laneCounts`,
`subGauges` (exactly 4), `modelVsReality`. **The voter list never rides the
snapshot** — the SPA re-derives it through the same pure function (the
gauges.ts contract: one function, ingest and SPA, no drift).

## 4. The integration points (S2)

### 4.1 The schema — `packages/core/src/schemas.ts`

Additive and OPTIONAL (zero breaking change — every stored snapshot and
archive stays valid; old readers ignore it):

```ts
export const InsightsSnapshotSchema = z.object({
  // … existing fields …
  goldSummary: GoldSummarySchema.optional(), // ← the S2 field
});
```

`GoldSummarySchema` (see §3) lives beside the other snapshot schemas in
core and is exported from `@currena/core` alongside its leaf schemas
(`GoldLaneSchema`, `GoldSubGaugeWordSchema`, `GoldSubGaugeSummarySchema`,
`GoldTailwindLabelSchema`, `ModelVsRealityChipSchema`).

### 4.2 The ingest — where `summarizeByGauges(readings)` is called

The summary lines are written in **`packages/insights/src/adapters/snapshot.ts`**
(not `ingest/run.ts` — the runner only orchestrates; the pure builders write
the snapshot). THREE call sites, each gains the same line beside the
`summarizeByGauges` call:

```ts
import { goldSummaryOf } from '../gold-score';

// 1. buildInsightsSnapshot (the 04:10 main build) — beside `const summary = summarizeByGauges(readings);`
// 2. patchInsightsSnapshot (the 04:20 rung-2 re-derivation phase)
// 3. projectSnapshotToPublic (the public projection — RECOMPUTED over the
//    surviving readings, the R2 invariant: a public gold summary can never
//    contradict its own readings)

return InsightsSnapshotSchema.parse({
  // … existing payload …
  goldSummary: goldSummaryOf(readings), // ← zero new fetches; ~0.5 KB
});
```

`GET /api/insights` serves the stored snapshot whole, so `goldSummary`
rides along automatically (no route change). The live-prices overlay
(`mergeLivePricesIntoSnapshot`) spreads `...snapshot` — the field passes
through untouched (§2.4 for the one-tick skew).

### 4.3 The API docs — `docs/INDICATORS_AND_DATA_SOURCES.md` §3

The `/api/insights` shape example gains the `goldSummary` block (optional
field, shown with a comment saying so).

### 4.4 The UI — `apps/web/src/components/insights/signals/` (S2.1)

- **`GoldTailwindPanel.tsx`** — the net score, the 5-step label, the
  tailwind/headwind/mixed lane counts, the four sub-gauge readings, the
  firing voters list (re-derived client-side via `goldTailwindScore`), the
  "conditions, not advice" footnote. Reads `snapshot.goldSummary` + the
  dictionary copy `copy.signals.goldScore`.
- **`ModelVsRealityPanel.tsx`** — the chip, the explainer
  (`modelVsRealityExplainerKey` + `copy.signals.goldModelVsReality`), the
  reality value with its basis phrase (٪ in fa, % in EN).
- **Placement (the owner's 2026-10-31 directive, superseding S2's
  prices-strip mount):** both panels render INSIDE the merged gold
  card (`signals/MergedCard.tsx`), DIRECTLY UNDER the balance visual
  («برآیند عوامل مؤثر بر قیمت طلا») and before the price-footing strip —
  two columns beside the balance's max-width column, stacked on mobile.
  The prices strip is the four price tiles again.
- **BILINGUAL since S2.1** (the owner's "must be bilingual"): the copy
  lives in the web i18n dictionaries — `signals.goldScore` /
  `signals.goldModelVsReality` in both `insights-copy-en.ts` and
  `insights-copy-fa.ts` — behind the Persian-copy audit gate
  (round-53, `docs/localization/persian-copy-round-53-gold-panels.md`).
  The package-level `*_COPY_EN` constants are RETIRED.
- Old snapshots without `goldSummary`: the panels derive the reading
  client-side from the readings they already hold (the same pure function).

### 4.5 What S2/S2.1 do NOT do

No FRED gap-fillers (S3: real-yield history depth, breakeven interplay) ·
no backtest harness (S4) · no `ruleVersion` bump (the gold score derives
FROM the unchanged scored readings; the rules themselves did not move).
(The S5 FA-copy round happened EARLY, in S2.1 — the owner's bilingual
directive.)

## 5. Validation record (S1 + S2 + S2.1, 2026-10-31)

- `packages/insights/src/gold-score.test.ts` — **33 tests** (firing rules,
  lane words, label mapping, chips, compact round-trip; the three
  copy-completeness tests moved to the web with the copy in S2.1).
- `packages/core/src/schemas.test.ts` — the `goldSummary` field block
  (optional acceptance, pollution stripping, shape rejection).
- `apps/web/src/components/insights/signals/gold-panels.test.tsx` — **16
  tests** (the panel renders for a known `goldSummary`, the client-side
  fallback, the honest no-read state, BOTH dictionaries' coverage of the
  engine vocabulary, the fa locale's Persian rendering, the MergedCard
  mount order under the balance, the prices-strip move-back).
- `packages/insights/src/adapters/snapshot.test.ts` — the three builders
  write/recompute the field; the public projection recomputes over
  survivors.
- Gates: `pnpm -r test` green, typecheck 6/6, lint clean on every touched
  file, `copy:audit` **clean after the round-53 triage** (74 entries — 73
  dictionary strings + the ٪ technical glyph).

**Honest note (the sandbox loss):** S1's original working tree was lost in
a sandbox recycle before it was committed or pushed. The engine, its 36
tests and this spec were REBUILT for S2 against the same contract
described in the program brief; the rebuild is recorded in
`/home/z/my-project/worklog.md` under `gold-program-s2`.

### 5.1 Session 6 (2026-10-31, the D-5 promotion) — the validation record

The gated session the S5 decision log prescribed, all four gates plus the
fresh run:

- **The table change:** `GOLD_LANE_VOTERS` = 21 — `{ lane: 'inflation',
  id: 'breakeven-tilt', polarity: 1 }` appended as the last seat (the
  B4-measured shape: the frozen 20 + the tilt). No threshold, label,
  lane-word, or evaluator change; the tilt stays level-leg only.
- **The 20→21 pin-test update:** `gold-score.test.ts` now pins the exact
  promoted shape (21 voters, lane counts 8/3/5/5, the tilt exactly once,
  no duplicates, the last seat — **35 tests**); `breakeven-tilt.test.ts`'s
  D-5 block flipped from the freeze pin to the promotion pin + the
  phrase-selector-is-not-the-voter-lean pin (**11 tests**).
- **The bilingual naming (round-56):** `voterNames['breakeven-tilt']` =
  "Inflation tilt" (EN) / «شیب انتظارات تورمی» (fa — the compact form of
  the context card's own round-54 name) behind
  `docs/localization/persian-copy-round-56-gold-21st-voter.md`;
  `gold-panels.test.tsx` **25 tests** green in both locales (the
  dictionary-coverage test enforces the exact-match rule).
- **The harness flip:** `HARNESS_GOLD_VOTERS_21` is now PINNED EQUAL to
  production (the equality test), and `HARNESS_GOLD_VOTERS_20` keeps the
  S4-frozen table verbatim for lineage (pinned to production-minus-the-
  tilt); `gold-backtest-core.test.ts` **29 tests**. The runner
  (`gold-backtest.ts`) re-ran the promoted table over the corpus-of-record
  (the S5 C5 validation dump, recordedAt 15:17:40Z — content-identical to
  S4; the 11-01/11-02 rungs land after, carried by the scheduled
  2026-11-02 re-check): the promoted primary tables + the promotion-delta
  section are `docs/insights/BACKTEST-GOLD.md`. The measured promotion
  effect: sign-agreements 52.1/47.6/43.9% (baseline 51.7/46.9/43.9%) —
  the mature-base 5td moves 46.8→46.9%, from just-outside to
  just-inside the 2-SE band, so the S4 "runs the OTHER way" verdict
  softens to "no measurable edge" under the same stated-in-advance rule
  (20td/60td still depart below; the 5td spread flips −0.10 → +0.02%).
  No edge claim is made either way — the panel's measured-reality note
  stays the operative description.
- **Gates:** insights 973/973 · web gold panels 25/25 · typecheck clean
  (main + scripts tsconfigs) · copy:audit clean after round-56 · secret
  scan clean.
