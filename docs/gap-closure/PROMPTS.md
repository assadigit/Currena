# Session kickoff prompts

Paste the prompt for the next session into a fresh agent session opened at the
repo root. **Before you start:** export `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in the shell, and make sure `git push origin main` works.
Never paste a credential into the chat.

At the end of every session the agent rewrites the next prompt below (with lessons
learned and exact state) and prints it. If you use an older prompt from this file
after a session ran, prefer the one the agent printed.

---

## S1 — Foundation and trust

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on the `main` branch; commit, push and deploy after every milestone.

Read, in this order, before touching anything:
1. AGENTS.md
2. docs/gap-closure/README.md
3. docs/gap-closure/00-OPERATING-RULES.md  (rules win over older docs for this program)
4. docs/gap-closure/PROGRESS.md
5. docs/gap-closure/VERIFIED-SOURCES.md
6. docs/gap-closure/S1-foundation-and-trust.md  (your session spec)

Your job: execute milestones M1.1 to M1.7 of S1 in order. For each milestone follow the loop in 00-OPERATING-RULES.md section 3: tests first, `pnpm gates` green, commit, `git pull --rebase`, push to main, deploy, verify on production in a real browser (EN and fa), update PROGRESS.md and CHANGELOG.md, push again.

Credentials: they must already be in the environment (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID). Never print or write them anywhere. If missing, stop and ask me to export them; never ask me to paste secrets.

Do not ask me questions unless: a credential is missing, an action is destructive or irreversible, a source needs an `owner_accepts` decision, or the spec says to ask. Otherwise choose the safest option, record it, and continue. After three honest failed attempts on an item, record it as blocked in PROGRESS.md and move on. Never circumvent a block, never remove or hide any existing indicator, index or country.

At the end: update PROGRESS.md (ticks, session log, gap coverage), update VERIFIED-SOURCES.md, rewrite the S2 prompt in docs/gap-closure/PROMPTS.md with lessons learned and the exact current state, commit and push, and print the S2 prompt in a code block as the last thing in your final message with a 5-line summary (what shipped, what is blocked, what I must do).
```

---

## S2 — Foreign holdings of US Treasuries

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read, in order, before touching anything: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md (its rules win for this program), docs/gap-closure/PROGRESS.md (S1 is DONE — 7/7, nothing carried over), docs/gap-closure/VERIFIED-SOURCES.md (especially the "Worker egress" table), then docs/gap-closure/S2-treasury-foreign-holders.md (your session spec). Also read docs/gap-closure/RUNGS.md and docs/gap-closure/NEW-INDICATOR-CHECKLIST.md — S1 built them for exactly this session.

Your job: execute milestones M2.1 to M2.6 of S2 in order. This is the owner's top-priority feature: a table showing which countries hold, buy and sell US Treasuries (Japan and China are reducing holdings). The most important design rule: separate real net buying/selling (TIC Table 3 "Net U.S. Sales") from price effects ("Valuation Change"), and show the custody-hub caveat (Belgium/Luxembourg/Cayman hold much that belongs to others). Use ONLY the verified `slt_table5` and `slt_table3` URLs; the old `mfh.txt` is frozen at 2023.

