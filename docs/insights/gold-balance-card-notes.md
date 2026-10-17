# Gold card: balance visual — build notes

Spec: `docs/insights/gold-balance-card-spec.md` (owner, uploaded to the repo
root 2026-10-17 and moved to `docs/insights/` on the feature branch as the
spec itself instructs). Branch: `feature/gold-balance-card`. Per spec §15.3:
not merged, not deployed.

> **UPDATE (owner order, 2026-10-17, after this note was written):** the
> owner instructed "commit push deploy in the main branch", overriding
> §15.3. The branch was re-verified locally (typecheck 6/6, 1,480 tests,
> lint 0 errors, copy audit clean, bundle budgets held), fast-forward
> merged into `main` (`97c65d6..35a18d2`) and pushed, then deployed with
> `wrangler deploy` — Worker `currena-api`, version `ef455c43-3798-4cd9-
> a52d-8063366df8be`, https://currena-api.sedanama-ir.workers.dev. Live
> verification at https://currena.ir/#/insights: the balance renders with
> the live state (aria "Balance for gold: 1 against · 3 couldn't be read.
> Leaning against gold."), the fa layout mirrors («ترازوی طلا: ۱ به ضرر ·
> ۳ قابل ارزیابی نیست.»), no horizontal scroll at 360 px, console clean.
> Post-deploy evidence: `screenshots/gold-balance/live-prod-{en,fa}-1280.png`.

## 1. The stack that was found (spec §2.3)

