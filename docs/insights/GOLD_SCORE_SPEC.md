# GOLD_SCORE_SPEC — the gold-directional scoring engine (the Gold Program)

**Status:** S1 (engine) + S2 (API + UI integration) shipped. FA copy deferred to S5.
**Modules:** `packages/insights/src/gold-score.ts` (pure engine + EN copy) ·
`packages/core/src/schemas.ts` (`GoldSummarySchema`, the optional snapshot field) ·
`apps/web/src/components/insights/GoldTailwindPanel.tsx` + `ModelVsRealityPanel.tsx`.
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

### 2.1 The voter table (20 voters, 4 lanes)

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
| `inflation` | us-cpi-yoy (+) · us-pce-core-yoy (+) · euro-hicp (+) · breakeven-5y5y (+) | **hot** | **cool** |

Rationale notes (the classic relationships, hedged): tight real rates are
gold's opportunity cost (−); a strong dollar is the headwind of a USD-priced
metal (−); elevated stress usually brings the safe-haven bid (+); crowded
COT longs are fragile — the squeeze-then-slump zone (−, contrarian); hot
inflation supports hedge demand (+).

**Deliberately excluded:** `govt-interest-revenue` (a fiscal share whose
gold signal is contested — high interest costs argue both ways), the whole
growth-health lane (weak or two-sided for gold; copper-gold is already a
ratio ABOUT gold), and `brent` (supply shocks are not the hedge-demand
channel). Stale / check-pending / unavailable readings never fire.

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
| `GOLD_PANEL_COPY_EN` / `MODEL_VS_REALITY_COPY_EN` | const | The EN copy blocks (see §4.4 for the FA deferral) |
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

### 4.4 The UI — `apps/web/src/components/insights/`

- **`GoldTailwindPanel.tsx`** — the net score, the 5-step label, the
  tailwind/headwind/mixed lane counts, the four sub-gauge readings, the
  firing voters list (re-derived client-side via `goldTailwindScore`), the
  "conditions, not advice" footnote. Reads `snapshot.goldSummary` +
  `GOLD_PANEL_COPY_EN`.
- **`ModelVsRealityPanel.tsx`** — the chip, the explainer
  (`modelVsRealityExplainerKey` + `MODEL_VS_REALITY_COPY_EN`), the reality
  value with its basis phrase.
- Both mount **beside the gold-usd tile on the prices-board strip**
  (`PricesBoard.tsx` grid, right after the gold card), matching the tile
  anatomy (`article` + `rounded-[var(--radius-lg)] bg-[var(--color-surface)]
  p-4 ring-1 ring-[var(--color-border)]`, lucide icon box, `data-*` hooks).
- **FA copy is deliberately deferred to S5** (the Persian-copy audit gate):
  the EN copy blocks live in the insights package, NOT the web i18n
  dictionaries, so `pnpm copy:audit` stays clean; the panels render EN in
  both locales until the reviewed fa lands.
- Old snapshots without `goldSummary`: the panels derive the reading
  client-side from the readings they already hold (the same pure function).

### 4.5 What S2 does NOT do

No FRED gap-fillers (S3: real-yield history depth, breakeven interplay) ·
no FA copy (S5, the audit gate) · no backtest harness (S4) · no
`ruleVersion` bump (the gold score derives FROM the unchanged scored
readings; the rules themselves did not move).

## 5. Validation record (S1 + S2, 2026-10-31)

- `packages/insights/src/gold-score.test.ts` — **36 tests** (firing rules,
  lane words, label mapping, chips, compact round-trip, copy completeness).
- `packages/core/src/schemas.test.ts` — the `goldSummary` field block
  (optional acceptance, pollution stripping, shape rejection).
- `apps/web/src/components/insights/gold-panels.test.tsx` — the panel
  render tests (fixture snapshot with a known `goldSummary`).
- `packages/insights/src/adapters/snapshot.test.ts` — the three builders
  write/recompute the field; the public projection recomputes over
  survivors.
- Gates: `pnpm -r test` green (10,113 + the new tests), typecheck 6/6,
  lint clean on every new file, `copy:audit` untouched (EN copy lives in
  the package, not the dictionaries).

**Honest note (the sandbox loss):** S1's original working tree was lost in
a sandbox recycle before it was committed or pushed. The engine, its 36
tests and this spec were REBUILT for S2 against the same contract
described in the program brief; the rebuild is recorded in
`/home/z/my-project/worklog.md` under `gold-program-s2`.
