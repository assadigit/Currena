# Currena — Next Session Brief

Hand-off date: 2026-10-17 (edge-verified; see the dating note) — the
prices polish — DONE: signed percentages speak the status inks
(positive green `--color-status-normal`, negative red
`--color-status-alert`, zero/absent neutral) on the prices-board rows,
the 6m/1y fact bullets and the hero mover; titles enlarged (prices-board
tile names 18px bold primary, metal chip names 20px bold primary with
the price staying lighter); EN `signals.metals` capitalized
(Gold/Silver — chips, rows, collapsed lines, export Name column); the
hero's big-move bidi glitch fixed structurally with `formatChangeParts`
(the signed number keeps its ltr island, the word unit «واحد درصد»/'pts'
rides outside — fa reads «+۰٫۲۵ واحد درصد ۳۰ روز», EN "+0.25 pts
30-day"); the hero's N2 disclaimer + «درباره این داده‌ها ↧» button
retired (the page-bottom About section keeps the full text; the global
footer carries the app-wide non-advice disclaimer; nav chips still jump
to About). NO fa string changed — no manifest touch. Gates green (1,455
tests; typecheck 6/6; lint 0 errors/15 advisories; budgets held — entry
295.15/88.76, Insights lazy 597.50/142.51). Deployed currena-api
`8caff087-39fd-4026-b6ad-3274fa5ff77b`; production verified (sign
colors sampled live, sizes, "Gold" capitalized, mover order correct in
both locales, role="note" ×0 at the top, 375 scrollWidth === 375, zero
errors). See CHANGELOG 2026-10-17d +
docs/evidence/2026-10-17d-prices-polish/.

Prior state (2026-10-17c): the owner's Persian dollar convention —
DONE: fa says «دلار» for USD, never
«دلار آمریکا» — the unqualified word is what Persian financial usage
already means — with dollar nationality RESERVED to «دلار استرالیا»
(AUD) and «دلار کانادا» (CAD). 114 tracked strings re-triaged (manifest
round-47 → docs/QA/quirks-2026-10-17c-fa-dollar-convention.md); NZD also
drops its qualifier per the rule's second clause (picker rows keep the
code: «NZD · دلار» — one-line revert in `fa.ts` `currencies.NZD` if the
owner wants it back); cents untouched («۶۲ سنت آمریکا»); EN untouched.
Tests re-pinned (live-rate, fx-presentation, insights, fx-v13). Gates
green (1,455 tests; typecheck 6/6; lint 0 errors/15 advisories; budgets
held — Insights lazy SHRANK 599.38 → 597.79 kB raw with the dropped
qualifier). Deployed currena-api `c970f556-0070-4fc9-a7ab-98e653461857`;
served chunks sha256-identical; «دلار آمریکا» ×0 in both served bundles;
production browser-verified (fa home + insights × desktop + 375 — tile
unit «دلار», 52-week tail «… دلار», metals chip «۴٬۱۶۵ دلار» + the
Task-17 outlook sentence, fx «قدرت دلار»; EN regression clean; zero
errors). See CHANGELOG 2026-10-17c +
docs/QA/quirks-2026-10-17c-fa-dollar-convention.md +
docs/evidence/2026-10-17c-fa-dollar-convention/.

