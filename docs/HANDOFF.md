# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 23/30 (2026-11-12) — the PULLED-FORWARD reserve session: S25,
> the §15 Asia CPI fill session — DELIVERED AND VERIFIED LIVE (BD-S22 ·
> BD-S23a · BD-S23-parallel).** The three D-36 fills (japan-cpi ·
> korea-cpi · india-cpi) are LIVE from the IMF's own SDMX 3.0 CPI
> dataflow: the full §A ingest discipline, the /asia-pacific page's 14
> placed cards (the two index-only sections retired), the registry 187
> ids, the spec-v2 diff grown (AF-8), TWO deploys + the KV seed + the
> live §21 verify 14/14 green. A duplicate arrival landed the build
> (BD-S23-parallel — the pushed implementation governs, the duplicate
> archived, the shipped tree independently re-verified); this session ran
> the counterpart close: the KV seed + the KV-seed patch fix
> (`patchInsightsSnapshot` now ADDS fresh-card readings — the live seed
> exposed the old replace-only walk dropping them) + the live acceptance
> + every record.**

## Current state (2026-11-11 ~00:15 UTC, after the S23 close)

- **Program:** page-division — all TEN destinations render their own
  pages; Phases A–J CLOSED; **S25 (the §15 Asia CPI fill session)
  DELIVERED in the Session 23 slot**. Phase K remains: the investor
  round waits on the owner's lever; S23's feedback-build scope stays
  DEFERRED (blocked on the same input); S24 (legacy retirement
  readiness) is next.
- **DEPLOYED LIVE: currena-api `33ff60c0`** (the fill build `2c61c187` +
  the KV-seed patch fix — the SPA byte-identical `index-De-odUOp.js`) +
  **currena-markets `8f63c8fa`** (unchanged). The three fill readings
  are LIVE in the KV snapshot (japan-cpi 2.232142857142857 @ 2026-09-30
  pct10y 64% · korea-cpi 2.818940555271674 @ 2026-10-31 pct10y 73% ·
  india-cpi 4.44121915820029 @ 2026-07-31 pct10y 46%). Rollback stays
  one `npx wrangler rollback` from apps/api (→ the S21 shape
  `5593fd43`; the fill readings survive as plain snapshot rows).
- **Gates (last full runs, BOTH green):** the shipped fill build — ALL
  GREEN 2m 45s (suite 15,267); with the patch fix — ALL GREEN 2m 44s
  (suite **15,268**, +1 the fresh-card-bootstrap regression test;
  secret scan 8/1025 · typecheck 6/6 · eslint 0/0 · copy:audit clean ·
  narrator 193×2 + eval 50 · layer1 11,969/11,969 · build + budgets
  held — entry 272.88/82.55, the AsiaPage chunk 16.20/4.07 within its
  re-based 16.5/6.0 row).
- **The S23 surfaces (what changed where):** the engine (schemas enum
  +3, definitions +3 [global/growth-health, context-only, P2, source
  imf], the adapters/imf-cpi.ts + 15 tests + fixtures/s25, the rung2
  imfCpiMonthly wiring + the rung2-run --imf-cpi lever, READING_SOURCES
  +3, the imf register row + licence) · the display (placement japan
  2→3 + korea-taiwan-hk/india gain their cards — 11→14; asia-tiles +
  AsiaTierCards/AsiaPage; the full corpus INDICATORS + layer1 entries
  EN + fa; the i18n pd.asiaPacific copy; the manifest round-83) · the
  records (AGENTS §A rows + the count reconciliation [the registry's
  true count 187 = 54 voting + 133 context], INDICATORS_AND_DATA_SOURCES
  §1/§2, CHANGELOG, DEPLOY.md's S23 record, BD-S23a + BD-S23-parallel,
  AF-8, the roadmap + README program state) · pd-s14 extended to the
  14 cards.
- **The parallel-session note (BD-S23-parallel):** a duplicate arrival
  landed M0–M5 on origin/main; the pushed implementation governs (the
  recorded deltas: growth-health lane · P2 phase · decade-trimmed
  fixtures · layer1 entries included · the 16.5/6.0 budget row), the
  duplicate is preserved on the local branch
  `archive/s23-duplicate-m2-m5`, and the shipped tree was independently
  re-verified before this session continued with the deploy-side work.
  The KV write cap (HTTP 429 10048, the documented daily exhaustion) and
  the patch-drop bug were both found LIVE and are recorded in
  BD-S23-parallel + DEPLOY.md.

