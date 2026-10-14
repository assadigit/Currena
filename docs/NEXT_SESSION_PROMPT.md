# Currena — Next Session Brief

Hand-off date: 2026-10-15 (the REMAINING_WORK session close, plus the
2026-10-15c docs-only close of D-25/D-26/D-27 — runtime-identical to
the final code commit `fb1fded`, both workers deployed + live-verified
from it).
· Production: https://currena.ir · Deployed: currena-api `155ecb3d` +
currena-markets `9b5ff7e0` (both 2026-10-14T19:52Z from `fb1fded`, see
docs/DEPLOY.md's last session record; the D-decision commit after it
is docs-only — zero served bytes changed, no deploy needed).
· **REMAINING_WORK.md IS CLOSED**: WS-1 (A-5/A-6/A-8, D-19/D-20/D-21) →
WS-2 (C-6/C-8/C-9, D-22) → WS-3 (6 fixed + 3 declined, D-23) → WS-4
(B-4 + all six splits, characterization-first) → WS-5 (34 → 14
advisories, the declines reasoned in D-24) → WS-6 (the three option
papers D-25/D-26/D-27 — decided 2026-10-15c, all KEEP, the owner's
go in session chat) — every item either done or declined with a
recorded reason. Nothing from that work order remains open.
· The next session's work is whatever the OWNER commissions next: the
standing backlog is `docs/BACKLOG.md`; NO D-row awaits Ali anymore
(D-25/D-26/D-27 were decided 2026-10-15c, all KEEP); the owner-side
checklist below carries the rest.

---

## 1. What this project is

**Currena** — a bilingual (en/fa, RTL) currency-converter PWA for Iranian
open-market **Toman** rates + international pairs + a weekly **Insights**
product, at **https://currena.ir**, entirely on Cloudflare Workers (Free
plan, permanently — see the I0 gate decision).

- `apps/api` — Hono on Workers (`/api/*`, zero-JS `/admin`, serves the
  built SPA). Post-split structure: `src/index.ts` (~186-line composer)
  over `routes/{rates,insights,ops,internal,admin}.ts`, plus `http/`,
  `security/`, `default-service.ts`, `cron.ts`. Cron `* * * * *`
  keep-warms the live rates ladder. The insights routes re-evaluate
  per-row staleness at serve time (D-21) with an injectable clock.
- `apps/markets` — the markets worker: source scrapers + the daily
  snapshot crons `30 23 * * 1-5` + `30 1 * * 2-6` UTC (main + retry),
  carries the insights fx engine and the EODHD stock ingestion. The put
  gates take the run's `prev` (D-20) — worst-case subrequests 48.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, ~10
  routes, en/fa RTL). Insights is a lazy chunk (581/137 vs 582/137
  budget). Fully post-split: `components/insights/config/`,
  `world-currencies/`, `world-markets/`, `signals/`,
  `routes/insights-sections/`, `routes/receipt/`, `routes/settle/`,
  `routes/converter/`, `lib/fx-presentation/` — NO file in web/src
  exceeds ~560 lines.
- `packages/core` — zod contracts (`schemas.ts` ~1,173 lines: the KV
  snapshot schemas live here — **storage compatibility is sacred**) +
  the consolidated MetaResponse (B-4).
- `packages/insights` — the compute engine: `fx/` domain modules,
  `markets/compute.ts` (+ `reStaleMarketsSnapshot`), `fx/summary.ts`
  (+ `reStaleFxSnapshot`), `scoring.ts`, `definitions.ts`, adapters,
  `fx/job.ts` (per-currency fallback validation, D-19).
