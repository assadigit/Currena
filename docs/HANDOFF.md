# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## THIS SESSION'S GOAL (S6 — in progress, written before coding 2026-11-08)

The owner's in-session request + the S6 gates:

1. **M1 (the owner's ask):** the PREVIOUS shape of the gold balance — the
   brass assay-office stage (beam, dial, column, hangers, bowl pans with
   the five lane weights + the not-leaning tray) — on `/gold`, ALTERNATED
   with the S5 minimal beam glyph (a view switcher in the hero), rendered
   SMALLER (stage capped at 480px → the s-size metrics). Decision BD-S6a
   in `docs/DECISIONS.md`.
2. **M2 (the S6 gate):** the frozen-scenario suite — the recorded corpus
   windows drive the page renderer (gold-tiles) and pin meter counts,
   lane votes, beam, outlook byte-identical to the frozen harness's own
   arithmetic (extend `gold-backtest-core.ts` + the offline test).
3. **M3–M4:** mobile + ARIA pass on the changed hero (keyboard walk,
   both widths en+fa, dark mode), full gates, browser verification.
4. **M5:** records + push + re-deploy (code changed → the owner's
   standing applies) + live acceptance + hand-off for Phase C (S7).


## Current state (2026-11-08, after page-division S5)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Session 5/30 delivered & gated —
  Phase B (Gold) OPEN: the Gold page is REAL and LIVE.** Progress: S1
  scaffold & navigation · S2 data layer + `PLACEMENT.generated.md` · S3
  the Global landing page (D-21) · S4 the gates & polish (Phase A
  CLOSED) · **S5 the Gold page build (D-26…D-29: the hero — live gold
  price + Balance Scale verdict + 7-state outlook + counts; the 37 seats
  in five lanes with lean + evidence + placement-derived home links; the
  D-27 context cards; the four blocked ids as honest §16 notes; the
  honest-record footnote) — the §21 seat-level diff 150/150 green against
  production TWICE, and the VLM pass's two finds (the seat-chip
  truncation, the doubled cached-date header — BD-S5a) fixed.**
- **DEPLOYED & LIVE** (`f2e74f3c`, 2026-11-08 ~12:27 UTC): the Gold
  page at **https://currena.ir/gold** for every visitor — the 37-voter
  conditions meter over the live projection (the same engines the
  Global tile reads; the live balance: 2 for · 1 against · 2 not
  leaning, outlook Bullish). The Global landing page and the legacy
  `/insights` are intact. The live acceptance record:
  `docs/DEPLOY.md` 2026-11-08d.
- **Gates (last full run):** ALL GREEN — secret scan 8/930 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · **suite 14,786** · build + budgets held (entry
  269.00/81.45 · Insights 1569.16/362.08 · GlobalPage 24.26/6.21
  untouched · GoldPage 26.25/6.88 vs 30/9).

## Next session (S6 — the Gold gates)

Read `docs/AGENT-RULES.md` (now also AGENTS.md §14) + `AGENTS.md` first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S6 entry + the S5
delivery record), `02-PAGE-DIVISION-SPEC.md` §5 + §21, and the S5
hand-off prompt (the end of this session's report). Scope: the
verdict-consistency backtest byte-identical (meter counts, lane votes,
beam, outlook — the S5 core `gold-backtest-core.ts` already carries the
seat-level half; S6 adds the frozen-scenario suite re-run against the
page renderer) → the full mobile + ARIA pass → the hand-off.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + **BD-S5a** (the Gold
   page's cached-copy header replaces the plain data-as-of line instead
   of doubling the date; Global's header keeps the S4 pattern until
   S19) — all recorded, none blocking.
4. Triage the queued unreviewed fa strings (now ~369: 236 + the 133 new
   `pd.gold.*` strings in `docs/localization/persian-copy-manifest.json`
   — the corpus-mirroring ones are byte-pinned by
   `gold-copy-pin.test.ts`, the fresh S5 wording awaits review).
5. The external investor's review of the spec (§19) — Phase 3's input.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50). A snapshot stored after the
  last :50 rung leaves the narrator one state behind until the next rung
  — honest, self-healing, and the page's "Updated" stamp says so.
- The `change1d` ribbon day change is LIVE (Brent +0.03% `1d` · Bitcoin
  +0.06% `1d` observed at the first post-deploy :13 rung). Gold keeps
  its labelled 7-day change while its gold-api.com EOD print stays
  fresher than the Yahoo bar — the merge's never-rewind guard,
  per-asset honest. The Gold hero follows the same BD-S4a discipline.
- The Gold page's seat chips link to the seat's home page per the
  placement table (`homePageOfIndicator`) — the three voters whose home
  card is the Gold page itself (gold-silver · the CFTC pair) link to the
  in-page `#gold-context` anchor; the dollar voters → `/currencies`, the
  euro pair → `/europe`, gpr-daily → `/world-markets`, the rest → `/usa`
  (their pages build S7+).
- The rollback lever for the 2026-11-08d deploy: `wrangler rollback` —
  the Global + legacy surfaces were byte-identical before it; `/gold`
  was the placeholder there.
