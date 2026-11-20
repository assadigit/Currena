# Gold Page Redesign — Decision Log

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Purpose.** Cross-session decision record for the Gold UX redesign program (9 sessions, `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md`). The master strategy document is the **product source of truth**; this log records implementation decisions, discoveries, and deviations *within* the sessions so later sessions can stay consistent without rewriting product decisions. Never record credentials here.

**Status legend:** ✅ decided (within standing authority) · ⏳ pending owner approval · ℹ️ recorded fact/constraint.

---

## Session 1 — Current-state audit (2026-11-20)

### S1-D1 — Session scope held to read-only audit ✅
No code, no production behavior, no financial-model surface was changed. Deliverables are `docs/gold-redesign/01…04`, `baseline-screenshots/`, and this log. Nothing deployed (docs-only session; the master plan's audit session has no deployable output). *Authority: master plan §10 Session 1 "Mode: read-only reconnaissance"; assignment §4 "audit-only … do not create unnecessary application deployments."*

### S1-D2 — Deployment/source verification method ℹ️
Live production (Workers deploy `62bdfc10`, version `5c34a14b` per the BD-S43 CHANGELOG record) verified equal to `main` @ `884f2696` by **byte-comparison** of three built assets (`GoldPage-DB-tAujX.js`, `index-BqnATyD-.js`, `index-BYs2IdzG.css` — `cmp` clean against a fresh `pnpm --filter @currena/web build`). No drift. All audit findings therefore describe both the live page and the source. The D-43 deploy-lock re-check pattern was followed read-only. Cloudflare + GitHub credentials were used for verification, not stored.

### S1-D3 — Branch and push convention for the program ✅
Session work lands on `docs/gold-redesign-s1-audit` (this session) and is merged to `main` by fast-forward (no force), matching the repo's established session-close pattern. Deployment is **not** triggered by merges (CI runs gates only; deploys are manual). *Authority: assignment §3 (owner explicitly authorizes commits/pushes this invocation) over the master plan's generic §9.6 boundary; AGENTS.md §5 standing approval.*

### S1-D4 — Audit evidence set ℹ️
31 baseline screenshots (`baseline-screenshots/README.md` itemizes them): en/fa × desktop-1440/mobile-390 full-page + focused sections, dark-mode pair, six expanded interaction states. DOM audits (duplicate ids, seat impacts, lane sides, section inventory, overflow check) run live. VLM visual reviews cross-checked against DOM/source before any claim entered the audit. Console and page errors: zero in every captured state.

### S1-D5 — Key factual findings carried into Session 2 (details in `01-current-state-audit.md` §6) ℹ️
- F-01 balance verdict rendered at summary strength 6 ways (DUP-2).
- F-02 the 7-state "Conditions outlook" is the balance re-worded (GB-S5 same-engine contract) — **no forward-looking outlook methodology exists**; the strategy's outlook block must be designed fresh, never by relabelling the balance.
- F-03 no in-page navigation exists.
- F-04 37 always-visible seat chips (17 steady today).
- F-05/F-06 CFTC ×4, price ×3, real-yield ×4 surfaces.
- F-07 duplicate DOM ids `gold-zone-d` + `bal-*` (live-verified).
- F-09 GoldPage budget headroom ~1.1 kB raw of 240,000.
- F-14 silver's full card rides the gold page (scope question).

### S1-D6 — Items explicitly NOT decided in Session 1 ⏳
The following are recorded as open, with the session that must resolve them:
1. Outlook method, horizons, and the fate of the "Conditions outlook: Bearish" wording — **Session 2, owner approval required before implementation** (touches presentation of model outputs; §9.3).
2. Silver's canonical home on /gold — **Session 2, owner decision** (shipped feature).
3. GoldPage chunk budget strategy (grow-with-justification vs split) — **Session 4/5**, explicit decision required (recorded gate).
4. Any change to protected model surfaces — none proposed; any future proposal requires evidence + owner approval first.

### S1-D7 — Verification gaps declared (honesty per AGENTS.md §1) ℹ️
Tablet-width captures, full keyboard/SR passes, reduced-motion, and forced stale/outage states were NOT exercised in Session 1; the audit states this explicitly (`01-current-state-audit.md` §2) and defers them to Session 8 per the master plan. No claim of testing them is made anywhere.

### S1-D8 — Master spec treated as immutable product truth ✅
Per the owner's standing instruction, no product decision in `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` was rewritten, reinterpreted, or "updated" by this session. Where the audit found friction between the current page and the spec (e.g. hero priority, outlook separation), the finding was recorded as evidence for the design sessions — the spec's decisions stand.

---

## Owner-decision pointers (external, unchanged)

- The 28-question interview table + rounds 2–3 confirmations: master plan §2–§2.2 (locked).
- Audience assumption ("majority are investors, not analysts") stays a design assumption, never a published statistic (master plan §2.2 end).
- Standing owner-side levers (WGC drops, PBoC revival, EODHD upgrade, credential rotation): `docs/specs/gold-page-elevation/s18/02-PROGRAM-CLOSURE-RECORD.md` §3 — unchanged by this program unless the owner says otherwise.

---

## Session 3 — Indicator taxonomy and bilingual explanation system (2026-11-2x)

### S3-D1 — Session-2 deliverables absent; derivation protocol adopted ✅ (with the discrepancy flagged to the owner)
The assignment's reading list references `05-product-principles-and-visitor-journey.md`, `06-final-information-architecture.md`, `07-canonical-placement-and-deduplication-plan.md` and DECISION_LOG entries S2-D1..S2-D15. **None exist** — not on `main` (tip `8890690a` = the S1 closeout), any `origin/*` branch, or any PR (verified by `git ls-remote`, a `git cat-file -e` sweep of every remote ref, and the GitHub PR list). Session 2 was never executed or never pushed. Rather than halt (Session 3's inputs — the indicator set, polarity, thresholds, units, the §5 content requirements — all exist in live sources), this session **derived the needed S2 inputs from the authoritative sources**: the 68-row canonical set from the S1 CSV + `gold-score.ts` (the set the prompt itself describes reconciles exactly), the five-group labels finalized per master plan decision 9's direction, and the twelve-chapter hierarchy taken as the master plan §4's own twelve sections. Every derivation is flagged (08 §2.1's derivation note; per-record placement wording references current surfaces so a future Session 2 supersedes placement wording only, never indicator facts). *The owner should decide whether to run Session 2 as planned (recommended — its architecture work is untouched by this session) or treat this session's derivations as its partial substitute.*

### S3-D2 — The canonical 68-row set confirmed from the live sources (no drift) ✅
37 voters (7/7/11/10/2 by lane — `GOLD_LANE_VOTERS` read directly, ids and polarity verified one by one) + 11 non-voter present readings + 4 licence-blocked absentees + 16 modules = 68 rows, exactly the S1 CSV's row set. The AGENTS.md §A "54 voting" header is the insights-wide registry count, not the gold page's — no drift between CSV, engine, and live DOM. 52 unique indicators carry full records; 16 modules carry the reduced module record. *Authority: master plan Session 3 task 1; the engine is the source of truth.*

### S3-D3 — Deliverable form: markdown content-of-record, integration at Session 5 ✅
The fa/en explanations live in `docs/gold-redesign/09-indicator-explanations-fa-en.md` keyed by canonical id — NOT in the runtime dictionaries. Reasons: (a) Session 3 must not implement the page (assignment mode); (b) fa strings in `apps/web/src/**` are copy-audit-gated and would fail `pnpm copy:audit` untriaged; (c) Session 5's integration is designed as one mechanical pass (08 §9's integration contract) through the manifest round. The records are authored to the workflow's standards now (native voice, no em dashes — verified by a fa-line scan; glossary terms; Persian digits in static text).