- **Framework**: Vite 8 + React 19 + TypeScript 5 (strict) SPA — never
  server-rendered; the API is a Hono worker (Cloudflare) that serves the
  built SPA. Hash router (`#/insights`).
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite`) with the app's own
  design tokens as CSS variables (`--color-status-normal/alert/stale`,
  `--type-label/caption`, `--radius-*`). Responsive via Tailwind
  breakpoints; RTL is native (`dir` on `<html>` from the locale store,
  logical utilities `start-/end-/ms-/me-`).
- **i18n**: `apps/web/src/i18n/` — `insights-copy-en.ts` is the typed
  source of truth; `insights-copy-fa.ts` is shape-checked against it;
  numbers render only via `Intl.NumberFormat` through `@currena/core`
  helpers (`formatNumber`, `formatIndicatorValue`); Persian digits and
  the Jalali rules are untouched by this change.
- **Signals data**: `packages/insights` `evaluateSignal` produces each
  metal's `conditions` (state + `inputs`); the web card
  (`MergedSignalsCard`) renders the merged gold-and-silver card.
- **Tests**: Vitest + Testing Library (`@vitest-environment jsdom`
  per-file docblock; matchMedia stubbed; "a stray fetch fails loudly").
- **Browser tooling**: agent-browser CLI (headless Chromium via Playwright)
  — already available in the environment; **no new dependency was added
  for screenshots or anything else** (spec §2.4, §14.6).

## 2. The card that was changed

The "Gold" signals card on the Insights page is
`apps/web/src/components/insights/signals/MergedCard.tsx`
(`MergedSignalsCard`) — the only card with the grouped driver list the
spec §1 describes ("Works against", "Sitting neutral", "Price footing").
Its driver list is the FOUR shared conditions of the gold signal reading:
real yields, inflation expectations, market stress, the US dollar. The
list is read from the data (`gold.conditions` minus the `footing`
condition — the metal's own price footing, which is NOT a driver, spec
§9) and is never hard-coded: if the evaluator grows a fifth driver, the
balance grows a fifth block/chip.

The card also carries the outlook chip strip (the seven-state "Outlook"
sentences + per-metal trend charts), the header and the silver-only
condition — none of those are mentioned by the spec's stays/changes
lists, so they are untouched (simplest reading of §2.2/§3).

## 3. State mapping (spec §4)

| Card state | Balance state | Notes |
|---|---|---|
| `supportive` | `for` | |
| `against` | `against` | |
| `neutral` | `neutral` | |
| `unknown` | `unread` | the card shows "Cannot read" |

The underlying data model does NOT merge neutral and unread —
`SignalConditionState` has distinct `neutral` and `unknown` states — so
no split decision was needed. The OLD UI merged them into one "Sitting
neutral" group; the split the spec asks for arrives with the two trays.

`total` = all drivers; `net` = for − against; `readable` = for + against
+ neutral; all drivers weigh the same (§16 — no weights).

## 4. Assumptions and choices (spec §2.2 record)

1. **"The Gold card" = the merged gold-and-silver card.** The spec's §1
   description (grouped list "Works against"/"Sitting neutral"/"Price
   footing") matches exactly one component, and its Price footing strip
   lists Gold AND Silver (spec §9 says the same). The balance itself
   speaks for GOLD only — its drivers, its verdict, its aria label —
   and is applied to this card only (§2.6). The silver-only condition
   keeps its own separate list below.
2. **Verdict word derivation**: `readable = 0` → "Can't read the
   conditions right now"; otherwise `net > 0` → "Leaning for gold",
   `net < 0` → "Leaning against gold", `net = 0` → "Balanced".
3. **Verdict line icon**: the card's existing verdict artwork is reused —
   the owner's up-zigzag PNG for `for`, the down-zigzag PNG for
   `against`, and the existing flat-dash glyph (the `VerdictIcon`
   fallback) for balanced/none, with the card's existing verdict inks
   (`verdictTone`). Colour never rides alone (§12.2) — the icon and the
   word carry the meaning.
4. **Count line + aria**: the count parts join with `" · "` (the spec's
   count-line joiner) everywhere, including inside the `role="img"`
   aria label; the spec's aria example uses commas, but §12.1 gives it
   as an example, and one joiner keeps EN/FA symmetric. The aria
   template ends with the spec's trailing period.
5. **fa copy (§13 "use the existing site term")**: the spec's table
   strings are used verbatim EXCEPT where this page already has a term:
   unread keeps the existing «قابل ارزیابی نیست» (the card's
   `conditionState.unknown`) instead of the proposed
   «قابل‌خواندن نیست», and `verdictNone` keeps the existing
   «فعلاً قابل ارزیابی نیست» shape (`sideUnknown`). Neutral keeps
   «خنثی» (as proposed — also the existing term). All 13 new fa strings
   are recorded in the Persian copy manifest as round-48 with this spec
   as the reference.
6. **Banner position**: §5.1 puts the verdict line ABOVE the banner
   sentence, so the existing C12 banner
   (`signals.goldHighYieldsWarning` — the spec's own example sentence)
   moved down one slot into the balance component's banner prop. Its
   text, its conditions and its markup are unchanged (§3).
7. **role="img" scope (§12.1 + §7.4 together)**: the graphic strip (beam,
   pivot, strings) carries `role="img"` + the result label; the pans
   with their buttons are SIBLINGS of that element, because `role="img"`
   makes children presentational and the blocks must stay real buttons.
   The visual result is identical (the strip is positioned exactly where
   the pans hang), and the tab order is preserved (§12.4).
8. **Pan drop cap (deviation from the suggested 14°)**: the spec suggests
   `angle = |net|/total × ~14°`. The formula is implemented with 14°,
   but the resulting PAN DROP is capped at 30 px (the angle is then
   re-derived from the capped drop so the pans follow the beam ends
   EXACTLY — both drop by `sin(angle) × halfBeam`). Why: at the spec's
   ~720px desktop beam a 14° tilt swings the pans ±87 px, which needs a
   ~180 px mostly-empty graphic band; with the cap the graphic strip is
   a fixed 48 px tall at every width, the swing stays clearly visible
   (30 px), and the beam-end/pan coupling stays mathematically exact.
   On a short beam (half ≤ ~124 px) the raw 14° survives untouched.
   The 3° minimum-angle floor is implemented as specified.
9. **Wide-screen blocks (§7.4 + §7.6 together)**: at ≥900 px the
   explanation sentence is rendered inside the block; the block stays a
   real `<button>` (spec §7.4 is unconditional) with `aria-expanded`
   always `true` there and a no-op click — everything it would reveal is
   already visible ("No tap is needed"). Below 900 px the tap toggles
   the shared detail panel and `aria-expanded` tracks it. Verified in
   both modes.
10. **Chips at every width (§8.4)**: tray chips open the same detail
    panel on ALL widths (the panel always exists in the DOM so every
    `aria-controls` is valid; `hidden` when closed). Only the BLOCK
    behaviour switches at 900 px.
11. **Panel content**: the driver's existing explanation sentence
    (`conditions[key].how`, unchanged §3) preceded by the driver's name
    in bold, so the sentence is never floating without its subject.
12. **Second pan column (§7.9)**: "the extra blocks go to a second
    column" is read literally — up to four blocks in the first column,
    the rest in the second (5 → 4+1, 7 → 4+3). With the current four
    drivers this branch is dormant; it is unit-tested.
13. **The balance area width** is capped at ~720 px and centred on wide
    screens (§10.3); full card width on mobile (§10.2).
14. **Animation**: a 500 ms ease transition on the beam/strings/pans
    transforms; `motion-reduce:transition-none` disables it for
    reduced-motion users (§6.7). The repo's standard pair.
15. **The spec file itself** was uploaded at the repo root; the spec's
    own preamble says to place it at `docs/insights/gold-balance-card-spec.md`
    — moved there on the branch (git mv, no content change).

## 5. What changed (files)

- **NEW** `apps/web/src/components/insights/signals/BalanceScale.tsx` —
  the reusable component: pure helpers (`driverStateOf`, `balanceCounts`,
  `balanceTilt`, `balanceVerdictOf`, `countLineParts`, `panColumnCounts`)
  + the rendered balance (verdict line → banner slot → graphic strip +
  pans → detail panel → trays). Takes a list of drivers; knows nothing
  about gold beyond the copy strings.
- `apps/web/src/components/insights/signals/MergedCard.tsx` — builds the
  driver list from `gold.conditions` (minus footing) with each driver's
  existing explanation sentence and live display value(s); renders
  `<BalanceScale …>` in place of the three grouped lists; the Price
  footing strip moves below the trays behind a divider (§9); the
  silver-only list is untouched.
- `apps/web/src/i18n/insights-copy-en.ts` + `insights-copy-fa.ts` —
  `signals.balance` (13 keys × 2 locales); the retired group headings
  (`sideSupportive/sideAgainst/sideNeutral/sideUnknown`) removed.
- `docs/localization/persian-copy-manifest.json` — round-48: 13 NEW
  processed (reference = this spec), 4 retired entries deleted.
- `apps/web/src/components/insights/signals/balance.test.tsx` — NEW:
  25 tests over the tilt rule, the state map, the verdict/count line,
  the rendered a11y/interaction behaviour and the merged-card
  integration.
- `apps/web/src/components/insights/round2.test.ts` — the no-check/cross
  glyph raw-source guard now also covers `BalanceScale.tsx`.
- `apps/web/src/components/insights/together-signals.test.ts` — the EN↔fa
  token-mirror assertions repointed from the retired `side*` keys to the
  new `balance` keys.
- `scripts/check-bundle-budget.mjs` — Insights lazy chunk budget
  604 → 606 kB raw / 142.8 → 144.6 kB gz with the justification comment
  (measured 605.31/144.53). The entry chunk is untouched.

Not changed: the signal logic, thresholds, data sources, explanation
texts, the Price footing content, the language toggle, Persian digits,
Jalali rules (§3/§16). No new dependency, no new API call, no new KV
read/write (§2.4/§2.5).

## 6. Verification results (spec §14) — all passing

Environment: local `vite` dev server (port 3000). The five cases came
from a TEMPORARY harness route (`#/gold-balance-test?case=A…E`) that
renders the REAL `MergedSignalsCard` with synthetic per-case driver
states and stubbed in-memory history for the pre-existing trend charts —
the harness file and its route registration were DELETED before the
commit (nothing test-data-ish ships). The REAL production page was then
smoked through a read-only local forwarder of `currena.ir` data (the
live state matched case A exactly: 1 against, 3 couldn't be read).
Tool: agent-browser (headless Chromium). 24 screenshots total.

### §14.2/§14.3 — cases and screenshots

All saved in `docs/insights/screenshots/gold-balance/`:
`case-{A..E}-{360|1280}-{en|fa}.png` (20), `case-A-768-{en|fa}.png` (2),
`live-insights-{en|fa}-1280.png` (2, real production data).

### §14.4 — the point-by-point results

| Check | Result |
|---|---|
| Beam tilts per §6 (A: against down 3.5°; B level; C for down 10.5°; D level + "Can't read"; E against down, capped swing) | PASS (screenshots + unit tests pinning the formula, the 3° floor, the readable-0 rule and the exact beam-end/pan coupling) |
| No horizontal scroll at ~320 px | PASS — `scrollWidth 320 == innerWidth 320`; an overflow probe inside the balance found zero elements wider than their box |
| No cut text, no overlapping blocks | PASS — the overflow probe is empty; names wrap to a second line (no ellipsis anywhere); screenshots at 360/768/1280 × en/fa reviewed |
| Every block and chip ≥ ~44 px | PASS — measured `min-height 44.0 px` on the rendered blocks and chips (`min-h-[44px]` + measured bounding boxes) |
| Farsi layout mirrored, Persian digits, tilt toward the correct side | PASS — the for pan sits right / against left in fa; the rotation SIGN flips in RTL (unit test: fa angle = −en angle); Persian digits verified in the count line, values, aria label and live page |
| Keyboard: Tab reaches every block and chip; Enter/Space opens the panel | PASS — walked the tab order (block → unread chips), Enter opens, Space closes; one panel at a time; second tap closes |
| `prefers-reduced-motion` stops the animation | PASS — beam/strings/pans carry `motion-reduce:transition-none` and the generated CSS contains `@media (prefers-reduced-motion: reduce) { .motion-reduce\:transition-none { transition-property: none } }` (agent-browser cannot emulate the media feature; the rule + class pairing is the browser-enforced guarantee) |
| Browser console shows no error | PASS — zero errors/warnings on the harness and on the live production smoke (one stale HMR error from mid-edit harness development was cleared and did not recur) |
| Network tab shows no new request | PASS — the balance makes no fetch (grep + the network log: only the app shell's pre-existing snapshot/rates calls, which 502 locally by design, and the trend charts' pre-existing history endpoint — stubbed in the harness, unchanged in production) |
| §6.7 animation | PASS — computed `transition-duration: 0.5s` on the beam/strings/pans with the ease curve; case switches animate the tilt; reduced-motion disables it (above) |

### Gates (the repo's own, run after every change)

- `pnpm -r typecheck` — 6/6 clean.
- `pnpm -r test` — 1,480 tests green (core 191, scraper 67, insights 462,
  markets 13, api 237, web 510 — +25 balance tests).
- `pnpm run lint` — 0 errors / 15 advisory warnings (the pre-existing
  baseline; the new component adds none).
- `pnpm copy:audit` — clean (round-48 recorded).
- `pnpm --filter @currena/web build` + `node scripts/check-bundle-budget.mjs`
  — all budgets held (entry 295.15/88.76; Insights 605.31/144.53 vs the
  bumped 606/144.6).

## 7. Known cosmetic notes

- An EMPTY pan renders as its label + dish with no blocks (case A/D/E) —
  the spec keeps both pans drawn at all times and demands the side
  labels ("the icon and the label on each side state its meaning"), so
  an empty pan is information ("nothing works for gold right now"), not
  a defect.
- The strings that hang from the beam ends are drawn in the graphic
  strip and translate with their pans, so they stay attached to both the
  beam end and the pan at every tilt (verified at 0°, 3.5°, 10.5° and
  the capped maximum).

## 8. v2 patch — the seesaw geometry (owner spec
## docs/insights/gold-balance-card-v2-seesaw-patch-spec.md)

The owner's v2 patch replaces ONLY the drawing of the balance (beam,
fulcrum, plates, blocks) with a seesaw that shows the real lean and
nothing more. The v1 tilt rule, the data mapping, the verdict/count
line content, the trays, the price footing strip, the copy, the RTL
mirroring, the `role="img"` summary and the aria label are unchanged
(patch §4). The patch spec was uploaded to
`docs/insights/gold-balance-card-v2-seesaw-patch-spec.md` and pushed to
the branch BEFORE the work started (commit 7aca42f), per the owner's
"upload this spec file into github then build upon that".

