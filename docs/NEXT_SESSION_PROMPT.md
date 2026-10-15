# Currena — Next Session Brief

Hand-off date: 2026-10-15 (the INSIGHTS_FIX_SPEC close: 48/48 items
shipped, published and deployed — currena-api `97e8c38a` from `b6a35a7`,
currena-markets `9b5ff7e0` unchanged; see FIX_REPORT.md, CHANGELOG
2026-10-15d/e and docs/DEPLOY.md's last session record).
· Production: https://currena.ir
· The 14-October insights audit's fix spec is FULLY closed — nothing
from INSIGHTS_FIX_SPEC.md remains open; do not re-litigate shipped
items (the FIX_REPORT.md record is the authority).
· This session's commission is the OWNER's: **minor UI/UX quirks and
tweaking the look** — see §0.

---

## 0. This session's commission — minor UI/UX quirks + look tweaks

A polish pass over what exists. **Visual and interaction quality only —
no data, scoring, wording-policy or behavior changes.** The mandate:

1. **Hunt quirks** across every route in BOTH locales (en LTR + fa RTL)
   and BOTH themes (light + dark — class-based `.dark`, toggle in the
   header), at 375 px mobile AND desktop widths: spacing/alignment
   drift, inconsistent paddings between sibling cards, truncation vs
   wrap decisions, focus/hover states, touch targets under 44 px,
   chart/label collisions, RTL mirrored details (icons, chevrons,
   number+unit ordering, Persian digit rendering), stale/`check-pending`
   chip legibility, dialog focus traps, scroll-into-view jumps, the
   sticky footer overlap on short pages.
2. **Tweak the look** within the existing visual identity — refine, do
   NOT redesign: type scale rhythm, card borders/shadows, status-color
   intensity, spacing consistency, chart styling. Owner's phrase:
   "tweaking the look" — small, reversible, per-quirk commits.
3. **Hard boundaries**: all user-facing copy stays plain-language
   conditions-only (no forecasts, no "will/should/expected to" — T-07
   scans the corpora in CI); every copy change lands en+fa together and
   `pnpm run copy:audit` must pass; world-markets/world-currencies DATA
   logic untouched; `packages/core/src/schemas.ts` (sacred KV
   contracts) untouched; bundle budgets respected (a bump needs a
   changelog justification — entry 294.61/88.50 vs 296/89.5 has only
   ~1.4 kB raw headroom; Insights lazy 599.37/141.52 vs 600/142).
4. **Method**: build a numbered quirk list first (each with a screenshot
   + route/locale/theme/width), get through as many as the session
   allows in priority order, one commit per quirk (or small coherent
   group), tests+typecheck+lint+copy audit green after each, visual
   re-verification after each fix. Record declined quirks with reasons
   (docs/QA has the precedent format).

**Verification standard for this session:** agent-browser DOM checks are
ground truth; VLM screenshots catch what DOM misses (use it for visual
regressions — spacing, contrast, overlap); zero console errors; no
horizontal bleed at 375 px; both themes; both locales. Save evidence to
`docs/evidence/<session-tag>/`.

## 1. What this project is

**Currena** — a bilingual (en/fa, RTL) currency-converter PWA for Iranian
open-market **Toman** rates + international pairs + a weekly **Insights**
product, at **https://currena.ir**, entirely on Cloudflare Workers (Free
plan, permanently — see the I0 gate decision).

- `apps/api` — Hono on Workers (`/api/*`, zero-JS `/admin`, serves the
  built SPA). `routes/{rates,insights,ops,internal,admin}.ts` over
  `http/`, `security/`, `cron.ts`. Cron `* * * * *` keep-warms the live
  rates ladder. NEW this wave: `/api/insights/status` (validation run
  status) + `/api/insights/archive/:date` (the daily snapshot archive).
- `apps/markets` — the markets worker: source scrapers + the daily
  snapshot crons `30 23 * * 1-5` + `30 1 * * 2-6` UTC. UNTOUCHED by the
  fix spec — deployed `9b5ff7e0` is current.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, routes:
  Converter, LiveRates, History, BatchConverter, Calculator, Splitter,
  Settle, Receipt, About, Insights) en/fa RTL, light+dark. Insights is a
  lazy chunk (599.37/141.52 vs 600/142 budget) — components in
  `components/insights/` (HeroBlock, VerdictMeter, PricesBoard,
  MoneyPanel, ConnectionCard, Together, Signals, DetailsPanel,
  AboutTheData, NextUpStrip, ToolsMenu, …) + `routes/insights-sections/`.
