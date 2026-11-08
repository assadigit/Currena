# DECISIONS — Currena decision log (add-only)

> The universal `AGENTS.md` §8 decision log: date, decision, options
> considered, reason, who decided, when to revisit. **Add entries at the
> top; never rewrite history.** This file starts at 2026-11-08 when the
> universal rules were adopted — the project's FULL historical decision
> records predate it and stay authoritative where they live:
> `docs/page-division/03-STRATEGY-LOG.md` (D-1…D-48, the owner's
> three-round strategy record + the session log),
> `docs/specs/gold-meter-gapfill/` (the gap-fill program's decisions
> A–K, rounds 1–3), and the per-session delivery records in
> `docs/page-division/01-SESSION-ROADMAP.md`.

## 2026-11-08 — BD-S4a: the Global ribbon's day change rides the live-prices contract (`change1d`)

- **Decision:** D-22's "day change" is implemented as an optional,
  additive `change1d` on the live-prices entry (and the merged
  `IndicatorReading`): the live hourly quote vs the **previous
  session's close** — the last daily series point strictly before the
  quote's own bar. The ribbon displays it with a visible window tag
  (`1d`) and falls back to the labelled 7-day change until the stored
  prices key carries the field (the deployed :13 cron rung).
- **Options considered:** (a) keep the labelled 7-day change (S3's
  honest stopgap); (b) wire the history endpoint client-side (3 extra
  full-series fetches on the landing page); (c) extend the live-prices
  contract. **Reason for (c):** the true day change must measure the
  LIVE value the ribbon displays — a closes-only pair from the history
  endpoint would not correspond to it — and only the live-quote writer
  holds the daily series next to the live price. (b) was rejected
  against the lean-landing-page discipline (D-11's spirit) and for
  weighing ~3 × full-series payloads to read one number. The window is
  always visibly labelled (D-48's colour+label discipline extended to
  changes: a bare percent never rides without its window).
- **Who decided:** the build session (S4), under the roadmap's recorded
  "S4's call, never a silent guess". **Revisit:** if the owner prefers
  zero contract surface, (a) remains a one-line revert in the ribbon;
  ratification welcome, nothing blocking.

## 2026-11-08 — BD-S4b: the Global narrator line renders the narrator's text VERBATIM + an "Updated" stamp

- **Decision:** the D-24 one-liner shows the narrator artefact's overall
  text exactly as stored — never edited, never sentence-suppressed
  (including the template fallback's trailing "not financial advice"
  sentence, which reads oddly in a one-liner but is the narrator's own
  words) — and gains the legacy Insights block's "Updated {time}" stamp
  (same-day → "today") so the visitor can see WHEN the line was written.
- **Options considered:** (i) verbatim + stamp (chosen); (ii) suppress
  the trailing disclaimer sentence for the one-liner; (iii) rewrite the
  narrator's template. **Reason:** the narrator's text is its contract
  ("never edit the narrator's own text" — the session's scope note); a
  display layer that silently drops a not-financial-advice reminder is a
  compliance-adjacent risk; the stamp answers the real complaint (the
  line's freshness was invisible) without touching the words.
- **Who decided:** the build session (S4). **Revisit:** if the owner
  wants the one-liner trimmed, the narrator's own template
  (`packages/insights/src/narrator/template.ts`) is the right lever — an
  engine-side change with its own gates, never a display-side hack.

## 2026-11-08 — The 2026-11-08c deploy (Phase A live)

- **Decision:** deploy the S2+S3+S4 change set to production
  (version `637db8f8`) at the close of S4.
- **Reason:** the owner's session prompt delegated the timing ("the
  Worker deploy when you choose — the S2 endpoints + the S3 page sit
  ready"), the universal AGENTS.md §5 grants standing approval with
  verify-after rules, all gates were green (suite 14,730), the §21
  backtest had run 84/84 green over real KV, and S4 is the
  verification session — the natural moment the landing page goes live.
  Live-verified after (the backtest re-run against production, both
  widths, the legacy surfaces intact). Rollback: `wrangler rollback`.
- **Who decided:** the build session (S4) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-08c.

## 2026-11-08 — BD-S5a: the Gold page's cached-copy header (one honest sentence, not a doubled date)

- **Decision:** when the Gold page renders the LAST GOOD cached copy
  (M-17), the `fromCache` sentence ("Showing the last good copy — data
  as of {date}") REPLACES the plain data-as-of line in the page header
  instead of rendering beside it.
- **Reason:** the sentence carries its own date, so printing both read
  as a garbled duplicate ("Data as of Nov 8, 2026 · Showing the last
  good copy — data as of Nov 8, 2026" — flagged by the S5 dark-mode VLM
  pass; geometry proved no overlap, just the redundant double date).
  Same information, one honest sentence. The Global landing page keeps
  the S4 pattern (both lines) until S19's navigation/polish pass aligns
  it — recorded here so the alignment is a deliberate choice, never a
  silent drift.
- **Who decided:** the build session (S5). **Revisit:** S19 (or any
  earlier polish round) should align Global's header to the same rule;
  the change is two lines in `GlobalPage.tsx`.

## 2026-11-08 — The 2026-11-08d deploy (the Gold page live)

- **Decision:** deploy the S5 change set to production (version
  `f2e74f3c`) at the close of S5, although the session prompt marked
  the deploy optional ("S6's close may ship it").
- **Reason:** the owner's standing delegation ("the Worker deploy when
  you choose" + AGENTS.md §5), every gate green INCLUDING the live §21
  seat-level diff (150/150 against production, run before the deploy),
  and shipping now gives the owner the Gold page to review between
  sessions — S6's close can re-ship after its own gates at zero cost.
  Live-verified after (the backtest re-run against production 150/150,
  `/gold` at both widths, the Global + legacy surfaces intact).
  Rollback: `wrangler rollback`.
- **Who decided:** the build session (S5) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-08d.
