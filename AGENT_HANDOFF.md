# AGENT_HANDOFF — Currena gap-closure S6 (continuation)

> Working state record for the S6 session chain. Read together with
> `docs/gap-closure/PROGRESS.md` (the authoritative milestone log) and
> `docs/gap-closure/S6-links-promotion-polish.md` (the spec).
> Never record credentials here.

## A. Original objective

Execute S6 (M6.1→M6.6) of the gap-closure program on `main` of
`assadigit/Currena`: NZ link (evidence first), China property/steel,
de-dollarization/concentration, shadow review + promotion **proposal**
(stop for owner approval — G-5), final quality pass, final docs/case
study/credential hygiene. Measurement-only language; never remove or hide
any existing indicator (G-3); fail-closed parsers; provider-exact numbers
only; credentials only from the environment, never printed.

## B. Requirements and decisions

- All S1–S5 standing rules apply (`docs/gap-closure/00-OPERATING-RULES.md`).
- G-5: new scoring memberships only after M6.4 owner approval — everything
  new lands context-only.
- CHANGELOG discipline: same-day continuation → `## [2026-11-02h]` style
  next letter (check the file's latest heading first); count headings
  before/after.
- fa copy: next round is **round-75** (73 = M6.1, 74 = M6.2); audit flow
  `pnpm copy:audit` → review → `pnpm copy:audit:update --ids ... --status
  processed --round 75 --reference ...`; no em dashes in fa.
- Parallel-session protocol: `git pull --rebase origin main` before every
  commit; re-read PROGRESS.md; additive-union conflict resolution.
- Gold Program files are off-limits (gold-score.ts, gold-backtest-*,
  docs/insights/*GOLD*).
- Push/deploy/KV-write/GHA-dispatch require GitHub + Cloudflare tokens.

## C. Completed work (as of this handoff)

- **M6.1 DONE** (commits `4b638dd`…`3439887`): NZ link measured + included;
  audnzd/nz-10y/nz-short-rate + NZX 50 board rider; deployed api
  `c81f65c8` + markets `58c4eebd`; browser-verified EN/fa; ticked in
  PROGRESS.md.
- **M6.2 DONE** (commits `309adba` + `9a595a2`): China property/steel
  parsers + fixture pinning + rung2 21st–25th window + connection card;
  deployed api `ecd3ff63`; the readings' KV landing was blocked by the
  account-wide KV write cap (resets 00:00 UTC) — see E below.
- **M6.3 IN PROGRESS — uncommitted working tree** (inherited from the lost
  fifth session; ~1,214 insertions across 42 files): all three indicators
  defined (`usd-reserve-share` COFER quarterly Saturday gate,
  `sp500-breadth-ratio` Yahoo RSP/SPY daily, `btp-bund-spread` FRED OECD
  mirror derived), adapters `cofer.ts` + `breadth.ts` + tests + fixtures,
  rung2 plan flags `--cofer`/`--breadth`, sources/licences/T-16/registry/
  display/layer1/i18n EN+fa diffs present, VERIFIED-SOURCES rows DONE,
  bundle budget bumped. Completeness/gates NOT yet verified by this session.

## D. Current state

- HEAD `879639d` (the fifth continuation claim, pushed 22:57 UTC
  2026-11-02). Branch `main`, up to date with origin at last check.
- Working tree: the M6.3 changes above, uncommitted.
- Production: api `ecd3ff63` + markets `58c4eebd` live;
  `/api/insights` 158 readings @ generatedAt 2026-11-02T17:20:46Z;
  china-property-investment/china-steel-output/nz-short-rate honestly
  `unavailable` (landings pending — see E).
- Baseline gates at the fifth session's claim: **14,257 tests green**;
  Insights lazy 1502.19/346.42 vs the (working-tree-bumped) 1510/347
  ceiling.

## E. Remaining work (in order)

1. **M6.2 landing note**: the manual 00:07 UTC `rung2-run --nbs` lever
   could not fire from the sixth session (no Cloudflare token). The
   designed fallback — the **04:20 UTC rung-2 bootstrap** (GHA scheduled,
   repo-secret auth, stage carries no China entries → arms by design) —
   owns the landing. Record under M6.2 in PROGRESS.md; verify after 04:20
   UTC if the session is alive.
2. **M6.3 completion**: verify working-tree completeness, live-verify the
   three parsers from the sandbox, run `pnpm gates`, fa copy audit
   (round-75), CHANGELOG `2026-11-02h` (or next letter — check the file),
   commit `gap(S6-M6.3)`.
3. **M6.4**: read `docs/insights/BACKTEST.md` + `BACKTEST-GOLD.md`;
   evaluate shadow candidates with enough history (frozen thresholds, no
   lookahead, sample sizes, base rates); write
   `docs/gap-closure/PROMOTION-PROPOSAL.md`; commit; **stop for owner
   approval — execute no promotions** (record as an open owner action
   item).
4. **M6.5**: copy audit clean; a11y sweep of new components; screenshots
   360/768/1200 EN+fa (local build is acceptable, honestly labelled, if
   production deploy is blocked); bundle budget; free-tier audit;
   data-health review (public GHA API + `/api/insights/status`); fix +
   record.
5. **M6.6**: refresh AGENTS.md §A/§B, INDICATORS_AND_DATA_SOURCES.md,
   MAINTENANCE.md, CHANGELOG; write `docs/gap-closure/CASE-STUDY.md`;
   final PROGRESS.md (every box ticked or honestly blocked; gap coverage;
   overall %); credential hygiene (owner rotation confirmation — top open
   action item); next-steps note; FINAL summary. No next-session prompt.

## F. Problems and considerations

- **THIS SESSION (sixth) HAS NO CREDENTIALS.** The continuation message's
  credential section arrived empty; the environment carries no
  GH_TOKEN/CLOUDFLARE_API_TOKEN/ACCOUNT_ID (checked by presence only;
  values never printed). Consequences: **git push, wrangler deploy, KV
  REST writes, GHA dispatches are all blocked.** All work proceeds
  locally and is committed; the push/deploy/landing recipe is documented.
  Do NOT treat missing credentials as a reason to stop local work.
- The KV daily write cap was exhausted 2026-11-02 (second occurrence);
  resets 00:00 UTC. Budget dispatches carefully on any credentialed
  future session.
- OECD sdmx intermittent HTTP-500 class from GHA (nz-short-rate's
  honest-red face) — retries on the next rung2 phase by design.
- Verification traps (a)–(l) from the S6 brief still apply — fresh browser
  contexts, Persian-digit regexes, expand hidden rows before grepping,
  REST (not CLI) for KV reads, no buy/sell/hold wording from the first
  draft.

## G. Git and deployment status

- Local `main` == `879639d` + the uncommitted M6.3 tree (this session will
  commit M6.3/M6.4/M6.5/M6.6 work locally as it completes).
- **Push blocked** (no GitHub token). Last pushed: `879639d` (22:57 UTC
  2026-11-02). CI on it: green at last check (the fifth session's gates
  run).
- Deploys: api `ecd3ff63` (M6.2 close) + markets `58c4eebd` (M6.1) are
  the live versions; nothing since. M6.3's worker/web deploy is pending
  credentials.

## H. Next action

Verify the M6.3 working tree is complete (step E.2): read the remaining
diffs (i18n fa round, display.ts, layer1, fred-copyright, licences,
sources, registry, RUNGS), run the full `pnpm gates`, then live-verify the
three parsers from the sandbox, run the fa copy audit, write the CHANGELOG
entry, and commit `gap(S6-M6.3)` locally. Then M6.4 (the proposal + stop).
