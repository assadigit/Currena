# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-08, after page-division S6)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase B (Gold) CLOSED: Session
  6/30 delivered & gated.** Progress: S1 scaffold & navigation · S2
  data layer + `PLACEMENT.generated.md` · S3 the Global landing page
  (D-21) · S4 the gates & polish (Phase A CLOSED) · S5 the Gold page
  build (the 37-voter conditions meter) · **S6 the Gold gates + THE
  OWNER'S ALTERNATION (BD-S6a): `/gold`'s hero now carries BOTH balance
  designs — the previous brass shape (the stage + lane weights + tray,
  capped at 480px, the classic view, the DEFAULT) and the S5 minimal
  beam glyph — through a real radio group, the choice persisted; plus
  the frozen-scenario suite (the §21 standard over the recorded
  corpus's 19 windows, page ≡ frozen harness on counts, lane votes,
  beam, verdict, outlook) and the mobile/ARIA pass.**
- **DEPLOYED & LIVE** (`327c7761`, 2026-11-08 ~14:55 UTC): the
  alternation is live at **https://currena.ir/gold** — the classic
  brass balance greets every visitor by default, one radio tap away
  from the minimal glyph. The live acceptance: `docs/DEPLOY.md`
  2026-11-08e (the §21 backtest re-run against production 150/150
  green post-deploy; Global + legacy surfaces intact).
- **Gates (last full run):** ALL GREEN — secret scan 8/932 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (7,140 entries) · narrator in sync +
  eval 50 · layer1 11,819/11,819 · **suite 14,799** · build + budgets
  held (entry 269.00/81.45 · Insights 1569.16/362.08 UNTOUCHED through
  the BalanceStage extraction · GlobalPage 24.26/6.21 untouched ·
  GoldPage 31.23/8.06 vs its re-based 34/9 row).

## Next session (S7 — the World Markets build, Phase C)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S7 entry + the S6
delivery record), `02-PAGE-DIVISION-SPEC.md` §6 + §21, and this file.
Scope (S7): reuse the existing world-index map as the hero (D-43) ·
the Asia/Europe/Americas region grids (16 indexes with full metrics) ·
the world risk & liquidity section (9 cards). Gates: 16 indexes render
with full metrics; map dots interactive; EODHD primary / Yahoo fallback
behaves fail-closed. S8 follows with the regional zoom maps + gates.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a (all recorded,
   none blocking) — and now **BD-S6a** (the alternation's shape: the
   classic view as the default + the 480px cap; flipping either is a
   one-line change if you prefer the minimal default or a bigger
   drawing).
4. Triage the queued unreviewed fa strings (now ~391: 369 + the 22 new
   S6 keys in `docs/localization/persian-copy-manifest.json` — 19 of
   the new ones are byte-pinned to the corpus by
   `gold-copy-pin.test.ts`, the 3 view words + the S5 fresh wording
   await review).
5. The external investor's review of the spec (§19) — Phase 3's input.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50). A snapshot stored after the
  last :50 rung leaves the narrator one state behind until the next rung
  — honest, self-healing, and the page's "Updated" stamp says so.
- The Gold page's hero ALTERNATES (BD-S6a): the classic view (the
  previous brass balance, smaller — the s-size metrics at a 480px cap)
  is the default; the minimal glyph is one radio away; the choice
  persists per visitor (`currena:pd:gold:balance-view`). The two views
  share ONE drawing with the legacy card (`BalanceStage`/`BalanceTray`,
  extracted S6 — the legacy `/insights` card renders byte-identically)
  and ONE verdict (the engine's words render in both views).
- The Gold page's seat chips link to the seat's home page per the
  placement table (`homePageOfIndicator`) — the three voters whose home
  card is the Gold page itself (gold-silver · the CFTC pair) link to the
  in-page `#gold-context` anchor; the dollar voters → `/currencies`, the
  euro pair → `/europe`, gpr-daily → `/world-markets`, the rest → `/usa`
  (their pages build S7+).
- The rollback lever for the 2026-11-08e deploy: `wrangler rollback` —
  the Global + legacy surfaces were byte-identical before it; `/gold`
  would return to the S5 minimal-only hero.
