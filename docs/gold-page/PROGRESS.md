# PROGRESS — the Currena gold page additive programme

Checkpoint: branch `gold-page-additions` created 2026-11-27 from `main` @ db71c97a.
Hard rule: ADD ONLY — existing lines are never changed or removed; the only
edits to existing files are minimal mount insertions, proved by `git diff` per
phase (additions only).

## Session 1 (2026-11-27)

- [x] Safety checkpoint: branch `gold-page-additions` (db71c97a).
- [x] STEP A audit: full section-by-section read of the page, all 18
      gold-page components, the site chrome, the content library, all
      /api/gold routes, lib engines, prisma schema, watch workers,
      tools pages. AUDIT.md written.
- [x] STEP B plan: PLAN.md written (4 phases, Must-first).
- [x] STEP C Phase 1: Beginner FAQ + glossary + sources & honesty band
      SHIPPED (record below).
- [x] Verified in browser: EN + fa (RTL), desktop 1280px + mobile 375px,
      dark mode, details rows open/close, cross-link anchor jumps, nav
      chips scroll to the bands, copy-link with honest failure fallback,
      no horizontal overflow on 375px, no console/page errors.
      `bun run lint` clean. Additive diff proved: page.tsx +15 lines / 0
      removed / 0 changed; everything else new files only; db/custom.db
      restored to the checkpoint bytes after the earlier failed-sync
      writes (dev now runs on a copy at /tmp/currena-dev.db).
- [x] Committed on gold-page-additions: "Gold page: Phase 1 — beginner
      FAQ, glossary, sources & honesty band (additive)".

### Phase 1 record (shipped, 2026-11-27)

- New: `src/components/gold-page/faq.tsx` — FaqBand (id `gold-faq`):
  10 beginner Q&As as `<details>` rows (numbered badges, one-line
  answers, "See the section" anchor links to gold-balance, gold-bridge,
  gold-history, gold-dollar-trend, gold-sources) + 12-term mini
  glossary grid (troy ounce, mesghal, karat, حباب, spot, free dollar,
  اجرت, seller profit, VAT, gold fund, bar, coin) + "last reviewed"
  stamp (2026-11-27, localized date words).
- New: `src/components/gold-page/sources.tsx` — SourcesBand (id
  `gold-sources`): 11 named sources (EODHD, FRED, Yahoo Finance, TGJU,
  Trading Economics, WGC, LBMA, IMF, CFTC, US Federal Reserve, Currena
  rates) each with a home link, what it feeds, and a non-wrapping
  refresh badge; 4 honesty rules (stamps, fail-closed, labeled machine
  translations, cited historical bases); the page-level not-investment-
  advice disclaimer in the gold box; share row (navigator.share with
  clipboard fallback, "copied" confirm, honest failure line when the
  clipboard is refused).
- New assets: `public/icons/gold-faq-question-mark.png`,
  `public/icons/gold-sources-magnifier.png` — generated in the pack
  style (250×250 transparent PNG, edge flood-fill background removal,
  palette-quantized to pack-like sizes, VLM-verified).
- Plug-in edits to `src/app/page.tsx` (insertions only): 2 imports, 2
  nav chips (FAQ/«پرسش‌ها», Sources/«منابع» between gold-calculator and
  gold-relationships, matching page order), 2 mounts between
  PhysicalBand and RelationshipsBand.
- No globals.css edit, no content.ts edit, no data changes.

## Current status

- Phase 1: SHIPPED (2026-11-27).
- Next: Phase 2 — the buying guide (see PLAN.md).

## Assumptions (decided, not asked)

1. The repo at /home/z/currena is the source of truth; deployed worker
   behaviour matches it (redeploy is the owner's act — no deploy secrets used
   for deploys in this session; deployment to currena.ir is NOT part of the
   additive work unless asked).
2. Working files live in this repo under docs/gold-page/.
3. New sections mount between PhysicalBand and RelationshipsBand because the
   repo's own comments record the owner's asks: the map is "the page's closing
   view" and history is "the page's very last section".
4. New sections' copy lives inside the new component files (content.ts is
   existing code — untouched).