## Next session (Session 24/30 — the legacy retirement readiness review)

Read `AGENTS.md` (§14 — the owner's rules, incl. the §A indicator
maintenance discipline) first, then `docs/page-division/
01-SESSION-ROADMAP.md` (the S24 entry + the progress board + the
current-position note), `02-PAGE-DIVISION-SPEC.md` §13 (legacy &
retirement), `docs/DECISIONS.md` (D-9; BD-S22/BD-S23a/BD-S23-parallel),
and this file. **Scope (S24):** the D-9 audit — every indicator verified
categorized; the retirement checklist produced (execution itself may
wait for a burn-in period — investor question §19.6). **If the
investor's answers to spec §19 arrive before the session starts, run
the investor round INSTEAD** (collect → D-49+ in the strategy log §5
Round 4 → the spec v2 entries — the AF-1…AF-8 findings ride that pass,
never silent edits); the owner's kickoff prompt decides.

### Operational notes worth carrying

- **The KV write cap:** the account's free-tier daily KV quota exhausts
  ~19:00 UTC (HTTP 429 10048 on the REST path) — any manual KV seeding
  (rung2-run / fx-run / markets-au-run) after ~19:00 UTC waits for the
  00:00 UTC reset; the 04:10/04:20 UTC Worker rungs always land in the
  fresh window (DEPLOY.md's insights-ingestion note).
- **The fresh-card bootstrap is FIXED:** `patchInsightsSnapshot` now
  ADDS readings for ids the stored snapshot lacks (the regression test
  pins the exact production shape) — any future fill family lands
  cleanly on its first phase run.
- The three fill cards' first month rides the manual seed; the normal
  cadence takes over at the next first-of-month rung2 gate (Dec 1 UTC)
  — JP/KR at T+0, IN at its measured T+1..T+3-month mirror lag (maxAge
  150, labelled in copy).

## Owner-side levers waiting

1. **Arrange the external investor's review of the spec (§19 — the
   seven questions): Phase K's input and THE top lever.** The investor
   round re-opens at the next free slot the moment the answers exist
   (→ D-49+ in the strategy log §5 Round 4 → the spec v2 entries, with
   AF-1…AF-8 riding that pass); S23's deferred feedback-build scope
   follows it.
2. Ratify the `/converter` relocation (S1's build-session decision).
3. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
4. Ratify or redirect the BD-S3…BD-S23 decision set (the latest:
   **BD-S23-parallel** — the duplicate Session-23 arrival reconciled
   onto the pushed implementation; all recorded, none blocking).
5. Triage the queued unreviewed fa strings (now ~1230: the ~1184
   previous + the 42 round-83 S23 strings + 4 needs-review intros;
   every session's corpus-pinned values are verified byte-for-byte by
   their copy-pin tests).
6. The ecb-drf provider timeout (a maintenance-session item, queued
   behind the fill session): the S18/S19 data-refresh runs kept it held
   on last-good (2.5%, flagged stale) — it did NOT self-clear across
   rungs. The fail-closed design is holding the correct value honestly;
   a maintenance session should look at the ECB fetch (the runbook: the
   /admin console's per-source status, which needs the owner's
   REFRESH_SECRET).

## Known state worth knowing

- **The PortWatch runbook note (BD-S21e):** never run the §21 data
  audit's portwatch leg Tuesdays 11:00–14:00 UTC — the IMF's scheduled
  maintenance window; the endpoint answers 499 Token Required inside
  the window and returns after it.
- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) stops at S11 — the later sessions' records live
  in the roadmap delivery records + this file. A back-fill is a
  nice-to-have, never blocking.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · **pd-s14 (Asia 14 — the
  S23 extension)** · pd-s16 (Australia 28) · pd-s17 (Commodities 24) ·
  pd-s18 (Currencies) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`).
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above).
- **The parallel-session rule (hardened through BD-S18-parallel-3,
  BD-S21-parallel, and now BD-S23-parallel):** launch exactly ONE
  session per roadmap slot — one prompt = one session = one slot. If a
  kickoff arrives for a slot already delivered (origin/main carries its
  records), run the counterpart close, never a re-execution; if a
  duplicate is already PUSHED, reconcile onto it (the pushed
  implementation governs), archive the local duplicate, independently
  re-verify, and finish the slot's remaining milestones.
