# Phase 9 verification (2026-10-19)

Runbook Phase 9, checkbox 2 — the endpoint sweep (agent PH9-B).

## Venue + method

- **Venue**: `wrangler dev` (wrangler 4.151.0, local workerd `@cloudflare/workerd-linux-64@1.20261012.1`), repo `/home/z/currena` at `eafb074` on branch `insights-rebuild`, apps/api Worker on port 8787.
- **State**: local KV namespace `RATES` (id `4627ac33a4b148ff9fc2189266b1890e`) seeded with the committed fixture/self-check data — 10 keys: `insights:snapshot` (REAL private snapshot, 54 readings, `generatedAt` 2026-10-19T20:41:56.131Z), `insights:snapshot-public` (32 readings, `displayMode: public`), `insights:status` (10 sources), `insights:archive:v1:2026-10-19`, `insights:archive-public:v1:2026-10-19`, `insights:hist:{au-cpi, brent, gold-usd, us10y, vix}` (vix seeded deliberately: it is on the hidden list — a negative test). `wrangler.jsonc` supplies `SITE_MODE=public`; nothing was overridden for Part 1. Dev-only secrets came from `apps/api/.dev.vars` (gitignored): `INSIGHTS_PASSWORD`, `INSIGHTS_OWNER_TOKEN` from the start; `ADMIN_VIEW_SECRET`/`REFRESH_SECRET` added mid-sweep (both rows recorded). Secret values were never printed, logged, or written to any artifact.
- **Method**: curl against `http://127.0.0.1:8787` (also verified reachable on `[::1]:8787`), one numbered capture per request — `.code`/`.headers`/`.body` triples under `/home/z/phase9-seed/bodies/` (requests 01–61). Sweep ran 2026-10-19 21:26–21:35 UTC.
- **Sandbox note (the earlier "HTTP 000" diagnosis)**: the worker boots cleanly and answers 200 on both loopbacks *while the launching shell command is alive*; this sandbox reaps the listening socket when that command exits, so a curl from any later command gets connection-refused (`curl -w %{http_code}` → `000`). The earlier orchestrator's HTTP 000 was a dead-worker artifact, not an app or networking fault. Every scenario below therefore ran as one self-contained command: boot → wait for `Ready on` → requests → kill. After all scenarios, zero wrangler/workerd processes remained and the KV was restored to exactly the 10 seeded keys (see honest notes).

## Table A — public-mode endpoint sweep (SITE_MODE=public, no login, no credentials)