The exact current state (from S1, 2026-10-31):
- Egress: ticdata.treasury.gov WORKS from Worker egress but is SLOW — 8–10s per file under the 12s single-attempt fetch policy (F-11: no retries; keep the honest timeout). Budget your rung so the two TIC fetches never share an invocation with anything heavy.
- Ingest capacity: rung3 (04:30 UTC) and rung4 (04:35 UTC) exist, are verified live, and are EMPTY — register the TIC fetches there via `EXTRA_SOURCES` in apps/api/src/insights-extra-rungs.ts (the recipe + the budget/status/heal contract is in docs/gap-closure/RUNGS.md). NEVER add fetches to the 04:10 main rung (47/50). The sweeps (10:10/20:10) auto-heal a failed TIC fetch within hours.
- Honesty machinery S1 shipped that you should REUSE, not rebuild: RULE_VERSION is 4; a stale/spread reading now carries `gapLegs`/`datesDiffer` and the 7-day leg guard (packages/insights/src/adapters/snapshot.ts, applyGapLegDateGuard) — if a TIC table pairs a holdings leg with a transactions leg, the same date-guard pattern applies; the section summary names out-of-date voters (staleVoters); the hero/gauge headers show the calm out-of-date badge (copy key ui.staleReadingsBadge, round-57).
- Persian copy: rounds 57–59 are used; your new fa strings are round-60 (`pnpm copy:audit` → review → `pnpm copy:audit:update`). No em dashes in fa.
- Bundle budget: Insights lazy chunk ceiling is now 1140/268.5 (kB raw/gz) — justify any bump in scripts/check-bundle-budget.mjs + CHANGELOG, never silently.
- CHANGELOG entries: prepend with a dated heading (`## [2026-11-01a]` or the next letter if the date continues); when prepending with a script, anchor on the PREVIOUS heading and verify the heading count afterwards — S1 twice clobbered a heading by anchoring wrongly.
- `wrangler kv key get` (CLI) can report "Value not found" for keys the REST API returns — for verification reads use the REST API (`/accounts/{id}/storage/kv/namespaces/{ns}/values/{key}` with the token from the environment).
- Watch items to check during your first verify pass: (a) the 04:20 insights-ingest and 04:50 selfcheck GHA scheduled runs should be GREEN from 2026-11-01 (the billing hold lifted 2026-10-31 14:34 UTC) — if the "payments failed / spending limit" annotation returns, record it as the owner-side billing issue again; (b) the RBA trio (au-10y, rba-expectations, au-us-10y-gap) crosses its 40-day monthly window ~2026-11-09 absent fresh data — the AU inflation gauge should then show the out-of-date badge and the gap should NOT vote (the S1 machinery working; the October F2.1 monthly, publishing ~Nov 1–3, should realign the legs first).
- The owner action items in PROGRESS.md are OPEN (top: rotate every chat-pasted credential). Do not wait on them; never use a credential that appears in your own chat.

Follow the milestone loop in 00-OPERATING-RULES.md section 3 for every milestone: tests first (fixtures under packages/insights/fixtures/, parsers fail closed on column count/header/units/date/range), `pnpm gates` green (10,331 tests was the S1 close — do not regress), commit (`gap(S2-M2.x): …`), `git pull --rebase origin main`, push, deploy (api worker; markets worker only if it changes), verify on production in a real browser in EN and fa at 360 and 1200 px plus the API, update PROGRESS.md and CHANGELOG.md, commit and push again. Credentials come from the environment only; never print or write them anywhere. Do not ask me questions unless a credential is missing, an action is destructive or irreversible, a source needs an `owner_accepts` decision, or the spec says to ask; otherwise choose the safest option, record it, and continue. After three honest failed attempts on an item, record it as blocked and move on. Never circumvent a block, never remove or hide any existing indicator, index or country, never invent a series id, URL, column name or number — verify from the provider's own response.