5. Nav chips for new sections are inserted into NAV_SECTIONS (one line each)
   — treated as the minimal mount insertion for navigation; no existing chip
   moves.
6. Static educational facts carry a visible "last reviewed" date; numbers
   inside FAQ/glossary come only from the repo's own engines/constants
   (coin-premium.ts specs, tools invoice convention 7/7/9 VAT-on-اجرت+سود,
   troy ounce 31.1034768 g, mesghal 4.6083 g, 18k=750, 24k=999.9).
7. "Common allocation ~5–10% of a portfolio" is presented as a widely-cited
   convention in education wording, never advice (Phase 3; sources: WGC and
   major advisers' public guidance — wording kept generic).
8. The sandbox dev server must be started with
   `DATABASE_URL="file:/tmp/currena-dev.db" EODHD_TOKEN=… bun run dev`
   (a COPY of db/custom.db outside the watched tree) because: (a) the
   sandbox shell exports a conflicting DATABASE_URL pointing at
   /home/z/my-project/db/custom.db which Next.js will not override, and
   (b) when the day's EODHD sync cannot land a live row (rate-limited
   today, 2026-11-27), every /api/gold request re-runs the failed sync
   and upserts SourceSync rows — rewriting db/custom.db inside the dev
   watcher's tree, which turbopack treats as a file change and reloads
   the page, a self-sustaining reload loop. Running on the copy keeps
   the desk-of-record db byte-stable (it was restored to the checkpoint
   bytes after the first runs). Production (D1, no file watcher) is
   unaffected.

## BLOCKED items

- ETF holdings driver (checklist 4): R-26 is `blocked: true` in
  relationships.ts (licensing); no free reliable holdings feed wired into the
  desk today. Stays a legend-only record unless the owner supplies a source.

## Needs my approval (existing problems found — NOT fixed, by rule)

1. **Hero spot vs Tehran board ounce can disagree by days.** The hero price
   card rides the EODHD observation store (once-per-UTC-day sync; on
   rate-limited days it serves the last sync, stamped "data as of"), while
   the Iran bridge board's own ounce row rides the live TGJU snapshot
   (fetchedAt minutes old). Today in the sandbox: hero 3532.83 (2026-11-22)
   vs board ounce 3643.59 (2026-11-27). Both are honestly stamped, but a
   reader comparing them sees different numbers. Fixing it would change the
   existing price card or bridge board — needs your approval.
2. **No buy/sell (dealer) spread on the Tehran board** — one market price per
   instrument plus day high/low; TGJU's snapshot carries p_min/p_max upstream
   that the board does not show. Adding it edits the existing bridge board —
   needs your approval.
3. **The Market Brief's verdict text is hand-authored per batch** (no date
   stamp on it): it can read stale between batches even while every number
   around it updates. A dated "last reviewed" line on the brief, or wiring
   its verdict to the live outlook classifier, would touch existing code —
   needs your approval.
4. **The failed-sync reload loop in sandbox dev**: when EODHD cannot land a
   live row for the day, every /api/gold request re-runs the failed sync and
   re-upserts SourceSync rows (db write per request). In sandbox dev that
   write lands in db/custom.db inside the watcher tree → page reload loop
   (observed 2026-11-27; mitigated locally by running dev on a db copy).
   Production Worker + D1 is unaffected (no file watcher). A code fix
   (e.g. backing off failed syncs within the day, or ignoring the db file in
   the watcher) edits existing sync code — needs your approval.
5. **The gold page body links to no tool page** — fixed additively in Phase 4
   via a new strip, but the deeper option (in-content links inside existing
   sections like the calculator) would edit existing copy — left as is.
6. **Two unmounted legacy component sets** (components/gold/* AURUM desk,
   ifbought.tsx, timemachine.tsx) ride the repo unused. Removal is a deletion
   — forbidden by the additive rule; listed for your decision.

## Session log

- S1 (2026-11-27): audit → plan → Phase 1 shipped (FAQ + glossary + sources
  band + share row, 2 new pack-style icons, additive proof clean). Phases
  2–4 remain; final review after Phase 4.
