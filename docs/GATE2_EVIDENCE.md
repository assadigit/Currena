# GATE 2 — TGJU reachability evidence & routing decision

> Collected 2026-09-16 (Phase 2 spike). **Decision required from the owner:**
> **Path A** (Worker scrapes TGJU directly) vs **Path B** (GitHub Actions relay).
> Evidence artifacts: `docs/evidence/phase2-worker-battery.json`,
> `docs/evidence/phase2-gha-probe.log`.

## TL;DR

**Workers egress to TGJU works.** A deployed Worker fetched the TGJU profile pages
(HTTP 200, real 1.1–1.4 MB HTML) and the `call1.tgju.org/ajax.json` rates feed
(valid JSON) — from **two different Cloudflare colos** (HKG, ATL). A GitHub Actions
runner reproduced the same results. **Recommendation: Path A** — direct scrape from
the Worker, exactly as the mission §5/§6 ladder assumes. Path B remains a documented
fallback if TGJU ever starts blocking Workers egress IPs.

## Methodology

- Temporary diagnostic worker `apps/probe` (deployed as
  `currena-probe.sedanama-ir.workers.dev` — allowlisted fetcher, no secrets, no
  bindings; deleted after this gate).
- The **same 5-URL battery** from three vantage points:
  1. deployed Worker, invoked from the dev sandbox → served by **HKG** colo
  2. deployed Worker, invoked by the GH Actions runner → served by **ATL** colo
  3. the GitHub Actions runner itself (the Plan B egress path) —
     `.github/workflows/tgju-probe.yml`, run 35135325175, conclusion: success
- Desktop Chrome User-Agent + browser Accept headers; redirects followed;
  10–20 s timeouts; HTML checked for symbol marker + size, JSON parsed strictly.

## Results

### 1. Deployed Worker → targets (HKG colo, 2026-09-16T18:33Z)

| Target | HTTP | ms | bytes | check |
|---|---|---|---|---|
| `www.tgju.org/profile/price_dollar_rl` | **200** | 74 | 1,384,423 | html-ok |
| `www.tgju.org/profile/price_eur` | **200** | 284 | 1,121,760 | html-ok |
| `api.tgju.org/v1/market/indicator/summary` | 404 | 276 | 6,720 | json-fail — dead endpoint |
| `call1.tgju.org/ajax.json` | **200** | 46 | 165,742 | json-ok |
| `api.frankfurter.dev/v1/latest?base=USD&symbols=EUR` (control) | **200** | 442 | 71 | json-ok |

Raw JSON: `docs/evidence/phase2-worker-battery.json`

### 2. Deployed Worker → targets (ATL colo, via GH runner, ~18:36Z)

Identical to HKG: both profiles `html-ok`, `ajax.json` `json-ok`, Frankfurter
`json-ok`, `api.tgju.org` summary 404/`json-fail`. (Transcript inside
`docs/evidence/phase2-gha-probe.log`, cross-check step.)

### 3. GitHub Actions runner → targets (2026-09-16, run 35135325175)

| Target | HTTP | ms | bytes |
|---|---|---|---|
| `price_dollar_rl` | **200** | 412 | 1,466,844 |
| `price_eur` | **200** | 219 | 1,204,013 |
| `api.tgju.org` summary | 404 | 449 | 7,081 |
| `call1.tgju.org/ajax.json` | **200** | 307 | 178,422 |
| Frankfurter (control) | **200** | 225 | 71 |

## Findings

1. **TGJU profile pages are reachable from Workers** — the exact profile-URL shape
   the legacy app uses for all 16 currencies (FEATURE_MAP §4) is scrapeable from a
   deployed Worker, from at least two colos.
2. **`call1.tgju.org/ajax.json`** is a compact (166–178 KB) valid-JSON feed covering
   all symbols — a possible lighter alternative to scraping 16 profile pages
   (~1.4 MB each). It contains Persian digits (`"t":"۷ تیر"`), confirming the
   Phase 3 normalizer must handle ۰–۹ + Arabic-Indic variants. Final choice
   happens in Phase 4 against fixtures.
3. **`api.tgju.org/v1/market/indicator/summary` is dead (404)** from every vantage
   point — not a block; the endpoint no longer exists.
4. **One transient Cloudflare `error 1042`** (bad-gateway) hit the very first
   battery invocation and succeeded on immediate retry → the Phase 4 scraper must
   include 1–2 quick retries as part of the §6 ladder.
5. Latency 46–452 ms across all targets — comfortably inside the mission's 4 s
   blocking-scrape budget.

## The decision

### Path A — Worker scrapes TGJU directly (**recommended**)

- Matches the mission §5/§6 ladder verbatim: on-demand scrape → KV cache →
  stale banner → 503. No second platform, no extra secrets, on-demand refresh
  possible.
- Risk: TGJU could someday block Cloudflare Workers egress IPs. Mitigations: the
  ladder already degrades gracefully (cached + stale banner); retry-on-1044/1042;
  if a block ever becomes permanent, Path B can be adopted then — it is additive
  (a scheduled workflow writing into KV), not a rewrite.

### Path B — GitHub Actions relay

- A scheduled GH workflow scrapes TGJU → writes the snapshot into Workers KV via
  the Cloudflare API (CF token stored as a GH secret); the Worker only reads KV
  and never talks to TGJU.
- Pros: egress from GitHub runner IPs (not Cloudflare); immune to any
  TGJU-vs-Workers IP policy.
- Cons: staleness bounded by cron granularity (≥ 5 min; realistically 10–15 min
  for 16 profiles within API rate limits); a second platform + secret to operate;
  no on-demand refresh (scheduled only); more moving parts to monitor.

## After the decision

Whichever path is chosen: `apps/probe` and `.github/workflows/tgju-probe.yml` are
**deleted** (temporary diagnostics), the `currena-probe` Worker is removed from
Cloudflare, and Phase 3 (packages/core) begins.
