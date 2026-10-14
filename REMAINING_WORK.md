# Currena — Remaining & Deferred Work (the follow-up work order)

Commissioned **2026-10-15** by the owner after the QA long-run
(audit → reliability hardening → de-monolith-ing → dead code/a11y/lint →
deploy + live-verify — see `docs/PROGRESS.md` 2026-10-15 row,
`docs/QA/audit-2026-10-14.md`, D-14…D-18).

**This file is the work order for the next session.** It lists everything
the QA session deliberately left open, verified against the code as of
`976d154` (2026-10-15). Every item carries its evidence, its fix plan, and
its acceptance criteria. Items NOT listed here are done — do not re-audit
what the QA session already closed (the audit report + PROGRESS row are the
disposition record).

## State at hand-off

- Gates: **1,171/1,171 tests** (core 183 · scraper 67 · insights 350 ·
  markets 13 · api 206 · web 352), typecheck 6/6, lint 0 errors / 34
  accepted advisory warnings (D-17), copy audit clean, `pnpm audit` zero
  advisories (D-18), budgets held (entry 292.77/87.80 vs 296/89.5; Insights
  lazy 581.44/136.81 vs 582/137).
- Deployed: currena-api `93ae180a` + currena-markets `d825a8d4` (from
  `6090842`, runtime-identical to `976d154` — docs-only delta). Live-verified
  2026-10-14T14:28Z (EN+FA, desktop+375px, zero console errors, D-12/D-13
  cache chain + freshness chain intact).
- Read first: `AGENTS.md` (rules), `docs/NEXT_SESSION_PROMPT.md` (state
  brief + gotchas), `docs/DECISIONS_FOR_ALI.md` (D-01…D-18; **continue from
  D-19**), `docs/DEPLOY.md` (deploy + verify protocol).

## Workflow (enforced — details in AGENTS.md / NEXT_SESSION_PROMPT.md)

1. Gates between EVERY commit: `pnpm -r typecheck`, `pnpm -r test`,
   `pnpm run lint` (0 errors), `pnpm run copy:audit`, web build +
   `node scripts/check-bundle-budget.mjs`. Push; **CI must be green before
   stacking the next change.**
2. Conventional commits, one logical change each. Decision log entries
   (D-19+) for every judgment call, especially every behavior-visible
   change.
3. New user-facing strings: always en+fa, copy manifest discipline,
   `pnpm run copy:audit` green. No "is/are" verb agreement across locales.
4. Deploy at the end (and after any api/markets code change): the SPA is
   served BY currena-api — any web change needs web build + **api worker
   deploy**. Markets worker only when `packages/insights`/`apps/markets`
   code changed. Re-put `EODHD_API_TOKEN` after a markets deploy
   (idempotent).

## Recommended order

WS-1 → WS-2 → WS-3 (a11y) → WS-4 (splits) → WS-5 (advisories) → WS-6
(papers, anytime). Rationale: WS-1/2/3 are small, surgical, high-value;
the a11y edits should land BEFORE the same files get split (WS-4), and the
advisory refactors (WS-5) are safest inside already-split, freshly
characterized modules.

---

## WS-1 — Reliability minors from the audit (each: fix + regression test + D-entry)