### 8.1 The v1 problems, reproduced FIRST (patch §3) — measured at
### 1280px on the temporary harness, v1 code

| # | Problem (patch §3) | Reproduced measurement |
|---|---|---|
| 1 | The picture exaggerates the lean — the pan bars move with the STACK, not just the tilt | Case A: the two pan BARS sat **170.7px apart** while the rotated beam's ends sat only ~44px apart (beam AABB 49.9px incl. its 6px thickness). Case E: pan bars **497.0px** apart vs a beam-end difference of ~60px (2 × the 30px v1 drop cap). The layout offset between an empty pan's dish and a stacked pan's dish (label + block heights) rode on top of the tilt — a light signal drew as a heavy one. |
| 2 | The block is too big (full explanation sentence inside) | Case A block at ≥900px: **126.8px** high (name + value + sentence, 109 chars) — the patch bounds blocks to 44–72px. |
| 3 | The pivot points the wrong way | The v1 fulcrum was a CSS `border-t` triangle — a flat top edge under the beam with the apex pointing DOWN, hanging like a pointer instead of holding the beam up. |
| 4 | The empty side looks broken | Case A/E for-side: label + bare grey dish bar with nothing in it. |
| 5 | The beam is thin and pale; the count line is small and light grey | The v1 beam was 6px (`h-1.5`) at 45% ink opacity; the count line was `--type-caption` (12.48px) in the secondary grey. |

Evidence screenshots (temporary, not committed):
/tmp/v1-problem-caseA-wide.png, /tmp/v1-problem-caseE-wide.png.

### 8.2 Every decision for a missing detail (patch §2.7)

1. **The "~" suggestions resolved to:** beam 10px; plate 6px; hinge dot
   8px; base line 96×6px; block 56px fixed; block gap 6px; maxAngle 12°;
   min angle 4°; zone cap 520px; desktop plate/block 180px; central
   plate gap 24px; fulcrum clearance 12px; zone top margin 8px.
2. **Lh derivation:** `Lh = zoneWidth − plateWidth` (the plates sit
   centred on the beam ends, their outer edge exactly on the zone edge).
   At a 360px screen the card's inner width is 296px → block width
   (296−24)/2 = 136px → **Lh = 160px** ("about half of the card's inner
   width"; the spec's ~170px sketch assumed a slightly wider inner
   width — V7's hard 10px/30px gates pass with margin: 11.2px / 33.3px).
   At ≥768px the zone caps at 520px → block 180px → **Lh = 340px**.
3. **No drop cap.** The v1 30px pan-drop cap is RETIRED: with Lh bounded
   by the ~520px zone the swing is modest by construction (≤70.7px at
   Lh 340), and the patch's geometry law — the picture may show no other
   height difference than Lh × sin(angle) — makes a cap meaningless.
4. **Reserved height (patch §5.8):** the spec's sum (blocks + gaps +
   plate + max rise + ~8px) is measured from the PIVOT; the fixed bottom
   machinery (base 6 + fulcrum (Lh/2)·sin(maxAngle)+12 + beam 10 + hinge
   8) sits under it, so the implemented zone height is
   `6 + fulcrumH + 10 + 8 + 6 + maxRise + stackH + 8`. An EMPTY side
   still shows one slot (patch §5.6), so the reserved "larger stack" is
   at least 1 row (case D reserves one row). The v1 §7.9 second-column
   rule survives (a ≥5-block side caps at 4 rows and the plate widens to
   two columns) — dormant with the current four drivers, unit-tested.
5. **V2's "plate positions" are measured relative to the beam centre**
   (plate surface y − beam centre y): §5.8.1 legitimately grows the zone
   with the larger stack, so the viewport-absolute plate y differs
   between case B (2-row zone) and case G (1-row zone) by exactly the
   reserved rows — what must not move is the plate ON ITS BEAM END, and
   that is equal within 0.0px (measured both ways; the translateY styles
   are identical strings too).
6. **Count line ink:** the secondary text colour at `--type-label`
   (14px) — 7.98:1 on the light card / 7.7:1 on the dark one (patch §6.2
   ≥4.5:1). The beam/fulcrum/base/reference share the same secondary ink
   (≥3:1 per patch §5.1.3) except the reference line, which uses the
   page's low-contrast border token (patch §5.3.2 "low-contrast").
7. **Block layout:** icon 20px + name (bold, wraps to a second line,
   never clipped) over the value, vertically centred in the fixed 56px
   height — 3 lines of 14px/1.25 fit inside 56px, so a wrapping name
   never changes the height (V3 measures 56.0px in both languages).
8. **No width branch.** The v1 `useWideScreen` hook is deleted; the
   detail panel opens from a block tap at EVERY width (patch §5.5.6).
9. **Banner data in the harness:** the synthetic readings gained a
   real-yield 10-year percentile (0.85) so the C12 banner renders in the
   harness and V5's stack-vs-banner gap is measurable (43.5–90.7px
   across the cases).
10. **The v1 `role="img"` split is kept:** the graphic layer (level
    reference line + beam + fulcrum + base) carries the aria label; the
    plates with their buttons are siblings of that layer (§12.1 + §7.4).
11. **The empty slot is drawn behind nothing** — it stands on its plate
    like a block would, `aria-hidden`, no text (patch §5.6.2).

### 8.3 The measured checks (patch §8, V1–V10)

Measured in headless Chromium on the temporary harness
(`#/gold-balance-test?case=…`), via element rects (never by eye). The
harness and its route registration were deleted before the commit.

| Check | Pass condition | Measured | Result |
|---|---|---|---|
| V1 Tilt geometry | plate-surface difference = Lh × sin(angle) ±2px; B/D/G show 0 ±1px | 360 EN: A **11.2** (exp 11.2), B **0**, C **25.0** (exp 25.0), D **0**, E **33.3** (exp 33.3), G **0**. 1280 EN: A **23.7** (23.7), B 0, C **53.2** (53.2), D 0, E **70.7** (70.7), G 0. FA (360/1280): identical values. Δ = **0.0px everywhere** | PASS |
| V2 Stack independence | plate positions in B and G equal within 1px | plate−beamCentre: B {−19, −19} == G {−19, −19} (Δ **0.0px**); translateY styles identical (`translateY(0px)`) | PASS |
| V3 Block size | every block 44–72px, equal within 1px | **56.0px** on every block, both languages, all widths (min = max = 56.0) | PASS |
| V4 Fulcrum contact | apex touches the beam underside within 1px at every angle; lowered end above the base line in E | apex gap **0.0px** at 0°/4°/9°/12°; case E beam bottom **12.1px** above the base line (360), **12.11px** (1280) | PASS |
| V5 No overlap | no stack touches the banner, a caption or the tray (A–G, EN+FA) | banner gap **29.7–90.7px**, caption gap **124.5–296px**, tray gap **90.6–122.3px**; 0 mutual block/slot overlaps in every case | PASS |
| V6 Visibility | beam/fulcrum ≥3:1; count line ≥14px at ≥4.5:1 | beam ink **7.98:1** light / 7.7:1 dark; count line **14px** at **7.98:1** | PASS |
| V7 Visible lean | at ~360px: ≥10px in A, ≥30px in E | A **11.2px**, E **33.3px** (EN and FA alike) | PASS |
| V8 Empty side | dashed slot on every empty side (A, D, E); captions visible | A slot[for], D slot[for+against], E slot[for] (C: slot[against]); captions visible everywhere | PASS |
| V9 Stable zone | same larger stack → zone height Δ 0px | A **139.3 == G 139.3** (360), A **176.7 == G 176.7** (1280) — same 1-row stack, different tilts | PASS |
| V10 Old checks | every v1 §14 check passes again | see 8.4 | PASS |

### 8.4 V10 — the v1 §14 checks re-run on the v2 drawing

