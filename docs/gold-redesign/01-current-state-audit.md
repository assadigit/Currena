# Gold Page Redesign — Session 1: Current-State Audit

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Session:** 1 of 9 — Current-state audit and evidence baseline (`CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` §10, Session 1)
**Mode:** Read-only reconnaissance. No code, no production behavior, and no financial model was changed in this session.
**Date:** 2026-11-20
**Audited surface:** `https://currena.ir/gold` (live production) + the `main` branch source at commit `884f2696`
**Companion deliverables:** `02-section-and-component-map.md` · `03-indicator-and-module-inventory.csv` · `04-duplicate-and-overlap-matrix.md` · `baseline-screenshots/` · `DECISION_LOG.md`

---

## 1. Executive summary

The `/gold` page is a **feature-complete, honest, bilingual (fa/en), data-rich conditions page** — and it is **very long, flatly hierarchical, and repetitive at the summary level**. It currently behaves like a well-sourced research desk, not like the weather-briefing product the owner selected in the master strategy.

Key verified facts:

1. **Live == source.** The live production deployment (Workers version `5c34a14b`, deploy `62bdfc10`, 2026-11-20T00:24:56Z) serves SPA chunks **byte-identical** to a fresh build of `main` (`GoldPage-DB-tAujX.js`, `index-BqnATyD-.js`, `index-BYs2IdzG.css` all match by `cmp`). `main`'s only commit after the deploy record (`884f2696`) adds the strategy document, no code. Every finding below describes both the live page and the source truthfully.
2. **Scale.** 26 rendered sections, ~13,000 px tall at 1440 px desktop and ~25,000 px at 390 px mobile. 37 voting seats + 14 context-card homes + 16 non-indicator modules (see `03-indicator-and-module-inventory.csv`). 74 buttons, 84 links in the DOM at desktop.
3. **The balance verdict is rendered at summary strength six ways** (DUP-2): the hero Balance Scale, the hero verdict word + outlook line, the Signals section's second full Balance Scale, the narrative's five family lines, the collapsed-signals lean line, and the on-ramp's driver closes. This is the single biggest hierarchy problem and exactly what the strategy's hero-priority and deduplication decisions target.
4. **The "outlook" is honest but is not a forward-looking outlook.** The 7-state "Conditions outlook" (`Bearish`, etc.) is derived mechanically from the same `goldBalance()` result as the balance (by design, GB-S5), with the caveat "this describes current conditions, not a forecast" printed inline. A horizon-based, scenario-style forward-looking outlook does **not exist** in the product today. Session 2 must design it as a separate, clearly labelled construct — and must not relabel the balance as one.
5. **No in-page navigation.** There is no sticky section navigation, no TOC, no anchor strip — only the global fixed header, breadcrumbs, and scattered in-page `#hash` links. The owner chose a sticky section navigation; none exists yet.
6. **Health.** Zero console errors and zero page errors on the live page (en/fa, desktop/mobile, light/dark). No horizontal overflow at 390 px. Dark mode works (root class `dark`, persisted `currena:theme`). Load is fast (DCL ≈ 110 ms; the lazy GoldPage chunk is 238.9 kB raw / ~49 kB gz against a 240/50 budget — **only ~1.1 kB raw headroom**).

The page is in good engineering health. The problems the redesign must solve are information-architecture and presentation problems, not defects.

---

## 2. Method and evidence base

| Evidence | How captured |
|---|---|
| Live DOM audit | `agent-browser` (Playwright) on https://currena.ir/gold — anchor inventory, duplicate-ID scan, section counts, seat-impact counts, lane states, theme check, overflow check |
| Screenshots | 31 files in `baseline-screenshots/` — en/fa × desktop 1440 / mobile 390, full-page + focused sections, dark-mode pair, 6 expanded interaction states |
| Visual analysis | VLM (GLM vision) reviews of the hero, the full en desktop page, and the mobile/RTL pair; every VLM claim used below was cross-checked against the DOM or source |
| Source audit | Full read of `apps/web/src/features/gold/**` (13,320 lines incl. tests), `gold-tiles.ts` derivations, the engine (`packages/insights/src/shared/gold-score.ts`, `domains/gold/gold-balance.ts`, `connections.ts` `evalLeg`, `definitions.ts`), `outlook-core.ts`, router and budget script |
| Live API | `GET /api/insights/pages/gold` (48 readings + 4 absent IDs), `GET /api/insights` calendar leg |
| Deployment | Cloudflare API deployments list + byte-comparison of live vs. locally built chunks |

