# GOLD_RECHECK_SPEC — the owner's reminder: re-check + re-backtest the gold table (after a while)

Written at the S6 close (2026-10-31, post-deploy) so a future session —
the day after tomorrow, next month, or next quarter — can re-check the
Gold Program and re-run the backtest over a grown corpus without
reconstructing context from scratch. **This file is the procedure
home**: the automated 2026-11-02 one-shot (§2) and every later manual
re-check (§3) follow the same steps. Keep it current — every re-run
updates §1's state-of-record line and appends its numbers to §5's
baseline table.

Companion files, in read order: `AGENTS.md` (the rules) → this file →
`GOLD_SCORE_SPEC.md` §2.1 (the 21-voter contract) →
`GOLD_BACKTEST_SPEC.md` §5 (the session-by-session measured record) →
`BACKTEST-GOLD.md` (the generated report, rewrites on every run).

## 0. Session starter (paste into the future session)

> Gold Program re-check + re-backtest. Read `AGENTS.md`, then
> `docs/insights/GOLD_RECHECK_SPEC.md` — that file IS the procedure
> (§3 the commands, §4 the watch, §5 the baselines, §6 the escalation
> rules). The repo is `assadigit/Currena` (public; anonymous clone
> works); `main` should be at or past `4e480b9` (the S6 deploy record).
> Start at §3 step 1. Read-only KV only; no voter-table, threshold, or
> production-code changes without a dedicated gated session; no edge
> claims — the round-55 measured-reality note stays the operative
> description until a re-run says otherwise.

## 1. The state of record (updated every re-run — this is what "now" was)