- Beam tilts per §6 (A against-down 4°, B level, C for-down 9°, D level
  + "Can't read the conditions right now", E against-down 12°, G level)
  — PASS (30 unit tests + the browser V1 measurements).
- No horizontal scroll at ~320px — PASS (`scrollWidth 320 == innerWidth
  320`; hScroll false in every case/width/language).
- No cut text, no overlapping blocks — PASS (V5 overlaps 0; names wrap;
  no ellipsis anywhere).
- Every block and chip ≥44px — PASS (blocks 56.0px fixed; chips
  min-h-[44px] by class, measured 44+).
- Farsi mirrored, Persian digits, tilt toward the correct side — PASS
  (the for plate sits RIGHT in fa; the rotation sign flips: EN +4°/+12° →
  fa −4°/−12°; Persian digits in the count line, values and aria label).
- Keyboard: Tab reaches every block and chip, Enter/Space opens the
  detail panel — PASS (walked the order: block real-yield → chips
  expectations → stress → dollar; Enter opens, Space closes; chip Enter
  opens; one panel at a time).
- `prefers-reduced-motion` stops the animation — PASS (beam + plates
  carry `motion-reduce:transition-none`; the generated CSS contains
  `@media (prefers-reduced-motion: reduce) { .motion-reduce\:transition-none
  { transition-property: none } }`).
- Browser console shows no error — PASS (zero errors on the harness).
- Network tab shows no new request — PASS (0 `/api/insights` calls from
  the balance; only the app shell's pre-existing snapshot/rates calls,
  502 locally by design; the trend charts' history is served from the
  harness's in-memory stub, never from the network).
- §6.7 / v2 §5.9 animation — PASS (beam and plates both
  `transition: transform 0.5s` with the same ease; reduced-motion off
  switch above).

### 8.5 What changed (v2)

- `apps/web/src/components/insights/signals/BalanceScale.tsx` — the
  drawing replaced with the seesaw: fixed-metric constants, the tilt
  helper now returns the per-plate rise and the Lh × sin(angle) end
  difference (12°/4°, no cap), the zone reserves its height from the
  largest stack and anchors the seesaw to its bottom, the graphic layer
  (reference line + rotating beam + up-pointing fulcrum + base line),
  the level plates with hinge dots and upward block stacks, compact
  56px blocks with no sentence, dashed aria-hidden empty slots, the
  fixed caption row, the count line at 14px, and the panel-after-
  captions order. The v1 `useWideScreen` hook is gone.
- `apps/web/src/components/insights/signals/balance.test.tsx` — the tilt
  tests re-pinned to 12°/4° and the rise/end-drop semantics; the wide-
  screen inline-sentence suite replaced by the every-width panel suite;
  new tests: empty slots (aria-hidden), plate translate ±rise, B/G
  plate + zone stability, caption row, the v2 §5 DOM order. 30 tests.
- `docs/insights/screenshots/gold-balance/` — the 24 v1 screenshots
  replaced by the 28 v2 ones (§8.6).
- The temp harness (`signals/GoldBalanceHarness.tsx`, the
  `/gold-balance-test` route registration in `router.ts` + `App.tsx`)
  existed ONLY for the checks and was deleted before the commit.
- Not changed: the signal logic, thresholds, data sources, explanation
  texts, the banner, the trays, the price footing strip, the copy, the
  merged card, any other card, the packages. No new dependency, no new
  API call, no KV read/write.

### 8.6 The screenshots — what a first-time visitor sees (one sentence each)

All 28 live in `docs/insights/screenshots/gold-balance/` as
`v2-<case>-<width>-<lang>.png`; each was opened and checked against its
case's data (patch §8, final gate).

- `v2-A-360-en.png` — A mobile EN: a small lean to the right — one block
  ("Real yields 2.84%") weighs the Against plate down while the For
  plate shows an empty dashed slot, under the verdict "Leaning against
  gold / 1 against · 3 couldn't be read".
- `v2-A-360-fa.png` — A mobile FA: the mirrored small lean to the left —
  the block «بازده واقعی ۲/۸۴٪» lowers the left (به ضرر طلا) plate, the
  empty dashed slot rides high on the right, with «۱ به ضرر · ۳ قابل
  ارزیابی نیست» in Persian digits.
- `v2-A-1280-en.png` — A desktop EN: the same one-block lean, small and
  unhurried, with the dotted level line making the modest tilt obvious
  and the C12 banner sentence above.
- `v2-A-1280-fa.png` — A desktop FA: the mirrored desktop lean — block
  left, dashed slot right — «تمایل به ضرر طلا» with Persian digits.
- `v2-A-768-en.png` — A tablet EN: the seesaw at its 520px cap, one
  block against an empty slot, the three unread chips in their tray.
- `v2-A-768-fa.png` — A tablet FA: the mirrored tablet lean with the
  unread chips tray on the right.
- `v2-B-360-en.png` — B mobile EN: a perfectly level seesaw — two green
  blocks stand on the For plate, two red on the Against plate, under
  "Balanced / 2 for · 2 against".
- `v2-B-360-fa.png` — B mobile FA: the mirrored level seesaw with «۲ به
  نفع · ۲ به ضرر» and four compact fa blocks.
- `v2-B-1280-en.png` — B desktop EN: the level beam through the dotted
  reference line, two blocks per side at identical plate heights.
- `v2-B-1280-fa.png` — B desktop FA: the mirrored level seesaw, names
  wrapping inside their 56px blocks, «متعادل» verdict.
- `v2-C-360-en.png` — C mobile EN: a clear lean to the left — three for
  blocks stack on the lowered For plate while the Against plate carries
  one dashed empty slot, "Leaning for gold / 3 for · 1 neutral", the US
  dollar chip in the Neutral tray.
- `v2-C-360-fa.png` — C mobile FA: the mirrored lean to the right —
  three fa blocks lowered, empty slot raised, «۳ به نفع · ۱ خنثی».
- `v2-C-1280-en.png` — C desktop EN: the three-block stack visibly
  heavier, the dotted line showing exactly how far the beam has tipped.
- `v2-C-1280-fa.png` — C desktop FA: the mirrored three-block lean with
  the Neutral («خنثی») tray below.
- `v2-D-360-en.png` — D mobile EN: a level seesaw with BOTH plates
  showing dashed empty slots — nothing could be read, and the verdict
  says so: "Can't read the conditions right now / 4 couldn't be read",
  all four drivers as dashed tray chips.
- `v2-D-360-fa.png` — D mobile FA: the mirrored empty seesaw, «فعلاً
  قابل ارزیابی نیست» verdict, four dashed fa chips.
- `v2-D-1280-en.png` — D desktop EN: the level beam and two empty slots
  under the honesty verdict — the balance honestly says it is blind.
- `v2-D-1280-fa.png` — D desktop FA: the mirrored empty seesaw with the
  «قابل ارزیابی نیست» tray holding all four drivers.
- `v2-E-360-en.png` — E mobile EN: the strongest lean — four red blocks
  stack on the sunken Against plate while the For plate rides high with
  its dashed slot, "Leaning against gold / 4 against".
- `v2-E-360-fa.png` — E mobile FA: the mirrored heavy lean to the left
  with «۴ به ضرر» and four fa blocks.
- `v2-E-1280-en.png` — E desktop EN: the full 12° tilt — four blocks
  weigh the right plate down to the beam end while the empty left plate
  lifts, the dotted line making the swing unmistakable.
- `v2-E-1280-fa.png` — E desktop FA: the mirrored full tilt, four fa
  blocks on the lowered left plate.
- `v2-E-768-en.png` — E tablet EN: the heavy four-block lean at the
  520px zone cap, tray-free (all drivers read) with the price footing
  strip below.
- `v2-E-768-fa.png` — E tablet FA: the mirrored heavy lean with the
  Persian-digit values «۱۰۳/۲۰» and «۲/۸۴٪».
- `v2-G-360-en.png` — G mobile EN: a level seesaw with ONE block on
  each plate — "Balanced / 1 for · 1 against · 2 couldn't be read" —
  the unread pair safe in their dashed tray.
- `v2-G-360-fa.png` — G mobile FA: the mirrored one-versus-one balance,
  «۱ به نفع · ۱ به ضرر · ۲ قابل ارزیابی نیست».
- `v2-G-1280-en.png` — G desktop EN: the level beam with equal single
  stacks — the picture says "even" and the count line says why.
- `v2-G-1280-fa.png` — G desktop FA: the mirrored even seesaw with two
  dashed unread chips in the tray.

Each sentence matches its case's data (A: 1 against + 3 unread = small
lean + empty slot + 3 chips; B: 2v2 = level; C: 3 for = lean left/EN;
D: 4 unread = level + both slots + 4 chips; E: 4 against = heavy lean;
G: 1v1 + 2 unread = level + 2 chips) — no sentence claims more than its
case shows.

