# 00 — Operating rules for every gap-closure session

Read this file completely at the start of every session. Where it conflicts
with `docs/insights/RULES.md` or `docs/insights/AGENT_RUNBOOK.md`, **this file
wins for the gap-closure program only** (§1 lists the exact overrides).
Everything else in `RULES.md` (source risk levels, truth rules, wording rules,
no-circumvention rule) stays fully in force.

## 0. Owner decisions for this program (recorded 2026-10-31)

| ID | Decision |
|---|---|
| G-1 | Currena is the owner's curated "feel for world economic health" tool, built primarily for himself, also a product-design portfolio piece. Quality, honesty and polish matter more than indicator count. |
| G-2 | The site is **bilingual (English + Persian/fa)**. Every new user-facing string ships in both languages in the same commit. |
| G-3 | Do **not remove or hide any existing indicator, card, index or country** (for example the 16 world stock indices, including India, Brazil, Korea). Additions only. Reweighting existing voters is out of scope until S6 and needs the owner's approval. |
| G-4 | A new indicator is accepted only if its data is **reliable, regularly updated and accurate**: verified from the provider's own response, fresh, with a clear licence. Otherwise record it as rejected in `VERIFIED-SOURCES.md` and move on. |
| G-5 | New scored items start as **context-only** (shadow mode). Promotion to voting happens only in S6, after a backtest and with the owner's approval. |
| G-6 | Australia gets the deepest coverage, including every important Australian index. New Zealand is included **only if the data shows it is genuinely connected** (S6 requires measured evidence). Other regions only as far as they explain world conditions. |
| G-7 | Stay on the **Cloudflare free plan**. No paid upgrade is available now. |
| G-8 | Commit **directly to `main`**. Deploy yourself. |
| G-9 | The owner decides when sessions run. Sessions last 1 to several hours. |
| G-10 | The US Treasury foreign-holders table is the owner's top-priority new feature (S2). |

## 1. Explicit overrides of older rules (this program only)

| Older rule | Override |
|---|---|
| `RULES.md` 4.1.1 "Do not ask questions" | Keep that default. Ask the owner only for: missing credentials, a destructive/irreversible action, a licence/risk acceptance (`owner_accepts`), or the promotion list in S6. |
| `RULES.md` 4.1.2 "Work on branch `insights-rebuild`, never deploy, never push to main" | **Superseded.** Work on `main`, push after every milestone, deploy after every milestone (§3). |
| `AGENT_RUNBOOK.md` phase list | Historical. Not part of this program. |
| `AGENTS.md` "Phase discipline" gates | Not applicable here. The milestone gates in each spec replace them. |

## 2. Secrets and credentials (non-negotiable)

1. **Never write a secret into any file, commit, log, command line shown in output, issue, PR, spec or chat.** The repo is public. `pnpm gates` gate 0 scans for secret shapes and fails the build.
2. Credentials come from the **environment** only: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exported by the owner in the shell that starts the session (as in `docs/DEPLOY.md` Prerequisites). Git push uses the owner's existing git authentication (credential manager or `gh auth`). The EODHD key and other runtime secrets already live in Cloudflare Worker secrets; do not read or print them.
3. If a credential is missing, **stop and ask the owner to export it**. Never ask the owner to paste a secret into chat.
4. **Precondition for S1:** on 2026-10-31 the owner pasted live Cloudflare tokens, a GitHub token and the EODHD key into a planning chat. All must be rotated before work starts. S1-M1.1 verifies and records this (without printing any secret value).
5. Use `printf '%s'` (never `echo`) when piping a value into `wrangler secret put`.

## 3. Git, deploy and verification loop (every milestone)

```
1. git pull --rebase origin main          # the owner and other sessions also push to main
2. implement (tests first, §6)
3. pnpm gates                              # CI is red account-wide; gates is the real gate
4. git add -A && git commit                # one commit per milestone (more if large)
5. git pull --rebase origin main && git push origin main
6. deploy (§3.2) and verify (§3.3)
7. update docs/gap-closure/PROGRESS.md (tick milestone, add evidence) + CHANGELOG.md entry
8. commit + push the progress update
```

