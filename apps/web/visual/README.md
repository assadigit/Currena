# Visual acceptance harness (UI_SPEC §12) — apps/web/visual

Playwright harness that renders the **built** Insights SPA (`#/insights`) from
a **synthetic, contract-checked FIXTURE snapshot** on `http://localhost:4050`
and runs the UI_SPEC.md §12 acceptance tests **U-01 … U-14** plus the §12
screenshot captures. It never touches a live site and never reads production
data: `fixture-server.mjs` serves only `visual/fixtures/*.json` (built by
`build-fixtures.ts`, zod-validated against the real `@currena/core` contracts).

## Files

| File | Purpose |
|---|---|
| `build-fixtures.ts` | Writes `fixtures/{snapshot,status,markets,history-*.json}` — every status class, a quarterly card, peak/ma200 fields, 5 future calendar events, 16 market rows with exactly 4 in each of the four L2-01 state bands (derived from `fromHigh`). Run via the `tsx` binary that ships with `@currena/insights`. |
| `fixture-server.mjs` | Zero-dependency `node:http` server (port `FIXTURE_PORT`, default 4050): serves `apps/web/dist` (+ SPA fallback), the fixture API routes (`/api/insights`, `/:id/history`, `/status`, `/markets`), 404 `hidden_site_mode` for `/api/insights/fx`, and `/healthz` for Playwright's `webServer`. |
| `playwright.config.ts` | Chromium only, `retries: 0`. Two projects: `chromium` (testMatch `u-tests.plw.ts` exactly) and `screenshots` (`screenshots.plw.ts`). Run artifacts go to `visual/.artifacts`, never into `docs/insights/screenshots`. |
| `u-tests.plw.ts` | The U-01…U-14 suite. v3-only targets are `test.fail(...)` marked *"v3 target — Phase 6 turns this green"*; everything the current page already does right is a normal passing test. The `.plw.ts` suffix keeps vitest's `**/*.{test,spec}.*` include away. |
| `screenshots.plw.ts` | Captures `insights-{360,768,1200}.png` (+ `-viewport` variants) and `insights-fa-360.png` (RTL) into `docs/insights/screenshots/`. |
| `run-visual.mjs` | The pipeline driver behind the package scripts (fixtures → build-if-needed → Playwright). |
| `probe-overflow.mjs` | Dev helper: lists every element that overflows a 360px viewport on the fixture page (used to debug U-02). Not part of the suite. |
| `probe-overflow2.mjs` | Dev helper: same, but skips the transform-hidden off-canvas side menu — isolates the ONE element that actually pushes `document.scrollWidth` to 370 at 360px (the stale dollar-basket card). Not part of the suite. |
| `probe-contrast.mjs` | Dev helper: prints every key text pair below 4.5:1 in the light theme (the U-03 light evidence). Not part of the suite. |

## Commands (exact)

```bash
# 0. one-time browser install (chromium; already installed in this workspace)
cd apps/web && pnpm exec playwright install chromium

# 1. build the fixture snapshots (zod-checked against @currena/core)
pnpm --filter @currena/web run visual:fixtures

# 2. build the SPA (also runs the T-15 site-mode check + the bundle budget)
pnpm --filter @currena/web build

# 3. run the U-01..U-14 suite (assumes dist + fixtures exist)
pnpm --filter @currena/web run visual:test

# 4. capture the §12 screenshots (builds dist when missing; writes
#    docs/insights/screenshots/insights-{360,768,1200}[-viewport].png + insights-fa-360.png)
pnpm --filter @currena/web run visual:screenshots
```

Everything in one go (fixtures + build-if-needed + both projects):

```bash
cd apps/web && node visual/run-visual.mjs all
```

Run a single U-test during Phase 6 work:

```bash
cd apps/web && pnpm exec playwright test --config=visual/playwright.config.ts --project=chromium -g "U-07"
```

## Reading the baseline

`pnpm --filter @currena/web run visual:test` exits green when every test the
current v2 page already satisfies passes AND every v3 target fails *as
expected* (those carry `test.fail()`). The task brief for each marker lives in
the comment above the test.

