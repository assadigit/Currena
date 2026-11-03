# AGENT_HANDOFF — Currena: the gold balance consolidation program (GB-S4 branch READY TO MERGE)

> The ACTIVE program is the owner's **gold balance consolidation**
> (`docs/specs/gold-balance-consolidation/`, session plan GB-S1..GB-S7 in
> its `PROMPTS.md`; PROGRESS.md is the authoritative log). The gap-closure
> program is CLOSED (2026-11-03d; its record: `docs/gap-closure/`).
> Never record credentials here.

## A. The delivered state (GB-S4 built + verified locally 2026-11-04; the merge/deploy steps below)

1. **GB-S3 (P2) is COMPLETE and LIVE**: PR #16 merged as `0bba57a`
   (code `71dede7` + records `0e68597`); CI green on main; **currena-api
   `1bfc88c5` @ 100%** (deploy-lock checked first; the record in
   docs/DEPLOY.md's [2026-11-03i] session note). The consolidated lane
   balance is previewable at **https://currena.ir/insights?balance=lanes**
   — the DEFAULT view renders byte-for-byte today's page (proven by a
   main-vs-new render diff, pinned by the legacy vitest snapshot).
2. Browser-verified on production, fresh contexts, zero console errors,
   both 360 + 1280, EN + fa: the flag view (today's data: LEVEL · 4
   neutral · borrowing-costs split 2v2 — the badge, the tallies, the
   context line, the measured note, the detail-panel interaction with
   the tilt phrase + the B-12 row) and the default view (the wind +
   model-vs-reality panels, the legacy chips, the legacy subtitle).
3. **Independently RE-VERIFIED 2026-11-04 by a fresh recovery session**
   (no repo state changed by it): CI `gates` green on both `0bba57a`
   and main HEAD; the Cloudflare API confirms currena-api serves
   `1bfc88c5` @ 100% (deployment `aad8fbce`, 2026-11-03T17:00:46Z);
   the deployed index chunk references `Insights-ptsctHOq.js` (1,533,148
   bytes raw — the measured 1533.15 kB); a live production browser pass
   re-confirmed the flag view EN + fa (the 4 lane chips, «دوپاره» +
   "2 for, 2 against", the context line −5.24%, the measured note →
   BACKTEST-GOLD-LANES.md, the detail panel's member groups + the
   "expectations fading" tilt phrase + the B-12 "Normal" row, RTL, no
   wind words in the gold card, no 360 overflow, zero console errors)
   and the default view's legacy rendering; locally re-run: the 19
   component tests, the 15 engine tests, copy:audit clean, and the
   bundle budget check all green ("All bundle budgets held").
4. Gates at merge: **ALL 9 GREEN — 14,582 tests** (web 12,623 ·
   insights 1,285); copy:audit clean (fa **round-76**, 17 strings);
   Insights lazy chunk 1533.15/354.25 (ceiling 1540/355.5, justified);
   CHANGELOG [2026-11-03i] (heading count 191 verified).

## B. What is deliberately left open (the owner's decisions — not tasks)

- The owner's live read of the preview (the Split badge OI-2, the
  calm-stress semantic 02 §4.1) before the P5/GB-S6 flip.
- OI-1 (the Outlook sentences) — GB-S5 (P3+P4), fa round-78 (round-77 was GB-S4's).
- The credential rotation (the session-supplied tokens were pasted in
  chat — rotate per the standing owner action item).

## C. The standing constraints (unchanged)

D-GB-9 (the frozen files), no edge claimed ever, full `pnpm gates`
before every push, the byte-stable default until the owner-gated flip,
fa copy-audit flow (next: round-78), the parallel-session protocol
(pull --rebase before committing).

## D. Git + deployment state

- origin/main = `f6f1fdd` at the session's start; the work sits on the
  branch `gold-balance/p2b-visual` (PR #17, draft with the 48-shot
  evidence set): code commit (BalanceScale dispatcher + BalanceWeight +
  balance-visual.css + MergedCard flag wiring + the copy ×2 + round-77 +
  the rewritten 28-test suite + the gb-s4 Playwright project + the
  budget re-base) + the records commit (PROGRESS/CHANGELOG/AGENTS/
  PROMPTS). Gates at push: ALL 9 GREEN — 14,591 tests (web 12,632);
  copy:audit clean (fa round-77, 19 keys + the «، » separator);
  Insights lazy 1553.13/359.32 (ceiling 1565/360, justified); the
  gb-s4 suite 81/81 green (V-1..V-10, evidence/gb-s4/).
- Remaining for THIS session (the owner's incremental-merge
  instruction): merge PR #17 when CI is green → deploy-lock check →
  `wrangler deploy` → production browser-verify the flag view AND the
  default view (fresh contexts, EN + fa, 360 + 1280, zero console
  errors) → the delivery-record commit (PROGRESS's merge SHA + deploy +
  verification lines, DEPLOY.md's session note, this handoff finalized).
- The next session is **GB-S5 (P3 + P4 — the Outlook derivation + the
  copy close)**: the rewritten prompt is in PROMPTS.md (the exact
  component state, the fa round, the bundle numbers, the harness
  patterns).

## E. Next action (a new session)

Read PROMPTS.md's GB-S5 prompt (rewritten with the exact shipped
state) + PROGRESS.md's GB-S4 session log; branch
`gold-balance/p3-outlook`; the session spec is 01-SPEC.md §5.2 +
03-UX-AND-COPY.md §6 + 04 §4.2. The preview for the owner's eyes:
https://currena.ir/insights?balance=lanes (now the 05 visual).
