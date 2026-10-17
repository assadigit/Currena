# Evidence — 2026-10-20 · the "Know before you buy US shares" box removed (the owner's direct request)

The owner pasted the exact rendered `<details>` element (fa:
«پیش از خرید سهام آمریکا بدانید») with one instruction: **"Remove this
entirely."** The block was `UsSharesNotesBox` (Step 3 §7.1, runbook Phase 4,
2026-10-16) rendered unconditionally on the Insights page between the world
markets and world currencies sections.

## What changed (surgical, UI-only)

- `apps/web/src/routes/insights-sections/UsSharesNotes.tsx` — the
  `UsSharesNotesBox` component deleted; the file now carries only
  `UsSharesAudBox` (the L2-03 AUD view — a DIFFERENT box, untouched) and a
  dated note that the details box was removed at the owner's request.
- `apps/web/src/routes/Insights.tsx` — the `<UsSharesNotesBox copy={copy} />`
  render and its import removed; the section comment updated (the removal is
  dated so nobody "helpfully" resurrects it).
- `apps/web/src/i18n/insights-copy-en.ts` + `insights-copy-fa.ts` — the four
  copy keys retired (`usSharesBoxTitle`, `usSharesFxLine`, `usSharesFeesLine`,
  `usSharesDisclaimer`) with their comments; en↔fa parity intact.
- `docs/localization/persian-copy-manifest.json` — the four matching entries
  pruned (REMOVED findings fail `pnpm copy:audit`; parity keeps the audit
  clean).

Nothing else moved: no data, scoring, projection, or behaviour change. The
details box was copy-only and rendered in BOTH site modes.

## Gates (all green)

- `pnpm copy:audit` — ✓ clean (no NEW/CHANGED/REMOVED findings).
- `pnpm test` — all workspace suites green; web **461/461** (34 files).
- `pnpm typecheck` — 6/6 packages.
- `pnpm lint` — **0 errors** (15 accepted advisories, pre-existing).
- `pnpm --filter @currena/web build` + `check-bundle-budget.mjs` — all held:
  entry 295.15 kB / 88.76 gz (budgets 296 / 89.5); Insights lazy
  **592.61 / 141.14** gz (budgets 604 / 142.8) — the chunk SHRANK (was
  594.68 / 141.60 after 2026-10-19f).

## Deploy + production verification

- Deployed currena-api **`e6d18811-46ae-4f27-890a-6a1f63b90cd1`** (SITE_MODE=public
  untouched; currena-markets untouched `9b5ff7e0`).
- Production home 200; served entry `assets/index-DMIAshTW.js`
  (sha256 `d33ca2bf…`, byte-identical to the local build); served Insights
  chunk `assets/Insights-CvxT_7lu.js` — **592,611 bytes, byte-identical to
  the local build**.
- `prod-Insights-chunk.js` grep: `usSharesBoxTitle|Know before you buy US
  shares` → **0 occurrences** (the box and its copy are gone from the served
  bundle); the prices-board icon map (`brent|gold-usd|btc-usd`) still present.
- `/api/insights` → 200, **32 readings** (unchanged from the 2026-10-19e
  restore), the four price tiles (`brent · gold-usd · silver-usd · btc-usd`)
  all present — the owner's dedicated prices section is untouched.

## Files

- `prod-status.txt` — home status + served entry name + sha256 + chunk greps.
- `prod-Insights-chunk.js.txt` — the served lazy chunk (immutable capture;
  stored as `.txt` so ESLint never lints the minified capture — sha256
  `0725fcdd1b51fdcee2947072ee0b32313af3080c62e212fe1f449762350ff183`).
- `api-after.json` / `api-after-summary.json` — the public projection after
  the removal (32 readings; four price tiles present).
