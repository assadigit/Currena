# S1 — Foundation and trust

**Estimated length:** 2 to 3 hours. **Depends on:** nothing. **Blocks:** everything.
Read `00-OPERATING-RULES.md` first.

## Why this session exists

1. The Australian "Critical" verdict partly rests on three RBA-fed voters
   (`au-10y`, `rba-expectations`, `au-us-10y-gap`) that have been stale since
   2026-09-30 because Akamai blocks `rba.gov.au` from Worker egress. Stale data
   must never look current (RULES 4.2.3).
2. The ingest `main` rung is at ~49/50 subrequests, so no new data can be added
   without new rung capacity.
3. GitHub Actions has failed since 2026-10-20 although the repo is **public**
   (public repos get free Actions minutes). Runs fail in about 3 seconds, which
   looks like an account or billing block, not minutes exhaustion.
4. Several small presentation bugs were found in the live-page audit.
5. We need progress tooling and a verified view of what Worker egress can reach,
   before promising any new source.

## Preconditions (owner)

- Credentials rotated (see PROGRESS.md "Owner action items") and exported in the shell. Do not print them.
- `git push origin main` works from the shell.

## Milestones

### M1.1 Environment, baseline and Worker-egress probe

Tasks:
1. `git pull`, `pnpm install`, `pnpm gates`. Record the baseline (test counts, gate results) in PROGRESS.md.
2. Confirm credentials exist as environment variables **without printing them** (for example check `[ -n "$CLOUDFLARE_API_TOKEN" ]`). Run `pnpm --filter @currena/api exec wrangler whoami` and confirm the account. If missing, stop and ask the owner to export them.
3. Confirm the owner has rotated the pasted credentials (ask once; record "owner confirmed" in PROGRESS.md; never record values). Run the repo's secret-scan gate on the tree.
4. **Worker-egress probe.** Create a throwaway probe (a script run with `wrangler dev --remote`, or a temporary Worker named `currena-probe` that you delete afterwards). It must fetch each host below once with the honest User-Agent used elsewhere in the repo and return only `{host, url, status, contentType, bytes, ms}`:
   - `ticdata.treasury.gov` (`slt_table5.txt`, `slt_table3.txt`)
   - `www.federalreserve.gov` (`ebp_csv.csv`)
   - `www.newyorkfed.org` (GSCPI file)
   - `services9.arcgis.com` (PortWatch query)
   - `api.fiscaldata.treasury.gov`
   - `www.financialresearch.gov`
   - `www.policyuncertainty.com` and `www.matteoiacoviello.com` (GPR)
   - `www.rba.gov.au` (expect 403, record it)
   - `data.api.abs.gov.au`
   - `query1.finance.yahoo.com` (one index symbol)
   - `www.stats.govt.nz` or the RBNZ host (note for S6)
   - `data-api.ecb.europa.eu`, `fred.stlouisfed.org`
5. Record the probe table in `VERIFIED-SOURCES.md` (new "Worker egress" section). Delete the probe Worker. Do **not** try to defeat any block.

Acceptance: baseline recorded; probe table committed; no probe left deployed; no secret in any file.

### M1.2 Diagnose and repair GitHub Actions