Prior state (2026-10-17b): the owner's prices-board redesign — DONE: the four price cards (Bitcoin /
Silver / Gold / Brent) speak the owner's five-point sketch: "1. Picture
next to Unit name and price 2. Daily / Weekly / Monthly/ Quarterly
Percentages 3. Descriptions and verdict 4. some more meta data facts and
percentages (must be in bullet point) 5. very small text showing update
time." One rebuilt PricesBoard anatomy, mobile AND desktop, RTL-mirrored:
the tinted artwork sits BESIDE the big digits + name (fa's unit drops to
its own small line UNDER the digits — beside it brent's fa price wrapped
while gold's did not, breaking the alignment decree); FOUR percentage
rows (daily/weekly/monthly/quarterly — the feed's change7d/30d/90d cover
three, the daily row derives); a "Description" heading row with the
price-position verdict word at its end; fact bullets (6-month change,
1-year change, 52-week range via the new price-stats.ts — history-
internal numbers, ≤3-day nearest-point rule, the last point can no
longer be its own reference (the old hook could fabricate a 0% change),
≥300-day span gate for the "52-week" name — then the existing context
lines as bullets); the as-of line at 10px pinned with mt-auto. 9 new
copy keys both locales; manifest round-46 (9 NEW →
docs/QA/quirks-2026-10-17-prices-card-redesign.md); days7/days30
untouched (AlertCard/HeroBlock/CompactRow still speak them). UI-only; no
data/scoring/API change; the metals analysis chips (Tasks 15–17) and the
money panel untouched. Gates green (1,455 tests, +9 price-stats;
typecheck 6/6; lint 0 errors/15 advisories; budgets held — Insights lazy
599.38/142.60 gz, +0.77 under the cap). Deployed currena-api
`0652db45-3fc2-418f-87c2-bb06caa51e5c`; production browser-verified with
agent-browser (PURGE the PWA precache before re-verifying a new deploy —
the stale service worker silently serves the old chunk and fakes the
first check; verify the loaded chunk hash, not the deploy log): served
chunk Insights-E8NrMws9.js sha256-identical (f3a0d27c…); EN + fa ×
desktop + mobile all render the sketch; 375 scrollWidth === 375 both
locales; details panel opens/closes from a tile; zero errors;
/api/insights → 32 readings (gold-aud honestly absent this snapshot — no
A$ bullet). See CHANGELOG 2026-10-17b +
docs/QA/quirks-2026-10-17-prices-card-redesign.md +
docs/evidence/2026-10-17-prices-card-redesign/.

DATING NOTE: the Cloudflare edge Date header and the machine clock agree
the session date is 2026-10-17 — the repo's 2026-10-20/21 entries were
future-dated by earlier sessions. Keep appending in file order; the
changelog disambiguates same-day sections with letter suffixes.

Prior state (2026-10-21): the owner's EN/fa drift bug + "Gold Market
Outlook — Complete State List" — DONE: the metals' verdict slot speaks
the owner's SEVEN states (Strong Bullish / Bullish / Neutral /
Range-Bound / Bearish / Strong Bearish / Mixed Signals) with the owner's
own bilingual sentences. `outlookOf` (signals/verdict.tsx) maps the
condition tally: strong bar = the lean's LEAN_STRONG=4 (exported from
@currena/insights); majority → bullish/bearish; equal split → mixed;
all-readable-neutral → neutral; range-bound ONLY with |change30d| < 2%
AND the typical 10-year band (the owner's Neutral ≠ Range-Bound ≠ Mixed
distinction, honoured mechanically). verdictUp/Down/Flat retired (the fa
drift WAS the bug); round-45 manifest 21 NEW + 2 CHANGED + 3 REMOVED;
verdictTitle → "Outlook"/«چشم‌انداز»; the sentence rides its own
full-width chip line (the header slot staircase-wrapped at 375px on the
first deploy). Gates green (1,446 tests, +15; typecheck 6/6; lint 0
errors/15 advisories; budgets held — Insights lazy 596.60/141.83,
+0.53 kB gz). Deployed currena-api `d0d28c3f`; production verified with
agent-browser. Live bearish on both metals; EN + fa render the same
state; collapsed "Outlook: Bearish"/«چشم‌انداز: نزولی»; 375 clean; zero
errors. See CHANGELOG 2026-10-21 +
docs/QA/quirks-2026-10-21-outlook-states.md +
docs/evidence/2026-10-21-outlook-states/.
Prior state (2026-10-20c): the owner's "Add 10 year View of the gold and
Prior state (2026-10-20c): the owner's "Add 10 year View of the gold and
silver price as well." — DONE: the metals' Estimation-chip trend charts
offer the decade. The shared TrendPanel gained an opt-in `ranges` prop
(default Quarter · 1y · 5y — the money panel and all other callers
UNCHANGED); TrendRange/StripRange grew '10y' (3653 days — the details
panel's exact window) reusing the EXISTING range10y copy key
('10 years' / «۱۰ سال», zero new strings); MetalTrendChart opts in → both
gold/silver analysis chips show Quarter · 1 year · 5 years · 10 years.
Pre-flight verified the feed already serves the full decade (gold 2514 /
silver 2513 points, 2016-10-18 → 2026-10-16) — no API/data change.
Gates green (1,431 tests; typecheck 6/6; lint 0 errors/15 advisories;
budgets held, Insights lazy 593.58/141.30, +0.07 kB gz). Deployed
currena-api `4e8a54e0`; production browser-verified (agent-browser): EN
desktop — 10 years active on both metals, ticks Oct 2016/Oct 2021/Oct
2026, deltas +230.3%/+225.6% "10 years", muted header prices intact,
money panel still 3 chips; EN mobile 375 identical, no overflow; fa RTL —
«۱۰ سال» chip, Persian-digit deltas, Jalali ticks; zero errors. See
CHANGELOG 2026-10-20c + docs/evidence/2026-10-20-metals-10y/.
Prior state (2026-10-20b): the owner's drawn UI for the gold/silver
"Conditions right now" chips — DONE: the chips are analysis cards now —
header row (boxed artwork 56/64px · name + verdict · the current price in
the MUTED secondary ink at the far end) over ONE BIG trend chart (h-40
mobile / h-52 desktop, was h-20); the artwork-column side split is gone →
ONE anatomy for mobile AND desktop ("do the same for mobile view").
MergedCard passes the metals' display prices from the same snapshot
readings. No copy, no data change. Gates green (1,431 tests; lint 0
errors after renaming the prior round's minified evidence capture
prod-Insights-chunk.js → .js.txt — ESLint was linting it; budgets held,
Insights lazy 593.51/141.27). Deployed currena-api `757cb15b`;
production browser-verified (EN desktop plot 208px + muted header
prices; mobile 375 identical, no overflow; fa RTL mirrors the sketch;
zero errors). See CHANGELOG 2026-10-20b +
docs/evidence/2026-10-20-verdict-chip-redesign/.
Prior state (2026-10-20): the "Know before you buy US shares" <details>
box removed entirely at the owner's direct request (UsSharesNotesBox +
render + import gone; the four usShares* copy keys retired; manifest
pruned; deployed `e6d18811`; production verified 0 occurrences, prices
board intact).
Prior state (2026-10-19f): the SPARKLINE HONESTY round — the owner's
screenshot report on the USD→IRT converter sparkline ("irregular …
like a placeholder or buggy") fixed in three honest layers (record
deadband 0.05% vs last RECORDED level; drawn-line bucketMean(≤48) with
RAW trend/range/count chips; Sparkline domain padded to ≥2.5% of
level) + a one-time KV prune (tgju 240 → 188). Deployed `ed79e2cc`
from `9724040`; 1,431 tests green.
Prior state (2026-10-19e): the PRICES RESTORE — the owner's "Still
there aren't GOLD BITCOIN SILVER price… a dedicated nice section with
images" resolved by OWNER_PUBLIC_DISPLAY_OVERRIDE for exactly {brent,
gold-usd, silver-usd, btc-usd}; hidden set 24 → 20; the four tiles
render WITH images; the money panel's "Petrol and transport" row
returned. The Oct-19b licence-cautious hide remains for the world
boards + other non-'yes' indicators (T-15 passes in public mode); the
ingest watchdog ships (2026-10-19d).
The prior 2026-10-19b session flipped Insights PUBLIC (owner decree:
SITE_MODE=public deployed `36d76363`; the licence-legal projection only
— 27 of 51 readings; the EODHD/Yahoo world boards + 24 non-'yes'
indicators hidden via the generated data/site-mode-overrides.json; T-15
passes in public mode). The 2026-10-19 session shipped the insights
rebuild itself (b137f3ef from 1f70552) — see CHANGELOG 2026-10-19,
docs/DEPLOY.md's session records and docs/evidence/.
· **STANDING ORDER (OWNER_SETUP §10, 2026-10-19c): every completed
  round AUTO-commits, pushes and deploys — no per-round approval gate.**
  Gates before push, deploy smoke before "done", evidence in
  docs/evidence/ — the discipline stays.
