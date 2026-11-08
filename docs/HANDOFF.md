# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-08, after page-division S4)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Session 4/30 delivered & gated —
  Phase A (Foundations) CLOSED.** Progress: S1 scaffold & navigation ·
  S2 data layer + `PLACEMENT.generated.md` (184 ids + 6 boards, 0
  unplaced / 0 duplicate homes) · S3 the Global landing page (the D-21
  ten-tile verdict board) · S4 the gates & polish (the §21
  verdict-consistency backtest 84/84 green over real KV AND against
  production twice; BD-S4a the `change1d` day change; BD-S4b the
  narrator discipline; six pass defects found + fixed — the sixth, the
  M-17 boards fix, found by the closing verification pass and shipped
  live by the re-deploy).
- **DEPLOYED & LIVE** (`b1cfa4fe`, 2026-11-08 ~05:00 UTC — the first cut
  `637db8f8` ~04:36 + the closing pass's M-17 boards re-deploy): the S2
  projection endpoints (`/api/insights/pages[/:page]`), the S3 Global
  landing page at `/`, the S4 polish, and the `change1d` live-prices
  writer (the ribbon's day change appears at the first :13 cron rung
  post-deploy). The live acceptance record: `docs/DEPLOY.md`
  2026-11-08c. Legacy `/insights` intact with the deprecation banner.
- **Gates (last full run):** ALL GREEN — secret scan 8/919 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · **suite 14,731** · build + budgets held (entry
  268.69/81.33 · Insights 1588.36/367.98 · GlobalPage 33.51/9.82 vs
  36/11).

## Next session (S5 — the Gold page build)

Read `AGENTS.md` first (the owner working rules are consolidated in §14; original archived at `docs/AGENT-RULES.md`), then
`docs/page-division/01-SESSION-ROADMAP.md` (the S5 entry + the S4
delivery record), `02-PAGE-DIVISION-SPEC.md` §5 + §21, and the S4
hand-off prompt (the end of this session's report). Scope: the hero
(live gold price + Balance Scale + 7-state outlook + counts) → the 37
seats in five lanes (D-26) → context cards (D-27) → the honest-record
footnote. Gate: seat-level diff vs `/api/insights` = exact match.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement).
3. Ratify or redirect BD-S3a/b/c (the chip dots mirror real verdicts
   only · the gauge-tile links · the 2-col mobile board) and BD-S4a/b
   (the change1d day change · the narrator verbatim + stamp) — none
   blocking, all recorded in the roadmap session records.
4. Triage the queued unreviewed fa strings (now ~237 in
   `docs/localization/persian-copy-manifest.json`).
5. The external investor's review of the spec (§19) — Phase 3's input.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50). A snapshot stored after the
  last :50 rung leaves the narrator one state behind until the next rung
  — honest, self-healing, and the page's "Updated" stamp says so.
- The `change1d` ribbon day change is LIVE (observed at the first :13
  rung post-deploy: Brent +0.03% `1d` · Bitcoin +0.06% `1d`). Gold keeps
  its labelled 7-day change while its gold-api.com EOD print stays
  fresher than the Yahoo bar — the merge's never-rewind guard, per-asset
  honest.
- The boards' last-good discipline (M-17) now matches the projection's:
  a failed markets/fx refresh keeps the cached copy on screen, labelled
  with the board's own stored date ("Last good copy · {date}") — the
  S4 closing pass found and fixed the collapse (the tiles used to fall
  to their unread states while good data sat in the cache).>>>>>>> 4c8d6ee (docs: the change1d go-live OBSERVED — the first :13 rung post-deploy wrote the field (brent +0.03% 1d · btc +0.06% 1d live on the ribbon; gold keeps its labelled 7-day change by the merge's never-rewind guard, its gold-api.com EOD print fresher than the Yahoo bar — the per-asset fallback BD-S4a built))
- The rollback lever for the 2026-11-08c deploy: `wrangler rollback` —
  the legacy surfaces were byte-identical before it; the new routes are
  additive.
