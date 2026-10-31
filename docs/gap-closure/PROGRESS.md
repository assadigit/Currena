# Gap-closure progress

The single place to see how much of the gap-analysis is done. Agents update this
file at the end of every milestone (tick the box, add evidence) and every session
(session log). **37 milestones in 6 sessions.**

> Last updated: 2026-10-31 (S1 in progress — M1.1 done)

## Summary

| Session | Theme | Milestones done | % |
|---|---|---|---|
| S1 | Foundation and trust | 0 / 7 | 0% |
| S2 | Foreign holdings of US Treasuries (priority feature) | 0 / 6 | 0% |
| S3 | US credit, liquidity, fiscal and growth nowcast | 0 / 6 | 0% |
| S4 | Geopolitics, supply chain and energy | 0 / 6 | 0% |
| S5 | Australia deep-dive and Australian markets | 0 / 6 | 0% |
| S6 | New Zealand link, China and world links, promotion and polish | 0 / 6 | 0% |
| **Total** | | **0 / 37** | **0%** |

Gap coverage (from the 2026-10-31 gap analysis; tick when the gap is closed in production):

- [ ] G1 Stale Australian voters made honest (S1)
- [ ] G2 Treasury foreign-holder table incl. Japan and China (S2)
- [ ] G3 Credit and funding stress (S3)
- [ ] G4 Fiscal and Treasury supply (S3)
- [ ] G5 Real-time growth nowcast and survey (S3)
- [ ] G6 Geopolitics gauge (S4)
- [ ] G7 Supply chain, chokepoints and energy (S4)
- [ ] G8 Australian macro activity and external gauges (S5)
- [ ] G9 Australian indices board (S5)
- [ ] G10 New Zealand link (S6)
- [ ] G11 China property and steel (S6)
- [ ] G12 De-dollarization and concentration (S6)
- [ ] G13 Promotion of proven indicators to voters (S6)

## Milestones

### S1 Foundation and trust (`S1-foundation-and-trust.md`)
- [x] M1.1 Environment, baseline and Worker-egress probe
  - Baseline (2026-10-31 16:53 UTC): `pnpm install` clean, `pnpm gates` **ALL 9 GREEN — 10,296 tests in 1m49s** (core 195 · scraper 67 · insights 973 · markets 13 · api 371 · web 8677; secret scan clean, 8 patterns · 688 files). Matches the S6 Gold Program record.
  - Credentials: `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` verified present via `wrangler whoami` (account `5f123468027e4b2094167df1d2f2e852` — matches production); `git push origin main` verified via dry-run (credential helper reads `GITHUB_TOKEN` from the environment; no secret in any file — repo tree clean).
  - Rotation: **not verified** — the owner re-pasted identical token values and explicitly instructed the session to use them (recorded 2026-11-01). The DEPLOY.md 2026-10-31k record shows the same `cfut_dGmEj…` prefix, i.e. these are the tokens the 2026-10-31 planning chat already exposed. Rotation stays the **top owner action item**; this session never prints or commits them.
  - Egress probe: temporary Worker `currena-probe` (deployed + **deleted**; URL 404s), honest UA `CurrenaDashboard/1.0`, single attempt per host, 2 full runs + 1 targeted 30s re-run. **13 of 15 fetches 200** (incl. NY Fed GSCPI — the Akamai fear was unfounded); `ticdata` slow (8–10s, thin margin under the 12s policy); ArcGIS slow (>12s first byte, works at 30s); **FiscalData API blocked from Worker egress (timeout ×3)**; **RBA 403 re-confirmed**. Full table → `VERIFIED-SOURCES.md` "Worker egress".
  - Deploy/verify (identical code — pipeline check for the session): worker `d524ff1e` deployed 17:40 UTC; `/api/health` ok:true/kv:ok; `/api/insights` 200 (generatedAt 2026-10-31T04:20Z, goldSummary present); browser EN+fa at 1200/360: zero console errors, correct `dir`/`lang`, all sections render (screenshots `evidence/M1.1/`). Commit `7491e56`.