· Production: https://currena.ir — the Insights page is PUBLIC:
  no gate screen; the API serves the projection keys only; /markets +
  /fx answer 404 hidden_site_mode. The INSIGHTS_PASSWORD secret stays
  set — SITE_MODE='private' re-arms the gate instantly (12h cookie
  session).
· The AGENT_RUNBOOK commission, the export-fix, rounds 42/43/44 and
  the quirk-pass commissions are all CLOSED. Do not reopen declined
  items.

---

## 0. This session's commission — TBD by the owner

No pre-staged spec for the next wave. When the owner assigns it, start
from: (a) the remaining owner-side / not-verified items below, (b)
whatever new commission arrives. If asked to "keep polishing", the QA
reports' "also checked, already clean" lists are the honest floor — do
not invent work against the deliberate-KEEP decisions. IMPORTANT since
2026-10-19: `main` == `insights-rebuild` — start NEW work on a NEW
branch off `main`.

## 1. What this project is

**Currena** — a bilingual (en/fa, RTL) currency-converter PWA for
Iranian open-market **Toman** rates + international pairs + a weekly
**Insights** product, at **https://currena.ir**, entirely on Cloudflare
Workers (Free plan, permanently — see the I0 gate decision).

- `apps/api` — Hono on Workers (`/api/*`, zero-JS `/admin`, serves the
  built SPA). Cron `* * * * *` keep-warms the live rates ladder; the
  `:13` minute rung refreshes Insights live prices. Since
  2026-10-19 it also runs the PRIVATE GATE (`src/insights-auth.ts`):
  HMAC-signed 12h HttpOnly cookie, rate-limited login, fail-closed
  when `INSIGHTS_PASSWORD` is unset, `SITE_MODE` var (stays
  `private` — flipping to `public` removes the gate AND fails the
  build via T-15, `scripts/check-site-mode.mjs`).
