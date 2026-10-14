# Currena — Next Session Brief (Codebase QA · Reliability · Maintainability)

Hand-off date: 2026-10-14 (session close-out commit `2c03325`, CI green).
· Production: https://currena.ir · Deployed: currena-api `bb7b3ae4` +
  currena-markets `39dfc6b3` (both 2026-10-14T03:25Z, see docs/DEPLOY.md).
· This session is **owner-commissioned to be fully autonomous and
  long-running**: work through the phases below without asking questions;
  record judgment calls in docs/DECISIONS_FOR_ALI.md (number from **D-14**).

---

## 1. What this project is

**Currena** — a bilingual (en/fa, RTL) currency-converter PWA for Iranian
open-market **Toman** rates + international pairs + a weekly **Insights**
product, at **https://currena.ir**, entirely on Cloudflare Workers.

- `apps/api` — Hono on Workers (`/api/*`, zero-JS `/admin`, serves the built
  SPA). Cron `* * * * *` keep-warms the live rates ladder. `src/index.ts`
  (~820 lines) is the route monolith; `src/admin.ts` (~410) the admin app.
- `apps/markets` — the markets worker: source scrapers + the daily snapshot
  crons `30 23 * * 1-5` + `30 1 * * 2-6` UTC (main + retry), carries the
  insights fx engine and the EODHD stock ingestion.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, ~10
  routes, en/fa RTL). Insights is a lazy chunk.
- `packages/core` — zod contracts (`schemas.ts` ~1,170 lines: the KV
  snapshot schemas live here — **storage compatibility is sacred**).
- `packages/insights` — the compute engine: `fx/compute.ts` (~984),
  `markets/compute.ts`, `scoring.ts`, `definitions.ts` (~778), adapters,
  `fx/job.ts` (snapshot builder/writer).
