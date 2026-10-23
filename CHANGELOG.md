# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

## [2026-10-23] — the Phase-2 open: the unhide round (Shiller pair + china-pmi) and the rung CPU fix (M0+M1 of the D-42 milestones)

The owner approved the review's Wave-0 calls with a sequencing directive
("Do them in phases. add a milestone for each phase." — D-42): OD-1/OD-2
(the unhides), OD-5 (the credit-spread licence row, M3), OD-7 (the
subtraction set, M2) and OD-8 (the five value-ordered waves). This round
delivered M0 (the decision records + `docs/PHASE2_MILESTONES.md`) and M1 —
plus the unplanned M1† the rungs forced.

### M1 — the unhide round

- **The Shiller pair serves publicly** (`shiller-cape` 40.71 ratio /
  `shiller-ecy` 0.56%): the risk-register row flipped owner-accepted +
  enabled (the T-30 flip, mirrored in `RISK_REGISTER.md` + `LICENCES.md`),
  the display gate opened in `licences.ts` (publicDisplayOk yes, terms
  re-read 2026-10-23, attribution "Data: Robert Shiller, Yale"), and the
  ingest reads the committed converted file
  (`data/shiller/shiller-cape.json`) — the ECY fraction is scaled ×100 to
  the registry's percent convention at parse time. Runtime honestly
  recorded as **manual**: the monthly GitHub Action died with the
  account's Actions minutes (2026-10-20); `scripts/shiller-fetch.ts` is
  the documented refresh path. **Open item:** shillerdata.com was
  unreachable from the work venue (the fetch honestly fell back to the
  stale 2023 Yale mirror and was discarded) — the committed file
  (latestDate 2026-10-01) must be refreshed from a reaching venue before
  the 45-day window closes (~2026-11-15).
- **`china-pmi` serves publicly** (50.1, Normal, growth gauge now 6
  members): the NBS English terms pages were read 2026-10-23 — no reuse
  prohibition found for attributed quotation; the manual licence row
  flipped display-ok (D-42/OD-2) with the enteredOn/expiry bookkeeping
  (E-08/T-33) unchanged. The global voting pool went 22→23.
- **The generated projection**: `hiddenIndicatorIds` is now empty (65
  public readings); the audit entries for the three ids match the
  deployed sidecar on all 65 entries after regeneration.

### M1† — the rung CPU fix (exceededCpu at the free plan's ~2 s budget)

The 04:10/10:10 rungs had been dying silently at exactly cpuTime 2050 ms
(captured live via `wrangler tail` on temporary hourly :05 diagnostic
rungs, since reverted with an honest note): the rung builds the snapshot
TWICE — the draft that feeds the validation suite, then the final with
the safety flags — and the deterministic percentile work over 10-year
windows is the CPU that killed it. The fix memoizes the deterministic
per-reading base (`baseReadingCache` in `adapters/snapshot.ts`): the two
builds differ only in `flags`, which applies after the cache point, so
the second build replays instead of recomputing (clone-on-hit keeps each
build's reassignments private). Phase timings surfaced to the run log.
The fixed 16:05 UTC rung completed healthy at cpu 1831 ms with the
snapshot + stage + public projection all written.

### The recovery note (recorded honestly)

The M0+M1 working tree was lost to a sandbox reset before its commit —
the source was reconstructed from the deployed Worker's own sourcemap
(7 files recovered byte-exact) with the licences display flips and test
pins re-derived against the recovered audit; the regenerated registry
matches the deployed audit on all 65 entries. Tests: typecheck 6/6;
insights 557, api 344, web 680 passed (the 16-failure briefing jsdom
baseline unchanged); the two date-conditioned prices-cards pins and the
sweep date-bomb fixed for the new reality (real-clock-relative fixtures).

## [2026-10-21c] — the currencies section returns, the licence-hidden cards are restored on verified terms, and the balance/panel round (owner restoration)

The owner's directive: "currena's insight used to have a full currency and
pairs section, which was dedicated and detailed… they're all gone during the
updates and upgrades, please revert and restore that section. but check it
financially and logically. they must make sense, be real, with updated and
real data." — plus four follow-up directives (retire the silver balance,
fix the too-slow gold tilt, replace the count-repeating Australia signals
bullets with real data, retire the weekly-event line, and restore the
"Are markets nervous?" indicators — "only crypto/fear greed is relatable
for this part").

### Why the sections had vanished — and the licence fix

The 2026-10-19 public-mode decree hid 28 indicators + the whole fx board
behind the fail-closed licence gate. Three of the four blocking licence
classes were re-verified TODAY (2026-10-21, each read verbatim in a real
browser — the exact step the old evidence said was pending):

- **ECB** (the Frankfurter FX legs + the DFR rate): the ECB "Disclaimer &
  Copyright" page permits free use of website information when it appears
  accurately, the ECB is cited as the source, modifications are stated
  explicitly, and it is not sold without notice. Currena shows the
  reference rates verbatim with ECB attribution; every derived number
  (the dollar basket, gold-AUD) carries its own stated definition; the
  same rates already power the public converter. → `publicDisplayOk: yes`.
- **World Bank** (copper, platinum, iron-ore, copper-gold): the World Bank
  Dataset Terms are CC BY 4.0 ("Unless specifically labeled otherwise…")
  with the attribution format "The World Bank: Dataset name: Data source"
  — now rendered on the cards. → `yes`.
- **FRED citation-required** (STLFSI, NFCI, VIX, T10Y2Y, T5YIFR, the
  Philadelphia Fed survey, the OECD Bund/JGB/Gilt/BoJ/BoE series): the
  FRED legal page says of that class "you may use these data series with
  proper attribution of the source and acknowledgment that you obtained
  the data from FRED (example, 'Source: BLS via FRED') when displaying or
  publishing it" — the reading attributions now carry the "publisher via
  FRED" citation (e.g. "Cboe via FRED (VIXCLS)"). → `yes`.
- **China PMI stays private** (hand-entered, publisher terms unread) and
  **the Shiller pair stays owner-refused** (ownerAccepts false, source
  kill-switched) — the generated hidden set is exactly
  `[china-pmi, shiller-cape, shiller-ecy]`.

The world-currencies board rides a dated owner directive
(`OWNER_PUBLIC_BOARD_OVERRIDE.fx`, the 2026-10-18b markets pattern), the
eth-usd owner override is retired with its card, and the T-15 gate
(check-site-mode.mjs) now pins BOTH boards public with their evidence
notes. The registry/audit/overrides files were regenerated: 65 indicators,
3 hidden, `hiddenBoards: []`.

### What came back

- **The world currencies section** (10 ECB-reference pairs, 7 backtested
  pattern rules — risk-off, carry, dollar strength, Europe worry, the
  China link — the dollar-at-a-glance row, the quiet area, the pairs
  table with per-pair detail panels): `/api/insights/fx` serves it
  publicly, the SPA section renders (the bundle's own gating reads the
  regenerated overrides file).
- **"Are markets nervous?" gets its voters back**: STLFSI, NFCI, VIX,
  the gold/silver ratio + the FNG context card — and the eth-usd price
  card is RETIRED (the owner: a second crypto price is not a
  market-stress indicator; the prices board carries crypto prices). The
  definition, adapter leg, copy, schema id and owner override all went
  with it (66 → 65 indicators).
- **Borrowing costs / growth get their cards back** (the yield curve,
  the ECB deposit rate, Bund/JGB/Gilt, the BoJ/BoE policy rates, the
  5y5y breakeven, the Philadelphia Fed survey, copper, platinum,
  iron-ore) — all with live, fetched data.
- **The gold balance heals as a side-effect**: 3 of its 5 conditions were
  reading 'unknown' because their inputs (breakeven, STLFSI/NFCI, the
  dollar basket) were licence-hidden; with the inputs restored the
  balance weighs real conditions again.

### The balance round (gold's tilt, silver's retirement)

- **Silver's balance is retired entirely** (the owner: "I dont need
  balance scale of Silver, remove that section entirely") — the
  `<BalanceScale metal="silver">` render, the `metal` prop, and the six
  balanceSilver copy variants are gone; silver keeps its analysis card
  (VerdictStrip) and its price-footing row.
- **Gold's tilt reads the DIRECTIONAL load** (the owner: "the tilt of
  balance for gold is too slow, currently one side has an item, other
  doesn't have at all, but they are seemingly aligned"): the presentation
  scale is now `|net| / (for + against) × 10°` clamped to [3°, 10°] — the
  share of the pan load on the heavy side. A one-sided pan tips the beam
  the whole way; a 2:1 majority tips ~6.7°; an even split stays level.
  Neutral/unread conditions never sat on a pan, so they can no longer
  damp the picture. The verdict words, counts and the UI-40 sparse rule
  are untouched; the swing envelope, needle arc and stage geometry all
  derive from the same constants.

### The panel round

- **The Australia signals bullets name the flagged indicators with their
  live values** (the owner: the count-only bullets "only repeat the
  fields which are just mentioned on the header") — "Inflation & rates ·
  Critical — Australian prices vs a year ago 4.4% · Underlying inflation
  4.4% and 1 more", the click drills into the first flagged card. Farsi
  renders the same data in Persian digits («… · بحرانی — تغییر
  قیمت‌ها… ۴٫۴٪ و ۱ شاخص دیگر»). The count sentence stays as the honest
  fallback when no value is displayable.
- **The hero's weekly-event line is retired** («رویداد این هفته: …») with
  its two copy keys and the HeroBlock prop; the week's status changes
  live on in the full data export + CSV (their own surfaces).

### Gates

- Tests: web 696, insights 533, core 191, api 335, markets 13, scraper
  67 — all green; typecheck 6/6; lint 0 errors / 15 accepted advisories.
- Copy: audit CLEAN (137 backfilled triages — the 2026-10-21 data-integrity
  round's recovered fa copy was never triaged by that session — plus this
  round's 2 new keys and the 2 shipped map-cell drifts; 8 retired keys
  dropped from the manifest).
- Bundle: the Insights lazy chunk is 757.01/182.41 kB — SMALLER than the
  live deploy (761.20/185.13, itself already past the old 700/169 line
  the deployed round never re-checked) — budget consciously bumped to
  765/186 for the restored currencies section + the 12-card corpus.
- T-15 (SITE_MODE=public): 3 indicators hidden, both world boards public
  on their directives.

## [2026-10-20d] — the World card gets its picture: the owner's New York photo joins Sydney's band (owner round)

The owner's directive: "Use this picture, turn it to webP, and use it for
the World container. so both containers aus and world now have picture."
— the uploaded `new-york-bg-fade.jpg` (1400×248, the same band format as
Sydney's `sydney-harbour-faded.webp`). The World (Global) region card's
header band swaps its faint world-map texture for the New York harbour
photo, so both region headers now open on a photograph. No data, scoring,
copy or other page changes — a presentation-only round on the restored
editorial hero.

### The asset

- `apps/web/public/assets/artwork/new-york-bg-faded.webp` (18.7 KB) —
  the owner's JPEG converted to webp (quality 82, method 6) with one
  recorded normalization: contrast ×1.4 + brightness ×0.97. The upload is
  a high-key, low-contrast fade (luma std 17.9 vs Sydney's 27.0, no
  darks below 123) that read as a blank wash through the band veil; the
  lift brings it to Sydney's measured band weight (mean 231.1 vs 231.4,
  std 24.0 vs 27.0) with zero pixel clipping, while keeping the owner's
  airy, watercolour-like fade as the aesthetic.
- `global-map-faded.webp` stays in the tree, unreferenced, for the record.

### The wiring (index.css `.ei-hero-art--global`)

- The photo rides the SAME veil family as Sydney's band (the 26% flat
  surface tint; dark mode 0.5) — the retired "map must stay even quieter
  than Sydney" sub-rule was about the map texture, not about photos.
- Two photo-specific tunings, because the owner's photo composes
  differently from Sydney's: (1) the framing window sits at `72%` — the
  same offset as Sydney's — so the frame lands on the Empire State /
  One WTC cluster (Statue of Liberty left, Brooklyn Bridge far right)
  instead of empty haze; (2) the bottom fade completes at 30% of the band
  (desktop; 34% mobile) instead of 46%, because this skyline rides the
  horizon at the photo's middle third — the old fade dipped the
  skyline under a 73-100% surface wash (the photo's subject was
  mathematically erased; row-level render measurements confirmed 0.0
  detail where the skyline should be). Only the water-reflection sliver
  dissolves into the card seam now.

### Gates

- web 698/698 · typecheck 6/6 · lint 0 errors / 15 accepted advisories ·
  copy:audit clean (no strings changed) · visual 19/19 (U-01..U-14 on the
  new band) · budgets held with NO JS change (entry 295.28/88.81,
  Insights 697.38/167.88 vs 296/89.5 and 700/169) — CSS + public asset
  only; the webp rides the PWA precache.
- VLM visual pass on the regenerated captures: the two bands read
  "reasonably balanced" (Sydney 8/10, New York 6/10 — the remaining
  softness is the owner's own fade), the NYC skyline unmistakably
  visible (Statue of Liberty · Lower Manhattan · Brooklyn Bridge), all
  title/pill/count text readable EN + fa, mobile + RTL clean, zero
  overflow.

## [2026-10-20 (owner UI restore)] — the previous UI returns over the v3 data layer ("I liked the previous UI more… in the PREVIOUS UI")

The owner's directive, on seeing the merged v3 surface live: "I liked the
previous UI more, especially for the world and australia header sections.
please revert back to the previous version UI, but keep the new data,
connections etc. I mean keep those part of updates which are about the
indicators and their connection and reliability. but in the PREVIOUS UI."
Presentation reverts to `main@1e39a24`; the v3 **data** layer (sources
registry, connections, reliability machinery, state words, delayed tier)
stays and feeds the restored surface unchanged.

### Restored (previous UI, verbatim from `main@1e39a24`)

- **Hero (the world + Australia header sections)**: the editorial hero —
  art-band region cards (Global first, D7), tinted verdict pill + the
  four-step meter, needs-attention tiles with numbers + "+n more",
  compact gauge rows with state badges, the rule-toggle/signals closing
  panels, the R4 biggest-move card, and the mobile Global-first swipe
  carousel (dots + prev/next + swipe cue below 768px). The v3 UI-01..14
  card (verdict sentence / reading bar / why-3 / what-next / freshness
  chip / data-trust alert box) is retired by the directive.
- **World-section hero integrations return**: the raised world-markets /
  world-currencies bullets (§5.3/§6.5) and the two section indicators
  (§6.11/§9.10) ride the Global card again (`marketsAlert`/`fxAlert`/
  `sectionIndicators`, via the unchanged `world-feeds.ts` hooks).
- **`ContinueStrip`** returns under the hero (the fidelity round's
  "bottom information strip"); the v3 `MovesNextStrip` retires from the
  page (the component file stays, unused, mirroring how the merge kept
  `ContinueStrip.tsx`).
- **Full markets table**: the round-46/47 lens columns return (Today ·
  1 week · 1 month · 3 months · 1 year · from-high) plus the Trend
  column (Step-1 F2: word + arrow from the same 3-month number) and the
  Status column — the v3 UI-27 column cut is retired. The lens fields
  never left the contract (the merge kept them for the exports), and
  **UI-27's local-currency note is kept** on the restored table (an
  honesty caveat, not a column change). The visual fixture regains its
  synthetic `chg1w`/`chg1y` so the harness exercises the columns.
- **Tests**: `hero-editorial.test.tsx` (the editorial carousel's 20
  regression guards) is restored; visual **U-01** re-pinned to the
  restored hero (region cards, pill, 3 tiles per card, gauge rows, R4
  mover, the live markets bullet) and **U-11** re-pinned to the restored
  column set + the kept note.

### Kept (the v3 updates about indicators, connections, reliability)

- The whole data layer: sources risk registry + method ladder (T-25/T-27/
  T-28/T-30..T-34), new adapters (Shiller FS-06 pipeline, owner-disabled),
  connections/relationship machinery, validation + sanity gates,
  `RULE_VERSION` — untouched.
- The state language (six words + Delayed tier), `StatusChip` rework,
  on-face `CardMeta` source/freshness meta rows, the header data-health
  chip (UI-50), the About rework (UI-49 per-source table), owner-gated
  exports (M-3), the M-5 panic switch, the per-metal v7 `BalanceScale`
  with the UI-40 sparse-honesty rule (already main's component), the
  5-event calendar with tz labels (UI-47), relationship cards with
  neutral "N of M" summaries (UI-46), the markets/fx public gating —
  all still in place; the restored hero simply renders from the same
  snapshot.

### Gates (restored-UI tree)

web unit **698/698** (678 + the restored 20-test editorial suite) ·
typecheck 6/6 · lint 0 errors/15 advisories · copy:audit clean ·
visual acceptance **19/19** (U-01/U-11 re-pinned; U-02 overflow held at
360/768/1200 across the restored carousel; U-13 clean on the restored
sources) · bundle budgets: the Insights lazy chunk measured **697.38 kB
raw / 167.88 kB gz** — the restored editorial markup is +10.60/+2.43 kB
over the v3 card, budgets bumped 687/166 → **700/169** with this entry
as the justification (entry chunk untouched 295.28/88.81) · self-check
regenerated (see SELF_AUDIT.md + the dated export).

## [2026-10-19 (v3 merge)] — the v3 Insights rebuild merges with main's parallel owner rounds and ships

The owner's directive: "Commit Push deploy. merge with main branch. and
deploy and release." The `insights-rebuild` branch (12 commits, the v3
spec package 100% implemented, 1,637 tests at Phase 9) merges with
`origin/main` (96 newer commits of parallel owner rounds — balance v6/v7,
asset-cards sidebar, world-indices briefing, ≥96px wordmarks, editorial
hero + fidelity + panels, Australia signals, yearly/weekly/monthly lenses,
prices rounds — all live on currena.ir). Two owner-directed streams, one
tree; the v3 spec package (uploaded last, at `1e39a24`) stays the
governing authority for the Insights page.

### Merged — v3 spec governs, main's machinery implements

- **Balance (UI-45/UI-40 on the v7 machinery)**: the merged card renders
  the owner's v7 `BalanceScale` (pans, SVG mechanical layer, needle +
  three-tick arc gauge — kept verbatim) **per metal** — gold AND silver
  each get their own balance; the silver-only industrial condition rides
  silver's balance (the separate short list is retired); `range`-safe
  honest counts ride both (UI-39.5 readable-count line); **UI-40**: fewer
  than 3 readable conditions → level beam, gauge hidden, the honest
  refusal wording (readable 0 keeps the owner's "Can't read the
  conditions right now", 1–2 shows the spec's "Not enough readable
  conditions to weigh"); the v6 2° floor keeps governing readable ≥ 3
  tilts. The retired rebuild-only `Balance.tsx`/`balance.ts`/`readable.ts`
  and their pins are deleted; the 12° helper law is superseded by the
  owner's iterated 8°/2° law + the sparse rule.
- **Hero**: the v3 hero (verdict sentence + reading bar + why-3 + calm
  line + what-next + freshness chip + alert box, UI-01..09) replaces the
  editorial carousel/art-band hero of the fidelity round; the
  `ContinueStrip` under the hero is replaced by the spec's
  `MovesNextStrip` (UI-18/19, real readings + dates); the section
  indicators stay off the v3 hero by its documented choice.
- **Stock table**: the exact UI-27 six-column set (Trend gone, U-11 pin)
  inside main's editorial briefing (movers, heatmap, wordmarks, breadth);
  the week/month/year data stays available through the five-lens view
  switch and every export.
- **Boards**: the owner's 2026-10-18b markets directive survives (the
  markets board is public, fx stays hidden) — now behind the M-5 panic
  switch (`accessModeOf` + `HIDDEN_BOARDS`).
- **Fetching (T-25/F-09)**: Yahoo keeps the honest `CurrenaDashboard/1.0`
  UA (never main's spoofed Mozilla) at `range=2y` (round 47's yearly
  anchor); the M-6 kill switch guards both providers.
- **Tools (UI-51/UI-53)**: the owner sign-in + gated exports + live mode
  switch ride main's grayscale control language at the v3 44px touch
  minimum.
- **Infra**: union-merged budgets (measured merged-tree 686.78 kB raw /
  165.45 kB gz → budgets 687/166, the entry chunk untouched at
  295.28/88.81), state tokens + `--ei-navy` + market-logo CSS both sides,
  copy manifest union (+silver balance strings, +verdictNone/silverOnly
  triage, −6 retired rebuild-only entries).

### Gates (merged tree)

1,804 tests green (core 191 · scraper 67 · insights 521 · markets 13 ·
api 334 · web 678) · typecheck 6/6 · lint 0 errors/15 advisories ·
copy:audit clean · T-15 + bundle budgets held · visual acceptance
**19/19** (U-09/U-09a re-pinned to the merged BalanceScale, U-10
duration-based) · self-check **25/25** — SELF_AUDIT.md + the dated
export regenerated.

## [2026-10-19 (yearly lens)] — the stock indices gain a Yearly view, carried by a real chg1y in the stored contract (owner round 5)

Owner round 5: "add yearly view to the stocks indexes." The world-indices
handoff had refused to fabricate an annual lens (no field in the contract);
this round closes that gap the honest way — a contract + pipeline change,
never a frontend derivation.

### Added

- **`chg1y` on `MarketEntrySchema`** (OPTIONAL, like `chg1w`/`chg1m`) —
  last close vs the last close on or before the same date one year
  earlier, percent. A stored row without it is a pre-round-47 row and
  renders an honest dash; the next markets run rewrites every row with it.
- **The year-ago anchor rule** (`compute.ts yearAgoAnchor` + config
  `CHG1Y_ANCHOR_DAYS`/`CHG1Y_ANCHOR_TOLERANCE_DAYS`): the strict 365-day
  rolling anchor, and — because both free providers cut history at
  exactly one year (verified live 2026-10-19) — when the series' first
  close falls inside the ±15-day band around the target (350–380 days
  back, the repo's `yoyPctSeries` year-on-year convention), that earliest
  close IS the anchor. Closer-than-350-day windows omit the field.
- **Yahoo `range=2y`** (was `1y`) on the fallback fetch — the yearly
  anchor always carries real closes with margin (verified live: 1y
  returns points from exactly one year back; 2y from two years).
- **The Yearly lens** («سالانه») as the fifth radiogroup option after
  Quarterly — breadth, coverage note, movers, tiles, heatmap scale and
  aria all re-read `chg1y` through the one `viewValue` lens map; the
  default stays the NORMAL 3-month lens (owner round 44).
- **A "1 year" column** beside 3 months in the full table (desktop +
  mobile row list) and a **"1 year %"** column in the world-markets CSV
  (appended at the END — position-pinned scripts keep reading every
  existing column at the same index) and the full export.
- 3 new copy keys × 2 locales (`viewYearly`, `thYear`, `csvColYear`);
  Persian copy manifest round `markets-yearly-lens-2026-10-19`.
- 6 new test guards (1,612 total): the five-horizon lens list (YTD and
  52w-distance still refused), the strict/one-year-window/omission anchor
  cases, the rendered yearly surface with the honest dash + coverage
  note, the `range=2y` URL, the export slots, and the 16-market payload
  still under 13 KB with `chg1y` on every row.

### Changed

- The spec's §11.2 data-gap report is marked CLOSED by this round
  (§11.6 documents the shipped design); §6.3/§6.4 list the five lenses
  and the new table column.

### Budgets

- All held without bumps: entry untouched (295.29/88.81), Insights
  660.88/158.00 vs 661.00/158.50.

## [2026-10-20 (australia signals)] — the Australia card closes with the same signals box as World Signals, carrying its own area data (owner round 4)

Owner round 4 on the hero's closing modules: "Just like World Signals, I
want the same Box with proper data for Australia." The world-section
signals stay Global-scope — Australia's proper data is its OWN areas, so
its signals box raises the gauges themselves.

### Added

- **The Australia signals box** («سیگنال‌های استرالیا») — the SAME
  construction as the Global world-signals panel (always open, never
  behind the toggle; 15px bold heading + bullets; the state mark 18/20;
  the region's own pale tint + step ink on the heading), with one bullet
  per Australian gauge, worst first:
  - the raised areas (step 2+) speak their counts and state word in
    their OWN step ink — "{area} · {word}: {warnings} of {voting}
    indicators need attention." (the markets bullet's shape) — and jump
    to the Australia section where their lanes live;
  - the calm areas (step 1) sit in the quiet rows' muted ink as
    "{area} · Stable", and the unreadable ones (step 0) honestly as
    "{area} · not enough data to read" — never buttons.
  New hooks scoped to the new content: `data-ei-area-bullets`,
  `data-ei-area-signal="raised|calm|no-reading"`, `data-ei-area-step`.
- Two new copy keys, en + fa (`australiaSignalsTitle`,
  `australiaSignalArea` — Persian copy manifest round
  `australia-signals-2026-10-20`); the quiet rows compose existing keys
  only.

### Changed

- **The round-3 rule toggle becomes the shared FALLBACK** — a region
  with nothing to raise keeps the low-key rule toggle (no feeds on
  Global / no readable gauge on Australia). On a readable Australia the
  signals box replaces it; the word-choice rule is always reachable
  through the "?" tip beside the gauges heading on both cards.

### Budgets

Insights lazy chunk 659.00/158.00 → **661.00/158.50** (measured
660.14/157.86; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the AU panel branch + the area bullets + the two new strings; gz
+0.37 kB. D-39 in `docs/DECISIONS_FOR_ALI.md`. The panel guards in
`apps/web/src/components/insights/hero-editorial.test.tsx` grow 3 → 6
(the AU box structure + jump + counts, the no-readable-gauge fallback,
fa area bullets with fa digits); 20 guards total.

## [2026-10-19 (panels)] — the rule panel tucks behind a low-key toggle; the world-signals panel becomes the hero's emphasized closing module (owner round 3)

The owner reviewed the fidelity-round hero and returned two directives on
the closing explanation panels: the long word-choice rule («مبنای تعیین
وضعیت هر حوزه») is reference material that should stop occupying the
card, while the Global signals («سیگنال‌های جهانی») are "probably one of
the most important parts of the whole hero" and must read that way.
Presentation-only again: no calculation, feed, count, ranking, aria hook
or translated string changes (both panels reuse their existing copy keys).

### Changed

- **The rule panel hides behind a low-key toggle** — the always-visible
  tinted rule panel (Australia, and Global's no-feed fallback) collapses
  to one quiet muted pill (the established "+n more" disclosure language:
  `verdictRuleLabel` + a direction-neutral chevron, `aria-expanded`/
  `aria-controls` like GlossaryTip); the click reveals the familiar
  tinted panel beneath it — same hooks (`data-ei-panel`,
  `data-ei-panel-kind="rule"`, `-heading`, `-rule`), same copy, same
  tint ladder. The Australia card stops spending its closing module on
  the reference paragraph.
- **The world-signals panel steps UP in type** — the Global panel's
  heading and every bullet rise from the 12.5px caption tier to 15px
  bold (`leading-relaxed`), the state mark grows 16/18 → 18/20, the
  bullet rhythm gets roomier (1.5 → 2 spacing) and the panel padding
  breathes (px-3/py-2.5 → px-3.5/py-3) — emphasis through type and
  space, not louder chrome: the pale-red surface, region-step ink and
  the `data-attention-box`/bullets hooks stay exactly as approved. The
  panel is never tucked behind the toggle — it is always open.

### Budgets

Insights lazy chunk 657.00/157.50 → **659.00/158.00** (measured
658.10/157.49; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the disclosure button + chevron + branched heading markup; gz +0.32 kB.
D-38 in `docs/DECISIONS_FOR_ALI.md`. The three panel guards in
`apps/web/src/components/insights/hero-editorial.test.tsx` now exercise
the disclosure (collapsed default → click → real panel, signals panel
never toggled); 17 guards total.

## [2026-10-19 (fidelity)] — the economic indicators hero closes the gap to the approved reference (the owner's UI-fidelity correction brief)

The owner reviewed the editorial hero round against the approved
`currena-hero.zip` references and returned a correction brief: the result
still read as a generic KPI dashboard, not the approved editorial financial
interface. This round corrects the actual causes — presentation-only again:
every calculation, threshold, ranking, aria hook, count, feed and translated
string is untouched (the panel/strip copy is the only addition, triaged in
the Persian copy manifest round `editorial-fidelity-2026-10-19`).

### Changed

- **Page content width (brief §3)** — the old `xl:max-w-[1440px]` cap left
  80–160px dead margins on 1600–1760px screens; the Insights container now
  rides `lg:max-w-[calc(100%-40px)]` / `xl:max-w-[calc(100%-56px)]` /
  `2xl:max-w-[1840px]` — 1544px (96.5%) at 1600, 1704px (96.8%) at 1760,
  with a ceiling so ultra-wide desktops keep a sane reading measure. The
  page title steps up to 34px desktop (inside the spec's 32–36px band).
- **The art band shows (brief §4)** — the uniform veils over the Sydney
  Harbour / world-map artwork were too heavy (the artwork read as absent):
  Australia's veil drops 30% → 12% surface mix, Global's 46% → 30% with its
  overall opacity raised to 0.85 — the reference's clearly-visible faded
  band, with the bottom fade (and the mobile/dark toning) keeping the
  header's contrast.
- **The severity mapping bug (brief §5 — the round's named defect)** —
  `.ei-row-accent` hardcoded the Crisis red for flagged rows in BOTH
  regions, so a Stressed Australia wore red row edges. The accent now
  follows the region's own verdict step via the card article's
  `[data-ei-step]` → `--ei-accent` custom property (Critical → red,
  Stressed → the amber/orange stressed ink, Cautious → watch amber); the
  icon-less row's fallback triangle and the attention-count line speak the
  same region ink. Status and row presentation can no longer disagree.
- **Category summary rows (brief §7)** — the round-42 status-grouped boxes
  ("Stressed: … / Stable: …") become the reference's compact category
  rows: one quiet row per gauge — category label · small tinted state
  badge · the four-step mini meter (the reference's severity bar) — worst
  state first, unreadable gauges last in honest neutral, the module headed
  by the existing `heroGaugesLabel` + the verdict-rule tip.
- **The contextual explanation panel (brief §7)** — each regional card now
  closes with the reference's restrained tinted panel: Global carries the
  raised world signals (markets / currencies / section indicators — the
  existing module, now with a clear `worldSignalsTitle` heading on the
  pale-red surface; underline affordances dropped per the brief) and falls
  back to the word-choice rule when no feed has loaded; Australia carries
  the existing `verdictRuleLabel` + verdict-rule explanation on a pale
  amber surface. The tint follows the region's own step ink, never a
  saturated warning surface.

### Added

- **The bottom information strip (brief §7)** — `ContinueStrip`: the
  reference's compact footer strip under the hero, naming the page's next
  sections in their intended order (the JumpNav labels, hero excluded) and
  wired to the same expand-then-scroll navigation. Two new copy strings ×
  2 locales (`ui.worldSignalsTitle`, `ui.continueLabel`).

### Budgets

Insights lazy chunk 656.00/157.00 → **657.00/157.50** (measured
656.80/157.17; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the category rows + panels + strip are compressible JSX + 2 copy strings.
D-37 in `docs/DECISIONS_FOR_ALI.md`. Seven new regression guards in
`apps/web/src/components/insights/hero-editorial.test.tsx` (17 total).

## [2026-10-19] — the economic indicators hero becomes the editorial financial interface (the currena-hero.zip handoff round)

The owner's `currena-hero.zip` handoff package (approved visual references,
`spec/economic-indicators-ui-spec.md`, design tokens, Sydney Harbour + world-
map artwork — recorded in the repo as
`docs/insights/economic-indicators-editorial-spec.md`) reshapes the Insights
hero on `/#/insights`, presentation-only: every calculation, threshold,
ranking, aria hook, count and translated string is untouched (the new
carousel copy is the only addition, triaged in the Persian copy manifest).

### Added

- **The Global-first mobile swipe carousel (spec §10)** — below 768px the
  two overview cards become ONE horizontal scroll-snap track: Global first,
  swipe (or the localized cue / two `aria-current` dots / Previous-Next
  buttons / ← → Home End keys) to reach Australia. Both cards stay mounted,
  so each keeps its own expand/collapse state while swiped off-screen; the
  furniture is `md:hidden`, so the 768–1023px tablet keeps the calm stack
  and ≥1024px keeps the FIXED desktop placement (Australia left, Global
  right, both locales). Ten regression guards in
  `apps/web/src/components/insights/hero-editorial.test.tsx`.
- **The quiet art band (spec §7)** — the Sydney Harbour / Opera House
  artwork (12 KB WebP, from the handoff pack) behind the Australia card's
  header, an even fainter world-map texture (4 KB) behind the Global card:
  decorative `aria-hidden` layers under a surface-colored veil + bottom
  fade, toned further down in dark mode and on narrow cards. The artwork
  joins the PWA precache (`webp` added to `globPatterns`).
- **The editorial ink + severity pill (spec §4/§5)** — the region titles,
  the flagged rows' key values and the page title speak the navy print ink
  `--ei-navy` (#0F2D4A light / the existing light ink in dark); the
  verdict word + state artwork ride ONE compact tinted pill
  (`.ei-state-pill`, the same ink+tint pairing the StatusChips speak) with
  the four-step meter unchanged beside it; the hero-scoped grayscale
  filter (the 2026-10-18a scope trim) is retired — the new direction
  restores the restrained severity colors on the hero.
- **The flagged rows' editorial anatomy (spec §8)** — the indicator's own
  subject artwork leads in a soft neutral container (the alert triangle
  keeps the tier where the icon set deliberately has no artwork), the
  severity accent is the thin inline-start tier edge, and a directional
  drill-down chevron (`.ei-row-chevron`, mirrored in RTL) closes the row.
  The top-3 + "+n more" → "Show fewer" disclosure is byte-identical in
  behavior.

### Budgets

Insights lazy chunk 652.00/156.50 → **656.00/157.00** (measured
655.04/156.73; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the carousel controls + art band + pill + row anatomy + 10 copy strings ×
2 locales; the two artwork files ship as public assets, not JS. D-36 in
`docs/DECISIONS_FOR_ALI.md`.

## [2026-10-18 (2)] — the index wordmarks render at the owner-directed ≥96×96 px (deployed as worker 20b9549c)

The owner's follow-up directive on the freshly deployed briefing — "The
pictures of each indices are too small make them at least 96x96 pixel" —
raises every rendered index wordmark box to ≥96×96 px (the supplied JPEGs
are 256×256, so 96–112px renders stay sharp). UI-only: tiles 96 (STACKED
above the name — the explorer grid runs 2→7 narrow columns, so a 96px logo
beside the text would starve the canonical name; name bumped one type step
to `--type-label`), the featured movers 96 mobile / 112 desktop (the cards
are half/full-width, the horizontal identity row keeps its room; name at
1rem), the detail heading 96 beside the name block (name at
`--type-number`, the same logo + name + country anatomy every surface
wears). The white chip's corner radius is capped at 16px — the old /4
proportion would give a 24–28px radius on the big chips and read as a
pill; every pre-existing small-size rendering is unchanged. The heatmap
and the full table stay text-first (data-density views; no pictures to
resize). Two regression guards added (briefing.test.tsx): every rendered
logo box ≥96px on BOTH breakpoints, and the detail panel carries the same
≥96px wordmark. No copy changes (audit clean), no contract change, no
provider/cron/KV/route change. Budgets held (Insights 650.29/155.75 vs
652/156.50). Live-verified fa/EN desktop + mobile 390/320 (zero overflow,
zero console errors) — evidence:
`docs/insights/screenshots/world-indices-briefing/logo-96px/`.

## [2026-10-18] — the world stock indices section becomes the editorial market briefing «نبض بازارهای جهان» (the owner's world-indices handoff round; merged to main + deployed as worker b9a412e0 — see DEPLOY.md)

The owner's handoff package (`01-new-session-prompt.md`, `02-ui-spec.md`,
`03-agent-rules.md`, `ASSET-MAP.md` + 16 index wordmark JPEGs + a
non-authoritative style image) reshapes the World stock markets section on
`/#/insights` into an editorial market briefing, UI-only. The governing
spec records the round as §11 of `docs/specs/insights-world-markets.md`;
the copy decisions live in
`docs/localization/world-indices-copy-review.md`.

### Added

- **The editorial header (§3.1)** — «نبض بازارهای جهان» over the new
  descriptive label «شاخص‌های بورسی جهان», the §3.1 descriptor subtitle,
  and the «آخرین داده‌ها · پایان جلسهٔ معاملاتی» badge beside the as-of
  date ("live"/"real time" remains banned wording).
- **The breadth layer (§3.2)** — the summary card's selected-period
  up/down/flat strip («شاخص‌های مثبت / منفی / بدون تغییر») plus the
  separate below-52-week-high count line, both computed from RAW stored
  values in the new pure module
  `apps/web/src/components/insights/world-markets/briefing.ts`
  (`marketBreadth` reuses the section's ±1% flat band; `belowHighCount`
  reads `CORRECTION_PCT` from the markets config block — a −9.96% distance
  that displays as −10% is NOT counted).
- **The featured movers (§3.4)** — `world-markets/MarketMovers.tsx`:
  «بیشترین رشد» / «بیشترین افت» as true extrema of the selected period
  (`topMovers`: missing lens rows are never ranked as zero; no valid rows →
  the honest empty state, never a fake winner), each card carrying the
  logo, canonical name, country/market, signed return and the 52-week
  distance as secondary context.
- **The index wordmarks** — the 16 supplied 256×256 JPEGs ship as
  `apps/web/public/assets/markets/{marketId}.jpg` (named by canonical id so
  a file can never drift from its data row); `world-markets/MarketLogo.tsx`
  renders them in a standardized white chip (object-fit contain, hairline
  ring, initials fallback on load failure) — supplementary identifiers
  that never override the canonical names.
- **The desktop performance map (§3.6)** — `world-markets/MarketsHeatmap.tsx`
  behind a «فهرست»/«نقشهٔ عملکرد» switch (lg+ only; mobile keeps the
  readable list): EQUAL-AREA tiles (no weighting metric exists in the
  contract, so size never implies importance), the exact signed percentage
  + name + arrow on every tile, a visible zero-centred legend with the
  period-relative note (`heatmapScale` rounds the largest |raw return| up
  to a nice step, per period), keyboard/tap opening the same detail panel,
  and the list/table as the always-available textual alternative.
- **Country/market labels** — every index entry gained `country` in both
  dictionaries (16 × 2 strings; EURO STOXX 50 = «منطقهٔ یورو», Hang Seng =
  «هنگ‌کنگ» — market labels, not countries), shown on tiles, mover cards
  and the detail panel.

### Changed

- **The period control (§3.3)** — the view switch now offers EXACTLY the
  four horizons the stored contract carries: روزانه / هفتگی / ماهانه /
  سه‌ماهه. The "From 52-week high" lens was removed from the switch (the
  distance stays secondary context on tiles, mover cards and the table
  column), and the annual horizon is deliberately NOT offered: no
  `chg1y`/YTD field exists in `MarketEntrySchema` and the weekly series is
  chart-rounded, so deriving one would fabricate precision — the gap is
  recorded in spec §11.2 and closing it needs owner approval + a
  markets-worker contract change.
- **The explorer tiles (§3.5)** — each tile gained the logo + country
  identity row; region groups are semantic `<h3>`s with counts from the
  loaded dataset.
- **The summary card** — the round-44 verdict box now also carries the
  breadth strip + below-high line; the verdict anatomy, the §6.11 measure
  line, the hero count and the takeaway templates are unchanged.
- **Copy** — 38 new + 3 changed + 5 removed fa strings through the audit
  workflow (round `handoff-world-indices`, reference
  `docs/localization/world-indices-copy-review.md`; manifest 2,203, audit
  clean). Notably «سقف یک‌ساله» was kept over the handoff's suggested
  «سقف ۵۲هفته‌ای» (the repo terminology dictionary is the final authority),
  and the legend's «٪» glyph routes through the new shared
  `percentGlyph()` so no new hardcoded literal ships.

### Tests

- `world-markets/briefing.test.ts` — the closed lens list, breadth
  (incl. partial data + the ±1 band edges), the raw −10% threshold
  (incl. the −9.96% rounding boundary), top movers on
  positive/negative/mixed/partial/missing/single-valid data + tie order,
  the heatmap scale + tones, and cross-surface period consistency.
- `world-markets/briefing.test.tsx` — 17 rendered-section tests: the
  editorial header, the load states, period changes moving breadth +
  movers + tiles together, the honest dash + coverage note, the
  list/heatmap switch, and the fa/RTL rendering (Persian digits,
  dir-isolated Latin names, the verbatim owner-directed title).
- `markets-verdict.test.ts` updated for the copy-parity suite (incl. the
  no-annual-lens guard and the 16 country labels);
  `full-export.test.ts` re-pinned to the renamed export heading.

### Budget

- Insights lazy chunk consciously bumped **636.00/152.50 → 652.00/156.50**
  (measured 650.28/155.51; +14.37 kB raw / +3.51 kB gz — the new feature
  layer + ~108 strings × 2 locales; the 16 JPEGs are public assets, not
  chunk bytes). Entry chunk untouched (295.29/88.81 vs 296/89.5). D-35 in
  `docs/DECISIONS_FOR_ALI.md`.

### Not changed

Providers, crons, KV, the public read route, the §5.3 signal rules, hero
integration, the detail panel's 52-week chart, the full table, the CSV
exports; no deploy (the branch waits for the owner's review; the legacy
production Django app untouched).

## [2026-10-26e] — the repository root cleaned of misplaced specification markdown (owner cleanup work order)

The owner's minimal-cleanup work order: move the specification-related
Markdown out of the repo root into the EXISTING folders that already hold
their siblings, update every affected live reference, and touch nothing
else. Docs-only: zero code, zero copy, zero behavior change; both moves
are byte-identical git renames (R100 — the contents are preserved
exactly, no rewrite/merge/delete). Rationale recorded as D-34.

### Changed — two files moved, two live references updated

- **`economic-indicators-ui-spec.md` →
  `docs/insights/economic-indicators-ui-spec.md`.** The Economic
  Indicators page UI/UX specification joins its own lineage in
  `docs/insights/` — the sibling UI specs (`02-page-design-spec.md`,
  `06-ux-round-2-spec.md`, `gold-balance-card-spec.md`) and its
  companion record `economic-indicators-verification-notes.md`, whose
  header now points at the new path instead of claiming the repo root.
  NOT `docs/specs/` — that folder is the governing world-currencies /
  world-markets data-spec lineage per AGENTS.md's docs map.
- **`REMAINING_WORK.md` → `docs/REMAINING_WORK.md`.** The CLOSED
  (2026-10-15c) follow-up work order moves in with its process-doc
  siblings (`BACKLOG.md`, `NEXT_SESSION_PROMPT.md`, `PROGRESS.md`,
  `SESSION_LOG.md`); the README docs-map pointer now reads
  `docs/REMAINING_WORK.md`. Its own internal references are
  repo-root-relative prose paths, which remain valid from `docs/`.
- **Left exactly as-is (deliberate, minimal diff):** `README.md`,
  `AGENTS.md`, `CHANGELOG.md` (essential root files per the work
  order); the bare-name spec citations in code comments
  (`VerdictMeter.tsx`, `HeroBlock.tsx`, `ToolsMenu.tsx`,
  `apps/web/src/index.css`, `scripts/check-bundle-budget.mjs` — no
  path, name unchanged, grep-resolvable, so no app-code churn); the
  historical session/decision/changelog records (DEPLOY.md headings,
  D-28, the 2026-10-15 CHANGELOG/PROGRESS rows — records of past
  events, not live pointers); `financial-asset-cards-spec-pack.zip`
  (not a Markdown file and not a supporting asset of the moved specs —
  outside the work order's `.md` scope); `vite-dev.log` (untracked
  local artifact). The root now holds only `README.md`, `AGENTS.md`,
  `CHANGELOG.md` and application configuration. No Markdown-link form
  (`](…)`) references either file anywhere in the tree (audited), so
  nothing else can 404. Pre-existing staleness observed and NOT
  touched (out of scope): `docs/insights/CURRENT_STATE_REPORT.md`
  claims `FIX_REPORT.md` sits at "repo root" (it lives in
  `docs/insights/`).

## [2026-10-26d] — the gold balance rotates ONLY its beam, and visualizes weight (Iteration-5 addendum: v7)

The owner's Iteration-5 addendum supersedes the earlier pan-rotation,
tilt/motion and tile-content rules: "Rotate the beam only, and
visualize weight". The scoring model, the data and the Persian copy
are untouched (the net/total ratio law is byte-identical); only its
PRESENTATION scale changes (max 8° at the model's full range, floor
2° for any valid directional result, exactly 0° for neutral and for
unavailable). Strictly scoped to the balance component + the gauge
copy key.

### Changed

- **Exactly ONE rotating element (BalanceScale.tsx)** — the beam
  group (tapered bar + accent beads + pivot ring + needle) rotates by
  `rotate(θ, pivotX, pivotY)` about the pivot. The v6 CSS-calc stage
  (`--t`/`--s`/`--drop-*`/`25cqw × sin()` + the 0.2×θ pan tilt) is
  retired: the mechanical drawing is now an SVG layer whose hangers
  are recomputed EVERY FRAME as straight lines from each side's
  beam-end joint (cx ± (L/2)·cos θ, cy ± (L/2)·sin θ) to the pan's
  two fixed rim corners. The pans move by `translate(0, dy)` ONLY —
  exactly their joint's vertical displacement, so they hang plumb;
  their rotation is exactly 0°, and tiles/text/icons/pills are never
  rotated, skewed or scaled.
- **ONE animated value in JS (the Odometer's rAF pattern)** — a
  single θ state drives the beam rotation, joint positions, pan
  translations and hanger endpoints in the SAME render frame (no CSS
  transitions on any element, so nothing can desync and detach). The
  SSR/first paint already carries the verdict angle; a changed
  verdict settles over ~500 ms ease-out cubic; reduced-motion users
  land immediately. The stage width is measured pre-paint + via
  ResizeObserver so the whole drawing scales as one piece; the
  vertical travel stays inside the fixed reserved envelope
  (160 × sin 8° ≈ 22.27px at the 640 design width — asserted in
  tests).
- **The pointer-needle gauge (addendum §B)** — a slim needle fixed to
  the beam's pivot, pointing downward and rotating with the beam,
  read against a small FIXED arc scale with THREE ticks only (adverse
  end · centre · supportive end, labelled by verdict — a rigid
  down-needle swings opposite the heavy pan, so the tick the needle
  reaches when a side is heavy names that side; no numeric labels, no
  fabricated thresholds). The needle hides when the state is
  unavailable. The whole drawing is one `role="img"` whose label is
  the needle's text equivalent — `gaugeAria`, round-52, one new copy
  key × 2 locales + QA record + manifest entry.
- **Weight visuals, honestly scoped** — the model audit found: a net
  score EXISTS (count-based: net = for − against), but there are NO
  per-side weighted totals and NO per-factor weights. Therefore the
  side-load bar and the per-tile weight marker are deliberately NOT
  implemented (the addendum forbids fabricating them); the beam angle
  (from the net ratio) and the needle are the only weight read-outs.
- **The v4 keystone is retired** — the addendum's rotating pivot ring
  + downward needle + fixed arc replace the static hub-and-keystone
  mark (the needle's mandated path runs exactly through where the
  keystone sat).
- **balance.test.tsx rewritten (45 tests)** — the angle law on the
  new scale (floor 2°, max 8°, the 1-vs-4 and 5-vs-5 count-vs-weight
  fixtures); the pure `balanceStageGeometry()`/`balanceGaugeGeometry()`
  contracts (plumb drops, θ-free rim x, joint = rotated beam end,
  envelope ≤ 160×sin 8°, stage heights reserve the stack + swing, RTL
  visual-sign flip with direction-free drops); rendered structure
  with the addendum-§A audit (ONLY the beam group carries rotate; the
  two assemblies carry `translate(0px, Npx)`; tiles/hangers/rings/
  text carry NOTHING), hanger endpoints == the pure geometry, needle
  hidden for 'none', the gauge aria in both locales, the target-change
  landing, and all v6 behaviour tests kept (capacity, pills, empty
  pans, interactions, order, integration).

### Verified (addendum §C)

- DOM audit at every fixture: exactly 3 transformed elements (beam
  group rotate + 2 assemblies translate-only); attach error 0.000px
  at θ = 0°, 2°, 5.71°, 8° and at 390/768/1366 × en/fa.
- Mid-animation probe (D→E settle, 49 rAF samples): 0 violations —
  pan drop == joint Δy and rim == pan top + drop on EVERY frame.
- Fixtures: 1-vs-4 → 4.8° (count settles it — the model has no
  weights); 5-vs-5 → 0° "Balanced"; 5-vs-0 → the 8° maximum; all
  unread → 0°, «فعلاً قابل ارزیابی نیست», needle hidden.
- Tile text 12.48px (≥ 12px), horizontal, fa-RTL + en-LTR at
  1366/768/390; zero horizontal overflow at 390.
- Gates: typecheck 6/6; 1,534 tests green; lint 0 errors/15 accepted
  advisories; copy:audit clean (2,170 entries); build + budgets —
  Insights 635.18/152.06 vs the bumped 636/152.50 (D-33), entry
  chunk untouched 295.29/88.81. Merged-tree re-gate with the parallel
  2026-10-26c sidebar round: 1,536 tests green, the lazy chunk
  measures 635.91/152.00 — still inside the bump, no further bump.

## [2026-10-26c] — the asset cards' details move to the side panel (owner directive)

The owner's directive — "The more details must show up in side bar" —
relocates the «جزئیات بیشتر» surface: the five detail sections that used
to expand INLINE inside each asset card now render inside the F5 DETAILS
SIDE PANEL (desktop: inline-end sheet, RTL: start sheet, phones: bottom
sheet). Clicking «جزئیات بیشتر» opens the panel (the same dialog the
whole-card click-through opens) with the sections directly under the
card facts — the card itself NEVER expands, so the four-tile grid stays
compact and stable, and the details inherit the panel's focus trap,
Escape, scrim, scroll lock and focus-return for free. No section content
changed: the five sections (A تغییرات قیمت … E منبع داده و زمان
به‌روزرسانی) render byte-identical reviewed copy, from the same data
paths.

### Changed

- **PricesBoard.tsx** — the per-card disclosure (open state,
  aria-expanded/aria-controls, the inline panel div and ~140 lines of
  section markup) is GONE; the «جزئیات بیشتر» button now calls
  `onFocusCard(id, trigger)` (aria-haspopup="dialog", the panel-side
  affordance PanelRight/PanelLeft by locale). The tile slims to the
  collapsed-card facts (trend, daily change, briefing) — all
  panel-only computations moved out.
- **PriceDetails.tsx (new)** — the five sections as a self-contained
  `PriceDetailsSections` component: the shared atoms (ChangeValue,
  PanelSection, DetailRow, NoteLine, formatPriceRange, formatUpdatedAt)
  relocated from PricesBoard, plus `usePricePanelData` — the same
  module-cached history fetch the sparkline and the panel chart use
  (one request, three consumers), keyed by id so a panel that switches
  readings never shows stale stats.
- **DetailsPanel.tsx** — accepts `readings` (the snapshot's full
  readings, for the companion lines) and renders `PriceDetailsSections`
  for the four price rows directly under CardFacts; the panel HEADER now
  carries the card's verified title (priceCardTitles — "Gold price", not
  the registry's legacy "Gold price (ounce)") so the sidebar and the card
  describe the asset identically. Insights.tsx passes the readings.
- **Copy** — `lessDetails` («نمایش کمتر») retired from BOTH dictionaries
  + its manifest entry deleted (the disclosure's collapse label is gone
  with the disclosure; the panel's close affordance replaces it). The `٪`
  technical entry re-homed PricesBoard → PriceDetails with the code it
  terminates. Round-52 triage:
  docs/QA/quirks-2026-10-26c-asset-cards-sidebar.md. `moreDetails`
  («جزئیات بیشتر») stays the button's label.

### Tests

- prices-cards.test.tsx rewritten for the new behavior (+2 net): the
  board tests assert «جزئیات بیشتر» calls onFocusCard with the id + the
  trigger element and that NO sections render on the cards (en + fa);
  the section/coverage/methodology-guard tests now render DetailsPanel
  (the real surface) — all five sections, the «تا» range, the 10-year
  record, the served-attribution notes, the no-methodology guards in
  both locales, and the non-price-indicator negative case. 13 tests in
  the battery (was 11).

Gates: typecheck 6/6; lint 0 errors/15 accepted advisories (unchanged —
the panel-data hook is keyed, not sync-reset); 1,522 tests green (web
550); `copy:audit` clean (2,167 entries); web build OK; budgets held
(Insights 629.41/150.53 vs 630/151; entry 295.29/88.81 untouched).
Verified on the production build + real API (:4173 harness): EN 1280 —
the panel opens on the right (440px, flush inline-end) with the five
sections under the facts, heading "Gold price", focus trapped, body
scroll locked, Escape closes and focus RETURNS to the trigger; fa RTL —
«قیمت طلا» heading, the five Persian sections, sheet flush LEFT, caret
probes prove the range reads «۳٬۹۶۱ تا ۵٬۳۱۸ دلار» (right=۳٬۹۶۱ /
center=تا / left=دلار); mobile 375 — bottom sheet full-width, no
horizontal overflow, scrim click closes; the four tiles stay compact
(zero h4 inside the cards); zero console errors.

*(Rebased over the parallel balance-v6 round `2f9f4e6` — the balance
component's pans re-composition rides beneath; no file overlap beyond
the shared changelog/manifest prepend.)*

**Deployed**: pushed as 99742c2 (rebased over the parallel balance-v6
round) and live on currena-api worker `6adfb632` (SITE_MODE=public,
bindings/cron unchanged; currena-markets untouched); serves
index-gB3_zV9f.js + Insights-DW1SDXvu.js — the fresh build's exact
filenames, live on both currena.ir and workers.dev. Live-verified:
EN desktop — the right sheet opens with the five sections under the
facts, focus trapped, Escape closes and focus returns to the trigger;
fa RTL — «قیمت طلا», the five Persian sections, the sheet flush LEFT;
mobile 375 fa — bottom sheet, no overflow; zero console errors. Deploy
record: docs/DEPLOY.md §CURRENT DEPLOYMENT; live captures in
docs/evidence/2026-10-26c-asset-cards-sidebar/.

## [2026-10-26] — the gold balance's factors REST ON real pans (Iteration 4: the balance becomes a connected weighing machine)

The owner's Iteration-4 directive: the latest v5 composition (factor
columns above an abstract beam with colored endpoint dots) "does not
convincingly communicate that the factors are the loads causing the
balance to tilt". The required result: real weighing pans attached to
the beam ends with the factor items visibly supported by the pan
surfaces, while preserving the editorial financial-dashboard aesthetic.
Strictly scoped to the balance component, its factor lists, the
aggregate summary and the supporting copy — no page layout, token,
other-card or model change. The tilt law (|net|/total × 12°, 4° floor,
level at net 0 and at readable 0) is byte-identical; the NUMBER of
tiles never sets the tilt, only the documented net/total ratio does.

### Changed

- **The drawing (BalanceScale.tsx)** — one fixed-height CSS stage
  (240px ≥ sm / 260px below, max-w-[640px]) replacing the 520×88 SVG:
  a weightier tapered beam (12px mid, rotating about the compact
  hub-and-keystone pivot), accent beads terminating the beam ends, TWO
  thin suspension lines per side splaying from the bead down to the
  pan's top edge (with tiny junction "ring" dots), and a SHALLOW
  RIMMED PAN per side (1.5px rim, 3px floor edge in the darker ink, an
  inner wall line for tray thickness, soft surface tint, drop shadow).
  The pans HANG at a fixed distance below their beam ends and are
  rigid parts of one translating assembly.
- **Physical coherence, pure CSS** — the beam rotates by the model's
  angle θ (`--s`, RTL-sign-flipped), and each pan assembly translates
  by EXACTLY its bead's drop — `25cqw × sin(--t)` (25cqw = Lh ÷ 2 by
  construction, the beam spans half the stage; `--t` is the
  direction-free physical sign) — and tilts by a restrained
  0.2 × θ (≤ 2.4° at the 12° maximum) about its hang point. Measured
  on the harness: the pan-pair and bead-pair height differences are
  byte-equal (22.32px = 320×sin 4° at case A; 66.53px = 320×sin 12° at
  case E) at every angle. No ResizeObserver, no runtime measurement; a
  browser without CSS `sin()` degrades to the level state (never a
  wrong direction).
- **The factor tiles rest ON the pans** — compact buttons (icon + full
  short label, never truncated + the value where space permits) sit
  bottom-aligned on the pan's floor with a contact shadow, gapped, in
  a fixed-height pan: they read as the loads. Each tap opens the shared
  detail panel. The full-width v5 factor columns above the beam are
  retired.
- **Capacity + overflow (v6 rule 3)** — each pan shows its first
  BALANCE_PAN_CAPACITY (2) tiles; the rest are counted by a "+{n}
  more" pill hanging just under the pan (inside the translating
  assembly, clearly attached to its side, deliberately NOT on the pan
  surface so it can never read as another load or a fabricated
  weight). The pill expands the side's full row list below the
  assessment ("Show fewer" collapses); an empty side shows its full
  evidence-based line WITHOUT any disclosure. Nothing is silently
  omitted; the model still sees every driver; the stage's geometry
  never depends on any count (regression-tested).
- **Empty pans are deliberate (v6 rule 2)** — an empty side keeps its
  COMPLETE pan (hangers, rim, floor) with a minimal muted marker
  inside: `panEmpty` ("No qualifying signals" / «نشانهٔ معتبری نیست»)
  when the evaluation ran, the distinct `panUnreadable` ("Nothing to
  weigh yet" / «هنوز چیزی برای سنجیدن نیست») when nothing could be
  read (readable 0). The five-state semantics of v4 are unchanged.
- **RTL** — the pan columns, captions and list sections mirror via
  CSS-grid direction; the for-bead uses `inset-inline-start` so it
  always terminates the beam end above the for-pan; the beam's visual
  rotation sign flips in JS (`--s`) while the physical drop sign
  (`--t`) stays direction-free. Nothing mirrors text.
- **Copy (round-51, QA record docs/QA/quirks-2026-10-26-balance-v6-fa-copy.md)** —
  2 NEW keys (`panEmpty`, `panUnreadable`) in both locales; all other
  strings byte-identical to round-50. Manifest 2,152 → 2,154 entries,
  audit clean.

### Budget

- The v6 round measured 631.01/150.80 alone (raw +4.01 kB, gz +0.80 kB
  over v5's 627.00/150.00 — the honest price of the directive's
  mandated markup; the entry chunk untouched at 295.29/88.81). Push
  time found the PARALLEL 2026-10-25b asset-cards-polish round on
  origin (629.04/150.69 from the same base) — the merged tree measures
  634.57/151.67 vs the bumped 635.00/152.00 (both rounds' bumps ride
  in scripts/check-bundle-budget.mjs). Justified here and in D-32
  (docs/DECISIONS_FOR_ALI.md).

### Verified

- balance.test.tsx rewritten for v6 (30 tests): the §4/§6/§13 logic
  suites byte-identical (the tilt law, the counts, the verdict words)
  + signedTiltDeg, the rendered structure, the pan-drop CSS law, the
  capacity/overflow disclosure, the distinct empty/unreadable pans,
  the RTL sign split, the no-text-mirror source guarantee, the order,
  the interactions (tile/row/chip → one shared panel; the pill
  expansion) and the merged-card integration.
- On the (temporary, deleted) harness: cases A–H × en/fa ×
  1280/360/320, both themes — pan/bead sync measured exact, zero
  horizontal overflow (320px included), keyboard Enter opens the
  panel, zero console errors, VLM scenario review all pass
  ("coherent machine", "factors clearly read as physical loads";
  its "steepen the tilt / shrink the empty pan" suggestions declined —
  the owner's model and fixed-geometry rules).
- Gates: typecheck 6/6; 1,505 tests (web 533); lint 0 errors / the
  15 accepted advisories; copy:audit clean (2,154); bundle budgets
  held (documented bump above).
- Evidence: docs/insights/screenshots/gold-balance/v6/ (a before/after
  comparison, the full scenario sweep, the interaction captures, dark
  + mobile sets) + README; notes §v6 in
  docs/insights/gold-balance-card-notes.md.

## [2026-10-26b] — the asset cards drop the «دربارهٔ این اعداد» methodology note (owner directive)

A one-scope removal, requested verbatim by the owner after reviewing the
2026-10-25b polish: the sixth expanded-detail section — the heading
«دربارهٔ این اعداد» ("About these numbers") and its three-sentence
methodology body (the shared seven-day window, the daily-change basis, the
no-fabrication rule) — no longer renders on the asset cards. The panel now
carries the five data sections A–E (تغییرات قیمت / محدودهٔ قیمت در ۵۲
هفتهٔ گذشته / سوابق تاریخی قیمت / جایگاه قیمت نسبت به شاخص‌های مرجع /
منبع داده و زمان به‌روزرسانی). The methodology ITSELF is untouched — the
window semantics live in `price-trend.ts` / `price-stats.ts` and stay
documented in the code comments and QA docs; only the on-card disclosure of
it is gone.

### Removed

- **PricesBoard.tsx** — the section F `<PanelSection>` block and its
  header-comment map entry (the comment now carries this round's tag so the
  removal stays traceable where the section used to be described); the rest
  of the component — all five sections, the collapsed card, the conditional
  coverage notes — is untouched.
- **Copy** — `aboutNumbersLabel` / `aboutNumbersBody` deleted from BOTH
  dictionaries (en "About these numbers…" / fa «دربارهٔ این اعداد…»), and
  the two matching entries deleted from
  `docs/localization/persian-copy-manifest.json` in the same commit, per
  the copy workflow's removal rule (manifest 2,170 → 2,168 entries;
  `copy:audit` clean).
- **prices-cards.test.tsx** — the section-F assertion is replaced with
  removal guards in BOTH locales (`queryByText('About these numbers')` and
  `queryByText('دربارهٔ این اعداد')` must both stay null), so the removal
  itself is now a tested behaviour; the A–F labels in the file updated to
  A–E. Still 11 tests in the battery.

Gates: typecheck 6/6; lint 0 errors (15 accepted advisories, unchanged);
1,520 tests green; `copy:audit` clean (2,168 entries); web build OK; bundle
budgets held — the removed copy shrinks the Insights chunk ~1.2 kB
(628.67 kB / 150.59 kB gz vs the 630/151 budget; entry chunk untouched at
295.29/88.81).

**Deployed**: pushed as 648f5aa (no rebase — main had not advanced) and
live on currena-api worker `f9571a79` (SITE_MODE=public, bindings/cron
unchanged; currena-markets untouched); serves index-CKqYpOMM.js +
Insights-7kn32ZoI.js — the fresh build's exact filenames. Live-verified on
currena.ir + workers.dev: en + fa RTL expanded cards show EXACTLY the
five sections with zero occurrences of the removed heading in either
locale, the last section paints inside the tile (element-from-point
probe), mobile 375 no overflow, zero console errors. Deploy record:
docs/DEPLOY.md §CURRENT DEPLOYMENT; evidence
docs/evidence/2026-10-26b-remove-methodology-note/ (sandbox + live).

## [2026-10-26] — the gold balance re-composed to the owner's wireframe reference (factors above, beam beneath)

The owner supplied a hand-drawn reference board
(`docs/ui-reference/gold-silver-balance-target-wireframe.png`, also delivered
via upload) with the target composition: a concise heading + subtitle, the
TWO OPPOSING FACTOR GROUPS at the top (supportive vs adverse columns), a
simplified abstract balance centred BENEATH both groups with its endpoints
visually corresponding to the columns, a compact aggregate assessment under
the illustration, progressive disclosure for additional factors, and a mobile
adaptation preserving the same hierarchy. Strictly scoped to the balance
component and its factor lists — no page, provider, scoring, data or
unrelated-card change. The tilt law (|net|/total × 12°, 4° floor, level at
net 0 and at readable 0) is untouched; no weight, threshold or angle was
invented to imitate the sketch's example tilt.

### Changed

- **The composition (BalanceScale.tsx)** — the wireframe's vertical order:
  the concept's heading + subtitle now lead into the TWO FACTOR COLUMNS
  (side by side ≥ `sm:`, stacked below, DOM order for → against = tab
  order), the abstract editorial beam sits BENEATH them sharing the same
  max-w-[640px] footprint, and the aggregate assessment follows directly
  under the drawing. The v4 order (illustration first, lists beneath it,
  divider-separated verdict at the end) is retired. The beam keeps v4's
  abstract mark — one tapered beam, compact hub + 13u keystone pivot,
  accent endpoint beads, dotted level reference — with the arm re-proportioned
  so the beads sit exactly under the two columns' centres (Lh 336u → 260u =
  25%/75% of the footprint; the canvas 520×104 → 520×88; the ANGLE law is
  byte-identical, only the drawn arm is shorter).
- **Progressive disclosure per column (new, the reference's "view all
  factors")** — each column reveals its first 3 rows (BALANCE_LIST_REVEAL =
  3, the attention-tile convention); beyond that a "+{n} more" pill expands
  the list, "Show fewer" collapses it back — reusing the site's existing
  copy keys (`ui.attentionTileMore` / `ui.showFewer`) and the tiles' pill
  anatomy (`aria-expanded` + `aria-controls` → the column). Neither the row
  count nor the disclosure state can affect the illustration: the zone's
  SVG is byte-identical across 1/2/6-row cases and across expansion
  (regression-tested).
- **The aggregate assessment (the reference's conclusion box)** — the
  verdict word + icon (now in the question voice, the box's focal line),
  the count line, and the C12 banner ride together in ONE compact, centred,
  soft box (bg-currena-soft/60, max-w-440) directly beneath the drawing —
  replacing v4's divider-separated block.
- **The empty side (the reference's deliberate empty states)** — the
  evidence-based line now sits in the same soft tint block (no ring, no
  dashed border — never a placeholder slot), keeping the column's visual
  presence when its opposite carries rows. The five-state semantics
  (no-qualifying-factors vs insufficient vs unavailable vs mixed vs valid)
  are unchanged, as are all their Persian/English strings — zero copy
  changes, zero manifest entries, audit clean.

### Kept (explicitly verified)

- The tilt follows the real model only: supportive dominance lowers the
  supportive bead, adverse lowers the adverse, balanced and
  nothing-readable stay level (all five states regression-tested; the
  harness cases A–E/G/H re-verified by measurement: bead Δy = Lh×sin(angle)
  with 0.0u diff at 1280 and 360).
- RTL mirrors the whole SVG with one scaleX(-1): the for column and its
  bead both land on the inline-end (right) side in fa, the visual rotation
  sign flips with the mirror, Persian digits and the bidi islands render
  correctly (DOM-measured on the harness at 1280; mobile 360 fa captured).
- Rows stay real buttons with aria-expanded + the shared detail panel (one
  open at a time); trays keep the neutral/unread distinction; keyboard
  focus + Enter verified; no horizontal overflow at 320/360/768/1280.

### Budget

- Insights lazy chunk: 626.27/149.92 vs budgets 627.00/150.00 — the raw
  budget bumped +0.27 kB (626.00 → 627.00, gz HELD) for the per-column
  disclosure pills + the assessment box; documented in
  `scripts/check-bundle-budget.mjs` and D-31. Entry chunk untouched
  (295.29/88.81 vs 296/89.5).

### Gates

- typecheck 6/6 packages; 1,506 tests (web 534 — the balance suite now 31:
  the v4 assertions re-pinned to the wireframe order + new
  progressive-disclosure tests; insights 463; api 238; core 191; scraper
  67; markets 13); lint 0 errors / 15 accepted advisories; copy:audit
  clean (zero new strings — the disclosure reuses reviewed keys);
  build + bundle budgets held. Visual loop: baseline (v4) captured →
  implementation → desktop/mobile/dark/RTL captures → VLM design +
  scenario critique rounds → refinements (the empty-state tint block, the
  verdict-word hierarchy, the pill-class dedupe) → final pass clean
  ("professional editorial data visualization", all tilt/empty/RTL states
  verified). Evidence: `docs/insights/screenshots/gold-balance/v5-iteration/`
  (24 captures + README).
## [2026-10-25b] — the asset-cards polish round: editorial hierarchy, one-line prices, honest instrument notes

The owner's polish task: make the four financial asset cards feel like
a premium editorial financial publication — strictly scoped to the
cards and their supporting copy; no page, provider, scoring or routing
change; every working calculation preserved.

### Changed

- **The asset header** — the icon vertically centred against a title
  block: the plain title («قیمت طلا» / "Gold price", 18px semibold)
  over a measurement-basis subtitle («هر اونس تروی» / "per troy
  ounce", 13px secondary). The unit left the title ("Gold price
  (ounce)" retired); the four units verified against the served
  instruments (gold/silver per troy ounce — XAU/XAG spot and the
  GC=F/SI=F live refresh both quote per troy ounce; Brent per barrel;
  Bitcoin per coin).
- **The one-line price (the owner's required correction)** — the
  number (28px bold tabular) and its currency share ONE baseline
  («۴٬۱۶۶ دلار» / "US$4,166") via the new pure `priceValueParts`
  display helper; each part an isolated `<bdi>` so a direction change
  can never split or reorder them. The old two-line block (digits,
  then «دلار» beneath) is gone.
- **The expanded panel reorganised into six semantic sections** —
  تغییرات قیمت (one «X گذشته» label family: «هفت روز گذشته / ۳۰ روز
  گذشته / ۹۰ روز گذشته / ۶ ماه گذشته / ۱ سال گذشته») → محدودهٔ قیمت در
  ۵۲ هفتهٔ گذشته («۳٬۹۶۱ تا ۵٬۳۱۸ دلار», «تا» BETWEEN the endpoints,
  rendered in the locale's own direction) → سوابق تاریخی قیمت →
  جایگاه قیمت نسبت به شاخص‌های مرجع (10-year level + note, 200-day
  gap, distance from the 10-year high, companion ratios — Bitcoin's
  two metal ratios now ONE sentence; fa's second ratio was a
  fragment) → منبع داده و زمان به‌روزرسانی (attribution link,
  observation date vs the app's fetch time, coverage notes) →
  دربارهٔ این اعداد. Section headings drop the latin-only
  uppercase/letter-spacing in fa (tracking visually separates joined
  Persian script).

### Fixed (data corrections, verified against the implementation)

- **The futures note no longer lies on spot prices** — it rendered
  unconditionally on gold/silver/oil while the served EOD snapshot is
  gold-api XAU/XAG SPOT. It now shows ONLY when the served
  attribution actually is the futures quote (the serve-time live
  merge rewrites `sourceName` to the Yahoo GC=F/SI=F/BZ=F attribution
  when a fresher quote wins). Brent's EOD attribution (EIA spot ∪
  BZ=F gap-fill) gets its own accurate blend note.
- **The record label no longer claims all-time coverage** —
  «بیشترین مقدار تاریخی» / "Historical high" became «بیشترین قیمت ۱۰
  سال اخیر» / "10-year high": `computePeaks` reads the 10-YEAR window
  (Brent's own series is explicitly capped to it).

### Tests & gates

- +14 tests (prices-cards.test.tsx: header/one-line price/sections/
  bidi range/conditional notes/disclosure; price-value-parts.test.ts).
- typecheck 6/6; lint 0 errors/15 accepted advisories; 1,520 green;
  copy:audit clean (round-51: 18 new + 5 relabelled strings triaged
  against docs/QA/quirks-2026-10-25b-asset-cards-polish.md); build OK;
  Insights budget consciously bumped 626/150 → 630/151 (measured
  629.04/150.69 — bilingual copy + panel structure; entry untouched).
- Verified on the production build + real production API (harness):
  layout/bidi caret probes (the fa range reads exactly «۳٬۹۶۱ تا
  ۵٬۳۱۸ دلار», U+066C separators), en+fa, 1280/768/375/320, dark,
  keyboard, click-through, zero console errors. Evidence:
  `docs/evidence/2026-10-25b-asset-cards-polish/` (before/after).
- Rebase note: authored against the 2026-10-24d deploy (cc6f28e6) and
  rebased over the 2026-10-26 balance-v5 round (5f37014) before
  push/deploy; the v5 round touches BalanceScale/MergedCard/its tests
  only — PricesBoard and the copy keys are untouched there, and the
  budget script carries both rounds' justifications (627 by v5 → 630
  by this round).
- Deployed: pushed as db31745 → currena-api worker
  ead002b6-3c9e-4e9a-aae9-4535bb462f9f; re-verified LIVE on both
  currena.ir and the workers.dev domain (Insights-BMyE-MXL.js served;
  en + fa desktop and mobile 375: header/one-line price/six
  sections/range/record/conditional notes, no overflow, zero errors) —
  evidence `docs/evidence/2026-10-25b-asset-cards-polish/LIVE-*.png`,
  deploy record in `docs/DEPLOY.md` §CURRENT DEPLOYMENT.

## [2026-10-25] — the gold balance becomes the abstract editorial mark «برآیند عوامل مؤثر بر قیمت طلا» (owner Iteration-2 directive)

The owner reviewed the deployed v3 classic hanging-pan balance ("a literal
weighing scale with suspended bowls, wires, and a tall central column … not
the desired visual direction") and directed the earlier, simpler concept: an
abstract, restrained, editorial visualization. Strictly scoped to the
gold/silver balance component and its factor lists — no page, provider,
scoring, data or unrelated-card change. The tilt law (|net|/total × 12°,
4° floor, level at net 0 and readable 0) is untouched; no weight or threshold
was invented.

### Changed

- **The illustration (BalanceScale.tsx)** — ONE inline SVG in a flat 520×104
  viewBox: a refined slightly-weighted tapered beam (9u at the centre → 6u at
  the ends) rotating around a compact geometrically precise pivot (9u hub +
  surface pin dot + 13u keystone triangle — NO base bar, NO tall column),
  with subtle accent-coloured endpoint beads (green for / red against — the
  only colour in the drawing) and the dotted level reference through the
  pivot. The v3 machinery (pillar, plinth, chains, suspended pans, pan
  translations, the 252u-tall viewBox) is deleted; the geometry was reworked,
  not recoloured or resized. RTL stays one scaleX(-1) mirror; the 500 ms
  reduced-motion-aware tilt transition stays.
- **The hierarchy (Iteration-2 §3 order)** — the block now leads with the
  concept's own heading «برآیند عوامل مؤثر بر قیمت طلا» / "The aggregate of
  factors affecting the price of gold" (card-question voice) + a concise
  explanatory subtitle (caption voice), then the illustration, then the two
  side-labelled factor lists (now sharing the beam's max-w-520 footprint so
  each list sits under its side's half; stacking to one column below sm:),
  then the OVERALL ASSESSMENT at the end (verdict word + count line + the
  C12 banner where needed, divider-separated), then the shared detail panel
  and trays. The v1 "answer-first" verdict placement is retired by this
  directive's own ordering.
- **Side labels + empty-state copy (round-50)** — the list captions become
  «عوامل حمایتی از قیمت طلا» / "Factors supporting gold's price" and
  «عوامل فشارآور بر قیمت طلا» / "Factors pressuring gold's price"; the
  empty-side lines adopt the owner's suggested evidence-based wording, and a
  NEW distinct unavailable wording (`listEmptyNone`) renders on BOTH sides
  when nothing could be read — an absence of readings is never worded as an
  absence of pressure. QA record
  `docs/QA/quirks-2026-10-25-balance-v4-fa-copy.md`.
- **Tests (balance.test.tsx)** — rewritten for v4: the SVG part inventory
  (beam body, beads with side accent fills, hub, one-path fulcrum, the
  reference as the ONLY line), the heading/subtitle/order assertions, the
  unavailable-empty-state split (case D), the LTR-signed rotation (case C
  negative), the lists-footprint classes, the RTL mirror and the
  divider-separated assessment, on top of the unchanged §4/§6/§13 logic
  suites and the merged-card integration.

### Verified

- Browser (temporary harness, deleted before commit): the bead height
  difference equals Lh × sin(angle) with 0.0u diff on every case (A 4°,
  B/D/G level, E 12°, H −4°) at both 1280 and 360 (scale 0.5385); zero
  horizontal overflow at 360/1280 in en + fa; keyboard Enter opens/closes
  the shared panel; zero console errors on a fresh session; VLM design
  review passes on the reworked geometry ("refined in its restraint",
  "well-proportioned", "balanced and professional") with the tilt-angle and
  green/red-token suggestions declined (owner's model and tokens).
- Gates: typecheck 6/6; 1,486 tests; lint 0 errors / 15 accepted advisories;
  copy:audit clean (2,152 entries, round-50); bundle budgets held (entry
  295.29/88.81; Insights lazy 625.46/149.74 vs 626/150).
- Screenshots: `docs/insights/screenshots/gold-balance/` — the v4 battery
  (A/B/C/D/E/G/H × en/fa × 1280/360 + 768 + dark + the banner variant) and
  the before-v3 capture.
## [2026-10-24d] — the «جزئیات بیشتر» white-space fix (the owner's post-deploy report; rebased over the 2026-10-25 balance-v4 round)

The owner reported that on the LIVE deployment clicking «جزئیات بیشتر» /
"More details" produced "just a white space with no more extra detail", and
that the prices block and the markets (index) section below it read as
collided. Reproduced on production (worker 7b939901): the bug shipped with
2026-10-24c itself and the original session's expanded-state verification
relied on DOM/aria assertions while the pixels showed the white space —
both live evidence screenshots from that round show the defect.

### Fixed

- **Why the panel vanished** — the card-body click-through button carried
  `h-full` (height:100%). The tile `article` is a stretched grid item, so
  once the disclosure opened, the grid row grew to fit card+button+panel,
  the article stretched to the row, and the body button then resolved
  `h-full` against the FULL stretched article height — pushing the
  disclosure trigger and the expanded panel BELOW the tile's box. The
  panel kept its DOM/aria state (why aria-expanded checks passed) but
  painted under the following cards (mobile: Silver/Brent tiles) or under
  the markets section (desktop) — later DOM siblings paint on top —
  leaving ~690px of white space and, on desktop, the "collision" with the
  markets section.
- **The fix** — the article becomes `flex h-full flex-col` and the body
  button drops `h-full` and keeps `grow`: it now only fills the space the
  disclosure leaves it, so the trigger and panel stay INSIDE the tile and
  the tile grows naturally with the open panel (spec 02 §5 — never clip to
  force equal heights). Equal tile heights across the row are preserved
  (grid stretch + `grow`), so nothing else about the anatomy changes.
- **Prices ↔ markets breathing room** — the owner also asked for more
  space between the prices block and the markets section: the section
  gains `pb-3`, taking the card-to-section air from 28px to 40px (scoped
  to the prices section only; the page-wide 28px rhythm is untouched).

### Verified

- Production build + real API (the 4173 harness): desktop 1280 EN —
  expanded panel renders INSIDE the Gold tile (element-from-point probes
  hit the panel's own rows), Silver/Oil/Bitcoin un-overlapped, clean
  spacing to the markets section; mobile 375 — panel inside the tile,
  Silver 10px below the grown tile, no horizontal overflow; fa RTL —
  Persian rows render, 40px air to the markets section; collapsed —
  four equal tiles, no spill.
- Gates: typecheck 6/6, lint clean, web tests 533 green, copy:audit
  clean (no new copy), bundle budgets held (entry 295.29/88.82,
  Insights 624.64/149.59).
- Evidence: `docs/evidence/2026-10-24d-disclosure-overflow-fix/`.
- Rebase note: this round was authored against production 7b939901 and
  rebased over the 2026-10-25 gold-balance v4 round (29418f7) before
  push/deploy; the balance round touches BalanceScale/MergedCard/copy
  dictionaries only — PricesBoard is untouched there and this fix applies
  cleanly on top.
- Deployed: pushed as `c8e0741` → currena-api worker
  `cc6f28e6-76dc-405f-a6ba-5fa7fd6adc9b`; re-verified LIVE on both
  currena.ir and the workers.dev domain (panel paints on desktop +
  mobile × en/fa RTL, 40px card→markets air, no overflow, zero errors;
  post-rebase gates: typecheck 6/6, lint clean, 1,506 tests, copy:audit
  clean, budgets held) — evidence
  `docs/evidence/2026-10-24d-disclosure-overflow-fix/live/`, deploy
  record in `docs/DEPLOY.md` §CURRENT DEPLOYMENT.

## [2026-10-24c] — the prices board cards re-drawn from the financial-asset-cards spec pack (rebased onto round-46 main)

The owner supplied the `financial-asset-cards-spec-pack.zip` (8 Markdown specs,
repo root); this round implements it on the four asset cards ONLY — no
page-level, provider, scoring or routing change. Supersedes the 2026-10-17b
owner-sketch anatomy while PRESERVING every statistic it introduced
(secondary stats move behind the disclosure, nothing is deleted).

**Rebase note (2026-10-24c):** the spec-pack session ran 2026-10-22 against
the owner's uploaded snapshot (`f50e723`); before push/deploy it was rebased
onto main @ round 46 (`0e411e6`) — the markets-view/copy/manifest/budget
work of the concurrent sessions is preserved byte-for-byte, the copy keys,
manifest entries and budget bump merged on top. Asset order, anatomy and
behavior unchanged by the rebase.

### Changed

- **Card anatomy (spec 02 §2)** — identity row (compact icon + plain name) →
  dominant price with the unit in its own small secondary line → per-card
  "as of" freshness → THE SEVEN-DAY TREND as the primary movement story →
  daily change (explicitly labelled, vs the previous stored observation) →
  a deterministic hedged briefing → «جزئیات بیشتر» / "More details"
  disclosure. The card body stays the whole-surface click-through to the
  details panel (the full chart, rule and source live there); the
  disclosure is a separate sibling button (aria-expanded/aria-controls,
  keyboard + touch, focus retained, 44px target, motion-safe chevron flip).
- **Seven-day sparkline (specs 02 §6 / 04)** — new `PriceSparkline.tsx`
  (sibling of the shared Sparkline, which is untouched): day-based x
  positions so calendar gaps render honestly, neutral ink, ≥2.5% amplitude
  honesty pad, LTR in both locales, dashed <2-point state, aria-label
  (asset + window + signed change). Data: `price-trend.ts` `window7d()` over
  the same stored history endpoint the details panel charts fetch — the
  reference anchors at the last observation at-or-before (latest − 7 days)
  within the 3-day tolerance, the SAME convention as the API's `change7d`,
  so the chart and the percentage share boundaries. No window ⇒ an explicit
  "Seven-day trend unavailable" line — never a fabricated flat chart.
- **Documented trend classification (spec 04 §5)** — `classifyTrend()`:
  <4 points ⇒ insufficient; |net| < 1% ⇒ range (calm) or mixed (traveled
  path ≥ 3%); |net| ≥ 1% ⇒ up/down ONLY when the net ≥ 50% of the traveled
  range (a −1% week inside a ±3% chop is honestly "mixed", a dominant
  crash-and-bounce is honestly "down"). Thresholds are constants with
  rationale; 16 new unit tests pin them.
- **Evidence-based briefings (spec 03)** — `briefingText()` templates from
  the dictionaries: observed movement + an explicit horizon hedge; Bitcoin
  volatility-aware ("fluctuated" ONLY on a genuinely mixed window); oil
  gets the drivers-evidence caveat; stale readings qualify the summary with
  "Data may be delayed."; no causes, forecasts, probabilities or advice.
- **«بالا» clarified** — the bare position word left the card face; the
  metric it stood for (the reading's percentile inside its own 10-year
  history — a LEVEL, not a trend) stays in the expanded section as "Price
  level vs 10-year range: High — top 20% of the decade" plus a note that it
  describes a level, not a direction.
- **Expanded details (spec 02 §8)** — 7d/30d/90d/6m/1y changes, 52-week
  range, the clarified level, the record high with date + basis,
  from-record distance, 200-day gap (now with its % sign — the {pct}
  placeholder receives the locale percent glyph), futures note, gold A$
  companion, Bitcoin ratios, source + as-of, and an "About these numbers"
  method note.
- **Asset order (spec 02 §10)** — `PRICE_ROWS` is now Gold → Silver → Oil →
  Bitcoin (the spec default; no user-configurable ordering exists — the
  full-data export rides the same list and stays consistent).

### Added

- `apps/web/src/components/insights/price-trend.ts` + `price-trend.test.ts`
  (16 tests) — the pure window/classification/briefing module.
- `apps/web/src/components/insights/PriceSparkline.tsx`.
- 41 copy keys × 2 locales (trend states, briefing templates, disclosure,
  detail rows, failure states — wording verbatim from spec 03's tables);
  manifest round-49 → `docs/QA/quirks-2026-10-22-financial-asset-cards.md`.

### Budget

- Insights lazy chunk consciously bumped on top of the round-46 line
  609.00/145.60 → 626.00/150.00 (measured on rebased main 624.65 kB raw /
  149.59 kB gz): the day-spaced sparkline + trend module + disclosure +
  82 locale strings the spec demands. Entry chunk untouched (295.29/88.82
  vs 296/89.5).

### Gates (re-verified on the rebased tree, main @ 0e411e6 + this commit)

- copy:audit clean (2,147 — the 41 spec-pack strings triaged round-49 +
  the ma200 ٪ glyph as a technical entry); 1,505 tests green (+16
  price-trend; web 533); typecheck 6/6; lint 0 errors/15 advisories;
  budgets held.
- Browser-verified against the production API (fresh profile, SW purged —
  the repo's own procedure): EN+fa × desktop/tablet-768/mobile-375/320,
  light+dark, disclosure keyboard-toggle (Enter, aria-expanded, focus
  retained), details-panel click-through preserved, no horizontal overflow,
  zero console errors.
- **Deployed** currena-api `6d6e1300-9af8-42fe-b42e-bd73ee865211` from
  `d952983` (pushed to main); live-served `Insights-DgGMrELI.js` sha256
  `fdd478e7…` byte-identical to the fresh build; live re-verified on
  currena-api.sedanama-ir.workers.dev AND currena.ir (4 cards in spec
  order, disclosure round-trip, fa RTL, 375 no overflow, zero errors) —
  evidence `docs/evidence/2026-10-24c-financial-asset-cards/LIVE-*.png`,
  deploy record in `docs/DEPLOY.md` §CURRENT DEPLOYMENT.

## [2026-10-24b] — the market view switch grows the weekly and monthly lenses (round 46)

The owner: *"Ok now they're back add monthly and weekly views of how
percentages changed as well. I mean for here: [the Insights page's market
view switch radiogroup]"* — the section's lens switch offered Today / 3
months / From 52-week high; round 46 adds the two missing durations.

### What changed

- **`chg1w` joins the contract** (`MarketEntry`, OPTIONAL like `chg1m`):
  last close vs the last close on/before the same date one week earlier —
  the same rolling-anchor rule chg1m (−30d) and chg3m (−90d) use. A stored
  row without it renders the honest dash (—), never a guess; `chg1m`
  (already live for the currencies rules) now also serves the monthly lens.
- **The view switch** reads **Today | 1 week | 1 month | 3 months | From
  52-week high** — ascending duration, the 52-week distance last; the
  default stays the NORMAL 3-month timeframe (owner round 44).
- **The full table** (desktop + the mobile list) gains a 1-week and a
  1-month column beside Today — the same lenses the switch offers.
- **The Tools-menu CSV** appends Week/Month columns at the END (the file's
  own stable-positional-API rule); a missing lens exports an empty field,
  never a guessed zero.
- **The full export** (MD/TXT/CSV/XLSX) carries the lenses on the EXISTING
  flat slots 7 (`change7d`) and 10 (`chg1m`) — no flat position moves.
- **Six new Persian strings** (views, table headers, CSV columns), triaged
  round-46 in the copy manifest — the fx table's span convention («یک
  هفته»/«یک ماه»), the markets table's «بازده» prefix, CSV's «(درصد)»
  suffix. copy:audit clean.

### The weekend backfill (why a new runner)

`markets-run` held all 16 rows (R5 same-date stability — the weekend
closes are identical to the stored ones), which would have left the
weekly lens honest-dashed until Monday's cron. The new one-off
`markets-backfill` script resolves every row with prev=undefined (fresh
live provider answers; the closes measured 0.000% from stored) and writes
through the SAME write-only-if-changed gate against the true stored
snapshot. The KV key is never deleted (no "being prepared" window).
Verified after write: 16/16 stored rows carry both lenses.

### Budgets (bumped with justification, never silently)

- Route payload 12 KB → **13 KB**: live after the backfill 12,225 B,
  realistic fixture 12,370 B — the old ceiling left 63 B of slack, so any
  future contract field or a 17th market would breach it.
- Insights lazy chunk 608.00 → **609.00 kB raw** (measured 608.78 raw /
  145.54 gz — gzip-neutral vs the 145.60 budget; the raw overage is
  localized label wording, not logic).

### Gates + verified

- Tests 1,489 green (+3: the buildEntry anchor/window ladder, the round-46
  copy parity, the full-export lens columns), typecheck 6/6, lint 0
  errors / 15 accepted advisories, copy:audit clean, T-15 (public)
  passed, bundle budgets held.
- Deployed `currena-markets` `0135290c` (crons now compute chg1w) and
  `currena-api` `36a4eeab` (serve path passes chg1w; fresh SPA rides it).
- Browser-verified on currena.ir/insights (EN + FA, 1280 + 375): the
  five-lens switch, tile values matching `GET /api/insights/markets` on
  every lens (e.g. Nikkei −5.4% weekly vs API −5.37; +2.2% monthly vs
  2.19), the 9-column table, Persian digits (−۵٫۴٪), zero console
  errors, scrollWidth === viewport at both widths; VLM visual QA clean.
  Evidence: `docs/evidence/2026-10-24b-market-lenses/`.

## [2026-10-18d] — the gold balance becomes a classic hanging-pan scale (the owner's v3 directive)

The owner: *"The latest implementation does not yet meet the intended
balance redesign."* Seven directives, all implemented (notes v3 section in
`docs/insights/gold-balance-card-notes.md`):

- **The illustration** is now ONE carefully-proportioned inline SVG
  (520×252 viewBox): tapered beam with rounded end knuckles, pinned
  pivot, tapered pillar on a two-step plinth, splayed chains to shallow
  pan dishes, dotted level reference — varied stroke weights, deliberate
  whitespace, the page's neutral secondary ink (7.98:1/7.7:1).
- **The dashed empty rectangle is gone**: both sides always draw their
  complete pans; a side with no qualifying factors gets a concise,
  evidence-based empty line under its list heading (2 new copy keys,
  round-48, QA record `docs/QA/quirks-2026-10-18-balance-v3-fa-empty-states.md`).
- **Factor cards are OFF the beam**: the beam carries only the aggregate
  tilt; the factors render in lists beneath their supportive/adverse
  side captions (the v2 caption row became the list headings), growing
  independently of the fixed-geometry illustration (no runtime
  measurement, no reserved-height arithmetic — the ResizeObserver is
  deleted).
- **Direction follows the model**: the beam tilts only for a directional
  verdict; balanced and unavailable states render level (net-0 and
  readable-0 rules unchanged — no financial model, weight, threshold or
  copy change beyond the two empty-state keys).
- **RTL mirrors the whole SVG** with one scaleX(-1) (pure geometry), so
  the for-pan lands inline-end and the visual rotation flips in the same
  transform; the lists mirror via the grid.
- Verified: 30 updated component tests; harness-measured tilt law
  exact for cases A–H (rim difference = Lh × sin(angle) to 0.1px); no
  horizontal overflow at 320–1280 in both locales; keyboard + panel
  behaviour unchanged; VLM design review positive. Screenshots:
  `docs/insights/screenshots/gold-balance/v3-*.png`.

## [2026-10-18c] — the deploy-record reconciliation (no code change)

The owner: *"It seems like you didn't push commit deploy yet."* — verified
end-to-end that this was a **documentation gap, not a missing deploy**: every
commit on main was pushed AND the newest code was already live; the 2026-10-18b
session had simply recorded its deploys in CHANGELOG + its evidence README
instead of DEPLOY.md, so the runbook's newest visible deploy entry was the
redesign's `d93bd0ba`.

- **Cloudflare-confirmed**: active currena-api version
  `9f66a82c-d0d4-494e-a3cd-524eac3b557b` at 100% (deployment `7c2a2526`,
  2026-10-17T16:51:58Z), preceded by `c476307f` — the public-restore lineage.
- **Byte-identical proof**: a fresh web build of main @ `4d339b5` yields
  `index-ChVkduNn.js` (sha256 `c06ff8db…`) + `Insights-BwhME956.js`
  (sha256 `cbb6da44…`) — hashes identical to the live-served chunks; the
  deployment matches main exactly.
- **Re-verified live** (agent-browser, fresh context): hero grayscale both
  themes, Australia-left/Global-right at 1280, markets section renders,
  tile rule round-trip EN+fa, fa RTL + Persian digits, no h-overflow at
  1280/360, keyboard `/` + Escape, zero console errors — evidence in
  `docs/insights/screenshots/economic-indicators-redesign/final-continuation/`.
- **DEPLOY.md** gains a "CURRENT DEPLOYMENT" section recording the whole
  lineage (redesign `d93bd0ba` → PWA fix → public restore `c476307f` →
  `9f66a82c`) so top-down readers see the true current state. No worker
  re-deploy needed: main and production are byte-identical.

## [2026-10-17f] — the Economic Indicators page re-drawn from the owner's real spec

The owner supplied the actual `economic-indicators-ui-spec.md` (the session
draft was authored from the kickoff message because the real file had not
arrived); it now governs the Insights page: grayscale structural foundation,
SELECTIVE severity inks, top-3 flagged + expand, fixed Global-right/
Australia-left card order in both locales, indicator ROWS, WCAG 2.2 AA,
viewports 320-1440. The spec file replaced the draft at the repo root.

### Changed

- **Hero region cards (VerdictBlock)** — restructured per spec §4/§5: the
  region NAME is now the card title (26-30px/700 desktop, 22-26px mobile)
  with the severity label (the verdict word, 15-17px/600-700) and the
  severity mark/scale (state artwork + four-step meter) sharing the title
  row; a concise "Why" line (the existing count line, red when flagged)
  sits directly below the heading with the existing how-computed tip.
- **Flagged indicators** — the tile GRID became indicator ROWS: leading
  severity symbol (warning triangle, alert red) at the inline-start edge,
  flexible text column (name + the generated rule line), primary value at
  the trailing edge; 12px radius, 1px border, white surface, >=72px rows
  that grow naturally. The flagged heading carries the FULL underlying
  count ("Needing attention now · 6"), the count never describes only the
  visible three. "+n more" / "Show fewer" keep the in-place reveal and now
  announce state (aria-expanded + aria-controls per list).
- **Verdict meters** — RESTORED the round-44 colored grading (the session
  draft's neutral ramp is retired): the real spec's §6 requires the meter's
  segments and color to match the existing severity logic, so the scale
  speaks the app's classification at every size (hero lg, gauge sm,
  question headers).
- **Hero card order** — FIXED desktop locations in BOTH locales per spec
  §5/§8: Global on the right, Australia on the left, never mirrored by
  direction (index.css order rules at >=1024px; below that the cards stack
  Global-first). The two-column hero now turns on only at lg — below 1024px
  two columns would make each card narrower than the spec's ~420px minimum.
- **Layout targets** — page title 24->32px at sm, header->cards gap
  12->28px, card padding 16/20/24px (md/lg), hero gaps 16/20/24px, page
  container capped at 1440px (xl:max-w-[1440px]); "View section" became a
  quiet card-footer link (redesigned placement, never deleted); the hero
  rows now pass the opener for focus-return on panel close (the existing
  PricesBoard/MoneyPanel pattern).
- Bundle budget: Insights lazy chunk 606.00/144.60 -> 607.00/145.20 kB
  (raw-neutral restructure, +3 B gz over the line; headroom so the next
  growth bumps consciously).

### Verified

- pnpm -r typecheck, lint (0 errors; 15 pre-existing warnings), test
  (1285 tests), copy:audit clean, build + bundle budget held.
- Browser: EN + FA at 320/375/768/1024/1280/1440 (no horizontal overflow
  at 320), expand/collapse, DetailsPanel Escape + focus-return, colored
  meters, Persian digits, RTL logical edges.

## [2026-10-17e] — the gold card's balance visual (owner spec)

The owner's `docs/insights/gold-balance-card-spec.md`: the gold signals
card's grouped driver list ("Works against" / "Sitting neutral") becomes
a BEAM BALANCE a visitor reads in five seconds — which way the
conditions lean for gold, and how many drivers could not be read. Built
on the branch `feature/gold-balance-card` per spec §15.3 (not merged, not
deployed yet).

### Added

- **`signals/BalanceScale.tsx`** — the reusable balance component (takes
  a list of drivers, applied to the GOLD driver list only): the verdict
  line (word + the owner's up/down zigzag icon + the " · "-joined count
  line, zero parts omitted), the beam/pivot/strings graphic strip
  (`role="img"` whose label states the result — the interactive pans are
  siblings of it so the blocks stay real buttons), two pans of blocks
  (`for` at the inline-start end, `against` at the inline end; heavier
  side DOWN like a real scale; angle = |net|/total × 14° with a 3° floor
  and a 30 px pan-drop cap whose angle is re-derived so the pans follow
  the beam ends exactly; only the beam rotates — text stays upright;
  500 ms ease, `motion-reduce` disables it; RTL flips the rotation
  sign), the shared detail panel (blocks below ~900 px tap to open their
  existing explanation sentence, one open at a time; at ≥900 px the
  sentence lives inside the block; tray chips open it at every width),
  and the two trays — "Neutral" (quiet chips) and "Couldn't read"
  (dashed chips + the existing clock icon), empty trays hidden, never on
  the beam. Pure helpers exported + unit-tested (`balanceTilt`'s tilt
  rule, the state map, the count line, the pan columns).
- **`signals.balance` copy** — 13 keys × 2 locales (spec §13 verbatim;
  fa uses the existing site terms «قابل ارزیابی نیست»/«خنثی» per §13).
  Manifest round-48 (13 NEW processed, reference = the spec); the
  retired group headings (`sideSupportive/sideAgainst/sideNeutral/
  sideUnknown`) removed from both dictionaries and the manifest.

### Changed

- **`MergedSignalsCard`** — the three grouped driver lists are replaced
  by the balance; the C12 gold-high-yields banner rides the balance's
  §5.2 slot (text unchanged); the Price footing strip moves below the
  trays behind a divider (§9 — footing is not a driver and is never
  counted); the silver-only list and the outlook chip strip untouched.
  No signal logic, threshold, data source or explanation text changed
  (§16); no new dependency, API call or KV access (§2.4/§2.5).
- **Bundle budget** — the Insights lazy chunk budget bumps
  604 → 606 kB raw / 142.8 → 144.6 kB gz: the BalanceScale component +
  13 copy strings × 2 locales, minus the removed group markup. Measured
  605.31 kB raw / 144.53 kB gz. Entry chunk untouched (295.15/88.76).

### Verification

- Gates: 1,480 tests green (+25 balance tests), typecheck 6/6, lint
  0 errors/15 advisories, copy:audit clean, budgets held.
- Spec §14 loop: all five tilt cases (A–E) screenshotted at ~360 px and
  ~1280 px in EN and FA plus case A at ~768 px
  (`docs/insights/screenshots/gold-balance/`, 24 shots incl. the live
  production smoke via a read-only currena.ir forwarder — the live state
  matched case A exactly: 1 against, 3 couldn't be read); no horizontal
  scroll at 320 px; blocks/chips ≥ 44 px; tab order verdict → for →
  against → trays → footing; Enter/Space open the panel; reduced-motion
  kills the animation; console clean; no new network requests.
- Full detail: `docs/insights/gold-balance-card-notes.md`.

## [2026-10-17d] — the prices polish: sign inks, bigger titles, the hero glitch, N2 retired

The owner's four-point follow-up: signed percentages in red/green ("for
example" a prices-board change row); bigger, bold, clear section titles
in the prices board AND the metal chips ("silver gold must be written
much larger"); EN titles capitalized ("so silver is wrong, write
Silver. Be professional."); the hero's big-move line "seems glitchy"
(the fa fed-rate mover rendered «… آمریکا واحد درصد ۳۰ روز +۰/۲۵»);
and the short disclaimer + «درباره این داده‌ها ↧» button removed or
relocated to the bottom.

### Added (`config/display.ts`)

- **`changeToneClass`** — the owner's sign inks as one helper: positive →
  `--color-status-normal` (Carbon Green 50), negative →
  `--color-status-alert` (Carbon Red 60), zero/absent neutral. Applied to
  the four prices-board change rows, the 6-month/1-year fact bullets and
  the hero mover's value.
- **`formatChangeParts`** — the signed number and the WORD unit split:
  percents bind tight inside the number island ('+3.63%'), word units
  ('pts' / «واحد درصد») ride OUTSIDE as their own element.
  `formatChange` delegates to it — its composed output is byte-identical
  (pinned by the existing tests).

### Fixed

- **The hero glitch, structurally** — the big-move line forced
  «+۰٫۲۵ واحد درصد» into one `dir="ltr"` island, and the bidi algorithm
  scattered the RTL word unit: the line read «… آمریکا واحد درصد ۳۰ روز
  +۰/۲۵». Now the number keeps its own ltr island and the unit rides the
  next element: fa «نرخ سیاستی فدرال رزرو آمریکا +۰٫۲۵ واحد درصد ۳۰ روز
  …», EN "… policy rate +0.25 pts 30-day …".
- **EN title case** — `signals.metals` now `{ gold: 'Gold', silver:
  'Silver' }` (chips, merged-card rows, collapsed lines, the export Name
  column). All other EN display names audited — already capitalized.

### Changed

- **Titles bigger** — prices-board tile names 14→18px bold primary ink;
  metal chip names 14→20px bold primary (the price stays the lighter,
  quieter end of the header row — the Task-15 decree intact).
- **N2 retired from the hero** — the short disclaimer line and the
  about-jump button no longer sit under the hero: the page-bottom About
  section carries the full text, the global footer already carries the
  app-wide non-advice disclaimer, and the top nav chips still jump to
  About. `onJumpAbout` stays (the verdict blocks' alert cards use it).

### Workflow

- NO fa string changed — `pnpm copy:audit` clean without a manifest
  touch. Gates green: 1,455 tests, typecheck 6/6, lint 0 errors/15
  advisories, budgets held (entry 295.15/88.76 gz; Insights lazy
  597.50/142.51 gz). Deployed currena-api
  `8caff087-39fd-4026-b6ad-3274fa5ff77b`; served chunks sha256-identical;
  production browser-verified (sign colors sampled live, title sizes,
  "Gold" capitalized, the mover order fixed in both locales, `role=
  "note"` ×0 at the page top, 375 scrollWidth === 375, zero errors).
  Evidence: `docs/evidence/2026-10-17d-prices-polish/`.

## [2026-10-17c] — the Persian dollar convention

The owner's convention: "in farsi only say دلار not دلار آمریکا … only
mention dollar nationality when it's for australia or canada."

### Changed (copy-only — no data, scoring or formatting logic)

- **USD reads «دلار» everywhere** — 113 strings in `insights-copy-fa.ts`
  plus `currencies.USD` in `fa.ts`: indicator values («۱۱۳٫۹۶ دلار»),
  the board tiles' unit lines, 52-week-range tails, the metals chips'
  muted price («۴٬۱۶۵ دلار»), the fx rows («قدرت دلار»), the converter
  picker («USD · دلار»), the share line, the dollar-index copy. The
  unqualified «دلار» is what Persian financial usage already means.
- **Nationality reserved** — «دلار استرالیا» (AUD, 86 served occurrences)
  and «دلار کانادا» (CAD, 2) keep their qualifiers; cents untouched
  («۶۲ سنت آمریکا» — the rule speaks about دلار). NZD also drops its
  qualifier per the rule's second clause (the picker keeps the code:
  «NZD · دلار»; flagged for the owner — one-line revert in
  `fa.ts` `currencies.NZD` if unintended).
- **EN untouched** — US$ / US Dollar stay as-is.
- Comment-only examples updated so the source no longer models the old
  phrase (VerdictMeter, PricesBoard, config/display, lib/live-rate).

### Copy workflow

- Manifest round-47: 114 keys re-triaged `processed` against
  `docs/QA/quirks-2026-10-17c-fa-dollar-convention.md`; `pnpm copy:audit`
  clean (2,090 entries).
- Tests re-pinned to the new strings (live-rate, fx-presentation,
  insights, fx-v13). Gates green: 1,455 tests, typecheck 6/6, lint
  0 errors/15 advisories, budgets held — the Insights lazy chunk SHRANK
  599.38 → 597.79 kB raw (the dropped qualifier).
- Deployed currena-api `c970f556-0070-4fc9-a7ab-98e653461857`; served
  chunks sha256-identical to the build, «دلار آمریکا» ×0 in both served
  bundles; production browser-verified (fa home/insights × desktop/375,
  EN regression, zero errors). Evidence:
  `docs/evidence/2026-10-17c-fa-dollar-convention/`.

## [2026-10-17b] — the prices board cards re-drawn from the owner's sketch

The owner's five-point directive for the four-tile prices board
(Bitcoin / Silver / Gold / Brent): "1. Picture next to Unit name and price
2. Daily / Weekly / Monthly/ Quarterly Percentages 3. Descriptions and
verdict 4. some more meta data facts and percentages (must be in bullet
point) 5. very small text showing update time." — with a hand-drawn card
sketch (price + "Price per ounce" caption beside the artwork at the top's
far end; four stacked percentage lines; a big "Description" heading; bullet
rows; very small as-of).

### Changed (`PricesBoard.tsx` — one rebuilt anatomy, mobile AND desktop)

- **Header row: the artwork beside the unit name and price** — the big
  digits at the start (the fa unit drops to its own small line UNDER the
  digits so every fa tile has the same price-block height; EN keeps the
  merged `US$4,165`), the indicator name in its fixed two-line slot, the
  tinted `PriceIconBox` (96px mobile / 72px desktop) at the row's far
  end. RTL mirrors the sketch automatically. The stacked-artwork face
  (R29r2) retires.
- **FOUR percentage rows** — daily / weekly / monthly / quarterly, one per
  line, labels at the start and values end-aligned (they share one edge in
  every tile), the quiet "—" when a window does not exist. Weekly /
  monthly / quarterly come from the feed (`change7d/change30d/change90d`,
  production-verified present on all four tiles); the DAILY row is derived
  from the stored history.
- **Description + verdict** — a "Description" label row whose far end
  carries the price-position verdict word (cheap/normal/expensive, the
  R31 status ink) above the existing hedged consequence line.
- **The fact BULLETS** (`role="list"`, `data-price-facts`) — the derived
  stats first (6-month change, 1-year change, 52-week range), then the
  tile's context lines (the futures note, gold's A$ companion, Bitcoin's
  ratios, the 200-day gap, the record distance). A fact that cannot be
  measured stays OFF the card; "as of" drops to 10px tertiary ink pinned
  with `mt-auto` so the four footers align.
- **New `price-stats.ts`** — the client-side derivation module with the
  R30 honesty rules tightened: every number comes from the stored history
  ALONE; a window's reference is the nearest stored point within ≤3 days
  (a sparse series yields absent, never a stretched number); the last
  stored point can no longer be its own reference (the old derivation
  could fabricate a 0% change out of a missing window — caught by the new
  tests); the "52-week range" is only NAMED when the window really spans
  ≥300 days; zero baselines yield absent, never Infinity. +9 tests.
- **Copy** — 9 new keys in both dictionaries (`priceChangeDaily/Weekly/
  Monthly/Quarterly`, `descriptionLabel`, `stat6mChange`, `stat1yChange`,
  `stat52wRange`, `rangeJoin`); `days7`/`days30` untouched (AlertCard,
  HeroBlock and CompactRow still speak them). Manifest round-46: 9 NEW
  entries referenced to `docs/QA/quirks-2026-10-17-prices-card-redesign.md`.
  No data/scoring/API change; the metals analysis chips (Tasks 15–17) and
  the money panel untouched.

- Gates: copy:audit clean (2,090 entries); full workspace tests 1,455
  green (web 485, +9 price-stats); typecheck 6/6; lint 0 errors/15
  accepted advisories; bundle budgets held — entry 295.15/88.76 kB gz;
  Insights lazy 599.38/142.60 gz (+2.78 kB raw, +0.77 gz under the cap).
- Deployed currena-api `0652db45-3fc2-418f-87c2-bb06caa51e5c` (SITE_MODE=
  public untouched; currena-markets untouched `9b5ff7e0`).
- Production browser-verified (agent-browser, SW precache purged first —
  the Task-17 lesson): served chunk `Insights-E8NrMws9.js` byte-identical
  local == production (sha256 `f3a0d27c…`); EN desktop — the sketch
  anatomy on all four tiles, gold rows `Daily −0.13% / Weekly −1.22% /
  Monthly −5.08% / Quarterly +3.63%`, 6 fact bullets incl. `52-week
  range: US$3,961 – US$5,318`, as-of 10px; fa RTL — icon mirrored to the
  top-left, unit `دلار آمریکا` under the digits, «محدودهٔ ۵۲ هفته: ۳٬۹۶۱
  تا ۵٬۳۱۸ دلار آمریکا», verdict «بالا» red at the توضیحات heading's end;
  mobile 375 scrollWidth === 375 in BOTH locales (icon 96px, same
  anatomy); clicking a tile opens/closes the details panel; zero
  page/console errors; `/api/insights` → 32 readings (gold-aud honestly
  absent — no A$ bullet this snapshot); the metals conditions strip
  untouched.
- Evidence: `docs/evidence/2026-10-17-prices-card-redesign/`.

## [2026-10-21] — the gold/silver outlook speaks the owner's seven states (the EN/fa drift bug)

The owner's bug report: for gold and silver the verdict slot said EN
"Works against" but fa «شرایط موجود با الگوی معمول هم‌خوانی ندارد» —
"these are not same thing." Confirmed: the two locales shared the
`signals.verdictDown` key but not a meaning (the fa string was a leftover
of the old "pattern conformance" framing). Fixed by adopting the owner's
**"Gold Market Outlook — Complete State List"**: SEVEN states with the
owner's own bilingual sentences, so one state machine feeds both locales
and drift is structurally impossible.

### Changed (`signals/verdict.tsx`, `Signals.tsx`, dictionaries, `full-export.ts`)

- **New seven-state outlook classifier `outlookOf`** over the same
  condition tally (gold 5 / silver 6 conditions): strong-bullish /
  strong-bearish at the card lean's OWN strong bar (`LEAN_STRONG = 4`,
  now exported from `@currena/insights` — one strength definition per
  card); bullish / bearish on a majority of directional conditions;
  mixed on an equal split (the indicators disagree); neutral when all
  readable conditions sit neutral (no directional bias); **range-bound**
  only with affirmative quiet-price evidence (|30-day speed| < 2% AND the
  price in the typical band of its 10-year range) while the driver split
  stays within one — the owner's distinctions (Neutral ≠ Range-Bound ≠
  Mixed) are honoured mechanically, not by renaming.
- **The old `up/down/flat` words are retired** — `verdictUp`
  ('Supports' / «حمایت‌کننده»), `verdictDown` ('Works against' /
  «شرایط موجود با الگوی معمول هم‌خوانی ندارد») and `verdictFlat`
  ('Mixed' / «ترکیبی») are gone from both dictionaries and their three
  manifest entries pruned; `verdictNone` («هنوز نمی‌توان نتیجه‌گیری کرد»)
  stays for the nothing-readable edge.
- **The owner's verbatim sentences** land as `signals.verdictStates`
  (7 states × gold/silver, EN + fa — the gold strings exactly as the
  owner wrote them, silver mirrors) and `signals.verdictStateNames`
  (7 short names — Strong bullish/Bullish/Neutral/Range-bound/Bearish/
  Strong bearish/Mixed signals; fa: صعودی قوی/صعودی/خنثی/محدوده‌ای/
  نزولی/نزولی قوی/نشانه‌های مختلط) for the collapsed line. The strip
  heading becomes "Outlook"/«چشم‌انداز» and the collapsed template
  "Outlook: {verdict}"/«چشم‌انداز: {verdict}» — 21 new + 2 changed
  manifest entries, round-45, referenced to
  docs/QA/quirks-2026-10-21-outlook-states.md (the owner's table recorded
  verbatim).
- **The sentence gets its own line in the chip** — the 2026-10-20 sketch's
  header (icon box · name · lighter price) stays, but a full sentence
  cannot live in that narrow column (it wrapped into a 4-6-line staircase
  at 375px — caught in production verification of the first deploy,
  `a5d2f793`): the outlook sentence now rides a full-width line between
  the header and the chart, zigzag icon leading, floored two-line slot
  keeping the two desktop chips' charts on one baseline (the round-34
  rule). One anatomy for mobile AND desktop, both locales.
- **`verdictTone`/`VerdictIcon` extend to the seven states** — the
  bullish family keeps the green ink + up zigzag, the bearish family the
  red ink + down zigzag (colour never rides alone), and the calm states
  (neutral/range-bound/mixed, plus unreadable null) share the dash in
  the muted ink.
- **The signals CSV header decouples** from `verdictTitle` (the row's
  status value is the checklist lean, not the outlook) — it now uses the
  generic `ui.csvColStatus` like the other sections.

### Unchanged (deliberately)

The condition checklist and its side words (Supports / Works against /
Sitting neutral), the lean words and counts, the data/scoring engine, the
API shape, the prices board and every other section.

### Gates

`copy:audit` clean · full workspace tests green (1,446 — +15 new outlook
tests pinning the mapping edges, the owner's verbatim strings and the
retired keys' absence) · typecheck 6/6 · lint 0 errors/15 accepted
advisories · budgets held (entry 295.15/88.76 kB raw/gz vs 296/89.5;
Insights lazy 596.60/141.83 vs 604/142.8 — +0.53 kB gz for the 28
authored sentences).

### Deploy + production verification

Deployed currena-api `d0d28c3f-f0a9-4619-b269-8f7337d9daa9` (SITE_MODE=
public, cron, KV intact; currena-markets untouched `9b5ff7e0`). Served
Insights chunk `Insights-DlDkQ-3K.js` byte-identical to the local build
(sha256 1d0778c5…); the old mismatched fa sentence — 0 occurrences in the
served bundle. Live browser verification (agent-browser, fresh
SW-purged loads): live data produced `bearish` for both metals and BOTH
locales render the same state — EN "Outlook: Signs point to a potential
decline in gold/silver prices." with red zigzag + muted prices US$4,165 /
US$57.27; fa «چشم‌انداز: نشانه‌ها حاکی از احتمال افت قیمت طلاست./…نقره
است.» RTL-mirrored with Jalali ticks; collapsed "Outlook: Bearish" /
«چشم‌انداز: نزولی»; 375px scrollWidth === 375 both locales; the prices
board (4 tiles) and condition checklist untouched; zero page/console
errors. Evidence: docs/evidence/2026-10-21-outlook-states/.

## [2026-10-20c] — the gold/silver analysis charts grow the 10-year view (the owner's request)

The owner, one message after the verdict-chip redesign shipped: **"Add 10
year View of the gold and silver price as well."** — the metals' Estimation
chips ("Conditions right now") offered only Quarter · 1 year · 5 years; the
decade was missing although the history feed already serves the complete
10-year daily series for both metals (2514/2513 points, 2016-10-18 →
2026-10-16 — verified on production before touching anything).

### Changed (`TrendChart.tsx`, `signals/verdict.tsx`) — UI-only

- **`TrendRange` grows `'10y'`** (3653 days — the details panel's exact
  10-year window incl. leap-day slack). `TREND_RANGE_COPY_KEY` maps it to
  the EXISTING `range10y` key ('10 years' / «۱۰ سال») — zero new strings,
  no manifest change.
- **New optional `ranges` prop** on the shared `TrendPanel` (defaults to
  the old Quarter · 1y · 5y list) — only callers that opt in grow the
  decade chip. `TREND_RANGES` (the full ordered list) is now exported as
  the canonical order/test seam.
- **`MetalTrendChart` passes `ranges={['quarter','1y','5y','10y']}`** —
  both metals' analysis chips offer the decade; `StripRange` grows `'10y'`.
  The chip is gated by the same ≥2-plottable-points rule as its siblings.

### Unchanged (deliberately)

The money panel's mini charts keep exactly three chips (Quarter · 1 year ·
5 years) — the owner asked for gold and silver specifically. The details
panel's HistoryChart already had its own 10y zoom. No copy keys, no data,
no scoring, no API change.

### Gates

`copy:audit` clean · full workspace tests green (1,431) · typecheck 6/6 ·
lint 0 errors/15 advisories · budgets held (entry 295.15/88.76 gz;
**Insights lazy 593.58/141.30 gz**, +0.07 kB for the fourth chip). Deployed
currena-api `4e8a54e0-fda4-4ce7-bc1e-9ba245c1bfc9` → production
browser-verified: EN desktop — both chips show Quarter · 1 year · 5 years ·
**10 years**, decade ticks Oct 2016 → Oct 2026, deltas **+230.3% 10 years**
(gold) / **+225.6% 10 years** (silver), muted header prices intact; money
panel still three chips; EN mobile 375 identical, no overflow; fa RTL —
«۱۰ سال» chip, Persian-digit deltas, Jalali X ticks; zero page/console
errors. Evidence: `docs/evidence/2026-10-20-metals-10y/`.

## [2026-10-20b] — the gold/silver verdict chips become analysis cards (the owner's sketch)

The owner drew the chip UI for the gold and silver "Conditions right now"
strip: boxed artwork in the corner, the name + verdict beside it, the PRICE
in a lighter ink ("the price is already mentioned once in upper section.
the emphasis must be on the TREND, not the price necessarily"), and ONE big
chart filling the rest of the card — "DO THE SAME FOR MOBILE VIEW."

### Changed (`signals/verdict.tsx`, `signals/MergedCard.tsx`)

- **Header row** (replaces the 96/128px artwork column): `MetalIconBox` —
  the metal artwork in a small tinted box (56/64px; gold brand-gold tint,
  silver soft tint) · name (bold, primary) + verdict word with its direction
  artwork (verdict ink) · the current price at the far end in the MUTED
  secondary ink (tabular, nowrap) — the price already leads the prices
  board; here the trend speaks.
- **The chart is the body**: `MetalTrendChart` gains `plotHeightClass` and
  opens at **h-40 mobile / h-52 desktop** (was h-20); the side-split layout
  (`sm:w-40`, `sm:border-s`, `min-h-[136px]`) is gone — ONE anatomy for
  mobile AND desktop, exactly as the owner asked. Range chips + window
  delta unchanged. The verdict word keeps its floored two-line slot (the
  round-34 alignment rule survives by structure).
- **Price source**: MergedCard computes each metal's display price from the
  SAME snapshot readings (`formatIndicatorValue`), passes
  `prices={{ gold, silver }}`; honest absence → nothing rendered.

No copy changes, no data/scoring change.

### Gates

`copy:audit` clean · workspace tests **1,431 green** · typecheck all · lint
0 errors/15 advisories · budgets held (entry 295.15/88.76 gz; Insights lazy
593.51/141.27 gz, +0.9 kB raw). Deployed currena-api
`757cb15b-45ae-4a61-8f4a-d808a515968d`→ production browser-verified: EN
desktop plot 208px with muted header prices; mobile 375 identical anatomy,
no overflow; fa RTL mirrors the sketch (icon right, muted price left, Jalali
ticks); prices board untouched; zero page/console errors. Evidence:
`docs/evidence/2026-10-20-verdict-chip-redesign/`.

## [2026-10-20] — the "Know before you buy US shares" box removed (the owner's direct request)

The owner pasted the exact rendered `<details>` element (fa:
«پیش از خرید سهام آمریکا بدانید» — the collapsed FX/fees/disclaimer notes box
on the Insights page) with one instruction: **"Remove this entirely."**

### Removed

- **`UsSharesNotesBox`** (`apps/web/src/routes/insights-sections/UsSharesNotes.tsx`)
  — the Step 3 §7.1 collapsed info box, rendered unconditionally on Insights
  since the 2026-10-16 rebuild, is gone: component deleted, the
  `<UsSharesNotesBox copy={copy} />` render + import removed from
  `Insights.tsx`, and the section comment now dates the owner-requested
  removal so it is never "helpfully" resurrected. `UsSharesAudBox` (the
  L2-03 AUD view — a different box in the same file) is untouched.
- **Copy keys retired** in both dictionaries (`insights-copy-en.ts`,
  `insights-copy-fa.ts`): `usSharesBoxTitle`, `usSharesFxLine`,
  `usSharesFeesLine`, `usSharesDisclaimer` — en↔fa parity intact.
- **`docs/localization/persian-copy-manifest.json`**: the four matching
  entries pruned (REMOVED findings fail `pnpm copy:audit`).

### Unchanged (deliberately)

No data, scoring, projection, or behaviour change — the box was copy-only
and rendered identically in both site modes. The world-markets/AUD boxes,
the prices board (2026-10-19e) and the sparkline fix (2026-10-19f) are
untouched.

### Gates

`pnpm copy:audit` clean · web tests 461/461 (34 files; full workspace green)
· typecheck 6/6 · lint 0 errors (15 accepted advisories) · budgets held —
the Insights lazy chunk **shrank** to 592.61 kB / 141.14 gz (was
594.68/141.60; budgets 604/142.8), entry untouched 295.15/88.76.

Deployed currena-api `e6d18811-46ae-4f27-890a-6a1f63b90cd1`; production
verified: served Insights chunk carries **0** occurrences of the box copy,
prices board + 32-reading projection intact. Evidence:
`docs/evidence/2026-10-20-remove-us-shares-notes/`.

## [2026-10-19f] — the sparklines draw honest trends (the owner's screenshot report)

The owner (screenshot of the USD→IRT converter card): "The graph seems
irregular and like a placeholder or buggy." — a violent, perfectly regular
sawtooth where a trend should be.

### Root cause (production forensics, not guesswork)

- `/api/history?source=tgju` held 240/240 DISTINCT generations over ~24 h:
  TGJU re-quotes jitter on nearly every 6-minute tick (median 0.01–0.04%,
  p90 ~0.12%; EUR/GBP/CHF changed on 229–235 of 239 ticks), so exact-value
  dedup recorded noise nonstop and the window never spanned more than a day.
- The USD quote itself bobs between two levels ~0.375% apart (155
  transitions, 38 clean a-b-a patterns — a genuinely served quote).
- The UI drew raw points min-max-normalized (last 40 on the converter card,
  all 240 in the popup and /live-rates) — sub-percent noise filled the full
  plot height: the sawtooth. The real +3.1% window trend was invisible.

### The fix (three coordinated layers)

- **Record deadband (`apps/api/src/history.ts`)** — a generation appends
  only when a rate moves ≥ `HISTORY_RECORD_DEADBAND` (0.05%) vs the last
  RECORDED level (hysteresis; rate-set changes always record). Genuine
  drift records at its first crossing; jitter never accumulates into a
  record. KV write budget drops with it.
- **Drawn-line aggregation (`apps/web/src/lib/live-rate.ts`)** —
  `bucketMean(series, TREND_BUCKETS = 48)`: only the DRAWN polyline is
  bucket-averaged; trend chips, ranges, check counts and the
  delta-vs-previous stay RAW. Applied at all three call sites
  (LiveRateLine, ResultPopup, LiveRates board) — the drawn window now
  spans the whole recorded history (days), not the last 40 ticks.
- **Honest amplitude (`apps/web/src/components/Sparkline.tsx`)** — the
  plot domain pads to ≥2.5% of the series' mid-level (always containing
  the data), so sub-noise wiggles render proportionally calm and real
  trends still fill the plot.
- **One-time KV prune** (post-deploy, KV REST) — the stored window
  re-filtered with the same deadband: tgju 240 → 188 gens (USD 259,600 →
  267,900 across the window — the genuine rise now visible immediately);
  frankfurter already clean.

### Gates + deploy

- Tests 1,431 green (+12: deadband ×5 incl. hysteresis; bucketMean ×5;
  Sparkline amplitude ×3 — calm band never touches the edges, a ≥2.5%
  move still fills the plot, drift+noise stays visible). Typecheck 6/6;
  lint 0 errors (15 accepted advisories); copy:audit clean; budgets held
  (entry 295.15/88.76, Insights 594.68/141.60).
- Deploy currena-api `ed79e2cc-fb2f-44ce-bcad-00d73dc57eed` (cron, KV,
  SITE_MODE=public untouched). Production browser verification: the
  owner's exact card (fa, 375 px) now draws a smooth rising line; popup
  "TREND: LAST 189 UPDATES · +3.2% · low 256,895 · high 267,900";
  /#/live-rates cards all calm; zero console/page errors; no 375 px
  overflow; the Insights prices grid (2026-10-19e) untouched.
- Evidence: `docs/evidence/2026-10-19f-sparkline-honesty/` (before
  screenshot + pre-fix history analysis + pruned-history capture + five
  production screenshots + README).

## [2026-10-19e] — the prices board returns to public mode (the owner's directive)

The owner: "Still there aren't GOLD BITCOIN SILVER price, like it used
to. please read previous version you will findout there was a dedicated
nice section with images for it." — this resolves the decision left open
by the 2026-10-19d investigation (recovering the four price tiles was
listed as an owner choice).

### The restoration (one mechanism, honest trail)

- **The images never left** — production still serves
  `/assets/icons/{oil,gold,silver,bitcoin,copper}.png` and the
  PricesBoard code ships in the live bundle; the tiles were DATA-starved
  (the Oct-19b licence-cautious hide filtered their readings out of the
  public projection).
- **`scripts/generate-indicators-registry.ts` gains
  `OWNER_PUBLIC_DISPLAY_OVERRIDE`** for exactly {brent, gold-usd,
  silver-usd, btc-usd}: it lifts ONLY the public-display disposition of
  the E-01/LR-02 worst-leg walk, and appends a dated evidence note to
  every card (the underlying licence facts stay verbatim; the Yahoo
  legs stay in the ENGINE — the private page is unchanged; the world
  boards markets/fx and all other non-'yes' verdicts stay hidden).
  Explicitly recorded as an owner directive, NOT a terms
  re-verification — the quarterly licence review re-confirms it.
- **Regenerated artifacts**: hidden set 24 → 20
  (data/indicators.json, data/indicator-audit.json,
  data/site-mode-overrides.json — all cross-checks stay consistent by
  construction).
- **Tests**: the LR-02 hidden-history fixture moves brent → vix (still
  Cboe-hidden); NEW pin — the four owner-directive tiles must never be
  re-hidden by a future generator change. Suite 1,419 green (+1).
- **Gates**: tests 1,419 (core 191 · scraper 67 · insights 462 ·
  markets 13 · api 233 · web 453), typecheck 6/6, lint 0 errors / 15
  advisories, copy:audit clean, budgets held (entry 294.78/89.39 vs
  296/89.5; Insights lazy 594.68/142.02 vs 604/142.8), T-15 PASSED in
  SITE_MODE=public (20 hidden + the boards declared).
- **Deployed**: currena-api **`d40211f9-970b-4756-970c-8424f6062b20`**
  from the restore commit; the public projection REBUILT from the
  stored snapshot without re-fetching (52 → 32 public-ok readings; KV
  2 reads / 1 write).
- **Production verified**: /api/insights → 32 readings with brent
  109.13, gold 4,164.70, silver 57.27, bitcoin 81,180.14 (US$); the
  live `#insights-prices` section renders all four tiles WITH their
  images; zero console/page errors; 375 scrollWidth === 375. BONUS:
  the money panel's "Petrol and transport" row returned with brent
  ("Becoming more expensive — US$109.13 Oil price (Brent)") — the
  data-driven gap the 2026-10-19d investigation diagnosed.
- Evidence: docs/evidence/2026-10-19e-prices-restore/.

## [2026-10-19d] — the missing-items investigation + the ingest watchdog

The owner: "Some items are gone, for example the grid that shown GOLD -
Silver - brent oil and bitcoin price. also many items have no data / or
not defined / or waiting. investigate whether it's api problem, quota or
what."

### Verdict (investigated, not guessed)

- **API problem? No.** The last ingest (Oct 16 09:06) succeeded 50/50
  sources with ZERO failures; both the private and public snapshots
  carry ZERO stale/unavailable readings. Quota? No — push-triggered CI
  kept running throughout.
- **The prices grid (gold/silver/brent/bitcoin) is GONE BY DESIGN** —
  the PUBLIC projection's licence hiding: all four tiles' sources carry
  `public_display_ok: no` in the indicator audit (EODHD/Yahoo terms do
  not allow public display), so their readings are absent from
  `insights:snapshot-public` and `PricesBoard` renders nothing
  (`rows.length === 0 → return null`). The world boards (/markets, /fx)
  are hidden the same way.
- **The "no data / not defined" items are the hidden gauge members** —
  with 24 of 51 indicators hidden, two GLOBAL question gauges lose
  every member (Market stress 0/4, The US dollar 0/2 → the honest
  "not enough data to read" group), and four more read partially
  (borrowing-costs 5/8, prices-heat 1/3, growth-health 3/6,
  au-trade-currency 1/3).
- **The money-panel shift is DATA-driven, not licence-driven** — money
  rows show only attention/unusual areas. Petrol/transport's drivers
  are `['brent', 'au-petrol-yoy', 'audusd']`: brent + audusd are
  licence-hidden publicly AND (the decisive part) ALL of petrol's
  remaining drivers are calm right now, so the row is absent on BOTH
  the private and public pages today (verified by computing
  `moneyPanel()` on both snapshots — identical rows: homeLoan, savings,
  shop, jobs). Employment appears because `au-unemployment` +
  `au-wage-growth` are BOTH currently `warning` — and both are
  public-ok, so the row survives the projection.

### The REAL outage found underneath (and fixed)

The daily `insights-ingest` schedule had silently STOPPED firing after
Oct 16 (zero attempted runs for three days; the 04:20 UTC cron had
already been firing ~4h45m late before the full stop — GitHub-side
schedule delays/skips). Data was three days stale with only the /admin
staleness pill as a signal.

### Added

- `apps/api/src/ingest-watchdog.ts` — the Worker-side self-heal: the
  cron's :40 hourly rung reads `insights:status`; a snapshot older than
  26 h re-dispatches the insights-ingest workflow via the GitHub API.
  Nudges bounded to one per 6 h (`insights:ingest-nudge:v1`); a missing
  `GH_INGEST_DISPATCH_TOKEN` secret is an honest logged no-op; every
  failure path is caught. Healthy path: 1 KV read/hour, zero writes.
- `GH_INGEST_DISPATCH_TOKEN` set on currena-api (rides the owner's
  token-rotation pass).
- Tests: +9 watchdog branches, +2 cron-routing tests. Suite 1,418
  green; budgets held; typecheck 6/6; lint 0 errors / 15 advisories.

### Deployed

- currena-api **`0eb91818-9a1f-4dd6-ac8f-f250b1004f28`** from `193237e`.
  SITE_MODE=public untouched; currena-markets untouched (`9b5ff7e0`).
- Freshness RESTORED first: a manual `workflow_dispatch` ran the ingest
  immediately (run 35, success) — the public snapshot's generatedAt
  jumped 09:06 → 17:59 and the public projection grew **27 → 28
  readings** (the crypto Fear & Greed card rode in, exactly as the
  2026-10-19b deploy notes predicted). Post-deploy smoke: health 200
  kv ok; insights 200 public; markets 404 hidden_site_mode (by design);
  convert parity 100 USD = 26,790,000 @ 267,900 tgju LIVE.

## [2026-10-19c] — the verdict meter grades in one hue (round 44)

The owner's colour-grading idea, in their words: "when it's stable show
green. when it's yellow the previous grade must be shown with yellow (but
with more tint = eg whiter yellow). when it's orange, the grad turns to
orange, previous ones get orange two like this: [more pale orange]
[pale orange] [orange]. and same for red, with it's critical the all
grades become different tints of red."

### Changed

- `apps/web/src/index.css` (round 44 block) — the round-43 per-segment
  "rainbow" inks are retired. The four-segment verdict meter now grades
  in ONE hue — the CURRENT step's: the highest filled segment wears the
  full step ink; the segments BEFORE it wear progressively whiter tints
  of the same hue via `color-mix(in srgb, <status ink> N%, white)` —
  cautious 55% yellow · stressed 40/70% orange · critical 30/55/78% red.
  Stable stays pure green; unfilled steps stay the border grey.
- `VerdictMeter` + the `QuestionGroup` header meter carry the current
  step to the stylesheet (`data-step`) — every meter on the page grades
  the same way: hero (lg), per-gauge rows (sm), MarketsVerdict, and the
  six per-question header meters. The verdict WORD keeps its own step
  ink (unchanged, round 43).
- Bundle budgets hold: entry 294.78/89.38 vs 296/89.5; Insights lazy
  594.68/142.03 vs 604/142.8 (+0.19 kB raw from the ramp). Tests 453/453
  web (1,407 total), typecheck 6/6, lint 0 errors / 15 advisories.

### Deployed

- currena-api **`e8a47a2d-c593-456a-b4c6-5a9428fd159f`** from `50ba45b`
  (+ the docs wrap-up commit). currena-markets untouched (`9b5ff7e0`).
- Production verified: the deployed CSS asset is byte-identical to the
  local build and carries the full ramp; the live hero meter (Critical,
  step 4) resolves `rgb(244,188,191) → rgb(235,131,137) → rgb(226,79,87)
  → rgb(218,30,40)` (= Carbon Red 60 at the top); per-gauge + per-question
  meters grade identically; the Stable meter stays pure `#24a148`;
  health 200 kv ok; unauthed /api/insights → 200 `public, max-age=60`
  (displayMode public, 27 readings); 375 px scrollWidth === 375; zero
  console/page errors. Evidence:
  `docs/evidence/2026-10-19-round44-meter-grading/`.

## [2026-10-19b] — the Insights page goes PUBLIC (owner decree)

The owner on the private gate: "Why you made the page private? make it
public dude." Going public is the Step 3 spec's own reserved task (§12)
and it is done licence-safely: the public page shows ONLY sources whose
terms allow public display. The private gate's fail-closed design (and
the INSIGHTS_PASSWORD secret) stays intact — flipping SITE_MODE back to
'private' re-arms it instantly.

### Added

- `data/site-mode-overrides.json` — generated, test-pinned hidden set
  (24 indicators + the two EODHD/Yahoo world boards); T-15
  (check-site-mode.mjs) gains a real pass path: public mode passes only
  when the hidden set covers exactly the non-'yes' audit verdicts.
- `projectSnapshotToPublic` — the pure public projection (subset +
  recomputed summaries + the additive `displayMode` schema field),
  written daily by the ingest under `insights:snapshot-public` (+2
  KV writes/day, budget 31 → 33) and bootstrappable from a stored
  snapshot via `pnpm --filter @currena/insights public-projection`.
- Public serve path (SITE_MODE=public, AC-08): mode-aware
  KvInsightsReader (projection keys only — the private document cannot
  leak by construction), 404 `hidden_site_mode` on /markets + /fx and
  on hidden ids' histories (before any KV read), no Yahoo live-prices
  merge, and the web hides the world sections when the snapshot says
  `displayMode:'public'` (no fetch, no cached render).

### Verification

- Tests **1,407** green (+18 public-mode tests), typecheck 6/6, lint 0
  errors / 15 advisories, copy audit clean, budgets held.
- Production: unauthed `/api/insights` → 200 `public, max-age=60`,
  27 public-ok readings, ZERO hidden-id leaks; boards + hidden
  histories → 404 `hidden_site_mode`; the page renders signed-out with
  no gate screen; fa + 375 px clean. Evidence:
  `docs/evidence/2026-10-19-public-insights/`.

## [2026-10-19] — the insights rebuild ships to production (owner-approved)

The AGENT_RUNBOOK execution on `insights-rebuild` (Setup → Phase 7, 14
phase commits — see `docs/insights/FIX_REPORT.md`, `STEP3_REPORT.md`,
`MAINTENANCE.md`, `OWNER_SETUP.md` and `PHASE7_VERIFICATION.md`)
deployed after the owner's explicit approval. The Insights product is
now correct, self-checking (T-01…T-24 + the daily `insights-selfcheck`
Action), **private by default** (every `/api/insights*` route answers
401 with no data until sign-in; `INSIGHTS_PASSWORD` set as a Worker
secret per OWNER_SETUP §1), licence-walked (`LICENCES.md` generated
from the register), and complete for an Australian saver and investor
(Layer 1/2/3, the "Know before you buy US shares" box, the crypto Fear
& Greed context card — corpus 51→52).

### Changed

- Production currena-api → **`b137f3ef`** from `1f70552`; currena-markets
  untouched (`9b5ff7e0`).
- `main` fast-forwarded to the branch (its stray `branches: ain]`
  ci.yml edit is gone — CI triggers on main pushes from here).
- OWNER_SETUP §1 done for the owner: `INSIGHTS_PASSWORD` generated and
  uploaded as a secret (the fail-closed gate is now usable; the value
  lives in the chat handover, never in the repo).

### Verification

- Fresh-clone gates (the sandbox had reset): **1,389 tests green**
  (core 191 · scraper 67 · insights 451 · markets 13 · api 214 · web
  453), typecheck 6/6, lint 0 errors / 15 advisories, copy audit
  clean, T-15 site-mode OK, budgets held (entry 294.79/88.56 vs
  296/89.5; Insights lazy 594.49/141.54 vs 604/142.8).
- Production smoke: unauthed `/api/insights` → 401 `private_page`
  `no-store`; signed 12h HttpOnly cookie → 200 `private, no-store`
  (51 readings, ruleVersion 2); `/admin` 401; convert parity 100 USD →
  26,790,000 IRR @ 267,900 (tgju live).
- Production DOM: the private gate screen → sign-in → full render;
  CSV + XLSX downloaded through the real UI (UTF-8 BOM + audit
  columns / valid OOXML, 10 sheets) with zero errors; fa `dir=rtl`;
  375 px scrollWidth === 375. Evidence:
  `docs/evidence/2026-10-19-insights-deploy/`.

## [2026-10-18b] — the CSV and XLSX exports open correctly in Excel

The owner on the 2026-10-16b full export: "The xlsx and csv outputs are
incomplete and not working. md and txt works." Forensics against real
production data (`/api/insights` + markets + fx, en and fa): the builders
were complete — a strict RFC-4180 parse-back of the CSV returned every
section and all 51 readings, and the XLSX passed `unzip -t`, per-part XML
validation and an openpyxl read-back (10 sheets, 131 rows, real number
cells). The failure was Excel-side rendering of both formats:

### Fixed

- **CSV: the Persian text was mojibake in Excel.** The export was UTF-8
  **without a BOM**, so Excel on a fa-Windows machine decodes it as
  ANSI-1256. Every CSV the app ships now carries the UTF-8 BOM (Excel
  itself, Google Sheets "CSV for Excel" and every reporting tool do the
  same; Sheets/pandas strip it) — the full export AND the three
  long-standing per-table exports (insights / markets / fx).
- **CSV: the flat 26-slot dump read as "incomplete".** One header row
  cannot serve nine different tables: each section only filled some of
  the 26 columns, so Excel showed a sparse matrix with wide gaps. The
  full CSV now mirrors the MD/TXT structure the owner approved — title +
  meta floor, then one **dense block per section** (heading line, the
  section's own header row, its rows), CRLF + trailing CRLF, OWASP guard
  and ASCII numbers unchanged. The flat `Section`-column API is retired
  (shipped 2026-10-16b, replaced before any external consumer).
- **XLSX: the minimal package tripped strict viewers.** openpyxl warned
  *"Workbook contains no default style"* — the same class of gap that
  makes Excel mobile / WPS repair-or-refuse hand-rolled packages. The
  zero-dependency writer now emits the parts real viewers expect:
  `docProps/core.xml` + `docProps/app.xml` (+ content-type overrides +
  root rels), a named **"Normal"** cell style, a per-sheet
  `<dimension ref>` and `<cols>` width 22 (names readable without
  resizing), `xml:space` moved onto `<t>` (Excel's own placement), and a
  plain-decimal guard so `<v>` never carries an exponent form
  (`1.2e-7` → `0.00000012`). Bytes stay deterministic.
- **XLSX (fa): the workbook now opens right-to-left** —
  `buildXlsxBlob(sheets, { rtl })` flips every sheet view for the fa
  export, matching the page. The Receipt export (no opts) is untouched.
- **The download handler no longer swallows failures** — the
  `void import(...).then(...)` chain now has a `.catch` that logs loudly
  instead of a silent nothing-downloaded.

### Verification

Tests 1,331 green (web 443 → 449: BOM + per-section block parse-back +
writer hardening suites); typecheck 6/6; lint 0 errors / 15 advisories;
copy audit clean (zero copy changes); budgets held (entry untouched
294.75/88.52; Insights lazy 603.89/142.61 vs 604/142.8). Browser-verified
on the harness with real production data — in-page module eval: fa CSV
BOM + dense blocks (`gold-usd,قیمت طلا…,4194.6,…`), 10 fa sheets, XLSX
`PK` magic; all four format buttons clicked through the real UI with
zero console/page errors; 375 px scrollWidth === 375. Production
(currena.ir): deployed, smoke green, and the deployed
`full-export-zgApEZWy.js` / `xlsx-writer-DzSEJ58r.js` chunks probed
in-page — docProps, Normal style, dimension, cols, `rightToLeft`, plain
decimals and `xml:space`-on-`<t>` all live. Evidence:
`docs/evidence/2026-10-18-export-fix/`.

## [2026-10-18] — Round 43: the grades wear their colors again

The owner's feedback on the round-42 result: "Revert colors back to the
situation grades." + "Now a considerable white space is created for AUS,
because it has no items to mention, we need to think for that." + "the
place of 'help tool tip' needs better placements" + "the bullet points
aren't at the beginning of the sentence" + "add a container around bullet
points." Full disposition table in
`docs/QA/quirks-2026-10-18-round43.md`; evidence in
`docs/evidence/2026-10-18-round43/`.

### Changed

- **The meters REVERT to the four-step status inks** (round 42's
  neutral-ink decree reversed by the owner): a filled step wears its
  step's own colour again — green / yellow / orange / red, the
  owner-pinned Carbon palette — at EVERY size (hero `lg`, the grouped
  rows' `sm`, MarketsVerdict, QuestionGroup). The words still carry the
  meaning; the meters carry the colour. Unfilled steps stay border grey.
- **The two "?" tips seat at their subjects** (no more lone floats):
  the verdict-rule tip («مبنای تعیین وضعیت هر حوزه») sits in the FIRST
  status group's header, beside the word it explains; the
  how-computed tip («این نتیجه چگونه محاسبه می‌شود؟») rides the verdict
  row itself. `GlossaryTip` gains an optional `panelClassName` so a
  panel hosted in a flex row wraps onto its own full-width line
  (backward-compatible — every other usage unchanged).
- **The alert container becomes clearly visible**: a soft alert-tinted
  bounded box (`ring` 25% / `bg` 5%) — the round-42 container was
  effectively invisible in the light theme.
- **The attention module flows from the top**: the R40 bottom-anchor
  (`mt-auto`) turned Australia's missing bullets into a mid-card hole;
  the spare space now falls to the card's bottom inside edge, where it
  reads as padding. The R30 equal-height stretch stays (no "void under
  Australia" beside the taller card).

### Fixed

- **The alert bullets start at the sentence START in every direction**:
  the old `::marker` rode the inline-block button's LAST-line baseline,
  so on wrapped items the dot landed beside the second line. Each bullet
  now carries an explicit flex marker (one shared `BULLET_DOT` element);
  `items-start` pins it beside the first line — right edge in fa, left
  edge in en.
- **Australia's white space fills with its own data**: a card with no
  section-signal bullets (Australia never grows the alert box — the
  signals are Global-scope) leads with SIX of its own attention tiles
  instead of three, so the space the alert box would have taken holds
  the card's real "items to mention". Cards WITH bullets keep the
  3 + "+n more" economy; the reveal button's count reads
  `tiles.length - shown.length` instead of a hardcoded 3.

### Verification

- No copy changes (zero new/retired strings — copy:audit untouched).
- Gates: tests 1,325 green (core 191 · scraper 67 · insights 403 ·
  markets 13 · api 208 · web 443); typecheck 6/6; lint 0 errors / 15
  accepted advisories (D-24); copy:audit clean; budgets held — Insights
  lazy **603.84/142.59** vs 604/142.8 (the deduped `BULLET_DOT`
  absorbed the round; NO budget bump), entry untouched 294.75/88.53.
- Browser-verified (vite + production data) en/fa × light/dark ×
  375 px/desktop: meters wear the four-step colours, both tips seat and
  expand (tap + keyboard, panels wrap below their rows), the alert box
  is visible in both themes, bullet dots sit at sentence starts, the
  AUS card leads with 6 tiles and no reveal chip, the reveal still
  works on Global (3 → 6), 375 px `scrollWidth === 375`, zero
  console/page errors.
- Deployed currena-api `7b5f7896-3068-4b33-a815-732457cb2f2c` from
  `d643353`; production DOM re-verified (the known one-reload PWA SW
  cycle) — see `docs/DEPLOY.md`.

## [2026-10-17] — Round 42: the hero verdict cards calm down

The owner's feedback on the Insights hero verdict cards (Global /
Australia): "This section has toooooo much color. It's everything and
nothing because being confusing." — with seven specific asks. Full
disposition table in `docs/QA/quirks-2026-10-17-hero-calm.md`; evidence
in `docs/evidence/2026-10-17-hero-calm/`.

### Changed

- **Region mark** (the globe / the Australia map) 48/64 → **24/28** —
  a compact header identifier; the big artwork stays in the dedicated
  sections mid-page.
- **State artwork** (the gauge beside the verdict word) 44/60 →
  **32/40** — proportionate to its word, no longer a shout.
- **The gauges GROUP BY STATUS**: one quiet box per step word
  («پرتنش» / «پایدار» …) with each area and its mini meter inside.
  The flat chip row, the computed reason sentence ("از ۳ حوزه، ۲ حوزه
  یعنی…") and the calm line are retired — they said the same thing
  three times; the grouping IS the sentence and can never contradict
  the gauges because it IS the gauges. `heroReason` stays in config,
  pinned by its tests. Nine reason-line copy keys retired (manifest
  pruned in the same commit).
- **The verdict-rule paragraph** («مبنای تعیین وضعیت هر حوزه: …»)
  hides behind a quiet "?" tip (the shared GlossaryTip pattern —
  tap/keyboard, never hover-only). New key `ui.verdictRuleLabel`.
- **The red notes group into ONE bounded container with bullets**:
  the count line is the header, each raised signal (world stock
  markets, the section indicators, currency patterns) is one disc
  bullet. With nothing to list, the count line rides bare
  (Australia's usual case). Red stays on the alert words only.
- **The how-link** ("این نتیجه چگونه محاسبه می‌شود؟") hides behind the
  same "?" tip: the panel answers in one sentence (`ui.explainerIntro`)
  and keeps **"Read the full explainer"** (new key
  `ui.explainerFullLink`) — which now also SCROLLS to the About
  section (a bare expand below the fold read as a dead click; the
  same roast round 33 answered for the section jump).
- **The meters go low-key**: a filled segment is ONE neutral ink at
  every size — round 36's small-meter decree ("use normal color not
  color coding") extended to the big hero meter. The attention tiles
  lose their pink tint for neutral surfaces. Colour remains only
  where it means something: the verdict word, the alert words inside
  the bounded container, the region's own artwork.
- The multi-ink meter change also applies to the world-markets focal
  verdict box (it shares `.verdict-meter`).

### Verification

- Tests 1,326/1,326 green (no behavioral assertions lost — the
  component had no DOM tests; `heroReason`'s pure-function tests stay
  green), typecheck 6/6, lint 0 errors / 15 accepted advisories,
  copy audit clean (2 new strings triaged `processed`, round-2 ref =
  the QA doc).
- Budgets: the pass **shrank** the Insights chunk — 603.29/142.46 vs
  the 604/142.8 budget (entry untouched 294.75/88.53).
- Browser-verified en/fa × light/dark × 375 px/desktop: groups render
  both statuses, tips expand/collapse (tap + keyboard), bullets
  RTL-align, the markets bullet jumps to the markets section, the
  full-explainer link scrolls + expands About, 375 px `scrollWidth ===
  375`, zero console/page errors.

## [2026-10-16b] — Insights full export: one-file "download all data" (MD/TXT/CSV/XLSX)

The owner's request: a download button that exports every data table the
financial-indicators page displays, in ONE file, in four formats.

### Added

- **"Download data" button** beside Tools in the Insights header (44px
  target, ToolsMenu's disclosure discipline): one click opens the format
  choice, one click downloads. Formats: Markdown (.md), plain text
  (.txt), CSV (.csv), Excel workbook (.xlsx); filename
  `currena-insights-full-<snapshot-date>.<ext>`.
- **Content** (everything the page lists and displays): the hero
  verdicts (the precomputed summary lines), the prices board rows with
  position words and the board's own context lines (gold A$ · BTC
  ratios), the world-markets table (worst-first), the world-currencies
  pairs (group order), the Together connections (card order, with each
  card's relation + right-now leg phrases), the gold/silver signals
  checklists, all 51 indicator readings (the long-standing 12-column
  layout), the upcoming calendar, and this week's state changes — plus
  the meta floor (subtitle, data-as-of, prices-as-of, rule version).
- **Discipline** identical to the existing exports (insights-csv /
  markets-csv / fx-csv): machine-readable VALUES (ASCII digits, period
  decimals, NO grouping — a grouping comma inside a CSV field would
  corrupt the column alignment), localized names/headers, the OWASP
  formula-injection guard on free-text CSV cells, CRLF + trailing CRLF
  for the CSV (RFC 4180); MD/TXT use LF. The XLSX is the in-house
  zero-dependency writer (real number cells), one worksheet per section.
- **Everything lazily loaded**: the builders (full-export 11.18 kB +
  xlsx-writer 5.57 kB) and the format panel (2.75 kB) are separate
  chunks — the Insights chunk grows only by the trigger button, the
  download handler and 14 copy strings × 2 locales (603.71/142.72 vs
  the consciously bumped **604/142.8** — note in the budget script).

### Fixed

- **Popover off-screen bug** (found while verifying the export panel):
  the Tools panel anchored `end-0` slid 75 px off-screen at 375 px EN
  and did the mirrored thing in fa RTL — the anchor side flips with the
  writing direction but the flex-wrap can leave the button at either
  visual edge. Both panels now clamp inside the viewport via a shared
  physical clamp (`lib/clamp-panel.ts`, 8 px margins, X + Y).

### Verification

- 16 new unit tests (web 427 → 443; monorepo 1,310 → 1,326 green);
  typecheck 6/6; lint 0 errors / 15 accepted advisories (D-24);
  copy:audit clean (14 new fa strings triaged in the manifest).
- Browser-verified en/fa × light/dark × 375 px/desktop: all four
  formats download with correct names/MIME/sizes; MD structure, CSV
  columns and XLSX ZIP magic inspected; the panel clamps inside the
  viewport in both directions; zero console errors; no horizontal
  bleed. Evidence: `docs/evidence/2026-10-16-export/`.
- Deploy: currena-api **`30f647f6`** from HEAD `186a070`; production
  XLSX download re-verified on currena.ir (77,366 B, panel clamp OK at
  375 px, zero errors).

## [2026-10-16] — UI/UX quirk pass: touch targets, RTL, signals headings

The owner's polish commission (docs/NEXT_SESSION_PROMPT.md §0) — visual
and interaction quality only; no data, scoring, wording-policy or
behavior changes. Full inventory, verification record and the seven
declined quirks: `docs/QA/quirks-2026-10-16.md`. Evidence:
`docs/evidence/2026-10-16-quirks/`.

### Fixed

- **Header utility icon buttons 40px → 44px** (`HEADER_ICON_BUTTON_CLASS`,
  the install · language · theme · hamburger group) — the WCAG 2.5.8
  touch-target floor; `eb0f3d1`.
- **Footer trust links gain a 32px hit area** (py-2 inline-flex; were a
  bare 16px text line — the smallest targets in the app); `9630c5a`.
- **Converter amount quick-chips 34px → 40px; live-rate copy chip
  32px → 36px; receipt delete button 32px → 36px** — three controls
  under the touch-target floor lifted; `8eb6c94`.
- **Insights fa "prices updated" time drops the seconds** — en/fa time
  precision now matches (shared clock formatter); `5ef803c`.
- **Signals group headings render only when the group has rows** — no
  more empty "Supports"/"Works against" headers; `bb8fb6a`.
- **Converter custom-rate disclosure triangle mirrors in RTL**; `f81eda7`.

### Verification

- Gates at close: tests **1,309 green** (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 427), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy:audit clean, budgets
  held (entry 294.67/88.53 vs 296/89.5; Insights lazy 599.53/141.53 vs
  600/142 — CSS-only, no bump needed).
- Production DOM (currena.ir, 375 px, post-deploy): all 4 header
  buttons 44×44, footer links 32px, chips 40px, copy chip 36px,
  receipt delete 36px; zero console errors; no horizontal bleed.
- Deploy: currena-api **`9d995f01`** (2026-10-16, ~11:16 UTC) from
  HEAD `8eb6c94`; currena-markets untouched (`9b5ff7e0` still current
  — no markets imports changed).

## [2026-10-15e] — INSIGHTS_FIX_SPEC wrap-up: Part E, published, deployed

The close-out of the 14-October audit's fix project. All 48 spec items
(A-01…A-08, B-01…B-19, C-01…C-07, T-01…T-14) are done and verified —
Part E's item-by-item record lives in `FIX_REPORT.md`, every checkbox in
`INSIGHTS_FIX_SPEC.md` is ticked. This entry pins the publication and
deployment floor the next session starts from.

### Published

- **Ingest**: the daily `insights-ingest` Action (04:20 UTC) now runs
  the full T-01…T-14 validation suite after the fetch and before
  anything is published; today's live run (manual dispatch,
  2026-10-15T01:39Z): 50 sources fetched, none failed, 14/14 tests
  green, 51 readings, ruleVersion 2. Free-tier budget per full
  refresh: **55 KV reads / 31 KV writes / 49 outside requests**.
- **Archive**: `GET /api/insights/archive/2026-10-15` serves the day's
  exact published snapshot (one dated KV key per day, written
  write-only-if-absent).
- **Reference values re-verified post-publish**: Fed 3.75–4.00 decided
  2026-09-16; ECB 2.50 decided 09-10; RBA 4.60 decided 09-29; AU CPI
  4.0 released 09-30; US September CPI released 10-14; peaks gold
  5,586.20 / silver 121.30 / BTC 126,198.07 (daily-high) and Brent
  138.21 (2026-04-07 close); US 10-year at 5.21 reads "highest since
  2007" (episode-aware B-19), 30-year 5.56 "highest since 2004".

### Deployed

- currena-api `cdf4df66` (01:44 UTC, the session's data-bearing
  deploy) superseded by the wrap-up redeploy **`97e8c38a`** (03:05 UTC,
  Workers version #125) from final HEAD `b6a35a7` — every commit after
  the data-bearing deploy is docs/tests-only, so served bytes are
  identical; the redeploy makes the version record unambiguous.
- currena-markets `9b5ff7e0` is UNCHANGED and current: the fix spec
  touched none of its imports (`insights/fx`, `insights/markets`,
  `series` — verified by `git diff fb1fded..HEAD`), and `packages/core`
  grew only optional reader-side fields.
- Post-deploy smoke on currena.ir: health 200; `/api/insights` 51
  readings (fed-expectations +1.04 · us30y 5.56 · philly-fed 37.8 ·
  rba-expectations +0.33); `/api/insights/status` 14/14; the archive
  route 200; markets + fx 200 with the D-12/D-13 cache headers intact;
  convert parity 100 USD → 26,390,000 @ 263,900 (tgju live); `/admin`
  401 (Worker-first gate intact).
- Gates at HEAD: CI green on `b6a35a7`; bundle budgets held (entry
  294.61/88.50 vs 296/89.5; Insights lazy 599.37/141.52 vs the
  2026-10-15d bump 600/142).

## [2026-10-15d] — INSIGHTS_FIX_SPEC: Parts A–D implemented

The 14-October insights audit's fix spec, implemented in full (A:
foundation, B: fixes, C: additions, D: validation). Commits 2dd2eae →
04d36bc. FIX_REPORT.md carries the item-by-item verification record.

### Bundle budget (this entry's own justification)

The Insights lazy chunk grew 582 → 599.37 kB raw / 137 → 141.52 kB gz
(budgets now 600/142): the four Part-C cards (fed-expectations, us30y,
philly-fed, rba-expectations) carry full bilingual copy — 11 fields ×
2 locales. The ENTRY chunk is untouched (294.61/88.50 vs 296/89.5).

### What changed (one line each)

- **A**: indicators.json registry (51 entries, CI-pinned); generated
  needs-attention text (the hand-written `meaning` maps are gone);
  T-01…T-14 validation suite runs before every publish; check-pending
  holds last-good values; daily archive (insights:archive:v1:<date>);
  context notes (off by default); rule version 2 shown on every card;
  /api/insights/status + the About-this-data run status.
- **B**: full-history record peaks with basis (gold 5,586.20 · silver
  121.30 · BTC 126,198.07 — all daily-high, 2026-01-29/2025-10-06;
  Brent 138.21 close 2026-04-07); M2 duplicate detection; the dollar
  speed rule wired to the hero; the relationship cards rewritten as
  explicit rules (windows, pass-through, context legs); release/decided/
  effective dates; quarter labels; UTC timestamps; stale tags; same-date
  gaps; sources on every card; hero counts from the gauge membership
  (37 voters); live-snapshot ratios; points-not-percent on rate charts;
  the real-return-on-savings line; "highest since {year}".
- **C**: the four additions (above) + the ECB decision day on the
  calendar (29 Oct, own timezone; tz now stored on every event).
- **D**: the ingest runs the suite before publishing (a flagged reading
  never reaches the page fresh); fixtures/regression-episodes.json
  (COVID-2020 + inflation-2022, 11 cases, replayed every run and in
  CI); scripts/safety-demo.ts (the operator's broken-input demo);
  KV-read/write/outside-request budget printed every run.

## [2026-10-15c] — D-25/D-26/D-27 decided: all three KEEP (WS-6 fully closed)

The owner's reply arrived in session chat — "do the D25 D26 D27" —
interpreted as adopting each paper's recommendation (option (a) for
all three; no alternative option was named, and the overrule path
stays open: reply to the row in docs/DECISIONS_FOR_ALI.md). Docs-only:
zero code, zero copy, zero behavior change, nothing deployed.

### Decided — the three WS-6 owner papers

- **D-25 (D-08 follow-up — R7's euro-led card): KEEP.** "Mostly a euro
  story" stays rare by basket mathematics (0 of 522 weeks; EUR carries
  57.6% of the D-06 basket) — honest rarity, not a defect.
  `R7_DOLLAR_QUIET` and the basket weights are untouched.
- **D-26 (D-09 follow-up — R5 China link at 15.3% of weeks): KEEP.** A
  touch above the spec's 15% usefulness bar, far under the change
  request's 25% bar, with high catch quality (2018-19, March 2020,
  2022). `R5_USDCNY_M3_WEAK`/`R5_AUDUSD_M3_FALL` are untouched.
- **D-27 (A-11 follow-up — /api/convert's exotic `Number()` forms):
  KEEP.** The finite/positive/≤1e15 gates already reject the dangerous
  forms; the exotic-but-finite forms (`0x10` → 16, `1e3` → 1000,
  ` 42 ` → 42) stay accepted surface, pinned by contract tests.

### Not deployed (docs-only)

Runtime is unchanged: production stays currena-api `155ecb3d` +
currena-markets `9b5ff7e0` (both from `fb1fded`) — a docs-only commit
serves the same bytes. Gates re-run before the commit: 1,255/1,255
tests (core 190 · scraper 67 · insights 356 · markets 13 · api 208 ·
web 421), typecheck 6/6, lint 0 errors / 14 accepted advisories, copy
audit clean, budgets held (entry 294.60/88.50 vs 296/89.5; Insights
lazy 581.45/136.82 vs 582/137).

## [2026-10-15b] — REMAINING_WORK session: reliability minors, test closers, a11y leftovers, the five splits, the advisory worklist

The owner-commissioned follow-up work order (REMAINING_WORK.md at the repo
root, commissioned after the QA long-run). Executed in the recommended
order: WS-1 → WS-2 → WS-3 → WS-4 → WS-5 → WS-6, conventional commits with
CI green between them, both workers deployed + live-verified at the close.

### Fixed — reliability (WS-1, D-19/D-20/D-21)

- **fx fallback validation per-currency (A-5, D-19):** a Yahoo fallback
  answering 5 of 6 required currencies no longer rejects the WHOLE set
  (exactly during a Frankfurter outage, when the fallback is the only
  source) — absent legs hold their stored rows with notes, present legs
  compute; the full-set and empty-set outcomes are pinned unchanged.
- **Subrequest budget 50 → 48 (A-6, D-20):** `putMarketsIfChanged` /
  `putFxIfChanged` take the run's start-of-run `prev` instead of
  re-reading KV — the worst-case provider+KV count now sits 2 under the
  free plan's 50 cap (budget test extended to count KV ops through the
  production store).
- **Serve-time staleness (A-8, D-21):** `/api/insights/markets` + `/fx`
  re-evaluate per-row `stale` at serve time (one daysBetween per row) —
  a multi-day double-cron failure no longer serves frozen `stale:false`
  to machine consumers (CSV exports); fresh snapshots byte-identical,
  ETag identity unchanged (flips land within the ≤5-minute cache
  windows).

### Added — the test closers (WS-2) + characterization suites (WS-4)

- C-6: the markets + fx SPA clients covered at the insights.test.ts bar;
  C-8: the markets cron test READS wrangler.jsonc (config drift now
  fails); C-9 (D-22): jsdom + @testing-library as web devDeps with
  Converter + LiveRates DOM suites.
- WS-4's characterization-first discipline added a 9-test Receipt suite
  (form, live-total LOCAL math, generate guard + happy path, per-item
  currency normalization through the snapshot — the legacy mixed-sum
  bug pinned fixed — and the budget progressbar) and a 6-test Settle
  suite (create-group flow + persistence, detail tablist, add-expense,
  mark-settled balance cancellation). Web tests 352 → 421.

### Fixed — a11y leftovers (WS-3, D-23)

Settle's tabs + BatchConverter's mode toggle are REAL tablists (roving
tabindex, RTL-aware arrow keys via the new shared use-roving-keys hook);
AlertsDialog's radio group gains arrow-key selection; Splitter's ±
steppers carry real verbs (en/fa, needs-review manifest entries);
BatchConverter's share title moved to a copy key; three misleading
constant `aria-expanded={false}` removed; Header/Footer/Converter
quick-tools render REAL `<a href="#/…">` anchors. Declined with reasons
(D-23): the LED table restructure (subgrid CSS architecture), lazy
imgs (no remote below-fold imagery exists), the Insights idle prefetch
(chunk already in the SW precache manifest).

### Changed — de-monolith-ing round 2 (WS-4, behavior-preserving)

- **B-4:** MetaResponse consolidated into packages/core — the api/web
  zod twins deleted, parity tests became single-source tests.
- Five module-tree splits, each characterization-first where coverage
  was thin, one tree per commit: **WorldMarkets** 977 → 262 shell +
  world-markets/ (5); **Receipt** 951 → 560 + receipt/ (5); **Settle**
  947 → 342 + settle/ (8); **fx-presentation** 892 → a 30-line barrel +
  fx-presentation/ (6 — the public surface byte-identical, ten
  importers untouched); **Converter** 849 → 540 + converter/ (7 — the
  shell keeps the conversion state machine; entry chunk 293.60 →
  294.60 raw, inside the 296 budget); **Signals** 813 → 174 +
  signals/ (3). No web/src file exceeds 560 lines anymore.
- One copy-manifest re-point per split that moved a Persian literal
  (the ٪ glyph — the established split-move pattern, text+hash
  unchanged).

### Fixed — the ESLint advisory worklist (WS-5, D-24: 34 → 14)

Every warning the compiler's own prescribed shapes could fix without
behavior churn: the localStorage hydration set-states became lazy
`useState` initializers (Converter recents, Settle groups, History
entries — the Settle `hydrated` guard retired because its crash window
is structurally gone); declaration-order advisories dissolved by pure
reordering; the memo-dependency gaps gained their real inputs
(Together numberLocale, QuestionGroup group, AlertsDialog's extracted
naLabel); BatchConverter's formatters hoisted to pure module functions;
PairsTable's group-header boundaries precomputed. The 14 advisories
that remain are DECLINED, each with a stated reason in D-24 (animation
loops, data-fetch state machines, expand-token responses, the
deliberate onSubmit omission, the ref-in-cleanup, the
compilation-skip) — the rules stay at warn; honesty over lint-perfect.

### Added — owner-decision papers (WS-6, D-25/D-26/D-27 — awaiting Ali)

D-08 follow-up (R7's euro-led card: keep recommended — the 0-in-10y
rarity is basket mathematics); D-09 follow-up (R5 at 15.3% of weeks:
keep recommended); A-11 follow-up (/api/convert's exotic Number() forms:
keep recommended). No behavior change without Ali's go.

### Deployed

Both workers from `fb1fded` (api `155ecb3d` + markets `9b5ff7e0`,
2026-10-14T19:52Z; EODHD secret re-put). Gates: 1,255/1,255 tests,
typecheck 6/6, lint 0 errors/14 advisories, copy audit clean, budgets
held. Live verification: EN+FA, desktop+375px, the money path at live
rates (100 USD → 26,390,000 Toman), all split routes + Insights
sections, zero console errors, D-12/D-13 cache chain + 304 intact.

## [2026-10-15] — Codebase QA session: reliability hardening, contract suites, de-monolith-ing, a11y majors, ESLint

The owner-commissioned autonomous QA session (docs/NEXT_SESSION_PROMPT.md
brief; the full read-only audit with 38 numbered findings lives at
docs/QA/audit-2026-10-14.md). Every critical/major finding is fixed or
documented-with-reason; D-14…D-16 recorded in docs/DECISIONS_FOR_ALI.md.

### Fixed — reliability (the display must ALWAYS degrade honestly)

- **KV-failure honesty (A-1/A-2/A-3, D-15):** `/api/history` answers the
  calm 503 `history_unavailable` (was a raw 500); all four insights serve
  routes guard their KV reads with distinct 503 codes; `/api/status` and
  `/admin` degrade per-row via `Promise.allSettled` (a dead status read no
  longer hides a readable snapshot, and vice versa). The ops console can
  never be the thing that goes down.
- **fx fallback window (A-4, D-14):** the Yahoo fallback asks `range=2y`
  (was `1y`) — the y1 change anchor needs a quote on/before "last date −
  12 months" and a 1-year window has ~zero calendar margin for it, so the
  designed fallback could fail wholesale exactly when Frankfurter was
  down. Spec table updated in place.
- **Cron-kind selection (A-7):** unknown trigger expressions on
  currena-markets log and skip instead of silently running as the retry
  pass.
- **Parser V1 parity (A-9):** `parseFrankfurterTimeseries` drops
  non-positive rates like the fx twin — garbage never rides into
  indicator histories.
- **SPA `fetchMeta` retry (C-2):** a rejected memo no longer pins a dead
  promise for the whole session.
- **rules-of-hooks crash (found by the new ESLint gate):** NextUpStrip
  called `useMemo` after a conditional early return — a latent crash on
  an upcoming→empty transition. Hoisted.

### Added — the contract suites (+113 tests, 1,058 → 1,171)

- `apps/api/src/contract.test.ts` — golden bodies validated against THE
  zod contracts from packages/core for every public route, the exact
  cache-chain matrix (200/304/ETag/`max-age`/`s-maxage` per route per the
  spec rules + D-13), and the /api/convert amount-form pinning.
- `history.test.ts` (the module's first tests), insights reader poison +
  cacheTtl-300/60 contracts, scheduled-wrapper coverage on BOTH workers,
  web `api.test.ts` (the SPA trust boundary), the snapshot-store
  honest-stale/gold-heal/persistence contracts, and the REST-store
  429/10048 retry ladders.

### Changed — de-monolith-ing (behavior-preserving, one module per commit)

- `apps/api/src/index.ts` 850 → 186 lines (routes/, http, security,
  default-service, cron; the insights routes' private errorResponse copy
  deduplicated — audit B-1).
- `packages/insights/src/fx/compute.ts` 984 → a 33-line barrel over
  maths/pairs/weekly/entries/cross-inputs/rules/summary/content.
- web insights `config.ts` 1,507 → `config/` (10 domain modules; the
  99-symbol public surface byte-identical).
- `WorldCurrencies.tsx` 1,291 → 283-line shell + `world-currencies/` (8
  modules). `routes/Insights.tsx` 1,164 → 465-line shell +
  `insights-sections/` (6 modules; **D-16**: the Insights lazy raw budget
  documentedly bumped 580.00 → 582.00 kB for the prop plumbing — gz stays
  inside 137; entry untouched).
- Deliberately left: the i18n copy corpora (single-purpose data files —
  a split would churn ~900 reviewed manifest entries for zero gain) and
  `core/schemas.ts` (the sacred KV-contract file).

### Fixed — accessibility (audit D-1…D-6 + the minor batch)

- A shared `useDialogFocus` hook (the DetailsPanel-proven discipline) now
  gives every dialog focus-in, Tab trap, Escape, opener focus-return and
  scroll-lock: the converter result popup, the receipt modal, the Settle
  modal (whose close button also lost its literal `×` aria-label), and
  the header drawer (which additionally becomes `inert` while closed and
  gains `aria-current`).
- Skip-to-content link on every route (button form — a hash link would
  navigate the hash router away); h1s on the money page (sr-only) and
  LiveRates (promoted board heading); live-region roles, localized LED
  'n/a' labels, `aria-describedby` on the amount field,
  `aria-controls` on the custom-rate disclosure, keyboard-activable
  WorldMarkets rows, `lang` on mixed-direction runs, `<noscript>`, and
  woff2 preloads for the fonts the first viewport actually fetches.

### Changed — hygiene

- **ESLint gate (E-3):** flat config + `pnpm lint` wired into CI after
  typecheck. Zero errors; 34 advisory warnings remain (documented —
  promoting the v6 compiler-grade rules to errors is follow-up work).
- **Dead code (E-1):** knip-verified sweep — 6 deletions, 20 barrel
  trims, 137 exports made module-private across 51 files. Post-sweep
  knip: zero real findings.
- **Dependencies (E-2):** wrangler 4.132 → 4.151; pnpm overrides for
  dompurify / source-map-js / serialize-javascript — `pnpm audit` now
  reports **zero** known vulnerabilities (was 15, all transitive).

### Deployed

- Both workers from `6090842` (CI green): currena-api `93ae180a` +
  currena-markets `d825a8d4` (2026-10-14T14:28Z; pins the version
  marker to the final HEAD). Gates re-verified on a fresh clone first:
  1,171/1,171 tests, typecheck 6/6, lint 0 errors, copy audit clean,
  budgets held (entry 292.77/87.80; Insights lazy 581.44/136.81).
  Post-deploy smoke + browser verification (EN+FA, desktop + 375px,
  zero console errors) recorded in docs/DEPLOY.md. D-14…D-18 logged.

## [2026-10-14] — Freshness: the daily update becomes visible in ~5 minutes

Owner-approved pair of changes (D-12 + D-13) closing the gap between the
23:30/01:30 UTC snapshot runs and what a returning visitor sees. Before:
after a daily fx/markets update, a returning visitor could see yesterday's
currencies for up to **4–5 hours** (browser cache 4 h + edge cache 1 h).
After: **~5 minutes**, end to end.

### Fixed

- **D-12 (zone-side, no code):** the currena.ir zone's legacy *Browser Cache
  TTL* setting was `14400` (4 hours — Cloudflare's old default), silently
  rewriting the origin's `max-age=300` to 14400 on every edge-cache HIT.
  Verified live in a real browser (`cf-cache-status: HIT` served
  `max-age=14400`); fixed via the Cloudflare API to **0 = "Respect Existing
  Headers"**, and verified again — HITs now serve `max-age=300`. Only the
  two edge-cached insights routes were affected; HTML/assets/rates were not.

### Changed

- **D-13 (code + spec):** the `/api/insights/markets` and `/api/insights/fx`
  edge TTL tightened from 1 hour to 5 minutes — `s-maxage` 3600 → 300 on
  both the 200 and 304 responses, and the serve-path KV read `cacheTtl`
  3600 → 300 (`KvMarketsReader`/`KvFxReader`). Specs updated in place
  (world-markets §4 rule 5, world-currencies §5 rule 4) with the change
  note. Read budget: at most one KV read per 5 minutes per active colo per
  route (~288/day/colo) — comfortably inside the free tier, and the account
  is now dedicated to Currena (the owner migrated the other projects off).

## [2026-10-14] — World currencies v1.3: bugs B1–B8, R3 one-month trigger, corrected R7, the plain-language layer

Implements the owner's change request
(`docs/specs/insights-world-currencies-v1.3-change-request.md` — wins over the
v1.2 spec where they disagree). Full requirement → code → test map in
`docs/specs/traceability.md`; every agent decision in `docs/DECISIONS_FOR_ALI.md`
(D-07…D-11); 14 QA'd screenshots in `docs/screenshots/`.

### Fixed (change request §2 — the eight bugs from Ali's review)

- **B1** R7 said the dollar "barely moved" at +3.2% — R7 now works in dollar
  strength (§3.3): dollar-led / euro-led / no card, never a guess.
- **B2** the context card counted as an active pattern and led the headline —
  only counted Active/Watching rules lead; R7 never does.
- **B3** dots and "Held in" lines on rules without a pattern check (R4, R7) —
  gated by `fxRuleHasPatternCheck`.
- **B4** raw codes (EURUSD, DOLLAR, …) on screen — plain names everywhere,
  both locales, chart labels included.
- **B5** warning lines on the context card — removed; other cards state the
  alarm level in words ("The alarm sounds if…").
- **B6** the closest-to-alarm pattern repeated in the quiet list — excluded.
- **B7** the fixed dollar meaning line — follows the direction now
  (stronger / weaker / steady, CR §4.9).
- **B8** "calm" during the dollar's biggest one-month move — fixed by the new
  R3 trigger + the big-mover headline.

### Changed

- **R3 fast-move trigger (§3.1):** Warning at dollar M1 ≥ +3.0 or M3 ≥ +4.0
  (supportive mirror); the sentence names the leg that fired; distance to
  warning uses the nearer leg. Evidence replay (522 weeks): warning 14.2% of
  weeks, M1 leg alone 10.7% — under the 25% change bar, thresholds kept (D-07).
- **Corrected R7 (§3.3):** card only when EUR/USD moved ≥2.5% in a month;
  dollar-led when the dollar measure agrees and \|d\| ≥ 1.5; euro-led when
  \|d\| < 1.0; otherwise no card. Honest finding for the owner (D-08):
  euro-led fired 0 times in 10 years — the euro carries 57.6% of the Currena
  basket, so a big euro month nearly always drags the measure past the
  dollar-led line. Not broken, mathematically rare; any change needs Ali.
- **Calm-with-a-big-mover headline (§3.2):** "No warning pattern is active,
  but the US dollar is up {x}% this month."
- **Bundle budget:** Insights lazy chunk 545/128.5 → 580/137 kB (543.31/127.75
  → 579.62/136.48) — the v1.3 plain-language layer + ~150 copy strings × 2
  locales, all wording verbatim from the change request. The entry chunk
  (the converter money page) stays untouched at 290.36/87.08 vs 296/89.5.

### Added

- **The plain-language layer (§4):** "In plain words" block (S1 dollar ·
  S2 biggest movers · S3 Australian dollar · S4 mood), S5 money line in every
  pair panel; four-answer pattern cards (headline verdict, "What would change
  this", "In everyday terms"); the quiet-area rework ("Nearest to sounding the
  alarm", "{n} more quiet patterns"); the "How to read this section" drawer
  (5 items); 10 glossary tooltips; plain chart captions; the direction-aware
  "US dollar strength" row; stored `plain` fields (128 bytes — CR §6's < 1 KB).
- **`docs/specs/traceability.md`** — every requirement of both documents
  mapped to its implementation and its proof.
- **14 screenshots** in `docs/screenshots/` (en/fa × desktop/phone × all
  states), visually QA'd.

### Tests

- 1,058/1,058 workspace-wide (core 183 · scraper 67 · insights 339 · markets
  7 · api 136 · web 326), including the 31 new `fx-v13.test.ts` cases for the
  acceptance matrix T1–T11 + S5; typecheck 6/6; `pnpm copy:audit` clean.

### Repo tidy-up

Root now holds only README/CHANGELOG/AGENTS: the v1.3 change request moved to
`docs/specs/`, six superseded spec drafts/fix lists to `docs/specs/archive/`
(indexed), 16 Persian-copy working documents to
`docs/localization/persian-site-copy/`.

## [2026-10-13g] — Round-2 wrap-up: calendar titles live in the snapshot, final QA re-run

Closes out the 2026-10-13f wave. No code changed; this records the
operational finish line and the re-verified quality gates.

- **Calendar titles landed in the KV snapshot.** The 14 revised `titleFa`
  values (RBA «تصمیم بانک مرکزی استرالیا دربارهٔ نرخ رسمی بهره», Fed, ABS
  jobs/CPI, US CPI/jobs) are baked into the snapshot by the ingest. The
  2026-10-13T23:07 UTC dispatch confirmed every fetch/scoring step green —
  only the final KV write was refused by the account-wide free-tier daily
  cap (HTTP 429, code 10048). The first post-quota-reset ingest (run
  38487665811, dispatched 2026-10-14T00:00:48Z) succeeded and stored the
  snapshot (generatedAt 2026-10-14T00:01:14Z): all 22 calendar events now
  serve the revised titles live (verified in-browser; the scheduled 04:20
  UTC run is the standing backstop).
- **Final QA re-run on 996f496** (identical code to the deployed 841c783):
  typecheck 6/6 packages, 1,020/1,020 tests (core 183 · scraper 67 ·
  insights 334 · markets 7 · api 136 · web 293), `pnpm copy:audit` clean,
  CI green.
- **Redeployed the SPA/API worker** so the live deployment matches HEAD.

## [2026-10-13f] — Persian copy round 2 applied + permanent localization audit system

The owner returned all seven polished round-2 reference parts
(`persian_site_copy_round2_part1..7_*_polished-translated.md` — 1,522 entries,
every remaining fa string after round 1). The approved wording is applied
across the whole Persian surface, and the repo now carries a permanent audit
system so review status is never lost again.

### Applied (values only — keys, tokens, EN dictionary, logic untouched)

- **Insights dictionary** (`insights-copy-fa.ts`): 886 strings replaced
  (dashboard UI, markets/fx sections, money/signals/together panels, the
  47 indicator cards, the meaning one-liners behind `as Partial` casts).
- **App dictionary** (`fa.ts`): 225 strings replaced (converter core, tools,
  navigation, errors, accessibility labels); `currencies.irrLabel` is now
  «تومان (IRR)».
- **Calendar** (`data/insights-calendar.json`): all 14 remaining `titleFa`
  titles (RBA decisions now «تصمیم بانک مرکزی استرالیا دربارهٔ نرخ رسمی بهره»).
- **Inline strings** (ICS calendar name, header language chip/menu) and the
  four `format.ts` time-ago mirrors were reviewed and confirmed unchanged.
- No em dashes introduced; every `{placeholder}` preserved (verified
  programmatically); 7 test pins updated to the new approved wording;
  full suite green (1,020 tests).

### The audit system (docs/localization/)

- `persian-copy-manifest.json` — 1,842 entries: every user-facing fa string
  (1,802 dictionary keys, 22 calendar titles, 18 hardcoded literals) with its
  final text, a conservative sha256 fingerprint (NFC only), source location,
  round and reference. Statuses: processed / unreviewed / needs-review.
- `scripts/audit-persian-copy.mjs` (`pnpm copy:audit`) — AST-based checker:
  new dictionary keys, new hardcoded Persian literals (comments/tests never
  scanned), changed reviewed text, removed entries, en↔fa key parity, and
  time-ago mirror sync. Wired into CI as a gate next to the bundle budget.
- `scripts/update-persian-copy-manifest.mjs` (`pnpm copy:audit:update`) —
  records review decisions (snapshots current text; `processed` requires
  round+reference).
- `persian-copy-workflow.md` — the six-step workflow for future copy changes.
- `persian-terminology.md` — the approved financial glossary with fixed
  status/level vocabulary and context-sensitive pairs that must not unify.

### Budget

- Insights lazy chunk 501.96/122.69 → 543.31/127.75 kB (budget 505/123.5 →
  545/128.5): 1,087 insights strings replaced with the approved natural
  Persian — localized strings only, zero logic; entry chunk untouched.

## [2026-10-13e] — Revised Persian website copy applied (persian_site_copy_edited.md)

The owner uploaded `persian_site_copy_edited.md` (an editorially revised
Persian snapshot of the Insights page) as the authoritative reference. Its
revised wording is now applied to the live Persian dictionary
(`apps/web/src/i18n/insights-copy-fa.ts`), the shared Farsi terminology is
standardized wherever the same financial concepts appear, and the calendar's
Persian event titles follow the same wording. Values only — keys, tokens
(`{date}`, `{n}`, `{count}`, `{bandPos}`, …), the English dictionary and the
localization architecture are untouched, and no em dash was introduced.

### Changed (fa dictionary)

- **Hero/header**: subtitle, data-as-of line + snapshot tooltip, the
  prices-updated line, inAlert count sentence, the full verdict-rule
  methodology paragraph, hero-reason templates (now "از {n} حوزه، {k} حوزه
  یعنی «{names}» در وضعیت {word} قرار دارد" + "سایر حوزه‌ها …"), calm-list
  label, the biggest-move title/reason, the what-changed kicker, coming-up
  title, and the price-board intro.
- **Position vocabulary**: position10y → «جایگاه در بازه ده‌ساله»; the
  position words → «در سطح بالا / در محدوده معمول / در سطح پایین»; the
  price-tile status word → «بالا»; range-end labels → «کمترین/بیشترین مقدار
  در ۱۰ سال»; rangePast* window labels shortened («در سه‌ماهه», «در یک سال»,
  «در پنج سال») and the range chips «یک سال / پنج سال».
- **Indicator renames** (the reference's plain-language set): real yields and
  bond yields as «بازده واقعی اوراق قرضه ۱۰ساله آمریکا» / «بازده اوراق قرضه
  ۱۰ساله دولت آمریکا» / «… استرالیا», the yield curve as «فاصله بازده اوراق
  قرضه ۱۰ساله و ۲ساله دولت آمریکا», CPI-style cards as «تغییر قیمت‌ها در
  … نسبت به سال قبل», «شاخص ترس بازار», «شاخص دلار آمریکا در برابر شش ارز
  بزرگ», «دلار آمریکا/استرالیا در برابر ین ژاپن», «حجم پول در اقتصاد
  آمریکا», «نرخ بیکاری آمریکا», «سهم افراد بیکار در استرالیا», «رشد
  اجاره‌بها نسبت به سال قبل», «قیمت صادرات استرالیا در مقایسه با واردات»,
  «نرخ بهره وام مسکن پرداختی خانوارها», «نرخ سود سپرده‌های مدت‌دار جدید»,
  «قیمت طلا/نقره، هر اونس», «قیمت نفت برنت», «یورو در برابر دلار آمریکا».
- **Meaning one-liners** for every warning tile/card in the reference, now
  two-sentence plain paragraphs (real yields, US 10Y, brent, au-10y, home
  loan, wage growth, US CPI, trimmed mean, unemployment, au-cpi) plus the
  state lines the reference showed (highRising for real-yield/us10y/au-10y,
  jumping for brent, highEasing for gold/silver/breakeven, typical for
  yield-curve/stress/nfci/vix/dollar-basket/audusd/terms-of-trade, low for
  rent) and the definitional one-liners (au-trimmed-mean, au-cpi, au-home-
  loan, china-pmi, btc-usd).
- **Groups + gauge answers**: all nine group questions and answers rewritten
  («آیا هزینه وام‌گیری بیشتر می‌شود؟», «آیا بازارها نگران‌اند؟», «وضعیت
  تجارت و دلار استرالیا چگونه است؟», …); groupShort «هزینه وام‌گیری», «رشد
  اقتصادی».
- **Prices board**: gold-A$ line, below-peak wording («پایین‌تر از سقف ده‌ساله
  خود»), the bitcoin ratio sentence («با قیمت فعلی، یک بیت‌کوین معادل …»),
  price captions («داده‌ها تا تاریخ …»), companion notes for US CPI (energy
  gap) and au-10y (for comparison).
- **World markets**: subtitle, as-of caption («تاریخ داده‌ها: …»), the
  in-correction count, tile tags («پایین‌تر از سقف یک‌ساله», «در سقف
  یک‌ساله»), the local-currency note, takeaway/hero-alert templates, the
  measure label «بازارهای سهام: چند بازار با فاصله از سقف یک‌ساله».
- **World currencies**: subtitle with «؟», as-of caption, warning-line and
  distance-bar formats («{pair}: {value}؛ آستانه هشدار: {threshold}»), the
  dots/reliability lines, level-3 toggle («چرا این الگو کار می‌کند و اعداد
  چه می‌گویند؟»), closest-to-warning label, quiet-patterns line, the
  dollar-row title («دلار در برابر ارزهای جهان») + its "you" line, r6's
  name («نگرانی درباره اروپا»), the r7 euro-led see/means pair, the opposite
  chart caption, the ECB-rates footer line, and fx units («به‌صورت شاخص»,
  «به‌صورت نسبت»).
- **Money panel**: section title/subtitle, the direction words («احتمال
  افزایش هزینه‌ها» / «احتمال دریافت سود بیشتر»), the savings + shop row
  names, and all four attention sentences.
- **Signals**: title with «؟», subtitle, merged title («شرایط مؤثر بر طلا و
  نقره»), the lean wording + metal-lean template, verdict title («شرایط
  فعلی») and the down verdict sentence, the against wording («در تضاد با
  الگوی معمول»), the gold-high-yields warning, all six condition names/how
  lines, silver-only heading («فقط برای نقره»), the footing block
  («سطح قیمت» + «جایگاه قیمت در بازه ده‌ساله: {band}») and the 30-day
  speed label («تغییر ۳۰روزه»).
- **Together**: section title («ارتباط میان شاخص‌ها») + subtitle + evidence
  note, the right-now active line, the per-leg move verbs («افزایش می‌یابد» /
  «کاهش می‌یابد»), and the three revised connections (names, leg labels,
  relations).
- **About the data**: credits line, sources body, FRED local note, the
  RBA/ABS/ECB/basket/EODHD attribution lines, schedule + rules + disclaimer
  rewrites, the FRED notice heading, and the backtest line.
- **Shared terminology sweep** (same concepts, consistent wording):
  borrowing costs «هزینه وام‌گیری» through the us10y state lines/forYou and
  the au-us-10y-gap name, real-yield lines and one-liner «بازده واقعی»,
  au-10y's highEasing/low «بازده اوراق قرضه ۱۰ساله استرالیا», M2 «حجم پول»
  (name, one-liner, meaning), and the yield-curve one-liner «فاصله بازده».

### Changed (data)

- `data/insights-calendar.json`: all abs-jobs Persian titles now read
  «گزارش وضعیت بازار کار استرالیا: …» and all Fed titles «تصمیم فدرال رزرو
  آمریکا درباره نرخ بهره» (the reference's event-strip wording).

### Tests / budgets

- `markets-verdict.test.ts`: the attributionEodhd pin follows the revised
  line; `insights.test.ts`: the Arabic-keyboard normalization test now rides
  the revised au-unemployment name («بيكار» → «سهم افراد بیکار در استرالیا»).
- Insights chunk 493.99 → 501.96 kB raw / 120.95 → 122.69 kB gzip; budget
  bumped to 505/123.5 with this note. All localized strings, no logic; the
  entry chunk untouched. `pnpm -r typecheck` clean, 1,020/1,020 tests pass,
  `pnpm build` clean.


## [2026-10-13d] — Sources off the cards (attribution lives in the footer and the Sources section only)

Owner request 2026-10-13: the price tiles and indicator cards must NOT carry
source labels ("· Yahoo Finance: COMEX gold futures (GC=F)", "· FRED", …).
Every source is named and linked in exactly two places now: the details panel
footer (full sourceName with series ids, linked) and the About this data →
Sources section at the foot of the page.

### Changed

- **PricesBoard**: the tile's caption row drops the "· {source}" bdi; it keeps
  the as-of date and the stale chip. The comment trail (Step-1 A9) now points
  to the details panel for the contract attribution (BZ=F futures vs the EIA
  spot base).
- **AlertCard**: the bottom caption row drops the "· publisher" segment; the
  data date, released-on date and stale tag stay.
- **config.ts**: the `friendlySource` publisher-trimmer (R30) died with the
  card labels — removed with its comment block replaced by the new rule
  (sources live in the details panel footer + About/sources, never on faces).
- **Copy (en/fa)**: `aboutSourcesBody` no longer claims "Each card names and
  links its own source" — it now says each source is named and linked in the
  details panel and in the Sources section, never on the cards. The unused
  `sourceLabel` key was removed from both dictionaries (fa is typed against
  en, so the removal is structurally guaranteed to stay in sync).
- **Card-face copy de-sourced (en/fa)**: the oneLiner lines that render on
  card faces via the consequence fallback dropped their data-provider
  mentions, moving them into `whatItIs` (details panel) where they belong:
  btc-usd ("an hourly quote from Yahoo Finance's spot index on a daily
  gold-api.com backbone" now lives in whatItIs; the oneLiner is simply "The
  world price of one bitcoin, in US dollars."), au-petrol-yoy ("as the ABS
  measures it" dropped) and au-wage-growth ("by the ABS wage price index" →
  "by the wage price index"). Subject naming stays on faces by design: "the
  RBA's 2–3% band", "The St. Louis Fed's single gauge", "the ECB's deposit
  facility rate" name WHAT is measured, not who supplied the data.
- **packages/insights definitions.ts**: comment-only touch (the A9 note now
  says the details panel, not the tile, carries the attribution).

### Untouched on purpose

- The details panel footer (the linked source + as-of date) — it IS a footer.
- The About this data → Sources section and the always-visible credits line.
- The calendar badges (RBA / CPI / JOBS / FED): they name the EVENT, not a
  data source. The converter app's SourceBadge (TGJU/Frankfurter) is a
  different feature and was not part of the request.
- CSV exports still carry per-row source names (a data export, not a card).
- Data layer: `sourceName`/`sourceUrl` still flow through the API and the
  Step-1 G3 attribution rules; only the card-face renders changed.

Checks: `pnpm typecheck` clean, `pnpm test` 1,020/1,020 (core 183, scraper
67, insights 334, markets 7, api 136, web 293), `pnpm build` clean,
`check-bundle-budget` held (Insights chunk 493.65 kB / 120.80 gz — smaller
without the trimmer).

## [2026-10-13c] — The bilingual content audit (Persian + English editorial pass)

Owner request 2026-10-13: a comprehensive audit and rewrite of ALL Persian
and English user-facing text, edited as a bilingual financial desk would:
natural, idiomatic, accurate, plain enough for non-economists, no em dashes,
no literal translation artifacts. Scope: the full Insights corpus
(insights-copy-en/fa: 41 indicators × 6 fields, consequence lines, meaning
lines, markets + fx sections, together/signals/money), the main dictionary
(en.ts/fa.ts: converter, alerts, boards, receipt, splitter, settle, batch,
about, errors), and the PWA manifest name. Code, keys, interpolation tokens,
units logic and all tests' semantic guarantees are untouched; every pinned
string stayed pinned (fx headlines, attribution lines, leg phrases, band
labels).

### Persian (the bulk of the work: ~440 strings rewritten)

- **Broken grammar repaired**: «فشار دلاریِ همیشگی پیداست نیست» → «دیده
  نمی‌شود»; «پس یک ماجرای جهانی است» → «پس ماجرایی جهانی است»;
  «فرانسه دومین اقتصاد بزرگ منطقهٔ یوروست» → «یورو است»;
  «رکورد دلاری، رکوردِ قدرت خرچ نیست» → «خرج» (typo); «دلار آمریکای
  قوی» → «دلار قوی آمریکا»; «میانگین است: پنهان می‌کند بدهی...» →
  «و پنهان می‌کند که...».
- **Calques replaced with natural Persian**: چرخ‌فلک (Ferris wheel!) →
  الاکلنگ for the see-saw; لوله‌کشی بازار (market plumbing) → سازوکار
  بازار; قرائت‌های نوجوانی/دههٔ بیستی (VIX "teens/20s") → ارقام نوجوان
  (زیر ۲۰) / حدود ۲۰ تا ۳۰; سوپر (superannuation) → صندوق بازنشستگی;
  قبض بهره (interest bill) → هزینهٔ بهره; لکه‌های ۲۰۱۷ (pockets) →
  افت‌های موضعی; ترس از رشد (growth-scare) → نگرانی از رشد; کاشی →
  کارت (view-switch aria); جفت کارری → جفت کری ترید (media usage);
  «هدف نرخ اسکناس» (wrong term for the RBA cash rate) → «هدف نرخ
  بین‌بانکی شبانه»; هم‌زادیِ پس‌اندازی → قرینِ پس‌اندازی; آینه‌عقب →
  reworded; فشارسنج زیرِ نظر بازارها → بارومتر ریسک.
- **Terminology unified across the corpus**: headline inflation → تورم کلی
  (was تورم سرنویس); percentage points → واحد درصد (was نقطه; test
  updated to the new term); safe haven → پناهگاه امن (was ارز امن in two
  places); tight/tightening policy → سخت‌گیرانه (was سفت, in six lines);
  loose → آسان (was شل); Works against → در تضاد است everywhere (verdict
  words now match the Round-32 owner decision); Mixed → مختلط (was the
  odd آمیخته); Unusual → غیرعادی (fx chip was غیرمعمول); demand deposits
  → حساب‌های دیداری (was the ambiguous حساب جاری); preferred measure →
  ترجیحی (was محبوب); gold "Used Gold" → طلای کارکرده (the Tehran market
  term; also نیم‌سکه/ربع‌سکه half-spaces).
- **Half-spaces, ezafe and punctuation**: به‌روزرسانی لحظه‌ای (was به
  روزرسانی لحظه ای), ساخته‌شده, تولیدشده, جست‌وجوی, دادهٔ قدیمی,
  هزینه‌های روزانهٔ خود, عادی‌سازی of the "jumping" lines (پیش از
  برداشتِ روند کمی صبر کنید), and the double-colon footnotes (gold
  boards) restructured in both locales.
- **Semantic fixes**: fed-target whatItIs said «نقطهٔ میانی بازهٔ هدف»
  while the card (per the Step-1 audit) shows the FULL RANGE — now
  «بازهٔ هدف»; au-home-loan "outstanding" → وام‌های جاری (was باز, which
  reads as "variable"); savings "overseas money can stretch further" was
  mistranslated as «دوام بیاورد» — now «خرج بردارد»; fa aboutRulesBody
  carried an extra backtest sentence the EN lacks — dropped for parity.
- **Em dashes**: all 30 user-facing — removed (parentheses, semicolons or
  colons as fits each sentence); code comments untouched.

### English (~80 strings)

- All user-facing em dashes removed (Sahm rule cluster, dataForStale,
  collapsedStale ×2, hero alert lines, scoredFact/contextOnlyFact, the
  CAC/Dow entries, goldHighYieldsWarning, attribution body, backtest note).
- Plain-language fixes: "the 20s" → "those in the twenties" (VIX);
  "dollar wallets" → "anyone holding dollars"; "approximates the bowser" →
  "only approximates the pump" (bowser is Australian-only); "hang tight" →
  "give it a moment"; "ONE count rule" → "a single count rule";
  "Aussie dollar" → "Australian dollar" (register consistency);
  "sat at historic highs through 2023–26" → "have sat at historic highs
  since 2023"; the muddled au-10y "the decade before sat far lower after
  2020's emergency setting" untangled.
- Main dictionary: error-text punctuation, the honest alerts note expanded,
  no-internet copy gets its article, the About intro de-jargoned, the batch
  subtitle hyphen, gold-board footnotes' double colon.

### Housekeeping

- PWA manifest name: "Currena — Currency Converter" → "Currena | Currency
  Converter" (matches the document title; em-dash rule).
- Price-tile attribution (the data layer): the four live-quote source names
  "Yahoo Finance — …" → "Yahoo Finance: …" (brent/gold/silver/bitcoin);
  the stored snapshot picks the new names on the next hourly refresh.
- Bundle budget: Insights lazy chunk 493/121.5 → **495/121.5 kB** (raw
  +2.18 kB from longer-but-natural Persian; gzip actually fell to 120.95).
  The entry chunk is untouched (290.36/87.08).
- One test expectation updated with the terminology change
  (formatChange fa points unit: نقطه → واحد درصد). All 293 web + 136 api
  + 334 insights tests pass; typecheck clean.

## [2026-10-13b] — Always-live serving + path-URL routing (the /insights#/ fix)

Owner report 2026-10-13: "I didn't see those [Step-2] fixes — and why does
`https://currena.ir/insights#/` happen? The server seems to show a cached,
stale page to outside visitors (firecrawl mirrors are pre-fix). Currena must
ALWAYS show the live version; only show cached when there is no internet."

Diagnosis first (the deployed state was audited BEFORE any change): GitHub
main was current (31b3d3d), currena-api was the Step-2 deployment
(cebc12de), and the live edge was serving the Step-2 chunks (Insights
491.81 kB with sahm/vix/deposit/unemployment inside) — nothing was actually
un-deployed. Two CLIENT-side defects made it LOOK stale:

1. **Path URLs booted the wrong page.** Visiting `https://currena.ir/insights`
   (typed, shared, crawled — no `#`) hit the SPA-fallback, and the boot's
   belt-and-braces `navigate('/')` APPENDED a stray `#/` — URL
   `/insights#/`, content: the converter. Every crawler that renders the
   path URL (firecrawl web-to-md) extracted the CONVERTER, which reads as
   "a cached pre-fix mirror".
2. **Service-worker navigations were precache-first.** workbox's
   `navigateFallback: 'index.html'` answered every navigation from the SW's
   precached copy, so a visitor (or installed PWA) kept seeing the PREVIOUS
   deploy until their SW rotated — the stale-page trap this project already
   lived through in its prompt-mode variant on 2026-09-19.

### Fixes

- **Path visits adopt their route** (`apps/web/src/router.ts` +
  `App.tsx`): `/insights` is rewritten IN PLACE to `/#/insights`
  (`history.replaceState` — no reload, no history entry, no stray `#/`) and
  renders the Insights page; `/insights?card=us10y` share links and
  `/?from=EUR&to=IRR&amount=500` converter deep links work from the address
  bar for the first time; trailing slashes tolerated; unknown paths land on
  the converter as before. Pure core (`canonicalHashFor`) unit-tested —
  router tests 7→12.
- **Navigations are network-first** (`apps/web/vite.config.ts`): the
  navigateFallback is GONE (the explicit `navigateFallback: undefined` is
  load-bearing — vite-plugin-pwa defaults it back to `'index.html'` and
  workbox registers its precache-first NavigationRoute BEFORE runtime
  routes); a `NetworkFirst` runtime route (`currena-documents`, 5 s
  network timeout) now answers every same-origin navigation — the network
  is always asked first and the cache answers ONLY when offline, exactly
  the owner's rule. /api, /internal and /admin never reach it. Hashed
  assets stay precache-first (immutable per deploy — a new build changes
  every hash, so the precache can never serve an asset the live HTML
  doesn't reference).
- **`_headers` for the assets platform** (`apps/web/public/_headers`):
  `/assets/*` are `max-age=31536000, immutable` (content-hashed — always
  correct, one revalidation round trip cheaper); `index.html` and `sw.js`
  revalidate on every request.

Gates: typecheck 6/6, tests 1020/1020 (web 288→293), bundle budgets held
(entry 290.36/87.08, Insights 491.82/120.65).

## [2026-10-13] — Insights Step-2 add list (the missing indicators)

The owner's three-step plan continues: **Step 2 — add the few missing
indicators that matter to a regular Australian saver-investor**, per the
uploaded `currena-insights-step2-add-list (1).md`. Every new card follows the
file's §A card spec (source + data date + stale tag + condition wording +
stored history); nothing from the §F "do not add" list is built. Phase-1 audit
first: every Step-1 fix re-verified live (nothing left behind — see
docs/evidence/step1-audit/ and the worklog).

### B. The seven required additions

- **RBA cash rate card finished (§B1).** The card moved into
  `au-households` NEXT TO the home-loan card (both render from the same
  snapshot), states the LAST CHANGE as its exact step (the new engine
  `lastChange` field: date + size, e.g. "+0.25 pts on 29 Sep 2026" — not a
  30-day window that loses a six-week-old decision) and the NEXT RBA
  decision date from the calendar ("Next RBA decision: Nov 3, 2026").
  Context-only, as the file specifies.
- **Australian 10-year government bond yield (§B2).** RBA statistical
  table F2, series FCMYGBAG10D (venue-verified: published 09-Oct-2026,
  daily; the same series the au-us-10y-gap card already subtracts). Scored
  on its 10-year position; the US 10-year yield rides INSIDE the card as a
  comparison companion ("shown for comparison") via the new COMPANIONS map.
- **US unemployment (§B3).** FRED UNRATE (live-verified: Sep 2026 = 4.2).
  Scored on its own 10-year level — the "rising fast" signal belongs to
  the Sahm card beside it, so the pair never duplicates.
- **Recession alarm — the Sahm rule (§B4).** FRED SAHMREALTIME
  (live-verified: Sep 2026 = 0.00). Threshold above 0.50, the standard
  signal, with the rule explained in one plain line on the card.
- **Market fear gauge — VIX (§B5).** FRED VIXCLS (live-verified: Oct 9 =
  14.84; Cboe data redistributed through FRED, © Cboe noted on the card +
  About + the commercial-licence review list). Scored on its 10-year
  position; the card ALWAYS shows the value + its 10-year position, and
  the details panel states that the calm/nervous word thresholds arrive
  with the Step-3 verdict rules (computed from the stored history).
- **Iron ore — context only (§B6).** The World Bank Pink Sheet stays the
  source (FRED's PIORECRUSDM mirror of the same series LAGS ~2 months —
  verified: WB carries Sep 2026 = 97.7 while FRED ends Jul 2026; the card
  names the WB source). The rule flipped from percentile to info: iron ore
  never votes, removing it from the au-trade-currency gauge; the
  iron-terms-aud relationship card reads the same reading (always has).
- **"Savings and interest" finished with a real deposit rate (§B7).** RBA
  F4.1 "Paid Deposit Rates", series PDRNTH — the weighted-average rate
  banks actually pay on NEW household term deposits (venue-verified:
  August 2026 = 4.8% per annum, table published 08-Oct-2026; the old F5
  layout no longer exists). The savings money-row now leads with THIS
  number + its data month + the piggy-bank artwork, the cash rate stays
  as context, and the row's state/votes read from the same readings.

### A. The card spec, applied to every new card

- Source name + series ID + link (details panel); how often the source
  updates; how old data may get before the "stale" tag (the details
  panel's new facts block: "Updates monthly · shows 'Stale' after 70 days
  · Fetched … · Scored/Context only"); units in percentage points for
  rates; data-for + released + fetched dates; condition wording only.
- **History storage raised to the spec's minimum**: the per-indicator
  history cap moved from 520 (weekly-ish stride) to 2,700 points — a
  10-year DAILY series now stores its full daily window (VIXCLS, DGS10,
  F2, F1…), monthly series keep their full 10 years, and the au-deposit
  series keeps its whole 2019–extent (the table's full history). Step 3's
  verdict rules compute from exactly these stores.
- KV write budget: ~5 new history keys/day on top of the ~750-write
  headroom at the 04:20 UTC ingest slot — no scheduling change needed.
- The FRED release-dates API needs an API key the project does not hold
  (noted for §D): US calendar dates are hand-maintained in the data file
  after verification.

### D. Calendar — the six events that move Australian money

- Two new event kinds join RBA/ABS-CPI/Fed/US-CPI: **abs-jobs** (ABS
  Labour Force: Oct 15, Nov 19, Dec 17 2026 — verified from abs.gov.au)
  and **us-jobs** (US Employment Situation: Nov 6, Dec 4 2026 — verified
  via the Forex Factory aggregated calendar after bls.gov and archive.org
  proved unreachable; the Oct 14 US CPI date cross-checks with the same
  source and the owner's own audit file). US CPI extended (Nov 10, Dec
  10). Release-schedule entries added so us-unemployment/sahm-rule/
  au-deposit-rate/au-unemployment cards state their release dates.
- All events stay plain dates + their own timezone (the Step-1 rule).

### E/F. Placement + scope

- au-10y joins au-inflation-rates; rba-cash-rate + au-deposit-rate join
  au-households around the home-loan card; us-unemployment + sahm-rule
  join growth-health; vix joins market-stress; iron ore stays in
  au-trade-currency as context. The hero counts follow automatically from
  the SAME E1 verdict rule (no new mapping). Voters: 32 (19 global +
  13 AU). Nothing from the "do not add" list was built; the two §C
  optional items (AIP petrol, AUD/CNY) were NOT approved and were not
  built.

### Tests + gates

- 1,015 tests green (core 183 · scraper 67 · insights 334 · markets 7 ·
  api 136 · web 288), typecheck 6/6 clean, bundle budgets held (Insights
  chunk 465.61→491.81 kB raw / 114.56→120.66 gz — budget bumped to
  493/121.5 with this justification; entry chunk untouched).

## [2026-10-13] — Insights Step-1 fix list (the 12 Oct audit) + the fx evidence artifacts

The owner's external audit of https://currena.ir/#/insights (snapshot dated
8–11 Oct 2026) produced a three-step fix list; this wave is **Step 1: fix
everything that is wrong on the existing page** — wrong or outdated numbers,
date handling, calculation and label errors, contradictions, hero verdict
mapping, stock-row presentation, forecast wording, trust/compliance items
and the data pipeline. No new indicators (except the core-CPI companion
line, which the audit itself asked for on the US inflation card); Step 2
(missing indicators) and Step 3 (live verdicts) stay future work.

### A. Wrong or outdated numbers — Fixed

- **Fed target range (A1).** The card now shows the TRUE published corridor
  from FRED's DFEDTARL/DFEDTARU ("3.75%–4.00%"), not a midpoint with a
  hard-coded 25bp skirt (the old render mixed the lower bound with the
  midpoint: "3.75% to 3.88%"). `value` carries the lower bound; the upper
  bound rides the new `rangeHigh` field.
- **Australian inflation (A2).** au-cpi/au-trimmed-mean switched from the
  retired quarterly keys to the **ABS monthly CPI** (CPI/1.10001.10.50.M +
  CPI/1.999902.20.50.M — live-verified: August 2026 annual **4.0% headline /
  3.6% trimmed mean**, exactly the audit's reference values). Cadence
  monthly; the card shows the DATA MONTH and the official release date.
- **US inflation (A3).** Core CPI (CPILFESL) joins the payload as a
  context companion rendered INSIDE the headline card — "Core inflation
  2.4% · The gap between them is mainly energy." — never its own row.
  The card's date speaks the data month + release date, never "Updated Jul 31".
- **RBA cash rate (A4).** The engine now reads the DAILY F1 "Cash Rate
  Target" (a decision-day move shows at once — the Sep-2026 hike reads
  4.60% from its effective date), with F1.1 monthly kept as the fallback.
  The savings money-row leads with the cash rate and wears a new
  piggy-bank artwork (the old row showed the inflation rate under a
  stock-exchange icon).
- **Other AU/US series (A5/A6, verify).** Verified against the live
  sources: wages/home-values/terms-of-trade already sit at 2026-Q2 (the
  audit snapshot predated the Q2 release), unemployment at August, M2 at
  August, US CPI at August (3.35% → 3.4%), govt-interest-revenue at the
  freshest BEA quarter FRED carries. The data-check evidence is in this
  wave's live verification.
- **Stock market dates (A7).** Every row and tile already shows its own
  last trading date; a market **more than one trading day behind the
  freshest close now wears a "Delayed" tag** (the honest name for the
  provider lag the audit caught on TSX/Ibovespa), and the weekend rule is
  pinned by a trading-day counter (never a Saturday/Sunday date).
- **Brent (A8) + Bitcoin (A9).** The tiles name their source AND contract:
  Brent's backbone is the EIA spot series (FRED), the live tile is
  front-month futures (BZ=F) on Yahoo Finance; gold/silver name their
  futures (GC=F/SI=F) over the gold-api spot backbone; Bitcoin names its
  Yahoo spot index. The live-merge attributions carry the same wording.

### B. Dates and calendar — Fixed

- **Decision days (B1).** The calendar dates were already decision days in
  the data; the one-day shift was a RENDERING bug — date-only ISO strings
  were parsed as UTC midnight and formatted in the browser's local
  timezone (behind-UTC viewers saw the FOMC on 27 Oct and the RBA on
  2 Nov). Date-only strings now format in UTC everywhere (core format.ts).
- **ABS CPI labels (B1).** "September quarter" → "ABS monthly CPI:
  September 2026" (all entries re-titled; the quarterly ids renamed).
- **US CPI calendar event (B4).** Added: 14 Oct 2026 (kind `us-cpi`), wired
  to the US inflation card.
- **Days away (B3).** Already computed at page load from today's date —
  the printed date was the bug (fixed above).
- **A date on EVERY card (B5).** Every card and row now carries its data
  date — "data for August 2026" for monthlies/quarterlies (the observation
  month, never the fetch date), "as of 9 Oct 2026" for dailies — plus the
  official release date when the new hand-maintained
  `data/insights-release-schedule.json` knows it (US CPI 11 Sep / 14 Oct;
  ABS monthly CPI 30 Sep / 28 Oct / 25 Nov), including Normal-state cards
  (the audit: terms of trade showed none).

### C. Calculation and label errors — Fixed

- **Gold/Silver per Bitcoin (C1/C2).** The old labels were inverted ("Gold
  per Bitcoin: 0.0509" is oz-per-bitcoin). Now: **"One bitcoin buys 19.6
  oz of gold"** / **"One bitcoin buys about 1,368 oz of silver"** — the
  display inverts the stored fraction, so the number always matches the
  sentence.
- **Gold/silver ratio (C3).** The ratio is recomputed at serve time from
  the SAME live snapshot the two tiles show (it was one generation behind
  and disagreed with the prices beside it).
- **Euro per US dollar (C4).** "US$0.8944" → **"€0.8944"** (fa: یورو).
- **Percentage points (C5).** Every rate-type series (US/AU CPI, trimmed
  mean, petrol, rent, wages, home-loan, govt-interest share) now expresses
  changes in POINTS; % stays for prices and indexes. The +88.1%/+35.6%/+12.7%
  relative-of-a-rate artifacts are gone.
- **"30-day" on monthly series (C6).** Monthly/quarterly changes are now
  computed vs the PREVIOUS RELEASE and labelled "since previous release".
- **M2 (C7).** "bn23,343" → **"US$23.3 trillion"** (+ its data month).
- **Savings row (C8).** See A4 — a real deposit-linked rate (the cash
  rate) with the right icon.
- **10-year position on trending totals (C10).** M2 and home values
  measure their 10-year position on YEAR-ON-YEAR GROWTH (the level-based
  percentile was permanently pinned near 100% just for rising); the cards
  say so.
- **Distance from the peak (C9).** Gold, silver, Brent and Bitcoin carry
  "x.x% below its 10-year peak" — the same honesty the stock tiles have.
- **Estimation chart (C11).** The delta now reads "−5.5% over the past
  quarter" — the window word is visible, clearly a past change.
- **Real yields (C12).** The daily staleness grace was tightened to stop
  the false "Stale/Cannot read" (FRED's H.15 series publish a day late);
  the gold card gained the audit's requested warning when gold sits near
  its decade high WHILE real yields are also high.

### D. Contradictions — Fixed

- **Status is the single source of truth (D1).** Consequence lines never
  claim a direction without a measured change (a high band + no measurable
  move now falls back to the neutral oneLiner — the old code called every
  unmeasured case "easing", contradicting the money panel's "becoming
  more expensive" on the same number).
- **Petrol (D6).** The money row's direction reads from the SAME rule that
  fired (brent's out-of-range rise rule ⇒ "Becoming more expensive", never
  "No clear direction" beside an oil warning).
- **ECB card (D3).** The policy-rate cards (ECB, Fed, RBA) state the SIZE
  OF THE MOVE as its own labelled line ("Recent move: +0.25 pts") beside
  the level line.
- **Inflation expectations (D4).** Re-backtested against the full FRED
  T5YIFR history (p50 2.18 · p80 2.30 · p95 2.40): the old top-20%-of-
  decade rule flagged 2.32% as "Needs attention" while the 2024–26 regime
  median sits at 2.26. New evidence rule: **above 2.4% sustained 4 weeks**
  — it fired exactly once in the decade (autumn 2023) and never on noise;
  the rule is shown on the card.
- **Oil in the hero count (D5).** Oil IS scored and the About section says
  so plainly (the copy no longer claims "prices are context, not scored").
- **Oil cause claims (D8).** "often war or supply shocks" → "usually war
  or supply shocks" (both locales).

### E. Hero summary and verdict words — Fixed

- **One mapping (E1).** The region verdict word comes from ONE count rule
  (in gauges.ts, used by both regions and displayed on the page):
  Critical = ≥2 areas critical or every area stressed-or-worse; Stressed =
  ≥2 areas stressed-or-worse or most areas cautious-or-worse; Cautious =
  any area above calm; Stable = all calm. The audit's exact snapshot now
  reads Australia [3,3,1] → Stressed (was "Cautious") and Global
  [4,1,1,1,1] → Cautious (was "Stressed").
- **Stock headline (E2).** The attention tier says **"Mixed: 5 of 16
  markets in correction"** — never a section-wide "Correcting" while 11
  markets are calm (the dedicated word returns with Step 3).
- **Calm areas named (E3).** Each hero lists its calm areas ("Calm:
  borrowing costs, market stress…") beside the stressed ones.

### F. Stock rows — Fixed

- **Column headers (F1).** The mobile row list gained the label header
  (Market · Today · 3 months · From 52-week high) + per-number sr-only
  labels; the desktop table always had them.
- **Trend word and number (F2/F3).** ONE flat threshold (±1%) for every
  market and view; the trend WORD and its ARROW both come from the number
  the row shows (3-month by default) — the DAX "+0.6% up-arrow labelled
  Down" mismatch is gone (the old word came from each market's 50-day MA).
- **Local currency (F4).** "Returns in each market's local currency" sits
  beside the view switch (and in About).
- **52-week distance everywhere (F5).** Every tile shows it — including
  S&P 500 and Nasdaq; a market at its high says "At its 52-week high".

### G. Wording, compliance and trust — Fixed

- **The forecast rename (G1/G2).** The card is **"Conditions for gold and
  silver"**, the strip says **"Conditions right now"**, and the verdict
  words are **"Supports / Works against / Mixed / Cannot read yet"** —
  "will go up / will go down" was a forecast and contradicted the page's
  own "conditions, not forecasts" line. The whole corpus was swept for
  "will / should / time to / expected to" (EN + FA) and the remaining hits
  rewritten as conditions.
- **Sources line (G3).** The accurate list: official publishers (Fed/FRED,
  BLS via FRED, ECB, RBA, ABS, World Bank) PLUS the market-data providers
  (Frankfurter, gold-api, EODHD, Yahoo Finance), with the licence-review
  note for commercial use.
- **Dollar basket (G4).** "Not the official DXY" rides the CARD itself
  (the oneLiner), not only the footer.
- **Backtest sentence (G5).** Appears once, and states its sample: "three
  crises — 2008, 2020 and 2022 — a small sample".
- **"Live" wording (G7).** The tiles' copy names hourly futures quotes on
  a daily backbone, and the page header shows **"prices updated HH:MM"**
  beside "Data as of {date}" (the live-prices clock is now served in the
  payload as `pricesAsOf`).
- **Disclaimer (G6).** Unchanged in content — the audit's ask (an
  Australian professional review before commercial use) is recorded in the
  About section's licence note and the docs.

### H. Data pipeline — Fixed

- **Stale tags (H1).** The daily grace moved 3 → 5 days (FRED's H.15
  series publish a day late; a Friday obs is legitimately 3 days old by
  the next ingest — production evidence: DGS10 obs 2026-10-08 reading
  `stale` on Oct 12 while FRED confirmed it was the freshest print that
  existed). Every card shows its stale tag when past its release schedule.
- **Relationship cards (H2).** The two "not enough fresh data" cards
  (incl. oil→expectations→borrowing costs) read again — their legs were
  the false-stale DGS10/DFII10 rows.
- **Fetch failures (H3).** A failed source now HOLDS the last good value —
  carried forward with its ORIGINAL asOf (never today's date) and marked
  `stale`; the ingest still exits red for P1 fetch failures (the operator
  keeps the signal, the reader keeps the number).

### Spec finish-line artifacts (world currencies)

- **The evidence run (§6.6, step 3)** — `pnpm --filter @currena/insights
  fx-evidence` replays 522 weeks (2016-10 → 2026-10) through the
  production rule engine: R1 7.5% of weeks / R2 2.9% / R3 11.7% / R4 6.5%
  / R5 15.3% / R6 4.0% (all under the 15% usefulness bar except R5,
  marginal — flagged for Ali), the known episodes (2018–19, March 2020,
  2022, Aug 2024, Apr 2025) all caught, and the pattern check tallies
  Holding/Mixed/Not-holding. Committed as
  `docs/specs/insights-world-currencies-evidence.md`.
- **The fx data check (step 0)** — both providers side by side for all 10
  pairs (10/10 within 0.5%, 4 exact). Committed as
  `docs/specs/insights-world-currencies-data-check.md`.
- The markets data-check gained its KV-usage record (§4 rule 9: ≤1
  write/day confirmed over the first five live days).

### Contract + budget

- `IndicatorReading` gains optional `rangeLow/rangeHigh/fromPeak10y/
  releaseDate`; the snapshot gains serve-time `pricesAsOf`; the calendar
  gains the `us-cpi` kind; `IndicatorDefinition` gains `percentileBasis`;
  +1 indicator id (`us-cpi-core-yoy`, context-only — the card companion).
- Insights lazy chunk 450.10/110.38 → **465.61/114.56** (budget bumped to
  469/115.5, itemised in scripts/check-bundle-budget.mjs; the entry chunk
  untouched at 290.37/87.83). 1,000 tests green across the monorepo
  (183 core + 67 scraper + 328 insights + 7 markets + 136 api + 279 web).

## [2026-10-13] — World currencies: the patterns section (direction B)

The Insights page's sixth dedicated section (insights-world-currencies-spec.md
v1.2, layout direction B chosen by Ali 2026-10-12): what the big currencies
are TELLING us — seven named patterns with two-part verdict sentences, the
pair numbers inside each pattern, and one table of all 10 pairs behind a
button. Verdicts first, numbers support them; no tile strip, no period
switch. Rebuilt end-to-end after the original build session's branch was
lost before it was ever pushed (the engine recovered verbatim from that
session's logs; everything else rebuilt from the spec).

### Added

- **The fx analysis engine** (`packages/insights/src/fx/compute.ts`) — pair
  derivation (crosses are code, never a call), the four period changes,
  `move_rank` (the "Unusually large move" tag), the reused Currena dollar
  basket as the "Dollar vs the world" measure (decision D-06: the repo's
  existing DXY-recipe basket, CAD+SEK join the provider call for it), the
  13-week pattern checks, the seven rules R1–R7 with the §6.4 downgrade
  pass (a Warning whose pattern is Not holding lately becomes a Watch and
  does not count), the distance-to-warning `progress` bars, and the §6.5
  section signal (0 counted = normal, 1–2 = attention, 3+ or the R4
  "confidence wobble" = unusual). Everything PURE and linear-time.
- **Provider adapters** (`fx/providers.ts`) — Frankfurter v1 (the frozen
  ECB-only API, ONE whole-currency timeseries call per run) with the Yahoo
  Finance chart fallback (8 currency calls, inverted where Yahoo quotes
  USD-per-currency); V1–V7 validation (a >5% one-day move needs both
  providers' agreement within 0.5% before it is believed).
- **The fx job + storage** — `insights:fx:v1`, ONE KV key, write-only-if-
  changed (content hash, never generatedAt); the cross-section reads (the
  stock legs from `insights:markets:v1`, gold from its history key, R1's
  fear leg from the stored market-stress gauges — decision D-05: no VIX
  exists in the repo). The job rides the currena-markets Worker's two
  existing cron triggers (spec §4.4's fallback: the account's 5-cron free
  limit is full), fault-isolated from the markets job. A `fx-run` manual
  seeder script (the REST "Path B") for initial population.
- **Market rows gain `chg1m`** — the 1-month change the currency rules read
  (S&P 500, Nikkei 225, Euro Stoxx 50). OPTIONAL in the contract: a stored
  snapshot written before this change simply lacks it, and the fx engine
  treats its absence as "input missing" (a nodata rule row), never a guess.
- **`GET /api/insights/fx`** — the stored snapshot read-only behind the
  spec's cache discipline (edge cache + `max-age=300, s-maxage=3600` +
  content-addressed ETag + 304s + the calm 503 `fx_not_ready` "being
  prepared" answer). One KV read per request; the full 10-pair payload
  stays well under the 20 KB budget.
- **The WorldCurrencies section** (§9 anatomy, direction B) — the §9.10
  measure-label verdict line + one §10.3 headline sentence; pattern cards
  (Level 1 collapsed rows, Level 2 opened: the 26-week two-line rebased
  chart + the warning line + the 13 dots with their end labels, Level 3 one
  tap deeper: why/seen-before/for-you + "Pairs used in this pattern" with
  the four periods); the quiet area (always one closest-to-warning row with
  a thin distance bar); Dollar at a glance; the 10-pair table behind
  "Show all currency pairs" (three group blocks, the big-move tag, old-data
  chips, the ▲ legend, a mobile row list) + the §9.4 pair detail panel with
  its 1-year chart. All §9.5 states (loading skeletons, the calm
  "being prepared" line, nodata rows, stale collapse). Time runs LEFT TO
  RIGHT in every chart and in the dots strip, even in Farsi (§9.6).
- **The §6.11 hero rebuild** — the stock section and the currency section
  are TWO SEPARATE indicators in the transparent count, each with its own
  measure label and chip (never merged: a calm stock section beside a
  warning currency pattern is the designed state — they measure different
  things). Raised currency signals join the named-alerts module with their
  PATTERN NAMES. Both world sections wear the shared SectionVerdictLine
  (measure label + the page's severity chip above the takeaway).
- **EN + FA copy** — the full §7 rule corpus (every outcome's two-part
  sentence), the §8 pair corpus (10 pairs + the dollar measure), §9.10's
  measure labels, §10.2's interface wording and §10.3's headline templates,
  spec-verbatim in both locales; Persian digits and the Iranian currency
  terms (جفت ارز، تقویت/تضعیف، پناهگاه امن…) per §10.1.
- **CSV export** — the pairs table's CSV joins the Tools menu (same
  discipline: ASCII values, localized headers, injection guard, CRLF).

### Budgets

- KV: ONE new key (`insights:fx:v1`); ≤3 writes/day (in practice 1 — the
  write gate skips unchanged days); page traffic rides the 1-hour edge
  cache in front of ONE KV read.
- Provider calls: ONE Frankfurter call per run; the 8-call Yahoo fallback
  only when the primary fails or a V3 second voice is needed. The combined
  markets+fx worst case is 41 subrequests per invocation (cap 50).
- Cron triggers: ZERO new (the fx job rides the markets Worker's two).
- Bundle: the Insights lazy chunk 377.70 → 450.10 kB raw / 97.20 →
  110.38 kB gz (budget 380/98 → 462/113, justified above); the entry
  chunk untouched.

## [2026-10-12] — Live prices: the volatility-scaled refresh (the stale-oil fix)

The Prices board showed Brent at $125.44 "as of 2026-10-06" for four-plus
business days while the real market traded near $107 — EIA's Brent spot on
FRED (the board's ONLY oil source) stopped publishing, the ingestion runs
once daily, and the 12-day stale grace meant nothing flagged it. Full story
and budget math: `docs/insights/09-live-prices.md`.

### Added

- **Hourly live quotes for the Prices board** — Brent `BZ=F`, gold `GC=F`,
  silver `SI=F`, Bitcoin `BTC-USD` from Yahoo Finance (keyless), stored
  under ONE new KV key `insights:prices-live:v1` (write-only-if-changed) by
  a new :13 minute rung of the currena-api minute cron. No new cron trigger
  (the account's free 5-cron limit is full). Per-asset refresh intervals in
  an owner-editable CONFIG block (`intervalMinutes`) — oil at 60 min is 24×
  the "at least once a day" bar. New module
  `packages/insights/src/prices/` (definitions/providers/job/store/merge) +
  a generic Yahoo chart adapter (`adapters/yahoo.ts`) + a manual
  `prices-run` seeder script.
- **Serve-time merge in `GET /api/insights`** — the four tiles + their
  companion ratios (`gold-btc`, `silver-btc`, `gold-aud`) carry the live
  values, asOf dates, 7/30-day changes and honest live attribution; a
  `stale`/`unavailable` reading heals to its natural status. The ETag
  covers both generations. A missing/poisoned quotes key degrades calmly to
  the plain EOD snapshot. The stored snapshot itself is never touched.
- **Ingestion gap-fill for Brent** — Yahoo's `BZ=F` daily closes extend the
  FRED series strictly past EIA's last published date (FRED stays
  authoritative on overlaps, so the series self-corrects when EIA catches
  up; a total FRED outage degrades to the Yahoo series). The stored
  history, percentiles and change windows can never rot behind a lagging
  EIA batch again.
- 53 new tests (46 insights + 7 api): parser, interval gating,
  hold-on-failure, write-if-changed, REST daily-cap retry, merge rules
  (never-rewind, status healing, schema validity), route merge + combined
  ETag, the :13 rung writing the KV key.

### Changed

- brent's attribution now reads `FRED (EIA Brent) + Yahoo Finance (BZ=F)`;
  the insights snapshot ETag format is
  `"insights:<generatedAt>+prices:<liveGeneratedAt|none>"`.

## [2026-10-12] — Money section: fa title verbatim + annual default window (owner round 43)

Forty-third round — two owner notes: "for part what it means for my money,
the farsi translation must be: رو هزینه‌های من چه تاثیری داره؟" and "also
the default time frame for this section must be annual."

### Changed

- **The money section's Farsi title is now the owner's exact wording** —
  «رو هزینه‌های من چه تاثیری داره؟» (was «برای پول من یعنی چه»). The EN
  title ('What it means for my money') is untouched.
- **The money rows' charts open on the ANNUAL window** — the shared trend
  panel gains a per-caller `defaultRange` (quarter remains the default
  everywhere else), and the money panel passes '1y': the «۱ سال» chip is
  pressed on load and the signed delta reads the 12-month move. The
  metals' Estimation charts keep their quarter default, and an explicit
  chip click still wins for the session.

## [2026-10-12] — fa verdict word: «محتاط» → «احتیاط» (owner round 42)

Forty-second round — a one-line owner note: "Instead of محتاط use احتیاط
for farsi."

### Changed

- **The Farsi *Cautious* verdict word is now «احتیاط»** — the label, the
  gauge rows' step word, the computed reason line and the four-word
  explainer sentence («چهار واژهٔ «پایدار»، «احتیاط»، «پرتنش» و
  «بحرانی»…») all read the new word, since every one of them flows from
  the single `label.cautious` copy string. EN ('Cautious') unchanged;
  historical changelog/PROGRESS mentions keep the old word as history.

## [2026-10-12] — The state's artwork leads the verdict row: [icon][word] (owner round 41)

Forty-first round — a one-line owner note: "the icons must before the state
like this [icon][stressed] — currently it's after the state."

### Changed

- **The hero verdict row reads [state-icon][state-word][meter]** — the
  state's artwork moves IN FRONT of the verdict word in both regions'
  verdict blocks (the old order rendered the word first, so the row read
  `[stressed][icon]`). The mark now opens the state moment in the same
  reading order as every other chip in the app — the status chips have
  always been icon-then-word. The meter stays last as the row's
  instrument. In fa the icon leads from the right edge (RTL reading
  order); in en from the left.

## [2026-10-11] — The hero attention tiles align into one row; unit labels read small (owner round 40)

Fortieth round — an owner note with a screenshot of the two hero verdict
blocks side by side: "This boxes need alignment, all must be in a same row"
(example: the Global Brent tile vs the Australia home-loan tile), followed by
"also read آمریکا (unit currency) smaller so it doesnt go to second row."

### Changed

- **The two regions' attention-tile rows share one horizontal band** — the
  count line + tiles + "+n more" + the "how is this computed?" link are now
  ONE bottom-anchored module inside each verdict block (a single `mt-auto`
  pins its top edge). The old free-floating tile block sat lower in the
  Australia panel (its gauge rows and reason sentence are taller) and the
  two rows zig-zagged; the free space now lives ABOVE the module, so both
  panels' tile rows start at the same y BY STRUCTURE (the alignment
  decree), measured pixel-equal in both locales.
- **Tile faces are geometry-fixed** — the name row is EXACTLY two lines
  (`h-[2.75em]`) with the indicator's artwork moved out of the text flow
  (a flex sibling can no longer inflate the line box — the old inline 24px
  icon made two-line titles 41px vs 34px and pushed that tile's value 7px
  below its neighbours); the meaning line is clamped to three lines with
  the same three-line reserve, so every tile is the same height across
  both regions and the meanings' edges align.
- **Unit labels read small** — value rendering gains `indicatorValueParts`
  (number/unit split; `formatIndicatorValue` is now the exact join of the
  parts, outputs byte-identical everywhere). In the tiles the number keeps
  the 23.2px number role while word-units ('دلار آمریکا', 'pts') render at
  caption size on the number's baseline — '۱۲۵٫۴۴ دلار آمریکا' stays on
  ONE row at every desktop width from ~1110px up (the old full-size unit
  wrapped it to two rows). Percent signs and prefixed 'US$' stay glued to
  the number as before. Below ~1110px the unit wraps as a whole word-block
  under the number (the 3-across tile band 768–1130px physically cannot
  fit a 90px number plus a word-unit — pre-existing geometry, and the
  tile faces stay tidy when it happens).
- Tiles tighten half a step to make the row fit (`px-3`→`px-2`, tile grid
  gap 6→4px, value gap 6→4px, unit weight 700→600) — the owner's ~1136px
  viewport now carries ~5px of slack instead of a knife edge.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 332.35/85.76 vs 334.00/86.00; entry 290.33/87.83).
- Local QA (wrangler :8787, KV from prod): en + fa, light + dark, at 1280 —
  both panels' tile rows pixel-equal (ul top 457 = 457, tile heights
  137 = 137, values all at y 501, one line 31px each); the fa Brent tile's
  'دلار آمریکا' reads small on the number's baseline (top 511 vs 501 —
  same row); 1136 — rows still pixel-equal, oil value one line with ~5px
  slack; 375 — single-column tiles, no horizontal overflow; "+n more"
  reveal works in place (3→5 tiles); how-link pinned 16px off the panel
  bottom in both blocks; zero page errors, zero console errors.
- Release: commit + staged-diff token scan clean, pushed via one-shot PAT
  URL, wrangler deploy, production verified (health, chunk byte-compare,
  live browser pass).

## [2026-10-11] — Each region's metrics move into their own mother container (owner round 39)

Thirty-ninth round — an owner note with a screenshot of the Global section:
"put all of global metrics inside a mother container, currently the heading
of global looks stray, it needs depth and container", followed by "australia
must have separate mother container."

### Changed

- **Each region section is its own mother container** — the Global heading
  (and its 96/128px artwork) no longer floats on the page background with
  the metric cards scattered under it. The whole section — heading +
  artwork + every question group, alert/connection cards and the
  "show all" affordances — lives INSIDE one rounded container: the soft
  family tint (`currena-soft/60`, the same field the no-match box wears),
  a hairline ring and a quiet shadow for depth. Three visual layers now:
  page background < tinted mother container < white metric cards.
- **Australia gets a SEPARATE container** — by structure, not luck: the
  section map renders one `<section>` per region, so the two boxes can
  never fuse; measured 40px of page between Global's bottom edge and
  Australia's top edge, both the same width and column edge in both
  locales.
- Gold stays reserved for the money panel's focal treatment — the regions
  take the neutral depth. Anchors (`insights-section-*`), aria labelling,
  scroll margins and everything inside the containers are untouched.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.78/85.21 vs 334.00/86.00; entry 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en light + dark at 1280 — both
  containers render with tint/ring/shadow, heading + artwork inside each
  (Global 10 groups, Australia 6), separate boxes with a 40px gap, same
  width 1088 and left edge 96; fa RTL — both containers right-aligned at
  the same edge (1184), boundary screenshot shows the two boxes stacked;
  375: docW = clientW = 375, container 343px with 16px inner padding; zero
  page errors, zero console errors. Screenshots r39-local-*.png.

## [2026-10-11] — The money rows' type steps down to proportional (owner round 38)

Thirty-eighth round — one owner note on the round-37 sizes, with a
screenshot: "Now they're too big, make them proportional."

### Changed

- **The heading and the number return to proportional steps** — the
  round-37 scale (28px heading / 29px value) shouted against the 14px
  sentence. The area name steps down to 1.5× the body
  (`calc(var(--type-label) * 1.5)` = 21px, still bold) and the value
  returns to the page's number role (`type-number` = 23.2px / 800 /
  tabular — the attention tiles' role, and the size the owner approved
  in round 36). The column reads heading (21) → estimation word (14
  bold) → value (23.2, still the biggest line) → sentence (14), every
  step a token or an existing role — no arbitrary px. A side effect the
  owner gets for free: value + explanation now fit ONE line again in
  most rows (the 29px forced the explanation to wrap).
- Nothing else moves — the one-column-beside-the-icon layout, the
  shared column edge per row, the 50/50 data|chart split and the dedupe
  are all untouched.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.61/85.14 vs 334.00/86.00; entry hash moved with the
  chunk rename, size identical 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en + fa at 1280 — name
  21px/700, value 23.2px/800, name/dir/value on one column edge ×4 rows
  (en left 236, fa right 1044), value inside the icon band ×8, fa chart
  half still left of the data half; 375: docW = clientW = 375, value on
  one line (189px wide); zero page errors, zero console errors.
  Screenshots r38-local-*.png.

## [2026-10-11] — The value moves up beside the icon; the numbers and headings grow (owner round 37)

Thirty-seventh round — three owner refinements to the money rows, each with
a mockup: "move the text to inside the approx red rectangle i drawn" (the
empty band under the direction word, beside the tall icon box); "also make
the percentage text size 25% bigger"; and "also make the headings such as
«پس‌انداز و بهره» 100% bigger — for example if it's 12px make it 24px".

### Changed

- **The value lines move INTO the name/direction column** — the supporting
  number lines no longer sit in their own row under the icon box; they are
  the third line of the column beside it (name → direction word → value),
  exactly where the owner drew the red rectangle. The dead vertical band
  that used to sit under the direction word is filled: the value's top now
  lands INSIDE the icon box's band in every row (verified 4/4 in both
  locales), and the sentence still starts at the half's edge below.
  Alignment gets STRONGER, not weaker — the name, the direction word AND
  the value now share one column start edge per row (left 236 ×4 in en,
  right 1044 ×4 in fa), by structure.
- **The value grows 25%** — 23.2px → 29px via
  `calc(var(--type-number) * 1.25)`: a token ratio, not a magic px, so the
  number role scales if the type scale ever moves. Weight stays 800 with
  the NUMBERS, tabular digits, one line (never breaks mid-text).
- **The area name is a real heading** — 2× the label role
  (`calc(var(--type-label) * 2)`, 14px → 28px, still bold, snug leading
  for the Persian ascenders). The row now reads heading → estimation →
  number → sentence, the owner's mockup order, in both locales.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.68/85.16 vs 334.00/86.00 — class strings only; entry
  untouched 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en/fa × light/dark × 1280/375
  — name/dir/value on one column edge ×4 rows, value inside the icon
  band, name 28px/700, value 29px/800, explanation 14px/400; fa chart
  half still left of the data half; 375 stacks with docW = clientW = 375
  and the value unbroken; zero page errors, zero console errors.

## [2026-10-11] — The numbers lose the pill; the small grades lose the rainbow (owner round 36)

Thirty-sixth round — three owner points with screenshots: the money rows'
supporting chips should move and change shape ("first write the percent in
bigger and bolder text, then write the explanation of it smaller with
regular text … delete the chip like alternative"); "find it why those both
boxes show «قیمت‌های استرالیا نسبت به سال قبل» — is this correct?"; and
the hero's small grade meters: "Align this 6 boxes. also it's too visual
noise … use normal color not color coding."

### Changed

- **The money rows' numbers are plain text, not pills** — the supporting
  chip row is gone from the bottom of the data half. Each supporting
  number now sits BETWEEN the name/direction line and the sentence,
  spoken the owner's way: the VALUE in the page's number role
  (`type-number` — 23px / 800 / tabular, the same role as the attention
  tiles' numbers) and the indicator name after it smaller (label size)
  at REGULAR weight. Value first in the DOM → rightmost in fa (the
  owner's mockup), leftmost in en. The line still opens the indicator's
  card — the pill's one job survives, its look is gone. The value never
  breaks mid-text (`whitespace-nowrap`); on phones a long name wraps
  below the value instead.
- **Each supporting number shows ONCE** — the owner's duplication
  question, answered: savings AND shop both legitimately read Australia
  CPI (config lists it for both), so when CPI left its usual range BOTH
  rows picked it as their first driver — correct per the data, but the
  same «قیمت‌های استرالیا نسبت به سال قبل» twice read as duplication.
  Display-level dedupe: the later row falls through to its NEXT driver
  (shop → underlying inflation, «تورم زیرین ۳٫۶٪»), and the row's chart
  follows the number it actually shows (shop's mini chart is now the
  trimmed-mean series — arguably the better chart for shop prices
  anyway). If every chip was already shown, a row re-shows its own — a
  row never loses its number or its chart.
- **The hero's grade boxes align BY STRUCTURE** — the wrap is gone: the
  gauge name owns the row's free width and truncates with the full text
  on hover (title) and in the meter's aria (the old wrap made
  "Borrowing costs" rows 42px while single-line neighbours sat at 21px —
  the boxes zig-zagged). Every row is exactly one line high; tightened
  the column/element gaps (gap-x-5, gap-1.5) so even the longest short
  names ("Borrowing costs", "Inflation & rates") fit without
  truncating at card width.
- **The small grade meters are NOT colour-coded** — "use normal color
  not color coding": the six small meters' filled segments render in one
  normal ink (text-secondary) in light and dark, and the step words sit
  in the same normal ink instead of the status palette. The colour
  coding stays where it belongs — the hero's BIG meter and verdict word.

### Housekeeping

- No bundle movement that matters: Insights 331.50/85.14 vs budgets
  334.00/86.00; entry untouched 290.33/87.06.

## [2026-10-11] — The money rows' mini graphs shrink to half the card (owner round 35)

Thirty-fifth round — one owner point on the round-34 money charts, with a
sketch: "This graphs are too big, it must only contain 50% of the card
width, 50% other data and context like this [ graph       data]".

### Changed

- **The money rows are a 50/50 grid** — the mini chart no longer spans
  the full card on its own wrapped line. Each row is now
  `sm:grid-cols-2`: column 1 (inline-start) is the DATA half — icon +
  name/direction on the first line, the sentence and the supporting
  chips stacked under them — and column 2 is the CHART half, the same
  TrendPanel (axes + hover inspector + Quarter/1y/5y chips + delta,
  plot h-16) vertically centred in its half like the metals' chart
  columns, separated by a vertical hairline (`border-s` faces the data
  half in both directions). In fa/RTL the chart lands on the LEFT and
  the data on the RIGHT — exactly the owner's sketch; en mirrors it,
  the same label-start/chart-end pattern the Estimation strip already
  uses. Phones (<sm) keep the round-34 stack: hairline above, chart
  full-width under the data.
- **The divider is aligned BY STRUCTURE (the decree)** — `grid-cols-2`
  makes the split exact and equal in every row: verified chartLeft =
  648 / dataLeft = 128 / chartRight = 1152 across ALL FOUR rows
  (petrol, homeLoan, savings, shop), each half exactly 504px at 1280,
  and each row's two halves stretch to the same height (186 = 186).
  The sentence starts at the half's edge in every row, so the R30
  "sentences start at different positions" roast stays fixed.

### Housekeeping

- No bundle movement that matters (class strings only): Insights
  331.44/85.10 vs budgets 334.00/86.00; entry untouched 290.33/87.05.

## [2026-10-11] — Real axes and a hover inspector on every chart; the money rows wear the same mini graphs; alignment by structure (owner round 34)

Thirty-fourth round — the owner's follow-up on round 33's charts: "the gold
and silver graphs must have X and Y axis, also when you hover mouse on
graph, it must show price points during the times"; "add graphs with same
structure" to the "What it means for my money" rows as mini graphs; the
copper move chip «نسبت مس به طلا بالا می‌رود» is "somehow vague — write
more intuitive and practical text like: قیمت مس نسبت به طلا رشد می‌کند";
and the standing decree: "Always comply alignment rules, so such incidents
must never happen."

### Added

- **X and Y axes on every trend chart** — the round-33 sparklines grew a
  real frame: three dashed horizontal gridlines (top/mid/bottom) with Y
  tick labels at the line's max / mid / min (compact by magnitude —
  "4,411" / "65.4" / "3.95"; Persian digits in fa), and X tick labels at
  the window's first / middle / last point (en "Aug 2026 → Oct 2026",
  fa Jalali «مرداد ۱۴۰۵ → مهر ۱۴۰۵»). The gridlines and labels are
  positioned from the SAME scaleY geometry that draws the line, so a
  gridline always sits exactly on the value its label names, and every
  label renders as HTML (never stretched-glyph SVG text).
- **A hover price inspector** — moving the mouse over a plot (or tapping
  it) snaps a crosshair + dot to the nearest point and floats a tooltip
  with the exact price point and its date ("US$4,108 · Oct 7, 2026";
  fa «۴٬۱۲۸ دلار آمریکا · ۱۶ مهر ۱۴۰۵», units from the indicator's own
  formatter). The plot is also focusable and keyboard-walkable
  (←/→ step, Home/End jump, Esc clears), so the numbers are reachable
  without a mouse. Tooltips clamp inside the plot edges.
- **Mini graphs on the money rows** — every "What it means for my
  money" row now carries the EXACT same structure as the metals'
  Estimation charts (shared TrendPanel: axes + hover inspector + the
  Quarter / 1 year / 5 years chips + the signed window delta), rendered
  as a full-width mini chart on its own hairline-separated line under
  the row. It charts the row's FIRST chip — the indicator actually
  making the row speak (petrol → Brent +64% quarter, home loan → the
  paid rate, savings & shop → CPI) — so the picture and the sentence
  can never disagree. No-series rows keep the honest "no chart history"
  line; a Quarter chip disables itself when the window holds <2 points
  (quarterly CPI).
- **TrendChart.tsx** — the shared module behind all of it (chart + axes
  + inspector + chips + delta + the module-cached history hook), so the
  two sections stay aligned by construction.

### Changed

- **Alignment is structural, never lucky (the decree)** — three fixes:
  (1) the Estimation strip's verdict words own a fixed two-line slot
  (silver's «جهت روشنی ندارد» wraps, gold's «پایین می‌آید» doesn't — the
  slot keeps both tiles' verdicts, chips and deltas on the same
  baselines; verified chipsTop/deltaTop identical across tiles); (2) the
  chart column owns a reserved height so loading/empty states can't pull
  one tile's rows above the other's; (3) the connection cards' focal
  verdict fields anchor to the card's BOTTOM (mt-auto) — cards in a row
  stretch to equal heights, so all three gold fields finish on the same
  baseline instead of floating where the upper content happens to end.
- **Charts hold their time direction in RTL** — the whole TrendPanel
  block lays out dir="ltr" (the house chart convention): Y labels left
  of the plot, X ticks running left→right matching the SVG line — the
  first date's label sits under the line's FIRST point in fa too, not
  mirrored onto its end. The card layout around the chart still mirrors.
- **The copper move chip speaks plainly** — «نسبت مس به طلا» →
  «قیمت مس نسبت به طلا» (chip now reads «قیمت مس نسبت به طلا بالا
  می‌رود», the owner's own example shape; the page-wide بالا می‌رود /
  پایین می‌آید vocabulary stays). en "the copper-to-gold ratio" →
  "the copper price vs gold" (chip: "the copper price vs gold rising").
  The details panel's typical line joins ("The copper price vs gold
  sits in its usual range." / «قیمت مس نسبت به طلا در محدودهٔ همیشگی
  است.»). The prose explanations keep the ratio wording (that's what
  prose is for). One new shared aria key, `trendChartAria` («روند قیمت
  {name}، {range} گذشته»), × 2 locales.

### Housekeeping

- Budget bump 330.00/85.50 → **334.00/86.00 kB gz** (Insights
  331.29/85.09): the shared chart engine (axes + inspector + the money
  minis) is exactly the growth the owner asked for on TWO sections;
  gzip +1.09 kB. The R33 entry pre-announced the bump. Entry chunk
  untouched (290.33/87.06 vs 296.00/89.50).

## [2026-10-11] — The big icons move to the dedicated sections; the Estimation chips wear the metals' own charts (owner round 33)

Thirty-third round — five owner points: the 128px world/australia maps in
the HERO are "visual noise" (max 64×64 up there; the big icons belong
"here in the middle of page of global and australia" — the screenshot
points at the dedicated `Global` section heading); the Estimation chips'
white space should carry "gold and silver chart … quarter, one year,
five year time frame by clickable chips"; the Global | Australia switch
bar must go from the top of the page ("also it doesnt work"); and the
"+2 more" tile "doesnt show other indicators".

### Changed

- **The switcher is retired — both regions render, stacked** — the
  Global | Australia pill bar is gone from the page entirely (it sat
  above the fold flipping a state the reader could not see: clicking it
  re-rendered a section below the fold and read as dead). The dedicated
  sections now render TOGETHER mid-page — Global first (D7), then
  Australia — each headed by its own name; `insights-section-global` /
  `insights-section-australia` are static anchors, so the hero's "View
  section" links and the Tools counts behave honestly (counts describe
  everything on screen again). LaneSwitch.tsx + the lane storage key are
  deleted.
- **The big region icons live on the section headings** — each dedicated
  section's h2 leads with its artwork at the price tiles' scale (96px
  mobile / **128×128 desktop**) beside the name: the globe for Global,
  the map for Australia. This is where the owner wanted the big icons —
  the screenshot's heading — not the hero.
- **The hero mark steps back down** — the verdict blocks' region icon is
  a quiet 48px mobile / **64×64 desktop** (the owner's hard ceiling),
  silencing the visual noise the 128px artwork made at the top of the
  page.
- **The Estimation chips' white space is now the metals' own history** —
  each verdict chip pairs its 128px artwork (left column: artwork, name,
  verdict word) with a compact zero-dependency SVG trend chart (the
  house Sparkline pattern, dir="ltr" in both locales) that fills the
  former white space on desktop and sits under the artwork on phones.
  Under the chart: CLICKABLE range chips — **Quarter · 1 year · 5 years**
  (en) / «سه‌ماهه · ۱ سال · ۵ سال» (fa) — default Quarter, disabled when
  the window cannot show ≥2 points, plus one signed window delta
  («+130.3%», quiet ink — the verdict word beside it already speaks in
  colour). Data rides the same module-cached `/api/insights/:id/history`
  fetch the details panel uses; a 404 degrades to the honest "no chart
  history" line.
- **"+n more" now shows the indicators** — the hero's needs-attention
  overflow tile used to jump to the (removed) switcher's lane, which
  read as a dead click. It now reveals the remaining tiles IN PLACE
  (the grid wraps; the button disappears once everything is shown).

### Housekeeping

- Insights chunk 326.09/84.00 kB raw/gz against the previous 322.50/84.00
  budget — OVER by 3.59 kB raw (gzip grew ~1 kB), so the budget bumps to
  **330.00/85.50** with this note (the R32 entry pre-announced the first
  additive bump). The growth is the strip charts + chips, the dual
  sections and the reveal state — logic and JSX, not strings. ENTRY
  chunk untouched (290.33/87.05 vs 296.00/89.50). PWA precache unchanged
  (85 entries).

## [2026-10-11] — Plain direction words, no stuttered rows, big region marks, and the connections' focal verdict field (owner round 32)

Thirty-second round — five owner points: "instead of 'ارزش می‌بازد' say
'پایین می‌آید' or will go down"; the condition rows' duplicated state word
("علیه کار می‌کند / دلار آمریکا / علیه کار می‌کند"); "علیه کار می‌کند is not
a good translation — use در تضاد است or در جهت مخالف است"; the dedicated
Australia and Global sections should wear their big icons; and the
connections' moves ("نسبت مس به طلا بالا می‌رود…") need "a container inside
a container as focal point for the verdicts and estimations".

### Changed

- **The Estimation speaks plainly again** — the verdict words are back to
  the owner's own R23 phrasing: "will go up" wears green, "will go down"
  wears red (fa: «بالا می‌رود» / «پایین می‌آید») — R26's "gaining/losing
  value" («ارزش می‌گیرد/می‌بازد») are retired. The page now speaks ONE
  direction vocabulary: the verdict chips, the collapsed summary takeaway
  and the connections' move lines all use the same words. Colour still
  never rides alone: the zigzag/flat icon leads every word.
- **The condition rows lost their stutter** — each row used to render the
  state word twice (icon + short word at the start, then the full word
  again after the name; in fa the two strings for "against" were
  IDENTICAL, so every against-row read «علیه کار می‌کند / دلار آمریکا /
  علیه کار می‌کند»). The trailing echo is gone — the icon + word at the
  row's start IS the state. Verified: exactly one occurrence per row in
  both locales.
- **"works against" is now «در تضاد است»** — the fa wording the owner
  rejected is replaced across the signals copy (group heading, state
  words, and the real-yield "how" sentence's closing clause → «در تضاد
  با آن است»). English "Works against" is untouched.
- **The Global and Australia blocks wear their big icons** — the hero's
  region verdict cards (the dedicated sections) now lead with their own
  artwork at the price tiles' scale (96px mobile / **128×128 desktop**),
  the section label and the view link sitting beside it, vertically
  centred — the same face the Estimation chips and the price tiles speak
  with.
- **The connections have their focal verdict field** — when a connection
  card has estimations to show (active/partly), the right-now verdict and
  the per-leg moves move INTO the app's focal container-inside-container
  recipe (the money panel's / the Estimation strip's): the card holds a
  brand-gold gradient field with a 2px gold ring and gold-tinted shadow;
  the field holds the verdict line and the moves as WHITE CHIPS, each
  riding a direction glyph — up/down arrows for rising/falling, the dash
  for steady, and a position dot for level-only legs (high/low/mid — a
  level is not a movement). Quiet states (inactive/unknown) keep the
  plain one-line verdict.

### Housekeeping

- Copy-only + presentation change; no engine, API or asset changes.
  Insights chunk 322.43/83.03 kB raw/gz against the 322.50/84.00 budget —
  HELD with 0.07 kB to spare (the next additive round likely bumps; noted
  here so the bump is never silent). PWA precache unchanged (85 entries).

## [2026-10-11] — The Estimation strip becomes the card's verdict; "expensive" speaks in red (owner round 31)

Thirty-first round — two owner points: the gold-and-silver card's verdict
strip must be "contrasted with more visual weight against its section,
because it's the verdict and estimation of the whole section", with its
icons at 128×128 on desktop; and "everywhere which is marked 'expensive'
use red color".

### Changed

- **The Estimation strip is the focal takeaway** — the app's focal-section
  recipe (the money panel's, round 29) now wraps the strip: a brand-gold
  gradient field (16% → 7% → transparent), a 2px gold ring, and a
  gold-tinted shadow (dark mode keeps the gradient with a deeper shadow),
  so the white verdict chips pop against the card they summarise. The
  strip's title lifts to secondary ink for the tinted field.
- **Verdict chips restacked around the artwork** — each chip is now a
  small stacked card: the metal artwork leads at the price tiles' scale
  (96px mobile / **128×128 desktop**), the metal name rides under it, and
  the verdict word ("losing value" / "no clear direction" / «ارزش
  می‌بازد»…) speaks at the price's own size (type-number) in the verdict
  ink — icon + word, never colour alone. The direction zigzag grows with
  the strip (28/36) beside the big word. Header lean lines, footing rows
  and the collapsed summary keep their own smaller scales.
- **"expensive" is red (owner decree, R31 restores the pre-R30
  valence)** — `bandToneClass` maps the price position band to status
  ink again: expensive (top of the 10-year range) = the alert red, cheap
  (bottom) = the supportive green, typical stays neutral. It colours the
  price tiles' change-row word AND the details panel's 10-year position
  word (price rows). Never colour alone: the word always rides beside
  the change numbers / the position bar.

### Housekeeping

- No copy, engine or API changes. Insights chunk 321.10/82.94 kB raw/gz
  against the 322.50/84.00 budget (no bump). No new assets — PWA precache
  unchanged (85 entries).

## [2026-10-11] — Price tiles: the artwork IS the card, at 128×128 on desktop (owner round 30)

Thirtieth round — the owner checked production, found it still serving the
round-28 markup (the round-29 commit had not left the sandbox), and set the
next bar: "The icons look like before… The main prices … must have at least
128×128 icon in pc." Two jobs: actually ship what is committed, and make the
price tiles' artwork a true 128×128 face on desktop.

### Shipped (the round-29 backlog)

- Commit `0225cc0` (round 29) had been gated, browser-verified and committed
  locally, but NEVER pushed or deployed — the sandbox had no GitHub token and
  no Cloudflare token, and the remote URL is tokenless by design. The owner
  supplied both credentials this round; the release record below covers the
  combined round-29 + round-30 push and deploy.

### Changed

- **Price tiles restacked around the artwork** — the icon box grew to
  96px on mobile / **128×128 on ≥640px screens** (owner's explicit floor;
  the 256px sources downscale cleanly), and the tile turned into a stacked
  product card: artwork on top as the face, then the name, then the big
  price, then the change rows. The old side-by-side arrangement could not
  survive a 128px neighbour: at the 4-across desktop grid only ~100px
  remained beside the icon, and in fa the price («۴٬۱۹۶ دلار») wrapped to
  THREE lines while names wrapped to two — rows started at different
  heights per tile, exactly what the owner's "numbers must align" rule
  forbids.
- **Alignment is now structural, not lucky** — the name rides in a fixed
  two-line slot (`min-height: 2 × leading-snug`), so the price and every
  row under it start at the same y in all four tiles whether a neighbour's
  name wraps or not. Verified programmatically in en and fa at 1280:
  name/price/change tops are pixel-identical across all four tiles.
- The fallback `Coins` glyph (only shown if artwork is ever missing) joins
  the responsive `.currena-icon` mechanism at the same 96/128 sizes.

### Housekeeping

- No copy, engine or API changes. Insights chunk 320.73/82.91 kB raw/gz
  against the 322.50/84.00 budget (no bump). No new assets — PWA precache
  unchanged (85 entries).

## [2026-10-11] — Icons at full voice, and the money panel becomes the page's focal section (owner round 29)

Twenty-ninth round — three owner points at once: "the icons are too small —
I expect them to be a few times larger on desktop, and relatively larger on
mobile"; a list of which icons/subjects are still missing; and "what it means
for my money needs more contrast and visual weight — different bg, color,
shadow, anything — it is one of the most important sections".

### Changed

- **Responsive artwork sizing (`IconImg` + `.currena-icon`)** — the fixed
  inline `size` px became two CSS custom properties set per image: the
  MOBILE box (`--icon-size`) and the ≥640px box (`--icon-size-sm`,
  Tailwind's `sm:` breakpoint — the same one every money/price row already
  turns at). One media query in index.css drives every artwork surface;
  `object-fit: contain` keeps the 256px sources clean at every size.
- **Every surface grew (mobile → desktop, old desktop in brackets):**
  money-panel area icons 52 → 80px in a 64 → 96px box (40 in 64), price
  tiles 32 → 44px in a 44 → 56px box (26 in 36), the hero's state artwork
  44 → 60px (30), the gold-and-silver estimation strip's metal chips +
  direction zigzags 28 → 36px (20/18), its footing rows 24 → 30px (18) and
  header lean lines 18 → 22px (16), hero region marks 22 → 28px (18),
  hero attention tiles 20 → 24px (16), alert-card titles 26 → 34px (20),
  details-panel headings 32 → 44px (24), and the money rows' estimation
  arrows 20 → 24px (16). The money panel's estimation arrow and word now
  read at the row's own scale, not as a footnote.
- **The money panel is the focal section** — the app's focal accent
  (brand gold, round 24's decision) now wraps "What it means for my
  money": a gold gradient field (16% → 7% → transparent), a 2px gold
  ring, and a soft gold-tinted shadow, with its own padding so the white
  rows sit ON the tinted field — the wrapper-vs-rows contrast carries the
  weight, the rows keep their plain readable surface. Dark mode keeps the
  same gradient logic with a deeper shadow. Row rhythm opened one step
  (gap-2, py-3.5, px-4) to match the larger icons.

### The missing-icon audit (owner question 2)

Subjects that exist in the app but have NO artwork yet, by priority:

1. **Jobs / worker / briefcase** — the money panel's one icon-less area
   ("jobs" still wears the old stroke briefcase) + `au-unemployment`.
2. **Wages / pay packet** — `au-wage-growth`.
3. **Central bank building** — `fed-target`, `ecb-dfr`
   (`rba-cash-rate` currently borrows the housing art; a bank of its own
   would let policy rates read as policy).
4. **Government / treasury** — `govt-interest-revenue`.
5. **Strong dollar (a $ with directional arrows)** — `dollar-basket`.
6. **Flags: US, Japan, EU, China, Australia** — the five FX pairs
   (`usdjpy`, `eur-usd`, `usdcny`, `audusd`, `audjpy`); the converter
   already speaks flags, the Insights lanes don't yet.
7. **China factory** — `china-pmi`.
8. **Money supply (banknotes stack)** — `m2-us`.
9. **Nervous-market gauge (distinct from the four state gauges)** —
   `stress-stlfsi`, `nfci`.
10. **Inflation expectations (a coin + a clock)** — `breakeven-5y5y`.
11. **Container ship / trade** — `terms-of-trade`.
12. **Iron ore (rock / mine cart)** — `iron-ore`.
13. **A wallet/purse for the money-panel header** — optional, the section
    currently relies on the gold field alone.
Not needed: `gold-silver` (the two bars already ride the ratio row),
`gold-btc`/`silver-btc` (context ratios, tiny), `au-us-10y-gap` (covered
by the US-10Y family art).

### Housekeeping

- No copy, engine or API changes; the estimation engine (round 25) and
  the copy corpus are untouched. Insights chunk 320.69/82.87 kB raw/gz
  against the 322.50/84.00 budget (no bump — the responsive sizing is
  ~0.8 kB of JS + 21 lines of CSS). No new assets, so the PWA precache
  is unchanged (85 entries).

## [2026-10-11] — The owner's icon set: the app wears its own artwork (owner round 28)

Twenty-eighth round — the owner shipped "Currena PNG Icons.zip" (18 pieces,
256×256, carefully named) with the instruction: create a proper assets
folder, move them under it, use them everywhere possible ("everywhere you
see gold use gold.png"), keep sizes flexible (sources support up to
256×256), and keep the SAME colour coding the finance states already speak
(cautious etc.).

### Added

- **`apps/web/public/assets/icons/`** — the 18 pieces with web-friendly
  lowercase-kebab names (gold.png, silver.png, oil.png, bitcoin.png,
  copper.png, fuel-price.png, bills-shop-prices.png,
  home-loan-rent-interest.png, stock-exchange-index.png,
  us-10-year-interest.png, global-finance.png, australia-map.png,
  stable/cautious/stressed/critical-state.png,
  up-support-growth-increase.png, down-work-against-decrease.png). The
  original zip is archived at `docs/icon-source/`.
- **`components/icons/currena.tsx`** — one shared module: the URL maps
  (indicator → subject, money-area → subject, section → region mark,
  verdict step → state) and the one decorative `<img>` shape
  (alt="" + aria-hidden — the adjacent word always carries the meaning).

### Changed

- **Price tiles**: the round-24 stroke pictograms are gone — oil barrel,
  gold bar, silver bar and bitcoin wear their own artwork in the same
  tinted boxes (gold keeps the brand-gold box).
- **Money panel**: five of six areas wear artwork (fuel nozzle, housing,
  the rising chart for savings, bills, the globe for overseas); "jobs"
  has no artwork yet and keeps its stroke briefcase.
- **Gold-and-silver card**: the metal chips, the header lean lines and
  the footing rows show the gold/silver bars; the metals' up/down
  estimation arrows are the owner's green/red zigzag artwork (their fixed
  colours match this card's holder-view valence by construction — up =
  gain). The flat dash stays a stroke glyph; the money panel keeps its
  stroke arrows (there "up" can be the BAD case and must follow the
  area's valence ink).
- **Hero verdict cards**: each region wears its mark (globe = Global,
  map = Australia), and the big verdict word is beside its state's
  artwork — drawn in the SAME colour coding the app already speaks
  (green Stable ↔ the normal ink, amber Cautious ↔ the watch ink, orange
  Stressed ↔ the stressed ink, red Critical ↔ the alert ink). Icon +
  word + ink, never colour alone.
- **Alert cards, hero attention tiles and the details panel**: every
  mapped indicator (oil, gold, silver, bitcoin, copper, the US-10Y
  family, the CPI/bills family, the housing family, petrol) names itself
  with its artwork.

### Housekeeping

- No copy, type, engine or API changes. The icons are static public
  assets — no JS cost; the Insights chunk moved 319.87/82.62 kB raw/gz
  against the 322.50/84.00 budget (no bump). The PWA precache now
  includes the 18 PNGs (85 entries, ~2.7 MB) — same mechanism the flag
  images already used.

## [2026-10-11] — The signals card opens by default — the detail is the content (owner round 27)

Twenty-seventh round — the owner, alarmed: the gold-and-silver "What the
signals say" section had lost its information. It had not: since the UX
round-2 density pass (R7b) the card defaults to COLLAPSED and remembers
that choice in localStorage, so every visit opened to a two-line summary
and a small "Show details" toggle nobody connects with five condition
rows, live values and footing rows. "Collapsed" read as "deleted".

### Changed

- **The gold-and-silver card OPENS by default on every visit.** The
  estimation strip, the Supports / Works-against / Neutral condition
  rows (with their live values and one-line "how" explanations), the
  per-metal footing rows and the silver-only condition render
  immediately — no click, no remembered state.
- **The collapse is session-only now.** "Show details / Show fewer"
  keeps working (and pill/hash links that target the section still
  expand it), but the choice is no longer persisted to localStorage —
  a fresh load always shows the full card. The localStorage key
  `currena.insights.signals-open.v1` is retired; existing visitors who
  had it "closed" stop being stuck collapsed (and stale keys simply
  rot in place, unread).
- The collapsed two-line summary keeps its round-24/26 takeaway
  (direction icon + value word) for anyone who does fold the card away.

### Why not just flip the stored default

Remembering "open" would have fixed the owner's browser but kept the
trap: one accidental "Show fewer" and the information is gone again for
that visitor, forever. The card's whole point is the conditions behind
the estimation — they now show up the way the owner expects, every time.

### Housekeeping

- No copy, type or engine changes — verdictOf, the vote engine and both
  locales are untouched; the Insights chunk SHRANK slightly (localStorage
  read/write effects removed): 319.94/82.52 kB raw/gz against the
  round-25 budget 322.50/84.00. No bump.

## [2026-10-11] — The estimations speak in value and cost, not bare directions (owner round 26)

Twenty-sixth round — the owner, pointing at the red-and-green "will go up":
misleading — it needs supportive words that match the ink ("Growing
Positively"-shaped value words for the metals; "Becoming More Expensive"-
shaped cost words for the money rows) and a direction icon everywhere the
estimation appears.

### Changed

- **Metals estimation chips — value words**: "will go up / will go down"
  → "gaining value / losing value" («ارزش می‌گیرد / ارزش می‌بازد»); flat
  and none unchanged. The words now explain the ink: green means the metal
  is worth more, red means it is worth less — a holder-view sentence, not
  a bare futures claim.
- **The collapsed per-metal summary carries the direction icon now** —
  round 24's takeaway line was word + ink only; the same 14px arrow the
  strip uses rides the line (icon + word + ink, never colour alone, G5).
- **Money estimation words — cost words, valence-matched**: the generic
  "Will go up / Will go down" split into two word-sets that follow each
  area's valence: cost areas (petrol, home loan, shop, overseas) say
  "Becoming more expensive / Getting cheaper" («گران‌تر می‌شود /
  ارزان‌تر می‌شود»); savings says "Earning more interest / Earning less"
  («سود بیشتری می‌گیرید / سود کمتری می‌گیرید») — savings-up is the GOOD
  case (green), and "becoming more expensive" in green would have been
  nonsense. The direction word now always agrees with its colour.

### Why the words changed and the engine did not

The round-25 vote engine is untouched — band breaches, big moves and
10-year extremes still decide every arrow; the tally is still a
description of conditions, not advice. Round 26 only changed what the
arrow SAYS. Today's live data still reads every money row "up" — petrol,
home loan and shop prices "Becoming more expensive" in warning red while
savings "Earns more interest" in calm green — and the metals card split:
gold "losing value" (red), silver "no clear direction" (neutral). The
engine still flips by itself when the regime turns; the words now keep
making sense when it does.

### Housekeeping

- The R11 "no will" corpus guard is strict again: the round-25 exemption
  for the estimation keys is gone — the new words carry no "will", so the
  whole money corpus (both locales) is will-free and buy/sell-free as
  before. The type-lock (InsightsCopy = typeof insightsCopyEn) forced the
  fa mirror in the same commit, as designed.
- No bundle-budget movement: the Insights chunk measures 320.14/82.52 kB
  raw/gz against 322.50/84.00 — the words swapped, the arrows were already
  shipped, and the one new icon (collapsed line) fits inside the round-25
  budget without a bump.

## [2026-10-11] — The money rows speak: a stated estimation under every "What it means for my money" item (owner round 25)

Twenty-fifth round — the owner, pointing at the money panel: a very simple,
short estimation under EACH item ("Petrol and transport, will go up, with an
arrow to up — showing that it will be more expensive"), and it must be based
on calculations and data, not decoration. The same language the gold-and-
silver card earned in round 23, now computed from each area's own drivers.

### Added

- **A stated estimation under every money row**: arrow + "Will go up /
  Will go down / No clear direction" («بالا می‌رود / پایین می‌آید /
  جهت روشنی ندارد»), sitting directly under the area name — the exact
  spot the owner sketched. It is a mechanical tally, not a vibe: each
  area's driver readings vote, majority wins, tie or silence → flat.
- **The vote engine** (`config.moneyDriverVote` / `moneyAreaDirection`),
  one vote per driver, first match wins:
  1. a published band breach (CPI above the RBA's 2–3% band) — the
     strongest causal claim the corpus itself makes;
  2. a statistically big move (|moveScore| ≥ 2, the jumping threshold) —
     the change tends to feed through ("pump prices follow within weeks");
  3. a 10-year extreme level (position band high/low).
  Votes pass through per-driver semantics (`MONEY_DRIVER_KIND`):
  `direct` (brent, the cash rate, the paid mortgage rate — the driver IS
  the area's number), `inverse` (FX: a FALLING AUD makes imports and
  travel dearer), `growth` (CPI/rent/petrol yoy — votes up on breach,
  extreme or acceleration but NEVER down: a growth series below its range
  still means costs RISING, just slower — rent growth at its 10-year low
  is not "rents will get cheaper"), `none` (debt arrears, jobs/pay —
  consequences and mixed semantics don't vote).
- **Valence ink, not direction ink**: the metals card colours by direction
  because the owner HOLDS metal (up = good, green). The money panel is the
  household PAYS side: green = good for your money, red = pressure on it —
  "Petrol will go up" warns in alert red while "Savings interest will go
  up" reassures in green (rising interest is the good case; today it is
  the only green row: cash rate at its 10-year high, CPI above the band).
  The arrow always matches the word — never colour alone (G5).

### Why today's panel reads the way it does (all four rows up — the data, not a bug)

Brent sits at the 99th percentile of its decade and jumped +7.2σ in 30 days,
while the AUD fell −5.5σ (imports dearer) → petrol up. Both inflation
gauges print above the RBA's own 2–3% band → shop prices up. The cash rate
and the paid mortgage rate sit at their 10-year extremes (1.00 / 0.95) with
rents still rising 3.6% yoy → home loan up. Savings ride the same two
readings upward → the green row. In a cutting regime the same engine flips
the rows to "will go down" — the arrow follows the data.

### Housekeeping

- Bundle budget bumped 318.5/82.5 → 322.5/84.0 kB (raw/gz) WITH justification
  (Insights 317.60/81.93 → 319.80/82.41: the vote engine, the 16px arrow
  set and 3 copy strings × 2 locales; entry untouched at 290.33/87.06).
- The R11 "no will" guard now exempts the three estimation keys (owner
  override, same precedent as round 23's verdict strip); buy/sell stays
  banned everywhere and the hedged sentences stay "will"-free.
- New guard file `money-direction.test.ts` (20 tests): vote priority,
  growth-silence (no fake "cheaper"), inverse FX sign, tally/tie → flat,
  valence ink matrix, and a live-shaped regression of today's four rows.

## [2026-10-11] — The roast round: meaning on every warning card, a quieter hero, Jalali everywhere, red discipline, and brand gold (owner round 24)

Twenty-fourth round — a full design roast of the Persian build scored the
page B- with a ranked fix list. All seven "fix this first" items shipped.

### Changed

- **Every needs-attention card and hero tile now carries a one-line
  MEANING** (roast #1: "a rule but no meaning"). A new authored corpus —
  30 indicators × 2 locales (`copy.meaning`) — says what the fired rule
  actually means for the reader ("دستمزد از قیمت‌ها عقب مانده است:
  افزایش حقوقِ هر سال، کمتر از سال قبل می‌خرد."), replacing the
  "قاعده: …" jargon on the hero tiles, alert cards and compact rows. The
  technical rule text stays in the details panel. The line sits in a
  SOFTENED tint (`/10 → /[0.07]`, ring `/25 → /20`) — red belongs to
  words, not walls of pink.
- **The hero says it once** (roast #2). Gauge rows now show only the
  non-calm gauges (unreadable rows stay — they are the honest "cannot
  read" signal); the separate "الان نیازمند توجه" kicker is gone (the
  count line above the tiles already says it); and the tail clause can
  no longer lie — the old mode-based "بقیه در وضعیت پایدار هستند" sat
  beside a Cautious gauge row, so when the remaining gauges disagree the
  sentence now enumerates their DISTINCT words ("The rest are Cautious
  and Stable." / «بقیه در وضعیت محتاط و پایدار هستند.»). New
  `heroReasonOthersMixed` + `heroReasonAndWord` keys; the mode fallback
  stays for call sites without the mixed template.
- **Jalali on every card footer in Persian, through the one formatter**
  (roast #3): the alert card hardcoded `'en'` into `formatAsOf` — Latin
  dates on a Persian page. It now derives the locale from
  `numberLocale`; every other card already used the shared formatter.
- **Red discipline** (roast #4): the four money-panel area labels are
  neutral ink (state still shows in the sentence + chips); hero tile
  tints softened; red remains on "needs attention" words, counts and
  card accents only.
- **Price tiles** (roast #5): a missing change renders a quiet em-dash
  instead of two «ناموجود» labels per tile (six empty labels in a strip
  that should be clean), the position word holds its line
  (`whitespace-nowrap`), and each commodity wears a small pictogram —
  droplet, ingots, coins, ₿ — in the money-panel's tinted-box language,
  with the GOLD tile wearing the brand gold.
- **Footer bidi fixed** (roast 🔴): the official English FRED notice now
  sits on its OWN `dir="ltr"` line, with the Persian explanation on the
  next line in the page's direction (`fredLocalNote` key; en renders no
  second line). No more stray colon or ".(" at a line start.
- **Brand gold is the ONE accent** (roast #7): new tokens
  `--color-accent-gold` (#F3B13F fill) / `-ink` (#2A1F04 text on gold) /
  `-deep` (gold-family ink for highlights: #A87E1C light, #E8B54A dark).
  The lane switch and section pills' selected state is now gold with
  dark ink (was blue/white), and the biggest-move card — the page's
  focal moment — carries a gold ring and gold kicker icon.
- **Smaller findings**: gauge rows and their step words bumped
  caption → label size (the roast measured ~11px words), the compact
  meter grew 44 → 52px wide with 6px segments, and the collapsed
  gold-and-silver summary now ends with its takeaway — the round-23
  estimation, in the direction's ink («برآورد: پایین می‌آید») —
  fixing "jargon with no takeaway".

### Housekeeping

- Bundle budget bumped 307.5/79.6 → 318.5/82.5 kB (Insights chunk
  306.68 → 317.60 kB raw / 79.19 → 81.93 gz): the roast's #1 fix is
  content — 30 meaning lines × 2 locales — plus the mixed-rest keys,
  collapsed verdicts and pictograms. Entry untouched at 290.33/87.06.

## [2026-10-11] — The owner's exact Carbon state palette, and an estimation you can point at (owner round 23)

Twenty-third round — the owner pinned the exact state colours ("use the
given colors for states", IBM Carbon's signature hues in chat) and asked
the gold-and-silver card for "an estimation and verdict, for example,
Gold will go up, Silver will go down."

### Changed

- **Status palette = the owner's four hexes, verbatim.** Round 22's retuned
  inks still read dark, so the four state tokens are now the exact colours
  from the owner's palette image in BOTH themes: Green 50 `#24a148`
  (Stable/supports), Yellow 30 `#f1c21b` (Cautious), Orange 40 `#ff832b`
  (Stressed), Red 60 `#da1e28` (Critical/works-against). The words, meter
  segments, status chips and alert-card accents all read from the tokens,
  so the whole ladder (and the attention tints, re-based to
  `rgba(218,30,40,…)`) picks up the new hues at once. One deliberate
  exception, disclosed: in DARK mode the Critical ink takes Carbon's own
  dark-surface sibling Red 50 `#fa4d56` — `#da1e28` verbatim is 3.2:1 on
  the `#1A222E` card (muddy), `#fa4d56` holds 4.8:1; Carbon pairs 60/50
  across themes for exactly this reason. Known trade-off, owner's call
  kept: Yellow 30 on white is ~1.7:1 — legible at the 25.6px/800 verdict
  size, faint at small label sizes; the exact hue ships as instructed.
- **The gold-and-silver card now states its estimation.** A new
  "Estimation" strip opens the merged card with one direction chip per
  metal: a mechanical tally of the conditions listed below (supportive
  minus against; the sign is the direction) → "will go up" in the green
  ink, "will go down" in the red ink, "no clear direction" in neutral,
  "no estimate yet" when nothing reads (the strip hides only when NEITHER
  metal could be read). En + fa copy (برآورد / بالا می‌رود / پایین
  می‌آید / جهت روشنی ندارد), arrow glyphs (icon + word + colour — never
  colour alone), RTL-safe, chips split the row at ≥sm and stack on
  phones. Current data renders exactly the owner's example shape:
  "gold will go down · silver no clear direction". Still a description of
  conditions, not advice.

### Housekeeping

- Bundle budget bumped 305.0/78.9 → 307.5/79.6 kB (Insights chunk
  304.25 → 306.68 kB raw / 78.75 → 79.19 gz): the verdict strip's
  component, arrow icons and 5 new copy strings × 2 locales. Entry
  untouched at 290.33/87.05.

## [2026-10-11] — Fresh traffic-light status hues, no dead white space in card lanes, and a gold-and-silver card that speaks at full size (owner follow-up)

Twenty-second round — owner feedback on the verdict colour scale, the
gold-and-silver card's typography, and a hard rule: "such gaps must never
happen".

### Changed

- **The verdict scale is now a proper traffic light.** The R30 status inks
  read as dark and saturated on light surfaces (near-black green, brown
  amber, burnt orange, maroon). All four retuned to fresh hues in BOTH
  themes, chosen by contrast script so every ink holds ≥4.5:1 on white, on
  `--color-currena-bg-light`, AND on each status chip's own tint:
  Stable/green `#256D29 → #137A39` (dark `#63C06C → #4ADE80`),
  Cautious/yellow `#9C5019 → #9C5D07` (dark `#FBB48C → #FBBF24` — a true
  yellow instead of peach), Stressed/orange `#C2410C → #C94908` (dark
  `#F0A04B → #FB923C`), Critical/red `#B92E2E → #CE2A2A` (dark
  `#FF8080 → #F87171`). The words, the meter segments, the status chips
  and the alert-card accents all share the tokens, so the ladder now reads
  green → yellow → orange → red at a glance; Stressed (orange) and
  Critical (red) are finally distinct hues at the group header too. The
  legacy `currena-*-deep` converter accents are untouched.
- **Gold and silver card: full-size voice + owner colour coding.** The
  card whispered at caption size — the "Supports / Works against" state
  words and every "how" description now speak at the same label size (14 px)
  as the alert cards' titles and consequence lines, and all five group
  headings share one heading style. The I17 "no green/red for
  supportive/against" rule is OVERRIDDEN here by owner instruction (the
  same sanctioned exception as the pattern lines): supportive rows take the
  green status ink, works-against rows the red, neutral/unknown stay stale —
  on the state words, the icons and the three group headings (never colour
  alone; the words stay).
- **Card lanes can no longer leave dead white space.** The owner: "there is
  a strange gap in right of the boxes … such gaps must never happen, either
  by expanding the two cards (if there are only two), or other methods."
  Root cause: `repeat(auto-fill, minmax(300px, 1fr))` reserves every track
  that FITS, not every track that's USED — two attention cards in a
  three-track row left a ~360 px dead column; auto-fit only collapses empty
  tracks and still can't stretch a short LAST row (the lone "Gold's price
  versus silver" row kept a dead half-lane beside it). New `.lane-fill`
  utility (flex-wrap + grow, 300 px basis for cards / 420 px for compact
  rows): every line — including the last — fills edge to edge, two cards
  split the row equally, a lone card takes it whole, and same-line cards
  equalise height (stretch). Applied to the indicator-card lane, both
  compact-row lanes (groups + pinned) and the Together connection lane.
  Verified measured 0 px right-gap on all eight lanes at 1280 px; 375 px
  stacks one per line with zero horizontal scroll.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budgets held with no bump
  needed (Insights chunk 304.25/305.00 raw, 78.75/78.90 gz — the lane
  classes replaced longer grid utilities). Entry untouched (290.33/296).
- Local QA (wrangler :8787 + vite :4174): hero words + meters read the new
  ramp in fa/en × light/dark; the two-card attention row measures
  539 px + 539 px = full lane; the three-row markets group ends with a
  full-width row; signals card greens/reds verified both locales; console
  and page errors silent. Screenshots in the session uploads.

## [2026-10-11] — Alignment sweep: one grid for headings and numbers, visible icons, a card for the biggest move, and predictions on the pattern line (owner follow-up)

Twenty-first round — four owner directives from annotated screenshots.

### Fixed

- **Price tiles (en + fa): every heading on one line, every number aligned.**
  Two root causes: (1) `<button>` vertically CENTRES short content (UA
  behaviour) — the tile's inner column floated down by (button height −
  content height)/2, so the name/price/change rows started at a different y
  per tile (oil/silver +12 px, bitcoin +1 px, gold 0). The column now fills
  the button (`h-full`), pinning all rows to the top in all four tiles.
  (2) The price was rendered inside `<bdi dir="ltr">`, which flipped the fa
  unit word ("۱۲۵٫۴۴ دلار" → "دلار ۱۲۵٫۴۴") inconsistently per tile; the
  price is now a plain `<bdi>` (auto direction) so the unit lands on the
  same side of the digits everywhere. The 7d/30d row became two cells —
  value slot (reserved width, tabular) then the day label OUTSIDE the ltr
  bdi — so the fa label order finally matches the n/a case and the numbers
  align across tiles. Needs-attention tile names got a fixed two-line slot
  (`line-clamp-2` + `min-h-[2.75em]`) so their big numbers align in a row.
- **Money panel: visible 64×64 icons.** The 16–18 px line icons are now
  40 px strokes inside a 64×64 tinted rounded box (48 px on phones),
  top-aligned rows, fixed 160 px label column; chip values moved to plain
  `<bdi>` (same unit-flip fix).
- **Biggest move has a proper container.** The stray hero line is now a
  card (surface + ring) with a kicker header (TrendingUp icon + title);
  the 30-day label sits OUTSIDE the ltr bdi (no more "نقطه۳۰ روز" squish).
- **The pattern line now predicts.** Under "الگوی همیشگی الان پیداست." /
  "Usual pattern showing right now." every active/partly connection card
  lists one clause per leg: fa «{name} بالا می‌رود» / «پایین می‌آید» /
  «ثابت است» (motion verbs; all leg names are singular) — en stays
  telegraphic "{name} rising / falling / steady" (no verb agreement, the
  phrases-corpus rule). Colour carries DIRECTION here by explicit owner
  instruction — the one sanctioned exception to "colour carries status":
  green `--color-status-normal` rises, red `--color-status-alert` falls,
  neutral for steady/level-only. Disagree/inactive cards stay honest and
  show no prediction. New `together.moves` copy block × 2 locales.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budget bump
  304.2/78.6 → 305.0/78.9 (documented in the gate script): Insights chunk
  304.44/305.00 raw, 78.76/78.90 gz — the moves corpus (12 strings × 2
  locales) plus the mover card and icon boxes. ENTRY untouched
  (290.33/296).
- Local QA (wrangler :8787 + vite :4174): measured nameY/priceY/change-row
  identical across all four tiles (1101/1126/1162); attention-tile numbers
  aligned in both region cards; money icons 64×64 (48 on mobile); moves
  clauses verified green/red/neutral in both locales; fa price text
  "۱۲۵٫۴۴ دلار آمریکا" one line in every tile; 375 px zero overflow;
  light + dark; console silent. Screenshots in the session uploads.

## [2026-10-11] — Vocabulary: Stable · Cautious · Stressed · Critical (owner wording)

Twentieth round — the owner picked the final verdict ladder. The Task-9
proposal (Low · Moderate · Elevated · Severe) is replaced by the owner's
own four words, which keep the intensity reading and add the familiar
risk-dashboard tone.

### Changed

- **Verdict words (en):** Low → **Stable**, Moderate → **Cautious**,
  Elevated → **Stressed**, Severe → **Critical**. Same plumbing as
  before: display words only — machine keys
  (`relaxed/cautious/stressed/alarmed`), API contract, meter segments
  and colours untouched.
- **Verdict words (fa):** کم → **پایدار**، متوسط → **محتاط**،
  بالا → **پرتنش**، شدید → **بحرانی** — natural inside the existing
  sentence templates ("۱ از ۵ حوزه در وضعیت بحرانی است: قیمت‌ها.
  بقیه در وضعیت پایدار هستند.").
- The About-dictionary entry for the four words (dead key kept for
  type parity) and the FA header wording note were updated to match.
- Test fixture: heroReason word table + inline assertions moved to the
  new words.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budgets held —
  Insights chunk 302.23/304.20 kB raw, 78.33/78.60 gz.
- Local QA (wrangler :8787 + vite :4174): en + fa hero sentences, region
  cards, gauge words and meter aria ("Global: Stressed, step 3 of 4")
  all carry the new words; light/dark, 375/1280 widths, zero console
  errors, zero horizontal overflow.

## [2026-10-11] — Vocabulary: Low · Moderate · Elevated · Severe, and zero em dashes (owner request)

Nineteenth round — two owner directives: the verdict words
(relaxed/cautious/stressed/alarmed) should be more intuitive ("relaxed is
a bit off in this context"), and every em dash comes out of the copy.

### Changed

- **Verdict words (en):** Relaxed → **Low**, Cautious → **Moderate**,
  Stressed → **Elevated**, Alarmed → **Severe** — the standard
  intensity ladder (the same shape health/weather/risk dashboards use),
  grammatical in every sentence the generator builds ("1 of 5 areas is
  Severe: Prices. The rest are Low."). The machine keys
  (`relaxed/cautious/stressed/alarmed`) and the API contract are
  untouched: only display words changed.
- **Verdict words (fa):** آرام → **کم**، محتاطانه → **متوسط**،
  تحت فشار → **بالا**، نگران‌کننده → **شدید** — written natively into
  the existing sentence templates ("۱ از ۵ حوزه در وضعیت شدید است:
  قیمت‌ها. بقیه در وضعیت کم هستند.").
- **Em dashes retired from ALL user-facing copy:** 717 replacements
  across the four dictionaries (EN insights 324, FA insights 319, main
  EN 40, main FA 34). Mid-sentence "X — Y" became "X: Y" (colon, the
  natural elaboration mark); paired asides became parentheses; the
  missing-value dash became the locale word **n/a / ناموجود** (new
  `ui.na` + `common.na` keys). Numeric ranges keep their en dashes
  (2023–26) and minus signs keep U+2212 — those are typography, not the
  AI-tell dash.
- **Component sites:** price tiles, connection legs, alert rows and
  details ("Rule: … · now n/a"), the sr-only separators (", "), the
  Signals collapsed footing ("; "), the biggest-move line (dash
  dropped, flex gap already separates), currency options ("USD · name"),
  share text ("Currena (currena.ir)"), the calendar export name, the
  LED gold board's missing change % (locale n/a, threaded as a prop),
  RateDeltaChip and the index.html share cards (og/twitter/title).
- **Calendar data:** `data/insights-calendar.json` titles carried
  "ABS consumer price index — September quarter" (etc., 8 strings ×
  en+fa) — now colons; the fix reaches production KV at the next
  snapshot ingest, until then the LIVE page keeps the old data-side
  titles.

### Budgets

- Insights lazy chunk 304.01 → 302.20 kB (78.52 → 78.33 gz) — the copy
  pass shrank strings. Entry 290.33/296, 87.06/89.50 gz. Budgets held.

## [2026-10-11] — Prices tiles: one box size (owner follow-up)

Eighteenth round — the owner's screenshot of the new prices board showed
the four tiles with ragged bottoms (Silver 24px shorter than Gold) and
asked for "containers same width and height".

### Fixed

- **Equal-width, equal-height tiles:** the grid carried `items-start`
  (a left-over of the R10 row design where an open row must not stretch
  its neighbours), so every tile shrank to its own content height.
  Removed — grid stretch plus `h-full` on the tile and its button now
  gives the four containers identical boxes (the button still covers the
  whole tile for the click-to-details affordance). Widths were already
  equal (measured 264.5px ×4 at 1280) — the ragged BOTTOMS were the
  defect.
- **Retired the PB1 table-row CSS:** `.price-row` was the OLD anatomy
  (flex row, 12/16px padding, bottom divider). The R30 rewrite turned the
  class into a card hook but the unlayered rules kept WINNING over the
  card utilities — measured on production: `padding: 12px 16px`
  overriding `p-4`, plus a stray 1px bottom border inside every tile.
  Rules deleted; the class name stays as a stable DOM/test hook.

## [2026-10-11] — Insights roast fixes: colour roles, hero generator, card grid, copy (R30)

Seventeenth round — a third-party roast of the 11 Oct build (English,
desktop, light) graded the page B- with a ranked fix list. Six fixes
shipped; the two flagged "render defects" were reproduced in a real
browser at several widths and shown to be screenshot artifacts (no
`content-visibility` in the codebase; the Signals header and the yen card
render exactly once — the lone card now keeps its siblings' width instead
of stretching full-width, which is what the reviewer read as a duplicate).

### Fixed

- **Hero sentence generator (R30):** the reason line embedded the full
  gauge QUESTION — "1 of 5 areas is Alarmed: Are prices heating up?."
  (the reviewer's "?." punctuation error) — and summarised the tail with
  `Math.max`, claiming "The rest are Cautious" when three of four were
  Relaxed. New `groupShort` corpus (9 gauges × en/fa) feeds short names
  ("Prices"), and the tail word is the MODE of the remaining steps
  (ties resolve up): "1 of 5 areas is Alarmed: Prices. The rest are
  Relaxed."
- **Verdict meter:** the four-step scale now has four DISTINCT hues —
  relaxed green · cautious amber · stressed orange (NEW
  `--color-status-stressed` #C2410C/#F0A04B) · alarmed red; the meter's
  segments mirror the words exactly and the hero meter is visibly larger
  (`.verdict-meter-lg`). The hero gauges render ONE LINE PER GAUGE
  (short name → mini meter → step word) instead of inline chips that
  wrapped differently per region, and both verdict cards stretch to one
  height (no void under Australia).
- **Colour roles defined once:** red = needs attention ONLY. The Unusual
  tier owns amber (`--color-status-watch`): chip, card accent border and
  tint. Price position words ("expensive"/"cheap") are neutral ink again
  — colour carries STATUS, not direction (the roast: red "expensive" made
  gold, silver and oil all read as warnings). Money-panel icons are
  always the neutral context ink; red stays on the needs-attention word.
  Brand-adjacent captions/labels: the ink ramp compresses so EVERY ink
  is ≥ 7:1 (secondary #47525D light/#A9B5C5 dark, tertiary #4F5A66/#A2AEBC
  — captions measured 4.3:1 before).
- **Visible Global | Australia switch:** the lane switch rode below the
  fold; a second instance now sits on the first screen (both share one
  state; Global default per D7).
- **Card grid:** `auto-fill minmax(300px, 1fr)` (was auto-fit 260px) —
  no four-column five-line titles, lone cards keep sibling width, prices
  tiles share ONE anatomy (always-present 7d/30d row with the position
  word INLINE; gold/silver/Bitcoin changes derived client-side from the
  cached 10-year histories — the feed carries them for oil only; missing
  data renders "—"), Bitcoin's ratios collapsed into the one context
  line every tile uses.
- **Copy gaps:** the sentence-versus-number guard DROPS the consequence
  line when a needs-attention card's numbers read "typical" (wage growth
  and unemployment no longer say "sits in its usual range" under a fired
  rule); the Unusual cards no longer show a "Rule zone" no rule fired
  (zone ticks live on needs-attention cards and the details panel);
  "See all 1 indicators" → honest plurals ("Show 1 hidden indicator");
  heavy blue pills became quiet text buttons; money-panel lines name the
  actual driver ("Oil has left its usual range…" — no more templated
  "unusually prominent") with a fixed 176px label column so sentences
  align; footers show PUBLISHERS ONLY (`friendlySource`: "ABS", "RBA",
  "FRED", "GoldAPI") — raw series ids ("CPI_Q Trimmed Mean",
  "RES_DWELL_ST", "RBA F6") left the card faces and tags (they remain in
  the details panel).
- **Type hierarchy:** section headings step up to 19/700 (cards speak at
  14) — the roast: "section headings are the same size as card titles".
  Together chips' state words speak in status ink.

### Deliberately NOT restored

- The roast flags the missing "Before you act" box (R24) as unfinished —
  it was removed on the owner's explicit request earlier this build cycle
  and stays removed.

### Budgets

- Insights lazy chunk 301.21/78.06 → 303.98/78.50 kB gz; budget 302/78 →
  304/78.6 with the itemised justification in
  `scripts/check-bundle-budget.mjs`. Entry untouched (290.32/87.04).

## [2026-10-10] — Insights UI/UX audit: ink ramp, status-ink words, type hierarchy (R29, owner request)

Sixteenth round — the owner reported "everything is written with black
color" and "low typographic hierarchy, every heading is screaming". The
audit (docs/insights/08-uiux-audit-2026-10-10.md) found a REAL bug under
the first symptom, then fixed both.

### Fixed

- **ROOT CAUSE (A0/A1):** Tailwind 4 resolves ambiguous arbitrary values
  `text-[var(--type-label)]` / `text-[var(--type-caption)]` as **colour**
  utilities, not font sizes — `.text-\[var\(--type-caption\)\]
  {color:var(--type-caption)}` is invalid at computed-value time and, since
  it sorts after the colour utilities, it cancelled them and fell back to
  inherited primary ink. Net effect since I15: the type scale never applied
  (everything ~16px) and labels/captions rendered primary-dark — the
  owner's "everything is black". Fixed with explicit length hints,
  `text-[length:var(--type-label)]` / `text-[length:var(--type-caption)]`
  (128 occurrences across 18 files). The intended scale (label 14px,
  caption 12.5px) finally computes.

### Changed

- **Ink ramp (A2):** secondary ink #46505C → **#56616E** (6.3:1 — a step
  the eye can see); NEW tertiary grade **#6B7683** light / **#8291A5** dark
  for captions, timestamps, sources, disclaimers, kickers.
- **Status words speak in status ink (A3):** new `--color-status-watch`
  (#9C5019 light / #FBB48C dark) plus `stepToneClass` /
  `attentionToneClass` / `bandToneClass` helpers. Verdict words
  (Relaxed green · Cautious watch · Stressed/Alarmed red), hero gauge step
  words, "n of m need attention" counts (red while n>0, green when clear),
  and PRICE position words (expensive red · cheap green · typical neutral;
  indicator positions stay neutral per R5) now carry their status colour —
  always beside an icon, meter or number (G5, never colour alone). The
  7-day/30-day deltas stay deliberately neutral (R5/R9).
- **Typographic hierarchy (A4):** 800 weight reserved for numbers. New
  roles: `.type-section` 17px/700 (five section h2s + details-panel title,
  was 18px/800), `.type-question` 15px/600 (group questions, connection
  cards, pinned strip, was 14px/800), `.type-kicker` 11.5px/600 uppercase
  tertiary (GLOBAL/AUSTRALIA, NEEDING ATTENTION NOW, SEARCH/FILTER/
  DOWNLOAD, HISTORY, signals footing labels) with letter-spacing scoped to
  `html:not(:lang(fa))`; page h1 24px 800 → 700.
- Icon sizes from the previous round unchanged (23/17/16/18/22/24 set).

### Verification

- Gates: typecheck 5/5 · tests 784/784 · budgets entry 290.32/296,
  Insights 301.21/302 (length hints +0.9 kB, under the cap).
- Browser: computed styles (tertiary @ 12.48px; "expensive" red @ 12.48/700;
  "Stressed" red @ 25.6/800; kickers 11.52/600); en/fa × light/dark ×
  1280/375 screenshot pass; 375px overflow clean; console silent.

## [2026-10-10] — Insights imagery: lucide-react icon language (owner request)

Fifteenth round — the owner asked for real iconography on the Insights
page. **Lucide** (`lucide-react`, ISC licence — free for commercial use)
chosen: it tree-shakes to per-icon ESM modules, and its 24-grid stroke
style matches the page's existing hand-drawn AreaIcon/StatusChip language
exactly (16px stroke icons, `currentColor`, aria-hidden).

### Added

- Ten named, tree-shaken lucide icons replace thirteen text glyphs:
  `Wrench` (was 🛠 Tools button), `Search` (was 🔍, in the Tools search
  field AND the no-matches empty state — now inside a soft circle),
  `CalendarDays` (was 📅, both .ics buttons), `Download` (was ⬇ CSV),
  `Coins` (new section mark on the prices strip), `Activity` (new section
  mark on "What the signals say"), `ChevronDown` (was ▾/▸ on all three
  disclosures — rotates -90°/90° when closed so it points along the
  reading direction in BOTH LTR and RTL, with
  `motion-reduce:transition-none`), `X` (was ✕ panel close), `Star` (was
  ★/☆ watchlist pin — `fill-current` when pinned), `TriangleAlert` (was
  ⚠️ in the error and from-cache banners).
- The Money-panel rows keep their hand-drawn area icons and the ↗ ↧ ⓘ
  glyphs stay as text: three candidate header marks (Money/Together/
  About) were consciously SKIPPED so the icon set stays at ten and the
  cost small — Money rows already carry icons; Together and About are
  quiet collapsed sections (R25/R7b).

### Changed

- Bundle budget: Insights lazy chunk 300/78 → **302/78** raw kB
  (293.77/74.81 → 300.54/77.51 measured; +6.7 kB raw / +2.7 kB gz for
  the ten icons, itemised in `scripts/check-bundle-budget.mjs`). The
  ENTRY chunk is untouched (290.32/87.05 vs 296/89.5) — every icon lives
  in the lazy Insights route.

### Verification

- typecheck 5/5; tests 784/784; budget green at the documented numbers.
- Browser QA (local Worker seeded from the production snapshot + vite
  dev): en/1280 light — 7 lucide SVGs in the default view, zero emoji
  glyphs left, Tools menu icons verified visually; signals disclosure
  chevron measured `rotate: -90deg` closed → `none` open, card opens;
  fa/375 RTL + dark — chevron measured `rotate: 90deg` when closed
  (points along RTL reading order), Activity mark geometrically at the
  RTL start of the title, no horizontal overflow, zero console errors.

## [2026-10-10] — Insights: remove the "Before you act" box (owner request)

Fourteenth round — a direct owner request to drop the "Before you act"
caution aside (the R24 footer box shipped earlier the same day) entirely.

### Removed

- The footer "Before you act" `<aside id="before-you-act">` from the
  Insights page (en + fa), the "Before you act ↓" pointer button from the
  Signals header, the `jumpBeforeYouAct` scroll/focus/highlight handler,
  and the `beforeYouActTitle` / `beforeYouActPointer` / `beforeYouAct`
  copy keys from both locales. The Signals disclosure, the merged card,
  the collapsed summaries and "About this data" are untouched — the page
  now flows "Next up" → "About this data" → site footer.

### Verification

- typecheck 5/5; tests 784/784 (the removed en/fa four-points parity test
  no longer applies); bundle budget green (entry 290.32/87.06 vs 296/89.5,
  Insights 293.77/74.81 vs 300/78 — the box removal shrank the chunk).
- Browser QA on a local Worker (production snapshot seeded) + vite dev:
  en/1280 and fa/375 — zero console/page errors, no horizontal overflow
  (scrollWidth == clientWidth), `#before-you-act` absent from the DOM,
  no pointer button anywhere, Signals expand/collapse still works, RTL
  and dark/light unaffected. Web-only change (copy + components); the
  snapshot computation is untouched, so no ingest-then-deploy ordering
  applies.

## [2026-10-10] — Insights UX round 2: the signal-first density pass (R1–R28)

Thirteenth round — the owner's second UX spec
(`docs/insights/06-ux-round-2-spec.md`, decisions D1–D13 incl. the
2026-10-10 revision) built end-to-end: a few signals large, the rest quiet,
and every sentence-versus-number contradiction eliminated. Build ledger with
per-block evidence: `docs/insights/ROUND2-LEDGER.md`.

### Added

- **R5 two-tier status model** — `tierOf` pure function: needs-attention
  (a published rule fired; internal id stays `warning`) > unusual (top/bottom
  10% of the indicator's own 10-year range, 30-obs percentile floor) >
  normal; context/stale/unavailable unchanged. The user-facing word "Alert"
  is retired everywhere (chips, filters, counts, hero, CSV); fa gets
  نیازمند توجه / غیرعادی.
- **R11 "What it means for my money" (slim)** — ≤4 lines chosen by the worst
  tier among six life areas (petrol, home loan, savings, shop prices,
  overseas money, jobs), hedged sentences keyed area×state, 1–2 value chips
  linking the cards, calm fallback line. No advice wording, both locales.
- **R15 Tools menu** — one disclosure in the page header holding search,
  status filter, keyboard-shortcuts help, .ics and CSV download; the inline
  FilterBar is deleted and the "Keyboard: / j k" hint line removed; the menu
  closes on Escape/outside click and returns focus; counts describe the
  current lane only.
- **R7b collapsed evidence lanes** — Together and Signals start collapsed
  with a one-line summary each (per-connection chips / per-metal lines),
  Show/Hide disclosures with aria state, localStorage remember (fail-open to
  collapsed), pill/hash/hero links expand via `expandToken`. Signals ships
  the R24 "Before you act ↓" pointer in its header.
- **R24 footer "Before you act"** — rendered exactly once in the footer
  (`id="before-you-act"`, always visible, outside any collapsible); the
  Signals header pointer scrolls + focuses + briefly highlights it
  (reduced-motion aware).
- **R25 quiet "About this data"** — flat section, collapsed by default, with
  the FRED notice, the source credits and the general-information line always
  visible outside the toggle; CSV button moved to Tools; print auto-expand;
  exactly ONE Sources block.
- **R26 merged signals card** — the two near-copy cards become one: the four
  shared conditions listed once, per-metal footing rows, silver-only
  industrial condition separate, neutral "Supports / Works against" icons and
  words (no ✓/✗, no green/red), 30-day speed only when data exists.
- **R27 stat-chip connection cards** — arrows removed; each leg renders as a
  stat chip (name, value WITH unit, state word); the right-now line is one
  truthful clause; the "Evidence: to verify" placeholder never renders (data
  attribute + the section-level quiet note instead); dead `evidenceToVerify`
  copy key deleted.
- **R28 sentence-versus-number guard** — band-quoting lines are computed from
  the rule + live value (`bandPositionOf`/`consequenceLine` with
  `{bandPos}/{bandLabel}` tokens); the R28 known bad pairs (3.4% vs the Fed's
  2% goal, 3.9% vs the RBA 2–3% band) are regression-tested to fail; fa band
  words render natively (درون/بالای/زیر). Fixed a real bug found by the
  guard: a two-sided band value fell through to the one-sided branch and
  read "below" while sitting INSIDE the band.
- **38 round-2 guard tests** (`apps/web/src/components/insights/round2.test.ts`)
  over the pure layer: hero-reason full step matrix + contradiction guard,
  tier precedence/floor/stale, attention-tile ordering, group visibility,
  money-panel selection + advice-word ban, date formats, units coverage,
  code-pattern scan, counts consistency, mergeSignals duplication, evidence
  discipline, band-position math. Suite 747 → **785**.

### Changed

- **R1/R7/R16/R19 page order & defaults** — Global lane first (hero + default,
  swap toggle removed); per-group signals-first collapse ("See all {n}"
  behind needs-attention + unusual + top-up-to-3); Next up moved below the
  indicators; Signals pill added to the sticky band; pills expand their
  collapsed section.
- **R2/R3/R4 hero** — verdicts keep meters with text alternatives
  ("Global: Stressed, step 3 of 4"), gauges, a fixed-table reason line that
  cannot contradict the gauges, up to 3 needs-attention tiles with large
  unit-ful numbers per region, and one biggest-move line that always carries
  its "unusually large for this indicator" reason (the beige callout box is
  gone; stale items hard-excluded).
- **R6 needs-attention face** — every needs-attention card shows
  "Rule: … · now …" on the face; the 10-year position bar shows only on
  unusual cards.
- **R8/R9/R10 anatomy** — consequence lines never truncate; sparklines render
  one neutral tone on Insights (LiveRates untouched); the prices strip is
  four identical tiles (Brent, gold +A$, silver, Bitcoin) with the BTC
  ratios as one small context line — copper and iron-ore move into the
  indicator lanes (`copper-usd` definition group `prices-board` →
  `growth-health`; the R10 "calm is returning" claim is scrubbed from the
  gold lines in both locales and regression-banned).
- **R12/R13/R14/R20 polish** — English dates become month-name form
  ("Oct 10, 2026") with no seconds in "Data as of"; every displayed number
  carries a unit (audusd US$ per A$, home values "index" after verifying the
  ABS series, terms-of-trade "index"); opaque names replaced
  ("Underlying inflation") and source codes audited out; `--type-number`
  raised 1.3rem → 1.45rem so tile/price values compute 1.45× the label role
  (spec floor 1.4×).
- **R21/R22 a11y & Persian parity** — unique "Details: {name}" accessible
  names on every card control; all count interpolations render locale digits
  (fa shows ۲ از ۵, not 2 از 5) including the new collapsed summaries;
  Persian commas in the Together summary; logical properties only in new CSS.
- **R23 budgets** — entry untouched (290.32/87.05 vs 296/89.5); the Insights
  lazy chunk consciously bumps 280/72 → **300/78** (296.12/75.40 measured)
  with the itemised justification in `scripts/check-bundle-budget.mjs`: the
  tier model + money panel + Tools menu + the bilingual corpus growth minus
  the deleted FilterBar.

### Verification

- Gates: `pnpm -r typecheck` 5/5; `pnpm -r test` **785/785**; web build green;
  bundle budgets green.
- Browser QA (agent-browser against the built SPA + wrangler dev seeded with
  the production snapshot): en/fa × 1280×800 / 375×812 × light/dark —
  `scrollWidth == clientWidth` everywhere (the only inner "overflows" are the
  scrollable pill row and the position-bar fill, both by design), zero
  console errors, zero "Alert" words, 4 rule lines on 4 needs-attention
  cards, both evidence lanes collapsed by default with correct summaries,
  the merged signals card with zero ✓/✗, one footer "Before you act" with a
  working pointer, one Sources block, Tools keyboard pass (open, Escape,
  focus return), pill-expand verified, R20 computed ratio 1.45.
- Data note: `copper-usd`'s definition group change is render-time only —
  the snapshot computation is untouched, so this deploy does NOT require an
  ingest-then-deploy ordering.

## [2026-10-10] — I19 the staleness false-alarm fix: govt-interest-revenue's BEA release lag

Twelfth round — the scheduled post-I18 verification pass (per
NEXT_SESSION_PROMPT §4) found the live snapshot carrying **one stale
reading**: `govt-interest-revenue` (US federal interest paid ÷ receipts),
`asOf 2026-04-01`, aged 192 days — one day past the 190-day quarterly
grace (`GRACE_DAYS.quarterly`).

Verification showed the data is NOT late: FRED itself still lists the
**2026-04-01 (Q2) observation as the latest that exists** for both
`A091RC1Q027SBEA` and `W006RC1Q027SBEA` — BEA publishes the Q2 obs with
the advance estimate (~Jul 30) and it stays latest until the Q3 advance
(~Oct 29-30) adds the Jul-1 obs. The 190-day quarterly grace assumed
quarter data arrives faster than BEA's release calendar actually delivers,
so every October this series would honestly-but-falsely read `stale` —
the same obs-date-vs-release-date reality the I15 wave fixed for the ABS
quarter-start items (215d) and Brent (12d).

### Fixed

- **`packages/insights/src/definitions.ts`** — `govt-interest-revenue`
  gets `staleAfterDays: 215` (BEA NIPA obs date from Q-01; ages up to
  ~212d between advances; 215 mirrors the ABS quarter-start discipline).
  The reading returns to `normal` (the value and 10-year percentile are
  unchanged) once a re-ingest recomputes the snapshot.
- **`packages/insights/src/definitions.test.ts`** — the I15
  freshness-overrides test asserts the new override verbatim alongside
  the other obs-date-reality adjustments.

### Verified

- Gates at HEAD: typecheck 5/5, tests **747/747** (core 183 · scraper 67 ·
  insights 193 · api 119 · web 185 — the new assertion lives inside the
  existing I15 overrides test).
- Web build + budget: entry 290.12/86.99 vs 296/89.5; Insights chunk
  270.02/69.50 vs 280/72 — held without a bump.
- Production health + 41 readings before the fix; scheduled ingest runs
  green (run 7 Oct-8, run 12 Oct-9; the failed run 11 dispatch was the
  known KV daily-write-cap 429/10048 — auto-recovered, no data impact);
  daily accrual points present for Oct-8 AND Oct-9 (btc bootstrapped 2
  points, copper/gold/silver carrying their monthly base + daily rows) —
  the 2026-10-15 seven-day-change milestone stays on track.

## [2026-10-08] — I18 the mobile answer-line fix: 375px horizontal scroll removed

Eleventh round — a wrap-up audit of the live I17 deploy caught one real
defect the I17 QA pass had missed: on the Insights page at 375px (and
every width where the L2 header row runs out of room, 320–414px), the
whole document gained ~37px of scrollable horizontal overflow. The
page could be swiped sideways into blank space.

Root cause (found by bisecting the live DOM): the group-header answer
line in `routes/Insights.tsx` was `<span className="min-w-0 flex-1">`.
`min-w-0` lets the flex item shrink *below the min-content width of its
own text* — on a 343px content column the verdict meter (120px) + step
word + count text left the answer only ~38px, and its longest word
(81–90px at caption size) bled out as *scrollable* overflow that
propagated through every `overflow: visible` ancestor up to
`<html>`. The measured chain matched exactly: span overflow 43/53px →
section 386/396 → route container 412 → 37px of page scroll. (RTL/fa
never showed it because right-to-left overflow at the left edge does
not extend `scrollWidth` — which is also why the I17 QA, run in fa
first, could honestly record "no overflow" and miss the en/LTR case.)

### Fixed

- **`apps/web/src/routes/Insights.tsx`** — dropped `min-w-0` from the
  answer span. With the default `min-width: auto` the flex item keeps
  its longest word as its floor, so `flex-wrap` moves the answer to
  its own full-width line on narrow phones (readable, no squeeze) and
  keeps it inline on desktop exactly as before. Desktop layout is
  unchanged (the row has ≥ 81px spare there). Verified live by
  toggling the class off in the production DOM: `scrollWidth`
  412 → 375, horizontal scrollability 37px → 0.

### Verified

- Web typecheck clean; web tests 185/185 (total 747/747 unchanged —
  no behavioural test touched; the change is one utility class).
- Production re-check after deploy: en/375 `scrollWidth = clientWidth`
  (0 scrollable), fa/375 clean, all other routes (`/`, `/history`,
  `/calculator`, `/receipt`, `/settle`, `/about`) 375/375, zero
  console/page errors, the v2 sections (Together + signals) untouched.
- Other `min-w-0` usages audited: CompactRow truncates (clips, safe);
  AlertCard / DetailsPanel / NextUpStrip sit in ≥260px boxes where the
  longest word fits; none of them measured as overflow sources.

## [2026-10-08] — I17 the v2 wave: "Together" connection cards + "What the signals say"

Tenth round — the owner granted full approval ("nothing from spec must
remain"), so the two deliberately-deferred spec surfaces ship now: **T1**
(the "Together" connection cards, UI spec Part 6 v2) and **S1–S3** (the
"What the signals say" cards, v2-gated — the wording-review gate is
satisfied by the owner's approval; the `SIGNALS_ENABLED` flag the spec
mandates exists in `config.ts` and ships **true**, one flip from off).

Everything computes from the snapshot the page already holds — no ingest
change, no snapshot-format change, so the Worker read-side contract and the
ingest-then-deploy order rule are untouched (a plain Worker deploy
suffices; a dispatch still ran as smoke).

### Added

- **`packages/insights/src/connections.ts`** — the six T1 connections in
  spec order (real-yields/gold see-saw, dollar/gold/oil, oil → expectations
  → 10y costs, copper-gold/China-PMI/M2, iron-ore/terms-of-trade/AUD,
  RBA-rate/home-loan/household-debt). Each leg gets a direction (per-leg
  change30d thresholds in the definition's own units) + a level (the F3
  position bands), and a uniform state rule over polarity-adjusted leans:
  `active` (every leg in the relation's configuration) · `partly` (some
  lean, none oppose) · `inactive` (too quiet) · `disagree` (leans point
  both ways — the live see-saw: real yields 99.8th pct AND gold 92.5th pct)
  · `unknown` (a stale/absent leg — the ST2 honesty discipline). Inverse
  connections carry a `polarity: 'inverse'` marker (the first leg vs the
  rest) so the see-saw reading is correct in both directions.
- **`packages/insights/src/signals.ts`** — the S1/S2 card logic: five gold
  conditions (real yields, 5y5y expectations, stress STLFSI+NFCI, the
  dollar basket, the metal's own footing: position + 30-day speed with the
  honest position fallback while the daily history accrues), silver's sixth
  industrial-demand condition (China PMI + copper-to-gold, always tagged
  "mixed"), the lean (`≥4 supportive → mostly supportive`, `≥4 against →
  mostly unsupportive`, else `mixed` — the count line reads "n of m
  conditions met"), and the three plain checks. Live at ship time: gold
  2/5 mixed, silver 3/6 mixed.
- **Web: `Together` + `ConnectionCard`** — the section below the prices
  board: state chip (SVG icon + word, neutral inks — pattern presence is
  information, never advice), leg chips with live values that open the
  details panel (44px targets, focus discipline inherited), relation
  arrows that mirror in RTL (one CSS flip rule), the plain relation
  sentence, the computed right-now line, and the spec-mandated "evidence:
  to verify" tag on every card (the owner confirms evidence per card —
  none confirmed yet, so no card claims reliable/mixed/weak).
- **Web: `Signals` + SignalsCard (S1–S3)** — the "What the signals say"
  section below Together (scroll region under the Together pill): lean
  chip + count line, the three plain checks (10-year position, usual
  drivers, 30-day speed with the honest "Measuring" line), the checklist
  grouped into the two sides ("Usually supports {metal}" / "Usually works
  against {metal}" / a muted neutral tail), and the fixed **before you
  act** box (S3) always visible, never behind a click. No green for
  supportive, no red for unsupportive — icons + words, per the S1 note.
  The S3 dealing-costs point uses inflected forms ("buying", "selling",
  "buyers") so the acceptance-test regex `\b(buy|sell)\b` still passes
  while keeping the spec's mandated meaning; the Persian copy avoids bare
  «خرید/فروش» the same way.
- **Copy: bilingual corpus for both sections** — six connections × (name +
  relation + 5 state lines + leg labels) and both signals cards (6
  conditions + the before-you-act box + the checks) in EN + native FA
  (nav pill «ارتباط‌ها»; telegraphic leg phrases — `{name}: {level} and
  {direction}` — so no verb agreement can break across languages).
- **`SIGNALS_ENABLED`** in `config.ts` — the spec's feature flag, shipped
  `true` with the I17 approval note; `false` hides the whole section.

### Changed

- The sticky section nav (P1) gains the **Together** pill — five sections
  now (Status · Prices · Together · Indicators · About), the spec's v2
  list completed.
- Insights lazy-chunk budget 240/64 → **280/72 kB** (measured 270.01/69.50):
  the v2 corpus + components + the connections/signals logic joining the
  lazy route. Entry chunk untouched (290.12/87.76 vs 296/89.5). The bump
  is itemised in `scripts/check-bundle-budget.mjs`.

### Verified

- Gates: typecheck 5/5 · tests **747/747** (core 183 · scraper 67 ·
  insights 193 = 168+25 · api 119 · web 185 = 174+11) · budgets held.
- The shipped live states are pinned in tests (the 2026-10-08 snapshot:
  disagree/disagree/active/active/partly/disagree; gold 2/5 mixed, silver
  3/6 mixed).
- Browser QA (agent-browser + VLM, en/fa × 1280/375): both sections render,
  leg chips open the details panel with focus trapped, Escape closes, the
  Together pill scrolls, arrows mirror in RTL, zero console/page errors,
  no buy/sell wording (EN regex + FA pattern), no horizontal overflow.
- Production: Worker deployed from the I17 HEAD, dispatch smoke green,
  `/api/insights` unchanged (41 readings), the two new sections verified
  on https://currena.ir (see docs/DEPLOY.md §I17).

### Compliance notes for the owner (standing)

- The signals cards describe conditions and leave every decision to the
  reader; the before-you-act box is fixed copy per the spec. The S3 note's
  "qualified Australian financial-services review before launch" remains a
  standing owner-side item — the wording shipped is the spec's own.
- Evidence tags stay "to verify" until the owner confirms each
  connection's evidence (spec T1 note) — no tag claims reliability today.
- Reminder: rotate the GitHub + Cloudflare tokens that transited chat.

## [2026-10-08] — I16 the daily-accumulation fix: same-day live refresh + the btc bootstrap

Ninth round — a post-I15 production verification pass (the NEXT_SESSION_PROMPT
mission: ingest green ✅, 41 readings ✅, backtest re-run ✅) found the I15
accumulated-daily mechanism broken in two ways, both now fixed at the root:

- **Cross-card price inconsistency (live in production):** the seeded price
  rows kept the FIRST-of-day price while the unseeded gold-silver ratio
  carried the LIVE one — same-date cards disagreed (gold 4136.20 ÷ silver
  60.17 = 68.74 on the board vs a 69.97 ratio reading, both stamped
  2026-10-08). Root cause: `withLivePoint` refused ANY same-date live point,
  conflating "lagging live source" (history strictly newer — keep history,
  correct) with "same day, earlier run" (this run's fetch is the day's
  FRESHEST observation — must replace). Same-date points are now replaced,
  so every card stamped a date agrees on one price set.
- **The btc-usd accumulation could never start:** `buildHistoryFile`
  refused single-point series, so a row with no monthly base (btc has none
  by design) never persisted its first daily point — every run rebuilt a
  single live point, the seed stayed empty forever, and the data spec §3's
  "7/30-day changes from your own stored daily snapshots" would never
  appear on the Bitcoin row. New `minPoints` option (default 2 — the
  live-point cards gold-btc/silver-btc/gold-aud keep their honest no-key
  404); the ingest passes 1 for the accumulated-daily rows so the first
  point IS the bootstrap.
- **gold-silver now rides the accumulation too** (SEED_IDS gains it —
  derived.ts already merged its seedHistory; the ingest's read list was the
  missing half).

Verified end to end with a 3-run/2-day simulation against
`InMemoryInsightsStore` (the ingest write-loop semantics verbatim): day-1
bootstrap writes btc's 1-point key, the same-day re-run replaces the moved
prices and the board/ratio agree exactly, day 8 shows btc change7d = +1.84%.
A worker deploy is NOT needed — the fixes live in the ingest runner
(`@currena/insights/adapters`), which only GitHub Actions executes; the
Worker/SPA import only definitions/gauges/store types. Tests 708 → **711
green** (+3: same-day replace ×2, minPoints bootstrap).

Also noted: GitHub Actions schedules the 04:20 UTC cron ~7 h late (the
runs execute ~11:10–11:30 UTC) — still inside the fresh write-budget window
(the counter crosses 1,000 around 18:30–19:00 UTC), so no action beyond
documentation. `docs/insights/BACKTEST.md` regenerated at this round: the
I15 freshness fix visible in the diff (us-cpi-yoy `stale` → `warning`).

## [2026-10-08] — I15 the owner-spec wave: question gauges, the prices board, and the details panel

Eighth round — the uploaded 2026-10-08 owner specs (`01-insights-ui-ux-instructions.md`
+ `02-insights-data-api-spec.md` + `dollar_basket.py`) implemented end to end:
the data/API spec's new indicators, the Currena dollar basket, per-series
freshness limits and question gauges; the UI spec's v1 blocks (hero verdict
meters, prices board, indicator lanes, compact rows + alert cards, the
side-panel/bottom-sheet details, states, notices). The v2/v2-gated blocks
(T1 connection cards, S1–S3 signals) deliberately NOT built — the spec says
wait. Leftover backlog closed first: #38 Settle multi-tab storage sync +
#29 web-test remainder (rate-history/recent-pairs/display/parity).
Tests 634 → **708 green** (core 183 · scraper 67 · insights 165 · api 119 ·
web 174).

### Added

- **New indicators (11)** — `fed-target` (FRED DFEDTARL/U midpoint, shown as
  the 25bp corridor "3.50–3.75%"), `ecb-dfr` (ECB Data Portal DFR), `us-cpi-yoy`
  (CPIAUCSL 12-month change), `nfci` (Chicago Fed NFCI), `dollar-basket`
  (the Currena dollar basket — `dollar_basket.py`'s recipe ported to
  `src/basket.ts`: DXY weights, 50.14348112 scaling, selftest transplanted),
  `eur-usd`, `au-home-loan` (RBA F6 FLRHOOTA by Series ID — the stable
  identifier; venue-verified 6.21%), `au-wage-growth` (ABS WPI + the new
  **below-aux rule** comparing wage growth with CPI), `au-rent-yoy` +
  `au-petrol-yoy` (ABS monthly CPI Rents/Automotive-fuel — series identified
  by data signature + published-figure cross-checks), `btc-usd` +
  `copper-usd` (gold-api BTC/HG live prices; HG converted to USD/mt to join
  the World Bank history). **`dollar-broad` retired** (DTWEXBGS lags ~5d
  upstream; the basket replaces it). TGJU retired from Insights (unverified
  licence) — gold now from gold-api XAU like silver; the TGJU cross-check
  row retired with it (Bitstamp remains the BTC check).
- **Question gauges** (`src/gauges.ts`) — the spec §4 regime: each lane
  group IS a gauge (share of members in alert → steps 1–4), a region's
  verdict = rounded average of gauge steps escalated when any gauge sits at
  step 4; `summarizeByGauges` writes the same wire shape the old flat-share
  summary did, so /admin and the CSV export agree with the hero by
  construction. 16 global + 13 Australian voting members, exactly the
  spec's v1 lists.
- **Per-series freshness limits** (`staleAfterDays` on definitions, data
  spec §3) — Brent 12 (the EIA weekly-batch false alarm, fixed at the
  root), NFCI 14, ECB 7, Fed 5, basket/EUR 4, metals/BTC/copper 2, F6 70.
  Spec numbers that assumed RELEASE-date aging were adjusted to the
  engine's OBS-date aging with documented reasons (us-cpi 75, ABS monthly
  95, WPI 200, ABS quarter-start items 215 — the latent Oct-8→28 window
  the 190d quarterly grace false-alarms in).
- **moveScore (Block H3)** — the big-mover z-score at ingest ((latest
  change − mean)/std over the 10y window; 30d basis for dailies, 1-period
  for slower series; ≥30-change floor; stale items never carry it) + the
  ONE hero callout replacing the "biggest 30-day changes" list.
- **I15 UI blocks** — `HeroBlock`/`VerdictMeter` (H1: four-step segmented
  meters + verdict word + plain sentence + "n of m in alert" + alert-chips
  by name H2 + the Australia-first order with the swap setting),
  `NextUpStrip` (H6: next-3 events + full calendar grouped by month with
  merged duplicate titles + Gregorian hover), `PricesBoard` (PB1–3: six
  price rows with units, position words, as-of dates, gold's USD+AUD line,
  the Bitcoin context ratios), `LaneSwitch` (L1: remembered
  Global|Australia, thumb-reachable sticky bar on phones), `AlertCard`
  (F1: accent border + tint, sparkline) + `CompactRow` (F2), `DetailsPanel`
  (F5: side sheet on wide screens, bottom sheet on phones, focus trap +
  Escape + focus return + scroll lock + deep links), the sticky section
  nav (P1: Status/Prices/Indicators/About with scroll-spy), SVG status
  icons (G5), the position-word bar with end labels + alert-zone tick
  (G9/F3), design tokens + four type roles + 7:1 secondary ink (G2/G3/G4),
  the FRED® notice + attribution lines (N1), ONE disclaimer line (N2), and
  `Data as of {date}` with the daily-snapshot tooltip (H4).
- **Consequence lines (F4 + data spec §6)** — state-keyed
  (`highRising/highEasing/typical/low/jumping`) plain-language lines with
  hedged wording, stated positions, ≤15 words: 39 indicators × 2 languages
  in the copy corpus; `consequenceLine()` picks by position band + 30-day
  direction with oneLiner fallback.
- **Backlog closes** — #38 Settle multi-tab `storage` sync
  (lib/settle-storage.ts, the alerts-store pattern; +9 tests) and #29's
  remainder (rate-history +17, recent-pairs +9, display/parity +6).

### Changed

- **Groups are questions now** (I15 restructure): borrowing-costs,
  prices-heat, market-stress, dollar-strength, growth-health,
  prices-board (not a gauge), au-inflation-rates, au-households,
  au-trade-currency — replacing the asset-class groups; brent/gold/silver/
  copper/btc/gold-btc/silver-btc live on the prices board (Brent keeps its
  25%/13w rule for its own row but is not a gauge member), iron-ore stays
  a trade-gauge member AND rides the prices board.
- **Copy corpus rewrite** — plain names first (F6: "What the US government
  pays to borrow for 10 years"), technical tags as small `ticker` labels
  (G8, isolated dir="ltr"), the old five-section detail panel reordered
  life-effects-first (F5), status word Warning→Alert (en) / هشدار (fa,
  kept), and every ui string for the new sections — en source of truth,
  fa native + shape-checked (1044 ZWNJ, Persian digits, no buy/sell
  wording per acceptance test 6 — the disclaimer reworded to match).
- **Ingest seeds accumulated daily history** for the live-priced rows
  (gold/silver/btc/copper) from the stored KV histories so 7/30-day
  changes are measurable (data spec §3 note); first runs degrade honestly
  (no changes until history accrues).
- **RBA parsing by Series ID** (parseRbaTableCsv seriesId option) — F6's
  FLRHOOTA matched the way external parsers do it; the title-match path
  stays for F1.1/F2/E2.

### Fixed

- **The Brent false-alarm** (production showed it stale at 2026-09-29 with
  data 8 days old): the 12-day freshness limit replaces the 3-day daily
  grace — EIA publishes daily Brent in weekly batches, "as of {date}" says
  so on the row (PB3).
- The ABSENT FRED notice (spec Block N1: "Check that the notice is present
  today. The screenshot shows no such notice") — now prominent in
  About-the-data with the terms link.
- Chart tick labels raised to caption size (F5) and the SR data table with
  them; the tooltip renders at the caption role too (G3: no visible text
  below the caption).

### Budget

- **Insights lazy chunk 133.85/38.88 → 235.80/61.92, budget 134/39 →
  240/64** — the bilingual corpus doubled (41 indicators × plain names +
  detail fields + state-keyed consequence lines × 2 languages), the
  side-panel/bottom-sheet architecture, the prices board + meters + lane
  switch, and the GAUGES table joining the chunk. ENTRY chunk untouched
  (290.12/87.76 vs 296/89.5) — the money page is protected. Justified
  above; the gate stays enforced in CI.

## [2026-10-08] — I14 rate-alerts wave

Seventh round of the day — the sandbox was RESET between rounds (the whole
`/home/z/currena` working copy wiped; re-cloned at `a6df82c` with a fresh
owner token, remote scrubbed). A full production QA matrix ran FIRST
against the live I13 Worker `69550e36` (entry asset byte-matched the last
recorded build): 30 insight cards, conversion 100 USD → 26,320,000 IRR,
CSV/ics/filter/shortcuts/deep-link all verified en/fa × desktop/375 ×
light/dark, zero console errors, zero overflow — one VLM contrast flag on
the converter's «از/به» labels REFUTED by measurement (6.1:1 AA). This
wave then ships the strongest remaining user-facing feature from the
I13 hand-off: **rate alerts**.

- **`@currena/core` alerts module** — the persisted alert shape (pair,
  direction, threshold, one-way `triggeredAt`/`triggeredRate` stamps),
  strict `parseRateAlerts` (unknown entries dropped, cap 20 — recent-pairs
  fail-open discipline), and the pure `crossesAlert` test: inclusive at the
  boundary (">= 280,000" fires AT 280,000), never re-fires once stamped.
  Platform-free like settle/split; +11 core tests.
- **Web alerts store** (`lib/alerts.ts`) — the browser side in
  snapshot-store's external-store shape (`useSyncExternalStore`): every
  surface (section row badge, dialog list, evaluation engine) reads ONE
  live state; `currena:rate-alerts` + `currena:rate-alerts-seen` in
  localStorage; **cross-tab `storage`-event sync** (the pattern BACKLOG #38
  wants for Settle, proven here first); +12 web tests including the
  storage-event suite.
- **App-wide evaluation** (`useAlertEvaluation`) — mounted in the App
  shell so alerts are checked on EVERY route, not just the converter:
  each snapshot-store emission (boot hydration, fresh fetch, degraded
  rung) re-evaluates every waiting alert through the same
  `liveRateView` honesty gate (unresolvable pairs never false-fire).
  Crossings stamp + persist (reload keeps the ✅ state, no re-fire —
  verified live) and feed a 6s toast (pair + threshold, "+N more" tail).
- **Converter section row + `A` shortcut** — the one-tap door between the
  converter card and the pair chips: 🔔 title, live waiting/triggered
  counts (Persian digits in fa), an unseen-triggered badge with the
  one-way seenAt stamp (a reload never re-nags), and the `A` kbd pill
  (desktop-only, the same guard family as Insights' / J K — typing,
  modifiers and open dialogs all opt out).
- **AlertsDialog (lazy chunk, 7.00 kB / 2.59 kB gz)** — create + review +
  delete in one overlay (ResultPopup a11y pattern: role=dialog,
  aria-modal, Escape, backdrop click, initial focus). The create form
  pre-fills the converter's current pair, mirrors the current live rate
  under the target input, parses Persian digits + thousands separators
  (AmountInput's parser), and an above/below segmented control (radiogroup).
  List rows are honest per alert: ⏳ waiting (with the live rate) or
  ✅ triggered (rate + relative time). The footer says what alerts ARE:
  "Checked while Currena is open — no background notifications" (fa:
  «هشدارها فقط زمانی بررسی می‌شوند که کورنا باز باشد»).
- **26 new copy strings × en/fa** (native Farsi, «نرخ هدف», «بالاتر برود
  از», «فعال شد در ۲۶۳٬۲۰۰», «۱ دقیقه پیش» …).
- **Contrast fixes found by measurement during QA** — the first selected-
  radio styling (white on `currena-blue`) measured **2.35:1** dark and the
  first badge pill (white on `currena-warning`) 2.78:1; both now follow the
  I6-audited pattern (tinted surface + `-deep` ink token, dark badge
  `#1A222E` on `#FF8080`): re-measured **8.94:1** and **6.59:1**. VLM
  PASS ×2 (fa 375 dark dialog + section row); converter + insights
  regressions green, zero console errors, zero 375px overflow.
- **Bundle budget: held WITHOUT a bump** — the dialog is a lazy chunk, so
  the entry actually DROPPED to 290.12 kB / 87.00 gz (I13: 295.11/88.55,
  budgets 296/89.5); Insights untouched 133.85/38.88 (budgets 134/39).
  Tests **611 → 634 green** (core 183 · scraper 67 · insights 132 ·
  api 119 · web 133).

## [2026-10-08] — I13 data-portability & power-reader wave

Sixth round of the day — and the deploy round: the owner pushed the
**26-commit stack** (I7 share/print/chart/CI/alerting + I8 findability +
I9 zoom + I10 personal + I11 live-rate + I12 resilience, `2803932..7467853`)
and the Worker went out at version `dbccaed3` — production smoke green
(health ok, 30 readings, frankfurter cache age 523 s reports **fresh:
true**, the incident window is closed at the root). Post-deploy QA walked
every I7–I12 feature live in the full matrix (fa/en × desktop/375 ×
light/dark): share deep-links open+scroll+focus, chart tooltip + keyboard
stepping, zoom ranges, watchlist pins, reading progress, LiveRateLine
always-on rate, popular/recent pairs, VLM PASS ×2, zero console errors,
zero 375px overflow. This wave then adds the Insights power-reader set:
the snapshot **CSV export** (data portability — localized headers over
ASCII machine-readable values, OWASP formula-injection guard), **j/k
keyboard card-walking** (Gmail muscle memory, pairs with I9's "/" search,
respects the active filter), the **remembered chart zoom** (a chosen
10y/5y/1y range persists across visits — plottability still rules per
series), and a **shortcut legend** in the filter bar (kbd pills,
desktop-only). Plus two BACKLOG hygiene closes: #30 `splitEvenly` →
core (typed `SplitError`, exact-sum largest-remainder, +7 tests) and
#32 parser hardening (batch line/char bounds with typed `BatchError` +
localized toasts; calc accepts NBSP/CR/LF whitespace + unary plus;
typed `too_deep` guard replaces the bare native RangeError on
pathological nesting). Tests 585 → **611 green** (+15 core, +11 web).
Insights chunk 128.42 → 133.82 kB raw / 38.87 kB gz — budget consciously
bumped 132 → 134 kB (gzip still under 39; the growth is the export's
localized column wording, not logic). Entry chunk untouched at
295.11/88.55.

### Added
- **Insights snapshot CSV export** (`apps/web` insights-csv.ts +
  AboutTheData): "Download the data (CSV)" — 12 stable columns (id,
  indicator, ticker, value, unit, status, 7d/30d change, 10-year
  position, as-of, snapshot time, source) in snapshot order; values are
  plain ASCII numbers (period decimal, no separators — parses as numbers
  in ANY spreadsheet locale) while headers/status words localize (en/fa);
  name/ticker/source columns carry the OWASP formula-injection guard
  (same `csvNeutralizeFormula` as the batch export); RFC 4180 CRLF;
  filename `currena-insights-YYYY-MM-DD.csv` stamped from the snapshot.
  8 unit tests.
- **j/k card navigation** (Insights route): `j` opens+scrolls to the next
  visible card, `k` the previous — anchor is the last walked card, else
  the topmost card in view; respects the active filter; same
  typing/modifier guards as "/"; desktop keeps multi-open while walking.
- **Remembered chart zoom** (HistoryChart + chart-range.ts): the chosen
  10y/5y/1y persists in localStorage (`currena:insights:chart-range`),
  every chart opens there on the next visit; strict parsing falls back
  to 10y; storage failures fail OPEN (default, never an error); 5 tests.
- **Shortcut legend** (FilterBar): `/ search · J next card · K previous`
  as kbd pills — desktop-only (`hidden md:flex`), hidden on paper.

### Changed (BACKLOG #30, #32 — hygiene closes)
- `splitEvenly` moved from the Splitter route into `@currena/core`
  (split.ts) with typed `SplitError` (invalid_people / invalid_decimals /
  invalid_total) and input validation; the exact-sum largest-remainder
  arithmetic is unchanged. +7 tests incl. float-noise (0.1+0.2 style)
  and remainder-distribution cases.
- `parseBatchLines` now enforces input bounds — ≤500 non-blank lines and
  ≤500 chars/line — throwing typed `BatchError` codes the BatchConverter
  catches into one localized toast (fa/en copy added) instead of an
  unhandled throw or a per-line wall. +3 tests.
- `evaluateExpression` hardening: NBSP (U+00A0) and CR/LF are skipped as
  whitespace (HTML-copy/multi-line paste reality); unary plus accepted
  (`2*+3`, legacy-eval parity); nesting beyond 128 parens throws typed
  `CalcError('too_deep')` instead of the bare native RangeError. +4 tests.

## [2026-10-08] — I12 freshness & resilience wave

Fifth round of the day. Production QA re-measured the 2026-10-07 incident
LIVE and got the exact shape: with the I6 Worker still deployed (fix
pending), `/api/convert` for international pairs (frankfurter) hard-500'd
from 20:35:30 to 20:46:03 UTC — the cache TTL (5 min) expires 5 min into
each 15-min cron refresh cycle, so **~10.5 minutes of every 15 (70% of
all minutes)** every fetch-context request hit the stale path, tried the
single-flight lock, and (KV writes failing from fetch context) 500'd.
The incident's own fix (I11's ladder degradation) turns those 500s into
"Using cached rates" 200s once deployed — this wave closes the windows
at the ROOT: frankfurter's fresh window is now 15 min, aligned with the
quarter-hour cron, so fetch-context requests stay on the fresh-cache
rung between ticks regardless of KV health. And the SPA stops leaving
first-time visitors dead during any outage window: the snapshot store
grew a self-healing retry ladder and the converter's failure card became
honest (server-vs-network copy), actionable (Try again), and alive
(live countdown + automatic completion when the outage passes). Tests
575 → **585 green** (+2 api frankfurter-window, +8 web — the FIRST
snapshot-store unit tests). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (incident root-cause mitigation)
- **Per-source fresh windows** (`@currena/core`): `FRESH_TTL_SEC` (one
  global 300 s) is now `FRESH_TTL_SEC_BY_SOURCE` + `freshTtlSec(source)`
  — tgju keeps the 5-min open-market window; **frankfurter gets 15 min**,
  matching the quarter-hour cron refresh cadence (ECB reference data
  updates ~once per business day; a 12-min-old snapshot is MORE than
  fresh). Server (rates-service freshness gate + status fresh flag +
  admin display) and client (snapshot-store staleness) share the same
  per-source semantics, so the client also stops re-fetching frankfurter
  every 5 min. Zero extra KV writes, zero extra scrapes — the stale
  window between cron ticks simply ceases to exist for frankfurter.
  +2 api tests (12-min ECB snapshot → fresh-cache rung with zero
  network; 16-min → honest stale ladder).
- **Failure-card copy honesty** (converter): the API ANSWERING with an
  error (500/5xx envelope — the incident's exact user experience) now
  says "The rate service is temporarily unavailable / Retrying
  automatically" instead of implying the USER's connection is broken
  ("check your connection" while their network is fine was misleading).
  Network-layer failures and offline keep the connection-flavored copy.

### Added
- **Self-healing retry ladder** (snapshot-store): a source that settles
  in the error state (nothing to serve — a first visit during an outage
  window) schedules automatic retries with capped backoff
  **15 s → 30 s → 60 s (60 s cap)**; any success clears the schedule and
  resets the ladder; offline settles never schedule (the online event
  refreshes directly); degraded mode (last-good still serving)
  intentionally does NOT poll — existing triggers cover it. Steady-state
  cost while an outage persists: one request per source per minute, the
  same order as the LiveRates poll. `nextRetryAt` (immutable epoch-ms
  stamp) exposes the schedule to the UI.
- **Failure card redesign** (converter, money page): role=alert card
  with the warning icon in a tinted circle, kind-aware honest copy
  (above), a localized **Try again** button that re-runs the conversion,
  a **live countdown** («Retrying in 14s» / «تلاش مجدد تا ۱۴ ثانیه دیگر»,
  Persian digits in fa, self-ticking every second, aria-live) while the
  store self-heals, and **automatic completion**: when the failing
  source recovers (error → ready) while the card is on screen, the
  interrupted conversion finishes BY ITSELF — the user already asked
  for it (verified end-to-end in the browser: mock 500s → card +
  countdown → unmock → result popup appears with no user action).
- **First snapshot-store unit tests** (web, backlog #29 partially
  closed): boot hydration + per-source freshness (12-min frankfurter
  local snapshot not stale, no fetch; 16-min refetches), the full retry
  ladder (15/30/60 escalation, cap at 60 s, success clears + no zombie
  retries), degraded no-poll, offline no-schedule + online-event
  takeover, ensureSnapshot semantics. Fake timers, faked fetchRates,
  in-memory localStorage.

### Changed
- **WCAG contrast sweep — raw `text-currena-warning` ink**: every
  user-facing warning TEXT rendered with the raw coral `#FF6B6B`
  (≈2.9:1 on light surfaces — fails AA) now uses the I6 `-deep` token
  (`#B92E2E` light ≈ 6.0:1 / `#FF8080` dark ≈ 6.6:1): the failure-card
  title + countdown, StaleBanner title (converter + LiveRates), Insights
  load-error + from-cache banner titles, Splitter network-error line,
  BatchConverter invalid-line label, AmountInput validation message,
  Receipt clear button, Insights card history-error. Measured in-browser
  before/after; dark mode is token-neutral (both map to #FF8080).
- **Admin runtime-config card**: the fresh-window line now shows the
  per-source values («300s / 900s») with the rationale hint.
- **Entry budget bumped 293 → 296 kB raw / 88 → 89.5 kB gz**
  (scripts/check-bundle-budget.mjs): the retry ladder + failure card +
  11 copy strings × 2 locales on the money page. gzip +1.49 kB for
  first-visit-outage recovery — incident-driven resilience, not bloat.
  Insights chunk untouched (128.42/37.78 vs 132/39).

## [2026-10-08] — I11 live-rate wave + rates-ladder incident hardening

Fourth round of the day. Production QA surfaced a REAL incident: starting
19:52:30 UTC, KV writes on the RATES namespace failed — first totally
(19:52–~20:10, cron included: status/history froze, the SPA masked tgju
via SW cache while frankfurter visibly 500'd), then selectively (the
cron's writes recovered while HTTP-context writes — by elimination the
single-flight lock PUT — still failed from at least the HKG colo, so
`/api/rates` + `/api/convert` 500'd instantly during every TTL-expiry
window with a good snapshot sitting in KV). Root cause beyond "KV
writes failing from fetch context" needs `wrangler tail` (owner —
DEPLOY.md incident note has the runbook); the daily-budget hypothesis
was tested against the evidence and DISPROVEN. The code answer shipped
regardless: the ladder now degrades exactly as its spec promises
(stale-cache rung instead of a 500) — turning this entire incident class
into a "Using cached rates" notice. And the converter homepage gains
the one thing every rate site answers instantly — the pair's live rate,
always on. Tests 555 → **575 green** (+6 api incident-degradation, +14
web LiveRateLine helpers). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (production incident 2026-10-07 19:52 UTC)
- **`RatesService.getRates` store-failure degradation**: a snapshot READ
  failure now treats the cache as absent and continues down the ladder; a
  status-read or lock-acquire failure SKIPS the live rung entirely (the
  single-flight lock is a store guarantee — no lock, no scrape) and falls
  to the cached rungs — stale-with-notice when a ≤7-day snapshot exists,
  the honest 503 `source_unavailable` otherwise. Only `RatesServiceError`
  ever escapes the service now; the route's 500 backstop becomes
  unreachable for store errors. +6 unit tests replaying the incident
  (writes-dead + fresh-TTL-expired → stale cache with notice, status-read
  failure, snapshot-read failure with a working scraper, forced refresh
  semantics, and the exact 19:57 UTC sequence). Docs: DEPLOY.md incident
  note with the write-budget math and owner recommendations.

### Added
- **LiveRateLine (converter homepage)**: the selected pair's mid-market
  rate is always visible between the currency row and the CTA — previously
  it only existed inside the result popup, so "what's the dollar?" needed
  an amount + a tap. Pure local math over the already-booted snapshot
  (swap/currency changes re-render instantly, zero network): rate +
  inverse display (legacy precision rules — Toman integers, 4 decimals,
  8 for sub-1), `SourceBadge` (TGJU/Frankfurter), relative freshness
  («Updated 2 minutes ago» / «به‌روزرسانی ۲ دقیقه پیش»), ▲/▼ delta vs
  the previous recorded generation (`RateDeltaChip`), a 40-point
  `Sparkline` from the same rate-history the ResultPopup micro-trend uses
  (LTR axis in fa — documented analytical-axis decision), and a copy
  button producing a localized share line
  (`1 Euro = 295,260 Iranian Toman · Currena — currena.ir` /
  «۱ دلار آمریکا = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا — currena.ir») with a
  2-second "Copied!" acknowledgment (clipboard failures no-op, same
  pattern as the Insights share pill). Honest states: hidden for
  same-currency pairs, pairs unresolvable from the pair's snapshot (the
  conversion itself would fail identically), no snapshot yet, and while a
  custom rate overrides the market; a confirmed-stale snapshot tints the
  line warning-amber with a ⚠ freshness line instead of hiding it. Pure
  helpers (`liveRateView`, `sparklineWindow`, `rateDecimals`,
  `rateShareText`) unit-tested in `lib/live-rate.test.ts` (+14 web tests).
- **Popular pairs (first-run)**: until the first conversion exists the
  pair-chips section shows five TGJU open-market suggestions (USD/EUR/
  GBP/AED/TRY → IRR) instead of nothing — first-time visitors see what
  the app is for; after the first conversion their own recents take over
  (existing behavior). Same chip DNA, 🔥 label («جفت‌ارزهای پرطرفدار»).

### Changed
- **Print polish (converter)**: the rate line PRINTS (it is the headline
  number on paper — verified in the PDF text layer); the interactive
  chrome around it (pair chips, quick tools grid, copy button) gains
  `.no-print`. Reduced-motion discipline: the quick-amount and pair-chip
  hover lifts are now `motion-safe:`-prefixed.
- **Entry budget bumped 289 → 293 kB raw** (scripts/check-bundle-budget.mjs,
  gz unchanged at 88): the LiveRateLine + popular pairs grow the entry
  288.80/86.98 → 292.57/87.88 — raw +3.77 kB but gzip-NEUTRAL (under the
  88 kB gz budget), i.e. users download ~zero extra bytes. The money page
  answering "what's the dollar?" without a conversion is the
  highest-value entry growth since launch. Insights chunk untouched
  (128.41/37.79 vs 132/39 budget).

## [2026-10-08] — I10 personal & portable wave: watchlist pins, .ics export, reading progress, relative freshness

Third round of the day, autonomously scoped after a clean QA sweep (production
+ local all green; API 30 readings / 0 unavailable / 14 events). Four features
close the loop on "a page readers return to": personalisation, portability and
orientation. Tests 545 → **555 green** (+10: 4 pinned-storage, 6 RFC 5545).
Presentation-layer only — no scoring, thresholds, sources, KV keys or API
changes. Production still serves the I6 Worker `954f0034` (deploy pending,
owner credentials).

### Added
- **Personal watchlist ("My watchlist" / «دیده‌بان من»)**: every card's
  expanded action row gains an aria-pressed pin pill (☆/★, house pill DNA);
  pinned cards MOVE into a dedicated section above the groups — "stay on
  top" — with its own warning-count line (the pinned set's own status,
  group headers keep describing full data). Persisted in localStorage
  (`currena.insights.pinned.v1`; `parsePinnedIds` degrades any malformed
  value to "nothing pinned", unknown ids drop silently) and synced across
  tabs via the `storage` event. The collapsed card shows a ★ badge (in the
  expand button's accessible name via sr-only text) so pin state reads
  without expanding. Play-nice with everything that locates cards by DOM
  id: share deep links (`?card=` opens + scrolls to a pinned card),
  WhatChanged rows, focusCard's filter-reset (a hidden pinned card is
  found after the filter clears), JumpNav gains the watchlist pill, the
  section hides under the no-match state. Pure helpers unit-tested.
- **Calendar export (.ics)**: the Coming up header gains a "Download
  calendar (.ics)" pill exporting exactly the events listed (upcoming,
  localized titles). `buildInsightsIcs` in `components/insights/ics.ts` is
  a pure RFC 5545 builder — CRLF endings, TEXT escaping (ASCII `;` `,` `\`
  and newlines; the Persian ؛/، code points correctly untouched), octet-safe
  75-octet folding (never splits a UTF-8 sequence — Persian titles are the
  point), all-day `DTSTART;VALUE=DATE` with the exclusive `DTEND` (+1 day,
  month-boundary verified), stable `<event>-<date>@currena.ir` UIDs so
  re-imports update instead of duplicating, deterministic `DTSTAMP` (now
  passed in tests). Downloads via the shared `lib/download.ts`.
- **Shared download helper** (BACKLOG #24): `downloadBlob` extracted from
  its two route-local copies (Receipt PNG/XLSX, BatchConverter CSV) into
  `apps/web/src/lib/download.ts`; the Insights export is its third consumer.
- **Reading progress bar**: a 3px `role="progressbar"` pinned above the app
  header (z-1001), filling from the inline-start edge in both directions
  (RTL grows from the right — native block flow). rAF-throttled passive
  listeners (the JumpNav scrollspy pattern); `aria-valuemin/max/now` keep it
  honest; hidden on paper.
- **Relative freshness**: the header's generated line now reads
  "Updated {ago} · {exact datetime}" ("3 hours ago", «۳ ساعت پیش») via the
  existing core `formatRelative` (zero entry-bundle growth — it was already
  there); the from-cache banner leads with the relative age too (the exact
  timestamp stays one line above).

### Fixed
- **Persian-digit sweep (fa prose numbers)**: section headers, group headers
  and the days-away counter rendered Latin digits («3 از 6 شاخص», «21 روز
  دیگر») while values, charts and chips used Persian digits. All prose
  numbers now render through `formatNumber(numberLocale)` — «۳ از ۶ شاخص
  در وضعیت هشدار», «۲۱ روز دیگر», the excluded-note count, and the new
  watchlist count line. The LED seven-segment values stay Latin by the
  documented Wave-5 #46 decision.

### Budget
- Insights chunk 121.30/35.85 → **128.36/37.78 kB/gz** — gate consciously
  bumped 125/37 → 132/39 with this entry as justification (watchlist UI +
  section + persistence, ics builder, progress bar, digit sweep, 9 new copy
  strings × 2 locales). Entry untouched: 288.80/86.98 vs 289/88.
  Precache 61 entries.

## [2026-10-08] — I9 feedback & analytical-zoom wave: chart ranges, chip counts, summary jumps, "/"-shortcut

Second stable-state round of the day: re-verified production + local standing
state (all green), fixed one I8 gap found during review, then four features.
Tests 528 → 537 → **545 green** (+8 range/count tests). Presentation-layer
only — no scoring, thresholds, sources or API changes. Still awaiting the
owner-credentialled deploy (production serves I6 Worker `954f0034`).

### Fixed
- **focusCard × filter interaction (I8 gap)**: clicking a WhatChanged row
  (or any focus-card path) while the active filter hides that card used to
  silently do nothing visible. The reader's "show me THIS card" intent now
  wins — the filter resets (chips + query), then the card opens, scrolls
  and receives focus.

### Added
- **Chart range toggle — 10y / 5y / 1y** (`HistoryChart`): a segmented
  control in the figcaption (the house pill DNA at chart-local size).
  `sliceHistoryToRange` / `rangeIsPlottable` are pure, unit-tested helpers
  in `config.ts`; the window anchors on the series' LAST point (honest even
  when the feed is days old); ranges that cannot show ≥2 points disable
  themselves; the mid-axis year tick suppresses itself when it would repeat
  an end year (1y windows show exactly 2 ticks); the I7 tooltip + keyboard
  stepping operate on the sliced series; the SR data table follows the
  visible range. **The 10-year position bar and percentiles never change**
  — they are the indicator's server-side decade placement. Hidden on paper.
- **Live counts on the filter chips** — "All (30) / Warning (6) / Normal
  (15) / Context (7)": the reader sees what a chip does before pressing it
  (`statusCounts`, pure, tested; Persian digits in fa). Same semantics as
  the filter: stale/unavailable count only under All.
- **Summary lines are jump buttons**: the two LED summary lines now scroll
  to their sections — the summary block doubles as the page's table of
  contents (hover affordance, direction-neutral ↓ chevron, sr-only "View
  section", reduced-motion-aware).
- **"/" focuses the filter search** — Gmail/GitHub/YouTube muscle memory.
  Ignores modifier combos (never swallows browser shortcuts) and never
  fires while typing in any field; `aria-keyshortcuts="/"` declared on the
  input.

### Changed
- **Insights chunk budget 120/35.5 → 125/37 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the range control + slicing, chip
  counts, summary buttons, shortcut wiring and 12 more copy strings × 2
  locales grow the lazy chunk 117.27/34.83 → 121.30/35.85. The entry chunk
  is untouched (288.76 kB / 86.95 gz — money-page budget held).
- Spec §5 (indicator card) now records the range control and §4 the summary
  jump behaviour (additive documentation).

## [2026-10-08] — I8 findability wave: filter toolbar, story→card links, hover polish

Stable-state session: full QA pass first (production standing state + every
Wave 6 feature re-verified locally with agent-browser — share links, chart
tooltip/keyboard, print, zero errors), then the next coherent improvement.
30 cards across two sections is a lot to scan; three presentation-layer
changes, no scoring/threshold/API contract changes. Tests 528 → **537 green**
(+9 filter tests). Not yet deployed — ships with the Wave 6+ work at the next
owner-credentialled deploy (production still serves I6 Worker `954f0034`).

### Added
- **Card-grid filter toolbar** (`FilterBar.tsx`, new): status chips
  (All / Warning / Normal / Context — 44px pills, `aria-pressed`, the I6
  deep-ink active tones) plus text search over name + ticker. Persian
  search is normalised like a native would expect: Arabic-keyboard
  yeh/kaf map to Persian, ZWNJ acts as a word separator, bidi marks are
  stripped — «بیت کوین», «بیت‌کوین» and «بيكاري» all match their cards.
  The result count line is `aria-live` with a Clear-filters reset;
  fully-filtered-out sections, groups and JumpNav pills hide; a no-match
  panel replaces the grid; the toolbar is hidden on paper (`.no-print`).
  Filtering is a VIEW tool only — section/group warning-count lines keep
  describing the full snapshot, and stale/unavailable cards only appear
  under All.
- **Story blocks now link into the grid**: every WhatChanged row (state
  changes + the five biggest 30-day moves) is a button that opens and
  scrolls to its indicator card through the shared `focusCard` path (the
  I7 share-link behaviour, extracted); the chevron mirrors per locale and
  the accessible name carries "View card".
- **Pure filter helpers** in `config.ts` (`indicatorMatchesFilter`,
  `filterVisibleIds`) with 9 unit tests incl. the Persian-normalisation
  cases.

### Changed
- **Insights chunk budget 110/33 → 120/35.5 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the toolbar + visibility wiring +
  26 copy strings × 2 locales grow the lazy chunk 109.36/32.91 →
  117.27/34.83 — a conscious, justified bump; the entry chunk is
  untouched (288.76 kB / 86.96 gz, money-page budget held).
- **Card hover polish**: desktop-only, `motion-safe` 2px lift + deeper
  shadow on indicator cards (reduced-motion and touch unaffected).
- Spec §4 (page structure) now records the toolbar row between "Coming
  up" and the sections (additive documentation of the I8 change).

## [2026-10-07] — BACKLOG Wave 6 closed: CI gate, chart tooltip, print, share links, ingest alerting

Owner direction ("Proceed based on your phases") → the ranked Wave 6 backlog
from the I6 session, completed end-to-end. Tests 521 → **528 green**; every
commit CI-verified on GitHub (the new gate itself, green on each push).

### Added
- **CI workflow** (`.github/workflows/ci.yml`, BACKLOG #47): every push to
  main + PRs runs typecheck, the full test suite, the SPA build, and a
  **bundle-budget gate** (`scripts/check-bundle-budget.mjs`) — entry chunk
  ≤ 289 kB / 88 kB gz, Insights lazy chunk ≤ 110 / 33; budgets are the
  documented numbers and bumps require a changelog justification.
- **Chart hover/focus reading** (#48, audit F16): pointermove tracks the
  nearest point on the 10-year chart (dashed guide line + highlighted dot +
  date/value tooltip — Jalali + Persian digits in fa); the chart is
  keyboard-focusable with ←/→/Home/End stepping; `touch-pan-y` keeps mobile
  scrolling intact; the SR data table remains the text path.
- **Per-indicator share links** (#50, spec §10 "later"): the hash router is
  now query-tolerant (`parseRouteAndQuery`, pure + 7 new unit tests);
  `#/insights?card=<id>` opens exactly that card and scrolls to it once per
  mount (single-open discipline on phones; unknown ids ignored); each
  expanded card carries a "Share this card" pill (en / «اشتراک این کارت»
  fa) that copies the deep URL with inline "Link copied" feedback.

### Changed
- **Print stylesheet** (#49, audit F16): `@media print` in index.css — dark
  mode prints the light palette, header chrome/nav pills hidden (logo kept),
  cards/sections/figures never break across pages, external links spell out
  their URL, SVG/LED colors kept exact. Verified via PDF export + VLM
  review.
- **Jump targets land below the fixed header**: Insights sections + the card
  anchor get `scroll-mt-24` (the About route's existing convention) —
  JumpNav jumps and share deep links no longer hide their target's title
  behind the navbar.
- **Failed-ingest alerting** (#46): a `if: failure()` Telegram step in
  `insights-ingest.yml` — posts run/sha/URL to the owner when
  `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` secrets exist, a clean no-op until
  then (red run + the 36 h /admin staleness pill remain the standing
  signals).

### Verified
- Local: every feature agent-browser-verified en+fa × desktop/375px (tooltip
  values + keyboard stepping, deep links desktop + mobile single-open,
  clipboard flow with stubbed API, print PDF URL spelling, zero console
  errors, no overflow). CI: **5/5 runs green** on GitHub.
- Bundle: entry 288.76 kB / 86.95 gz (≤ budgets); Insights chunk
  109.36 kB / 32.91 gz after tooltip + share (inside the 110/33 gate —
  growth justified above).

## [2026-10-07] — Insights UI/UX pass (Phase I6) + completeness sweep (I6 backtest re-run + I7 hardening)

Owner agenda ("Improving UI/UX of the Insights page, and making sure nothing is
left behind"). Presentation-layer only — no scoring, thresholds, sources, KV
keys or API contracts touched. Evidence-first audit
(`docs/insights/05-ux-audit-I6.md`) → five implementation commits → backtest
re-run → I7 hardening → production smoke.

### Fixed — Accessibility (audit F1–F5, F7, F10)
- **WCAG AA in light theme** (was failing on all 30 cards): status chips
  2.78–3.29:1, group h3s 3.14:1, panel h5s + source pill ~3.3:1, latent
  what-changed rows 2.78:1, coming-up "soon" coral 1.92:1. Four ink-grade
  `-deep` accent tokens added to the theme (blue #245E9F, success #256D29,
  warning #B92E2E, coral #9C5019 — ≥4.5:1 on white, page bg, and their own
  /10–/15 tints); dark mode remaps them to the existing bright hues
  (≥6.5:1). Both themes re-measured programmatically: 4.62–10.47:1.
- **Stale-card grey-out no longer sinks text below AA** (was 2.33:1 light /
  1.96:1 dark through a blanket opacity-60): grey-out is now a softened
  surface tint + muted value colour with every string ≥4.5:1.
- **Tap targets**: JumpNav pills 30→44px; chart-data `<summary>` 16px→a
  full-width 44px row; "How this is calculated" + disclaimer links get
  padded hit areas (layout unchanged).
- **Accessible names**: the card expand button's name was the entire
  collapsed card (~33 words); heading + button are now labelled
  "name (+ticker), status" via `aria-labelledby`.
- **Summary block landmark** was labelled "Global" (duplicate of the real
  Global section) with no heading — now `ui.summaryTitle` (en "Market
  summary" / native fa «خلاصهٔ وضعیت بازار») + a visually-hidden h2.

### Fixed — UX (audit F6, F8, F9, F11–F15)
- **JumpNav scrollspy**: active-section awareness while scrolling (passive
  rAF listener, `aria-current="true"`, tinted active pill; bottom-of-page
  pins the last section).
- **Chart year labels** no longer carry thousands separators ("2,016" /
  "۲٬۰۱۶" → "2016" / "۲۰۱۶" — `formatNumber` learns `useGrouping:false`,
  formatter-cache key extended); a **mid-axis year tick** orients the
  decade span; position bar 8→10px with a 30% warning-zone tint.
- **Expanded panel readability**: rule sentence text-xs→text-sm, section
  titles 0.72→0.75rem with more lead-in, sections gap-3→gap-4 — the five
  blocks scan as anchors instead of a wall of text.
- **fa typography**: Jalali date+time joined with the Persian comma «،» in
  core `formatJalaliDate` (ICU emitted a Latin ", ") — also fixes the
  converter ResultPopup timestamp.
- Card footer/group status/meta lines 0.68→0.7rem; disclaimer bar softened
  to read as a footnote, not a system alert.

### Changed
- `docs/insights/BACKTEST.md` regenerated against the full 30-indicator
  definition set: `gold-usd`/`silver-usd` reported honestly as info-only
  never-votes (was "undefined"), `china-pmi`'s note reflects its populated
  10-observation manual series; zero numbers changed, I1 findings
  re-affirmed with an I6 re-run verdict. No threshold changes proposed.
- `/admin` Insights card (I7): pill flips to "stale — no run for N h" with
  a `role=alert` action line past 36 h without a run — previously a dead
  cron kept the card "healthy" while the snapshot aged. Live-verified
  fresh + stale paths on local wrangler.
- `docs/BACKLOG.md` Wave 6: post-I6 SWOT re-check + explicit backlog
  (failed-ingest push notification, performance-budget CI gate, chart
  hover tooltip, print stylesheet, per-indicator share links).

### Verified
- Every commit: typecheck 5/5, tests green **516 → 521** (core +2 useGrouping/
  Jalali-comma, admin +3 staleness), bundle budget held — entry 288.75 kB /
  87.77 kB gz unchanged, Insights lazy chunk 104.54 → 105.98 kB (31.49 →
  31.94 kB gz, +0.45 gz for scrollspy + labels), precache 60 / ~2172 KiB.
- agent-browser en/fa × desktop/375px × light/dark: contrast sweep
  re-measured, RTL geometry intact, Persian digits + Jalali dates, chart
  LTR-in-fa, mobile single-open, language switch keeps scroll + open
  cards, zero console errors, no horizontal overflow.
- Production standing state: `/api/health` ok; `/api/insights` 30 readings,
  fresh `generatedAt`, 14 calendar events, quiet week, Global-first order
  (first Australia id at index 18); history endpoints 200 + 404-for-single-
  point + 400-unknown + ETag 304; today's scheduled (04:20 UTC) and
  dispatched ingest runs green on the Actions tab.

## [2026-10-07] — Session wrap-up: shipped state re-verified + next-session brief

Owner direction ("Proceed to next phase if anything is remaining and wrap up
this session… The new session agenda: Improving UI/UX of Insights page, and
making sure nothing is left behind"). No runtime changes — the evening
re-verified the 2026-10-07 feature set end-to-end and closed the session.

### Verified
- Gates re-run: typecheck 5/5, tests **516/516 green** (core 157 · scraper
  67 · insights 132 · web 52 · api 108).
- Production smoke (`currena.ir`): `/api/health` ok; `/api/insights` 30
  readings — `gold-usd` 4107.7 / `silver-usd` 60.109 at the top of the
  metals group, all 18 global ids before the first Australia id, 14 calendar
  events, fresh `generatedAt`, zero unavailable indicators.
- Redeploy from the final HEAD (version of record in
  `docs/DEPLOY.md` §"Session wrap-up, 2026-10-07 evening") — runtime
  identical to the deployed `b69375c` build; docs-only commits around it.

### Changed
- `docs/NEXT_SESSION_PROMPT.md` rewritten as the hand-off brief for the next
  agenda: **Insights UI/UX pass + completeness sweep** (Phase A audit against
  `02-page-design-spec.md`, Phase B presentation-layer improvements, Phase C
  = the I6 backtest re-run + I7 hardening checklist + standing-state
  verification).
- `docs/PROGRESS.md` status row + decisions log: owner direction recorded
  (I5 effectively closed; next phase reframed as the UI/UX agenda).

## [2026-10-07] — Insights: gold and silver ounce prices in the precious-metals group

Owner request ("I want the ounce price of Gold and ounce price of Silver to be
added in the precious metals part"): two new info-only cards at the top of
**Metals, crypto and hard assets** — `gold-usd` and `silver-usd`. They render
first in the group (prices before the ratios built from them), never vote, and
so leave every summary count unchanged. 30 indicators total (19 P1 / 11 P2).
Tests 514 → **516 green**; typecheck 5/5.

### Added
- `gold-usd` — Gold price (ounce), US$ per troy ounce: live TGJU world-market
  ounce quote with World Bank Pink Sheet monthly history backfill (the exact
  `gold-silver` recipe with the raw price as the live point). Displayed as
  `US$4,104`-style whole dollars; carries the 10-year position bar and chart.
- `silver-usd` — Silver price (ounce), US$ per troy ounce: live gold-api.com
  XAG spot with the same World Bank monthly backfill. Displayed to 2 decimals
  (`US$60.13`).
- Bilingual copy corpus entries (en + native fa) for both cards; spec table
  amendment in `docs/insights/01-indicator-spec.md`.

### Changed
- `IndicatorIdSchema` (core contract), `DEFINITIONS`, `buildIndicatorSeries`
  and `READING_SOURCES` (@currena/insights), `DISPLAY` (apps/web) — the two
  ids wired through every layer; degradation ladders tested (no World Bank →
  single live point; no live source → monthly history reads stale, honest).
- Count-pinning tests updated (core id set 30; definitions 19/11; snapshot 30
  readings; fa copy coverage 30 keys).

### Deployed
- Worker version `b1a5e80e-b61e-4f21-994d-4342557de5ba` (922.73 KiB upload,
  gzip 159.88 KiB, 15 new assets) — live on currena.ir + workers.dev; entry
  bundle byte-identical to the I5 baseline.
- Ingestion dispatched manually (Actions run 37646617580, `success` on
  `b69375c`): production snapshot `generatedAt 2026-10-07T15:46:25.777Z`,
  30 readings — `gold-usd` 4107.7 and `silver-usd` 60.109, both `context`
  with ≈92% 10-year position; new `insights:hist:gold-usd|silver-usd` keys
  (120 points each); voting counts unchanged (global 3/11, australia 3/10).
  Browser-verified en+fa, desktop+375px: cards lead the metals group, charts
  + SR tables + source links render, zero console errors, no overflow.

## [2026-10-07] — Insights Phase I5: content (calendar, china-pmi) + Gate I4 ordering fix

Gate I4 approved (owner: "Approved." + the live `/api/insights` JSON) with
one requested change, applied first: **the Global section now renders
before Australia** — section order (`SECTION_ORDER`), jump-nav target
order, and the summary block's two LED lines all flipped; the design spec
§4 records the owner decision (the original "reader is in Australia"
rationale is retired). Then Phase I5's content work: the key-dates calendar
populated from official schedules and the China-PMI manual series seeded
from documented official releases. Tests stay **514 green**; typecheck 5/5;
the reorder is render-order only (no bundle-gated code changed).

### Added
- `data/insights-calendar.json` — 14 events (2026-10-28 → 2027-05-04):
  RBA cash-rate decisions (2026: 3 Nov, 8 Dec; 2027: 9 Feb, 23 Mar, 4 May —
  from the RBA Board Meeting Schedules page, decision = second day), FOMC
  decisions (2026: 28 Oct, 9 Dec; 2027: 27 Jan, 17 Mar, 28 Apr — from
  federalreserve.gov), ABS CPI releases (Sep quarter 28 Oct, Oct 25 Nov,
  Dec 27 Jan, Jan 24 Feb — from abs.gov.au, cross-checked against the RBA
  homepage "Next update"). Bilingual titles; events within 7 days highlight
  client-side; past events drop off.
- `data/manual/china-pmi.json` — 10 NBS manufacturing-PMI observations
  (2025-12 → 2026-09), every value the official headline cross-checked
  against ≥2 independent reports of the release with month-over-month
  arithmetic reconciled; full provenance table in `data/manual/README.md`.
  The china-pmi card goes live (50.1, normal, +0.30 pts 30-day change);
  its position bar stays hidden until the 30-observation percentile floor.

### Changed
- `apps/web/src/components/insights/config.ts`, `routes/Insights.tsx`,
  `components/insights/SummaryBlock.tsx` — Global before Australia
  (section order, jump nav, summary rows).
- `docs/insights/02-page-design-spec.md` §4 — page structure reordered to
  match the owner's decision; rationale line rewritten.

### Documentation
- Roadmap: I4 exit records Gate I4 approval + the ordering change; the I5
  checklist closed out (copy corpus delivered in I4 + re-reviewed with a
  mechanical no-buy/sell check; calendar populated; disclaimer reviewer
  declined at D4; china-pmi seeded as an added I5 item).
- `data/manual/README.md` — china-pmi provenance table + growth rule.

### Deployed
- Pushed `f3a8101..f77bdd4` to `main` and redeployed the Worker (version
  `bef6f65b-e5b6-4655-8d14-25f7945b2e19`, 922.70 KiB upload, 13 new assets —
  the reordered `Insights-oh-TxMJf.js`). A manually dispatched
  `insights-ingest` run (Actions run 37641720806, success) wrote the first
  production snapshot carrying the calendar (14 events) and the live
  china-pmi reading (50.1, normal) — zero unavailable indicators. Verified
  on `currena.ir/#/insights` in en and fa: Global before Australia in
  sections, jump nav, and summary rows; card expand → chart + table +
  source link; 375px no overflow; zero console errors. Deploy record in
  `docs/DEPLOY.md` §Insights reorder + I5 content deploy.

## [2026-10-07] — Insights Phase I4: the page

Gate I3 approved (owner: "Approved." with the live `/api/insights` JSON
pasted for review). Phase I4 builds the reader-facing page: `#/insights`,
28 expandable indicator cards, both languages, both themes, every state in
the design spec. **Entry bundle +0.10 kB gzip** (288.75 kB / 87.78 kB gzip
vs the 288.45 / 87.68 baseline) — the whole feature, including the ~600-line
bilingual copy corpus, lives in the lazy route chunk (100 kB / 30.4 kB gzip).
Tests **479 → 514 — all green** (+35 web); typecheck clean in all five
packages. Browser-verified in en/fa × light/dark × desktop/375px against
the exact production snapshot: zero console errors, no horizontal overflow
(one overflow defect found and fixed during verification), offline fallback
through the last-good localStorage snapshot, mobile single-open cards.
Deployed and smoke-verified on currena.ir — awaiting the owner's visual
review (Gate I4).

### Added
- `apps/web/src/routes/Insights.tsx` — lazy `/insights` route (ROUTES, nav
  entry, per-route title). Australia before Global, jump links, about-the-data
  + full disclaimer.
- `apps/web/src/lib/insights.ts` — typed API client (zod-validated snapshot +
  per-card history with expected-404 → null), localStorage last-good fallback.
- `apps/web/src/i18n/insights-copy-en.ts` / `insights-copy-fa.ts` — the copy
  corpus (28 indicators × 6 fields + structural strings per locale), lazy in
  the route chunk, fa compile-time shape-checked against en.
- `apps/web/src/components/insights/` — SummaryBlock (LED warning counts +
  explainer + disclaimer bar), WhatChanged, ComingUp, JumpNav, IndicatorCard,
  HistoryChart (+ screen-reader table), PositionBar, StatusChip, AboutTheData,
  display config + pure helpers.
- 35 web tests: client contract/error/cache paths, value/change/rule
  formatting (en + fa), warning zones, movers ranking, group counts, history
  sampling, copy coverage.

## [2026-10-07] — Insights Phase I3: ingestion runner, storage, API routes, production write-run green

Gate I2 approved ("continue proceed"). Phase I3 builds the feature's serving
pipeline end to end: the GitHub Actions ingestion runner, the KV storage
contract, the read-only API routes, and the admin freshness card. **First
Insights deploy** (new routes on `currena-api`, Worker version `3ab1a97a`;
the SPA bundle is unchanged — insights imports are type-only on the worker
side). Tests **441 → 479 — all green** (+38); typecheck clean in all five
packages. Production evidence: venue dry-run (Actions run 37518740313)
27/27 sources OK; real write-run (Actions run 37550035289) wrote 24 history
keys + snapshot + status in 26 KV writes with `P1 COMPLETE`; live JSON
verified at `/api/insights` on workers.dev and currena.ir.

### Ingestion runner (`packages/insights`)

- `scripts/ingest.ts` — the production twin of live-run: collect → assemble →
  score → write. Loads `data/insights-calendar.json` + `data/manual/*.json`
  (soft-absent, loudly validated when present), reads the previous snapshot
  for `changedThisWeek` continuity (fresh events carried, week-window
  filtered), writes `insights:snapshot` + `insights:status` (critical) and
  `insights:hist:<id>` only on change (read-compare), prints the source
  report + readings + KV-op budget. Exit 1 when any P1 indicator is
  unavailable — a red workflow run is the stale-feed signal.
- `src/adapters/collect.ts` — the live-run fetch phase extracted verbatim so
  the diagnostic script and the runner cannot drift (live-run refactored onto
  it; output unchanged).
- `src/adapters/snapshot.ts` — pure assembly: `buildInsightsSnapshot`
  (readings + summaries + changedThisWeek merge + calendar),
  `buildHistoryFile` (10-year window anchored on the newest observation,
  downsampled to ≤520 points, `[epochDay, value]` encoding; single-point live
  cards get no history key), `buildInsightsStatus`.

### Storage contract

- `@currena/insights/store` (new export entry): `InsightsReader` /
  `InsightsWriter` interfaces + key names + `InMemoryInsightsStore` (tests) +
  `RestInsightsStore` — the Cloudflare REST KV writer with injected fetch,
  429/10048 daily-cap retry ladder, and op counters. The SPA-facing root
  export stays untouched.
- Core wire contracts: `IndicatorHistory` (strictly-ascending epoch-day
  pairs), `InsightsStatus` + `InsightsSourceReport` (admin freshness).
- `apps/api/src/adapters/insights-store.ts` — `KvInsightsReader` (the
  Worker's read half, poisoned-entry defense like `KvRateStore`). Keys live
  in the existing RATES namespace under the `insights:` prefix, NO TTLs.

### API + admin

- `GET /api/insights` — the precomputed snapshot; `503 insights_not_ready`
  before the first run; ETag `"insights:<generatedAt>"` + 304s; 60s public
  cache; exactly ONE KV read.
- `GET /api/insights/:id/history` — one indicator's downsampled series;
  `400 invalid_indicator` / honest `404 history_not_found`; ETag + 304s;
  300s public cache.
- `/admin` gains a zero-JS Insights card (last run, mode, per-source ✅/❌
  rows) fed by `insights:status`; the read is failure-tolerant (a broken KV
  read omits the card, never breaks the console).

### Workflow + ops findings

- `.github/workflows/insights-ingest.yml` — the repo's first workflow on
  main: cron **04:20 UTC daily** + `workflow_dispatch` with `dry_run`;
  pnpm from `packageManager`, frozen lockfile, 15-minute timeout, no
  overlapping runs.
- **KV write-budget finding (pre-existing, refined by live observation)**: the
  account's write counter crosses the 1,000 free writes/day around ~19:00 UTC
  (ever-green rates cron ~1,000/day + the second worker ~450/day). The cap's
  enforcement was observed on the **KV REST API** (429/10048) — the exact
  path the ingestion runner uses; Workers **binding writes are not blocked**
  (the rates app kept writing fresh snapshots after the trip, so production
  is unaffected). The ingestion is therefore scheduled at 04:20 UTC into the
  fresh post-midnight counter and retries capped writes. Recorded in
  docs/PROGRESS.md decisions log + docs/insights/03-data-sources.md §Phase I3.
- Scope cuts recorded: Bitstamp 10-year candle backfill + RBA F11 skipped
  (no v1 consumer); one daily schedule instead of daily+weekly
  (change-detected writes).

## [2026-10-06] — Insights Phase I2: source adapters, venue-verified RBA, live-run green

Gate I1 approved ("Continue." — backtest thresholds locked as-is). Phase I2
builds the feature's data layer — **still no app code; web/api bundles
unchanged; nothing deployed.** Tests **400 → 441 — all green** (insights 69 →
110); typecheck clean in all five packages; runner-side gates green from the
ingestion venue.

### Source adapters (`packages/insights/src/adapters/`, via `@currena/insights/adapters`)

- Import surface SPLIT from the pure root export: the SPA-safe `.` entry
  stays platform-/fetch-free; the new `./adapters` entry carries the fetch
  halves (web-standard fetch only — runs identically in the GitHub Actions
  runner and a Worker). `@currena/insights` gains a `@currena/scraper`
  dependency (fetchWithRetry + the production TGJU gold parser).
- fred / frankfurter / abs / worldbank / goldapi / bitstamp / tgju / rba /
  manual-series loader + `derived.ts` (`buildIndicatorSeries` — the
  production twin of the backtest SERIES map: ratio joins, yoy derivation,
  inverse/cross FX, live-point info cards, WB-brent fallback) +
  `READING_SOURCES` (per-card attribution).
- `xlsx.ts` — dependency-free XLSX reader (ZIP central directory +
  `DecompressionStream('deflate-raw')` + shared strings) for the World Bank
  Pink Sheet; the workbook URL is re-discovered from the commodity-markets
  page every run because the thedocs.worldbank.org document hash rotates.
- `parsers.ts` additions: `parseAbsSdmxCsv` (live SDMX response; header-driven
  columns — order varies by flow; sorts unordered answers; skips blank
  OBS_VALUE) and `parseRbaTableCsv` (title/header/metadata rows; both RBA
  date formats; skips pre-scaffolded empty future quarters).
- Loud-failure everywhere: zod response contracts (gold-api, Bitstamp,
  manual), table/series/unit identity checks (RBA prefix, WB header+units,
  ABS DATAFLOW), ascending assertions, ingestion-UA pinned for FRED (its
  Akamai edge hangs on the Chrome fingerprint).

### RBA venue verification (the I0 blocker, closed)

- Temporary branch `probe/i2-rba-venue` + a branch-only workflow ran the
  probe from the GitHub Actions runner: F1.1 / F2 / E2 / F11.1 CSVs all
  **HTTP 200**; the bytes are committed as fixtures. The sandbox stays
  Akamai-403 (loud-unavailable there — honest by design).
- `au-household-debt-arrears` resolved to **RBA E2 'Household debt to
  income'** (the ABS Data API has no household-ratios flow; catalogue
  searched in full). `au-us-10y-gap` cadence daily → weekly (F2 publishes
  T+2..4). I0's "4.60% cash rate" reference note retired (F1.1: 4.36).

### Fixtures & tests

- New recorded fixtures: gold-api XAG/BTC, Bitstamp OHLC, Frankfurter small
  timeseries, ABS SDMX ×5 (live response format), the full real World Bank
  XLSX, RBA F1.1/F2/E2 (venue bytes). 41 new tests (110 total in the
  package), all fixture-backed; the XLSX integration test parses the real
  workbook end-to-end (1960M01 → 2026M09).

### Live run (I2 exit criterion)

- `pnpm --filter @currena/insights live-run` — the one-off manual run that
  fetches every source, assembles all 28 indicator series and prints the
  sanity table + summaries. Final venue run: **27/27 fetches OK, every P1
  indicator printed a sane value (`P1 COMPLETE`)** — Global relaxed 1/8
  voting, Australia cautious 3/10 (0 excluded); TGJU-gold vs gold-api XAU
  0.04%, gold-api BTC vs Bitstamp 0.02%. Sandbox runs identical except RBA
  (403 → unavailable rows, as designed).

## [2026-10-06] — Insights Phase I1: contracts, scoring engine, backtest

Gate I0 approved same day (D4 answered: no disclaimer for v1). Phase I1 adds
the feature's computational core — **no app code touched; the web/api bundles
are unchanged; nothing deployed.** Tests **313 → 400 — all green**; typecheck
clean in all five workspace packages.

### Contracts (`packages/core/src/schemas.ts`)

- New Insights contracts (rule 3 — single source of truth): `IndicatorId`
  (28 v1 ids; licence-blocked items excluded), group/section/cadence/phase/
  source enums, `WarningRule` (the spec's seven atom kinds plus a flat
  `any-of` OR-composite for us10y), `IndicatorDefinition`, `IndicatorReading`
  (status vocabulary: warning / normal / context / stale / no-history /
  unavailable; `value`/`asOf` are null exactly when unavailable — enforced by
  refine), `SummaryLine` (label is null when nothing votes), `ChangedEvent`,
  `CalendarEvent`, `InsightsSnapshot` (unique-id refine). All exported from
  `@currena/core`; contract tests include deliberate shape-pinning.

### New package: `packages/insights` (`@currena/insights`)

- Pure, platform-free (AGENTS.md rule 2): no node:*, DOM, fetch or clock
  reads — every time reference is an explicit parameter (frozen-clock
  friendly). zod-validating throughout.
- `series.ts` — epoch-day date math, binary-search `pointAtOrBefore`,
  `combineSeries` inner join (ratios/crosses), `yoyPctSeries`.
- `parsers.ts` — FRED CSV / Frankfurter JSON / World Bank monthly / ABS
  period parsers; loud failures; missing markers dropped, never zero-filled.
  These are the parse halves of the Phase I2 adapters.
- `definitions.ts` — all 28 indicator definitions, rules verbatim from
  `01-indicator-spec.md`.
- `scoring.ts` — strict-lower 10-year percentiles; threshold rules incl.
  sustained-weeks anchored on the latest observation; percentile tails;
  pct/points change rules with anchor tolerance (sparse series show dashes,
  never mislabelled windows); yoy-negative; consecutive-decline; above-low;
  info → context; stale detection; `computeReading`, `summarize`
  (sections resolved via the definitions table), `changedSince`.
- **69 tests**: table-driven coverage of every rule type plus edge cases
  (empty series, short history, direction, ties, boundaries, frozen clock).

### Recorded fixtures + backtest

- `packages/insights/fixtures/` (14 files + provenance README, captured
  2026-10-06): 10 FRED series (2004+ / full), Frankfurter USD→JPY/AUD/CNY
  (2004→2026-10-05), World Bank Pink Sheet monthly (2004M01→2026M09), ABS
  headline CPI + trimmed mean quarterly, ABS unemployment monthly. RBA
  absent (Akamai-blocked from the sandbox — documented).
- `pnpm --filter @currena/insights backtest` writes
  **`docs/insights/BACKTEST.md`**: weekly frozen-clock runs across GFC 2008,
  COVID 2020, inflation 2022 and calm contrast 2017/2025, plus a today-run.
  Labels move correctly in every window (2008 global peaks *stressed*
  Oct-2008 7/12 and Australia *alarmed* Dec-08→Mar-09; 2022 *stressed* for
  20 of 52 weeks; 2017 *relaxed* 43 of 52; today: global *cautious* 3/11,
  Australia *stressed* 3/6). Engine constants calibrated against the
  fixtures during the run and documented there (stale thresholds from real
  release lags: 3/16/95/190 days by cadence; percentile floor 30 periods;
  observation-anchored sustained window). Owner-tunable candidates are
  listed with recommendations — spec thresholds themselves are unchanged.

Awaiting Gate I1 approval (backtest / threshold review) before Phase I2.

## [2026-10-06] — Insights Phase I0: source verification + Gate I0 decisions

Docs-only session (no code, no bundle impact). Planning set from commit
`240deb1` read in full; the verify-first probe ran against **every** source in
`docs/insights/03-data-sources.md` with throwaway scripts (nothing committed).

### Data sources — verified register (`docs/insights/03-data-sources.md`)

- **FRED:** 11/11 series live and current, **keyless** via
  `fredgraph.csv` (including the identified government pair
  `A091RC1Q027SBEA` ÷ `W006RC1Q027SBEA`) — **no FRED API key needed**.
  All used series are U.S.-government public domain; `DCOILBRENTEU`
  is EIA-sourced.
- **RBA:** licence **CC BY 4.0** confirmed (via alternate egress); the
  whole domain Akamai-403s the build sandbox — CSV bytes must be
  re-probed from the ingestion venue before Phase I2.
- **ABS:** Data API keyless on `/rest/` — `LF`, `CPI_Q`, `ANA_AGG`,
  `RES_DWELL_ST` current; `CPI_M` stale (keyed Indicator API only if
  monthly cadence is wanted); stale RPPI **replaced by `RES_DWELL_ST`**;
  household ratios → `E2` (verify in I2). Licence CC BY 4.0.
- **Silver / Bitcoin (D3):** gold-api.com primary for both spots (terms
  explicitly permit commercial display); Bitstamp public OHLC for BTC
  history; World Bank Pink Sheet (CC BY 4.0, monthly 1960M01→2026M09)
  for silver history and P2 commodities.
- **Blocked (licence/terms/access):** Coinbase (display prohibited),
  CoinGecko free (screenshots-only + 365-day cap), Coin Metrics
  community (CC BY-NC, 7 points), MetalCharts (nonexistent), Cboe VIX
  (link-out only), S&P 500 / breadth (P3), Stooq (bot gate),
  Blockchain.com (API degraded). **Shiller CAPE deferred P2→P3**
  (Yale data frozen at 2023-09, no licence).
- **Re-verified:** TGJU `ajax.json` (963 symbols, gold ounce fresh) and
  Frankfurter (2026-10-05), cross-consistent. China PMI manual-entry
  plan confirmed (no machine-readable NBS feed).

### Gate I0 decisions (recorded in `docs/PROGRESS.md`)

- **D1 — Cloudflare Free, permanently.** Heavy ingestion via a daily
  GitHub Actions runner writing one compact snapshot per source to KV
  through the Cloudflare REST API; the Worker only reads. Compact
  encoding (consolidated keys, arrays, integer-scaled fixed-point,
  epoch-day dates, rendered series only) keeps usage at ~100–150 KV
  writes/day vs the 1,000 free limit — **no indicator is omitted for
  tier reasons**. KV free limits re-verified live (100k reads/day,
  1k writes/day, 1 GB, **1 KV operation per Worker invocation** → the
  single `insights:snapshot` serve path).
- **D2 — substitutes accepted:** STLFSI4 for stress; VIX link-out;
  S&P/breadth out of v1; CAPE to P3.
- **D3 — silver/BTC sources accepted** (gold-api, Bitstamp, World Bank).
- **D4 — open:** disclaimer reviewer nomination (owner; needed before
  Phase I5, not blocking I1–I4).

Awaiting Gate I0 approval before Phase I1 (contracts + scoring engine).

## [2026-09-20] — Owner wireframe homepage + SWOT v2 + reliability wave

4 commits on `main` (`e3896ec` → this session), 2026-09-20.
Tests **308 → 313 — all green** at every gate; bundle gate held
(288.38 kB / 87.65 kB gz initial JS vs the 290.28/87.77 baseline — the
retired sidebar rail more than paid for the new homepage sections);
precache 59 entries / 2049.25 KiB (+1 entry, +6.4 KiB — About legal
sections + CSS). Every change browser-verified locally (agent-browser
DOM geometry + VLM, en + fa, desktop + 375 px, light + dark) and on
production after deploy.

### Phase A — SWOT v2 (fresh audit against today's code)

- **docs:** `docs/SWOT.md` re-run — production re-probed (health/rates/
  status/history/meta/admin/ETag 304 round-trip), `pnpm audit` CLEAN
  (xlsx CVEs long gone), bundle baseline re-measured identical, delta
  read of everything landed since 2026-09-24 (cron, server history,
  gold, LED boards, retry policy, admin gate). New weakness set is
  maintainability-shaped (the monolith files), the old security set is
  retired. `docs/BACKLOG.md` gained Wave 5 (this session's owner UI
  items) with statuses.

### Owner wireframe — homepage single-column stack (the 8 UI directives)

- **feat(web):** homepage rebuilt per the owner wireframe — full-width
  converting box → **GOLD & CURRENCY LED boards two-up** (gold start
  side; both in the compact CURRENT-only placement) → full-width Quick
  tools section → footer. The desktop two-column dashboard and the
  "at a glance" mini-board (`ConverterAside`) are retired; mobile now
  gets the boards too (`dbd05e2`).
- **feat(web):** ONE shared board component, two placements —
  `LedRateBoard`/`LedGoldBoard` take `showDayStats` (default true);
  `false` removes the DAY HIGH/DAY LOW cells from the DOM and collapses
  the shared subgrid ladder to two tracks at EVERY viewport
  (`.led-current-only`, index.css — re-asserts subgrid so column widths
  stay shared). `/live-rates` untouched: full 3-column board verified.
- **fix(web,a11y):** WCAG 1.4.1 — the retired mini-board's color-only
  live dot is superseded by the boards' text LIVE/CACHED/OFFLINE label.
- **fix(web,a11y):** WCAG 1.4.3 contrast — amount placeholder
  #B39B45→#806215 (≈2.7→5.6:1), dark #5B6B80→#9CA3AF (≈2.6→5.5:1),
  caret #C79100→#8A6D1F; "no change" delta pill muted→gray-700/gray-300
  (≈4.0→8.6:1 light, ≈4.5→8.0:1 dark).
- **feat(web):** nav utility group unified — install · فا · theme ·
  hamburger share one bordered icon-button container
  (`HEADER_ICON_BUTTON_CLASS`), equal 40px hit areas, both themes.
- **feat(web):** trust signals — footer carries Privacy · Terms ·
  Contact · About next to the credit line; the About route gains
  Privacy Policy / Terms of Service / Contact sections (en+fa) with
  sessionStorage-staged deep-link scroll; contact = GitHub (the only
  owner-supplied public channel — no email exists in the repo).
- **rtl:** full fa audit re-run across all 9 routes (en+fa, desktop+
  375 px, light+dark): boards mirror to the start side, no overflow, no
  console errors; digit language decision documented — Persian digits
  (۰۱۲۳) in all standard UI text via `Intl` fa-IR, Latin digits inside
  the DSEG7 LED modules (hardware font, matching the board-date rule).

### Phase B — reliability & i18n wave (BACKLOG items)

- **fix(api):** `/api/health` enriched (BACKLOG #39) — version +
  KV reachability probe (cheapest read); KV failure → 503 + `ok:false`
  for monitors; tests for both shapes (`ae6d6d9`).
- **fix(api):** rate limiting (BACKLOG #18) — per-isolate, per-IP token
  bucket (10 burst / 5 per min) on `POST /admin` +
  `POST /internal/refresh`, checked BEFORE body read or secret work
  (kills the wrong-secret KV amplification); 429 + Retry-After; bounded
  map; documented best-effort (per-PoP isolates). 3 tests.
- **fix(scraper):** `HttpError.code` (BACKLOG #33) — machine-readable
  classification (timeout / dns_or_network / rate_limited / blocked /
  http_4xx / http_5xx) derived from status or abort type; flows into
  `errorToCodeMessage` → status/admin telemetry. All six codes pinned.
- **fix(web):** Odometer respects `prefers-reduced-motion` (BACKLOG #34)
  — final value lands immediately, no rAF count-up.
- **fix(web,i18n):** Receipt/Batch export+share paths through the
  dictionary + `formatNumber` (BACKLOG #27) — fa users now get Persian
  labels AND Persian digits in share text, the receipt paper
  (۲۵٫۵۰ TRY / ۱۲۲٬۸۲۱ IRR (تومان)) and Excel headers; bulk-template
  prefill locale-aware; `navigator.share` titles localized (`58135e6`).

### Verification summary

308 → 313 tests (core 134 · web 17 · scraper 66→67 · api 91→95),
typecheck 4/4 at every commit; agent-browser: golden path (100 USD →
result + LIVE UPDATE), footer deep-links scroll to the About sections,
fa RTL mirroring (gold board start-side), Live Rates full board
unchanged (CURRENT + DAY HIGH + DAY LOW, 0 compact tables), zero
console/page errors everywhere; wrangler dev: enriched health JSON +
11th rapid `/internal/refresh` → 429.

## [2026-09-19] — Ever-green rates + LED shopfront boards session

19 commits on `main` (`732d2df` → `d28f57c`), 2026-09-18 evening → 2026-09-19.
Production live at **https://currena.ir** through Workers versions
`093aaf72` → … → `982cbc43` (final). Tests **279 → 308 — all green** at every
gate; every change browser-verified locally (agent-browser DOM audits + VLM)
and on production, en + fa, desktop + 375 px.

### Ever-green data (fixes the "3-hour-stale rates" report)

- **fix(api):** added the `scheduled` handler + cron `* * * * *` — the same
  ladder runs every minute regardless of visitor traffic (tgju each tick,
  frankfurter on 15-min cadence, fresh-guard caps real scrapes at ~1/5 min);
  measured data age with **zero user traffic: ≤ ~5-6 min** (`732d2df`).
- **fix(scraper):** TGJU cache-bust — `?cb=<epoch-ms>` on `ajax.json`, since
  TGJU's own edge served stale HITs (age 30 min on a 5-min max-age).
- **feat(api):** server-recorded rate history — KV `history:<source>`
  generations, content-fingerprint dedupe (writes only on real value changes —
  free-tier safe), capped 240; recorded from cron + live `/api/rates` scrapes;
  new `GET /api/history` (60 s cache + ETag). Sparklines across the app now
  draw from a shared server history merged into each client at boot — the
  "every currency has the same graph shape" report root-caused (identical
  min-max-normalized local series) and truly fixed (`d28f57c`).

### LED shopfront boards (owner-driven visual identity)

- **feat(web):** dot-matrix LED rate board as the Live Rates hero — DSEG7
  Classic (OFL-1.1) price digits, ghost segments + bulb gradient + halo,
  ticking clock, per-value flash (WCAG-safe), honest derived-quote footnote
  (`732d2df`), then rebuilt as a physical panel: bevel → perforated grid →
  recessed wells → ghosts → dot-matrix bulbs (`824257f`).
- **feat(scraper,core,web):** TGJU's real daily stats — current / day-high /
  day-low ride the snapshot `Rate` entries end-to-end; no invented dealer
  spread (`17169ea`). Shared **CSS subgrid** column lock (headers + every row
  share ONE track definition; measured spread 0.0 px per column) + hot CURRENT
  emphasis (`e8c5837`); currency names +40-50 % / weight 700 with a
  name-first caption layout below md (`a475058`).
- **feat(core,scraper,web):** **GOLD & COINS panel** — 9 TGJU gold/coin
  symbols (ounce in USD, Tehran market), graceful per-item dash degradation,
  same panel language (`b622cee`); gold-heal guard self-fixes visitors holding
  pre-gold snapshots (`8ec6842`); Tehran items converted Rial→**Toman** at the
  one sanctioned place (scraper normalizer) with self-migrating legacy
  snapshots (`97292b1`); phones show a single big CURRENT column on both boards
  (`97292b1`).
- **feat(web):** flags at 2× on the name line; headers/clock/dates in readable
  sans (LED look reserved for price digits) (`5fe3abf`); metal bezel frames —
  six-stop 135° steel + gold ramps with specular highlights, glass-recessed
  boards (`4170a96`, `4eacce9`); per-board headings with emoji, live TGJU
  link pill and last-updated stamp (`1204cba`).
- **feat(led):** fa board date as **«28 شهریور 1405»** (Persian month name,
  day-first logical order) then owner-refined to the RTL `[year][month][day]`
  frame at clock size; TGJU wordmark; `$` prefix on the USD gold-ounce
  modules (`2d91461`, `bf08bf8`).

### PWA & honesty fixes

- **fix(web):** "cached rates" banner/LED blink on boot — banners now render
  only on **confirmed** staleness (server-stale generation or failed fetch),
  never the transient boot hydration (`d782264`).
- **fix(web):** PWA `registerType: 'autoUpdate'` + `skipWaiting` +
  `clientsClaim` + hourly `registration.update()` — every deploy self-applies;
  the "stuck on the previous version" report root-caused (waiting service
  worker that a plain reload never activates) and permanently fixed
  (`6c75ccb`).
- **fix(web,api):** SWOT audit round — receipt/share/history staleness unified
  on `isConfirmedStale`; manifest rebranded **Currena** (was installing as
  "CurrencyPro"); og/twitter share cards; worker security headers (nosniff,
  X-Frame-Options, Referrer-Policy, Permissions-Policy) (`4bd5a9b`).
- **feat(pwa):** Android packaging prep — manifest `id`, real store
  screenshots (narrow 390×844 + wide 1280×720, VLM-verified), app shortcuts
  (Live Rates / Calculator), in-app 📲 install CTA (header + side menu, en+fa,
  `beforeinstallprompt`-driven). The site is fully **PWABuilder-ready**:
  paste currena.ir → Package for Stores → Android → signed APK/AAB
  (`1a80012`).
- **fix(web):** mobile result popup compacted — 3 stacked header rows → 1,
  single Jalali+time line, tightened spacing; measured **378 px** tall at
  390×844 (was viewport-filling), desktop unchanged (`d28f57c`).

### Known considerations

- TGJU remains a single upstream (inherent) — mitigated by cache-busting, the
  ladder, honest notices, the gold self-heal guard, and now server-side
  history (trend data survives upstream hiccups).
- Rate history began accumulating at deploy (2026-09-19 ~04:00Z); shapes
  genuinely diverge as TGJU re-quotes over the coming days. Optional future
  work: seed deeper history from TGJU's own history API (scope-guarded out).

### Open items (next session)

See the hand-off prompt in `docs/BACKLOG.md` lineage — SWOT re-run,
modularization of `apps/web/src/App.tsx` and the route monoliths, performance
& reliability optimization, TGJU history backfill, rate-limit on admin POST.

## [2026-09-18] — Autonomous hardening session

Branch `improve/autonomous-session-2026-09-24` (15 commits, +2,598/−491 lines,
49 files). Live in production at **https://currena.ir** since Worker version
`ddde3962-d0f0-4aab-85c4-04e744638185`.
Audit trail: `docs/BASELINE.md` → `docs/SWOT.md` → `docs/SESSION_LOG.md` →
`docs/FINAL_REPORT.md` (open items live in `docs/BACKLOG.md`).

### Headline metrics

| Metric | Before | After |
| --- | --- | --- |
| Tests (pnpm -r test) | 224 | **279 — all green** |
| Known vulnerabilities (pnpm audit) | 2 HIGH (`xlsx`) | **0** |
| Export-feature vendor chunk | 423.9 kB | **5.6 kB** (zero-dep writer) |
| `Intl` number formatting, 10k ops | 19,511 µs | **624 µs** (31× faster) |
| Web precache bundle | ~2,400 KiB | **1,999.67 KiB** (54 entries) |

### Security & data integrity (Wave 1)

- **fix(core):** settle ledger `__proto__` prototype-key corruption — a crafted
  note could poison `Object.prototype` and corrupt every ledger; added a money
  conservation invariant on persist (`a4bff42`).
- **fix(api):** hardened `/admin` + the KV status trust boundary —
  `SourceStatusSchema` validation on cached status, numeric-field HTML escaping,
  opt-in `ADMIN_VIEW_SECRET` gate (401 + `Retry-After`), 8 KB POST body cap
  (`005fae7`).
- **fix(web):** replaced CVE-laden `xlsx@0.18.5` with a zero-dependency XLSX
  writer; audit went 2 HIGH → 0 and the export chunk shrank 423.9 → 5.6 kB
  (`dd4ebc4`).
- **fix(web):** History delete race (identity-keyed delete) + Settle
  hydration-gated persist — closed a data-loss window on remount (`9b64442`).

### Reliability (Wave 2)

- **fix(api):** scrape-ladder reliability — 25 s scrape deadline, 30 s lock TTL,
  token-scoped locks (crash-safe release), graceful KV-write degradation,
  stale-value propagation on source failure; all covered by tests including a
  real-interleaving stampede test (`da8284f`).
- **feat(web):** reliability pass — ErrorBoundary, prompt-mode PWA update toast
  (workbox-window), honest forced-refresh FAB, collision-safe `uniqueId()` for
  entity IDs (`1ced3d1`).

### Performance (Wave 3)

- **perf(core):** memoized `Intl` formatters — `fa-IR` number formatting 31×
  faster (`b38aca9`).
- **perf(api,web):** `ETag`/`If-None-Match` → **304** on `/api/rates`, 5 s
  isolate snapshot micro-cache, parallel `status()` fan-out, memoized
  `<BoardCardView>`, History formatter hoist (`d041fa3`).

### Correctness & hygiene (Wave 4)

- **fix(core):** symmetric tie rounding (banker-style for .5 remainders),
  display-consistent CSV totals, CSV formula-injection guard, `sourceForPair`
  consolidated into core (6 copies → 1) (`c695fb5`).
- **chore(web,scraper):** dead-code removal (priceScanner block, `readHistory`,
  SCRAPER_VERSION sync) + settle settlement-currency label fix (`db3e22b`).
- **test(core):** penny-mismatch assertion fix — empty note renders as an empty
  CSV field (`76dae79`).

### Documentation & process

- **docs:** pre-session baseline snapshot (`bfc7240`); SWOT audit + prioritized
  39-item session backlog from three parallel deep audits (`2aaefff`); session
  log + final report (`9d91ffb`); production deployment record with the
  `printf`-vs-`echo` secret gotcha (`75866ac`).

### Deployment

- Single deployment topology: Worker `currena-api` serves API + built SPA +
  admin console; Custom Domain **currena.ir** + workers.dev URL, bindings (KV
  `RATES`, `ASSETS`) intact, secrets (`REFRESH_SECRET`, `ADMIN_VIEW_SECRET`)
  persist across versions.
- Post-deploy smoke: **12/12 green** — health, TGJU rates, USD→IRR convert
  parity, AED→EUR 503 messaging, admin gate (401/303/cookie), robots.txt, SPA
  deep link, ETag→304, `/api/status` parallel shape, 413 body cap.
- **Admin gate enabled in production.** Rotate with
  `printf '%s' '<secret>' | pnpm --filter @currena/api exec wrangler secret put ADMIN_VIEW_SECRET`
  (never `echo` — it stores the trailing newline and breaks constant-time
  compare). Delete the secret to return to public mode.
- Rollback: `pnpm --filter @currena/api exec wrangler rollback`
  (previous deployment 2026-09-17T03:12Z).

### Open items (prioritized — see `docs/BACKLOG.md`)

1. Owner rotates `ADMIN_VIEW_SECRET` to their own value
2. Legacy pythonanywhere origin decommission (owner decision, outside repo)
3. Cron pre-warmer `[triggers]` decision
4. TGJU Path-B relay (fallback scrape path)
5. Multi-currency settle ledgers
6. zod `.strict()` request contracts
7. Expanded web tests (rate-history, recent-pairs, router, meta parity)

### Wrap-up (2026-09-18 ~16:20 UTC) — pushed & redeployed

- Final gate re-run at HEAD: typecheck **4/4 packages**, tests **279/279 green**.
- `main` (17 commits, through the changelog wrap-up) and branch
  `improve/autonomous-session-2026-09-24` pushed to
  `github.com/assadigit/Currena` — `origin/main` now matches local exactly.
- Production redeployed from the final HEAD to pin the version marker (runtime
  identical to `ddde3962…` — every commit after `9d91ffb` is docs-only).
- Post-deploy smoke re-verified live: health, TGJU rates, USD→IRR convert
  parity, admin gate.
- Credentials hygiene: push/deploy tokens were supplied via environment
  variables only and were never written to disk, config, or git history.

## Earlier history

See `git log` for the pre-session history on `main` (through `bf61524`).
