# AGENT_HANDOFF — Currena gap-closure S6 (FINAL — program complete)

> The six-session gap-closure program is COMPLETE (37/37 milestones,
> 2026-11-03). This handoff is the recovery record for the ONE remaining
> execution: the push + deploy of the S6 closing commits, which the
> closing session could not perform (no credentials). Read together with
> `docs/gap-closure/PROGRESS.md` (the authoritative log — the S6 sixth
> claim note + the owner action items) and
> `docs/gap-closure/CASE-STUDY.md` (the program summary).
> Never record credentials here.

## A. The one remaining task (for a credentialed session)

1. `cd /home/z/currena && git push origin main` — the local `main`
   carries `3b5b879` (M6.3) · `4b6e8c2` (M6.4) · `c06b42a` (M6.5) + the
   M6.6 close, all gates-green (14,508 tests). Last pushed: `879639d`.
2. Deploy: `pnpm deploy` (the api worker — the M6.3 definitions/licences/
   validation ride it) + the web app (`pnpm --filter @currena/web build`
   + the worker sites deploy, per DEPLOY.md). The markets worker is
   UNCHANGED by S6-M6.3+ (no redeploy needed).
3. The readings land via the armed paths (either is sufficient):
   - the **04:20 UTC rung-2 bootstrap** (GHA scheduled, repo-secret
     auth): the stage carries no `usd-reserve-share` /
     `sp500-breadth-ratio` entries → it arms, fetches, patches, writes;
     the **04:10 main rung** derives `btp-bund-spread` once the Italy
     leg rides the OECD bulk group. NOTE: the same 04:20 bootstrap also
     owns the **M6.2 China readings' landing** (china-property-investment
     + china-steel-output, still honestly `unavailable` on production).
   - or expedite: `pnpm --filter @currena/insights rung2-run --cofer
     --breadth` (+ `--nbs` if the China landing is still pending) and
     the main phase (or `--bootstrap`) for the spread.
4. Browser-verify on production: the three M6.3 cards in their lanes
   (the dollar lane's foot / market-stress / borrowing) in EN + fa —
   the M6.5 local stack already verified the exact render (evidence/
   M6.5/), so this is the production confirmation pass.
5. Record the verified lines under M6.3/M6.2 in PROGRESS.md and clear
   the owner action item.

## B. What the S6 close produced (all local, gates-green)

- **M6.3** (`3b5b879`): usd-reserve-share (IMF COFER) + sp500-breadth-
  ratio (Yahoo RSP/SPY) + btp-bund-spread (FRED mirrors, zero new
  fetches) — registry 161, fa round-75, every provider answer verified
  twice, CHANGELOG §2026-11-02j.
- **M6.4** (`4b6e8c2`): the promotion PROPOSAL — `docs/gap-closure/
  PROMOTION-PROPOSAL.md` + the reproducible harness/evidence in
  `evidence/M6.4/`. cfnai + ebp proposed; NOTHING promoted (G-5); the
  owner's approval is the open decision.
- **M6.5** (`c06b42a`): the final quality pass — caught + fixed the
  missing DOLLAR_STRENGTH_IDS row; 22 screenshots (EN/fa × 360/768/1200,
  0px overflow); a11y verified; the free-tier audit final
  (crons 5/5 full, ~89 KV writes/day).
- **M6.6** (the final commit): AGENTS.md §A/§B + INDICATORS_AND_DATA_
  SOURCES.md + MAINTENANCE.md refreshed; CASE-STUDY.md written;
  PROGRESS.md final (37/37, 100%); the owner action items updated.

## C. The standing constraints (unchanged)

G-3 (never remove/hide), G-5 (nothing scores without the owner's
approval), provider-exact numbers only, fail-closed parsers,
credentials only from the environment and never printed, the full
`pnpm gates` before every push, the CHANGELOG heading-count discipline,
the fa copy-audit flow (next round: 76), the parallel-session protocol
(pull --rebase before committing).

## D. Git state

- Local `main` = the M6.6 close commit on top of `c06b42a` (all
  gates-green). **Not pushed** (no GitHub token in the closing
  sessions' environments).
- Production: api `ecd3ff63` + markets `58c4eebd` (the M6.1/M6.2
  state); production serves 158 readings; the three M6.3 ids land
  after the push + rungs.
- The backup of the M6.3 working tree (pre-commit) lives at
  `/home/z/my-project/currena-backup/` (now redundant — everything is
  committed).