### S3-D4 — The five-group label system finalized (proposed finals; runtime at Session 5) ✅
`borrowing-costs` → "Interest rates & borrowing costs" / «نرخ بهره و هزینهٔ استقراض» · `dollar` → "The US dollar" / «دلار آمریکا» · `stress` → "Market stress & uncertainty" / «تنش و عدم قطعیت بازار» · `inflation` → "Inflation & inflation expectations" / «تورم و انتظارات تورمی» · `flows` → "Trader positioning & flows" / «پوزیشن معامله‌گران و جریان‌ها». The engine lane ids are untouched (protected); each label keeps the shipped corpus's semantic family while adding the plain-language anchor decision 9 asks for; one-line intros drafted both locales. Label wording ships only through Session 5's manifest round.

### S3-D5 — fa labels reuse the shipped corpus names as the base ✅
Every `voterNames`/`cardNames` fa wording is kept as the label base; the records' plain-label improvements are additive (e.g. «بازده واقعی ۱۰ساله (خالص از تورم)» adds the parenthetical to the shipped «بازده واقعی اوراق قرضه» family). No shipped string is changed in this session (runtime untouched).

### S3-D6 — Persian terminology additions recorded for the future manifest round ✅
New terms this session introduces are recorded in `docs/localization/persian-terminology.md` (the five-group labels; the five outlook-state drafts; the evidence-consistency words; the horizon labels) so Session 5's manifest triage has its reference. No manifest change this session (no runtime string touched; `pnpm copy:audit` is not required for a docs-only change and was not run — stated honestly).

