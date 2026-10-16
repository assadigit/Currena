# STEP3_REPORT.md — the Step 3 report (AGENT_RUNBOOK Phase 6)

Report date: 16 October 2026 (UTC). Branch: `insights-rebuild`.
This report follows `INSIGHTS_STEP3_SPEC.md` §10.

## 1. Every checklist ID — done, partly done or not done

### §1 Phase 0 (S-01…S-08) — **done**
`CURRENT_STATE_REPORT.md` (commit e736c74): the inventory, hosting/limits,
test-suite and access findings, each with file:line evidence.

### §2 Access and licence policy
| ID | Status | How checked |
|---|---|---|
| AC-01 gate choice | **done** | Cloudflare Access is not part of the owner's free setup → the Worker fallback: `INSIGHTS_PASSWORD` secret + HMAC-signed 12h expiring cookie (`apps/api/src/insights-auth.ts`), rate-limited login (the /admin bucket). |
| AC-02 gate the data | **done** | ONE `requireInsightsAuth()` middleware wraps the whole insights sub-app — snapshot, markets, fx, status, archive, history, live prices. T-24 tests: every endpoint 401s unauthenticated with no data. |
| AC-03 neutral private state | **done** | The 401 envelope is `{code:'private_page', message:'Private page'}` — zero values/sources/hints; the page flips to the neutral Private screen with the sign-in form. |
| AC-04 no keys in the browser | **done** | The password only ever compares server-side; the cookie carries only the signed expiry. Phase 7 re-scans the built client bundle. |
| AC-05 cache safety | **done** | Authed responses carry `Cache-Control: private, no-store`; refusals are `no-store` too. |
| AC-06 search engines | **done** | `X-Robots-Tag: noindex, nofollow` on every gated response + robots.txt `Disallow: /api/insights` (+ /admin already excluded). |
| AC-07 owner only | **done** | One password, one cookie; no user registry. |
| AC-08 SITE_MODE | **done** | Wrangler var `SITE_MODE: 'private'` (default); 'public' skips the gate and the build then enforces T-15. |
| LR-01 LICENCES.md | **done** | `docs/insights/LICENCES.md`, generated from the live register (licence, exact attribution, private/public verdicts, checked date, evidence trail). |
| LR-02 Yahoo flagged | **done** | Every Yahoo-sourced card is private-only via the upstream-legs walk; never shown in public mode (T-15). |
| LR-03 private_ok/public_display_ok | **done** | Every source + every indicator carries both (licences.ts + the registry's licence blocks + the audit sidecar). |
| LR-04 attribution | **done** | Cards' details name the source; About-this-data lists every source; the export carries a Licence column; T-17 checks the exact attribution text. |

### §3 Principles
| ID | Status | Evidence |
|---|---|---|
| P-1 what it is / isn't | **done** | Every indicator card carries whatItIs/whyItMatters/tendedToMean/cantTell (en+fa); the details panel shows publisher + link. |
| P-2 fail closed | **done** | Stale/flagged/unverified → stale tag or 'can't tell'; the E-08 expiry and the E-04 freeze both fail closed; unavailable never renders a verdict. |
| P-3 readings not instructions | **done** | L3-02 retired the verdict words; T-19 scans the generated corpus for advice wording. |
| P-4 licence gate | **done** | Every source carries licence_name, attribution_text, private_ok, public_display_ok, terms_checked_on (+ permission_ref implied: none needed — recorded in LICENCES.md). |
| P-5 FRED copyright scan | **done** | `data/fred-copyright.json` (22 series, checked 2026-10-16); citation-required series are public 'no' (T-16). |
| P-6 attribution | **done** | T-17 + LR-04 above. |
| P-7 Australia first | **done** | The oil→petrol→CPI→cash-rate, dollar→AUD→US-shares-in-AUD, China→iron-ore→ToT chains render with the AU links (the connections + coverage sections). |

### §4 Layer 1 (published indicators)
| ID | Status | Note |
|---|---|---|
| L1-01..L1-04 (RBA/ABS core) | **done** | Present and verified since Steps 1-2 (current-state report S-04). |
| L1-05 RBA I2 commodity index | **check (open)** | Third-party content inside the RBA table needs per-table source notes; not loaded this session — recorded for the quarterly review. |
| L1-06 ASX RBA Rate Tracker | **link out (recorded)** | No free feed/reuse terms; the rba-expectations card's details link the ASX Rate Tracker page (L2-09's link). |
| L1-07 Westpac-MI sentiment | **link out (recorded)** | No free reuse terms; not rendered — listed here and in MAINTENANCE for a manual check. |
| L1-08 NAB survey | **not verified** | Spec says research later; left out. |
| L1-10 VIX | **done** | Present, FRED VIXCLS, private-only (copyright series), © Cboe attribution. |
| L1-11 NY Fed recession probability | **check (open)** | The spec forbids inventing the published coefficients; they were not verified from the NY Fed's own page this session, so the card does not exist. The existing yield-curve alarm card covers the same input (T10Y3M family) without a reproduced formula. What unblocks: fetch the NY Fed's published methodology and reproduce it exactly. |
| L1-12 Sahm rule | **done** | Present (FRED SAHMREALTIME). |
| L1-13 stress + NFCI | **done** | Present (STLFSI4, NFCI). |
| L1-14 Shiller CAPE | **not verified** | The ie_data.xls monthly pipeline (download → JSON conversion → archive) was not built this session; L2-10 therefore absent. What unblocks: the monthly Shiller job (spec §4.2 L1-14's own fallback design) + a permissions note. |
| L1-15 CME FedWatch | **link out (recorded)** | Paid API declined (D-3); the free proxy L2-08 renders; the card copy points at the market's own pricing. |
| L1-16 US CPI/jobs | **done** | Present (BLS via FRED, NSA basis per E-14). |
| L1-17 Philly Fed | **done** | Present (C-05). |
| L1-18 crypto Fear & Greed | **done** | Alternative.me API verified live (2026-10-16); context-only card with attribution. |

### §5 Layer 2
| ID | Status | Note |
|---|---|---|
| L2-01 stock states | **done** | Near its high / Pullback / Correction / Bear market (E-22). |
| L2-02 200-day average | **done** | ma200GapPct computed from ≥200 closes; tiles + export line. |
| L2-03 US shares in AUD | **done** | usSharesInAud — same-date arithmetic, refused on date mismatch (T-21). |
| L2-04 highest since | **done** | B-19's episode-aware year (us10y/us30y/real-10y/au-10y). |
| L2-05 spreads | **done** | Same-date joins (B-10); the AU/US gap + 10y2y + 3y−cash. |
| L2-06 real savings return | **done** | B-18's term-deposit minus inflation, before tax. |
| L2-07 reconciliation | **done** | T-01 on T10YIE. |
| L2-08 Fed proxy | **done** | Midpoint basis (E-15). |
| L2-09 RBA proxy | **done** | Present since C-06; the ASX Rate Tracker link recorded. |
| L2-10 CAPE context | **not done** | Follows L1-14 (above). |

### §6 Layer 3
| ID | Status | Note |
|---|---|---|
| L3-01 hero label | **done** | "Summary of the gauges below". |
| L3-02 relationship cards | **done** | Verdict words retired; trigger-leg rule (E-19); windows documented (E-20). |
| L3-03 no composites | **done (respected)** | VIX, stress, NFCI and the FNG index all render as their own published readings. |
| L3-04 context notes | **done** | A-06 machinery (off by default, dated, expiring). |

### §7 Coverage + the box
- The chains (oil, dollar, China, rates, US shares, calendar) render — evidence: the page sections + the connections.
- "Know before you buy US shares": **done (minimal form)** — only the exchange-rate and fees lines + the general-information line; `docs/insights/approved-text/` does not exist, so nothing more ships (spec's own rule).

### §8 registry additions — **done** (layer + licence block on all 52 entries; T-16 scan; audit sidecar)

### §9 tests
| ID | Status |
|---|---|
| T-15 mode gate | **done** — check-site-mode.mjs (verified: 25 public-mode failures today; private no-op) + t15ModeGate unit tests. |
| T-16 FRED scan | **done** — scan script + records + licence resolution. |
| T-17 attribution | **done** — unit tests + the daily self-check. |
| T-18 fail closed | **done** — unit tests (forced stale → 'can't tell'). |
| T-19 advice wording | **done** — the corpus scan (refined matcher, named masks). |
| T-20 same-date spreads | **done** — unit tests + the AUD view's dates-differ. |
| T-21 AUD conversion | **done** — us-shares-aud tests. |
| T-22 highest since | **done** — baseline + unit coverage. |
| T-23 Layer 2 regression | **done** — validation-step3 tests. |
| T-24 access | **done** — insights-auth.test.ts (6 tests). |

### §10/§11 — this report + MAINTENANCE.md **done**.

## 2. Source licence table (the checked terms)

See `docs/insights/LICENCES.md` — generated from the live register; every
row carries the licence name, the exact attribution text, private/public
verdicts, the checked date (2026-10-16) and the evidence trail.

## 3. Left as Link out / Not verified (what unblocks each)
- L1-05 (RBA I2): read the table's source notes for third-party content.
- L1-06/L1-07/L1-15: link-outs need nothing further (recorded).
- L1-08: owner research.
- L1-11: fetch + reproduce the NY Fed's published coefficients exactly.
- L1-14/L2-10: the monthly Shiller download-and-convert job.

## 4. Latest test results
`docs/insights/SELF_AUDIT.md` — 19/19 pass (self-check 2026-10-16); the
branch's CI-relevant totals: 1,389 tests across 6 packages, all green.

## 5. KV reads, KV writes and outside requests per full refresh
Unchanged from the measured budget (CURRENT_STATE_REPORT S-05): ~55 KV
reads, ≤31 KV writes, ~49 outside requests per ingest run — inside the free
tier (100k reads/day, 1k writes/day, 50 subrequests/invocation). The
self-check adds ZERO KV ops (it writes nothing). The gate adds zero per
refresh (it is request-time only).

## 6. How to review the branch and deploy after approval
See `OWNER_SETUP.md` (exact commands).

## 7. Full-export instructions (for the next audit)
1. Sign in to the private page (the Insights password).
2. Open the Tools menu → expand "Show hidden indicators", "Show full table"
   and the full calendar.
3. Header → "Download data" → Markdown (.md) — `currena-insights-full-<date>.md`.
   (The CLI equivalent: `pnpm --filter @currena/insights selfcheck` writes
   the same document to docs/insights/exports/ — markets/fx sections
   omitted there; the page export carries them.)