What could **not** be tested in this session (stated per the acceptance criteria):

- **Tablet width (768 px) was not captured** as a separate screenshot set; desktop (1440) and mobile (390) bracket it. Session 8 should add it.
- **Screen-reader pass:** no NVDA/VoiceOver run — only structural ARIA inspection in the DOM (roles, aria-labels, focusables exist; see §8).
- **Keyboard-only walk-through** was spot-checked (focusables/toggles exist) but not exhaustively tabbed; deferred to Session 8 per plan.
- **Reduced-motion behavior** was not exercised.
- The **cached/stale/outage paths** were observed in code (last-good localStorage pattern, honest states) but not forced live in this session (the live feed was healthy).

---

## 3. Deployment ↔ source verification (Session 1 task 2)

- Cloudflare deployments API: latest `currena-api` deploy `62bdfc10` created `2026-11-20T00:24:56Z`, matching the BD-S43 CHANGELOG record (production `5c34a14b`, commit `5b712308`, 2026-11-20 00:27 UTC).
- Local `pnpm install` + `pnpm --filter @currena/web build` on `main` (`884f2696`) reproduced the live assets **byte-for-byte**:
  - `assets/GoldPage-DB-tAujX.js` — identical (`cmp` clean)
  - `assets/index-BqnATyD-.js` — identical
  - `assets/index-BYs2IdzG.css` — identical
- Conclusion: **every finding below is simultaneously true of production and of `main`.** No source/live drift exists at Session 1 start. (Credentials used, not stored.)

---

## 4. Page inventory — what exists today, top to bottom

Render order verified in DOM and in `GoldPage.tsx` (371 lines). Zone lettering follows the GPE program's map (recorded in AGENTS.md §11).

