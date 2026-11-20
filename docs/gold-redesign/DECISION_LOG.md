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
