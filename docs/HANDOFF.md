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
  verdict-consistency backtest 84/84 green over real KV; BD-S4a the
  `change1d` day change; BD-S4b the narrator discipline; five pass
  defects found + fixed).
- **DEPLOYED & LIVE** (`637db8f8`, 2026-11-08 ~04:36 UTC): the S2
  projection endpoints (`/api/insights/pages[/:page]`), the S3 Global
  landing page at `/`, the S4 polish, and the `change1d` live-prices
  writer (the ribbon's day change appears at the first :13 cron rung
  post-deploy). The live acceptance record: `docs/DEPLOY.md`
  2026-11-08c. Legacy `/insights` intact with the deprecation banner.
- **Gates (last full run):** ALL GREEN — secret scan 8/917 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · **suite 14,730** · build + budgets held (entry
  268.69/81.33 · Insights 1588.36/367.98 · GlobalPage 32.76/9.63 vs
  36/11).

## Next session (S5 — the Gold page build)

Read `AGENT-RULES.md` + `AGENTS.md` first, then
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
- The `change1d` ribbon day change lights up when the stored
  `insights:prices-live:v1` key first carries the field (the deployed
  writer's next run). Until then the labelled 7-day change shows.
- The rollback lever for the 2026-11-08c deploy: `wrangler rollback` —
  the legacy surfaces were byte-identical before it; the new routes are
  additive.