- [x] M1.2 Diagnose and repair GitHub Actions
  - **Root cause 1 (owner-side, lifted):** a billing/spending-limit hold blocked runner allocation from 2026-10-19 23:25 UTC — GitHub's own job annotation (read via the authenticated API): *"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings."* Every scheduled ingest/selfcheck run failed in ~2s with no runner. The hold lifted 2026-10-31 ~14:34 UTC (first green CI run #363); push/PR runs green since.
  - **Root cause 2 (repo-side, fixed):** `shiller-fetch.yml` carried a top-level `timeout-minutes` — invalid workflow syntax, so GitHub rejected the file: every push since 2026-10-19 produced a zero-job instant "failure" pseudo-run and the workflow never executed once. Fix: moved the key to job level (the `insights-ingest` pattern) + corrected the stale minutes-exhaustion and repo-private comments. Commit `3f1ef72`.
  - **Evidence:** CI #375 green on the fix commit · **shiller-fetch #141 green — the workflow's first-ever successful execution** (it pushed its designed archive commit `3625afa`) · **insights-ingest #56 (workflow_dispatch, `dry_run=true`) green** — the GHA venue is functional again, no KV writes needed for the test. No phantom push-runs after the fix.
  - **Not deployable:** workflows-only change — no worker code changed, so no deploy (recorded choice; production verified healthy via `/api/health` at 17:51 UTC).
  - **Watch item for M1.5/S2:** the 04:20 `insights-ingest` and 04:50 `insights-selfcheck` scheduled runs should resume 2026-11-01 — if they fail again with the same annotation, the billing hold recurred (owner: github.com/settings/billing → payment method / spending limit). If they stay green, the GHA venue is available as M1.5's RBA fallback path.
- [ ] M1.3 Progress tooling
- [ ] M1.4 Stale-voter honesty
- [ ] M1.5 Australian data continuity (RBA)
- [ ] M1.6 Audit bug fixes
- [ ] M1.7 Capacity scaffolding

### S2 Foreign holdings of US Treasuries (`S2-treasury-foreign-holders.md`)
- [ ] M2.1 Source verification and fixtures
- [ ] M2.2 Parser, data model and ingest rung
- [ ] M2.3 Public endpoint, store and calendar
- [ ] M2.4 UI: holders table, trend chart, weekly custody card
- [ ] M2.5 Bilingual copy, glossary, narrator and licences
- [ ] M2.6 Deploy verification, docs and session close

### S3 US credit, liquidity, fiscal and growth nowcast (`S3-us-plumbing.md`)
- [ ] M3.1 Series verification and licence scan
- [ ] M3.2 Liquidity and term premium from FRED
- [ ] M3.3 Credit stress sources (EBP, OFR FSI)
- [ ] M3.4 Growth nowcast and surveys
- [ ] M3.5 Fiscal and auctions
- [ ] M3.6 UI, copy, docs and deploy close

### S4 Geopolitics, supply chain and energy (`S4-geopolitics-supply-energy.md`)
- [ ] M4.1 Verification and egress
- [ ] M4.2 GPR country series and trade policy uncertainty
- [ ] M4.3 Chokepoint transits
- [ ] M4.4 Supply chain and energy
- [ ] M4.5 New gauge and relationship cards
- [ ] M4.6 UI, copy, docs and deploy close

### S5 Australia deep-dive (`S5-australia.md`)
- [ ] M5.1 ABS verification and fixtures
- [ ] M5.2 Australian macro indicators
- [ ] M5.3 Australian gauges
- [ ] M5.4 Australian markets board
- [ ] M5.5 "What it means for my money" and calendar
- [ ] M5.6 UI, copy, docs and deploy close

### S6 New Zealand, China and world links, promotion and polish (`S6-links-promotion-polish.md`)
- [ ] M6.1 New Zealand link (evidence first)
- [ ] M6.2 China property and steel
- [ ] M6.3 De-dollarization and concentration
- [ ] M6.4 Shadow review and promotion proposal
- [ ] M6.5 Final quality pass
- [ ] M6.6 Final docs, case study and credential hygiene

## Blocked / rejected / carried over

| Item | Status | What failed, what was tried, what is needed | Date |
|---|---|---|---|
| (none yet) | | | |

## Session log

| Session | Date | Agent | Commits (first..last) | Deployed worker version ids | KV writes/day (after) | Notes |
|---|---|---|---|---|---|---|
| S1 | | | | | | |
| S2 | | | | | | |
| S3 | | | | | | |
| S4 | | | | | | |
| S5 | | | | | | |
| S6 | | | | | | |

## Owner action items (open)

- [ ] Rotate every credential pasted into the 2026-10-31 planning chat (Cloudflare API token(s), GitHub token, EODHD key) and revoke the old Cloudflare token still in git history (see `docs/INDICATORS_AND_DATA_SOURCES.md` §4 item 2).
- [ ] Export `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the shell before each session (never paste into chat).
- [ ] Review and flip any `owner_accepts` flags listed by a session.
- [ ] Approve the promotion list in S6-M6.4.