### S3-D7 — The outlook vocabulary is drafted for owner review, nothing decided for runtime ⏳
The five states («شرایط به‌شدت از طلا حمایت می‌کند» … «فشار قوی بر طلا»), the evidence-consistency words («شواهد عمدتاً هم‌جهت‌اند / مختلط‌اند / محدودند»), and the horizon labels («در ۱ تا ۲ هفتهٔ پیش رو» …) are review drafts in 08 §8, per the master plan §2.1 locked semantics. The fate of the "Conditions outlook: Bearish" line remains **owner-approval item Q1** (S1-D6): the engine's 7-state classifier is protected (§9.3, GB-S5); only its presentation wording can change, and the genuine forward-looking briefing must be designed fresh, never by relabelling. Silver's own labels ride DUP-6's owner decision.

### S3-D8 — The relationship taxonomy and its honesty rules ✅
Four evidence classes (M mechanism / C observed correlation / X conditional / K causal-with-evidence, deliberately rare) + standing rules (no universal one-way claims; correlation ≠ causation; regime flags explicit; charts only where coverage is verified; the meter's own no-edge record as the standing anchor). 24 records included (R-01…R-16, R-19…R-27), 8 candidate claims **excluded with documented reasons** (gold-predicts-inflation, ratio-predicts-recessions, next-day GPR direction, short-run M2, VIX-causes, positioning-as-momentum, CB-guarantee, consensus-as-signal), 3 blocked on data/licence. Ids R-17/R-18 retired-reserved (two drafts merged into R-05/R-22; the ids never reused to avoid dangling references).

### S3-D9 — Analogy policy executed selectively ✅
9 of 52 indicators carry an everyday analogy (real-yield mattress-vs-savings, USD/JPY credit card, STLFSI blood-pressure, VIX fire insurance, gold/silver bunker-vs-pickup, breadth parade, 5y5y weather-vs-climate, M2 tickets, CFTC boat) — every one materially clarifies its mechanism and names its limits where that matters. Every other record states its omission reason (mostly: a family analogy already covers the channel). Per owner decision 19/§2.1: selective, never forced, never childish.

### S3-D10 — The blocked quartet gets would-show records, never data-shaped placeholders ✅
Each blocked indicator carries a full record explaining what it would show, why it matters (both locales), the specific block reason (licence / dead source / no clean venue), and the owner lever — so the publication-notes disclosure can explain rather than merely list. The records' rise/fall/visual fields are marked blocked (cannot render as data); the coverage report counts them complete against the blocked contract.

### S3-D11 — Session scope held; verification method ✅
No code, no runtime copy, no financial-model surface, no data source, no ingestion, no provider request, no production behavior changed (docs-only; `git status` carries only `docs/` + the bookkeeping files). Verification: the row-set reconciliation against `gold-score.ts` + the CSV (S3-D2), the fa em-dash scan (clean; the remaining em dashes are inside EN prose on mixed lines — permitted), the coverage report's field-by-field audit (52/52 + 16/16), and the polarity check (every record's rise/fall wording read against the engine's polarity table). Full gates (`pnpm gates`) were not run: no package code changed, and the suite does not exercise markdown deliverables — recorded honestly per AGENTS.md §1.

### S3-D12 — Coverage report rides inside 09 (numbering preserved) ✅
The explanation coverage report is 09 §7 rather than a standalone file: Session 4's deliverables are already numbered 11/12 in the master plan, and a standalone file would either collide or fragment the set. The report audits the complete-field contract (08 §3.5) for all 52 indicators + 16 modules and declares the honest gaps (Q1–Q4 dependencies, Session-5 integration, placement wording).