### 8.7 Gates (run after the v2 change)

- `pnpm -r typecheck` — 6/6 clean.
- `pnpm -r test` — all green (see §8.8 for the final counts).
- `pnpm run lint` — 0 errors / the pre-existing 15 advisory warnings.
- `pnpm copy:audit` — clean (no copy change in v2).
- `pnpm --filter @currena/web build` + `node scripts/check-bundle-budget.mjs`
  — final numbers in §8.8.

### 8.8 The final gate numbers

- `pnpm -r typecheck` — 6/6 packages clean.
- `pnpm -r test` — **1,485 tests green** (core 191, scraper 67, insights
  462, markets 13, api 237, web 515 — the balance suite grew 25 → 30).
- `pnpm run lint` — 0 errors / 15 advisory warnings (the pre-existing
  baseline; the seesaw adds none).
- `pnpm copy:audit` — clean (v2 changed no copy).
- `pnpm --filter @currena/web build` + bundle budget — entry
  295.15 kB / 88.76 kB gz (budgets 296.00 / 89.50); Insights lazy chunk
  **605.59 kB / 144.60 kB gz** vs the 606.00 / 144.60 budgets — all held
  (the seesaw replaced the hanging pans inside the same chunk; gz lands
  exactly on the budget line, raw 0.41 kB under).

## 9. The seesaw goes live (v2 deploy record)

Owner order: "merge the branch, push, commit and deploy." §2.4's
no-deploy hold is lifted by that order.

- **Merge** — `feature/gold-balance-card` (7aca42f spec + 49dcd69 seesaw)
  merged into main as **660f5ad**; the notes file auto-merged (v1 deploy
  record and the v2 §8 landed side by side, no conflict). Pre-merge
  sanity on the merged tree: typecheck 6/6, web 515 + insights 462
  tests green, lint 0 errors / 15 advisories, copy audit clean.
- **Push** — main `aecdd40..660f5ad` on origin; remote reset to the
  tokenless URL.
- **Build + budgets** — `Insights-pTPOEBQD.js` 605.59 kB / 144.60 kB gz
  vs the 606.00 / 144.60 budgets; entry 295.15 / 88.76 — all held.
- **Deploy** — wrangler `currena-api`, version
  **db046ce5-06ae-4f15-8990-d88e1cdd010c**, 18 new assets uploaded
  (79 cached), cron re-armed (`* * * * *`).
- **Live verification** (agent-browser on https://currena.ir/#/insights):
  - The page loads `Insights-pTPOEBQD.js` — the v2 chunk, not v1.
  - EN 1280: the seesaw drawn exactly per the patch — up-pointing
    fulcrum, tilted beam, level plates with hinge dots, the empty
    for-side as a dashed slot, "Real yields 2.78%" sitting low on the
    against-side plate; verdict "Leaning against gold · 1 against ·
    3 couldn't be read"; couldn't-read tray with three chips; price
    footing below. Screenshot: `live-prod-v2-en-1280.png`.
  - FA 1280 (RTL): mirrored seesaw — "بازده واقعی اراق فجره ۲.۷۸٪"
    plate low on the left, dashed slot high on the right; «ترازوی
    طلا: ۱ به ضرر · ۳ قابل ارزیابی نیست. تمایل به ضرر طلا.»
    Screenshot: `live-prod-v2-fa-1280.png`.
  - 360px FA: `scrollWidth 360 == clientWidth 360` — no horizontal
    scroll around the seesaw.
  - Console after a fresh reload: zero messages, zero page errors.

## v3 — the classic hanging-pan balance (owner directive 2026-10-18d)

The owner reviewed the deployed v2 seesaw: *"The latest implementation
does not yet meet the intended balance redesign."* The directive (seven
points, mapped one-to-one below) supersedes v2 §5's drawing AND lifts the
§8 "BalanceScale stays untouched" pin of the economic-indicators session
by direct owner order — the component is now this file's to revise again.

### The directive, verbatim mapping

1. **Sophisticated vector geometry** — the drawing is now ONE inline SVG
   (viewBox 520×252): a subtly tapered beam (16u centre → 9u ends) with
   7.5u rounded end knuckles, a pinned pivot (13u cap + 4.5u surface pin),
   a tapered pillar (26u → 14u) on a two-step plinth, two splayed 2u
   chains per side hanging to shallow 3u-stroked pan dishes with an 8%-ink
   fill, and the dotted level reference line through the pivot. Stroke
   weights intentionally vary (body fill > pan rim 3u > chains 2u >
   reference dotted); whitespace: ≥80u pan-to-pillar, 20u margins.
2. **No dashed empty rectangle** — both pans ALWAYS draw their complete
   structure (chains + dish). A side with no qualifying factors gets a
   concise, evidence-based line under its list heading: "No readings
   support gold right now." / «فعلاً هیچ عامل به نفع طلا دیده نمی‌شود.»
   (and the against twins). Round-48, QA record
   `docs/QA/quirks-2026-10-18-balance-v3-fa-empty-states.md`.
3. **No factor cards on the beam** — the SVG is pure geometry; its tilt
   IS the aggregate. The factor rows (the v2 compact 56px buttons,
   unchanged) render in lists beneath their side captions — the v2 §5.7
   caption row became the list headings — and grow downward, fully
   independent of the illustration.
4. **Direction follows the model** — the beam tilts only for a
   directional verdict ('for'/'against'); 'balanced' and 'none'
   (unavailable) render level. The tilt formula is untouched
   (|net|/total × 12°, 4° floor — v1 §6.3-4 verbatim), so the financial
   model, weights, thresholds and counts are exactly as before.
5. **Multi-factor safety** — the SVG's height is a fixed function of its
   width (viewBox aspect, no runtime measurement at all — the v2
   ResizeObserver and reserved-height arithmetic are deleted); the lists
   just grow. Case H (6 + 3 factors, harness-only) proves it.
6. **Everything else preserved** — data flow, driver mapping, verdict
   word, count line, banner, trays, detail panel, price footing, RTL,
   responsive behaviour, copy: unchanged (two new empty-state keys are
   the only string additions).
7. **Verified** — the measured table + scenario screenshots below.

### Decisions (D-v3)

- **D-v3-1 — "valid, supported aggregate score"** = the model's verdict
  word. The verdict (balanceVerdictOf) is the model's own directional
  statement; the beam tilts iff the verdict is 'for'/'against' with the
  exact v1 magnitude rule. "Neutral / unavailable / insufficient /
  invalid" map to 'balanced' / 'none' / (net-0 with unread drivers — the
  ratio pulls toward level) / (no drivers — the component renders null);
  none of these tilt. No weights were invented, no threshold changed.
- **D-v3-2 — neutral-ink machinery.** The whole illustration draws in the
  page's secondary text ink (7.98:1 / 7.7:1); the side captions and the
  verdict line carry the green/red semantics (the reference drawing does
  the same — grey scale, coloured labels). Colour never rides alone
  (§12.2 unchanged).
- **D-v3-3 — RTL as one mirror.** The SVG is pure geometry, so RTL
  applies `scaleX(-1)` to the whole `<svg>`: the `for` pan moves to the
  inline-end AND the visual rotation sign flips in the one transform.
  The rotation VALUE therefore stays LTR-signed (no re-signing), and the
  pans' translateY is direction-agnostic. The lists mirror via the
  grid's direction-aware columns, so each list stays under its own pan.