| # | Section (render order) | Component(s) | Default state | Primary data plane |
|---|---|---|---|---|
| 1 | Header: breadcrumbs, title, purpose line, data-as-of (or cached-copy sentence) | `GoldPage.tsx` inline | always visible | projection `generatedAt` |
| 2 | Hero — Zone B: live price + day/7d change + 10y position band + market-state pill; balance verdict block (classic brass scale ↔ minimal beam toggle), verdict word, Conditions-outlook line, 4 counts, 30-day context line | `GoldHero.tsx` (452) + `GoldBalanceClassic.tsx` (198) | always visible; view toggle persisted | projection + `comexMarketState` clock |
| 3 | Time machine — Zone C: per-date meter reading (date picker bounded to meter era 2016+) | `GoldTimeMachine.tsx` (227) | **collapsed** | `GET /api/insights/gold-meter?date=` (no localStorage) |
| 4 | Explanation band — Zone D: daily narrative ("Why gold moved") + yield decomposition, side-by-side ≥ lg | `GoldNarrative.tsx` (184) + `GoldYieldDecomposition.tsx` (221) | always visible | pure engines over projection |
| 5 | Education on-ramp (five drivers, notes, FAQ) | `GoldOnRamp.tsx` (297) | **collapsed** accordion | static copy + `goldBalance` |
| 6 | Expectations strip (Polymarket probabilities + Fed/CPI calendar) | `GoldExpectations.tsx` (288) | **collapsed** to top line | `GET /api/insights/gold-expectations` + snapshot calendar |
| 7 | Iran bridge — Zone F Bridge-1: Tehran coin board + per-row parity, method, interpretation | `GoldIranBridge.tsx` (358) | board visible; parity/method/interpretation **collapsed** | App-boot TGJU snapshot store |
| 8 | Iran bridge Bridge-2: premium history (attribution strip, chart, deciles) | `GoldPremiumHistory.tsx` (406) | strip visible; chart/deciles collapsed < 640 px, expanded desktop | `GET /api/insights/gold-premium` |
| 9 | Signals: merged gold+silver card — VerdictStrip (2 chips), **second full BalanceScale**, price-footing strip; silver trend chart | `Signals.tsx` (246) + `signals/MergedCard.tsx` (434) + `signals/verdict.tsx` (366) + `signals/BalanceScale.tsx` (1,401) + `GoldPriceChart.tsx` (626) | **open** by default; show/hide | `GET /api/insights` (second fetch) |
| 10 | The 37 seats by five lanes | `GoldSeats.tsx` (389) | always visible, never collapsed | projection (client re-derivation) |
| 11 | TA reference band — Zone H: SMA 20/50/100/200, 50/200 crosses, daily+weekly pivots, 200-DMA distance sentence | `GoldTaLevels.tsx` (326) | takeaway sentence visible; tables collapsed < 640 px | shared `GET /api/insights/gold-ohlc` |
| 12 | Context — RATIOS: 8 ratio cards + multi-currency grid (Zone I) | `GoldContext.tsx` (406) + `GoldCurrencyGrid.tsx` (250) | always visible | projection readings |
| 13 | Context — FLOWS & POSITIONING: COT pair + physical subgroup (3 cards) | `GoldContext.tsx` | always visible | projection readings |
| 14 | Zone K: central-bank demand tracker (chart + buyers table) | `GoldCbDemand.tsx` (461) | visible; method `<details>` | `GET /api/insights/gold-cb` |
| 15 | Zone K: London vault + clearing rider cards | `GoldLondonVault.tsx` (226) | **collapsed** ×2 | `GET /api/insights/gold-lbma` |
| 16 | Zone K: correlation companion (gold vs 10y real yield + 52-week rolling correlation) | `GoldCorrelation.tsx` (430) | collapsed < 640 px, expanded desktop | shared OHLC + `real-yield-10y/history` |
| 17 | Honest-record footer + forecast retrospective (collapsed companion) | `GoldContext.tsx` + `GoldForecastRetrospective.tsx` (167) | footer visible; retrospective **collapsed** | static LBMA series |
| 18 | Gold Positions: CFTC net (−100..100) + gross-long (0..100) visual bars | `GoldPositions.tsx` (139) | always visible | projection readings |
| 19 | Episode Explorer — Zone O: nine historical episodes (editorial always; price path + comparison drop-gated) | `GoldEpisodes.tsx` (209) + `GoldEpisodePath.tsx` (220) | **collapsed** band + per-record | `GET /api/insights/gold-episodes` (waiting state until WGC drop) |
| 20 | If-you'd-bought calculator: year picker, 4 assets, lump + DCA + decile | `GoldIfBought.tsx` (217) | **collapsed** | `GET /api/insights/gold-ifbought` |
| 21 | Publication notes: absent-count line + §16 licence wall (blocked quartet) | `GoldPublicationNotes.tsx` (126) | **collapsed** | projection `absentIds` + static notes |
| 22 | Details panel (modal) — opened from context cards | `useIndicatorDetailsPanel` | on demand | page readings + per-id history |

Full per-component detail (props, anchors, i18n namespaces, collapse semantics) is in `02-section-and-component-map.md`.

---

## 5. The financial model as implemented (protected surface)

Verified from `packages/insights/src/shared/gold-score.ts`, `domains/gold/gold-balance.ts`, `shared/connections.ts`, and `apps/web/src/shared/components/outlook-core.ts`:

