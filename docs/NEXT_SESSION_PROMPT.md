# Currena — Next Session Brief

Hand-off date: 2026-10-15 (QA-session close; final code commit `6090842`,
docs-only commits after it — runtime identical).
· Production: https://currena.ir · Deployed: currena-api `93ae180a` +
  currena-markets `d825a8d4` (both 2026-10-14T14:28Z from `6090842`,
  see docs/DEPLOY.md).
· The 2026-10-14/15 owner-commissioned QA long-run is **COMPLETE**: audit →
  reliability hardening → de-monolith-ing → dead code/a11y/lint → deployed +
  live-verified. This brief hands off the post-QA state.

---

## 1. What this project is

**Currena** — a bilingual (en/fa, RTL) currency-converter PWA for Iranian
open-market **Toman** rates + international pairs + a weekly **Insights**
product, at **https://currena.ir**, entirely on Cloudflare Workers (Free
plan, permanently — see the I0 gate decision).

- `apps/api` — Hono on Workers (`/api/*`, zero-JS `/admin`, serves the built
  SPA). Post-split structure (Phase 3-a): `src/index.ts` (~186-line composer)
  over `routes/{rates,insights,ops,internal,admin}.ts`, plus `http/`,
  `security/`, `default-service.ts`, `cron.ts`. Cron `* * * * *` keep-warms
  the live rates ladder.
- `apps/markets` — the markets worker: source scrapers + the daily snapshot
  crons `30 23 * * 1-5` + `30 1 * * 2-6` UTC (main + retry), carries the
  insights fx engine and the EODHD stock ingestion.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, ~10
  routes, en/fa RTL). Insights is a lazy chunk (581/137 kB vs 582/137
  budget). Post-split: `components/insights/config/` (10 domain modules),
  `world-currencies/`, `routes/insights-sections/`.
- `packages/core` — zod contracts (`schemas.ts` ~1,173 lines: the KV
  snapshot schemas live here — **storage compatibility is sacred**).
- `packages/insights` — the compute engine: `fx/compute.ts` is now a
  33-line barrel over `fx/{maths,pairs,weekly,entries,cross-inputs,rules,
  summary,content}.ts`; plus `markets/compute.ts`, `scoring.ts`,
  `definitions.ts`, adapters, `fx/job.ts`.
- `packages/scraper` — TGJU + Frankfurter + … source scrapers.

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted. Then `docs/PROGRESS.md` (full session
history), `docs/DECISIONS_FOR_ALI.md` (D-01…D-18), `docs/DEPLOY.md`
(deploy procedure + every session's deploy record), `docs/QA/audit-2026-10-14.md`
(the 38-finding audit + its disposition), `docs/specs/traceability.md`.

## 2. Current verified state (2026-10-15 close)

- Gates green at close: **1,171/1,171 tests** (core 183 · scraper 67 ·
  insights 350 · markets 13 · api 206 · web 352), typecheck 6/6, **lint 0
  errors** / 34 accepted advisory warnings (D-17), Persian copy audit clean,
  `pnpm audit` **zero advisories** (D-18), bundle budgets held (entry
  292.77/87.80 vs 296/89.5; Insights lazy 581.44/136.81 vs 582/137).
- Reliability surface (Phase 2, all regression-tested): every serve route
  validates inputs (zod) with correct status codes + a consistent error
  envelope; KV read failures answer calm 503s with distinct codes
  (`history_unavailable`, `insights_unavailable`, `markets_unavailable`,
  `fx_unavailable`, `indicator_history_unavailable` — D-15); `/api/status` +
  `/admin` degrade per-row; the SPA retries transient failures and shows
  honest stale/degraded states; golden contract tests validate real route
  responses against the core schemas; scheduled wrappers are covered on both
  workers; the fx Yahoo fallback carries 2y of margin (D-14).
- **Freshness chain (D-12 + D-13):** snapshot crons 23:30 (Mon–Fri) + 01:30
  (Tue–Sat retry) → markets worker → KV snapshots → api serve path (KV read
  `cacheTtl` 300 s) → edge (`s-maxage=300`) → browser (`max-age=300` + ETag
  revalidation; zone Browser Cache TTL = 0 = Respect Existing Headers). A
  returning visitor sees the daily update within ~5 minutes. Verified live
  post-deploy 2026-10-14T14:28Z.
- A11y floor (Phase 4): skip-to-content on every route, h1s everywhere,
  `useDialogFocus` discipline (focus-in/trap/Escape/opener-return/scroll-lock)
  on ResultPopup, Receipt, Settle, and the header drawer; live regions on
  the rates banners; labeled validation errors; inert closed drawer.
- Crons on the account: 5-cron free-tier limit — api 1 + markets 2 + legacy
  workers 2. Re-verify before ever adding a trigger.

## 3. What is deliberately LEFT (with reasons — do not silently "fix")

1. **34 ESLint advisory warnings** (D-17): the react-hooks compiler-grade
   rules at warn flag the app's DESIGNED hydration patterns (localStorage →
   setState on mount, refs in event plumbing). Restructuring ~20 effects is
   behavior-adjacent churn — the worklist exists if the owner asks.
   `rules-of-hooks` stays an ERROR (it caught a real crash bug).