- `packages/scraper` — TGJU + Frankfurter + … source scrapers.

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted. Then `docs/PROGRESS.md` (full session
history), `docs/DECISIONS_FOR_ALI.md` (D-01…D-27), `docs/DEPLOY.md`
(deploy procedure + every session's deploy record),
`docs/specs/traceability.md`.

## 2. Current verified state (2026-10-15 close)

- Gates green at close: **1,255/1,255 tests** (core 190 · scraper 67 ·
  insights 356 · markets 13 · api 208 · web 421), typecheck 6/6, **lint
  0 errors** / 14 accepted advisories (D-24 — every remaining warning is
  a DESIGNED pattern with a stated reason), Persian copy audit clean,
  `pnpm audit` zero advisories, bundle budgets held (entry **294.60/
  88.50** vs 296/89.5 — the Converter split's prop plumbing; Insights
  lazy 581.45/136.82 vs 582/137).
- Freshness chain (D-12 + D-13): snapshot crons 23:30 (Mon–Fri) + 01:30
  (Tue–Sat retry) → markets worker → KV snapshots → api serve path (KV
  read `cacheTtl` 300 s) → edge (`s-maxage=300`) → browser
  (`max-age=300` + ETag revalidation). A returning visitor sees the
  daily update within ~5 minutes. Verified live post-deploy
  2026-10-14T19:52Z (304 + headers re-proven).
- A11y floor: skip link, h1s, useDialogFocus discipline on every dialog,
  REAL tablists (Settle/BatchConverter), radio-group arrows
  (AlertsDialog), roving-keys helper shared, real anchors in the nav/
  footer/quick-tools, live regions, labeled validation errors.
- The jsdom component-test environment is installed (C-9/D-22):
  `@vitest-environment jsdom` per-file docblocks, vi.resetModules per
  test, fake timers, stubbed fetch — Converter/LiveRates/Receipt/Settle
  suites pin the hydration + money paths.
- Crons on the account: 5-cron free-tier limit — api 1 + markets 2 +
  legacy workers 2. Re-verify before ever adding a trigger.

## 3. What is deliberately LEFT (with reasons — do not silently "fix")

1. **14 ESLint advisory warnings** (D-24): animation loops (Odometer,
   LiveRates flash), data-fetch state machines (Insights route,
   DetailsPanel, TrendChart), expand-token responses (Signals/
   AboutTheData/Together), use-alert-evaluation's toast-on-change,
   Converter's deep-link one-shot set-state + its DELIBERATE onSubmit
   omission, useDialogFocus's ref-in-cleanup, LiveRateLine's
   compilation-skip notice. Each is a designed pattern; forcing them
   lint-clean is behavior churn for a badge.
2. **D-25/D-26/D-27 are DECIDED (2026-10-15c): all three KEEP** — R7's
   euro-led card stays rare by basket mathematics, R5 stays at 15.3% of
   weeks, /api/convert keeps its exotic-but-finite Number() forms. Zero
   behavior change resulted. If Ali ever wants (b)/(c) on any of them,
   the overrule path is replying to the row in DECISIONS_FOR_ALI.md.
3. **i18n copy corpora** (`insights-copy-en/fa.ts`) and
   `packages/core/src/schemas.ts` — data-file and sacred-surface
   respectively; unchanged policy.
4. **Owner-side items**: Telegram ingest-alert secrets, the I7
   launch-approval exit gate (BACKTEST review), the signals-wording
   legal read (S3), connection-evidence confirmations, **token
   rotation** (all three tokens transited chat in ≥5 sessions now).

## 4. Next-session work

Whatever the owner commissions. Likely candidates from the record:
- `docs/BACKLOG.md` items.
- If a NEW monolith grows past ~800 lines, the Phase-3/WS-4 split
  recipe is now well-trodden: characterization tests first (the jsdom
  env is installed), shell keeps state/wiring, leaf modules take
  value/setter props, one tree per commit, budgets re-checked (entry
  headroom is now only 1.4 kB raw — a further Converter-area split
  would need a budget conversation first).

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test` →
   `pnpm run lint` → `pnpm run copy:audit` → web build +
   `node scripts/check-bundle-budget.mjs`. Shell gotcha: the tool cwd resets
   between calls — use `pnpm -C <dir>` / `git -C /home/z/currena …` and
   absolute paths.
2. Conventional commits, one logical change each; push often; **check the
   Actions run is green before stacking the next change.** CI = typecheck →
   lint → tests. Rapid successive pushes cancel superseded runs — only
   the latest HEAD run matters.
3. Local verification: `pnpm --parallel dev` (web :5173, proxy expects api
   :8787) or wrangler dev on a free port; verify with agent-browser
   (+ VLM for visual checks — DOM checks are ground truth, VLM misreads).
4. Deploy: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter
   @currena/api exec wrangler deploy` (and the markets equivalent when it
   changed). Re-putting `EODHD_API_TOKEN` after a markets deploy is
   idempotent belt-and-braces.
5. Secrets discipline: tokens arrive in chat, never get committed; the
   GitHub token lives only in push remote URLs / one-off commands, then
   scrub; wipe one-off scripts after use; remind the owner to rotate
   tokens at the end.
6. User-facing strings are always en+fa with the copy manifest — run
   `pnpm run copy:audit` after any copy change; never introduce "is/are"
   verb agreement across locales (telegraphic templates); the buy/sell
   acceptance regexes need the inflected forms.

## 6. Gotchas learned the hard way

- **Tool-output display artifacts** (2026-10-15 lesson, audit A-10
  retraction): bracketed `[m…` sequences and `const [m` destructuring render
  mangled in tool output. ALWAYS byte-verify (od/awk/perl) before treating
  apparent "corruption" as real.
- **Batch line-surgery on big files is error-prone** (this session):
  prefer marker-anchored single-block edits over multi-block python
  string surgery; ALWAYS tsc + eslint + tests after any reorder (a
  duplicated block cost one debug cycle).
- **The copy manifest tracks Persian literals BY FILE PATH** — a module
  split that moves one needs the manifest entry re-pointed (text+hash
  unchanged, note records the move) or copy:audit fails. Precedents:
  world-markets/shared.tsx, fx-presentation/format.ts.
- **Edge-cache HITs rewrite headers serve-time**: the zone's legacy
  Browser Cache TTL once rewrote `max-age=300`→`14400` on HITs only
  (curl/HEAD missed it — verify cache headers in a real browser
  context). Now set to 0 = Respect Existing Headers (D-12). If a cache
  anomaly appears, check the zone settings FIRST, then Cache Rules, then
  origin.
- **KV serve-path `cacheTtl` must match the route's `s-maxage`** (D-13:
  both moved 3600→300 together) or the KV edge cache keeps regenerating
  stale responses after a TTL tightening.
