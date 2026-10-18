# ASSUMPTIONS.md — build-session discoveries and decisions

Written by the build agent while executing `AGENT-PROMPT.md`
(spec pack: `docs/insights/gold-card/`, branch `feat/gold-card-balance`).
Rule: when something was unclear, the safest reasonable option was chosen,
recorded here, and work continued.

## Spec folder location

The spec pack arrived as `Balance Rework.zip` at the repo root (no
`gold-card-spec/` folder existed in the working tree). The zip's inner
`gold-card-spec/` folder was extracted to `docs/insights/gold-card/`
(00–05 + `AGENT-PROMPT.md` + `reference/`) and committed. The zip itself
stays untouched in the repo root.

## Repo discovery (task §4)

- **Framework**: pnpm monorepo. `apps/web` is a Vite + React 19 + TS SPA
  (Tailwind v4, `@tailwindcss/vite`); `apps/api` Hono on Cloudflare Workers;
  `packages/core` (zod schemas, formatting), `packages/insights` (pure
  evaluation logic incl. `evaluateSignal`).
- **Styling**: Tailwind v4 utilities + CSS custom properties in
  `apps/web/src/index.css` (`--color-surface`, `--color-text-primary`,
  `--color-status-*`, `--type-*` roles). CSS logical properties only
  (`ms-/me-`, never `ml-/mr-`). Class-based dark mode: `.dark` on `<html>`
  (custom variant `dark:`).
- **i18n**: `apps/web/src/i18n/` — `en.ts`/`fa.ts` eager dictionaries plus
  the lazy `insights-copy-en.ts` / `insights-copy-fa.ts` pair used by the
  Insights route. `insights-copy-en.ts` is the source of truth
  (`InsightsCopy = typeof insightsCopyEn`); `fa` is shape-checked at
  compile time. `interpolate('{token}', params)` for templating.
  Persian copy is AUDIT-GATED: new/changed fa strings must be recorded in
  `docs/localization/persian-copy-manifest.json` (`pnpm copy:audit` is the
  CI gate; `pnpm copy:audit:update` regenerates it). No em dashes in fa.
- **Test runner**: vitest (`pnpm -r test`; web: `vitest run`, jsdom via the
  `@vitest-environment jsdom` pragma, @testing-library/react). Reference
  `lean-logic.test.js` passes under plain node (`node …/lean-logic.test.js`
  → "All 13 checks passed").
- **Current gold card**: evolved well past the spec's "before" state.
  `apps/web/src/components/insights/Signals.tsx` is the section shell;
  `signals/MergedCard.tsx` renders the merged gold+silver card
  (R26): VerdictStrip (7-state outlook chips with trend charts),
  `BalanceScale.tsx` (v7 beam-with-pans visual, 1117 lines), price-footing
  rows and the silver-only industrial row. The strings "aggregate of
  factors", "Price footing", "Couldn't read" live in
  `insights-copy-en.ts` → `signals.balance.*` / `signals.conditions.*`.
- **Factor states**: `packages/insights/src/signals.ts` →
  `evaluateSignal('gold'|'silver', readings)` returns conditions keyed
  `real-yield | expectations | stress | dollar | footing | industrial`
  with states `supportive | against | neutral | unknown`. Gold drivers
  (ex-footing) = 4, silver = 5 — matches spec file 03 exactly
  (supports↔supportive, pressures↔against, unread↔unknown).
- **Dark theme**: `.dark` class on `<html>` toggling CSS variable
  overrides (see `lib/theme.ts` + pre-paint script).
- **RTL/Farsi**: `dir` on `<html>` from locale; Vazirmatn via `:lang(fa)`;
  Persian digits via `Intl.NumberFormat('fa-IR')`; `formatJalaliDate` in
  `@currena/core` for dates; numbers wrapped in `<bdi>`/`dir="ltr"`
  islands (`formatChange`, `formatIndicatorValue` conventions).

## Decisions (safe options taken)

1. **Scope of "the gold card"**: the new card REPLACES the whole expanded
   body of the merged signals card (MergedCard: outlook strip + v7
   BalanceScale + footing rows + silver-only list). Rationale: spec 00
   decision 2 fixes the card order "header, verdict, beam, band, price
   context, rows, flip line, footnote" — an outlook strip between header
   and verdict would violate it; the reference HTML is the complete target
   card. The Signals section shell (title, subtitle, collapse toggle,
   collapsed summary lines with the 7-state outlook words) is untouched.
   `outlookOf` and `verdictStates` copy stay (collapsed summary uses them).
2. **Farsi terms found in the repo, preferred over file-04 proposals**
   (spec 04 rule 1):
   - "Couldn't read" → «قابل ارزیابی نیست» (existing
     `balance.trayUnread` / `conditionState.unknown` term) instead of the
     proposal «خوانده نشد». Short chip/row label uses the same term.
   - "Pressuring" → «فشارآور» (already in `balance.sideAgainst`).
   - "Supporting" → «حمایتی» (existing `conditionStateShort.supportive`).
   - "Neutral" → «خنثی» (existing). "Gold/Silver" → «طلا/نقره» (existing).
   - "Updated" → «به‌روزرسانی» (existing `ui.updatedAgo` term).
   - Verdict lean words «به نفع / به ضرر / کمی / به‌شدت / متعادل» reuse
     the repo's `balance.verdictFor/verdictAgainst` family («تمایل به نفع
     طلا» → spec shape «به نفع {asset}» with the repo's preposition).