2. **Remaining large modules** — candidates for future splits, in
   rough-value order: `WorldMarkets.tsx` (977), `Receipt.tsx` (951),
   `Settle.tsx` (915), `fx-presentation.ts` (891), `Converter.tsx` (847),
   `Signals.tsx` (812). None is a blocker; all are cohesive. Split only with
   characterization tests first + zero behavior change (the Phase 3 recipe).
3. **i18n copy corpora** (`insights-copy-en/fa.ts`, 2576/2392 lines):
   data-files by nature; a split churns ~900 manifest entries for zero gain.
4. **`packages/core/src/schemas.ts`** (~1,173): the sacred KV contract file
   — export-reorg churns the surface old/new readers must coexist on.
5. **One a11y minor skipped** (documented in the Phase 4-b commit): the
   Splitter stepper +/− glyph labels need NEW COPY (en+fa) — owner word
   choice, not agent word invention.
6. **Owner-side observations left open**: D-08 (R7 euro-led card never
   fires in 10 y — basket maths; needs owner-approved threshold/weight
   change), D-09 (R5 fires 15.3% of weeks — thresholds kept), Telegram
   ingest-alert secrets, the I7 launch-approval exit gate (owner reviews
   BACKLOG/BACKTEST.md), the signals-wording legal read (S3), connection
   evidence confirmations, **token rotation** (all three tokens transited
   chat again on 2026-10-14/15).

## 4. Suggested next-session work (if the owner has no specific ask)

- Rotate the three tokens first (GitHub / Cloudflare / EODHD) — they have
  transited chat in ≥4 sessions.
- The QA follow-ups above are ordered by value: lint-advisory worklist →
  the two insights component splits → owner-wording items.
- Otherwise: the standing feature backlog lives in `docs/BACKLOG.md`;
  `docs/specs/traceability.md` maps every shipped requirement.

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test` →
   `pnpm run lint` → `pnpm run copy:audit` → web build +
   `node scripts/check-bundle-budget.mjs`. Shell gotcha: the tool cwd resets
   between calls — use `pnpm -C <dir>` / `git -C /home/z/currena …` and
   absolute paths.
2. Conventional commits, one logical change each; push often; **check the
   Actions run is green before stacking the next change.** CI = typecheck →
   lint → tests.
3. Local verification: `pnpm --parallel dev` (web :5173, proxy expects api
   :8787) or wrangler dev on a free port; verify with agent-browser
   (+ VLM for visual checks — DOM checks are ground truth, VLM misreads).
4. Deploy: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter
   @currena/api exec wrangler deploy` (and the markets equivalent when it
   changed). If a change alters a **snapshot format**, run the snapshot job
   FIRST so KV holds the new format before the read-side validation sees
   it. Re-putting `EODHD_API_TOKEN` after a markets deploy is idempotent
   belt-and-braces.
5. Secrets discipline: tokens arrive in chat, never get committed; the
   GitHub token lives only in the push remote URL / one-off commands, then
   scrub; wipe one-off scripts after use; remind the owner to rotate tokens
   at the end.
6. User-facing strings are always en+fa with the copy manifest — run
   `pnpm run copy:audit` after any copy change; never introduce "is/are"
   verb agreement across locales (telegraphic templates); the buy/sell
   acceptance regexes need the inflected forms.

## 6. Gotchas learned the hard way

- **Tool-output display artifacts** (2026-10-15 lesson, audit A-10
  retraction): bracketed `[m…` sequences and `const [m` destructuring render
  mangled in tool output. ALWAYS byte-verify (od/awk/perl) before treating
  apparent "corruption" as real.
- **Edge-cache HITs rewrite headers serve-time**: the zone's legacy Browser
  Cache TTL once rewrote `max-age=300`→`14400` on HITs only (curl/HEAD
  missed it — verify cache headers in a real browser context). Now set to
  0 = Respect Existing Headers (D-12). If a cache anomaly appears, check
  the zone settings FIRST, then Cache Rules, then origin.
- **KV serve-path `cacheTtl` must match the route's `s-maxage`** or the KV
  edge cache keeps regenerating stale responses after a TTL tightening
  (D-13: both moved 3600→300 together).
- **KV free-tier daily write cap (429/10048)** auto-recovers at 00:00 UTC;
  it has only ever bitten same-day manual dispatches, never scheduled runs.
- Stored objects grew by design in v1.3 (`plain` fields, +128 B, CR-capped
  <1 KB). Any new stored field needs: schema bump discipline + old-reader
  tolerance (`plain` is optional on the reader side on purpose).
- Quarterly staleness limits are calibrated per SOURCE release calendar
  (BEA/ABS 215 d), never per cadence — see I19 notes.
- Quarterly connection legs carry no change30d; their lean comes from F3
  level bands (connections.ts).
- **Sandbox resets between sessions** (2026-10-15 lesson): the local clone
  and every non-persisted credential can vanish at a context rollover —
  commit and push often; the shared worklog
  (`/home/z/my-project/worklog.md`) is the recovery ledger; never rely on
  uncommitted work surviving.

## 7. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`

All three transited chat on 2026-10-14 AND 2026-10-15 — rotation strongly
recommended; if not rotated, the existing ones work.