- **Five lanes** (engine ids): `borrowing-costs` (7 seats, polarity −1), `dollar` (7, −1), `stress` (11, mixed polarity), `inflation` (10, +1), `flows` (2, −1). Total **37 voting seats** — matches the live DOM (37 `[data-seat]`).
- **Seat verdict** (`evalLeg` + D-18): unread if absent/stale/pending or if neither direction (30-day change vs seat threshold) nor level (10-y percentile band) is readable; else steady (lean 0) or supports/pressures by `lean × polarity`. Lane vote: `unread` if 0 readable; `neutral` if firing < `GOLD_LANE_MIN_FIRING` (2); majority `for`/`against`; tie → `neutral` + split.
- **Balance rollup**: `net = for − across lanes`; hero verdict `none / not-enough (readable < 3) / for / against / balanced`; beam tilt `|net| ÷ (for+against) × 10°` (floor 3°).
- **"Conditions outlook"** (`goldOutlookOf`): all-5-unread → null; ≥4 lanes for/against → strong-*; range-bound (|30d| < 2% AND typical band AND |L−A| ≤ 1); else mixed/neutral/bullish/bearish. **Derived from the same balance** — GB-S5's "never contradict" contract — with the inline caveat. It is a conditions-direction label, **not** a horizon forecast. There is no scenario machinery, no horizon field, and no separate outlook methodology anywhere in the repo today.
- **Live state at audit time:** verdict "Leaning against gold" (fa: تمایل به ضرر طلا), outlook "Bearish", counts 1 for · 3 against · 1 not leaning (2 lanes firing-under-minimum); seats: 5 supports · 10 pressures · 17 steady · 5 unread (unread: `fed-expectations`, `us-japan-10y-gap`, `michigan-sentiment`, `michigan-1y-expectations`, `michigan-5y-expectations`).
- **Absent (licence-blocked) quartet:** `wgc-etf-holdings`, `wgc-cb-demand` (WGC L3), `official-gold-demand` (PBoC 404), `etf-short-interest` (no licence-clean venue) — disclosed in the publication-notes tail, never rendered as fake data.
- **17 of 37 seats read "steady" today** — the majority of the meter is quiescent, which is honest but visually expensive (37 chips, most saying nothing).

All of the above is **protected** under master plan §9.3: membership, polarity, thresholds, scoring, balance math, outlook classification, percentile windows, provider selection, and rung scheduling are unchanged by this audit and must not change without owner approval.

---

## 6. Findings

Severity: **P0** = blocks the strategy's core promise · **P1** = materially harms the experience · **P2** = polish/regression risk. Each finding carries evidence, user impact, and a recommendation. Recommendations are inputs to Session 2 — none are implemented in this session.

### F-01 (P0) — The balance verdict is presented at summary strength four+ times

- **Evidence (DOM + code):** (1) hero `GoldBalanceClassic` brass scale + verdict word; (2) hero "Conditions outlook: Bearish — 1 for · 3 against · 1 not leaning" line; (3) `Signals`/`MergedSignalsCard` renders a **second full `BalanceScale`** (1,401-line component, same engine, same inputs) mid-page; (4) `GoldNarrative`'s five family lines restate each lane's lean; (5) the collapsed Signals summary line restates the lean + counts; (6) the education on-ramp's five driver rows restate lane states again. VLM independently flagged the hero/Signals duplication: "essentially the same content twice… resets attention."
- **User impact:** no single dominant verdict element; the eye ping-pongs; the page reads as repetitive rather than layered; hero-priority (owner decision: outlook-first hero, one dominant element) cannot be met while a second full-scale balance competes mid-page.
- **Recommendation (Session 2):** designate ONE canonical balance presentation (the hero); demote the Signals BalanceScale to a linked reference or remove the duplicate rendering while keeping `evaluateSignal`'s conditions visible; reuse lane states via anchors from narrative/on-ramp rather than re-rendering them.

### F-02 (P0) — No forward-looking outlook exists; the current "outlook" word is the balance re-worded

- **Evidence:** `outlook-core.ts` — `goldOutlookOf(balance, speed, position)`; GB-S5 contract comment: "the gold state derives from the SAME goldBalance() result… can never contradict each other." Hero prints "Conditions outlook: Bearish… this describes current conditions, not a forecast."
- **User impact:** a casual visitor reads "Bearish" as a forecast despite the caveat; the strategy's locked decision (conditions ≠ outlook; horizons 1–2 wk / 1–3 mo / 6–12 mo where defensible; qualitative direction + scenarios; evidence-consistency wording) has no surface today.
- **Recommendation (Session 2):** design the briefing's outlook block as a **separate construct** (headline + summary + 2–3 reasons + what-could-change-this), explicitly labelled, horizon-stamped; keep the conditions balance beside it, clearly distinct. Do **not** relabel `goldOutlookOf` as a forecast. Any horizon publication requires a documented method and, per §9.3, owner approval if it touches model logic.

