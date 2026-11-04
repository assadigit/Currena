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

- **2026-11-03 ~05:20–06:00 UTC — the same re-check, run a second time
  by the concurrent GB-S1 variant (the parallel-session union; CHANGELOG
  [2026-11-03g]).** Same live anchors, same KV verdicts, one ADDITIONAL
  finding that matters for the procedure: **the 04:35 UTC rung's
  Frankfurter outage was TRANSIENT** — the provider was verified back
  up ~05:30 UTC, and the 11-03 03:15 UTC rung (the S6 delivery's
  dispatch) had been FX-healthy (fresh `dollar-basket`/`usdjpy`
  readings in that day's archive) — which is exactly why the fresh
  stage lacked the two series while the archives carried fresh FX. The
  other path through the same blocker is now twice-verified as the
  pre-registered fallback: when the fresh dump would fail the harness's
  loud missing-voter-series check, **the fixture stands on the
  corpus-of-record and the blocker is recorded — never hand-patched to
  completeness**; this variant's corpus-of-record re-run then reproduced
  every S6 number exactly (2,514 windows, sign-agreements 52.1 / 47.6 /
  43.9%, tilt 1,174 = 46.7%; `BACKTEST-GOLD.md` byte-identical), the
  watch days 2–4 read lockstep from the fresh archive reads (11-01/
  11-02 holding over the weekend; 11-03 trio 10-29 → 10-30, decade
  group 10-30 → 11-02, both +1 trading day) — validated-by-watch,
  and the 11-01/02/03 `goldSummary` stamps (−2/headwind) === the
  promoted-table re-derivation, re-derived read-only from the archived
  readings (no drift; the tilt silent on all three). §5 carries the
  run's row.
- **2026-11-03 ~05:00 UTC — the missed armed check, run manually (GB-S1, the
  gold-balance consolidation's first session).** The 2026-11-02 one-shot
  never fired (no `[2026-11-02a]` entry; the fixture stood at recordedAt
  2026-10-31T15:17:40Z), so §3 steps 1–7 ran by hand. The corpus-of-record:
  19 archive days, 2026-10-15 → 11-03 (10-20 absent), recordedAt
  2026-11-03T04:43:54Z — **grown AND re-venued**: the two FX voters
  (`dollar-basket`, `usdjpy`) left the stage blob (the gap-closure ingest
  rounds) and are now sourced read-only from their `insights:hist:<id>`
  keys (the dump records the venue); the rolling ~10-year history window
  trimmed the head and dropped the 2026-10-31 Saturday seed point, so the
  windows count moved 2,514 → **2,512**. The promoted-table re-run: sign-
  agreements 51.6 / 47.3 / 44.3%, tilt 46.7% (in band), mature base
  46.8 / 42.2 / 32.7% — the 5td sits a hair BELOW the 2-SE band edge (S6
  had it just inside), so the mechanical wording returns to the S4 form;
  no edge claim either way, the round-55 note stays operative. The watch
  (days 2–4): **LOCKSTEP — validated-by-watch** (offset exactly 1 gold
  trading day at every rung). The no-drift contract holds on all four
  stamped days (all −2/headwind, the tilt silent). No escalation rule
  fired. The P0 lane calibration rode the same corpus
  (`docs/insights/BACKTEST-GOLD-LANES.md`; MIN2 chosen). Full record:
  `GOLD_BACKTEST_SPEC.md` §5's 2026-11-03 sections.
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
  `curl -s https://currena.ir/api/insights` must answer with its
  `readings` array carrying the gold voters and the `gold-usd` price
  reading, and the `breakeven-tilt` reading (asOf, percentile10y).
  *(OI-3/GB-S7, 2026-11-04, the owner's recorded approval: the
  payload NO LONGER carries `goldSummary` — the wire field retired
  with the flipped UI that never read it. The numbers the field
  used to state are re-derived OFFLINE from the readings by the same
  pure engine — that is what Steps 3–5 do.)*
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
  over it. *(Venue note, 2026-11-03: `dollar-basket` and `usdjpy` no
  longer ride the stage blob — the dump sources them read-only from
  their own `insights:hist:<id>` keys and records the venue in the
  corpus; the KV histories are rolling ~10-year windows, so the head
  trims over time and the window count can move DOWN between runs —
  compare values on common days, never silently reconcile.)*
  *(Stamp note, 2026-11-04 / OI-3: the dump reads the historical
  `goldSummary` stamps from the RAW archive JSON, pre-parse — the
  field left the snapshot schema with the GB-S7 cleanup, so the
  zod-parsed snapshot no longer exposes it. Archive days written
  after the retirement rung simply report `present:false`; that is
  the honest record, not a gap.)*
- **Step 4 — the backtest run (offline; reads only the fixture):**
  `corepack pnpm --filter @currena/insights gold-backtest`
  — the PROMOTED 21-voter table is the primary; the S4-frozen
  20-voter table rides as the lineage baseline (the promotion-delta
  section). `docs/insights/BACKTEST-GOLD.md` regenerates from the
  run — commit it.
- **Step 5 — compare against §5's baselines:** the honest frame is
  deltas, never softening. Expected drift: windows grow (~2 per new
  gold trading day), sign-agreements wander within a few points, the
  tilt's fire-rate stays in the ~40–50% band. The stamped-vs-rederived
  `goldSummary` no-drift contract covers the STAMPED ERA ONLY — the
  rungs from 2026-10-31 through the last rung before the OI-3/GB-S7
  retirement deploy (2026-11-04); every stamp from a rung after
  2026-10-31 16:07 UTC is the PROMOTED engine's (`21ca25ab`+), the
  10-31 one is the S4-frozen engine's (the deploy boundary).
  Archive days written after the retirement rung carry NO stamp —
  their scores exist only as the harness's own re-derivation from
  the archived readings (the same check, one leg: the stamps were
  the second, independent leg).
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
| 2026-11-03 re-check (promoted 21, run manually) | 19 days, recorded 11-03 04:43Z | 2,512 | 51.6 / 47.3 / 44.3% | 1,173 (46.7%) | mature 46.8/42.2/32.7%, spreads −0.01/−0.30/−1.98% — the 5td flips to just OUTSIDE the 2-SE band and its spread to −0.01%: the mechanical wording returns to the S4 form ("runs the OTHER way"), borderline stated; watch days 2–4 LOCKSTEP → validated-by-watch; no-drift holds on all 4 stamped days; windows −2 vs S6 (the rolling head trim + the dropped 10-31 Saturday seed); label flips 263 (10.5%); the FX voters re-venued to insights:hist:*; no escalation |

| 2026-11-03 (the concurrent variant, promoted 21, corpus-of-record) | 16 days — the fixture stood on the corpus-of-record (the 04:35 UTC rung's Frankfurter outage left the fresh stage without the two FX voter series; recorded, never hand-patched) | 2,514 | 52.1 / 47.6 / 43.9% — identical to S6 by construction (same corpus + same code; `BACKTEST-GOLD.md` byte-identical) | 1,174 (46.7%) | the second, independent path through the same blocker; the watch days 2–4 validated-by-watch (from the fresh archive reads the dump performed); the 11-01/02/03 stamps (−2/headwind) === the promoted re-derivation (no drift); the P0 calibration over this corpus chose the same MIN2 (C1 24.7%/49.6%, C2 9 = net-sign 9 — the decision's robustness check, GOLD_BACKTEST_SPEC §5) |
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
   the stamped-vs-rederived `goldSummary` disagreeing on a STAMPED
   day (the no-drift contract — stamped era 2026-10-31 → the OI-3
   retirement rung, per §3 Step 5);
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