- `packages/scraper` — TGJU + Frankfurter + … source scrapers.

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted. Then `docs/PROGRESS.md` (full session
history — the source of truth for why everything is the way it is),
`docs/DECISIONS_FOR_ALI.md` (D-01…D-13), `docs/DEPLOY.md` (deploy procedure
+ every session's deploy record), `docs/specs/traceability.md`.

## 2. Current verified state (2026-10-14 close)

- Gates green at close: **1,058/1,058 tests** (core 183 · scraper 67 ·
  insights 339 · markets 7 · api 136 · web 326), typecheck 6/6, Persian
  copy audit clean, bundle budgets held (entry 290.36/87.08 vs 296/89.5;
  Insights lazy 579.62/136.48 vs 580/137).
- v1.3 world-currencies layer live (plain-language EN+FA); every
  requirement of both insights specs closed — `docs/specs/traceability.md`
  maps them.
- **Freshness chain (D-12 + D-13, 2026-10-14):** snapshot crons 23:30
  (Mon–Fri) + 01:30 (Tue–Sat retry) → markets worker → KV snapshots →
  api serve path (KV read `cacheTtl` 300 s) → edge (`s-maxage=300`) →
  browser (`max-age=300` + ETag revalidation; the zone's Browser Cache
  TTL is now 0 = Respect Existing Headers). A returning visitor sees the
  daily update within ~5 minutes.
- Live rates: minute-cron keep-warm + fresh-guard caps real scrapes;
  per-source KV history (`history:<source>`); SPA self-heals outages
  (15/30/60 s backoff, error→ready auto-completion, honest failure cards).
- Crons on the account: **the free-tier 5-cron limit was full at last
  check** (api 1 + markets 2 + legacy workers 2) — re-verify before ever
  adding a trigger.
- Known open observations: **D-08** (R7 euro-led card never fires in 10 y
  of replay — basket maths, honest finding, left as-is), **D-09** (R5
  fires 15.3% of weeks — under the 25% bar, thresholds kept).

## 3. This session's mission (the owner's four areas)

> Audit the codebase and improve code-base hygiene and system design and
> comply with web-development best practices; test and strengthen the
> cache and input and API and connection reliability between API and our
> display (TLDR: make it show always live and reliable and accurate data);
> extract god-modules and monoliths into smaller modules; remove dead
> code; and anything else that serves codebase QA, maintainability, and
> scalability. Fully autonomous, long-running.

Work the phases in order. Commit per phase (or per logical unit), push,
and confirm the GitHub Actions run is green before building on top.

### Phase 0 — Baseline
Clone/pull, `pnpm install --frozen-lockfile`, run every gate
(`pnpm -r typecheck`, `pnpm -r test`, `pnpm run copy:audit`, web build +
`node scripts/check-bundle-budget.mjs`). Record the baseline numbers in
the audit report. Nothing else in this phase.

### Phase 1 — Deep audit (read-only → report)
Produce **`docs/QA/audit-2026-10-XX.md`**: a numbered findings list, each
with severity (critical/major/minor), `file:line` evidence, and a
concrete fix. Cover at least:
- **Architecture & boundaries:** package dependency direction, leaked
  abstractions, duplicated logic across apps/packages.
- **Type safety & strictness:** `any`/unsafe casts, zod-at-boundary gaps,
  tsconfig strictness drift between packages, eslint gaps (consider
  stricter rules + unused-exports detection).
- **API contract consistency:** error shapes, status codes, validation of
  query params/bodies on EVERY route (api + admin), header discipline.
- **Reliability (feeds Phase 2):** every failure path — upstream down
  (EODHD/Frankfurter/TGJU), malformed upstream JSON, KV read/write
  failure, cron failure, 304/ETag edge cases, clock skew, partial
  snapshots — and whether the display degrades honestly (fresh/stale/
  degraded conventions already exist; find where they're incomplete).
- **Dead code:** run knip (or ts-prune + manual sweep): unused exports,
  unreferenced copy keys, dead CSS, orphan scripts/docs, stale doc
  references.
- **Dependency hygiene:** `pnpm audit`, outdated deps, unused deps.
- **SPA best practices:** a11y/WCAG sweep, semantic HTML, Core Web
  Vitals risks, security headers/CSP.
- **Test-coverage gaps:** especially integration/contract tests between
  api responses and the web client's consumption (schemas, headers, ETag).
- **Docs accuracy:** AGENTS.md / README / FEATURE_MAP vs reality.
Commit the report. Do not fix yet.

### Phase 2 — Reliability hardening (owner's TLDR: "always live, reliable, accurate")
Highest user value — do it before refactors so behavior is pinned by
tests first:
- **Failure-path tests** for every scenario inventoried in Phase 1
  (upstream down ×3 sources, malformed JSON, KV failures, cron gaps,
  ETag mismatch, stale-edge windows). Tests simulate upstreams; never hit
  live sites.
- **Input validation:** zod-validate every request input; correct status
  codes (400/404/405/413/422); reject oversized/malformed payloads.
- **Cache-chain contract tests:** assert 200/304/ETag/`max-age`/`s-maxage`
  behavior at every layer (route handlers, KV readers, SPA fetch layer)
  against the spec rules (world-markets §4 rule 5, world-currencies §5
  rule 4 — both now `max-age=300, s-maxage=300`). Evaluate
  stale-if-error/SWR semantics where the specs allow; if a change would
  alter spec-mandated behavior, write a D-14+ entry and prefer the
  spec-side option unless it's a pure bug.
- **API↔display contract tests** in CI: validate real route handler
  responses against `packages/core` schemas (golden fixtures) so schema
  drift can never silently break the display.
- **SPA connection reliability:** exercise the retry/backoff/offline/
  auto-recover paths (snapshot-store) with tests; confirm `/api/health`
  reflects KV truth.
Every fix ships with a regression test. Deploy after this phase.

### Phase 3 — De-monolith-ing (behavior-preserving)
Inventory every file > 400 lines (the 2026-10-14 list is in §4 below —
re-measure). For each, in priority order (routes/engine before leaf
components):
- Write characterization tests first if coverage is thin.
- Split by responsibility — e.g. `fx/compute.ts` → per-rule modules +
  shared maths; `WorldCurrencies.tsx` → card/table/drawer components;
  `fx-presentation.ts` → cohesive helper groups; `Insights.tsx` →
  sections; `api/index.ts` → route modules; `insights/config.ts` →
  per-domain config files.
- **Invariants:** all tests stay green; the KV snapshot schemas
  (`insights:fx:v1`, markets keys) and their stored shapes DO NOT change
  (readers/writers old/new must coexist); bundle budgets must not regress
  (splits should help — verify with the budget script); i18n copy files
  split by domain with the manifest discipline intact.
One module per commit.

### Phase 4 — Dead-code & hygiene sweep
Execute the Phase-1 dead-code findings (verify each with knip +
copy-audit + tests + bundle before deleting), then the hygiene backlog:
naming, error-handling consistency, API-shape consistency, dependency
updates (patch/minor freely; majors get a D-entry), security headers,
a11y fixes. Small focused commits.

### Phase 5 — Docs, changelog, deploy, verify, hand off
CHANGELOG entry per phase; PROGRESS.md session row; D-14+ for every
judgment call; update AGENTS.md if structure changed; DEPLOY.md record.
Deploy both workers per docs/DEPLOY.md; live-verify with agent-browser
(en+fa, desktop + 375px, zero console/page errors, headers correct,
freshness chain intact). Push; CI green on the final head. Rewrite this
file for the next session.

**Definition of done:** audit committed; every critical/major finding
fixed or documented-with-reason; failure-path + contract tests added;
god-modules split with zero behavior change; dead code removed; all
gates green; deployed + live-verified; docs current; final summary lists
done vs deliberately-left.

## 4. God-module inventory (measured 2026-10-14, non-test .ts/.tsx > 400 lines)

```
2576  apps/web/src/i18n/insights-copy-en.ts      (copy corpus — split by domain)
2392  apps/web/src/i18n/insights-copy-fa.ts      (copy corpus — split by domain)
1507  apps/web/src/components/insights/config.ts
1291  apps/web/src/components/insights/WorldCurrencies.tsx
1173  packages/core/src/schemas.ts               (KV contracts — split carefully!)
1164  apps/web/src/routes/Insights.tsx
 984  packages/insights/src/fx/compute.ts
 980  apps/web/src/components/insights/WorldMarkets.tsx
 926  apps/web/src/routes/Receipt.tsx
 901  apps/web/src/routes/Settle.tsx
 891  apps/web/src/lib/fx-presentation.ts
 832  apps/web/src/routes/Converter.tsx
 819  apps/api/src/index.ts
 812  apps/web/src/components/insights/Signals.tsx
 778  packages/insights/src/definitions.ts
 568  apps/web/src/routes/BatchConverter.tsx
 546  packages/insights/src/scoring.ts
 545  apps/web/src/components/insights/VerdictMeter.tsx
 544  apps/web/src/i18n/en.ts
 533  apps/web/src/i18n/fa.ts
 503  apps/web/src/routes/LiveRates.tsx
 494  packages/insights/src/adapters/derived.ts
 489  apps/web/src/components/insights/TrendChart.tsx
 435  apps/web/src/lib/snapshot-store.ts
 432  packages/scraper/src/tgju.ts
 430  packages/insights/src/fx/job.ts
 426  apps/web/src/routes/History.tsx
 424  packages/insights/src/markets/compute.ts
 422  apps/web/src/components/insights/HistoryChart.tsx
 422  apps/web/src/components/LedRateBoard.tsx
 413  apps/api/src/admin.ts
 411  apps/web/src/components/LedGoldBoard.tsx
```

Not every file >400 lines is a problem — the copy corpora are large by
nature. Judge cohesion, not just length; prioritize the routes, the
engine, the api monolith, and the insights config.

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test`.
   Shell gotcha from the last session: the tool cwd resets — use
   `pnpm -C <dir>` / `git -C /home/z/currena …` and absolute paths.
2. Conventional commits, one logical change each; push often; **check the
   Actions run is green before stacking the next change.**
3. Local verification: `pnpm --parallel dev` (web :5173, proxy expects api
   :8787) or wrangler dev on a free port; verify with agent-browser
   (+ VLM for visual checks, DOM checks are ground truth — VLM misreads).
4. Deploy: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter
   @currena/api run deploy` (and the markets equivalent when it changed).
   If a change alters a **snapshot format**, run the snapshot job FIRST
   so KV holds the new format before the read-side validation sees it.
5. Secrets discipline: tokens arrive in chat, never get committed; the
   GitHub token goes into the push remote URL once, then scrub it; wipe
   one-off scripts after use; remind the owner to rotate tokens at the end.
6. User-facing strings are always en+fa with the copy manifest — run
   `pnpm run copy:audit` after any copy change; never introduce "is/are"
   verb agreement across locales (telegraphic templates); the buy/sell
   acceptance regexes need the inflected forms.

## 6. Gotchas learned the hard way (2026-10-14 additions)

- **Edge-cache HITs rewrite headers serve-time**: the zone's legacy
  Browser Cache TTL once rewrote `max-age=300`→`14400` on HITs only
  (curl/HEAD missed it — verify cache headers in a real browser context).
  Now set to 0 = Respect Existing Headers (D-12). If a cache anomaly
  appears, check the zone settings FIRST, then Cache Rules, then origin.
- **KV serve-path `cacheTtl` must match the route's `s-maxage`** or the
  KV edge cache keeps regenerating stale responses after a TTL tightening
  (D-13 lesson: both moved 3600→300 together).
- **KV free-tier daily write cap (429/10048)** auto-recovers at 00:00 UTC;
  it has only ever bitten same-day manual dispatches, never scheduled runs.
- Stored objects grew by design in v1.3 (`plain` fields, +128 B, CR-capped
  <1 KB). Any new stored field needs: schema bump discipline + old-reader
  tolerance (`plain` is optional on the reader side on purpose).
- Quarterly staleness limits are calibrated per SOURCE release calendar
  (BEA/ABS 215 d), never per cadence — see I19 notes.
- Quarterly connection legs carry no change30d; their lean comes from F3
  level bands (connections.ts).
- **Cron slots**: account free-tier limit 5 was full (api 1 + markets 2 +
  2 legacy workers). The owner migrated other projects off the account —
  recheck actual usage before relying on free slots.

## 7. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`

All three transited chat on 2026-10-14 — rotation recommended; if not
rotated, the existing ones work.
