# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

## [2026-10-24b] — the market view switch grows the weekly and monthly lenses (round 46)

The owner: *"Ok now they're back add monthly and weekly views of how
percentages changed as well. I mean for here: [the Insights page's market
view switch radiogroup]"* — the section's lens switch offered Today / 3
months / From 52-week high; round 46 adds the two missing durations.

### What changed

- **`chg1w` joins the contract** (`MarketEntry`, OPTIONAL like `chg1m`):
  last close vs the last close on/before the same date one week earlier —
  the same rolling-anchor rule chg1m (−30d) and chg3m (−90d) use. A stored
  row without it renders the honest dash (—), never a guess; `chg1m`
  (already live for the currencies rules) now also serves the monthly lens.
- **The view switch** reads **Today | 1 week | 1 month | 3 months | From
  52-week high** — ascending duration, the 52-week distance last; the
  default stays the NORMAL 3-month timeframe (owner round 44).
- **The full table** (desktop + the mobile list) gains a 1-week and a
  1-month column beside Today — the same lenses the switch offers.
- **The Tools-menu CSV** appends Week/Month columns at the END (the file's
  own stable-positional-API rule); a missing lens exports an empty field,
  never a guessed zero.
- **The full export** (MD/TXT/CSV/XLSX) carries the lenses on the EXISTING
  flat slots 7 (`change7d`) and 10 (`chg1m`) — no flat position moves.
- **Six new Persian strings** (views, table headers, CSV columns), triaged
  round-46 in the copy manifest — the fx table's span convention («یک
  هفته»/«یک ماه»), the markets table's «بازده» prefix, CSV's «(درصد)»
  suffix. copy:audit clean.

### The weekend backfill (why a new runner)

`markets-run` held all 16 rows (R5 same-date stability — the weekend
closes are identical to the stored ones), which would have left the
weekly lens honest-dashed until Monday's cron. The new one-off
`markets-backfill` script resolves every row with prev=undefined (fresh
live provider answers; the closes measured 0.000% from stored) and writes
through the SAME write-only-if-changed gate against the true stored
snapshot. The KV key is never deleted (no "being prepared" window).
Verified after write: 16/16 stored rows carry both lenses.

### Budgets (bumped with justification, never silently)

- Route payload 12 KB → **13 KB**: live after the backfill 12,225 B,
  realistic fixture 12,370 B — the old ceiling left 63 B of slack, so any
  future contract field or a 17th market would breach it.
- Insights lazy chunk 608.00 → **609.00 kB raw** (measured 608.78 raw /
  145.54 gz — gzip-neutral vs the 145.60 budget; the raw overage is
  localized label wording, not logic).

### Gates + verified

- Tests 1,489 green (+3: the buildEntry anchor/window ladder, the round-46
  copy parity, the full-export lens columns), typecheck 6/6, lint 0
  errors / 15 accepted advisories, copy:audit clean, T-15 (public)
  passed, bundle budgets held.
- Deployed `currena-markets` `0135290c` (crons now compute chg1w) and
  `currena-api` `36a4eeab` (serve path passes chg1w; fresh SPA rides it).
- Browser-verified on currena.ir/insights (EN + FA, 1280 + 375): the
  five-lens switch, tile values matching `GET /api/insights/markets` on
  every lens (e.g. Nikkei −5.4% weekly vs API −5.37; +2.2% monthly vs
  2.19), the 9-column table, Persian digits (−۵٫۴٪), zero console
  errors, scrollWidth === viewport at both widths; VLM visual QA clean.
  Evidence: `docs/evidence/2026-10-24b-market-lenses/`.
## [2026-10-18c] — the deploy-record reconciliation (no code change)

The owner: *"It seems like you didn't push commit deploy yet."* — verified
end-to-end that this was a **documentation gap, not a missing deploy**: every
commit on main was pushed AND the newest code was already live; the 2026-10-18b
session had simply recorded its deploys in CHANGELOG + its evidence README
instead of DEPLOY.md, so the runbook's newest visible deploy entry was the
redesign's `d93bd0ba`.

- **Cloudflare-confirmed**: active currena-api version
  `9f66a82c-d0d4-494e-a3cd-524eac3b557b` at 100% (deployment `7c2a2526`,
  2026-10-17T16:51:58Z), preceded by `c476307f` — the public-restore lineage.
- **Byte-identical proof**: a fresh web build of main @ `4d339b5` yields
  `index-ChVkduNn.js` (sha256 `c06ff8db…`) + `Insights-BwhME956.js`
  (sha256 `cbb6da44…`) — hashes identical to the live-served chunks; the
  deployment matches main exactly.
- **Re-verified live** (agent-browser, fresh context): hero grayscale both
  themes, Australia-left/Global-right at 1280, markets section renders,
  tile rule round-trip EN+fa, fa RTL + Persian digits, no h-overflow at
  1280/360, keyboard `/` + Escape, zero console errors — evidence in
  `docs/insights/screenshots/economic-indicators-redesign/final-continuation/`.
- **DEPLOY.md** gains a "CURRENT DEPLOYMENT" section recording the whole
  lineage (redesign `d93bd0ba` → PWA fix → public restore `c476307f` →
  `9f66a82c`) so top-down readers see the true current state. No worker
  re-deploy needed: main and production are byte-identical.