### 3.1 Commit style
Subject: imperative, capitalised, about 50 characters, no trailing period,
prefixed `gap(S2-M3):`. Add a body only when it gives useful information
(deviation, risk, measured numbers). Detail belongs in CHANGELOG.md.

### 3.2 Deploy
Per `docs/DEPLOY.md`:
```sh
pnpm --filter @currena/web build
pnpm --filter @currena/api exec wrangler deploy        # always `exec wrangler deploy`
pnpm --filter @currena/markets exec wrangler deploy    # ONLY if apps/markets changed
```
Record the deployed worker version id in PROGRESS.md. Never run `pnpm --filter @currena/api deploy` (collides with pnpm's built-in).

### 3.3 Post-deploy verification (mandatory, every deploy)
1. `curl` the DEPLOY.md smoke checks (`/api/health`, `/api/insights` status 200, `generatedAt` current).
2. Fetch `/api/insights` and confirm every id touched by the milestone is present with a plausible value, `asOf`, `sourceName`, and `status` not `unavailable`.
3. Load `https://currena.ir/insights` in a real browser (Playwright is available to the agent) in **EN and fa (RTL)**, at 360 and 1200 px; confirm no console errors and the new card/section renders; save a screenshot to `docs/gap-closure/evidence/<milestone>/`.
4. If anything fails: **roll back immediately** (`wrangler rollback`, see DEPLOY.md "Rollback"), record the failure in PROGRESS.md as `blocked`, fix on the next attempt. Never leave a broken production deploy overnight.
5. Cron-fed data: after a deploy that adds an ingest rung, wait for (or manually trigger per DEPLOY.md) the rung and confirm the KV key exists and validates. Report KV reads, KV writes and subrequests per rung.

### 3.4 Parallel work warning
The owner also runs other streams (for example the "Gold Program", merged into `main` on 2026-10-31). Do not edit the gold files (`gold-score.ts`, `gold-backtest-*`, `docs/insights/*GOLD*`). Before editing a shared file (`definitions.ts`, `AGENTS.md`, `CHANGELOG.md`, `docs/INDICATORS_AND_DATA_SOURCES.md`, i18n dictionaries), `git pull --rebase` and re-read it. Prior sessions lost work to parallel overwrites (DEPLOY.md 2026-10-23c).

## 4. Free-tier budget (verified from the repo docs, 2026-10-31)

| Limit | Value | Current use | Rule |
|---|---|---|---|
| Subrequests per invocation | 50 | `main` rung ~49/50 (full) | **Never add fetches to `main`.** Add new rungs in `apps/api/src/insights-ingest-cron.ts` using the existing minute-cron hour+minute gates. |
| KV writes per day | 1,000 | ~55 | Stay under 150/day total after this program. Combine histories into few large keys. |
| KV reads per day | 100,000 | page serve = 1 read per request | Never add per-request KV reads. New public endpoints read exactly one key. |
| Cron triggers (account) | 5 | api uses 1, markets uses 3 (4 of 5) | **Do not add cron triggers.** Use gates inside the api minute-cron. |
| EODHD free plan | about 20 calls/day | markets worker already uses it | New indices use the Yahoo fallback path (L2, owner-accepted) or batch calls. Prove the quota arithmetic before adding any EODHD call. |
| CPU time per invocation | small (an earlier `exceededCpu` death forced the history split) | rungs are split | Keep each rung light; measure. |

Each milestone that touches ingestion reports: new subrequests per rung, KV reads, KV writes, and the rung gate time.

## 5. Truth, licence and wording (summary of RULES.md)

- Never invent a series id, URL, column name, threshold, number or licence term. Verify in the provider's own response; otherwise mark "not verified" and do not ship the card.
- Every new source needs: a licence level (L0 to L3) from its own terms (lines quoted, date read) in `docs/insights/LICENCES.md` and `RISK_REGISTER.md`; a method card in `SCRAPING_SPEC.md`; an entry in `packages/insights/src/sources.ts` (`SOURCE_RISK_REGISTER`) and `licences.ts`. A **new L2 source starts with `owner_accepts = false`**: build it, leave it disabled, list it for the owner.
- Never circumvent a block (no proxies, spoofed identities, stealth, CAPTCHA tricks). A 403/429/bot-check means "blocked". A different legitimate venue (for example GitHub Actions egress) is allowed and is how RBA data was originally fetched.
- Stale, duplicate or unverified inputs produce a stale tag or "can't tell right now", never a verdict.
- Wording: describe conditions only. No forecasts, no buy/sell language, no causes from the news. "Japan's holdings fell by $X" is fine; "Japan is dumping Treasuries because of ..." is not.

## 6. Engineering rules

1. TypeScript strict. Business logic stays platform-neutral (see AGENTS.md rules 1 to 4). Anything crossing a trust boundary is zod-validated; an upstream layout change must fail loudly.
2. **Tests first.** Fixtures live under `packages/insights/fixtures/`. Tests never hit live sites. Record the real response once (read-only), save it as a fixture, and test the parser against it.
3. Parsers must **validate shape and fail closed**: column count, header text, units, date format, plausible ranges. A silently misparsed table is worse than a missing one.
4. Run `pnpm gates` before every deploy. It must be green.

## 7. The "add an indicator" recipe (AGENTS.md maintenance rule, expanded)

For every new id:
1. Edit `packages/insights/src/definitions.ts` (or markets/fx definitions). `voter: false` unless S6 promotes it.
2. Source adapter + parser + fixture + tests (§6). Licence records (§5).
3. Cadence, `maxAge` (staleAfterDays), history handling (periodic vs daily history rung).
4. `pnpm registry:generate` (refreshes `data/indicators.json`, `indicator-audit.json`, `site-mode-overrides.json`).
5. Layer-1 plain-language copy **in EN and fa**: `apps/web/src/i18n/insights-copy-en.ts` and `insights-copy-fa.ts` (`layer1.indicators[id]`, glossary terms). The layer-1 validator fails the build if missing. Persian copy is audit-gated: run `pnpm copy:audit`, review, then `pnpm copy:audit:update` (see `docs/localization/persian-copy-workflow.md`). No em dashes in fa copy. Numbers via `Intl.NumberFormat`.
6. Narrator vocabulary: `pnpm narrator:vocabulary` then `pnpm narrator:vocabulary:check` (the Layer-2 AI summary must know the new ids).
7. Update `AGENTS.md` §A inventory and `docs/INDICATORS_AND_DATA_SOURCES.md` §1 and §2 tables, and bump the counts.
8. `CHANGELOG.md` entry. `docs/gap-closure/PROGRESS.md` tick.

## 8. Definition of done (every milestone)

- [ ] Acceptance criteria in the spec met and evidenced (screenshot, curl output, test names).
- [ ] `pnpm gates` green; new tests fail before and pass after.
- [ ] EN + fa copy present and audited; RTL checked.
- [ ] Deployed, verified (§3.3), version id recorded.
- [ ] Docs updated (§7.7), CHANGELOG entry, PROGRESS.md ticked, everything pushed to `main`.

## 9. Stop conditions

- A blocked item after **three honest attempts**: record what failed, what was tried, what is needed (in PROGRESS.md "Blocked") and continue with the next milestone.
- Never leave `main` in a state where tests that passed before now fail, or production in a broken state.
- If a milestone's data source fails the reliability bar (G-4), mark it `rejected`, record the evidence in `VERIFIED-SOURCES.md`, and continue.

## 10. Session start and end protocol

**Start:** read `AGENTS.md`, this file, `README.md`, `PROGRESS.md`, `VERIFIED-SOURCES.md`, then the session spec. Run `pnpm install`, `pnpm gates` to establish the baseline. Confirm the credentials exist in the environment (do not print them).

**End (mandatory):**
1. Update `PROGRESS.md`: tick milestones, fill the session log row (date, commits, deployed version ids, KV/subrequest numbers, issues).
2. Update `VERIFIED-SOURCES.md` with everything learned about sources (verified, rejected, egress results).
3. Write the **next session's kickoff prompt** into `PROMPTS.md` (refined with lessons learned, exact state, any carry-over milestones), commit and push.
4. Print that prompt as the last thing in the final message, in a code block, together with a 5-line summary: what shipped, what is blocked, what the owner must do (for example approve an `owner_accepts` flag).