- `apps/markets` — source scrapers + daily snapshot crons. Deployed
  `9b5ff7e0` is current — untouched since 2026-10-15.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router,
  routes: Converter, LiveRates, History, BatchConverter, Calculator,
  Splitter, Settle, Receipt, About, Insights) en/fa RTL, light+dark.
  Insights is a lazy chunk (594.49/141.54 vs 604/142.8 budget).
- `packages/core` — zod contracts (`schemas.ts` — **storage
  compatibility is sacred**; the runbook added the additive
  quarterly periodStart/End fields).
- `packages/insights` — compute engine: the indicator registry,
  scoring, validation (T-01…T-14), connections, gauges, adapters,
  the licence register (`src/licences.ts`).
- `packages/scraper` — TGJU + Frankfurter + … source scrapers.
- `data/` — `indicators.json` (51-entry registry + the runbook's
  licence fields, generated — CI-pinned), `indicator-audit.json`
  (generated sidecar), `policy-decisions.json`, context-notes slot.
- Ingest: the `insights-ingest` GHA (04:20 UTC daily) fetches →
  validates → publishes to KV (budget 55 reads / 31 writes / 49
  outside requests per refresh). `insights-selfcheck` GHA (04:50 UTC)
  runs the self-audit daily and publishes nothing.

**Read before touching anything:** `AGENTS.md` (root) — TS strict,
zod at every boundary, RTL/LTR native, **TOMAN canonical**, tests
never hit live sites, secrets never persisted. Then this file,
`docs/PROGRESS.md`, `docs/DECISIONS_FOR_ALI.md` (D-01…D-27),
`docs/DEPLOY.md`, `docs/insights/AGENT_RUNBOOK.md` + its four spec
files (the authority order: runbook → STEP3 → DEFECTS → FIX_SPEC),
`FIX_REPORT.md`, `STEP3_REPORT.md`, `MAINTENANCE.md`, `OWNER_SETUP.md`.

## 2. Current verified state (2026-10-19e close)

