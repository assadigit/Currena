# STEP3_REPORT.md — the v3 Step 3 report (runbook Phase 8)

Report date: 20 October 2026 (UTC). Branch: `insights-rebuild`, v3 spec
package. Supersedes the v2 edition (in git history). Every claim cites the
file that proves it; tests 1,637 green; `SELF_AUDIT.md` carries the latest
full-suite result.

## 1. Per-ID status (`INSIGHTS_STEP3_SPEC.md`)

| ID | Status | How checked |
|---|---|---|
| S-01..S-08 (Phase 0) | **done** | `CURRENT_STATE_REPORT.md` (rewritten against the v3 package at `568598c`). |
| P-1 What it is / isn't | **done** | The §8 registry fields on all 54 indicators (whatItIs/whatItIsnt from the audited copy; `registry-sync.test.ts` pins presence); the card details render them. |
| P-2 Fail closed | **done** | The builder gates (stale/sanity/kill-switch/blocked/format), A-04 hold-last-good, the visual U-07. |
| P-3 Readings, not instructions | **done** | T-07/T-19 + the copy corpus scan; the gauges display "CNN-style" published numbers as the publisher's own readings only. |
| P-4 Source level gate | **done** | `sources.ts` + the generator's `sourceRisk` block; T-15 (display), T-26 (terms recorded), T-30/T-31 (disabled/L3 never requested). |
| P-5 FRED copyright check | **done** | T-16 + `data/fred-copyright.json` (8 citation-required, 14 public-domain; unscanned fails closed). |
| P-6 Attribution | **done** | Per-card meta row (UI-20), About table, the export columns; T-17. |
| P-7 Australia first | **done** | The chains in §7 (below) render with Australian links; the AUD view (L2-03) beside the US-shares notes. |
| L1-01..L1-05 (RBA/ABS/I2) | **done** | Live cards; I2's third-party notes recorded for the quarterly review (L1-05's "Use after checking" is the standing MAINTENANCE item). |
| L1-06 ASX Rate Tracker | **link out** | FS-02 discovery: the ASX Terms of use prohibit spiders/scrapers AND redistribution (quoted verbatim in RISK_REGISTER.md) → **L3**. The L2-09 card links to the public tracker page; Currena never fetches it. |
| L1-07 Westpac-MI | **manual entry (built), disabled** | M5 per FS-03: the manual-entry mechanism + MAINTENANCE steps exist; no values entered (never invented); owner_accepts = no. |
| L1-08 NAB | **link out** | Not verified (the spec's own status); no card, no fetch. |
| L1-10 VIX | **done (L2)** | Live; © Cboe via FRED, private/hidden publicly per the T-15 walk; owner acceptance recorded. |
| L1-11 NY Fed recession probability | **link out** | The methodology page is JS-walled to plain fetches — the probit coefficients cannot be quoted, so the probability is never computed (do-not-invent rule). The Sahm rule (L1-12) carries the recession slot; the T10Y3M scan record is ready if the owner pastes the formula from a rendered read. |
| L1-12 Sahm rule | **done** | Live (SAHMREALTIME, copyright scanned). |
| L1-13 stress/conditions | **done** | STLFSI4 + NFCI live. |
| L1-14 Shiller CAPE/ECY | **built, disabled (T-30)** | The FS-06 pipeline: `scripts/shiller-fetch.ts` (verified live against the provider's own file: CAPE 40.71, ECY 0.56% for 2026-10; archived `data/shiller/shiller-cape.json` + monthly copy), the monthly `shiller-fetch.yml` Action, two context cards (shiller-cape/shiller-ecy) with full bilingual copy; the register row is L2 with `owner_accepts: no` → the cards are hidden and the ingest does not read the file until the owner flips RISK_REGISTER.md. |
| L1-15 CME FedWatch | **link out** | Paid API declined by the owner (D-3); the L2-08 proxy carries the slot. |
| L1-16 BLS CPI/jobs | **done** | NSA year-on-year basis (E-14). |
| L1-17 activity survey | **done** | Philly Fed live (copyright scanned). |
| L1-18 crypto F&G | **done (L0)** | The publisher's own reading, attribution beside the data (F-19..F-22 pattern). |
| L1-19 CNN F&G | **L3 — link out** | FS-01 discovery: the reported JSON endpoint answered **HTTP 418 "I'm a teapot. You're a bot."** to one honest request with the declared UA → blocked → never fetched (RULES 4.3; an owner override cannot cover circumvention). robots.txt also disallows /terms, so the licence could not be read honestly. |
| L2-01..L2-09 | **done** | The four-band stock states (U-11), 200-day average, AUD conversion (T-21), highest-since (T-22), same-date spreads (T-20), real savings return, T-01 reconciliation, the midpoint gap, the RBA gap (with the ASX link). |
| L2-10 valuation context | **built, disabled** | Rides the Shiller cards; the "valuation says little about the next few months" line is in the card copy; enabled the moment the owner accepts. |
| L3-01 hero words | **done** | UI-01..09 per `UI_SPEC.md`; the visible rule behind the control; "Summary of the gauges below". |
| L3-02 relationship cards | **done** | UI-33..38: neutral "N of M readings match the usual pattern", per-leg markers, "Trigger not present", pass-through pending, weaker-link tag (U-08). |
| L3-03 no composite scores | **done** | No self-made scores; the published gauges only. |
| L3-04 context notes | **done** | Off by default, dated, expire (A-06). |
| R-01..R-05 | **done** | Trigger gating + windows + pass-through in `connections.ts` (T-35 fixtures); the dollar context leg; weaker links labelled. |
| §7 coverage chains | **done** | Oil→petrol(ABS fuel CPI)→CPI→cash rate; USD→AUD (AUD view); China/commodities→AUD; rates→household (real return line); US shares (states + AUD + VIX + valuation context (disabled) + highest-since + proxies); calendar (7 kinds, decision days, own time zones). AIP weekly petrol: no legal feed confirmed (link out; ABS fuel CPI carries it). |
| §7.1 US-shares box | **done** | Collapsed; only the two approved lines (no `approved-text/` folder exists). |
| §8 registry additions | **done** | All fields on all 54 indicators (see FIX_REPORT §3). |
| §9 tests T-15..T-24, T-35 | **done** | See `baseline-test-results.md` (v3 section) for the per-test map and where each lives. |
| §11 owner routine | **done** | MAINTENANCE.md (v3 edition). |

## 2. The licence table (the date each term was checked)

See `LICENCES.md` (the full v3 register with quoted lines) and
`RISK_REGISTER.md` (levels + the owner's recorded acceptances + the fresh
2026-10-20 read attempts with venue blocks recorded). Summary:

| Source | Level | Checked | Public display |
|---|---|---|---|
| RBA | L0 | 2026-10-20 (venue-403 recorded) | yes |
| ABS | L0 | 2026-10-20 (JS-walled; CC nav item observed) | yes |
| FRED public-domain series | L0 | 2026-10-16 (scan) | yes |
| FRED citation-required (© Cboe) | L2 | 2026-10-16 | no (T-15) |
| gold-api | L0 | 2026-10-16 (§9 quoted) + endpoint re-verified 2026-10-20 | yes |
| Alternative.me | L0 | 2026-10-16 | yes |
| EODHD | L2 | 2026-10-16 | no |
| Yahoo (unofficial) | L2 | 2026-10-16 (+ honest-UA 200 verified 2026-10-20) | no (owner-directive tiles only) |
| Frankfurter/ECB | L1 | 2026-10-20 (the ECB disclaimer quoted verbatim; reuse clause unquoted) | unknown → no |
| ECB Data Portal | L1 | 2026-10-20 | unknown → no |
| World Bank | L1 | 2026-10-20 (terms URL 404; catalogue bot-checked — recorded) | unknown → no |
| Bitstamp | L1 | 2026-10-16 | unknown → no |
| China NBS (manual) | L1 | 2026-10-16 | no |
| Shiller | L2 | 2026-10-16 (+ file verified live 2026-10-20) | no — disabled until the owner accepts |
| CNN | **L3** | 2026-10-20 (blocked) | never |
| ASX | **L3** | 2026-10-20 (terms prohibit, quoted) | never |
| Westpac-MI | L2 | 2026-10-16 | no — manual entry, disabled |
| NAB / AIP | L2 pending | not verified | no card |

## 3. Items left as "Link out" or "Not verified" — what would unblock them

- **NY Fed recession probability (L1-11):** a rendered read of the
  methodology page (the owner can paste the probit formula from
  https://www.newyorkfed.org/research/capital_markets/ycfaq); then the card
  builds from the already-scanned T10Y3M with the formula quoted.
- **CNN F&G (L1-19):** only a CNN-provided documented API could unblock it;
  the current endpoint blocks the honest identity and the terms page is
  robots-disallowed. An owner override cannot cover circumvention.
- **ASX Rate Tracker (L1-06):** written permission from ASX (their terms
  name prior written consent) or an official feed. Until then: link out.
- **NAB / AIP petrol:** a legal machine feed or manual entry once terms are
  read. AIP: the site is JS-rendered; no feed found.
- **ABS/ECB/World Bank/Frankfurter public display:** a rendered browser read
  of the licence pages to quote the reuse clauses verbatim (the quarterly
  MAINTENANCE step).

## 4. Fetched sources (`SCRAPING_SPEC.md` §11)

| Card | Terms lines quoted | robots.txt | Level | Method found | Runtime | Blocked | Enabled | The owner's unblock step |
|---|---|---|---|---|---|---|---|---|
| FS-01 CNN F&G | terms not readable (robots.txt disallows /terms; recorded) | read: no disallow on the page path; /terms disallowed | L3 | none — the dataviz endpoint answered HTTP 418 "teapot" to the honest UA | — | **yes** | never | none possible (no circumvention); only a future documented API |
| FS-02 ASX Tracker | "use any spider, screen scraper, robot… including monitoring, downloading or copying" + redistribution prohibited (verbatim) | read: no disallow on the tracker path | L3 | none (terms prohibit) | — | no (never attempted) | never | written permission from ASX |
| FS-03 Westpac-MI | monthly release public; automated-reuse terms unconfirmed | — | L2 | M5 manual entry | manual | no | **no** | set owner_accepts to yes in RISK_REGISTER.md + enter values (F-24..F-27) |
| FS-04 NAB | not verified | — | L2 pending | none | — | no | no | read the terms; manual entry or link stays |
| FS-05 Alternative.me | "…displayed freely when attribution is given right next to the display of the data" | — | L0 | M1 API | GitHub Action | no | **yes** (live) | — |
| FS-06 Shiller | open academic data, attribution expected; no formal reuse terms found; the workbook's own Disclaimer sheet quoted in the register | — | L2 | M2 bulk file (ie_data.xls verified: HTTP 200, 1.6 MB, ETag; live file found via the provider's own home page link — current through 2026-10) | GitHub Action (monthly, 5th 04:35 UTC) | no | **no** | set owner_accepts to yes in RISK_REGISTER.md |
| FS-07 other composites | none identified; nothing added | — | — | — | — | — | — | — |

## 5. Latest test results + budgets

- 1,637 vitest tests green (core 191 · scraper 67 · insights 517 · markets 13
  · api 329 · web 520); the visual suite 19/19 (U-14 the one expected-fail —
  its real-worker wiring is Phase 9); typecheck 6/6; lint 0 errors;
  copy:audit clean; `SELF_AUDIT.md`: all rows pass.
- Bundle budgets: entry unchanged; the Insights lazy chunk grew with the v3
  UI (dated justifications in `scripts/check-bundle-budget.mjs`).

## 6. KV reads, KV writes and outside requests per full refresh

Measured (the ingest's own ops counter + the 2026-10-19 records), unchanged
in shape by the v3 work (the new endpoints add no scheduled load; the
Shiller Action is monthly and writes no KV):

- **KV reads: 55** per full refresh (seed reads + write-gate comparisons).
- **KV writes: 31–33** (snapshot, status, the two archives, the public
  projection, per-series histories only-if-changed; the markets/fx content
  hashes gate their own writes).
- **Outside requests: 49** per full refresh (16 FRED series + RBA tables
  [F2 now fetched once for both series — T-32] + ABS + ECB + Frankfurter +
  World Bank + gold-api ×4 + Yahoo ×4 + Bitstamp + Alternative.me + the
  WB page probe) — inside the free tier with headroom. The RBA F2 memo
  (2026-10-20) removed one duplicate download per refresh.