- **D-v3-4 — chain tops at the unrotated knuckle.** The chains are drawn
  inside the pan group from the knuckle's at-rest position; at max angle
  the knuckle drifts ≤3.7u horizontally (Lh/2 × (1−cos12°)), absorbed by
  the 7.5u knuckle circle. The vertical follows exactly: knuckle y =
  pivot y ± rise = the pan group's translate.
- **D-v3-5 — lists have no cap and no scroll.** The real driver universe
  is 4; case H proves 9 rows render without collision. Overflow is
  "handled independently" by ordinary document flow — the illustration
  never resizes.
- **D-v3-6 — empty states are prose, not boxes.** Quiet secondary-ink
  lines (evidence-based: they state what the readings show, no
  prediction), deliberately unlike the retired dashed placeholder.
- **D-v3-7 — the motion pair.** The tilt transition moved from inline
  style to the repo's standard Tailwind class
  (`transition-transform duration-500 ease-out motion-reduce:transition-none`)
  so prefers-reduced-motion is honoured on the SVG groups (v1 §6.7).

### Measured checks (browser, on the temporary harness — never shipped)

| # | Check | Result |
| --- | --- | --- |
| V1' | Tilt law: measured pan-rim height difference = Lh × sin(angle) | A 4°→23.4px (exp 23.4) · B 0→0 · C 9°→52.6 (exp 52.6) · D 0→0 · E 12°→69.9 (exp 69.9) · G 0→0 · H 4°→23.4 (exp 23.4) — all exact |
| V2' | Non-directional states stay level | B, D, G: rotate(0deg), rim diff 0px |
| V3' | Rows | 56px everywhere; chips min-h 44px |
| V4' | Fixed geometry | The zone's innerHTML is byte-identical across cases A/B/H modulo transforms + aria-label; no inline height ever set |
| V5' | No overlap / no collision | banner→zone→lists strict at 320px; case H clean (VLM-verified) |
| V6' | Contrast | machinery ink 7.98:1 light / 7.7:1 dark (≥3:1); count line ≥4.5:1 (unchanged classes) |
| V7' | Visible lean | 360px: case A 23px rim diff; case E 69.9px |
| V8' | Empty sides | A (for-empty), C (against-empty), D (both): prose empty states render; `data-balance-slot` no longer exists anywhere |
| V9' | Overflow | 0px horizontal at 320, 360, 768, 1280 (en + fa) |
| V10' | Old checks | §4 mapping, §6 formula, verdict/count/aria, panel behaviour, trays, integration — all re-tested (30 tests, file `balance.test.tsx`) |
| V11' | Keyboard | Row focus + Enter opens the shared panel, aria-expanded true; tab order verdict→rows→trays |
| V12' | RTL | svg scaleX(-1), for-pan + for-list on the right, beam 4° unchanged, rim diff 23px, 0 overflow |
| V13' | Design review | VLM critique: "Professional & Sophisticated" — proportions, stroke hierarchy, whitespace, alignment all pass; the single nitpick (stylised rigid chains) is the deliberate stable-icon choice |

### Scenario sentences (one per screenshot, the v2 §8 convention)

- `v3-A-1280-en.png` — a visitor sees "Leaning against gold · 1 against
  · 3 couldn't be read", a classic balance tipped slightly down on the
  right, Real yields 2.84% in the Against-gold list, and a quiet
  "No readings support gold right now." line under the empty For-gold
  heading — an honest light lean.
- `v3-E-1280-en.png` — the same balance tipped to its full 12° with four
  adverse rows — a clearly heavier against-lean.
- `v3-C-1280-en.png` — "Leaning for gold", beam down on the left, three
  green rows, and the against-empty line on the right.
- `v3-D-1280-en.png` — "Can't read the conditions right now", a level
  beam, both lists empty, four dashed unread chips below — no direction
  implied.
- `v3-B/G-1280-en.png` — "Balanced", level beam, rows on both sides.
- `v3-H-1280-en.png` — six rows left, three right, the balance identical
  in size and tilt to any other 3-net case.
- `v3-*-fa.png` — the mirrored fa layout: «به نفع طلا» column on the
  right, Persian digits, the SVG mirrored, the lean on the same
  semantic side.
- `v3-*-360-*.png` / `768` — the same anatomy at mobile widths, no
  horizontal scroll, rows wrapping cleanly at half-card width.
- `v3-A-1280-*-dark.png` — the drawing in dark theme (same ink pair,
  7.7:1).

The harness files (`balance-harness.html`, `src/balance-harness-main.tsx`)
were temporary and are deleted — no test data ships.

## v4 — the abstract editorial balance (owner Iteration-2 directive, 2026-10-25)

The owner reviewed the deployed v3 hanging-pan scale: *"The latest
iteration introduced a literal weighing scale with suspended bowls,
wires, and a tall central column. Although this makes the balance
metaphor immediately recognizable, it is not the desired visual
direction. The target is the earlier, simpler concept titled «برآیند
عوامل مؤثر بر قیمت طلا»… abstract, restrained, editorial, carefully
proportioned."* This section supersedes v3's drawing (again by direct
owner order) while keeping every logic rule the lineage has pinned:
the tilt law, the state mapping, the off-beam lists, the prose empty
states, the trays, the detail panel, the data flow.

### The directive, verbatim mapping

1. **Correct the visual metaphor** — the drawing is now ONE inline SVG
   (520×104, a deliberately FLAT editorial proportion): a refined,
   slightly weighted horizontal beam (a filled tapered path, 9u tall
   at the centre → 6u at the ends), a compact geometrically precise
   central pivot (a 9u hub with a surface-colour pin dot, its apex
   meeting a 13u keystone triangle — NO base bar, NO tall column),
   and subtle clearly-defined endpoints (a 6.25u bead at each beam
   end, green for / red against — the only colour in the drawing).
   The dotted level reference through the pivot is kept (the honest
   comparison device). NO hanging wires, suspended bowls, tall support
   column, unnecessary outlines or decorative machinery — and the
   geometry/composition was reworked from scratch, not recoloured or
   resized: the v3 constants (520×252 viewBox, pillar, chains, pans,
   pan translations, endDrop plumbing) are deleted.
2. **Clear visual hierarchy (Iteration-2 §3 order)** — heading
   «برآیند عوامل مؤثر بر قیمت طلا» (type-question voice) → the
   concise explanatory subtitle (caption voice, secondary ink) → the
   illustration (max-w 520, centred) → the two side-labelled factor
   lists (max-w 520, centred — each list sits under its side's half
   of the beam) → the OVERALL ASSESSMENT at the end (the verdict word
   + the count line + the card's banner sentence where needed,
   divider-separated from the lists like the footing strip) → the
   shared detail panel → the trays. The v1 "answer first" verdict
   placement is retired BY THIS DIRECTIVE's own ordering.
3. **The aggregate separated from the factors** — unchanged from v3
   rule 3 (the lists beneath their sides; the illustration's geometry
   is independent of the factor count), now with the lists sharing
   the beam's footprint.
4. **Empty-side state (Iteration-2 §5)** — the prose empty lines are
   kept and SPLIT by evaluation state: a side with no qualifying
   factors after a completed evaluation carries the evidence-based
   line («در حال حاضر، نشانهٔ معناداری از حمایت عوامل بررسی‌شده از
   رشد قیمت طلا دیده نمی‌شود.» — the owner's suggested wording,
   round-50); when NOTHING could be read (readable 0) BOTH sides
   carry the distinct unavailable line (listEmptyNone) so an absence
   of readings is never worded as an absence of pressure. No dashed
   rectangle anywhere.
5. **Consistent with the actual assessment** — the tilt law is
   UNTOUCHED (|net|/total × 12°, 4° floor; level at net 0 and at
   readable 0). Measured on the harness: the bead height difference
   equals Lh × sin(angle) with 0.0u diff for every case (A 4°, B/D/G
   0°, E 12°, H −4°) at BOTH 1280 (scale 1.0) and 360 (scale 0.5385).
