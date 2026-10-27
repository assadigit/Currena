# MAINTENANCE.md — the owner's weekly routine (v3, runbook Phase 8)

Ten minutes a week, plus the quarterly and per-event items. Every step names
where to look; nothing here needs the agent.

## Weekly (10 minutes)

1. **Open the status panel.** Insights → "About this data" → the status
   block (signed in: `GET /api/insights/status` shows the full document).
   Any failed source or failed test? If yes, do not rely on the affected
   cards — they already show their last good value with a stale or
   can't-tell tag.
2. **Check the data-health chip** in the header: "All data current" is the
   green state; "N stale" / "N unavailable" jumps to the About list.
3. **Check stale and can't-tell tags** by walking the page. The daily
   self-check also lists them in `docs/insights/SELF_AUDIT.md`
   (GitHub → Actions → insights-selfcheck; green = every test passed).
4. **Before acting on any reading, check its data date and source** — every
   card's meta row names the data period, the update time (UTC) and the
   source link.
5. **Glance at the Farsi strings flagged needs-review** (quarterly at most —
   the manifest's QUEUED list): view the page in فارسی and confirm the new
   copy reads well; when happy, flip the entries to processed with
   `node scripts/update-persian-copy-manifest.mjs --ids <ids> --status
   processed --round <round> --reference <your review note>`.

## Quarterly

- **Review rule thresholds and the licence register.** Read
  `docs/insights/LICENCES.md` end to end; re-read each source's terms page
  (the register records what to re-quote). Re-run the FRED copyright scan
  (`pnpm --filter @currena/insights exec tsx scripts/fred-copyright-scan.ts`)
  and commit any changed records.
- **RE-CONFIRM the two owner directives recorded in code:**
  1. The 2026-10-19e prices directive — the four tiles (brent, gold-usd,
     silver-usd, btc-usd) are public BY OWNER DECISION
     (`OWNER_PUBLIC_DISPLAY_OVERRIDE` in `scripts/generate-indicators-registry.ts`;
     not a terms re-verification). If withdrawn: delete the override entries,
     re-run `pnpm registry:generate` (the pin test fails until the JSONs
     regenerate — that is the discipline working).
  2. The public mode itself (`ACCESS_MODE`/`SITE_MODE` public) — still
     wanted? The panic switch (below) flips it private in minutes.
- **Review the registry**: `data/indicators.json` is generated — change the
  sources (`packages/insights/src/definitions.ts` +
  `packages/insights/src/sources.ts`) and run `pnpm registry:generate`,
  never the JSON by hand.
- **Read the fresh terms pages that could not be quoted by plain fetch**
  (recorded in RISK_REGISTER.md): ABS copyright, the ECB reuse terms, the
  World Bank terms. If a rendered read captures a verbatim clause, paste it
  into RISK_REGISTER.md + `sources.ts` termsLines and the level can be
  re-assigned with evidence.

## After any provider announces a change (terms, API, series)

1. If the change restricts reuse: set that source's `enabled` to false in
   `packages/insights/src/sources.ts` (the M-6 kill switch), re-run
   `pnpm registry:generate`, commit, deploy. The source's cards vanish on
   the next refresh.
2. If a provider objects to the public page: the panic switch —
   `ACCESS_MODE=private` (or `PANIC_PRIVATE=true`) re-arms the login gate on
   every Insights data endpoint within one refresh cycle; or flip it
   live from the owner tools (POST /api/insights/mode with the owner token).
3. Update the register (`sources.ts` + `RISK_REGISTER.md`) and re-run the
   tests (`pnpm -r test`), then commit on a branch; CI validates before any
   deploy.

## Manual-entry values (defect E-08's monthly step)

The manual files live in `data/manual/` (currently `china-pmi.json`). Each
carries `enteredOn` (when you last confirmed the values) and `expires` (the
NEXT scheduled release). After the publisher's release:

### China NBS PMI (monthly, released on the 31st; the next release date is
### the current file's `expires` value — read it there)
1. Open the NBS release page (the link is the card's source link).
2. Edit `data/manual/china-pmi.json`: add the observation, update
   `enteredOn` to today and `expires` to the NEXT release date.
3. Commit — the next ingest picks it up. An expired file makes its card
   read stale with the E-08 reason (never silently fresh).

### Westpac–Melbourne Institute Consumer Sentiment (FS-03, once enabled)
Same mechanism (`data/manual/westpac-mi.json`): released monthly, usually
the second Wednesday of the month (the Melbourne Institute home page — the
card's source link — names the date); `expires` = the next release.
Until you set `owner_accepts: yes` in RISK_REGISTER.md the card stays
hidden and no values are entered.

### Shiller dataset (FS-06 — automated, but watch the Action)
The monthly `shiller-fetch` Action (the 5th, 04:35 UTC) downloads the
provider's own `ie_data.xls`, converts it and commits
`data/shiller/shiller-cape.json` + the dated archive copy. If the run goes
red: open the Action log — the common cause is the provider's CDN link
rotating (the fetcher discovers it from the provider's own home page each
run) or a layout change (the converter refuses to guess; re-verify the
column indexes against the file). Until `owner_accepts: yes` the cards
stay hidden even though the archive keeps growing.

## B-14/E-14 companion check (US CPI day)

After the US CPI release, compare the page's headline number with the BLS
publication (the NSA basis, `CPIAUCNS`). A mismatch means the series or the
release-date schedule needs attention — record it and re-run the tests.

## The global companies table (R10-3, 2026-10-28 — flag OFF)

The companies table below the markets tiles is pre-built behind a feature
flag. While the flag is OFF (the shipped default), the UI renders the
empty-state panel; no live calls fire; no cron rung is wired. The flag
lives in `apps/web/src/components/insights/config/companies.ts`
(`COMPANIES_TABLE_ENABLED = false`). When the owner upgrades the EODHD
plan (the free plan's 20 calls/day quota is the blocker), the flip is a
one-line change + wiring the `companies` fetch rung on the markets worker
(the procedure is in the config file's header comment +
`docs/insights/ROUND10_REPORT.md` R10-3). Until then: nothing to do — the
empty-state panel is the honest "this feature is not yet enabled" surface.

## The daily machinery (for reference — nothing to do)

- 04:20 UTC `insights-ingest` (fetch → validate → publish); the Worker's
  :40 watchdog re-dispatches it if GitHub's schedule dies.
- 04:35 UTC (monthly, the 5th) `shiller-fetch`.
- 04:50 UTC `insights-selfcheck` (writes SELF_AUDIT.md + the dated export;
  publishes nothing; red on any failing test).
- 23:30/01:30 UTC the markets/fx board refresh (its own Worker).
- :13 each hour the live prices refresh (public mode: skipped).