- **2026-10-31 ~16:07 UTC — the S6 close (this file's birth).**
  Production: currena-api version `21ca25ab` at 100% — the 21-voter
  table (breakeven-tilt, inflation lane, level-leg only) computes in
  production; the Insights lazy chunk byte-identical to the build.
  Live reading at the close: netScore −2 / headwind / 6 of 21 firing
  (the tilt silent at −0.24, its 21.7th percentile — mid-range).
  The corpus-of-record: `packages/insights/fixtures/
  gold-backtest-corpus.json` (recordedAt 2026-10-31T15:17:40Z, 16
  archive days 2026-10-15 → 10-31, 10-20 absent — the known outage
  day). The S6 baselines live in §5 below. The asOf-watch (§4) was
  open at day 1; days 2–3 ride the 2026-11-02 re-check.

## 2. The near-term armed check (2026-11-02 04:30 UTC — one-shot)

An automated one-shot is armed in the owner's session tooling for
**2026-11-02 04:30 UTC** (after that day's ingest rung — main rung
~04:10 UTC, archive + stage written ~04:20 UTC; the GitHub Action's
schedule is 04:20 UTC). It carries: (A) the asOf-watch days 2–3 verdict
(§4) + (B) the grown-corpus C5 refresh (§3) over the promoted table.
Its record lands in `GOLD_BACKTEST_SPEC.md` §5 + a CHANGELOG entry
`[2026-11-02a]`.

**If it fired early** (before ~04:25 UTC): the rungs have not landed —
report that and do nothing else. **If it never fired / was missed:**
re-arm per §8 with the same 04:30 UTC shape, or run §3 manually —
the procedure is identical, only the corpus has more days.

## 3. The re-check + re-backtest procedure (the "after a while" path)

Timed for whenever: every new day adds one `insights:archive:v1:*`
key, each worth ~2 gold trading days of backtest windows. A re-run a
month later is a materially better test than a re-run tomorrow; there
is no such thing as "too late" — §1 just gets a new line.

- **Step 1 — the live check (no credentials; always first):**
  `curl -s https://currena.ir/api/insights` must carry `goldSummary`
  (expect `netScore` −5…+5, `label`, `firingVoters`, the lane
  breakdown) and the `breakeven-tilt` reading (asOf, percentile10y).
  `curl -s https://currena.ir/api/health` must answer `ok:true`.
  Record both verbatim — they are the re-run's "today" anchors.
- **Step 2 — credentials (read-only KV; the critical gate):** the
  corpus dump needs `CLOUDFLARE_API_TOKEN` (Workers KV Storage: Read
  is enough — it is read-only) + `CLOUDFLARE_ACCOUNT_ID=
  5f123468027e4b2094167df1d2f2e852` in the environment. **Test a REAL
  KV read, not /user/tokens/verify** (verify reports active while KV
  can still be denied):
  `GET https://api.cloudflare.com/client/v4/accounts/<acct>/storage/kv/namespaces/4627ac33a4b148ff9fc2189266b1890e/keys?prefix=insights%3Aarchive%3Av1%3A&limit=5`
  — 200 with keys = good; 401/403 = stop and report honestly which
  scope is missing. Never guess, never claim a verdict without it.
- **Step 3 — the corpus dump (read-only, 0 KV writes):**
  `corepack pnpm --filter @currena/insights gold-corpus-dump`
  (run in the repo root; rewrites the committed fixture). Sanity-
  check the output: the archive-day count should be ≈ the days since
  2026-10-15 (10-20 absent) — e.g. a 2026-11-02 run expects ~18.
  An unexplained missing day is a finding: record it, do not paper
  over it.
- **Step 4 — the backtest run (offline; reads only the fixture):**
  `corepack pnpm --filter @currena/insights gold-backtest`
  — the PROMOTED 21-voter table is the primary; the S4-frozen
  20-voter table rides as the lineage baseline (the promotion-delta
  section). `docs/insights/BACKTEST-GOLD.md` regenerates from the
  run — commit it.
- **Step 5 — compare against §5's baselines:** the honest frame is
  deltas, never softening. Expected drift: windows grow (~2 per new
  gold trading day), sign-agreements wander within a few points, the
  tilt's fire-rate stays in the ~40–50% band. Say which engine
  stamped the new archives' `goldSummary` — every rung after
  2026-10-31 16:07 UTC is the PROMOTED engine (`21ca25ab`+); before
  is the S4-frozen one (the stamped-vs-rederived no-drift contract
  is itself a check: GOLD_BACKTEST_SPEC §5 Session 6).
- **Step 6 — the watch (§4) if any new archive days carry it:** pull
  the trio + decade-group asOf rows for the new days; a verdict is
  only claimable from the archive values (the live API serves the
  current snapshot only).
- **Step 7 — record + ship:** update §1 (a new state-of-record line)
  + §5 (a new baseline row) here; `GOLD_BACKTEST_SPEC.md` §5 gains a
  short dated note; a CHANGELOG entry. Gates before committing:
  `corepack pnpm copy:audit` + `node scripts/secret-scan.mjs` +
  `corepack pnpm --filter @currena/insights exec vitest run
  src/gold-backtest-core.test.ts src/gold-score.test.ts` (and the
  full `pnpm gates` if anything beyond docs/fixtures moved). Commit
  style: `docs(gold-program): the <date> re-check — <one-line
  verdict>`. Push; report honestly if the push is blocked.

## 4. The asOf-watch question (carried from D-4; verdict rules)

The gold trio (`us10y`, `us30y`, `real-yield-10y`) updates one
trading day behind the decade group (`t5yie`, `T5YIFR`) at the same
rung — the constant 1-trade-date offset that is the D-4 cross-fill
split's known shape. **The watch guards against it WIDENING to 2.**
For each new archive day: extract the five readings' `asOf` + status.
- **Lockstep** (both groups advance together, offset stays 1 —
  including both HOLDING over a weekend): the watch closes as
  **validated-by-watch** — the honest wording; still not "proven".
- **Divergence** (the trio falls a day further behind at the same
  rung): **escalate to the owner with the measured rows; make NO
  code change** — the cross-fill does NOT silently extend to the
  trio. Weekends are not divergence: 10-31 was a Saturday, 11-01 a
  Sunday — both groups holding is expected lockstep.

## 5. The comparison baselines (every re-run appends a row)

| Run | Corpus | Windows | 5/20/60td sign-agreements | Tilt fired | Notes |
|---|---|---|---|---|---|
| S4 (frozen 20-voter) | 16 days, recorded 10-31 12:34Z | 2,514 | 51.7 / 46.9 / 43.9% | — | the pre-promotion baseline |
| S6 (promoted 21-voter) | 16 days, recorded 10-31 15:17Z | 2,514 | 52.1 / 47.6 / 43.9% | 1,174 (46.7%) | label flips 256 (10.2%); mature-base 46.9/42.3/32.6%, spreads +0.02/−0.22/−1.94 — the 5td sits just INSIDE the 2-SE band → "no measurable edge" either way (the S4 "runs the other way" wording softens); 20td/60td still depart below 50% |

**The standing honest note** (round-55, on the panel in EN + fa): the
table's lean showed no positive association with gold's next 5–60
days — it reads conditions, not direction. No re-run may soften this
without the stated-in-advance rule firing the OTHER way (2-SE
departure + sign-consistent spread, direction stated).

## 6. What counts as a material change (the escalation rules)

Re-checks REPORT; they do not decide. Escalate to the owner, with
numbers, before any change, if a re-run shows:
1. **A sign-agreement crossing 50% with a sign-consistent spread on
   any horizon** (the stated-in-advance edge rule — either
   direction);
2. **The asOf-watch diverging** (§4 — the trio's offset widening);
3. **The tilt's fire-rate leaving the ~40–50% band** or its
   percentile distribution shifting materially (the promotion's
   premise was B4's 46.7%);
4. **Archive days going missing** beyond the known 10-20 outage, or
   the stamped-vs-rederived `goldSummary` disagreeing (the no-drift
   contract);
5. **KV usage approaching the free-tier ceiling** (D-8: ~18.8
   MB/year against 1 GB; retention is an owner decision, never
   silent).
Voter-table, threshold, label, or lane changes are NEVER re-check
work — they open a dedicated gated session (the D-5 pattern: pins +
naming round + spec bump + fresh run + deploy, each its own gate).

## 7. Security + what NOT to do

- Credentials ride the session context / environment ONLY — never
  echo token values, never commit them, never write them to disk
  inside the repo. The secret scan (gate 0) stays clean.
- The re-check path is **read-only KV** (GET requests only): no KV
  writes, no Worker deploys, no production-code changes. The
  throwaway PUT+DELETE probe is the deploy path's tool, not the
  re-check's — use it only when a deploy session needs the scope
  proven.
- No edge claims, no softened wording, no "proven". The report
  records what was measured, including "no material difference".
- If credentials are missing/blocked: STOP after step 1, report
  exactly what is needed ("a Cloudflare API token with Workers KV
  Storage: Read on account 5f123468027e4b2094167df1d2f2e852"), and
  claim no verdict.

## 8. Re-arming the automated one-shot (the cron recipe)

A re-check that should wait for specific future rungs (e.g. after N
more archive days, or the next quarter) can be armed as a one-shot in
the owner's session tooling at **~04:30 UTC on the chosen day** (past
that day's ~04:10–04:20 UTC ingest rung). The payload should point
here ("run GOLD_RECHECK_SPEC §2/§3") and carry the §4 verdict rules +
the §7 security rules inline (self-contained in case the repo must be
cloned fresh). If a day's timing is missed, the next day works — the
corpus only grows.