6. **Responsive** — the lists stack below `sm:` (the long side labels
   stay on one line at 360) and sit side-by-side under their halves of
   the beam from `sm:` up; zero horizontal overflow measured at 360
   and 1280 in both locales; the illustration is a fixed function of
   its width (viewBox aspect 520:104 — less than half v3's height).
7. **Preserved** — data flow, driver mapping, verdict word, count
   line, banner, trays, detail panel, price footing, RTL (one
   scaleX(-1) mirror of the pure-geometry SVG, rotation stays
   LTR-signed), motion pair (500 ms ease, reduced-motion honoured).

### Decisions (D-v4)

- **D-v4-1 — the "sides" speak with colour beads, not platforms.** The
  Iteration-2 prompt allows "endpoints OR platforms". A first draft
  drew platform bars under the beam ends; the design-critique loop
  (VLM pass 1) read them as "floating underlines that slipped" and
  the trapezoid mount + base bar as a "desk toy". The rework slimmed
  the beam (11u → 9u centre), replaced the mount with the 13u keystone
  triangle (no base bar), and replaced the platforms with the
  accent-coloured endpoint beads — subtle, clearly defined, and the
  only colour in the drawing. The side captions + icons in the lists
  below carry the explicit labels (colour never rides alone, §12.2).
- **D-v4-2 — the unavailable empty state is its own copy key.** v3's
  two empty lines assumed an evaluation had run; case D (4 unread)
  showed "No readings support gold right now." on an empty side —
  wording that claims a completed evaluation. v4 adds
  `listEmptyNone` ("Nothing could be read yet, so neither side has
  been weighed." / «فعلاً هیچ عاملی قابل خواندن نبود؛ بنابراین هیچ
  سویی سنجیده نشده است.») used on BOTH sides only when readable 0.
  The five Iteration-2 §5 cases map: no qualifying factors → the
  evidence line; data unavailable/stale → listEmptyNone + verdict
  'none' + the unread tray; mixed signals → 'Balanced' verdict +
  level beam; insufficient evidence → the model's own honest design
  (unread drivers divide into `total`, pulling the ratio toward
  level — expressed by the small angle + the count line, no new
  state invented); valid aggregate → the tilt.
- **D-v4-3 — the tilt angle and the green/red tokens are NOT
  designer-adjustable.** The VLM critique passes suggested increasing
  the case-A lean to 6–8° "for semiotic clarity" and muting the
  greens/reds. Both declined: the angle formula is the owner's model
  (spec §6, "no weights", "no extra threshold") and the colours are
  the site's own status tokens (spec §12.3 "reuse the tokens the page
  already uses").
- **D-v4-4 — the lists share the beam's footprint.** The lists grid
  is max-w-[520px] mx-auto like the SVG, so each list sits under its
  side's half of the illustration on any card width (the VLM's
  "align the lists with the sides" note), stacking to one column
  below `sm:` so «عوامل حمایتی از قیمت طلا» never wraps mid-word.