Tasks:
1. Read the failure reason: GitHub REST API `GET /repos/assadigit/Currena/actions/runs/<id>/jobs` and the job annotations (use the owner's git/`gh` auth; an unauthenticated read may be enough for a public repo). Runs fail in about 3 seconds, which usually means a billing/spending-limit lock or an account-level hold, not job logic.
2. Decide the root cause and write it in PROGRESS.md. Typical owner-side fixes: github.com/settings/billing (payment method / spending limit), repository Actions permissions, or a self-hosted runner. Do not change billing settings yourself.
3. If the cause is fixable from the repo (a workflow bug), fix it and show one green run.
4. If it is owner-side, add precise owner steps to PROGRESS.md "Owner action items" and mark M1.2 `blocked-owner` (it does not block the other milestones; M1.5 has a path that does not need Actions).

Acceptance: root cause documented with evidence (annotation text or API output); either a green run or exact owner steps recorded.

### M1.3 Progress tooling

Tasks:
1. Add `scripts/gap-progress.mjs` (Node ESM, no dependencies). It reads `docs/gap-closure/PROGRESS.md`, counts `- [x]` vs `- [ ]` per session section, and rewrites the Summary table and the last-updated line between stable markers. Add `pnpm gap:progress` to the root `package.json`.
2. Add a unit test for the parser/rewriter (fixtures in `tests/` following the existing pattern). It must be idempotent.
3. Add the markers to PROGRESS.md and run the script. Ensure `pnpm gates` and eslint accept the script.

Acceptance: `pnpm gap:progress` updates the percentages deterministically; test passes; gates green.

### M1.4 Stale-voter honesty

Problem: a voter whose reading is `stale` can still colour a gauge verdict, and the card does not make staleness obvious on the hero gauges.

Tasks:
1. Read `packages/insights/src/gauges.ts`, `scoring.ts`, `freshness.ts`, `validation.ts`. Document the current behaviour for stale voters in the PR/CHANGELOG (does the verdict count them? by how much?).
2. Tests first: a gauge with N voters of which one is stale must (a) exclude it from the verdict count, (b) report `staleCount` and the ids, (c) never go **more** severe because of a stale voter.
3. Implement exclusion and expose `staleVoters` in the summary shape (additive field in `/api/insights`; update the zod schema in `packages/core` if the shape lives there).
4. UI: on the hero verdict cards and the gauge header show a calm, plain badge: "1 of 5 readings is out of date", EN + fa (Layer-1 style, no alarmist words). Never hide the card.
5. Rule-version bump for any rule text you touch (`ruleVersion.ts`), as the repo requires.

Acceptance: with the current stale RBA readings the Australia gauge shows the badge and its verdict is computed from fresh voters only (record before/after in PROGRESS.md; do not tune thresholds to change the colour); tests green; EN/fa screenshots.

### M1.5 Australian data continuity (RBA)

Goal: fresh Australian rates data without circumventing the Akamai block.

Tasks (in this order; stop at the first that works reliably):
1. **FRED/OECD monthly mirrors as labelled fallback** for `au-10y` (verify the series id on FRED: the OECD long-term government bond yield for Australia, monthly) and a cash-rate mirror. Show "monthly average, lagged" in the label (the repo already does this for `bund-10y`). Tests against a recorded fixture. Never mix a monthly mirror with a daily US yield in a same-date spread: show both dates (RULES §6).
2. **Different legitimate venue for daily RBA data**: if M1.2 restored GitHub Actions, run the RBA fetch from a scheduled workflow (the repo's own notes say the GitHub Actions runner is RBA's verified venue) and write to KV via the existing owner-token route or a dedicated, narrow write path. Review `.github/workflows/insights-ingest.yml` and `docs/insights/OWNER_SETUP.md` for the existing pattern. Secrets stay in GitHub repo secrets. If M1.2 is `blocked-owner`, implement the workflow, leave it disabled, and record the one-line enable step for the owner.
3. Update `au-us-10y-gap` so both legs carry their own dates and the gap is only computed when the dates are within the allowed window; otherwise "dates differ" is shown and the card does not vote (the audit found Sep 30 vs Oct 29 being compared).

Acceptance: `au-10y` shows a value no older than its labelled cadence, or an honest stale tag; the AU/US gap never silently mixes dates; tests green.

### M1.6 Audit bug fixes

Fix each with a failing test first. Evidence for each is in the 2026-10-31 live-page audit.
1. **`usdaed` duplicate-print false alarm**: a pegged currency legitimately repeats the same close. Exempt pegged pairs (`usdaed`) from the "daily series repeated" check, or use a peg-aware tolerance. Result: the card shows its value, and the page's "1 unavailable" disappears if this was the only cause.
2. **Markets summary count mismatch**: one sentence says "7 of 16 in correction" while the cards show 6 (≥10% below the 52-week high). Use one shared computed value for every sentence and the stat box. Also make the up/down/flat counts and the text agree (state the threshold used for "flat").
3. **Markets card trend labels** contradict the day's move (TAIEX −1.4% labelled "Up", Nifty +1.1% labelled "Down"). Clarify the label: name what it measures (for example "short-term trend") or align it. Do not change the data.
4. **Gold/silver "Price footing"**: "high of the last 10 years" appears next to "works against" while the price fell 7.8% in 30 days. Make the wording consistent with the rule (use the 30-day speed in the sentence), within the wording rules.
5. **Geopolitical Risk Index**: it rose 20.6 points while oil rose 20%, yet the card reads "Context / usual range". Check whether the percentile/rule is right for a context row; if the rule is defective (for example wrong baseline), fix and pin with a test; if it is simply context-only by design, note it for S4 (the new gauge will score it). Do not tune to make it look louder.

Acceptance: each bug has a test that failed before and passes after; before/after screenshots in `docs/gap-closure/evidence/M1.6/`.

### M1.7 Capacity scaffolding

Tasks:
1. Read `apps/api/src/insights-ingest-cron.ts` and `cron.ts`. Document the existing rung gates (UTC hour:minute) in `docs/gap-closure/RUNGS.md`: what runs when, subrequests and writes per rung.
2. Add a generic, tested **`rung3`** at 04:30 UTC (check the slot is free; choose another if not) that runs a pluggable list of "extra sources" with its own 50-subrequest budget, its own status record, and failure isolation (one failing source never affects the others or the main snapshot). Add a monthly/weekly gate helper similar to the existing first-of-month and Saturday gates, so S2 to S6 do not re-invent gating.
3. Add a **`rung4`** at 04:35 UTC the same way if needed by later sessions (leave it empty and tested).
4. Extend the sweep (10:10/20:10) so it also heals failed `rung3`/`rung4` sources.
5. Add `docs/gap-closure/NEW-INDICATOR-CHECKLIST.md` (a copy of the §7 recipe as a PR checklist) and a test or script that fails if a new indicator id lacks Layer-1 copy in EN and fa (the existing validator may already do this; reuse it).
6. Do **not** add a cron trigger to any wrangler config.

Acceptance: `rung3` runs live (empty list) and writes a status record; subrequest/KV numbers reported; sweep test covers it; no new cron trigger; gates green.

## Session close

Follow `00-OPERATING-RULES.md` §10. The next prompt is S2.
