> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S6/03 — Mobile Behaviour + the Module Map (M3)

**Session:** S6 of the Gold Page Elevation program · **Date:**
2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** the per-new-section responsive rules at 390px (the
measured-safe patterns from the S2 audit's §5a findings), the
breakpoint/collapse behaviour for the whole map, and the **module map**
— every section of the IA (`s6/01` zones A–O) cited to its
modularized file, with the landing spots for the new modules after the
modularization program closes. Read-only: the tree belongs to the
modularization program until it does (S2 §6's standing note).

---

## 1. The 390 rules, per new section (measured-safe patterns)

**The measured evidence base (S2 audit, 2026-11-17):** the /live-rates
LED board at 390 renders ONE price column (CURRENT; DAY HIGH/LOW
`display:none` below md); the 9-digit Emami value — **11 glyphs
including separators — fits a 145px cell at the 16.8px LED font**
(`live-rates-390-gold-board-close.png`, measured); no horizontal
overflow anywhere on the page at any viewport × locale (V-08,
`scrollWidth === clientWidth`); touch targets ≥44px is the guideline
the radio labels and chart chips currently miss (#19, 32px and 28px
measured) — new controls must not repeat it. The S2 §5a conclusion is
the pattern this IA adopts for every new section: **stacked rows with
the premium/secondary value right-aligned.**

| Zone (s6/01) | The 390 rule | Notes |
|---|---|---|
| **B · Price header** | unchanged single line; the market-state pill renders inline after the as-of (named market + timezone, s6/02 C1); #27 spacing fix applies at 390 first (the glyph run was measured cramped there) | the pill is a status affordance, not a link |
| **C · Balance hero** | existing behaviour kept (beam, verdict, counts stack natively — V-12 chips verified at 390); #17 affordance fix + #19 touch targets (chips to ≥44px height at 390) | F12 control hidden until invoked (Advanced) |
| **D · Explanation band** | F1 = one paragraph + the family read as a stacked list (family word right-aligned firing state); F5 = stacked decomposition rows, values right-aligned, each leg's as-of inline; F4 = collapsed, expands to an accordion (one driver per row, closing at its lane anchor); F24/F25 = ONE row («بعدی: فدرال رزرو ۹ دسامبر · احتمال ۲۵bp: ۹۱٪» / "Next: Fed Dec 9 · 25bp odds 91%" — timezone named at point of use, GPE-S3-10's lesson) | the band adds ≤2 screens of scroll at 390 with F4 collapsed |
| **E · Signals** | existing behaviour kept (charts + expanders verified at 390); F7 keeps the range chips as buttons ≥44px; the interactive chart's pan/zoom degrades to pinch/drag natively; #24 skeleton on cold load | silver card + F17 note unchanged |
| **F · Iran bridge** | **stacked rows**: instrument name (FA) left, price right-aligned primary; the حباب premium as the **right-aligned secondary value** on the same row (muted, % + toman); the parity line and decomposition behind one tap per instrument; the interpretation paragraph expandable; the 11-glyph toman values fit per the LED-board measurement — the bridge uses normal (non-LED) numerals, which measure *narrower* than the LED font's fixed cells | the toman-per-ounce intermediate renders in the expanded parity line, not the row (the ounce-row decision, s6/01 §2a) |
| **G · Seats** | existing behaviour kept (stacked lanes); the why-lines render inline under each dark seat (one line, muted); #18 anchors unchanged by viewport | F16 lines are text, no extra chrome |
| **H · TA levels** | **collapsed at 390** (s6/01 §4 rule 2): header + the distance-decile sentence visible («۶.۲٪ بالاتر از میانگین ۲۰۰ روزه — صدک ۷۸ دهه») — one tap expands the SMA rows (window left, level right-aligned) and the classic pivots table (S1–S3 / PP / R1–R3 as two stacked columns: supports then resistances, values right-aligned) | weekly pivots behind the same expansion, second table |
| **I · RATIOS (+F10)** | existing cards unchanged; each one-liner renders under the value (F4 rider); F10 = collapsed to one row ("gold in 6 currencies — today's moves") expanding to the stacked grid (currency left, XAU price + decile word right-aligned) | KGX validation sentence renders as the expanded footer |
| **J · Flows (+F14)** | existing cards unchanged; F14's percentile bands render as the compact band chip on the COT cards (position word + band), no new rows at 390 | |
| **K · CB-demand** | F2 Tier-1: the rolling-12m chart full-width (annotation preserved); the top-buyers table collapses to **top-5 stacked rows** (country left; tonnes + 12m Δ right-aligned; share-of-reserves as the muted secondary); Tier-2 stack + F9/F22/F11 = collapsed headers with their top-line number («موجودی خزانهٔ لندن: ۹٬۸۵۰ تن») | the IMF "reported-world" caveat renders in the expanded view |
| **L · Licence wall / M · Honest record** | unchanged (already compact); F13's per-item why renders as the existing list; F23 stays collapsed | trust band never collapses away |
| **N · Gold Positions** | unchanged; #09 label + #10 clamp fixes are viewport-independent | |
| **O · History tail** | collapsed (both F6 and F26) — F6 expands to the episode list (era left, annotation right-aligned); F26 expands to the calculator (year picker + stacked result rows) | |

**The universal 390 invariants:** single column (no side-by-side
sub-columns inside a row); right-aligned secondary values (the FA/RTL
mirror: start-aligned secondary in RTL — CSS logical properties only,
the repo's non-negotiable rule 5); Persian digits + Jalali dates in
FA; no horizontal overflow at any breakpoint (V-08 discipline); every
new interactive element ≥44px touch target (the #19 lesson applied
forward); collapse states persist to `localStorage` (V-05 pattern).

**Breakpoint summary:** desktop (≥1024) — full map, Supporting
expanded; tablet (768) — same as desktop with hamburger nav; mobile
(390) — Supporting collapsed to header+takeaway, Advanced hidden, Core
stacked. The 844/1024 heights do not change section order (the map is
direction- and height-neutral).

---

## 2. The module map (every IA section → its file)

*Existing files: the S2 audit §6 inventory, re-verified read-only this
session (2026-11-17, checkout of the session's HEAD) — every file
named below exists. New modules: proposed landing spots in the
modularized tree, following the modularization program's conventions
(one file, one responsibility; ~400-line ceiling, AGENTS.md §4); they
land only in Phase D after the modularization program closes and the
owner lifts the constraint. The projections/adapters named "NEW" are
S8-spec'd; this map fixes their addresses.*

| IA zone (s6/01) | Module (existing, verified) | New modules (Phase D landing spot) |
|---|---|---|
| Route, page state machine, absent-note | `apps/web/src/features/gold/GoldPage.tsx` (240 l); `shared/lib/page-division` (`fetchPageProjection`); `shared/lib/insights` | — (the absent-note→wall link is a copy change in the existing dictionaries) |
| **B · Price header + pill** | `features/gold/GoldHero.tsx` | the market-state pill: a small subcomponent in `GoldHero.tsx` or `features/gold/market-state.tsx` (data leg: the price feed's session clock — S8 sizes) |
| **C · Balance hero (+F12, +F15)** | `GoldHero.tsx` + `signals/BalanceScale.tsx` (1,396 l) + `signals/BalanceWeight.tsx`; engines: `features/gold/gold-tiles.ts` (pure derivations) + `packages/insights/src/domains/gold/gold-balance.ts` | F12 time machine: `features/gold/GoldTimeMachine.tsx` (collapsed control + historical reading view; API surface post-modularization — S8); F15 wording: dictionary strings (both locales) + `outlook.test.ts` pins updated |
| **D · Explanation band** | — (new zone) | `features/gold/narrative/GoldNarrative.tsx` (F1; pure rules in `domains/gold/narrative.ts` — the driver-family assembly over the projection, the GRAM/lane mapping's honest translation); `features/gold/GoldYieldDecomposition.tsx` (F5; pure math in `domains/gold/yield-decomposition.ts`); `features/gold/GoldOnRamp.tsx` (F4 content + i18n dictionary entries); `features/gold/GoldExpectations.tsx` (F24+F25; adapter `domains/insights/adapters/kalshi.ts` + `polymarket.ts`, 30-min cache; F25 reads the existing `data/insights-calendar.json` feed) |
| **E · Signals (+F7)** | `features/gold/Signals.tsx` (shell) + `signals/MergedCard.tsx` + `signals/verdict.tsx` (TrendPanel/MetalTrendChart) + `signals/icons.tsx`; engine `domains/gold/signals.ts`; history API `/api/insights/:id/history` | F7: `features/gold/signals/GoldPriceChart.tsx` (pan/zoom/log + DMA overlay toggles + the unit-aware header); OHLC leg rides the existing EODHD ingestion (adapter `domains/gold/adapters/eodhd-xauusd.ts` if not already the shared EODHD path — S8 names it); #01 fix: `apps/api/src/routes/insights.ts:152` window decision + `verdict.tsx` comment/readout |
| **F · Iran bridge** | data plane (existing, verified): `packages/scraper/src/tgju.ts` (9 gold symbols + `price_dollar_rl`) → `GoldQuoteSchema` (`packages/core/src/schemas.ts`) → KV snapshot → `/api/rates?source=tgju`; `apps/web/src/shared/lib/snapshot-store.ts`; `apps/web/src/components/LedGoldBoard.tsx` (on /live-rates + /converter — one data plane, two presentations, never duplicated) | `features/gold/GoldIranBridge.tsx` (the card; per s1/11 §7's own name); the premium engine: `domains/gold/coin-premium.ts` (pure: the C2 formulas + the CBI constants table + the آبشده mesghal convention); Bridge-2 history: forward accumulation beside the snapshot store + the TGJU profile-history backfill extension in `packages/scraper/src/tgju.ts` (parser extension, off-hours one-time) |
| **G · Seats (+F16)** | `features/gold/GoldSeats.tsx`; `GOLD_VOTER_IDS` ← `packages/insights/src/page-division/placement.ts` ← `shared/gold-score.ts` (the 37-voter table — shared by design) | the why-lines: status metadata already in the projection (the S2 §3 cause classes) rendered by `GoldSeats.tsx`; #18 anchors: the link builder in `gold-tiles.ts` (`homePage`) gains the card-anchor ids (`usa-card-real-yield-10y` pattern, verified existing); #21 de-dup: `GoldSeats.tsx` lane cards |
| **H · TA levels (F8)** | — (new zone; no existing MA/pivot code — verified twice, s1/13 §6 + S2 §5c) | `features/gold/GoldTaLevels.tsx` (the band); computation: `domains/gold/ta-levels.ts` (pure: SMA 20/50/100/200, distance decile via the server-side `percentile10y` pattern, classic daily/weekly pivots, the dated cross-events list); input: the F7 OHLC leg; tests: `ta-levels.test.ts` + UI pins |
| **I · RATIOS (+F4 one-liners, +F10)** | `features/gold/GoldContext.tsx` + `gold-tiles.ts` (`GOLD_DISPLAY`) | one-liners: dictionary strings per card; F10: `features/gold/GoldCurrencyGrid.tsx` + `domains/gold/xau-crosses.ts` (pure deciles; the EODHD crosses ride the owner plan, S4/04 §5 row 18) |
| **J · Flows (+F14)** | `GoldContext.tsx` (the 5 cards) | F14: percentile bands as a derivation in `gold-tiles.ts` + render in `GoldContext.tsx`; the convention rule is copy (s6/02 C7) |
| **K · CB-demand** | the COFER adapter pattern (existing, re-verified exact): `packages/insights/src/domains/currencies/adapters/cofer.ts` | `features/gold/GoldCbDemand.tsx` (F2 Tier-1: the tracker + chart + buyers table); Tier-2: `features/gold/GoldDemandStack.tsx` + `domains/gold/adapters/wgc-gdt.ts` (data-drop parse, fail-closed on shape); F9: `GoldEtfFlows.tsx` + `domains/gold/adapters/wgc-etf-flows.ts`; F22: `GoldLondonVault.tsx` + `domains/gold/adapters/lbma-vault.ts` + `lbma-clearing.ts`; F11: `features/gold/GoldCorrelation.tsx` + `domains/gold/correlation.ts` (pure, pre-registered windows); Tier-1 adapter: `domains/gold/adapters/imf-reserves.ts` (IL `RGV_REVS` + IRFCL `IRFCL56V_FTO`, the COFER pattern + the fail-closed band check) |
| **L · Licence wall (F13)** | `GoldContext.tsx` (`GOLD_BLOCKED_NOTES` in `gold-tiles.ts`) | the sharpened wall: same module, per-item why + owner actions + link-out (#22); the WGC CB lines retire as Tier-2 lands (D7) |
| **M · Honest record (+F23)** | `GoldContext.tsx` (the paragraph + backtest link) | F23: `features/gold/GoldForecastRetrospective.tsx` (collapsed companion; data `domains/gold/adapters/lbma-forecast-survey.ts`, annual manual entry or page read) |
| **N · Gold Positions** | `features/gold/GoldPositions.tsx` (direct `cftc-*` readings) | #09 label + #10 clamp: same file, copy + bar semantics fixes |
| **O · History tail (F6, F26)** | — (new zone) | F6: `features/gold/GoldEpisodes.tsx` + `domains/gold/adapters/wgc-prices.ts` (the prices-workbook drop, monthly averages since 1978) + the editorial episode data as a typed static module; F26: `features/gold/GoldIfBought.tsx` (all series in-repo) |
| App shell (header/footer) | the app shell components (nav, footer — app-level, not gold-feature) | #25 nav label + #26 footer anchors: app-shell decisions, post-modularization |
| **Tests pinning the map** | existing: `GoldPage.test.tsx`, `gold-copy-pin.test.ts`, `gold-frozen-scenarios.test.ts`, `gold-tiles.test.ts`, `outlook.test.ts`, `gold-backtest.test.ts`, `signals/balance.test.tsx`, `signals/gold-balance-lanes.test.tsx` | every new module ships its own test file in the same tree (Phase-D discipline; the #21 de-dup must re-verify the frozen snapshot pins) |

**Where new modules land, post-modularization (the standing notes):**

1. The `features/gold/` + `domains/gold/` tree belongs to the
   modularization program until it closes (S2 §6); GPE's new modules
   land as siblings there, following that program's placement and
   naming conventions — no GPE file lands before the Phase-D gate.
2. **The engine/presentation split is the rule** (the existing tree's
   own discipline): every new computation is a pure `domains/gold/*`
   module with tests; every new card is a thin `features/gold/*`
   component reading a projection/derivation — no arithmetic in
   components (the `gold-tiles.ts`/`GoldContext.tsx` pattern).
3. **The projection surface:** the page-division projection
   (`packages/insights/src/page-division/projection.ts` +
   `apps/api/src/routes/insights-pages.ts`) is the extension point for
   new server-derived fields (the TA percentile legs, the yield
   decomposition inputs, the CB tracker rows) — the F1/F5/F8/F2 cards
   read curated projections, not ad-hoc fetches (the existing /gold
   contract: one page projection + the history endpoints + the
   snapshot store).
4. **The bridge's data plane stays shared:** `snapshot-store.ts` +
   `/api/rates?source=tgju` serve both presentations (`LedGoldBoard`
   on /live-rates; `GoldIranBridge` on /gold) — never duplicate the
   board markup (s1/11 §7's standing rule, re-confirmed S2 §5a).
5. **The Persian-copy manifest gate applies to every new fa string**
   (each new card's dictionary entries go through the copy rounds in
   Phase D; `pnpm gates` runs the drift check).

---

## 3. Method and limitations

The 390 rules generalize the S2 audit's measured mobile findings
(§4 #11 mobile 4.5; §5a's LED-board measurement; V-08/V-12) to the new
zones — no new mobile measurement exists for unbuilt sections (the
rules are design constraints for Phase D, verified there against the
same no-overflow/touch-target bars). The module map re-verified the
S2 §6 inventory read-only this session (all named files exist at the
session's checkout; `LedGoldBoard.tsx` still lives in
`apps/web/src/components/` — not yet moved, exactly as the audit
recorded). New-module names are proposals binding only as *addresses*
(family + responsibility); the modularization program's own naming
conventions win if they differ. Nothing was implemented (standing
constraint).