- **D-v4-5 — the site's zig-zag trend icons stay.** The VLM disliked
  them ("iconographic dissonance") — they are the owner's own
  artwork (the verdict strip's up/down zigzags) and the page-wide
  factor-direction language; replacing them site-wide is outside this
  component's scope (Iteration-2 §1: "Do not change … shared
  typography … in ways that affect the rest of the application").

### Measured checks (browser, on the temporary harness — never shipped)

| # | Check | Result |
|---|---|---|
| V1'' | Tilt geometry | Bead Δy = Lh × sin(angle) with **0.0u diff** at 1280 AND 360 (scale 0.5385): A 23.438/23.438, E 69.858/69.858; B/D/G level 0 |
| V2'' | No hanging machinery | `[data-balance-pan]` absent; the reference is the ONLY `<line>`; the fulcrum is ONE path (no base bar, no pillar, no chains) |
| V3'' | Multi-factor safety | Case H (6+3): the SVG markup byte-identical modulo transforms/aria (jsdom) and the same tilt as any 3-net case |
| V4'' | Overflow | scrollWidth == clientWidth at 360 and 1280, en + fa |
| V5'' | Empty states | Case A: evidence line under the empty For list; case D: the distinct unavailable line on BOTH sides (getAllByText ×2); no `[data-balance-slot]` anywhere |
| V6'' | RTL | fa: whole SVG mirrored (scaleX(-1)), the rotation value identical to en (4°), «برآیند عوامل مؤثر بر قیمت طلا» heading, Persian digits, the for list on the inline-end |
| V7'' | Interaction | Keyboard: focus a row → Enter opens the shared panel (aria-expanded=true) → Enter closes; a tray chip opens the same panel; zero console errors on a fresh session |
| V8'' | Design review | VLM pass 2 on the reworked geometry: "refined in its restraint", "well-proportioned", "clean hierarchical structure… polished, professional"; pass 3: the lists sit under their sides, composition "balanced and professional" |
| V9'' | Gates | typecheck 6/6; web 534, api 238, insights 463, core 191, scraper 67, markets 13 (1,486 total); lint 0 errors/15 accepted advisories; copy:audit clean (round-50, 2,152 entries); budgets held: entry 295.29/88.81, Insights lazy 625.46/149.74 vs 626/150 |

### Scenario sentences (one per screenshot, the v2 §8 convention)

- `before-v3-A-1280-en.png` — the BEFORE state: v3's literal
  hanging-pan scale (pillar, chains, suspended dishes) the owner
  rejected.
- `v4-A-1280-en.png` — a visitor sees the heading "The aggregate of
  factors affecting the price of gold" with its one-line subtitle,
  an abstract beam leaning gently down to the red bead, Real yields
  2.84% in the Factors-pressuring list, the evidence-based empty
  line under the empty Factors-supporting list, and the overall
  assessment "Leaning against gold · 1 against · 3 couldn't be read"
  after a divider — an honest light lean, editorial not mechanical.
- `v4-E-1280-en.png` — the same beam at its full 12° with four red
  rows — a clearly heavier against-lean, still one flat mark.
- `v4-C-1280-en.png` — "Leaning for gold", beam down to the green
  bead, three green rows, the against-empty line on the other side.
- `v4-D-1280-en.png` — "Can't read the conditions right now", a
  LEVEL beam (no direction implied), both lists carrying the
  unavailable line, four dashed unread chips below.
- `v4-B/G-1280-en.png` — "Balanced", level beam, rows on both sides
  (mixed signals stay undirected).
- `v4-H-1280-en.png` — six rows left, three right, the illustration
  identical in size and tilt to any other 3-net case.
- `v4-A2-1280-en.png` — the banner (the C12 gold-high-with-high-
  real-yields note) riding with the overall assessment at the end.
- `v4-*-fa.png` — the mirrored fa layout: «عوامل حمایتی از قیمت
  طلا» list on the right under its green bead, «برآیند عوامل مؤثر
  بر قیمت طلا» heading, Persian digits, the SVG mirrored, the lean
  on the same semantic side.
- `v4-*-360-*.png` / `768` — the same anatomy at mobile widths, the
  lists stacked on one column, zero horizontal scroll.
- `v4-A-1280-*-dark.png` — the mark in dark theme (same ink pair,
  7.7:1; VLM: "all clearly visible with excellent contrast").

The harness route (`src/routes/GoldBalanceTest.tsx` + its ROUTES and
App registrations) was temporary and is deleted — no test data ships.

## v5 — the wireframe-reference re-composition (2026-10-26)

Directive: the owner's reference board
`docs/ui-reference/gold-silver-balance-target-wireframe.png` — the two
opposing factor groups move ABOVE the drawing, the abstract balance sits
centred beneath them, a compact aggregate assessment follows, and long
lists progressive-disclose. The v4 abstract MARK is kept (beam + hub +
keystone + accent beads + dotted level reference — no pans, wires or
column); only the COMPOSITION and the arm proportion change.

- **Order (top → bottom):** the heading + subtitle → the two factor
  columns (side by side ≥ `sm:`, stacked below; for → against DOM order)
  → the beam (SVG, sharing the columns' max-w-[640px] footprint) → the
  soft centred assessment box (verdict + count + banner) → the shared
  detail panel → the neutral/unread trays.
- **Endpoint alignment (the reference's core idea):** the beads sit at
  25%/75% of the shared footprint — exactly under the two columns'
  centres (measured: bead centre 480 vs column centre 477 at 1280, the
  3px residue is the grid gap; D-31 records why centre-alignment beat
  the full-width reading of the sketch).
- **Arm:** Lh 336u → 260u, canvas 520×104 → 520×88, pivot y 52 → 44.
  The ANGLE law is untouched — endDrop = Lh × sin(angle) still exact
  (0.0u diff on every harness case at 1280 and 360); only the drawn arm
  is shorter. The swing reserve is now ±27u (the 12° max on the 260u
  arm) with ~11u canvas clearance each side.
- **Progressive disclosure:** BALANCE_LIST_REVEAL = 3 rows per column,
  then "+{n} more" / "Show fewer" pills (the attention-tile copy keys
  and anatomy, `aria-expanded` + `aria-controls` → the column). The
  zone's SVG is byte-identical across disclosure states and row counts
  (regression-tested; the v5 suite is 31 tests).
- **Assessment box:** bg-currena-soft/60, max-w-[440px], centred under
  the pivot; the verdict word in the question voice (the box's focal
  line) over the count line (label voice, ≥14px).
- **Empty side:** the evidence-based line in the same soft tint (no
  ring, no dashed slot — a statement, never a placeholder). The
  five-state semantics and every string are the v4 ones — zero copy
  changes, zero manifest entries, audit clean.
- **Budget:** Insights lazy 626.27/149.92 vs 627.00/150.00 — the raw
  bumped +0.27 kB for the disclosure pills + the assessment box
  (D-31); gz held.

Screenshots: `docs/insights/screenshots/gold-balance/v5-iteration/`
(24 captures + README) — before-v4 baseline, cases A–E/G/H × en/fa ×
1280/360, the expanded H, the banner variant, both dark captures. The
harness route was again temporary and is deleted — no test data ships.

## v6 — the Iteration-4 pans directive: the factors REST ON real pans (2026-10-26)

Directive: the owner's Iteration-4 work order — v5's composition
(factors above, an abstract beam with colored endpoint dots) "does not
convincingly communicate that the factors are the loads causing the
balance to tilt"; the factors must be "physically supported by the
balance pans", in a "sophisticated, minimal, editorial
financial-dashboard" voice. This SUPERSEDES the v5 layout instruction
(factors above the beam): the pans now hang BELOW the beam and carry
the factor tiles themselves.

- **The stage (one fixed-height relative box, max-w-[640px]):** 240px
  ≥ `sm:` / 260px below, a container-type:inline-size size context.
  In paint order: the dotted level reference (behind everything, wider
  than the beam — v2 §5.3 kept) → the pan grid at the fixed pan-top
  offset 80px (z-1, the interactive layer) → the beam zone (z-2,
  pointer-transparent, painted over the hanger tops so each bead caps
  its suspension lines). All geometry is CSS percentages + cqw — no
  SVG viewBox, no ResizeObserver, no runtime measurement.
- **The machine per side:** a 12px-tall tapered beam rotating about
  the compact hub (16px) + keystone (30×13) pivot; a 13px accent bead
  terminating each end (green for / red against — the side marker
  where the hangers meet the beam); TWO 2px suspension lines splaying
  ±24px over a 36px hang from the bead down to the pan's top edge,
  each capped with a 4px junction "ring" dot; a SHALLOW PAN (92% of
  its 50% column, 88px ≥ sm / 118px below): 1.5px rim, 3px floor edge
  in the darker secondary ink, a light inner wall line (tray
  thickness), bg-currena-soft/70 (/90 in dark), a soft under-shadow.
- **Physical coherence (the core of v6):** the beam rotates by θ
  (`--s`), each pan assembly translates by exactly its bead's drop —
  `--drop = 25cqw × sin(--t)` (25cqw = Lh ÷ 2 by construction: the
  beam spans 25%–75% of the stage) — and tilts by 0.2 × θ
  (`--pan-tilt`, ≤ 2.4°) about its top-center hang point. The hangers
  are rigid parts of the assembly, so bead → lines → pan stay
  connected at every angle. MEASURED: case A (4°) pan-pair and
  bead-pair differences both 22.32px = 320×sin4°; case E (12°) both
  66.53px = 320×sin12°; hanger tops converge at the bead centers
  within 0.6px. `--t` is the DIRECTION-FREE physical sign (drives the
  drops); `--s` flips for RTL so the heavy end always dips. One 500ms
  ease transition on both the beam and the assemblies (motion-reduce:
  none). A browser without CSS `sin()`/`cqw` degrades to the level
  state — never a wrong direction.
- **The tiles (the loads):** compact real buttons — direction icon +
  full short label (never truncated) + the value (hidden below `sm:`)
  — bottom-aligned on the pan's floor (justify-end: they REST on the
  surface), 6px gaps, contact shadows, min-h 40px mobile / 32px ≥ sm.
  Each tap opens the shared detail panel. The v5 full-width factor
  columns above the beam are retired.
- **Capacity + overflow (rule 3):** BALANCE_PAN_CAPACITY = 2 tiles
  per pan; the rest are counted by a "+{n} more" pill (the
  attention-tile copy keys + anatomy) hanging just UNDER the pan
  inside the translating assembly — clearly attached to its side,
  deliberately NOT on the pan surface so it can never read as another
  load or a fabricated weight. The pill expands the side's full row
  list below the assessment (56px rows, one shared panel); "Show
  fewer" collapses it. Empty sides show their full evidence-based line
  WITHOUT any disclosure. Nothing is silently omitted; the stage
  geometry never depends on any count (regression-tested: the stage
  class is byte-identical across 1-row and 6-row sides).
- **Empty pans (rule 2):** an empty side keeps its COMPLETE pan
  (hangers, ring dots, rim, floor) with a minimal muted marker pill
  inside — `panEmpty` when the evaluation ran (this side simply has no
  qualifying factors), the distinct `panUnreadable` when readable = 0.
  The v4 five-state semantics ride unchanged in the list area below.
- **RTL:** the pan/caption/list grids mirror with the document
  direction (CSS grid, no mirroring transform); the for-bead uses
  `inset-inline-start` so it always terminates the beam end above the
  for-pan; `--s` flips sign in JS while `--t` (the drops) is
  direction-free. NOTHING mirrors text — the source carries a
  regression test asserting no `scaleX(-1)` exists.
- **Copy (round-51):** 2 NEW keys — `panEmpty` /
  `panUnreadable` (the pans' minimal interior markers), en + fa; all
  other balance strings byte-identical to round-50. QA record:
  docs/QA/quirks-2026-10-26-balance-v6-fa-copy.md. Manifest 2,154
  entries, audit clean.
- **The v6 test suite (30 tests):** the §4/§6/§13 logic suites
  byte-identical + `signedTiltDeg`; rendered: the full structure, the
  pan-drop CSS law (the --t/--s/--drop/25cqw expressions), capacity +
  pill disclosure, the distinct empty/unreadable pans, the RTL sign
  split (fa --t unchanged, --s flipped), the no-mirror source
  guarantee, the order chain, the interactions, the merged-card
  integration.
- **Harness verification (route deleted before commit):** cases
  A–H × en/fa × 1280/360/320, light + dark — all VLM scenario reviews
  pass ("coherent machine", "factors clearly read as physical loads",
  "clearly attached pills", mobile "no clipping"); the before/after
  comparison verdict: "highly successful Iteration-4 implementation".
  Zero horizontal overflow at 320px (documentElement.scrollWidth =
  innerWidth), keyboard Enter opens the panel, zero console errors.
  Declined from VLM critiques: steepening the 4° floor (the owner's
  model), shrinking or removing the empty pan (the fixed-geometry and
  complete-structure rules), hiding the level reference (the v2 §5.3
  rule kept through v4/v5).
- **Budget:** Insights lazy 631.01/150.80 vs the bumped 632.00/151.00
  (raw +4.01 kB, gz +0.80 kB over v5 — the mandated markup's honest
  price; D-32); the entry chunk untouched at 295.29/88.81.

Screenshots: `docs/insights/screenshots/gold-balance/v6/` (the
before/after comparison, the A–H × en/fa sweep, the mobile and dark
sets, the interaction captures) + README.
