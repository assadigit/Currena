# Currena — Next Session Brief

Hand-off date: 2026-10-16 (the UI/UX quirk pass: 7 quirks shipped,
7 declined with reasons — see docs/QA/quirks-2026-10-16.md, CHANGELOG
2026-10-16 and docs/DEPLOY.md's last session record. Production:
currena-api `9d995f01` from HEAD `8eb6c94`, currena-markets `9b5ff7e0`
untouched).
· Production: https://currena.ir
· The owner's polish commission is CLOSED — the quirk inventory is
  fully dispositioned (every item shipped or declined); do not reopen
  declined items (Q1, Q2, Q10–Q14 — the reasons live in the QA report).

---

## 0. This session's commission — TBD by the owner

No pre-staged spec for the next wave. When the owner assigns it, start
from: (a) the remaining owner-side items below, (b) whatever new
commission arrives. If asked to "keep polishing", the QA report's
"also checked, already clean" list is the honest floor — do not
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
  Insights is a lazy chunk (599.53/141.53 vs 600/142 budget — thin).
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
`docs/DEPLOY.md`, `docs/QA/quirks-2026-10-16.md` (this commission's
record), `FIX_REPORT.md` (the insights audit's record).

## 2. Current verified state (2026-10-16 close)

- Gates green at close: **1,309/1,309 tests** (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 427), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.67/88.53 vs 296/89.5; Insights lazy 599.53/141.53 vs
  600/142).
- Live data floor: 51 readings, ruleVersion 2, validation 14/14, no
  failed sources; archive serving; freshness chain (D-12 + D-13)
  verified intact post-deploy.
- Production DOM re-verified post-deploy at 375 px: header buttons
  44×44 ×4, footer links 32px, chips 40px, copy chip 36px, receipt
  delete 36px; zero console errors; no horizontal bleed.
- A11y floor: skip link, h1s, useDialogFocus on every dialog, real
  tablists, radio-group arrows, live regions, labeled validation
  errors — keep every one of these green while restyling.
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
4. **i18n copy corpora** (`insights-copy-en/fa.ts`) and
   `packages/core/src/schemas.ts` — data-file and sacred-surface;
   unchanged policy.
5. **Owner-side items**: Telegram ingest-alert secrets, the I7
   launch-approval exit gate (BACKTEST review), the signals-wording
   legal read (S3), connection-evidence confirmations, **token
   rotation** (all three tokens have now transited chat across three
   sessions — this is the strongest rotation nudge yet).

## 4. Session workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r
   test` → `pnpm run lint` → `pnpm run copy:audit` → web build +
   `node scripts/check-bundle-budget.mjs`. Shell gotcha: the tool cwd
   resets between calls — use `pnpm -C <dir>` / `git -C <path> …` and
   absolute paths.
2. Conventional commits, one quirk (or small coherent group) each;
   push often; **check the Actions run is green before stacking the
   next change.** CI = typecheck → lint → tests.
3. Local verification: vite dev on the browser-reachable port
   (`:3000` in the sandbox via the platform gateway) + a read-only
   forwarder to production for real data if needed; verify with
   agent-browser in BOTH locales + BOTH themes at 375 px and desktop.
   Background processes get reaped between calls — spawn detached
   (see the shared worklog for the double-detach pattern).
4. Deploy: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm
   --filter @currena/api exec wrangler deploy` (markets only if it
   changed — the web app ships as the api Worker's static assets).
   Post-deploy smoke: health, /api/insights, /admin 401, convert
   parity, cache headers, THEN production DOM re-verification.
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
- **Bundle budgets**: the Insights chunk is 0.47 kB raw from its cap —
  any look-tweak that adds code there needs measurement first; prefer
  CSS-only tweaks; a bump needs a changelog note.
- **agent-browser screenshot paths are relative to ITS cwd** — pass
  absolute paths or the save silently fails.

## 6. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`

All three have transited chat across 2026-10-14/15/16 sessions —
rotation strongly recommended; if not rotated, the existing ones work.