### F-03 (P0) — No section navigation of any kind on a 13,000–25,000 px page

- **Evidence:** zero `position: sticky` / section-nav components in `apps/web/src`; only the global fixed header + breadcrumbs + scattered `#hash` links. VLM: "no table-of-contents, sticky anchor nav, or jump links… a real gap given page length."
- **User impact:** orientation is lost after ~3 screens; reaching Zone O or publication notes requires ~20 mobile screens of scrolling; returning to the hero means a long scroll.
- **Recommendation (Session 2 → implemented later):** desktop sticky anchor nav + mobile horizontally scrollable section strip per the owner's locked decision (§4.4).

### F-04 (P1) — 37 always-visible seat chips: high cognitive load, mostly "steady"

- **Evidence:** `GoldSeats` renders all five lane cards with every chip always visible (no collapse); live counts 17 steady / 10 pressures / 5 supports / 5 unread. Strategy: "the visitor should not have to interpret 37 indicators to understand the conclusion."
- **User impact:** the most numerous tier of content is a wall of mostly-inactive chips; scanning cost is high; dynamic highlights (owner decision: up to five featured indicators with reasons) do not exist.
- **Recommendation (Session 2):** group summaries stay; individual chips become progressively disclosed per lane; introduce the explainable featured-driver mechanism using existing fields only (no new composite score).

### F-05 (P1) — CFTC positioning rendered in four places

- **Evidence:** `cftc-gold-positioning` + `cftc-gold-gross-long` appear as (1) flows-lane seat chips, (2) two FLOWS & POSITIONING context cards, (3) the Gold Positions visual-bar section, and (4) COT band chips inside the context cards. Same two canonical IDs, four visual presentations. The strategy explicitly names this deduplication case (§4.2 Section 4 requirements).
- **User impact:** repeated information without added insight; "gross long" appears twice with different visuals.
- **Recommendation (Session 2):** pick one canonical positioning presentation (the visual-bar section is the strongest candidate), keep the model input and lane seat, link the rest.

### F-06 (P1) — `gold-usd` price and `real-yield-10y` each render on 3–4 surfaces

- **Evidence:** `gold-usd`: hero price + Signals gold chip/footing + narrative price fact (+ upstream of 7 derived ratios). `real-yield-10y`: borrowing-costs seat + yield-decomposition real leg + Signals condition + correlation chart's yield axis.
- **User impact:** minor per instance but compounds F-01's repetition impression; the yield decomposition card is genuinely additive (identity + decomposition) while the Signals condition chip is a third restatement of a seat.
- **Recommendation (Session 2):** canonical-placement rules — one primary surface per concept, anchored references elsewhere.

### F-07 (P1) — Duplicate DOM ids: `gold-zone-d` ×2 and `bal-*` SVG ids ×2 (live-confirmed)

- **Evidence (live DOM):** `[["bal-face-brass",2],["bal-face-stone",2],["bal-beam-brass",2],["gold-zone-d",2]]`. `GoldPage.tsx:225` sets `id="gold-zone-d"` on the Zone D band **and** `GoldNarrative.tsx:88` sets the same id on its `<section>`. The `bal-*` gradient ids duplicate because two `BalanceScale` instances render simultaneously (hero classic view + Signals).
- **User impact:** `#gold-zone-d` hash links resolve unpredictably (first-in-document wins — the band wrapper, not the narrative card); duplicate SVG gradient ids can produce wrong-gradient rendering in some browsers (Chrome tolerates; still invalid HTML).
- **Recommendation (later sessions):** remove one `gold-zone-d` id (keep the band's, per R10's anchor contract); scope or suffix SVG gradient ids per instance. Low risk, tiny fix, but it is a code change — out of Session 1's read-only scope.

### F-08 (P1) — Hero carries ~7 competing summary signals

- **Evidence (VLM + DOM):** price, 1d change, 10-y percentile band, classic/minimal toggle, verdict headline, scale illustration, four lane rows with mini-rings — plus three timestamp formats ("Live prices as of…", "COMEX… (UTC−5)", "Data as of…").
- **User impact:** 15-second comprehension goal is not met reliably; the visitor cannot tell which element is the answer.
- **Recommendation (Session 2):** the locked outlook-first hero design (dominant briefing element + price immediately visible) resolves this; consolidate freshness lines.