- **KV free-tier daily write cap (429/10048)** auto-recovers at 00:00
  UTC; it has only ever bitten same-day manual dispatches, never
  scheduled runs.
- Stored objects grew by design in v1.3 (`plain` fields, +128 B,
  CR-capped <1 KB). Any new stored field needs: schema bump discipline +
  old-reader tolerance (`plain` is optional on the reader side on
  purpose).
- Quarterly staleness limits are calibrated per SOURCE release calendar
  (BEA/ABS 215 d), never per cadence — see I19 notes. The serve-time
  re-staling (D-21) does NOT touch the indicator `stale` STATUS (cadence
  + grace semantics, I19) — only the markets/fx 5-day row flags.
- **Sandbox resets between sessions** (2026-10-15 lesson): the local
  clone and every non-persisted credential can vanish at a context
  rollover — commit and push often; the shared worklog
  (`/home/z/my-project/worklog.md`) is the recovery ledger; never rely
  on uncommitted work surviving. This session recovered mid-session
  state from git history + the worklog after a rollover.

## 7. Credentials (the owner pastes fresh ones at session start)

- GitHub token (repo `assadigit/Currena`, private): `<paste>`
- Cloudflare API token + Account ID `5f123468027e4b2094167df1d2f2e852`: `<paste>`
- EODHD API key (secret on currena-markets; re-put is idempotent): `<paste>`

All three transited chat on 2026-10-14 AND 2026-10-15 (twice) — rotation
strongly recommended; if not rotated, the existing ones work.