- Gates green at close: **1,419 tests** (core 191 · scraper 67 ·
  insights 462 · markets 13 · api 233 · web 453), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.78/89.39 vs 296/89.5; Insights lazy **594.68/142.02**
  vs 604/142.8; the export builders remain separate lazy chunks —
  full-export + xlsx-writer + panel, none budget-tracked).
- Production = currena-api **`d40211f9`** from HEAD `81ca3e3` (+ docs
  wrap-up); currena-markets `9b5ff7e0`. Repo: `main` ==
  `insights-rebuild` (new work branches off `main`).
- **The prices board is PUBLIC again (owner directive 2026-10-19e)**:
  the projection serves 32 readings; the four tiles render with their
  icons; the OTHER price ids (gold-aud, copper-usd, copper-gold,
  gold-silver) + vix + the 16 world indices stay hidden — the quarterly
  licence review must RE-CONFIRM the owner directive (the evidence note
  on every overridden card says so).
- **The ingest watchdog is LIVE** (ingest-watchdog.ts): the cron's :40
  hourly rung re-dispatches insights-ingest when the snapshot is >26 h
  old (6 h nudge bound via insights:ingest-nudge:v1);
  `GH_INGEST_DISPATCH_TOKEN` is set on the Worker — it MUST ride the
  owner's token rotation (a dead token = the watchdog degrades to the
  honest logged no-op, never a crash).
- **The ingest GHA schedule is watch-listed**: GitHub's scheduler
  silently skipped 3 days (delays had grown to ~4h45m first); the
  watchdog now self-heals it hourly. insights-selfcheck's schedule has
  NEVER fired (registered 2026-10-19) — audit-only, no data path.
- **The page is PUBLIC (2026-10-19b; prices restored 19e)**: unauthed
  `/api/insights` → 200 `public, max-age=60` serving the projection
  keys only (32 readings, ruleVersion 2, displayMode public);
  `/markets` + `/fx` → 404 `hidden_site_mode`; the world sections stay
  hidden in the web build.
  `INSIGHTS_PASSWORD` stays set — SITE_MODE='private' re-arms the 401
  gate instantly (rotate any time with `wrangler secret put`).
- The runbook surface live: 51 scored readings + the crypto Fear &
  Greed context card (corpus 51→52), ruleVersion 2, licence register +
  generated `LICENCES.md`, the E-23/E-24 audit columns in exports,
  `insights:selfcheck` (19/19 live at Phase 5) + the daily GHA.
- Live data floor: 51 readings, ruleVersion 2, validation 14/14, no
  failed sources; archive serving; freshness chain (D-12 + D-13)
  verified intact post-deploy.
- Production DOM re-verified post-deploy (en+fa, light, 1280 + 375):
  private gate screen → sign-in → full render; CSV + XLSX downloaded
  through the real UI with zero errors (CSV = UTF-8 BOM + dense
  per-section blocks + audit columns; XLSX = valid zip, docProps,
  "Normal" style, 10 sheets); 375 px scrollWidth === 375. NOTE: the
  PWA service worker needs ONE plain reload after a deploy before the
  new bundle serves (known one-reload behaviour).
- A11y floor intact: skip link, h1s, useDialogFocus on every dialog,
  real tablists, radio-group arrows, live regions, labeled validation
  errors; the two "?" tips carry aria-expanded + aria-controls and are
  keyboard-operable.
- Crons on the account: 5-cron free-tier limit — api 1 + markets 2 +
  legacy workers 2. Re-verify before ever adding a trigger.

## 3. What is deliberately LEFT (with reasons — do not silently "fix")

1. **15 ESLint advisory warnings** (D-24) — designed patterns with
   stated reasons. Not a work item.
2. **D-25/D-26/D-27 DECIDED: all three KEEP** (2026-10-15c).
3. **Q1/Q2/Q10–Q14 declined** (2026-10-16, reasons in
   docs/QA/quirks-2026-10-16.md) — the truncating selects, the fa
   U+066B separator, KOSPI's yellow bear chip, flap-board ASCII
   digits, wrapped-title tile drift, the repeated fa header date, the
   FAB overlap. Deliberate conventions or deliberate patterns.
