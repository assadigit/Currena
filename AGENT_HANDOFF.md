# AGENT_HANDOFF — Currena: the gold balance consolidation program (GB-S3 delivered, deploy pending)

> The ACTIVE program is the owner's **gold balance consolidation**
> (`docs/specs/gold-balance-consolidation/`, session plan GB-S1..GB-S7 in
> its `PROMPTS.md`; PROGRESS.md is the authoritative log). The gap-closure
> program is CLOSED (2026-11-03d; its record: `docs/gap-closure/`).
> Never record credentials here.

## A. Original objective

GB-S3: **P2a — the consolidated gold balance behind the preview flag
`?balance=lanes`** (the authoritative task text: the GB-S3 prompt in
`docs/specs/gold-balance-consolidation/PROMPTS.md`). DONE — see C.

## B. Requirements and decisions (binding, unchanged)

- D-GB-9: the frozen files are never edited (gold-score.ts, goldSummary,
  GoldSummarySchema, snapshot.ts, apps/api/**, the harness tables).
- The default view is byte-stable until the owner-gated P5/GB-S6 flip
  (proven + pinned by the legacy vitest snapshot).
- `GOLD_LANE_MIN_FIRING = 2` — never re-litigate. No edge claimed, ever.
- Full `pnpm gates` before every push; self-merge when the exit gate
  holds; deploy only when the built worker changes (it DID this phase).

## C. Completed work (GB-S3, all verified this session)

- **Branch `gold-balance/p2-ui`, PR #16 (draft), code commit `71dede7`
  pushed.** The lane view: BalanceScale's optional
  members/split/tally/note + subtitle/contextLine/measuredNote slots
  (additive; geometry/animation/beam untouched); MergedCard's lane
  drivers from `goldBalance(readings)`; the split badge; the member
  detail panel; the context line; the measured note →
  BACKTEST-GOLD-LANES.md; the flag threaded Insights → Signals → card.
- The default view PROVEN byte-identical (main-vs-new render diff on the
  2026-10-31 fixture) and pinned (the repo's first vitest snapshot).
- 19 tests (04 §4.3 items 1-7, 9, 11-13); fa round-76 (17 strings,
  copy:audit clean); 10 VLM-verified screenshots in
  `docs/specs/gold-balance-consolidation/evidence/gb-s3/`.
- Gates ALL 9 GREEN 14,582; Insights chunk 1533.15/354.25, ceiling
  re-based 1540/355.5 (justified in scripts/check-bundle-budget.mjs).
- Records: PROGRESS.md (F tick + session log), CHANGELOG
  [2026-11-03i] (count 191 verified), AGENTS.md paragraph, the GB-S4
  prompt rewrite, the GB-S3 lesson.

## D. Remaining work (in order)

1. **Commit the records** (`docs(gold-balance P2): …`) + push the branch.
2. **Merge PR #16** (the exit gate holds: component tests green,
   copy:audit clean, screenshots attached, default view byte-stable).
3. **Deploy per docs/DEPLOY.md** (deploy-lock check, `pnpm deploy`,
   version verification, smoke test) — the built worker changed.
4. **Browser-verify on production**: the flag view AND the default view,
   EN + fa, 360 + 1280, FRESH browser contexts (the PWA service worker
   serves the previous chunk to returning visitors), zero console errors.
5. Mark PR #16 ready + merge; verify CI green on main; update this
   handoff + PROGRESS with the merge SHA + deploy version.
6. Print the GB-S4 prompt (PROMPTS.md has it rewritten) + a 5-line
   summary as the session's closing report.

## E. Problems and considerations

- The playwright config's second webServer (wrangler dev) fails without
  CLOUDFLARE_API_TOKEN — satisfy its :8799 health check with a dummy
  server started in the SAME shell call (reuseExistingServer skips it).
- The visual fixture overlay (the 2026-10-31 gold data on
  apps/web/visual/fixtures/snapshot.json) is a ONE-OFF: restore the file
  with git checkout after the screenshot run (it is tracked).
- MultiEdit is atomic per call but CAN apply earlier edits before
  failing a later one — re-verify with grep after any failed MultiEdit.
- The session-supplied Cloudflare/GitHub credentials live ONLY in the
  shell env / remote URL; never in files, commits, logs or this handoff.

## F. Git and deployment state

- origin/main = `801cc02` (the GB-S2 merge, PR #15). Branch
  `gold-balance/p2-ui` pushed at `71dede7` + the records commit (this
  push). PR #16 draft open. Production: currena-api `115eb1e5`,
  currena-markets `58c4eebd` — BOTH about to be superseded by the P2
  deploy (currena-api only; markets is code-unchanged and stays).
- GitHub auth: the owner's token sits in the remote URL (never printed).

## G. Next action

D.1 — commit the records and push; then merge PR #16, deploy, verify
production, and close the session with the GB-S4 prompt printed.