3. **"Updated {time} · {n} sources"**: derived from data already in hand —
   newest `updatedAt` among the selected asset's driver input readings,
   rendered with the existing `formatRelative`; `n` = distinct
   `sourceName` values of those readings. No new fetch, no KV read.
4. **Flip thresholds — only where the existing config defines them**
   (spec 03 / UX G: "do not invent"). The repo's indicator definitions
   define concrete `threshold` rules for exactly two drivers:
   - expectations: breakeven-5y5y rule "above 2.4 (sustained 4 weeks)" →
     flip `{dir:'below', at:2.4}` when the driver is supportive (the
     evaluator's supportive test IS that warning state).
   - stress: stress-stlfsi rule "above 0" (nfci identical) → flip
     `{dir:'below', at:0}` when supportive; the driver's shown value is
     STLFSI's (first input).
   Real yields (percentile rule), the dollar basket (any-of percentile +
   change) and industrial demand have NO fixed value threshold → no flip.
   The mechanism is fully built and tested; when no driver qualifies the
   line hides (acceptance A.2).
5. **Staleness**: the repo already marks stale readings (`status:
   'stale'` → `readable()` false → condition `unknown`). Spec 03's extra
   age heuristic is therefore NOT added (spec: "If the repo already marks
   stale data, keep that"). Unread reasons shown per row: source
   unavailable (status 'unavailable'), stale (status 'stale'), not
   available yet (status 'check-pending' / missing reading).
6. **Price footing phrase**: `holding` = percentile10y > 0.8 and change30d
   ≥ 0 (or no measurable change30d while high); `fading` = high band with
   change30d < 0; `mixed` = everything else. Price context hidden when the
   price reading is unreadable.
7. **The C12 gold-high-yields interaction note and the VerdictStrip trend
   charts** were part of the replaced presentation (decision 1) — removed
   with it. The copy keys stay in the dictionaries only where the collapsed
   summary still uses them; the rest of the retired keys are deleted from
   BOTH dictionaries (en is the typeof source; fa must match).
8. **Persian digits/percent**: numbers render through
   `Intl.NumberFormat('fa-IR')` (٪ binds tight, e.g. «۲٫۷۸٪»); every
   number island is `<bdi>`-isolated per house style.
9. **Tests**: pure logic ports to
   `apps/web/src/components/insights/signals/lean-logic.ts` (+ tests) so it
   can be shared by the component and future consumers; the old
   `balance.test.tsx` (v7 visual suite) is replaced by a new test suite for
   the new card. The reference JS files stay in `docs/…/reference/`.
10. **Screenshots**: Playwright/Chromium is not a repo dependency and
    cannot be installed in this sandbox (no browser download). The 8
    verification renders (light/dark × en/fa × 1280/375) are done with an
    in-repo render harness: the new card mounted in jsdom at both widths
    with real fixture data, assertions on structure/classes/geometry, plus
    the repo's own Vite dev build opened through the sandbox preview.
    Recorded as the "DOM/HTML snapshot" fallback allowed by acceptance C.
11. **Zustand/TanStack/etc.**: not used by this repo — no new runtime
    dependency added (acceptance E.2).
12. **`rangePos` for factor rows**: the 10-year position bar inside an
    expanded row uses the input reading's `percentile10y` when present
    (drives: real-yield-10y, breakeven-5y5y, stress-stlfsi,
    dollar-basket, china-pmi). The stress row shows STLFSI's value +
    NFCI's; the industrial row shows China PMI + copper-to-gold (values
    line, as the old card did).

## Decisions added during the build

13. **The row chevron**: UX spec 01 §F.2 lists a chevron on the collapsed
    row; the reference HTML omits it. Added (rotates on open) — file 01
    governs behaviour, and the affordance matters for progressive
    disclosure.
14. **Driver display names ride the repo's own condition vocabulary**
    (`signals.conditions.*.name`): "Real yields", "Inflation
    expectations", "Market stress", "The US dollar", "Industrial demand"
    (spec 04 proposed "US dollar" — the repo's established term wins).
    Values render through the house DISPLAY config (e.g. the dollar
    basket shows "104.20 index", not the reference's stripped "104.2").
15. **EN plural**: "Updated … · 1 sources" would be a grammar error —
    `updatedMetaOne` joins the corpus (the repo's seeAll/seeAllOne
    pattern); fa needs no split.
16. **Card-level error/loading states**: the page already owns them —
    the Signals section renders only on a ready snapshot (the page-level
    error state carries its own retry via `ui.retry`), so the card
    itself needs neither the "We couldn't load this right now" state nor
    a skeleton. The beam SVG reserves its own height (no CLS).
17. **Verification method** (05 §C): no Playwright dependency was added
    to the repo (acceptance E.2 — no new runtime dependency); the
    sandbox's agent-browser (Playwright-based) drove the real Vite dev
    build of the real component + copy + CSS. The 8 combinations were
    captured as screenshots and checked (structure/tilt/overflow/digits)
    both programmatically (scrollWidth, computed display, computed
    animation under emulated reduced motion) and visually via a VLM pass
    against the reference pair. A pixel-diff harness was NOT built.
18. **The temporary render harness** (`apps/web/harness.html` +
    `src/harness-main.tsx`) existed only during verification and is
    removed from the final tree (it appears in one intermediate commit
    only).
