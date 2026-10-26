# Economic Indicators — UI-fidelity correction round (2026-10-19): verification notes

The owner's correction brief returned the editorial hero (deployed as
worker `29ebc99b`, commit `32b23b1`) as "not yet visually faithful" to the
approved `currena-hero.zip` references. This round corrects the actual
causes, presentation-only. Local harness: `wrangler dev` (port 8787)
serving the BUILT SPA with local KV seeded from the live snapshot (the
markets feed seeded from `currena.ir/api/insights/markets`, signal
`attention`, so the Global card's signals panel renders exactly as
production). The PWA service worker was unregistered + caches cleared
before each pass — the SW serves the last precached build otherwise.

## What the correction changed

| Brief § | Correction | Where |
|---|---|---|
| §3 width | container `xl:max-w-[min(calc(100%-56px),1840px)]` (+`lg` band `calc(100%-40px)`); 1600→1544px (96.5%), 1760→1704px (96.8%) | `Insights.tsx` |
| §3 header | page title 32→34px desktop (spec band 32–36px) | `InsightsHeader.tsx` |
| §4 artwork | uniform veils 30%/46% → **26%/30%** surface mix (pass 1 at 12% swung too photographic; pass 2 at 22% still ~5–10% strong; final 26% sits in the reference's washed-watermark zone) | `index.css` `.ei-hero-art` |
| §5 severity (the named bug) | `.ei-row-accent` hardcoded Crisis red in BOTH regions → now `article[data-ei-step]` → `--ei-accent` (4 red / 3 amber-orange / 2 watch / 1 green); the fallback triangle (`.ei-fallback-mark`) and the count line (`stepToneClass(step)`) speak the same region ink | `VerdictMeter.tsx` + `index.css` |
| §6 rows | indicator name 15→16px (spec 15–17px) for the pronounced title-vs-rule hierarchy | `VerdictMeter.tsx` |
| §7 categories | the status-grouped boxes become compact CATEGORY ROWS: label · tinted state badge · sm meter, worst-first, step-0 neutral, `heroGaugesLabel` heading + rule tip kept | `VerdictMeter.tsx` |
| §7 panel | the dedicated explanation panel closes each card: Global = raised world signals under a `worldSignalsTitle` heading on pale red (falls back to the word-choice rule with no feeds); Australia = `verdictRuleLabel` + rule on pale amber; tint follows the region's own step ink; 3px inline-start rule (`.ei-panel-accent`); signal underlines dropped | `VerdictMeter.tsx` + `index.css` |
| §7 strip | `ContinueStrip` under the hero: the JumpNav labels (hero excluded) in order, wired to the same expand-then-scroll navigation | `ContinueStrip.tsx`, `Insights.tsx` |
| §10 meters | the hero (`lg`) meter segments return to the base PILL radius (the 4px rectangle read as a hard progress bar) | `index.css` |

New copy: `ui.worldSignalsTitle` (EN "World signals" / fa «سیگنال‌های جهانی»),
`ui.continueLabel` (EN "Keep reading" / fa «ادامهٔ صفحه») — both triaged in
the Persian copy manifest, round `editorial-fidelity-2026-10-19`.

## Measured results (final pass, agent-browser on the built SPA)

- **EN light desktop 1600**: container 1544px (96.5%); Australia left
  (x 60) / Global right, 728px cards, 24px gap; AU pill step 3 "Stressed"
  with rows accented `rgb(255,131,43)` (#ff832b — the Carbon Orange 40
  stressed ink); Global step 4 "Critical" with alert-red rows; AU panel
  kind `rule`, Global panel kind `signals` ("World signals" + the markets
  bullet with its numbers); 3 category rows on AU; the strip present with
  Prices · Together · Signals · Indicators · About; `docOverflowX = 0`.
- **EN desktop 1760**: container 1704px (96.8%).
- **Tablet 768**: calm single column (736px), zero overflow; **1024**:
  two equal columns (448px), Australia left, zero overflow.
- **Mobile 390 (EN + fa)**: the carousel opens on Global (track
  `358px 358px`, one card per screen); Next / «بعدی» click scrolls to
  Australia (x 16), the dot flips `aria-current`, cue flips; zero
  page-level horizontal overflow; VLM review: one card fills the
  viewport, controls readable, no clipping.
- **fa RTL desktop 1600**: `dir=rtl`; container 1544px; Australia LEFT /
  Global RIGHT (the spec's stable placement, both locales); AU rows
  amber; panel heading «مبنای تعیین وضعیت هر حوزه»; the row chevron
  mirrors (`matrix(-1,0,0,1)`); the strip reads «ادامهٔ صفحه …»;
  header composition measured: region icon rightmost → title → pill at
  the left (reading order preserved); zero overflow.
- **fa dark desktop**: art tones down, zero console errors.
- **Console**: zero errors/page errors on every capture.
- **VLM acceptance** (final pass, reference vs implementation): overall
  **95/100** EN; "no remaining discrepancy a normal user would notice";
  Sydney band confirmed in the reference's washed-watermark zone; rows
  95, categories 94, panels 93, header 92. The fa pass's four claimed
  "defects" were each re-verified as misreads or brief-contradicting
  suggestions (the mirrored leftward chevron IS the correct RTL forward
  direction per spec §9; logical inline-start icon placement is mandated
  by brief §8; the 2-column category grid satisfies brief §7's "compact
  rows or a restrained small grid").

## Gates

typecheck 6/6 clean · **1,603 tests green** (17 in hero-editorial.test.tsx
— 7 new guards: accent-step consistency, category-row contract, both
panel kinds, fa panel copy, strip order+jump, strip empty-state) · lint
0 errors / 15 baseline advisories · copy:audit clean · bundle budgets
held after the documented bump (Insights 656.81/157.17 vs 657.00/157.50;
entry untouched 295.29/88.81).

## Evidence

`docs/insights/screenshots/economic-indicators-fidelity/` — 10 captures:
EN desktop 1600/1760, tablet 1024/768, mobile 390 Global+Australia; fa
desktop 1600 light + dark, mobile 390 Global+Australia.