4. **Runbook not-verified items** (honest limits, STEP3_REPORT lists
   what unblocks each): L1-05/08/11/14 + L2-10 remain Check /
   not-verified — they stay "Link out" or hidden until their series or
   terms verify; do NOT display them as normal cards.
5. **Bundle budgets**: entry 296/89.5 (294.78/89.38 measured);
   Insights lazy **604/142.8** (594.68/142.03 measured; the export
   builders are separate lazy chunks). Any further Insights-chunk
   growth needs its own justification. The meters GRADE IN ONE HUE —
   the current step's, pale→full tints (round 44 owner decree — do
   not re-rainbow them, do not re-neutralise them).
6. **i18n copy corpora** (`insights-copy-en/fa.ts`) and
   `packages/core/src/schemas.ts` — data-file and sacred-surface;
   unchanged policy.
7. **Owner-side items**: Telegram ingest-alert secrets, the I7
   launch-approval exit gate (BACKTEST review), the signals-wording
   legal read (S3), connection-evidence confirmations, **token
   rotation** (all tokens have now transited chat across EIGHT+
   sessions — strongest rotation nudge yet), and the OWNER_SETUP §9
   housekeeping is RESOLVED (the branch fixed ci.yml).

## 4. Session workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r
   test` → `pnpm run lint` → `pnpm run copy:audit` → web build +
   `node scripts/check-bundle-budget.mjs` (run the budget script from
   the REPO ROOT — it resolves `apps/web/dist` itself). Shell gotcha:
   the tool cwd resets between calls — use `pnpm -C <dir>` /
   `git -C <path> …` and absolute paths; a bare `pnpm -r …` from the
   wrong cwd silently targets the sandbox scaffold.
2. Conventional commits, one quirk (or small coherent group) each;
   push often; **check the Actions run is green before stacking the
   next change.** CI = typecheck → lint → tests → build → budget →
   copy:audit; since 2026-10-19 it triggers on main pushes too.
3. Local verification: vite dev on the browser-reachable port
   (`:3000` in the sandbox via the platform gateway; vite proxies
   `/api` → :8787) + a read-only bun forwarder :8787 → currena.ir for
   real data; verify with agent-browser in BOTH locales + BOTH themes
   at 375 px and desktop. Background processes get reaped between
   calls — spawn detached (see the shared worklog for the
   double-detach pattern). Locale/theme switches are localStorage keys
   `currena:locale` (PLAIN `fa`/`en` — not JSON-quoted) and `theme`.
   For production DOM checks, remember the PRIVATE GATE: sign in via
   the Private page form (or POST /api/insights/login) — the password
   is the owner's INSIGHTS_PASSWORD (owner-side value; agent-browser
   downloads land in /home/z/Downloads — copy export artefacts into
   the evidence dir from there). SINCE 2026-10-19b the page is PUBLIC
   — production DOM checks run signed-out; the gate story only matters
   if SITE_MODE returns to 'private'.
4. Deploy (per the STANDING ORDER — every completed round ships):
   `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm
   --filter @currena/api run deploy` (markets only if it changed —
   the web app ships as the api Worker's static assets). Post-deploy
   smoke: health, unauthed /api/insights → 200 `public, max-age=60`
   with displayMode=public and ZERO hidden-id leaks, /markets + /fx →
   404 `hidden_site_mode`, /admin 401, convert parity
   (`/api/convert?from=USD&to=IRR&amount=100` — IRR is the
   tgju-routed code; TMN/IRT are NOT), cache headers, THEN production
   DOM re-verification (375 px + both themes).
5. Secrets discipline: tokens arrive in chat, never get committed;
   wipe one-off scripts after use; remind the owner to rotate tokens
   at the end.
6. User-facing strings are always en+fa; run `pnpm run copy:audit`
   after any copy change; never introduce "is/are" verb agreement
   across locales (telegraphic templates); the buy/sell acceptance
   regexes need the inflected forms.

## 5. Gotchas learned the hard way

- **Tool-output display artifacts**: bracketed `…` sequences and `const`
  destructuring render mangled in tool output — byte-verify (od/awk/
  perl) before treating apparent "corruption" as real.
- **Batch line-surgery on big files is error-prone** — prefer
  marker-anchored single-block edits; ALWAYS tsc + eslint + tests after
  any reorder.
- **The copy manifest tracks Persian literals BY FILE PATH** — a module
  split that moves one needs the manifest entry re-pointed or
  copy:audit fails.
- **Edge-cache HITs rewrite headers serve-time** — if a cache anomaly
  appears, check zone settings FIRST, then Cache Rules, then origin.
- **KV serve-path `cacheTtl` must match the route's `s-maxage`** or the
  KV edge cache keeps regenerating stale responses.
- **Sandbox resets between sessions** — commit and push often; the
  shared worklog (`/home/z/my-project/worklog.md`) is the recovery
  ledger; never rely on uncommitted work surviving. (2026-10-19: the
  checkout was lost mid-flight — the fresh clone + green gates +
  pushed-HEAD discipline is what made the ship a 30-minute rebuild.)
- **Bundle budgets**: the Insights chunk has ~9.5 kB raw headroom since
  the rebuild (594.49 vs 604) — measure anyway; prefer CSS-only
  tweaks; a bump needs a changelog note. The export builders are
  separate lazy chunks — new export features cost the Insights chunk
  only their copy strings.
- **A CSS `::marker` aligns to the FIRST inline box's LAST-line
  baseline** — an inline-block button wrapping to 2+ lines drags the
  dot beside the wrapped line, NOT the sentence start. Explicit flex
  markers (marker span + `items-start`) are direction-proof. Same
  class of bug hides anywhere a list item's content is one atomic
  inline.
- **Bottom-anchoring (mt-auto) a module that only ONE sibling card
  can fill turns the other card's missing content into a mid-card
  hole** — when sibling cards are structurally asymmetric (Global has
  the alert box, Australia never does), let content flow from the top
  and let the spare fall to the bottom inside edge; equal heights via
  grid stretch stay (items-start re-creates the R30 "void under
  Australia").
- **The copy manifest: REMOVED dictionary keys are a MANUAL edit** —
  the updater only adds/updates entries; deleting entries is a hand
  edit, then re-serialize canonically via `loadManifest`/`saveManifest`
  from scripts/lib/persian-copy.mjs (one entry per line — never
  JSON.stringify the whole file; it reformats 22k lines).
- **agent-browser screenshot paths are relative to ITS cwd** — pass
  absolute paths or the save silently fails. Downloads land in
  /home/z/Downloads (copy them into the evidence dir).
- **CSV exports for spreadsheet users MUST carry the UTF-8 BOM** —
  BOM-less UTF-8 decodes as ANSI-1256 on fa-Windows Excel (mojibake);
  Sheets/pandas strip the BOM, so it costs nothing elsewhere. Also:
  one flat table cannot serve nine different column layouts — a
  per-section dense block (own header per block) is what "complete"
  looks like in Excel.
- **A minimal-but-valid OOXML package is NOT enough for strict
  viewers** — emit the docProps floor, a named "Normal" cellStyle, a
  per-sheet <dimension> + <cols>, xml:space on <t> (not <c>), and
  plain-decimal <v> (no exponent forms). openpyxl's warnings are the
  cheap proxy for Excel-mobile/WPS strictness.
- **`void import(...).then(...)` chains need a .catch** — an unhandled
  rejection in a download handler = silent nothing-downloaded, which
  the owner reports as "not working" with zero diagnostic trail.
- **The private gate is fail-closed by design** — with
  `INSIGHTS_PASSWORD` unset every /api/insights* route answers 401,
  even for the owner. After any Worker recreation, re-put the secret
  (OWNER_SETUP §1) before debugging the gate itself.

## 6. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`
- The Insights password: set 2026-10-19 as the `INSIGHTS_PASSWORD`
  Worker secret; the value was handed to the owner in chat (never in
  the repo). Rotate with `wrangler secret put INSIGHTS_PASSWORD`.

All tokens have transited chat across 2026-10-14…19 sessions —
rotation strongly recommended; if not rotated, the existing ones work.