At the end: update PROGRESS.md (ticks, the S2 session log row with commits + deployed version ids + KV/subrequest numbers, gap coverage G2, owner action items), update VERIFIED-SOURCES.md with everything learned, rewrite the S3 prompt in PROMPTS.md with the exact state and lessons, commit and push, and print the S3 prompt in a code block as the last thing in your final message with a 5-line summary (what shipped, what is blocked, what I must do).
```

---

## S3 — US credit, liquidity, fiscal and growth nowcast

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read, in order, before touching anything: AGENTS.md (note the new §G — the TIC composite dataset), docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md (its rules win for this program), docs/gap-closure/PROGRESS.md (S1 is DONE 7/7 and S2 is DONE 6/6 — G2 closed; nothing carried over except watch items), docs/gap-closure/VERIFIED-SOURCES.md (especially the "Worker egress" table and the dead/unverified lists), then docs/gap-closure/S3-us-plumbing.md (your session spec). Also read docs/gap-closure/RUNGS.md and docs/gap-closure/NEW-INDICATOR-CHECKLIST.md before adding anything to the ingest.

Your job: execute milestones M3.1 to M3.6 of S3 in order — credit and funding stress (EBP, OFR FSI), liquidity and term premium from FRED, the growth nowcast and surveys, fiscal and auctions. One S2 note up front: your spec's M3.1 mentions verifying FRED WSEFINTL1 for a weekly custody card — that is DONE and LIVE (S2 wired it as the `nyfed-custody` indicator, the 103rd, riding the WALCL mixed-frequency bulk group with zero extra subrequests); do not rebuild or re-verify it, just keep its T-16 record in data/fred-copyright.json intact when you add your own.

The exact current state (from S2, 2026-10-31 ~23:55 UTC):
- Egress: www.federalreserve.gov is FAST from Worker egress (EBP csv ~270 ms, verified); www.financialresearch.gov serves 200 but the OFR FSI machine-readable file/API must still be discovered (M3.1 work — the old index.csv link 404s); api.fiscaldata.treasury.gov is BLOCKED from Worker egress (timeout ×3 at 12/12/30 s while a normal client gets 200 in <1 s) — S3's fiscal/auction milestones MUST use the GHA venue exactly like the RBA path (docs/DEPLOY.md; the venue is verified working: green dispatch runs). Never circumvent a block.
- Ingest capacity: rung3 (04:30 UTC) carries `tic-slt` (the Treasury TIC tables, 30 s single-attempt timeout, budget 4, 1–2 KV writes/day — leave it alone). rung4 (04:35 UTC) is STILL EMPTY and reserved for you — register new fetches there via `EXTRA_SOURCES` in apps/api/src/insights-extra-rungs.ts (the recipe + budget/status/heal contract is in docs/gap-closure/RUNGS.md). NEVER add fetches to the 04:10 main rung (~47/50 subrequests). The S2 nuance worth knowing: a new SERIES ID inside an EXISTING FRED bulk-group request adds ZERO subrequests (the WSEFINTL1/WALCL precedent) — but the mixed-frequency group now sits at 11/12 ids and the fredgraph ZIP TRUNCATES past ~12, so that path is effectively full too; new FRED series need their own group or rung4. The sweeps (10:10/20:10) auto-heal failed rung3/rung4 sources within hours.
- Honesty machinery to REUSE, not rebuild: RULE_VERSION is 4 (the gap-leg 7-day date guard + the M1.4 stale-voter badge + staleVoters); the narrator knows the TIC facts (PROMPT_VERSION 9, the :50 rung reads insights:tic:v1 — +1 KV read is already accounted); parsers fail closed; new L2 sources start owner_accepts=false; every FRED series needs its T-16 record in data/fred-copyright.json (fail closed without it — see scripts/fred-copyright-scan.ts).
- Persian copy: rounds 57–61 are used (round-60 = the M2.4/M2.5 tic copy; round-61 = the custody card). Your new fa strings are round-62 (`pnpm copy:audit` → review → `pnpm copy:audit:update`). No em dashes in fa.
- Bundle budget: the Insights lazy chunk ceiling is now 1179/278 kB (raw/gz; measured 1178.50/277.98) — justify any bump in scripts/check-bundle-budget.mjs + CHANGELOG, never silently.
- CHANGELOG entries: prepend with a dated heading — the next is `## [2026-11-01a]`, then b, c… if the date continues. When prepending, anchor on the PREVIOUS heading and VERIFY THE HEADING COUNT afterwards: S1 clobbered a heading twice and S2's continuation session did it once more (caught and fixed in the same edit — always count before and after).
- Parallel sessions are REAL in this program (S2 had three). Before every commit: `git pull --rebase origin main`, re-read PROGRESS.md, skip already-ticked milestones, and record your claim in the parallel-session note. If a rebase conflict arises mid-work, resolve by ADDITIVE union (both sessions' work usually coexists; the first-landed copy wins shared wording) and re-run `pnpm gates` on the merged tree.
- Verification gotchas learned live in S2: (a) the PWA service worker serves the PREVIOUS chunk to returning browsers after a deploy — verify in a FRESH browser session (or hard-reload) before concluding a fix did not land; (b) `changeScaleOf` now requires the definition's changeKind (pct-kind changes never ride the value display scale — the ±0.00% family is fixed; keep it that way); (c) a percentile-0 reading can be HONEST (the custody card sits at the bottom of its decade) — verify suspicious numbers against the provider's own series before "fixing" them; (d) `wrangler kv key get` (CLI) can report "Value not found" for keys the REST API returns — verification reads use the REST API.
- Watch items for your first verify pass: (a) the 04:20 insights-ingest and 04:50 selfcheck GHA SCHEDULED runs should be GREEN from 2026-11-01 (the billing hold lifted 2026-10-31 14:34 UTC; the last scheduled failures were 10:27/10:37 UTC on 10-31, pre-lift) — if the "payments failed / spending limit" annotation returns, record it as the owner-side billing issue again; (b) the RBA trio (au-10y, rba-expectations, au-us-10y-gap) crosses its 40-day monthly window ~2026-11-09 absent fresh data — the AU inflation gauge should then show the out-of-date badge and the gap should NOT vote (the S1 machinery working; the October F2.1 monthly, publishing ~Nov 1–3, should realign the legs first — check it landed); (c) the TIC release calendar: the next release is 2026-11-18 (Sep 2026 data) — rung3's release-aware gate fetches daily on the 15th–25th until the new data month appears; the calendar entries for later months ride each month's press notice; (d) the Gold Program's automated re-check is scheduled 2026-11-02 ~04:30 UTC (docs/insights/GOLD_RECHECK_SPEC.md) — another stream's machinery; do not touch the gold files.
- The owner action items in PROGRESS.md are OPEN (top: rotate every chat-pasted credential). Do not wait on them; never use a credential that appears in your own chat.

Follow the milestone loop in 00-OPERATING-RULES.md section 3 for every milestone: tests first (fixtures under packages/insights/fixtures/, parsers fail closed on column count/header/units/date/range), `pnpm gates` green (10,526 tests was the S2 close — do not regress), commit (`gap(S3-M3.x): …`), `git pull --rebase origin main`, push, deploy (api worker; markets worker only if it changes), verify on production in a real browser in EN and fa at 360 and 1200 px plus the API, update PROGRESS.md and CHANGELOG.md, commit and push again. Credentials come from the environment only; never print or write them anywhere. Do not ask me questions unless a credential is missing, an action is destructive or irreversible, a source needs an `owner_accepts` decision, or the spec says to ask; otherwise choose the safest option, record it, and continue. After three honest failed attempts on an item, record it as blocked and move on. Never circumvent a block, never remove or hide any existing indicator, index or country, never invent a series id, URL, column name or number — verify from the provider's own response.

At the end: update PROGRESS.md (ticks, the S3 session log row with commits + deployed version ids + KV/subrequest numbers, gap coverage G3/G4/G5, owner action items), update VERIFIED-SOURCES.md with everything learned, rewrite the S4 prompt in PROMPTS.md with the exact state and lessons, commit and push, and print the S4 prompt in a code block as the last thing in your final message with a 5-line summary (what shipped, what is blocked, what I must do).
```

---

## S4 — Geopolitics, supply chain and energy

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S4-geopolitics-supply-energy.md. Confirm S1 is done.

Execute M4.1 to M4.6. Build the new "Is the world getting more fragmented?" gauge in shadow mode (members are context-only and the gauge says it is not scored yet). Verify GPR columns, PortWatch fields and the GSCPI egress before building; if GSCPI is blocked from Worker egress, record it and do not circumvent. Wording rule: measurements and tendencies only, never news causes.

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Never remove existing indicators.

At the end: update PROGRESS.md and VERIFIED-SOURCES.md, rewrite the S5 prompt in PROMPTS.md, commit and push, and print the S5 prompt in a code block as the last thing in your final message with a 5-line summary.
```

---

## S5 — Australia deep-dive and Australian markets

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push (deploy both the api and, if changed, the markets worker) after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S5-australia.md. Confirm S1 is done.

Execute M5.1 to M5.6. Use ABS (CC BY 4.0) for the new macro series; verify every dataflow id from the ABS structure endpoints. Build a SEPARATE Australian markets board; do not touch the existing 16 world indices. Probe every index symbol before including it and keep only complete, fresh, plausible ones; prove EODHD quota arithmetic or use the Yahoo path. New gauges are shadow-mode ("not scored yet").

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Never remove existing indicators.

At the end: update PROGRESS.md and VERIFIED-SOURCES.md, rewrite the S6 prompt in PROMPTS.md, commit and push, and print the S6 prompt in a code block as the last thing in your final message with a 5-line summary.
```

---

## S6 — New Zealand, China and world links, promotion and polish

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S6-links-promotion-polish.md. Check PROGRESS.md for any blocked or carried-over items from S1 to S5 and handle those that matter first.

Execute M6.1 to M6.6. For New Zealand, measure the connection to Australia first and apply the decision rule in the spec. For promotion of shadow indicators to voters (M6.4): write the evidence-based proposal, then STOP and ask me to approve the list; promote only what I approve. Finish with the quality pass, the docs refresh, the portfolio case study and the credential-hygiene check.

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Never remove existing indicators.

At the end: finalise PROGRESS.md and VERIFIED-SOURCES.md, commit and push, and print a final summary (what shipped overall, final counts, what was rejected or blocked, my remaining action items). There is no next prompt.
```
