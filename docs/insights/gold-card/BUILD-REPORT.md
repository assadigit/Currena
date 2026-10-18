# BUILD-REPORT — the gold/silver balance card ("Balance Rework")

Branch `feat/gold-card-balance` · spec pack `docs/insights/gold-card/`
(00–05 + reference) · assumptions and decisions in `ASSUMPTIONS.md`.

## What changed

The Insights page's signals section now renders the spec's balance card:
**one template per asset behind the Gold | Silver segmented control**,
verdict first — replacing the old merged gold+silver presentation
(the 7-state outlook strip with trend charts, the v7 beam-with-pans
visual, the price-footing rows and the silver-only short list).

Anatomy, in the spec's fixed order:

1. **Header** — `role="tablist"` segmented control (arrow/Home/End keys,
   roving tabindex, RTL-aware) + "Updated {ago} · {n} sources"
   (newest `updatedAt` + distinct `sourceName`s of everything the card
   shows — no new fetch).
2. **Verdict** — the largest text in the card (22px/600, h3 inside
   `aria-labelledby`): the nine-state lean vocabulary (slight/lean/strong
   × for/against, balanced, insufficient, none) + the confidence subline
   "{confidence} · {read} of {total} factors read".
3. **Beam** — hairline beam on a small pivot over a dotted level line
   (viewBox 680, spec-02 geometry); one token per supporting/pressuring
   driver stacked upward; heavier side lower (3°–7° clamped tilt);
   **level below the 75% coverage rule** with "Not enough readings to
   call"; one 800ms `cubic-bezier(.2,.8,.2,1)` settle on first reveal
   (IntersectionObserver), replayed on data change or asset switch;
   `prefers-reduced-motion` removes it; `role="img"` with data-built
   `<title>`/`<desc>`.
4. **Neutral + unread bands** — solid chips for neutral drivers, dashed
   amber-captioned ghost chips for unread ones (never hidden); a chip
   click opens and scrolls to its row.
5. **Price context** — the metal's own price, holding/fading/sideways
   phrase (from its 10-year position + 30-day change), signed 30-day
   change and the 10-year range bar: context, never a weight, no state
   colour, no "Works against".
6. **Factor rows** — native `<details>/<summary>` (44px targets,
   hairline separators) in pressuring → supporting → neutral → unread
   order; icon + word per state (never colour alone); plain-language
   effect line per state (spec 04 + inverses); expanded: explanation,
   usual-range bar, "As of {date} · {source}" (Jalali in fa); unread
   rows state their reason and last known value.
7. **Flip line** — only with enough coverage and a real lean, only from
   thresholds the existing config defines (breakeven 2.4%, stress 0 —
   see ASSUMPTIONS §4); "balance out" wording at |net| = 1, otherwise
   pressures-heavy "the pressure would ease" / supports-heavy "the lean
   would soften".
8. **Footnote** — "Each factor counts equally…".

The section shell (title, subtitle, collapse toggle, collapsed summary
lines with the 7-state outlook words) is untouched; `outlookOf` and the
owner-verbatim outlook vocabulary stay for the collapsed line and the
data export. Hero, stock-index section and currency section untouched.

## Files

| File | Change |
|---|---|
| `packages/insights/src/lean.ts` **new** | `computeLean` — the pure rules (spec 03): coverage rule, net, clamped tilt, verdict, confidence, flip candidate |
| `packages/insights/src/lean.test.ts` **new** | the reference's 10 vectors + 3 flip checks + the 05 §A.2 additions (20 tests) |
| `packages/insights/src/index.ts` | export the lean module |
| `apps/web/.../signals/balance-card-model.ts` **new** | factor mapping (states 1:1, footing never a factor), beam geometry, flip thresholds, unread reasons, price phrase, meta, row order |
| `apps/web/.../signals/BalanceCard.tsx` **new** | the card (all eight sections; tablist control, IntersectionObserver reveal, replay key, RTL `dir`, bdi-isolated numbers) |
| `apps/web/.../signals/balance-card.test.tsx` **new** | 38 tests: structure order, beam rules + geometry + RTL, price-not-a-weight, ghost bands, flip hiding/choice, keyboard control, Farsi corpus, the model, + the Signals-section integration test (real `evaluateSignal` → card) |
| `apps/web/.../Signals.tsx` | renders `BalanceCard` (same props the old card took) |
| `apps/web/.../signals/MergedCard.tsx` **deleted** | old merged presentation |
| `apps/web/.../signals/BalanceScale.tsx` **deleted** | old v7 beam-with-pans visual (1,117 lines) |
| `apps/web/.../signals/balance.test.tsx` **deleted** | old v7 visual suite (replaced by balance-card.test.tsx) |
| `apps/web/.../signals/verdict.tsx` | keeps `outlookOf`/`VerdictIcon`/`verdictTone`/`RANGE_SPEED_PCT` for the collapsed summary; VerdictStrip/MetalTrendChart/MetalIconBox retire with the old card |
| `apps/web/src/i18n/insights-copy-en.ts` | `signals.balanceCard` corpus added (spec 04); retired with the old presentation: mergedTitle/Subtitle, goldHighYieldsWarning, the `balance` block, silverOnly, footingTitle/Row/Position, speedLabel |
| `apps/web/src/i18n/insights-copy-fa.ts` | the Farsi twin — repo terms preferred per spec 04 rule 1 (see ASSUMPTIONS §2); same retirements |
| `apps/web/src/index.css` | scoped `.balance-card` block: spec tokens (host surface/text/border reused; spec state hues), segment control, verdict type, beam animation + reduced-motion, bands, rows, container-query mobile anatomy |
| `apps/web/.../config/signals.ts`, `config/index.ts` | `mergeSignals` retired with the old card |
| `apps/web/.../round2.test.ts`, `together-signals.test.ts` | glyph guard → new module tree; copy parity → the new `balanceCard` corpus |
| `eslint.config.mjs` | `docs/**` ignored (verbatim owner spec artifacts: the reference lean-logic pair) |
| `docs/localization/persian-copy-manifest.json` | 64 strings recorded (round `gold-card-balance`, reference `docs/insights/gold-card/04-COPY-EN-FA.md`); 28 retired entries removed — `pnpm copy:audit` clean |
| `docs/insights/gold-card/` | the spec pack, ASSUMPTIONS.md, this report, check-contrast.mjs, screenshots/ |