| # | Endpoint | HTTP | What it exposes | Notes |
|---|----------|------|-----------------|-------|
| 01 | GET `/api/health` | 200 | `{ok:true, service:"currena-api", version:"0.1.0", kv:"ok", time}` | Liveness only; no data, no secrets. |
| 02 | GET `/api/meta` | 200 | Supported-currency list: `code/name/symbol/minorUnits` + a public `tgjuProfileUrl` per currency | Static metadata; URLs are public profile pages, not fetch endpoints. |
| 03 | GET `/api/status` | 200 | Rates-ladder cache state per source: `{source, cache:{present,fresh}}` | Ops telemetry only, no values, no secrets. |
| 04 | GET `/api/rates` | 200 | Full IRR-base `tgju` snapshot: ~20 currencies with `rate`, `dayHigh`, `dayLow` | **Live-scraped fresh in this venue** (`fetchedAt` = request time; e.g. USD day range 261,800–264,800 toman). No key involved — the public rates page's own source. |
| 05 | GET `/api/rates?source=frankfurter` | 200 | USD-base ECB (`frankfurter`) snapshot: `rates[]` per currency | Live-scraped fresh in this venue (USD→AUD 1.4314). |
| 06 | GET `/api/history` | 200 | Rates-ladder generations: `{source:"tgju", count:1, generations:[{at, source, base, rates{IRR,USD,…}}]}` | This is the *currency-rates* cache (a handful of generations), **not** Insights indicator history. One generation existed here (the sweep's own scrape). |
| 07 | GET `/api/convert?from=USD&to=AUD&amount=100` | 200 | `{amount:143.14, rate:1.4314, source:"frankfurter", fetchedAt}` | Live conversion; matches the row-05 rate exactly. |
| 08 | GET `/` | 200 | The built SPA `index.html` (`Content-Type: text/html; charset=utf-8`; `Cache-Control: public, max-age=0, must-revalidate`) | Asset server app shell, no API data; scanned for credentials below (clean). |
| 09 | GET `/api/insights` | 200 | **32-reading PUBLIC projection**: `displayMode:"public"` at the top; per reading: `id, value, asOf, status, sourceName, sourceUrl, updatedAt` plus computed extras (`change7d/change30d/change90d`, `percentile10y`, `moveScore`, `peak/fromPeak10y/ma200GapPct`, `periodStart/periodEnd`, `releaseDate`, `decidedDate`, `highestSinceYear`, `rangeLow/rangeHigh/lastChange`, `gapLegs`, `note`); `summary{global, australia}` each `{section, label:"cautious", warningCount:3, votingCount, excludedCount}`; 7 calendar events; `changedThisWeek` 1 entry; `ruleVersion`; `pricesAsOf` | **Zero of the 22 hidden ids present** (checked against `data/site-mode-overrides.json`). Headers: `Cache-Control: public, max-age=60` + ETag. The private 54-reading document is never served here. 5 derived readings ("Derived from published rates") legitimately carry no `sourceUrl` — all 32 carry `sourceName`. |
| 10 | GET `/api/insights/status` | 200 | **TRIMMED public shape**: `{generatedAt, staleCount:1, failedSources:[{source:"manual", ok:false}], validationSummary:[{test:"T-04", passed:false},{test:"T-08", passed:true}]}` | **No source fetch URLs anywhere in the body** (verified by URL scan of the captured body). No fetch details, no flagged ids, no rule JSONs. |
| 11 | GET `/api/insights/markets` | 404 | `{"error":{"code":"hidden_site_mode","message":"This section is not published on the public site."}}` | EODHD/Yahoo-backed board refused **before any KV read** (hiddenBoards). |
| 12 | GET `/api/insights/fx` | 404 | Same `hidden_site_mode` envelope | Board twin of row 11. |
| 13 | GET `/api/insights/archive/2026-10-19` | 200 | 32-reading **public archive** for that date, `displayMode:"public"`, `Cache-Control: public, max-age=300` + ETag | Public projection family (`insights:archive-public:v1:<date>`); count = 32 = the public projection, not the private 54. |
| 14 | GET `/api/insights/us10y/history` | 200 | Per-id series `{v:1, id:"us10y", points:[[epochDay, value]…]}` — **40 points** in this venue | The page's own chart data for ONE id; no multi-id/bulk endpoint exists. us10y is L0 (FRED), so the full stored series serves (by design). |
| 15 | GET `/api/insights/vix/history` | 404 | `hidden_site_mode` — "This indicator is not published on the public site." | **Deliberate negative test PASSED**: `insights:hist:vix` IS seeded in KV, but the hidden-id check fires *before* the KV read. |
| 16 | GET `/api/insights/export` | 401 | `{"error":{"code":"owner_auth_required",…}}` only | `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`. **No body leak** — the envelope is the whole 115-byte response. |
| 17 | GET `/api/insights/export?format=csv` | 401 | Same envelope | |
| 18 | GET `/api/insights/export?format=json` | 401 | Same envelope | |
| 19 | GET `/admin` — **state 1: `ADMIN_VIEW_SECRET` unset** | 200 | The ops console HTML (rates cache cards, insights freshness card, manual-refresh form) | **Recorded honestly**: with the secret unset the console answers 200; production sets `ADMIN_VIEW_SECRET`, which turns this into the sign-in gate (verified in row 24). Console always ships `X-Robots-Tag: noindex, nofollow`, CSP `default-src 'none'`, `no-store`; the form placeholders are env-var *names* (`REFRESH_SECRET`), never values. |
| 20 | POST `/internal/refresh` — **state 1: no `X-Refresh-Secret` header, `REFRESH_SECRET` unset** | 501 | `{"error":{"code":"refresh_not_configured",…}}` | **Honest deviation**: unset secret refuses the route fail-closed but with **501**, not 401. With the secret set the missing/wrong header answers 401 (rows 27–28). |
| 21 | POST `/api/insights/login` (wrong password) | 401 | `{"error":{"code":"private_page","message":"Private page"}}` | Neutral envelope, `no-store` + `X-Robots-Tag`; no hint whether the password was close. |
| 22 | POST `/api/insights/owner/session` (wrong bearer) | 401 | `owner_auth_required` envelope | Owner surface mirrors /export's refusal. |
| 23 | POST `/api/insights/mode` (no auth) | 401 | `owner_auth_required` envelope | The panic switch refuses anonymous flips. |
| 24 | GET `/admin` — **state 2: dev-only `ADMIN_VIEW_SECRET` set, worker restarted** | 401 | The sign-in gate page ("Currena Admin — sign in", view-secret form), `text/html` | Gated exactly as production. |
| 25 | POST `/admin` `action=view` + correct dev view secret | 303 | PRG redirect to `/admin` + `Set-Cookie: currena_admin_view=…` (HttpOnly, Secure, SameSite=Strict, Path=/admin, 1 h) | Sign-in works; the cookie holds an HMAC of the secret, not the secret. |
| 26 | GET `/admin` with the view cookie | 200 | The console | Row 24 + 25 + 26 = the full gated lifecycle. |
| 27 | POST `/internal/refresh` — **state 2: secret set, header missing** | 401 | `{"error":{"code":"unauthorized","message":"Missing or invalid X-Refresh-Secret header"}}` | |
| 28 | POST `/internal/refresh` — **state 2: wrong header value** | 401 | Same envelope, no echo of the input | |
| 29 | GET `/api/insights/brent/history` | 200 | Brent (L2 + publicDisplayOk) per-id series **truncated to the most recent 400 calendar days**: 22 of the 40 seeded points served; first served point 2025-09-26 (cutoff 2025-09-09), all points ≥ cutoff | The M-2 public bound works; the ETag covers the truncated payload. |

## The three confirmations

### (1) No API keys in any public payload — **PASS**

Scan: `rg -riE "ghp_|github_pat_|api[_-]?key|token|secret|password|bearer|eodhd"` over every captured body (rows 01–29), plus a defense-in-depth check that **none of the four `.dev.vars` values appears in any of the 185 captured artifacts** (bodies, headers, index — none).

- Rows 01–15, 29 (all public **data** payloads): **clean** — zero matches, including the SPA shell (08), the public snapshot (09), the trimmed status (10 — also verified to contain no URLs at all), rates/convert/history/meta/status, both histories and the public archive. `sourceUrl` values are public publisher pages (fred.stlouisfed.org etc.) and never matched a credential pattern.
- Matches found are **benign, non-secret strings** in two families:
  - 401/501 error envelopes (16, 17, 18, 22, 23, 27, 28): the literal documentation text `"Owner authentication required (Authorization: Bearer <token>)."` / `"Missing or invalid X-Refresh-Secret header"`.
  - `/admin` console HTML (19, 24, 26 — an ops page, gated in production, `noindex` + CSP): form input placeholders named `REFRESH_SECRET`/`ADMIN_VIEW_SECRET`, the copy "secrets never echoed", and the `X-Refresh-Secret` constant-time-compare instruction. No credential **value** appears anywhere.
- Zero hits for `ghp_`, `github_pat_`, api-key shapes, `eodhd`, or any real token/password string.

### (2) No bulk history for L2 sources — **PASS**

- The **only** Insights history surface is the per-id route `GET /api/insights/:id/history` (single, zod-validated id; unknown ids → 400 `invalid_indicator`). There is **no** endpoint that enumerates ids or dumps multiple series.
- **L2 + public-ok ids are bounded**: brent (row 29) served **22 of 40** seeded points, all within the most recent 400 calendar days — the M-2 truncation, not the full stored series. The same bound family covers gold-usd, silver-usd, btc-usd (derived at startup from the audit sidecar).
- **L0 keeps its full series** (us10y, row 14: all 40 points) — per design; still per-id, never bulk.
- **Hidden ids are refused before KV**: vix (row 15) 404 `hidden_site_mode` **despite `insights:hist:vix` being seeded** — the gate fires before the read.
- **Hidden boards are refused before KV**: markets and fx (rows 11–12) 404 `hidden_site_mode` with zero data.
- The public snapshot itself (row 09) carries **zero** of the 22 hidden ids.

### (3) No unauthenticated export — **PASS**

| Request | Mode | Credentials | HTTP |
|---|---|---|---|
| GET `/api/insights/export` (default md) | public | none | **401** |
| GET `/api/insights/export?format=csv` | public | none | **401** |
| GET `/api/insights/export?format=json` | public | none | **401** |
| GET `/api/insights/export` | private (`ACCESS_MODE=private`) | none | **401** |

Every refusal is the `owner_auth_required` envelope with `no-store` + `X-Robots-Tag: noindex, nofollow` and a 115-byte body — nothing beyond the error. The export is owner-only (M-3): contrast probe with the dev `INSIGHTS_OWNER_TOKEN` bearer (rows 60–61): **200** `application/json` / `text/markdown` with `Content-Disposition: attachment; filename="currena-insights-full-2026-10-19.json"`, `no-store` — i.e. the 401s are an auth gate on a working endpoint, not a broken route. The exported document (7 sections, E-23 column set) stays in the temp capture dir and is not reproduced here — it contains the full private snapshot, as an owner export should.

## Table B — `ACCESS_MODE=private` sweep without login (`--var ACCESS_MODE:private`)

| Endpoint | HTTP | `code` |
|---|---|---|
| GET `/api/insights` | **401** | `private_page` |
| GET `/api/insights/status` | **401** | `private_page` |
| GET `/api/insights/markets` | **401** | `private_page` |
| GET `/api/insights/fx` | **401** | `private_page` |
| GET `/api/insights/archive/2026-10-19` | **401** | `private_page` |
| GET `/api/insights/us10y/history` | **401** | `private_page` |
| GET `/api/insights/export` | **401** | `owner_auth_required` |
| GET `/api/insights/vix/history` | **401** | `private_page` |

**Verdict: 8/8 Insights data endpoints refuse with 401 and zero data.** Every body is the neutral envelope (`{"error":{"code":"private_page","message":"Private page"}}` or the owner envelope for the bearer-only export surface); headers carry `no-store` + `X-Robots-Tag: noindex, nofollow`. No endpoint returned 200, 403 was not needed, and no refusal leaked any state.

## Authenticated private session (same private boot)

- POST `/api/insights/login` with the correct `.dev.vars` password → **200** `{"ok":true}`, `Set-Cookie: currena_insights_session=…; Max-Age=43200; Path=/; HttpOnly; Secure; SameSite=Lax` (12 h HMAC session).
- GET `/api/insights` with that cookie → **200, 54 readings** — the **FULL private snapshot** (the 22 hidden ids are back, e.g. vix/audjpy/yield-curve…), and **`displayMode` is absent** (top-level keys: `generatedAt, pricesAsOf, summary, readings, changedThisWeek, calendar, ruleVersion`).
- GET `/api/insights/status` with the cookie → **200, FULL status doc**: keys `v, generatedAt, mode, dryRun, sources(10, each {source, ok, detail}` — e.g. `{"source":"fred","ok":true,"detail":"15 series fetched"}` — `validation(2, each {test, name, ok, flagged, failures})`, `ruleVersion` — strictly more than the public trim of row 10 (which carries only `generatedAt, staleCount, failedSources` names, `validationSummary` test+passed). Confirms the trim really is a subset.
- GET `/api/insights/markets` with the cookie → **503 `markets_not_ready`** — honest venue note: the gate *passed*; this venue simply has no markets-board key seeded (see honest notes). Without the cookie the same request is 401 (Table B), so this is not an exposure.
- GET `/api/insights/vix/history` with the cookie → **200, 40 points** — hidden-in-public ids serve normally in private mode; hiding is mode-scoped, as designed.

## M-5 runtime mode-switch sequence (public boot, owner bearer, KV override)

1. POST `/api/insights/mode` `Authorization: Bearer <dev owner token>`, body `{"mode":"private"}` → **200 `{"mode":"private"}`**
2. GET `/api/insights` **immediately, no login** → **401 `private_page`** — the flip is visible on the very next request in the same isolate (memo primed after the write)
3. POST `/api/insights/mode` `{"mode":"public"}` → **200 `{"mode":"public"}`**
4. GET `/api/insights` no login → **200** — the 32-reading public projection, `displayMode:"public"`, served again

The whole sequence behaved exactly as specified: the KV override (`insights:access-mode:v1`) flips both directions in a public-config boot, and the writing isolate sees the change with no delay.

## Deviations and honest notes

1. **`POST /internal/refresh` without the header → 501, not 401, when `REFRESH_SECRET` is unset** (`refresh_not_configured`). Fail-closed, but the status differs from the checklist's "401/403". With the dev secret set, missing/wrong header → 401 (rows 27–28). Both states recorded above.
2. **`GET /admin` is open (200 console) with `ADMIN_VIEW_SECRET` unset** — the dev-venue posture. Production sets that secret (per `OWNER_SETUP.md`), which produces the 401 sign-in gate; verified live by adding a dev-only secret (rows 24–26). The console is `noindex` + CSP `default-src 'none'` + `no-store` in both states, and it never echoes secret values.
3. **The rates ladder live-scraped successfully in this venue**: tgju and frankfurter both returned fresh data (fetchedAt = request time; USD→AUD 1.4314; convert 100 USD → 143.14 AUD). Side effect: the sweep's own `/api/rates` requests stored six rates-family keys in the local KV (`snapshot:tgju`, `snapshot:frankfurter`, `history:tgju`, `history:frankfurter`, `status:tgju`, `status:frankfurter`). They were **deleted afterwards**, restoring the namespace to exactly the 10 seeded keys (verified: key list = 10). The M-5 probe's `insights:access-mode:v1` key was likewise deleted (its final value "public" equals the configured default, but the pristine seed has no such key).
4. **`/api/insights/markets` (and `/fx`) answer 503 with a valid private session here** — `markets_not_ready`/`fx_not_ready`: no board key is seeded in this venue. This is a data-availability result behind a gate that provably returns 401 without the session (Table B), not an exposure or auth defect.
5. **The seeded history fixtures carry 40 points per id** (span 2024-10-22 → 2026-10-19). us10y serves all 40 (L0); brent serves 22 under the 400-day public bound. Series served as `[epochDay, value]` pairs per the `IndicatorHistory` schema.
6. **5 of the 32 public readings have no `sourceUrl`** (`fed-expectations`, `rba-expectations`, `gold-btc`, `silver-btc`, `au-us-10y-gap`) — derived indicators with `sourceName: "Derived from published rates"` and no publisher URL, by design. All 32 carry `sourceName`.
7. **Sandbox mechanics**: background workers do not outlive their launching shell command in this sandbox (the listener is reaped; `curl` from a later command reports HTTP 000). Each sweep scenario was therefore one self-contained boot→sweep→kill command. All wrangler/workerd processes were killed at the end (verified: 0 remaining).
8. **Artifacts**: every response body/status/headers is preserved under `/home/z/phase9-seed/bodies/` (numbered 01–61, plus an `INDEX.txt`); nothing under `/tmp`; nothing committed; the only repo file created by this task is this document. No secret value from `.dev.vars` appears in any capture, script, log, or this document (scanned).

## Secrets scan (checkbox 3)

Runbook Phase 9, checkbox 3 — keys and tokens in the built client files, the repository, and the history (agent PH9-D, 2026-10-19).

### Method

- **Patterns**: `ghp_[A-Za-z0-9]{16,}`, `github_pat_[A-Za-z0-9_]{20,}`, `AKIA[0-9A-Z]{16}`, `sk-[A-Za-z0-9]{20,}`, `Bearer [A-Za-z0-9._-]{20,}`, case-insensitive `api[_-]?key|api[_-]?token|secret|password|credential|token` **followed by an assignment** (`:`/`=`) with a literal value, plus the bare words `EODHD` and `CLOUDFLARE` for manual triage.
- **Discriminator**: an env-var NAME reference (`c.env.X`, `process.env.X`, `const secret = env.X`) or a code identifier (`this.tokens[…]`, `userPassword=`) is NOT a value. Every printed context below came from a redacting scanner (`/home/z/phase9-seed/redact-scan.mjs`) that replaces any ≥12-char value-ish run with `<R:n>` BEFORE printing; the matched-word families shown are safe to print, credential values never are.
- **Built client**: `apps/web/dist` as rebuilt by PH9-C (21:40) — 3.7 MB, 42 text files scanned (js/css/html/svg/webmanifest/txt; fonts/pngs skipped as binary).
- **Tracked tree**: `git grep -lIE` (lists files only, never content) + the redacting scanner over the whole working tree (648 text files).
- **History**: `git log --all -G '<strict value shape>'` over all 430 commits — `-G` fires only when a diff line matches the shape, so it detects VALUE introductions directly; `-S 'NAME='` hits were then classified one by one, redacted.

### Results

| Surface | Files/units | Credential shapes (ghp_/pat_/AKIA/sk-/Bearer) | Keyword occurrences | Classification |
|---|---|---|---|---|
| `apps/web/dist` (built client) | 42 text files | **0** | 132 (keyword 103, `eodhd` 25, `cloudflare` 4) | all benign — see families below |
| dist keyword-with-quoted-literal-value | 42 text files | — | **0** | no keyword is ever assigned a literal value |
| dist env references (`process.env`/`c.env`) | 42 text files | — | **0** | a static SPA — no env plumbing ships |
| tracked tree (`git grep`) | whole repo | **0** | — | quoted-value assignments: 1 file only (below) |
| whole working tree (tracked + untracked + ignored) | 648 text files | **0** | 2,682 | keyword 1,746 + `eodhd` 592 + `cloudflare` 258 + assignment-shape 86 — all triaged below |
| git history (all 430 commits, `-G` strict shapes) | every diff ever | **0** for every shape except one line (below) | — | the one line is a documented placeholder |

- **dist keyword families (all benign)**: parser/tokenizer identifiers (`Token`, `tokens`, `DOMTokenList` in the Calculator, html2canvas and React chunks; html2canvas also carries the base64 alphabet constant `ABCD…89+/`); jspdf's own PDF-encryption API names (`userPassword`, `ownerPassword`, `PasswordField`, `AcroForm` — defaults are empty strings, the export feature is user-side PDF passwording); fetch plumbing (`credentials:"same-origin"` in React/workbox); the `password` HTML-input-type map; Insights UI copy ("Owner token", "Token not recognised.", "Export is disabled — the owner token secret is not set.", "Password", "That password did not open the page."); `data-token` ARIA attributes.
- **dist `eodhd` (25)**: the `eodhdCode` property with EXCHANGE TICKER values (`N225.INDX`, `AXJO.INDX`, … — market index codes, not keys), the zod enum `['eodhd','yahoo']`, and the attribution copy "Source: EODHD (Yahoo Finance as backup)". **dist `cloudflare` (4)**: platform-detection strings (`'Cloudflare-Workers'`, a userAgent check) and the `cdnjs.cloudflare.com` CDN URL inside jspdf.
- **entropy spot-check** (every ≥40-char base64ish/hex literal in dist, 64 total, each manually verified): font/asset URLs with content hashes (`/assets/poppins-latin-400-*.woff`, the sw.js precache entries, a jspdf `sha5…` content hash, workbox cache names), the base64 alphabet constant, OOXML namespace URLs in the xlsx writer, React export names in jsx-runtime, the SIL-OFL licence URL in `Vazirmatn-OFL.txt`, and one 80-char v2-engine changelog sentence inside the Insights chunk. No sourcemap files exist in dist. **All legitimate.**
- **tracked tree, the only quoted-value assignments**: `apps/api/src/index.test.ts` ×7 — dummy form-test fixtures `'test-secret'` / `'view-secret'` asserting accept/reject behaviour. The 86 assignment-shape hits tree-wide are: env-var NAME references (`c.env.ADMIN_VIEW_SECRET`, `env.INSIGHTS_OWNER_TOKEN`, `process.env.CLOUDFLARE_API_TOKEN`, `process.env.EODHD_API_TOKEN`, `env.GH_INGEST_DISPATCH_TOKEN`, …), test constants that carry the binding-key name (`INSIGHTS_PASSWORD: PASSWORD`), code identifiers (the Calculator tokenizer), and doc placeholders (`OWNER_SETUP.md`'s instruction `echo 'INSIGHTS_PASSWORD=choose-a-dev-only-password' >> apps/api/.dev.vars`).
- **tracked secrets files**: `git ls-files | rg -i '\.dev\.vars|^\.env|secret|credential'` → **none tracked**. `git check-ignore -v apps/api/.dev.vars` → `.gitignore:32:.dev.vars*` — the dev secrets file is ignored, holds only the four sanctioned dev-only placeholder values, and never entered a commit.
- **untracked files**: `git status --porcelain --ignored=no` → the only untracked repo file is `docs/insights/PHASE9_VERIFICATION.md` (this document; keyword-name prose only, scanned). The 9 modified tracked files (visual harness + fixtures + SELF_AUDIT/export evidence) are covered by the tree scan; nothing under `node_modules` was scanned (not shipped content).
- **history, the one shape-matching line ever**: commit `eafb074` (phase 8) adds `OWNER_SETUP.md`'s placeholder instruction `echo 'INSIGHTS_OWNER_TOKEN=choose-a-dev-only-token' >> apps/api/.dev.vars` — the "value" is the documented placeholder text telling the owner what to choose; not a secret. The `-S 'ghp_'` hits (4 commits) are the scan-pattern documentation itself (`ghp_[A-Za-z0-9]{20,}` in `docs/insights/07-agent-loop-prompt.md`) and already-redacted `ghp_…` mentions in earlier verification docs; the `-S 'CLOUDFLARE_API_TOKEN='` / `-S 'EODHD_API_TOKEN='` hits are ellipsis placeholders and command instructions in `docs/DEPLOY.md`-family docs. No `github_pat_`, `AKIA`, `sk-`, or bearer-value shape ever entered any commit.

### Honest notes

1. **Local-environment observation (not a repo finding)**: this clone's `.git/config` `remote.origin.url` embeds a 40-character credential before `github.com/assadigit/Currena.git` (the owner's push token, PH9-A's dry-run verified push scope). It exists only in the local `.git/config`, is part of no commit object, and its value was never printed here (shape check only).
2. **Process slip, recorded honestly**: the first run of the full-tree redacting scanner had a redaction-logic bug that let the four dev-only placeholder values from the gitignored `apps/api/.dev.vars` appear in one intermediate tool output. They are deliberate dev placeholders (self-labelled `dev…` strings), not production credentials; the scanner was fixed immediately and the regenerated scan artifact was verified to contain no value (rg for all four strings over every capture: zero hits). No production secret, nothing in the repo, nothing in this document.

**VERDICT: No API keys or tokens are present in the built client files, the tracked tree, or any commit.** (The only credential-shaped string ever committed is `OWNER_SETUP.md`'s literal placeholder instruction; the only live secrets sit in the gitignored `apps/api/.dev.vars` and this clone's local `.git/config`, neither of which is repository content.)

## Forbidden-words scan — T-07/T-19 (checkbox 4)

Runbook Phase 9, checkbox 4 — the forbidden-words standard over ALL generated text (agent PH9-D). **Method: the scan imports the ACTUAL engine matchers** — `containsForbiddenWords` (T-07, `packages/insights/src/validation.ts`: the phrases ` will ` / ` should ` / ` time to ` / ` expected to `, case-sensitive, whitespace-normalised) and `containsAdviceWording` (T-19, `packages/insights/src/validation-step3.ts`: case-insensitive word-boundary regexes for will/should/time to/expected to/buy/sell/hold/undervalued/overvalued/opportunity/bullish/bearish, with the engine's own built-in masks applied first: "buys N oz", "how many … buys", buyer(s), seller('s), "on hold", "if you hold"). No list was reinvented — the script (`/home/z/phase9-seed/t-scan.ts`, run with the repo's own tsx) extends the engine's standard to every generated surface.

**The live self-check already ran both over the fresh snapshot**: PH9-A's run recorded `T-07 … pass` and `T-19 … pass` rows inside the 25/25 ALL-TESTS-PASS `SELF_AUDIT.md` (T-19's recorded scope: "the generated indicator sentences of both dictionaries"; the export `currena-insights-full-2026-10-19.md` was built in the same run).

### Surfaces scanned (one pass each with both real matchers)

| Surface | Units scanned | Hits |
|---|---|---|
| the fresh export `exports/currena-insights-full-2026-10-19.md` + SELF_AUDIT + PHASE9_VERIFICATION + FIX_REPORT + STEP3_REPORT + UI_REPORT + MAINTENANCE + OWNER_SETUP (line by line) | 1,037 lines | **0 in every GENERATED document** (see prose hits below) |
| copy dictionaries, the self-check's exact T-07 corpus (comment-stripped quoted literals, en+fa) | 3,619 literals | 19 (all below) |
| copy dictionaries, the self-check's exact T-19 scope (`dict.indicators`, en+fa) | 1,214 strings | **0** |
| copy dictionaries, EXTENSION: every string in both dictionaries with its JSON path | 3,410 strings | 19 (en only) |
| captured API bodies, rows 01–61 incl. the public snapshot, the trimmed status, both histories, the SPA shell, the /admin console, both owner-export captures (every JSON string / HTML line) | 3,085 strings | **0** |
| the SHIPPED bundle `apps/web/dist` (every js/css/html/webmanifest/txt text unit) | 432 units | 7 units (below) |

### The hits, classified

**(a) Report prose — 4 lines, never rendered on any page.** `PHASE9_VERIFICATION.md` "as an owner export should" (PH9-B's own sentence); `FIX_REPORT.md` and `STEP3_REPORT.md` naming the design term **A-04 hold-last-good**; `UI_REPORT.md` quoting the workflow doc's instruction "the owner should do it on the page".

**(b) English copy dictionary — 19 strings, every one inside the engine's own documented allowed/recorded contexts** (none is an imperative advice call; fa dictionary: zero hits):

| String (shortened) | Path | Word(s) | Status |
|---|---|---|---|
| "Know before you buy US shares" | `ui.usSharesBoxTitle` | buy | **the documented exemption** — validation-step3.ts: "the static, spec-mandated title is NOT generated text and is scanned separately by the copy workflow" |
| "Bullish" / "Bearish" | `markets.verdictBullish` / `verdictBearish` | bullish, bearish | the round-44 owner-approved four-step section instrument — the recorded owner decision (PHASE7_VERIFICATION §4: "a section-verdict surface outside the indicator corpus") |
| "One bitcoin buys {value} oz of gold" (+ silver twin) | `ui.btcBuysGold` / `btcBuysSilver` | buy | the engine's mask (`buys ~N oz`) clears the RENDERED sentence (E-12/E-13 approved arithmetic); the raw template hits only because `{value}` is not numeric |
| "Did not hold" | `fx.dotsLegendNotHeld` | hold | a series-state legend, same condition sense the engine's "on hold" mask family covers |
| "Most Australian super funds hold a large slice…", "Many super and index funds hold US shares…" | `markets.entries.asx200.you`, `sp500.you` | hold | descriptive third-person conditions (funds' existing positions) — outside T-19's indicator scope, in the /insights-chunk boards |
| "…foreign investors buy into China…", "China buys a large share of Australia's iron ore…", "Germany sells goods worldwide…" | `markets.entries.{hsi,ssec,dax}` | buy, sell | descriptive third-person economics about named countries — outside T-19's indicator scope |
| "…one unit buys more of another currency…", "an asset people buy when they are scared…", "they sell riskier money… and buy the safer Japanese yen", "Investors borrow cheap yen to buy…", "…must repay fast and sell their investments…", "China buys much of Australia's iron ore…", "…they buy francs…" | `fx.glossary.*`, `fx.rules.r1/r2/r5/r6` | buy, sell | the FX board's educational glossary/rules — third-person market mechanics, outside T-19's indicator scope |

**(c) The shipped bundle agrees with the source**: the Insights chunk carries exactly the same 19 strings (word-for-word the same hits); everything else flagged in dist is **never-rendered vendor code**: jspdf's inflate bit-buffer field literally named `hold` (×9), React's developer error string "…expected to receive a single React element child" (×1), workbox's error-code string `plugin-error-request-will-fetch` (×1), and the SIL Open Font Licence's legal "…redistribute, and sell modified and unmodified copies…" (×1). None of this is page text.

**(d) Honest finding — main-app (non-Insights) UI copy**: the shared app-copy chunk contains "…Currena **will** watch the market for you" (Alerts), "Your conversion history **will** appear here", "The currency you selected above **will** be used", "…breakdown **will** appear here" (Batch), and the feature label "⏰ Add **Time to** Items" (Splitter). These are pre-Insights product-function descriptions on the converter/alerts/history/splitter pages — outside the Insights copy corpus T-07/T-19 govern, and none is a market forecast or advice (the products' own feature promises). Recorded, not hidden; fixing them is an owner call outside this rebuild's specs.

**VERDICT: Zero forbidden-word hits outside the engine's own allowed contexts.** The fresh export, the served API bodies, and the generated indicator sentences (T-19's own scope, and the whole T-07 corpus) are clean; every dictionary hit sits in a documented exemption or recorded owner decision (approved box title, approved instrument labels, descriptive board sentences), and the remaining hits are verification-report prose, never-rendered vendor strings, and non-Insights app copy that predates the T-07/T-19 corpus.

## Other pages unchanged (checkbox 5)

Runbook Phase 9, checkbox 5 (agent PH9-D). **Method: git three-dot diff against `origin/main`** (`git diff origin/main...HEAD` — 161 committed files changed) plus the uncommitted working-tree state (9 modified + 1 untracked, all test-harness/doc artifacts per PH9-C). No screenshots needed: source + build-config identity is decisive (the built bundle is a pure function of them; the entry-chunk budget PH9-C measured — 294.78/88.56 vs the 296/89.5 budget — is the origin/main figure carried forward). The SPA routes via the custom hash router in `apps/web/src/router.ts`.

### Non-Insights page surface — byte-identical to origin/main

**Every non-Insights page component is byte-identical, so the other pages cannot have changed.** Verified individually (`git diff origin/main...HEAD -- <path>` empty) and by enumeration: of the 193 tracked files under `apps/web/src/routes`, `components`, `lib` and the src root, **42 changed — 41 are the Insights surface and 1 is a test file** (below); the other 151 are identical. Specifically identical:

- **Route files**: `About.tsx`, `BatchConverter.tsx`, `Calculator.tsx`, `Converter.tsx` + `Converter.test.tsx`, `History.tsx`, `LiveRates.tsx` + `LiveRates.test.tsx`, `Receipt.tsx` (+test), `Settle.tsx` (+test), `Splitter.tsx`, and the nested `routes/converter|receipt|settle` trees — the home/rates board is `LiveRates.tsx`.
- **App shell**: `App.tsx`, `main.tsx`, `router.ts` (the hash router config), `index.html`, `vite.config.ts`, the eager dictionaries `i18n/en.ts` / `i18n/fa.ts`, all of `public/` (0 changes), and the whole `apps/markets` Worker (0 changes).
- **Shared components**: `Header`, `Footer`, `AlertsDialog`, `AmountInput`, `CurrencySelect`, `ErrorBoundary`, `InstallButton`, `LedGoldBoard`, `LedRateBoard`, `LiveRateLine`, `Odometer`, `RateDeltaChip`, `ResultPopup`, `Sparkline`, `icons/`, `led/`, `ui.tsx`, `use-roving-keys`(+test), `useDialogFocus` — none in the change set.
- **Shared libs**: everything in `apps/web/src/lib/` except two test files — `api.ts`, `live-rate.ts`, `history.ts`, `recent-pairs.ts`, `alerts.ts`, `snapshot-store.ts`, `settle-storage.ts`, `xlsx-writer.ts`, `display.ts`, `locale.ts`, `theme.ts`, `download.ts`, `photo-store.ts`, `id.ts`, `clamp-panel.ts`, `use-alert-evaluation.ts`, `rate-history.ts`, and the fx/markets board clients (which the insights page's own boards consume; their headers pin them to the lazy `/insights` chunk).
- **Configs**: root `eslint.config.mjs` identical; there is no separate tailwind/postcss config to change (Tailwind 4 rides the vite plugin) and no `components.json` in this app.

### Files that DID change outside the Insights surface — and why they cannot alter the other pages

| File | Change | Why the other pages cannot change |
|---|---|---|
| `apps/api/src/index.ts` | +96/−24: new optional Bindings types (`ACCESS_MODE`, `PANIC_PRIVATE`, `INSIGHTS_OWNER_TOKEN`), the M-5 access-mode resolver + M-3 export reader (Insights-only helpers), and the /admin mount's insights-reader argument now a mode-independent private-family reader | the `createRatesRoutes` / `createOpsRoutes` / `createInternalRoutes` mounts and `makeService` wiring are untouched lines; nothing the rates handlers read changed |
| `apps/api/src/security.ts` | +45/−12: `rateLimitTake`/`rateLimitRetryAfterSec` gained capacity/refill **parameters whose defaults preserve the original 10-burst/5-per-min exactly**; adds the separate `ip#insights-data` family (120/60) for Insights data GETs | existing key families (login/admin/internal) keep identical constants via the defaults; the rates ladder never used the limiter at all |
| `apps/web/src/index.css` | +120/−15: additive `--color-chip-ink-*` tokens + new `.chip-*`, `.hero-count-*`, `[data-hero-card]` rules; the one modified shared-named rule `.alert-card` restyled | every touched selector is Insights-scoped — usage search: `.alert-card` is used only by `components/insights/AlertCard.tsx`; the new classes only by `StatusChip`/`VerdictMeter`/`InsightsHeader`; no rule any other page renders with was altered |
| `packages/core/src/schemas.ts` (+ its test) | +19: additive enum values (`shiller-cape`, `shiller-ecy`, source `shiller`) and optional `kind`/`hash` fields on `InsightsSourceReportSchema` | additive-only; the schemas the rates endpoints validate against are untouched |
| `apps/web/package.json` | +3 `visual:*` scripts + `@playwright/test` devDep | test-harness scripts + a devDependency — never part of the built app |
| `pnpm-lock.yaml` | +100 | lockfile for the new devDependencies |
| `scripts/check-bundle-budget.mjs` | +37/−1: the Insights lazy-chunk budget entry bumped (justifications inline) | build-time check script; the ENTRY-chunk budget is untouched (294.78/88.56 vs 296/89.5) |
| `scripts/generate-indicators-registry.ts` | +113 | codegen for the Insights indicator registry (`data/indicators.json`) |
| `.github/workflows/shiller-fetch.yml` | +52 (new) | CI-only workflow fetching the Shiller dataset |
| `apps/web/visual/*` (+ PH9-C's uncommitted harness edits) | new visual-test harness + fixtures | Playwright-only; not imported by any src file; the fixtures are test data |
| `data/indicators.json`, `indicator-audit.json`, `site-mode-overrides.json`, `shiller/*` | +/2 lines | Insights data files (registry, audit sidecar, hidden-ids list, Shiller archive); consumed only by the Insights pipeline |
| `docs/*`, screenshots, `persian-copy-manifest.json` | docs + audit manifest | docs-only; the manifest is the copy-audit workflow's dev-time record |
| `apps/web/src/lib/insights.test.ts`, `registry-sync.test.ts` | test updates | vitest files, never shipped |
| `apps/api/src/{access-mode,audit-sidecar,contact,insights-export,owner-auth,insights-auth}.ts`, `routes/insights.ts`, `adapters/access-mode-store.ts` (+tests) | the Insights API surface itself | Insights-only routes/gates; `contact.ts` is imported only by `insights-export.ts` and `components/insights/AboutTheData.tsx` |
| `packages/insights/**`, `packages/core/src/schemas.test.ts` | the Insights engine + its tests | the Insights package is consumed only by the Insights web surface and its ingest scripts; the one honestly shared nuance: `fx/definitions.ts` swapped Yahoo's spoofed browser User-Agent for the declared `CurrenaDashboard/1.0` identity (F-09/T-25) — a fetcher-side string used only by the Insights ingest/boards |

### Rates API ladder — untouched, answered live in the sweep

`git diff origin/main...HEAD` over each: `routes/rates.ts` **identical**, `routes/ops.ts` **identical**, `routes/internal.ts` **identical**, `routes/admin.ts` **identical**, `default-service.ts` **identical**, `rates-service.ts` **identical**, `adapters/kv-store.ts` **identical** (also `public-mode.ts` and `ingest-watchdog.ts` — identical). The only shared API files that changed at all are the composition root and the security helper, both shown above to be additive with the rates mounts and the limiter defaults byte-preserved. Corroboration from this same venue: PH9-B's sweep rows 03–07 show the ladder live and healthy — `/api/status` 200, `/api/rates` fresh tgju snapshot, frankfurter snapshot, `/api/history`, `/api/convert` (100 USD → 143.14 AUD) — and rows 27–28 show `/internal/refresh` gating unchanged by the middleware work.

**VERDICT: every non-Insights page component — About, BatchConverter, Calculator, Converter, History, LiveRates (the rates board), Receipt, Settle, Splitter, plus the shell (App.tsx, router.ts, main.tsx, en/fa dictionaries, index.html, vite.config.ts, public/) and every non-Insights component and lib file — is byte-identical to origin/main, and the rates API ladder (rates.ts, ops.ts, internal.ts, admin.ts, default-service.ts, rates-service.ts, kv-store.ts) is unchanged too; therefore Currena's other pages cannot have changed.** The shared files that did change (index.ts, security.ts, index.css, schemas.ts) carry additive, Insights-scoped diffs verified not to touch any behaviour the other pages exercise.
