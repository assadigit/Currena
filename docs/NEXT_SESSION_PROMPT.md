# Currena — Next Session Brief

Hand-off date: 2026-10-19d (MISSING-ITEMS INVESTIGATION session — the
owner's "investigate whether it's api problem, quota or what": VERDICT —
the gold/silver/brent/bitcoin grid + the no-data gauges are the PUBLIC
projection's licence hiding BY DESIGN; the money-panel petrol→employment
shift is DATA-driven (petrol's drivers calm on BOTH pages; employment's
drivers warning AND public-ok). THE REAL OUTAGE: the daily
insights-ingest GitHub schedule silently died after Oct 16 (3 days,
zero attempted runs). FIXED: manual dispatch restored data (public
projection 27 → 28 — crypto-fng rode in) + the INGEST WATCHDOG shipped:
apps/api/src/ingest-watchdog.ts — the Worker cron's :40 rung
re-dispatches the ingest when the snapshot is >26 h stale (6 h nudge
bound; GH_INGEST_DISPATCH_TOKEN secret set). Deployed currena-api
`0eb91818` from `193237e`; 1,418 tests green. See CHANGELOG
2026-10-19d + docs/DEPLOY.md's 2026-10-19d record.
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

## 2. Current verified state (2026-10-19d close)

- Gates green at close: **1,418 tests** (core 191 · scraper 67 ·
  insights 461 · markets 13 · api 233 · web 453), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.78/89.38 vs 296/89.5; Insights lazy **594.68/142.03**
  vs 604/142.8; the export builders remain separate lazy chunks —
  full-export + xlsx-writer + panel, none budget-tracked).
- Production = currena-api **`0eb91818`** from HEAD `193237e` (+ docs
  wrap-up); currena-markets `9b5ff7e0`. Repo: `main` ==
  `insights-rebuild` (new work branches off `main`).
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
- **The page is PUBLIC (2026-10-19b)**: unauthed `/api/insights` → 200
  `public, max-age=60` serving the projection keys only (27 readings,
  ruleVersion 2, displayMode public); `/markets` + `/fx` → 404
  `hidden_site_mode`; the world sections stay hidden in the web build.
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