### A-5 — fx Yahoo fallback validation is all-or-nothing
Evidence: `packages/insights/src/fx/job.ts:118-124` — if ANY of the 6
required currencies is absent/short, the whole fallback set is rejected and
every pair is held — exactly during a Frankfurter outage, when the
fallback is the only source. (CAD/SEK basket currencies already degrade
per-currency at `:127-129` — the model to follow.)
Fix: validate per-currency; compute the pairs whose legs exist (the
compute layer already degrades per-pair via the catch at `fx/job.ts:287`).
Behavior change is **additive availability** — write the D-entry checking
`docs/specs/insights-world-currencies.md` §2/§4 (V4 intent: "at least 200
daily points … for every currency") before adopting.
Acceptance: fixture test — Yahoo returns 5 of 6 required currencies → the
pairs over present legs compute fresh, absent-leg pairs held with notes;
full-set and empty-set behavior unchanged.

### A-6 — Worst-case subrequest budget sits exactly at the 50 free-plan cap
Evidence: provider worst case 41 + same-invocation KV ops ≈ 9 = exactly 50
(`apps/markets/src/index.test.ts:316-358` asserts the 41; the code comment
claims "≤48" at `apps/markets/src/index.ts:13-15`).
Fix: thread the already-read `prev` snapshot into
`putMarketsIfChanged`/`putFxIfChanged` (store interface gains an optional
`prev` argument; removes 2 same-invocation KV reads — the run already
reads prev for V2/V3/V5). Extend the budget test to count KV ops.
Acceptance: budget test asserts ≤48 total including KV ops; unchanged
write-if-changed semantics (existing tests stay green).
D-entry: interface change on the store — record it.

### A-8 — Stored `stale` flags freeze at write time
Evidence: `packages/insights/src/markets/compute.ts:333-334` re-evaluates
staleness only when a run happens (`reStale`); if BOTH crons fail for days,
KV keeps `stale:false` while `asOf` ages. The UI recomputes age
client-side (display honest); machine consumers (CSV export) are not.
Fix (preferred): recompute per-row staleness at serve time in
`apps/api/src/routes/insights.ts` (one `daysBetween` per row) — same JSON
shape, honestly flipped values. D-entry required (serve-visible behavior).
Alternative: document the invariant next to the field (cheaper, weaker).
Acceptance: contract test — a stored row with `stale:false` and an `asOf`
`STALE_DAYS+1` old serves `stale:true`; fresh rows byte-identical.

---

## WS-2 — Remaining test-gap closers

### C-6 — `apps/web/src/lib/markets.ts` + `lib/fx.ts` clients untested
(the `insights.ts` twin IS tested — copy its shape: kinds, non-JSON 2xx,
envelope `retryAfterSec`, ETag/304 passthrough, abort/timeout).
Acceptance: both files covered at the same bar as `insights.test.ts`.

### C-8 — cron-string test is a literal mirror, cannot catch drift
Evidence: `apps/markets/src/index.test.ts:207-210` asserts
`MAIN_CRON === '30 23 * * 1-5'` etc. — the title says "match
wrangler.jsonc" but the file is never read.
Fix: read `apps/markets/wrangler.jsonc` in the test (fs + JSON5/regex
extract of `triggers.crons`) and assert the code constants equal it.
Acceptance: temporarily editing wrangler.jsonc fails the test (verify,
then revert).

### C-9 — component-test environment (decision + scoped adoption)
No jsdom/testing-library anywhere; banner logic on `Converter.tsx` /
`LiveRates.tsx` is tested only via extracted pure helpers.
Evaluate: add `jsdom` + `@testing-library/react` as web devDeps
(zero bundle impact — devDependencies never ship). Scope: ONLY the
components whose behavior WS-5 touches anyway (hydration/advisory
refactors) — characterization tests there make WS-5 safe. If WS-5 is not
undertaken, this can be declined with a one-line D-entry.
Acceptance: either a green jsdom suite covering ≥Converter + LiveRates
banner states, or a documented decline.

(C-7 remainder is CLOSED — corruption/quota/force/same-generation are all
covered in `snapshot-store.test.ts:440,476,548`.)

---

## WS-3 — a11y leftovers (audit D minors that remained; verified open 2026-10-15)

All are small, none needs new copy EXCEPT the two flagged items (en+fa +
manifest):

1. **Segmented "tab" bars lack tab semantics** — Settle tabs
   (`apps/web/src/routes/Settle.tsx:556` TABS map) and BatchConverter mode
   toggle (`apps/web/src/routes/BatchConverter.tsx:365`): plain buttons.
   Fix: `role="tablist"/"tab"`, `aria-selected`, roving `tabindex`, arrow
   keys (or convert to real radios if simpler — match `AlertsDialog`'s
   pattern below).
2. **AlertsDialog radio group lacks arrow-key navigation**
   (`apps/web/src/components/AlertsDialog.tsx:170-193`, `role="radio"`
   without roving tabindex). Fix: arrow keys move focus/selection per WAI-
   ARIA radio-group pattern.
3. **Splitter stepper +/− glyph labels** (`apps/web/src/routes/Splitter.tsx:158,174`
   — `aria-label="-"`/`"+"`): needs REAL copy (en: "Remove one person" /
   "Add one person"; fa equivalents per the terminology docs) + manifest
   entries (needs-review status is fine per the workflow).
4. **Hardcoded English share title** (`apps/web/src/routes/BatchConverter.tsx:272`
   — `title: 'Batch Currency Conversion'` in `navigator.share`): move to a
   copy key en+fa.
5. **Misleading constant `aria-expanded={false}`** on non-collapsible
   elements: `VerdictMeter.tsx:521`, `PricesBoard.tsx:253`,
   `ConnectionCard.tsx:180`. Fix: remove the attribute (these elements
   expand nothing) — or wire real disclosure semantics if a drawer exists.
6. **Button-only navigation lacks href semantics** (`Header.tsx` nav,
   `Footer.tsx`, `Converter.tsx:785-799` quick-pairs): hash-router buttons
   are not links to AT. Fix: render real `<a href="#/…">` with
   keyboard/click handling preserved (the router already listens to
   hashchange — verify no double-navigation), or add `role="link"` +
   documented rationale. Prefer real anchors.
7. **LED boards lack table semantics** (`LedRateBoard.tsx`,
   `LedGoldBoard.tsx`): per-cell labels mitigate; consider a real
   `<table>`/`role="table"` restructure — visual design must not change
   (LED aesthetic is the product). If the restructure risks the design,
   decline with a D-entry.
8. **No `loading="lazy"` on below-fold imgs** — audit's perf note; add
   where measured below-fold (flags in tables are in-view; check
   Insights imagery first). Careful: lazy on the LED/PWA-critical images
   would hurt — only below-fold, only after measurement.
9. **No idle prefetch of the Insights lazy chunk** — optional perf
   nicety: `requestIdleCallback`-triggered dynamic import on desktop
   only (guard: save-data/2g connections excluded). Declinable with a
   D-entry if the bundle budget or data-saver philosophy says no.

Acceptance for WS-3: axe/manual pass on every touched route, copy audit
clean, budgets held (the 2026-10-14 a11y layer cost +2.15 kB raw on entry
— stay inside 296/89.5), zero console errors, EN+FA + RTL verified.

---

## WS-4 — Module splits, round 2 (behavior-preserving; the Phase-3 recipe)

Priority order (routes before leaf components; every split: characterization
tests FIRST where coverage is thin, one module per commit, budgets must not
regress, zero behavior change):

| Module | Lines (2026-10-15) | Natural seams |
|---|---|---|
| `apps/web/src/components/insights/WorldMarkets.tsx` | 977 | mobile cards / desktop table / summary strips / chart plumbing |
| `apps/web/src/routes/Receipt.tsx` | 951 | form sections / paper rendering / share+PDF export |
| `apps/web/src/routes/Settle.tsx` | 915 | person editor / balance math / tabs+list / share |
| `apps/web/src/lib/fx-presentation.ts` | 891 | chart labels / plain sentences / number+direction fmt groups |
| `apps/web/src/routes/Converter.tsx` | 847 | amount input+quick buttons / pair selectors / result popup wiring / custom-rate disclosure |
| `apps/web/src/components/insights/Signals.tsx` | 812 | card renderer / group logic / summary pill |

Plus: **B-4 — consolidate `MetaResponse` into `packages/core`** (currently
duplicated `apps/api/src/meta.ts:22-43` ↔ `apps/web/src/lib/api.ts:102-123`
with tests keeping them synced). Pure zod, no platform deps — core is its
natural home; api and web both already depend on core. Delete the twins
after the import switch; the parity tests become real single-source tests.

**Do NOT touch** (deliberate, documented): `packages/core/src/schemas.ts`
export-reorg (the KV storage-compatibility surface is sacred); the i18n
copy corpora (`insights-copy-en/fa.ts` — data files by nature; a split
churns ~900 manifest entries for zero gain).

---

## WS-5 — The ESLint advisory worklist (D-17's 34 warnings)

The full list regenerates with `pnpm run lint` (0 errors expected). Split
by file (2026-10-15 census):

```
8 Converter.tsx        6 Settle.tsx          3 Insights.tsx (route)
3 Together.tsx         2 QuestionGroup.tsx   2 LiveRates.tsx
2 History.tsx          2 use-alert-eval      2 PairsTable.tsx
2 TrendChart.tsx       2 Signals.tsx         2 DetailsPanel.tsx
2 AboutTheData.tsx     2 Odometer.tsx        2 LiveRateLine.tsx
2 AlertsDialog.tsx     1 BatchConverter.tsx  1 useDialogFocus.ts
```

Rule mix: mostly `set-state-in-effect` (the designed localStorage
hydration shape), `exhaustive-deps`/memo-dependencies, a few refs/purity/
compilation-skipped notices.

Approach (this is behavior-adjacent — the reason it was deferred):
1. Per component, write the characterization test FIRST (C-9's jsdom env
   where DOM behavior is involved; pure-logic extraction otherwise).
2. Refactor the hydration effect to the lint-clean shape (lazy
   `useState` initializer reading localStorage once, or an effect that
   guards + settles — keep the visible behavior byte-identical:
   same first paint, same persistence, same RTL/theme flash rules).
3. One component per commit; full gates; budget check.
4. Target: promote the rules to ERROR in `eslint.config.mjs` once zero
   warnings remain (the D-17 overrule path Ali was offered).
If any component proves behavior-risky, leave it at warn with a D-entry —
honest beats lint-perfect.

---

## WS-6 — Owner-decision option papers (NO behavior change without approval)

Write each as a short section in `docs/DECISIONS_FOR_ALI.md` (D-19+ draft
rows marked "awaiting Ali") with evidence and a recommendation:

1. **D-08 follow-up** — R7 "Mostly a euro story" fired 0 times in 10 y
   (basket maths: EUR 57.6% weight). Options: (a) keep (honest rarity),
   (b) lower `R7_DOLLAR_QUIET`, (c) lighter EUR weight — (b)/(c) change
   the dollar measure's meaning; recommend (a) unless Ali wants the card
   to ever show.
2. **D-09 follow-up** — R5 fires 15.3% of weeks (spec usefulness bar 15%).
   Options: keep / tighten `R5_USDCNY_M3_WEAK`+`R5_AUDUSD_M3_FALL` to
   ±2.5. Evidence replay exists in the insights evidence file.
3. **A-11 tightening option** — `/api/convert` deliberately accepts exotic
   `Number()` forms (`0x10`→16 etc., pinned by contract tests). Tightening
   to a decimal regex is a behavior change (some links/tools would 400);
   default keep.

---

## Owner-side actions (NOT agent work — checklist for Ali)

- [ ] **Rotate all three tokens** (GitHub / Cloudflare / EODHD) — they
      have transited chat in ≥4 sessions, most recently 2026-10-15.
- [ ] Telegram ingest-alert secrets (the alerting code is ready; the
      secrets are owner-created — recipe in DEPLOY.md).
- [ ] I7 launch-approval exit gate: review BACKTEST.md.
- [ ] Signals-wording legal read (S3 — qualified AU financial-services
      review) before relying on the signals copy.
- [ ] Connection-evidence confirmations (tags currently "to verify").

## Definition of Done (next session)

Every undertaken WS item: fixed/tested/split with gates green, D-19+
entries for all judgment calls, conventional commits pushed with CI green
between them, CHANGELOG entry per phase, PROGRESS row, deploy per
docs/DEPLOY.md (both workers when code changed), live browser verification
(EN+FA, desktop + 375px, zero console errors, cache + freshness chains
intact), and a final done-vs-left summary. Untaken items: declined with a
D-entry — that is a valid outcome; honesty over completionism.