- `packages/core` — zod contracts (`schemas.ts` — the KV snapshot
  schemas live here — **storage compatibility is sacred**).
- `packages/insights` — the compute engine: scoring, validation
  (T-01…T-14), connections, gauges, adapters, `fx/`, `markets/`.
- `packages/scraper` — TGJU + Frankfurter + … source scrapers.
- `data/` — `indicators.json` (the 51-entry registry, generated —
  CI-pinned), `policy-decisions.json`, context-notes slot.
- Ingest: the `insights-ingest` GHA (04:20 UTC daily) fetches →
  validates → publishes to KV (budget 55 reads / 31 writes / 49 outside
  requests per refresh).

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod
at every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit
live sites, secrets never persisted. Then this file, `docs/PROGRESS.md`
(full session history), `docs/DECISIONS_FOR_ALI.md` (D-01…D-27),
`docs/DEPLOY.md` (deploy procedure + every session's deploy record),
`FIX_REPORT.md` (what the fix spec shipped + why each number changed),
`docs/specs/traceability.md`.

## 2. Current verified state (2026-10-15 close)

- Gates green at close: **1,308/1,308 tests** (core 190 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 427), typecheck 6/6, lint
  0 errors / 14 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.61/88.50 vs 296/89.5; Insights lazy 599.37/141.52 vs
  600/142 — the 2026-10-15d bump).
- Live data floor: 51 readings, ruleVersion 2, validation 14/14, no
  failed sources; archive serving (`/api/insights/archive/:date`);
  reference values current as of the 2026-10-15 01:39Z ingest run.
- Freshness chain (D-12 + D-13): markets crons → KV snapshots → api
  serve (KV `cacheTtl` 300 s) → edge (`s-maxage=300`) → browser
  (`max-age=300` + ETag). Verified intact post-deploy.
- A11y floor: skip link, h1s, useDialogFocus on every dialog, real
  tablists, radio-group arrows, live regions, labeled validation
  errors — keep every one of these green while restyling.
- The jsdom component-test environment is installed (C-9/D-22).
- Crons on the account: 5-cron free-tier limit — api 1 + markets 2 +
  legacy workers 2. Re-verify before ever adding a trigger.

## 3. What is deliberately LEFT (with reasons — do not silently "fix")

1. **14 ESLint advisory warnings** (D-24) — designed patterns with
   stated reasons. Not this session's business.
2. **D-25/D-26/D-27 DECIDED (2026-10-15c): all three KEEP** — R7's
   euro-led card rarity, R5 at 15.3% of weeks, /api/convert's
   exotic-but-finite `Number()` forms. Overrule path: reply to the row
   in DECISIONS_FOR_ALI.md.
3. **B-13 recorded, no change**: T5YIFR IS the fetched series (its
   equality with the 10y breakeven that day was a coincidence).
4. **i18n copy corpora** (`insights-copy-en/fa.ts`) and
   `packages/core/src/schemas.ts` — data-file and sacred-surface;
   unchanged policy.
5. **Owner-side items**: Telegram ingest-alert secrets, the I7
   launch-approval exit gate (BACKTEST review), the signals-wording
   legal read (S3), connection-evidence confirmations, **token
   rotation** (all three tokens transited chat repeatedly now).

## 4. Session workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r
   test` → `pnpm run lint` → `pnpm run copy:audit` → web build +
   `node scripts/check-bundle-budget.mjs`. Shell gotcha: the tool cwd
   resets between calls — use `pnpm -C <dir>` / `git -C <path> …` and
   absolute paths.
2. Conventional commits, one quirk (or small coherent group) each; push
   often; **check the Actions run is green before stacking the next
   change.** CI = typecheck → lint → tests.
3. Local verification: `pnpm --parallel dev` (web :5173, proxy expects
   api :8787) or wrangler dev on a free port; verify with
   agent-browser in BOTH locales + BOTH themes at 375 px and desktop.
4. Deploy: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm
   --filter @currena/api exec wrangler deploy` (markets only if it
   changed). Post-deploy smoke: health, /api/insights, /admin 401,
   convert parity, cache headers.
5. Secrets discipline: tokens arrive in chat, never get committed; wipe
   one-off scripts after use; remind the owner to rotate tokens at the
   end.
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
- **Bundle budgets**: the Insights chunk is 0.63 kB raw from its cap —
  any look-tweak that adds code there needs measurement first; prefer
  CSS-only tweaks; a bump needs a changelog note.

## 6. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`

All three transited chat on 2026-10-14 AND 2026-10-15 (multiple times) —
rotation strongly recommended; if not rotated, the existing ones work.