### F-09 (P2) — GoldPage chunk budget has ~1.1 kB raw headroom (240,000 / 50,000)

- **Evidence:** live `GoldPage-DB-tAujX.js` = 238,898 bytes raw (49.35 kB gz at S17 record; budget 240/50). The budget script's own note: "the last feature wave — the next GoldPage growth is a new program" — this redesign is that program.
- **User impact:** none today; constrains Sessions 5–7 (any hero rebuild, section nav, popover/bottom-sheet infrastructure, or relationship explorer added to this chunk will exceed 240 kB raw unless the budget is re-justified or content is split).
- **Recommendation (Session 4/5 planning):** measure early, plan a budget re-justification or a further route-level split (e.g. lazy-mounting the Zone O tail) as an explicit, documented decision.

### F-10 (P2) — Mobile depth: ~25,000 px; full picture requires ~3–4 screens even for the verdict

- **Evidence:** mobile full-page height 25,095 px at 390 px; VLM estimates 3–4 screenfuls to the "complete picture"; the balance scale tray columns clip at the fold.
- **User impact:** the mobile briefing question ("what's happening now?") is answered only partially above the fold.
- **Recommendation (Session 2 → Session 8):** mobile-first hierarchy per the locked decision (briefing headline → price → balance → five groups + highlights → progressive disclosure).

### F-11 (P2) — Minor copy/jargon and bidi polish items

- **Evidence:** purpose line says "the 37-voter conditions meter" (unexplained jargon, VLM flagged); "Flows & demand: Sitting neutral. No driver firing." wording; VLM noted the fa "۱d/روز ۱" percent-label bidi ordering reads fragile and the classic/minimal toggle placement differs between locales; Persian logo tagline appears clipped in the fixed header (pre-existing, shared chrome, not gold-specific).
- **User impact:** small credibility/comprehension costs; some VLM claims (tagline clip) need verification against the shared header before acting.
- **Recommendation (Session 3/8):** copy pass per the strategy's plain-language standards; bidi audit; verify header tagline clip against `Header.tsx`.

### F-12 (P2) — Cross-page coupling is deliberate but must be respected by the redesign

- **Evidence:** 25 of 37 voters' canonical cards live on `/usa`, 6 on `/currencies`, 2 on `/europe`, 1 on `/world-markets`; seat chips link there (`seatAnchorHref`). `gold-aud` mirrors on the Australia page; `gold-usd` rides the Global ribbon; `usd-reserve-share` + `nyfed-custody` feed the Global dedollar tile; Signals/BalanceScale components are shared with `/insights` (legacy route).
- **User impact:** none today — but any change to shared components (`BalanceScale`, `VerdictStrip`, details panel) or to card ids/anchors regresses other routes.
- **Recommendation (all implementation sessions):** follow §9.2 — inventory consumers before touching shared components; prefer gold-local wrappers.

### F-13 (P2) — Episodes price-path half is intentionally waiting (drop-gated)

- **Evidence:** `GoldEpisodes` renders the editorial nine-record list from static `gold-episodes-records.ts`; the price path + comparison table show the honest waiting state until the WGC prices workbook lands (KV `insights:gold-episodes:v1`, S15-D4). The API currently 503s by design.
- **User impact:** none (honest waiting state per the honesty-first discipline); this is a **known incomplete feature with a standing owner-side lever** (the WGC drop), not a defect.
- **Recommendation:** carry forward as-is; the redesign keeps the waiting state honest.

### F-14 (P2) — Silver's Signals card rides the gold page (secondary content without a strategy-home)

- **Evidence:** `Signals` renders the merged gold+silver card; the silver chip includes its own trend chart (`MetalTrendChart` → `/api/insights/silver-usd/history`), conditions, and collapsed verdict — silver is not part of the gold model (it enters only via the `gold-silver` ratio seat).
- **User impact:** a full silver sub-analysis competes for attention mid-page; the strategy's product hierarchy has no silver-briefing slot (silver appears only as a ratio + in if-bought).
- **Recommendation (Session 2):** decide silver's canonical home (demote to a compact link-out, or keep the merged card but visually secondary). Owner decision required if removed (it is a shipped GPE-era feature).