## Test results

| Suite | Result |
|---|---|
| `packages/insights` (incl. new lean tests) | 22 files, **483 passed** |
| `apps/web` (incl. new balance-card suite) | 40 files, **556 passed** |
| `packages/core` / `packages/scraper` / `apps/markets` / `apps/api` | 191 / 67 / 13 / 238 passed (untouched, green) |
| `pnpm -r typecheck` | clean |
| `pnpm lint` | 0 errors (16 pre-existing advisories in older files; the card itself clean) |
| `pnpm copy:audit` | clean |
| `node docs/insights/gold-card/reference/lean-logic.test.js` | "All 13 checks passed" |
| `node docs/insights/gold-card/check-contrast.mjs` | all 22 WCAG pairs pass on the host surfaces |

Acceptance A: all 10 spec vectors + the reference flip checks pass
(packages/insights lean.test.ts); the 05 §A.2 additions pass
(all-unread → none; silver with industrial unread + 4 read is enough;
missing flip hides the line; stale → unread mapping pinned).

## Screenshots (docs/insights/gold-card/screenshots/)

The 8 acceptance combinations, captured through the real Vite build of
the real component/copy/CSS (driven by the sandbox's Playwright-based
agent-browser; a temporary harness mounted the card — removed from the
final tree):

- `en-light-desktop.png` · `en-dark-desktop.png` (1280)
- `fa-light-desktop.png` · `fa-dark-desktop.png` (1280)
- `en-light-mobile.png` · `en-dark-mobile.png` (375)
- `fa-light-mobile.png` · `fa-dark-mobile.png` (375)
- `REFERENCE-en-light-desktop-three.png` + `BUILD-en-light-desktop-three.png`
  (the same-state comparison pair against the spec's reference page)

Verified per 05 §C: beam tilt matches the heavier side in both languages
(supports end on the right in fa); no horizontal scroll at 375
(scrollWidth = innerWidth, checked programmatically); token text hidden
and the two lists shown below 520px container width (computed display);
numbers/prices/signed percentages keep their order in fa (bdi-isolated);
Persian digits in fa, Latin in en. Card geometry measured against the
reference: padding 20px, radius 12px, verdict 22px/600, 44px controls.
`prefers-reduced-motion` → computed `animation: none` on beam + tokens
(browser-emulated).

## Assumptions

All in `ASSUMPTIONS.md` (18 numbered decisions). The load-bearing ones:
- the new card replaces the whole expanded presentation (outlook strip
  and trend charts included) — spec 00 decision 2's fixed order leaves
  no room for them; the collapsed summary still speaks the 7-state
  outlook;
- flip thresholds exist only where the indicator config defines them
  (breakeven 2.4%, stress 0) — nothing invented;
- Farsi prefers the repo's established terms («قابل ارزیابی نیست»,
  «فشارآور», «حمایتی», «خنثی», «متعادل», «به‌روزرسانی»).

## What to check by eye

1. The 8 screenshots (or the live page in both languages/themes) —
   especially the beam's settle animation feel and the Farsi wording.
2. A live /insights render with real data (this build was verified
   against fixture data through the real component; the deployed API
   feed will exercise the same paths).
3. The 05 §F human test (5 people × 5 seconds) — the owner's one check.
