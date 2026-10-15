# Currena — Next Session Brief

Hand-off date: 2026-10-18b (export-fix session — the owner's bug report
"The xlsx and csv outputs are incomplete and not working. md and txt
works." forensically diagnosed (the builders were complete; the failure
was Excel-side: BOM-less UTF-8 CSV mojibake on fa-Windows, the flat
26-slot sparse matrix, and the minimal OOXML package tripping strict
viewers) and fixed — every CSV ships with the UTF-8 BOM, the full CSV is
one dense block per section (the MD/TXT structure), the xlsx-writer is
hardened (docProps floor, named "Normal" style, per-sheet dimension +
cols width, xml:space on <t>, plain-decimal <v>, rightToLeft fa sheet
views), and the download handler fails loudly. Deployed currena-api
`be5c0121` from HEAD `ca991e7`, currena-markets `9b5ff7e0` untouched;
see CHANGELOG 2026-10-18b, docs/DEPLOY.md's last session record and
docs/evidence/2026-10-18-export-fix/).
· Production: https://currena.ir
· The export-fix, round-43, round-42 and quirk-pass commissions are all
  CLOSED. Do not reopen declined items.

---

## 0. This session's commission — TBD by the owner

No pre-staged spec for the next wave. When the owner assigns it, start
from: (a) the remaining owner-side items below, (b) whatever new
commission arrives. If asked to "keep polishing", the QA reports'
"also checked, already clean" lists are the honest floor — do not
invent work against the deliberate-KEEP decisions.

## 1. What this project is

**Currena** — a bilingual (en/fa, RTL) currency-converter PWA for
Iranian open-market **Toman** rates + international pairs + a weekly
**Insights** product, at **https://currena.ir**, entirely on Cloudflare
Workers (Free plan, permanently — see the I0 gate decision).

- `apps/api` — Hono on Workers (`/api/*`, zero-JS `/admin`, serves the
  built SPA). Cron `* * * * *` keep-warms the live rates ladder; the
  `:13` minute rung refreshes Insights live prices.
- `apps/markets` — source scrapers + daily snapshot crons. Deployed
  `9b5ff7e0` is current — untouched since 2026-10-15.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router,
  routes: Converter, LiveRates, History, BatchConverter, Calculator,
  Splitter, Settle, Receipt, About, Insights) en/fa RTL, light+dark.
  Insights is a lazy chunk (603.89/142.61 vs 604/142.8 budget — thin).
- `packages/core` — zod contracts (`schemas.ts` — **storage
  compatibility is sacred**).
- `packages/insights` — compute engine: scoring, validation (T-01…T-14),
  connections, gauges, adapters.
- `packages/scraper` — TGJU + Frankfurter + … source scrapers.
- `data/` — `indicators.json` (51-entry registry, generated —
  CI-pinned), `policy-decisions.json`, context-notes slot.
- Ingest: the `insights-ingest` GHA (04:20 UTC daily) fetches →
  validates → publishes to KV (budget 55 reads / 31 writes / 49
  outside requests per refresh).

**Read before touching anything:** `AGENTS.md` (root) — TS strict,
zod at every boundary, RTL/LTR native, **TOMAN canonical**, tests
never hit live sites, secrets never persisted. Then this file,
`docs/PROGRESS.md`, `docs/DECISIONS_FOR_ALI.md` (D-01…D-27),
`docs/DEPLOY.md`, `docs/QA/quirks-2026-10-18-round43.md` (the latest
commission's record), `docs/QA/quirks-2026-10-17-hero-calm.md` and
`docs/QA/quirks-2026-10-16.md` (the prior ones), `FIX_REPORT.md`.

## 2. Current verified state (2026-10-18b close)

- Gates green at close: **1,331 tests** (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 449), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.75/88.52 vs 296/89.5; Insights lazy **603.89/142.61**
  vs 604/142.8; the export builders remain separate lazy chunks —
  full-export + xlsx-writer + panel, none budget-tracked).