---

## 7. Visual hierarchy and cognitive-load assessment (task 9)

- **Overall:** "Overwhelming… reads as a report dump rather than a scannable dashboard" (VLM, full-page review). Variable density exists *within* cards but not *between* tiers: the hero, the seats, the context cards, and Zone K all use similar typographic weight.
- **Hierarchy today:** price + balance compete in the hero (F-08); after the hero, sections flow as an undifferentiated stream of 18+ blocks; the only structural signals are section titles and whitespace.
- **Positive:** every module is individually well-built and honest (named windows, named venues, disclaimers, honest waiting states); progressive disclosure is already used extensively (11 collapsed-by-default surfaces); colour semantics (green=supports, red=pressures) are applied consistently in seats/cards.
- **Progressive-disclosure inventory (collapsed by default today):** time machine, on-ramp, expectations topline, bridge parity/method/interpretation, London vault ×2, forecast retrospective, episodes band + records, if-bought, publication notes, (mobile-only: premium chart/deciles, TA tables, correlation, currency grid). This is a strong foundation for the strategy's layered-briefing architecture.

---

## 8. Accessibility, i18n, responsive observations

- **Structure:** single `h1`; 5 `h2` (hero pair, signals, seats title region, ta title, context/zone titles vary) — heading levels are shallow/uneven for a 26-section page (most section titles are styled paragraphs, not headings); `role="status"` loading states; `aria-label`s on icon buttons; skip-to-content link present; `lang`/`dir` switch correctly with locale.
- **Colour:** green/red always paired with words + icons (seats, cards) per the colour grammar; dark-mode pair verified visually.
- **Touch/keyboard:** toggles are real `<button>`s; seat chips are links; the details panel returns focus to its opener; 44 px minimum touch sizes generally respected. Full keyboard/SR passes deferred to Session 8 (per plan) — see §2.
- **RTL:** layout mirrors correctly (VLM: "RTL direction is correctly applied… the scale tips correctly"); minor bidi polish items recorded in F-11.
- **Responsive:** no horizontal overflow at 390 px; several desktop-expanded surfaces collapse on mobile via matchMedia (premium chart, TA tables, correlation, currency grid) — but note these use **session-only** state, so a mobile user re-collapses on every visit (acceptable; worth a consistency check in Session 8).
- **Numbers/dates:** locale-aware formatting in place (`Intl.NumberFormat('fa-IR'|'en-US')`, Jalali dates for fa).

---

## 9. Data states (task: audit missing/stale/error handling)

- **Freshness model:** every surface prints its own as-of (projection `generatedAt`, `pricesAsOf`, per-card as-of, per-row bridge as-of, expectations as-of, OHLC/LBMA/CB dates). Three timestamp formats coexist in the hero (F-08).
- **Stale:** `staleAfterDays` per indicator (grace-day table by cadence); status words render on cards; the fromCache sentence replaces the data-as-of line when the last-good copy paints (no duplicate garble — BD-S5a).
- **Absent/licensed:** the blocked quartet is disclosed in the collapsed publication-notes tail with per-item reasons + one sources link-out (BD-S43 relocation, owner-directed). The main flow stays clean.
- **Waiting:** episodes price-path half (F-13) and the if-bought decile "waiting" line render honest waiting states.
- **Error:** projection error state = honest title/text/retry button; no data faked (Rule 5). The Iran bridge renders a fail-closed unavailable frame without a snapshot.
- **Unread seats:** dark chips with cause-class why-lines (UoM upstream-stopped, CPI upstream-gap, CFTC/GPR pipeline-lag, rule-driven D-18) — a mature, explainable treatment the redesign should preserve.

---

## 10. Known incomplete features / standing dependencies (task 10)

