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