Measured baseline (2026-10-19, chromium, built SPA + regenerated fixtures —
18/18 green: 9 pass + 9 expected-fail):

| Test | Baseline | Evidence / reason |
|---|---|---|
| U-01 hero verdict + why + what-next | **expected fail** | v2 hero has verdict + gauges but no `[data-hero-why]` three-row list and no next-event line — Phase 6 (§3.1 UI-01/UI-03/UI-05) turns it green |
| U-02 no overflow at 360/768/1200 | **expected fail** | at 360px `document.scrollWidth` is **370** — the stale dollar-basket card (`#insights-card-dollar-basket`, nowrap "data for …" meta) pokes 10px past the viewport (768/1200 clean; no key section clips at any width). Also visible in the §12 shot: `insights-360.png` is 370px wide. fa-RTL at 360 is wider still: `insights-fa-360.png` measures 403px |
| U-03 contrast 4.5:1 (light) | **expected fail** | light-theme state tokens: "Normal" chip words **3.35:1** (Carbon green on its 15% tint), "Unusual" chip **1.61:1** (yellow on amber tint). UI-15 token rework turns it green |
| U-03 contrast 4.5:1 (dark) | **pass** | every chip word + heading + body pair clears 4.5:1 on the dark palette |
| U-04a chip words = today's vocabulary | **pass** | all 8 words (Normal / Needs attention / Unusual / Context / Stale / Check pending / Limited history / No data) present, every chip matches its `data-status`, all status classes render |
| U-04b chip words = v3 six-word vocabulary | **expected fail** | Normal/Needs attention/Context/Stale/Delayed/Can't tell right now — today still renders Unusual / Check pending / Limited history / No data |
| U-05 data date per card | **pass** | every rendered card face (all 52, tail expanded) shows "data for …" or "as of …" (unavailable cards exempt by design — U-07) |
| U-06 quarterly labels | **pass** | all 5 genuinely-quarterly cards print "data for {June…} quarter 2026", never a bare "July 2026" |
| U-07 unavailable card hides value | **pass** | `#insights-card-china-pmi` renders `data-status="unavailable"`, no `bdi`, no digit on the face, honest "No data" line |
| U-08a no Active/Partly active/Signals disagree | **pass** | gone from the Together section AND from the whole page body (checked page-wide) |
| U-08b "N of M readings match" summary | **expected fail** | relationship cards still show Showing/Partly showing/Not showing with no match count — UI-33 turns it green |
| U-09 balance legible at 360 LTR+RTL | **expected fail** | no balance visual exists yet (grouped lists) — §9 (UI-39..UI-43) |
| U-09a <3 readable → level beam | **expected fail** | same — needs the Phase 6 balance + a low-readable fixture variant |
| U-10 prefers-reduced-motion | **pass** | no CSS animation runs; the reduced-motion selectors of `src/index.css` all read `transition: none` / `animation: none` in computed style (`.verdict-meter-seg`, `.insights-panel` + scrim; `.connection-arrow` asserted whenever an element carries it — defined-but-unused CSS today) |
| U-11 stock table words + local-currency note | **pass** | header note "Returns in each market's local currency", full table shows exactly Near its high / Pullback / Correction / Bear market (the fixture puts 4 of the 16 markets in each band, derived from `fromHigh`), zero "Normal" in the whole section |
| U-12 no past calendar events | **pass** | strip = 3, full list = 5 fixture events, all Today/Tomorrow/N-days-away, none negative |
| U-13 no hard-coded copy in JSX | **pass** | deny-list + sentence-shape scan over 45 Insights component files: 0 violations |
| U-14 export 401/403 without owner token | **expected fail** | fixture server answers 404 for `/api/insights/export` — TODO(Phase 9): wire the real Worker route (RULES M-3) and drop the marker |

## Port / env

| Env | Default | Meaning |
|---|---|---|
| `FIXTURE_PORT` | `4050` | The fixture server's port (matches `baseURL` in the Playwright config). |