1. **WGC prices workbook drop** gates the Episodes price path + comparison (standing owner lever; save at `data/wgc/…`).
2. **WGC GDT/quarterly demand drop** + PBoC page revival would unblock 2 of the absent quartet (licences, not code).
3. **Kalshi expectations leg** intentionally not shipped (S15-D1 wording read) — Polymarket only.
4. **EODHD plan** (L2) carries the XAU OHLC history; an upgrade is a standing owner lever (not needed for this audit).
5. The fa-string triage queue and `copy:audit` manifest discipline applies to every future copy change (Session 3 especially).

---

## 11. Constraints the redesign must respect (verified)

- **Bundle budget:** GoldPage 240 kB raw / 50 kB gz with ~1.1 kB raw headroom (F-09); entry chunk 296/89.5; `GoldPage-*.js` basename frozen (R5 no-rename rule).
- **Engine contracts:** all verdicts client-re-derived through the pure engines (D-48 "never a second arithmetic"); the page must keep reading the ONE projection contract (`GET /api/insights/pages/gold`, 48 readings) + the documented secondary planes. No new provider fetches/polling without approval (§9.4).
- **Shared components:** `BalanceScale`/`VerdictStrip`/`TrendPanel`/details panel are consumed by `/insights` (legacy) and other routes; seat anchors feed cross-page navigation (`/usa#usa-card-*` etc.).
- **i18n:** every user-facing string through the dictionaries; fa strings are copy-audit-gated (manifest + `pnpm copy:audit`); no em-dashes in fa copy.
- **KV rungs:** the gold-family refresh schedule (minute-trigger rungs: `:13` hourly prices, `:23/:53` expectations, 04:47 meter archive, 04:49 if-bought, 20:33 premium; ingest rungs 04:10–04:35) is protected infrastructure — presentation work must not alter it.
- **Deployment discipline:** D-43 deploy-lock re-check before any deploy; deploys are manual `pnpm --filter @currena/api run deploy`; CI runs gates on push but does not deploy. This session deployed nothing (docs-only).

---

## 12. Questions requiring genuinely critical owner approval (per §1A of the assignment)

None of the following are decided by this audit; they are surfaced for the owner at the right sessions:

1. **(Session 2)** The forward-looking outlook method: horizons published, narrative authoring cadence (daily narrative exists for conditions; an outlook briefing needs an editorial process), and whether the "Conditions outlook: Bearish" wording is retired, reworded, or kept-with-caveat. This touches the presentation of model outputs (protected under §9.3 as re-labelling risk) — the method must be approved before implementation.
2. **(Session 2)** Silver's home on the gold page (F-14): keep the merged Signals card secondary vs. demote to a link-out — removing a shipped feature needs the owner's sign-off.
3. **(Session 5+)** GoldPage budget: exceed 240 kB raw with a documented justification, or split the chunk — either is a deviation from a recorded gate and needs an explicit decision.
4. **(Standing)** The two WGC drops and the PBoC revival unblock the absent quartet; nothing for the agent to do until the owner supplies them.

No financial calculation, weight, threshold, polarity, source, or rung was changed in this session; nothing in this audit requires pre-approval to *proceed to Session 2* (Session 2 is strategy/architecture only).

---

## 13. Acceptance-criteria walk (Session 1)

- [x] Every current page section is accounted for — §4 table (22 rendered blocks + details panel) cross-checked against the live DOM anchor inventory.
- [x] Every unique indicator is mapped to a canonical ID — `03-indicator-and-module-inventory.csv` (48 projection readings + 4 absent + 9 modules; 37 voters + 14 context homes reconciled with the engine tables and pinned tests).
- [x] Every suspected duplicate is supported by component/data evidence — `04-duplicate-and-overlap-matrix.md` (name-similarity-only claims excluded).
- [x] Desktop and mobile inspected in both locales — 31 screenshots (en/fa × 1440/390 + dark pair + 6 expanded states); tablet/SR/keyboard/reduced-motion gaps stated in §2.
- [x] Findings have severity, evidence, user impact, and recommendation — §6 (F-01…F-14).
- [x] No code or production behavior has been changed — docs + screenshots only; `git status` clean of source changes; nothing deployed.

---

*Evidence files: `baseline-screenshots/` (31 PNGs, filenames encode locale/width/section/state). Deployment verification data: §3. This document is the factual baseline for Session 2 — it deliberately contains no redesign.*