- The export surface (2026-10-18b): every CSV carries the UTF-8 BOM;
  the full CSV is one dense block per section (title + meta floor,
  heading, the section's own header row, its rows — MD/TXT structure);
  the xlsx-writer emits docProps + Normal style + dimension + cols +
  `xml:space`-on-`<t>` + plain-decimal `<v>` + optional rightToLeft
  sheet views (the fa workbook opens RTL); the download handler logs
  failures loudly. Receipt's XLSX (no opts) untouched.
- Live data floor: 51 readings, ruleVersion 2, validation 14/14, no
  failed sources; archive serving; freshness chain (D-12 + D-13)
  verified intact post-deploy.
- Production DOM re-verified post-deploy (fa, light + dark, 1280 +
  375): the meters wear the four-step status colours again (owner
  decree — round 42's neutral-ink note is superseded), both "?"
  tips seat at their subjects (rule tip in the first status group's
  header, how-tip on the verdict row; panels wrap full-width below
  their rows), the alert container visibly tints, bullet dots sit at
  sentence starts, Australia leads with 6 attention tiles, 375 px
  scrollWidth === 375, zero console errors. NOTE: the PWA service
  worker needs ONE plain reload after a deploy before the new bundle
  serves (known one-reload behaviour).
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
4. **Bundle budgets**: entry 296/89.5 (294.75/88.52 measured);
   Insights lazy **604/142.8** (603.89/142.61 measured; the export
   builders are separate lazy chunks). Any further Insights-chunk
   growth needs its own justification. NOTE: the meters now wear the
   FOUR-STEP status colours at every size (round 43 owner decree —
   this REVERSES round 42's one-neutral-ink note; do not re-neutralise
   them).
5. **i18n copy corpora** (`insights-copy-en/fa.ts`) and
   `packages/core/src/schemas.ts` — data-file and sacred-surface;
   unchanged policy.
6. **Owner-side items**: Telegram ingest-alert secrets, the I7
   launch-approval exit gate (BACKTEST review), the signals-wording
   legal read (S3), connection-evidence confirmations, **token
   rotation** (all three tokens have now transited chat across six
   sessions — this is the strongest rotation nudge yet).

## 4. Session workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r
   test` → `pnpm run lint` → `pnpm run copy:audit` → web build +
   `node scripts/check-bundle-budget.mjs` (run the budget script from
   the REPO ROOT — it resolves `apps/web/dist` itself). Shell gotcha:
   the tool cwd resets between calls — use `pnpm -C <dir>` /
   `git -C <path> …` and absolute paths.
2. Conventional commits, one quirk (or small coherent group) each;
   push often; **check the Actions run is green before stacking the
   next change.** CI = typecheck → lint → tests.
3. Local verification: vite dev on the browser-reachable port
   (`:3000` in the sandbox via the platform gateway; vite proxies
   `/api` → :8787) + a read-only bun forwarder :8787 → currena.ir for
   real data (both rebuilt this session: `node /home/z/
   spawn-detached.mjs <log> bun /home/z/forwarder-8787.ts` and
   `SPAWN_CWD=<web> … pnpm exec vite --port 3000 --strictPort --host`);
   verify with agent-browser in BOTH locales + BOTH themes at 375 px
   and desktop. Background processes get reaped between calls — spawn
   detached (see the shared worklog for the double-detach pattern).
   Locale/theme switches are localStorage keys `currena:locale`
   (PLAIN `fa`/`en` — not JSON-quoted) and `theme`.
4. Deploy: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm
   --filter @currena/api exec wrangler deploy` (markets only if it
   changed — the web app ships as the api Worker's static assets).
   Post-deploy smoke: health, /api/insights, /admin 401, convert
   parity (`/api/convert?from=USD&to=IRR&amount=100` — IRR is the
   tgju-routed code; TMN/IRT are NOT), cache headers, THEN production
   DOM re-verification.
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
  ledger; never rely on uncommitted work surviving.
- **Bundle budgets**: the Insights chunk has ~0.16 kB raw headroom
  (round 43 absorbed its growth by deduping the shared BULLET_DOT JSX
  element into a module const — repeated inline JSX is cheap weight to
  shave). Any look-tweak that adds code there needs measurement first;
  prefer CSS-only tweaks; a bump needs a changelog note. The export
  builders are separate lazy chunks — new export features cost the
  Insights chunk only their copy strings.
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
  absolute paths or the save silently fails.
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

## 6. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`

All three have transited chat across 2026-10-14/15/16/17/18 sessions —
rotation strongly recommended; if not rotated, the existing ones work.
