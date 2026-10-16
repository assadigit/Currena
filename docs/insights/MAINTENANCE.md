# MAINTENANCE.md — the owner's weekly routine (Step 3 §11)

Ten minutes a week, plus the quarterly and per-event items. Every step
names where to look; nothing here needs the agent.

## Weekly (10 minutes)

1. **Open the status panel.** Insights → "About this data" → the status
   block (or `GET /api/insights/status` signed in). Any failed source or
   failed test? If yes, do not rely on the affected cards — they already
   show their last good value with a stale/check-pending tag.
2. **Check stale tags.** Walk the page: anything wearing "Stale" or "Check
   pending"? The daily self-check (Actions → insights-selfcheck) also lists
   them in `docs/insights/SELF_AUDIT.md`.
3. **Before acting on any reading, check its data date and source** — every
   card shows "data for {date}" and names its source in the details panel.
4. **Glance at the self-check run** (GitHub → Actions → insights-selfcheck):
   green = every test passed; red = open `SELF_AUDIT.md` in that run's
   checkout, or run `pnpm --filter @currena/insights selfcheck` locally.

## Quarterly

- **Review rule thresholds and the licence register.** Read
  `docs/insights/LICENCES.md` end to end; re-read each source's terms page
  (the register's evidence column names what to re-quote). Re-run
  `pnpm --filter @currena/insights exec tsx scripts/fred-copyright-scan.ts`
  and commit any changed records.
- **RE-CONFIRM the 2026-10-19e owner directive**: the four prices tiles
  (brent, gold-usd, silver-usd, btc-usd) are public BY OWNER DECISION —
  `OWNER_PUBLIC_DISPLAY_OVERRIDE` in `scripts/generate-indicators-registry.ts`
  lifts the Yahoo-leg display bar (not a terms re-verification). Ask the
  owner each quarter whether the decision stands; if it is withdrawn,
  delete the override entry and re-run the generator (the pin test will
  correctly fail until the JSONs are regenerated).
- **Review the registry**: `data/indicators.json` is generated — change the
  sources (`packages/insights/src/definitions.ts`) and run
  `pnpm registry:generate`, never the JSON by hand.

## After any provider announces a change (terms, API, series)

1. Update the register (`packages/insights/src/licences.ts`) or the adapter.
2. Re-run the tests: `corepack pnpm -r test`.
3. Commit on a branch; the self-check and CI validate before any deploy.

## Manual-entry values (defect E-08's monthly step)

The manual files live in `data/manual/` (currently `china-pmi.json`).
Each carries `enteredOn` (when you last confirmed the values) and `expires`
(the NEXT scheduled release). After the publisher's release:

1. Fetch the new value from the publisher's own page (China NBS PMI: the
   monthly manufacturing PMI, released on the 31st of the month).
2. Edit `data/manual/china-pmi.json`: add the observation, update
   `enteredOn` to today and `expires` to the NEXT release date.
3. Commit — the next ingest picks it up. An expired file makes its card
   read stale with an E-08 reason (never silently fresh).

If the page's E-08 flag fires, the file was not updated in time — update it
and the next run clears the tag.

## B-14/E-14 companion check (CPI day)

After the US CPI release, compare the page's headline number with the BLS
publication (the NSA basis, `CPIAUCNS`). A mismatch means the series or the
release-date schedule needs attention — record it and re-run the tests.
